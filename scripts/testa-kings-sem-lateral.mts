// 👑 TRAVA (11/11, Diego: *"pregão aberto, às cegas, Tocaia e etc não terá lateral"*): nenhum jeito de lance da Kings mostra
// lateral nem põe lateral no elenco, com o baralho da Kings e com o padrão; todo mundo fecha 7. Rodar: npm run kings-sem-lateral
import { reducer, INITIAL } from '../src/escalacao/store'
let falhas = 0
const nowRef = { t: 1_800_000_000_000 }; Date.now = () => nowRef.t
for (const modo of ['envelope', 'tocaia', 'pregao', 'unico']) for (const kb of [true, false]) {
  let s: any = reducer(structuredClone(INITIAL) as any, { type: 'START', teamName: 'T', formation: '4-3-3', rivals: 9, kings: true, kingsBaralho: kb, copaMode: 'liga', league: 'br', holandes: modo === 'tocaia', pregaoAberto: modo === 'pregao', envUnico: modo === 'unico' } as any)
  let lat = 0, passos = 0
  const olha = () => { for (const c of [...(s.currentCards ?? []), ...Object.values(s.deck ?? {}).flat(), ...(s.monte ?? []), ...((s.pa?.fila ?? []) as any[]), ...((s.pa?.mesa ?? []) as any[]).map((x: any) => x?.card ?? x)]) if (c && c.pos === 'LAT') lat++ }
  for (let i = 0; i < 20000 && s.screen !== 'season'; i++, passos++) {
    olha()
    if (s.screen === 'auction') {
      if (s.pregaoAberto) { nowRef.t += 1500; s = reducer(s, { type: 'PREGAO_ABERTO_TICK' } as any); continue }
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer({ ...s, phaseDeadline: 1 }, { type: 'FORCE_SEAL' } as any); continue }
      if (s.phase === 'tiebreak') { s = reducer({ ...s, phaseDeadline: 1 }, { type: 'FORCE_TIEBREAK' } as any); continue }
      if (s.phase === 'holandes') { s = reducer(s, { type: 'HOLANDES_TICK' } as any); continue }
      s = reducer(s, { type: 'ADVANCE_REVEAL' } as any); continue
    }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' } as any); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' } as any); continue }
    s = reducer(s, { type: 'FORCE_SEAL' } as any)
  }
  const latElenco = s.managers.reduce((a: number, m: any) => a + m.squad.filter((c: any) => c.pos === 'LAT').length, 0)
  if (s.screen !== 'season' || lat || latElenco || s.managers.some((m: any) => m.squad.length !== 7)) falhas++
  console.log(`${modo} ${kb ? 'kings' : 'padrão'}: tela ${s.screen} · lateral visto ${lat} · lateral nos elencos ${latElenco} · elencos ${s.managers.map((m: any) => m.squad.length).join(',')}`)
}
if (falhas) { console.log(`🔴 ${falhas} falha(s)`); process.exit(1) }
console.log('🟢 Kings sem lateral em todo jeito de lance')
process.exit(0)
