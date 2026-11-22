import type { CopaRound, SimTeam } from './pyramidseason'

export type LinhaGrupoAoVivo = {
  time: string; you: boolean; j: number; v: number; e: number; d: number; gp: number; gc: number; pts: number
}

/** A tabela de pontos só lê jogos de grupos. Mata-mata (inclusive uma chave
 * incompleta) não cadastra clubes nem altera a classificação dos grupos. */
export function classificacaoGruposAoVivo(pages: readonly CopaRound[], ate: number) {
  const linhas = new Map<string, LinhaGrupoAoVivo>()
  let incompletos = 0
  const linha = (t: SimTeam) => {
    let row = linhas.get(t.name)
    if (!row) { row = { time: t.name, you: t.you, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 }; linhas.set(t.name, row) }
    return row
  }
  pages.forEach((page, index) => {
    if (!/ · rodada \d+\/\d+$/.test(page.name)) return
    for (const tie of page.ties) {
      if (!tie?.a?.name || !tie?.b?.name) { if (index < ate) incompletos++; continue }
      const a = linha(tie.a), b = linha(tie.b)
      if (index >= ate) continue
      if (!Number.isFinite(tie.aggA) || !Number.isFinite(tie.aggB)) { incompletos++; continue }
      a.j++; b.j++; a.gp += tie.aggA; a.gc += tie.aggB; b.gp += tie.aggB; b.gc += tie.aggA
      if (tie.aggA > tie.aggB) { a.v++; a.pts += 3; b.d++ }
      else if (tie.aggA < tie.aggB) { b.v++; b.pts += 3; a.d++ }
      else { a.e++; b.e++; a.pts++; b.pts++ }
    }
  })
  const rows = [...linhas.values()].sort((x, y) => y.pts - x.pts || y.v - x.v || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp || x.time.localeCompare(y.time))
  return { linhas, rows, incompletos }
}
