import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { GameState, GameScreen, StolenTrait, TraitMood, NarrationMoment, MatchType } from '../types/game'
import { generateMatchOpponent } from '../data/matchMoments'
import { rollYearEvents } from '../data/gameEvents'

const INITIAL_STATE: GameState = {
  screen: 'intro',
  player: null,
  currentYear: 1992,
  coins: 0,
  reputation: 0,
  stolenTraits: [],
  currentClub: 'Sem clube',
  clubLevel: 1,
  selectedLegendId: null,
  selectedTraitId: null,
  activeMission: null,
  activeMatch: null,
  titles: [],
  stolenFrom: [],
  matchesPlayed: 0,
  pendingEvents: [],
  pendingMatchType: 'amistoso',
}

type Action =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'CREATE_PLAYER'; player: NonNullable<GameState['player']> }
  | { type: 'COMPLETE_ONBOARDING'; trait: StolenTrait; clubName: string; clubLevel: 1 | 2 | 3; startCoins: number }
  | { type: 'SELECT_LEGEND'; legendId: string | null }
  | { type: 'SELECT_TRAIT'; traitId: string | null }
  | { type: 'START_MISSION'; legendId: string; traitId: string }
  | { type: 'MISSION_CHOICE'; choiceIndex: number; score: number }
  | { type: 'COMPLETE_MISSION'; success: boolean; partial?: boolean; trait?: StolenTrait }
  | { type: 'MAINTAIN_TRAIT'; traitId: string; cost: number }
  | { type: 'DECAY_ALL_TRAITS' }
  | { type: 'ADVANCE_YEAR' }
  | { type: 'DISMISS_EVENTS' }
  | { type: 'PLAY_MATCH'; matchType: MatchType }
  | { type: 'START_MATCH'; opponent: ReturnType<typeof generateMatchOpponent>; moments: NarrationMoment[]; goals: number; goalsAgainst: number; matchType: MatchType }
  | { type: 'MATCH_NEXT_PHASE' }
  | { type: 'MATCH_NEXT_MOMENT' }
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
      return { ...state, player: action.player, screen: 'onboarding', coins: 0 }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        screen: 'map',
        currentClub: action.clubName,
        clubLevel: action.clubLevel,
        coins: action.startCoins,
        stolenTraits: [action.trait],
        stolenFrom: [action.trait.legendId],
        reputation: 5,
      }

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
      const clubBonus = (state.clubLevel - 1) * 100
      const passiveIncome = 200 + clubBonus + decayed.length * 50
      const events = rollYearEvents({ ...state, stolenTraits: decayed, currentYear: state.currentYear + 1 })
      return {
        ...state,
        currentYear: state.currentYear + 1,
        coins: state.coins + passiveIncome,
        stolenTraits: decayed,
        reputation: Math.max(0, state.reputation - 1),
        pendingEvents: events,
      }
    }

    case 'DISMISS_EVENTS': {
      let coins = state.coins
      let reputation = state.reputation
      let stolenTraits = [...state.stolenTraits]

      for (const event of state.pendingEvents) {
        if (event.effect?.coins) coins += event.effect.coins
        if (event.effect?.reputation) reputation += event.effect.reputation
        if (event.effect?.traitBoostId && event.effect.traitDrainAmount !== undefined) {
          const drain = event.effect.traitDrainAmount
          stolenTraits = stolenTraits
            .map(t => {
              if (t.traitId !== event.effect!.traitBoostId) return t
              const newBar = Math.max(0, Math.min(100, t.maintenanceBar - drain))
              return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
            })
            .filter(t => t.maintenanceBar > 0)
        }
      }

      return {
        ...state,
        pendingEvents: [],
        coins: Math.max(0, coins),
        reputation: Math.max(0, reputation),
        stolenTraits,
      }
    }

    case 'PLAY_MATCH':
      return { ...state, screen: 'match', activeMatch: null, pendingMatchType: action.matchType }

    case 'START_MATCH':
      return {
        ...state,
        activeMatch: {
          opponentName: action.opponent.name,
          opponentFlag: action.opponent.flag,
          opponentStrength: action.opponent.strength,
          momentIndex: 0,
          phase: 'intro',
          moments: action.moments,
          goals: action.goals,
          goalsAgainst: action.goalsAgainst,
          matchType: action.matchType,
        },
      }

    case 'MATCH_NEXT_PHASE': {
      if (!state.activeMatch) return state
      return { ...state, activeMatch: { ...state.activeMatch, phase: 'narration' } }
    }

    case 'MATCH_NEXT_MOMENT': {
      if (!state.activeMatch) return state
      const next = state.activeMatch.momentIndex + 1
      const done = next >= state.activeMatch.moments.length
      return {
        ...state,
        activeMatch: {
          ...state.activeMatch,
          momentIndex: done ? state.activeMatch.momentIndex : next,
          phase: done ? 'result' : 'narration',
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
    const saved = localStorage.getItem('thief-of-legends-v2')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState
        return {
          ...init,
          ...parsed,
          clubLevel: parsed.clubLevel ?? 1,
          pendingEvents: parsed.pendingEvents ?? [],
          pendingMatchType: parsed.pendingMatchType ?? 'amistoso',
        }
      } catch {
        return init
      }
    }
    return init
  })

  useEffect(() => {
    localStorage.setItem('thief-of-legends-v2', JSON.stringify(state))
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
