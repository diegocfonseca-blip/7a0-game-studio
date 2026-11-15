// ─── 🇧🇷 BRASIL OFICIAL: a carreira com CLUBES REAIS (15/11) ──────────────────────────────────────────────────────
// Diego: *"modo Brasil times oficiais… clubes reais com divisões reais… estaduais pra cada time real… Libertadores,
// Sul-Americana, Copa do Brasil real e Mundial… só pra quem tem plano"*. Plano inteiro em `docs/carreira-oficial-plano.md`.
//
// Este arquivo é a BASE PURA do modo (nada de tela, nada de save): quem são os clubes, em que divisão e estado, e o
// sorteio do elenco inicial. Nenhuma outra parte do jogo lê daqui — as cartas novas deste modo NÃO entram na Partida
// Rápida, nas salas online nem na carreira de time criado (ordem do Diego, 15/11).
//
// ⚠️ Divisões = as REAIS de 2026. A temporada real fecha em 28/11 (Série B) e 02/12 (Série A): nesse dia, atualizar
// quem subiu e quem caiu (Fase 4 do plano).
import type { Card, Sector } from './types'

export type DivOficial = 'A' | 'B' | 'C' | 'D'
export type ClubeOficial = {
  /** nome como o jogo escreve o clube (é a chave do escudo em `escudos-oficiais.ts`) */
  nome: string
  div: DivOficial
  uf: string
  /** nome do estadual que o clube joga no começo do ano */
  estadual: string
  /** outros nomes com que o clube aparece nas cartas (ex.: a era "Bragantino" dos anos 90) */
  apelidos?: string[]
}

const ESTADUAL: Record<string, string> = {
  RJ: 'Carioca', SP: 'Paulista', MG: 'Mineiro', RS: 'Gaúcho', PR: 'Paranaense', SC: 'Catarinense', BA: 'Baiano',
  PE: 'Pernambucano', CE: 'Cearense', GO: 'Goiano', PA: 'Paraense', AL: 'Alagoano', MT: 'Mato-Grossense',
  AM: 'Amazonense', PB: 'Paraibano', SE: 'Sergipano', MA: 'Maranhense',
}
const c = (nome: string, div: DivOficial, uf: string, apelidos?: string[]): ClubeOficial =>
  ({ nome, div, uf, estadual: ESTADUAL[uf] ?? uf, ...(apelidos ? { apelidos } : {}) })

/** Séries A, B e C de 2026 (conferidas em 15/11 — Band, ESPN, pt.wikipedia; C em docs/brasil-oficial/cartas-serie-c.md) */
export const CLUBES_BR: ClubeOficial[] = [
  // Série A 2026
  c('Athletico-PR', 'A', 'PR', ['Atlético-PR']), c('Atlético-MG', 'A', 'MG'), c('Bahia', 'A', 'BA'), c('Botafogo', 'A', 'RJ'),
  c('Bragantino', 'A', 'SP', ['Red Bull Bragantino']), c('Chapecoense', 'A', 'SC'), c('Corinthians', 'A', 'SP'),
  c('Coritiba', 'A', 'PR'), c('Cruzeiro', 'A', 'MG'), c('Flamengo', 'A', 'RJ'), c('Fluminense', 'A', 'RJ'), c('Grêmio', 'A', 'RS'),
  c('Internacional', 'A', 'RS'), c('Mirassol', 'A', 'SP'), c('Palmeiras', 'A', 'SP'), c('Remo', 'A', 'PA'), c('Santos', 'A', 'SP'),
  c('São Paulo', 'A', 'SP'), c('Vasco', 'A', 'RJ'), c('Vitória', 'A', 'BA'),
  // Série B 2026
  c('América-MG', 'B', 'MG'), c('Athletic', 'B', 'MG'), c('Atlético-GO', 'B', 'GO'), c('Avaí', 'B', 'SC'), c('Botafogo-SP', 'B', 'SP'),
  c('Ceará', 'B', 'CE'), c('CRB', 'B', 'AL'), c('Criciúma', 'B', 'SC'), c('Cuiabá', 'B', 'MT'), c('Fortaleza', 'B', 'CE'),
  c('Goiás', 'B', 'GO'), c('Juventude', 'B', 'RS'), c('Londrina', 'B', 'PR'), c('Náutico', 'B', 'PE'), c('Novorizontino', 'B', 'SP'),
  c('Operário-PR', 'B', 'PR'), c('Ponte Preta', 'B', 'SP'), c('São Bernardo', 'B', 'SP'), c('Sport', 'B', 'PE'), c('Vila Nova', 'B', 'GO'),
  // Série C 2026
  c('Amazonas', 'C', 'AM'), c('Anápolis', 'C', 'GO'), c('Barra', 'C', 'SC'), c('Botafogo-PB', 'C', 'PB'), c('Brusque', 'C', 'SC'),
  c('Caxias', 'C', 'RS'), c('Confiança', 'C', 'SE'), c('Ferroviária', 'C', 'SP'), c('Figueirense', 'C', 'SC'), c('Floresta', 'C', 'CE'),
  c('Guarani', 'C', 'SP'), c('Inter de Limeira', 'C', 'SP'), c('Itabaiana', 'C', 'SE'), c('Ituano', 'C', 'SP'), c('Maranhão', 'C', 'MA'),
  c('Maringá', 'C', 'PR'), c('Paysandu', 'C', 'PA'), c('Santa Cruz', 'C', 'PE'), c('Volta Redonda', 'C', 'RJ'), c('Ypiranga', 'C', 'RS'),
]

