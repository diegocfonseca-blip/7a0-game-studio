import { Chess, type Move, type PieceSymbol } from 'chess.js'
import { chessFromMoves } from './engine'
import type { MoveInput } from './types'

// ── CPU opponent: negamax + alpha-beta over chess.js ─────────────────────
export type Difficulty = 'facil' | 'medio' | 'dificil'

export const DIFFICULTY_META: Record<Difficulty, { label: string; emoji: string; depth: number; noise: number }> = {
  facil:   { label: 'Fácil',   emoji: '😌', depth: 1, noise: 140 },
  medio:   { label: 'Médio',   emoji: '😐', depth: 2, noise: 35 },
  dificil: { label: 'Difícil', emoji: '😈', depth: 3, noise: 0 },
}

const VAL: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

// Piece-square tables (white perspective, index = rank*8+file, rank 0 = rank 1)
const PST: Record<PieceSymbol, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10,-20,-20, 10, 10,  5,
     5, -5,-10,  0,  0,-10, -5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  5,  5,  0,  0,  0,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     5, 10, 10, 10, 10, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -10,  5,  5,  5,  5,  5,  0,-10,
      0,  0,  5,  5,  5,  5,  0, -5,
     -5,  0,  5,  5,  5,  5,  0, -5,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
     20, 30, 10,  0,  0, 10, 30, 20,
     20, 20,  0,  0,  0,  0, 20, 20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
}

// centipawns, positive = white better
export function evaluate(chess: Chess): number {
  let score = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) {          // r=0 → rank 8
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f]
      if (!sq) continue
      if (sq.color === 'w') {
        score += VAL[sq.type] + PST[sq.type][(7 - r) * 8 + f]
      } else {
        score -= VAL[sq.type] + PST[sq.type][r * 8 + f]
      }
    }
  }
  return score
}

const MATE = 100_000

