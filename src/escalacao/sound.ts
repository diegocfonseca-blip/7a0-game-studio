// ─── SOM DO JOGO (sintetizado, sem baixar arquivo) ────────────────────────
// Motor de áudio via Web Audio API: cliques, moeda, martelada, lacre,
// tique-taque, chime de LENDA e apito — tudo sintetizado, 0 KB.
// 🎧 A ÚNICA exceção é o som de PARTIDA (ambiente de estádio + gol): são os dois
//    arquivos que o Diego escolheu em 19/09, em `public/sfx/`, fora do bundle.
//    Ver o bloco "O SOM DA PARTIDA" lá embaixo.
//
// 🔓 JÁ LIBERADO PRA TODO MUNDO (`setSoundAllowed(true)` no `index.tsx`). Este
//    comentário dizia "só pro login do Diego" e estava velho — corrigido em 18/09,
//    quando ele perguntou *"e aí, cadê?"* e eu vim conferir de verdade.
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
// 🎙️ toca um ARQUIVO de áudio (memes .mp3 do public/sfx) respeitando mudo/permissão
export function playMp3(url: string) {
  if (!allowed || muted) return
  try { const a = new Audio(url); a.play().catch(() => { /* autoplay bloqueado: silêncio */ }) } catch { /* ignora */ }
}
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

// ─── 🎧 O SOM DA PARTIDA: SÓ OS ÁUDIOS QUE ELE ESCOLHEU (Diego 19/09) ───────
// Palavras dele, fechando o assunto: *"quero só os áudios que eu mandei, do
// ambiente, gol, e o apito que você já tinha mesmo"*.
// Traduzindo, e é a lista COMPLETA do som de partida — nada além disto toca:
//   🏟️ AMBIENTE  → `torcida-estadio-v1.mp3`, o arquivo que ele mandou, em loop
//   🥅 GOL       → `gol-torcida-v1.mp3`, o arquivo que ele mandou (opção B)
//   📣 APITO     → o sintetizado de sempre (`playWhistle`), que ele aprovou
// 🗑️ APOSENTADOS na mesma ordem: o murmúrio de ruído rosa que fazia de ambiente,
//    o URRO sintetizado do gol e o CANTO de palmas + "ôôô". O ambiente que ele
//    mandou já tem torcida cantando ao longe — os dois juntos embolavam.
//
// 🪶 PESO: os dois arquivos somam 158 KB e moram em `public/sfx/`, FORA do
//    bundle. Só descem pra quem liga o 🔊 e entra numa partida — quem joga mudo
//    não baixa nada. Mesma lógica da regra de peso da arte de batismo.
//
// 🔌 Por que passam pelo Web Audio (e não por `new Audio()`): é o único jeito de
//    (a) obedecer o mudo/permissão pelo MESMO `master`, (b) ABAIXAR o ambiente no
//    gol (ducking) e (c) CORTAR o gol quando a rodada é mais curta que ele.
export const TORCIDA_NOVA = true   // 🔁 ligada em 19/09, quando ele escolheu os áudios

const SFX_AMBIENTE = 'sfx/torcida-estadio-v1.mp3'
const SFX_GOL = 'sfx/gol-torcida-v1.mp3'

// cache de arquivo já baixado e decodificado (um download por sessão, no máximo)
const bufs = new Map<string, AudioBuffer>()
const baixando = new Map<string, Promise<AudioBuffer | null>>()
function carrega(nome: string): Promise<AudioBuffer | null> {
  const pronto = bufs.get(nome)
  if (pronto) return Promise.resolve(pronto)
  const indo = baixando.get(nome)
  if (indo) return indo
  const c = ac()
  if (!c) return Promise.resolve(null)
  const p = fetch(`${import.meta.env.BASE_URL}${nome}`)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('404'))))
    .then(ab => c.decodeAudioData(ab))
    .then(buf => { bufs.set(nome, buf); return buf })
    .catch(() => null)   // som NUNCA quebra o jogo: falhou, fica mudo e pronto
    .finally(() => { baixando.delete(nome) })
  baixando.set(nome, p)
  return p
}

// 🎚️ Os três números do mix. Medidos nos arquivos DELE (ver o bloco do gol):
// o ambiente fica ~16 dB abaixo do gol, que é onde um estádio de verdade fica.
// Se ele achar o ambiente baixo ou alto demais, é aqui que se mexe — uma linha.
const AMBIENTE_VOL = 0.5    // fica ao FUNDO; o master geral já corta tudo pra 0.32
const GOL_VOL = 0.95
const DUCK = 0.35           // o ambiente cai pra 35% enquanto o gol toca

