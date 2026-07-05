import { useState, useCallback, useMemo, useRef } from 'react'
import type { Color } from 'chess.js'
import GameView from './GameView'
import { useLocalMatch } from './localMatch'
import { useCpuMatch, type CpuMatchOptions } from './cpuMatch'
import { useOnlineChess } from './online'
import { useSettings, type UserSettings } from './settings'
import { themeById } from './themes'
import { timeLabel, type GameConfig, type MoveInput, type EndInfo } from './types'
import type { Difficulty } from './cpu'
import { chessFromMoves, identifyOpening } from './engine'
import { loadCareer, saveCareer, eloDelta, type CareerOpponent } from './career'
import type { FamousGame } from './famous'
import {
  HomeScreen, SetupScreen, JoinScreen, LobbyScreen,
  SettingsScreen, HowToScreen, ErrorScreen, ConnectingScreen,
} from './screens'
import { HistoryListScreen, HistoryViewerScreen, ExhibitionScreen, CareerScreen } from './screens2'

type Nav =
  | 'home' | 'setup-online' | 'setup-local' | 'setup-cpu' | 'join' | 'settings' | 'howto'
  | 'local-game' | 'cpu-game' | 'online'
  | 'historia' | 'historia-view' | 'historia-game'
  | 'exhibition' | 'career' | 'career-game'

function LocalGame({ config, onExit, settings, onSettings }: {
  config: GameConfig
  onExit: () => void
  settings: UserSettings
  onSettings: (p: Partial<UserSettings>) => void
}) {
  const ctl = useLocalMatch(config, onExit)
  return <GameView ctl={ctl} settings={settings} onSettings={onSettings} />
}

function CpuGame({ opts, settings, onSettings }: {
  opts: CpuMatchOptions
  settings: UserSettings
  onSettings: (p: Partial<UserSettings>) => void
}) {
  const ctl = useCpuMatch(opts)
  return <GameView ctl={ctl} settings={settings} onSettings={onSettings} />
}

const DEFAULT_CONFIG = (themeId: string): GameConfig => ({
  timeId: '10+0', customInitialMin: 10, customIncrementSec: 5, colorPref: 'random', themeId,
})

