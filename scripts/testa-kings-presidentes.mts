// 🎩 Kings (12/11): o PRESIDENTE é a 5ª posição do leilão (vaga 'LAT', depois do ataque), nos dois baralhos e em todo jeito de
// lance; cada time fecha com 1 presidente; ele não entra em campo (fora da força/gols) e é ele que bate o 🎩 pênalti do presidente.
// E nada disso vaza: fora da Kings, a vaga 'LAT' continua sendo lateral de verdade.
// uso: npx tsx scripts/testa-kings-presidentes.mts
import { reducer, INITIAL, ordemSetores } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { PRESIDENTES_KINGS } from '../src/escalacao/kings-presidentes'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const PRES = new Set(PRESIDENTES_KINGS.map(p => p.name))

function ateTemporada(s: EscState): { s: EscState; ordem: string[] } {
  if (s.screen === 'streamIntro') s = reducer(s, { type: 'START_STREAM_AUCTION' } as never)
  const ordem: string[] = []
  for (let i = 0; i < 4000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') {
      const pos = s.currentCards[0]?.pos
      if (pos && ordem[ordem.length - 1] !== pos && !s.envUnico) ordem.push(pos)
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: s.managers[s.youIdx].id, bids: [] }); continue }
      if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.phase === 'holandes') { s = reducer(s, { type: 'HOLANDES_TICK' } as never); continue }
      s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue
    }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' }); continue }
    if (s.screen === 'convocacao') { s = { ...s, convocacaoDeadline: 1 }; s = reducer(s, { type: 'CONVOCACAO_TIMEOUT' } as never); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
    s = reducer(s, { type: 'FORCE_SEAL' })
  }
  return { s, ordem }
}
for (const kb of [true, false]) for (const holandes of [false, true]) for (const envUnico of [false, true]) {
  if (holandes && envUnico) continue
  const nome = `${kb ? 'jogadores da Kings' : 'baralho padrão'} · ${envUnico ? 'envelope único' : holandes ? 'tocaia' : 'envelope'}`
  const r = ateTemporada(reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, kings: true, copaMode: 'liga', league: 'br', holandes, envUnico, kingsBaralho: kb } as never))
  const s = r.s
  ok(s.screen === 'season', `${nome}: chegou na temporada`)
  if (!envUnico) ok(r.ordem.join(',') === 'GOL,ZAG,MEI,ATA,LAT', `${nome}: ordem do leilão GOL→ZAG→MEI→ATA→🎩 (deu ${r.ordem.join(',')})`)
  const presDe = s.managers.map(m => m.squad.filter(c => c.presidente))
  ok(presDe.every(p => p.length === 1), `${nome}: os 10 times com 1 presidente (${presDe.map(p => p.length).join('')})`)
  ok(presDe.flat().every(c => c.pos === 'LAT' && PRES.has(c.name)), `${nome}: presidente é da lista e mora na vaga LAT`)
  ok(new Set(presDe.flat().map(c => c.name)).size === presDe.flat().length, `${nome}: nenhum presidente repetido`)
  ok(s.managers.every(m => m.squad.filter(c => c.pos === 'LAT').every(c => c.presidente)), `${nome}: nenhum lateral de verdade na Kings`)
  // o presidente bate o pênalti do presidente e não faz gol de bola rolando
  let s2 = s
  for (let k = 0; k < 9; k++) s2 = reducer(s2, { type: 'PLAY_ROUND' })
  const golsPres = s2.lastResults.flatMap(x => x.highlights).filter(h => h.text.startsWith('🎩 PÊNALTI DO PRESIDENTE! ') && / marca pro /.test(h.text))
  const comNome = golsPres.every(h => PRES.has(/! (.+?) marca pro /.exec(h.text)?.[1] ?? ''))
  ok(comNome, `${nome}: o gol do pênalti do presidente leva o NOME do presidente comprado (${golsPres.length} na última rodada)`)
  // (por CARTA: o Falcão do Inter 1979 é jogador de verdade no baralho padrão — homônimo do presidente do Nyvelados)
  const presDoTime = (id: number) => s2.managers.find(m => m.id === id)?.squad.find(c => c.presidente)?.name
  const jogaDeVerdade = (id: number, nome: string) => !!s2.managers.find(m => m.id === id)?.squad.some(c => !c.presidente && c.name === nome)
  const rolando = s2.lastResults.flatMap(x => x.highlights).filter(h => { const p = h.teamId != null ? presDoTime(h.teamId) : undefined; return h.kind === 'gol' && !h.text.startsWith('🎩') && !!p && h.text.includes(`⚽ ${p} marca`) && !jogaDeVerdade(h.teamId!, p) })
  ok(rolando.length === 0, `${nome}: presidente não faz gol de bola rolando`)
}
// 🚫 não vaza: rápido normal depois da Kings volta com lateral de verdade e a ordem de sempre
{
  const r = ateTemporada(reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, copaMode: 'liga', league: 'br' } as never))
  ok(ordemSetores().join(',') === 'GOL,LAT,ZAG,MEI,ATA', 'rápido normal: ordem de sempre')
  ok(r.s.managers.every(m => m.squad.every(c => !c.presidente)), 'rápido normal: nenhum presidente')
  ok(r.s.managers.some(m => m.squad.some(c => c.pos === 'LAT')), 'rápido normal: tem lateral de verdade')
}
console.log(falhas ? `🔴 ${falhas} falha(s)` : '🟢 presidentes da Kings ok')
process.exit(falhas ? 1 : 0)
