import { supabase } from '../lib/supabase'
import type { HState } from './types'

// ── Types ────────────────────────────────────────────────────────────
export interface OnlinePlayer {
  id: string       // unique per session (random uuid)
  nome: string
  isHost: boolean
  isCPU: boolean
}

export type RoomChannel = ReturnType<typeof supabase.channel>

// ── Room code generation ─────────────────────────────────────────────
const CODE_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789'
export function generateRoomCode(): string {
  return Array.from({ length: 5 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
}

// ── Supabase CRUD ────────────────────────────────────────────────────
export async function dbCreateRoom(code: string, hostId: string, hostName: string, totalRounds: number) {
  // Clean up stale rooms from this host first
  await supabase.from('hist_rooms').delete().eq('host_id', hostId)
  const { error } = await supabase.from('hist_rooms').insert({
    code,
    host_id: hostId,
    host_name: hostName,
    total_rounds: totalRounds,
    status: 'waiting',
  })
  if (error) throw error
}

export async function dbGetRoom(code: string) {
  const { data, error } = await supabase
    .from('hist_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (error || !data) return null
  return data as {
    code: string
    host_id: string
    host_name: string
    status: string
    total_rounds: number
  }
}

export async function dbSetRoomStatus(code: string, status: 'waiting' | 'playing' | 'finished') {
  await supabase.from('hist_rooms').update({ status }).eq('code', code)
}

export async function dbDeleteRoom(code: string) {
  await supabase.from('hist_rooms').delete().eq('code', code)
}

// ── Channel event types ──────────────────────────────────────────────
export type RoomEvent =
  | { type: 'player_join';  payload: { id: string; nome: string } }
  | { type: 'player_leave'; payload: { id: string } }
  | { type: 'game_start';   payload: Record<string, never> }
  | { type: 'game_state';   payload: { state: HState } }
  | { type: 'guest_guess';  payload: { playerId: string; value: number; timestamp: number } }
  | { type: 'guest_bet';    payload: { playerId: string; onPlayerId: string; amount: number; timestamp: number } }
  | { type: 'guest_next';   payload: Record<string, never> }
  | { type: 'guest_steal';  payload: { requesterId: string; fromPlayerId: string; stolenCardId: string } }

// ── Channel helpers ───────────────────────────────────────────────────
export function getChannel(code: string) {
  return supabase.channel(`hist-room-${code}`, {
    config: { broadcast: { self: false } },
  })
}

export async function sendRoomEvent(channel: RoomChannel, event: RoomEvent) {
  await channel.send({ type: 'broadcast', event: event.type, payload: event.payload })
}
