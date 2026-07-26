// ─── BidLegends — fundação de tipos (basquete NBA no motor do Leilão Legends) ───
// As 5 posições mapeiam 1:1 nos 5 setores do motor de futebol. O quinteto
// titular (o "XI") = 5; o elenco completo = 15 (3 por posição, limite real da NBA).
// Ver docs/conceito-basquete.md pra pirâmide, 82 jogos e conferências.

/** As 5 posições do basquete — mesma quantidade dos 5 setores do futebol. */
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

export const POSITION_LABEL: Record<Position, string> = {
  PG: 'Armador',
  SG: 'Ala-armador',
  SF: 'Ala',
  PF: 'Ala-pivô',
  C: 'Pivô',
}

export const POSITION_LABEL_LONG: Record<Position, string> = {
  PG: 'Point Guard · armador',
  SG: 'Shooting Guard · ala-armador',
  SF: 'Small Forward · ala',
  PF: 'Power Forward · ala-pivô',
  C: 'Center · pivô',
}

/** Titular por posição no quinteto — sempre 1 (o "XI" do basquete = 5). */
export const STARTERS_PER_POSITION = 1
/** Titulares em quadra. */
export const STARTING_FIVE = 5
/** Elenco completo: 3 por posição = 15 (banco fundo pros 82 jogos). */
export const ROSTER_PER_POSITION = 3
export const FULL_ROSTER = ROSTER_PER_POSITION * POSITIONS.length // 15

/** Categorias de carta — as MESMAS do futebol (folclórico é vibe, não categoria). */
export type CardTier = 'lenda' | 'craque' | 'promessa' | 'bom' | 'profissional'

export const CARD_TIER_LABEL: Record<CardTier, string> = {
  lenda: '👑 Lenda',
  craque: '⭐ Craque',
  promessa: '💎 Promessa',
  bom: '🎯 Bom jogador',
  profissional: '🪵 Foi profissional',
}

/** Táticas — pedra/papel/tesoura igual ao futebol. */
export type Tactic = 'defesa' | 'equilibrio' | 'run-and-gun'

export const TACTIC_LABEL: Record<Tactic, string> = {
  defesa: '🛡️ Defesa ferrenha',
  equilibrio: '⚖️ Equilíbrio',
  'run-and-gun': '🏃 Run-and-gun',
}

/** Carta do BidLegends: nível = auge NAQUELE ano/franquia. */
export interface BballCard {
  id: string
  nome: string
  franquia: string // ex.: 'Bulls'
  anoAuge: number // ex.: 1996
  pos: Position
  tier: CardTier
  folclorico?: boolean // 🃏 vibe, misturado nas categorias
  bio?: string // bio zoeira em PT
}
