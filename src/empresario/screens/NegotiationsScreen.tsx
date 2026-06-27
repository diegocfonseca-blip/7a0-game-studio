import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import type { ClubOffer, GameEvent, Client } from '../types'
import { C, money, BrutalCard, BrutalButton, BrutalTag } from '../ui'

const INTEREST: Record<string, { label: string; hint: string; color: string }> = {
  alto: { label: '🔥 MUITO COBIÇADO', hint: 'Vários clubes de olho — compare os lances e a luva antes de fechar.', color: C.orange },
  medio: { label: '👀 INTERESSE MÉDIO', hint: 'Pode aparecer outra proposta com o tempo, mas não garantido.', color: C.yellow },
  baixo: { label: '🤏 PROPOSTA ISOLADA', hint: 'Dificilmente vem outra tão cedo. Decidir agora é seguro.', color: C.creamDark },
}

function OfferCard({ offer, clients, onAccept, onReject, onEscalate, onHaggle }: {
  offer: ClubOffer
  clients: Client[]
  onAccept: (id: string, clubName: string, amount: number, clubLuva: number) => void
  onReject: (id: string) => void
  onEscalate: (id: string) => void
  onHaggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const client = clients.find(c => c.legendId === offer.clientId)
  if (!client) return null
  const comm = client.commissionRate
  const take = (amount: number, luva: number) => Math.round(amount * comm / 100) + luva
  const interest = INTEREST[offer.interest] ?? INTEREST.baixo

  return (
    <BrutalCard color={offer.isWar ? C.yellow : 'white'} className="p-0 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">{offer.isWar ? '🔥' : '🏟️'}</div>
          <div className="flex-1 min-w-0">
            {offer.isWar && <BrutalTag color={C.orange} textColor="#fff">GUERRA DE LANCES</BrutalTag>}
            <p className="font-black text-black text-base mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{offer.clubName}</p>
            <p className="text-black/50 text-xs font-bold">{offer.isWar ? `lidera a disputa por` : `${offer.clubCountry} quer`} <b>{client.nickname}</b></p>
            <p className="font-black text-black text-2xl mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(offer.offerAmount)}</p>
          </div>
          <div className="text-right shrink-0">
            <BrutalTag color={offer.expiresInWeeks <= 1 ? C.orange : C.creamDark} textColor={offer.expiresInWeeks <= 1 ? '#fff' : '#000'}>
              {offer.expiresInWeeks} SEM
            </BrutalTag>
            <p className="text-black/30 text-lg mt-1">{open ? '▲' : '▼'}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t-[3px] border-black p-4" style={{ backgroundColor: C.cream }}>
              {/* interest indicator */}
              <div className="border-2 border-black rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: interest.color }}>
                <p className={`text-xs font-black ${offer.interest === 'alto' ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{interest.label}</p>
                <p className={`text-[10px] font-bold ${offer.interest === 'alto' ? 'text-white/80' : 'text-black/60'}`}>{interest.hint}</p>
              </div>

              {/* your fixed commission reminder */}
              <p className="text-black/50 text-[11px] font-bold mb-3">
                Sua comissão com {client.nickname} já está fechada em <b>{comm}%</b> do valor. Aqui você negocia o VALOR da venda e fica com a luva do clube.
              </p>

              {offer.isWar && offer.bidders ? (
                <div className="mb-2">
                  <p className="text-black/60 text-xs font-black uppercase mb-2">Escolha o melhor pro SEU bolso</p>
                  <div className="space-y-2 mb-3">
                    {offer.bidders.map((b, i) => (
                      <div key={i} className="border-2 border-black rounded-lg p-2.5 bg-white">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-black">{b.clubName}</span>
                          <span className="text-sm font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(b.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] font-bold" style={{ color: C.orange }}>💰 luva pra você: {money(b.luva)}</span>
                          <span className="text-[11px] font-black" style={{ color: C.tealDark }}>você embolsa {money(take(b.amount, b.luva))}</span>
                        </div>
                        <div className="mt-2">
                          <BrutalButton color={C.green} onClick={() => onAccept(offer.id, b.clubName, b.amount, b.luva)} className="!py-2 !text-xs">Fechar com o {b.clubName.split(' ')[0]}</BrutalButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  <BrutalButton color={C.orange} textColor="#fff" onClick={() => onEscalate(offer.id)}>🔥 Provocar leilão (esperar mais)</BrutalButton>
                  <div className="mt-2">
                    <BrutalButton color="white" textColor={C.black} onClick={() => onReject(offer.id)}>Recusar todos</BrutalButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white border-2 border-black rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-black/60 text-xs font-black uppercase">Valor da venda</span>
                      <span className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(offer.offerAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-bold" style={{ color: C.orange }}>💰 Luva do clube pra você</span>
                      <span className="font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif', color: C.orange }}>{money(offer.clubLuva)}</span>
                    </div>
                    <div className="border-t-2 border-black mt-2 pt-2 flex justify-between items-center">
                      <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>VOCÊ EMBOLSA</span>
                      <span className="font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif', color: C.tealDark }}>{money(take(offer.offerAmount, offer.clubLuva))}</span>
                    </div>
                    <p className="text-black/40 text-[10px] font-bold mt-1">comissão {comm}% ({money(Math.round(offer.offerAmount * comm / 100))}) + luva {money(offer.clubLuva)}</p>
                  </div>
                  <BrutalButton color={C.yellow} textColor="#000" onClick={() => onHaggle(offer.id)}>💬 Pedir mais ao clube</BrutalButton>
                  <p className="text-black/40 text-[10px] font-bold text-center mt-1 mb-3">
                    Pode subir o valor (e sua comissão sobe junto) — mas se forçar demais o clube pode sair.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <BrutalButton color="white" textColor={C.black} onClick={() => onReject(offer.id)}>Recusar</BrutalButton>
                    <BrutalButton color={C.green} onClick={() => onAccept(offer.id, offer.clubName, offer.offerAmount, offer.clubLuva)}>Fechar!</BrutalButton>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BrutalCard>
  )
}

const EVENT_ICON: Record<string, string> = {
  injury: '🏥', scandal: '📰', rival: '🤝', breakout: '⭐', personal: '👨‍👩‍👦', press: '🎙️', offer: '📋',
}

function EventCard({ event, onResolve }: { event: GameEvent; onResolve: (id: string, idx: 0 | 1) => void }) {
  const [chosen, setChosen] = useState<0 | 1 | null>(null)
  if (event.resolved || !event.choices) return null

  return (
    <BrutalCard color={C.orange} className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{EVENT_ICON[event.type] ?? '📌'}</span>
        <div>
          <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{event.title}</p>
          <p className="text-white/80 text-xs font-medium leading-relaxed mt-0.5">{event.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {event.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.98 }}
            disabled={chosen !== null}
            onClick={() => { setChosen(idx as 0 | 1); setTimeout(() => onResolve(event.id, idx as 0 | 1), 350) }}
            style={{ boxShadow: chosen === null ? `3px 3px 0 0 ${C.black}` : 'none' }}
            className={`w-full text-left p-3 rounded-xl border-[3px] border-black text-sm font-bold transition-all
              ${chosen === idx ? 'bg-black text-white' : chosen !== null ? 'bg-white/40 text-black/30' : 'bg-white text-black active:translate-x-[3px] active:translate-y-[3px]'}`}
          >
            <span className="font-black mr-1">{idx === 0 ? 'A)' : 'B)'}</span>
            {choice.label}
            {choice.effect.money ? (
              <span className={`ml-1 font-black ${choice.effect.money > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({choice.effect.money > 0 ? '+' : ''}{money(choice.effect.money)})
              </span>
            ) : null}
          </motion.button>
        ))}
      </div>
    </BrutalCard>
  )
}

