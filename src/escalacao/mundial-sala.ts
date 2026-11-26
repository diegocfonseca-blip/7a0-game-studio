import {applyCupPlans,cupPlanModifiers} from './copa-planos'
// ─── 🌍 LIGA + SUPER MUNDIAL NAS SALAS (Diego 26/11) — o motor ─────────────────
//
// Pedido dele: *"bolar o super mundial nas salas online… conforme foi o último"* — o Mundial de Clubes FIFA de 2025 (EUA,
// 14/06–13/07; Chelsea 3×0 PSG na final). Fonte: pt.wikipedia "Mundial de Clubes FIFA de 2025".
//  · acabou a liga da sala, cada time escolhe um CLUBE de verdade daquele Mundial, um de cada vez, na ORDEM DA TABELA (o 1º
//    escolhe primeiro), e convoca 11 das cartas DESSE clube. O time do leilão some (igual à Liga + Libertadores).
//  · 32 clubes. Quem ninguém pegou entra pela máquina (os mais fortes que sobraram), com as cartas dele (os 11 melhores).
//  · FORMATO REAL: 8 grupos de 4 em turno ÚNICO (3 rodadas); passam os 2 primeiros. Oitavas, quartas, semi e final em JOGO
//    ÚNICO (empate = pênaltis). Sem disputa de 3º lugar.
//  · grupos: 4 potes de 8 pela força; nunca dois clubes da mesma confederação no grupo, menos a Europa, que pode ter até 2
//    (a regra do sorteio da FIFA).
//  · chave fixa do Mundial de 2025: 1A×2B, 1C×2D, 1E×2F, 1G×2H (lado de cima) e 1B×2A, 1D×2C, 1F×2E, 1H×2G (lado de baixo).
//
// ⚠️ Arquivo PURO (sem React e sem CSS) — a trava `scripts/testa-mundial-sala.mts` carrega ele direto no tsx. É a mesma régua de
// jogo da Libertadores da sala (`placar`/`gols` de copa-regional.ts). Mesma ficha + mesma semente = mesma copa em todo aparelho.
import { clubeFechaTime, forcaDoClube, mulberry, placar, gols, completaXIClube, xiPorChavesClube, xiDaMaquinaClube, forcaDoXI, type GolRegional } from './copa-regional'
import { disputaPenaltis } from './penaltis'
import { fatoresTatica, temTatica, dadoDaTatica, type QualTatica } from './copa-taticas'
import type { Entrant, Formation } from './copa-mundo'

