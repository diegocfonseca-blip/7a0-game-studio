// ─── Analytics do Leilão Legends 38 ───
// Registra partidas e mantém um "heartbeat" de quem está jogando ao vivo.
// Jogadores anônimos (que só abriram o link, sem login) também contam — a
// identidade é por aparelho, guardada no localStorage. Só o admin lê os dados.

import { supabase } from '../lib/supabase'

const SID_KEY = 'esc_sid'

// id persistente por aparelho/navegador
export function sessionId(): string {
  try {
    let sid = localStorage.getItem(SID_KEY)
    if (!sid) {
      sid = (crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch {
    // localStorage bloqueado (aba privada etc.) — id volátil por carregamento
    return `nostore-${Math.random().toString(36).slice(2)}`
  }
}

// registra uma visita ao site (abriu o link — jogando ou não). Uma vez por
// carregamento da página.
export async function logVisit() {
  try {
    const { data } = await supabase.auth.getUser()
    await supabase.from('site_visits').insert({
      session_id: sessionId(),
      user_id: data?.user?.id ?? null,
    })
  } catch { /* silencioso */ }
}

// nome pra exibir: o do time (se já definido) ou o nome da conta logada
function pickName(displayName: string | undefined, user: { user_metadata?: Record<string, unknown> } | null | undefined): string | null {
  const fromTeam = (displayName || '').trim()
  if (fromTeam) return fromTeam.slice(0, 40)
  const fromAccount = (user?.user_metadata?.display_name as string | undefined || '').trim()
  return fromAccount ? fromAccount.slice(0, 40) : null
}

// registra o início de uma partida (não bloqueia o jogo se falhar)
export async function logPlay(mode: 'cpu' | 'online', displayName?: string) {
  try {
    const { data } = await supabase.auth.getUser()
    await supabase.from('game_plays').insert({
      mode,
      session_id: sessionId(),
      display_name: pickName(displayName, data?.user),
      user_id: data?.user?.id ?? null,
    })
  } catch { /* silencioso — analytics nunca atrapalha o jogo */ }
}

// pulso "estou no site agora" — a cada ~30s, em qualquer tela. É um insert puro
// (heartbeat append-only), então funciona pro jogador anônimo. As linhas velhas
// são podadas no servidor; o "ao vivo" olha só os últimos 90s.
export async function heartbeat(mode: 'cpu' | 'online' | 'career', displayName: string | undefined, screen: string, career?: { season: number; division: string }) {
  try {
    const { data } = await supabase.auth.getUser()
    await supabase.from('live_beats').insert({
      session_id: sessionId(),
      mode,
      display_name: pickName(displayName, data?.user),
      user_id: data?.user?.id ?? null,
      screen,
      career_season: career?.season ?? null,
      career_division: career?.division ?? null,
    })
  } catch { /* silencioso */ }
}
