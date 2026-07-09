import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
  EscState, Manager, Card, WonCard, Sector, FormationKey, Tactic, Bid,
  ResolvedCard, LeagueTeam, MatchResult, MatchHighlight, ScorerRow,
} from './types'
import { SECTORS, FORMATIONS } from './types'
import { CATALOG, makeIncognita, CPU_MANAGERS, CLASSIC_CLUBS } from './data'
import { supabase } from '../lib/supabase'

export const START_MONEY = 100
const LEAGUE_SIZE = 20
const TOTAL_ROUNDS = 38

// ─── RNG com seed (reprodutível dentro da partida) ───────────────────
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}
// embaralhador JUSTO (Fisher-Yates). O antigo `sort(() => rng()-0.5)` é
// viciado — deixava as cartas do começo da lista (ex.: Pelé) aparecerem
// bem mais que as outras. Com isso todas as lendas têm chance igual.
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── helpers de elenco ───────────────────────────────────────────────
export function slotsOf(m: Manager, pos: Sector): number {
  return FORMATIONS[m.formation][pos]
}
export function filled(m: Manager, pos: Sector): number {
  return m.squad.filter(c => c.pos === pos).length
}
export function openSlots(m: Manager, pos: Sector): number {
  return Math.max(0, slotsOf(m, pos) - filled(m, pos))
}
export function totalHoles(m: Manager): number {
  return SECTORS.reduce((s, pos) => s + openSlots(m, pos), 0)
}

// ─── montagem do baralho ───────────────────────────────────────────────
// `managers` aqui é só quem DISPUTA o leilão (humanos + rivais CPU no modo
// solo — nunca bots de preenchimento). Solo e online usam a MESMA regra:
// `margin` 1.0 + `extra` 1 = demanda + 1 carta por posição. Ex.: 4 times
// (você + 3 CPU, ou 4 online) = 5 goleiros, 9 laterais, etc.
function buildDeck(managers: Manager[], rng: () => number, margin: number, used: Set<string> = new Set(), extra = 0): Record<Sector, Card[]> {
  const deck = {} as Record<Sector, Card[]>
  // ── passo 1: define o tamanho de cada setor e embaralha o catálogo ──
  const plan = {} as Record<Sector, { count: number; catalog: (typeof CATALOG)[Sector] }>
  let totalCount = 0
  for (const pos of SECTORS) {
    const demand = managers.reduce((s, m) => s + slotsOf(m, pos), 0)
    const catalog = shuffle(CATALOG[pos], rng)
    const realFree = catalog.filter(c => !used.has(c.name)).length
    // margem adaptativa: queremos "sempre dobrado" (demand × margin), mas nunca
    // pedir mais jogadores REAIS do que existem na posição — senão vira fake.
    // Então: pede o dobro se couber; se não couber, pega todos os reais que dá
    // (mantendo pelo menos `demand`, pra todo mundo conseguir fechar as vagas).
    // Só quando nem `demand` cabe em reais (sala gigante) é que sobra fake.
    // `extra` = cartas a mais por posição além da demanda (online: +1, pra dar
    // opção/disputa — 2 jogadores viram 3 goleiros, 5 laterais, etc.).
    const target = Math.max(1, Math.ceil(demand * margin), demand + extra)
    const count = Math.max(demand, Math.min(target, realFree))
    plan[pos] = { count, catalog }
    totalCount += count
  }
  // ── passo 2: cotas por VIBE (não por sorte) ──
  // Duas garantias no leilão inteiro (distribuídas nos setores):
  //  • LENDA: rara mas nunca zero (~7%, mín 1) — a "carta cara" que todo mundo quer.
  //  • FOLCLÓRICO: os caras engraçados/irreverentes (~13%, mín 1) — a graça do jogo.
  // O folclórico é uma VIBE, não um nível: pode ser craque (Edmundo) ou perna-de-pau
  // (Walter Minhoca). Por isso é cota separada do nível. O resto do baralho é
  // preenchido natural (craque/bom/cult), fora lenda e folclórico pra não repetir.
  const alloc = {} as Record<Sector, { legend: number; star: number; low: number; folk: number }>
  SECTORS.forEach(p => { alloc[p] = { legend: 0, star: 0, low: 0, folk: 0 } })
  const availOf = (pos: Sector, pred: (c: (typeof CATALOG)[Sector][number]) => boolean) =>
    plan[pos].catalog.filter(c => pred(c) && !used.has(c.name)).length
  const availLegend = {} as Record<Sector, number>
  const availStar = {} as Record<Sector, number>
  const availLow = {} as Record<Sector, number>
  const availFolk = {} as Record<Sector, number>
  for (const pos of SECTORS) {
    availLegend[pos] = availOf(pos, c => c.fame === 5)
    availStar[pos] = availOf(pos, c => c.fame === 4 && !c.folk)   // craque não-folk
    availLow[pos] = availOf(pos, c => c.fame === 1)                // foi profissional (todos fame 1)
    availFolk[pos] = availOf(pos, c => !!c.folk && c.fame >= 2 && c.fame <= 4) // folk 2/3/4 (fame1-folk vem na cota 'low')
  }
  type Key = 'legend' | 'star' | 'low' | 'folk'
  const distribute = (goal: number, availByPos: Record<Sector, number>, key: Key, capFrac: number) => {
    const cap = {} as Record<Sector, number>
    for (const pos of SECTORS) cap[pos] = Math.min(availByPos[pos], Math.max(1, Math.round(plan[pos].count * capFrac)), plan[pos].count)
    let left = Math.min(goal, SECTORS.reduce((s, p) => s + cap[p], 0))
    while (left > 0) {
      let best: Sector | null = null, bestScore = -1
      for (const pos of SECTORS) {
        const usedSlots = alloc[pos].legend + alloc[pos].star + alloc[pos].low + alloc[pos].folk
        if (alloc[pos][key] >= cap[pos] || usedSlots >= plan[pos].count) continue
        const score = plan[pos].count / (alloc[pos][key] + 1)
        if (score > bestScore) { bestScore = score; best = pos }
      }
      if (!best) break
      alloc[best][key]++
      left--
    }
  }
  // cotas do leilão (metas de %). Craque e Bom jogador agora têm cota também, pra
  // o "bom jogador" parar de inchar (antes ~69%). Folclórico é selo (cruza níveis):
  // parte já entra via a cota 'low' (fame1 folk); aqui garantimos os folk 2/3/4.
  distribute(Math.max(1, Math.round(totalCount * 0.14)), availLegend, 'legend', 0.4)   // LENDA 14%
  distribute(Math.max(1, Math.round(totalCount * 0.27)), availStar, 'star', 0.6)       // CRAQUE 27%
  distribute(Math.max(1, Math.round(totalCount * 0.22)), availLow, 'low', 0.6)         // FOI PROFISSIONAL 22%
  distribute(Math.max(1, Math.round(totalCount * 0.10)), availFolk, 'folk', 0.5)       // + folk 2/3/4
  // ── passo 3: monta cada setor — cotas garantidas, resto = bom jogador ──
  for (const pos of SECTORS) {
    const { count, catalog } = plan[pos]
    const cards: Card[] = []
    const take = (c: (typeof CATALOG)[Sector][number]) => { used.add(c.name); cards.push({ ...c, id: `cat-${pos}-${cards.length}`, pos }) }
    // 1) LENDA
    let needL = alloc[pos].legend
    for (const c of catalog) { if (needL <= 0) break; if (c.fame !== 5 || used.has(c.name)) continue; take(c); needL-- }
    // 2) CRAQUE (não-folk)
    let needS = alloc[pos].star
    for (const c of catalog) { if (needS <= 0) break; if (c.fame !== 4 || c.folk || used.has(c.name)) continue; take(c); needS-- }
    // 3) FOI PROFISSIONAL (fame 1 — inclui os folk fame1, que ganham o selo)
    let needLo = alloc[pos].low
    for (const c of catalog) { if (needLo <= 0) break; if (c.fame !== 1 || used.has(c.name)) continue; take(c); needLo-- }
    // 4) FOLCLÓRICO 2/3/4 (o selo entre bom jogador e craque)
    let needF = alloc[pos].folk
    for (const c of catalog) { if (needF <= 0) break; if (!c.folk || c.fame < 2 || c.fame > 4 || used.has(c.name)) continue; take(c); needF-- }
    // 5) resto = BOM JOGADOR natural (fame 2/3 não-folk)
    for (const c of catalog) { if (cards.length >= count) break; if (used.has(c.name) || c.fame === 5 || c.fame === 4 || c.fame === 1 || c.folk) continue; take(c) }
    // 6) se ainda faltar (setor pequeno de catálogo), aceita qualquer real restante
    for (const c of catalog) { if (cards.length >= count) break; if (used.has(c.name)) continue; take(c) }
    // 5) só cai pra incógnita se o catálogo real acabar (sala gigante)
    const gems = Math.max(1, Math.ceil(managers.length / 3))
    let gi = 0
    while (cards.length < count) { cards.push(makeIncognita(pos, cards.length, gi < gems, rng)); gi++ }
    // embaralha a ordem final: as cotas montam o baralho com lenda/craque
    // primeiro, então sem isto os melhores ficariam sempre no topo da tela e
    // dava pra "ler" o nível pela posição — furando o leilão às cegas.
    deck[pos] = shuffle(cards, rng)
  }
  return deck
}

