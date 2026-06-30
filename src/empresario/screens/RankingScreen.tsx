import { useState } from 'react'
import { useEmpresario } from '../store'
import { OBJECTIVES, yourNetWorth, levelInfo } from '../data/career'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag, FLAG, POS_COLOR } from '../ui'

export default function RankingScreen() {
  const { state, dispatch } = useEmpresario()
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)
  const myNet = yourNetWorth(state)

  const board = [
    { name: 'VOCÊ', wealth: myNet, you: true },
    ...state.rivalAgents.map(r => ({ name: r.name, wealth: r.wealth, you: false })),
  ].sort((a, b) => b.wealth - a.wealth)

  const myRank = board.findIndex(b => b.you) + 1
  const doneCount = OBJECTIVES.filter(o => o.done(state, myRank)).length

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>CARREIRA</h1>
          <BrutalTag color={C.yellow}>🏆 {state.awards}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* your standing */}
        <BrutalCard color={myRank === 1 ? C.yellow : C.blue} className="p-5" shadow={6}>
          <p className={`font-mono text-xs uppercase tracking-widest ${myRank === 1 ? 'text-black/60' : 'text-white/70'}`}>Sua posição no ranking</p>
          <p className={`font-black text-4xl ${myRank === 1 ? 'text-black' : 'text-white'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>
            {myRank}º {myRank === 1 ? '👑' : ''}
          </p>
          <p className={`text-sm font-bold mt-1 ${myRank === 1 ? 'text-black/70' : 'text-white/80'}`}>Patrimônio: {moneyFull(myNet)}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <BrutalTag color={C.yellow}>⭐ Nível {levelInfo(state.xp).level}</BrutalTag>
            <BrutalTag color={C.creamDark}>🏆 {state.awards}x do ano</BrutalTag>
          </div>
        </BrutalCard>

        {/* ranking board */}
        <div>
          <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>📊 RANKING DE EMPRESÁRIOS</h2>
          <div className="space-y-2">
            {board.map((b, i) => (
              <BrutalCard key={b.name} color={b.you ? C.teal : b.name.includes('Cambalhota') ? C.black : 'white'} className="p-3" shadow={3}>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg w-6 ${b.you || b.name.includes('Cambalhota') ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{i + 1}º</span>
                  <span className={`flex-1 font-black text-sm ${b.you ? 'text-white' : b.name.includes('Cambalhota') ? 'text-white' : 'text-black'}`}>
                    {b.name.includes('Cambalhota') ? '😈 ' : ''}{b.name}
                  </span>
                  <span className={`font-black text-sm ${b.you || b.name.includes('Cambalhota') ? 'text-white' : 'text-black/60'}`} style={{ fontFamily: 'Oswald, sans-serif' }}>{money(b.wealth)}</span>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>🎯 OBJETIVOS</h2>
            <BrutalTag color={C.teal}>{doneCount}/{OBJECTIVES.length}</BrutalTag>
          </div>
          <div className="space-y-2">
            {OBJECTIVES.map(o => {
              const done = o.done(state, myRank)
              return (
                <BrutalCard key={o.id} color={done ? C.green : 'white'} className="p-3" shadow={3}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{done ? '✅' : '⬜'}</span>
                    <span className={`text-sm font-bold ${done ? 'text-white line-through' : 'text-black'}`}>{o.label}</span>
                  </div>
                </BrutalCard>
              )
            })}
          </div>
        </div>

        <p className="text-black/40 text-xs font-bold text-center pt-1">
          Cresça mais rápido que o Cambalhota e seja o nº 1 do futebol mundial.
        </p>

        {/* ── PERFIS DOS RIVAIS ONLINE ── */}
        {state.onlineMode === 'online' && state.onlinePlayers.length > 1 && (
          <div>
            <h2 className="font-black text-black mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>👥 PERFIS DOS RIVAIS</h2>
            <div className="space-y-2">
              {state.onlinePlayers
                .filter(p => p.playerIndex !== state.youIndex)
                .sort((a, b) => b.totalDeals - a.totalDeals)
                .map(p => {
                  const online = state.onlinePresence.includes(p.playerIndex)
                  const roster = state.onlinePlayerRosters[p.playerIndex] ?? []
                  const isExpanded = expandedPlayer === p.playerIndex
                  const expiringClients = roster.filter(c => c.repExpiresYear !== undefined && c.repExpiresYear <= state.year + 1)
                  return (
                    <BrutalCard key={p.playerIndex} color="white" className="p-3" shadow={3}>
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setExpandedPlayer(isExpanded ? null : p.playerIndex)}
                      >
                        <span className={`w-2 h-2 rounded-full border border-black shrink-0 ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="flex-1 font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{p.playerName}</span>
                        {expiringClients.length > 0 && (
                          <BrutalTag color={C.orange} textColor="#fff">⚠ {expiringClients.length} expirando</BrutalTag>
                        )}
                        <BrutalTag color={C.teal}>{roster.length} clientes</BrutalTag>
                        <span className="text-black/40 font-black text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      {isExpanded && roster.length > 0 && (
                        <div className="mt-2 pt-2 border-t-2 border-black/10 space-y-1.5">
                          {roster.map(c => {
                            const expiring = c.repExpiresYear !== undefined && c.repExpiresYear <= state.year + 1
                            const free = c.repExpiresYear !== undefined && c.repExpiresYear <= state.year
                            return (
                              <div
                                key={c.legendId}
                                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border-2 ${free ? 'border-orange-400 bg-orange-50' : expiring ? 'border-yellow-400 bg-yellow-50' : 'border-black/10 bg-black/5'}`}
                              >
                                <span className="text-base">{FLAG[c.nationality]}</span>
                                <span className="flex-1 font-black text-black text-xs truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{c.nickname}</span>
                                <BrutalTag color={POS_COLOR[c.position]} textColor="#fff">{c.position}</BrutalTag>
                                <span className="text-black/50 font-mono text-[10px] font-bold">{c.commissionRate}%</span>
                                {free && <BrutalTag color={C.orange} textColor="#fff">LIVRE!</BrutalTag>}
                                {!free && expiring && <BrutalTag color={C.yellow}>até {c.repExpiresYear}</BrutalTag>}
                                {!expiring && c.repExpiresYear && <span className="text-black/30 text-[9px] font-bold">até {c.repExpiresYear}</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {isExpanded && roster.length === 0 && (
                        <p className="text-black/40 text-xs font-bold mt-2 text-center">Nenhum cliente ainda</p>
                      )}
                    </BrutalCard>
                  )
                })}
            </div>
            <p className="text-black/40 text-[10px] font-bold mt-2 text-center">
              ⚠ Contratos marcados com laranja já expiraram — você pode assinar esse jogador de graça!
            </p>
          </div>
        )}

        {/* ── NOVO JOGO ── */}
        <div className="pt-2">
          <BrutalButton color={C.black} textColor="#fff" onClick={() => {
            if (confirm('Começar um jogo NOVO? Isso apaga todo o seu progresso atual e volta pra 1993.')) {
              dispatch({ type: 'NEW_GAME' })
            }
          }}>
            🔄 Novo jogo
          </BrutalButton>
        </div>
      </div>
    </div>
  )
}
