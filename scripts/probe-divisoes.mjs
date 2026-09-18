// 🔎 SONDA: quantos times e quantos jogos cada divisão tem de verdade.
// Nasceu porque o raio-x deu "campeão da Série D com 12 pontos" — número que não
// fecha com 38 rodadas, então antes de acusar o motor eu confiro o tabuleiro.
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
  const P = await import(B + 'pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, seedCpuSquads, DIVS } = P
  const rec = seedCpuSquads([], 20250824, 'br', false)
  const nomes = Object.keys(rec)
  const squad = rec[nomes[Math.floor(nomes.length / 2)]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad }]
  const world = buildPyramid(managers, 0, 987654321, 'br', null, undefined)
  const live = simulatePyramid(world, 12345, 38, {}, {}, 1.12, true, true)
  const out = {}
  for (const d of DIVS) {
    const tab = live.tables[d] ?? []
    out[d] = {
      times: world[d].length,
      jogosDoPrimeiro: tab[0] ? tab[0].w + tab[0].d + tab[0].l : 0,
      ptsCampeao: tab[0]?.pts ?? 0,
      nomes: world[d].slice(0, 4).map(t => t.name),
    }
  }
  return JSON.stringify(out, null, 1)
}))
await browser.close()
