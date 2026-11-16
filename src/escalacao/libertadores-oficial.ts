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

export const NOME_LIBERTADORES = 'Libertadores'

/** os 39 estrangeiros da Libertadores 2026, com o país e a fase em que ENTRARAM (fonte: pt.wikipedia, lista de clubes).
 *  O nome é o do baralho (é a chave das cartas e do escudo). ⚠️ INCERTO: de 2027 em diante a vaga dos outros países sai dos
 *  campeonatos deles, que o modo não joga — então os estrangeiros continuam os de 2026 (mesma escolha dos estaduais). */
export type EntradaConmebol = { nome: string; pais: string; fase: 'grupos' | 'fase2' | 'fase1' }
export const ESTRANGEIROS_LIBERTA_2026: readonly EntradaConmebol[] = [
  // Argentina (Lanús entra pela vaga de campeão da Sul-Americana 2025)
  { nome: 'Lanús', pais: 'ARG', fase: 'grupos' }, { nome: 'Platense', pais: 'ARG', fase: 'grupos' },
  { nome: 'Estudiantes', pais: 'ARG', fase: 'grupos' }, { nome: 'Independiente Rivadavia', pais: 'ARG', fase: 'grupos' },
  { nome: 'Rosario Central', pais: 'ARG', fase: 'grupos' }, { nome: 'Boca Juniors', pais: 'ARG', fase: 'grupos' },
  { nome: 'Argentinos Juniors', pais: 'ARG', fase: 'fase2' },
  // Bolívia
  { nome: 'Always Ready', pais: 'BOL', fase: 'grupos' }, { nome: 'Bolívar', pais: 'BOL', fase: 'grupos' },
  { nome: 'Nacional Potosí', pais: 'BOL', fase: 'fase2' }, { nome: 'The Strongest', pais: 'BOL', fase: 'fase1' },
  // Chile
  { nome: 'Coquimbo Unido', pais: 'CHI', fase: 'grupos' }, { nome: 'Universidad Católica', pais: 'CHI', fase: 'grupos' },
  { nome: "O'Higgins", pais: 'CHI', fase: 'fase2' }, { nome: 'Huachipato', pais: 'CHI', fase: 'fase2' },
  // Colômbia
  { nome: 'Santa Fe', pais: 'COL', fase: 'grupos' }, { nome: 'Junior Barranquilla', pais: 'COL', fase: 'grupos' },
  { nome: 'Deportes Tolima', pais: 'COL', fase: 'fase2' }, { nome: 'Independiente Medellín', pais: 'COL', fase: 'fase2' },
  // Equador
  { nome: 'Independiente del Valle', pais: 'EQU', fase: 'grupos' }, { nome: 'LDU Quito', pais: 'EQU', fase: 'grupos' },
  { nome: 'Barcelona SC', pais: 'EQU', fase: 'fase2' }, { nome: 'Universidad Católica-EQU', pais: 'EQU', fase: 'fase1' },
  // Paraguai
  { nome: 'Libertad', pais: 'PAR', fase: 'grupos' }, { nome: 'Cerro Porteño', pais: 'PAR', fase: 'grupos' },
  { nome: 'Guaraní-PAR', pais: 'PAR', fase: 'fase2' }, { nome: '2 de Mayo', pais: 'PAR', fase: 'fase1' },
  // Peru
  { nome: 'Universitario', pais: 'PER', fase: 'grupos' }, { nome: 'Cusco', pais: 'PER', fase: 'grupos' },
  { nome: 'Sporting Cristal', pais: 'PER', fase: 'fase2' }, { nome: 'Alianza Lima', pais: 'PER', fase: 'fase1' },
  // Uruguai
  { nome: 'Nacional-URU', pais: 'URU', fase: 'grupos' }, { nome: 'Peñarol', pais: 'URU', fase: 'grupos' },
  { nome: 'Liverpool-URU', pais: 'URU', fase: 'fase2' }, { nome: 'Juventud', pais: 'URU', fase: 'fase1' },
  // Venezuela
  { nome: 'Universidad Central', pais: 'VEN', fase: 'grupos' }, { nome: 'Deportivo La Guaira', pais: 'VEN', fase: 'grupos' },
  { nome: 'Carabobo', pais: 'VEN', fase: 'fase2' }, { nome: 'Deportivo Táchira', pais: 'VEN', fase: 'fase1' },
]
/** os 8 brasileiros da Libertadores 2026 REAL (temporada 1 do modo): Flamengo campeão de 2025, Corinthians campeão da Copa do
 *  Brasil 2025, Palmeiras, Cruzeiro, Mirassol e Fluminense (2º–5º) nos grupos; Botafogo e Bahia (6º e 7º) na 2ª fase. */
export const BRASILEIROS_LIBERTA_2026 = { grupos: ['Flamengo', 'Corinthians', 'Palmeiras', 'Cruzeiro', 'Mirassol', 'Fluminense'], fase2: ['Botafogo', 'Bahia'] }

export type VagasLiberta = { grupos: string[]; fase2: string[]; fase1: string[]; pais: Record<string, string> }

/**
 * As vagas de uma Libertadores. Temporada 1 (2026) = a lista real. Da 2ª em diante, as brasileiras saem do ano ANTERIOR do
 * modo (regra de 2027, competicoes-reais.md): campeão da Copa do Brasil e 1º–4º da Série A nos grupos; 5º e vice da Copa na
 * 2ª fase; vaga repetida desce pra o próximo da Série A ainda sem vaga. O campeão da Libertadores anterior tem vaga extra nos
 * grupos (se já tinha vaga, a dele desce na Série A — foi o caso real do Flamengo em 2026).
 * 🛑 Campeão anterior ESTRANGEIRO (Diego, 16/11: *"Se ganhou o Boca não abre"*): não abre vaga a mais pra ninguém. Ele vai pros
 * grupos (se tinha vaga de fase prévia, troca com o último do país dele nos grupos) e o Brasil manda as 7 de sempre — são 46.
 * O lugar que sobra nos grupos fica com o MELHOR ELIMINADO da 3ª fase (ver `simulaLibertadores`; ⚠️ INCERTO, escolha minha
 * pra fechar os 32 sem inventar clube).
 */
