import { GameProvider, useGame } from './store/gameStore'
import IntroScreen from './screens/IntroScreen'
import CharacterCreationScreen from './screens/CharacterCreationScreen'
import WorldMapScreen from './screens/WorldMapScreen'
import StealMissionScreen from './screens/StealMissionScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import MatchScreen from './screens/MatchScreen'

function GameRouter() {
  const { state } = useGame()

  switch (state.screen) {
    case 'intro':      return <IntroScreen />
    case 'creation':   return <CharacterCreationScreen />
    case 'map':        return <WorldMapScreen />
    case 'steal-mission': return <StealMissionScreen />
    case 'maintenance': return <MaintenanceScreen />
    case 'match':      return <MatchScreen />
    default:           return <IntroScreen />
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  )
}
