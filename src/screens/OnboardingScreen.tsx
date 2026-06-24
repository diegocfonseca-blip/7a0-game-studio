import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import type { StolenTrait } from '../types/game'

type Phase = 'pelada' | 'trait-pick' | 'peneira' | 'club-pick'

const PELADA_STEPS = [
  {
    title: 'DOMINGO NA PERIFERIA',
    text: 'Você tem 17 anos. BH, 1992. Num racha de domingo numa quadra de cimento sem marcação, sem clube, sem nada — você está aqui porque é o que você faz desde criança. A carreira não decolou ainda.',
  },
  {
    title: 'O GAROTO DO ESQUERDO',
    text: 'Um garoto miúdo, nem doze anos completos, recebe a bola no lado esquerdo. Dois marcadores mais velhos fecham. Sem espaço. E então ele curva o pé esquerdo de um jeito que você nunca viu — a bola encosta no chão de graça e dobra no canto impossível da grade improvisada. O racha para por um segundo.',
  },
  {
    title: 'A DIVIDIDA',
    text: 'Bola rolando. Você vai pra cima com uma dividida dura. Ombro no ombro. Os pés embaralham. Normal — acontece todo domingo. Mas você sente uma faísca entre o seu pé e o dele. Não é dor. É diferente. Como se algo tivesse passado de um corpo pro outro pelo choque.',
  },
  {
    title: 'ELE NÃO CONSEGUE MAIS',
    text: 'O garoto tenta chutar de novo. O esquerdo vai torto — sem força, sem curva, rasteiro pro nada. Ele olha pro próprio pé com cara de quem perdeu alguma coisa. Não sabe o quê. Tenta de novo. Nada. O esquerdo do garoto parou de funcionar.',
  },
  {
    title: 'AGORA É SEU',
    text: 'Você bate de primeira com o esquerdo — e a bola sai curvando, pesada, do jeito exato que era a dele. Ninguém notou. O garoto ainda olha pro próprio pé tentando entender. Você entende o que ele não vai entender nunca: você roubou. E pode fazer de novo.',
  },
]

const FREE_TRAITS: Array<{
  trait: Omit<StolenTrait, 'maintenanceBar' | 'mood' | 'stolenYear'>
  futureFact: string
  scene: string
  peneira: string[]
  label: string
}> = [
  {
    label: 'A Arrancada',
    futureFact: 'Esse garoto magro de 16 anos vai se tornar O Fenômeno. Dois Mundiais. Três vezes o melhor do mundo. Em 1992 ninguém acredita nisso — nem ele mesmo sabe. Só você veio do futuro. Só você sabe.',
    scene: 'Um garoto magro de 16 anos recebe a bola. Nem olhou pros lados. O primeiro passo foi tão explosivo que o marcador não saiu do lugar. Você sentiu aquilo nas pernas — como se o movimento tivesse imprimido no seu músculo.',
    trait: {
      legendId: 'r9', legendName: 'Ronaldo Nazário', legendNickname: 'O Fenômeno',
      traitId: 'r9-speed', traitName: 'Explosão em Sprint', traitIcon: '⚡',
      weeklyMaintenance: 200,
    },
    peneira: [
      'A peneira começa. Um racha de aquecimento. Você recebe a bola no meio-campo. Um marcador vem na sua direção.',
      'O que acontece no primeiro passo você ainda não entende direito. Mas o marcador parou. Ficou olhando pro lado onde você estava — você já estava do outro. Algo mudou.',
      'Um observador se levantou da cadeira. Anotou alguma coisa. Dois técnicos se olharam. Não disseram nada — mas você viu.',
    ],
  },
  {
    label: 'O Drible',
    futureFact: 'Esse baixinho de Porto Alegre vai enlouquecer o mundo inteiro com o drible. Vai dançar com a bola em Wembley, no Camp Nou, no Maracanã. Em 1992 ele ainda é só um garoto de periferia que ninguém olha. Só você sabe o que ele vai construir.',
    scene: 'Um garoto baixinho, 12 anos, recebe a bola perto da grade. Dois marcadores maiores vieram. Ele balançou o corpo pra um lado, foi pro outro — e os dois passaram por baixo. Você viu e sentiu o movimento acontecer nas suas pernas ao mesmo tempo.',
    trait: {
      legendId: 'ronaldinho', legendName: 'Ronaldo de Assis Moreira', legendNickname: 'Ronaldinho Gaúcho',
      traitId: 'rdinho-dribble', traitName: 'Pedalada Encantada', traitIcon: '🪄',
      weeklyMaintenance: 260,
    },
    peneira: [
      'A peneira. Espaço apertado. Marcadores juntos. É o teste que vai eliminar a maioria antes do treino acabar.',
      'Você recebe na lateral. Dois vieram ao mesmo tempo. O que estava nas suas pernas aconteceu antes que pensasse — e os dois passaram por baixo. Uma parte do grupo parou.',
      'O técnico adversário pediu pra refazer a jogada. Só pra ter certeza do que tinha visto. Você repetiu. Resultado idêntico.',
    ],
  },
  {
    label: 'O Chute',
    futureFact: 'Esse menino gordo do Rio vai ter um chute que vai tremer estádios. O Imperador. Vai marcar gols que os goleiros não tentam nem defender. Em 1992 ele nem tem time. Ninguém investiria um centavo nele. Só você sabe.',
    scene: 'Um menino gordo, 12 anos, recebeu a bola na entrada da área num treino de futsal. O chute foi seco, pesado — o som diferente de tudo que você ouviu hoje. A rede balançou por três segundos. Algo passou pra você naquele momento.',
    trait: {
      legendId: 'adriano', legendName: 'Adriano', legendNickname: 'O Imperador',
      traitId: 'adriano-power', traitName: 'Canhão Imperador', traitIcon: '💣',
      weeklyMaintenance: 200,
    },
    peneira: [
      'A peneira. Exercício de finalização. Cada um chuta uma vez. Você chega no seu turno.',
      'A bola chegou no seu pé. Você bateu. O som foi diferente — seco, pesado. O goleiro se jogou tarde. A rede ainda estava balançando quando o próximo jogador foi bater.',
      'O técnico parou o treino. Pediu outro chute. Mesmo resultado. Ele virou pro assistente, disse algo baixinho. O assistente concordou com a cabeça.',
    ],
  },
]

