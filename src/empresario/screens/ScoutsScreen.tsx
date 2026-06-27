import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import {
  getAvailableLegends, getCurrentRating, getMarketValue,
  getCurrentStatus, evaluateSigning, getMaxAcceptable, getFameDribleChance,
  getMinReputationToSign,
  getUnlockedNationalities, getLockedRegions, SCOUT_REGIONS,
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
  const unlockedNats = getUnlockedNationalities(state.purchasedUpgrades)
  const lockedRegions = getLockedRegions(state.purchasedUpgrades)
  const available = getAvailableLegends(state.year, signedIds, unlockedNats, state.lostLegends)

  // live commission prediction while dragging the slider
  const liveMax = selected ? getMaxAcceptable(selected, state.reputation, state.year) : 0
  const livePrediction = !selected ? null
    : rate <= liveMax - 5 ? { label: '😄 Ele topa fácil', color: C.green, text: '#fff' }
    : rate <= liveMax ? { label: '🤝 Ele aceita', color: C.teal, text: '#000' }
    : rate <= liveMax + 4 ? { label: '😬 Ele vai pechinchar', color: C.yellow, text: '#000' }
    : { label: '🚫 Ele vai recusar', color: C.orange, text: '#fff' }

  // fame drible risk + strikes
  const fameDribleChance = selected ? getFameDribleChance(selected, state.year) : 0
  const strikes = selected ? (state.rejectionCounts[selected.id] ?? 0) : 0
  const upfrontCost = selected ? selected.signingFee + selected.luva : 0
  const canAffordUpfront = selected ? state.money >= upfrontCost : false
  // reputation gate: famous players won't even talk to a no-name agent
  const minRep = selected ? getMinReputationToSign(selected, state.year) : 0
  const repBlocked = selected ? state.reputation < minRep : false

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
    if (state.money < selected.signingFee + selected.luva) return
    const strikesNow = state.rejectionCounts[selected.id] ?? 0
    const evalResult = evaluateSigning(selected, rate, state.reputation, state.year, strikesNow)
    setResult(evalResult)

    if (evalResult.result === 'accept') {
      setTimeout(() => {
        dispatch({ type: 'SIGN_CLIENT', legendId: selected.id, commissionRate: rate })
        setJustSigned(selected.nickname)
        setSelected(null)
        setResult(null)
        setTimeout(() => setJustSigned(null), 2200)
      }, 900)
    } else if (evalResult.result === 'reject') {
      dispatch({ type: 'LEGEND_REJECTED', legendId: selected.id, lost: !!evalResult.lost })
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

        {/* unlocked regions */}
        <div className="flex flex-wrap gap-1.5">
          <BrutalTag color={C.green} textColor="#fff">🇧🇷 BRASIL ✓</BrutalTag>
          {state.purchasedUpgrades.filter(u => u.startsWith('scout-')).map(u => {
            const r = SCOUT_REGIONS[u.replace('scout-', '')]
            return r ? <BrutalTag key={u} color={C.teal}>{r.flag} {r.label.toUpperCase()} ✓</BrutalTag> : null
          })}
        </div>

        {/* locked regions hint */}
        {lockedRegions.length > 0 && (
          <BrutalCard color={C.black} className="p-4">
            <p className="text-white font-black text-sm mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
              🔒 LENDAS ESCONDIDAS LÁ FORA
            </p>
            <p className="text-white/60 text-xs font-bold mb-3">
              Você só conhece o Brasil de cor. Pra achar lendas de outros países, contrate olheiros no Escritório:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {lockedRegions.map(r => (
                <BrutalTag key={r} color={C.creamDark}>{SCOUT_REGIONS[r].flag} {SCOUT_REGIONS[r].label}</BrutalTag>
              ))}
            </div>
            <BrutalButton color={C.yellow} textColor="#000" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'finance' })}>
              🔭 Contratar olheiros →
            </BrutalButton>
          </BrutalCard>
        )}

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
                      {state.reputation < getMinReputationToSign(legend, state.year) && (
                        <BrutalTag color={C.black} textColor="#fff">🔒 REP {getMinReputationToSign(legend, state.year)}+</BrutalTag>
                      )}
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
                {/* upfront cost breakdown: taxa + luva */}
                {!repBlocked && (
                <div className="border-[3px] border-black rounded-xl p-3 mb-3" style={{ backgroundColor: '#fff' }}>
                  <div className="flex justify-between text-xs font-bold text-black/60">
                    <span>Taxa de exclusividade</span><span>{money(selected.signingFee)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold mt-1" style={{ color: C.orange }}>
                    <span>💰 Luva (entrada)</span><span>{money(selected.luva)}</span>
                  </div>
                  <div className="border-t-2 border-black mt-2 pt-2 flex justify-between items-center">
                    <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>TOTAL AGORA</span>
                    <span className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif', color: canAffordUpfront ? C.black : C.orange }}>
                      {money(upfrontCost)}
                    </span>
                  </div>
                </div>
                )}
                {!repBlocked && (
                <div className="border-2 border-black rounded-lg p-2.5 mb-3" style={{ backgroundColor: C.yellow }}>
                  <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Por que a luva?</p>
                  <p className="text-black text-xs font-bold italic leading-snug">"{selected.luvaReason}"</p>
                </div>
                )}

                {/* strike warning */}
                {!repBlocked && strikes >= 1 && (
                  <BrutalCard color={C.orange} className="p-2.5 mb-3" shadow={3}>
                    <p className="text-white text-xs font-black">
                      ⚠ ÚLTIMA CHANCE! {selected.nickname} já recusou uma vez. Se recusar de novo, você o perde PRA SEMPRE.
                    </p>
                  </BrutalCard>
                )}

                {/* fame drible risk */}
                {!repBlocked && fameDribleChance > 0.05 && strikes === 0 && (
                  <BrutalCard color={C.black} className="p-2.5 mb-3" shadow={3}>
                    <p className="text-white text-xs font-bold">
                      🎲 {selected.nickname} já tem fama — pode dar um drible e recusar mesmo achando justo (~{Math.round(fameDribleChance * 100)}% de risco).
                    </p>
                  </BrutalCard>
                )}

                {repBlocked ? (
                  <>
                    <BrutalCard color={C.black} className="p-4 text-center">
                      <p className="text-4xl mb-1">🔒</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>ELE NEM TE RECEBE</p>
                      <p className="text-white/80 text-xs font-bold mt-2 leading-relaxed">
                        {selected.nickname} já é {getCurrentStatus(selected, state.year) === 'estrela' ? 'uma estrela' : 'profissional'} e não fala com um empresário desconhecido. Quem é você? Um zé-ninguém sem nome no meio.
                      </p>
                      <div className="border-2 border-white rounded-lg p-2 mt-3" style={{ backgroundColor: C.orange }}>
                        <p className="text-white text-xs font-black">
                          Precisa de REPUTAÇÃO {minRep}+ · você tem {state.reputation}
                        </p>
                      </div>
                      <p className="text-white/60 text-[11px] font-bold mt-2">
                        Construa seu nome: assine jovens, feche negócios e viva momentos de glória. Aí os grandes te procuram.
                      </p>
                    </BrutalCard>
                    <div className="mt-3">
                      <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                        Entendi
                      </BrutalButton>
                    </div>
                  </>
                ) : !result || result.result === 'counter' ? (
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

                    {/* LIVE prediction — você vê a reação antes de oferecer */}
                    {livePrediction && !result && (
                      <div className="mt-3 flex items-center justify-between border-[3px] border-black rounded-xl px-3 py-2"
                           style={{ backgroundColor: livePrediction.color }}>
                        <span className="font-black text-sm" style={{ color: livePrediction.text, fontFamily: 'Oswald, sans-serif' }}>
                          {livePrediction.label}
                        </span>
                        <span className="font-mono text-[10px] font-bold" style={{ color: livePrediction.text }}>
                          aceita até ~{liveMax}%
                        </span>
                      </div>
                    )}

                    {/* counter feedback */}
                    {result?.result === 'counter' && (
                      <BrutalCard color={C.orange} className="p-3 mt-3">
                        <p className="text-white text-xs font-bold">{result.reason}</p>
                      </BrutalCard>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {result?.result === 'counter' ? (
                        <>
                          <BrutalButton color="white" textColor={C.black} onClick={() => { setResult(null) }}>
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
                            disabled={!canAffordUpfront}
                            onClick={tryToSign}
                          >
                            {!canAffordUpfront ? 'Sem grana' : 'Oferecer'}
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
                ) : result.lost ? (
                  <>
                    <BrutalCard color={C.black} className="p-5 text-center">
                      <p className="text-5xl mb-1">💔</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>PERDIDO PRA SEMPRE</p>
                      <p className="text-white/80 text-xs font-bold mt-1">{result.reason}</p>
                    </BrutalCard>
                    <div className="mt-3">
                      <BrutalButton color={C.orange} textColor="#fff" onClick={() => { setSelected(null); setResult(null) }}>
                        Engolir o prejuízo
                      </BrutalButton>
                    </div>
                  </>
                ) : (
                  <>
                    <BrutalCard color={C.orange} className="p-4 text-center">
                      <p className="text-4xl mb-1">🚫</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>RECUSOU</p>
                      <p className="text-white/90 text-xs font-bold mt-1">{result.reason}</p>
                      <p className="text-white/70 text-[11px] font-black mt-2 uppercase">⚠ Recusar de novo = perde ele pra sempre</p>
                    </BrutalCard>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                        Recuar
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
