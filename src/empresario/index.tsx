import { EmpresarioProvider, useEmpresario } from './store'
import IntroScreen from './screens/IntroScreen'
import DashboardScreen from './screens/DashboardScreen'
import ScoutsScreen from './screens/ScoutsScreen'
import NegotiationsScreen from './screens/NegotiationsScreen'
import FinanceScreen from './screens/FinanceScreen'
import ClubScreen from './screens/ClubScreen'
import RankingScreen from './screens/RankingScreen'

function EmpresarioRouter() {
  const { state } = useEmpresario()

  switch (state.screen) {
    case 'intro':     return <IntroScreen />
    case 'dashboard': return <DashboardScreen />
    case 'scouts':    return <ScoutsScreen />
    case 'offers':    return <NegotiationsScreen />
    case 'finance':   return <FinanceScreen />
    case 'club':      return <ClubScreen />
    case 'ranking':   return <RankingScreen />
    default:          return <IntroScreen />
  }
}

export default function EmpresarioGame() {
  return (
    <EmpresarioProvider>
      <EmpresarioRouter />
    </EmpresarioProvider>
  )
}
