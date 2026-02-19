import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { Timer } from './components/Timer'
import { TaskList } from './components/TaskList'
import { Settings } from './components/Settings'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { AuthPage } from './components/AuthPage'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { playAlarm } from './utils/sounds'
import { getModeColors } from './utils/modeColors'

const DEFAULT_SETTINGS = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  alarmSound: 'digital',
  alarmVolume: 0.5
}

// --- Column name mappers ---
const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? '',
  estimatedPomodoros: row.estimated_pomodoros,
  completedPomodoros: row.completed_pomodoros,
  isCompleted: row.is_completed,
})

const mapSettings = (row) => ({
  pomodoro: row.pomodoro,
  shortBreak: row.short_break,
  longBreak: row.long_break,
  autoStartBreaks: row.auto_start_breaks,
  autoStartPomodoros: row.auto_start_pomodoros,
  longBreakInterval: row.long_break_interval,
  alarmSound: row.alarm_sound,
  alarmVolume: row.alarm_volume,
})

const mapHistory = (row) => ({
  id: row.id,
  timestamp: row.timestamp,
  taskTitle: row.task_title,
})

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()

  // Dark mode stays local (device preference)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('pomflow-darkmode', true)

  // Cloud-backed state (populated on login)
  const [tasks, setTasks] = useState([])
  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [session, setSession] = useState({ completedPomodoros: 0, activeTaskId: null })

  // Local UI state
  const [showAuth, setShowAuth] = useState(false)
  const [mode, setMode] = useState('pomodoro')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.pomodoro * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Load all user data when user logs in
  useEffect(() => {
    if (!user) {
      // Clear state on sign out
      setTasks([])
      setHistory([])
      setSettings(DEFAULT_SETTINGS)
      setSession({ completedPomodoros: 0, activeTaskId: null })
      return
    }

    Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('position', { nullsFirst: false }).order('created_at'),
      supabase.from('history').select('*').eq('user_id', user.id).order('timestamp'),
      supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('user_session').select('*').eq('user_id', user.id).single(),
    ]).then(([tasksRes, historyRes, settingsRes, sessionRes]) => {
      if (tasksRes.data) setTasks(tasksRes.data.map(mapTask))
      if (historyRes.data) setHistory(historyRes.data.map(mapHistory))
      if (settingsRes.data) {
        const s = mapSettings(settingsRes.data)
        setSettings(s)
        setTimeLeft(s.pomodoro * 60)
      }
      if (sessionRes.data) {
        setSession({
          completedPomodoros: sessionRes.data.completed_pomodoros,
          activeTaskId: sessionRes.data.active_task_id,
        })
      }
    })
  }, [user?.id])

  // Derived
  const activeTask = tasks.find(t => t.id === session.activeTaskId) || null
  const modeColors = getModeColors(mode)

  // Time budget
  const remainingPomodoros = tasks
    .filter(t => !t.isCompleted)
    .reduce((sum, t) => sum + Math.max(0, t.estimatedPomodoros - t.completedPomodoros), 0)
  const budgetMinutes = remainingPomodoros * settings.pomodoro
  const timeBudget = (() => {
    if (budgetMinutes === 0) return null
    const h = Math.floor(budgetMinutes / 60)
    const m = budgetMinutes % 60
    if (h === 0) return `~${m}min remaining`
    if (m === 0) return `~${h}h remaining`
    return `~${h}h ${m}min remaining`
  })()

  // Today's history
  const todayStr = new Date().toDateString()
  const todayHistory = history
    .filter(h => new Date(h.timestamp).toDateString() === todayStr)
    .slice()
    .reverse()

  // Mode durations
  const getModeTime = useCallback((modeType) => {
    switch (modeType) {
      case 'pomodoro': return settings.pomodoro * 60
      case 'shortBreak': return settings.shortBreak * 60
      case 'longBreak': return settings.longBreak * 60
      default: return settings.pomodoro * 60
    }
  }, [settings])

  // Timer completion
  const handleTimerComplete = useCallback(() => {
    playAlarm(settings.alarmSound, settings.alarmVolume)

    if ('Notification' in window && Notification.permission === 'granted') {
      const message = mode === 'pomodoro'
        ? 'Focus session complete! Time for a break.'
        : mode === 'shortBreak'
          ? "Break's over! Ready to focus?"
          : "Long break's over! Ready to focus?"
      const n = new Notification('PomFlow', { body: message })
      setTimeout(() => n.close(), 5000)
    }

    if (mode === 'pomodoro') {
      const newCompletedCount = session.completedPomodoros + 1

      // Update session count (optimistic + sync)
      setSession(prev => ({ ...prev, completedPomodoros: newCompletedCount }))
      if (user) {
        supabase.from('user_session').upsert({
          user_id: user.id,
          completed_pomodoros: newCompletedCount,
          active_task_id: session.activeTaskId,
        })
      }

      // Update active task's completed pomodoros
      if (session.activeTaskId) {
        setTasks(prev => prev.map(task =>
          task.id === session.activeTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task
        ))
        const task = tasks.find(t => t.id === session.activeTaskId)
        if (user && task) {
          supabase.from('tasks').update({
            completed_pomodoros: task.completedPomodoros + 1,
          }).eq('id', session.activeTaskId)
        }
      }

      // Log history entry
      const taskTitle = tasks.find(t => t.id === session.activeTaskId)?.title || null
      const entry = { id: crypto.randomUUID(), timestamp: Date.now(), taskTitle }
      setHistory(prev => [...prev, entry])
      if (user) {
        supabase.from('history').insert({
          id: entry.id,
          user_id: user.id,
          timestamp: entry.timestamp,
          task_title: entry.taskTitle,
        })
      }

      // Advance mode
      const shouldTakeLongBreak = newCompletedCount % settings.longBreakInterval === 0
      const nextMode = shouldTakeLongBreak ? 'longBreak' : 'shortBreak'
      setMode(nextMode)
      setTimeLeft(getModeTime(nextMode))
      if (settings.autoStartBreaks) setIsRunning(true)
    } else {
      setMode('pomodoro')
      setTimeLeft(getModeTime('pomodoro'))
      if (settings.autoStartPomodoros) setIsRunning(true)
    }
  }, [mode, session, settings, getModeTime, tasks, user])

  // Timer interval
  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      handleTimerComplete()
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, handleTimerComplete])

  // Document title
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    const modeStr = mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Break' : 'Long Break'
    document.title = `${timeStr} - ${modeStr} | PomFlow`
  }, [timeLeft, mode])

  // Mode switch
  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setTimeLeft(getModeTime(newMode))
    setIsRunning(false)
  }

  // Timer controls
  const toggleTimer = () => {
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setIsRunning(!isRunning)
  }
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(getModeTime(mode))
  }

  // Skip mode
  const skipMode = useCallback(() => {
    if (mode === 'pomodoro') {
      const shouldTakeLongBreak = session.completedPomodoros % settings.longBreakInterval === 0
      handleModeSwitch(shouldTakeLongBreak ? 'longBreak' : 'shortBreak')
    } else {
      handleModeSwitch('pomodoro')
    }
  }, [mode, session.completedPomodoros, settings.longBreakInterval])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
      if (isTyping) return
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); toggleTimer() }
      else if (e.key === 'r' || e.key === 'R') resetTimer()
      else if (e.key === 's' || e.key === 'S') skipMode()
      else if (e.key === '?') setShowShortcuts(prev => !prev)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleTimer, resetTimer, skipMode])

  // Task handlers
  const handleTaskAdd = (task) => {
    setTasks(prev => [...prev, task])
    if (user) {
      const position = tasks.filter(t => !t.isCompleted).length
      supabase.from('tasks').insert({
        id: task.id,
        user_id: user.id,
        title: task.title,
        notes: task.notes ?? '',
        estimated_pomodoros: task.estimatedPomodoros,
        completed_pomodoros: task.completedPomodoros,
        is_completed: task.isCompleted,
        position,
      })
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    if (user) {
      supabase.from('tasks').update({
        title: updatedTask.title,
        notes: updatedTask.notes ?? '',
        estimated_pomodoros: updatedTask.estimatedPomodoros,
        completed_pomodoros: updatedTask.completedPomodoros,
        is_completed: updatedTask.isCompleted,
      }).eq('id', updatedTask.id)
    }
  }

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (user) supabase.from('tasks').delete().eq('id', taskId)

    if (session.activeTaskId === taskId) {
      const newSession = { ...session, activeTaskId: null }
      setSession(newSession)
      if (user) {
        supabase.from('user_session').upsert({
          user_id: user.id,
          completed_pomodoros: newSession.completedPomodoros,
          active_task_id: null,
        })
      }
    }
  }

  const handleTaskReorder = (reorderedActiveTasks) => {
    setTasks(prev => [...reorderedActiveTasks, ...prev.filter(t => t.isCompleted)])
    if (user) {
      reorderedActiveTasks.forEach((t, i) => {
        supabase.from('tasks').update({ position: i }).eq('id', t.id)
      })
    }
  }

  const handleTaskSelect = (taskId) => {
    const newActiveId = session.activeTaskId === taskId ? null : taskId
    setSession(prev => ({ ...prev, activeTaskId: newActiveId }))
    if (user) {
      supabase.from('user_session').upsert({
        user_id: user.id,
        completed_pomodoros: session.completedPomodoros,
        active_task_id: newActiveId,
      })
    }
  }

  // Settings handler
  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings)
    if (!isRunning) setTimeLeft(newSettings[mode] * 60)
    if (user) {
      supabase.from('user_settings').upsert({
        user_id: user.id,
        pomodoro: newSettings.pomodoro,
        short_break: newSettings.shortBreak,
        long_break: newSettings.longBreak,
        auto_start_breaks: newSettings.autoStartBreaks,
        auto_start_pomodoros: newSettings.autoStartPomodoros,
        long_break_interval: newSettings.longBreakInterval,
        alarm_sound: newSettings.alarmSound,
        alarm_volume: newSettings.alarmVolume,
      })
    }
  }

  // --- Render ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800'
        : `bg-gradient-to-br ${modeColors.bgLight}`
    }`}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode ? 'bg-emerald-900/20' : 'bg-white/10'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode ? 'bg-teal-900/20' : 'bg-white/10'
        }`} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <Header
          onSettingsOpen={() => setShowSettings(true)}
          onShortcutsOpen={() => setShowShortcuts(prev => !prev)}
          onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
          onSignInOpen={!user ? () => setShowAuth(true) : undefined}
          onSignOut={user ? signOut : undefined}
          userEmail={user?.user_metadata?.full_name?.split(' ')[0] || user?.email}
          isDarkMode={isDarkMode}
          mode={mode}
        />

        <div className="py-8">
          <Timer
            mode={mode}
            timeLeft={timeLeft}
            totalTime={getModeTime(mode)}
            isRunning={isRunning}
            completedPomodoros={session.completedPomodoros}
            activeTask={activeTask}
            onModeSwitch={handleModeSwitch}
            onToggleTimer={toggleTimer}
            onReset={resetTimer}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className={`rounded-2xl p-6 backdrop-blur-sm ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-black/10'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tasks</h2>
            {timeBudget && (
              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
                {timeBudget}
              </span>
            )}
          </div>
          <TaskList
            tasks={tasks}
            activeTaskId={session.activeTaskId}
            mode={mode}
            onTaskSelect={handleTaskSelect}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskReorder={handleTaskReorder}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* History Section */}
        {todayHistory.length > 0 && (
          <div className={`mt-4 rounded-2xl p-6 backdrop-blur-sm ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-black/10'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Today's Sessions</h2>
              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
                {todayHistory.length} completed
              </span>
            </div>
            <ul className="space-y-2">
              {todayHistory.map(entry => (
                <li key={entry.id} className="flex items-center gap-3">
                  <span className={`text-xs font-mono tabular-nums w-16 shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 bg-gradient-to-r ${getModeColors('pomodoro').gradient}`} />
                  {entry.taskTitle ? (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-white/80'}`}>
                      {entry.taskTitle}
                    </span>
                  ) : (
                    <span className={`text-sm italic ${isDarkMode ? 'text-gray-600' : 'text-white/30'}`}>
                      No task
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-4 mt-6">
          {tasks.some(t => t.isCompleted) && (
            <button
              onClick={() => {
                setTasks(prev => prev.filter(t => !t.isCompleted))
                if (user) {
                  supabase.from('tasks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('is_completed', true)
                }
              }}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                isDarkMode
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              Clear completed
            </button>
          )}
          <button
            onClick={() => {
              const reset = { completedPomodoros: 0, activeTaskId: null }
              setSession(reset)
              if (user) {
                supabase.from('user_session').upsert({
                  user_id: user.id,
                  completed_pomodoros: 0,
                  active_task_id: null,
                })
              }
            }}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              isDarkMode
                ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            Reset session
          </button>
        </div>
      </div>

      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcuts
          onClose={() => setShowShortcuts(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {showAuth && (
        <AuthPage
          onSignIn={signIn}
          onSignUp={signUp}
          onClose={() => setShowAuth(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

export default App
