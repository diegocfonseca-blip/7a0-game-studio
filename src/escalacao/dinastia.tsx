// ─── MODO DINASTIA (teste — só criador) ──────────────────────────────
// Modo econômico à la Brasfoot/Elifoot: comece duro na Série D com 50
// moedas, monte um elenco, jogue a temporada, suba de divisão, ENRIQUEÇA.
// Duas carteiras: Caixa do Clube (pra time) e Fortuna Pessoal (ostentação:
// mansão, Rolex, Ferrari). Compra no mercado; VENDE em leilão COM RISCO
// (pode achar que vende por 10 e sair por 3). Artilharia GERAL das 4
// divisões + artilharia da sua divisão.
//
// ISOLADO DE PROPÓSITO: estado próprio, localStorage próprio (esc_dinastia_v1),
// montado como overlay via hash #dinastia + trava no login do criador. NÃO
// toca em nada do online / partida rápida / carreira.

import { useEffect, useMemo, useState } from 'react'
import type { Card, Sector, WonCard } from './types'
import { CATALOG, DIVISION_TEAMS } from './data'
import { useIsAdmin } from './admin'

// ─── visual (mesma linguagem do jogo) ────────────────────────────────
const INK = '#0C0C0C'
const GOLD = '#F5B301'
const GREEN = '#1B7A3D'
const PURPLE = '#5B2A86'
const RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

type Division = 'A' | 'B' | 'C' | 'D'
const DIVS: Division[] = ['D', 'C', 'B', 'A'] // de baixo pra cima
const DIV_LABEL: Record<Division, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
const SECTORS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const SECTOR_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meio-campo', ATA: 'Ataque' }
const START_COINS = 50

// ─── RNG determinístico ──────────────────────────────────────────────
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

// ─── pool: catálogo achatado em cartas com id + pos ──────────────────
type PoolCard = Card
function buildPool(): PoolCard[] {
  const out: PoolCard[] = []
  ;(Object.keys(CATALOG) as Sector[]).forEach(pos => {
    CATALOG[pos].forEach((c, i) => out.push({ ...c, pos, id: `${pos}-${i}` }))
  })
  return out
}
const POOL = buildPool()
const mid = (c: PoolCard) => (c.lo + c.hi) / 2

// filler fraco (perna-de-pau) quando falta gente pra fechar os 11
let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Café com Leite']
function filler(pos: Sector, rng: () => number): PoolCard {
  const lo = 44 + Math.floor(rng() * 8)
  return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 12 + Math.floor(rng() * 6) }
}

// ─── valor de mercado (base + desempenho) ────────────────────────────
function baseValue(c: PoolCard): number {
  return Math.max(1, Math.round(Math.pow(Math.max(0, mid(c) - 44) / 8, 1.8)))
}
function dynValue(c: PoolCard, goals: number, wonTitle: boolean): number {
  const gw = c.pos === 'ATA' ? 0.8 : c.pos === 'MEI' ? 0.6 : c.pos === 'LAT' ? 0.35 : 0.25
  return Math.max(1, Math.round(baseValue(c) + goals * gw + (wonTitle ? 4 : 0)))
}

// ─── simulação (mesma matemática do jogo: setor→força→poisson) ───────
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

interface SimTeam { id: number; name: string; you: boolean; squad: PoolCard[]; pts: number; w: number; d: number; l: number; gf: number; ga: number }
interface Scorer { id: string; name: string; club: string; teamName: string; div: Division; goals: number }

function buildFixtures(ids: number[]): [number, number][][] {
  const n = ids.length, rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)]
    const right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}

