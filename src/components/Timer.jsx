import { getModeColors } from '../utils/modeColors'

export function Timer({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  completedPomodoros,
  activeTask,
  onModeSwitch,
  onToggleTimer,
  onReset,
  isDarkMode
}) {
  const colors = getModeColors(mode)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress for circular indicator
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0
  const circumference = 2 * Math.PI * 140 // radius = 140
  const strokeDashoffset = circumference * (1 - progress)

  const getModeStyles = (modeType, isActive) => {
    if (isActive) {
      const c = getModeColors(modeType)
      return `bg-gradient-to-r ${c.gradient} text-white shadow-lg ${c.shadow}`
    }
    return isDarkMode
      ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
  }

  return (
    <div className="flex flex-col items-center">
      {/* Mode Selection - Pill style */}
      <div className={`inline-flex rounded-full p-1 mb-8 ${
        isDarkMode ? 'bg-gray-800/50' : 'bg-black/20'
      }`}>
        <button
          onClick={() => onModeSwitch('pomodoro')}
          className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-300 ${getModeStyles('pomodoro', mode === 'pomodoro')}`}
        >
          Focus
        </button>
        <button
          onClick={() => onModeSwitch('shortBreak')}
          className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-300 ${getModeStyles('shortBreak', mode === 'shortBreak')}`}
        >
          Short Break
        </button>
        <button
          onClick={() => onModeSwitch('longBreak')}
          className={`py-2 px-5 rounded-full text-sm font-medium transition-all duration-300 ${getModeStyles('longBreak', mode === 'longBreak')}`}
        >
          Long Break
        </button>
      </div>

      {/* Circular Timer */}
      <div className="relative mb-8">
        <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            stroke={isDarkMode ? '#1f2937' : 'rgba(255,255,255,0.2)'}
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stops[0]} />
              <stop offset="50%" stopColor={colors.stops[1]} />
              <stop offset="100%" stopColor={colors.stops[2]} />
            </linearGradient>
          </defs>
        </svg>

        {/* Timer text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-light text-white tracking-wider">
            {formatTime(timeLeft)}
          </span>
          <span className={`text-sm mt-2 uppercase tracking-widest ${
            isDarkMode ? 'text-gray-500' : 'text-white/50'
          }`}>
            {mode === 'pomodoro' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </span>
        </div>
      </div>

      {/* Active Task Display */}
      {activeTask && (
        <div className={`mb-6 px-4 py-2 rounded-full ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-black/20'
        }`}>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-white/70'}`}>
            Working on:
          </span>
          <span className="text-white ml-1 font-medium">{activeTask.title}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {isRunning && (
          <button
            onClick={onReset}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        <button
          onClick={onToggleTimer}
          className={`w-20 h-20 rounded-full bg-gradient-to-r ${colors.gradientVia} text-white font-semibold shadow-xl ${colors.shadow} transition-all duration-300 hover:scale-105 flex items-center justify-center`}
        >
          {isRunning ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {isRunning && (
          <button
            onClick={onToggleTimer}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 pointer-events-none`}
          >
            {/* Placeholder for symmetry */}
          </button>
        )}
      </div>

      {/* Session Progress */}
      <div className="mt-8 flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < (completedPomodoros % 4)
                ? `bg-gradient-to-r ${colors.gradient}`
                : isDarkMode
                  ? 'bg-gray-700'
                  : 'bg-white/20'
            }`}
          />
        ))}
        <span className={`ml-3 text-sm ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
          {completedPomodoros} sessions completed
        </span>
      </div>
    </div>
  )
}
