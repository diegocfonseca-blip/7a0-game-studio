// ─── 🏆 LIGA + LIBERTADORES NAS SALAS (Diego 19/11) — o motor ─────────────────
//
// O que ele fechou (mockup `scripts/mockups/liberta-clubes-390.png`):
//  · acabou a liga da sala, cada time escolhe um CLUBE sul-americano de verdade, um de
//    cada vez, na ORDEM DA TABELA (o 1º escolhe primeiro), e convoca 11 das cartas
//    DESSE clube. O time do leilão some (igual à Copa do Mundo / Euro / regionais).
//  · 32 clubes. Quem ninguém pegou entra pela máquina (os mais fortes que sobraram),
//    com as cartas dele (os 11 melhores).
//  · FORMATO REAL: 8 grupos de 4, turno e returno (6 rodadas); passam os 2 primeiros.
//    Oitavas, quartas e semi em IDA E VOLTA (soma dos gols; empate no agregado =
//    pênaltis, sem gol fora); FINAL em JOGO ÚNICO (empate = pênaltis).
//  · oitavas: 1º de grupo × 2º de OUTRO grupo (sorteio com cabeça de chave), volta na
//    casa do 1º. Quartas e semi: volta na casa de quem fez a melhor campanha nos grupos.
//
// ⚠️ Arquivo PURO (sem React e sem CSS) — a trava `scripts/testa-liberta-sala.mts` carrega
// ele direto no tsx. Mesma régua de jogo do regional (`placar`/`gols` de copa-regional.ts),
// então o placar "tem a mesma cara". Mesma ficha + mesma semente = mesma copa em todo
// aparelho: ninguém manda resultado, cada um recalcula.
import { clubeFechaTime, forcaDoClube, mulberry, placar, gols, completaXIClube, xiPorChavesClube, xiDaMaquinaClube, forcaDoXI, type GolRegional } from './copa-regional'
import { disputaPenaltis } from './penaltis'
import type { Entrant, Formation } from './copa-mundo'

// 🌎 os 36 clubes que fecham um time de 11 com os baralhos normais (lista do Diego, 19/11).
// País = pra o sorteio dos grupos espalhar os clubes do mesmo país (regra real da Conmebol).
export const LIBERTA_CLUBES: { clube: string; pais: string }[] = [
  { clube: 'Flamengo', pais: 'BRA' }, { clube: 'Corinthians', pais: 'BRA' }, { clube: 'São Paulo', pais: 'BRA' }, { clube: 'Palmeiras', pais: 'BRA' },
  { clube: 'Santos', pais: 'BRA' }, { clube: 'Botafogo', pais: 'BRA' }, { clube: 'Vasco', pais: 'BRA' }, { clube: 'Internacional', pais: 'BRA' },
  { clube: 'Grêmio', pais: 'BRA' }, { clube: 'Cruzeiro', pais: 'BRA' }, { clube: 'Fluminense', pais: 'BRA' }, { clube: 'Atlético-MG', pais: 'BRA' },
  { clube: 'River Plate', pais: 'ARG' }, { clube: 'Boca Juniors', pais: 'ARG' }, { clube: 'Racing', pais: 'ARG' }, { clube: 'Independiente', pais: 'ARG' },
  { clube: 'Estudiantes', pais: 'ARG' }, { clube: 'Vélez Sarsfield', pais: 'ARG' }, { clube: 'San Lorenzo', pais: 'ARG' }, { clube: "Newell's Old Boys", pais: 'ARG' },
  { clube: 'Rosario Central', pais: 'ARG' }, { clube: 'Argentinos Juniors', pais: 'ARG' },
  { clube: 'Peñarol', pais: 'URU' }, { clube: 'Nacional-URU', pais: 'URU' },
  { clube: 'Colo-Colo', pais: 'CHI' }, { clube: 'U. de Chile', pais: 'CHI' },
  { clube: 'Olimpia', pais: 'PAR' }, { clube: 'Cerro Porteño', pais: 'PAR' }, { clube: 'Libertad', pais: 'PAR' },
  { clube: 'LDU Quito', pais: 'ECU' }, { clube: 'Barcelona SC', pais: 'ECU' }, { clube: 'Emelec', pais: 'ECU' },
  { clube: 'Atlético Nacional', pais: 'COL' }, { clube: 'América de Cali', pais: 'COL' }, { clube: 'Millonarios', pais: 'COL' },
  { clube: 'Universitario', pais: 'PER' },
]
export const LIBERTA_VAGAS = 32
const PAIS = new Map(LIBERTA_CLUBES.map(c => [c.clube, c.pais]))
export const paisDoClubeLiberta = (clube: string) => PAIS.get(clube) ?? '?'

