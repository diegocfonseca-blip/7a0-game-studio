// ─── 🏀🏆 NBA CUP REAL do EUA Oficial (19/11, Diego: "Sim" pra NBA Cup) ─────────────────────────────────────────────────────
// Formato da Emirates NBA Cup 2026 (fonte: ESPN, "2026 NBA Cup: Schedule, format, groups", nov/2026):
//  • 6 grupos de 5 (3 do Leste, 3 do Oeste). Cada time joga UMA vez contra os outros 4 do grupo — e esses jogos SÃO jogos da
//    temporada regular (contam na tabela). Aqui: o 1º encontro de cada dupla do grupo no calendário de 82 (no rodízio de 30 times
//    todo par se cruza uma vez nas primeiras 29 rodadas, então o grupo fecha no começo da temporada, como na NBA).
//  • Passam o vencedor de cada grupo + o melhor 2º de cada conferência (wild card) = 8 → quartas (1×4, 2×3 dentro da conferência),
//    semis dentro da conferência, final Leste × Oeste. Jogo único. A FINAL não conta na tabela (no jogo, o mata-mata todo fica fora
//    da tabela — o motor da Cup de sempre, `playNbaCupRound`).
//  • Desempate do grupo (regra da NBA): vitórias → confronto direto → saldo de pontos nos jogos do grupo → pontos feitos → a
//    campanha da temporada passada (aqui: a ordem dos potes) .
//  • Grupos: na 1ª temporada os REAIS de 2026; da 2ª em diante o SORTEIO REAL — por conferência, 5 potes de 3 pela campanha da
//    temporada anterior (1º–3º pote 1 … 13º–15º pote 5) e cada grupo leva um time de cada pote.
// Lógica pura (sem React, sem estado do jogo): o store só chama.

export type ConfLO = 'L' | 'O'
export interface GrupoCup { nome: string; conf: ConfLO; times: string[] }
/** resultado de um jogo de grupo, pela dupla ordenada `a|b` (nomes das franquias) */
export interface JogoCup { casa: string; fora: string; pc: number; pf: number }
export interface EuaCupEstado { temporada: number; grupos: GrupoCup[]; jogos: Record<string, JogoCup>; fechado?: boolean }

/** os grupos sorteados de verdade pra Cup de 2026 (ESPN / Bleacher Report / Fox Sports) */
export const GRUPOS_2026: GrupoCup[] = [
  { nome: 'Leste A', conf: 'L', times: ['Pistons', 'Raptors', 'Magic', 'Bucks', 'Nets'] },
  { nome: 'Leste B', conf: 'L', times: ['Knicks', 'Cavaliers', 'Sixers', 'Heat', 'Pacers'] },
  { nome: 'Leste C', conf: 'L', times: ['Celtics', 'Hawks', 'Hornets', 'Bulls', 'Wizards'] },
  { nome: 'Oeste A', conf: 'O', times: ['Nuggets', 'Rockets', 'Suns', 'Jazz', 'Mavericks'] },
  { nome: 'Oeste B', conf: 'O', times: ['Thunder', 'Timberwolves', 'Clippers', 'Grizzlies', 'Pelicans'] },
  { nome: 'Oeste C', conf: 'O', times: ['Spurs', 'Lakers', 'Warriors', 'Kings', 'Trail Blazers'] },
]

export const parCup = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** sorteio real: `ordemL`/`ordemO` = as 15 franquias de cada conferência da melhor pra pior campanha da temporada passada */
export function sorteiaGrupos(ordemL: string[], ordemO: string[], rng: () => number): GrupoCup[] {
  const lado = (ordem: string[], conf: ConfLO): GrupoCup[] => {
    const g: GrupoCup[] = ['A', 'B', 'C'].map(l => ({ nome: `${conf === 'L' ? 'Leste' : 'Oeste'} ${l}`, conf, times: [] }))
    for (let pote = 0; pote < 5; pote++) {
      const p = ordem.slice(pote * 3, pote * 3 + 3)
      for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]] }
      p.forEach((t, i) => g[i].times.push(t))
    }
    return g
  }
  return [...lado(ordemL, 'L'), ...lado(ordemO, 'O')]
}

export interface LinhaGrupo { time: string; v: number; d: number; pf: number; pc: number; jogos: number }
/** a tabela do grupo, já na ordem do desempate real */
export function tabelaGrupo(g: GrupoCup, jogos: Record<string, JogoCup>): LinhaGrupo[] {
  const l: Record<string, LinhaGrupo> = Object.fromEntries(g.times.map(t => [t, { time: t, v: 0, d: 0, pf: 0, pc: 0, jogos: 0 }]))
  for (let i = 0; i < g.times.length; i++) for (let j = i + 1; j < g.times.length; j++) {
    const r = jogos[parCup(g.times[i], g.times[j])]
    if (!r) continue
    const c = l[r.casa], f = l[r.fora]
    if (!c || !f) continue
    c.jogos++; f.jogos++; c.pf += r.pc; c.pc += r.pf; f.pf += r.pf; f.pc += r.pc
    if (r.pc > r.pf) { c.v++; f.d++ } else { f.v++; c.d++ }
  }
  const venceu = (a: string, b: string) => { const r = jogos[parCup(a, b)]; if (!r) return 0; const ga = r.casa === a ? r.pc : r.pf, gb = r.casa === a ? r.pf : r.pc; return ga > gb ? -1 : 1 }
  const ordemPote = (t: string) => g.times.indexOf(t)
  return Object.values(l).sort((a, b) => b.v - a.v || (a.v === b.v ? venceu(a.time, b.time) : 0) || (b.pf - b.pc) - (a.pf - a.pc) || b.pf - a.pf || ordemPote(a.time) - ordemPote(b.time))
}

/** a fase de grupos acabou? (cada um dos 6 grupos com os 10 jogos) */
export function gruposCompletos(c: EuaCupEstado): boolean {
  return c.grupos.every(g => { let n = 0; for (let i = 0; i < g.times.length; i++) for (let j = i + 1; j < g.times.length; j++) if (c.jogos[parCup(g.times[i], g.times[j])]) n++; return n === (g.times.length * (g.times.length - 1)) / 2 })
}

/** os 8 do mata-mata, por conferência: [1º, 2º, 3º, wild card] (os 3 vencedores ordenados pela campanha no grupo) */
export function classificadosCup(c: EuaCupEstado): Record<ConfLO, string[]> {
  const cmp = (a: LinhaGrupo, b: LinhaGrupo) => b.v - a.v || (b.pf - b.pc) - (a.pf - a.pc) || b.pf - a.pf
  const out = { L: [] as string[], O: [] as string[] }
  for (const conf of ['L', 'O'] as const) {
    const tabs = c.grupos.filter(g => g.conf === conf).map(g => tabelaGrupo(g, c.jogos))
    const lideres = tabs.map(t => t[0]).filter(Boolean).sort(cmp)
    const wild = tabs.flatMap(t => t.slice(1)).sort(cmp)[0]
    out[conf] = [...lideres.map(x => x.time), ...(wild ? [wild.time] : [])]
  }
  return out
}
