import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Screen, Client, ClubOffer, Bid, OwnedClub } from '../types'
import { getLegendById, getCurrentRating, getMarketValue, getCurrentStatus, LEGENDS } from '../data/legends'
import { generateWeeklyEvent, generateAmbientNews } from '../data/events'
import type { ClientLite } from '../data/events'
import { CLUBS, NEMESIS } from '../data/clubs'
import { GLORIES, genericGlory } from '../data/glory'
import { WORLD_CUP_YEARS } from '../data/career'

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
    { id: 'rival1', name: 'João Mendes', budget: 20000, reputation: 25, clients: [], wealth: 40000 },
    { id: 'rival2', name: 'Carlos Primo', budget: 35000, reputation: 40, clients: [], wealth: 180000 },
    { id: 'rival3', name: 'Sérgio Cambalhota', budget: 50000, reputation: 55, clients: [], wealth: 600000 },
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
  suspicion: 0,
  clubRelations: {},
  awards: 0,
  narrative: [],
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'START_GAME'; playerName: string }
  | { type: 'SIGN_CLIENT'; legendId: string; commissionRate: number; contractYears: number }
  | { type: 'RENEW_CLIENT'; legendId: string; commissionRate: number; contractYears: number }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ACCEPT_OFFER'; offerId: string; clubName: string; amount: number; clubLuva: number }
  | { type: 'REJECT_OFFER'; offerId: string }
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceIndex: 0 | 1 }
  | { type: 'PURCHASE_UPGRADE'; upgradeId: string; cost: number; effect: string }
  | { type: 'MARK_LEGEND_SEEN'; legendId: string }
  | { type: 'LEGEND_REJECTED'; legendId: string; lost: boolean }
  | { type: 'DISMISS_NEMESIS_ALERT' }
  | { type: 'ESCALATE_BID'; offerId: string }
  | { type: 'HAGGLE_OFFER'; offerId: string }
  | { type: 'BUY_CLUB'; clubId: string; name: string; division: number; price: number; fans: number }
  | { type: 'PLACE_CLIENT_IN_CLUB'; legendId: string }
  | { type: 'DIRTY_ACTION'; kind: 'maquiar' | 'imprensa' | 'arbitro' }
  | { type: 'NEW_GAME' }

