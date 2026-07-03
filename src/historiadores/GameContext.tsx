import { createContext, useContext, type ReactNode } from 'react'
import type { HState } from './types'
import { useHist } from './store'
import type { OnlineGameAPI } from './useOnlineGame'

// ── Shared interface for both solo and online game ────────────────────
export interface GameCtxValue {
  state: HState
  myPlayerId: string
  submitGuess: (value: number) => void
  submitBet: (onPlayerId: string, amount: number, ts: number) => void
  nextCard: () => void
  stealCard?: (fromPlayerId: string, stolenCardId: string) => void
  alreadyGuessed: boolean   // true = submitted this round, waiting for others
  alreadyBet: boolean
}

const GameCtx = createContext<GameCtxValue | null>(null)

export function useGameCtx() {
  const ctx = useContext(GameCtx)
  if (!ctx) throw new Error('useGameCtx must be inside a GameProvider')
  return ctx
}

// ── Solo mode: wraps existing useHist dispatch ────────────────────────
export function SoloGameProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useHist()
  const value: GameCtxValue = {
    state,
    myPlayerId: 'you',
    submitGuess:  (value)                     => dispatch({ type: 'SUBMIT_GUESS', value }),
    submitBet:    (onPlayerId, amount, ts)     => dispatch({ type: 'SUBMIT_BET', onPlayerId, amount, timestamp: ts }),
    nextCard:     ()                           => dispatch({ type: 'NEXT_CARD' }),
    stealCard:    (fromPlayerId, stolenCardId) => dispatch({ type: 'STEAL_CARD', fromPlayerId, stolenCardId }),
    alreadyGuessed: false,
    alreadyBet:     false,
  }
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}

// ── Online mode: wraps the useOnlineGame API ──────────────────────────
export function OnlineGameProvider({ children, api }: { children: ReactNode; api: OnlineGameAPI }) {
  const st = api.gameState
  const myId = api.myPlayerId
  const value: GameCtxValue = {
    state: st ?? {
      screen: 'menu', players: [], youIdx: 0, deck: [],
      currentCardId: null, currentQuestion: null, phase: 'guessing',
      guesses: [], bets: [], roundResult: null, round: 0, totalRounds: 10, museuCards: [],
    },
    myPlayerId: myId,
    submitGuess:     api.submitGuess,
    submitBet:       api.submitBet,
    nextCard:        api.nextCard,
    alreadyGuessed:  !!(st && st.guesses.some(g => g.playerId === myId)),
    alreadyBet:      !!(st && st.bets.some(b => b.playerId === myId)),
  }
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}
