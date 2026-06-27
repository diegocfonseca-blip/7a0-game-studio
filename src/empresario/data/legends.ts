import type { Legend, SigningEvaluation, SigningResult, Personality, PlayerStatus } from '../types'

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
    luva: 2000,
    luvaReason: 'Pagar as passagens de ônibus e a mudança da família pro Rio. Eles são simples — mas o talento não tem preço.',
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
    luva: 16000,
    luvaReason: 'Ele é estrela e SABE. Exige uma luva gorda só pra te ouvir falar — e ainda vai reclamar que é pouco.',
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
    luva: 8000,
    luvaReason: 'No auge na Espanha. A luva reflete o status de quem já é craque e campeão.',
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
    luva: 6000,
    luvaReason: 'Já valorizado no Bordeaux. Luva alta — mas é Zidane. Barato pelo que ele vai virar.',
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
    luva: 1000,
    luvaReason: 'Família humilde de Diadema. A luva tira eles do aperto e garante a gratidão do moleque.',
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
    luva: 1200,
    luvaReason: 'O pai exige acompanhar a carreira de perto. A luva cobre as despesas da família em Les Ulis.',
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
    luva: 2200,
    luvaReason: 'Ele não sai de Roma por nada. A luva é pra convencer a vizinhança (e a Lazio) a deixá-lo com você.',
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
    luva: 1300,
    luvaReason: 'Uma casa perto da praia pra ele manter o sorriso — e longe das festas que vão encurtar o auge.',
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
    luva: 900,
    luvaReason: 'Família de classe média, tranquila. A luva é quase simbólica: um carro pro pai levá-lo aos treinos.',
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
    luva: 1800,
    luvaReason: 'Tirar a família da Vila Cruzeiro e comprar uma casa pro pai — que é tudo na vida desse menino frágil por dentro.',
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
    luva: 900,
    luvaReason: 'Bancar a mudança da família de São Vicente e botar gente de confiança do lado dele, pra ele não se perder.',
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
    luva: 1700,
    luvaReason: 'Bancar a mudança da Madeira pra Lisboa e o internato no Sporting. Ele chora de saudade, mas treina como louco.',
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
    luva: 700,
    luvaReason: 'Ele é arrogante e desconfiado. A luva baixa é o preço de ganhar a confiança de um moleque que cresceu roubando bicicleta.',
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
    luva: 5000,
    luvaReason: 'Pagar o tratamento de hormônio de crescimento que a família não pode bancar. Sem isso, ele literalmente não cresce. O investimento da sua vida.',
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
    luva: 1200,
    luvaReason: 'Despesas de La Masia e as visitas da família ao vilarejo. Menino tímido — precisa de acolhimento, não de pressão.',
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
    luva: 600,
    luvaReason: 'Começou tarde, ninguém aposta nele. Luva baixa: você é literalmente o único no mundo que acredita.',
    monthlyFee: 40,
    discoveryStory: 'Marfinense criado entre a Costa do Marfim e a França. Começou TARDE no profissional — só estourou perto dos 25. Quem tiver paciência vai ser recompensado.',
    futureKnowledge: 'Vai ser o herói do Chelsea, decidir uma final de Champions na marra em 2012. Maturação lenta: não desista dele cedo. E vai parar uma guerra civil no próprio país com um discurso.',
    club: 'Le Mans (amador)',
  },

  // ═══════════════════════════════════════════════════════════════
  //  CRAQUES E QUASE-LENDAS — mais dados, mais escolhas, mais mundo
  // ═══════════════════════════════════════════════════════════════

  // ─── BRASIL ──────────────────────────────────────────────────
  {
    id: 'rivaldo', name: 'Rivaldo Bola', nickname: 'Rivaldo', position: 'MEI', nationality: 'BR',
    birthYear: 1972, emergenceYear: 1994, peakYearStart: 1998, peakYearEnd: 2002, truePotential: 93, currentRating: 60,
    personality: 'ambicioso', status: 'pro', signingFee: 1400, luva: 2400,
    luvaReason: 'Veio da miséria de Recife, perdeu dentes de tão pobre. A luva muda a vida da família dele.',
    monthlyFee: 220,
    discoveryStory: 'Magrelo de pernas tortas do Recife, subnutrido na infância. Pé esquerdo abençoado.',
    futureKnowledge: 'Bola de Ouro em 1999. Gols impossíveis de bicicleta. Peça-chave do penta de 2002.',
    club: 'Palmeiras',
  },
  {
    id: 'rcarlos', name: 'Roberto Carlos', nickname: 'Homem-Bala', position: 'LAT', nationality: 'BR',
    birthYear: 1973, emergenceYear: 1993, peakYearStart: 1997, peakYearEnd: 2003, truePotential: 90, currentRating: 64,
    personality: 'leal', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'Trabalhou em fábrica têxtil quando criança. Coxas de aço forjadas no trabalho duro.',
    monthlyFee: 200,
    discoveryStory: 'Lateral baixinho com coxas descomunais. O chute mais forte que o futebol já viu.',
    futureKnowledge: 'A falta impossível contra a França em 1997 desafia a física. Lenda do Real Madrid.',
    club: 'Palmeiras',
  },
  {
    id: 'cafu', name: 'Cafu Pendolino', nickname: 'Cafu', position: 'LAT', nationality: 'BR',
    birthYear: 1970, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 2004, truePotential: 88, currentRating: 66,
    personality: 'leal', status: 'pro', signingFee: 1100, luva: 1600,
    luvaReason: 'Reprovado em 9 peneiras por ser franzino. Quase desistiu. A luva é o reconhecimento que faltou.',
    monthlyFee: 180,
    discoveryStory: 'Da Jardim Irene, periferia de SP. Corre a lateral inteira sem cansar — por isso "Pendolino".',
    futureKnowledge: 'Único capitão a levantar a Copa do Mundo (2002) sendo bicampeão. Maratonista da lateral.',
    club: 'São Paulo',
  },
  {
    id: 'juninho', name: 'Juninho Pernambucano', nickname: 'Juninho', position: 'MEI', nationality: 'BR',
    birthYear: 1975, emergenceYear: 1995, peakYearStart: 2001, peakYearEnd: 2007, truePotential: 86, currentRating: 52,
    personality: 'leal', status: 'base', signingFee: 700, luva: 900,
    luvaReason: 'Família humilde de Recife. A luva garante tranquilidade pros estudos do irmão.',
    monthlyFee: 120,
    discoveryStory: 'Meia técnico do Sport. Treina cobrança de falta horas após o treino acabar.',
    futureKnowledge: 'O MAIOR batedor de faltas da história. Vai reinventar o Lyon na França.',
    club: 'Sport',
  },
  {
    id: 'lucio', name: 'Lúcio Muralha', nickname: 'Lúcio', position: 'ZAG', nationality: 'BR',
    birthYear: 1978, emergenceYear: 1998, peakYearStart: 2004, peakYearEnd: 2010, truePotential: 86, currentRating: 40,
    personality: 'leal', status: 'base', signingFee: 400, luva: 600,
    luvaReason: 'Roça do interior de Brasília. A luva compra a casa que a mãe sempre quis.',
    monthlyFee: 90,
    discoveryStory: 'Zagueiro gigante que adora subir pro ataque. Forte como touro.',
    futureKnowledge: 'Campeão do mundo em 2002 e da Champions em 2010 com a Inter. Defensor que vira artilheiro.',
    club: 'Internacional (base)',
  },
  {
    id: 'pato', name: 'Alexandre Pato', nickname: 'Pato', position: 'ATA', nationality: 'BR',
    birthYear: 1989, emergenceYear: 2006, peakYearStart: 2008, peakYearEnd: 2011, truePotential: 86, currentRating: 8,
    personality: 'ambicioso', status: 'pelada', signingFee: 130, luva: 700,
    luvaReason: 'Menino de Pato Branco (PR). A luva tira a família do interior pro grande centro.',
    monthlyFee: 30,
    discoveryStory: 'Garoto-prodígio do Inter, veloz e finalizador. Estoura cedo demais.',
    futureKnowledge: 'Vai ao Milan aos 17 e vira sensação. Mas lesões musculares vão minar o auge precoce.',
    club: 'Internacional (base)',
  },

  // ─── ARGENTINA ───────────────────────────────────────────────
  {
    id: 'veron', name: 'Juan Verón', nickname: 'La Brujita', position: 'MEI', nationality: 'AR',
    birthYear: 1975, emergenceYear: 1995, peakYearStart: 1999, peakYearEnd: 2002, truePotential: 88, currentRating: 52,
    personality: 'difícil', status: 'base', signingFee: 800, luva: 1300,
    luvaReason: 'Filho de jogador famoso ("La Bruja"). Carrega o peso do sobrenome — a luva é status.',
    monthlyFee: 140,
    discoveryStory: 'Meia de passe milimétrico do Estudiantes. Visão de jogo de outro mundo.',
    futureKnowledge: 'Transferência milionária pro Lazio e depois United. Lançamentos de 40 metros perfeitos.',
    club: 'Estudiantes',
  },
  {
    id: 'crespo', name: 'Hernán Crespo', nickname: 'Crespo', position: 'ATA', nationality: 'AR',
    birthYear: 1975, emergenceYear: 1995, peakYearStart: 2000, peakYearEnd: 2004, truePotential: 87, currentRating: 54,
    personality: 'leal', status: 'base', signingFee: 750, luva: 1200,
    luvaReason: 'Família trabalhadora de Buenos Aires. A luva realiza o sonho da casa própria.',
    monthlyFee: 130,
    discoveryStory: 'Centroavante matador do River. Faro de gol absurdo na área.',
    futureKnowledge: 'Vai ser transferência recorde mundial pra Lazio em 2000. Artilheiro por onde passa.',
    club: 'River Plate',
  },
  {
    id: 'riquelme', name: 'Juan Riquelme', nickname: 'Román', position: 'MEI', nationality: 'AR',
    birthYear: 1978, emergenceYear: 1997, peakYearStart: 2005, peakYearEnd: 2008, truePotential: 89, currentRating: 44,
    personality: 'difícil', status: 'base', signingFee: 600, luva: 1100,
    luvaReason: 'Um dos onze irmãos numa casa pobre de Don Torcuato. A luva sustenta a família toda.',
    monthlyFee: 110,
    discoveryStory: 'O último camisa 10 clássico. Lento de pé, rápido de cabeça. Ídolo do Boca.',
    futureKnowledge: 'Maestro absoluto. Vai encantar com a Argentina e o Villarreal. Gênio temperamental.',
    club: 'Boca Juniors',
  },
  {
    id: 'aimar', name: 'Pablo Aimar', nickname: 'El Payaso', position: 'MEI', nationality: 'AR',
    birthYear: 1979, emergenceYear: 1999, peakYearStart: 2001, peakYearEnd: 2004, truePotential: 86, currentRating: 28,
    personality: 'humilde', status: 'pelada', signingFee: 250, luva: 800,
    luvaReason: 'De Río Cuarto, interior argentino. A luva paga a mudança da família pra Buenos Aires.',
    monthlyFee: 60,
    discoveryStory: 'Baixinho driblador do River. O ídolo de infância de um tal de Messi.',
    futureKnowledge: 'Vai brilhar no Valencia campeão. O jogador favorito do próprio Messi.',
    club: 'River Plate (base)',
  },
  {
    id: 'tevez', name: 'Carlos Tévez', nickname: 'Apache', position: 'ATA', nationality: 'AR',
    birthYear: 1984, emergenceYear: 2001, peakYearStart: 2007, peakYearEnd: 2012, truePotential: 88, currentRating: 16,
    personality: 'ambicioso', status: 'pelada', signingFee: 180, luva: 900,
    luvaReason: 'Do Fuerte Apache, favela perigosa de Buenos Aires. Cicatriz no pescoço de uma queimadura. A luva é a fuga da miséria.',
    monthlyFee: 40,
    discoveryStory: 'Guerreiro de raça do Boca, peito enorme. Joga cada bola como se fosse a última.',
    futureKnowledge: 'Vai brilhar no United, City e Juventus. Coração e raça que conquistam qualquer torcida.',
    club: 'Boca Juniors (base)',
  },
  {
    id: 'mascherano', name: 'Javier Mascherano', nickname: 'Jefecito', position: 'MEI', nationality: 'AR',
    birthYear: 1984, emergenceYear: 2003, peakYearStart: 2008, peakYearEnd: 2015, truePotential: 85, currentRating: 12,
    personality: 'leal', status: 'base', signingFee: 150, luva: 600,
    luvaReason: 'De San Lorenzo (Santa Fe). A luva ajuda a família simples e trabalhadora.',
    monthlyFee: 35,
    discoveryStory: 'Volante incansável, primeiro round de marcação. Líder nato apesar de baixinho.',
    futureKnowledge: 'Vai virar zagueiro lendário do Barça de Guardiola. O "Jefecito" da seleção.',
    club: 'River Plate (base)',
  },

  // ─── FRANÇA ──────────────────────────────────────────────────
  {
    id: 'vieira', name: 'Patrick Vieira', nickname: 'Vieira', position: 'MEI', nationality: 'FR',
    birthYear: 1976, emergenceYear: 1995, peakYearStart: 2001, peakYearEnd: 2005, truePotential: 88, currentRating: 48,
    personality: 'leal', status: 'base', signingFee: 600, luva: 1000,
    luvaReason: 'Nascido em Dakar, Senegal, criado na França. A luva ajuda a família imigrante.',
    monthlyFee: 110,
    discoveryStory: 'Volante gigante e elegante. Domina o meio-campo com passadas enormes.',
    futureKnowledge: 'Motor do Arsenal "Invencível". Campeão do mundo em 98 aos 22.',
    club: 'Cannes',
  },
  {
    id: 'trezeguet', name: 'David Trezeguet', nickname: 'Trezegol', position: 'ATA', nationality: 'FR',
    birthYear: 1977, emergenceYear: 1995, peakYearStart: 2000, peakYearEnd: 2006, truePotential: 86, currentRating: 44,
    personality: 'leal', status: 'base', signingFee: 550, luva: 900,
    luvaReason: 'Argentino-francês criado na Argentina. A luva banca o retorno e a adaptação na Europa.',
    monthlyFee: 100,
    discoveryStory: 'Matador de área puro. Cabeceio e finalização clínicos. Quase não desperdiça.',
    futureKnowledge: 'O gol de ouro que dá a Euro 2000 à França. Artilheiro implacável da Juventus.',
    club: 'Platense',
  },
  {
    id: 'ribery', name: 'Franck Ribéry', nickname: 'Scarface', position: 'MEI', nationality: 'FR',
    birthYear: 1983, emergenceYear: 2004, peakYearStart: 2008, peakYearEnd: 2013, truePotential: 88, currentRating: 10,
    personality: 'difícil', status: 'pelada', signingFee: 120, luva: 500,
    luvaReason: 'Cicatriz no rosto de um acidente de carro na infância. Jogou em times amadores e na construção civil. A luva é a virada de vida.',
    monthlyFee: 30,
    discoveryStory: 'Veio das ligas amadoras e da obra. Drible elétrico pela ponta, garra de quem sofreu.',
    futureKnowledge: 'Vai ser o craque do Bayern por uma década. Histórico de superação puro.',
    club: 'Boulogne (amador)',
  },

  // ─── ITÁLIA ──────────────────────────────────────────────────
  {
    id: 'delpiero', name: 'Alessandro Del Piero', nickname: 'Pinturicchio', position: 'ATA', nationality: 'IT',
    birthYear: 1974, emergenceYear: 1994, peakYearStart: 1997, peakYearEnd: 2008, truePotential: 90, currentRating: 58,
    personality: 'leal', status: 'base', signingFee: 900, luva: 1500,
    luvaReason: 'Filho de eletricista, queria ser caminhoneiro. A luva muda o destino da família.',
    monthlyFee: 160,
    discoveryStory: 'Meia-atacante de toque refinado. O "gol à la Del Piero" no ângulo já é marca registrada.',
    futureKnowledge: 'Ídolo eterno da Juventus, fiel mesmo na queda à Série B. Campeão do mundo em 2006.',
    club: 'Padova',
  },
  {
    id: 'buffon', name: 'Gianluigi Buffon', nickname: 'Gigi', position: 'GOL', nationality: 'IT',
    birthYear: 1978, emergenceYear: 1995, peakYearStart: 2003, peakYearEnd: 2012, truePotential: 92, currentRating: 50,
    personality: 'leal', status: 'base', signingFee: 800, luva: 1200,
    luvaReason: 'Família de atletas de Carrara. A luva é o investimento numa carreira de goleiro improvável.',
    monthlyFee: 140,
    discoveryStory: 'Goleiro adolescente do Parma com reflexos sobrenaturais. Já manda como veterano.',
    futureKnowledge: 'O melhor goleiro de uma geração. Goleiro mais caro da história em 2001. Campeão do mundo em 2006.',
    club: 'Parma',
  },
  {
    id: 'pirlo', name: 'Andrea Pirlo', nickname: 'L\'Architetto', position: 'MEI', nationality: 'IT',
    birthYear: 1979, emergenceYear: 1998, peakYearStart: 2006, peakYearEnd: 2012, truePotential: 90, currentRating: 36,
    personality: 'humilde', status: 'base', signingFee: 400, luva: 700,
    luvaReason: 'Família de classe média de Brescia. A luva é quase simbólica — ele só quer jogar.',
    monthlyFee: 90,
    discoveryStory: 'Meia clássico recuado, passe cirúrgico. Calmo como ninguém com a bola nos pés.',
    futureKnowledge: 'Vai reinventar a posição de volante criativo. Maestro do Milan e da Juve. Faltas perfeitas.',
    club: 'Brescia',
  },
  {
    id: 'baggio', name: 'Roberto Baggio', nickname: 'Divin Codino', position: 'ATA', nationality: 'IT',
    birthYear: 1967, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1995, truePotential: 92, currentRating: 84,
    personality: 'humilde', status: 'estrela', signingFee: 7000, luva: 9000,
    luvaReason: 'Já é estrela mundial e budista zen. A luva reflete o status de quem já é craque consagrado.',
    monthlyFee: 1800,
    discoveryStory: 'O rabo-de-cavalo divino. Talento puro, melancólico e genial. Já brilha na Juventus.',
    futureKnowledge: 'Melhor do mundo em 1993. Vai carregar a Itália à final de 94 — e perder o pênalti decisivo.',
    club: 'Juventus',
  },
  {
    id: 'nesta', name: 'Alessandro Nesta', nickname: 'Nesta', position: 'ZAG', nationality: 'IT',
    birthYear: 1976, emergenceYear: 1994, peakYearStart: 2000, peakYearEnd: 2007, truePotential: 89, currentRating: 54,
    personality: 'leal', status: 'base', signingFee: 700, luva: 1100,
    luvaReason: 'Romano torcedor da Lazio desde criança. A luva é o sonho realizado da família.',
    monthlyFee: 130,
    discoveryStory: 'Zagueiro elegante que desarma sem faltas. Beleza pura na arte de defender.',
    futureKnowledge: 'O zagueiro mais elegante da sua geração. Pilar da Lazio e do Milan. Campeão do mundo em 2006.',
    club: 'Lazio',
  },

  // ─── ESPANHA ─────────────────────────────────────────────────
  {
    id: 'raul', name: 'Raúl González', nickname: 'El Ángel', position: 'ATA', nationality: 'ES',
    birthYear: 1977, emergenceYear: 1994, peakYearStart: 1999, peakYearEnd: 2003, truePotential: 89, currentRating: 50,
    personality: 'leal', status: 'base', signingFee: 700, luva: 1100,
    luvaReason: 'De Madri, família operária. Saiu da base do Atleti por dinheiro — a luva conta.',
    monthlyFee: 120,
    discoveryStory: 'Atacante jovem e faminto do Real Madrid. Frieza absurda na finalização.',
    futureKnowledge: 'Maior artilheiro da história do Real (até a chegada do CR7). Capitão e símbolo.',
    club: 'Real Madrid (base)',
  },
  {
    id: 'xavi', name: 'Xavi Hernández', nickname: 'Xavi', position: 'MEI', nationality: 'ES',
    birthYear: 1980, emergenceYear: 1998, peakYearStart: 2008, peakYearEnd: 2013, truePotential: 92, currentRating: 32,
    personality: 'humilde', status: 'base', signingFee: 350, luva: 700,
    luvaReason: 'De Terrassa, perto de Barcelona. Família apaixonada por futebol. Luva modesta.',
    monthlyFee: 80,
    discoveryStory: 'Cérebro de La Masia. Nunca perde a bola, sempre acha o passe. Vê o jogo em câmera lenta.',
    futureKnowledge: 'O metrônomo do melhor time da história. Campeão do mundo em 2010. O tiki-taka em pessoa.',
    club: 'La Masia',
  },
  {
    id: 'casillas', name: 'Iker Casillas', nickname: 'San Iker', position: 'GOL', nationality: 'ES',
    birthYear: 1981, emergenceYear: 1999, peakYearStart: 2007, peakYearEnd: 2012, truePotential: 90, currentRating: 26,
    personality: 'leal', status: 'base', signingFee: 300, luva: 600,
    luvaReason: 'De Móstoles, Madri. A luva ajuda os pais funcionários públicos.',
    monthlyFee: 70,
    discoveryStory: 'Goleiro-menino do Real com reflexos de gato. Calmo e maduro além da idade.',
    futureKnowledge: 'O Santo. Defesas milagrosas que vão dar a Copa de 2010 à Espanha. Capitão eterno do Real.',
    club: 'Real Madrid (base)',
  },
  {
    id: 'torres', name: 'Fernando Torres', nickname: 'El Niño', position: 'ATA', nationality: 'ES',
    birthYear: 1984, emergenceYear: 2001, peakYearStart: 2007, peakYearEnd: 2009, truePotential: 87, currentRating: 16,
    personality: 'humilde', status: 'base', signingFee: 180, luva: 700,
    luvaReason: 'Torcedor do Atleti de Fuenlabrada. A luva concretiza o sonho do menino.',
    monthlyFee: 40,
    discoveryStory: 'Atacante loiro veloz, ídolo precoce do Atlético. Carinha de criança, faro de matador.',
    futureKnowledge: 'O gol que dá a Euro 2008 à Espanha. Vai brilhar no Liverpool. Velocidade e classe.',
    club: 'Atlético de Madrid (base)',
  },

  // ─── PORTUGAL ────────────────────────────────────────────────
  {
    id: 'figo', name: 'Luís Figo', nickname: 'Figo', position: 'MEI', nationality: 'PT',
    birthYear: 1972, emergenceYear: 1993, peakYearStart: 1998, peakYearEnd: 2002, truePotential: 91, currentRating: 58,
    personality: 'ambicioso', status: 'pro', signingFee: 1100, luva: 1700,
    luvaReason: 'De um bairro operário de Lisboa. A luva é o salto de status que ele tanto busca.',
    monthlyFee: 170,
    discoveryStory: 'Ponta driblador do Sporting, cruzamento perfeito. Ambição de ser o maior.',
    futureKnowledge: 'Bola de Ouro 2000. A transferência mais polêmica da história: do Barça pro Real inimigo.',
    club: 'Sporting',
  },
  {
    id: 'deco', name: 'Anderson Deco', nickname: 'Deco', position: 'MEI', nationality: 'PT',
    birthYear: 1977, emergenceYear: 1997, peakYearStart: 2004, peakYearEnd: 2006, truePotential: 86, currentRating: 44,
    personality: 'leal', status: 'base', signingFee: 450, luva: 700,
    luvaReason: 'Brasileiro de São Bernardo que vai se naturalizar português. A luva banca a ida pra Europa.',
    monthlyFee: 100,
    discoveryStory: 'Meia brasileiro que ninguém quis no Brasil. Vai brilhar de verde e vermelho.',
    futureKnowledge: 'Cérebro do Porto de Mourinho e do Barça campeão. Duas Champions com clubes diferentes.',
    club: 'Corinthians (base)',
  },

  // ─── HOLANDA ─────────────────────────────────────────────────
  {
    id: 'kluivert', name: 'Patrick Kluivert', nickname: 'Kluivert', position: 'ATA', nationality: 'NL',
    birthYear: 1976, emergenceYear: 1994, peakYearStart: 1998, peakYearEnd: 2002, truePotential: 87, currentRating: 50,
    personality: 'difícil', status: 'base', signingFee: 500, luva: 900,
    luvaReason: 'De Amsterdã, filho de surinamês. Talento precoce e estilo de vida caro.',
    monthlyFee: 110,
    discoveryStory: 'Centroavante elegante do Ajax. Aos 18 já decide final de Champions.',
    futureKnowledge: 'Marca o gol do título da Champions de 1995 aos 18 anos. Craque do Barça. Talento que pede pulso firme.',
    club: 'Ajax',
  },
  {
    id: 'davids', name: 'Edgar Davids', nickname: 'Pitbull', position: 'MEI', nationality: 'NL',
    birthYear: 1973, emergenceYear: 1994, peakYearStart: 1998, peakYearEnd: 2003, truePotential: 86, currentRating: 52,
    personality: 'difícil', status: 'base', signingFee: 500, luva: 800,
    luvaReason: 'De Paramaribo, Suriname. Óculos especiais por glaucoma. A luva é independência.',
    monthlyFee: 100,
    discoveryStory: 'Volante de rastro com óculos e dreadlocks. Marca como um pitbull, sai jogando como meia.',
    futureKnowledge: 'Motor do meio-campo da Juventus e da Holanda. Raça e técnica raras de achar juntas.',
    club: 'Ajax',
  },

  // ─── ALEMANHA ────────────────────────────────────────────────
  {
    id: 'ballack', name: 'Michael Ballack', nickname: 'Ballack', position: 'MEI', nationality: 'DE',
    birthYear: 1976, emergenceYear: 1997, peakYearStart: 2002, peakYearEnd: 2008, truePotential: 88, currentRating: 44,
    personality: 'ambicioso', status: 'base', signingFee: 500, luva: 900,
    luvaReason: 'Da antiga Alemanha Oriental. A luva é a ascensão de um menino do leste.',
    monthlyFee: 100,
    discoveryStory: 'Meia completo: chega na área, cabeceia, chuta de longe. Líder silencioso.',
    futureKnowledge: 'Capitão da Alemanha vice-campeã do mundo em 2002. Craque do Bayern e Chelsea. O eterno vice.',
    club: 'Kaiserslautern',
  },
  {
    id: 'kahn', name: 'Oliver Kahn', nickname: 'Der Titan', position: 'GOL', nationality: 'DE',
    birthYear: 1969, emergenceYear: 1994, peakYearStart: 2001, peakYearEnd: 2002, truePotential: 88, currentRating: 64,
    personality: 'difícil', status: 'pro', signingFee: 900, luva: 1300,
    luvaReason: 'De Karlsruhe. Perfeccionista obsessivo. A luva é o reconhecimento que ele exige.',
    monthlyFee: 150,
    discoveryStory: 'Goleiro feroz e gritão. Domina a área como um monstro. Intimida atacantes só com o olhar.',
    futureKnowledge: 'Melhor jogador da Copa de 2002 — único goleiro a levar o prêmio. Muralha do Bayern.',
    club: 'Karlsruher',
  },

  // ─── INGLATERRA ──────────────────────────────────────────────
  {
    id: 'beckham', name: 'David Beckham', nickname: 'Becks', position: 'MEI', nationality: 'EN',
    birthYear: 1975, emergenceYear: 1995, peakYearStart: 1999, peakYearEnd: 2003, truePotential: 88, currentRating: 48,
    personality: 'ambicioso', status: 'base', signingFee: 600, luva: 1200,
    luvaReason: 'De Londres, torcedor fanático do United desde criança. Vira ícone pop — a luva é só o começo.',
    monthlyFee: 110,
    discoveryStory: 'Meia da base do United com o cruzamento e a falta mais precisos do mundo.',
    futureKnowledge: 'Gol do meio-campo em 1996 o torna famoso. Vira ícone global. Faltas de outro planeta.',
    club: 'Manchester United (base)',
  },
  {
    id: 'owen', name: 'Michael Owen', nickname: 'Wonderboy', position: 'ATA', nationality: 'EN',
    birthYear: 1979, emergenceYear: 1997, peakYearStart: 1998, peakYearEnd: 2004, truePotential: 87, currentRating: 36,
    personality: 'humilde', status: 'base', signingFee: 400, luva: 800,
    luvaReason: 'De Chester, filho de ex-jogador. A luva ajuda a família modesta do interior.',
    monthlyFee: 90,
    discoveryStory: 'Garoto-prodígio veloz do Liverpool. Arranca do meio-campo e não perdoa.',
    futureKnowledge: 'O gol solo contra a Argentina em 98 aos 18 choca o mundo. Bola de Ouro em 2001. Lesões precoces.',
    club: 'Liverpool (base)',
  },
  {
    id: 'gerrard', name: 'Steven Gerrard', nickname: 'Stevie G', position: 'MEI', nationality: 'EN',
    birthYear: 1980, emergenceYear: 1998, peakYearStart: 2005, peakYearEnd: 2009, truePotential: 89, currentRating: 32,
    personality: 'leal', status: 'base', signingFee: 350, luva: 700,
    luvaReason: 'De Huyton, subúrbio operário de Liverpool. Torcedor desde sempre. A luva é orgulho da família.',
    monthlyFee: 80,
    discoveryStory: 'Meia box-to-box do Liverpool com chute de fora da área devastador. Coração vermelho.',
    futureKnowledge: 'O capitão da "Noite de Istambul" 2005, vira o 3x0 sozinho. Lealdade eterna ao Liverpool.',
    club: 'Liverpool (base)',
  },
  {
    id: 'lampard', name: 'Frank Lampard', nickname: 'Lamps', position: 'MEI', nationality: 'EN',
    birthYear: 1978, emergenceYear: 1996, peakYearStart: 2004, peakYearEnd: 2010, truePotential: 87, currentRating: 44,
    personality: 'leal', status: 'base', signingFee: 400, luva: 700,
    luvaReason: 'Filho de ex-jogador do West Ham. Estudioso, tira nota alta na escola. Luva modesta.',
    monthlyFee: 90,
    discoveryStory: 'Meia chegador do West Ham. Chega na área como ninguém e finaliza de primeira.',
    futureKnowledge: 'Maior artilheiro da história do Chelsea. Chegada de área perfeita, gols de meia toda temporada.',
    club: 'West Ham (base)',
  },
]

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find(l => l.id === id)
}

