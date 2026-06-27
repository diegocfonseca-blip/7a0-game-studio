import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import {
  getAvailableLegends, getCurrentRating, getMarketValue,
  getCurrentStatus, evaluateSigning,
} from '../data/legends'
import type { Legend, SigningEvaluation } from '../types'
import {
  C, money, BrutalCard, BrutalButton, BrutalPill, BrutalTag,
  POS_COLOR, FLAG, STATUS_LABEL,
} from '../ui'

export default function ScoutsScreen() {
  const { state, dispatch } = useEmpresario()
  const [selected, setSelected] = useState<Legend | null>(null)
  const [rate, setRate] = useState(15)
  const [result, setResult] = useState<SigningEvaluation | null>(null)
  const [justSigned, setJustSigned] = useState<string | null>(null)

  const signedIds = state.clients.map(c => c.legendId)
  const available = getAvailableLegends(state.year, signedIds)

  // Deterministic weekly pool
  const seed = state.year * 137 + state.week * 31
  const pool = [...available]
    .sort((a, b) => {
      const ha = Math.abs(Math.sin(seed + a.id.charCodeAt(0) * 7.7 + a.id.charCodeAt(1) * 3.3))
      const hb = Math.abs(Math.sin(seed + b.id.charCodeAt(0) * 7.7 + b.id.charCodeAt(1) * 3.3))
      return ha - hb
    })
    .slice(0, 6)

  function openPlayer(legend: Legend) {
    setSelected(selected?.id === legend.id ? null : legend)
    setRate(15)
    setResult(null)
  }

  function tryToSign() {
    if (!selected) return
    if (state.money < selected.signingFee) return
    const evalResult = evaluateSigning(selected, rate, state.reputation, state.year)
    setResult(evalResult)

    if (evalResult.result === 'accept') {
      setTimeout(() => {
        dispatch({ type: 'SIGN_CLIENT', legendId: selected.id, commissionRate: rate })
        setJustSigned(selected.nickname)
        setSelected(null)
        setResult(null)
        setTimeout(() => setJustSigned(null), 2200)
      }, 900)
    }
  }

  function acceptCounter() {
    if (!selected || !result) return
    dispatch({ type: 'SIGN_CLIENT', legendId: selected.id, commissionRate: result.maxAcceptable })
    setJustSigned(selected.nickname)
    setSelected(null)
    setResult(null)
    setTimeout(() => setJustSigned(null), 2200)
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      {/* header */}
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
                  className="text-white text-2xl font-black">←</button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>RADAR DE TALENTOS</h1>
          </div>
          <BrutalTag color={C.yellow}>{money(state.money)}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <BrutalCard color={C.yellow} className="p-3">
          <p className="text-black text-xs font-bold text-center">
            ✦ Só VOCÊ enxerga o potencial real. Os olheiros do mundo veem só a nota atual.
          </p>
        </BrutalCard>

        {pool.length === 0 && (
          <BrutalCard color={C.creamDark} className="p-7 text-center">
            <p className="text-4xl mb-2">🕰️</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>NINGUÉM NOVO ESSA SEMANA</p>
            <p className="text-black/50 text-sm font-medium mt-1">Avance semanas — novas safras de lendas vão surgindo a cada ano.</p>
          </BrutalCard>
        )}

        {pool.map(legend => {
          const rating = getCurrentRating(legend, state.year)
          const value = getMarketValue(legend, state.year)
          const status = getCurrentStatus(legend, state.year)
          const st = STATUS_LABEL[status]
          const isOpen = selected?.id === legend.id
          const isGem = legend.truePotential >= 90

          return (
            <motion.div key={legend.id} layout>
              <BrutalCard
                color={isOpen ? C.cream : 'white'}
                className="p-4"
                onClick={() => openPlayer(legend)}
                shadow={isGem ? 6 : 4}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{FLAG[legend.nationality]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {legend.name}
                      </span>
                      {isGem && <span className="text-lg">✨</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <BrutalTag color={POS_COLOR[legend.position]} textColor="#fff">{legend.position}</BrutalTag>
                      {st && <BrutalTag color={st.color} textColor={status === 'pelada' ? '#fff' : '#000'}>{st.label}</BrutalTag>}
                      <span className="text-black/40 text-xs font-bold">{state.year - legend.birthYear}a · {legend.club}</span>
                    </div>
                  </div>
                </div>

                {/* stat row */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-black/5 border-2 border-black rounded-lg p-2 text-center">
                    <p className="text-black/40 text-[9px] font-black uppercase">Nota hoje</p>
                    <p className="font-black text-black text-lg leading-none mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{rating}</p>
                  </div>
                  <div className="bg-black/5 border-2 border-black rounded-lg p-2 text-center">
                    <p className="text-black/40 text-[9px] font-black uppercase">Valor</p>
                    <p className="font-black text-black text-base leading-none mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(value)}</p>
                  </div>
                  <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.yellow }}>
                    <p className="text-black/60 text-[9px] font-black uppercase">Potencial ✦</p>
                    <p className="font-black text-black text-lg leading-none mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.truePotential}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {/* discovery story */}
                      <div className="mt-3 bg-white border-2 border-black rounded-lg p-3">
                        <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">📍 Onde você o achou</p>
                        <p className="text-black text-xs font-medium leading-relaxed italic">{legend.discoveryStory}</p>
                      </div>
                      {/* future knowledge */}
                      <div className="mt-2 border-2 border-black rounded-lg p-3" style={{ backgroundColor: C.blue }}>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">🔮 O que SÓ você sabe</p>
                        <p className="text-white text-xs font-bold leading-relaxed">{legend.futureKnowledge}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </BrutalCard>
            </motion.div>
          )
        })}
      </div>

      {/* ── SIGNING SHEET ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-30"
          >
            <div className="max-w-md mx-auto m-3">
              <BrutalCard color={C.cream} className="p-5" shadow={8}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    ASSINAR {selected.nickname.toUpperCase()}
                  </p>
                  <button onClick={() => { setSelected(null); setResult(null) }} className="text-black text-2xl font-black">×</button>
                </div>
                <p className="text-black/50 text-xs font-bold mb-4">
                  Taxa de exclusividade: {money(selected.signingFee)} · Mensal: {money(selected.monthlyFee)}
                </p>

                {!result || result.result === 'counter' ? (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-black/60 text-xs font-black uppercase">Sua comissão</span>
                      <span className="font-black text-black text-3xl leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{rate}%</span>
                    </div>
                    <input
                      type="range" min={5} max={30} step={1} value={rate}
                      onChange={e => { setRate(Number(e.target.value)); setResult(null) }}
                      className="w-full h-3 appearance-none cursor-pointer accent-black"
                      style={{ accentColor: C.blue }}
                    />
                    <div className="flex justify-between text-black/40 text-[10px] font-black mt-1">
                      <span>5% GENEROSO</span>
                      <span>30% GANANCIOSO</span>
                    </div>

                    {/* counter feedback */}
                    {result?.result === 'counter' && (
                      <BrutalCard color={C.orange} className="p-3 mt-3">
                        <p className="text-white text-xs font-bold">{result.reason}</p>
                      </BrutalCard>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {result?.result === 'counter' ? (
                        <>
                          <BrutalButton color="white" textColor={C.black} onClick={() => { setRate(selected ? Math.max(5, evaluateSigning(selected, 0, state.reputation, state.year).maxAcceptable) : rate); setResult(null) }}>
                            Insistir
                          </BrutalButton>
                          <BrutalButton color={C.green} onClick={acceptCounter}>
                            Topar {result.maxAcceptable}%
                          </BrutalButton>
                        </>
                      ) : (
                        <>
                          <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                            Cancelar
                          </BrutalButton>
                          <BrutalButton
                            color={C.blue}
                            disabled={state.money < selected.signingFee}
                            onClick={tryToSign}
                          >
                            {state.money < selected.signingFee ? 'Sem $' : 'Oferecer'}
                          </BrutalButton>
                        </>
                      )}
                    </div>
                  </>
                ) : result.result === 'accept' ? (
                  <BrutalCard color={C.green} className="p-4 text-center">
                    <p className="text-4xl mb-1">🤝</p>
                    <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>FECHOU!</p>
                    <p className="text-white/90 text-xs font-bold mt-1">{result.reason}</p>
                  </BrutalCard>
                ) : (
                  <>
                    <BrutalCard color={C.orange} className="p-4 text-center">
                      <p className="text-4xl mb-1">🚫</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>RECUSOU</p>
                      <p className="text-white/90 text-xs font-bold mt-1">{result.reason}</p>
                    </BrutalCard>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                        Desistir
                      </BrutalButton>
                      <BrutalButton color={C.blue} onClick={() => { setRate(Math.max(5, result.maxAcceptable)); setResult(null) }}>
                        Baixar p/ {result.maxAcceptable}%
                      </BrutalButton>
                    </div>
                  </>
                )}
              </BrutalCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* signed toast */}
      <AnimatePresence>
        {justSigned && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-20 left-0 right-0 z-40 flex justify-center px-4"
          >
            <BrutalPill color={C.green} textColor="#fff" className="!text-sm !px-4 !py-2">
              ✓ {justSigned} agora é seu cliente!
            </BrutalPill>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
