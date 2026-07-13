// ─── MODO DINASTIA (teste — só criador) ──────────────────────────────
// Modo econômico à la Brasfoot/Elifoot num MUNDO FIXO: cada jogador vive
// num clube ano após ano. Comece duro na Série D, monte time no PREGÃO
// (leilão cego, com os rivais que você escolhe), suba de divisão e
// ENRIQUEÇA. Uma moeda só (Caixa): serve pro time E pra ostentação.
//
// Contratar craque de outro clube = LEILÃO DE CONTRATAÇÃO: você clica no
// jogador e o põe em leilão; o CLUBE DONO entra junto pra segurá-lo e
// outros clubes podem brigar. Maior lance leva (ou o dono mantém). Vender
// = leilão com risco.
//
// ISOLADO DE PROPÓSITO: estado próprio, localStorage próprio, overlay via
// hash #dinastia + trava no login do criador. NÃO toca em online / rápido /
// carreira — reusa só dados e matemática pura do jogo.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Card, EscState, FormationKey, Sector, WonCard } from './types'
import { CATALOG, DIVISION_TEAMS } from './data'
import { useEsc, sortedTable } from './store'
import { useIsAdmin } from './admin'
import { supabase } from '../lib/supabase'

// ─── visual (mesmos valores do resto do jogo — neubrutalista) ────────
const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const PURPLE = '#7C3AED'
const RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

type Division = 'A' | 'B' | 'C' | 'D'
const DIVS: Division[] = ['D', 'C', 'B', 'A']
const DIV_LABEL: Record<Division, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
// vagas por posição conforme a formação (só o SEU time varia; o mundo é 4-3-3)
const FORM_NEED: Record<FormationKey, Record<Sector, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const SECTOR_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque' }
const START_COINS = 50

// ─── RNG ──────────────────────────────────────────────────────────────
function mulberry(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ─── pool ──────────────────────────────────────────────────────────────
type PoolCard = Card
function buildPool(): PoolCard[] {
  const out: PoolCard[] = []
  ;(Object.keys(CATALOG) as Sector[]).forEach(pos => { CATALOG[pos].forEach((c, i) => out.push({ ...c, pos, id: `${pos}-${i}` })) })
  return out
}
const POOL = buildPool()
const mid = (c: PoolCard) => (c.lo + c.hi) / 2

let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Café com Leite', 'Pastelão', 'Meia-Boca']
function filler(pos: Sector, rng: () => number): PoolCard {
  const lo = 44 + Math.floor(rng() * 8)
  return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 12 + Math.floor(rng() * 6) }
}

// ─── valor ──────────────────────────────────────────────────────────────
// qualidade REAL (nível oculto) — é o que dono/rivais enxergam mesmo num jogador
// que nunca teve preço de mercado. NÃO é exibido ao jogador.
function baseValue(c: PoolCard): number { return Math.max(1, Math.round(Math.pow(Math.max(0, mid(c) - 44) / 8, 1.8))) }

// ─── simulação ──────────────────────────────────────────────────────────
function poisson(l: number, rng: () => number): number { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
function sectorPow(rolls: number[]): number { if (rolls.length === 0) return 40; const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length; const min = Math.min(...rolls); return avg - (avg - min) * 0.35 }
type Tac = 'retranca' | 'equilibrio' | 'ataque'
const TACS: Tac[] = ['retranca', 'equilibrio', 'ataque']
function rollForm(squad: PoolCard[], tac: Tac, opp: Tac, rng: () => number) {
  const rolls = squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  let insp = false
  for (const r of rolls) if (r.c.hi - r.c.lo >= 14 && r.lvl >= r.c.hi - 2.5) insp = true
  const by = (p: Sector) => sectorPow(rolls.filter(r => r.c.pos === p).map(r => r.lvl))
  const gol = by('GOL'), lat = by('LAT'), zag = by('ZAG'), mei = by('MEI'), ata = by('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tac === 'retranca') { def += 4; atk -= 3 } if (tac === 'ataque') { atk += 4; def -= 3 } if (tac === 'equilibrio') { atk += 1; def += 1 }
  if (tac === 'retranca' && opp === 'ataque') def += 2.5
  if (tac === 'ataque' && opp === 'equilibrio') atk += 2.5
  if (tac === 'equilibrio' && opp === 'retranca') atk += 2.5
  if (insp) atk += 2
  return { atk, def }
}
interface SimTeam { name: string; you: boolean; wt: WTeam | null; squad: PoolCard[]; pts: number; w: number; d: number; l: number; gf: number; ga: number }
interface Scorer { id: string; name: string; teamName: string; div: Division; goals: number }
function buildFixtures(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i), rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}
// simula um conjunto de rodadas (fatia do calendário), acumulando na tabela e
// na artilharia passadas — permite jogar em dois turnos (janela no meio).
function simFixtures(teams: SimTeam[], div: Division, rng: () => number, scorers: Map<string, Scorer>, rounds: [number, number][][]): void {
  const credit = (t: SimTeam, goals: number) => {
    for (let g = 0; g < goals; g++) {
      const pool = t.squad.map(c => ({ c, w: c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05 }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { id: pick.id, name: pick.name, teamName: t.name, div, goals: 1 })
    }
  }
  for (const round of rounds) for (const [hi, ai] of round) {
    const H = teams[hi], A = teams[ai]
    const th = H.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const ta = A.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.squad, th, ta, rng), fa = rollForm(A.squad, ta, th, rng)
    const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25), la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg; credit(H, hg); credit(A, ag)
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
  }
}
const sortTable = (t: SimTeam[], rng: () => number) => t.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || rng() - 0.5)

// ─── mundo fixo ──────────────────────────────────────────────────────
interface WTeam { name: string; div: Division; squad: PoolCard[]; rival?: boolean }
// ciclo da temporada: janela pré (só da 2ª temporada) → 1º turno → janela do
// meio → returno → resultado. 's1FirstHalf' = pós-pregão da 1ª temporada (sem
// janela pré). canTrade só nas janelas 'preWindow' e 'midWindow'.
type Stage = 's1FirstHalf' | 'preWindow' | 'midWindow'
interface TeamStand { name: string; pts: number; w: number; d: number; l: number; gf: number; ga: number }
interface PartialSeason { standings: Record<Division, TeamStand[]>; scorers: Scorer[] }
const SAVE_KEY = 'esc_dinastia_v2'
interface Save {
  seed: number; clubName: string; formation: FormationKey; division: Division; seasonNo: number
  coins: number; luxury: string[]; titles: number
  squad: WonCard[]; world: WTeam[]
  stage: Stage; partial?: PartialSeason // meio de temporada guarda o 1º turno
  worldGoals: Record<string, number> // gols da última temporada (mundo todo) p/ valorização
  goalsLast: Record<string, number>; championLast: boolean
  contracts?: Record<string, { until: number; floor: number }> // até que temporada + piso (último preço pago)
  requested?: string[] // jogadores que você pediu pro leilão desta janela
  monte?: PoolCard[] // livres: dispensados que ninguém pagou o mínimo; pegáveis de graça
  lastTable?: TeamStand[] // classificação FINAL da sua divisão na última temporada
  lastScorers?: { name: string; teamName: string; goals: number }[] // artilharia da SUA divisão (última temp.)
  crest?: { c1: string; c2: string; symbol: string } // identidade: 2 cores + símbolo (escudo)
  tactic?: Tac // tática escolhida no elenco (equilíbrio por padrão)
  lastResult?: { pos: number; move: 'up' | 'down' | 'stay'; prevDiv: Division; champion: boolean }
}
const CONTRACT = 5 // temporadas de contrato de todo jogador comprado no leilão
const DEFAULT_CREST = { c1: '#1B7A3D', c2: '#FFC400', symbol: '⚽' }
// paletas de identidade — básicas sempre; "premium" desbloqueia conforme sobe
const CREST_COLORS = ['#1B7A3D', '#E8503A', '#2563EB', '#0C0C0C', '#7C3AED', '#F5B301', '#0EA5A5', '#B23A2A', '#EC4899', '#64748B', '#FFFFFF', '#166332']
const CREST_SYMBOLS_BASIC = ['⚽', '🦁', '🐆', '🦅', '🐍', '⭐', '🔥', '⚔️', '🛡️', '👑']
const CREST_SYMBOLS_PREMIUM: Record<Division, string[]> = { D: [], C: ['🐉', '🦊'], B: ['🦈', '💀', '🐺'], A: ['🏆', '💎', '👽', '🚀'] } // desbloqueia por divisão alcançada
const PREMIUM_SET = new Set(Object.values(CREST_SYMBOLS_PREMIUM).flat())
const CREST_PRICE = 10        // trocar a identidade custa moedas (comprado no shopping)
const CREST_PRICE_PREMIUM = 25 // símbolo premium (desbloqueado por divisão) custa mais
// sem reservas por enquanto — todo time tem 11; ao contratar, o pior da posição sai
// PISO = só o último preço pago (contrato). Quem NUNCA foi comprado não tem piso
// (undefined): o leilão dele abre sem mínimo, e o preço pago vira o valor eterno.
const floorOf = (save: Save, c: PoolCard): number | undefined => save.contracts?.[c.id]?.floor
const goalW = (pos: Sector) => pos === 'ATA' ? 0.8 : pos === 'MEI' ? 0.6 : pos === 'LAT' ? 0.35 : 0.25
const contractUntil = (save: Save, id: string) => save.contracts?.[id]?.until ?? -1
const underContract = (save: Save, id: string) => contractUntil(save, id) >= save.seasonNo
const setContract = (save: Save, id: string, price: number): Record<string, { until: number; floor: number }> =>
  ({ ...(save.contracts ?? {}), [id]: { until: save.seasonNo + CONTRACT, floor: price } })
