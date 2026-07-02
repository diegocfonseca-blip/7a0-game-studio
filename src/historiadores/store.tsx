import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { HState, HScreen, HPlayer, HGuess, HBet, HGuesserRank, HRoundResult, QuestionKey } from './types'
import { HIST_CARDS, getCard } from './data'

// ── helpers ─────────────────────────────────────────────────────
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

export function cpuGuess(real: number): number {
  const err = 0.1 + Math.random() * 0.35  // 10–45% error
  const sign = Math.random() < 0.5 ? 1 : -1
  return Math.max(0, Math.round(real * (1 + sign * err)))
}

function cpuBetAmount(money: number): number {
  const pct = 0.10 + Math.random() * 0.40  // 10–50% of budget
  return Math.min(money, Math.max(1, Math.round(money * pct)))
}

// CPU picks which guess to back:
// 25% backs own guess, 60% backs guess closest to own estimate, 15% random
function cpuPickBetTarget(guesses: HGuess[], myId: string, myEstimate: number): string {
  const rand = Math.random()
  if (rand < 0.25) return myId
  if (rand < 0.85) {
    return [...guesses]
      .map(g => ({ id: g.playerId, dist: Math.abs(g.value - myEstimate) }))
      .sort((a, b) => a.dist - b.dist)[0].id
  }
  return guesses[Math.floor(Math.random() * guesses.length)].playerId
}

export function getRealValue(cardId: string, q: QuestionKey): number {
  const card = getCard(cardId)
  if (!card) return 0
  return card.atributos[q] ?? 0
}

// Rank guesses: Price is Right style.
// Under-real wins over went-over. Among under: closest wins. Among over: closest wins.
function resolveGuesses(guesses: HGuess[], real: number): HGuesserRank[] {
  const scored = guesses.map(g => ({
    ...g,
    over: g.value > real,
    distance: Math.abs(g.value - real),
  }))
  const sorted = [...scored].sort((a, b) => {
    if (a.over !== b.over) return a.over ? 1 : -1
    if (a.distance !== b.distance) return a.distance - b.distance
    return a.timestamp - b.timestamp
  })

  const allOver = sorted.every(g => g.over)
  const BONUSES = [30, 15, 5, 0]

  return sorted.map((g, i) => ({
    playerId: g.playerId,
    value: g.value,
    over: g.over,
    distance: g.distance,
    rank: i + 1,
    // No bonus if went over; no bonus for anyone if all went over
    bonus: allOver ? 0 : (g.over ? 0 : (BONUSES[i] ?? 0)),
  }))
}

function resolveRound(guesses: HGuess[], bets: HBet[], real: number): HRoundResult {
  const guessRanks = resolveGuesses(guesses, real)
  const topGuess = guessRanks[0]
  const winningGuessPlayerId = topGuess?.playerId ?? null

  // Card goes to the player who bet the MOST on the winning guess
  const betsOnWinner = winningGuessPlayerId
    ? bets.filter(b => b.onPlayerId === winningGuessPlayerId)
    : []
  const topBet = betsOnWinner.length > 0
    ? betsOnWinner.reduce((a, b) => a.amount >= b.amount ? a : b)
    : null
  const cardWinnerId = topBet && topBet.amount > 0 ? topBet.playerId : null

  return { realValue: real, winningGuessPlayerId, guessRanks, bets, cardWinnerId }
}

// ── initial state ─────────────────────────────────────────────
const START_MONEY = 100

export const INITIAL: HState = {
  screen: 'menu',
  players: [],
  youIdx: 0,
  deck: [],
  currentCardId: null,
  currentQuestion: null,
  phase: 'guessing',
  guesses: [],
  bets: [],
  roundResult: null,
  round: 0,
  totalRounds: 10,
  museuCards: [],
}

// ── actions ─────────────────────────────────────────────────────
type Action =
  | { type: 'START_GAME'; playerName: string; totalRounds: number }
  | { type: 'SET_SCREEN'; screen: HScreen }
  | { type: 'SUBMIT_GUESS'; value: number }
  | { type: 'SUBMIT_BET'; onPlayerId: string; amount: number }
  | { type: 'NEXT_CARD' }
  | { type: 'RESET' }

