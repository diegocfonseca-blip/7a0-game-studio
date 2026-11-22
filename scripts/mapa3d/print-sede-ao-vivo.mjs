// 🎥 22/11: confere a cena do bairro passando AO VIVO no quadro da Central (o mapa de verdade no lugar da foto parada).
// uso: S=<pasta> node scripts/mapa3d/print-sede-ao-vivo.mjs
import { chromium } from 'playwright-core'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5319, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
const erros = []; p.on('pageerror', e => { erros.push(e.message.slice(0, 300)); console.log('PAGEERR', e.message.slice(0, 300)) })
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5319/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
// a cena do bairro ainda é só da conta do Diego: na bancada, liga a prévia
await p.route('**/sport.ts*', async r => { const resp = await r.fetch(); const body = (await resp.text()).replace(/const NOVIDADES_17_11_GERAL = false/, 'const NOVIDADES_17_11_GERAL = true'); await r.fulfill({ response: resp, body }) })
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt'); localStorage.removeItem('esc-sede-fechada') })
await p.goto('http://localhost:5319/scripts/teste-partida-oficial-3d/?round=' + (process.env.ROUND || 9) + '&speed=4', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click(); await p.waitForTimeout(36000) // o jogo de abertura termina
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click(); await p.waitForTimeout(2500); await skipPress()
const S = process.env.S || '.'
const tem = await p.locator('.ll-c-sede').count(), vivo = await p.locator('[data-sede-ao-vivo]').count()
console.log(JSON.stringify({ cartoes: tem, aoVivo: vivo, texto: tem ? (await p.locator('.ll-c-sede').first().innerText().catch(() => '')).slice(0, 200) : '' }))
if (vivo) {
  await p.locator('[data-sede-ao-vivo]').first().scrollIntoViewIfNeeded()
  for (const [i, ms] of [[1, 6000], [2, 9000]]) { await p.waitForTimeout(ms); await p.screenshot({ path: `${S}/sede-ao-vivo-${i}.png` }) }
  const canvas = await p.evaluate(() => { const c = document.querySelector('[data-sede-ao-vivo] canvas'); return c ? { w: c.clientWidth, h: c.clientHeight } : null })
  console.log('canvas', JSON.stringify(canvas))
} else await p.screenshot({ path: `${S}/sede-sem-cena.png`, fullPage: true })
console.log('erros', erros.length)
await b.close(); await vite.close()
