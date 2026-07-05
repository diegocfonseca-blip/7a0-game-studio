// ── Synthesized sounds via WebAudio (no assets needed) ───────────────────
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durMs: number, type: OscillatorType, gainVal: number, delayMs = 0) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delayMs / 1000
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(gainVal, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + durMs / 1000 + 0.05)
}

export const Sounds = {
  move()    { tone(420, 70, 'triangle', 0.25) },
  capture() { tone(220, 90, 'square', 0.2); tone(160, 120, 'triangle', 0.25, 30) },
  check()   { tone(660, 100, 'sawtooth', 0.15); tone(880, 140, 'sawtooth', 0.15, 110) },
  end()     { tone(523, 160, 'triangle', 0.22); tone(659, 160, 'triangle', 0.22, 150); tone(784, 260, 'triangle', 0.24, 300) },
  lowTime() { tone(1000, 60, 'square', 0.12) },
  chat()    { tone(740, 60, 'sine', 0.15) },
}

export type SoundName = keyof typeof Sounds

export function play(name: SoundName, enabled: boolean) {
  if (!enabled) return
  try { Sounds[name]() } catch { /* audio blocked */ }
}
