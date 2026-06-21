import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { generateMatchOpponent } from '../data/matchMoments'
import { generateMatchNarration } from '../data/matchNarration'

const PLAYER_BIRTH_YEAR = 1975

const MATCH_TYPE_CONFIG = {
  racha:    { label: 'RACHA',    icon: '⚡', moments: 3, mult: 0.6, color: '#f59e0b' },
  amistoso: { label: 'AMISTOSO', icon: '⚽', moments: 5, mult: 1.0, color: '#D4A840' },
  decisiva: { label: 'DECISIVA', icon: '🏆', moments: 8, mult: 1.5, color: '#22c55e' },
}

export default function MatchScreen() {
  const { state, dispatch } = useGame()
  const { activeMatch, stolenTraits, currentYear, player, matchesPlayed, clubLevel, pendingMatchType, nextMatchMult } = state
  const mtConfig = MATCH_TYPE_CONFIG[pendingMatchType ?? 'amistoso']

  useEffect(() => {
    if (!activeMatch) {
      const opp = generateMatchOpponent(clubLevel ?? 1, currentYear)
      const { moments, goals, goalsAgainst } = generateMatchNarration(
        player?.name ?? 'Você',
        stolenTraits,
        opp.name,
        opp.strength,
        state.reputation,
        mtConfig.moments,
      )
      dispatch({ type: 'START_MATCH', opponent: opp, moments, goals, goalsAgainst, matchType: pendingMatchType ?? 'amistoso' })
    }
  }, [])

  if (!activeMatch) return null

  const playerAge = currentYear - PLAYER_BIRTH_YEAR

  // Score running até o momento atual
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

  const momentColor = (type: string) => {
    if (type === 'goal') return { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.3)', label: '#22c55e', text: 'GOL!' }
    if (type === 'opponent-goal') return { bg: 'rgba(224,53,53,0.06)', border: 'rgba(224,53,53,0.3)', label: '#E03535', text: 'TOMAMOS' }
    if (type === 'skill') return { bg: 'rgba(212,168,64,0.06)', border: 'rgba(212,168,64,0.25)', label: '#D4A840', text: 'JOGAÇO' }
    if (type === 'miss') return { bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.2)', label: '#6b7280', text: 'PERDIDA' }
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', label: '#6b7280', text: '' }
  }

  const getEarnings = () => {
    const win = activeMatch.goals > activeMatch.goalsAgainst
    const draw = activeMatch.goals === activeMatch.goalsAgainst
    const mt = MATCH_TYPE_CONFIG[activeMatch.matchType ?? 'amistoso']
    const m = mt.mult * (nextMatchMult ?? 1.0)
    if (win) return { label: 'VITÓRIA', emoji: '🏆', color: '#22c55e', earned: Math.round((350 + stolenTraits.length * 70) * m), repGain: activeMatch.goals - activeMatch.goalsAgainst + 3 }
    if (draw) return { label: 'EMPATE', emoji: '🤝', color: '#f59e0b', earned: Math.round((150 + stolenTraits.length * 30) * m), repGain: 2 }
    return { label: 'DERROTA', emoji: '💀', color: '#E03535', earned: Math.round(60 * m), repGain: 1 }
  }

  const bg = 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)'

  // ── INTRO ──
  if (activeMatch.phase === 'intro') {
    const opStrLabel = activeMatch.opponentStrength >= 70 ? 'ADVERSÁRIO FORTE' : activeMatch.opponentStrength >= 50 ? 'ADVERSÁRIO MÉDIO' : 'ADVERSÁRIO FRACO'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: bg }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">

          <div className="text-xs tracking-widest mb-2 opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
            {currentYear} · {player?.name} · {playerAge} anos
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="text-4xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>PARTIDA</div>
            <div className="px-2.5 py-1 border rounded-sm text-sm font-black tracking-wider"
              style={{ color: mtConfig.color, borderColor: `${mtConfig.color}40`, background: `${mtConfig.color}10`, fontFamily: 'Oswald' }}>
              {mtConfig.icon} {mtConfig.label}
            </div>
          </div>

          <div className="my-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl mb-1">{player?.country === 'Brasil' ? '🇧🇷' : '⬜'}</div>
              <div className="text-sm font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{player?.name}</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>você</div>
            </div>
            <div className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>VS</div>
            <div className="text-center">
              <div className="text-3xl mb-1">{activeMatch.opponentFlag}</div>
              <div className="text-sm font-black" style={{ color: activeMatch.opponentStrength >= 70 ? '#f59e0b' : '#f0e6c8', fontFamily: 'Oswald' }}>
                {activeMatch.opponentName}
              </div>
              <div className="text-xs font-bold" style={{ color: activeMatch.opponentStrength >= 70 ? '#f59e0b' : 'rgba(240,230,200,0.5)', fontFamily: 'Oswald' }}>
                {opStrLabel}
              </div>
            </div>
          </div>

          {(nextMatchMult ?? 1) > 1 && (
            <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="mb-3 p-3 border rounded-sm text-sm"
              style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', fontFamily: 'Inter' }}>
              ✨ Bônus ativo: ×{(nextMatchMult ?? 1).toFixed(1)} nos ganhos desta partida
            </motion.div>
          )}

          {activeMatch.opponentStrength >= 65 && (
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="mb-5 p-3 border rounded-sm text-sm"
              style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', fontFamily: 'Inter' }}>
              ⚠️ Adversário forte. Vai exigir o melhor dos seus traços.
            </motion.div>
          )}

          {stolenTraits.length > 0 && (
            <div className="mb-6 p-3 border border-white/8 rounded-sm text-left" style={{ background: 'rgba(124,58,237,0.05)' }}>
              <div className="text-xs tracking-widest mb-2 opacity-50" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>TRAÇOS NA PARTIDA</div>
              <div className="flex flex-wrap gap-2">
                {stolenTraits.map(t => {
                  const crit = t.maintenanceBar < 30
                  return (
                    <div key={t.traitId} className="flex items-center gap-1.5 px-2 py-1 border rounded-sm"
                      style={{ borderColor: crit ? 'rgba(224,53,53,0.4)' : 'rgba(124,58,237,0.3)', background: crit ? 'rgba(224,53,53,0.08)' : 'rgba(124,58,237,0.08)' }}>
                      <span>{t.traitIcon}</span>
                      <span className="text-xs" style={{ color: crit ? '#E03535' : '#f0e6c8', fontFamily: 'Inter' }}>{t.traitName}</span>
                      {crit && <span className="text-xs font-black" style={{ color: '#E03535' }}>⚠️{t.maintenanceBar}%</span>}
                    </div>
                  )
                })}
              </div>
              {stolenTraits.some(t => t.maintenanceBar < 30) && (
                <p className="text-xs mt-2" style={{ color: '#E03535', fontFamily: 'Inter' }}>Traços em vermelho renderão menos hoje.</p>
              )}
            </div>
          )}

          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'MATCH_NEXT_PHASE' })}
            className="w-full py-4 text-sm font-bold tracking-widest"
            style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}>
            APITAR O JOGO →
          </motion.button>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
            className="mt-4 text-xs opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            ← voltar ao mapa
          </button>
        </motion.div>
      </div>
    )
  }

  // ── NARRAÇÃO ──
  if (activeMatch.phase === 'narration' && currentMoment) {
    const color = momentColor(currentMoment.type)
    const progress = activeMatch.momentIndex / activeMatch.moments.length

    return (
      <div className="min-h-screen flex flex-col" style={{ background: bg }}>

        {/* Header com placar corrente */}
        <div className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="text-sm font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              {player?.name} <span className="opacity-30">vs</span> {activeMatch.opponentName}
            </div>
            <div className="text-xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              {runningGoals} <span className="opacity-40 text-base">×</span> {runningGoalsAgainst}
            </div>
          </div>
          <div className="max-w-lg mx-auto mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }}
              className="h-full rounded-full" style={{ background: '#D4A840' }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">

            <AnimatePresence mode="wait">
              <motion.div key={activeMatch.momentIndex}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}>

                {/* Badge do minuto */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 border rounded-sm"
                    style={{ borderColor: color.border, background: color.bg }}>
                    <span className="text-lg">{momentTypeIcon(currentMoment.type)}</span>
                    <span className="text-sm font-black" style={{ color: color.label, fontFamily: 'Oswald' }}>
                      {currentMoment.minute}'
                    </span>
                    {color.text && (
                      <span className="text-xs font-black tracking-widest" style={{ color: color.label, fontFamily: 'Oswald' }}>
                        {color.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Texto da narração */}
                <div className="p-6 border rounded-sm mb-6"
                  style={{ background: currentMoment.isHighlight ? color.bg : 'rgba(255,255,255,0.02)', borderColor: currentMoment.isHighlight ? color.border : 'rgba(255,255,255,0.08)' }}>
                  <p className="text-base leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {currentMoment.text}
                  </p>
                  {currentMoment.traitUsed && (() => {
                    const t = stolenTraits.find(tr => tr.traitId === currentMoment.traitUsed)
                    if (!t) return null
                    return (
                      <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <span>{t.traitIcon}</span>
                        <span className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                          {t.traitName} · {t.maintenanceBar}% de carga
                        </span>
                        {t.maintenanceBar < 30 && (
                          <span className="text-xs font-black" style={{ color: '#E03535', fontFamily: 'Oswald' }}>⚠️ FRACO</span>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Progresso */}
                <div className="flex items-center gap-2 mb-6 justify-center">
                  {activeMatch.moments.map((m, i) => (
                    <div key={i} className="h-1 rounded-full transition-all"
                      style={{
                        width: i === activeMatch.momentIndex ? 20 : 6,
                        background: i < activeMatch.momentIndex
                          ? (m.scoreDelta > 0 ? '#22c55e' : m.scoreDelta < 0 ? '#E03535' : 'rgba(255,255,255,0.3)')
                          : i === activeMatch.momentIndex ? '#D4A840' : 'rgba(255,255,255,0.1)',
                      }} />
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch({ type: 'MATCH_NEXT_MOMENT' })}
                  className="w-full py-4 text-sm font-bold tracking-widest"
                  style={{ background: 'rgba(212,168,64,0.12)', color: '#D4A840', border: '1px solid rgba(212,168,64,0.25)', fontFamily: 'Oswald' }}>
                  {activeMatch.momentIndex === activeMatch.moments.length - 1 ? 'VER RESULTADO →' : 'CONTINUAR →'}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULTADO ──
  const result = getEarnings()
  const isWin = activeMatch.goals > activeMatch.goalsAgainst

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: bg }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-6xl mb-4">{result.emoji}</motion.div>

        <h1 className="text-5xl font-black mb-1" style={{ color: result.color, fontFamily: 'Oswald' }}>{result.label}</h1>

        {/* PLACAR */}
        <div className="my-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{activeMatch.goals}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{player?.name}</div>
          </div>
          <div className="text-xl opacity-30 font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>×</div>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{activeMatch.goalsAgainst}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{activeMatch.opponentName}</div>
          </div>
        </div>

        {/* Momentos resumo */}
        <div className="mb-5 space-y-2 text-left">
          {activeMatch.moments.map((m, i) => {
            const c = momentColor(m.type)
            return (
              <div key={i} className="flex items-start gap-3 p-2.5 border rounded-sm"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-sm pt-0.5">{momentTypeIcon(m.type)}</span>
                <div className="flex-1">
                  <span className="text-xs" style={{ color: 'rgba(240,230,200,0.55)', fontFamily: 'Inter' }}>{m.text}</span>
                </div>
                <span className="text-xs font-black whitespace-nowrap" style={{ color: c.label, fontFamily: 'Oswald' }}>
                  {m.minute}'
                </span>
              </div>
            )
          })}
        </div>

        {/* Estado dos traços usados */}
        {(() => {
          const used = [...new Set(activeMatch.moments.map(m => m.traitUsed).filter(Boolean))]
          const usedTraits = used.map(id => stolenTraits.find(t => t.traitId === id)).filter(Boolean) as typeof stolenTraits
          if (!usedTraits.length) return null
          return (
            <div className="mb-5 p-4 border rounded-sm text-left" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-xs tracking-widest mb-3 opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>ESTADO DOS TRAÇOS USADOS</div>
              {usedTraits.map(t => {
                const barColor = t.maintenanceBar > 70 ? '#22c55e' : t.maintenanceBar > 30 ? '#f59e0b' : '#E03535'
                return (
                  <div key={t.traitId} className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{t.traitIcon} {t.traitName}</span>
                      <span className="text-xs font-black" style={{ color: barColor, fontFamily: 'Oswald' }}>{t.maintenanceBar}%{t.maintenanceBar < 30 ? ' ⚠️' : ''}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${t.maintenanceBar}%`, background: barColor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Ganhos */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>+C${result.earned}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>ganhos</div>
          </div>
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>+{result.repGain}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>reputação</div>
          </div>
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>#{(matchesPlayed ?? 0) + 1}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>partida</div>
          </div>
        </div>

        {!isWin && stolenTraits.length === 0 && (
          <p className="text-xs opacity-40 mb-4" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            Roube traços das lendas para mudar o rumo das partidas
          </p>
        )}

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => dispatch({ type: 'COMPLETE_MATCH', earned: result.earned, repGain: result.repGain })}
          className="w-full py-4 text-sm font-bold tracking-widest"
          style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}>
          → VOLTAR AO MAPA
        </motion.button>
      </motion.div>
    </div>
  )
}
