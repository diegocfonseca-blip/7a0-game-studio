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
export type Co2Mundo = { ordem: string[]; v?: number; /** 🔀 26/11 (Diego): ⚡ Dinâmica = rodadas seguem direto · 🧭 Livre = PRONTO a cada rodada (o padrão de antes) */ modo?: 'dinamica' | 'livre'; /** 🤖 26/11: quantos bots disputam o leilão (0–5, o dono escolhe na largada) */ bots?: number; /** 🌍 27/11 Copa do Mundo única: quem o dono pulou na fila dos convites (sumiu) e os campeões já decididos (pro ranking igual em todo aparelho) */ copaPula?: { season: number; ids: number[] }; copaHist?: { season: number; campeao: string; pais: string }[]; /** 🌎 27/11 Libertadores/Champions únicas: quem o dono pulou na fila dos convites e os títulos carimbados (ranking igual em todo aparelho) */ intlPula?: { season: number; ids: number[] }; intlHist?: import('./co2-internacional').Co2IntlHist[]; /** ⏱️ 27/11: o relógio da vez (o dono carimba quando a vez/fase muda) e as escolhas automáticas (o pior clube; os piores 11 saem do clube, iguais em todo aparelho) */ intlVez?: { season: number; mgrId: number; fase: 'escolha' | 'convoca'; desde: string }; intlAuto?: { season: number; por: Record<number, string | null> }; /** ⏱️ 27/11: o mesmo relógio/automático na Copa do Mundo (seleção carimbada; os piores 11 saem dela) */ copaVez?: { season: number; mgrId: number; fase: 'escolha' | 'convoca'; desde: string }; copaAuto?: { season: number; por: Record<number, string | null> }; /** ⏱️ 27/11 (Diego: *"nas configurações do host p ele escolher os tempos"*): pausa = anúncio/virada · rodada = PRONTO da 🧭 Livre (segundos) */ tempos?: { pausa: number; rodada: number }; /** 🏆 26/11: regras do fim da temporada carimbadas pelo dono (as mesmas em todo aparelho, nunca da conta de cada um) */ fim?: { copaBR: boolean }; /** 🏆 26/11: a escalação da copa do fim, congelada pelo DONO (todo aparelho usa a mesma) */ copaXi?: { season: number; xi: Record<number, string[]> }; /** ⚽🧠 temporada a partir da qual o motor novo decide os jogos de gente (a mesma pra todo aparelho; o dono grava no preparo) */ m2?: number }

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
  // 🐛 26/11: antes lia só ordem/v/m2 — o modo (Dinâmica/Livre), a regra da copa (`fim`) e a escalação congelada da copa
  // (`copaXi`) nunca chegavam nos aparelhos dos amigos. O mundo é pequeno (uids + 20×11 ids): lê inteiro.
  const { data } = await supabase.from('esc_carr_sala').select('mundo').eq('id', canalSala).maybeSingle()
  const d = (data as { mundo?: Co2Mundo | null } | null)?.mundo
  const mundo = d && Array.isArray(d.ordem) ? d : null
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
  void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true }).then(() => {}, () => {})
  batida = setInterval(() => { void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true }).then(() => {}, () => {}) }, 60_000)
}
export function co2Fechar(): void {
  if (batida) { clearInterval(batida); batida = null }
  if (canalSala) void supabase.rpc('esc_carr_presenca', { p_sala: canalSala, p_aqui: false }).then(() => {}, () => {})
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
export async function co2Entrar(codigo: string, clube: string): Promise<{ id?: string; erro?: string; pedido?: boolean; status?: string }> {
  const { data, error } = await supabase.rpc('esc_carr_entrar', { p_codigo: codigo, p_clube: clube })
  if (error) return { erro: error.message }
  return data as { id?: string; erro?: string; pedido?: boolean; status?: string }
}
// 🙋 27/11 (Diego 26/11): carreira já começada = só com plano, pedido aceito pelo dono, e a pessoa entra na VIRADA num clube da
// máquina que o dono escolhe (igual à Liga Draft)
export type Co2Pedido = { user_id: string; nome: string; mgr: number | null; status: 'pedido' | 'aceito' }
export async function co2Pedidos(): Promise<Co2Pedido[]> {
  if (!canalSala) return []
  const { data, error } = await supabase.rpc('esc_carr_pedidos', { p_sala: canalSala })
  return error || !Array.isArray(data) ? [] : (data as Co2Pedido[])
}
export async function co2MeusPedidos(): Promise<{ sala: string; nome: string; status: string; carreira: string }[]> {
  const { data, error } = await supabase.rpc('esc_carr_meu_pedido')
  return error || !Array.isArray(data) ? [] : (data as { sala: string; nome: string; status: string; carreira: string }[])
}
export async function co2PedidoDecide(user: string, mgr: number | null): Promise<string> {
  if (!canalSala) return 'erro'
  const { data, error } = await supabase.rpc('esc_carr_pedido_decide', { p_sala: canalSala, p_user: user, p_mgr: mgr })
  return error ? 'erro' : String(data ?? 'erro')
}
export async function co2PedidoEfetiva(user: string): Promise<string> {
  if (!canalSala) return 'erro'
  const { data, error } = await supabase.rpc('esc_carr_pedido_efetiva', { p_sala: canalSala, p_user: user })
  return error ? 'erro' : String(data ?? 'erro')
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
/** 🔄 26/11: a FOTO da virada (estado do fim do leilão de todos), pra quem faltou alcançar. Só quem comanda grava. */
export async function co2SalvaVirada(temporada: number, z: string): Promise<string> {
  if (!canalSala) return 'erro'
  const { data, error } = await supabase.rpc('esc_carr_virada_salva', { p_sala: canalSala, p_temporada: temporada, p_z: z })
  return error ? 'erro' : String(data ?? 'erro')
}
export async function co2LeVirada(temporada: number): Promise<string | null> {
  if (!canalSala) return null
  const { data, error } = await supabase.rpc('esc_carr_virada_le', { p_sala: canalSala, p_temporada: temporada })
  return error || typeof data !== 'string' ? null : data
}
/** 📸 bancada das fotos/testes (`scripts/foto-co2.mjs`): finge quem sou eu e quem está na sala. Não é usada pelo jogo. */
export function _bancadaCo2(p: Partial<Snap>): void { muda(p) }

/** ⏱️ os tempos que o dono escolheu (padrão 60 s cada). O banco aceita de 15 a 300 s. */
export const TEMPOS_OPCOES = [30, 60, 90, 120, 180] as const
export const tempoPausa = (m: Co2Mundo | null | undefined): number => m?.tempos?.pausa ?? 60
export const tempoRodada = (m: Co2Mundo | null | undefined): number => m?.tempos?.rodada ?? 60
