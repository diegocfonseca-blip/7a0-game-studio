import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Screen, Client, ClubOffer, Bid, OnlinePlayer, OnlineGameMode, AuctionState, OnlineNewsItem, OnlineClientInfo, RivalAgent, GameEvent } from '../types'
import { getLegendById, getCurrentRating, getMarketValue, getCurrentStatus, getRetirementYear, retirementNarrative, LEGENDS } from '../data/legends'
import { generateWeeklyEvent, generateAmbientNews, SCOUT_UPGRADES, OFFICE_UPGRADES, getUnlockedClubCountries } from '../data/events'
import type { ClientLite } from '../data/events'
import { CLUBS, NEMESIS } from '../data/clubs'
import { GLORIES, genericGlory } from '../data/glory'
import {
  WORLD_CUP_YEARS, isTransferWindow, CHALLENGES,
  grantXp, rarityOf, MISSIONS, missionForWeek, missionMetricValue,
} from '../data/career'
import { getHistoricalEvents, isDeadlineDay } from '../data/historical'
import { getLegendEvents } from '../data/legend-events'

// ── CPU Agent Pool ─────────────────────────────────────────────────────────────
// Cambalhota is ALWAYS index 0 (never changes). Others rotate based on numCpuAgents.
const CPU_AGENT_POOL: RivalAgent[] = [
  { id: 'cambalhota',   name: 'Sérgio Cambalhota',    budget: 150000, reputation: 55, clients: [], wealth: 600000 },
  { id: 'w_ribeiro',   name: 'Wagner Ribeiro',        budget: 60000,  reputation: 45, clients: [], wealth: 180000 },
  { id: 'r_pitta',     name: 'Reinaldo Pitta',        budget: 45000,  reputation: 38, clients: [], wealth: 120000 },
  { id: 'a_cury',      name: 'André Cury',            budget: 40000,  reputation: 35, clients: [], wealth: 100000 },
  { id: 'g_bertolucci',name: 'Giuliano Bertolucci',   budget: 30000,  reputation: 30, clients: [], wealth:  70000 },
  { id: 'j_gullo',     name: 'Jorge Gullo',           budget: 25000,  reputation: 25, clients: [], wealth:  50000 },
  { id: 'g_veloz',     name: 'Gilmar Veloz',          budget: 20000,  reputation: 20, clients: [], wealth:  40000 },
  { id: 'j_mendes',    name: 'João Mendes Jr.',       budget: 18000,  reputation: 18, clients: [], wealth:  30000 },
]
// XP helper: bumps xp and, on a level-up, hands back a small rep bonus + a news line.
function applyXp(state: GameState, amount: number): { xp: number; repBonus: number; line: string | null } {
  const g = grantXp(state.xp, amount)
  if (g.leveled) return { xp: g.xp, repBonus: 2, line: `⭐ NÍVEL ${g.leveled}! Seu nome pesa cada vez mais no mercado.` }
  return { xp: g.xp, repBonus: 0, line: null }
}

const INITIAL_STATE: GameState = {
  screen: 'lobby',
  year: 1993,
  week: 1,
  money: 100_000,
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
    { id: 'cambalhota', name: 'Sérgio Cambalhota', budget: 50000, reputation: 55, clients: [], wealth: 600000 },
    { id: 'rival1',     name: 'João Mendes',       budget: 20000, reputation: 25, clients: [], wealth:  40000 },
    { id: 'rival2',     name: 'Carlos Primo',      budget: 35000, reputation: 40, clients: [], wealth: 180000 },
  ],
  seenLegendIds: [],
  purchasedUpgrades: [],
  rejectionCounts: {},
  lostLegends: [],
  pooledLegends: [],
  nemesisTaken: [],
  nemesisShown: false,
  nemesisAlert: null,
  negotiationLog: [],
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
  onlineMode: 'cpu',
  roomCode: '',
  isHost: false,
  playerNames: [],
  youIndex: 0,
  onlineGameMode: null,
  draftTurn: 0,
  draftPicksDone: 0,
  draftWindowActive: false,
  currentAuction: null,
  onlineTakenLegends: {},
  onlinePlayers: [],
  onlinePresence: [],
  onlineNews: [],
  onlinePlayerRosters: {},
  suspendedUntilWeek: 0,
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'INIT_ROOM'; onlineMode: 'cpu' | 'online'; roomCode: string; isHost: boolean; playerNames: string[]; playerName: string; onlineGameMode: OnlineGameMode | null; numCpuAgents?: number }
  | { type: 'START_GAME'; playerName: string }
  | { type: 'SKIP_CPU_DRAFT' }
  | { type: 'CPU_AUCTION_CLOSE' }
  | { type: 'CPU_AUCTION_BID_AND_CLOSE'; amount: number }
  | { type: 'SIGN_CLIENT'; legendId: string; commissionRate: number; contractYears: number }
  | { type: 'RENEW_CLIENT'; legendId: string; commissionRate: number; contractYears: number }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ACCEPT_OFFER'; offerId: string; clubName: string; amount: number; clubLuva: number }
  | { type: 'REJECT_OFFER'; offerId: string }
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceIndex: 0 | 1 | 2 }
  | { type: 'PURCHASE_UPGRADE'; upgradeId: string; cost: number; effect: string; repGain?: number }
  | { type: 'MARK_LEGEND_SEEN'; legendId: string }
  | { type: 'LEGEND_REJECTED'; legendId: string; lost: boolean }
  | { type: 'DISMISS_NEMESIS_ALERT' }
  | { type: 'ESCALATE_BID'; offerId: string }
  | { type: 'HAGGLE_OFFER'; offerId: string }
  | { type: 'DIRTY_ACTION'; kind: 'maquiar' | 'imprensa' | 'arbitro' | 'apostar' }
  | { type: 'LOAN_CLIENT'; legendId: string; loanClub: string; loanYears: number }
  | { type: 'CLAIM_CHALLENGE' }
  | { type: 'CLAIM_MISSION' }
  | { type: 'NEW_GAME' }
  | { type: 'LEGEND_TAKEN_ONLINE'; legendId: string; playerIndex: number; playerName: string }
  | { type: 'PLAYER_UPDATE_ONLINE'; playerIndex: number; playerName: string; money: number; totalDeals: number }
  | { type: 'SET_PRESENCE'; indices: number[] }
  | { type: 'DRAFT_ADVANCE'; picksDone: number }
  | { type: 'AUCTION_SET'; auction: AuctionState | null }
  | { type: 'AUCTION_BID'; playerIndex: number; amount: number }
  | { type: 'AUCTION_WIN'; legendId: string; bidAmount: number }
  | { type: 'REP_SOLD'; legendId: string; saleAmount: number }
  | { type: 'DRAFT_WINDOW_SET'; active: boolean }
  | { type: 'ONLINE_NEWS_ADD'; item: OnlineNewsItem }
  | { type: 'PLAYER_ROSTER_UPDATE'; playerIndex: number; clients: OnlineClientInfo[] }
  | { type: 'PUT_IN_POOL'; legendId: string }

