import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Color } from 'chess.js'
import { supabase } from '../lib/supabase'
import { chessFromMoves, tryMove, boardEnd, hasOnlyKing, genRoomCode } from './engine'
import { resolveTime, timeLabel, type GameConfig, type MoveInput, type EndInfo, type ChatMsg, type ChessRoomEvent } from './types'
import { useClockPair } from './clock'
import type { MatchController } from './GameView'

type RoomChannel = ReturnType<typeof supabase.channel>

// Stable player id across refreshes (allows short reconnection window)
function getPlayerId(): string {
  try {
    let id = localStorage.getItem('chess-legends-pid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('chess-legends-pid', id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export type OnlineStage = 'idle' | 'connecting' | 'lobby' | 'playing' | 'error'

interface Seats {
  whiteId: string; whiteName: string
  blackId: string; blackName: string
}

export interface OnlineChess {
  stage: OnlineStage
  error: string | null
  roomCode: string
  amHost: boolean
  guestName: string | null      // lobby: who joined
  config: GameConfig | null
  ctl: MatchController | null   // available when playing
  createRoom: (config: GameConfig, myName: string) => void
  joinRoom: (code: string, myName: string) => void
  leave: () => void
}

export function useOnlineChess(onExit: () => void, onGameStart?: (config: GameConfig) => void): OnlineChess {
  const myId = useMemo(getPlayerId, [])
  const [stage, setStage] = useState<OnlineStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [amHost, setAmHost] = useState(false)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [seats, setSeats] = useState<Seats | null>(null)
  const [guestName, setGuestName] = useState<string | null>(null)
  const [oppOnline, setOppOnline] = useState(true)

  const [moves, setMoves] = useState<MoveInput[]>([])
  const [end, setEnd] = useState<EndInfo | null>(null)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [drawOffer, setDrawOffer] = useState<'incoming' | 'outgoing' | null>(null)
  const [rematchOffer, setRematchOffer] = useState<'incoming' | 'outgoing' | null>(null)
  // rivalry scoreboard (wins keyed by stable player id, + draws) across rematches in this room
  const [wins, setWins] = useState<Record<string, number>>({})
  const [draws, setDraws] = useState(0)
  const scoredRef = useRef(false)

  const channelRef = useRef<RoomChannel | null>(null)
  const myNameRef = useRef('Jogador')
  const configRef = useRef<GameConfig | null>(null)
  const seatsRef = useRef<Seats | null>(null)
  const movesRef = useRef<MoveInput[]>([])
  const endRef = useRef<EndInfo | null>(null)
  const clocksRef = useRef<{ w: number | null; b: number | null }>({ w: null, b: null })
  const pendingSwapRef = useRef(false)
  const onGameStartRef = useRef(onGameStart)
  onGameStartRef.current = onGameStart
  movesRef.current = moves
  endRef.current = end
  configRef.current = config
  seatsRef.current = seats

  const myColor: Color | null = seats
    ? (seats.whiteId === myId ? 'w' : seats.blackId === myId ? 'b' : null)
    : null

  const time = useMemo(() => config ? resolveTime(config) : { initialMs: null, incrementMs: 0 }, [config])

  const chess = useMemo(() => chessFromMoves(moves), [moves])
  const turn = chess.turn()

  const send = useCallback((event: ChessRoomEvent) => {
    void channelRef.current?.send({ type: 'broadcast', event: event.type, payload: event.payload })
  }, [])

  // ── clock ──────────────────────────────────────────────────────────────
  const onFlag = useCallback((color: Color) => {
    setEnd(prev => {
      if (prev) return prev
      const opp: Color = color === 'w' ? 'b' : 'w'
      const cur = chessFromMoves(movesRef.current)
      const info: EndInfo = hasOnlyKing(cur, opp)
        ? { result: '1/2-1/2', reason: 'tempo esgotado', winner: null }
        : { result: opp === 'w' ? '1-0' : '0-1', reason: 'tempo esgotado', winner: opp }
      return info
    })
    send({ type: 'flag', payload: { color } })
  }, [send])

  const { clocks, applyIncrement, setClock, reset: resetClocks } = useClockPair(
    time.initialMs, time.incrementMs, turn, stage === 'playing' && moves.length > 0 && !end, onFlag,
  )
  clocksRef.current = clocks

  // ── shared reset for rematch ───────────────────────────────────────────
  const startRematch = useCallback((swap: boolean) => {
    setSeats(prev => {
      if (!prev) return prev
      if (!swap) return prev
      return { whiteId: prev.blackId, whiteName: prev.blackName, blackId: prev.whiteId, blackName: prev.whiteName }
    })
    setMoves([])
    setEnd(null)
    setDrawOffer(null)
    setRematchOffer(null)
    const t = configRef.current ? resolveTime(configRef.current) : { initialMs: null }
    resetClocks(t.initialMs)
  }, [resetClocks])

  // ── channel wiring ─────────────────────────────────────────────────────
  const subscribe = useCallback((code: string, asHost: boolean, cfg: GameConfig | null) => {
    const channel = supabase.channel(`chess-${code}`, {
      config: { broadcast: { self: false }, presence: { key: myId } },
    })
    channelRef.current = channel

    channel.on('broadcast', { event: 'hello' }, ({ payload }) => {
      const p = payload as { id: string; name: string }
      const st = seatsRef.current
      if (st) {
        // reconnection of a known player, or intruder
        if (p.id === st.whiteId || p.id === st.blackId) {
          send({ type: 'start', payload: { ...st, config: configRef.current! } })
          // resync state for the reconnecting peer
          void channel.send({
            type: 'broadcast', event: 'sync',
            payload: {
              moves: movesRef.current, end: endRef.current,
              clockW: clocksRef.current.w, clockB: clocksRef.current.b,
            },
          })
        } else {
          send({ type: 'start', payload: { ...st, config: configRef.current! } }) // full room signal
        }
        return
      }
      // first guest: host assigns colors
      if (!asHost || !configRef.current) return
      setGuestName(p.name)
      const pref = configRef.current.colorPref
      const hostIsWhite = pref === 'w' ? true : pref === 'b' ? false : Math.random() < 0.5
      const newSeats: Seats = hostIsWhite
        ? { whiteId: myId, whiteName: myNameRef.current, blackId: p.id, blackName: p.name }
        : { whiteId: p.id, whiteName: p.name, blackId: myId, blackName: myNameRef.current }
      setSeats(newSeats)
      seatsRef.current = newSeats
      send({ type: 'start', payload: { ...newSeats, config: configRef.current } })
      setStage('playing')
      onGameStartRef.current?.(configRef.current)
    })

    channel.on('broadcast', { event: 'start' }, ({ payload }) => {
      const p = payload as Seats & { config: GameConfig }
      if (seatsRef.current) return // already seated
      if (p.whiteId !== myId && p.blackId !== myId) {
        setError('Essa sala já está cheia — a partida está em andamento.')
        setStage('error')
        return
      }
      setSeats({ whiteId: p.whiteId, whiteName: p.whiteName, blackId: p.blackId, blackName: p.blackName })
      setConfig(p.config)
      configRef.current = p.config
      const t = resolveTime(p.config)
      resetClocks(t.initialMs)
      setStage('playing')
      onGameStartRef.current?.(p.config)
    })

    channel.on('broadcast', { event: 'sync' }, ({ payload }) => {
      const p = payload as { moves: MoveInput[]; end: EndInfo | null; clockW: number | null; clockB: number | null }
      if (p.moves.length > movesRef.current.length) {
        setMoves(p.moves)
        setEnd(p.end)
        if (p.clockW !== null) setClock('w', p.clockW)
        if (p.clockB !== null) setClock('b', p.clockB)
      }
    })

    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      const p = payload as { id: string; moveIdx: number; move: MoveInput; clockMs: number | null }
      const st = seatsRef.current
      if (!st || endRef.current) return
      if (p.moveIdx !== movesRef.current.length) return          // out of order / duplicate
      const cur = chessFromMoves(movesRef.current)
      const moverColor = cur.turn()
      const expectedId = moverColor === 'w' ? st.whiteId : st.blackId
      if (p.id !== expectedId) return                            // not your turn / not your piece
      const mv = tryMove(cur, p.move)
      if (!mv) return                                            // illegal — reject
      setMoves(prev => [...prev, p.move])
      if (p.clockMs !== null) setClock(moverColor, p.clockMs)
      const be = boardEnd(cur)
      if (be) setEnd(be)
      setDrawOffer(null)
    })

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      const p = payload as ChatMsg & { id: string }
      setChat(prev => [...prev, { author: p.author, text: p.text, ts: p.ts }])
    })

    channel.on('broadcast', { event: 'resign' }, ({ payload }) => {
      const p = payload as { id: string }
      const st = seatsRef.current
      if (!st || endRef.current) return
      const resignerColor: Color = p.id === st.whiteId ? 'w' : 'b'
      const winner: Color = resignerColor === 'w' ? 'b' : 'w'
      setEnd({ result: winner === 'w' ? '1-0' : '0-1', reason: 'desistência', winner })
    })

    channel.on('broadcast', { event: 'flag' }, ({ payload }) => {
      const p = payload as { color: Color }
      if (endRef.current) return
      const opp: Color = p.color === 'w' ? 'b' : 'w'
      const cur = chessFromMoves(movesRef.current)
      setEnd(hasOnlyKing(cur, opp)
        ? { result: '1/2-1/2', reason: 'tempo esgotado', winner: null }
        : { result: opp === 'w' ? '1-0' : '0-1', reason: 'tempo esgotado', winner: opp })
    })

    channel.on('broadcast', { event: 'draw_offer' }, () => { if (!endRef.current) setDrawOffer('incoming') })
    channel.on('broadcast', { event: 'draw_decline' }, () => setDrawOffer(null))
    channel.on('broadcast', { event: 'draw_accept' }, () => {
      setDrawOffer(null)
      if (!endRef.current) setEnd({ result: '1/2-1/2', reason: 'empate acordado', winner: null })
    })

    channel.on('broadcast', { event: 'rematch_offer' }, ({ payload }) => {
      const p = payload as { id: string; swap: boolean }
      pendingSwapRef.current = p.swap
      setRematchOffer('incoming')
    })
    channel.on('broadcast', { event: 'rematch_accept' }, () => {
      startRematch(pendingSwapRef.current)
    })

    channel.on('broadcast', { event: 'leave' }, () => {
      if (!endRef.current && seatsRef.current) {
        const winner = myColor ?? (seatsRef.current.whiteId === myId ? 'w' : 'b')
        setEnd({ result: winner === 'w' ? '1-0' : '0-1', reason: 'abandono', winner })
      }
      setOppOnline(false)
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const others = Object.keys(state).filter(k => k !== myId)
      setOppOnline(others.length > 0)
    })

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        void channel.track({ name: myNameRef.current })
        if (!asHost) {
          // announce ourselves; host (or peer) answers with start/sync
          send({ type: 'hello', payload: { id: myId, name: myNameRef.current } })
          // if nobody answers, room doesn't exist
          setTimeout(() => {
            if (!seatsRef.current) {
              const st = channel.presenceState()
              const others = Object.keys(st).filter(k => k !== myId)
              if (others.length === 0) {
                setError('Sala não encontrada. Confira o código com seu amigo.')
                setStage('error')
              }
            }
          }, 4000)
        } else {
          setStage('lobby')
        }
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError('Falha de conexão. Tente novamente.')
        setStage('error')
      }
    })

    if (cfg) {
      setConfig(cfg)
      configRef.current = cfg
      const t = resolveTime(cfg)
      resetClocks(t.initialMs)
    }
  }, [myId, send, setClock, resetClocks, startRematch, myColor])

  // ── public api ─────────────────────────────────────────────────────────
  const createRoom = useCallback((cfg: GameConfig, myName: string) => {
    myNameRef.current = myName || 'Anfitrião'
    const code = genRoomCode()
    setRoomCode(code)
    setAmHost(true)
    setStage('connecting')
    subscribe(code, true, cfg)
  }, [subscribe])

  const joinRoom = useCallback((code: string, myName: string) => {
    myNameRef.current = myName || 'Desafiante'
    const clean = code.trim().toUpperCase()
    if (clean.length !== 4) {
      setError('O código tem 4 caracteres, ex: A7K9.')
      setStage('error')
      return
    }
    setRoomCode(clean)
    setAmHost(false)
    setStage('connecting')
    subscribe(clean, false, null)
  }, [subscribe])

  const leave = useCallback(() => {
    send({ type: 'leave', payload: { id: myId } })
    const ch = channelRef.current
    channelRef.current = null
    if (ch) void supabase.removeChannel(ch)
    onExit()
  }, [send, myId, onExit])

  // cleanup on unmount
  useEffect(() => () => {
    const ch = channelRef.current
    if (ch) void supabase.removeChannel(ch)
  }, [])

  // tally the rivalry score once per finished game (reset guard on rematch)
  useEffect(() => {
    if (end && !scoredRef.current) {
      scoredRef.current = true
      const st = seatsRef.current
      if (st) {
        if (end.winner === null) setDraws(d => d + 1)
        else {
          const pid = end.winner === 'w' ? st.whiteId : st.blackId
          setWins(w => ({ ...w, [pid]: (w[pid] ?? 0) + 1 }))
        }
      }
    }
    if (!end) scoredRef.current = false
  }, [end])

  // ── controller for GameView ────────────────────────────────────────────
  const makeMove = useCallback((input: MoveInput) => {
    if (endRef.current) return
    const cur = chessFromMoves(movesRef.current)
    const moverColor = cur.turn()
    if (moverColor !== myColor) return
    const mv = tryMove(cur, input)
    if (!mv) return
    const idx = movesRef.current.length
    setMoves(prev => [...prev, input])
    applyIncrement(moverColor)
    const t = configRef.current ? resolveTime(configRef.current) : { initialMs: null, incrementMs: 0 }
    const clockAfter = clocksRef.current[moverColor] === null
      ? null
      : (clocksRef.current[moverColor] as number) + t.incrementMs
    send({ type: 'move', payload: { id: myId, moveIdx: idx, move: input, clockMs: clockAfter } })
    const be = boardEnd(cur)
    if (be) setEnd(be)
    setDrawOffer(null)
  }, [myColor, applyIncrement, send, myId])

  const ctl: MatchController | null = (stage === 'playing' && seats && config && myColor) ? {
    moves,
    end,
    clocks,
    players: {
      w: { id: seats.whiteId, name: seats.whiteName, online: myColor === 'w' ? true : oppOnline },
      b: { id: seats.blackId, name: seats.blackName, online: myColor === 'b' ? true : oppOnline },
    },
    myColor,
    incrementLabel: timeLabel(config),
    makeMove,
    resign: () => {
      if (endRef.current) return
      send({ type: 'resign', payload: { id: myId } })
      const winner: Color = myColor === 'w' ? 'b' : 'w'
      setEnd({ result: winner === 'w' ? '1-0' : '0-1', reason: 'desistência', winner })
    },
    drawOffer,
    offerDraw: () => {
      if (endRef.current || drawOffer) return
      setDrawOffer('outgoing')
      send({ type: 'draw_offer', payload: { id: myId } })
    },
    respondDraw: (accept: boolean) => {
      if (accept) {
        send({ type: 'draw_accept', payload: { id: myId } })
        setEnd({ result: '1/2-1/2', reason: 'empate acordado', winner: null })
      } else {
        send({ type: 'draw_decline', payload: { id: myId } })
      }
      setDrawOffer(null)
    },
    rematchOffer,
    offerRematch: (swap: boolean) => {
      if (rematchOffer === 'incoming') {
        // both clicked: treat as accept
        send({ type: 'rematch_accept', payload: { id: myId } })
        startRematch(pendingSwapRef.current)
        return
      }
      pendingSwapRef.current = swap
      setRematchOffer('outgoing')
      send({ type: 'rematch_offer', payload: { id: myId, swap } })
    },
    acceptRematch: () => {
      send({ type: 'rematch_accept', payload: { id: myId } })
      startRematch(pendingSwapRef.current)
    },
    chat,
    sendChat: (text: string) => {
      const msg: ChatMsg = { author: myNameRef.current, text, ts: Date.now() }
      setChat(prev => [...prev, msg])
      send({ type: 'chat', payload: { ...msg, id: myId } })
    },
    roomCode,
    leave,
    rivalry: {
      mineName: myColor === 'w' ? seats.whiteName : seats.blackName,
      theirsName: myColor === 'w' ? seats.blackName : seats.whiteName,
      mine: wins[myId] ?? 0,
      theirs: wins[myColor === 'w' ? seats.blackId : seats.whiteId] ?? 0,
      draws,
    },
  } : null

  return { stage, error, roomCode, amHost, guestName, config, ctl, createRoom, joinRoom, leave }
}
