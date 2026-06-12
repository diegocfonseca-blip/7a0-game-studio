import { useState } from 'react'
import Home from './components/Home'
import GameScreen from './components/GameScreen'

export type GameCategory = 'national' | 'clubs'

type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [category, setCategory] = useState<GameCategory>('national')

  const play = (cat: GameCategory) => {
    setCategory(cat)
    setScreen('game')
  }

  return (
    <div id="app-shell">
      {screen === 'home' && <Home onPlay={play} />}
      {screen === 'game' && <GameScreen category={category} onHome={() => setScreen('home')} />}
    </div>
  )
}