// order captures/promotions first for better alpha-beta cuts
function moveOrder(m: Move): number {
  let s = 0
  if (m.captured) s += 10 * VAL[m.captured] - VAL[m.piece]
  if (m.promotion) s += VAL[m.promotion]
  return s
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, sign: 1 | -1, ply: number): number {
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) {
    // mate (prefer faster) or stalemate
    return chess.inCheck() ? -(MATE - ply) : 0
  }
  if (depth === 0) return sign * evaluate(chess)

  moves.sort((a, b) => moveOrder(b) - moveOrder(a))
  let best = -Infinity
  for (const m of moves) {
    chess.move(m)
    const v = -negamax(chess, depth - 1, -beta, -alpha, sign === 1 ? -1 : 1, ply + 1)
    chess.undo()
    if (v > best) best = v
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

// ── Master personalities: same rules, different souls ────────────────────
export type Persona = 'tal' | 'capablanca' | 'kasparov' | 'carlsen' | 'fischer'

export const PERSONA_META: Record<Persona, {
  nome: string; emoji: string; era: string; estilo: string; frase: string
  depth: number; noise: number
}> = {
  tal: {
    nome: 'Mikhail Tal', emoji: '🔥', era: '1936–1992',
    estilo: 'O Mago de Riga. Sacrifica peças por ataque — correto ou não, você que prove.',
    frase: '"Há sacrifícios corretos e os meus."',
    depth: 2, noise: 60,
  },
  capablanca: {
    nome: 'José Raúl Capablanca', emoji: '🎩', era: '1888–1942',
    estilo: 'A máquina de xadrez. Simplifica, troca peças e te esmaga no final limpo.',
    frase: '"Estude finais antes de tudo."',
    depth: 2, noise: 20,
  },
  kasparov: {
    nome: 'Garry Kasparov', emoji: '⚡', era: '1963–',
    estilo: 'O Ogro de Baku. Pressão dinâmica e ataque implacável ao seu rei.',
    frase: '"O xadrez é violência mental."',
    depth: 3, noise: 15,
  },
  carlsen: {
    nome: 'Magnus Carlsen', emoji: '🐍', era: '1990–',
    estilo: 'Aperta posições iguais por 60 lances até você errar. E você vai errar.',
    frase: '"Nem todo mundo aguenta sofrer."',
    depth: 3, noise: 8,
  },
  fischer: {
    nome: 'Bobby Fischer', emoji: '🎯', era: '1943–2008',
    estilo: 'Precisão absoluta. Não perdoa uma imprecisão sequer.',
    frase: '"Eu não acredito em psicologia. Acredito em bons lances."',
    depth: 3, noise: 0,
  },
}

// style bias added to root evaluation (centipawns) — this is where the
// personality lives: same search, different taste in moves
function personaBias(p: Persona, m: Move, chess: Chess): number {
  let b = 0
  const isCapture = !!m.captured || m.flags.includes('e')
  const givesCheck = m.san.includes('+') || m.san.includes('#')
  switch (p) {
    case 'tal':
      if (isCapture) b += 25
      if (givesCheck) b += 45
      // sacrifice appetite: capturing/attacking with the big pieces even when risky
      if (isCapture && m.captured && VAL[m.piece] > VAL[m.captured]) b += 35
      break
    case 'capablanca': {
      // loves clean trades when not worse
      const ev = evaluate(chess)
      const myEv = m.color === 'w' ? ev : -ev
      if (isCapture && m.captured && VAL[m.captured] >= VAL[m.piece] && myEv >= -30) b += 30
      if (givesCheck) b -= 10 // no cheap tricks
      break
    }
    case 'kasparov': {
      // hunt the enemy king's side of the board
      const enemyKingRank = m.color === 'w' ? '8' : '1'
      const toRank = m.to[1]
      const dist = Math.abs(Number(toRank) - Number(enemyKingRank))
      b += Math.max(0, 18 - dist * 4)
      if (givesCheck) b += 25
      if (m.piece === 'q' || m.piece === 'r') b += 8
      break
    }
    case 'carlsen':
      // quiet improving moves; avoids premature captures
      if (!isCapture && !givesCheck) b += 10
      if (m.piece === 'p') b += 6      // slow squeeze
      if (m.piece === 'k') b += 4      // king activity
      break
    case 'fischer':
      break // pure precision — no bias
  }
  return b
}

export function cpuBestMove(history: MoveInput[], difficulty: Difficulty, persona?: Persona): MoveInput | null {
  const chess = chessFromMoves(history)
  const legal = chess.moves({ verbose: true })
  if (legal.length === 0) return null

  const meta = persona ? PERSONA_META[persona] : DIFFICULTY_META[difficulty]
  const { depth, noise } = meta
  const sign: 1 | -1 = chess.turn() === 'w' ? 1 : -1

  legal.sort((a, b) => moveOrder(b) - moveOrder(a))
  let best: Move | null = null
  let bestV = -Infinity
  for (const m of legal) {
    chess.move(m)
    let v = -negamax(chess, depth - 1, -Infinity, Infinity, sign === 1 ? -1 : 1, 1)
    chess.undo()
    if (persona) v += personaBias(persona, m, chess)
    if (noise > 0) v += (Math.random() - 0.5) * noise
    if (v > bestV) {
      bestV = v
      best = m
    }
  }
  if (!best) return null
  return { from: best.from, to: best.to, promotion: best.promotion }
}

// ── Ranked top moves for analysis (returns SAN + eval after move) ────────
export function topMoves(history: MoveInput[], n = 3, depth = 2): Array<{ san: string; move: MoveInput; cp: number }> {
  const chess = chessFromMoves(history)
  const legal = chess.moves({ verbose: true })
  const sign: 1 | -1 = chess.turn() === 'w' ? 1 : -1
  const out: Array<{ san: string; move: MoveInput; cp: number }> = []
  legal.sort((a, b) => moveOrder(b) - moveOrder(a))
  for (const m of legal) {
    chess.move(m)
    const v = -negamax(chess, depth - 1, -Infinity, Infinity, sign === 1 ? -1 : 1, 1)
    chess.undo()
    out.push({ san: m.san, move: { from: m.from, to: m.to, promotion: m.promotion }, cp: v })
  }
  out.sort((a, b) => b.cp - a.cp)
  return out.slice(0, n)
}

// ── Quick eval of a position (white-positive centipawns) ─────────────────
export function quickEval(history: MoveInput[], depth = 2): number {
  const chess = chessFromMoves(history)
  const legal = chess.moves({ verbose: true })
  if (legal.length === 0) return chess.inCheck() ? (chess.turn() === 'w' ? -MATE : MATE) : 0
  const sign: 1 | -1 = chess.turn() === 'w' ? 1 : -1
  const v = negamax(chess, depth, -Infinity, Infinity, sign, 0)
  return sign === 1 ? v : -v
}

// CPU draw-offer policy: accepts only if clearly losing
export function cpuAcceptsDraw(history: MoveInput[], cpuColor: 'w' | 'b'): boolean {
  const chess = chessFromMoves(history)
  const ev = evaluate(chess)                       // + = white better
  const cpuEval = cpuColor === 'w' ? ev : -ev
  return cpuEval <= -300
}
