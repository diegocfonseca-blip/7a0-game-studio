import { chromium } from 'playwright-core'
const PORTA = 5299
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const w of [390, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 })
  p.on('pageerror', e => console.log('ERRO', String(e).slice(0, 300)))
  await p.goto(`http://localhost:${PORTA}/scripts/teste-formacoes/quiz.html`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
  await p.screenshot({ path: `/tmp/claude-0/quiz-${w}.png` })
  const btns = p.locator('button', { hasText: /.+/ })
  await btns.nth(1).click(); await p.waitForTimeout(500)
  await p.screenshot({ path: `/tmp/claude-0/quiz-${w}-resp.png` })
  await p.close()
}
await b.close(); await vite.close()