let poolCache: string[] | null = null
/** os clubes que JOGAM (só os que fecham 11 com o baralho de hoje), do mais forte pro mais fraco */
export function clubesLiberta(): string[] {
  if (!poolCache) poolCache = LIBERTA_CLUBES.map(c => c.clube).filter(clubeFechaTime)
    .sort((x, y) => forcaDoClube(y) - forcaDoClube(x) || x.localeCompare(y))
  return poolCache
}
/** o MELHOR clube livre (o bot na vez dele; e a máquina completando as 32 vagas) */
export function melhorClubeLiberta(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = clubesLiberta()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}
/** o PIOR clube livre — o castigo de quem deixou o tempo passar sem escolher */
export function piorClubeLiberta(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = [...clubesLiberta()].reverse()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}

// ─── ⏱️ OS PASSOS (o relógio da sala = `esc_regional_clock`, SEM mudar o banco) ──────
// O banco conta: 1..p_rodadas = bola rolando · p_rodadas+1 = parado · depois p_ko passos de bola · fim.
// Aqui: p_rodadas = 12 (6 rodadas de grupo + ida/volta de oitavas, quartas e semi), p_ko = 1 (a final).
//   1–6 grupos · 7 oitavas ida · 8 oitavas volta · 9 quartas ida · 10 quartas volta · 11 semi ida ·
//   12 semi volta · 13 PARADO (a final definida) · 14 FINAL · 15 cerimônia.
// O sorteio das oitavas aparece no respiro (resumo + abertura) antes do passo 7.
export const LIB = { RODADAS: 6, OIT_IDA: 7, OIT_VOLTA: 8, QF_IDA: 9, QF_VOLTA: 10, SF_IDA: 11, SF_VOLTA: 12, PAUSA: 13, FINAL: 14, FIM: 15, P_RODADAS: 12, P_KO: 1 } as const
export const libRodaBola = (s: number) => (s >= 1 && s <= LIB.P_RODADAS) || s === LIB.FINAL
/** o passo que vem abre uma FASE nova (pede o resumo de quem passou/caiu antes da abertura)? */
export const libComResumo = (prox: number) => prox === LIB.OIT_IDA || prox === LIB.QF_IDA || prox === LIB.SF_IDA || prox === LIB.FINAL

// ─── a SIMULAÇÃO ───────────────────────────────────────────────────────────────
export type JogoLib = { h: number; a: number; gh: number; ga: number; ev: GolRegional[] }
export type FaseLibTipo = 'oitavas' | 'quartas' | 'semi'
/** confronto de ida e volta: `h` manda a IDA, `a` (a melhor campanha) manda a VOLTA */
export type ConfrontoLib = { h: number; a: number; ida: JogoLib; volta: JogoLib; /** gols no agregado de [h, a] */ agg: [number, number]; /** pênaltis depois da volta, na ordem da volta: [a, h] */ pen?: [number, number]; winner: number }
export type FinalLib = { h: number; a: number; g: [number, number]; ev: GolRegional[]; pen?: [number, number]; winner: number }
export interface MundoLiberta {
  /** 8 grupos com os índices dos 4 clubes (A..H) */
  grupos: number[][]
  /** 6 rodadas × 16 jogos (2 por grupo) */
  rodadas: JogoLib[][]
  /** [1º, 2º] de cada grupo */
  classificados: [number, number][]
  ko: { tipo: FaseLibTipo; ties: ConfrontoLib[] }[]
  final: FinalLib
  campeao: number
}
export const LETRAS_GRUPO = 'ABCDEFGH'

type Linha = { t: number; j: number; pts: number; w: number; d: number; l: number; gp: number; gc: number; sg: number }
const novaLinha = (t: number): Linha => ({ t, j: 0, pts: 0, w: 0, d: 0, l: 0, gp: 0, gc: 0, sg: 0 })
function soma(row: Map<number, Linha>, j: JogoLib) {
  for (const [t, gp, gc] of [[j.h, j.gh, j.ga], [j.a, j.ga, j.gh]] as const) {
    const r = row.get(t); if (!r) continue
    r.j++; r.gp += gp; r.gc += gc; r.sg = r.gp - r.gc
    if (gp > gc) { r.w++; r.pts += 3 } else if (gp === gc) { r.d++; r.pts++ } else r.l++
  }
}
// desempate (régua do jogo): pontos → vitórias → saldo → gols pró → ordem do sorteio
const ordemTabela = (x: Linha, y: Linha) => y.pts - x.pts || y.w - x.w || y.sg - x.sg || y.gp - x.gp || x.t - y.t
/** a tabela de UM grupo depois de `ate` rodadas (só o que já apitou — zero spoiler) */
export function tabelaDoGrupo(m: Pick<MundoLiberta, 'grupos' | 'rodadas'>, g: number, ate: number): Linha[] {
  const row = new Map(m.grupos[g].map(t => [t, novaLinha(t)]))
  for (const rodada of m.rodadas.slice(0, Math.max(0, ate))) for (const j of rodada) if (row.has(j.h)) soma(row, j)
  return [...row.values()].sort(ordemTabela)
}

