import { CATALOG_BOTH } from './data'

/** Regras esportivas da carreira internacional. Sem estado, UI ou sorteio. */
export const INTERNATIONAL_UNLOCK_SEASON = 40
export const INTERNATIONAL_CAREER_TESTERS: readonly string[] = ['diego.c.fonseca@gmail.com']
export const isInternationalCareerTester = (email?: string | null): boolean =>
  !!email && INTERNATIONAL_CAREER_TESTERS.includes(email.trim().toLowerCase())

export type InternationalCompetition = 'libertadores' | 'champions'
export type InternationalClub = {
  name: string
  competition: InternationalCompetition
  block: number
}

// Uma única fonte para as 72 instituições. A ordem dentro do bloco é editorial;
// a prioridade esportiva escolhe o bloco, nunca um clube reservado por bot.
export const INTERNATIONAL_BLOCKS: readonly {
  libertadores: readonly string[]
  champions: readonly string[]
}[] = [
  { libertadores: ['Flamengo', 'Palmeiras', 'Boca Juniors', 'River Plate'], champions: ['Real Madrid', 'Barcelona', 'Bayern de Munique', 'Milan'] },
  { libertadores: ['São Paulo', 'Santos', 'Corinthians', 'Grêmio'], champions: ['Liverpool', 'Manchester United', 'Juventus', 'Inter de Milão'] },
  { libertadores: ['Internacional', 'Cruzeiro', 'Atlético-MG', 'Fluminense'], champions: ['Chelsea', 'Arsenal', 'Manchester City', 'PSG'] },
  { libertadores: ['Vasco', 'Botafogo', 'Independiente', 'Peñarol'], champions: ['Ajax', 'Borussia Dortmund', 'Atlético de Madrid', 'Benfica'] },
  { libertadores: ['Nacional-URU', 'Estudiantes', 'Racing', 'Vélez Sarsfield'], champions: ['Porto', 'Napoli', 'Roma', 'Tottenham'] },
  { libertadores: ['Olimpia', 'Atlético Nacional', 'Colo-Colo', 'LDU'], champions: ['PSV', 'Feyenoord', 'Marseille', 'Bayer Leverkusen'] },
  { libertadores: ["San Lorenzo", "Newell's Old Boys", 'Rosario Central', 'Argentinos Juniors'], champions: ['Valencia', 'Sevilla', 'Lyon', 'Monaco'] },
  { libertadores: ['Cerro Porteño', 'Barcelona-EQU', 'América de Cali', 'Universidad de Chile'], champions: ['Sporting', 'Celtic', 'Aston Villa', 'Newcastle'] },
  { libertadores: ['Libertad', 'Emelec', 'Millonarios', 'Universitario'], champions: ['Galatasaray', 'Rangers', 'Anderlecht', 'Shakhtar Donetsk'] },
] as const

export const INTERNATIONAL_CLUBS: readonly InternationalClub[] = INTERNATIONAL_BLOCKS.flatMap((block, i) => [
  ...block.libertadores.map(name => ({ name, competition: 'libertadores' as const, block: i + 1 })),
  ...block.champions.map(name => ({ name, competition: 'champions' as const, block: i + 1 })),
])

export type InternationalQualifier<T> = {
  team: T
  priority: number
  leaguePosition: number | null
  leagueChampion: boolean
  cupChampion: boolean
}

/** Série A classificada em ordem da tabela; campeão da Copa pode vir de outra série. */
export function internationalQualifiers<T>(serieA: readonly T[], cupChampion: T | null | undefined, key: (team: T) => string): InternationalQualifier<T>[] {
  const topEight = serieA.slice(0, 8)
  const leagueChampion = topEight[0]
  const leagueChampionKey = leagueChampion === undefined ? null : key(leagueChampion)
  const cupChampionKey = cupChampion == null ? null : key(cupChampion)
  const ordered = [leagueChampion, cupChampion, ...topEight.slice(1)].filter((team): team is T => team !== undefined && team !== null)
  const seen = new Set<string>()
  return ordered.flatMap(team => {
    const id = key(team)
    if (seen.has(id)) return []
    seen.add(id)
    const index = topEight.findIndex(item => key(item) === id)
    return [{
      team,
      priority: seen.size,
      leaguePosition: index < 0 ? null : index + 1,
      leagueChampion: id === leagueChampionKey,
      cupChampion: id === cupChampionKey,
    }]
  })
}

/** Quem não se classificou não recebe instituição, mesmo depois da T40. */
export function internationalChoice<T>(enabledForAccount: boolean, season: number, qualifiers: readonly InternationalQualifier<T>[], teamKey: string, key: (team: T) => string): InternationalClub[] {
  if (!enabledForAccount || season < INTERNATIONAL_UNLOCK_SEASON) return []
  const qualifier = qualifiers.find(item => key(item.team) === teamKey)
  return qualifier ? INTERNATIONAL_CLUBS.filter(club => club.block >= qualifier.priority) : []
}