// managers que efetivamente brigam no leilão (exclui bots de preenchimento)
function auctioningManagers(managers: Manager[]): Manager[] {
  return managers.filter(m => m.isHuman || m.auctionRival)
}

// ─── CPU: envelopes de lance ─────────────────────────────────────────
function perceived(card: Card, rng: () => number): number {
  const mid = (card.lo + card.hi) / 2
  const noise = card.fame === 1 ? 14 : card.fame === 2 ? 7 : 3
  return mid + (rng() * 2 - 1) * noise
}

const SECTOR_WEIGHT: Record<Sector, number> = { GOL: 0.12, LAT: 0.15, ZAG: 0.19, MEI: 0.25, ATA: 0.29 }

function cpuEnvelope(m: Manager, cards: Card[], sectorIdx: number, rng: () => number, rescue: boolean): (Bid & { cardId: string })[] {
  const pos = SECTORS[sectorIdx]
  const need = openSlots(m, pos)
  if (need === 0 || m.money <= 0) return []
  const remaining = SECTORS.slice(sectorIdx).reduce((s, p) => s + SECTOR_WEIGHT[p], 0)
  const shape = 0.65 + m.aggression * 0.8
  let budget = rescue
    ? Math.min(m.money, 4 + Math.floor(rng() * 6))
    : Math.max(1, Math.floor(m.money * (SECTOR_WEIGHT[pos] / remaining) * shape * (0.85 + rng() * 0.4)))
  budget = Math.min(budget, m.money)

  const ranked = cards.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  const targets = ranked.slice(0, Math.min(cards.length, need + (rng() < 0.6 ? 1 : 0)))
  const result: (Bid & { cardId: string })[] = []
  let left = budget
  targets.forEach((t, i) => {
    if (left <= 0) return
    const share = m.starHunger > 0.5 ? (i === 0 ? 0.7 : 0.3 / Math.max(1, targets.length - 1)) : 1 / targets.length
    let amt = Math.max(1, Math.round(budget * share * (0.75 + rng() * 0.5)))
    amt = Math.min(amt, left)
    if (amt > 0) { result.push({ mgr: m.id, amount: amt, cardId: t.c.id }); left -= amt }
  })
  if (!rescue && left >= 1 && rng() < 0.45) {
    const cheap = ranked.slice(need + 1)
    if (cheap.length > 0) {
      const pick = cheap[Math.floor(rng() * cheap.length)]
      result.push({ mgr: m.id, amount: 1, cardId: pick.c.id })
    }
  }
  return result
}

type BidMap = Map<string, Bid[]>

function pushBid(map: BidMap, cardId: string, bid: Bid) {
  const list = map.get(cardId) ?? []
  list.push(bid)
  map.set(cardId, list)
}

