import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import type { ClubOffer, GameEvent } from '../types'

function formatMoney(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(2)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

function OfferCard({ offer, clients, onAccept, onReject }: {
  offer: ClubOffer
  clients: ReturnType<typeof useEmpresario>['state']['clients']
  onAccept: (id: string, commission: number) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [commission, setCommission] = useState(15)
  const client = clients.find(c => c.legendId === offer.clientId)
  const myEarning = Math.round(offer.offerAmount * commission / 100)

  if (!client) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-amber-500/30 rounded-xl overflow-hidden"
    >
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="text-2xl">🏟️</div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 font-bold text-sm">{offer.clubName}</p>
          <p className="text-white/40 text-xs">{offer.clubCountry} • quer {client.nickname}</p>
          <p className="text-white font-black text-lg mt-1">{formatMoney(offer.offerAmount)}</p>
          <p className="text-white/30 text-xs">Salário ao jogador: {formatMoney(offer.salary)}/ano</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-red-400/60 text-xs">{offer.expiresInWeeks}sem restantes</p>
          <p className="text-white/20 text-xs mt-1">{expanded ? '▲' : '▼'}</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4 space-y-4"
          >
            {/* Commission negotiation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-white/60 text-xs uppercase tracking-widest">Sua comissão</p>
                <div className="text-right">
                  <p className="text-amber-400 font-black text-xl">{commission}%</p>
                  <p className="text-green-400 text-xs">{formatMoney(myEarning)} pra você</p>
                </div>
              </div>
              <input
                type="range" min={5} max={30} step={1}
                value={commission}
                onChange={e => setCommission(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-white/20 text-xs mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>

              {/* Context: what's fair? */}
              <div className="mt-3 p-3 bg-white/3 rounded-lg">
                <p className="text-white/30 text-xs">
                  {commission <= 8
                    ? '🤝 Generoso. Jogador vai adorar você. Fidelidade de longo prazo.'
                    : commission <= 15
                      ? '✓ Padrão de mercado. Negociação limpa.'
                      : commission <= 22
                        ? '⚠ Acima do padrão. Clube pode reclamar.'
                        : '🔥 Máximo do mercado. Aceite se estiver na mão.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onReject(offer.id)}
                className="border border-white/20 rounded-xl py-3 text-white/60 text-sm
                           hover:bg-white/5 transition-colors"
              >
                Recusar
              </button>
              <motion.button
                onClick={() => onAccept(offer.id, commission)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-green-500 hover:bg-green-400 text-black font-black
                           rounded-xl py-3 text-sm transition-colors"
              >
                FECHAR NEGÓCIO
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EventCard({ event, onResolve }: { event: GameEvent; onResolve: (id: string, idx: 0 | 1) => void }) {
  const [chosen, setChosen] = useState<0 | 1 | null>(null)

  const typeIcon: Record<string, string> = {
    injury: '🏥',
    scandal: '📰',
    rival: '🤝',
    breakout: '⭐',
    personal: '👨‍👩‍👦',
    press: '🎙️',
    offer: '📋',
  }

  if (event.resolved) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-orange-500/5 border border-orange-500/30 rounded-xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{typeIcon[event.type] ?? '📌'}</span>
          <div>
            <p className="text-orange-300 font-bold text-sm">{event.title}</p>
            <p className="text-white/50 text-xs leading-relaxed mt-1">{event.description}</p>
          </div>
        </div>

        {event.choices && (
          <div className="space-y-2">
            {event.choices.map((choice, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setChosen(idx as 0 | 1)
                  setTimeout(() => onResolve(event.id, idx as 0 | 1), 400)
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={chosen !== null}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all
                  ${chosen === idx
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                    : chosen !== null
                      ? 'bg-white/3 border-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white/5 border-white/15 text-white/70 hover:border-orange-500/40 hover:bg-orange-500/5'
                  }`}
              >
                <span className="font-bold mr-2">{idx === 0 ? 'A)' : 'B)'}</span>
                {choice.label}
                {choice.effect.money && (
                  <span className={`ml-2 text-xs ${choice.effect.money > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({choice.effect.money > 0 ? '+' : ''}{formatMoney(choice.effect.money)})
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function NegotiationsScreen() {
  const { state, dispatch } = useEmpresario()

  const activeOffers = state.pendingOffers
  const pendingEvents = state.events.filter(e => !e.resolved)
  const resolvedEvents = state.events.filter(e => e.resolved).slice(-3)

  function handleAccept(offerId: string, commission: number) {
    dispatch({ type: 'ACCEPT_OFFER', offerId, finalCommission: commission })
  }

  function handleReject(offerId: string) {
    dispatch({ type: 'REJECT_OFFER', offerId })
  }

  function handleResolveEvent(eventId: string, choiceIndex: 0 | 1) {
    dispatch({ type: 'RESOLVE_EVENT', eventId, choiceIndex })
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="bg-black/60 border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 backdrop-blur">
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
                className="text-white/40 hover:text-white transition-colors text-xl">←</button>
        <div>
          <h1 className="text-white font-bold">Negociações</h1>
          <p className="text-white/40 text-xs">Propostas e eventos ativos</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">

        {/* Offers */}
        {activeOffers.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
              💰 Propostas de clubes ({activeOffers.length})
            </p>
            <div className="space-y-3">
              {activeOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  clients={state.clients}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {pendingEvents.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
              ⚡ Situações que precisam de decisão ({pendingEvents.length})
            </p>
            <div className="space-y-3">
              {pendingEvents.map(event => (
                <EventCard key={event.id} event={event} onResolve={handleResolveEvent} />
              ))}
            </div>
          </div>
        )}

        {/* Resolved events history */}
        {resolvedEvents.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Histórico recente</p>
            <div className="space-y-2">
              {resolvedEvents.map(event => (
                <div key={event.id} className="bg-white/3 border border-white/5 rounded-xl p-3">
                  <p className="text-white/40 text-xs">{event.title}</p>
                  {event.chosenIndex !== undefined && event.choices && (
                    <p className="text-white/25 text-xs mt-1">
                      Você escolheu: {event.choices[event.chosenIndex].label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeOffers.length === 0 && pendingEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-white/40 text-sm">Nenhuma negociação pendente.</p>
            <p className="text-white/25 text-xs mt-2">Avance semanas para receber propostas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
