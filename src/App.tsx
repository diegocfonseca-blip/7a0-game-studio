import { useState } from 'react'
import Home from './components/Home'
import GameScreen from './components/GameScreen'
import { getTheme } from './theme'
import type { ThemeMode } from './theme'

export type GameCategory = 'national' | 'clubs'
type Screen = 'home' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [category, setCategory] = useState<GameCategory>('national')
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('0a7-theme') as ThemeMode) ?? 'dark'
  )

  const theme = getTheme(themeMode)

  const toggleTheme = () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark'
    localStorage.setItem('0a7-theme', next)
    setThemeMode(next)
  }

  const play = (cat: GameCategory) => {
    setCategory(cat)
    setScreen('game')
  }

  return (
    <div id="app-shell" style={{ background: theme.bg }}>
      {screen === 'home' && <Home onPlay={play} theme={theme} onToggleTheme={toggleTheme} />}
      {screen === 'game' && (
        <GameScreen
          category={category}
          onHome={() => setScreen('home')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
