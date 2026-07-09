import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Card, FormationKey, Manager, Sector, Tactic, WonCard } from './types'
import { FORMATIONS, SECTORS, SECTOR_LABEL } from './types'
import { useEsc, openSlots, totalHoles, sortedTable, topScorers, START_MONEY, MONTE_SECONDS, BATCH_SIZE } from './store'
import { supabase } from '../lib/supabase'
import { CATALOG, BIOS } from './data'

const CATALOG_TOTAL = Object.values(CATALOG).reduce((s, arr) => s + arr.length, 0)

const GAME_URL = 'https://diegocfonseca-blip.github.io/7a0-game-studio/leilao-legends-38/'

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
  // O CSS base do estúdio usa texto claro (creme). Como este jogo é todo em
  // fundos claros, forçamos texto escuro por padrão aqui — quem precisa de
  // branco (botões/fundos escuros) já define a cor explicitamente.
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: CREAM, color: INK }}>
      {bar && (
        <div className="sticky top-0 z-20 border-b-[3px] border-black px-4 py-2.5" style={{ backgroundColor: '#fff', color: INK }}>
          {bar}
        </div>
      )}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">{children}</div>
    </div>
  )
}

// ─── campinho ────────────────────────────────────────────────────────
// linhas top→bottom: ATA · MEI · defesa (LAT-esq · ZAG · ZAG · LAT-dir) · GOL
function Campinho({ m, small = false }: { m: Manager; small?: boolean }) {
  const rows: { key: string; slots: { pos: Sector; card: WonCard | null }[] }[] = useMemo(() => {
    const filled = (p: Sector) => m.squad.filter(c => c.pos === p)
    const buildRow = (p: Sector): { pos: Sector; card: WonCard | null }[] => {
      const have = filled(p)
      const slots = FORMATIONS[m.formation][p]
      return Array.from({ length: slots }, (_, i) => ({ pos: p, card: have[i] ?? null }))
    }
    const lats = buildRow('LAT') // [esquerda, direita] quando existirem
    const zags = buildRow('ZAG')
    const defense: { pos: Sector; card: WonCard | null }[] = []
    if (lats[0]) defense.push(lats[0])
    defense.push(...zags)
    if (lats[1]) defense.push(lats[1])
    return [
      { key: 'ATA', slots: buildRow('ATA') },
      { key: 'MEI', slots: buildRow('MEI') },
      { key: 'DEF', slots: defense },
      { key: 'GOL', slots: buildRow('GOL') },
    ]
  }, [m.squad, m.formation])

  return (
    <div className="border-[3px] border-black rounded-2xl overflow-hidden" style={{ boxShadow: `4px 4px 0 0 ${INK}` }}>
      <div className="px-3 py-2 flex flex-col gap-2" style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)` }}>
        {rows.map(row => (
          <div key={row.key} className="flex justify-center gap-2">
            {row.slots.map((slot, i) => (
              <div
                key={i}
                className={`border-2 border-black rounded-lg text-center ${small ? 'px-1 py-0.5 min-w-[52px]' : 'px-2 py-1 min-w-[72px]'}`}
                style={{ backgroundColor: slot.card ? '#fff' : 'rgba(255,255,255,0.25)' }}
              >
                <p className="text-[9px] font-black" style={{ color: slot.card ? RED : '#fff' }}>{slot.pos}</p>
                <p className={`font-bold leading-tight ${small ? 'text-[9px]' : 'text-[11px]'}`} style={{ color: slot.card ? INK : 'rgba(255,255,255,0.95)' }}>
                  {slot.card ? slot.card.name : 'Vazio'}
                </p>
                {slot.card && !small && <p className="text-[8px] text-black/60 font-medium">{slot.card.club} {slot.card.year}</p>}
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
          D7 STUDIO
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
        <p className="text-xs font-semibold text-black/70">💰 Todo técnico começa com {START_MONEY} moedas. O que sobrar no fim do leilão <b>evapora</b> — gaste com sabedoria (ou sem).</p>
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
  // "enviei mas ainda não veio confirmação do host" — sem isso, se o host
  // demorar (ou tiver caído), o jogador ficava vendo os lances dele
  // somem sem nunca lacrar de verdade: um clique em LACRAR sempre limpava
  // os valores na hora, mesmo quando o envio pro host não tinha efeito.
  const [pending, setPending] = useState(false)
  const pendingBidsRef = useRef<{ cardId: string; amount: number }[]>([])
  const total = Object.values(bids).reduce((s, v) => s + v, 0)
  const myOpen = openSlots(you, pos)
  const canBid = myOpen > 0 && you.money > 0
  const online = state.onlineMode === 'online'
  const iSubmitted = state.submitted.includes(you.id)
  const humanBidders = state.managers.filter(m => m.isHuman && openSlots(m, pos) > 0 && m.money > 0)
  const waitingFor = humanBidders.filter(m => !state.submitted.includes(m.id))

  // ─── cronômetro de 45s ───────────────────────────────────────────
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])
  const remaining = state.phaseDeadline ? Math.max(0, Math.ceil((state.phaseDeadline - now) / 1000)) : 45

  function seal() {
    const payload = Object.entries(bids).map(([cardId, amount]) => ({ cardId, amount }))
    pendingBidsRef.current = payload
    setPending(true)
    dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: payload })
  }

  // confirmação chegou (o host aplicou e devolveu o estado): só agora limpa
  useEffect(() => {
    if (iSubmitted) { setBids({}); setPending(false) }
  }, [iSubmitted])

  // enquanto não confirma, reenvia de tempos em tempos — cobre o host que
  // ficou um instante sem conexão (app em segundo plano etc.) e reconecta
  useEffect(() => {
    if (!online || !pending || iSubmitted) return
    const iv = setInterval(() => {
      dispatch({ type: 'SUBMIT_ENVELOPE', mgrId: you.id, bids: pendingBidsRef.current })
    }, 4000)
    return () => clearInterval(iv)
  }, [online, pending, iSubmitted, dispatch, you.id])

  // auto-lacra ao zerar o timer
  useEffect(() => {
    if (remaining <= 0 && canBid && !iSubmitted && !pending) seal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, canBid, iSubmitted, pending])

  // já lacrei, ou enviei e tô esperando o host confirmar (online)
  if (online && (iSubmitted || pending)) {
    return (
      <Shell bar={<AuctionBar />}>
        <div className="pt-10 text-center space-y-3">
          <div className="text-5xl">{iSubmitted ? '🔒' : '🔄'}</div>
          <h2 className="font-black text-2xl" style={OSWALD}>{iSubmitted ? 'ENVELOPE LACRADO' : 'ENVIANDO…'}</h2>
          <p className="font-semibold text-black/70">
            {iSubmitted
              ? `Aguardando os outros técnicos lacrarem… (${remaining}s)`
              : 'Confirmando com o host… se demorar muito, ele pode estar sem conexão — não se preocupe, seu lance fica guardado e a gente reenvia sozinho.'}
          </p>
          <Box className="p-3 mt-2 text-left">
            {humanBidders.map(m => (
              <p key={m.id} className="text-sm font-bold flex justify-between text-black">
                <span>{m.id === you.id ? '🫵 Você' : m.teamName}</span>
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
  const timerColor = remaining <= 10 ? RED : remaining <= 20 ? GOLD : GREEN
  const timerTextColor = remaining <= 20 ? INK : '#fff'
  const totalBatches = Math.ceil(state.deck[pos].length / BATCH_SIZE)
  const curBatch = Math.min(totalBatches, Math.ceil(state.sectorCursor / BATCH_SIZE))
  // trava em quantos jogadores DIFERENTES dá pra apostar: no máximo suas
  // vagas abertas nessa posição (dá lance em todas de uma vez). Sem isso,
  // apostar em mais candidatos do que cabe é ambíguo — a resolução roda por
  // ordem de menor disputa, então você poderia ganhar o "backup" ao invés do
  // favorito, mesmo tendo dado lance maior nele.
  const bidLimit = myOpen
  const chosenCount = Object.keys(bids).length

  return (
    <Shell bar={<AuctionBar />}>
      <div className="pt-1 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="font-black text-3xl" style={OSWALD}>
            {rescue ? '⚡ REPESCAGEM · ' : '🔨 '}{SECTOR_LABEL[pos].toUpperCase()}
          </h2>
          <p className="text-sm font-semibold text-black/70">
            {rescue
              ? 'Sobras do setor, última chance de pagar por elas. Só quem ficou com buraco participa.'
              : 'Lance cego: distribua suas moedas em segredo. Ninguém vê nada até a revelação.'}
            {' '}Suas vagas: <b>{myOpen}</b>.
            {!rescue && totalBatches > 1 && <> Leva <b>{curBatch}/{totalBatches}</b> — mais vem a seguir.</>}
          </p>
          {!rescue && canBid && bidLimit > 0 && (
            <p className="text-sm font-black mt-1" style={{ color: GREEN }}>
              Dê lance em até <b>{bidLimit}</b> jogador{bidLimit === 1 ? '' : 'es'} diferente{bidLimit === 1 ? '' : 's'} pra tentar fechar {bidLimit === 1 ? 'sua vaga' : 'suas vagas'}.
            </p>
          )}
        </div>
        <div className="border-[3px] border-black rounded-xl px-3 py-2 text-center min-w-[64px]"
          style={{ backgroundColor: timerColor, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p className="text-[9px] font-black uppercase" style={{ color: timerTextColor }}>Tempo</p>
          <p className="font-black text-2xl leading-none" style={{ ...OSWALD, color: timerTextColor }}>{remaining}s</p>
        </div>
      </div>

      {!canBid && (
        <Box bg="#FFE9B0" className="p-3">
          <p className="text-sm font-bold text-black">{myOpen === 0 ? 'Setor completo — você só assiste esta rodada.' : 'Sem dinheiro — resta torcer pelo Monte Final.'}</p>
        </Box>
      )}

      <div className="space-y-2">
        {cards.map(c => {
          const chosen = (bids[c.id] ?? 0) > 0
          const plusBlocked = total >= you.money || (!chosen && chosenCount >= bidLimit)
          return (
          <Box key={c.id} className="p-3 flex items-center justify-between gap-2">
            <CardFace c={c} />
            {canBid && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setBid(c.id, (bids[c.id] ?? 0) - 1)} className="border-2 border-black rounded-lg w-8 h-8 font-black bg-white text-black">−</button>
                <span className="w-9 text-center font-black text-black" style={OSWALD}>{bids[c.id] ?? 0}</span>
                <button
                  onClick={() => !plusBlocked && setBid(c.id, (bids[c.id] ?? 0) + 1)}
                  disabled={plusBlocked}
                  className={`border-2 border-black rounded-lg w-8 h-8 font-black text-black ${plusBlocked ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: GOLD }}>+</button>
              </div>
            )}
          </Box>
          )
        })}
      </div>

      <Box bg="#fff" className="p-3 flex items-center justify-between">
        <p className="font-black text-black" style={OSWALD}>ENVELOPE: {total} / {you.money}</p>
        <Btn onClick={seal} bg={RED}>
          <span className="text-white">LACRAR 🔒</span>
        </Btn>
      </Box>
      {online && waitingFor.length > 0 && (
        <p className="text-center text-xs font-bold text-black/60">Faltam lacrar: {waitingFor.map(m => m.teamName).join(', ')}</p>
      )}

      <Campinho m={you} />
      <RivalsStrip />
    </Shell>
  )
}