function loadSave(): Save | null { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function writeSave(s: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* cheio */ } }
// valor de mercado = último preço pago + desempenho (gols). undefined = novo no
// mercado (nunca teve preço). Rivais/dono ainda enxergam a qualidade real (nível).
function valueOf(save: Save, c: PoolCard): number | undefined {
  const f = floorOf(save, c); if (f === undefined) return undefined
  return Math.round(f + (save.worldGoals?.[c.id] ?? 0) * goalW(c.pos))
}
function myValue(save: Save, c: WonCard): number {
  const f = floorOf(save, c) ?? Math.max(1, c.paid)
  return Math.round(f + (save.goalsLast?.[c.id] ?? 0) * goalW(c.pos) + (save.championLast ? 4 : 0))
}

// dá um jogador a um time mantendo 11 (bancando o pior do setor)
function giveToTeam(squad: PoolCard[], card: PoolCard): PoolCard[] {
  const next = [...squad, card]
  const atPos = next.filter(c => c.pos === card.pos).sort((a, b) => mid(b) - mid(a))
  if (atPos.length > NEED[card.pos]) { const drop = atPos[atPos.length - 1]; return next.filter(c => c.id !== drop.id) }
  return next
}
// distribui cartas em N times respeitando a formação
function dealSquads(bucket: PoolCard[], nTeams: number, rng: () => number): PoolCard[][] {
  const squads: PoolCard[][] = Array.from({ length: nTeams }, () => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of bucket) byPos[c.pos].push(c)
  for (const p of SECTORS) { const list = shuffle(byPos[p], rng); for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < nTeams; t++) squads[t].push(list.shift() ?? filler(p, rng)) }
  return squads
}

