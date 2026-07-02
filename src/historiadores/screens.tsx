import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHist } from './store'
import { useWikiPhoto } from './useWikiPhoto'
import { getCard, getRaridadeLabel, QUESTION_LABELS, HIST_CARDS } from './data'
import type { HistCardData, QuestionKey } from './types'
import { BrutalButton, BrutalCard, BrutalPill, C } from '../empresario/ui'
import { SoloGameProvider, OnlineGameProvider, useGameCtx } from './GameContext'
import { useOnlineGame } from './useOnlineGame'
import type { OnlinePlayer } from './onlineRoom'

function fmt(m: number) { return `$${Math.round(m)}M` }

// Max reference values for stat bars
const STAT_MAX: Record<QuestionKey, number> = {
  copa_gols: 18,
  copa_jogos: 26,
  selecao_gols: 135,
  selecao_jogos: 220,
  ballon_dor: 8,
  cl_titulos: 6,
  gols_carreira: 900,
  titulos: 50,
  copas: 5,
  altura: 210,
}

// Short display labels for stat keys
const STAT_SHORT: Record<QuestionKey, string> = {
  copa_gols:    'Gols na Copa',
  copa_jogos:   'Jogos na Copa',
  selecao_gols: 'Gols Seleção',
  selecao_jogos:'Jogos Seleção',
  ballon_dor:   'Bola de Ouro',
  cl_titulos:   'Champions',
  gols_carreira:'Gols Carreira',
  titulos:      'Títulos',
  copas:        'Copas do Mundo',
  altura:       'Altura (cm)',
}

// Visual identity per rarity tier
const RF = {
  mitica: {
    frame: 'linear-gradient(135deg, #78350F 0%, #D97706 25%, #FDE68A 50%, #F59E0B 75%, #92400E 100%)',
    bg: '#100C00',
    accent: '#F59E0B',
    glow: '#F59E0B',
    text: '#FDE68A',
    dimText: '#B45309',
  },
  epica: {
    frame: 'linear-gradient(135deg, #2E1065 0%, #6D28D9 30%, #C4B5FD 55%, #7C3AED 80%, #1E1B4B 100%)',
    bg: '#0B0614',
    accent: '#A78BFA',
    glow: '#7C3AED',
    text: '#EDE9FE',
    dimText: '#5B21B6',
  },
  comum: {
    frame: 'linear-gradient(135deg, #164E63 0%, #0891B2 30%, #67E8F9 55%, #06B6D4 80%, #083344 100%)',
    bg: '#03111A',
    accent: '#22D3EE',
    glow: '#0891B2',
    text: '#CFFAFE',
    dimText: '#155E75',
  },
} as const

