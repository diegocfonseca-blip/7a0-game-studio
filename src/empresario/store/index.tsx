import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Screen, Client, ClubOffer } from '../types'
import { getLegendById, getCurrentRating, getMarketValue } from '../data/legends'
import { generateWeeklyEvent } from '../data/events'
import { CLUBS } from '../data/clubs'

const INITIAL_STATE: GameState = {
  screen: 'intro',
  year: 1993,
  week: 1,
  money: 5000,
  reputation: 10,
  clients: [],
  pendingOffers: [],
  events: [],
  officeLevel: 1,
  scoutSlots: 3,
  actionSlots: 3,
  actionsUsed: 0,
  weeklyExpenses: 0,
  totalEarned: 0,
  totalDeals: 0,
  rivalAgents: [
    { id: 'rival1', name: 'João Mendes', budget: 20000, reputation: 25, clients: [] },
    { id: 'rival2', name: 'Carlos Primo', budget: 35000, reputation: 40, clients: [] },
    { id: 'rival3', name: 'Sérgio Laranjo', budget: 50000, reputation: 55, clients: ['romario'] },
  ],
  seenLegendIds: [],
  purchasedUpgrades: [],
  narrative: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'START_GAME'; playerName: string }
  | { type: 'SIGN_CLIENT'; legendId: string; commissionRate: number }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ACCEPT_OFFER'; offerId: string; finalCommission: number }
  | { type: 'REJECT_OFFER'; offerId: string }
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceIndex: 0 | 1 }
  | { type: 'PURCHASE_UPGRADE'; upgradeId: string; cost: number; effect: string }
  | { type: 'MARK_LEGEND_SEEN'; legendId: string }

function generateClubOffer(client: Client, year: number): ClubOffer | null {
  const rating = getCurrentRating(getLegendById(client.legendId)!, year)
  if (rating < 60 && Math.random() > 0.3) return null
  if (rating < 75 && Math.random() > 0.6) return null

  const value = getMarketValue(getLegendById(client.legendId)!, year)
  if (value < 50000) return null

  const eligibleClubs = CLUBS.filter(c => {
    if (rating >= 85) return c.tier === 1
    if (rating >= 75) return c.tier <= 2
    return c.tier >= 2
  })

  if (eligibleClubs.length === 0) return null

  const club = eligibleClubs[Math.floor(Math.random() * eligibleClubs.length)]
  const offerAmount = Math.round(value * (0.8 + Math.random() * 0.6) / 1000) * 1000
  const salary = Math.round(offerAmount * 0.08 / 12 / 1000) * 1000

  return {
    id: `offer-${Date.now()}-${Math.random()}`,
    clubName: club.name,
    clubCountry: club.country,
    clientId: client.legendId,
    offerAmount,
    salary,
    contractYears: 3 + Math.floor(Math.random() * 3),
    expiresInWeeks: 3 + Math.floor(Math.random() * 4),
  }
}

function empresarioReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'START_GAME':
      return {
        ...INITIAL_STATE,
        screen: 'dashboard',
        narrative: [`${action.playerName} acordou em 1993. A vida nunca mais seria a mesma.`],
      }

    case 'SIGN_CLIENT': {
      const legend = getLegendById(action.legendId)
      if (!legend) return state

      const currentRating = getCurrentRating(legend, state.year)
      const currentValue = getMarketValue(legend, state.year)

      const newClient: Client = {
        legendId: legend.id,
        name: legend.name,
        nickname: legend.nickname,
        position: legend.position,
        nationality: legend.nationality,
        birthYear: legend.birthYear,
        peakYearStart: legend.peakYearStart,
        peakYearEnd: legend.peakYearEnd,
        truePotential: legend.truePotential,
        currentRating,
        personality: legend.personality,
        monthlyFee: legend.monthlyFee,
        futureKnowledge: legend.futureKnowledge,
        commissionRate: action.commissionRate,
        happiness: 75,
        currentValue,
        signedYear: state.year,
        contractClub: legend.club,
        contractSalary: legend.monthlyFee * 10,
        contractExpiresYear: state.year + 2,
        rivalOffers: 0,
      }

      const weeklyExpenses = state.clients.reduce((sum, c) => sum + c.monthlyFee, 0) / 4 + legend.monthlyFee / 4

      return {
        ...state,
        money: state.money - legend.signingFee,
        clients: [...state.clients, newClient],
        weeklyExpenses,
        actionsUsed: state.actionsUsed + 1,
        seenLegendIds: [...state.seenLegendIds, action.legendId],
        narrative: [...state.narrative, `Você assinou ${legend.nickname} por ${action.commissionRate}% de comissão.`],
      }
    }

    case 'ADVANCE_WEEK': {
      const newWeek = state.week + 1
      const newYear = newWeek > 52 ? state.year + 1 : state.year
      const actualWeek = newWeek > 52 ? 1 : newWeek

      // Update clients ratings and values
      const updatedClients = state.clients.map(client => {
        const legend = getLegendById(client.legendId)
        if (!legend) return client
        const newRating = getCurrentRating(legend, newYear)
        const newValue = getMarketValue(legend, newYear)

        let happiness = client.happiness
        if (client.personality === 'ambicioso' && newRating > 80 && !client.contractClub?.includes('Milan') && !client.contractClub?.includes('Madrid')) {
          happiness = Math.max(40, happiness - 2)
        }

        return { ...client, currentRating: newRating, currentValue: newValue, happiness }
      })

      // Weekly expenses
      const weeklyExpense = updatedClients.reduce((sum, c) => sum + c.monthlyFee / 4, 0)
      const newMoney = state.money - weeklyExpense

      // Maybe generate club offer
      const newOffers = [...state.pendingOffers.map(o => ({ ...o, expiresInWeeks: o.expiresInWeeks - 1 }))]
        .filter(o => o.expiresInWeeks > 0)

      if (updatedClients.length > 0 && Math.random() > 0.65) {
        const eligibleClient = updatedClients.filter(c => c.currentRating >= 60)[
          Math.floor(Math.random() * updatedClients.filter(c => c.currentRating >= 60).length)
        ]
        if (eligibleClient) {
          const offer = generateClubOffer(eligibleClient, newYear)
          if (offer && !newOffers.find(o => o.clientId === eligibleClient.legendId)) {
            newOffers.push(offer)
          }
        }
      }

      // Maybe generate event
      const clientIds = updatedClients.map(c => c.legendId)
      const newEvent = generateWeeklyEvent(newYear, actualWeek, clientIds)
      const newEvents = newEvent
        ? [...state.events.filter(e => e.resolved), newEvent]
        : state.events

      return {
        ...state,
        week: actualWeek,
        year: newYear,
        money: Math.max(0, newMoney),
        clients: updatedClients,
        pendingOffers: newOffers,
        events: newEvents,
        actionsUsed: 0,
        weeklyExpenses: weeklyExpense,
      }
    }

    case 'ACCEPT_OFFER': {
      const offer = state.pendingOffers.find(o => o.id === action.offerId)
      if (!offer) return state

      const commission = Math.round(offer.offerAmount * action.finalCommission / 100)
      const client = state.clients.find(c => c.legendId === offer.clientId)

      return {
        ...state,
        money: state.money + commission,
        totalEarned: state.totalEarned + commission,
        totalDeals: state.totalDeals + 1,
        pendingOffers: state.pendingOffers.filter(o => o.id !== action.offerId),
        clients: state.clients.map(c =>
          c.legendId === offer.clientId
            ? { ...c, contractClub: offer.clubName, contractSalary: offer.salary, contractExpiresYear: state.year + offer.contractYears }
            : c
        ),
        narrative: [
          ...state.narrative,
          `NEGÓCIO FECHADO! ${client?.nickname} → ${offer.clubName} por R$${offer.offerAmount.toLocaleString('pt-BR')}. Sua comissão: R$${commission.toLocaleString('pt-BR')} (${action.finalCommission}%)`
        ],
      }
    }

    case 'REJECT_OFFER':
      return {
        ...state,
        pendingOffers: state.pendingOffers.filter(o => o.id !== action.offerId),
      }

    case 'RESOLVE_EVENT': {
      const event = state.events.find(e => e.id === action.eventId)
      if (!event?.choices) return state

      const effect = event.choices[action.choiceIndex].effect
      const updatedClients = state.clients.map(c => {
        if (c.legendId !== event.clientId) return c
        return {
          ...c,
          happiness: Math.min(100, Math.max(0, c.happiness + (effect.happiness ?? 0))),
          currentValue: Math.min(999999999, c.currentValue * (1 + (effect.clientValue ?? 0) / 100)),
        }
      })

      return {
        ...state,
        money: state.money + (effect.money ?? 0),
        reputation: Math.min(100, Math.max(0, state.reputation + (effect.reputation ?? 0))),
        clients: updatedClients,
        events: state.events.map(e =>
          e.id === action.eventId ? { ...e, resolved: true, chosenIndex: action.choiceIndex } : e
        ),
        narrative: effect.narrative ? [...state.narrative, effect.narrative] : state.narrative,
      }
    }

    case 'PURCHASE_UPGRADE':
      return {
        ...state,
        money: state.money - action.cost,
        purchasedUpgrades: [...state.purchasedUpgrades, action.upgradeId],
        scoutSlots: action.upgradeId.startsWith('scout') ? state.scoutSlots + 2 : state.scoutSlots,
        narrative: [...state.narrative, `Investimento: ${action.effect}`],
      }

    case 'MARK_LEGEND_SEEN':
      return {
        ...state,
        seenLegendIds: state.seenLegendIds.includes(action.legendId)
          ? state.seenLegendIds
          : [...state.seenLegendIds, action.legendId],
      }

    default:
      return state
  }
}

const EmpresarioContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function EmpresarioProvider({ children }: { children: ReactNode }) {
  const saved = localStorage.getItem('empresario-v1')
  const initial = saved ? { ...INITIAL_STATE, ...JSON.parse(saved), screen: 'intro' as Screen } : INITIAL_STATE

  const [state, dispatch] = useReducer(empresarioReducer, initial)

  // Persist
  if (state.screen !== 'intro' && state.screen !== 'accident') {
    localStorage.setItem('empresario-v1', JSON.stringify(state))
  }

  return (
    <EmpresarioContext.Provider value={{ state, dispatch }}>
      {children}
    </EmpresarioContext.Provider>
  )
}

export function useEmpresario() {
  const ctx = useContext(EmpresarioContext)
  if (!ctx) throw new Error('useEmpresario must be used within EmpresarioProvider')
  return ctx
}
