import {applyCupPlans,cupPlanModifiers} from './copa-planos'
// ─── ⭐ LIGA + CHAMPIONS NAS SALAS (Diego 26/11) — o motor ─────────────────
//
// Pedido dele: *"liga mais Champions… como foi a última Champions"* — a Champions 2025–26 (fase de liga de 36 clubes).
// Fonte: pt.wikipedia "Liga dos Campeões da UEFA de 2025–26".
//  · acabou a liga da sala, cada time escolhe um CLUBE de verdade daquela Champions, um de cada vez, na ORDEM DA TABELA (o 1º
//    escolhe primeiro), e convoca 11 das cartas DESSE clube. O time do leilão some (igual à Liga + Libertadores / Super Mundial).
//  · 36 clubes. Quem ninguém pegou entra pela máquina, com as cartas dele (os 11 melhores).
//  · FORMATO REAL: fase de liga numa tabela só, 8 jogos por clube (4 em casa, 4 fora), adversários de potes diferentes, ninguém
//    repete adversário (o calendário é o da Só Champions, `calendarioChampions`). 1º–8º direto nas oitavas; 9º–24º no
//    playoff (repescão) em ida e volta; 25º pra baixo, fora.
//  · Playoff, oitavas, quartas e semi em IDA E VOLTA (soma dos gols; empate no agregado = pênaltis, sem gol fora — regra
//    da UEFA desde 2021). Volta na casa de quem terminou MELHOR na fase de liga. FINAL em JOGO ÚNICO (empate = pênaltis).
//  · chave fixa pela classificação (sem sorteio, como a UEFA passou a fazer): playoff 9×24, 10×23… 16×17; o vencedor do
//    9×24 pega o 8º, o do 16×17 pega o 1º. O 1º e o 2º só se cruzam na final.
//  ⚠️ Simplificação conhecida: a regra "dois clubes do mesmo país não se enfrentam na fase de liga" NÃO entra — os times de
//    gente escolhem clube à vontade e o calendário de 8 rodadas precisa fechar sempre.
//
// ⚠️ Arquivo PURO (sem React e sem CSS) — a trava `scripts/testa-champions-sala.mts` carrega ele direto no tsx. Mesma régua de
// jogo da Libertadores da sala (`placar`/`gols` de copa-regional.ts). Mesma ficha + mesma semente = mesma copa em todo aparelho.
import { clubeFechaTime, forcaDoClube, mulberry, placar, gols, completaXIClube, xiPorChavesClube, xiDaMaquinaClube, forcaDoXI, type GolRegional } from './copa-regional'
import { disputaPenaltis } from './penaltis'
import { fatoresTatica, temTatica, dadoDaTatica, type QualTatica } from './copa-taticas'
import { potesChampions, calendarioChampions } from './champions'
import type { Entrant, Formation } from './copa-mundo'

