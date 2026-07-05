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

export function cpuBestMove(history: MoveInput[], difficulty: Difficulty): MoveInput | null {
  const chess = chessFromMoves(history)
  const legal = chess.moves({ verbose: true })
  if (legal.length === 0) return null

  const { depth, noise } = DIFFICULTY_META[difficulty]
  const sign: 1 | -1 = chess.turn() === 'w' ? 1 : -1

  legal.sort((a, b) => moveOrder(b) - moveOrder(a))
  let best: Move | null = null
  let bestV = -Infinity
  for (const m of legal) {
    chess.move(m)
    let v = -negamax(chess, depth - 1, -Infinity, Infinity, sign === 1 ? -1 : 1, 1)
    chess.undo()
    if (noise > 0) v += (Math.random() - 0.5) * noise
    if (v > bestV) {
      bestV = v
      best = m
    }
  }
  if (!best) return null
  return { from: best.from, to: best.to, promotion: best.promotion }
}

// CPU draw-offer policy: accepts only if clearly losing
export function cpuAcceptsDraw(history: MoveInput[], cpuColor: 'w' | 'b'): boolean {
  const chess = chessFromMoves(history)
  const ev = evaluate(chess)                       // + = white better
  const cpuEval = cpuColor === 'w' ? ev : -ev
  return cpuEval <= -300
}
