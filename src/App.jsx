import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { Timer } from './components/Timer'
import { TaskList } from './components/TaskList'
import { Settings } from './components/Settings'
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

  // Get active task
  const activeTask = tasks.find(t => t.id === session.activeTaskId) || null
  const modeColors = getModeColors(mode)

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
  }, [mode, session, settings, getModeTime, setSession, setTasks])

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
            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
              {tasks.filter(t => !t.isCompleted).length} remaining
            </span>
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
    </div>
  )
}

export default App