// ─── resolução: pote crescente, maior lance leva, anulação por setor cheio ──
function resolve(cards: Card[], bidMap: BidMap, managers: Manager[], via: 'leilao' | 'repescagem', rng: () => number): { queue: ResolvedCard[]; unsold: Card[] } {
  const byPot = [...cards].sort((a, b) => {
    const pa = (bidMap.get(a.id) ?? []).reduce((s, x) => s + x.amount, 0)
    const pb = (bidMap.get(b.id) ?? []).reduce((s, x) => s + x.amount, 0)
    return pa - pb
  })
  const queue: ResolvedCard[] = []
  const unsold: Card[] = []
  for (const card of byPot) {
    const bids = (bidMap.get(card.id) ?? []).sort((a, b) => b.amount - a.amount)
    if (bids.length === 0) {
      unsold.push(card)
      queue.push({ card, bids: [], winner: null, paid: 0, voided: [] })
      continue
    }
    const voided: number[] = []
    let winner: number | null = null
    let paid = 0
    const sorted = [...bids].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount
      const ma = managers.find(x => x.id === a.mgr)!, mb = managers.find(x => x.id === b.mgr)!
      if (ma.squad.length !== mb.squad.length) return ma.squad.length - mb.squad.length
      return rng() - 0.5
    })
    for (const b of sorted) {
      const m = managers.find(x => x.id === b.mgr)!
      if (openSlots(m, card.pos) <= 0) { voided.push(b.mgr); continue }
      if (m.money < b.amount) { voided.push(b.mgr); continue }
      winner = b.mgr; paid = b.amount
      m.money -= b.amount
      m.squad.push({ ...card, paid: b.amount, via } as WonCard)
      break
    }
    if (winner === null) unsold.push(card)
    queue.push({ card, bids: sorted, winner, paid, voided })
  }
  return { queue, unsold }
}

// ─── temporada ───────────────────────────────────────────────────────
function buildLeague(managers: Manager[]): LeagueTeam[] {
  const teams: LeagueTeam[] = managers.map(m => ({
    id: m.id, name: m.teamName, isManager: true, baseAtk: 0, baseDef: 0,
    pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
  }))
  const fill = LEAGUE_SIZE - teams.length
  for (let i = 0; i < fill; i++) {
    const c = CLASSIC_CLUBS[i % CLASSIC_CLUBS.length]
    teams.push({
      id: 100 + i, name: c.name, isManager: false, baseAtk: c.atk, baseDef: c.def,
      pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
    })
  }
  return teams
}

function buildFixtures(teams: LeagueTeam[]): [number, number][][] {
  const ids = teams.map(t => t.id)
  const n = ids.length
  const rounds: [number, number][][] = []
  const rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) {
      round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    }
    rounds.push(round)
    rot.unshift(rot.pop()!)
  }
  const volta: [number, number][][] = rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))
  return [...rounds, ...volta]
}

interface TeamForm { atk: number; def: number; inspired: string | null }

function rollManagerForm(m: Manager, tactic: Tactic, oppTactic: Tactic, rng: () => number): TeamForm {
  const rolls = m.squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  let inspired: string | null = null
  for (const r of rolls) {
    if (r.c.hi - r.c.lo >= 14 && r.lvl >= r.c.hi - 2.5) inspired = r.c.name
  }
  const sector = (pos: Sector): number => {
    const s = rolls.filter(r => r.c.pos === pos)
    if (s.length === 0) return 40
    const avg = s.reduce((x, r) => x + r.lvl, 0) / s.length
    const min = Math.min(...s.map(r => r.lvl))
    return avg - (avg - min) * 0.35
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tactic === 'retranca') { def += 4; atk -= 3 }
  if (tactic === 'ataque') { atk += 4; def -= 3 }
  if (tactic === 'equilibrio') { atk += 1; def += 1 }
  if (tactic === 'retranca' && oppTactic === 'ataque') def += 2.5
  if (tactic === 'ataque' && oppTactic === 'equilibrio') atk += 2.5
  if (tactic === 'equilibrio' && oppTactic === 'retranca') atk += 2.5
  if (inspired) atk += 2
  return { atk, def, inspired }
}

function poisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= rng() } while (p > L)
  return k - 1
}

const CPU_TACTICS: Tactic[] = ['retranca', 'equilibrio', 'ataque']

function simMatch(state: EscState, homeId: number, awayId: number, rng: () => number): MatchResult {
  const isHuman = (id: number) => state.managers.some(m => m.id === id && m.isHuman)
  const involveHuman = isHuman(homeId) || isHuman(awayId)
  const tacticOf = (id: number): Tactic => {
    const m = state.managers.find(x => x.id === id)
    if (!m) return 'equilibrio'
    if (m.isHuman) return state.tactics[id] ?? 'equilibrio'
    return CPU_TACTICS[Math.floor(rng() * 3)]
  }
  const homeTactic = tacticOf(homeId)
  const awayTactic = tacticOf(awayId)
  const form = (id: number, opp: Tactic, own: Tactic): TeamForm => {
    const team = state.league.find(t => t.id === id)!
    if (!team.isManager) return { atk: team.baseAtk + (rng() * 6 - 3), def: team.baseDef + (rng() * 6 - 3), inspired: null }
    const m = state.managers.find(x => x.id === id)!
    return rollManagerForm(m, own, opp, rng)
  }
  const fh = form(homeId, awayTactic, homeTactic)
  const fa = form(awayId, homeTactic, awayTactic)
  const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25)
  const la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
  const hg = poisson(lh, rng), ag = poisson(la, rng)

  const highlights: MatchHighlight[] = []
  // atribui os gols a um jogador real e credita na artilharia da temporada
  const creditGoals = (id: number, goals: number, prefix: string) => {
    const m = state.managers.find(x => x.id === id)
    for (let g = 0; g < goals; g++) {
      // ~8% de chance de cair nos acréscimos (90+1 a 90+6)
      const min = rng() < 0.08 ? 90 + 1 + Math.floor(rng() * 6) : 1 + Math.floor(rng() * 90)
      let scorerName: string | null = null
      if (m && m.squad.length > 0) {
        const pool: { name: string; w: number }[] = []
        for (const c of m.squad) {
          const w = c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05
          pool.push({ name: c.name, w })
        }
        const total = pool.reduce((s, p) => s + p.w, 0)
        let r = rng() * total
        for (const p of pool) { r -= p.w; if (r <= 0) { scorerName = p.name; break } }
        if (!scorerName) scorerName = pool[0].name
      }
      if (scorerName) {
        // credita no ranking
        const row = state.scorers.find(s => s.name === scorerName && s.teamId === id)
        if (row) row.goals++
        else state.scorers.push({ name: scorerName, teamId: id, teamName: prefix, goals: 1 })
        if (involveHuman) highlights.push({ min, text: `⚽ ${scorerName} marca para ${prefix}!`, teamId: id })
      } else if (involveHuman) {
        highlights.push({ min, text: `⚽ Gol de ${prefix}.`, teamId: id })
      }
    }
  }
  const hName = state.league.find(t => t.id === homeId)!.name
  const aName = state.league.find(t => t.id === awayId)!.name
  creditGoals(homeId, hg, hName)
  creditGoals(awayId, ag, aName)
  if (involveHuman) {
    highlights.sort((a, b) => a.min - b.min)
    for (const [id, f] of [[homeId, fh], [awayId, fa]] as [number, TeamForm][]) {
      if (f.inspired && isHuman(id)) {
        const tn = state.league.find(t => t.id === id)!.name
        state.news.unshift(`🔥 DIA INSPIRADO: ${f.inspired} (${tn}) acordou craque na rodada ${state.round + 1}!`)
      }
    }
  }
  return { homeId, awayId, hg, ag, highlights }
}

