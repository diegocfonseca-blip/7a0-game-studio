import { CATALOG_BOTH } from './data'
import { calendarioChampions, potesChampions } from './champions'
import { INTERNATIONAL_CLUBS, internationalBotSquads, internationalCardKey, validInternationalXI, type InternationalCompetition } from './career-international'
import { GOAL_TUNE, TACS, mid, mulberry, pickAssist, poisson, rollForm, shuffle } from './pyramidseason'
import { entradaM2, resultadoM2, sementeM2, taticaM2, type EntradaM2 } from './motor2/carreira'
import type { VersaoM2 } from './motor2/versao'
import { disputaPenaltis } from './penaltis'
import type { Card } from './types'

export type InternationalTeam = {
  id: string
  institution: string
  name: string
  competition: InternationalCompetition
  block: number
  you: boolean
  teamId: number
  xi: Card[]
}
export type InternationalGoal = { name: string; card: string; min: number; home: boolean; assist?: string; assistCard?: string }
/** `m2` = jogo decidido pelo motor novo (21/10): a semente e a tática de cada lado — o campinho remonta o MESMO motor com os
 *  elencos da campanha (`entradaInternacionalM2`), sem guardar os 22 de novo no save */
export type InternationalMatch = { home: string; away: string; hg: number; ag: number; goals: InternationalGoal[]; m2?: { s: number; t: [number, number]; versao?: VersaoM2 } }
export type InternationalTie = { home: string; away: string; matches: InternationalMatch[]; winner: string; penalties?: [number, number] }
export type InternationalPhase = { title: string; competition: InternationalCompetition | 'mundial'; matches: InternationalMatch[]; ties?: InternationalTie[] }
export type InternationalStep = { label: string; libertadores?: InternationalPhase; champions?: InternationalPhase; mundial?: InternationalPhase }
export type InternationalTableRow = { team: string; played: number; points: number; w: number; d: number; l: number; gf: number; ga: number }
export type InternationalStat = { key: string; name: string; club: string; year: number; team: string; teamName: string; teamId: number; you: boolean; games: number; goals: number; assists: number }
export type InternationalCampaign = {
  season: number
  seed: number
  representedClub: string | null
  userTeam: string
  priority: number | null
  registeredXI: string[]
  teams: InternationalTeam[]
  steps: InternationalStep[]
  libertadoresGroups: InternationalTableRow[][]
  championsTable: InternationalTableRow[]
  libertadoresChampion: string
  championsChampion: string
  mundialChampion: string
  statistics: InternationalStat[]
  reveal: number
  /** ✉️ os clubes cujo convite o presidente RECUSOU (02/10) — o jornal provoca se um deles for campeão */
  recusados?: string[]
}
export type InternationalHistoryEntry = {
  season: number
  representedClub: string | null
  userTeam: string
  competition: InternationalCompetition | null
  priority: number | null
  games: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number
  libertadores: number; champions: number; mundial: number; runnerUp: number
  bestCampaign: string
  prizeCoins: number
  topScorer?: { name: string; club: string; year: number; goals: number }
  topAssist?: { name: string; club: string; year: number; assists: number }
  playerStats: { key: string; name: string; club: string; year: number; games: number; goals: number; assists: number }[]
  /** Histórico de todos os 72 clubes e cartas, inclusive bots. Opcional para saves anteriores. */
  teamRecords?: { club: string; games: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }[]
  /** chave da carta, clube representado, jogos, gols, assistências; forma curta para caber no save local. */
  botPlayerStats?: [string, string, number, number, number][]
  libertadoresChampion: string; championsChampion: string; mundialChampion: string
  /** ✉️ convites recusados naquela temporada (opcional: saves antigos não têm) */
  recusados?: string[]
}

const xiCardKey = (card: Card) => internationalCardKey(card)
const footballCards: Card[] = Object.entries(CATALOG_BOTH).flatMap(([pos, list]) => list.map(c => ({
  ...c, pos: pos as Card['pos'], id: `internacional:${xiCardKey(c as Card)}`,
})))

