import assert from 'node:assert/strict'
import { classificacaoGruposAoVivo } from '../src/escalacao/classificacao-grupos.ts'
import type { CopaRound, SimTeam, CopaTie } from '../src/escalacao/pyramidseason'

const team = (name: string, you = false) => ({ name, you }) as SimTeam
const a = team('Clube A', true), b = team('Clube B'), c = team('Clube C'), d = team('Clube D')
const tie = (a: SimTeam, b: SimTeam, aggA: number, aggB: number) => ({ a, b, aggA, aggB }) as CopaTie
const pages: CopaRound[] = [
  { name: 'Taça · Fase de grupos · rodada 1/2', ties: [tie(a, b, 2, 0), tie(c, d, 1, 1)] },
  { name: 'Taça · Fase de grupos · rodada 2/2', ties: [tie(a, c, 0, 1), tie(b, d, 3, 0)] },
]
const original = JSON.stringify(pages)
const first = classificacaoGruposAoVivo(pages, 1)
assert.deepEqual(first.rows.map(r => [r.time, r.pts, r.j]), [['Clube A', 3, 1], ['Clube C', 1, 1], ['Clube D', 1, 1], ['Clube B', 0, 1]], 'future round cannot leak into standings')
const all = classificacaoGruposAoVivo(pages, 2)
assert.deepEqual(all.rows.map(r => [r.time, r.pts, r.gp - r.gc]), [['Clube C', 4, 1], ['Clube B', 3, 1], ['Clube A', 3, 1], ['Clube D', 1, -3]])
const brokenFinal = { name: 'Taça · Final', ties: [{ a, aggA: 0, aggB: 0 } as CopaTie] }
assert.deepEqual(classificacaoGruposAoVivo([...pages, brokenFinal], 3).rows, all.rows, 'incomplete knockout must not crash or enter group standings')
const brokenGroup = { name: 'Taça · Fase de grupos · rodada 3/3', ties: [{ a, aggA: 0, aggB: 0 } as CopaTie] }
const safe = classificacaoGruposAoVivo([...pages, brokenGroup], 3)
assert.deepEqual(safe.rows, all.rows, 'incomplete match must not invent a team, draw or points')
assert.equal(safe.incompletos, 1)
assert.equal(JSON.stringify(pages), original, 'presentation must not mutate games')
console.log('PASS classificação: jogos apitados, desempate, final sem adversário, dados incompletos e resultados preservados')