const CLUBS = [
  {
    id: 'guarani-lavras',
    name: 'Guarani de Lavras',
    flag: '🇧🇷',
    level: 1 as const,
    description: 'Interior de Minas. Time pequeno. Você vai jogar toda semana. Vai aprender errando em campo — não no banco.',
    bonus: '↑ Muitos jogos garantidos',
    tradeoff: '↓ Pouca visibilidade',
    startCoins: 600,
  },
  {
    id: 'portuguesa-mg',
    name: 'Portuguesa Mineira',
    flag: '🇧🇷',
    level: 2 as const,
    description: 'Time do estado. Equilibrado. Olheiros aparecem vez ou outra. Você existe no radar — mas precisa provar.',
    bonus: '↑ Olheiros nas partidas',
    tradeoff: '↓ Concorrência pela vaga',
    startCoins: 800,
  },
  {
    id: 'cruzeiro-sub23',
    name: 'Cruzeiro Sub-23',
    flag: '🇧🇷',
    level: 3 as const,
    description: 'Reserva do grande clube. Poucos jogos, muito treino. O nome abre portas — mas você vai sentar no banco por um tempo.',
    bonus: '↑ Prestígio. Portas abertas.',
    tradeoff: '↓ Pouco tempo de jogo',
    startCoins: 1000,
  },
]