// ⭐ os 36 da fase de liga 2025–26, com o nome de CLUBE que as cartas do jogo usam (é a chave que acha as cartas).
export const CHAMPIONS_SALA_CLUBES: { clube: string; pais: string; nome?: string }[] = [
  { clube: 'Liverpool', pais: 'ING' }, { clube: 'Arsenal', pais: 'ING' }, { clube: 'Man City', pais: 'ING', nome: 'Manchester City' },
  { clube: 'Chelsea', pais: 'ING' }, { clube: 'Newcastle', pais: 'ING' }, { clube: 'Tottenham', pais: 'ING' },
  { clube: 'Barcelona', pais: 'ESP' }, { clube: 'Real Madrid', pais: 'ESP' }, { clube: 'Atlético de Madrid', pais: 'ESP' },
  { clube: 'Athletic Bilbao', pais: 'ESP' }, { clube: 'Villarreal', pais: 'ESP' },
  { clube: 'Inter', pais: 'ITA', nome: 'Internazionale' }, { clube: 'Napoli', pais: 'ITA' }, { clube: 'Juventus', pais: 'ITA' }, { clube: 'Atalanta', pais: 'ITA' },
  { clube: 'Bayern', pais: 'ALE', nome: 'Bayern de Munique' }, { clube: 'Leverkusen', pais: 'ALE', nome: 'Bayer Leverkusen' },
  { clube: 'Dortmund', pais: 'ALE', nome: 'Borussia Dortmund' }, { clube: 'Eintracht Frankfurt', pais: 'ALE' },
  { clube: 'PSG', pais: 'FRA', nome: 'Paris Saint-Germain' }, { clube: 'Monaco', pais: 'FRA' }, { clube: 'Marseille', pais: 'FRA' },
  { clube: 'Benfica', pais: 'POR' }, { clube: 'Sporting', pais: 'POR' },
  { clube: 'PSV', pais: 'HOL' }, { clube: 'Ajax', pais: 'HOL' },
  { clube: 'Union SG', pais: 'BEL', nome: 'Union Saint-Gilloise' }, { clube: 'Brugge', pais: 'BEL', nome: 'Club Brugge' },
  { clube: 'Galatasaray', pais: 'TUR' }, { clube: 'Slavia Praga', pais: 'TCH' }, { clube: 'Olympiacos', pais: 'GRE' },
  { clube: 'Copenhagen', pais: 'DIN', nome: 'Copenhague' }, { clube: 'Bodø/Glimt', pais: 'NOR' }, { clube: 'Qarabağ', pais: 'AZE' },
  { clube: 'Pafos', pais: 'CHP' }, { clube: 'Kairat', pais: 'CAZ', nome: 'Kairat Almaty' },
]
export const CHAMPIONS_SALA_VAGAS = 36

let poolCache: string[] | null = null
/** os clubes que JOGAM (só os que fecham 11 com as cartas de hoje), do mais forte pro mais fraco */
export function clubesChampionsSala(): string[] {
  if (!poolCache) poolCache = CHAMPIONS_SALA_CLUBES.map(c => c.clube).filter(clubeFechaTime)
    .sort((x, y) => forcaDoClube(y) - forcaDoClube(x) || x.localeCompare(y))
  return poolCache
}
export function melhorClubeChampions(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = clubesChampionsSala()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}
export function piorClubeChampions(pegos: Set<string>, reservados = new Set<string>()): string {
  const t = [...clubesChampionsSala()].reverse()
  return t.find(c => !pegos.has(c) && !reservados.has(c)) ?? t.find(c => !pegos.has(c)) ?? t[0]
}

// ─── ⏱️ OS PASSOS (o relógio da sala = `esc_regional_clock`, SEM mudar o banco: p_rodadas ≤ 16, p_ko ≤ 4) ──────
//   1–8 fase de liga · 9 playoff ida · 10 playoff volta · 11 oitavas ida · 12 oitavas volta · 13 quartas ida · 14 quartas volta ·
//   15 semi ida · 16 semi volta · 17 PARADO (a final definida) · 18 FINAL · 19 cerimônia.
export const CHS = { RODADAS: 8, KO_IDA: 9, SF_VOLTA: 16, PAUSA: 17, FINAL: 18, FIM: 19, P_RODADAS: 16, P_KO: 1 } as const
export const chsRodaBola = (s: number) => (s >= 1 && s <= CHS.P_RODADAS) || s === CHS.FINAL
/** o passo que vem abre uma FASE nova? (playoff, oitavas, quartas, semi e final) */
export const chsComResumo = (prox: number) => (prox >= CHS.KO_IDA && prox <= CHS.SF_VOLTA && (prox - CHS.KO_IDA) % 2 === 0) || prox === CHS.FINAL
/** o índice da fase do mata-mata de um passo (9–16), ou -1 */
export const faseIdxCh = (s: number) => (s >= CHS.KO_IDA && s <= CHS.SF_VOLTA ? Math.floor((s - CHS.KO_IDA) / 2) : -1)
export const ehVoltaCh = (s: number) => s >= CHS.KO_IDA && s <= CHS.SF_VOLTA && (s - CHS.KO_IDA) % 2 === 1
/** os cortes da fase de liga (posição 1-based) */
export const zonaCh = (pos: number): 'direto' | 'playoff' | 'fora' => (pos <= 8 ? 'direto' : pos <= 24 ? 'playoff' : 'fora')

