import { useState } from 'react'
import Home from './components/Home'
import GameScreen from './components/GameScreen'

type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  return (
    <>
      {screen === 'home' && <Home onPlay={() => setScreen('game')} />}
      {screen === 'game' && <GameScreen onHome={() => setScreen('home')} />}
    </>
  )
}
