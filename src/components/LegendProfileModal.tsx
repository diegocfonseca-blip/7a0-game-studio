import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { getLegendById, getLegendAge, getLegendStatus } from '../data/legends'
import { getMission } from '../data/missions'

export default function LegendProfileModal() {
  const { state, dispatch } = useGame()
  const { selectedLegendId, selectedTraitId, currentYear, coins, stolenFrom } = state

  const legend = selectedLegendId ? getLegendById(selectedLegendId) : null
  if (!legend) return null

  const status = getLegendStatus(legend, currentYear)
  const age = getLegendAge(legend, currentYear)
  const mission = getMission(legend.id)
  const totalCost = mission.travelCost + mission.scoutCost
  const alreadyStolen = stolenFrom.includes(legend.id)
  const alreadyStolenTraits = state.stolenTraits.map(t => t.traitId)

  const statusConfig = {
    available: { label: 'DESCONHECIDO', color: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
    urgent: { label: '⚠️ JANELA FECHANDO', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
    locked: { label: '🔒 BLOQUEADO', color: '#6b7280', glow: 'transparent' },
    closed: { label: '🌟 JÁ FICOU FAMOSO', color: '#E03535', glow: 'rgba(224,53,53,0.3)' },
  }[status]

  const canSteal = (status === 'available' || status === 'urgent') && !alreadyStolen
  const selectedTrait = legend.traits.find(t => t.id === selectedTraitId)
  const canAfford = coins >= totalCost + (selectedTrait?.cost ?? 0)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'SELECT_LEGEND', legendId: null }) }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm border"
          style={{
            background: '#0d0d1a',
            borderColor: legend.colorAccent + '40',
            boxShadow: `0 0 60px ${legend.colorAccent}20`,
          }}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-white/8">
            <div
              className="absolute inset-0 opacity-5"
              style={{ background: `radial-gradient(ellipse at top right, ${legend.colorAccent}, transparent)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{legend.countryFlag}</span>
                    <span
                      className="text-xs font-bold tracking-widest px-2 py-0.5"
                      style={{
                        color: statusConfig.color,
                        background: statusConfig.glow,
                        border: `1px solid ${statusConfig.color}40`,
                        fontFamily: 'Oswald'
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
                    {legend.name}
                  </h3>
                  <p className="text-sm" style={{ color: legend.colorAccent, fontFamily: 'Inter' }}>
                    "{legend.nickname}"
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ fontFamily: 'Oswald', color: legend.colorAccent }}>
                    {age}
                  </div>
                  <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>anos em {currentYear}</div>
                </div>
              </div>
              <div className="text-xs opacity-50 mt-1" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                📍 {legend.city} · {legend.position}
              </div>
            </div>
          </div>

          {/* Story */}
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(240,230,200,0.75)', fontFamily: 'Inter' }}>
              "{legend.story}"
            </p>
          </div>

          {/* Historical note */}
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-xs tracking-widest mb-2" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>
              REGISTRO HISTÓRICO
            </p>
            <p className="text-xs leading-relaxed opacity-60" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              {legend.historicalNote}
            </p>
            {status === 'locked' && (
              <div className="mt-3 p-3 border border-purple-500/20 rounded-sm" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <p className="text-xs" style={{ color: '#7c3aed', fontFamily: 'Inter' }}>
                  🔒 Janela abre em {legend.unlockYear} — quando ele terá {legend.unlockYear - legend.birthYear} anos
                </p>
              </div>
            )}
            {status === 'closed' && (
              <div className="mt-3 p-3 border border-red-500/20 rounded-sm" style={{ background: 'rgba(224,53,53,0.08)' }}>
                <p className="text-xs" style={{ color: '#E03535', fontFamily: 'Inter' }}>
                  A janela fechou em {legend.closeYear}. Ele já é famoso no seu mundo. Vai ser seu rival.
                </p>
              </div>
            )}
            {alreadyStolen && (
              <div className="mt-3 p-3 border border-green-500/20 rounded-sm" style={{ background: 'rgba(34,197,94,0.08)' }}>
                <p className="text-xs" style={{ color: '#22c55e', fontFamily: 'Inter' }}>
                  ✅ Você já roubou desta lenda. O que estava disponível, foi.
                </p>
              </div>
            )}
          </div>

          {/* Traits */}
          {canSteal && (
            <div className="px-6 py-4 border-b border-white/5">
              <p className="text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                ESCOLHA O QUE ROUBAR
              </p>
              <div className="space-y-2">
                {legend.traits.map(trait => {
                  const isSelected = selectedTraitId === trait.id
                  const alreadyHave = alreadyStolenTraits.includes(trait.id)
                  const hasConflict = trait.conflictsWith?.some(c => alreadyStolenTraits.includes(c))

                  return (
                    <button
                      key={trait.id}
                      onClick={() => !alreadyHave && dispatch({ type: 'SELECT_TRAIT', traitId: isSelected ? null : trait.id })}
                      disabled={alreadyHave}
                      className="w-full p-3 border rounded-sm text-left transition-all"
                      style={{
                        background: isSelected ? 'rgba(212,168,64,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? '#D4A840' : alreadyHave ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
                        opacity: alreadyHave ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{trait.icon}</span>
                          <span className="text-sm font-bold" style={{ color: isSelected ? '#D4A840' : '#f0e6c8', fontFamily: 'Oswald' }}>
                            {trait.name}
                          </span>
                          {alreadyHave && <span className="text-xs" style={{ color: '#22c55e' }}>✅ Em você</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                            C$ {trait.cost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-60 leading-relaxed" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                        {trait.description}
                      </p>
                      {hasConflict && !alreadyHave && (
                        <p className="text-xs mt-1" style={{ color: '#f59e0b', fontFamily: 'Inter' }}>
                          ⚠️ Conflita com traço que você já tem
                        </p>
                      )}
                      <div className="mt-2 text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                        Manutenção: C$ {trait.weeklyMaintenance}/semana
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mission cost + CTA */}
          {canSteal && selectedTrait && (
            <div className="px-6 py-4">
              <div className="p-3 border border-white/8 rounded-sm mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs tracking-widest mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>CUSTO DA MISSÃO</p>
                <div className="space-y-1 text-xs" style={{ color: 'rgba(240,230,200,0.6)', fontFamily: 'Inter' }}>
                  <div className="flex justify-between"><span>Scout e localização</span><span>C$ {mission.scoutCost}</span></div>
                  <div className="flex justify-between"><span>Viagem até {legend.city}</span><span>C$ {mission.travelCost}</span></div>
                  <div className="flex justify-between"><span>Roubo: {selectedTrait.name}</span><span>C$ {selectedTrait.cost}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-1 font-bold" style={{ color: canAfford ? '#D4A840' : '#E03535' }}>
                    <span>TOTAL</span>
                    <span>C$ {(totalCost + selectedTrait.cost).toLocaleString()}</span>
                  </div>
                </div>
                {!canAfford && (
                  <p className="mt-2 text-xs" style={{ color: '#E03535', fontFamily: 'Inter' }}>
                    Você tem C$ {coins.toLocaleString()}. Faltam C$ {(totalCost + selectedTrait.cost - coins).toLocaleString()}.
                  </p>
                )}
              </div>

              <motion.button
                whileHover={canAfford ? { scale: 1.02 } : {}}
                whileTap={canAfford ? { scale: 0.98 } : {}}
                disabled={!canAfford}
                onClick={() => {
                  if (!canAfford) return
                  dispatch({ type: 'SPEND_COINS', amount: totalCost + selectedTrait.cost })
                  dispatch({ type: 'START_MISSION', legendId: legend.id, traitId: selectedTrait.id })
                }}
                className="w-full py-4 font-bold tracking-widest transition-all"
                style={{
                  fontFamily: 'Oswald',
                  background: canAfford ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                  color: canAfford ? '#fff' : 'rgba(255,255,255,0.2)',
                  boxShadow: canAfford ? '0 0 30px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                {canAfford ? `⚡ INICIAR MISSÃO — ${legend.city.toUpperCase()}` : '❌ CRUZEIROS INSUFICIENTES'}
              </motion.button>
            </div>
          )}

          {/* Close */}
          <div className="px-6 pb-4">
            <button
              onClick={() => dispatch({ type: 'SELECT_LEGEND', legendId: null })}
              className="w-full py-2 text-xs tracking-widest opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}
            >
              FECHAR
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
