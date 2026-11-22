// 🔬 21/11: mede o quadro do JOGO 3D no mapa — desenhos e triângulos por quadro (direto no WebGL), tamanho da imagem, e onde o
// processador gasta (perfil JS). uso: S=<pasta> node scripts/mapa3d/perfil-jogo.mjs <cel|pc> [varzea]
import { chromium } from 'playwright-core'
const modo = process.argv[2] || 'cel', varzea = process.argv.includes('varzea')
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5311, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext(modo === 'cel' ? { viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } })
const p = await ctx.newPage()
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.addInitScript(() => {
  const G = { calls: 0, tris: 0, quadros: 0, fb: 0, tick: [] }; window.__G = G
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue; const P = C.prototype
    const de = P.drawElements, da = P.drawArrays, dei = P.drawElementsInstanced, dai = P.drawArraysInstanced, bf = P.bindFramebuffer
    P.drawElements = function (m, c, ...r) { G.calls++; G.tris += c / 3; return de.call(this, m, c, ...r) }
    P.drawArrays = function (m, f, c) { G.calls++; G.tris += c / 3; return da.call(this, m, f, c) }
    if (dei) P.drawElementsInstanced = function (m, c, t, o, n) { G.calls++; G.tris += c / 3 * n; return dei.call(this, m, c, t, o, n) }
    if (dai) P.drawArraysInstanced = function (m, f, c, n) { G.calls++; G.tris += c / 3 * n; return dai.call(this, m, f, c, n) }
    P.bindFramebuffer = function (t, f) { G.fb++; return bf.call(this, t, f) } }
  const raf = window.requestAnimationFrame
  window.requestAnimationFrame = cb => raf(t => { const a = performance.now(), c0 = G.calls; cb(t); if (G.calls > c0) { G.quadros++; G.tick.push(performance.now() - a) } })
})
await p.goto(`http://localhost:5311/scripts/mapa3d/bancada.html${varzea ? '?varzea' : ''}`, { waitUntil: 'domcontentloaded' })
await p.waitForFunction(() => window.bancada && document.querySelector('canvas'), null, { timeout: 180000 })
await p.waitForTimeout(15000)
await p.evaluate(() => { window.bancada.jogar(20) })
await p.waitForTimeout(8000)
const cdp = await ctx.newCDPSession(p)
await p.evaluate(() => { const G = window.__G; G.calls = G.tris = G.quadros = G.fb = 0; G.tick = [] })
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 400 }); await cdp.send('Profiler.start')
await p.waitForTimeout(10000)
const { profile } = await cdp.send('Profiler.stop')
const g = await p.evaluate(() => { const G = window.__G, c = document.querySelector('canvas'); const t = [...G.tick].sort((a, b) => a - b); return { quadros: G.quadros, calls: Math.round(G.calls / Math.max(1, G.quadros)), tris: Math.round(G.tris / Math.max(1, G.quadros)), passes: +(G.fb / Math.max(1, G.quadros)).toFixed(1), tickMed: +(t[t.length >> 1] || 0).toFixed(1), tickP95: +(t[Math.floor(t.length * .95)] || 0).toFixed(1), w: c.width, h: c.height, css: [c.clientWidth, c.clientHeight] } })
const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map(n => [n.id, n]))
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-1)[0].split('?')[0]}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)) })
const tot = [...self.values()].reduce((a, c) => a + c, 0)
const top = [...self.entries()].sort((a, c) => c[1] - a[1]).slice(0, 45).map(([k, v]) => `${(100 * v / tot).toFixed(1).padStart(5)}%  ${k}`)
const arq = new Map(); for (const [k, v] of self) { const f = k.split(' ').pop().split(':')[0]; arq.set(f, (arq.get(f) || 0) + v) }
const topArq = [...arq.entries()].sort((a, c) => c[1] - a[1]).slice(0, 20).map(([k, v]) => `${(100 * v / tot).toFixed(1).padStart(5)}%  ${k}`)
console.log(JSON.stringify({ modo, varzea, ...g }))
console.log('--- por arquivo'); console.log(topArq.join('\n')); console.log('--- funções'); console.log(top.join('\n'))
await p.screenshot({ path: `${process.env.S || '.'}/quadro-${modo}${varzea ? '-varzea' : ''}.png` })
await b.close(); await vite.close()
