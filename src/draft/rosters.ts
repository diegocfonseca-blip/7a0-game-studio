import type { Position } from '../empresario/types'
import type { DraftPlayer } from './types'

type P = { name: string; pos: Position; rating: number }

// Key named players per CPU team (cpuIndex 0-38 matches CPU_POOLS order)
// Div1=0-9, Div2=10-19, Div3=20-29, Div4=30-38
// All set in 1992 — world clubs get era-appropriate international names.
const KEYS: P[][] = [
  // ── DIV 1 (elite mundial) ────────────────────────────────────────
  // c0 - Barcelona
  [
    { name: 'Zubizarreta',   pos: 'GOL', rating: 88 }, { name: 'Unzué',         pos: 'GOL', rating: 72 },
    { name: 'Koeman',        pos: 'ZAG', rating: 87 }, { name: 'Nadal',         pos: 'ZAG', rating: 82 }, { name: 'Ferrer',        pos: 'ZAG', rating: 78 },
    { name: 'Sergi',         pos: 'LAT', rating: 80 }, { name: 'Eusebio',       pos: 'LAT', rating: 76 },
    { name: 'Guardiola',     pos: 'MEI', rating: 85 }, { name: 'Bakero',        pos: 'MEI', rating: 82 }, { name: 'Laudrup',       pos: 'MEI', rating: 87 }, { name: 'Begiristain',   pos: 'MEI', rating: 79 },
    { name: 'Stoichkov',     pos: 'ATA', rating: 89 }, { name: 'Julio Salinas', pos: 'ATA', rating: 80 }, { name: 'Goikoetxea',    pos: 'ATA', rating: 74 },
  ],
  // c1 - Real Madrid
  [
    { name: 'Buyo',          pos: 'GOL', rating: 85 }, { name: 'Cañizares',     pos: 'GOL', rating: 73 },
    { name: 'Sanchís',       pos: 'ZAG', rating: 84 }, { name: 'Hierro',        pos: 'ZAG', rating: 83 }, { name: 'Solana',        pos: 'ZAG', rating: 76 },
    { name: 'Chendo',        pos: 'LAT', rating: 79 }, { name: 'Martín',        pos: 'LAT', rating: 74 },
    { name: 'Míchel',        pos: 'MEI', rating: 83 }, { name: 'Redondo',       pos: 'MEI', rating: 86 }, { name: 'Martín Vázquez',pos: 'MEI', rating: 81 }, { name: 'Butragueño',    pos: 'MEI', rating: 78 },
    { name: 'Hugo Sánchez',  pos: 'ATA', rating: 87 }, { name: 'Zamorano',      pos: 'ATA', rating: 85 }, { name: 'Amancio Jr',    pos: 'ATA', rating: 73 },
  ],
  // c2 - AC Milan
  [
    { name: 'Sebastiano Rossi', pos: 'GOL', rating: 87 }, { name: 'Pazzagli',   pos: 'GOL', rating: 70 },
    { name: 'Baresi',        pos: 'ZAG', rating: 92 }, { name: 'Costacurta',   pos: 'ZAG', rating: 88 }, { name: 'Filippo Galli', pos: 'ZAG', rating: 79 },
    { name: 'Maldini',       pos: 'LAT', rating: 90 }, { name: 'Tassotti',     pos: 'LAT', rating: 81 },
    { name: 'Albertini',     pos: 'MEI', rating: 84 }, { name: 'Donadoni',     pos: 'MEI', rating: 82 }, { name: 'Evani',         pos: 'MEI', rating: 78 }, { name: 'Ancelotti',     pos: 'MEI', rating: 80 },
    { name: 'Van Basten',    pos: 'ATA', rating: 93 }, { name: 'Savicevic',    pos: 'ATA', rating: 88 }, { name: 'Massaro',       pos: 'ATA', rating: 79 },
  ],
  // c3 - Juventus
  [
    { name: 'Peruzzi',       pos: 'GOL', rating: 86 }, { name: 'Tacconi',      pos: 'GOL', rating: 71 },
    { name: 'Kohler',        pos: 'ZAG', rating: 85 }, { name: 'Julio César',  pos: 'ZAG', rating: 82 }, { name: 'Carrera',       pos: 'ZAG', rating: 78 },
    { name: 'Torricelli',    pos: 'LAT', rating: 79 }, { name: 'De Agostini', pos: 'LAT', rating: 76 },
    { name: 'Deschamps',     pos: 'MEI', rating: 85 }, { name: 'Möller',       pos: 'MEI', rating: 82 }, { name: 'Marocchi',      pos: 'MEI', rating: 77 }, { name: 'Baggio Di',     pos: 'MEI', rating: 74 },
    { name: 'Roberto Baggio',pos: 'ATA', rating: 91 }, { name: 'Vialli',       pos: 'ATA', rating: 87 }, { name: 'Casiraghi',     pos: 'ATA', rating: 79 },
  ],
  // c4 - Ajax
  [
    { name: 'Van Breukelen', pos: 'GOL', rating: 86 }, { name: 'Menzo',        pos: 'GOL', rating: 71 },
    { name: 'Frank de Boer', pos: 'ZAG', rating: 84 }, { name: 'Blind',        pos: 'ZAG', rating: 82 }, { name: 'Winter',        pos: 'ZAG', rating: 78 },
    { name: 'Silooy',        pos: 'LAT', rating: 78 }, { name: "Van 't Schip", pos: 'LAT', rating: 75 },
    { name: 'Jonk',          pos: 'MEI', rating: 83 }, { name: 'Witschge',     pos: 'MEI', rating: 80 }, { name: 'Litmanen',      pos: 'MEI', rating: 85 }, { name: 'Ronald de Boer',pos: 'MEI', rating: 80 },
    { name: 'Bergkamp',      pos: 'ATA', rating: 89 }, { name: 'Pettersson',   pos: 'ATA', rating: 78 }, { name: 'Finidi',        pos: 'ATA', rating: 76 },
  ],
  // c5 - Man. United
  [
    { name: 'Schmeichel',    pos: 'GOL', rating: 90 }, { name: 'Sealey',       pos: 'GOL', rating: 69 },
    { name: 'Pallister',     pos: 'ZAG', rating: 83 }, { name: 'Bruce',        pos: 'ZAG', rating: 82 }, { name: 'Blackmore',     pos: 'ZAG', rating: 75 },
    { name: 'Irwin',         pos: 'LAT', rating: 82 }, { name: 'Martin',       pos: 'LAT', rating: 73 },
    { name: 'Keane',         pos: 'MEI', rating: 86 }, { name: 'Ince',         pos: 'MEI', rating: 82 }, { name: 'Giggs',         pos: 'MEI', rating: 87 }, { name: 'McClair',       pos: 'MEI', rating: 78 },
    { name: 'Cantona',       pos: 'ATA', rating: 90 }, { name: 'Hughes',       pos: 'ATA', rating: 84 }, { name: 'Sharpe',        pos: 'ATA', rating: 77 },
  ],
  // c6 - PSG
  [
    { name: 'Lama',          pos: 'GOL', rating: 84 }, { name: 'Froger',       pos: 'GOL', rating: 68 },
    { name: 'Kombouaré',     pos: 'ZAG', rating: 80 }, { name: 'Le Guen',      pos: 'ZAG', rating: 79 }, { name: 'Roche',         pos: 'ZAG', rating: 74 },
    { name: 'Colleter',      pos: 'LAT', rating: 77 }, { name: 'Fournier',     pos: 'LAT', rating: 72 },
    { name: 'Ginola',        pos: 'MEI', rating: 84 }, { name: 'Valdo',        pos: 'MEI', rating: 82 }, { name: 'Raí',           pos: 'MEI', rating: 83 }, { name: 'Sassus',        pos: 'MEI', rating: 74 },
    { name: 'Weah',          pos: 'ATA', rating: 86 }, { name: 'Guérin',       pos: 'ATA', rating: 77 }, { name: 'Nouma',         pos: 'ATA', rating: 73 },
  ],
  // c7 - Porto
  [
    { name: 'Vítor Baía',    pos: 'GOL', rating: 85 }, { name: 'Vitorino',     pos: 'GOL', rating: 69 },
    { name: 'Aloisio',       pos: 'ZAG', rating: 79 }, { name: 'Secretário',   pos: 'ZAG', rating: 78 }, { name: 'Lima',          pos: 'ZAG', rating: 74 },
    { name: 'Oceano',        pos: 'LAT', rating: 77 }, { name: 'Paulo Alves',  pos: 'LAT', rating: 72 },
    { name: 'Kostadinov',    pos: 'MEI', rating: 82 }, { name: 'Rui Barros',   pos: 'MEI', rating: 80 }, { name: 'Capucho',       pos: 'MEI', rating: 76 }, { name: 'Domingos',      pos: 'MEI', rating: 74 },
    { name: 'João Pinto',    pos: 'ATA', rating: 82 }, { name: 'Semedo',       pos: 'ATA', rating: 75 }, { name: 'Varela',        pos: 'ATA', rating: 72 },
  ],
  // c8 - Benfica
  [
    { name: "Preud'homme",   pos: 'GOL', rating: 84 }, { name: 'Heitor',       pos: 'GOL', rating: 68 },
    { name: 'Veloso',        pos: 'ZAG', rating: 79 }, { name: 'Damas',        pos: 'ZAG', rating: 77 }, { name: 'Cabral',        pos: 'ZAG', rating: 73 },
    { name: 'Paneira',       pos: 'LAT', rating: 76 }, { name: 'Silvestre',    pos: 'LAT', rating: 71 },
    { name: 'Thern',         pos: 'MEI', rating: 82 }, { name: 'Isaías',       pos: 'MEI', rating: 80 }, { name: 'Schwarz',       pos: 'MEI', rating: 78 }, { name: 'Vata',          pos: 'MEI', rating: 73 },
    { name: 'Yuran',         pos: 'ATA', rating: 82 }, { name: 'Rui Costa',    pos: 'ATA', rating: 79 }, { name: 'Pacheco',       pos: 'ATA', rating: 73 },
  ],
  // c9 - Olympique (Marseille)
  [
    { name: 'Barthez',       pos: 'GOL', rating: 87 }, { name: 'Olmeta',       pos: 'GOL', rating: 70 },
    { name: 'Desailly',      pos: 'ZAG', rating: 86 }, { name: 'Boli',         pos: 'ZAG', rating: 83 }, { name: 'Blanc',         pos: 'ZAG', rating: 81 },
    { name: 'Di Meco',       pos: 'LAT', rating: 80 }, { name: 'Angloma',      pos: 'LAT', rating: 77 },
    { name: 'Deschamps',     pos: 'MEI', rating: 85 }, { name: 'Pélé',         pos: 'MEI', rating: 78 }, { name: 'Sauzée',        pos: 'MEI', rating: 79 }, { name: 'Eydelie',       pos: 'MEI', rating: 74 },
    { name: 'Völler',        pos: 'ATA', rating: 85 }, { name: 'Waddle',       pos: 'ATA', rating: 83 }, { name: 'Bokšić',        pos: 'ATA', rating: 79 },
  ],

  // ── DIV 2 (forte internacional + top sul-americano) ───────────────
  // c10 - Bayern
  [
    { name: 'Kahn',          pos: 'GOL', rating: 82 }, { name: 'Aumann',       pos: 'GOL', rating: 68 },
    { name: 'Helmer',        pos: 'ZAG', rating: 80 }, { name: 'Nerlinger',    pos: 'ZAG', rating: 77 }, { name: 'Kreuzer',       pos: 'ZAG', rating: 74 },
    { name: 'Ziege',         pos: 'LAT', rating: 78 }, { name: 'Grahammer',    pos: 'LAT', rating: 70 },
    { name: 'Matthäus',      pos: 'MEI', rating: 86 }, { name: 'Effenberg',    pos: 'MEI', rating: 83 }, { name: 'Scholl',        pos: 'MEI', rating: 80 }, { name: 'Babbel',        pos: 'MEI', rating: 73 },
    { name: 'Klinsmann',     pos: 'ATA', rating: 84 }, { name: 'Wohlfarth',    pos: 'ATA', rating: 76 }, { name: 'Papin',         pos: 'ATA', rating: 79 },
  ],
  // c11 - Arsenal
  [
    { name: 'Seaman',        pos: 'GOL', rating: 82 }, { name: 'Miller',       pos: 'GOL', rating: 66 },
    { name: 'Adams',         pos: 'ZAG', rating: 83 }, { name: 'Bould',        pos: 'ZAG', rating: 80 }, { name: 'Keown',         pos: 'ZAG', rating: 78 },
    { name: 'Winterburn',    pos: 'LAT', rating: 79 }, { name: 'Dixon',        pos: 'LAT', rating: 77 },
    { name: 'Davis',         pos: 'MEI', rating: 78 }, { name: 'Parlour',      pos: 'MEI', rating: 75 }, { name: 'Merson',        pos: 'MEI', rating: 79 }, { name: 'Jensen',        pos: 'MEI', rating: 73 },
    { name: 'Wright',        pos: 'ATA', rating: 83 }, { name: 'Campbell',     pos: 'ATA', rating: 76 }, { name: 'Limpar',        pos: 'ATA', rating: 77 },
  ],
  // c12 - Inter
  [
    { name: 'Pagliuca',      pos: 'GOL', rating: 83 }, { name: 'Zenga',        pos: 'GOL', rating: 71 },
    { name: 'Bergomi',       pos: 'ZAG', rating: 83 }, { name: 'Paganin',      pos: 'ZAG', rating: 76 }, { name: 'Battistini',    pos: 'ZAG', rating: 73 },
    { name: 'Brehme',        pos: 'LAT', rating: 82 }, { name: 'Fontolan',     pos: 'LAT', rating: 70 },
    { name: 'Simeone',       pos: 'MEI', rating: 80 }, { name: 'Jonk',         pos: 'MEI', rating: 79 }, { name: 'Berti',         pos: 'MEI', rating: 76 }, { name: 'Orlandini',     pos: 'MEI', rating: 71 },
    { name: 'Ruben Sosa',    pos: 'ATA', rating: 81 }, { name: 'Skuhravý',     pos: 'ATA', rating: 78 }, { name: 'Rambert',       pos: 'ATA', rating: 72 },
  ],
  // c13 - Atlético (Madrid)
  [
    { name: 'Abel',          pos: 'GOL', rating: 78 }, { name: 'Molina',       pos: 'GOL', rating: 65 },
    { name: 'Solozábal',     pos: 'ZAG', rating: 77 }, { name: 'Juanito',      pos: 'ZAG', rating: 75 }, { name: 'Geli',          pos: 'ZAG', rating: 72 },
    { name: 'Toni',          pos: 'LAT', rating: 75 }, { name: 'Ferreira',     pos: 'LAT', rating: 70 },
    { name: 'Caminero',      pos: 'MEI', rating: 82 }, { name: 'Donato',       pos: 'MEI', rating: 78 }, { name: 'Vizcaíno',      pos: 'MEI', rating: 74 }, { name: 'Alfaro',        pos: 'MEI', rating: 70 },
    { name: 'Futre',         pos: 'ATA', rating: 82 }, { name: 'Manolo',       pos: 'ATA', rating: 78 }, { name: 'Dertycia',      pos: 'ATA', rating: 71 },
  ],
  // c14 - São Paulo
  [
    { name: 'Zetti',         pos: 'GOL', rating: 80 }, { name: 'Gilmar Rinaldi',pos: 'GOL', rating: 64 },
    { name: 'Adílson',       pos: 'ZAG', rating: 78 }, { name: 'Gilmar',       pos: 'ZAG', rating: 76 }, { name: 'Antônio Carlos',pos: 'ZAG', rating: 72 },
    { name: 'Cafu',          pos: 'LAT', rating: 80 }, { name: 'Leonardo',     pos: 'LAT', rating: 79 },
    { name: 'Raí',           pos: 'MEI', rating: 84 }, { name: 'Cerezo',       pos: 'MEI', rating: 74 }, { name: 'Mauro Silva',   pos: 'MEI', rating: 77 }, { name: 'Dinho',         pos: 'MEI', rating: 70 },
    { name: 'Müller',        pos: 'ATA', rating: 82 }, { name: 'Caio',         pos: 'ATA', rating: 75 }, { name: 'Palhinha',      pos: 'ATA', rating: 70 },
  ],
  // c15 - Boca Juniors
  [
    { name: 'Navarro Montoya',pos: 'GOL', rating: 80 }, { name: 'Zelada',      pos: 'GOL', rating: 65 },
    { name: 'Ruggeri',       pos: 'ZAG', rating: 81 }, { name: 'Maciel',       pos: 'ZAG', rating: 77 }, { name: 'Altamirano',    pos: 'ZAG', rating: 73 },
    { name: 'Saldaña',       pos: 'LAT', rating: 75 }, { name: 'Vivas',        pos: 'LAT', rating: 71 },
    { name: 'Verón',         pos: 'MEI', rating: 78 }, { name: 'Balbo',        pos: 'MEI', rating: 75 }, { name: 'Burruchaga',    pos: 'MEI', rating: 77 }, { name: 'Gracián',       pos: 'MEI', rating: 70 },
    { name: 'Latorre',       pos: 'ATA', rating: 79 }, { name: 'Palermo',      pos: 'ATA', rating: 76 }, { name: 'Caniggia',      pos: 'ATA', rating: 82 },
  ],
  // c16 - River Plate
  [
    { name: 'Burgos',        pos: 'GOL', rating: 79 }, { name: 'Carreras',     pos: 'GOL', rating: 64 },
    { name: 'Sensini',       pos: 'ZAG', rating: 80 }, { name: 'Zapata',       pos: 'ZAG', rating: 76 }, { name: 'Hernández',     pos: 'ZAG', rating: 72 },
    { name: 'Sorin',         pos: 'LAT', rating: 74 }, { name: 'Morales',      pos: 'LAT', rating: 70 },
    { name: 'Francescoli',   pos: 'MEI', rating: 83 }, { name: 'Gallardo',     pos: 'MEI', rating: 77 }, { name: 'Ortega',        pos: 'MEI', rating: 76 }, { name: 'Rambert',       pos: 'MEI', rating: 70 },
    { name: 'Salas',         pos: 'ATA', rating: 78 }, { name: 'Palma',        pos: 'ATA', rating: 74 }, { name: 'Crespo',        pos: 'ATA', rating: 72 },
  ],
  // c17 - Flamengo
  [
    { name: 'Gilmar Fonseca',pos: 'GOL', rating: 76 }, { name: 'Leandro Corrêa',pos: 'GOL', rating: 62 },
    { name: 'Carlos Mozer',  pos: 'ZAG', rating: 75 }, { name: 'André Cruz',   pos: 'ZAG', rating: 72 }, { name: 'Nonato',        pos: 'ZAG', rating: 68 },
    { name: 'Jorginho',      pos: 'LAT', rating: 74 }, { name: 'Leandro',      pos: 'LAT', rating: 70 },
    { name: 'Tita',          pos: 'MEI', rating: 77 }, { name: 'Geovani',      pos: 'MEI', rating: 76 }, { name: 'Livramento',    pos: 'MEI', rating: 73 }, { name: 'Marquinhos',    pos: 'MEI', rating: 68 },
    { name: 'Gaúcho',        pos: 'ATA', rating: 78 }, { name: 'Viola',        pos: 'ATA', rating: 74 }, { name: 'Renato',        pos: 'ATA', rating: 68 },
  ],
  // c18 - B. Dortmund
  [
    { name: 'Klos',          pos: 'GOL', rating: 79 }, { name: 'Krämer',       pos: 'GOL', rating: 64 },
    { name: 'Schulz',        pos: 'ZAG', rating: 77 }, { name: 'Reinhardt',    pos: 'ZAG', rating: 75 }, { name: 'Sandmann',      pos: 'ZAG', rating: 71 },
    { name: 'Heinrich',      pos: 'LAT', rating: 74 }, { name: 'Gruszecki',    pos: 'LAT', rating: 69 },
    { name: 'Zorc',          pos: 'MEI', rating: 80 }, { name: 'Reuter',       pos: 'MEI', rating: 78 }, { name: 'Tretschok',     pos: 'MEI', rating: 74 }, { name: 'Mill',          pos: 'MEI', rating: 72 },
    { name: 'Chapuisat',     pos: 'ATA', rating: 82 }, { name: 'Riedle',       pos: 'ATA', rating: 80 }, { name: 'Povlsen',       pos: 'ATA', rating: 74 },
  ],
  // c19 - Nacional (Uruguai)
  [
    { name: 'Dorado',        pos: 'GOL', rating: 74 }, { name: 'Montero',      pos: 'GOL', rating: 62 },
    { name: 'Herrera',       pos: 'ZAG', rating: 73 }, { name: 'Tejera',       pos: 'ZAG', rating: 71 }, { name: 'Gutiérrez',     pos: 'ZAG', rating: 67 },
    { name: 'Sosa',          pos: 'LAT', rating: 71 }, { name: 'Varela',       pos: 'LAT', rating: 67 },
    { name: 'Poyet',         pos: 'MEI', rating: 77 }, { name: 'Bengoechea',   pos: 'MEI', rating: 75 }, { name: 'De León',       pos: 'MEI', rating: 72 }, { name: 'Ostolaza',      pos: 'MEI', rating: 68 },
    { name: 'Recoba',        pos: 'ATA', rating: 76 }, { name: 'Zalayeta',     pos: 'ATA', rating: 73 }, { name: 'Perdomo',       pos: 'ATA', rating: 69 },
  ],

  // ── DIV 3 (forte regional + brasileiro de expressão) ──────────────
  // c20 - Grêmio
  [
    { name: 'Danrlei',       pos: 'GOL', rating: 68 }, { name: 'Paulo Victor', pos: 'GOL', rating: 55 },
    { name: 'Adaílton',      pos: 'ZAG', rating: 66 }, { name: 'Mauro Galvão', pos: 'ZAG', rating: 65 }, { name: 'Fonseca',       pos: 'ZAG', rating: 60 },
    { name: 'Paulo Roberto', pos: 'LAT', rating: 64 }, { name: 'Anderson',     pos: 'LAT', rating: 60 },
    { name: 'Alcindo',       pos: 'MEI', rating: 67 }, { name: 'Carpegiani',   pos: 'MEI', rating: 65 }, { name: 'Sandro',        pos: 'MEI', rating: 63 }, { name: 'Caio',          pos: 'MEI', rating: 60 },
    { name: 'Dario',         pos: 'ATA', rating: 68 }, { name: 'Luís Carlos',  pos: 'ATA', rating: 64 }, { name: 'Éder',          pos: 'ATA', rating: 59 },
  ],
  // c21 - Cruzeiro
  [
    { name: 'Paulo Becker',  pos: 'GOL', rating: 67 }, { name: 'Fábio Jr',     pos: 'GOL', rating: 54 },
    { name: 'Rildo',         pos: 'ZAG', rating: 66 }, { name: 'Henrique',     pos: 'ZAG', rating: 65 }, { name: 'Alex',          pos: 'ZAG', rating: 60 },
    { name: 'Branco',        pos: 'LAT', rating: 65 }, { name: 'Jorge Luís',   pos: 'LAT', rating: 60 },
    { name: 'Robinho',       pos: 'MEI', rating: 68 }, { name: 'Charles',      pos: 'MEI', rating: 65 }, { name: 'Liniker',       pos: 'MEI', rating: 62 }, { name: 'Cézar',         pos: 'MEI', rating: 59 },
    { name: 'Edmundo',       pos: 'ATA', rating: 69 }, { name: 'Éder Aleixo',  pos: 'ATA', rating: 65 }, { name: 'Evandro',       pos: 'ATA', rating: 59 },
  ],
  // c22 - Palmeiras
  [
    { name: 'Marcos',        pos: 'GOL', rating: 67 }, { name: 'Emerson',      pos: 'GOL', rating: 54 },
    { name: 'Antônio Carlos',pos: 'ZAG', rating: 67 }, { name: 'Adílson',      pos: 'ZAG', rating: 65 }, { name: 'Rodrigo',       pos: 'ZAG', rating: 61 },
    { name: 'Pedrão',        pos: 'LAT', rating: 64 }, { name: 'Zé Maria',     pos: 'LAT', rating: 60 },
    { name: 'Mazinho',       pos: 'MEI', rating: 69 }, { name: 'Zinho',        pos: 'MEI', rating: 68 }, { name: 'Everton',       pos: 'MEI', rating: 65 }, { name: 'Palhinha',      pos: 'MEI', rating: 62 },
    { name: 'Evair',         pos: 'ATA', rating: 70 }, { name: 'Paulo Nunes',  pos: 'ATA', rating: 66 }, { name: 'Rinaldo',       pos: 'ATA', rating: 59 },
  ],
  // c23 - Corinthians
  [
    { name: 'Ronaldo Giovanelli', pos: 'GOL', rating: 67 }, { name: 'Osmar',   pos: 'GOL', rating: 53 },
    { name: 'Tupãzinho',     pos: 'ZAG', rating: 65 }, { name: 'Jorge',        pos: 'ZAG', rating: 63 }, { name: 'Paulo Sérgio',  pos: 'ZAG', rating: 59 },
    { name: 'Sidnei',        pos: 'LAT', rating: 63 }, { name: 'Marcinho',     pos: 'LAT', rating: 59 },
    { name: 'Neto',          pos: 'MEI', rating: 68 }, { name: 'Rincón',       pos: 'MEI', rating: 67 }, { name: 'Mauro',         pos: 'MEI', rating: 64 }, { name: 'Caio',          pos: 'MEI', rating: 60 },
    { name: 'Dinei',         pos: 'ATA', rating: 67 }, { name: 'Hélio',        pos: 'ATA', rating: 63 }, { name: 'Gameiro',       pos: 'ATA', rating: 58 },
  ],
  // c24 - Celtic
  [
    { name: 'Bonner',        pos: 'GOL', rating: 63 }, { name: 'Marshall',     pos: 'GOL', rating: 51 },
    { name: 'Boyd',          pos: 'ZAG', rating: 62 }, { name: 'McNally',      pos: 'ZAG', rating: 60 }, { name: 'Whyte',         pos: 'ZAG', rating: 57 },
    { name: 'McKinlay',      pos: 'LAT', rating: 60 }, { name: 'Galloway',     pos: 'LAT', rating: 57 },
    { name: 'McStay',        pos: 'MEI', rating: 65 }, { name: 'Collins',      pos: 'MEI', rating: 63 }, { name: "O'Neil",        pos: 'MEI', rating: 60 }, { name: 'Wdowczyk',      pos: 'MEI', rating: 57 },
    { name: 'Nicholas',      pos: 'ATA', rating: 64 }, { name: 'Creaney',      pos: 'ATA', rating: 61 }, { name: 'Coyne',         pos: 'ATA', rating: 58 },
  ],
  // c25 - PSV
  [
    { name: 'De Goey',       pos: 'GOL', rating: 65 }, { name: 'Waterreus',    pos: 'GOL', rating: 52 },
    { name: 'Valckx',        pos: 'ZAG', rating: 65 }, { name: 'Heintze',      pos: 'ZAG', rating: 63 }, { name: 'Numan',         pos: 'ZAG', rating: 60 },
    { name: 'Van Aerle',     pos: 'LAT', rating: 63 }, { name: 'Bosman',       pos: 'LAT', rating: 59 },
    { name: 'Cocu',          pos: 'MEI', rating: 66 }, { name: 'Van Gobbel',   pos: 'MEI', rating: 63 }, { name: 'Luttenberg',    pos: 'MEI', rating: 60 }, { name: 'Kieft',         pos: 'MEI', rating: 61 },
    { name: 'Romário',       pos: 'ATA', rating: 72 }, { name: 'Nilis',        pos: 'ATA', rating: 66 }, { name: 'Jonk',          pos: 'ATA', rating: 63 },
  ],
  // c26 - Sevilla
  [
    { name: 'Jiménez',       pos: 'GOL', rating: 63 }, { name: 'Elosúa',       pos: 'GOL', rating: 51 },
    { name: 'Subirats',      pos: 'ZAG', rating: 63 }, { name: 'Monchu',       pos: 'ZAG', rating: 61 }, { name: 'Vales',         pos: 'ZAG', rating: 58 },
    { name: 'Carvajal',      pos: 'LAT', rating: 62 }, { name: 'Ferreira',     pos: 'LAT', rating: 58 },
    { name: 'Ramírez',       pos: 'MEI', rating: 65 }, { name: 'Casanova',     pos: 'MEI', rating: 63 }, { name: 'Solano',        pos: 'MEI', rating: 60 }, { name: 'Ufarte',        pos: 'MEI', rating: 57 },
    { name: 'Súker',         pos: 'ATA', rating: 70 }, { name: 'Maradona',     pos: 'ATA', rating: 69 }, { name: 'Rengifo',       pos: 'ATA', rating: 60 },
  ],
  // c27 - Independiente
  [
    { name: 'Islas',         pos: 'GOL', rating: 64 }, { name: 'Correa',       pos: 'GOL', rating: 51 },
    { name: 'Albornoz',      pos: 'ZAG', rating: 63 }, { name: 'Pavoni',       pos: 'ZAG', rating: 61 }, { name: 'Serrizuela',    pos: 'ZAG', rating: 57 },
    { name: 'Morales',       pos: 'LAT', rating: 62 }, { name: 'Ruiz',         pos: 'LAT', rating: 57 },
    { name: 'Navarro',       pos: 'MEI', rating: 65 }, { name: 'Acosta',       pos: 'MEI', rating: 63 }, { name: 'Fabbri',        pos: 'MEI', rating: 60 }, { name: 'Balcedo',       pos: 'MEI', rating: 57 },
    { name: 'Linguerri',     pos: 'ATA', rating: 65 }, { name: 'Méndez',       pos: 'ATA', rating: 62 }, { name: 'Ávalos',        pos: 'ATA', rating: 58 },
  ],
  // c28 - Santos
  [
    { name: 'Vander',        pos: 'GOL', rating: 62 }, { name: 'Osmar',        pos: 'GOL', rating: 50 },
    { name: 'Mauro',         pos: 'ZAG', rating: 62 }, { name: 'Fabinho',      pos: 'ZAG', rating: 60 }, { name: 'Sandro',        pos: 'ZAG', rating: 56 },
    { name: 'Waldir',        pos: 'LAT', rating: 60 }, { name: 'Jorge Luís',   pos: 'LAT', rating: 56 },
    { name: 'Diego',         pos: 'MEI', rating: 63 }, { name: 'Pedrinho',     pos: 'MEI', rating: 61 }, { name: 'Zequinha',      pos: 'MEI', rating: 58 }, { name: 'Márcio',        pos: 'MEI', rating: 55 },
    { name: 'Clodoaldo Jr',  pos: 'ATA', rating: 64 }, { name: 'Claudinho',    pos: 'ATA', rating: 60 }, { name: 'Sílvio',        pos: 'ATA', rating: 56 },
  ],
  // c29 - Estudiantes
  [
    { name: 'Vivaldo',       pos: 'GOL', rating: 62 }, { name: 'Ramírez',      pos: 'GOL', rating: 50 },
    { name: 'Domínguez',     pos: 'ZAG', rating: 62 }, { name: 'Ferrero',      pos: 'ZAG', rating: 60 }, { name: 'Ramos',         pos: 'ZAG', rating: 56 },
    { name: 'García',        pos: 'LAT', rating: 60 }, { name: 'Peralta',      pos: 'LAT', rating: 56 },
    { name: 'Verón',         pos: 'MEI', rating: 65 }, { name: 'Flores',       pos: 'MEI', rating: 62 }, { name: 'Montes',        pos: 'MEI', rating: 59 }, { name: 'Acuña',         pos: 'MEI', rating: 56 },
    { name: 'Medina',        pos: 'ATA', rating: 64 }, { name: 'Olivares',     pos: 'ATA', rating: 61 }, { name: 'Suárez',        pos: 'ATA', rating: 57 },
  ],

  // ── DIV 4 CPU (9 times; humanos completam os 10) ──────────────────
  // c30 - Internacional
  [
    { name: 'Cléber',        pos: 'GOL', rating: 54 }, { name: 'Emerson',      pos: 'GOL', rating: 43 },
    { name: 'Beto',          pos: 'ZAG', rating: 53 }, { name: 'Júnior',       pos: 'ZAG', rating: 51 }, { name: 'Wagner',        pos: 'ZAG', rating: 47 },
    { name: 'Rogério',       pos: 'LAT', rating: 51 }, { name: 'Sérgio',       pos: 'LAT', rating: 47 },
    { name: 'Giovane',       pos: 'MEI', rating: 55 }, { name: 'Fabinho',      pos: 'MEI', rating: 53 }, { name: 'Adriano',       pos: 'MEI', rating: 50 }, { name: 'Nelsinho',      pos: 'MEI', rating: 46 },
    { name: 'Jardel',        pos: 'ATA', rating: 56 }, { name: 'Leandro',      pos: 'ATA', rating: 52 }, { name: 'Marcos',        pos: 'ATA', rating: 47 },
  ],
  // c31 - Vasco
  [
    { name: 'Carlos Germano',pos: 'GOL', rating: 55 }, { name: 'Acácio',       pos: 'GOL', rating: 43 },
    { name: 'Odvan',         pos: 'ZAG', rating: 54 }, { name: 'Barros',       pos: 'ZAG', rating: 52 }, { name: 'Gilberto',      pos: 'ZAG', rating: 48 },
    { name: 'Luís Carlos',   pos: 'LAT', rating: 52 }, { name: 'Rodrigo',      pos: 'LAT', rating: 47 },
    { name: 'Ramón',         pos: 'MEI', rating: 56 }, { name: 'Felipe',       pos: 'MEI', rating: 54 }, { name: 'Sávio',         pos: 'MEI', rating: 53 }, { name: 'Anderson',      pos: 'MEI', rating: 47 },
    { name: 'Túlio',         pos: 'ATA', rating: 56 }, { name: 'Ademir',       pos: 'ATA', rating: 52 }, { name: 'Bebeto Jr',     pos: 'ATA', rating: 47 },
  ],
  // c32 - Botafogo
  [
    { name: 'Jefferson',     pos: 'GOL', rating: 53 }, { name: 'Dênis',        pos: 'GOL', rating: 42 },
    { name: 'Maurício',      pos: 'ZAG', rating: 52 }, { name: 'Alexandre',    pos: 'ZAG', rating: 50 }, { name: 'Lúcio',         pos: 'ZAG', rating: 46 },
    { name: 'Jailton',       pos: 'LAT', rating: 50 }, { name: 'Osmar',        pos: 'LAT', rating: 46 },
    { name: 'Souza',         pos: 'MEI', rating: 53 }, { name: 'Andrade',      pos: 'MEI', rating: 51 }, { name: 'Didi',          pos: 'MEI', rating: 49 }, { name: 'Marcus',        pos: 'MEI', rating: 45 },
    { name: 'Kléber',        pos: 'ATA', rating: 53 }, { name: 'Túlio',        pos: 'ATA', rating: 50 }, { name: 'Renato',        pos: 'ATA', rating: 45 },
  ],
  // c33 - Fluminense
  [
    { name: 'Paulo',         pos: 'GOL', rating: 53 }, { name: 'Élton',        pos: 'GOL', rating: 42 },
    { name: 'Cléber',        pos: 'ZAG', rating: 52 }, { name: 'Marcão',       pos: 'ZAG', rating: 50 }, { name: 'Robson',        pos: 'ZAG', rating: 46 },
    { name: 'Renato',        pos: 'LAT', rating: 50 }, { name: 'Gilvan',       pos: 'LAT', rating: 45 },
    { name: 'Zinho',         pos: 'MEI', rating: 56 }, { name: 'Carlos',       pos: 'MEI', rating: 52 }, { name: 'Lula',          pos: 'MEI', rating: 49 }, { name: 'Nelsinho',      pos: 'MEI', rating: 45 },
    { name: 'Bebeto',        pos: 'ATA', rating: 53 }, { name: 'Claudinho',    pos: 'ATA', rating: 49 }, { name: 'Marcinho',      pos: 'ATA', rating: 45 },
  ],
  // c34 - Olimpia (Paraguai)
  [
    { name: 'Chilavert',     pos: 'GOL', rating: 56 }, { name: 'Fernández',    pos: 'GOL', rating: 44 },
    { name: 'Ayala',         pos: 'ZAG', rating: 54 }, { name: 'Sarabia',      pos: 'ZAG', rating: 52 }, { name: 'Genes',         pos: 'ZAG', rating: 48 },
    { name: 'Campos',        pos: 'LAT', rating: 52 }, { name: 'Ortiz',        pos: 'LAT', rating: 47 },
    { name: 'Cardozo',       pos: 'MEI', rating: 56 }, { name: 'Enciso',       pos: 'MEI', rating: 53 }, { name: 'Barreto',       pos: 'MEI', rating: 50 }, { name: 'Delgado',       pos: 'MEI', rating: 46 },
    { name: 'Romerito',      pos: 'ATA', rating: 55 }, { name: 'Cabañas',      pos: 'ATA', rating: 52 }, { name: 'Morínigo',      pos: 'ATA', rating: 47 },
  ],
  // c35 - Cruz Azul (México)
  [
    { name: 'Hernández',     pos: 'GOL', rating: 52 }, { name: 'Ríos',         pos: 'GOL', rating: 41 },
    { name: 'Reynoso',       pos: 'ZAG', rating: 52 }, { name: 'Montoya',      pos: 'ZAG', rating: 50 }, { name: 'Velarde',       pos: 'ZAG', rating: 46 },
    { name: 'García',        pos: 'LAT', rating: 50 }, { name: 'Contreras',    pos: 'LAT', rating: 45 },
    { name: 'Berizzo',       pos: 'MEI', rating: 54 }, { name: 'Galindo',      pos: 'MEI', rating: 52 }, { name: 'Palacios',      pos: 'MEI', rating: 49 }, { name: 'Luna',          pos: 'MEI', rating: 45 },
    { name: 'Brambila',      pos: 'ATA', rating: 53 }, { name: 'Torres',       pos: 'ATA', rating: 50 }, { name: 'Cárdenas',      pos: 'ATA', rating: 45 },
  ],
  // c36 - Colo-Colo (Chile)
  [
    { name: 'Tapia',         pos: 'GOL', rating: 52 }, { name: 'Espinoza',     pos: 'GOL', rating: 41 },
    { name: 'Reyes',         pos: 'ZAG', rating: 52 }, { name: 'Villarroel',   pos: 'ZAG', rating: 50 }, { name: 'Acuña',         pos: 'ZAG', rating: 46 },
    { name: 'Ramírez',       pos: 'LAT', rating: 50 }, { name: 'Olguín',       pos: 'LAT', rating: 45 },
    { name: 'Fouilloux',     pos: 'MEI', rating: 53 }, { name: 'Vilches',      pos: 'MEI', rating: 51 }, { name: 'Martel',        pos: 'MEI', rating: 48 }, { name: 'Cornejo',       pos: 'MEI', rating: 44 },
    { name: 'Barticciotto',  pos: 'ATA', rating: 54 }, { name: 'Covarrubias',  pos: 'ATA', rating: 51 }, { name: 'Salas',         pos: 'ATA', rating: 49 },
  ],
  // c37 - Peñarol (Uruguai)
  [
    { name: 'Zeballos',      pos: 'GOL', rating: 51 }, { name: 'Pereira',      pos: 'GOL', rating: 41 },
    { name: 'Ramos',         pos: 'ZAG', rating: 51 }, { name: 'Gutiérrez',    pos: 'ZAG', rating: 49 }, { name: 'De León',       pos: 'ZAG', rating: 46 },
    { name: 'González',      pos: 'LAT', rating: 49 }, { name: 'Herrera',      pos: 'LAT', rating: 44 },
    { name: 'Silva',         pos: 'MEI', rating: 53 }, { name: 'Fonseca',      pos: 'MEI', rating: 51 }, { name: 'Abreu',         pos: 'MEI', rating: 49 }, { name: 'Morales',       pos: 'MEI', rating: 44 },
    { name: 'Recoba',        pos: 'ATA', rating: 53 }, { name: 'Saralegui',    pos: 'ATA', rating: 50 }, { name: 'Perdomo',       pos: 'ATA', rating: 45 },
  ],
  // c38 - América (México)
  [
    { name: 'Campos',        pos: 'GOL', rating: 51 }, { name: 'Lara',         pos: 'GOL', rating: 41 },
    { name: 'Suárez',        pos: 'ZAG', rating: 51 }, { name: 'Galindo',      pos: 'ZAG', rating: 49 }, { name: 'Mendoza',       pos: 'ZAG', rating: 45 },
    { name: 'López',         pos: 'LAT', rating: 49 }, { name: 'Muñoz',        pos: 'LAT', rating: 44 },
    { name: 'Bernal',        pos: 'MEI', rating: 53 }, { name: 'Reynoso',      pos: 'MEI', rating: 51 }, { name: 'Valdés',        pos: 'MEI', rating: 49 }, { name: 'Patiño',        pos: 'MEI', rating: 44 },
    { name: 'Hermosillo',    pos: 'ATA', rating: 54 }, { name: 'Álvarez',      pos: 'ATA', rating: 51 }, { name: 'Dely Valdés',   pos: 'ATA', rating: 49 },
  ],
]