// ─── a SIMULAÇÃO ───────────────────────────────────────────────────────────────
export type JogoCh = { h: number; a: number; gh: number; ga: number; ev: GolRegional[] }
export type FaseChTipo = 'playoff' | 'oitavas' | 'quartas' | 'semi'
/** ida e volta: `h` manda a IDA, `a` (quem terminou melhor na fase de liga) manda a VOLTA */
export type ConfrontoCh = { h: number; a: number; ida: JogoCh; volta: JogoCh; agg: [number, number]; /** pênaltis depois da volta: [a, h] */ pen?: [number, number]; winner: number }
export type FinalCh = { h: number; a: number; g: [number, number]; ev: GolRegional[]; pen?: [number, number]; winner: number }
export interface MundoChampions {
  /** 8 rodadas × 18 jogos */
  rodadas: JogoCh[][]
  /** a classificação final da fase de liga (36 índices, do 1º ao último) */
  classificacao: number[]
  ko: { tipo: FaseChTipo; ties: ConfrontoCh[] }[]
  final: FinalCh
  campeao: number
}

export type LinhaCh = { t: number; j: number; pts: number; w: number; d: number; l: number; gp: number; gc: number; sg: number }
const novaLinha = (t: number): LinhaCh => ({ t, j: 0, pts: 0, w: 0, d: 0, l: 0, gp: 0, gc: 0, sg: 0 })
function soma(row: Map<number, LinhaCh>, j: JogoCh) {
  for (const [t, gp, gc] of [[j.h, j.gh, j.ga], [j.a, j.ga, j.gh]] as const) {
    const r = row.get(t); if (!r) continue
    r.j++; r.gp += gp; r.gc += gc; r.sg = r.gp - r.gc
    if (gp > gc) { r.w++; r.pts += 3 } else if (gp === gc) { r.d++; r.pts++ } else r.l++
  }
}
// desempate (régua do jogo): pontos → vitórias → saldo → gols pró → ordem da ficha
const ordemTabela = (x: LinhaCh, y: LinhaCh) => y.pts - x.pts || y.w - x.w || y.sg - x.sg || y.gp - x.gp || x.t - y.t
/** a tabela de 36 depois de `ate` rodadas (só o que já apitou — zero spoiler) */
export function tabelaChampionsSala(m: Pick<MundoChampions, 'rodadas'>, n: number, ate: number): LinhaCh[] {
  const row = new Map(Array.from({ length: n }, (_, t) => [t, novaLinha(t)]))
  for (const rodada of m.rodadas.slice(0, Math.max(0, ate))) for (const j of rodada) soma(row, j)
  return [...row.values()].sort(ordemTabela)
}

function poissonCh(r: () => number, lambda: number) { let k = 0, p = 1; const L = Math.exp(-lambda); do { k++; p *= r() } while (p > L); return Math.min(6, k - 1) }
function jogo(r: () => number, entrants: Entrant[], h: number, a: number, seed: number, ck: string): JogoCh {
  const [gh, ga] = placar(r, entrants[h], entrants[a])
  return { h, a, gh, ga, ev: gols(r, gh, ga, entrants[h], entrants[a], seed, ck) }
}
// as oitavas na ordem do chaveamento: a posição do cabeça (1–8). Vizinhos se cruzam nas quartas; 1 e 2 só na final.
const ORDEM_OITAVAS = [1, 8, 4, 5, 2, 7, 3, 6]

