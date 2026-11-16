// 🌎 SUL-AMERICANA DO BRASIL OFICIAL — os clubes de fora da Sul-Americana 2026 (pesquisa: docs/brasil-oficial/competicoes-reais.md,
// fonte https://pt.wikipedia.org/wiki/Copa_Sul-Americana_de_2026). O nome é o do baralho (chave das cartas e do escudo); onde o nome
// do clube bate com outro já existente, leva o país junto (Racing-URU, Nacional-PAR, Libertad-EQU).
// O torneio em si (motor e telas) ainda vai entrar; por enquanto a lista serve pra cartas e escudos.
import type { EntradaConmebol } from './libertadores-oficial'

export type EntradaSula = Omit<EntradaConmebol, 'fase'> & { fase: 'grupos' | 'fase1' }
export const ESTRANGEIROS_SULA_2026: readonly EntradaSula[] = [
  // Argentina (direto nos grupos)
  { nome: 'River Plate', pais: 'ARG', fase: 'grupos' }, { nome: 'Racing', pais: 'ARG', fase: 'grupos' },
  { nome: 'Deportivo Riestra', pais: 'ARG', fase: 'grupos' }, { nome: 'San Lorenzo', pais: 'ARG', fase: 'grupos' },
  { nome: 'Tigre', pais: 'ARG', fase: 'grupos' }, { nome: 'Barracas Central', pais: 'ARG', fase: 'grupos' },
  // 1ª fase (jogo único entre clubes do mesmo país)
  { nome: 'San Antonio Bulo Bulo', pais: 'BOL', fase: 'fase1' }, { nome: 'Blooming', pais: 'BOL', fase: 'fase1' },
  { nome: 'Independiente Petrolero', pais: 'BOL', fase: 'fase1' }, { nome: 'Guabirá', pais: 'BOL', fase: 'fase1' },
  { nome: 'U. de Chile', pais: 'CHI', fase: 'fase1' }, { nome: 'Audax Italiano', pais: 'CHI', fase: 'fase1' },
  { nome: 'Palestino', pais: 'CHI', fase: 'fase1' }, { nome: 'Cobresal', pais: 'CHI', fase: 'fase1' },
  { nome: 'Atlético Nacional', pais: 'COL', fase: 'fase1' }, { nome: 'América de Cali', pais: 'COL', fase: 'fase1' },
  { nome: 'Atlético Bucaramanga', pais: 'COL', fase: 'fase1' }, { nome: 'Millonarios', pais: 'COL', fase: 'fase1' },
  { nome: 'Orense', pais: 'EQU', fase: 'fase1' }, { nome: 'Libertad-EQU', pais: 'EQU', fase: 'fase1' },
  { nome: 'Macará', pais: 'EQU', fase: 'fase1' }, { nome: 'Deportivo Cuenca', pais: 'EQU', fase: 'fase1' },
  { nome: 'Sportivo Trinidense', pais: 'PAR', fase: 'fase1' }, { nome: 'Nacional-PAR', pais: 'PAR', fase: 'fase1' },
  { nome: 'Recoleta', pais: 'PAR', fase: 'fase1' }, { nome: 'Olimpia', pais: 'PAR', fase: 'fase1' },
  { nome: 'Alianza Atlético', pais: 'PER', fase: 'fase1' }, { nome: 'Melgar', pais: 'PER', fase: 'fase1' },
  { nome: 'Deportivo Garcilaso', pais: 'PER', fase: 'fase1' }, { nome: 'Cienciano', pais: 'PER', fase: 'fase1' },
  { nome: 'Defensor Sporting', pais: 'URU', fase: 'fase1' }, { nome: 'Boston River', pais: 'URU', fase: 'fase1' },
  { nome: 'Racing-URU', pais: 'URU', fase: 'fase1' }, { nome: 'Montevideo City Torque', pais: 'URU', fase: 'fase1' },
  { nome: 'Academia Puerto Cabello', pais: 'VEN', fase: 'fase1' }, { nome: 'Monagas', pais: 'VEN', fase: 'fase1' },
  { nome: 'Caracas', pais: 'VEN', fase: 'fase1' }, { nome: 'Metropolitanos', pais: 'VEN', fase: 'fase1' },
]
