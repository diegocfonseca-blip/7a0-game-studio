// 🏆 LIBERTADORES DO BRASIL OFICIAL: o formato REAL de 2026 (pesquisa: docs/brasil-oficial/competicoes-reais.md e
// https://pt.wikipedia.org/wiki/Copa_Libertadores_da_América_de_2026). Regra do Diego: tudo real, nada inventado; o que a
// pesquisa não confirmou está marcado ⚠️ INCERTO, com a escolha provisória ao lado.
// Módulo PURO (sem tela): quem joga cada partida é o `joga` de quem chama (na carreira: o motor de sempre).
//
// Formato 2026 (47 clubes):
//  · 1ª fase: 6 clubes, ida e volta → 3 passam.
//  · 2ª fase: 13 + os 3 = 16, ida e volta → 8 passam.
//  · 3ª fase: 8, ida e volta → 4 vão aos grupos; os 4 que caem vão à Sul-Americana.
//  · Grupos: 32 clubes, 8 grupos de 4, turno e returno. 1º e 2º às oitavas; o 3º cai pra Sul-Americana.
//  · Oitavas: 1º de grupo × 2º de outro grupo (sorteio), volta na casa do 1º. Quartas e semis em ida e volta, volta na casa da
//    melhor campanha. Final em JOGO ÚNICO (campo neutro). Empate no agregado = pênaltis (a Conmebol não usa gol fora).
import { type Joga, type Penaltis, type Linha, type Jogo, type Confronto, type CtxJogo, ordena, embaralha, rngDe, turnoEReturno, idaEVolta } from './campeonato-oficial'
import type { FaseEstadual, ResultadoEstadual } from './estaduais'
import { clubeOficial } from './brasil-oficial'

export const NOME_LIBERTADORES = 'Libertadores'

/** os 39 estrangeiros da Libertadores 2026, com o país e a fase em que ENTRARAM (fonte: pt.wikipedia, lista de clubes).
 *  O nome é o do baralho (é a chave das cartas e do escudo). A partir de 2027,
 *  as ligas estrangeiras ainda não são simuladas: usa-se a referência nacional
 *  documentada em docs/brasil-oficial/inscricoes-conmebol.md, ajustada pelos títulos. */
export { ESTRANGEIROS_LIBERTA_2026 } from './conmebol-clubes'
import { ESTRANGEIROS_LIBERTA_2026 } from './conmebol-clubes'
import { estrangeirosLibertadores, paisDosClubesConmebol } from './conmebol-inscricoes'

/** os 8 brasileiros da Libertadores 2026 REAL (temporada 1 do modo): Flamengo campeão de 2025, Corinthians campeão da Copa do
 *  Brasil 2025, Palmeiras, Cruzeiro, Mirassol e Fluminense (2º–5º) nos grupos; Botafogo e Bahia (6º e 7º) na 2ª fase. */
export const BRASILEIROS_LIBERTA_2026 = { grupos: ['Flamengo', 'Corinthians', 'Palmeiras', 'Cruzeiro', 'Mirassol', 'Fluminense'], fase2: ['Botafogo', 'Bahia'] }

export type VagasLiberta = { grupos: string[]; fase2: string[]; fase1: string[]; pais: Record<string, string> }

/** Inscrições ANTES da edição: sete vagas brasileiras, cotas nacionais dos
 * demais países e duas vagas adicionais para os campeões continentais anteriores.
 * Duplicidade é resolvida na lista nacional, nunca repescando eliminado.
 * Temporada 1 conserva integralmente os participantes reais de 2026. */
