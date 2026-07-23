// ─── CARREIRA ONLINE · TEMPORADA SIMULADA (as 4 divisões) ────────────────
// Depois do LEILÃO REAL, a temporada roda SIMULADA a partir dos elencos de
// verdade (mesmo motor da Dinastia, aqui auto-contido). Tudo é DETERMINÍSTICO
// pela semente da sala + a rodada atual (state.round, que já sincroniza pelo
// host), então todos os aparelhos veem a MESMA tabela sem mandar resultado por
// resultado. A Série D tem os humanos com os times montados no pregão; A/B/C são
// preenchidas pelo resto do baralho, distribuído por força (A a mais forte).

import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, CATALOG_EU, CATALOG_BOTH, DIVISION_TEAMS, oldChain } from './data'
import type { Card, Manager, Sector, WonCard } from './types'
import { SECTORS, FORMATIONS } from './types'
import { useEsc, savePyramidCloud } from './store'
import { CardCollectPrompt, ApoieButton, useSimMode, SimControls } from './screens'
import { SeasonJornal, shareElenco } from './jornal'
import type { ElencoPlayerRow } from './jornal'
import { StadiumTab, StadiumSvg } from './estadio'
import { supabase } from '../lib/supabase'
import { resilientWrite } from './pending'
import { myApoioPerk, apoioSelo, apoioName, apoioText, ApoioSheen, ApoioPreviewMark, APOIO_PERKS, stripEmoji } from './apoio'
import type { ApoioPerk } from './apoio'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type Div = 'A' | 'B' | 'C' | 'D'
export const DIVS: Div[] = ['A', 'B', 'C', 'D']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_TAG: Record<Div, { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' } }
// força-base por divisão dos times de CPU NATIVOS (não humano, não rival). Só um
// EMPURRÃO leve (não paridade!) pra os nativos das séries de baixo não serem
// atropelados de goleada — o NÍVEL/lenda continua mandando (time forte lidera). A
// zebra/variação fica por conta do "dia" (MATCH_LUCK). Tunável.
const CPU_DIV_BOOST: Record<Div, number> = { A: 6, B: 9, C: 12, D: 2 }

// ── motor de simulação por elenco (espelha o da Dinastia) ──
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
type PoolCard = Card
const mid = (c: PoolCard) => (c.lo + c.hi) / 2
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(l: number, rng: () => number): number { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
function sectorPow(rolls: number[]): number { if (rolls.length === 0) return 40; const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length; const min = Math.min(...rolls); return avg - (avg - min) * 0.35 }
function shuffle<T>(arr: T[], rng: () => number): T[] { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Meia-Boca']
// fillers de várzea: nível bem baixo (abaixo de semi-pro) — perna-de-pau mesmo,
// pra não brigarem na artilharia com os craques de verdade.
function filler(pos: Sector, rng: () => number): PoolCard { const lo = 30 + Math.floor(rng() * 6); return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 6 + Math.floor(rng() * 4) } }
type Tac = 'retranca' | 'equilibrio' | 'ataque'
const TACS: Tac[] = ['retranca', 'equilibrio', 'ataque']
function rollForm(squad: PoolCard[], tac: Tac, _opp: Tac, rng: () => number) {
  const rolls = squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  const by = (p: Sector) => sectorPow(rolls.filter(r => r.c.pos === p).map(r => r.lvl))
  const gol = by('GOL'), lat = by('LAT'), zag = by('ZAG'), mei = by('MEI'), ata = by('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tac === 'retranca') { def += 4; atk -= 3 } if (tac === 'ataque') { atk += 4; def -= 3 } if (tac === 'equilibrio') { atk += 1; def += 1 }
  return { atk, def }
}
function bestXI(squad: PoolCard[]): PoolCard[] {
  const out: PoolCard[] = []
  for (const p of SECTORS) { const cands = squad.filter(c => c.pos === p).sort((a, b) => mid(b) - mid(a)); for (let i = 0; i < NEED[p] && i < cands.length; i++) out.push(cands[i]) }
  return out
}
function dealSquads(bucket: PoolCard[], nTeams: number, rng: () => number): PoolCard[][] {
  const squads: PoolCard[][] = Array.from({ length: nTeams }, () => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of bucket) byPos[c.pos].push(c)
  for (const p of SECTORS) { const list = shuffle(byPos[p], rng); for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < nTeams; t++) squads[t].push(list.shift() ?? filler(p, rng)) }
  return squads
}
function roundRobin(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i), rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)], right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}

export interface SimTeam { name: string; you: boolean; human: boolean; rival?: boolean; backstop?: boolean; teamId: number; squad: PoolCard[]; xi: PoolCard[]; pts: number; w: number; d: number; l: number; gf: number; ga: number }
export interface SeasonScorer { name: string; teamName: string; teamId: number; div: Div; goals: number; you: boolean; human: boolean; rival?: boolean; cardId?: string }

function pickCatalog(deck: 'br' | 'eu' | 'both') { return deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG }

// elencos determinísticos dos 60 times de CPU (A/B/C), por NOME — estável entre
// temporadas: quando um time sobe/desce, leva o mesmo elenco (chave = nome).
function buildCpuSquads(managers: Manager[], seed: number, deck: 'br' | 'eu' | 'both'): Map<string, PoolCard[]> {
  const rng = mulberry((seed ^ 0x9E3779B1) >>> 0)
  // dedup por AUGE (nome+clube+ano): auges diferentes do mesmo nome (Vini Flamengo
  // x Real) são jogadores distintos — cabem os dois, mais cartas pra encher os times.
  const idOf = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
  const used = new Set<string>()
  for (const m of managers) for (const c of m.squad) used.add(idOf(c))
  const cat = pickCatalog(deck)
  const pool: PoolCard[] = (Object.keys(cat) as Sector[]).flatMap(pos => cat[pos].map((c, i) => ({ ...c, pos, id: `${pos}-${i}` })))
  const rest = shuffle(pool.filter(c => !used.has(idOf(c))), rng).sort((a, b) => mid(b) - mid(a))
  const q = Math.ceil(rest.length / 3)
  const bucket: Record<'A' | 'B' | 'C', PoolCard[]> = { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2) }
  const map = new Map<string, PoolCard[]>()
  for (const d of ['A', 'B', 'C'] as const) {
    const names = DIVISION_TEAMS[d].map(t => t.team).slice(0, 20)
    const dealt = dealSquads(bucket[d], 20, rng)
    names.forEach((nm, i) => map.set(nm, dealt[i]))
  }
  return map
}
// divisão de origem de um time de CPU (temporada 1) — usada como fallback
const cpuOrigDiv = (name: string): Div => DIVISION_TEAMS.A.some(t => t.team === name) ? 'A' : DIVISION_TEAMS.B.some(t => t.team === name) ? 'B' : 'C'
// chave estável de um time: técnico = m<id>; CPU = nome
export const teamKey = (t: { teamId: number; name: string }) => t.teamId >= 0 ? `m${t.teamId}` : t.name

// monta as 4 divisões pela COLOCAÇÃO guardada (placements): D começa com os
// técnicos reais; a cada temporada os times sobem/descem por nome exato.
export function buildPyramid(managers: Manager[], youId: number, seed: number, deck: 'br' | 'eu' | 'both', placements?: Record<string, string> | null, cpuSquads?: Record<string, Card[]>): Record<Div, SimTeam[]> {
  const mk = (name: string, squad: PoolCard[], human: boolean, you: boolean, teamId: number, backstop = false, rival = false): SimTeam => ({ name, you, human, rival, backstop, teamId, squad, xi: bestXI(squad), pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
  const world: Record<Div, SimTeam[]> = { A: [], B: [], C: [], D: [] }
  const divOf = (key: string, fallback: Div): Div => { const d = placements?.[key]; return (d === 'A' || d === 'B' || d === 'C' || d === 'D') ? d : fallback }
  for (const m of managers.slice(0, 20)) {
    const t = mk(m.teamName, (m.squad as WonCard[]).map(c => ({ ...c })), m.isHuman, m.id === youId, m.id, !!m.backstop, !!m.rival)
    world[divOf(`m${m.id}`, 'D')].push(t)
  }
  const cpu = buildCpuSquads(managers, seed, deck)
  // usa a FICHA salva do time de fundo se existir (memória de mercado); senão, a
  // receita determinística (base). Assim vender/comprar cola entre temporadas.
  // Times RENOMEADOS: se o save antigo guardou colocação/ficha no nome VELHO,
  // lê por ele — o time mantém a divisão que conquistou e o elenco que tinha.
  for (const [name, base] of cpu) {
    const olds = oldChain(name)
    const plKey = placements?.[name] != null ? name : (olds.find(o => placements?.[o] != null) ?? name)
    const squad = cpuSquads?.[name] ?? olds.map(o => cpuSquads?.[o]).find(Boolean) ?? base
    world[divOf(plKey, cpuOrigDiv(name))].push(mk(name, squad as PoolCard[], false, false, -1))
  }
  // REDE DE SEGURANÇA: cada série precisa de EXATAMENTE 20 times. Save fora do
  // padrão (qualquer causa) desequilibrava (19/21) e derrubava a simulação
  // inteira. Sobras saem do fim da série cheia (nunca humano) e completam a
  // série vazia — determinístico, então online continua sincronizado.
  const over: SimTeam[] = []
  for (const d of DIVS) {
    while (world[d].length > 20) {
      let i = world[d].length - 1
      while (i > 0 && world[d][i].human) i--
      over.push(world[d].splice(i, 1)[0])
    }
  }
  for (const d of DIVS) while (world[d].length < 20 && over.length) world[d].push(over.pop()!)
  return world
}
// semeia a ficha dos 60 times de fundo a partir da receita (base determinística)
// — materializa 1x os elencos que antes eram só calculados na hora.
export function seedCpuSquads(managers: Manager[], seed: number, deck: 'br' | 'eu' | 'both'): Record<string, Card[]> {
  const out: Record<string, Card[]> = {}
  for (const [name, squad] of buildCpuSquads(managers, seed, deck)) out[name] = squad
  return out
}

// acessos/quedas por NOME EXATO: top 4 sobe, últimos 4 caem, entre divisões
// vizinhas. Devolve a nova colocação (chave do time → divisão).
export function computePromotions(tables: Record<Div, SimTeam[]>): Record<string, string> {
  const pl: Record<string, string> = {}
  for (const d of DIVS) for (const t of tables[d]) pl[teamKey(t)] = d
  for (let i = 0; i < 3; i++) {
    const U = DIVS[i], L = DIVS[i + 1] // U = de cima, L = de baixo
    for (const t of tables[U].slice(-4)) pl[teamKey(t)] = L // caem
    for (const t of tables[L].slice(0, 4)) pl[teamKey(t)] = U // sobem
  }
  return pl
}

// moedas da temporada por técnico — SEM base recorrente (o técnico já começou
// com 100). Só desempenho, com valores DIFERENTES por série:
//   campeão: A 25 · B 20 · C 15 · D 10
//   top 4 (zona): A 20 · B 15 · C 10 · D 5 — nas de baixo é acesso (sobe); na A é
//     "manter entre os 4" (não tem pra onde subir). Campeão da A = 25 + 20 = 45.
//   queda (caiu, pela série de onde caiu): A 20 · B 15 · C 10 · D 5
const DIV_RANK: Record<Div, number> = { A: 3, B: 2, C: 1, D: 0 }
const CAMPEAO: Record<Div, number> = { A: 25, B: 20, C: 15, D: 10 }
const ZONA: Record<Div, number> = { A: 20, B: 15, C: 10, D: 5 }
const QUEDA: Record<Div, number> = { A: 20, B: 15, C: 10, D: 5 }
export function seasonRewards(tables: Record<Div, SimTeam[]>): Record<number, number> {
  const newPl = computePromotions(tables)
  const out: Record<number, number> = {}
  for (const d of DIVS) tables[d].forEach((t, i) => {
    if (!t.human || t.teamId < 0) return // só humanos têm careerCoins; os bots ficam no clubCash
    let delta = 0
    if (i === 0) delta += CAMPEAO[d] // campeão da divisão
    if (i < 4) delta += ZONA[d] // top 4: acesso nas de baixo, "manter entre os 4" na A
    const nd = newPl[teamKey(t)] as Div | undefined
    if (nd && DIV_RANK[nd] < DIV_RANK[d]) delta -= QUEDA[d] // queda (caiu da série d)
    out[t.teamId] = delta
  })
  return out
}
// caixa-base por divisão (clubes de cima mais ricos) + os lucros das vendas do
// mercado + prêmios. Também usado pra "curar" salas sem caixa.
export const DIV_BASE_CASH: Record<Div, number> = { A: 250, B: 200, C: 150, D: 100 }
// prêmios da temporada pros OUTROS times (CPUs + reservas de fundo, tudo que não
// é humano nem bot fiador) — mesmo cálculo do seasonRewards, mas por teamKey (o
// CPU não tem id numérico). Alimenta o caixa deles pra aparecer real no ranking.
export function clubRewards(tables: Record<Div, SimTeam[]>): Record<string, number> {
  const newPl = computePromotions(tables)
  const out: Record<string, number> = {}
  for (const d of DIVS) tables[d].forEach((t, i) => {
    if (t.human) return // humano tem caixa em careerCoins; todo bot fica no clubCash
    let delta = 0
    if (i === 0) delta += CAMPEAO[d]
    if (i < 4) delta += ZONA[d]
    const nd = newPl[teamKey(t)] as Div | undefined
    if (nd && DIV_RANK[nd] < DIV_RANK[d]) delta -= QUEDA[d]
    out[teamKey(t)] = delta
  })
  return out
}
// campeão de cada divisão nesta temporada (chave do time → divisão) — pro ranking
export function seasonChampions(tables: Record<Div, SimTeam[]>): Record<string, Div> {
  const out: Record<string, Div> = {}
  for (const d of DIVS) if (tables[d][0]) out[teamKey(tables[d][0])] = d
  return out
}

export interface Goal { name: string; min: number; home: boolean }
export interface SimMatch { h: string; a: string; hg: number; ag: number; hId: number; aId: number; you: boolean; hum: boolean; goals: Goal[] }

// joga UMA divisão até a rodada `round` (determinístico), acumulando artilharia.
// `lastMatches` recebe os jogos da ÚLTIMA rodada jogada (placar + quem fez os
// gols e em que minuto) pra exibir com a simulação.
// tática de um humano é POR JOGO: `tactics[teamId]` é um mapa rodada→tática; numa
// rodada r vale a última tática escolhida numa rodada <= r (senão equilíbrio).
export type RoundTactics = Record<number, Record<number, Tac>>
function tacAt(tactics: RoundTactics, teamId: number, r: number): Tac {
  const byRound = tactics[teamId]; if (!byRound) return 'equilibrio'
  let best: Tac = 'equilibrio', bestK = -1
  for (const k in byRound) { const kn = +k; if (kn <= r && kn > bestK) { bestK = kn; best = byRound[kn] } }
  return best
}
// escalação (XI) de um humano é POR JOGO, igual à tática: `lineups[teamId]` é um
// mapa rodada→ids; na rodada r vale a última escolha numa rodada <= r. Se não há
// escolha (ou a escalação não tem 11 válidos), cai pro bestXI automático.
export type RoundLineups = Record<number, Record<number, string[]>>
function lineupAt(lineups: RoundLineups, teamId: number, r: number, squad: PoolCard[]): PoolCard[] {
  const byRound = lineups[teamId]
  let bestK = -1, ids: string[] | null = null
  if (byRound) for (const k in byRound) { const kn = +k; if (kn <= r && kn > bestK) { bestK = kn; ids = byRound[kn] } }
  if (!ids) return bestXI(squad)
  const map = new Map(squad.map(c => [c.id, c]))
  const xi = ids.map(id => map.get(id)).filter((c): c is PoolCard => !!c)
  if (xi.length === 11) return xi
  // PARCIAL: se um titular saiu (vendido), mantém os que ficaram e completa SÓ
  // aquela vaga com o melhor do banco na posição — não remonta o time inteiro
  // (evita o auto-mudar titular que o usuário não pediu).
  const used = new Set(xi.map(c => c.id))
  for (const p of SECTORS) {
    let need = NEED[p] - xi.filter(c => c.pos === p).length
    if (need <= 0) continue
    const bench = squad.filter(c => c.pos === p && !used.has(c.id)).sort((a, b) => mid(b) - mid(a))
    for (const c of bench) { if (need <= 0) break; xi.push(c); used.add(c.id); need-- }
  }
  return xi.length === 11 ? xi : bestXI(squad)
}
function simDivTo(teams: SimTeam[], div: Div, seed: number, round: number, scorers: Map<string, SeasonScorer>, tactics: RoundTactics, lineups: RoundLineups, lastMatches?: SimMatch[], capElite = 1.2) {
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const fix = roundRobin(20)
  // credita os gols na artilharia da temporada e devolve os eventos (nome + minuto)
  // peso de artilharia por NÍVEL: um filler (nível ~40) quase não marca; um craque
  // (nível ~85) leva a maioria. Antes era só por posição — por isso Bola Murcha e
  // Trapalhão viravam artilheiros. n²: acentua a diferença entre perna-de-pau e craque.
  const goalW = (c: PoolCard) => { const n = Math.max(0, (mid(c) - 40) / 42); return 0.12 + n * n * 1.8 }
  const scoreGoals = (t: SimTeam, xi: PoolCard[], goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    // "DIA" do jogador (por partida): 0,4×–2,6× no peso do gol — o folclórico
    // iluminado rouba a cena hoje; na média da temporada o nível manda.
    const day = new Map<string, number>()
    for (const c of xi) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      const pool = xi.map(c => ({ c, w: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05) * goalW(c) * (day.get(c.id) ?? 1) }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: t.name, teamId: t.teamId, div, goals: 1, you: t.you, human: t.human, rival: t.rival, cardId: pick.id })
      const min = rng() < 0.08 ? 90 + 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 90) // acréscimos SÓ até 90+3 (o relógio do card vai até 93)
      evs.push({ name: pick.name, min })
    }
    return evs
  }
  const nr = Math.min(round, 38)
  for (let r = 0; r < nr; r++) for (const [hi, ai] of fix[r]) {
    const H = teams[hi], A = teams[ai]
    if (!H || !A) continue // série fora do padrão (save antigo) — nunca derruba o jogo
    // humano usa a tática que ELE escolheu (sincronizada); CPU sorteia
    const th: Tac = H.human ? tacAt(tactics, H.teamId, r) : TACS[Math.floor(rng() * 3)]
    const ta: Tac = A.human ? tacAt(tactics, A.teamId, r) : TACS[Math.floor(rng() * 3)]
    // XI daquele jogo: humano usa a escalação que ELE montou (por rodada); CPU o fixo
    const hxi = H.human ? lineupAt(lineups, H.teamId, r, H.squad) : H.xi
    const axi = A.human ? lineupAt(lineups, A.teamId, r, A.squad) : A.xi
    const fh = rollForm(hxi, th, ta, rng), fa = rollForm(axi, ta, th, rng)
    // times de CPU NATIVOS ganham a força-base da divisão (pra as séries serem
    // disputadas de verdade). Humano e rivais escolhidos NÃO ganham (jogam com o
    // elenco real que montaram).
    const bh = (!H.human && !H.rival) ? CPU_DIV_BOOST[div] : 0, ba = (!A.human && !A.rival) ? CPU_DIV_BOOST[div] : 0
    fh.atk += bh; fh.def += bh; fa.atk += ba; fa.def += ba
    // SORTE: cada time tem um "dia" (bom/ruim) por jogo — o forte às vezes tropeça,
    // o fraco às vezes surpreende. NÍVEL segue mandando (na média o melhor ganha),
    // mas evita goleada de campeonato (líder com 104 pts) e dá zebra de vez em quando.
    const lkH = 0.85 + rng() * 0.30, lkA = 0.85 + rng() * 0.30
    fh.atk *= lkH; fh.def *= lkH; fa.atk *= lkA; fa.def *= lkA
    // qualidade ABSOLUTA do ataque escala os gols: time fraco (cheio de filler)
    // marca menos no geral — não só a diferença atk-def conta. Assim as divisões
    // de baixo (várzea) não inflam a artilharia com nomes de brincadeira.
    const qual = (atk: number) => Math.max(0.5, Math.min(capElite, atk / 66))
    const lh = Math.max(0.08, (1.35 + (fh.atk - fa.def) * 0.055 + 0.25) * qual(fh.atk)), la = Math.max(0.08, (1.35 + (fa.atk - fh.def) * 0.055) * qual(fa.atk))
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    const hev = scoreGoals(H, hxi, hg), aev = scoreGoals(A, axi, ag)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
    if (lastMatches && r === nr - 1) {
      const goals: Goal[] = [...hev.map(e => ({ ...e, home: true })), ...aev.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      lastMatches.push({ h: H.name, a: A.name, hg, ag, hId: H.teamId, aId: A.teamId, you: !!(H.you || A.you), hum: !!(H.human || A.human), goals })
    }
  }
}
export function sortDiv(teams: SimTeam[]) { return teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf) }

