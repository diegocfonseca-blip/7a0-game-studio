// 🌐 CARREIRA ONLINE v2 (19/10) — a SALA: banco (esc_carr_*), canal próprio e quem está aqui.
// Regra do Diego: *"é um modo independente… nada que a gente for fazer dele tem que interferir nos outros modos online"*.
// Por isso: tabelas próprias, canal próprio (`co2:<sala>`), nada de game_rooms/room_players/escalacao:*.
// Mensagens no canal só quando ALGO ACONTECE (fase mudou, alguém apertou PRONTO, gaveta mudou, lance do leilão) —
// nunca periódicas (regra das mensagens do Supabase, `npm run canal`).
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Co2Fase = 'espera' | 'preparo' | 'jogando' | 'virada' | 'fim'
export type Co2Sala = {
  id: string; codigo: string; nome: string; dono: string; vice: string | null; versao: string
  temporada: number; rodada: number; fase: Co2Fase; prazo: string | null; inicio_rodada: string | null
  auto: boolean; velocidade: number; pausado: boolean; comandante: string | null
}
export type Co2Clube = { sala: string; assento: number; user_id: string; nome: string; pronto_rodada: number | null; na_sala_em: string | null; publico?: Record<string, unknown> }
/** O que é de todos e não muda a cada rodada: a ordem dos clubes de gente (uid por posição = id do técnico no jogo). */
export type Co2Mundo = { ordem: string[]; v?: number }

type Snap = { sala: Co2Sala | null; clubes: Co2Clube[]; uid: string | null; aqui: string[]; mundo: Co2Mundo | null }
let snap: Snap = { sala: null, clubes: [], uid: null, aqui: [], mundo: null }
const ouvintes = new Set<() => void>()
const avisa = () => ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
const muda = (p: Partial<Snap>) => { snap = { ...snap, ...p }; avisa() }

export function useCo2(): Snap {
  const [, force] = useState(0)
  useEffect(() => { const f = () => force(n => n + 1); ouvintes.add(f); return () => { ouvintes.delete(f) } }, [])
  return snap
}
export const co2Agora = (): Snap => snap

const COLS_SALA = 'id, codigo, nome, dono, vice, versao, temporada, rodada, fase, prazo, inicio_rodada, auto, velocidade, pausado, comandante'
const COLS_CLUBE = 'sala, assento, user_id, nome, pronto_rodada, na_sala_em'

// ── ganchos que o EscProvider registra (o leilão compartilhado passa por eles) ──────────────────────────────────────
type Ganchos = { aoAcao?: (a: unknown) => void; aoEstado?: (z: string) => void; aoPedirEstado?: () => void }
let ganchos: Ganchos = {}
export function co2Ganchos(g: Ganchos): () => void { ganchos = { ...ganchos, ...g }; return () => { for (const k of Object.keys(g) as (keyof Ganchos)[]) delete ganchos[k] } }

let canal: RealtimeChannel | null = null
let canalSala: string | null = null
let batida: ReturnType<typeof setInterval> | null = null

async function meuUid(): Promise<string | null> {
  if (snap.uid) return snap.uid
  const { data } = await supabase.auth.getUser()
  const uid = data?.user?.id ?? null
  muda({ uid })
  return uid
}

export async function co2RecarregaSala(): Promise<void> {
  if (!canalSala) return
  const { data } = await supabase.from('esc_carr_sala').select(COLS_SALA).eq('id', canalSala).maybeSingle()
  if (data) muda({ sala: data as Co2Sala })
}
export async function co2RecarregaClubes(): Promise<void> {
  if (!canalSala) return
  const { data } = await supabase.from('esc_carr_clube').select(COLS_CLUBE).eq('sala', canalSala).order('assento')
  if (data) muda({ clubes: data as Co2Clube[] })
}
export async function co2LeMundo(): Promise<Co2Mundo | null> {
  if (!canalSala) return null
  const { data } = await supabase.from('esc_carr_sala').select('m:mundo->ordem, v:mundo->v').eq('id', canalSala).maybeSingle()
  const d = data as { m?: string[] | null; v?: number | null } | null
  const mundo = d?.m ? { ordem: d.m, v: d.v ?? undefined } : null
  muda({ mundo })
  return mundo
}
/** As gavetas públicas de todos (só quando precisa: ao entrar e quando alguém avisa que mexeu). */
export async function co2LeGavetas(): Promise<Co2Clube[]> {
  if (!canalSala) return []
  const { data } = await supabase.from('esc_carr_clube').select(COLS_CLUBE + ', publico').eq('sala', canalSala).order('assento')
  return (data ?? []) as unknown as Co2Clube[]
}

