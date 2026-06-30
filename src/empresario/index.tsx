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

  // Broadcast legend_taken + player_update when client list grows
  const prevClientCount = useRef(state.clients.length)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.clients.length <= prevClientCount.current) {
      prevClientCount.current = state.clients.length
      return
    }
    prevClientCount.current = state.clients.length
    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    const newest = state.clients[state.clients.length - 1]
    if (newest) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'legend_taken',
        payload: { legendId: newest.legendId, playerIndex: state.youIndex, playerName: myName },
      })
    }
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: { playerIndex: state.youIndex, playerName: myName, money: state.money, totalDeals: state.totalDeals },
    })
  }, [state.clients.length])

  // Broadcast draft_next when draftPicksDone increments (we just signed in draft mode)
  const prevDraftPicks = useRef(state.draftPicksDone)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.draftPicksDone === prevDraftPicks.current) return
    prevDraftPicks.current = state.draftPicksDone
    channelRef.current.send({
      type: 'broadcast',
      event: 'draft_next',
      payload: { picksDone: state.draftPicksDone },
    })
  }, [state.draftPicksDone])

  // Broadcast player_update after deals close
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