export type Confed = 'UEFA' | 'CONMEBOL' | 'AFC' | 'CAF' | 'CONCACAF' | 'OFC'
// 🌍 os 32 do Mundial de 2025, com o nome de CLUBE que as cartas do jogo usam (é a chave que acha as cartas).
export const MUNDIAL_CLUBES: { clube: string; confed: Confed; nome?: string }[] = [
  { clube: 'Chelsea', confed: 'UEFA' }, { clube: 'Real Madrid', confed: 'UEFA' }, { clube: 'Man City', confed: 'UEFA', nome: 'Manchester City' },
  { clube: 'Bayern', confed: 'UEFA', nome: 'Bayern de Munique' }, { clube: 'PSG', confed: 'UEFA', nome: 'Paris Saint-Germain' },
  { clube: 'Inter', confed: 'UEFA', nome: 'Internazionale' }, { clube: 'Porto', confed: 'UEFA' }, { clube: 'Benfica', confed: 'UEFA' },
  { clube: 'Dortmund', confed: 'UEFA', nome: 'Borussia Dortmund' }, { clube: 'Juventus', confed: 'UEFA' },
  { clube: 'Atlético de Madrid', confed: 'UEFA' }, { clube: 'Salzburg', confed: 'UEFA', nome: 'Red Bull Salzburg' },
  { clube: 'Palmeiras', confed: 'CONMEBOL' }, { clube: 'Flamengo', confed: 'CONMEBOL' }, { clube: 'Fluminense', confed: 'CONMEBOL' },
  { clube: 'Botafogo', confed: 'CONMEBOL' }, { clube: 'River Plate', confed: 'CONMEBOL' }, { clube: 'Boca Juniors', confed: 'CONMEBOL' },
  { clube: 'Al-Hilal', confed: 'AFC' }, { clube: 'Urawa Reds', confed: 'AFC', nome: 'Urawa Red Diamonds' }, { clube: 'Al Ain', confed: 'AFC' },
  { clube: 'Ulsan HD', confed: 'AFC' },
  { clube: 'Al Ahly', confed: 'CAF' }, { clube: 'Wydad', confed: 'CAF', nome: 'Wydad Casablanca' }, { clube: 'Espérance', confed: 'CAF', nome: 'Espérance de Tunis' },
  { clube: 'Mamelodi Sundowns', confed: 'CAF' },
  { clube: 'Monterrey', confed: 'CONCACAF' }, { clube: 'Seattle Sounders', confed: 'CONCACAF' }, { clube: 'Pachuca', confed: 'CONCACAF' },
  { clube: 'LAFC', confed: 'CONCACAF', nome: 'Los Angeles FC' }, { clube: 'Inter Miami', confed: 'CONCACAF' },
  { clube: 'Auckland City', confed: 'OFC' },
]
export const MUNDIAL_VAGAS = 32
const CONFED = new Map(MUNDIAL_CLUBES.map(c => [c.clube, c.confed]))
export const confedDoClube = (clube: string): Confed | '?' => CONFED.get(clube) ?? '?'

let poolCache: string[] | null = null
/** os clubes que JOGAM (só os que fecham 11 com as cartas de hoje), do mais forte pro mais fraco */
export function clubesMundial(): string[] {
  if (!poolCache) poolCache = MUNDIAL_CLUBES.map(c => c.clube).filter(clubeFechaTime)
    .sort((x, y) => forcaDoClube(y) - forcaDoClube(x) || x.localeCompare(y))
  return poolCache
}
/** o MELHOR clube livre (o bot na vez dele; e a máquina completando as 32 vagas) */
export function melhorClubeMundial(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = clubesMundial()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}
/** o PIOR clube livre — o castigo de quem deixou o tempo passar sem escolher */
export function piorClubeMundial(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = [...clubesMundial()].reverse()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}

// ─── ⏱️ OS PASSOS (o relógio da sala = `esc_regional_clock`, SEM mudar o banco) ──────
// O banco conta: 1..p_rodadas = bola rolando · p_rodadas+1 = parado · depois p_ko passos de bola · fim.
// Aqui: p_rodadas = 6 (3 rodadas de grupo + oitavas, quartas e semi), p_ko = 1 (a final).
//   1–3 grupos · 4 oitavas · 5 quartas · 6 semi · 7 PARADO (a final definida) · 8 FINAL · 9 cerimônia.
export const MUN = { RODADAS: 3, OITAVAS: 4, QUARTAS: 5, SEMI: 6, PAUSA: 7, FINAL: 8, FIM: 9, P_RODADAS: 6, P_KO: 1 } as const
export const munRodaBola = (s: number) => (s >= 1 && s <= MUN.P_RODADAS) || s === MUN.FINAL
/** o passo que vem abre uma FASE nova (pede o resumo de quem passou/caiu antes da abertura)? */
export const munComResumo = (prox: number) => prox === MUN.OITAVAS || prox === MUN.QUARTAS || prox === MUN.SEMI || prox === MUN.FINAL

