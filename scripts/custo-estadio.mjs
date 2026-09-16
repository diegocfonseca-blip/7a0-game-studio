// ─── 🏟️ VALE A PENA CONSTRUIR? custo × retorno REAL de cada obra do estádio ──
//
// Diego (16/09): *"talvez diminuir um pouco mais o início dos desbloqueios das
// coisas do estádio, não sei… analise a fundo todos valores pra se completar as
// coisas todas"*.
//
// ⚠️ A CONTA ÓBVIA ENGANA. Olhando só o `inc` de cada peça (a renda fixa), o
// estádio parece um péssimo negócio: cada obra se paga em 13 a 25 TEMPORADAS.
// Mas o `inc` não é o retorno inteiro — os SETORES também trazem ASSENTOS, e
// assento vira TORCIDA (`torcidaDoEstadio` = 12.000 + assentos), que vira VENDA
// DE CAMISA. Quem tem a 🛍️ Loja construída ganha as duas coisas por obra.
// Este script mede o retorno CHEIO: renda fixa + camisa, com `calculaVendas`.
//
// Roda com o vite de pé:  node scripts/custo-estadio.mjs
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
  const L = await import(B + 'loja.ts')
  const { STADIUM_SECTORS, STADIUM_EXTRAS, stadiumIncomeAt, stadiumOccupancy } = E
  const { calculaVendas } = L

  const POS = 10 // meio de tabela — o caso mais comum
  /** renda CHEIA de um estádio: bilheteria + venda de camisa */
  const rendaCheia = st => {
    const occ = stadiumOccupancy(POS, st)
    const bilh = stadiumIncomeAt(st, occ, st.ext.includes('loja'))
    const cam = st.ext.includes('loja') ? calculaVendas({ st, pos: POS, preco: 'normal', fornLoja: 0.10 }).moedas : 0
    return { bilh, cam, total: bilh + cam }
  }
  const clone = st => ({ inv: { ...st.inv }, ext: [...st.ext] })

  // ordem em que um técnico constrói (a árvore de requisitos manda)
  const ORDEM = [
    { t: 'setor', k: 'grama' }, { t: 'setor', k: 'geral' }, { t: 'extra', k: 'loja' },
    { t: 'extra', k: 'refl' }, { t: 'setor', k: 'cadeiras' }, { t: 'extra', k: 'telao' },
    { t: 'extra', k: 'estac' }, { t: 'extra', k: 'praca' }, { t: 'extra', k: 'chopp' },
    { t: 'extra', k: 'estacao' }, { t: 'setor', k: 'visitante' }, { t: 'extra', k: 'cober' },
    { t: 'extra', k: 'retratil' }, { t: 'setor', k: 'camarote' }, { t: 'extra', k: 'hotel' },
  ]
  const st = { inv: {}, ext: [] }
  let gastoAcum = 0
  const passos = []
  let antes = rendaCheia(st)
  const zerado = antes.total
  for (const o of ORDEM) {
    const dep = clone(st)
    let custo, nome
    if (o.t === 'setor') {
      const s = STADIUM_SECTORS.find(x => x.k === o.k); custo = s.cost; nome = s.n
      dep.inv[o.k] = s.cost
    } else {
      const e = STADIUM_EXTRAS.find(x => x.k === o.k); custo = e.cost; nome = e.n
      dep.ext.push(o.k)
    }
    const depois = rendaCheia(dep)
    const ganho = depois.total - antes.total
    gastoAcum += custo
    passos.push({ nome, custo, ganho, paga: ganho > 0 ? custo / ganho : null,
                  gastoAcum, rendaDepois: depois.total, bilh: depois.bilh, cam: depois.cam })
    st.inv = dep.inv; st.ext = dep.ext; antes = depois
  }
  return { zerado, passos, totalCusto: gastoAcum, rendaFinal: antes.total }
})

console.log('\n🏟️ CADA OBRA: o que custa e o que devolve POR TEMPORADA (meio de tabela)\n')
console.log('obra'.padEnd(26) + 'custo'.padStart(6) + 'ganho'.padStart(7) + 'paga-se'.padStart(9) + '  acumulado   renda total')
console.log('─'.repeat(78))
for (const p of r.passos) {
  const paga = p.paga ? `${p.paga.toFixed(0)}t` : '—'
  console.log(p.nome.padEnd(26) + String(p.custo).padStart(6) + String(p.ganho).padStart(7) + paga.padStart(9) +
              String(p.gastoAcum).padStart(11) + String(p.rendaDepois).padStart(14))
}
console.log('─'.repeat(78))
console.log(`Estádio zerado rende ${r.zerado}/temporada · completo rende ${r.rendaFinal}/temporada`)
console.log(`Custo total pra completar: ${r.totalCusto} moedas`)
console.log(`Retorno do estádio inteiro: ${r.rendaFinal - r.zerado}/temporada → paga-se em ${(r.totalCusto / (r.rendaFinal - r.zerado)).toFixed(1)} temporadas`)
await browser.close()
