// ─── 🏟️ COPAS REGIONAIS CONVOCADAS (Diego 10/10) — o motor ────────────────────
//
// O que ele fechou, em ordem (mockup aprovado: *"perfeito, adorei"*):
//  · três copas: 🔥 Rio × São Paulo · 🧉 Sul × Minas-Paraná · 🌵 Nordeste;
//  · 16 clubes por copa, em DOIS LADOS de 8, e cada clube joga contra os 8 do OUTRO
//    lado (formato real da Copa do Nordeste 2018-22: tabela separada por lado, todo
//    jogo é um clássico entre os lados);
//  · os 4 primeiros de cada lado vão pras quartas CRUZADAS (1º de um lado × 4º do
//    outro, 2º × 3º…), depois semi e final — jogo único, empate vai pros pênaltis;
//  · a LIGA da sala continua com 20; os 16 primeiros escolhem o clube na ordem da
//    tabela (60s cada, quem não escolhe fica com o PIOR que sobrou) e convocam em 90s.
//
// 🧩 O TAMANHO SAI DO BARALHO. Enquanto o baralho regional não tiver os jogadores dos
// clubes pequenos, nem todo clube fecha um time de 11. O motor então joga com o que
// CABE: `n` clubes por lado (o mesmo número dos dois lados, no máximo 8), e o
// mata-mata encolhe junto (8 por lado → quartas; 4 a 7 → semi; 2 a 3 → final direta).
// Quando as cartas entrarem, a copa cresce sozinha até os 16 — sem mexer aqui.
//
// Função PURA e semeada: mesma ficha + mesma semente = mesma copa em todo aparelho
// (igual à Copa do Mundo da sala — ninguém "manda resultado", cada um recalcula).
import { CATALOG, CATALOG_EU, CATALOG_WORLD, clubCanon } from './data'
import { CARTAS_REGIONAIS } from './cartas-regionais'
import { disputaPenaltis } from './penaltis'
import type { Entrant, Formation, PoolCard, Sec } from './copa-mundo'

export type CopaRegionalId = 'riosp' | 'sulminas' | 'nordeste'
export interface CopaRegionalCfg { id: CopaRegionalId; emoji: string; nome: string; nomeEn: string; lados: [{ nome: string; nomeEn: string; emoji: string; clubes: string[] }, { nome: string; nomeEn: string; emoji: string; clubes: string[] }] }

// 📋 os 16 de cada copa (lista sugerida e aceita pelo Diego em 10/10). A ORDEM importa:
// quando o baralho ainda não fecha os 8 de um lado, entram os primeiros da lista que
// fecham time — os grandes vêm primeiro de propósito.
export const COPAS_REGIONAIS: Record<CopaRegionalId, CopaRegionalCfg> = {
  riosp: {
    id: 'riosp', emoji: '🔥', nome: 'Rio × São Paulo', nomeEn: 'Rio × São Paulo',
    lados: [
      { nome: 'Lado do Rio', nomeEn: 'Rio side', emoji: '🏖️', clubes: ['Flamengo', 'Vasco', 'Botafogo', 'Fluminense', 'Bangu', 'America-RJ', 'Madureira', 'Volta Redonda'] },
      { nome: 'Lado de São Paulo', nomeEn: 'São Paulo side', emoji: '🏙️', clubes: ['Corinthians', 'São Paulo', 'Palmeiras', 'Santos', 'Portuguesa', 'Guarani', 'Ponte Preta', 'São Caetano'] },
    ],
  },
  sulminas: {
    id: 'sulminas', emoji: '🧉', nome: 'Sul × Minas-Paraná', nomeEn: 'South × Minas-Paraná',
    lados: [
      { nome: 'Lado do Sul', nomeEn: 'South side', emoji: '🧉', clubes: ['Internacional', 'Grêmio', 'Chapecoense', 'Juventude', 'Caxias', 'Figueirense', 'Avaí', 'Criciúma'] },
      { nome: 'Lado Minas-Paraná', nomeEn: 'Minas-Paraná side', emoji: '⛰️', clubes: ['Cruzeiro', 'Atlético-MG', 'Athletico-PR', 'Coritiba', 'América-MG', 'Paraná', 'Ipatinga', 'Londrina'] },
    ],
  },
  nordeste: {
    id: 'nordeste', emoji: '🌵', nome: 'Copa do Nordeste', nomeEn: 'Northeast Cup',
    lados: [
      { nome: 'Lado PE · CE · RN · PB', nomeEn: 'PE · CE · RN · PB side', emoji: '🌵', clubes: ['Sport', 'Fortaleza', 'Ceará', 'Náutico', 'Santa Cruz', 'ABC', 'América-RN', 'Botafogo-PB'] },
      { nome: 'Lado BA · AL · SE · MA · PI', nomeEn: 'BA · AL · SE · MA · PI side', emoji: '🥥', clubes: ['Bahia', 'Vitória', 'CRB', 'CSA', 'Confiança', 'Sampaio Corrêa', 'Moto Club', 'River-PI'] },
    ],
  },
}
export const ehCopaRegional = (v: unknown): v is CopaRegionalId => v === 'riosp' || v === 'sulminas' || v === 'nordeste'
export const MAX_POR_LADO = 8