let crowd: { gain: GainNode; stop: () => void } | null = null
export function startCrowd() {
  if (crowd) return
  const c = ac(); if (!c || !master) return
  // marca o lugar JÁ (síncrono), senão dois renders seguidos abrem duas torcidas
  const g = c.createGain()
  g.gain.value = 0.0001
  g.connect(master)
  let src: AudioBufferSourceNode | null = null
  let morto = false
  crowd = {
    gain: g,
    stop: () => {
      morto = true
      try {
        const now = c.currentTime
        g.gain.cancelScheduledValues(now)
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
        if (src) src.stop(now + 0.55)
      } catch { /* ignora */ }
    },
  }
  carrega(SFX_AMBIENTE).then(buf => {
    if (!buf || morto || !crowd) return
    try {
      src = c.createBufferSource()
      src.buffer = buf
      src.loop = true   // o ambiente roda o jogo inteiro, sem emenda audível
      src.connect(g)
      const t = c.currentTime
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(AMBIENTE_VOL, t + 0.8)   // entra suave
      src.start()
    } catch { /* ignora */ }
  })
  // 🥅 já deixa o gol baixado enquanto o ambiente sobe: o primeiro gol da partida
  // não pode chegar mudo por estar esperando download.
  carrega(SFX_GOL)
}
export function stopCrowd() { if (crowd) { crowd.stop(); crowd = null } }

// ─── 🥅 O GOL ───────────────────────────────────────────────────────────────
// Regras de convivência, pra não virar bagunça (é o que ele reclamou do arquivo
// original: *"acho q tá mt longo pq o gol acontece e a partida continua"*):
//   1. UM GOL POR VEZ — se outro gol sai antes do primeiro acabar, o primeiro
//      sai de fininho em 0,12s. Dois gols empilhados estouram o som.
//   2. O GOL NUNCA PASSA DA RODADA — ele é cortado em 85% do tempo da rodada,
//      com 0,25s de saída. Na rodada de 5,7s toca inteiro; na de 2,9s do ⚡2×
//      toca o auge e sai antes do próximo jogo começar.
//   3. RODADA CURTA DEMAIS (abaixo de 2s, que é o ⚡4×) fica SÓ com o ambiente.
//      Gol nenhum cabe ali, e picotado soa como defeito.
//   4. O AMBIENTE ABAIXA no gol (ducking) e volta em 1,2s — é o que faz o gol
//      SALTAR em vez de se misturar com o zunzum. Medido nos arquivos reais:
//      ambiente sozinho pica em 9,8% · o gol em 32,5% · os dois no gol, com o
//      ducking, em 35,9% (sem ducking daria 42,3%). Nenhum dos dois estoura —
//      o mix da casa já é baixo de propósito —, então isto é DECISÃO DE SOM,
//      não conserto de estouro.
let golAtual: { g: GainNode; src: AudioBufferSourceNode } | null = null

/**
 * 🎉 O gol que ele mandou.
 * @param forca  > 1 = gol SEU (a torcida da casa grita mais alto)
 * @param ritmoMs quanto dura a RODADA na tela — quem chama já sabe (é prop do
 *   placar), então o número vem de lá em vez de virar estado solto aqui.
 */
export function crowdRoar(forca = 1, ritmoMs = 5700) {
  const c = ac(); if (!c || !master) return
  if (ritmoMs < 2000) return   // regra 3: no ultra-rápido fica só o ambiente
  carrega(SFX_GOL).then(buf => {
    if (!buf) return
    try {
      const t = c.currentTime
      // regra 1: o gol anterior sai de fininho
      if (golAtual) {
        const { g: gv, src: sv } = golAtual
        gv.gain.cancelScheduledValues(t)
        gv.gain.setValueAtTime(Math.max(0.0001, gv.gain.value), t)
        gv.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
        try { sv.stop(t + 0.15) } catch { /* já parou */ }
        golAtual = null
      }
      const teto = Math.max(0.6, (ritmoMs / 1000) * 0.85)   // regra 2
      const dur = Math.min(buf.duration, teto)
      const src = c.createBufferSource(); src.buffer = buf
      const g = c.createGain()
      const pico = Math.min(1, GOL_VOL * forca)
      g.gain.setValueAtTime(pico, t)
      if (dur < buf.duration) {   // cortou: sai com fade, não com tesourada
        g.gain.setValueAtTime(pico, t + Math.max(0.05, dur - 0.25))
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      }
      src.connect(g); g.connect(master!)
      src.start(t); src.stop(t + dur + 0.02)
      golAtual = { g, src }
      src.onended = () => { if (golAtual && golAtual.src === src) golAtual = null }
      // regra 4: o ambiente se encolhe enquanto o gol toca
      if (crowd) {
        const cg = crowd.gain
        cg.gain.cancelScheduledValues(t)
        cg.gain.setValueAtTime(Math.max(0.0001, cg.gain.value), t)
        cg.gain.exponentialRampToValueAtTime(AMBIENTE_VOL * DUCK, t + 0.15)
        cg.gain.setValueAtTime(AMBIENTE_VOL * DUCK, t + dur)
        cg.gain.exponentialRampToValueAtTime(AMBIENTE_VOL, t + dur + 1.2)
      }
    } catch { /* ignora */ }
  })
}