// ─── LEILÃO: revelação ───────────────────────────────────────────────
function AutoAdvance({ hasBids, canDrive }: { hasBids: boolean; canDrive: boolean; isLast: boolean }) {
  const { state, dispatch } = useEsc()
  useEffect(() => {
    if (!canDrive) return
    const delay = hasBids ? 2000 : 1000
    const t = setTimeout(() => dispatch({ type: 'ADVANCE_REVEAL' }), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revealIdx, state.phase, canDrive, hasBids])
  return null
}

function Reveal() {
  const { state } = useEsc()
  const item = state.revealQueue[state.revealIdx]
  const you = state.managers[state.youIdx]
  if (!item) return null
  const winnerMgr = item.winner !== null ? state.managers.find(m => m.id === item.winner) : null
  const isLast = state.revealIdx >= state.revealQueue.length - 1
  const online = state.onlineMode === 'online'
  const canDrive = !online || state.isHost

  return (
    <Shell bar={<AuctionBar />}>
      <p className="text-center text-xs font-black uppercase text-black/70 pt-1">
        Revelação {state.revealIdx + 1} / {state.revealQueue.length} · pote crescente
      </p>
      <motion.div key={item.card.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Box bg={item.card.fame >= 5 ? GOLD : '#fff'} className="p-5" shadow={6}>
          <CardFace c={item.card} big />
          <div className="mt-4 space-y-1.5">
            {item.bids.length === 0 && (
              <p className="font-bold text-black/70">Nenhum lance. Vai pro Monte Final. 🪣</p>
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
                    {m.id === you.id ? '🫵 Você' : m.name}{voided ? ' · anulado (setor cheio)' : ''}
                  </p>
                  <p className="font-black" style={{ ...OSWALD, color: isWinner ? '#fff' : INK }}>{b.amount}</p>
                </motion.div>
              )
            })}
          </div>
          {winnerMgr && (
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: item.bids.length * 0.25 + 0.2 }}
              className="mt-3 text-center font-black text-lg" style={OSWALD}>
              🔨 VENDIDO {winnerMgr.id === you.id ? 'PRA VOCÊ' : `pro ${winnerMgr.teamName}`} por {item.paid}!
            </motion.p>
          )}
        </Box>
      </motion.div>
      {/* auto-avanço: 1s por carta, 2s se houve lance */}
      <AutoAdvance hasBids={item.bids.length > 0} canDrive={canDrive} isLast={isLast} />
      <p className="text-center text-xs font-bold text-black/60 py-1">
        {canDrive ? '🎬 Passando automaticamente…' : '🔨 O host está conduzindo a revelação…'}
      </p>
      <Campinho m={you} small />
    </Shell>
  )
}

