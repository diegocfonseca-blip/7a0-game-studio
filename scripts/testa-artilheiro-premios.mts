// 🥇 trava dos prêmios de ARTILHEIRO das competições que faltavam (17/10, Diego: "falta mundo, libertadores, champions,
// mundial e supercopa… 30 moedas"). Confere a conta pura de cada uma:
//   · Internacional: artilheiro POR competição (Liberta, Champions e Mundial separados) e se é do time do usuário
//   npx tsx scripts/testa-artilheiro-premios.mts
import assert from 'node:assert/strict'
import { artilheirosInternacionais, INTL_ARTILHEIRO_MOEDAS } from '../src/escalacao/career-international-summary'
assert.equal(INTL_ARTILHEIRO_MOEDAS, 30)
// (a Supercopa paga em `supercopaRewards`, copa-brasil.ts — o módulo puxa a tela inteira, então fica fora desta trava)

// Internacional: 3 competições, artilheiro separado em cada
const g = (name: string, home: boolean) => ({ name, card: `${name}|C|2000`, min: 10, home })
const camp = {
  teams: [{ id: 'Flamengo', you: true }, { id: 'River', you: false }, { id: 'Real', you: false }, { id: 'Milan', you: false }],
  steps: [
    { libertadores: { matches: [{ home: 'Flamengo', away: 'River', hg: 3, ag: 1, goals: [g('Gabigol', true), g('Gabigol', true), g('Pedro', true), g('Alvarez', false)] }] },
      champions: { matches: [{ home: 'Real', away: 'Milan', hg: 2, ag: 0, goals: [g('Benzema', true), g('Benzema', true)] }] } },
    { mundial: { matches: [{ home: 'Flamengo', away: 'Real', hg: 1, ag: 2, goals: [g('Gabigol', true), g('Vini', false), g('Vini', false)] }] } },
  ],
} as never
const a = artilheirosInternacionais(camp)
assert.deepEqual(a.map(x => [x.comp, x.name, x.goals, x.you]), [['libertadores', 'Gabigol', 2, true], ['champions', 'Benzema', 2, false], ['mundial', 'Vini', 2, false]])
console.log('✅ artilheiro: internacionais pagam 30 🪙 só pro clube do artilheiro, cada competição separada')
