import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { Timer } from './components/Timer'
import { TaskList } from './components/TaskList'
import { Settings } from './components/Settings'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { useLocalStorage } from './hooks/useLocalStorage'
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

function App() {
  // Persisted state
  const [settings, setSettings] = useLocalStorage('pomflow-settings', DEFAULT_SETTINGS)
  const [tasks, setTasks] = useLocalStorage('pomflow-tasks', [])
  const [history, setHistory] = useLocalStorage('pomflow-history', [])
  const [session, setSession] = useLocalStorage('pomflow-session', {
    completedPomodoros: 0,
    activeTaskId: null
  })

  // Local state
  const [mode, setMode] = useState('pomodoro')
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('pomflow-darkmode', true) // Default to dark
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Get active task
  const activeTask = tasks.find(t => t.id === session.activeTaskId) || null
  const modeColors = getModeColors(mode)

  // Time budget: total remaining pomodoro time across active tasks
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

  // Today's session history (most recent first)
  const todayStr = new Date().toDateString()
  const todayHistory = history
    .filter(h => new Date(h.timestamp).toDateString() === todayStr)
    .slice()
    .reverse()

  // Get mode durations from settings
  const getModeTime = useCallback((modeType) => {
    switch (modeType) {
      case 'pomodoro': return settings.pomodoro * 60
      case 'shortBreak': return settings.shortBreak * 60
      case 'longBreak': return settings.longBreak * 60
      default: return settings.pomodoro * 60
    }
  }, [settings])

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    playAlarm(settings.alarmSound, settings.alarmVolume)

    // Browser notification
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

      // Update session
      setSession(prev => ({
        ...prev,
        completedPomodoros: newCompletedCount
      }))

      // Update active task's completed pomodoros
      if (session.activeTaskId) {
        setTasks(prev => prev.map(task =>
          task.id === session.activeTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task
        ))
      }

      // Log completed session
      const taskTitle = tasks.find(t => t.id === session.activeTaskId)?.title || null
      setHistory(prev => [...prev, { id: crypto.randomUUID(), timestamp: Date.now(), taskTitle }])

      // Determine next break type
      const shouldTakeLongBreak = newCompletedCount % settings.longBreakInterval === 0
      const nextMode = shouldTakeLongBreak ? 'longBreak' : 'shortBreak'

      setMode(nextMode)
      setTimeLeft(getModeTime(nextMode))

      if (settings.autoStartBreaks) {
        setIsRunning(true)
      }
    } else {
      // Break is over, switch to pomodoro
      setMode('pomodoro')
      setTimeLeft(getModeTime('pomodoro'))

      if (settings.autoStartPomodoros) {
        setIsRunning(true)
      }
    }
  }, [mode, session, settings, getModeTime, setSession, setTasks, tasks, setHistory])

  // Timer effect
  useEffect(() => {
    let interval = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      handleTimerComplete()
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, handleTimerComplete])

  // Update document title with timer
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    const modeStr = mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Break' : 'Long Break'
    document.title = `${timeStr} - ${modeStr} | PomFlow`
  }, [timeLeft, mode])

  // Mode switch handler
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

  // Task handlers
  const handleTaskAdd = (task) => {
    setTasks(prev => [...prev, task])
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (session.activeTaskId === taskId) {
      setSession(prev => ({ ...prev, activeTaskId: null }))
    }
  }

  const handleTaskSelect = (taskId) => {
    setSession(prev => ({
      ...prev,
      activeTaskId: prev.activeTaskId === taskId ? null : taskId
    }))
  }

  // Skip to next mode (no alarm / session counting)
  const skipMode = useCallback(() => {
    if (mode === 'pomodoro') {
      const shouldTakeLongBreak = session.completedPomodoros % settings.longBreakInterval === 0
      handleModeSwitch(shouldTakeLongBreak ? 'longBreak' : 'shortBreak')
    } else {
      handleModeSwitch('pomodoro')
    }
  }, [mode, session.completedPomodoros, settings.longBreakInterval, handleModeSwitch])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
      if (isTyping) return

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        toggleTimer()
      } else if (e.key === 'r' || e.key === 'R') {
        resetTimer()
      } else if (e.key === 's' || e.key === 'S') {
        skipMode()
      } else if (e.key === '?') {
        setShowShortcuts(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleTimer, resetTimer, skipMode])

  // Settings handler
  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings)
    // Update timer if not running
    if (!isRunning) {
      setTimeLeft(newSettings[mode] * 60)
    }
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
        {/* Header */}
        <Header
          onSettingsOpen={() => setShowSettings(true)}
          onShortcutsOpen={() => setShowShortcuts(prev => !prev)}
          onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
          mode={mode}
        />

        {/* Timer Section */}
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

        {/* Tasks Section */}
        <div className={`rounded-2xl p-6 backdrop-blur-sm ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-black/10'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Tasks
            </h2>
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
              onClick={() => setTasks(prev => prev.filter(t => !t.isCompleted))}
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
            onClick={() => setSession({ completedPomodoros: 0, activeTaskId: null })}
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

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcuts
          onClose={() => setShowShortcuts(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

export default App
