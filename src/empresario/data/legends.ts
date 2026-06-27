import type { Legend, SigningEvaluation, Personality, PlayerStatus } from '../types'

// Names are lightly fictionalized homages. Stories are inspired by real careers.
export const LEGENDS: Legend[] = [
  // ─── DISPONÍVEIS EM 1993 ────────────────────────────────────
  {
    id: 'r9',
    name: 'Ronaldo "Fenômeno"',
    nickname: 'R9',
    position: 'ATA',
    nationality: 'BR',
    birthYear: 1976,
    emergenceYear: 1993,
    peakYearStart: 1996,
    peakYearEnd: 2002,
    truePotential: 99,
    currentRating: 58,
    personality: 'humilde',
    status: 'base',
    signingFee: 1200,
    monthlyFee: 200,
    discoveryStory: 'Um garoto magrelo de 16 anos, dentes pra fora, treinando no São Cristóvão antes de ir pro Cruzeiro. Os ônibus do Rio que ele não tinha dinheiro pra pegar viraram lenda.',
    futureKnowledge: 'Vai marcar os 2 gols da final da Copa de 2002. Artilheiro de duas Copas. Duas vezes melhor do mundo antes dos 21. Os joelhos vão traí-lo — mas ele sempre volta. O maior 9 de todos os tempos.',
    club: 'Cruzeiro (base)',
  },
  {
    id: 'romario',
    name: 'Romário "Baixinho"',
    nickname: 'Baixinho',
    position: 'ATA',
    nationality: 'BR',
    birthYear: 1966,
    emergenceYear: 1993,
    peakYearStart: 1993,
    peakYearEnd: 1997,
    truePotential: 95,
    currentRating: 89,
    personality: 'difícil',
    status: 'estrela',
    signingFee: 12000,
    monthlyFee: 2500,
    discoveryStory: 'Já é craque no PSV. Mas quer voltar pro Brasil, brigar com todo mundo e marcar mil gols. Cuidar dele é cuidar de um furacão.',
    futureKnowledge: 'Melhor do mundo em 1994 e campeão do mundo nos EUA. Vai chegar aos 1000 gols na carreira. Genial dentro de campo, impossível fora dele.',
    club: 'PSV',
  },
  {
    id: 'bebeto',
    name: 'Bebeto Gama',
    nickname: 'Bebeto',
    position: 'ATA',
    nationality: 'BR',
    birthYear: 1964,
    emergenceYear: 1993,
    peakYearStart: 1993,
    peakYearEnd: 1995,
    truePotential: 86,
    currentRating: 82,
    personality: 'leal',
    status: 'estrela',
    signingFee: 6000,
    monthlyFee: 1200,
    discoveryStory: 'No Deportivo, fazendo a Espanha inteira aprender o nome dele. Profissional exemplar.',
    futureKnowledge: 'A dupla com o Baixinho vai ganhar a Copa de 94. O gesto de "ninar o bebê" vai rodar o mundo.',
    club: 'Deportivo',
  },
  {
    id: 'zizou',
    name: 'Zinedine "Zizou"',
    nickname: 'Zizou',
    position: 'MEI',
    nationality: 'FR',
    birthYear: 1972,
    emergenceYear: 1993,
    peakYearStart: 1998,
    peakYearEnd: 2004,
    truePotential: 98,
    currentRating: 67,
    personality: 'leal',
    status: 'pro',
    signingFee: 4500,
    monthlyFee: 800,
    discoveryStory: 'Filho de imigrantes argelinos, criado nos blocos de La Castellane em Marselha. Joga no Bordeaux. Tímido, elegante, com um toque de bola que parece roubar o tempo.',
    futureKnowledge: 'Dois gols de cabeça na final da Copa de 98. Bola de Ouro. Transferência recorde de €75M pro Real em 2001. O voleio de Glasgow em 2002 será o gol mais bonito da história da Champions.',
    club: 'Bordeaux',
  },

  // ─── SURGEM ATÉ 1996 ────────────────────────────────────────
  {
    id: 'denilson',
    name: 'Denílson Show',
    nickname: 'Denílson',
    position: 'MEI',
    nationality: 'BR',
    birthYear: 1977,
    emergenceYear: 1994,
    peakYearStart: 1996,
    peakYearEnd: 1999,
    truePotential: 84,
    currentRating: 50,
    personality: 'humilde',
    status: 'base',
    signingFee: 700,
    monthlyFee: 120,
    discoveryStory: 'Pernas de borracha nas categorias de base do São Paulo. As pedaladas dele vão hipnotizar o Morumbi.',
    futureKnowledge: 'Vai ser o jogador mais caro do MUNDO em 1998 — €31.5M pro Betis. As pedaladas valem ouro. Assine agora por centavos.',
    club: 'São Paulo (base)',
  },
  {
    id: 'henry',
    name: 'Thierry Henrique',
    nickname: 'Titi',
    position: 'ATA',
    nationality: 'FR',
    birthYear: 1977,
    emergenceYear: 1994,
    peakYearStart: 2002,
    peakYearEnd: 2006,
    truePotential: 93,
    currentRating: 38,
    personality: 'leal',
    status: 'base',
    signingFee: 600,
    monthlyFee: 110,
    discoveryStory: 'Um adolescente espigado de Les Ulis, subúrbio de Paris. O pai leva ele em todos os treinos do Monaco. Joga aberto pela ponta, ainda cru.',
    futureKnowledge: 'Vai virar centroavante no Arsenal e se tornar o maior artilheiro da história do clube. Campeão do mundo em 98 aos 20. Elegância e velocidade letais.',
    club: 'Monaco (base)',
  },
  {
    id: 'totti',
    name: 'Francesco "Il Capitano"',
    nickname: 'Totti',
    position: 'MEI',
    nationality: 'IT',
    birthYear: 1976,
    emergenceYear: 1993,
    peakYearStart: 1998,
    peakYearEnd: 2007,
    truePotential: 91,
    currentRating: 55,
    personality: 'leal',
    status: 'base',
    signingFee: 900,
    monthlyFee: 160,
    discoveryStory: 'Um menino de Roma que recusou a Lazio e o Milan porque só quer vestir uma camisa: a Roma. Vai jogar nela a vida inteira.',
    futureKnowledge: 'Símbolo eterno da Roma. Campeão do mundo em 2006. Nunca vai trair o clube — nem por todo o dinheiro da Europa. Lealdade que dá lucro e dor de cabeça.',
    club: 'Roma (base)',
  },

  // ─── SURGEM ATÉ 2000 ────────────────────────────────────────
  {
    id: 'dinho',
    name: 'Ronaldinho Alegria',
    nickname: 'Dinho',
    position: 'MEI',
    nationality: 'BR',
    birthYear: 1980,
    emergenceYear: 1997,
    peakYearStart: 2003,
    peakYearEnd: 2006,
    truePotential: 97,
    currentRating: 24,
    personality: 'difícil',
    status: 'pelada',
    signingFee: 250,
    monthlyFee: 60,
    discoveryStory: 'Um moleque de 13 anos no Grêmio que fez 23 gols numa partida de futsal — todos ele. Sorri o tempo todo, joga descalço na praia de Belém. Ama festa tanto quanto bola.',
    futureKnowledge: 'Melhor do mundo em 2004 e 2005. Vai fazer o Bernabéu aplaudir de pé um rival. Mas o amor pela noite vai encurtar o auge. Aproveite os anos dourados — eles passam rápido.',
    club: 'Grêmio (futsal)',
  },
  {
    id: 'kaka',
    name: 'Ricardo "Kaká"',
    nickname: 'Kaká',
    position: 'MEI',
    nationality: 'BR',
    birthYear: 1982,
    emergenceYear: 1999,
    peakYearStart: 2004,
    peakYearEnd: 2009,
    truePotential: 93,
    currentRating: 16,
    personality: 'leal',
    status: 'base',
    signingFee: 300,
    monthlyFee: 50,
    discoveryStory: 'Classe média de Brasília, jogando nas divisões de base do São Paulo. Educado, religioso, íntegro. Quase parou de jogar após uma fratura na coluna numa piscina aos 18.',
    futureKnowledge: 'Melhor do mundo em 2007 — o último antes da era Messi/CR7. €65M pro Real. Profissional impecável, nunca te dará dor de cabeça. Cuidado só com aquela lesão de coluna em 2000.',
    club: 'São Paulo (base)',
  },
  {
    id: 'adriano',
    name: 'Adriano "Imperador"',
    nickname: 'Imperador',
    position: 'ATA',
    nationality: 'BR',
    birthYear: 1982,
    emergenceYear: 1999,
    peakYearStart: 2004,
    peakYearEnd: 2006,
    truePotential: 90,
    currentRating: 14,
    personality: 'difícil',
    status: 'pelada',
    signingFee: 200,
    monthlyFee: 50,
    discoveryStory: 'Vila Cruzeiro, favela do Rio. Cresceu vendo tiroteio. Físico de touro, perna esquerda de canhão. O pai é tudo pra ele — o porto seguro de um menino frágil por dentro.',
    futureKnowledge: 'O atacante mais devastador do mundo entre 2004 e 2006. Mas a morte do pai em 2004 vai destruí-lo por dentro. Se você cuidar da cabeça dele, pode ser o maior 9 da história. Se não, vai desperdiçar tudo.',
    club: 'Flamengo (base)',
  },
  {
    id: 'robinho',
    name: 'Robinho Pedaladas',
    nickname: 'Robinho',
    position: 'ATA',
    nationality: 'BR',
    birthYear: 1984,
    emergenceYear: 2002,
    peakYearStart: 2005,
    peakYearEnd: 2008,
    truePotential: 87,
    currentRating: 9,
    personality: 'ambicioso',
    status: 'pelada',
    signingFee: 150,
    monthlyFee: 40,
    discoveryStory: 'Menino franzino de São Vicente, litoral paulista. Joga na base do Santos imitando o Pelé que a cidade venera. As pedaladas já fazem a torcida levantar.',
    futureKnowledge: 'Eleito melhor jovem do mundo em 2005. Vai pro Real Madrid. Precisa de estrutura e gente boa por perto — sozinho, se perde.',
    club: 'Santos (base)',
  },

  // ─── SURGEM ATÉ 2004 ────────────────────────────────────────
  {
    id: 'cr7',
    name: 'Cristiano "CR7"',
    nickname: 'CR7',
    position: 'ATA',
    nationality: 'PT',
    birthYear: 1985,
    emergenceYear: 2001,
    peakYearStart: 2007,
    peakYearEnd: 2018,
    truePotential: 99,
    currentRating: 8,
    personality: 'ambicioso',
    status: 'base',
    signingFee: 120,
    monthlyFee: 30,
    discoveryStory: 'Ilha da Madeira, família pobre. Aos 12 deixou tudo pra trás e foi sozinho pra Lisboa, no Sporting. Chora de saudade à noite mas treina como um possesso de dia. Ambição que não cabe na ilha.',
    futureKnowledge: 'Cinco Bolas de Ouro. Mais de 800 gols. Vai ao United aos 18 por €15M, depois ao Real por €94M (recorde). A máquina de trabalho mais obsessiva que o futebol já viu. Ego do tamanho do talento.',
    club: 'Sporting (base)',
  },
  {
    id: 'ibra',
    name: 'Zlatan "Ibra"',
    nickname: 'Ibra',
    position: 'ATA',
    nationality: 'NL',
    birthYear: 1981,
    emergenceYear: 1999,
    peakYearStart: 2008,
    peakYearEnd: 2016,
    truePotential: 91,
    currentRating: 12,
    personality: 'difícil',
    status: 'base',
    signingFee: 130,
    monthlyFee: 35,
    discoveryStory: 'Bairro de Rosengård, Malmö. Filho de imigrantes dos Bálcãs, roubava bicicletas quando criança. Arrogante, taekwondo no sangue, faz gols impossíveis e não respeita ninguém.',
    futureKnowledge: 'Vai jogar e marcar em TODOS os grandes da Europa: Ajax, Juve, Inter, Barça, Milan, PSG, United. Difícil como ninguém, mas entrega como poucos. Vai jogar até os 40.',
    club: 'Malmö (base)',
  },
  {
    id: 'messi',
    name: 'Lionel "La Pulga"',
    nickname: 'Messi',
    position: 'ATA',
    nationality: 'AR',
    birthYear: 1987,
    emergenceYear: 2003,
    peakYearStart: 2009,
    peakYearEnd: 2021,
    truePotential: 99,
    currentRating: 5,
    personality: 'humilde',
    status: 'pelada',
    signingFee: 80,
    monthlyFee: 25,
    discoveryStory: 'Rosário, Argentina. Um menino minúsculo de 11 anos com deficiência de hormônio de crescimento — o tratamento custa caro demais pra família. Nenhum clube argentino quer pagar. Só você sabe o que esse pirralho vai virar.',
    futureKnowledge: 'Oito Bolas de Ouro. O maior de todos os tempos. O Barça vai pagar o tratamento de crescimento dele num guardanapo de papel. Campeão do mundo em 2022. Se você assinar AGORA, é o maior golpe da história.',
    club: 'Newell\'s (infantil)',
  },
  {
    id: 'iniesta',
    name: 'Andrés "Don Andrés"',
    nickname: 'Iniesta',
    position: 'MEI',
    nationality: 'ES',
    birthYear: 1984,
    emergenceYear: 2002,
    peakYearStart: 2008,
    peakYearEnd: 2015,
    truePotential: 92,
    currentRating: 10,
    personality: 'humilde',
    status: 'base',
    signingFee: 140,
    monthlyFee: 35,
    discoveryStory: 'Menino tímido de Fuentealbilla, vilarejo de 2 mil habitantes. Foi pra La Masia aos 12 e chorou todas as noites de saudade. Silencioso, mas com inteligência de jogo de outro planeta.',
    futureKnowledge: 'O gol dele vai dar a Copa do Mundo de 2010 à Espanha. Cérebro do melhor time da história do Barça. Humilde a ponto de recusar os holofotes — o sonho de qualquer empresário.',
    club: 'La Masia',
  },
  {
    id: 'drogba',
    name: 'Didier "Tito"',
    nickname: 'Drogba',
    position: 'ATA',
    nationality: 'FR',
    birthYear: 1978,
    emergenceYear: 1998,
    peakYearStart: 2004,
    peakYearEnd: 2010,
    truePotential: 88,
    currentRating: 20,
    personality: 'leal',
    status: 'base',
    signingFee: 180,
    monthlyFee: 40,
    discoveryStory: 'Marfinense criado entre a Costa do Marfim e a França. Começou TARDE no profissional — só estourou perto dos 25. Quem tiver paciência vai ser recompensado.',
    futureKnowledge: 'Vai ser o herói do Chelsea, decidir uma final de Champions na marra em 2012. Maturação lenta: não desista dele cedo. E vai parar uma guerra civil no próprio país com um discurso.',
    club: 'Le Mans (amador)',
  },
]

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find(l => l.id === id)
}

