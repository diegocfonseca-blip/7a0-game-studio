// 🌎 SUL-AMERICANA DO BRASIL OFICIAL — os clubes de fora da Sul-Americana 2026 (pesquisa: docs/brasil-oficial/competicoes-reais.md,
// fonte https://pt.wikipedia.org/wiki/Copa_Sul-Americana_de_2026). O nome é o do baralho (chave das cartas e do escudo); onde o nome
// do clube bate com outro já existente, leva o país junto (Racing-URU, Nacional-PAR, Libertad-EQU).
// O torneio em si (motor e telas) ainda vai entrar; por enquanto a lista serve pra cartas e escudos.
import type { EntradaConmebol } from './libertadores-oficial'

export type EntradaSula = Omit<EntradaConmebol, 'fase'> & { fase: 'grupos' | 'fase1' }
export const ESTRANGEIROS_SULA_2026: readonly EntradaSula[] = [
  // Argentina (direto nos grupos)
  { nome: 'River Plate', pais: 'ARG', fase: 'grupos' }, { nome: 'Racing', pais: 'ARG', fase: 'grupos' },
  { nome: 'Deportivo Riestra', pais: 'ARG', fase: 'grupos' }, { nome: 'San Lorenzo', pais: 'ARG', fase: 'grupos' },
  { nome: 'Tigre', pais: 'ARG', fase: 'grupos' }, { nome: 'Barracas Central', pais: 'ARG', fase: 'grupos' },
  // 1ª fase (jogo único entre clubes do mesmo país)
  { nome: 'San Antonio Bulo Bulo', pais: 'BOL', fase: 'fase1' }, { nome: 'Blooming', pais: 'BOL', fase: 'fase1' },
  { nome: 'Independiente Petrolero', pais: 'BOL', fase: 'fase1' }, { nome: 'Guabirá', pais: 'BOL', fase: 'fase1' },
  { nome: 'U. de Chile', pais: 'CHI', fase: 'fase1' }, { nome: 'Audax Italiano', pais: 'CHI', fase: 'fase1' },
  { nome: 'Palestino', pais: 'CHI', fase: 'fase1' }, { nome: 'Cobresal', pais: 'CHI', fase: 'fase1' },
  { nome: 'Atlético Nacional', pais: 'COL', fase: 'fase1' }, { nome: 'América de Cali', pais: 'COL', fase: 'fase1' },
  { nome: 'Atlético Bucaramanga', pais: 'COL', fase: 'fase1' }, { nome: 'Millonarios', pais: 'COL', fase: 'fase1' },
  { nome: 'Orense', pais: 'EQU', fase: 'fase1' }, { nome: 'Libertad-EQU', pais: 'EQU', fase: 'fase1' },
  { nome: 'Macará', pais: 'EQU', fase: 'fase1' }, { nome: 'Deportivo Cuenca', pais: 'EQU', fase: 'fase1' },
  { nome: 'Sportivo Trinidense', pais: 'PAR', fase: 'fase1' }, { nome: 'Nacional-PAR', pais: 'PAR', fase: 'fase1' },
  { nome: 'Recoleta', pais: 'PAR', fase: 'fase1' }, { nome: 'Olimpia', pais: 'PAR', fase: 'fase1' },
  { nome: 'Alianza Atlético', pais: 'PER', fase: 'fase1' }, { nome: 'Melgar', pais: 'PER', fase: 'fase1' },
  { nome: 'Deportivo Garcilaso', pais: 'PER', fase: 'fase1' }, { nome: 'Cienciano', pais: 'PER', fase: 'fase1' },
  { nome: 'Defensor Sporting', pais: 'URU', fase: 'fase1' }, { nome: 'Boston River', pais: 'URU', fase: 'fase1' },
  { nome: 'Racing-URU', pais: 'URU', fase: 'fase1' }, { nome: 'Montevideo City Torque', pais: 'URU', fase: 'fase1' },
  { nome: 'Academia Puerto Cabello', pais: 'VEN', fase: 'fase1' }, { nome: 'Monagas', pais: 'VEN', fase: 'fase1' },
  { nome: 'Caracas', pais: 'VEN', fase: 'fase1' }, { nome: 'Metropolitanos', pais: 'VEN', fase: 'fase1' },
]

// ── o torneio (formato real de 2026) ────────────────────────────────────────────────────────────────────────────────────
import { type Joga, type Penaltis, type Linha, type Jogo, type Confronto, type CtxJogo, ordena, embaralha, rngDe, turnoEReturno, idaEVolta } from './campeonato-oficial'
import type { FaseEstadual, ResultadoEstadual } from './estaduais'

export const NOME_SULA = 'Sul-Americana'
/** os 6 brasileiros da Sul-Americana 2026 REAL (temporada 1): os 6 melhores da Série A 2025 sem Libertadores */
export const BRASILEIROS_SULA_2026 = ['São Paulo', 'Grêmio', 'Bragantino', 'Atlético-MG', 'Santos', 'Vasco']

