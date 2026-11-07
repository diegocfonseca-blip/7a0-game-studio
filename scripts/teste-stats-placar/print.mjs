// fotos 390×844 ×2 da bancada das estatísticas no placar cinema:
//   npx vite --port 5277 &  →  node scripts/teste-stats-placar/print.mjs 5277 scripts/mockups
import { chromium } from 'playwright-core'
const [, , porta = '5277', out = 'scripts/mockups'] = process.argv
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
for (const [modo, min, nome] of [['sala', 93, 'stats-placar-sala'], ['carreira', 93, 'stats-placar-carreira'], ['sala', 70, 'stats-placar-sala-70min']]) {
  await p.goto(`http://localhost:${porta}/7a0-game-studio/scripts/teste-stats-placar/index.html?modo=${modo}&min=${min}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(7000)
  const tem = await p.locator('[data-stats-placar]').count()
  console.log(nome, 'resumo na tela:', tem)
  await p.screenshot({ path: `${out}/${nome}.png` })
}
await b.close()
