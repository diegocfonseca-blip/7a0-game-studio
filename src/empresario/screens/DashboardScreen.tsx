import { motion } from 'framer-motion'
import { useEmpresario } from '../store'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatMoney(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

const POSITION_COLORS: Record<string, string> = {
  ATA: 'bg-red-500/20 text-red-300 border-red-500/30',
  MEI: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ZAG: 'bg-green-500/20 text-green-300 border-green-500/30',
  LAT: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  GOL: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export default function DashboardScreen() {
  const { state, dispatch } = useEmpresario()
  const monthIndex = Math.floor((state.week - 1) / 4) % 12
  const pendingEvents = state.events.filter(e => !e.resolved)
  const activeOffers = state.pendingOffers.length

  function advanceWeek() {
    dispatch({ type: 'ADVANCE_WEEK' })
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      {/* Top bar */}
      <div className="bg-black/60 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div>
          <span className="text-amber-400 font-black text-lg">{state.year}</span>
          <span className="text-white/40 text-sm ml-2">{MONTHS[monthIndex]}</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest">Patrimônio</p>
          <motion.p
            key={state.money}
            initial={{ scale: 1.15, color: '#4ade80' }}
            animate={{ scale: 1, color: '#d4a840' }}
            className="font-black text-xl"
          >
            {formatMoney(state.money)}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">Rep.</p>
          <p className="text-amber-400 font-bold">{state.reputation}/100</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Clientes', value: state.clients.length, max: 16, color: 'text-blue-400' },
            { label: 'Ganhos totais', value: formatMoney(state.totalEarned), color: 'text-green-400' },
            { label: 'Deals', value: state.totalDeals, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-orange-300 font-bold text-sm">{pendingEvents.length} evento{pendingEvents.length > 1 ? 's' : ''} pendente{pendingEvents.length > 1 ? 's' : ''}</p>
              <p className="text-orange-300/60 text-xs">Decisões que precisam da sua atenção</p>
            </div>
          </motion.div>
        )}

        {activeOffers > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}
          >
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-amber-300 font-bold text-sm">{activeOffers} proposta{activeOffers > 1 ? 's' : ''} de clube{activeOffers > 1 ? 's' : ''}</p>
              <p className="text-amber-300/60 text-xs">Negocie antes de expirar</p>
            </div>
          </motion.div>
        )}

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/60 text-xs uppercase tracking-widest">Seus clientes</h2>
            <span className="text-white/30 text-xs">{state.clients.length}/16</span>
          </div>

          {state.clients.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-white/40 text-sm">Nenhum cliente ainda.</p>
              <p className="text-white/25 text-xs mt-1">Vá para Radar de Talentos e assine as futuras lendas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.clients.map(client => (
                <motion.div
                  key={client.legendId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm truncate">{client.nickname}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${POSITION_COLORS[client.position]}`}>
                        {client.position}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs truncate">{client.contractClub ?? 'Sem clube'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-amber-400 font-bold text-sm">{formatMoney(client.currentValue)}</p>
                    <p className="text-white/30 text-xs">{client.commissionRate}% comissão</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                       style={{ backgroundColor: `hsl(${client.happiness * 1.2}, 60%, 25%)` }}>
                    <span className="text-xs font-bold" style={{ color: `hsl(${client.happiness * 1.2}, 80%, 70%)` }}>
                      {client.happiness}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly expenses */}
        {state.weeklyExpenses > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex justify-between items-center">
            <span className="text-red-400/60 text-xs">Custo semanal dos clientes</span>
            <span className="text-red-400 font-bold text-sm">-{formatMoney(state.weeklyExpenses)}</span>
          </div>
        )}

        {/* Narrative log */}
        {state.narrative.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Últimas notícias</p>
            <div className="space-y-1">
              {[...state.narrative].reverse().slice(0, 3).map((n, i) => (
                <p key={i} className="text-white/30 text-xs leading-relaxed border-l-2 border-amber-500/20 pl-3">
                  {n}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'scouts' })}
            className="bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20
                       rounded-xl p-4 text-left transition-colors"
          >
            <p className="text-2xl mb-2">🔭</p>
            <p className="text-amber-300 font-bold text-sm">Radar</p>
            <p className="text-amber-300/50 text-xs">Descobrir talentos</p>
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}
            className="bg-green-500/10 border border-green-500/30 hover:bg-green-500/20
                       rounded-xl p-4 text-left transition-colors relative"
          >
            {(activeOffers > 0 || pendingEvents.length > 0) && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <p className="text-2xl mb-2">📋</p>
            <p className="text-green-300 font-bold text-sm">Negociações</p>
            <p className="text-green-300/50 text-xs">Propostas e eventos</p>
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'finance' })}
            className="bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20
                       rounded-xl p-4 text-left transition-colors"
          >
            <p className="text-2xl mb-2">🏢</p>
            <p className="text-purple-300 font-bold text-sm">Escritório</p>
            <p className="text-purple-300/50 text-xs">Investir e expandir</p>
          </button>

          <motion.button
            onClick={advanceWeek}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/10 border border-white/20 hover:bg-white/15
                       rounded-xl p-4 text-left transition-colors"
          >
            <p className="text-2xl mb-2">⏩</p>
            <p className="text-white font-bold text-sm">Avançar semana</p>
            <p className="text-white/40 text-xs">Semana {state.week}/52</p>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