export type InternationalCard = { name: string; club: string; year: number; pos: 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'; lo: number; hi: number }
export const internationalCardKey = (card: Pick<InternationalCard, 'name' | 'club' | 'year'>) => `${card.name}|${card.club}|${card.year}`
const REAL_INTERNATIONAL_CARDS = new Set(Object.entries(CATALOG_BOTH).flatMap(([pos, cards]) =>
  cards.map(card => `${pos}|${internationalCardKey(card)}`)))
/** Incógnitos, fillers da Várzea e crias da Base não são cartas reais do baralho. */
export function isRealInternationalCard(card: Pick<InternationalCard, 'name' | 'club' | 'year' | 'pos'> & { fake?: boolean; cria?: boolean }): boolean {
  return !card.fake && !card.cria && REAL_INTERNATIONAL_CARDS.has(`${card.pos}|${internationalCardKey(card)}`)
}
/** XI de clubes, respeitando as famílias de posição já usadas pelo jogo. */
export function validInternationalXI(cards: readonly (Pick<InternationalCard, 'name' | 'club' | 'year' | 'pos'> & { fake?: boolean; cria?: boolean })[]): boolean {
  if (cards.length !== 11 || cards.some(card => !isRealInternationalCard(card)) || new Set(cards.map(internationalCardKey)).size !== 11) return false
  const count = (pos: InternationalCard['pos']) => cards.filter(card => card.pos === pos).length
  return count('GOL') === 1 && count('LAT') + count('ZAG') >= 3 && count('MEI') >= 2 && count('ATA') >= 1
}
const XI_NEEDS: Record<InternationalCard['pos'], number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
const POSITIONS: InternationalCard['pos'][] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

// Nomes editoriais dos 72 clubes podem diferir do campo `club` dos baralhos.
// Manter aliases junto do catálogo internacional, sem mudar a identidade da carta.
export const INTERNATIONAL_CLUB_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'Bayern de Munique': ['Bayern'],
  'Inter de Milão': ['Inter'],
  'Manchester City': ['Man City'],
  'Manchester United': ['Man United'],
  'Borussia Dortmund': ['Dortmund'],
  'LDU': ['LDU Quito'],
  'Barcelona-EQU': ['Barcelona SC'],
}

/**
 * Distribuição após a escolha do usuário. Prioriza cartas históricas da
 * instituição e completa lacunas com cartas reais do mesmo baralho. Cada carta
 * pertence a no máximo um bot; as cartas do usuário são reservadas antes.
 * Devolve erro explícito se o catálogo não sustentar todos os XI.
 */
export function internationalBotSquads<T extends InternationalCard>(
  cards: readonly T[], representedClub: string | null, userCards: readonly Pick<T, 'name' | 'club' | 'year'>[] = [],
): Map<string, T[]> {
  if (representedClub !== null && !INTERNATIONAL_CLUBS.some(club => club.name === representedClub)) throw new Error('Escolha uma instituição internacional antes de distribuir os bots')
  const bots = INTERNATIONAL_CLUBS.filter(club => club.name !== representedClub)
  const used = new Set(userCards.map(internationalCardKey))
  const sorted = [...cards].sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi) || internationalCardKey(a).localeCompare(internationalCardKey(b)))
  const result = new Map(bots.map(club => [club.name, [] as T[]]))
  for (const pos of POSITIONS) {
    const pool = sorted.filter(card => card.pos === pos)
    // Primeiro cada instituição recebe suas cartas históricas. Só depois o
    // baralho real disponível completa posições que ainda faltarem.
    for (let slot = 0; slot < XI_NEEDS[pos]; slot++) for (const club of bots) {
      const names = [club.name, ...(INTERNATIONAL_CLUB_ALIASES[club.name] ?? [])]
      const pick = pool.find(card => !used.has(internationalCardKey(card)) && names.includes(card.club))
      if (pick) { used.add(internationalCardKey(pick)); result.get(club.name)!.push(pick) }
    }
    for (let slot = 0; slot < XI_NEEDS[pos]; slot++) for (const club of bots) {
      if (result.get(club.name)!.filter(card => card.pos === pos).length > slot) continue
      const pick = pool.find(card => !used.has(internationalCardKey(card)))
      if (!pick) throw new Error(`Baralho insuficiente para ${club.name}: ${pos}`)
      used.add(internationalCardKey(pick)); result.get(club.name)!.push(pick)
    }
  }
  return result
}