// ─── o ELENCO de um clube: o baralho inteiro + o baralho regional ──────────────
const SECS: Sec[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const NEED: Record<Formation, Record<Sec, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
type CartaCat = { name: string; club: string; year: number; fame: number; lo: number; hi: number }
const chave = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
const normClube = (s: string) => clubCanon(s).trim().toLowerCase()
const poolCache = new Map<string, Record<Sec, PoolCard[]>>()
/** todas as cartas do clube: baralhos do Brasil, Europa e Mundo + o regional. Sem repetir carta. */
export function poolDoClube(clube: string): Record<Sec, PoolCard[]> {
  const k = normClube(clube)
  const pronto = poolCache.get(k)
  if (pronto) return pronto
  const out: Record<Sec, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  const vistas = new Set<string>()
  const decks = [CATALOG, CATALOG_EU, CATALOG_WORLD, CARTAS_REGIONAIS] as unknown as Record<Sec, CartaCat[]>[]
  for (const deck of decks) for (const sec of SECS) for (const c of deck[sec] ?? []) {
    if (normClube(c.club) !== k) continue
    const ck = chave(c)
    if (vistas.has(ck)) continue
    vistas.add(ck)
    out[sec].push({ name: c.name, club: c.club, year: c.year, fame: c.fame, lo: c.lo, hi: c.hi, sec })
  }
  for (const sec of SECS) out[sec].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  poolCache.set(k, out)
  return out
}
export const cabeNaFormacao = (pool: Record<Sec, PoolCard[]>, f: Formation) => SECS.every(s => pool[s].length >= NEED[f][s])
export const formacaoDoClube = (clube: string): Formation | null => {
  const p = poolDoClube(clube)
  return cabeNaFormacao(p, '4-3-3') ? '4-3-3' : cabeNaFormacao(p, '4-4-2') ? '4-4-2' : null
}
/** o clube fecha um time de 11 com o baralho de hoje? (só esses entram na copa) */
export const clubeFechaTime = (clube: string): boolean => formacaoDoClube(clube) !== null

const ordena = (melhor: boolean) => (a: PoolCard, b: PoolCard) => melhor
  ? b.fame - a.fame || b.hi - a.hi || b.lo - a.lo || a.name.localeCompare(b.name)
  : a.fame - b.fame || a.hi - b.hi || a.lo - b.lo || a.name.localeCompare(b.name)
function monta(pool: Record<Sec, PoolCard[]>, f: Formation, melhor: boolean, ja: PoolCard[] = []): PoolCard[] {
  const usadas = new Set(ja.map(chave))
  const xi: PoolCard[] = []
  for (const sec of SECS) {
    const meus = ja.filter(c => c.sec === sec).slice(0, NEED[f][sec])
    xi.push(...meus)
    let falta = NEED[f][sec] - meus.length
    for (const c of [...pool[sec]].sort(ordena(melhor))) {
      if (falta <= 0) break
      if (usadas.has(chave(c))) continue
      usadas.add(chave(c)); xi.push(c); falta--
    }
  }
  return xi
}
/** o time do BOT: os 11 melhores do clube */
export function xiDaMaquinaClube(clube: string): { xi: PoolCard[]; form: Formation } {
  const form = formacaoDoClube(clube) ?? '4-4-2'
  return { xi: monta(poolDoClube(clube), form, true), form }
}
/** 🥴 o castigo de quem não convoca: o que a pessoa marcou + os PIORES nas vagas vazias */
export function completaXIClube(clube: string, form: Formation, escolhidas: string[]): PoolCard[] {
  const pool = poolDoClube(clube)
  const f = cabeNaFormacao(pool, form) ? form : (formacaoDoClube(clube) ?? form)
  const porChave = new Map(Object.values(pool).flat().map(c => [chave(c), c]))
  const meus = escolhidas.map(k => porChave.get(k)).filter((c): c is PoolCard => !!c)
  return monta(pool, f, false, meus)
}
/** reconstrói o XI de uma ficha (as chaves que a pessoa convocou) */
export function xiPorChavesClube(clube: string, xiKeys: string[]): PoolCard[] {
  const porChave = new Map(Object.values(poolDoClube(clube)).flat().map(c => [chave(c), c]))
  return xiKeys.map(k => porChave.get(k)).filter((c): c is PoolCard => !!c)
}
export const forcaDoXI = (xi: PoolCard[]) => xi.reduce((s, c) => s + (c.lo + c.hi) / 2, 0) / Math.max(1, xi.length)
const forcaCache = new Map<string, number>()
/** a força do MELHOR time do clube (é o que decide qual é o "pior que sobrou") */
export const forcaDoClube = (clube: string): number => {
  const k = normClube(clube)
  const f = forcaCache.get(k)
  if (f !== undefined) return f
  const v = forcaDoXI(xiDaMaquinaClube(clube).xi)
  forcaCache.set(k, v)
  return v
}

// ─── quem JOGA a copa com o baralho de hoje ────────────────────────────────────
export interface ClubesDaCopa { n: number; ladoA: string[]; ladoB: string[]; todos: string[] }
/** os clubes que entram: os `n` primeiros de cada lado que fecham time (n igual dos dois lados) */
export function clubesDaCopa(id: CopaRegionalId): ClubesDaCopa {
  const cfg = COPAS_REGIONAIS[id]
  const a = cfg.lados[0].clubes.filter(clubeFechaTime)
  const b = cfg.lados[1].clubes.filter(clubeFechaTime)
  const n = Math.min(MAX_POR_LADO, a.length, b.length)
  const ladoA = a.slice(0, n), ladoB = b.slice(0, n)
  return { n, ladoA, ladoB, todos: [...ladoA, ...ladoB] }
}
/** dá pra jogar? (precisa de pelo menos 2 clubes por lado) */
export const copaJogavel = (id: CopaRegionalId) => clubesDaCopa(id).n >= 2
/** quantos da liga se classificam (2 × n — 16 com a copa cheia) */
export const vagasDaCopa = (id: CopaRegionalId) => clubesDaCopa(id).n * 2
/** o PIOR clube ainda livre — o castigo de quem deixou os 60s passarem */
export function piorClubeLivre(id: CopaRegionalId, pegos: Set<string>): string {
  const todos = [...clubesDaCopa(id).todos].sort((x, y) => forcaDoClube(x) - forcaDoClube(y) || x.localeCompare(y))
  return todos.find(c => !pegos.has(c)) ?? todos[0]
}
/** o MELHOR clube livre — o que o bot leva na vez dele */
export function melhorClubeLivre(id: CopaRegionalId, pegos: Set<string>, reservados = new Set<string>()): string {
  const todos = [...clubesDaCopa(id).todos].sort((x, y) => forcaDoClube(y) - forcaDoClube(x) || x.localeCompare(y))
  return todos.find(c => !pegos.has(c) && !reservados.has(c)) ?? todos.find(c => !pegos.has(c)) ?? todos[0]
}
/** de que lado é o clube (0 ou 1) */
export const ladoDoClube = (id: CopaRegionalId, clube: string): 0 | 1 => (COPAS_REGIONAIS[id].lados[0].clubes.includes(clube) ? 0 : 1)

// ─── os PASSOS (o relógio da sala conta por eles; cópia no banco: esc_regional_clock) ──
export interface PassosRegional { RODADAS: number; CHAVE: number; KO: number; PRIMEIRO_KO: number; FINAL: number; FIM: number }
/** fases do mata-mata pelo tamanho: 8 por lado → quartas/semi/final; 4–7 → semi/final; 2–3 → final */
export const fasesKo = (n: number): number => (n >= 8 ? 3 : n >= 4 ? 2 : 1)
export function passosRegional(n: number): PassosRegional {
  const KO = fasesKo(n)
  return { RODADAS: n, CHAVE: n + 1, KO, PRIMEIRO_KO: n + 2, FINAL: n + 1 + KO, FIM: n + 2 + KO }
}
export const passoRegionalRodaBola = (p: PassosRegional, s: number) => (s >= 1 && s <= p.RODADAS) || (s >= p.PRIMEIRO_KO && s <= p.FINAL)

// ─── a SIMULAÇÃO ───────────────────────────────────────────────────────────────
export type GolRegional = { name: string; min: number; home: boolean; assist?: string }
export type JogoRegional = { h: number; a: number; gh: number; ga: number; ev: GolRegional[] }
export type ConfrontoRegional = { h: number; a: number; g: [number, number]; ev: GolRegional[]; pen?: [number, number]; winner: number }
export type FaseKo = { tipo: 'quartas' | 'semi' | 'final'; ties: ConfrontoRegional[] }
export interface MundoRegional { n: number; rodadas: JogoRegional[][]; ko: FaseKo[]; campeao: number; classificados: [number[], number[]] }

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const hash = (s: string, h: number) => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0; return h >>> 0 }
function poisson(r: () => number, lambda: number) { let k = 0, p = 1; const L = Math.exp(-lambda); do { k++; p *= r() } while (p > L); return Math.min(6, k - 1) }
const placar = (r: () => number, a: Entrant, b: Entrant): [number, number] => {
  const adv = a.str - b.str
  return [poisson(r, Math.max(0.25, 1.25 + adv * 0.05)), poisson(r, Math.max(0.25, 1.25 - adv * 0.05))]
}
// quem marca: ATA pesa 4 · MEI 2 · defesa 1 · goleiro nunca (mesma régua da Copa do Mundo)
function autor(r: () => number, xi: PoolCard[]): string {
  const pool: PoolCard[] = []
  for (const c of xi) { const w = c.sec === 'ATA' ? 4 : c.sec === 'MEI' ? 2 : c.sec === 'GOL' ? 0 : 1; for (let i = 0; i < w; i++) pool.push(c) }
  return (pool[Math.floor(r() * pool.length)] ?? xi[xi.length - 1])?.name ?? '—'
}
// 🅰️ o garçom tem DADO PRÓPRIO (lê o gol que já aconteceu, não puxa número do rng do
// torneio) — mesma regra da Copa do Mundo: mexer na assistência nunca muda placar.
function garcom(base: number, ck: string, xi: PoolCard[], quem: string, min: number): string | undefined {
  const d = mulberry(hash(`${ck}|${quem}|${min}`, (base ^ 0xA551) >>> 0))
  if (d() < 0.25) return undefined
  const pool = xi.filter(c => c.name !== quem).map(c => ({ c, w: c.sec === 'MEI' ? 5 : c.sec === 'LAT' ? 3 : c.sec === 'ATA' ? 2.4 : c.sec === 'ZAG' ? 0.6 : 0.08 }))
  const tot = pool.reduce((s, p) => s + p.w, 0)
  let x = d() * tot
  for (const p of pool) { x -= p.w; if (x <= 0) return p.c.name }
  return pool[pool.length - 1]?.c.name
}
function gols(r: () => number, gh: number, ga: number, h: Entrant, a: Entrant, base: number, ck: string): GolRegional[] {
  const ev: GolRegional[] = []
  for (let i = 0; i < gh; i++) ev.push({ home: true, min: 2 + Math.floor(r() * 89), name: autor(r, h.xi) })
  for (let i = 0; i < ga; i++) ev.push({ home: false, min: 2 + Math.floor(r() * 89), name: autor(r, a.xi) })
  for (const g of ev) { const as = garcom(base, `${ck}|${g.home ? 'C' : 'F'}`, g.home ? h.xi : a.xi, g.name, g.min); if (as) g.assist = as }
  return ev.sort((x, y) => x.min - y.min)
}