export function getAvailableLegends(year: number, signedIds: string[]): Legend[] {
  return LEGENDS.filter(l =>
    year >= l.emergenceYear - 2 &&
    l.birthYear <= year - 10 &&
    !signedIds.includes(l.id)
  )
}

export function getCurrentStatus(legend: Legend, year: number): PlayerStatus {
  const age = year - legend.birthYear
  if (year >= legend.peakYearStart) return 'estrela'
  if (year >= legend.emergenceYear) return 'pro'
  if (age >= 15) return 'base'
  return 'pelada'
}

export function getCurrentRating(legend: Legend, year: number): number {
  const peakDuration = Math.max(1, legend.peakYearEnd - legend.peakYearStart)

  if (year < legend.emergenceYear) {
    // Pre-emergence: growing slowly from a low base
    const yearsToEmergence = legend.emergenceYear - year
    return Math.max(8, Math.round(legend.currentRating - yearsToEmergence * 4))
  }

  if (year < legend.peakYearStart) {
    const span = Math.max(1, legend.peakYearStart - legend.emergenceYear)
    const progress = (year - legend.emergenceYear) / span
    return Math.round(legend.currentRating + (legend.truePotential - 6 - legend.currentRating) * Math.min(1, progress))
  }

  if (year <= legend.peakYearEnd) {
    const peakProgress = Math.min(1, (year - legend.peakYearStart) / Math.max(1, peakDuration / 2))
    return Math.round(legend.truePotential - 4 + peakProgress * 4)
  }

  const decline = Math.min(35, (year - legend.peakYearEnd) * 4)
  return Math.max(50, legend.truePotential - decline)
}

