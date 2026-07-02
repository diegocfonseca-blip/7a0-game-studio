import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { HState, HScreen, HPlayer, HBid, HBidResult, QuestionKey } from './types'
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

function cpuBid(money: number): number {
  const pct = 0.05 + Math.random() * 0.25   // 5–30% of budget
  return Math.min(money, Math.max(1, Math.round((money * pct) / 5) * 5))
}

function getRealValue(cardId: string, q: QuestionKey): number {
  const card = getCard(cardId)
  if (!card) return 0
  return card.atributos[q] ?? 0
}

function erro(guess: number, real: number): number {
  if (guess > real) return 999  // passed the value — disqualified
  return real - guess
}

function resolveRound(bids: HBid[], cardId: string, q: QuestionKey): HBidResult[] {
  const real = getRealValue(cardId, q)
  // Score each bid
  const scored = bids.map(b => ({ ...b, erro: erro(b.palpite, real) }))
  // Sort: lowest erro first, then highest bid, then earliest timestamp
  const sorted = [...scored].sort((a, b) => {
    if (a.erro !== b.erro) return a.erro - b.erro
    if (a.lance !== b.lance) return b.lance - a.lance
    return a.timestamp - b.timestamp
  })
  // Assign ranks
  const ranked = sorted.map((b, i) => ({ ...b, rank: i + 1 }))
  // Bonus table: 1st → $30M, 2nd → $15M, 3rd → $5M, 4th → 0
  const BONUSES = [30, 15, 5, 0]
  return ranked.map(b => ({
    ...b,
    bonus: BONUSES[(b.rank - 1)] ?? 0,
    ganhou: b.rank === 1 && b.erro < 999,
  }))
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
  phase: 'bidding',
  bids: [],
  results: [],
  round: 0,
  totalRounds: 10,
  museuCards: [],
}

// ── actions ─────────────────────────────────────────────────────
type Action =
  | { type: 'START_GAME'; playerName: string; totalRounds: number }
  | { type: 'SET_SCREEN'; screen: HScreen }
  | { type: 'SUBMIT_BID'; guess: number; lance: number }
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
        phase: 'bidding',
        bids: [],
        results: [],
        round: 1,
        totalRounds: action.totalRounds,
      }
    }

    case 'SUBMIT_BID': {
      if (!state.currentCardId || !state.currentQuestion) return state
      const real = getRealValue(state.currentCardId, state.currentQuestion)
      const you = state.players[state.youIdx]
      const safeGuess = Math.max(0, action.guess)
      const safeLance = Math.min(you.money, Math.max(1, action.lance))

      const yourBid: HBid = {
        playerId: 'you',
        palpite: safeGuess,
        lance: safeLance,
        timestamp: Date.now(),
      }

      // Generate CPU bids
      const cpuBids: HBid[] = state.players
        .filter(p => p.isCPU)
        .map(p => ({
          playerId: p.id,
          palpite: cpuGuess(real),
          lance: cpuBid(p.money),
          timestamp: Date.now() + 1 + Math.floor(Math.random() * 300),
        }))

      const allBids = [yourBid, ...cpuBids]
      const results = resolveRound(allBids, state.currentCardId, state.currentQuestion)
      const winnerId = results.find(r => r.ganhou)?.playerId ?? null

      // Apply money changes
      const players = state.players.map(p => {
        const res = results.find(r => r.playerId === p.id)
        if (!res) return p
        const pay = res.ganhou ? res.lance : 0
        const cartasIds = res.ganhou ? [...p.cartasIds, state.currentCardId!] : p.cartasIds
        return { ...p, money: Math.max(0, p.money - pay + res.bonus), cartasIds }
      })

      // Update museo (cards won by human player)
      const museuCards = winnerId === 'you'
        ? [...new Set([...state.museuCards, state.currentCardId!])]
        : state.museuCards

      return { ...state, phase: 'revealing', bids: allBids, results, players, museuCards }
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
        phase: 'bidding',
        bids: [],
        results: [],
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

export { getRealValue }
