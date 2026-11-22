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
await p.evaluate(([t, real]) => real ? window.bancada.jogarReal(t) : window.bancada.jogar(t), [T0, !process.env.DEGRAU]) // (padrão: relógio do jogo de verdade; DEGRAU=1 = o jeito antigo da bancada)
await p.clock.pauseAt(new Date(Date.now() + 1000))
const dados = []
for (let i = 0; i < N; i++) {
  await p.clock.runFor(1000 / HZ)
  if (i % PASSO && !process.env.NUMEROS) continue
  // NUMEROS=1: só os números de cada quadro (bola, fase, dono e o movimento de cada boneco), sem foto — pra medir pulo, bola parada, câmera lenta
  if (process.env.NUMEROS) { dados.push(await p.evaluate(() => { const m = window.bancada.inspect()?.match, f = m?.detail?.football; return { t: m?.time, fase: m?.phase, dono: m?.owner, rep: m?.replay, b: m?.ball && [m.ball.x, m.ball.y, m.ball.z, m.ball.presentation?.x, m.ball.presentation?.y, m.ball.presentation?.z], mq: f?.motionQuality?.map(q => [q.key.slice(0, 40), +q.speed.toFixed(2), +q.angleDegrees.toFixed(0), q.unplannedJump ? 1 : 0, q.clip, +(q.weight || 0).toFixed(2)]), nav: f?.navigation && [f.navigation.pushes, +f.navigation.maxOffset.toFixed(2), f.navigation.unresolved.length], gr: f?.grounding?.length, cor: f?.corrections?.length, gdd: f?.groundDeliveryDivergence } })); if (i % 300 === 0) console.log('quadro', i); continue }
  const d = await p.evaluate(() => { const a = window.bancada.inspect(); const m = a?.match; return { t: performance.now(), cam: a?.camera ?? a?.matchCamera, bola: m?.ball, det: m?.detail } })
  dados.push(d)
  // RECORTE=<px>: recorta um quadrado em volta da BOLA (pra julgar domínio, passe e chute de perto)
  let clip
  if (process.env.RECORTE) { const r = +process.env.RECORTE; const c = await p.evaluate(() => {
    const a = window.bancada.inspect(), cv = document.querySelector('canvas'), q0 = a?.match?.ball; if (!a?.camera || !a?.target || !q0 || !cv) return null
    const q = q0.presentation ?? q0, C = a.camera, T = a.target, sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2], cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], nrm = u => { const l = Math.hypot(...u) || 1; return u.map(x => x / l) }
    const f = nrm(sub(T, C)), rt = nrm(cross(f, [0, 1, 0])), up = cross(rt, f), d = sub([q.x, q.y, q.z], C), z = dot(d, f); if (z <= .1) return null
    const b = cv.getBoundingClientRect(), th = Math.tan((a.cameraFov || 46) * Math.PI / 360), nx = dot(d, rt) / (z * th * (b.width / b.height)), ny = dot(d, up) / (z * th)
    return { x: b.x + (nx + 1) / 2 * b.width, y: b.y + (1 - ny) / 2 * b.height, w: innerWidth, h: innerHeight } })
    if (c) clip = { x: Math.max(0, Math.min(c.w - r, c.x - r / 2)), y: Math.max(0, Math.min(c.h - r, c.y - r / 2)), width: r, height: r } }
  await p.screenshot({ path: `${S}/q${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 80, ...(clip ? { clip } : {}) })
  if (i % 60 === 0) console.log('quadro', i)
}
fs.writeFileSync(`${S}/dados.json`, JSON.stringify(dados))
await b.close(); await vite.close(); process.exit(0)
