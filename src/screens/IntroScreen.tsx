import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'

const LINES = [
  '2008. Sua última partida.',
  'Terceira divisão. Placar já decidido.',
  'Você nunca foi bom o suficiente.',
  'A bola veio. Você foi de cabeça.',
  'O poste não perdoou.',
  '...',
  'Quando você acordou...',
  '...era 1992.',
]

const LINE_DELAYS = [900, 900, 900, 900, 900, 1300, 900, 1000]

export default function IntroScreen() {
  const { state, dispatch } = useGame()
  const hasSave = !!state.player
  const [lineIndex, setLineIndex] = useState(0)
  const [showButton, setShowButton] = useState(false)

  const [particles] = useState(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
      size: 0.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.6,
      gold: Math.random() > 0.3,
    }))
  )

  useEffect(() => {
    if (lineIndex < LINES.length) {
      const timer = setTimeout(() => setLineIndex(l => l + 1), LINE_DELAYS[lineIndex] ?? 900)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setShowButton(true), 700)
      return () => clearTimeout(timer)
    }
  }, [lineIndex])

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0f0f22 0%, #06060f 65%)' }}
    >
      {/* Deep field glow — bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(20,60,20,0.55), transparent)' }} />

      {/* Spotlight cone */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse at bottom, rgba(212,168,64,0.06) 0%, transparent 70%)',
        }} />

      {/* Subtle horizontal lines (field texture) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 40px)',
        }} />

      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: p.size,
            height: p.size,
            background: p.gold ? '#D4A840' : '#a78bfa',
            boxShadow: `0 0 ${p.size * 4}px ${p.gold ? '#D4A840' : '#7c3aed'}`,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -(window.innerHeight + 60)], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Big ghost ball behind logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none select-none"
        style={{ fontSize: 340, opacity: 0.018, lineHeight: 1 }}>
        ⚽
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl w-full">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="mb-10"
        >
          <div className="relative inline-block">
            <h1
              className="text-7xl md:text-9xl font-black leading-none"
              style={{
                fontFamily: 'Oswald',
                color: '#D4A840',
                textShadow: '0 0 60px rgba(212,168,64,0.45), 0 0 120px rgba(212,168,64,0.15)',
                letterSpacing: '-0.02em',
              }}
            >
              O LADRÃO
            </h1>
          </div>
          <h1
            className="text-7xl md:text-9xl font-black leading-none mb-1"
            style={{
              fontFamily: 'Oswald',
              color: '#f0e6c8',
              textShadow: '0 0 30px rgba(240,230,200,0.12)',
              letterSpacing: '-0.02em',
            }}
          >
            DE LENDAS
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
            className="h-px mx-auto origin-left"
            style={{ background: 'linear-gradient(to right, transparent, #D4A840, transparent)', maxWidth: 200 }}
          />
        </motion.div>

        {/* Narrative lines */}
        <div className="min-h-[180px] flex flex-col gap-2.5 mb-10 w-full">
          <AnimatePresence>
            {LINES.slice(0, lineIndex).map((line, i) => {
              const isCurrent = i === lineIndex - 1
              const isSuspense = line === '...'
              const isWakeup = line === '...era 1992.'

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{
                    opacity: isCurrent ? 1 : 0.35,
                    y: 0,
                    filter: 'blur(0px)',
                  }}
                  transition={{ duration: 0.45 }}
                  className="text-center"
                >
                  <span
                    className={`${isSuspense ? 'text-2xl' : isWakeup ? 'text-xl md:text-2xl font-black' : 'text-base md:text-lg'}`}
                    style={{
                      fontFamily: isSuspense ? 'Oswald' : 'Inter',
                      color: isSuspense ? '#7c3aed' : isWakeup ? '#D4A840' : '#f0e6c8',
                      letterSpacing: isSuspense ? '0.6em' : 'normal',
                      fontWeight: isCurrent && !isSuspense ? 500 : 400,
                      textShadow: isWakeup && isCurrent ? '0 0 20px rgba(212,168,64,0.4)' : 'none',
                    }}
                  >
                    {line}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center gap-4 w-full max-w-sm"
            >
              <p className="text-xs tracking-[0.35em] opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                1992 — AS LENDAS AINDA SÃO CRIANÇAS
              </p>

              {hasSave ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(212,168,64,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
                    className="w-full px-10 py-4 text-sm font-black tracking-[0.3em] transition-all duration-300"
                    style={{
                      fontFamily: 'Oswald',
                      color: '#06060f',
                      background: 'linear-gradient(135deg, #D4A840, #b8902e)',
                      boxShadow: '0 0 35px rgba(212,168,64,0.4)',
                    }}
                  >
                    CONTINUAR JORNADA →
                  </motion.button>
                  <button
                    onClick={() => {
                      if (window.confirm('Apagar tudo e começar do zero?')) {
                        dispatch({ type: 'RESET_GAME' })
                      }
                    }}
                    className="text-xs opacity-30 hover:opacity-60 transition-opacity"
                    style={{ color: '#f0e6c8', fontFamily: 'Inter' }}
                  >
                    ↺ novo jogo
                  </button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(212,168,64,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'creation' })}
                  className="w-full px-10 py-4 text-sm font-black tracking-[0.3em] transition-all duration-300"
                  style={{
                    fontFamily: 'Oswald',
                    color: '#06060f',
                    background: 'linear-gradient(135deg, #D4A840, #b8902e)',
                    boxShadow: '0 0 35px rgba(212,168,64,0.4)',
                  }}
                >
                  INICIAR JORNADA →
                </motion.button>
              )}

              <p className="text-xs opacity-25" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Ninguém sabe o que eles vão ser. Exceto você.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
