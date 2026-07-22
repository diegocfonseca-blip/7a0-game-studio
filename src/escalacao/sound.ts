// ─── SOM DO JOGO (sintetizado, sem baixar arquivo) ────────────────────────
// Motor de áudio via Web Audio API: cliques, moeda, martelada, lacre,
// tique-taque, chime de LENDA, torcida (ruído filtrado) e apito.
//
// 🔒 TRAVA POR USUÁRIO: só toca se `setSoundAllowed(true)` foi chamado (hoje,
//    só pro login do Diego). Pra todo mundo mais é 100% silêncio — nenhum
//    som, nenhum botão. Quando for liberar geral, é só tirar a trava.
// 🔇 MUTE: começa MUDO; a pessoa liga no botão. Escolha lembrada no aparelho.
// 🌐 AUTOPLAY: o navegador só deixa tocar DEPOIS do 1º toque — então nada
//    surpreende quem só abriu o jogo. O AudioContext acorda no 1º gesto.
//
// Tudo é embrulhado em try/catch e vira no-op se algo falhar: som NUNCA
// pode quebrar o jogo.

let allowed = false
let muted = true
try { muted = localStorage.getItem('esc-sound-muted') !== '0' } catch { /* padrão: mudo */ }

let ctx: AudioContext | null = null
let master: GainNode | null = null
const listeners = new Set<() => void>()

export function onSoundChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
function notify() { listeners.forEach(fn => { try { fn() } catch { /* ignora */ } }) }

export function setSoundAllowed(v: boolean) { if (allowed === v) return; allowed = v; if (!allowed) stopCrowd(); notify() }
export function isSoundAllowed() { return allowed }
export function isMuted() { return muted }
export function toggleMuted() { setMuted(!muted) }
export function setMuted(v: boolean) {
  muted = v
  try { localStorage.setItem('esc-sound-muted', v ? '1' : '0') } catch { /* ignora */ }
  if (muted) stopCrowd()
  notify()
}

// só cria/acorda o contexto quando REALMENTE vai tocar (após um gesto)
function ac(): AudioContext | null {
  if (!allowed || muted) return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.32 // mix geral BAIXO de propósito (não atrapalhar)
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* ignora */ })
    return ctx
  } catch { return null }
}

// tom simples com envelope (ataque rápido + decaimento)
function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, glideTo?: number) {
  const c = ac(); if (!c || !master) return
  try {
    const t = c.currentTime + delay
    const o = c.createOscillator(); const g = c.createGain()
    o.type = type; o.frequency.setValueAtTime(freq, t)
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(master)
    o.start(t); o.stop(t + dur + 0.02)
  } catch { /* ignora */ }
}

// estouro de ruído (batida/carimbo/apito)
function noise(dur: number, gain: number, filter: number, q = 1, delay = 0) {
  const c = ac(); if (!c || !master) return
  try {
    const t = c.currentTime + delay
    const n = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, n, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    const src = c.createBufferSource(); src.buffer = buf
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = filter; bp.Q.value = q
    const g = c.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(bp); bp.connect(g); g.connect(master)
    src.start(t); src.stop(t + dur + 0.02)
  } catch { /* ignora */ }
}

// 🪙 moeda: dois blips agudos rapidinhos
export function playCoin() { tone(1180, 0.09, 'triangle', 0.5, 0); tone(1560, 0.10, 'triangle', 0.4, 0.05) }
// ⏱️ tique do cronômetro (últimos segundos)
export function playTick() { tone(1000, 0.04, 'square', 0.28) }
// 🔒 lacre: carimbo (batida seca de ruído + graves)
export function playSeal() { noise(0.12, 0.5, 700, 0.7); tone(150, 0.14, 'sine', 0.5, 0.01, 80) }
// 🔨 martelada: pancada de madeira + graves
export function playHammer() { noise(0.09, 0.6, 320, 0.6); tone(120, 0.18, 'sine', 0.6, 0, 60); tone(90, 0.22, 'sine', 0.4, 0.02, 45) }
// ✨ chime dourado (LENDA): arpejo subindo com brilho
export function playChime() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.5, 'sine', 0.32, i * 0.08)); tone(1980, 0.6, 'sine', 0.14, 0.28) }
// 📣 apito do juiz: tom agudo com trinado + sopro
export function playWhistle() {
  const c = ac(); if (!c || !master) return
  try {
    const t = c.currentTime
    const o = c.createOscillator(); const g = c.createGain(); const lfo = c.createOscillator(); const lg = c.createGain()
    o.type = 'square'; o.frequency.value = 2350
    lfo.type = 'sine'; lfo.frequency.value = 22; lg.gain.value = 120 // trinado
    lfo.connect(lg); lg.connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    g.gain.setValueAtTime(0.3, t + 0.30)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    o.connect(g); g.connect(master)
    o.start(t); lfo.start(t); o.stop(t + 0.44); lfo.stop(t + 0.44)
    noise(0.42, 0.06, 2400, 3) // sopro de ar
  } catch { /* ignora */ }
}

// 🏟️ torcida: ruído rosa filtrado com ondulação lenta (murmúrio de estádio).
// Loop até stopCrowd(). Volume BEM baixo pra ficar no fundo.
let crowd: { stop: () => void } | null = null
export function startCrowd() {
  if (crowd) return
  const c = ac(); if (!c || !master) return
  try {
    const dur = 4 // buffer de 4s em loop
    const n = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, n, c.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 } // ruído "rosa" simples
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900
    const g = c.createGain(); g.gain.value = 0.11 // torcida BEM ao fundo
    // ondulação lenta (a torcida "respira")
    const lfo = c.createOscillator(); const lg = c.createGain()
    lfo.type = 'sine'; lfo.frequency.value = 0.18; lg.gain.value = 0.05
    lfo.connect(lg); lg.connect(g.gain)
    src.connect(lp); lp.connect(g); g.connect(master)
    const t = c.currentTime
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.8) // fade-in suave
    src.start(); lfo.start()
    crowd = { stop: () => { try { const now = c.currentTime; g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5); src.stop(now + 0.55); lfo.stop(now + 0.55) } catch { /* ignora */ } } }
  } catch { /* ignora */ }
}
export function stopCrowd() { if (crowd) { crowd.stop(); crowd = null } }