// simula as 4 divisões até a rodada atual — resultado idêntico em todos os aparelhos
export function simulatePyramid(world: Record<Div, SimTeam[]>, seed: number, round: number, tactics: RoundTactics = {}, lineups: RoundLineups = {}, capElite = 1.2): { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[]; scorersAll: SeasonScorer[]; matches: Record<Div, SimMatch[]>; goalsByCard: Record<string, number>; divTop: Record<Div, SeasonScorer | undefined> } {
  const scorers = new Map<string, SeasonScorer>()
  const tables = {} as Record<Div, SimTeam[]>
  const matches = {} as Record<Div, SimMatch[]>
  for (const d of DIVS) {
    const teams = world[d].map(t => ({ ...t, xi: t.xi, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }))
    const lm: SimMatch[] = []
    simDivTo(teams, d, (seed ^ (d.charCodeAt(0) * 2654435761)) >>> 0, round, scorers, tactics, lineups, lm, capElite)
    tables[d] = sortDiv(teams)
    matches[d] = lm
  }
  // gols por carta (todos os jogadores) — pra mostrar gols no Elenco
  const goalsByCard: Record<string, number> = {}
  for (const s of scorers.values()) if (s.cardId) goalsByCard[s.cardId] = s.goals
  // ARTILHEIRO de cada divisão (o #1 em gols) — pra premiar time + subir piso
  const divTop = {} as Record<Div, SeasonScorer | undefined>
  for (const s of scorers.values()) if (s.goals > 0 && (!divTop[s.div] || s.goals > divTop[s.div]!.goals)) divTop[s.div] = s
  const sorted = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  return { tables, scorers: sorted.slice(0, 20), scorersAll: sorted, matches, goalsByCard, divTop }
}
// prêmio do artilheiro por divisão: dinheiro pro TIME + o mesmo tanto no PISO do
// jogador. D 4 · C 8 · B 12 · A 16. Vale offline/online, rival/bot/humano.
const DIV_SCORER_BONUS: Record<Div, number> = { A: 16, B: 12, C: 8, D: 4 }
export function scorerRewards(divTop: Record<Div, SeasonScorer | undefined>): { rewards: Record<number, number>; clubRewards: Record<string, number>; values: Record<string, number> } {
  const rewards: Record<number, number> = {}, clubRewards: Record<string, number> = {}, values: Record<string, number> = {}
  for (const d of DIVS) {
    const s = divTop[d]; if (!s) continue
    const b = DIV_SCORER_BONUS[d]
    values[s.name] = (values[s.name] ?? 0) + b // sobe o piso do jogador
    if (s.human) rewards[s.teamId] = (rewards[s.teamId] ?? 0) + b // caixa do humano
    else { const key = s.teamId >= 0 ? `m${s.teamId}` : s.teamName; clubRewards[key] = (clubRewards[key] ?? 0) + b } // caixa do bot/rival
  }
  return { rewards, clubRewards, values }
}

// ── COPA LEGENDS: mata-mata dos 16 (top-4 de cada divisão), sorteio aleatório,
// ida e volta, final única, pênaltis no empate. Determinística (semente +
// temporada + classificação), então bate igual offline e em todos os clientes
// online. Reaproveita a MESMA simulação de jogo da liga (rollForm/poisson). ──
export interface CopaTie { a: SimTeam; b: SimTeam; aDiv: Div; bDiv: Div; aggA: number; aggB: number; pens?: [number, number]; win: 'a' | 'b'; goals: Goal[]; legs: [number, number][]; legGoals: Goal[][] }
export interface CopaRound { name: string; ties: CopaTie[] }
export interface CopaResult { rounds: CopaRound[]; champion: SimTeam | null; championDiv: Div | null; vice: SimTeam | null; viceDiv: Div | null; scorers: SeasonScorer[]; topScorer?: SeasonScorer }
const COPA_CHAMP_COINS = 25 // igual ao campeão da Série A
const COPA_VICE_COINS = 15 // vice-campeão (10 a menos que o campeão)
const COPA_SCORER_BONUS = 16 // igual à artilharia da Série A (caixa do time + piso)
// prestígio por divisão na Copa: A favorita, D azarão (soma no ataque e defesa).
const COPA_DIV_STRENGTH: Record<Div, number> = { A: 10, B: 6, C: 3, D: 0 }

