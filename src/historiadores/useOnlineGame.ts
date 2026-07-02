import { useState, useEffect, useRef, useCallback } from 'react'
import type { HState, HGuess, HBet, HGuesserRank, HRoundResult, QuestionKey } from './types'
import {
  generateRoomCode, dbCreateRoom, dbGetRoom, dbSetRoomStatus, dbDeleteRoom,
  getChannel, sendRoomEvent,
  type OnlinePlayer, type RoomChannel, type RoomEvent,
} from './onlineRoom'
import { HIST_CARDS, getCard } from './data'
import { cpuGuess, getRealValue } from './store'

// ── Pure game helpers ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const CPU_NAMES = ['Tonhão', 'PC Magrão', 'Biriba']
const START_MONEY = 100
const BONUSES = [30, 15, 5, 0]

function makeCPUPlayer(idx: number): OnlinePlayer {
  return { id: `cpu-${idx}`, nome: CPU_NAMES[idx] ?? `CPU ${idx}`, isHost: false, isCPU: true }
}

function resolveGuesses(guesses: HGuess[], real: number): HGuesserRank[] {
  const scored = guesses.map(g => ({ ...g, over: g.value > real, distance: Math.abs(g.value - real) }))
  const sorted = [...scored].sort((a, b) => {
    if (a.over !== b.over) return a.over ? 1 : -1
    if (a.distance !== b.distance) return a.distance - b.distance
    return a.timestamp - b.timestamp
  })
  const allOver = sorted.every(g => g.over)
  return sorted.map((g, i) => ({
    playerId: g.playerId,
    value: g.value,
    over: g.over,
    distance: g.distance,
    rank: i + 1,
    bonus: allOver ? 0 : g.over ? 0 : (BONUSES[i] ?? 0),
  }))
}

function resolveRound(guesses: HGuess[], bets: HBet[], real: number): HRoundResult {
  const guessRanks = resolveGuesses(guesses, real)
  const winningGuessPlayerId = guessRanks[0]?.playerId ?? null
  const betsOnWinner = (winningGuessPlayerId
    ? bets.filter(b => b.onPlayerId === winningGuessPlayerId)
    : []
  ).sort((a, b) => a.amount !== b.amount ? b.amount - a.amount : a.timestamp - b.timestamp)

  const topBet = betsOnWinner[0] ?? null
  const secondBet = betsOnWinner[1] ?? null
  const cardWinnerId = topBet && topBet.amount > 0 ? topBet.playerId : null
  const hadTiebreak = !!(topBet && secondBet && topBet.amount === secondBet.amount && topBet.amount > 0)
  const tiebreakMs = hadTiebreak && topBet && secondBet ? Math.abs(secondBet.timestamp - topBet.timestamp) : 0
  return { realValue: real, winningGuessPlayerId, guessRanks, bets, cardWinnerId, hadTiebreak, tiebreakMs }
}

function applyRoundResult(st: HState, allBets: HBet[], roundResult: HRoundResult): HState {
  const players = st.players.map(p => {
    const myBet = allBets.find(b => b.playerId === p.id)
    const guessRank = roundResult.guessRanks.find(r => r.playerId === p.id)
    const isCardWinner = roundResult.cardWinnerId === p.id
    const betCost = isCardWinner ? (myBet?.amount ?? 0) : 0
    return {
      ...p,
      money: Math.max(0, p.money - betCost + (guessRank?.bonus ?? 0)),
      cartasIds: isCardWinner ? [...p.cartasIds, st.currentCardId!] : p.cartasIds,
    }
  })
  const museuCards = roundResult.cardWinnerId === st.players[st.youIdx]?.id
    ? [...new Set([...st.museuCards, st.currentCardId!])]
    : st.museuCards
  return { ...st, phase: 'revealing', bets: allBets, roundResult, players, museuCards }
}

// ── Return type ───────────────────────────────────────────────────────
export interface OnlineGameAPI {
  myPlayerId: string
  roomCode: string
  lobbyPlayers: OnlinePlayer[]
  gameState: HState | null
  isHost: boolean
  lobbyStatus: 'idle' | 'creating' | 'joining' | 'waiting' | 'playing' | 'error'
  errorMsg: string
  createRoom: (myName: string, totalRounds: number) => Promise<void>
  joinRoom: (code: string, myName: string) => Promise<void>
  startGame: () => void
  leaveRoom: () => void
  submitGuess: (value: number) => void
  submitBet: (onPlayerId: string, amount: number, timestamp: number) => void
  nextCard: () => void
}

