// 🎧 PREPARA UM SOM QUE O DONO MANDOU, PRA ENTRAR NO JOGO (18/09).
//
// Nasceu com a torcida de fundo (*"gostei desse aqui pro som da torcida rolando"*)
// e ficou geral quando veio o do gol.
//
// ⚠️ POR QUE EXISTE: o arquivo bruto NÃO PODE ENTRAR como veio. A torcida veio com
// 345 KB e o gol com 251 KB, os dois em estéreo 128 kbps — e eles descem pra TODO
// jogador que ligar o som numa partida. A regra de peso da casa (que nasceu pra
// arte de batismo) vale igual pro som. O que este script faz:
//   1. MONO — som de ambiente não precisa de estéreo; corta metade na hora;
//   2. CORTA no tempo certo (--de/--seg). O gol veio com 16s de cauda, e o Diego
//      pegou na hora: *"acho que tá muito longo, porque o gol acontece e a
//      partida continua"*. Som que dura mais que o momento atrapalha o jogo;
//   3. --fade: desbota o fim, pra o som DERRETER no ambiente em vez de cortar seco;
//   4. --loop: emenda invisível (o fim entra por cima do começo em crossfade) —
//      só pra som que roda em volta, senão o loop dá um "clique" a cada volta;
//   5. bitrate baixo — ruído de multidão não tem detalhe fino pra perder.
//
// Decodifica no navegador (Chromium lê mp3) e recodifica com lameenc em Python:
// sem ffmpeg no ambiente, é o caminho que existe.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5206
// Uso:
//   node scripts/prepara-som.mjs <entrada.mp3> --saida public/sfx/nome-v1.mp3 \
//        [--de 0] [--seg 20] [--fade 1.2] [--loop] [--kbps 56] [--porta 5206]
import { chromium } from 'playwright-core'
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ENTRADA = process.argv[2]
const num = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : d }
const txt = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const KBPS = num('kbps', 56), SEG = num('seg', 20), DE = num('de', 0), FADE = num('fade', 0)
const LOOP = process.argv.includes('--loop')
const PORTA = num('porta', 5206)
const SAIDA = txt('saida', '')
if (!ENTRADA || !SAIDA) { console.error('uso: node scripts/prepara-som.mjs <entrada.mp3> --saida public/sfx/nome-v1.mp3'); process.exit(1) }

const bruto = readFileSync(ENTRADA)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const { pcm, sr, durOrig, canais } = await p.evaluate(async ({ b64, SEG, DE, FADE, LOOP }) => {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  const ctx = new OfflineAudioContext(1, 44100, 44100)
  const buf = await ctx.decodeAudioData(u8.buffer)
  const sr = buf.sampleRate, canais = buf.numberOfChannels, n = buf.length
  const mono = new Float32Array(n)
  for (let c = 0; c < canais; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / canais }
  const ini = Math.floor(DE * sr)
  const alvo = Math.min(n - ini, Math.floor(sr * SEG))
  const out = new Float32Array(alvo)
  out.set(mono.subarray(ini, ini + alvo))
  if (LOOP) {
    // emenda invisível: o trecho logo DEPOIS do corte desbota por cima do começo
    const fade = Math.min(Math.floor(sr * 1.0), Math.floor(alvo / 4))
    for (let i = 0; i < fade; i++) {
      const k = i / fade
      const cauda = mono[ini + alvo + i] ?? mono[ini + i]
      out[i] = out[i] * k + cauda * (1 - k)
    }
  }
  if (FADE > 0) {
    const f = Math.min(Math.floor(FADE * sr), alvo)
    for (let i = 0; i < f; i++) { const k = 1 - i / f; out[alvo - f + i] *= k * k } // curva quadrática: some mais natural
  }
  return { pcm: Array.from(out), sr, durOrig: n / sr, canais }
}, { b64: bruto.toString('base64'), SEG, DE, FADE, LOOP })
await b.close()

writeFileSync('/tmp/som.pcm', Buffer.from(Int16Array.from(pcm, v => Math.max(-1, Math.min(1, v)) * 32767).buffer))
execFileSync('python3', ['-c', `
import lameenc
pcm = open('/tmp/som.pcm','rb').read()
e = lameenc.Encoder()
e.set_bit_rate(${KBPS}); e.set_in_sample_rate(${sr}); e.set_channels(1); e.set_quality(2)
open('${SAIDA}','wb').write(e.encode(pcm) + e.flush())
`], { stdio: 'inherit' })

const kb = readFileSync(SAIDA).length / 1024, kbIn = bruto.length / 1024
console.log(`entrada: ${kbIn.toFixed(0)} KB · ${durOrig.toFixed(1)}s · ${canais} canal(is)`)
console.log(`saída:   ${kb.toFixed(0)} KB · ${(pcm.length / sr).toFixed(1)}s · mono ${KBPS} kbps${LOOP ? ' · com emenda de loop' : ''}${FADE ? ` · fade de ${FADE}s no fim` : ''}`)
console.log(`         →  ${SAIDA}   (${(100 - kb / kbIn * 100).toFixed(0)}% mais leve)`)
