// 🙋 06/11 — a virada de DENTRO do jogo põe o novato aceito no time escolhido (com o nome dele, elenco e caixa do time).
// Rodar: npx tsx scripts/testa-liga-entradas.mts
import assert from 'node:assert/strict'
import { reducer, assentoDoCracha } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'X', isHost: true, playerIndex: 0,
  playerNames: ['Dono', 'Principe'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga' } as never)
const bot = s.managers.find(m => !m.isHuman)!
const elenco = bot.squad.map(c => c.name).join('|'), caixa = bot.money
let n = reducer(s, { type: 'LIGA_ENTRADAS', entradas: [{ uid: 'uJ', nome: 'Judas FC ⭐', bot: bot.id }] } as never)
const j = n.managers.find(m => m.id === bot.id)!
assert.ok(j.isHuman && j.name === 'Judas FC ⭐' && j.teamName === 'Judas FC ⭐', 'o novato entra com o NOME dele')
assert.equal(j.squad.map(c => c.name).join('|'), elenco, 'com os jogadores do bot'); assert.equal(j.money, caixa, 'e o caixa do bot')
assert.equal(assentoDoCracha(n, 'uJ'), bot.id, 'o crachá dele aponta pro time'); assert.equal(assentoDoCracha(n, 'u1'), 1, 'o Príncipe continua no time dele')
if (n.league.some(t => t.id === bot.id)) assert.equal(n.league.find(t => t.id === bot.id)?.name, 'Judas FC ⭐', 'a tabela mostra o nome novo')
// de novo: não entra duas vezes
assert.equal(reducer(n, { type: 'LIGA_ENTRADAS', entradas: [{ uid: 'uJ', nome: 'Judas FC ⭐', bot: bot.id }] } as never), n, 'aplicar de novo não muda nada')
// no lugar de alguém: o crachá do Príncipe vira o do novato, elenco fica
n = reducer(s, { type: 'LIGA_ENTRADAS', entradas: [{ uid: 'uZ', nome: 'Zé FC', alvoUid: 'u1' }] } as never)
assert.equal(assentoDoCracha(n, 'uZ'), 1); assert.equal(assentoDoCracha(n, 'u1'), -1, 'quem saiu perde o time')
console.log('✅ virada põe o aceito no time escolhido, com o nome dele, e não mexe em mais ninguém')
