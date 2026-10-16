// ─── 💼 PATROCINADOR DE VERDADE NO JOGO (16/10) ────────────────────────────────────────────────────────────────────
//
// Diego: *"publique agora da Vadico Veículos pra eu ver como fica… deixe a Champions Legends apresentada por Vadico
// Veículos"*. Primeiro espaço ligado: o NOME DA COMPETIÇÃO ("apresentada por"), no palco da competição (`CompetitionStage`).
// Regra combinada: uma marca por competição; cada competição pode ter a sua. Sem logo oficial ainda → marca escrita.
//
// 🔒 Nasce só nas contas do Diego (pra ele ver). Pra todo mundo ver: `PATROCINIO_GERAL = true`.
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
