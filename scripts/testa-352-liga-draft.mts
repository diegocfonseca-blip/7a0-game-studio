// 🪽 07/11 — 3-5-2 na Liga Draft: é o 5-3-2 com os laterais subindo como alas (só o desenho). Rodar: npm run 352
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import type { EscState, WonCard } from '../src/escalacao/types'
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'X', isHost: true, playerIndex: 0,
  playerNames: ['Dono', 'B'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
const eu = s.managers[0]
// elenco que fecha 4-3-3 e 5-3-2 (1 GOL · 2 LAT · 3 ZAG · 3 MEI · 3 ATA)
const pos = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'] as const
eu.squad = pos.map((p, i) => ({ id: `c${i}`, name: `Jogador ${i}`, club: 'Clube', year: 2000, pos: p, fame: 3, lo: 70, hi: 80, paid: 1 })) as unknown as WonCard[]
let n = reducer(s, { type: 'MLD_FORMACAO', mgrId: eu.id, formation: '5-3-2', view: '3-5-2' } as never)
assert.equal(n.managers[0].formation, '5-3-2'); assert.equal(n.managers[0].formationView, '3-5-2', 'entra direto no 3-5-2')
n = reducer(n, { type: 'MLD_FORMACAO', mgrId: eu.id, formation: '5-3-2' } as never)
assert.equal(n.managers[0].formationView, undefined, 'volta pro 5-3-2 sem mexer em ninguém')
n = reducer(n, { type: 'MLD_FORMACAO', mgrId: eu.id, formation: '5-3-2', view: '3-5-2' } as never)
assert.equal(n.managers[0].formationView, '3-5-2', 'e do 5-3-2 pro 3-5-2')
const x = reducer(n, { type: 'MLD_FORMACAO', mgrId: eu.id, formation: '4-3-3', view: '3-5-2' } as never)
assert.equal(x.managers[0].formation, '4-3-3'); assert.equal(x.managers[0].formationView, undefined, 'vista de 3-5-2 só vale com 5-3-2')
const y = reducer(n, { type: 'MLD_FORMACAO', mgrId: eu.id, formation: '5-3-2', view: '4-2-3-1' } as never)
assert.equal(y.managers[0].formationView, undefined, 'nenhuma outra vista entra na Liga Draft')
console.log('✅ 3-5-2 na Liga Draft: liga, desliga, só com o 5-3-2 e sem outra vista')
process.exit(0)
