// 🎬 grava o protótipo do jogo ao vivo em vídeo (webm → mp4) pro Diego ver no celular.
//   node scripts/prototipo-jogo-ao-vivo/grava.mjs  →  scripts/posts/jogo-ao-vivo.mp4
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
const TMP = '/tmp/claude-0/video-jogo'
rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true }); mkdirSync('scripts/posts', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 450, height: 960 }, deviceScaleFactor: 2, recordVideo: { dir: TMP, size: { width: 900, height: 1920 } } })
const p = await ctx.newPage()
p.on('pageerror', e => console.log('ERR', e.message))
await p.goto('file://' + resolve('scripts/prototipo-jogo-ao-vivo/index.html'))
await p.waitForFunction(() => window.__acabou === true, null, { timeout: 240000, polling: 500 })
await p.waitForTimeout(2500)
await ctx.close(); await b.close()
const webm = readdirSync(TMP).find(f => f.endsWith('.webm'))
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${TMP}/${webm}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'veryfast', '-movflags', '+faststart', 'scripts/posts/jogo-ao-vivo.mp4'])
console.log('🎬 scripts/posts/jogo-ao-vivo.mp4')