export default function NegotiationsScreen() {
  const { state, dispatch } = useEmpresario()
  const activeOffers = state.pendingOffers
  const pendingEvents = state.events.filter(e => !e.resolved)

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>NEGOCIAÇÕES</h1>
          <BrutalTag color={C.yellow}>{state.year} · SEM {state.week}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-5">
        {activeOffers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>💸 PROPOSTAS DE CLUBES</h2>
              <BrutalTag color={C.yellow}>{activeOffers.length}</BrutalTag>
            </div>
            {activeOffers.map(o => (
              <OfferCard key={o.id} offer={o} clients={state.clients}
                onAccept={(id, clubName, amount, clubLuva) => dispatch({ type: 'ACCEPT_OFFER', offerId: id, clubName, amount, clubLuva })}
                onReject={id => dispatch({ type: 'REJECT_OFFER', offerId: id })}
                onEscalate={id => dispatch({ type: 'ESCALATE_BID', offerId: id })}
                onHaggle={id => dispatch({ type: 'HAGGLE_OFFER', offerId: id })} />
            ))}
          </div>
        )}

        {pendingEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>⚡ DECISÕES</h2>
              <BrutalTag color={C.orange} textColor="#fff">{pendingEvents.length}</BrutalTag>
            </div>
            {pendingEvents.map(e => (
              <EventCard key={e.id} event={e} onResolve={(id, idx) => dispatch({ type: 'RESOLVE_EVENT', eventId: id, choiceIndex: idx })} />
            ))}
          </div>
        )}

        {/* MURAL DE NEGOCIAÇÕES — suas e do Cambalhota */}
        <div className="space-y-2">
          <h2 className="font-black text-black uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>📜 Mural de negociações</h2>
          <p className="text-black/40 text-xs font-bold -mt-1 mb-1">Seus fechamentos e os do seu rival Sérgio Cambalhota.</p>
          {state.negotiationLog.length === 0 ? (
            <BrutalCard color={C.creamDark} className="p-6 text-center" shadow={3}>
              <p className="text-3xl mb-1">🤝</p>
              <p className="text-black/50 text-sm font-bold">Nenhuma negociação ainda. Agencie jogadores e feche transferências — elas aparecem aqui.</p>
            </BrutalCard>
          ) : (
            state.negotiationLog.map((entry, i) => (
              <BrutalCard key={i} color={entry.who === 'voce' ? 'white' : C.black} className="p-3" shadow={3}>
                <div className="flex items-start gap-2">
                  <BrutalTag color={entry.who === 'voce' ? C.green : C.orange} textColor="#fff">
                    {entry.who === 'voce' ? 'VOCÊ' : 'CAMBALHOTA'}
                  </BrutalTag>
                  <span className={`text-xs font-bold flex-1 ${entry.who === 'voce' ? 'text-black' : 'text-white'}`}>{entry.text}</span>
                  <span className={`text-[10px] font-black ${entry.who === 'voce' ? 'text-black/40' : 'text-white/40'}`}>{entry.year}</span>
                </div>
              </BrutalCard>
            ))
          )}
        </div>

        {activeOffers.length === 0 && pendingEvents.length === 0 && (
          <p className="text-black/40 text-xs font-bold text-center pt-1">
            Sem propostas pendentes. Avance as semanas no painel para receber novas.
          </p>
        )}
      </div>
    </div>
  )
}
