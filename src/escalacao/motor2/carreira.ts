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
import { VERSAO_RECEPCAO_M2, VERSAO_CRITERIOS_M2, VERSAO_CRITERIOS_RECEPCAO_M2, temRecepcaoContextual, temCriteriosCarreira, type VersaoM2 } from './versao'

/** tudo que decide o jogo — o campinho recebe isto e monta o mesmo motor */
export interface EntradaM2 {
  /** Ausente = regras anteriores. Gravada na entrada comum aos três modos. */
  versao?: VersaoM2
  /** Só partidas já disputadas podem consultar a assinatura incompleta dos saves antigos. */
  preservarGuardado?: boolean
  /** Endereço da partida no calendário, independente das fichas atuais do elenco. */
  partidaId?: string
  /** Chaveamento pode consultar histórico sem oficializar confrontos futuros. */
  somenteConsulta?: boolean
  /** Só a partida em andamento aceita uma nova decisão de intervalo. */
  atualizarIntervalo?: boolean
  intervaloRevisao?: number
  tatica2?: [number, number]
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
  const oficial = e.preservarGuardado && e.partidaId ? PARTIDAS_SALVAS.get(e.partidaId) : undefined
  if (oficial) {
    const rev = revisaoIntervalo(e), anterior = revisaoIntervalo(oficial)
    // A decisão do técnico altera apenas o segundo tempo. O catálogo atual
    // nunca substitui as cartas que de fato iniciaram este confronto.
    if (e.atualizarIntervalo && rev > anterior) return { ...oficial,
      casa2:e.casa2, fora2:e.fora2, fCasa2:e.fCasa2, fFora2:e.fFora2,
      tatica2:e.tatica2, intervaloRevisao:rev, preservarGuardado:true, atualizarIntervalo:true }
    return { ...oficial, preservarGuardado: true }
  }
  // A versão de uma partida já guardada prevalece sobre a liberação atual da
  // conta. Reabrir o save ou alternar a apresentação nunca troca aquela regra.
  for (const versao of e.preservarGuardado ? [e.versao, undefined, VERSAO_RECEPCAO_M2, VERSAO_CRITERIOS_M2, VERSAO_CRITERIOS_RECEPCAO_M2] : [e.versao]) {
    const candidate = { ...e, versao }
    if (GUARDADOS.has(hash(chave(candidate))) || (e.preservarGuardado && GUARDADOS.has(hash(chaveLegada(candidate))))) return candidate
  }
  return e
}

/** um motor NOVO com estas entradas (o campinho anima este) */
export function novoMotor2(e: EntradaM2, en = false): Motor2 {
  e = entradaM2(e)
  const m = new Motor2(e.seed, e.casa, e.fora, en, [e.fCasa, e.fFora], e.tatica, e.clima, e.bots, { tecnico: e.tecnico, evento: e.evento, recepcaoContextual:temRecepcaoContextual(e.versao), criteriosCarreira:temCriteriosCarreira(e.versao) })
  if (e.casa2?.length) m.trocaTime(0 as Lado, e.casa2, e.fCasa2 ?? e.fCasa, temCriteriosCarreira(e.versao) ? e.tatica2?.[0] : undefined)
  if (e.fora2?.length) m.trocaTime(1 as Lado, e.fora2, e.fFora2 ?? e.fFora, temCriteriosCarreira(e.versao) ? e.tatica2?.[1] : undefined)
  return m
}

const chaveLegada = (e: EntradaM2) => [e.seed, e.clima, String(e.tecnico), String(e.evento), e.tatica.join(','), e.bots.join(','), e.fCasa, e.fFora, e.fCasa2, e.fFora2,
  ...[e.casa, e.fora, e.casa2 ?? [], e.fora2 ?? []].map(cs => cs.map(c => `${c.name}:${c.gasMod ?? 0}`).join(';'))].join('|')+(e.versao?'|versao:'+e.versao:'')