const mkSim = (name: string, squad: PoolCard[], you: boolean, wt: WTeam | null): SimTeam => ({ name, you, wt, squad, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
// escala o MELHOR XI (reservas ficam no banco e não distorcem a força/artilharia)
function bestXI(squad: PoolCard[], need: Record<Sector, number> = NEED): PoolCard[] {
  const out: PoolCard[] = []
  for (const p of SECTORS) { const cands = squad.filter(c => c.pos === p).sort((a, b) => mid(b) - mid(a)); for (let i = 0; i < need[p] && i < cands.length; i++) out.push(cands[i]) }
  return out
}

// ─── UI helpers (espelham Box/Btn/CardFace do jogo) ──────────────────
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
function Btn({ children, onClick, bg = GOLD, color = INK, disabled }: { children: React.ReactNode; onClick?: () => void; bg?: string; color?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="active:translate-x-[2px] active:translate-y-[2px]" style={{ width: '100%', boxSizing: 'border-box', background: bg, color, opacity: disabled ? 0.4 : 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '12px 16px', fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.03em', cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : `4px 4px 0 0 ${INK}`, ...OSWALD }}>{children}</button>
}
// chip de posição igual ao CardFace do jogo
const Pos = ({ p }: { p: Sector }) => <span style={{ fontSize: 10, fontWeight: 900, background: INK, color: '#fff', borderRadius: 99, padding: '1px 7px', border: `2px solid ${INK}` }}>{p}</span>

// mundo fixo a partir do resultado do LEILÃO REAL: você + os RIVAIS que você
// escolheu ficam na Série D com os elencos montados no pregão. O resto do
// catálogo (por nome, tirando o que vocês pegaram) é distribuído por FORÇA nas
// divisões — A mais forte, D mais fraca — mantendo a pirâmide certa. O que
// sobrou de moedas no leilão fica no Caixa do clube.
function buildSaveFromAuction(state: EscState): Save {
  const seed = state.seed
  const rng = mulberry((seed ^ 0x1234) >>> 0)
  const you = state.managers[state.youIdx]
  const yourSquad: WonCard[] = you.squad.map(c => ({ ...c }))
  const rivals = state.managers.filter(m => !m.isHuman && m.auctionRival)
  const rivalTeams = new Set(rivals.map(m => m.teamName))
  const excl = new Set<string>()
  for (const c of yourSquad) excl.add(c.name)
  for (const r of rivals) for (const c of r.squad) excl.add(c.name)
  const rest = shuffle(POOL.filter(c => !excl.has(c.name)), rng).sort((a, b) => mid(b) - mid(a))
  const q = Math.ceil(rest.length / 4)
  const bucket: Record<Division, PoolCard[]> = { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2, q * 3), D: rest.slice(q * 3) }
  const world: WTeam[] = rivals.map(r => ({ name: r.teamName, div: 'D' as Division, squad: r.squad.map(c => ({ ...c })) as PoolCard[], rival: true }))
  for (const div of DIVS) {
    const names = DIVISION_TEAMS[div].map(t => t.team).filter(n => !rivalTeams.has(n))
    const count = div === 'D' ? (20 - 1 - rivals.length) : 20
    const fillerNames = names.slice(0, count)
    const dealt = dealSquads(bucket[div], fillerNames.length, rng)
    fillerNames.forEach((nm, i) => world.push({ name: nm, div, squad: dealt[i] }))
  }
  const contracts: Record<string, { until: number; floor: number }> = {}
  for (const c of yourSquad) contracts[c.id] = { until: 1 + CONTRACT, floor: Math.max(1, c.paid) } // todo mundo 5 temporadas (até temp. 6)
  return { seed, clubName: you.teamName, formation: you.formation, division: 'D', seasonNo: 1, coins: you.money, luxury: [], titles: 0, squad: yourSquad, world, stage: 's1FirstHalf', worldGoals: {}, goalsLast: {}, championLast: false, contracts, requested: [], monte: [], crest: DEFAULT_CREST }
}

// FIM da temporada REAL: pega o resultado do motor (posição/campeão/artilharia
// da sua divisão) + simula as outras 3 divisões (artilharia geral + pirâmide),
// paga o prêmio no Caixa, resolve sobe/desce e abre a janela pra próxima.
function processDinastiaEnd(state: EscState, existing: Save | null): Save {
  const you = state.managers[state.youIdx]
  const engTable = sortedTable(state.league)
  const yourPos = engTable.findIndex(t => t.id === you.id) + 1
  const youChampion = engTable[0]?.id === you.id
  // usa o elenco do SAVE (inclui compras/vendas da janela do meio, que só valem
  // pra próxima temporada) — não o snapshot do motor, que é o time que jogou.
  const base: Save = existing ? { ...existing } : buildSaveFromAuction(state)
  const div = base.division
  const rng = mulberry((base.seed ^ (base.seasonNo * 131 + 7)) >>> 0)
  const scorers = new Map<string, Scorer>()
  // classificação FINAL da sua divisão (do motor) — seu time com o nome limpo
  const lastTable: TeamStand[] = engTable.map(t => ({ name: t.id === you.id ? base.clubName : t.name, pts: t.pts, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga }))
  // artilharia da SUA divisão (do motor) — só ela, sem o geral das 4 divisões
  const lastScorers = state.scorers.map(sc => ({ name: sc.name, teamName: sc.teamId === you.id ? base.clubName : sc.teamName, goals: sc.goals })).sort((a, b) => b.goals - a.goals).slice(0, 20)
  // ordem REAL da sua divisão (seu time é o id do humano; resto pelo nome do mundo)
  const tables: Record<Division, (WTeam | null)[]> = { A: [], B: [], C: [], D: [] }
  tables[div] = engTable.map(t => t.id === you.id ? null : (base.world.find(w => w.div === div && w.name === t.name) ?? null))
  // outras 3 divisões: sim abstrato (só pra pirâmide sobe/desce + valorização por gols)
  for (const d of DIVS) {
    if (d === div) continue
    const teams = base.world.filter(w => w.div === d).map(w => mkSim(w.name, bestXI(w.squad), false, w))
    simFixtures(teams, d, rng, scorers, buildFixtures(teams.length))
    tables[d] = sortTable(teams, rng).map(t => t.wt)
  }
  // valor dinâmico: gols dos SEUS jogadores (por nome, do motor)
  const goalsLast: Record<string, number> = {}
  for (const c of base.squad) { const sc = state.scorers.find(s => s.name === c.name && s.teamId === you.id); if (sc) goalsLast[c.id] = sc.goals }
  const worldGoals: Record<string, number> = {}
  for (const s of scorers.values()) worldGoals[s.id] = Math.max(worldGoals[s.id] ?? 0, s.goals)
  // sobe/desce toda a pirâmide (sua divisão pela ordem REAL; resto pela sim)
  const newDivOf = new Map<WTeam, Division>()
  for (const w of base.world) newDivOf.set(w, w.div)
  let newDivision = div
  for (let i = 0; i < 3; i++) {
    const L = DIVS[i], U = DIVS[i + 1]
    for (const ref of tables[L].slice(0, 4)) { if (ref) newDivOf.set(ref, U); else newDivision = U }
    for (const ref of tables[U].slice(16)) { if (ref) newDivOf.set(ref, L); else newDivision = L }
  }
  const newWorld = base.world.map(w => ({ ...w, div: newDivOf.get(w) ?? w.div }))
  const prizeBase = { D: 20, C: 35, B: 60, A: 110 }[div]
  const posF = yourPos === 1 ? 1 : yourPos <= 4 ? 0.7 : yourPos <= 12 ? 0.4 : 0.2
  const prize = Math.round(prizeBase * posF) + (youChampion ? Math.round(prizeBase * 0.3) : 0)
  const move: 'up' | 'down' | 'stay' = newDivision === div ? 'stay' : DIVS.indexOf(newDivision) > DIVS.indexOf(div) ? 'up' : 'down'
  return {
    ...base, world: newWorld, division: newDivision, seasonNo: base.seasonNo + 1,
    stage: 'preWindow', requested: [], monte: base.monte ?? [], lastTable, lastScorers,
    coins: base.coins + prize, titles: base.titles + (youChampion ? 1 : 0),
    worldGoals, goalsLast, championLast: youChampion,
    lastResult: { pos: yourPos, move, prevDiv: div, champion: youChampion },
  }
}

// ─── raiz (overlay) ──────────────────────────────────────────────────
export function DinastiaGame() {
  const isAdmin = useIsAdmin()
  const { state, dispatch } = useEsc()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#dinastia')
  useEffect(() => { const f = () => setOpen(window.location.hash === '#dinastia'); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  // HANDOFF 1: acabou o LEILÃO (cerimônia → temporada) e ainda não há save →
  // é a 1ª temporada: constrói o mundo fixo a partir do elenco montado e joga a
  // temporada REAL contra os times da sua divisão no mundo (não contra os bots
  // do leilão) — pra a temporada 1 e as seguintes serem contra os MESMOS times.
  const builtWorld = useRef(false)
  useEffect(() => {
    if (state.dinastia && state.screen === 'season' && !loadSave() && !builtWorld.current) {
      builtWorld.current = true
      const save = buildSaveFromAuction(state)
      writeSave(save)
      const others = save.world.filter(w => w.div === save.division).map(w => ({ name: w.name, squad: w.squad }))
      const sym = save.crest?.symbol ?? ''
      const rivals = save.world.filter(w => w.rival).map(w => ({ team: w.name, name: w.name, division: w.div }))
      dispatch({ type: 'START_DINASTIA_SEASON', teamName: sym ? `${sym} ${save.clubName}` : save.clubName, formation: save.formation, division: save.division, seasonNo: 1, squad: save.squad, others, rivals })
    }
    if (state.screen !== 'season') builtWorld.current = false
  }, [state.dinastia, state.screen]) // eslint-disable-line react-hooks/exhaustive-deps
  // HANDOFF 2: a TEMPORADA REAL acabou (tela de fim). Ao abrir a janela de
  // transferências, a economia processa o resultado do motor (posição, campeão,
  // artilharia), paga o prêmio, resolve sobe/desce e segue.
  const handled = useRef(false)
  useEffect(() => {
    if (open && state.dinastia && state.screen === 'end' && !handled.current) {
      handled.current = true
      writeSave(processDinastiaEnd(state, loadSave()))
      dispatch({ type: 'GO_LOBBY' }) // fecha o motor; a economia assume no overlay
    }
    if (state.screen !== 'end') handled.current = false
  }, [open, state.dinastia, state.screen]) // eslint-disable-line react-hooks/exhaustive-deps
  // se algo dentro do modo navegar pro álbum/ranking (ex.: "ver meu álbum" do
  // prêmio de campeão), fecha o overlay pra mostrar a tela do jogo.
  useEffect(() => { if (open && (state.screen === 'album' || state.screen === 'ranking')) window.location.hash = '' }, [open, state.screen])
  // JANELA DO MEIO: a temporada pausou na metade → abre o overlay por cima do
  // campinho (mesmo sem hash), com o menu econômico. "Continuar" solta o returno.
  const midWindow = !!(state.dinastia && state.screen === 'season' && state.dinastiaPaused)
  if (!open && !midWindow) return null
  if (state.dinastia && state.screen === 'end') return <Overlay><div style={{ ...box(), padding: 24, textAlign: 'center' }}><p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>Fechando a temporada…</p></div></Overlay>
  if (isAdmin && midWindow) {
    const meId = state.managers[state.youIdx].id
    const myName = loadSave()?.clubName
    const partial = state.scorers.slice().sort((a, b) => b.goals - a.goals).map(sc => ({ name: sc.name, teamName: sc.teamId === meId ? (myName ?? sc.teamName) : sc.teamName, goals: sc.goals, mine: sc.teamId === meId }))
    return <Overlay><MidWindow onContinue={() => dispatch({ type: 'RESUME_DINASTIA' })} partial={partial} /></Overlay>
  }
  if (!isAdmin) return (
    <Overlay><div style={{ ...box(), padding: 24, textAlign: 'center' }}>
      <p style={{ fontWeight: 900, ...OSWALD, fontSize: 18 }}>🔒 Modo em teste</p>
      <p style={{ marginTop: 8, color: '#555', fontWeight: 700 }}>Disponível só pro criador por enquanto.</p>
      <div style={{ marginTop: 16 }}><Btn onClick={() => { window.location.hash = '' }} bg="#fff">Voltar</Btn></div>
    </div></Overlay>
  )
  return <Overlay><Dinastia /></Overlay>
}
export function DinastiaButton() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return (
    <button onClick={() => { window.location.hash = 'dinastia' }} style={{ width: '100%', boxSizing: 'border-box', background: PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 2, ...OSWALD }}>
      🏰 Modo Dinastia <span style={{ color: GOLD }}>(teste — só você)</span>
    </button>
  )
}
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: CREAM, color: INK, zIndex: 9000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 64px' }}>{children}</div>
    </div>
  )
}

type Phase = 'home' | 'transfer' | 'sell' | 'store' | 'squad' | 'scorers' | 'table'

function Dinastia() {
  const { dispatch } = useEsc()
  const [save, setSave] = useState<Save | null>(() => loadSave())
  const [phase, setPhase] = useState<Phase>('home')
  const persist = (s: Save) => { writeSave(s); setSave(s) }
  const close = () => { window.location.hash = '' }
  const reset = () => { if (confirm('Recomeçar a Dinastia do zero? Perde tudo.')) { localStorage.removeItem(SAVE_KEY); setSave(null) } }
  // abrir o pregão = disparar o LEILÃO REAL (mesmo motor da carreira) e fechar o
  // overlay pra ele aparecer. A cerimônia devolve o controle pra economia.
  const startAuction = (b: { name: string; rivals: string[]; formation: FormationKey }) => {
    dispatch({ type: 'START', teamName: b.name, formation: b.formation, rivals: b.rivals.length, career: true, rivalTeams: b.rivals, dinastia: true, budget: START_COINS })
    window.location.hash = ''
  }
  // jogar a TEMPORADA REAL contra os times da sua divisão no mundo fixo, no motor
  // do jogo (campinho, narração, tabela, artilheiros). Libera contratos vencidos.
  const playSeason = () => {
    if (!save) return
    const kept = save.squad.filter(c => { const k = save.contracts?.[c.id]; return !k || k.until >= save.seasonNo })
    // zera o log de aliciamento (1 por posição) — a janela do MEIO começa limpa
    persist({ ...save, squad: kept, requested: [] })
    const others = save.world.filter(w => w.div === save.division).map(w => ({ name: w.name, squad: w.squad }))
    // decora o nome com o símbolo do escudo → aparece na tabela/tela de fim do jogo
    const sym = save.crest?.symbol ?? ''
    const teamName = sym ? `${sym} ${save.clubName}` : save.clubName
    const rivals = save.world.filter(w => w.rival).map(w => ({ team: w.name, name: w.name, division: w.div }))
    dispatch({ type: 'START_DINASTIA_SEASON', teamName, formation: save.formation, division: save.division, seasonNo: save.seasonNo, squad: kept, others, rivals })
    window.location.hash = ''
  }

  if (!save) return <Intro onStart={startAuction} onClose={close} />

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 22 }}>
      {phase !== 'home'
        ? <button onClick={() => setPhase('home')} className="flex items-center gap-1 text-black/60 font-black text-sm active:opacity-60" style={OSWALD}><span className="text-lg leading-none">←</span> Voltar</button>
        : <span style={{ width: 60 }} />}
      <span style={{ fontWeight: 900, ...OSWALD }}>🏰 DINASTIA</span>
      <span style={{ width: 60 }} />
    </div>
  )
  return (
    <div>
      {header}
      {phase === 'home' && <Home save={save} go={setPhase} playSeason={playSeason} />}
      {phase === 'squad' && <SquadScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'scorers' && <ScorersScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'table' && <ClassificationScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'store' && <Store save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'transfer' && <Transfer save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'sell' && <SellRoom save={save} persist={persist} onBack={() => setPhase('home')} />}
      {/* sair do jogo lá embaixo, igual aos outros modos */}
      <div className="pt-8 pb-4 text-center space-y-2">
        <button onClick={close} className="block mx-auto text-black/35 text-xs font-semibold underline active:opacity-60" style={OSWALD}>sair do jogo</button>
        <button onClick={reset} className="block mx-auto text-black/25 text-[11px] font-semibold underline active:opacity-60" style={OSWALD}>recomeçar dinastia do zero</button>
      </div>
    </div>
  )
}

