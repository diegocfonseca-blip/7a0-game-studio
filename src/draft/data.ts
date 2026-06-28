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

// strength of a manager's best XI (top 11 by rating)
export function squadStrength(squad: DraftPlayer[]): number {
  if (squad.length === 0) return 35
  const top = [...squad].sort((a, b) => b.rating - a.rating).slice(0, 11)
  return top.reduce((s, p) => s + p.rating, 0) / top.length
}
