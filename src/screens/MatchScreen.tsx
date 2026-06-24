import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { generateMatchOpponent } from '../data/matchMoments'
import { generateMatchNarration } from '../data/matchNarration'

const PLAYER_BIRTH_YEAR = 1975
const MOMENT_DELAY_MS = 2600

export default function MatchScreen() {
  const { state, dispatch } = useGame()
  const { activeMatch, stolenTraits, currentYear, player, matchesPlayed, clubLevel, pendingMatchType, nextMatchMult, currentClub, league, leagueRound } = state
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    if (!activeMatch) {
      const aiTeams = (league ?? []).filter(t => t.id !== 'player')
      const leagueOpp = aiTeams.length > 0 ? aiTeams[(leagueRound ?? 0) % aiTeams.length] : null
      const opp = leagueOpp
        ? { name: leagueOpp.name, flag: '🇧🇷', strength: leagueOpp.strength, club: leagueOpp.name }
        : generateMatchOpponent(clubLevel ?? 1, currentYear)
      const { moments, goals, goalsAgainst } = generateMatchNarration(
        player?.name ?? 'Você',
        stolenTraits,
        opp.name,
        opp.strength,
        state.reputation,
        5 + Math.floor(Math.random() * 2),
      )
      dispatch({ type: 'START_MATCH', opponent: opp, moments, goals, goalsAgainst, matchType: pendingMatchType ?? 'amistoso' })
    }
  }, [])

  useEffect(() => {
    if (activeMatch?.phase === 'narration' && !skipping) {
      const timer = setTimeout(() => {
        dispatch({ type: 'MATCH_NEXT_MOMENT' })
      }, MOMENT_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [activeMatch?.phase, activeMatch?.momentIndex, skipping])

  if (!activeMatch) return null

  const playerAge = currentYear - PLAYER_BIRTH_YEAR
  const shownMoments = activeMatch.moments.slice(0, activeMatch.momentIndex)
  const runningGoals = shownMoments.filter(m => m.scoreDelta > 0).length
  const runningGoalsAgainst = shownMoments.filter(m => m.scoreDelta < 0).length
  const currentMoment = activeMatch.moments[activeMatch.momentIndex]

  const momentTypeIcon = (type: string) => {
    if (type === 'goal') return '⚽'
    if (type === 'opponent-goal') return '💔'
    if (type === 'skill') return '✨'
    if (type === 'miss') return '😤'
    return '⏱'
  }

  const momentConfig = (type: string) => {
    if (type === 'goal')          return { bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.3)',    accent: '#22c55e', label: 'GOL!',    glow: '0 0 40px rgba(34,197,94,0.18)' }
    if (type === 'opponent-goal') return { bg: 'rgba(224,53,53,0.07)',    border: 'rgba(224,53,53,0.3)',    accent: '#E03535', label: 'TOMAMOS', glow: '0 0 40px rgba(224,53,53,0.15)' }
    if (type === 'skill')         return { bg: 'rgba(212,168,64,0.07)',   border: 'rgba(212,168,64,0.3)',   accent: '#D4A840', label: 'JOGAÇO',  glow: '0 0 40px rgba(212,168,64,0.18)' }
    if (type === 'miss')          return { bg: 'rgba(107,114,128,0.05)',  border: 'rgba(107,114,128,0.18)', accent: '#6b7280', label: 'PERDIDA', glow: 'none' }
    return                               { bg: 'rgba(255,255,255,0.02)',  border: 'rgba(255,255,255,0.08)', accent: '#6b7280', label: '',        glow: 'none' }
  }

  const getEarnings = () => {
    const win = activeMatch.goals > activeMatch.goalsAgainst
    const draw = activeMatch.goals === activeMatch.goalsAgainst
    const m = nextMatchMult ?? 1.0
    if (win)  return { label: 'VITÓRIA',  emoji: '🏆', color: '#22c55e', earned: Math.round((350 + stolenTraits.length * 70) * m), repGain: activeMatch.goals - activeMatch.goalsAgainst + 3 }
    if (draw) return { label: 'EMPATE',   emoji: '🤝', color: '#f59e0b', earned: Math.round((150 + stolenTraits.length * 30) * m), repGain: 2 }
    return          { label: 'DERROTA',  emoji: '💀', color: '#E03535', earned: Math.round(60 * m), repGain: 1 }
  }

  const bg = 'radial-gradient(ellipse at top, #0a0a1a 0%, #06060f 80%)'
  const strengthLabel = activeMatch.opponentStrength >= 70 ? 'ADVERSÁRIO FORTE' : activeMatch.opponentStrength >= 50 ? 'ADVERSÁRIO MÉDIO' : 'ADVERSÁRIO FRACO'
  const strengthColor = activeMatch.opponentStrength >= 70 ? '#f59e0b' : activeMatch.opponentStrength >= 50 ? 'rgba(240,230,200,0.6)' : '#22c55e'

  // ── INTRO ──
  if (activeMatch.phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: bg }}>

        {/* Stadium atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-64"
            style={{ background: 'linear-gradient(to top, rgba(18,52,18,0.5), transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(212,168,64,0.04) 0%, transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="w-full max-w-sm relative z-10">

          <div className="text-center mb-2">
            <div className="text-xs tracking-[0.4em] opacity-30 mb-1" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              {currentYear} · {playerAge} ANOS · {['AMADOR','SEMI-PRO','PROFISSIONAL'][(clubLevel ?? 1) - 1]}
            </div>
          </div>

          {/* VS block */}
          <div className="relative my-8">
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-sm pointer-events-none"
              animate={{ boxShadow: ['0 0 0 1px rgba(212,168,64,0.1)', '0 0 0 1px rgba(212,168,64,0.3)', '0 0 0 1px rgba(212,168,64,0.1)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="border rounded-sm p-6" style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.03)' }}>
              <div className="flex items-center justify-between gap-4">
                {/* Home */}
                <div className="flex-1 text-center">
                  <div className="text-4xl mb-2">🇧🇷</div>
                  <div className="text-base font-black leading-tight" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                    {currentClub || player?.name}
                  </div>
                  <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{player?.name}</div>
                </div>

                {/* VS */}
                <div className="flex-shrink-0 text-center">
                  <div className="text-3xl font-black opacity-50" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>VS</div>
                  <div className="text-xs mt-1 opacity-20" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>PARTIDA</div>
                </div>

                {/* Away */}
                <div className="flex-1 text-center">
                  <div className="text-4xl mb-2">{activeMatch.opponentFlag}</div>
                  <div className="text-base font-black leading-tight" style={{ color: activeMatch.opponentStrength >= 70 ? '#f59e0b' : '#f0e6c8', fontFamily: 'Oswald' }}>
                    {activeMatch.opponentName}
                  </div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: strengthColor, fontFamily: 'Oswald' }}>
                    {strengthLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(nextMatchMult ?? 1) > 1 && (
            <div className="mb-4 p-3 border rounded-sm text-center text-sm"
              style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.05)', fontFamily: 'Inter' }}>
              ✨ Bônus ativo: ×{(nextMatchMult ?? 1).toFixed(1)} nos ganhos
            </div>
          )}

          {stolenTraits.length > 0 && (
            <div className="mb-6 p-4 border rounded-sm" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
              <div className="text-xs tracking-widest mb-2.5 opacity-50" style={{ color: '#a78bfa', fontFamily: 'Oswald' }}>
                TRAÇOS ATIVOS NESTA PARTIDA
              </div>
              <div className="flex flex-wrap gap-2">
                {stolenTraits.map(t => {
                  const crit = t.maintenanceBar < 30
                  return (
                    <div key={t.traitId} className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sm"
                      style={{
                        borderColor: crit ? 'rgba(224,53,53,0.35)' : 'rgba(124,58,237,0.25)',
                        background: crit ? 'rgba(224,53,53,0.07)' : 'rgba(124,58,237,0.07)',
                      }}>
                      <span className="text-sm">{t.traitIcon}</span>
                      <span className="text-xs font-bold" style={{ color: crit ? '#E03535' : '#f0e6c8', fontFamily: 'Oswald' }}>{t.traitName}</span>
                      <span className="text-xs" style={{ color: crit ? '#E03535' : 'rgba(240,230,200,0.35)', fontFamily: 'Oswald' }}>
                        {t.maintenanceBar}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(212,168,64,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'MATCH_NEXT_PHASE' })}
            className="w-full py-4 text-sm font-black tracking-widest"
            style={{ background: 'linear-gradient(135deg, #D4A840, #b8902e)', color: '#06060f', fontFamily: 'Oswald' }}
          >
            ⚽ APITAR O JOGO →
          </motion.button>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
            className="mt-3 w-full text-xs opacity-25 hover:opacity-50 transition-opacity text-center"
            style={{ color: '#f0e6c8', fontFamily: 'Inter' }}
          >
            ← cancelar
          </button>
        </motion.div>
      </div>
    )
  }

  // ── NARRAÇÃO (auto-play) ──
  if (activeMatch.phase === 'narration' && currentMoment) {
    const cfg = momentConfig(currentMoment.type)
    const progress = (activeMatch.momentIndex + 1) / activeMatch.moments.length

    return (
      <div className="min-h-screen flex flex-col" style={{ background: bg }}>

        {/* Header placar */}
        <div className="sticky top-0 z-10 border-b" style={{ background: 'rgba(6,6,15,0.97)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 text-sm font-black truncate" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              <span style={{ color: '#D4A840' }}>{currentClub || player?.name}</span>
              <span className="opacity-25 mx-2">vs</span>
              <span className="opacity-70">{activeMatch.opponentName}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                {runningGoals} <span className="opacity-30 text-lg">—</span> {runningGoalsAgainst}
              </div>
              <button
                onClick={() => setSkipping(true)}
                className="text-xs px-2.5 py-1 border opacity-35 hover:opacity-70 transition-opacity"
                style={{ color: '#f0e6c8', borderColor: 'rgba(255,255,255,0.12)', fontFamily: 'Oswald' }}
              >
                ⏩ pular
              </button>
            </div>
          </div>
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }}
                className="h-full rounded-full" style={{ background: '#D4A840' }} />
            </div>
          </div>
        </div>

        {/* Skip mode */}
        {skipping ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
            <div className="space-y-2 mb-6">
              {activeMatch.moments.map((m, i) => {
                const c = momentConfig(m.type)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 p-3 border rounded-sm"
                    style={{ borderColor: c.border, background: c.bg, borderLeft: `2px solid ${c.accent}` }}
                  >
                    <span className="flex-shrink-0 pt-0.5">{momentTypeIcon(m.type)}</span>
                    <p className="flex-1 text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.82)', fontFamily: 'Inter' }}>{m.text}</p>
                    <span className="text-xs font-black whitespace-nowrap flex-shrink-0" style={{ color: c.accent, fontFamily: 'Oswald' }}>{m.minute}'</span>
                  </motion.div>
                )
              })}
            </div>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: 'SKIP_TO_RESULT' })}
              className="w-full py-4 text-sm font-black tracking-widest"
              style={{ background: 'linear-gradient(135deg, #D4A840, #b8902e)', color: '#06060f', fontFamily: 'Oswald' }}
            >
              VER RESULTADO →
            </motion.button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMatch.momentIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Minute badge */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${cfg.accent}30)` }} />
                    <div className="flex items-center gap-2 px-4 py-1.5 border rounded-full"
                      style={{ borderColor: cfg.border, background: cfg.bg }}>
                      <span className="text-lg">{momentTypeIcon(currentMoment.type)}</span>
                      <span className="text-sm font-black" style={{ color: cfg.accent, fontFamily: 'Oswald' }}>
                        {currentMoment.minute}'
                      </span>
                      {cfg.label && (
                        <span className="text-xs font-black tracking-widest" style={{ color: cfg.accent, fontFamily: 'Oswald' }}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${cfg.accent}30)` }} />
                  </div>

                  {/* Main moment text — CINEMATIC */}
                  <div
                    className="p-6 mb-5 rounded-sm border"
                    style={{
                      background: currentMoment.isHighlight
                        ? `linear-gradient(135deg, ${cfg.bg}, rgba(6,6,15,0.4))`
                        : 'rgba(255,255,255,0.02)',
                      borderColor: currentMoment.isHighlight ? cfg.border : 'rgba(255,255,255,0.06)',
                      borderLeft: `3px solid ${cfg.accent}`,
                      boxShadow: currentMoment.isHighlight ? cfg.glow : 'none',
                    }}
                  >
                    <p
                      className="leading-relaxed"
                      style={{
                        color: '#f0e6c8',
                        fontFamily: 'Inter',
                        fontSize: currentMoment.isHighlight ? '1.1rem' : '0.95rem',
                        fontWeight: currentMoment.isHighlight ? 500 : 400,
                      }}
                    >
                      {currentMoment.text}
                    </p>
                    {currentMoment.traitUsed && (() => {
                      const t = stolenTraits.find(tr => tr.traitId === currentMoment.traitUsed)
                      if (!t) return null
                      return (
                        <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                          <span>{t.traitIcon}</span>
                          <span className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                            {t.traitName} · {t.maintenanceBar}%
                          </span>
                          {t.maintenanceBar < 30 && (
                            <span className="text-xs font-black ml-auto" style={{ color: '#E03535', fontFamily: 'Oswald' }}>⚠️ FRACO</span>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5 mb-4 justify-center flex-wrap">
                    {activeMatch.moments.map((m, i) => (
                      <div key={i} className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: i === activeMatch.momentIndex ? 22 : 5,
                          background: i < activeMatch.momentIndex
                            ? (m.scoreDelta > 0 ? '#22c55e' : m.scoreDelta < 0 ? '#E03535' : 'rgba(255,255,255,0.2)')
                            : i === activeMatch.momentIndex ? '#D4A840'
                            : 'rgba(255,255,255,0.08)',
                        }} />
                    ))}
                  </div>

                  <div className="text-center">
                    <motion.span
                      animate={{ opacity: [0.2, 0.55, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs"
                      style={{ color: 'rgba(240,230,200,0.3)', fontFamily: 'Inter' }}
                    >
                      transmissão ao vivo...
                    </motion.span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── RESULTADO ──
  const result = getEarnings()
  const isVictory = result.label === 'VITÓRIA'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: bg }}>

      {/* Victory atmospheric glow */}
      {isVictory && (
        <>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
            style={{ width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {Array.from({ length: 16 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                background: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#D4A840' : '#a78bfa',
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{ y: [0, -80, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
            />
          ))}
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Result header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
            className="text-7xl mb-3"
          >
            {result.emoji}
          </motion.div>
          <h1 className="text-5xl font-black mb-1" style={{ color: result.color, fontFamily: 'Oswald', textShadow: `0 0 30px ${result.color}55` }}>
            {result.label}
          </h1>
          <div className="text-xs opacity-25 mt-1" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            {currentClub} · partida #{(matchesPlayed ?? 0) + 1}
          </div>
        </div>

        {/* Placar grande */}
        <div className="flex items-center justify-center gap-6 mb-6 p-5 border rounded-sm" style={{ borderColor: `${result.color}22`, background: `${result.color}07` }}>
          <div className="text-center">
            <div className="text-5xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{activeMatch.goals}</div>
            <div className="text-xs opacity-35 mt-1 max-w-[80px] truncate" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{currentClub || player?.name}</div>
          </div>
          <div className="text-2xl font-black opacity-20" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>×</div>
          <div className="text-center">
            <div className="text-5xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{activeMatch.goalsAgainst}</div>
            <div className="text-xs opacity-35 mt-1 max-w-[80px] truncate" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{activeMatch.opponentName}</div>
          </div>
        </div>

        {/* Melhores momentos */}
        <div className="mb-5 space-y-1.5">
          {activeMatch.moments.filter(m => m.isHighlight || m.scoreDelta !== 0).map((m, i) => {
            const c = momentConfig(m.type)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-2.5 p-2.5 border rounded-sm"
                style={{ borderColor: c.border, background: c.bg, borderLeft: `2px solid ${c.accent}` }}
              >
                <span className="text-sm flex-shrink-0 pt-0.5">{momentTypeIcon(m.type)}</span>
                <p className="flex-1 text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.8)', fontFamily: 'Inter' }}>{m.text}</p>
                <span className="text-xs font-black flex-shrink-0" style={{ color: c.accent, fontFamily: 'Oswald' }}>{m.minute}'</span>
              </motion.div>
            )
          })}
        </div>

        {/* Ganhos */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 border rounded-sm text-center" style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.04)' }}>
            <div className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>+C${result.earned}</div>
            <div className="text-xs opacity-35 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>ganhos</div>
          </div>
          <div className="p-4 border rounded-sm text-center" style={{ borderColor: 'rgba(167,139,250,0.15)', background: 'rgba(167,139,250,0.04)' }}>
            <div className="text-2xl font-black" style={{ color: '#a78bfa', fontFamily: 'Oswald' }}>+{result.repGain}</div>
            <div className="text-xs opacity-35 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>reputação</div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(212,168,64,0.35)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => dispatch({ type: 'COMPLETE_MATCH', earned: result.earned, repGain: result.repGain })}
          className="w-full py-4 text-sm font-black tracking-widest"
          style={{ background: 'linear-gradient(135deg, #D4A840, #b8902e)', color: '#06060f', fontFamily: 'Oswald' }}
        >
          → VOLTAR AO MAPA
        </motion.button>
      </motion.div>
    </div>
  )
}