// Não usa id do leilão: a identidade é a carta, na ordem exata das vagas.
const chave = (e: EntradaM2) => 'm2-cartas-2:' + JSON.stringify([
  e.seed, e.clima, e.tecnico ?? null, e.evento ?? null, e.tatica, e.bots,
  e.fCasa ?? null, e.fFora ?? null, e.fCasa2 ?? null, e.fFora2 ?? null, e.versao ?? null,
  ...(e.tatica2 ? [e.tatica2] : []),
  ...[e.casa, e.fora, e.casa2 ?? [], e.fora2 ?? []].map(cs => cs.map(c => [
    c.name, c.club ?? null, c.year ?? null, c.pos ?? c.sec ?? null,
    c.fame ?? null, c.lo ?? null, c.hi ?? null, !!c.fake, c.gasMod ?? 0,
  ])),
])
const CACHE = new Map<string, { resultado: ResultadoM2; entrada?: EntradaM2 }>()
const MAX = 600

// 💾 GUARDADO DENTRO DO SAVE (21/10). Duas razões: (1) abrir a carreira no meio da temporada refazia todos os jogos de gente
// (~2,3 s); (2) o motor ainda é ajustado — sem guardar, cada publicação podia mudar o placar de jogo JÁ VISTO nesta temporada.
// E vai no SAVE (o mesmo que sobe pra nuvem), não no aparelho: o Diego lembrou que a pessoa joga o MESMO save no celular e no
// PC — o resultado que um aparelho mostrou tem que ser o que o outro mostra. A chave é a ENTRADA do jogo (os 22, formação,
// tática, gás, técnico…): jogo que já aconteceu nunca muda de entrada, então o resultado dele fica congelado.
//   · a tela chama `carregaGuardados(state.m2Res)` antes de simular;
//   · depois de simular, `tiraNovos()` devolve o que foi calculado agora e a tela grava no save (ação `GUARDA_M2`).
/** [gols casa, gols fora, gols do jogo, temporada, versão opcional]. Sem versão = regra anterior. */
export type GuardadoM2 = [number, number, GolM2[], number, (VersaoM2 | null)?, EntradaM2?]
const GUARDADOS = new Map<string, ResultadoM2>()
const PARTIDAS_SALVAS = new Map<string, EntradaM2>()
let NOVOS: Record<string, GuardadoM2> = {}
let ultimoCarregado: unknown = null
let temporadaAtual = 0
let contextoCarregado: string | undefined
const hash = (txt: string): string => {
  let a = 0x811C9DC5, b = 0x01000193 ^ txt.length
  for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5BD1E995) >>> 0; b ^= b >>> 13 }
  return a.toString(36) + '.' + b.toString(36)
}
/** Assinatura completa também para projeções leves da MESMA partida. */
export const assinaturaEntradaM2 = (e: EntradaM2): string => hash(chave(e))
/** os resultados que o save já tem (barato chamar a cada render: só relê quando o objeto muda) */
export function carregaGuardados(m: Record<string, GuardadoM2> | undefined, temporada: number, contexto?: string): void {
  // A liberação privada e os cálculos pendentes pertencem a uma conta/save.
  // Trocar de conta nesta mesma aba não pode herdar a versão do outro usuário.
  if (contexto !== contextoCarregado || temporada !== temporadaAtual) {
    CACHE.clear(); GUARDADOS.clear(); PARTIDAS_SALVAS.clear(); NOVOS = {}; ultimoCarregado = null
    contextoCarregado = contexto
  }
  temporadaAtual = temporada
  if (m === ultimoCarregado) return
  ultimoCarregado = m
  // O save é a autoridade: restaurar uma cópia anterior na mesma conta/temporada
  // não pode herdar fotografias que só existiam na outra cópia em memória.
  GUARDADOS.clear(); PARTIDAS_SALVAS.clear()
  if (!m) return
  for (const k in m) {
    const [p0, p1, gols, season, , entrada] = m[k]
    if (season !== temporada) continue
    GUARDADOS.set(k, { placar: [p0, p1], gols })
    if (entrada?.partidaId) {
      const anterior = PARTIDAS_SALVAS.get(entrada.partidaId)
      if (!anterior || revisaoIntervalo(entrada) > revisaoIntervalo(anterior)) PARTIDAS_SALVAS.set(entrada.partidaId, entrada)
    }
  }
}
/** o que foi calculado desde a última chamada (pra gravar no save) */
export function tiraNovos(): Record<string, GuardadoM2> | null {
  const n = NOVOS
  NOVOS = {}
  return Object.keys(n).length ? n : null
}

