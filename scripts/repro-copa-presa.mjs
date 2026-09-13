// 🧪 REPRO: Copa presa no 1' (13/09, caso do Sentidos Unidos — save antigo sem
// `careerHalftime`/`careerPenalty`). Carrega um save de carreira solo no
// localStorage, aperta "Continuar carreira" e mede se o relógio da Copa anda.
//   node scripts/repro-copa-presa.mjs <save.json> [url]
// Sai com código 1 se o relógio ficou preso (não passou de 5') em ~12s.
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const [saveFile, url = 'http://localhost:5177/'] = process.argv.slice(2)
if (!saveFile) { console.error('uso: node scripts/repro-copa-presa.mjs <save.json> [url]'); process.exit(2) }
const save = readFileSync(saveFile, 'utf8')
const out = process.env.OUT || '/tmp/repro-copa'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
await page.addInitScript(([s]) => {
  localStorage.setItem('esc-solo-career', s)
  localStorage.setItem('esc-solo-career-at', String(Date.now()))
  localStorage.setItem('bl_lang', 'pt')
}, [save])
page.on('pageerror', e => console.log('PAGEERROR', e.message))
await page.goto(url, { waitUntil: 'networkidle' })
// a home é o "ESCOLHA SEU JOGO": entra no Leilão Legends e daí no "Continuar carreira"
await page.getByText(/LEILÃO LEGENDS/).first().click()
await page.getByText(/^CONTINUAR · /).first().click()
await page.waitForTimeout(2500)

// o relógio da Copa: pega os "NN'" da tela e guarda o maior a cada leitura
const minutos = []
for (let i = 0; i < 6; i++) {
  const txt = await page.evaluate(() => document.body.innerText)
  const ms = [...txt.matchAll(/\b(\d{1,3})'/g)].map(m => +m[1])
  const fase = (txt.match(/Peneira|Rodada de 64|Rodada de 32|Oitavas|Quartas|Semifinal|Final/g) ?? []).join('/')
  minutos.push(ms.length ? Math.max(...ms) : -1)
  console.log(`t+${(i * 2).toString().padStart(2)}s · minuto máx na tela: ${minutos.at(-1)} · fases vistas: ${fase.slice(0, 80)}`)
  await page.screenshot({ path: `${out}-${i}.png`, fullPage: true })
  await page.waitForTimeout(2000)
}
await browser.close()
const andou = Math.max(...minutos) >= 5
console.log(andou ? '✅ relógio da Copa ANDOU' : '❌ relógio da Copa PRESO')
process.exit(andou ? 0 : 1)
