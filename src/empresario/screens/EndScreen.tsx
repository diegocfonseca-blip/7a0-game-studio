import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { yourNetWorth, levelInfo } from '../data/career'
import { LEGENDS } from '../data/legends'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag, BrutalPill } from '../ui'

interface EndScene {
  tag: string
  tagColor: string
  year: string
  lines: string[]
  bg: string
  ink: string
}

const END_SCENES: EndScene[] = [
  {
    tag: '30 DE JUNHO, 2026',
    tagColor: C.yellow,
    year: 'Campo do Seu Artur, São Paulo',
    lines: [
      'O céu fechou em dois minutos. O mesmo cheiro de antes — ozônio, grama molhada.',
      'Seus amigos olharam pro alto. Ninguém precisou falar nada.',
      'Era hora de voltar.',
    ],
    bg: '#1a1a1a',
    ink: '#F4ECD6',
  },
  {
    tag: 'O RAIO VOLTOU',
    tagColor: C.orange,
    year: '16h47',
    lines: [
      'A mesma luz branca. O mesmo estrondo.',
      'E então — o futuro.',
    ],
    bg: '#3d2200',
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
    tag: 'DE VOLTA',
    tagColor: C.teal,
    year: '28 de junho, 2026 — o mesmo dia que partiram',
    lines: [
      'O celular encheu de notificações.',
      'Mas vocês ainda estavam no campo, encharcados, rindo sem conseguir parar.',
      '33 anos em segundos. Uma vida inteira vivida duas vezes.',
    ],
    bg: '#0d2818',
    ink: '#F4ECD6',
  },
]

