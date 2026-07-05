import { useState, useMemo, useCallback, useRef } from 'react'
import type { Color } from 'chess.js'
import { chessFromMoves, tryMove, boardEnd, hasOnlyKing } from './engine'
import { resolveTime, timeLabel, type GameConfig, type MoveInput, type EndInfo } from './types'
import { useClockPair } from './clock'
import type { MatchController } from './GameView'

// ── Local match: two players on the same device ──────────────────────────
export function useLocalMatch(config: GameConfig, onExit: () => void): MatchController {
  const { initialMs, incrementMs } = useMemo(() => resolveTime(config), [config])
  const [moves, setMoves] = useState<MoveInput[]>([])
  const [end, setEnd] = useState<EndInfo | null>(null)
  const movesRef = useRef(moves)
  movesRef.current = moves

  const chess = useMemo(() => chessFromMoves(moves), [moves])
  const turn = chess.turn()

  const onFlag = useCallback((color: Color) => {
    setEnd(prev => {
      if (prev) return prev
      const opp: Color = color === 'w' ? 'b' : 'w'
      const cur = chessFromMoves(movesRef.current)
      if (hasOnlyKing(cur, opp)) return { result: '1/2-1/2', reason: 'tempo esgotado', winner: null }
      return { result: opp === 'w' ? '1-0' : '0-1', reason: 'tempo esgotado', winner: opp }
    })
  }, [])

  const { clocks, applyIncrement, reset } = useClockPair(
    initialMs, incrementMs, turn, moves.length > 0 && !end, onFlag,
  )

  const makeMove = useCallback((input: MoveInput) => {
    if (end) return
    const cur = chessFromMoves(movesRef.current)
    const mover = cur.turn()
    const mv = tryMove(cur, input)
    if (!mv) return
    setMoves(prev => [...prev, input])
    applyIncrement(mover)
    const be = boardEnd(cur)
    if (be) setEnd(be)
  }, [end, applyIncrement])

  const resign = useCallback(() => {
    if (end) return
    const winner: Color = turn === 'w' ? 'b' : 'w'
    setEnd({ result: winner === 'w' ? '1-0' : '0-1', reason: 'desistência', winner })
  }, [end, turn])

  // local: both players share the device — draw button = agreement
  const offerDraw = useCallback(() => {
    if (end) return
    setEnd({ result: '1/2-1/2', reason: 'empate acordado', winner: null })
  }, [end])

  const offerRematch = useCallback(() => {
    setMoves([])
    setEnd(null)
    reset(initialMs)
  }, [reset, initialMs])

  return {
    moves,
    end,
    clocks,
    players: {
      w: { id: 'w', name: 'Brancas', online: true },
      b: { id: 'b', name: 'Pretas', online: true },
    },
    myColor: 'both',
    incrementLabel: timeLabel(config),
    makeMove,
    resign,
    drawOffer: null,
    offerDraw,
    respondDraw: () => {},
    rematchOffer: null,
    offerRematch,
    acceptRematch: () => {},
    chat: null,
    sendChat: null,
    roomCode: null,
    leave: onExit,
  }
}