export function simulaChampionsSala(entrants: Entrant[], seed: number, tat?: QualTatica): MundoChampions {
  if (entrants.length !== CHAMPIONS_SALA_VAGAS) throw new Error(`Champions da sala precisa de ${CHAMPIONS_SALA_VAGAS} clubes (veio ${entrants.length})`)
  const sorteio = mulberry((seed ^ 0x0C4A3B1) >>> 0)
  const rng = mulberry((seed ^ 0x7E5A11F) >>> 0)
  const comTatica = (h: number, a: number, passo: number, ck: string,baseline:JogoCh): { j: JogoCh; r: () => number } | null => {
    if (!tat) return null
    const th = tat(h, passo), ta = tat(a, passo)
    const r = dadoDaTatica(seed >>> 0, ck, th, ta)
    const adv = entrants[h].str - entrants[a].str
    const [fh, fa] = fatoresTatica(th, ta)
    const initial=temTatica(th,ta)?(()=>{const g:[number,number]=[poissonCh(r,Math.max(.25,1.25+adv*.05)*fh),poissonCh(r,Math.max(.25,1.25-adv*.05)*fa)];return{g,ev:gols(r,g[0],g[1],entrants[h],entrants[a],seed,ck),r}})():{g:[baseline.gh,baseline.ga] as [number,number],ev:baseline.ev,r}
    const planned=applyCupPlans(tat,h,a,passo,seed,ck,initial,(home,away,r)=>{
      const hm=cupPlanModifiers(home,entrants[h]),am=cupPlanModifiers(away,entrants[a]),[hf,af]=fatoresTatica(home.posture,away.posture)
      const g:[number,number]=[poissonCh(r,Math.max(.25,1.25+adv*.05+(hm.attack-am.defence)*.055)*hf),poissonCh(r,Math.max(.25,1.25-adv*.05+(am.attack-hm.defence)*.055)*af)]
      return{g,ev:gols(r,g[0],g[1],entrants[h],entrants[a],seed,ck)}
    })
    const result=planned??(temTatica(th,ta)?initial:null)
    return result?{j:{h,a,gh:result.g[0],ga:result.g[1],ev:result.ev},r:result.r}:null
  }
  const jogoT = (h: number, a: number, passo: number, ck: string): JogoCh => {
    const normal = jogo(rng, entrants, h, a, seed, ck)
    return comTatica(h, a, passo, ck, normal)?.j ?? normal
  }
  // 🎱 potes pela força e o calendário da Só Champions (8 adversários de potes diferentes, 4 em casa e 4 fora)
  const ids = entrants.map((_, i) => i)
  const cal = calendarioChampions(ids, potesChampions(entrants.map(e => e.str)), sorteio)
  const rodadas: JogoCh[][] = cal.map((rd, ri) => rd.map(([h, a]) => jogoT(h, a, ri + 1, `liga|r${ri}|${h}|${a}`)))
  const classificacao = tabelaChampionsSala({ rodadas }, entrants.length, CHS.RODADAS).map(l => l.t)
  const posDe = new Map(classificacao.map((t, i) => [t, i]))
  const melhor = (x: number, y: number) => ((posDe.get(x) ?? 99) <= (posDe.get(y) ?? 99) ? x : y)

  const idaEVolta = (x: number, y: number, ck: string, passoIda: number): ConfrontoCh => {
    const a = melhor(x, y), h = a === x ? y : x // quem terminou melhor manda a VOLTA
    const i0 = jogo(rng, entrants, h, a, seed, `${ck}|ida`)
    const v0 = jogo(rng, entrants, a, h, seed, `${ck}|volta`)
    const agg0: [number, number] = [i0.gh + v0.ga, i0.ga + v0.gh]
    const pen0 = agg0[0] === agg0[1] ? disputaPenaltis(rng) : undefined // o dado do torneio anda SEMPRE igual
    const ti = comTatica(h, a, passoIda, `${ck}|ida`, i0), tv = comTatica(a, h, passoIda + 1, `${ck}|volta`, v0)
    const ida = ti?.j ?? i0, volta = tv?.j ?? v0
    const agg: [number, number] = [ida.gh + volta.ga, ida.ga + volta.gh]
    const dadoPen = tv?.r ?? ti?.r
    const pen = agg[0] !== agg[1] ? undefined : !ti && !tv ? pen0 : disputaPenaltis(dadoPen!)
    const winner = agg[0] > agg[1] ? h : agg[1] > agg[0] ? a : pen![0] > pen![1] ? a : h
    return { h, a, ida, volta, agg, ...(pen ? { pen } : {}), winner }
  }
  const ko: MundoChampions['ko'] = []
  // 🥊 playoff: 9×24, 10×23 … 16×17 (posições 1-based)
  const playoff = Array.from({ length: 8 }, (_, i) => idaEVolta(classificacao[8 + i], classificacao[23 - i], `playoff|${i}`, CHS.KO_IDA))
  ko.push({ tipo: 'playoff', ties: playoff })
  // oitavas: o cabeça da posição p pega o vencedor do playoff que começou no (17 − p)º  →  1º × (16×17), 8º × (9×24)
  let vivos: [number, number][] = ORDEM_OITAVAS.map(p => [classificacao[p - 1], playoff[8 - p].winner])
  for (const [fi, tipo] of (['oitavas', 'quartas', 'semi'] as FaseChTipo[]).entries()) {
    const ties = vivos.map(([x, y], i) => idaEVolta(x, y, `${tipo}|${i}`, CHS.KO_IDA + 2 * (fi + 1)))
    ko.push({ tipo, ties })
    const w = ties.map(t => t.winner)
    vivos = []
    for (let i = 0; i + 1 < w.length; i += 2) vivos.push([w[i], w[i + 1]])
  }
  const [f1, f2] = vivos[0]
  const fh = melhor(f1, f2), fa = fh === f1 ? f2 : f1 // campo neutro: o "mandante" é quem fez a melhor fase de liga
  const f0 = jogo(rng, entrants, fh, fa, seed, 'final')
  const fpen0 = f0.gh === f0.ga ? disputaPenaltis(rng) : undefined
  const tf = comTatica(fh, fa, CHS.FINAL, 'final', f0)
  const fj = tf?.j ?? f0
  const fpen = fj.gh !== fj.ga ? undefined : tf ? disputaPenaltis(tf.r) : fpen0
  const final: FinalCh = { h: fh, a: fa, g: [fj.gh, fj.ga], ev: fj.ev, ...(fpen ? { pen: fpen } : {}), winner: fj.gh > fj.ga ? fh : fj.ga > fj.gh ? fa : fpen![0] > fpen![1] ? fh : fa }
  return { rodadas, classificacao, ko, final, campeao: final.winner }
}

