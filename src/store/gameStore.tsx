import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { GameState, GameScreen, StolenTrait, TraitMood, NarrationMoment, MatchType, Country, Position, InheritedTrait } from '../types/game'
import { generateMatchOpponent } from '../data/matchMoments'
import { rollYearEvents } from '../data/gameEvents'
import { generateLeague, simulateRoundAI, LEAGUE_TOTAL_ROUNDS } from '../data/leagueData'
import { generateWeekEvents } from '../data/weeklyEvents'
import type { MarketItem } from '../data/market'

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
  league: null,
  leagueRound: 0,
  recentForm: [],
  matchesPlayed: 0,
  seasonWins: 0,
  seasonDraws: 0,
  seasonLosses: 0,
  pendingEvents: [],
  pendingMatchType: 'amistoso',
  purchasedItems: [],
  nextMatchMult: 1.0,
  seasonWeek: 0,
  weekEvents: [],
  matchDayActive: false,
  seasonComplete: false,
  generation: 1,
  inheritedTraits: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'CREATE_PLAYER'; player: NonNullable<GameState['player']> }
  | { type: 'COMPLETE_ONBOARDING'; trait: StolenTrait; clubName: string; clubLevel: 1 | 2 | 3; startCoins: number }
  | { type: 'START_DYNASTY'; player: { name: string; country: Country; city: string; faceIndex: number; position: Position; birthYear: number } }
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
  | { type: 'SKIP_TO_RESULT' }
  | { type: 'COMPLETE_MATCH'; earned: number; repGain: number }
  | { type: 'PURCHASE_ITEM'; item: MarketItem; gambleRoll: number }
  | { type: 'SPEND_COINS'; amount: number }
  | { type: 'EARN_COINS'; amount: number }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'APPLY_CHOICE_EFFECT'; coins: number; reputation: number }
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

    case 'COMPLETE_ONBOARDING': {
      const league = generateLeague(action.clubName, action.clubLevel)
      // Convert any inherited traits to legacy StolenTraits
      const legacyTraits: StolenTrait[] = state.inheritedTraits.map(it => ({
        legendId: `legacy-${it.traitId}`,
        legendName: it.fromPlayerName,
        legendNickname: `${it.legendNickname} (legado)`,
        traitId: it.traitId,
        traitName: it.traitName,
        traitIcon: it.traitIcon,
        maintenanceBar: 100,
        mood: '🔥' as TraitMood,
        stolenYear: state.currentYear,
        weeklyMaintenance: 0,
        isLegacy: true,
      }))
      const allTraits = [...legacyTraits, action.trait]
      const baseState = {
        ...state,
        currentClub: action.clubName,
        clubLevel: action.clubLevel,
        coins: action.startCoins,
        stolenTraits: allTraits,
        currentYear: state.currentYear,
      }
      const weekEvents = generateWeekEvents(baseState as GameState, false)
      return {
        ...baseState,
        screen: 'map',
        stolenFrom: [action.trait.legendId],
        reputation: 5,
        league,
        leagueRound: 0,
        recentForm: [],
        seasonWeek: 1,
        weekEvents,
        matchDayActive: false,
        seasonComplete: false,
      }
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
          if (t.isLegacy) return t
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
        seasonWins: 0,
        seasonDraws: 0,
        seasonLosses: 0,
        league: state.league
          ? state.league.map(t => ({ ...t, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }))
          : generateLeague(state.currentClub, state.clubLevel),
        leagueRound: 0,
        recentForm: [],
        seasonWeek: 1,
        weekEvents: generateWeekEvents({ ...state, currentYear: state.currentYear + 1 } as GameState, false),
        matchDayActive: false,
        seasonComplete: false,
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

    case 'SKIP_TO_RESULT': {
      if (!state.activeMatch) return state
      return {
        ...state,
        activeMatch: {
          ...state.activeMatch,
          momentIndex: state.activeMatch.moments.length - 1,
          phase: 'result',
        },
      }
    }

    case 'COMPLETE_MATCH': {
      const win = state.activeMatch ? state.activeMatch.goals > state.activeMatch.goalsAgainst : false
      const draw = state.activeMatch ? state.activeMatch.goals === state.activeMatch.goalsAgainst : false
      const result: 'W' | 'D' | 'L' = win ? 'W' : draw ? 'D' : 'L'
      const playerGoals = state.activeMatch?.goals ?? 0
      const playerGoalsAgainst = state.activeMatch?.goalsAgainst ?? 0

      // Identify league opponent for this round
      const aiTeams = (state.league ?? []).filter(t => t.id !== 'player')
      const opponentId = aiTeams.length > 0
        ? aiTeams[(state.leagueRound ?? 0) % aiTeams.length]?.id ?? ''
        : ''

      // Update league table
      let updatedLeague = (state.league ?? []).map(t => {
        if (t.id === 'player') {
          return {
            ...t,
            wins: t.wins + (win ? 1 : 0),
            draws: t.draws + (draw ? 1 : 0),
            losses: t.losses + (!win && !draw ? 1 : 0),
            goalsFor: t.goalsFor + playerGoals,
            goalsAgainst: t.goalsAgainst + playerGoalsAgainst,
          }
        }
        if (opponentId && t.id === opponentId) {
          return {
            ...t,
            wins: t.wins + (!win && !draw ? 1 : 0),
            draws: t.draws + (draw ? 1 : 0),
            losses: t.losses + (win ? 1 : 0),
            goalsFor: t.goalsFor + playerGoalsAgainst,
            goalsAgainst: t.goalsAgainst + playerGoals,
          }
        }
        return t
      })
      if (opponentId && updatedLeague.length > 0) {
        updatedLeague = simulateRoundAI(updatedLeague, opponentId)
      }

      const newLeagueRound = (state.leagueRound ?? 0) + 1
      const isSeasonDone = newLeagueRound >= LEAGUE_TOTAL_ROUNDS
      const postMatchState = {
        ...state,
        leagueRound: newLeagueRound,
        stolenTraits: state.stolenTraits,
        currentYear: state.currentYear,
      }
      const nextWeekEvents = isSeasonDone ? [] : generateWeekEvents(postMatchState as GameState, false)

      return {
        ...state,
        coins: state.coins + action.earned,
        reputation: state.reputation + action.repGain,
        matchesPlayed: (state.matchesPlayed ?? 0) + 1,
        seasonWins: (state.seasonWins ?? 0) + (win ? 1 : 0),
        seasonDraws: (state.seasonDraws ?? 0) + (draw ? 1 : 0),
        seasonLosses: (state.seasonLosses ?? 0) + (!win && !draw ? 1 : 0),
        activeMatch: null,
        nextMatchMult: 1.0,
        screen: 'map',
        league: updatedLeague.length > 0 ? updatedLeague : state.league,
        leagueRound: newLeagueRound,
        recentForm: [result, ...(state.recentForm ?? [])].slice(0, 5),
        matchDayActive: false,
        seasonWeek: (state.seasonWeek ?? 0) + 1,
        weekEvents: nextWeekEvents,
        seasonComplete: isSeasonDone,
      }
    }

    case 'PURCHASE_ITEM': {
      const { item, gambleRoll } = action
      let coins = state.coins - item.price
      let reputation = state.reputation
      let stolenTraits = [...state.stolenTraits]
      let nextMatchMult = state.nextMatchMult
      const purchasedItems = [...state.purchasedItems, item.id]

      const eff = item.effect

      if (eff.gamble) {
        const won = gambleRoll < eff.gamble.winChance
        if (won) {
          coins += eff.gamble.win.coins
          reputation += eff.gamble.win.reputation ?? 0
        } else {
          coins += eff.gamble.lose.coins ?? 0
          if (eff.gamble.lose.traitDrain && stolenTraits.length > 0) {
            const idx = Math.floor(gambleRoll * stolenTraits.length) % stolenTraits.length
            stolenTraits = stolenTraits
              .map((t, i) => {
                if (i !== idx) return t
                const newBar = Math.max(0, t.maintenanceBar - eff.gamble!.lose.traitDrain!)
                return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
              })
              .filter(t => t.maintenanceBar > 0)
          }
        }
      } else {
        if (eff.coins) coins += eff.coins
        if (eff.reputation) reputation += eff.reputation
      }

      // Apply non-gamble effects always (even alongside reputation-only on gamble items)
      if (!eff.gamble && eff.reputation) reputation += 0  // already done above
      // Flat reputation on gamble items (like aposta-partida losing reputation either way)
      if (eff.gamble && eff.reputation) reputation += eff.reputation

      if (eff.nextMatchMult) nextMatchMult = Math.max(nextMatchMult, eff.nextMatchMult)

      if (eff.traitBoostAll && stolenTraits.length > 0) {
        stolenTraits = stolenTraits.map(t => {
          const newBar = Math.min(100, t.maintenanceBar + eff.traitBoostAll!)
          return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
        })
      }

      if (eff.traitBoostRandom && stolenTraits.length > 0) {
        const idx = Math.floor(gambleRoll * stolenTraits.length) % stolenTraits.length
        stolenTraits = stolenTraits.map((t, i) => {
          if (i !== idx) return t
          const newBar = Math.min(100, t.maintenanceBar + eff.traitBoostRandom!)
          return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
        })
      }

      if (eff.traitDrainRandom && stolenTraits.length > 0) {
        const idx = Math.floor((1 - gambleRoll) * stolenTraits.length) % stolenTraits.length
        stolenTraits = stolenTraits
          .map((t, i) => {
            if (i !== idx) return t
            const newBar = Math.max(0, t.maintenanceBar - eff.traitDrainRandom!)
            return { ...t, maintenanceBar: newBar, mood: moodFromBar(newBar) }
          })
          .filter(t => t.maintenanceBar > 0)
      }

      return {
        ...state,
        coins: Math.max(0, coins),
        reputation: Math.max(0, reputation),
        stolenTraits,
        nextMatchMult,
        purchasedItems,
      }
    }

    case 'START_DYNASTY': {
      // Pick the best non-legacy stolen trait to pass down
      const nonLegacy = state.stolenTraits.filter(t => !t.isLegacy)
      const bestTrait = nonLegacy.sort((a, b) => b.maintenanceBar - a.maintenanceBar)[0]
      const newInherited: InheritedTrait | null = bestTrait ? {
        traitId: bestTrait.traitId,
        traitName: bestTrait.traitName,
        traitIcon: bestTrait.traitIcon,
        legendNickname: bestTrait.legendNickname,
        fromGeneration: state.generation,
        fromPlayerName: state.player?.name ?? 'Seu pai',
      } : null
      const inheritedTraits = newInherited
        ? [...state.inheritedTraits, newInherited]
        : state.inheritedTraits
      return {
        ...INITIAL_STATE,
        screen: 'creation',
        generation: state.generation + 1,
        inheritedTraits,
        player: action.player,
        currentYear: 1992,
        coins: Math.floor(state.coins * 0.3),
      }
    }

    case 'ADVANCE_WEEK': {
      const preMatchEvents = generateWeekEvents(state, true)
      return {
        ...state,
        matchDayActive: true,
        weekEvents: preMatchEvents,
        seasonWeek: (state.seasonWeek ?? 0) + 1,
      }
    }

    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.amount) }

    case 'EARN_COINS':
      return { ...state, coins: state.coins + action.amount }

    case 'APPLY_CHOICE_EFFECT':
      return {
        ...state,
        coins: Math.max(0, state.coins + action.coins),
        reputation: Math.max(0, state.reputation + action.reputation),
      }

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
        const safeScreen = ['match', 'steal-mission'].includes(parsed.screen) ? 'intro' : parsed.screen
        return {
          ...init,
          ...parsed,
          screen: safeScreen,
          activeMatch: null,
          clubLevel: parsed.clubLevel ?? 1,
          seasonWins: parsed.seasonWins ?? 0,
          seasonDraws: parsed.seasonDraws ?? 0,
          seasonLosses: parsed.seasonLosses ?? 0,
          pendingEvents: parsed.pendingEvents ?? [],
          pendingMatchType: parsed.pendingMatchType ?? 'amistoso',
          purchasedItems: parsed.purchasedItems ?? [],
          nextMatchMult: parsed.nextMatchMult ?? 1.0,
          league: parsed.league ?? null,
          leagueRound: parsed.leagueRound ?? 0,
          recentForm: parsed.recentForm ?? [],
          seasonWeek: parsed.seasonWeek ?? 1,
          weekEvents: parsed.weekEvents ?? [],
          matchDayActive: parsed.matchDayActive ?? false,
          seasonComplete: parsed.seasonComplete ?? false,
          generation: parsed.generation ?? 1,
          inheritedTraits: parsed.inheritedTraits ?? [],
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
