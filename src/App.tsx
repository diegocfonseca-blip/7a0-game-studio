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
    <div className="min-h-screen bg-[#060610] flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <p className="text-amber-400/60 text-xs tracking-[0.3em] uppercase mb-2">7A0 Game Studio</p>
        <h1 className="text-white font-black text-3xl">Escolha seu jogo</h1>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <motion.button
          onClick={() => onSelect('empresario')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60
                     rounded-2xl p-6 text-left transition-all group"
        >
          <div className="text-3xl mb-3">💼</div>
          <p className="text-amber-300 font-black text-lg group-hover:text-amber-200">O Empresário</p>
          <p className="text-white/40 text-sm mt-1">
            Você voltou do futuro. Só você sabe quem são as lendas.
            Assine-as, negocie, fique rico.
          </p>
          <p className="text-amber-500/50 text-xs mt-3 uppercase tracking-widest">NOVO ✦</p>
        </motion.button>

        <motion.button
          onClick={() => onSelect('ladrao')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/5 border border-white/10 hover:border-white/20
                     rounded-2xl p-6 text-left transition-all group"
        >
          <div className="text-3xl mb-3">⚽</div>
          <p className="text-white/80 font-black text-lg group-hover:text-white">O Ladrão de Lendas</p>
          <p className="text-white/30 text-sm mt-1">
            Roube habilidades das lendas e vire o melhor jogador do mundo.
          </p>
        </motion.button>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedGame, setSelectedGame] = useState<'ladrao' | 'empresario' | null>(null)

  if (!selectedGame) {
    return <GameSelector onSelect={setSelectedGame} />
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