// simula uma divisão inteira (38 rodadas) e credita artilharia
function simDivision(teams: SimTeam[], div: Division, rng: () => number, scorers: Map<string, Scorer>): void {
  const byId = new Map(teams.map(t => [t.id, t]))
  const fixtures = buildFixtures(teams.map(t => t.id))
  const credit = (t: SimTeam, goals: number) => {
    for (let g = 0; g < goals; g++) {
      const pool: { c: PoolCard; w: number }[] = t.squad.map(c => ({ c, w: c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05 }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.id}:${pick.id}`
      const row = scorers.get(key)
      if (row) row.goals++
      else scorers.set(key, { id: pick.id, name: pick.name, club: pick.club, teamName: t.name, div, goals: 1 })
    }
  }
  for (const round of fixtures) for (const [hId, aId] of round) {
    const H = byId.get(hId)!, A = byId.get(aId)!
    const th = H.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const ta = A.you ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.squad, th, ta, rng), fa = rollForm(A.squad, ta, th, rng)
    const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25), la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg; credit(H, hg); credit(A, ag)
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
  }
}
function sortTable(teams: SimTeam[], rng: () => number): SimTeam[] {
  return teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || rng() - 0.5)
}

// distribui cartas reais + fillers em 20 times respeitando a formação
function dealDivision(real: PoolCard[], names: { name: string; team: string }[], rng: () => number, youTeam: { name: string; squad: PoolCard[] } | null): SimTeam[] {
  const squads: PoolCard[][] = names.map(() => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of real) byPos[c.pos].push(c)
  for (const p of SECTORS) {
    const list = shuffle(byPos[p], rng)
    for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < names.length; t++) squads[t].push(list.shift() ?? filler(p, rng))
  }
  const teams: SimTeam[] = names.map((nm, i) => ({ id: i, name: nm.team, you: false, squad: squads[i], pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }))
  if (youTeam) { teams[0] = { id: 0, name: youTeam.name, you: true, squad: youTeam.squad, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 } }
  return teams
}

// mundo: distribui TODO o catálogo (menos seu elenco) nas 4 divisões, mais
// forte pra cima. Roda todas as divisões e devolve tabela da sua + artilharia
// geral e da sua divisão.
interface SeasonResult {
  yourTable: SimTeam[]; yourPos: number; youChampion: boolean
  divScorers: Scorer[]; globalScorers: Scorer[]
  prize: number; fortuneBonus: number
}
function playSeason(seed: number, seasonNo: number, division: Division, clubName: string, squad: PoolCard[]): SeasonResult {
  const rng = mulberry((seed ^ (seasonNo * 0x9e3779b1)) >>> 0)
  const yourIds = new Set(squad.map(c => c.id))
  const rest = shuffle(POOL.filter(c => !yourIds.has(c.id)), rng).sort((a, b) => mid(b) - mid(a))
  // reparte por força: A (top) → D (base). Sprinkle: 15% de aleatório pra dar zebra.
  const quart = Math.ceil(rest.length / 4)
  const buckets: Record<Division, PoolCard[]> = { A: rest.slice(0, quart), B: rest.slice(quart, quart * 2), C: rest.slice(quart * 2, quart * 3), D: rest.slice(quart * 3) }
  const scorers = new Map<string, Scorer>()
  let yourTeams: SimTeam[] = []
  for (const div of DIVS) {
    const names = DIVISION_TEAMS[div]
    const youHere = div === division
    const teams = dealDivision(buckets[div], names, rng, youHere ? { name: clubName, squad } : null)
    simDivision(teams, div, rng, scorers)
    if (youHere) yourTeams = teams
  }
  const table = sortTable(yourTeams, rng)
  const yourPos = table.findIndex(t => t.you) + 1
  const youChampion = table[0]?.you ?? false
  const allScorers = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  const divScorers = allScorers.filter(s => s.div === division).slice(0, 12)
  const globalScorers = allScorers.slice(0, 20)
  // premiação (Caixa) por posição, escalada pela divisão
  const base: Record<Division, number> = { D: 20, C: 35, B: 60, A: 110 }
  const posF = yourPos === 1 ? 1 : yourPos <= 4 ? 0.7 : yourPos <= 12 ? 0.4 : 0.2
  const prize = Math.round(base[division] * posF)
  const fortuneBonus = Math.round(base[division] * 0.12) + (youChampion ? Math.round(base[division] * 0.3) : 0)
  return { yourTable: table, yourPos, youChampion, divScorers, globalScorers, prize, fortuneBonus }
}

function nextDivision(div: Division, pos: number): { div: Division; move: 'up' | 'down' | 'stay' } {
  const i = DIVS.indexOf(div)
  if (pos <= 4 && i < 3) return { div: DIVS[i + 1], move: 'up' }
  if (pos >= 17 && i > 0) return { div: DIVS[i - 1], move: 'down' }
  return { div, move: 'stay' }
}

// ─── ostentação ──────────────────────────────────────────────────────
interface Lux { id: string; emoji: string; name: string; cost: number }
const LUXURY: Lux[] = [
  { id: 'rolex', emoji: '⌚', name: 'Relógio Rolex', cost: 12 },
  { id: 'corrente', emoji: '📿', name: 'Corrente de ouro', cost: 20 },
  { id: 'carro', emoji: '🏎️', name: 'Ferrari', cost: 45 },
  { id: 'lancha', emoji: '🛥️', name: 'Lancha', cost: 80 },
  { id: 'mansao', emoji: '🏰', name: 'Mansão', cost: 140 },
  { id: 'jatinho', emoji: '🛩️', name: 'Jatinho particular', cost: 300 },
  { id: 'ilha', emoji: '🏝️', name: 'Ilha particular', cost: 650 },
]

// ─── estado persistido ───────────────────────────────────────────────
const SAVE_KEY = 'esc_dinastia_v1'
interface Save {
  seed: number; clubName: string; division: Division; seasonNo: number
  coins: number; fortune: number; luxury: string[]
  squad: WonCard[]; titles: number
  goalsLast: Record<string, number> // id -> gols temporada passada (pra valor dinâmico)
  championLast: boolean
  lastResult?: { pos: number; move: 'up' | 'down' | 'stay'; prevDiv: Division; champion: boolean }
}
function loadSave(): Save | null { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function writeSave(s: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* cheio */ } }

// valor atual de uma carta do seu elenco (usa gols da última temporada)
function myValue(save: Save, c: WonCard): number { return dynValue(c, save.goalsLast[c.id] ?? 0, save.championLast) }

// ─── UI helpers ──────────────────────────────────────────────────────
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
function Btn({ children, onClick, bg = GOLD, color = INK, disabled }: { children: React.ReactNode; onClick?: () => void; bg?: string; color?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: '100%', boxSizing: 'border-box', background: disabled ? '#bbb' : bg, color, border: `3px solid ${INK}`, borderRadius: 12, padding: '12px 14px', fontWeight: 900, fontSize: 16, cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : `3px 3px 0 0 ${INK}`, ...OSWALD }}>{children}</button>
}
const Pos = ({ p }: { p: Sector }) => <span style={{ fontSize: 10, fontWeight: 900, background: INK, color: '#fff', borderRadius: 5, padding: '1px 5px' }}>{p}</span>

// ─── componente raiz (overlay) ───────────────────────────────────────
export function DinastiaGame() {
  const isAdmin = useIsAdmin()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#dinastia')
  useEffect(() => {
    const f = () => setOpen(window.location.hash === '#dinastia')
    window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f)
  }, [])
  if (!open) return null
  if (!isAdmin) return (
    <Overlay><div style={{ ...box(), padding: 24, textAlign: 'center' }}>
      <p style={{ fontWeight: 900, ...OSWALD, fontSize: 18 }}>🔒 Modo em teste</p>
      <p style={{ marginTop: 8, color: '#555', fontWeight: 700 }}>Disponível só pro criador por enquanto.</p>
      <div style={{ marginTop: 16 }}><Btn onClick={() => { window.location.hash = '' }} bg="#fff">Voltar</Btn></div>
    </div></Overlay>
  )
  return <Overlay><Dinastia /></Overlay>
}

// botão de entrada (só criador) — usado na home
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
    <div style={{ position: 'fixed', inset: 0, background: '#F2ECDC', zIndex: 9000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 60px' }}>{children}</div>
    </div>
  )
}

type Phase = 'home' | 'draft' | 'result' | 'market' | 'sell' | 'store' | 'squad' | 'scorers'

function Dinastia() {
  const [save, setSave] = useState<Save | null>(() => loadSave())
  const [phase, setPhase] = useState<Phase>('home')
  const persist = (s: Save) => { writeSave(s); setSave(s) }
  const close = () => { window.location.hash = '' }

  if (!save) return <Intro onStart={s => { persist(s); setPhase('draft') }} onClose={close} />

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <button onClick={close} style={{ background: 'transparent', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', ...OSWALD }}>← sair</button>
      <span style={{ fontWeight: 900, ...OSWALD }}>🏰 DINASTIA</span>
      <button onClick={() => { if (confirm('Recomeçar a Dinastia do zero? Perde tudo.')) { localStorage.removeItem(SAVE_KEY); setSave(null) } }} style={{ background: 'transparent', border: 'none', fontWeight: 700, fontSize: 12, color: RED, cursor: 'pointer', ...OSWALD }}>reset</button>
    </div>
  )

  return (
    <div>
      {header}
      {phase === 'draft' && <Draft save={save} onDone={sq => { persist({ ...save, squad: sq }); setPhase('home') }} />}
      {phase === 'home' && <Home save={save} go={setPhase} />}
      {phase === 'result' && <ResultScreen save={save} persist={persist} onHome={() => setPhase('home')} />}
      {phase === 'squad' && <SquadScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'scorers' && <ScorersScreen save={save} onBack={() => setPhase('home')} />}
      {phase === 'store' && <Store save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'market' && <Market save={save} persist={persist} onBack={() => setPhase('home')} />}
      {phase === 'sell' && <SellRoom save={save} persist={persist} onBack={() => setPhase('home')} />}
    </div>
  )
}

// ─── INTRO / novo jogo ───────────────────────────────────────────────
function Intro({ onStart, onClose }: { onStart: (s: Save) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const start = () => {
    const seed = (Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0
    onStart({ seed, clubName: (name.trim() || 'Meu Clube'), division: 'D', seasonNo: 1, coins: START_COINS, fortune: 0, luxury: [], squad: [], titles: 0, goalsLast: {}, championLast: false })
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose} style={{ background: 'transparent', border: 'none', fontWeight: 900, cursor: 'pointer', ...OSWALD }}>✕</button></div>
      <div style={{ textAlign: 'center', paddingTop: 10 }}>
        <span style={{ display: 'inline-block', background: PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 12px', fontWeight: 900, fontSize: 12, ...OSWALD }}>MODO TESTE</span>
        <h1 style={{ fontWeight: 900, fontSize: 40, marginTop: 12, ...OSWALD }}>DINASTIA</h1>
        <p style={{ color: '#555', fontWeight: 700, marginTop: 4 }}>Comece duro na Série D. Monte time, suba de divisão e fique <b>rico</b>.</p>
      </div>
      <div style={{ ...box(), padding: 18, margin: '16px 0', display: 'grid', gap: 10 }}>
        <p style={{ fontWeight: 700, fontSize: 14 }}>💰 <b>50 moedas</b> no bolso. Só isso. Vira o jogo.</p>
        <p style={{ fontWeight: 700, fontSize: 14 }}>🏦 <b>Duas carteiras:</b> Caixa do Clube (pra montar time) e Fortuna Pessoal (mansão, Rolex, Ferrari — pura ostentação).</p>
        <p style={{ fontWeight: 700, fontSize: 14 }}>🔨 <b>Compra</b> no mercado. <b>Vende em leilão com RISCO</b> — pode achar que vende por 10 e sair por 3.</p>
        <p style={{ fontWeight: 700, fontSize: 14 }}>🥇 <b>Artilharia geral</b> das 4 divisões: às vezes um Obina é goleador de tudo e vale mais que craque.</p>
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do seu clube" maxLength={22}
        style={{ width: '100%', boxSizing: 'border-box', border: `3px solid ${INK}`, borderRadius: 12, padding: 12, fontWeight: 800, fontSize: 16, marginBottom: 12, ...OSWALD }} />
      <Btn onClick={start} bg={GREEN} color="#fff">▶️ COMEÇAR A DINASTIA</Btn>
    </div>
  )
}

// ─── DRAFT inicial: gaste as 50 moedas montando os 11 ────────────────
function Draft({ save, onDone }: { save: Save; onDone: (sq: WonCard[]) => void }) {
  const rng = useMemo(() => mulberry((save.seed ^ 0xABCDEF) >>> 0), [save.seed])
  // mercado inicial: pra cada setor, cartas reais embaralhadas com preço à mostra
  const market = useMemo(() => {
    const m: Record<Sector, { c: PoolCard; price: number; taken?: boolean }[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
    for (const p of SECTORS) m[p] = shuffle(POOL.filter(c => c.pos === p), rng).slice(0, 14).map(c => ({ c, price: baseValue(c) }))
    return m
  }, [rng])
  const [coins, setCoins] = useState(save.coins)
  const [squad, setSquad] = useState<WonCard[]>([])
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [sec, setSec] = useState<Sector>('GOL')
  const countPos = (p: Sector) => squad.filter(c => c.pos === p).length
  const buy = (c: PoolCard, price: number) => {
    if (coins < price || countPos(c.pos) >= NEED[c.pos]) return
    setCoins(coins - price)
    setSquad([...squad, { ...c, paid: price, via: 'leilao' }])
    const nt = new Set(taken); nt.add(c.id)
    // rivais fisgam 1-2 cartas caras aleatórias do mesmo setor
    const others = market[c.pos].filter(x => !nt.has(x.c.id) && x.c.id !== c.id)
    shuffle(others, rng).slice(0, Math.random() < 0.6 ? 1 : 0).forEach(x => nt.add(x.c.id))
    setTaken(nt)
  }
  const totalNeed = 11, filled = squad.length
  const finish = () => {
    const full = [...squad]
    for (const p of SECTORS) { let have = countPos(p); while (have < NEED[p]) { full.push({ ...filler(p, rng), paid: 0, via: 'bot' }); have++ } }
    onDone(full)
  }
  return (
    <div>
      <div style={{ ...box(GOLD), padding: 12, marginBottom: 12, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 20, ...OSWALD }}>🔨 PREGÃO — monte seu time</p>
        <p style={{ fontWeight: 800, marginTop: 2 }}>💰 {coins} moedas · {filled}/{totalNeed} contratados</p>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {SECTORS.map(p => (
          <button key={p} onClick={() => setSec(p)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 900, fontSize: 11, background: sec === p ? INK : '#fff', color: sec === p ? '#fff' : INK, cursor: 'pointer', ...OSWALD }}>
            {p}<br />{countPos(p)}/{NEED[p]}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>💡 O nível é oculto — você lê pelo <b>preço</b> e pelo nome. Craque caro é aposta segura; barato é risco (e pode ser joia).</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {market[sec].map(({ c, price }) => {
          const bought = squad.some(s => s.id === c.id)
          const gone = taken.has(c.id) && !bought
          const full = countPos(c.pos) >= NEED[c.pos]
          return (
            <div key={c.id} style={{ ...box(bought ? '#DFF5E1' : gone ? '#eee' : '#fff'), padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: gone ? 0.5 : 1 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}><Pos p={c.pos} /> {c.name}</div>
                <div style={{ fontSize: 12, color: '#777', fontWeight: 700 }}>{c.club} · {c.year}</div>
              </div>
              {bought ? <span style={{ fontWeight: 900, color: GREEN }}>✓ seu</span>
                : gone ? <span style={{ fontWeight: 800, color: '#999', fontSize: 12 }}>rival levou</span>
                  : <button onClick={() => buy(c, price)} disabled={coins < price || full} style={{ background: coins < price || full ? '#ccc' : GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '8px 12px', fontWeight: 900, cursor: coins < price || full ? 'default' : 'pointer', ...OSWALD }}>💰 {price}</button>}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn onClick={finish} bg={GREEN} color="#fff">{filled >= totalNeed ? '✅ Time pronto — jogar temporada' : `Fechar time (${totalNeed - filled} vagas viram perna-de-pau)`}</Btn>
      </div>
    </div>
  )
}

// ─── HOME (hub) ──────────────────────────────────────────────────────
function Home({ save, go }: { save: Save; go: (p: Phase) => void }) {
  const luxOwned = LUXURY.filter(l => save.luxury.includes(l.id))
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(INK), padding: 16, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 900, fontSize: 22, ...OSWALD }}>{save.clubName}</span>
          <span style={{ fontWeight: 800, color: GOLD }}>{DIV_LABEL[save.division]}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 700, marginTop: 2 }}>Temporada {save.seasonNo} · {save.titles} 🏆 {luxOwned.map(l => l.emoji).join(' ')}</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ ...box('#fff'), flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>🏦 CAIXA DO CLUBE</div>
          <div style={{ fontSize: 24, fontWeight: 900, ...OSWALD }}>💰 {save.coins}</div>
        </div>
        <div style={{ ...box(GOLD), flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#7a5c00' }}>💎 FORTUNA PESSOAL</div>
          <div style={{ fontSize: 24, fontWeight: 900, ...OSWALD }}>💰 {save.fortune}</div>
        </div>
      </div>
      {save.squad.length > 0 && <Btn onClick={() => go('result')} bg={GREEN} color="#fff">▶️ JOGAR TEMPORADA {save.seasonNo}</Btn>}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('squad')} bg="#fff">👥 Elenco</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('scorers')} bg="#fff">🥇 Artilharia</Btn></div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={() => go('market')} bg="#fff">🛒 Comprar</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={() => go('sell')} bg="#fff">🔨 Vender</Btn></div>
      </div>
      <Btn onClick={() => go('store')} bg={PURPLE} color="#fff">🏰 Loja da Ostentação</Btn>
      {save.lastResult && (
        <div style={{ ...box('#fff'), padding: 12, fontSize: 13, fontWeight: 700 }}>
          Última: {save.lastResult.pos}º na {DIV_LABEL[save.lastResult.prevDiv]}{save.lastResult.champion ? ' 🏆 CAMPEÃO!' : ''} · {save.lastResult.move === 'up' ? '⬆️ subiu' : save.lastResult.move === 'down' ? '⬇️ caiu' : '➡️ ficou'}
        </div>
      )}
    </div>
  )
}

// ─── RESULTADO da temporada ──────────────────────────────────────────
function ResultScreen({ save, persist, onHome }: { save: Save; persist: (s: Save) => void; onHome: () => void }) {
  const res = useMemo(() => playSeason(save.seed, save.seasonNo, save.division, save.clubName, save.squad), [save])
  const [applied, setApplied] = useState(false)
  const [tab, setTab] = useState<'tabela' | 'artil' | 'geral'>('tabela')
  const nd = nextDivision(save.division, res.yourPos)
  const apply = () => {
    if (applied) return
    // grava gols da temporada nas suas cartas (valor dinâmico) e avança
    const mine = new Set(save.squad.map(c => c.id))
    const goalsLast: Record<string, number> = {}
    for (const s of res.globalScorers) if (mine.has(s.id)) goalsLast[s.id] = s.goals
    const next: Save = {
      ...save, division: nd.div, seasonNo: save.seasonNo + 1,
      coins: save.coins + res.prize, fortune: save.fortune + res.fortuneBonus,
      titles: save.titles + (res.youChampion ? 1 : 0), goalsLast, championLast: res.youChampion,
      lastResult: { pos: res.yourPos, move: nd.move, prevDiv: save.division, champion: res.youChampion },
    }
    persist(next); setApplied(true); onHome()
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...box(res.youChampion ? GOLD : '#fff'), padding: 16, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>{DIV_LABEL[save.division]} · Temporada {save.seasonNo}</p>
        <p style={{ fontWeight: 900, fontSize: 30, ...OSWALD, marginTop: 4 }}>{res.youChampion ? '🏆 CAMPEÃO!' : `${res.yourPos}º lugar`}</p>
        <p style={{ fontWeight: 800, marginTop: 6 }}>💰 +{res.prize} Caixa · 💎 +{res.fortuneBonus} Fortuna</p>
        <p style={{ fontWeight: 800, marginTop: 2, color: nd.move === 'up' ? GREEN : nd.move === 'down' ? RED : '#555' }}>
          {nd.move === 'up' ? `⬆️ SUBIU pra ${DIV_LABEL[nd.div]}!` : nd.move === 'down' ? `⬇️ Caiu pra ${DIV_LABEL[nd.div]}` : '➡️ Segue na divisão'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {([['tabela', '📊 Tabela'], ['artil', '🥇 Artilharia'], ['geral', '🌎 Geral 4 divisões']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 800, fontSize: 12, background: tab === k ? INK : '#fff', color: tab === k ? '#fff' : INK, cursor: 'pointer', ...OSWALD }}>{l}</button>
        ))}
      </div>
      {tab === 'tabela' && <TableView table={res.yourTable} />}
      {tab === 'artil' && <ScorerList rows={res.divScorers} showDiv={false} mine={new Set(save.squad.map(c => c.id))} />}
      {tab === 'geral' && <ScorerList rows={res.globalScorers} showDiv mine={new Set(save.squad.map(c => c.id))} />}
      <Btn onClick={apply} disabled={applied} bg={GREEN} color="#fff">{applied ? '✔️ Salvo!' : '➡️ Continuar (salvar e avançar)'}</Btn>
    </div>
  )
}
function TableView({ table }: { table: SimTeam[] }) {
  return (
    <div style={{ ...box('#fff'), padding: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...OSWALD }}>
        <thead><tr style={{ fontWeight: 900, textAlign: 'left', color: '#888' }}><th>#</th><th>Time</th><th>P</th><th>V</th><th>SG</th></tr></thead>
        <tbody>{table.map((t, i) => (
          <tr key={t.id} style={{ background: t.you ? GOLD : i < 4 ? '#DFF5E1' : i >= 16 ? '#FBE0DA' : 'transparent', fontWeight: t.you ? 900 : 700 }}>
            <td style={{ padding: '4px 6px' }}>{i + 1}</td><td>{t.name}{t.you ? ' 👑' : ''}</td><td>{t.pts}</td><td>{t.w}</td><td>{t.gf - t.ga}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
function ScorerList({ rows, showDiv, mine }: { rows: Scorer[]; showDiv: boolean; mine: Set<string> }) {
  return (
    <div style={{ ...box('#fff'), padding: 10, display: 'grid', gap: 4 }}>
      {rows.length === 0 && <p style={{ fontWeight: 700, color: '#888', textAlign: 'center', padding: 8 }}>Sem gols ainda.</p>}
      {rows.map((s, i) => (
        <div key={s.id + s.teamName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: mine.has(s.id) ? GOLD : 'transparent', fontWeight: mine.has(s.id) ? 900 : 700 }}>
          <span style={{ fontSize: 13 }}>{i + 1}. {s.name} <span style={{ color: '#999', fontSize: 11 }}>{s.teamName}{showDiv ? ` · ${DIV_LABEL[s.div]}` : ''}</span></span>
          <span style={{ fontWeight: 900, ...OSWALD }}>⚽ {s.goals}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ELENCO ──────────────────────────────────────────────────────────
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
                <div>
                  <div style={{ fontWeight: 900, ...OSWALD }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{c.club} · {c.year}{save.goalsLast[c.id] ? ` · ⚽ ${save.goalsLast[c.id]} na última` : ''}</div>
                </div>
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

// ─── ARTILHARIA (última temporada, se houver) ────────────────────────
function ScorersScreen({ save, onBack }: { save: Save; onBack: () => void }) {
  const res = useMemo(() => playSeason(save.seed, save.seasonNo - 1 || save.seasonNo, save.lastResult?.prevDiv ?? save.division, save.clubName, save.squad), [save])
  const [tab, setTab] = useState<'artil' | 'geral'>('geral')
  const mine = new Set(save.squad.map(c => c.id))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🥇 Artilharia</p>
      <p style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Prévia da temporada. Os seus jogadores aparecem destacados.</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {([['geral', '🌎 Geral (4 divisões)'], ['artil', `🥇 Sua divisão`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 800, fontSize: 12, background: tab === k ? INK : '#fff', color: tab === k ? '#fff' : INK, cursor: 'pointer', ...OSWALD }}>{l}</button>
        ))}
      </div>
      <ScorerList rows={tab === 'geral' ? res.globalScorers : res.divScorers} showDiv={tab === 'geral'} mine={mine} />
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── LOJA DA OSTENTAÇÃO ──────────────────────────────────────────────
function Store({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const buy = (l: Lux) => { if (save.fortune < l.cost || save.luxury.includes(l.id)) return; persist({ ...save, fortune: save.fortune - l.cost, luxury: [...save.luxury, l.id] }) }
  const withdraw = (amt: number) => { if (save.coins < amt) return; persist({ ...save, coins: save.coins - amt, fortune: save.fortune + amt }) }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🏰 Loja da Ostentação</p>
      <div style={{ ...box(GOLD), padding: 10, textAlign: 'center' }}><b style={{ ...OSWALD }}>💎 Fortuna Pessoal: {save.fortune}</b></div>
      <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Sacar do clube pro seu bolso (te deixa rico, mas enfraquece o Caixa):</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {[5, 10, 25].map(a => <div key={a} style={{ flex: 1 }}><Btn onClick={() => withdraw(a)} disabled={save.coins < a} bg="#fff">💸 Sacar {a}</Btn></div>)}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
        {LUXURY.map(l => {
          const owned = save.luxury.includes(l.id)
          return (
            <div key={l.id} style={{ ...box(owned ? '#DFF5E1' : '#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, ...OSWALD, fontSize: 15 }}>{l.emoji} {l.name}</span>
              {owned ? <span style={{ fontWeight: 900, color: GREEN }}>✓ seu</span>
                : <button onClick={() => buy(l)} disabled={save.fortune < l.cost} style={{ background: save.fortune < l.cost ? '#ccc' : PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '8px 12px', fontWeight: 900, cursor: save.fortune < l.cost ? 'default' : 'pointer', ...OSWALD }}>💎 {l.cost}</button>}
            </div>
          )
        })}
      </div>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── MERCADO: comprar reforços ───────────────────────────────────────
function Market({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const rng = useMemo(() => mulberry((save.seed ^ (save.seasonNo * 7919)) >>> 0), [save.seed, save.seasonNo])
  const [sec, setSec] = useState<Sector>('ATA')
  const owned = new Set(save.squad.map(c => c.id))
  const offers = useMemo(() => {
    const m: Record<Sector, { c: PoolCard; price: number }[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
    for (const p of SECTORS) m[p] = shuffle(POOL.filter(c => c.pos === p && !owned.has(c.id)), rng).slice(0, 10).map(c => ({ c, price: Math.round(baseValue(c) * 1.15) }))
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rng, save.squad.length])
  const buy = (c: PoolCard, price: number) => { if (save.coins < price) return; persist({ ...save, coins: save.coins - price, squad: [...save.squad, { ...c, paid: price, via: 'leilao' }] }) }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🛒 Mercado · 💰 {save.coins}</p>
      <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Reforce o elenco. Você pode ter mais de 11 (reservas viram estoque pra vender).</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {SECTORS.map(p => <button key={p} onClick={() => setSec(p)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `2px solid ${INK}`, fontWeight: 900, fontSize: 11, background: sec === p ? INK : '#fff', color: sec === p ? '#fff' : INK, cursor: 'pointer', ...OSWALD }}>{p}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {offers[sec].map(({ c, price }) => (
          <div key={c.id} style={{ ...box('#fff'), padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 900, ...OSWALD }}><Pos p={c.pos} /> {c.name}</div><div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{c.club} · {c.year}</div></div>
            <button onClick={() => buy(c, price)} disabled={save.coins < price} style={{ background: save.coins < price ? '#ccc' : GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '8px 12px', fontWeight: 900, cursor: save.coins < price ? 'default' : 'pointer', ...OSWALD }}>💰 {price}</button>
          </div>
        ))}
      </div>
      <Btn onClick={onBack} bg="#fff">← Voltar</Btn>
    </div>
  )
}

// ─── VENDA EM LEILÃO COM RISCO ───────────────────────────────────────
function SellRoom({ save, persist, onBack }: { save: Save; persist: (s: Save) => void; onBack: () => void }) {
  const [selId, setSelId] = useState<string | null>(null)
  const sel = save.squad.find(c => c.id === selId) ?? null
  if (!sel) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Vender jogador</p>
        <p style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>Leilão COM RISCO: você vê as ofertas chegarem. Pode dar bolada… ou vexame. Escolha quem colocar no mercado:</p>
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
  const rng = useMemo(() => mulberry((save.seed ^ card.id.length ^ Date.now()) >>> 0), []) // eslint-disable-line react-hooks/exhaustive-deps
  // sequência de ofertas (reveladas 1 a 1). Fatores com jackpot e vexame.
  const offers = useMemo(() => {
    const n = 4
    const arr: { by: string; amount: number }[] = []
    const buyers = shuffle(DIVISION_TEAMS[save.division].map(t => t.team), rng)
    for (let i = 0; i < n; i++) {
      const roll = rng()
      let f = 0.4 + rng() * 1.3 // 0.4..1.7 normal
      if (roll > 0.9) f = 1.9 + rng() * 1.1 // jackpot raro
      else if (roll < 0.18) f = 0.2 + rng() * 0.2 // vexame
      arr.push({ by: buyers[i % buyers.length], amount: Math.max(1, Math.round(value * f)) })
    }
    return arr
  }, [rng, value])
  const floor = Math.max(1, Math.round(value * 0.35)) // piso final se recusar tudo
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<{ amount: number; by: string } | null>(null)
  const cur = offers[idx]
  const accept = () => { finish(cur.amount, cur.by) }
  const reject = () => { if (idx < offers.length - 1) setIdx(idx + 1); else finish(floor, 'Comprador de piso') }
  const finish = (amount: number, by: string) => {
    setDone({ amount, by })
    persist({ ...save, coins: save.coins + amount, squad: save.squad.filter(c => c.id !== card.id) })
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
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>🔨 Leilão: {card.name}</p>
        <p style={{ fontWeight: 700, fontSize: 13, opacity: 0.8 }}>Você achava que valia ~{value} 💰</p>
      </div>
      <div style={{ ...box('#fff'), padding: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#888' }}>Oferta {idx + 1} de {offers.length} — {cur.by}</p>
        <p style={{ fontSize: 40, fontWeight: 900, ...OSWALD, margin: '6px 0' }}>💰 {cur.amount}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>{idx < offers.length - 1 ? 'Recusar = espera a próxima (pode ser melhor… ou pior).' : `Última oferta. Recusar = vende no piso (💰 ${floor}).`}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Btn onClick={accept} bg={GREEN} color="#fff">✅ Aceitar {cur.amount}</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={reject} bg={RED} color="#fff">🎲 Recusar</Btn></div>
      </div>
      <Btn onClick={onBack} bg="#fff">← Desistir da venda</Btn>
    </div>
  )
}
