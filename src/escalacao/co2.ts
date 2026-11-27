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

type Snap = { savePendente?: boolean; sala: Co2Sala | null; clubes: Co2Clube[]; uid: string | null; aqui: string[]; mundo: Co2Mundo | null }
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
export function co2AvisoSave(falhou: boolean): void { if (!!snap.savePendente !== falhou) muda({ savePendente: falhou }) }

const COLS_SALA = 'id, codigo, nome, dono, vice, versao, temporada, rodada, fase, prazo, inicio_rodada, auto, velocidade, pausado, comandante'
const COLS_CLUBE = 'sala, assento, user_id, nome, pronto_rodada, na_sala_em'

// ── ganchos que o EscProvider registra (o leilão compartilhado passa por eles) ──────────────────────────────────────
type Ganchos = { aoAcao?: (a: unknown) => void; aoEstado?: (z: string) => void; aoPedirEstado?: () => void }
let ganchos: Ganchos = {}
export function co2Ganchos(g: Ganchos): () => void { ganchos = { ...ganchos, ...g }; return () => { for (const k of Object.keys(g) as (keyof Ganchos)[]) delete ganchos[k] } }

let canal: RealtimeChannel | null = null
let canalSala: string | null = null
let batida: ReturnType<typeof setInterval> | null = null
let geracao = 0
let leituraSala = 0, leituraClubes = 0, leituraMundo = 0
let limpaRetorno: (() => void) | undefined
/** A mesma carreira reaberta também tem outro contexto: respostas da conexão antiga não entram na nova. */
export const co2Contexto = (): string => `${geracao}:${canalSala ?? ''}`
const contextoAtual = (ctx: string): boolean => ctx === co2Contexto() && !!canalSala

async function meuUid(): Promise<string | null> {
  if (snap.uid) return snap.uid
  const ctx = co2Contexto()
  const { data } = await supabase.auth.getUser()
  const uid = data?.user?.id ?? null
  if (ctx === co2Contexto()) muda({ uid })
  return uid
}

export async function co2RecarregaSala(): Promise<void> {
  const sala = canalSala, ctx = co2Contexto(), leitura = ++leituraSala
  if (!sala) return
  try {
    const { data, error } = await supabase.from('esc_carr_sala').select(COLS_SALA).eq('id', sala).maybeSingle()
    if (!error && data && contextoAtual(ctx) && leitura === leituraSala) muda({ sala: data as Co2Sala })
  } catch { /* mantém a última leitura válida; o retorno de conexão consulta de novo */ }
}
export async function co2RecarregaClubes(): Promise<void> {
  const sala = canalSala, ctx = co2Contexto(), leitura = ++leituraClubes
  if (!sala) return
  try {
    const { data, error } = await supabase.from('esc_carr_clube').select(COLS_CLUBE).eq('sala', sala).order('assento')
    if (!error && data && contextoAtual(ctx) && leitura === leituraClubes) muda({ clubes: data as Co2Clube[] })
  } catch { /* mantém os clubes já conhecidos */ }
}
export async function co2LeMundo(): Promise<Co2Mundo | null> {
  const sala = canalSala, ctx = co2Contexto(), leitura = ++leituraMundo
  if (!sala) return null
  try {
    const { data, error } = await supabase.from('esc_carr_sala').select('mundo').eq('id', sala).maybeSingle()
    if (error || !data || !contextoAtual(ctx) || leitura !== leituraMundo) return null
    const d = (data as { mundo?: Co2Mundo | null }).mundo
    const mundo = d && Array.isArray(d.ordem) ? d : null
    if (mundo) muda({ mundo })
    return mundo
  } catch { return null }
}
/** null = consulta falhou; [] = consulta bem-sucedida sem clubes. Nunca simular uma falha como uma lista vazia. */
export async function co2LeGavetasConferidas(): Promise<Co2Clube[] | null> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return null
  try {
    const { data, error } = await supabase.from('esc_carr_clube').select(COLS_CLUBE + ', publico').eq('sala', sala).order('assento')
    return error || !data || !contextoAtual(ctx) ? null : data as unknown as Co2Clube[]
  } catch { return null }
}
export async function co2LeGavetas(): Promise<Co2Clube[]> { return await co2LeGavetasConferidas() ?? [] }

