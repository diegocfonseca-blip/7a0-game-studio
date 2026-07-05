import { motion, AnimatePresence } from 'framer-motion'
import type { Color, PieceSymbol, Square } from 'chess.js'
import type { BoardTheme } from './themes'
import type { ViewMode } from './types'
import type { PieceInst } from './engine'

// ── Piece glyphs: filled set for both colors, tinted via CSS ─────────────
const GLYPH: Record<PieceSymbol, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

const FILES = 'abcdefgh'

function squareToXY(square: string, orientation: Color): { x: number; y: number } {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  if (orientation === 'w') return { x: file, y: 7 - rank }
  return { x: 7 - file, y: rank }
}

export function PieceGlyph({ type, color, theme, sizePct = 78 }: {
  type: PieceSymbol
  color: Color
  theme: BoardTheme
  sizePct?: number
}) {
  const fill = color === 'w' ? theme.whitePiece : theme.blackPiece
  const stroke = color === 'w' ? theme.whitePieceStroke : theme.blackPieceStroke
  return (
    <span
      className="select-none leading-none"
      style={{
        fontSize: `${sizePct}%`,
        color: fill,
        textShadow: `0 1px 0 ${stroke}, 0 -1px 0 ${stroke}, 1px 0 0 ${stroke}, -1px 0 0 ${stroke}, 0 3px 5px rgba(0,0,0,0.45)`,
      }}
    >
      {GLYPH[type]}
    </span>
  )
}

export interface BoardProps {
  pieces: PieceInst[]
  orientation: Color
  theme: BoardTheme
  view: ViewMode
  animations: boolean
  showHints: boolean
  selected: Square | null
  legalTargets: Set<string>
  lastMove: { from: string; to: string } | null
  checkSquare: string | null
  occupied: Set<string>            // squares with any piece (for hint style)
  onSquareClick: (sq: Square) => void
  interactive: boolean
  promotion: { color: Color; onPick: (p: PieceSymbol) => void; onCancel: () => void } | null
}

export default function Board({
  pieces, orientation, theme, view, animations, showHints,
  selected, legalTargets, lastMove, checkSquare, occupied,
  onSquareClick, interactive, promotion,
}: BoardProps) {
  const is3D = view === '3d'

  const squares: Array<{ sq: string; light: boolean; x: number; y: number }> = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const fileIdx = orientation === 'w' ? x : 7 - x
      const rankIdx = orientation === 'w' ? 7 - y : y
      const sq = FILES[fileIdx] + (rankIdx + 1)
      squares.push({ sq, light: (fileIdx + rankIdx) % 2 === 1, x, y })
    }
  }

  const alive = pieces.filter(p => p.square !== null)

  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: 'min(92vw, 62vh, 560px)',
        perspective: is3D ? '900px' : undefined,
      }}
    >
      <div
        className="relative w-full rounded-lg overflow-visible"
        style={{
          aspectRatio: '1',
          transform: is3D ? 'rotateX(28deg) scale(0.96)' : undefined,
          transformStyle: is3D ? 'preserve-3d' : undefined,
          transition: 'transform 0.5s ease',
          border: `6px solid ${theme.boardBorder}`,
          borderRadius: 10,
          boxShadow: is3D
            ? `0 30px 50px -12px rgba(0,0,0,0.7), 0 4px 0 ${theme.boardBorder}`
            : '0 12px 32px -8px rgba(0,0,0,0.6)',
        }}
      >
        {/* Squares */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {squares.map(({ sq, light, x, y }) => {
            const isLast = lastMove !== null && (lastMove.from === sq || lastMove.to === sq)
            const isSel = selected === sq
            const isTarget = showHints && legalTargets.has(sq)
            const isCheck = checkSquare === sq
            const showFile = y === 7
            const showRank = x === 0
            return (
              <div
                key={sq}
                onClick={() => interactive && onSquareClick(sq as Square)}
                className="relative"
                style={{
                  backgroundColor: light ? theme.light : theme.dark,
                  cursor: interactive ? 'pointer' : 'default',
                }}
              >
                {isLast && <div className="absolute inset-0" style={{ backgroundColor: theme.lastMove }} />}
                {isSel && <div className="absolute inset-0" style={{ backgroundColor: theme.selected }} />}
                {isCheck && (
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(circle, ${theme.checkGlow} 0%, transparent 75%)` }}
                  />
                )}
                {isTarget && !occupied.has(sq) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full" style={{ width: '30%', height: '30%', backgroundColor: theme.moveDot }} />
                  </div>
                )}
                {isTarget && occupied.has(sq) && (
                  <div
                    className="absolute inset-0 rounded-sm"
                    style={{ boxShadow: `inset 0 0 0 4px ${theme.moveDot}` }}
                  />
                )}
                {showFile && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold pointer-events-none"
                        style={{ color: light ? theme.dark : theme.light, opacity: 0.9 }}>
                    {sq[0]}
                  </span>
                )}
                {showRank && (
                  <span className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold pointer-events-none"
                        style={{ color: light ? theme.dark : theme.light, opacity: 0.9 }}>
                    {sq[1]}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Pieces (absolute, animated via transform) */}
        <div className="absolute inset-0 pointer-events-none">
          {alive.map(p => {
            const { x, y } = squareToXY(p.square!, orientation)
            return (
              <motion.div
                key={p.id}
                className="absolute flex items-center justify-center"
                initial={false}
                animate={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }}
                transition={animations ? { type: 'spring', stiffness: 480, damping: 38 } : { duration: 0 }}
                style={{
                  width: '12.5%',
                  height: '12.5%',
                  fontSize: 'min(9vw, 6vh, 54px)',
                  transform: is3D ? 'rotateX(-24deg) translateY(-8%)' : undefined,
                  transformStyle: is3D ? 'preserve-3d' : undefined,
                }}
              >
                {is3D && (
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '58%', height: '18%', bottom: '4%',
                      background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
                      transform: 'rotateX(24deg)',
                    }}
                  />
                )}
                <PieceGlyph type={p.type} color={p.color} theme={theme} />
              </motion.div>
            )
          })}
        </div>

        {/* Promotion picker */}
        <AnimatePresence>
          {promotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', transform: is3D ? 'rotateX(-28deg)' : undefined }}
              onClick={promotion.onCancel}
            >
              <motion.div
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="flex gap-2 p-3 rounded-2xl"
                style={{ backgroundColor: theme.panel, border: `2px solid ${theme.gold}`, backdropFilter: 'blur(8px)' }}
                onClick={e => e.stopPropagation()}
              >
                {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(t => (
                  <button
                    key={t}
                    onClick={() => promotion.onPick(t)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-4xl sm:text-5xl transition-transform hover:scale-110"
                    style={{ backgroundColor: theme.light }}
                  >
                    <PieceGlyph type={t} color={promotion.color} theme={theme} sizePct={100} />
                  </button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
