// 🔊 GRAVA OS SONS DO JOGO EM ARQUIVO, PRA OUVIR.
//
// Diego (18/09): *"cadê os sons pra eu ouvir"*. Justo: o som do jogo é
// SINTETIZADO na hora (Web Audio), então não existe arquivo nenhum pra mandar.
//
// Este script roda o CÓDIGO DE VERDADE do `sound.ts` dentro do navegador, com o
// contexto de áudio trocado por um OfflineAudioContext — as mesmas funções, as
// mesmas contas, só que gravando num buffer em vez de tocar no alto-falante.
// ⚠️ Não é uma imitação feita à mão: se o som mudar no jogo, muda aqui também.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5205
// Rodar: node scripts/grava-sons.mjs [--porta 5205] [--saida /tmp/sons]
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5205')
const SAIDA = arg('saida', '/tmp/sons')
mkdirSync(SAIDA, { recursive: true })
const SR = 44100

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

// renderiza UMA chamada do módulo real num buffer offline
// 🔁 PÁGINA NOVA A CADA SOM: o `sound.ts` guarda o contexto num singleton, então
// reaproveitar a página faria o 2º som cair num contexto JÁ renderizado (silêncio).
// E nada de `?t=` no import: o vite devolve 500 com query nesse caminho.
const renderiza = async (chamada, segundos) => {
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  return p.evaluate(async ({ chamada, segundos, SR }) => {
  const AC0 = window.AudioContext
  let off
  // 🎛️ o módulo cria `new AudioContext()` lá dentro — trocamos por um offline,
  // que tem a MESMA API (createGain, createBufferSource, createBiquadFilter…)
  window.AudioContext = function () {
    off = new OfflineAudioContext(1, Math.ceil(SR * segundos), SR)
    off.resume = () => Promise.resolve()
    return off
  }
  const m = await import(/* @vite-ignore */ '/src/escalacao/sound.ts')
  m.setSoundAllowed(true); m.setMuted(false)
  // eslint-disable-next-line no-new-func
  new Function('m', chamada)(m)
  const buf = await off.startRendering()
  window.AudioContext = AC0
  return Array.from(buf.getChannelData(0))
  }, { chamada, segundos, SR })
}

// ── PCM -> WAV 16 bits mono
const wav = (amostras) => {
  const n = amostras.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, amostras[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  return buf
}
const pico = (a) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

const PECAS = [
  ['01-apito-do-juiz', 'm.playWhistle()', 1.6],
  ['02-torcida-ao-fundo', 'm.startCrowd()', 8],
  ['03-canto-da-arquibancada', 'm.crowdChant()', 2.2],
  ['04-gol-SEU', 'm.crowdRoar(1.15)', 3],
  ['05-gol-do-adversario', 'm.crowdRoar(0.75)', 3],
]
const gravados = {}
for (const [nome, chamada, seg] of PECAS) {
  const a = await renderiza(chamada, seg)
  gravados[nome] = a
  writeFileSync(`${SAIDA}/${nome}.wav`, wav(a))
  console.log(`${nome}.wav  ${seg}s  pico ${(pico(a) * 100).toFixed(0)}%`)
}

// 🎬 COMO FICA NO JOGO: a torcida rolando, o apito na largada, um canto no meio e
//    o gol. Mixado aqui porque o offline não tem relógio de verdade pra encadear.
const DUR = 14
const mix = new Float32Array(SR * DUR)
const poe = (a, emSeg, ganho = 1) => {
  const off = Math.floor(emSeg * SR)
  for (let i = 0; i < a.length && off + i < mix.length; i++) mix[off + i] += a[i] * ganho
}
// a torcida de 8s entra duas vezes, emendada, pra cobrir os 14s
poe(gravados['02-torcida-ao-fundo'], 0)
poe(gravados['02-torcida-ao-fundo'], 7.6)
poe(gravados['01-apito-do-juiz'], 0.4)
poe(gravados['03-canto-da-arquibancada'], 3.2)
poe(gravados['04-gol-SEU'], 8.6)
poe(gravados['01-apito-do-juiz'], 12.4)
writeFileSync(`${SAIDA}/00-COMO-FICA-NO-JOGO.wav`, wav(Array.from(mix)))
console.log(`00-COMO-FICA-NO-JOGO.wav  ${DUR}s  pico ${(pico(mix) * 100).toFixed(0)}%`)

// 🔊 E A VERSÃO MAIS ALTA, PRA COMPARAR (18/09).
// A medição acusou o problema: a torcida sai com pico de 4% e o urro do gol com 4%
// — ou seja, o som EXISTE mas é quase inaudível no celular, e era por isso que ele
// perguntava "cadê". Subir é mexer em dois números (`master` e os ganhos), mas o
// volume é decisão de OUVIDO, não de régua: então gravo as duas e ele escolhe.
// ⚠️ Multiplicar a amostra aqui dá EXATAMENTE o mesmo resultado de subir o ganho no
// código — é a mesma conta, no mesmo lugar da cadeia.
const ALVO = 0.62
const fator = ALVO / pico(mix)
console.log(`\n🔊 versão alta: ${fator.toFixed(1)}× (pico ${(pico(mix) * 100).toFixed(0)}% → ${(ALVO * 100).toFixed(0)}%)`)
const alto = (a) => Array.from(a, v => Math.max(-1, Math.min(1, v * fator)))
for (const [nome] of PECAS) writeFileSync(`${SAIDA}/alto-${nome}.wav`, wav(alto(gravados[nome])))
writeFileSync(`${SAIDA}/00-ALTO-COMO-FICA-NO-JOGO.wav`, wav(alto(mix)))
console.log('gravei também a pasta "alto-" com tudo nesse volume')

await b.close()
