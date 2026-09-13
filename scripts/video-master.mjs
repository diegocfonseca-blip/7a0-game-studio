// 🎬 VÍDEO DE MOCKUP — Patrocinador Master (pedido do Diego 13/09: *"quero um vídeo
// de mockup do novo patrocinador Master"*). Grava a cena REAL da bancada
// (scripts/teste-rosto?video) num celular de 430px: os 4 contratos → escolhe a
// Vadico → assina → faixa ASSINADO → o Pontual embaixo. O Playwright grava .webm;
// com um ffmpeg (imageio-ffmpeg do Python serve) sai o .mp4 pro WhatsApp.
//   1) npx vite scripts/teste-rosto --port 5199
//   2) node scripts/video-master.mjs [--saida /pasta] [--ffmpeg /caminho/ffmpeg]
import { chromium } from 'playwright-core'
import { mkdirSync, renameSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const DIR = arg('--saida', '/tmp/video-master'); mkdirSync(DIR, { recursive: true })
const FFMPEG = arg('--ffmpeg', process.env.FFMPEG || '')
const W = 430, H = 860

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, recordVideo: { dir: DIR, size: { width: W * 2, height: H * 2 } } })
const p = await ctx.newPage()
await p.goto('http://localhost:5199/?video', { waitUntil: 'networkidle' })
await p.waitForTimeout(400)

const espera = ms => p.waitForTimeout(ms)
const rola = async (top, ms = 1100) => { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'smooth' }), Math.max(0, top)); await espera(ms) }
const topoDe = async loc => p.evaluate(el => el.getBoundingClientRect().top + window.scrollY, await loc.elementHandle())
const toca = async (loc, antes = 500, depois = 900) => {
  const bb = await loc.boundingBox()
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 26 })
  await espera(antes)
  await p.mouse.down(); await espera(130); await p.mouse.up()
  await espera(depois)
}

// 1) abre: título + cabeçalho do Master
await p.mouse.move(W / 2, H * 0.7)
await espera(1500)
// 2) enquadra os 4 contratos
const vadico = p.getByRole('button', { name: /Vadico Veículos/ }).first()
const maxj = p.getByRole('button', { name: /Max Joias/ }).first()
await rola((await topoDe(maxj)) - 150, 1400)
// 3) escolhe a Vadico
await toca(vadico, 600, 1000)
// 4) desce pra mesa: o papel já preenchido
const mesa = p.locator('.ll36-office').first()
await rola((await topoDe(mesa)) - 40, 1700)
// 5) o botão ASSINAR
const assinar = p.getByRole('button', { name: /^✍️ ASSINAR/ }).first()
await rola((await topoDe(assinar)) - H + 140, 1000)
await toca(assinar, 600, 700)
// 6) assinado: volta pro topo (a faixa com o carimbo)
await rola(0, 1900)
// 7) desce pro Pontual, que continua embaixo
const pontual = p.locator('section[aria-label]').filter({ hasText: /PONTUAL/ }).first()
await rola((await topoDe(pontual)) - 12, 1800)
await rola((await topoDe(pontual)) + 300, 1600)
await espera(600)

const video = p.video()
await ctx.close(); await b.close()
const webm = await video.path()
const finalWebm = join(DIR, 'patrocinador-master.webm')
renameSync(webm, finalWebm)
console.log('🎞️ webm:', finalWebm)
if (FFMPEG && existsSync(FFMPEG)) {
  const mp4 = join(DIR, 'patrocinador-master.mp4')
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', finalWebm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' })
  console.log(r.status === 0 ? `🎬 mp4: ${mp4}` : '⚠️ ffmpeg falhou — fica o webm')
}
