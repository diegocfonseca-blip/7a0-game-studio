import { useEffect } from 'react'
import { HistProvider, useHist } from './store'
import { MenuScreen, GameScreen, ResultsScreen, MuseuScreen } from './screens'

function HistRouter() {
  const { state } = useHist()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen])

  switch (state.screen) {
    case 'menu':    return <MenuScreen />
    case 'game':    return <GameScreen />
    case 'results': return <ResultsScreen />
    case 'museu':   return <MuseuScreen />
    default:        return <MenuScreen />
  }
}

export default function HistoriadorGame() {
  return (
    <HistProvider>
      <HistRouter />
    </HistProvider>
  )
}
