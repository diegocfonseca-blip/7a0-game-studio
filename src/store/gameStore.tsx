import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { GameState, GameScreen, StolenTrait, TraitMood, ActiveMatch } from '../types/game'
import { generateOpponent } from '../data/matchMoments'
import { MATCH_MOMENTS } from '../data/matchMoments'

const INITIAL_STATE: GameState = {
  screen: 'intro',
  player: null,
  currentYear: 1992,
  coins: 500,
  reputation: 0,
  stolenTraits: [],
  currentClub: 'Sem clube',
  selectedLegendId: null,
  selectedTraitId: null,
  activeMission: null,
  activeMatch: null,
  titles: [],
  stolenFrom: [],
  matchesPlayed: 0,
}

type Action =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'CREATE_PLAYER'; player: NonNullable<GameState['player']> }
  | { type: 'SELECT_LEGEND'; legendId: string | null }
  | { type: 'SELECT_TRAIT'; traitId: string | null }
  | { type: 'START_MISSION'; legendId: string; traitId: string }
  | { type: 'MISSION_CHOICE'; choiceIndex: number; score: number }
  | { type: 'COMPLETE_MISSION'; success: boolean; partial?: boolean; trait?: StolenTrait }
  | { type: 'MAINTAIN_TRAIT'; traitId: string; cost: number }
  | { type: 'DECAY_ALL_TRAITS' }
  | { type: 'ADVANCE_YEAR' }
  | { type: 'PLAY_MATCH' }
  | { type: 'START_MATCH'; opponent: ReturnType<typeof generateOpponent> }
  | { type: 'MATCH_NEXT_PHASE' }
  | { type: 'MATCH_CHOICE'; momentIndex: number; choiceIndex: number; score: number; traitUsed: string | null }
  | { type: 'COMPLETE_MATCH'; earned: number; repGain: number }
  | { type: 'SPEND_COINS'; amount: number }
  | { type: 'EARN_COINS'; amount: number }
  | { type: 'RESET_GAME' }

function moodFromBar(bar: number): TraitMood {
  if (bar > 70) return '🔥'
  if (bar > 50) return '😊'
  if (bar > 30) return '😰'
  if (bar > 10) return '😴'
  return '😤'
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'CREATE_PLAYER':
      return { ...state, player: action.player, screen: 'map', coins: 800 }

    case 'SELECT_LEGEND':
      return { ...state, selectedLegendId: action.legendId, selectedTraitId: null }

    case 'SELECT_TRAIT':
      return { ...state, selectedTraitId: action.traitId }

    case 'START_MISSION':
      return {
        ...state,
        activeMission: {
          legendId: action.legendId,
          traitId: action.traitId,
          phase: 0,
          choices: [],
          completed: false,
          success: false,
        },
        selectedLegendId: null,
        selectedTraitId: null,
        screen: 'steal-mission',
      }

    case 'MISSION_CHOICE': {
      if (!state.activeMission) return state
      return {
        ...state,
        activeMission: {
          ...state.activeMission,
          choices: [
            ...state.activeMission.choices,
            { phase: state.activeMission.phase, choiceIndex: action.choiceIndex, score: action.score },
          ],
          phase: state.activeMission.phase + 1,
        },
      }
    }

    case 'COMPLETE_MISSION': {
      const newState: GameState = {
        ...state,
        activeMission: state.activeMission
          ? { ...state.activeMission, completed: true, success: action.success }
          : null,
        screen: 'map',
      }
      if (action.success && action.trait) {
        const bar = action.partial ? 65 : 100
        newState.stolenTraits = [
          ...state.stolenTraits,
          { ...action.trait, maintenanceBar: bar, mood: moodFromBar(bar) },
        ]
        if (!state.stolenFrom.includes(action.trait.legendId)) {
          newState.stolenFrom = [...state.stolenFrom, action.trait.legendId]
        }
        newState.reputation = state.reputation + (action.partial ? 5 : 10)
      }
      return newState
    }

    case 'MAINTAIN_TRAIT': {
      const updated = state.stolenTraits.map(t => {
        if (t.traitId !== action.traitId) return t
        const newBar = Math.min(100, t.maintenanceBar + 35)
        return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
      })
      return { ...state, stolenTraits: updated, coins: state.coins - action.cost }
    }

    case 'DECAY_ALL_TRAITS': {
      const decayed = state.stolenTraits
        .map(t => ({ ...t, maintenanceBar: Math.max(0, t.maintenanceBar - 8), mood: moodFromBar(Math.max(0, t.maintenanceBar - 8)) }))
        .filter(t => t.maintenanceBar > 0)
      return { ...state, stolenTraits: decayed }
    }

    case 'ADVANCE_YEAR': {
      const decayed = state.stolenTraits
        .map(t => {
          const newBar = Math.max(0, t.maintenanceBar - 8)
          return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
        })
        .filter(t => t.maintenanceBar > 0)
      const passiveIncome = 200 + decayed.length * 50
      return {
        ...state,
        currentYear: state.currentYear + 1,
        coins: state.coins + passiveIncome,
        stolenTraits: decayed,
        reputation: Math.max(0, state.reputation - 1),
      }
    }

    case 'PLAY_MATCH':
      return { ...state, screen: 'match', activeMatch: null }

    case 'START_MATCH': {
      const match: ActiveMatch = {
        opponentName: action.opponent.name,
        opponentFlag: action.opponent.flag,
        opponentStrength: action.opponent.strength,
        momentIndex: 0,
        phase: 'intro',
        choices: [],
        goals: 0,
        goalsAgainst: 0,
      }
      return { ...state, activeMatch: match }
    }

    case 'MATCH_NEXT_PHASE': {
      if (!state.activeMatch) return state
      return { ...state, activeMatch: { ...state.activeMatch, phase: 'moment' } }
    }

    case 'MATCH_CHOICE': {
      if (!state.activeMatch) return state
      const newChoices = [
        ...state.activeMatch.choices,
        { momentIndex: action.momentIndex, choiceIndex: action.choiceIndex, score: action.score, traitUsed: action.traitUsed },
      ]
      const nextIndex = state.activeMatch.momentIndex + 1
      const done = nextIndex >= MATCH_MOMENTS.length
      return {
        ...state,
        activeMatch: {
          ...state.activeMatch,
          choices: newChoices,
          momentIndex: nextIndex,
          phase: done ? 'result' : 'moment',
        },
      }
    }

    case 'COMPLETE_MATCH':
      return {
        ...state,
        coins: state.coins + action.earned,
        reputation: state.reputation + action.repGain,
        matchesPlayed: (state.matchesPlayed ?? 0) + 1,
        activeMatch: null,
        screen: 'map',
      }

    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.amount) }

    case 'EARN_COINS':
      return { ...state, coins: state.coins + action.amount }

    case 'RESET_GAME':
      return { ...INITIAL_STATE }

    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (init) => {
    const saved = localStorage.getItem('thief-of-legends-v1')
    if (saved) {
      try {
        return JSON.parse(saved) as GameState
      } catch {
        return init
      }
    }
    return init
  })

  useEffect(() => {
    localStorage.setItem('thief-of-legends-v1', JSON.stringify(state))
  }, [state])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be inside GameProvider')
  return ctx
}