export function computeCopa(tables: Record<Div, SimTeam[]>, seed: number, seasonNo: number, capElite = 1.2): CopaResult {
  const rng = mulberry((seed ^ (seasonNo * 0x9E3779B1) ^ 0xC0FA5EED) >>> 0)
  let field: { t: SimTeam; div: Div }[] = []
  for (const d of DIVS) for (const t of (tables[d] ?? []).slice(0, 4)) field.push({ t, div: d })
  if (field.length < 2) return { rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }
  field = shuffle(field, rng)
  const scorers = new Map<string, SeasonScorer>()
  const goalW = (c: PoolCard) => { const n = Math.max(0, (mid(c) - 40) / 42); return 0.12 + n * n * 1.8 }
  const credit = (e: { t: SimTeam; div: Div }, xi: PoolCard[], goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    // "dia" do jogador também na Copa (por jogo)
    const day = new Map<string, number>()
    for (const c of xi) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      const pool = xi.map(c => ({ c, w: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05) * goalW(c) * (day.get(c.id) ?? 1) }))
      const total = pool.reduce((s, p) => s + p.w, 0); let r = rng() * total, pick = pool[0]?.c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      if (!pick) continue
      const key = `${e.t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: e.t.name, teamId: e.t.teamId, div: e.div, goals: 1, you: e.t.you, human: e.t.human, rival: e.t.rival, cardId: pick.id })
      evs.push({ name: pick.name, min: 1 + Math.floor(rng() * 90) })
    }
    return evs
  }
  const leg = (H: { t: SimTeam; div: Div }, A: { t: SimTeam; div: Div }, homeAdv: boolean) => {
    const th = TACS[Math.floor(rng() * 3)], ta = TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.t.xi, th, ta, rng), fa = rollForm(A.t.xi, ta, th, rng)
    // na Copa (cruzando divisões) a força vem do ELENCO + um gradiente de prestígio
    // por divisão (A mais forte, D o azarão) — NÃO o boost da liga (que é
    // compensação de filler dentro da série e até favorece a C). Assim a Série A é
    // favorita e o time de baixo é o Davi: dá zebra na sorte, mas não é moeda.
    const bh = COPA_DIV_STRENGTH[H.div], ba = COPA_DIV_STRENGTH[A.div]
    fh.atk += bh; fh.def += bh; fa.atk += ba; fa.def += ba
    const lkH = 0.85 + rng() * 0.30, lkA = 0.85 + rng() * 0.30
    fh.atk *= lkH; fh.def *= lkH; fa.atk *= lkA; fa.def *= lkA
    const qual = (atk: number) => Math.max(0.5, Math.min(capElite, atk / 66))
    const lh = Math.max(0.08, (1.35 + (fh.atk - fa.def) * 0.055 + (homeAdv ? 0.25 : 0)) * qual(fh.atk))
    const la = Math.max(0.08, (1.35 + (fa.atk - fh.def) * 0.055) * qual(fa.atk))
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    return { hg, ag, hEvs: credit(H, H.t.xi, hg), aEvs: credit(A, A.t.xi, ag) }
  }
  const playTie = (a: { t: SimTeam; div: Div }, b: { t: SimTeam; div: Div }, single: boolean): CopaTie => {
    let aggA = 0, aggB = 0
    const goals: Goal[] = []
    const legs: [number, number][] = [] // placar de cada jogo (ida, volta) — [gols A, gols B]
    const legGoals: Goal[][] = [] // gols de cada jogo separados (home = A marcou), pra animar ida e depois volta
    const l1 = leg(a, b, true); aggA += l1.hg; aggB += l1.ag // ida: a joga em casa
    const g1: Goal[] = [...l1.hEvs.map(e => ({ ...e, home: true })), ...l1.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    g1.forEach(e => goals.push(e)); legs.push([l1.hg, l1.ag]); legGoals.push(g1)
    if (!single) {
      const l2 = leg(b, a, true); aggB += l2.hg; aggA += l2.ag // volta: b em casa
      const g2: Goal[] = [...l2.aEvs.map(e => ({ ...e, home: true })), ...l2.hEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      g2.forEach(e => goals.push(e)); legs.push([l2.ag, l2.hg]); legGoals.push(g2)
    }
    goals.sort((x, y) => x.min - y.min)
    let pens: [number, number] | undefined, win: 'a' | 'b'
    if (aggA === aggB) { let x = 3 + Math.floor(rng() * 3), y = 3 + Math.floor(rng() * 3); if (x === y) (rng() < 0.5 ? x++ : y++); pens = [x, y]; win = x > y ? 'a' : 'b' }
    else win = aggA > aggB ? 'a' : 'b'
    return { a: a.t, b: b.t, aDiv: a.div, bDiv: b.div, aggA, aggB, pens, win, goals, legs, legGoals }
  }
  const roundNames = ['Oitavas', 'Quartas', 'Semifinal', 'Final']
  const rounds: CopaRound[] = []
  let cur = field
  let ri = Math.max(0, roundNames.length - Math.ceil(Math.log2(cur.length)))
  while (cur.length > 1) {
    const single = cur.length === 2 // final = jogo único
    const ties: CopaTie[] = [], next: { t: SimTeam; div: Div }[] = []
    for (let i = 0; i + 1 < cur.length; i += 2) {
      const tie = playTie(cur[i], cur[i + 1], single)
      ties.push(tie); next.push(tie.win === 'a' ? cur[i] : cur[i + 1])
    }
    rounds.push({ name: roundNames[ri] ?? `Fase ${ri + 1}`, ties }); cur = next; ri++
  }
  const champ = cur[0] ?? null
  // vice = quem perdeu a final (última fase, jogo único)
  const fin = rounds[rounds.length - 1]
  const ft = fin && fin.ties.length === 1 ? fin.ties[0] : null
  const vice = ft ? (ft.win === 'a' ? ft.b : ft.a) : null
  const viceDiv = ft ? (ft.win === 'a' ? ft.bDiv : ft.aDiv) : null
  const list = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  return { rounds, champion: champ?.t ?? null, championDiv: champ?.div ?? null, vice, viceDiv, scorers: list.slice(0, 20), topScorer: list[0] }
}

// prêmios da Copa: campeão leva moedas (igual Série A) + o artilheiro rende ao
// time e sobe o piso do jogador. Mesmo formato do seasonRewards/scorerRewards
// pra fundir nos args da virada de temporada.
export function copaRewards(copa: CopaResult): { rewards: Record<number, number>; clubRewards: Record<string, number>; values: Record<string, number>; championKey: string | null } {
  const rewards: Record<number, number> = {}, clubRewards: Record<string, number> = {}, values: Record<string, number> = {}
  let championKey: string | null = null
  const ch = copa.champion
  if (ch) {
    championKey = teamKey(ch)
    if (ch.human && ch.teamId >= 0) rewards[ch.teamId] = (rewards[ch.teamId] ?? 0) + COPA_CHAMP_COINS
    else clubRewards[championKey] = (clubRewards[championKey] ?? 0) + COPA_CHAMP_COINS
  }
  const vc = copa.vice
  if (vc) {
    const vk = teamKey(vc)
    if (vc.human && vc.teamId >= 0) rewards[vc.teamId] = (rewards[vc.teamId] ?? 0) + COPA_VICE_COINS
    else clubRewards[vk] = (clubRewards[vk] ?? 0) + COPA_VICE_COINS
  }
  const ts = copa.topScorer
  if (ts) {
    values[ts.name] = (values[ts.name] ?? 0) + COPA_SCORER_BONUS
    if (ts.human) rewards[ts.teamId] = (rewards[ts.teamId] ?? 0) + COPA_SCORER_BONUS
    else { const k = ts.teamId >= 0 ? `m${ts.teamId}` : ts.teamName; clubRewards[k] = (clubRewards[k] ?? 0) + COPA_SCORER_BONUS }
  }
  return { rewards, clubRewards, values, championKey }
}

// ── VISÃO das 4 divisões (mesmo visual das outras tabelas do jogo) ──
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
const zone = (rank: number) => rank <= 4 ? '#D6E9FA' : rank >= 17 ? '#F9D8D3' : undefined
const th: React.CSSProperties = { color: 'rgba(0,0,0,0.7)', fontWeight: 900, fontSize: 10.5 }
function ZoneLegend() {
  const chip = (bg: string, label: string, border = false) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: bg, border: border ? '1px solid rgba(0,0,0,0.2)' : 'none' }} />{label}</span>
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{chip('#D6E9FA', 'G4')}{chip('#fff', 'Meio', true)}{chip('#F9D8D3', 'Z4')}</div>
}
const UP_OF: Partial<Record<Div, Div>> = { B: 'A', C: 'B', D: 'C' }
const DOWN_OF: Partial<Record<Div, Div>> = { A: 'B', B: 'C', C: 'D' }
function DivTable({ div, teams, colors, mine, final }: { div: Div; teams: SimTeam[]; colors: Record<number, FCol>; mine?: boolean; final?: boolean }) {
  const humans = teams.filter(t => t.human || t.rival).map(t => ({ name: t.name, teamId: t.teamId, you: t.you, rival: !!t.rival }))
  // temporada FECHADA: setinhas animadas de acesso (▲ verde) e queda (▼ vermelha)
  // pra TODOS os times, e um banner quando é VOCÊ que sobe/cai/é campeão.
  const youPos = final && mine ? teams.findIndex(t => t.you) + 1 : 0
  const banner = !final || !mine || youPos === 0 ? null
    : div === 'A' && youPos === 1 ? { bg: GOLD, fg: INK, txt: '🏆 CAMPEÃO DA SÉRIE A! O topo é seu.' }
    : youPos <= 4 && UP_OF[div] ? { bg: '#1B7A3D', fg: '#fff', txt: `🚀 ACESSO! Você sobe pra Série ${UP_OF[div]}!` }
    : youPos <= 4 && div === 'A' ? { bg: '#1B7A3D', fg: '#fff', txt: '🛡️ Fechou no G4 da Série A — elite mantida!' }
    : youPos >= teams.length - 3 && DOWN_OF[div] ? { bg: '#B23B2E', fg: '#fff', txt: `📉 Queda pra Série ${DOWN_OF[div]}… ano que vem tem volta.` }
    : null
  return (
    <div style={{ ...box(mine ? '#FFFBEB' : '#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}{mine ? ' · você' : ''}</p><ZoneLegend />
      </div>
      {final && <style>{'@keyframes divUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes divDown{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}'}</style>}
      {banner && (
        <div style={{ background: banner.bg, color: banner.fg, border: `2.5px solid ${INK}`, borderRadius: 10, boxShadow: `2px 2px 0 0 ${INK}`, padding: '7px 10px', margin: '2px 0 8px', fontWeight: 900, fontSize: 13, textAlign: 'center', ...OSWALD }}>{banner.txt}</div>
      )}
      <DivChips humans={humans} colors={colors} />
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 6 }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {teams.map((t, i) => {
            const fc = colors[t.teamId]
            const youPerk = t.you ? myApoioPerk() : null
            const colored = t.human || t.rival
            const bg = colored ? (fc?.light ?? '#eee') : zone(i + 1)
            const nameColor = colored ? (fc?.solid ?? INK) : INK
            return (
              <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: bg, fontWeight: colored ? 800 : 500 }}>
                <td style={{ paddingRight: 4, whiteSpace: 'nowrap' }}>{i + 1}{final && i < 4 && UP_OF[div] && <span style={{ display: 'inline-block', color: '#1B7A3D', fontWeight: 900, marginLeft: 2, animation: 'divUp 1.4s ease-in-out infinite' }}>▲</span>}{final && i === 0 && div === 'A' && <span style={{ marginLeft: 2 }}>🏆</span>}{final && i >= teams.length - 4 && DOWN_OF[div] && <span style={{ display: 'inline-block', color: '#B23B2E', fontWeight: 900, marginLeft: 2, animation: 'divDown 1.4s ease-in-out infinite' }}>▼</span>}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, color: nameColor }}>{t.you ? '👤 ' : t.rival ? '⚔️ ' : ''}{t.you && youPerk ? <span style={apoioText(youPerk)}>{apoioName(t.name)}</span> : t.name}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                <td style={{ textAlign: 'center' }}>{t.w}</td><td style={{ textAlign: 'center' }}>{t.d}</td><td style={{ textAlign: 'center' }}>{t.l}</td>
                <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export function PyramidTables({ tables, order, colors, myDiv, final }: { tables: Record<Div, SimTeam[]>; order?: Div[]; colors?: Record<number, FCol>; myDiv?: Div | null; final?: boolean }) {
  const cols = colors ?? {}
  // a artilharia saiu daqui (foi pra aba Rank) — a aba Tabelas fica só com as 4 tabelas.
  return <>{(order ?? DIVS).map(d => <DivTable key={d} div={d} teams={tables[d]} colors={cols} mine={d === myDiv} final={final} />)}</>
}
// caixa de artilharia reutilizável (temporada e todos os tempos) — top N já pronto.
function ArtilhariaBox({ scorers, colors, title, sub, foot }: { scorers: SeasonScorer[]; colors?: Record<number, FCol>; title: string; sub?: string; foot?: string }) {
  const cols = colors ?? {}
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>{sub}</p>}
      {scorers.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
          <tbody>
            {scorers.map((s, i) => {
              const fc = (s.human || s.rival) ? cols[s.teamId] : undefined
              return (
              <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: fc?.light }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: fc?.solid ?? 'rgba(0,0,0,0.7)', fontWeight: fc ? 800 : 600 }}>{s.you ? '👤 ' : s.rival ? '⚔️ ' : s.human ? '🔥 ' : ''}{(() => { const pk = s.you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(s.teamName)}</span> : s.teamName })()}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
              </tr>
            )})}
          </tbody>
        </table>
      )}
      {foot && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '8px 0 0', textAlign: 'center' }}>{foot}</p>}
    </div>
  )
}

// Artilharia da TEMPORADA separada por SÉRIE (A › B › C › D), top 5 de cada —
// em vez de uma lista única misturando todas as divisões. Deixa claro quem é o
// goleador de cada série (é ele que vira artilheiro/piso da divisão).
function ArtilhariaByDiv({ scorers, colors, title, sub, foot }: { scorers: SeasonScorer[]; colors?: Record<number, FCol>; title: string; sub?: string; foot?: string }) {
  const cols = colors ?? {}
  const total = scorers.length
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>{sub}</p>}
      {total === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : DIVS.map(d => {
        const top = scorers.filter(s => s.div === d).slice(0, 5) // já vêm ordenados por gols
        return (
          <div key={d} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '2px 0 4px' }}>
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 900, color: '#fff', background: DIV_TAG[d].bg, borderRadius: 5, padding: '1px 6px' }}>{DIV_TAG[d].l}</span>
              <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD }}>{DIV_NAME[d]}</span>
            </div>
            {top.length === 0 ? <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.45)', fontWeight: 700, margin: '0 0 2px 4px' }}>Sem gols nesta série ainda.</p> : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  {top.map((s, i) => {
                    const fc = (s.human || s.rival) ? cols[s.teamId] : undefined
                    return (
                    <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', fontWeight: 600, background: fc?.light }}>
                      <td style={{ paddingRight: 4, width: 16, color: 'rgba(0,0,0,0.5)', fontWeight: 800 }}>{i + 1}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{i === 0 ? '👑 ' : ''}{s.name}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, color: fc?.solid ?? 'rgba(0,0,0,0.7)', fontWeight: fc ? 800 : 600 }}>{s.you ? '👤 ' : s.rival ? '⚔️ ' : s.human ? '🔥 ' : ''}{(() => { const pk = s.you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(s.teamName)}</span> : s.teamName })()}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, width: 30 }}>{s.goals}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
      {foot && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '4px 0 0', textAlign: 'center' }}>{foot}</p>}
    </div>
  )
}

// onde EU terminei/estou: divisão, posição, campeão
export function myStanding(tables: Record<Div, SimTeam[]>): { div: Div; pos: number; champ: boolean; team: string } | null {
  for (const d of DIVS) {
    const i = tables[d].findIndex(t => t.you)
    if (i >= 0) return { div: d, pos: i + 1, champ: i === 0, team: tables[d][i].name }
  }
  return null
}
const DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
// ritmo da carreira online: +1s por jogo em relação aos outros modos, pra dar
// tempo de decidir tática/Time A-B durante a partida: 8s por rodada (fixo). Só aqui.
const ROUND_MS = 8000
export const COPA_LEG_MS = 8000 // cada JOGO da Copa rola ~8s (como uma partida da liga: 90'+acréscimos). Fase de ida-e-volta = 2×; final (jogo único) = 1×.

// COR DO TIME: todo mundo começa na cor BEGE do "Foi Profissional" — a cor
// de todo mundo. Cor diferente (verde/roxo/prata/OURO com brilho) é benefício
// de quem APOIA o projeto (escada do modal APOIE). A paleta sorteada antiga
// foi aposentada quando a escada de cores virou o padrão.
export interface FCol { solid: string; light: string }
export function playerColors(humanIds: number[], youId: number, seed: number): Record<number, FCol> {
  void seed // a semente era da paleta sorteada; fica na assinatura pra não mexer nos chamadores
  const bege = APOIO_PERKS.bege
  const map: Record<number, FCol> = {}
  for (const id of humanIds) map[id] = { solid: bege.solid, light: bege.light }
  // quem tem tier de apoio joga com a cor DELE por cima do bege — no próprio
  // aparelho (o selo no nome os outros já veem; a cor cruzada vem com o Supabase).
  const perk = myApoioPerk()
  if (perk && map[youId]) map[youId] = { solid: perk.solid, light: perk.light }
  return map
}
// ordem das divisões: a SUA primeiro, depois a pirâmide de cima pra baixo
function orderedDivs(myDiv: Div | null): Div[] { return myDiv ? [myDiv, ...DIVS.filter(d => d !== myDiv)] : DIVS }
const matchBg = (m: { hId: number; aId: number }, colors: Record<number, FCol>) => colors[m.hId]?.light ?? colors[m.aId]?.light ?? undefined

// chips com os times dos AMIGOS (e você) que estão numa divisão — pra bater o
// olho quem está em qual série. Cada um com a SUA cor (inclusive você).
function DivChips({ humans, colors }: { humans: { name: string; teamId: number; you: boolean; rival?: boolean }[]; colors: Record<number, FCol> }) {
  if (humans.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
      {humans.map((h, i) => {
        const perk = h.you ? myApoioPerk() : null
        return (
          <span key={i} style={{ fontSize: 9.5, fontWeight: 900, ...OSWALD, color: '#fff', background: perk ? perk.grad : colors[h.teamId]?.solid ?? '#888', borderRadius: 6, padding: '1px 7px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(perk ? { position: 'relative' } : {}) }}>{h.you ? '👤 ' : h.rival ? '⚔️ ' : ''}{h.you ? apoioName(h.name) : h.name}{perk && <ApoioSheen holo={perk.holo} dur={3} />}</span>
        )
      })}
    </div>
  )
}

// ── SEU JOGO em destaque: card grande com o minuto correndo + os gols (nome do
// artilheiro), igual à simulação do modo off-line. ──
// TICKER de frases: mostra UMA linha por vez, trocando sozinha a cada ~4,5s.
// Cada item tem cor de faixa (por tipo) + ícone + texto.
type Flavor = { c: string; ic: string; tag: string; node: React.ReactNode }
function RivalryTicker({ items }: { items: Flavor[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (items.length <= 1) return
    const iv = setInterval(() => setI(x => x + 1), 4500)
    return () => clearInterval(iv)
  }, [items.length])
  if (!items.length) return null
  const idx = i % items.length
  const it = items[idx]
  return (
    // ticker estilo "lower-third" de TV: trilho colorido por tipo + etiqueta de
    // categoria (preta) + a frase que troca sozinha + pontinhos de progresso.
    <div style={{ display: 'flex', alignItems: 'stretch', border: `2.5px solid ${INK}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, marginBottom: 10, minHeight: 46 }}>
      <style>{'@keyframes coFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ width: 7, background: it.c, flexShrink: 0 }} />
      <div key={'tag' + idx} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', background: INK, color: '#fff', flexShrink: 0, animation: 'coFade .45s ease' }}>
        <span style={{ fontSize: 15 }}>{it.ic}</span>
        <span style={{ ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: 0.4 }}>{it.tag}</span>
      </div>
      <div key={idx} style={{ flex: 1, minWidth: 0, padding: '8px 11px', display: 'flex', alignItems: 'center', animation: 'coFade .45s ease' }}>
        {/* o texto num único <span> pra o nome colorido fluir INLINE (senão o flex
            separa em itens e come os espaços — "seguraNeymarzetti13") */}
        <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{it.node}</span>
      </div>
      {items.length > 1 && <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '0 9px', flexShrink: 0 }}>{items.map((_, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: 999, background: k === idx ? INK : 'rgba(0,0,0,0.2)' }} />)}</div>}
    </div>
  )
}
// ── PLACAR AO VIVO (reutilizável): relógio animado, selo GOOOL, flash e bump.
// Usado na carreira (pirâmide) E no jogo rápido (offline/online) — mesmo visual.
export interface ScoreGoal { name: string; min: number; home: boolean }
export function LiveScoreCard({ homeName, awayName, homeColor, awayColor, youIsHome, goals, roundKey, roundMs, finished, classico }:
  { homeName: string; awayName: string; homeColor: string; awayColor: string; youIsHome: boolean; goals: ScoreGoal[]; roundKey: number; roundMs: number; finished?: boolean; classico?: boolean }) {
  const [min, setMin] = useState(finished ? 93 : 0)
  useEffect(() => {
    // o relógio só zera/anima quando MUDA A RODADA (roundKey). Trocar a tática na
    // mesma rodada não reinicia o jogo que está na tela — ele não re-simula.
    if (finished) { setMin(93); return }
    setMin(0)
    const step = Math.max(30, (roundMs * 0.82) / 93)
    let cur = 0
    const iv = setInterval(() => { cur++; setMin(cur); if (cur >= 93) clearInterval(iv) }, step)
    return () => clearInterval(iv)
  }, [roundKey, finished, roundMs])
  const done = min >= 93
  // 🛟 no FIM mostra TODOS os gols — o placar do card TEM que bater com o da
  // tabela (antes, gol nos acréscimos além do relógio sumia da tela e o
  // resultado exibido divergia da pontuação: vitória virava empate etc.).
  const shown = done ? goals : goals.filter(g => g.min <= min)
  const hg = shown.filter(g => g.home).length, ag = shown.filter(g => !g.home).length
  // ── RITUAIS DO JOGO: apito inicial e apito final (frases fixas de narração —
  // lances aleatórios no meio soavam robóticos e foram removidos). O texto fica
  // uns segundos REAIS na faixinha de baixo e some.
  const [ritual, setRitual] = useState<'start' | 'half' | 'end' | null>(null)
  useEffect(() => {
    if (finished) { setRitual(null); return }
    setRitual('start')
    const t = setTimeout(() => setRitual(prev => prev === 'start' ? null : prev), 2800)
    return () => clearTimeout(t)
  }, [roundKey, finished])
  // intervalo: na virada do relógio pro 2º tempo, o árbitro autoriza de novo
  useEffect(() => {
    if (finished || done || min !== 47) return
    setRitual('half')
    const t = setTimeout(() => setRitual(prev => prev === 'half' ? null : prev), 2800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, finished, done])
  useEffect(() => {
    if (!done || finished) return
    setRitual('end')
    const t = setTimeout(() => setRitual(prev => prev === 'end' ? null : prev), 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, finished])
  const endPhrase = ['📢 Apito final — termina o jogo!', '📢 Apitou o árbitro: acabou!', '📢 Fim de jogo — pode tirar o uniforme!'][Math.abs(roundKey) % 3]
  const ritualTxt = ritual === 'start' ? '🟢 Aaaaaauutoriza o árbitro — começa o primeiro tempo!' : ritual === 'half' ? '🟢 Aaaaaauutoriza o árbitro — rola o segundo tempo!' : ritual === 'end' ? endPhrase : null
  const minLabel = min >= 93 ? 'FIM' : min > 90 ? `90+${min - 90}'` : `${min}'`
  const iAmHome = youIsHome
  const last = shown.length ? [...shown].sort((a, b) => a.min - b.min)[shown.length - 1] : null
  const homeCol = homeColor, awayCol = awayColor
  const ini = (n: string) => n.trim()[0]?.toUpperCase() ?? '?'

  // ── SAIU GOL! detecta quando hg/ag sobem (só ao vivo) e dispara o selo GOOOL,
  //    o flash no lado de quem marcou e o "bump" no número. ──
  const prev = useRef({ h: hg, a: ag, key: roundKey })
  const [goal, setGoal] = useState<'h' | 'a' | null>(null)
  const [lateGoal, setLateGoal] = useState(false) // gol depois dos 85' → selo especial
  useEffect(() => {
    const p = prev.current
    if (p.key !== roundKey) { p.key = roundKey; p.h = hg; p.a = ag; return } // trocou a rodada: rebaseia sem animar
    let side: 'h' | 'a' | null = null
    if (hg > p.h) side = 'h'; else if (ag > p.a) side = 'a'
    p.h = hg; p.a = ag
    if (side && !finished) {
      setGoal(side)
      setLateGoal(min >= 86)
      const t = setTimeout(() => setGoal(null), 1700)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hg, ag, roundKey, finished])
  void iAmHome

  const Team = ({ name, color, you, flash }: { name: string; color: string; you: boolean; flash?: boolean }) => {
    const perk = you ? myApoioPerk() : null
    return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '22px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', background: `linear-gradient(180deg, ${color}22, transparent)`, minWidth: 0 }}>
      {flash && <div style={{ position: 'absolute', inset: 0, background: color, animation: 'coGoalFlash 1.6s ease', pointerEvents: 'none' }} />}
      {perk && <ApoioSheen holo={perk.holo} dur={4.2} />}
      <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 8, border: `2px solid ${INK}`, background: perk ? perk.grad : color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, ...OSWALD, animation: flash ? 'coBump .6s ease' : undefined }}>{ini(name)}</div>
      <div style={{ position: 'relative', fontSize: 12, fontWeight: 900, ...OSWALD, color: you ? color : '#3a3630', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', ...(perk ? apoioText(perk) : {}) }}>{perk ? apoioName(name) : name}</div>
      <div style={{ position: 'relative', fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#9a8f78' }}>{you ? 'você' : 'rival'}</div>
    </div>
    )
  }
  return (
    <div style={{ ...box(classico ? '#FFF4D6' : '#fff'), overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
      <style>{'@keyframes coPulse{0%{box-shadow:0 0 0 0 rgba(255,91,77,.6)}70%{box-shadow:0 0 0 7px rgba(255,91,77,0)}100%{box-shadow:0 0 0 0 rgba(255,91,77,0)}}@keyframes coGoalFlash{0%{opacity:0}14%{opacity:.32}100%{opacity:0}}@keyframes coBump{0%{transform:scale(1)}28%{transform:scale(1.4)}60%{transform:scale(.9)}100%{transform:scale(1)}}@keyframes coStamp{0%{transform:translateX(-50%) scale(0) rotate(-14deg);opacity:0}45%{transform:translateX(-50%) scale(1.18) rotate(-7deg);opacity:1}70%{transform:translateX(-50%) scale(.94) rotate(-7deg)}100%{transform:translateX(-50%) scale(1) rotate(-7deg);opacity:1}}'}</style>
      {classico && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, ...OSWALD, padding: '2px 7px', borderRadius: 6, letterSpacing: 0.5 }}>🥊 CLÁSSICO</div>}
      {/* selo GOOOL! — surge sobre o lado de quem marcou */}
      {goal && <div style={{ position: 'absolute', top: 4, left: goal === 'h' ? '25%' : '75%', transform: 'translateX(-50%) rotate(-7deg)', zIndex: 4, background: GOLD, color: INK, border: `2.5px solid ${INK}`, borderRadius: 9, padding: '3px 12px', ...OSWALD, fontWeight: 900, fontSize: 17, letterSpacing: 0.5, boxShadow: `2px 2px 0 0 ${INK}`, animation: 'coStamp .5s cubic-bezier(.2,1.4,.5,1) both', whiteSpace: 'nowrap', ...(lateGoal ? { background: '#FF5B4D', color: '#fff' } : {}) }}>{lateGoal ? '🔥 GOL NO FIM!' : '⚽ GOOOL!'}</div>}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', fontSize: 11, fontWeight: 900, ...OSWALD, padding: '3px 11px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2, whiteSpace: 'nowrap' }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: done ? GREEN : '#ff5b4d', animation: done ? 'none' : 'coPulse 1.4s infinite' }} /> {done ? 'FIM' : minLabel}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch' }}>
        <Team name={homeName} color={homeCol} you={youIsHome} flash={goal === 'h'} />
        {/* placar central limpo (sem tarja preta) — número grande no creme; cada
            número dá um "bump" quando MUDA (key = valor → remonta e reanima) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px 6px 8px', minWidth: 88, ...OSWALD, fontWeight: 900, fontSize: 34, color: INK, lineHeight: 1 }}>
          <span key={'h' + hg} style={{ padding: '0 8px', display: 'inline-block', animation: 'coBump .55s ease' }}>{hg}</span><span style={{ color: '#b8b0a0', fontSize: 16 }}>×</span><span key={'a' + ag} style={{ padding: '0 8px', display: 'inline-block', animation: 'coBump .55s ease' }}>{ag}</span>
        </div>
        <Team name={awayName} color={awayCol} you={!youIsHome} flash={goal === 'a'} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '7px 12px', borderTop: '2px solid #e6dcbf', background: '#efe4c8' }}>
        <span key={ritualTxt ?? 'g'} style={{ fontSize: 11, fontWeight: ritualTxt ? 900 : 700, ...OSWALD, color: ritualTxt ? INK : 'rgba(0,0,0,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', animation: ritualTxt ? 'coFade .4s ease' : undefined }}>
          {ritualTxt ?? (last ? <>⚽ {last.name} <span style={{ opacity: 0.6 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></> : (done ? 'sem gols' : '🟢 bola rolando…'))}
        </span>
      </div>
    </div>
  )
}

// wrapper da CARREIRA: resolve cores por técnico e passa pro placar compartilhado.
function MyMatchCard({ m, youName, finished, col, colors, roundKey, roundMs = ROUND_MS }: { m: SimMatch; youName: string; finished?: boolean; col: FCol; colors?: Record<number, FCol>; roundKey: number; roundMs?: number }) {
  const iAmHome = m.h === youName
  const oppId = iAmHome ? m.aId : m.hId
  const oppCol = colors?.[oppId]?.solid ?? '#3A7CA5'
  return <LiveScoreCard homeName={m.h} awayName={m.a} homeColor={iAmHome ? col.solid : oppCol} awayColor={iAmHome ? oppCol : col.solid}
    youIsHome={iAmHome} goals={m.goals} roundKey={roundKey} roundMs={roundMs} finished={finished} />
}

// ── os JOGOS de uma divisão (placar + quem fez os gols), cores por amigo ──
function DivMatches({ div, matches, colors, humans, hideId }: { div: Div; matches: SimMatch[]; colors: Record<number, FCol>; humans: { name: string; teamId: number; you: boolean; rival?: boolean }[]; hideId?: number }) {
  const nameCol = (id: number) => colors[id]?.solid ?? '#5a5647'
  return (
    <div style={{ ...box('#fff'), padding: 9, marginBottom: 8 }}>
      <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}</p>
      <DivChips humans={humans} colors={colors} />
      <div style={{ marginTop: 6 }}>
        {matches.map((m, i) => {
          if (hideId != null && (m.hId === hideId || m.aId === hideId)) return null
          const bg = matchBg(m, colors)
          const last = m.goals.length ? m.goals[m.goals.length - 1] : null
          return (
            <div key={i} style={{ padding: '3px 4px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: bg, borderRadius: bg ? 5 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5 }}>
                <span style={{ textAlign: 'right', fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: nameCol(m.hId) }}>{m.h}</span>
                <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: bg ? INK : '#eee', color: bg ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.hg}×{m.ag}</span>
                <span style={{ textAlign: 'left', fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: nameCol(m.aId) }}>{m.a}</span>
              </div>
              {last && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.55)', margin: '1px 0 0', textAlign: 'center' }}>⚽ {last.name} <span style={{ opacity: 0.7 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ELENCO: seu time por posição, com o VALOR (piso) de cada jogador. Os
// melhores de cada posição (pela formação) são os titulares (fundo creme); as
// reservas aparecem AO LADO, na mesma linha de posição. Sem estrela/badge. ──
const POS_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meias', ATA: 'Atacantes' }
type ListCfg = { listed: boolean; listable: boolean; onList: () => void }
function PlayerRow({ c, titular, col, onSwap, list }: { c: WonCard; titular: boolean; col: FCol; onSwap?: () => void; list?: ListCfg }) {
  const listed = !!list?.listed
  const dim = !!list && !list.listable && !listed // modo listagem: sem poder listar (último da posição / bloqueado)
  const onClick = onSwap ?? (list && (list.listable || listed) ? list.onList : undefined)
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '4px 7px', borderRadius: 6, background: listed ? '#FFF6D6' : titular ? '#fff' : 'rgba(255,255,255,0.5)', borderLeft: `3px solid ${listed ? GOLD : titular ? col.solid : 'transparent'}`, marginBottom: 3, opacity: dim ? 0.45 : 1, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontWeight: titular ? 800 : 600, fontSize: 12, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: listed ? '#8a6d0b' : titular ? INK : '#6a6658' }}>
        {c.name}
        {onSwap && <span style={{ fontWeight: 900, marginLeft: 4, color: titular ? '#c0392b' : GREEN }}>{titular ? '▼' : '▲'}</span>}
        {list && <span style={{ fontWeight: 900, marginLeft: 4, fontSize: 10, color: listed ? '#b8860b' : dim ? 'rgba(0,0,0,0.35)' : GREEN }}>{listed ? '✓ tirar' : dim ? '🔒' : '+ listar'}</span>}
      </span>
      <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, whiteSpace: 'nowrap', color: '#5a5647', flexShrink: 0 }}>💰 {c.paid ?? 0}</span>
    </div>
  )
}
// ELENCO com CAMPINHO: os titulares (XI escolhido) aparecem num campinho; as
// reservas numa lista embaixo. Pra trocar: toca num jogador (fica MARCADO) e os
// da MESMA posição do outro lado ACENDEM — toca em qual quer trocar. Vale pros
// dois sentidos (titular↔reserva). Aplica no próximo jogo, como a tática.
function ElencoField({ mgr, col, xiIds, xi, goals, selId, onTap, seasonNo }: { mgr: Manager; col: FCol; xiIds: Set<string>; xi?: WonCard[]; goals?: Record<string, number>; selId: string | null; onTap?: (id: string) => void; seasonNo?: number }) {
  const goalsOf = (c: WonCard) => goals?.[c.id] ?? 0
  const sel = selId ? mgr.squad.find(c => c.id === selId) ?? null : null
  const isTarget = (c: WonCard) => !!sel && sel.id !== c.id && sel.pos === c.pos && (xiIds.has(sel.id) !== xiIds.has(c.id))
  const stateOf = (c: WonCard) => (c.id === selId ? 'sel' : isTarget(c) ? 'target' : sel ? 'dim' : 'idle')
  const borderOf = (st: string) => (st === 'sel' ? GOLD : st === 'target' ? GREEN : INK)
  // o campinho segue a ORDEM da escalação (vaga fixa) — quando entra um reserva,
  // ele fica no mesmo lugar do que saiu. Fallback: ordena por rating.
  const xiOf = (pos: Sector) => xi ? xi.filter(c => c.pos === pos) : mgr.squad.filter(c => c.pos === pos && xiIds.has(c.id)).sort((a, b) => mid(b) - mid(a))
  const lats = xiOf('LAT')
  const defense = [...(lats[0] ? [lats[0]] : []), ...xiOf('ZAG'), ...(lats[1] ? [lats[1]] : [])]
  const rows: { key: string; cards: WonCard[] }[] = [
    { key: 'ATA', cards: xiOf('ATA') },
    { key: 'MEI', cards: xiOf('MEI') },
    { key: 'DEF', cards: defense },
    { key: 'GOL', cards: xiOf('GOL') },
  ]
  const reserves = mgr.squad.filter(c => !xiIds.has(c.id)).sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos) || mid(b) - mid(a))
  const titulares = SECTORS.flatMap(pos => xiOf(pos)) // mesma ordem da lista de reservas (GOL→ATA)
  // linha compartilhada titular/reserva: no campinho o nome já mal cabe, então o
  // clube · ano (que diferencia o Kaká do SP do Kaká do Milan) vive AQUI nas
  // listas — e a troca funciona igual: toca num, acende os da mesma posição.
  // linha COMPACTA (meia largura): nome em cima, clube · ano embaixo — assim as
  // duas listas cabem lado a lado no celular sem cortar nada importante.
  const rowOf = (c: WonCard, titular: boolean) => { const st = stateOf(c); return (
    <div key={c.id} onClick={() => onTap?.(c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '4px 6px', borderRadius: 6, background: st === 'sel' ? '#FFF6D6' : titular ? '#fff' : 'rgba(255,255,255,0.88)', border: `2px solid ${st === 'idle' ? 'transparent' : borderOf(st)}`, marginBottom: 3, opacity: st === 'dim' ? 0.5 : 1, cursor: onTap ? 'pointer' : 'default' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: titular ? 800 : 700, fontSize: 11.5, ...OSWALD, color: titular ? INK : '#4a4740', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontWeight: 900, fontSize: 8.5, color: col.solid, marginRight: 4 }}>{c.pos}</span>{c.name}
        </span>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 9, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.club} · {c.year}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, lineHeight: 1.2 }}>
        {goalsOf(c) > 0 && <span style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: GREEN }}>⚽ {goalsOf(c)}</span>}
        <span style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: '#5a5647' }}>💰 {c.paid ?? 0}</span>
      </span>
    </div>
  ) }
  return (
    <div>
      {onTap && (
        <div style={{ border: `3px solid ${sel ? GREEN : INK}`, background: sel ? '#E9F9EF' : '#FFF6D6', borderRadius: 11, padding: '9px 12px', margin: '0 0 10px', boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ fontSize: 13.5, fontWeight: 900, ...OSWALD, color: sel ? GREEN : INK, margin: 0, lineHeight: 1.2 }}>
            {sel ? <>🔁 Trocar <b>{sel.name}</b> por qual {POS_LABEL[sel.pos].toLowerCase()}? Toque um aceso 👇</> : <>🔁 Faça suas trocas aqui: toque num jogador e depois no outro.</>}
          </p>
          {!sel && <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', margin: '3px 0 0' }}>Vale do próximo jogo em diante.</p>}
        </div>
      )}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '8px 5px', display: 'flex', flexDirection: 'column', gap: 5, background: `repeating-linear-gradient(180deg, ${GREEN} 0 30px, #166332 30px 60px)` }}>
          {rows.map(r => (
            <div key={r.key} style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
              {r.cards.map(c => { const st = stateOf(c); return (
                <button key={c.id} onClick={() => onTap?.(c.id)} disabled={!onTap} style={{ border: `2px solid ${borderOf(st)}`, borderRadius: 8, background: st === 'sel' ? '#FFF6D6' : '#fff', padding: '3px 6px', minWidth: 58, maxWidth: 96, textAlign: 'center', cursor: onTap ? 'pointer' : 'default', opacity: st === 'dim' ? 0.5 : 1, boxShadow: st === 'target' ? `0 0 0 2px ${GREEN}` : 'none', ...OSWALD }}>
                  <span style={{ display: 'block', fontSize: 8, fontWeight: 900, color: col.solid }}>{c.pos}</span>
                  <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  {goalsOf(c) > 0 && <span style={{ display: 'block', fontSize: 8.5, fontWeight: 900, color: GREEN }}>⚽ {goalsOf(c)}</span>}
                </button>
              ) })}
            </div>
          ))}
        </div>
      </div>
      {/* TITULARES e RESERVAS lado a lado: no campinho não cabe o clube · ano,
          então as listas mostram — e a troca funciona nos dois lugares (toca num
          jogador de qualquer lista OU do campinho e completa no outro). */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, color: '#fff', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 0.3, textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>⭐ Titulares ({titulares.length})</p>
          {titulares.map(c => rowOf(c, true))}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, color: '#fff', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 0.3, textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>🔁 Reservas ({reserves.length})</p>
          {reserves.length === 0
            ? (seasonNo === 1
                ? <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.4 }}>🔒 Na Temporada 1 você joga com os 11. <b>No próximo leilão</b> (no fim desta temporada) você enche o banco — até 22! 🔨</p>
                : <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Sem reservas no banco.</p>)
            : reserves.map(c => rowOf(c, false))}
        </div>
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', lineHeight: 1.4, textShadow: '1px 1px 0 rgba(0,0,0,.25)' }}>
        💡 O nível de cada carta é o <b>auge do jogador naquele clube e ano</b>: Kaká · São Paulo 2003 é promessa, Kaká · Milan 2007 é lenda.
      </p>
    </div>
  )
}
// 📤 Compartilhar elenco: gera a arte aprovada (header na cor do time + campinho
// + listas com gols/valor + rodapé) e abre o compartilhar nativo do celular.
function ShareElencoBtn({ mgr, col, xi, xiIds, goals, divName, tablePos, seasonNo, coins, titles }: {
  mgr: Manager; col: FCol; xi: WonCard[]; xiIds: Set<string>; goals: Record<string, number>
  divName: string; tablePos: number; seasonNo: number; coins: number; titles: number
}) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (busy) return
    setBusy(true)
    try {
      const g = (c: WonCard) => goals[c.id] ?? 0
      const of = (pos: Sector) => xi.filter(c => c.pos === pos)
      const lats = of('LAT')
      const def = [...(lats[0] ? [lats[0]] : []), ...of('ZAG'), ...(lats[1] ? [lats[1]] : [])]
      const fieldRows = [of('ATA'), of('MEI'), def, of('GOL')].map(cards =>
        cards.map(c => ({ pos: c.pos, name: c.name, goals: g(c) })))
      const toRow = (c: WonCard): ElencoPlayerRow => ({ pos: c.pos, name: c.name, goals: g(c), paid: c.paid ?? 0 })
      const titulares = SECTORS.flatMap(pos => of(pos)).map(toRow)
      const reservas = mgr.squad.filter(c => !xiIds.has(c.id))
        .sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(toRow)
      await shareElenco({
        teamName: mgr.teamName + apoioSelo(), divName, tablePos, seasonNo, formation: mgr.formation,
        titles, squadValue: mgr.squad.reduce((s2, c) => s2 + (c.paid ?? 0), 0), coins,
        color: col.solid, fieldRows, titulares, reservas,
      })
    } finally { setBusy(false) }
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={go} disabled={busy}
        style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: '12px 8px', fontWeight: 900, fontSize: 15, ...OSWALD, background: 'linear-gradient(180deg,#FFE07A,#F5B301)', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', color: INK }}>
        {busy ? '🎨 Gerando a arte…' : '📤 COMPARTILHAR MEU ELENCO'}
      </button>
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textAlign: 'center', marginTop: 5 }}>
        gera a imagem do teu time — mostra teu elenco e marca a gente! 📲 @leilaolegendscom
      </p>
    </div>
  )
}

