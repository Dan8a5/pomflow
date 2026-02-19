const MODE_COLORS = {
  pomodoro: {
    gradient: 'from-violet-500 to-purple-500',
    gradientVia: 'from-violet-500 via-purple-500 to-fuchsia-500',
    shadow: 'shadow-violet-500/30',
    shadowHover: 'shadow-violet-500/50',
    ring: 'ring-violet-500/50',
    bgActive: 'from-violet-500/20 to-purple-500/20',
    bgLight: 'from-violet-600 via-purple-600 to-fuchsia-600',
    stops: ['#8b5cf6', '#a855f7', '#d946ef'],
  },
  shortBreak: {
    gradient: 'from-teal-500 to-cyan-500',
    gradientVia: 'from-teal-500 via-cyan-500 to-sky-500',
    shadow: 'shadow-teal-500/30',
    shadowHover: 'shadow-teal-500/50',
    ring: 'ring-teal-500/50',
    bgActive: 'from-teal-500/20 to-cyan-500/20',
    bgLight: 'from-teal-600 via-cyan-600 to-sky-600',
    stops: ['#14b8a6', '#06b6d4', '#0ea5e9'],
  },
  longBreak: {
    gradient: 'from-indigo-500 to-blue-500',
    gradientVia: 'from-indigo-500 via-blue-500 to-sky-500',
    shadow: 'shadow-indigo-500/30',
    shadowHover: 'shadow-indigo-500/50',
    ring: 'ring-indigo-500/50',
    bgActive: 'from-indigo-500/20 to-blue-500/20',
    bgLight: 'from-indigo-600 via-blue-600 to-sky-600',
    stops: ['#6366f1', '#3b82f6', '#0ea5e9'],
  },
}

export function getModeColors(mode) {
  return MODE_COLORS[mode] || MODE_COLORS.pomodoro
}
