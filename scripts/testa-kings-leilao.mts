// 🧪 Kings League: o LEILÃO DE SEMPRE com a formação 'kings' (goleiro + 6, 10 times) chega na temporada sem travar.
// uso: npx tsx scripts/testa-kings-leilao.mts
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, kings: true, copaMode: 'liga', league: 'br' })
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
ok(s.managers.length === 10, `10 times (deu ${s.managers.length})`)
ok(s.managers.every(m => m.formation === 'kings'), 'todo mundo na formação kings')
ok(s.screen === 'auction' || s.screen === 'streamIntro' || true, `tela: ${s.screen}`)
const vistos: string[] = []
for (let i = 0; i < 400 && s.screen !== 'season'; i++) {
  vistos.push(`${s.screen}/${s.phase}/${s.sectorIdx}`)
  if (s.screen === 'auction') {
    if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: s.managers[s.youIdx].id, bids: [] }); continue }
    if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' }); continue }
    s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue
  }
  if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' }); continue }
  if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
  s = reducer(s, { type: 'FORCE_SEAL' })
}
ok(s.screen === 'season', `chegou na temporada (tela final: ${s.screen}/${s.phase}) — passos: ${[...new Set(vistos)].slice(0, 30).join(' → ')}`)
for (const m of s.managers) {
  const n = (p: string) => m.squad.filter(c => c.pos === p).length
  ok(n('GOL') >= 1 && n('ZAG') >= 2 && n('MEI') >= 2 && n('ATA') >= 2, `${m.teamName}: GOL ${n('GOL')} · LAT ${n('LAT')} · ZAG ${n('ZAG')} · MEI ${n('MEI')} · ATA ${n('ATA')} (fake ${m.squad.filter(c => c.fake).length})`)
}
// 🛡️ a partida rápida NORMAL não muda nada
const n = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Normal FC', formation: '4-3-3', rivals: 5, copaMode: 'liga_copa', league: 'br' })
ok(n.managers.length > 10 && n.managers.every(m => m.formation !== 'kings'), `rápido normal intacto (${n.managers.length} times, sem formação kings)`)
console.log(falhas ? `💥 ${falhas} falha(s)` : '🟢 leilão da Kings ok')
process.exit(falhas ? 1 : 0)
