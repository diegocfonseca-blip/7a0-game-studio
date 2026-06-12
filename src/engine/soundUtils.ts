let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function playCrowdRoar(duration = 1.8) {
  try {
    const ac = getCtx()
    if (ac.state === 'suspended') ac.resume()

    // White noise buffer
    const bufSize = ac.sampleRate * duration
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1)

    const src = ac.createBufferSource()
    src.buffer = buf

    // Filter to crowd-like frequencies
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5

    // Gain envelope: ramp up → sustain → fade
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.3)
    gain.gain.setValueAtTime(0.35, ac.currentTime + duration - 0.5)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    src.start()
    src.stop(ac.currentTime + duration)
  } catch (_) { /* no-op if AudioContext blocked */ }
}

export function playWhistle() {
  try {
    const ac = getCtx()
    if (ac.state === 'suspended') ac.resume()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2200, ac.currentTime)
    osc.frequency.linearRampToValueAtTime(2800, ac.currentTime + 0.15)
    gain.gain.setValueAtTime(0.4, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.4)
  } catch (_) { /* no-op */ }
}
