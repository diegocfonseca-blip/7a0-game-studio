import type { Square, PieceSymbol, Color } from 'chess.js'

// ── Time controls ────────────────────────────────────────────────────────
export interface TimeControl {
  id: string
  label: string
  initialMs: number | null   // null = sem tempo
  incrementMs: number
}

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'none',  label: 'Sem tempo', initialMs: null,          incrementMs: 0 },
  { id: '1+0',   label: '1 min',     initialMs: 60_000,        incrementMs: 0 },
  { id: '1+1',   label: '1 + 1',     initialMs: 60_000,        incrementMs: 1_000 },
  { id: '2+1',   label: '2 + 1',     initialMs: 120_000,       incrementMs: 1_000 },
  { id: '3+0',   label: '3 min',     initialMs: 180_000,       incrementMs: 0 },
  { id: '3+2',   label: '3 + 2',     initialMs: 180_000,       incrementMs: 2_000 },
  { id: '5+0',   label: '5 min',     initialMs: 300_000,       incrementMs: 0 },
  { id: '5+3',   label: '5 + 3',     initialMs: 300_000,       incrementMs: 3_000 },
  { id: '10+0',  label: '10 min',    initialMs: 600_000,       incrementMs: 0 },
  { id: '10+5',  label: '10 + 5',    initialMs: 600_000,       incrementMs: 5_000 },
  { id: '15+10', label: '15 + 10',   initialMs: 900_000,       incrementMs: 10_000 },
  { id: '30+0',  label: '30 min',    initialMs: 1_800_000,     incrementMs: 0 },
]

// ── Game configuration ───────────────────────────────────────────────────
export type ColorPref = 'w' | 'b' | 'random'
export type ViewMode = '2d' | '3d'

export interface GameConfig {
  timeId: string           // id from TIME_CONTROLS or 'custom'
  customInitialMin: number
  customIncrementSec: number
  colorPref: ColorPref     // creator's preference
  themeId: string          // default room theme
}

export function resolveTime(cfg: GameConfig): { initialMs: number | null; incrementMs: number } {
  if (cfg.timeId === 'custom') {
    return { initialMs: Math.max(1, cfg.customInitialMin) * 60_000, incrementMs: Math.max(0, cfg.customIncrementSec) * 1_000 }
  }
  const tc = TIME_CONTROLS.find(t => t.id === cfg.timeId) ?? TIME_CONTROLS[0]
  return { initialMs: tc.initialMs, incrementMs: tc.incrementMs }
}

export function timeLabel(cfg: GameConfig): string {
  if (cfg.timeId === 'custom') return `${cfg.customInitialMin} + ${cfg.customIncrementSec}`
  return TIME_CONTROLS.find(t => t.id === cfg.timeId)?.label ?? 'Sem tempo'
}

// ── Moves & match ────────────────────────────────────────────────────────
export interface MoveInput {
  from: Square
  to: Square
  promotion?: PieceSymbol
}

export type EndReason =
  | 'xeque-mate'
  | 'afogamento'
  | 'material insuficiente'
  | 'repetição tripla'
  | 'regra dos 50 lances'
  | 'tempo esgotado'
  | 'desistência'
  | 'empate acordado'
  | 'abandono'

export interface EndInfo {
  result: '1-0' | '0-1' | '1/2-1/2'
  reason: EndReason
  winner: Color | null
}

export interface ChatMsg {
  author: string
  text: string
  ts: number
}

export interface PlayerInfo {
  id: string
  name: string
  online: boolean
}

// ── Online room events ───────────────────────────────────────────────────
export type ChessRoomEvent =
  | { type: 'hello';         payload: { id: string; name: string } }
  | { type: 'start';         payload: { whiteId: string; whiteName: string; blackId: string; blackName: string; config: GameConfig } }
  | { type: 'move';          payload: { id: string; moveIdx: number; move: MoveInput; clockMs: number | null } }
  | { type: 'chat';          payload: ChatMsg & { id: string } }
  | { type: 'resign';        payload: { id: string } }
  | { type: 'flag';          payload: { color: Color } }
  | { type: 'draw_offer';    payload: { id: string } }
  | { type: 'draw_accept';   payload: { id: string } }
  | { type: 'draw_decline';  payload: { id: string } }
  | { type: 'rematch_offer'; payload: { id: string; swap: boolean } }
  | { type: 'rematch_accept';payload: { id: string } }
  | { type: 'leave';         payload: { id: string } }
