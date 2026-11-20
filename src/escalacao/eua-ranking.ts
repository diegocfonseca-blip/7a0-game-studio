// ─── 🏀🌍 RANKING GLOBAL DO BASQUETE (EUA Oficial) — 20/11, pontos aprovados pelo Diego ("Ok") ────────────────────────────────
// 💍 Anel da NBA 50 · 🏆 Campeão do Leste/Oeste 30 · 🏆 NBA Cup 25 · 🏀 Melhor campanha da temporada regular 20 · empate: caixa.
// Tabela própria no banco (`esc_nba_rank_snap`, docs/sql/basquete-ranking-eua.sql) — a do futebol não muda. O banco calcula os pontos
// (coluna gerada), então a régua mora em DOIS lugares: aqui (`PTS_NBA`) e na coluna. Mudou um, muda o outro.
// Tráfego: uma gravação por temporada fechada (a linha é minúscula) e uma leitura de até 50 linhas quando a aba Rank abre.
import { supabase } from '../lib/supabase'
import type { EscState } from './types'

export const PTS_NBA = { anel: 50, conferencia: 30, copa: 25, campanha: 20 } as const
export interface LinhaRankNba { user_id: string; career_id: string; display_name: string; team_name: string; aneis: number; conferencias: number; copas: number; campanhas: number; money: number; temporadas: number; pontos: number }

export async function enviaRankingEua(s: EscState): Promise<void> {
  const t = s.euaTitulos
  if (!s.euaOficial || !t) return
  try {
    const { data } = await supabase.auth.getUser()
    const u = data?.user
    if (!u) return
    const eu = s.managers.find(m => m.isHuman)
    await supabase.from('esc_nba_rank_snap').upsert({
      user_id: u.id, career_id: s.nbaCareerId ?? `eua-${s.seed}`, display_name: String(u.user_metadata?.display_name ?? '').slice(0, 40),
      team_name: eu?.teamName ?? s.euaOficial.franquia, aneis: t.aneis, conferencias: t.conferencias, copas: t.copas, campanhas: t.campanhas,
      money: Math.round(s.careerCoins?.[eu?.id ?? 0] ?? 0), temporadas: t.temporadas, updated_at: new Date().toISOString(),
    })
  } catch { /* sem internet: manda na próxima temporada fechada */ }
}

export async function carregaRankingEua(): Promise<LinhaRankNba[]> {
  const { data, error } = await supabase.from('esc_nba_rank_snap')
    .select('user_id,career_id,display_name,team_name,aneis,conferencias,copas,campanhas,money,temporadas,pontos')
    .order('pontos', { ascending: false }).order('money', { ascending: false }).limit(50)
  if (error) throw error
  return (data ?? []) as LinhaRankNba[]
}
