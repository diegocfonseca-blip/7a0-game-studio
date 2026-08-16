// 🎽 MANTO DO CORAÇÃO + personalização do sócio (manto/estádio/mascote).
// Fonte OFICIAL: esc_socios no Supabase (Diego seta pelo painel via
// esc_admin_socio_perso). A lista no código vira reserva (beta da conta do
// Diego). A fichinha branca do campinho FICA como é — o coração entra como
// FAIXINHA LISTRADA no topo + barrinha de título, nas cores do clube que o
// dono torce. ⚠️ Nome/escudo de clube REAL nunca aparece: só as CORES.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail } from './apoio'

// reserva no código (beta) — conta → [cor1, cor2]
export const MANTO_CONTAS: Record<string, [string, string]> = {
  'diego.c.fonseca@gmail.com': ['#C2452F', '#141414'], // ❤️🖤 vermelho e preto
  'adriano.ferrari@quepazseguros.com.br': ['#C2452F', '#141414'], // 🏎️ Ferrari SC — vermelho e preto
}

// cache do MEU sócio (mesmo padrão do myEmail do apoio: pontos de uso são
// síncronos, então mantemos o valor vivo via auth listener)
export interface MeuSocio { socioN: number | null; ativo: boolean; origem: string | null; manto: [string, string] | null; estadioNome: string | null; mascoteKey: string | null }
let meu: MeuSocio | null = null
const listeners = new Set<() => void>()
async function fetchMeuSocio() {
  meu = null
  try {
    const { data } = await supabase.rpc('esc_meu_socio')
    const r = (Array.isArray(data) ? data[0] : data) as { socio_n?: number; ativo?: boolean; origem?: string; manto_c1?: string | null; manto_c2?: string | null; estadio_nome?: string | null; mascote_key?: string | null } | undefined
    if (r) meu = {
      socioN: r.socio_n ?? null, ativo: !!r.ativo, origem: r.origem ?? null,
      manto: r.manto_c1 && r.manto_c2 ? [r.manto_c1, r.manto_c2] : null,
      estadioNome: r.estadio_nome ?? null, mascoteKey: r.mascote_key ?? null,
    }
  } catch { /* sem rede — fica na reserva do código */ }
  listeners.forEach(fn => fn())
}
supabase.auth.getUser().then(() => fetchMeuSocio(), () => {})
supabase.auth.onAuthStateChange(() => { fetchMeuSocio() })

// manto da conta logada NESTE aparelho — banco primeiro, reserva do código
// depois. Só decora o PRÓPRIO time de quem vê (nunca sincroniza pros outros).
export function meuManto(): [string, string] | null {
  if (meu?.ativo && meu.manto) return meu.manto
  const em = loggedEmail()
  return em ? (MANTO_CONTAS[em] ?? null) : null
}

// 🏟️ nome do estádio batizado (null = usa o nome padrão por nível)
export function meuEstadioNome(): string | null {
  return meu?.ativo ? (meu.estadioNome ?? null) : null
}

// 🖋️ sou barão (dono de batismo)? — pro limite de fichas de carreira etc.
export function souBarao(): boolean {
  return !!(meu?.ativo && meu.origem === 'batismo')
}

// ✏️ o PRÓPRIO sócio batiza o estádio (o RPC valida se é sócio ativo; vazio =
// volta ao nome padrão). Atualiza o cache local na hora — sem esperar refetch.
export async function batizarEstadio(nome: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const { data, error } = await supabase.rpc('esc_socio_estadio_nome', { p_nome: nome })
    if (error) return { ok: false, erro: error.message }
    if (meu) { meu = { ...meu, estadioNome: (data as string | null) ?? null }; listeners.forEach(fn => fn()) }
    return { ok: true }
  } catch { return { ok: false, erro: 'sem conexão — tenta de novo' } }
}