export type VagasSula = { grupos: string[]; fase1: string[]; pais: Record<string, string> }
/**
 * Vagas da Sul-Americana. Temporada 1 = a lista real de 2026. Da 2ª em diante, os 6 brasileiros são os 6 primeiros da Série A do
 * ano anterior do modo que NÃO têm vaga na Libertadores (regra de 2027: a faixa começa no 6º e desce com as repetições).
 * Os estrangeiros continuam os de 2026 (⚠️ INCERTO, mesma escolha da Libertadores). `naLiberta` = quem já está na Libertadores
 * do ano (um estrangeiro que está nas duas listas fica só na Libertadores e a Sul-Americana usa os outros).
 */
export function vagasSula(serieA: string[] | null, naLiberta: readonly string[]): VagasSula {
  const pais: Record<string, string> = {}
  for (const e of ESTRANGEIROS_SULA_2026) pais[e.nome] = e.pais
  const br = serieA ? serieA.filter(n => !naLiberta.includes(n)).slice(0, 6) : BRASILEIROS_SULA_2026
  for (const n of br) pais[n] = 'BRA'
  const est = ESTRANGEIROS_SULA_2026.filter(e => !naLiberta.includes(e.nome))
  return { grupos: [...br, ...est.filter(e => e.fase === 'grupos').map(e => e.nome)], fase1: est.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
}

export type ResultadoSula = ResultadoEstadual

const perdedor = (c: Confronto) => (c.vencedor === c.a ? c.b : c.a)
function unico(casa: string, fora: string, joga: Joga, pen: Penaltis, ctx: CtxJogo): Confronto {
  const p = joga(casa, fora, ctx)
  const jogos: Jogo[] = [{ casa, fora, gc: p.gc, gf: p.gf, ctx }]
  if (p.gc !== p.gf) return { a: casa, b: fora, jogos, vencedor: p.gc > p.gf ? casa : fora }
  return { a: casa, b: fora, jogos, vencedor: pen(casa, fora, ctx), penaltis: true }
}

/**
 * A Sul-Americana inteira. `daLiberta` = o que vem da Libertadores do MESMO ano: os 4 eliminados da 3ª fase (entram nos grupos) e
 * os 8 terceiros de grupo (entram no playoff).
 *  · 1ª fase: jogo único entre clubes do MESMO país (sorteio, mando por sorteio); quem tiver número ímpar no país passa direto.
 *  · Grupos: 8 de 4, turno e returno; potes pela força (⚠️ INCERTO: o real usa o ranking da Conmebol), país não repete no grupo.
 *  · Playoff: 2º de grupo × 3º da Libertadores, ida e volta, volta na casa do 3º da Libertadores (⚠️ INCERTO: o pareamento real
 *    segue o ranking; aqui sorteio).
 *  · Oitavas: 1º de grupo × vencedor do playoff (volta na casa do 1º); quartas e semis ida e volta (volta na casa da melhor
 *    campanha); final em JOGO ÚNICO. Empate no agregado = pênaltis.
 */
export function simulaSulAmericana(v: VagasSula, daLiberta: { grupos: string[]; playoff: string[] }, seed: number, joga: Joga, pen: Penaltis, forca: (t: string) => number): ResultadoSula {
  const r = rngDe(seed)
  const fases: FaseEstadual[] = [], jogos: Jogo[] = []
  const pais: Record<string, string> = { ...v.pais }
  // 1ª fase por país
  const porPais = new Map<string, string[]>()
  for (const t of v.fase1) { const p = pais[t] ?? '?'; porPais.set(p, [...(porPais.get(p) ?? []), t]) }
  const conf1: Confronto[] = [], diretos: string[] = []
  for (const [, ts] of porPais) {
    const e = embaralha(ts, r)
    for (let i = 0; i + 1 < e.length; i += 2) conf1.push(unico(e[i], e[i + 1], joga, pen, { serie: NOME_SULA, fase: '1ª fase', rodada: 1 }))
    if (e.length % 2) diretos.push(e[e.length - 1])
  }
  fases.push({ nome: '1ª fase', tabelas: [], confrontos: conf1, rodadas: 1 })
  jogos.push(...conf1.flatMap(c => c.jogos))
  const venc1 = [...conf1.map(c => c.vencedor), ...diretos]
  // grupos
  const cand = [...v.grupos, ...daLiberta.grupos, ...venc1]
  const ord = [...cand].sort((a, b) => forca(b) - forca(a) || a.localeCompare(b))
  const nG = Math.floor(ord.length / 4)
  const potes = [0, 1, 2, 3].map(p => ord.slice(p * nG, p * nG + nG))
  let grupos: string[][] = []
  for (let tent = 0; tent < 50; tent++) {
    grupos = Array.from({ length: nG }, () => [])
    let ok = true
    for (let pi = 0; pi < 4 && ok; pi++) for (const t of embaralha(potes[pi], r)) {
      const g = grupos.find(x => x.length === pi && !x.some(y => pais[y] && pais[y] === pais[t])) ?? (tent === 49 ? grupos.find(x => x.length === pi) : undefined)
      if (!g) { ok = false; break }
      g.push(t)
    }
    if (ok) break
  }
  const L = new Map<string, Linha>()
  for (const g of grupos) for (const t of g) L.set(t, { time: t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0 })
  const jg: Jogo[] = []
  turnoEReturno(4).forEach((rod, ri) => {
    for (const g of grupos) for (const [i, k] of rod) {
      const casa = g[i], fora = g[k], ctx: CtxJogo = { serie: NOME_SULA, fase: 'Fase de grupos', rodada: ri + 1 }
      const p = joga(casa, fora, ctx)
      jg.push({ casa, fora, gc: p.gc, gf: p.gf, ctx })
      const lc = L.get(casa)!, lf = L.get(fora)!
      lc.j++; lf.j++; lc.gp += p.gc; lc.gc += p.gf; lf.gp += p.gf; lf.gc += p.gc
      if (p.gc > p.gf) { lc.v++; lc.pts += 3; lf.d++ } else if (p.gc < p.gf) { lf.v++; lf.pts += 3; lc.d++ } else { lc.e++; lf.e++; lc.pts++; lf.pts++ }
    }
  })
  const tabelas = grupos.map((g, i) => ({ nome: `Grupo ${'ABCDEFGH'[i]}`, tabela: ordena(g.map(t => L.get(t)!), jg) }))
  fases.push({ nome: 'Fase de grupos', tabelas, confrontos: [], rodadas: 6 })
  jogos.push(...jg)
  const campanha = ordena(tabelas.flatMap(t => t.tabela), jg).map(l => l.time)
  const pos = (t: string) => { const i = campanha.indexOf(t); return i < 0 ? 999 : i }
  const primeiros = tabelas.map(t => t.tabela[0].time), segundos = tabelas.map(t => t.tabela[1].time)
  // playoff: 2º × 3º da Libertadores (volta na casa do que veio da Libertadores)
  const terc = embaralha(daLiberta.playoff, r)
  const po = segundos.map((s, i) => idaEVolta(terc[i], s, joga, pen, { serie: NOME_SULA, fase: 'Playoffs', rodada: 1 }, 'penaltis'))
  fases.push({ nome: 'Playoffs', tabelas: [], confrontos: po, rodadas: 2 })
  jogos.push(...po.flatMap(c => c.jogos))
  // oitavas: 1º de grupo × vencedor do playoff, volta na casa do 1º
  const vpo = embaralha(po.map(c => c.vencedor), r)
  const oit = primeiros.map((p, i) => idaEVolta(p, vpo[i], joga, pen, { serie: NOME_SULA, fase: 'Oitavas de final', rodada: 1 }, 'penaltis'))
  fases.push({ nome: 'Oitavas de final', tabelas: [], confrontos: oit, rodadas: 2 })
  jogos.push(...oit.flatMap(c => c.jogos))
  const perdidos: string[][] = [oit.map(perdedor)]
  let cur = oit.map(c => c.vencedor)
  for (const nome of ['Quartas de final', 'Semifinal']) {
    const conf: Confronto[] = []
    for (let i = 0; i + 1 < cur.length; i += 2) {
      const [m, p] = pos(cur[i]) <= pos(cur[i + 1]) ? [cur[i], cur[i + 1]] : [cur[i + 1], cur[i]]
      conf.push(idaEVolta(m, p, joga, pen, { serie: NOME_SULA, fase: nome, rodada: 1 }, 'penaltis'))
    }
    fases.push({ nome, tabelas: [], confrontos: conf, rodadas: 2 })
    jogos.push(...conf.flatMap(c => c.jogos))
    perdidos.unshift(conf.map(perdedor))
    cur = conf.map(c => c.vencedor)
  }
  const [fa, fb] = pos(cur[0]) <= pos(cur[1]) ? [cur[0], cur[1]] : [cur[1], cur[0]]
  const fin = unico(fa, fb, joga, pen, { serie: NOME_SULA, fase: 'Final', rodada: 1 })
  fases.push({ nome: 'Final', tabelas: [], confrontos: [fin], rodadas: 1 })
  jogos.push(...fin.jogos)
  const campeao = fin.vencedor, vice = perdedor(fin)
  const out: string[] = [campeao, vice]
  for (const d of perdidos) for (const t of [...campanha, ...daLiberta.playoff]) if (d.includes(t) && !out.includes(t)) out.push(t)
  for (const c of po) { const t = perdedor(c); if (!out.includes(t)) out.push(t) }
  for (const t of campanha) if (!out.includes(t)) out.push(t)
  for (const c of conf1) { const t = perdedor(c); if (!out.includes(t)) out.push(t) }
  return { estadual: NOME_SULA, fases, jogos, campeao, vice, caem: [], classificacao: out }
}

/** 📅 o dia (mês, dia) de cada página da Sul-Americana, na ordem: 1ª fase, 6 rodadas de grupo, playoffs, oitavas, quartas, semi,
 *  final (calendário real de 2026; em ida e volta vale o dia da ida). */
export const DATAS_SULA: readonly [number, number][] = [
  [3, 4],
  [4, 8], [4, 15], [4, 29], [5, 6], [5, 20], [5, 27],
  [7, 22], [8, 12], [9, 9], [10, 14], [11, 21],
]
