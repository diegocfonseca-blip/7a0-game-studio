// ─── 💼 PATROCINADOR DE VERDADE NO JOGO (16/10) ────────────────────────────────────────────────────────────────────
//
// Diego: *"publique agora da Vadico Veículos pra eu ver como fica… deixe a Champions Legends apresentada por Vadico
// Veículos"*. Primeiro espaço ligado: o NOME DA COMPETIÇÃO ("apresentada por"), no palco da competição (`CompetitionStage`).
// Regra combinada: uma marca por competição; cada competição pode ter a sua. Sem logo oficial ainda → marca escrita.
//
// 🔒 Nasce só nas contas do Diego (pra ele ver). Pra todo mundo ver: `PATROCINIO_GERAL = true`.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail } from './apoio'

export type Patrocinio = { nome: string; emoji: string }
type Competicao = 'copa8' | 'liberta' | 'world' | 'club-world' | 'league' | 'champions'

const PATROCINIO_GERAL = false
const PATROCINIO_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
const POR_COMPETICAO: Partial<Record<Competicao, Patrocinio>> = {
  champions: { nome: 'Vadico Veículos', emoji: '🚗' }, // 🚗 Vadico Veículos (Itaguaí e Barra da Tijuca) — 16/10
}

/** a marca que apresenta esta competição (null = sem patrocinador, ou ainda escondido pra esta conta) */
export function patrocinioDe(kind: Competicao): Patrocinio | null {
  const email = (loggedEmail() ?? '').toLowerCase()
  if (!PATROCINIO_GERAL && !PATROCINIO_TESTERS.has(email)) return null
  return POR_COMPETICAO[kind] ?? null
}

/** 💼 a seção "Sua marca no jogo" da Loja (Dia da marca + mensal) — mesma trava: começa só nas contas do Diego */
export function patrocinioLojaOk(): boolean {
  return PATROCINIO_GERAL || PATROCINIO_TESTERS.has((loggedEmail() ?? '').toLowerCase())
}

// ⚡ DIA DA MARCA (16/10, Diego: "dia da marca… terá nome apresentado por na Copa dos 8 também, naming rights"): o Diego marca
// no #admin a DATA e a marca (`esc_dia_marca`); naquele dia (horário de Brasília) a Copa dos 8 sai "apresentada por…" pra
// TODO MUNDO — é patrocínio pago, não teste. Uma leitura pequena por sessão (sem canal, sem repetição: regra do tráfego).
let diaMarca: { dia: string; marca: Patrocinio | null } | null = null
let pedindo: Promise<void> | null = null
const ouvintes = new Set<() => void>()
const hojeBrasilia = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10)
function carregaDiaMarca(): Promise<void> {
  const hoje = hojeBrasilia()
  if (diaMarca?.dia === hoje) return Promise.resolve()
  if (pedindo) return pedindo
  pedindo = (async () => {
    try {
      const { data } = await supabase.from('esc_dia_marca').select('nome, emoji').eq('dia', hoje).maybeSingle()
      diaMarca = { dia: hoje, marca: data?.nome ? { nome: String(data.nome), emoji: String(data.emoji ?? '⭐') } : null }
    } catch { diaMarca = { dia: hoje, marca: null } }
    pedindo = null
    ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
  })()
  return pedindo
}
/** hook do palco: a marca do mês (código) ou, na Copa dos 8, a marca do DIA (banco) */
export function usePatrocinio(kind: Competicao): Patrocinio | null {
  const [, re] = useState(0)
  useEffect(() => {
    if (kind !== 'copa8') return
    const f = () => re(n => n + 1)
    ouvintes.add(f); carregaDiaMarca()
    return () => { ouvintes.delete(f) }
  }, [kind])
  if (kind === 'copa8' && diaMarca?.dia === hojeBrasilia() && diaMarca.marca) return diaMarca.marca
  return patrocinioDe(kind)
}