// ── reducer ─────────────────────────────────────────────────────
function reducer(state: HState, action: Action): HState {
  switch (action.type) {

    case 'RESET':
      return { ...INITIAL, museuCards: state.museuCards }

    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'START_GAME': {
      const deck = shuffle(HIST_CARDS.map(c => c.id)).slice(0, action.totalRounds)
      const [first, ...rest] = deck
      const card = getCard(first)
      const q: QuestionKey = card ? pick(card.perguntas) : 'gols'
      const players: HPlayer[] = [
        { id: 'you', nome: action.playerName || 'Você', isCPU: false, money: START_MONEY, cartasIds: [] },
        ...CPU_NAMES.map((n, i) => ({ id: `cpu-${i}`, nome: n, isCPU: true, money: START_MONEY, cartasIds: [] })),
      ]
      return {
        ...state,
        screen: 'game',
        players,
        youIdx: 0,
        deck: rest,
        currentCardId: first,
        currentQuestion: q,
        phase: 'guessing',
        guesses: [],
        bets: [],
        roundResult: null,
        round: 1,
        totalRounds: action.totalRounds,
      }
    }

    case 'SUBMIT_GUESS': {
      if (!state.currentCardId || !state.currentQuestion) return state
      const real = getRealValue(state.currentCardId, state.currentQuestion)

      const yourGuess: HGuess = {
        playerId: 'you',
        value: Math.max(0, action.value),
        timestamp: Date.now(),
      }

      const cpuGuesses: HGuess[] = state.players
        .filter(p => p.isCPU)
        .map(p => ({
          playerId: p.id,
          value: cpuGuess(real),
          timestamp: Date.now() + 1 + Math.floor(Math.random() * 500),
        }))

      return {
        ...state,
        phase: 'betting',
        guesses: [yourGuess, ...cpuGuesses],
        bets: [],
        roundResult: null,
      }
    }

    case 'SUBMIT_BET': {
      if (!state.currentCardId || !state.currentQuestion) return state
      const real = getRealValue(state.currentCardId, state.currentQuestion)
      const you = state.players[state.youIdx]

      const yourBet: HBet = {
        playerId: 'you',
        onPlayerId: action.onPlayerId,
        amount: Math.min(you.money, Math.max(0, action.amount)),
      }

      const cpuBets: HBet[] = state.players
        .filter(p => p.isCPU)
        .map(p => {
          const myGuess = state.guesses.find(g => g.playerId === p.id)
          const targetId = cpuPickBetTarget(state.guesses, p.id, myGuess?.value ?? real)
          return { playerId: p.id, onPlayerId: targetId, amount: cpuBetAmount(p.money) }
        })

      const allBets = [yourBet, ...cpuBets]
      const roundResult = resolveRound(state.guesses, allBets, real)

      const players = state.players.map(p => {
        const myBet = allBets.find(b => b.playerId === p.id)
        const guessRank = roundResult.guessRanks.find(r => r.playerId === p.id)
        const isCardWinner = roundResult.cardWinnerId === p.id
        return {
          ...p,
          money: Math.max(0, p.money - (myBet?.amount ?? 0) + (guessRank?.bonus ?? 0)),
          cartasIds: isCardWinner ? [...p.cartasIds, state.currentCardId!] : p.cartasIds,
        }
      })

      const museuCards = roundResult.cardWinnerId === 'you'
        ? [...new Set([...state.museuCards, state.currentCardId!])]
        : state.museuCards

      return { ...state, phase: 'revealing', bets: allBets, roundResult, players, museuCards }
    }

    case 'NEXT_CARD': {
      const isLast = state.round >= state.totalRounds || state.deck.length === 0
      if (isLast) return { ...state, screen: 'results' }
      const [next, ...rest] = state.deck
      const card = getCard(next)
      const q: QuestionKey = card ? pick(card.perguntas) : 'gols'
      return {
        ...state,
        screen: 'game',
        deck: rest,
        currentCardId: next,
        currentQuestion: q,
        phase: 'guessing',
        guesses: [],
        bets: [],
        roundResult: null,
        round: state.round + 1,
      }
    }

    default:
      return state
  }
}

// ── context ──────────────────────────────────────────────────────
const Ctx = createContext<{ state: HState; dispatch: React.Dispatch<Action> } | null>(null)

export function HistProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL)
  const dispatch = useCallback((a: Action) => rawDispatch(a), [])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useHist() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHist must be inside HistProvider')
  return ctx
}


