export interface Club {
  id: string
  name: string
  country: string
  flag: string
  tier: number  // 1=elite, 2=grande, 3=médio, 4=pequeno
  budget: number
}

export const CLUBS: Club[] = [
  // Elite europeus
  { id: 'barcelona', name: 'FC Barcelona', country: 'Espanha', flag: '🇪🇸', tier: 1, budget: 80000000 },
  { id: 'real', name: 'Real Madrid', country: 'Espanha', flag: '🇪🇸', tier: 1, budget: 90000000 },
  { id: 'milan', name: 'AC Milan', country: 'Itália', flag: '🇮🇹', tier: 1, budget: 70000000 },
  { id: 'inter', name: 'Inter de Milão', country: 'Itália', flag: '🇮🇹', tier: 1, budget: 65000000 },
  { id: 'juve', name: 'Juventus', country: 'Itália', flag: '🇮🇹', tier: 1, budget: 60000000 },
  { id: 'manunited', name: 'Manchester United', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tier: 1, budget: 75000000 },
  { id: 'arsenal', name: 'Arsenal', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tier: 1, budget: 50000000 },
  { id: 'chelsea', name: 'Chelsea', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tier: 1, budget: 55000000 },
  { id: 'psg', name: 'Paris Saint-Germain', country: 'França', flag: '🇫🇷', tier: 1, budget: 45000000 },
  { id: 'bayern', name: 'Bayern de Munique', country: 'Alemanha', flag: '🇩🇪', tier: 1, budget: 70000000 },

  // Grandes brasileiros
  { id: 'flamengo', name: 'Flamengo', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 5000000 },
  { id: 'corinthians', name: 'Corinthians', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 4000000 },
  { id: 'saopaulo', name: 'São Paulo', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 4500000 },
  { id: 'santos', name: 'Santos', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 3500000 },
  { id: 'gremio', name: 'Grêmio', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 3000000 },
  { id: 'cruzeiro', name: 'Cruzeiro', country: 'Brasil', flag: '🇧🇷', tier: 2, budget: 3000000 },

  // Médios europeus
  { id: 'psv', name: 'PSV Eindhoven', country: 'Holanda', flag: '🇳🇱', tier: 2, budget: 20000000 },
  { id: 'ajax', name: 'Ajax', country: 'Holanda', flag: '🇳🇱', tier: 2, budget: 22000000 },
  { id: 'porto', name: 'FC Porto', country: 'Portugal', flag: '🇵🇹', tier: 2, budget: 15000000 },
  { id: 'benfica', name: 'Benfica', country: 'Portugal', flag: '🇵🇹', tier: 2, budget: 12000000 },
  { id: 'monaco', name: 'Monaco', country: 'França', flag: '🇫🇷', tier: 2, budget: 18000000 },
  { id: 'deportivo', name: 'Deportivo La Coruña', country: 'Espanha', flag: '🇪🇸', tier: 2, budget: 15000000 },
]

export function getClubById(id: string): Club | undefined {
  return CLUBS.find(c => c.id === id)
}

export function getClubsByTier(tier: number): Club[] {
  return CLUBS.filter(c => c.tier === tier)
}

// Small, cheap clubs you can BUY once you're rich enough
export interface BuyableClub {
  id: string
  name: string
  city: string
  division: number  // starts at 4 (worst)
  price: number
  fans: number
  flavor: string
}

export const BUYABLE_CLUBS: BuyableClub[] = [
  { id: 'guarani-fc', name: 'Guarani do Sertão', city: 'Interior do Ceará', division: 4, price: 500000, fans: 3000,
    flavor: 'Estádio de terra batida, 3 mil torcedores fiéis e uma dívida no pescoço. Mas é UM CLUBE — e é seu.' },
  { id: 'atletico-vila', name: 'Atlético Vila Nova', city: 'Periferia de SP', division: 4, price: 650000, fans: 5000,
    flavor: 'Da várzea paulista pro profissionalismo. Torcida raiz, grana curta, vontade enorme.' },
  { id: 'real-litoral', name: 'Real Litoral', city: 'Litoral catarinense', division: 3, price: 900000, fans: 8000,
    flavor: 'Já está na terceira divisão. Mais caro, mas você começa mais perto da elite.' },
]

export const NEMESIS = {
  name: 'Sérgio Cambalhota',
  story:
    'Você ouve falar dele nos bastidores: SÉRGIO CAMBALHOTA. Um empresário medíocre que passou a vida inteira na sua sombra, vendo você acertar TODOS os palpites enquanto ele errava feio. Ele não entende como você sempre sabe quem vai estourar — e isso o consome de inveja. Agora ele te marca de perto: cada talento que você namora e não fecha, ele tenta roubar primeiro. "Esse aí também vai pra MINHA carteira", ele jura. A guerra começou.',
}