function generateClubOffer(client: Client, year: number, clubRelations: Record<string, number> = {}, purchasedUpgrades: string[] = []): ClubOffer | null {
  const rating = getCurrentRating(getLegendById(client.legendId)!, year)
  if (rating < 60 && Math.random() > 0.3) return null
  if (rating < 75 && Math.random() > 0.6) return null

  const value = getMarketValue(getLegendById(client.legendId)!, year)
  if (value < 50000) return null

  const unlockedCountries = getUnlockedClubCountries(purchasedUpgrades)
  const eligibleClubs = CLUBS.filter(c => {
    if (!unlockedCountries.includes(c.country)) return false
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
    return Math.round(amt * (0.01 + Math.random() * 0.03) * relBonus / 1000) * 1000
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

// nemesisTryGrab removed — Cambalhota now only competes inside auctions/drafts

// ── CPU Auction Resolution ────────────────────────────────────────────────────
// Shared logic for CPU_AUCTION_CLOSE and CPU_AUCTION_BID_AND_CLOSE.
function resolveCpuAuction(state: GameState, auction: AuctionState): GameState {
  const entries = Object.entries(auction.bids).map(([k, v]) => ({ idx: Number(k), amount: v as number }))
  if (entries.length === 0) {
    return { ...state, currentAuction: null, narrative: [...state.narrative, `🔨 Leilão encerrado sem lances.`] }
  }
  const winner = entries.reduce((a, b) => b.amount > a.amount ? b : a)

  if (winner.idx === 0) {
    const legend = getLegendById(auction.legendId)
    if (!legend) return { ...state, currentAuction: null }
    const currentRating = getCurrentRating(legend, state.year)
    const currentValue = getMarketValue(legend, state.year)
    const newClient: Client = {
      legendId: legend.id, name: legend.name, nickname: legend.nickname,
      position: legend.position, nationality: legend.nationality,
      status: getCurrentStatus(legend, state.year),
      birthYear: legend.birthYear, peakYearStart: legend.peakYearStart,
      peakYearEnd: legend.peakYearEnd, truePotential: legend.truePotential,
      currentRating, personality: legend.personality, monthlyFee: legend.monthlyFee,
      futureKnowledge: legend.futureKnowledge, commissionRate: 15,
      repContractYears: 3, repExpiresYear: state.year + 3,
      happiness: 75, currentValue, signedYear: state.year,
      contractClub: legend.club, contractSalary: legend.monthlyFee * 10,
      contractExpiresYear: state.year + 2, rivalOffers: 0,
    }
    const weeklyExpenses = state.clients.reduce((sum, c) => sum + c.monthlyFee, 0) / 4 + legend.monthlyFee / 4
    const xpr = applyXp(state, 60)
    return {
      ...state,
      money: state.money - winner.amount,
      clients: [...state.clients, newClient],
      weeklyExpenses, xp: xpr.xp,
      reputation: Math.min(100, state.reputation + xpr.repBonus),
      everSignedIds: state.everSignedIds.includes(auction.legendId) ? state.everSignedIds : [...state.everSignedIds, auction.legendId],
      seenLegendIds: state.seenLegendIds.includes(auction.legendId) ? state.seenLegendIds : [...state.seenLegendIds, auction.legendId],
      currentAuction: null,
      narrative: [...state.narrative,
        `🏆 LEILÃO GANHO! Você venceu com R$${winner.amount.toLocaleString('pt-BR')} e agenciou ${legend.nickname}!`,
        ...(xpr.line ? [xpr.line] : []),
      ],
    }
  } else {
    const bidderRivalIndices = auction.cpuBidderRivalIndices ?? []
    const rivalIdx = bidderRivalIndices[winner.idx - 1]
    const cpuAgent = rivalIdx !== undefined ? state.rivalAgents[rivalIdx] : null
    const legend = getLegendById(auction.legendId)
    if (!cpuAgent || !legend) return { ...state, currentAuction: null }
    return {
      ...state,
      currentAuction: null,
      rivalAgents: state.rivalAgents.map((r, i) =>
        i === rivalIdx
          ? { ...r, clients: [...r.clients, auction.legendId], wealth: Math.max(0, r.wealth - winner.amount) }
          : r
      ),
      onlineTakenLegends: {
        ...state.onlineTakenLegends,
        [auction.legendId]: { playerIndex: winner.idx, playerName: cpuAgent.name },
      },
      // Mark as stolen in album (rival won the auction) and ensure it's seen
      nemesisTaken: state.nemesisTaken.includes(auction.legendId) ? state.nemesisTaken : [...state.nemesisTaken, auction.legendId],
      seenLegendIds: state.seenLegendIds.includes(auction.legendId) ? state.seenLegendIds : [...state.seenLegendIds, auction.legendId],
      narrative: [...state.narrative, `🔨 ${cpuAgent.name} venceu o leilão com R$${winner.amount.toLocaleString('pt-BR')} e ficou com ${legend.nickname}!`],
    }
  }
}

function empresarioReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'INIT_ROOM': {
      // CPU mode: always use the full pool — Cambalhota always bids, others rotate per auction
      const cpuRivals: RivalAgent[] = action.onlineMode === 'cpu'
        ? [...CPU_AGENT_POOL]
        : INITIAL_STATE.rivalAgents
      return {
        ...INITIAL_STATE,
        screen: 'intro',
        onlineMode: action.onlineMode,
        roomCode: action.roomCode,
        isHost: action.isHost,
        playerNames: action.playerNames,
        youIndex: action.playerNames.indexOf(action.playerName),
        onlineGameMode: action.onlineGameMode,
        rivalAgents: cpuRivals,
        draftTurn: 0,
        draftPicksDone: 0,
      }
    }

    case 'START_GAME':
      return {
        ...INITIAL_STATE,
        // preserve online setup from lobby
        onlineMode: state.onlineMode,
        roomCode: state.roomCode,
        isHost: state.isHost,
        playerNames: state.playerNames,
        youIndex: state.youIndex,
        // sempre estruturado — nunca mercado livre
        onlineGameMode: state.onlineGameMode ?? 'leilao',
        draftTurn: 0,
        draftPicksDone: 0,
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
      const isDraftOnline = state.onlineMode === 'online' &&
        (state.onlineGameMode === 'draft' || state.onlineGameMode === 'draft-leilao')
      const isDraftCpu = state.onlineMode === 'cpu' &&
        (state.onlineGameMode === 'draft' || state.onlineGameMode === 'draft-leilao')

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
        draftPicksDone: (isDraftOnline || isDraftCpu) ? state.draftPicksDone + 1 : state.draftPicksDone,
        draftWindowActive: isDraftCpu ? false : state.draftWindowActive, // close window after player signs
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
                happiness: Math.min(100, c.happiness + 15),
                lowHappinessWeeks: 0,
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
      // Block week advance while draft/auction window is open (online or cpu)
      if (state.draftWindowActive || state.currentAuction !== null) {
        return state
      }
      const newWeek = state.week + 1
      const yearRolled = newWeek > 52
      const newYear = yearRolled ? state.year + 1 : state.year
      const actualWeek = yearRolled ? 1 : newWeek
      const extraNarrative: string[] = []

      const absWeekNow = newYear * 52 + actualWeek

      // ── INJURY NARRATIVES ──────────────────────────────────────────────────
      const INJURY_DESC: Record<string, string[]> = {
        leve:     ['sofreu uma torção no tornozelo', 'sente dor muscular e vai descansar', 'tem uma contusão leve no joelho'],
        moderada: ['rompeu o ligamento colateral — semanas fora', 'tem lesão muscular grau 2 na coxa', 'sofreu uma fratura por estresse na tíbia'],
        grave:    ['rompeu o ligamento cruzado — cirurgia necessária', 'fraturou a fíbula — meses de recuperação', 'lesão muscular grave com risco de sequela'],
      }
      const injuryWeeks: Record<string, [number, number]> = {
        leve:     [2, 4],
        moderada: [5, 10],
        grave:    [12, 24],
      }
      const injuryValueDrop: Record<string, number> = { leve: 0.90, moderada: 0.75, grave: 0.60 }
      const injuryHappinessDrop: Record<string, number> = { leve: -5, moderada: -15, grave: -25 }

      // Update clients ratings and values (+ glory moments on year rollover)
      const updatedClients = state.clients.map(client => {
        const legend = getLegendById(client.legendId)
        if (!legend) return client
        const newRating = getCurrentRating(legend, newYear)
        // vitrine: value built up by playing at your club survives the yearly recompute
        let newValue = Math.round(getMarketValue(legend, newYear) * (client.showcaseMult ?? 1))
        const newStatus = getCurrentStatus(legend, newYear)

        let happiness = client.happiness
        // Base weekly decay — everyone loses a little happiness passively
        happiness = Math.max(0, happiness - 1)
        if (client.personality === 'ambicioso' && newRating > 80 && !client.contractClub?.includes('Milan') && !client.contractClub?.includes('Madrid')) {
          happiness = Math.max(30, happiness - 4)
        }
        if (client.personality === 'difícil') {
          happiness = Math.max(20, happiness - 2)
        }
        if (client.commissionRate > 20 && newRating > 70) {
          happiness = Math.max(20, happiness - 2)
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

        // 🏥 INJURY: heal if recovered, or apply new random injury
        let injuredUntilWeek = client.injuredUntilWeek
        let injuryLevel = client.injuryLevel
        let injuryDescription = client.injuryDescription

        if (injuredUntilWeek !== undefined && absWeekNow >= injuredUntilWeek) {
          // Recovered!
          extraNarrative.push(`✅ ${client.nickname} se recuperou da lesão e está de volta aos gramados. Aliviante!`)
          newValue = Math.round(newValue * 1.08) // slight bounce back
          happiness = Math.min(100, happiness + 8)
          injuredUntilWeek = undefined
          injuryLevel = undefined
          injuryDescription = undefined
        } else if (injuredUntilWeek === undefined) {
          // ~3.5% weekly chance of leve, ~1% moderada, ~0.3% grave
          const roll = Math.random()
          let level: 'leve' | 'moderada' | 'grave' | null = null
          if (roll < 0.003) level = 'grave'
          else if (roll < 0.013) level = 'moderada'
          else if (roll < 0.048) level = 'leve'

          if (level) {
            const [minW, maxW] = injuryWeeks[level]
            const duration = minW + Math.floor(Math.random() * (maxW - minW + 1))
            const descs = INJURY_DESC[level]
            const desc = descs[Math.floor(Math.random() * descs.length)]
            injuredUntilWeek = absWeekNow + duration
            injuryLevel = level
            injuryDescription = desc
            newValue = Math.round(newValue * injuryValueDrop[level])
            happiness = Math.max(0, happiness + injuryHappinessDrop[level])
            const emoji = level === 'grave' ? '🚨' : level === 'moderada' ? '⚠️' : '🤕'
            extraNarrative.push(`${emoji} LESÃO (${level.toUpperCase()}): ${client.nickname} ${desc}. Fica fora por ${duration} semanas.`)
          }
        }

        // 📈 STRATEGIC LOAN: client grows ~15% faster on loan (only on year rollover)
        if (yearRolled && client.onStrategicLoan) {
          newValue = Math.round(newValue * 1.15)
          happiness = Math.min(100, happiness + 5)
          extraNarrative.push(`📈 ${client.nickname} está se destacando no ${client.loanOriginClub ?? 'clube emprestado'} — crescimento acelerado em empréstimo!`)
        }

        // Track consecutive unhappy weeks
        const lowHappinessWeeks = happiness < 25
          ? (client.lowHappinessWeeks ?? 0) + 1
          : 0
        if (lowHappinessWeeks === 2) {
          extraNarrative.push(`😠 ${client.nickname} está infeliz há semanas — ele pode abandonar você se nada mudar. Renove o contrato ou feche um negócio pra ele.`)
        }

        return {
          ...client,
          currentRating: newRating,
          currentValue: newValue,
          status: newStatus,
          happiness,
          injuredUntilWeek,
          injuryLevel,
          injuryDescription,
          lowHappinessWeeks,
        }
      })

      // 😤 ABANDON: players who were miserable for 4+ weeks walk out
      const abandonedIds: string[] = []
      const afterAbandons = updatedClients.filter(c => {
        if ((c.lowHappinessWeeks ?? 0) >= 4) {
          abandonedIds.push(c.legendId)
          extraNarrative.push(`💔 ${c.nickname} abandonou você. Semanas sem atenção, felicidade no chão — ele rescindiu o contrato. Cuide melhor dos seus clientes.`)
          return false
        }
        return true
      })

      // ⏳ REP CONTRACTS expiring + ⚰️ RETIREMENT (age catches everyone)
      let activeClients = afterAbandons
      if (yearRolled) {
        const kept: typeof updatedClients = []
        for (const c of updatedClients) {
          const legend = getLegendById(c.legendId)
          const expired = c.repExpiresYear !== undefined && newYear > c.repExpiresYear
          const baseRetirement = legend ? getRetirementYear(legend) : c.birthYear + 37
          const happinessMod = c.happiness > 80 ? 2 : c.happiness < 40 ? -2 : 0
          const retires = newYear >= baseRetirement + happinessMod
          if (retires) {
            const age = newYear - c.birthYear
            const narrative = legend
              ? retirementNarrative(c.nickname, c.legendId, c.contractClub, legend.futureKnowledge)
              : `🎙️ ${c.nickname} se aposentou aos ${age} anos.`
            extraNarrative.push(narrative)
          } else if (expired) {
            extraNarrative.push(`📭 O contrato de representação de ${c.nickname} venceu e você não renovou. Ele virou agente livre e deixou sua carteira.`)
          } else {
            kept.push(c)
          }
        }
        activeClients = kept
        // ↩️ LOAN returns — strategic loan client comes back grown
        activeClients = activeClients.map(c => {
          if (c.loanReturnYear !== undefined && newYear >= c.loanReturnYear) {
            const msg = c.onStrategicLoan
              ? `🔄 ${c.nickname} voltou do empréstimo no ${c.loanOriginClub} mais forte e valorizado!`
              : `↩️ ${c.nickname} voltou de empréstimo pro ${c.loanOriginClub} — mais maduro e valorizado.`
            extraNarrative.push(msg)
            return { ...c, contractClub: c.loanOriginClub ?? c.contractClub, loanOriginClub: undefined, loanReturnYear: undefined, onStrategicLoan: undefined }
          }
          return c
        })
      }

      // ── 📰 HISTORICAL EVENTS (year rollover) ──────────────────────────────
      let historicalRepBonus = 0
      let historicalMoneyBonus = 0
      if (yearRolled) {
        const yearEvents = getHistoricalEvents(newYear)
        for (const ev of yearEvents) {
          // Normalise to a flat list of boost groups (covers both `boosts[]` and legacy single fields)
          const groups = ev.boosts ?? [{
            specificIds: ev.specificIds,
            nationalityBoost: ev.nationalityBoost,
            positionBoost: ev.positionBoost,
            valueMultiplier: ev.valueMultiplier,
            happinessBonus: ev.happinessBonus,
          }]

          let anyAffected = false
          for (const grp of groups) {
            const matchFn = (c: { legendId: string; nationality: string; position: string }) =>
              (grp.specificIds?.includes(c.legendId) ?? false) ||
              (grp.nationalityBoost !== undefined && c.nationality === grp.nationalityBoost &&
                (grp.positionBoost === undefined || c.position === grp.positionBoost)) ||
              (grp.positionBoost !== undefined && grp.nationalityBoost === undefined && c.position === grp.positionBoost)

            activeClients = activeClients.map(c => {
              if (!matchFn(c)) return c
              anyAffected = true
              return {
                ...c,
                currentValue: grp.valueMultiplier ? Math.round(c.currentValue * grp.valueMultiplier) : c.currentValue,
                happiness: grp.happinessBonus ? Math.min(100, Math.max(0, c.happiness + grp.happinessBonus)) : c.happiness,
              }
            })
          }

          if (ev.reputationBonus) historicalRepBonus += ev.reputationBonus
          if (ev.moneyBonus) historicalMoneyBonus += ev.moneyBonus

          // Show in narrative if anything happened
          if (anyAffected || ev.reputationBonus || ev.moneyBonus) {
            extraNarrative.push(`📰 ${ev.title} — ${ev.text}`)
          }
        }
      }

      // ── 🔔 DEADLINE DAY ────────────────────────────────────────────────────
      const isDeadline = isDeadlineDay(actualWeek)
      if (isDeadline) {
        extraNarrative.push(`⏰ DIA D DE TRANSFERÊNCIAS! A janela fecha HOJE. Clubes estão desesperados, valores inflacionam e propostas chegam a qualquer hora. Este é o momento de fechar.`)
      }

      // Weekly expenses: client fees + scout retainers + office maintenance (all paid monthly = every 4 weeks)
      const scoutMonthlyCost = SCOUT_UPGRADES
        .filter(u => state.purchasedUpgrades.includes(u.id))
        .reduce((sum, u) => sum + (u.monthlyCost ?? 0), 0)
      const officeMonthlyCost = OFFICE_UPGRADES
        .filter(u => state.purchasedUpgrades.includes(u.id))
        .reduce((sum, u) => sum + (u.monthlyCost ?? 0), 0)
      const weeklyFixedCost = (scoutMonthlyCost + officeMonthlyCost) / 4
      const weeklyExpense = activeClients.reduce((sum, c) => sum + c.monthlyFee / 4, 0) + weeklyFixedCost
      let runningMoney = state.money - weeklyExpense
      if (actualWeek % 4 === 0) {
        if (scoutMonthlyCost > 0) extraNarrative.push(`🔭 Mensalidade dos olheiros: -R$${scoutMonthlyCost.toLocaleString('pt-BR')}`)
        if (officeMonthlyCost > 0) extraNarrative.push(`🏢 Manutenção dos escritórios: -R$${officeMonthlyCost.toLocaleString('pt-BR')}`)
      }

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
          c.currentRating >= 68 &&
          !c.injuredUntilWeek &&                  // no offers while injured
          !newOffers.find(o => o.clientId === c.legendId) &&
          (c.lastDealYear === undefined || newYear - c.lastDealYear >= 3)
        )
        // Window open → 55% + shot at second. Off-window → raro (15%).
        // Deadline Day: pressão máxima se janela estiver aberta.
        const maxOffers = isDeadline ? 3 : windowOpen ? 2 : 1
        const chance = isDeadline ? 0.95 : windowOpen ? 0.55 : 0.15
        const pool = [...eligible].sort(() => Math.random() - 0.5)
        for (let i = 0; i < maxOffers && i < pool.length; i++) {
          if (Math.random() < chance) {
            const offer = generateClubOffer(pool[i], newYear, state.clubRelations, state.purchasedUpgrades)
            if (offer) newOffers.push(offer)
          }
        }
      }

      // 🔥 NEMESIS — behavior differs by mode
      let nemesisTaken = state.nemesisTaken
      let nemesisAlert = state.nemesisAlert
      let nemesisShown = state.nemesisShown
      let negotiationLog = state.negotiationLog
      let lostLegends = [...state.lostLegends]

      // Todos jogadores (você, CPU, online) fecham SOMENTE via leilão ou draft.
      // Cambalhota compete nos mesmos leilões/drafts — sem roubo direto de mercado livre.
      const nowAbs = newYear * 52 + actualWeek
      const hotTargets: Record<string, number> = {}

      // 🌟 Cambalhota ameaça contratos prestes a vencer — compita em leilões pra não perder clientes
      if (yearRolled) {
        for (const client of activeClients) {
          const repExpiring = client.repExpiresYear !== undefined && client.repExpiresYear === newYear
          const playExpiring = client.contractExpiresYear !== undefined && client.contractExpiresYear === newYear
          if ((repExpiring || playExpiring) && Math.random() < 0.55) {
            const contractType = repExpiring ? 'representação' : 'clube'
            if (!state.nemesisShown) {
              nemesisShown = true
              nemesisAlert = {
                legendId: client.legendId,
                legendNickname: client.nickname,
                story: `${NEMESIS.story}\n\n👁️ E ele já está de olho: o contrato de ${contractType} de ${client.nickname} vence ESTE ANO. Renove antes que ele apareça.`,
                isFirst: true,
              }
            } else {
              nemesisAlert = {
                legendId: client.legendId,
                legendNickname: client.nickname,
                story: `👁️ ${NEMESIS.name} foi visto conversando com ${client.nickname}. O contrato de ${contractType} dele vence este ano — renove logo.`,
                isFirst: false,
              }
            }
            negotiationLog = [{ who: 'rival' as const, year: newYear, text: `👁️ Cambalhota está de olho em ${client.nickname} — contrato de ${contractType} vence em ${newYear}.` }, ...negotiationLog].slice(0, 30)
            break
          }
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

      // Weekly event (personalized with the player's name)
      const clientsLite: ClientLite[] = activeClients.map(c => ({
        legendId: c.legendId, nickname: c.nickname, name: c.name, position: c.position, currentRating: c.currentRating,
        status: c.status, personality: c.personality, nationality: c.nationality,
        birthYear: c.birthYear, currentValue: c.currentValue, peakYearStart: c.peakYearStart,
        contractClub: c.contractClub,
      }))
      const newEvent = generateWeeklyEvent(newYear, actualWeek, clientsLite, state.purchasedUpgrades)
      // Legend-specific backstory events (fire once per game, mid-year only)
      const existingEventIds = state.events.map(e => e.id)
      const legendBackstoryEvents = getLegendEvents(
        newYear,
        actualWeek,
        activeClients.map(c => c.legendId),
        existingEventIds,
      ).map(le => ({
        id: le.id,
        week: actualWeek,
        year: newYear,
        type: le.type as GameEvent['type'],
        title: le.title,
        description: le.description,
        choices: le.choices as GameEvent['choices'],
        resolved: false,
      } satisfies GameEvent))
      // Keep unresolved events + add new ones. If a new weekly event fires, clear old unresolved weekly events first.
      const priorEvents = newEvent
        ? state.events.filter(e => e.resolved)  // clear old unresolved on new weekly event
        : state.events                           // keep all (including pending) if no new event
      const newEvents = [
        ...priorEvents,
        ...(newEvent ? [newEvent] : []),
        ...legendBackstoryEvents,
      ]

      // 🏆 RIVAL AGENTS grow + EMPRESÁRIO DO ANO + 🕵️ INVESTIGATION (year rollover)
      let rivalAgents = state.rivalAgents
      let awards = state.awards
      let suspicion = state.suspicion
      let money2 = runningMoney + historicalMoneyBonus
      let reputation2 = Math.min(100, state.reputation + historicalRepBonus)
      if (yearRolled) {
        rivalAgents = state.rivalAgents.map(r => {
          const growth = 1.08 + Math.random() * 0.22
          const cambBonus = r.id === 'cambalhota' ? nemesisTaken.length * 250000 + r.wealth * 0.1 : 0
          // In CPU mode, each rival earns commission income from their signed legends
          const cpuIncome = state.onlineMode === 'cpu'
            ? r.clients.reduce((sum, id) => {
                const lg = getLegendById(id)
                return lg ? sum + Math.round(getMarketValue(lg, newYear) * 0.08) : sum
              }, 0)
            : 0
          return { ...r, wealth: Math.round(r.wealth * growth + cambBonus + cpuIncome) }
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
        // Suspicion never decays on its own — only dirty actions increase it.
        // Only a full 100% hit (triggered in DIRTY_ACTION) resets it to 0.
        if (suspicion >= 80) {
          extraNarrative.push(`⚠️ SUSPEITA CRÍTICA (${suspicion}/100)! Mais uma ação sujaа e você perde TUDO.`)
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

      // 🌩️ GAME END: the lightning returns on 30/06/2026
      const gameOver = newYear > 2026 || (newYear === 2026 && actualWeek >= 26)

      // ── CPU DRAFT / LEILÃO ────────────────────────────────────────────────────
      let cpuDraftWindowActive = false
      let cpuCurrentAuction: AuctionState | null = null
      let cpuRivalAgents = rivalAgents
      let cpuTakenLegends = { ...state.onlineTakenLegends }
      let seenLegendIds = state.seenLegendIds

      // Sempre estruturado: onlineGameMode é nunca null (START_GAME força 'leilao' como fallback)
      if (!gameOver && state.onlineMode === 'cpu' && actualWeek % 4 === 0) {
        const periodsElapsed = (newYear - 1993) * 13 + Math.floor((actualWeek - 1) / 4)
        const isDraftTurn = state.onlineGameMode === 'leilao'
          ? false
          : state.onlineGameMode === 'draft'
          ? true
          : periodsElapsed % 2 === 0  // draft-leilao alternates

        const allCpuSignedIds = new Set(cpuRivalAgents.flatMap(r => r.clients))
        const playerSignedIds = new Set(activeClients.map(c => c.legendId))
        // Mesma pool que o player vê — inclui pooledLegends (devolvidos ao leilão/draft)
        const pooledIds = state.pooledLegends
        const availableForCpu = LEGENDS.filter(l =>
          !allCpuSignedIds.has(l.id) &&
          !playerSignedIds.has(l.id) &&
          !lostLegends.includes(l.id) &&
          (
            pooledIds.includes(l.id) ||
            (newYear >= l.emergenceYear - 2 && newYear <= l.emergenceYear && l.birthYear <= newYear - 10)
          )
        ).sort((a, b) => getCurrentRating(b, newYear) - getCurrentRating(a, newYear))

        if (isDraftTurn && availableForCpu.length > 0) {
          // CPU draft: each rival auto-picks their preferred legend
          let pickPool = [...availableForCpu]
          cpuRivalAgents = cpuRivalAgents.map(agent => {
            if (pickPool.length === 0) return agent
            const isCambalhota = agent.id === 'cambalhota'
            const sliceSize = isCambalhota ? 3 : 10
            const pickIdx = Math.floor(Math.random() * Math.min(sliceSize, pickPool.length))
            const picked = pickPool[pickIdx]
            pickPool = pickPool.filter(l => l.id !== picked.id)
            const cost = Math.round(picked.signingFee * 0.8 + picked.luva * 0.8)
            cpuTakenLegends[picked.id] = { playerIndex: cpuRivalAgents.indexOf(agent) + 1, playerName: agent.name }
            return {
              ...agent,
              clients: [...agent.clients, picked.id],
              wealth: Math.max(0, agent.wealth - cost),
            }
          })
          cpuDraftWindowActive = true
          extraNarrative.push(`📋 JANELA DE DRAFT! Os rivais escolheram suas lendas — agora é SUA VEZ. Assine alguém na aba Radar.`)
          // First window ever: introduce Cambalhota
          if (!nemesisShown) {
            nemesisShown = true
            nemesisAlert = {
              legendId: '',
              legendNickname: '',
              story: NEMESIS.story + `\n\nEle já escolheu no draft. Você vai deixar ele ganhar?`,
              isFirst: true,
            }
          }
        } else if (!isDraftTurn && availableForCpu.length > 0) {
          // CPU leilão: pick best available for auction, pre-fill CPU bids
          const auctionTarget = availableForCpu[0]
          const legendValue = getMarketValue(getLegendById(auctionTarget.id)!, newYear)
          // Cambalhota (idx 0) always bids; pick 3 random others
          const others = cpuRivalAgents.slice(1).sort(() => Math.random() - 0.5).slice(0, 3)
          const bidders = [cpuRivalAgents[0], ...others]
          const bidderRivalIndices = bidders.map(b => cpuRivalAgents.indexOf(b))
          const bids: Record<number, number> = {}
          bidderRivalIndices.forEach((rivalIdx, i) => {
            const agent = cpuRivalAgents[rivalIdx]
            const budget = Math.min(agent.wealth * 0.35, agent.budget * 4, legendValue * 2)
            const aggressiveness = rivalIdx === 0 ? (0.55 + Math.random() * 0.45) : (0.2 + Math.random() * 0.5)
            bids[i + 1] = Math.max(10000, Math.round(budget * aggressiveness / 1000) * 1000)
          })
          cpuCurrentAuction = {
            legendId: auctionTarget.id,
            bids,
            endsAt: Date.now() + 3_600_000,
            closed: false,
            cpuBidderRivalIndices: bidderRivalIndices,
          }
          // Mark legend as seen the moment it enters the auction so it appears in album
          if (!seenLegendIds.includes(auctionTarget.id)) {
            seenLegendIds = [...seenLegendIds, auctionTarget.id]
          }
          const legend = getLegendById(auctionTarget.id)
          extraNarrative.push(`🔨 LEILÃO ABERTO! ${legend?.nickname ?? '???'} entrou em disputa. Lance seu valor no Radar ou os rivais levam.`)
          // First auction ever: introduce Cambalhota as the main rival bidder
          if (!nemesisShown) {
            nemesisShown = true
            nemesisAlert = {
              legendId: '',
              legendNickname: '',
              story: NEMESIS.story + `\n\n🔨 E ele já está no leilão disputando ${legend?.nickname ?? 'uma lenda'} contra você. Ele sempre vai contra você — lance com estratégia.`,
              isFirst: true,
            }
          }
        }
      }

      return {
        ...state,
        screen: gameOver ? 'end' : state.screen,
        week: actualWeek,
        year: newYear,
        money: Math.max(0, money2),
        reputation: Math.min(100, reputation2),
        suspicion,
        awards,
        rivalAgents: cpuRivalAgents,
        clients: activeClients,
        pendingOffers: newOffers,
        events: newEvents,
        actionsUsed: 0,
        weeklyExpenses: weeklyExpense,
        nemesisTaken,
        nemesisAlert,
        nemesisShown,
        negotiationLog,
        lostLegends,
        hotTargets,
        saleStreak,
        weeklyMissionId,
        weeklyMissionBaseline,
        weeklyMissionClaimed,
        draftWindowActive: cpuDraftWindowActive,
        currentAuction: cpuCurrentAuction,
        onlineTakenLegends: cpuTakenLegends,
        seenLegendIds,
        narrative: [...state.narrative, ...extraNarrative],
        suspendedUntilWeek: state.suspendedUntilWeek,
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
      const earnings = Math.round(base * comboMult)
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
        clubRelations: { ...state.clubRelations, [action.clubName]: Math.min(100, (state.clubRelations[action.clubName] ?? 0) + 12) },
        pendingOffers: state.pendingOffers.filter(o => o.clientId !== offer.clientId),
        clients: state.clients.map(c =>
          c.legendId === offer.clientId
            ? { ...c, contractClub: action.clubName, contractSalary: offer.salary, contractExpiresYear: state.year + offer.contractYears, lastDealYear: state.year, happiness: Math.min(100, c.happiness + 20), lowHappinessWeeks: 0 }
            : c
        ),
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `✅ ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')} · você embolsou R$${earnings.toLocaleString('pt-BR')}` }, ...state.negotiationLog].slice(0, 30),
        narrative: [
          ...state.narrative,
          `🤝 TRANSFERÊNCIA FECHADA! ${client?.nickname} → ${action.clubName} por R$${action.amount.toLocaleString('pt-BR')}. Você embolsou R$${earnings.toLocaleString('pt-BR')} (comissão R$${commission.toLocaleString('pt-BR')} + luva R$${action.clubLuva.toLocaleString('pt-BR')}).`,
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
      const isScout = action.upgradeId.startsWith('scout-')
      const isOffice = action.upgradeId.startsWith('office-')
      const isLife = action.upgradeId.startsWith('life-')
      const repBoost = action.repGain ?? (isScout ? 3 : 0)
      return {
        ...state,
        money: state.money - action.cost,
        purchasedUpgrades: [...state.purchasedUpgrades, action.upgradeId],
        scoutSlots: isScout ? state.scoutSlots + 2 : state.scoutSlots,
        reputation: Math.min(100, state.reputation + repBoost),
        narrative: [
          ...state.narrative,
          isScout ? `🔭 Novo olheiro contratado! ${action.effect}`
            : isOffice ? `🏢 Escritório aberto! ${action.effect}`
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
      localStorage.removeItem('empresario-v2')
      return { ...INITIAL_STATE }

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

    case 'LEGEND_TAKEN_ONLINE': {
      return {
        ...state,
        onlineTakenLegends: {
          ...state.onlineTakenLegends,
          [action.legendId]: { playerIndex: action.playerIndex, playerName: action.playerName },
        },
      }
    }

    case 'PLAYER_UPDATE_ONLINE': {
      const existing = state.onlinePlayers.find(p => p.playerIndex === action.playerIndex)
      const updated: OnlinePlayer = { playerIndex: action.playerIndex, playerName: action.playerName, money: action.money, totalDeals: action.totalDeals }
      return {
        ...state,
        onlinePlayers: existing
          ? state.onlinePlayers.map(p => p.playerIndex === action.playerIndex ? updated : p)
          : [...state.onlinePlayers, updated],
      }
    }

    case 'SET_PRESENCE':
      return { ...state, onlinePresence: action.indices }

    case 'DRAFT_ADVANCE': {
      const n = state.playerNames.length || 1
      const done = action.picksDone
      const round = Math.floor(done / n)
      const pos = done % n
      const nextTurn = round % 2 === 0 ? pos : n - 1 - pos
      return { ...state, draftTurn: nextTurn, draftPicksDone: done }
    }

    case 'AUCTION_SET':
      return { ...state, currentAuction: action.auction }

    case 'AUCTION_BID': {
      if (!state.currentAuction) return state
      return {
        ...state,
        currentAuction: {
          ...state.currentAuction,
          bids: { ...state.currentAuction.bids, [action.playerIndex]: action.amount },
        },
      }
    }

    case 'AUCTION_WIN': {
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
        commissionRate: 15,
        repContractYears: 3,
        repExpiresYear: state.year + 3,
        happiness: 75,
        currentValue,
        signedYear: state.year,
        contractClub: legend.club,
        contractSalary: legend.monthlyFee * 10,
        contractExpiresYear: state.year + 2,
        rivalOffers: 0,
      }
      const weeklyExpenses = state.clients.reduce((sum, c) => sum + c.monthlyFee, 0) / 4 + legend.monthlyFee / 4
      const xpr = applyXp(state, 60)
      return {
        ...state,
        money: state.money - action.bidAmount,
        clients: [...state.clients, newClient],
        weeklyExpenses,
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + xpr.repBonus),
        everSignedIds: state.everSignedIds.includes(action.legendId) ? state.everSignedIds : [...state.everSignedIds, action.legendId],
        seenLegendIds: state.seenLegendIds.includes(action.legendId) ? state.seenLegendIds : [...state.seenLegendIds, action.legendId],
        currentAuction: null,
        narrative: [...state.narrative,
          `🏆 LEILÃO GANHO! Você venceu o leilão de ${legend.nickname} com lance de R$${action.bidAmount.toLocaleString('pt-BR')}. 15% de comissão negociada.`,
          ...(xpr.line ? [xpr.line] : []),
        ],
      }
    }

    case 'REP_SOLD': {
      const sold = state.clients.find(c => c.legendId === action.legendId)
      const nick = sold?.nickname ?? 'cliente'
      const xpr = applyXp(state, 40)
      return {
        ...state,
        money: state.money + action.saleAmount,
        totalEarned: state.totalEarned + action.saleAmount,
        totalDeals: state.totalDeals + 1,
        xp: xpr.xp,
        reputation: Math.min(100, state.reputation + xpr.repBonus),
        clients: state.clients.filter(c => c.legendId !== action.legendId),
        weeklyExpenses: state.clients.filter(c => c.legendId !== action.legendId).reduce((s, c) => s + c.monthlyFee / 4, 0),
        currentAuction: null,
        negotiationLog: [{ who: 'voce' as const, year: state.year, text: `💼 Você vendeu o contrato de ${nick} por R$${action.saleAmount.toLocaleString('pt-BR')}` }, ...state.negotiationLog].slice(0, 30),
        narrative: [...state.narrative,
          `💼 CONTRATO VENDIDO! ${nick} trocou de agente — você embolsou R$${action.saleAmount.toLocaleString('pt-BR')}.`,
          ...(xpr.line ? [xpr.line] : []),
        ],
      }
    }

    case 'DRAFT_WINDOW_SET':
      return { ...state, draftWindowActive: action.active }

    case 'SKIP_CPU_DRAFT':
      return { ...state, draftWindowActive: false }

    case 'CPU_AUCTION_CLOSE': {
      if (!state.currentAuction) return state
      return resolveCpuAuction(state, state.currentAuction)
    }

    case 'CPU_AUCTION_BID_AND_CLOSE': {
      if (!state.currentAuction) return state
      const auction = state.currentAuction
      const bids = action.amount > 0
        ? { ...auction.bids, [state.youIndex]: action.amount }
        : auction.bids
      return resolveCpuAuction(state, { ...auction, bids })
    }

    case 'ONLINE_NEWS_ADD':
      return { ...state, onlineNews: [action.item, ...state.onlineNews].slice(0, 50) }

    case 'PLAYER_ROSTER_UPDATE': {
      const prevRoster = state.onlinePlayerRosters[action.playerIndex] ?? []
      const newIds = new Set(action.clients.map(c => c.legendId))
      const freed = prevRoster.filter(c => !newIds.has(c.legendId)).map(c => c.legendId)
      const newTaken = { ...state.onlineTakenLegends }
      for (const id of freed) {
        if (newTaken[id]?.playerIndex === action.playerIndex) delete newTaken[id]
      }
      return {
        ...state,
        onlinePlayerRosters: { ...state.onlinePlayerRosters, [action.playerIndex]: action.clients },
        onlineTakenLegends: newTaken,
      }
    }

    case 'PUT_IN_POOL': {
      const client = state.clients.find(c => c.legendId === action.legendId)
      if (!client) return state
      const mode = state.onlineGameMode
      const modeLabel = mode === 'draft' ? 'draft' : 'leilão'
      return {
        ...state,
        clients: state.clients.filter(c => c.legendId !== action.legendId),
        pooledLegends: state.pooledLegends.includes(action.legendId)
          ? state.pooledLegends
          : [...state.pooledLegends, action.legendId],
        weeklyExpenses: state.clients
          .filter(c => c.legendId !== action.legendId)
          .reduce((s, c) => s + (c.monthlyFee ?? 0), 0),
        narrative: [...state.narrative, `🔄 Você colocou ${client.nickname} de volta no ${modeLabel}. Outro agente pode assinar.`],
      }
    }

    case 'DIRTY_ACTION': {
      const nowAbsDirty = state.year * 52 + state.week
      function applyDirty(nextState: GameState): GameState {
        if (nextState.suspicion < 100) return nextState
        // 💥 SUSPEITA 100% — perda de todos os clientes, suspensão de 8 semanas
        const releasedNicknames = nextState.clients.map(c => c.nickname)
        const releasedIds = nextState.clients.map(c => c.legendId)
        return {
          ...nextState,
          suspicion: 0,
          clients: [],
          weeklyExpenses: 0,
          suspendedUntilWeek: nowAbsDirty + 8,
          pooledLegends: [...new Set([...nextState.pooledLegends, ...releasedIds])],
          nemesisTaken: [...nextState.nemesisTaken, ...releasedIds.filter(id => !nextState.nemesisTaken.includes(id))],
          onlineTakenLegends: {},
          narrative: [...nextState.narrative,
            `🚨 INVESTIGAÇÃO FEDERAL! A federação confiscou sua licença. ${releasedNicknames.join(', ')} voltaram ao ${nextState.onlineGameMode === 'draft' ? 'draft' : 'leilão'} — você está SUSPENSO por 8 semanas e só pode assistir.`,
          ],
        }
      }

      if (action.kind === 'maquiar') {
        return applyDirty({
          ...state,
          money: state.money + 800_000,
          suspicion: Math.min(100, state.suspicion + 16),
          narrative: [...state.narrative, `💵 Você maquiou uma transferência e desviou R$800.000 pro seu caixa dois. Suspeita subiu.`],
        })
      }
      if (action.kind === 'imprensa') {
        return applyDirty({
          ...state,
          reputation: Math.min(100, state.reputation + 15),
          suspicion: Math.min(100, state.suspicion + 10),
          narrative: [...state.narrative, `🤐 Você subornou a imprensa. +15 de reputação na marra.`],
        })
      }
      if (action.kind === 'apostar') {
        // Bet on a match you know the result — big money, big risk
        const prize = 1_500_000 + Math.round(Math.random() * 1_000_000)
        return applyDirty({
          ...state,
          money: state.money + prize,
          totalEarned: state.totalEarned + prize,
          suspicion: Math.min(100, state.suspicion + 22),
          narrative: [...state.narrative, `🎰 Você apostou sabendo o resultado e embolsou R$${prize.toLocaleString('pt-BR')}. Perigoso mas lucrativo.`],
        })
      }
      // arbitro — big boost on best client
      const best = [...state.clients].sort((a, b) => b.currentValue - a.currentValue)[0]
      if (!best) return state
      return applyDirty({
        ...state,
        suspicion: Math.min(100, state.suspicion + 18),
        clients: state.clients.map(c =>
          c.legendId === best.legendId
            ? { ...c, currentValue: Math.round(c.currentValue * 1.35), happiness: Math.min(100, c.happiness + 15) }
            : c
        ),
        narrative: [...state.narrative, `⚖️ Você comprou a arbitragem pra ${best.nickname} brilhar. Valor +35% e moral explodiu.`],
      })
    }

    case 'LOAN_CLIENT': {
      const loanClubs = ['Fluminense', 'Vasco da Gama', 'Santos', 'Cruzeiro', 'Grêmio', 'Botafogo', 'Atlético Mineiro', 'Colo-Colo', 'Nacional', 'Club Brugge']
      const club = action.loanClub || loanClubs[Math.floor(Math.random() * loanClubs.length)]
      return {
        ...state,
        clients: state.clients.map(c =>
          c.legendId === action.legendId
            ? { ...c, onStrategicLoan: true, loanOriginClub: club, loanReturnYear: state.year + action.loanYears, contractClub: club }
            : c
        ),
        narrative: [...state.narrative, `✈️ EMPRÉSTIMO ESTRATÉGICO! Você emprestou ${state.clients.find(c => c.legendId === action.legendId)?.nickname} ao ${club} por ${action.loanYears} ano(s). Ele vai crescer mais rápido lá.`],
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
  const saved = localStorage.getItem('empresario-v2')
  let initial: GameState = INITIAL_STATE
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const hasProgress = (parsed.clients?.length ?? 0) > 0 || (parsed.week ?? 1) > 1 ||
        (parsed.year ?? 1993) > 1993 || (parsed.totalDeals ?? 0) > 0
      // Resume an in-progress game straight at the dashboard. Always reset
      // online fields on reload — room sessions don't survive a refresh.
      // Migrate rivals: merge full pool with any saved clients/wealth by agent id
      const storedRivals: RivalAgent[] = parsed.rivalAgents ?? []
      const mergedRivals = CPU_AGENT_POOL.map(agent => {
        const s = storedRivals.find(r => r.id === agent.id)
        return s ? { ...agent, clients: s.clients, wealth: s.wealth } : agent
      })
      initial = {
        ...INITIAL_STATE,
        ...parsed,
        rivalAgents: mergedRivals,
        nemesisAlert: null,
        onlineMode: 'cpu',
        roomCode: '',
        isHost: false,
        playerNames: [],
        youIndex: 0,
        onlineGameMode: parsed.onlineGameMode ?? 'leilao',
        draftTurn: 0,
        draftPicksDone: 0,
        currentAuction: null,
        onlineTakenLegends: {},
        onlinePlayers: [],
        onlinePresence: [],
        suspendedUntilWeek: parsed.suspendedUntilWeek ?? 0,
        pooledLegends: parsed.pooledLegends ?? [],
        screen: hasProgress ? 'dashboard' : 'lobby',
      }
    } catch {
      initial = INITIAL_STATE
    }
  }

  const [state, dispatch] = useReducer(empresarioReducer, initial)

  // Persist (never persist lobby/intro/accident — those are transient)
  if (state.screen !== 'lobby' && state.screen !== 'intro' && state.screen !== 'accident') {
    localStorage.setItem('empresario-v2', JSON.stringify(state))
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