// 🗓️ turno (3 rodadas) com os 6 pares de 4 clubes; o returno é o espelho com o mando trocado
const TURNO: [number, number][][] = [[[0, 1], [2, 3]], [[2, 0], [1, 3]], [[3, 0], [1, 2]]]

/** 🎲 sorteio dos grupos: 4 potes de 8 pela força; cada grupo leva 1 de cada pote e, quando dá, foge do mesmo país */
function sorteiaGrupos(entrants: Entrant[], r: () => number): number[][] {
  const idx = entrants.map((_, i) => i).sort((x, y) => entrants[y].str - entrants[x].str || x - y)
  const grupos: number[][] = Array.from({ length: 8 }, () => [])
  for (let pote = 0; pote < 4; pote++) {
    const p = idx.slice(pote * 8, pote * 8 + 8)
    for (let i = p.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [p[i], p[k]] = [p[k], p[i]] }
    for (const t of p) {
      const pais = paisDoClubeLiberta(entrants[t].pais)
      const livres = grupos.map((g, gi) => ({ gi, n: g.length, mesmo: g.filter(x => paisDoClubeLiberta(entrants[x].pais) === pais).length })).filter(g => g.n === pote)
      livres.sort((x, y) => x.mesmo - y.mesmo || x.gi - y.gi)
      grupos[livres[0].gi].push(t)
    }
  }
  return grupos
}

function jogo(r: () => number, entrants: Entrant[], h: number, a: number, seed: number, ck: string): JogoLib {
  const [gh, ga] = placar(r, entrants[h], entrants[a])
  return { h, a, gh, ga, ev: gols(r, gh, ga, entrants[h], entrants[a], seed, ck) }
}

/**
 * `entrants` = os 32 da ficha (qualquer ordem). O sorteio dos grupos e das oitavas usa um dado
 * PRÓPRIO; os jogos usam outro — mexer no sorteio nunca muda a régua dos placares.
 */
