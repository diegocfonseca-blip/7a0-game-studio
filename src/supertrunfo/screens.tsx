import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSTGame } from './store'
import { ST_CARDS_MAP } from './cards'
import type { Atributo, STCard, STPlayer } from './types'

// ── Attribute metadata ───────────────────────────────────────────────────
const ATTR_META: Record<Atributo, { label: string; emoji: string; color: string; bg: string }> = {
  velocidade:  { label: 'VELOCIDADE',  emoji: '⚡', color: '#E53E3E', bg: '#FFF5F5' },
  drible:      { label: 'DRIBLE',      emoji: '🎭', color: '#276749', bg: '#F0FFF4' },
  finalizacao: { label: 'FINALIZAÇÃO', emoji: '🔥', color: '#2B6CB0', bg: '#EBF8FF' },
  titulos:     { label: 'TÍTULOS',     emoji: '🏆', color: '#B7791F', bg: '#FFFFF0' },
  lendario:    { label: 'LENDÁRIO',    emoji: '⭐', color: '#6B46C1', bg: '#FAF5FF' },
}
const ATTRS: Atributo[] = ['velocidade', 'drible', 'finalizacao', 'titulos', 'lendario']

const TIER_STYLE = {
  deus:   { bg: 'linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #B8860B 100%)', label: 'DEUS', textColor: '#0C0C0C' },
  lenda:  { bg: 'linear-gradient(135deg, #0D6B5A 0%, #16B89A 50%, #0D6B5A 100%)', label: 'LENDA', textColor: '#FFFFFF' },
  craque: { bg: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #4C1D95 100%)', label: 'CRAQUE', textColor: '#FFFFFF' },
}

// ── Stat bar ─────────────────────────────────────────────────────────────
function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

// ── Card front ───────────────────────────────────────────────────────────
function CardFront({
  card,
  chosenAttr,
  isActive,
  isWinner,
  onPick,
}: {
  card: STCard
  chosenAttr: Atributo | null
  isActive: boolean
  isWinner: boolean
  onPick?: (attr: Atributo) => void
}) {
  const tier = TIER_STYLE[card.tier]

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden border-[3px] border-black select-none"
      style={{
        boxShadow: isWinner
          ? '0 0 0 4px #FFB800, 6px 6px 0 0 #0C0C0C'
          : '6px 6px 0 0 #0C0C0C',
        width: '100%',
        maxWidth: 320,
      }}
      animate={isWinner ? { scale: [1, 1.04, 1.02] } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className="p-3 flex items-center justify-between"
        style={{ background: tier.bg }}
      >
        <div>
          <p className="font-black text-[11px] tracking-widest opacity-70" style={{ color: tier.textColor }}>
            {card.pais} {tier.label}
          </p>
          <p className="font-black text-lg leading-tight" style={{ color: tier.textColor, fontFamily: 'Oswald, sans-serif' }}>
            {card.nome}
          </p>
          <p className="text-[11px] font-semibold opacity-70 italic" style={{ color: tier.textColor }}>
            "{card.apelido}"
          </p>
        </div>
        <span className="text-4xl">{card.icon}</span>
      </div>

      {/* Stats */}
      <div className="bg-white">
        {ATTRS.map(attr => {
          const meta = ATTR_META[attr]
          const val = card.atributos[attr]
          const isChosen = attr === chosenAttr
          const tappable = isActive && !chosenAttr && !!onPick

          return (
            <motion.button
              key={attr}
              onClick={() => tappable && onPick?.(attr)}
              disabled={!tappable}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors"
              style={{
                backgroundColor: isChosen ? '#FFB800' : (tappable ? meta.bg : 'white'),
                cursor: tappable ? 'pointer' : 'default',
              }}
              whileHover={tappable ? { backgroundColor: '#FFF3B0' } : {}}
              whileTap={tappable ? { scale: 0.97 } : {}}
            >
              <span className="text-base w-5 text-center">{meta.emoji}</span>
              <span className="text-[11px] font-black tracking-wide flex-1 text-left" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <StatBar value={val} color={isChosen ? '#0C0C0C' : meta.color} />
              <span
                className="font-black text-sm w-8 text-right tabular-nums"
                style={{ color: isChosen ? '#0C0C0C' : meta.color }}
              >
                {val}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Card back ────────────────────────────────────────────────────────────
function CardBack({ label }: { label: string }) {
  return (
    <div
      className="rounded-2xl border-[3px] border-black overflow-hidden flex flex-col items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', boxShadow: '4px 4px 0 0 #0C0C0C', width: '100%', maxWidth: 140, minHeight: 180 }}
    >
      <span className="text-3xl">🃏</span>
      <p className="text-white font-black text-[10px] tracking-widest text-center px-2">{label}</p>
    </div>
  )
}

// ── Player pill (top bar) ────────────────────────────────────────────────
function PlayerPill({ player, isActive }: { player: STPlayer; isActive: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 border-black text-xs font-black"
      style={{
        backgroundColor: isActive ? '#FFB800' : '#F4ECD6',
        boxShadow: isActive ? '3px 3px 0 0 #0C0C0C' : '2px 2px 0 0 #0C0C0C',
      }}
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span>{player.isCPU ? '🤖' : '🧑'}</span>
      <span className="max-w-[80px] truncate">{player.nome}</span>
      <span className="ml-1 opacity-60">({player.deck.length})</span>
    </motion.div>
  )
}

// ── War banner ───────────────────────────────────────────────────────────
function WarBanner({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center py-2 px-4 rounded-xl border-2 border-black font-black text-sm"
      style={{ backgroundColor: '#FF4136', color: 'white', boxShadow: '3px 3px 0 0 #0C0C0C' }}
    >
      ⚔️ EMPATE! GUERRA — {count} carta{count !== 1 ? 's' : ''} em disputa
    </motion.div>
  )
}

// ── Menu ─────────────────────────────────────────────────────────────────
function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-8"
      style={{ backgroundColor: '#F4ECD6' }}
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <span className="text-6xl">🃏</span>
        <h1
          className="font-black text-4xl mt-3 leading-none"
          style={{ fontFamily: 'Oswald, sans-serif', color: '#0C0C0C' }}
        >
          SUPER TRUNFO
        </h1>
        <p className="font-black text-lg" style={{ color: '#FFB800' }}>DAS LENDAS</p>
        <p className="text-sm mt-2 text-black/60 font-medium">40 lendas do futebol mundial</p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-xs space-y-3"
      >
        <motion.button
          onClick={onStart}
          whileTap={{ x: 3, y: 3 }}
          className="w-full py-4 rounded-2xl border-[3px] border-black font-black text-xl"
          style={{ backgroundColor: '#FFB800', boxShadow: '6px 6px 0 0 #0C0C0C', fontFamily: 'Oswald, sans-serif' }}
        >
          ⚔️ JOGAR AGORA
        </motion.button>

        <div
          className="rounded-xl border-2 border-black p-4 text-sm space-y-1.5"
          style={{ backgroundColor: 'white', boxShadow: '3px 3px 0 0 #0C0C0C' }}
        >
          <p className="font-black text-xs tracking-widest text-black/50">COMO JOGAR</p>
          <p>🃏 Cada jogador recebe cartas de lendas</p>
          <p>⭐ Você escolhe o melhor atributo da sua carta</p>
          <p>🏆 Maior valor ganha todas as cartas da rodada</p>
          <p>💀 Ficou sem cartas? Eliminado.</p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Setup ────────────────────────────────────────────────────────────────
function SetupScreen({ onConfirm }: { onConfirm: (name: string, cpus: number) => void }) {
  const [name, setName] = useState('')
  const [cpuCount, setCpuCount] = useState(1)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
      style={{ backgroundColor: '#F4ECD6' }}
    >
      <div className="text-center">
        <span className="text-5xl">⚙️</span>
        <h2 className="font-black text-3xl mt-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
          CONFIGURAR PARTIDA
        </h2>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Name */}
        <div
          className="rounded-xl border-[3px] border-black p-4 space-y-2"
          style={{ backgroundColor: 'white', boxShadow: '4px 4px 0 0 #0C0C0C' }}
        >
          <label className="font-black text-xs tracking-widest text-black/60">SEU NOME</label>
          <input
            type="text"
            placeholder="Como te chamam?"
            maxLength={20}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full font-black text-lg border-2 border-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          />
        </div>

        {/* CPU count */}
        <div
          className="rounded-xl border-[3px] border-black p-4 space-y-3"
          style={{ backgroundColor: 'white', boxShadow: '4px 4px 0 0 #0C0C0C' }}
        >
          <label className="font-black text-xs tracking-widest text-black/60">OPONENTES CPU</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setCpuCount(n)}
                className="flex-1 py-3 rounded-xl border-[3px] border-black font-black text-lg transition-all"
                style={{
                  backgroundColor: cpuCount === n ? '#FFB800' : '#F4ECD6',
                  boxShadow: cpuCount === n ? '3px 3px 0 0 #0C0C0C' : '2px 2px 0 0 #0C0C0C',
                  fontFamily: 'Oswald, sans-serif',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-black/50 font-medium">
            {1 + cpuCount} jogadores · {Math.floor(40 / (1 + cpuCount))} cartas cada
          </p>
        </div>

        <motion.button
          whileTap={{ x: 3, y: 3 }}
          onClick={() => onConfirm(name, cpuCount)}
          className="w-full py-4 rounded-2xl border-[3px] border-black font-black text-xl"
          style={{ backgroundColor: '#0C0C0C', color: '#FFB800', boxShadow: '6px 6px 0 0 #7C3AED', fontFamily: 'Oswald, sans-serif' }}
        >
          🚀 INICIAR BATALHA
        </motion.button>
      </div>
    </div>
  )
}

// ── Game Over ────────────────────────────────────────────────────────────
function GameOverScreen({
  players,
  winnerId,
  roundNum,
  onRestart,
}: {
  players: STPlayer[]
  winnerId: string | null
  roundNum: number
  onRestart: () => void
}) {
  const winner = players.find(p => p.id === winnerId)
  const humanWon = winnerId === 'human'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
      style={{ backgroundColor: humanWon ? '#0C0C0C' : '#F4ECD6' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="text-center space-y-2"
      >
        <span className="text-7xl">{humanWon ? '🏆' : '💀'}</span>
        <h2
          className="font-black text-4xl"
          style={{ fontFamily: 'Oswald, sans-serif', color: humanWon ? '#FFB800' : '#0C0C0C' }}
        >
          {humanWon ? 'VOCÊ VENCEU!' : 'GAME OVER'}
        </h2>
        {winner && (
          <p className="font-semibold" style={{ color: humanWon ? 'white' : '#0C0C0C' }}>
            {humanWon ? `Dominaste em ${roundNum} rodadas!` : `${winner.nome} dominou o jogo`}
          </p>
        )}
      </motion.div>

      {/* Final standings */}
      <div className="w-full max-w-xs space-y-2">
        {[...players]
          .sort((a, b) => b.deck.length - a.deck.length)
          .map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-black font-black"
              style={{
                backgroundColor: p.id === winnerId ? '#FFB800' : 'white',
                boxShadow: '3px 3px 0 0 #0C0C0C',
              }}
            >
              <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '💀'}</span>
              <span className="flex-1">{p.nome}</span>
              <span className="text-sm font-black opacity-60">{p.deck.length} cartas</span>
            </motion.div>
          ))}
      </div>

      <motion.button
        whileTap={{ x: 3, y: 3 }}
        onClick={onRestart}
        className="w-full max-w-xs py-4 rounded-2xl border-[3px] border-black font-black text-xl"
        style={{
          backgroundColor: '#FFB800',
          boxShadow: '6px 6px 0 0 #0C0C0C',
          fontFamily: 'Oswald, sans-serif',
        }}
      >
        🔄 JOGAR DE NOVO
      </motion.button>
    </div>
  )
}

// (PlayingScreen removed — use PlayingScreenFull with props instead)
// We need the root to properly handle the menu → setup → playing flow.
// Let's refactor with local screen state at the top level:
export function SuperTrunfoRoot() {
  const { state, startGame, pickAttr, restart } = useSTGame()
  const [showSetup, setShowSetup] = useState(false)

  if (state.screen === 'playing') {
    return <PlayingScreenFull state={state} pickAttr={pickAttr} restart={restart} />
  }

  if (showSetup) {
    return (
      <SetupScreen
        onConfirm={(name, cpus) => {
          startGame(name, cpus)
          setShowSetup(false)
        }}
      />
    )
  }

  return <MenuScreen onStart={() => setShowSetup(true)} />
}

// ── Full Playing screen (receives state/dispatch as props) ────────────────
function PlayingScreenFull({
  state,
  pickAttr,
  restart,
}: {
  state: ReturnType<typeof useSTGame>['state']
  pickAttr: (a: Atributo) => void
  restart: () => void
}) {
  const { players, activePlayerIdx, phase, chosenAttr, roundCards, warPile, roundWinnerId } = state

  if (phase === 'gameover') {
    return (
      <GameOverScreen
        players={players}
        winnerId={state.gameWinnerId}
        roundNum={state.roundNum}
        onRestart={restart}
      />
    )
  }

  const alive = players.filter(p => !p.isEliminated)
  const activePlayer = players[activePlayerIdx]
  const humanPlayer = players.find(p => p.id === 'human')!
  const isMyTurn = activePlayer?.id === 'human' && phase === 'choose'
  const isRevealing = phase === 'revealing'
  const revealMap = new Map(roundCards.map(rc => [rc.playerId, rc.cardId]))
  const opponents = alive.filter(p => p.id !== 'human')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4ECD6' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black" style={{ backgroundColor: '#0C0C0C' }}>
        <button onClick={restart} className="text-white/50 text-xs font-black">✕ SAIR</button>
        <p className="font-black text-white text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
          RODADA {state.roundNum}
        </p>
        <p className="text-white/50 text-xs font-black">SUPER TRUNFO</p>
      </div>

      {/* Players bar */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b-2 border-black">
        {alive.map(p => (
          <PlayerPill key={p.id} player={p} isActive={p.id === activePlayer?.id} />
        ))}
      </div>

      {/* War banner */}
      {warPile.length > 0 && (
        <div className="px-4 pt-2">
          <WarBanner count={warPile.length} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <AnimatePresence mode="wait">
          {isRevealing ? (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
              <div className="mb-3 text-center">
                {roundWinnerId ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block px-4 py-2 rounded-xl border-2 border-black font-black text-sm"
                    style={{ backgroundColor: '#FFB800', boxShadow: '3px 3px 0 0 #0C0C0C' }}
                  >
                    🏆 {players.find(p => p.id === roundWinnerId)?.nome} ganhou!
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block px-4 py-2 rounded-xl border-2 border-black font-black text-sm"
                    style={{ backgroundColor: '#FF4136', color: 'white', boxShadow: '3px 3px 0 0 #0C0C0C' }}
                  >
                    ⚔️ EMPATE — próxima rodada em guerra!
                  </motion.div>
                )}
              </div>

              <div className={`grid gap-3 ${alive.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {alive.map((p, i) => {
                  const cardId = revealMap.get(p.id)
                  if (!cardId) return null
                  const card = ST_CARDS_MAP[cardId]
                  return (
                    <motion.div key={p.id} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: i * 0.15, duration: 0.4 }}>
                      <p className="font-black text-[10px] tracking-widest text-center mb-1 text-black/50">{p.nome}</p>
                      <CardFront card={card} chosenAttr={chosenAttr} isActive={false} isWinner={p.id === roundWinnerId} />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xs">
              {humanPlayer.deck.length > 0 ? (
                <>
                  <p className="font-black text-xs tracking-widest text-black/50 text-center mb-2">SUA CARTA DO TOPO</p>
                  <CardFront
                    card={ST_CARDS_MAP[humanPlayer.deck[0]]}
                    chosenAttr={null}
                    isActive={isMyTurn}
                    isWinner={false}
                    onPick={isMyTurn ? pickAttr : undefined}
                  />
                  {opponents.length > 0 && (
                    <div className="mt-4">
                      <p className="font-black text-[10px] tracking-widest text-black/40 text-center mb-2">CARTAS DOS OPONENTES</p>
                      <div className="flex gap-2 justify-center">
                        {opponents.map(p => <CardBack key={p.id} label={p.nome} />)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <span className="text-5xl">💀</span>
                  <p className="font-black text-xl mt-3" style={{ fontFamily: 'Oswald, sans-serif' }}>SEM CARTAS</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 border-t-2 border-black text-center" style={{ backgroundColor: isMyTurn ? '#FFB800' : '#0C0C0C' }}>
        <AnimatePresence mode="wait">
          {isMyTurn && <motion.p key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-black">⭐ SUA VEZ — toque em um atributo para jogar</motion.p>}
          {phase === 'cpu_thinking' && <motion.p key="cpu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-white">🤖 {activePlayer?.nome} está escolhendo...</motion.p>}
          {isRevealing && <motion.p key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-white text-sm">{chosenAttr && `${ATTR_META[chosenAttr].emoji} ${ATTR_META[chosenAttr].label} — próxima rodada em breve...`}</motion.p>}
        </AnimatePresence>
      </div>
    </div>
  )
}
