import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { C, BrutalButton, BrutalPill } from '../ui'

interface Scene {
  tag: string
  tagColor: string
  year: string
  lines: string[]
  bg: string
  ink: string
}

const SCENES: Scene[] = [
  {
    tag: 'HOJE',
    tagColor: C.pink,
    year: '27 de junho, 2026 — São Paulo',
    lines: [
      'Você tem 60 anos.',
      'Trinta deles dados ao futebol — como roupeiro, como auxiliar, como o cara que enche as garrafas de água numa escolinha de bairro.',
      'R$ 2.200 por mês. Aluguel atrasado. Um joelho que range.',
    ],
    bg: '#1a1a1a',
    ink: '#F4ECD6',
  },
  {
    tag: 'O DOM',
    tagColor: C.yellow,
    year: 'Uma vida inteira observando',
    lines: [
      'Mas tem uma coisa que ninguém nunca te tirou:',
      'você ENXERGA o jogo.',
      'Você sabe quem vai ser craque antes de qualquer olheiro. Sempre soube. Só que ninguém nunca te ouviu — você era só o velho da escolinha.',
    ],
    bg: '#0d2818',
    ink: '#F4ECD6',
  },
  {
    tag: 'O ACIDENTE',
    tagColor: C.orange,
    year: '22:47 — a caminho de casa',
    lines: [
      'A chuva. O farol estourado. O caminhão na contramão.',
      'Um estrondo branco.',
      'E então — silêncio.',
    ],
    bg: '#3d0a0a',
    ink: '#F4ECD6',
  },
  {
    tag: '',
    tagColor: C.black,
    year: '',
    lines: ['...'],
    bg: '#000000',
    ink: '#444',
  },
  {
    tag: 'ACORDA',
    tagColor: C.teal,
    year: '199...?',
    lines: [
      'O cheiro é outro. Cigarro no ar. Um rádio de pilha tocando Mamonas Assassinas.',
      'Você olha as mãos: jovens. Firmes.',
      'No jornal dobrado na mesa: 14 de março de 1993.',
    ],
    bg: '#2a1f08',
    ink: '#F4ECD6',
  },
  {
    tag: 'A FICHA CAI',
    tagColor: C.yellow,
    year: '1993',
    lines: [
      'Você voltou 33 anos no tempo.',
      'Está jovem. Está duro. Mas na sua cabeça moram TRÊS DÉCADAS de futebol que ainda não aconteceram.',
      'Você sabe cada Copa. Cada lenda. Cada garoto de favela e de vila que vai virar mito.',
    ],
    bg: '#1a2e1a',
    ink: '#F4ECD6',
  },
  {
    tag: 'A JOGADA',
    tagColor: C.orange,
    year: '1993 — Belo Horizonte, agora',
    lines: [
      'Tem um magrelo de 16 anos treinando na base do Cruzeiro. Dentes pra fora, pernas de palito.',
      'Os olheiros olham e dão de ombros.',
      'Você olha e vê o FENÔMENO. Vê os dois gols na final de 2002.',
      'Ninguém no mundo sabe disso. Só você.',
    ],
    bg: '#3a2406',
    ink: '#F4ECD6',
  },
  {
    tag: 'SUA MISSÃO',
    tagColor: C.blue,
    year: '',
    lines: [
      'Vire empresário. Assine as lendas antes do mundo descobrir.',
      'Negocie cada contrato no SEU favor. Fique podre de rico.',
      'Você tem o maior trunfo da história do futebol: o futuro inteiro na memória.',
    ],
    bg: '#0a1340',
    ink: '#F4ECD6',
  },
]

export default function IntroScreen() {
  const { dispatch } = useEmpresario()
  const [scene, setScene] = useState(0)
  const [showName, setShowName] = useState(false)
  const [name, setName] = useState('')

  const s = SCENES[scene]
  const isLast = scene === SCENES.length - 1

  function next() {
    if (isLast) { setShowName(true); return }
    setScene(v => v + 1)
  }

  function start() {
    dispatch({ type: 'START_GAME', playerName: name.trim() || 'O Empresário' })
    dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })
  }

  if (showName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: C.cream }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <BrutalPill color={C.orange} textColor="#fff">UM ÚLTIMO DETALHE</BrutalPill>
            <h1 className="font-black text-3xl text-black mt-4 leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
              QUAL É O SEU NOME?
            </h1>
            <p className="text-black/50 text-sm mt-2 font-medium">Como vão te chamar nos bastidores do futebol?</p>
          </div>

          <div
            className="bg-white border-[3px] border-black rounded-2xl p-1 mb-5"
            style={{ boxShadow: `5px 5px 0 0 ${C.black}` }}
          >
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
              placeholder="Seu nome..."
              maxLength={20}
              autoFocus
              className="w-full bg-transparent px-4 py-3 text-black text-center text-xl font-black
                         placeholder:text-black/20 focus:outline-none"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            />
          </div>

          <BrutalButton color={C.blue} onClick={start}>
            COMEÇAR EM 1993 →
          </BrutalButton>
          <p className="text-black/40 text-xs text-center mt-4 font-bold">
            Você sabe o que ninguém sabe. Use isso.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col cursor-pointer transition-colors duration-700"
      style={{ backgroundColor: s.bg }}
      onClick={next}
    >
      {/* progress dots */}
      <div className="flex gap-1.5 p-5 pt-6">
        {SCENES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full flex-1 transition-all duration-500 border border-black/20"
            style={{ backgroundColor: i <= scene ? s.tagColor : 'rgba(255,255,255,0.12)' }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-20 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
          >
            {s.tag && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <BrutalPill color={s.tagColor} textColor={C.black}>{s.tag}</BrutalPill>
              </motion.div>
            )}

            {s.year && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="font-mono text-xs mt-4 mb-5 tracking-wide"
                style={{ color: s.tagColor }}
              >
                {s.year}
              </motion.p>
            )}

            <div className="space-y-4">
              {s.lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.25 }}
                  className={`leading-relaxed font-medium ${i === 0 ? 'text-2xl font-black' : 'text-lg'}`}
                  style={{ color: s.ink, fontFamily: i === 0 ? 'Oswald, sans-serif' : 'inherit' }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 max-w-md mx-auto w-full">
        {isLast ? (
          <div onClick={e => e.stopPropagation()}>
            <BrutalButton color={s.tagColor} textColor="#fff" onClick={next}>
              VIRAR O JOGO →
            </BrutalButton>
          </div>
        ) : (
          <p className="text-center text-xs font-bold tracking-widest animate-pulse" style={{ color: s.tagColor }}>
            TOQUE PARA CONTINUAR
          </p>
        )}
      </div>
    </div>
  )
}
