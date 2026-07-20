// ─── 🔊 SONS do jogo — tudo SINTETIZADO na hora (WebAudio, zero arquivo) ────
// Cada emoji de reação tem seu sonzinho: toca junto da bolha, pra quem manda
// e pra quem recebe. Volumes baixos de propósito — é tempero, não buzina.

let ctx: AudioContext | null = null
function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}

type Wave = OscillatorType
// nota curtinha com ataque rápido e cauda suave; slide opcional de pitch
function blip(a: AudioContext, f: number, when: number, dur: number, type: Wave = 'sine', vol = 0.14, slideTo?: number) {
  const o = a.createOscillator(), g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, when)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur)
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(vol, when + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  o.connect(g); g.connect(a.destination)
  o.start(when); o.stop(when + dur + 0.05)
}
// estalo de ruído (click de martelo, pipoca)
function click(a: AudioContext, when: number, dur = 0.05, vol = 0.2, hp = 1800) {
  const len = Math.max(1, Math.floor(a.sampleRate * dur))
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = a.createBufferSource(); s.buffer = buf
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp
  const g = a.createGain(); g.gain.value = vol
  s.connect(f); f.connect(g); g.connect(a.destination)
  s.start(when)
}

// 💸 moedas contando: tiquinhos metálicos agudos em rajada
export function somMoedas(n = 9) {
  const a = ac(); if (!a) return
  const t = a.currentTime
  for (let i = 0; i < Math.min(14, n); i++) {
    const w = t + i * 0.055
    blip(a, 2400 + (i % 3) * 320, w, 0.06, 'square', 0.04)
    blip(a, 3700 + (i % 2) * 500, w + 0.012, 0.05, 'sine', 0.03)
  }
}
// 🔨 martelo: toc grave + estalo
export function somMartelo() {
  const a = ac(); if (!a) return
  const t = a.currentTime
  blip(a, 175, t, 0.18, 'sine', 0.4, 70)
  click(a, t, 0.06, 0.22)
}
// entrada de alguém com selo: arpejo — quanto maior o tier, mais rico
export function somSelo(selo: string) {
  const a = ac(); if (!a) return
  const t = a.currentTime
  const seq = selo === '👑' ? [523, 659, 784, 1047, 1319] : selo === '⭐' ? [587, 740, 880, 1175] : [659, 830, 988]
  seq.forEach((f, i) => { blip(a, f, t + i * 0.09, 0.22, 'triangle', 0.12); blip(a, f * 2, t + i * 0.09, 0.16, 'sine', 0.045) })
  if (selo === '👑') for (let i = 0; i < 6; i++) blip(a, 2093 + i * 190, t + 0.5 + i * 0.05, 0.09, 'sine', 0.045)
}

// som por EMOJI de reação (sala de espera + pregão). Emoji sem som definido
// ganha um "pop" genérico simpático.
export function somEmote(emoji: string) {
  const a = ac(); if (!a) return
  const t = a.currentTime
  switch (emoji) {
    case '💸': somMoedas(9); break
    case '🤣': // risada saltitante descendo
      [880, 740, 620, 520].forEach((f, i) => blip(a, f, t + i * 0.11, 0.09, 'square', 0.07))
      break
    case '❤️': // dois toques quentinhos
      blip(a, 659, t, 0.16, 'sine', 0.13); blip(a, 988, t + 0.12, 0.24, 'sine', 0.11)
      break
    case '👀': // espiadinha: blip baixinho duplo
      blip(a, 330, t, 0.08, 'triangle', 0.09); blip(a, 415, t + 0.09, 0.1, 'triangle', 0.09)
      break
    case '😏': // deboche: escorregada curta pra cima
      blip(a, 392, t, 0.2, 'triangle', 0.1, 587)
      break
    case '📣': // cornetada
      blip(a, 440, t, 0.28, 'sawtooth', 0.1, 660); blip(a, 220, t, 0.28, 'square', 0.05, 330)
      break
    case '😈': // risinho maligno: trítono grave
      blip(a, 220, t, 0.16, 'square', 0.08); blip(a, 311, t + 0.13, 0.22, 'square', 0.08)
      break
    case '🍿': // pipoca estourando
      for (let i = 0; i < 6; i++) click(a, t + i * 0.06 + Math.random() * 0.03, 0.03, 0.12, 2400)
      break
    case '🐢': // tartaruga: wobble leeento
      blip(a, 180, t, 0.4, 'triangle', 0.11, 140)
      break
    case '🔨': somMartelo(); break
    case '😴': // ronco: descida comprida
      blip(a, 300, t, 0.5, 'sine', 0.11, 90)
      break
    case '🔥': // riser: sobe rápido
      blip(a, 220, t, 0.32, 'sawtooth', 0.08, 880)
      break
    default:
      blip(a, 700, t, 0.1, 'sine', 0.1); blip(a, 940, t + 0.08, 0.12, 'sine', 0.09)
  }
}