/** os jogos que rolam num passo (pra tela) */
export function jogosDoPassoCh(m: MundoChampions, s: number): { h: number; a: number; ev: GolRegional[]; tie?: ConfrontoCh; volta?: boolean; final?: FinalCh }[] {
  if (s >= 1 && s <= CHS.RODADAS) return m.rodadas[s - 1].map(j => ({ h: j.h, a: j.a, ev: j.ev }))
  const fi = faseIdxCh(s)
  if (fi >= 0) {
    const volta = ehVoltaCh(s)
    return m.ko[fi].ties.map(t => { const j = volta ? t.volta : t.ida; return { h: j.h, a: j.a, ev: j.ev, tie: t, volta } })
  }
  if (s === CHS.FINAL) return [{ h: m.final.h, a: m.final.a, ev: m.final.ev, final: m.final }]
  return []
}
export const faseDoPassoCh = (m: MundoChampions, s: number) => { const fi = faseIdxCh(s); return fi >= 0 ? m.ko[fi] : null }

function todosOsGols(m: MundoChampions): { ev: GolRegional[]; h: number; a: number }[] {
  const out: { ev: GolRegional[]; h: number; a: number }[] = []
  for (const rd of m.rodadas) for (const j of rd) out.push(j)
  for (const f of m.ko) for (const t of f.ties) out.push(t.ida, t.volta)
  out.push({ ev: m.final.ev, h: m.final.h, a: m.final.a })
  return out
}
export function artilhariaChampionsSala(m: MundoChampions): { name: string; goals: number; team: number }[] {
  const conta = new Map<string, { name: string; goals: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { const t = g.home ? j.h : j.a; const k = `${t}|${g.name}`; const r = conta.get(k) ?? { name: g.name, goals: 0, team: t }; r.goals++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name))
}
/** 🅰️ garçons (a régua do gol vale pra assistência) */
export function garconsChampionsSala(m: MundoChampions): { name: string; assists: number; team: number }[] {
  const conta = new Map<string, { name: string; assists: number; team: number }>()
  for (const j of todosOsGols(m)) for (const g of j.ev) { if (!g.assist) continue; const t = g.home ? j.h : j.a; const k = `${t}|${g.assist}`; const r = conta.get(k) ?? { name: g.assist, assists: 0, team: t }; r.assists++; conta.set(k, r) }
  return [...conta.values()].sort((x, y) => y.assists - x.assists || x.name.localeCompare(y.name))
}

