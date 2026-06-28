import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Screen, Client, ClubOffer, Bid, OwnedClub, LeagueTeam } from '../types'
import { getLegendById, getCurrentRating, getMarketValue, getCurrentStatus, getUnlockedNationalities, LEGENDS } from '../data/legends'
import { generateWeeklyEvent, generateAmbientNews } from '../data/events'
import type { ClientLite } from '../data/events'
import { CLUBS, NEMESIS } from '../data/clubs'
import { GLORIES, genericGlory } from '../data/glory'
import {
  WORLD_CUP_YEARS, isTransferWindow, CHALLENGES,
  grantXp, rarityOf, MISSIONS, missionForWeek, missionMetricValue,
} from '../data/career'
// XP helper: bumps xp and, on a level-up, hands back a small rep bonus + a news line.
function applyXp(state: GameState, amount: number): { xp: number; repBonus: number; line: string | null } {
  const g = grantXp(state.xp, amount)
  if (g.leveled) return { xp: g.xp, repBonus: 2, line: `⭐ NÍVEL ${g.leveled}! Seu nome pesa cada vez mais no mercado.` }
  return { xp: g.xp, repBonus: 0, line: null }
}

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
  challengeIndex: 0,
  xp: 0,
  saleStreak: 0,
  bestStreak: 0,
  lastDealAbsWeek: 0,
  everSignedIds: [],
  hotTargets: {},
  weeklyMissionId: null,
  weeklyMissionBaseline: 0,
  weeklyMissionClaimed: false,
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
  | { type: 'PURCHASE_UPGRADE'; upgradeId: string; cost: number; effect: string; repGain?: number }
  | { type: 'MARK_LEGEND_SEEN'; legendId: string }
  | { type: 'LEGEND_REJECTED'; legendId: string; lost: boolean }
  | { type: 'DISMISS_NEMESIS_ALERT' }
  | { type: 'ESCALATE_BID'; offerId: string }
  | { type: 'HAGGLE_OFFER'; offerId: string }
  | { type: 'BUY_CLUB'; clubId: string; name: string; division: number; price: number; fans: number }
  | { type: 'PLACE_CLIENT_IN_CLUB'; legendId: string }
  | { type: 'BUY_TO_CLUB'; legendId: string }
  | { type: 'LOAN_TO_CLUB'; legendId: string }
  | { type: 'UPGRADE_CLUB'; kind: 'stadium' | 'academy'; cost: number }
  | { type: 'SET_TACTIC'; tactic: 'retranca' | 'equilibrio' | 'ataque' }
  | { type: 'DIRTY_ACTION'; kind: 'maquiar' | 'imprensa' | 'arbitro' }
  | { type: 'CLAIM_CHALLENGE' }
  | { type: 'CLAIM_MISSION' }
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

  // Market heat: the hotter the player, the more clubs fight (and likely more come).
  // A FREE AGENT (no club, no transfer fee) attracts even more interest.
  const free = !client.contractClub
  let interest: 'alto' | 'medio' | 'baixo' = rating >= 82 ? 'alto' : rating >= 72 ? 'medio' : 'baixo'
  if (free) interest = interest === 'baixo' ? 'medio' : 'alto'

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

const RIVAL_TEAM_NAMES = [
  'Nacional FC', 'União Operária', 'EC Vale Verde', 'Atlético Serrano',
  'Tupi do Norte', 'Grêmio Maringá', 'Sport Litoral', 'Ferroviária', 'Juventude FC', 'Real Sertão',
]

// weekly income scales with how big your stadium is
function clubWeeklyIncome(fans: number, stadiumLevel: number): number {
  return Math.round(fans * 0.8 * (1 + (stadiumLevel - 1) * 0.4))
}

function buildLeagueTable(clubName: string): LeagueTeam[] {
  const opp = [...RIVAL_TEAM_NAMES].sort(() => Math.random() - 0.5).slice(0, 7)
  return [
    { name: clubName, points: 0, played: 0, isYou: true },
    ...opp.map(n => ({ name: n, points: 0, played: 0 })),
  ]
}

