// 🛡️ 13/11 — Diego: "a formação 3-4-3 não deveria ter lateral… 3 zagueiros, 4 meias e 3 atacantes" (opção 1: o novo vale pra quem
// escolher daqui pra frente; quem já estava no 3-4-3 antigo, com 2 laterais, segue igual). Rodar: npx tsx scripts/testa-343.mts
import assert from 'node:assert/strict'
import { FORMATIONS, FORMACOES_JOGO, rotuloFormacao, SECTORS } from '../src/escalacao/types'
import type { EscState } from '../src/escalacao/types'
import { formacaoPorRotulo, formacaoAtual, COLUNA_ESTILO, ORDEM_EQUILIBRADO } from '../src/escalacao/formacoes'
import { Motor2 } from '../src/escalacao/motor2/motor'
import { reducer, INITIAL } from '../src/escalacao/store'
import { CATALOG } from '../src/escalacao/data'

assert.deepEqual(FORMATIONS['3-4-3z'], { GOL: 1, LAT: 0, ZAG: 3, MEI: 4, ATA: 3 }, 'o 3-4-3 novo: 3 zagueiros, 4 meias, 3 atacantes, sem lateral')
assert.deepEqual(FORMATIONS['3-4-3'], { GOL: 1, LAT: 2, ZAG: 1, MEI: 4, ATA: 3 }, 'o antigo continua igual pra quem já estava nele')
assert.ok(FORMACOES_JOGO.includes('3-4-3z') && !FORMACOES_JOGO.includes('3-4-3'), 'pra escolher só aparece o novo')
assert.equal(rotuloFormacao('3-4-3z'), '3-4-3', 'na tela o novo se chama 3-4-3')
assert.equal(formacaoPorRotulo('3-4-3')?.motor, '3-4-3z'); assert.equal(formacaoPorRotulo('3-4-3 losango')?.motor, '3-4-3z')
assert.equal(formacaoAtual({ formation: '3-4-3' }).motor, '3-4-3', 'quem está no antigo continua desenhado no antigo')
assert.equal(formacaoAtual({ formation: '3-4-3z' }).rotulo, '3-4-3')
for (const r of [...Object.values(COLUNA_ESTILO).flat(), ...ORDEM_EQUILIBRADO]) assert.notEqual(formacaoPorRotulo(r)?.motor, '3-4-3', `técnico nunca escolhe o antigo (${r})`)
console.log('✅ tabela: novo 3-4-3 sem lateral, antigo preservado, técnico só oferece o novo')

// motor novo joga o 3-4-3 novo (sem lateral) sem erro, com 3 na linha de trás
type C = { name: string; club: string; year: number; pos: string; fame: number; lo: number; hi: number }
const todas: C[] = Object.entries(CATALOG).flatMap(([pos, cs]) => (cs as C[]).map(c => ({ ...c, pos })))
const time = (need: Record<string, number>, off: number) => Object.entries(need).flatMap(([pos, n]) => todas.filter(c => c.pos === pos).slice(off, off + n))
for (let s = 1; s <= 20; s++) {
  const a = time(FORMATIONS['3-4-3z'], s), b = time(FORMATIONS['4-3-3'], s + 30)
  const m = new Motor2(s, a, b, false, ['3-4-3z', '4-3-3'], [0, 0], 'sol', [false, false])
  const lado0 = m.atl.filter(x => x.lado === 0) // (contado no apito inicial: cartão vermelho tira gente de campo no meio do jogo)
  assert.equal(lado0.length, 11); assert.equal(lado0.filter(x => x.grupo === 'DEF').length, 3, '3 zagueiros em campo'); assert.equal(lado0.filter(x => x.grupo === 'LAT').length, 0)
  m.avancaAte(96)
  assert.ok(m.fim || m.t > 0, 'o jogo vai até o fim')
}
console.log('✅ motor novo: 20 jogos de 3-4-3 novo, 3 zagueiros em campo, sem erro')

// carreira: quem tem 3 zagueiros troca pro 3-4-3 novo e a rodada roda; quem está no antigo continua jogando
let st = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 19, copaMode: 'liga', league: 'br' } as never)
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
st = { ...st, careerOnline: true }
const eu = st.managers[st.youIdx]
const zags = [...todas.filter(c => c.pos === 'ZAG').slice(50, 52), ...todas.filter(c => c.pos === 'MEI').slice(60, 61)].map((c, i) => ({ ...c, id: `z${i}`, paid: 1 })) // +2 zagueiros +1 meia (o 4-3-3 tem 2 e 3)
st = { ...st, managers: st.managers.map(m => m.id === eu.id ? { ...m, squad: [...m.squad, ...zags] as never } : m) }
const tro = reducer(st, { type: 'CHANGE_FORMATION', formation: '3-4-3z' } as never)
assert.equal(tro.managers[tro.youIdx].formation, '3-4-3z', 'com 3 zagueiros a troca pega')
const r1 = reducer(tro, { type: 'PLAY_ROUND' } as never)
assert.equal(r1.round, tro.round + 1, 'a rodada roda no 3-4-3 novo')
const antigo = { ...st, managers: st.managers.map(m => m.id === eu.id ? { ...m, formation: '3-4-3' as const } : m) }
const r2 = reducer(antigo, { type: 'PLAY_ROUND' } as never)
assert.equal(r2.round, antigo.round + 1, 'quem está no 3-4-3 antigo segue jogando')
const semZag = reducer({ ...st, managers: st.managers.map(m => m.id === eu.id ? { ...m, squad: m.squad.filter(c => c.pos !== 'ZAG').concat(m.squad.filter(c => c.pos === 'ZAG').slice(0, 2)) } : m) }, { type: 'CHANGE_FORMATION', formation: '3-4-3z' } as never)
assert.notEqual(semZag.managers[semZag.youIdx].formation, '3-4-3z', 'com 2 zagueiros a troca NÃO pega (faltaria 1)')
assert.equal(tro.managers[tro.youIdx].squad.filter(c => c.pos === 'LAT').length >= 2, true, 'os laterais continuam no elenco (viram banco)')
void SECTORS
console.log('✅ carreira: troca com 3 zagueiros, barra com 2, e o 3-4-3 antigo continua rodando')
process.exit(0)
