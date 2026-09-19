// 🎧 PREPARA O ÁUDIO DA TORCIDA QUE O DONO MANDOU (18/09).
//
// Diego mandou um ambiente de estádio (ElevenLabs, 22s) e disse: *"gostei desse
// aqui pro som da torcida rolando"*.
//
// ⚠️ MAS ELE VEIO COM 345 KB, em estéreo 128 kbps — e esse arquivo desce pra TODO
// jogador que ligar o som numa partida. A regra de peso da casa (que nasceu pra
// arte de batismo) vale igual aqui: som de fundo não pode custar o preço de uma
// música. Então o arquivo é preparado antes de entrar:
//   1. MONO — ambiente de torcida não precisa de estéreo; corta metade na hora;
//   2. EMENDA INVISÍVEL — o último segundo entra por cima do primeiro em
//      crossfade, senão o loop dá aquele "clique" a cada volta;
//   3. bitrate baixo — ruído de multidão não tem detalhe fino pra perder.
//
// Este script DECODIFICA no navegador (Chromium sabe ler mp3) e RECODIFICA em
// Python com o lameenc. Sem ffmpeg no ambiente, é o caminho que existe.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5205
// Rodar: node scripts/prepara-torcida.mjs <entrada.mp3> [--kbps 56] [--seg 20]
import { chromium } from 'playwright-core'
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ENTRADA = process.argv[2]
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : d }
const KBPS = arg('kbps', 56)
const SEG = arg('seg', 20)
const PORTA = arg('porta', 5205)
if (!ENTRADA) { console.error('uso: node scripts/prepara-torcida.mjs <entrada.mp3>'); process.exit(1) }

const b64 = readFileSync(ENTRADA).toString('base64')
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const { pcm, sr, durOrig, canais } = await p.evaluate(async ({ b64, SEG }) => {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  const ctx = new OfflineAudioContext(1, 44100, 44100)
  const buf = await ctx.decodeAudioData(u8.buffer)
  const sr = buf.sampleRate, canais = buf.numberOfChannels
  // 1️⃣ mistura pra MONO
  const n = buf.length
  const mono = new Float32Array(n)
  for (let c = 0; c < canais; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / canais }
  // 2️⃣ corta no tamanho pedido e faz a EMENDA INVISÍVEL (crossfade de 1s)
  const alvo = Math.min(n, Math.floor(sr * SEG))
  const fade = Math.min(Math.floor(sr * 1.0), Math.floor(alvo / 4))
  const out = new Float32Array(alvo)
  out.set(mono.subarray(0, alvo))
  for (let i = 0; i < fade; i++) {
    const k = i / fade
    const cauda = mono[alvo + i] ?? mono[i]      // o trecho logo depois do corte
    out[i] = out[i] * k + cauda * (1 - k)        // começo recebe a cauda desbotando
  }
  return { pcm: Array.from(out), sr, durOrig: n / sr, canais }
}, { b64, SEG })
await b.close()

console.log(`entrada: ${(readFileSync(ENTRADA).length / 1024).toFixed(0)} KB · ${durOrig.toFixed(1)}s · ${canais} canal(is) · ${sr} Hz`)

// 3️⃣ recodifica em mp3 MONO no bitrate pedido (lameenc, via python)
writeFileSync('/tmp/torcida.pcm', Buffer.from(Int16Array.from(pcm, v => Math.max(-1, Math.min(1, v)) * 32767).buffer))
const saida = 'public/sfx/torcida-estadio-v1.mp3'
execFileSync('python3', ['-c', `
import lameenc, sys
pcm = open('/tmp/torcida.pcm','rb').read()
e = lameenc.Encoder()
e.set_bit_rate(${KBPS}); e.set_in_sample_rate(${sr}); e.set_channels(1); e.set_quality(2)
mp3 = e.encode(pcm) + e.flush()
open('${saida}','wb').write(mp3)
`], { stdio: 'inherit' })

const kb = readFileSync(saida).length / 1024
console.log(`saída:   ${kb.toFixed(0)} KB · ${(pcm.length / sr).toFixed(1)}s · mono ${KBPS} kbps  →  ${saida}`)
console.log(`economia: ${(100 - kb / (readFileSync(ENTRADA).length / 1024) * 100).toFixed(0)}%`)