/** 🌎 `sula` = o campeão da Sul-Americana do ano anterior do modo: ele herda a vaga que em 2026 era do Lanús (campeão da Sula 2025),
 *  direto nos grupos. Já classificado: se é brasileiro, a vaga desce na Série A; se é de fora, ela não abre (o 32º lugar fica com o
 *  melhor eliminado da 3ª fase, igual ao caso do campeão da Libertadores). */
export function vagasLiberta(anterior: { serieA: string[]; copa: string; copaVice: string; liberta?: string; sula?: string } | null, paisDe: Record<string, string> = {}): VagasLiberta {
  const pais: Record<string, string> = {}
  for (const e of ESTRANGEIROS_LIBERTA_2026) pais[e.nome] = e.pais
  const estr = ESTRANGEIROS_LIBERTA_2026.map(e => ({ ...e }))
  if (!anterior) {
    for (const n of [...BRASILEIROS_LIBERTA_2026.grupos, ...BRASILEIROS_LIBERTA_2026.fase2]) pais[n] = 'BRA'
    return { grupos: [...BRASILEIROS_LIBERTA_2026.grupos, ...estr.filter(e => e.fase === 'grupos').map(e => e.nome)], fase2: [...BRASILEIROS_LIBERTA_2026.fase2, ...estr.filter(e => e.fase === 'fase2').map(e => e.nome)], fase1: estr.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
  }
  // a vaga do campeão da Sul-Americana (a do Lanús em 2026)
  let sulaBR: string | null = null
  if (anterior.sula && anterior.sula !== 'Lanús') {
    const iL = estr.findIndex(e => e.nome === 'Lanús')
    if (iL >= 0) estr.splice(iL, 1)
    const ja = estr.some(e => e.nome === anterior.sula)
    if (!ja && paisDe[anterior.sula]) { estr.push({ nome: anterior.sula, pais: paisDe[anterior.sula], fase: 'grupos' }); pais[anterior.sula] = paisDe[anterior.sula] }
    else if (!ja) sulaBR = anterior.sula
  }
  const campEstr = anterior.liberta ? estr.find(e => e.nome === anterior.liberta) : undefined
  const campBR = anterior.liberta && !campEstr ? anterior.liberta : null
  if (campEstr && campEstr.fase !== 'grupos') {
    // ⚠️ INCERTO (acima): o campeão estrangeiro sobe e o último do país dele nos grupos desce pra fase dele
    const troca = [...estr].reverse().find(e => e.pais === campEstr.pais && e.fase === 'grupos')
    if (troca) troca.fase = campEstr.fase
    campEstr.fase = 'grupos'
  }
  const nGrupos = 5 + (campBR ? 1 : 0) + (sulaBR ? 1 : 0), nFase2 = 2 // campeão da Copa + G4 (+ a extra do campeão brasileiro) · 5º e vice da Copa
  const ordem = [...(campBR ? [campBR] : []), ...(sulaBR ? [sulaBR] : []), anterior.copa, ...anterior.serieA]
  const G: string[] = []
  for (const n of ordem) { if (G.length >= nGrupos) break; if (n && !G.includes(n)) G.push(n) }
  const F2: string[] = []
  if (anterior.copaVice && !G.includes(anterior.copaVice)) F2.push(anterior.copaVice)
  for (const n of anterior.serieA) { if (F2.length >= nFase2) break; if (!G.includes(n) && !F2.includes(n)) F2.push(n) }
  for (const n of [...G, ...F2]) pais[n] = 'BRA'
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
  const r = rngDe(seed)
  const fases: FaseEstadual[] = [], jogos: Jogo[] = []
  const f1 = fasePreliminar('1ª fase', v.fase1, r, joga, pen)
  const f2 = fasePreliminar('2ª fase', [...v.fase2, ...f1.venc], r, joga, pen)
  const f3 = fasePreliminar('3ª fase', f2.venc, r, joga, pen)
  for (const f of [f1, f2, f3]) { fases.push(f.fase); jogos.push(...f.jogos) }
  // grupos: turno e returno, 6 rodadas, todos os grupos na mesma rodada
  // 46 clubes (campeão anterior estrangeiro, sem vaga extra): o 32º lugar dos grupos é do melhor eliminado da 3ª fase (saldo nos
  // dois jogos, depois gols marcados, depois a ordem do sorteio)
  const sobra = Math.max(0, 32 - v.grupos.length - f3.venc.length)
  const saldo = (t: string) => { let s2 = 0, g = 0; for (const c of f3.fase.confrontos) for (const j of c.jogos) { if (j.casa === t) { s2 += j.gc - j.gf; g += j.gc } else if (j.fora === t) { s2 += j.gf - j.gc; g += j.gf } } return [s2, g] }
  const sortudos = [...f3.perd].sort((a, b) => saldo(b)[0] - saldo(a)[0] || saldo(b)[1] - saldo(a)[1]).slice(0, sobra)
  f3.perd = f3.perd.filter(t => !sortudos.includes(t))
  const grupos = sorteiaGrupos([...v.grupos, ...f3.venc, ...sortudos], forca, v.pais, r, cabeca)
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