// ── PRÉVIA DOURADA: acordeão fechado no fim das abas Elenco e Estádio — o
// "gostinho" do tier Lenda com o PRÓPRIO time da pessoa, marcado como modelo
// de teste, com o botão do APOIE logo abaixo. Quem já é ouro não vê.
function GoldTeaser({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  if (myApoioPerk()?.tier === 'ouro') return null
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 12px', fontWeight: 900, fontSize: 12.5, ...OSWALD, background: 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)', color: INK, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <ApoioSheen holo={0.75} dur={2.6} />
        <span style={{ position: 'relative' }}>{open ? '▾' : '✨'} {label}</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            {children}
            <ApoioPreviewMark />
          </div>
          <p style={{ fontSize: 10.5, fontWeight: 800, textAlign: 'center', color: '#5a5647', margin: '6px 0 8px' }}>☝️ prévia de teste — assim fica o SEU no tier Lenda 👑 (ouro ou qualquer cor com brilho)</p>
          <ApoieButton big />
        </div>
      )}
    </div>
  )
}

function SquadTab({ mgr, col, coins, xiIds, xi, goals, onSwap, list, selId = null, seasonNo, perkOverride }: { mgr: Manager; col: FCol; coins: number; xiIds?: Set<string>; xi?: WonCard[]; goals?: Record<string, number>; onSwap?: (id: string) => void; list?: { listed: Set<string>; canList: (c: WonCard) => boolean; onList: (id: string) => void }; selId?: string | null; seasonNo?: number; perkOverride?: ApoioPerk }) {
  const need = FORMATIONS[mgr.formation]
  const total = mgr.squad.reduce((s, c) => s + (c.paid ?? 0), 0)
  const hasReserves = SECTORS.some(pos => mgr.squad.filter(c => c.pos === pos).length > need[pos])
  const elenco = !!xiIds && !list // aba Elenco: campinho + reservas (troca por seleção)
  // na aba Elenco a explicação fica no banner grande abaixo — aqui não repete.
  const caption = elenco ? '' : list ? '· toque pra pôr no leilão / tirar' : '· moedas pra reforços'
  const listOf = (c: WonCard): ListCfg | undefined => list ? { listed: list.listed.has(c.id), listable: list.canList(c), onList: () => list.onList(c.id) } : undefined
  // o elenco herda a COR do jogador (a mesma sorteada pra ele no jogo todo).
  // Quem tem tier de apoio ganha o degradê DA CARTA da categoria + varredura
  // de brilho (holo), igual à carta — só na aba Elenco, que é o "manto" dele.
  const perk = perkOverride ?? myApoioPerk()
  const shine = elenco && perk && perk.holo > 0
  return (
    <div style={{ ...box(elenco ? col.solid : col.light), ...(shine ? { background: perk.grad, position: 'relative', overflow: 'hidden' } : {}), padding: 12, marginBottom: 12 }}>
      {shine && <ApoioSheen holo={perk.holo} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0, color: elenco ? '#fff' : col.solid, textShadow: elenco ? '1px 1px 0 rgba(0,0,0,.35)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👥 {mgr.teamName}{elenco && perk?.selo ? ` ${perk.selo}` : elenco ? apoioSelo() : ''}</p>
        {/* 22 é o normal, mas com empréstimo DA SAF o elenco passa de 22 por um
            jogador — o selo se estica sozinho pra não parecer erro (23/23). */}
        <span style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, background: elenco ? '#fff' : col.solid, color: elenco ? INK : '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap' }}>{mgr.squad.length}/{Math.max(22, mgr.squad.length)}{elenco ? '' : ` · 💰 ${total}`}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, background: elenco ? '#fff' : 'rgba(255,255,255,0.6)', border: `2px solid ${elenco ? INK : col.solid}`, borderRadius: 8, padding: '4px 8px', flexWrap: 'wrap' }}>
        <span title="Soma do valor de mercado dos 22 jogadores (não é a sua caixa de moedas)" style={{ fontWeight: 900, fontSize: 12, ...OSWALD, color: INK }}>{elenco ? `🏷️ Elenco vale ${total} 💵` : `🪙 Caixa: ${coins}`}</span>
        {caption && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647' }}>{caption}</span>}
      </div>
      {elenco ? (
        <ElencoField mgr={mgr} col={col} xiIds={xiIds!} xi={xi} goals={goals} selId={selId} onTap={onSwap} seasonNo={seasonNo} />
      ) : (<>
      {hasReserves && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: col.solid, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Titulares</p>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: 'rgba(0,0,0,0.45)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Reservas</p>
        </div>
      )}
      {SECTORS.map(pos => {
        const players = mgr.squad.filter(c => c.pos === pos).sort((a, b) => mid(b) - mid(a))
        const titulars = xiIds ? players.filter(c => xiIds.has(c.id)) : players.slice(0, need[pos])
        const reserves = xiIds ? players.filter(c => !xiIds.has(c.id)) : players.slice(need[pos])
        return (
          <div key={pos} style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: col.solid, opacity: 0.85, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.3 }}>{POS_LABEL[pos]}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>{titulars.map(c => <PlayerRow key={c.id} c={c} titular col={col} onSwap={onSwap ? () => onSwap(c.id) : undefined} list={listOf(c)} />)}</div>
              {reserves.length > 0 && <div style={{ flex: 1, minWidth: 0 }}>{reserves.map(c => <PlayerRow key={c.id} c={c} titular={false} col={col} onSwap={onSwap ? () => onSwap(c.id) : undefined} list={listOf(c)} />)}</div>}
            </div>
          </div>
        )
      })}
      </>)}
    </div>
  )
}

