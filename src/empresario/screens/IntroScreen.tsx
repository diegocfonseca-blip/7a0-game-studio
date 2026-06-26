import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'

const SCENES = [
  {
    year: '2026',
    text: 'Você tem 60 anos.\nUma vida inteira no futebol\nsem nunca chegar a lugar nenhum.',
    subtext: 'Assistente de escolinha. R$2.200 por mês.',
    bg: 'from-gray-900 via-gray-800 to-gray-900',
    accent: '#888',
  },
  {
    year: '2026',
    text: 'Você conhece o futebol como ninguém.\nSabe quem são as lendas, quem vai ser grande,\nquem vai desperdiçar o talento.',
    subtext: 'Mas nunca ninguém te ouviu.',
    bg: 'from-gray-900 via-slate-900 to-gray-900',
    accent: '#aaa',
  },
  {
    year: '15 de março, 2026',
    text: 'Volta pra casa depois do treino.\nUm carro na contramão.',
    subtext: '',
    bg: 'from-red-950 via-gray-900 to-gray-950',
    accent: '#ef4444',
  },
  {
    year: '',
    text: '...',
    subtext: '',
    bg: 'from-black via-black to-black',
    accent: '#333',
  },
  {
    year: '1993',
    text: 'Você abre os olhos.',
    subtext: 'Tudo parece diferente. O cheiro, o som, as roupas das pessoas.',
    bg: 'from-amber-950 via-stone-900 to-amber-950',
    accent: '#d4a840',
  },
  {
    year: '1993',
    text: 'Você está jovem de novo.\nE na sua cabeça:\n30 anos de futebol que ainda não aconteceu.',
    subtext: 'Você sabe quem vai ser lenda. Só você.',
    bg: 'from-amber-900 via-stone-900 to-amber-950',
    accent: '#d4a840',
  },
  {
    year: '1993 — Belo Horizonte',
    text: 'Tem um garoto de 17 anos\njogando no Cruzeiro.\nNinguém sabe quem ele é.',
    subtext: 'Mas você sabe. Ele vai ser o Fenômeno.',
    bg: 'from-amber-800 via-stone-900 to-amber-900',
    accent: '#f0a020',
  },
]

export default function IntroScreen() {
  const { dispatch } = useEmpresario()
  const [scene, setScene] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)

  const currentScene = SCENES[scene]
  const isLast = scene === SCENES.length - 1

  function next() {
    if (isLast) {
      setShowNameInput(true)
      return
    }
    setScene(s => s + 1)
  }

  function startGame() {
    const name = playerName.trim() || 'O Empresário'
    dispatch({ type: 'START_GAME', playerName: name })
    dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div>
            <p className="text-amber-400 text-sm tracking-widest uppercase mb-3">Seu nome</p>
            <p className="text-white/60 text-sm">Como te chamavam antes do acidente?</p>
          </div>

          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            placeholder="Seu nome..."
            maxLength={24}
            className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-5 py-4
                       text-white text-center text-xl placeholder:text-white/20
                       focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-all"
            autoFocus
          />

          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black
                       text-lg py-4 rounded-xl tracking-widest uppercase transition-colors"
          >
            COMEÇAR EM 1993
          </motion.button>

          <p className="text-white/30 text-xs">
            Você sabe o que ninguém sabe.<br/>Use isso.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentScene.bg} flex flex-col items-center justify-center p-8 cursor-pointer`}
         onClick={next}>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg text-center space-y-6"
        >
          {currentScene.year && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs tracking-[0.3em] uppercase font-mono"
              style={{ color: currentScene.accent }}
            >
              {currentScene.year}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl md:text-3xl font-light text-white leading-relaxed whitespace-pre-line"
          >
            {currentScene.text}
          </motion.h1>

          {currentScene.subtext && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-base text-white/50 leading-relaxed"
            >
              {currentScene.subtext}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="pt-8"
          >
            {isLast ? (
              <motion.button
                onClick={e => { e.stopPropagation(); next() }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 rounded-xl font-black text-black text-sm tracking-widest uppercase"
                style={{ backgroundColor: currentScene.accent }}
              >
                VIRAR O JOGO
              </motion.button>
            ) : (
              <p className="text-white/20 text-xs tracking-widest animate-pulse">toque para continuar</p>
            )}
          </motion.div>

          <div className="flex justify-center gap-1.5 pt-2">
            {SCENES.map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: i === scene ? 24 : 6,
                  backgroundColor: i <= scene ? currentScene.accent : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
