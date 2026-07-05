import { useState, useCallback, useMemo } from 'react'
import GameView from './GameView'
import { useLocalMatch } from './localMatch'
import { useOnlineChess } from './online'
import { useSettings } from './settings'
import { themeById } from './themes'
import { timeLabel, type GameConfig } from './types'
import {
  HomeScreen, SetupScreen, JoinScreen, LobbyScreen,
  SettingsScreen, HowToScreen, ErrorScreen, ConnectingScreen,
} from './screens'

type Nav = 'home' | 'setup-online' | 'setup-local' | 'join' | 'settings' | 'howto' | 'local-game' | 'online'

function LocalGame({ config, onExit, settings, onSettings }: {
  config: GameConfig
  onExit: () => void
  settings: ReturnType<typeof useSettings>['settings']
  onSettings: (p: Partial<typeof settings>) => void
}) {
  const ctl = useLocalMatch(config, onExit)
  return <GameView ctl={ctl} settings={settings} onSettings={onSettings} />
}

export default function ChessLegends() {
  const { settings, update } = useSettings()
  const [nav, setNav] = useState<Nav>(() => {
    // deep link ?sala=CODE → join screen
    const code = new URLSearchParams(window.location.search).get('sala')
    return code ? 'join' : 'home'
  })
  const [inviteCode] = useState(() => (new URLSearchParams(window.location.search).get('sala') ?? '').toUpperCase())
  const [localConfig, setLocalConfig] = useState<GameConfig | null>(null)

  const goHome = useCallback(() => {
    // clear ?sala= from url so refresh doesn't re-open join
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setNav('home')
  }, [])

  // room's default theme becomes the initial view for both players
  const onGameStart = useCallback((config: GameConfig) => {
    update({ themeId: config.themeId })
  }, [update])

  const online = useOnlineChess(goHome, onGameStart)

  const themeName = useMemo(
    () => online.config ? themeById(online.config.themeId).nome : '',
    [online.config],
  )

  // ── online flow states take priority once started ──────────────────────
  if (nav === 'online') {
    if (online.stage === 'connecting') return <ConnectingScreen />
    if (online.stage === 'error') return <ErrorScreen message={online.error ?? 'Erro inesperado.'} onBack={goHome} />
    if (online.stage === 'lobby') {
      return (
        <LobbyScreen
          code={online.roomCode}
          hostName={settings.name || 'Você'}
          timeText={online.config ? timeLabel(online.config) : ''}
          themeName={themeName}
          onCancel={online.leave}
        />
      )
    }
    if (online.stage === 'playing' && online.ctl) {
      return <GameView ctl={online.ctl} settings={settings} onSettings={update} />
    }
    return <ConnectingScreen />
  }

  switch (nav) {
    case 'setup-online':
      return (
        <SetupScreen
          mode="online"
          defaultThemeId={settings.themeId}
          onBack={goHome}
          onConfirm={(config, name) => {
            if (name) update({ name })
            online.createRoom(config, name || settings.name || 'Anfitrião')
            setNav('online')
          }}
        />
      )

    case 'setup-local':
      return (
        <SetupScreen
          mode="local"
          defaultThemeId={settings.themeId}
          onBack={goHome}
          onConfirm={(config) => {
            update({ themeId: config.themeId })
            setLocalConfig(config)
            setNav('local-game')
          }}
        />
      )

    case 'local-game':
      return localConfig
        ? <LocalGame config={localConfig} onExit={goHome} settings={settings} onSettings={update} />
        : <HomeScreen onNav={setNav} />

    case 'join':
      return (
        <JoinScreen
          initialCode={inviteCode}
          onBack={goHome}
          onJoin={(code, name) => {
            if (name) update({ name })
            online.joinRoom(code, name || settings.name || 'Desafiante')
            setNav('online')
          }}
        />
      )

    case 'settings':
      return <SettingsScreen settings={settings} onUpdate={update} onBack={goHome} />

    case 'howto':
      return <HowToScreen onBack={goHome} />

    default:
      return <HomeScreen onNav={setNav} />
  }
}
