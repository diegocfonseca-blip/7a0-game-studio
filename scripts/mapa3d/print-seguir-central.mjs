// 🧭 22/11: confere (1) escolher 2D/placar na Central chega na aba Jogos no AUTO, mesmo com o Manual guardado; (2) depois do apito,
// no automático, aparece "Seguir pra Central". uso: S=<pasta> node scripts/mapa3d/print-seguir-central.mjs
import { chromium } from 'playwright-core'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5321, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
const erros = []; p.on('pageerror', e => { erros.push(e.message.slice(0, 300)); console.log('PAGEERR', e.message.slice(0, 300)) })
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5321/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt'); localStorage.setItem('esc-sim-manual', '1') }) // começa com o MANUAL guardado
await p.goto('http://localhost:5321/scripts/teste-partida-oficial-3d/?round=9&speed=4', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
const S = process.env.S || '.'
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click(); await p.waitForTimeout(36000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click(); await p.waitForTimeout(2000); await skipPress()
const rapido = p.getByRole('button', { name: /placar/i }), pular = p.getByRole('button', { name: /Pular pro jogo|Seguir/i })
for (let i = 0; i < 12 && !(await rapido.count()); i++) { await skipPress(); if (await pular.count()) await pular.first().click().catch(() => {}); await p.waitForTimeout(1500) }
console.log('pergunta na Central:', await rapido.count())
await rapido.first().click(); await p.waitForTimeout(1500)
const manualGuardado = await p.evaluate(() => localStorage.getItem('esc-sim-manual'))
const temProxima = await p.getByRole('button', { name: /Próxima rodada|Deixa a rodada acabar|Pular/i }).count()
console.log(JSON.stringify({ aoChegar: { manualGuardado, botoesDoManual: temProxima, comecar: await p.getByRole('button', { name: /Começar o jogo/i }).count() } }))
await p.screenshot({ path: `${S}/jogos-chega-auto.png` })
const comeca = p.getByRole('button', { name: /Começar o jogo/i }); if (await comeca.count()) await comeca.first().click()
let achou = 0
for (let i = 0; i < 40 && !achou; i++) { await p.waitForTimeout(2000); achou = await p.locator('[data-seguir-central]').count() }
console.log('seguir depois do apito:', achou)
if (achou) { await skipPress(); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelector('[data-seguir-central]')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500); console.log('visivel:', await p.locator('[data-seguir-central]').first().isVisible()); await p.screenshot({ path: `${S}/jogos-seguir-central.png` }); await p.evaluate(() => document.querySelector('[data-seguir-central]').click()); await p.waitForTimeout(1500); await skipPress(); await p.waitForTimeout(1200)
  console.log('depois do toque:', (await p.evaluate(() => document.body.innerText.slice(0, 120))).replace(/\n/g, ' | ')) }
else await p.screenshot({ path: `${S}/jogos-sem-seguir.png` })
console.log('erros', erros.length)
await b.close(); await vite.close()
