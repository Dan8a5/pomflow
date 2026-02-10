const audioContextRef = { current: null }

function getAudioContext() {
  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContextRef.current
}

export function playDigitalAlarm(volume = 0.5) {
  const audioContext = getAudioContext()
  const frequencies = [800, 1000, 1200]

  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }, index * 600)
  })
}

export function playBellAlarm(volume = 0.5) {
  const audioContext = getAudioContext()
  const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6

  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
      oscillator.type = 'triangle'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume * 0.6, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    }, index * 300)
  })
}

export function playBirdAlarm(volume = 0.5) {
  const audioContext = getAudioContext()
  const chirps = [
    { freq: 2000, duration: 0.1 },
    { freq: 2500, duration: 0.08 },
    { freq: 2200, duration: 0.12 },
    { freq: 2800, duration: 0.1 },
    { freq: 2400, duration: 0.15 }
  ]

  let timeOffset = 0
  chirps.forEach((chirp) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(chirp.freq, audioContext.currentTime)
      oscillator.frequency.linearRampToValueAtTime(chirp.freq * 1.2, audioContext.currentTime + chirp.duration / 2)
      oscillator.frequency.linearRampToValueAtTime(chirp.freq * 0.9, audioContext.currentTime + chirp.duration)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, audioContext.currentTime + 0.02)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + chirp.duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + chirp.duration)
    }, timeOffset * 1000)
    timeOffset += chirp.duration + 0.1
  })
}

export function playAlarm(soundType = 'digital', volume = 0.5) {
  switch (soundType) {
    case 'bell':
      playBellAlarm(volume)
      break
    case 'bird':
      playBirdAlarm(volume)
      break
    case 'digital':
    default:
      playDigitalAlarm(volume)
      break
  }
}
