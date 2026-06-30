import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { useBroadcast } from '../index'
import {
  getAvailableLegends, getCurrentRating, getMarketValue,
  getCurrentStatus, evaluateSigning, getMaxAcceptable, getFameDribleChance,
  getMinReputationToSign, getLegendById,
  getUnlockedNationalities, getLockedRegions, SCOUT_REGIONS,
} from '../data/legends'
import { rarityOf } from '../data/career'
import type { Legend, SigningEvaluation } from '../types'
import {
  C, money, BrutalCard, BrutalButton, BrutalPill, BrutalTag,
  POS_COLOR, FLAG, STATUS_LABEL,
} from '../ui'

export default function ScoutsScreen() {
  const { state, dispatch } = useEmpresario()
  const broadcast = useBroadcast()
  const [selected, setSelected] = useState<Legend | null>(null)
  const [rate, setRate] = useState(15)
  const [years, setYears] = useState(3)
  const [result, setResult] = useState<SigningEvaluation | null>(null)
  const [justSigned, setJustSigned] = useState<string | null>(null)
  const [reveal, setReveal] = useState<Legend | null>(null)

  // ── Online mode helpers ───────────────────────────────────────────────────
  const isOnlineDraft = state.onlineMode === 'online' &&
    (state.onlineGameMode === 'draft' || state.onlineGameMode === 'draft-leilao')
  const isOnlineLeilao = state.onlineMode === 'online' &&
    (state.onlineGameMode === 'leilao' || state.onlineGameMode === 'draft-leilao')
  const isCpuDraft = state.onlineMode === 'cpu' && state.draftWindowActive
  const isCpuLeilao = state.onlineMode === 'cpu' && state.currentAuction !== null && !state.draftWindowActive
  const myTurn = isOnlineDraft && state.draftTurn === state.youIndex
  const turnName = state.playerNames[state.draftTurn] ?? 'Jogador'

  const signedIds = state.clients.map(c => c.legendId)
  const unlockedNats = getUnlockedNationalities(state.purchasedUpgrades)
  const lockedRegions = getLockedRegions(state.purchasedUpgrades)
  // Exclude legends already taken by other players (online or CPU)
  const takenIds = Object.keys(state.onlineTakenLegends)
  const available = getAvailableLegends(state.year, [...signedIds, ...takenIds], unlockedNats, state.lostLegends)

  // live prediction reacts to BOTH commission and contract length
  const liveMax = selected ? getMaxAcceptable(selected, state.reputation, state.year) : 0
  const ask = rate + (years - 3) * 1.5
  const livePrediction = !selected ? null
    : ask <= liveMax - 5 ? { label: '😄 Ele topa fácil', color: C.green, text: '#fff' }
    : ask <= liveMax ? { label: '🤝 Ele aceita', color: C.teal, text: '#000' }
    : ask <= liveMax + 4 ? { label: '😬 Ele vai pechinchar', color: C.yellow, text: '#000' }
    : { label: '🚫 Ele vai recusar', color: C.orange, text: '#fff' }

  // fame drible risk + strikes
  const fameDribleChance = selected ? getFameDribleChance(selected, state.year) : 0
  const strikes = selected ? (state.rejectionCounts[selected.id] ?? 0) : 0
  const upfrontCost = selected ? selected.signingFee + selected.luva : 0
  const canAffordUpfront = selected ? state.money >= upfrontCost : false
  // reputation gate: famous players won't even talk to a no-name agent
  const minRep = selected ? getMinReputationToSign(selected, state.year) : 0
  const repBlocked = selected ? state.reputation < minRep : false

  // In CPU draft/leilão mode, the free market is locked between windows.
  const cpuModeActive = state.onlineMode === 'cpu' && state.onlineGameMode !== null
  const cpuWindowOpen = cpuModeActive && (state.draftWindowActive || state.currentAuction !== null)
  const cpuMarketLocked = cpuModeActive && !cpuWindowOpen

  // Online/CPU draft: show full pool sorted by rating. Solo/CPU solo: weekly rotation of 6.
  const seed = state.year * 137 + state.week * 31
  const pool = (state.onlineMode === 'online' || cpuWindowOpen)
    ? [...available]
        .filter(l => !(l.id in state.hotTargets))
        .sort((a, b) => getCurrentRating(b, state.year) - getCurrentRating(a, state.year))
        .slice(0, 20)
    : cpuMarketLocked
    ? []  // no pool shown while locked between windows
    : [...available]
        .filter(l => !(l.id in state.hotTargets))
        .sort((a, b) => {
          const ha = Math.abs(Math.sin(seed + a.id.charCodeAt(0) * 7.7 + a.id.charCodeAt(1) * 3.3))
          const hb = Math.abs(Math.sin(seed + b.id.charCodeAt(0) * 7.7 + b.id.charCodeAt(1) * 3.3))
          return ha - hb
        })
        .slice(0, 6)

  function openPlayer(legend: Legend) {
    // First time you lay eyes on this talent → reveal animation + album/XP
    if (!state.seenLegendIds.includes(legend.id)) {
      dispatch({ type: 'MARK_LEGEND_SEEN', legendId: legend.id })
      setReveal(legend)
      setTimeout(() => setReveal(null), 1300)
    }
    setSelected(selected?.id === legend.id ? null : legend)
    setRate(15)
    setYears(3)
    setResult(null)
  }

  // 🔥 hot targets still available to chase (with their ticking deadline)
  const nowAbs = state.year * 52 + state.week
  const hotList = Object.entries(state.hotTargets)
    .map(([id, deadline]) => ({ legend: available.find(l => l.id === id), weeks: deadline - nowAbs }))
    .filter((h): h is { legend: Legend; weeks: number } => !!h.legend && h.weeks > 0)
    .sort((a, b) => a.weeks - b.weeks)

  function tryToSign() {
    if (!selected) return
    if (state.money < selected.signingFee + selected.luva) return
    const strikesNow = state.rejectionCounts[selected.id] ?? 0
    const evalResult = evaluateSigning(selected, rate, state.reputation, state.year, strikesNow, years)
    setResult(evalResult)

    if (evalResult.result === 'accept') {
      setTimeout(() => {
        dispatch({ type: 'SIGN_CLIENT', legendId: selected.id, commissionRate: rate, contractYears: years })
        setJustSigned(selected.nickname)
        setSelected(null)
        setResult(null)
        setTimeout(() => setJustSigned(null), 2200)
      }, 900)
    } else if (evalResult.result === 'reject') {
      dispatch({ type: 'LEGEND_REJECTED', legendId: selected.id, lost: !!evalResult.lost })
    }
  }

  function acceptCounter() {
    if (!selected || !result) return
    dispatch({ type: 'SIGN_CLIENT', legendId: selected.id, commissionRate: result.maxAcceptable, contractYears: years })
    setJustSigned(selected.nickname)
    setSelected(null)
    setResult(null)
    setTimeout(() => setJustSigned(null), 2200)
  }

  // ── Leilão helpers ─────────────────────────────────────────────────────────
  const [bidAmount, setBidAmount] = useState(0)
  const [bidResult, setBidResult] = useState<{
    legendNickname: string
    youWon: boolean
    winnerName: string
    winnerAmount: number
    allBids: Array<{ name: string; amount: number; isYou: boolean; isWinner: boolean }>
  } | null>(null)
  const auction = state.currentAuction
  const auctionLegend = auction ? getLegendById(auction.legendId) : null
  const myBid = auction ? (auction.bids[state.youIndex] ?? 0) : 0
  const topBid = auction ? Math.max(0, ...Object.values(auction.bids)) : 0

  function startAuction(legendId: string) {
    broadcast('auction_start', { legendId })
    dispatch({ type: 'AUCTION_SET', auction: { legendId, bids: {}, endsAt: Date.now() + 60_000, closed: false } })
  }

  function startRepAuction(legendId: string) {
    broadcast('auction_start', { legendId, sellerIndex: state.youIndex })
    dispatch({ type: 'AUCTION_SET', auction: { legendId, bids: {}, endsAt: Date.now() + 60_000, closed: false, sellerIndex: state.youIndex } })
  }

  function placeBid() {
    if (!auction || bidAmount <= 0 || state.money < bidAmount) return
    broadcast('auction_bid', { playerIndex: state.youIndex, amount: bidAmount })
    dispatch({ type: 'AUCTION_BID', playerIndex: state.youIndex, amount: bidAmount })
  }

  function closeAuction() {
    if (!auction) return
    // CPU mode: use dedicated close action (handles CPU agent winning)
    if (state.onlineMode === 'cpu') {
      dispatch({ type: 'CPU_AUCTION_CLOSE' })
      return
    }
    const sellerIdx = auction.sellerIndex
    const isRepTransfer = sellerIdx !== undefined
    const entries = Object.entries(auction.bids).map(([k, v]) => ({ idx: Number(k), amount: v }))
    if (entries.length === 0) {
      broadcast('auction_close', { legendId: auction.legendId, winnerIndex: -1, winnerAmount: 0, sellerIndex: sellerIdx ?? -1 })
      dispatch({ type: 'AUCTION_SET', auction: null })
      return
    }
    const winner = entries.reduce((a, b) => b.amount > a.amount ? b : a)
    broadcast('auction_close', { legendId: auction.legendId, winnerIndex: winner.idx, winnerAmount: winner.amount, sellerIndex: sellerIdx ?? -1 })
    if (isRepTransfer) {
      if (winner.idx === sellerIdx) {
        dispatch({ type: 'AUCTION_SET', auction: null })
      } else if (winner.idx === state.youIndex) {
        dispatch({ type: 'AUCTION_WIN', legendId: auction.legendId, bidAmount: winner.amount })
      } else if (sellerIdx === state.youIndex) {
        dispatch({ type: 'REP_SOLD', legendId: auction.legendId, saleAmount: winner.amount })
      } else {
        dispatch({ type: 'AUCTION_SET', auction: null })
      }
    } else {
      if (winner.idx === state.youIndex) {
        dispatch({ type: 'AUCTION_WIN', legendId: auction.legendId, bidAmount: winner.amount })
      } else {
        dispatch({ type: 'AUCTION_SET', auction: null })
      }
    }
  }

  // CPU leilão: bid (or not) and close in one tap — reveals all bids + winner.
  function confirmBidAndClose(useBid: boolean) {
    if (!auction || !auctionLegend) return
    const amount = useBid && bidAmount > 0 ? bidAmount : 0
    const allBidsRecord: Record<number, number> = amount > 0
      ? { ...auction.bids, [state.youIndex]: amount }
      : auction.bids
    const entries = Object.entries(allBidsRecord).map(([k, v]) => ({ idx: Number(k), amount: v as number }))
    const winner = entries.length > 0 ? entries.reduce((a, b) => b.amount > a.amount ? b : a) : null

    const allBids = [
      { name: state.playerNames[0] ?? 'Você', amount: allBidsRecord[0] ?? 0, isYou: true, isWinner: winner?.idx === 0 },
      ...(auction.cpuBidderRivalIndices ?? []).map((rivalIdx, i) => {
        const rival = state.rivalAgents[rivalIdx]
        return {
          name: rival?.name ?? `Rival ${i + 1}`,
          amount: allBidsRecord[i + 1] ?? 0,
          isYou: false,
          isWinner: winner?.idx === i + 1,
        }
      }),
    ]

    setBidResult({
      legendNickname: auctionLegend.nickname,
      youWon: winner?.idx === 0,
      winnerName: winner ? allBids.find(b => b.isWinner)?.name ?? '???' : 'Ninguém',
      winnerAmount: winner?.amount ?? 0,
      allBids,
    })
    dispatch({ type: 'CPU_AUCTION_BID_AND_CLOSE', amount })
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      {/* header */}
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
                  className="text-white text-2xl font-black">←</button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>RADAR DE TALENTOS</h1>
          </div>
          <BrutalTag color={C.yellow}>{money(state.money)}</BrutalTag>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">

        {/* ── DRAFT MODE BANNER (Online) ── */}
        {isOnlineDraft && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="border-[3px] border-black rounded-2xl p-4 text-center"
            style={{ backgroundColor: myTurn ? C.green : C.black, boxShadow: `4px 4px 0 ${C.black}` }}
          >
            {myTurn ? (
              <>
                <p className="text-black font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>⚡ SUA VEZ DE ESCOLHER!</p>
                <p className="text-black/70 text-sm font-bold mt-1">Selecione uma lenda abaixo e assine</p>
              </>
            ) : (
              <>
                <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>⏳ VEZ DE {turnName.toUpperCase()}</p>
                <p className="text-white/50 text-sm font-bold mt-1">Aguarde sua vez — você pode explorar enquanto isso</p>
              </>
            )}
          </motion.div>
        )}

        {/* ── DRAFT MODE BANNER (CPU) ── */}
        {isCpuDraft && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <BrutalCard color={C.green} className="p-4" shadow={5}>
              <p className="text-black font-black text-xl text-center" style={{ fontFamily: 'Oswald, sans-serif' }}>⚡ JANELA DE DRAFT ABERTA!</p>
              <p className="text-black/70 text-sm font-bold text-center mt-1">Os rivais já escolheram — assine uma lenda antes de avançar semana</p>
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <button
                    onClick={() => dispatch({ type: 'SKIP_CPU_DRAFT' })}
                    className="w-full border-2 border-black rounded-xl px-3 py-2 text-xs font-black bg-white text-black"
                  >
                    ⏭ Pular esta rodada
                  </button>
                </div>
              </div>
            </BrutalCard>
          </motion.div>
        )}

        {/* ── LEILÃO ATIVO (Online + CPU) ── */}
        {(isOnlineLeilao || isCpuLeilao) && auction && auctionLegend && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <BrutalCard color={C.purple} className="p-5" shadow={6}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <BrutalPill color={C.yellow} textColor={C.black}>🔨 LEILÃO ATIVO</BrutalPill>
                  {auction.sellerIndex !== undefined && (
                    <p className="text-white/50 text-[10px] font-black mt-1">
                      Vendedor: {state.playerNames[auction.sellerIndex] ?? 'Agente'}
                    </p>
                  )}
                </div>
                {(state.isHost || auction.sellerIndex === state.youIndex) && state.onlineMode !== 'cpu' && !auction.closed && (
                  <button onClick={closeAuction}
                    className="border-2 border-black rounded-lg px-3 py-1 text-xs font-black bg-white text-black">
                    Fechar leilão
                  </button>
                )}
              </div>
              <div className="bg-white border-[3px] border-black rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{FLAG[auctionLegend.nationality]}</span>
                  <div className="flex-1">
                    <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{auctionLegend.nickname}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <BrutalTag color={POS_COLOR[auctionLegend.position]} textColor="#fff">{auctionLegend.position}</BrutalTag>
                      <BrutalTag color={C.yellow}>⭐ {rarityOf(auctionLegend.truePotential).label}</BrutalTag>
                      <BrutalTag color={C.teal}>Pot. {auctionLegend.truePotential}</BrutalTag>
                    </div>
                  </div>
                </div>
              </div>
              {/* bids — online shows player names, CPU shows blind rival status */}
              <div className="space-y-2 mb-4">
                {state.onlineMode === 'cpu' ? (
                  <>
                    {/* ── BLIND AUCTION: you only see whether rivals bid, not how much ── */}
                    <div className="border-2 border-white/30 rounded-lg px-3 py-1.5 text-center mb-1">
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">🔒 Leilão cego — valores revelados ao fechar</p>
                    </div>
                    {/* Player row — your own bid IS shown */}
                    {(() => {
                      const bid = auction.bids[0]
                      return (
                        <div className="flex items-center gap-2 bg-white/20 border-2 border-black/30 rounded-lg px-3 py-2">
                          <span className="text-sm">👤</span>
                          <span className="flex-1 font-black text-white text-sm">{state.playerNames[0] ?? 'Você'}</span>
                          {bid ? (
                            <span className="font-black text-yellow-300 text-sm">✓ {money(bid)}</span>
                          ) : (
                            <span className="text-white/40 text-xs font-bold">sem lance</span>
                          )}
                        </div>
                      )
                    })()}
                    {/* CPU rival rows — only show whether they bid, not how much */}
                    {(auction.cpuBidderRivalIndices ?? []).map((rivalIdx, i) => {
                      const rival = state.rivalAgents[rivalIdx]
                      if (!rival) return null
                      const hasBid = (auction.bids[i + 1] ?? 0) > 0
                      return (
                        <div key={rival.id} className="flex items-center gap-2 bg-white/20 border-2 border-black/30 rounded-lg px-3 py-2">
                          <span className="text-sm">{rivalIdx === 0 ? '😈' : '🕴️'}</span>
                          <span className="flex-1 font-black text-white text-sm truncate">{rival.name}</span>
                          {hasBid ? (
                            <span className="text-white/60 text-xs font-black">✓ LANCE DADO</span>
                          ) : (
                            <span className="text-white/30 text-xs font-bold">—</span>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  state.playerNames.map((name, idx) => {
                    const bid = auction.bids[idx]
                    const isTop = bid === topBid && bid > 0
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white/20 border-2 border-black/30 rounded-lg px-3 py-2">
                        <span className="text-sm">{idx === state.youIndex ? '👤' : '🎮'}</span>
                        <span className="flex-1 font-black text-white text-sm truncate">{name}</span>
                        {bid ? (
                          <span className={`font-black text-sm ${isTop ? 'text-yellow-300' : 'text-white/70'}`}>
                            {isTop ? '👑 ' : ''}{money(bid)}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs font-bold">sem lance</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              {/* my bid input — CPU leilão: bid + close in one tap */}
              {state.onlineMode === 'cpu' && !auction.closed && !myBid && (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount || ''}
                      onChange={e => setBidAmount(Number(e.target.value))}
                      placeholder="Seu lance (R$)"
                      className="flex-1 border-[3px] border-black rounded-xl px-3 py-2 font-black text-black text-lg focus:outline-none"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    />
                    <BrutalButton color={C.yellow} textColor="#000" full={false}
                      disabled={bidAmount <= 0 || bidAmount > state.money}
                      onClick={() => confirmBidAndClose(true)} className="!px-4">
                      ✅ LANCE E FECHAR
                    </BrutalButton>
                  </div>
                  <button onClick={() => confirmBidAndClose(false)} className="text-black/40 text-[11px] font-bold underline mt-1.5 block mx-auto">
                    Fechar sem dar lance
                  </button>
                </div>
              )}
              {/* my bid input — online leilão: bid only, host closes separately */}
              {state.onlineMode !== 'cpu' && !auction.closed && !myBid && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount || ''}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    placeholder="Seu lance (R$)"
                    className="flex-1 border-[3px] border-black rounded-xl px-3 py-2 font-black text-black text-lg focus:outline-none"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  />
                  <BrutalButton color={C.yellow} textColor="#000" full={false}
                    disabled={bidAmount <= 0 || bidAmount > state.money}
                    onClick={placeBid} className="!px-4">
                    DAR LANCE
                  </BrutalButton>
                </div>
              )}
              {myBid > 0 && (
                <div className="bg-yellow-300 border-2 border-black rounded-xl px-4 py-3 text-center">
                  <p className="font-black text-black">✅ Seu lance: {money(myBid)}</p>
                </div>
              )}
            </BrutalCard>
          </motion.div>
        )}

        {/* ── LEILÃO: fila de lendas para o host iniciar (online only) ── */}
        {isOnlineLeilao && !auction && state.isHost && (
          <BrutalCard color={C.creamDark} className="p-4" shadow={3}>
            <p className="font-black text-black text-sm mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>🔨 INICIAR LEILÃO</p>
            <p className="text-black/50 text-xs font-bold mb-3">Escolha uma lenda abaixo e clique em "Leiloar" para abrir os lances a todos.</p>
          </BrutalCard>
        )}

        {isOnlineLeilao && !auction && !state.isHost && (
          <BrutalCard color={C.creamDark} className="p-4 text-center" shadow={2}>
            <p className="text-black/60 font-bold text-sm">⏳ Aguardando o host iniciar o próximo leilão...</p>
          </BrutalCard>
        )}

        {/* ── MERCADO: vender contrato de representação ── */}
        {isOnlineLeilao && !auction && state.clients.length > 0 && (
          <BrutalCard color={C.black} className="p-4" shadow={4}>
            <p className="text-white font-black text-sm mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
              💼 SEUS CONTRATOS — VENDER REPRESENTAÇÃO
            </p>
            <p className="text-white/50 text-xs font-bold mb-3">
              Lance um contrato no mercado. Todos os agentes participam do leilão — você embolsa o maior lance.
            </p>
            <div className="space-y-2">
              {state.clients.map(client => (
                <div key={client.legendId}
                     className="bg-white/10 border-2 border-white/20 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">{FLAG[client.nationality]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {client.nickname}
                    </p>
                    <p className="text-white/50 text-xs font-bold">
                      {client.position} · {money(client.currentValue)} · {client.commissionRate}%
                    </p>
                  </div>
                  <button
                    onClick={() => startRepAuction(client.legendId)}
                    className="border-[2px] border-black rounded-lg px-3 py-1.5 text-xs font-black shrink-0"
                    style={{ backgroundColor: C.yellow, color: '#000' }}
                  >
                    🔨 Leiloar
                  </button>
                </div>
              ))}
            </div>
          </BrutalCard>
        )}

        {/* ── LEILÃO CPU ATIVO: nada mais aparece abaixo ── */}
        {isCpuLeilao && (
          <BrutalCard color={C.creamDark} className="p-4 text-center">
            <p className="text-black/50 text-xs font-bold">
              Digite seu lance e toque em <strong>LANCE E FECHAR</strong> para revelar o resultado na hora.
            </p>
          </BrutalCard>
        )}

        {/* ── CONTEÚDO PRINCIPAL (só quando NÃO há leilão CPU ativo) ── */}
        {!isCpuLeilao && (
          <>
            {/* tip: só no modo livre/draft */}
            {!cpuMarketLocked && (
              <BrutalCard color={C.yellow} className="p-3">
                <p className="text-black text-xs font-bold text-center">
                  ✦ Só VOCÊ enxerga o potencial real. Os olheiros do mundo veem só a nota atual.
                </p>
              </BrutalCard>
            )}

            {/* regiões + olheiros: só no modo livre (não em CPU estruturado) */}
            {!cpuModeActive && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <BrutalTag color={C.green} textColor="#fff">🇧🇷 BRASIL ✓</BrutalTag>
                  {state.purchasedUpgrades.filter(u => u.startsWith('scout-')).map(u => {
                    const r = SCOUT_REGIONS[u.replace('scout-', '')]
                    return r ? <BrutalTag key={u} color={C.teal}>{r.flag} {r.label.toUpperCase()} ✓</BrutalTag> : null
                  })}
                </div>
                {lockedRegions.length > 0 && (
                  <BrutalCard color={C.black} className="p-4">
                    <p className="text-white font-black text-sm mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      🔒 LENDAS ESCONDIDAS LÁ FORA
                    </p>
                    <p className="text-white/60 text-xs font-bold mb-3">
                      Você só conhece o Brasil de cor. Pra achar lendas de outros países, contrate olheiros no Escritório:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {lockedRegions.map(r => (
                        <BrutalTag key={r} color={C.creamDark}>{SCOUT_REGIONS[r].flag} {SCOUT_REGIONS[r].label}</BrutalTag>
                      ))}
                    </div>
                    <BrutalButton color={C.yellow} textColor="#000" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'finance' })}>
                      🔭 Contratar olheiros →
                    </BrutalButton>
                  </BrutalCard>
                )}
              </>
            )}

            {/* 🔥 ALVOS QUENTES — só no modo livre */}
            {!cpuModeActive && hotList.length > 0 && (
              <BrutalCard color={C.orange} className="p-3" shadow={5}>
                <p className="text-white font-black text-sm mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>🔥 ALVOS QUENTES — AJA AGORA</p>
                <div className="space-y-2">
                  {hotList.map(({ legend, weeks }) => {
                    const rar = rarityOf(legend.truePotential)
                    return (
                      <div key={legend.id} onClick={() => openPlayer(legend)}
                           className="bg-white border-2 border-black rounded-lg p-2 flex items-center gap-2 cursor-pointer active:translate-x-[2px] active:translate-y-[2px]">
                        <span className="text-xl">{FLAG[legend.nationality]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black text-sm truncate" style={{ fontFamily: 'Oswald, sans-serif' }}>{rar.emoji} {legend.nickname}</p>
                          <p className="text-[10px] font-black uppercase" style={{ color: rar.color }}>{rar.label}</p>
                        </div>
                        <BrutalTag color={weeks <= 2 ? C.orange : C.yellow} textColor={weeks <= 2 ? '#fff' : '#000'}>⏳ {weeks} sem</BrutalTag>
                      </div>
                    )
                  })}
                </div>
              </BrutalCard>
            )}

            {/* ── CPU MODE: MERCADO FECHADO (entre janelas) ── */}
            {cpuMarketLocked && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <BrutalCard color={C.black} className="p-6 text-center" shadow={6}>
                  <p className="text-5xl mb-3">🔒</p>
                  <p className="font-black text-white text-xl mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>MERCADO FECHADO</p>
                  <p className="text-white/70 text-sm font-bold leading-relaxed mb-4">
                    {state.onlineGameMode === 'draft' && 'No modo Draft, você só pode assinar lendas durante a janela de draft. Avance semanas — a próxima janela abre a cada 4 semanas.'}
                    {state.onlineGameMode === 'leilao' && 'No modo Leilão, lendas são arrematadas em leilões fechados. Aguarde o próximo leilão aparecer.'}
                    {state.onlineGameMode === 'draft-leilao' && 'No modo Draft + Leilão, assinaturas só ocorrem em janelas de draft ou leilões. Avance semanas para a próxima.'}
                  </p>
                  <div className="border-[3px] border-white/30 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-white/50 text-xs font-black uppercase tracking-widest">Próxima janela em</p>
                    <p className="text-white font-black text-2xl mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {state.onlineGameMode === 'draft' || state.onlineGameMode === 'draft-leilao'
                        ? `~${4 - ((state.week - 1) % 4)} semana${4 - ((state.week - 1) % 4) === 1 ? '' : 's'}`
                        : 'Em breve'}
                    </p>
                  </div>
                </BrutalCard>
              </motion.div>
            )}
          </>
        )}

        {!cpuMarketLocked && !isCpuLeilao && pool.length === 0 && (
          <BrutalCard color={C.creamDark} className="p-7 text-center">
            <p className="text-4xl mb-2">🕰️</p>
            <p className="font-black text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>NINGUÉM NOVO ESSA SEMANA</p>
            <p className="text-black/50 text-sm font-medium mt-1">Avance semanas — novas safras de lendas vão surgindo a cada ano.</p>
          </BrutalCard>
        )}

        {!isCpuLeilao && pool.map(legend => {
          const rating = getCurrentRating(legend, state.year)
          const value = getMarketValue(legend, state.year)
          const status = getCurrentStatus(legend, state.year)
          const st = STATUS_LABEL[status]
          const isOpen = selected?.id === legend.id
          const rar = rarityOf(legend.truePotential)
          const isGem = rar.rank >= 3

          return (
            <motion.div key={legend.id} layout>
              <BrutalCard
                color={isOpen ? C.cream : 'white'}
                className="p-4"
                onClick={() => openPlayer(legend)}
                shadow={isGem ? 6 : 4}
              >
                {/* rarity ribbon */}
                <div className="flex items-center justify-between mb-2 -mt-1">
                  <span className="inline-flex items-center gap-1 border-2 border-black rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase"
                        style={{ backgroundColor: rar.color, color: rar.rank >= 3 ? '#000' : '#fff' }}>
                    {rar.emoji} {rar.label}
                  </span>
                  {!state.seenLegendIds.includes(legend.id) && (
                    <BrutalTag color={C.black} textColor="#fff">NOVO</BrutalTag>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{FLAG[legend.nationality]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {legend.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <BrutalTag color={POS_COLOR[legend.position]} textColor="#fff">{legend.position}</BrutalTag>
                      {st && <BrutalTag color={st.color} textColor={status === 'pelada' ? '#fff' : '#000'}>{st.label}</BrutalTag>}
                      {state.reputation < getMinReputationToSign(legend, state.year) && (
                        <BrutalTag color={C.black} textColor="#fff">🔒 REP {getMinReputationToSign(legend, state.year)}+</BrutalTag>
                      )}
                      <span className="text-black/40 text-xs font-bold">{state.year - legend.birthYear}a · {legend.club}</span>
                    </div>
                  </div>
                </div>

                {/* leilão host button on each card */}
                {isOnlineLeilao && state.isHost && !auction && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); startAuction(legend.id) }}
                      className="border-[2px] border-black rounded-lg px-3 py-1 text-xs font-black"
                      style={{ backgroundColor: C.purple, color: '#fff' }}
                    >
                      🔨 Leiloar
                    </button>
                  </div>
                )}

                {/* stat row */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-black/5 border-2 border-black rounded-lg p-2 text-center">
                    <p className="text-black/40 text-[9px] font-black uppercase">Nota hoje</p>
                    <p className="font-black text-black text-lg leading-none mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{rating}</p>
                  </div>
                  <div className="bg-black/5 border-2 border-black rounded-lg p-2 text-center">
                    <p className="text-black/40 text-[9px] font-black uppercase">Valor</p>
                    <p className="font-black text-black text-base leading-none mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(value)}</p>
                  </div>
                  <div className="border-2 border-black rounded-lg p-2 text-center" style={{ backgroundColor: C.yellow }}>
                    <p className="text-black/60 text-[9px] font-black uppercase">Potencial ✦</p>
                    <p className="font-black text-black text-lg leading-none mt-0.5" style={{ fontFamily: 'Oswald, sans-serif' }}>{legend.truePotential}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {/* discovery story */}
                      <div className="mt-3 bg-white border-2 border-black rounded-lg p-3">
                        <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">📍 Onde você o achou</p>
                        <p className="text-black text-xs font-medium leading-relaxed italic">{legend.discoveryStory}</p>
                      </div>
                      {/* future knowledge */}
                      <div className="mt-2 border-2 border-black rounded-lg p-3" style={{ backgroundColor: C.blue }}>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">🔮 O que SÓ você sabe</p>
                        <p className="text-white text-xs font-bold leading-relaxed">{legend.futureKnowledge}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </BrutalCard>
            </motion.div>
          )
        })}
      </div>

      {/* ── SIGNING SHEET ── */}
      <AnimatePresence>
        {selected && !cpuMarketLocked && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-30"
          >
            <div className="max-w-md mx-auto m-3">
              <BrutalCard color={C.cream} className="p-5" shadow={8}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    ASSINAR {selected.nickname.toUpperCase()}
                  </p>
                  <button onClick={() => { setSelected(null); setResult(null) }} className="text-black text-2xl font-black">×</button>
                </div>
                {/* upfront cost breakdown: taxa + luva */}
                {!repBlocked && (
                <div className="border-[3px] border-black rounded-xl p-3 mb-3" style={{ backgroundColor: '#fff' }}>
                  <div className="flex justify-between text-xs font-bold text-black/60">
                    <span>Taxa de exclusividade</span><span>{money(selected.signingFee)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold mt-1" style={{ color: C.orange }}>
                    <span>💰 Luva (entrada)</span><span>{money(selected.luva)}</span>
                  </div>
                  <div className="border-t-2 border-black mt-2 pt-2 flex justify-between items-center">
                    <span className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>TOTAL AGORA</span>
                    <span className="font-black text-black text-lg" style={{ fontFamily: 'Oswald, sans-serif', color: canAffordUpfront ? C.black : C.orange }}>
                      {money(upfrontCost)}
                    </span>
                  </div>
                </div>
                )}
                {!repBlocked && (
                <div className="border-2 border-black rounded-lg p-2.5 mb-3" style={{ backgroundColor: C.yellow }}>
                  <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Por que a luva?</p>
                  <p className="text-black text-xs font-bold italic leading-snug">"{selected.luvaReason}"</p>
                </div>
                )}

                {/* strike warning */}
                {!repBlocked && strikes >= 1 && (
                  <BrutalCard color={C.orange} className="p-2.5 mb-3" shadow={3}>
                    <p className="text-white text-xs font-black">
                      ⚠ ÚLTIMA CHANCE! {selected.nickname} já recusou uma vez. Se recusar de novo, você o perde PRA SEMPRE.
                    </p>
                  </BrutalCard>
                )}

                {/* fame drible risk */}
                {!repBlocked && fameDribleChance > 0.05 && strikes === 0 && (
                  <BrutalCard color={C.black} className="p-2.5 mb-3" shadow={3}>
                    <p className="text-white text-xs font-bold">
                      🎲 {selected.nickname} já tem fama — pode dar um drible e recusar mesmo achando justo (~{Math.round(fameDribleChance * 100)}% de risco).
                    </p>
                  </BrutalCard>
                )}

                {repBlocked ? (
                  <>
                    <BrutalCard color={C.black} className="p-4 text-center">
                      <p className="text-4xl mb-1">🔒</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>ELE NEM TE RECEBE</p>
                      <p className="text-white/80 text-xs font-bold mt-2 leading-relaxed">
                        {selected.nickname} já é {getCurrentStatus(selected, state.year) === 'estrela' ? 'uma estrela' : 'profissional'} e não fala com um empresário desconhecido. Quem é você? Um zé-ninguém sem nome no meio.
                      </p>
                      <div className="border-2 border-white rounded-lg p-2 mt-3" style={{ backgroundColor: C.orange }}>
                        <p className="text-white text-xs font-black">
                          Precisa de REPUTAÇÃO {minRep}+ · você tem {state.reputation}
                        </p>
                      </div>
                      <p className="text-white/60 text-[11px] font-bold mt-2">
                        Construa seu nome: assine jovens, feche negócios e viva momentos de glória. Aí os grandes te procuram.
                      </p>
                    </BrutalCard>
                    <div className="mt-3">
                      <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                        Entendi
                      </BrutalButton>
                    </div>
                  </>
                ) : !result || result.result === 'counter' ? (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-black/60 text-xs font-black uppercase">Sua comissão</span>
                      <span className="font-black text-black text-3xl leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{rate}%</span>
                    </div>
                    <input
                      type="range" min={5} max={30} step={1} value={rate}
                      onChange={e => { setRate(Number(e.target.value)); setResult(null) }}
                      className="w-full h-3 appearance-none cursor-pointer accent-black"
                      style={{ accentColor: C.blue }}
                    />
                    <div className="flex justify-between text-black/40 text-[10px] font-black mt-1">
                      <span>5% GENEROSO</span>
                      <span>30% GANANCIOSO</span>
                    </div>

                    {/* contract length slider */}
                    <div className="flex items-end justify-between mb-2 mt-4">
                      <span className="text-black/60 text-xs font-black uppercase">Tempo de contrato</span>
                      <span className="font-black text-black text-2xl leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>{years} {years === 1 ? 'ano' : 'anos'}</span>
                    </div>
                    <input
                      type="range" min={1} max={6} step={1} value={years}
                      onChange={e => { setYears(Number(e.target.value)); setResult(null) }}
                      className="w-full h-3 appearance-none cursor-pointer"
                      style={{ accentColor: C.purple }}
                    />
                    <div className="flex justify-between text-black/40 text-[10px] font-black mt-1">
                      <span>1 ANO (ele prefere)</span>
                      <span>6 ANOS (te trava)</span>
                    </div>

                    {/* LIVE prediction — você vê a reação antes de oferecer */}
                    {livePrediction && !result && (
                      <div className="mt-3 flex items-center justify-between border-[3px] border-black rounded-xl px-3 py-2"
                           style={{ backgroundColor: livePrediction.color }}>
                        <span className="font-black text-sm" style={{ color: livePrediction.text, fontFamily: 'Oswald, sans-serif' }}>
                          {livePrediction.label}
                        </span>
                        <span className="font-mono text-[10px] font-bold" style={{ color: livePrediction.text }}>
                          aceita até ~{liveMax}%
                        </span>
                      </div>
                    )}

                    {/* counter feedback */}
                    {result?.result === 'counter' && (
                      <BrutalCard color={C.orange} className="p-3 mt-3">
                        <p className="text-white text-xs font-bold">{result.reason}</p>
                      </BrutalCard>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {result?.result === 'counter' ? (
                        <>
                          <BrutalButton color="white" textColor={C.black} onClick={() => { setResult(null) }}>
                            Insistir
                          </BrutalButton>
                          <BrutalButton color={C.green} onClick={acceptCounter}>
                            Topar {result.maxAcceptable}%
                          </BrutalButton>
                        </>
                      ) : (
                        <>
                          <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                            Cancelar
                          </BrutalButton>
                          {isOnlineLeilao && state.isHost && !auction ? (
                            <BrutalButton color={C.purple} textColor="#fff" onClick={() => { startAuction(selected.id); setSelected(null); setResult(null) }}>
                              🔨 Leiloar
                            </BrutalButton>
                          ) : (
                            <BrutalButton
                              color={isOnlineDraft && !myTurn ? '#C9C2AC' : C.blue}
                              textColor={isOnlineDraft && !myTurn ? '#888' : '#fff'}
                              disabled={!canAffordUpfront || (isOnlineDraft && !myTurn)}
                              onClick={tryToSign}
                            >
                              {isOnlineDraft && !myTurn ? `⏳ Vez de ${turnName}` : !canAffordUpfront ? 'Sem grana' : 'Oferecer'}
                            </BrutalButton>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : result.result === 'accept' ? (
                  <BrutalCard color={C.green} className="p-4 text-center">
                    <p className="text-4xl mb-1">🤝</p>
                    <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>FECHOU!</p>
                    <p className="text-white/90 text-xs font-bold mt-1">{result.reason}</p>
                  </BrutalCard>
                ) : result.lost ? (
                  <>
                    <BrutalCard color={C.black} className="p-5 text-center">
                      <p className="text-5xl mb-1">💔</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>PERDIDO PRA SEMPRE</p>
                      <p className="text-white/80 text-xs font-bold mt-1">{result.reason}</p>
                    </BrutalCard>
                    <div className="mt-3">
                      <BrutalButton color={C.orange} textColor="#fff" onClick={() => { setSelected(null); setResult(null) }}>
                        Engolir o prejuízo
                      </BrutalButton>
                    </div>
                  </>
                ) : (
                  <>
                    <BrutalCard color={C.orange} className="p-4 text-center">
                      <p className="text-4xl mb-1">🚫</p>
                      <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>RECUSOU</p>
                      <p className="text-white/90 text-xs font-bold mt-1">{result.reason}</p>
                      <p className="text-white/70 text-[11px] font-black mt-2 uppercase">⚠ Recusar de novo = perde ele pra sempre</p>
                    </BrutalCard>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <BrutalButton color="white" textColor={C.black} onClick={() => { setSelected(null); setResult(null) }}>
                        Recuar
                      </BrutalButton>
                      <BrutalButton color={C.blue} onClick={() => { setRate(Math.max(5, result.maxAcceptable)); setResult(null) }}>
                        Baixar p/ {result.maxAcceptable}%
                      </BrutalButton>
                    </div>
                  </>
                )}
              </BrutalCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✨ RARITY REVEAL — the gacha pop when you discover a talent */}
      <AnimatePresence>
        {reveal && (() => {
          const rar = rarityOf(reveal.truePotential)
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              <motion.div
                initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 1.3, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 220 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-7xl mb-2"
                  style={{ filter: `drop-shadow(0 0 16px ${rar.color})` }}
                >
                  {rar.emoji}
                </motion.div>
                <div className="border-[3px] border-black rounded-xl px-5 py-2 inline-block"
                     style={{ backgroundColor: rar.color, boxShadow: `5px 5px 0 0 ${C.black}` }}>
                  <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif', color: rar.rank >= 3 ? '#000' : '#fff' }}>
                    {rar.label}!
                  </p>
                </div>
                <p className="text-white font-black text-lg mt-3" style={{ fontFamily: 'Oswald, sans-serif' }}>{reveal.nickname}</p>
                <p className="text-white/70 text-xs font-bold">descoberto · potencial {reveal.truePotential}</p>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* signed toast */}
      <AnimatePresence>
        {justSigned && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-20 left-0 right-0 z-40 flex justify-center px-4"
          >
            <BrutalPill color={C.green} textColor="#fff" className="!text-sm !px-4 !py-2">
              ✓ {justSigned} agora é seu cliente!
            </BrutalPill>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RESULTADO DO LEILÃO CPU (todos os lances revelados) ── */}
      <AnimatePresence>
        {bidResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm">
              <BrutalCard color={C.cream} className="p-5" shadow={8}>
                <div className="text-center mb-3">
                  <div className="text-5xl mb-2">{bidResult.youWon ? '🏆' : '🔨'}</div>
                  <BrutalPill color={bidResult.youWon ? C.green : C.orange} textColor="#fff">
                    {bidResult.youWon ? 'VOCÊ VENCEU O LEILÃO!' : 'LEILÃO ENCERRADO'}
                  </BrutalPill>
                  <h2 className="font-black text-black text-xl mt-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {bidResult.legendNickname}
                  </h2>
                  {!bidResult.youWon && (
                    <p className="text-black/60 text-sm font-bold mt-1">
                      {bidResult.winnerName} levou por {money(bidResult.winnerAmount)}
                    </p>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  {bidResult.allBids.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3 py-2">
                      <span className="text-sm">{b.isYou ? '👤' : '🕴️'}</span>
                      <span className="flex-1 font-black text-black text-sm truncate">{b.name}</span>
                      {b.amount > 0 ? (
                        <span className={`font-black text-sm ${b.isWinner ? 'text-black' : 'text-black/50'}`}>
                          {b.isWinner ? '👑 ' : ''}{money(b.amount)}
                        </span>
                      ) : (
                        <span className="text-black/40 text-xs font-bold">sem lance</span>
                      )}
                    </div>
                  ))}
                </div>
                <BrutalButton color={C.black} textColor="#fff" onClick={() => { setBidResult(null); setBidAmount(0); dispatch({ type: 'SET_SCREEN', screen: 'dashboard' }) }}>
                  Ok →
                </BrutalButton>
              </BrutalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
