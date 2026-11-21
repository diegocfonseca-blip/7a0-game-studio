// ⏩ 21/11: confere o "Pular pro jogo" da Central — 1 toque tem de chegar na pergunta 2D/3D/placar rápido, rodada após rodada, sem erro.
// uso: [N=6] node scripts/mapa3d/testa-pular-central.mjs
import { chromium } from 'playwright-core'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5317, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, hasTouch: true, isMobile: true })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
const erros = []; p.on('pageerror', e => { erros.push(e.message.slice(0, 300)); console.log('PAGEERR', e.message.slice(0, 300)) })
p.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 200)) })
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5317/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
await p.goto('http://localhost:5317/scripts/teste-partida-oficial-3d/?round=' + (process.env.ROUND || 9) + '&speed=4', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
const central = () => p.getByRole('button', { name: 'Central', exact: true }).last().click()
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
const rapido = p.getByRole('button', { name: /placar rápido/i }), pular = p.getByRole('button', { name: /Pular pro jogo/i })
const res = []
for (let k = 0; k < +(process.env.N || 6); k++) {
  await central(); await p.waitForTimeout(1500); await skipPress()
  let toques = 0, ok = false
  for (let i = 0; i < 12; i++) {
    if (await rapido.count()) { ok = true; break }
    await skipPress()
    if (await pular.count()) { await pular.first().click().catch(() => {}); toques++ }
    await p.waitForTimeout(1800)
  }
  const tela = await p.evaluate(() => document.body.innerText.slice(0, 160).replace(/\n/g, ' | '))
  res.push({ k, toques, ok }); console.log(JSON.stringify({ k, toques, ok, tela: ok ? undefined : tela }))
  if (!ok) { await p.screenshot({ path: (process.env.S || '.') + `/pular-falha-${k}.png` }); break }
  await rapido.first().click(); await p.waitForTimeout(1500)
  const comeca = p.getByRole('button', { name: /Começar o jogo/i }); if (await comeca.count()) await comeca.first().click()
  await p.waitForTimeout(+(process.env.JOGO || 38000))
}
console.log('RESUMO', JSON.stringify(res), 'erros', erros.length)
await b.close(); await vite.close()
