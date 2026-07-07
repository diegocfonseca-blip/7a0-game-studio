import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Card, FormationKey, Manager, Sector, Tactic, WonCard } from './types'
import { FORMATIONS, SECTORS, SECTOR_LABEL } from './types'
import { useEsc, openSlots, totalHoles, sortedTable, START_MONEY } from './store'

// ─── estilo base (neubrutalista, igual ao resto do estúdio) ──────────
const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const RED = '#E8503A'
const PURPLE = '#7C3AED'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }

function Box({ children, bg = '#fff', className = '', shadow = 4 }: { children: React.ReactNode; bg?: string; className?: string; shadow?: number }) {
  return (
    <div className={`border-[3px] border-black rounded-2xl ${className}`} style={{ backgroundColor: bg, boxShadow: `${shadow}px ${shadow}px 0 0 ${INK}` }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, bg = GOLD, disabled = false, className = '' }: { children: React.ReactNode; onClick: () => void; bg?: string; disabled?: boolean; className?: string }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { x: 2, y: 2 }}
      onClick={onClick}
      disabled={disabled}
      className={`border-[3px] border-black rounded-xl px-4 py-3 font-black uppercase text-sm tracking-wide ${disabled ? 'opacity-40' : ''} ${className}`}
      style={{ backgroundColor: bg, boxShadow: disabled ? 'none' : `4px 4px 0 0 ${INK}`, ...OSWALD }}
    >
      {children}
    </motion.button>
  )
}

function Shell({ children, bar }: { children: React.ReactNode; bar?: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: CREAM }}>
      {bar && (
        <div className="sticky top-0 z-20 border-b-[3px] border-black px-4 py-2.5" style={{ backgroundColor: '#fff' }}>
          {bar}
        </div>
      )}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">{children}</div>
    </div>
  )
}

