import { vagasLiberta } from './libertadores-oficial'
import { vagasSula } from './sul-americana-oficial'
import { vagasLibertaLegadas, vagasSulaLegadas } from './conmebol-inscricoes-legadas'
import { ESTRANGEIROS_SULA_2026 } from './conmebol-clubes'

export type ReferenciaConmebol = { serieA: string[]; copa: string; copaVice: string; liberta?: string; sula?: string }

/** Saves existentes mantêm a edição em andamento se as duas listas eram
 * completas. Só a distribuição quebrada é reparada no meio da temporada.
 * A partir da virada gravada no save, todas as edições usam a regra corrigida. */
export function inscricoesConmebolDaTemporada(anterior: ReferenciaConmebol | null, temporada: number, vagasDesde?: number) {
  const legado = anterior && (vagasDesde == null || temporada < vagasDesde)
  if (legado) {
    const liberta = vagasLibertaLegadas(anterior, Object.fromEntries(ESTRANGEIROS_SULA_2026.map(c => [c.nome, c.pais]))), ins = [...liberta.grupos, ...liberta.fase2, ...liberta.fase1]
    const sula = vagasSulaLegadas(anterior.serieA, ins), sul = [...sula.grupos, ...sula.fase1]
    const completa = liberta.grupos.length === 28 && liberta.fase2.length === 13 && liberta.fase1.length === 6 &&
      new Set(ins).size === 47 && sula.grupos.length === 12 && sula.fase1.length === 32 && new Set(sul).size === 44 &&
      sul.every(n => !ins.includes(n)) && ['BOL','CHI','COL','EQU','PAR','PER','URU','VEN'].every(p => sula.fase1.filter(n => sula.pais[n] === p).length === 4)
    if (completa) return { liberta, sula, modo: 'preservada' as const }
  }
  const liberta = vagasLiberta(anterior), ins = [...liberta.grupos, ...liberta.fase2, ...liberta.fase1]
  return { liberta, sula: vagasSula(anterior?.serieA ?? null, ins), modo: legado ? 'reparada' as const : 'nova' as const }
}
