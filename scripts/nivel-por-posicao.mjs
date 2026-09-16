// 📏 O CATÁLOGO É PAREJO ENTRE AS POSIÇÕES? — a conta que faltava.
//
// O raio-x do motor mostrou uma coisa esquisita: em TODA divisão o GOLEIRO é a
// carta mais forte do time e o LATERAL é a mais fraca (Série A: goleiro 83,6 ×
// lateral 68,6). Como o motor distribui as cartas por SORTEIO dentro de cada
// posição, a média do time só pode ser a média do BARALHO — ou seja, a diferença
// não é do motor, é do catálogo.
//
// Este script confere isso direto no `data.ts`: quantas cartas e que nível médio
// cada posição tem, por degrau de divisão.
//
// ⚠️ SÓ MEDE. Não muda nada.  Roda com o vite de pé.
import { chromium } from 'playwright-core'
const BASE = 'http://localhost:5173/7a0-game-studio/bench-sim.html'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
console.log(await page.evaluate(async () => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')
  const D = await import(B + 'data.ts')
  const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  const mid = c => (c.lo + c.hi) / 2
  const linhas = []
  for (const [nome, cat] of [['BRASIL', D.CATALOG], ['EUROPA', D.CATALOG_EU], ['BR+EU', D.CATALOG_BOTH]]) {
    if (!cat) continue
    const l = { baralho: nome }
    for (const p of POS) {
      const cards = cat[p] ?? []
      const m = cards.length ? cards.reduce((s, c) => s + mid(c), 0) / cards.length : 0
      const ord = cards.map(mid).sort((a, b) => b - a)
      l[p] = { cartas: cards.length, media: +m.toFixed(1), top11: +(ord.slice(0, 11).reduce((a, b) => a + b, 0) / Math.min(11, ord.length || 1)).toFixed(1) }
    }
    linhas.push(l)
  }
  return JSON.stringify(linhas, null, 1)
}))
await browser.close()