// ── RANKING GERAL: TODOS os times do jogo (amigos + CPUs), ordenados por
// TÍTULOS (Série A → B → C → D) e depois DINHEIRO, com desempate em cascata. ──
type Honors = { A: number; B: number; C: number; D: number }
const EMPTY_HONORS: Honors = { A: 0, B: 0, C: 0, D: 0 }
function RankingTab({ tables, honors, copaHonors, coins, clubCash, colors, youId }: { tables: Record<Div, SimTeam[]>; honors: Record<string, Honors>; copaHonors: Record<string, number>; coins: Record<number, number>; clubCash: Record<string, number>; colors: Record<number, FCol>; youId: number }) {
  const rows = DIVS.flatMap(d => tables[d]).map(t => {
    const key = teamKey(t)
    const olds = oldChain(key) // save antigo pode ter caixa/títulos em QUALQUER nome velho da corrente
    const pick = <V,>(rec: Record<string, V>): V | undefined => rec[key] ?? olds.map(o => rec[o]).find(v => v !== undefined)
    const money = t.human ? (coins[t.teamId] ?? 0) : Math.round(pick(clubCash) ?? 0)
    return { t, key, h: pick(honors) ?? EMPTY_HONORS, copas: pick(copaHonors) ?? 0, money }
  })
  rows.sort((a, b) => b.h.A - a.h.A || b.h.B - a.h.B || b.h.C - a.h.C || b.h.D - a.h.D || b.money - a.money || a.t.name.localeCompare(b.t.name))
  const top = rows.slice(0, 20)
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>🏆 RANKING GERAL</p>
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>Títulos (Série A › B › C › D) e depois dinheiro — top 20.</p>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Títulos</th><th style={{ ...th, textAlign: 'right' }}>💰</th></tr></thead>
        <tbody>
          {top.map((r, i) => {
            const you = r.t.teamId === youId && r.t.teamId >= 0
            const colored = r.t.human || r.t.rival
            const fc = colored ? colors[r.t.teamId] : undefined
            return (
              <tr key={r.key} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: fc?.light, fontWeight: colored ? 800 : 500 }}>
                <td style={{ paddingRight: 4, color: 'rgba(0,0,0,0.5)' }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, color: fc?.solid ?? INK }}>{you ? '👤 ' : r.t.rival ? '⚔️ ' : r.t.human ? '🔥 ' : ''}{(() => { const pk = you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(r.t.name)}</span> : r.t.name })()}</td>
                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {(r.h.A + r.h.B + r.h.C + r.h.D + r.copas) === 0 ? <span style={{ opacity: 0.3 }}>—</span> : <>
                    {r.copas > 0 && <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: INK, background: GOLD, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🏆Copa{r.copas > 1 ? r.copas : ''}</span>}
                    {(['A', 'B', 'C', 'D'] as Div[]).map(d => r.h[d] > 0 ? (
                      <span key={d} style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: '#fff', background: DIV_TAG[d].bg, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🏆{DIV_TAG[d].l}{r.h[d]}</span>
                    ) : null)}
                  </>}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', color: '#5a5647' }}>{r.money}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── TELA da temporada simulada da carreira online (toma o lugar da temporada
// ao vivo). O host conduz o ritmo (PLAY_ROUND avança a rodada, já sincronizado);
// os clientes seguem a rodada do estado. Tudo determinístico → mesma tabela. ──
// rodapé informativo da aba Tabelas: prêmios da temporada (moedas) por divisão —
// campeão, top-4 (acesso), queda e artilheiro. Valores vindos das constantes reais.
function PrizesBox() {
  const th: React.CSSProperties = { fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)', padding: '3px 4px', ...OSWALD }
  const td: React.CSSProperties = { fontSize: 12.5, fontWeight: 900, textAlign: 'center', padding: '4px 4px', ...OSWALD }
  return (
    <div style={{ ...box('#FFF6DE'), padding: 12, marginTop: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 6px' }}>🏆 Prêmios da temporada <span style={{ fontWeight: 700, fontSize: 10.5, color: 'rgba(0,0,0,0.55)' }}>(em 🪙 moedas)</span></p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...th, textAlign: 'left' }}>Série</th>
            <th style={th}>🏆 Campeão</th>
            <th style={th}>🔼 Top-4</th>
            <th style={th}>🔽 Queda</th>
            <th style={th}>⚽ Artilheiro</th>
          </tr></thead>
          <tbody>
            {DIVS.map(d => (
              <tr key={d} style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <td style={{ ...td, textAlign: 'left' }}>{DIV_NAME[d]}</td>
                <td style={{ ...td, color: '#1B7A3D' }}>+{CAMPEAO[d]}</td>
                <td style={{ ...td, color: '#1B7A3D' }}>+{ZONA[d]}</td>
                <td style={{ ...td, color: d === 'D' ? 'rgba(0,0,0,0.35)' : '#E8503A' }}>{d === 'D' ? '—' : `−${QUEDA[d]}`}</td>
                <td style={{ ...td, color: '#8a6d1f' }}>+{DIV_SCORER_BONUS[d]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,0.7)', lineHeight: 1.5 }}>
        <li><b>Top-4</b>: nas séries de baixo é <b>acesso</b> (sobe de divisão); na A é "manter entre os 4". Campeão da A leva os dois: <b>25 + 20 = 45</b>.</li>
        <li><b>Queda</b>: perde moedas ao cair. <b>Da Série D ninguém cai</b> (é a última).</li>
        <li><b>⚽ Artilheiro</b> de cada divisão: o valor vai pro <b>caixa do clube</b> e ainda sobe o <b>mesmo tanto no piso (valor)</b> do jogador pro próximo leilão.</li>
      </ul>
    </div>
  )
}

// chaveamento da Copa na aba Tabelas (fim de temporada). Toggle pra ver a
// classificação final das divisões. Confronto seu em destaque, tag de divisão
// em cada time e aviso de zebra quando um time de baixo elimina um de cima.
const CDTAG: Record<Div, { bg: string; c: string }> = { A: { bg: '#FFC400', c: '#0C0C0C' }, B: { bg: '#C3CCD8', c: '#0C0C0C' }, C: { bg: '#CD7F4A', c: '#fff' }, D: { bg: '#EDE6D0', c: '#0C0C0C' } }
const DIV_RANKN: Record<Div, number> = { A: 3, B: 2, C: 1, D: 0 }
const copaName = (t: SimTeam) => t.you ? `${t.name} (você)` : t.name
const copaDt = (d: Div) => <span style={{ fontWeight: 900, fontSize: 8.5, border: `1.5px solid ${INK}`, borderRadius: 5, padding: '0 4px', background: CDTAG[d].bg, color: CDTAG[d].c, flexShrink: 0 }}>{d}</span>
// ── DISPUTA DE PÊNALTIS animada: as cobranças aparecem uma a uma, alternando
// os times (verde = gol, vermelho = perdeu), e o total fecha no fim. A ordem
// das cobranças é sorteada de forma determinística a partir do próprio placar.
export function PensShootout({ pens, aName, bName }: { pens: [number, number]; aName: string; bName: string }) {
  // REGRA REAL: 5 cobranças alternadas; PARA na hora que decide (quem não
  // alcança mais nem batendo todas, acabou — as bolinhas restantes ficam
  // vazias). 6×5 = foi perfeito até o fim e decidiu na morte súbita.
  type Kick = { side: 0 | 1; ok: boolean }
  const rng = mulberry(((pens[0] * 31 + pens[1] * 7) ^ 0xA1B2) >>> 0)
  const win = pens[0] > pens[1] ? 0 : 1
  const seq: Kick[] = []
  const taken: [number, number] = [0, 0]
  const score: [number, number] = [0, 0]
  if (Math.max(pens[0], pens[1]) > 5) {
    // morte súbita (só existe como 6×5): 5 rodadas perfeitas + a 6ª que decide
    for (let r = 0; r < 5; r++) { seq.push({ side: 0, ok: true }, { side: 1, ok: true }) }
    seq.push({ side: win as 0 | 1, ok: true }, { side: (1 - win) as 0 | 1, ok: false })
    score[0] = pens[0]; score[1] = pens[1]; taken[0] = 6; taken[1] = 6
  } else {
    // espalha os gols de cada time nas 5 cobranças (ordem sorteada, mas SEMPRE
    // a mesma pra este placar) e anda cobrança a cobrança até decidir.
    const mk = (made: number) => {
      const idxs = [0, 1, 2, 3, 4]
      for (let i = 4; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idxs[i], idxs[j]] = [idxs[j], idxs[i]] }
      const arr = [false, false, false, false, false]
      idxs.slice(0, made).forEach(i => { arr[i] = true })
      return arr
    }
    const plan: [boolean[], boolean[]] = [mk(pens[0]), mk(pens[1])]
    outer: for (let r = 0; r < 5; r++) {
      for (const side of [0, 1] as const) {
        const ok = plan[side][r]
        seq.push({ side, ok }); taken[side]++; if (ok) score[side]++
        const rest = (t: 0 | 1) => 5 - taken[t]
        if (score[0] + rest(0) < score[1] || score[1] + rest(1) < score[0]) break outer
      }
    }
  }
  const nSlots = Math.max(pens[0], pens[1]) > 5 ? 6 : 5
  const step = 0.85, lead = 0.7
  // resultado de cada time na ORDEM das cobranças dele + índice global (delay)
  const rows: { ok: boolean; at: number }[][] = [[], []]
  seq.forEach((k, gi) => rows[k.side].push({ ok: k.ok, at: gi }))
  const totalDelay = lead + seq.length * step + 0.25
  const row = (name: string, r: { ok: boolean; at: number }[]) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3.5, justifyContent: 'center' }}>
      <span style={{ fontSize: 9, fontWeight: 900, ...OSWALD, maxWidth: 74, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>{name}</span>
      {Array.from({ length: nSlots }, (_, i) => {
        const k = r[i]
        if (!k) return <span key={i} style={{ width: 13, height: 13, borderRadius: 999, border: '1.5px dashed rgba(0,0,0,.3)', background: 'rgba(0,0,0,.05)', flexShrink: 0 }} />
        return <span key={i} style={{ width: 13, height: 13, borderRadius: 999, border: `1.5px solid ${INK}`, background: k.ok ? '#37D067' : '#F87168', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 900, lineHeight: 1, opacity: 0, animation: `pensPop .45s cubic-bezier(.2,1.5,.5,1) ${(lead + k.at * step).toFixed(2)}s forwards`, flexShrink: 0 }}>{k.ok ? '' : '✕'}</span>
      })}
    </div>
  )
  return (
    <div style={{ margin: '4px 0 0' }}>
      <style>{'@keyframes pensPop{0%{opacity:0;transform:scale(0)}70%{opacity:1;transform:scale(1.35)}100%{opacity:1;transform:scale(1)}}'}</style>
      <p style={{ fontSize: 9, fontWeight: 900, ...OSWALD, textAlign: 'center', color: '#B23B2E', margin: '0 0 3px', letterSpacing: 0.5 }}>🎯 DISPUTA DE PÊNALTIS{nSlots === 6 ? ' · MORTE SÚBITA' : ''}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {row(aName, rows[0])}
        {row(bName, rows[1])}
      </div>
      <p style={{ fontSize: 9.5, fontWeight: 900, ...OSWALD, textAlign: 'center', color: INK, margin: '3px 0 0', opacity: 0, animation: `pensPop .35s ease ${totalDelay.toFixed(2)}s forwards` }}>{score[0]} × {score[1]} {win === 0 ? 'pro ' + aName : 'pro ' + bName}</p>
    </div>
  )
}

// linha de um confronto JÁ DECIDIDO (agregado, pênaltis, zebra) — reusada no
// chaveamento e na lista "outros jogos da fase" ao vivo.
function CopaTieRow({ tie }: { tie: CopaTie }) {
  const you = tie.a.you || tie.b.you, aWin = tie.win === 'a'
  const winDiv = aWin ? tie.aDiv : tie.bDiv, loseDiv = aWin ? tie.bDiv : tie.aDiv
  const zebra = DIV_RANKN[winDiv] < DIV_RANKN[loseDiv]
  const side = (t: SimTeam, d: Div, win: boolean, away: boolean) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, justifyContent: away ? 'flex-end' : 'flex-start' }}>
      {!away && copaDt(d)}
      <span style={{ fontWeight: 700, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: win ? INK : '#9a9384', textDecoration: win ? 'none' : 'line-through', ...(t.you && win ? (() => { const pk = myApoioPerk(); return pk ? apoioText(pk) : {} })() : {}) }}>{copaName(t)}</span>
      {away && copaDt(d)}
    </span>
  )
  return (
    <div style={{ ...box(you ? '#FFF6D6' : '#fff'), border: `2.5px solid ${you ? '#B23B2E' : INK}`, boxShadow: `3px 3px 0 0 ${INK}`, padding: '7px 9px', marginBottom: 7 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
        {side(tie.a, tie.aDiv, aWin, false)}
        <span style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: INK, color: '#fff', borderRadius: 7, padding: '2px 8px', whiteSpace: 'nowrap' }}>{tie.aggA} × {tie.aggB}</span>
        {side(tie.b, tie.bDiv, !aWin, true)}
      </div>
      {tie.legs.length === 2
        ? <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '3px 0 0' }}>ida {tie.legs[0][0]}×{tie.legs[0][1]} · volta {tie.legs[1][0]}×{tie.legs[1][1]}</p>
        : <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '3px 0 0' }}>jogo único</p>}
      {tie.pens && <PensShootout pens={tie.pens} aName={tie.a.name} bName={tie.b.name} />}
      {zebra && <p style={{ fontSize: 9.5, fontWeight: 700, color: '#E8503A', textAlign: 'center', margin: '2px 0 0' }}>💥 zebra — Série {winDiv} eliminou Série {loseDiv}</p>}
    </div>
  )
}

// Um jogo da fase TOCANDO AO VIVO na posição `pos` do relógio da fase
// (0..nLegs*90). Mostra o placar do jogo ATUAL subindo minuto a minuto; no fim,
// o agregado, ida/volta e quem avançou. `big` = é o SEU jogo (destaque).
function CopaLiveMatch({ tie, pos, big, youColor }: { tie: CopaTie; pos: number; big?: boolean; youColor?: string }) {
  const legG = tie.legGoals.length ? tie.legGoals : [tie.goals]
  const nLegs = legG.length
  const total = nLegs * 90
  const done = pos >= total
  const legIdx = Math.min(nLegs - 1, Math.floor(pos / 90))
  const legMin = Math.min(90, Math.round(pos - legIdx * 90))
  const g = legG[legIdx] ?? []
  const curA = g.filter(x => x.home && x.min <= legMin).length
  const curB = g.filter(x => !x.home && x.min <= legMin).length
  const showA = done ? tie.aggA : curA
  const showB = done ? tie.aggB : curB
  const you = tie.a.you || tie.b.you
  const aWin = tie.win === 'a'
  const lastG = [...g].filter(x => x.min <= legMin).sort((x, y) => x.min - y.min).pop()
  const phaseLbl = nLegs === 1 ? '' : legIdx === 0 ? 'IDA' : 'VOLTA'
  const winName = aWin ? copaName(tie.a) : copaName(tie.b)
  const fs = big ? 13.5 : 11.5
  const nameStyle = (isA: boolean): React.CSSProperties => {
    const win = isA ? aWin : !aWin
    const mine = isA ? tie.a.you : tie.b.you
    return { fontWeight: big ? 800 : 700, fontSize: fs, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: done && !win ? '#9a9384' : (mine && youColor ? youColor : INK), textDecoration: done && !win ? 'line-through' : 'none' }
  }
  // no jogo de VOLTA (ao vivo), o mandante é o B — e mandante joga na ESQUERDA,
  // igual na vida real. Então inverte os lados (e o placar) só nesse leg.
  const swap = !done && legIdx === 1
  const L = { name: copaName(swap ? tie.b : tie.a), div: swap ? tie.bDiv : tie.aDiv, isA: !swap, score: swap ? showB : showA }
  const R = { name: copaName(swap ? tie.a : tie.b), div: swap ? tie.aDiv : tie.bDiv, isA: swap, score: swap ? showA : showB }
  return (
    <div style={{ ...box(you ? '#FFF6D6' : '#fff'), border: `${big ? 3 : 2}px solid ${you ? '#B23B2E' : INK}`, boxShadow: `${big ? 4 : 2}px ${big ? 4 : 2}px 0 0 ${INK}`, padding: big ? '9px 12px' : '6px 9px', marginBottom: big ? 9 : 6 }}>
      {!done && <p style={{ fontSize: big ? 10 : 9, fontWeight: 800, color: '#E8503A', textAlign: 'center', margin: '0 0 4px', ...OSWALD }}>🔴 {phaseLbl ? phaseLbl + ' · ' : ''}{legMin}'</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>{copaDt(L.div)}<span style={nameStyle(L.isA)}>{L.name}</span></span>
        <span style={{ fontWeight: 900, fontSize: big ? 18 : 13, ...OSWALD, background: INK, color: '#fff', borderRadius: 7, padding: big ? '3px 11px' : '2px 8px', whiteSpace: 'nowrap' }}>{L.score} × {R.score}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, justifyContent: 'flex-end' }}><span style={nameStyle(R.isA)}>{R.name}</span>{copaDt(R.div)}</span>
      </div>
      {!done
        ? (lastG ? <p style={{ fontSize: big ? 10 : 9, fontWeight: 700, color: '#5a5647', textAlign: 'center', margin: '3px 0 0', ...OSWALD }}>⚽ {lastG.name}</p> : null)
        : <>
            {/* volta invertida: mostra o mandante (B) primeiro, igual aos lados ao vivo */}
            {nLegs === 2 && <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '3px 0 0' }}>ida {tie.legs[0][0]}×{tie.legs[0][1]} · volta {tie.legs[1][1]}×{tie.legs[1][0]}</p>}
            {tie.pens && <PensShootout pens={tie.pens} aName={tie.a.name} bName={tie.b.name} />}
            <p style={{ fontSize: 9.5, fontWeight: 800, color: GREEN, textAlign: 'center', margin: '2px 0 0', ...OSWALD }}>✅ {winName} avança</p>
          </>}
    </div>
  )
}

