import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { MATCH_MOMENTS, generateOpponent } from '../data/matchMoments'

const PLAYER_BIRTH_YEAR = 1975

export default function MatchScreen() {
  const { state, dispatch } = useGame()
  const { activeMatch, stolenTraits, coins, currentYear, player, matchesPlayed } = state

  const [showChoiceResult, setShowChoiceResult] = useState<{ narration: string; score: number; traitIcon?: string } | null>(null)

  useEffect(() => {
    if (!activeMatch) {
      const opp = generateOpponent(currentYear, state.stolenFrom)
      dispatch({ type: 'START_MATCH', opponent: opp })
    }
  }, [])

  if (!activeMatch) return null

  const currentMoment = MATCH_MOMENTS[activeMatch.momentIndex]
  const playerAge = currentYear - PLAYER_BIRTH_YEAR
  const totalScore = activeMatch.choices.reduce((s, c) => s + c.score, 0)

  const getAvailableChoices = () => {
    if (!currentMoment) return []
    const traitIds = stolenTraits.map(t => t.traitId)
    const availableTrait = currentMoment.traitChoices.filter(c =>
      !c.requiredTraitId || traitIds.includes(c.requiredTraitId)
    )
    return [currentMoment.defaultChoice, ...availableTrait]
  }

  const handleChoice = (choiceIndex: number, score: number, narration: string, traitId: string | null, traitIcon?: string) => {
    setShowChoiceResult({ narration, score, traitIcon })
    setTimeout(() => {
      setShowChoiceResult(null)
      dispatch({
        type: 'MATCH_CHOICE',
        momentIndex: activeMatch.momentIndex,
        choiceIndex,
        score,
        traitUsed: traitId,
      })
    }, 2200)
  }

  const getResult = () => {
    const max = MATCH_MOMENTS.length * 3
    const pct = totalScore / max
    if (pct >= 0.75) return { label: 'VITÓRIA', emoji: '🏆', color: '#22c55e', earned: 400 + stolenTraits.length * 80 }
    if (pct >= 0.45) return { label: 'EMPATE', emoji: '🤝', color: '#f59e0b', earned: 180 + stolenTraits.length * 40 }
    return { label: 'DERROTA', emoji: '💀', color: '#E03535', earned: 60 }
  }

  const opponentStrengthLabel = activeMatch.opponentStrength >= 85
    ? 'LENDA EM FORMAÇÃO'
    : activeMatch.opponentStrength >= 70
    ? 'ADVERSÁRIO FORTE'
    : 'ADVERSÁRIO COMUM'

  // ── INTRO ──
  if (activeMatch.phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center">

          <div className="text-xs tracking-widest mb-2 opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
            {currentYear} · {player?.name} · {playerAge} anos
          </div>

          <div className="text-4xl font-black mb-1" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
            PARTIDA AMISTOSA
          </div>

          {/* VS */}
          <div className="my-8 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl mb-1">{player?.country === 'Brasil' ? '🇧🇷' : '⬜'}</div>
              <div className="text-sm font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{player?.name}</div>
              <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>você</div>
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>VS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">{activeMatch.opponentFlag}</div>
              <div className="text-sm font-black" style={{ color: activeMatch.opponentStrength >= 85 ? '#E03535' : '#f0e6c8', fontFamily: 'Oswald' }}>
                {activeMatch.opponentName}
              </div>
              <div className="text-xs font-bold" style={{
                color: activeMatch.opponentStrength >= 85 ? '#E03535' : '#f59e0b',
                fontFamily: 'Oswald'
              }}>
                {opponentStrengthLabel}
              </div>
            </div>
          </div>

          {activeMatch.opponentStrength >= 85 && (
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="mb-6 p-3 border rounded-sm text-sm"
              style={{ color: '#E03535', borderColor: 'rgba(224,53,53,0.3)', background: 'rgba(224,53,53,0.06)', fontFamily: 'Inter' }}>
              ⚠️ Você não roubou de {activeMatch.opponentName}. Ele cresceu forte. Este será um jogo difícil.
            </motion.div>
          )}

          {stolenTraits.length > 0 && (
            <div className="mb-6 p-3 border border-white/8 rounded-sm" style={{ background: 'rgba(124,58,237,0.06)' }}>
              <div className="text-xs tracking-widest mb-2 opacity-60" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>
                TRAÇOS DISPONÍVEIS NA PARTIDA
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {stolenTraits.map(t => (
                  <div key={t.traitId} className="flex items-center gap-1.5 px-2 py-1 border rounded-sm"
                    style={{ borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.1)' }}>
                    <span>{t.traitIcon}</span>
                    <span className="text-xs" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>{t.traitName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'MATCH_NEXT_PHASE' })}
            className="w-full py-4 text-sm font-bold tracking-widest"
            style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}
          >
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

  // ── MOMENT ──
  if (activeMatch.phase === 'moment' && currentMoment) {
    const choices = getAvailableChoices()
    const progress = activeMatch.momentIndex / MATCH_MOMENTS.length

    return (
      <div className="min-h-screen flex flex-col"
        style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}>

        {/* Match header */}
        <div className="border-b px-4 py-3" style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="text-sm font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              {player?.name} <span className="opacity-40">vs</span> {activeMatch.opponentName}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Momento {activeMatch.momentIndex + 1}/{MATCH_MOMENTS.length}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="max-w-lg mx-auto mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }}
              className="h-full rounded-full" style={{ background: '#D4A840' }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">

            {/* Minute badge */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border rounded-sm"
                style={{ borderColor: 'rgba(212,168,64,0.3)', background: 'rgba(212,168,64,0.08)' }}>
                <span className="text-sm font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                  ⏱ {currentMoment.minute}'
                </span>
              </div>
            </motion.div>

            {/* Situation */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-center mb-8">
              <h2 className="text-2xl font-black mb-2" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                {currentMoment.situation}
              </h2>
              <p className="text-sm opacity-60" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {currentMoment.context}
              </p>
            </motion.div>

            {/* Choices */}
            <AnimatePresence mode="wait">
              {!showChoiceResult ? (
                <motion.div key="choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-3">
                  {choices.map((choice, i) => {
                    const isTraitChoice = !!choice.requiredTraitId
                    const trait = isTraitChoice ? stolenTraits.find(t => t.traitId === choice.requiredTraitId) : null
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleChoice(i, choice.score, choice.narration, choice.requiredTraitId ?? null, choice.icon)}
                        className="w-full p-4 border rounded-sm text-left transition-all"
                        style={{
                          background: isTraitChoice ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
                          borderColor: isTraitChoice ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.1)',
                          boxShadow: isTraitChoice ? '0 0 12px rgba(124,58,237,0.1)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{choice.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-black" style={{ color: isTraitChoice ? '#c4b5fd' : '#f0e6c8', fontFamily: 'Oswald' }}>
                              {choice.text}
                            </div>
                            {isTraitChoice && trait && (
                              <div className="text-xs opacity-60 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                                traço de {trait.legendNickname} · {trait.maintenanceBar}% de carga
                              </div>
                            )}
                            {!isTraitChoice && (
                              <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                                opção segura
                              </div>
                            )}
                          </div>
                          {isTraitChoice && (
                            <div className="text-xs font-black px-2 py-1" style={{ background: 'rgba(124,58,237,0.2)', color: '#7c3aed', fontFamily: 'Oswald' }}>
                              TRAÇO
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              ) : (
                // ── CHOICE RESULT ──
                <motion.div key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 border rounded-sm text-center"
                  style={{
                    background: showChoiceResult.score === 3 ? 'rgba(34,197,94,0.06)' : showChoiceResult.score === 2 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)',
                    borderColor: showChoiceResult.score === 3 ? 'rgba(34,197,94,0.3)' : showChoiceResult.score === 2 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="text-4xl mb-3">
                    {showChoiceResult.score === 3 ? '⚽' : showChoiceResult.score === 2 ? '👍' : '😐'}
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {showChoiceResult.narration}
                  </p>
                  <div className="mt-3 text-xs font-bold" style={{
                    color: showChoiceResult.score === 3 ? '#22c55e' : showChoiceResult.score === 2 ? '#f59e0b' : '#6b7280',
                    fontFamily: 'Oswald'
                  }}>
                    {showChoiceResult.score === 3 ? '✨ JOGADA BRILHANTE' : showChoiceResult.score === 2 ? '👍 BOA JOGADA' : 'JOGADA COMUM'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ──
  const result = getResult()
  const repGain = totalScore >= 7 ? 8 : totalScore >= 5 ? 4 : 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center">

        {/* Result badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-6xl mb-4"
        >
          {result.emoji}
        </motion.div>

        <h1 className="text-5xl font-black mb-1" style={{ color: result.color, fontFamily: 'Oswald' }}>
          {result.label}
        </h1>
        <p className="text-sm opacity-50 mb-8" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
          {player?.name} vs {activeMatch.opponentName} · {currentYear}
        </p>

        {/* Scores recap */}
        <div className="mb-6 space-y-2">
          {activeMatch.choices.map((c, i) => {
            const moment = MATCH_MOMENTS[c.momentIndex]
            const choiceOptions = [moment.defaultChoice, ...moment.traitChoices]
            const chosen = choiceOptions[c.choiceIndex]
            return (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-sm text-left"
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-lg">{chosen?.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{moment.minute}' — {chosen?.text}</div>
                </div>
                <div className="text-xs font-black" style={{
                  color: c.score === 3 ? '#22c55e' : c.score === 2 ? '#f59e0b' : '#6b7280',
                  fontFamily: 'Oswald'
                }}>
                  {c.score === 3 ? '⭐⭐⭐' : c.score === 2 ? '⭐⭐' : '⭐'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Earnings */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>+C$ {result.earned}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>ganhos</div>
          </div>
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>+{repGain} REP</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>reputação</div>
          </div>
          <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>#{(matchesPlayed ?? 0) + 1}</div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>partida</div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'COMPLETE_MATCH', earned: result.earned, repGain })}
            className="w-full py-4 text-sm font-bold tracking-widest"
            style={{ background: '#D4A840', color: '#06060f', fontFamily: 'Oswald' }}
          >
            → VOLTAR AO MAPA
          </motion.button>
          {totalScore < MATCH_MOMENTS.length * 2 && (
            <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              Roube traços das lendas para ter mais opções nos momentos decisivos
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