// hook pra telas que precisam re-renderizar quando o sócio carrega
export function useMeuSocio(): MeuSocio | null {
  const [, bump] = useState(0)
  useEffect(() => {
    const fn = () => bump(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
  return meu
}

// listras do manto pra usar como background. `angle` = direção das listras
// (90 = verticais, padrão camisa; 0 = horizontais/marujo; 45 = diagonais).
// `c3` (opcional) = 3ª cor: quando passado, a listra vira de 3 cores (ex.: Desportivo
// Montreal preto/branco/verde). Sem c3, segue o padrão de 2 cores de sempre.
export const mantoStripes = (c: [string, string], w = 9, angle = 90, c3?: string | null) =>
  c3
    ? `repeating-linear-gradient(${angle}deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px, ${c3} ${w * 2}px ${w * 3}px)`
    : `repeating-linear-gradient(${angle}deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px)`

// 🎽 direção da listra por mascote do clube (pedido do Diego 10/08). Batismo que
// pediu listra diferente entra aqui; quem não está aqui fica vertical (padrão).
const MANTO_ANGLE: Record<string, number> = {
  samambaia: 45,        // 🌿 Império Samambaia — diagonais (Rio Branco)
  careca_ruivo: 0,      // 🔴⚫ Murriz FC — horizontais (rubro-negro)
  porco_marinheiro: 0,  // 🐷⚓ Marinheiros AS — horizontais (marujo/Palmeiras)
}
// ângulo da listra do MEU manto (pelo meu mascote). Só o próprio dono decora o seu.
export function meuMantoAngle(): number {
  const k = meu?.ativo ? meu.mascoteKey : null
  return (k && MANTO_ANGLE[k] != null) ? MANTO_ANGLE[k] : 90
}

// 🎽 3ª COR do manto por mascote (caso especial pedido pelo Diego): manto de 3
// cores. Ex.: Desportivo Montreal (mascote "maite") = preto + branco + VERDE.
// Só o PRÓPRIO dono vê a 3ª cor no seu manto (igual o ângulo) — não afeta os
// outros times. Quem não está aqui segue com manto de 2 cores normal.
const MANTO_TRI: Record<string, string> = {
  maite: '#1BA34C', // 🟢 Desportivo Montreal — 3ª cor verde (preto/branco/verde)
  piloto_bola: '#FFFFFF', // 🏎️ Ferrari SC (adriano) — 3ª cor BRANCA (vermelho/preto/branco)
  cobra_arruda: '#C2001E', // 🐍 Tricolor do Arruda FC (Geovany Souza) — 3ª cor VERMELHA (preto/branco/vermelho, 16/08)
}
export function meuMantoC3(): string | null {
  const k = meu?.ativo ? meu.mascoteKey : null
  return (k && MANTO_TRI[k]) ? MANTO_TRI[k] : null
}

// ─── 🔒 NOME DE TIME ÚNICO (tipo @ do Instagram — pedido do Diego 10/08) ───
// Antes de gravar um nome novo de técnico/time, pergunta ao servidor se está
// livre. Regras lá: nome em uso por OUTRA conta → bloqueia; nome de clube de
// BATISMO → reservado pro dono. Quem JÁ tem nome repetido de antes, mantém
// (a trava só pega troca/cadastro novos). Servidor fora do ar → deixa passar
// (não trava o jogo — padrão da casa).
export async function nomeLivre(nome: string): Promise<{ livre: boolean; motivo?: string }> {
  const nm = nome.trim()
  if (!nm) return { livre: true }
  try {
    const { data, error } = await supabase.rpc('esc_nome_livre', { p_nome: nm })
    if (error || !data) return { livre: true }
    return data as { livre: boolean; motivo?: string }
  } catch { return { livre: true } }
}
// mensagens prontas (aviso claro: o PORQUÊ e o CAMINHO)
export const NOME_MSG: Record<string, string> = {
  em_uso: '⚠️ Já existe um técnico com esse nome — nome de time é único, tipo @ do Instagram. Tenta uma variação: acrescenta FC, um número ou teu apelido.',
  batismo: '🔒 Esse nome é de um clube de BATISMO e fica reservado pro dono dele. Se o clube é teu, entra com a conta do batismo; senão, escolhe outro nome.',
}
