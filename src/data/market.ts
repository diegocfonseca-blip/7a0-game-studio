export type MarketCategory = 'equipamento' | 'veiculo' | 'experiencia' | 'risco'

export interface MarketItem {
  id: string
  name: string
  icon: string
  price: number
  category: MarketCategory
  unique: boolean
  benefit: string
  drawback: string
  effect: {
    coins?: number
    reputation?: number
    traitBoostAll?: number
    traitBoostRandom?: number
    traitDrainRandom?: number
    nextMatchMult?: number
    gamble?: {
      winChance: number
      win: { coins: number; reputation?: number }
      lose: { coins?: number; traitDrain?: number }
    }
  }
}

export const MARKET_ITEMS: MarketItem[] = [
  // ── EQUIPAMENTOS ──────────────────────────────────────────────────────────
  {
    id: 'chuteira-importada',
    name: 'Chuteira Importada',
    icon: '👟',
    price: 800,
    category: 'equipamento',
    unique: true,
    benefit: 'Próxima partida com ×1.4 nos ganhos — você joga num nível diferente.',
    drawback: '−4 reputação. Todo mundo pergunta de onde você tirou dinheiro pra isso.',
    effect: { reputation: -4, nextMatchMult: 1.4 },
  },
  {
    id: 'protetor-profissional',
    name: 'Protetor de Canela Pro',
    icon: '🦵',
    price: 500,
    category: 'equipamento',
    unique: true,
    benefit: 'Todos os seus traços roubados ganham +15% de carga agora.',
    drawback: '−2 reputação. Os caras acham que você está com medo de levar falta.',
    effect: { reputation: -2, traitBoostAll: 15 },
  },
  {
    id: 'suplemento',
    name: 'Suplemento de Recuperação',
    icon: '💊',
    price: 450,
    category: 'equipamento',
    unique: false,
    benefit: '1 traço aleatório recupera +25% de carga.',
    drawback: '−C$ 150 em suplementos que você comprou junto.',
    effect: { coins: -150, traitBoostRandom: 25 },
  },

  // ── VEÍCULOS ──────────────────────────────────────────────────────────────
  {
    id: 'moto-velha',
    name: 'Moto Velha',
    icon: '🏍️',
    price: 380,
    category: 'veiculo',
    unique: true,
    benefit: '+C$ 500 de mobilidade — você consegue chegar a mais partidas, mais rápido.',
    drawback: '1 traço aleatório perde −15% de carga. Você caiu uma vez.',
    effect: { coins: 500, traitDrainRandom: 15 },
  },
  {
    id: 'carro-popular',
    name: 'Carro Popular',
    icon: '🚗',
    price: 1400,
    category: 'veiculo',
    unique: true,
    benefit: '+8 reputação. Você chega diferente em todo lugar.',
    drawback: '1 traço perde −10% de carga. Você está mais distraído com o carro do que com o treino.',
    effect: { reputation: 8, traitDrainRandom: 10 },
  },
  {
    id: 'carro-conversivel',
    name: 'Carro Conversível',
    icon: '🚘',
    price: 2800,
    category: 'veiculo',
    unique: true,
    benefit: '+15 reputação. Olheiros te notam antes mesmo de você entrar em campo.',
    drawback: '−C$ 400 em manutenção imediata. 1 traço perde −20% — a vida boa distrai.',
    effect: { reputation: 15, coins: -400, traitDrainRandom: 20 },
  },
  {
    id: 'bike-speed',
    name: 'Bicicleta de Corrida',
    icon: '🚲',
    price: 250,
    category: 'veiculo',
    unique: true,
    benefit: '+3 reputação + 1 traço de velocidade ganha +20% de carga (você treina no caminho).',
    drawback: 'Nenhuma desvantagem real — só que todo mundo vai te zoar.',
    effect: { reputation: 3, traitBoostRandom: 20 },
  },

  // ── EXPERIÊNCIAS ──────────────────────────────────────────────────────────
  {
    id: 'treino-ex-pro',
    name: 'Treino com Ex-Jogador',
    icon: '🧑‍🏫',
    price: 1500,
    category: 'experiencia',
    unique: false,
    benefit: '1 traço aleatório recebe +35% de carga — treinamento de nível profissional.',
    drawback: '−C$ 300. Você perdeu semanas de partidas pagas.',
    effect: { coins: -300, traitBoostRandom: 35 },
  },
  {
    id: 'dieta-performance',
    name: 'Dieta de Alta Performance',
    icon: '🥗',
    price: 700,
    category: 'experiencia',
    unique: false,
    benefit: 'Todos os seus traços ganham +10% de carga.',
    drawback: '−C$ 200 e −3 reputação. Você sumiu das festas e das peladas sociais.',
    effect: { coins: -200, reputation: -3, traitBoostAll: 10 },
  },
  {
    id: 'academia',
    name: 'Academia de Musculação',
    icon: '💪',
    price: 800,
    category: 'experiencia',
    unique: false,
    benefit: 'Próxima partida com ×1.5 nos ganhos — você está mais forte.',
    drawback: '1 traço de drible perde −15% de carga. Você ficou pesado demais.',
    effect: { nextMatchMult: 1.5, traitDrainRandom: 15 },
  },
  {
    id: 'festa-bairro',
    name: 'Festa no Bairro',
    icon: '🎉',
    price: 450,
    category: 'experiencia',
    unique: false,
    benefit: '+10 reputação. Todo mundo sabe seu nome agora.',
    drawback: '−C$ 450 (você bancou a festa) e 1 traço perde −10% (ressaca, distração).',
    effect: { coins: -450, reputation: 10, traitDrainRandom: 10 },
  },
  {
    id: 'psicólogo-esportivo',
    name: 'Psicólogo Esportivo',
    icon: '🧠',
    price: 900,
    category: 'experiencia',
    unique: false,
    benefit: 'Todos os traços ganham +8% e próxima partida com ×1.3 nos ganhos.',
    drawback: '−5 reputação. Na sua época, isso é coisa de "fraco".',
    effect: { reputation: -5, traitBoostAll: 8, nextMatchMult: 1.3 },
  },

  // ── RISCO ──────────────────────────────────────────────────────────────────
  {
    id: 'pelada-clandestina',
    name: 'Pelada Clandestina',
    icon: '🎲',
    price: 300,
    category: 'risco',
    unique: false,
    benefit: '60% de chance: +C$ 700 e +5 rep. Você era o melhor em campo.',
    drawback: '40% de chance: −C$ 300 e 1 traço drena 30%. Deu ruim.',
    effect: {
      gamble: {
        winChance: 0.60,
        win: { coins: 700, reputation: 5 },
        lose: { coins: -300, traitDrain: 30 },
      },
    },
  },
  {
    id: 'bebida-energetica',
    name: 'Bebida Energética Proibida',
    icon: '⚡',
    price: 300,
    category: 'risco',
    unique: false,
    benefit: 'Próxima partida com ×1.8 nos ganhos — você voou em campo.',
    drawback: '1 traço drena −25% de carga. O efeito colateral apareceu logo depois.',
    effect: { nextMatchMult: 1.8, traitDrainRandom: 25 },
  },
  {
    id: 'bicho',
    name: 'Jogo do Bicho',
    icon: '🃏',
    price: 500,
    category: 'risco',
    unique: false,
    benefit: '45% de chance: +C$ 1.200. O bicho saiu certo.',
    drawback: '55% de chance: −C$ 500. O bicho saiu errado.',
    effect: {
      gamble: {
        winChance: 0.45,
        win: { coins: 1200 },
        lose: { coins: -500 },
      },
    },
  },
  {
    id: 'aposta-partida',
    name: 'Apostar na Própria Partida',
    icon: '💰',
    price: 600,
    category: 'risco',
    unique: false,
    benefit: '50%: +C$ 1.400. Você apostou em si mesmo e ganhou.',
    drawback: '50%: −C$ 600 e −5 rep. Alguém descobriu. Constrangedor.',
    effect: {
      gamble: {
        winChance: 0.50,
        win: { coins: 1400 },
        lose: { coins: -600, traitDrain: 0 },
      },
      reputation: -5,
    },
  },
]

export const CATEGORY_CONFIG: Record<MarketCategory, { label: string; color: string; bg: string; border: string }> = {
  equipamento: { label: 'EQUIPAMENTO',  color: '#D4A840', bg: 'rgba(212,168,64,0.06)',  border: 'rgba(212,168,64,0.2)' },
  veiculo:     { label: 'VEÍCULO',      color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)' },
  experiencia: { label: 'EXPERIÊNCIA',  color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.2)' },
  risco:       { label: 'RISCO',        color: '#E03535', bg: 'rgba(224,53,53,0.06)',   border: 'rgba(224,53,53,0.2)' },
}