export function getMarketValue(legend: Legend, year: number): number {
  const rating = getCurrentRating(legend, year)
  const base = Math.pow(rating / 48, 3.2) * 4500000
  const peakBonus = year >= legend.peakYearStart && year <= legend.peakYearEnd ? 1.9 : 1
  const eraInflation = 1 + Math.max(0, year - 1993) * 0.05
  return Math.max(0, Math.round(base * peakBonus * eraInflation / 1000) * 1000)
}

// ─── SIGNING ACCEPTANCE ────────────────────────────────────────
// Players DON'T accept any commission. Their willingness depends on
// personality, fame, your reputation, and the rate you ask.

const PERSONALITY_TOLERANCE: Record<Personality, number> = {
  humilde: 6,     // accepts a higher cut, grateful
  leal: 3,
  ambicioso: -4,  // knows their worth, fights for themselves
  difícil: -7,    // diva, will haggle hard
}

export function evaluateSigning(
  legend: Legend,
  rate: number,
  reputation: number,
  year: number,
): SigningEvaluation {
  const rating = getCurrentRating(legend, year)
  const status = getCurrentStatus(legend, year)

  // Base tolerance: an unknown kid is desperate, a star has leverage.
  let maxAcceptable = 18

  // Fame reduces what they'll accept (the better they are, the more leverage)
  maxAcceptable -= Math.max(0, (rating - 45)) * 0.28

  // Status modifier
  const statusBonus: Record<PlayerStatus, number> = {
    pelada: 10,   // nobody else wants them — they'll take any deal
    base: 5,
    pro: -2,
    estrela: -8,
  }
  maxAcceptable += statusBonus[status]

  // Personality
  maxAcceptable += PERSONALITY_TOLERANCE[legend.personality]

  // Your reputation lets you ask for more
  maxAcceptable += reputation * 0.12

  maxAcceptable = Math.round(Math.max(6, Math.min(30, maxAcceptable)))

  if (rate <= maxAcceptable) {
    return {
      result: 'accept',
      maxAcceptable,
      reason: rate <= maxAcceptable - 6
        ? `${legend.nickname} aceitou na hora — achou você generoso.`
        : `${legend.nickname} apertou sua mão. Negócio fechado.`,
    }
  }

  if (rate <= maxAcceptable + 5) {
    return {
      result: 'counter',
      maxAcceptable,
      reason: `${legend.nickname} achou ${rate}% salgado. Topa no máximo ${maxAcceptable}%.`,
    }
  }

  return {
    result: 'reject',
    maxAcceptable,
    reason: status === 'estrela'
      ? `${legend.nickname} riu na sua cara. "Você é um zé-ninguém querendo ${rate}%?"`
      : `${legend.nickname} recusou ${rate}%. Ganancioso demais — ele preferiu esperar outra proposta.`,
  }
}
