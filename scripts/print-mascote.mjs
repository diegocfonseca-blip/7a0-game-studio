// 🎥 Grava a bancada do "solta a mascote" (antes × proposta) num mp4 curto.
// Animação só se julga vendo mexer — print parado não resolve.
// Antes: DEPLOY_BASE=/ npx vite --port 5199
// Rodar: node scripts/print-mascote.mjs [--masc leao_thor] [--saida /tmp/solta-mascote.mp4]
import { readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const MASC = arg('--masc', 'leao_thor'), SAIDA = arg('--saida', '/tmp/solta-mascote.mp4'), PORTA = arg('--porta', '5199')
// 🔁 GUARDA DO ESPELHO: a bancada não IMPORTA o componente do jogo (ele depende do
// `useEsc()`), então ela copia os keyframes. Se um dos dois mudar sozinho, o print
// vira mentira — por isso comparamos os dois arquivos antes de gravar.
import { readFileSync } from 'node:fs'
const kf = (txt) => Object.fromEntries([...txt.matchAll(/@keyframes escMasc(\w+)\{([^}]*)\}/g)]
  .map(m => [m[1].toLowerCase(), m[2].replace(/\s/g, '')]))
const noJogo = kf(readFileSync('src/escalacao/screens.tsx', 'utf8'))
const naBanca = kf(readFileSync('scripts/teste-mascote/main.tsx', 'utf8'))
const difs = Object.keys(noJogo).filter(k => noJogo[k] !== naBanca[k])
if (difs.length) { console.error(`❌ a bancada saiu de sincronia com o jogo: ${difs.join(', ')}`); process.exit(1) }
console.log(`✅ bancada em sincronia com o jogo (${Object.keys(noJogo).length} animações)`)

const REC = '/tmp/rec-solta-mascote'
rmSync(REC, { recursive: true, force: true }); mkdirSync(REC, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 900, height: 780 }, recordVideo: { dir: REC, size: { width: 900, height: 780 } } })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', e => erros.push(String(e)))
await p.goto(`http://localhost:${PORTA}/scripts/teste-mascote/?masc=${MASC}`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(9500)
await ctx.close(); await b.close()
if (erros.length) { console.error('❌ erro na página: ' + erros.join(' | ')); process.exit(1) }
const webm = readdirSync(REC).find(f => f.endsWith('.webm'))
if (!webm) throw new Error('o Playwright não gravou o webm')
let FF = process.env.FFMPEG || 'ffmpeg'
try { FF = createRequire(import.meta.url)('ffmpeg-static') } catch { /* usa FFMPEG/PATH */ }
execFileSync(FF, ['-y', '-i', `${REC}/${webm}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22',
  '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', SAIDA], { stdio: 'ignore' })
console.log(SAIDA)
