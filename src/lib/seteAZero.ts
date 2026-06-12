// Curated dataset for the Sete a Zero game
// Player ratings are subjective tribute numbers (70-99).

export type Pos = "GK" | "RB" | "CB" | "LB" | "DM" | "CM" | "AM" | "RW" | "LW" | "ST";

export interface Player {
  name: string;
  pos: Pos[];
  rating: number;
}

export interface Squad {
  team: string;
  flag: string;
  cup: number;
  players: Player[];
}

export type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";
export type Style = "Defensivo" | "Equilibrado" | "Ofensivo";

export const FORMATIONS: Record<Formation, Pos[]> = {
  "4-3-3":   ["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],
  "4-4-2":   ["GK","RB","CB","CB","LB","CM","CM","RW","LW","ST","ST"],
  "4-2-3-1": ["GK","RB","CB","CB","LB","DM","DM","AM","RW","LW","ST"],
  "3-5-2":   ["GK","CB","CB","CB","RW","CM","CM","CM","LW","ST","ST"],
  "5-3-2":   ["GK","RB","CB","CB","CB","LB","CM","CM","CM","ST","ST"],
};

// Position coordinates on a vertical pitch (0-100 each). Index matches FORMATIONS order.
export const FORMATION_COORDS: Record<Formation, [number, number][]> = {
  "4-3-3":   [[50,92],[82,75],[62,78],[38,78],[18,75],[50,55],[30,55],[70,55],[78,28],[50,18],[22,28]],
  "4-4-2":   [[50,92],[82,75],[62,78],[38,78],[18,75],[70,50],[30,50],[82,32],[18,32],[60,15],[40,15]],
  "4-2-3-1": [[50,92],[82,75],[62,78],[38,78],[18,75],[62,60],[38,60],[50,38],[78,32],[22,32],[50,15]],
  "3-5-2":   [[50,92],[68,78],[50,80],[32,78],[88,52],[62,55],[38,55],[12,52],[50,38],[60,18],[40,18]],
  "5-3-2":   [[50,92],[88,72],[68,78],[50,80],[32,78],[12,72],[50,52],[28,55],[72,55],[60,20],[40,20]],
};

export const STYLE_MULT: Record<Style, { atk: number; def: number }> = {
  Defensivo:    { atk: 0.92, def: 1.10 },
  Equilibrado:  { atk: 1.00, def: 1.00 },
  Ofensivo:     { atk: 1.10, def: 0.90 },
};

// Tiny but flavorful dataset. Each (team, cup) lists ~14-18 players for the slots.
export const SQUADS: Squad[] = [
  {
    team: "Brasil", flag: "🇧🇷", cup: 1970,
    players: [
      { name: "Félix", pos: ["GK"], rating: 78 },
      { name: "Carlos Alberto", pos: ["RB"], rating: 94 },
      { name: "Brito", pos: ["CB"], rating: 82 },
      { name: "Piazza", pos: ["CB","DM"], rating: 84 },
      { name: "Everaldo", pos: ["LB"], rating: 80 },
      { name: "Clodoaldo", pos: ["DM","CM"], rating: 86 },
      { name: "Gérson", pos: ["CM","AM"], rating: 91 },
      { name: "Rivellino", pos: ["AM","LW"], rating: 92 },
      { name: "Jairzinho", pos: ["RW","ST"], rating: 93 },
      { name: "Pelé", pos: ["AM","ST"], rating: 99 },
      { name: "Tostão", pos: ["ST","AM"], rating: 91 },
      { name: "Paulo César", pos: ["LW","AM"], rating: 84 },
      { name: "Roberto Miranda", pos: ["ST"], rating: 80 },
      { name: "Marco Antônio", pos: ["LB"], rating: 79 },
    ],
  },
  {
    team: "Brasil", flag: "🇧🇷", cup: 2002,
    players: [
      { name: "Marcos", pos: ["GK"], rating: 86 },
      { name: "Cafu", pos: ["RB","RW"], rating: 92 },
      { name: "Lúcio", pos: ["CB"], rating: 88 },
      { name: "Roque Júnior", pos: ["CB"], rating: 82 },
      { name: "Roberto Carlos", pos: ["LB","LW"], rating: 92 },
      { name: "Gilberto Silva", pos: ["DM","CM"], rating: 85 },
      { name: "Kléberson", pos: ["CM","DM"], rating: 80 },
      { name: "Juninho Paulista", pos: ["AM","CM"], rating: 82 },
      { name: "Ronaldinho", pos: ["AM","LW"], rating: 92 },
      { name: "Rivaldo", pos: ["AM","ST","LW"], rating: 92 },
      { name: "Ronaldo", pos: ["ST"], rating: 96 },
      { name: "Edmílson", pos: ["CB","DM"], rating: 82 },
      { name: "Denílson", pos: ["LW","RW"], rating: 80 },
      { name: "Edílson", pos: ["RW","ST"], rating: 79 },
    ],
  },
  {
    team: "Brasil", flag: "🇧🇷", cup: 2022,
    players: [
      { name: "Alisson", pos: ["GK"], rating: 92 },
      { name: "Danilo", pos: ["RB","LB","CB"], rating: 83 },
      { name: "Marquinhos", pos: ["CB"], rating: 90 },
      { name: "Thiago Silva", pos: ["CB"], rating: 87 },
      { name: "Alex Sandro", pos: ["LB"], rating: 82 },
      { name: "Casemiro", pos: ["DM","CM"], rating: 90 },
      { name: "Lucas Paquetá", pos: ["CM","AM"], rating: 83 },
      { name: "Bruno Guimarães", pos: ["CM","DM"], rating: 84 },
      { name: "Neymar", pos: ["AM","LW","ST"], rating: 93 },
      { name: "Raphinha", pos: ["RW","AM"], rating: 84 },
      { name: "Vinícius Jr.", pos: ["LW","ST"], rating: 89 },
      { name: "Richarlison", pos: ["ST","LW"], rating: 84 },
      { name: "Rodrygo", pos: ["RW","LW","AM"], rating: 84 },
      { name: "Antony", pos: ["RW"], rating: 80 },
      { name: "Fred", pos: ["CM","DM"], rating: 78 },
    ],
  },
  {
    team: "Argentina", flag: "🇦🇷", cup: 1986,
    players: [
      { name: "Pumpido", pos: ["GK"], rating: 80 },
      { name: "Cuciuffo", pos: ["RB","CB"], rating: 78 },
      { name: "Brown", pos: ["CB"], rating: 84 },
      { name: "Ruggeri", pos: ["CB"], rating: 85 },
      { name: "Garré", pos: ["LB"], rating: 77 },
      { name: "Batista", pos: ["DM","CM"], rating: 82 },
      { name: "Giusti", pos: ["CM","DM"], rating: 81 },
      { name: "Burruchaga", pos: ["AM","CM"], rating: 86 },
      { name: "Maradona", pos: ["AM","LW","ST"], rating: 99 },
      { name: "Valdano", pos: ["ST","LW"], rating: 87 },
      { name: "Enrique", pos: ["CM","AM"], rating: 80 },
      { name: "Olarticoechea", pos: ["LB","LW"], rating: 79 },
      { name: "Pasculli", pos: ["ST","RW"], rating: 78 },
    ],
  },
  {
    team: "Argentina", flag: "🇦🇷", cup: 2022,
    players: [
      { name: "Emiliano Martínez", pos: ["GK"], rating: 90 },
      { name: "Molina", pos: ["RB"], rating: 82 },
      { name: "Cuti Romero", pos: ["CB"], rating: 87 },
      { name: "Otamendi", pos: ["CB"], rating: 84 },
      { name: "Tagliafico", pos: ["LB"], rating: 80 },
      { name: "Acuña", pos: ["LB","LW"], rating: 82 },
      { name: "De Paul", pos: ["CM","AM"], rating: 86 },
      { name: "Enzo Fernández", pos: ["CM","DM"], rating: 86 },
      { name: "Mac Allister", pos: ["CM","AM"], rating: 85 },
      { name: "Messi", pos: ["AM","RW","ST"], rating: 98 },
      { name: "Julián Álvarez", pos: ["ST","AM"], rating: 86 },
      { name: "Di María", pos: ["RW","LW","AM"], rating: 87 },
      { name: "Lautaro Martínez", pos: ["ST"], rating: 85 },
      { name: "Paredes", pos: ["DM","CM"], rating: 81 },
    ],
  },
  {
    team: "Alemanha", flag: "🇩🇪", cup: 2014,
    players: [
      { name: "Neuer", pos: ["GK"], rating: 95 },
      { name: "Lahm", pos: ["RB","DM","CM"], rating: 91 },
      { name: "Boateng", pos: ["CB"], rating: 87 },
      { name: "Hummels", pos: ["CB"], rating: 88 },
      { name: "Höwedes", pos: ["LB","CB"], rating: 80 },
      { name: "Schweinsteiger", pos: ["DM","CM"], rating: 90 },
      { name: "Khedira", pos: ["CM","DM"], rating: 85 },
      { name: "Kroos", pos: ["CM","AM"], rating: 91 },
      { name: "Özil", pos: ["AM","LW"], rating: 87 },
      { name: "Müller", pos: ["RW","ST","AM"], rating: 90 },
      { name: "Klose", pos: ["ST"], rating: 86 },
      { name: "Götze", pos: ["AM","ST"], rating: 84 },
      { name: "Schürrle", pos: ["LW","RW","ST"], rating: 82 },
      { name: "Podolski", pos: ["LW","ST"], rating: 81 },
    ],
  },
  {
    team: "França", flag: "🇫🇷", cup: 1998,
    players: [
      { name: "Barthez", pos: ["GK"], rating: 86 },
      { name: "Thuram", pos: ["RB","CB"], rating: 89 },
      { name: "Blanc", pos: ["CB"], rating: 87 },
      { name: "Desailly", pos: ["CB","DM"], rating: 89 },
      { name: "Lizarazu", pos: ["LB"], rating: 85 },
      { name: "Deschamps", pos: ["DM","CM"], rating: 84 },
      { name: "Petit", pos: ["DM","CM"], rating: 83 },
      { name: "Zidane", pos: ["AM","CM"], rating: 96 },
      { name: "Djorkaeff", pos: ["AM","RW"], rating: 86 },
      { name: "Henry", pos: ["LW","ST"], rating: 88 },
      { name: "Guivarc'h", pos: ["ST"], rating: 76 },
      { name: "Dugarry", pos: ["ST","RW"], rating: 78 },
      { name: "Karembeu", pos: ["RB","CM"], rating: 80 },
      { name: "Trezeguet", pos: ["ST"], rating: 84 },
    ],
  },
  {
    team: "França", flag: "🇫🇷", cup: 2022,
    players: [
      { name: "Lloris", pos: ["GK"], rating: 86 },
      { name: "Koundé", pos: ["RB","CB"], rating: 85 },
      { name: "Varane", pos: ["CB"], rating: 86 },
      { name: "Upamecano", pos: ["CB"], rating: 84 },
      { name: "Theo Hernández", pos: ["LB"], rating: 86 },
      { name: "Tchouaméni", pos: ["DM","CM"], rating: 85 },
      { name: "Rabiot", pos: ["CM","DM"], rating: 82 },
      { name: "Griezmann", pos: ["AM","CM","RW"], rating: 89 },
      { name: "Mbappé", pos: ["LW","ST","RW"], rating: 95 },
      { name: "Giroud", pos: ["ST"], rating: 83 },
      { name: "Dembélé", pos: ["RW","LW"], rating: 84 },
      { name: "Coman", pos: ["RW","LW"], rating: 82 },
      { name: "Thuram", pos: ["ST","LW"], rating: 80 },
      { name: "Camavinga", pos: ["DM","CM","LB"], rating: 82 },
    ],
  },
  {
    team: "Itália", flag: "🇮🇹", cup: 1982,
    players: [
      { name: "Zoff", pos: ["GK"], rating: 92 },
      { name: "Bergomi", pos: ["RB","CB"], rating: 83 },
      { name: "Gentile", pos: ["CB","RB"], rating: 86 },
      { name: "Collovati", pos: ["CB"], rating: 80 },
      { name: "Scirea", pos: ["CB","DM"], rating: 90 },
      { name: "Cabrini", pos: ["LB"], rating: 84 },
      { name: "Tardelli", pos: ["CM","AM"], rating: 88 },
      { name: "Oriali", pos: ["DM","CM"], rating: 80 },
      { name: "Antognoni", pos: ["AM","CM"], rating: 86 },
      { name: "Conti", pos: ["RW","AM"], rating: 84 },
      { name: "Rossi", pos: ["ST"], rating: 93 },
      { name: "Graziani", pos: ["ST"], rating: 80 },
      { name: "Altobelli", pos: ["ST"], rating: 82 },
    ],
  },
];

export const ALL_CUPS = Array.from(new Set(SQUADS.map(s => s.cup))).sort();
