// ── Visual themes for Chess Legends ──────────────────────────────────────
// Each theme controls board squares, page background, panels and piece tint.
// "Rubro-Negro" and "Almirante" are original designs inspired by club colors
// (no official crests or trademarks).

export interface BoardTheme {
  id: string
  nome: string
  desc: string
  emoji: string
  // squares
  light: string
  dark: string
  lastMove: string      // overlay for from/to of last move
  checkGlow: string     // square of king in check
  moveDot: string       // legal move hint
  selected: string
  coord: string         // coordinate text color (on board edge)
  boardBorder: string
  // page
  bg: string            // page background (css color or gradient)
  panel: string         // side panel background
  panelBorder: string
  text: string
  subtext: string
  gold: string          // accent
  // pieces
  whitePiece: string
  whitePieceStroke: string
  blackPiece: string
  blackPieceStroke: string
}

export const THEMES: BoardTheme[] = [
  {
    id: 'classic', nome: '2D Clássico', emoji: '♟️',
    desc: 'Limpo, rápido e claro. O padrão dos mestres.',
    light: '#EBECD0', dark: '#739552',
    lastMove: 'rgba(255, 213, 0, 0.45)', checkGlow: 'rgba(232, 64, 52, 0.85)',
    moveDot: 'rgba(12, 12, 12, 0.22)', selected: 'rgba(255, 213, 0, 0.55)',
    coord: 'rgba(255,255,255,0.75)', boardBorder: '#3E5230',
    bg: 'linear-gradient(160deg, #23301C 0%, #141B10 100%)',
    panel: 'rgba(255,255,255,0.05)', panelBorder: 'rgba(255,255,255,0.12)',
    text: '#F5F3E7', subtext: 'rgba(245,243,231,0.55)', gold: '#E8C766',
    whitePiece: '#FAFAF7', whitePieceStroke: '#3D3D3D',
    blackPiece: '#2E2B28', blackPieceStroke: '#0A0A0A',
  },
  {
    id: 'wood', nome: 'Madeira Premium', emoji: '🪵',
    desc: 'Tabuleiro de torneio, nobre e clássico.',
    light: '#F0D9B5', dark: '#B58863',
    lastMove: 'rgba(255, 170, 0, 0.4)', checkGlow: 'rgba(220, 50, 40, 0.85)',
    moveDot: 'rgba(60, 30, 10, 0.25)', selected: 'rgba(255, 190, 60, 0.55)',
    coord: 'rgba(255,240,220,0.8)', boardBorder: '#5C3A21',
    bg: 'linear-gradient(160deg, #2C1D12 0%, #17100A 100%)',
    panel: 'rgba(255,225,190,0.06)', panelBorder: 'rgba(255,225,190,0.14)',
    text: '#F3E7D3', subtext: 'rgba(243,231,211,0.55)', gold: '#D9A441',
    whitePiece: '#F7EFDF', whitePieceStroke: '#4A3520',
    blackPiece: '#4A2F1B', blackPieceStroke: '#1C0F06',
  },
  {
    id: 'marble', nome: 'Mármore', emoji: '🏛️',
    desc: 'Elegância de salão europeu, frio e imponente.',
    light: '#E9E9E4', dark: '#8E93A0',
    lastMove: 'rgba(120, 160, 255, 0.4)', checkGlow: 'rgba(220, 60, 60, 0.85)',
    moveDot: 'rgba(30, 35, 55, 0.25)', selected: 'rgba(120, 160, 255, 0.5)',
    coord: 'rgba(240,240,245,0.8)', boardBorder: '#4A4E5C',
    bg: 'linear-gradient(160deg, #23262E 0%, #121419 100%)',
    panel: 'rgba(220,225,240,0.05)', panelBorder: 'rgba(220,225,240,0.12)',
    text: '#EEF0F5', subtext: 'rgba(238,240,245,0.55)', gold: '#C8CCD8',
    whitePiece: '#FBFBF9', whitePieceStroke: '#3A3D48',
    blackPiece: '#33363F', blackPieceStroke: '#101115',
  },
  {
    id: 'medieval', nome: 'Medieval', emoji: '🏰',
    desc: 'Pedra, tocha e aço. Uma batalha de reinos.',
    light: '#C9BC9C', dark: '#6E6046',
    lastMove: 'rgba(255, 140, 40, 0.4)', checkGlow: 'rgba(230, 70, 40, 0.9)',
    moveDot: 'rgba(40, 28, 12, 0.3)', selected: 'rgba(255, 150, 50, 0.5)',
    coord: 'rgba(235,220,190,0.8)', boardBorder: '#3E2A1C',
    bg: 'linear-gradient(160deg, #2A2118 0%, #14100A 100%)',
    panel: 'rgba(255,210,150,0.05)', panelBorder: 'rgba(255,210,150,0.13)',
    text: '#EFE3CB', subtext: 'rgba(239,227,203,0.55)', gold: '#C98F2E',
    whitePiece: '#E9DEC4', whitePieceStroke: '#4B3A22',
    blackPiece: '#3B3226', blackPieceStroke: '#15100A',
  },
  {
    id: 'futurist', nome: 'Futurista', emoji: '🛸',
    desc: 'Painéis de titânio e luz fria de nave.',
    light: '#B8C4CE', dark: '#4F6272',
    lastMove: 'rgba(0, 220, 255, 0.35)', checkGlow: 'rgba(255, 60, 90, 0.85)',
    moveDot: 'rgba(0, 40, 60, 0.3)', selected: 'rgba(0, 220, 255, 0.45)',
    coord: 'rgba(210,230,240,0.8)', boardBorder: '#22303C',
    bg: 'linear-gradient(160deg, #101820 0%, #070B10 100%)',
    panel: 'rgba(0,220,255,0.05)', panelBorder: 'rgba(0,220,255,0.15)',
    text: '#E4F1F8', subtext: 'rgba(228,241,248,0.55)', gold: '#3ED6E0',
    whitePiece: '#EDF6FA', whitePieceStroke: '#28414F',
    blackPiece: '#1F2E3A', blackPieceStroke: '#05090D',
  },
  {
    id: 'neon', nome: 'Neon Escuro', emoji: '🌃',
    desc: 'Madrugada de arcade. Roxo elétrico no breu.',
    light: '#3A3352', dark: '#221D35',
    lastMove: 'rgba(255, 0, 200, 0.35)', checkGlow: 'rgba(255, 40, 100, 0.9)',
    moveDot: 'rgba(0, 255, 170, 0.35)', selected: 'rgba(0, 255, 170, 0.4)',
    coord: 'rgba(220,190,255,0.7)', boardBorder: '#120E20',
    bg: 'linear-gradient(160deg, #17112A 0%, #0A0714 100%)',
    panel: 'rgba(190,120,255,0.06)', panelBorder: 'rgba(190,120,255,0.18)',
    text: '#F0E6FF', subtext: 'rgba(240,230,255,0.55)', gold: '#B47CFF',
    whitePiece: '#F5EFFF', whitePieceStroke: '#7A3CC8',
    blackPiece: '#14D9A5', blackPieceStroke: '#065F45',
  },
  {
    id: 'flamengo', nome: 'Rubro-Negro', emoji: '🔴',
    desc: 'Vermelho e preto com dourado de glória. Pra quem tem o coração na arquibancada.',
    light: '#D8352E', dark: '#191214',
    lastMove: 'rgba(255, 200, 60, 0.45)', checkGlow: 'rgba(255, 230, 120, 0.9)',
    moveDot: 'rgba(255, 210, 90, 0.4)', selected: 'rgba(255, 200, 60, 0.5)',
    coord: 'rgba(255,220,190,0.85)', boardBorder: '#6E0F0A',
    bg: 'linear-gradient(160deg, #240A08 0%, #100404 100%)',
    panel: 'rgba(216,53,46,0.08)', panelBorder: 'rgba(216,53,46,0.25)',
    text: '#FBEDE6', subtext: 'rgba(251,237,230,0.55)', gold: '#F2B33D',
    whitePiece: '#F6E9DA', whitePieceStroke: '#7A1610',
    blackPiece: '#231416', blackPieceStroke: '#000000',
  },
  {
    id: 'vasco', nome: 'Almirante', emoji: '⚓',
    desc: 'Preto, branco e a faixa dourada do almirante. Navegar é preciso.',
    light: '#EDEAE3', dark: '#17171A',
    lastMove: 'rgba(200, 170, 90, 0.5)', checkGlow: 'rgba(230, 80, 60, 0.9)',
    moveDot: 'rgba(160, 130, 60, 0.45)', selected: 'rgba(200, 170, 90, 0.55)',
    coord: 'rgba(240,235,225,0.85)', boardBorder: '#2B2B30',
    bg: 'linear-gradient(160deg, #1A1A1E 0%, #0A0A0C 100%)',
    panel: 'rgba(237,234,227,0.05)', panelBorder: 'rgba(237,234,227,0.14)',
    text: '#F2F0EA', subtext: 'rgba(242,240,234,0.55)', gold: '#C8A84B',
    whitePiece: '#F8F6F0', whitePieceStroke: '#3A3A40',
    blackPiece: '#232326', blackPieceStroke: '#000000',
  },
]

export const THEMES_MAP: Record<string, BoardTheme> = Object.fromEntries(THEMES.map(t => [t.id, t]))

export function themeById(id: string): BoardTheme {
  return THEMES_MAP[id] ?? THEMES[0]
}
