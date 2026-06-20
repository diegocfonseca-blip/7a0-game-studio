import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'

const MOOD_CONFIG = {
  '🔥': { label: 'EM CHAMAS', color: '#22c55e', bar: '#22c55e' },
  '😊': { label: 'SATISFEITO', color: '#86efac', bar: '#86efac' },
  '😰': { label: 'ANSIOSO', color: '#f59e0b', bar: '#f59e0b' },
  '😴': { label: 'FRACO', color: '#E03535', bar: '#E03535' },
  '😤': { label: 'CRÍTICO', color: '#7c3aed', bar: '#7c3aed' },
} as const

export default function MaintenanceScreen() {
  const { state, dispatch } = useGame()
  const { stolenTraits, coins } = state

  const handleMaintain = (traitId: string, cost: number) => {
    if (coins < cost) return
    dispatch({ type: 'MAINTAIN_TRAIT', traitId, cost })
  }

  const handleDecayAll = () => {
    dispatch({ type: 'DECAY_ALL_TRAITS' })
  }

  const criticalTraits = stolenTraits.filter(t => t.maintenanceBar < 30)
  const healthyTraits = stolenTraits.filter(t => t.maintenanceBar >= 30)

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
              className="text-xs tracking-widest opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}
            >
              ← MAPA
            </button>
            <div className="w-px h-4 bg-white/10" />
            <h1 className="text-lg font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
              MANUTENÇÃO
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>C$</div>
              <div className="text-base font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                {coins.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleDecayAll}
              className="px-3 py-1.5 text-xs border transition-all opacity-40 hover:opacity-70"
              style={{ color: '#f0e6c8', borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Oswald' }}
            >
              SIMULAR 1 SEMANA
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {stolenTraits.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👻</div>
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
              Nenhum traço roubado ainda
            </h3>
            <p className="text-sm opacity-50 mb-6" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              Vá ao mapa e inicie sua primeira missão de roubo.
            </p>
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
              className="px-6 py-3 font-bold tracking-widest"
              style={{ fontFamily: 'Oswald', background: '#D4A840', color: '#06060f' }}
            >
              IR AO MAPA →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Critical alert */}
            {criticalTraits.length > 0 && (
              <motion.div
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="p-4 border rounded-sm"
                style={{ background: 'rgba(224,53,53,0.06)', borderColor: 'rgba(224,53,53,0.3)' }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: '#E03535', fontFamily: 'Oswald' }}>
                  ⚠️ {criticalTraits.length} TRAÇO{criticalTraits.length > 1 ? 'S' : ''} EM ESTADO CRÍTICO
                </p>
                <p className="text-xs" style={{ color: 'rgba(240,230,200,0.6)', fontFamily: 'Inter' }}>
                  Se a barra zerar, o traço volta pro jogador original — e ele começa a subir de vida.
                </p>
              </motion.div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl font-black" style={{ color: '#7c3aed', fontFamily: 'Oswald' }}>
                  {stolenTraits.length}
                </div>
                <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>traços ativos</div>
              </div>
              <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl font-black" style={{ color: '#E03535', fontFamily: 'Oswald' }}>
                  {criticalTraits.length}
                </div>
                <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>críticos</div>
              </div>
              <div className="p-3 border border-white/8 rounded-sm text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                  C$ {stolenTraits.reduce((s, t) => s + t.weeklyMaintenance, 0)}
                </div>
                <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>custo/semana</div>
              </div>
            </div>

            {/* Trait cards */}
            {[...criticalTraits, ...healthyTraits].map((trait, i) => {
              const mood = trait.mood as keyof typeof MOOD_CONFIG
              const moodCfg = MOOD_CONFIG[mood] ?? MOOD_CONFIG['😊']
              const maintainCost = Math.round(trait.weeklyMaintenance * 1.5)
              const canAfford = coins >= maintainCost

              return (
                <motion.div
                  key={trait.traitId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="border rounded-sm overflow-hidden"
                  style={{
                    background: '#0d0d1a',
                    borderColor: trait.maintenanceBar < 30
                      ? 'rgba(224,53,53,0.35)'
                      : trait.maintenanceBar > 70
                      ? 'rgba(34,197,94,0.2)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Bar at top */}
                  <div className="h-1 w-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.maintenanceBar}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full"
                      style={{
                        background: moodCfg.bar,
                        boxShadow: `0 0 8px ${moodCfg.bar}60`,
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{trait.traitIcon}</span>
                          <div>
                            <div className="text-sm font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                              {trait.traitName}
                            </div>
                            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                              de {trait.legendNickname} · {trait.stolenYear}
                            </div>
                          </div>
                        </div>

                        {/* Mood + bar value */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm">{trait.mood}</span>
                          <div
                            className="px-2 py-0.5 text-xs font-bold"
                            style={{
                              background: `${moodCfg.color}15`,
                              color: moodCfg.color,
                              fontFamily: 'Oswald',
                            }}
                          >
                            {moodCfg.label}
                          </div>
                          <span className="text-xs font-bold" style={{ color: moodCfg.color, fontFamily: 'Oswald' }}>
                            {trait.maintenanceBar}%
                          </span>
                        </div>

                        {trait.maintenanceBar < 30 && (
                          <p className="mt-2 text-xs" style={{ color: '#E03535', fontFamily: 'Inter' }}>
                            ⚠️ Se chegar a 0%, esse traço volta pra {trait.legendNickname}
                          </p>
                        )}
                      </div>

                      {/* Maintain button */}
                      <div className="flex flex-col items-end gap-2">
                        <motion.button
                          whileHover={canAfford ? { scale: 1.05 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          disabled={!canAfford}
                          onClick={() => handleMaintain(trait.traitId, maintainCost)}
                          className="px-3 py-2 text-xs font-bold tracking-wide transition-all"
                          style={{
                            fontFamily: 'Oswald',
                            background: canAfford
                              ? trait.maintenanceBar < 30 ? '#E03535' : 'rgba(124,58,237,0.2)'
                              : 'rgba(255,255,255,0.04)',
                            color: canAfford
                              ? '#fff'
                              : 'rgba(255,255,255,0.2)',
                            border: `1px solid ${canAfford
                              ? trait.maintenanceBar < 30 ? '#E03535' : 'rgba(124,58,237,0.4)'
                              : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: canAfford && trait.maintenanceBar < 30 ? '0 0 12px rgba(224,53,53,0.3)' : 'none',
                          }}
                        >
                          MANTER
                        </motion.button>
                        <span className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                          C$ {maintainCost}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Tip */}
            <div className="p-4 border border-white/5 rounded-sm text-center" style={{ background: 'rgba(124,58,237,0.04)' }}>
              <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Use "SIMULAR 1 SEMANA" para ver como a barra cai com o tempo · Manter custa 1.5x o custo semanal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
