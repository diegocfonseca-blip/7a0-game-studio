// prints das 3 cenas a 412px: node scripts/teste-placar-grande/print.mjs <porta> <pasta-saida>
import { chromium } from 'playwright-core'
const [, , porta = '5260', out = '/tmp'] = process.argv
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 700 }, deviceScaleFactor: 2 })
for (const [cena, res] of [['rolando', 'd'], ['gol', 'd'], ['fim', 'v'], ['fim', 'd']]) {
  await p.goto(`http://localhost:${porta}/scripts/teste-placar-grande/index.html?cena=${cena}&res=${res}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${out}/placar-${cena}-${res}.png`, fullPage: true })
}
await b.close(); console.log('ok')