// ─── campinho ────────────────────────────────────────────────────────
function Campinho({ m, small = false }: { m: Manager; small?: boolean }) {
  const rows: { pos: Sector; cards: (WonCard | null)[] }[] = useMemo(() => {
    return ['ATA', 'MEI', 'ZAG', 'LAT', 'GOL'].map(p => {
      const pos = p as Sector
      const have = m.squad.filter(c => c.pos === pos)
      const slots = FORMATIONS[m.formation][pos]
      const cards: (WonCard | null)[] = []
      for (let i = 0; i < slots; i++) cards.push(have[i] ?? null)
      return { pos, cards }
    })
  }, [m.squad, m.formation])

  return (
    <div className="border-[3px] border-black rounded-2xl overflow-hidden" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
      <div className="px-3 py-2 flex flex-col gap-2" style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)` }}>
        {rows.map(row => (
          <div key={row.pos} className="flex justify-center gap-2">
            {row.cards.map((c, i) => (
              <div
                key={i}
                className={`border-2 border-black rounded-lg text-center ${small ? 'px-1 py-0.5 min-w-[52px]' : 'px-2 py-1 min-w-[72px]'}`}
                style={{ backgroundColor: c ? '#fff' : 'rgba(255,255,255,0.25)' }}
              >
                <p className="text-[9px] font-black" style={{ color: c ? RED : '#fff' }}>{row.pos}</p>
                <p className={`font-bold leading-tight ${small ? 'text-[9px]' : 'text-[11px]'}`} style={{ color: c ? INK : 'rgba(255,255,255,0.85)' }}>
                  {c ? c.name : 'Vazio'}
                </p>
                {c && !small && <p className="text-[8px] text-black/50 font-medium">{c.club} {c.year}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CardFace({ c, big = false }: { c: Card; big?: boolean }) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: INK, color: '#fff' }}>{c.pos}</span>
        <p className={`font-black ${big ? 'text-2xl' : 'text-base'}`} style={OSWALD}>{c.name}</p>
      </div>
      <p className={`${big ? 'text-sm' : 'text-xs'} font-semibold text-black/60 mt-0.5`}>{c.club} · {c.year}</p>
    </div>
  )
}

// ─── INTRO ───────────────────────────────────────────────────────────
export function EscIntro() {
  const { dispatch } = useEsc()
  return (
    <Shell>
      <div className="text-center pt-10">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-xs font-black uppercase" style={{ backgroundColor: GOLD, boxShadow: `3px 3px 0 0 ${INK}` }}>
          7A0 GAME STUDIO
        </span>
        <h1 className="font-black text-5xl mt-4" style={OSWALD}>LEILÃO LEGENDS 38</h1>
        <p className="mt-2 font-semibold text-black/60">Leilão às cegas. Níveis ocultos. 38 rodadas pra provar quem entende de bola.</p>
      </div>
      <Box bg="#fff" className="p-5 space-y-3">
        <p className="font-bold text-sm">⚒️ <b>O Pregão:</b> 5 rodadas de leilão cego — goleiros, laterais, zagueiros, meio e ataque. Ninguém vê o lance de ninguém até bater o martelo.</p>
        <p className="font-bold text-sm"><b>🎭 Níveis ocultos:</b> você dá lance no <i>nome</i>. Os níveis só aparecem na Cerimônia da Revelação — e mudam a cada rodada dentro da faixa de cada jogador. O Obina tem dias.</p>
        <p className="font-bold text-sm">🏆 <b>A prova:</b> os mesmos 11 disputam um campeonato de 38 rodadas contra a sala inteira. Sem lesão. Sem desculpa.</p>
      </Box>
      <div className="space-y-3">
        <Btn onClick={() => dispatch({ type: 'GO_SETUP' })} className="w-full text-lg">🤖 JOGAR VS CPU</Btn>
        <Btn onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="w-full text-lg" bg={GREEN}>
          <span className="text-white">👥 JOGAR ONLINE (SALA)</span>
        </Btn>
      </div>
    </Shell>
  )
}

// ─── SETUP ───────────────────────────────────────────────────────────
export function EscSetup() {
  const { dispatch } = useEsc()
  const [name, setName] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [rivals, setRivals] = useState(5)
  return (
    <Shell>
      <h2 className="font-black text-3xl pt-6" style={OSWALD}>MONTE SUA SALA</h2>
      <Box className="p-4 space-y-4">
        <div>
          <p className="text-xs font-black uppercase mb-1">Nome do seu time</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex.: Bagres do Asfalto"
            className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold bg-white"
          />
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">Formação (travada antes do pregão)</p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(FORMATIONS) as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: formation === f ? GOLD : '#fff', boxShadow: formation === f ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase mb-1">Rivais na sala (CPUs)</p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 7, 9].map(n => (
              <button key={n} onClick={() => setRivals(n)}
                className="border-[3px] border-black rounded-xl py-2 font-black text-sm"
                style={{ backgroundColor: rivals === n ? PURPLE : '#fff', color: rivals === n ? '#fff' : INK, boxShadow: rivals === n ? `3px 3px 0 0 ${INK}` : 'none', ...OSWALD }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs font-semibold text-black/50">💰 Todo técnico começa com {START_MONEY} moedas. O que sobrar no fim do leilão <b>evapora</b> — gaste com sabedoria (ou sem).</p>
      </Box>
      <Btn onClick={() => dispatch({ type: 'START', teamName: name, formation, rivals })} className="w-full text-lg" bg={GREEN}>
        <span className="text-white">ABRIR O PREGÃO 🔨</span>
      </Btn>
    </Shell>
  )
}

// ─── LEILÃO: envelope ────────────────────────────────────────────────
function AuctionBar() {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  return (
    <div className="flex items-center justify-between max-w-xl mx-auto">
      <div className="flex gap-1.5">
        {SECTORS.map((p, i) => (
          <span key={p} className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black"
            style={{ backgroundColor: i < state.sectorIdx ? INK : i === state.sectorIdx ? GOLD : '#fff', color: i < state.sectorIdx ? '#fff' : INK }}>
            {p}
          </span>
        ))}
      </div>
      <span className="font-black text-sm" style={OSWALD}>💰 {you.money}</span>
    </div>
  )
}

export function EscAuction() {
  const { state } = useEsc()
  const isEnvelope = state.phase === 'envelope' || state.phase === 'resq_envelope'
  return isEnvelope ? <Envelope /> : <Reveal />
}

function Envelope() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const pos = SECTORS[state.sectorIdx]
  const rescue = state.phase === 'resq_envelope'
  const [bids, setBids] = useState<Record<string, number>>({})
  const total = Object.values(bids).reduce((s, v) => s + v, 0)
  const myOpen = openSlots(you, pos)
  const canBid = myOpen > 0 && you.money > 0
  const online = state.onlineMode === 'online'
  const iSubmitted = state.submitted.includes(you.id)
  const humanBidders = state.managers.filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
  const waitingFor = humanBidders.filter(m => !state.submitted.includes(m.id))

  // já lacrei (online): tela de espera pelos outros técnicos
  if (online && iSubmitted) {
    return (
      <Shell bar={<AuctionBar />}>
        <div className="pt-10 text-center space-y-3">
          <div className="text-5xl">🔒</div>
          <h2 className="font-black text-2xl" style={OSWALD}>ENVELOPE LACRADO</h2>
          <p className="font-semibold text-black/60">Aguardando os outros técnicos lacrarem…</p>
          <Box className="p-3 mt-2 text-left">
            {humanBidders.map(m => (
              <p key={m.id} className="text-sm font-bold flex justify-between">
                <span>{m.isHuman && m.id === you.id ? '🫵 Você' : m.teamName}</span>
                <span>{state.submitted.includes(m.id) ? '✅ lacrou' : '⏳ pensando'}</span>
              </p>
            ))}
          </Box>
        </div>
      </Shell>
    )
  }

  function setBid(id: string, v: number) {
    setBids(prev => {
      const next = { ...prev, [id]: Math.max(0, v) }
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  const cards = [...state.currentCards].sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name))

  return (
    <Shell bar={<AuctionBar />}>
      <div className="pt-1">
        <h2 className="font-black text-3xl" style={OSWALD}>
          {rescue ? '⚡ REPESCAGEM · ' : '🔨 '}{SECTOR_LABEL[pos].toUpperCase()}
        </h2>
        <p className="text-sm font-semibold text-black/60">
          {rescue
            ? 'Sobras do setor, última chance de pagar por elas. Só quem ficou com buraco participa.'
            : 'Lance cego: distribua suas moedas em segredo. Ninguém vê nada até a revelação.'}
          {' '}Suas vagas no setor: <b>{myOpen}</b>.
        </p>
      </div>

      {!canBid && (
        <Box bg="#FFE9B0" className="p-3">
          <p className="text-sm font-bold">{myOpen === 0 ? 'Setor completo — você só assiste esta rodada.' : 'Sem dinheiro — resta torcer pelo Monte Final.'}</p>
        </Box>
      )}

      <div className="space-y-2">
        {cards.map(c => (
          <Box key={c.id} className="p-3 flex items-center justify-between gap-2">
            <CardFace c={c} />
            {canBid && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setBid(c.id, (bids[c.id] ?? 0) - 1)} className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white">−</button>
                <span className="w-9 text-center font-black" style={OSWALD}>{bids[c.id] ?? 0}</span>
                <button
                  onClick={() => total < you.money && setBid(c.id, (bids[c.id] ?? 0) + 1)}
                  className="border-2 border-black rounded-lg w-8 h-8 font-black"
                  style={{ backgroundColor: GOLD }}>+</button>
              </div>
            )}
          </Box>
        ))}
      </div>

      <Box bg="#fff" className="p-3 flex items-center justify-between">
        <p className="font-black" style={OSWALD}>ENVELOPE: {total} / {you.money}</p>
        <Btn onClick={() => { dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: Object.entries(bids).map(([cardId, amount]) => ({ cardId, amount })) }); setBids({}) }} bg={RED}>
          <span className="text-white">LACRAR 🔒</span>
        </Btn>
      </Box>
      {online && waitingFor.length > 0 && (
        <p className="text-center text-xs font-bold text-black/50">Faltam lacrar: {waitingFor.map(m => m.teamName).join(', ')}</p>
      )}

      <Campinho m={you} />
      <RivalsStrip />
    </Shell>
  )
}

// ─── LEILÃO: revelação ───────────────────────────────────────────────
function Reveal() {
  const { state, dispatch } = useEsc()
  const item = state.revealQueue[state.revealIdx]
  const you = state.managers[state.youIdx]
  if (!item) return null
  const winnerMgr = item.winner !== null ? state.managers.find(m => m.id === item.winner) : null
  const isLast = state.revealIdx >= state.revealQueue.length - 1
  const online = state.onlineMode === 'online'
  const canDrive = !online || state.isHost

  return (
    <Shell bar={<AuctionBar />}>
      <p className="text-center text-xs font-black uppercase text-black/50 pt-1">
        Revelação {state.revealIdx + 1} / {state.revealQueue.length} · pote crescente
      </p>
      <motion.div key={item.card.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Box bg={item.card.fame >= 5 ? GOLD : '#fff'} className="p-5" shadow={6}>
          <CardFace c={item.card} big />
          <div className="mt-4 space-y-1.5">
            {item.bids.length === 0 && (
              <p className="font-bold text-black/50">Nenhum lance. Vai pro Monte Final. 🪣</p>
            )}
            {item.bids.map((b, i) => {
              const m = state.managers.find(x => x.id === b.mgr)!
              const voided = item.voided.includes(b.mgr)
              const isWinner = item.winner === b.mgr
              return (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.25 }}
                  className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: isWinner ? GREEN : voided ? '#ddd' : '#fff' }}>
                  <p className="font-bold text-sm" style={{ color: isWinner ? '#fff' : INK }}>
                    {m.isHuman ? '🫵 Você' : m.name}{voided ? ' · anulado (setor cheio)' : ''}
                  </p>
                  <p className="font-black" style={{ ...OSWALD, color: isWinner ? '#fff' : INK }}>{b.amount}</p>
                </motion.div>
              )
            })}
          </div>
          {winnerMgr && (
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: item.bids.length * 0.25 + 0.2 }}
              className="mt-3 text-center font-black text-lg" style={OSWALD}>
              🔨 VENDIDO {winnerMgr.isHuman ? 'PRA VOCÊ' : `pro ${winnerMgr.teamName}`} por {item.paid}!
            </motion.p>
          )}
        </Box>
      </motion.div>
      {canDrive ? (
        <div className="flex gap-2">
          <Btn onClick={() => dispatch({ type: 'ADVANCE_REVEAL' })} className="flex-1">
            {isLast ? 'FECHAR SETOR ➜' : 'PRÓXIMA CARTA ➜'}
          </Btn>
          {!isLast && !online && (
            <Btn bg="#fff" onClick={() => { for (let i = state.revealIdx; i < state.revealQueue.length; i++) dispatch({ type: 'ADVANCE_REVEAL' }) }}>
              PULAR ⏭
            </Btn>
          )}
        </div>
      ) : (
        <p className="text-center text-sm font-bold text-black/55 py-2">🔨 O host está conduzindo a revelação…</p>
      )}
      <Campinho m={you} small />
    </Shell>
  )
}

function RivalsStrip() {
  const { state } = useEsc()
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/50 mb-1.5">A sala</p>
      <div className="grid grid-cols-2 gap-2">
        {state.managers.filter(m => !m.isHuman).map(m => (
          <Box key={m.id} className="p-2.5" shadow={3}>
            <p className="font-black text-sm truncate" style={OSWALD}>{m.teamName}</p>
            <p className="text-[11px] font-semibold text-black/55">{m.formation} · 💰 {m.money} · {11 - totalHoles(m)}/11</p>
            <p className="text-[10px] font-medium text-black/45 truncate">
              {m.squad.slice(-3).map(c => c.name).join(', ') || 'ainda sem contratações'}
            </p>
          </Box>
        ))}
      </div>
    </div>
  )
}

// ─── MONTE FINAL ─────────────────────────────────────────────────────
export function EscMonte() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const isYourTurn = state.monteOrder[state.monteIdx] === you.id && totalHoles(you) > 0
  const valid = state.monte.filter(c => openSlots(you, c.pos) > 0)
  return (
    <Shell bar={<AuctionBar />}>
      <h2 className="font-black text-3xl pt-1" style={OSWALD}>🪣 MONTE FINAL</h2>
      <p className="text-sm font-semibold text-black/60">
        As sobras do pregão, de graça. Quem tem mais buracos escolhe primeiro, em serpente. Seus buracos: <b>{totalHoles(you)}</b>.
      </p>
      {isYourTurn ? (
        <div className="space-y-2">
          <Box bg={GOLD} className="p-3"><p className="font-black text-center" style={OSWALD}>SUA VEZ — escolha uma carta</p></Box>
          {valid.map(c => (
            <Box key={c.id} className="p-3 flex items-center justify-between">
              <CardFace c={c} />
              <Btn onClick={() => dispatch({ type: 'MONTE_PICK', mgrId: you.id, cardId: c.id })} bg={GREEN}><span className="text-white">PEGAR</span></Btn>
            </Box>
          ))}
        </div>
      ) : (
        <Box className="p-4"><p className="font-bold text-center">Aguardando a serpente chegar em você…</p></Box>
      )}
      <Campinho m={you} />
    </Shell>
  )
}

// ─── CERIMÔNIA DA REVELAÇÃO ──────────────────────────────────────────
export function EscCerimonia() {
  const { state, dispatch } = useEsc()
  const [idx, setIdx] = useState(0)
  const m = state.managers[idx]
  const isLastMgr = idx >= state.managers.length - 1

  // achados e micos da sala inteira
  const all = state.managers.flatMap(mg => mg.squad.map(c => ({ mg, c, mid: (c.lo + c.hi) / 2 })))
  const paid = all.filter(x => x.c.paid > 0)
  const bestDeal = paid.length ? [...paid].sort((a, b) => (b.mid / b.c.paid) - (a.mid / a.c.paid))[0] : null
  const worstDeal = paid.length ? [...paid].sort((a, b) => (b.c.paid - b.mid) - (a.c.paid - a.mid))[0] : null

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-3xl" style={OSWALD}>🎭 CERIMÔNIA DA REVELAÇÃO</h2>
        <p className="text-sm font-semibold text-black/60">As faixas de nível abrem. Agora todo mundo descobre o que comprou.</p>
      </div>
      <Box bg={m.isHuman ? GOLD : '#fff'} className="p-4" shadow={6}>
        <p className="font-black text-xl" style={OSWALD}>{m.isHuman ? `🫵 ${m.teamName}` : m.teamName} <span className="text-sm font-bold text-black/50">({m.formation})</span></p>
        <div className="mt-2 space-y-1.5">
          {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => (
            <div key={c.id} className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5 bg-white">
              <div>
                <p className="font-bold text-sm">{c.pos} · {c.name} <span className="text-black/40 text-xs">({c.club} {c.year})</span></p>
                <p className="text-[10px] font-semibold text-black/45">{c.via === 'monte' ? 'monte (grátis)' : c.via === 'repescagem' ? `repescagem · pagou ${c.paid}` : `leilão · pagou ${c.paid}`}</p>
              </div>
              <motion.span initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ delay: 0.15 }}
                className="border-2 border-black rounded-lg px-2 py-1 font-black text-sm"
                style={{ backgroundColor: (c.lo + c.hi) / 2 >= 85 ? GOLD : (c.lo + c.hi) / 2 >= 70 ? '#C9F0D4' : '#f3d1cb', ...OSWALD }}>
                {c.lo}–{c.hi}
              </motion.span>
            </div>
          ))}
        </div>
      </Box>
      {isLastMgr && bestDeal && worstDeal && (
        <Box className="p-4 space-y-1.5">
          <p className="font-black text-sm" style={OSWALD}>🏅 ACHADO DO PREGÃO: {bestDeal.c.name} ({bestDeal.c.lo}–{bestDeal.c.hi}) por {bestDeal.c.paid} — {bestDeal.mg.teamName}</p>
          <p className="font-black text-sm" style={OSWALD}>🐴 MICO DO PREGÃO: {worstDeal.c.name} ({worstDeal.c.lo}–{worstDeal.c.hi}) por {worstDeal.c.paid} — {worstDeal.mg.teamName}</p>
        </Box>
      )}
      {isLastMgr && state.onlineMode === 'online' && !state.isHost ? (
        <p className="text-center text-sm font-bold text-black/55 py-2">🔨 Aguardando o host começar o campeonato…</p>
      ) : (
        <Btn className="w-full text-lg" bg={isLastMgr ? GREEN : GOLD}
          onClick={() => { if (isLastMgr) dispatch({ type: 'FINISH_CEREMONY' }); else setIdx(idx + 1) }}>
          <span style={{ color: isLastMgr ? '#fff' : INK }}>{isLastMgr ? 'COMEÇAR O CAMPEONATO 🏆' : 'PRÓXIMO TIME ➜'}</span>
        </Btn>
      )}
    </Shell>
  )
}

// ─── TEMPORADA ───────────────────────────────────────────────────────
const TACTIC_LABEL: Record<Tactic, string> = { retranca: '🧱 Retranca', equilibrio: '⚖️ Equilíbrio', ataque: '🔥 Ataque' }

export function EscSeason() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const online = state.onlineMode === 'online'
  const canAdvance = !online || state.isHost
  const myTactic = state.tactics[you.id] ?? 'equilibrio'
  const table = sortedTable(state.league)
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const fixture = state.round < 38 ? state.fixtures[state.round].find(([h, a]) => h === you.id || a === you.id) : undefined
  const opp = fixture ? state.league.find(t => t.id === (fixture[0] === you.id ? fixture[1] : fixture[0])) : undefined
  const myLast = state.lastResults.find(r => r.homeId === you.id || r.awayId === you.id)

  return (
    <Shell bar={
      <div className="flex items-center justify-between max-w-xl mx-auto">
        <span className="font-black text-sm" style={OSWALD}>RODADA {Math.min(state.round + 1, 38)}/38</span>
        <span className="font-black text-sm" style={OSWALD}>{youPos}º · {table[youPos - 1]?.pts ?? 0} pts</span>
      </div>
    }>
      {myLast && <MatchCard r={myLast} />}

      {fixture && opp && (
        <Box className="p-4 space-y-3">
          <p className="font-black text-lg" style={OSWALD}>
            PRÓXIMO: {fixture[0] === you.id ? `${you.teamName} × ${opp.name}` : `${opp.name} × ${you.teamName}`}
            <span className="text-xs text-black/50"> {fixture[0] === you.id ? '(em casa)' : '(fora)'}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TACTIC_LABEL) as Tactic[]).map(t => (
              <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: you.id, tactic: t })}
                className="border-[3px] border-black rounded-xl py-2 text-xs font-black"
                style={{ backgroundColor: myTactic === t ? GOLD : '#fff', boxShadow: myTactic === t ? `3px 3px 0 0 ${INK}` : 'none' }}>
                {TACTIC_LABEL[t]}
              </button>
            ))}
          </div>
          {canAdvance ? (
            <div className="flex gap-2">
              <Btn onClick={() => dispatch({ type: 'PLAY_ROUND' })} bg={GREEN} className="flex-1"><span className="text-white">JOGAR RODADA ▶</span></Btn>
              <Btn onClick={() => dispatch({ type: 'SIM_MANY', count: 5 })} bg="#fff">+5</Btn>
              <Btn onClick={() => dispatch({ type: 'SIM_MANY', count: 38 - state.round })} bg="#fff">FIM ⏭</Btn>
            </div>
          ) : (
            <p className="text-center text-sm font-bold text-black/55 py-2">Escolha sua tática. O host puxa a rodada. ⏳</p>
          )}
          <p className="text-[11px] font-semibold text-black/45">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
        </Box>
      )}

      {state.news.length > 0 && (
        <Box bg="#FFF6DC" className="p-3 space-y-1">
          {state.news.slice(0, 4).map((n, i) => <p key={i} className="text-xs font-bold">{n}</p>)}
        </Box>
      )}

      <TableBox highlight={you.id} />
      <Campinho m={you} small />
    </Shell>
  )
}

function MatchCard({ r }: { r: { homeId: number; awayId: number; hg: number; ag: number; highlights: { min: number; text: string }[] } }) {
  const { state } = useEsc()
  const h = state.league.find(t => t.id === r.homeId)!, a = state.league.find(t => t.id === r.awayId)!
  return (
    <Box bg="#fff" className="p-4" shadow={6}>
      <p className="text-center font-black text-2xl" style={OSWALD}>{h.name} {r.hg} × {r.ag} {a.name}</p>
      <div className="mt-2 space-y-0.5">
        {r.highlights.map((hl, i) => <p key={i} className="text-xs font-semibold text-black/60">{hl.min}' {hl.text}</p>)}
        {r.highlights.length === 0 && <p className="text-xs text-center font-semibold text-black/40">Jogo truncado, sem gols pra contar.</p>}
      </div>
    </Box>
  )
}

function TableBox({ highlight }: { highlight: number }) {
  const { state } = useEsc()
  const table = sortedTable(state.league)
  return (
    <Box className="p-3 overflow-x-auto">
      <p className="font-black text-sm mb-2" style={OSWALD}>TABELA</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/45 font-black">
            <th className="pr-1">#</th><th>Time</th><th className="text-center">P</th><th className="text-center">V</th><th className="text-center">E</th><th className="text-center">D</th><th className="text-center">SG</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => {
            const isMgr = state.managers.some(m => m.id === t.id)
            return (
              <tr key={t.id} className="border-t border-black/10 font-semibold"
                style={{ backgroundColor: t.id === highlight ? GOLD : undefined, fontWeight: isMgr ? 800 : 500 }}>
                <td className="pr-1">{i + 1}</td>
                <td className="truncate max-w-[130px]">{isMgr ? '👤 ' : ''}{t.name}</td>
                <td className="text-center font-black">{t.pts}</td>
                <td className="text-center">{t.w}</td><td className="text-center">{t.d}</td><td className="text-center">{t.l}</td>
                <td className="text-center">{t.gf - t.ga}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Box>
  )
}

// ─── FIM ─────────────────────────────────────────────────────────────
export function EscEnd() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const table = sortedTable(state.league)
  const champ = table[0]
  const youPos = table.findIndex(t => t.id === you.id) + 1
  const youWon = champ.id === you.id
  return (
    <Shell>
      <div className="text-center pt-8">
        <p className="text-6xl">{youWon ? '🏆' : youPos <= 4 ? '🥈' : youPos >= 17 ? '🪦' : '📻'}</p>
        <h2 className="font-black text-4xl mt-2" style={OSWALD}>{youWon ? 'CAMPEÃO!' : `${youPos}º LUGAR`}</h2>
        <p className="font-semibold text-black/60 mt-1">
          {youWon ? 'O pregão foi seu, o campeonato foi seu. Resenha eterna.' : `Campeão: ${champ.name}. ${youPos >= 17 ? 'Rebaixado. O leilão cobra caro.' : 'Ano que vem tem pregão de novo.'}`}
        </p>
      </div>
      <TableBox highlight={you.id} />
      <Btn onClick={() => dispatch({ type: 'NEW_GAME' })} className="w-full text-lg">NOVO PREGÃO 🔨</Btn>
    </Shell>
  )
}
