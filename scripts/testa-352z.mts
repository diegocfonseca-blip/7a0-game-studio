// 🛡️ 23/11 — Diego: "poderia ter 451 e tb poderia ter 352 c 5 meias q hj só tem c dois laterais". O 3-5-2 de verdade é a chave
// '3-5-2z' (3 ZAG · 5 MEI · 2 ATA, sem lateral); o antigo (5-3-2 com os laterais de alas) segue pra quem já está nele.
// O início continua só 4-3-3/4-4-2 (Diego 23/11); 4-5-1 e 3-5-2 são de troca. Rodar: npm run 352z
import assert from 'node:assert/strict'
import { FORMATIONS, FORMACOES_JOGO, rotuloFormacao } from '../src/escalacao/types'
import type { EscState, FormationKey } from '../src/escalacao/types'
import { formacaoPorRotulo, formacaoAtual } from '../src/escalacao/formacoes'
import { Motor2 } from '../src/escalacao/motor2/motor'
import { reducer, INITIAL } from '../src/escalacao/store'
import { CATALOG } from '../src/escalacao/data'

assert.deepEqual(FORMATIONS['3-5-2z'], { GOL: 1, LAT: 0, ZAG: 3, MEI: 5, ATA: 2 }, 'o 3-5-2 novo: 3 zagueiros, 5 meias, 2 atacantes')
assert.ok(FORMACOES_JOGO.includes('3-5-2z') && FORMACOES_JOGO.includes('4-5-1'))
assert.equal(rotuloFormacao('3-5-2z'), '3-5-2')
assert.equal(formacaoPorRotulo('3-5-2')?.motor, '3-5-2z', 'o técnico que tem 3-5-2 passa a usar o novo')
assert.equal(formacaoAtual({ formation: '5-3-2', formationView: '3-5-2' }).motor, '5-3-2', 'quem está no 3-5-2 antigo continua no antigo')
assert.equal(formacaoAtual({ formation: '5-3-2', formationView: '3-5-2' }).alas, true)
assert.equal(formacaoAtual({ formation: '3-5-2z' }).rotulo, '3-5-2')
console.log('✅ tabela: 3-5-2 novo sem lateral, antigo preservado')

type C = { name: string; club: string; year: number; pos: string; fame: number; lo: number; hi: number }
const todas: C[] = Object.entries(CATALOG).flatMap(([pos, cs]) => (cs as C[]).map(c => ({ ...c, pos })))
const time = (need: Record<string, number>, off: number) => Object.entries(need).flatMap(([pos, n]) => todas.filter(c => c.pos === pos).slice(off, off + n))
for (let s = 1; s <= 20; s++) {
  const a = time(FORMATIONS['3-5-2z'], s), b = time(FORMATIONS['4-5-1'], s + 30)
  const m = new Motor2(s, a, b, false, ['3-5-2z', '4-5-1'], [0, 0], 'sol', [false, false])
  const lado0 = m.atl.filter(x => x.lado === 0)
  assert.equal(lado0.length, 11); assert.equal(lado0.filter(x => x.grupo === 'DEF').length, 3); assert.equal(lado0.filter(x => x.grupo === 'LAT').length, 0)
  m.avancaAte(96)
}
console.log('✅ motor novo: 20 jogos de 3-5-2 × 4-5-1 sem erro')