export function resultadoM2(e: EntradaM2): ResultadoM2 {
  e = entradaM2(e)
  const k = chave(e)
  const c = CACHE.get(k)
  if (c) {
    if (e.preservarGuardado && c.entrada) registrarResultado(e, c.resultado)
    return c.resultado
  }
  const hk = hash(k)
  const completo = GUARDADOS.get(hk)
  const g = completo ?? (e.preservarGuardado ? GUARDADOS.get(hash(chaveLegada(e))) : undefined)
  if (g) { CACHE.set(k, { resultado:g, entrada:completo ? compactarEntrada(e) : undefined }); if (completo && e.preservarGuardado) registrarResultado(e,g); return g }
  const m = novoMotor2(e)
  // Comemoração/cobrança pode adiar o apito. A versão nova percorre até o
  // mesmo fim usado pelo relato/2D/3D; saves antigos mantêm o cálculo original.
  const limite = e.versao ? 120 : 93
  for (let min = 1; min <= limite && !m.fim; min++) m.avancaAte(min)
  if (e.versao && !m.fim) throw new Error('Partida oficial não alcançou o apito final')
  const SEG = 90 / 93
  const gols: GolM2[] = m.eventos.filter(ev => ev.tipo === 'gol').map(ev => {
    const contra = /\((contra|own goal)\)$/.test(ev.a ?? '')
    return { home: ev.lado === 0, nome: (ev.a ?? '').replace(/ \((contra|own goal)\)$/, ''), min: Math.min(93, Math.floor(ev.t / SEG) + 1), assist: ev.b || undefined, contra }
  })
  const r: ResultadoM2 = { placar: [m.placar[0], m.placar[1]], gols }
  if (CACHE.size >= MAX) CACHE.delete(CACHE.keys().next().value as string)
  CACHE.set(k, { resultado:r, entrada:compactarEntrada(e) })
  // Prévia do futuro não vira resultado oficial. As entradas compactas permitem
  // reproduzir o mesmo futebol depois de atualizar o catálogo ou trocar aparelho.
  if (e.preservarGuardado) {
    registrarResultado(e, r)
  }
  return r
}

function registrarResultado(e: EntradaM2, r: ResultadoM2): void {
  if (e.somenteConsulta) return
  const hk = hash(chave(e))
  const anterior = e.partidaId ? PARTIDAS_SALVAS.get(e.partidaId) : undefined
  if (GUARDADOS.has(hk) && (!anterior || revisaoIntervalo(e) <= revisaoIntervalo(anterior))) return
  const snapshot = compactarEntrada(e)
  GUARDADOS.set(hk, r)
  NOVOS[hk] = [r.placar[0], r.placar[1], r.gols, temporadaAtual, e.versao ?? null, snapshot]
  if (snapshot.partidaId) PARTIDAS_SALVAS.set(snapshot.partidaId, snapshot)
}

const revisaoIntervalo = (e: EntradaM2): number => e.intervaloRevisao ?? (e.casa2?.length || e.fora2?.length ? 1 : 0)

function compactarEntrada(e: EntradaM2): EntradaM2 {
  const cartas = (cs: CartaCampo[]) => cs.map(c => ({
    name:c.name, pos:c.pos ?? c.sec, club:c.club, year:c.year,
    fame:c.fame, lo:c.lo, hi:c.hi, fake:c.fake, gasMod:c.gasMod,
  }))
  return { ...e, atualizarIntervalo:undefined, somenteConsulta:undefined, casa:cartas(e.casa), fora:cartas(e.fora),
    casa2:e.casa2 ? cartas(e.casa2) : undefined, fora2:e.fora2 ? cartas(e.fora2) : undefined }
}
