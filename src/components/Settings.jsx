import { useState } from 'react'
import { playAlarm } from '../utils/sounds'

export function Settings({ settings, onSave, onClose, isDarkMode }) {
  const [localSettings, setLocalSettings] = useState({ ...settings })

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const testSound = () => {
    playAlarm(localSettings.alarmSound, localSettings.alarmVolume)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Durations */}
          <div>
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timer (minutes)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'pomodoro', label: 'Focus' },
                { key: 'shortBreak', label: 'Short' },
                { key: 'longBreak', label: 'Long' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-white/70'}`}>
                    {label}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={localSettings[key]}
                    onChange={(e) => handleChange(key, parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 rounded-xl border-0 text-center font-medium ${
                      isDarkMode
                        ? 'bg-gray-800 text-white'
                        : 'bg-white/20 text-white'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Auto-start Options */}
          <div>
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Auto Start
            </h3>
            <div className="space-y-3">
              {[
                { key: 'autoStartBreaks', label: 'Auto-start breaks' },
                { key: 'autoStartPomodoros', label: 'Auto-start focus sessions' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={localSettings[key]}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      localSettings[key]
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : isDarkMode ? 'bg-gray-700' : 'bg-white/20'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        localSettings[key] ? 'translate-x-5' : ''
                      }`} />
                    </div>
                  </div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-white'}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Long Break Interval */}
          <div>
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Long Break After
            </h3>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => handleChange('longBreakInterval', num)}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all duration-200 ${
                    localSettings.longBreakInterval === num
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-400 hover:text-white'
                        : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
              sessions before long break
            </p>
          </div>

          {/* Alarm Sound */}
          <div>
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Alarm Sound
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: 'digital', label: 'Digital', icon: '🔔' },
                { key: 'bell', label: 'Bell', icon: '🔕' },
                { key: 'bird', label: 'Bird', icon: '🐦' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => handleChange('alarmSound', key)}
                  className={`py-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                    localSettings.alarmSound === key
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-400 hover:text-white'
                        : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={testSound}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:text-white'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              Test Sound
            </button>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={isDarkMode ? 'text-gray-300' : 'text-white'}>Volume</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-white'}`}>
                {Math.round(localSettings.alarmVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.alarmVolume}
              onChange={(e) => handleChange('alarmVolume', parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${localSettings.alarmVolume * 100}%, ${isDarkMode ? '#374151' : 'rgba(255,255,255,0.2)'} ${localSettings.alarmVolume * 100}%)`
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:text-white'
                : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
