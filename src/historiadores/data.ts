import type { HistCardData, QuestionKey } from './types'

const GP: QuestionKey[] = ['gols', 'jogos']
const GTA: QuestionKey[] = ['gols', 'titulos', 'assists']
const GT: QuestionKey[] = ['gols', 'titulos']
const TA: QuestionKey[] = ['titulos', 'assists']
const GJ: QuestionKey[] = ['gols', 'jogos']
const GAT: QuestionKey[] = ['gols', 'assists', 'titulos']

export const HIST_CARDS: HistCardData[] = [
  // ── MÍTICA (ouro) ──────────────────────────────────────────────
  {
    id: 'pele-1970', nome: 'Pelé', apelido: 'O Rei', ano: 1970, nascimento: 1940,
    flag: '🇧🇷', raridade: 'mitica', posicao: 'Atacante', clube: 'Santos / Brasil',
    cor: '#FFB800',
    atributos: { gols: 8, titulos: 3, altura: 173, assists: 6, jogos: 6 },
    perguntas: ['gols', 'titulos', 'assists'],
  },
  {
    id: 'maradona-1986', nome: 'Diego Maradona', apelido: 'El Pibe de Oro', ano: 1986, nascimento: 1960,
    flag: '🇦🇷', raridade: 'mitica', posicao: 'Meia', clube: 'Napoli / Argentina',
    cor: '#FFB800',
    atributos: { gols: 5, titulos: 2, altura: 165, assists: 5, jogos: 7 },
    perguntas: ['gols', 'titulos', 'assists'],
  },
  {
    id: 'r9-1998', nome: 'Ronaldo Nazário', apelido: 'O Fenômeno', ano: 1998, nascimento: 1976,
    flag: '🇧🇷', raridade: 'mitica', posicao: 'Atacante', clube: 'Inter / Brasil',
    cor: '#FFB800',
    atributos: { gols: 4, titulos: 2, altura: 183, assists: 3, jogos: 7 },
    perguntas: GTA,
  },
  {
    id: 'zidane-1998', nome: 'Zinedine Zidane', apelido: 'Zizou', ano: 1998, nascimento: 1972,
    flag: '🇫🇷', raridade: 'mitica', posicao: 'Meia', clube: 'Juventus / França',
    cor: '#FFB800',
    atributos: { gols: 2, titulos: 6, altura: 185, assists: 4, jogos: 7 },
    perguntas: ['gols', 'titulos', 'assists'],
  },
  {
    id: 'ronaldinho-2005', nome: 'Ronaldinho', apelido: 'Dinho', ano: 2005, nascimento: 1980,
    flag: '🇧🇷', raridade: 'mitica', posicao: 'Meia', clube: 'Barcelona',
    cor: '#FFB800',
    atributos: { gols: 17, titulos: 11, assists: 13, jogos: 45 },
    perguntas: GAT,
  },
  {
    id: 'messi-2012', nome: 'Lionel Messi', apelido: 'La Pulga', ano: 2012, nascimento: 1987,
    flag: '🇦🇷', raridade: 'mitica', posicao: 'Atacante', clube: 'Barcelona',
    cor: '#FFB800',
    atributos: { gols: 91, titulos: 15, altura: 170, assists: 29, jogos: 69 },
    perguntas: GAT,
  },
  {
    id: 'cr7-2013', nome: 'Cristiano Ronaldo', apelido: 'CR7', ano: 2013, nascimento: 1985,
    flag: '🇵🇹', raridade: 'mitica', posicao: 'Atacante', clube: 'Real Madrid',
    cor: '#FFB800',
    atributos: { gols: 55, titulos: 10, altura: 187, assists: 13, jogos: 57 },
    perguntas: GTA,
  },

  // ── ÉPICA (azul/roxo) ──────────────────────────────────────────
  {
    id: 'romario-1994', nome: 'Romário', apelido: 'Baixinho', ano: 1994, nascimento: 1966,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Atacante', clube: 'Barcelona / Brasil',
    cor: '#7C3AED',
    atributos: { gols: 5, titulos: 8, altura: 169, assists: 2, jogos: 7 },
    perguntas: GT,
  },
  {
    id: 'bebeto-1994', nome: 'Bebeto', apelido: 'Bebeto', ano: 1994, nascimento: 1964,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Atacante', clube: 'Deportivo / Brasil',
    cor: '#7C3AED',
    atributos: { gols: 3, titulos: 5, altura: 176, assists: 5, jogos: 7 },
    perguntas: GTA,
  },
  {
    id: 'henry-2003', nome: 'Thierry Henry', apelido: 'Titi', ano: 2003, nascimento: 1977,
    flag: '🇫🇷', raridade: 'epica', posicao: 'Atacante', clube: 'Arsenal',
    cor: '#7C3AED',
    atributos: { gols: 32, titulos: 6, altura: 188, assists: 23, jogos: 52 },
    perguntas: GTA,
  },
  {
    id: 'totti-2001', nome: 'Francesco Totti', apelido: 'Il Capitano', ano: 2001, nascimento: 1976,
    flag: '🇮🇹', raridade: 'epica', posicao: 'Meia', clube: 'Roma',
    cor: '#7C3AED',
    atributos: { gols: 18, titulos: 3, altura: 180, assists: 10, jogos: 40 },
    perguntas: GP,
  },
  {
    id: 'kaka-2007', nome: 'Kaká', apelido: 'Kaká', ano: 2007, nascimento: 1982,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Meia', clube: 'AC Milan',
    cor: '#7C3AED',
    atributos: { gols: 16, titulos: 7, altura: 186, assists: 10, jogos: 43 },
    perguntas: GTA,
  },
  {
    id: 'adriano-2004', nome: 'Adriano', apelido: 'Imperador', ano: 2004, nascimento: 1982,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Atacante', clube: 'Inter',
    cor: '#7C3AED',
    atributos: { gols: 28, titulos: 4, altura: 188, assists: 7, jogos: 48 },
    perguntas: GP,
  },
  {
    id: 'ibra-2012', nome: 'Zlatan Ibrahimović', apelido: 'Ibra', ano: 2012, nascimento: 1981,
    flag: '🇸🇪', raridade: 'epica', posicao: 'Atacante', clube: 'PSG',
    cor: '#7C3AED',
    atributos: { gols: 35, titulos: 16, altura: 195, assists: 16, jogos: 51 },
    perguntas: ['gols', 'titulos', 'altura'],
  },
  {
    id: 'van-basten-1988', nome: 'Marco van Basten', apelido: 'Il Cigno', ano: 1988, nascimento: 1964,
    flag: '🇳🇱', raridade: 'epica', posicao: 'Atacante', clube: 'AC Milan / Holanda',
    cor: '#7C3AED',
    atributos: { gols: 9, titulos: 3, altura: 188, assists: 3, jogos: 11 },
    perguntas: GJ,
  },
  {
    id: 'stoichkov-1994', nome: 'Hristo Stoichkov', apelido: 'Stoichkov', ano: 1994, nascimento: 1966,
    flag: '🇧🇬', raridade: 'epica', posicao: 'Atacante', clube: 'Barcelona / Bulgária',
    cor: '#7C3AED',
    atributos: { gols: 6, titulos: 9, altura: 176, jogos: 7 },
    perguntas: GJ,
  },
  {
    id: 'rivaldo-2002', nome: 'Rivaldo', apelido: 'Rivaldo', ano: 2002, nascimento: 1972,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Meia', clube: 'Barcelona / Brasil',
    cor: '#7C3AED',
    atributos: { gols: 5, titulos: 9, altura: 181, assists: 4, jogos: 7 },
    perguntas: GT,
  },
  {
    id: 'drogba-2010', nome: 'Didier Drogba', apelido: 'Drogba', ano: 2010, nascimento: 1978,
    flag: '🇨🇮', raridade: 'epica', posicao: 'Atacante', clube: 'Chelsea',
    cor: '#7C3AED',
    atributos: { gols: 29, titulos: 6, altura: 189, assists: 8, jogos: 40 },
    perguntas: GP,
  },
  {
    id: 'beckham-1999', nome: 'David Beckham', apelido: 'Beckham', ano: 1999, nascimento: 1975,
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', raridade: 'epica', posicao: 'Meia', clube: 'Man. United',
    cor: '#7C3AED',
    atributos: { gols: 6, titulos: 8, altura: 183, assists: 15, jogos: 56 },
    perguntas: TA,
  },
  {
    id: 'roberto-carlos-1997', nome: 'Roberto Carlos', apelido: 'Roberto Carlos', ano: 1997, nascimento: 1973,
    flag: '🇧🇷', raridade: 'epica', posicao: 'Lateral', clube: 'Real Madrid',
    cor: '#7C3AED',
    atributos: { gols: 7, titulos: 4, altura: 168, assists: 9, jogos: 54 },
    perguntas: ['gols', 'altura', 'assists'],
  },

  // ── COMUM (branca) ──────────────────────────────────────────────
  {
    id: 'zico-1982', nome: 'Zico', apelido: 'Zico', ano: 1982, nascimento: 1953,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Meia', clube: 'Flamengo / Brasil',
    cor: '#16B89A',
    atributos: { gols: 4, titulos: 13, altura: 177, assists: 4, jogos: 5 },
    perguntas: GJ,
  },
  {
    id: 'socrates-1982', nome: 'Sócrates', apelido: 'Doutor', ano: 1982, nascimento: 1954,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Meia', clube: 'Corinthians / Brasil',
    cor: '#16B89A',
    atributos: { gols: 4, titulos: 5, altura: 192, assists: 3, jogos: 5 },
    perguntas: ['gols', 'altura'],
  },
  {
    id: 'falcao-1982', nome: 'Paulo Roberto Falcão', apelido: 'Falcão', ano: 1982, nascimento: 1953,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Meia', clube: 'Roma / Brasil',
    cor: '#16B89A',
    atributos: { gols: 2, titulos: 4, altura: 178, assists: 5, jogos: 5 },
    perguntas: GP,
  },
  {
    id: 'jardel-2001', nome: 'Mário Jardel', apelido: 'Jardel', ano: 2001, nascimento: 1973,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Atacante', clube: 'Porto / Galatasaray',
    cor: '#16B89A',
    atributos: { gols: 42, titulos: 3, altura: 190, jogos: 51 },
    perguntas: GP,
  },
  {
    id: 'edmundo-1997', nome: 'Edmundo', apelido: 'Animal', ano: 1997, nascimento: 1971,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Atacante', clube: 'Vasco',
    cor: '#16B89A',
    atributos: { gols: 29, titulos: 3, altura: 180, jogos: 48 },
    perguntas: GP,
  },
  {
    id: 'robinho-2005', nome: 'Robinho', apelido: 'Robinho', ano: 2005, nascimento: 1984,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Atacante', clube: 'Real Madrid',
    cor: '#16B89A',
    atributos: { gols: 14, titulos: 2, altura: 172, assists: 10, jogos: 47 },
    perguntas: GP,
  },
  {
    id: 'denilson-1998', nome: 'Denílson', apelido: 'Denílson', ano: 1998, nascimento: 1977,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Meia', clube: 'Betis / Brasil',
    cor: '#16B89A',
    atributos: { gols: 1, titulos: 1, altura: 173, jogos: 6 },
    perguntas: ['titulos', 'jogos'],
  },
  {
    id: 'cafu-2002', nome: 'Marcos Cafu', apelido: 'Cafu', ano: 2002, nascimento: 1970,
    flag: '🇧🇷', raridade: 'comum', posicao: 'Lateral', clube: 'Roma / Brasil',
    cor: '#16B89A',
    atributos: { gols: 2, titulos: 3, altura: 176, assists: 6, jogos: 54 },
    perguntas: ['titulos', 'jogos'],
  },
  {
    id: 'roberto-baggio-1994', nome: 'Roberto Baggio', apelido: 'Il Codino', ano: 1994, nascimento: 1967,
    flag: '🇮🇹', raridade: 'comum', posicao: 'Meia', clube: 'Juventus / Itália',
    cor: '#16B89A',
    atributos: { gols: 5, titulos: 5, altura: 174, assists: 2, jogos: 7 },
    perguntas: GJ,
  },
]