export function topScorers(state: EscState, limit = 10): ScorerRow[] {
  return [...state.scorers].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, limit)
}

function applyResult(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId)!, a = league.find(t => t.id === r.awayId)!
  h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg
  if (r.hg > r.ag) { h.pts += 3; h.w++; a.l++ }
  else if (r.hg < r.ag) { a.pts += 3; a.w++; h.l++ }
  else { h.pts++; a.pts++; h.d++; a.d++ }
}

export function sortedTable(league: LeagueTeam[]): LeagueTeam[] {
  return [...league].sort((a, b) =>
    b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name))
}

// ─── monte final: ordem serpente por buracos ─────────────────────────
function buildMonteOrder(managers: Manager[], rng: () => number): number[] {
  const withHoles = managers.filter(m => totalHoles(m) > 0)
  if (withHoles.length === 0) return []
  const base = [...withHoles].sort((a, b) => totalHoles(b) - totalHoles(a) || rng() - 0.5).map(m => m.id)
  const maxHoles = Math.max(...withHoles.map(m => totalHoles(m)))
  const order: number[] = []
  for (let pass = 0; pass < maxHoles; pass++) {
    const seq = pass % 2 === 0 ? base : [...base].reverse()
    order.push(...seq)
  }
  return order
}

function monteAutoPick(m: Manager, monte: Card[], rng: () => number): Card | null {
  const valid = monte.filter(c => openSlots(m, c.pos) > 0)
  if (valid.length === 0) return null
  const ranked = valid.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => b.v - a.v)
  return ranked[0].c
}

// pior sobra válida — usada quando um humano deixa o tempo do Monte estourar (AFK)
function monteWorstPick(m: Manager, monte: Card[], rng: () => number): Card | null {
  const valid = monte.filter(c => openSlots(m, c.pos) > 0)
  if (valid.length === 0) return null
  const ranked = valid.map(c => ({ c, v: perceived(c, rng) })).sort((a, b) => a.v - b.v)
  return ranked[0].c
}

const MONTE_MS = 45_000
export const MONTE_SECONDS = MONTE_MS / 1000
const MONTE_AFK_PENALTY = 5

// define/limpa o prazo da vez atual do Monte (só vale no online, pra técnico humano)
function refreshMonteDeadline(state: EscState) {
  const cur = state.monteOrder[state.monteIdx]
  const m = state.managers.find(x => x.id === cur)
  state.monteDeadline =
    state.onlineMode === 'online' && state.screen === 'monte' && m?.isHuman && totalHoles(m) > 0
      ? Date.now() + MONTE_MS
      : null
}

function takeFromMonte(state: EscState, cardId: string) {
  const idx = state.monte.findIndex(c => c.id === cardId)
  if (idx < 0) return
  const card = state.monte[idx]
  const mgrId = state.monteOrder[state.monteIdx]
  const m = state.managers.find(x => x.id === mgrId)!
  state.monte.splice(idx, 1)
  m.squad.push({ ...card, paid: 0, via: 'monte' })
}

// avança o ponteiro do monte, deixando CPUs escolherem sozinhas.
// Para em técnico humano (aguarda a escolha dele).
function advanceMonte(state: EscState, rng: () => number) {
  while (state.monteIdx < state.monteOrder.length) {
    const mgrId = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === mgrId)!
    if (totalHoles(m) === 0) { state.monteIdx++; continue }
    if (m.isHuman) { refreshMonteDeadline(state); return }
    const pick = monteAutoPick(m, state.monte, rng)
    if (pick) takeFromMonte(state, pick.id)
    state.monteIdx++
  }
  state.monteDeadline = null
}

// ─── bots de preenchimento (online): elenco pronto, nunca dão lance ────
// tier controla a força — cria variedade real na tabela (uns fortes, a
// maioria mediana, uns fracos) sem depender do leilão pra existir.
type Tier = 'strong' | 'mid' | 'weak'
function makeBotSquad(formation: FormationKey, tier: Tier, rng: () => number, used: Set<string>): WonCard[] {
  const squad: WonCard[] = []
  for (const pos of SECTORS) {
    const need = FORMATIONS[formation][pos]
    const shuffled = shuffle(CATALOG[pos], rng).filter(c => !used.has(c.name))
    const pool = tier === 'strong' ? shuffled.filter(c => c.fame >= 3)
      : tier === 'weak' ? shuffled.filter(c => c.fame <= 2)
      : shuffled.filter(c => c.fame === 2 || c.fame === 3)
    const picks = pool.slice(0, need)
    for (const c of picks) used.add(c.name)
    let gi = 0
    while (picks.length < need) {
      picks.push(makeIncognita(pos, squad.length + picks.length, tier === 'strong' && gi < 1, rng))
      gi++
    }
    for (const c of picks) squad.push({ ...c, id: `bot-${pos}-${squad.length}-${Math.floor(rng() * 1e6)}`, pos, paid: 0, via: 'bot' })
  }
  return squad
}