function generateClubOffer(client: Client, year: number, clubRelations: Record<string, number> = {}): ClubOffer | null {
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
  // each club pays a different kickback (luva); clubs that LIKE you pay more
  const luvaOf = (amt: number, clubName: string) => {
    const rel = clubRelations[clubName] ?? 0
    const relBonus = 1 + (rel / 100) * 0.5 // -50%..+50% based on relationship
    return Math.round(amt * (0.02 + Math.random() * 0.07) * relBonus / 1000) * 1000
  }

  // Market heat: the hotter the player, the more clubs fight (and likely more come)
  const interest: 'alto' | 'medio' | 'baixo' = rating >= 82 ? 'alto' : rating >= 72 ? 'medio' : 'baixo'

  // ── BIDDING WAR: hot players attract several clubs at once ──
  const isWar = interest === 'alto' && eligibleClubs.length >= 2
  if (isWar) {
    const shuffled = [...eligibleClubs].sort(() => Math.random() - 0.5)
    const count = Math.min(3, 2 + Math.floor(Math.random() * 2))
    const chosen = shuffled.slice(0, count)
    const bidders: Bid[] = chosen
      .map(c => {
        const amount = Math.round(value * (0.75 + Math.random() * 0.7) / 1000) * 1000
        return { clubName: c.name, clubCountry: c.country, amount, luva: luvaOf(amount, c.name) }
      })
      .sort((a, b) => b.amount - a.amount)
    const top = bidders[0]
    return {
      id: `offer-${Date.now()}-${Math.random()}`,
      clubName: top.clubName,
      clubCountry: top.clubCountry,
      clientId: client.legendId,
      offerAmount: top.amount,
      clubLuva: top.luva,
      salary: salaryOf(top.amount),
      contractYears: 3 + Math.floor(Math.random() * 3),
      expiresInWeeks: 3 + Math.floor(Math.random() * 3),
      interest,
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
    clubLuva: luvaOf(offerAmount, club.name),
    salary: salaryOf(offerAmount),
    contractYears: 3 + Math.floor(Math.random() * 3),
    expiresInWeeks: 3 + Math.floor(Math.random() * 4),
    interest,
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
        repContractYears: action.contractYears,
        repExpiresYear: state.year + action.contractYears,
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
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `📝 Você agenciou ${legend.nickname} (${action.commissionRate}% · ${action.contractYears} anos)` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative, `✍️ Você assinou ${legend.nickname}: ${action.commissionRate}% de comissão, contrato de ${action.contractYears} anos + R$${legend.luva.toLocaleString('pt-BR')} de luva.`],
      }
    }

    case 'RENEW_CLIENT': {
      return {
        ...state,
        clients: state.clients.map(c =>
          c.legendId === action.legendId
            ? {
                ...c,
                commissionRate: action.commissionRate,
                repContractYears: action.contractYears,
                repExpiresYear: state.year + action.contractYears,
                happiness: Math.min(100, c.happiness + 6),
              }
            : c
        ),
        narrative: [...state.narrative, `✅ Você renovou com ${state.clients.find(c => c.legendId === action.legendId)?.nickname} por mais ${action.contractYears} anos (${action.commissionRate}%).`],
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

          // 🌍 WORLD CUP year: a good call-up explodes the player's value
          if (WORLD_CUP_YEARS.includes(newYear) && newRating >= 72 && Math.random() < 0.7) {
            newValue = Math.round(newValue * 1.3)
            happiness = Math.min(100, happiness + 10)
            extraNarrative.push(`🌍 ${client.nickname} foi convocado e brilhou na Copa de ${newYear}! O valor disparou e o mundo todo quer ele.`)
          }
        }

        return { ...client, currentRating: newRating, currentValue: newValue, status: newStatus, happiness }
      })

      // ⏳ REP CONTRACTS expiring + ⚰️ RETIREMENT (age catches everyone)
      let activeClients = updatedClients
      if (yearRolled) {
        const kept: typeof updatedClients = []
        for (const c of updatedClients) {
          const age = newYear - c.birthYear
          const expired = c.repExpiresYear !== undefined && newYear > c.repExpiresYear
          const retires = age >= 38 || (age >= 35 && c.currentRating < 68)
          if (retires) {
            extraNarrative.push(`⚰️ ${c.nickname} pendurou as chuteiras aos ${age} anos. Foram bons anos juntos — obrigado, craque.`)
          } else if (expired) {
            extraNarrative.push(`📭 O contrato de representação de ${c.nickname} venceu e você não renovou. Ele virou agente livre e deixou sua carteira.`)
          } else {
            kept.push(c)
          }
        }
        activeClients = kept
      }

      // Weekly expenses
      const weeklyExpense = activeClients.reduce((sum, c) => sum + c.monthlyFee / 4, 0)
      let runningMoney = state.money - weeklyExpense

      // Club offers (tick down + maybe generate)
      const newOffers = [...state.pendingOffers.map(o => ({ ...o, expiresInWeeks: o.expiresInWeeks - 1 }))]
        .filter(o => o.expiresInWeeks > 0)

      if (activeClients.length > 0 && Math.random() > 0.6) {
        // Only players who: are good enough, have no pending offer, AND haven't
        // just been transferred (clubs leave a fresh signing alone for ~2 years).
        const eligible = activeClients.filter(c =>
          c.currentRating >= 60 &&
          !newOffers.find(o => o.clientId === c.legendId) &&
          (c.lastDealYear === undefined || newYear - c.lastDealYear >= 2)
        )
        const eligibleClient = eligible[Math.floor(Math.random() * eligible.length)]
        if (eligibleClient) {
          const offer = generateClubOffer(eligibleClient, newYear, state.clubRelations)
          if (offer) newOffers.push(offer)
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
          const placed = activeClients.filter(c => ownedClub!.placedClientIds.includes(c.legendId))
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
      const clientsLite: ClientLite[] = activeClients.map(c => ({
        legendId: c.legendId, nickname: c.nickname, name: c.name, position: c.position, currentRating: c.currentRating,
        status: c.status, personality: c.personality, nationality: c.nationality,
        birthYear: c.birthYear, currentValue: c.currentValue, peakYearStart: c.peakYearStart,
        contractClub: c.contractClub,
      }))
      const newEvent = generateWeeklyEvent(newYear, actualWeek, clientsLite, state.purchasedUpgrades)
      const newEvents = newEvent
        ? [...state.events.filter(e => e.resolved), newEvent]
        : state.events

      // 🏆 RIVAL AGENTS grow + EMPRESÁRIO DO ANO + 🕵️ INVESTIGATION (year rollover)
      let rivalAgents = state.rivalAgents
      let awards = state.awards
      let suspicion = state.suspicion
      let money2 = runningMoney
      let reputation2 = state.reputation
      if (yearRolled) {
        rivalAgents = state.rivalAgents.map(r => {
          const growth = 1.08 + Math.random() * 0.22
          const cambBonus = r.name.includes('Cambalhota') ? nemesisTaken.length * 250000 + r.wealth * 0.1 : 0
          return { ...r, wealth: Math.round(r.wealth * growth + cambBonus) }
        })
        // your net worth vs the field
        const myNet = money2 + activeClients.reduce((s, c) => s + c.currentValue * (c.commissionRate / 100), 0)
        const topRival = [...rivalAgents].sort((a, b) => b.wealth - a.wealth)[0]
        if (activeClients.length > 0 || state.totalDeals > 0) {
          if (myNet >= (topRival?.wealth ?? 0)) {
            awards += 1
            extraNarrative.push(`🏆 VOCÊ FOI ELEITO O EMPRESÁRIO DO ANO DE ${newYear - 1}! O nº 1 do futebol.`)
          } else {
            extraNarrative.push(`📊 Empresário do Ano de ${newYear - 1}: ${topRival?.name}. Você está na cola dele.`)
          }
        }
        // suspicion-driven investigation
        if (suspicion > 55 && Math.random() < suspicion / 140) {
          const fine = Math.round(money2 * 0.15)
          money2 = Math.max(0, money2 - fine)
          reputation2 = Math.max(0, reputation2 - 12)
          suspicion = Math.max(0, suspicion - 35)
          extraNarrative.push(`🕵️ INVESTIGAÇÃO! A federação te pegou. Multa de R$${fine.toLocaleString('pt-BR')} e reputação manchada. Pegue mais leve no submundo.`)
        } else if (suspicion > 0) {
          suspicion = Math.max(0, suspicion - 3) // cools slowly each year
        }
      }

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
        money: Math.max(0, money2),
        reputation: reputation2,
        suspicion,
        awards,
        rivalAgents,
        clients: activeClients,
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

      const client = state.clients.find(c => c.legendId === offer.clientId)
      // Your earnings: commission (already negotiated WITH the player) of the
      // sale fee + the buying club's luva (kickback) to you.
      const commission = Math.round(action.amount * (client?.commissionRate ?? 10) / 100)
      const earnings = commission + action.clubLuva

      return {
        ...state,
        money: state.money + earnings,
        totalEarned: state.totalEarned + earnings,
        totalDeals: state.totalDeals + 1,
        // closing a deal warms your relationship with the buying club
        clubRelations: { ...state.clubRelations, [action.clubName]: Math.min(100, (state.clubRelations[action.clubName] ?? 0) + 12) },
        // Drop ALL pending offers for this player — once sold, the other clubs back off.
        pendingOffers: state.pendingOffers.filter(o => o.clientId !== offer.clientId),
        clients: state.clients.map(c =>
          c.legendId === offer.clientId
            ? { ...c, contractClub: action.clubName, contractSalary: offer.salary, contractExpiresYear: state.year + offer.contractYears, lastDealYear: state.year }
            : c
        ),
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `✅ ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')} · você embolsou R$${earnings.toLocaleString('pt-BR')}` }, ...state.negotiationLog].slice(0, 30),
        narrative: [
          ...state.narrative,
          `🤝 TRANSFERÊNCIA FECHADA! ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')}. Você embolsou R$${earnings.toLocaleString('pt-BR')} (comissão R$${commission.toLocaleString('pt-BR')} + luva R$${action.clubLuva.toLocaleString('pt-BR')}).`
        ],
      }
    }

    case 'HAGGLE_OFFER': {
      const offer = state.pendingOffers.find(o => o.id === action.offerId)
      if (!offer) return state
      const client = state.clients.find(c => c.legendId === offer.clientId)
      const tries = offer.haggles ?? 0
      // The more you push, the more likely the club walks.
      const agreeChance = 0.62 - tries * 0.18
      if (Math.random() < agreeChance) {
        const bump = 1.1 + Math.random() * 0.18
        const newAmt = Math.round(offer.offerAmount * bump / 1000) * 1000
        return {
          ...state,
          pendingOffers: state.pendingOffers.map(o =>
            o.id === action.offerId
              ? { ...o, offerAmount: newAmt, salary: Math.round(newAmt * 0.08 / 12 / 1000) * 1000, haggles: tries + 1 }
              : o
          ),
          narrative: [...state.narrative, `💬 ${offer.clubName} cedeu! Proposta por ${client?.nickname} subiu pra R$${newAmt.toLocaleString('pt-BR')}.`],
        }
      }
      // refused — chance the club gets annoyed and walks
      const walk = Math.random() < 0.3 + tries * 0.15
      if (walk) {
        return {
          ...state,
          pendingOffers: state.pendingOffers.filter(o => o.id !== action.offerId),
          // they leave annoyed — relationship sours
          clubRelations: { ...state.clubRelations, [offer.clubName]: Math.max(-100, (state.clubRelations[offer.clubName] ?? 0) - 15) },
          narrative: [...state.narrative, `🚪 ${offer.clubName} se irritou com a pechincha e RETIROU a proposta por ${client?.nickname}.`],
        }
      }
      return {
        ...state,
        pendingOffers: state.pendingOffers.map(o =>
          o.id === action.offerId ? { ...o, haggles: tries + 1, expiresInWeeks: Math.max(1, o.expiresInWeeks - 1) } : o
        ),
        narrative: [...state.narrative, `😐 ${offer.clubName} disse que é "pegar ou largar". Não subiu o valor.`],
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

    case 'DIRTY_ACTION': {
      if (action.kind === 'maquiar') {
        return {
          ...state,
          money: state.money + 80000,
          suspicion: Math.min(100, state.suspicion + 16),
          narrative: [...state.narrative, `💵 Você maquiou uma transferência e desviou R$80.000 pro seu caixa dois. Suspeita aumentou.`],
        }
      }
      if (action.kind === 'imprensa') {
        return {
          ...state,
          reputation: Math.min(100, state.reputation + 6),
          suspicion: Math.min(100, state.suspicion + 10),
          narrative: [...state.narrative, `🤐 Você subornou jornalistas pra falarem bem de você. Reputação subiu na marra.`],
        }
      }
      // arbitro — boost your best client
      const best = [...state.clients].sort((a, b) => b.currentValue - a.currentValue)[0]
      if (!best) return state
      return {
        ...state,
        suspicion: Math.min(100, state.suspicion + 18),
        clients: state.clients.map(c =>
          c.legendId === best.legendId
            ? { ...c, currentValue: Math.round(c.currentValue * 1.12), happiness: Math.min(100, c.happiness + 8) }
            : c
        ),
        narrative: [...state.narrative, `⚖️ Você comprou a arbitragem pra ${best.nickname} brilhar. Funcionou — mas alguém pode ter visto.`],
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