// ─── a SIMULAÇÃO ───────────────────────────────────────────────────────────────
export type JogoMun = { h: number; a: number; gh: number; ga: number; ev: GolRegional[] }
export type FaseMunTipo = 'oitavas' | 'quartas' | 'semi'
/** jogo único do mata-mata (a final também): placar no tempo normal e, empatado, pênaltis [h, a] */
export type ConfrontoMun = { h: number; a: number; g: [number, number]; ev: GolRegional[]; pen?: [number, number]; winner: number }
export interface MundoMundial {
  /** 8 grupos com os índices dos 4 clubes (A..H) */
  grupos: number[][]
  /** 3 rodadas × 16 jogos (2 por grupo) */
  rodadas: JogoMun[][]
  /** [1º, 2º] de cada grupo */
  classificados: [number, number][]
  ko: { tipo: FaseMunTipo; ties: ConfrontoMun[] }[]
  final: ConfrontoMun
  campeao: number
}
export const LETRAS_GRUPO = 'ABCDEFGH'

type Linha = { t: number; j: number; pts: number; w: number; d: number; l: number; gp: number; gc: number; sg: number }
const novaLinha = (t: number): Linha => ({ t, j: 0, pts: 0, w: 0, d: 0, l: 0, gp: 0, gc: 0, sg: 0 })
function soma(row: Map<number, Linha>, j: JogoMun) {
  for (const [t, gp, gc] of [[j.h, j.gh, j.ga], [j.a, j.ga, j.gh]] as const) {
    const r = row.get(t); if (!r) continue
    r.j++; r.gp += gp; r.gc += gc; r.sg = r.gp - r.gc
    if (gp > gc) { r.w++; r.pts += 3 } else if (gp === gc) { r.d++; r.pts++ } else r.l++
  }
}
// desempate (régua do jogo): pontos → vitórias → saldo → gols pró → ordem do sorteio
const ordemTabela = (x: Linha, y: Linha) => y.pts - x.pts || y.w - x.w || y.sg - x.sg || y.gp - x.gp || x.t - y.t
/** a tabela de UM grupo depois de `ate` rodadas (só o que já apitou — zero spoiler) */
export function tabelaDoGrupoMun(m: Pick<MundoMundial, 'grupos' | 'rodadas'>, g: number, ate: number): Linha[] {
  const row = new Map(m.grupos[g].map(t => [t, novaLinha(t)]))
  for (const rodada of m.rodadas.slice(0, Math.max(0, ate))) for (const j of rodada) if (row.has(j.h)) soma(row, j)
  return [...row.values()].sort(ordemTabela)
}

// 🗓️ turno único com os 6 pares de 4 clubes
const TURNO: [number, number][][] = [[[0, 1], [2, 3]], [[2, 0], [1, 3]], [[3, 0], [1, 2]]]

/** 🎲 sorteio dos grupos: 4 potes de 8 pela força; regra da FIFA — confederação repetida só a Europa, e no máximo 2 */
function sorteiaGrupos(entrants: Entrant[], r: () => number): number[][] {
  const idx = entrants.map((_, i) => i).sort((x, y) => entrants[y].str - entrants[x].str || x - y)
  const cabe = (g: number[], t: number) => {
    const c = confedDoClube(entrants[t].pais), n = g.filter(x => confedDoClube(entrants[x].pais) === c).length
    return c === 'UEFA' ? n < 2 : c === '?' ? true : n === 0
  }
  for (let tent = 0; tent < 300; tent++) {
    const grupos: number[][] = Array.from({ length: 8 }, () => [])
    let ok = true
    for (let pote = 0; pote < 4 && ok; pote++) {
      const p = idx.slice(pote * 8, pote * 8 + 8)
      for (let i = p.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [p[i], p[k]] = [p[k], p[i]] }
      for (const t of p) {
        const livres = grupos.map((g, gi) => ({ g, gi })).filter(x => x.g.length === pote && cabe(x.g, t))
        if (!livres.length) { ok = false; break }
        livres[0].g.push(t)
      }
    }
    if (ok) return grupos
  }
  // 🛟 a regra não fechou (clubes de gente demais da mesma confederação): sorteio por potes sem a regra — nunca trava a copa
  const grupos: number[][] = Array.from({ length: 8 }, () => [])
  for (let pote = 0; pote < 4; pote++) idx.slice(pote * 8, pote * 8 + 8).forEach((t, i) => grupos[i].push(t))
  return grupos
}

