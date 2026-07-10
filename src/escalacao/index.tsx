import { useEffect } from 'react'
import { EscProvider, useEsc } from './store'
import { EscIntro, EscSetup, EscAuction, EscMonte, EscCerimonia, EscSeason, EscEnd, EscAlbum } from './screens'
import { EscLobby } from './lobby'
import { AdminPanel } from './admin'

function Router() {
  const { state } = useEsc()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen, state.sectorIdx, state.phase])
  switch (state.screen) {
    case 'intro':     return <EscIntro />
    case 'lobby':     return <EscLobby />
    case 'setup':     return <EscSetup />
    case 'auction':   return <EscAuction />
    case 'monte':     return <EscMonte />
    case 'cerimonia': return <EscCerimonia />
    case 'season':    return <EscSeason />
    case 'end':       return <EscEnd />
    case 'album':     return <EscAlbum />
    default:          return <EscIntro />
  }
}

export default function EscalacaoGame() {
  return (
    <EscProvider>
      <Router />
      <AdminPanel />
    </EscProvider>
  )
}