export default function ChessLegends() {
  const { settings, update } = useSettings()
  const [nav, setNav] = useState<Nav>(() => {
    const code = new URLSearchParams(window.location.search).get('sala')
    return code ? 'join' : 'home'
  })
  const [inviteCode] = useState(() => (new URLSearchParams(window.location.search).get('sala') ?? '').toUpperCase())
  const [localConfig, setLocalConfig] = useState<GameConfig | null>(null)
  const [cpuSetup, setCpuSetup] = useState<{ config: GameConfig; difficulty: Difficulty } | null>(null)
  const [famousSel, setFamousSel] = useState<FamousGame | null>(null)
  const [historiaSetup, setHistoriaSetup] = useState<{ game: FamousGame; initialMoves: MoveInput[]; heroColor: Color } | null>(null)
  const careerOppRef = useRef<CareerOpponent | null>(null)

  const goHome = useCallback(() => {
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setNav('home')
  }, [])

  const onGameStart = useCallback((config: GameConfig) => {
    update({ themeId: config.themeId })
  }, [update])

  const online = useOnlineChess(goHome, onGameStart)

  const themeName = useMemo(
    () => online.config ? themeById(online.config.themeId).nome : '',
    [online.config],
  )

  // record a finished ranked game into the career profile
  const onCareerEnd = useCallback((end: EndInfo, ctx: { moves: MoveInput[]; playerColor: Color }) => {
    const opp = careerOppRef.current
    const profile = loadCareer()
    if (!opp || !profile) return
    const score: 0 | 0.5 | 1 = end.winner === null ? 0.5 : end.winner === ctx.playerColor ? 1 : 0
    const delta = eloDelta(profile.rating, opp.rating, score)
    const newRating = Math.max(400, profile.rating + delta)
    const sans = chessFromMoves(ctx.moves).history()
    profile.games.push({
      ts: Date.now(),
      oppName: opp.name,
      oppRating: opp.rating,
      myColor: ctx.playerColor,
      result: score === 1 ? 'win' : score === 0.5 ? 'draw' : 'loss',
      opening: identifyOpening(sans),
      plies: ctx.moves.length,
      reason: end.reason,
      ratingAfter: newRating,
    })
    profile.rating = newRating
    profile.peak = Math.max(profile.peak, newRating)
    saveCareer(profile)
  }, [])

  // ── online flow ─────────────────────────────────────────────────────────
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

    case 'setup-cpu':
      return (
        <SetupScreen
          mode="cpu"
          defaultThemeId={settings.themeId}
          onBack={goHome}
          onConfirm={(config, name, difficulty) => {
            if (name) update({ name })
            update({ themeId: config.themeId })
            setCpuSetup({ config, difficulty })
            setNav('cpu-game')
          }}
        />
      )

    case 'cpu-game':
      return cpuSetup
        ? <CpuGame
            opts={{
              config: cpuSetup.config,
              difficulty: cpuSetup.difficulty,
              playerName: settings.name || 'Você',
              onExit: goHome,
            }}
            settings={settings} onSettings={update}
          />
        : <HomeScreen onNav={setNav} />

    // ── Modo História ──────────────────────────────────────────────────
    case 'historia':
      return <HistoryListScreen onBack={goHome} onOpen={g => { setFamousSel(g); setNav('historia-view') }} />

    case 'historia-view':
      return famousSel
        ? <HistoryViewerScreen
            game={famousSel}
            settings={settings}
            onBack={() => setNav('historia')}
            onTakeOver={(initialMoves, heroColor, game) => {
              setHistoriaSetup({ game, initialMoves, heroColor })
              setNav('historia-game')
            }}
          />
        : <HistoryListScreen onBack={goHome} onOpen={g => { setFamousSel(g); setNav('historia-view') }} />

    case 'historia-game':
      return historiaSetup
        ? <CpuGame
            opts={{
              config: { ...DEFAULT_CONFIG(settings.themeId), timeId: 'none' },
              difficulty: 'dificil',
              persona: historiaSetup.game.vilaoPersona,
              playerName: `${settings.name || 'Você'} (como ${historiaSetup.heroColor === 'w' ? historiaSetup.game.brancas : historiaSetup.game.pretas})`,
              opponentName: historiaSetup.heroColor === 'w' ? `⚫ ${historiaSetup.game.pretas}` : `⚪ ${historiaSetup.game.brancas}`,
              initialMoves: historiaSetup.initialMoves,
              fixedColor: historiaSetup.heroColor,
              onExit: () => setNav('historia-view'),
            }}
            settings={settings} onSettings={update}
          />
        : <HomeScreen onNav={setNav} />

    // ── Espectador IA × IA ─────────────────────────────────────────────
    case 'exhibition':
      return <ExhibitionScreen settings={settings} onBack={goHome} />

    // ── Carreira ───────────────────────────────────────────────────────
    case 'career':
      return (
        <CareerScreen
          onBack={goHome}
          onPlay={(opp) => {
            careerOppRef.current = opp
            setNav('career-game')
          }}
        />
      )

    case 'career-game': {
      const opp = careerOppRef.current
      return opp
        ? <CpuGame
            opts={{
              config: DEFAULT_CONFIG(settings.themeId),
              difficulty: opp.difficulty,
              persona: opp.persona,
              playerName: settings.name || loadCareer()?.name || 'Você',
              opponentName: `${opp.name} (${opp.rating})`,
              onEnd: onCareerEnd,
              onExit: () => setNav('career'),
            }}
            settings={settings} onSettings={update}
          />
        : <HomeScreen onNav={setNav} />
    }

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
