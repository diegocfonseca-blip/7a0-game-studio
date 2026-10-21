// ⚽🧠 MOTOR 2D v2 NA CARREIRA (20/10, decisão do Diego): *"quero motor novo no modo carreira off-line e modo de carreira online
// e partida rápida… já nas salas online, Minhas Ligas e outros modos online, o teatro"*.
// Na carreira o SEU jogo da rodada (o de cada técnico de gente) passa a ser DECIDIDO pelo motor novo: os 22 jogam e o placar é o
// que acontece no campinho. Os outros jogos da rodada continuam com a simulação de sempre (e o dado deles é consumido igual —
// nenhum placar de bot muda por causa disto). O campinho 2D roda o MESMO motor com as MESMAS entradas: o que você vê é o que
// valeu. Liga a partir de uma rodada (`desde`): rodada já jogada nunca muda de placar.
import { Motor2 } from './motor'
import type { CartaCampo, Lado } from './tipos'
import type { Clima } from '../campo2d-clima'
import { climaDoJogo } from '../campo2d-clima'

/** tudo que decide o jogo — o campinho recebe isto e monta o mesmo motor */
export interface EntradaM2 {
  seed: number
  casa: CartaCampo[]; fora: CartaCampo[]
  fCasa?: string; fFora?: string
  tatica: [number, number]
  /** time de bot (ninguém escalou): o motor escala pelo jeito do jogador */
  bots: [boolean, boolean]
  /** 🔁 os 11 do 2º tempo (troca no intervalo) */
  casa2?: CartaCampo[]; fora2?: CartaCampo[]; fCasa2?: string; fFora2?: string
  clima: Clima
  /** 🧢 o nível do dia do técnico de cada lado (a 12ª carta) · 🎭 o evento da rodada ("escalar assim mesmo") */
  tecnico?: [number | null, number | null]; evento?: [number, number]
}
export interface GolM2 { home: boolean; nome: string; min: number; assist?: string; contra?: boolean }
export interface ResultadoM2 { placar: [number, number]; gols: GolM2[] }

const TATICA: Record<string, number> = { retranca: -1, equilibrio: 0, ataque: 1 }
export const taticaM2 = (t?: string) => TATICA[t ?? ''] ?? 0

/** a semente do jogo (fixa por temporada + divisão + rodada + confronto) */
export function sementeM2(seed: number, div: string, r: number, hi: number, ai: number): number {
  let h = (seed ^ 0x2D2A9E5) >>> 0
  for (const n of [div.charCodeAt(0), r + 1, hi + 1, ai + 1]) h = Math.imul(h ^ n, 0x9E3779B1) >>> 0
  return h >>> 0
}
export function entradaM2(o: Omit<EntradaM2, 'clima'> & { clima?: Clima }): EntradaM2 { return { ...o, clima: o.clima ?? climaDoJogo(o.seed) } }

/** um motor NOVO com estas entradas (o campinho anima este) */
export function novoMotor2(e: EntradaM2, en = false): Motor2 {
  const m = new Motor2(e.seed, e.casa, e.fora, en, [e.fCasa, e.fFora], e.tatica, e.clima, e.bots, { tecnico: e.tecnico, evento: e.evento })
  if (e.casa2?.length) m.trocaTime(0 as Lado, e.casa2, e.fCasa2 ?? e.fCasa)
  if (e.fora2?.length) m.trocaTime(1 as Lado, e.fora2, e.fFora2 ?? e.fFora)
  return m
}

const chave = (e: EntradaM2) => [e.seed, e.clima, String(e.tecnico), String(e.evento), e.tatica.join(','), e.bots.join(','), e.fCasa, e.fFora, e.fCasa2, e.fFora2,
  ...[e.casa, e.fora, e.casa2 ?? [], e.fora2 ?? []].map(cs => cs.map(c => `${c.name}:${c.gasMod ?? 0}`).join(';'))].join('|')
const CACHE = new Map<string, ResultadoM2>()
const MAX = 600

// 💾 GUARDADO NO APARELHO (21/10). Duas razões: (1) abrir a carreira no meio da temporada refazia todos os jogos de gente
// (~2,3 s); (2) o motor ainda é ajustado — sem guardar, cada publicação podia mudar o placar de jogo JÁ VISTO nesta temporada,
// e o que apareceu na tela é de pedra. A chave é a ENTRADA do jogo (os 22, formação, tática, gás, técnico…): jogo que já
// aconteceu nunca muda de entrada, então o resultado dele fica congelado. UMA chave só no localStorage, com teto de entradas
// (nunca enche o aparelho — ver storage-guard.ts); gravar que falha é ignorado (o jogo só recalcula).
const LS = 'll-m2-res'
const MAX_LS = 700
type Guardado = [string, number, number, GolM2[]]
let disco: Map<string, ResultadoM2> | null = null
let gravaPendente: ReturnType<typeof setTimeout> | null = null
const hash = (txt: string): string => {
  let a = 0x811C9DC5, b = 0x01000193 ^ txt.length
  for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5BD1E995) >>> 0; b ^= b >>> 13 }
  return a.toString(36) + '.' + b.toString(36)
}
function leDisco(): Map<string, ResultadoM2> {
  if (disco) return disco
  disco = new Map()
  try {
    const cru = typeof localStorage !== 'undefined' ? localStorage.getItem(LS) : null
    for (const [k, p0, p1, gols] of (cru ? JSON.parse(cru) as Guardado[] : [])) disco.set(k, { placar: [p0, p1], gols })
  } catch { /* aparelho sem acesso ou lixo: começa vazio */ }
  return disco
}
function guardaNoDisco(k: string, r: ResultadoM2): void {
  const d = leDisco()
  d.delete(k); d.set(k, r)
  while (d.size > MAX_LS) d.delete(d.keys().next().value as string)
  if (gravaPendente || typeof localStorage === 'undefined') return
  gravaPendente = setTimeout(() => {
    gravaPendente = null
    try { localStorage.setItem(LS, JSON.stringify([...d].map(([k2, x]) => [k2, x.placar[0], x.placar[1], x.gols] as Guardado))) } catch { /* cheio: segue sem guardar */ }
  }, 1500)
}

/** o resultado do jogo (joga o motor até o fim, sem desenhar). ~100 ms por jogo; guardado na memória — a carreira re-simula a
 *  temporada inteira a cada rodada, e sem isto cada rodada custaria 100 ms × rodadas jogadas */
export function resultadoM2(e: EntradaM2): ResultadoM2 {
  const k = chave(e)
  const c = CACHE.get(k)
  if (c) return c
  const hk = hash(k)
  const g = leDisco().get(hk)
  if (g) { CACHE.set(k, g); return g }
  const m = novoMotor2(e)
  for (let min = 1; min <= 93 && !m.fim; min++) m.avancaAte(min)
  const SEG = 90 / 93
  const gols: GolM2[] = m.eventos.filter(ev => ev.tipo === 'gol').map(ev => {
    const contra = /\((contra|own goal)\)$/.test(ev.a ?? '')
    return { home: ev.lado === 0, nome: (ev.a ?? '').replace(/ \((contra|own goal)\)$/, ''), min: Math.min(93, Math.floor(ev.t / SEG) + 1), assist: ev.b || undefined, contra }
  })
  const r: ResultadoM2 = { placar: [m.placar[0], m.placar[1]], gols }
  if (CACHE.size >= MAX) CACHE.delete(CACHE.keys().next().value as string)
  CACHE.set(k, r)
  guardaNoDisco(hk, r)
  return r
}
