import { useEffect } from 'react'
import { DraftProvider, useDraft } from './store'
import { DraftIntro, DraftPickClub, DraftHub, DraftRoom, DraftLineup, DraftTable, DraftMatch, DraftLeilao, DraftRanking, DraftEnding } from './screens'
import { DraftLobby } from './lobby'

function DraftRouter() {
  const { state } = useDraft()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen])
  switch (state.screen) {
    case 'lobby':    return <DraftLobby />
    case 'intro':    return <DraftIntro />
    case 'pickClub': return <DraftPickClub />
    case 'hub':      return <DraftHub />
    case 'draft':    return <DraftRoom />
    case 'lineup':   return <DraftLineup />
    case 'table':    return <DraftTable />
    case 'match':    return <DraftMatch />
    case 'leilao':   return <DraftLeilao />
    case 'ranking':  return <DraftRanking />
    case 'ending':    return <DraftEnding />
    default:         return <DraftLobby />
  }
}

export default function DraftGame() {
  return (
    <DraftProvider>
      <DraftRouter />
    </DraftProvider>
  )
}
