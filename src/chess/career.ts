import type { Color } from 'chess.js'
import type { Difficulty, Persona } from './cpu'

// ── Career mode: rating 800 → Grande Mestre, persisted locally ───────────
export interface CareerGameRec {
  ts: number
  oppName: string
  oppRating: number
  myColor: Color
  result: 'win' | 'draw' | 'loss'
  opening: string | null
  plies: number
  reason: string
  ratingAfter: number
}

export interface CareerProfile {
  name: string
  rating: number
  peak: number
  games: CareerGameRec[]
  createdAt: number
}

const KEY = 'chess-legends-career'

export const TITLES: Array<{ min: number; nome: string; emoji: string }> = [
  { min: 2500, nome: 'Grande Mestre', emoji: '👑' },
  { min: 2400, nome: 'Mestre Internacional', emoji: '🌍' },
  { min: 2200, nome: 'Mestre FIDE', emoji: '🏅' },
  { min: 2000, nome: 'Mestre Nacional', emoji: '🥇' },
  { min: 1600, nome: 'Jogador de Clube', emoji: '♟️' },
  { min: 1200, nome: 'Amador Forte', emoji: '📗' },
  { min: 0,    nome: 'Iniciante', emoji: '🐣' },
]

export function titleFor(rating: number) {
  return TITLES.find(t => rating >= t.min) ?? TITLES[TITLES.length - 1]
}

export function nextTitle(rating: number) {
  return [...TITLES].reverse().find(t => t.min > rating) ?? null
}

export function loadCareer(): CareerProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as CareerProfile : null
  } catch { return null }
}

export function saveCareer(p: CareerProfile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* full/private */ }
}

export function createCareer(name: string): CareerProfile {
  const p: CareerProfile = { name: name || 'Jogador', rating: 800, peak: 800, games: [], createdAt: Date.now() }
  saveCareer(p)
  return p
}

export function resetCareer() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

// ── Elo ──────────────────────────────────────────────────────────────────
export function eloDelta(mine: number, opp: number, score: 0 | 0.5 | 1): number {
  const expected = 1 / (1 + Math.pow(10, (opp - mine) / 400))
  return Math.round(32 * (score - expected))
}

// ── Opponent generation ──────────────────────────────────────────────────
const BOT_NAMES = [
  'Mestre Oliveira', 'Julinho das Pretas', 'Dona Zilda', 'Professor Amaral',
  'Cadu Relâmpago', 'Tia Marlene', 'Seu Waldemar', 'Biruta do Clube',
  'Rainha de Copas', 'Doutor Peão', 'Xeque Norris', 'Garry Kasparovsky',
  'Capivara Blanca', 'Magno Carvalho', 'Bobby Pescador', '미하일 Talzinho',
]

export interface CareerOpponent {
  name: string
  rating: number
  difficulty: Difficulty
  persona: Persona | null
}

export function genOpponent(myRating: number): CareerOpponent {
  const rating = Math.max(600, Math.round(myRating + (Math.random() * 260 - 110)))
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
  let difficulty: Difficulty = 'facil'
  let persona: Persona | null = null
  if (rating >= 2350)      persona = (['fischer', 'carlsen', 'kasparov'] as Persona[])[Math.floor(Math.random() * 3)]
  else if (rating >= 2100) persona = (['tal', 'capablanca', 'kasparov'] as Persona[])[Math.floor(Math.random() * 3)]
  else if (rating >= 1600) difficulty = 'dificil'
  else if (rating >= 1100) difficulty = 'medio'
  return { name, rating, difficulty, persona }
}

// ── Stats ────────────────────────────────────────────────────────────────
export interface CareerStats {
  total: number
  wins: number
  draws: number
  losses: number
  streak: number            // current, positive = winning streak
  bestOpening: { name: string; score: number; games: number } | null
  worstOpening: { name: string; score: number; games: number } | null
  favOpening: { name: string; games: number } | null
  avgPlies: number
}

export function careerStats(p: CareerProfile): CareerStats {
  const g = p.games
  const wins = g.filter(x => x.result === 'win').length
  const draws = g.filter(x => x.result === 'draw').length
  const losses = g.filter(x => x.result === 'loss').length

  let streak = 0
  for (let i = g.length - 1; i >= 0; i--) {
    if (g[i].result === 'win') { if (streak >= 0) streak++; else break }
    else if (g[i].result === 'loss') { if (streak <= 0) streak--; else break }
    else break
  }

  const byOpening = new Map<string, { pts: number; n: number }>()
  for (const rec of g) {
    if (!rec.opening) continue
    const cur = byOpening.get(rec.opening) ?? { pts: 0, n: 0 }
    cur.pts += rec.result === 'win' ? 1 : rec.result === 'draw' ? 0.5 : 0
    cur.n += 1
    byOpening.set(rec.opening, cur)
  }
  const scored = [...byOpening.entries()]
    .filter(([, v]) => v.n >= 2)
    .map(([name, v]) => ({ name, score: v.pts / v.n, games: v.n }))
  scored.sort((a, b) => b.score - a.score)

  const played = [...byOpening.entries()].map(([name, v]) => ({ name, games: v.n }))
  played.sort((a, b) => b.games - a.games)

  return {
    total: g.length, wins, draws, losses, streak,
    bestOpening: scored[0] ?? null,
    worstOpening: scored.length > 1 ? scored[scored.length - 1] : null,
    favOpening: played[0] ?? null,
    avgPlies: g.length ? Math.round(g.reduce((s, x) => s + x.plies, 0) / g.length) : 0,
  }
}