function poissonMun(r: () => number, lambda: number) { let k = 0, p = 1; const L = Math.exp(-lambda); do { k++; p *= r() } while (p > L); return Math.min(6, k - 1) }
function jogo(r: () => number, entrants: Entrant[], h: number, a: number, seed: number, ck: string): JogoMun {
  const [gh, ga] = placar(r, entrants[h], entrants[a])
  return { h, a, gh, ga, ev: gols(r, gh, ga, entrants[h], entrants[a], seed, ck) }
}
// as 8 chaves das oitavas, na ordem do Mundial de 2025: [grupo do 1º, grupo do 2º]
const CHAVE_OITAVAS: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [1, 0], [3, 2], [5, 4], [7, 6]]

/**
 * `entrants` = os 32 da ficha (qualquer ordem). O sorteio dos grupos usa um dado PRÓPRIO; os jogos usam outro — mexer no
 * sorteio nunca muda a régua dos placares.
 */
export function simulaMundialSala(entrants: Entrant[], seed: number, tat?: QualTatica): MundoMundial {
  if (entrants.length !== MUNDIAL_VAGAS) throw new Error(`Super Mundial da sala precisa de ${MUNDIAL_VAGAS} clubes (veio ${entrants.length})`)
  const sorteio = mulberry((seed ^ 0x3D1A1E) >>> 0)
  const rng = mulberry((seed ^ 0x5C0C0A) >>> 0)
  // ⚔️ TÁTICA (mesma régua da Libertadores da sala): jogo com tática de gente sai de um DADO PRÓPRIO, DEPOIS de o dado do torneio
  // já ter andado igual — nenhum outro jogo muda. Sem `tat`, a copa é exatamente a de sempre.
  const comTatica = (h: number, a: number, passo: number, ck: string, baseline: JogoMun): { j: JogoMun; r: () => number } | null => {
    if (!tat) return null
    const th = tat(h, passo), ta = tat(a, passo)
    const r = dadoDaTatica(seed >>> 0, ck, th, ta)
    const adv = entrants[h].str - entrants[a].str
    const [fh, fa] = fatoresTatica(th, ta)
    const initial = temTatica(th, ta) ? (() => { const g: [number, number] = [poissonMun(r, Math.max(.25, 1.25 + adv * .05) * fh), poissonMun(r, Math.max(.25, 1.25 - adv * .05) * fa)]; return { g, ev: gols(r, g[0], g[1], entrants[h], entrants[a], seed, ck), r } })() : { g: [baseline.gh, baseline.ga] as [number, number], ev: baseline.ev, r }
    const planned = applyCupPlans(tat, h, a, passo, seed, ck, initial, (home, away, r) => {
      const hm = cupPlanModifiers(home, entrants[h]), am = cupPlanModifiers(away, entrants[a]), [hf, af] = fatoresTatica(home.posture, away.posture)
      const g: [number, number] = [poissonMun(r, Math.max(.25, 1.25 + adv * .05 + (hm.attack - am.defence) * .055) * hf), poissonMun(r, Math.max(.25, 1.25 - adv * .05 + (am.attack - hm.defence) * .055) * af)]
      return { g, ev: gols(r, g[0], g[1], entrants[h], entrants[a], seed, ck) }
    })
    const result = planned ?? (temTatica(th, ta) ? initial : null)
    return result ? { j: { h, a, gh: result.g[0], ga: result.g[1], ev: result.ev }, r: result.r } : null
  }
  const grupos = sorteiaGrupos(entrants, sorteio)
  const rodadas: JogoMun[][] = []
  for (let rd = 0; rd < MUN.RODADAS; rd++) {
    const js: JogoMun[] = []
    grupos.forEach((g, gi) => {
      for (const [x, y] of TURNO[rd]) {
        const ck = `g${gi}|r${rd}|${g[x]}|${g[y]}`
        const n = jogo(rng, entrants, g[x], g[y], seed, ck)
        js.push(comTatica(g[x], g[y], rd + 1, ck, n)?.j ?? n) // rodada rd = passo rd+1
      }
    })
    rodadas.push(js)
  }
  const parcial = { grupos, rodadas }
  const classificados = grupos.map((_, gi) => { const t = tabelaDoGrupoMun(parcial, gi, MUN.RODADAS); return [t[0].t, t[1].t] as [number, number] })

  // ⚔️ jogo único: o dado do torneio anda SEMPRE igual (placar + pênaltis se empatar); a tática, se tiver, troca o placar depois
  const unico = (h: number, a: number, ck: string, passo: number): ConfrontoMun => {
    const j0 = jogo(rng, entrants, h, a, seed, ck)
    const pen0 = j0.gh === j0.ga ? disputaPenaltis(rng) : undefined
    const t = comTatica(h, a, passo, ck, j0)
    const j = t?.j ?? j0
    const pen = j.gh !== j.ga ? undefined : t ? disputaPenaltis(t.r) : pen0
    const winner = j.gh > j.ga ? h : j.ga > j.gh ? a : pen![0] > pen![1] ? h : a
    return { h, a, g: [j.gh, j.ga], ev: j.ev, ...(pen ? { pen } : {}), winner }
  }
  const ko: MundoMundial['ko'] = []
  let vivos: [number, number][] = CHAVE_OITAVAS.map(([g1, g2]) => [classificados[g1][0], classificados[g2][1]])
  for (const [fi, tipo] of (['oitavas', 'quartas', 'semi'] as FaseMunTipo[]).entries()) {
    const ties = vivos.map(([h, a], i) => unico(h, a, `${tipo}|${i}`, MUN.OITAVAS + fi))
    ko.push({ tipo, ties })
    const w = ties.map(t => t.winner)
    vivos = []
    for (let i = 0; i + 1 < w.length; i += 2) vivos.push([w[i], w[i + 1]])
  }
  const [fh, fa] = vivos[0]
  const final = unico(fh, fa, 'final', MUN.FINAL)
  return { grupos, rodadas, classificados, ko, final, campeao: final.winner }
}

