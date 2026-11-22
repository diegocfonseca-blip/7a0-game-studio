// 🎞️ 21/11: filma o jogo 3D da carreira QUADRO A QUADRO com relógio falso (1/60 s por quadro), pra ver o que um aparelho que
// segura 60 quadros/s mostra de verdade — sem depender da velocidade da bancada. Também anota onde cada boneco e a câmera estão.
// uso: S=<pasta> [N=360] [HZ=60] node scripts/mapa3d/filma-quadro-a-quadro.mjs
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const S = process.env.S || '.', N = +(process.env.N || 360), HZ = +(process.env.HZ || 60)
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5314, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5314/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.clock.install()
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('esc-sim-manual', '1'); localStorage.setItem('esc-diag', '1'); window.__qaSim = [] })
await p.goto('http://localhost:5314/scripts/teste-partida-oficial-3d/?round=9&speed='+(process.env.SPEED||1)+(process.env.NITIDEZ?'&nitidez=1':''), { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 }); console.log('carreira carregada')
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.click() }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click()
await p.waitForTimeout(30000 * Math.max(1, 4 / +(process.env.SPEED || 1)) + 15000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
const choice = p.getByRole('button', { name: '🏟️ Campo 3D', exact: true }), skip = p.getByRole('button', { name: /Pular pro jogo/i })
for (let i = 0; i < 40 && !await choice.count(); i++) { await skipPress(); if (await skip.count()) await skip.first().click(); await p.waitForTimeout(700) }
await choice.waitFor({ state: 'visible', timeout: 240000 }); await choice.click(); console.log('escolheu 3D')
const start = p.getByRole('button', { name: '▶ Começar o jogo', exact: true })
await start.waitFor({ state: 'visible', timeout: 240000 }); await start.click(); console.log('começou')
await p.waitForFunction(() => window.qaMatch?.minute > 0, null, { timeout: 180000 })
await p.waitForTimeout(+(process.env.ESPERA || 8000))
const alvo = p.locator('canvas').first()
const box = await p.evaluate(() => { const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0]; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
await p.clock.pauseAt(new Date(Date.now() + 1000))
const dados = []
for (let i = 0; i < N; i++) {
  await p.clock.runFor(1000 / HZ)
  const d = await p.evaluate(() => { const a = window.__mapaApi?.inspect?.(); const m = a?.match; const sim = window.__qaSim.splice(0); return { t: performance.now(), sim, min: window.qaMatch?.minute, cam: a?.camera ?? a?.matchCamera, bola: m?.ball, pl: m?.players?.slice?.(0, 22) } })
  dados.push(d)
  await p.screenshot({ path: `${S}/q${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 80, clip: box })
  if (i % 60 === 0) console.log('quadro', i)
}
fs.writeFileSync(`${S}/dados.json`, JSON.stringify(dados))
await b.close(); await vite.close()
