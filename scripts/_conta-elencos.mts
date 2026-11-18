import { CATALOG } from '../src/escalacao/data.ts'
import { CATALOG_OFICIAL_MODO } from '../src/escalacao/baralho-oficial.ts'
import { CLUBES_BR, CLUBES_BR_OUTROS, cartasDoClube } from '../src/escalacao/brasil-oficial.ts'
const juntas: any = {}
for (const p of Object.keys(CATALOG)) juntas[p] = [...(CATALOG as any)[p], ...((CATALOG_OFICIAL_MODO as any)[p] ?? [])]
const faixa = (n: number) => n >= 22 ? '22+' : n >= 11 ? '11-21' : '<11'
for (const div of ['A', 'B', 'C', 'D']) {
  const cs = div === 'D' ? CLUBES_BR_OUTROS.filter((c: any) => c.div === 'D') : CLUBES_BR.filter((c: any) => c.div === div)
  const ns = cs.map((c: any) => cartasDoClube(c, juntas).length)
  const cont: any = { '22+': 0, '11-21': 0, '<11': 0 }
  for (const n of ns) cont[faixa(n)]++
  console.log(div, cs.length, 'clubes', JSON.stringify(cont), 'min', Math.min(...ns), 'max', Math.max(...ns), 'media', Math.round(ns.reduce((a, b) => a + b, 0) / ns.length))
}
console.log('Santa Cruz', cartasDoClube(CLUBES_BR.find((c: any) => c.nome === 'Santa Cruz')!, juntas).length)