function sortTable(t: LeagueTeam[]): LeagueTeam[] {
  return [...t].sort((a, b) => b.points - a.points || b.points / Math.max(1, b.played) - a.points / Math.max(1, a.played))
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
        weeklyMissionId: missionForWeek(1993 * 52 + 1).id,
        weeklyMissionBaseline: 0,
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
      const xpr = applyXp(state, 60)
      const hotTargets = { ...state.hotTargets }
      delete hotTargets[action.legendId]
      const rar = rarityOf(legend.truePotential)

      return {
        ...state,
        money: state.money - upfront,
        clients: [...state.clients, newClient],
        weeklyExpenses,
        actionsUsed: state.actionsUsed + 1,
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + xpr.repBonus),
        seenLegendIds: state.seenLegendIds.includes(action.legendId) ? state.seenLegendIds : [...state.seenLegendIds, action.legendId],
        everSignedIds: state.everSignedIds.includes(action.legendId) ? state.everSignedIds : [...state.everSignedIds, action.legendId],
        hotTargets,
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `📝 Você agenciou ${legend.nickname} (${action.commissionRate}% · ${action.contractYears} anos)` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative,
          `✍️ Você assinou ${rar.emoji} ${legend.nickname} (${rar.label}): ${action.commissionRate}% de comissão, contrato de ${action.contractYears} anos + R$${legend.luva.toLocaleString('pt-BR')} de luva.`,
          ...(xpr.line ? [xpr.line] : []),
        ],
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
        // vitrine: value built up by playing at your club survives the yearly recompute
        let newValue = Math.round(getMarketValue(legend, newYear) * (client.showcaseMult ?? 1))
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
        // ↩️ LOAN returns — a borrowed jewel goes back to his club after the season
        activeClients = activeClients.map(c => {
          if (c.loanReturnYear !== undefined && newYear >= c.loanReturnYear) {
            extraNarrative.push(`↩️ ${c.nickname} voltou de empréstimo pro ${c.loanOriginClub} — mais maduro e valorizado.`)
            return { ...c, contractClub: c.loanOriginClub ?? c.contractClub, loanOriginClub: undefined, loanReturnYear: undefined }
          }
          return c
        })
      }

      // Weekly expenses — just what you pay your clients to represent them
      const weeklyExpense = activeClients.reduce((sum, c) => sum + c.monthlyFee / 4, 0)
      let runningMoney = state.money - weeklyExpense

      // Club offers (tick down + maybe generate)
      const newOffers = [...state.pendingOffers.map(o => ({ ...o, expiresInWeeks: o.expiresInWeeks - 1 }))]
        .filter(o => o.expiresInWeeks > 0)

      // 💸 OFFERS COME YEAR-ROUND — but the transfer window is a HOT PERIOD:
      // clubs come knocking far more often, and you can land a couple at once.
      const windowOpen = isTransferWindow(actualWeek)
      if (activeClients.length > 0) {
        // Only players who: are good enough, have no pending offer, AND haven't
        // just been transferred (clubs leave a fresh signing alone for ~2 years).
        const eligible = activeClients.filter(c =>
          c.currentRating >= 60 &&
          !newOffers.find(o => o.clientId === c.legendId) &&
          (c.lastDealYear === undefined || newYear - c.lastDealYear >= 2)
        )
        // Window open → offers fly (85% + a shot at a second). Off-window → calmer (40%).
        const maxOffers = windowOpen ? 2 : 1
        const chance = windowOpen ? 0.85 : 0.4
        const pool = [...eligible].sort(() => Math.random() - 0.5)
        for (let i = 0; i < maxOffers && i < pool.length; i++) {
          if (Math.random() < chance) {
            const offer = generateClubOffer(pool[i], newYear, state.clubRelations)
            if (offer) newOffers.push(offer)
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
      let lostLegends = grabbed ? [...state.lostLegends, grabbed] : state.lostLegends

      // 🔥 HOT TARGETS — gems with a ticking clock. Sign them before a rival does.
      const nowAbs = newYear * 52 + actualWeek
      const hotTargets: Record<string, number> = { ...state.hotTargets }
      const signedSet = new Set(activeClients.map(c => c.legendId))
      // expire: deadline passed and still unsigned → a rival snaps them up
      for (const [id, deadline] of Object.entries(hotTargets)) {
        if (signedSet.has(id) || state.everSignedIds.includes(id)) { delete hotTargets[id]; continue }
        if (nowAbs >= deadline) {
          delete hotTargets[id]
          if (!nemesisTaken.includes(id) && !lostLegends.includes(id)) {
            const lg = getLegendById(id)
            if (lg) {
              nemesisTaken = [...nemesisTaken, id]
              lostLegends = [...lostLegends, id]
              extraNarrative.push(`⏳ VOCÊ DEMOROU! Um rival fechou com ${lg.nickname} enquanto você hesitava. Essa lenda escapou de vez.`)
            }
          }
        }
      }
      // register: pin a fresh emerging gem you can chase right now
      if (Object.keys(hotTargets).length < 3) {
        const unlockedNats = getUnlockedNationalities(state.purchasedUpgrades)
        const candidates = LEGENDS.filter(l =>
          l.truePotential >= 92 &&
          newYear >= l.emergenceYear &&
          l.birthYear <= newYear - 14 &&
          unlockedNats.includes(l.nationality) &&
          !signedSet.has(l.id) &&
          !state.everSignedIds.includes(l.id) &&
          !nemesisTaken.includes(l.id) &&
          !lostLegends.includes(l.id) &&
          !(l.id in hotTargets)
        )
        if (candidates.length > 0 && Math.random() < 0.6) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)]
          const weeks = 4 + Math.floor(Math.random() * 4) // 4–7 weeks to act
          hotTargets[pick.id] = nowAbs + weeks
          extraNarrative.push(`🔥 ALVO QUENTE: ${pick.nickname} (${rarityOf(pick.truePotential).label}) está disponível AGORA. Feche em ${weeks} semanas ou um rival leva.`)
        }
      }

      // 💤 COMBO cooldown — momentum fades if you go too long without a deal
      let saleStreak = state.saleStreak
      if (saleStreak > 0 && state.lastDealAbsWeek > 0 && nowAbs - state.lastDealAbsWeek > 6) {
        extraNarrative.push(`💤 Sua sequência de ${saleStreak} negócios esfriou — faz tempo que você não fecha nada.`)
        saleStreak = 0
      }

      // 📋 WEEKLY MISSION rotates every week with a fresh baseline
      const mission = missionForWeek(nowAbs)
      const weeklyMissionId = mission.id
      const weeklyMissionBaseline = missionMetricValue(state, mission.metric)
      const weeklyMissionClaimed = false

      // 🏟️ OWNED CLUB: income, matchday (tactic + vitrine), cup, derby, titles
      let clubRepBonus = 0
      let ownedClub = state.ownedClub
      if (ownedClub) {
        const stadiumLevel = ownedClub.stadiumLevel ?? 1
        const academyLevel = ownedClub.academyLevel ?? 1
        const tactic = ownedClub.tactic ?? 'equilibrio'
        let trophies = ownedClub.trophies ?? []
        let cupRound = ownedClub.cupRound ?? 0
        const rivalName = ownedClub.rivalName ?? (ownedClub.table?.find(t => !t.isYou)?.name ?? 'o rival')

        runningMoney += ownedClub.cashPerWeek

        // only clients actually AT your club (or free) can be fielded
        const validPlaced = (ownedClub.placedClientIds ?? []).filter(id => {
          const c = activeClients.find(x => x.legendId === id)
          return c && (!c.contractClub || c.contractClub === ownedClub!.name)
        })

        // ⚽ LEAGUE MATCH every 2 weeks
        if (newWeek % 2 === 0) {
          const placedC = activeClients.filter(c => validPlaced.includes(c.legendId))
          const squadStr = placedC.length ? placedC.reduce((s, c) => s + c.currentRating, 0) / placedC.length : 35
          const isDerby = actualWeek === 8 || actualWeek === 34
          // tactic shifts the odds: ataque = mais vitória E mais derrota; retranca = mais empate
          const tac = tactic === 'ataque' ? { win: 9, draw: 12 }
                    : tactic === 'retranca' ? { win: -7, draw: 32 }
                    : { win: 0, draw: 20 }
          const winChance = Math.max(8, Math.min(88, 30 + (squadStr - 40) + tac.win))
          const roll = Math.random() * 100
          let wins = ownedClub.seasonWins, draws = ownedClub.seasonDraws, losses = ownedClub.seasonLosses
          let result: string, ptsGained = 0, won = false
          if (roll < winChance) { result = isDerby ? 'CLÁSSICO vencido 🟢' : 'Vitória 🟢'; wins++; ptsGained = 3; won = true }
          else if (roll < winChance + tac.draw) { result = 'Empate 🟡'; draws++; ptsGained = 1 }
          else { result = isDerby ? 'Clássico perdido 🔴' : 'Derrota 🔴'; losses++ }

          // gate receipts on a win scale with stadium + fans
          if (won) runningMoney += Math.round(ownedClub.fans * 0.5 * (1 + (stadiumLevel - 1) * 0.3))

          // standings: you + simulate every rival's matchday
          const table = (ownedClub.table ?? buildLeagueTable(ownedClub.name)).map(t => {
            if (t.isYou) return { ...t, points: t.points + ptsGained, played: t.played + 1 }
            const r = Math.random(); const p = r < 0.4 ? 3 : r < 0.7 ? 1 : 0
            return { ...t, points: t.points + p, played: t.played + 1 }
          })

          // 📈 VITRINE: fielded clients gain VALUE (faster with a better academy) + happiness
          const gain = (won ? 0.04 : 0.02) * (1 + (academyLevel - 1) * 0.25)
          if (validPlaced.length > 0) {
            activeClients = activeClients.map(c => validPlaced.includes(c.legendId)
              ? { ...c, showcaseMult: Math.min(1.8, (c.showcaseMult ?? 1) + gain), currentValue: Math.round(c.currentValue * (1 + gain)), happiness: Math.min(100, c.happiness + (won ? 3 : 1)) }
              : c)
          }

          // derby flavor
          if (isDerby && won) { ownedClub = { ...ownedClub, fans: Math.round(ownedClub.fans * 1.05) }; clubRepBonus += 3; extraNarrative.push(`🔥 CLÁSSICO! Seu ${ownedClub.name} atropelou ${rivalName} e a torcida foi à loucura.`) }
          else if (isDerby) { extraNarrative.push(`😞 Clássico contra ${rivalName} não saiu como esperado.`) }

          ownedClub = { ...ownedClub, seasonWins: wins, seasonDraws: draws, seasonLosses: losses, lastResult: result, table, placedClientIds: validPlaced }
        } else {
          ownedClub = { ...ownedClub, placedClientIds: validPlaced }
        }

        // 🏆 CUP rounds at fixed weeks of the season
        if ([10, 20, 30, 40].includes(actualWeek)) {
          const placedC = activeClients.filter(c => validPlaced.includes(c.legendId))
          const squadStr = placedC.length ? placedC.reduce((s, c) => s + c.currentRating, 0) / placedC.length : 35
          const advChance = Math.max(20, Math.min(85, 35 + (squadStr - 40)))
          if (Math.random() * 100 < advChance) {
            cupRound = cupRound + 1
            const prize = 40000 * cupRound * (5 - ownedClub.division)
            runningMoney += prize
            if (cupRound >= 4) {
              trophies = [...trophies, `🏆 Copa ${newYear}`]
              runningMoney += 300000
              clubRepBonus += 5
              extraNarrative.push(`🏆 CAMPEÃO DA COPA ${newYear}! O ${ownedClub.name} levantou a taça — R$300.000 de premiação no caixa.`)
              cupRound = 0
            } else {
              extraNarrative.push(`🏆 ${ownedClub.name} avançou na Copa (${cupRound}ª fase)! Premiação de R$${prize.toLocaleString('pt-BR')}.`)
            }
          } else {
            if (cupRound > 0) extraNarrative.push(`🥲 O ${ownedClub.name} caiu na Copa — chegou até a ${cupRound}ª fase.`)
            cupRound = 0
          }
          ownedClub = { ...ownedClub, cupRound, trophies }
        }

        // 🏁 END OF SEASON: title, promotion/relegation
        if (yearRolled) {
          const finalTable = sortTable(ownedClub.table ?? buildLeagueTable(ownedClub.name))
          const pos = finalTable.findIndex(t => t.isYou) + 1
          ownedClub = { ...ownedClub, leaguePosition: pos }
          if (pos === 1) {
            trophies = [...trophies, `🥇 Campeão ${ownedClub.division}ª Div ${newYear - 1}`]
            runningMoney += 150000
            clubRepBonus += 4
            extraNarrative.push(`🥇 CAMPEÃO! O ${ownedClub.name} terminou em 1º na ${ownedClub.division}ª divisão de ${newYear - 1}.`)
          }
          if (pos > 0 && pos <= 2 && ownedClub.division > 1) {
            const div = ownedClub.division - 1
            const fans = Math.round(ownedClub.fans * 1.6)
            ownedClub = { ...ownedClub, division: div, fans, cashPerWeek: clubWeeklyIncome(fans, stadiumLevel) }
            extraNarrative.push(`🏟️ ${ownedClub.name} SUBIU para a ${div}ª divisão! A torcida explode.`)
          } else if (pos >= finalTable.length - 1 && ownedClub.division < 4) {
            const div = ownedClub.division + 1
            const fans = Math.round(ownedClub.fans * 0.7)
            ownedClub = { ...ownedClub, division: div, fans, cashPerWeek: clubWeeklyIncome(fans, stadiumLevel) }
            extraNarrative.push(`🏟️ ${ownedClub.name} foi REBAIXADO para a ${div}ª divisão.`)
          } else {
            extraNarrative.push(`🏟️ ${ownedClub.name} terminou em ${pos}º na ${ownedClub.division}ª divisão de ${newYear - 1}.`)
          }
          // 🎓 academy reveal — being a developer grows your name
          if (academyLevel >= 3) { clubRepBonus += 2; extraNarrative.push(`🎓 A base do ${ownedClub.name} revelou um garoto promissor. Sua fama de formador cresce.`) }
          // new season reset (keep trophies, infra, tactic)
          ownedClub = { ...ownedClub, seasonWins: 0, seasonDraws: 0, seasonLosses: 0, cupRound: 0, table: buildLeagueTable(ownedClub.name), trophies }
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
        reputation: Math.min(100, reputation2 + clubRepBonus),
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
        lostLegends,
        hotTargets,
        saleStreak,
        weeklyMissionId,
        weeklyMissionBaseline,
        weeklyMissionClaimed,
        narrative: [...state.narrative, ...extraNarrative],
      }
    }

    case 'ACCEPT_OFFER': {
      const offer = state.pendingOffers.find(o => o.id === action.offerId)
      if (!offer) return state

      const client = state.clients.find(c => c.legendId === offer.clientId)
      // Your earnings: commission (negotiated with the player) + the club's luva.
      const commission = Math.round(action.amount * (client?.commissionRate ?? 10) / 100)
      const base = commission + action.clubLuva

      // 🔥 COMBO: consecutive deals build a streak that boosts your take.
      const streak = state.saleStreak + 1
      const comboMult = 1 + Math.min(0.5, (streak - 1) * 0.05)  // +5% per step, capped +50%
      // 🏟️ If this player plays at YOUR club, you're the seller too — keep the FULL fee.
      const ownsSeller = !!state.ownedClub && state.ownedClub.placedClientIds.includes(offer.clientId)
      const clubFee = ownsSeller ? action.amount : 0
      const earnings = Math.round(base * comboMult) + clubFee
      const repFromStreak = streak >= 3 ? Math.min(8, Math.floor(streak / 2)) : 0
      const nowAbs = state.year * 52 + state.week
      const xpr = applyXp(state, Math.min(120, 30 + Math.round(earnings / 50000)))

      return {
        ...state,
        money: state.money + earnings,
        totalEarned: state.totalEarned + earnings,
        totalDeals: state.totalDeals + 1,
        saleStreak: streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lastDealAbsWeek: nowAbs,
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + repFromStreak + xpr.repBonus),
        // closing a deal warms your relationship with the buying club
        clubRelations: { ...state.clubRelations, [action.clubName]: Math.min(100, (state.clubRelations[action.clubName] ?? 0) + 12) },
        // Drop ALL pending offers for this player — once sold, the other clubs back off.
        pendingOffers: state.pendingOffers.filter(o => o.clientId !== offer.clientId),
        // if he was playing for you, he leaves the pitch on his way out
        ownedClub: ownsSeller && state.ownedClub
          ? { ...state.ownedClub, placedClientIds: state.ownedClub.placedClientIds.filter(id => id !== offer.clientId) }
          : state.ownedClub,
        clients: state.clients.map(c =>
          c.legendId === offer.clientId
            ? { ...c, contractClub: action.clubName, contractSalary: offer.salary, contractExpiresYear: state.year + offer.contractYears, lastDealYear: state.year }
            : c
        ),
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `✅ ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')} · você embolsou R$${earnings.toLocaleString('pt-BR')}` }, ...state.negotiationLog].slice(0, 30),
        narrative: [
          ...state.narrative,
          `🤝 TRANSFERÊNCIA FECHADA! ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')}. Você embolsou R$${earnings.toLocaleString('pt-BR')} (comissão R$${commission.toLocaleString('pt-BR')} + luva R$${action.clubLuva.toLocaleString('pt-BR')}${ownsSeller ? ` + taxa de transferência R$${clubFee.toLocaleString('pt-BR')} (você é o dono do clube!)` : ''}).`,
          ...(streak >= 3 ? [`🔥 SEQUÊNCIA x${streak}! Você está embalado — bônus de +${Math.round((comboMult - 1) * 100)}% no negócio e +${repFromStreak} de reputação.`] : []),
          ...(xpr.line ? [xpr.line] : []),
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
      const isLife = action.upgradeId.startsWith('life-')
      const repBoost = action.repGain ?? (action.upgradeId === 'escritorio-sp' ? 12 : isScout ? 3 : 0)
      return {
        ...state,
        money: state.money - action.cost,
        purchasedUpgrades: [...state.purchasedUpgrades, action.upgradeId],
        scoutSlots: isScout ? state.scoutSlots + 2 : state.scoutSlots,
        reputation: Math.min(100, state.reputation + repBoost),
        narrative: [
          ...state.narrative,
          isScout ? `🔭 Novo olheiro contratado! ${action.effect}`
            : isLife ? `💎 Você ostentou e ganhou status! ${action.effect}`
            : `💼 Investimento: ${action.effect}`,
        ],
      }
    }

    case 'MARK_LEGEND_SEEN': {
      if (state.seenLegendIds.includes(action.legendId)) return state
      const xpr = applyXp(state, 12)
      return {
        ...state,
        seenLegendIds: [...state.seenLegendIds, action.legendId],
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + xpr.repBonus),
        narrative: xpr.line ? [...state.narrative, xpr.line] : state.narrative,
      }
    }

    case 'CLAIM_CHALLENGE': {
      const ch = CHALLENGES[state.challengeIndex]
      // Only pay out if there IS a current challenge and it's actually complete.
      if (!ch || !ch.done(state)) return state
      const xpr = applyXp(state, 100)
      return {
        ...state,
        money: state.money + ch.reward,
        totalEarned: state.totalEarned + ch.reward,
        reputation: Math.min(100, state.reputation + ch.repReward + xpr.repBonus),
        xp: xpr.xp,
        challengeIndex: state.challengeIndex + 1,
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `🎯 Desafio concluído: ${ch.title} (+R$${ch.reward.toLocaleString('pt-BR')})` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative, `🎯 DESAFIO CONCLUÍDO — ${ch.title}! Recompensa: R$${ch.reward.toLocaleString('pt-BR')} + ${ch.repReward} de reputação.`, ...(xpr.line ? [xpr.line] : [])],
      }
    }

    case 'CLAIM_MISSION': {
      if (!state.weeklyMissionId || state.weeklyMissionClaimed) return state
      const m = MISSIONS.find(x => x.id === state.weeklyMissionId)
      if (!m) return state
      const progress = missionMetricValue(state, m.metric) - state.weeklyMissionBaseline
      if (progress < m.target) return state
      const xpr = applyXp(state, m.xp)
      return {
        ...state,
        money: state.money + m.reward,
        totalEarned: state.totalEarned + m.reward,
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + xpr.repBonus),
        weeklyMissionClaimed: true,
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `📋 Missão da semana cumprida (+R$${m.reward.toLocaleString('pt-BR')})` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative, `📋 MISSÃO DA SEMANA CUMPRIDA — ${m.label}! +R$${m.reward.toLocaleString('pt-BR')}.`, ...(xpr.line ? [xpr.line] : [])],
      }
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
      const table = buildLeagueTable(action.name)
      const rivalName = table.find(t => !t.isYou)?.name ?? 'o rival'
      const club: OwnedClub = {
        id: action.clubId,
        name: action.name,
        division: action.division,
        fans: action.fans,
        leaguePosition: 10,
        cashPerWeek: clubWeeklyIncome(action.fans, 1),
        placedClientIds: [],
        lastResult: '—',
        seasonWins: 0, seasonDraws: 0, seasonLosses: 0,
        table,
        stadiumLevel: 1,
        academyLevel: 1,
        tactic: 'equilibrio',
        trophies: [],
        cupRound: 0,
        rivalName,
      }
      return {
        ...state,
        money: state.money - action.price,
        ownedClub: club,
        narrative: [...state.narrative, `🏟️ VOCÊ COMPROU O ${action.name.toUpperCase()}! Agora é dono de um clube — o começo do império. Seu maior rival na ${action.division}ª divisão: ${rivalName}.`],
      }
    }

    case 'BUY_TO_CLUB': {
      if (!state.ownedClub) return state
      const c = state.clients.find(x => x.legendId === action.legendId)
      if (!c) return state
      const cost = Math.round(c.currentValue)
      if (state.money < cost) return state
      return {
        ...state,
        money: state.money - cost,
        clients: state.clients.map(x =>
          x.legendId === action.legendId
            ? { ...x, contractClub: state.ownedClub!.name, lastDealYear: state.year, happiness: Math.min(100, x.happiness + 8) }
            : x
        ),
        ownedClub: { ...state.ownedClub, placedClientIds: [...state.ownedClub.placedClientIds, action.legendId] },
        narrative: [...state.narrative, `🔁 Você comprou ${c.nickname} (de ${c.contractClub}) pro seu ${state.ownedClub.name} por R$${cost.toLocaleString('pt-BR')}.`],
      }
    }

    case 'PLACE_CLIENT_IN_CLUB': {
      if (!state.ownedClub) return state
      const cli = state.clients.find(c => c.legendId === action.legendId)
      if (!cli) return state
      const already = state.ownedClub.placedClientIds.includes(action.legendId)
      // Can only field a player who is AT your club or has no club at all.
      const eligible = !cli.contractClub || cli.contractClub === state.ownedClub.name
      if (!already && !eligible) return state
      const placedClientIds = already
        ? state.ownedClub.placedClientIds.filter(id => id !== action.legendId)
        : [...state.ownedClub.placedClientIds, action.legendId]
      return {
        ...state,
        ownedClub: { ...state.ownedClub, placedClientIds },
        clients: state.clients.map(c =>
          c.legendId === action.legendId && !already && !c.contractClub
            ? { ...c, contractClub: state.ownedClub!.name, happiness: Math.min(100, c.happiness + 6) }
            : c
        ),
      }
    }

    case 'LOAN_TO_CLUB': {
      // Bring a client who plays ELSEWHERE on a 1-season loan — cheap way to
      // develop a jewel at your club. He returns to his club next year.
      if (!state.ownedClub) return state
      const c = state.clients.find(x => x.legendId === action.legendId)
      if (!c || !c.contractClub || c.contractClub === state.ownedClub.name) return state
      const fee = Math.max(2000, Math.round(c.currentValue * 0.08))
      if (state.money < fee) return state
      return {
        ...state,
        money: state.money - fee,
        clients: state.clients.map(x =>
          x.legendId === action.legendId
            ? { ...x, loanOriginClub: x.contractClub!, contractClub: state.ownedClub!.name, loanReturnYear: state.year + 1, happiness: Math.min(100, x.happiness + 6) }
            : x
        ),
        ownedClub: { ...state.ownedClub, placedClientIds: [...state.ownedClub.placedClientIds, action.legendId] },
        narrative: [...state.narrative, `🤝 Você pegou ${c.nickname} por EMPRÉSTIMO (de ${c.contractClub}) por uma temporada — R$${fee.toLocaleString('pt-BR')}. Hora de dar minutos e valorizar.`],
      }
    }

    case 'UPGRADE_CLUB': {
      if (!state.ownedClub || state.money < action.cost) return state
      const club = state.ownedClub
      if (action.kind === 'stadium') {
        const lvl = (club.stadiumLevel ?? 1) + 1
        if (lvl > 5) return state
        const fans = Math.round(club.fans * 1.25)
        return {
          ...state,
          money: state.money - action.cost,
          ownedClub: { ...club, stadiumLevel: lvl, fans, cashPerWeek: clubWeeklyIncome(fans, lvl) },
          narrative: [...state.narrative, `🏗️ Você ampliou o estádio do ${club.name} (nível ${lvl})! Mais torcida, mais renda nos jogos.`],
        }
      }
      // academy
      const lvl = (club.academyLevel ?? 1) + 1
      if (lvl > 5) return state
      return {
        ...state,
        money: state.money - action.cost,
        ownedClub: { ...club, academyLevel: lvl },
        narrative: [...state.narrative, `🎓 Você investiu no CT/base do ${club.name} (nível ${lvl})! Seus craques se valorizam mais rápido jogando aqui.`],
      }
    }

    case 'SET_TACTIC': {
      if (!state.ownedClub) return state
      return { ...state, ownedClub: { ...state.ownedClub, tactic: action.tactic } }
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
