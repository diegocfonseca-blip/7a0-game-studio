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
    tag: 'DOMINGO À TARDE',
    tagColor: C.pink,
    year: '28 de junho, 2026 — Campo do Seu Artur, São Paulo',
    lines: [
      'Pelada de casados. Você, seus parceiros de sempre e um sol de rachar.',
      'Um temporal chegou do nada — céu fechou em dois minutos.',
      'Ninguém quis parar. Vocês são loucos assim.',
    ],
    bg: '#1a1a1a',
    ink: '#F4ECD6',
  },
  {
    tag: 'O RAIO',
    tagColor: C.yellow,
    year: '16h47 — bola rolando no temporal',
    lines: [
      'Um estrondo. Uma luz branca que veio do céu e engoliu o campo inteiro.',
      'Você sentiu o cheiro de cabelo queimado.',
      'E depois — nada.',
    ],
    bg: '#3d3300',
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
      'Você olha as mãos: jovens. Firmes. Os seus amigos estão ao lado, tão perdidos quanto você.',
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
      'O raio mandou vocês 33 anos pro passado.',
      'Jovens, durnos, mas com a cabeça cheia de TRÊS DÉCADAS de futebol que ainda não aconteceram.',
      'Cada Copa. Cada lenda. Cada garoto de favela que vai virar mito.',
    ],
    bg: '#1a2e1a',
    ink: '#F4ECD6',
  },
  {
    tag: 'O PLANO',
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
    tag: 'A APOSTA',
    tagColor: C.pink,
    year: '',
    lines: [
      'O raio vai voltar. Ele sempre volta.',
      'No mesmo campo. No mesmo dia. Só que em 2026.',
      'Vocês têm 33 anos pra construir o maior império do futebol mundial antes de voltar pro futuro.',
    ],
    bg: '#3d0a2a',
    ink: '#F4ECD6',
  },
  {
    tag: 'SUA MISSÃO',
    tagColor: C.blue,
    year: '',
    lines: [
      'Vire empresário. Assine as lendas antes do mundo descobrir.',
      'Negocie cada contrato no SEU favor. Acumule patrimônio. Construa reputação.',
      'Quem chegar em 2026 com mais lendas no álbum, mais rico e mais respeitado — vence.',
    ],
    bg: '#0a1340',
    ink: '#F4ECD6',
  },
]

export default function IntroScreen() {
  const { state, dispatch } = useEmpresario()
  const [scene, setScene] = useState(0)

  const s = SCENES[scene]
  const isLast = scene === SCENES.length - 1
  const playerName = (state.playerNames[state.youIndex] ?? '').trim() || 'O Empresário'

  function next() {
    if (isLast) { start(); return }
    setScene(v => v + 1)
  }

  function start() {
    dispatch({ type: 'START_GAME', playerName })
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
            <BrutalButton color={s.tagColor} textColor="#fff" onClick={start}>
              INICIAR JORNADA →
            </BrutalButton>
            <p className="text-white/40 text-xs text-center mt-3 font-bold">
              {playerName} · 1993 · Você sabe o que ninguém sabe.
            </p>
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
