// 🧪 06/11 — o MOTOR das mudanças da liga: Liga Draft com leilão de Clubes/Seleções, turno único (só ida) e a liga crescendo de
// 10 pra 20 na volta (bots novos sem repetir jogador que já está noutro time). Rodar: npx tsx scripts/testa-liga-vaga-motor.mts
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import { montaCarry, chaveNome } from '../src/escalacao/liga-draft'
import type { EscState } from '../src/escalacao/types'

const NOMES = ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Tocaia SC']
const UIDS = ['u0', 'u1', 'u2', 'u3']
const start = (extra: Record<string, unknown> = {}) => {
  let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'VAGA01', isHost: true, playerIndex: 0,
    playerNames: NOMES, seatUids: UIDS, youUid: 'u0', formation: '4-3-3', deck: 'todos', copaMode: 'liga', ...extra } as never)
  return s
}

// ① Liga Draft + Clubes: continua sendo Liga Draft e o pregão é de pacotes
const cl = start({ clubes: true })
assert.equal(cl.minhaLigaDraft, true, 'Liga Draft com Clubes continua Liga Draft')
assert.equal(cl.leilaoClubes, true, 'o leilão é de clubes')
const sel = start({ clubes: true, selecao: true })
assert.equal(sel.minhaLigaDraft && sel.leilaoSelecao, true, 'Liga Draft com Seleções')
assert.equal(start({ clubes: true, minhaLigaDraft: false }).ligaDraft, false, 'a Liga Draft antiga (fraca) continua sem clubes')
console.log('✅ Liga Draft com Jogador / Clubes / Seleções')

// ② turno único: 19 rodadas com 20 times, 9 com 10
const t20 = reducer(start({ turnoUnico: true }), { type: 'REPLAY_SEASON' } as never)
assert.equal(t20.fixtures.length, 19, '20 times só ida = 19 rodadas')
const t10 = reducer(start({ turnoUnico: true, tamanhoLiga: 10 }), { type: 'REPLAY_SEASON' } as never)
assert.equal(t10.fixtures.length, 9, '10 times só ida = 9 rodadas')
assert.equal(reducer(start(), { type: 'REPLAY_SEASON' } as never).fixtures.length, 38, 'padrão segue 38')
assert.equal(reducer(start({ turnoUnico: true, liga: false }), { type: 'REPLAY_SEASON' } as never).fixtures.length, 38, 'fora da liga não existe turno único')
console.log('✅ turno único: 19 / 9 rodadas')

// ③ a liga de 10 volta com 20: os 6 bots antigos ficam com o elenco, entram 10 bots novos e ninguém repete jogador
const dez = start({ tamanhoLiga: 10 })
const prev = { managers: dez.managers, seatUids: UIDS, league: dez.managers.map((m, i) => ({ id: m.id, name: m.teamName, pts: 50 - i, w: 0, gf: 0, ga: 0 })),
  fixtures: new Array(18).fill(0), round: 18, seasonNo: 1, draftFeito: 1 }
for (const m of dez.managers.filter(m => m.isHuman)) m.squad = dez.managers.find(b => !b.isHuman)!.squad.slice(0, 0) // (os humanos vão receber elenco abaixo)
// humanos com 11 cartas de verdade (tiradas de bots de uma liga de 20, que não estão nesta)
const doador = start()
dez.managers.filter(m => m.isHuman).forEach((m, i) => { m.squad = doador.managers.filter(b => !b.isHuman)[i].squad.map(c => ({ ...c })) })
const carry = montaCarry(prev as never, UIDS)!
const vinte = start({ draftCarry: carry, seasonNo: 2 })
assert.equal(vinte.managers.length, 20, 'cresceu pra 20 times')
const botsVelhos = dez.managers.filter(m => !m.isHuman).map(b => b.squad.map(c => c.name).join('|'))
assert.ok(botsVelhos.every(sq => vinte.managers.some(m => !m.isHuman && m.squad.map(c => c.name).join('|') === sq)), 'os 6 bots de antes voltam com o mesmo elenco')
assert.ok(vinte.managers.filter(m => m.isHuman).every((m, i) => m.squad[0]?.name === dez.managers.filter(x => x.isHuman)[i].squad[0]?.name), 'cada pessoa com o próprio time')
const carregados = new Set(vinte.managers.slice(0, 10).flatMap(m => m.squad.map(c => chaveNome(c.name))))
const dosNovos = vinte.managers.slice(10).flatMap(m => m.squad.filter(c => c.club !== 'Várzea').map(c => chaveNome(c.name)))
assert.ok(dosNovos.every(n => !carregados.has(n)), 'bot novo não traz jogador que já está noutro time')
assert.equal(new Set(dosNovos).size, dosNovos.length, 'e não repete entre os bots novos')
assert.ok(vinte.managers.slice(10).every(m => m.squad.length >= 11), 'todo bot novo com elenco completo')
assert.ok(vinte.managers.every((m, i) => m.id === i), 'ids 0..19 em ordem')
console.log('✅ 10 → 20 na volta: bots antigos ficam, novos entram, ninguém repetido')
console.log('\n✅ motor da liga já começada: tudo certo')
