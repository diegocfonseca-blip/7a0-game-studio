import type { Legend, LegendStatus } from '../types/game'

export const LEGENDS: Legend[] = [
  {
    id: 'r9',
    name: 'Ronaldo Nazário',
    nickname: 'O Fenômeno',
    birthYear: 1976,
    country: 'Brasil',
    countryFlag: '🇧🇷',
    city: 'Belo Horizonte',
    region: 'brasil',
    story: 'Um garoto de 16 anos que veio do Rio sozinho, de ônibus, com uma mochila. Filho de operário e empregada doméstica. Está numa escolinha do Cruzeiro que ainda não sabe o que tem nas mãos. Treina descalço às vezes. O chute faz a trave tremer.',
    historicalNote: 'Nasceu em 1976 no Bento Ribeiro, subúrbio do Rio. Mudou-se para BH para treinar no Cruzeiro em 1991. Em 1993 assinaria seu primeiro contrato profissional e revelaria o Fenômeno ao mundo.',
    unlockYear: 1992,
    closeYear: 1993,
    position: 'Atacante',
    colorAccent: '#00c8ff',
    traits: [
      {
        id: 'r9-finish',
        name: 'Finalização do Fenômeno',
        description: 'O chute que para goleiros. Velocidade de execução impossível. Precisão sobrenatural dentro da área.',
        icon: '💥',
        cost: 3200,
        weeklyMaintenance: 280,
        conflictsWith: []
      },
      {
        id: 'r9-dribble',
        name: 'Ginga Carioca',
        description: 'O drible que vem do asfalto quente do Rio. Corpo que faz coisas que a física não explica.',
        icon: '🌀',
        cost: 2800,
        weeklyMaintenance: 220,
        conflictsWith: []
      },
      {
        id: 'r9-speed',
        name: 'Explosão em Sprint',
        description: 'Os primeiros 10 metros mais rápidos do futebol. Você simplesmente desaparece.',
        icon: '⚡',
        cost: 2400,
        weeklyMaintenance: 200,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'ronaldinho',
    name: 'Ronaldo de Assis Moreira',
    nickname: 'Ronaldinho Gaúcho',
    birthYear: 1980,
    country: 'Brasil',
    countryFlag: '🇧🇷',
    city: 'Porto Alegre',
    region: 'brasil',
    story: 'Um garoto de 12 anos da Vila Nova, Porto Alegre. Chuta com uma alegria que nenhum técnico ensina. Seu irmão Assis já joga no Grêmio. Em campo ele sorri mesmo quando perde. Algo no jeito dele jogar te faz parar pra olhar.',
    historicalNote: 'Nasceu em 1980 em Porto Alegre. Cresceu no bairro Vila Nova. Entrou no Grêmio ainda criança e virou profissional em 1998. Ganhou a Bola de Ouro em 2004 e 2005.',
    unlockYear: 1990,
    closeYear: 1998,
    position: 'Meia',
    colorAccent: '#ffd700',
    traits: [
      {
        id: 'rdinho-dribble',
        name: 'Pedalada Encantada',
        description: 'A finta que hipnotiza. Zagueiros treinados a vida toda não conseguem adivinhar.',
        icon: '🪄',
        cost: 3600,
        weeklyMaintenance: 260,
        conflictsWith: ['kaka-focus']
      },
      {
        id: 'rdinho-joy',
        name: 'Alegria Contagiante',
        description: 'Seu carisma transforma estádios. Torcedores te amam. Patrocínios dobram.',
        icon: '😄',
        cost: 2000,
        weeklyMaintenance: 180,
        conflictsWith: []
      },
      {
        id: 'rdinho-elastico',
        name: 'Elástico e Chapéu',
        description: 'O arsenal de humilhação. Elástico, chapéu, drible de calcanhar. Tudo no mesmo movimento.',
        icon: '🎭',
        cost: 2600,
        weeklyMaintenance: 210,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'adriano',
    name: 'Adriano Leite Ribeiro',
    nickname: 'Imperador',
    birthYear: 1982,
    country: 'Brasil',
    countryFlag: '🇧🇷',
    city: 'Rio de Janeiro',
    region: 'brasil',
    story: 'Um menino de 10 anos da favela Vila Cruzeiro. Quando chuta, os outros garotos recuam. O chute é tão forte que machuca a mão do goleiro mesmo em treino. Os adultos ao redor não sabem o que fazer com isso.',
    historicalNote: 'Nasceu em 1982 na Vila Cruzeiro, um dos bairros mais violentos do Rio. Entrou na base do Flamengo e virou profissional em 2000, indo depois para a Inter de Milão.',
    unlockYear: 1992,
    closeYear: 1999,
    position: 'Atacante',
    colorAccent: '#ff4444',
    traits: [
      {
        id: 'adriano-power',
        name: 'Canhão Imperador',
        description: 'O chute mais potente da história do futebol brasileiro. Goleiros preferem sair do caminho.',
        icon: '💣',
        cost: 3800,
        weeklyMaintenance: 340,
        conflictsWith: ['kaka-focus', 'rdinho-joy']
      },
      {
        id: 'adriano-physique',
        name: 'Físico de Touro',
        description: 'Zagueiros literalmente quicam nele. Disputas físicas que ele vence sem parecer que se esforçou.',
        icon: '🦬',
        cost: 3000,
        weeklyMaintenance: 290,
        conflictsWith: []
      },
      {
        id: 'adriano-penalty',
        name: 'Frieza no Pênalti',
        description: 'Sem pressão. Sem medo. A bola vai onde você quer. Sempre.',
        icon: '🎯',
        cost: 2200,
        weeklyMaintenance: 160,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'kaka',
    name: 'Ricardo Izecson dos Santos Leite',
    nickname: 'Kaká',
    birthYear: 1982,
    country: 'Brasil',
    countryFlag: '🇧🇷',
    city: 'São Paulo',
    region: 'brasil',
    story: 'Um garoto de 10 anos da classe média em São Paulo. Diferente da maioria, não cresceu na favela. Mas em campo tem uma visão que parece de outro plano. Entrou no São Paulo FC ainda criança. Sério, focado, silencioso.',
    historicalNote: 'Nasceu em 1982 em Gama, Brasília, mas cresceu em São Paulo. Entrou na base do São Paulo FC aos 8 anos. Campeão mundial pelo Milan em 2007. Bola de Ouro 2007.',
    unlockYear: 1992,
    closeYear: 2001,
    position: 'Meia',
    colorAccent: '#ac6000',
    traits: [
      {
        id: 'kaka-vision',
        name: 'Visão Sobrenatural',
        description: 'Você vê o passe 3 segundos antes de todos. O campo inteiro faz sentido de um jeito diferente.',
        icon: '👁️',
        cost: 3400,
        weeklyMaintenance: 240,
        conflictsWith: ['rdinho-joy', 'adriano-power']
      },
      {
        id: 'kaka-acceleration',
        name: 'Aceleração com Bola',
        description: 'A bola parece colada no pé mesmo em máxima velocidade. Impossível de acompanhar.',
        icon: '🏃',
        cost: 2800,
        weeklyMaintenance: 210,
        conflictsWith: []
      },
      {
        id: 'kaka-focus',
        name: 'Mentalidade de Campeão',
        description: 'Zero distrações. Treino é religião. Você evolui 30% mais rápido que todos ao redor.',
        icon: '🧘',
        cost: 2600,
        weeklyMaintenance: 190,
        conflictsWith: ['adriano-power', 'rdinho-joy']
      }
    ]
  },
  {
    id: 'roberto-carlos',
    name: 'Roberto Carlos da Silva',
    nickname: 'Roberto Carlos',
    birthYear: 1973,
    country: 'Brasil',
    countryFlag: '🇧🇷',
    city: 'Garça, SP',
    region: 'brasil',
    story: 'Um lateral de 19 anos do interior de SP. Baixinho, mas ninguém tem coragem de dizer isso quando ele bate numa falta de 35 metros. Está no União São João ainda. A janela está se fechando — o Palmeiras já está de olho.',
    historicalNote: 'Nasceu em 1973 em Garça, SP. Iniciou no União São João de Araras antes de ir ao Palmeiras. Lateral esquerdo mais famoso do Brasil. Campeão do Mundo 2002.',
    unlockYear: 1992,
    closeYear: 1994,
    position: 'Lateral',
    colorAccent: '#00ff88',
    traits: [
      {
        id: 'rc-freekick',
        name: 'Falta Impossível',
        description: 'A física não explica. A bola curva depois do desvio. Goleiros ficam parados olhando.',
        icon: '🌙',
        cost: 4000,
        weeklyMaintenance: 300,
        conflictsWith: []
      },
      {
        id: 'rc-speed',
        name: 'Foguete Lateral',
        description: 'Ponta a ponta em 6 segundos. Ataca e volta pra defender antes que você pisque.',
        icon: '🚀',
        cost: 2600,
        weeklyMaintenance: 220,
        conflictsWith: []
      },
      {
        id: 'rc-cross',
        name: 'Cruzamento Teleguiado',
        description: 'A bola cai exatamente na cabeça do atacante. Centenas de gols vêm dos seus pés.',
        icon: '📡',
        cost: 2000,
        weeklyMaintenance: 170,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'totti',
    name: 'Francesco Totti',
    nickname: 'Il Pupone',
    birthYear: 1976,
    country: 'Itália',
    countryFlag: '🇮🇹',
    city: 'Roma',
    region: 'europa-sul',
    story: 'Filho de Roma. 16 anos, já na base da Roma. Um garoto que nunca vai querer sair daquela cidade. Fiel até a morte. Em campo tem uma visão de jogo que não se ensina — e uma personalidade que não se compra.',
    historicalNote: 'Nasceu em Roma em 1976. Entrou na base da Roma aos 6 anos e nunca saiu. Estreou profissionalmente em 1993. Passou toda a carreira num único clube. Ídolo eterno da Roma.',
    unlockYear: 1992,
    closeYear: 1993,
    position: 'Meia',
    colorAccent: '#d4af37',
    traits: [
      {
        id: 'totti-vision',
        name: 'Genialidade Romana',
        description: 'O passe que ninguém viu. A jogada que só ele enxergou. Criatividade pura.',
        icon: '🏛️',
        cost: 3200,
        weeklyMaintenance: 240,
        conflictsWith: []
      },
      {
        id: 'totti-touch',
        name: 'Toque de Veludo',
        description: 'Primeiro toque que já coloca você em vantagem. A bola obedece como extensão do corpo.',
        icon: '🪶',
        cost: 2600,
        weeklyMaintenance: 200,
        conflictsWith: []
      },
      {
        id: 'totti-leadership',
        name: 'Liderança Eterna',
        description: 'Companheiros jogam 20% melhor perto de você. Sua presença eleva o time inteiro.',
        icon: '👑',
        cost: 2800,
        weeklyMaintenance: 220,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'beckham',
    name: 'David Beckham',
    nickname: 'Beckham',
    birthYear: 1975,
    country: 'Inglaterra',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    city: 'Londres',
    region: 'europa-norte',
    story: 'Um garoto de 17 anos de Leytonstone, East London. Treina cruzamentos sozinho por horas num campo vazio. Já está na academia do Manchester United. A janela está fechando — Alex Ferguson vai vê-lo logo.',
    historicalNote: 'Nasceu em 1975 em Leytonstone, Londres. Entrou na academia do Manchester United aos 14 anos. Estreou profissionalmente em 1992. Ícone global, cruzamento perfeito, Bola de Ouro 1999.',
    unlockYear: 1992,
    closeYear: 1993,
    position: 'Meia',
    colorAccent: '#c0c0c0',
    traits: [
      {
        id: 'beckham-cross',
        name: 'Cruzamento de Ouro',
        description: 'A bola entra na área como se tivesse GPS. Atacantes só precisam encostar.',
        icon: '🎯',
        cost: 3800,
        weeklyMaintenance: 280,
        conflictsWith: []
      },
      {
        id: 'beckham-freekick',
        name: 'Falta com Efeito',
        description: 'A curva que desafia goleiros. Precisa e elegante. Sempre no ângulo certo.',
        icon: '⚽',
        cost: 3200,
        weeklyMaintenance: 250,
        conflictsWith: []
      },
      {
        id: 'beckham-brand',
        name: 'Carisma de Marca',
        description: 'Fama que dobra seus patrocínios. Câmeras te procuram. Contratos chegam sozinhos.',
        icon: '📸',
        cost: 2400,
        weeklyMaintenance: 180,
        conflictsWith: ['kaka-focus']
      }
    ]
  },
  {
    id: 'henry',
    name: 'Thierry Henry',
    nickname: 'Titi',
    birthYear: 1977,
    country: 'França',
    countryFlag: '🇫🇷',
    city: 'Les Ulis, Paris',
    region: 'europa-oeste',
    story: 'Um garoto de 15 anos de Les Ulis, subúrbio de Paris. Filho de pais antilhanos. Velocidade que assusta adultos. Está na academia do Monaco. Em alguns anos vai virar um dos melhores da história.',
    historicalNote: 'Nasceu em 1977 em Les Ulis, Paris. Entrou na academia do Monaco aos 13 anos. Estreou em 1994. Artilheiro histórico do Arsenal e da seleção francesa. Campeão do Mundo 1998.',
    unlockYear: 1992,
    closeYear: 1995,
    position: 'Atacante',
    colorAccent: '#0055a4',
    traits: [
      {
        id: 'henry-speed',
        name: 'Velocidade de Cheetah',
        description: 'Em linha reta, ninguém alcança. Com bola, então, é injusto.',
        icon: '🐆',
        cost: 3400,
        weeklyMaintenance: 260,
        conflictsWith: []
      },
      {
        id: 'henry-control',
        name: 'Controle em Velocidade',
        description: 'Recebe em sprint e já está em vantagem. Ninguém faz isso com essa qualidade.',
        icon: '💎',
        cost: 3000,
        weeklyMaintenance: 230,
        conflictsWith: []
      },
      {
        id: 'henry-composure',
        name: 'Frieza Francesa',
        description: 'Quanto maior a pressão, mais calmo você fica. Gols em finais. Sempre.',
        icon: '🥶',
        cost: 2800,
        weeklyMaintenance: 210,
        conflictsWith: []
      }
    ]
  },
  {
    id: 'cr7',
    name: 'Cristiano Ronaldo dos Santos Aveiro',
    nickname: 'CR7',
    birthYear: 1985,
    country: 'Portugal',
    countryFlag: '🇵🇹',
    city: 'Funchal, Madeira',
    region: 'europa-oeste',
    story: 'Em 1992 ele tem apenas 7 anos e bate bola nas ruas de Santo António, Funchal. Filho de jardineiro e cozinheira. Você ainda não pode chegar nele. Mas o dia virá — e quando vier, você vai sentir do outro lado do continente.',
    historicalNote: 'Nasceu em 1985 em Funchal, Madeira. Jogou pelo Andorinha (1993-95), Nacional da Madeira (95-97) e entrou no Sporting CP aos 12 anos. Estreou em 2002. 5 Bolas de Ouro.',
    unlockYear: 1995,
    closeYear: 2002,
    position: 'Atacante',
    colorAccent: '#ff6b00',
    traits: [
      {
        id: 'cr7-header',
        name: 'Cabeçada Perfeita',
        description: 'Suspensão de 78cm. Timing que desafia a gravidade. Goleiros não se posicionam a tempo.',
        icon: '⬆️',
        cost: 3600,
        weeklyMaintenance: 320,
        conflictsWith: ['rdinho-joy']
      },
      {
        id: 'cr7-freekick',
        name: 'Knuckleball Letal',
        description: 'A falta que ninguém sabe pra onde vai. Nem o goleiro, nem você — mas entra.',
        icon: '🌀',
        cost: 3200,
        weeklyMaintenance: 280,
        conflictsWith: []
      },
      {
        id: 'cr7-mentality',
        name: 'Obsessão CR7',
        description: 'A dedicação que ninguém acompanha. Você cresce quando todos dormem. Imparável.',
        icon: '💪',
        cost: 4400,
        weeklyMaintenance: 380,
        conflictsWith: ['adriano-power', 'rdinho-joy']
      }
    ]
  },
  {
    id: 'messi',
    name: 'Lionel Andrés Messi',
    nickname: 'La Pulga',
    birthYear: 1987,
    country: 'Argentina',
    countryFlag: '🇦🇷',
    city: 'Rosário',
    region: 'americas',
    story: 'Em 1992 ele tem 5 anos em Rosário. Já chuta bola no quintal. Seu pai já nota algo diferente, mas é cedo demais. Quando chegar aos 10, você vai sentir do outro lado do continente. Por enquanto: espere. Ele vai chegar.',
    historicalNote: 'Nasceu em 1987 em Rosário, Argentina. Jogou pelo Grandoli e Newell\'s Old Boys. Diagnosticado com deficiência de hormônio de crescimento. O Barcelona pagou o tratamento — ele foi pra Espanha aos 13. 8 Bolas de Ouro.',
    unlockYear: 1997,
    closeYear: 2004,
    position: 'Atacante',
    colorAccent: '#87ceeb',
    traits: [
      {
        id: 'messi-dribble',
        name: 'Drible em Velocidade',
        description: 'Corpo baixo, bola no pé, 5 jogadores passando por baixo. Impossível de parar.',
        icon: '🐭',
        cost: 5000,
        weeklyMaintenance: 400,
        conflictsWith: []
      },
      {
        id: 'messi-finish',
        name: 'Finalização Rasteira',
        description: 'O gol no cantinho que nenhum goleiro alcança. Precisão de sniper.',
        icon: '🎯',
        cost: 4200,
        weeklyMaintenance: 350,
        conflictsWith: []
      },
      {
        id: 'messi-space',
        name: 'Leitura de Espaço',
        description: 'Você sempre está no lugar certo antes da bola chegar. Como se soubesse o futuro.',
        icon: '🔮',
        cost: 3800,
        weeklyMaintenance: 310,
        conflictsWith: []
      }
    ]
  }
]

export function getLegendStatus(legend: Legend, currentYear: number): LegendStatus {
  if (currentYear < legend.unlockYear) return 'locked'
  if (currentYear >= legend.closeYear) return 'closed'
  if (legend.closeYear - currentYear <= 1) return 'urgent'
  return 'available'
}

export function getLegendAge(legend: Legend, currentYear: number): number {
  return currentYear - legend.birthYear
}

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find(l => l.id === id)
}
