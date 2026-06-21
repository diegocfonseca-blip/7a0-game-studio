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

export default function IntroScreen() {
  const { dispatch } = useGame()
  const [lineIndex, setLineIndex] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      size: 1 + Math.random() * 3,
    }))
  )

  useEffect(() => {
    if (lineIndex < LINES.length) {
      const timer = setTimeout(() => setLineIndex(l => l + 1), lineIndex === 5 ? 1200 : 900)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setShowButton(true), 600)
      return () => clearTimeout(timer)
    }
  }, [lineIndex])

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #06060f 70%)' }}>

      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: '#D4A840',
            boxShadow: `0 0 ${p.size * 3}px #D4A840`,
          }}
          animate={{ y: [0, -window.innerHeight - 50], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Field glow bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(26,61,26,0.4), transparent)' }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="text-xs tracking-[0.5em] mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
            7A0 GAME STUDIO APRESENTA
          </div>
          <h1
            className="text-6xl md:text-8xl font-black leading-none mb-2"
            style={{
              fontFamily: 'Oswald',
              color: '#D4A840',
              textShadow: '0 0 40px rgba(212,168,64,0.5), 0 0 80px rgba(212,168,64,0.2)',
              letterSpacing: '-0.02em'
            }}
          >
            O LADRÃO
          </h1>
          <h1
            className="text-6xl md:text-8xl font-black leading-none"
            style={{
              fontFamily: 'Oswald',
              color: '#f0e6c8',
              textShadow: '0 0 20px rgba(240,230,200,0.2)',
              letterSpacing: '-0.02em'
            }}
          >
            DE LENDAS
          </h1>
          <div className="mt-4 w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, #D4A840, transparent)' }} />
        </motion.div>

        {/* Narrative lines */}
        <div className="min-h-[160px] flex flex-col gap-2 mb-10">
          <AnimatePresence>
            {LINES.slice(0, lineIndex).map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === lineIndex - 1 ? 1 : 0.45, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-base md:text-lg"
                style={{
                  fontFamily: 'Inter',
                  color: line === '...' ? '#7c3aed' : '#f0e6c8',
                  fontStyle: line === '...' ? 'normal' : 'normal',
                  letterSpacing: line === '...' ? '0.5em' : 'normal',
                  fontWeight: i === lineIndex - 1 ? 500 : 400,
                }}
              >
                {line}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-sm tracking-widest opacity-60" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                1992 — AS LENDAS AINDA SÃO CRIANÇAS
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'creation' })}
                className="px-10 py-4 text-sm font-bold tracking-[0.3em] border transition-all duration-300"
                style={{
                  fontFamily: 'Oswald',
                  color: '#06060f',
                  background: '#D4A840',
                  borderColor: '#D4A840',
                  boxShadow: '0 0 30px rgba(212,168,64,0.4)',
                }}
              >
                INICIAR JORNADA
              </motion.button>
              <p className="text-xs opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Ninguém sabe o que eles vão ser. Exceto você.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
