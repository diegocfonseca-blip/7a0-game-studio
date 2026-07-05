import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Color } from 'chess.js'
import { chessFromMoves, tryMove, boardEnd, hasOnlyKing } from './engine'
import { resolveTime, timeLabel, type GameConfig, type MoveInput, type EndInfo } from './types'
import { useClockPair } from './clock'
import { cpuBestMove, cpuAcceptsDraw, DIFFICULTY_META, type Difficulty } from './cpu'
import type { MatchController } from './GameView'

// ── Match against the computer ───────────────────────────────────────────
export function useCpuMatch(
  config: GameConfig,
  difficulty: Difficulty,
  playerName: string,
  onExit: () => void,
): MatchController {
  const { initialMs, incrementMs } = useMemo(() => resolveTime(config), [config])

  // resolve player color once per mount (random stays stable)
  const [playerColor, setPlayerColor] = useState<Color>(() =>
    config.colorPref === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : config.colorPref,
  )
  const cpuColor: Color = playerColor === 'w' ? 'b' : 'w'

  const [moves, setMoves] = useState<MoveInput[]>([])
  const [end, setEnd] = useState<EndInfo | null>(null)
  const [drawOffer, setDrawOffer] = useState<'incoming' | 'outgoing' | null>(null)
  const movesRef = useRef(moves)
  movesRef.current = moves
  const endRef = useRef(end)
  endRef.current = end

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

  const applyMove = useCallback((input: MoveInput): boolean => {
    if (endRef.current) return false
    const cur = chessFromMoves(movesRef.current)
    const mover = cur.turn()
    const mv = tryMove(cur, input)
    if (!mv) return false
    setMoves(prev => [...prev, input])
    applyIncrement(mover)
    const be = boardEnd(cur)
    if (be) setEnd(be)
    return true
  }, [applyIncrement])

  // ── CPU turn: think briefly, then play ─────────────────────────────────
  useEffect(() => {
    if (end || turn !== cpuColor) return
    // white CPU opens without waiting for the player
    const thinkMs = 500 + Math.random() * 900
    const t = setTimeout(() => {
      const mv = cpuBestMove(movesRef.current, difficulty)
      if (mv) applyMove(mv)
    }, thinkMs)
    return () => clearTimeout(t)
  }, [turn, end, cpuColor, difficulty, applyMove, moves.length])

  const makeMove = useCallback((input: MoveInput) => {
    if (turn !== playerColor) return
    void applyMove(input)
  }, [turn, playerColor, applyMove])

  const resign = useCallback(() => {
    if (endRef.current) return
    setEnd({ result: cpuColor === 'w' ? '1-0' : '0-1', reason: 'desistência', winner: cpuColor })
  }, [cpuColor])

  const offerDraw = useCallback(() => {
    if (endRef.current || drawOffer) return
    setDrawOffer('outgoing')
    setTimeout(() => {
      if (endRef.current) return
      if (cpuAcceptsDraw(movesRef.current, cpuColor)) {
        setEnd({ result: '1/2-1/2', reason: 'empate acordado', winner: null })
      }
      setDrawOffer(null)  // declined silently (button re-enables)
    }, 900)
  }, [drawOffer, cpuColor])

  const offerRematch = useCallback((swap: boolean) => {
    if (swap) setPlayerColor(prev => prev === 'w' ? 'b' : 'w')
    setMoves([])
    setEnd(null)
    setDrawOffer(null)
    reset(initialMs)
  }, [reset, initialMs])

  const meta = DIFFICULTY_META[difficulty]
  const cpuPlayer = { id: 'cpu', name: `Computador ${meta.emoji} ${meta.label}`, online: true }
  const humanPlayer = { id: 'you', name: playerName || 'Você', online: true }

  return {
    moves,
    end,
    clocks,
    players: {
      w: playerColor === 'w' ? humanPlayer : cpuPlayer,
      b: playerColor === 'b' ? humanPlayer : cpuPlayer,
    },
    myColor: playerColor,
    incrementLabel: timeLabel(config),
    makeMove,
    resign,
    drawOffer,
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
