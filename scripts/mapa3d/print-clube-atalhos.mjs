// 🧭 22/11: confere a aba Clube com os atalhos embaixo do mapa e, no jogo 3D, só o mapa (celular e computador).
// uso: S=<pasta> [W=390 H=820] node scripts/mapa3d/print-clube-atalhos.mjs
import { chromium } from 'playwright-core'
const S = process.env.S || '.', W = process.env.W || 390
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5322, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: +(process.env.W||390), height: +(process.env.H||820) }, deviceScaleFactor: 2, hasTouch: +(process.env.W||390) < 700, isMobile: +(process.env.W||390) < 700 })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5322/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
await p.goto('http://localhost:5322/scripts/teste-partida-oficial-3d/?round=9&speed=4', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click(); await p.waitForTimeout(36000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
await p.getByRole('button', { name: 'Clube', exact: true }).last().click(); await p.waitForTimeout(9000)
await p.evaluate(() => document.querySelector('.clube-atalhos')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(800)
console.log('atalhos:', await p.evaluate(() => [...document.querySelectorAll('.clube-atalhos button')].map(b => b.textContent + (b.querySelector('em') ? '•' : ''))), await p.evaluate(() => document.querySelector('.clube-atalhos-obra')?.textContent))
await p.screenshot({ path: S + `/clube-atalhos-${W}.png` })
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
const choice = p.getByRole('button', { name: /Campo 3D|3D/ }).first(), skip = p.getByRole('button', { name: /Pular pro jogo|Seguir/i })
for (let i = 0; i < 40 && !await choice.count(); i++) { await skipPress(); if (await skip.count()) await skip.first().click().catch(() => {}); await p.waitForTimeout(900) }
await choice.click(); const start = p.getByRole('button', { name: '▶ Começar o jogo', exact: true })
await start.waitFor({ state: 'visible', timeout: 240000 }); await start.click()
await p.waitForFunction(() => window.qaMatch?.minute > 3, null, { timeout: 180000 })
await p.evaluate(() => document.querySelector('[data-voltar-central]')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(1200)
console.log('assistindo:', await p.evaluate(() => document.querySelector('.pc3-review')?.getAttribute('data-watching-match')), 'altura:', await p.evaluate(() => document.querySelector('.pc3-stage')?.clientHeight), 'atalhos visíveis:', await p.evaluate(() => !!document.querySelector('.clube-atalhos')?.offsetParent), 'lista visível:', await p.evaluate(() => !!document.querySelector('.clube-organizacao-acessos,.clube-oficial-lista')?.offsetParent))
await p.screenshot({ path: S + `/clube-jogo-${W}.png` })
await b.close(); await vite.close()
