import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { NEMESIS } from '../data/clubs'
import { evaluateRenewal } from '../data/legends'
import { windowInfo, CHALLENGES, levelInfo, MISSIONS, missionForWeek, missionMetricValue } from '../data/career'
import { isDeadlineDay } from '../data/historical'
import type { Client, Personality } from '../types'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalPill, BrutalTag, POS_COLOR, FLAG, STATUS_LABEL } from '../ui'

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const PERSONA: Record<string, { label: string; emoji: string }> = {
  humilde: { label: 'Humilde', emoji: '😇' },
  leal: { label: 'Leal', emoji: '🤝' },
  ambicioso: { label: 'Ambicioso', emoji: '🔥' },
  difícil: { label: 'Difícil', emoji: '🎭' },
}

export default function DashboardScreen() {
  const { state, dispatch } = useEmpresario()
  const [detail, setDetail] = useState<Client | null>(null)
  const [renewing, setRenewing] = useState(false)
  const [rRate, setRRate] = useState(15)
  const [rYears, setRYears] = useState(3)
  const [rResult, setRResult] = useState<string | null>(null)
  const [loaning, setLoaning] = useState(false)
  const [loanYears, setLoanYears] = useState(1)
  const monthIndex = Math.floor((state.week - 1) / 4.34) % 12
  const isStructured = state.onlineGameMode !== null
  const nowAbsDash = state.year * 52 + state.week
  const isSuspended = state.suspendedUntilWeek > nowAbsDash
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
            {state.suspicion > 30 && <BrutalTag color={C.orange} textColor="#fff">🕵️ {state.suspicion}</BrutalTag>}
            <BrutalTag color={C.teal}>REP {state.reputation}</BrutalTag>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* ── SUSPENSÃO BANNER ── */}
        {isSuspended && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <BrutalCard color="#CC0000" className="p-4" shadow={6}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚫</span>
                <div className="flex-1">
                  <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>VOCÊ ESTÁ SUSPENSO!</p>
                  <p className="text-white/80 text-xs font-bold">A federação cassou sua licença temporariamente. Você pode observar os leilões mas NÃO pode dar lance.</p>
                </div>
              </div>
              <p className="text-white/60 text-[10px] font-bold mt-2">Suspensão termina na semana {state.suspendedUntilWeek % 52 || 52} de {Math.floor(state.suspendedUntilWeek / 52)}</p>
            </BrutalCard>
          </motion.div>
        )}

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
          {/* nível de empresário */}
          {(() => {
            const lv = levelInfo(state.xp)
            return (
              <div className="mt-3 pt-3 border-t-2 border-white/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-black text-xs uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>⭐ Nível {lv.level} · Empresário</span>
                  <span className="text-white/60 font-mono text-[10px] font-bold">{lv.into}/{lv.need} XP</span>
                </div>
                <div className="h-2.5 bg-black/25 border-2 border-black rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${lv.pct}%`, backgroundColor: C.yellow }} />
                </div>
              </div>
            )
          })()}
        </BrutalCard>

        {/* ── JANELA DE TRANSFERÊNCIAS (período quente, não trava) — só no mercado livre ── */}
        {!isStructured && (() => {
          const w = windowInfo(state.week)
          const deadline = isDeadlineDay(state.week)
          if (deadline) {
            return (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                <BrutalCard color="#CC0000" className="p-4" shadow={6}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl animate-pulse">⏰</span>
                    <div className="flex-1">
                      <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>DIA D DE TRANSFERÊNCIAS!</p>
                      <p className="text-white/80 text-xs font-bold">A janela fecha HOJE. Clubes estão desesperados. É agora ou nunca.</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-[10px] font-bold mt-1.5">📈 Valores inflacionados · propostas extras · negocie duro</p>
                </BrutalCard>
              </motion.div>
            )
          }
          return (
            <BrutalCard color={w.open ? C.green : C.creamDark} className="p-3" shadow={3}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{w.open ? '🔥' : '📅'}</span>
                <p className={`flex-1 text-sm font-black ${w.open ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {w.open ? `JANELA ABERTA — o mercado ferve por +${w.weeks} sem` : `Mercado tranquilo — janela abre em ${w.weeks} sem`}
                </p>
              </div>
              <p className={`text-[10px] font-bold mt-0.5 ${w.open ? 'text-white/80' : 'text-black/50'}`}>
                {w.open ? '🔥 Choveram propostas! Ótima hora de vender caro.' : 'Propostas chegam o ano todo — mas na janela elas explodem.'}
              </p>
            </BrutalCard>
          )
        })()}

        {/* ── DESAFIO ATUAL (recompensa, sem punição) ── */}
        {(() => {
          const ch = CHALLENGES[state.challengeIndex]
          if (!ch) {
            return (
              <BrutalCard color={C.purple} className="p-3" shadow={3}>
                <p className="text-white font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>🏅 TODOS OS DESAFIOS CONCLUÍDOS!</p>
                <p className="text-white/70 text-[11px] font-bold mt-0.5">Você é uma lenda dos bastidores. Agora é só construir o império.</p>
              </BrutalCard>
            )
          }
          const ready = ch.done(state)
          return (
            <BrutalCard color={ready ? C.green : 'white'} className="p-3" shadow={3}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? 'text-white/80' : 'text-black/50'}`}>🎯 Desafio · {state.challengeIndex + 1}/{CHALLENGES.length}</span>
                <BrutalTag color={C.yellow}>+{money(ch.reward)}</BrutalTag>
              </div>
              <p className={`font-black text-base leading-tight mt-0.5 ${ready ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{ch.title}</p>
              <p className={`text-xs font-bold ${ready ? 'text-white/80' : 'text-black/55'}`}>{ch.desc}</p>
              {ready ? (
                <div className="mt-2">
                  <BrutalButton color={C.black} textColor="#fff" onClick={() => dispatch({ type: 'CLAIM_CHALLENGE' })}>
                    🎁 Resgatar recompensa (+{money(ch.reward)} · +{ch.repReward} rep)
                  </BrutalButton>
                </div>
              ) : (
                <p className="text-black/35 text-[10px] font-bold mt-1">Recompensa: {money(ch.reward)} + {ch.repReward} de reputação</p>
              )}
            </BrutalCard>
          )
        })()}

        {/* ── COMBO DE VENDAS ── */}
        {state.saleStreak >= 2 && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <BrutalCard color={C.orange} className="p-3" shadow={4}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <p className="flex-1 text-white font-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  SEQUÊNCIA x{state.saleStreak}! +{Math.round(Math.min(0.5, (state.saleStreak - 1) * 0.05) * 100)}% em cada negócio
                </p>
                <BrutalTag color={C.yellow}>recorde {state.bestStreak}</BrutalTag>
              </div>
              <p className="text-white/70 text-[10px] font-bold mt-0.5">Continue fechando negócios pra manter o combo vivo!</p>
            </BrutalCard>
          </motion.div>
        )}

        {/* ── MISSÃO DA SEMANA ── */}
        {(() => {
          const mId = state.weeklyMissionId ?? missionForWeek(state.year * 52 + state.week).id
          const mission = MISSIONS.find(m => m.id === mId)
          if (!mission) return null
          const progress = Math.max(0, missionMetricValue(state, mission.metric) - state.weeklyMissionBaseline)
          const done = progress >= mission.target
          const claimable = done && !state.weeklyMissionClaimed && !!state.weeklyMissionId
          return (
            <BrutalCard color={state.weeklyMissionClaimed ? C.creamDark : claimable ? C.green : 'white'} className="p-3" shadow={3}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${claimable ? 'text-white/80' : 'text-black/50'}`}>📋 Missão da semana</span>
                <BrutalTag color={C.yellow}>+{money(mission.reward)}</BrutalTag>
              </div>
              <p className={`font-black text-sm leading-tight mt-0.5 ${claimable ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{mission.label}</p>
              {state.weeklyMissionClaimed ? (
                <p className="text-black/40 text-[11px] font-bold mt-1">✅ Recompensa já resgatada. Nova missão na próxima semana.</p>
              ) : claimable ? (
                <div className="mt-2">
                  <BrutalButton color={C.black} textColor="#fff" onClick={() => dispatch({ type: 'CLAIM_MISSION' })}>
                    🎁 Resgatar (+{money(mission.reward)})
                  </BrutalButton>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="h-2.5 bg-black/10 border-2 border-black rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (progress / mission.target) * 100)}%`, backgroundColor: C.teal }} />
                  </div>
                  <p className="text-black/40 text-[10px] font-bold mt-1">{progress}/{mission.target} concluído</p>
                </div>
              )}
            </BrutalCard>
          )
        })()}

        {/* ── DRAFT / LEILÃO ALERT (cpu e online estruturado) ── */}
        {isStructured && state.draftWindowActive && (
          <BrutalCard color={C.green} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'scouts' })} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div className="flex-1">
                <p className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>JANELA DE DRAFT ABERTA!</p>
                <p className="text-black/60 text-xs font-bold">Os rivais já escolheram — hora de fazer sua escolha</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </BrutalCard>
        )}
        {isStructured && state.currentAuction !== null && !state.draftWindowActive && (
          <BrutalCard color={C.purple} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'scouts' })} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔨</span>
              <div className="flex-1">
                <p className="font-black text-white text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>LEILÃO EM ANDAMENTO!</p>
                <p className="text-white/60 text-xs font-bold">Lance seu valor antes de avançar semana</p>
              </div>
              <span className="text-2xl text-white">→</span>
            </div>
          </BrutalCard>
        )}

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

        {/* ── NAV GRID (menus primeiro, antes da carteira) ── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
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

          <BrutalCard color={C.purple} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'ranking' })}>
            <p className="text-3xl mb-1">🏆</p>
            <p className="font-black text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>CARREIRA</p>
            <p className="text-white/60 text-xs font-bold">Ranking e objetivos</p>
          </BrutalCard>

          <BrutalCard color={C.creamDark} className="p-4" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'album' })}>
            <p className="text-3xl mb-1">📔</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>ÁLBUM</p>
            <p className="text-black/60 text-xs font-bold">Lendas colecionadas</p>
          </BrutalCard>

          {(() => {
            const auctionLock = isStructured && state.currentAuction !== null
            const draftLock = isStructured && state.draftWindowActive
            const locked = auctionLock || draftLock
            return (
              <BrutalCard
                color={locked ? C.orange : C.black}
                className="p-4 col-span-2"
                onClick={() => !locked && dispatch({ type: 'ADVANCE_WEEK' })}
              >
                <p className="text-3xl mb-1">{locked ? '🔒' : '⏩'}</p>
                <p className="font-black text-sm text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {draftLock ? 'AGUARDE DRAFT' : auctionLock ? 'LEILÃO ATIVO' : 'AVANÇAR'}
                </p>
                <p className="text-white/60 text-[10px] font-bold">
                  {locked ? 'Todos precisam jogar' : 'Próxima semana'}
                </p>
              </BrutalCard>
            )
          })()}
        </div>

        {/* ── ONLINE RIVALS PANEL ── */}
        {state.onlineMode === 'online' && state.onlinePlayers.length > 0 && (
          <div className="pt-1">
            <h2 className="font-black text-black text-sm mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>🌐 Rivais Online</h2>
            <div className="space-y-2">
              {state.onlinePlayers
                .filter(p => p.playerIndex !== state.youIndex)
                .sort((a, b) => b.totalDeals - a.totalDeals)
                .map(p => {
                  const online = state.onlinePresence.includes(p.playerIndex)
                  const roster = state.onlinePlayerRosters[p.playerIndex] ?? []
                  return (
                    <BrutalCard key={p.playerIndex} color="white" className="p-3" shadow={3}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full border border-black shrink-0 ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="flex-1 font-black text-black text-sm truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{p.playerName}</span>
                        <BrutalTag color={C.yellow}>{p.totalDeals} deals</BrutalTag>
                        <BrutalTag color={C.teal}>{roster.length} clientes</BrutalTag>
                      </div>
                    </BrutalCard>
                  )
                })}
            </div>
          </div>
        )}

        {/* ── ONLINE NEWS FEED ── */}
        {state.onlineMode === 'online' && state.onlineNews.length > 0 && (
          <div className="pt-1">
            <h2 className="font-black text-black text-sm mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>📡 Notícias dos Rivais</h2>
            <BrutalCard color={C.teal} className="p-3 space-y-2 max-h-56 overflow-y-auto" shadow={3}>
              {state.onlineNews.slice(0, 15).map((item) => (
                <div key={item.id} className="flex items-start gap-2 border-b border-white/20 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-white/60 font-mono text-[9px] font-bold shrink-0 pt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-white text-[11px] font-bold leading-relaxed">{item.text}</p>
                </div>
              ))}
            </BrutalCard>
          </div>
        )}

        {state.weeklyExpenses > 0 && (
          <p className="text-center text-black/40 text-xs font-bold">
            Custo semanal dos clientes: −{moneyFull(state.weeklyExpenses)}
          </p>
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
            <p className="text-black/50 text-sm mt-1 font-medium">Assine as futuras lendas antes de todo mundo.</p>
          </BrutalCard>
        ) : (
          <div className="space-y-3">
            {state.clients.map((c, i) => {
              const st = STATUS_LABEL[c.status]
              const injured = !!c.injuredUntilWeek
              const injEmoji = c.injuryLevel === 'grave' ? '🚨' : c.injuryLevel === 'moderada' ? '⚠️' : '🤕'
              return (
                <motion.div key={c.legendId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <BrutalCard color={injured ? '#FFF3CD' : 'white'} className="p-4" onClick={() => setDetail(c)}>
                    {injured && (
                      <div className="mb-2 flex items-center gap-1.5 bg-orange-100 border-2 border-orange-400 rounded px-2 py-1">
                        <span className="text-sm">{injEmoji}</span>
                        <span className="text-orange-800 text-[10px] font-black uppercase tracking-wide">
                          LESIONADO ({c.injuryLevel?.toUpperCase()}) — {c.injuryDescription}
                        </span>
                      </div>
                    )}
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

        {/* ── últimas notícias (feed do mundo do futebol) ── */}
        {state.narrative.length > 0 && (
          <div className="pt-1">
            <h2 className="font-black text-black text-sm mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>📰 Jornal da semana</h2>
            <BrutalCard color={C.creamDark} className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {[...state.narrative].reverse().slice(0, 12).map((n, i) => (
                <p key={i} className={`text-xs font-medium leading-relaxed border-l-[3px] pl-2 ${i === 0 ? 'text-black border-black' : 'text-black/60 border-black/30'}`}>{n}</p>
              ))}
            </BrutalCard>
          </div>
        )}

      </div>

      {/* ── CLIENT DETAIL MODAL ── */}
      <AnimatePresence>
        {detail && (() => {
          const c = detail
          const age = state.year - c.birthYear
          const st = STATUS_LABEL[c.status]
          const persona = PERSONA[c.personality]
          const yearsWithYou = state.year - c.signedYear
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setDetail(null)}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="w-full max-w-md p-3"
                onClick={e => e.stopPropagation()}
              >
                <BrutalCard color={C.cream} className="p-5 max-h-[85vh] overflow-y-auto" shadow={8}>
                  {/* head */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-4xl">{FLAG[c.nationality]}</div>
                    <div className="flex-1">
                      <p className="font-black text-black text-2xl leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</p>
                      <p className="text-black/50 text-sm font-bold">{c.name}</p>
                    </div>
                    <button onClick={() => { setDetail(null); setRenewing(false); setRResult(null); setLoaning(false) }} className="text-black text-2xl font-black">×</button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                    {st && <BrutalTag color={st.color} textColor={c.status === 'pelada' ? '#fff' : '#000'}>{st.label}</BrutalTag>}
                    <BrutalTag color={C.creamDark}>{age} anos</BrutalTag>
                    {persona && <BrutalTag color={C.creamDark}>{persona.emoji} {persona.label}</BrutalTag>}
                  </div>

                  {/* current club */}
                  <BrutalCard color={C.blue} className="p-3 mb-3" shadow={3}>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Joga atualmente no</p>
                    <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>🏟️ {c.contractClub ?? 'Sem clube'}</p>
                    {c.contractExpiresYear && (
                      <p className="text-white/60 text-xs font-bold mt-0.5">Vínculo com o clube até {c.contractExpiresYear} · salário {money(c.contractSalary)}/ano</p>
                    )}
                  </BrutalCard>

                  {/* YOUR representation contract */}
                  {(() => {
                    const exp = c.repExpiresYear
                    const expiring = exp !== undefined && state.year >= exp - 1
                    const persona2 = (c.personality as Personality)
                    const renewEval = evaluateRenewal(c.happiness, persona2, rRate, rYears)
                    const renewAsk = rRate + (rYears - 3) * 1.5
                    const renewLabel = renewAsk <= renewEval.maxAcceptable - 4 ? { t: '😄 Renova fácil', col: C.green, fg: '#fff' }
                      : renewAsk <= renewEval.maxAcceptable ? { t: '🤝 Ele topa', col: C.teal, fg: '#000' }
                      : renewAsk <= renewEval.maxAcceptable + 4 ? { t: '😬 Vai pechinchar', col: C.yellow, fg: '#000' }
                      : { t: '🚫 Vai recusar', col: C.orange, fg: '#fff' }
                    return (
                      <BrutalCard color={expiring ? C.orange : C.creamDark} className="p-3 mb-3" shadow={3}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${expiring ? 'text-white/70' : 'text-black/50'}`}>
                          📄 Seu contrato de representação
                        </p>
                        <p className={`font-black text-lg ${expiring ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
                          {exp ? `Você o representa até ${exp}` : 'Contrato sem prazo definido'}
                        </p>
                        {expiring && !renewing && (
                          <>
                            <p className="text-white text-xs font-bold mt-1">⚠ Vencendo! Renove ou você o PERDE de graça.</p>
                            <div className="mt-2">
                              <BrutalButton color="white" textColor={C.black} onClick={() => { setRenewing(true); setRRate(c.commissionRate); setRYears(3); setRResult(null) }}>
                                Renovar contrato
                              </BrutalButton>
                            </div>
                          </>
                        )}
                        {renewing && (
                          <div className="mt-3 bg-white border-2 border-black rounded-lg p-3">
                            {rResult ? (
                              <>
                                <p className="text-black text-sm font-bold">{rResult}</p>
                                <div className="mt-2">
                                  <BrutalButton color={C.black} textColor="#fff" onClick={() => { setRenewing(false); setRResult(null) }}>Fechar</BrutalButton>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-black/60 text-[11px] font-black uppercase">Comissão</span>
                                  <span className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{rRate}%</span>
                                </div>
                                <input type="range" min={5} max={30} value={rRate} onChange={e => setRRate(Number(e.target.value))} className="w-full h-2.5" style={{ accentColor: C.blue }} />
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-black/60 text-[11px] font-black uppercase">Anos</span>
                                  <span className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{rYears}</span>
                                </div>
                                <input type="range" min={1} max={6} value={rYears} onChange={e => setRYears(Number(e.target.value))} className="w-full h-2.5" style={{ accentColor: C.purple }} />
                                <div className="border-2 border-black rounded-md px-2 py-1.5 mt-2 flex justify-between items-center" style={{ backgroundColor: renewLabel.col }}>
                                  <span className="font-black text-xs" style={{ color: renewLabel.fg, fontFamily: 'Oswald, sans-serif' }}>{renewLabel.t}</span>
                                  <span className="font-mono text-[10px] font-bold" style={{ color: renewLabel.fg }}>moral {c.happiness}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <BrutalButton color="white" textColor={C.black} onClick={() => setRenewing(false)}>Cancelar</BrutalButton>
                                  <BrutalButton color={C.green} onClick={() => {
                                    const ev = evaluateRenewal(c.happiness, persona2, rRate, rYears)
                                    if (ev.result === 'accept') {
                                      dispatch({ type: 'RENEW_CLIENT', legendId: c.legendId, commissionRate: rRate, contractYears: rYears })
                                      setRResult(`✅ ${ev.reason}`)
                                    } else if (ev.result === 'counter') {
                                      setRResult(`😬 ${ev.reason}`)
                                    } else {
                                      setRResult(`🚫 ${ev.reason}`)
                                    }
                                  }}>Propor</BrutalButton>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </BrutalCard>
                    )
                  })()}

                  {/* stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <p className="text-black/40 text-[9px] font-black uppercase">Nota</p>
                      <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.currentRating}</p>
                    </div>
                    <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.yellow }}>
                      <p className="text-black/60 text-[9px] font-black uppercase">Potencial ✦</p>
                      <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.truePotential}</p>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <p className="text-black/40 text-[9px] font-black uppercase">Valor</p>
                      <p className="font-black text-black text-base mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(c.currentValue)}</p>
                    </div>
                  </div>

                  {/* your deal */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <p className="text-black/40 text-[9px] font-black uppercase">Comissão</p>
                      <p className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.commissionRate}%</p>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <p className="text-black/40 text-[9px] font-black uppercase">Moral</p>
                      <p className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif', color: c.happiness > 60 ? C.tealDark : c.happiness > 35 ? '#000' : C.orange }}>{c.happiness}</p>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <p className="text-black/40 text-[9px] font-black uppercase">Com você há</p>
                      <p className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{yearsWithYou}a</p>
                    </div>
                  </div>

                  {/* future knowledge */}
                  <BrutalCard color={C.black} className="p-3 mb-3" shadow={3}>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">🔮 O que SÓ você sabe</p>
                    <p className="text-white text-xs font-bold leading-relaxed">{c.futureKnowledge}</p>
                  </BrutalCard>

                  {/* ── EMPRÉSTIMO ESTRATÉGICO ── */}
                  {!c.onStrategicLoan && !c.injuredUntilWeek && (
                    <BrutalCard color={loaning ? C.blue : C.creamDark} className="p-3 mb-3" shadow={3}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${loaning ? 'text-white/70' : 'text-black/50'}`}>✈️ Empréstimo estratégico</p>
                      {loaning ? (
                        <div className="mt-2">
                          <p className="text-white text-xs font-bold mb-2">Quantos anos de empréstimo?</p>
                          <div className="flex items-center gap-3 mb-2">
                            <input type="range" min={1} max={3} value={loanYears} onChange={e => setLoanYears(Number(e.target.value))} className="flex-1" style={{ accentColor: C.yellow }} />
                            <span className="font-black text-white text-xl w-8">{loanYears}</span>
                          </div>
                          <p className="text-white/60 text-[10px] font-bold mb-3">Durante o empréstimo: rating cresce +15%/ano extra. Não disponível pra venda enquanto estiver lá.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <BrutalButton color="white" textColor={C.black} onClick={() => setLoaning(false)}>Cancelar</BrutalButton>
                            <BrutalButton color={C.yellow} textColor="#000" onClick={() => {
                              dispatch({ type: 'LOAN_CLIENT', legendId: c.legendId, loanClub: '', loanYears })
                              setLoaning(false)
                              setDetail(null)
                            }}>✈️ Emprestar!</BrutalButton>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-black text-xs font-bold mt-0.5">Mande {c.nickname} pra um clube menor. Ele cresce mais rápido e volta mais valioso.</p>
                          <div className="mt-2">
                            <BrutalButton color={C.teal} onClick={() => { setLoaning(true); setLoanYears(1) }}>✈️ Enviar em empréstimo</BrutalButton>
                          </div>
                        </>
                      )}
                    </BrutalCard>
                  )}
                  {c.onStrategicLoan && (
                    <BrutalCard color={C.teal} className="p-3 mb-3" shadow={3}>
                      <p className="text-black/60 text-[10px] font-black uppercase tracking-widest">✈️ Em empréstimo estratégico</p>
                      <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>📍 {c.loanOriginClub}</p>
                      <p className="text-black/60 text-xs font-bold mt-0.5">Retorna em {c.loanReturnYear} · crescimento acelerado ativo</p>
                    </BrutalCard>
                  )}

                  <div className="mt-2">
                    <BrutalButton color={C.green} onClick={() => { setDetail(null); dispatch({ type: 'SET_SCREEN', screen: 'offers' }) }}>
                      Ver propostas e negociar →
                    </BrutalButton>
                  </div>
                </BrutalCard>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ── NEMESIS ALERT MODAL ── */}
      <AnimatePresence>
        {state.nemesisAlert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <BrutalCard color={C.cream} className="p-5" shadow={8}>
                <div className="text-center mb-3">
                  <div className="text-5xl mb-2">😈</div>
                  <BrutalPill color={C.orange} textColor="#fff">
                    {state.nemesisAlert.isFirst ? 'SEU NOVO RIVAL' : 'ELE ATACOU DE NOVO'}
                  </BrutalPill>
                  <h2 className="font-black text-black text-2xl mt-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {NEMESIS.name.toUpperCase()}
                  </h2>
                </div>
                <BrutalCard color="white" className="p-3 mb-4" shadow={3}>
                  <p className="text-black text-sm font-medium leading-relaxed">{state.nemesisAlert.story}</p>
                </BrutalCard>
                {state.nemesisAlert.legendId !== '' && (
                  <div className="border-2 border-black rounded-lg p-2.5 mb-4" style={{ backgroundColor: C.orange }}>
                    <p className="text-white text-xs font-black text-center">
                      💔 Ele fechou com {state.nemesisAlert.legendNickname} — essa lenda não está mais disponível.
                    </p>
                  </div>
                )}
                <BrutalButton color={C.black} textColor="#fff" onClick={() => dispatch({ type: 'DISMISS_NEMESIS_ALERT' })}>
                  Isso não vai ficar assim →
                </BrutalButton>
              </BrutalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