function RivalsStrip() {
  const { state } = useEsc()
  const you = state.managers[state.youIdx]
  // só quem REALMENTE disputa o leilão, sem contar você mesmo: no solo são
  // os rivais CPU; online são os amigos humanos da sala (bots de
  // preenchimento já têm elenco pronto e nunca dão lance — não fazem
  // sentido aqui)
  const rivals = state.managers.filter(m => m.id !== you.id && m.auctionRival)
  if (rivals.length === 0) return null
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/70 mb-1.5">A sala</p>
      <div className="grid grid-cols-2 gap-2">
        {rivals.map(m => (
          <Box key={m.id} className="p-2.5" shadow={3}>
            <p className="font-black text-sm truncate" style={OSWALD}>{m.teamName}</p>
            <p className="text-[11px] font-semibold text-black/55">{m.formation} · 💰 {m.money} · {11 - totalHoles(m)}/11</p>
            <p className="text-[10px] font-medium text-black/70 truncate">
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
  const online = state.onlineMode === 'online'
  const curMgr = state.managers.find(m => m.id === state.monteOrder[state.monteIdx])

  // contagem regressiva (só online, quando há prazo)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!online || !state.monteDeadline) return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [online, state.monteDeadline])
  const remaining = online && state.monteDeadline ? Math.max(0, Math.ceil((state.monteDeadline - now) / 1000)) : null

  return (
    <Shell bar={<AuctionBar />}>
      <h2 className="font-black text-3xl pt-1" style={OSWALD}>🪣 MONTE FINAL</h2>
      <p className="text-sm font-semibold text-black/70">
        As sobras do pregão, de graça. Quem tem mais buracos escolhe primeiro, em serpente. Seus buracos: <b>{totalHoles(you)}</b>.
      </p>
      {online && (
        <p className="text-xs font-semibold text-black/60">
          ⏱️ {remaining ?? MONTE_SECONDS}s por vez. Estourou o tempo (foi ao banheiro?), o jogo escolhe a pior sobra pra você e cobra 5 moedas de multa.
        </p>
      )}
      {isYourTurn ? (
        <div className="space-y-2">
          <Box bg={remaining !== null && remaining <= 5 ? RED : GOLD} className="p-3">
            <p className="font-black text-center" style={{ ...OSWALD, color: remaining !== null && remaining <= 5 ? '#fff' : INK }}>
              SUA VEZ — escolha uma carta{remaining !== null ? ` · ${remaining}s` : ''}
            </p>
          </Box>
          {valid.map(c => (
            <Box key={c.id} className="p-3 flex items-center justify-between">
              <CardFace c={c} />
              <Btn onClick={() => dispatch({ type: 'MONTE_PICK', mgrId: you.id, cardId: c.id })} bg={GREEN}><span className="text-white">PEGAR</span></Btn>
            </Box>
          ))}
        </div>
      ) : (
        <Box className="p-4">
          <p className="font-bold text-center text-black">
            {curMgr ? <>Vez de <b>{curMgr.teamName}</b>{remaining !== null ? ` · ${remaining}s` : ''}…</> : 'Aguardando a serpente chegar em você…'}
          </p>
        </Box>
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
  const you = state.managers[state.youIdx]
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
      <Box bg={m.id === you.id ? GOLD : '#fff'} className="p-4" shadow={6}>
        <p className="font-black text-xl" style={OSWALD}>{m.id === you.id ? `🫵 ${m.teamName}` : m.teamName} <span className="text-sm font-bold text-black/70">({m.formation})</span></p>
        <div className="mt-2 space-y-1.5">
          {[...m.squad].sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(c => (
            <div key={c.id} className="flex items-center justify-between border-2 border-black rounded-lg px-3 py-1.5 bg-white">
              <div>
                <p className="font-bold text-sm">{c.pos} · {c.name} <span className="text-black/70 text-xs">({c.club} {c.year})</span></p>
                <p className="text-[10px] font-semibold text-black/70">
                  {c.via === 'bot' ? 'escalado direto' : c.via === 'monte' ? 'monte (grátis)' : c.via === 'repescagem' ? `repescagem · pagou ${c.paid}` : `leilão · pagou ${c.paid}`}
                </p>
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

// ─── TEMPORADA (autoplay: 38 rodadas em ~3 min, relógio correndo) ─────
const TACTIC_LABEL: Record<Tactic, string> = { retranca: '🧱 Retranca', equilibrio: '⚖️ Equilíbrio', ataque: '🔥 Ataque' }
const SEASON_TOTAL_MS = 180_000
const ROUND_MS = Math.round(SEASON_TOTAL_MS / 38) // ~4,7s por rodada
const TICK_MINUTES = 93 // 90' + acréscimos exibidos no ticker

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
  // confronto direto: o adversário também é um humano da sala (não bot nem
  // clube clássico) — só faz sentido provocar quando é gente de verdade
  const isClassico = !!opp && state.managers.some(m => m.id === opp.id && m.isHuman)
  const myLast = state.lastResults.find(r => r.homeId === you.id || r.awayId === you.id)

  // autoplay: só quem "puxa" a temporada dispara a próxima rodada (host no
  // online, o próprio cliente no CPU). Os demais só recebem o resultado
  // sincronizado e tocam a animação do próprio jogo localmente.
  useEffect(() => {
    if (!canAdvance || state.round >= 38) return
    const t = setTimeout(() => dispatch({ type: 'PLAY_ROUND' }), ROUND_MS)
    return () => clearTimeout(t)
  }, [state.round, canAdvance, dispatch])

  return (
    <Shell bar={
      <div className="flex items-center justify-between max-w-xl mx-auto">
        <span className="font-black text-sm" style={OSWALD}>RODADA {Math.min(state.round + 1, 38)}/38</span>
        <span className="font-black text-sm" style={OSWALD}>{youPos}º · {table[youPos - 1]?.pts ?? 0} pts</span>
      </div>
    }>
      {myLast ? (
        <MatchCard key={state.round} r={myLast} roundMs={ROUND_MS} />
      ) : (
        <Box bg="#fff" className="p-6" shadow={6}>
          <p className="text-center font-black" style={OSWALD}>🏁 Aguardando o pontapé inicial…</p>
        </Box>
      )}

      {fixture && opp && (
        <Box bg={isClassico ? GOLD : '#fff'} className="p-4 space-y-3">
          {isClassico && <p className="font-black text-xs uppercase tracking-wide" style={OSWALD}>🥊 CLÁSSICO — é contra a galera!</p>}
          <p className="font-black text-lg" style={OSWALD}>
            PRÓXIMO: {fixture[0] === you.id ? `${you.teamName} × ${opp.name}` : `${opp.name} × ${you.teamName}`}
            <span className="text-xs text-black/70"> {fixture[0] === you.id ? '(em casa)' : '(fora)'}</span>
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
          <div className="space-y-1">
            <div className="h-2 rounded-full border-2 border-black overflow-hidden bg-white">
              <div className="h-full transition-all" style={{ width: `${(state.round / 38) * 100}%`, backgroundColor: GREEN }} />
            </div>
            <p className="text-center text-xs font-bold text-black/60">⏱️ Temporada rolando sozinha — sente e assista.</p>
          </div>
          <p className="text-[11px] font-semibold text-black/70">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
        </Box>
      )}

      {state.news.length > 0 && (
        <Box bg="#FFF6DC" className="p-3 space-y-1">
          {state.news.slice(0, 4).map((n, i) => <p key={i} className="text-xs font-bold">{n}</p>)}
        </Box>
      )}

      <TableBox highlight={you.id} />
      <TopScorersBox highlight={you.id} />
      <Campinho m={you} small />
    </Shell>
  )
}

function TopScorersBox({ highlight }: { highlight: number }) {
  const { state } = useEsc()
  const rows = topScorers(state, 10)
  if (rows.length === 0) {
    return (
      <Box className="p-3">
        <p className="font-black text-sm mb-1 text-black" style={OSWALD}>⚽ ARTILHARIA</p>
        <p className="text-xs text-black/60 font-semibold">Sem gols ainda. Bola rolando…</p>
      </Box>
    )
  }
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2 text-black" style={OSWALD}>⚽ ARTILHARIA · TEMPO REAL</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/60 font-black">
            <th className="pr-1">#</th><th>Jogador</th><th>Time</th><th className="text-center">Gols</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.teamId}-${r.name}`} className="border-t border-black/10 font-semibold text-black"
              style={{ backgroundColor: r.teamId === highlight ? GOLD : undefined }}>
              <td className="pr-1">{i + 1}</td>
              <td className="truncate max-w-[130px]">{r.name}</td>
              <td className="truncate max-w-[110px] text-black/70">{r.teamName}</td>
              <td className="text-center font-black">{r.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}

// placar progressivo: o minuto sobe sozinho de 1 até 90+acréscimos, revelando
// os gols conforme o relógio passa por eles — nunca mostra o resultado pronto.
function MatchCard({ r, roundMs }: { r: { homeId: number; awayId: number; hg: number; ag: number; highlights: { min: number; text: string; teamId: number }[] }; roundMs: number }) {
  const { state } = useEsc()
  const h = state.league.find(t => t.id === r.homeId)!, a = state.league.find(t => t.id === r.awayId)!
  const [minute, setMinute] = useState(0)

  useEffect(() => {
    const stepMs = Math.max(30, (roundMs * 0.85) / TICK_MINUTES)
    let cur = 0
    const iv = setInterval(() => {
      cur++
      setMinute(cur)
      if (cur >= TICK_MINUTES) clearInterval(iv)
    }, stepMs)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = [...r.highlights].filter(hl => hl.min <= minute).sort((x, y) => x.min - y.min)
  const hg = visible.filter(hl => hl.teamId === r.homeId).length
  const ag = visible.filter(hl => hl.teamId === r.awayId).length
  const done = minute >= TICK_MINUTES
  const minuteLabel = minute > 90 ? `90+${minute - 90}'` : `${minute}'`
  const you = state.managers[state.youIdx]
  const oppId = r.homeId === you.id ? r.awayId : r.homeId
  const isClassico = state.managers.some(m => m.id === oppId && m.isHuman)

  return (
    <Box bg={isClassico ? GOLD : '#fff'} className="p-4" shadow={6}>
      {isClassico && <p className="text-center font-black text-[11px] uppercase" style={OSWALD}>🥊 CLÁSSICO</p>}
      <p className="text-center text-[11px] font-black uppercase" style={{ color: done ? GREEN : RED }}>
        {done ? '✅ FIM DE JOGO' : `⏱️ ${minuteLabel}`}
      </p>
      <p className="text-center font-black text-2xl" style={OSWALD}>{h.name} {hg} × {ag} {a.name}</p>
      <div className="mt-2 space-y-0.5 min-h-[20px]">
        {visible.map((hl, i) => (
          <p key={i} className="text-xs font-semibold text-black/60">{hl.min > 90 ? `90+${hl.min - 90}` : hl.min}' {hl.text}</p>
        ))}
        {done && visible.length === 0 && <p className="text-xs text-center font-semibold text-black/70">Jogo truncado, sem gols pra contar.</p>}
      </div>
    </Box>
  )
}

// zona da tabela por posição (sempre 20 times): 1-3 azul (libertadores),
// 4-10 amarelo (pré-libertadores/sula), 11-16 branco normal (meio de
// tabela), 17-20 vermelho (rebaixamento) — tudo em tom pastel, só pra dar
// um significado visual, sem gritar
function zoneColor(rank: number): string | undefined {
  if (rank <= 3) return '#D6E9FA'
  if (rank <= 10) return '#FFF3B8'
  if (rank <= 16) return undefined
  return '#F9D8D3'
}

function TableBox({ highlight }: { highlight: number }) {
  const { state } = useEsc()
  const table = sortedTable(state.league)
  return (
    <Box className="p-3 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-black text-sm" style={OSWALD}>TABELA</p>
        <div className="flex items-center gap-2 text-[9px] font-bold text-black/60">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#D6E9FA' }} />G1</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#FFF3B8' }} />G4</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block border border-black/20" style={{ backgroundColor: '#fff' }} />Meio</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#F9D8D3' }} />Z4</span>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-black/70 font-black">
            <th className="pr-1">#</th><th>Time</th><th className="text-center">P</th><th className="text-center">V</th><th className="text-center">E</th><th className="text-center">D</th><th className="text-center">SG</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => {
            const isMgr = state.managers.some(m => m.id === t.id)
            const rank = i + 1
            const isYou = t.id === highlight
            return (
              <tr key={t.id} className="border-t border-black/10 font-semibold"
                style={{ backgroundColor: isYou ? GOLD : zoneColor(rank), fontWeight: isMgr ? 800 : 500 }}>
                <td className="pr-1">{rank}</td>
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

// ─── card de resultado pra compartilhar ────────────────────────────────
async function buildShareCardBlob(opts: {
  teamName: string; youPos: number; youWon: boolean; champName: string
  pts: number; w: number; d: number; l: number; scorerName?: string; scorerGoals?: number
}): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 900; canvas.height = 1200
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try { await document.fonts.load('900 52px Oswald') } catch { /* segue com a fonte padrão */ }

  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, 900, 1200)
  ctx.fillStyle = GOLD
  ctx.fillRect(24, 24, 852, 140)
  ctx.strokeStyle = INK; ctx.lineWidth = 16
  ctx.strokeRect(24, 24, 852, 140)
  ctx.strokeRect(24, 24, 852, 1152)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '900 46px Oswald, sans-serif'
  ctx.fillText('🔨 LEILÃO LEGENDS 38', 450, 108)

  ctx.font = '160px sans-serif'
  ctx.fillText(opts.youWon ? '🏆' : opts.youPos <= 4 ? '🥈' : opts.youPos >= 17 ? '🪦' : '⚽', 450, 400)

  ctx.font = '900 78px Oswald, sans-serif'
  ctx.fillText(opts.youWon ? 'CAMPEÃO!' : `${opts.youPos}º LUGAR`, 450, 500)

  ctx.font = '700 44px Oswald, sans-serif'
  ctx.fillText(opts.teamName, 450, 565)

  ctx.textAlign = 'left'
  ctx.font = '600 32px Inter, sans-serif'
  let y = 680
  ctx.fillText(`Pontos: ${opts.pts} (${opts.w}V ${opts.d}E ${opts.l}D)`, 90, y)
  y += 55
  if (opts.scorerName) { ctx.fillText(`Artilheiro: ${opts.scorerName} — ${opts.scorerGoals} gols`, 90, y); y += 55 }
  if (!opts.youWon) ctx.fillText(`Campeão da temporada: ${opts.champName}`, 90, y)

  ctx.textAlign = 'center'
  ctx.font = '700 30px Oswald, sans-serif'
  ctx.fillText('D7 STUDIO', 450, 1125)
  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillText(GAME_URL.replace('https://', ''), 450, 1156)

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'))
}

async function shareResult(opts: Parameters<typeof buildShareCardBlob>[0]) {
  const blob = await buildShareCardBlob(opts)
  if (!blob) return
  const file = new File([blob], 'leilao-legends-38.png', { type: 'image/png' })
  const shareData = { files: [file], title: 'Leilão Legends 38', text: `${opts.youWon ? 'Fui campeão' : `Terminei em ${opts.youPos}º`} no Leilão Legends 38! 🔨` }
  if (navigator.canShare?.(shareData)) {
    try { await navigator.share(shareData); return } catch { /* cancelou ou falhou — cai pro download */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'leilao-legends-38.png'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Hall da Fama da sala (só online): histórico entre revanches ──────
interface ChampionRow { season_no: number; champion_name: string; top_scorer_name: string | null; top_scorer_goals: number | null }
function HallDaFama({ roomId, isHost, seasonNo, champName, scorerName, scorerGoals }: {
  roomId: string; isHost: boolean; seasonNo: number; champName: string; scorerName?: string; scorerGoals?: number
}) {
  const [rows, setRows] = useState<ChampionRow[] | null>(null)
  const wroteRef = useRef(false)

  useEffect(() => {
    if (!isHost || wroteRef.current) return
    wroteRef.current = true
    ;(async () => {
      // não duplica se essa temporada já foi registrada (ex.: reabriu a tela)
      const { data: existing } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('season_no', seasonNo).maybeSingle()
      if (existing) return
      await supabase.from('game_champions').insert({
        room_id: roomId, season_no: seasonNo, champion_name: champName,
        top_scorer_name: scorerName ?? null, top_scorer_goals: scorerGoals ?? null,
      })
    })()
  }, [isHost, roomId, seasonNo, champName, scorerName, scorerGoals])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('game_champions').select('season_no, champion_name, top_scorer_name, top_scorer_goals').eq('room_id', roomId).order('season_no', { ascending: true })
      setRows((data ?? []) as ChampionRow[])
    })()
  }, [roomId, seasonNo])

  if (!rows || rows.length === 0) return null
  return (
    <Box className="p-3">
      <p className="font-black text-sm mb-2" style={OSWALD}>🏆 HALL DA FAMA DA SALA</p>
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.season_no} className="flex items-center justify-between border-t border-black/10 pt-1.5 first:border-t-0 first:pt-0">
            <p className="text-sm font-bold text-black">Temporada {r.season_no}: <b>{r.champion_name}</b></p>
            {r.top_scorer_name && <p className="text-[11px] font-semibold text-black/60">⚽ {r.top_scorer_name} ({r.top_scorer_goals})</p>}
          </div>
        ))}
      </div>
    </Box>
  )
}

// ─── carta de colecionador: a raridade (fama) define o visual inteiro ──
const FAME_TIER: Record<number, { label: string; grad: string; ink: string; tierColor: string; crestBg: string; crestInk: string; holo?: boolean }> = {
  5: { label: '👑 LENDA', grad: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', ink: '#0C0C0C', tierColor: '#7a4d00', crestBg: 'rgba(255,255,255,.42)', crestInk: '#7a4d00', holo: true },
  4: { label: '⭐ CRAQUE', grad: 'linear-gradient(150deg,#F2F4F7,#C9D2DB 55%,#A7B3BF)', ink: '#0C0C0C', tierColor: '#4a5560', crestBg: 'rgba(255,255,255,.55)', crestInk: '#4a5560' },
  3: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#E8B98A,#CD8B4E 60%,#A9662B)', ink: '#0C0C0C', tierColor: '#5c3410', crestBg: 'rgba(255,255,255,.48)', crestInk: '#5c3410' },
  2: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#E8B98A,#CD8B4E 60%,#A9662B)', ink: '#0C0C0C', tierColor: '#5c3410', crestBg: 'rgba(255,255,255,.48)', crestInk: '#5c3410' },
  1: { label: '🪵 FOI PROFISSIONAL', grad: 'linear-gradient(150deg,#E7E2D4,#CFC7B2)', ink: '#0C0C0C', tierColor: '#7a725e', crestBg: 'rgba(255,255,255,.5)', crestInk: '#7a725e' },
}
// texto garantido pra QUALQUER carta: se o jogador ainda não tem uma bio
// específica, mostra uma frase por categoria + posição — assim nenhuma
// carta-lembrança fica sem nada escrito.
function fallbackBio(fame: number, pos: string): string {
  const p: Record<string, string> = { GOL: 'do gol', LAT: 'da lateral', ZAG: 'da zaga', MEI: 'do meio-campo', ATA: 'do ataque' }
  const where = p[pos] ?? 'do futebol brasileiro'
  switch (fame) {
    case 5: return `Lenda ${where} — nome eterno do futebol brasileiro.`
    case 4: return `Craque ${where}: brilhou de verdade e marcou época.`
    case 3: return `Bom jogador ${where}, de confiança e regularidade.`
    case 2: return `Bom jogador ${where} que tinha seus dias de brilho.`
    default: return `Foi profissional ${where} — do nosso futebol raiz.`
  }
}
function CollectibleCard({ name, club, year, pos, fame, big = false, bio, folk = false }: { name: string; club: string; year: number; pos: string; fame: number; big?: boolean; bio?: string; folk?: boolean }) {
  const t = FAME_TIER[fame] ?? FAME_TIER[1]
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  const text = bio ?? BIOS[name] ?? fallbackBio(fame, pos)
  return (
    <div className="relative overflow-hidden border-[3px] border-black rounded-2xl flex flex-col justify-between"
      style={{ background: t.grad, aspectRatio: '3 / 4.2', boxShadow: `5px 6px 0 0 ${INK}`, padding: big ? 16 : 11 }}>
      {t.holo && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.78) 48%, transparent 62%)', backgroundSize: '250% 250%' }}
          animate={{ backgroundPosition: ['180% 180%', '-80% -80%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }} />
      )}
      <div className="relative flex justify-between items-start gap-1">
        <span className="font-black rounded-lg" style={{ ...OSWALD, background: INK, color: '#fff', border: '2px solid rgba(255,255,255,.25)', fontSize: big ? 13 : 11, padding: '2px 7px' }}>{pos}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="font-black tracking-wide text-right" style={{ ...OSWALD, color: t.tierColor, fontSize: big ? 11 : 9 }}>{t.label}</span>
          {folk && (
            <span className="font-black rounded-full" style={{ ...OSWALD, background: 'rgba(0,0,0,.28)', color: '#fff', fontSize: big ? 10 : 8, padding: big ? '2px 8px' : '1px 6px', letterSpacing: .5 }}>🃏 FOLCLÓRICO</span>
          )}
        </div>
      </div>
      <div className="relative self-center rounded-full flex items-center justify-center"
        style={{ width: big ? 100 : 66, height: big ? 100 : 66, background: t.crestBg, color: t.crestInk, border: '3px solid rgba(0,0,0,.28)', ...OSWALD, fontWeight: 900, fontSize: big ? 42 : 27, boxShadow: t.holo ? 'inset 0 0 14px rgba(255,255,255,.7)' : 'none' }}>
        {initial}
      </div>
      <div className="relative">
        <p className="font-black leading-none truncate" style={{ ...OSWALD, color: t.ink, fontSize: big ? 26 : 17 }}>{name}</p>
        <p className="font-extrabold" style={{ color: t.ink, opacity: .62, fontSize: big ? 12 : 10 }}>{club} · {year}</p>
        <p style={{ fontSize: big ? 13 : 11, letterSpacing: 1, marginTop: 3 }}>{'⭐'.repeat(fame)}</p>
        {big && text && (
          <p className="font-semibold italic" style={{ color: t.ink, opacity: .78, fontSize: 12, lineHeight: 1.3, marginTop: 8 }}>“{text}”</p>
        )}
      </div>
    </div>
  )
}

// ─── prêmio de campeão: escolhe 1 carta do seu time pro álbum ─────────
const CARD_PICK_SECONDS = 25
function CardCollectPrompt({ you, seasonKey }: { you: Manager; seasonKey: string }) {
  const { dispatch } = useEsc()
  const [status, setStatus] = useState<'checking' | 'picking' | 'revealed'>('checking')
  const [claimed, setClaimed] = useState<WonCard | null>(null)
  const [deadline] = useState(() => Date.now() + CARD_PICK_SECONDS * 1000)
  const [now, setNow] = useState(() => Date.now())
  const claimingRef = useRef(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('picking'); return }
      const { data } = await supabase.from('user_cards').select('*').eq('user_id', user.id).eq('season_key', seasonKey).maybeSingle()
      if (data) {
        setClaimed({ id: 'x', name: data.card_name, club: data.card_club, year: data.card_year, pos: data.card_pos, fame: data.card_fame, lo: 0, hi: 0, paid: 0, via: 'leilao' } as WonCard)
        setStatus('revealed')
      } else {
        setStatus('picking')
      }
    })()
  }, [seasonKey])

  useEffect(() => {
    if (status !== 'picking') return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [status])
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))

  async function claim(card: WonCard) {
    if (claimingRef.current) return
    claimingRef.current = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_cards').insert({
      user_id: user.id, season_key: seasonKey,
      card_name: card.name, card_club: card.club, card_year: card.year, card_pos: card.pos, card_fame: card.fame,
    })
    setClaimed(card)
    setStatus('revealed')
  }

  useEffect(() => {
    if (status !== 'picking' || remaining > 0) return
    // tempo esgotou: o jogo escolhe uma carta aleatória do seu time por você
    const pick = you.squad[Math.floor(Math.random() * you.squad.length)]
    if (pick) claim(pick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, status])

  if (status === 'checking') return null

  if (status === 'revealed' && claimed) {
    return (
      <Box bg={CREAM} className="p-5 text-center" shadow={6}>
        <p className="text-xs font-black uppercase text-black/60 mb-3">🎴 Foi pro seu álbum!</p>
        <motion.div initial={{ rotateY: 90, opacity: 0, scale: 0.9 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className="mx-auto" style={{ maxWidth: 220 }}>
          <CollectibleCard name={claimed.name} club={claimed.club} year={claimed.year} pos={claimed.pos} fame={claimed.fame} bio={claimed.bio} folk={claimed.folk} big />
        </motion.div>
        <Btn onClick={() => dispatch({ type: 'GO_ALBUM' })} bg={GREEN} className="w-full text-lg mt-4"><span className="text-white">📖 Ver meu álbum</span></Btn>
      </Box>
    )
  }

  return (
    <Box bg={GOLD} className="p-4" shadow={6}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-black text-lg" style={OSWALD}>🎴 Escolha sua carta-lembrança!</p>
        <span className="border-2 border-black rounded-lg px-2 py-1 text-xs font-black bg-white">{remaining}s</span>
      </div>
      <p className="text-xs font-bold text-black/70 mb-3">Campeão leva um craque do próprio time pro álbum. Se o tempo acabar, o jogo escolhe uma pra você.</p>
      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
        {you.squad.map(c => (
          <button key={c.id} onClick={() => claim(c)} className="text-left">
            <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={c.folk} />
          </button>
        ))}
      </div>
    </Box>
  )
}

// ─── álbum: coleção de cartas ganhas sendo campeão, entre partidas ────
interface UserCardRow { card_name: string; card_club: string; card_year: number; card_pos: string; card_fame: number; obtained_at: string }
export function EscAlbum() {
  const { dispatch } = useEsc()
  const [cards, setCards] = useState<UserCardRow[] | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCards([]); return }
      const { data } = await supabase.from('user_cards').select('card_name, card_club, card_year, card_pos, card_fame, obtained_at').eq('user_id', user.id).order('obtained_at', { ascending: false })
      setCards((data ?? []) as UserCardRow[])
    })()
  }, [])

  const unique = useMemo(() => {
    const seen = new Set<string>()
    return (cards ?? []).filter(c => (seen.has(c.card_name) ? false : (seen.add(c.card_name), true)))
  }, [cards])

  return (
    <Shell>
      <div className="text-center pt-4">
        <h2 className="font-black text-4xl" style={OSWALD}>📖 MEU ÁLBUM</h2>
        <p className="font-semibold text-black/60 mt-1">Só quem é campeão no modo online ganha carta — uma por título. Vai colecionando os craques.</p>
        {cards && <p className="font-black text-lg mt-2" style={OSWALD}>{unique.length}/{CATALOG_TOTAL} craques</p>}
      </div>
      {cards === null && <p className="text-center font-bold text-black/60">Carregando…</p>}
      {cards && cards.length === 0 && (
        <Box bg="#fff" className="p-6 text-center">
          <p className="font-bold text-black/70">Ainda sem cartas. Seja campeão de uma sala online pra ganhar a primeira!</p>
        </Box>
      )}
      <div className="grid grid-cols-2 gap-3">
        {cards?.map((c, i) => (
          <CollectibleCard key={i} name={c.card_name} club={c.card_club} year={c.card_year} pos={c.card_pos} fame={c.card_fame} />
        ))}
      </div>
      <Btn onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="w-full text-lg">← Voltar</Btn>
    </Shell>
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
  const online = state.onlineMode === 'online'
  const canRestart = !online || state.isHost
  const myScorer = topScorers(state, 1)[0]
  // check de prontidão do "Reiniciar com novos times": TODOS os participantes
  // humanos precisam clicar "estou pronto" (não depende do presence, instável)
  const restartPending = state.restartPending
  const humanIds = state.managers.filter(m => m.isHuman).map(m => m.id)
  const readyCount = state.restartReady.filter(id => humanIds.includes(id)).length
  const iAmReady = state.restartReady.includes(state.youIdx)
  return (
    <Shell>
      <div className="text-center pt-8">
        <p className="text-6xl">{youWon ? '🏆' : youPos <= 4 ? '🥈' : youPos >= 17 ? '🪦' : '📻'}</p>
        <h2 className="font-black text-4xl mt-2" style={OSWALD}>{youWon ? 'CAMPEÃO!' : `${youPos}º LUGAR`}</h2>
        <p className="font-semibold text-black/60 mt-1">
          {youWon ? 'O pregão foi seu, o campeonato foi seu. Resenha eterna.' : `Campeão: ${champ.name}. ${youPos >= 17 ? 'Rebaixado. O leilão cobra caro.' : 'Ano que vem tem pregão de novo.'}`}
        </p>
      </div>
      {online && youWon && state.roomId && (
        <CardCollectPrompt you={you} seasonKey={`${state.roomId}:${state.seasonNo}`} />
      )}
      <TableBox highlight={you.id} />
      <TopScorersBox highlight={you.id} />
      {online && state.roomId && (
        <HallDaFama roomId={state.roomId} isHost={state.isHost} seasonNo={state.seasonNo} champName={champ.name}
          scorerName={myScorer?.name} scorerGoals={myScorer?.goals} />
      )}
      <Btn onClick={() => shareResult({
        teamName: you.teamName, youPos, youWon, champName: champ.name,
        pts: table[youPos - 1]?.pts ?? 0, w: table[youPos - 1]?.w ?? 0, d: table[youPos - 1]?.d ?? 0, l: table[youPos - 1]?.l ?? 0,
        scorerName: myScorer?.name, scorerGoals: myScorer?.goals,
      })} bg="#fff" className="w-full text-lg">📤 Compartilhar resultado</Btn>
      {restartPending
        ? (
          <div className="rounded-2xl border-4 border-black p-3 space-y-2" style={{ background: '#FEF3C7' }}>
            <p className="text-center font-black text-lg" style={OSWALD}>🔀 REINICIAR COM NOVOS TIMES</p>
            <p className="text-center text-sm font-bold">Esperando todo mundo confirmar… {readyCount}/{humanIds.length} prontos</p>
            {!iAmReady
              ? <Btn onClick={() => dispatch({ type: 'CONFIRM_RESTART', mgrId: state.youIdx })} bg={GREEN} className="w-full text-lg"><span className="text-white">✅ Estou pronto</span></Btn>
              : <p className="text-center text-sm font-bold text-black/60">Você está pronto. Aguardando os outros…</p>}
            {canRestart && <Btn onClick={() => dispatch({ type: 'CANCEL_RESTART' })} className="w-full">Cancelar</Btn>}
          </div>
        )
        : canRestart
          ? (
            <>
              <Btn onClick={() => dispatch({ type: 'REPLAY_SEASON' })} bg={GREEN} className="w-full text-lg"><span className="text-white">🔁 Nova temporada (mesmo time)</span></Btn>
              <Btn onClick={() => dispatch({ type: 'REQUEST_NEW_TEAMS' })} className="w-full text-lg">🔀 Reiniciar com novos times</Btn>
            </>
          )
          : <p className="text-center text-sm font-bold text-black/60">Aguardando o host começar a próxima temporada…</p>}
      <Btn onClick={() => dispatch({ type: 'NEW_GAME' })} className="w-full text-lg">NOVO PREGÃO 🔨</Btn>
    </Shell>
  )
}
