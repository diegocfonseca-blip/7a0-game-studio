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
  requested?: string[] // jogadores que você aliciou pro leilão desta janela (1 por posição)
  sellList?: string[] // seus jogadores que você pôs no leilão desta janela (1 por posição)
  soldPos?: Sector[] // posições que você já pôs à venda nesta janela (limite 1 por posição)
  auctionDone?: boolean // o leilão desta janela já rolou (só 1 por janela)
  monte?: PoolCard[] // livres: dispensados que ninguém pagou o mínimo; pegáveis de graça
  lastTable?: TeamStand[] // classificação FINAL da sua divisão na última temporada
  lastScorers?: { name: string; teamName: string; goals: number }[] // artilharia da SUA divisão (última temp.)
  crest?: { c1: string; c2: string; symbol: string } // identidade: 2 cores + símbolo (escudo)
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
const contractUntil = (save: Save, id: string) => save.contracts?.[id]?.until ?? -1
const underContract = (save: Save, id: string) => contractUntil(save, id) >= save.seasonNo
const setContract = (save: Save, id: string, price: number): Record<string, { until: number; floor: number }> =>
  ({ ...(save.contracts ?? {}), [id]: { until: save.seasonNo + CONTRACT, floor: price } })
function loadSave(): Save | null { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function writeSave(s: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* cheio */ } }
// valor = SÓ o último lance que ganhou (o preço pago na última negociação). É o
// mínimo do próximo leilão e o que o dono paga pra renovar. undefined = nunca
// foi negociado ("novo no mercado"). Sem inflar por gol nem por nada.
function valueOf(save: Save, c: PoolCard): number | undefined {
  return floorOf(save, c)
}
function myValue(save: Save, c: WonCard): number {
  return floorOf(save, c) ?? Math.max(1, c.paid)
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
    stage: 'preWindow', requested: [], soldPos: [], auctionDone: false, monte: base.monte ?? [], lastTable, lastScorers,
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
    const partialTable: TeamStand[] = sortedTable(state.league).map(t => ({ name: t.id === meId ? (myName ?? t.name) : t.name, pts: t.pts, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga }))
    return <Overlay><MidWindow onContinue={() => dispatch({ type: 'RESUME_DINASTIA' })} partial={partial} partialTable={partialTable} /></Overlay>
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

type Phase = 'home' | 'transfer' | 'sell' | 'store' | 'squad' | 'scorers' | 'table' | 'auction'

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
    // zera os logs de aliciar/vender + libera 1 leilão pra janela do MEIO
    persist({ ...save, squad: kept, requested: [], soldPos: [], auctionDone: false })
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
      {phase === 'auction' && <WindowAuction save={save} persist={persist} onDone={() => setPhase('home')} />}
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
function MidWindow({ onContinue, partial, partialTable }: { onContinue: () => void; partial: PartialRow[]; partialTable: TeamStand[] }) {
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
      {phase === 'table' && <MidTable table={partialTable} division={save.division} onBack={() => setPhase('home')} />}
      {phase === 'store' && <Store save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'transfer' && <Transfer save={save} persist={persist} onBack={() => setPhase('home')} midSeason />}
      {phase === 'sell' && <SellRoom save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'auction' && <WindowAuction save={save} persist={persist} onDone={() => setPhase('home')} midSeason />}
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
      {save.auctionDone
        ? <div style={{ ...box('#eee'), padding: 10, textAlign: 'center', fontWeight: 800, fontSize: 12, color: '#888' }}>🔨 O leilão desta janela já rolou — só 1 por janela.</div>
        : <Btn onClick={() => go('auction')} bg={GOLD}>🔨 INICIAR LEILÃO {(save.requested?.length || save.sellList?.length) ? `(${(save.requested?.length ?? 0) + (save.sellList?.length ?? 0)} + mercado)` : '(mercado)'}</Btn>}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('table')} bg="#fff">📊 Tabela</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('scorers')} bg="#fff">🥇 Artilheiros</Btn></div>
      </div>
      <Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🛡️ Shopping · Escudo</Btn>
      <Btn onClick={onContinue} bg={GREEN} color="#fff">▶️ CONTINUAR — jogar o returno</Btn>
    </div>
  )
}
function MidScorers({ partial, onBack }: { partial: PartialRow[]; onBack: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🥇 Artilharia parcial · sua divisão</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Primeiro turno desta temporada, na sua divisão.</p>
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
// classificação PARCIAL (ao vivo) da sua divisão, na janela do meio
function MidTable({ table, division, onBack }: { table: TeamStand[]; division: Division; onBack: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>📊 Classificação · {DIV_LABEL[division]}</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Como está agora, no meio da temporada. 🟢 topo sobe · 🔴 base cai.</p>
      <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 2 }}>
        <div style={{ display: 'flex', fontSize: 10, fontWeight: 800, color: '#aaa', padding: '0 6px 2px' }}>
          <span style={{ width: 22 }}>#</span><span style={{ flex: 1 }}>Time</span><span style={{ width: 26, textAlign: 'center' }}>P</span><span style={{ width: 52, textAlign: 'center' }}>V-E-D</span><span style={{ width: 34, textAlign: 'right' }}>SG</span>
        </div>
        {table.map((t, i) => {
          const zone = i < 4 ? '#1B7A3D' : i >= 16 ? '#E8503A' : 'transparent'
          return (
            <div key={t.name + i} style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
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
          <div style={{ flex: 1 }}><Btn onClick={() => go('transfer')} bg="#fff">🔎 Aliciar</Btn></div>
          <div style={{ flex: 1 }}><Btn onClick={() => go('sell')} bg="#fff">🔨 Vender</Btn></div>
        </div>
        <div style={{ marginTop: 10 }}>
          {save.auctionDone
            ? <div style={{ ...box('#eee'), padding: 10, textAlign: 'center', fontWeight: 800, fontSize: 12, color: '#888' }}>🔨 O leilão desta janela já rolou — só 1 por janela.</div>
            : <Btn onClick={() => go('auction')} bg={GOLD}>🔨 INICIAR LEILÃO {(save.requested?.length || save.sellList?.length) ? `(${(save.requested?.length ?? 0) + (save.sellList?.length ?? 0)} + mercado)` : '(mercado)'}</Btn>}
        </div>
      </div>
      <Btn onClick={playSeason} bg={GREEN} color="#fff">▶️ JOGAR A TEMPORADA {save.seasonNo}</Btn>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🛡️ Escudo</Btn></div>
      </div>
      <Btn onClick={() => go('table')} bg="#fff">📊 Tabela + Artilheiros</Btn>
    </div>
  )
}

// ─── ELENCO / ESCALAÇÃO ──────────────────────────────────────────────
// mini-campinho com o XI da formação escolhida (mesmo esquema do jogo)
function MiniPitch({ squad, formation }: { squad: WonCard[]; formation: FormationKey }) {
  const xi = bestXI(squad, FORM_NEED[formation]) as WonCard[]
  const pick = (p: Sector) => xi.filter(c => c.pos === p)
  const lats = pick('LAT'), zags = pick('ZAG')
  const def = [lats[0], ...zags, lats[1]].filter(Boolean) as WonCard[]
  const rows: { key: string; cards: (WonCard | null)[] }[] = [
    { key: 'ATA', cards: fill(pick('ATA'), FORM_NEED[formation].ATA) },
    { key: 'MEI', cards: fill(pick('MEI'), FORM_NEED[formation].MEI) },
    { key: 'DEF', cards: fill(def, FORM_NEED[formation].LAT + FORM_NEED[formation].ZAG) },
    { key: 'GOL', cards: fill(pick('GOL'), FORM_NEED[formation].GOL) },
  ]
  return (
    <div style={{ border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}` }}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)` }}>
        {rows.map(row => (
          <div key={row.key} style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {row.cards.map((c, i) => (
              <div key={i} style={{ border: `2px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '3px 7px', minWidth: 62, background: c ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: c ? RED : '#fff' }}>{row.key === 'DEF' ? (c ? c.pos : 'DEF') : row.key}</div>
                <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.05, color: c ? INK : 'rgba(255,255,255,0.95)' }}>{c ? c.name : '⚠️ vazio'}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
const fill = <T,>(arr: T[], n: number): (T | null)[] => Array.from({ length: n }, (_, i) => arr[i] ?? null)

function SquadScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const byPos = SECTORS.map(p => ({ p, cards: save.squad.filter(c => c.pos === p) }))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>👥 Elenco · {save.formation} · {save.squad.length} jogadores</p>
      <MiniPitch squad={save.squad} formation={save.formation} />
      <div style={{ ...box('#EAF3FF'), padding: 9 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ A formação <b>{save.formation}</b> foi definida no começo da dinastia e não muda. A <b>tática</b> (defensivo / equilibrado / ofensivo) você escolhe <b>durante a partida</b>, no campinho.</p>
      </div>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, marginTop: 4 }}>Elenco completo</p>
      {byPos.map(({ p, cards }) => cards.length > 0 && (
        <div key={p}>
          <p style={{ fontWeight: 800, fontSize: 12, color: '#888', marginBottom: 4 }}>{SECTOR_LABEL[p]}</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {cards.map(c => (
              <div key={c.id} style={{ ...box('#fff'), padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 900, ...OSWALD }}>{c.name}</div><div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{c.club} · {c.year}{save.goalsLast[c.id] ? ` · ⚽ ${save.goalsLast[c.id]}` : ''} · {(() => { const u = contractUntil(save, c.id); if (u < save.seasonNo) return <span style={{ color: RED, fontWeight: 900 }}>⚠️ vencido</span>; if (u === save.seasonNo) return <span style={{ color: RED, fontWeight: 900 }}>🔴 último ano do contrato</span>; return <>📄 até temp. {u}</> })()} · piso {floorOf(save, c) ?? Math.max(1, c.paid)}</div></div>
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
          const on = (save.requested ?? []).includes(c.id)
          const posOther = attemptedPos.has(p) && !on // já aliciou OUTRO nessa posição
          const dis = under || posOther
          const fl = floorOf(save, c)
          const toggle = () => on
            ? persist({ ...save, requested: (save.requested ?? []).filter(id => id !== c.id) })
            : persist({ ...save, requested: [...(save.requested ?? []), c.id] })
          return (
            <button key={c.id} disabled={dis} onClick={toggle} style={{ ...box(on ? '#EAF7EE' : dis ? '#eee' : '#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: dis ? 'default' : 'pointer', textAlign: 'left', opacity: dis ? 0.55 : 1, border: on ? `3px solid ${GREEN}` : `3px solid ${INK}` }}>
              <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
              {on ? <span style={{ fontWeight: 800, color: GREEN, fontSize: 12 }}>✔ no leilão · tirar</span> : under ? <span style={{ fontWeight: 800, color: RED, fontSize: 12 }}>🔒 contrato (temp. {contractUntil(save, c.id)})</span> : posOther ? <span style={{ fontWeight: 800, color: '#999', fontSize: 12 }}>já aliciou 1 {c.pos}</span> : <span style={{ fontWeight: 800, fontSize: 12, textAlign: 'right' }}>{fl !== undefined ? <>💰 valor {fl} <span style={{ fontSize: 10, color: '#888' }}>(mín.)</span></> : <span style={{ color: '#888' }}>novo no mercado</span>}<br /><span style={{ color: GREEN, fontSize: 11 }}>+ aliciar</span></span>}
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

// Monte de livres: dispensados / sobra do mercado. Grátis só quem NUNCA custou
// mais que 1 moeda; se já teve dono por 15, o próximo paga 15 (o piso do cara).
function MonteFreeAgents({ save, persist }: { save: Save; persist: (s: Save) => void }) {
  const monte = save.monte ?? []
  if (monte.length === 0) return null
  const holeAt = (p: Sector) => save.squad.filter(c => c.pos === p).length < FORM_NEED[save.formation][p]
  const priceOf = (c: PoolCard) => Math.max(1, floorOf(save, c) ?? 1)
  const grab = (c: PoolCard) => {
    if (!holeAt(c.pos)) return
    const price = priceOf(c)
    const free = price <= 1
    if (!free && save.coins < price) return
    const paid = free ? 0 : price
    const wc: WonCard = { ...c, paid, via: 'monte' }
    persist({ ...save, coins: save.coins - paid, squad: [...save.squad, wc], monte: monte.filter(x => x.id !== c.id), contracts: setContract(save, c.id, price) })
  }
  return (
    <div style={{ ...box('#F0EAD8'), padding: 10, display: 'grid', gap: 6 }}>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>🎁 Monte — livres</p>
      <p style={{ fontSize: 11, color: '#777', fontWeight: 700 }}>Sobras do mercado. <b>Grátis</b> só quem nunca custou mais que 1 moeda; se já teve dono, você paga o <b>piso</b> que ele carrega. Precisa de vaga na posição.</p>
      {monte.map(c => {
        const can = holeAt(c.pos)
        const price = priceOf(c)
        const free = price <= 1
        const broke = !free && save.coins < price
        const disabled = !can || broke
        const label = !can ? 'sem vaga' : free ? 'Pegar grátis' : broke ? `faltam 💰${price - save.coins}` : `Pagar 💰 ${price}`
        return (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}><Pos p={c.pos} /> {c.name} {!free && <span style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>· piso {price}</span>}</span>
            <button onClick={() => grab(c)} disabled={disabled} style={{ background: disabled ? '#ccc' : free ? GREEN : GOLD, color: disabled ? '#fff' : INK, border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 10px', fontWeight: 900, fontSize: 12, cursor: disabled ? 'default' : 'pointer', ...OSWALD }}>{label}</button>
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

// ─── LEILÃO ÚNICO DA JANELA (formato tradicional: envelope + revelação) ──
type LotKind = 'market' | 'aliciar' | 'sell'
interface Lot { card: PoolCard; kind: LotKind; ownerName?: string; floor?: number; perceived: number }
interface BidRow { name: string; amount: number; mine: boolean; winner: boolean }
interface LotResult { lot: Lot; outcome: 'you' | 'rival' | 'owner' | 'none'; by: string; price: number; dropped?: string; droppedCard?: WonCard; bids: BidRow[] }

// monta o baralho da janela: 1 do mercado por posição (sorteio uniforme, sem os
// seus nem dos rivais) + os que você aliciou + os que você pôs à venda.
function buildWindowDeck(save: Save, rng: () => number): Lot[] {
  const lots: Lot[] = []; const used = new Set<string>()
  const rivalOwned = new Set<string>()
  for (const w of save.world) if (w.rival) for (const c of w.squad) rivalOwned.add(c.id)
  const mineIds = new Set(save.squad.map(c => c.id))
  for (const c of save.monte ?? []) used.add(c.id) // livres do monte não entram no sorteio do mercado
  const add = (card: PoolCard, kind: LotKind, ownerName?: string) => {
    if (used.has(card.id)) return; used.add(card.id)
    const floor = kind === 'sell' ? (floorOf(save, card) ?? Math.max(1, (card as WonCard).paid)) : floorOf(save, card)
    lots.push({ card, kind, ownerName, floor, perceived: valueOf(save, card) ?? baseValue(card) })
  }
  for (const id of save.requested ?? []) { const owner = save.world.find(w => w.squad.some(c => c.id === id)); const card = owner?.squad.find(c => c.id === id); if (owner && card) add(card, 'aliciar', owner.name) }
  for (const id of save.sellList ?? []) { const card = save.squad.find(c => c.id === id); if (card) add(card, 'sell', save.clubName) }
  for (const p of SECTORS) {
    const cands = POOL.filter(c => c.pos === p && !mineIds.has(c.id) && !rivalOwned.has(c.id) && !used.has(c.id))
    if (cands.length) { const pick = cands[Math.floor(rng() * cands.length)]; const owner = save.world.find(w => w.squad.some(c => c.id === pick.id)); add(pick, 'market', owner?.name) }
  }
  return lots.sort((a, b) => SECTORS.indexOf(a.card.pos) - SECTORS.indexOf(b.card.pos))
}
// lances secretos dos seus rivais fixos num lote (cada um com cofre próprio)
function rivalBids(save: Save, lot: Lot, rng: () => number): { name: string; bid: number }[] {
  const minBid = lot.floor ?? 1
  return save.world.filter(w => w.rival && w.name !== lot.ownerName).map(w => {
    const cofre = 25 + save.seasonNo * 4 + ({ D: 0, C: 6, B: 14, A: 24 }[w.div])
    const wants = lot.perceived > 6 && cofre >= minBid && rng() < (lot.perceived > 14 ? 0.85 : 0.5)
    const bid = wants ? Math.min(cofre, Math.max(minBid, Math.round(lot.perceived * (0.8 + rng() * 0.8)))) : 0
    return { name: w.name, bid }
  }).filter(r => r.bid >= minBid)
}
// defesa do dono (só quando você ALICIA jogador de outro clube). Com cara de
// HUMANO: nem sempre ele banca pra segurar — às vezes deixa ir. Se ninguém dá
// lance, o jogador volta pro dono com o MESMO contrato de antes.
function ownerDefend(save: Save, lot: Lot, rng: () => number): number {
  if (lot.kind !== 'aliciar' || !lot.ownerName) return 0
  const owner = save.world.find(w => w.name === lot.ownerName); if (!owner) return 0
  const wantsToKeep = rng() < (lot.perceived > 14 ? 0.8 : lot.perceived > 8 ? 0.55 : 0.35)
  if (!wantsToKeep) return 0
  const divW = { D: 0.2, C: 0.5, B: 0.9, A: 1.4 }[owner.div]
  const importance = Math.min(2.4, 0.9 + divW + (lot.perceived > 15 ? 0.6 : 0))
  return Math.max(lot.floor ?? 1, Math.round(lot.perceived * importance * (0.9 + rng() * 0.4)))
}
// aplica UM lote ao rascunho do save (compra/venda/renovação) e devolve o resultado
function applyLot(draft: Save, lot: Lot, myBid: number, rng: () => number): { draft: Save; result: LotResult } {
  const minBid = lot.floor ?? 1
  const mine = myBid >= minBid && myBid <= draft.coins ? myBid : 0
  const rivals = rivalBids(draft, lot, rng)
  const owner = ownerDefend(draft, lot, rng)
  type E = { name: string; bid: number; who: 'you' | 'rival' | 'owner' }
  const entrants: E[] = []
  if (lot.kind !== 'sell' && mine > 0) entrants.push({ name: draft.clubName, bid: mine, who: 'you' })
  for (const r of rivals) entrants.push({ name: r.name, bid: r.bid, who: 'rival' })
  if (owner > 0) entrants.push({ name: lot.ownerName!, bid: owner, who: 'owner' })
  entrants.sort((a, b) => b.bid - a.bid || (a.who === 'you' ? -1 : 1)) // empate: você leva
  const win = entrants[0]
  const bidRows: BidRow[] = entrants.map(e => ({ name: e.who === 'you' ? 'Você' : e.name, amount: e.bid, mine: e.who === 'you', winner: e === win }))
  const removeFromOwner = (name: string) => draft.world.map(w => w.name === name ? { ...w, squad: w.squad.filter(c => c.id !== lot.card.id).concat(filler(lot.card.pos, rng)) } : w)
  const giveToRival = (name: string) => draft.world.map(w => w.name === name ? { ...w, squad: giveToTeam(w.squad, lot.card) } : w)
  // adiciona ao SEU elenco mantendo o teto da formação (o pior do setor vai pro monte)
  const addToMe = (price: number): { name?: string; card?: WonCard } => {
    let squad: WonCard[] = [...draft.squad, { ...(lot.card as Card), paid: price, via: 'leilao' as const }]
    const atPos = squad.filter(c => c.pos === lot.card.pos)
    if (atPos.length > FORM_NEED[draft.formation][lot.card.pos]) {
      const worst = atPos.slice().sort((a, b) => mid(a) - mid(b))[0]
      squad = squad.filter(c => c.id !== worst.id)
      draft.monte = [...(draft.monte ?? []), { ...worst }]
      draft.squad = squad
      return { name: worst.name, card: worst }
    }
    draft.squad = squad
    return {}
  }
  if (!win) {
    if (lot.kind === 'market') draft.monte = [...(draft.monte ?? []), { ...lot.card }]
    return { draft, result: { lot, outcome: 'none', by: '', price: 0, bids: bidRows } } // aliciar/sell sem lance: fica com o dono
  }
  if (win.who === 'you') {
    draft.contracts = setContract(draft, lot.card.id, win.bid) // novo dono: contrato novo de 5
    draft.coins -= win.bid
    if (lot.ownerName && lot.ownerName !== draft.clubName) draft.world = removeFromOwner(lot.ownerName)
    const drop = addToMe(win.bid)
    return { draft, result: { lot, outcome: 'you', by: draft.clubName, price: win.bid, dropped: drop.name, droppedCard: drop.card, bids: bidRows } }
  }
  if (win.who === 'owner') {
    // dono renovou: SOMA +5 ao contrato que já tinha (4 → 9), valor = o lance
    const cur = contractUntil(draft, lot.card.id)
    const base = cur >= draft.seasonNo ? cur : draft.seasonNo
    draft.contracts = { ...(draft.contracts ?? {}), [lot.card.id]: { until: base + CONTRACT, floor: win.bid } }
    return { draft, result: { lot, outcome: 'owner', by: win.name, price: win.bid, bids: bidRows } }
  }
  draft.contracts = setContract(draft, lot.card.id, win.bid) // rival = novo dono: contrato novo de 5
  if (lot.kind === 'sell') { draft.coins += win.bid; draft.squad = draft.squad.filter(c => c.id !== lot.card.id) }
  else if (lot.ownerName && lot.ownerName !== draft.clubName) draft.world = removeFromOwner(lot.ownerName)
  draft.world = giveToRival(win.name)
  return { draft, result: { lot, outcome: 'rival', by: win.name, price: win.bid, bids: bidRows } }
}

const AUC_SECONDS = 45
const kindLabel: Record<LotKind, string> = { market: '🆕 mercado', aliciar: '🎯 aliciado', sell: '🔻 à venda' }
// Leilão da janela no MESMO FLUXO do pregão dos outros modos: POR POSIÇÃO —
// envelope cego (45s) → martelo revelando os lances → próxima posição → monte.
function WindowAuction({ save, persist, onDone, midSeason }: { save: Save; persist: (s: Save) => void; onDone: () => void; midSeason?: boolean }) {
  const rng = useMemo(() => mulberry((save.seed ^ (save.seasonNo * 777) ^ (save.stage === 'midWindow' ? 99 : 1)) >>> 0), []) // eslint-disable-line
  const deck = useMemo(() => buildWindowDeck(save, rng), []) // eslint-disable-line
  const byPos = useMemo(() => SECTORS.map(p => ({ p, lots: deck.filter(l => l.card.pos === p) })).filter(g => g.lots.length > 0), [deck])
  // rascunho persistente do save, acumulado posição a posição
  const draftRef = useRef<Save | null>(null)
  if (!draftRef.current) draftRef.current = { ...save, squad: [...save.squad], world: save.world.map(w => ({ ...w, squad: [...w.squad] })), contracts: { ...(save.contracts ?? {}) }, monte: [...(save.monte ?? [])] }

  const [sectorIdx, setSectorIdx] = useState(0)
  const [phase, setPhase] = useState<'bid' | 'reveal'>('bid')
  const [pick, setPick] = useState<{ lotId: string; amount: number } | null>(null) // seu lance nesta posição (1 compra/pos)
  const [left, setLeft] = useState(AUC_SECONDS)
  const [secResults, setSecResults] = useState<LotResult[]>([])
  const [secSnapshots, setSecSnapshots] = useState<Save[]>([]) // snapshot do draft ANTES de cada lote — pra "desistir"
  const [revealIdx, setRevealIdx] = useState(0)
  const [allResults, setAllResults] = useState<LotResult[]>([])
  const [resolved, setResolved] = useState<Record<number, true>>({}) // por globalIdx: escolha do overflow já feita
  const [finished, setFinished] = useState(false)
  const sealedRef = useRef(false)

  if (byPos.length === 0) { return <div style={{ display: 'grid', gap: 10 }}><p style={{ fontWeight: 700 }}>Nada no leilão desta janela.</p><Btn onClick={onDone} bg="#fff">← Voltar</Btn></div> }
  const cur = byPos[Math.min(sectorIdx, byPos.length - 1)]
  const coins = draftRef.current.coins
  const globalIdx = (localIdx: number) => allResults.length - secResults.length + localIdx
  const currentR = secResults[Math.min(revealIdx, Math.max(0, secResults.length - 1))]
  const needsChoice = phase === 'reveal' && !!currentR && currentR.outcome === 'you' && !!currentR.droppedCard && !resolved[globalIdx(revealIdx)]

  const sealSector = () => {
    if (sealedRef.current) return; sealedRef.current = true
    const draft = draftRef.current!
    const out: LotResult[] = []
    const snaps: Save[] = []
    for (const lot of cur.lots) {
      snaps.push(structuredClone(draft))
      const myBid = pick && pick.lotId === lot.card.id ? pick.amount : 0
      out.push(applyLot(draft, lot, myBid, rng).result)
    }
    setSecSnapshots(snaps)
    setSecResults(out); setAllResults(a => [...a, ...out]); setRevealIdx(0); setPhase('reveal')
  }
  const nextSector = () => {
    if (sectorIdx < byPos.length - 1) {
      setSectorIdx(i => i + 1); setPhase('bid'); setPick(null); setLeft(AUC_SECONDS); setSecResults([]); setSecSnapshots([]); setRevealIdx(0); sealedRef.current = false
    } else {
      const draft = draftRef.current!; draft.requested = []; draft.sellList = []; draft.soldPos = []; draft.auctionDone = true
      persist(draft); setFinished(true)
    }
  }
  // cronômetro de 45s da posição → lacra sozinho
  useEffect(() => {
    if (phase !== 'bid' || finished) return
    if (left <= 0) { sealSector(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, phase, finished]) // eslint-disable-line
  // revelação passa SOZINHA (fluido, igual os outros modos): martela um por um e
  // vai pra próxima posição automaticamente. PAUSA quando o técnico precisa
  // escolher o que fazer com quem sobrou.
  useEffect(() => {
    if (phase !== 'reveal' || finished) return
    if (needsChoice) return // segura a fita até o técnico decidir
    const atLast = revealIdx >= secResults.length - 1
    const t = setTimeout(() => { if (atLast) nextSector(); else setRevealIdx(i => i + 1) }, atLast ? 1600 : 1200)
    return () => clearTimeout(t)
  }, [phase, revealIdx, finished, secResults.length, needsChoice]) // eslint-disable-line

  // ─── ações do modal de escolha ao lotar posição ────────────────────
  const resolveChoice = () => { setResolved(prev => ({ ...prev, [globalIdx(revealIdx)]: true })) }
  const doDispensar = () => { resolveChoice() } // default: pior já foi pro monte no applyLot
  const doDesistir = () => {
    // reverte tudo: restaura o draft ANTES do lote (dinheiro, elenco, monte, dono)
    const snap = secSnapshots[revealIdx]
    if (!snap) { resolveChoice(); return }
    const restored = structuredClone(snap)
    // muta draftRef mantendo a referência
    const d = draftRef.current!
    d.squad = restored.squad; d.coins = restored.coins; d.monte = restored.monte
    d.world = restored.world; d.contracts = restored.contracts
    // atualiza o resultado exibido: virou "desistência"
    const r = secResults[revealIdx]
    const newRes: LotResult = { ...r, outcome: 'none', by: '', price: 0, dropped: undefined, droppedCard: undefined, bids: [] }
    setSecResults(cur => cur.map((x, i) => i === revealIdx ? newRes : x))
    setAllResults(cur => cur.map((x, i) => i === globalIdx(revealIdx) ? newRes : x))
    resolveChoice()
  }
  const doOferta = (amount: number) => {
    // vende o dispensado pelo valor da oferta: tira do monte, entra dinheiro
    const r = secResults[revealIdx]
    if (!r.droppedCard) { resolveChoice(); return }
    const d = draftRef.current!
    d.coins = d.coins + amount
    d.monte = (d.monte ?? []).filter(c => c.id !== r.droppedCard!.id)
    resolveChoice()
  }
  // troca quem sai: devolve o atual dropped ao elenco, tira o novo escolhido e
  // manda ele pro monte. Atualiza o resultado exibido pra refletir a troca.
  const doChangeDropped = (newId: string) => {
    const r = secResults[revealIdx]; if (!r.droppedCard) return
    if (newId === r.droppedCard.id) return
    const d = draftRef.current!
    const chosen = d.squad.find(c => c.id === newId && c.pos === r.droppedCard!.pos)
    if (!chosen) return
    // desfaz o descarte anterior
    const restored: WonCard = { ...r.droppedCard }
    d.monte = (d.monte ?? []).filter(c => c.id !== restored.id)
    d.squad = [...d.squad.filter(c => c.id !== chosen.id), restored]
    d.monte = [...(d.monte ?? []), { ...chosen }]
    const newRes: LotResult = { ...r, dropped: chosen.name, droppedCard: { ...chosen } }
    setSecResults(cur => cur.map((x, i) => i === revealIdx ? newRes : x))
    setAllResults(cur => cur.map((x, i) => i === globalIdx(revealIdx) ? newRes : x))
  }


  const label: Record<LotResult['outcome'], string> = { you: '✅ VOCÊ LEVOU', rival: '😤 rival levou', owner: '🛡️ dono segurou', none: '— ninguém deu lance' }

  if (finished) {
    const unsold = allResults.filter(r => r.outcome === 'none' && r.lot.kind === 'market').length
    const dispensados = allResults.filter(r => !!r.dropped).length
    const mine = allResults.filter(r => r.outcome === 'you')
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ ...box(INK), padding: 14, color: '#fff', textAlign: 'center' }}><p style={{ fontWeight: 900, fontSize: 20, ...OSWALD }}>🏁 Fim do pregão</p></div>
        {mine.length > 0
          ? mine.map((r, i) => <div key={i} style={{ ...box(GOLD), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', ...OSWALD, fontWeight: 900 }}><span><Pos p={r.lot.card.pos} /> {r.lot.card.name}</span><span>💰 {r.price}</span></div>)
          : <div style={{ ...box('#fff'), padding: 12, textAlign: 'center', fontWeight: 700, color: '#888' }}>Você não levou ninguém desta vez.</div>}
        {unsold > 0 && <div style={{ ...box('#F0EAD8'), padding: 10 }}><p style={{ fontSize: 12, fontWeight: 700 }}>🎁 {unsold} do mercado ninguém quis — vira{unsold > 1 ? 'ram' : ''} <b>livre no Monte</b>. Se nunca custou mais que 1, sai grátis; se já teve dono, você paga o piso dele.</p></div>}
        {dispensados > 0 && <div style={{ ...box('#EAF3FF'), padding: 10 }}><p style={{ fontSize: 12, fontWeight: 700 }}>➖ {dispensados} dispensado{dispensados > 1 ? 's' : ''} porque a posição encheu — foi{dispensados > 1 ? 'ram' : ''} pro <b>Monte</b> pelo piso que carrega.</p></div>}
        <Btn onClick={onDone} bg={GREEN} color="#fff">✅ Pronto</Btn>
      </div>
    )
  }

  // topo estilo leilão real: título grande da posição + caixinha de Tempo
  const timerCol = left <= 10 ? RED : left <= 20 ? GOLD : GREEN
  const timerTxt = left <= 20 ? INK : '#fff'
  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 900, fontSize: 28, ...OSWALD, lineHeight: 1 }}>🔨 {SECTOR_LABEL[cur.p].toUpperCase()}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#666', marginTop: 3 }}>Lance cego: distribua suas moedas em segredo. Posição {sectorIdx + 1} de {byPos.length}.</p>
      </div>
      {phase === 'bid' && (
        <div style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: '4px 10px', textAlign: 'center', minWidth: 60, background: timerCol, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: timerTxt }}>Tempo</p>
          <p style={{ fontSize: 24, fontWeight: 900, ...OSWALD, lineHeight: 1, color: timerTxt }}>{left}s</p>
        </div>
      )}
    </div>
  )
  // "cara de carta" do jogo (chip de posição + nome + clube·ano)
  const Face = ({ c, big = false }: { c: PoolCard; big?: boolean }) => (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Pos p={c.pos} /><span style={{ fontWeight: 900, fontSize: big ? 24 : 16, ...OSWALD }}>{c.name}</span></div>
      <p style={{ fontSize: big ? 13 : 11, fontWeight: 700, color: 'rgba(0,0,0,0.55)', marginTop: 2 }}>{c.club} · {c.year}</p>
    </div>
  )

  if (phase === 'reveal') {
    const r = secResults[Math.min(revealIdx, secResults.length - 1)]
    const last = sectorIdx >= byPos.length - 1
    const atLast = revealIdx >= secResults.length - 1
    return (
      <div style={{ display: 'grid', gap: 10, position: 'relative' }}>
        {header}
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)' }}>Revelação {revealIdx + 1} / {secResults.length} · {SECTOR_LABEL[cur.p]}</p>
        <div style={{ ...box(r.lot.card.fame >= 5 ? GOLD : '#fff'), padding: 16 }}>
          <Face c={r.lot.card} big />
          <p style={{ fontSize: 11, fontWeight: 800, color: '#888', marginTop: 4 }}>{kindLabel[r.lot.kind]}{r.lot.floor !== undefined ? ` · piso ${r.lot.floor}` : ' · novo no mercado'}</p>
          <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
            {r.bids.length === 0 && <p style={{ fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{r.outcome === 'none' && r.lot.kind !== 'market' ? '🙅 Você desistiu — fica com o dono.' : `Nenhum lance. ${r.lot.kind === 'market' ? 'Vai pro Monte Final. 🪣' : 'Fica com o dono.'}`}</p>}
            {r.bids.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px solid ${INK}`, borderRadius: 8, padding: '6px 12px', background: b.winner ? GREEN : '#fff' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: b.winner ? '#fff' : INK }}>{b.mine ? '🫵 Você' : b.name}{b.winner && r.outcome === 'owner' ? ' (segurou)' : ''}</span>
                <span style={{ fontWeight: 900, ...OSWALD, color: b.winner ? '#fff' : INK }}>💰 {b.amount}</span>
              </div>
            ))}
          </div>
          <p style={{ fontWeight: 900, ...OSWALD, marginTop: 12, color: r.outcome === 'you' ? GREEN : INK }}>{label[r.outcome]}{r.dropped ? ` · ${r.dropped} sai do elenco` : ''}</p>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#999' }}>{needsChoice ? 'aguardando sua decisão…' : atLast ? (last ? 'encerrando o pregão…' : 'indo pra próxima posição…') : 'martelando…'}</p>
        {needsChoice && currentR?.droppedCard && (
          <OverflowChoiceModal
            incoming={currentR.lot.card}
            dropped={currentR.droppedCard}
            paidForIncoming={currentR.price}
            posCands={draftRef.current!.squad.filter(c => c.pos === currentR.droppedCard!.pos)}
            floorOfDropped={floorOf(draftRef.current!, currentR.droppedCard) ?? Math.max(1, currentR.droppedCard.paid)}
            rivalsCount={draftRef.current!.world.filter(w => w.rival).length}
            onDispensar={doDispensar}
            onDesistir={doDesistir}
            onOferta={doOferta}
            onChangeDropped={doChangeDropped}
            rng={rng}
          />
        )}
      </div>
    )
  }


  // fase de LANCE (envelope) da posição atual — cartas com stepper −/+ e LACRAR
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {header}
      {sectorIdx === 0 && <div style={{ ...box('#FFF1C9'), padding: 8 }}><p style={{ fontSize: 12, fontWeight: 800, color: '#7a5b00' }}>💡 Ganha quem dá o <b>maior lance</b>. Piso = último valor pago.{midSeason ? ' ⏸️ Janela do meio: só entra na próxima temporada.' : ''}</p></div>}
      {cur.lots.map(lot => {
        const minBid = lot.floor ?? 1
        const isPick = pick?.lotId === lot.card.id
        const val = isPick ? pick.amount : 0
        const inc = () => setPick(pk => pk?.lotId === lot.card.id ? { lotId: lot.card.id, amount: Math.min(coins, pk.amount + 1) } : { lotId: lot.card.id, amount: Math.min(coins, minBid) })
        const dec = () => setPick(pk => { if (pk?.lotId !== lot.card.id) return pk; const a = pk.amount - 1; return a < minBid ? null : { lotId: lot.card.id, amount: a } })
        const plusOff = minBid > coins || (isPick && val >= coins)
        return (
          <div key={lot.card.id} style={{ ...box(isPick ? '#EAF7EE' : '#fff'), padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: isPick ? `3px solid ${GREEN}` : `3px solid ${INK}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Face c={lot.card} />
              <p style={{ fontSize: 10, fontWeight: 800, color: '#999', marginTop: 3 }}>{kindLabel[lot.kind]}{lot.ownerName && lot.kind !== 'sell' ? ` · ${lot.ownerName}` : ''}{lot.floor !== undefined ? ` · piso ${lot.floor}` : ''}</p>
            </div>
            {lot.kind === 'sell'
              ? <span style={{ fontSize: 10, fontWeight: 700, color: '#888', textAlign: 'right', maxWidth: 100 }}>seu — rivais brigam</span>
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#B8860B' }}>seu lance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={dec} style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${INK}`, background: '#fff', fontWeight: 900, fontSize: 18, cursor: 'pointer' }}>−</button>
                    <span style={{ width: 34, textAlign: 'center', fontWeight: 900, ...OSWALD }}>{val}</span>
                    <button onClick={() => !plusOff && inc()} disabled={plusOff} style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${INK}`, background: GOLD, opacity: plusOff ? 0.4 : 1, fontWeight: 900, fontSize: 18, cursor: plusOff ? 'default' : 'pointer' }}>+</button>
                  </div>
                </div>}
          </div>
        )
      })}
      <div style={{ ...box('#fff'), padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, ...OSWALD }}>ENVELOPE: {pick?.amount ?? 0} / {coins}</span>
        <div style={{ width: 130 }}><Btn onClick={sealSector} bg={RED} color="#fff">LACRAR 🔒</Btn></div>
      </div>
      <MiniPitch squad={draftRef.current.squad} formation={save.formation} />
      {sectorIdx === 0 && <Btn onClick={onDone} bg="#fff">← Sair sem lançar</Btn>}
    </div>
  )
}

// ─── VENDER: escolhe quem pôr no leilão da janela (1 por posição) ────
function SellRoom({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const listed = new Set(save.sellList ?? [])
  const listedPos = new Set<Sector>()
  for (const id of save.sellList ?? []) { const c = save.squad.find(x => x.id === id); if (c) listedPos.add(c.pos) }
  const toggle = (c: WonCard) => {
    if (listed.has(c.id)) persist({ ...save, sellList: (save.sellList ?? []).filter(id => id !== c.id) })
    else if (!listedPos.has(c.pos)) persist({ ...save, sellList: [...(save.sellList ?? []), c.id] })
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Pôr à venda</p>
      <div style={{ ...box('#EAF3FF'), padding: 9 }}><p style={{ fontSize: 12, fontWeight: 700 }}>ℹ️ Marque quem entra no <b>leilão da janela</b> (1 por posição). No pregão, seus rivais brigam por ele — se venderem, você recebe. Se você mesmo cobrir o lance, <b>renova</b>. Depois é só <b>Iniciar Leilão</b> na tela inicial.</p></div>
      {save.squad.map(c => {
        const on = listed.has(c.id)
        const blocked = !on && listedPos.has(c.pos)
        return (
          <button key={c.id} disabled={blocked} onClick={() => toggle(c)} style={{ ...box(on ? '#EAF7EE' : blocked ? '#eee' : '#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: blocked ? 'default' : 'pointer', textAlign: 'left', opacity: blocked ? 0.55 : 1, border: on ? `3px solid ${GREEN}` : `3px solid ${INK}` }}>
            <span style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</span>
            {on ? <span style={{ fontWeight: 800, color: GREEN, fontSize: 12 }}>✔ no leilão · tirar</span> : blocked ? <span style={{ fontWeight: 800, color: '#999', fontSize: 12 }}>já tem 1 {c.pos}</span> : <span style={{ fontWeight: 800, color: '#888', fontSize: 13 }}>vale ~{myValue(save, c)} 💰</span>}
          </button>
        )
      })}
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── ESCOLHA AO LOTAR POSIÇÃO ──────────────────────────────────────────────
// Você ganhou um cara e sua posição estourou. Antes de mandar o pior do setor
// pro monte automaticamente, pergunta o que fazer com ele. Você pode TROCAR
// quem sai (não precisa ser o pior), tentar VENDER com N ofertas (uma por rival
// real da sua liga), dispensar de graça ou desistir da compra.
function OverflowChoiceModal({ incoming, dropped, paidForIncoming, posCands, floorOfDropped, rivalsCount, onDispensar, onDesistir, onOferta, onChangeDropped, rng }: {
  incoming: PoolCard; dropped: WonCard; paidForIncoming: number
  posCands: WonCard[]; floorOfDropped: number; rivalsCount: number
  onDispensar: () => void; onDesistir: () => void; onOferta: (amount: number) => void
  onChangeDropped: (newId: string) => void
  rng: () => number
}) {
  const [step, setStep] = useState<'menu' | 'swap' | 'oferta'>('menu')
  const [offerIdx, setOfferIdx] = useState(0)
  const [done, setDone] = useState<{ sold: boolean; amount: number; by: string } | null>(null)
  const minimum = Math.max(1, floorOfDropped + 5) // +5 pra renovar o piso ao pôr à venda
  const val = Math.max(minimum, Math.round(mid(dropped)))
  const n = Math.max(1, rivalsCount)
  const offers = useMemo(() => Array.from({ length: n }, (_, i) => {
    const roll = rng(); let f = 0.4 + rng() * 1.4
    if (roll > 0.85) f = 1.6 + rng() * 1.1; else if (roll < 0.25) f = 0.2 + rng() * 0.3
    return { amount: Math.max(1, Math.round(val * f)), by: `Rival ${i + 1}` }
  }), []) // eslint-disable-line

  const backdrop: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 10000 }
  const card: React.CSSProperties = { background: CREAM, border: `3px solid ${INK}`, borderRadius: 16, padding: 16, maxWidth: 380, width: '100%', boxShadow: `6px 6px 0 0 ${INK}`, display: 'grid', gap: 10, maxHeight: '90vh', overflowY: 'auto' }
  const posBadge = (
    <div style={{ ...box(GOLD), padding: '8px 10px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: '#7a5c00', textTransform: 'uppercase' }}>Posição lotada</p>
      <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD, lineHeight: 1 }}>{SECTOR_LABEL[dropped.pos].toUpperCase()}</p>
    </div>
  )

  if (done) {
    return (
      <div style={backdrop}>
        <div style={card}>
          {posBadge}
          <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD, textAlign: 'center' }}>{done.sold ? '💰 Vendido!' : '🎁 Foi pro Monte'}</p>
          <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{done.sold ? `${dropped.name} saiu por 💰 ${done.amount} (${done.by}).` : `Ninguém topou. ${dropped.name} caiu no Monte pelo piso ${minimum}.`}</p>
          <Btn onClick={() => { if (done.sold) onOferta(done.amount); else onDispensar() }} bg={GREEN} color="#fff">✅ Pronto</Btn>
        </div>
      </div>
    )
  }

  if (step === 'swap') {
    return (
      <div style={backdrop}>
        <div style={card}>
          {posBadge}
          <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, textAlign: 'center' }}>Quem você tira?</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textAlign: 'center' }}>Todos os {SECTOR_LABEL[dropped.pos]} do seu elenco. Clique em quem vai sair (pro Monte / venda).</p>
          {posCands.map(c => {
            const sel = c.id === dropped.id
            return (
              <button key={c.id} onClick={() => { onChangeDropped(c.id); setStep('menu') }} style={{ ...box(sel ? '#EAF7EE' : '#fff'), padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', border: sel ? `3px solid ${GREEN}` : `3px solid ${INK}` }}>
                <span style={{ fontWeight: 900, ...OSWALD }}>{c.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>força ~{Math.round(mid(c))} · piso {Math.max(1, c.paid)}{sel ? ' · atual' : ''}</span>
              </button>
            )
          })}
          <Btn onClick={() => setStep('menu')} bg="#fff">← Voltar</Btn>
        </div>
      </div>
    )
  }

  if (step === 'oferta') {
    const cur = offers[offerIdx]
    const canAccept = cur.amount >= minimum
    return (
      <div style={backdrop}>
        <div style={card}>
          {posBadge}
          <div style={{ ...box(INK), padding: 12, color: '#fff', textAlign: 'center' }}>
            <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD }}>🔨 Vendendo {dropped.name}</p>
            <p style={{ fontSize: 12, opacity: 0.85 }}>Mínimo: 💰 {minimum} · vale ~{val}</p>
          </div>
          <div style={{ ...box('#fff'), padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#888' }}>Oferta {offerIdx + 1} de {offers.length} — {cur.by}</p>
            <p style={{ fontSize: 34, fontWeight: 900, ...OSWALD, margin: '4px 0', color: canAccept ? INK : RED }}>💰 {cur.amount}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>{canAccept ? 'Cobre o mínimo — dá pra vender.' : `Abaixo do mínimo (${minimum}).`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><Btn onClick={() => setDone({ sold: true, amount: cur.amount, by: cur.by })} bg={GREEN} color="#fff" disabled={!canAccept}>✅ Aceitar</Btn></div>
            <div style={{ flex: 1 }}><Btn onClick={() => { if (offerIdx < offers.length - 1) setOfferIdx(i => i + 1); else setDone({ sold: false, amount: 0, by: '' }) }} bg={RED} color="#fff">{offerIdx < offers.length - 1 ? '🎲 Recusar' : '🎁 Pro Monte'}</Btn></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={backdrop}>
      <div style={card}>
        {posBadge}
        <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: '#555' }}>
          Você contratou <b>{incoming.name}</b> ({SECTOR_LABEL[incoming.pos]}) por 💰 {paidForIncoming}. Sobra <b>{dropped.name}</b>. O que fazer?
        </p>
        {posCands.length > 1 && (
          <button onClick={() => setStep('swap')} style={{ ...box('#EAF3FF'), padding: '8px 12px', textAlign: 'center', cursor: 'pointer', border: `2px dashed ${INK}`, fontWeight: 800, fontSize: 12 }}>
            🔁 Trocar quem sai ({posCands.length} {SECTOR_LABEL[dropped.pos]} no elenco)
          </button>
        )}
        <button onClick={onDispensar} style={{ ...box('#fff'), padding: 12, textAlign: 'left', cursor: 'pointer', border: `3px solid ${INK}` }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>➖ Dispensar</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', marginTop: 3 }}>Vai pro Monte pelo piso dele (💰 {Math.max(1, floorOfDropped)}). Fica lá até alguém pagar — grátis só se o piso for 1.</p>
        </button>
        <button onClick={() => setStep('oferta')} style={{ ...box('#FFF6DE'), padding: 12, textAlign: 'left', cursor: 'pointer', border: `3px solid ${INK}` }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>💰 Dar oferta (renovar +5)</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', marginTop: 3 }}>Renova o piso pra 💰 {minimum} e ouve {n} oferta{n > 1 ? 's' : ''} — uma por rival da sua liga. Se topar, você embolsa.</p>
        </button>
        <button onClick={onDesistir} style={{ ...box('#FFE8E4'), padding: 12, textAlign: 'left', cursor: 'pointer', border: `3px solid ${INK}` }}>
          <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>🚫 Desistir da compra</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', marginTop: 3 }}>Cancela {incoming.name}, devolve as 💰 {paidForIncoming} e mantém {dropped.name}.</p>
        </button>
      </div>
    </div>
  )
}

