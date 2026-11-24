import { chromium } from 'playwright-core'
const PORTA = 5301
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const temas = ['liberta','relampago']
for (const t of temas) for (const sem of [false, true]) {
  const p = await b.newPage({ viewport: { width: 390, height: 760 } })
  p.on('pageerror', e => console.log('ERRO', t, String(e).slice(0, 200)))
  await p.goto(`http://localhost:${PORTA}/scripts/teste-formacoes/cinema.html?tema=${t}${sem ? '&sem=1' : ''}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(7300)
  await p.screenshot({ path: `/tmp/claude-0/cine/${t}${sem ? '-sem' : ''}.png` })
  await p.close()
}
await b.close(); await vite.close()