/** os jogos que rolam num passo (pra tela): rodadas de grupo, cada fase do mata-mata, a final */
export function jogosDoPassoMun(m: MundoMundial, s: number): { h: number; a: number; ev: GolRegional[]; tie?: ConfrontoMun }[] {
  if (s >= 1 && s <= MUN.RODADAS) return m.rodadas[s - 1].map(j => ({ h: j.h, a: j.a, ev: j.ev }))
  if (s >= MUN.OITAVAS && s <= MUN.SEMI) return m.ko[s - MUN.OITAVAS].ties.map(t => ({ h: t.h, a: t.a, ev: t.ev, tie: t }))
  if (s === MUN.FINAL) return [{ h: m.final.h, a: m.final.a, ev: m.final.ev, tie: m.final }]
  return []
}
/** a fase do mata-mata de um passo (4–6), ou null */
export const faseDoPassoMun = (m: MundoMundial, s: number) => (s >= MUN.OITAVAS && s <= MUN.SEMI ? m.ko[s - MUN.OITAVAS] : null)

function todosOsGols(m: MundoMundial): { ev: GolRegional[]; h: number; a: number }[] {
  const out: { ev: GolRegional[]; h: number; a: number }[] = []
  for (const rd of m.rodadas) for (const j of rd) out.push(j)
  for (const f of m.ko) for (const t of f.ties) out.push(t)
  out.push(m.final)
  return out
}
/** artilharia (gol da disputa de pênaltis não conta — só gol de jogo) */
export function artilhariaMundial(m: MundoMundial): { name: string; goals: number; team: number }[] {
  const conta = new Map<string, { name: string; goals: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { const t = g.home ? j.h : j.a; const k = `${t}|${g.name}`; const r = conta.get(k) ?? { name: g.name, goals: 0, team: t }; r.goals++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name))
}
/** 🅰️ garçons (a régua do gol vale pra assistência) */
export function garconsMundial(m: MundoMundial): { name: string; assists: number; team: number }[] {
  const conta = new Map<string, { name: string; assists: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { if (!g.assist) continue; const t = g.home ? j.h : j.a; const k = `${t}|${g.assist}`; const r = conta.get(k) ?? { name: g.assist, assists: 0, team: t }; r.assists++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.assists - x.assists || x.name.localeCompare(y.name))
}

// ─── 🧾 A FICHA (o dono monta e grava em `esc_copa_salas.times`; todo aparelho recalcula daqui) ──
export interface PickMundial { pais: string; xiKeys: string[]; form: Formation }
export interface TimeMundial { pais: string; nome: string; uid?: string; xiKeys?: string[] }
export interface FichaMundial { seed: number; edicao: number; times: TimeMundial[] }
export interface LugarMundial { id: number; nome: string; humano: boolean }
const temClube = (p?: PickMundial | null): p is PickMundial => !!p && typeof p.pais === 'string' && !!p.pais
const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
/**
 * TODOS os times da liga entram, na ordem da tabela (a liga tem no máximo 20; o Mundial, 32):
 *  · gente que escolheu → o clube dela (reservado desde o começo, pra bot que terminou acima não "roubar");
 *  · bot → o MELHOR clube que sobrou;
 *  · gente que deixou o tempo passar → o PIOR que sobrou (o mesmo castigo da Libertadores da sala).
 * Depois a máquina completa as 32 vagas com os clubes mais fortes que ninguém pegou.
 */
export function montaFichaMundial(classificacao: LugarMundial[], uidDe: Map<number, string>, picks: Map<string, PickMundial>, seed: number, edicao: number): FichaMundial {
  const todos = clubesMundial()
  const lugares = classificacao.slice(0, MUNDIAL_VAGAS)
  const reservados = new Set<string>()
  for (const l of lugares) { const u = uidDe.get(l.id); const p = u ? picks.get(u) : undefined; if (l.humano && temClube(p) && todos.includes(p.pais)) reservados.add(p.pais) }
  const pegos = new Set<string>()
  const times: TimeMundial[] = []
  for (const l of lugares) {
    const uid = uidDe.get(l.id)
    const p = uid ? picks.get(uid) : undefined
    const clube = l.humano && temClube(p) && todos.includes(p.pais) && !pegos.has(p.pais) ? p.pais
      : l.humano ? piorClubeMundial(pegos, reservados) : melhorClubeMundial(pegos, reservados)
    pegos.add(clube)
    const xiKeys = l.humano && uid ? completaXIClube(clube, p?.form ?? '4-3-3', temClube(p) && p.pais === clube ? p.xiKeys : []).map(chaveCarta) : undefined
    times.push({ pais: clube, nome: l.nome, ...(l.humano && uid ? { uid } : {}), ...(xiKeys ? { xiKeys } : {}) })
  }
  while (times.length < MUNDIAL_VAGAS && times.length < todos.length) { const c = melhorClubeMundial(pegos); pegos.add(c); times.push({ pais: c, nome: c }) }
  return { seed, edicao, times }
}
export function entrantesMundial(f: FichaMundial, meuUid?: string): Entrant[] {
  return f.times.map(t => {
    const xi = t.xiKeys?.length ? xiPorChavesClube(t.pais, t.xiKeys) : xiDaMaquinaClube(t.pais).xi
    return { uid: t.uid, club: t.nome, you: !!t.uid && t.uid === meuUid, pais: t.pais, xi, str: forcaDoXI(xi), humano: !!t.uid }
  })
}
/** o nome bonito do clube pra tela (Man City → Manchester City). A CHAVE continua sendo o nome das cartas. */
const NOMES = new Map(MUNDIAL_CLUBES.filter(c => c.nome).map(c => [c.clube, c.nome!]))
export const nomeClubeMundial = (clube: string): string => NOMES.get(clube) ?? clube