// Extra bench players generated from era-appropriate name pools
const BENCH_FIRSTS = [
  'Wagner', 'Edson', 'Carlos', 'Adílson', 'Reinaldo', 'Cláudio', 'Jair', 'Nílton',
  'Márcio', 'Willian', 'Felipe', 'Douglas', 'Alessandro', 'Fábio', 'Robson',
]
const BENCH_LASTS = [
  'Neto', 'Filho', 'Júnior', 'Sousa', 'Lima', 'Santos', 'Silva', 'Costa', 'Pereira',
  'Rodrigues', 'Ferreira', 'Alves', 'Carvalho', 'Gomes', 'Araújo',
]
const FILL_POS: Position[] = ['GOL', 'ZAG', 'ZAG', 'LAT', 'MEI', 'MEI', 'ATA', 'ATA', 'ZAG', 'MEI', 'ATA', 'MEI', 'LAT']

function seededPick<T>(arr: T[], seed: number): T {
  return arr[(seed * 7 + 13) % arr.length]
}

function benchName(cpuIdx: number, i: number): string {
  const seed = cpuIdx * 100 + i
  return `${seededPick(BENCH_FIRSTS, seed)} ${seededPick(BENCH_LASTS, seed + 37)}`
}

const DIV_RATINGS: Record<number, number[]> = {
  1: [67, 65, 63, 61, 59, 58, 57, 56, 55, 54, 53, 52, 51],
  2: [57, 55, 53, 51, 49, 48, 47, 46, 45, 44, 43, 42, 41],
  3: [47, 45, 43, 41, 39, 38, 37, 36, 35, 34, 33, 32, 31],
  4: [39, 37, 35, 33, 31, 30, 29, 28, 27, 26, 25, 24, 23],
}

function seededAge(seed: number, min: number, max: number): number {
  return min + (seed * 13 + 7) % (max - min + 1)
}

export function getCpuSquad(cpuIndex: number, division: number): DraftPlayer[] {
  const keys = KEYS[cpuIndex] ?? []
  const result: DraftPlayer[] = keys.map((p, i) => ({
    id: `cpu-${cpuIndex}-${i}`,
    name: p.name,
    pos: p.pos,
    rating: p.rating,
    nationality: 'BR' as const,
    age: seededAge(cpuIndex * 20 + i, 20, 33),
  }))

  const ratings = DIV_RATINGS[division] ?? DIV_RATINGS[4]
  const needed = FILL_POS.slice(0, Math.max(0, 27 - keys.length))
  needed.forEach((pos, i) => {
    result.push({
      id: `cpu-${cpuIndex}-${keys.length + i}`,
      name: benchName(cpuIndex, i),
      pos,
      rating: ratings[i % ratings.length] ?? 30,
      nationality: 'BR' as const,
      age: seededAge(cpuIndex * 20 + keys.length + i + 50, 18, 34),
    })
  })

  return result
}