export async function co2Abrir(salaId: string): Promise<void> {
  if (canalSala === salaId && canal) return
  co2Fechar()
  canalSala = salaId
  const uid = await meuUid()
  await Promise.all([co2RecarregaSala(), co2RecarregaClubes(), co2LeMundo()])
  const ch = supabase.channel(`co2:${salaId}`, { config: { presence: { key: uid ?? 'anon' }, broadcast: { self: false } } })
  ch.on('broadcast', { event: 'sala' }, () => { void co2RecarregaSala(); void co2LeMundo() })
  ch.on('broadcast', { event: 'clubes' }, () => { void co2RecarregaClubes() })
  ch.on('broadcast', { event: 'acao' }, ({ payload }: { payload: unknown }) => ganchos.aoAcao?.(payload))
  ch.on('broadcast', { event: 'estado' }, ({ payload }: { payload: { z?: string } }) => { if (typeof payload?.z === 'string') ganchos.aoEstado?.(payload.z) })
  ch.on('broadcast', { event: 'pedir_estado' }, () => ganchos.aoPedirEstado?.())
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState() as Record<string, unknown[]>
    muda({ aqui: Object.keys(st) })
  })
  ch.subscribe(st => { if (st === 'SUBSCRIBED') void ch.track({ uid }) })
  canal = ch
  // 🕰️ "na sala" no banco (o vice só assume se o dono não deu sinal há 2 min) — 1 gravação por minuto, só banco
  void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true })
  batida = setInterval(() => { void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true }) }, 60_000)
}
export function co2Fechar(): void {
  if (batida) { clearInterval(batida); batida = null }
  if (canalSala) void supabase.rpc('esc_carr_presenca', { p_sala: canalSala, p_aqui: false })
  try { canal?.unsubscribe() } catch { /* ignora */ }
  canal = null; canalSala = null
  muda({ sala: null, clubes: [], aqui: [], mundo: null })
}
export function co2Envia(event: 'sala' | 'clubes' | 'acao' | 'estado' | 'pedir_estado', payload: unknown = {}): void {
  void canal?.send({ type: 'broadcast', event, payload })
}

// ── funções do banco ────────────────────────────────────────────────────────────────────────────────────────────────
export async function co2PodeCriar(): Promise<boolean> {
  const { data } = await supabase.rpc('esc_carr_pode_criar')
  return data === true
}
export async function co2Criar(nome: string, clube: string): Promise<{ id?: string; codigo?: string; erro?: string }> {
  const { data, error } = await supabase.rpc('esc_carr_criar', { p_nome: nome, p_clube: clube, p_baralho: 'todos', p_versao: '' })
  if (error) return { erro: error.message }
  return data as { id?: string; codigo?: string; erro?: string }
}
export async function co2Entrar(codigo: string, clube: string): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.rpc('esc_carr_entrar', { p_codigo: codigo, p_clube: clube })
  if (error) return { erro: error.message }
  return data as { id?: string; erro?: string }
}
export async function co2MinhasSalas(): Promise<(Co2Sala & { assento: number; meuClube: string })[]> {
  const uid = await meuUid()
  if (!uid) return []
  const { data: meus } = await supabase.from('esc_carr_clube').select('sala, assento, nome').eq('user_id', uid)
  const lista = (meus ?? []) as { sala: string; assento: number; nome: string }[]
  if (!lista.length) return []
  const { data: salas } = await supabase.from('esc_carr_sala').select(COLS_SALA).in('id', lista.map(l => l.sala))
  return ((salas ?? []) as Co2Sala[]).map(s => { const m = lista.find(l => l.sala === s.id)!; return { ...s, assento: m.assento, meuClube: m.nome } })
}
export async function co2Continuar(prazoS = 60): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_continuar', { p_sala: canalSala, p_prazo_s: prazoS })
  return String(data ?? 'erro')
}
export async function co2Mundo(fase: Exclude<Co2Fase, 'espera'>, temporada: number | null, rodada: number | null, mundo: Co2Mundo | null, prazoS: number | null = null): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_mundo', { p_sala: canalSala, p_fase: fase, p_temporada: temporada, p_rodada: rodada, p_mundo: mundo, p_prazo_s: prazoS })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala(); if (mundo) muda({ mundo }) }
  return String(data ?? 'erro')
}
export async function co2Gaveta(publico: Record<string, unknown>): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_gaveta', { p_sala: canalSala, p_publico: publico })
  if (data === 'ok') co2Envia('clubes')
  return String(data ?? 'erro')
}
export async function co2Pronto(rodada: number, escala: Record<string, unknown> = {}): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_pronto', { p_sala: canalSala, p_rodada: rodada, p_escala: escala })
  if (data === 'ok') { co2Envia('clubes'); await co2RecarregaClubes() }
  return String(data ?? 'erro')
}
export async function co2Comecar(): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_comecar', { p_sala: canalSala })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Apito(rodada: number, prazoS = 60): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_apito', { p_sala: canalSala, p_rodada: rodada, p_prazo_s: prazoS })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Ritmo(auto: boolean, velocidade: number, pausado: boolean): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_ritmo', { p_sala: canalSala, p_auto: auto, p_velocidade: velocidade, p_pausado: pausado })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2EncerrarDia(): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_encerrar_dia', { p_sala: canalSala })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Vice(vice: string | null): Promise<string> {
  if (!canalSala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_vice', { p_sala: canalSala, p_vice: vice })
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
/** Gaveta PRIVADA (dinheiro, Agência, estádio, presidência… — o save do MEU clube). Só eu leio e escrevo. */
export async function co2SalvaPrivado(dados: Record<string, unknown>): Promise<boolean> {
  const uid = await meuUid()
  if (!canalSala || !uid) return false
  const { error } = await supabase.from('esc_carr_privado').upsert({ sala: canalSala, user_id: uid, dados, atualizado_em: new Date().toISOString() })
  return !error
}
export async function co2LePrivado(): Promise<Record<string, unknown> | null> {
  const uid = await meuUid()
  if (!canalSala || !uid) return null
  const { data } = await supabase.from('esc_carr_privado').select('dados').eq('sala', canalSala).eq('user_id', uid).maybeSingle()
  return ((data as { dados?: Record<string, unknown> } | null)?.dados) ?? null
}
export const co2SalaAtual = (): string | null => canalSala
