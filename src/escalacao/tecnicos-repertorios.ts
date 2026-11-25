import { COLUNA_ESTILO, FORMACOES15, ORDEM_EQUILIBRADO } from './formacoes'
import type { DivTecnico, EstiloTecnico } from './tecnicos'

export const ESQUEMAS_POR_CATEGORIA: Record<DivTecnico, number> = { A: 6, B: 5, C: 4, D: 3, V: 2 }

/** Repertório do JOGO fixado ao cadastrar a pessoa. Não é uma declaração de
 * que ela utilizou todos estes esquemas na vida real. Sem fonte tática, neutro. */
export function repertorioInicialTecnico(div: DivTecnico, estilo: EstiloTecnico = 'equilibrado', principais: readonly string[] = []): string[] {
  const validas = new Set(FORMACOES15.map(f => f.rotulo))
  const estiloOrdem = estilo === 'equilibrado' ? ORDEM_EQUILIBRADO : COLUNA_ESTILO[estilo]
  return [...new Set([...principais, ...estiloOrdem, ...ORDEM_EQUILIBRADO, ...validas])]
    .filter(f => validas.has(f)).slice(0, ESQUEMAS_POR_CATEGORIA[div])
}
