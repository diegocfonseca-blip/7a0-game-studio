import type { Persona } from './cpu'

// ── Famous games for Modo História ───────────────────────────────────────
// Moves in SAN, validated against chess.js at build time (see scripts).

export interface FamousGame {
  id: string
  titulo: string
  brancas: string
  pretas: string
  ano: number
  local: string
  resultado: '1-0' | '0-1' | '1/2-1/2'
  historia: string        // the story, in Portuguese
  heroi: 'w' | 'b'        // which side you play in "mudar a história"
  vilaoPersona: Persona   // engine personality for the opponent
  sans: string[]
}

export const FAMOUS_GAMES: FamousGame[] = [
  {
    id: 'opera',
    titulo: 'A Partida da Ópera',
    brancas: 'Paul Morphy', pretas: 'Duque de Brunswick e Conde Isouard',
    ano: 1858, local: 'Ópera de Paris',
    resultado: '1-0', heroi: 'w', vilaoPersona: 'capablanca',
    historia: 'Morphy foi à ópera assistir "Norma". O Duque e o Conde o desafiaram no camarote — e ele deu uma aula de desenvolvimento e sacrifício enquanto a ópera rolava. A partida mais famosa da história do xadrez casual.',
    sans: ['e4','e5','Nf3','d6','d4','Bg4','dxe5','Bxf3','Qxf3','dxe5','Bc4','Nf6','Qb3','Qe7','Nc3','c6','Bg5','b5','Nxb5','cxb5','Bxb5+','Nbd7','O-O-O','Rd8','Rxd7','Rxd7','Rd1','Qe6','Bxd7+','Nxd7','Qb8+','Nxb8','Rd8#'],
  },
  {
    id: 'immortal',
    titulo: 'A Imortal',
    brancas: 'Adolf Anderssen', pretas: 'Lionel Kieseritzky',
    ano: 1851, local: 'Londres',
    resultado: '1-0', heroi: 'w', vilaoPersona: 'tal',
    historia: 'Anderssen sacrifica um bispo, as duas torres E a dama — e dá mate com as três peças menores que sobraram. Jogada num café, entre rodadas do primeiro torneio internacional da história. Simplesmente "A Imortal".',
    sans: ['e4','e5','f4','exf4','Bc4','Qh4+','Kf1','b5','Bxb5','Nf6','Nf3','Qh6','d3','Nh5','Nh4','Qg5','Nf5','c6','g4','Nf6','Rg1','cxb5','h4','Qg6','h5','Qg5','Qf3','Ng8','Bxf4','Qf6','Nc3','Bc5','Nd5','Qxb2','Bd6','Bxg1','e5','Qxa1+','Ke2','Na6','Nxg7+','Kd8','Qf6+','Nxf6','Be7#'],
  },
  {
    id: 'evergreen',
    titulo: 'A Sempre-Viva',
    brancas: 'Adolf Anderssen', pretas: 'Jean Dufresne',
    ano: 1852, local: 'Berlim',
    resultado: '1-0', heroi: 'w', vilaoPersona: 'kasparov',
    historia: 'Um ano depois da Imortal, Anderssen fez de novo. O lance 19.Rad1 é considerado um dos mais profundos já jogados — prepara uma combinação de mate que só estoura quatro lances depois.',
    sans: ['e4','e5','Nf3','Nc6','Bc4','Bc5','b4','Bxb4','c3','Ba5','d4','exd4','O-O','d3','Qb3','Qf6','e5','Qg6','Re1','Nge7','Ba3','b5','Qxb5','Rb8','Qa4','Bb6','Nbd2','Bb7','Ne4','Qf5','Bxd3','Qh5','Nf6+','gxf6','exf6','Rg8','Rad1','Qxf3','Rxe7+','Nxe7','Qxd7+','Kxd7','Bf5+','Ke8','Bd7+','Kf8','Bxe7#'],
  },
  {
    id: 'century',
    titulo: 'A Partida do Século',
    brancas: 'Donald Byrne', pretas: 'Bobby Fischer',
    ano: 1956, local: 'Nova York',
    resultado: '0-1', heroi: 'b', vilaoPersona: 'capablanca',
    historia: 'Fischer tinha 13 ANOS. Sacrificou a dama no lance 17 contra um dos melhores dos EUA — e provou que o sacrifício era perfeitamente correto, terminando com uma rede de mate implacável. O mundo conheceu o futuro campeão.',
    sans: ['Nf3','Nf6','c4','g6','Nc3','Bg7','d4','O-O','Bf4','d5','Qb3','dxc4','Qxc4','c6','e4','Nbd7','Rd1','Nb6','Qc5','Bg4','Bg5','Na4','Qa3','Nxc3','bxc3','Nxe4','Bxe7','Qb6','Bc4','Nxc3','Bc5','Rfe8+','Kf1','Be6','Bxb6','Bxc4+','Kg1','Ne2+','Kf1','Nxd4+','Kg1','Ne2+','Kf1','Nc3+','Kg1','axb6','Qb4','Ra4','Qxb6','Nxd1','h3','Rxa2','Kh2','Nxf2','Re1','Rxe1','Qd8+','Bf8','Nxe1','Bd5','Nf3','Ne4','Qb8','b5','h4','h5','Ne5','Kg7','Kg1','Bc5+','Kf1','Ng3+','Ke1','Bb4+','Kd1','Bb3+','Kc1','Ne2+','Kb1','Nc3+','Kc1','Rc2#'],
  },
  {
    id: 'fischer-spassky6',
    titulo: 'Fischer x Spassky — Partida 6',
    brancas: 'Bobby Fischer', pretas: 'Boris Spassky',
    ano: 1972, local: 'Reykjavik, Mundial',
    resultado: '1-0', heroi: 'w', vilaoPersona: 'carlsen',
    historia: 'O "Match do Século", em plena Guerra Fria. Fischer abriu com 1.c4 — que ele quase nunca jogava — e produziu uma obra-prima tão limpa que o próprio Spassky se levantou e APLAUDIU o rival. EUA x URSS no tabuleiro.',
    sans: ['c4','e6','Nf3','d5','d4','Nf6','Nc3','Be7','Bg5','O-O','e3','h6','Bh4','b6','cxd5','Nxd5','Bxe7','Qxe7','Nxd5','exd5','Rc1','Be6','Qa4','c5','Qa3','Rc8','Bb5','a6','dxc5','bxc5','O-O','Ra7','Be2','Nd7','Nd4','Qf8','Nxe6','fxe6','e4','d4','f4','Qe7','e5','Rb8','Bc4','Kh8','Qh3','Nf8','b3','a5','f5','exf5','Rxf5','Nh7','Rcf1','Qd8','Qg3','Re7','h4','Rbb7','e6','Rbc7','Qe5','Qe8','a4','Qd8','R1f2','Qe8','R2f3','Qd8','Bd3','Qe8','Qe4','Nf6','Rxf6','gxf6','Rxf6','Kg8','Bc4','Kh8','Qf4'],
  },
  {
    id: 'kasparov-topalov',
    titulo: 'A Imortal de Kasparov',
    brancas: 'Garry Kasparov', pretas: 'Veselin Topalov',
    ano: 1999, local: 'Wijk aan Zee',
    resultado: '1-0', heroi: 'w', vilaoPersona: 'tal',
    historia: 'O rei preto de Topalov saiu de b8... e atravessou O TABULEIRO INTEIRO perseguido pelas peças de Kasparov, numa combinação de mais de 15 lances calculada de cabeça. Considerada por muitos a maior partida já jogada.',
    sans: ['e4','d6','d4','Nf6','Nc3','g6','Be3','Bg7','Qd2','c6','f3','b5','Nge2','Nbd7','Bh6','Bxh6','Qxh6','Bb7','a3','e5','O-O-O','Qe7','Kb1','a6','Nc1','O-O-O','Nb3','exd4','Rxd4','c5','Rd1','Nb6','g3','Kb8','Na5','Ba8','Bh3','d5','Qf4+','Ka7','Rhe1','d4','Nd5','Nbxd5','exd5','Qd6','Rxd4','cxd4','Re7+','Kb6','Qxd4+','Kxa5','b4+','Ka4','Qc3','Qxd5','Ra7','Bb7','Rxb7','Qc4','Qxf6','Kxa3','Qxa6+','Kxb4','c3+','Kxc3','Qa1+','Kd2','Qb2+','Kd1','Bf1','Rd2','Rd7','Rxd7','Bxc4','bxc4','Qxh8','Rd3','Qa8','c3','Qa4+','Ke1','f4','f5','Kc1','Rd2','Qa7'],
  },
]