/** a tabela de UM lado depois de `ate` rodadas (só o que já apitou — zero spoiler) */
export function tabelaDoLado(m: MundoRegional, lado: 0 | 1, ate: number): { t: number; j: number; pts: number; w: number; d: number; l: number; gp: number; gc: number; sg: number }[] {
  const ids = Array.from({ length: m.n }, (_, i) => lado * m.n + i)
  const row = new Map(ids.map(t => [t, { t, j: 0, pts: 0, w: 0, d: 0, l: 0, gp: 0, gc: 0, sg: 0 }]))
  for (const rodada of m.rodadas.slice(0, Math.max(0, ate))) for (const j of rodada) {
    for (const [t, gp, gc] of [[j.h, j.gh, j.ga], [j.a, j.ga, j.gh]] as const) {
      const r = row.get(t); if (!r) continue
      r.j++; r.gp += gp; r.gc += gc; r.sg = r.gp - r.gc
      if (gp > gc) { r.w++; r.pts += 3 } else if (gp === gc) { r.d++; r.pts++ } else r.l++
    }
  }
  // desempate: pontos → vitórias → saldo → gols pró (a régua da Copa do Mundo) → ordem do lado
  return [...row.values()].sort((x, y) => y.pts - x.pts || y.w - x.w || y.sg - x.sg || y.gp - x.gp || x.t - y.t)
}

