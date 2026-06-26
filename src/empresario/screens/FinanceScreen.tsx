import { motion } from 'framer-motion'
import { useEmpresario } from '../store'
import { UPGRADE_OPTIONS } from '../data/events'

function formatMoney(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function FinanceScreen() {
  const { state, dispatch } = useEmpresario()

  function purchase(upgradeId: string, cost: number, effect: string) {
    if (state.money < cost) return
    if (state.purchasedUpgrades.includes(upgradeId)) return
    dispatch({ type: 'PURCHASE_UPGRADE', upgradeId, cost, effect })
  }

  const totalClientValue = state.clients.reduce((sum, c) => sum + c.currentValue, 0)
  const monthlyExpenses = state.weeklyExpenses * 4

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="bg-black/60 border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 backdrop-blur">
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
                className="text-white/40 hover:text-white transition-colors text-xl">←</button>
        <div>
          <h1 className="text-white font-bold">Escritório & Finanças</h1>
          <p className="text-white/40 text-xs">Investir e expandir</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">

        {/* Financial overview */}
        <div className="bg-gradient-to-br from-amber-900/30 to-stone-900/30 border border-amber-500/20 rounded-xl p-5">
          <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-4">Balanço</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Caixa disponível</span>
              <span className="text-amber-400 font-black text-xl">{formatMoney(state.money)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">Valor total da carteira</span>
              <span className="text-green-400 font-bold">{formatMoney(totalClientValue)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">Custo mensal de clientes</span>
              <span className="text-red-400 font-bold">-{formatMoney(monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">Total ganho em deals</span>
              <span className="text-green-400 font-bold">{formatMoney(state.totalEarned)}</span>
            </div>
          </div>
        </div>

        {/* Achievements / Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-purple-400 font-black text-2xl">{state.totalDeals}</p>
            <p className="text-white/40 text-xs mt-1">Transferências fechadas</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-blue-400 font-black text-2xl">{state.clients.length}</p>
            <p className="text-white/40 text-xs mt-1">Clientes ativos</p>
          </div>
        </div>

        {/* Upgrades */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Investimentos disponíveis</p>
          <div className="space-y-3">
            {UPGRADE_OPTIONS.map(upgrade => {
              const purchased = state.purchasedUpgrades.includes(upgrade.id)
              const canAfford = state.money >= upgrade.cost

              return (
                <motion.div
                  key={upgrade.id}
                  className={`border rounded-xl p-4 transition-all ${
                    purchased
                      ? 'border-green-500/30 bg-green-500/5 opacity-60'
                      : canAfford
                        ? 'border-white/15 bg-white/5 hover:border-white/25'
                        : 'border-white/5 bg-white/3 opacity-40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">
                        {purchased && <span className="text-green-400 mr-2">✓</span>}
                        {upgrade.name}
                      </p>
                      <p className="text-white/40 text-xs mt-1 leading-relaxed">{upgrade.description}</p>
                      <p className="text-amber-400/60 text-xs mt-2">⚡ {upgrade.effect}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-white font-black text-sm">{formatMoney(upgrade.cost)}</p>
                      {!purchased && (
                        <motion.button
                          onClick={() => purchase(upgrade.id, upgrade.cost, upgrade.effect)}
                          disabled={!canAfford}
                          whileHover={canAfford ? { scale: 1.05 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                            ${canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-black'
                              : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                        >
                          {canAfford ? 'Comprar' : 'Sem $'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Future: buy a club */}
        <div className="border border-dashed border-purple-500/20 rounded-xl p-5 text-center">
          <p className="text-4xl mb-3">🏟️</p>
          <p className="text-purple-300 font-bold text-sm">Comprar um clube</p>
          <p className="text-white/30 text-xs mt-1">Disponível quando tiver R$ 500.000</p>
          <div className="mt-3 bg-white/5 rounded-lg p-2">
            <div className="h-1.5 bg-white/10 rounded-full">
              <div
                className="h-full bg-purple-500/60 rounded-full transition-all"
                style={{ width: `${Math.min(100, state.money / 5000)}%` }}
              />
            </div>
            <p className="text-white/20 text-xs mt-1">
              {formatMoney(state.money)} / R$ 500k
            </p>
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
