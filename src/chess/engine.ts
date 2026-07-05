import { Chess, type Move, type PieceSymbol, type Color, type Square } from 'chess.js'
import type { MoveInput, EndInfo } from './types'

// ── Build a Chess instance from a list of moves ──────────────────────────
export function chessFromMoves(moves: MoveInput[]): Chess {
  const chess = new Chess()
  for (const m of moves) {
    try {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion })
    } catch {
      break // ignore anything illegal (defensive: should never happen)
    }
  }
  return chess
}

// ── Try a move; returns the verbose Move or null if illegal ──────────────
export function tryMove(chess: Chess, input: MoveInput): Move | null {
  try {
    return chess.move({ from: input.from, to: input.to, promotion: input.promotion })
  } catch {
    return null
  }
}

// ── Legal destinations for a square ──────────────────────────────────────
export function legalTargets(chess: Chess, from: Square): Set<string> {
  const moves = chess.moves({ square: from, verbose: true })
  return new Set(moves.map(m => m.to))
}

// ── Does this move need promotion choice? ────────────────────────────────
export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  return chess
    .moves({ square: from, verbose: true })
    .some(m => m.to === to && m.promotion !== undefined)
}

// ── Game-over detection (board reasons only; clock/resign handled outside)
export function boardEnd(chess: Chess): EndInfo | null {
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === 'w' ? 'b' : 'w'
    return { result: winner === 'w' ? '1-0' : '0-1', reason: 'xeque-mate', winner }
  }
  if (chess.isStalemate())            return { result: '1/2-1/2', reason: 'afogamento', winner: null }
  if (chess.isInsufficientMaterial()) return { result: '1/2-1/2', reason: 'material insuficiente', winner: null }
  if (chess.isThreefoldRepetition())  return { result: '1/2-1/2', reason: 'repetição tripla', winner: null }
  if (chess.isDraw())                 return { result: '1/2-1/2', reason: 'regra dos 50 lances', winner: null }
  return null
}

// ── Square of the king currently in check (for highlight) ────────────────
export function checkedKingSquare(chess: Chess): string | null {
  if (!chess.inCheck()) return null
  const color = chess.turn()
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.type === 'k' && sq.color === color) return sq.square
    }
  }
  return null
}

// ── Piece instances with stable ids (for smooth animations) ──────────────
export interface PieceInst {
  id: string
  type: PieceSymbol
  color: Color
  square: string | null   // null = captured
}

const FILES = 'abcdefgh'

export function piecesFromHistory(verbose: Move[]): PieceInst[] {
  const pieces: PieceInst[] = []
  const back: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  back.forEach((t, i) => {
    pieces.push({ id: `w-${t}-${i}`, type: t, color: 'w', square: FILES[i] + '1' })
    pieces.push({ id: `b-${t}-${i}`, type: t, color: 'b', square: FILES[i] + '8' })
  })
  for (let i = 0; i < 8; i++) {
    pieces.push({ id: `w-p-${i}`, type: 'p', color: 'w', square: FILES[i] + '2' })
    pieces.push({ id: `b-p-${i}`, type: 'p', color: 'b', square: FILES[i] + '7' })
  }

  const at = (sq: string) => pieces.find(p => p.square === sq)

  for (const m of verbose) {
    // capture (en passant removes a pawn NOT on the target square)
    if (m.flags.includes('e')) {
      const capRank = m.color === 'w' ? Number(m.to[1]) - 1 : Number(m.to[1]) + 1
      const victim = at(m.to[0] + capRank)
      if (victim) victim.square = null
    } else if (m.captured) {
      const victim = at(m.to)
      if (victim) victim.square = null
    }
    // mover
    const mover = at(m.from)
    if (mover) {
      mover.square = m.to
      if (m.promotion) mover.type = m.promotion
    }
    // castling rook
    if (m.flags.includes('k')) {
      const rook = at('h' + m.from[1])
      if (rook) rook.square = 'f' + m.from[1]
    }
    if (m.flags.includes('q')) {
      const rook = at('a' + m.from[1])
      if (rook) rook.square = 'd' + m.from[1]
    }
  }
  return pieces
}