// ─── SCOUT REGIONS ─────────────────────────────────────────────
// Brazil is unlocked from the start. Other countries require hiring
// a regional scout in the office.
import type { Nationality } from '../types'

export const SCOUT_REGIONS: Record<string, { label: string; flag: string; nationalities: Nationality[]; stars: string }> = {
  AR: { label: 'Argentina', flag: '🇦🇷', nationalities: ['AR'], stars: 'La Pulga e a nova geração argentina' },
  FR: { label: 'França', flag: '🇫🇷', nationalities: ['FR'], stars: 'Zidane, Henry, Drogba' },
  IT: { label: 'Itália', flag: '🇮🇹', nationalities: ['IT'], stars: 'Totti e o calcio' },
  IB: { label: 'Ibéria', flag: '🇵🇹', nationalities: ['PT', 'ES'], stars: 'CR7, Iniesta, Raúl, Xavi, Figo' },
  NO: { label: 'Europa do Norte', flag: '🇳🇱', nationalities: ['NL', 'DE'], stars: 'Ibra, Kluivert, Ballack, Kahn' },
  EN: { label: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', nationalities: ['EN'], stars: 'Beckham, Gerrard, Lampard, Owen' },
}

export function getUnlockedNationalities(purchasedUpgrades: string[]): Nationality[] {
  const nats: Nationality[] = ['BR'] // Brasil sempre liberado
  for (const up of purchasedUpgrades) {
    if (up.startsWith('scout-')) {
      const region = SCOUT_REGIONS[up.replace('scout-', '')]
      if (region) nats.push(...region.nationalities)
    }
  }
  return nats
}

export function getLockedRegions(purchasedUpgrades: string[]): string[] {
  return Object.keys(SCOUT_REGIONS).filter(r => !purchasedUpgrades.includes(`scout-${r}`))
}

export function getAvailableLegends(
  year: number,
  signedIds: string[],
  unlockedNats: Nationality[],
  lostLegends: string[] = [],
): Legend[] {
  return LEGENDS.filter(l =>
    year >= l.emergenceYear - 2 &&
    l.birthYear <= year - 10 &&
    !signedIds.includes(l.id) &&
    !lostLegends.includes(l.id) &&
    unlockedNats.includes(l.nationality)
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
  humilde: 5,     // accepts a higher cut, grateful
  leal: 2,
  ambicioso: -5,  // knows their worth, fights for themselves
  difícil: -8,    // diva, will haggle hard
}

// Minimum reputation a player demands before they'll even SIT with you.
// A current star won't talk to a broke no-name agent; a kid in a pelada will.
export function getMinReputationToSign(legend: Legend, year: number): number {
  const rating = getCurrentRating(legend, year)
  const status = getCurrentStatus(legend, year)
  // Young prospects (pelada/base) are ALWAYS signable — you're their big break.
  // Only players who are already SOMEBODY make a no-name agent prove himself.
  let req = 0
  if (status === 'estrela') req = 38 + Math.max(0, rating - 80) * 2 // current stars
  else if (status === 'pro') req = Math.max(0, (rating - 70) * 2)    // only famous pros
  return Math.round(Math.min(95, req))
}

// The highest commission this player would EVER accept right now.
// Famous players give you far less leverage; unknown kids take almost anything.
export function getMaxAcceptable(legend: Legend, reputation: number, year: number): number {
  const rating = getCurrentRating(legend, year)
  const status = getCurrentStatus(legend, year)

  let m = 14 // base

  // Fame: the better they already are, the less they need you
  m -= Math.max(0, rating - 40) * 0.30

  // Status: a kid in a pelada is desperate; a star has all the leverage
  const statusBonus: Record<PlayerStatus, number> = {
    pelada: 9, base: 4, pro: -3, estrela: -9,
  }
  m += statusBonus[status]

  // Personality
  m += PERSONALITY_TOLERANCE[legend.personality]

  // Your reputation buys you a little more room
  m += reputation * 0.10

  return Math.round(Math.max(5, Math.min(28, m)))
}

// Chance a player rejects EVEN with an acceptable rate, purely out of
// fame/ego. The more famous (higher rating), the bigger the wobble — but
// it's always a small "drible", never a sure thing.
export function getFameDribleChance(legend: Legend, year: number): number {
  const rating = getCurrentRating(legend, year)
  if (rating < 35) return 0
  return Math.min(0.45, (rating - 35) * 0.011) // ~0% at 35, ~45% at 76+
}

// A representation "ask" combines commission with contract length: locking a
// player into a long deal is a big favour to YOU, so it raises the ask. A short
// deal lowers it. A 3-year deal is the neutral baseline.
export function repAskScore(commission: number, contractYears: number): number {
  return commission + (contractYears - 3) * 1.5
}

export function evaluateSigning(
  legend: Legend,
  rate: number,
  reputation: number,
  year: number,
  rejectionsSoFar: number = 0,
  contractYears: number = 3,
): SigningEvaluation {
  const status = getCurrentStatus(legend, year)
  const rawMax = getMaxAcceptable(legend, reputation, year)
  const willLose = rejectionsSoFar + 1 >= 2 // a reject NOW means strike #2 → gone
  const ask = repAskScore(rate, contractYears)
  // Max commission they'd accept AT this contract length (for the UI buttons)
  const maxAcceptable = Math.round(Math.max(5, Math.min(30, rawMax - (contractYears - 3) * 1.5)))

  if (ask <= rawMax) {
    // Fame drible: even an acceptable offer can be rejected out of ego
    const dribleChance = getFameDribleChance(legend, year)
    if (Math.random() < dribleChance) {
      return {
        result: 'reject',
        maxAcceptable,
        fameDrible: true,
        lost: willLose,
        reason: willLose
          ? `${legend.nickname} se fez de difícil de novo e bateu o pé. Cansou de você — não assina mais. PERDIDO.`
          : `${legend.nickname} é famoso e cheio de si: deu um drible e recusou mesmo achando justo. Tente de novo... com cuidado.`,
      }
    }
    return {
      result: 'accept',
      maxAcceptable,
      reason: ask <= rawMax - 6
        ? `${legend.nickname} aceitou na hora — achou você generoso.`
        : `${legend.nickname} apertou sua mão. Negócio fechado.`,
    }
  }

  if (ask <= rawMax + 4) {
    return {
      result: 'counter',
      maxAcceptable,
      reason: `${legend.nickname} achou puxado (${rate}% por ${contractYears} anos). Topa no máximo ${maxAcceptable}% pra esse prazo.`,
    }
  }

  return {
    result: 'reject',
    maxAcceptable,
    lost: willLose,
    reason: willLose
      ? (status === 'estrela'
          ? `${legend.nickname} se ofendeu de vez. "Não quero mais te ver." PERDIDO pra sempre.`
          : `${legend.nickname} recusou pela segunda vez e ficou puto. Não assina mais com você. PERDIDO.`)
      : (status === 'estrela'
          ? `${legend.nickname} riu na sua cara. "Você é um zé-ninguém querendo ${rate}% por ${contractYears} anos?" — última chance.`
          : `${legend.nickname} recusou ${rate}% por ${contractYears} anos. Ganancioso demais. Se forçar de novo, ele te abandona.`),
  }
}

// ─── RENEWAL ───────────────────────────────────────────────────
// When YOUR representation deal runs out you must renew. Whether the player
// re-signs depends mostly on how happy you kept them, plus their personality.
export function evaluateRenewal(
  happiness: number,
  personality: Personality,
  commission: number,
  contractYears: number,
): { result: SigningResult; maxAcceptable: number; reason: string } {
  let tol = 8 + happiness * 0.22
  tol += PERSONALITY_TOLERANCE[personality]
  const maxAcceptable = Math.round(Math.max(5, Math.min(30, tol)))
  const ask = repAskScore(commission, contractYears)

  if (happiness < 25) {
    return { result: 'reject', maxAcceptable, reason: 'Ele está insatisfeito com você e quer ir embora. Só renova se a moral subir.' }
  }
  if (ask <= tol) {
    return { result: 'accept', maxAcceptable, reason: happiness >= 70 ? 'Ele adora trabalhar com você e renovou na hora!' : 'Ele topou renovar com você.' }
  }
  if (ask <= tol + 4) {
    return { result: 'counter', maxAcceptable, reason: `Ele acha puxado. Renova no máximo a ${maxAcceptable}% nesse prazo.` }
  }
  return { result: 'reject', maxAcceptable, reason: 'Ele recusou esses termos de renovação. Tente algo mais camarada.' }
}