// painel "Campeões da temporada": campeão + artilheiro (com o time do artilheiro)
// da Copa e de cada série A/B/C/D. Reutilizado na aba Tabelas e na tela de fim.
function ChampionsPanel({ copa, tables, scorers, seasonNo }: { copa: CopaResult; tables: Record<Div, SimTeam[]>; scorers?: SeasonScorer[]; seasonNo?: number }) {
  const champ = copa.champion
  const divs: Div[] = ['A', 'B', 'C', 'D']
  const topOf = (d: Div) => (scorers ?? []).filter(s => s.div === d).sort((a, b) => b.goals - a.goals)[0]
  const line = (icon: string, title: string, champName: string | undefined, champYou: boolean, top: { name: string; teamName: string; goals: number } | undefined) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'start', padding: '6px 0', borderTop: `1px solid ${INK}14` }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,.45)', textTransform: 'uppercase' }}>{icon} {title}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 900, ...OSWALD, color: champYou ? GREEN : INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏆 {champName ?? '—'}</span>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,.45)', textTransform: 'uppercase' }}>⚽ Artilheiro</span>
        {top
          ? <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4a4740', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><b>{top.name}</b> ({top.goals}) · <span style={{ color: 'rgba(0,0,0,.5)' }}>{top.teamName}</span></span>
          : <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,.4)' }}>—</span>}
      </span>
    </div>
  )
  return (
    <div style={{ ...box('linear-gradient(150deg,#FFF3CF,#FFE79A)'), padding: '10px 12px 12px', marginBottom: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 4px', textAlign: 'center' }}>🥇 Campeões da temporada{seasonNo ? ` ${seasonNo}` : ''}</p>
      {champ && line('🏆', 'Copa Legends', copaName(champ), !!champ.you, copa.topScorer ?? undefined)}
      {divs.map(d => line('🥇', DIV_NAME[d], tables[d]?.[0]?.name, !!tables[d]?.[0]?.you, topOf(d)))}
    </div>
  )
}
function CopaBracket({ copa, colors, youId, tables, ord, myDiv, reveal, scorers, seasonNo }: { copa: CopaResult; colors: Record<number, FCol>; youId: number; tables: Record<Div, SimTeam[]>; ord: Div[]; myDiv: Div | null; reveal: number; scorers?: SeasonScorer[]; seasonNo?: number }) {
  const champ = copa.champion
  const finished = reveal >= copa.rounds.length
  const shown = copa.rounds.slice(0, reveal) // fases já decididas
  const rounds = [...shown].reverse() // Final primeiro
  // A Copa aparece EM CIMA; logo abaixo, a classificação das divisões (a sua
  // em destaque). Sem toggle — as duas ficam empilhadas na mesma aba.
  return (
    <div>
      <div style={{ ...box('linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)'), padding: '11px 12px', marginBottom: 10, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD, margin: 0 }}>🏆 COPA LEGENDS</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.62)', margin: '2px 0 0' }}>Mata-mata dos 16 · top-4 de cada divisão · sorteio aleatório</p>
      </div>
      {finished && champ && (
        <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 30, lineHeight: 1, margin: 0 }}>🏆</p>
          <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: '2px 0 0', color: champ.you ? (colors[youId]?.solid ?? INK) : INK }}>{copaName(champ)}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginTop: 1 }}>CAMPEÃO DA COPA{copa.championDiv && copa.championDiv !== 'A' ? ` — e da Série ${copa.championDiv}! 🐣🔥` : '!'} <span style={{ color: '#8a6d1f' }}>+25 🪙</span></p>
          {copa.vice && <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', marginTop: 2 }}>🥈 Vice: {copaName(copa.vice)} <span style={{ color: '#8a6d1f' }}>+15 🪙</span></p>}
        </div>
      )}
      {/* CAMPEÕES DA TEMPORADA: campeão + artilheiro (com o time do artilheiro). */}
      {finished && <ChampionsPanel copa={copa} tables={tables} scorers={scorers} seasonNo={seasonNo} />}
      {shown.length === 0 && <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', textAlign: 'center' }}>A Copa está começando… 🔴</p>}
      {rounds.map(r => (
        <div key={r.name} style={{ marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '0 0 5px' }}>{r.name === 'Final' ? '🏁 Final' : r.name}</p>
          {r.ties.map((t, i) => <CopaTieRow key={i} tie={t} />)}
        </div>
      ))}
      {/* CLASSIFICAÇÃO das divisões logo abaixo da Copa — a sua em destaque */}
      <div style={{ borderTop: `2px dashed ${INK}22`, margin: '14px 0 10px' }} />
      <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '0 0 8px' }}>📊 Classificação das divisões{myDiv ? ' · a sua primeiro' : ''}</p>
      <PyramidTables tables={tables} order={myDiv ? [myDiv, ...ord.filter(d => d !== myDiv)] : ord} colors={colors} myDiv={myDiv} final />
      <PrizesBox />
    </div>
  )
}

