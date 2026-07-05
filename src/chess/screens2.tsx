import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Color } from 'chess.js'
import Board from './Board'
import { Shell } from './screens'
import { themeById } from './themes'
import { chessFromMoves, piecesFromHistory, movesFromSans, identifyOpening } from './engine'
import { FAMOUS_GAMES, type FamousGame } from './famous'
import { PERSONA_META, cpuBestMove, type Persona } from './cpu'
import {
  loadCareer, createCareer, resetCareer, careerStats, titleFor, nextTitle,
  genOpponent, type CareerProfile, type CareerOpponent,
} from './career'
import type { MoveInput } from './types'
import type { UserSettings } from './settings'

const UI = {
  gold: '#E8C766', text: '#F2EEE3', subtext: 'rgba(242,238,227,0.55)',
  panel: 'rgba(255,255,255,0.045)', border: 'rgba(232,199,102,0.22)', borderSoft: 'rgba(255,255,255,0.1)',
}

function Card({ children, onClick, highlight = false }: { children: React.ReactNode; onClick?: () => void; highlight?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className="w-full text-left rounded-xl p-4"
      style={{ backgroundColor: UI.panel, border: `1px solid ${highlight ? UI.gold : UI.borderSoft}`, cursor: onClick ? 'pointer' : 'default' }}
      disabled={!onClick}
    >
      {children}
    </motion.button>
  )
}

// ── Static board preview at a given ply ──────────────────────────────────
function MiniReplayBoard({ moves, ply, settings, orientation }: {
  moves: MoveInput[]; ply: number; settings: UserSettings; orientation: Color
}) {
  const theme = themeById(settings.themeId)
  const slice = useMemo(() => moves.slice(0, ply), [moves, ply])
  const chess = useMemo(() => chessFromMoves(slice), [slice])
  const verbose = useMemo(() => chess.history({ verbose: true }), [chess])
  const pieces = useMemo(() => piecesFromHistory(verbose), [verbose])
  const last = verbose.length ? { from: verbose[verbose.length - 1].from, to: verbose[verbose.length - 1].to } : null
  return (
    <Board
      pieces={pieces} orientation={orientation} theme={theme} view="2d"
      animations={settings.animations} showHints={false}
      selected={null} legalTargets={new Set()} lastMove={last} checkSquare={null}
      occupied={new Set()} onSquareClick={() => {}} interactive={false} promotion={null}
    />
  )
}

// ── MODO HISTÓRIA: list ──────────────────────────────────────────────────
export function HistoryListScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (g: FamousGame) => void }) {
  return (
    <Shell onBack={onBack} title="👑 MODO HISTÓRIA">
      <div className="w-full max-w-md space-y-3 pb-6">
        <p className="text-xs -mt-2 mb-1" style={{ color: UI.subtext }}>
          Reviva as partidas mais lendárias já jogadas — ou assuma o tabuleiro e tente mudar a história.
        </p>
        {FAMOUS_GAMES.map(g => (
          <Card key={g.id} onClick={() => onOpen(g)}>
            <div className="flex items-center justify-between">
              <p className="font-black text-base" style={{ color: UI.gold }}>{g.titulo}</p>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: UI.subtext }}>{g.ano}</span>
            </div>
            <p className="text-xs font-bold mt-0.5" style={{ color: UI.text }}>
              ⚪ {g.brancas} × ⚫ {g.pretas}
            </p>
            <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: UI.subtext }}>{g.historia}</p>
          </Card>
        ))}
      </div>
    </Shell>
  )
}