export function simulaLibertaSala(entrants: Entrant[], seed: number): MundoLiberta {
  if (entrants.length !== LIBERTA_VAGAS) throw new Error(`Libertadores da sala precisa de ${LIBERTA_VAGAS} clubes (veio ${entrants.length})`)
  const sorteio = mulberry((seed ^ 0x11BE47A) >>> 0)
  const rng = mulberry((seed ^ 0x2E610A1) >>> 0)
  const grupos = sorteiaGrupos(entrants, sorteio)
  // 6 rodadas: 1–3 turno, 4–6 returno (mando invertido)
  const rodadas: JogoLib[][] = []
  for (let rd = 0; rd < 6; rd++) {
    const base = TURNO[rd % 3]
    const js: JogoLib[] = []
    grupos.forEach((g, gi) => {
      for (const [x, y] of base) {
        const [h, a] = rd < 3 ? [g[x], g[y]] : [g[y], g[x]]
        js.push(jogo(rng, entrants, h, a, seed, `g${gi}|r${rd}|${h}|${a}`))
      }
    })
    rodadas.push(js)
  }
  const parcial = { grupos, rodadas }
  const classificados = grupos.map((_, gi) => { const t = tabelaDoGrupo(parcial, gi, 6); return [t[0].t, t[1].t] as [number, number] })
  // 📊 a campanha na fase de grupos decide quem manda a volta das quartas/semi e quem é o "mandante" da final
  const geral = new Map(entrants.map((_, i) => [i, novaLinha(i)]))
  for (const rd of rodadas) for (const j of rd) soma(geral, j)
  const rankCamp = new Map([...geral.values()].sort(ordemTabela).map((l, i) => [l.t, i]))
  const melhor = (x: number, y: number) => ((rankCamp.get(x) ?? 99) <= (rankCamp.get(y) ?? 99) ? x : y)

  // 🎲 sorteio das oitavas: os 8 primeiros (cabeças) × os 8 segundos, nunca do MESMO grupo
  const grupoDe = new Map<number, number>(); grupos.forEach((g, gi) => g.forEach(t => grupoDe.set(t, gi)))
  const prim = classificados.map(c => c[0]), seg = classificados.map(c => c[1])
  let ordemSeg: number[] = []
  for (let tent = 0; tent < 200; tent++) {
    const s = [...seg]
    for (let i = s.length - 1; i > 0; i--) { const k = Math.floor(sorteio() * (i + 1)); [s[i], s[k]] = [s[k], s[i]] }
    if (s.every((t, i) => grupoDe.get(t) !== grupoDe.get(prim[i]))) { ordemSeg = s; break }
  }
  if (!ordemSeg.length) ordemSeg = seg.map((_, i) => seg[(i + 1) % seg.length]) // 🛟 rodízio: nunca cai no mesmo grupo
  const ordemPrim = [...prim]
  // a ordem das chaves (quem cruza com quem nas quartas) também é sorteada, como no real
  const chaves = ordemPrim.map((p, i) => [ordemSeg[i], p] as [number, number])
  for (let i = chaves.length - 1; i > 0; i--) { const k = Math.floor(sorteio() * (i + 1)); [chaves[i], chaves[k]] = [chaves[k], chaves[i]] }

  const idaEVolta = (h: number, a: number, ck: string): ConfrontoLib => {
    const ida = jogo(rng, entrants, h, a, seed, `${ck}|ida`)
    const volta = jogo(rng, entrants, a, h, seed, `${ck}|volta`)
    const agg: [number, number] = [ida.gh + volta.ga, ida.ga + volta.gh]
    const pen = agg[0] === agg[1] ? disputaPenaltis(rng) : undefined
    const winner = agg[0] > agg[1] ? h : agg[1] > agg[0] ? a : pen![0] > pen![1] ? a : h
    return { h, a, ida, volta, agg, ...(pen ? { pen } : {}), winner }
  }
  const ko: MundoLiberta['ko'] = []
  let vivos: [number, number][] = chaves // [manda a ida, manda a volta]
  for (const tipo of ['oitavas', 'quartas', 'semi'] as FaseLibTipo[]) {
    const ties = vivos.map(([h, a], i) => idaEVolta(h, a, `${tipo}|${i}`))
    ko.push({ tipo, ties })
    const w = ties.map(t => t.winner)
    vivos = []
    for (let i = 0; i + 1 < w.length; i += 2) { const b = melhor(w[i], w[i + 1]); vivos.push([b === w[i] ? w[i + 1] : w[i], b]) }
  }
  const [f1, f2] = vivos[0]
  const fh = melhor(f1, f2), fa = fh === f1 ? f2 : f1
  const fj = jogo(rng, entrants, fh, fa, seed, 'final')
  const fpen = fj.gh === fj.ga ? disputaPenaltis(rng) : undefined
  const final: FinalLib = { h: fh, a: fa, g: [fj.gh, fj.ga], ev: fj.ev, ...(fpen ? { pen: fpen } : {}), winner: fj.gh > fj.ga ? fh : fj.ga > fj.gh ? fa : fpen![0] > fpen![1] ? fh : fa }
  return { grupos, rodadas, classificados, ko, final, campeao: final.winner }
}

/** os jogos que rolam num passo (pra tela): rodadas de grupo, ida/volta de cada fase, a final */
export function jogosDoPasso(m: MundoLiberta, s: number): { h: number; a: number; ev: GolRegional[]; tie?: ConfrontoLib; volta?: boolean; final?: FinalLib }[] {
  if (s >= 1 && s <= LIB.RODADAS) return m.rodadas[s - 1].map(j => ({ h: j.h, a: j.a, ev: j.ev }))
  if (s >= LIB.OIT_IDA && s <= LIB.SF_VOLTA) {
    const f = m.ko[Math.floor((s - LIB.OIT_IDA) / 2)], volta = (s - LIB.OIT_IDA) % 2 === 1
    return f.ties.map(t => { const j = volta ? t.volta : t.ida; return { h: j.h, a: j.a, ev: j.ev, tie: t, volta } })
  }
  if (s === LIB.FINAL) return [{ h: m.final.h, a: m.final.a, ev: m.final.ev, final: m.final }]
  return []
}
/** a fase do mata-mata de um passo (7–12), ou null */
export const faseDoPasso = (m: MundoLiberta, s: number) => (s >= LIB.OIT_IDA && s <= LIB.SF_VOLTA ? m.ko[Math.floor((s - LIB.OIT_IDA) / 2)] : null)