// caixa do header com animação: quando o valor muda, sobe/desce um "+N" verde
// (ganhou: título, prêmio, artilharia, venda) ou "-N" vermelho (gastou no leilão).
// Como o header tem overflow:hidden, o número flutua PRA BAIXO (não corta em cima).
let coinKfInjected = false
function ensureCoinKeyframes() {
  if (coinKfInjected || typeof document === 'undefined') return
  coinKfInjected = true
  const s = document.createElement('style')
  s.textContent = '@keyframes coinPop{0%{opacity:0;transform:translate(-50%,-4px) scale(.7)}18%{opacity:1;transform:translate(-50%,3px) scale(1.15)}100%{opacity:0;transform:translate(-50%,20px) scale(1)}}@keyframes coinBump{0%,100%{transform:scale(1)}30%{transform:scale(1.18)}}'
  document.head.appendChild(s)
}
function CoinsBadge({ coins }: { coins: number }) {
  const prev = useRef(coins)
  const [pops, setPops] = useState<{ id: number; delta: number }[]>([])
  const [bump, setBump] = useState(0)
  useEffect(() => {
    const d = coins - prev.current
    prev.current = coins
    if (d !== 0 && Number.isFinite(d)) {
      ensureCoinKeyframes()
      const id = Date.now() + Math.random()
      setPops(p => [...p.slice(-3), { id, delta: d }]); setBump(b => b + 1)
      const t = setTimeout(() => setPops(p => p.filter(x => x.id !== id)), 1200)
      return () => clearTimeout(t)
    }
  }, [coins])
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span key={bump} title="Sua caixa de moedas (pra o leilão/mercado)" style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: GOLD, color: INK, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap', animation: bump ? 'coinBump .45s ease-out' : undefined }}>💰 {coins}</span>
      {pops.map(p => (
        <span key={p.id} style={{ position: 'absolute', left: '50%', top: '100%', fontWeight: 900, fontSize: 13.5, ...OSWALD, color: p.delta > 0 ? '#2ECC71' : '#FF5A4D', whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,.55)', animation: 'coinPop 1.2s ease-out forwards' }}>
          {p.delta > 0 ? `+${p.delta}` : p.delta} 🪙
        </span>
      ))}
    </span>
  )
}
export function PyramidSeasonScreen() {
  const { state, dispatch } = useEsc()
  const round = state.round
  const done = round >= 38
  const [tab, setTab] = useState<'jogos' | 'tabelas' | 'elenco' | 'ranking' | 'estadio'>('jogos')
  const [rankSub, setRankSub] = useState<'clubes' | 'arti'>('arti')
  const world = useMemo(() => buildPyramid(state.managers, state.managers[state.youIdx]?.id ?? 0, state.seed, state.deckLeague, state.careerPlacements, state.cpuSquads), [state.seed, state.managers.length, state.deckLeague, state.careerPlacements, state.seasonNo, state.cpuSquads])
  const careerTactics = (state.careerTactics ?? {}) as RoundTactics
  const careerLineup = (state.careerLineup ?? {}) as RoundLineups
  const capElite = (state.simV ?? 1) >= 2 ? 1.28 : 1.2 // temporada velha termina na fórmula velha
  const live = useMemo(() => simulatePyramid(world, state.seed, round, careerTactics, careerLineup, capElite), [world, state.seed, round, careerTactics, careerLineup, capElite])
  const matches = live.matches // os jogos da RODADA ATUAL — são eles que animam na tela
  // a TABELA de classificação (pontos) fica no estado de ANTES da partida que
  // está animando na sua tela — os pontos só entram quando o relógio dela acaba.
  // `revealed` = rodada cuja pontuação já pode aparecer (a atual só depois da anim).
  const [revealed, setRevealed] = useState(round)
  useEffect(() => {
    if (done || round <= 0) { setRevealed(round); return }
    setRevealed(round - 1) // segura a rodada atual enquanto a partida anima
    const t = setTimeout(() => setRevealed(round), Math.round(ROUND_MS * 0.86))
    return () => clearTimeout(t)
  }, [round, done])
  // 🙈 ANTI-SPOILER: a artilharia, os gols por jogador (ex.: "Romário 3") e os
  // líderes de artilharia saem da rodada JÁ REVELADA — não da atual. Sem isto,
  // os gols da partida apareciam ANTES dela animar (a tabela já segurava, mas a
  // artilharia entregava). Quando a rodada termina de animar (revealed = round),
  // tudo passa a vir da simulação completa (live), sem recomputar à toa.
  const shown = useMemo(() => revealed >= round ? live : simulatePyramid(world, state.seed, revealed, careerTactics, careerLineup, capElite), [live, revealed, round, world, state.seed, careerTactics, careerLineup, capElite])
  const { scorers, scorersAll, goalsByCard, divTop } = shown
  const tables = shown.tables
  const me = myStanding(tables)
  const hasMatches = round >= 1 && matches.D.length > 0
  const youId = state.managers[state.youIdx]?.id ?? 0
  const myTactic = tacAt(careerTactics, youId, round) // tática que vale do PRÓXIMO jogo em diante
  // coloridos = humanos (você/amigos) + rivais escolhidos (carreira offline)
  const humanKey = state.managers.filter(m => m.isHuman || m.rival).map(m => m.id).join(',')
  const colors = useMemo(() => playerColors(humanKey ? humanKey.split(',').map(Number) : [], youId, state.seed), [humanKey, youId, state.seed])
  const myCol = colors[youId] ?? { solid: APOIO_PERKS.bege.solid, light: APOIO_PERKS.bege.light }
  // COPA LEGENDS: no fim da temporada, o mata-mata dos 16 (determinístico da
  // classificação final + semente + temporada). Alimenta a aba Tabelas (chave),
  // a aba Rank (artilharia da Copa) e os prêmios da virada.
  const copa = useMemo(() => done ? computeCopa(tables, state.seed, state.seasonNo, capElite) : null, [done, tables, state.seed, state.seasonNo, capElite])
  // a Copa TOCA fase por fase (oitavas → quartas → semi → final), como a liga.
  // copaRound = fase ao vivo agora (0=oitavas). Zera a cada temporada nova.
  // se o save já assistiu a Copa desta temporada, começa JÁ finalizada (999 >= nº de
  // fases) — não re-anima do zero ao retomar; mostra direto os campeões/decisão.
  const [copaRound, setCopaRound] = useState(() => state.copaDoneSeason === state.seasonNo ? 999 : 0)
  const [copaPos, setCopaPos] = useState(0) // relógio da fase (0..nLegs*90) no nível da TELA (o placar fica em cima das abas)
  useEffect(() => { setCopaRound(state.copaDoneSeason === state.seasonNo ? 999 : 0); setCopaPos(0) }, [state.seasonNo, state.copaDoneSeason])
  const nCopaRounds = copa?.rounds.length ?? 0
  const copaPlaying = done && !!copa && nCopaRounds > 0 && copaRound < nCopaRounds
  const copaFinished = done && (!copa || nCopaRounds === 0 || copaRound >= nCopaRounds)
  // ao TERMINAR de animar a Copa, marca no save (pra não re-animar ao retomar)
  useEffect(() => {
    if (copaFinished && state.careerOnline && state.copaDoneSeason !== state.seasonNo) dispatch({ type: 'MARK_COPA_DONE' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished])
  // fase da Copa tocando agora (pra mostrar DISCRETO no cabeçalho, no lugar da divisão)
  const copaFase = copaPlaying && copa ? copa.rounds[copaRound] : null
  const copaFaseName = copaFase ? (copaFase.name === 'Final' ? 'Final' : copaFase.name) : ''
  const copaNLegs = copaFase ? (copaFase.name === 'Final' ? 1 : 2) : 1
  const copaFaseTotal = copaNLegs * 90
  const myCopaTie = copaFase?.ties.find(t => t.a.you || t.b.you) ?? null
  const otherCopaTies = copaFase ? copaFase.ties.filter(t => t !== myCopaTie) : []
  // cada JOGO rola ~COPA_LEG_MS (como uma partida da liga): toca a IDA inteira e
  // depois a VOLTA, todos os jogos juntos. Avança de fase quando termina + folga.
  useEffect(() => {
    if (!copaPlaying) return
    setCopaPos(0)
    const dur = copaNLegs * COPA_LEG_MS
    const t0 = Date.now()
    const iv = setInterval(() => setCopaPos(Math.min(copaFaseTotal, ((Date.now() - t0) / dur) * copaFaseTotal)), 90)
    const adv = setTimeout(() => setCopaRound(r => r + 1), dur + 2200)
    return () => { clearInterval(iv); clearTimeout(adv) }
  }, [copaPlaying, copaRound, copaNLegs, copaFaseTotal])
  // quando a Copa COMEÇA (temporada da liga encerrou), joga todo mundo pra aba
  // Jogos — é lá que a Copa toca ao vivo, em cima dos jogos. (Uma vez por temporada.)
  useEffect(() => { if (copaPlaying) setTab('jogos') }, [copaPlaying])
  // escalação (XI) do SEU time pro próximo jogo — pra aba Elenco (substituição)
  const mgrMe = state.managers[state.youIdx]
  const myXI = useMemo(() => (mgrMe ? lineupAt(careerLineup, youId, round, mgrMe.squad) : []), [careerLineup, youId, round, mgrMe])
  const myXIids = useMemo(() => new Set(myXI.map(c => c.id)), [myXI])

  // artilheiros de TODOS OS TEMPOS (acumulado entre temporadas) — top 20
  const allTimeScorers = useMemo(() => Object.values((state.careerScorersAll ?? {}) as Record<string, SeasonScorer>).sort((a, b) => b.goals - a.goals).slice(0, 20), [state.careerScorersAll])
  // ao FIM da temporada, soma os artilheiros dela no acumulado (uma vez por
  // temporada; o reducer é idempotente por statsSeason). Cada cliente pode
  // disparar — guests roteiam pro host, que grava e sincroniza.
  useEffect(() => {
    if (!done || !state.careerOnline) return
    if ((state.statsSeason ?? 0) >= state.seasonNo) return
    dispatch({ type: 'RECORD_SEASON_STATS', scorers: scorersAll.slice(0, 60) })
  }, [done, state.careerOnline, state.seasonNo, state.statsSeason]) // eslint-disable-line react-hooks/exhaustive-deps

  // MATERIALIZA a ficha dos 60 times de fundo (1x): antes eram recalculados na
  // hora; agora ganham elenco guardado, pra negociarem de verdade no mercado.
  // Idempotente (só semeia se ainda não existe).
  useEffect(() => {
    if (!state.careerOnline || state.cpuSquads) return
    dispatch({ type: 'SEED_CPU_SQUADS', squads: seedCpuSquads(state.managers, state.seed, state.deckLeague) })
  }, [state.careerOnline, state.cpuSquads, state.seed, state.deckLeague]) // eslint-disable-line react-hooks/exhaustive-deps

  // RANKING da carreira online: cada cliente grava o SEU resultado do fim da
  // temporada (título da sua divisão + artilharia geral) no esc_results — a
  // pirâmide não usa state.league, então o RankResultWriter do modo rápido não
  // pegava isso (por isso título/artilharia da carreira online não contavam).
  const rankWriteRef = useRef('')
  useEffect(() => {
    if (!done || !me || !state.careerOnline) return
    // chave da temporada: online usa o id da sala; offline (solo) usa a semente da
    // carreira (única por save), pra cada temporada contar sem colidir entre carreiras.
    const room = state.roomId || `solo${state.seed}`
    const key = `co:${room}:${state.seasonNo}`
    if (rankWriteRef.current === key) return
    rankWriteRef.current = key
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return // só técnico com cadastro entra no ranking
        const myTeam = tables[me.div]?.find(t => t.teamId === youId)
        const topScorer = scorers[0] // artilheiro geral da pirâmide (todas as divisões)
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? me.team)
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: state.roomId ? 'online' : 'cpu', season_key: key.slice(0, 48),
          champion: me.champ, top_scorer: topScorer?.teamId === youId,
          goals: myTeam?.gf ?? 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
  }, [done, state.careerOnline, state.roomId, state.seasonNo, state.seed]) // eslint-disable-line react-hooks/exhaustive-deps
  // 🏆 COPA LEGENDS: campeão do mata-mata das 4 divisões TAMBÉM leva um título no
  // ranking (agora que a Copa também dá carta). Linha à parte (season_key com
  // sufixo ":copa"), igual a Copa dos 8 do rápido — dá pra somar título de liga +
  // Copa na mesma temporada. Grava quando a Copa termina de animar e você venceu.
  const copaRankRef = useRef('')
  useEffect(() => {
    if (!copaFinished || !copa?.champion?.you || !state.careerOnline) return
    const room = state.roomId || `solo${state.seed}`
    const key = `co:${room}:${state.seasonNo}:copa`
    if (copaRankRef.current === key) return
    copaRankRef.current = key
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return // só técnico com cadastro entra no ranking
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? me?.team ?? 'Técnico')
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: state.roomId ? 'online' : 'cpu', season_key: key.slice(0, 48),
          champion: true, top_scorer: false, goals: 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished, copa?.champion?.you, state.careerOnline, state.roomId, state.seasonNo, state.seed])
  // substituição libera na 2ª temporada — INCLUSIVE no fim de temporada, pra você
  // já montar o time da próxima (a troca no fim não muda o campeonato que acabou;
  // o SET_LINEUP grava além da rodada 38 e só carrega pra próxima temporada).
  const canSub = state.seasonNo >= 2
  const [selId, setSelId] = useState<string | null>(null)
  // troca por SELEÇÃO: 1º toque marca o jogador; 2º toque num da MESMA posição do
  // outro lado (titular↔reserva) troca os dois. Toque em outro qualquer só remarca.
  const onTapPlayer = (cardId: string) => {
    if (!mgrMe) return
    const card = mgrMe.squad.find(c => c.id === cardId); if (!card) return
    if (selId === null || selId === cardId) { setSelId(selId === cardId ? null : cardId); return }
    const sel = mgrMe.squad.find(c => c.id === selId)
    const valid = sel && sel.pos === card.pos && (myXIids.has(sel.id) !== myXIids.has(card.id))
    if (!valid) { setSelId(cardId); return } // remarca
    const titularId = myXIids.has(sel.id) ? sel.id : card.id
    const reserveId = myXIids.has(sel.id) ? card.id : sel.id
    // o reserva entra EXATAMENTE na vaga do titular que saiu (mesmo índice do
    // array) — assim ele fica no mesmo lugar no campinho, sem embaralhar a linha.
    const ids = myXI.map(c => c.id)
    const idx = ids.indexOf(titularId)
    if (idx >= 0) ids[idx] = reserveId; else ids.push(reserveId)
    dispatch({ type: 'SET_LINEUP', mgrId: youId, ids })
    setSelId(null)
  }
  const myDiv = me?.div ?? null
  const ord = orderedDivs(myDiv)
  const myMatch = myDiv ? matches[myDiv]?.find(x => x.you) : undefined
  const humansOf = (d: Div) => tables[d].filter(t => t.human || t.rival).map(t => ({ name: t.name, teamId: t.teamId, you: t.you, rival: !!t.rival }))

  // host conduz: avança a rodada (isso sincroniza pra todos). Nos modos SOLO
  // dá pra pausar entre rodadas (manual) e o jogo roda +5s mais calmo.
  const [manualPref, toggleSim] = useSimMode()
  const manual = manualPref && state.onlineMode !== 'online'
  const roundMs = manual ? ROUND_MS + 10000 : ROUND_MS
  useEffect(() => {
    if (!state.isHost || done || manual) return
    const t = setTimeout(() => dispatch({ type: 'PLAY_ROUND' }), roundMs)
    return () => clearTimeout(t)
  }, [round, state.isHost, done, dispatch, manual, roundMs])

  return (
    <div style={{ minHeight: '100vh', background: '#F4ECD6', color: INK }}>
      <div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
        <div style={{ ...box(INK), position: 'relative', overflow: 'hidden', color: '#fff', marginBottom: 8 }}>
          <div style={{ padding: '12px 14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD }}>{copaPlaying ? `Temporada ${state.seasonNo} · 🏆 Copa Legends` : <>Temporada {state.seasonNo}{me ? ` · ${DIV_NAME[me.div]}` : ''}</>}</div>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 18, marginTop: 2, lineHeight: 1 }}>{copaPlaying ? copaFaseName : done ? 'Encerrada' : round === 0 ? 'Começando…' : <>Rodada <b style={{ fontSize: 21 }}>{round}</b><span style={{ fontSize: 12, opacity: 0.5, fontWeight: 700 }}> / 38</span></>}</div>
              {copaPlaying && <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginTop: 4, lineHeight: 1.3 }}>Os 4 melhores de cada série (A·B·C·D) no mata-mata</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              {!done && me && <span style={{ fontWeight: 800, fontSize: 12, ...OSWALD, border: '2px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>{me.pos === 1 ? '🥇' : '🏅'} {me.pos}º</span>}
              <CoinsBadge coins={state.careerCoins?.[youId] ?? 0} />
            </div>
          </div>
          {/* progresso da temporada: trilho ESCURO visível de ponta a ponta (não
              é mais um risquinho solto — lê como barra que está começando) */}
          {!done && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 6, width: '100%', background: '#2b2721' }}><div style={{ height: '100%', minWidth: 3, width: `${Math.min(100, Math.round(round / 38 * 100))}%`, background: `linear-gradient(90deg, ${GOLD}, #ffde5c)` }} /></div>}
        </div>

        {/* FIM da temporada: banner de campeão/colocação. AO VIVO: placar FIXO da
            sua partida — fica no topo em TODAS as abas, então dá pra trocar de aba
            e continuar vendo o resultado ao vivo. */}
        {done && me && (
          <div style={{ ...box(me.champ ? GOLD : '#fff'), padding: 12, marginBottom: 12, textAlign: 'center' }}>
            {me.champ
              ? <p style={{ fontWeight: 900, fontSize: 17, ...OSWALD, margin: 0 }}>🏆 CAMPEÃO DA {DIV_NAME[me.div].toUpperCase()}!</p>
              : <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🏁 {me.team} — {me.pos}º na {DIV_NAME[me.div]}</p>}
            {copaPlaying && <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '5px 0 0' }}>Fim da temporada da liga. Agora começa a <b>Copa Legends</b> — outro campeonato 👇</p>}
          </div>
        )}
        {/* A Copa ao vivo agora toca DENTRO da aba Jogos (em cima dos jogos). No
            FIM, o painel de campeões da temporada (Copa + séries + artilheiros)
            aparece expandido aqui; os botões de leilão/mesmo time ficam logo abaixo. */}
        {/* 📰 O MARTELO: jornal da temporada JÁ ABERTO — manchete única pra cada
            uma das 80 posições + os donos da temporada (campeões e artilheiros).
            O painel antigo de campeões saiu: o jornal cobre tudo aquilo. */}
        {copaFinished && me && (
          <SeasonJornal me={me} tables={tables} copa={copa} divTop={divTop} seasonNo={state.seasonNo} />
        )}
        {copaFinished && copa?.champion && (
          <button onClick={() => setTab('tabelas')} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,.5)', fontWeight: 800, fontSize: 11, ...OSWALD, margin: '-4px 0 12px', textDecoration: 'underline' }}>👉 ver o chaveamento da Copa na aba Tabelas</button>
        )}
        {!done && myMatch && me && <MyMatchCard m={myMatch} youName={me.team} col={myCol} colors={colors} roundKey={round} roundMs={roundMs} />}
        {state.onlineMode !== 'online' && state.isHost && !done && !copaPlaying && (
          <SimControls manual={manual} onToggle={toggleSim} canNext
            onNext={() => dispatch({ type: 'PLAY_ROUND' })}
            nextLabel={round === 0 ? '▶️ Começar a temporada' : '▶️ Próxima rodada'} />
        )}
        {/* COPA ao vivo: SEU jogo fica no MESMO lugar do placar da liga (em cima
            das abas) — suave, quase não muda o layout. Só quando você está na fase. */}
        {copaPlaying && myCopaTie && <div style={{ marginBottom: 12 }}><CopaLiveMatch tie={myCopaTie} pos={copaPos} big youColor={myCol.solid} /></div>}

        {copaFinished && me?.champ && state.careerOnline && (
          <div style={{ marginBottom: 12 }}>
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}`} origin={state.roomId ? 'online' : 'cpu'} />
          </div>
        )}
        {/* 🏆 Campeão da COPA LEGENDS (mata-mata dos 16) ganha carta À PARTE do
            título de divisão — pode ser um time diferente, ou o mesmo ganhando as
            duas. seasonKey própria (sufixo ":copa") pra não colidir com a de cima. */}
        {copaFinished && copa?.champion?.you && state.careerOnline && (
          <div style={{ marginBottom: 12 }}>
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}:copa`} origin={state.roomId ? 'online' : 'cpu'} />
          </div>
        )}
        {copaFinished && (() => {
          const humans = state.managers.filter(m => m.isHuman)
          const votes = state.seasonVotes ?? {}
          const myVote = votes[youId]
          const leilaoLabel = state.seasonNo === 1 ? 'Leilão de reservas' : 'Leilão de transferências'
          // prêmio do artilheiro de cada divisão: soma no caixa do time + sobe o piso
          const sb = scorerRewards(divTop)
          const cr = copaRewards(copa ?? { rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }) // campeão +25 · vice +15 · artilheiro +16 (caixa+piso)
          const mrg = (a: Record<string | number, number>, b: Record<string | number, number>) => { const o = { ...a }; for (const k in b) o[k] = (o[k] ?? 0) + b[k]; return o }
          const args = () => ({ placements: computePromotions(tables), rewards: mrg(mrg(seasonRewards(tables), sb.rewards), cr.rewards), clubRewards: mrg(mrg(clubRewards(tables), sb.clubRewards), cr.clubRewards), champions: seasonChampions(tables), scorerValues: mrg(sb.values, cr.values), copaChampion: cr.championKey })
          const openLeilao = () => dispatch({ type: 'OPEN_RESERVE_LIST', ...args() })
          const openMesmo = () => dispatch({ type: 'NEXT_SEASON_ONLINE', ...args() })
          // JOGO SOLO (host sozinho): sem votação, começa direto como antes.
          if (humans.length <= 1) return (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>📅 Próxima temporada</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas (por nome exato) já entram. {state.seasonNo === 1
                ? <>Abra o <b>leilão de reservas</b> (todos com a sua caixa, compram pra encher o banco até 22), ou siga com o mesmo elenco.</>
                : <>Abra o <b>leilão de transferências</b> (1 carta nova por posição + os jogadores que cada técnico listar), ou siga com o mesmo elenco.</>}</p>
              <button onClick={openLeilao} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GOLD, color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>🔨 {leilaoLabel}</button>
              <button onClick={openMesmo} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>▶️ Mesmo time (sem leilão)</button>
            </div>
          )
          // ONLINE com amigos: VOTAÇÃO. O host só inicia quando todos votam;
          // maioria vence, empate → o voto do host decide.
          const nLeilao = humans.filter(m => votes[m.id] === 'leilao').length
          const nMesmo = humans.filter(m => votes[m.id] === 'mesmo').length
          const nVoted = nLeilao + nMesmo
          const allVoted = nVoted === humans.length
          const pendentes = humans.filter(m => !votes[m.id])
          const pendNomes = pendentes.map(m => m.id === youId ? 'você' : m.name).join(', ')
          const start = () => { (nLeilao > nMesmo ? openLeilao : nMesmo > nLeilao ? openMesmo : (votes[youId] === 'leilao' ? openLeilao : openMesmo))() }
          const voteBtn = (v: 'leilao' | 'mesmo', label: string, bg: string, fg: string) => (
            <button onClick={() => dispatch({ type: 'CAST_SEASON_VOTE', mgrId: youId, vote: v })}
              style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 6px', fontWeight: 900, fontSize: 13, ...OSWALD, cursor: 'pointer', position: 'relative', background: myVote === v ? bg : '#fff', color: myVote === v ? fg : INK, boxShadow: myVote === v ? `3px 3px 0 0 ${INK}` : 'none' }}>
              {myVote === v && <span style={{ position: 'absolute', top: 3, right: 6, fontSize: 11 }}>✓</span>}{label}
            </button>
          )
          return (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>🗳️ Votação — próxima temporada</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas já entram. Todos votam: abrir o <b>{leilaoLabel.toLowerCase()}</b> {state.seasonNo === 1 ? '(encher o banco até 22)' : '(1 carta nova por posição + os listados)'} ou seguir com o <b>mesmo time</b>. Empate → o host decide.</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {voteBtn('leilao', `🔨 ${leilaoLabel}`, GOLD, INK)}
                {voteBtn('mesmo', '▶️ Mesmo time', GREEN, '#fff')}
              </div>
              <style>{'@keyframes coReady{0%,100%{transform:translateY(0);box-shadow:4px 4px 0 0 ' + INK + '}50%{transform:translateY(-2px);box-shadow:4px 6px 0 0 ' + INK + '}}'}</style>
              {/* chips: quem votou já está PRONTO (✓); quem falta pisca com ⏳ */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {humans.map(m => { const v = votes[m.id]; return (
                  <span key={m.id} style={{ fontSize: 10, fontWeight: 800, ...OSWALD, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', background: v ? (v === 'leilao' ? GOLD : GREEN) : '#fff', color: v === 'mesmo' ? '#fff' : INK, opacity: v ? 1 : 0.55 }}>
                    {v ? `${v === 'leilao' ? '🔨' : '▶️'} ${m.id === youId ? 'Você' : m.name} ✓` : `⏳ ${m.id === youId ? 'Você' : m.name}`}
                  </span>
                )})}
              </div>
              {state.isHost ? (
                <>
                  {allVoted
                    ? <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '0 0 7px', textAlign: 'center' }}>🔔 Todos votaram e estão prontos! Bora começar 👇</p>
                    : <p style={{ fontSize: 11, fontWeight: 700, color: '#8a6a2a', margin: '0 0 7px', textAlign: 'center' }}>⏳ Falta votar: <b>{pendNomes}</b></p>}
                  <button disabled={!allVoted} onClick={start}
                    style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, ...OSWALD, background: allVoted ? GREEN : '#cfcabb', color: '#fff', boxShadow: allVoted ? `4px 4px 0 0 ${INK}` : 'none', cursor: allVoted ? 'pointer' : 'not-allowed', animation: allVoted ? 'coReady 1.1s ease-in-out infinite' : undefined }}>
                    {allVoted ? '▶️ Começar próxima temporada' : `Aguardando votos… (${nVoted}/${humans.length})`}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {!myVote
                    ? <p style={{ fontSize: 12, fontWeight: 900, ...OSWALD, color: '#b23b2e', margin: '2px 0 0' }}>👆 Toque no seu voto — assim o host sabe que você tá pronto!</p>
                    : allVoted
                      ? <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '2px 0 0' }}>✅ Todos prontos! Cutuca o host pra apertar <b>Começar</b> 👊</p>
                      : <p style={{ fontSize: 11.5, fontWeight: 800, color: '#3a5a8a', margin: '2px 0 0' }}>✅ Pronto! Voto computado. Falta: <b>{pendNomes}</b>. O host começa logo depois.</p>}
                </div>
              )}
            </div>
          )
        })()}

        {/* abas em pílulas — a ativa fica na SUA cor. 🏟️ Estádio: só na carreira
            SOLO por enquanto (online precisa sincronizar as compras — etapa 2). */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(([['jogos', '🗓️', 'Jogos'], ['tabelas', '📊', 'Tabelas'], ['elenco', '👥', 'Elenco'], ['ranking', '🏆', 'Rank']] as [typeof tab, string, string][]).concat(state.onlineMode !== 'online' ? [['estadio', '🏟️', 'Estádio'] as [typeof tab, string, string]] : [])).map(([t, ic, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 2px', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', background: tab === t ? myCol.solid : '#fff', color: tab === t ? '#fff' : INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
          ))}
        </div>

        {tab === 'estadio' ? (
          <>
            <StadiumTab st={state.stadiums?.[youId]} coins={state.careerCoins?.[youId] ?? 0}
              onInvest={sec => dispatch({ type: 'STADIUM_INVEST', mgrId: youId, sector: sec })}
              onBuild={e => dispatch({ type: 'STADIUM_BUILD', mgrId: youId, ext: e })}
              filial={state.careerFilial}
              filialOptions={tables.D.filter(t => !t.you && !t.human && !t.rival).map(t => t.name).filter(t => !state.careerRivals.some(r => r.team === t))}
              filialInfo={(() => {
                const fn = state.careerFilial?.team
                if (!fn) return null
                for (const d of DIVS) { const i = tables[d].findIndex(t => t.name === fn); if (i >= 0) return { div: d, pos: i + 1 } }
                return null
              })()}
              onBuyFilial={team => dispatch({ type: 'BUY_FILIAL', team })}
              mySquad={state.managers[state.youIdx]?.squad}
              filialSquad={state.careerFilial ? (state.cpuSquads?.[state.careerFilial.team] as WonCard[] | undefined) : undefined}
              loanableOutIds={(() => {
                const sq = state.managers[state.youIdx]?.squad ?? []
                const fm = FORMATIONS[state.managers[state.youIdx]?.formation ?? '4-3-3']
                return new Set(sq.filter(c => !c.emprestado && sq.filter(x => x.pos === c.pos && !x.fake).length - 1 >= fm[c.pos]).map(c => c.id))
              })()}
              loanableInIds={(() => {
                const safSq = (state.careerFilial ? (state.cpuSquads?.[state.careerFilial.team] as WonCard[] | undefined) : undefined) ?? []
                const fm = FORMATIONS['4-3-3']
                return new Set(safSq.filter(c => !c.emprestado && safSq.filter(x => x.pos === c.pos && !x.fake).length - 1 >= fm[c.pos]).map(c => c.id))
              })()}
              onLoanTo={cardId => dispatch({ type: 'LOAN_TO_FILIAL', cardId })}
              onLoanFrom={cardId => dispatch({ type: 'LOAN_FROM_FILIAL', cardId })} />
            <GoldTeaser label="Ver o estádio DOURADO completo (prévia)">
              <div style={{ ...box('#FBF6E9'), padding: 12, position: 'relative' }}>
                <StadiumSvg st={{ inv: { geral: 60, cadeiras: 90, visitante: 120, camarote: 150 }, ext: ['refl', 'telao', 'loja', 'estac', 'grama', 'cober'] }} perkOverride={APOIO_PERKS.ouro} />
              </div>
            </GoldTeaser>
          </>
        ) : tab === 'ranking' ? (
          <>
            {/* sub-abas do Rank: Clubes | Artilheiros (temporada + todos os tempos) */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {([['arti', '⚽', 'Artilheiros'], ['clubes', '🥇', 'Clubes']] as [typeof rankSub, string, string][]).map(([s, ic, label]) => (
                <button key={s} onClick={() => setRankSub(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '8px 2px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', background: rankSub === s ? GOLD : '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
              ))}
            </div>
            {rankSub === 'clubes' ? (
              <RankingTab tables={tables} honors={(state.careerHonors ?? {}) as Record<string, Honors>} copaHonors={state.careerCopaHonors ?? {}} coins={state.careerCoins ?? {}} clubCash={state.clubCash ?? {}} colors={colors} youId={youId} />
            ) : (
              <>
                {/* durante a Copa (fim de temporada), a artilharia da COPA entra no
                    lugar da artilharia das divisões; o "todos os tempos" fica embaixo. */}
                {done && copa && copa.scorers.length > 0
                  ? <ArtilhariaBox scorers={copa.scorers} colors={colors} title="🏆 ARTILHARIA · COPA LEGENDS" sub="Gols do mata-mata da Copa — top 20." foot="🏅 O artilheiro da Copa rende +16 ao clube e sobe +16 no piso do jogador." />
                  : <ArtilhariaByDiv scorers={scorersAll} colors={colors} title="⚽ ARTILHARIA · TEMPORADA" sub="Gols da temporada atual — top 5 de cada série." foot="🏅 O artilheiro de cada série rende ao clube e vira piso do jogador: Série D +4 · C +8 · B +12 · A +16." />}
                <ArtilhariaBox scorers={allTimeScorers} colors={colors} title="🏆 ARTILHARIA · TODOS OS TEMPOS" sub="Gols somados de todas as temporadas da sala — top 20." foot={allTimeScorers.length === 0 ? 'Começa a contar a partir de agora.' : undefined} />
              </>
            )}
          </>
        ) : tab === 'elenco' ? (
          <>
            {/* tática do SEU time — POR JOGO, vale do PRÓXIMO jogo em diante. Agora
                fica AQUI no topo do elenco (era na aba Jogos). */}
            {!done && (
              <>
                {/* botões de tática MENORES que as abas do menu (pra não confundir) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 6 }}>
                  {([['retranca', '🧱 Retranca'], ['equilibrio', '⚖️ Equilíbrio'], ['ataque', '🔥 Ataque']] as [Tac, string][]).map(([t, label]) => (
                    <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: youId, tactic: t })}
                      style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '5px 0', fontWeight: 800, fontSize: 10.5, ...OSWALD, background: myTactic === t ? GOLD : '#fff', color: INK, boxShadow: myTactic === t ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647', textAlign: 'center', marginBottom: 10 }}><b>Tática e substituições</b> valem do <b>próximo jogo</b> em diante — o jogo que está rolando não muda. Ataque faz e toma mais · retranca segura mais · equilíbrio no meio.</p>
              </>
            )}
            <SquadTab mgr={state.managers[state.youIdx]} col={myCol} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]} goals={goalsByCard} onSwap={canSub ? onTapPlayer : undefined} selId={selId} seasonNo={state.seasonNo} />
            {me && (
              <ShareElencoBtn mgr={state.managers[state.youIdx]} col={myCol} xi={myXI as WonCard[]} xiIds={myXIids}
                goals={goalsByCard} divName={DIV_NAME[me.div]} tablePos={me.pos} seasonNo={state.seasonNo}
                coins={state.careerCoins?.[youId] ?? 0}
                titles={(() => { const h = state.careerHonors?.['m' + youId]; return h ? h.A + h.B + h.C + h.D : 0 })()} />
            )}
            <GoldTeaser label="Ver MEU elenco DOURADO (prévia)">
              <div style={{ maxHeight: 400, overflow: 'hidden', borderRadius: 16, position: 'relative' }}>
                <SquadTab mgr={state.managers[state.youIdx]} col={{ solid: '#C9A227', light: '#F6E9C0' }} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]} goals={goalsByCard} seasonNo={state.seasonNo} perkOverride={APOIO_PERKS.ouro} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: 'linear-gradient(180deg,transparent,#F4ECD6)', pointerEvents: 'none', zIndex: 2 }} />
              </div>
            </GoldTeaser>
          </>
        ) : tab === 'jogos' && hasMatches ? (
          copaPlaying && copaFase ? (
            /* Durante a COPA: SEU jogo já está no placar em cima das abas. Aqui na
               aba Jogos ficam os OUTROS jogos da fase, rolando junto (mesmo relógio),
               como os jogos das outras divisões apareciam na liga. */
            <>
              <p style={{ fontWeight: 900, fontSize: 11, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '2px 0 7px' }}>🏆 Copa · {copaFaseName} · {copaNLegs === 1 ? 'jogo único' : 'ida e volta'}</p>
              {otherCopaTies.map((t, i) => <CopaLiveMatch key={i} tie={t} pos={copaPos} />)}
            </>
          ) : (
          <>
            {done && myMatch && me && <MyMatchCard m={myMatch} youName={me.team} finished col={myCol} colors={colors} roundKey={round} />}
            {(() => { // FRASES COM EMOÇÃO (uma linha rotativa): clássico, artilheiro, zuação, queda, liderança
              if (!me) return null
              const RED = '#E8503A', PURPLE = '#6C43C0'
              const flavors: Flavor[] = []
              const nm = (id: number, name: string) => <span style={{ color: colors[id]?.solid ?? INK, fontWeight: 900 }}>{name}</span>
              const table = tables[me.div] ?? []
              const myIdx = table.findIndex(x => x.you)
              const myRank = DIVS.indexOf(me.div) // 0=A (topo) … 3=D
              // VARIA a redação pela rodada — mesma situação, frases diferentes,
              // pra ninguém ler a mesma linha 38 rodadas seguidas.
              const vary = <T,>(...opts: T[]): T => opts[round % opts.length]
              // 1) CLÁSSICO: sua partida é contra outro humano
              if (myMatch) {
                const oppName = myMatch.h === me.team ? myMatch.a : myMatch.h
                const opp = table.find(x => x.name === oppName)
                if (opp?.human) flavors.push({ c: RED, ic: '⚔️', tag: 'CLÁSSICO', node: <>Você x {nm(opp.teamId, oppName)} nesta rodada — não pode perder!</> })
              }
              // 2) ARTILHEIRO do seu time (arrebentando) — usa a lista COMPLETA
              //    (scorersAll), não o top-20 geral, senão os gols "somem" do corte.
              const mineTop = scorersAll.filter(s => s.teamId === youId).sort((a, b) => b.goals - a.goals)[0]
              if (mineTop && mineTop.goals >= 3) {
                const leagueTop = scorersAll.filter(s => s.div === me.div).sort((a, b) => b.goals - a.goals)[0]
                flavors.push(leagueTop?.name === mineTop.name
                  ? { c: GREEN, ic: '👑', tag: 'ARTILHEIRO', node: vary(
                      <><b>{mineTop.name}</b> é o artilheiro da {DIV_NAME[me.div]} — {mineTop.goals} gols!</>,
                      <>Ninguém segura: <b>{mineTop.name}</b> lidera a artilharia da {DIV_NAME[me.div]} com {mineTop.goals}!</>,
                      <>{mineTop.goals} gols do <b>{mineTop.name}</b> — a artilharia da {DIV_NAME[me.div]} tem dono!</>) }
                  : { c: GREEN, ic: '⚽', tag: 'EM ALTA', node: vary(
                      <><b>{mineTop.name}</b> tá voando: {mineTop.goals} gols pelo seu time!</>,
                      <>Fase iluminada do <b>{mineTop.name}</b> — já são {mineTop.goals} na temporada!</>,
                      <>Pode confiar: <b>{mineTop.name}</b> soma {mineTop.goals} gols e segue faminto!</>) })
              }
              // 2b) REFORÇOS: como vão suas contratações (leilão de reservas/mercado).
              //     Gols EXATOS por carta (goalsByCard) — nada de cobrar quem tá
              //     marcando. Elogia quem rende; a cobrança só pra MEI/ATA sem gol
              //     (zagueiro não é obrigado a marcar), só de vez em quando.
              const signings = (mgrMe?.squad ?? []).filter(c => (c as WonCard).reforco && !c.fake)
              if (signings.length) {
                const goalsOf = (c: PoolCard) => goalsByCard[c.id] ?? 0
                const best = signings.map(c => ({ c, g: goalsOf(c) })).sort((a, b) => b.g - a.g)[0]
                if (best && best.g >= 2) flavors.push({ c: GREEN, ic: '💸', tag: 'REFORÇO', node: vary(
                  <>Contratação <b>{best.c.name}</b> já fez {best.g} gols — dinheiro bem gasto!</>,
                  <><b>{best.c.name}</b> caiu como uma luva: {best.g} gols desde que chegou!</>,
                  <>O reforço <b>{best.c.name}</b> tá pagando o investimento — {best.g} gols!</>) })
                else if (round >= 10 && round % 3 === 0) {
                  const flop = signings.filter(c => goalsOf(c) === 0 && (c.pos === 'ATA' || c.pos === 'MEI')).sort((a, b) => ((b as WonCard).paid ?? 0) - ((a as WonCard).paid ?? 0))[0]
                  if (flop) flavors.push({ c: GOLD, ic: '👀', tag: 'REFORÇO', node: vary(
                    <>Contratação <b>{flop.name}</b> custou 💰{(flop as WonCard).paid} e ainda não desencantou…</>,
                    <>A torcida cobra: <b>{flop.name}</b> (💰{(flop as WonCard).paid}) segue sem marcar…</>,
                    <>Cadê o <b>{flop.name}</b>? 💰{(flop as WonCard).paid} investidos e o gol não sai…</>) })
                }
              }
              // 3) ZUAÇÃO de divisão: amigo numa série mais baixa (ou mais alta)
              const friends = state.managers.filter(m => m.isHuman && m.id !== youId)
                .map(m => { for (const d of DIVS) { const idx = tables[d].findIndex(x => x.teamId === m.id); if (idx >= 0) return { name: tables[d][idx].name, div: d, id: m.id, pos: idx + 1 } } return null })
                .filter((x): x is { name: string; div: Div; id: number; pos: number } => !!x)
              const below = friends.filter(f => DIVS.indexOf(f.div) > myRank).sort((a, b) => DIVS.indexOf(b.div) - DIVS.indexOf(a.div))[0]
              const above = friends.filter(f => DIVS.indexOf(f.div) < myRank).sort((a, b) => DIVS.indexOf(a.div) - DIVS.indexOf(b.div))[0]
              if (below) flavors.push({ c: PURPLE, ic: '😎', tag: 'ZUAÇÃO', node: <>Você na <b>{DIV_NAME[me.div]}</b> e o {nm(below.id, below.name)} lá na {DIV_NAME[below.div]} 👇</> })
              else if (above) flavors.push({ c: PURPLE, ic: '👀', tag: 'ZUAÇÃO', node: <>O {nm(above.id, above.name)} tá na <b>{DIV_NAME[above.div]}</b> — bora subir e alcançar!</> })
              // 3b) ZUAÇÃO: amigo afundando na zona de queda (últimos 4) da divisão dele
              const falling = friends.find(f => f.pos >= 17 && f.div !== 'D')
              if (falling) flavors.push({ c: PURPLE, ic: '📉', tag: 'ZUAÇÃO', node: <>O {nm(falling.id, falling.name)} tá afundando na zona de queda da {DIV_NAME[falling.div]}… 👋</> })
              // 4) QUEDA: você na zona de rebaixamento (últimos 4)
              if (myIdx >= 16 && me.div !== 'D') flavors.push({ c: RED, ic: '🚨', tag: 'PERIGO', node: vary(
                <>Você tá na zona de queda da {DIV_NAME[me.div]} — reage!</>,
                <>Alerta vermelho: Z4 da {DIV_NAME[me.div]}. Bora sair dessa!</>,
                <>A corda apertou na {DIV_NAME[me.div]} — cada ponto agora vale ouro!</>) })
              // 5) VIZINHO na tabela (liderança / perseguição) — sempre tem
              if (myIdx >= 0) {
                const rival = myIdx > 0 ? table[myIdx - 1] : table[myIdx + 1]
                if (rival) {
                  const gap = Math.abs(table[myIdx].pts - rival.pts); const pts = gap === 1 ? 'ponto' : 'pontos'
                  const tied = gap === 0 // mesmo nº de pontos — quem está acima leva no saldo
                  flavors.push(
                    myIdx === 0
                      // LÍDER: o rival (table[1]) está logo ABAIXO de você
                      ? (tied
                          ? { c: GOLD, ic: '🔥', tag: 'LÍDER', node: vary(
                              <>Você lidera no saldo! {nm(rival.teamId, rival.name)} empatou em pontos — não vacila.</>,
                              <>Liderança por um fio: {nm(rival.teamId, rival.name)} igualou os pontos, o saldo te segura!</>) }
                          : { c: GOLD, ic: '🔥', tag: 'LÍDER', node: vary(
                              <>Você é o líder! {nm(rival.teamId, rival.name)} cola {gap} {pts} atrás.</>,
                              <>Ponteiro! Mas {nm(rival.teamId, rival.name)} vem a {gap} {pts} — segura a coroa.</>,
                              <>Topo da tabela é seu — {nm(rival.teamId, rival.name)} sonha a {gap} {pts}.</>) })
                      // você NÃO é líder: o rival (table[myIdx-1]) está logo ACIMA, na sua frente
                      : tied
                        ? { c: GOLD, ic: '😤', tag: 'NA COLA', node: vary(
                            <>Você e {nm(rival.teamId, rival.name)} empatados em pontos — o saldo decide!</>,
                            <>Mesmos pontos que {nm(rival.teamId, rival.name)} — agora é no detalhe!</>) }
                        : gap <= 2
                          ? { c: GOLD, ic: '😤', tag: 'NA COLA', node: vary(
                              <>{nm(rival.teamId, rival.name)} tá só {gap} {pts} na sua frente. Vai deixar?</>,
                              <>Falta pouco: {gap} {pts} pra passar o {nm(rival.teamId, rival.name)}!</>,
                              <>O {nm(rival.teamId, rival.name)} já sente o teu bafo — {gap} {pts} de diferença.</>) }
                          : { c: GOLD, ic: '💪', tag: 'TABELA', node: vary(
                              <>{nm(rival.teamId, rival.name)} tá {gap} {pts} na sua frente — corre atrás!</>,
                              <>Meta da rodada: encostar no {nm(rival.teamId, rival.name)} ({gap} {pts}).</>,
                              <>Distância pro {nm(rival.teamId, rival.name)}: {gap} {pts}. Nada que uma boa sequência não resolva.</>) })
                }
              }
              return <RivalryTicker items={flavors} />
            })()}
            {ord.map(d => <DivMatches key={d} div={d} matches={matches[d]} colors={colors} humans={humansOf(d)} hideId={d === myDiv ? youId : undefined} />)}
          </>
          )
        ) : done && copa && copa.rounds.length > 0 ? (
          <CopaBracket copa={copa} colors={colors} youId={youId} tables={tables} ord={ord} myDiv={myDiv} reveal={copaFinished ? nCopaRounds : copaRound} scorers={scorers} seasonNo={state.seasonNo} />
        ) : (
          <>
            <PyramidTables tables={tables} order={ord} colors={colors} myDiv={myDiv} final={done} />
            <PrizesBox />
          </>
        )}

        {state.onlineMode === 'online' ? (
          <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
        ) : (
          <button
            onClick={() => { try { localStorage.setItem('esc-solo-career', JSON.stringify(state)); localStorage.setItem('esc-solo-career-at', String(Date.now())) } catch { /* cota cheia — ignora */ } savePyramidCloud(state, true); dispatch({ type: 'GO_LOBBY' }) }}
            style={{ width: '100%', marginTop: 16, border: `3px solid ${INK}`, borderRadius: 14, padding: '11px 13px', fontWeight: 900, fontSize: 14, background: '#fff', color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
            🚪 Sair e salvar carreira
            <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: '#5a5647', marginTop: 2 }}>Fica guardada nos seus saves — é só voltar e continuar de onde parou.</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── TELA DE VENDA ("Listar pra leilão", 45s): antes da compra, cada um escolhe
// quem manda pro leilão. Nunca deixa a posição abaixo do XI (formação). Quem só
// tem 11 não lista nada — só aguarda. O host começa o leilão (ou vai sozinho no 0). ──
export function ReserveListScreen() {
  const { state, dispatch } = useEsc()
  const mgr = state.managers[state.youIdx]
  const youId = mgr?.id ?? 0
  const listed = useMemo(() => new Set(state.reserveListed?.[youId] ?? []), [state.reserveListed, youId])
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(iv) }, [])
  const remaining = Math.max(0, Math.ceil(((state.phaseDeadline ?? 0) - now) / 1000))
  const humanIds = state.managers.filter(m => m.isHuman).map(m => m.id)
  const colors = useMemo(() => playerColors(humanIds, youId, state.seed), [humanIds.join(','), youId, state.seed])
  const col = colors[youId] ?? { solid: APOIO_PERKS.bege.solid, light: APOIO_PERKS.bege.light }
  const need = FORMATIONS[mgr?.formation ?? '4-3-3']
  // titulares/reservas = a SUA escalação REAL (com as trocas da temporada), não o
  // melhor-11 automático — o elenco tem que refletir o time em tempo real.
  const myXI = useMemo(() => lineupAt(state.careerLineup ?? {}, youId, state.round, mgr?.squad ?? []), [state.careerLineup, youId, state.round, mgr])
  const myXIids = useMemo(() => new Set(myXI.map(c => c.id)), [myXI])
  const marketUnlocked = state.seasonNo >= 3 // vender/negociar só libera na 3ª temporada
  const canList = (c: WonCard) => {
    if (!marketUnlocked || c.emprestado) return false // 🏢 jogador de empréstimo nunca é vendido — não é seu
    const listedInPos = [...listed].filter(id => mgr.squad.find(x => x.id === id)?.pos === c.pos).length
    const filledPos = mgr.squad.filter(x => x.pos === c.pos).length
    return filledPos - listedInPos - 1 >= need[c.pos]
  }
  // host conduz: quando zera o tempo, abre o leilão (compra) sozinho
  useEffect(() => {
    if (state.isHost && remaining <= 0) dispatch({ type: 'RESERVE_AUCTION_ONLINE' })
  }, [remaining, state.isHost, dispatch])
  // 🛟 estado incompleto (sem "meu time" por um instante — troca de fase / sync):
  // mostra uma tela de espera em vez de renderizar EM BRANCO (mesma proteção do
  // leilão). O host já avança sozinho pro leilão quando o tempo zera (efeito
  // acima), então ninguém fica preso aqui.
  if (!mgr) return (
    <div style={{ minHeight: '100vh', background: '#F4ECD6', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 40 }}>📋</p>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>Preparando o leilão de reservas…</p>
        <p style={{ fontWeight: 700, fontSize: 13, color: '#5a5647', marginTop: 4 }}>Só um instante.</p>
      </div>
    </div>
  )
  const nListed = state.reserveListed?.[youId]?.length ?? 0
  return (
    <div style={{ minHeight: '100vh', background: '#F4ECD6', color: INK }}>
      <div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
        <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>📋 LISTAR PRA LEILÃO · TEMP. {state.seasonNo}</span>
          <span style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: remaining <= 10 ? '#e8503a' : '#fff', color: remaining <= 10 ? '#fff' : INK, borderRadius: 8, padding: '2px 9px' }}>{remaining}s</span>
        </div>
        {/* aviso de desbloqueio da temporada */}
        {state.seasonNo === 2 && (
          <div style={{ ...box('#EAF3FF'), padding: 11, marginBottom: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px', color: '#2563EB' }}>🔓 Desbloqueado: Reservas!</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Agora você compra reservas pra encher o banco. A <b>venda/negociação de jogadores libera na 3ª temporada</b>.</p>
          </div>
        )}
        {state.seasonNo === 3 && (
          <div style={{ ...box('#EAF3FF'), padding: 11, marginBottom: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px', color: GREEN }}>🔓 Desbloqueado: Leilão de transferências!</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Agora você pode <b>listar jogadores pra leilão</b> (e disputá-los de volta).</p>
          </div>
        )}
        {marketUnlocked
          ? <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', margin: '0 0 12px' }}>Toque nos jogadores que você quer <b>pôr no leilão</b>. Você pode disputá-los de volta. Nunca dá pra ficar com menos de 11 (o XI completo).</p>
          : <div style={{ ...box('#FDECEA'), padding: 11, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, margin: '0 0 2px', color: '#c0392b' }}>🔒 Vender ainda não liberou</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Nesta temporada você só <b>compra</b> reservas (a venda libera na 3ª). E, de todo jeito, pra vender você precisa de <b>reservas no banco</b> — nunca dá pra ficar com menos de 11. Como você tem 11, não teria quem listar mesmo. É só aguardar o host começar o leilão. 👇</p>
            </div>}
        {marketUnlocked && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, background: nListed ? GOLD : 'rgba(0,0,0,0.06)', color: INK, border: `2px solid ${INK}`, borderRadius: 8, padding: '3px 10px' }}>📋 {nListed} no leilão</span>
          </div>
        )}
        {/* mesmo layout da aba Elenco (Titulares/Reservas), mas em modo listagem */}
        <SquadTab mgr={mgr} col={col} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]}
          list={{ listed, canList, onList: (id) => dispatch({ type: 'TOGGLE_RESERVE_LIST', mgrId: youId, cardId: id }) }} />
        {marketUnlocked && (
          <div style={{ ...box('#FFF3CF'), padding: '11px 13px', margin: '10px 0' }}>
            <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 4px', color: INK }}>💡 O que acontece ao listar</p>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#4a4740', margin: 0, lineHeight: 1.4 }}>
              Quem você lista vai a leilão: se alguém der lance, <b>você ganha as moedas</b> (pode render até mais). Se <b>ninguém comprar</b>, ele vai pro <b>monte valendo METADE</b>.
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', margin: '5px 0 0' }}>Obs.: a metade arredonda pra baixo — então só quem vale <b>1</b> (metade = 0,5) cai pra <b>0</b>.</p>
          </div>
        )}
        {state.isHost ? (
          <button onClick={() => dispatch({ type: 'RESERVE_AUCTION_ONLINE' })}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
            ▶️ Começar o leilão ({remaining}s)
          </button>
        ) : (
          <div style={{ ...box('#EAF3FF'), padding: 11, textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 12, color: '#3a5a8a', margin: 0 }}>⏱️ Liste quem quiser. O host começa o leilão em {remaining}s.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { DIV_LABEL, GREEN, INK, GOLD, OSWALD, box }
