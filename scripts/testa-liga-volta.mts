// 🪑 10/11 — Diego: *"o time dele só deve deixar de ser dele se o HOST remover; enquanto não remove, se o usuário voltar,
// ele volta pro mesmo local onde o host tá comandando a sala"*. Rodar: npx tsx scripts/testa-liga-volta.mts
import assert from 'node:assert/strict'
import { reducer, assentoDoCracha } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
const sala = (extra: object) => {
  const s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  return reducer(s, { type: 'START_ONLINE', seasonNo: 1, roomId: 'r1', roomCode: 'X', isHost: true, playerIndex: 0,
    playerNames: ['Dono', 'Realengo', 'Outro'], seatUids: ['u0', 'u1', 'u2'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', ...extra } as never)
}
const liga = sala({ ligaDraft: true, minhaLigaDraft: true, liga: true })
assert.ok(liga.ligaMode, 'é liga')
// 1) saiu/caiu sozinho: a máquina assume, o crachá FICA, e a volta devolve o time
let s = reducer(liga, { type: 'KICK_PLAYER', playerIndex: 1 } as never)
assert.equal(s.managers.find(m => m.id === 1)!.isHuman, false, 'saiu → a máquina toca o time')
assert.equal(assentoDoCracha(s, 'u1'), 1, 'o crachá continua dele')
const elenco = s.managers.find(m => m.id === 1)!.squad.map(c => c.name).join('|')
let v = reducer(s, { type: 'RETOMA_TIME', uid: 'u1' } as never)
const m1 = v.managers.find(m => m.id === 1)!
assert.ok(m1.isHuman && !m1.auctionRival, 'voltou → o time é dele de novo')
assert.equal(m1.squad.map(c => c.name).join('|'), elenco, 'com o mesmo elenco')
assert.ok(v.managers.find(m => m.id === 0)!.isHuman && v.managers.find(m => m.id === 2)!.isHuman, 'ninguém mais muda')
assert.equal(reducer(v, { type: 'RETOMA_TIME', uid: 'u1' } as never), v, 'pedir de novo não muda nada')
// 2) o DONO removeu: o crachá some e a volta NÃO devolve
s = reducer(liga, { type: 'KICK_PLAYER', playerIndex: 1, peloDono: true } as never)
assert.equal(assentoDoCracha(s, 'u1'), -1, 'removido pelo dono → sem crachá')
assert.equal(reducer(s, { type: 'RETOMA_TIME', uid: 'u1' } as never), s, 'removido não reassume')
assert.equal(assentoDoCracha(s, 'u2'), 2, 'os outros crachás ficam no lugar')
// 2b) saiu sozinho e DEPOIS o dono excluiu o time que ficou com a máquina: também perde
s = reducer(reducer(liga, { type: 'KICK_PLAYER', playerIndex: 1 } as never), { type: 'KICK_PLAYER', playerIndex: 1, peloDono: true } as never)
assert.equal(reducer(s, { type: 'RETOMA_TIME', uid: 'u1' } as never), s, 'saiu e depois foi excluído → não reassume')
// 3) quem não é da liga não pega time de ninguém
assert.equal(reducer(liga, { type: 'RETOMA_TIME', uid: 'uX' } as never), liga, 'desconhecido não vira técnico')
// 4) NÃO vaza pra sala rápida: lá quem saiu, saiu
const rapida = reducer(sala({}), { type: 'KICK_PLAYER', playerIndex: 1 } as never)
assert.equal(reducer(rapida, { type: 'RETOMA_TIME', uid: 'u1' } as never), rapida, 'sala rápida não tem volta pro time')
const rk = reducer(sala({}), { type: 'KICK_PLAYER', playerIndex: 1, peloDono: true } as never)
assert.equal(assentoDoCracha(rk, 'u1'), 1, 'sala rápida: o mapa de crachás fica como sempre foi')
console.log('✅ liga: saiu sozinho volta pro mesmo time · removido pelo dono não volta · sala rápida não muda')
process.exit(0)