export function getCard(id: string): HistCardData | undefined {
  return HIST_CARDS.find(c => c.id === id)
}

export function getRaridadeLabel(r: HistCardData['raridade']): string {
  return r === 'mitica' ? 'MÍTICA' : r === 'epica' ? 'ÉPICA' : 'COMUM'
}

export function getRaridadeColor(r: HistCardData['raridade']): { bg: string; text: string; glow: string } {
  if (r === 'mitica') return { bg: 'linear-gradient(135deg, #78350f, #b45309, #d97706, #fbbf24)', text: '#fef3c7', glow: '#f59e0b' }
  if (r === 'epica') return { bg: 'linear-gradient(135deg, #1e1b4b, #4338ca, #7c3aed)', text: '#ede9fe', glow: '#818cf8' }
  return { bg: '#fff', text: '#000', glow: 'transparent' }
}

export const QUESTION_LABELS: Record<string, (ano: number) => string> = {
  gols:    (ano) => `Quantos gols marcou em ${ano}?`,
  titulos: (ano) => `Quantos títulos tinha conquistado até ${ano}?`,
  altura:  (_)   => 'Qual era sua altura em cm?',
  assists: (ano) => `Quantas assistências deu em ${ano}?`,
  jogos:   (ano) => `Quantos jogos fez em ${ano}?`,
}