function groupRounds(ids: string[]): [string, string][][] {
  const ring = [...ids]
  const rounds: [string, string][][] = []
  for (let r = 0; r < ring.length - 1; r++) {
    const pairs: [string, string][] = []
    for (let i = 0; i < ring.length / 2; i++) {
      const a = ring[i], b = ring[ring.length - 1 - i]
      pairs.push(r % 2 ? [b, a] : [a, b])
    }
    rounds.push(pairs)
    ring.splice(1, 0, ring.pop()!)
  }
  return rounds
}

const emptyRow = (team: string): InternationalTableRow => ({ team, played: 0, points: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
/** Tabela a partir de uma lista de jogos. Exportada (01/10) pra tela montar a classificação PARCIAL só com as noites já reveladas — sem spoiler. */
export function tableFor(ids: readonly string[], matches: readonly InternationalMatch[]): InternationalTableRow[] {
  const rows = new Map(ids.map(id => [id, emptyRow(id)]))
  for (const m of matches) {
    const h = rows.get(m.home), a = rows.get(m.away)
    if (!h || !a) continue
    h.played++; a.played++; h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg
    if (m.hg === m.ag) { h.d++; a.d++; h.points++; a.points++ }
    else if (m.hg > m.ag) { h.w++; a.l++; h.points += 3 }
    else { a.w++; h.l++; a.points += 3 }
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team))
}

/** ⚽🧠 a entrada do motor novo de um jogo internacional decidido por ele (o campinho anima ESTE motor) */
export function entradaInternacionalM2(teams: readonly InternationalTeam[], match: InternationalMatch): EntradaM2 | undefined {
  if (!match.m2) return undefined
  const h = teams.find(t => t.id === match.home), a = teams.find(t => t.id === match.away)
  if (!h || !a) return undefined
  return entradaM2({ versao: match.m2.versao, seed: match.m2.s, casa: h.xi as never, fora: a.xi as never, tatica: match.m2.t, bots: [!h.you, !a.you] })
}

/** Resultado e calendário completos são congelados no save no início da campanha.
 *  ⚽🧠 `motor2` (21/10, carreira = motor novo): o jogo do time que o presidente comanda é decidido pelo motor v2 — o dado da
 *  campanha é gasto IGUAL (nenhum jogo de bot muda por causa disso, só o chaveamento que depende de quem passou). */
export function makeInternationalCampaign(input: {
  season: number; seed: number; representedClub: string | null; userTeam: string; userId: number
  priority: number | null; userXI: Card[]; motor2?: boolean; versaoM2?: VersaoM2
}): InternationalCampaign {
  const { season, seed, representedClub, userTeam, userId, priority, userXI, motor2 } = input
  if (representedClub && (!validInternationalXI(userXI) || new Set(userXI.map(c => c.id)).size !== 11 || userXI.some(c => (c as Card & { fake?: boolean }).fake))) throw new Error('Inscrição internacional inválida')
  let rng = mulberry((seed ^ Math.imul(season, 0x9E3779B1) ^ 0x1A7E25) >>> 0)
  const squads = internationalBotSquads(footballCards, representedClub, userXI)
  const teams: InternationalTeam[] = INTERNATIONAL_CLUBS.map(club => ({
    id: club.name, institution: club.name, name: club.name === representedClub ? userTeam : club.name,
    competition: club.competition, block: club.block, you: club.name === representedClub,
    teamId: club.name === representedClub ? userId : -1,
    xi: club.name === representedClub ? userXI : squads.get(club.name)!,
  }))
  const byId = new Map(teams.map(team => [team.id, team]))
  const stats = new Map<string, InternationalStat>()
  let matchNo = 0
  const stat = (team: InternationalTeam, card: Card) => {
    const key = xiCardKey(card)
    const existing = stats.get(key)
    if (existing) return existing
    const row: InternationalStat = { key, name: card.name, club: card.club, year: card.year, team: team.id, teamName: team.name, teamId: team.teamId, you: team.you, games: 0, goals: 0, assists: 0 }
    stats.set(key, row)
    return row
  }
  const placarVelho = new WeakMap<InternationalMatch, [number, number]>() // o placar da conta antiga (pros pênaltis gastarem o dado igual)
  const play = (homeId: string, awayId: string): InternationalMatch => {
    const h = byId.get(homeId)!, a = byId.get(awayId)!
    matchNo++
    for (const c of h.xi) stat(h, c).games++
    for (const c of a.xi) stat(a, c).games++
    const th = TACS[Math.floor(rng() * TACS.length)], ta = TACS[Math.floor(rng() * TACS.length)]
    const fh = rollForm(h.xi, th, ta, rng), fa = rollForm(a.xi, ta, th, rng)
    const dayH = .85 + rng() * .3, dayA = .85 + rng() * .3
    fh.atk *= dayH; fh.def *= dayH; fa.atk *= dayA; fa.def *= dayA
    const qual = (n: number) => Math.max(.5, Math.min(1.2, n / 66))
    const tune = GOAL_TUNE.v3
    const hg = poisson(Math.max(.08, (tune.base + (fh.atk - fa.def) * tune.coef + tune.home) * qual(fh.atk)), rng)
    const ag = poisson(Math.max(.08, (tune.base + (fa.atk - fh.def) * tune.coef) * qual(fa.atk)), rng)
    const goals: InternationalGoal[] = []
    const credit = (team: InternationalTeam, n: number, home: boolean) => {
      const day = new Map(team.xi.map(c => [c.id, .4 + rng() * 2.2]))
      const own: InternationalGoal[] = []
      for (let i = 0; i < n; i++) {
        const weights = team.xi.map(c => ({ c, weight: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? .4 : .05) * (.12 + Math.max(0, (mid(c) - 40) / 42) ** 2 * 1.8) * (day.get(c.id) ?? 1) }))
        let pick = weights[0].c, draw = rng() * weights.reduce((s, x) => s + x.weight, 0)
        for (const x of weights) { draw -= x.weight; if (draw <= 0) { pick = x.c; break } }
        const event: InternationalGoal = { name: pick.name, card: xiCardKey(pick), min: 1 + Math.floor(rng() * 90), home }
        own.push(event)
      }
      const assists = own.map(g => pickAssist(seed ^ matchNo, team.id, team.xi, team.xi.find(c => xiCardKey(c) === g.card)!.id, g.min, false))
      if (own.length >= 3 && !assists.some(Boolean)) assists[0] = pickAssist(seed ^ matchNo, team.id, team.xi, team.xi.find(c => xiCardKey(c) === own[0].card)!.id, own[0].min, true)
      own.forEach((g, i) => {
        const assist = assists[i]
        if (assist) { g.assist = assist.name; g.assistCard = xiCardKey(assist) }
      })
      goals.push(...own)
    }
    credit(h, hg, true); credit(a, ag, false)
    let out: InternationalMatch = { home: homeId, away: awayId, hg, ag, goals }
    if (motor2 && (h.you || a.you)) {
      // ⚽🧠 jogo do presidente: o motor novo decide (a conta acima só serviu pra gastar o dado igual)
      const m2 = { versao: input.versaoM2, s: sementeM2((seed ^ Math.imul(season, 0x9E3779B1)) >>> 0, 'I', matchNo, 0, 0), t: [taticaM2(th), taticaM2(ta)] as [number, number] }
      const e = entradaInternacionalM2([h, a], { ...out, m2 })!
      m2.versao = e.versao
      const res = resultadoM2(e)
      const gs: InternationalGoal[] = res.gols.map(g => {
        const xi = g.home ? h.xi : a.xi
        if (g.contra) return { name: `${g.nome} (contra)`, card: '', min: g.min, home: g.home }
        const c = xi.find(x => x.name === g.nome), ac = g.assist ? xi.find(x => x.name === g.assist) : undefined
        return { name: g.nome, card: c ? xiCardKey(c) : '', min: g.min, home: g.home, assist: ac?.name, assistCard: ac ? xiCardKey(ac) : undefined }
      })
      out = { home: homeId, away: awayId, hg: res.placar[0], ag: res.placar[1], goals: gs, m2 }
    }
    // a ficha de cada carta conta os gols e passes que VALERAM
    for (const g of out.goals) {
      const team = g.home ? h : a
      const c = g.card ? team.xi.find(x => xiCardKey(x) === g.card) : undefined
      if (c) stat(team, c).goals++
      const ac = g.assistCard ? team.xi.find(x => xiCardKey(x) === g.assistCard) : undefined
      if (ac) stat(team, ac).assists++
    }
    out.goals.sort((x, y) => x.min - y.min)
    placarVelho.set(out, [hg, ag])
    return out
  }
  const tie = (home: string, away: string, twoLegs: boolean): InternationalTie => {
    const first = play(home, away)
    const matches = twoLegs ? [first, play(away, home)] : [first]
    const hTotal = first.hg + (twoLegs ? matches[1].ag : 0)
    const aTotal = first.ag + (twoLegs ? matches[1].hg : 0)
    let winner = hTotal > aTotal ? home : away
    let penalties: [number, number] | undefined
    // os pênaltis da conta antiga gastam o dado IGUAL; se o motor novo mexeu no placar, a disputa sai de um dado próprio
    const v1 = placarVelho.get(first)!, v2 = twoLegs ? placarVelho.get(matches[1])! : [0, 0]
    let velhos: [number, number] | undefined
    if (v1[0] + v2[1] === v1[1] + v2[0]) {
      const p = 2 + Math.floor(rng() * 4), q = 2 + Math.floor(rng() * 4)
      velhos = p === q ? (rng() < .5 ? [p + 1, q] : [p, q + 1]) : [p, q]
    }
    if (hTotal === aTotal) {
      penalties = matches.some(m => m.m2) ? disputaPenaltis(mulberry(sementeM2((seed ^ Math.imul(season, 0x85EBCA6B)) >>> 0, 'I', matchNo, 7, 7))) : velhos!
      winner = penalties[0] > penalties[1] ? home : away
    }
    return { home, away, matches, winner, penalties }
  }
  const knock = (title: string, competition: InternationalCompetition, pairs: [string, string][], twoLegs: boolean): InternationalPhase => {
    const ties = pairs.map(([h, a]) => tie(h, a, twoLegs))
    return { title, competition, ties, matches: ties.flatMap(t => t.matches) }
  }
  const winners = (phase: InternationalPhase): string[] => phase.ties!.map(t => t.winner)
  const pairEnds = (ids: string[]): [string, string][] => ids.slice(0, ids.length / 2).map((id, i) => [id, ids[ids.length - 1 - i]])

  // Libertadores: 36 clubes, seis grupos de seis. Os dois primeiros de cada
  // grupo e os quatro melhores terceiros avançam às oitavas.
  const south = shuffle(teams.filter(t => t.competition === 'libertadores').map(t => t.id), rng)
  const groups = Array.from({ length: 6 }, (_, g) => south.filter((_, i) => i % 6 === g))
  const groupFixtures = groups.map(groupRounds)
  const libGroupRounds: InternationalPhase[] = Array.from({ length: 5 }, (_, r) => ({
    title: `Grupos · rodada ${r + 1}`, competition: 'libertadores',
    matches: groupFixtures.flatMap(f => f[r].map(([h, a]) => play(h, a))),
  }))
  const libTables = groups.map(group => tableFor(group, libGroupRounds.flatMap(p => p.matches)))
  const third = libTables.map(g => g[2]).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf).slice(0, 4)
  const libQualified = shuffle([...libTables.flatMap(g => g.slice(0, 2)), ...third].map(row => row.team), rng)
  const lib16 = knock('Oitavas', 'libertadores', pairEnds(libQualified), true)
  const lib8 = knock('Quartas', 'libertadores', pairEnds(winners(lib16)), true)
  const lib4 = knock('Semifinal', 'libertadores', pairEnds(winners(lib8)), true)
  const lib2 = knock('Final', 'libertadores', pairEnds(winners(lib4)), false)
  const libertadoresChampion = winners(lib2)[0]

  // Champions: mesma tabela de 36 e oito rodadas do modo rápido. Top 8 vai
  // direto às oitavas; 9º–24º disputa a repescagem, 25º–36º é eliminado.
  // ⚽🧠 com o motor novo, a Champions (e o Mundial) andam com dado PRÓPRIO: o seu resultado na Liberta muda quem passa no
  // mata-mata dela, e sem isto a Champions inteira sairia outra por causa disso
  if (motor2) rng = mulberry((seed ^ Math.imul(season, 0x9E3779B1) ^ 0xC4A3E5) >>> 0)
  const europe = teams.filter(t => t.competition === 'champions')
  const euroIds = europe.map(t => t.id)
  const potes = potesChampions(europe.map(t => t.xi.reduce((n, c) => n + mid(c), 0) / t.xi.length))
  const calendar = calendarioChampions(europe.map((_, i) => i), potes, rng)
  const champLeague: InternationalPhase[] = calendar.map((round, i) => ({
    title: `Tabela · rodada ${i + 1}`, competition: 'champions',
    matches: round.map(([h, a]) => play(euroIds[h], euroIds[a])),
  }))
  const championsTable = tableFor(euroIds, champLeague.flatMap(p => p.matches))
  const direct = championsTable.slice(0, 8).map(r => r.team)
  const playoffIds = championsTable.slice(8, 24).map(r => r.team)
  const champPlayoff = knock('Repescagem', 'champions', pairEnds(playoffIds), true)
  const champ16 = knock('Oitavas', 'champions', pairEnds([...direct, ...winners(champPlayoff)]), true)
  const champ8 = knock('Quartas', 'champions', pairEnds(winners(champ16)), true)
  const champ4 = knock('Semifinal', 'champions', pairEnds(winners(champ8)), true)
  const champ2 = knock('Final', 'champions', pairEnds(winners(champ4)), false)
  const championsChampion = winners(champ2)[0]

  const mundialTie = tie(libertadoresChampion, championsChampion, false)
  const mundial: InternationalPhase = { title: 'Mundial de Clubes · Final', competition: 'mundial', ties: [mundialTie], matches: mundialTie.matches }
  const steps: InternationalStep[] = Array.from({ length: 14 }, (_, i) => ({ label: i === 13 ? 'Mundial de Clubes' : `Noite internacional ${i + 1}` }))
  for (let i = 0; i < 8; i++) steps[i].champions = champLeague[i]
  ;[0, 1, 3, 5, 7].forEach((step, i) => { steps[step].libertadores = libGroupRounds[i] })
  // 🏆 AS DUAS FINAIS NA MESMA NOITE (Diego 02/10: *"quando for pra final deveria aparecer os
  // dois times da Libertadores e o da Champions ao mesmo tempo"*). A Champions tem uma fase a
  // mais (repescão, noite 9), então o mata-mata da Liberta começa uma noite depois: oitavas com
  // oitavas, quartas com quartas, semi com semi e as finais juntas na noite 13. Na noite 9 a
  // Liberta descansa (a tela pula a noite em que a sua competição não joga).
  ;[lib16, lib8, lib4, lib2].forEach((phase, i) => { steps[9 + i].libertadores = phase })
  ;[champPlayoff, champ16, champ8, champ4, champ2].forEach((phase, i) => { steps[8 + i].champions = phase })
  steps[13].mundial = mundial
  return {
    season, seed, representedClub, userTeam, priority,
    registeredXI: userXI.map(xiCardKey), teams, steps,
    libertadoresGroups: libTables, championsTable,
    libertadoresChampion, championsChampion, mundialChampion: mundialTie.winner,
    statistics: [...stats.values()], reveal: 0,
  }
}
