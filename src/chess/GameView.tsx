import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Color, PieceSymbol, Square } from 'chess.js'
import Board, { PieceGlyph } from './Board'
import { themeById, THEMES, type BoardTheme } from './themes'
import {
  chessFromMoves, legalTargets as calcTargets, isPromotion, checkedKingSquare,
  piecesFromHistory, capturedByColor, materialDiff, identifyOpening, fmtClock,
} from './engine'
import type { MoveInput, EndInfo, ChatMsg, PlayerInfo, ViewMode } from './types'
import type { UserSettings } from './settings'
import type { ClockPair } from './clock'
import { play } from './sound'

// ── Controller interface implemented by local & online matches ───────────
export interface MatchController {
  moves: MoveInput[]
  end: EndInfo | null
  clocks: ClockPair
  players: { w: PlayerInfo; b: PlayerInfo }
  myColor: Color | 'both'
  incrementLabel: string
  makeMove: (m: MoveInput) => void
  resign: () => void
  drawOffer: 'incoming' | 'outgoing' | null
  offerDraw: () => void
  respondDraw: (accept: boolean) => void
  rematchOffer: 'incoming' | 'outgoing' | null
  offerRematch: (swap: boolean) => void
  acceptRematch: () => void
  chat: ChatMsg[] | null
  sendChat: ((text: string) => void) | null
  roomCode: string | null
  leave: () => void
}

interface GameViewProps {
  ctl: MatchController
  settings: UserSettings
  onSettings: (patch: Partial<UserSettings>) => void
}