// ─── JANELA DO MEIO (pausa da temporada) ─────────────────────────────
// Overlay por cima do campinho na metade do calendário. Mesmo menu econômico
// (contratar/vender/shopping/elenco), MAS o que contratar só vale ano que vem.
type PartialRow = { name: string; teamName: string; goals: number; mine: boolean }
function MidWindow({ onContinue, partial }: { onContinue: () => void; partial: PartialRow[] }) {
  const [save, setSave] = useState<Save | null>(() => loadSave())
  const [phase, setPhase] = useState<Phase>('home')
  const persist = (s: Save) => { writeSave(s); setSave(s) }
  useEffect(() => { if (!save) onContinue() }, []) // eslint-disable-line
  if (!save) return null
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 22 }}>
      {phase !== 'home'
        ? <button onClick={() => setPhase('home')} className="flex items-center gap-1 text-black/60 font-black text-sm active:opacity-60" style={OSWALD}><span className="text-lg leading-none">←</span> Voltar</button>
        : <span style={{ width: 60 }} />}
      <span style={{ fontWeight: 900, ...OSWALD }}>⏸️ JANELA DO MEIO</span>
      <span style={{ width: 60 }} />
    </div>
  )
  return (
    <div>
      {header}
      {phase === 'home' && <MidHome save={save} go={setPhase} onContinue={onContinue} partial={partial} />}
      {phase === 'squad' && <SquadScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'scorers' && <MidScorers partial={partial} onBack={() => setPhase('home')} />}
      {phase === 'store' && <Store save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'transfer' && <Transfer save={save} persist={persist} onBack={() => setPhase('home')} midSeason />}
      {phase === 'sell' && <SellRoom save={save} persist={persist} onBack={() => setPhase('home')} />}
    </div>
  )
}
function MidHome({ save, go, onContinue, partial }: { save: Save; go: (p: Phase) => void; onContinue: () => void; partial: PartialRow[] }) {
  const top = partial.slice(0, 3)
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 16, color: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Crest crest={save.crest} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{save.clubName}</span>
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700, marginTop: 2 }}>{DIV_LABEL[save.division]} · Temporada {save.seasonNo} · metade do calendário</div>
        </div>
      </div>
      <div style={{ ...box(GOLD), padding: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#7a5c00' }}>🏦 CAIXA</div>
        <div style={{ fontSize: 30, fontWeight: 900, ...OSWALD }}>💰 {save.coins}</div>
      </div>
      <div style={{ ...box('#FFF6DE'), padding: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>⏸️ Pausa da metade da temporada</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#666', marginTop: 2 }}>Aproveite pra <b>vender</b>, mexer no <b>shopping</b> e <b>aliciar</b> (leilão). Atenção: quem você contratar agora <b>só entra no elenco na próxima temporada</b>. Ao continuar, o returno roda até o fim.</p>
      </div>
      {top.length > 0 && (
        <div style={{ ...box('#fff'), padding: 12 }}>
          <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 4 }}>🥇 Artilharia parcial (sua divisão)</p>
          {top.map((s, i) => (
            <div key={s.name + i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: s.mine ? 900 : 700, color: s.mine ? GREEN : INK }}>
              <span>{i + 1}. {s.name} <span style={{ color: '#999', fontSize: 11 }}>{s.teamName}</span></span><span>⚽ {s.goals}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('transfer')} bg="#fff">🔎 Aliciar</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('sell')} bg="#fff">🔨 Vender</Btn></div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('scorers')} bg="#fff">🥇 Artilharia</Btn></div>
      </div>
      <Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🛡️ Shopping · Escudo</Btn>
      <Btn onClick={onContinue} bg={GREEN} color="#fff">▶️ CONTINUAR — jogar o returno</Btn>
    </div>
  )
}
function MidScorers({ partial, onBack }: { partial: PartialRow[]; onBack: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🥇 Artilharia parcial</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Sua divisão, primeiro turno desta temporada. A artilharia geral (4 divisões) fecha no fim do ano.</p>
      {partial.length === 0
        ? <p style={{ fontWeight: 700, color: '#888' }}>Ninguém marcou ainda.</p>
        : <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 4 }}>
            {partial.slice(0, 25).map((s, i) => (
              <div key={s.name + i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: s.mine ? GOLD : 'transparent', fontWeight: s.mine ? 900 : 700 }}>
                <span style={{ fontSize: 13 }}>{i + 1}. {s.name} <span style={{ color: '#999', fontSize: 11 }}>{s.teamName}</span></span>
                <span style={{ fontWeight: 900, ...OSWALD }}>⚽ {s.goals}</span>
              </div>
            ))}
          </div>}
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── INTRO / SETUP: mesmo padrão do setup da Carreira ────────────────
function Intro({ onStart, onClose }: { onStart: (b: { name: string; rivals: string[]; formation: FormationKey }) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [count, setCount] = useState(5)
  const pool = DIVISION_TEAMS['D'].map(t => t.team)
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (t: string) => setPicked(prev => { if (prev.includes(t)) return prev.filter(x => x !== t); const next = [...prev, t]; return next.length > count ? next.slice(next.length - count) : next })
  // nome vem da CONTA (mesmo do CPU/carreira/online) e é editável; ao começar,
  // sincroniza de volta — trocar aqui troca em todos os lugares.
  const [accountName, setAccountName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const apply = (u: { user_metadata?: Record<string, unknown> } | null | undefined) => {
      if (!alive) return
      if (!u) { setAccountName(null); return }
      const dn = ((u.user_metadata?.display_name as string) ?? '').trim()
      setAccountName(dn); if (dn) setName(prev => prev.trim() ? prev : dn)
    }
    supabase.auth.getUser().then(({ data }) => apply(data?.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => apply(s?.user))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  const start = async () => {
    const clean = name.trim()
    if (accountName !== null && clean && clean !== accountName) {
      try { await supabase.auth.updateUser({ data: { display_name: clean } }) } catch { /* não trava o jogo */ }
    }
    const picks = [...picked, ...pool.filter(t => !picked.includes(t))].slice(0, count)
    onStart({ name: clean || 'Meu Clube', rivals: picks, formation })
  }
  const label = { fontWeight: 900, textTransform: 'uppercase' as const, fontSize: 12, marginBottom: 4, ...OSWALD }
  return (
    <div className="space-y-5">
      <button onClick={onClose} className="flex items-center gap-1 text-black/60 font-black text-sm active:opacity-60" style={OSWALD}><span className="text-lg leading-none">←</span> Home</button>
      <h2 className="font-black text-3xl" style={OSWALD}>🏰 DINASTIA · SÉRIE D</h2>
      <p className="text-sm font-bold text-black/60 -mt-3">Comece duro com 50 moedas, monte o time no pregão e construa uma dinastia: suba de divisão, contrate craques e fique rico. Mundo fixo — cada jogador vive num clube.</p>
      <div style={{ ...box(), padding: 16 }} className="space-y-4">
        <div>
          <p style={label}>Nome do seu clube</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Bagres do Asfalto" maxLength={22}
            className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold bg-white" />
          {accountName !== null && <p className="text-[11px] font-semibold text-black/55 mt-1">🔗 É o nome da sua conta — vale no CPU, na carreira e no online. Se editar aqui, troca em todos os lugares (e nas estatísticas).</p>}
        </div>
        <div>
          <p style={label}>Formação (travada antes do pregão)</p>
          <div className="grid grid-cols-4 gap-2">
            {(['4-3-3', '4-4-2'] as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)} className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: formation === f ? GOLD : '#fff', boxShadow: formation === f ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>{f}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={label}>Rivais no pregão</p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7].map(n => (
              <button key={n} onClick={() => setCount(n)} className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: count === n ? PURPLE : '#fff', color: count === n ? '#fff' : INK, boxShadow: count === n ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={label}>🔥 Escolha seus rivais <span className="text-black/50">({picked.length}/{count})</span></p>
          <p className="text-[11px] font-semibold text-black/55 mb-1.5">Eles serão seus rivais pra vida toda — brigam no pregão, nos seus leilões e na pirâmide.</p>
          <div className="flex flex-wrap gap-1.5">
            {pool.map(t => {
              const on = picked.includes(t)
              return <button key={t} onClick={() => toggle(t)} className="border-2 border-black rounded-lg px-2 py-1 font-black text-[11px] active:translate-y-0.5" style={{ backgroundColor: on ? RED : '#fff', color: on ? '#fff' : INK }}>{on ? '🔥 ' : ''}{t}</button>
            })}
          </div>
          <button onClick={() => setPicked([])} className="mt-2 border-2 border-black rounded-lg px-2.5 py-1 font-black text-[11px] bg-white active:translate-y-0.5" style={OSWALD}>🎲 Não escolher — usar rivais padrão</button>
        </div>
        <p className="text-xs font-semibold text-black/70">🏟️ A liga completa 20 times; o catálogo inteiro é distribuído pelas 4 divisões (mundo fixo).</p>
        <p className="text-xs font-semibold text-black/70">💰 Você começa com <b>{START_COINS} moedas</b> na Série D. Sem reservas — todo time tem 11.</p>
      </div>
      <Btn onClick={start} bg={GREEN} color="#fff">🔨 ABRIR O PREGÃO</Btn>
    </div>
  )
}

const stepBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: `2px solid ${INK}`, background: '#fff', fontWeight: 900, fontSize: 18, cursor: 'pointer', lineHeight: 1 }

// ─── HOME (entre temporadas = janela de transferências) ──────────────
function Crest({ crest, size = 40 }: { crest?: { c1: string; c2: string; symbol: string }; size?: number }) {
  const c = crest ?? DEFAULT_CREST
  return (
    <div style={{ width: size, height: size * 1.15, borderRadius: `${size * 0.2}px ${size * 0.2}px ${size * 0.45}px ${size * 0.45}px`, border: `2.5px solid ${INK}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: `2px 2px 0 0 ${INK}` }}>
      <div style={{ flex: 1, background: c.c1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>{c.symbol}</div>
      <div style={{ height: size * 0.28, background: c.c2 }} />
    </div>
  )
}
function Home({ save, go, playSeason }: { save: Save; go: (p: Phase) => void; playSeason: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 16, color: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Crest crest={save.crest} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 22, ...OSWALD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{save.clubName}</span>
            <span style={{ fontWeight: 800, color: GOLD, whiteSpace: 'nowrap' }}>{DIV_LABEL[save.division]}</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700, marginTop: 2 }}>Temporada {save.seasonNo} · {save.titles} 🏆</div>
        </div>
      </div>
      <div style={{ ...box(GOLD), padding: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#7a5c00' }}>🏦 CAIXA — vale pra time E ostentação</div>
        <div style={{ fontSize: 30, fontWeight: 900, ...OSWALD }}>💰 {save.coins}</div>
      </div>
      {save.lastResult && (
        <div style={{ ...box('#fff'), padding: 12, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
          Temporada passada: <b>{save.lastResult.pos}º</b> na {DIV_LABEL[save.lastResult.prevDiv]}{save.lastResult.champion ? ' 🏆 CAMPEÃO!' : ''} · {save.lastResult.move === 'up' ? '⬆️ subiu' : save.lastResult.move === 'down' ? '⬇️ caiu' : '➡️ ficou'}
        </div>
      )}
      <div style={{ ...box('#FFF6DE'), padding: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🔓 Janela do INÍCIO aberta</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#666', marginTop: 2 }}>Reforce, venda e organize o elenco — reforços aqui <b>já jogam esta temporada</b>. Depois é a <b>temporada de verdade</b> (campinho, narração, tabela, artilheiros) e ela <b>pausa na metade</b> numa 2ª janela: lá você alicia de novo, mas só pra <b>próxima</b> temporada.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Btn onClick={() => go('transfer')} bg="#fff">🔎 Contratar</Btn></div>
          <div style={{ flex: 1 }}><Btn onClick={() => go('sell')} bg="#fff">🔨 Vender</Btn></div>
        </div>
      </div>
      <Btn onClick={playSeason} bg={GREEN} color="#fff">▶️ JOGAR A TEMPORADA {save.seasonNo}</Btn>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🛡️ Escudo</Btn></div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('table')} bg="#fff">📊 Classificação</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('scorers')} bg="#fff">🥇 Artilharia</Btn></div>
      </div>
    </div>
  )
}

// ─── ELENCO ───────────────────────────────────────────────────────────
function SquadScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const byPos = SECTORS.map(p => ({ p, cards: save.squad.filter(c => c.pos === p) }))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>👥 Elenco ({save.squad.length})</p>
      {byPos.map(({ p, cards }) => cards.length > 0 && (
        <div key={p}>
          <p style={{ fontWeight: 800, fontSize: 12, color: '#888', marginBottom: 4 }}>{SECTOR_LABEL[p]}</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {cards.map(c => (
              <div key={c.id} style={{ ...box('#fff'), padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 900, ...OSWALD }}>{c.name}</div><div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{c.club} · {c.year}{save.goalsLast[c.id] ? ` · ⚽ ${save.goalsLast[c.id]}` : ''} · {contractUntil(save, c.id) >= save.seasonNo ? `📄 até temp. ${contractUntil(save, c.id)}` : '⚠️ vencido'} · piso {floorOf(save, c) ?? Math.max(1, c.paid)}</div></div>
                <span style={{ fontWeight: 900, ...OSWALD, color: GREEN }}>💰 {myValue(save, c)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── ARTILHARIA DA SUA DIVISÃO (última temporada) ────────────────────
function ScorersScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const rows = save.lastScorers ?? []
  if (rows.length === 0) return <div style={{ display: 'grid', gap: 10 }}><p style={{ fontWeight: 700, color: '#888' }}>Jogue uma temporada pra ver a artilharia da sua divisão.</p><Btn onClick={onBack} bg="#fff">← Voltar</Btn></div>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🥇 Artilharia · {DIV_LABEL[save.division]}</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Última temporada, a sua divisão. Seus jogadores destacados.</p>
      <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 4 }}>
        {rows.map((s, i) => {
          const mine = s.teamName === save.clubName
          return (
            <div key={s.teamName + s.name + i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: mine ? GOLD : 'transparent', fontWeight: mine ? 900 : 700 }}>
              <span style={{ fontSize: 13 }}>{i + 1}. {s.name} <span style={{ color: '#999', fontSize: 11 }}>{s.teamName}</span></span>
              <span style={{ fontWeight: 900, ...OSWALD }}>⚽ {s.goals}</span>
            </div>
          )
        })}
      </div>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── CLASSIFICAÇÃO da sua divisão (final da última temporada) ─────────
function ClassificationScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const rows = save.lastTable ?? []
  if (rows.length === 0) return <div style={{ display: 'grid', gap: 10 }}><p style={{ fontWeight: 700, color: '#888' }}>Jogue uma temporada pra ver a classificação da sua divisão.</p><Btn onClick={onBack} bg="#fff">← Voltar</Btn></div>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>📊 Classificação · {DIV_LABEL[save.division]}</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Final da última temporada. 🟢 topo sobe · 🔴 base cai.</p>
      <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 2 }}>
        <div style={{ display: 'flex', fontSize: 10, fontWeight: 800, color: '#aaa', padding: '0 6px 2px' }}>
          <span style={{ width: 22 }}>#</span><span style={{ flex: 1 }}>Time</span><span style={{ width: 26, textAlign: 'center' }}>P</span><span style={{ width: 52, textAlign: 'center' }}>V-E-D</span><span style={{ width: 34, textAlign: 'right' }}>SG</span>
        </div>
        {rows.map((t, i) => {
          const mine = t.name === save.clubName
          const zone = i < 4 ? '#1B7A3D' : i >= 16 ? '#E8503A' : 'transparent'
          return (
            <div key={t.name + i} style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: mine ? GOLD : 'transparent', fontWeight: mine ? 900 : 700, fontSize: 12 }}>
              <span style={{ width: 22, display: 'flex', alignItems: 'center', gap: 3 }}><i style={{ width: 5, height: 5, borderRadius: 99, background: zone, display: 'inline-block' }} />{i + 1}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              <span style={{ width: 26, textAlign: 'center', fontWeight: 900, ...OSWALD }}>{t.pts}</span>
              <span style={{ width: 52, textAlign: 'center', color: '#888', fontSize: 11 }}>{t.w}-{t.d}-{t.l}</span>
              <span style={{ width: 34, textAlign: 'right', color: '#888', fontSize: 11 }}>{t.gf - t.ga > 0 ? '+' : ''}{t.gf - t.ga}</span>
            </div>
          )
        })}
      </div>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── ESCUDO & IDENTIDADE ─────────────────────────────────────────────
function Store({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const saved = save.crest ?? DEFAULT_CREST
  const [draft, setDraft] = useState(saved) // monta no rascunho; só paga ao aplicar
  const set = (c: Partial<typeof draft>) => setDraft(d => ({ ...d, ...c }))
  // símbolos premium desbloqueiam pela divisão MAIS ALTA que você já alcançou
  const reached = DIVS.slice(0, DIVS.indexOf(save.division) + 1)
  const symbols = [...CREST_SYMBOLS_BASIC, ...reached.flatMap(d => CREST_SYMBOLS_PREMIUM[d])]
  const changed = draft.c1 !== saved.c1 || draft.c2 !== saved.c2 || draft.symbol !== saved.symbol
  const premiumPick = PREMIUM_SET.has(draft.symbol) && draft.symbol !== saved.symbol
  const cost = changed ? (premiumPick ? CREST_PRICE_PREMIUM : CREST_PRICE) : 0
  const canBuy = changed && save.coins >= cost
  const apply = () => { if (!canBuy) return; persist({ ...save, coins: save.coins - cost, crest: draft }) }
  const swatch = (color: string, on: boolean, onClick: () => void) => (
    <button key={color} onClick={onClick} style={{ width: 34, height: 34, borderRadius: 8, background: color, border: on ? `3px solid ${INK}` : '2px solid rgba(0,0,0,0.25)', boxShadow: on ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer' }} />
  )
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🛡️ Shopping · Escudo</p>
        <span style={{ fontWeight: 900, ...OSWALD, color: GREEN }}>💰 {save.coins}</span>
      </div>
      <div style={{ ...box('#EAF3FF'), padding: 9 }}><p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ A cara do seu clube: 2 cores + um símbolo. Aparece na home e — pelo símbolo — na <b>tabela e na tela de fim</b> do jogo. Paga com a <b>mesma moeda do Caixa</b> (💰, a única do jogo): trocar custa 💰 {CREST_PRICE}; símbolos premium custam 💰 {CREST_PRICE_PREMIUM} e <b>desbloqueiam conforme você sobe de divisão</b>. Monte no rascunho e compre no fim.</p></div>
      <div style={{ ...box(INK), padding: 16, color: '#fff', display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
        <Crest crest={draft} size={64} />
        <span style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{draft.symbol} {save.clubName}</span>
      </div>
      <div>
        <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', ...OSWALD, marginBottom: 6 }}>Cor principal</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{CREST_COLORS.map(c => swatch(c, draft.c1 === c, () => set({ c1: c })))}</div>
      </div>
      <div>
        <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', ...OSWALD, marginBottom: 6 }}>Cor da faixa</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{CREST_COLORS.map(c => swatch(c, draft.c2 === c, () => set({ c2: c })))}</div>
      </div>
      <div>
        <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', ...OSWALD, marginBottom: 6 }}>Símbolo <span style={{ color: '#999', textTransform: 'none' }}>(borda roxa = premium, mais caro; abre ao subir)</span></p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {symbols.map(s => {
            const prem = PREMIUM_SET.has(s)
            return <button key={s} onClick={() => set({ symbol: s })} style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, fontSize: 22, background: draft.symbol === s ? GOLD : '#fff', border: `2px solid ${prem ? PURPLE : INK}`, boxShadow: draft.symbol === s ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>{s}{prem && <span style={{ position: 'absolute', bottom: -8, left: 0, right: 0, fontSize: 8, fontWeight: 900, color: PURPLE, ...OSWALD }}>💰{CREST_PRICE_PREMIUM}</span>}</button>
          })}
        </div>
      </div>
      <Btn onClick={apply} bg={GREEN} color="#fff" disabled={!canBuy}>{!changed ? '🛡️ Identidade atual' : save.coins < cost ? `💸 Faltam moedas (💰 ${cost})` : `🛒 Comprar identidade — 💰 ${cost}`}</Btn>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── CONTRATAR: clubes da sua divisão → elenco → LEILÃO por 1 jogador ─
function Transfer({ save, persist, onBack, midSeason }: { save: Save; persist: (s: Save) => void; onBack: () => void; midSeason?: boolean }) {
  const [browseTeam, setBrowseTeam] = useState<string | null>(null)
  const [target, setTarget] = useState<{ card: PoolCard; owner: WTeam } | null>(null)

  if (target) return <SigningAuction save={save} card={target.card} owner={target.owner} midSeason={midSeason} persist={persist} onDone={() => { persist({ ...save, requested: [...(save.requested ?? []), target.card.id] }); setTarget(null); setBrowseTeam(null) }} onBack={() => setTarget(null)} />

  // comprou e lotou uma posição → você precisa dispensar alguém
  const overPos = SECTORS.find(p => save.squad.filter(c => c.pos === p).length > FORM_NEED[save.formation][p])
  if (overPos) return <DispensaScreen save={save} persist={persist} pos={overPos} />

  // 1 tentativa de contratação por POSIÇÃO por janela (guardado em requested)
  const attempted = save.requested ?? []
  const attemptedPos = new Set<Sector>()
  for (const id of attempted) { const c = save.world.flatMap(w => w.squad).find(x => x.id === id) ?? save.squad.find(x => x.id === id); if (c) attemptedPos.add(c.pos) }
  const team = browseTeam ? save.world.find(w => w.name === browseTeam) ?? null : null

  // ── elenco de um clube → toque num jogador pra ir ao LEILÃO ──
  if (team) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>{team.name} <span style={{ fontSize: 12, color: '#888' }}>· {DIV_LABEL[team.div]}{team.rival ? ' ⚔️' : ''}</span></p>
        <div style={{ ...box('#EAF3FF'), padding: 9 }}><p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ Toque num jogador pra <b>abrir o leilão</b> por ele (você × seus rivais × o dono). Só <b>1 contratação por posição</b> por janela. Quem está sob contrato não pode.</p></div>
        {SECTORS.map(p => team.squad.filter(c => c.pos === p).map(c => {
          const under = underContract(save, c.id)
          const posDone = attemptedPos.has(p)
          const dis = under || posDone
          const v = valueOf(save, c)
          return (
            <button key={c.id} disabled={dis} onClick={() => setTarget({ card: c, owner: team })} style={{ ...box(dis ? '#eee' : '#fff'), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: dis ? 'default' : 'pointer', textAlign: 'left', opacity: dis ? 0.55 : 1 }}>
              <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
              {under ? <span style={{ fontWeight: 800, color: RED, fontSize: 12 }}>🔒 contrato (temp. {contractUntil(save, c.id)})</span> : posDone ? <span style={{ fontWeight: 800, color: '#999', fontSize: 12 }}>já foi 1 {c.pos}</span> : <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>{v !== undefined ? `vale ${v} 💰` : 'novo no mercado'}</span>}
            </button>
          )
        }))}
        <Btn onClick={() => setBrowseTeam(null)} bg="#fff">← Outros clubes</Btn>
      </div>
    )
  }

  // ── landing: renovações + CLUBES da sua divisão + Monte ──
  const expiring = save.squad.filter(c => contractUntil(save, c.id) < save.seasonNo)
  const renewCost = (c: WonCard) => floorOf(save, c) ?? Math.max(1, c.paid)
  const renew = (c: WonCard) => { const cost = renewCost(c); if (save.coins < cost) return; persist({ ...save, coins: save.coins - cost, contracts: setContract(save, c.id, cost) }) }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔎 Contratar · {DIV_LABEL[save.division]} · 💰 {save.coins}</p>
      {expiring.length > 0 && (
        <div style={{ ...box('#FFF6DE'), padding: 10, display: 'grid', gap: 6 }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>📄 Contratos vencidos — renove ou perde na hora de jogar</p>
          {expiring.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}><Pos p={c.pos} /> {c.name}</span>
              <button onClick={() => renew(c)} disabled={save.coins < renewCost(c)} style={{ background: save.coins < renewCost(c) ? '#ccc' : GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 10px', fontWeight: 900, fontSize: 13, cursor: save.coins < renewCost(c) ? 'default' : 'pointer', ...OSWALD }}>Renovar 💰 {renewCost(c)}</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ ...box('#EAF3FF'), padding: 9 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ <b>Aliciar = pôr o jogador em LEILÃO.</b> Toque num clube da sua divisão, escolha o alvo e brigue no pregão (você × seus rivais × o dono). <b>1 alvo por posição</b> por janela. As outras divisões ficam no mistério — suba pra conhecer.</p>
        {midSeason
          ? <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: RED }}>⏸️ Janela do MEIO: quem você contratar agora <b>só entra no elenco na próxima temporada</b>.</p>
          : <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: GREEN }}>▶️ Janela do INÍCIO: reforços já jogam <b>esta temporada</b>.</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {save.world.filter(w => w.div === save.division).map(w => (
          <button key={w.name} onClick={() => setBrowseTeam(w.name)} style={{ padding: '9px 8px', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 800, fontSize: 12, background: w.rival ? '#FFE9A8' : '#fff', cursor: 'pointer', textAlign: 'left', ...OSWALD }}>{w.rival ? '⚔️ ' : ''}{w.name}</button>
        ))}
      </div>
      <MonteFreeAgents save={save} persist={persist} />
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// Monte de livres: dispensados que ninguém pagou o mínimo. Pega de graça se tiver
// vaga na posição. Fica no fim da janela; rivais também podem levar (no avanço).
function MonteFreeAgents({ save, persist }: { save: Save; persist: (s: Save) => void }) {
  const monte = save.monte ?? []
  if (monte.length === 0) return null
  const holeAt = (p: Sector) => save.squad.filter(c => c.pos === p).length < FORM_NEED[save.formation][p]
  const grab = (c: PoolCard) => {
    if (!holeAt(c.pos)) return
    const wc: WonCard = { ...c, paid: 0, via: 'monte' }
    // livre: mantém o piso que já tinha (último preço pago); se nunca teve, piso 1
    persist({ ...save, squad: [...save.squad, wc], monte: monte.filter(x => x.id !== c.id), contracts: setContract(save, c.id, floorOf(save, c) ?? 1) })
  }
  return (
    <div style={{ ...box('#F0EAD8'), padding: 10, display: 'grid', gap: 6 }}>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>🎁 Monte — livres (de graça)</p>
      <p style={{ fontSize: 11, color: '#777', fontWeight: 700 }}>Dispensados que ninguém pagou. Pegue de graça se tiver vaga na posição — senão os rivais levam.</p>
      {monte.map(c => {
        const can = holeAt(c.pos)
        return (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}><Pos p={c.pos} /> {c.name}</span>
            <button onClick={() => grab(c)} disabled={!can} style={{ background: can ? GREEN : '#ccc', color: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 10px', fontWeight: 900, fontSize: 12, cursor: can ? 'pointer' : 'default', ...OSWALD }}>{can ? 'Pegar grátis' : 'sem vaga'}</button>
          </div>
        )
      })}
    </div>
  )
}

// ─── DISPENSA: você lotou a posição, escolhe quem sai → leilão c/ mínimo ──
function DispensaScreen({ save, persist, pos }: { save: Save; persist: (s: Save) => void; pos: Sector }) {
  const [selId, setSelId] = useState<string | null>(null)
  const cands = save.squad.filter(c => c.pos === pos)
  const sel = cands.find(c => c.id === selId) ?? null
  if (!sel) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>➖ Dispensar em {SECTOR_LABEL[pos]}</p>
        <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Você lotou a posição ({cands.length}/{FORM_NEED[save.formation][pos]}). Escolha quem vai pro leilão. Mínimo = o que ele custou (piso). Se ninguém pagar, cai no Monte de livres.</p>
        {cands.map(c => (
          <button key={c.id} onClick={() => setSelId(c.id)} style={{ ...box('#fff'), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
            <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>mín {floorOf(save, c) ?? Math.max(1, c.paid)} · vale {myValue(save, c)} 💰</span>
          </button>
        ))}
      </div>
    )
  }
  return <DispensaAuction save={save} card={sel} persist={persist} onBack={() => setSelId(null)} />
}

function DispensaAuction({ save, card, persist, onBack }: { save: Save; card: WonCard; persist: (s: Save) => void; onBack: () => void }) {
  const minimum = floorOf(save, card) ?? Math.max(1, card.paid) // piso = último preço pago
  const val = myValue(save, card)
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ Date.now()) >>> 0), []) // eslint-disable-line
  const offers = useMemo(() => {
    const buyers = shuffle(save.world.map(w => w.name), rng)
    return Array.from({ length: 3 }, (_, i) => {
      const roll = rng(); let f = 0.4 + rng() * 1.4
      if (roll > 0.88) f = 1.8 + rng() * 1.2; else if (roll < 0.25) f = 0.2 + rng() * 0.25
      return { by: buyers[i % buyers.length], amount: Math.max(1, Math.round(val * f)) }
    })
  }, [rng, val])
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<{ sold: boolean; amount: number; by: string; next: Save } | null>(null)
  const cur = offers[idx]
  const sell = (amount: number, by: string) => {
    const world = save.world.map(w => w.name === by ? { ...w, squad: giveToTeam(w.squad, card) } : w)
    setDone({ sold: true, amount, by, next: { ...save, coins: save.coins + amount, squad: save.squad.filter(c => c.id !== card.id), world } })
  }
  const toMonte = () => {
    setDone({ sold: false, amount: 0, by: '', next: { ...save, squad: save.squad.filter(c => c.id !== card.id), monte: [...(save.monte ?? []), { ...card }] } })
  }
  if (done) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...box(done.sold ? GOLD : '#F0EAD8'), padding: 20, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 20, ...OSWALD }}>{done.sold ? '💰 Vendido!' : '🎁 Foi pro Monte'}</p>
          <p style={{ fontWeight: 800, marginTop: 6 }}>{done.sold ? `${card.name} saiu por 💰 ${done.amount} (${done.by})` : `Ninguém pagou o mínimo (${minimum}). ${card.name} virou livre — no Monte, alguém pega de graça.`}</p>
        </div>
        <Btn onClick={() => persist(done.next)} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }
  const canAccept = cur.amount >= minimum
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>➖ Dispensando {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Mínimo pra vender: 💰 {minimum} · vale ~{val}</p>
      </div>
      <div style={{ ...box('#fff'), padding: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Oferta {idx + 1} de {offers.length} — {cur.by}</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '6px 0', color: canAccept ? INK : RED }}>💰 {cur.amount}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>{canAccept ? 'Cobre o mínimo — dá pra vender.' : `Abaixo do mínimo (${minimum}) — não dá pra aceitar.`}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => sell(cur.amount, cur.by)} bg={GREEN} color="#fff" disabled={!canAccept}>✅ Vender {cur.amount}</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => { if (idx < offers.length - 1) setIdx(idx + 1); else toMonte() }} bg={RED} color="#fff">{idx < offers.length - 1 ? '🎲 Recusar' : '🎁 Pro Monte'}</Btn></div>
      </div>
      <Btn onClick={onBack} bg="#fff">← Dispensar outro</Btn>
    </div>
  )
}

function SigningAuction({ save, card, owner, persist, onDone, onBack, midSeason }: { save: Save; card: PoolCard; owner: WTeam; persist: (s: Save) => void; onDone: () => void; onBack: () => void; midSeason?: boolean }) {
  const market = valueOf(save, card) // preço de mercado (undefined = novo, nunca teve preço)
  const floor = floorOf(save, card)  // piso = último preço pago (undefined = sem piso)
  const minBid = floor ?? 1          // lance mínimo: piso, ou 1 se ele nunca foi comprado
  // dono/rivais enxergam a QUALIDADE real do jogador mesmo sem preço de mercado
  const perceived = market ?? baseValue(card)
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ (save.seasonNo * 131)) >>> 0), []) // eslint-disable-line
  // "resolve" do dono: quanto ele banca pra segurar. Craque em clube grande = alto. Nunca abaixo do piso.
  const divW = { D: 0.2, C: 0.5, B: 0.9, A: 1.4 }[owner.div]
  const importance = Math.min(2.4, 0.9 + divW + (perceived > 15 ? 0.6 : 0))
  const ownerBid = useMemo(() => Math.max(minBid, Math.round(perceived * importance * (0.9 + rng() * 0.4))), [rng, perceived, importance, minBid])
  // seus rivais fixos entram no leilão (não o dono). Cada um com "cofre" próprio.
  const rivalsIn = useMemo(() => {
    return save.world.filter(w => w.rival && w.name !== owner.name).map(w => {
      const cofre = 25 + save.seasonNo * 4 + ({ D: 0, C: 6, B: 14, A: 24 }[w.div])
      const wants = perceived > 6 && cofre >= minBid && rng() < (perceived > 14 ? 0.85 : 0.5)
      const bid = wants ? Math.min(cofre, Math.max(minBid, Math.round(perceived * (0.8 + rng() * 0.8)))) : 0
      return { name: w.name, bid }
    }).filter(r => r.bid >= minBid)
  }, [rng, perceived, minBid]) // eslint-disable-line
  const [bid, setBid] = useState(Math.min(save.coins, Math.max(minBid, Math.round(perceived))))
  const [done, setDone] = useState<{ result: 'you' | 'owner' | 'other'; by: string; price: number; dropped?: string } | null>(null)

  const go = () => {
    const entrants = [{ name: save.clubName, bid, mine: true }, { name: owner.name, bid: ownerBid, mine: false }, ...rivalsIn.map(r => ({ name: r.name, bid: r.bid, mine: false }))]
    entrants.sort((a, b) => b.bid - a.bid || (a.mine ? -1 : 1)) // empate: você leva
    const win = entrants[0]
    if (win.mine) {
      // você levou: paga, tira do dono (repõe com filler), contrato de 5. Se lotar
      // a posição, a tela de Dispensa resolve depois (você escolhe quem sai).
      const newSquad: WonCard[] = [...save.squad, { ...card, paid: bid, via: 'leilao' }]
      const newWorld = save.world.map(w => w.name === owner.name ? { ...w, squad: w.squad.filter(c => c.id !== card.id).concat(filler(card.pos, rng)) } : w)
      persist({ ...save, coins: save.coins - bid, squad: newSquad, world: newWorld, contracts: setContract(save, card.id, bid) })
      setDone({ result: 'you', by: save.clubName, price: bid })
    } else if (win.name === owner.name) {
      // dono renovou: contrato de 5 temporadas, piso = o que ele pagou
      persist({ ...save, contracts: setContract(save, card.id, win.bid) })
      setDone({ result: 'owner', by: owner.name, price: win.bid })
    } else {
      // um rival seu levou: sai do dono (filler), entra no rival; contrato de 5
      const newWorld = save.world.map(w => {
        if (w.name === owner.name) return { ...w, squad: w.squad.filter(c => c.id !== card.id).concat(filler(card.pos, rng)) }
        if (w.name === win.name) return { ...w, squad: giveToTeam(w.squad, card) }
        return w
      })
      persist({ ...save, world: newWorld, contracts: setContract(save, card.id, win.bid) })
      setDone({ result: 'other', by: win.name, price: win.bid })
    }
  }

  if (done) {
    const c = done.result === 'you' ? GOLD : done.result === 'other' ? '#FBE0DA' : '#fff'
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...box(c), padding: 20, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{done.result === 'you' ? '✅ CONTRATADO!' : done.result === 'owner' ? '🛡️ Renovou contrato!' : '😤 Rival levou!'}</p>
          <p style={{ fontWeight: 800, marginTop: 6 }}>{done.result === 'you' ? `${card.name} é seu por 💰 ${done.price}${done.dropped ? ` — ${done.dropped} saiu pra abrir vaga` : ''}` : done.result === 'owner' ? `${owner.name} cobriu (💰 ${done.price}) e renovou com ${card.name}. Travado por 5 temporadas.` : `${done.by} (seu rival) levou ${card.name} por 💰 ${done.price} na sua frente.`}</p>
        </div>
        <Btn onClick={onDone} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Leilão por {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>{owner.name} · {DIV_LABEL[owner.div]} · {market !== undefined ? `vale ~${market}` : 'novo no mercado'} · {floor !== undefined ? `piso ${floor} 💰` : 'sem piso'}</p>
      </div>
      <div style={{ ...box('#EAF3FF'), padding: 9 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ Leilão às cegas: você, seus rivais e o dono lançam. Maior lance leva; empate, você leva. {floor !== undefined ? <>O <b>piso é o último preço pago</b> por ele — não dá pra lançar abaixo.</> : <>Ele <b>nunca teve preço</b>: o que você pagar vira o valor dele <b>pra sempre</b>.</>}</p>
        {midSeason && <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: RED }}>⏸️ Contratação da janela do meio — <b>só entra na próxima temporada</b>.</p>}
      </div>
      <div style={{ ...box('#fff'), padding: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Seu lance (dono + seus rivais brigam às cegas):</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '4px 0' }}>💰 {bid}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          {[-5, -1].map(d => <button key={d} onClick={() => setBid(b => Math.max(minBid, b + d))} style={stepBtn}>{d}</button>)}
          {[+1, +5].map(d => <button key={d} onClick={() => setBid(b => Math.min(save.coins, b + d))} style={stepBtn}>+{d}</button>)}
        </div>
        <p style={{ fontSize: 12, color: '#999', fontWeight: 700, marginTop: 8 }}>Caixa: 💰 {save.coins} · lance mínimo: 💰 {minBid}. {floor !== undefined ? 'Chutou baixo, o dono segura.' : 'Nunca teve preço — o que pagarem vira o valor dele pra sempre.'}</p>
      </div>
      <Btn onClick={go} bg={GREEN} color="#fff" disabled={bid < minBid || bid > save.coins}>🔨 Dar o lance</Btn>
      <Btn onClick={onBack} bg="#fff">← Desistir</Btn>
    </div>
  )
}

// ─── VENDER (leilão com risco) ───────────────────────────────────────
function SellRoom({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const [selId, setSelId] = useState<string | null>(null)
  const sel = save.squad.find(c => c.id === selId) ?? null
  if (!sel) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Vender jogador</p>
        <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Leilão COM RISCO: as ofertas chegam uma a uma. Pode dar bolada… ou vexame. Escolha quem pôr no mercado:</p>
        {save.squad.map(c => (
          <button key={c.id} onClick={() => setSelId(c.id)} style={{ ...box('#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
            <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>vale ~{myValue(save, c)} 💰</span>
          </button>
        ))}
        <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
      </div>
    )
  }
  return <SellAuction save={save} card={sel} persist={persist} onBack={() => setSelId(null)} onExit={onBack} />
}
function SellAuction({ save, card, persist, onBack, onExit }: { save: Save; card: WonCard; persist: (s: Save) => void; onBack: () => void; onExit: () => void }) {
  const value = myValue(save, card)
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ Date.now()) >>> 0), []) // eslint-disable-line
  const offers = useMemo(() => {
    const buyers = shuffle(save.world.map(w => w.name), rng)
    return Array.from({ length: 4 }, (_, i) => {
      const roll = rng(); let f = 0.4 + rng() * 1.3
      if (roll > 0.9) f = 1.9 + rng() * 1.1; else if (roll < 0.18) f = 0.2 + rng() * 0.2
      return { by: buyers[i % buyers.length], amount: Math.max(1, Math.round(value * f)) }
    })
  }, [rng, value])
  const floor = Math.max(1, Math.round(value * 0.35))
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<{ amount: number; by: string } | null>(null)
  const cur = offers[idx]
  const finish = (amount: number, by: string) => {
    setDone({ amount, by })
    const newWorld = save.world.map(w => w.name === by ? { ...w, squad: giveToTeam(w.squad, card) } : w)
    persist({ ...save, coins: save.coins + amount, squad: save.squad.filter(c => c.id !== card.id), world: newWorld })
  }
  if (done) {
    const bolada = done.amount >= value * 1.5, vexame = done.amount < value * 0.5
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...box(bolada ? GOLD : vexame ? '#FBE0DA' : '#fff'), padding: 20, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{bolada ? '🤑 BOLADA!' : vexame ? '😰 VEXAME…' : '🤝 Vendido'}</p>
          <p style={{ fontWeight: 800, marginTop: 6 }}>{card.name} saiu por <b>💰 {done.amount}</b></p>
          <p style={{ fontSize: 13, color: '#666', fontWeight: 700, marginTop: 4 }}>{done.by} · (você achava ~{value})</p>
        </div>
        <Btn onClick={onExit} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Vendendo {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Você achava que valia ~{value} 💰</p>
      </div>
      <div style={{ ...box('#fff'), padding: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Oferta {idx + 1} de {offers.length} — {cur.by}</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '6px 0' }}>💰 {cur.amount}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>{idx < offers.length - 1 ? 'Recusar = espera a próxima (pode ser melhor… ou pior).' : `Última. Recusar = vende no piso (💰 ${floor}).`}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => finish(cur.amount, cur.by)} bg={GREEN} color="#fff">✅ Aceitar {cur.amount}</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => { if (idx < offers.length - 1) setIdx(idx + 1); else finish(floor, 'Comprador de piso') }} bg={RED} color="#fff">🎲 Recusar</Btn></div>
      </div>
      <Btn onClick={onBack} bg="#fff">← Desistir da venda</Btn>
    </div>
  )
}