// ── MODO HISTÓRIA: viewer/replayer ───────────────────────────────────────
export function HistoryViewerScreen({ game, settings, onBack, onTakeOver }: {
  game: FamousGame
  settings: UserSettings
  onBack: () => void
  onTakeOver: (initialMoves: MoveInput[], heroColor: Color, game: FamousGame) => void
}) {
  const moves = useMemo(() => movesFromSans(game.sans), [game])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!auto) return
    if (ply >= moves.length) { setAuto(false); return }
    const t = setTimeout(() => setPly(p => Math.min(moves.length, p + 1)), 1100)
    return () => clearTimeout(t)
  }, [auto, ply, moves.length])

  const sanNow = ply > 0 ? game.sans[ply - 1] : null
  const moveNum = Math.ceil(ply / 2)

  const Btn = ({ onClick, children, primary = false, disabled = false }: {
    onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}
            className="px-3 py-2 rounded-lg text-xs font-black transition-all active:scale-95 disabled:opacity-30"
            style={primary
              ? { backgroundColor: UI.gold, color: '#141210' }
              : { backgroundColor: UI.panel, color: UI.text, border: `1px solid ${UI.borderSoft}` }}>
      {children}
    </button>
  )

  return (
    <Shell onBack={onBack} title={game.titulo.toUpperCase()}>
      <div className="w-full max-w-md space-y-3 pb-6">
        <p className="text-xs font-bold text-center" style={{ color: UI.text }}>
          ⚪ {game.brancas} × ⚫ {game.pretas} · {game.local}, {game.ano} · <b style={{ color: UI.gold }}>{game.resultado}</b>
        </p>

        <MiniReplayBoard moves={moves} ply={ply} settings={settings} orientation={game.heroi} />

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <Btn onClick={() => { setAuto(false); setPly(0) }}>⏮</Btn>
          <Btn onClick={() => { setAuto(false); setPly(p => Math.max(0, p - 1)) }}>◀</Btn>
          <Btn primary onClick={() => setAuto(a => !a)}>{auto ? '⏸ Pausar' : '▶ Assistir'}</Btn>
          <Btn onClick={() => { setAuto(false); setPly(p => Math.min(moves.length, p + 1)) }}>▶︎</Btn>
          <Btn onClick={() => { setAuto(false); setPly(moves.length) }}>⏭</Btn>
        </div>
        <p className="text-center text-xs font-bold tabular-nums" style={{ color: UI.subtext }}>
          {ply === 0 ? 'Posição inicial' : `Lance ${moveNum} — ${sanNow}`} · {ply}/{moves.length}
        </p>

        <Card>
          <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: UI.subtext }}>A HISTÓRIA</p>
          <p className="text-xs leading-relaxed" style={{ color: UI.text }}>{game.historia}</p>
        </Card>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onTakeOver(moves.slice(0, ply), game.heroi, game)}
          className="w-full py-3.5 rounded-xl font-black text-sm"
          style={{ background: `linear-gradient(135deg, ${UI.gold} 0%, #B8963E 100%)`, color: '#141210' }}
        >
          ⚔️ MUDAR A HISTÓRIA — assumir as {game.heroi === 'w' ? 'brancas' : 'pretas'} daqui
        </motion.button>
        <p className="text-[10px] text-center leading-snug" style={{ color: UI.subtext }}>
          Você joga como {game.heroi === 'w' ? game.brancas : game.pretas} a partir da posição acima,
          contra a IA no estilo {PERSONA_META[game.vilaoPersona].nome}.
        </p>
      </div>
    </Shell>
  )
}