// ── Small UI atoms ───────────────────────────────────────────────────────
function PanelBox({ theme, children, className = '' }: { theme: BoardTheme; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-3 ${className}`}
         style={{ backgroundColor: theme.panel, border: `1px solid ${theme.panelBorder}` }}>
      {children}
    </div>
  )
}

function GoldButton({ theme, onClick, children, subtle = false, danger = false, disabled = false }: {
  theme: BoardTheme; onClick: () => void; children: React.ReactNode; subtle?: boolean; danger?: boolean; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      style={subtle
        ? { backgroundColor: 'transparent', border: `1px solid ${danger ? '#B4453A' : theme.panelBorder}`, color: danger ? '#E07B6E' : theme.text }
        : { backgroundColor: theme.gold, color: '#141210', border: `1px solid ${theme.gold}` }}
    >
      {children}
    </button>
  )
}

function ClockBox({ theme, ms, active, name, avatar, online, captured, matDiff }: {
  theme: BoardTheme; ms: number | null; active: boolean; name: string; avatar: string
  online: boolean; captured: React.ReactNode; matDiff: number
}) {
  const low = ms !== null && ms < 20_000 && ms > 0
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
         style={{
           backgroundColor: active ? 'rgba(255,255,255,0.09)' : theme.panel,
           border: `1px solid ${active ? theme.gold : theme.panelBorder}`,
           boxShadow: active ? `0 0 12px -2px ${theme.gold}55` : undefined,
         }}>
      <span className="text-xl">{avatar}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm truncate" style={{ color: theme.text }}>{name}</p>
          <span className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: online ? '#4ADE80' : '#71717A' }}
                title={online ? 'Online' : 'Desconectado'} />
          {matDiff > 0 && <span className="text-[10px] font-bold" style={{ color: theme.gold }}>+{matDiff}</span>}
        </div>
        <div className="flex items-center min-h-[16px]">{captured}</div>
      </div>
      <p className="font-black text-xl tabular-nums px-2 py-0.5 rounded-md"
         style={{
           color: low ? '#FF6B5B' : theme.text,
           backgroundColor: active ? 'rgba(0,0,0,0.35)' : 'transparent',
           fontFamily: 'ui-monospace, monospace',
         }}>
        {fmtClock(ms)}
      </p>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────
export default function GameView({ ctl, settings, onSettings }: GameViewProps) {
  const theme = themeById(settings.themeId)
  const view: ViewMode = settings.view

  const chess = useMemo(() => chessFromMoves(ctl.moves), [ctl.moves])
  const verbose = useMemo(() => chess.history({ verbose: true }), [chess])
  const sans = useMemo(() => verbose.map(m => m.san), [verbose])

  // review mode: which ply we are looking at (== moves.length → live)
  const [viewPly, setViewPly] = useState<number | null>(null)
  const livePly = ctl.moves.length
  const shownPly = viewPly === null ? livePly : viewPly
  const reviewing = shownPly !== livePly

  const shownChess = useMemo(
    () => reviewing ? chessFromMoves(ctl.moves.slice(0, shownPly)) : chess,
    [reviewing, shownPly, ctl.moves, chess],
  )
  const shownVerbose = useMemo(() => shownChess.history({ verbose: true }), [shownChess])
  const pieces = useMemo(() => piecesFromHistory(shownVerbose), [shownVerbose])

  const lastMove = shownVerbose.length > 0
    ? { from: shownVerbose[shownVerbose.length - 1].from, to: shownVerbose[shownVerbose.length - 1].to }
    : null
  const checkSq = checkedKingSquare(shownChess)
  const occupied = useMemo(() => {
    const s = new Set<string>()
    for (const p of pieces) if (p.square) s.add(p.square)
    return s
  }, [pieces])

  // whose view: online → my color at bottom; local → white at bottom
  const orientation: Color = ctl.myColor === 'both' ? 'w' : ctl.myColor
  const turn = chess.turn()
  const canMove = !ctl.end && !reviewing && (ctl.myColor === 'both' || ctl.myColor === turn)

  // selection & promotion
  const [selected, setSelected] = useState<Square | null>(null)
  const [pendingPromo, setPendingPromo] = useState<{ from: Square; to: Square } | null>(null)
  const targets = useMemo(
    () => (selected ? calcTargets(chess, selected) : new Set<string>()),
    [selected, chess],
  )

  const handleSquare = useCallback((sq: Square) => {
    if (!canMove) return
    if (selected && targets.has(sq)) {
      if (isPromotion(chess, selected, sq)) {
        setPendingPromo({ from: selected, to: sq })
      } else {
        ctl.makeMove({ from: selected, to: sq })
      }
      setSelected(null)
      return
    }
    const piece = chess.get(sq)
    if (piece && piece.color === turn && (ctl.myColor === 'both' || piece.color === ctl.myColor)) {
      setSelected(prev => prev === sq ? null : sq)
    } else {
      setSelected(null)
    }
  }, [canMove, selected, targets, chess, turn, ctl])

  const pickPromotion = useCallback((p: PieceSymbol) => {
    if (pendingPromo) ctl.makeMove({ ...pendingPromo, promotion: p })
    setPendingPromo(null)
  }, [pendingPromo, ctl])

  // captured pieces + material
  const { byWhite, byBlack } = useMemo(() => capturedByColor(piecesFromHistory(verbose)), [verbose])
  const mat = useMemo(() => materialDiff(piecesFromHistory(verbose)), [verbose])
  const opening = useMemo(() => identifyOpening(sans), [sans])

  const capturedRow = (list: typeof byWhite) => (
    <span className="flex flex-wrap text-[13px] leading-none" style={{ opacity: 0.85 }}>
      {list.map(p => <PieceGlyph key={p.id} type={p.type} color={p.color} theme={theme} sizePct={100} />)}
    </span>
  )

  // panels: top = opponent (relative to orientation)
  const topColor: Color = orientation === 'w' ? 'b' : 'w'
  const botColor: Color = orientation

  // chat
  const [chatText, setChatText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ctl.chat?.length])

  // history autoscroll
  const histEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!reviewing) histEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [sans.length, reviewing])

  // ── sounds ──
  const prevPly = useRef(0)
  useEffect(() => {
    if (livePly > prevPly.current && verbose.length > 0) {
      const last = verbose[verbose.length - 1]
      if (chess.inCheck()) play('check', settings.sound)
      else if (last.captured || last.flags.includes('e')) play('capture', settings.sound)
      else play('move', settings.sound)
    }
    prevPly.current = livePly
  }, [livePly, verbose, chess, settings.sound])

  const endPlayed = useRef(false)
  useEffect(() => {
    if (ctl.end && !endPlayed.current) {
      endPlayed.current = true
      play('end', settings.sound)
    }
    if (!ctl.end) endPlayed.current = false
  }, [ctl.end, settings.sound])

  const lowWarned = useRef<{ w: boolean; b: boolean }>({ w: false, b: false })
  useEffect(() => {
    (['w', 'b'] as Color[]).forEach(c => {
      const ms = ctl.clocks[c]
      if (ms !== null && ms > 0 && ms < 15_000 && !lowWarned.current[c] && !ctl.end) {
        lowWarned.current[c] = true
        play('lowTime', settings.sound)
      }
      if (ms !== null && ms > 20_000) lowWarned.current[c] = false
    })
  }, [ctl.clocks, ctl.end, settings.sound])

  const prevChatLen = useRef(0)
  useEffect(() => {
    const len = ctl.chat?.length ?? 0
    if (len > prevChatLen.current && prevChatLen.current > 0) play('chat', settings.sound)
    prevChatLen.current = len
  }, [ctl.chat?.length, settings.sound])

  // confirms
  const [confirm, setConfirm] = useState<'resign' | 'leave' | null>(null)
  const [showEnd, setShowEnd] = useState(true)
  useEffect(() => { if (ctl.end) setShowEnd(true) }, [ctl.end])
  const [showThemes, setShowThemes] = useState(false)

  // copy feedback
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const copy = (what: 'code' | 'link') => {
    if (!ctl.roomCode) return
    const link = `${window.location.origin}${import.meta.env.BASE_URL}?sala=${ctl.roomCode}`
    navigator.clipboard.writeText(what === 'code' ? ctl.roomCode : link).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  // mobile tab
  const [tab, setTab] = useState<'lances' | 'chat'>('lances')

  const rows: Array<{ n: number; w?: string; b?: string; wPly: number; bPly: number }> = []
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: sans[i], b: sans[i + 1], wPly: i + 1, bPly: i + 2 })
  }

  const moveList = (
    <div className="overflow-y-auto text-sm" style={{ maxHeight: '260px' }}>
      {opening && (
        <p className="text-[11px] font-semibold mb-2 pb-2"
           style={{ color: theme.gold, borderBottom: `1px solid ${theme.panelBorder}` }}>
          📖 {opening}
        </p>
      )}
      {rows.length === 0 && <p className="text-xs" style={{ color: theme.subtext }}>Nenhum lance ainda.</p>}
      <div className="grid gap-y-0.5" style={{ gridTemplateColumns: '2rem 1fr 1fr' }}>
        {rows.map(r => (
          <div key={r.n} className="contents">
            <span className="text-xs py-0.5" style={{ color: theme.subtext }}>{r.n}.</span>
            <button onClick={() => setViewPly(r.wPly === livePly ? null : r.wPly)}
                    className="text-left px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      color: theme.text,
                      backgroundColor: shownPly === r.wPly ? `${theme.gold}33` : 'transparent',
                    }}>
              {r.w}
            </button>
            {r.b ? (
              <button onClick={() => setViewPly(r.bPly === livePly ? null : r.bPly)}
                      className="text-left px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        color: theme.text,
                        backgroundColor: shownPly === r.bPly ? `${theme.gold}33` : 'transparent',
                      }}>
                {r.b}
              </button>
            ) : <span />}
          </div>
        ))}
      </div>
      <div ref={histEndRef} />
    </div>
  )

  const reviewBar = (
    <div className="flex items-center justify-center gap-1.5 mt-2">
      <GoldButton theme={theme} subtle onClick={() => setViewPly(0)}>⏮</GoldButton>
      <GoldButton theme={theme} subtle onClick={() => setViewPly(Math.max(0, shownPly - 1))}>◀</GoldButton>
      <span className="text-xs font-bold px-2 tabular-nums" style={{ color: theme.subtext }}>
        {shownPly}/{livePly}
      </span>
      <GoldButton theme={theme} subtle onClick={() => setViewPly(shownPly + 1 >= livePly ? null : shownPly + 1)}>▶</GoldButton>
      <GoldButton theme={theme} subtle onClick={() => setViewPly(null)}>⏭</GoldButton>
    </div>
  )

  const chatBox = ctl.chat !== null && (
    <div className="flex flex-col" style={{ height: '220px' }}>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {ctl.chat.length === 0 && <p className="text-xs" style={{ color: theme.subtext }}>Diga um oi pro seu rival…</p>}
        {ctl.chat.map((m, i) => (
          <div key={i} className="text-xs leading-snug">
            <span className="font-bold" style={{ color: theme.gold }}>{m.author}</span>
            <span className="ml-1.5 text-[10px]" style={{ color: theme.subtext }}>
              {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <p style={{ color: theme.text }}>{m.text}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form
        className="flex gap-1.5 mt-2"
        onSubmit={e => {
          e.preventDefault()
          const t = chatText.trim()
          if (t && ctl.sendChat) { ctl.sendChat(t); setChatText('') }
        }}
      >
        <input
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          maxLength={200}
          placeholder="Mensagem…"
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.panelBorder}`, color: theme.text }}
        />
        <GoldButton theme={theme} onClick={() => {}}>➤</GoldButton>
      </form>
    </div>
  )

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {!ctl.end && (
        <>
          <GoldButton theme={theme} subtle danger onClick={() => setConfirm('resign')}>🏳️ Render-se</GoldButton>
          <GoldButton theme={theme} subtle disabled={ctl.drawOffer !== null} onClick={ctl.offerDraw}>
            {ctl.drawOffer === 'outgoing' ? '½ Proposto…' : '½ Propor empate'}
          </GoldButton>
        </>
      )}
      {ctl.end && (
        <GoldButton theme={theme} onClick={() => ctl.offerRematch(true)}>
          {ctl.rematchOffer === 'outgoing' ? '⏳ Revanche pedida…' : '🔄 Revanche'}
        </GoldButton>
      )}
      <GoldButton theme={theme} subtle onClick={() => setShowThemes(true)}>🎨 Tema</GoldButton>
      <GoldButton theme={theme} subtle onClick={() => onSettings({ view: view === '2d' ? '3d' : '2d' })}>
        {view === '2d' ? '🎲 3D' : '▦ 2D'}
      </GoldButton>
      <GoldButton theme={theme} subtle danger onClick={() => setConfirm('leave')}>🚪 Sair</GoldButton>
    </div>
  )

  const endInfo = ctl.end
  const winnerName = endInfo?.winner ? ctl.players[endInfo.winner].name : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: `1px solid ${theme.panelBorder}` }}>
        <p className="font-black tracking-widest text-sm" style={{ color: theme.gold, fontFamily: 'Oswald, sans-serif' }}>
          ♞ CHESS LEGENDS
        </p>
        {ctl.roomCode && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-[0.2em] px-2 py-1 rounded-md"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: theme.gold, border: `1px solid ${theme.panelBorder}` }}>
              {ctl.roomCode}
            </span>
            <GoldButton theme={theme} subtle onClick={() => copy('code')}>{copied === 'code' ? '✓' : '⧉ Código'}</GoldButton>
            <GoldButton theme={theme} subtle onClick={() => copy('link')}>{copied === 'link' ? '✓' : '🔗 Link'}</GoldButton>
          </div>
        )}
        {!ctl.roomCode && (
          <span className="text-xs font-bold" style={{ color: theme.subtext }}>Partida local · {ctl.incrementLabel}</span>
        )}
      </header>

      <div className="flex-1 w-full max-w-6xl mx-auto px-3 py-3 lg:py-5 grid gap-4 items-start"
           style={{ gridTemplateColumns: '1fr' }}>
        <div className="lg:grid lg:gap-4 lg:items-start" style={{ gridTemplateColumns: '240px 1fr 240px' }}>

          {/* ── Left panel (desktop) ── */}
          <div className="hidden lg:flex flex-col gap-3">
            <PanelBox theme={theme}>
              <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: theme.subtext }}>JOGADORES</p>
              <div className="space-y-2">
                <ClockBox theme={theme} ms={ctl.clocks[topColor]} active={turn === topColor && !ctl.end}
                          name={ctl.players[topColor].name} avatar={topColor === 'w' ? '⚪' : '⚫'}
                          online={ctl.players[topColor].online}
                          captured={capturedRow(topColor === 'w' ? byWhite : byBlack)}
                          matDiff={topColor === 'w' ? Math.max(0, mat) : Math.max(0, -mat)} />
                <ClockBox theme={theme} ms={ctl.clocks[botColor]} active={turn === botColor && !ctl.end}
                          name={ctl.players[botColor].name} avatar={botColor === 'w' ? '⚪' : '⚫'}
                          online={ctl.players[botColor].online}
                          captured={capturedRow(botColor === 'w' ? byWhite : byBlack)}
                          matDiff={botColor === 'w' ? Math.max(0, mat) : Math.max(0, -mat)} />
              </div>
            </PanelBox>
            {ctl.chat !== null && (
              <PanelBox theme={theme}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: theme.subtext }}>CHAT DA SALA</p>
                {chatBox}
              </PanelBox>
            )}
          </div>

          {/* ── Center: board ── */}
          <div className="flex flex-col gap-2">
            {/* mobile: opponent clock above board */}
            <div className="lg:hidden">
              <ClockBox theme={theme} ms={ctl.clocks[topColor]} active={turn === topColor && !ctl.end}
                        name={ctl.players[topColor].name} avatar={topColor === 'w' ? '⚪' : '⚫'}
                        online={ctl.players[topColor].online}
                        captured={capturedRow(topColor === 'w' ? byWhite : byBlack)}
                        matDiff={topColor === 'w' ? Math.max(0, mat) : Math.max(0, -mat)} />
            </div>

            <Board
              pieces={pieces}
              orientation={orientation}
              theme={theme}
              view={view}
              animations={settings.animations}
              showHints={settings.showHints}
              selected={selected}
              legalTargets={targets}
              lastMove={lastMove}
              checkSquare={checkSq}
              occupied={occupied}
              onSquareClick={handleSquare}
              interactive={canMove}
              promotion={pendingPromo ? {
                color: turn,
                onPick: pickPromotion,
                onCancel: () => setPendingPromo(null),
              } : null}
            />

            {reviewing && (
              <p className="text-center text-[11px] font-bold" style={{ color: theme.gold }}>
                Revisando lance {shownPly} de {livePly} — clique ⏭ para voltar ao vivo
              </p>
            )}

            <div className="lg:hidden">
              <ClockBox theme={theme} ms={ctl.clocks[botColor]} active={turn === botColor && !ctl.end}
                        name={ctl.players[botColor].name} avatar={botColor === 'w' ? '⚪' : '⚫'}
                        online={ctl.players[botColor].online}
                        captured={capturedRow(botColor === 'w' ? byWhite : byBlack)}
                        matDiff={botColor === 'w' ? Math.max(0, mat) : Math.max(0, -mat)} />
            </div>

            {controls}

            {/* draw offer banner */}
            <AnimatePresence>
              {ctl.drawOffer === 'incoming' && !ctl.end && (
                <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"
                            style={{ backgroundColor: `${theme.gold}22`, border: `1px solid ${theme.gold}`, color: theme.text }}>
                  ½ Seu rival propôs empate.
                  <GoldButton theme={theme} onClick={() => ctl.respondDraw(true)}>Aceitar</GoldButton>
                  <GoldButton theme={theme} subtle onClick={() => ctl.respondDraw(false)}>Recusar</GoldButton>
                </motion.div>
              )}
              {ctl.rematchOffer === 'incoming' && (
                <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"
                            style={{ backgroundColor: `${theme.gold}22`, border: `1px solid ${theme.gold}`, color: theme.text }}>
                  🔄 Seu rival quer revanche!
                  <GoldButton theme={theme} onClick={ctl.acceptRematch}>Bora</GoldButton>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Mobile tabs: lances / chat ── */}
            <div className="lg:hidden">
              <div className="flex gap-1 mb-2">
                <button onClick={() => setTab('lances')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-black tracking-wide"
                        style={{
                          backgroundColor: tab === 'lances' ? theme.gold : theme.panel,
                          color: tab === 'lances' ? '#141210' : theme.subtext,
                          border: `1px solid ${theme.panelBorder}`,
                        }}>
                  LANCES
                </button>
                {ctl.chat !== null && (
                  <button onClick={() => setTab('chat')}
                          className="flex-1 py-1.5 rounded-lg text-xs font-black tracking-wide"
                          style={{
                            backgroundColor: tab === 'chat' ? theme.gold : theme.panel,
                            color: tab === 'chat' ? '#141210' : theme.subtext,
                            border: `1px solid ${theme.panelBorder}`,
                          }}>
                    CHAT
                  </button>
                )}
              </div>
              <PanelBox theme={theme}>
                {tab === 'lances' ? <>{moveList}{reviewBar}</> : chatBox}
              </PanelBox>
            </div>
          </div>

          {/* ── Right panel (desktop) ── */}
          <div className="hidden lg:flex flex-col gap-3">
            <PanelBox theme={theme}>
              <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: theme.subtext }}>
                {ctl.end ? 'ANÁLISE PÓS-JOGO' : 'HISTÓRICO DE LANCES'}
              </p>
              {moveList}
              {reviewBar}
            </PanelBox>
            {ctl.end && (
              <PanelBox theme={theme}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: theme.subtext }}>RESUMO</p>
                <div className="text-xs space-y-1" style={{ color: theme.text }}>
                  <p>Resultado: <b style={{ color: theme.gold }}>{endInfo!.result}</b></p>
                  <p>Motivo: <b>{endInfo!.reason}</b></p>
                  <p>Lances: <b>{Math.ceil(sans.length / 2)}</b></p>
                  <p>⏱ Brancas: <b>{fmtClock(ctl.clocks.w)}</b> · Pretas: <b>{fmtClock(ctl.clocks.b)}</b></p>
                </div>
              </PanelBox>
            )}
          </div>
        </div>
      </div>

      {/* ── End overlay ── */}
      <AnimatePresence>
        {endInfo && showEnd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 flex items-center justify-center p-4"
                      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.85, y: 16 }} animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', bounce: 0.35 }}
                        className="w-full max-w-sm rounded-2xl p-6 text-center"
                        style={{ background: theme.bg, border: `2px solid ${theme.gold}` }}>
              <span className="text-5xl">
                {endInfo.result === '1/2-1/2' ? '🤝' : (ctl.myColor !== 'both' && endInfo.winner === ctl.myColor) ? '🏆' : endInfo.winner ? '👑' : '🤝'}
              </span>
              <h2 className="font-black text-2xl mt-2" style={{ color: theme.gold, fontFamily: 'Oswald, sans-serif' }}>
                {endInfo.result === '1/2-1/2'
                  ? 'EMPATE'
                  : ctl.myColor === 'both'
                    ? `${winnerName} VENCEU`
                    : endInfo.winner === ctl.myColor ? 'VOCÊ VENCEU!' : 'VOCÊ PERDEU'}
              </h2>
              <p className="text-sm mt-1 capitalize" style={{ color: theme.subtext }}>
                {endInfo.result} · {endInfo.reason}
              </p>
              <div className="text-xs mt-3 space-y-0.5" style={{ color: theme.subtext }}>
                <p>{Math.ceil(sans.length / 2)} lances{opening ? ` · ${opening}` : ''}</p>
                <p>⏱ restante — ⚪ {fmtClock(ctl.clocks.w)} · ⚫ {fmtClock(ctl.clocks.b)}</p>
              </div>
              <div className="flex flex-col gap-2 mt-5">
                <GoldButton theme={theme} onClick={() => ctl.offerRematch(true)}>
                  {ctl.rematchOffer === 'outgoing' ? '⏳ Aguardando rival…' : '🔄 Pedir revanche (trocar cores)'}
                </GoldButton>
                <GoldButton theme={theme} subtle onClick={() => ctl.offerRematch(false)}>
                  ♟ Nova partida com mesmas cores
                </GoldButton>
                <GoldButton theme={theme} subtle onClick={() => { setShowEnd(false); setViewPly(0) }}>
                  🔍 Revisar lance por lance
                </GoldButton>
                <GoldButton theme={theme} subtle danger onClick={ctl.leave}>🚪 Sair da sala</GoldButton>
              </div>
              {ctl.rematchOffer === 'incoming' && (
                <div className="mt-3">
                  <GoldButton theme={theme} onClick={ctl.acceptRematch}>✅ Rival quer revanche — aceitar!</GoldButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm dialogs ── */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                      onClick={() => setConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="rounded-2xl p-5 text-center max-w-xs w-full"
                        style={{ background: theme.bg, border: `1px solid ${theme.panelBorder}` }}
                        onClick={e => e.stopPropagation()}>
              <p className="font-bold text-sm mb-4" style={{ color: theme.text }}>
                {confirm === 'resign' ? 'Render-se e entregar a partida?' : 'Sair da sala e abandonar a partida?'}
              </p>
              <div className="flex gap-2 justify-center">
                <GoldButton theme={theme} onClick={() => {
                  if (confirm === 'resign') ctl.resign()
                  else ctl.leave()
                  setConfirm(null)
                }}>Sim</GoldButton>
                <GoldButton theme={theme} subtle onClick={() => setConfirm(null)}>Cancelar</GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Theme picker ── */}
      <AnimatePresence>
        {showThemes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                      onClick={() => setShowThemes(false)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }}
                        className="rounded-2xl p-5 max-w-md w-full"
                        style={{ background: theme.bg, border: `1px solid ${theme.panelBorder}` }}
                        onClick={e => e.stopPropagation()}>
              <p className="font-black text-sm tracking-widest mb-1" style={{ color: theme.gold }}>ESCOLHA SEU TEMA</p>
              <p className="text-[11px] mb-3" style={{ color: theme.subtext }}>
                Só muda na sua tela — seu rival vê o tema dele.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => (
                  <button key={t.id}
                          onClick={() => { onSettings({ themeId: t.id }); setShowThemes(false) }}
                          className="rounded-xl p-2.5 text-left transition-transform hover:scale-[1.03]"
                          style={{
                            backgroundColor: theme.panel,
                            border: `2px solid ${settings.themeId === t.id ? theme.gold : theme.panelBorder}`,
                          }}>
                    <div className="flex rounded overflow-hidden mb-1.5" style={{ height: 22 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex-1" style={{ backgroundColor: i % 2 === 0 ? t.light : t.dark }} />
                      ))}
                    </div>
                    <p className="text-xs font-bold" style={{ color: theme.text }}>{t.emoji} {t.nome}</p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: theme.subtext }}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
