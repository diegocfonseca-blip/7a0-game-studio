import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  EscState, Manager, Card, WonCard, Sector, FormationKey, Tactic, Bid, Division, CareerRival,
  ResolvedCard, LeagueTeam, MatchResult, MatchHighlight, ScorerRow, TieBreak,
} from './types'
import { SECTORS, FORMATIONS } from './types'
import { CATALOG, makeIncognita, CLASSIC_CLUBS, DIVISION_TEAMS } from './data'
import type { CareerTeam } from './data'
import { supabase } from '../lib/supabase'
import { logPlay, logVisit, heartbeat } from './analytics'

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
  const alloc = {} as Record<Sector, { legend: number; star: number; promessa: number; low: number }>
  SECTORS.forEach(p => { alloc[p] = { legend: 0, star: 0, promessa: 0, low: 0 } })
  const availOf = (pos: Sector, pred: (c: (typeof CATALOG)[Sector][number]) => boolean) =>
    plan[pos].catalog.filter(c => pred(c) && !used.has(c.name)).length
  const availLegend = {} as Record<Sector, number>
  const availStar = {} as Record<Sector, number>
  const availPromessa = {} as Record<Sector, number>
  const availLow = {} as Record<Sector, number>
  for (const pos of SECTORS) {
    availLegend[pos] = availOf(pos, c => c.fame === 5)
    availStar[pos] = availOf(pos, c => c.fame === 4 && !c.promessa) // craque (folk entra normal — é só selo)
    availPromessa[pos] = availOf(pos, c => !!c.promessa)            // 5º tier: promessas
    availLow[pos] = availOf(pos, c => c.fame === 1)                 // foi profissional (fame 1)
  }
  type Key = 'legend' | 'star' | 'promessa' | 'low'
  const distribute = (goal: number, availByPos: Record<Sector, number>, key: Key, capFrac: number) => {
    const cap = {} as Record<Sector, number>
    for (const pos of SECTORS) cap[pos] = Math.min(availByPos[pos], Math.max(1, Math.round(plan[pos].count * capFrac)), plan[pos].count)
    let left = Math.min(goal, SECTORS.reduce((s, p) => s + cap[p], 0))
    while (left > 0) {
      let best: Sector | null = null, bestScore = -1
      for (const pos of SECTORS) {
        const usedSlots = alloc[pos].legend + alloc[pos].star + alloc[pos].promessa + alloc[pos].low
        if (alloc[pos][key] >= cap[pos] || usedSlots >= plan[pos].count) continue
        const score = plan[pos].count / (alloc[pos][key] + 1)
        if (score > bestScore) { bestScore = score; best = pos }
      }
      if (!best) break
      alloc[best][key]++
      left--
    }
  }
  // cotas do leilão (metas de %). Folclórico NÃO é cota — virou só um selo
  // cosmético: o jogador folk entra normal pelo nível dele (craque/bom/etc.).
  // A antiga fatia de ~13% do folk foi redistribuída (a maior parte pra "foi
  // profissional"). O resto do baralho é bom jogador natural.
  distribute(Math.max(1, Math.round(totalCount * 0.15)), availLegend, 'legend', 0.45)    // LENDA 15%
  distribute(Math.max(1, Math.round(totalCount * 0.26)), availStar, 'star', 0.62)        // CRAQUE 26%
  distribute(Math.max(1, Math.round(totalCount * 0.17)), availPromessa, 'promessa', 0.55) // PROMESSAS 17%
  distribute(Math.max(1, Math.round(totalCount * 0.29)), availLow, 'low', 0.65)          // FOI PROFISSIONAL 29%
  // ── passo 3: monta cada setor — cotas garantidas, resto = bom jogador ──
  for (const pos of SECTORS) {
    const { count, catalog } = plan[pos]
    const cards: Card[] = []
    const take = (c: (typeof CATALOG)[Sector][number]) => { used.add(c.name); cards.push({ ...c, id: `cat-${pos}-${cards.length}`, pos }) }
    // 1) LENDA
    let needL = alloc[pos].legend
    for (const c of catalog) { if (needL <= 0) break; if (c.fame !== 5 || used.has(c.name)) continue; take(c); needL-- }
    // 2) CRAQUE (fame 4 — folk entra normal, é só selo)
    let needS = alloc[pos].star
    for (const c of catalog) { if (needS <= 0) break; if (c.fame !== 4 || c.promessa || used.has(c.name)) continue; take(c); needS-- }
    // 3) PROMESSAS (5º tier)
    let needP = alloc[pos].promessa
    for (const c of catalog) { if (needP <= 0) break; if (!c.promessa || used.has(c.name)) continue; take(c); needP-- }
    // 4) FOI PROFISSIONAL (fame 1)
    let needLo = alloc[pos].low
    for (const c of catalog) { if (needLo <= 0) break; if (c.fame !== 1 || used.has(c.name)) continue; take(c); needLo-- }
    // 5) resto = BOM JOGADOR natural (fame 2/3, não-promessa — folk entra aqui normal)
    for (const c of catalog) { if (cards.length >= count) break; if (used.has(c.name) || c.fame === 5 || c.fame === 4 || c.fame === 1 || c.promessa) continue; take(c) }
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
// Empate no MAIOR lance elegível (≥2 técnicos) não decide na hora: a carta
// entra na fila de desempate (ties) com vencedor pendente — quem resolve é o
// re-lance cego (ver resolveOneTiebreak). Sem empate, decide aqui mesmo.
function resolve(cards: Card[], bidMap: BidMap, managers: Manager[], via: 'leilao' | 'repescagem'): { queue: ResolvedCard[]; unsold: Card[]; ties: TieBreak[] } {
  const byPot = [...cards].sort((a, b) => {
    const pa = (bidMap.get(a.id) ?? []).reduce((s, x) => s + x.amount, 0)
    const pb = (bidMap.get(b.id) ?? []).reduce((s, x) => s + x.amount, 0)
    return pa - pb
  })
  const queue: ResolvedCard[] = []
  const unsold: Card[] = []
  const ties: TieBreak[] = []
  for (const card of byPot) {
    const sorted = (bidMap.get(card.id) ?? []).slice().sort((a, b) => b.amount - a.amount)
    if (sorted.length === 0) {
      unsold.push(card)
      queue.push({ card, bids: [], winner: null, paid: 0, voided: [] })
      continue
    }
    // pula do topo pra baixo os inelegíveis (setor cheio / sem dinheiro): anulados
    const voided: number[] = []
    let i = 0
    for (; i < sorted.length; i++) {
      const m = managers.find(x => x.id === sorted[i].mgr)!
      if (openSlots(m, card.pos) <= 0 || m.money < sorted[i].amount) { voided.push(sorted[i].mgr); continue }
      break
    }
    if (i >= sorted.length) { // ninguém elegível
      unsold.push(card)
      queue.push({ card, bids: sorted, winner: null, paid: 0, voided })
      continue
    }
    const top = sorted[i].amount
    // entre os elegíveis, quem também está no valor do topo?
    const tiedTop: number[] = []
    for (let j = i; j < sorted.length && sorted[j].amount === top; j++) {
      const m = managers.find(x => x.id === sorted[j].mgr)!
      if (openSlots(m, card.pos) > 0 && m.money >= top) tiedTop.push(sorted[j].mgr)
    }
    if (tiedTop.length >= 2) {
      // empate no topo → desempate (vencedor decidido depois). Sem dedução aqui.
      ties.push({ cardId: card.id, card, amount: top, managers: tiedTop, submitted: [], winner: null, paid: 0, viaRoulette: false, via })
      queue.push({ card, bids: sorted, winner: null, paid: 0, voided })
      continue
    }
    // vencedor único: fecha na hora
    const wid = tiedTop[0]
    const m = managers.find(x => x.id === wid)!
    m.money -= top
    m.squad.push({ ...card, paid: top, via } as WonCard)
    queue.push({ card, bids: sorted, winner: wid, paid: top, voided })
  }
  return { queue, unsold, ties }
}

// resolve UMA disputa de desempate: junta os re-lances (humanos já enviados +
// CPUs auto), o maior leva. Empatou de novo no topo → roleta (sorteio) entre
// eles. Atualiza dinheiro/elenco do vencedor e a carta na fila de revelação.
function resolveOneTiebreak(state: EscState, tb: TieBreak, rng: () => number) {
  const amounts: Record<number, number> = {}
  for (const id of tb.managers) {
    const m = state.managers.find(x => x.id === id)!
    let v = m.isHuman ? (state.tiebreakPending[id] ?? tb.amount) : cpuTiebreakBid(m, tb, rng)
    v = Math.min(m.money, Math.max(tb.amount, Math.round(v))) // trava: ≥ piso e ≤ dinheiro
    amounts[id] = v
  }
  const max = Math.max(...tb.managers.map(id => amounts[id]))
  const top = tb.managers.filter(id => amounts[id] === max)
  let winner: number
  if (top.length === 1) { winner = top[0]; tb.viaRoulette = false }
  else { winner = top[Math.floor(rng() * top.length)]; tb.viaRoulette = true } // empatou de novo → roleta
  const m = state.managers.find(x => x.id === winner)!
  m.money -= max
  m.squad.push({ ...tb.card, paid: max, via: tb.via } as WonCard)
  tb.winner = winner
  tb.paid = max
  tb.bids = amounts // registra quanto cada um cobriu (transparência na revelação)
  const rc = state.revealQueue.find(q => q.card.id === tb.cardId)
  if (rc) { rc.winner = winner; rc.paid = max }
}

// CPU no desempate: cobre um pouco acima do valor empatado conforme o
// arquétipo (mais agressivo/faminto por craque sobe mais), limitado ao caixa.
function cpuTiebreakBid(m: Manager, tb: TieBreak, rng: () => number): number {
  const hunger = tb.card.fame >= 4 ? m.starHunger : 0.3
  const bump = Math.round((2 + tb.amount * 0.25) * (0.4 + m.aggression + hunger) * (0.6 + rng() * 0.8))
  return tb.amount + Math.max(1, bump)
}

// avança pela fila de desempates: para na próxima que precisa de humano (liga o
// prazo), resolve sozinha as que só têm CPU, e ao fim manda pra revelação.
function advanceTiebreaks(state: EscState) {
  while (state.tiebreakIdx < state.tiebreaks.length) {
    const tb = state.tiebreaks[state.tiebreakIdx]
    const humans = tb.managers.filter(id => state.managers.find(x => x.id === id)!.isHuman)
    if (humans.length > 0) { state.phaseDeadline = Date.now() + TIEBREAK_MS; return }
    resolveOneTiebreak(state, tb, rngOf(state))
    state.tiebreakIdx++
    state.tiebreakPending = {}
  }
  // acabaram os desempates: segue a cerimônia normal
  const rescue = state.tiebreaks.length > 0 && state.tiebreaks[0].via === 'repescagem'
  state.phase = rescue ? 'resq_reveal' : 'reveal'
  state.revealIdx = 0
  state.phaseDeadline = null
}

// chamado quando um humano re-lança: se todos os humanos da disputa atual já
// enviaram, resolve e avança.
function maybeResolveTiebreak(state: EscState) {
  const tb = state.tiebreaks[state.tiebreakIdx]
  if (!tb || tb.winner !== null) return
  const humans = tb.managers.filter(id => state.managers.find(x => x.id === id)!.isHuman)
  if (!humans.every(id => tb.submitted.includes(id))) return
  resolveOneTiebreak(state, tb, rngOf(state))
  state.tiebreakIdx++
  state.tiebreakPending = {}
  advanceTiebreaks(state)
}

// ─── temporada ───────────────────────────────────────────────────────
function buildLeague(managers: Manager[]): LeagueTeam[] {
  // bidders "auction-only" (rivais de outra divisão na carreira) NÃO entram na
  // tabela — só brigaram no leilão; jogam a própria divisão (vida na pirâmide).
  const teams: LeagueTeam[] = managers.filter(m => !m.auctionOnly).map(m => ({
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

// força "de base" de um time (sem sorte/tática): usa o nível MÉDIO de cada
// carta. Serve pra comparar humanos x bots e calibrar a dificuldade do CPU.
function midPower(m: Manager): { atk: number; def: number } {
  const rolls = m.squad.map(c => ({ pos: c.pos, lvl: (c.lo + c.hi) / 2 }))
  const sector = (pos: Sector): number => {
    const s = rolls.filter(r => r.pos === pos)
    if (s.length === 0) return 40
    const avg = s.reduce((x, r) => x + r.lvl, 0) / s.length
    const min = Math.min(...s.map(r => r.lvl))
    return avg - (avg - min) * 0.35
  }
  const gol = sector('GOL'), lat = sector('LAT'), zag = sector('ZAG'), mei = sector('MEI'), ata = sector('ATA')
  return { atk: ata * 0.45 + mei * 0.35 + lat * 0.20, def: gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15 }
}

// ─── modo carreira: divisões, dificuldade e progressão ───────────────
const DIVISIONS: Division[] = ['D', 'C', 'B', 'A'] // de baixo pra cima
// DIFICULDADE = NÍVEL-BASE FIXO POR DIVISÃO, morando nos BOTS DE FUNDO.
// Cada divisão tem um "nível" próprio (D fraca → A elite). Os rivais de leilão
// NÃO levam ajuste nenhum: jogam a força que montaram no pregão (dividindo o
// baralho com você). Assim o SEU elenco decide subir/cair, e time bom é premiado.
// Rápido = Série D (fillers fracos + rivais do leilão). Online (sem rivais) usa
// um nível-base próprio, senão o campo fica fraco demais. Números validados em
// simulação (2500 temporadas/divisão).
const DIVISION_BASE: Record<Division, number> = { D: 64, C: 70, B: 75, A: 82 }
const ONLINE_BASE = 74
// desloca os BOTS DE FUNDO (não-rivais) pra bater no nível-base alvo. Devolve um
// offset escalar (aplicado só aos fillers no simMatch); os rivais ficam com 0.
function fillerAdj(managers: Manager[], target: number): { atk: number; def: number } {
  const fillers = managers.filter(m => !m.isHuman && !m.auctionRival && m.squad.length > 0)
  if (fillers.length === 0) return { atk: 0, def: 0 }
  const nat = fillers.reduce((s, m) => { const p = midPower(m); return s + (p.atk + p.def) / 2 }, 0) / fillers.length
  const off = target - nat
  return { atk: off, def: off }
}
// alvo de nível conforme o modo: carreira usa a divisão; rápido = D; online = base própria.
function cpuAdjFor(s: EscState): { atk: number; def: number } {
  const target = s.onlineMode === 'online' ? ONLINE_BASE : DIVISION_BASE[s.careerDivision ?? 'D']
  return fillerAdj(s.managers, target)
}
// sobe (top 3), cai (Z4: 17º+) ou fica — limitado por A (topo) e D (base).
export function nextDivision(div: Division, youPos: number): { div: Division; result: 'up' | 'down' | 'stay' } {
  const i = DIVISIONS.indexOf(div)
  if (youPos <= 4 && i < DIVISIONS.length - 1) return { div: DIVISIONS[i + 1], result: 'up' }   // G4 sobe
  if (youPos >= 17 && i > 0) return { div: DIVISIONS[i - 1], result: 'down' }                    // Z4 cai
  return { div, result: 'stay' }
}
export const DIVISION_LABEL: Record<Division, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
// o que é salvo na conta (Supabase) pra retomar a carreira depois.
// `division`/`seasonNo` já são os da PRÓXIMA temporada (subiu/caiu/ficou já
// resolvido no fim da temporada); `pendingDecision` marca que a pessoa salvou
// no fim da temporada SEM ter escolhido manter o time ou trocar tudo — então
// ao continuar a gente traz essa decisão de volta (não escolhe por ela).
export interface CareerSave {
  division: Division; seasonNo: number; teamName: string; formation: FormationKey; squad: WonCard[]; titles: number
  titlesA?: number                // títulos da Série A (estrelas). opcional p/ saves antigos
  pendingDecision?: boolean
  result?: 'up' | 'down' | 'stay' // pro banner subiu/caiu/ficou ao continuar
  prevDivision?: Division         // divisão da temporada que acabou (pro banner)
  rivals?: CareerRival[]          // rivais fixos (com divisão/retrospecto próprios)
  rivalCount?: number             // quantos rivais de leilão (3/5/7/9)
}

// rivais fixos da carreira: começam TODOS na Série D (com você). Depois cada um
// tem vida própria na pirâmide. `chosen` = times escolhidos pela pessoa (por
// nome do time); o que faltar completa com os primeiros da Série D.
function initCareerRivals(count: number, chosen?: string[]): CareerRival[] {
  const pool = DIVISION_TEAMS['D']
  const pickNames = (chosen && chosen.length > 0)
    ? [...chosen, ...pool.map(t => t.team).filter(t => !chosen.includes(t))].slice(0, count)
    : pool.slice(0, count).map(t => t.team)
  return pickNames.map(team => {
    const def = pool.find(t => t.team === team) ?? { name: team, team }
    return { team: def.team, name: def.name, division: 'D' as Division, h2h: [0, 0, 0] as [number, number, number], lastPos: null }
  })
}
// os rivais que estão AGORA na sua divisão (esses jogam contra você e brigam no leilão)
function coDivRivalDefs(rivals: CareerRival[], div: Division): CareerTeam[] {
  return rivals.filter(r => r.division === div).map(r => ({ name: r.name, team: r.team }))
}
// rivais que estão em OUTRA divisão: entram só como bidders no seu leilão
// (não jogam sua liga). É o que mantém a rivalidade viva no pregão mesmo quando
// eles subiram/caíram pra longe.
function otherDivRivalDefs(rivals: CareerRival[], div: Division): CareerTeam[] {
  return rivals.filter(r => r.division !== div).map(r => ({ name: r.name, team: r.team }))
}

// monta a liga da carreira: você + rivais QUE ESTÃO NA SUA DIVISÃO (dão lance no
// leilão e jogam contra você) + o resto da divisão como preenchimento nomeado.
function makeCareerManagers(teamName: string, formation: FormationKey, div: Division, rivalDefs: CareerTeam[], otherRivalDefs: CareerTeam[], rng: () => number): { managers: Manager[]; botPlans: BotPlan[] } {
  const forms: FormationKey[] = ['4-3-3', '4-4-2']
  const human: Manager = { id: 0, name: teamName, teamName, isHuman: true, auctionRival: true, formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5 }
  const usedTeams = new Set(rivalDefs.map(r => r.team))
  const fillerNeeded = LEAGUE_SIZE - 1 - rivalDefs.length
  const fillerDefs = DIVISION_TEAMS[div].filter(t => !usedTeams.has(t.team)).slice(0, fillerNeeded)
  const cpus: Manager[] = []
  const botPlans: BotPlan[] = []
  let id = 1
  for (const r of rivalDefs) {
    cpus.push({ id, name: r.name, teamName: r.team, isHuman: false, auctionRival: true, formation: forms[Math.floor(rng() * forms.length)], money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng() })
    id++
  }
  // rivais de OUTRA divisão: bidders "auction-only" — brigam no pregão mas não
  // entram na sua liga (buildLeague os ignora; saem dos managers na cerimônia).
  for (const r of otherRivalDefs) {
    cpus.push({ id, name: r.name, teamName: r.team, isHuman: false, auctionRival: true, auctionOnly: true, formation: forms[Math.floor(rng() * forms.length)], money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng() })
    id++
  }
  const strongN = Math.max(1, Math.round(fillerDefs.length * 0.15))
  const weakN = Math.max(1, Math.round(fillerDefs.length * 0.15))
  fillerDefs.forEach((f, i) => {
    const cpuFormation = forms[Math.floor(rng() * forms.length)]
    const tier: Tier = i < strongN ? 'strong' : i >= fillerDefs.length - weakN ? 'weak' : 'mid'
    botPlans.push({ id, tier, formation: cpuFormation })
    cpus.push({ id, name: f.name, teamName: f.team, isHuman: false, auctionRival: false, formation: cpuFormation, money: 0, squad: [], aggression: 0.5, starHunger: 0.5 })
    id++
  })
  return { managers: [human, ...cpus], botPlans }
}

// dá elenco aos CPUs que ainda estão vazios (usado no "continuar mesmo time",
// onde não há leilão): rivais novos e preenchimento ganham time; os rivais que
// vieram junto mantêm o elenco que já tinham.
function dealRemainingCpuSquads(managers: Manager[], rng: () => number, used: Set<string>) {
  const empties = managers.filter(m => !m.isHuman && m.squad.length === 0)
  const strongN = Math.max(1, Math.round(empties.length * 0.2))
  const weakN = Math.max(1, Math.round(empties.length * 0.2))
  empties.forEach((b, i) => {
    const tier: Tier = i < strongN ? 'strong' : i >= empties.length - weakN ? 'weak' : 'mid'
    b.squad = makeBotSquad(b.formation, tier, rng, used)
  })
}

// resolve o fim da temporada da carreira: SUA próxima divisão + a pirâmide dos
// rivais avançada. Cada rival tem vida própria: quem estava na sua divisão usa
// a posição real da tabela; os demais têm a temporada simulada (não renderizada).
// Todos sobem/caem sozinhos. O retrospecto (h2h) é somado durante os jogos.
interface CareerEnd { nextDiv: Division; result: 'up' | 'down' | 'stay'; wonTitle: boolean; rivals: CareerRival[] }
function resolveCareerEnd(s: EscState): CareerEnd {
  const div = s.careerDivision as Division
  const you = s.managers[s.youIdx]
  const table = sortedTable(s.league)
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const wonTitle = table[0]?.id === you.id
  const nd = nextDivision(div, youPos)
  const rng = mulberry((s.seed ^ 0x5f3759df) >>> 0) // determinístico (save = advance)
  const rivals: CareerRival[] = s.careerRivals.map(rv => {
    let pos: number
    if (rv.division === div) {
      const m = s.managers.find(x => !x.isHuman && x.teamName === rv.team)
      pos = m ? table.findIndex(t => t.id === m.id) + 1 : 1 + Math.floor(rng() * LEAGUE_SIZE)
    } else {
      pos = 1 + Math.floor(rng() * LEAGUE_SIZE) // temporada dele simulada
    }
    return { ...rv, division: nextDivision(rv.division, pos).div, lastPos: pos }
  })
  return { nextDiv: nd.div, result: nd.result, wonTitle, rivals }
}

export function buildCareerSave(s: EscState): CareerSave | null {
  if (!s.careerDivision) return null
  const you = s.managers[s.youIdx]
  if (!you) return null
  // resolve o fim da temporada AQUI (título, subida/queda, +1 temporada, e a
  // pirâmide dos rivais) pra que continuar depois retome no ponto certo.
  const res = resolveCareerEnd(s)
  return {
    division: res.nextDiv, seasonNo: s.seasonNo + 1,
    teamName: you.teamName, formation: you.formation, squad: you.squad,
    titles: s.careerTitles + (res.wonTitle ? 1 : 0),
    titlesA: s.careerTitlesA + (res.wonTitle && s.careerDivision === 'A' ? 1 : 0),
    pendingDecision: true, result: res.result, prevDivision: s.careerDivision,
    rivals: res.rivals, rivalCount: s.careerRivalCount,
  }
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
    if (!team.isManager) return { atk: team.baseAtk + state.cpuAtkAdj + (rng() * 6 - 3), def: team.baseDef + state.cpuDefAdj + (rng() * 6 - 3), inspired: null }
    const m = state.managers.find(x => x.id === id)!
    const f = rollManagerForm(m, own, opp, rng)
    // só os BOTS DE FUNDO (não-rivais) levam o ajuste, pra bater no nível-base da
    // divisão. Os rivais de leilão e os humanos jogam a própria força, sem ajuste.
    if (!m.isHuman && !m.auctionRival) { f.atk += state.cpuAtkAdj; f.def += state.cpuDefAdj }
    return f
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

// ─── rivalidade de clássicos (só entre humanos) ──────────────────────
export function rivKey(a: number, b: number): string { return a < b ? `${a}v${b}` : `${b}v${a}` }
// retrospecto de um humano contra um adversário, do ponto de vista de "youId"
export function rivalryOf(rivalries: Record<string, [number, number, number]>, youId: number, oppId: number): { w: number; l: number; d: number } {
  const rec = rivalries[rivKey(youId, oppId)]
  if (!rec) return { w: 0, l: 0, d: 0 }
  const youLow = youId < oppId
  return { w: youLow ? rec[0] : rec[1], l: youLow ? rec[1] : rec[0], d: rec[2] }
}
function bumpRivalry(s: EscState, aId: number, bId: number, aGoals: number, bGoals: number) {
  const key = rivKey(aId, bId)
  const cur: [number, number, number] = s.rivalries[key] ? [...s.rivalries[key]] : [0, 0, 0]
  const lowId = Math.min(aId, bId)
  if (aGoals === bGoals) cur[2]++
  else {
    const winnerId = aGoals > bGoals ? aId : bId
    if (winnerId === lowId) cur[0]++; else cur[1]++
  }
  s.rivalries[key] = cur
}

// carreira: soma o retrospecto (h2h) contra um rival fixo quando VOCÊ o enfrenta
// (só vale quando ele está na sua divisão). h2h = [suas vitórias, empates, dele].
function bumpCareerH2H(s: EscState, r: MatchResult) {
  const you = s.managers[s.youIdx]
  if (!you) return
  let oppId: number, myGoals: number, oppGoals: number
  if (r.homeId === you.id) { oppId = r.awayId; myGoals = r.hg; oppGoals = r.ag }
  else if (r.awayId === you.id) { oppId = r.homeId; myGoals = r.ag; oppGoals = r.hg }
  else return
  const opp = s.managers.find(m => m.id === oppId)
  if (!opp) return
  const rv = s.careerRivals.find(x => x.team === opp.teamName)
  if (!rv) return
  if (myGoals > oppGoals) rv.h2h[0]++
  else if (myGoals === oppGoals) rv.h2h[1]++
  else rv.h2h[2]++
}

// ─── narração viva da rodada: manchetes NEUTRAS (iguais pra sala toda) ───
// A parte pessoal ("Você colou no G4") é feita no cliente, por quem vê.
function narrateRound(s: EscState, results: MatchResult[], prevRank: Map<number, number>,
  prevGoals: Map<string, number>, roundNum: number): string[] {
  const nameOf = (id: number) => s.league.find(t => t.id === id)?.name ?? '?'
  const nowSorted = sortedTable(s.league)
  const heads: string[] = []

  // 1) novo líder?
  const leader = nowSorted[0]
  const prevLeaderId = [...prevRank.entries()].find(([, r]) => r === 1)?.[0]
  if (leader && prevLeaderId != null && prevLeaderId !== leader.id) {
    heads.push(`👑 ${leader.name} assumiu a liderança do campeonato!`)
  }

  // 2) artilheiro pegando fogo (cruzou marca de 5 gols nesta rodada)
  let milestone: { name: string; team: string; g: number } | null = null
  for (const sc of s.scorers) {
    const before = prevGoals.get(sc.name + ':' + sc.teamId) ?? 0
    if (sc.goals >= 5 && Math.floor(sc.goals / 5) > Math.floor(before / 5)) {
      if (!milestone || sc.goals > milestone.g) milestone = { name: sc.name, team: sc.teamName, g: sc.goals }
    }
  }
  if (milestone) heads.push(`🎯 ${milestone.name} (${milestone.team}) tá pegando fogo: ${milestone.g} gols na temporada!`)

  // 3) zebra da rodada (vencedor bem pior colocado que o perdedor)
  let zebra: { winId: number; loseId: number; wr: number; lr: number; wg: number; lg: number; gap: number } | null = null
  for (const r of results) {
    if (r.hg === r.ag) continue
    const winId = r.hg > r.ag ? r.homeId : r.awayId
    const loseId = r.hg > r.ag ? r.awayId : r.homeId
    const wr = prevRank.get(winId) ?? 20, lr = prevRank.get(loseId) ?? 20
    const gap = wr - lr
    if (gap >= 8 && (!zebra || gap > zebra.gap)) {
      zebra = { winId, loseId, wr, lr, wg: Math.max(r.hg, r.ag), lg: Math.min(r.hg, r.ag), gap }
    }
  }
  if (zebra) heads.push(`😱 ZEBRA! ${nameOf(zebra.winId)} (${zebra.wr}º) derrubou o ${nameOf(zebra.loseId)} (${zebra.lr}º): ${zebra.wg}×${zebra.lg}.`)

  // 4) goleada da rodada (fora a zebra, se sobrar espaço)
  let big: { r: MatchResult; d: number } | null = null
  for (const r of results) {
    const d = Math.abs(r.hg - r.ag)
    if (d >= 4 && (!big || d > big.d)) big = { r, d }
  }
  if (big && (!zebra || (big.r.homeId !== zebra.winId && big.r.homeId !== zebra.loseId))) {
    const winId = big.r.hg > big.r.ag ? big.r.homeId : big.r.awayId
    const loseId = big.r.hg > big.r.ag ? big.r.awayId : big.r.homeId
    heads.push(`💥 ${nameOf(winId)} goleou o ${nameOf(loseId)}: ${Math.max(big.r.hg, big.r.ag)}×${Math.min(big.r.hg, big.r.ag)}.`)
  }

  return heads.slice(0, 3).map(h => `R${roundNum} · ${h}`)
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
// A tabela SEMPRE tem `leagueSize` times com elenco nomeado. Os CPUs se
// dividem em dois papéis:
//   • `auctionCpus` RIVAIS de leilão — dão lance junto com você, montam o time
//     NO pregão (solo/carreira: os 3/5/7/9 que você escolhe; online: 0).
//   • o RESTO é PREENCHIMENTO — já entra com elenco pronto (via botPlans),
//     nunca dá lance, só completa a tabela. Como todos têm jogadores com nome,
//     a artilharia mostra o campeonato inteiro (igual solo e online).
// Devolve os "planos" dos bots de preenchimento pra montar o baralho do leilão
// PRIMEIRO (reservando os reais pros que disputam) e só depois escalar o resto.
type BotPlan = { id: number; tier: Tier; formation: FormationKey }
function makeManagers(humanNames: string[], formation: FormationKey, auctionCpus: number, leagueSize: number, rng: () => number): { managers: Manager[]; botPlans: BotPlan[] } {
  const forms: FormationKey[] = ['4-3-3', '4-4-2']
  const humans: Manager[] = humanNames.map((name, i) => ({
    id: i, name, teamName: name, isHuman: true, auctionRival: true,
    formation, money: START_MONEY, squad: [], aggression: 0.5, starHunger: 0.5,
  }))
  const totalCpus = Math.max(0, leagueSize - humans.length)
  const nAuction = Math.min(Math.max(0, auctionCpus), totalCpus)
  const nFiller = totalCpus - nAuction
  const strongN = Math.max(1, Math.round(nFiller * 0.15))
  const weakN = Math.max(1, Math.round(nFiller * 0.15))
  // times dos CPUs = os mesmos da Série D da carreira (online e revanche usam a
  // divisão de base, pra não aparecer nome velho tipo "Nininho EC").
  const names = DIVISION_TEAMS['D'].slice(0, totalCpus)
  const botPlans: BotPlan[] = []
  const cpus: Manager[] = names.map((c, i) => {
    const cpuFormation = forms[Math.floor(rng() * forms.length)]
    const id = humans.length + i
    if (i < nAuction) {
      // rival de leilão: monta o time NO pregão (dá lance)
      return {
        id, name: c.name, teamName: c.team, isHuman: false, auctionRival: true,
        formation: cpuFormation, money: START_MONEY, squad: [], aggression: 0.25 + rng() * 0.7, starHunger: rng(),
      }
    }
    // preenchimento: elenco pronto, nunca dá lance
    const fi = i - nAuction
    const tier: Tier = fi < strongN ? 'strong' : fi >= nFiller - weakN ? 'weak' : 'mid'
    botPlans.push({ id, tier, formation: cpuFormation })
    return {
      id, name: c.name, teamName: c.team, isHuman: false, auctionRival: false,
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
  careerDivision: null, careerIntent: false, careerTitles: 0, careerTitlesA: 0, careerRivalCount: 5, careerRivals: [],
  phaseDeadline: null, scorers: [],
  monteDeadline: null, cerimoniaDeadline: null,
  cpuAtkAdj: 0, cpuDefAdj: 0, streamMode: false,
  sectorCursor: 0, sectorUnsoldAccum: [], roundIdx: 0,
  seasonNo: 1,
  restartPending: false, restartReady: [],
  tiebreaks: [], tiebreakIdx: 0, tiebreakPending: {},
  rivalries: {},
}

// ─── ações ───────────────────────────────────────────────────────────
type Action =
  | { type: 'GO_LOBBY' }
  | { type: 'GO_LOBBY_ONLINE' }
  | { type: 'GO_SETUP' }
  | { type: 'GO_SETUP_CAREER' }
  | { type: 'GO_ALBUM' }
  | { type: 'GO_RANKING' }
  | { type: 'START'; teamName: string; formation: FormationKey; rivals: number; career?: boolean; rivalTeams?: string[]; dinastia?: boolean; budget?: number }
  | { type: 'CAREER_ADVANCE'; keep: boolean }
  | { type: 'RESTORE_CAREER'; save: CareerSave; redraft?: boolean }
  | { type: 'START_DINASTIA_SEASON'; teamName: string; formation: FormationKey; division: Division; seasonNo: number; squad: WonCard[]; others: { name: string; squad: Card[] }[] }
  | { type: 'START_ONLINE'; roomId: string; roomCode: string; isHost: boolean; playerIndex: number; playerNames: string[]; formation: FormationKey; stream?: boolean }
  | { type: 'RESTORE_ONLINE'; state: EscState; roomId: string; roomCode: string; isHost: boolean; playerIndex: number }
  | { type: 'SYNC_STATE'; newState: EscState }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'KICK_PLAYER'; playerIndex: number }
  | { type: 'SUBMIT_ENVELOPE'; mgrId: number; bids: { cardId: string; amount: number }[] }
  | { type: 'ADVANCE_REVEAL' }
  | { type: 'FORCE_SEAL' }
  | { type: 'SUBMIT_TIEBREAK'; mgrId: number; amount: number }
  | { type: 'FORCE_TIEBREAK' }
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
const CEREMONY_MS = 45_000 // tempo pra olhar os times antes do campeonato começar sozinho

// entra na cerimônia da revelação e liga o cronômetro de 45s (auto-começa)
function enterCerimonia(st: EscState) {
  st.screen = 'cerimonia'
  st.cerimoniaDeadline = Date.now() + CEREMONY_MS
}
const TIEBREAK_MS = 30_000

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
  const { queue, unsold, ties } = resolve(state.currentCards, bidMap, state.managers, rescue ? 'repescagem' : 'leilao')
  state.revealQueue = queue
  state.revealIdx = 0
  state.currentCards = unsold
  state.submitted = []
  state.pendingEnvelopes = {}
  state.tiebreaks = ties
  state.tiebreakIdx = 0
  state.tiebreakPending = {}
  if (ties.length > 0) {
    // tem empate no topo: entra na fase de desempate antes da revelação
    state.phase = 'tiebreak'
    advanceTiebreaks(state) // para no 1º que precisa de humano, ou já vai pra revelação
  } else {
    state.phase = rescue ? 'resq_reveal' : 'reveal'
    state.phaseDeadline = null
  }
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
    if (state.monteIdx >= state.monteOrder.length) enterCerimonia(state)
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
  // liga de 20 times sempre. online: nenhum CPU no leilão (só humanos). solo/
  // carreira: mantém a mesma quantidade de rivais de leilão que a sala tinha.
  const auctionCpus = s.onlineMode === 'online' ? 0 : s.managers.filter(m => !m.isHuman && m.auctionRival).length
  const { managers, botPlans } = makeManagers(humanNames, formation, auctionCpus, LEAGUE_SIZE, rng)
  s.managers = managers
  s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
  dealBotSquads(s.managers, botPlans, rng, used)
  for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
  s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.roundIdx = 0
  s.monte = []; s.monteOrder = []; s.monteIdx = 0
  s.news = []; s.round = 0; s.champion = null
  s.league = []; s.fixtures = []; s.scorers = []; s.lastResults = []
  s.tactics = {}
  s.submitted = []; s.pendingEnvelopes = {}
  s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
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
      rivalries: action.newState.rivalries ?? {}, // saves/broadcasts antigos
      cpuAtkAdj: action.newState.cpuAtkAdj ?? 0,
      cpuDefAdj: action.newState.cpuDefAdj ?? 0,
      streamMode: action.newState.streamMode ?? false,
      youIdx: state.youIdx,
      isHost: state.isHost,
      roomId: state.roomId,
      roomCode: state.roomCode,
      onlineMode: state.onlineMode,
    }
  }
  if (action.type === 'RESTORE_ONLINE') {
    // reconexão/host-caiu: adota o estado salvo no banco em vez de recomeçar
    // do zero. A identidade ("quem sou eu", host?) é sempre local a este
    // cliente; efêmeros host-only voltam limpos (já vêm sanitizados).
    return {
      ...action.state,
      rivalries: action.state.rivalries ?? {}, // saves antigos sem o campo
      cpuAtkAdj: action.state.cpuAtkAdj ?? 0,
      cpuDefAdj: action.state.cpuDefAdj ?? 0,
      streamMode: action.state.streamMode ?? false,
      onlineMode: 'online',
      roomId: action.roomId,
      roomCode: action.roomCode,
      isHost: action.isHost,
      youIdx: action.playerIndex,
      pendingEnvelopes: {},
      tiebreakPending: {},
      presence: [],
    }
  }
  if (action.type === 'NEW_GAME') return { ...INITIAL }
  const s: EscState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'GO_LOBBY': { s.screen = 'intro'; s.onlineMode = 'cpu'; s.dinastia = false; s.dinastiaBudget = undefined; return s }
    case 'GO_LOBBY_ONLINE': { s.screen = 'lobby'; return s }
    case 'GO_SETUP': { s.screen = 'setup'; s.careerIntent = false; return s }
    case 'GO_SETUP_CAREER': { s.screen = 'setup'; s.careerIntent = true; return s }
    case 'GO_ALBUM': { s.screen = 'album'; return s }
    case 'GO_RANKING': { s.screen = 'ranking'; return s }
    case 'SET_PRESENCE': { s.presence = action.indices; return s }
    case 'KICK_PLAYER': {
      // Host removeu um técnico da partida: a CPU assume o time dele e o jogo
      // segue sem travar. O cliente removido é ejetado pelo evento 'kick' à
      // parte (no provider); aqui só cuidamos de não deixar a fase esperando
      // por ele — mesma lógica do auto-preenchimento por AFK.
      const m = s.managers.find(x => x.id === action.playerIndex)
      if (!m || !m.isHuman) return s
      m.isHuman = false
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') {
        const pos = SECTORS[s.sectorIdx]
        if (humansToSubmit(s, pos).every(id => s.submitted.includes(id))) sealAndResolve(s)
      } else if (s.phase === 'tiebreak') {
        const tb = s.tiebreaks[s.tiebreakIdx]
        if (tb) tb.submitted = tb.submitted.filter(id => id !== action.playerIndex)
        maybeResolveTiebreak(s)
      } else if (s.screen === 'monte' && s.monteOrder[s.monteIdx] === action.playerIndex) {
        const rng = rngOf(s)
        advanceMonte(s, rng)
        if (s.monteIdx >= s.monteOrder.length || s.managers.every(mm => totalHoles(mm) === 0)) enterCerimonia(s)
      }
      return s
    }
    case 'START': {
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      s.onlineMode = 'cpu'
      s.isHost = true
      s.humanCount = 1
      // carreira: começa na Série D. Partida rápida: sem divisão.
      s.careerDivision = action.career ? 'D' : null
      s.careerIntent = false
      s.careerTitles = 0
      s.careerTitlesA = 0
      s.careerRivalCount = action.rivals
      s.careerRivals = action.career ? initCareerRivals(action.rivals, action.rivalTeams) : []
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0 // recalculado na cerimônia (quando os elencos existem)
      // carreira E partida rápida usam o MESMO elenco da Série D (lista única).
      // A diferença é só a pirâmide/save da carreira — a rápida é uma temporada
      // avulsa. Rivais = os escolhidos (carreira) ou os primeiros da D (rápida).
      const soloRivalDefs = action.career ? coDivRivalDefs(s.careerRivals, 'D') : DIVISION_TEAMS['D'].slice(0, action.rivals)
      // na Série D todos os rivais começam com você — sem "auction-only".
      const { managers: soloManagers, botPlans: soloPlans } = makeCareerManagers(action.teamName || 'Meu Time', action.formation, 'D', soloRivalDefs, [], rng)
      s.managers = soloManagers
      s.youIdx = 0
      // modo Dinastia: mesmo leilão real da carreira, só que o orçamento é o do
      // clube (moedas do Dinastia). A economia assume depois da cerimônia.
      s.dinastia = !!action.dinastia
      s.dinastiaBudget = action.dinastia ? (action.budget ?? 50) : undefined
      if (action.dinastia) { const b = action.budget ?? 50; for (const m of s.managers) m.money = b }
      const soloUsed = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, soloUsed, 1)
      dealBotSquads(s.managers, soloPlans, rng, soloUsed)
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
      s.streamMode = !!action.stream
      s.seed = hashCode(action.roomCode)
      const rng = mulberry(s.seed)
      // a tabela sempre tem 20 times: os que faltam viram bots com elenco
      // pronto (não brigam no leilão — só os humanos disputam as cartas)
      const { managers: onlineManagers, botPlans: onlinePlans } = makeManagers(action.playerNames, action.formation, 0, LEAGUE_SIZE, rng)
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
    case 'SUBMIT_TIEBREAK': {
      if (s.phase !== 'tiebreak') return s
      const tb = s.tiebreaks[s.tiebreakIdx]
      if (!tb || tb.winner !== null) return s
      if (!tb.managers.includes(action.mgrId) || tb.submitted.includes(action.mgrId)) return s
      s.tiebreakPending[action.mgrId] = action.amount
      tb.submitted = [...tb.submitted, action.mgrId]
      maybeResolveTiebreak(s)
      return s
    }
    case 'FORCE_TIEBREAK': {
      if (s.phase !== 'tiebreak') return s
      // reconfirma o prazo: rejeita disparo atrasado/duplicado
      if (!s.phaseDeadline || Date.now() < s.phaseDeadline) return s
      const tb = s.tiebreaks[s.tiebreakIdx]
      if (!tb) return s
      // quem não re-lançou mantém o valor empatado (não cobre)
      for (const id of tb.managers) {
        const m = s.managers.find(x => x.id === id)
        if (m?.isHuman && !tb.submitted.includes(id)) {
          s.tiebreakPending[id] = tb.amount
          tb.submitted = [...tb.submitted, id]
        }
      }
      maybeResolveTiebreak(s)
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
        enterCerimonia(s)
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
        enterCerimonia(s)
      }
      return s
    }
    case 'FINISH_CEREMONY': {
      if (s.screen !== 'cerimonia') return s
      s.cerimoniaDeadline = null
      // rivais "auction-only" já cumpriram o papel no leilão — saem antes da
      // temporada (não jogam a sua liga; seguem a vida própria na pirâmide).
      s.managers = s.managers.filter(m => !m.auctionOnly)
      const adj = cpuAdjFor(s) // nível-base fixo por divisão nos bots de fundo; rivais sem ajuste
      s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
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
      const isHumanId = (id: number) => !!s.managers.find(m => m.id === id && m.isHuman)
      for (let i = 0; i < times && s.round < TOTAL_ROUNDS; i++) {
        const rng = mulberry(s.seed + 5000 + s.round * 37)
        // fotografa posições e gols ANTES pra narrar as viradas
        const prevRank = new Map(sortedTable(s.league).map((t, idx) => [t.id, idx + 1]))
        const prevGoals = new Map(s.scorers.map(sc => [sc.name + ':' + sc.teamId, sc.goals]))
        const results = s.fixtures[s.round].map(([h, a]) => simMatch(s, h, a, rng))
        results.forEach(r => applyResult(s.league, r))
        // rivalidade: só confrontos entre dois humanos contam
        results.forEach(r => { if (isHumanId(r.homeId) && isHumanId(r.awayId)) bumpRivalry(s, r.homeId, r.awayId, r.hg, r.ag) })
        // carreira: retrospecto contra seus rivais fixos que estão na sua divisão
        if (s.careerDivision && s.careerRivals.length > 0) results.forEach(r => bumpCareerH2H(s, r))
        s.lastResults = results
        const heads = narrateRound(s, results, prevRank, prevGoals, s.round + 1)
        s.news = [...heads, ...s.news]
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
    case 'CAREER_ADVANCE': {
      // fim de temporada na carreira: sobe/cai/fica e começa a próxima, já na
      // divisão de destino com o novo elenco de rivais (quem subiu/caiu junto
      // continua; quem se separou sai e entra time da divisão nova).
      if (!s.careerDivision) return s
      const res = resolveCareerEnd(s)
      if (res.wonTitle) s.careerTitles++
      if (res.wonTitle && s.careerDivision === 'A') s.careerTitlesA++ // estrela ⭐
      const you = s.managers[s.youIdx]
      const teamName = you.teamName, formation = you.formation, mySquad = you.squad
      // guarda os elencos dos CPUs por identidade de time (pros rivais que ficam)
      const oldSquads = new Map<string, WonCard[]>()
      for (const m of s.managers) if (!m.isHuman && m.squad.length > 0) oldSquads.set(m.teamName, m.squad)
      s.careerRivals = res.rivals // pirâmide dos rivais avançada (vida própria)
      s.careerDivision = res.nextDiv
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      const { managers, botPlans } = makeCareerManagers(teamName, formation, res.nextDiv, coDivRivalDefs(s.careerRivals, res.nextDiv), action.keep ? [] : otherDivRivalDefs(s.careerRivals, res.nextDiv), rng)
      s.managers = managers
      s.youIdx = 0
      s.monte = []; s.monteOrder = []; s.monteIdx = 0; s.tactics = {}
      s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      if (action.keep) {
        // MESMO TIME: você mantém o elenco; rivais que vieram junto mantêm o
        // deles; rivais novos + preenchimento ganham elenco (sem leilão).
        managers[0].squad = mySquad
        const used = new Set<string>(mySquad.map(c => c.name))
        for (const m of managers) {
          if (m.isHuman) continue
          const kept = oldSquads.get(m.teamName)
          if (kept && kept.length > 0) { m.squad = kept; kept.forEach(c => used.add(c.name)) }
        }
        dealRemainingCpuSquads(s.managers, rng, used)
        const adj = fillerAdj(s.managers, DIVISION_BASE[res.nextDiv]); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
        s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
        s.sectorIdx = 0; s.sectorCursor = 0
        s.league = buildLeague(s.managers)
        s.fixtures = buildFixtures(s.league)
        s.seasonNo++
        s.screen = 'season'
        return s
      }
      // TROCAR TUDO: novo leilão na divisão de destino
      const used = new Set<string>()
      s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
      dealBotSquads(s.managers, botPlans, rng, used)
      for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0
      s.sectorIdx = 0; s.sectorCursor = 0; s.roundIdx = 0
      s.submitted = []; s.pendingEnvelopes = {}
      s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
      s.seasonNo++
      s.screen = 'auction'
      startAuctionPhase(s, false)
      return s
    }
    case 'RESTORE_CAREER': {
      // retoma uma carreira salva, na divisão/temporada/rivais guardados.
      // keep (padrão): vai direto pro campeonato com o elenco salvo (pula o
      // leilão). redraft ("trocar tudo"): abre um novo leilão nesta divisão.
      const sv = action.save
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.roomId = ''; s.roomCode = ''; s.streamMode = false
      s.careerDivision = sv.division; s.careerIntent = false; s.careerTitles = sv.titles; s.careerTitlesA = sv.titlesA ?? 0
      s.seasonNo = sv.seasonNo
      s.careerRivalCount = sv.rivalCount ?? 5
      // rivais salvos (saves antigos: recria na própria divisão como fallback)
      s.careerRivals = (sv.rivals && sv.rivals.length > 0)
        ? sv.rivals
        : DIVISION_TEAMS[sv.division].slice(0, s.careerRivalCount).map(t => ({ team: t.team, name: t.name, division: sv.division, h2h: [0, 0, 0] as [number, number, number], lastPos: null }))
      s.seed = Math.floor(Math.random() * 1e9)
      const rng = mulberry(s.seed)
      const { managers, botPlans } = makeCareerManagers(sv.teamName, sv.formation, sv.division, coDivRivalDefs(s.careerRivals, sv.division), action.redraft ? otherDivRivalDefs(s.careerRivals, sv.division) : [], rng)
      s.managers = managers
      s.youIdx = 0
      s.monte = []; s.monteOrder = []; s.monteIdx = 0; s.tactics = {}
      s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      if (action.redraft) {
        const used = new Set<string>()
        s.deck = buildDeck(auctioningManagers(s.managers), rng, 1.0, used, 1)
        dealBotSquads(s.managers, botPlans, rng, used)
        for (const pos of SECTORS) s.stock[pos] = s.deck[pos].length
        s.cpuAtkAdj = 0; s.cpuDefAdj = 0
        s.sectorIdx = 0; s.sectorCursor = 0; s.roundIdx = 0
        s.submitted = []; s.pendingEnvelopes = {}
        s.tiebreaks = []; s.tiebreakIdx = 0; s.tiebreakPending = {}
        s.screen = 'auction'
        startAuctionPhase(s, false)
        return s
      }
      // MESMO TIME: carrega o elenco salvo e vai direto pro campeonato
      managers[0].squad = sv.squad
      managers[0].formation = sv.formation
      const used = new Set<string>(sv.squad.map(c => c.name))
      dealRemainingCpuSquads(s.managers, rng, used)
      const adj = fillerAdj(s.managers, DIVISION_BASE[sv.division]); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def
      s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
      s.sectorIdx = 0; s.sectorCursor = 0
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.screen = 'season'
      return s
    }
    case 'START_DINASTIA_SEASON': {
      // modo Dinastia (2ª temporada em diante): joga a TEMPORADA REAL (campinho,
      // narração, tabela, artilheiros) contra os times do mundo fixo — sem leilão.
      // Os elencos vêm prontos do mundo; a economia já rolou na janela.
      s.onlineMode = 'cpu'; s.isHost = true; s.humanCount = 1
      s.roomId = ''; s.roomCode = ''; s.streamMode = false
      s.dinastia = true
      s.careerDivision = action.division
      s.seasonNo = action.seasonNo
      s.seed = Math.floor(Math.random() * 1e9)
      const human: Manager = { id: 0, name: action.teamName, teamName: action.teamName, isHuman: true, auctionRival: true, formation: action.formation, money: 0, squad: action.squad, aggression: 0.5, starHunger: 0.5 }
      const forms: FormationKey[] = ['4-3-3', '4-4-2']
      const others: Manager[] = action.others.map((o, i) => ({ id: i + 1, name: o.name, teamName: o.name, isHuman: false, auctionRival: false, formation: forms[i % 2], money: 0, squad: o.squad.map(c => ({ ...c, paid: 0, via: 'bot' as const })), aggression: 0.5, starHunger: 0.5 }))
      s.managers = [human, ...others]
      s.youIdx = 0
      s.cpuAtkAdj = 0; s.cpuDefAdj = 0 // o mundo fixo já é a dificuldade (pirâmide de força)
      s.deck = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
      s.monte = []; s.monteOrder = []; s.monteIdx = 0
      s.sectorIdx = 0; s.sectorCursor = 0; s.sectorUnsoldAccum = []; s.currentCards = []
      s.round = 0; s.scorers = []; s.lastResults = []; s.news = []; s.champion = null
      s.tactics = {}
      s.careerRivals = []; s.careerTitles = 0; s.careerTitlesA = 0
      s.league = buildLeague(s.managers)
      s.fixtures = buildFixtures(s.league)
      s.screen = 'season'
      return s
    }
    case 'REPLAY_SEASON': {
      // "Nova temporada" (mesmo time): mantém TODOS os elencos como estão e
      // só recomeça o campeonato — tabela, calendário e artilharia zerados.
      // Nada de leilão. Disparado pelo host; o resultado já computado vai
      // pros convidados por SYNC_STATE.
      { const adj = cpuAdjFor(s); s.cpuAtkAdj = adj.atk; s.cpuDefAdj = adj.def } // nível-base fixo por divisão; rivais sem ajuste
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

// ─── reações efêmeras (zoeira/blefe) — NÃO fazem parte do estado do jogo ──
// vão por um evento de broadcast à parte ('emote'); não passam pelo reducer
// nem pelo host, então não têm risco nenhum de afetar o resultado do leilão.
export type EmoteEvent = { id: string; from: number; kind: string; cardId?: string; ts: number }

// ─── contexto + provider (host-autoritativo, espelha o modo Draft) ───
const Ctx = createContext<{
  state: EscState
  dispatch: (a: Action) => void
  emote: (kind: string, cardId?: string) => void
  emotes: EmoteEvent[]
  hostStale: boolean // convidado sem notícias do host há muito tempo (host caiu?)
  kickPlayer: (playerIndex: number) => void // host remove um técnico da partida
} | null>(null)

// libera a vaga do técnico na sala (apaga a linha de room_players) e limpa a
// sala salva no aparelho. Chamado quando ele sai de propósito de uma partida
// online — evita virar "fantasma" que trava um restart pros que ficaram.
async function leaveOnlineRoom(roomId: string) {
  try { localStorage.removeItem('escalacao-room') } catch { /* ignora */ }
  try {
    const { data } = await supabase.auth.getUser()
    if (data?.user && roomId) {
      await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', data.user.id)
    }
  } catch { /* silencioso */ }
}

// ─── retomar partida SOLO em andamento (carreira/rápida) ─────────────
// o estado do jogo vive só na memória; se a aba recarrega (ou o navegador
// descarta a página em segundo plano), voltava pro zero (home) e perdia a
// temporada. Salvamos a partida solo em andamento no aparelho e retomamos de
// onde parou. (O online tem seu próprio resume via sala — aqui é só cpu.)
const SOLO_RESUME_KEY = 'esc-solo-inprogress-v1'
const SOLO_GAME_SCREENS = ['auction', 'monte', 'cerimonia', 'season', 'end'] as const
function isSoloGameScreen(screen: string): boolean {
  return (SOLO_GAME_SCREENS as readonly string[]).includes(screen)
}
function loadSoloInProgress(): EscState | null {
  try {
    const raw = localStorage.getItem(SOLO_RESUME_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as EscState
    if (s && s.onlineMode === 'cpu' && isSoloGameScreen(s.screen) && Array.isArray(s.managers) && s.managers.length > 0) return s
  } catch { /* estado inválido/versão antiga — começa do zero */ }
  return null
}

export function EscProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL, init => loadSoloInProgress() ?? init)
  // salva a partida solo em andamento (e limpa quando volta pra home)
  useEffect(() => {
    try {
      if (state.onlineMode === 'cpu' && isSoloGameScreen(state.screen)) localStorage.setItem(SOLO_RESUME_KEY, JSON.stringify(state))
      else if (state.screen === 'intro') localStorage.removeItem(SOLO_RESUME_KEY)
    } catch { /* quota cheia etc. — não trava o jogo */ }
  }, [state])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isHostRef = useRef(state.isHost)
  const onlineRef = useRef(state.onlineMode)
  const stateRef = useRef(state)
  useEffect(() => { isHostRef.current = state.isHost }, [state.isHost])
  useEffect(() => { onlineRef.current = state.onlineMode }, [state.onlineMode])
  useEffect(() => { stateRef.current = state }, [state])

  // "host caiu?": convidado marca quando recebeu a última atualização do host.
  // Sem heartbeat por ~10s, mostra aviso (o host reemite estado a cada 3s).
  const lastHostMsgRef = useRef(Date.now())
  const [hostStale, setHostStale] = useState(false)

  // reações efêmeras: lista viva que some sozinha (~2,6s cada). Fora do reducer.
  const [emotes, setEmotes] = useState<EmoteEvent[]>([])
  const addEmote = useCallback((e: EmoteEvent) => {
    setEmotes(prev => prev.some(x => x.id === e.id) ? prev : [...prev.slice(-24), e])
    setTimeout(() => setEmotes(prev => prev.filter(x => x.id !== e.id)), 2600)
  }, [])
  const emote = useCallback((kind: string, cardId?: string) => {
    const e: EmoteEvent = { id: Math.random().toString(36).slice(2), from: stateRef.current.youIdx, kind, cardId, ts: Date.now() }
    addEmote(e) // mostra o seu na hora (o canal usa self:false e não devolve o próprio)
    channelRef.current?.send({ type: 'broadcast', event: 'emote', payload: e })
  }, [addEmote])

  // host remove um técnico da partida: avisa o cliente dele (evento 'kick', que
  // o ejeta pra fora), a CPU assume o time (KICK_PLAYER) e libera a vaga no
  // banco pra ele não reconectar sozinho na mesma partida.
  const kickPlayer = useCallback((playerIndex: number) => {
    if (!isHostRef.current || playerIndex === stateRef.current.youIdx) return
    channelRef.current?.send({ type: 'broadcast', event: 'kick', payload: { playerIndex } })
    rawDispatch({ type: 'KICK_PLAYER', playerIndex })
    const rid = stateRef.current.roomId
    if (rid) { supabase.from('room_players').delete().eq('room_id', rid).eq('player_index', playerIndex).then(() => {}) }
  }, [])

  // convidado roteia ações pro host; host aplica local
  const dispatch = useCallback((action: Action) => {
    // Sair de uma partida online (NOVO PREGÃO / voltar pra home) deve LIBERAR
    // sua vaga na sala. Sem isso você fica "fantasma": um restart puxa você como
    // jogador e a galera que ficou espera você lacrar pra sempre.
    if ((action.type === 'NEW_GAME' || action.type === 'GO_LOBBY') && onlineRef.current === 'online' && stateRef.current.roomId) {
      leaveOnlineRoom(stateRef.current.roomId)
    }
    if (onlineRef.current === 'online' && !isHostRef.current && action.type !== 'GO_LOBBY' && action.type !== 'NEW_GAME' && action.type !== 'GO_ALBUM' && action.type !== 'GO_RANKING') {
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
      ch.on('broadcast', { event: 'state' }, ({ payload }: { payload: EscState }) => {
        lastHostMsgRef.current = Date.now() // notícia fresca do host
        rawDispatch({ type: 'SYNC_STATE', newState: payload })
      })
    }
    // reações chegam pra todos (host e convidados), fora do fluxo de ações
    ch.on('broadcast', { event: 'emote' }, ({ payload }: { payload: EmoteEvent }) => addEmote(payload))
    // host removeu alguém: se for EU, saio da partida (libera vaga + volta pra home)
    ch.on('broadcast', { event: 'kick' }, ({ payload }: { payload: { playerIndex: number } }) => {
      if (payload.playerIndex !== stateRef.current.youIdx) return
      try { alert('O host removeu você desta partida.') } catch { /* ignora */ }
      dispatch({ type: 'GO_LOBBY' })
    })
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

  // Cronômetro da cerimônia: quando os 45s pra olhar os times acabam, começa
  // o campeonato sozinho. Vale solo e online; no online qualquer cliente pode
  // disparar (o guest roteia pro host) e o reducer reconfirma a tela.
  useEffect(() => {
    if (state.screen !== 'cerimonia' || !state.cerimoniaDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FINISH_CEREMONY' }), Math.max(0, state.cerimoniaDeadline - Date.now()) + 200)
    return () => clearTimeout(t)
  }, [state.screen, state.cerimoniaDeadline, dispatch])

  // Vigia do leilão: mesmo princípio — qualquer cliente conectado pode forçar
  // o selamento quando o prazo do envelope estoura, não só o host.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.phase !== 'envelope' && state.phase !== 'resq_envelope') return
    if (!state.phaseDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FORCE_SEAL' }), Math.max(0, state.phaseDeadline - Date.now()) + 800)
    return () => clearTimeout(t)
  }, [state.phaseDeadline, state.phase, state.onlineMode, dispatch])

  // Vigia do desempate: se um dos empatados sumir (AFK), o prazo estoura e
  // qualquer cliente força a resolução — quem não re-lançou não cobre.
  useEffect(() => {
    if (state.onlineMode !== 'online') return
    if (state.phase !== 'tiebreak' || !state.phaseDeadline) return
    const t = setTimeout(() => dispatch({ type: 'FORCE_TIEBREAK' }), Math.max(0, state.phaseDeadline - Date.now()) + 800)
    return () => clearTimeout(t)
  }, [state.phaseDeadline, state.phase, state.tiebreakIdx, state.onlineMode, dispatch])

  // convidado vigia o host: sem estado recebido há >10s durante o jogo, acende
  // o aviso "host caiu" e segue pedindo o estado — se o host voltar, ressincroniza.
  useEffect(() => {
    if (state.onlineMode !== 'online' || state.isHost || !state.roomId) { setHostStale(false); return }
    if (state.screen === 'intro' || state.screen === 'lobby') { setHostStale(false); return }
    lastHostMsgRef.current = Date.now() // zera ao (re)entrar nessa vigília
    const iv = setInterval(() => {
      const stale = Date.now() - lastHostMsgRef.current > 10_000
      setHostStale(stale)
      if (stale) channelRef.current?.send({ type: 'broadcast', event: 'request_state', payload: {} })
    }, 2500)
    return () => clearInterval(iv)
  }, [state.onlineMode, state.isHost, state.roomId, state.screen])

  // host persiste no banco a cada 3s — em INTERVALO FIXO (não debounce). Antes
  // era um setTimeout que zerava a cada mudança de estado; durante a simulação
  // rápida da temporada (uma rodada a cada ~1s) o timer nunca disparava e o
  // estado NUNCA era salvo. Resultado: reconectar não achava a partida e
  // recomeçava o jogo do zero, quebrando a sala. Com intervalo fixo lendo o
  // stateRef, sempre há um snapshot recente pra retomar.
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.isHost || !state.roomId) return
    const save = () => {
      const st = stateRef.current
      if (st.screen === 'intro' || st.screen === 'lobby' || !st.roomId) return
      // sanitize devolve só o EscState — precisamos REPOR o marcador __game
      // (senão as checagens de "é sala da Escalação?" quebram no reconnect) e
      // a formação (usada como fallback). IMPORTANTE: .then() aqui não é
      // enredo — sem ele o supabase-js NÃO dispara a requisição (query é
      // preguiçosa), e era por isso que o estado nunca era salvo de verdade.
      const payload = { ...sanitize(st), __game: 'escalacao', formation: st.managers.find(m => m.isHuman)?.formation ?? '4-3-3', ...(st.streamMode ? { stream: true } : {}) }
      supabase.from('game_rooms').update({ game_state: payload }).eq('id', st.roomId).then(() => {}, () => {})
    }
    save() // salva JÁ ao entrar no jogo (fecha a janela dos 3s do 1º save)
    const iv = setInterval(save, 3000)
    return () => { save(); clearInterval(iv) }
  }, [state.onlineMode, state.isHost, state.roomId])

  // ─── analytics: registra cada partida e mantém o "ao vivo" ───
  // uma partida = entrar no leilão (vale solo e online; cada humano registra a
  // sua, então online conta N pessoas). Jogadores anônimos também entram.
  const prevScreenRef = useRef(state.screen)
  useEffect(() => {
    const prev = prevScreenRef.current
    prevScreenRef.current = state.screen
    if (state.screen === 'auction' && prev !== 'auction') {
      const st = stateRef.current
      logPlay(st.onlineMode, st.managers[st.youIdx]?.teamName)
    }
  }, [state.screen])

  // registra 1 visita ao abrir o site (jogando ou não)
  useEffect(() => { logVisit() }, [])

  // heartbeat "estou no site agora" a cada 30s — em QUALQUER tela (a home
  // conta como "ao vivo no site"; as telas de jogo contam como "jogando").
  useEffect(() => {
    const beat = () => {
      const st = stateRef.current
      // modo pro "ao vivo": distingue carreira da partida rápida (ambas são
      // cpu por baixo). online continua online; carreira vira 'career'.
      const liveMode = st.onlineMode === 'online' ? 'online' : st.careerDivision ? 'career' : 'cpu'
      const career = st.careerDivision ? { season: st.seasonNo, division: st.careerDivision } : undefined
      heartbeat(liveMode, st.managers[st.youIdx]?.teamName, st.screen, career)
    }
    beat()
    const iv = setInterval(beat, 30_000)
    return () => clearInterval(iv)
  }, [state.screen, state.onlineMode, state.careerDivision])

  const showHostBanner = state.onlineMode === 'online' && !state.isHost && hostStale
    && state.screen !== 'intro' && state.screen !== 'lobby'
  return (
    <Ctx.Provider value={{ state, dispatch, emote, emotes, hostStale, kickPlayer }}>
      {children}
      {showHostBanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
          background: '#E8503A', color: '#fff', textAlign: 'center',
          padding: '8px 12px', fontWeight: 800, fontSize: 13,
          fontFamily: 'Oswald, sans-serif', borderBottom: '3px solid #0C0C0C',
        }}>
          ⏳ O host caiu ou está sem conexão — tentando reconectar…
        </div>
      )}
    </Ctx.Provider>
  )
}

// mantém o leilão cego: convidados nunca recebem os envelopes pendentes,
// só quem já lacrou (contador) — os valores só aparecem na revelação.
function sanitize(state: EscState): EscState {
  return { ...state, pendingEnvelopes: {}, tiebreakPending: {} }
}

export function useEsc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEsc fora do EscProvider')
  return ctx
}

export type { Action as EscAction }