export async function co2Abrir(salaId: string): Promise<void> {
  if (canalSala === salaId && canal) return
  co2Fechar()
  canalSala = salaId
  const ctx = co2Contexto()
  const uid = await meuUid()
  if (!contextoAtual(ctx)) return
  await Promise.all([co2RecarregaSala(), co2RecarregaClubes(), co2LeMundo()])
  if (!contextoAtual(ctx)) return
  const ch = supabase.channel(`co2:${salaId}`, { config: { presence: { key: uid ?? 'anon' }, broadcast: { self: false } } })
  ch.on('broadcast', { event: 'sala' }, () => { if (contextoAtual(ctx)) { void co2RecarregaSala(); void co2LeMundo() } })
  ch.on('broadcast', { event: 'clubes' }, () => { if (contextoAtual(ctx)) void co2RecarregaClubes() })
  ch.on('broadcast', { event: 'acao' }, ({ payload }: { payload: unknown }) => { if (contextoAtual(ctx)) ganchos.aoAcao?.(payload) })
  ch.on('broadcast', { event: 'estado' }, ({ payload }: { payload: { z?: string } }) => { if (contextoAtual(ctx) && typeof payload?.z === 'string') ganchos.aoEstado?.(payload.z) })
  ch.on('broadcast', { event: 'pedir_estado' }, () => { if (contextoAtual(ctx)) ganchos.aoPedirEstado?.() })
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState() as Record<string, unknown[]>
    if (contextoAtual(ctx)) muda({ aqui: Object.keys(st) })
  })
  const retorna = () => {
    if (!contextoAtual(ctx)) return
    void co2RecarregaSala(); void co2RecarregaClubes(); void co2LeMundo()
    co2Envia('pedir_estado')
  }
  canal = ch
  ch.subscribe(st => { if (st === 'SUBSCRIBED' && contextoAtual(ctx)) { void ch.track({ uid }); retorna() } })
  if (typeof window !== 'undefined') {
    const visivel = () => { if (document.visibilityState === 'visible') retorna() }
    window.addEventListener('online', retorna)
    document.addEventListener('visibilitychange', visivel)
    limpaRetorno = () => { window.removeEventListener('online', retorna); document.removeEventListener('visibilitychange', visivel) }
  }
  // 🕰️ Presença no banco (sem vice e sem troca automática de dono) — 1 gravação por minuto, só banco
  void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true }).then(() => {}, () => {})
  batida = setInterval(() => { void supabase.rpc('esc_carr_presenca', { p_sala: salaId, p_aqui: true }).then(() => {}, () => {}) }, 60_000)
}
export function co2Fechar(): void {
  ++geracao
  limpaRetorno?.(); limpaRetorno = undefined
  if (batida) { clearInterval(batida); batida = null }
  if (canalSala) void supabase.rpc('esc_carr_presenca', { p_sala: canalSala, p_aqui: false }).then(() => {}, () => {})
  try { canal?.unsubscribe() } catch { /* ignora */ }
  canal = null; canalSala = null
  muda({ sala: null, clubes: [], uid: null, aqui: [], mundo: null, savePendente: false })
}
export function co2Envia(event: 'sala' | 'clubes' | 'acao' | 'estado' | 'pedir_estado', payload: unknown = {}): void {
  void canal?.send({ type: 'broadcast', event, payload })
}

