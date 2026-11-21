// 🔬 21/11: A/B do custo de DESENHO do jogo 3D na bancada (placa simulada = proporção, não fps de celular). As variantes nolog/noaa
// precisam do gancho temporário no construtor do WebGLRenderer (window.__qaNoLog / __qaNoAA) — pôr só pra medir, não commitar.
import { chromium } from 'playwright-core'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5314, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const VARS = (process.argv[2] || 'base,nolog,noaa,noenv,lambert,nofog,semtorcida').split(',')
for (const v of VARS) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
  const p = await ctx.newPage()
  await p.addInitScript(v => {
    if (v === 'nolog' || v === 'tudo') window.__qaNoLog = true
    if (v === 'noaa' || v === 'tudo') window.__qaNoAA = true
    const G = { calls: 0, tris: 0, quadros: 0 }; window.__G = G
    for (const C of [window.WebGL2RenderingContext]) { const P = C.prototype
      const de = P.drawElements, da = P.drawArrays, dei = P.drawElementsInstanced, dai = P.drawArraysInstanced
      P.drawElements = function (m, c, ...r) { G.calls++; G.tris += c / 3; return de.call(this, m, c, ...r) }
      P.drawArrays = function (m, f, c) { G.calls++; G.tris += c / 3; return da.call(this, m, f, c) }
      P.drawElementsInstanced = function (m, c, t, o, n) { G.calls++; G.tris += c / 3 * n; return dei.call(this, m, c, t, o, n) }
      P.drawArraysInstanced = function (m, f, c, n) { G.calls++; G.tris += c / 3 * n; return dai.call(this, m, f, c, n) } }
    const raf = window.requestAnimationFrame
    window.requestAnimationFrame = cb => raf(t => { const c0 = G.calls; cb(t); if (G.calls > c0) G.quadros++ })
  }, v)
  await p.goto('http://localhost:5314/scripts/mapa3d/bancada.html', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.bancada && window.__api && document.querySelector('canvas'), null, { timeout: 180000 })
  await p.waitForTimeout(12000)
  await p.evaluate(() => window.bancada.jogar(20)); await p.waitForTimeout(7000)
  const info = await p.evaluate(v => {
    const { scene } = window.__api.qaCena(); let mats = new Map(), meshes = 0, vis = 0
    scene.traverse(o => { if (o.isMesh) { meshes++; for (const m of [].concat(o.material)) mats.set(m.type, (mats.get(m.type) || 0) + 1) } })
    if (v === 'noenv' || v === 'tudo') { scene.environment = null; scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) { m.envMapIntensity = 0; m.needsUpdate = true } }) }
    if (v === 'nofog' || v === 'tudo') { scene.fog = null; scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) m.needsUpdate = true }) }
    if (v === 'lambert' || v === 'tudo') scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (m.isMeshStandardMaterial) { m.roughness = 1; m.metalness = 0; m.normalMap = null; m.roughnessMap = null; m.metalnessMap = null; m.aoMap = null; m.needsUpdate = true } })
    if (v === 'semtorcida') scene.traverse(o => { if (/torcida|crowd|cadeira|seat/i.test(o.name)) o.visible = false })
    return { meshes, mats: Object.fromEntries(mats), objs: (() => { let n = 0; scene.traverse(() => n++); return n })(), luzes: (() => { const l = []; scene.traverse(o => { if (o.isLight) l.push(o.type + (o.visible ? '' : '(off)')) }); return l.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {}) })() }
  }, v)
  await p.waitForTimeout(3000)
  await p.evaluate(() => { const G = window.__G; G.calls = G.tris = G.quadros = 0 })
  await p.waitForTimeout(12000)
  const g = await p.evaluate(() => { const G = window.__G, c = document.querySelector('canvas'); return { fps: +(G.quadros / 12).toFixed(2), calls: Math.round(G.calls / Math.max(1, G.quadros)), tris: Math.round(G.tris / Math.max(1, G.quadros)), w: c.width, h: c.height } })
  console.log(v.padEnd(11), JSON.stringify(g), v === VARS[0] ? JSON.stringify(info) : '')
  await ctx.close()
}
await b.close(); await vite.close()
