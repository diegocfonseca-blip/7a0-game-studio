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

// listras verticais (padrão camisa) pra usar como background
export const mantoStripes = (c: [string, string], w = 9) =>
  `repeating-linear-gradient(90deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px)`