function todosOsGols(m: MundoLiberta): { ev: GolRegional[]; h: number; a: number }[] {
  const out: { ev: GolRegional[]; h: number; a: number }[] = []
  for (const rd of m.rodadas) for (const j of rd) out.push(j)
  for (const f of m.ko) for (const t of f.ties) out.push(t.ida, t.volta)
  out.push({ ev: m.final.ev, h: m.final.h, a: m.final.a })
  return out
}
/** artilharia (gol da disputa de pênaltis não conta — só gol de jogo) */
export function artilhariaLiberta(m: MundoLiberta): { name: string; goals: number; team: number }[] {
  const conta = new Map<string, { name: string; goals: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { const t = g.home ? j.h : j.a; const k = `${t}|${g.name}`; const r = conta.get(k) ?? { name: g.name, goals: 0, team: t }; r.goals++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name))
}
/** 🅰️ garçons (a régua do gol vale pra assistência) */
export function garconsLiberta(m: MundoLiberta): { name: string; assists: number; team: number }[] {
  const conta = new Map<string, { name: string; assists: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { if (!g.assist) continue; const t = g.home ? j.h : j.a; const k = `${t}|${g.assist}`; const r = conta.get(k) ?? { name: g.assist, assists: 0, team: t }; r.assists++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.assists - x.assists || x.name.localeCompare(y.name))
}

// ─── 🧾 A FICHA (o dono monta e grava em `esc_copa_salas.times`; todo aparelho recalcula daqui) ──
export interface PickLiberta { pais: string; xiKeys: string[]; form: Formation }
export interface TimeLiberta { pais: string; nome: string; uid?: string; xiKeys?: string[] }
export interface FichaLiberta { seed: number; edicao: number; times: TimeLiberta[] }
export interface LugarLiberta { id: number; nome: string; humano: boolean }
const temClubeLib = (p?: PickLiberta | null): p is PickLiberta => !!p && typeof p.pais === 'string' && !!p.pais
const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
/**
 * TODOS os times da liga entram, na ordem da tabela:
 *  · gente que escolheu → o clube dela (reservado desde o começo, pra bot que terminou acima não "roubar");
 *  · bot → o MELHOR clube que sobrou;
 *  · gente que deixou o tempo passar → o PIOR que sobrou (o mesmo castigo das regionais).
 * Depois a máquina completa as 32 vagas com os clubes mais fortes que ninguém pegou.
 */
export function montaFichaLiberta(classificacao: LugarLiberta[], uidDe: Map<number, string>, picks: Map<string, PickLiberta>, seed: number, edicao: number): FichaLiberta {
  const todos = clubesLiberta()
  const lugares = classificacao.slice(0, LIBERTA_VAGAS)
  const reservados = new Set<string>()
  for (const l of lugares) { const u = uidDe.get(l.id); const p = u ? picks.get(u) : undefined; if (l.humano && temClubeLib(p) && todos.includes(p.pais)) reservados.add(p.pais) }
  const pegos = new Set<string>()
  const times: TimeLiberta[] = []
  for (const l of lugares) {
    const uid = uidDe.get(l.id)
    const p = uid ? picks.get(uid) : undefined
    const clube = l.humano && temClubeLib(p) && todos.includes(p.pais) && !pegos.has(p.pais) ? p.pais
      : l.humano ? piorClubeLiberta(pegos, reservados) : melhorClubeLiberta(pegos, reservados)
    pegos.add(clube)
    const xiKeys = l.humano && uid ? completaXIClube(clube, p?.form ?? '4-3-3', temClubeLib(p) && p.pais === clube ? p.xiKeys : []).map(chaveCarta) : undefined
    times.push({ pais: clube, nome: l.nome, ...(l.humano && uid ? { uid } : {}), ...(xiKeys ? { xiKeys } : {}) })
  }
  while (times.length < LIBERTA_VAGAS && times.length < todos.length) { const c = melhorClubeLiberta(pegos); pegos.add(c); times.push({ pais: c, nome: c }) }
  return { seed, edicao, times }
}
export function entrantesLiberta(f: FichaLiberta, meuUid?: string): Entrant[] {
  return f.times.map(t => {
    const xi = t.xiKeys?.length ? xiPorChavesClube(t.pais, t.xiKeys) : xiDaMaquinaClube(t.pais).xi
    return { club: t.nome, you: !!t.uid && t.uid === meuUid, pais: t.pais, xi, str: forcaDoXI(xi), humano: !!t.uid }
  })
}