// ── Holographic shimmer (lives inside the clipped inner div) ───────
function CardShimmer({ raridade }: { raridade: HistCardData['raridade'] }) {
  if (raridade === 'mitica') {
    return (
      <>
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(108deg, transparent 12%, rgba(255,230,80,0.45) 38%, rgba(255,180,220,0.30) 52%, rgba(110,220,255,0.40) 68%, transparent 88%)',
            mixBlendMode: 'screen',
          }}
          animate={{ x: ['-170%', '270%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.2 }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(112deg, transparent 20%, rgba(255,220,50,0.55) 50%, transparent 80%)',
          }}
          animate={{ x: ['-170%', '270%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.2, delay: 0.12 }}
        />
      </>
    )
  }
  if (raridade === 'epica') {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(108deg, transparent 15%, rgba(167,139,250,0.50) 45%, rgba(216,180,254,0.35) 55%, transparent 85%)',
          mixBlendMode: 'screen',
        }}
        animate={{ x: ['-170%', '270%'] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.8 }}
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
  const photoUrl = useWikiPhoto(card?.wikiTitle)
  if (!card) return null

  const R = RF[card.raridade]
  const hasPhoto = !compact && !!photoUrl

  return (
    // Gradient-border frame
    <div
      className="w-full rounded-2xl relative"
      style={{
        background: R.frame,
        padding: '3px',
        boxShadow: `6px 6px 0 0 #000, 0 0 48px ${R.glow}45`,
      }}
    >
      {/* Inner dark body */}
      <div
        className="rounded-[13px] overflow-hidden relative flex flex-col"
        style={{
          background: R.bg,
          minHeight: hasPhoto ? '400px' : undefined,
        }}
      >
        <CardShimmer raridade={card.raridade} />

        {/* Photo background */}
        {hasPhoto && (
          <div className="absolute inset-0 z-0">
            <img
              src={photoUrl!}
              alt={card.nome}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom,
                  rgba(0,0,0,0.62) 0%,
                  rgba(0,0,0,0.08) 30%,
                  rgba(0,0,0,0.0) 46%,
                  ${R.bg}BB 64%,
                  ${R.bg} 80%)`,
              }}
            />
          </div>
        )}

        {/* No-photo ambient glow */}
        {!compact && !photoUrl && (
          <div className="absolute inset-0 z-0" style={{
            background: `radial-gradient(ellipse at 40% 35%, ${R.accent}12 0%, transparent 65%)`,
          }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: '7rem', opacity: 0.04 }}>{card.flag}</span>
            </div>
          </div>
        )}

        {/* Header: rarity badge + flag + year */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 relative z-10">
          <span
            className="text-[9px] font-black uppercase tracking-[0.14em] px-2 py-[3px] rounded-full"
            style={{ color: R.bg, background: R.accent }}
          >
            {getRaridadeLabel(card.raridade)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[17px] leading-none">{card.flag}</span>
            <span
              className="font-black text-[11px] tabular-nums tracking-wide"
              style={{ color: `${R.text}60` }}
            >
              {card.ano}
            </span>
          </div>
        </div>

        {/* Spacer — photo shows through */}
        {hasPhoto && <div className="flex-1" style={{ minHeight: '130px' }} />}

        {/* Player identity */}
        <div className="px-3 pb-2 relative z-10">
          {!hasPhoto && !compact && (
            <div className="text-4xl mb-1" style={{ opacity: 0.35 }}>{card.flag}</div>
          )}
          {compact && <div className="text-2xl mb-1">{card.flag}</div>}

          <p
            className={`font-black leading-none ${compact ? 'text-xl' : 'text-[1.55rem]'}`}
            style={{
              fontFamily: 'Oswald, sans-serif',
              color: R.text,
              textShadow: hasPhoto ? `0 2px 16px ${R.bg}` : 'none',
              letterSpacing: '0.01em',
            }}
          >
            {card.nome}
          </p>
          <p className="text-[11px] font-bold mt-0.5 tracking-wide" style={{ color: `${R.text}70` }}>
            {card.apelido}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${R.text}45` }}>
            {card.posicao} · {card.clube}
          </p>
        </div>

        {/* Stats block */}
        {!compact && (
          <>
            {/* Divider with accent glow */}
            <div
              className="mx-3 mb-3"
              style={{
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${R.accent}50, transparent)`,
              }}
            />

            <div className="mx-3 mb-3 space-y-2.5 relative z-10">
              {/* During guessing: only the asked stat. Otherwise: the card's 3 questions */}
              {(highlightStat && !revealed
                ? [[highlightStat, card.atributos[highlightStat] ?? 0] as [QuestionKey, number]]
                : card.perguntas
                    .map(k => [k, card.atributos[k]] as [QuestionKey, number])
                    .filter(([, v]) => v !== undefined)
              ).map(([key, val], idx) => {
                const isHL = key === highlightStat
                const barPct = Math.min(100, (val / (STAT_MAX[key] ?? 100)) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.1em] transition-colors duration-300"
                        style={{ color: isHL && revealed ? R.accent : `${R.text}45` }}
                      >
                        {STAT_SHORT[key] ?? key}
                      </span>
                      <motion.span
                        className="font-black text-[1.15rem] tabular-nums leading-none"
                        style={{
                          fontFamily: 'Oswald, sans-serif',
                          color: isHL && revealed ? R.accent : `${R.text}90`,
                          textShadow: isHL && revealed ? `0 0 18px ${R.accent}` : 'none',
                        }}
                        animate={{ filter: revealed ? 'blur(0px)' : 'blur(9px)' }}
                        transition={{ duration: 0.55, delay: isHL ? 0.0 : 0.22 + idx * 0.07 }}
                      >
                        {val}
                      </motion.span>
                    </div>

                    {/* Bar track */}
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: `${R.accent}14` }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: revealed ? `${barPct}%` : '0%' }}
                        transition={{ duration: 0.85, delay: 0.28 + idx * 0.09, ease: 'easeOut' }}
                        style={{
                          background: isHL && revealed
                            ? `linear-gradient(90deg, ${R.accent}80, ${R.accent})`
                            : `${R.accent}40`,
                          boxShadow: isHL && revealed ? `0 0 10px ${R.accent}90` : 'none',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
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
  const R = RF[card.raridade]

  return (
    <motion.button
      onClick={isOwned ? onTap : undefined}
      whileTap={isOwned ? { scale: 0.91 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        aspectRatio: '2/3',
        display: 'block',
        position: 'relative',
        borderRadius: '9px',
        background: isOwned ? R.frame : '#111',
        padding: '2px',
        boxShadow: isOwned
          ? `2px 2px 0 0 #000, 0 0 14px ${R.glow}40`
          : '2px 2px 0 0 #0A0A0A',
      }}
    >
      {/* Inner */}
      <div
        className="w-full h-full flex flex-col overflow-hidden relative"
        style={{
          borderRadius: '7px',
          background: isOwned ? R.bg : '#0C0C0C',
        }}
      >
        {isOwned ? (
          <>
            <CardShimmer raridade={card.raridade} />

            {/* Ambient radial highlight */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 28%, ${R.accent}22 0%, transparent 68%)`,
              }}
            />

            <div className="relative z-10 flex flex-col h-full p-1.5">
              {/* Rarity micro-badge */}
              <span
                className="text-[7px] font-black uppercase tracking-wider px-[5px] py-[2px] rounded-full self-start leading-tight"
                style={{ color: R.bg, background: R.accent }}
              >
                {card.raridade === 'mitica' ? 'MÍT' : card.raridade === 'epica' ? 'ÉPI' : 'COM'}
              </span>

              {/* Flag centered */}
              <div className="flex-1 flex items-center justify-center">
                <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{card.flag}</span>
              </div>

              {/* Player surname + year */}
              <div>
                <p
                  className="font-black text-[10px] leading-tight truncate"
                  style={{ fontFamily: 'Oswald, sans-serif', color: R.text }}
                >
                  {card.nome.split(' ').at(-1)}
                </p>
                <p className="text-[7px] font-bold" style={{ color: `${R.text}45` }}>
                  {card.ano}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Diagonal hatch texture — hints at rarity */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  ${R.glow}06 0px, ${R.glow}06 1px,
                  transparent 1px, transparent 7px
                )`,
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center border"
                style={{ borderColor: `${R.glow}25`, background: `${R.glow}08` }}
              >
                <span className="text-[11px] font-black" style={{ color: `${R.glow}35` }}>?</span>
              </div>
              {/* Rarity color dot */}
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${R.glow}30` }} />
            </div>
          </>
        )}
      </div>
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
  const [name, setName]     = useState('')
  const [rounds, setRounds] = useState(10)
  const [mode, setMode]     = useState<'solo' | 'online'>('solo')
  const ownedCount = state.museuCards.length

  // Online sub-state
  const online = useOnlineGame()
  const [joinCode, setJoinCode] = useState('')

  // If online game is playing → show online game
  if (online.lobbyStatus === 'playing' && online.gameState) {
    return <OnlineGameRunner api={online} />
  }
  // Waiting room (lobby)
  if (online.lobbyStatus === 'waiting') {
    return <LobbyWaitingRoom api={online} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-5 pt-14" style={{ backgroundColor: C.cream }}>
      <div className="text-center mb-6">
        <BrutalPill color="#FFB800" textColor={C.black}>7A0 GAME STUDIO</BrutalPill>
        <h1 className="font-black text-5xl mt-4 leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
          HISTO-<br />RIADORES<br />DA BOLA
        </h1>
        <p className="text-sm text-black/50 mt-3 font-bold leading-relaxed">
          Chute. Aposte nas costas do amigo.<br />Roube a lenda sem nem saber a resposta.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          {(['solo', 'online'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 border-[3px] border-black rounded-xl font-black text-sm transition-all"
              style={{
                backgroundColor: mode === m ? '#0C0C0C' : '#fff',
                color: mode === m ? '#F4ECD6' : '#0C0C0C',
                boxShadow: mode === m ? '3px 3px 0 0 #FFB800' : 'none',
              }}
            >
              {m === 'solo' ? '🤖 SOLO' : '🌐 ONLINE'}
            </button>
          ))}
        </div>

        <BrutalCard className="p-5 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Seu nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Apelido..."
              maxLength={20}
              className="w-full border-[3px] border-black rounded-xl px-4 py-3 font-bold text-base bg-white focus:outline-none"
              style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
            />
          </div>

          {mode === 'solo' ? (
            <>
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-2">Rodadas</label>
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
                onClick={() => dispatch({ type: 'START_GAME', playerName: name.trim() || 'Você', totalRounds: rounds })}
              >
                JOGAR SOLO →
              </BrutalButton>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-2">Rodadas</label>
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
                color="#0C0C0C"
                textColor="#FFB800"
                onClick={() => online.createRoom(name.trim() || 'Você', rounds)}
                disabled={online.lobbyStatus === 'creating'}
              >
                {online.lobbyStatus === 'creating' ? 'CRIANDO SALA...' : '➕ CRIAR SALA'}
              </BrutalButton>

              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-px bg-black/20" />
                <span className="text-[10px] font-black text-black/40">OU ENTRE COM CÓDIGO</span>
                <div className="flex-1 h-px bg-black/20" />
              </div>

              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="XXXXX"
                  maxLength={5}
                  className="flex-1 border-[3px] border-black rounded-xl px-3 py-3 font-black text-xl bg-white focus:outline-none text-center tracking-widest"
                  style={{ boxShadow: '3px 3px 0 0 #0C0C0C' }}
                />
                <button
                  onClick={() => online.joinRoom(joinCode, name.trim() || 'Você')}
                  disabled={joinCode.length < 5 || online.lobbyStatus === 'joining'}
                  className="border-[3px] border-black rounded-xl px-4 font-black text-sm disabled:opacity-40"
                  style={{ backgroundColor: '#16B89A', color: '#fff', boxShadow: '3px 3px 0 0 #0C0C0C' }}
                >
                  {online.lobbyStatus === 'joining' ? '...' : 'ENTRAR'}
                </button>
              </div>

              {online.errorMsg && (
                <p className="text-xs font-black text-red-600 text-center">{online.errorMsg}</p>
              )}
            </div>
          )}
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
          {mode === 'solo' ? 'vs Tonhão · PC Magrão · Biriba' : 'até 4 jogadores · CPUs completam a mesa'}
        </p>
      </div>
    </div>
  )
}

// ── Lobby: sala de espera ────────────────────────────────────────────
function LobbyWaitingRoom({ api }: { api: ReturnType<typeof useOnlineGame> }) {
  const canStart = api.isHost && api.lobbyPlayers.length >= 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ backgroundColor: C.cream }}>
      <BrutalPill color="#FFB800" textColor={C.black}>SALA ONLINE</BrutalPill>

      {api.isHost && (
        <div className="mt-6 mb-2 text-center">
          <p className="text-xs font-black uppercase tracking-wider text-black/40 mb-1">Código da sala</p>
          <div
            className="border-[3px] border-black rounded-2xl px-8 py-4 inline-block"
            style={{ backgroundColor: '#0C0C0C', boxShadow: '5px 5px 0 0 #FFB800' }}
          >
            <p className="font-black text-5xl tracking-widest" style={{ fontFamily: 'Oswald, sans-serif', color: '#FFB800' }}>
              {api.roomCode}
            </p>
          </div>
          <p className="text-xs font-bold text-black/40 mt-2">Compartilhe este código com os amigos</p>
        </div>
      )}

      {!api.isHost && (
        <div className="mt-6 mb-2 text-center">
          <p className="text-xs font-black uppercase tracking-wider text-black/40 mb-1">Conectado à sala</p>
          <p className="font-black text-3xl tracking-widest" style={{ fontFamily: 'Oswald, sans-serif', color: '#0C0C0C' }}>
            {api.roomCode}
          </p>
          <p className="text-sm font-bold text-black/40 mt-2">Aguardando o host iniciar o jogo...</p>
        </div>
      )}

      <div className="w-full max-w-sm mt-4 space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-black/40">
          Jogadores ({api.lobbyPlayers.length}/4)
        </p>
        {api.lobbyPlayers.map((p: OnlinePlayer) => (
          <div
            key={p.id}
            className="border-[3px] border-black rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: '#fff', boxShadow: '3px 3px 0 0 #0C0C0C' }}
          >
            <span className="text-xl">{p.isHost ? '👑' : '👤'}</span>
            <div>
              <p className="font-black text-sm">{p.nome}</p>
              <p className="text-[10px] font-bold text-black/40">{p.isHost ? 'HOST' : 'JOGADOR'}</p>
            </div>
          </div>
        ))}
        {api.lobbyPlayers.length < 4 && (
          <div className="border-2 border-dashed border-black/20 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-bold text-black/30">
              +{4 - api.lobbyPlayers.length} CPU{4 - api.lobbyPlayers.length !== 1 ? 's' : ''} completarão a mesa
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm mt-5 space-y-3">
        {api.isHost && (
          <BrutalButton
            color="#FFB800"
            textColor={C.black}
            onClick={api.startGame}
            disabled={!canStart}
          >
            INICIAR PARTIDA →
          </BrutalButton>
        )}
        <BrutalButton color="#fff" textColor={C.black} onClick={api.leaveRoom}>
          SAIR DA SALA
        </BrutalButton>
      </div>
    </div>
  )
}

// ── Online game runner: drives game phases via OnlineGameProvider ────
function OnlineGameRunner({ api }: { api: ReturnType<typeof useOnlineGame> }) {
  const st = api.gameState
  if (!st) return null

  if (st.screen === 'results') {
    return (
      <OnlineGameProvider api={api}>
        <OnlineResultsScreen api={api} />
      </OnlineGameProvider>
    )
  }

  return (
    <OnlineGameProvider api={api}>
      {st.phase === 'guessing'  && <GuessingPhase />}
      {st.phase === 'betting'   && <BettingPhase />}
      {st.phase === 'revealing' && <RevealPhase />}
    </OnlineGameProvider>
  )
}

function OnlineResultsScreen({ api }: { api: ReturnType<typeof useOnlineGame> }) {
  const st = api.gameState!
  const myId = api.myPlayerId
  const sorted = [...st.players].sort((a, b) => b.money - a.money)
  const winner = sorted[0]
  const youRank = sorted.findIndex(p => p.id === myId) + 1
  const medals = ['🥇', '🥈', '🥉', '4️⃣']

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="px-5 pt-10 pb-5 text-center">
        <BrutalPill color="#FFB800" textColor={C.black}>PLACAR FINAL · ONLINE</BrutalPill>
        <h1 className="font-black text-4xl mt-3 leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
          {youRank === 1 ? 'VOCÊ GANHOU!' : `${winner.nome} VENCEU!`}
        </h1>
        <p className="text-sm text-black/40 font-bold mt-1">{st.totalRounds} rodadas</p>
      </div>

      <div className="mx-5 space-y-2 mb-5">
        {sorted.map((p, i) => (
          <BrutalCard key={p.id} color={p.id === myId ? '#FFB800' : '#fff'} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{medals[i] ?? ''}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base truncate">
                  {p.nome}{p.id === myId ? ' (você)' : p.isCPU ? ' 🤖' : ''}
                </p>
                <p className="text-xs font-bold text-black/50">{p.cartasIds.length} carta{p.cartasIds.length !== 1 ? 's' : ''}</p>
              </div>
              <p className="font-black text-xl shrink-0" style={{ fontFamily: 'Oswald, sans-serif' }}>${p.money}M</p>
            </div>
          </BrutalCard>
        ))}
      </div>

      <div className="mx-5">
        <BrutalButton color="#FFB800" textColor={C.black} onClick={api.leaveRoom}>
          VOLTAR AO MENU →
        </BrutalButton>
      </div>
    </div>
  )
}

// ── Fase 1: Palpite ───────────────────────────────────────────────
function GuessingPhase() {
  const { state, myPlayerId, submitGuess, alreadyGuessed } = useGameCtx()
  const [guess, setGuess] = useState('')

  const card = getCard(state.currentCardId ?? '')
  const you = state.players.find(p => p.id === myPlayerId) ?? state.players[state.youIdx]
  if (!card || !state.currentQuestion || !you) return null

  const questionLabel = QUESTION_LABELS[state.currentQuestion]?.(card.ano) ?? state.currentQuestion
  const guessNum = parseInt(guess, 10)
  const canSubmit = !alreadyGuessed && !isNaN(guessNum) && guessNum >= 0 && guess !== ''

  function submit() {
    if (!canSubmit) return
    submitGuess(guessNum)
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
          {alreadyGuessed ? (
            <div className="border-[3px] border-black rounded-xl px-4 py-3 text-center"
                 style={{ backgroundColor: '#16B89A' }}>
              <p className="font-black text-sm text-white">✓ Palpite enviado!</p>
              <p className="text-[11px] text-white/70 font-bold mt-0.5">Aguardando outros jogadores...</p>
            </div>
          ) : (
            <BrutalButton color={C.black} textColor={C.cream} disabled={!canSubmit} onClick={submit}>
              CONFIRMAR PALPITE →
            </BrutalButton>
          )}
        </BrutalCard>

        <div className="flex gap-1.5">
          {state.players.map(p => (
            <div
              key={p.id}
              className="flex-1 border-2 border-black rounded-xl p-2 text-center"
              style={{ backgroundColor: p.id === myPlayerId ? '#FFB800' : '#fff' }}
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
  const { state, myPlayerId, submitBet, alreadyBet } = useGameCtx()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [amount, setAmount] = useState(10)

  const you = state.players.find(p => p.id === myPlayerId) ?? state.players[state.youIdx]
  const card = getCard(state.currentCardId ?? '')
  if (!card || !state.currentQuestion || !you) return null

  const questionLabel = QUESTION_LABELS[state.currentQuestion]?.(card.ano)
  const maxAmount = Math.max(1, you.money)
  const safeAmount = Math.min(amount, maxAmount)
  const sortedGuesses = [...state.guesses].sort((a, b) => a.value - b.value)

  function submit() {
    if (!selectedTarget || alreadyBet) return
    submitBet(selectedTarget, safeAmount, Date.now())
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
        {alreadyBet ? (
          <div className="border-[3px] border-black rounded-xl px-4 py-3 text-center"
               style={{ backgroundColor: '#16B89A' }}>
            <p className="font-black text-sm text-white">✓ Aposta enviada!</p>
            <p className="text-[11px] text-white/70 font-bold mt-0.5">Aguardando outros jogadores...</p>
          </div>
        ) : (
          <BrutalButton
            color="#FFB800"
            textColor={C.black}
            disabled={!selectedTarget}
            onClick={submit}
          >
            {selectedTarget ? `APOSTAR ${fmt(safeAmount)} →` : 'SELECIONE UM PALPITE'}
          </BrutalButton>
        )}
      </div>
    </div>
  )
}

// ── Fase 3: Revelação ─────────────────────────────────────────────
function RevealPhase() {
  const { state, myPlayerId, nextCard } = useGameCtx()
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

  // Split bets: apostaram no palpite certo vs. palpite errado
  const betsOnRight  = bets
    .filter(b => b.onPlayerId === winningGuessPlayerId)
    .sort((a, b) => b.amount - a.amount)
  const betsOnWrong  = bets.filter(b => b.onPlayerId !== winningGuessPlayerId)

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: C.cream }}>
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-black/40">
          Revelação · Rodada {state.round}
        </p>
      </div>

      {/* ── BLOCO 1: A Resposta ── */}
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

      {/* ── BLOCO 2: Quem venceu o palpite ── */}
      {winningGuess && (
        <div className="mx-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
            {winningGuess.distance === 0
              ? '🎯 ACERTOU NA MOSCA'
              : !winningGuess.over
              ? 'PALPITE MAIS PRÓXIMO (sem ultrapassar)'
              : 'MENOS ERRADO — todos ultrapassaram o valor'}
          </p>
          <div
            className="border-[3px] border-black rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: '#0C0C0C', boxShadow: '4px 4px 0 0 #FFB800' }}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base">👑</span>
                <p className="font-black text-lg text-white">
                  {playerName(winningGuess.playerId)}
                  {winningGuess.playerId === myPlayerId && <span className="ml-1.5 text-[11px] opacity-50">(você)</span>}
                </p>
              </div>
              <p className="text-xs font-bold ml-6" style={{ color: winningGuess.distance === 0 ? '#FFB800' : winningGuess.over ? '#FF5126' : '#16B89A' }}>
                Chutou {winningGuess.value} · resposta era {realValue}
                {winningGuess.distance === 0
                  ? ' → EXATO! 🎯'
                  : winningGuess.over
                  ? ` → passou por ${winningGuess.distance}`
                  : ` → faltou ${winningGuess.distance}`}
              </p>
            </div>
            {winningGuess.bonus > 0 && (
              <div className="text-right shrink-0 ml-3">
                <p className="font-black text-xl" style={{ color: '#FFB800', fontFamily: 'Oswald, sans-serif' }}>
                  +{fmt(winningGuess.bonus)}
                </p>
                <p className="text-[9px] font-black text-white/40 uppercase">bônus</p>
              </div>
            )}
          </div>
          {/* Mini regra contextual */}
          <p className="text-[10px] text-black/35 font-bold mt-1.5 text-center">
            {!winningGuess.over
              ? 'Regra: mais próximo sem ultrapassar vence. Quem passa perde o bônus.'
              : 'Regra: todos passaram do valor — o menos errado venceu o palpite.'}
          </p>
        </div>
      )}

      {/* ── BLOCO 3: O Leilão Cego ── */}
      <div className="mx-5 mb-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
          O LEILÃO CEGO
        </p>

        {/* Ninguém apostou no certo */}
        {cardWinnerId === null && (
          <div
            className="border-[3px] border-black rounded-xl px-4 py-3 flex items-center gap-2 mb-2"
            style={{ backgroundColor: '#FF5126', boxShadow: '3px 3px 0 0 #0C0C0C' }}
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-black text-sm text-white">Ninguém apostou no palpite certo</p>
              <p className="text-[11px] text-white/70 font-bold mt-0.5">
                Carta volta pro baralho · todos os lances devolvidos
              </p>
            </div>
          </div>
        )}

        {/* Desempate por velocidade */}
        {roundResult.hadTiebreak && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="border-[3px] border-black rounded-xl px-3 py-2 mb-2 flex items-center gap-2"
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

        {/* Quem apostou no palpite certo */}
        {betsOnRight.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {betsOnRight.map(bet => {
              const isCardWinner = bet.playerId === cardWinnerId
              const isYou = bet.playerId === myPlayerId
              return (
                <div
                  key={bet.playerId}
                  className="border-[3px] border-black rounded-xl px-3 py-2.5 flex items-center justify-between"
                  style={{
                    backgroundColor: isCardWinner ? '#FFB800' : '#fff',
                    boxShadow: isCardWinner ? '3px 3px 0 0 #0C0C0C' : '2px 2px 0 0 #0C0C0C',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{isCardWinner ? '🏆' : '✅'}</span>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">
                        {playerName(bet.playerId)}
                        {isYou && <span className="ml-1 text-[10px] opacity-60">(você)</span>}
                      </p>
                      <p className="text-[10px] font-bold text-black/50">
                        Apostou no palpite certo (valor: {winningGuess?.value ?? realValue})
                      </p>
                      <p className="text-[10px] font-black uppercase">
                        {isCardWinner
                          ? 'MAIOR LANCE → GANHOU A CARTA'
                          : 'LANCE SUPERADO → DEVOLVIDO'}
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
        )}

        {/* Quem apostou no palpite errado */}
        {betsOnWrong.length > 0 && (
          <div className="space-y-1.5">
            {betsOnWrong.map(bet => {
              const isYou = bet.playerId === myPlayerId
              const backedGuess = state.guesses.find(g => g.playerId === bet.onPlayerId)
              const backedGuesser = state.players.find(p => p.id === bet.onPlayerId)
              return (
                <div
                  key={bet.playerId}
                  className="border-2 border-black/40 rounded-xl px-3 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: '#F0EAD8' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">❌</span>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate text-black">
                        {playerName(bet.playerId)}
                        {isYou && <span className="ml-1 text-[10px] text-black/50">(você)</span>}
                      </p>
                      <p className="text-[10px] font-bold text-black/60">
                        Apostou no palpite de {backedGuesser?.nome ?? playerName(bet.onPlayerId)} · valor {backedGuess?.value ?? '?'}
                      </p>
                      <p className="text-[10px] font-black uppercase text-red-600">Lance devolvido — palpite errado</p>
                    </div>
                  </div>
                  <p className="font-black text-lg shrink-0 ml-2 text-black/50" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {fmt(bet.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
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

      {/* Ranking de palpites */}
      <div className="mx-5 mb-5">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-black/40">
            RANKING DE PALPITES
          </p>
          <p className="text-[9px] font-bold text-black/30">sem ultrapassar → bônus · quem passa → sem bônus</p>
        </div>
        <div className="space-y-1.5">
          {guessRanks.map((r, i) => {
            const isYou = r.playerId === myPlayerId
            const isWinner = r.playerId === winningGuessPlayerId
            const player = state.players.find(p => p.id === r.playerId)
            return (
              <div
                key={r.playerId}
                className="border-2 border-black rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{
                  backgroundColor: isWinner ? '#0C0C0C' : isYou ? '#fff' : C.cream,
                  boxShadow: isWinner ? '3px 3px 0 0 #FFB800' : isYou ? '2px 2px 0 0 #0C0C0C' : 'none',
                }}
              >
                <span className="text-lg w-7 shrink-0">{medals[i] ?? `${i + 1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm truncate ${isWinner ? 'text-white' : 'text-black'}`}>
                    {playerName(r.playerId)}{isYou ? ' (você)' : ''}
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: isWinner ? '#ffffff80' : undefined }}>
                    Chutou <span className="font-black">{r.value}</span>
                    {r.distance === 0
                      ? <span className="text-green-400 ml-1 font-black">→ EXATO! 🎯</span>
                      : r.over
                      ? <span className="ml-1" style={{ color: '#FF5126' }}>→ passou {r.distance} além</span>
                      : <span className="ml-1" style={{ color: '#16B89A' }}>→ faltou {r.distance}</span>
                    }
                  </p>
                  {r.over && r.rank > 1 && (
                    <p className="text-[9px] font-black uppercase" style={{ color: '#FF5126' }}>Ultrapassou → sem bônus</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.bonus > 0 && (
                    <p className="font-black text-base" style={{ color: '#16B89A' }}>+{fmt(r.bonus)}</p>
                  )}
                  {r.over && (
                    <p className="text-[9px] font-bold text-red-400">sem bônus</p>
                  )}
                  <p className="text-[10px] font-bold" style={{ color: isWinner ? '#ffffff50' : '#00000040' }}>
                    {fmt(player?.money ?? 0)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-5">
        <BrutalButton color={C.black} textColor={C.cream} onClick={nextCard}>
          {isLast ? 'VER PLACAR FINAL →' : 'PRÓXIMA CARTA →'}
        </BrutalButton>
      </div>
    </div>
  )
}

// ── GameScreen — wraps phases in SoloGameProvider ─────────────────
export function GameScreen() {
  const { state } = useHist()
  return (
    <SoloGameProvider>
      {state.phase === 'guessing'  && <GuessingPhase />}
      {state.phase === 'betting'   && <BettingPhase />}
      {state.phase === 'revealing' && <RevealPhase />}
    </SoloGameProvider>
  )
}

// ── ResultsScreen ─────────────────────────────────────────────────
export function ResultsScreen({ myPlayerId = 'you' }: { myPlayerId?: string }) {
  const { state, dispatch } = useHist()
  const sorted = [...state.players].sort((a, b) => b.money - a.money)
  const winner = sorted[0]
  const youRank = sorted.findIndex(p => p.id === myPlayerId) + 1
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
          <BrutalCard key={p.id} color={p.id === myPlayerId ? '#FFB800' : '#fff'} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{medals[i] ?? ''}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base truncate">
                  {p.nome}{p.id === myPlayerId ? ' (você)' : ''}
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
                const R2 = RF[c.raridade]
                return (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded-lg border border-black/30 text-[10px] font-black"
                    style={{ background: R2.bg, color: R2.accent }}
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