// ─── setup de técnicos ───────────────────────────────────────────────
// mode 'solo': CPUs são rivais de verdade, disputam o leilão junto com você.
// mode 'online': CPUs são só preenchimento da tabela — elenco pronto,
// nunca aparecem no leilão, pra ele ficar do tamanho exato da sala humana.
// Cria os técnicos SEM montar ainda o elenco dos bots (online). Devolve os
// "planos" dos bots pra quem chamou: assim dá pra montar o baralho do leilão
// PRIMEIRO (pegando os reais) e só depois escalar os bots com o que sobrar —
// evita o bot comer todos os laterais reais e o humano ver nome inventado.
type BotPlan = { id: number; tier: Tier; formation: FormationKey }
function makeManagers(humanNames: string[], formation: FormationKey, targetTotal: number, rng: () => number, mode: 'solo' | 'online'): { managers: Manager[]; botPlans: BotPlan[] } {
  const forms: FormationKey[] = ['4-3-3', '4-4-2']
  const humans: Manager[] = humanNames.map((name, i) => ({
    id: i, name, teamName: name, isHuman: true, auctionRival: true,
    formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5,
  }))
  const cpuCount = Math.max(0, targetTotal - humans.length)
  const names = CPU_MANAGERS.slice(0, cpuCount)
  const strongN = Math.max(1, Math.round(cpuCount * 0.15))
  const weakN = Math.max(1, Math.round(cpuCount * 0.15))
  const botPlans: BotPlan[] = []
  const cpus: Manager[] = names.map((c, i) => {
    const cpuFormation = forms[Math.floor(rng() * forms.length)]
    if (mode === 'solo') {
      return {
        id: humans.length + i, name: c.name, teamName: c.team, isHuman: false, auctionRival: true,
        formation: cpuFormation, money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng(),
      }
    }
    const tier: Tier = i < strongN ? 'strong' : i >= cpuCount - weakN ? 'weak' : 'mid'
    botPlans.push({ id: humans.length + i, tier, formation: cpuFormation })
    return {
      id: humans.length + i, name: c.name, teamName: c.team, isHuman: false, auctionRival: false,
      formation: cpuFormation, money: 0, squad: [], aggression: 0.5, starHunger: 0.5,
    }
  })
  return { managers: [...humans, ...cpus], botPlans }
}

// escala os bots DEPOIS do baralho do leilão já ter reservado os reais que
// os humanos vão disputar. `used` chega com os nomes do baralho dentro.
function dealBotSquads(managers: Manager[], botPlans: BotPlan[], rng: () => number, used: Set<string>) {
  for (const plan of botPlans) {
    const bot = managers.find(m => m.id === plan.id)
    if (bot) bot.squad = makeBotSquad(plan.formation, plan.tier, rng, used)
  }
}

// ─── estado inicial ──────────────────────────────────────────────────
const INITIAL: EscState = {
  screen: 'intro', seed: 1,
  onlineMode: 'cpu', roomId: '', roomCode: '', isHost: true,
  humanCount: 1, submitted: [], pendingEnvelopes: {}, presence: [],
  managers: [], youIdx: 0,
  sectorIdx: 0, deck: { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] },
  phase: 'envelope', currentCards: [], revealQueue: [], revealIdx: 0,
  stock: { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 },
  monte: [], monteOrder: [], monteIdx: 0,
  league: [], fixtures: [], round: 0, tactics: {},
  lastResults: [], news: [], champion: null,
  phaseDeadline: null, scorers: [],
  monteDeadline: null,
  sectorCursor: 0, sectorUnsoldAccum: [], roundIdx: 0,
  seasonNo: 1,
  restartPending: false, restartReady: [],
}

// ─── ações ───────────────────────────────────────────────────────────
type Action =
  | { type: 'GO_LOBBY' }
  | { type: 'GO_LOBBY_ONLINE' }
  | { type: 'GO_SETUP' }
  | { type: 'GO_ALBUM' }
  | { type: 'START'; teamName: string; formation: FormationKey; rivals: number }
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; isHost: boolean; playerIndex: number; playerNames: string[]; formation: FormationKey }
  | { type: 'SYNC_STATE'; newState: EscState }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'SUBMIT_ENVELOPE'; mgrId: number; bids: { cardId: string; amount: number }[] }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'FORCE_SEAL' }
  | { type: 'MONTE_PICK'; mgrId: number; cardId: string }
  | { type: 'MONTE_TIMEOUT' }
  | { type: 'SET_TACTIC'; mgrId: number; tactic: Tactic }
  | { type: 'PLAY_ROUND' }
  | { type: 'SIM_MANY'; count: number }
  | { type: 'FINISH_CEREMONY' }
  | { type: 'NEW_GAME' }
  | { type: 'NEW_SEASON' }
  | { type: 'REPLAY_SEASON' }
  | { type: 'REQUEST_NEW_TEAMS' }
  | { type: 'CONFIRM_RESTART'; mgrId: number }
  | { type: 'CANCEL_RESTART' }

function rngOf(state: EscState): () => number {
  return mulberry(state.seed + state.sectorIdx * 977 + state.round * 131 + state.revealIdx * 7 + state.monteIdx * 13 + state.submitted.length * 101)
}

const ENVELOPE_MS = 45_000

// cartas por leva: sala pequena cabe tudo numa tela só; sala grande (até 20
// jogadores, 40 laterais) precisa dividir, senão a tela não tem fim.
export const BATCH_SIZE = 12

function startAuctionPhase(state: EscState, rescue: boolean) {
  const pos = SECTORS[state.sectorIdx]
  state.phase = rescue ? 'resq_envelope' : 'envelope'
  if (!rescue) {
    // levas SÓ por espaço de tela: pega a próxima fatia de até BATCH_SIZE
    // cartas do setor. Você dá lance em todas as suas vagas de uma vez.
    const full = state.deck[pos]
    const start = state.sectorCursor
    const end = Math.min(full.length, start + BATCH_SIZE)
    state.currentCards = full.slice(start, end)
    state.sectorCursor = end
  }
  // se rescue=true, currentCards já foi preparado pelo chamador (sobras acumuladas)
  state.revealQueue = []
  state.revealIdx = 0
  state.submitted = []
  state.pendingEnvelopes = {}
  state.phaseDeadline = Date.now() + ENVELOPE_MS
}