// ── funções do banco ────────────────────────────────────────────────────────────────────────────────────────────────
export async function co2PodeCriar(): Promise<boolean> {
  const { data } = await supabase.rpc('esc_carr_pode_criar')
  return data === true
}
export async function co2Criar(nome: string, clube: string, baralho: 'br' | 'todos' = 'todos'): Promise<{ id?: string; codigo?: string; erro?: string }> {
  const { data, error } = await supabase.rpc('esc_carr_criar', { p_nome: nome, p_clube: clube, p_baralho: baralho, p_versao: '' })
  if (error) return { erro: error.message }
  return data as { id?: string; codigo?: string; erro?: string }
}
export async function co2Entrar(codigo: string, clube: string): Promise<{ id?: string; erro?: string; pedido?: boolean; status?: string; outra_sala?: string; outra_nome?: string }> {
  const { data, error } = await supabase.rpc('esc_carr_entrar', { p_codigo: codigo, p_clube: clube })
  if (error) return { erro: error.message }
  return data as { id?: string; erro?: string; pedido?: boolean; status?: string; outra_sala?: string; outra_nome?: string }
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
export async function co2PedidoEntra(user: string, mgr: number): Promise<string> {
  if (!canalSala) return 'erro'
  const { data, error } = await supabase.rpc('esc_carr_pedido_entra', { p_sala: canalSala, p_user: user, p_mgr: mgr })
  return error ? 'erro' : String(data ?? 'erro')
}
// 🚪 27/11 (Diego): sem plano, UMA carreira só; quem sai deixa o clube pra máquina (elenco e tudo), e os outros são avisados
export async function co2Sair(sala: string): Promise<string> {
  const { data, error } = await supabase.rpc('esc_carr_sair', { p_sala: sala })
  if (error) return 'erro'
  try { const r = localStorage.getItem('esc-co2-atual'); if (r && (JSON.parse(r) as { sala?: string }).sala === sala) localStorage.removeItem('esc-co2-atual') } catch { /* ignora */ }
  return String(data ?? 'erro')
}
export type Co2Saida = { user_id: string; nome: string; mgr: number | null; em: string; aplicada: boolean }
export async function co2Saidas(): Promise<Co2Saida[]> {
  if (!canalSala) return []
  const { data, error } = await supabase.rpc('esc_carr_saidas', { p_sala: canalSala })
  return error || !Array.isArray(data) ? [] : (data as Co2Saida[])
}
export async function co2SaidaAplicada(mgr: number): Promise<void> {
  if (!canalSala) return
  await supabase.rpc('esc_carr_saida_aplicada', { p_sala: canalSala, p_mgr: mgr }).then(() => {}, () => {})
}
// 🐤 27/11 (Diego): TUITER — a rede da turma. Posts de gente ficam no banco (80 letras, sem link nem palavrão); os automáticos
// (O Martelo, copas, bots) cada aparelho monta pelo mundo da carreira. Leitura só com o TUITER aberto (a cada 60 s).
export type Co2Tuite = { id: number; user_id: string; nome: string; texto: string; resp: number | null; em: string; reacoes: Record<string, number>; minhas: string[]; respostas: number }
export async function co2Tuites(): Promise<Co2Tuite[] | null> {
  if (!canalSala) return null
  const { data, error } = await supabase.rpc('esc_carr_tuites', { p_sala: canalSala })
  return error || !Array.isArray(data) ? null : (data as Co2Tuite[])
}
export async function co2Tuitar(texto: string, resp: number | null): Promise<{ id?: number; erro?: string }> {
  if (!canalSala) return { erro: 'sala' }
  const { data, error } = await supabase.rpc('esc_carr_tuitar', { p_sala: canalSala, p_texto: texto, p_resp: resp })
  return error ? { erro: 'rede' } : (data as { id?: number; erro?: string })
}
export async function co2TuiteReagir(id: number, emoji: string): Promise<string> {
  const { data, error } = await supabase.rpc('esc_carr_tuite_reagir', { p_tuite: id, p_emoji: emoji })
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
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_mundo', { p_sala: sala, p_fase: fase, p_temporada: temporada, p_rodada: rodada, p_mundo: mundo, p_prazo_s: prazoS })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala(); if (mundo && contextoAtual(ctx)) await co2LeMundo() }
  return String(data ?? 'erro')
}
export async function co2Gaveta(publico: Record<string, unknown>): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_gaveta', { p_sala: sala, p_publico: publico })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') co2Envia('clubes')
  return String(data ?? 'erro')
}
export async function co2Pronto(rodada: number, escala: Record<string, unknown> = {}): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_pronto', { p_sala: sala, p_rodada: rodada, p_escala: escala })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('clubes'); await co2RecarregaClubes() }
  return String(data ?? 'erro')
}
export async function co2Comecar(): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_comecar', { p_sala: sala })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Apito(rodada: number, prazoS = 60): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_apito', { p_sala: sala, p_rodada: rodada, p_prazo_s: prazoS })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Ritmo(auto: boolean, velocidade: number, pausado: boolean): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_ritmo', { p_sala: sala, p_auto: auto, p_velocidade: velocidade, p_pausado: pausado })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2EncerrarDia(): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_encerrar_dia', { p_sala: sala })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
export async function co2Vice(vice: string | null): Promise<string> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return 'erro'
  const { data } = await supabase.rpc('esc_carr_vice', { p_sala: sala, p_vice: vice })
  if (!contextoAtual(ctx)) return 'erro'
  if (data === 'ok') { co2Envia('sala'); await co2RecarregaSala() }
  return String(data ?? 'erro')
}
/** Gaveta PRIVADA (dinheiro, Agência, estádio, presidência… — o save do MEU clube). Só eu leio e escrevo. */
export async function co2SalvaPrivado(dados: Record<string, unknown>): Promise<boolean> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return false
  try {
    const uid = await meuUid()
    if (!uid || !contextoAtual(ctx)) return false
    const { error } = await supabase.from('esc_carr_privado').upsert({ sala, user_id: uid, dados, atualizado_em: new Date().toISOString() })
    return !error && contextoAtual(ctx)
  } catch { return false }
}
export async function co2LePrivado(): Promise<Record<string, unknown> | null> {
  const sala = canalSala, ctx = co2Contexto()
  if (!sala) return null
  try {
    const uid = await meuUid()
    if (!uid || !contextoAtual(ctx)) return null
    const { data, error } = await supabase.from('esc_carr_privado').select('dados').eq('sala', sala).eq('user_id', uid).maybeSingle()
    return error || !contextoAtual(ctx) ? null : ((data as { dados?: Record<string, unknown> } | null)?.dados) ?? null
  } catch { return null }
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
