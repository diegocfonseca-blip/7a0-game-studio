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
