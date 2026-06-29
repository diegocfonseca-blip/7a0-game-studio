import type { Position, Nationality } from '../empresario/types'
import type { DraftPlayer } from './types'

// Real-ish Brazilian lower-division / regional clubs to start from.
export const START_CLUBS: { id: string; name: string; city: string }[] = [
  { id: 'tombense', name: 'Tombense', city: 'Tombos-MG' },
  { id: 'brusque', name: 'Brusque', city: 'Brusque-SC' },
  { id: 'ypiranga', name: 'Ypiranga', city: 'Erechim-RS' },
  { id: 'caldense', name: 'Caldense', city: 'Poços de Caldas-MG' },
  { id: 'aimore', name: 'Aimoré', city: 'São Leopoldo-RS' },
  { id: 'boa', name: 'Boa Esporte', city: 'Varginha-MG' },
  { id: 'operario', name: 'Operário', city: 'Ponta Grossa-PR' },
  { id: 'treze', name: 'Treze', city: 'Campina Grande-PB' },
  { id: 'globo', name: 'Globo FC', city: 'Ceará-Mirim-RN' },
  { id: 'real-noroeste', name: 'Real Noroeste', city: 'Águia Branca-ES' },
  { id: 'portovelho', name: 'Porto Velho', city: 'Porto Velho-RO' },
  { id: 'brasiliense', name: 'Brasiliense', city: 'Taguatinga-DF' },
]

// The AI "friends" who came back to 1992 with you.
export const AI_MANAGERS = ['Tonhão', 'PC Magrão', 'Régis da Vila', 'Marcão Pelado', 'Dão', 'Biriba', 'Serjão']

// CPU clubs that fill the pyramid. Index 0 = 1ª divisão (elite) … 3 = 4ª.
// The 4ª has only 6 here — the 4 human managers complete the 10.
export const CPU_POOLS: { name: string; city: string }[][] = [
  [ // 1ª divisão (elite)
    { name: 'Fla', city: 'Rio-RJ' }, { name: 'Verdão', city: 'São Paulo-SP' }, { name: 'Timão', city: 'São Paulo-SP' },
    { name: 'Tricolor SP', city: 'São Paulo-SP' }, { name: 'Peixe', city: 'Santos-SP' }, { name: 'Imortal', city: 'Porto Alegre-RS' },
    { name: 'Colorado', city: 'Porto Alegre-RS' }, { name: 'Raposa', city: 'Belo Horizonte-MG' }, { name: 'Galo', city: 'Belo Horizonte-MG' },
    { name: 'Gigante', city: 'Rio-RJ' },
  ],
  [ // 2ª divisão
    { name: 'Fogão', city: 'Rio-RJ' }, { name: 'Flu', city: 'Rio-RJ' }, { name: 'Esquadrão', city: 'Salvador-BA' },
    { name: 'Leão da Ilha', city: 'Recife-PE' }, { name: 'Esmeraldino', city: 'Goiânia-GO' }, { name: 'Coxa', city: 'Curitiba-PR' },
    { name: 'Furacão', city: 'Curitiba-PR' }, { name: 'Leão BA', city: 'Salvador-BA' }, { name: 'Timbu', city: 'Recife-PE' }, { name: 'Bugre', city: 'Campinas-SP' },
  ],
  [ // 3ª divisão
    { name: 'Leão SC', city: 'Florianópolis-SC' }, { name: 'Verdão SC', city: 'Chapecó-SC' }, { name: 'Macaca', city: 'Campinas-SP' },
    { name: 'Tricolor PR', city: 'Curitiba-PR' }, { name: 'Coelho', city: 'Belo Horizonte-MG' }, { name: 'Figueira', city: 'Florianópolis-SC' },
    { name: 'Tigre', city: 'Criciúma-SC' }, { name: 'Ju', city: 'Caxias-RS' }, { name: 'Galo AL', city: 'Maceió-AL' }, { name: 'Azulão AL', city: 'Maceió-AL' },
  ],
  [ // 4ª divisão (humans complete this one)
    { name: 'Bolívia Q.', city: 'São Luís-MA' }, { name: 'Papão', city: 'Belém-PA' }, { name: 'Leão Azul', city: 'Belém-PA' },
    { name: 'Tigre GO', city: 'Goiânia-GO' }, { name: 'Tubarão', city: 'Londrina-PR' }, { name: 'Alvinegro RN', city: 'Natal-RN' },
  ],
]

// CPU strength by division (1ª strongest, 4ª weakest)
export function divisionStrength(division: number): number {
  const base = ({ 1: 76, 2: 66, 3: 56, 4: 44 }[division] ?? 44)
  return base + Math.floor(Math.random() * 7) - 3
}

const FIRST = ['Cláudio', 'Edson', 'Wagner', 'Marcelo', 'Fábio', 'Robson', 'Luís', 'Sandro', 'Adilson', 'Nivaldo', 'Jair', 'Válter', 'Gilmar', 'Toninho', 'Reginaldo', 'Cleber', 'Mauro', 'Élton', 'Dener', 'Wilson']
const NICK = ['Tatu', 'Pelé da Várzea', 'Cabeção', 'Foguinho', 'Perna', 'Canhota', 'Mão de Onça', 'Galo', 'Tanque', 'Pituca', 'Trovão', 'Régua', 'Boi', 'Picolé', 'Dentinho', 'Maestro', 'Muralha', 'Raposa', 'Flecha', 'Paredão']

const POSITIONS: Position[] = ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'GOL', 'ZAG', 'MEI']

let fillerCounter = 0
// A squad of unknown 4th-division players — modest, forgettable, but yours.
export function generateFillerSquad(): DraftPlayer[] {
  const used = new Set<number>()
  const pick = (arr: string[]) => {
    let i = Math.floor(Math.random() * arr.length)
    while (used.has(i) && used.size < arr.length) i = Math.floor(Math.random() * arr.length)
    used.add(i)
    return arr[i]
  }
  return POSITIONS.map((pos) => {
    used.clear()
    const name = Math.random() < 0.5 ? pick(FIRST) : `${pick(FIRST).split(' ')[0]} "${pick(NICK)}"`
    return {
      id: `filler-${fillerCounter++}`,
      name,
      pos,
      rating: 38 + Math.floor(Math.random() * 14), // 38–51, true journeymen
      nationality: 'BR' as Nationality,
    }
  })
}

// the ids of the strongest 11 players (default lineup / what the AI fields)
export function bestEleven(squad: DraftPlayer[]): string[] {
  return [...squad].sort((a, b) => b.rating - a.rating).slice(0, 11).map(p => p.id)
}

// strength of the fielded XI. Uses the chosen lineup when valid, else top 11.
export function squadStrength(squad: DraftPlayer[], lineupIds?: string[]): number {
  let xi: DraftPlayer[]
  const chosen = (lineupIds ?? []).map(id => squad.find(p => p.id === id)).filter(Boolean) as DraftPlayer[]
  if (chosen.length === 11) xi = chosen
  else xi = [...squad].sort((a, b) => b.rating - a.rating).slice(0, 11)
  if (xi.length === 0) return 35
  return xi.reduce((s, p) => s + p.rating, 0) / xi.length
}
