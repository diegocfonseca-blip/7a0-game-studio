// 🏟️ trava da LIGA DE 10 TIMES nas salas (04/11, Diego: "com 10 agora, se tiver 2 usuários entram 8 bots, o que muda é isso")
//   · rápido/Minhas Ligas com `tamanhoLiga: 10`: 10 técnicos (gente + bots), TABELA de 10, 18 rodadas
//   · o que vem depois da liga fecha com 10: Copa dos 8 (os 8 primeiros), Libertadores (8 cabeças de chave)
//   · não vale (fica 20 ou o tamanho próprio): carreira, Relâmpago, Só Champions, liga sem bots
//   · o novo leilão (mesmo time, NEW_SEASON) continua de 10; a partida rápida offline volta pra 20
//   · peso do título: liga de 10 / Relâmpago = 1, resto = 2 (espelho do gatilho do banco)
//   npx tsx scripts/testa-liga-10-times.mts
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import { pesoDoTitulo, ptsTxt } from '../src/escalacao/pontos-ranking'
import type { EscState } from '../src/escalacao/types'

const start = (extra: Record<string, unknown> = {}, nomes = ['Butinas FC', 'K9 FC']) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', roomId: 'r1', roomCode: 'DEZ001', isHost: true, playerIndex: 0,
    playerNames: nomes, seatUids: nomes.map((_, i) => 'u' + i), youUid: 'u0', formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', ...extra } as never)
  return s
}
const temporada = (s: EscState) => reducer(s, { type: 'REPLAY_SEASON' } as never)

// ① 2 pessoas + 8 bots = 10, tabela de 10, 18 rodadas
const dez = start({ tamanhoLiga: 10 })
assert.equal(dez.tamanhoLiga, 10)
assert.equal(dez.managers.length, 10, '2 pessoas + 8 bots')
assert.equal(dez.managers.filter(m => m.isHuman).length, 2)
const dezT = temporada(dez)
assert.equal(dezT.league.length, 10, 'a tabela tem 10 (não completa com clubes até 20)')
assert.equal(dezT.fixtures.length, 18, '18 rodadas (turno e returno de 10)')
for (const r of dezT.fixtures) assert.equal(r.length, 5, 'cada rodada tem 5 jogos')
// padrão continua 20
const vinte = start()
assert.equal(vinte.tamanhoLiga, undefined)
assert.equal(vinte.managers.length, 20)
assert.equal(temporada(vinte).fixtures.length, 38)

// ② com mais de 10 pessoas (não deveria acontecer: a sala trava em 10), a liga cresce pra caber todo mundo
const onze = start({ tamanhoLiga: 10 }, Array.from({ length: 11 }, (_, i) => `Time ${i}`))
assert.equal(onze.managers.length, 11, 'ninguém fica de fora')

// ③ o que vem depois da liga fecha com 10
const fim = (s: EscState) => {
  let n = 0
  while (s.round < s.fixtures.length && n++ < 60) s = reducer(s, { type: 'PLAY_ROUND' } as never)
  assert.equal(s.round, 18, 'a temporada acaba na rodada 18')
  return reducer(s, { type: 'FINISH_SEASON' } as never)
}
const copa = fim(temporada(dez))
assert.ok(copa.quickCopa, 'Copa dos 8 nasce com liga de 10')
assert.equal(copa.quickCopa!.ties.length, 4, 'quartas com os 8 primeiros')
const lib = fim(temporada(start({ tamanhoLiga: 10, copaMode: 'liga_liberta' })))
assert.ok(lib.liberta, 'Libertadores nasce com liga de 10 (8 cabeças de chave)')
assert.equal(lib.liberta!.times.filter(t => t.pote === 1).length, 8)
assert.equal(lib.liberta!.times.length, 32, "32 na Libertadores")
const so = fim(temporada(start({ tamanhoLiga: 10, copaMode: 'liga' })))
assert.equal(so.screen, 'end', 'só liga fecha normal')

// ④ onde NÃO vale
assert.equal(start({ tamanhoLiga: 10, copaMode: 'relampago', relampagoChave: 16 }).tamanhoLiga, undefined, 'Relâmpago: tamanho da chave')
assert.equal(start({ tamanhoLiga: 10, copaMode: 'relampago', relampagoChave: 16 }).managers.length, 16)
assert.equal(start({ tamanhoLiga: 10, copaMode: 'champions' }).tamanhoLiga, undefined, 'Só Champions: tabela de 36')
assert.equal(start({ tamanhoLiga: 10, career: true }).tamanhoLiga, undefined, 'carreira em sala: sempre a pirâmide')
const fechada = start({ tamanhoLiga: 10, ligaFechada: true, liga: true }, ['A', 'B', 'C', 'D', 'E'])
assert.equal(fechada.tamanhoLiga, undefined, 'liga sem bots: o tamanho é a galera')
assert.equal(fechada.managers.length, 5)

// ⑤ novo leilão mantém 10; partida rápida offline volta pra 20
const novo = reducer(temporada(dez), { type: 'NEW_SEASON' } as never)
assert.equal(novo.managers.length, 10, 'novo leilão (mesmo time) continua de 10')
assert.equal(novo.tamanhoLiga, 10)
const offline = reducer(dezT, { type: 'START', teamName: 'Meu Time', formation: '4-3-3' } as never)
assert.equal(offline.tamanhoLiga, undefined, 'partida rápida offline não herda o 10 da sala')
assert.ok(offline.managers.length >= 20, 'offline: tabela de 20 (ou mais)')

// ⑥ peso do título (espelho do gatilho esc_titulo_peso_)
assert.equal(pesoDoTitulo({ tamanhoLiga: 10, copaMode: 'liga_copa' }), 1)
assert.equal(pesoDoTitulo({ tamanhoLiga: '10' }), 1)
assert.equal(pesoDoTitulo({ copaMode: 'relampago' }), 1)
assert.equal(pesoDoTitulo({ copaMode: 'champions' }), 2)
assert.equal(pesoDoTitulo({ copaMode: 'liga_copa' }), 2)
assert.equal(pesoDoTitulo(null), 2, 'sala não achada = 2 (nunca rebaixa por leitura que falhou)')
assert.equal(ptsTxt(1), '1 pt')
assert.equal(ptsTxt(4), '4 pts')

console.log('✅ liga de 10 times: 2 pessoas + 8 bots, 18 rodadas, copas fecham, novo leilão mantém, peso 1/2 ok')
process.exit(0) // o store abre o cliente do banco em segundo plano; a trava não espera por ele
