// 🧪 REPRO: toca a COPA INTEIRA de um save de carreira solo e caça erro de tela
// (13/09, caso do Internacional de Madrid: "Ops, algo deu errado" nas quartas).
// Carrega o save no localStorage, entra em "Continuar", e fica observando fases,
// minuto e erros de página até a Copa acabar ou estourar o tempo.
//   node scripts/repro-copa-inteira.mjs <save.json> [url] [segundos=150]
// Sai com 1 se apareceu erro de página (pageerror) ou a tela "Ops, algo deu errado".
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const [saveFile, url = 'http://localhost:5177/7a0-game-studio/', segundos = '150'] = process.argv.slice(2)
if (!saveFile) { console.error('uso: node scripts/repro-copa-inteira.mjs <save.json> [url] [segundos]'); process.exit(2) }
const save = readFileSync(saveFile, 'utf8')
const out = process.env.OUT || '/tmp/repro-copa-inteira'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
await page.addInitScript(([s]) => {
  localStorage.setItem('esc-solo-career', s)
  localStorage.setItem('esc-solo-career-at', String(Date.now()))
  localStorage.setItem('bl_lang', 'pt')
}, [save])
const erros = []
page.on('pageerror', e => { erros.push(e); console.log('💥 PAGEERROR', e.message, '\n', (e.stack || '').split('\n').slice(0, 8).join('\n')) })
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) console.log('🟥 console.error', m.text().slice(0, 400)) })
await page.goto(url, { waitUntil: 'networkidle' })
await page.getByText(/LEILÃO LEGENDS/).first().click()
await page.getByText(/^CONTINUAR · /).first().click()

let ultimo = '', ops = false
const t0 = Date.now()
while ((Date.now() - t0) / 1000 < +segundos) {
  const txt = await page.evaluate(() => document.body.innerText)
  if (/Ops, algo deu errado/.test(txt)) { ops = true; console.log('💀 tela "Ops, algo deu errado":\n' + txt.slice(0, 1200)); await page.screenshot({ path: `${out}-ops.png`, fullPage: true }); break }
  const fase = (txt.match(/Peneira|Rodada de 64|Rodada de 32|Oitavas|Quartas|Semifinal|Final|Supercopa/g) ?? []).slice(-1)[0] ?? '?'
  const ms = [...txt.matchAll(/\b(\d{1,3})'/g)].map(m => +m[1])
  const linha = `${fase} · ${ms.length ? Math.max(...ms) : '-'}'`
  if (linha !== ultimo) { console.log(`t+${Math.round((Date.now() - t0) / 1000).toString().padStart(3)}s · ${linha}`); ultimo = linha }
  if (/Próxima temporada|Encerrada|Campeão da Copa|CAMPEÃO/.test(txt) && !/Bola rolando/.test(txt) && (Date.now() - t0) / 1000 > 30) { /* segue observando um pouco */ }
  await page.waitForTimeout(1000)
}
await page.screenshot({ path: `${out}-fim.png`, fullPage: true })
await browser.close()
const ruim = ops || erros.length > 0
console.log(ruim ? `❌ erro na Copa (${erros.length} pageerror${ops ? ' + tela de erro' : ''})` : '✅ Copa rodou sem erro de página')
process.exit(ruim ? 1 : 0)
