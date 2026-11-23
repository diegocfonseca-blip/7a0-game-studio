// 🎮🔒 23/11: print do botão pequeno 'Manual 🔒' embaixo do placar (sem plano) e do que ele abre.
// uso: S=<pasta> node scripts/mapa3d/print-chip-manual.mjs
import { chromium } from 'playwright-core'
const S = process.env.S || '.'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5318, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5318/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
// a bancada não tem login, mas o Manual vem liberado nela: força "sem plano" trocando a régua só nesta página de teste
await p.route('**/planos-regras.ts*', async r => { const resp = await r.fetch(); const body = (await resp.text()).replace(/export function temManual\(([^)]*)\) \{/, 'export function temManual($1) { return false;'); await r.fulfill({ response: resp, body }) })
await p.goto('http://localhost:5318/scripts/teste-partida-oficial-3d/?round=9&speed=4&semplano=1', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click(); await p.waitForTimeout(6000)
const chip = p.locator('[data-manual-chip]').first()
console.log('botão embaixo do placar:', await chip.count())
await chip.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -40)); await p.waitForTimeout(600)
await p.screenshot({ path: S + '/chip-placar.png' })
await chip.click(); await p.waitForTimeout(1500)
await p.screenshot({ path: S + '/chip-aberto.png' })
await b.close(); await vite.close()
