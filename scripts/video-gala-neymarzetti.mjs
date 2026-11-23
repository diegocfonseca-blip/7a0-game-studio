// 🎬 Grava a gala nova do Neymarzetti (gala-neymarzetti.tsx) num celular, pra o Diego aprovar antes de ligar no jogo.
// uso: node scripts/video-gala-neymarzetti.mjs  → scripts/mockups/gala-neymarzetti-v2.mp4
import { chromium } from 'playwright-core'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
const PORTA = '5287', DIR = '/tmp/gala-nz-video'
rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const fim = c => { try { process.kill(-vite.pid) } catch {} ; process.exit(c) }
for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://localhost:${PORTA}/`)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const W = 420, H = 860, FPS = 30
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: 'pt-BR' })
await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(async () => {
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const G = await import('/src/escalacao/gala-neymarzetti.tsx')
  document.getElementById('root')?.remove()
  document.body.innerHTML = '<div id="x"></div>'
  document.body.style.cssText = 'margin:0;background:#F4ECD6'
  createRoot(document.getElementById('x')).render(React.createElement(G.GalaNeymarzetti, { clube: 'Neymarzetti', chave: 'k1', mostra: 'Neymarzetti', grito: 'NEYMARZETTI' }))
  await new Promise(r => setTimeout(r, 300))
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})))
  await document.fonts.ready
  window.__ir = t => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t } }
})
// quadro a quadro: o relógio das animações é posto na mão, então o vídeo sai liso e no tempo certo
const N = Math.round(9.0 * FPS)
for (let i = 0; i < N; i++) {
  await p.evaluate(t => window.__ir(t), i * 1000 / FPS)
  await p.screenshot({ path: `${DIR}/f${String(i).padStart(4, '0')}.png` })
}
await b.close()
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${DIR}/f%04d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', 'scripts/mockups/gala-neymarzetti-v2.mp4'])
console.log('🎬 scripts/mockups/gala-neymarzetti-v2.mp4')
fim(0)