export function vagasLiberta(anterior: { serieA: string[]; copa: string; copaVice: string; liberta?: string; sula?: string } | null, paisDe: Record<string, string> = {}): VagasLiberta {
  const pais: Record<string, string> = anterior ? { ...paisDe, ...paisDosClubesConmebol() } : Object.fromEntries(ESTRANGEIROS_LIBERTA_2026.map(c => [c.nome, c.pais]))
  if (!anterior) {
    for (const n of [...BRASILEIROS_LIBERTA_2026.grupos, ...BRASILEIROS_LIBERTA_2026.fase2]) pais[n] = 'BRA'
    return { grupos: [...BRASILEIROS_LIBERTA_2026.grupos, ...ESTRANGEIROS_LIBERTA_2026.filter(e => e.fase === 'grupos').map(e => e.nome)], fase2: [...BRASILEIROS_LIBERTA_2026.fase2, ...ESTRANGEIROS_LIBERTA_2026.filter(e => e.fase === 'fase2').map(e => e.nome)], fase1: ESTRANGEIROS_LIBERTA_2026.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
  }
  // História antiga sem registro de título conserva a referência de 2025.
  // O fallback não escreve campeão, título ou prêmio no save.
  let liberta = anterior.liberta ?? 'Flamengo', sula = anterior.sula ?? 'Lanús'
  // Se só um título antigo está registrado e colide com a referência do outro,
  // aproveita-se a vaga de referência na associação nacional. Não inventa nem
  // grava um segundo título para o mesmo clube.
  if (liberta === sula && !anterior.sula) sula = estrangeirosLibertadores([], pais).find(c => c.pais === 'ARG' && c.nome !== liberta)!.nome
  if (liberta === sula && !anterior.liberta) liberta = anterior.serieA.find(n => n !== sula) ?? 'Palmeiras'
  if (liberta === sula) throw new Error('Inscrição da Libertadores: os dois títulos continentais precisam de campeões distintos.')
  const campeoes = [liberta, sula]
  for (const n of [...anterior.serieA, anterior.copa, anterior.copaVice]) if (n) pais[n] = 'BRA'
  for (const n of campeoes) {
    if (!pais[n] && clubeOficial(n)) pais[n] = 'BRA'
    if (!pais[n]) throw new Error(`Inscrição da Libertadores: país não cadastrado para ${n}.`)
  }
  const campeoesBR = campeoes.filter(n => pais[n] === 'BRA')
  const estr = estrangeirosLibertadores(campeoes, pais)
  const G = [...campeoesBR]
  for (const n of [anterior.copa, ...anterior.serieA]) {
    if (G.length >= 5 + campeoesBR.length) break
    if (n && !G.includes(n)) G.push(n)
  }
  const F2: string[] = []
  for (const n of [anterior.copaVice, ...anterior.serieA]) {
    if (F2.length >= 2) break
    if (n && !G.includes(n) && !F2.includes(n)) F2.push(n)
  }
  return { grupos: [...G, ...estr.filter(e => e.fase === 'grupos').map(e => e.nome)], fase2: [...F2, ...estr.filter(e => e.fase === 'fase2').map(e => e.nome)], fase1: estr.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
}

export type ResultadoLiberta = ResultadoEstadual & {
  /** quem cai pra Sul-Americana: os 4 eliminados da 3ª fase (grupos da Sula) e os 8 terceiros de grupo (playoff da Sula) */
  sulaGrupos: string[]
  sulaPlayoff: string[]
}

const perdedor = (c: Confronto) => (c.vencedor === c.a ? c.b : c.a)
/** sorteio em pares (sem cabeça de chave: ⚠️ INCERTO — o real usa o ranking da Conmebol pra separar os potes da 1ª–3ª fase) */
function emPares(times: string[], r: () => number): [string, string][] {
  const t = embaralha(times, r)
  return Array.from({ length: t.length / 2 }, (_, i) => [t[2 * i], t[2 * i + 1]] as [string, string])
}
function fasePreliminar(nome: string, times: string[], r: () => number, joga: Joga, pen: Penaltis): { fase: FaseEstadual; jogos: Jogo[]; venc: string[]; perd: string[] } {
  // mando da volta: o 2º do par (sorteio) — ⚠️ INCERTO: no real é o melhor do ranking da Conmebol
  const conf = emPares(times, r).map(([a, b]) => idaEVolta(b, a, joga, pen, { serie: NOME_LIBERTADORES, fase: nome, rodada: 1 }, 'penaltis'))
  return { fase: { nome, tabelas: [], confrontos: conf, rodadas: 2 }, jogos: conf.flatMap(c => c.jogos), venc: conf.map(c => c.vencedor), perd: conf.map(perdedor) }
}

/**
 * Sorteio dos grupos: 4 potes de 8 pela FORÇA (⚠️ INCERTO: o real usa o ranking da Conmebol, com o campeão no pote 1); um de
 * cada pote por grupo, e dois clubes do mesmo país não caem juntos (regra real, salvo os que vieram da 3ª fase — aqui vale pra
 * todos, e se o sorteio travar 50 vezes ele aceita a repetição).
 */
function sorteiaGrupos(times: string[], forca: (t: string) => number, pais: Record<string, string>, r: () => number, cabeca?: string): string[][] {
  const ord = [...times].sort((a, b) => (b === cabeca ? 1 : 0) - (a === cabeca ? 1 : 0) || forca(b) - forca(a) || a.localeCompare(b))
  const potes = [0, 1, 2, 3].map(p => ord.slice(p * 8, p * 8 + 8))
  for (let tent = 0; tent < 50; tent++) {
    const grupos: string[][] = Array.from({ length: 8 }, () => [])
    let ok = true
    for (const pote of potes) {
      for (const t of embaralha(pote, r)) {
        const livres = grupos.filter(g => g.length === potes.indexOf(pote) && !g.some(x => pais[x] && pais[x] === pais[t]))
        const g = livres[0] ?? (tent === 49 ? grupos.find(x => x.length === potes.indexOf(pote)) : undefined)
        if (!g) { ok = false; break }
        g.push(t)
      }
      if (!ok) break
    }
    if (ok) return grupos
  }
  return Array.from({ length: 8 }, (_, g) => potes.map(p => p[g]))
}

export const LETRAS_GRUPO = 'ABCDEFGH'

export function simulaLibertadores(v: VagasLiberta, seed: number, joga: Joga, pen: Penaltis, forca: (t: string) => number, cabeca?: string): ResultadoLiberta {
  const inscritos = [...v.grupos, ...v.fase2, ...v.fase1]
  if (v.grupos.length !== 28 || v.fase2.length !== 13 || v.fase1.length !== 6 ||
      inscritos.some(n => typeof n !== 'string' || !n.trim()) || new Set(inscritos).size !== 47) {
    throw new Error('Inscrição incompleta da Libertadores: são necessários 47 clubes distintos antes do sorteio.')
  }
  const r = rngDe(seed)
  const fases: FaseEstadual[] = [], jogos: Jogo[] = []
  const f1 = fasePreliminar('1ª fase', v.fase1, r, joga, pen)
  const f2 = fasePreliminar('2ª fase', [...v.fase2, ...f1.venc], r, joga, pen)
  const f3 = fasePreliminar('3ª fase', f2.venc, r, joga, pen)
  for (const f of [f1, f2, f3]) { fases.push(f.fase); jogos.push(...f.jogos) }
  // grupos: turno e returno, 6 rodadas, todos os grupos na mesma rodada
  const grupos = sorteiaGrupos([...v.grupos, ...f3.venc], forca, v.pais, r, cabeca)
  const L = new Map<string, Linha>()
  for (const g of grupos) for (const t of g) L.set(t, { time: t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 })
  const rods = turnoEReturno(4)
  const jg: Jogo[] = []
  rods.forEach((rod, ri) => {
    for (const g of grupos) for (const [i, k] of rod) {
      const casa = g[i], fora = g[k]
      const ctx: CtxJogo = { serie: NOME_LIBERTADORES, fase: 'Fase de grupos', rodada: ri + 1 }
      const p = joga(casa, fora, ctx)
      jg.push({ casa, fora, gc: p.gc, gf: p.gf, ctx })
      const lc = L.get(casa)!, lf = L.get(fora)!
      lc.j++; lf.j++; lc.gp += p.gc; lc.gc += p.gf; lf.gp += p.gf; lf.gc += p.gc
      if (p.gc > p.gf) { lc.v++; lc.pts += 3; lf.d++ } else if (p.gc < p.gf) { lf.v++; lf.pts += 3; lc.d++ } else { lc.e++; lf.e++; lc.pts++; lf.pts++ }
    }
  })
  const tabelas = grupos.map((g, i) => ({ nome: `Grupo ${LETRAS_GRUPO[i]}`, tabela: ordena(g.map(t => L.get(t)!), jg) }))
  fases.push({ nome: 'Fase de grupos', tabelas, confrontos: [], rodadas: rods.length })
  jogos.push(...jg)
  const primeiros = tabelas.map(t => t.tabela[0].time), segundos = tabelas.map(t => t.tabela[1].time)
  const terceiros = tabelas.map(t => t.tabela[2].time)
  // campanha geral (mando das quartas/semis e a ordem dos eliminados juntos)
  const campanha = ordena(tabelas.flatMap(t => t.tabela), jg).map(l => l.time)
  const pos = (t: string) => campanha.indexOf(t)
  // oitavas: cada 1º pega um 2º de OUTRO grupo (sorteio), volta na casa do 1º
  let seg = embaralha(segundos, r)
  for (let tent = 0; tent < 30 && primeiros.some((p, i) => tabelas.findIndex(t => t.tabela[1].time === seg[i]) === tabelas.findIndex(t => t.tabela[0].time === p)); tent++) seg = embaralha(segundos, r)
  const oit = primeiros.map((p, i) => idaEVolta(p, seg[i], joga, pen, { serie: NOME_LIBERTADORES, fase: 'Oitavas de final', rodada: 1 }, 'penaltis'))
  fases.push({ nome: 'Oitavas de final', tabelas: [], confrontos: oit, rodadas: 2 })
  jogos.push(...oit.flatMap(c => c.jogos))
  const perdidos: string[][] = [oit.map(perdedor)]
  let cur = oit.map(c => c.vencedor)
  // quartas e semis em ida e volta (chave fixa: vencedor do confronto 1 × o do 2…), volta na casa da melhor campanha
  for (const nome of ['Quartas de final', 'Semifinal']) {
    const conf: Confronto[] = []
    for (let i = 0; i + 1 < cur.length; i += 2) {
      const [m, p] = pos(cur[i]) <= pos(cur[i + 1]) ? [cur[i], cur[i + 1]] : [cur[i + 1], cur[i]]
      conf.push(idaEVolta(m, p, joga, pen, { serie: NOME_LIBERTADORES, fase: nome, rodada: 1 }, 'penaltis'))
    }
    fases.push({ nome, tabelas: [], confrontos: conf, rodadas: 2 })
    jogos.push(...conf.flatMap(c => c.jogos))
    perdidos.unshift(conf.map(perdedor))
    cur = conf.map(c => c.vencedor)
  }
  // final em jogo único (campo neutro: o "mandante" do placar é o de melhor campanha)
  const [fa, fb] = pos(cur[0]) <= pos(cur[1]) ? [cur[0], cur[1]] : [cur[1], cur[0]]
  const ctxF: CtxJogo = { serie: NOME_LIBERTADORES, fase: 'Final', rodada: 1 }
  const pf = joga(fa, fb, ctxF)
  const jf: Jogo = { casa: fa, fora: fb, gc: pf.gc, gf: pf.gf, ctx: ctxF }
  const fin: Confronto = pf.gc !== pf.gf ? { a: fa, b: fb, jogos: [jf], vencedor: pf.gc > pf.gf ? fa : fb } : { a: fa, b: fb, jogos: [jf], vencedor: pen(fa, fb, ctxF), penaltis: true }
  fases.push({ nome: 'Final', tabelas: [], confrontos: [fin], rodadas: 1 })
  jogos.push(jf)
  const campeao = fin.vencedor, vice = perdedor(fin)
  // classificação final: campeão, vice, semis, quartas, oitavas (pela campanha), grupos (pela campanha), 3ª, 2ª e 1ª fase
  const out: string[] = [campeao, vice]
  for (const d of perdidos) for (const t of campanha) if (d.includes(t) && !out.includes(t)) out.push(t)
  for (const t of campanha) if (!out.includes(t)) out.push(t)
  for (const f of [f3, f2, f1]) for (const t of f.perd) if (!out.includes(t)) out.push(t)
  return { estadual: NOME_LIBERTADORES, fases, jogos, campeao, vice, caem: [], classificacao: out, sulaGrupos: f3.perd, sulaPlayoff: terceiros }
}

/** 📅 o dia (mês, dia) de cada página da Libertadores, na ordem das páginas: 1ª, 2ª e 3ª fase, as 6 rodadas de grupo, oitavas,
 *  quartas, semi e final. Fonte: calendário da Libertadores 2026 (pt.wikipedia): 1ª fase 3–12/fev, 2ª 17–26/fev, 3ª 3–12/mar,
 *  grupos 7/abr–28/mai, oitavas 11–20/ago, quartas 8–17/set, semis 13–22/out, final 28/nov. Em ida e volta vale o dia da IDA.
 *  ⚠️ INCERTO: o dia de cada rodada de grupo (a fonte só dá a janela 7/abr–28/mai) — aqui uma quarta a cada ~10 dias. */
export const DATAS_LIBERTA: readonly [number, number][] = [
  [2, 4], [2, 18], [3, 4],
  [4, 8], [4, 15], [4, 22], [5, 6], [5, 20], [5, 27],
  [8, 12], [9, 9], [10, 14], [11, 28],
]
