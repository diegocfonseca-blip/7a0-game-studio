// ⚡ trava do TURNO ÚNICO (06/11, pedido aprovado pelo Diego): sala online com liga de 20, o dono escolhe 38 (ida e volta, padrão)
// ou 19 rodadas (só ida, TODO jogo em campo neutro).
//   · 19 rodadas, cada par se enfrenta 1 vez, todo jogo neutro
//   · padrão (sem o campo) = 38, com mando de campo
//   · liga de 10 continua com 18; Relâmpago, Só Champions, carreira e basquete não pegam a marca
//   · o fim da temporada funciona com 19 (só liga, Copa dos 8, Libertadores) e o novo leilão mantém o turno único
//   · a marca é zerada no começo da carreira (MARCAS_DE_MODO)
//   npx tsx scripts/testa-turno-unico.mts
import assert from 'node:assert/strict'
import { reducer, ligaJogoNeutro, MARCAS_DE_MODO } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'

const start = (extra: Record<string, unknown> = {}, nomes = ['Butinas FC', 'K9 FC']) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'TURNO1', isHost: true, playerIndex: 0,
    playerNames: nomes, seatUids: nomes.map((_, i) => 'u' + i), youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', ...extra } as never)
  return s
}
const temporada = (s: EscState) => reducer(s, { type: 'REPLAY_SEASON' } as never)
const pares = (s: EscState) => {
  const vistos = new Map<string, number>()
  for (const r of s.fixtures) for (const [h, a] of r) { const k = [h, a].sort((x, y) => x - y).join('-'); vistos.set(k, (vistos.get(k) ?? 0) + 1) }
  return vistos
}

// ① turno único: 19 rodadas, 10 jogos cada, cada par 1 vez, todo time 1 jogo por rodada, todo jogo neutro
const t = temporada(start({ turnoUnico: true }))
assert.equal(t.turnoUnico, true)
assert.equal(t.league.length, 20)
assert.equal(t.fixtures.length, 19, '19 rodadas')
for (const r of t.fixtures) {
  assert.equal(r.length, 10, '10 jogos por rodada')
  assert.equal(new Set(r.flat()).size, 20, 'cada time joga 1 vez por rodada')
}
const p = pares(t)
assert.equal(p.size, 190, 'todos os 190 confrontos')
for (const [k, n] of p) assert.equal(n, 1, `o par ${k} se enfrenta 1 vez só`)
assert.equal(ligaJogoNeutro(t), true, 'todo jogo em campo neutro')

// ② padrão intacto: 38, cada par 2 vezes (ida e volta), com mando
const v = temporada(start())
assert.equal(v.turnoUnico, undefined)
assert.equal(v.fixtures.length, 38)
for (const [, n] of pares(v)) assert.equal(n, 2)
assert.equal(ligaJogoNeutro(v), false, 'padrão tem mando de campo')
assert.equal(temporada(start({ turnoUnico: false })).fixtures.length, 38, 'sem a marca = 38')

// ③ a rodada joga normal no turno único
{
  const a = reducer(t, { type: 'PLAY_ROUND' } as never)
  assert.equal(a.round, 1)
  assert.equal(a.lastResults.length, 10)
}

// ④ liga de 10 intacta (18), e a marca nem fica
const dez = start({ tamanhoLiga: 10, turnoUnico: true })
assert.equal(dez.turnoUnico, undefined, 'liga de 10 não leva a marca')
const dezT = temporada(dez)
assert.equal(dezT.fixtures.length, 18)
assert.equal(ligaJogoNeutro(dezT), false)
// liga sem bots com menos de 20: regra de sempre (ida e volta do tamanho da galera)
const fechada = temporada(start({ turnoUnico: true, ligaFechada: true, liga: true }, ['A', 'B', 'C', 'D', 'E', 'F']))
assert.equal(fechada.fixtures.length, 10, 'sem bots com 6: 10 rodadas (ida e volta)')
assert.equal(ligaJogoNeutro(fechada), false)

// ⑤ onde NÃO vale
assert.equal(start({ turnoUnico: true, copaMode: 'relampago', relampagoChave: 16 }).turnoUnico, undefined, 'Relâmpago')
assert.equal(start({ turnoUnico: true, copaMode: 'champions' }).turnoUnico, undefined, 'Só Champions')
assert.equal(start({ turnoUnico: true, career: true }).turnoUnico, undefined, 'carreira em sala')
assert.equal(start({ turnoUnico: true, sport: 'basquete' }).turnoUnico, undefined, 'basquete')

// ⑥ o fim da temporada funciona com 19
const fim = (s: EscState) => {
  let n = 0
  while (s.round < s.fixtures.length && n++ < 60) s = reducer(s, { type: 'PLAY_ROUND' } as never)
  assert.equal(s.round, 19, 'a temporada acaba na rodada 19')
  for (const tm of s.league) assert.equal(tm.w + tm.d + tm.l, 19, `${tm.name} jogou 19`)
  return reducer(s, { type: 'FINISH_SEASON' } as never)
}
const copa = fim(temporada(start({ turnoUnico: true })))
assert.ok(copa.quickCopa, 'Copa dos 8 nasce depois das 19')
assert.equal(copa.quickCopa!.ties.length, 4)
const lib = fim(temporada(start({ turnoUnico: true, copaMode: 'liga_liberta' })))
assert.ok(lib.liberta, 'Libertadores nasce depois das 19')
const so = fim(temporada(start({ turnoUnico: true, copaMode: 'liga' })))
assert.equal(so.screen, 'end', 'só liga fecha normal')

// ⑦ novo leilão (mesmo time) mantém o turno único; partida rápida offline não herda
const novo = temporada(reducer(t, { type: 'NEW_SEASON' } as never))
assert.equal(novo.turnoUnico, true)
assert.equal(novo.fixtures.length, 19)
const offline = temporada(reducer(t, { type: 'START', teamName: 'Meu Time', formation: '4-3-3' } as never))
assert.ok(offline.fixtures.length >= 38, 'offline: ida e volta de sempre')
assert.equal(ligaJogoNeutro(offline), false)

// ⑧ a marca é zerada no começo da carreira
assert.ok((MARCAS_DE_MODO as readonly string[]).includes('turnoUnico'), 'turnoUnico em MARCAS_DE_MODO')

console.log('✅ turno único: 19 rodadas, cada par 1 vez, todo jogo neutro; 38 e liga de 10 intactos; fim da temporada fecha')
process.exit(0)
