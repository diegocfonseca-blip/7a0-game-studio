import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Screen, Client, ClubOffer, Bid, OwnedClub } from '../types'
import { getLegendById, getCurrentRating, getMarketValue, getCurrentStatus, LEGENDS } from '../data/legends'
import { generateWeeklyEvent, generateAmbientNews } from '../data/events'
import type { ClientLite } from '../data/events'
import { CLUBS, NEMESIS } from '../data/clubs'
import { GLORIES, genericGlory } from '../data/glory'

const INITIAL_STATE: GameState = {
  screen: 'intro',
  year: 1993,
  week: 1,
  money: 8000,
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
  rejectionCounts: {},
  lostLegends: [],
  nemesisTaken: [],
  nemesisShown: false,
  nemesisAlert: null,
  negotiationLog: [],
  ownedClub: null,
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
  | { type: 'LEGEND_REJECTED'; legendId: string; lost: boolean }
  | { type: 'DISMISS_NEMESIS_ALERT' }
  | { type: 'ESCALATE_BID'; offerId: string }
  | { type: 'BUY_CLUB'; clubId: string; name: string; division: number; price: number; fans: number }
  | { type: 'PLACE_CLIENT_IN_CLUB'; legendId: string }
  | { type: 'NEW_GAME' }

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

  const salaryOf = (amt: number) => Math.round(amt * 0.08 / 12 / 1000) * 1000

  // ── BIDDING WAR: stars attract multiple clubs fighting over them ──
  const isWar = rating >= 80 && eligibleClubs.length >= 2 && Math.random() < 0.6
  if (isWar) {
    const shuffled = [...eligibleClubs].sort(() => Math.random() - 0.5)
    const count = Math.min(3, 2 + Math.floor(Math.random() * 2))
    const chosen = shuffled.slice(0, count)
    const bidders: Bid[] = chosen
      .map(c => ({
        clubName: c.name,
        clubCountry: c.country,
        amount: Math.round(value * (0.75 + Math.random() * 0.7) / 1000) * 1000,
      }))
      .sort((a, b) => b.amount - a.amount)
    const top = bidders[0]
    return {
      id: `offer-${Date.now()}-${Math.random()}`,
      clubName: top.clubName,
      clubCountry: top.clubCountry,
      clientId: client.legendId,
      offerAmount: top.amount,
      salary: salaryOf(top.amount),
      contractYears: 3 + Math.floor(Math.random() * 3),
      expiresInWeeks: 3 + Math.floor(Math.random() * 3),
      isWar: true,
      bidders,
      escalations: 0,
    }
  }

  const club = eligibleClubs[Math.floor(Math.random() * eligibleClubs.length)]
  const offerAmount = Math.round(value * (0.8 + Math.random() * 0.6) / 1000) * 1000

  return {
    id: `offer-${Date.now()}-${Math.random()}`,
    clubName: club.name,
    clubCountry: club.country,
    clientId: client.legendId,
    offerAmount,
    salary: salaryOf(offerAmount),
    contractYears: 3 + Math.floor(Math.random() * 3),
    expiresInWeeks: 3 + Math.floor(Math.random() * 4),
  }
}

