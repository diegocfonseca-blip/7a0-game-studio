import { motion } from 'framer-motion'
import { useEmpresario } from '../store'
import { C, money, moneyFull, BrutalCard, BrutalPill, BrutalTag, POS_COLOR, FLAG, STATUS_LABEL } from '../ui'

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export default function DashboardScreen() {
  const { state, dispatch } = useEmpresario()
  const monthIndex = Math.floor((state.week - 1) / 4.34) % 12
  const pendingEvents = state.events.filter(e => !e.resolved)
  const activeOffers = state.pendingOffers.length
  const alerts = pendingEvents.length + activeOffers

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      {/* ── HEADER ── */}
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrutalTag color={C.yellow}>{MONTHS[monthIndex]} {state.year}</BrutalTag>
            <span className="text-white/40 font-mono text-xs">sem {state.week}</span>
          </div>
          <div className="flex items-center gap-2">
            <BrutalTag color={C.teal}>REP {state.reputation}</BrutalTag>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* ── PATRIMÔNIO (hero) ── */}
        <BrutalCard color={C.blue} className="p-5" shadow={6}>
          <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Seu patrimônio</p>
          <motion.p
            key={state.money}
            initial={{ scale: 1.08 }} animate={{ scale: 1 }}
            className="text-white font-black text-4xl mt-1"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {moneyFull(state.money)}
          </motion.p>
          <div className="flex gap-2 mt-3">
            <BrutalPill color={C.yellow}>💰 {money(state.totalEarned)} ganhos</BrutalPill>
            <BrutalPill color={C.orange} textColor="#fff">🤝 {state.totalDeals} deals</BrutalPill>
          </div>
        </BrutalCard>

        {/* ── ALERTAS ── */}
        {activeOffers > 0 && (
          <BrutalCard color={C.yellow} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">💸</span>
              <div className="flex-1">
                <p className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {activeOffers} PROPOSTA{activeOffers > 1 ? 'S' : ''} DE CLUBE{activeOffers > 1 ? 'S' : ''}!
                </p>
                <p className="text-black/60 text-xs font-bold">Negocie sua comissão antes de expirar</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </BrutalCard>
        )}

        {pendingEvents.length > 0 && (
          <BrutalCard color={C.orange} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div className="flex-1">
                <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {pendingEvents.length} DECISÃO{pendingEvents.length > 1 ? 'ÕES' : ''} PENDENTE{pendingEvents.length > 1 ? 'S' : ''}
                </p>
                <p className="text-white/70 text-xs font-bold">Seus clientes precisam de você</p>
              </div>
              <span className="text-2xl text-white">→</span>
            </div>
          </BrutalCard>
        )}

        {/* ── CLIENTES ── */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>SUA CARTEIRA</h2>
          <BrutalTag color={C.teal}>{state.clients.length}/16</BrutalTag>
        </div>

        {state.clients.length === 0 ? (
          <BrutalCard color={C.creamDark} className="p-7 text-center">
            <p className="text-5xl mb-3">🔭</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>NENHUM CLIENTE AINDA</p>
            <p className="text-black/50 text-sm mt-1 font-medium">Vá ao Radar e assine as futuras lendas antes de todo mundo.</p>
          </BrutalCard>
        ) : (
          <div className="space-y-3">
            {state.clients.map((c, i) => {
              const st = STATUS_LABEL[c.status]
              return (
                <motion.div key={c.legendId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <BrutalCard color="white" className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl shrink-0">{FLAG[c.nationality]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-black text-base truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            {c.nickname}
                          </span>
                          <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {st && <BrutalTag color={st.color} textColor={c.status === 'pelada' ? '#fff' : '#000'}>{st.label}</BrutalTag>}
                          <span className="text-black/40 text-xs font-bold">{state.year - c.birthYear}a</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(c.currentValue)}</p>
                        <BrutalTag color={C.yellow}>{c.commissionRate}%</BrutalTag>
                      </div>
                    </div>
                    {/* happiness bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-bold text-black/50">😊</span>
                      <div className="flex-1 h-3 bg-black/10 border-2 border-black rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${c.happiness}%`,
                            backgroundColor: c.happiness > 60 ? C.green : c.happiness > 35 ? C.yellow : C.orange,
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-black w-7 text-right">{c.happiness}</span>
                    </div>
                  </BrutalCard>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── últimas notícias ── */}
        {state.narrative.length > 0 && (
          <div className="pt-1">
            <h2 className="font-black text-black text-sm mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>📰 Últimas notícias</h2>
            <BrutalCard color={C.creamDark} className="p-4 space-y-2">
              {[...state.narrative].reverse().slice(0, 3).map((n, i) => (
                <p key={i} className="text-black/70 text-xs font-medium leading-relaxed border-l-[3px] border-black pl-2">{n}</p>
              ))}
            </BrutalCard>
          </div>
        )}

        {/* ── NAV GRID ── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <BrutalCard color={C.teal} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'scouts' })}>
            <p className="text-3xl mb-1">🔭</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>RADAR</p>
            <p className="text-black/60 text-xs font-bold">Descobrir lendas</p>
          </BrutalCard>

          <BrutalCard color={C.pink} className="p-4 relative" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'offers' })}>
            {alerts > 0 && (
              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center border-2 border-white">
                {alerts}
              </span>
            )}
            <p className="text-3xl mb-1">📋</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>NEGÓCIOS</p>
            <p className="text-black/60 text-xs font-bold">Propostas e eventos</p>
          </BrutalCard>

          <BrutalCard color={C.yellow} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'finance' })}>
            <p className="text-3xl mb-1">🏢</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCRITÓRIO</p>
            <p className="text-black/60 text-xs font-bold">Investir e crescer</p>
          </BrutalCard>

          <BrutalCard color={C.black} className="p-4" onClick={() => dispatch({ type: 'ADVANCE_WEEK' })}>
            <p className="text-3xl mb-1">⏩</p>
            <p className="font-black text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>AVANÇAR</p>
            <p className="text-white/50 text-xs font-bold">Próxima semana</p>
          </BrutalCard>
        </div>

        {/* expense note */}
        {state.weeklyExpenses > 0 && (
          <p className="text-center text-black/40 text-xs font-bold">
            Custo semanal dos clientes: −{moneyFull(state.weeklyExpenses)}
          </p>
        )}
      </div>
    </div>
  )
}