/**
 * Os `entrants` vêm na ordem dos LADOS: [0..n-1] = lado A, [n..2n-1] = lado B.
 * Rodada r: o i-ésimo do lado A enfrenta o ((i + r) mod n)-ésimo do lado B — em n
 * rodadas cada um pega os n do outro lado uma vez só. Mando alternado por rodada.
 */
export function simulaRegional(entrants: Entrant[], seed: number): MundoRegional {
  const n = Math.floor(entrants.length / 2)
  const rng = mulberry((seed ^ 0x2E610A1) >>> 0)
  const rodadas: JogoRegional[][] = []
  for (let r = 0; r < n; r++) {
    const jogos: JogoRegional[] = []
    for (let i = 0; i < n; i++) {
      const a = i, b = n + ((i + r) % n)
      const [h, aw] = (r + i) % 2 === 0 ? [a, b] : [b, a]
      const [gh, ga] = placar(rng, entrants[h], entrants[aw])
      jogos.push({ h, a: aw, gh, ga, ev: gols(rng, gh, ga, entrants[h], entrants[aw], seed, `r${r}|${h}|${aw}`) })
    }
    rodadas.push(jogos)
  }
  const base: MundoRegional = { n, rodadas, ko: [], campeao: -1, classificados: [[], []] }
  const KO = fasesKo(n)
  const vagas = KO === 3 ? 4 : KO === 2 ? 2 : 1
  const A = tabelaDoLado(base, 0, n).slice(0, vagas).map(r => r.t)
  const B = tabelaDoLado(base, 1, n).slice(0, vagas).map(r => r.t)
  base.classificados = [A, B]
  const joga = (h: number, a: number, ck: string): ConfrontoRegional => {
    const [gh, ga] = placar(rng, entrants[h], entrants[a])
    const ev = gols(rng, gh, ga, entrants[h], entrants[a], seed, ck)
    const pen = gh === ga ? disputaPenaltis(rng) : undefined
    const winner = gh > ga ? h : ga > gh ? a : pen![0] > pen![1] ? h : a
    return { h, a, g: [gh, ga], ev, ...(pen ? { pen } : {}), winner }
  }
  // 🏆 chaveamento CRUZADO: o melhor de um lado pega o pior classificado do outro, e
  // os dois líderes só se cruzam na final
  let vivos: [number, number][]
  if (KO === 3) vivos = [[A[0], B[3]], [B[1], A[2]], [B[0], A[3]], [A[1], B[2]]]
  else if (KO === 2) vivos = [[A[0], B[1]], [B[0], A[1]]]
  else vivos = [[A[0], B[0]]]
  const tipos: FaseKo['tipo'][] = KO === 3 ? ['quartas', 'semi', 'final'] : KO === 2 ? ['semi', 'final'] : ['final']
  for (const tipo of tipos) {
    const ties = vivos.map(([h, a], i) => joga(h, a, `${tipo}|${i}`))
    base.ko.push({ tipo, ties })
    const w = ties.map(t => t.winner)
    vivos = []
    for (let i = 0; i + 1 < w.length; i += 2) vivos.push([w[i], w[i + 1]])
  }
  base.campeao = base.ko[base.ko.length - 1].ties[0].winner
  return base
}

/** artilharia da copa (gol de pênalti da disputa não conta — só gol de jogo) */
export function artilhariaRegional(m: MundoRegional): { name: string; goals: number; team: number }[] {
  const conta = new Map<string, { name: string; goals: number; team: number }>()
  const soma = (ev: GolRegional[], h: number, a: number) => { for (const g of ev) { const t = g.home ? h : a; const k = `${t}|${g.name}`; const r = conta.get(k) ?? { name: g.name, goals: 0, team: t }; r.goals++; conta.set(k, r) } }
  for (const rod of m.rodadas) for (const j of rod) soma(j.ev, j.h, j.a)
  for (const f of m.ko) for (const t of f.ties) soma(t.ev, t.h, t.a)
  return [...conta.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name))
}
