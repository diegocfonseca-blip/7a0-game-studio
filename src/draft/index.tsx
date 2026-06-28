import { useEffect } from 'react'
import { DraftProvider, useDraft } from './store'
import { DraftIntro, DraftPickClub, DraftHub, DraftRoom } from './screens'

function DraftRouter() {
  const { state } = useDraft()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen])
  switch (state.screen) {
    case 'intro':    return <DraftIntro />
    case 'pickClub': return <DraftPickClub />
    case 'hub':      return <DraftHub />
    case 'draft':    return <DraftRoom />
    default:         return <DraftIntro />
  }
}

export default function DraftGame() {
  return (
    <DraftProvider>
      <DraftRouter />
    </DraftProvider>
  )
}