export const clubesDaDivisao = (div: DivOficial) => CLUBES_BR.filter(x => x.div === div)
export const clubeOficial = (nome: string) => CLUBES_BR.find(x => x.nome === nome || x.apelidos?.includes(nome)) ?? null

type CartaCat = Pick<Card, 'name' | 'club' | 'year'> & { fame: number }
/** todas as cartas do clube (pelo nome e pelos apelidos), por posição */
export function cartasDoClube<T extends CartaCat>(clube: ClubeOficial, catalogo: Record<Sector, T[]>): { pos: Sector; carta: T }[] {
  const nomes = new Set([clube.nome, ...(clube.apelidos ?? [])])
  const out: { pos: Sector; carta: T }[] = []
  for (const pos of Object.keys(catalogo) as Sector[]) for (const carta of catalogo[pos]) if (nomes.has(carta.club)) out.push({ pos, carta })
  return out
}

/** quantas de cada posição o sorteio tenta pôr nos 22 (o que faltar numa posição é completado com as outras) */
export const COTA_22: Record<Sector, number> = { GOL: 2, LAT: 4, ZAG: 4, MEI: 6, ATA: 6 }
export const ELENCO_INICIAL = 22
/** o mínimo pra um clube entrar no modo: dá pra montar um 11 */
export const MINIMO_TIME: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }

// dado preso na semente da carreira (mesma semente = mesmo sorteio, em qualquer aparelho)
function rng(seed: number) {
  let s = (seed >>> 0) || 1
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function embaralha<T>(l: T[], r: () => number): T[] { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

/**
 * 🎲 O SORTEIO DO ELENCO (Diego: *"Flamengo tem 70 jogadores, então terá um sorteio pra ter 22 de forma aleatória. E o
 * restante que não entrou fica de sobra pros leilões de sempre"*).
 * Primeiro garante o 11 (MINIMO_TIME), depois enche as cotas por posição, depois completa até 22 com quem sobrou.
 * Clube com 22 ou menos leva todas (sobra vazia).
 */
export function sorteiaElenco<T extends CartaCat>(cartas: { pos: Sector; carta: T }[], seed: number, n = ELENCO_INICIAL) {
  if (cartas.length <= n) return { elenco: [...cartas], sobra: [] as typeof cartas }
  const r = rng(seed)
  const porPos: Record<Sector, { pos: Sector; carta: T }[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const x of embaralha(cartas, r)) porPos[x.pos].push(x)
  const elenco: { pos: Sector; carta: T }[] = []
  const tira = (pos: Sector, q: number) => { while (q-- > 0 && porPos[pos].length && elenco.length < n) elenco.push(porPos[pos].shift()!) }
  for (const pos of Object.keys(MINIMO_TIME) as Sector[]) tira(pos, MINIMO_TIME[pos])
  for (const pos of Object.keys(COTA_22) as Sector[]) tira(pos, COTA_22[pos] - elenco.filter(x => x.pos === pos).length)
  const resto = embaralha((Object.values(porPos) as { pos: Sector; carta: T }[][]).flat(), r)
  while (elenco.length < n && resto.length) { const x = resto.shift()!; porPos[x.pos].splice(porPos[x.pos].indexOf(x), 1); elenco.push(x) }
  const sobra = (Object.values(porPos) as { pos: Sector; carta: T }[][]).flat()
  return { elenco, sobra }
}

/** o clube já dá um 11? (trava do modo: clube sem isso não aparece pra escolher) */
export function fechaTime(cartas: { pos: Sector }[]): boolean {
  return (Object.keys(MINIMO_TIME) as Sector[]).every(p => cartas.filter(x => x.pos === p).length >= MINIMO_TIME[p])
}