// resolve o setor a partir dos envelopes coletados (humanos) + CPUs
function sealAndResolve(state: EscState) {
  const rng = rngOf(state)
  const rescue = state.phase === 'resq_envelope'
  const bidMap: BidMap = new Map()
  // CPUs (só quem disputa o leilão — bots de preenchimento nunca dão lance)
  for (const m of state.managers) {
    if (m.isHuman || !m.auctionRival) continue
    for (const b of cpuEnvelope(m, state.currentCards, state.sectorIdx, rng, rescue)) {
      pushBid(bidMap, b.cardId, { mgr: b.mgr, amount: b.amount })
    }
  }
  // humanos (envelopes coletados)
  for (const [mgrIdStr, env] of Object.entries(state.pendingEnvelopes)) {
    const mgrId = Number(mgrIdStr)
    for (const hb of env) {
      if (hb.amount > 0) pushBid(bidMap, hb.cardId, { mgr: mgrId, amount: hb.amount })
    }
  }
  const { queue, unsold } = resolve(state.currentCards, bidMap, state.managers, rescue ? 'repescagem' : 'leilao', rng)
  state.revealQueue = queue
  state.revealIdx = 0
  state.phase = rescue ? 'resq_reveal' : 'reveal'
  state.currentCards = unsold
  state.submitted = []
  state.pendingEnvelopes = {}
  state.phaseDeadline = null
}

// todo humano com vaga aberta e dinheiro precisa enviar (não filtra por presença:
// presença é um sinal instável de rede e causava avanço prematuro/dessincronizado
// entre jogadores — um "piscar" de conexão fazia o jogo achar que só faltava um).
function humansToSubmit(state: EscState, pos: Sector): number[] {
  return state.managers
    .filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
    .map(m => m.id)
}

function advanceSectorOrFinish(state: EscState, rng: () => number) {
  if (state.sectorIdx < SECTORS.length - 1) {
    state.sectorIdx++
    state.sectorCursor = 0
    state.sectorUnsoldAccum = []
    startAuctionPhase(state, false)
  } else {
    state.monteOrder = buildMonteOrder(state.managers, rng)
    state.monteIdx = 0
    state.screen = 'monte'
    advanceMonte(state, rng)
    if (state.monteIdx >= state.monteOrder.length) state.screen = 'cerimonia'
  }
}

function afterReveal(state: EscState) {
  const rng = rngOf(state)
  const pos = SECTORS[state.sectorIdx]
  const unsold = state.currentCards
  if (state.phase === 'reveal') {
    // terminou uma leva do pregão principal — acumula os não vendidos
    state.sectorUnsoldAccum.push(...unsold)
    state.currentCards = []
    if (state.sectorCursor < state.deck[pos].length) {
      startAuctionPhase(state, false) // ainda tem leva pra vir nesse setor
      return
    }
    // fechou todas as levas do setor: repescagem ÚNICA com tudo que sobrou
    const anyHole = state.managers.some(m => openSlots(m, pos) > 0)
    if (state.sectorUnsoldAccum.length > 0 && anyHole) {
      state.currentCards = state.sectorUnsoldAccum
      state.sectorUnsoldAccum = []
      startAuctionPhase(state, true)
      return
    }
    state.monte.push(...state.sectorUnsoldAccum)
    state.sectorUnsoldAccum = []
    advanceSectorOrFinish(state, rng)
    return
  }
  // terminou a repescagem
  state.monte.push(...unsold)
  state.currentCards = []
  advanceSectorOrFinish(state, rng)
}

// revanche com times novos: mesma sala/galera e formação, temporada do zero —
// baralho e escalação dos bots sorteados de novo. Igual qualquer outra ação
// online, o resultado já computado vai por SYNC_STATE pros convidados, então
// não precisa de seed determinístico aqui.
function redraftSeason(s: EscState): EscState {
  const humanNames = s.managers.filter(m => m.isHuman).map(m => m.name)
  const formation = s.managers.find(m => m.isHuman)?.formation ?? '4-3-3'
  s.seed = Math.floor(Math.random() * 1e9)
  const rng = mulberry(s.seed)
  const used = new Set<string>()
  if (s.onlineMode === 'online') {
    const { managers, botPlans } = makeManagers(humanNames, formation, LEAGUE_SIZE, rng, 'online')
    s.managers = managers
    s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
    dealBotSquads(s.managers, botPlans, rng, used)
  } else {
    const { managers, botPlans } = makeManagers(humanNames, formation, s.managers.length, rng, 'solo')
    s.managers = managers
    s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
    dealBotSquads(s.managers, botPlans, rng, used)
  }
  for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
  s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0
  s.monte = []; s.monteOrder = []; s.monteIdx = 0
  s.news = []; s.round = 0; s.champion = null
  s.league = []; s.fixtures = []; s.scorers = []; s.lastResults = []
  s.tactics = {}
  s.submitted = []; s.pendingEnvelopes = {}
  s.seasonNo++
  s.restartPending = false
  s.restartReady = []
  s.screen = 'auction'
  startAuctionPhase(s, false)
  return s
}

// Refaz o leilão só quando TODOS os participantes humanos clicaram "estou
// pronto". Não usamos `presence` aqui: ela é instável (às vezes o host enxerga
// só a si mesmo) e isso liberava o reinício sem o OK dos outros. Se alguém caiu
// e não confirma, o host tem o botão Cancelar.
function humanManagerIds(s: EscState): number[] {
  return s.managers.filter(m => m.isHuman).map(m => m.id)
}
function maybeStartRedraft(s: EscState): EscState {
  if (!s.restartPending) return s
  const humans = humanManagerIds(s)
  if (humans.length > 0 && humans.every(id => s.restartReady.includes(id))) {
    return redraftSeason(s)
  }
  return s
}

