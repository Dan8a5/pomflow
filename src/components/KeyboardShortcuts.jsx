import { useEffect } from 'react'

const shortcuts = [
  { keys: ['Space'], description: 'Start / Pause timer' },
  { keys: ['R'], description: 'Reset timer' },
  { keys: ['S'], description: 'Skip to next mode' },
  { keys: ['?'], description: 'Show / hide this panel' },
]

function Key({ label }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg text-xs font-mono font-semibold border border-white/20 bg-white/10 text-white shadow-sm">
      {label}
    </kbd>
  )
}

export function KeyboardShortcuts({ onClose, isDarkMode }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-6 w-full max-w-sm ${
          isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
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

        {/* Shortcut rows */}
        <ul className="space-y-3">
          {shortcuts.map(({ keys, description }) => (
            <li key={description} className="flex items-center justify-between gap-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-white/90'}`}>
                {description}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {keys.map((k) => (
                  <Key key={k} label={k} />
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* Footer hint */}
        <p className={`mt-6 text-xs text-center ${isDarkMode ? 'text-gray-600' : 'text-white/40'}`}>
          Shortcuts are disabled while typing in a text field.
        </p>
      </div>
    </div>
  )
}
