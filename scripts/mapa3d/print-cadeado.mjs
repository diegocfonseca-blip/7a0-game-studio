// 🔒 21/11: tira print do cadeado do Manual (aba Jogos e mapa 3D) e confere que o Substituir do mapa abre a aba Elenco.
// uso: S=<pasta> node scripts/mapa3d/print-cadeado.mjs
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
const cad = p.locator('.ll-cx-controle').filter({ hasText: /Manual e velocidade/i }).first()
console.log('cadeado na aba Jogos:', await cad.count())
if (await cad.count()) { await cad.scrollIntoViewIfNeeded(); await p.screenshot({ path: S + '/jogos-cadeado.png' }); await cad.locator('button').first().click(); await p.waitForTimeout(600); await cad.scrollIntoViewIfNeeded(); await p.screenshot({ path: S + '/jogos-cadeado-aberto.png' }); await cad.locator('button').first().click() }
await p.waitForTimeout(32000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
const choice = p.getByRole('button', { name: '🏟️ Campo 3D', exact: true }), skip = p.getByRole('button', { name: /Pular pro jogo/i })
for (let i = 0; i < 40 && !await choice.count(); i++) { await skipPress(); if (await skip.count()) await skip.first().click().catch(() => {}); await p.waitForTimeout(900) }
await choice.click(); const start = p.getByRole('button', { name: '▶ Começar o jogo', exact: true })
await start.waitFor({ state: 'visible', timeout: 240000 }); await start.click()
await p.waitForFunction(() => window.qaMatch?.minute > 2, null, { timeout: 180000 })
const sub = p.locator('[data-substituir-mapa]'); await sub.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500)
await p.screenshot({ path: S + '/mapa-cadeado.png' })
await sub.click(); await p.waitForTimeout(1500); await p.screenshot({ path: S + '/apos-substituir.png' })
console.log('depois do Substituir:', await p.evaluate(() => document.querySelector('h1,h2')?.textContent + ' | ' + document.body.innerText.slice(0, 200).replace(/\n/g, ' | ')))
await b.close(); await vite.close()
