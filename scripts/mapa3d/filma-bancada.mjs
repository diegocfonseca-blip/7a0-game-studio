// 🎞️ 22/11: filma a partida 3D da BANCADA (scripts/mapa3d/bancada.html) com relógio falso, sem passar pela carreira — é o jeito
// rápido de olhar domínio, passe, chute, bola e câmera. Salva um quadro a cada PASSO quadros e os dados do `inspect()`.
// uso: S=<pasta> [T0=20] [N=240] [HZ=30] [PASSO=6] [MODO=cel|pc] [CAM=tv] node scripts/mapa3d/filma-bancada.mjs
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const S = process.env.S || '.', N = +(process.env.N || 240), HZ = +(process.env.HZ || 30), PASSO = +(process.env.PASSO || 6), T0 = +(process.env.T0 || 20), modo = process.env.MODO || 'cel'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5316, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext(modo === 'cel' ? { viewport: { width: 390, height: 780 }, deviceScaleFactor: +(process.env.DPR || 1.5), hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } })
const p = await ctx.newPage(); p.setDefaultTimeout(60000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 300)))
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
await p.goto(`http://localhost:5316/scripts/mapa3d/bancada.html${process.env.Q ? '?' + process.env.Q : ''}`, { waitUntil: 'domcontentloaded', timeout: 180000 })
await p.waitForFunction(() => window.bancada && document.querySelector('canvas'), null, { timeout: 240000 })
await p.waitForFunction(() => window.bancada.ready(), null, { timeout: 240000 })
await p.waitForTimeout(+(process.env.ESPERA || 20000))
if (process.env.CAM) await p.evaluate(c => window.bancada.camera(c), process.env.CAM)
await p.clock.install()
await p.evaluate(t => window.bancada.jogar(t), T0)
await p.clock.pauseAt(new Date(Date.now() + 1000))
const dados = []
for (let i = 0; i < N; i++) {
  await p.clock.runFor(1000 / HZ)
  if (i % PASSO) continue
  const d = await p.evaluate(() => { const a = window.bancada.inspect(); const m = a?.match; return { t: performance.now(), cam: a?.camera ?? a?.matchCamera, bola: m?.ball, det: m?.detail } })
  dados.push(d)
  await p.screenshot({ path: `${S}/q${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 78 })
  if (i % 60 === 0) console.log('quadro', i)
}
fs.writeFileSync(`${S}/dados.json`, JSON.stringify(dados))
await b.close(); await vite.close(); process.exit(0)
