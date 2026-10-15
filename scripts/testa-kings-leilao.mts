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

// 👑 a TEMPORADA da Kings roda no motor de sempre: 9 rodadas, ninguém empata (shootout), pontos 3/2/1/0, mata-mata jogo único
{
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 9, kings: true, copaMode: 'liga', league: 'br' })
  for (let i = 0; i < 3000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') {
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') { s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: s.managers[s.youIdx].id, bids: [] }); continue }
      if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' }); continue }
      s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue
    }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' }); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
    s = reducer(s, { type: 'FORCE_SEAL' })
  }
  ok(s.league.length === 10 && s.fixtures.length === 9 && s.fixtures.every(r => r.length === 5), `liga da Kings: 10 times, 9 rodadas de 5 jogos (deu ${s.league.length} times, ${s.fixtures.length} rodadas)`)
  let empate = false, semKings = false, agendaIgual = true, decidiu = 0, defendeuQuandoMandou = true, umaVez = true
  for (let r = 0; r < 9; r++) {
    s = reducer(s, { type: 'PLAY_ROUND' })
    // 🗓️ o presidente da casa e o do visitante batem no MESMO minuto em todos os jogos da rodada
    const mins = s.lastResults.map(x => (x.kings?.duelos ?? []).filter(d => d.key.startsWith('pres')).map(d => d.min).join(','))
    if (new Set(mins).size !== 1) agendaIgual = false
    // 🥅 a pessoa escolhe: no pênalti do presidente do SEU time, chuta no canto em que o goleiro do bot pula → defendido
    const meu = s.lastResults.find(x => x.kingsBase)!
    const eu = s.managers[s.youIdx].id
    const presMeu = meu.kings!.duelos!.find(d => d.tipo === 'presidente' && d.batedor === eu)!
    const ptsAntes = s.league.reduce((a, t) => a + t.pts, 0)
    s = reducer(s, { type: 'KINGS_DECIDIR', key: presMeu.key, canto: presMeu.pulo })
    const depois = s.lastResults.find(x => x.kingsBase)!
    const d2 = depois.kings!.duelos!.find(d => d.key === presMeu.key)!
    if (d2.gol || d2.chute !== presMeu.pulo) defendeuQuandoMandou = false
    if (s.league.reduce((a, t) => a + t.pts, 0) !== ptsAntes) empate = true
    decidiu++
    const s2 = reducer(s, { type: 'KINGS_DECIDIR', key: presMeu.key, canto: (presMeu.pulo + 1) % 6 })
    if (JSON.stringify(s2.lastResults) !== JSON.stringify(s.lastResults)) umaVez = false
    for (const x of s.lastResults) { if (!x.kings) semKings = true; if (x.hg === x.ag && !x.kings?.pens) empate = true }
  }
  ok(!semKings, 'todo jogo passou pela regra da Kings (dado, presidente, bola)')
  ok(agendaIgual, 'presidente da casa e do visitante no MESMO minuto em todos os jogos da rodada')
  ok(decidiu === 9 && defendeuQuandoMandou, 'a escolha da pessoa vale: chutou onde o goleiro pulou = defendido')
  ok(umaVez, 'a escolha vale UMA vez por cobrança')
  ok(!empate, 'nenhum jogo termina empatado sem shootout')
  const pts = s.league.reduce((a, t) => a + t.pts, 0)
  ok(pts === 45 * 3, `todo jogo distribui 3 pontos (3+0 ou 2+1): ${pts} de ${45 * 3}`)
  const meu = s.lastResults.find(x => x.homeId === s.managers[s.youIdx].id || x.awayId === s.managers[s.youIdx].id)
  ok(!!meu && meu.highlights.filter(h => h.kind === 'gol').length === meu.hg + meu.ag, 'o placar do seu jogo bate com os lances de gol')
  const golsArt = s.scorers.reduce((a, x) => a + x.goals, 0)
  ok(golsArt > 0, `artilharia da liga andou (${golsArt} gols)`)
  s = reducer(s, { type: 'FINISH_SEASON' })
  ok(s.quickCopa?.phase === 'quartas' && s.quickCopa.ties.length === 3 && s.quickCopa.kingsDireto != null, 'fim da liga: 3 quartas + o 1º direto na semi')
  s = reducer(s, { type: 'START_COPA' })
  // 🥅 a escolha também vale no mata-mata: o jogo é refeito e o confronto fica coerente (placar, shootout, quem passa)
  {
    let t = structuredClone(s)
    // garante gente num confronto das quartas (o time de teste pode estar direto na semi)
    const alvo = t.quickCopa!.ties[0].aId
    t.managers = t.managers.map(m => m.id === alvo ? { ...m, isHuman: true } : m)
    t.youIdx = t.managers.findIndex(m => m.id === alvo)
    for (let i = 0; i < 6 && !t.quickCopa!.ties.some(x => x.kingsJogo); i++) t = reducer(t, { type: 'PLAY_COPA_LEG' })
    const tie = t.quickCopa!.ties.find(x => x.kingsJogo)
    if (tie) {
      const d = tie.kingsJogo!.kings!.duelos![0]
      const eu = t.managers[t.youIdx].id
      const canto = d.batedor === eu ? d.pulo : d.chute
      t = reducer(t, { type: 'KINGS_DECIDIR', key: d.key, canto })
      const t2 = t.quickCopa!.ties.find(x => x.aId === tie.aId)!
      const [a, b] = t2.legs[0]
      const coerente = a !== b ? (t2.winner === (a > b ? t2.aId : t2.bId) && !t2.pens) : (!!t2.pens && t2.winner === (t2.pens[0] > t2.pens[1] ? t2.aId : t2.bId))
      ok(coerente && t2.kingsJogo?.kingsBase?.decisoes[d.key] === canto, `mata-mata: a escolha refaz o jogo e quem passa bate com o placar (${a}×${b}${t2.pens ? ` pên ${t2.pens.join('×')}` : ''})`)
    } else ok(true, 'mata-mata: você não jogou esta fase (sem cobrança pra escolher)')
  }
  const fases: string[] = []
  for (let i = 0; i < 20 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) { fases.push(`${s.quickCopa.phase}(${s.quickCopa.ties.length})`); s = reducer(s, { type: 'PLAY_COPA_LEG' }) }
  ok(JSON.stringify([...new Set(fases)]) === JSON.stringify(['quartas(3)', 'semis(2)', 'final(1)']), `mata-mata jogo único: ${[...new Set(fases)].join(' → ')}`)
  ok(!!s.quickCopa?.champion && s.screen === 'end', `campeão da Kings: ${s.quickCopa?.champion?.name}`)
  const semi = s.quickCopa?.bracket.find(b => b.phase === 'semis')
  ok(!!semi && semi.ties[0].aId === sortedTableIds(s)[0], 'o 1º da liga jogou a semi')
  ok(s.quickCopa!.bracket.every(b => b.ties.every(t => t.legs.length === 1)), 'todo jogo do mata-mata foi jogo único')
}
function sortedTableIds(s: EscState) { return [...s.league].sort((a, b) => b.pts - a.pts || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name)).map(t => t.id) }

// 🛡️ a partida rápida NORMAL não muda nada
const n = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Normal FC', formation: '4-3-3', rivals: 5, copaMode: 'liga_copa', league: 'br' })
ok(n.managers.length > 10 && n.managers.every(m => m.formation !== 'kings'), `rápido normal intacto (${n.managers.length} times, sem formação kings)`)
console.log(falhas ? `💥 ${falhas} falha(s)` : '🟢 leilão da Kings ok em todas as combinações')
process.exit(falhas ? 1 : 0)
