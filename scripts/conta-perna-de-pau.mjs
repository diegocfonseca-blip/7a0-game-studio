// 🦵 QUANTOS "PERNA-DE-PAU" ENTRAM EM CAMPO — e em que posição.
//
// Achado do raio-x: o catálogo é PARELHO entre as posições (baralho BR: GOL 77,3 ·
// LAT 76,3 · ZAG 77,2 · MEI 78,2 · ATA 76,8), mas os TIMES saem tortos — Série A
// com goleiro 83,6 e lateral 68,6. Se o motor sorteia dentro da posição, a média
// do time só podia bater com a do baralho. Não bate. Suspeita: **a conta de
// cartas não fecha** e o `filler()` (as cartas "Perna-de-pau", "Canela Seca") tapa
// o buraco — e tapa mais em umas posições que em outras.
//
// A conta que levanta a suspeita (baralho BR, 4 divisões × 20 times):
//   GOL: precisa 1×80 = 80  · tem 75      ZAG: precisa 2×80 = 160 · tem 86
//   LAT: precisa 2×80 = 160 · tem 84      MEI: precisa 3×80 = 240 · tem 186
//   ATA: precisa 3×80 = 240 · tem 230
//
// ⚠️ SÓ MEDE. Roda com o vite de pé.
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
  const { buildPyramid, seedCpuSquads, DIVS } = P
  const DECK = 'todos' // 🌎 a carreira com a escada usa os TRES baralhos (store.tsx: escadaLiberada() ? 'todos')
  const rec = seedCpuSquads([], 20250824, DECK, false)
  const nomes = Object.keys(rec)
  const squad = rec[nomes[Math.floor(nomes.length / 2)]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad }]
  const world = buildPyramid(managers, 0, 987654321, DECK, null, undefined)
  const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  // o filler tem nome de zoeira e nível baixinho — a lista está no pyramidseason
  const FIL = /perna-de-pau|ferro velho|pé de anjo|canela seca|zé ninguém|trapalhão|bola murcha|meia-boca/i
  const out = {}
  for (const d of DIVS) {
    const tm = world[d]
    if (!tm.length) continue
    const l = { times: tm.length }
    for (const p of POS) {
      let n = 0, fil = 0, soma = 0, somaReal = 0, nReal = 0
      for (const t of tm) for (const c of t.xi) {
        if (c.pos !== p) continue
        n++; soma += (c.lo + c.hi) / 2
        if (FIL.test(c.name)) fil++; else { nReal++; somaReal += (c.lo + c.hi) / 2 }
      }
      l[p] = {
        emCampo: n, pernaDePau: fil, pctPernaDePau: +(100 * fil / (n || 1)).toFixed(0),
        nivelMedio: +(soma / (n || 1)).toFixed(1),
        nivelSemPernaDePau: +(somaReal / (nReal || 1)).toFixed(1),
      }
    }
    out[d] = l
  }
  return JSON.stringify(out, null, 1)
}))
await browser.close()