// The nemesis snatches a hot prospect you haven't signed yet.
function nemesisTryGrab(state: GameState, year: number): string | null {
  const taken = new Set([...state.nemesisTaken, ...state.lostLegends, ...state.clients.map(c => c.legendId)])
  const targets = LEGENDS
    .filter(l =>
      l.truePotential >= 88 &&
      year >= l.emergenceYear - 1 &&
      l.birthYear <= year - 12 &&
      !taken.has(l.id)
    )
    .sort((a, b) => b.truePotential - a.truePotential)
  if (targets.length === 0) return null
  // He goes for the best available gem. Higher chance as you get richer (envy).
  const envy = state.totalEarned > 1000000 ? 0.22 : state.clients.length >= 2 ? 0.16 : 0.1
  if (Math.random() > envy) return null
  return targets[0].id
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
        status: getCurrentStatus(legend, state.year),
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
      const upfront = legend.signingFee + legend.luva

      return {
        ...state,
        money: state.money - upfront,
        clients: [...state.clients, newClient],
        weeklyExpenses,
        actionsUsed: state.actionsUsed + 1,
        seenLegendIds: [...state.seenLegendIds, action.legendId],
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `📝 Você agenciou ${legend.nickname} (${action.commissionRate}% de comissão)` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative, `✍️ Você assinou ${legend.nickname} por ${action.commissionRate}% de comissão + R$${legend.luva.toLocaleString('pt-BR')} de luva.`],
      }
    }

    case 'LEGEND_REJECTED': {
      const count = (state.rejectionCounts[action.legendId] ?? 0) + 1
      const legend = getLegendById(action.legendId)
      return {
        ...state,
        rejectionCounts: { ...state.rejectionCounts, [action.legendId]: count },
        lostLegends: action.lost && !state.lostLegends.includes(action.legendId)
          ? [...state.lostLegends, action.legendId]
          : state.lostLegends,
        narrative: action.lost
          ? [...state.narrative, `💔 Você PERDEU ${legend?.nickname ?? 'um talento'} pra sempre — recusou sua proposta duas vezes.`]
          : state.narrative,
      }
    }

    case 'ADVANCE_WEEK': {
      const newWeek = state.week + 1
      const yearRolled = newWeek > 52
      const newYear = yearRolled ? state.year + 1 : state.year
      const actualWeek = yearRolled ? 1 : newWeek
      const extraNarrative: string[] = []

      // Update clients ratings and values (+ glory moments on year rollover)
      const updatedClients = state.clients.map(client => {
        const legend = getLegendById(client.legendId)
        if (!legend) return client
        const newRating = getCurrentRating(legend, newYear)
        let newValue = getMarketValue(legend, newYear)
        const newStatus = getCurrentStatus(legend, newYear)

        let happiness = client.happiness
        if (client.personality === 'ambicioso' && newRating > 80 && !client.contractClub?.includes('Milan') && !client.contractClub?.includes('Madrid')) {
          happiness = Math.max(40, happiness - 2)
        }
        if (client.commissionRate > 20 && newRating > 70) {
          happiness = Math.max(20, happiness - 1)
        }

        // 🏆 GLORY: when a milestone year arrives, the world sees what you saw
        if (yearRolled) {
          const moment = (GLORIES[client.legendId] ?? []).find(g => g.year === newYear)
          if (moment) {
            newValue = Math.round(newValue * moment.valueBoost)
            happiness = Math.min(100, happiness + 12)
            extraNarrative.push(`🏆 ${client.nickname.toUpperCase()} — ${moment.title.toUpperCase()}! ${moment.text}`)
          } else if (newYear === legend.peakYearStart) {
            const g = genericGlory(newYear, client.nickname)
            newValue = Math.round(newValue * g.valueBoost)
            happiness = Math.min(100, happiness + 8)
            extraNarrative.push(`🏆 ${g.text}`)
          }
        }

        return { ...client, currentRating: newRating, currentValue: newValue, status: newStatus, happiness }
      })

      // Weekly expenses
      const weeklyExpense = updatedClients.reduce((sum, c) => sum + c.monthlyFee / 4, 0)
      let runningMoney = state.money - weeklyExpense

      // Club offers (tick down + maybe generate)
      const newOffers = [...state.pendingOffers.map(o => ({ ...o, expiresInWeeks: o.expiresInWeeks - 1 }))]
        .filter(o => o.expiresInWeeks > 0)

      if (updatedClients.length > 0 && Math.random() > 0.6) {
        const eligible = updatedClients.filter(c => c.currentRating >= 60)
        const eligibleClient = eligible[Math.floor(Math.random() * eligible.length)]
        if (eligibleClient) {
          const offer = generateClubOffer(eligibleClient, newYear)
          if (offer && !newOffers.find(o => o.clientId === eligibleClient.legendId)) {
            newOffers.push(offer)
          }
        }
      }

      // 🔥 NEMESIS grabs a hot prospect you slept on
      let nemesisTaken = state.nemesisTaken
      let nemesisAlert = state.nemesisAlert
      let nemesisShown = state.nemesisShown
      let negotiationLog = state.negotiationLog
      const grabbed = nemesisTryGrab(state, newYear)
      if (grabbed) {
        const legend = getLegendById(grabbed)!
        nemesisTaken = [...state.nemesisTaken, grabbed]
        const isFirst = !state.nemesisShown
        nemesisShown = true
        nemesisAlert = {
          legendId: grabbed,
          legendNickname: legend.nickname,
          story: isFirst ? NEMESIS.story : `${NEMESIS.name} chegou primeiro de novo e fechou com ${legend.name}. "Mais um que era pra ser seu", ele provoca.`,
          isFirst,
        }
        negotiationLog = [{ who: 'rival' as const, year: newYear, text: `😈 Sérgio Cambalhota agenciou ${legend.name} antes de você!` }, ...negotiationLog].slice(0, 30)
        extraNarrative.push(`😈 ${NEMESIS.name} roubou ${legend.nickname} de você!`)
      }

      // 🏟️ OWNED CLUB: weekly income + match sim
      let ownedClub = state.ownedClub
      if (ownedClub) {
        runningMoney += ownedClub.cashPerWeek
        // a match every 2 weeks
        if (newWeek % 2 === 0) {
          const placed = updatedClients.filter(c => ownedClub!.placedClientIds.includes(c.legendId))
          const squadStr = placed.length
            ? placed.reduce((s, c) => s + c.currentRating, 0) / placed.length
            : 35
          const roll = Math.random() * 100
          const winChance = Math.min(85, 30 + (squadStr - 40))
          let result: string
          let wins = ownedClub.seasonWins, draws = ownedClub.seasonDraws, losses = ownedClub.seasonLosses
          if (roll < winChance) { result = 'Vitória 🟢'; wins++ }
          else if (roll < winChance + 20) { result = 'Empate 🟡'; draws++ }
          else { result = 'Derrota 🔴'; losses++ }
          ownedClub = { ...ownedClub, seasonWins: wins, seasonDraws: draws, seasonLosses: losses, lastResult: result }
        }
        // promotion on year rollover if strong season
        if (yearRolled) {
          const pts = ownedClub.seasonWins * 3 + ownedClub.seasonDraws
          if (pts >= 40 && ownedClub.division > 1) {
            ownedClub = { ...ownedClub, division: ownedClub.division - 1, fans: Math.round(ownedClub.fans * 1.6), cashPerWeek: Math.round(ownedClub.cashPerWeek * 1.5) }
            extraNarrative.push(`🏟️ ${ownedClub.name} subiu para a ${ownedClub.division}ª divisão! A torcida explode.`)
          } else if (pts < 18 && ownedClub.division < 4) {
            ownedClub = { ...ownedClub, division: ownedClub.division + 1, fans: Math.round(ownedClub.fans * 0.7) }
            extraNarrative.push(`🏟️ ${ownedClub.name} foi rebaixado para a ${ownedClub.division}ª divisão. Aperto no caixa.`)
          }
          ownedClub = { ...ownedClub, seasonWins: 0, seasonDraws: 0, seasonLosses: 0 }
        }
      }

      // Weekly event (personalized with the player's name)
      const clientsLite: ClientLite[] = updatedClients.map(c => ({
        legendId: c.legendId, nickname: c.nickname, name: c.name, position: c.position, currentRating: c.currentRating,
        status: c.status, personality: c.personality, nationality: c.nationality,
        birthYear: c.birthYear, currentValue: c.currentValue, peakYearStart: c.peakYearStart,
        contractClub: c.contractClub,
      }))
      const newEvent = generateWeeklyEvent(newYear, actualWeek, clientsLite, state.purchasedUpgrades)
      const newEvents = newEvent
        ? [...state.events.filter(e => e.resolved), newEvent]
        : state.events

      // Ambient news — rich, contextual, non-repeating. 1–2 fresh lines/week.
      const recentNews = [...state.narrative.slice(-10), ...extraNarrative]
      const n1 = generateAmbientNews(newYear, clientsLite, recentNews)
      if (n1) extraNarrative.push(n1)
      if (Math.random() < 0.5) {
        const n2 = generateAmbientNews(newYear, clientsLite, [...recentNews, ...(n1 ? [n1] : [])])
        if (n2 && n2 !== n1) extraNarrative.push(n2)
      }

      return {
        ...state,
        week: actualWeek,
        year: newYear,
        money: Math.max(0, runningMoney),
        clients: updatedClients,
        pendingOffers: newOffers,
        events: newEvents,
        actionsUsed: 0,
        weeklyExpenses: weeklyExpense,
        nemesisTaken,
        nemesisAlert,
        nemesisShown,
        negotiationLog,
        ownedClub,
        lostLegends: grabbed ? [...state.lostLegends, grabbed] : state.lostLegends,
        narrative: [...state.narrative, ...extraNarrative],
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
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `✅ ${client?.nickname} → ${offer.clubName} por R$${offer.offerAmount.toLocaleString('pt-BR')} (sua comissão R$${commission.toLocaleString('pt-BR')})` }, ...state.negotiationLog].slice(0, 30),
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

    case 'PURCHASE_UPGRADE': {
      const isScout = action.upgradeId.startsWith('scout')
      const repBoost = action.upgradeId === 'escritorio-sp' ? 12 : isScout ? 3 : 0
      return {
        ...state,
        money: state.money - action.cost,
        purchasedUpgrades: [...state.purchasedUpgrades, action.upgradeId],
        scoutSlots: isScout ? state.scoutSlots + 2 : state.scoutSlots,
        reputation: Math.min(100, state.reputation + repBoost),
        narrative: [
          ...state.narrative,
          isScout
            ? `🔭 Novo olheiro contratado! ${action.effect}`
            : `💼 Investimento: ${action.effect}`,
        ],
      }
    }

    case 'MARK_LEGEND_SEEN':
      return {
        ...state,
        seenLegendIds: state.seenLegendIds.includes(action.legendId)
          ? state.seenLegendIds
          : [...state.seenLegendIds, action.legendId],
      }

    case 'NEW_GAME':
      localStorage.removeItem('empresario-v1')
      return { ...INITIAL_STATE, screen: 'intro' }

    case 'DISMISS_NEMESIS_ALERT':
      return { ...state, nemesisAlert: null }

    case 'ESCALATE_BID': {
      const offer = state.pendingOffers.find(o => o.id === action.offerId)
      if (!offer || !offer.isWar || !offer.bidders) return state

      // A rival club ups the bid — but each round risks a bidder walking away
      const walked = Math.random() < 0.25 && offer.bidders.length > 1
      let bidders = offer.bidders
      if (walked) bidders = bidders.slice(0, -1)

      const bump = 1.12 + Math.random() * 0.22
      const newTop = Math.round(offer.offerAmount * bump / 1000) * 1000
      bidders = [{ ...bidders[0], amount: newTop }, ...bidders.slice(1)]

      const newExpire = offer.expiresInWeeks - 1
      if (newExpire <= 0) {
        // bidders got tired — deal collapses to current top, forced to decide now is gone
        return {
          ...state,
          pendingOffers: state.pendingOffers.filter(o => o.id !== action.offerId),
          narrative: [...state.narrative, `⌛ Os clubes cansaram de esperar e a negociação por ${getLegendById(offer.clientId)?.nickname ?? ''} esfriou.`],
        }
      }

      return {
        ...state,
        pendingOffers: state.pendingOffers.map(o =>
          o.id === action.offerId
            ? { ...o, offerAmount: newTop, salary: Math.round(newTop * 0.08 / 12 / 1000) * 1000, bidders, escalations: (o.escalations ?? 0) + 1, expiresInWeeks: newExpire }
            : o
        ),
        narrative: [...state.narrative, walked
          ? `💸 Um clube desistiu, mas ${bidders[0].clubName} subiu pra R$${newTop.toLocaleString('pt-BR')}!`
          : `💸 ${bidders[0].clubName} cobriu e subiu pra R$${newTop.toLocaleString('pt-BR')}!`],
      }
    }

    case 'BUY_CLUB': {
      if (state.money < action.price || state.ownedClub) return state
      const club: OwnedClub = {
        id: action.clubId,
        name: action.name,
        division: action.division,
        fans: action.fans,
        leaguePosition: 10,
        cashPerWeek: Math.round(action.fans * 0.8),
        placedClientIds: [],
        lastResult: '—',
        seasonWins: 0, seasonDraws: 0, seasonLosses: 0,
      }
      return {
        ...state,
        money: state.money - action.price,
        ownedClub: club,
        narrative: [...state.narrative, `🏟️ VOCÊ COMPROU O ${action.name.toUpperCase()}! Agora é dono de um clube — o começo do império.`],
      }
    }

    case 'PLACE_CLIENT_IN_CLUB': {
      if (!state.ownedClub) return state
      const already = state.ownedClub.placedClientIds.includes(action.legendId)
      const placedClientIds = already
        ? state.ownedClub.placedClientIds.filter(id => id !== action.legendId)
        : [...state.ownedClub.placedClientIds, action.legendId]
      return {
        ...state,
        ownedClub: { ...state.ownedClub, placedClientIds },
        clients: state.clients.map(c =>
          c.legendId === action.legendId && !already
            ? { ...c, contractClub: state.ownedClub!.name, happiness: Math.min(100, c.happiness + 6) }
            : c
        ),
      }
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
  let initial: GameState = INITIAL_STATE
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const hasProgress = (parsed.clients?.length ?? 0) > 0 || (parsed.week ?? 1) > 1 ||
        (parsed.year ?? 1993) > 1993 || (parsed.totalDeals ?? 0) > 0
      // Resume an in-progress game straight at the dashboard so a refresh
      // never throws the player back to the intro (and never wipes the save).
      initial = { ...INITIAL_STATE, ...parsed, nemesisAlert: null, screen: hasProgress ? 'dashboard' : 'intro' }
    } catch {
      initial = INITIAL_STATE
    }
  }

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
