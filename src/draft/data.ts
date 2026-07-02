import type { Position, Nationality } from '../empresario/types'
import type { DraftPlayer } from './types'

// Clubs available for human managers to pick — Brazilian clubs fitting 4th division of a world pyramid.
export const START_CLUBS: { id: string; name: string; city: string }[] = [
  { id: 'america-mg',     name: 'América-MG',      city: 'Belo Horizonte-MG' },
  { id: 'goias',          name: 'Goiás',            city: 'Goiânia-GO' },
  { id: 'sport',          name: 'Sport',            city: 'Recife-PE' },
  { id: 'vitoria',        name: 'Vitória',          city: 'Salvador-BA' },
  { id: 'coritiba',       name: 'Coritiba',         city: 'Curitiba-PR' },
  { id: 'avai',           name: 'Avaí',             city: 'Florianópolis-SC' },
  { id: 'nautico',        name: 'Náutico',          city: 'Recife-PE' },
  { id: 'ponte-preta',    name: 'Ponte Preta',      city: 'Campinas-SP' },
  { id: 'remo',           name: 'Remo',             city: 'Belém-PA' },
  { id: 'paysandu',       name: 'Paysandu',         city: 'Belém-PA' },
  { id: 'crb',            name: 'CRB',              city: 'Maceió-AL' },
  { id: 'sampaio',        name: 'Sampaio Corrêa',   city: 'São Luís-MA' },
]

// The AI "friends" who came back to 1992 with you.
export const AI_MANAGERS = ['Tonhão', 'PC Magrão', 'Régis da Vila', 'Marcão Pelado', 'Dão', 'Biriba', 'Serjão']

// CPU clubs that fill the pyramid. Index 0 = 1ª divisão (elite) … 3 = 4ª.
// Organised by 1992 world-ranking — humans start in 4ª and work up.
// The 4ª has only 6 here — the 4 human managers complete the 10.
export const CPU_POOLS: { name: string; city: string }[][] = [
  [ // 1ª divisão — elite mundial
    { name: 'Barcelona',    city: 'Barcelona-ESP' },
    { name: 'Real Madrid',  city: 'Madrid-ESP' },
    { name: 'AC Milan',     city: 'Milão-ITA' },
    { name: 'Juventus',     city: 'Turim-ITA' },
    { name: 'Ajax',         city: 'Amsterdam-HOL' },
    { name: 'Man. United',  city: 'Manchester-ENG' },
    { name: 'PSG',          city: 'Paris-FRA' },
    { name: 'Porto',        city: 'Porto-POR' },
    { name: 'Benfica',      city: 'Lisboa-POR' },
    { name: 'Olympique',    city: 'Marseille-FRA' },
  ],
  [ // 2ª divisão — forte internacional + top sul-americano
    { name: 'Bayern',       city: 'Munique-GER' },
    { name: 'Arsenal',      city: 'Londres-ENG' },
    { name: 'Inter',        city: 'Milão-ITA' },
    { name: 'Atlético',     city: 'Madrid-ESP' },
    { name: 'São Paulo',    city: 'São Paulo-SP' },
    { name: 'Boca Juniors', city: 'Buenos Aires-ARG' },
    { name: 'River Plate',  city: 'Buenos Aires-ARG' },
    { name: 'Flamengo',     city: 'Rio-RJ' },
    { name: 'B. Dortmund',  city: 'Dortmund-GER' },
    { name: 'Nacional',     city: 'Montevidéu-URU' },
  ],
  [ // 3ª divisão — forte regional + brasileiro de expressão
    { name: 'Grêmio',       city: 'Porto Alegre-RS' },
    { name: 'Cruzeiro',     city: 'Belo Horizonte-MG' },
    { name: 'Palmeiras',    city: 'São Paulo-SP' },
    { name: 'Corinthians',  city: 'São Paulo-SP' },
    { name: 'Celtic',       city: 'Glasgow-SCO' },
    { name: 'PSV',          city: 'Eindhoven-HOL' },
    { name: 'Sevilla',      city: 'Sevilha-ESP' },
    { name: 'Independiente',city: 'Avellaneda-ARG' },
    { name: 'Santos',       city: 'Santos-SP' },
    { name: 'Estudiantes',  city: 'La Plata-ARG' },
  ],
  [ // 4ª divisão — 9 CPU; o time humano completa os 10
    { name: 'Internacional', city: 'Porto Alegre-RS' },
    { name: 'Vasco',         city: 'Rio-RJ' },
    { name: 'Botafogo',      city: 'Rio-RJ' },
    { name: 'Fluminense',    city: 'Rio-RJ' },
    { name: 'Olimpia',       city: 'Assunção-PAR' },
    { name: 'Cruz Azul',     city: 'Cidade do México-MEX' },
    { name: 'Colo-Colo',     city: 'Santiago-CHI' },
    { name: 'Peñarol',       city: 'Montevidéu-URU' },
    { name: 'América',       city: 'Cidade do México-MEX' },
  ],
]

// CPU strength by division (1ª strongest, 4ª weakest)
export function divisionStrength(division: number): number {
  const base = ({ 1: 83, 2: 71, 3: 59, 4: 46 }[division] ?? 46)
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
