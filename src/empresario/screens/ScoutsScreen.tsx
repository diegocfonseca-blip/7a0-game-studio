import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { getAvailableLegends, getCurrentRating, getMarketValue } from '../data/legends'
import type { Legend } from '../types'

const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', IT: '🇮🇹',
  PT: '🇵🇹', ES: '🇪🇸', NL: '🇳🇱', DE: '🇩🇪',
}

const POS_COLORS: Record<string, string> = {
  ATA: 'text-red-400 bg-red-500/10 border-red-500/20',
  MEI: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ZAG: 'text-green-400 bg-green-500/10 border-green-500/20',
  LAT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  GOL: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

function formatMoney(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function ScoutsScreen() {
  const { state, dispatch } = useEmpresario()
  const [selectedLegend, setSelectedLegend] = useState<Legend | null>(null)
  const [commissionRate, setCommissionRate] = useState(15)
  const [signing, setSigning] = useState(false)

  // Get available legends this week (not signed, not seen too recently)
  const available = getAvailableLegends(state.year, [])
  // Show 6 random ones, making sure legends already signed are not shown as signable again
  const signedIds = state.clients.map(c => c.legendId)

  // Deterministic weekly selection based on year+week seed
  const seed = state.year * 100 + state.week
  const shuffled = [...available].sort((a, b) => {
    const ha = Math.sin(seed * 13.7 + a.id.charCodeAt(0) * 7.3) * 10000
    const hb = Math.sin(seed * 13.7 + b.id.charCodeAt(0) * 7.3) * 10000
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb))
  })
  const weeklyPool = shuffled.slice(0, 6)

  function handleSign() {
    if (!selectedLegend) return
    const cost = selectedLegend.signingFee
    if (state.money < cost) return

    setSigning(true)
    setTimeout(() => {
      dispatch({ type: 'SIGN_CLIENT', legendId: selectedLegend.id, commissionRate })
      setSelectedLegend(null)
      setSigning(false)
    }, 600)
  }

  const alreadySigned = selectedLegend ? signedIds.includes(selectedLegend.id) : false
  const canAfford = selectedLegend ? state.money >= selectedLegend.signingFee : false

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      {/* Header */}
      <div className="bg-black/60 border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 backdrop-blur">
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
                className="text-white/40 hover:text-white transition-colors text-xl">←</button>
        <div>
          <h1 className="text-white font-bold">Radar de Talentos</h1>
          <p className="text-white/40 text-xs">Semana {state.week} de {state.year}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-amber-400 font-bold text-sm">R$ {state.money.toLocaleString('pt-BR')}</p>
          <p className="text-white/30 text-xs">disponível</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <p className="text-white/30 text-xs text-center">
          ✦ Apenas você vê o brilho dourado das futuras lendas
        </p>

        {/* Player cards */}
        <div className="space-y-3">
          {weeklyPool.map((legend) => {
            const isSigned = signedIds.includes(legend.id)
            const rating = getCurrentRating(legend, state.year)
            const value = getMarketValue(legend, state.year)
            const isSelected = selectedLegend?.id === legend.id

            return (
              <motion.div
                key={legend.id}
                onClick={() => !isSigned && setSelectedLegend(isSelected ? null : legend)}
                whileHover={!isSigned ? { scale: 1.01 } : {}}
                whileTap={!isSigned ? { scale: 0.99 } : {}}
                className={`relative rounded-xl border p-4 transition-all cursor-pointer overflow-hidden
                  ${isSigned
                    ? 'border-white/5 bg-white/3 opacity-40 cursor-not-allowed'
                    : isSelected
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
              >
                {/* Gold glow for legends */}
                {legend.truePotential >= 90 && !isSigned && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                )}
                {legend.truePotential >= 90 && !isSigned && (
                  <div className="absolute top-3 right-3">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2 h-2 rounded-full bg-amber-400"
                    />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-2xl">{FLAG[legend.nationality]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">{legend.name}</span>
                      {isSigned && <span className="text-green-400 text-xs">✓ Seu cliente</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${POS_COLORS[legend.position]}`}>
                        {legend.position}
                      </span>
                      <span className="text-white/30 text-xs">{state.year - legend.birthYear} anos</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/30 text-xs">{legend.club}</span>
                    </div>

                    {/* Stats visible to everyone */}
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white/30 text-xs">Nota atual</p>
                        <p className="text-white font-bold">{rating}/100</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-xs">Valor</p>
                        <p className="text-white/60 font-bold">{formatMoney(value)}</p>
                      </div>
                      {/* Only you see the true potential */}
                      <div className="ml-auto">
                        <p className="text-amber-400/50 text-xs">Potencial real ✦</p>
                        <p className="text-amber-400 font-black">{legend.truePotential}/100</p>
                      </div>
                    </div>

                    {/* Your secret knowledge */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                      >
                        <p className="text-amber-300/60 text-xs uppercase tracking-widest mb-1">Só você sabe</p>
                        <p className="text-amber-200 text-xs leading-relaxed italic">"{legend.futureKnowledge}"</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Sign panel */}
        <AnimatePresence>
          {selectedLegend && !alreadySigned && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white/5 border border-white/20 rounded-xl p-5 space-y-4"
            >
              <div>
                <p className="text-white font-bold">Assinar {selectedLegend.nickname}</p>
                <p className="text-white/40 text-xs">Taxa de exclusividade: {formatMoney(selectedLegend.signingFee)}</p>
              </div>

              {/* Commission slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/60 text-xs uppercase tracking-widest">Sua comissão</p>
                  <p className="text-amber-400 font-black text-xl">{commissionRate}%</p>
                </div>
                <input
                  type="range"
                  min={5} max={30} step={1}
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-white/20 text-xs mt-1">
                  <span>5% (generoso)</span>
                  <span>30% (máximo)</span>
                </div>
                <p className="text-white/30 text-xs mt-2">
                  {commissionRate <= 10
                    ? '✓ Jogador vai adorar. Fidelidade garantida.'
                    : commissionRate <= 18
                      ? '→ Comissão razoável. Jogador aceita.'
                      : commissionRate <= 24
                        ? '⚠ Alto. Jogador pode reclamar depois.'
                        : '⚠ Muito alto. Risco de insatisfação futura.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLegend(null)}
                  className="flex-1 border border-white/20 rounded-xl py-3 text-white/60 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleSign}
                  disabled={!canAfford || signing}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                  className={`flex-1 rounded-xl py-3 font-black text-sm transition-colors
                    ${canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-white/10 text-white/20 cursor-not-allowed'
                    }`}
                >
                  {signing ? '...' : canAfford ? `ASSINAR • ${formatMoney(selectedLegend.signingFee)}` : 'Sem dinheiro'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-white/20 text-xs text-center pb-4">
          Radar atualiza toda semana. Não deixe a lenda ir pra mão do rival.
        </p>
      </div>
    </div>
  )
}
