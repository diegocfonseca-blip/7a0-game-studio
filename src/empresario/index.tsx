import { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { EmpresarioProvider, useEmpresario } from './store'
import { supabase } from '../lib/supabase'
import LobbyScreen from './screens/LobbyScreen'
import IntroScreen from './screens/IntroScreen'
import DashboardScreen from './screens/DashboardScreen'
import ScoutsScreen from './screens/ScoutsScreen'
import NegotiationsScreen from './screens/NegotiationsScreen'
import FinanceScreen from './screens/FinanceScreen'
import RankingScreen from './screens/RankingScreen'
import AlbumScreen from './screens/AlbumScreen'
import type { OnlineNewsItem, OnlineClientInfo } from './types'

// ── Broadcast context so any screen can send realtime events ──────────────────
type BroadcastFn = (event: string, payload: Record<string, unknown>) => void
const BroadcastContext = createContext<BroadcastFn>(() => {})
export function useBroadcast() { return useContext(BroadcastContext) }

function EmpresarioRouter() {
  const { state, dispatch } = useEmpresario()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const broadcast = useCallback<BroadcastFn>((event, payload) => {
    channelRef.current?.send({ type: 'broadcast', event, payload })
  }, [])

  // Always start a screen at the top — never land mid-scroll on a new tab
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen])

  // ── ONLINE SYNC ──
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomCode || state.screen === 'lobby' || state.screen === 'intro') {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    if (channelRef.current) return

    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    const ch = supabase.channel(`empresario-${state.roomCode}`, {
      config: { presence: { key: String(state.youIndex) } },
    })

    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState<{ name: string; index: number }>()
      const indices = Object.keys(pState).map(Number).filter(n => !isNaN(n))
      dispatch({ type: 'SET_PRESENCE', indices })
    })

    ch.on('broadcast', { event: 'legend_taken' }, ({ payload }) => {
      dispatch({
        type: 'LEGEND_TAKEN_ONLINE',
        legendId: payload.legendId,
        playerIndex: payload.playerIndex,
        playerName: payload.playerName,
      })
    })

    ch.on('broadcast', { event: 'player_update' }, ({ payload }) => {
      dispatch({
        type: 'PLAYER_UPDATE_ONLINE',
        playerIndex: payload.playerIndex,
        playerName: payload.playerName,
        money: payload.money,
        totalDeals: payload.totalDeals,
      })
    })

    // ── Draft: someone signed → advance turn for everyone ────────────────────
    ch.on('broadcast', { event: 'draft_next' }, ({ payload }) => {
      dispatch({ type: 'DRAFT_ADVANCE', picksDone: payload.picksDone })
    })

    // ── Draft window open/close ───────────────────────────────────────────────
    ch.on('broadcast', { event: 'draft_window_open' }, () => {
      dispatch({ type: 'DRAFT_WINDOW_SET', active: true })
    })
    ch.on('broadcast', { event: 'draft_window_close' }, () => {
      dispatch({ type: 'DRAFT_WINDOW_SET', active: false })
    })

    // ── Online news: significant actions shared with everyone ─────────────────
    ch.on('broadcast', { event: 'online_news' }, ({ payload }) => {
      dispatch({ type: 'ONLINE_NEWS_ADD', item: payload as OnlineNewsItem })
    })

    // ── Player roster: client list from each player ───────────────────────────
    ch.on('broadcast', { event: 'player_roster' }, ({ payload }) => {
      dispatch({
        type: 'PLAYER_ROSTER_UPDATE',
        playerIndex: payload.playerIndex as number,
        clients: payload.clients as OnlineClientInfo[],
      })
    })

    // ── Leilão: alguém abriu leilão (mercado ou venda de contrato) ───────────
    ch.on('broadcast', { event: 'auction_start' }, ({ payload }) => {
      dispatch({
        type: 'AUCTION_SET',
        auction: {
          legendId: payload.legendId,
          bids: {},
          endsAt: Date.now() + 60_000,
          closed: false,
          sellerIndex: payload.sellerIndex !== undefined ? Number(payload.sellerIndex) : undefined,
        },
      })
    })

    // ── Leilão: someone placed a bid ─────────────────────────────────────────
    ch.on('broadcast', { event: 'auction_bid' }, ({ payload }) => {
      dispatch({ type: 'AUCTION_BID', playerIndex: payload.playerIndex, amount: payload.amount })
    })

    // ── Leilão: fechou — mercado ou venda de contrato ─────────────────────────
    ch.on('broadcast', { event: 'auction_close' }, ({ payload }) => {
      const sellerIdx = payload.sellerIndex as number
      const isRepTransfer = sellerIdx >= 0
      if (isRepTransfer) {
        if (payload.winnerIndex === sellerIdx) {
          dispatch({ type: 'AUCTION_SET', auction: null })
        } else if (payload.winnerIndex === state.youIndex) {
          dispatch({ type: 'AUCTION_WIN', legendId: payload.legendId, bidAmount: payload.winnerAmount })
        } else if (sellerIdx === state.youIndex) {
          dispatch({ type: 'REP_SOLD', legendId: payload.legendId, saleAmount: payload.winnerAmount })
        } else {
          dispatch({ type: 'AUCTION_SET', auction: null })
        }
      } else {
        if (payload.winnerIndex === state.youIndex) {
          dispatch({ type: 'AUCTION_WIN', legendId: payload.legendId, bidAmount: payload.winnerAmount })
        } else {
          dispatch({ type: 'AUCTION_SET', auction: null })
        }
      }
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: myName, index: state.youIndex })
        ch.send({
          type: 'broadcast',
          event: 'player_update',
          payload: { playerIndex: state.youIndex, playerName: myName, money: state.money, totalDeals: state.totalDeals },
        })
      }
    })

    channelRef.current = ch
    return () => {
      ch.unsubscribe()
      channelRef.current = null
    }
  }, [state.onlineMode, state.roomCode, state.screen])

  // Broadcast legend_taken + player_update + news when client list grows
  const prevClientCount = useRef(state.clients.length)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    const grew = state.clients.length > prevClientCount.current
    prevClientCount.current = state.clients.length
    if (!grew) return
    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    const newest = state.clients[state.clients.length - 1]
    if (newest) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'legend_taken',
        payload: { legendId: newest.legendId, playerIndex: state.youIndex, playerName: myName },
      })
      channelRef.current.send({
        type: 'broadcast',
        event: 'online_news',
        payload: {
          id: `news-sign-${newest.legendId}-${Date.now()}`,
          playerIndex: state.youIndex,
          playerName: myName,
          text: `✍️ ${myName} assinou ${newest.nickname} (${newest.position})`,
          timestamp: Date.now(),
        } satisfies OnlineNewsItem,
      })
    }
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: { playerIndex: state.youIndex, playerName: myName, money: state.money, totalDeals: state.totalDeals },
    })
  }, [state.clients.length])

  // Broadcast player roster whenever client list changes (adds or removes)
  const prevClientKey = useRef('')
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    const key = state.clients.map(c => c.legendId).join(',')
    if (key === prevClientKey.current) return
    prevClientKey.current = key
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_roster',
      payload: {
        playerIndex: state.youIndex,
        clients: state.clients.map(c => ({
          legendId: c.legendId,
          nickname: c.nickname,
          position: c.position,
          nationality: c.nationality,
          currentRating: c.currentRating,
          commissionRate: c.commissionRate,
          repExpiresYear: c.repExpiresYear,
          contractClub: c.contractClub,
        }) satisfies OnlineClientInfo),
      },
    })
  }, [state.clients.length])

  // Broadcast draft_next when draftPicksDone increments (we just signed in draft mode)
  // Host also closes draft window when all players have picked
  const prevDraftPicks = useRef(state.draftPicksDone)
  const picksAtWindowOpen = useRef(0)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.draftPicksDone === prevDraftPicks.current) return
    prevDraftPicks.current = state.draftPicksDone
    channelRef.current.send({
      type: 'broadcast',
      event: 'draft_next',
      payload: { picksDone: state.draftPicksDone },
    })
    // Host: close draft window when all players in this round have picked
    if (state.isHost && state.draftWindowActive) {
      const n = Math.max(1, state.playerNames.length)
      if (state.draftPicksDone - picksAtWindowOpen.current >= n) {
        channelRef.current.send({ type: 'broadcast', event: 'draft_window_close', payload: {} })
        dispatch({ type: 'DRAFT_WINDOW_SET', active: false })
      }
    }
  }, [state.draftPicksDone])

  // Host opens draft window every 4 weeks in draft mode
  const prevWeek = useRef(state.week)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current || !state.isHost) return
    if (state.week === prevWeek.current) return
    prevWeek.current = state.week
    const isDraft = state.onlineGameMode === 'draft' || state.onlineGameMode === 'draft-leilao'
    if (isDraft && state.week % 4 === 0 && !state.draftWindowActive) {
      picksAtWindowOpen.current = state.draftPicksDone
      channelRef.current.send({ type: 'broadcast', event: 'draft_window_open', payload: {} })
      dispatch({ type: 'DRAFT_WINDOW_SET', active: true })
    }
  }, [state.week])

  // Broadcast online news when upgrades are purchased
  const prevUpgradeCount = useRef(state.purchasedUpgrades.length)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.purchasedUpgrades.length <= prevUpgradeCount.current) {
      prevUpgradeCount.current = state.purchasedUpgrades.length
      return
    }
    prevUpgradeCount.current = state.purchasedUpgrades.length
    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    const newUpgradeId = state.purchasedUpgrades[state.purchasedUpgrades.length - 1] ?? ''
    const label = newUpgradeId.startsWith('scout-')
      ? `contratou olheiro (${newUpgradeId.replace('scout-', '')})`
      : newUpgradeId.startsWith('office-')
      ? `abriu escritório em ${newUpgradeId.replace('office-', '').toUpperCase()}`
      : newUpgradeId.startsWith('life-')
      ? `ostentou com novo estilo de vida`
      : `investiu na estrutura`
    channelRef.current.send({
      type: 'broadcast',
      event: 'online_news',
      payload: {
        id: `news-upg-${Date.now()}`,
        playerIndex: state.youIndex,
        playerName: myName,
        text: `💼 ${myName} ${label}`,
        timestamp: Date.now(),
      } satisfies OnlineNewsItem,
    })
  }, [state.purchasedUpgrades.length])

  // Broadcast player_update + news after deals close
  const prevDeals = useRef(state.totalDeals)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.totalDeals === prevDeals.current) return
    prevDeals.current = state.totalDeals
    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: { playerIndex: state.youIndex, playerName: myName, money: state.money, totalDeals: state.totalDeals },
    })
    // Find last deal from log to compose news text
    const log = state.negotiationLog[0]
    const text = log?.who === 'voce'
      ? `📰 ${log.text}`
      : `📰 ${myName} fechou mais um negócio!`
    channelRef.current.send({
      type: 'broadcast',
      event: 'online_news',
      payload: {
        id: `news-deal-${Date.now()}`,
        playerIndex: state.youIndex,
        playerName: myName,
        text,
        timestamp: Date.now(),
      } satisfies OnlineNewsItem,
    })
  }, [state.totalDeals])

  const screen = (() => {
    switch (state.screen) {
      case 'lobby':     return <LobbyScreen />
      case 'intro':     return <IntroScreen />
      case 'dashboard': return <DashboardScreen />
      case 'scouts':    return <ScoutsScreen />
      case 'offers':    return <NegotiationsScreen />
      case 'finance':   return <FinanceScreen />
      case 'ranking':   return <RankingScreen />
      case 'album':     return <AlbumScreen />
      default:          return <LobbyScreen />
    }
  })()

  return (
    <BroadcastContext.Provider value={broadcast}>
      {screen}
    </BroadcastContext.Provider>
  )
}

export default function EmpresarioGame() {
  return (
    <EmpresarioProvider>
      <EmpresarioRouter />
    </EmpresarioProvider>
  )
}
