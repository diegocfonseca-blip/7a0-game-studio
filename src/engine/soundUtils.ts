let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Low crowd murmur — plays continuously when enabled
let murmurNode: AudioBufferSourceNode | null = null
let murmurGain: GainNode | null = null

export function startCrowdMurmur() {
  try {
    const ac = getCtx()
    stopCrowdMurmur()

    const bufSize = ac.sampleRate * 4
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

    const src = ac.createBufferSource()
    src.buffer = buf
    src.loop = true

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.8

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 1.5)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    src.start()

    murmurNode = src
    murmurGain = gain
  } catch (_) { /* no-op */ }
}

export function stopCrowdMurmur() {
  try {
    if (murmurGain) {
      const ac = getCtx()
      murmurGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5)
      setTimeout(() => { try { murmurNode?.stop() } catch (_) {} }, 600)
      murmurNode = null
      murmurGain = null
    }
  } catch (_) { /* no-op */ }
}

// Tension build before goal — crowd gets louder/higher pitch
export function playCrowdTension() {
  try {
    const ac = getCtx()
    const bufSize = ac.sampleRate * 1.5
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

    const src = ac.createBufferSource()
    src.buffer = buf

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(500, ac.currentTime)
    filter.frequency.linearRampToValueAtTime(1200, ac.currentTime + 1.4)
    filter.Q.value = 0.6

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.05, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ac.currentTime + 1.2)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    src.start()
    src.stop(ac.currentTime + 1.5)
  } catch (_) { /* no-op */ }
}

// Big goal roar — explosion + sustain
export function playCrowdRoar(duration = 2.5) {
  try {
    const ac = getCtx()

    // Noise burst (crowd explosion)
    const bufSize = ac.sampleRate * duration
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

    const src = ac.createBufferSource()
    src.buffer = buf

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1200, ac.currentTime)
    filter.frequency.linearRampToValueAtTime(600, ac.currentTime + 0.5)
    filter.Q.value = 0.4

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.55, ac.currentTime + 0.12)
    gain.gain.setValueAtTime(0.45, ac.currentTime + 0.5)
    gain.gain.setValueAtTime(0.35, ac.currentTime + duration - 0.6)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    src.start()
    src.stop(ac.currentTime + duration)

    // Short celebratory horn stab
    const osc = ac.createOscillator()
    const oscGain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, ac.currentTime + 0.05)
    osc.frequency.linearRampToValueAtTime(660, ac.currentTime + 0.2)
    oscGain.gain.setValueAtTime(0, ac.currentTime)
    oscGain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.08)
    oscGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4)
    const hornFilter = ac.createBiquadFilter()
    hornFilter.type = 'lowpass'
    hornFilter.frequency.value = 1200
    osc.connect(hornFilter)
    hornFilter.connect(oscGain)
    oscGain.connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.4)
  } catch (_) { /* no-op */ }
}

// Disappointed crowd — short descending "aww"
export function playCrowdBoo() {
  try {
    const ac = getCtx()
    const bufSize = ac.sampleRate * 1.2
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

    const src = ac.createBufferSource()
    src.buffer = buf

    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, ac.currentTime)
    filter.frequency.linearRampToValueAtTime(300, ac.currentTime + 1.0)
    filter.Q.value = 0.7

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.25, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ac.currentTime + 0.8)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    src.start()
    src.stop(ac.currentTime + 1.2)
  } catch (_) { /* no-op */ }
}

export function playWhistle() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2200, ac.currentTime)
    osc.frequency.linearRampToValueAtTime(2800, ac.currentTime + 0.12)
    osc.frequency.linearRampToValueAtTime(2400, ac.currentTime + 0.35)
    gain.gain.setValueAtTime(0.35, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.45)
  } catch (_) { /* no-op */ }
}
