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
import { VERSAO_RECEPCAO_M2, type VersaoM2 } from './versao'

/** tudo que decide o jogo — o campinho recebe isto e monta o mesmo motor */
export interface EntradaM2 {
  /** Ausente = regras anteriores. Gravada na entrada comum aos três modos. */
  versao?: VersaoM2
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
export function entradaM2(o: Omit<EntradaM2, 'clima'> & { clima?: Clima }): EntradaM2 {
  const e: EntradaM2 = { ...o, clima: o.clima ?? climaDoJogo(o.seed) }
  // A versão de uma partida já guardada prevalece sobre a liberação atual da
  // conta. Reabrir o save ou alternar a apresentação nunca troca aquela regra.
  if (GUARDADOS.has(hash(chave(e)))) return e
  const legacy = { ...e }; delete legacy.versao
  if (GUARDADOS.has(hash(chave(legacy)))) return legacy
  const contextual = { ...e, versao: VERSAO_RECEPCAO_M2 }
  if (GUARDADOS.has(hash(chave(contextual)))) return contextual
  return e
}

/** um motor NOVO com estas entradas (o campinho anima este) */
export function novoMotor2(e: EntradaM2, en = false): Motor2 {
  const m = new Motor2(e.seed, e.casa, e.fora, en, [e.fCasa, e.fFora], e.tatica, e.clima, e.bots, { tecnico: e.tecnico, evento: e.evento, recepcaoContextual:e.versao===VERSAO_RECEPCAO_M2 })
  if (e.casa2?.length) m.trocaTime(0 as Lado, e.casa2, e.fCasa2 ?? e.fCasa)
  if (e.fora2?.length) m.trocaTime(1 as Lado, e.fora2, e.fFora2 ?? e.fFora)
  return m
}

const chave = (e: EntradaM2) => [e.seed, e.clima, String(e.tecnico), String(e.evento), e.tatica.join(','), e.bots.join(','), e.fCasa, e.fFora, e.fCasa2, e.fFora2,
  ...[e.casa, e.fora, e.casa2 ?? [], e.fora2 ?? []].map(cs => cs.map(c => `${c.name}:${c.gasMod ?? 0}`).join(';'))].join('|')+(e.versao?'|versao:'+e.versao:'')
const CACHE = new Map<string, ResultadoM2>()
const MAX = 600

// 💾 GUARDADO DENTRO DO SAVE (21/10). Duas razões: (1) abrir a carreira no meio da temporada refazia todos os jogos de gente
// (~2,3 s); (2) o motor ainda é ajustado — sem guardar, cada publicação podia mudar o placar de jogo JÁ VISTO nesta temporada.
// E vai no SAVE (o mesmo que sobe pra nuvem), não no aparelho: o Diego lembrou que a pessoa joga o MESMO save no celular e no
// PC — o resultado que um aparelho mostrou tem que ser o que o outro mostra. A chave é a ENTRADA do jogo (os 22, formação,
// tática, gás, técnico…): jogo que já aconteceu nunca muda de entrada, então o resultado dele fica congelado.
//   · a tela chama `carregaGuardados(state.m2Res)` antes de simular;
//   · depois de simular, `tiraNovos()` devolve o que foi calculado agora e a tela grava no save (ação `GUARDA_M2`).
/** [gols casa, gols fora, gols do jogo, temporada, versão opcional]. Sem versão = regra anterior. */
export type GuardadoM2 = [number, number, GolM2[], number, VersaoM2?]
const GUARDADOS = new Map<string, ResultadoM2>()
let NOVOS: Record<string, GuardadoM2> = {}
let ultimoCarregado: unknown = null
let temporadaAtual = 0
let contextoCarregado: string | undefined
const hash = (txt: string): string => {
  let a = 0x811C9DC5, b = 0x01000193 ^ txt.length
  for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5BD1E995) >>> 0; b ^= b >>> 13 }
  return a.toString(36) + '.' + b.toString(36)
}
/** os resultados que o save já tem (barato chamar a cada render: só relê quando o objeto muda) */
export function carregaGuardados(m: Record<string, GuardadoM2> | undefined, temporada: number, contexto?: string): void {
  // A liberação privada e os cálculos pendentes pertencem a uma conta/save.
  // Trocar de conta nesta mesma aba não pode herdar a versão do outro usuário.
  if (contexto !== contextoCarregado) {
    CACHE.clear(); GUARDADOS.clear(); NOVOS = {}; ultimoCarregado = null
    contextoCarregado = contexto
  }
  temporadaAtual = temporada
  if (!m || m === ultimoCarregado) return
  ultimoCarregado = m
  for (const k in m) { const [p0, p1, gols] = m[k]; GUARDADOS.set(k, { placar: [p0, p1], gols }) }
}
/** o que foi calculado desde a última chamada (pra gravar no save) */
export function tiraNovos(): Record<string, GuardadoM2> | null {
  const n = NOVOS
  NOVOS = {}
  return Object.keys(n).length ? n : null
}

export function resultadoM2(e: EntradaM2): ResultadoM2 {
  const k = chave(e)
  const c = CACHE.get(k)
  if (c) return c
  const hk = hash(k)
  const g = GUARDADOS.get(hk)
  if (g) { CACHE.set(k, g); return g }
  const m = novoMotor2(e)
  // Comemoração/cobrança pode adiar o apito. A versão nova percorre até o
  // mesmo fim usado pelo relato/2D/3D; saves antigos mantêm o cálculo original.
  const limite = e.versao === VERSAO_RECEPCAO_M2 ? 120 : 93
  for (let min = 1; min <= limite && !m.fim; min++) m.avancaAte(min)
  if (e.versao && !m.fim) throw new Error('Partida oficial não alcançou o apito final')
  const SEG = 90 / 93
  const gols: GolM2[] = m.eventos.filter(ev => ev.tipo === 'gol').map(ev => {
    const contra = /\((contra|own goal)\)$/.test(ev.a ?? '')
    return { home: ev.lado === 0, nome: (ev.a ?? '').replace(/ \((contra|own goal)\)$/, ''), min: Math.min(93, Math.floor(ev.t / SEG) + 1), assist: ev.b || undefined, contra }
  })
  const r: ResultadoM2 = { placar: [m.placar[0], m.placar[1]], gols }
  if (CACHE.size >= MAX) CACHE.delete(CACHE.keys().next().value as string)
  CACHE.set(k, r)
  GUARDADOS.set(hk, r)
  NOVOS[hk] = e.versao?[r.placar[0], r.placar[1], r.gols, temporadaAtual,e.versao]:[r.placar[0], r.placar[1], r.gols, temporadaAtual]
  return r
}