export default function OnboardingScreen() {
  const { state, dispatch } = useGame()
  const { currentYear } = state

  const [phase, setPhase] = useState<Phase>('pelada')
  const [peladaStep, setPeladaStep] = useState(0)
  const [selectedTrait, setSelectedTrait] = useState<typeof FREE_TRAITS[0] | null>(null)
  const [peneiraStep, setPeneiraStep] = useState(0)

  const handlePeladaNext = () => {
    if (peladaStep < PELADA_STEPS.length - 1) {
      setPeladaStep(p => p + 1)
    } else {
      setPhase('trait-pick')
    }
  }

  const handlePickTrait = (option: typeof FREE_TRAITS[0]) => {
    setSelectedTrait(option)
    setPhase('peneira')
    setPeneiraStep(0)
  }

  const handlePeneiraNext = () => {
    if (!selectedTrait) return
    if (peneiraStep < selectedTrait.peneira.length - 1) {
      setPeneiraStep(p => p + 1)
    } else {
      setPhase('club-pick')
    }
  }

  const handlePickClub = (club: typeof CLUBS[0]) => {
    if (!selectedTrait) return
    const stolenTrait: StolenTrait = {
      ...selectedTrait.trait,
      maintenanceBar: 100,
      mood: '🔥',
      stolenYear: currentYear,
    }
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      trait: stolenTrait,
      clubName: club.name,
      clubLevel: club.level,
      startCoins: club.startCoins,
    })
  }

  const bg = 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: bg }}>

      <AnimatePresence mode="wait">

        {/* ── PELADA ── */}
        {phase === 'pelada' && (
          <motion.div key={`pelada-${peladaStep}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-xs tracking-widest mb-2 opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                BELO HORIZONTE · {currentYear}
              </div>
              <h1 className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                {PELADA_STEPS[peladaStep].title}
              </h1>
            </div>
            <div className="p-6 border rounded-sm mb-8"
              style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.04)' }}>
              <p className="text-base leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {PELADA_STEPS[peladaStep].text}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mb-6 justify-center">
              {PELADA_STEPS.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all"
                  style={{ width: i === peladaStep ? 24 : 8, background: i <= peladaStep ? '#D4A840' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handlePeladaNext}
              className="w-full py-4 font-bold tracking-widest text-sm"
              style={{
                background: peladaStep === PELADA_STEPS.length - 1 ? '#D4A840' : 'rgba(212,168,64,0.15)',
                color: peladaStep === PELADA_STEPS.length - 1 ? '#06060f' : '#D4A840',
                fontFamily: 'Oswald',
              }}>
              {peladaStep === PELADA_STEPS.length - 1 ? 'USAR O PODER →' : 'CONTINUAR →'}
            </motion.button>
          </motion.div>
        )}

        {/* ── ESCOLHA DO ALVO ── */}
        {phase === 'trait-pick' && (
          <motion.div key="trait-pick"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                VOCÊ SABE QUEM ELES VÃO SER
              </h2>
              <p className="text-sm leading-relaxed opacity-70" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Você veio do futuro. Esses jovens são desconhecidos agora — ninguém aposta neles. Mas você sabe o que vão construir. A janela está aberta. Qual você encontra primeiro?
              </p>
            </div>
            <div className="space-y-4">
              {FREE_TRAITS.map((option, i) => (
                <motion.button
                  key={option.trait.traitId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePickTrait(option)}
                  className="w-full p-5 border rounded-sm text-left"
                  style={{ background: 'rgba(212,168,64,0.04)', borderColor: 'rgba(212,168,64,0.2)' }}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{option.trait.traitIcon}</span>
                    <div className="flex-1">
                      <div className="font-black text-base mb-1" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                        {option.label} — {option.trait.traitName}
                      </div>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: '#f0e6c8', fontFamily: 'Inter', opacity: 0.85 }}>
                        {option.futureFact}
                      </p>
                      <p className="text-xs leading-relaxed opacity-55" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                        {option.scene}
                      </p>
                      <div className="mt-2 text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                        Manutenção: C${option.trait.weeklyMaintenance}/semana
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PENEIRA ── */}
        {phase === 'peneira' && selectedTrait && (
          <motion.div key={`peneira-${peneiraStep}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-xs tracking-widest mb-2 opacity-30" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                A PENEIRA · {currentYear}
              </div>
              <div className="text-4xl mb-3">{selectedTrait.trait.traitIcon}</div>
              <h2 className="text-2xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                {peneiraStep === 0 ? 'VOCÊ VAI A UMA PENEIRA' : peneiraStep === 1 ? 'NO CAMPO' : 'O QUE ACONTECEU'}
              </h2>
            </div>
            <div className="p-6 border rounded-sm mb-8"
              style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.04)' }}>
              <p className="text-base leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                {selectedTrait.peneira[peneiraStep]}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mb-6 justify-center">
              {selectedTrait.peneira.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all"
                  style={{ width: i === peneiraStep ? 24 : 8, background: i <= peneiraStep ? '#D4A840' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handlePeneiraNext}
              className="w-full py-4 font-bold tracking-widest text-sm"
              style={{
                background: peneiraStep === selectedTrait.peneira.length - 1 ? '#D4A840' : 'rgba(212,168,64,0.15)',
                color: peneiraStep === selectedTrait.peneira.length - 1 ? '#06060f' : '#D4A840',
                fontFamily: 'Oswald',
              }}>
              {peneiraStep === selectedTrait.peneira.length - 1 ? 'VER OS CLUBES INTERESSADOS →' : 'CONTINUAR →'}
            </motion.button>
          </motion.div>
        )}

        {/* ── ESCOLHA DO CLUBE ── */}
        {phase === 'club-pick' && (
          <motion.div key="club-pick"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-black mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                TRÊS CLUBES SE INTERESSARAM
              </h2>
              <p className="text-sm opacity-50 mb-6" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Onde você começa define como você cresce.
              </p>
            </div>
            <div className="space-y-4">
              {CLUBS.map((club, i) => (
                <motion.button
                  key={club.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePickClub(club)}
                  className="w-full p-5 border rounded-sm text-left"
                  style={{
                    background: club.level === 1 ? 'rgba(34,197,94,0.04)' : club.level === 2 ? 'rgba(212,168,64,0.04)' : 'rgba(124,58,237,0.04)',
                    borderColor: club.level === 1 ? 'rgba(34,197,94,0.2)' : club.level === 2 ? 'rgba(212,168,64,0.2)' : 'rgba(124,58,237,0.2)',
                  }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{club.flag}</span>
                    <div>
                      <div className="font-black text-base" style={{
                        color: club.level === 1 ? '#22c55e' : club.level === 2 ? '#D4A840' : '#c4b5fd',
                        fontFamily: 'Oswald',
                      }}>
                        {club.name}
                      </div>
                      <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                        {'★'.repeat(club.level)}{'☆'.repeat(3 - club.level)} · C${club.startCoins} inicial
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed opacity-70 mb-3" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {club.description}
                  </p>
                  <div className="flex gap-4 text-xs">
                    <span style={{ color: '#22c55e', fontFamily: 'Inter' }}>{club.bonus}</span>
                    <span style={{ color: '#E03535', fontFamily: 'Inter' }}>{club.tradeoff}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