export default function EndScreen() {
  const { state, dispatch } = useEmpresario()
  const [scene, setScene] = useState(0)
  const [showScore, setShowScore] = useState(false)

  const myNet = yourNetWorth(state)
  const legendCount = state.everSignedIds.length
  const finalScore = myNet + (state.reputation * 50_000) + (legendCount * 500_000)

  const s = END_SCENES[scene]
  const isLast = scene === END_SCENES.length - 1

  function next() {
    if (isLast) { setShowScore(true); return }
    setScene(v => v + 1)
  }

  // Build online ranking with final scores
  const onlineBoard = state.onlineMode === 'online' && state.onlinePlayers.length > 1
    ? state.onlinePlayers
        .filter(p => p.playerIndex !== state.youIndex)
        .map(p => ({
          name: p.playerName,
          score: p.money + (p.totalDeals * 200_000),
          deals: p.totalDeals,
          clients: (state.onlinePlayerRosters[p.playerIndex] ?? []).length,
          you: false,
        }))
        .concat([{ name: state.playerNames[state.youIndex] ?? 'Você', score: finalScore, deals: state.totalDeals, clients: legendCount, you: true }])
        .sort((a, b) => b.score - a.score)
    : []

  const myRank = onlineBoard.findIndex(b => b.you) + 1

  if (showScore) {
    return (
      <div className="min-h-screen pb-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto px-4 py-8 space-y-5">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <BrutalPill color={C.yellow} textColor={C.black}>⚡ FIM DA JORNADA</BrutalPill>
            <h1 className="text-white font-black text-4xl mt-4 leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
              33 ANOS.<br />UMA CARREIRA LENDÁRIA.
            </h1>
          </motion.div>

          {/* Final score card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <BrutalCard color={C.yellow} className="p-5" shadow={6}>
              <p className="text-black/60 font-mono text-xs uppercase tracking-widest">Score Final</p>
              <p className="text-black font-black text-5xl mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {(finalScore / 1_000_000).toFixed(1)}M
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-black/10 border-2 border-black rounded-lg p-2 text-center">
                  <p className="text-black/50 text-[10px] font-black uppercase">Patrimônio</p>
                  <p className="text-black font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(myNet)}</p>
                </div>
                <div className="bg-black/10 border-2 border-black rounded-lg p-2 text-center">
                  <p className="text-black/50 text-[10px] font-black uppercase">Reputação</p>
                  <p className="text-black font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.reputation}/100</p>
                </div>
                <div className="bg-black/10 border-2 border-black rounded-lg p-2 text-center">
                  <p className="text-black/50 text-[10px] font-black uppercase">Lendas</p>
                  <p className="text-black font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{legendCount}</p>
                </div>
              </div>
            </BrutalCard>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="grid grid-cols-2 gap-3">
              <BrutalCard color={C.blue} className="p-4 text-center" shadow={4}>
                <p className="text-white font-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.totalDeals}</p>
                <p className="text-white/60 text-xs font-bold">Transferências fechadas</p>
              </BrutalCard>
              <BrutalCard color={C.teal} className="p-4 text-center" shadow={4}>
                <p className="text-black font-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{moneyFull(state.totalEarned)}</p>
                <p className="text-black/60 text-xs font-bold">Total ganho em deals</p>
              </BrutalCard>
              <BrutalCard color={C.pink} className="p-4 text-center" shadow={4}>
                <p className="text-black font-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>⭐ {levelInfo(state.xp).level}</p>
                <p className="text-black/60 text-xs font-bold">Nível atingido</p>
              </BrutalCard>
              <BrutalCard color={C.orange} className="p-4 text-center" shadow={4}>
                <p className="text-white font-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.awards}x</p>
                <p className="text-white/60 text-xs font-bold">Empresário do Ano</p>
              </BrutalCard>
            </div>
          </motion.div>

          {/* Album legends */}
          {legendCount > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <BrutalCard color="white" className="p-4" shadow={4}>
                <p className="font-black text-black text-sm mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>📖 LENDAS NO ÁLBUM ({legendCount})</p>
                <div className="flex flex-wrap gap-1.5">
                  {state.everSignedIds.map(id => {
                    const l = LEGENDS.find(x => x.id === id)
                    return l ? (
                      <BrutalTag key={id} color={C.yellow}>{l.nickname}</BrutalTag>
                    ) : null
                  })}
                </div>
              </BrutalCard>
            </motion.div>
          )}

          {/* Online ranking */}
          {onlineBoard.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              <p className="font-black text-white text-lg mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                🏆 RANKING FINAL
              </p>
              {myRank === 1 && (
                <BrutalCard color={C.yellow} className="p-3 mb-2" shadow={4}>
                  <p className="font-black text-black text-center text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    👑 VOCÊ VENCEU! Melhor empresário do grupo!
                  </p>
                </BrutalCard>
              )}
              <div className="space-y-2">
                {onlineBoard.map((b, i) => (
                  <BrutalCard key={b.name} color={b.you ? C.teal : 'white'} className="p-3" shadow={3}>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-lg w-6 ${b.you ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {i + 1}º
                      </span>
                      <span className={`flex-1 font-black text-sm ${b.you ? 'text-white' : 'text-black'}`}>{b.name}</span>
                      <span className={`font-black text-sm ${b.you ? 'text-white' : 'text-black/60'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {(b.score / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  </BrutalCard>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            <BrutalButton color={C.orange} textColor="#fff" onClick={() => {
              if (confirm('Começar uma nova jornada? Isso apaga todo o progresso atual e volta pra 1993.')) {
                dispatch({ type: 'NEW_GAME' })
              }
            }}>
              ⚡ Nova jornada — voltar pra 1993
            </BrutalButton>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col cursor-pointer transition-colors duration-700"
      style={{ backgroundColor: s.bg }}
      onClick={next}
    >
      <div className="flex gap-1.5 p-5 pt-6">
        {END_SCENES.map((_, i) => (
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
        <p className="text-center text-xs font-bold tracking-widest animate-pulse" style={{ color: s.tagColor }}>
          {isLast ? 'TOQUE PARA VER SEU LEGADO' : 'TOQUE PARA CONTINUAR'}
        </p>
      </div>
    </div>
  )
}
