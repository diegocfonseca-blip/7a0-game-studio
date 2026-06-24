import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { LEGENDS, getLegendStatus, getLegendAge } from '../data/legends'
import LegendProfileModal from '../components/LegendProfileModal'
import type { Region } from '../types/game'
import { getPoints, sortLeague, LEAGUE_TOTAL_ROUNDS } from '../data/leagueData'

const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'brasil', label: 'Brasil', flag: '🇧🇷' },
  { id: 'americas', label: 'Américas', flag: '🌎' },
  { id: 'europa-sul', label: 'Europa Sul', flag: '🇮🇹🇪🇸' },
  { id: 'europa-norte', label: 'Europa Norte', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿🇩🇪🇳🇱' },
  { id: 'europa-oeste', label: 'Europa Oeste', flag: '🇫🇷🇵🇹' },
]

const STATUS_CONFIG = {
  available: { dot: '#22c55e', label: 'DISPONÍVEL', glow: '0 0 8px rgba(34,197,94,0.6)', badge: 'rgba(34,197,94,0.12)', badgeText: '#22c55e' },
  urgent:    { dot: '#f59e0b', label: '⚠️ URGENTE',   glow: '0 0 8px rgba(245,158,11,0.8)', badge: 'rgba(245,158,11,0.12)', badgeText: '#f59e0b' },
  locked:    { dot: '#4b5563', label: 'BLOQUEADO',    glow: 'none',                           badge: 'rgba(75,85,99,0.12)',  badgeText: '#6b7280' },
  closed:    { dot: '#E03535', label: 'LENDA — RIVAL', glow: '0 0 8px rgba(224,53,53,0.5)',   badge: 'rgba(224,53,53,0.12)', badgeText: '#E03535' },
}

const EVENT_TYPE_CONFIG = {
  treino:   { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.04)', label: 'TREINO' },
  lenda:    { icon: '⭐', color: '#a78bfa', bg: 'rgba(167,139,250,0.04)', label: 'LENDA' },
  clube:    { icon: '🏟️', color: '#60a5fa', bg: 'rgba(96,165,250,0.04)', label: 'CLUBE' },
  suspeita: { icon: '🕵️', color: '#E03535', bg: 'rgba(224,53,53,0.04)', label: 'SUSPEITA' },
  mundo:    { icon: '📰', color: '#34d399', bg: 'rgba(52,211,153,0.04)', label: 'MUNDO' },
  traço:    { icon: '✨', color: '#D4A840', bg: 'rgba(212,168,64,0.05)', label: 'TRAÇO' },
}

const PLAYER_BIRTH_YEAR = 1975

