// Listas de referência da edição real de 2026, compartilhadas pela inscrição das duas copas.
// As ligas estrangeiras não são simuladas: a ordem nacional de referência continua fixa.
export type EntradaConmebol = { nome: string; pais: string; fase: 'grupos' | 'fase2' | 'fase1' }
export const ESTRANGEIROS_LIBERTA_2026: readonly EntradaConmebol[] = [
  // Argentina (Lanús entra pela vaga de campeão da Sul-Americana 2025)
  { nome: 'Lanús', pais: 'ARG', fase: 'grupos' }, { nome: 'Platense', pais: 'ARG', fase: 'grupos' },
  { nome: 'Estudiantes', pais: 'ARG', fase: 'grupos' }, { nome: 'Independiente Rivadavia', pais: 'ARG', fase: 'grupos' },
  { nome: 'Rosario Central', pais: 'ARG', fase: 'grupos' }, { nome: 'Boca Juniors', pais: 'ARG', fase: 'grupos' },
  { nome: 'Argentinos Juniors', pais: 'ARG', fase: 'fase2' },
  // Bolívia
  { nome: 'Always Ready', pais: 'BOL', fase: 'grupos' }, { nome: 'Bolívar', pais: 'BOL', fase: 'grupos' },
  { nome: 'Nacional Potosí', pais: 'BOL', fase: 'fase2' }, { nome: 'The Strongest', pais: 'BOL', fase: 'fase1' },
  // Chile
  { nome: 'Coquimbo Unido', pais: 'CHI', fase: 'grupos' }, { nome: 'Universidad Católica', pais: 'CHI', fase: 'grupos' },
  { nome: "O'Higgins", pais: 'CHI', fase: 'fase2' }, { nome: 'Huachipato', pais: 'CHI', fase: 'fase2' },
  // Colômbia
  { nome: 'Santa Fe', pais: 'COL', fase: 'grupos' }, { nome: 'Junior Barranquilla', pais: 'COL', fase: 'grupos' },
  { nome: 'Deportes Tolima', pais: 'COL', fase: 'fase2' }, { nome: 'Independiente Medellín', pais: 'COL', fase: 'fase2' },
  // Equador
  { nome: 'Independiente del Valle', pais: 'EQU', fase: 'grupos' }, { nome: 'LDU Quito', pais: 'EQU', fase: 'grupos' },
  { nome: 'Barcelona SC', pais: 'EQU', fase: 'fase2' }, { nome: 'Universidad Católica-EQU', pais: 'EQU', fase: 'fase1' },
  // Paraguai
  { nome: 'Libertad', pais: 'PAR', fase: 'grupos' }, { nome: 'Cerro Porteño', pais: 'PAR', fase: 'grupos' },
  { nome: 'Guaraní-PAR', pais: 'PAR', fase: 'fase2' }, { nome: '2 de Mayo', pais: 'PAR', fase: 'fase1' },
  // Peru
  { nome: 'Universitario', pais: 'PER', fase: 'grupos' }, { nome: 'Cusco', pais: 'PER', fase: 'grupos' },
  { nome: 'Sporting Cristal', pais: 'PER', fase: 'fase2' }, { nome: 'Alianza Lima', pais: 'PER', fase: 'fase1' },
  // Uruguai
  { nome: 'Nacional-URU', pais: 'URU', fase: 'grupos' }, { nome: 'Peñarol', pais: 'URU', fase: 'grupos' },
  { nome: 'Liverpool-URU', pais: 'URU', fase: 'fase2' }, { nome: 'Juventud', pais: 'URU', fase: 'fase1' },
  // Venezuela
  { nome: 'Universidad Central', pais: 'VEN', fase: 'grupos' }, { nome: 'Deportivo La Guaira', pais: 'VEN', fase: 'grupos' },
  { nome: 'Carabobo', pais: 'VEN', fase: 'fase2' }, { nome: 'Deportivo Táchira', pais: 'VEN', fase: 'fase1' },
]

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
