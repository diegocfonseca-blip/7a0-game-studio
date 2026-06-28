import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { LEGENDS } from '../data/legends'
import { rarityOf } from '../data/career'
import type { Legend } from '../types'
import { C, BrutalCard, BrutalButton, BrutalTag, FLAG, POS_COLOR } from '../ui'

type Status = 'signed' | 'seen' | 'stolen' | 'unknown'

export default function AlbumScreen() {
  const { state, dispatch } = useEmpresario()
  const [open, setOpen] = useState<Legend | null>(null)

  const signed = new Set(state.everSignedIds)
  const seen = new Set(state.seenLegendIds)
  const stolen = new Set(state.nemesisTaken)

  function statusOf(id: string): Status {
    if (signed.has(id)) return 'signed'
    if (stolen.has(id)) return 'stolen'  // a rival grabbed them — gone, even if you'd seen them
    if (seen.has(id)) return 'seen'
    return 'unknown'
  }

  const order: Record<Status, number> = { signed: 0, seen: 1, stolen: 2, unknown: 3 }
  const cards = [...LEGENDS].sort((a, b) => {
    const d = order[statusOf(a.id)] - order[statusOf(b.id)]
    if (d !== 0) return d
    return b.truePotential - a.truePotential
  })

  const discovered = LEGENDS.filter(l => signed.has(l.id) || seen.has(l.id)).length
  const total = LEGENDS.length
  const pct = Math.round((discovered / total) * 100)
  const goldCount = state.everSignedIds.length

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      {/* header */}
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>📔 ÁLBUM DE LENDAS</h1>
          <BrutalTag color={C.yellow}>{discovered}/{total}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* progress */}
        <BrutalCard color={C.purple} className="p-4" shadow={6}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Coleção completa</p>
            <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{pct}%</p>
          </div>
          <div className="h-4 bg-black/25 border-2 border-black rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.yellow }} />
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <BrutalTag color={C.yellow}>🏆 {goldCount} agenciadas</BrutalTag>
            <BrutalTag color="white">🔍 {discovered - goldCount} descobertas</BrutalTag>
            {stolen.size > 0 && <BrutalTag color={C.orange} textColor="#fff">😈 {[...stolen].filter(id => !signed.has(id)).length} roubadas</BrutalTag>}
          </div>
        </BrutalCard>

        <p className="text-black/50 text-xs font-bold text-center">
          Cada lenda que você garimpa ou agencia entra no álbum. As douradas são suas. Complete a coleção!
        </p>

        {/* sticker grid */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map(legend => {
            const st = statusOf(legend.id)
            const known = st === 'signed' || st === 'seen'
            const rar = rarityOf(legend.truePotential)

            if (st === 'unknown') {
              return (
                <BrutalCard key={legend.id} color={C.creamDark} className="p-3 text-center opacity-70" shadow={2}>
                  <div className="text-3xl">🌫️</div>
                  <p className="font-black text-black/40 text-sm mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>? ? ?</p>
                  <p className="text-black/30 text-[10px] font-bold mt-1">Ainda não descoberto</p>
                </BrutalCard>
              )
            }

            if (st === 'stolen') {
              return (
                <BrutalCard key={legend.id} color={C.black} className="p-3 text-center" shadow={2}>
                  <div className="text-2xl">😈</div>
                  <p className="font-black text-white text-sm mt-1 truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.nickname}</p>
                  <p className="text-orange-400 text-[10px] font-black mt-1 uppercase">Roubado pelo rival</p>
                </BrutalCard>
              )
            }

            return (
              <motion.div key={legend.id} layout whileTap={{ scale: 0.96 }}>
                <BrutalCard
                  color={st === 'signed' ? C.yellow : 'white'}
                  className="p-3 relative"
                  shadow={rar.rank >= 3 ? 5 : 3}
                  onClick={() => known && setOpen(legend)}
                  style={st === 'signed' ? { boxShadow: `0 0 0 0 ${C.black}, 5px 5px 0 0 ${C.black}` } : undefined}
                >
                  {st === 'signed' && (
                    <span className="absolute -top-2 -right-2 text-lg rotate-12">🏆</span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{FLAG[legend.nationality]}</span>
                    <span className="text-lg" style={{ filter: rar.rank >= 3 ? 'drop-shadow(0 0 3px ' + rar.color + ')' : 'none' }}>{rar.emoji}</span>
                  </div>
                  <p className="font-black text-black text-sm mt-1 truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.nickname}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <BrutalTag color={POS_COLOR[legend.position]} textColor="#fff">{legend.position}</BrutalTag>
                  </div>
                  <div className="mt-2 border-t-2 border-black/15 pt-1.5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase" style={{ color: rar.color }}>{rar.label}</span>
                    <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.truePotential}</span>
                  </div>
                </BrutalCard>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* detail modal */}
      <AnimatePresence>
        {open && (() => {
          const rar = rarityOf(open.truePotential)
          const isGold = signed.has(open.id)
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-5"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setOpen(null)}
            >
              <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <BrutalCard color={isGold ? C.yellow : C.cream} className="p-5" shadow={8}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl">{FLAG[open.nationality]}</div>
                    <div className="flex-1">
                      <p className="font-black text-black text-2xl leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{open.nickname}</p>
                      <p className="text-black/50 text-sm font-bold">{open.name}</p>
                    </div>
                    <button onClick={() => setOpen(null)} className="text-black text-2xl font-black">×</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <BrutalTag color={rar.color} textColor="#fff">{rar.emoji} {rar.label}</BrutalTag>
                    <BrutalTag color={POS_COLOR[open.position]} textColor="#fff">{open.position}</BrutalTag>
                    <BrutalTag color="white">POT {open.truePotential}</BrutalTag>
                    {isGold && <BrutalTag color={C.black} textColor="#fff">🏆 AGENCIADO</BrutalTag>}
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 mb-2">
                    <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">📍 Onde você o achou</p>
                    <p className="text-black text-xs font-medium italic leading-relaxed">{open.discoveryStory}</p>
                  </div>
                  <div className="border-2 border-black rounded-lg p-3" style={{ backgroundColor: C.blue }}>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">🔮 O que SÓ você sabe</p>
                    <p className="text-white text-xs font-bold leading-relaxed">{open.futureKnowledge}</p>
                  </div>
                  <div className="mt-4">
                    <BrutalButton color={C.black} textColor="#fff" onClick={() => setOpen(null)}>Fechar</BrutalButton>
                  </div>
                </BrutalCard>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
