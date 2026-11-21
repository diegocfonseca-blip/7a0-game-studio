// 🔬 21/11: o MESMO perfil do perfil-jogo.mjs, mas na CARREIRA DE VERDADE (Central → 🏟️ Campo 3D → ▶ Começar o jogo), que é
// o caminho do jogador. Mede desenhos/triângulos por quadro, tamanho da imagem, quadros por segundo e onde o processador gasta.
// uso: S=<pasta> node scripts/mapa3d/perfil-carreira.mjs <cel|pc>
import { chromium } from 'playwright-core'
const modo = process.argv[2] || 'cel'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5313, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', ...(modo === 'cel' ? { viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } }) })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5313/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => {
  localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('esc-sim-manual', '1')
  const G = { calls: 0, tris: 0, quadros: 0, tick: [], gap: [], ult: 0, react: 0, por: new Map() }; window.__G = G; const conta = (gl, t) => { const c = gl.canvas; let x = G.por.get(c); if (!x) G.por.set(c, x = { calls: 0, tris: 0 }); x.calls++; x.tris += t }
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue; const P = C.prototype
    const de = P.drawElements, da = P.drawArrays, dei = P.drawElementsInstanced, dai = P.drawArraysInstanced
    P.drawElements = function (m, c, ...r) { G.calls++; G.tris += c / 3; conta(this, c / 3); return de.call(this, m, c, ...r) }
    P.drawArrays = function (m, f, c) { G.calls++; G.tris += c / 3; return da.call(this, m, f, c) }
    if (dei) P.drawElementsInstanced = function (m, c, t, o, n) { G.calls++; G.tris += c / 3 * n; conta(this, c / 3 * n); return dei.call(this, m, c, t, o, n) }
    if (dai) P.drawArraysInstanced = function (m, f, c, n) { G.calls++; G.tris += c / 3 * n; return dai.call(this, m, f, c, n) } }
  const raf = window.requestAnimationFrame
  window.requestAnimationFrame = cb => raf(t => { const a = performance.now(), c0 = G.calls; cb(t); if (G.calls > c0) { G.quadros++; G.tick.push(performance.now() - a); if (G.ult) G.gap.push(a - G.ult); G.ult = a } })
})
await p.goto('http://localhost:5313/scripts/teste-partida-oficial-3d/?round=9', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 }); console.log('carreira carregada')
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.click() }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click()
await p.waitForTimeout(30000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
const choice = p.getByRole('button', { name: '🏟️ Campo 3D', exact: true }), skip = p.getByRole('button', { name: /Pular pro jogo/i })
for (let i = 0; i < 40 && !await choice.count(); i++) { await skipPress(); if (await skip.count()) await skip.first().click(); await p.waitForTimeout(700) }
await choice.waitFor({ state: 'visible', timeout: 90000 }); await choice.click(); console.log('escolheu 3D')
const start = p.getByRole('button', { name: '▶ Começar o jogo', exact: true })
await start.waitFor({ state: 'visible', timeout: 240000 }); await start.click(); console.log('começou')
await p.waitForFunction(() => window.qaMatch?.minute > 0, null, { timeout: 180000 })
await p.waitForTimeout(6000)
const cdp = await ctx.newCDPSession(p)
await p.evaluate(() => { const G = window.__G; G.calls = G.tris = G.quadros = 0; G.tick = []; G.gap = []; G.ult = 0; G.por.clear() })
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 400 }); await cdp.send('Profiler.start')
await p.waitForTimeout(12000)
const { profile } = await cdp.send('Profiler.stop')
const g = await p.evaluate(() => { const G = window.__G, c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; const s = a => [...a].sort((x, y) => x - y), t = s(G.tick), q = s(G.gap); return { quadros: G.quadros, calls: Math.round(G.calls / Math.max(1, G.quadros)), tris: Math.round(G.tris / Math.max(1, G.quadros)), tickMed: +(t[t.length >> 1] || 0).toFixed(1), tickP95: +(t[Math.floor(t.length * .95)] || 0).toFixed(1), gapMed: +(q[q.length >> 1] || 0).toFixed(0), gapP95: +(q[Math.floor(q.length * .95)] || 0).toFixed(0), w: c.width, h: c.height, css: [c.clientWidth, c.clientHeight], canvases: [...document.querySelectorAll('canvas')].map(k => ({ w: k.width, h: k.height, css: [k.clientWidth, k.clientHeight], na: k.isConnected, calls: G.por.get(k)?.calls ?? 0, tris: Math.round(G.por.get(k)?.tris ?? 0), onde: (k.closest('[class]')?.className || '').toString().slice(0, 40) })), soltos: [...G.por.entries()].filter(([k]) => !k.isConnected).map(([k, x]) => ({ w: k.width, h: k.height, calls: x.calls, tris: Math.round(x.tris) })), dom: document.querySelectorAll('*').length, mapa: (m => m && { players: m.players, detail: m.detail && { full: m.detail.full, intermediate: m.detail.intermediate, far: m.detail.far, hidden: m.detail.hidden } })(window.__mapaApi?.inspect?.()?.match) } })
const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map(n => [n.id, n]))
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-1)[0].split('?')[0]}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)) })
const tot = [...self.values()].reduce((a, c) => a + c, 0)
const top = [...self.entries()].sort((a, c) => c[1] - a[1]).slice(0, 45).map(([k, v]) => `${(100 * v / tot).toFixed(1).padStart(5)}%  ${k}`)
const arq = new Map(); for (const [k, v] of self) { const f = k.split(' ').pop().split(':')[0]; arq.set(f, (arq.get(f) || 0) + v) }
const topArq = [...arq.entries()].sort((a, c) => c[1] - a[1]).slice(0, 22).map(([k, v]) => `${(100 * v / tot).toFixed(1).padStart(5)}%  ${k}`)
console.log(JSON.stringify({ modo, ...g }))
console.log('--- por arquivo'); console.log(topArq.join('\n')); console.log('--- funções'); console.log(top.join('\n'))
await p.screenshot({ path: `${process.env.S || '.'}/carreira-${modo}.png` })
await b.close(); await vite.close()
