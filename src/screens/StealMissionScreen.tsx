import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { getLegendById } from '../data/legends'
import { getMission } from '../data/missions'
import type { StolenTrait } from '../types/game'

type MissionState = 'intro' | 'phase' | 'choice-result' | 'outcome'

export default function StealMissionScreen() {
  const { state, dispatch } = useGame()
  const { activeMission } = state

  const [missionState, setMissionState] = useState<MissionState>('intro')
  const [choiceResult, setChoiceResult] = useState<string>('')
  const [lastScore, setLastScore] = useState(0)
  const [finalOutcome, setFinalOutcome] = useState<'success' | 'partial' | 'fail'>('fail')
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])

  const legend = activeMission ? getLegendById(activeMission.legendId) : null
  const missionData = legend ? getMission(legend.id) : null
  const trait = legend?.traits.find(t => t.id === activeMission?.traitId)

  useEffect(() => {
    setMissionState('intro')
  }, [])

  if (!activeMission || !legend || !missionData || !trait) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#06060f' }}>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
          style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
          ← VOLTAR AO MAPA
        </button>
      </div>
    )
  }

  const currentPhaseData = missionData.phases[activeMission.phase]
  const totalScore = activeMission.choices.reduce((sum, c) => sum + c.score, 0)

  const handleChoice = (choiceIndex: number, score: number) => {
    const choice = currentPhaseData.choices[choiceIndex]
    setChoiceResult(choice.outcome)
    setLastScore(score)
    setMissionState('choice-result')

    dispatch({ type: 'MISSION_CHOICE', choiceIndex, score })
  }

  const handleContinueAfterChoice = () => {
    const nextPhase = activeMission.phase
    if (nextPhase >= missionData.phases.length) {
      const total = totalScore + lastScore
      let outcome: 'success' | 'partial' | 'fail'
      if (total >= 7) outcome = 'success'
      else if (total >= 5) outcome = 'partial'
      else outcome = 'fail'

      setFinalOutcome(outcome)
      setMissionState('outcome')

      if (outcome !== 'fail') {
        const stolenTrait: StolenTrait = {
          legendId: legend.id,
          legendName: legend.name,
          legendNickname: legend.nickname,
          traitId: trait.id,
          traitName: trait.name,
          traitIcon: trait.icon,
          maintenanceBar: outcome === 'success' ? 100 : 65,
          mood: outcome === 'success' ? '🔥' : '😊',
          stolenYear: state.currentYear,
          weeklyMaintenance: trait.weeklyMaintenance,
        }
        dispatch({
          type: 'COMPLETE_MISSION',
          success: true,
          partial: outcome === 'partial',
          trait: stolenTrait
        })

        if (outcome === 'success') {
          setParticles(Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: 30 + Math.random() * 40,
            y: 40 + Math.random() * 20,
          })))
        }
      } else {
        dispatch({ type: 'COMPLETE_MISSION', success: false })
      }
    } else {
      setMissionState('phase')
    }
  }

  const getScoreColor = (score: number) => {
    if (score === 3) return '#22c55e'
    if (score === 2) return '#f59e0b'
    return '#E03535'
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0d0814 0%, #06060f 70%)' }}
    >
      {/* Purple atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
      />

      {/* Success particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 4,
              height: 4,
              background: '#7c3aed',
              boxShadow: '0 0 8px #7c3aed',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              x: [(Math.random() - 0.5) * 200],
              y: [0, -100 - Math.random() * 100],
              opacity: [1, 0.8, 0],
            }}
            transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.4em] mb-1" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>
            MISSÃO DE ROUBO
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{legend.countryFlag}</span>
            <h2 className="text-2xl font-black" style={{ fontFamily: 'Oswald', color: legend.colorAccent }}>
              {legend.nickname}
            </h2>
          </div>
          <div className="text-sm opacity-60" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            Alvo: {trait.icon} {trait.name}
          </div>
          {missionState === 'phase' && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {missionData.phases.map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-1 rounded-full transition-all"
                  style={{
                    background: i < activeMission.phase
                      ? '#22c55e'
                      : i === activeMission.phase
                      ? '#D4A840'
                      : 'rgba(255,255,255,0.15)'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* INTRO */}
          {missionState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border rounded-sm p-6"
              style={{ background: '#0d0d1a', borderColor: `${legend.colorAccent}30` }}
            >
              {missionData.travelNarration && (
                <div className="mb-5 p-3 border-l-2 rounded-sm" style={{ borderColor: '#D4A840', background: 'rgba(212,168,64,0.05)' }}>
                  <p className="text-xs tracking-widest mb-1" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>A VIAGEM</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,230,200,0.75)', fontFamily: 'Inter' }}>
                    {missionData.travelNarration}
                  </p>
                </div>
              )}
              <p className="text-xs tracking-widest mb-4" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>SITUAÇÃO</p>
              <p className="text-base leading-relaxed mb-6" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {missionData.intro}
              </p>
              <div className="p-3 border border-white/5 rounded-sm mb-6" style={{ background: 'rgba(224,53,53,0.06)', borderColor: 'rgba(224,53,53,0.15)' }}>
                <p className="text-xs" style={{ color: 'rgba(224,53,53,0.8)', fontFamily: 'Inter' }}>
                  ⚡ Você vai precisar entrar no jogo com ele. Três fases — localizar, entrar, fazer a falta. O roubo acontece no contato físico. Escolha com cuidado.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMissionState('phase')}
                className="w-full py-3 font-bold tracking-widest"
                style={{
                  fontFamily: 'Oswald',
                  background: '#7c3aed',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(124,58,237,0.3)'
                }}
              >
                ENTRAR NA MISSÃO →
              </motion.button>
            </motion.div>
          )}

          {/* PHASE */}
          {missionState === 'phase' && currentPhaseData && (() => {
            const phaseLabels = ['LOCALIZAR O ALVO', 'ENTRAR NO JOGO', 'A FALTA ⚡']
            const isFaultPhase = activeMission.phase === missionData.phases.length - 1
            return (
              <motion.div
                key={`phase-${activeMission.phase}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <div
                  className="border rounded-sm p-5"
                  style={{ background: '#0d0d1a', borderColor: isFaultPhase ? 'rgba(224,53,53,0.3)' : 'rgba(255,255,255,0.08)' }}
                >
                  <p className="text-xs tracking-widest mb-3" style={{ color: isFaultPhase ? '#E03535' : '#D4A840', fontFamily: 'Oswald' }}>
                    FASE {activeMission.phase + 1} — {phaseLabels[activeMission.phase] ?? `FASE ${activeMission.phase + 1}`}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {currentPhaseData.scene}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs tracking-widest" style={{ color: 'rgba(240,230,200,0.4)', fontFamily: 'Oswald' }}>
                    {isFaultPhase ? 'COMO VOCÊ FAZ A FALTA?' : 'QUAL É SUA DECISÃO?'}
                  </p>
                  {currentPhaseData.choices.map((choice, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleChoice(i, choice.score)}
                      className="w-full p-4 border rounded-sm text-left transition-all"
                      style={{
                        background: isFaultPhase ? 'rgba(224,53,53,0.04)' : 'rgba(255,255,255,0.03)',
                        borderColor: isFaultPhase ? 'rgba(224,53,53,0.15)' : 'rgba(255,255,255,0.08)',
                        fontFamily: 'Inter',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-sm text-xs font-bold"
                          style={{ background: isFaultPhase ? 'rgba(224,53,53,0.15)' : 'rgba(255,255,255,0.06)', color: isFaultPhase ? '#E03535' : '#D4A840', fontFamily: 'Oswald' }}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm" style={{ color: '#f0e6c8' }}>{choice.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )
          })()}

          {/* CHOICE RESULT */}
          {missionState === 'choice-result' && (
            <motion.div
              key="choice-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="border rounded-sm p-6"
              style={{
                background: '#0d0d1a',
                borderColor: `${getScoreColor(lastScore)}30`,
                boxShadow: `0 0 20px ${getScoreColor(lastScore)}10`
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="px-2 py-0.5 text-xs font-bold"
                  style={{
                    background: `${getScoreColor(lastScore)}20`,
                    color: getScoreColor(lastScore),
                    fontFamily: 'Oswald'
                  }}
                >
                  {lastScore === 3 ? '✓ EXCELENTE' : lastScore === 2 ? '~ BOM' : '✗ ARRISCADO'}
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {choiceResult}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinueAfterChoice}
                className="w-full py-3 font-bold tracking-widest"
                style={{
                  fontFamily: 'Oswald',
                  background: activeMission.phase >= missionData.phases.length ? '#D4A840' : '#7c3aed',
                  color: activeMission.phase >= missionData.phases.length ? '#06060f' : '#fff',
                }}
              >
                {activeMission.phase >= missionData.phases.length ? 'VER RESULTADO →' : 'CONTINUAR →'}
              </motion.button>
            </motion.div>
          )}

          {/* OUTCOME */}
          {missionState === 'outcome' && (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-sm p-6 text-center"
              style={{
                background: '#0d0d1a',
                borderColor: finalOutcome === 'success'
                  ? 'rgba(124,58,237,0.5)'
                  : finalOutcome === 'partial'
                  ? 'rgba(245,158,11,0.4)'
                  : 'rgba(224,53,53,0.4)',
                boxShadow: finalOutcome === 'success' ? '0 0 40px rgba(124,58,237,0.2)' : 'none'
              }}
            >
              <div className="mb-4">
                {finalOutcome === 'success' && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="text-5xl mb-2"
                  >
                    ⚡
                  </motion.div>
                )}
                {finalOutcome === 'partial' && <div className="text-5xl mb-2">✨</div>}
                {finalOutcome === 'fail' && <div className="text-5xl mb-2">💨</div>}

                <h3
                  className="text-2xl font-black mb-2"
                  style={{
                    fontFamily: 'Oswald',
                    color: finalOutcome === 'success' ? '#7c3aed' : finalOutcome === 'partial' ? '#f59e0b' : '#E03535'
                  }}
                >
                  {finalOutcome === 'success' ? 'ROUBO COMPLETO' : finalOutcome === 'partial' ? 'ROUBO PARCIAL' : 'MISSÃO FALHOU'}
                </h3>

                {finalOutcome !== 'fail' && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 border mb-4"
                    style={{
                      borderColor: 'rgba(124,58,237,0.4)',
                      background: 'rgba(124,58,237,0.1)',
                    }}
                  >
                    <span className="text-lg">{trait.icon}</span>
                    <span className="text-sm font-bold" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{trait.name}</span>
                    {finalOutcome === 'partial' && (
                      <span className="text-xs" style={{ color: '#f59e0b', fontFamily: 'Inter' }}>65%</span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-6 text-left" style={{ color: 'rgba(240,230,200,0.8)', fontFamily: 'Inter' }}>
                {finalOutcome === 'success'
                  ? missionData.successText
                  : finalOutcome === 'partial'
                  ? missionData.partialText
                  : missionData.failText}
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
                className="w-full py-3 font-bold tracking-widest"
                style={{
                  fontFamily: 'Oswald',
                  background: '#D4A840',
                  color: '#06060f',
                }}
              >
                ← VOLTAR AO MAPA
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
