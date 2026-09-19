// ⏱️🔊 SIMULA O SOM NO RITMO REAL DAS RODADAS (18/09).
//
// Pedido do Diego: *"você precisa fazer uma simulação de algumas rodadas agora no
// modo normal de tempo, modo rápido e ultra rápido, pra ver como fica o
// enquadramento do apito + som da torcida ambiente + gol"*.
//
// Foi a pergunta certa, e eu não tinha feito essa conta. Os tempos REAIS, lidos no
// código (ROUND_MS em `screens.tsx` e `pyramidseason.tsx`, dividido pelo
// SPEED_OPTS que o jogador escolhe):
//
//                        Normal    ⚡2×     ⚡4×
//   Carreira (auto)       10,0s    5,0s    2,5s
//   Rápido / Online        4,7s    2,4s    1,2s
//
// E o som do gol tem 3,1s. No online em ⚡4× a rodada dura 1,2s — ou seja, o gol
// dura DUAS RODADAS E MEIA. E o apito toca a CADA rodada: em ⚡4× seria um apito
// a cada 1,2 segundo, que é enlouquecedor.
// Este script monta o áudio dessas rodadas pra ouvir, em vez de discutir no papel.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5206
// Rodar: node scripts/simula-som-rodadas.mjs [--saida /tmp/sons]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const SR = 44100
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/sons'); mkdirSync(SAIDA, { recursive: true })
const PORTA = arg('porta', '5206')

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
const dec = async (arq) => p.evaluate(async (b64) => {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  const ctx = new OfflineAudioContext(1, 44100, 44100)
  const buf = await ctx.decodeAudioData(u8.buffer)
  const n = buf.length, c = buf.numberOfChannels
  const m = new Float32Array(n)
  for (let k = 0; k < c; k++) { const d = buf.getChannelData(k); for (let i = 0; i < n; i++) m[i] += d[i] / c }
  return Array.from(m)
}, readFileSync(arq).toString('base64'))
const torcida = await dec('public/sfx/torcida-estadio-v1.mp3')
const gol = await dec('public/sfx/gol-torcida-v1.mp3')
const apito = await dec(`${SAIDA}/01-apito-do-juiz.wav`)
await b.close()

const wav = (a) => { const n = a.length, buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 2)
  return buf }
const pico = a => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

// ⚽ uma temporada de mentira, mas com cara de verdade: em quais rodadas sai gol
const GOLS = [0, 2, 3, 5, 6, 8]   // índice da rodada (o 3 e o 2 seguidos são de propósito)

function monta(nome, rodadaS, nRodadas, arq) {
  const DUR = rodadaS * nRodadas + 2
  const mix = new Float32Array(Math.ceil(SR * DUR))
  const dur = a => a.length / SR
  // 🔉 a torcida abaixa durante o gol (senão soma e estoura — medido: 107% de pico)
  const golsEm = GOLS.filter(i => i < nRodadas).map(i => i * rodadaS + rodadaS * 0.45)
  const dobra = (t) => {
    let f = 1
    for (const g of golsEm) {
      if (t < g) continue
      if (t < g + 0.15) f = Math.min(f, 1 - 0.65 * ((t - g) / 0.15))
      else if (t < g + dur(gol)) f = Math.min(f, 0.35)
      else if (t < g + dur(gol) + 1.2) f = Math.min(f, 0.35 + 0.65 * ((t - g - dur(gol)) / 1.2))
    }
    return f
  }
  for (let t = 0; t < DUR; t += dur(torcida)) {
    const o = Math.floor(t * SR)
    for (let i = 0; i < torcida.length && o + i < mix.length; i++) mix[o + i] += torcida[i] * 0.5 * dobra((o + i) / SR)
  }
  const poe = (a, s, g = 1) => { const o = Math.floor(s * SR); for (let i = 0; i < a.length && o + i < mix.length; i++) mix[o + i] += a[i] * g }
  for (let r = 0; r < nRodadas; r++) poe(apito, r * rodadaS, 6)       // 🔔 apito a CADA rodada
  for (const g of golsEm) poe(gol, g, 0.95)
  writeFileSync(arq, wav(Array.from(mix)))
  console.log(`${nome.padEnd(30)} rodada ${rodadaS.toFixed(2)}s × ${nRodadas} = ${DUR.toFixed(0)}s · pico ${(pico(mix) * 100).toFixed(0)}%`)
}

const ON = 180000 / 38 / 1000, CAR = 10
monta('CARREIRA · Normal (10,0s)', CAR, 4, `${SAIDA}/SIM-1-carreira-normal.wav`)
monta('CARREIRA · ⚡4× (2,5s)', CAR / 4, 9, `${SAIDA}/SIM-2-carreira-ultra.wav`)
monta('ONLINE · Normal (4,7s)', ON, 6, `${SAIDA}/SIM-3-online-normal.wav`)
monta('ONLINE · ⚡2× (2,4s)', ON / 2, 9, `${SAIDA}/SIM-4-online-rapido.wav`)
monta('ONLINE · ⚡4× (1,2s)', ON / 4, 14, `${SAIDA}/SIM-5-online-ultra.wav`)
