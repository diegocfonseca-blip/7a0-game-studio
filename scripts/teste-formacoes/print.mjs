import { chromium } from 'playwright-core'
const PORTA = 5298
process.chdir('/home/user/7a0-game-studio')
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' }); await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} }); const p = await ctx.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(4000)
await p.getByText('LEILÃO LEGENDS 38').first().click(); await p.waitForTimeout(5000)
await p.getByText('JOGAR AGORA').first().click(); await p.waitForTimeout(3000)
await p.getByText('🃏 O TIME').first().click(); await p.waitForTimeout(600)
const f = p.getByText('4-5-1', { exact: true }).first(); await f.scrollIntoViewIfNeeded(); await f.click(); await p.waitForTimeout(400)
await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(200)
await p.screenshot({ path: '/tmp/claude-0/f451/rapida-celular.png' })
for (const w of [390, 1280]) {
  const q = await b.newPage({ viewport: { width: w, height: w > 800 ? 800 : 844 } }); q.on('pageerror', e => console.log('ERRO', String(e).slice(0, 400)))
  await q.goto(`http://localhost:${PORTA}/scripts/teste-formacoes/index.html`, { waitUntil: 'networkidle' }); await q.waitForTimeout(2500)
  try { await q.getByText('3-5-2', { exact: true }).first().click({ timeout: 3000 }); await q.waitForTimeout(400) } catch { console.log('3-5-2 travado') }
  await q.screenshot({ path: `/tmp/claude-0/f451/copa-${w}.png` }); await q.close()
}
await b.close(); await vite.close()