// ── Main hook ─────────────────────────────────────────────────────────
export function useOnlineGame(): OnlineGameAPI {
  const myId = useRef(`p-${Math.random().toString(36).slice(2, 8)}`).current

  const [roomCode, setRoomCode]         = useState('')
  const [isHost, setIsHost]             = useState(false)
  const [lobbyPlayers, setLobbyPlayers] = useState<OnlinePlayer[]>([])
  const [gameState, setGameState]       = useState<HState | null>(null)
  const [status, setStatus]             = useState<OnlineGameAPI['lobbyStatus']>('idle')
  const [errorMsg, setErrorMsg]         = useState('')

  const channelRef   = useRef<RoomChannel | null>(null)
  const hostState    = useRef<HState | null>(null)       // host's authoritative state
  const codeRef      = useRef('')
  const isHostRef    = useRef(false)

  // Sync refs
  useEffect(() => { codeRef.current = roomCode }, [roomCode])
  useEffect(() => { isHostRef.current = isHost }, [isHost])

  const broadcast = useCallback(async (event: RoomEvent) => {
    if (channelRef.current) await sendRoomEvent(channelRef.current, event)
  }, [])

  const broadcastState = useCallback((st: HState) => {
    hostState.current = st
    setGameState(st)
    broadcast({ type: 'game_state', payload: { state: st } })
  }, [broadcast])

  // ── Host: add a human guess + maybe advance ───────────────────────
  const hostAddGuess = useCallback((playerId: string, value: number, timestamp: number) => {
    const st = hostState.current
    if (!st || st.phase !== 'guessing' || !st.currentCardId || !st.currentQuestion) return

    const already = st.guesses.some(g => g.playerId === playerId)
    if (already) return

    const newGuesses: HGuess[] = [...st.guesses, { playerId, value, timestamp }]
    const humanIds = st.players.filter(p => !p.isCPU).map(p => p.id)
    const allDone  = humanIds.every(id => newGuesses.some(g => g.playerId === id))

    if (!allDone) {
      broadcastState({ ...st, guesses: newGuesses })
      return
    }

    // All humans guessed → add CPU guesses and move to betting
    const real = getRealValue(st.currentCardId, st.currentQuestion)
    const cpuGuesses: HGuess[] = st.players.filter(p => p.isCPU).map(p => ({
      playerId: p.id,
      value: cpuGuess(real),
      timestamp: Date.now() + 1 + Math.floor(Math.random() * 500),
    }))
    broadcastState({ ...st, guesses: [...newGuesses, ...cpuGuesses], phase: 'betting', bets: [] })
  }, [broadcastState])

  // ── Host: add a bet + maybe resolve round ─────────────────────────
  const hostAddBet = useCallback((playerId: string, onPlayerId: string, amount: number, timestamp: number) => {
    const st = hostState.current
    if (!st || st.phase !== 'betting' || !st.currentCardId || !st.currentQuestion) return

    const already = st.bets.some(b => b.playerId === playerId)
    if (already) return

    const you = st.players.find(p => p.id === playerId)
    const safeAmt = Math.min(you?.money ?? 0, Math.max(0, amount))
    const newBets: HBet[] = [...st.bets, { playerId, onPlayerId, amount: safeAmt, timestamp }]

    const humanIds = st.players.filter(p => !p.isCPU).map(p => p.id)
    const allDone  = humanIds.every(id => newBets.some(b => b.playerId === id))

    if (!allDone) {
      broadcastState({ ...st, bets: newBets })
      return
    }

    // All humans bet → add CPU bets + resolve
    const real = getRealValue(st.currentCardId, st.currentQuestion)
    const cpuBets: HBet[] = st.players.filter(p => p.isCPU).map(p => {
      const myG = st.guesses.find(g => g.playerId === p.id)
      const estimate = myG?.value ?? real
      const sorted = [...st.guesses].map(g => ({ id: g.playerId, d: Math.abs(g.value - estimate) })).sort((a, b) => a.d - b.d)
      const r = Math.random()
      const targetId = r < 0.25 ? p.id : r < 0.85 ? sorted[0].id : st.guesses[Math.floor(Math.random() * st.guesses.length)].playerId
      const money = st.players.find(pl => pl.id === p.id)?.money ?? START_MONEY
      const amt = Math.min(money, Math.max(1, Math.round(money * (0.1 + Math.random() * 0.4))))
      return { playerId: p.id, onPlayerId: targetId, amount: amt, timestamp: Date.now() + Math.round(-400 + Math.random() * 1000) }
    })

    const allBets = [...newBets, ...cpuBets]
    const roundResult = resolveRound(st.guesses, allBets, real)
    broadcastState(applyRoundResult(st, allBets, roundResult))
  }, [broadcastState])

  // ── Host: next card ───────────────────────────────────────────────
  const hostNextCard = useCallback(() => {
    const st = hostState.current
    if (!st) return
    const isLast = st.round >= st.totalRounds || st.deck.length === 0
    if (isLast) {
      broadcastState({ ...st, screen: 'results' })
      dbSetRoomStatus(codeRef.current, 'finished')
      return
    }
    const [next, ...rest] = st.deck
    const card = getCard(next)
    const q: QuestionKey = card ? pick(card.perguntas) : 'copa_gols'
    broadcastState({
      ...st,
      screen: 'game',
      deck: rest,
      currentCardId: next,
      currentQuestion: q,
      phase: 'guessing',
      guesses: [],
      bets: [],
      roundResult: null,
      round: st.round + 1,
    })
  }, [broadcastState])

  // ── Subscribe to Realtime channel ─────────────────────────────────
  const subscribeChannel = useCallback((code: string, asHost: boolean) => {
    const ch = getChannel(code)

    ch.on('broadcast', { event: 'player_join' }, ({ payload }) => {
      if (!asHost) return
      const { id, nome } = payload as { id: string; nome: string }
      setLobbyPlayers(prev => prev.some(p => p.id === id)
        ? prev
        : [...prev, { id, nome, isHost: false, isCPU: false }]
      )
    })

    ch.on('broadcast', { event: 'player_leave' }, ({ payload }) => {
      const { id } = payload as { id: string }
      setLobbyPlayers(prev => prev.filter(p => p.id !== id))
    })

    ch.on('broadcast', { event: 'game_state' }, ({ payload }) => {
      if (asHost) return
      const { state } = payload as { state: HState }
      setGameState(state)
      if (state.screen === 'game' || state.screen === 'results') setStatus('playing')
    })

    ch.on('broadcast', { event: 'guest_guess' }, ({ payload }) => {
      if (!asHost) return
      const { playerId, value, timestamp } = payload as { playerId: string; value: number; timestamp: number }
      hostAddGuess(playerId, value, timestamp)
    })

    ch.on('broadcast', { event: 'guest_bet' }, ({ payload }) => {
      if (!asHost) return
      const { playerId, onPlayerId, amount, timestamp } = payload as { playerId: string; onPlayerId: string; amount: number; timestamp: number }
      hostAddBet(playerId, onPlayerId, amount, timestamp)
    })

    ch.on('broadcast', { event: 'guest_next' }, () => {
      if (!asHost) return
      hostNextCard()
    })

    ch.subscribe()
    channelRef.current = ch
  }, [hostAddGuess, hostAddBet, hostNextCard])

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => () => { channelRef.current?.unsubscribe() }, [])

  // ── Public: leave room ────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    broadcast({ type: 'player_leave', payload: { id: myId } })
    channelRef.current?.unsubscribe()
    channelRef.current = null
    if (isHostRef.current && codeRef.current) dbDeleteRoom(codeRef.current)
    setRoomCode(''); setIsHost(false); setLobbyPlayers([])
    setGameState(null); setStatus('idle'); setErrorMsg('')
    hostState.current = null
  }, [broadcast, myId])

  // ── Public: create room ───────────────────────────────────────────
  const createRoom = useCallback(async (myName: string, totalRounds: number) => {
    setStatus('creating'); setErrorMsg('')
    try {
      const code = generateRoomCode()
      await dbCreateRoom(code, myId, myName, totalRounds)
      setRoomCode(code)
      setIsHost(true)
      setLobbyPlayers([{ id: myId, nome: myName, isHost: true, isCPU: false }])
      // Seed a skeleton state so hostState.current is set before startGame
      hostState.current = {
        screen: 'menu', players: [], youIdx: 0, deck: [],
        currentCardId: null, currentQuestion: null, phase: 'guessing',
        guesses: [], bets: [], roundResult: null, round: 0, totalRounds, museuCards: [],
      }
      subscribeChannel(code, true)
      setStatus('waiting')
    } catch {
      setStatus('error')
      setErrorMsg('Não foi possível criar a sala. Tente novamente.')
    }
  }, [myId, subscribeChannel])

  // ── Public: join room ─────────────────────────────────────────────
  const joinRoom = useCallback(async (code: string, myName: string) => {
    setStatus('joining'); setErrorMsg('')
    const upper = code.toUpperCase().trim()
    try {
      const room = await dbGetRoom(upper)
      if (!room) { setStatus('error'); setErrorMsg('Sala não encontrada. Confere o código.'); return }
      if (room.status !== 'waiting') { setStatus('error'); setErrorMsg('Essa sala já está em jogo.'); return }
      setRoomCode(upper)
      setIsHost(false)
      setLobbyPlayers([{ id: myId, nome: myName, isHost: false, isCPU: false }])
      subscribeChannel(upper, false)
      setStatus('waiting')
      // Tell host we joined
      await sendRoomEvent(channelRef.current!, { type: 'player_join', payload: { id: myId, nome: myName } })
    } catch {
      setStatus('error')
      setErrorMsg('Erro ao entrar na sala.')
    }
  }, [myId, subscribeChannel])

  // ── Public: start game (host only) ────────────────────────────────
  const startGame = useCallback(() => {
    if (!isHostRef.current) return
    const humanPlayers = lobbyPlayers.filter(p => !p.isCPU)
    const cpuCount = Math.max(0, 4 - humanPlayers.length)
    const cpus = Array.from({ length: cpuCount }, (_, i) => makeCPUPlayer(i))
    const allOnline = [...humanPlayers, ...cpus]

    const totalRounds = hostState.current?.totalRounds ?? 10
    const deck = shuffle(HIST_CARDS.map(c => c.id)).slice(0, totalRounds)
    const [first, ...rest] = deck
    const card = getCard(first)
    const q: QuestionKey = card ? pick(card.perguntas) : 'copa_gols'

    const gamePlayers = allOnline.map(p => ({
      id: p.id, nome: p.nome, isCPU: p.isCPU, money: START_MONEY, cartasIds: [],
    }))
    const myIdx = gamePlayers.findIndex(p => p.id === myId)

    const newState: HState = {
      screen: 'game',
      players: gamePlayers,
      youIdx: myIdx >= 0 ? myIdx : 0,
      deck: rest,
      currentCardId: first,
      currentQuestion: q,
      phase: 'guessing',
      guesses: [],
      bets: [],
      roundResult: null,
      round: 1,
      totalRounds,
      museuCards: [],
    }

    dbSetRoomStatus(codeRef.current, 'playing')
    broadcastState(newState)
    setStatus('playing')
  }, [lobbyPlayers, myId, broadcastState])

  // ── Public: game actions ──────────────────────────────────────────
  const submitGuess = useCallback((value: number) => {
    if (isHostRef.current) {
      hostAddGuess(myId, value, Date.now())
    } else {
      broadcast({ type: 'guest_guess', payload: { playerId: myId, value, timestamp: Date.now() } })
    }
  }, [myId, broadcast, hostAddGuess])

  const submitBet = useCallback((onPlayerId: string, amount: number, timestamp: number) => {
    if (isHostRef.current) {
      hostAddBet(myId, onPlayerId, amount, timestamp)
    } else {
      broadcast({ type: 'guest_bet', payload: { playerId: myId, onPlayerId, amount, timestamp } })
    }
  }, [myId, broadcast, hostAddBet])

  const nextCard = useCallback(() => {
    if (isHostRef.current) {
      hostNextCard()
    } else {
      broadcast({ type: 'guest_next', payload: {} })
    }
  }, [broadcast, hostNextCard])

  return {
    myPlayerId: myId,
    roomCode,
    lobbyPlayers,
    gameState,
    isHost,
    lobbyStatus: status,
    errorMsg,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    submitGuess,
    submitBet,
    nextCard,
  }
}
