// 🧪 Kings League: o LEILÃO DE SEMPRE com a formação 'kings' (goleiro + 6, 10 times) chega na temporada sem travar —
// em TODA combinação do leilão normal (Diego 15/10: "envelope, Tocaia, baralho BR/EU/Mundo, clubes ou jogador… é tudo igual").
// uso: npx tsx scripts/testa-kings-leilao.mts
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

function roda(league: 'br' | 'eu' | 'both', holandes: boolean, clubes: boolean) {
  const nome = `${clubes ? 'clubes' : 'jogador'} · ${holandes ? 'tocaia' : 'envelope'} · ${clubes ? 'todos' : league}`
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, kings: true, copaMode: 'liga', league, holandes, clubes })
  ok(s.managers.length === 10 && s.managers.every(m => m.formation === 'kings'), `${nome}: 10 times na formação kings`)
  ok(s.holandes === holandes && s.leilaoClubes === clubes, `${nome}: guardou o jeito do leilão escolhido`)
  if (s.screen === 'streamIntro') s = reducer(s, { type: 'START_STREAM_AUCTION' } as never)
  const vistos: string[] = []
  for (let i = 0; i < 3000 && s.screen !== 'season'; i++) {
    vistos.push(`${s.screen}/${s.phase}`)
    if (s.screen === 'auction') {
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
  ok(s.screen === 'season', `${nome}: chegou na temporada (parou em ${s.screen}/${s.phase}; passos ${[...new Set(vistos)].slice(0, 12).join(' → ')})`)
  const ruins = s.managers.filter(m => {
    const n = (p: string) => m.squad.filter(c => c.pos === p && !c.fake).length
    return !(n('GOL') >= 1 && n('ZAG') >= 2 && n('MEI') >= 2 && n('ATA') >= 2)
  })
  ok(ruins.length === 0, `${nome}: os 10 com goleiro + 2 zag + 2 mei + 2 ata de verdade${ruins.length ? ' — faltou em ' + ruins.map(m => m.teamName).join(', ') : ''}`)
}
for (const clubes of [false, true]) for (const holandes of [false, true]) for (const league of (clubes ? ['both'] : ['br', 'eu', 'both']) as ('br' | 'eu' | 'both')[]) roda(league, holandes, clubes)

// 🛡️ a partida rápida NORMAL não muda nada
const n = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Normal FC', formation: '4-3-3', rivals: 5, copaMode: 'liga_copa', league: 'br' })
ok(n.managers.length > 10 && n.managers.every(m => m.formation !== 'kings'), `rápido normal intacto (${n.managers.length} times, sem formação kings)`)
console.log(falhas ? `💥 ${falhas} falha(s)` : '🟢 leilão da Kings ok em todas as combinações')
process.exit(falhas ? 1 : 0)