export default function WorldMapScreen() {
  const { state, dispatch } = useGame()
  const {
    currentYear, coins, reputation, player, stolenTraits,
    selectedLegendId, stolenFrom, pendingEvents,
    seasonWins, seasonDraws, seasonLosses,
    clubLevel, nextMatchMult, league, leagueRound, recentForm,
    seasonWeek, weekEvents, matchDayActive, seasonComplete,
  } = state

  const [yearSummary, setYearSummary] = useState<{ earned: number; lost: number } | null>(null)
  const [matchFlash, setMatchFlash] = useState(false)
  const [showEvents, setShowEvents] = useState(pendingEvents.length > 0)
  const [showTraitInfo, setShowTraitInfo] = useState(false)

  const playerAge = currentYear - PLAYER_BIRTH_YEAR
  const urgentLegends = LEGENDS.filter(l => getLegendStatus(l, currentYear) === 'urgent')
  const availableCount = LEGENDS.filter(l => { const s = getLegendStatus(l, currentYear); return s === 'available' || s === 'urgent' }).length
  const matchEarning = 120 + stolenTraits.length * 80

  const criticalTraits = stolenTraits.filter(t => t.maintenanceBar < 30)

  const sortedLeague = league ? sortLeague(league) : []
  const playerPos = sortedLeague.findIndex(t => t.id === 'player') + 1
  const aiTeams = (league ?? []).filter(t => t.id !== 'player')
  const currentRound = leagueRound ?? 0
  const nextOpponent = currentRound < LEAGUE_TOTAL_ROUNDS && aiTeams.length > 0
    ? aiTeams[currentRound % aiTeams.length]
    : null

  const handleAdvanceYear = () => {
    const lostCount = stolenTraits.filter(t => t.maintenanceBar - 8 <= 0).length
    const passiveEarned = 200 + stolenTraits.length * 50
    dispatch({ type: 'ADVANCE_YEAR' })
    setYearSummary({ earned: passiveEarned, lost: lostCount })
    setTimeout(() => {
      setYearSummary(null)
      setShowEvents(true)
    }, 1200)
  }

  const handleAdvanceWeek = () => {
    dispatch({ type: 'ADVANCE_WEEK' })
  }

  const handlePlayMatch = () => {
    dispatch({ type: 'PLAY_MATCH', matchType: 'amistoso' })
    setMatchFlash(true)
    setTimeout(() => setMatchFlash(false), 800)
  }

  const handleDismissEvents = () => {
    dispatch({ type: 'DISMISS_EVENTS' })
    setShowEvents(false)
  }

  const currentWeek = seasonWeek ?? 1
  const safeWeekEvents = weekEvents ?? []
  const isMatchDay = matchDayActive ?? false
  const isSeasonDone = seasonComplete ?? false
  const _matchEarning = (nextMatchMult ?? 1) > 1
    ? `×${(nextMatchMult ?? 1).toFixed(1)} bônus ativo`
    : `+C$ ${matchEarning} est.`

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b" style={{ background: 'rgba(6,6,15,0.97)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>O LADRÃO DE LENDAS</div>
              <div className="text-lg font-black leading-none" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{currentYear}</div>
            </div>
            {player && (
              <div className="hidden sm:block pl-3 border-l border-white/10">
                <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{player.name} · {playerAge} anos</div>
                <div className="text-sm font-bold" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{player.position} · {player.country}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <motion.div animate={matchFlash ? { scale: [1, 1.3, 1] } : {}} className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>C$</div>
              <div className="text-base font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{coins.toLocaleString()}</div>
            </motion.div>
            <div className="text-center hidden sm:block">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>REP</div>
              <div className="text-base font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{reputation}</div>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>TRAÇOS</div>
              <div className="text-base font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>{stolenTraits.length}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                className="px-3 py-1.5 text-xs border transition-all"
                style={{
                  fontFamily: 'Oswald',
                  color: criticalTraits.length > 0 ? '#E03535' : '#f0e6c8',
                  borderColor: criticalTraits.length > 0 ? 'rgba(224,53,53,0.4)' : 'rgba(255,255,255,0.1)',
                  background: criticalTraits.length > 0 ? 'rgba(224,53,53,0.08)' : 'transparent',
                }}
              >
                {criticalTraits.length > 0 ? '⚠️ ' : ''}MANUTENÇÃO
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'market' })}
                className="px-3 py-1.5 text-xs border transition-all hover:opacity-80"
                style={{ fontFamily: 'Oswald', color: '#D4A840', borderColor: 'rgba(212,168,64,0.3)', background: 'rgba(212,168,64,0.06)' }}
              >
                🛒 MERCADO
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reiniciar do zero? Todo progresso será perdido.')) {
                    dispatch({ type: 'RESET_GAME' })
                  }
                }}
                className="px-3 py-1.5 text-xs border transition-all hover:opacity-80"
                style={{ fontFamily: 'Oswald', color: 'rgba(224,53,53,0.5)', borderColor: 'rgba(224,53,53,0.15)' }}
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Year advance summary toast */}
      <AnimatePresence>
        {yearSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 z-50 -translate-x-1/2 px-5 py-3 border rounded-sm text-center"
            style={{ background: '#0d0d1a', borderColor: 'rgba(212,168,64,0.3)', minWidth: 260 }}
          >
            <div className="text-sm font-black mb-1" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              {currentYear - 1} → {currentYear} — ANO PASSOU
            </div>
            <div className="text-xs" style={{ color: 'rgba(240,230,200,0.7)', fontFamily: 'Inter' }}>
              +C$ {yearSummary.earned} renda passiva
              {yearSummary.lost > 0 && <span style={{ color: '#E03535' }}> · {yearSummary.lost} traço(s) perdido(s)</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Urgent legend alert */}
      {urgentLegends.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b', fontFamily: 'Oswald' }}>
              ⚠️ JANELAS FECHANDO:
            </motion.span>
            {urgentLegends.map(l => (
              <button key={l.id} onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: l.id })}
                className="text-xs font-bold tracking-wide hover:opacity-80 transition-opacity"
                style={{ color: '#f59e0b', fontFamily: 'Inter' }}>
                {l.nickname} (fecha {l.closeYear}) →
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Critical trait alert */}
      <AnimatePresence>
        {criticalTraits.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
            style={{ background: 'rgba(224,53,53,0.06)', borderColor: 'rgba(224,53,53,0.25)' }}
          >
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                className="text-xs font-bold tracking-widest" style={{ color: '#E03535', fontFamily: 'Oswald' }}>
                💀 TRAÇOS MORRENDO:
              </motion.span>
              {criticalTraits.map(t => (
                <button key={t.traitId} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                  className="text-xs font-bold tracking-wide hover:opacity-80 transition-opacity"
                  style={{ color: '#E03535', fontFamily: 'Inter' }}>
                  {t.traitIcon} {t.traitName} ({t.maintenanceBar}%) →
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── ACONTECIMENTOS ── hero section */}
        <div
          className="rounded-sm border overflow-hidden transition-all duration-500"
          style={{
            borderColor: isMatchDay
              ? 'rgba(212,168,64,0.45)'
              : isSeasonDone
              ? 'rgba(34,197,94,0.35)'
              : 'rgba(255,255,255,0.07)',
            background: isMatchDay
              ? 'radial-gradient(ellipse at top, rgba(212,168,64,0.07) 0%, rgba(6,6,15,0.6) 70%)'
              : isSeasonDone
              ? 'radial-gradient(ellipse at top, rgba(34,197,94,0.06) 0%, transparent 60%)'
              : 'rgba(255,255,255,0.015)',
            boxShadow: isMatchDay
              ? '0 0 40px rgba(212,168,64,0.07), inset 0 0 40px rgba(212,168,64,0.03)'
              : 'none',
          }}
        >
          {/* Section header */}
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: isMatchDay ? 'rgba(212,168,64,0.15)' : 'rgba(255,255,255,0.05)' }}
          >
            <div>
              {isSeasonDone ? (
                <div className="text-xs tracking-widest font-black" style={{ color: '#22c55e', fontFamily: 'Oswald' }}>
                  🏆 TEMPORADA {currentYear} ENCERRADA
                </div>
              ) : isMatchDay ? (
                <motion.div
                  animate={{ opacity: [1, 0.55, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  <div className="text-xs tracking-widest font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                    ⚽ DIA DE JOGO · RODADA {Math.min(currentRound + 1, LEAGUE_TOTAL_ROUNDS)}
                  </div>
                </motion.div>
              ) : (
                <div className="text-xs tracking-widest" style={{ color: 'rgba(240,230,200,0.35)', fontFamily: 'Oswald' }}>
                  ACONTECIMENTOS
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <div className="text-xl font-black" style={{ color: isMatchDay ? '#D4A840' : isSeasonDone ? '#22c55e' : '#f0e6c8', fontFamily: 'Oswald' }}>
                  SEMANA {currentWeek}
                </div>
                {!isSeasonDone && (
                  <div className="text-xs opacity-35 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    · rodada {Math.min(currentRound + 1, LEAGUE_TOTAL_ROUNDS)}/{LEAGUE_TOTAL_ROUNDS} · {state.currentClub}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {playerPos > 0 && (
                <div className="text-xs font-black" style={{ color: playerPos <= 3 ? '#22c55e' : 'rgba(240,230,200,0.35)', fontFamily: 'Oswald' }}>
                  {playerPos}º LUGAR
                </div>
              )}
              <div className="flex items-center gap-1 mt-1 justify-end">
                {(recentForm ?? []).slice(0, 5).map((r, i) => (
                  <div key={i} className="w-5 h-5 rounded-sm flex items-center justify-center"
                    style={{
                      background: r === 'W' ? 'rgba(34,197,94,0.2)' : r === 'D' ? 'rgba(245,158,11,0.2)' : 'rgba(224,53,53,0.15)',
                      color: r === 'W' ? '#22c55e' : r === 'D' ? '#f59e0b' : '#E03535',
                      fontSize: '9px', fontFamily: 'Oswald', fontWeight: 900,
                    }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            {isSeasonDone ? (
              <div className="px-5 py-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-base font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                    TEMPORADA ENCERRADA
                  </div>
                  <div className="text-xs opacity-50 mt-1" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {seasonWins ?? 0}V · {seasonDraws ?? 0}E · {seasonLosses ?? 0}D · {playerPos > 0 ? `${playerPos}º lugar` : '—'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Vitórias', value: seasonWins ?? 0, color: '#22c55e' },
                    { label: 'Posição', value: playerPos > 0 ? `${playerPos}º` : '—', color: playerPos <= 3 ? '#D4A840' : '#f0e6c8' },
                    { label: 'Traços', value: stolenTraits.length, color: '#a78bfa' },
                  ].map(item => (
                    <div key={item.label} className="p-3 border rounded-sm text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-2xl font-black" style={{ color: item.color, fontFamily: 'Oswald' }}>{item.value}</div>
                      <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : safeWeekEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-xs opacity-25" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                  A semana começa...
                </div>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                {safeWeekEvents.map((event, i) => {
                  const cfg = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.treino
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="px-5 py-4 flex gap-3.5"
                      style={{
                        background: cfg.bg,
                        borderLeft: `3px solid ${cfg.color}`,
                      }}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5 leading-none">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black tracking-widest mb-1.5" style={{ color: cfg.color, fontFamily: 'Oswald' }}>
                          {cfg.label}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,230,200,0.82)', fontFamily: 'Inter' }}>
                          {event.text}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {isSeasonDone ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdvanceYear}
                className="w-full py-4 text-sm font-black tracking-widest"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontFamily: 'Oswald' }}
              >
                🏆 NOVA TEMPORADA {currentYear + 1} →
              </motion.button>
            ) : isMatchDay ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePlayMatch}
                className="w-full py-4 text-sm font-black tracking-widest"
                style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(212,168,64,0)', '0 0 24px rgba(212,168,64,0.35)', '0 0 0 0 rgba(212,168,64,0)'] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              >
                ⚽ JOGAR{nextOpponent ? ` vs ${nextOpponent.name}` : ''} →
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdvanceWeek}
                className="w-full py-3.5 text-sm font-bold tracking-widest border transition-all"
                style={{ background: 'transparent', color: 'rgba(240,230,200,0.6)', borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Oswald' }}
              >
                AVANÇAR SEMANA →
              </motion.button>
            )}
            {!isMatchDay && !isSeasonDone && nextOpponent && (
              <div className="mt-2 text-center text-xs" style={{ color: 'rgba(240,230,200,0.28)', fontFamily: 'Inter' }}>
                Próxima partida: vs {nextOpponent.name} ·{' '}
                {nextOpponent.strength >= 60 ? 'Adversário Forte' : nextOpponent.strength >= 40 ? 'Equilibrado' : 'Favorito'}
                {' · '}{_matchEarning}
              </div>
            )}
          </div>
        </div>

        {/* ── TEMPORADA ── league table */}
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div>
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>TEMPORADA {currentYear}</div>
              <div className="text-xs opacity-30 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {state.currentClub} · {['Amador', 'Semi-pro', 'Profissional'][clubLevel - 1]}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: '#22c55e', fontFamily: 'Oswald' }}>{seasonWins ?? 0}</div>
                <div className="text-xs opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>V</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: '#f59e0b', fontFamily: 'Oswald' }}>{seasonDraws ?? 0}</div>
                <div className="text-xs opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>E</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: '#E03535', fontFamily: 'Oswald' }}>{seasonLosses ?? 0}</div>
                <div className="text-xs opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>D</div>
              </div>
            </div>
          </div>

          {sortedLeague.length > 0 && (
            <>
              <div className="px-4 py-1.5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs tracking-widest opacity-25" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>CLASSIFICAÇÃO</div>
                <div className="text-xs opacity-20" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                  {Math.min(currentRound, LEAGUE_TOTAL_ROUNDS)}/{LEAGUE_TOTAL_ROUNDS} rodadas
                </div>
              </div>
              {sortedLeague.map((team, i) => {
                const isPlayer = team.id === 'player'
                const pts = getPoints(team)
                const gd = team.goalsFor - team.goalsAgainst
                return (
                  <div key={team.id}
                    className="flex items-center gap-2 px-4 py-2 border-b"
                    style={{
                      borderColor: 'rgba(255,255,255,0.025)',
                      background: isPlayer ? 'rgba(212,168,64,0.04)' : 'transparent',
                      borderLeft: isPlayer ? '2px solid rgba(212,168,64,0.5)' : '2px solid transparent',
                    }}>
                    <span className="text-xs font-bold w-4 text-center flex-shrink-0"
                      style={{ color: i === 0 ? '#D4A840' : 'rgba(240,230,200,0.2)', fontFamily: 'Oswald' }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xs font-bold truncate"
                      style={{ color: isPlayer ? '#D4A840' : '#f0e6c8', fontFamily: 'Oswald', opacity: isPlayer ? 1 : 0.75 }}>
                      {isPlayer ? '★ ' : ''}{team.name}
                    </span>
                    <span className="text-xs font-black w-6 text-right flex-shrink-0"
                      style={{ color: isPlayer ? '#D4A840' : 'rgba(240,230,200,0.6)', fontFamily: 'Oswald' }}>
                      {pts}
                    </span>
                    <span className="text-xs w-5 text-right flex-shrink-0 hidden sm:block"
                      style={{ color: '#22c55e', fontFamily: 'Oswald', opacity: 0.7 }}>{team.wins}</span>
                    <span className="text-xs w-5 text-right flex-shrink-0 hidden sm:block"
                      style={{ color: '#f59e0b', fontFamily: 'Oswald', opacity: 0.7 }}>{team.draws}</span>
                    <span className="text-xs w-5 text-right flex-shrink-0 hidden sm:block"
                      style={{ color: '#E03535', fontFamily: 'Oswald', opacity: 0.7 }}>{team.losses}</span>
                    <span className="text-xs w-7 text-right flex-shrink-0"
                      style={{ color: gd >= 0 ? 'rgba(240,230,200,0.35)' : '#E03535', fontFamily: 'Oswald' }}>
                      {gd >= 0 ? '+' : ''}{gd}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* ── TRAÇOS ROUBADOS ── */}
        {stolenTraits.length > 0 && (
          <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
              <div>
                <div className="text-xs tracking-widest font-black" style={{ color: '#a78bfa', fontFamily: 'Oswald' }}>
                  TRAÇOS ROUBADOS · {stolenTraits.length} ATIVO{stolenTraits.length !== 1 ? 'S' : ''}
                </div>
                <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                  Decaem 8% por ano. Abaixo de 30% rendem menos nas partidas.
                </div>
              </div>
              <button
                onClick={() => setShowTraitInfo(v => !v)}
                className="text-xs opacity-40 hover:opacity-70 transition-opacity"
                style={{ color: '#a78bfa', fontFamily: 'Oswald' }}
              >
                {showTraitInfo ? '▲' : '▼'} COMO FUNCIONA
              </button>
            </div>

            <AnimatePresence>
              {showTraitInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 border-b text-xs leading-relaxed space-y-1" style={{ borderColor: 'rgba(124,58,237,0.08)', color: 'rgba(240,230,200,0.55)', fontFamily: 'Inter' }}>
                    <p>✨ <b style={{ color: '#a78bfa' }}>Traços</b> são talentos roubados de lendas do futebol. Cada um decai 8% por ano sem manutenção.</p>
                    <p>🟢 <b style={{ color: '#22c55e' }}>70%+</b> — em chamas. Rendem 100% nas partidas.</p>
                    <p>🟡 <b style={{ color: '#f59e0b' }}>30–70%</b> — razoável. Alguma perda de performance.</p>
                    <p>🔴 <b style={{ color: '#E03535' }}>Abaixo de 30%</b> — fraco. O talento quer voltar pro dono.</p>
                    <p>💀 <b style={{ color: '#E03535' }}>0%</b> — o traço se perde para sempre.</p>
                    <p>💊 Mantenha via <b style={{ color: '#D4A840' }}>MANUTENÇÃO</b> (C$ 80 cada) ou itens do <b style={{ color: '#D4A840' }}>MERCADO</b>.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 py-3 space-y-2.5">
              {stolenTraits.map(t => (
                <div key={t.traitId} className="flex items-center gap-3">
                  <span className="text-base flex-shrink-0">{t.traitIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate" style={{ color: '#f0e6c8', fontFamily: 'Oswald', opacity: 0.8 }}>
                        {t.traitName}
                      </span>
                      <span className="text-xs font-black flex-shrink-0 ml-2" style={{
                        color: t.maintenanceBar < 30 ? '#E03535' : t.maintenanceBar < 60 ? '#f59e0b' : '#22c55e',
                        fontFamily: 'Oswald'
                      }}>{t.maintenanceBar}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.maintenanceBar}%`,
                          background: t.maintenanceBar < 30
                            ? 'linear-gradient(90deg, #b91c1c, #E03535)'
                            : t.maintenanceBar < 60
                            ? 'linear-gradient(90deg, #b45309, #f59e0b)'
                            : 'linear-gradient(90deg, #15803d, #22c55e)',
                        }}
                        initial={false}
                        animate={{ width: `${t.maintenanceBar}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                  <span className="text-xs opacity-30 flex-shrink-0 hidden sm:block" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {t.legendNickname}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 pb-3">
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'maintenance' })}
                className="text-xs font-bold tracking-widest border px-3 py-1.5 transition-all hover:opacity-80"
                style={{ color: '#a78bfa', borderColor: 'rgba(124,58,237,0.25)', fontFamily: 'Oswald' }}
              >
                MANUTENÇÃO →
              </button>
            </div>
          </div>
        )}

        {/* ── MAPA DE LENDAS ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>MAPA DE LENDAS</h2>
              <p className="text-xs opacity-35 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Você veio do futuro. Só você sabe o que essas crianças vão se tornar.
              </p>
              <p className="text-xs opacity-20 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {availableCount} janelas abertas · {stolenFrom.length} roubados · {currentYear}
              </p>
            </div>
            {stolenTraits.length > 0 && (
              <div className="flex gap-1.5">
                {stolenTraits.slice(0, 5).map(t => (
                  <div key={t.traitId} className="w-8 h-8 flex items-center justify-center rounded-sm border text-sm"
                    title={`${t.traitName} (${t.legendNickname})`}
                    style={{ background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.25)' }}>
                    {t.traitIcon}
                  </div>
                ))}
                {stolenTraits.length > 5 && (
                  <div className="w-8 h-8 flex items-center justify-center rounded-sm border text-xs font-bold"
                    style={{ color: '#7c3aed', borderColor: 'rgba(124,58,237,0.25)', fontFamily: 'Oswald' }}>
                    +{stolenTraits.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {REGIONS.map(region => {
              const regionLegends = LEGENDS.filter(l => l.region === region.id)
              if (regionLegends.length === 0) return null
              return (
                <div key={region.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">{region.flag}</span>
                    <h3 className="text-sm font-bold tracking-widest" style={{ color: 'rgba(240,230,200,0.4)', fontFamily: 'Oswald' }}>
                      {region.label.toUpperCase()}
                    </h3>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {regionLegends.map((legend, i) => {
                      const status = getLegendStatus(legend, currentYear)
                      const age = getLegendAge(legend, currentYear)
                      const cfg = STATUS_CONFIG[status]
                      const alreadyStolen = stolenFrom.includes(legend.id)
                      const canAfford = coins >= legend.traits[0].cost

                      return (
                        <motion.button
                          key={legend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={status !== 'locked' ? { scale: 1.02 } : {}}
                          whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                          onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: legend.id })}
                          className="p-3 border rounded-sm text-left transition-all relative overflow-hidden"
                          style={{
                            background: alreadyStolen
                              ? 'rgba(34,197,94,0.04)'
                              : status === 'urgent'
                              ? 'rgba(245,158,11,0.05)'
                              : status === 'locked'
                              ? 'rgba(255,255,255,0.015)'
                              : 'rgba(255,255,255,0.03)',
                            borderColor: alreadyStolen
                              ? 'rgba(34,197,94,0.22)'
                              : status === 'urgent'
                              ? 'rgba(245,158,11,0.28)'
                              : status === 'locked'
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(255,255,255,0.07)',
                            cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                            opacity: status === 'locked' ? 0.45 : 1,
                          }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{
                            background: alreadyStolen ? '#22c55e' : status === 'locked' ? 'transparent' : legend.colorAccent,
                            opacity: status === 'locked' ? 0 : 0.5
                          }} />

                          <div className="flex items-center justify-between mb-2">
                            <div className="w-2 h-2 rounded-full" style={{
                              background: alreadyStolen ? '#22c55e' : cfg.dot,
                              boxShadow: alreadyStolen ? '0 0 6px rgba(34,197,94,0.7)' : cfg.glow
                            }} />
                            <span className="text-xs font-bold" style={{ color: cfg.badgeText, fontFamily: 'Oswald' }}>{age}a</span>
                          </div>

                          <div className="text-sm font-black leading-tight mb-0.5" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{legend.nickname}</div>
                          <div className="text-xs opacity-45 leading-tight mb-2" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{legend.city}</div>

                          {(status === 'available' || status === 'urgent') && !alreadyStolen && (
                            <>
                              <div className="text-xs font-bold" style={{ color: canAfford ? '#22c55e' : '#E03535', fontFamily: 'Oswald' }}>
                                {canAfford ? '✓' : '✗'} C$ {legend.traits[0].cost.toLocaleString()}+
                              </div>
                              <div className="text-xs mt-0.5 opacity-35 italic" style={{ color: '#D4A840', fontFamily: 'Inter' }}>
                                só você sabe
                              </div>
                            </>
                          )}

                          <div className="mt-1.5 px-1.5 py-0.5 text-xs font-bold w-fit" style={{
                            background: alreadyStolen ? 'rgba(34,197,94,0.12)' : cfg.badge,
                            color: alreadyStolen ? '#22c55e' : cfg.badgeText,
                            fontFamily: 'Oswald'
                          }}>
                            {alreadyStolen ? '✅ ROUBADO' : cfg.label}
                          </div>

                          {status === 'urgent' && !alreadyStolen && (
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                              className="mt-1 text-xs" style={{ color: '#f59e0b', fontFamily: 'Inter' }}>
                              Fecha em {legend.closeYear}
                            </motion.div>
                          )}
                          {status === 'locked' && (
                            <div className="mt-1 text-xs" style={{ color: '#6b7280', fontFamily: 'Inter' }}>Abre {legend.unlockYear}</div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-center pt-2 pb-8">
          <button
            onClick={() => {
              if (window.confirm('Reiniciar o jogo do zero? Todo progresso será perdido.')) {
                dispatch({ type: 'RESET_GAME' })
              }
            }}
            className="text-xs opacity-15 hover:opacity-40 transition-opacity"
            style={{ color: '#f0e6c8', fontFamily: 'Inter' }}
          >
            ↺ reiniciar jogo
          </button>
        </div>
      </div>

      {selectedLegendId && <LegendProfileModal />}

      {/* EventModal */}
      <AnimatePresence>
        {showEvents && pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-md border rounded-sm overflow-hidden"
              style={{ background: '#0d0d1a', borderColor: 'rgba(212,168,64,0.25)' }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(212,168,64,0.12)' }}>
                <div className="text-xs tracking-widest opacity-35 mb-0.5" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                  {currentYear} — EVENTOS DO ANO
                </div>
                <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                  O QUE ACONTECEU
                </div>
              </div>

              <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                {pendingEvents.map((evt, i) => {
                  const typeColor =
                    evt.type === 'positive' ? '#22c55e' :
                    evt.type === 'negative' ? '#E03535' :
                    evt.type === 'consequence' ? '#7c3aed' : '#D4A840'
                  const typeBg =
                    evt.type === 'positive' ? 'rgba(34,197,94,0.05)' :
                    evt.type === 'negative' ? 'rgba(224,53,53,0.05)' :
                    evt.type === 'consequence' ? 'rgba(124,58,237,0.07)' : 'rgba(212,168,64,0.04)'
                  const typeBorder =
                    evt.type === 'positive' ? 'rgba(34,197,94,0.18)' :
                    evt.type === 'negative' ? 'rgba(224,53,53,0.18)' :
                    evt.type === 'consequence' ? 'rgba(124,58,237,0.22)' : 'rgba(212,168,64,0.12)'

                  const effectLines: string[] = []
                  if (evt.effect?.coins && evt.effect.coins > 0) effectLines.push(`+C$ ${evt.effect.coins}`)
                  if (evt.effect?.coins && evt.effect.coins < 0) effectLines.push(`−C$ ${Math.abs(evt.effect.coins)}`)
                  if (evt.effect?.reputation && evt.effect.reputation > 0) effectLines.push(`+${evt.effect.reputation} rep`)
                  if (evt.effect?.reputation && evt.effect.reputation < 0) effectLines.push(`${evt.effect.reputation} rep`)

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 border rounded-sm"
                      style={{ background: typeBg, borderColor: typeBorder }}
                    >
                      <div className="text-xs font-black tracking-widest mb-1" style={{ color: typeColor, fontFamily: 'Oswald' }}>
                        {evt.title}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.8)', fontFamily: 'Inter' }}>
                        {evt.text}
                      </p>
                      {effectLines.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {effectLines.map((l, j) => (
                            <span key={j} className="text-xs font-black px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(255,255,255,0.06)', color: typeColor, fontFamily: 'Oswald' }}>
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDismissEvents}
                  className="w-full py-3 text-sm font-bold tracking-widest"
                  style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}
                >
                  CONTINUAR →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