// ─── 🧾 A FICHA (o dono monta e grava em `esc_copa_salas.times`; todo aparelho recalcula daqui) ──
export interface PickChampions { pais: string; xiKeys: string[]; form: Formation }
export interface TimeChampions { pais: string; nome: string; uid?: string; xiKeys?: string[] }
export interface FichaChampions { seed: number; edicao: number; times: TimeChampions[] }
export interface LugarChampions { id: number; nome: string; humano: boolean }
const temClube = (p?: PickChampions | null): p is PickChampions => !!p && typeof p.pais === 'string' && !!p.pais
const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
/** igual à Libertadores da sala: gente escolhe (reservado), bot leva o melhor que sobrou, quem deixou o tempo passar leva o pior;
 * a máquina completa as 36 vagas com os mais fortes que ninguém pegou. */
export function montaFichaChampions(classificacao: LugarChampions[], uidDe: Map<number, string>, picks: Map<string, PickChampions>, seed: number, edicao: number): FichaChampions {
  const todos = clubesChampionsSala()
  const lugares = classificacao.slice(0, CHAMPIONS_SALA_VAGAS)
  const reservados = new Set<string>()
  for (const l of lugares) { const u = uidDe.get(l.id); const p = u ? picks.get(u) : undefined; if (l.humano && temClube(p) && todos.includes(p.pais)) reservados.add(p.pais) }
  const pegos = new Set<string>()
  const times: TimeChampions[] = []
  for (const l of lugares) {
    const uid = uidDe.get(l.id)
    const p = uid ? picks.get(uid) : undefined
    const clube = l.humano && temClube(p) && todos.includes(p.pais) && !pegos.has(p.pais) ? p.pais
      : l.humano ? piorClubeChampions(pegos, reservados) : melhorClubeChampions(pegos, reservados)
    pegos.add(clube)
    const xiKeys = l.humano && uid ? completaXIClube(clube, p?.form ?? '4-3-3', temClube(p) && p.pais === clube ? p.xiKeys : []).map(chaveCarta) : undefined
    times.push({ pais: clube, nome: l.nome, ...(l.humano && uid ? { uid } : {}), ...(xiKeys ? { xiKeys } : {}) })
  }
  while (times.length < CHAMPIONS_SALA_VAGAS && times.length < todos.length) { const c = melhorClubeChampions(pegos); pegos.add(c); times.push({ pais: c, nome: c }) }
  return { seed, edicao, times }
}
export function entrantesChampions(f: FichaChampions, meuUid?: string): Entrant[] {
  return f.times.map(t => {
    const xi = t.xiKeys?.length ? xiPorChavesClube(t.pais, t.xiKeys) : xiDaMaquinaClube(t.pais).xi
    return { uid: t.uid, club: t.nome, you: !!t.uid && t.uid === meuUid, pais: t.pais, xi, str: forcaDoXI(xi), humano: !!t.uid }
  })
}
const NOMES = new Map(CHAMPIONS_SALA_CLUBES.filter(c => c.nome).map(c => [c.clube, c.nome!]))
export const nomeClubeChampions = (clube: string): string => NOMES.get(clube) ?? clube
