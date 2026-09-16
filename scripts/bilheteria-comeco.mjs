// ─── 🎟️ A BILHETERIA NO COMEÇO — a pessoa desanima? ─────────────────────────
//
// Diego (16/09): *"quero que fale da bilheteria apenas e tudo que tem de
// melhorias no estádio. Lembrando que no início do jogo a pessoa pensa se
// continua ou não também… ela não pode desanimar"*.
//
// A pergunta aqui não é "quanto rende no fim" — é **o que a pessoa VÊ acontecer
// depois de cada investimento que ela faz**. O estádio é investido de 20 em 20
// (`STADIUM_STEP`), então este script simula clique por clique, do zero, e mostra
// quanto a bilheteria sobe em cada um. É o termômetro de desânimo.
//
// Roda com o vite de pé:  node scripts/bilheteria-comeco.mjs
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto('http://localhost:5173/7a0-game-studio/bench-sim.html', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

const r = await page.evaluate(async () => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')
  const E = await import(B + 'estadiodata.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS, STADIUM_STEP, STADIUM_BASE,
          stadiumIncomeAt, stadiumOccupancy, occByPos, sectorPct, stadiumIncome } = E

  // ── 1. clique a clique, do zero, na ordem em que o jogo obriga
  const ORDEM = ['grama', 'geral', 'cadeiras', 'visitante', 'camarote']
  const cliques = []
  const st = { inv: {}, ext: [] }
  const POS = [3, 10, 18]   // top-4 (lotado) · meio de tabela · zona de rebaixamento
  const renda = p => stadiumIncomeAt(st, stadiumOccupancy(p, st), false)
  let antes = {}; for (const p of POS) antes[p] = renda(p)
  const zerado = { ...antes }
  let gasto = 0
  for (const k of ORDEM) {
    const sec = STADIUM_SECTORS.find(s => s.k === k)
    for (let pago = 0; pago < sec.cost; pago += STADIUM_STEP) {
      st.inv[k] = (st.inv[k] ?? 0) + STADIUM_STEP
      gasto += STADIUM_STEP
      const dep = {}; for (const p of POS) dep[p] = renda(p)
      cliques.push({ setor: sec.n, pct: sectorPct(st, k), gasto,
        r3: dep[3], r10: dep[10], r18: dep[18],
        g3: dep[3] - antes[3], g10: dep[10] - antes[10], g18: dep[18] - antes[18] })
      antes = dep
    }
  }
  // ── 2. a ocupação por colocação (o multiplicador que corta a renda)
  const occ = {}
  for (const p of [1, 3, 5, 7, 10, 14, 15, 16, 17, 20]) occ[p] = occByPos(p)

  // ── 3. o teto: estádio completo, por colocação
  const cheio = { inv: Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost])),
                  ext: STADIUM_EXTRAS.map(e => e.k) }
  const teto = {}
  for (const p of [1, 3, 10, 18]) teto[p] = stadiumIncomeAt(cheio, stadiumOccupancy(p, cheio), false)

  return { zerado, cliques, occ, teto, STADIUM_BASE, STADIUM_STEP,
           construidoCheio: stadiumIncome(cheio, false) - STADIUM_BASE }
})

console.log(`\n🎟️ A bilheteria começa em ${r.STADIUM_BASE} moedas com o estádio ZERADO.`)
console.log(`   Cada investimento é de ${r.STADIUM_STEP} moedas por vez.\n`)
console.log('O QUE A PESSOA VÊ A CADA CLIQUE DE 20 MOEDAS (só os setores):\n')
console.log('  setor'.padEnd(16) + '%'.padStart(5) + 'gasto'.padStart(7) + '   │ 3º lugar      10º lugar     18º lugar')
console.log('  ' + '─'.repeat(74))
for (const c of r.cliques) {
  const f = (v, g) => `${String(v).padStart(4)} (${g >= 0 ? '+' : ''}${g})`.padEnd(14)
  console.log('  ' + c.setor.padEnd(14) + String(c.pct).padStart(5) + String(c.gasto).padStart(7) +
              '   │ ' + f(c.r3, c.g3) + f(c.r10, c.g10) + f(c.r18, c.g18))
}
console.log('\nOCUPAÇÃO POR COLOCAÇÃO (multiplica TUDO que você construiu):')
for (const p in r.occ) console.log(`  ${String(p).padStart(2)}º lugar → ${(r.occ[p] * 100).toFixed(0)}%`)
console.log(`\nTETO (estádio COMPLETO, ${r.construidoCheio} de construído):`)
for (const p in r.teto) console.log(`  ${String(p).padStart(2)}º lugar → ${r.teto[p]} moedas/temporada`)
await browser.close()
