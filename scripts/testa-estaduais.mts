// 🏟️ trava dos estaduais do Brasil Oficial (`npm run estaduais`): todo clube citado existe no modo e é do estadual certo,
// cada estadual fecha (campeão, vice, rebaixados, classificação com todo mundo), ninguém joga duas vezes na mesma rodada e a
// mesma semente dá o mesmo estadual.
import { ESTADUAIS, simulaEstadual } from '../src/escalacao/estaduais.ts'
import { CLUBES_BR_TODOS } from '../src/escalacao/brasil-oficial.ts'
import type { Joga, Penaltis } from '../src/escalacao/campeonato-oficial.ts'

let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
const rng = (s: number) => () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296 }
const jogaDe = (seed: number): Joga => { const r = rng(seed); return () => ({ gc: Math.floor(r() * 4), gf: Math.floor(r() * 3) }) }
const pen: Penaltis = (a, b) => (a < b ? a : b)
const CAEM: Record<string, number> = { Carioca: 1, Paulista: 2, Mineiro: 2, 'Gaúcho': 2, Paranaense: 2, Catarinense: 3, Baiano: 2, Pernambucano: 0, Cearense: 2, Goiano: 2, Paraense: 2, Alagoano: 1, Amazonense: 1, Maranhense: 2, Paraibano: 2, Sergipano: 2, 'Mato-Grossense': 2 }
for (const nome of Object.keys(ESTADUAIS)) {
  for (let k = 0; k < 20; k++) {
    const r = simulaEstadual(nome, 1000 + k, jogaDe(77 + k), pen)!
    const times = [...new Set(r.jogos.flatMap(j => [j.casa, j.fora]))]
    if (k === 0) for (const t of times) {
      const c = CLUBES_BR_TODOS.find(x => x.nome === t)
      if (!c) falha(`${nome}: "${t}" não existe no modo`)
      else if (c.estadual !== nome) falha(`${nome}: ${t} está no estadual "${c.estadual}" na lista mestra`)
    }
    if (new Set(r.classificacao).size !== times.length || r.classificacao.length !== times.length) { falha(`${nome}: classificação com ${r.classificacao.length} de ${times.length}`); break }
    if (r.classificacao[0] !== r.campeao || r.classificacao[1] !== r.vice) falha(`${nome}: campeão/vice fora do topo da classificação`)
    if (r.caem.length !== CAEM[nome]) falha(`${nome}: ${r.caem.length} rebaixados (esperado ${CAEM[nome]})`)
    if (r.caem.includes(r.campeao)) falha(`${nome}: campeão rebaixado`)
    for (const f of r.fases) for (const tb of f.tabelas) {
      const porRodada = new Map<number, string[]>()
      for (const j of r.jogos.filter(x => x.ctx.fase === f.nome || (f.nome === 'Taça Guanabara' && x.ctx.fase === 'Taça Guanabara'))) { const l = porRodada.get(j.ctx.rodada) ?? []; l.push(j.casa, j.fora); porRodada.set(j.ctx.rodada, l) }
      for (const [rd, l] of porRodada) if (new Set(l).size !== l.length) { falha(`${nome}: alguém joga 2× na rodada ${rd} da ${f.nome}`); break }
      void tb
    }
    if (k === 0 && JSON.stringify(simulaEstadual(nome, 1000, jogaDe(77), pen)) !== JSON.stringify(r)) falha(`${nome}: mesma semente, estadual diferente`)
  }
}
if (erros) { console.log(`❌ estaduais: ${erros} erro(s)`); process.exit(1) }
console.log(`✅ estaduais: ${Object.keys(ESTADUAIS).length} estaduais fecham (campeão, vice, rebaixados, classificação inteira), clubes do modo, ninguém joga 2× na rodada`)
