import { GameProvider, useGame } from './store/gameStore'
import IntroScreen from './screens/IntroScreen'
import CharacterCreationScreen from './screens/CharacterCreationScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import WorldMapScreen from './screens/WorldMapScreen'
import StealMissionScreen from './screens/StealMissionScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import MatchScreen from './screens/MatchScreen'
import MarketScreen from './screens/MarketScreen'

function GameRouter() {
  const { state } = useGame()

  switch (state.screen) {
    case 'intro':         return <IntroScreen />
    case 'creation':      return <CharacterCreationScreen />
    case 'onboarding':    return <OnboardingScreen />
    case 'map':           return <WorldMapScreen />
    case 'steal-mission': return <StealMissionScreen />
    case 'maintenance':   return <MaintenanceScreen />
    case 'match':         return <MatchScreen />
    case 'market':        return <MarketScreen />
    default:              return <IntroScreen />
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  )
}
