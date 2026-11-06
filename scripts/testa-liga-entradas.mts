// 🙋 06/11 — a virada de DENTRO do jogo põe o novato aceito no time escolhido (com o nome dele, elenco e caixa do time).
// Rodar: npx tsx scripts/testa-liga-entradas.mts
import assert from 'node:assert/strict'
import { reducer, assentoDoCracha } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { chaveNome } from '../src/escalacao/liga-draft'
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
// 📏 o formato marcado vale na virada: 10 → 20 (entram os bots que faltam, sem repetir jogador) e 38/19 rodadas
{

  let d = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  d = reducer(d, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r2', roomCode: 'Y', isHost: true, playerIndex: 0,
    playerNames: ['Dono', 'B'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', tamanhoLiga: 10 } as never)
  assert.equal(d.managers.length, 10)
  const g = reducer(d, { type: 'LIGA_FORMATO', tamanho: 20, turnoUnico: true } as never)
  assert.equal(g.managers.length, 20, 'cresceu pra 20'); assert.equal(g.tamanhoLiga, undefined)
  assert.ok(g.managers.slice(10).every(m => !m.isHuman && m.squad.length >= 11), 'bots novos com elenco pronto')
  const nomes = g.managers.flatMap(m => m.squad.filter(c => c.club !== 'Várzea').map(c => chaveNome(c.name)))
  assert.equal(new Set(nomes).size, nomes.length, 'ninguém repetido na liga')
  assert.ok(new Set(g.managers.map(m => m.id)).size === 20, 'ids únicos')
  assert.equal(g.turnoUnico, true, '19 rodadas marcado')
  const e = reducer(g, { type: 'LIGA_ENTRADAS', entradas: [{ uid: 'uN', nome: 'Novo FC', bot: -1 }] } as never)
  assert.ok(assentoDoCracha(e, 'uN') >= 10, 'aceito em "um bot novo" pega um dos bots novos')
  assert.equal(reducer(g, { type: 'LIGA_FORMATO', tamanho: 10, turnoUnico: false } as never).managers.length, 20, 'de 20 nunca volta pra 10')
  console.log('✅ formato na virada: 10 → 20 com bots novos, 19 rodadas, e 20 nunca vira 10')
}
process.exit(0)
