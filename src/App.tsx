import { useState } from 'react'
import { motion } from 'framer-motion'
import { GameProvider, useGame } from './store/gameStore'
import IntroScreen from './screens/IntroScreen'
import CharacterCreationScreen from './screens/CharacterCreationScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import WorldMapScreen from './screens/WorldMapScreen'
import StealMissionScreen from './screens/StealMissionScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import MatchScreen from './screens/MatchScreen'
import MarketScreen from './screens/MarketScreen'
import EmpresarioGame from './empresario'

function LadraoGame() {
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

function GameSelector({ onSelect }: { onSelect: (game: 'ladrao' | 'empresario') => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 gap-7" style={{ backgroundColor: '#F4ECD6' }}>
      <div className="text-center">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
              style={{ backgroundColor: '#FFC400', boxShadow: '3px 3px 0 0 #0C0C0C' }}>
          7A0 GAME STUDIO
        </span>
        <h1 className="font-black text-4xl text-black mt-4" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCOLHA SEU JOGO</h1>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <motion.button
          onClick={() => onSelect('empresario')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#2B43E8', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">💼</div>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>O EMPRESÁRIO</p>
          <p className="text-white/80 text-sm mt-1 font-medium">
            Você voltou do futuro. Só você sabe quem são as lendas. Assine-as, negocie no seu favor, fique podre de rico.
          </p>
          <span className="inline-block mt-3 border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black uppercase"
                style={{ backgroundColor: '#FFC400', color: '#000' }}>NOVO ✦</span>
        </motion.button>

        <motion.button
          onClick={() => onSelect('ladrao')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-black font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>O LADRÃO DE LENDAS</p>
          <p className="text-black/60 text-sm mt-1 font-medium">
            Roube habilidades das lendas e vire o melhor jogador do mundo.
          </p>
        </motion.button>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedGame, setSelectedGame] = useState<'ladrao' | 'empresario' | null>(
    () => (localStorage.getItem('selected-game') as 'ladrao' | 'empresario' | null)
  )

  function choose(game: 'ladrao' | 'empresario') {
    localStorage.setItem('selected-game', game)
    setSelectedGame(game)
  }

  if (!selectedGame) {
    return <GameSelector onSelect={choose} />
  }

  if (selectedGame === 'empresario') {
    return <EmpresarioGame />
  }

  return (
    <GameProvider>
      <LadraoGame />
    </GameProvider>
  )
}
