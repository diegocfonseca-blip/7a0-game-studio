import { useEffect, useRef } from 'react'
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

function EmpresarioRouter() {
  const { state, dispatch } = useEmpresario()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Always start a screen at the top — never land mid-scroll on a new tab
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen])

  // ── ONLINE SYNC ──
  // When in online mode (and past the lobby), maintain a Supabase Realtime
  // channel to share: which legends we signed + our current wealth.
  useEffect(() => {
    if (state.onlineMode !== 'online' || !state.roomCode || state.screen === 'lobby' || state.screen === 'intro') {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    if (channelRef.current) return // already connected

    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    const ch = supabase.channel(`empresario-${state.roomCode}`, {
      config: { presence: { key: String(state.youIndex) } },
    })

    // Track presence for online indicator
    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState<{ name: string; index: number }>()
      const indices = Object.keys(pState).map(Number).filter(n => !isNaN(n))
      dispatch({ type: 'SET_PRESENCE', indices })
    })

    // A rival signed a legend → mark it as taken for us
    ch.on('broadcast', { event: 'legend_taken' }, ({ payload }) => {
      dispatch({
        type: 'LEGEND_TAKEN_ONLINE',
        legendId: payload.legendId,
        playerIndex: payload.playerIndex,
        playerName: payload.playerName,
      })
    })

    // A rival's stats changed → update our rivals panel
    ch.on('broadcast', { event: 'player_update' }, ({ payload }) => {
      dispatch({
        type: 'PLAYER_UPDATE_ONLINE',
        playerIndex: payload.playerIndex,
        playerName: payload.playerName,
        money: payload.money,
        totalDeals: payload.totalDeals,
      })
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: myName, index: state.youIndex })
        // broadcast our initial stats
        ch.send({
          type: 'broadcast',
          event: 'player_update',
          payload: {
            playerIndex: state.youIndex,
            playerName: myName,
            money: state.money,
            totalDeals: state.totalDeals,
          },
        })
      }
    })

    channelRef.current = ch
    return () => {
      ch.unsubscribe()
      channelRef.current = null
    }
  }, [state.onlineMode, state.roomCode, state.screen])

  // Broadcast legend taken when our client list grows
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
    // also broadcast updated stats
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: {
        playerIndex: state.youIndex,
        playerName: myName,
        money: state.money,
        totalDeals: state.totalDeals,
      },
    })
  }, [state.clients.length])

  // Broadcast stat updates after deals close
  const prevDeals = useRef(state.totalDeals)
  useEffect(() => {
    if (state.onlineMode !== 'online' || !channelRef.current) return
    if (state.totalDeals === prevDeals.current) return
    prevDeals.current = state.totalDeals
    const myName = state.playerNames[state.youIndex] ?? 'Jogador'
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: {
        playerIndex: state.youIndex,
        playerName: myName,
        money: state.money,
        totalDeals: state.totalDeals,
      },
    })
  }, [state.totalDeals])

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
}

export default function EmpresarioGame() {
  return (
    <EmpresarioProvider>
      <EmpresarioRouter />
    </EmpresarioProvider>
  )
}