export function reducer(state: EscState, action: Action): EscState {
  if (action.type === 'SYNC_STATE') {
    // O host manda o estado do JOGO (managers, deck, leilão, temporada...),
    // mas identidade é local a cada cliente: "quem sou eu" (youIdx), "sou
    // host?", sala. Sem isso, um convidado que recebe o broadcast do host
    // passa a se enxergar como o PRÓPRIO host — via o mesmo técnico, o
    // mesmo elenco — exatamente o "pegamos o mesmo jogador" relatado.
    return {
      ...action.newState,
      youIdx: state.youIdx,
      isHost: state.isHost,
      roomId: state.roomId,
      roomCode: state.roomCode,
      onlineMode: state.onlineMode,
    }
  }
  if (action.type === 'NEW_GAME') return { ...INITIAL }
  const s: EscState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'GO_LOBBY': { s.screen = 'intro'; s.onlineMode = 'cpu'; return s }
    case 'GO_LOBBY_ONLINE': { s.screen = 'lobby'; return s }
    case 'GO_SETUP': { s.screen = 'setup'; return s }
    case 'GO_ALBUM': { s.screen = 'album'; return s }
    case 'SET_PRESENCE': { s.presence = action.indices; return s }
    case 'START': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'
      s.isHost = true
      s.humanCount = 1
      const { managers: soloManagers, botPlans: soloPlans } = makeManagers([action.teamName || 'Meu Time'], action.formation, 1 + action.rivals, rng, 'solo')
      s.managers = soloManagers
      s.youIdx = 0
      const soloUsed = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, soloUsed, 1)
      dealBotSquads(s.managers, soloPlans, rng, soloUsed) // no solo não há bots de preenchimento; no-op
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}
      s.seasonNo = 1
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'START_ONLINE': {
      s.onlineMode = 'online'
      s.roomId = action.roomId
      s.roomCode = action.roomCode
      s.isHost = action.isHost
      s.youIdx = action.playerIndex
      s.humanCount = action.playerNames.length
      s.seed = hashCode(action.roomCode)
      const rng = mulberry(s.seed)
      // a tabela sempre tem 20 times: os que faltam viram bots com elenco
      // pronto (não brigam no leilão — só os humanos disputam as cartas)
      const { managers: onlineManagers, botPlans: onlinePlans } = makeManagers(action.playerNames, action.formation, LEAGUE_SIZE, rng, 'online')
      s.managers = onlineManagers
      // demanda + 1 carta por posição (online): 2 pessoas = 3 goleiros, 5
      // laterais, etc. — dá opção/disputa sem inflar. O baralho é montado
      // ANTES dos bots pra ficar 100% com reais.
      const onlineUsed = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, onlineUsed, 1)
      dealBotSquads(s.managers, onlinePlans, rng, onlineUsed)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0; s.monte = []; s.news = []; s.round = 0; s.champion = null
      s.tactics = {}
      s.seasonNo = 1
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'SUBMIT_ENVELOPE': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      if (s.submitted.includes(action.mgrId)) return s
      s.pendingEnvelopes[action.mgrId] = action.bids
      s.submitted.push(action.mgrId)
      const pos = SECTORS[s.sectorIdx]
      const need = humansToSubmit(s, pos)
      const allIn = need.every(id => s.submitted.includes(id))
      if (allIn) sealAndResolve(s)
      return s
    }
    case 'ADVANCE_REVEAL': {
      if (s.phase !== 'reveal' && s.phase !== 'resq_reveal') return s
      if (s.revealIdx < s.revealQueue.length - 1) s.revealIdx++
      else afterReveal(s)
      return s
    }
    case 'FORCE_SEAL': {
      if (s.phase !== 'envelope' && s.phase !== 'resq_envelope') return s
      // reconfirma o prazo no momento de aplicar: rejeita disparo atrasado/duplicado
      // de um cliente que ficou pra trás (ex.: outro setor já começou)
      if (!s.phaseDeadline || Date.now() < s.phaseDeadline) return s
      const pos = SECTORS[s.sectorIdx]
      const need = humansToSubmit(s, pos)
      for (const id of need) {
        if (!s.submitted.includes(id)) {
          s.pendingEnvelopes[id] = s.pendingEnvelopes[id] ?? []
          s.submitted.push(id)
        }
      }
      sealAndResolve(s)
      return s
    }
    case 'MONTE_PICK': {
      if (s.screen !== 'monte') return s
      if (s.monteOrder[s.monteIdx] !== action.mgrId) return s
      const rng = rngOf(s)
      takeFromMonte(s, action.cardId)
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(m => totalHoles(m) === 0)) {
        s.screen = 'cerimonia'
      }
      return s
    }
    case 'MONTE_TIMEOUT': {
      // estourou o tempo da vez de um humano (AFK): pega a PIOR sobra e -5 moedas
      if (s.screen !== 'monte') return s
      // reconfirma o prazo: rejeita disparo atrasado/duplicado de outra vez já passada
      if (!s.monteDeadline || Date.now() < s.monteDeadline) return s
      const mgrId = s.monteOrder[s.monteIdx]
      const m = s.managers.find(x => x.id === mgrId)
      if (!m || !m.isHuman) return s
      const rng = rngOf(s)
      const pick = monteWorstPick(m, s.monte, rng)
      if (pick) {
        takeFromMonte(s, pick.id)
        m.money = Math.max(0, m.money - MONTE_AFK_PENALTY)
      }
      s.monteIdx++
      advanceMonte(s, rng)
      if (s.monteIdx >= s.monteOrder.length || s.managers.every(mm => totalHoles(mm) === 0)) {
        s.screen = 'cerimonia'
      }
      return s
    }
    case 'FINISH_CEREMONY': {
      if (s.screen !== 'cerimonia') return s
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.round = 0
      s.scorers = []
      s.screen = 'season'
      return s
    }
    case 'SET_TACTIC': {
      s.tactics[action.mgrId] = action.tactic
      return s
    }
    case 'PLAY_ROUND':
    case 'SIM_MANY': {
      const times = action.type === 'PLAY_ROUND' ? 1 : action.count
      for (let i = 0; i < times && s.round < TOTAL_ROUNDS; i++) {
        const rng = mulberry(s.seed + 5000 + s.round * 37)
        const results = s.fixtures[s.round].map(([h, a]) => simMatch(s, h, a, rng))
        results.forEach(r => applyResult(s.league, r))
        s.lastResults = results
        s.round++
      }
      s.news = s.news.slice(0, 12)
      if (s.round >= TOTAL_ROUNDS) {
        s.champion = sortedTable(s.league)[0].id
        s.screen = 'end'
      }
      return s
    }
    case 'NEW_SEASON':
      // full re-draft direto (usado no modo solo/CPU, onde não há espera).
      return redraftSeason(s)
    case 'REPLAY_SEASON': {
      // "Nova temporada" (mesmo time): mantém TODOS os elencos como estão e
      // só recomeça o campeonato — tabela, calendário e artilharia zerados.
      // Nada de leilão. Disparado pelo host; o resultado já computado vai
      // pros convidados por SYNC_STATE.
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.round = 0
      s.scorers = []
      s.lastResults = []
      s.news = []
      s.champion = null
      s.tactics = {}
      s.seasonNo++
      s.restartPending = false
      s.restartReady = []
      s.screen = 'season'
      return s
    }
    case 'REQUEST_NEW_TEAMS': {
      // host abre o "check de prontidão": todo mundo online precisa confirmar
      // antes de refazer o leilão. O host já entra confirmado.
      s.restartPending = true
      s.restartReady = s.isHost ? [s.youIdx] : []
      return maybeStartRedraft(s)
    }
    case 'CONFIRM_RESTART': {
      if (!s.restartPending) return s
      if (!s.restartReady.includes(action.mgrId)) s.restartReady = [...s.restartReady, action.mgrId]
      return maybeStartRedraft(s)
    }
    case 'CANCEL_RESTART': {
      s.restartPending = false
      s.restartReady = []
      return s
    }
    default:
      return s
  }
}