// ── Captured pieces grouped by capturing side ────────────────────────────
export const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export function capturedByColor(pieces: PieceInst[]): { byWhite: PieceInst[]; byBlack: PieceInst[] } {
  const dead = pieces.filter(p => p.square === null)
  const sorter = (a: PieceInst, b: PieceInst) => PIECE_VALUE[a.type] - PIECE_VALUE[b.type]
  return {
    byWhite: dead.filter(p => p.color === 'b').sort(sorter),  // white captured black pieces
    byBlack: dead.filter(p => p.color === 'w').sort(sorter),
  }
}

// ── Material advantage in pawns (positive = white ahead) ─────────────────
export function materialDiff(pieces: PieceInst[]): number {
  let diff = 0
  for (const p of pieces) {
    if (p.square === null) continue
    diff += (p.color === 'w' ? 1 : -1) * PIECE_VALUE[p.type]
  }
  return diff
}

// ── Only a bare king left? (for fair timeout adjudication) ───────────────
export function hasOnlyKing(chess: Chess, color: Color): boolean {
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.color === color && sq.type !== 'k') return false
    }
  }
  return true
}

// ── Opening identification (small ECO-inspired table) ────────────────────
const OPENINGS: Array<[string, string]> = [
  ['e4 e5 Nf3 Nc6 Bb5',        'Ruy López (Abertura Espanhola)'],
  ['e4 e5 Nf3 Nc6 Bc4',        'Abertura Italiana'],
  ['e4 e5 Nf3 Nc6 d4',         'Abertura Escocesa'],
  ['e4 e5 Nf3 Nf6',            'Defesa Petrov'],
  ['e4 e5 f4',                 'Gambito do Rei'],
  ['e4 c5 Nf3 d6',             'Siciliana Najdorf (linha aberta)'],
  ['e4 c5',                    'Defesa Siciliana'],
  ['e4 e6',                    'Defesa Francesa'],
  ['e4 c6',                    'Defesa Caro-Kann'],
  ['e4 d5',                    'Defesa Escandinava'],
  ['e4 d6 d4 Nf6',             'Defesa Pirc'],
  ['e4 Nf6',                   'Defesa Alekhine'],
  ['e4 g6',                    'Defesa Moderna'],
  ['d4 d5 c4 e6',              'Gambito da Dama Recusado'],
  ['d4 d5 c4 c6',              'Defesa Eslava'],
  ['d4 d5 c4 dxc4',            'Gambito da Dama Aceito'],
  ['d4 d5 c4',                 'Gambito da Dama'],
  ['d4 Nf6 c4 e6 Nc3 Bb4',     'Defesa Nimzo-Índia'],
  ['d4 Nf6 c4 g6 Nc3 d5',      'Defesa Grünfeld'],
  ['d4 Nf6 c4 g6',             'Defesa Índia do Rei'],
  ['d4 Nf6 c4 e6 Nf3 b6',      'Defesa Índia da Dama'],
  ['d4 f5',                    'Defesa Holandesa'],
  ['d4 Nf6 Bg5',               'Ataque Trompowsky'],
  ['d4 d5 Bf4',                'Sistema Londres'],
  ['d4 d5',                    'Peão da Dama'],
  ['c4',                       'Abertura Inglesa'],
  ['Nf3 d5 g3',                'Abertura Catalã (via Réti)'],
  ['Nf3',                      'Abertura Réti'],
  ['f4',                       'Abertura Bird'],
  ['b3',                       'Abertura Larsen'],
  ['g3',                       'Abertura Benko'],
  ['e4 e5',                    'Jogo Aberto'],
  ['e4',                       'Peão do Rei'],
  ['d4',                       'Peão da Dama'],
]

export function identifyOpening(sans: string[]): string | null {
  if (sans.length === 0) return null
  const line = sans.slice(0, 10).join(' ')
  for (const [prefix, name] of OPENINGS) {
    if (line.startsWith(prefix)) return name
  }
  return null
}

// ── Format ms as clock text ──────────────────────────────────────────────
export function fmtClock(ms: number | null): string {
  if (ms === null) return '∞'
  const clamped = Math.max(0, ms)
  const totalSec = Math.floor(clamped / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (clamped < 20_000) {
    const tenth = Math.floor((clamped % 1000) / 100)
    return `${min}:${String(sec).padStart(2, '0')}.${tenth}`
  }
  return `${min}:${String(sec).padStart(2, '0')}`
}

// ── Room code (unambiguous chars, e.g. "A7K9") ───────────────────────────
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function genRoomCode(): string {
  return Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
}