// partida rápida/carreira começando no 4-5-1: o leilão fecha o time e a rodada roda
function joga(formation: FormationKey) {
  let st = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation, rivals: 19, copaMode: 'liga', league: 'br' } as never)
  for (let g = 0; g < 4000 && st.screen !== 'season'; g++) {
    if (st.screen === 'auction') {
      if (st.phase === 'envelope' || st.phase === 'resq_envelope') { st = reducer(st, { type: 'SUBMIT_ENVELOPE', mgrId: st.managers[st.youIdx].id, bids: [] }); continue }
      if (st.phase === 'tiebreak') { st = reducer(st, { type: 'FORCE_TIEBREAK' }); continue }
      st = reducer(st, { type: 'ADVANCE_REVEAL' }); continue
    }
    if (st.screen === 'monte') { st = { ...st, monteDeadline: 1 }; st = reducer(st, { type: 'MONTE_TIMEOUT' }); continue }
    if (st.screen === 'cerimonia') { st = reducer(st, { type: 'FINISH_CEREMONY' }); continue }
    st = reducer(st, { type: 'FORCE_SEAL' })
  }
  assert.equal(st.screen, 'season', `${formation}: o leilão termina`)
  const eu = st.managers[st.youIdx]
  assert.equal(eu.formation, formation)
  for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const) assert.ok(eu.squad.filter(c => c.pos === p).length >= FORMATIONS[formation][p], `${formation}: ${p} fechado`)
  const r = reducer(st, { type: 'PLAY_ROUND' } as never)
  assert.equal(r.round, st.round + 1)
  return st
}
const st = joga('4-5-1')
console.log('✅ motor de liga com 4-5-1: leilão fecha 5 meias e 1 atacante, rodada roda')

// carreira: troca pro 3-5-2 novo com 3 zagueiros e 5 meias; barra sem
const c0 = { ...st, careerOnline: true }
const eu = c0.managers[c0.youIdx]
const extra = [...todas.filter(c => c.pos === 'ZAG').slice(50, 51), ...todas.filter(c => c.pos === 'ATA').slice(60, 61)].map((c, i) => ({ ...c, id: `x${i}`, paid: 1 }))
const com = { ...c0, managers: c0.managers.map(m => m.id === eu.id ? { ...m, squad: [...m.squad, ...extra] as never } : m) }
const tro = reducer(com, { type: 'CHANGE_FORMATION', formation: '3-5-2z' } as never)
assert.equal(tro.managers[tro.youIdx].formation, '3-5-2z', 'com 3 ZAG, 5 MEI e 2 ATA a troca pega')
assert.equal(reducer(tro, { type: 'PLAY_ROUND' } as never).round, tro.round + 1, 'a rodada roda no 3-5-2 novo')
const sem = reducer(c0, { type: 'CHANGE_FORMATION', formation: '3-5-2z' } as never)
assert.notEqual(sem.managers[sem.youIdx].formation, '3-5-2z', 'sem o 3º zagueiro/2º atacante a troca NÃO pega')
const antigo = { ...com, managers: com.managers.map(m => m.id === eu.id ? { ...m, formation: '5-3-2' as const, formationView: '3-5-2' } : m) }
assert.equal(reducer(antigo, { type: 'PLAY_ROUND' } as never).round, antigo.round + 1, 'quem está no 3-5-2 antigo segue jogando')
console.log('✅ carreira: troca pro 3-5-2 novo com o elenco certo, barra sem, e o antigo continua rodando')

// Liga Draft: MLD_FORMACAO aceita o 3-5-2 novo
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_ONLINE', ligaDraft: true, minhaLigaDraft: true, liga: true, seasonNo: 1, roomId: 'r1', roomCode: 'X', isHost: true, playerIndex: 0,
  playerNames: ['Dono', 'B'], seatUids: ['u0', 'u1'], youUid: 'u0', formation: '4-5-1', deck: 'todos', copaMode: 'liga' } as never)
const pos = ['GOL', 'ZAG', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA'] as const
s.managers[0].squad = pos.map((p, i) => ({ id: `c${i}`, name: `Jogador ${i}`, club: 'Clube', year: 2000, pos: p, fame: 3, lo: 70, hi: 80, paid: 1 })) as never
const n = reducer(s, { type: 'MLD_FORMACAO', mgrId: s.managers[0].id, formation: '3-5-2z' } as never)
assert.equal(n.managers[0].formation, '3-5-2z'); assert.equal(n.managers[0].formationView, undefined)
console.log('✅ Liga Draft: troca pro 3-5-2 novo (sem lateral nenhum no elenco)')
process.exit(0)