// ── ESPECTADOR: IA × IA ──────────────────────────────────────────────────
export function ExhibitionScreen({ settings, onBack }: { settings: UserSettings; onBack: () => void }) {
  const personas = Object.keys(PERSONA_META) as Persona[]
  const [pWhite, setPWhite] = useState<Persona>('tal')
  const [pBlack, setPBlack] = useState<Persona>('capablanca')
  const [moves, setMoves] = useState<MoveInput[]>([])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const movesRef = useRef(moves)
  movesRef.current = moves

  const chess = useMemo(() => chessFromMoves(moves), [moves])
  const over = chess.isGameOver()
  const sans = useMemo(() => chess.history(), [chess])

  useEffect(() => {
    if (!playing || over) return
    const t = setTimeout(() => {
      const turnPersona = chessFromMoves(movesRef.current).turn() === 'w' ? pWhite : pBlack
      const mv = cpuBestMove(movesRef.current, 'dificil', turnPersona)
      if (mv) setMoves(prev => [...prev, mv])
      else setPlaying(false)
    }, 900 / speed)
    return () => clearTimeout(t)
  }, [playing, moves.length, over, pWhite, pBlack, speed])

  const result = over
    ? chess.isCheckmate() ? (chess.turn() === 'w' ? '0-1 · xeque-mate' : '1-0 · xeque-mate') : '½-½ · empate'
    : null

  const PersonaPick = ({ value, onPick, label }: { value: Persona; onPick: (p: Persona) => void; label: string }) => (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: UI.subtext }}>{label}</p>
      <select
        value={value}
        onChange={e => { onPick(e.target.value as Persona); setMoves([]); setPlaying(false) }}
        className="w-full rounded-lg px-2 py-2 text-xs font-bold outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: `1px solid ${UI.borderSoft}`, color: UI.text }}
      >
        {personas.map(p => (
          <option key={p} value={p}>{PERSONA_META[p].emoji} {PERSONA_META[p].nome}</option>
        ))}
      </select>
    </div>
  )

  return (
    <Shell onBack={onBack} title="🎬 MESTRES EM AÇÃO">
      <div className="w-full max-w-md space-y-3 pb-6">
        <p className="text-xs -mt-2" style={{ color: UI.subtext }}>
          Assista duas lendas se enfrentarem — cada uma joga no seu estilo real.
        </p>
        <div className="flex gap-2">
          <PersonaPick value={pWhite} onPick={setPWhite} label="⚪ BRANCAS" />
          <PersonaPick value={pBlack} onPick={setPBlack} label="⚫ PRETAS" />
        </div>

        <MiniReplayBoard moves={moves} ply={moves.length} settings={settings} orientation="w" />

        {result ? (
          <p className="text-center font-black text-sm py-2 rounded-xl"
             style={{ backgroundColor: `${UI.gold}22`, border: `1px solid ${UI.gold}`, color: UI.gold }}>
            🏁 {result} — {sans.length} lances
          </p>
        ) : (
          <p className="text-center text-xs font-bold tabular-nums" style={{ color: UI.subtext }}>
            {moves.length === 0 ? 'Pronto para começar' : `Lance ${Math.ceil(moves.length / 2)} · ${sans[sans.length - 1] ?? ''}`}
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPlaying(p => !p)}
                  className="px-4 py-2.5 rounded-lg text-sm font-black"
                  style={{ backgroundColor: UI.gold, color: '#141210' }}>
            {playing ? '⏸ Pausar' : moves.length ? '▶ Continuar' : '▶ Começar'}
          </button>
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
                    className="px-2.5 py-2.5 rounded-lg text-xs font-black"
                    style={{
                      backgroundColor: speed === s ? UI.gold : UI.panel,
                      color: speed === s ? '#141210' : UI.text,
                      border: `1px solid ${UI.borderSoft}`,
                    }}>
              {s}x
            </button>
          ))}
          <button onClick={() => { setMoves([]); setPlaying(false) }}
                  className="px-3 py-2.5 rounded-lg text-xs font-black"
                  style={{ backgroundColor: UI.panel, color: UI.text, border: `1px solid ${UI.borderSoft}` }}>
            🔄
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[pWhite, pBlack].map((p, i) => (
            <Card key={i}>
              <p className="text-xs font-black" style={{ color: UI.gold }}>
                {i === 0 ? '⚪' : '⚫'} {PERSONA_META[p].emoji} {PERSONA_META[p].nome}
              </p>
              <p className="text-[10px] mt-1 leading-snug" style={{ color: UI.subtext }}>{PERSONA_META[p].estilo}</p>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// ── CARREIRA ─────────────────────────────────────────────────────────────
export function CareerScreen({ onBack, onPlay }: {
  onBack: () => void
  onPlay: (opp: CareerOpponent, profile: CareerProfile) => void
}) {
  const [profile, setProfile] = useState<CareerProfile | null>(loadCareer)
  const [name, setName] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  if (!profile) {
    return (
      <Shell onBack={onBack} title="🏆 MODO CARREIRA">
        <div className="w-full max-w-sm space-y-4">
          <Card>
            <p className="text-sm leading-relaxed" style={{ color: UI.text }}>
              Crie seu jogador e comece com <b style={{ color: UI.gold }}>800 de rating</b>.
              Vença partidas ranqueadas, suba o rating e conquiste os títulos até chegar a
              <b style={{ color: UI.gold }}> Grande Mestre</b> (2500).
            </p>
          </Card>
          <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
            <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>NOME DO SEU JOGADOR</p>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
                   placeholder="Seu nome de mestre"
                   className="w-full rounded-lg px-3 py-2.5 text-sm font-bold outline-none"
                   style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
                         onClick={() => setProfile(createCareer(name.trim()))}
                         className="w-full py-3.5 rounded-xl font-black text-base"
                         style={{ background: `linear-gradient(135deg, ${UI.gold} 0%, #B8963E 100%)`, color: '#141210' }}>
            🐣 COMEÇAR CARREIRA
          </motion.button>
        </div>
      </Shell>
    )
  }

  const stats = careerStats(profile)
  const title = titleFor(profile.rating)
  const next = nextTitle(profile.rating)
  const progress = next
    ? Math.min(1, Math.max(0, (profile.rating - (TITLE_FLOOR(next.min))) / (next.min - TITLE_FLOOR(next.min))))
    : 1
  const recent = [...profile.games].slice(-6).reverse()

  return (
    <Shell onBack={onBack} title="🏆 MODO CARREIRA">
      <div className="w-full max-w-md space-y-3 pb-6">
        {/* Profile card */}
        <div className="rounded-2xl p-5 text-center"
             style={{ backgroundColor: UI.panel, border: `2px solid ${UI.border}` }}>
          <span className="text-4xl">{title.emoji}</span>
          <p className="font-black text-xl mt-1" style={{ color: UI.text }}>{profile.name}</p>
          <p className="font-black text-sm" style={{ color: UI.gold }}>{title.nome}</p>
          <p className="font-black text-4xl mt-2 tabular-nums" style={{ color: UI.gold }}>{profile.rating}</p>
          <p className="text-[10px] font-bold" style={{ color: UI.subtext }}>pico: {profile.peak}</p>
          {next && (
            <div className="mt-3">
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${progress * 100}%`, backgroundColor: UI.gold }} />
              </div>
              <p className="text-[10px] font-bold mt-1" style={{ color: UI.subtext }}>
                faltam <b style={{ color: UI.gold }}>{next.min - profile.rating}</b> pontos para {next.emoji} {next.nome}
              </p>
            </div>
          )}
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
                       onClick={() => onPlay(genOpponent(profile.rating), profile)}
                       className="w-full py-4 rounded-xl font-black text-base"
                       style={{ background: `linear-gradient(135deg, ${UI.gold} 0%, #B8963E 100%)`, color: '#141210' }}>
          ⚔️ JOGAR PARTIDA RANQUEADA
        </motion.button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Partidas', String(stats.total)],
            ['Vitórias', String(stats.wins)],
            ['Derrotas', String(stats.losses)],
            ['Empates', String(stats.draws)],
            ['Sequência', stats.streak > 0 ? `🔥 ${stats.streak}` : stats.streak < 0 ? `❄️ ${-stats.streak}` : '—'],
            ['Lances/jogo', String(stats.avgPlies)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl p-2.5 text-center"
                 style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
              <p className="font-black text-lg" style={{ color: UI.gold }}>{v}</p>
              <p className="text-[9px] font-black tracking-wide" style={{ color: UI.subtext }}>{k.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {(stats.bestOpening || stats.worstOpening) && (
          <Card>
            <p className="text-[10px] font-black tracking-widest mb-1.5" style={{ color: UI.subtext }}>SUAS ABERTURAS</p>
            {stats.bestOpening && (
              <p className="text-xs" style={{ color: UI.text }}>
                😎 Melhor: <b style={{ color: UI.gold }}>{stats.bestOpening.name}</b> ({Math.round(stats.bestOpening.score * 100)}% em {stats.bestOpening.games} jogos)
              </p>
            )}
            {stats.worstOpening && (
              <p className="text-xs mt-0.5" style={{ color: UI.text }}>
                😬 Pior: <b>{stats.worstOpening.name}</b> ({Math.round(stats.worstOpening.score * 100)}% em {stats.worstOpening.games} jogos)
              </p>
            )}
          </Card>
        )}

        {recent.length > 0 && (
          <Card>
            <p className="text-[10px] font-black tracking-widest mb-1.5" style={{ color: UI.subtext }}>ÚLTIMAS PARTIDAS</p>
            <div className="space-y-1">
              {recent.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: UI.text }}>
                  <span>{g.result === 'win' ? '✅' : g.result === 'draw' ? '➖' : '❌'}</span>
                  <span className="flex-1 truncate">vs {g.oppName} ({g.oppRating})</span>
                  <span className="tabular-nums font-bold" style={{ color: UI.subtext }}>→ {g.ratingAfter}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <button onClick={() => setConfirmReset(true)} className="w-full text-center text-[11px] font-bold underline"
                style={{ color: UI.subtext }}>
          Recomeçar carreira do zero
        </button>
        {confirmReset && (
          <Card highlight>
            <p className="text-xs font-bold mb-2" style={{ color: UI.text }}>Apagar TODA a carreira e voltar pro 800?</p>
            <div className="flex gap-2">
              <button onClick={() => { resetCareer(); setProfile(null); setConfirmReset(false) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black"
                      style={{ backgroundColor: '#B4453A', color: 'white' }}>Sim, apagar</button>
              <button onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black"
                      style={{ backgroundColor: UI.panel, color: UI.text, border: `1px solid ${UI.borderSoft}` }}>Cancelar</button>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  )
}

// floor of the previous title band (for the progress bar)
function TITLE_FLOOR(nextMin: number): number {
  const mins = [0, 1200, 1600, 2000, 2200, 2400, 2500]
  const idx = mins.indexOf(nextMin)
  return idx > 0 ? mins[idx - 1] : 0
}

export { identifyOpening }
