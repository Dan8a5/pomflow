import { useState, useEffect } from 'react'

export function AuthPage({ onSignIn, onSignUp, onClose, isDarkMode }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    if (isSignUp) {
      const { error } = await onSignUp(email, password, name)
      if (error) {
        setError(error.message)
      } else {
        setSuccessMsg('Check your email to confirm your account.')
      }
    } else {
      const { error } = await onSignIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    }

    setLoading(false)
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border-0 text-white text-sm ${
    isDarkMode
      ? 'bg-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500'
      : 'bg-white/20 placeholder-white/50 focus:ring-2 focus:ring-white/50'
  } outline-none transition-all`

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl p-8 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-200 ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h2>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-500' : 'text-white/60'}`}>
          {isSignUp ? 'Start tracking your focus sessions.' : 'Sign in to sync your data across devices.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
              autoFocus
            />
          )}
          <input
            type="email"
            placeholder="Email"
            autoFocus={!isSignUp}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            minLength={6}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successMsg && <p className="text-emerald-400 text-sm">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className={`mt-5 text-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-white/60'}`}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setName(''); setError(''); setSuccessMsg('') }}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