// ─── contexto + provider (host-autoritativo, espelha o modo Draft) ───
const Ctx = createContext<{ state: EscState; dispatch: (a: Action) => void } | null>(null)

export function EscProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isHostRef = useRef(state.isHost)
  const onlineRef = useRef(state.onlineMode)
  const stateRef = useRef(state)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { isHostRef.current = state.isHost }, [state.isHost])
  useEffect(() => { onlineRef.current = state.onlineMode }, [state.onlineMode])
  useEffect(() => { stateRef.current = state }, [state])

  // convidado roteia ações pro host; host aplica local
  const dispatch = useCallback((action: Action) => {
    if (onlineRef.current === 'online' && !isHostRef.current && action.type !== 'GO_LOBBY' && action.type !== 'NEW_GAME' && action.type !== 'GO_ALBUM') {
      channelRef.current?.send({ type: 'broadcast', event: 'action', payload: action })
    } else {
      rawDispatch(action)
    }
  }, [])

  // canal realtime quando online
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomId) return
    const ch = supabase.channel(`escalacao:${state.roomId}`, { config: { broadcast: { self: false, ack: false } } })

    if (state.isHost) {
      ch.on('broadcast', { event: 'action' }, ({ payload }: { payload: Action }) => rawDispatch(payload))
      ch.on('broadcast', { event: 'request_state' }, () => {
        channelRef.current?.send({ type: 'broadcast', event: 'state', payload: sanitize(stateRef.current) })
      })
    } else {
      ch.on('broadcast', { event: 'state' }, ({ payload }: { payload: EscState }) => rawDispatch({ type: 'SYNC_STATE', newState: payload }))
    }
    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState()
      const indices = Object.values(pState).flat().map((p: unknown) => (p as { playerIndex: number }).playerIndex)
      rawDispatch({ type: 'SET_PRESENCE', indices })
    })
    ch.subscribe(async () => {
      await ch.track({ playerIndex: state.youIdx })
      if (!state.isHost) channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
    })
    channelRef.current = ch
    return () => { ch.unsubscribe(); channelRef.current = null }
  }, [state.roomId, state.onlineMode, state.isHost]) // eslint-disable-line react-hooks/exhaustive-deps

  // host retransmite estado (sanitizado: envelopes pendentes não vazam)
  const prevRef = useRef<EscState | null>(null)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    if (prevRef.current === state) return
    prevRef.current = state
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: sanitize(state) })
  }, [state])

  // HEARTBEAT do host: reemite o estado a cada 3s. Sem isto, se UMA mensagem do
  // host se perde no caminho (mais comum com 3+ pessoas, mais tráfego), o
  // convidado fica travado pra sempre — ex.: preso no "Enviando…", porque nunca
  // recebe a confirmação. Com o heartbeat, quem perdeu uma atualização se
  // ressincroniza em ~3s. (Guest também reenvia o próprio lance de tempos em
  // tempos, então os dois lados se recuperam.)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    const iv = setInterval(() => {
      if (stateRef.current.screen === 'intro' || stateRef.current.screen === 'lobby') return
      channelRef.current?.send({ type: 'broadcast', event: 'state', payload: sanitize(stateRef.current) })
    }, 3000)
    return () => clearInterval(iv)
  }, [state.onlineMode, state.isHost, state.roomId])

  // Vigia do Monte: se a vez de um humano estoura o tempo (AFK), força o
  // auto-preenchimento. Roda em TODOS os clientes conectados (não só o host) —
  // se dependesse só do host, o celular dele apagar a tela travava a sala
  // inteira pra sempre. O reducer reconfirma o prazo antes de aplicar, então
  // disparos duplicados de vários clientes são inofensivos.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.screen !== 'monte' || !state.monteDeadline) return
    const cur = state.monteOrder[state.monteIdx]
    const m = state.managers.find(x => x.id === cur)
    if (!m || !m.isHuman) return
    const t = setTimeout(() => dispatch({ type: 'MONTE_TIMEOUT' }), Math.max(0, state.monteDeadline - Date.now()) + 300)
    return () => clearTimeout(t)
  }, [state.monteDeadline, state.screen, state.monteIdx, state.onlineMode, state.managers, state.monteOrder, dispatch])

  // Vigia do leilão: mesmo princípio — qualquer cliente conectado pode forçar
  // o selamento quando o prazo do envelope estoura, não só o host.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.phase !== 'envelope' && state.phase !== 'resq_envelope') return
    if (!state.phaseDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FORCE_SEAL' }), Math.max(0, state.phaseDeadline - Date.now()) + 800)
    return () => clearTimeout(t)
  }, [state.phaseDeadline, state.phase, state.onlineMode, dispatch])

  // host persiste no banco a cada 3s
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId || state.screen === 'intro') return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      supabase.from('game_rooms').update({ game_state: sanitize(state) }).eq('id', state.roomId)
    }, 3000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [state])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

// mantém o leilão cego: convidados nunca recebem os envelopes pendentes,
// só quem já lacrou (contador) — os valores só aparecem na revelação.
function sanitize(state: EscState): EscState {
  return { ...state, pendingEnvelopes: {} }
}

export function useEsc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEsc fora do EscProvider')
  return ctx
}

export type { Action as EscAction }
