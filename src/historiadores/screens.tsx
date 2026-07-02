import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHist } from './store'
import { getCard, getRaridadeColor, getRaridadeLabel, QUESTION_LABELS, HIST_CARDS } from './data'
import type { HistCardData, QuestionKey } from './types'
import { BrutalButton, BrutalCard, BrutalPill, C } from '../empresario/ui'

function fmt(m: number) { return `$${Math.round(m)}M` }

// Max reference values for stat bars
const STAT_MAX: Record<QuestionKey, number> = {
  gols: 100,
  titulos: 20,
  altura: 210,
  assists: 40,
  jogos: 80,
}

// ── Holographic shimmer overlay ────────────────────────────────────
function ShimmerOverlay({ raridade }: { raridade: HistCardData['raridade'] }) {
  if (raridade === 'mitica') {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
          borderRadius: 'inherit',
        }}
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.8 }}
      />
    )
  }
  if (raridade === 'epica') {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(167,139,250,0.22) 50%, transparent 80%)',
          borderRadius: 'inherit',
        }}
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
      />
    )
  }
  return null
}

// ── Full card component ────────────────────────────────────────────
function HistCard({
  cardId,
  highlightStat,
  revealed,
  compact = false,
}: {
  cardId: string
  highlightStat?: QuestionKey
  revealed: boolean
  compact?: boolean
}) {
  const card = getCard(cardId)
  if (!card) return null
  const colors = getRaridadeColor(card.raridade)

  return (
    <div
      className="w-full rounded-2xl border-[3px] border-black overflow-hidden relative"
      style={{
        background: colors.bg,
        boxShadow: `5px 5px 0 0 #0C0C0C, 0 0 40px ${colors.glow}55`,
      }}
    >
      <ShimmerOverlay raridade={card.raridade} />

      <div className="flex items-center justify-between px-4 pt-3 pb-1 relative z-20">
        <span
          className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
          style={{ color: colors.text, borderColor: `${colors.text}66` }}
        >
          {getRaridadeLabel(card.raridade)}
        </span>
        <span className="font-mono text-xs font-black" style={{ color: `${colors.text}BB` }}>
          {card.ano}
        </span>
      </div>

      <div className="px-4 pb-3 relative z-20">
        <div className={compact ? 'text-2xl mb-0.5' : 'text-3xl mb-1'}>{card.flag}</div>
        <p
          className={`font-black leading-tight ${compact ? 'text-xl' : 'text-2xl'}`}
          style={{ fontFamily: 'Oswald, sans-serif', color: colors.text }}
        >
          {card.nome}
        </p>
        <p className="text-sm font-bold opacity-70" style={{ color: colors.text }}>
          {card.apelido}
        </p>
        <p className="text-xs mt-0.5 opacity-60" style={{ color: colors.text }}>
          {card.posicao} · {card.clube}
        </p>
      </div>

      {!compact && (
        <div
          className="mx-3 mb-3 rounded-xl overflow-hidden border-2 relative z-20"
          style={{ borderColor: `${colors.text}30`, backgroundColor: 'rgba(0,0,0,0.25)' }}
        >
          {(Object.entries(card.atributos) as [QuestionKey, number][]).map(([key, val], idx) => {
            const isHL = key === highlightStat
            const barPct = Math.min(100, (val / (STAT_MAX[key] ?? 100)) * 100)
            return (
              <div
                key={key}
                className="px-3 pt-2 pb-1.5 border-b last:border-0"
                style={{
                  borderColor: `${colors.text}15`,
                  backgroundColor: isHL && revealed ? 'rgba(255,184,0,0.18)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[11px] font-black uppercase tracking-wide opacity-70"
                    style={{ color: colors.text }}
                  >
                    {key}
                  </span>
                  <motion.span
                    className="font-black text-base tabular-nums"
                    style={{ color: isHL && revealed ? '#FFB800' : colors.text }}
                    animate={{ filter: revealed ? 'blur(0px)' : 'blur(8px)' }}
                    transition={{ duration: 0.6, delay: isHL ? 0.05 : 0.3 + idx * 0.08 }}
                  >
                    {val}
                  </motion.span>
                </div>

                {/* Stat bar — only on reveal */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${colors.text}18` }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: revealed ? `${barPct}%` : '0%' }}
                    transition={{ duration: 0.9, delay: 0.4 + idx * 0.12, ease: 'easeOut' }}
                    style={{ backgroundColor: isHL && revealed ? '#FFB800' : `${colors.text}CC` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Album card slot (3-column grid) ───────────────────────────────
function AlbumSlot({
  card,
  isOwned,
  onTap,
}: {
  card: HistCardData
  isOwned: boolean
  onTap: () => void
}) {
  const colors = getRaridadeColor(card.raridade)
  return (
    <motion.button
      onClick={isOwned ? onTap : undefined}
      whileTap={isOwned ? { scale: 0.93 } : {}}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-[3px] border-black overflow-hidden relative"
      style={{
        aspectRatio: '2/3',
        background: isOwned ? colors.bg : '#1c1c1c',
        boxShadow: isOwned
          ? `3px 3px 0 0 #0C0C0C, 0 0 16px ${colors.glow}44`
          : '2px 2px 0 0 #0C0C0C',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isOwned ? (
        <>
          <ShimmerOverlay raridade={card.raridade} />
          <div className="flex flex-col h-full p-1.5 relative z-10">
            <span
              className="text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded-full self-start border mb-auto leading-tight"
              style={{ color: colors.text, borderColor: `${colors.text}55` }}
            >
              {card.raridade === 'mitica' ? 'MÍT' : card.raridade === 'epica' ? 'ÉPI' : 'COM'}
            </span>
            <div>
              <div className="text-base leading-none mb-0.5">{card.flag}</div>
              <p
                className="font-black text-[10px] leading-tight"
                style={{ fontFamily: 'Oswald, sans-serif', color: colors.text }}
              >
                {card.nome.split(' ').at(-1)}
              </p>
              <p className="text-[8px] font-bold opacity-50" style={{ color: colors.text }}>
                {card.ano}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 opacity-30">
          <span className="text-white text-xl">?</span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.glow }}
          />
        </div>
      )}
    </motion.button>
  )
}

// ── Card modal (full-screen expanded) ─────────────────────────────
function CardModal({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, rotateY: -12 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="w-full max-w-sm"
        style={{ transformPerspective: 1200 }}
        onClick={e => e.stopPropagation()}
      >
        <HistCard cardId={cardId} revealed={true} />
        <button
          onClick={onClose}
          className="w-full mt-3 border-[3px] border-black rounded-xl py-3 font-black text-sm bg-white"
          style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
        >
          FECHAR
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Circular progress ring ─────────────────────────────────────────
function RingProgress({
  count,
  total,
  label,
  color,
}: {
  count: number
  total: number
  label: string
  color: string
}) {
  const r = 15
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? count / total : 0
  return (
    <div className="flex-1 flex flex-col items-center border-[3px] border-black rounded-2xl p-3 bg-white"
         style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}>
      <div className="relative w-12 h-12 mb-1">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#0C0C0C22" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r={r} fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-black text-sm">
          {count}
        </span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-center">{label}</p>
      <p className="text-[9px] text-black/40 font-bold">{count}/{total}</p>
    </div>
  )
}

// ── MenuScreen ────────────────────────────────────────────────────
export function MenuScreen() {
  const { state, dispatch } = useHist()
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState(10)
  const ownedCount = state.museuCards.length

  return (
    <div className="min-h-screen flex flex-col items-center p-5 pt-14" style={{ backgroundColor: C.cream }}>
      <div className="text-center mb-8">
        <BrutalPill color="#FFB800" textColor={C.black}>7A0 GAME STUDIO</BrutalPill>
        <h1
          className="font-black text-5xl mt-4 leading-none"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          HISTO-<br />RIADORES<br />DA BOLA
        </h1>
        <p className="text-sm text-black/50 mt-3 font-bold leading-relaxed">
          Chute. Aposte nas costas do amigo.<br />Roube a lenda sem nem saber a resposta.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <BrutalCard className="p-5 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider block mb-1.5">
              Seu nome
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Apelido..."
              maxLength={20}
              className="w-full border-[3px] border-black rounded-xl px-4 py-3 font-bold text-base bg-white focus:outline-none"
              style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider block mb-2">
              Rodadas
            </label>
            <div className="flex gap-2">
              {([5, 10, 15] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className="flex-1 py-3 border-[3px] border-black rounded-xl font-black text-base transition-all"
                  style={{
                    backgroundColor: rounds === n ? '#FFB800' : '#fff',
                    boxShadow: rounds === n ? '3px 3px 0 0 #0C0C0C' : 'none',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <BrutalButton
            color="#FFB800"
            textColor={C.black}
            onClick={() =>
              dispatch({ type: 'START_GAME', playerName: name.trim() || 'Você', totalRounds: rounds })
            }
          >
            JOGAR →
          </BrutalButton>
        </BrutalCard>

        {ownedCount > 0 && (
          <BrutalButton
            color={C.black}
            textColor={C.cream}
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'museu' })}
          >
            ÁLBUM DAS LENDAS · {ownedCount} CARTA{ownedCount !== 1 ? 'S' : ''}
          </BrutalButton>
        )}

        <p className="text-center text-xs font-bold text-black/30 mt-2">
          vs Tonhão · PC Magrão · Biriba
        </p>
      </div>
    </div>
  )
}

// ── Fase 1: Palpite ───────────────────────────────────────────────
function GuessingPhase() {
  const { state, dispatch } = useHist()
  const [guess, setGuess] = useState('')

  const card = getCard(state.currentCardId ?? '')
  const you = state.players[state.youIdx]
  if (!card || !state.currentQuestion || !you) return null

  const questionLabel = QUESTION_LABELS[state.currentQuestion]?.(card.ano) ?? state.currentQuestion
  const guessNum = parseInt(guess, 10)
  const canSubmit = !isNaN(guessNum) && guessNum >= 0 && guess !== ''

  function submit() {
    if (!canSubmit) return
    dispatch({ type: 'SUBMIT_GUESS', value: guessNum })
  }

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: C.cream }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40">Rodada</p>
          <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {state.round} / {state.totalRounds}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40">Sua grana</p>
          <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif', color: '#16B89A' }}>
            {fmt(you.money)}
          </p>
        </div>
      </div>

      <div className="mx-5 h-1.5 bg-black/10 rounded-full border border-black/15 overflow-hidden mb-4">
        <div
          className="h-full rounded-full"
          style={{ width: `${(state.round / state.totalRounds) * 100}%`, backgroundColor: '#FFB800' }}
        />
      </div>

      <div className="mx-5 mb-4">
        <div
          className="border-[3px] border-black rounded-2xl px-4 py-3"
          style={{ backgroundColor: '#FFB800', boxShadow: '4px 4px 0 0 #0C0C0C' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-0.5">
            FASE 1 · PALPITE RÁPIDO
          </p>
          <p className="font-black text-sm">{questionLabel}</p>
        </div>
      </div>

      <div className="mx-5 mb-5">
        <HistCard cardId={card.id} highlightStat={state.currentQuestion} revealed={false} />
      </div>

      <div className="mx-5 space-y-3">
        <BrutalCard className="p-4 space-y-3">
          <label className="text-xs font-black uppercase tracking-wider block">
            Seu palpite
          </label>
          <input
            type="number"
            min="0"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            placeholder="0"
            className="w-full border-[3px] border-black rounded-xl px-4 py-3 font-black text-4xl bg-white focus:outline-none text-center"
            style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
          />
          <p className="text-[11px] text-black/40 font-bold text-center">
            Sem dinheiro ainda — só o palpite. Aposta vem depois.
          </p>
          <BrutalButton color={C.black} textColor={C.cream} disabled={!canSubmit} onClick={submit}>
            CONFIRMAR PALPITE →
          </BrutalButton>
        </BrutalCard>

        <div className="flex gap-1.5">
          {state.players.map(p => (
            <div
              key={p.id}
              className="flex-1 border-2 border-black rounded-xl p-2 text-center"
              style={{ backgroundColor: p.id === 'you' ? '#FFB800' : '#fff' }}
            >
              <p className="text-[9px] font-black truncate">{p.nome}</p>
              <p className="font-black text-xs">{fmt(p.money)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Fase 2: Tapete de Apostas ─────────────────────────────────────
function BettingPhase() {
  const { state, dispatch } = useHist()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [amount, setAmount] = useState(10)

  const you = state.players[state.youIdx]
  const card = getCard(state.currentCardId ?? '')
  if (!card || !state.currentQuestion || !you) return null

  const questionLabel = QUESTION_LABELS[state.currentQuestion]?.(card.ano)
  const maxAmount = Math.max(1, you.money)
  const safeAmount = Math.min(amount, maxAmount)
  const sortedGuesses = [...state.guesses].sort((a, b) => a.value - b.value)

  function submit() {
    if (!selectedTarget) return
    dispatch({ type: 'SUBMIT_BET', onPlayerId: selectedTarget, amount: safeAmount, timestamp: Date.now() })
  }

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: C.cream }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40">Rodada</p>
          <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {state.round} / {state.totalRounds}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40">Sua grana</p>
          <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif', color: '#16B89A' }}>
            {fmt(you.money)}
          </p>
        </div>
      </div>

      <div className="mx-5 mb-4">
        <div
          className="border-[3px] border-black rounded-2xl px-4 py-3"
          style={{ backgroundColor: '#0C0C0C', boxShadow: '4px 4px 0 0 #FFB800' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">
            FASE 2 · LEILÃO CEGO
          </p>
          <p className="font-black text-sm text-white">{questionLabel}</p>
        </div>
      </div>

      <div className="mx-5 mb-4">
        <p className="text-xs font-black uppercase tracking-wider text-black/40 mb-2">
          TAPETE DE APOSTAS · Em qual palpite você aposta?
        </p>
        <div className="space-y-2">
          {sortedGuesses.map(g => {
            const player = state.players.find(p => p.id === g.playerId)
            const isYou = g.playerId === 'you'
            const isSelected = selectedTarget === g.playerId
            return (
              <motion.button
                key={g.playerId}
                onClick={() => setSelectedTarget(g.playerId)}
                whileTap={{ scale: 0.98 }}
                className="w-full border-[3px] border-black rounded-2xl p-4 text-left transition-all"
                style={{
                  backgroundColor: isSelected ? '#FFB800' : '#fff',
                  boxShadow: isSelected ? '4px 4px 0 0 #0C0C0C' : '3px 3px 0 0 #0C0C0C',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm">
                      {player?.nome ?? g.playerId}
                      {isYou && <span className="ml-1.5 text-[10px] font-black uppercase tracking-wide opacity-60">(você)</span>}
                    </p>
                    <p className="text-xs text-black/50 font-bold mt-0.5">palpitou</p>
                  </div>
                  <p className="font-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {g.value}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedTarget && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-4"
          >
            <BrutalCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider">Quanto apostar?</label>
                <span className="font-black text-lg" style={{ color: '#16B89A' }}>
                  {fmt(safeAmount)}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={maxAmount}
                value={safeAmount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full h-2 accent-yellow-400"
              />
              <div className="flex justify-between text-[10px] font-bold text-black/35">
                <span>$1M</span>
                <span>tudo ({fmt(maxAmount)})</span>
              </div>
              <p className="text-[11px] text-black/40 font-bold text-center">
                Lances iguais: mais rápido no milissegundo leva a lenda ⚡
              </p>
            </BrutalCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-5">
        <BrutalButton
          color="#FFB800"
          textColor={C.black}
          disabled={!selectedTarget}
          onClick={submit}
        >
          {selectedTarget ? `APOSTAR ${fmt(safeAmount)} →` : 'SELECIONE UM PALPITE'}
        </BrutalButton>
      </div>
    </div>
  )
}

// ── Fase 3: Revelação ─────────────────────────────────────────────
function RevealPhase() {
  const { state, dispatch } = useHist()
  const card = getCard(state.currentCardId ?? '')
  const { roundResult } = state
  if (!card || !state.currentQuestion || !roundResult) return null

  const { realValue, winningGuessPlayerId, guessRanks, bets, cardWinnerId } = roundResult
  const questionLabel = QUESTION_LABELS[state.currentQuestion]?.(card.ano)
  const isLast = state.round >= state.totalRounds || state.deck.length === 0
  const winningGuess = guessRanks.find(r => r.playerId === winningGuessPlayerId)
  const medals = ['🥇', '🥈', '🥉', '4️⃣']

  function playerName(id: string) {
    return state.players.find(p => p.id === id)?.nome ?? id
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-black/40">
          Revelação · Rodada {state.round}
        </p>
      </div>

      {/* Real value */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="mx-5 mb-4"
      >
        <div
          className="border-[3px] border-black rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#FFB800', boxShadow: '5px 5px 0 0 #0C0C0C' }}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/50">RESPOSTA CERTA</p>
            <p className="text-xs font-bold text-black/60 mt-0.5">{questionLabel}</p>
          </div>
          <p className="font-black text-5xl" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {realValue}
          </p>
        </div>
      </motion.div>

      {/* Winning guess */}
      {winningGuess && (
        <div className="mx-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
            PALPITE VENCEDOR
          </p>
          <BrutalCard color={C.black} className="p-3 flex items-center justify-between">
            <div>
              <p className="font-black text-sm text-white">
                {playerName(winningGuess.playerId)}
                {winningGuess.playerId === 'you' && <span className="ml-1.5 text-[10px] opacity-60">(você)</span>}
              </p>
              <p className="text-xs text-white/50 font-bold">
                {winningGuess.over ? 'PASSOU' : `${winningGuess.distance} de distância`}
              </p>
            </div>
            <p className="font-black text-3xl text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {winningGuess.value}
            </p>
          </BrutalCard>
        </div>
      )}

      {/* Tiebreak banner */}
      {roundResult.hadTiebreak && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mx-5 mb-3 border-[3px] border-black rounded-xl px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: '#FF5126', boxShadow: '3px 3px 0 0 #0C0C0C' }}
        >
          <span className="text-lg">⚡</span>
          <div>
            <p className="font-black text-xs text-white uppercase tracking-wide">DESEMPATE POR VELOCIDADE</p>
            <p className="text-[11px] text-white/80 font-bold">
              {playerName(cardWinnerId ?? '')} foi mais rápido por {roundResult.tiebreakMs}ms
            </p>
          </div>
        </motion.div>
      )}

      {/* No card winner */}
      {cardWinnerId === null && (
        <div className="mx-5 mb-3">
          <div
            className="border-[3px] border-black rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: '#FF5126', boxShadow: '3px 3px 0 0 #0C0C0C' }}
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-black text-sm text-white">Ninguém apostou no palpite vencedor</p>
              <p className="text-[11px] text-white/70 font-bold mt-0.5">
                Carta volta pro baralho · todos os lances devolvidos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ALL bets — full transparency */}
      <div className="mx-5 mb-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
          LANCES DA RODADA
        </p>
        <div className="space-y-1.5">
          {bets.map(bet => {
            const isCardWinner = bet.playerId === cardWinnerId
            const isYou = bet.playerId === 'you'
            const backedName = playerName(bet.onPlayerId)
            const backedGuess = state.guesses.find(g => g.playerId === bet.onPlayerId)
            const backedWinner = bet.onPlayerId === winningGuessPlayerId
            return (
              <div
                key={bet.playerId}
                className="border-[3px] border-black rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: isCardWinner ? '#FFB800' : isYou ? '#fff' : C.cream,
                  boxShadow: isCardWinner ? '3px 3px 0 0 #0C0C0C' : isYou ? '2px 2px 0 0 #0C0C0C' : 'none',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCardWinner && <span className="text-base shrink-0">🏆</span>}
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">
                      {playerName(bet.playerId)}
                      {isYou && <span className="ml-1 text-[10px] opacity-60">(você)</span>}
                    </p>
                    <p className="text-[10px] font-bold text-black/50 truncate">
                      apostou no {backedName === playerName(bet.playerId) ? 'próprio' : backedName} · palpite {backedGuess?.value ?? '?'}
                    </p>
                    <p className={`text-[10px] font-black uppercase ${isCardWinner ? '' : backedWinner ? 'text-green-700' : 'text-black/35'}`}>
                      {isCardWinner
                        ? 'pagou · ganhou a carta'
                        : backedWinner
                        ? 'devolvido ✓'
                        : 'palpite errado · devolvido ✓'}
                    </p>
                  </div>
                </div>
                <p className="font-black text-lg shrink-0 ml-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {fmt(bet.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card revealed with flip animation */}
      <motion.div
        className="mx-5 mb-4"
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformPerspective: 1200 }}
      >
        <HistCard cardId={card.id} highlightStat={state.currentQuestion} revealed={true} />
      </motion.div>

      {/* Guess rankings */}
      <div className="mx-5 mb-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
          RANKING DE PALPITES
        </p>
        <div className="space-y-1.5">
          {guessRanks.map((r, i) => {
            const isYou = r.playerId === 'you'
            const player = state.players.find(p => p.id === r.playerId)
            return (
              <div
                key={r.playerId}
                className="border-2 border-black rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ backgroundColor: isYou ? '#fff' : C.cream, boxShadow: isYou ? '2px 2px 0 0 #0C0C0C' : 'none' }}
              >
                <span className="text-lg w-7">{medals[i] ?? ''}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">
                    {playerName(r.playerId)}{isYou ? ' (você)' : ''}
                  </p>
                  <p className="text-[11px] font-bold text-black/50">
                    {r.value}
                    {r.over
                      ? <span className="text-red-500 ml-1">· PASSOU</span>
                      : <span className="ml-1">· erro: {r.distance}</span>
                    }
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {r.bonus > 0 && (
                    <p className="font-black text-sm" style={{ color: '#16B89A' }}>+{fmt(r.bonus)}</p>
                  )}
                  <p className="text-[10px] font-bold text-black/40">{fmt(player?.money ?? 0)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-5">
        <BrutalButton color={C.black} textColor={C.cream} onClick={() => dispatch({ type: 'NEXT_CARD' })}>
          {isLast ? 'VER PLACAR FINAL →' : 'PRÓXIMA CARTA →'}
        </BrutalButton>
      </div>
    </div>
  )
}

// ── GameScreen ────────────────────────────────────────────────────
export function GameScreen() {
  const { state } = useHist()
  switch (state.phase) {
    case 'guessing':  return <GuessingPhase />
    case 'betting':   return <BettingPhase />
    case 'revealing': return <RevealPhase />
    default:          return <GuessingPhase />
  }
}

// ── ResultsScreen ─────────────────────────────────────────────────
export function ResultsScreen() {
  const { state, dispatch } = useHist()
  const sorted = [...state.players].sort((a, b) => b.money - a.money)
  const winner = sorted[0]
  const youRank = sorted.findIndex(p => p.id === 'you') + 1
  const medals = ['🥇', '🥈', '🥉', '4️⃣']

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="px-5 pt-10 pb-5 text-center">
        <BrutalPill color="#FFB800" textColor={C.black}>PLACAR FINAL</BrutalPill>
        <h1
          className="font-black text-4xl mt-3 leading-tight"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          {youRank === 1 ? 'VOCÊ GANHOU!' : `${winner.nome} VENCEU!`}
        </h1>
        <p className="text-sm text-black/40 font-bold mt-1">
          {state.totalRounds} rodada{state.totalRounds !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mx-5 space-y-2 mb-5">
        {sorted.map((p, i) => (
          <BrutalCard key={p.id} color={p.id === 'you' ? '#FFB800' : '#fff'} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{medals[i] ?? ''}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base truncate">
                  {p.nome}{p.id === 'you' ? ' (você)' : ''}
                </p>
                <p className="text-xs font-bold text-black/50">
                  {p.cartasIds.length} carta{p.cartasIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="font-black text-xl shrink-0" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {fmt(p.money)}
              </p>
            </div>
          </BrutalCard>
        ))}
      </div>

      {state.museuCards.length > 0 && (
        <div className="mx-5 mb-5">
          <BrutalCard className="p-4">
            <p className="text-xs font-black uppercase tracking-wider mb-2">
              SEU ÁLBUM · {state.museuCards.length} CARTA{state.museuCards.length !== 1 ? 'S' : ''}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {state.museuCards.map(id => {
                const c = getCard(id)
                if (!c) return null
                const colors = getRaridadeColor(c.raridade)
                return (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded-lg border-2 border-black text-[10px] font-black"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {c.apelido}
                  </span>
                )
              })}
            </div>
          </BrutalCard>
        </div>
      )}

      <div className="mx-5 space-y-3">
        <BrutalButton color="#FFB800" textColor={C.black} onClick={() => dispatch({ type: 'RESET' })}>
          JOGAR NOVAMENTE →
        </BrutalButton>
        <BrutalButton
          color={C.black}
          textColor={C.cream}
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'museu' })}
        >
          VER ÁLBUM DAS LENDAS
        </BrutalButton>
      </div>
    </div>
  )
}

// ── MuseuScreen → Álbum das Lendas ───────────────────────────────
export function MuseuScreen() {
  const { state, dispatch } = useHist()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const owned = new Set(state.museuCards)

  const miticas = HIST_CARDS.filter(c => c.raridade === 'mitica')
  const epicas  = HIST_CARDS.filter(c => c.raridade === 'epica')
  const comuns  = HIST_CARDS.filter(c => c.raridade === 'comum')

  const lastCard = state.museuCards.length > 0
    ? state.museuCards[state.museuCards.length - 1]
    : null
  const lastCardData = lastCard ? getCard(lastCard) : null

  const backScreen = state.round > 0 ? 'results' : 'menu'

  return (
    <>
      <div className="min-h-screen pb-12" style={{ backgroundColor: C.cream }}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex items-start justify-between">
          <div>
            <BrutalPill color="#FFB800" textColor={C.black}>ÁLBUM DAS LENDAS</BrutalPill>
            <p className="font-black text-xs text-black/40 mt-1.5">
              {owned.size} / {HIST_CARDS.length} cartas coletadas
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: backScreen })}
            className="border-[3px] border-black rounded-xl px-4 py-2 font-black text-sm bg-white"
            style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
          >
            ← voltar
          </button>
        </div>

        {/* Rarity progress rings */}
        <div className="px-5 mb-5">
          <div className="flex gap-3">
            <RingProgress
              count={miticas.filter(c => owned.has(c.id)).length}
              total={miticas.length}
              label="MÍTICA"
              color="#FFB800"
            />
            <RingProgress
              count={epicas.filter(c => owned.has(c.id)).length}
              total={epicas.length}
              label="ÉPICA"
              color="#818CF8"
            />
            <RingProgress
              count={comuns.filter(c => owned.has(c.id)).length}
              total={comuns.length}
              label="COMUM"
              color="#16B89A"
            />
          </div>
        </div>

        {/* Última conquista */}
        {lastCardData && (
          <div className="px-5 mb-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-2">
              ÚLTIMA CONQUISTA
            </p>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cursor-pointer"
              onClick={() => setSelectedCard(lastCard!)}
            >
              <HistCard cardId={lastCard!} revealed={true} compact />
            </motion.div>
          </div>
        )}

        {/* Sections */}
        <div className="px-5 space-y-6">
          {([
            { label: 'MÍTICA', cards: miticas, color: '#FFB800' },
            { label: 'ÉPICA',  cards: epicas,  color: '#818CF8' },
            { label: 'COMUM',  cards: comuns,  color: '#16B89A' },
          ] as const).map(({ label, cards, color }) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-black"
                  style={{ backgroundColor: color, color: '#000' }}
                >
                  {label}
                </span>
                <span className="text-xs font-bold text-black/40">
                  {cards.filter(c => owned.has(c.id)).length}/{cards.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {cards.map(c => (
                  <AlbumSlot
                    key={c.id}
                    card={c}
                    isOwned={owned.has(c.id)}
                    onTap={() => setSelectedCard(c.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <CardModal cardId={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
