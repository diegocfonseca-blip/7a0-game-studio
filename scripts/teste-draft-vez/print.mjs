import { chromium } from 'playwright-core'
const PORTA = 5297
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [v, w, clica] of [['minha', 390, false], ['outro', 390, true], ['esgotado', 390, false], ['outro', 1280, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 800 ? 800 : 844 }, deviceScaleFactor: 1 })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-draft-vez/index.html?v=${v}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  if (clica) { await p.getByText('Pular a vez dele').click(); await p.waitForTimeout(400) }
  await p.screenshot({ path: `/tmp/claude-0/bet/draft-${v}-${w}.png`, fullPage: false })
  await p.close()
}
await b.close(); await vite.close()
