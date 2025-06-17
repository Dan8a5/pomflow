// Import React hooks - useState for state management, useEffect for side effects
import { useState, useEffect } from 'react'

function App() {
  // State variables to manage the timer
  const [mode, setMode] = useState('pomodoro')        // Current timer mode (pomodoro, shortBreak, longBreak)
  const [timeLeft, setTimeLeft] = useState(25 * 60)   // Time remaining in seconds (starts at 25 minutes)
  const [isRunning, setIsRunning] = useState(false)   // Whether the timer is currently running
  const [isDarkMode, setIsDarkMode] = useState(false) // Whether dark mode is enabled

  // Timer durations in seconds for each mode
  const modes = {
    pomodoro: 25 * 60,      // 25 minutes = 1500 seconds
    shortBreak: 5 * 60,     // 5 minutes = 300 seconds
    longBreak: 15 * 60      // 15 minutes = 900 seconds
  }

  // Function to play alarm sound when timer finishes
  const playAlarm = () => {
    // Create audio context for generating sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Play 3 beeps with different frequencies
    const frequencies = [800, 1000, 1200] // High pitched beeps
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        // Create oscillator (sound generator)
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        // Connect oscillator to gain (volume control) to speakers
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Set sound properties
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.type = 'sine' // Smooth sine wave sound
        
        // Set volume envelope (fade in and out for pleasant sound)
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
        
        // Play the beep for 0.5 seconds
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      }, index * 600) // 600ms between each beep
    })
  }

  // Function to convert seconds into MM:SS format for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)              // Get whole minutes
    const secs = seconds % 60                          // Get remaining seconds
    // padStart ensures we always show 2 digits (e.g., "05" instead of "5")
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Function to handle switching between timer modes
  const switchMode = (newMode) => {
    setMode(newMode)                    // Update the current mode
    setTimeLeft(modes[newMode])         // Set time to the new mode's duration
    setIsRunning(false)                 // Stop the timer when switching modes
  }

  // Function to toggle between light and dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // useEffect hook to handle the countdown timer
  // This runs whenever isRunning or timeLeft changes
  useEffect(() => {
    let interval = null                 // Variable to store the interval ID
    
    // If timer is running AND there's time left, start counting down
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        // Decrease timeLeft by 1 every second (1000ms)
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } 
    // If timer reaches 0, stop it and play alarm
    else if (timeLeft === 0) {
      setIsRunning(false)
      playAlarm() // Play alarm sound when timer finishes
    }

    // Cleanup function - clears the interval when component unmounts or dependencies change
    // This prevents memory leaks
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])  // Dependencies: re-run effect when these values change

  // Function to start or pause the timer
  const toggleTimer = () => {
    setIsRunning(!isRunning)  // Flip the running state (true becomes false, false becomes true)
  }

  // Function to reset the timer back to the current mode's full duration
  const resetTimer = () => {
    setIsRunning(false)         // Stop the timer
    setTimeLeft(modes[mode])    // Reset time to current mode's duration
  }

  return (
    // Main container - full screen height, background changes based on theme, centered content
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Timer card - background changes based on theme, rounded corners, shadow, fixed width */}
      <div className={`rounded-lg shadow-lg p-8 w-96 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header with title and dark mode toggle */}
        <div className="flex justify-between items-center mb-8">
          {/* App title - text color changes based on theme */}
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Pomodoro Timer
          </h1>
          
          {/* Dark mode toggle button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {/* Show sun icon in dark mode, moon icon in light mode */}
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* Timer Display - large monospace font, color changes based on theme */}
        <div className={`text-6xl font-mono text-center mb-8 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {formatTime(timeLeft)}
        </div>

        {/* Mode Selection Buttons */}
        <div className="flex gap-2 mb-8">
          {/* Pomodoro button - red when active, themed gray when inactive */}
          <button 
            onClick={() => switchMode('pomodoro')}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              mode === 'pomodoro' 
                ? 'bg-red-500 text-white' 
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Pomodoro
          </button>
          {/* Short Break button - green when active, themed gray when inactive */}
          <button 
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              mode === 'shortBreak' 
                ? 'bg-green-500 text-white' 
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Short Break
          </button>
          {/* Long Break button - blue when active, themed gray when inactive */}
          <button 
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              mode === 'longBreak' 
                ? 'bg-blue-500 text-white' 
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Long Break
          </button>
        </div>
        {/* Test Alarm Button */}
        <div className="mt-4">
          <button 
            onClick={playAlarm}
            className="w-full py-2 px-4 rounded bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors"
          >
            🔔 Test Alarm
          </button>
        </div>
        {/* Control Buttons */}
        <div className="flex gap-4">
          {/* Start/Pause button - changes text based on timer state */}
          <button 
            onClick={toggleTimer}
            className="flex-1 py-3 px-6 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
          >
            {isRunning ? 'PAUSE' : 'START'}
          </button>
          {/* Reset button - always available */}
          <button 
            onClick={resetTimer}
            className={`flex-1 py-3 px-6 rounded font-semibold transition-colors ${
              isDarkMode 
                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  )
}

// Export the component so it can be imported and used elsewhere
export default App