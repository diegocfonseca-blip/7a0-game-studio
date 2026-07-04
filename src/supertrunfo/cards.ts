import type { STCard } from './types'

export const ST_CARDS: STCard[] = [
  // ── DEUS tier ──────────────────────────────────────────────────────────
  {
    id: 'pele', nome: 'Pelé', apelido: 'O Rei', pais: '🇧🇷', icon: '👑', tier: 'deus',
    atributos: { velocidade: 88, drible: 96, finalizacao: 97, titulos: 99, lendario: 99 },
  },
  {
    id: 'maradona', nome: 'Maradona', apelido: 'El Pibe de Oro', pais: '🇦🇷', icon: '🌟', tier: 'deus',
    atributos: { velocidade: 84, drible: 99, finalizacao: 91, titulos: 74, lendario: 98 },
  },
  {
    id: 'r9', nome: 'Ronaldo R9', apelido: 'O Fenômeno', pais: '🇧🇷', icon: '⚡', tier: 'deus',
    atributos: { velocidade: 97, drible: 95, finalizacao: 97, titulos: 84, lendario: 96 },
  },
  {
    id: 'messi', nome: 'Messi', apelido: 'La Pulga', pais: '🇦🇷', icon: '🐐', tier: 'deus',
    atributos: { velocidade: 87, drible: 98, finalizacao: 93, titulos: 90, lendario: 97 },
  },
  {
    id: 'cr7', nome: 'Cristiano Ronaldo', apelido: 'CR7', pais: '🇵🇹', icon: '🔱', tier: 'deus',
    atributos: { velocidade: 94, drible: 88, finalizacao: 95, titulos: 95, lendario: 93 },
  },

  // ── LENDA tier ─────────────────────────────────────────────────────────
  {
    id: 'zidane', nome: 'Zidane', apelido: 'Zizou', pais: '🇫🇷', icon: '🧠', tier: 'lenda',
    atributos: { velocidade: 76, drible: 94, finalizacao: 84, titulos: 82, lendario: 95 },
  },
  {
    id: 'ronaldinho', nome: 'Ronaldinho', apelido: 'Gaúcho', pais: '🇧🇷', icon: '😁', tier: 'lenda',
    atributos: { velocidade: 87, drible: 97, finalizacao: 87, titulos: 67, lendario: 93 },
  },
  {
    id: 'romario', nome: 'Romário', apelido: 'O Baixinho', pais: '🇧🇷', icon: '🎯', tier: 'lenda',
    atributos: { velocidade: 88, drible: 88, finalizacao: 97, titulos: 71, lendario: 87 },
  },
  {
    id: 'vanbasten', nome: 'Van Basten', apelido: 'Il Cigno di Utrecht', pais: '🇳🇱', icon: '💣', tier: 'lenda',
    atributos: { velocidade: 81, drible: 87, finalizacao: 99, titulos: 70, lendario: 91 },
  },
  {
    id: 'cruyff', nome: 'Cruyff', apelido: 'Profeta do Gol', pais: '🇳🇱', icon: '🌀', tier: 'lenda',
    atributos: { velocidade: 83, drible: 95, finalizacao: 86, titulos: 65, lendario: 97 },
  },
  {
    id: 'henry', nome: 'Henry', apelido: 'Thierry', pais: '🇫🇷', icon: '🦁', tier: 'lenda',
    atributos: { velocidade: 95, drible: 88, finalizacao: 93, titulos: 74, lendario: 88 },
  },
  {
    id: 'robertocarlos', nome: 'Roberto Carlos', apelido: 'A Bala', pais: '🇧🇷', icon: '💥', tier: 'lenda',
    atributos: { velocidade: 93, drible: 81, finalizacao: 76, titulos: 88, lendario: 88 },
  },
  {
    id: 'cafu', nome: 'Cafu', apelido: 'O Pendura', pais: '🇧🇷', icon: '🚀', tier: 'lenda',
    atributos: { velocidade: 91, drible: 78, finalizacao: 59, titulos: 98, lendario: 85 },
  },
  {
    id: 'maldini', nome: 'Maldini', apelido: 'Il Capitano', pais: '🇮🇹', icon: '🛡️', tier: 'lenda',
    atributos: { velocidade: 80, drible: 77, finalizacao: 63, titulos: 90, lendario: 96 },
  },
  {
    id: 'iniesta', nome: 'Iniesta', apelido: 'O Mago', pais: '🇪🇸', icon: '✨', tier: 'lenda',
    atributos: { velocidade: 80, drible: 92, finalizacao: 80, titulos: 92, lendario: 90 },
  },
  {
    id: 'xavi', nome: 'Xavi', apelido: 'O Metrônomo', pais: '🇪🇸', icon: '🧩', tier: 'lenda',
    atributos: { velocidade: 77, drible: 87, finalizacao: 75, titulos: 91, lendario: 88 },
  },
  {
    id: 'zico', nome: 'Zico', apelido: 'Galinho de Quintino', pais: '🇧🇷', icon: '⭐', tier: 'lenda',
    atributos: { velocidade: 79, drible: 93, finalizacao: 90, titulos: 54, lendario: 90 },
  },
  {
    id: 'neymar', nome: 'Neymar', apelido: 'NJR', pais: '🇧🇷', icon: '🌈', tier: 'lenda',
    atributos: { velocidade: 89, drible: 95, finalizacao: 85, titulos: 64, lendario: 83 },
  },
  {
    id: 'mbappe', nome: 'Mbappé', apelido: 'Donatello', pais: '🇫🇷', icon: '💨', tier: 'lenda',
    atributos: { velocidade: 99, drible: 91, finalizacao: 90, titulos: 74, lendario: 83 },
  },

  // ── CRAQUE tier ────────────────────────────────────────────────────────
  {
    id: 'rivaldo', nome: 'Rivaldo', apelido: 'O Baixinho', pais: '🇧🇷', icon: '🌠', tier: 'craque',
    atributos: { velocidade: 82, drible: 88, finalizacao: 91, titulos: 69, lendario: 84 },
  },
  {
    id: 'kaka', nome: 'Kaká', apelido: 'Ricardo Kaká', pais: '🇧🇷', icon: '🙏', tier: 'craque',
    atributos: { velocidade: 88, drible: 85, finalizacao: 87, titulos: 72, lendario: 86 },
  },
  {
    id: 'beckham', nome: 'Beckham', apelido: 'Becks', pais: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '🎽', tier: 'craque',
    atributos: { velocidade: 78, drible: 82, finalizacao: 84, titulos: 85, lendario: 86 },
  },
  {
    id: 'ibra', nome: 'Ibrahimović', apelido: 'Zlatan', pais: '🇸🇪', icon: '🦅', tier: 'craque',
    atributos: { velocidade: 82, drible: 88, finalizacao: 89, titulos: 77, lendario: 87 },
  },
  {
    id: 'sheva', nome: 'Shevchenko', apelido: 'Sheva', pais: '🇺🇦', icon: '🔥', tier: 'craque',
    atributos: { velocidade: 85, drible: 84, finalizacao: 94, titulos: 67, lendario: 83 },
  },
  {
    id: 'platini', nome: 'Platini', apelido: 'Le Roi', pais: '🇫🇷', icon: '🎭', tier: 'craque',
    atributos: { velocidade: 76, drible: 88, finalizacao: 88, titulos: 77, lendario: 88 },
  },
  {
    id: 'figo', nome: 'Figo', apelido: 'Luís Figo', pais: '🇵🇹', icon: '🦊', tier: 'craque',
    atributos: { velocidade: 84, drible: 91, finalizacao: 82, titulos: 79, lendario: 84 },
  },
  {
    id: 'raul', nome: 'Raúl', apelido: 'El Capitán', pais: '🇪🇸', icon: '👊', tier: 'craque',
    atributos: { velocidade: 80, drible: 84, finalizacao: 87, titulos: 82, lendario: 82 },
  },
  {
    id: 'baggio', nome: 'Roberto Baggio', apelido: 'Il Divin Codino', pais: '🇮🇹', icon: '🎪', tier: 'craque',
    atributos: { velocidade: 81, drible: 91, finalizacao: 93, titulos: 55, lendario: 89 },
  },
  {
    id: 'cantona', nome: 'Cantona', apelido: 'King Eric', pais: '🇫🇷', icon: '👁️', tier: 'craque',
    atributos: { velocidade: 78, drible: 86, finalizacao: 87, titulos: 72, lendario: 89 },
  },
  {
    id: 'lewandowski', nome: 'Lewandowski', apelido: 'Lewa', pais: '🇵🇱', icon: '🏹', tier: 'craque',
    atributos: { velocidade: 81, drible: 79, finalizacao: 96, titulos: 71, lendario: 81 },
  },
  {
    id: 'benzema', nome: 'Benzema', apelido: 'Karim', pais: '🇫🇷', icon: '💎', tier: 'craque',
    atributos: { velocidade: 82, drible: 85, finalizacao: 90, titulos: 88, lendario: 84 },
  },
  {
    id: 'pirlo', nome: 'Pirlo', apelido: 'Il Maestro', pais: '🇮🇹', icon: '🎵', tier: 'craque',
    atributos: { velocidade: 72, drible: 81, finalizacao: 77, titulos: 83, lendario: 87 },
  },
  {
    id: 'stoichkov', nome: 'Stoichkov', apelido: 'Hristo', pais: '🇧🇬', icon: '🌪️', tier: 'craque',
    atributos: { velocidade: 86, drible: 87, finalizacao: 91, titulos: 64, lendario: 82 },
  },
  {
    id: 'bebeto', nome: 'Bebeto', apelido: 'Bebeto', pais: '🇧🇷', icon: '👶', tier: 'craque',
    atributos: { velocidade: 86, drible: 81, finalizacao: 90, titulos: 72, lendario: 79 },
  },
  {
    id: 'jairzinho', nome: 'Jairzinho', apelido: 'O Furacão', pais: '🇧🇷', icon: '🌊', tier: 'craque',
    atributos: { velocidade: 90, drible: 87, finalizacao: 88, titulos: 70, lendario: 83 },
  },
  {
    id: 'vinicius', nome: 'Vinicius Jr', apelido: 'Vini Jr', pais: '🇧🇷', icon: '🐍', tier: 'craque',
    atributos: { velocidade: 94, drible: 92, finalizacao: 84, titulos: 68, lendario: 78 },
  },
  {
    id: 'haaland', nome: 'Haaland', apelido: 'A Máquina', pais: '🇳🇴', icon: '🤖', tier: 'craque',
    atributos: { velocidade: 86, drible: 74, finalizacao: 97, titulos: 72, lendario: 75 },
  },
  {
    id: 'drogba', nome: 'Drogba', apelido: 'Didier', pais: '🇨🇮', icon: '💪', tier: 'craque',
    atributos: { velocidade: 85, drible: 78, finalizacao: 88, titulos: 74, lendario: 82 },
  },
  {
    id: 'suarez', nome: 'Suárez', apelido: 'El Pistolero', pais: '🇺🇾', icon: '🦷', tier: 'craque',
    atributos: { velocidade: 82, drible: 85, finalizacao: 92, titulos: 74, lendario: 80 },
  },
  {
    id: 'tostao', nome: 'Tostão', apelido: 'O Diamante', pais: '🇧🇷', icon: '🪙', tier: 'craque',
    atributos: { velocidade: 80, drible: 87, finalizacao: 89, titulos: 70, lendario: 81 },
  },
]

export const ST_CARDS_MAP = Object.fromEntries(ST_CARDS.map(c => [c.id, c]))
