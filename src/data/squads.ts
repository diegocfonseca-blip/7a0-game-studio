export type Position = 'GOL' | 'LD' | 'ZAG' | 'LE' | 'VOL' | 'MC' | 'MD' | 'ME' | 'MEI' | 'PD' | 'PE' | 'CA'

export interface Player {
  id: string
  name: string
  shirtNumber: number
  primaryPosition: Position
  secondaryPositions: Position[]
  rating: number
  goalsInTournament: number
  isLegend: boolean
}

export interface Squad {
  id: string
  year: number
  countryCode: string
  countryNamePt: string
  flagEmoji: string
  notableReason: string
  players: Player[]
}

const squads: Squad[] = [
  {
    id: 'bra-1970',
    year: 1970,
    countryCode: 'BRA',
    countryNamePt: 'Brasil',
    flagEmoji: '🇧🇷',
    notableReason: 'A melhor seleção de todos os tempos — tricampeã',
    players: [
      { id: 'b70-1', name: 'Félix', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'b70-2', name: 'Carlos Alberto', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 93, goalsInTournament: 1, isLegend: true },
      { id: 'b70-3', name: 'Brito', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'b70-4', name: 'Piazza', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: ['VOL'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'b70-5', name: 'Everaldo', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'b70-6', name: 'Clodoaldo', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'b70-7', name: 'Gérson', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: [], rating: 91, goalsInTournament: 1, isLegend: true },
      { id: 'b70-8', name: 'Jairzinho', shirtNumber: 8, primaryPosition: 'PD', secondaryPositions: ['CA'], rating: 94, goalsInTournament: 7, isLegend: true },
      { id: 'b70-9', name: 'Tostão', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 91, goalsInTournament: 2, isLegend: true },
      { id: 'b70-10', name: 'Pelé', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: ['MEI'], rating: 99, goalsInTournament: 4, isLegend: true },
      { id: 'b70-11', name: 'Rivelino', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: ['MC'], rating: 93, goalsInTournament: 3, isLegend: true },
    ]
  },
  {
    id: 'bra-1982',
    year: 1982,
    countryCode: 'BRA',
    countryNamePt: 'Brasil',
    flagEmoji: '🇧🇷',
    notableReason: 'O melhor time a não vencer uma Copa — eliminado pela Itália',
    players: [
      { id: 'b82-1', name: 'Waldir Peres', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 78, goalsInTournament: 0, isLegend: false },
      { id: 'b82-2', name: 'Leandro', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'b82-3', name: 'Oscar', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 86, goalsInTournament: 1, isLegend: false },
      { id: 'b82-4', name: 'Luizinho', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'b82-5', name: 'Júnior', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: ['MC'], rating: 89, goalsInTournament: 2, isLegend: true },
      { id: 'b82-6', name: 'Toninho Cerezo', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'b82-7', name: 'Falcão', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 96, goalsInTournament: 1, isLegend: true },
      { id: 'b82-8', name: 'Sócrates', shirtNumber: 8, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 94, goalsInTournament: 2, isLegend: true },
      { id: 'b82-9', name: 'Zico', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['PE'], rating: 97, goalsInTournament: 4, isLegend: true },
      { id: 'b82-10', name: 'Éder', shirtNumber: 10, primaryPosition: 'PE', secondaryPositions: ['CA'], rating: 89, goalsInTournament: 2, isLegend: false },
      { id: 'b82-11', name: 'Serginho', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 79, goalsInTournament: 1, isLegend: false },
    ]
  },
  {
    id: 'bra-1994',
    year: 1994,
    countryCode: 'BRA',
    countryNamePt: 'Brasil',
    flagEmoji: '🇧🇷',
    notableReason: 'Tetracampeão nos pênaltis — Romário e Bebeto imortais',
    players: [
      { id: 'b94-1', name: 'Taffarel', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 90, goalsInTournament: 0, isLegend: true },
      { id: 'b94-2', name: 'Aldair', shirtNumber: 2, primaryPosition: 'ZAG', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'b94-3', name: 'Marcio Santos', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'b94-4', name: 'Branco', shirtNumber: 4, primaryPosition: 'LE', secondaryPositions: [], rating: 86, goalsInTournament: 1, isLegend: false },
      { id: 'b94-5', name: 'Cafu', shirtNumber: 5, primaryPosition: 'LD', secondaryPositions: [], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'b94-6', name: 'Mauro Silva', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'b94-7', name: 'Mazinho', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'b94-8', name: 'Mauro Silva', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: [], rating: 81, goalsInTournament: 0, isLegend: false },
      { id: 'b94-9', name: 'Romário', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: [], rating: 97, goalsInTournament: 5, isLegend: true },
      { id: 'b94-10', name: 'Bebeto', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: ['MEI'], rating: 93, goalsInTournament: 3, isLegend: true },
      { id: 'b94-11', name: 'Zinho', shirtNumber: 11, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 88, goalsInTournament: 1, isLegend: false },
    ]
  },
  {
    id: 'bra-2002',
    year: 2002,
    countryCode: 'BRA',
    countryNamePt: 'Brasil',
    flagEmoji: '🇧🇷',
    notableReason: 'Pentacampeão! Ronaldo Fenômeno renasceu',
    players: [
      { id: 'b02-1', name: 'Marcos', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'b02-2', name: 'Cafu', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 92, goalsInTournament: 0, isLegend: true },
      { id: 'b02-3', name: 'Lúcio', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 89, goalsInTournament: 1, isLegend: true },
      { id: 'b02-4', name: 'Edmílson', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: ['VOL'], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'b02-5', name: 'Roberto Carlos', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'b02-6', name: 'Gilberto Silva', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'b02-7', name: 'Kléberson', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'b02-8', name: 'Ronaldinho', shirtNumber: 8, primaryPosition: 'MEI', secondaryPositions: ['PE'], rating: 94, goalsInTournament: 2, isLegend: true },
      { id: 'b02-9', name: 'Ronaldo', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: [], rating: 97, goalsInTournament: 8, isLegend: true },
      { id: 'b02-10', name: 'Rivaldo', shirtNumber: 10, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 95, goalsInTournament: 8, isLegend: true },
      { id: 'b02-11', name: 'Edilson', shirtNumber: 11, primaryPosition: 'PD', secondaryPositions: ['CA'], rating: 82, goalsInTournament: 0, isLegend: false },
    ]
  },
  {
    id: 'arg-1986',
    year: 1986,
    countryCode: 'ARG',
    countryNamePt: 'Argentina',
    flagEmoji: '🇦🇷',
    notableReason: 'Maradona carregou sozinho — a Copa da mão de Deus',
    players: [
      { id: 'a86-1', name: 'Pumpido', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'a86-2', name: 'Cuciuffo', shirtNumber: 2, primaryPosition: 'ZAG', secondaryPositions: ['LD'], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'a86-3', name: 'Brown', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 84, goalsInTournament: 1, isLegend: false },
      { id: 'a86-4', name: 'Ruggeri', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'a86-5', name: 'Olarticoechea', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'a86-6', name: 'Giusti', shirtNumber: 6, primaryPosition: 'MD', secondaryPositions: ['LD'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'a86-7', name: 'Batista', shirtNumber: 7, primaryPosition: 'VOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'a86-8', name: 'Burruchaga', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 89, goalsInTournament: 1, isLegend: true },
      { id: 'a86-9', name: 'Valdano', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: [], rating: 88, goalsInTournament: 4, isLegend: false },
      { id: 'a86-10', name: 'Maradona', shirtNumber: 10, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 99, goalsInTournament: 5, isLegend: true },
      { id: 'a86-11', name: 'Enrique', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: ['MC'], rating: 83, goalsInTournament: 0, isLegend: false },
    ]
  },
  {
    id: 'arg-2022',
    year: 2022,
    countryCode: 'ARG',
    countryNamePt: 'Argentina',
    flagEmoji: '🇦🇷',
    notableReason: 'Messi finalmente campeão mundial — final épica contra a França',
    players: [
      { id: 'a22-1', name: 'Emiliano Martínez', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'a22-2', name: 'Nahuel Molina', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 85, goalsInTournament: 1, isLegend: false },
      { id: 'a22-3', name: 'Nicolás Otamendi', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'a22-4', name: 'Cristian Romero', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'a22-5', name: 'Marcos Acuña', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'a22-6', name: 'Rodrigo De Paul', shirtNumber: 6, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'a22-7', name: 'Leandro Paredes', shirtNumber: 7, primaryPosition: 'VOL', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'a22-8', name: 'Alexis Mac Allister', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: [], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'a22-9', name: 'Julián Álvarez', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: [], rating: 88, goalsInTournament: 4, isLegend: false },
      { id: 'a22-10', name: 'Messi', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: ['MEI'], rating: 99, goalsInTournament: 7, isLegend: true },
      { id: 'a22-11', name: 'Ángel Di María', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: ['PD'], rating: 89, goalsInTournament: 1, isLegend: true },
    ]
  },
  {
    id: 'fra-1998',
    year: 1998,
    countryCode: 'FRA',
    countryNamePt: 'França',
    flagEmoji: '🇫🇷',
    notableReason: 'Zidane bicampeão na final — França campeã em casa',
    players: [
      { id: 'f98-1', name: 'Barthez', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'f98-2', name: 'Thuram', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: ['ZAG'], rating: 89, goalsInTournament: 2, isLegend: true },
      { id: 'f98-3', name: 'Blanc', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'f98-4', name: 'Desailly', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: ['MC'], rating: 90, goalsInTournament: 0, isLegend: false },
      { id: 'f98-5', name: 'Lizarazu', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 89, goalsInTournament: 0, isLegend: false },
      { id: 'f98-6', name: 'Deschamps', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 88, goalsInTournament: 0, isLegend: true },
      { id: 'f98-7', name: 'Petit', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: [], rating: 84, goalsInTournament: 1, isLegend: false },
      { id: 'f98-8', name: 'Karembeu', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'f98-9', name: 'Zidane', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 98, goalsInTournament: 3, isLegend: true },
      { id: 'f98-10', name: 'Djorkaeff', shirtNumber: 10, primaryPosition: 'PD', secondaryPositions: ['MEI'], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'f98-11', name: 'Dugarry', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 80, goalsInTournament: 1, isLegend: false },
    ]
  },
  {
    id: 'ger-1954',
    year: 1954,
    countryCode: 'GER',
    countryNamePt: 'Alemanha',
    flagEmoji: '🇩🇪',
    notableReason: 'O milagre de Berna — venceu a Hungria na final',
    players: [
      { id: 'g54-1', name: 'Turek', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'g54-2', name: 'Kohlmeyer', shirtNumber: 2, primaryPosition: 'LE', secondaryPositions: ['ZAG'], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'g54-3', name: 'Posipal', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: ['LD'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'g54-4', name: 'Liebrich', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'g54-5', name: 'Eckel', shirtNumber: 5, primaryPosition: 'MC', secondaryPositions: ['MD'], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'g54-6', name: 'Laband', shirtNumber: 6, primaryPosition: 'ZAG', secondaryPositions: ['LD'], rating: 81, goalsInTournament: 0, isLegend: false },
      { id: 'g54-7', name: 'F. Walter', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 93, goalsInTournament: 4, isLegend: true },
      { id: 'g54-8', name: 'Morlock', shirtNumber: 8, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 88, goalsInTournament: 6, isLegend: false },
      { id: 'g54-9', name: 'Rahn', shirtNumber: 9, primaryPosition: 'PD', secondaryPositions: ['CA'], rating: 91, goalsInTournament: 4, isLegend: false },
      { id: 'g54-10', name: 'O. Walter', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: [], rating: 89, goalsInTournament: 3, isLegend: false },
      { id: 'g54-11', name: 'Schäfer', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: ['ME'], rating: 85, goalsInTournament: 4, isLegend: false },
    ]
  },
  {
    id: 'ger-2014',
    year: 2014,
    countryCode: 'GER',
    countryNamePt: 'Alemanha',
    flagEmoji: '🇩🇪',
    notableReason: 'Tetracampeã — 7x1 no Brasil e Götze na final',
    players: [
      { id: 'g14-1', name: 'Neuer', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 97, goalsInTournament: 0, isLegend: true },
      { id: 'g14-2', name: 'Lahm', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: ['VOL'], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'g14-3', name: 'Hummels', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 91, goalsInTournament: 1, isLegend: true },
      { id: 'g14-4', name: 'Boateng', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 90, goalsInTournament: 0, isLegend: false },
      { id: 'g14-5', name: 'Höwedes', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: ['ZAG'], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'g14-6', name: 'Khedira', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'g14-7', name: 'Schweinsteiger', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'g14-8', name: 'Kroos', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 93, goalsInTournament: 2, isLegend: true },
      { id: 'g14-9', name: 'Özil', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 90, goalsInTournament: 0, isLegend: false },
      { id: 'g14-10', name: 'Müller', shirtNumber: 10, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 93, goalsInTournament: 5, isLegend: true },
      { id: 'g14-11', name: 'Klose', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 91, goalsInTournament: 2, isLegend: true },
    ]
  },
  {
    id: 'ita-1982',
    year: 1982,
    countryCode: 'ITA',
    countryNamePt: 'Itália',
    flagEmoji: '🇮🇹',
    notableReason: 'Rossi ressurgiu e levou a Itália ao tri — Zoff lendário',
    players: [
      { id: 'i82-1', name: 'Zoff', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'i82-2', name: 'Bergomi', shirtNumber: 2, primaryPosition: 'ZAG', secondaryPositions: ['LD'], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'i82-3', name: 'Scirea', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'i82-4', name: 'Collovati', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'i82-5', name: 'Cabrini', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'i82-6', name: 'Oriali', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'i82-7', name: 'Antognoni', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'i82-8', name: 'Tardelli', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 90, goalsInTournament: 2, isLegend: true },
      { id: 'i82-9', name: 'Conti', shirtNumber: 9, primaryPosition: 'PD', secondaryPositions: ['MC'], rating: 88, goalsInTournament: 1, isLegend: false },
      { id: 'i82-10', name: 'Graziani', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'i82-11', name: 'Rossi', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 94, goalsInTournament: 6, isLegend: true },
    ]
  },
  {
    id: 'ned-1974',
    year: 1974,
    countryCode: 'NED',
    countryNamePt: 'Holanda',
    flagEmoji: '🇳🇱',
    notableReason: 'O futebol total de Cruyff — vice-campeã mas revolucionou o futebol',
    players: [
      { id: 'n74-1', name: 'Jongbloed', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'n74-2', name: 'Suurbier', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'n74-3', name: 'Rijsbergen', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'n74-4', name: 'Haan', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: ['MC'], rating: 86, goalsInTournament: 1, isLegend: false },
      { id: 'n74-5', name: 'Krol', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: ['ZAG'], rating: 90, goalsInTournament: 0, isLegend: true },
      { id: 'n74-6', name: 'Jansen', shirtNumber: 6, primaryPosition: 'MD', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'n74-7', name: 'Neeskens', shirtNumber: 7, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 93, goalsInTournament: 5, isLegend: true },
      { id: 'n74-8', name: 'Van Hanegem', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'n74-9', name: 'Rep', shirtNumber: 9, primaryPosition: 'PD', secondaryPositions: ['CA'], rating: 87, goalsInTournament: 3, isLegend: false },
      { id: 'n74-10', name: 'Cruyff', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: ['MEI'], rating: 99, goalsInTournament: 3, isLegend: true },
      { id: 'n74-11', name: 'Rensenbrink', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: ['CA'], rating: 86, goalsInTournament: 2, isLegend: false },
    ]
  },
  {
    id: 'esp-2010',
    year: 2010,
    countryCode: 'ESP',
    countryNamePt: 'Espanha',
    flagEmoji: '🇪🇸',
    notableReason: 'La Roja campeã — o tiqui-taca conquistou o mundo',
    players: [
      { id: 'e10-1', name: 'Casillas', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 95, goalsInTournament: 0, isLegend: true },
      { id: 'e10-2', name: 'Sergio Ramos', shirtNumber: 2, primaryPosition: 'ZAG', secondaryPositions: ['LD'], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'e10-3', name: 'Puyol', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 90, goalsInTournament: 1, isLegend: true },
      { id: 'e10-4', name: 'Piqué', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'e10-5', name: 'Capdevila', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'e10-6', name: 'Busquets', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 89, goalsInTournament: 0, isLegend: true },
      { id: 'e10-7', name: 'Xabi Alonso', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 92, goalsInTournament: 0, isLegend: true },
      { id: 'e10-8', name: 'Xavi', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 95, goalsInTournament: 0, isLegend: true },
      { id: 'e10-9', name: 'Iniesta', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 96, goalsInTournament: 1, isLegend: true },
      { id: 'e10-10', name: 'David Villa', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: ['PE'], rating: 93, goalsInTournament: 5, isLegend: true },
      { id: 'e10-11', name: 'David Silva', shirtNumber: 11, primaryPosition: 'MEI', secondaryPositions: ['PE'], rating: 91, goalsInTournament: 0, isLegend: true },
    ]
  },
  {
    id: 'kor-2002',
    year: 2002,
    countryCode: 'KOR',
    countryNamePt: 'Coreia do Sul',
    flagEmoji: '🇰🇷',
    notableReason: 'A maior zebra da história — semifinalista em casa',
    players: [
      { id: 'k02-1', name: 'Lee Woon-jae', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'k02-2', name: 'Song Chong-gug', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: ['MD'], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'k02-3', name: 'Choi Jin-cheul', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'k02-4', name: 'Kim Tae-young', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'k02-5', name: 'Lee Young-pyo', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: ['ME'], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'k02-6', name: 'Yoo Sang-chul', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: ['MC'], rating: 87, goalsInTournament: 1, isLegend: false },
      { id: 'k02-7', name: 'Kim Nam-il', shirtNumber: 7, primaryPosition: 'VOL', secondaryPositions: ['MD'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'k02-8', name: 'Park Ji-sung', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 91, goalsInTournament: 2, isLegend: true },
      { id: 'k02-9', name: 'Lee Eul-yong', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['ME'], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'k02-10', name: 'Seol Ki-hyeon', shirtNumber: 10, primaryPosition: 'PE', secondaryPositions: ['CA'], rating: 86, goalsInTournament: 2, isLegend: false },
      { id: 'k02-11', name: 'Ahn Jung-hwan', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: ['PE'], rating: 85, goalsInTournament: 2, isLegend: true },
    ]
  },
  {
    id: 'sen-2002',
    year: 2002,
    countryCode: 'SEN',
    countryNamePt: 'Senegal',
    flagEmoji: '🇸🇳',
    notableReason: 'Estreia histórica — eliminou a França campeã na fase de grupos',
    players: [
      { id: 's02-1', name: 'Tony Sylva', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 's02-2', name: 'Pape Sarr', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 's02-3', name: 'Lamine Diatta', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 's02-4', name: 'Ferdinand Coly', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: ['LE'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 's02-5', name: 'Habib Beye', shirtNumber: 5, primaryPosition: 'LD', secondaryPositions: ['ZAG'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 's02-6', name: 'Aliou Cissé', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 's02-7', name: 'Salif Diao', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 84, goalsInTournament: 1, isLegend: false },
      { id: 's02-8', name: 'Khalilou Fadiga', shirtNumber: 8, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 's02-9', name: 'Papa Bouba Diop', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: ['MC'], rating: 86, goalsInTournament: 1, isLegend: true },
      { id: 's02-10', name: 'El Hadji Diouf', shirtNumber: 10, primaryPosition: 'PD', secondaryPositions: ['CA'], rating: 90, goalsInTournament: 0, isLegend: true },
      { id: 's02-11', name: 'Henri Camara', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: ['PE'], rating: 87, goalsInTournament: 3, isLegend: false },
    ]
  },
  {
    id: 'hun-1954',
    year: 1954,
    countryCode: 'HUN',
    countryNamePt: 'Hungria',
    flagEmoji: '🇭🇺',
    notableReason: 'Os Mágicos Magiares — invicta por 4 anos mas perdeu a final',
    players: [
      { id: 'h54-1', name: 'Grosics', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: true },
      { id: 'h54-2', name: 'Buzánszky', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'h54-3', name: 'Loránt', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'h54-4', name: 'Lantos', shirtNumber: 4, primaryPosition: 'LE', secondaryPositions: [], rating: 85, goalsInTournament: 2, isLegend: false },
      { id: 'h54-5', name: 'Bozsik', shirtNumber: 5, primaryPosition: 'MC', secondaryPositions: [], rating: 91, goalsInTournament: 2, isLegend: true },
      { id: 'h54-6', name: 'Zakariás', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'h54-7', name: 'Budai', shirtNumber: 7, primaryPosition: 'PD', secondaryPositions: [], rating: 84, goalsInTournament: 2, isLegend: false },
      { id: 'h54-8', name: 'Kocsis', shirtNumber: 8, primaryPosition: 'CA', secondaryPositions: [], rating: 95, goalsInTournament: 11, isLegend: true },
      { id: 'h54-9', name: 'Hidegkuti', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 93, goalsInTournament: 4, isLegend: true },
      { id: 'h54-10', name: 'Puskás', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: [], rating: 99, goalsInTournament: 4, isLegend: true },
      { id: 'h54-11', name: 'Czibor', shirtNumber: 11, primaryPosition: 'PE', secondaryPositions: [], rating: 90, goalsInTournament: 4, isLegend: true },
    ]
  },
  {
    id: 'uru-1950',
    year: 1950,
    countryCode: 'URU',
    countryNamePt: 'Uruguai',
    flagEmoji: '🇺🇾',
    notableReason: 'O Maracanazo — venceu o Brasil no Maracanã lotado',
    players: [
      { id: 'u50-1', name: 'Máspoli', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: true },
      { id: 'u50-2', name: 'Tejera', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'u50-3', name: 'Varela', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: ['MC'], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'u50-4', name: 'Gambetta', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'u50-5', name: 'Andrade', shirtNumber: 5, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 91, goalsInTournament: 0, isLegend: true },
      { id: 'u50-6', name: 'Míguez', shirtNumber: 6, primaryPosition: 'LE', secondaryPositions: [], rating: 84, goalsInTournament: 4, isLegend: false },
      { id: 'u50-7', name: 'Ghiggia', shirtNumber: 7, primaryPosition: 'PD', secondaryPositions: [], rating: 93, goalsInTournament: 4, isLegend: true },
      { id: 'u50-8', name: 'Pérez', shirtNumber: 8, primaryPosition: 'ME', secondaryPositions: ['MC'], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'u50-9', name: 'Schiaffino', shirtNumber: 9, primaryPosition: 'MEI', secondaryPositions: ['CA'], rating: 95, goalsInTournament: 5, isLegend: true },
      { id: 'u50-10', name: 'Vidal', shirtNumber: 10, primaryPosition: 'PE', secondaryPositions: [], rating: 82, goalsInTournament: 1, isLegend: false },
      { id: 'u50-11', name: 'Moran', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 80, goalsInTournament: 0, isLegend: false },
    ]
  },
  {
    id: 'eng-1966',
    year: 1966,
    countryCode: 'ENG',
    countryNamePt: 'Inglaterra',
    flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    notableReason: 'O único título inglês — Hurst fez hat-trick na final',
    players: [
      { id: 'e66-1', name: 'Banks', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'e66-2', name: 'Cohen', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 86, goalsInTournament: 0, isLegend: false },
      { id: 'e66-3', name: 'Charlton J.', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'e66-4', name: 'Moore', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 94, goalsInTournament: 0, isLegend: true },
      { id: 'e66-5', name: 'Wilson', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'e66-6', name: 'Stiles', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 85, goalsInTournament: 0, isLegend: false },
      { id: 'e66-7', name: 'Charlton B.', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['MEI'], rating: 95, goalsInTournament: 3, isLegend: true },
      { id: 'e66-8', name: 'Ball', shirtNumber: 8, primaryPosition: 'MC', secondaryPositions: [], rating: 88, goalsInTournament: 0, isLegend: false },
      { id: 'e66-9', name: 'Greaves', shirtNumber: 9, primaryPosition: 'CA', secondaryPositions: [], rating: 87, goalsInTournament: 0, isLegend: false },
      { id: 'e66-10', name: 'Hunt', shirtNumber: 10, primaryPosition: 'CA', secondaryPositions: [], rating: 85, goalsInTournament: 3, isLegend: false },
      { id: 'e66-11', name: 'Hurst', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: [], rating: 92, goalsInTournament: 4, isLegend: true },
    ]
  },
  {
    id: 'por-2006',
    year: 2006,
    countryCode: 'POR',
    countryNamePt: 'Portugal',
    flagEmoji: '🇵🇹',
    notableReason: '3º lugar com Figo, Deco e o jovem Ronaldo — geração dourada',
    players: [
      { id: 'p06-1', name: 'Ricardo', shirtNumber: 1, primaryPosition: 'GOL', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'p06-2', name: 'Miguel', shirtNumber: 2, primaryPosition: 'LD', secondaryPositions: [], rating: 83, goalsInTournament: 0, isLegend: false },
      { id: 'p06-3', name: 'Fernando Meira', shirtNumber: 3, primaryPosition: 'ZAG', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'p06-4', name: 'Ricardo Carvalho', shirtNumber: 4, primaryPosition: 'ZAG', secondaryPositions: [], rating: 90, goalsInTournament: 0, isLegend: false },
      { id: 'p06-5', name: 'Nuno Valente', shirtNumber: 5, primaryPosition: 'LE', secondaryPositions: [], rating: 84, goalsInTournament: 0, isLegend: false },
      { id: 'p06-6', name: 'Costinha', shirtNumber: 6, primaryPosition: 'VOL', secondaryPositions: [], rating: 82, goalsInTournament: 0, isLegend: false },
      { id: 'p06-7', name: 'Maniche', shirtNumber: 7, primaryPosition: 'MC', secondaryPositions: ['VOL'], rating: 89, goalsInTournament: 1, isLegend: false },
      { id: 'p06-8', name: 'Deco', shirtNumber: 8, primaryPosition: 'MEI', secondaryPositions: ['MC'], rating: 92, goalsInTournament: 0, isLegend: true },
      { id: 'p06-9', name: 'Figo', shirtNumber: 9, primaryPosition: 'PD', secondaryPositions: ['MEI'], rating: 93, goalsInTournament: 0, isLegend: true },
      { id: 'p06-10', name: 'Simão', shirtNumber: 10, primaryPosition: 'PE', secondaryPositions: [], rating: 86, goalsInTournament: 2, isLegend: false },
      { id: 'p06-11', name: 'Cristiano Ronaldo', shirtNumber: 11, primaryPosition: 'CA', secondaryPositions: ['PD'], rating: 92, goalsInTournament: 1, isLegend: true },
    ]
  },
]

export default squads

export const TOTAL_SQUADS = squads.length
export const TOTAL_PLAYERS = squads.reduce((acc, s) => acc + s.players.length, 0)
