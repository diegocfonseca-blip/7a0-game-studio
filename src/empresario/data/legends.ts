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

  // ═══════════════════════════════════════════════════════════════
  //  ERA 92 — GIGANTES JÁ NO AUGE (disponíveis desde o início)
  // ═══════════════════════════════════════════════════════════════

  // ─── ITÁLIA ──────────────────────────────────────────────────
  {
    id: 'maldini', name: 'Paolo Maldini', nickname: 'Il Capitano', position: 'LAT', nationality: 'IT',
    birthYear: 1968, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 2007, truePotential: 95, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 4000, luva: 6000,
    luvaReason: 'Filho de lenda do Milan. A luva é mais protocolo do que necessidade — ele quer respeito.',
    monthlyFee: 700,
    discoveryStory: 'Lateral esquerdo que parece esculpido em mármore. Defende 90 minutos sem sujar o uniforme.',
    futureKnowledge: 'Vai jogar pelo Milan por 25 anos. O lateral mais elegante da história. Nunca vai trair o clube — nem por isso.',
    club: 'AC Milan',
  },
  {
    id: 'baresi', name: 'Franco Baresi', nickname: 'Kaiser', position: 'ZAG', nationality: 'IT',
    birthYear: 1960, emergenceYear: 1993, peakYearStart: 1988, peakYearEnd: 1994, truePotential: 94, currentRating: 88,
    personality: 'difícil', status: 'estrela', signingFee: 9000, luva: 12000,
    luvaReason: 'Capitão do Milan e imperador do calcio. Só chega do lado dele quem ele respeitar.',
    monthlyFee: 1600,
    discoveryStory: 'O Kaiser do futebol. Zagueiro que ganha o duelo antes de o atacante perceber.',
    futureKnowledge: 'Ainda dominante em 94. Vai jogar a final da Copa operado do joelho. O maior zagueiro de todos os tempos.',
    club: 'AC Milan',
  },
  {
    id: 'costacurta', name: 'Alessandro Costacurta', nickname: 'Billy', position: 'ZAG', nationality: 'IT',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1999, truePotential: 88, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 2500, luva: 3800,
    luvaReason: 'Sempre na sombra do Baresi, mas sabe que é craque. A luva é o reconhecimento que nunca vem dos jornalistas.',
    monthlyFee: 480,
    discoveryStory: 'Zagueiro inteligente que lê o jogo antes da bola chegar. Parceiro perfeito do Baresi.',
    futureKnowledge: 'Pilar da zaga do Milan campeã. Suspenso na final da Champions de 94 — ele vai chorar muito.',
    club: 'AC Milan',
  },
  {
    id: 'albertini', name: 'Demetrio Albertini', nickname: 'Albertini', position: 'MEI', nationality: 'IT',
    birthYear: 1971, emergenceYear: 1993, peakYearStart: 1996, peakYearEnd: 2001, truePotential: 85, currentRating: 70,
    personality: 'humilde', status: 'pro', signingFee: 800, luva: 1200,
    luvaReason: 'De Besana in Brianza, família simples. Quer estabilidade e reconhecimento.',
    monthlyFee: 140,
    discoveryStory: 'Meia clássico do Milan, passe longo de 40m que parece inútil — até você ver onde a bola cai.',
    futureKnowledge: 'Motor do meio-campo do Milan e da Itália. Campeão do mundo em 2006 como auxiliar.',
    club: 'AC Milan',
  },

  // ─── HOLANDA ERA 92 ───────────────────────────────────────────
  {
    id: 'gullit', name: 'Ruud Gullit', nickname: 'Il Tulipano Nero', position: 'ATA', nationality: 'NL',
    birthYear: 1962, emergenceYear: 1993, peakYearStart: 1987, peakYearEnd: 1995, truePotential: 93, currentRating: 83,
    personality: 'ambicioso', status: 'estrela', signingFee: 7000, luva: 10000,
    luvaReason: 'Estrela global, exige o status correspondente. A luva é o preço de tratar com alguém assim.',
    monthlyFee: 1400,
    discoveryStory: 'O tulipano negro. Atacante que pode jogar em qualquer posição e dominar qualquer partida.',
    futureKnowledge: 'Balão de Ouro 1987. Vai reinventar o Chelsea como treinador. Carisma de outro planeta.',
    club: 'Sampdoria',
  },
  {
    id: 'van_basten', name: 'Marco van Basten', nickname: 'Il Cigno', position: 'ATA', nationality: 'NL',
    birthYear: 1964, emergenceYear: 1993, peakYearStart: 1988, peakYearEnd: 1993, truePotential: 96, currentRating: 74,
    personality: 'leal', status: 'pro', signingFee: 3500, luva: 7000,
    luvaReason: 'O tornozelo destruído exige tratamento caro. Uma chance de ter o maior 9 da história — mas o relógio corre.',
    monthlyFee: 600,
    discoveryStory: 'O Cisne de Utrecht. Três Bolas de Ouro. Voleio impossível na Euro 88. Mas os tornozelos estão contando os dias.',
    futureKnowledge: 'Vai tentar voltar, mas o tornozelo não resiste. Vai se aposentar em 1995 aos 30. Se você tem ele — jogue já.',
    club: 'AC Milan',
  },
  {
    id: 'rijkaard', name: 'Frank Rijkaard', nickname: 'Rijkaard', position: 'MEI', nationality: 'NL',
    birthYear: 1962, emergenceYear: 1993, peakYearStart: 1988, peakYearEnd: 1996, truePotential: 90, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 3000, luva: 4500,
    luvaReason: 'Holandês tranquilo, profissional exemplar. A luva é justa para quem já ganhou tudo.',
    monthlyFee: 550,
    discoveryStory: 'Volante completo do Ajax e Milan. Faz tudo com elegância. Passa, marca, cabeceia.',
    futureKnowledge: 'Vai treinar o Barcelona e conquistar La Liga e a Champions de 2006. Excelente caráter.',
    club: 'Ajax',
  },
  {
    id: 'bergkamp', name: 'Dennis Bergkamp', nickname: 'O Não-Voador', position: 'ATA', nationality: 'NL',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1997, peakYearEnd: 2002, truePotential: 91, currentRating: 75,
    personality: 'difícil', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'Não gosta de avião. Se você quiser ele, vai precisar de trem, barco ou criatividade.',
    monthlyFee: 210,
    discoveryStory: 'Atacante do Ajax que toca a bola como se estivesse em câmera lenta. Técnica de outro nível.',
    futureKnowledge: 'Vai brilhar no Arsenal em 1997. Aquele gol de calcanhar contra o Newcastle? Eternidade.',
    club: 'Ajax',
  },
  {
    id: 'seedorf', name: 'Clarence Seedorf', nickname: 'Seedorf', position: 'MEI', nationality: 'NL',
    birthYear: 1976, emergenceYear: 1994, peakYearStart: 2000, peakYearEnd: 2006, truePotential: 88, currentRating: 42,
    personality: 'ambicioso', status: 'base', signingFee: 350, luva: 600,
    luvaReason: 'Adolescente de Suriname criado na Holanda. Arrogante já — mas entrega na mesma proporção.',
    monthlyFee: 80,
    discoveryStory: 'Jovem do Ajax com poder de chute absurdo e liderança precoce. Sabe que vai ser grande.',
    futureKnowledge: 'Único jogador a vencer a Champions com três clubes diferentes. Classe e físico raros.',
    club: 'Ajax (base)',
  },

  // ─── ALEMANHA ERA 92 ──────────────────────────────────────────
  {
    id: 'matthaus', name: 'Lothar Matthäus', nickname: 'Der Kaiser Novo', position: 'MEI', nationality: 'DE',
    birthYear: 1961, emergenceYear: 1993, peakYearStart: 1988, peakYearEnd: 1995, truePotential: 92, currentRating: 87,
    personality: 'ambicioso', status: 'estrela', signingFee: 6000, luva: 9000,
    luvaReason: 'FIFA Melhor Jogador de 1991. Sabe o que vale — e exige isso.',
    monthlyFee: 1200,
    discoveryStory: 'O homem que ganhou tudo com a Alemanha. Meia completo que vira libero quando precisa.',
    futureKnowledge: 'Vai jogar até os 40 reinventando-se como libero. Campeão do Mundo de 1990 e 5x Bundesliga.',
    club: 'Bayern de Munique',
  },
  {
    id: 'klinsmann', name: 'Jürgen Klinsmann', nickname: 'Der Bomber', position: 'ATA', nationality: 'DE',
    birthYear: 1964, emergenceYear: 1993, peakYearStart: 1990, peakYearEnd: 1996, truePotential: 87, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 3500, luva: 5500,
    luvaReason: 'Profissional dos pés à cabeça. Sabe o valor do seu gol e exige pagamento equivalente.',
    monthlyFee: 600,
    discoveryStory: 'Centroavante alemão que cabecea, finaliza e mergulha. Mergulhador olímpico dentro da área.',
    futureKnowledge: 'Artilheiro da Euro 96 na Inglaterra. Vai ser campeão mundial como treinador dos EUA.',
    club: 'Stuttgart',
  },
  {
    id: 'sammer', name: 'Matthias Sammer', nickname: 'Sammer', position: 'MEI', nationality: 'DE',
    birthYear: 1967, emergenceYear: 1993, peakYearStart: 1995, peakYearEnd: 1998, truePotential: 88, currentRating: 76,
    personality: 'ambicioso', status: 'pro', signingFee: 1400, luva: 2200,
    luvaReason: 'Da Alemanha Oriental, carregou o fardo da reunificação. A luva reconhece isso.',
    monthlyFee: 240,
    discoveryStory: 'Meia da RDA que se reinventou como libero. Combina liderança com qualidade técnica.',
    futureKnowledge: 'Bola de Ouro 1996 — o último alemão a ganhar. Carreira encerrada cedo por lesão.',
    club: 'Stuttgart',
  },
  {
    id: 'bierhoff', name: 'Oliver Bierhoff', nickname: 'Bierhoff', position: 'ATA', nationality: 'DE',
    birthYear: 1968, emergenceYear: 1996, peakYearStart: 1996, peakYearEnd: 2000, truePotential: 84, currentRating: 72,
    personality: 'humilde', status: 'base', signingFee: 700, luva: 1000,
    luvaReason: 'Errou nas menores ligas por anos. A luva é o reconhecimento tardio.',
    monthlyFee: 130,
    discoveryStory: 'Atacante alto que passou por 6 clubes mediocres sem estourar. Paciência absoluta.',
    futureKnowledge: 'O golden goal que dá a Euro 96 à Alemanha. Maturação lenta — não o venda cedo.',
    club: 'Ascoli (Série B italiana)',
  },

  // ─── ESCANDINÁVIA ─────────────────────────────────────────────
  {
    id: 'm_laudrup', name: 'Michael Laudrup', nickname: 'El Genio Dinamarquês', position: 'MEI', nationality: 'DK',
    birthYear: 1964, emergenceYear: 1993, peakYearStart: 1989, peakYearEnd: 1997, truePotential: 91, currentRating: 86,
    personality: 'leal', status: 'estrela', signingFee: 5000, luva: 7500,
    luvaReason: 'Peça de Cruyff no Barcelona. A luva é compatível com quem fez o sistema 4-3-3 funcionar de verdade.',
    monthlyFee: 980,
    discoveryStory: 'O dinamarquês invisível que toca e some. Cria espaço antes de a defesa perceber o que aconteceu.',
    futureKnowledge: 'Vai SAIR do Barça campeão pro Real Madrid inimigo por desentendimento com Cruyff. Genialidade com orgulho.',
    club: 'Barcelona',
  },
  {
    id: 'b_laudrup', name: 'Brian Laudrup', nickname: 'Il Falco', position: 'MEI', nationality: 'DK',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 1999, truePotential: 87, currentRating: 74,
    personality: 'leal', status: 'pro', signingFee: 1600, luva: 2500,
    luvaReason: 'Irmão mais novo do Michael. Quer sair da sombra — a luva é o preço da sua própria lenda.',
    monthlyFee: 290,
    discoveryStory: 'Meia driblador de ponta que deixa dois ou três pra trás com facilidade obscena.',
    futureKnowledge: 'Vai dominar a Escócia no Rangers. Votado melhor da liga inglesa. O Laudrup que soube onde brilhar.',
    club: 'Fiorentina',
  },
  {
    id: 'schmeichel', name: 'Peter Schmeichel', nickname: 'A Grande Muralha Dinamarquesa', position: 'GOL', nationality: 'DK',
    birthYear: 1963, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1999, truePotential: 92, currentRating: 86,
    personality: 'difícil', status: 'estrela', signingFee: 4500, luva: 7000,
    luvaReason: 'Melhor goleiro do mundo e ele sabe. Grita com todo mundo — até com você.',
    monthlyFee: 820,
    discoveryStory: 'Goleiro dinamarquês do Man United que intimida os próprios companheiros. Briga com Ferguson. E vence.',
    futureKnowledge: 'Vai levantar a Champions de 1999 como capitão. Salvou a Dinamarca na Euro 92. O maior GOL de uma geração.',
    club: 'Manchester United',
  },

  // ─── LESTE EUROPEU ────────────────────────────────────────────
  {
    id: 'stoichkov', name: 'Hristo Stoichkov', nickname: 'O Diabo de Plovdiv', position: 'ATA', nationality: 'BG',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1997, truePotential: 91, currentRating: 86,
    personality: 'difícil', status: 'estrela', signingFee: 4000, luva: 6500,
    luvaReason: 'Temperamento explosivo — suspensão de um ano por pisão num árbitro. A luva é pra esquecer isso.',
    monthlyFee: 780,
    discoveryStory: 'Atacante búlgaro que joga com raiva em cada toque. Finta, chuta, discute com o árbitro — tudo forte.',
    futureKnowledge: 'Bola de Ouro 1994. Artilheiro da Copa de 94 junto com Salenko. O maior búlgaro de todos os tempos.',
    club: 'Barcelona',
  },
  {
    id: 'hagi', name: 'Gheorghe Hagi', nickname: 'O Maradona dos Cárpatos', position: 'MEI', nationality: 'RO',
    birthYear: 1965, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1998, truePotential: 90, currentRating: 80,
    personality: 'ambicioso', status: 'estrela', signingFee: 2500, luva: 4000,
    luvaReason: 'Melhor jogador da história da Romênia, e sabe disso. A luva é o mínimo que ele espera.',
    monthlyFee: 430,
    discoveryStory: 'Meia esquerdo romeno que finalizou num ângulo impossível na Copa de 94. Craque de nível europeu.',
    futureKnowledge: 'Vai levar a Romênia às quartas da Copa de 94 — maior resultado histórico do país.',
    club: 'Brescia',
  },
  {
    id: 'savicevic', name: 'Dragan Savicević', nickname: 'Il Genio', position: 'ATA', nationality: 'YU',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1997, truePotential: 91, currentRating: 84,
    personality: 'difícil', status: 'estrela', signingFee: 3500, luva: 5500,
    luvaReason: 'Melhor jogador da Iugoslávia. Humores imprevisíveis — a luva mantém ele no trilho.',
    monthlyFee: 650,
    discoveryStory: 'Atacante técnico do Estrela Vermelha. Inventivo, imprevisível. Pode humilhar qualquer defesa.',
    futureKnowledge: 'Vai destruir o Barcelona na final da Champions de 1994 com um chapéu que virou lenda.',
    club: 'Red Star Belgrade',
  },
  {
    id: 'prosinecki', name: 'Robert Prosinečki', nickname: 'Prosa', position: 'MEI', nationality: 'YU',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1997, truePotential: 86, currentRating: 78,
    personality: 'difícil', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'Fumante inveterado, boêmio. A luva é pra ele comprar cigarro e paz de espírito.',
    monthlyFee: 230,
    discoveryStory: 'Meia técnico iugoslavo que fuma no intervalo e ganha o jogo no segundo tempo.',
    futureKnowledge: 'Vai marcar pela Iugoslávia E pela Croácia na mesma Copa. Raridade histórica.',
    club: 'Real Madrid',
  },
  {
    id: 'suker', name: 'Davor Šuker', nickname: 'Šuker', position: 'ATA', nationality: 'HR',
    birthYear: 1968, emergenceYear: 1993, peakYearStart: 1997, peakYearEnd: 1999, truePotential: 88, currentRating: 72,
    personality: 'leal', status: 'pro', signingFee: 1000, luva: 1600,
    luvaReason: 'Croata orgulhoso que joga pela bandeira tanto quanto pelo contrato.',
    monthlyFee: 190,
    discoveryStory: 'Centroavante croata com precisão milimétrica na finalização. Calmo como cirurgião.',
    futureKnowledge: 'Artilheiro da Copa de 1998. Gol no chip por cima do Buffon que é obra de arte.',
    club: 'Sevilla',
  },
  {
    id: 'boban', name: 'Zvonimir Boban', nickname: 'Zorro', position: 'MEI', nationality: 'HR',
    birthYear: 1968, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 2000, truePotential: 88, currentRating: 76,
    personality: 'leal', status: 'pro', signingFee: 1300, luva: 2100,
    luvaReason: 'Chutou um policial na rua pra defender um croata na guerra. A luva respeita a coragem.',
    monthlyFee: 250,
    discoveryStory: 'Meia técnico do Dinamo Zagreb. Liderança visceral, chute de fora da área imponente.',
    futureKnowledge: 'Capitão da Croácia histórica de 1998. Pilar do grande Milan dos anos 90.',
    club: 'Dinamo Zagreb',
  },
  {
    id: 'nedved', name: 'Pavel Nedvěd', nickname: 'O Guerreiro Tcheco', position: 'MEI', nationality: 'CZ',
    birthYear: 1972, emergenceYear: 1994, peakYearStart: 2001, peakYearEnd: 2006, truePotential: 88, currentRating: 56,
    personality: 'leal', status: 'base', signingFee: 500, luva: 800,
    luvaReason: 'Família humilde de Cheb, fronteira com a Alemanha. A luva é a saída da pobreza.',
    monthlyFee: 100,
    discoveryStory: 'Meia de arrancada do Sparta de Praga. Corre até os 90 minutos como se fosse o primeiro.',
    futureKnowledge: 'Bola de Ouro 2003. Vai decidir semifinais da Champions na Juve. Suspenso na final — chorará muito.',
    club: 'Sparta Praga',
  },
  {
    id: 'shevchenko', name: 'Andriy Shevchenko', nickname: 'Sheva', position: 'ATA', nationality: 'UA',
    birthYear: 1976, emergenceYear: 1995, peakYearStart: 2000, peakYearEnd: 2006, truePotential: 92, currentRating: 42,
    personality: 'leal', status: 'base', signingFee: 300, luva: 600,
    luvaReason: 'Filho de soldado ucraniano. A luva é o bilhete pra sair de um país ainda caótico.',
    monthlyFee: 70,
    discoveryStory: 'Garoto do Dínamo de Kyiv com um faro de gol absurdo. Vai dominar a Europa.',
    futureKnowledge: 'Bola de Ouro 2004. Artilheiro do Milan. Pênalti decisivo na Champions de 2003 — vai vencer.',
    club: 'Dínamo Kyiv (base)',
  },

  // ─── ÁFRICA ───────────────────────────────────────────────────
  {
    id: 'weah', name: 'George Weah', nickname: 'O Rei da África', position: 'ATA', nationality: 'LR',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 1999, truePotential: 91, currentRating: 76,
    personality: 'leal', status: 'pro', signingFee: 1500, luva: 2500,
    luvaReason: 'Criado na miséria de Monróvia, Libéria. Sem federação, sem suporte — só talento e garra.',
    monthlyFee: 290,
    discoveryStory: 'Atacante liberiano no Monaco. Velocidade, físico e técnica que parecem impossíveis de coexistir.',
    futureKnowledge: 'Bola de Ouro 1995 — único africano até hoje. Vai ser presidente da Libéria. Herói dentro e fora do campo.',
    club: 'Monaco',
  },
  {
    id: 'okocha', name: 'Jay-Jay Okocha', nickname: 'Jay-Jay', position: 'MEI', nationality: 'NG',
    birthYear: 1973, emergenceYear: 1994, peakYearStart: 1999, peakYearEnd: 2004, truePotential: 87, currentRating: 52,
    personality: 'difícil', status: 'base', signingFee: 500, luva: 900,
    luvaReason: 'De Enugu, Nigéria. Só confia em quem a ele chegar de coração aberto. A luva é o sinal.',
    monthlyFee: 100,
    discoveryStory: 'Meia nigeriano que humilhou Oliver Kahn num dribble que a Alemanha ainda não esqueceu.',
    futureKnowledge: 'Vai encantar em Frankfurt e PSG. Humilhações que viram obras de arte. O mais técnico da África.',
    club: 'Enugu Rangers',
  },
  {
    id: 'eto', name: 'Samuel Eto\'o', nickname: 'Eto\'o', position: 'ATA', nationality: 'CM',
    birthYear: 1981, emergenceYear: 1999, peakYearStart: 2003, peakYearEnd: 2010, truePotential: 92, currentRating: 16,
    personality: 'ambicioso', status: 'pelada', signingFee: 120, luva: 500,
    luvaReason: 'Menino de Douala, Camarões. Dormia na base do Real Madrid com fome. A luva é a dignidade que ele merece.',
    monthlyFee: 30,
    discoveryStory: 'Garoto de 11 anos com dribble, velocidade e instinto que o Real descartou cedo demais.',
    futureKnowledge: 'Três Champions, melhor africano de sua geração. Vai fazer o Real se arrepender para sempre.',
    club: 'Real Madrid (base)',
  },

  // ─── COLÔMBIA E CHILE ─────────────────────────────────────────
  {
    id: 'valderrama', name: 'Carlos Valderrama', nickname: 'El Pibe', position: 'MEI', nationality: 'CO',
    birthYear: 1961, emergenceYear: 1993, peakYearStart: 1989, peakYearEnd: 1997, truePotential: 87, currentRating: 82,
    personality: 'difícil', status: 'estrela', signingFee: 3000, luva: 4800,
    luvaReason: 'Cabelo afro loiro e orgulho colombiano. A luva compra paz num país em guerra.',
    monthlyFee: 560,
    discoveryStory: 'Meia de cabelo afro loiro que faz passe impossível com a sola. El Pibe. O Menino da Colômbia.',
    futureKnowledge: 'Vai jogar a Copa de 94 e 98 com a Colômbia. O maior jogador da história do país.',
    club: 'Valladolid',
  },
  {
    id: 'asprilla', name: 'Faustino Asprilla', nickname: 'Tino', position: 'ATA', nationality: 'CO',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 1997, truePotential: 85, currentRating: 74,
    personality: 'difícil', status: 'pro', signingFee: 1100, luva: 1800,
    luvaReason: 'De Tuluá, Colômbia. Pistola, festas e futebol — precisa de alguém pra organizar a vida dele.',
    monthlyFee: 220,
    discoveryStory: 'Atacante colombiano imprevisível que marca hat-trick na Champions e não aparece no treino.',
    futureKnowledge: 'Vai ao Newcastle e brilhar na Champions. Talento que sobra — organização que falta.',
    club: 'Parma',
  },
  {
    id: 'zamorano', name: 'Ivan Zamorano', nickname: 'Bam Bam', position: 'ATA', nationality: 'CL',
    birthYear: 1967, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1998, truePotential: 86, currentRating: 78,
    personality: 'leal', status: 'estrela', signingFee: 2200, luva: 3600,
    luvaReason: 'De Santiago, Chile. Cabeça, raça e gol. A luva é modesta pra quem entrega tanto.',
    monthlyFee: 400,
    discoveryStory: 'Centroavante chileno que cabecea como touro e dribla como gato. Artilheiro clínico.',
    futureKnowledge: 'Artilheiro da Liga Espanhola no Real Madrid de 94-95. Vai ser o símbolo chileno por uma geração.',
    club: 'Sevilla',
  },
  {
    id: 'salas', name: 'Marcelo Salas', nickname: 'El Matador', position: 'ATA', nationality: 'CL',
    birthYear: 1974, emergenceYear: 1996, peakYearStart: 1997, peakYearEnd: 2001, truePotential: 85, currentRating: 50,
    personality: 'leal', status: 'base', signingFee: 600, luva: 1000,
    luvaReason: 'De Temuco, sul do Chile. Família humilde, sonho grande. A luva é o começo.',
    monthlyFee: 110,
    discoveryStory: 'Atacante chileno de técnica refinada e faro de gol aguçado. Vai explodir logo.',
    futureKnowledge: 'Artilheiro da Copa de 98 junto com o parceiro Zamorano. Vai ao River e Juventus.',
    club: 'U. de Chile',
  },

  // ─── GRÃ-BRETANHA E IRLANDA ──────────────────────────────────
  {
    id: 'shearer', name: 'Alan Shearer', nickname: 'Big Al', position: 'ATA', nationality: 'EN',
    birthYear: 1970, emergenceYear: 1993, peakYearStart: 1995, peakYearEnd: 2000, truePotential: 91, currentRating: 74,
    personality: 'leal', status: 'pro', signingFee: 1400, luva: 2300,
    luvaReason: 'De Newcastle, família operária. Sólido como o muro da Muralha da China.',
    monthlyFee: 270,
    discoveryStory: 'Centroavante inglês que cabeceia, finaliza com as duas pernas e não cai pra falta.',
    futureKnowledge: 'Artilheiro eterno da Premier League. Vai ser o mais caro do mundo em 1996. Nunca sai do Newcastle.',
    club: 'Southampton',
  },
  {
    id: 'giggs', name: 'Ryan Giggs', nickname: 'O Galês Mágico', position: 'MEI', nationality: 'EN',
    birthYear: 1973, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 2001, truePotential: 91, currentRating: 76,
    personality: 'humilde', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'De Cardiff, família modesta. Ferguson descobriu ele jogando na rua e nunca mais soltou.',
    monthlyFee: 220,
    discoveryStory: 'Meia galês do United veloz como relâmpago pela ponta esquerda. Acha espaços impossíveis.',
    futureKnowledge: 'Vai jogar 23 anos no United. O gol solo contra o Arsenal em 99 é poesia.',
    club: 'Manchester United',
  },
  {
    id: 'cantona', name: 'Éric Cantona', nickname: 'Le Roi', position: 'ATA', nationality: 'FR',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1997, truePotential: 89, currentRating: 84,
    personality: 'difícil', status: 'estrela', signingFee: 4500, luva: 7000,
    luvaReason: 'Gênio e vândalo. Luva alta para quem vem com ele uma inteira psicóloga embutida.',
    monthlyFee: 900,
    discoveryStory: 'O Rei. Gola virada, passe milimétrico, voleio impossível — e kung-fu num torcedor quando não está bem.',
    futureKnowledge: 'Ressuscita o Man United. Quatro ligas em cinco anos. Vai chutar um torcedor em 95 — e voltar campeão.',
    club: 'Leeds United',
  },
  {
    id: 'keane_r', name: 'Roy Keane', nickname: 'O Chefe de Cork', position: 'MEI', nationality: 'IE',
    birthYear: 1971, emergenceYear: 1993, peakYearStart: 1997, peakYearEnd: 2002, truePotential: 88, currentRating: 68,
    personality: 'difícil', status: 'pro', signingFee: 1000, luva: 1700,
    luvaReason: 'Irlandês de Cork com ego do tamanho da Irlanda. A luva compra o silêncio na sala de reunião.',
    monthlyFee: 200,
    discoveryStory: 'Volante do Nottingham Forest, olhar de assassino, marcação de rottweiler. Não tem amigo fácil.',
    futureKnowledge: 'Capitão do United do treble de 99. A melhor atuação da Champions de 99 foi dele — e ele perdeu.',
    club: 'Nottingham Forest',
  },
  {
    id: 'scholes', name: 'Paul Scholes', nickname: 'Scholesy', position: 'MEI', nationality: 'EN',
    birthYear: 1974, emergenceYear: 1994, peakYearStart: 1999, peakYearEnd: 2006, truePotential: 90, currentRating: 46,
    personality: 'humilde', status: 'base', signingFee: 400, luva: 700,
    luvaReason: 'De Salford, mora onde nasceu. A luva vai pro banco e pronto.',
    monthlyFee: 80,
    discoveryStory: 'Meia da base do United, cabelo ruivo, odeia holofote. Joga passe de 40m como se fosse passe curto.',
    futureKnowledge: 'Zidane disse que ele era o melhor meia do mundo. Xavi disse que sonhava em jogar como ele.',
    club: 'Manchester United (base)',
  },
  {
    id: 'ferdinand', name: 'Rio Ferdinand', nickname: 'Rio', position: 'ZAG', nationality: 'EN',
    birthYear: 1978, emergenceYear: 1997, peakYearStart: 2002, peakYearEnd: 2008, truePotential: 89, currentRating: 38,
    personality: 'ambicioso', status: 'base', signingFee: 300, luva: 600,
    luvaReason: 'De Peckham, periferia de Londres. A luva garante a família e a mudança pra outro país.',
    monthlyFee: 70,
    discoveryStory: 'Zagueiro do West Ham que sai jogando como meia. Perna longa, passe preciso, técnica rara.',
    futureKnowledge: 'Zagueiro do United campeão de 2008 na Champions. Transferência recorde britânica em 2002.',
    club: 'West Ham (base)',
  },

  // ─── BRASIL ERA 92 ────────────────────────────────────────────
  {
    id: 'taffarel', name: 'Cláudio Taffarel', nickname: 'Taffarel', position: 'GOL', nationality: 'BR',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1998, truePotential: 87, currentRating: 83,
    personality: 'leal', status: 'estrela', signingFee: 3500, luva: 5500,
    luvaReason: 'Ídolo gaúcho do Grêmio, já na Roma. Exige segurança financeira pra familia em Porto Alegre.',
    monthlyFee: 680,
    discoveryStory: 'Goleiro do Grêmio com reflexos de gato e punhos de pedra. Já é o #1 do Brasil.',
    futureKnowledge: 'Campeão do mundo em 94 e pênaltis de 94 e 98. O GOL que segurou o Brasil nas horas críticas.',
    club: 'Reggio Calabria',
  },
  {
    id: 'muller_br', name: 'Luís Müller', nickname: 'Müller', position: 'ATA', nationality: 'BR',
    birthYear: 1966, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1996, truePotential: 84, currentRating: 80,
    personality: 'ambicioso', status: 'estrela', signingFee: 3000, luva: 4800,
    luvaReason: 'Goleador do São Paulo dos tricampeões. Sabe o que vale — cada gol tem preço.',
    monthlyFee: 580,
    discoveryStory: 'Centroavante de São Paulo articulado que faz os gols que precisam ser feitos. Frieza clínica.',
    futureKnowledge: 'Campeão do mundo em 94. Artilheiro do São Paulo tricampeão da Libertadores.',
    club: 'São Paulo / Roma',
  },
  {
    id: 'rai', name: 'Raí Souza', nickname: 'Raí', position: 'MEI', nationality: 'BR',
    birthYear: 1965, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1997, truePotential: 86, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 3200, luva: 5000,
    luvaReason: 'Capitão do grande São Paulo e irmão do Sócrates. Carisma e inteligência raros.',
    monthlyFee: 640,
    discoveryStory: 'Meia elegante do São Paulo, pé esquerdo abençoado. Cobra falta com curva impossível.',
    futureKnowledge: 'Vai ao PSG em 93 e criar a fundação Comunidade Athlética. Liderança dentro e fora do campo.',
    club: 'São Paulo',
  },
  {
    id: 'zinho', name: 'Zinho', nickname: 'Zinho', position: 'MEI', nationality: 'BR',
    birthYear: 1967, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1996, truePotential: 85, currentRating: 81,
    personality: 'leal', status: 'estrela', signingFee: 2800, luva: 4400,
    luvaReason: 'Meia técnico do Palmeiras. A luva é pra segurança da família num mercado que o subestima.',
    monthlyFee: 560,
    discoveryStory: 'Meia cerebral do Palmeiras que enxerga o jogo uma jogada à frente.',
    futureKnowledge: 'Campeão do mundo em 94. Vai pro Flamengo e depois pra Japão ganhar dinheiro.',
    club: 'Fluminense',
  },
  {
    id: 'aldair', name: 'Aldair Nascimento', nickname: 'Aldair', position: 'ZAG', nationality: 'BR',
    birthYear: 1965, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1999, truePotential: 86, currentRating: 82,
    personality: 'leal', status: 'estrela', signingFee: 3000, luva: 4800,
    luvaReason: 'Titular absoluto da Roma há anos. A luva é proporcional ao respeito que lá conquistou.',
    monthlyFee: 580,
    discoveryStory: 'Zagueiro brasileiro da Roma que desarma sem falta e sai jogando com precisão.',
    futureKnowledge: 'Pilar da defesa campeã do mundo em 94. Vai ficar 15 anos na Roma. Respeitado em toda a Itália.',
    club: 'Roma',
  },
  {
    id: 'branco', name: 'Branco', nickname: 'Branco', position: 'LAT', nationality: 'BR',
    birthYear: 1964, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1995, truePotential: 84, currentRating: 80,
    personality: 'difícil', status: 'estrela', signingFee: 2800, luva: 4500,
    luvaReason: 'Lateral que exige reconhecimento. Difícil de gerenciar, mas bênção no campo.',
    monthlyFee: 550,
    discoveryStory: 'Lateral esquerdo poderoso com chute de falta calibrado. Veterano de Copas do Mundo.',
    futureKnowledge: 'Falta no Mundial de 94 pela qual o goleiro americano nunca foi perdoado. Campeão do mundo.',
    club: 'Porto',
  },
  {
    id: 'mauro_silva', name: 'Mauro Silva', nickname: 'Mauro Silva', position: 'MEI', nationality: 'BR',
    birthYear: 1968, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1998, truePotential: 82, currentRating: 76,
    personality: 'leal', status: 'pro', signingFee: 1800, luva: 3000,
    luvaReason: 'O guerreiro silencioso. Faz o trabalho sujo e garante o meio-campo. A luva é pelo que ninguém vê.',
    monthlyFee: 380,
    discoveryStory: 'Volante brasileiro do Deportivo que sacrifica a aparência pela eficiência. Invisível e indispensável.',
    futureKnowledge: 'Campeão do mundo em 94. Peça-chave que ninguém percebia até ele sumir.',
    club: 'Deportivo La Coruña',
  },
  {
    id: 'edmundo', name: 'Edmundo de Souza', nickname: 'O Animal', position: 'ATA', nationality: 'BR',
    birthYear: 1971, emergenceYear: 1993, peakYearStart: 1995, peakYearEnd: 1999, truePotential: 86, currentRating: 68,
    personality: 'difícil', status: 'pro', signingFee: 900, luva: 1600,
    luvaReason: 'O Animal. Polêmico, genial, explosivo. A luva é pra ele não ir à festa e pagar multa.',
    monthlyFee: 200,
    discoveryStory: 'Atacante com dribles de outro mundo e comportamento de outro planeta. Craque impossível de ignorar.',
    futureKnowledge: 'Vai marcar 4 gols numa final de Libertadores. Vai perder uma Copa que devia ter ganho. Tudo nos excessos.',
    club: 'Vasco',
  },
  {
    id: 'savio', name: 'Sávio Bortolini', nickname: 'Sávio', position: 'MEI', nationality: 'BR',
    birthYear: 1974, emergenceYear: 1994, peakYearStart: 1997, peakYearEnd: 2000, truePotential: 82, currentRating: 52,
    personality: 'ambicioso', status: 'base', signingFee: 500, luva: 800,
    luvaReason: 'Jovem driblador do Flamengo que quer ir pra Europa urgente. A luva compra a passagem.',
    monthlyFee: 100,
    discoveryStory: 'Ponta veloz do Flamengo, drible curto e aceleração fulminante.',
    futureKnowledge: 'Vai brilhar no Mónaco e no Deportivo. Copa 98 pelo Brasil.',
    club: 'Flamengo',
  },
  {
    id: 'elber', name: 'Giovane Élber', nickname: 'Élber', position: 'ATA', nationality: 'BR',
    birthYear: 1972, emergenceYear: 1994, peakYearStart: 1998, peakYearEnd: 2003, truePotential: 84, currentRating: 58,
    personality: 'leal', status: 'base', signingFee: 600, luva: 1000,
    luvaReason: 'De Londrina, PR. A luva ajuda a família e banca a mudança pra Europa.',
    monthlyFee: 110,
    discoveryStory: 'Atacante veloz do Stuttgart que vai explodir na Bundesliga.',
    futureKnowledge: 'Artilheiro do Bayern por anos. Vai ganhar a Champions de 2001. Silencioso, letal.',
    club: 'VfB Stuttgart (base)',
  },
  {
    id: 'tulio', name: 'Túlio Maravilha', nickname: 'Túlio', position: 'ATA', nationality: 'BR',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 1999, truePotential: 83, currentRating: 72,
    personality: 'difícil', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'O egocêntrico que entrega. Exige contrato do tamanho do próprio ego.',
    monthlyFee: 250,
    discoveryStory: 'Centroavante do Botafogo — Maravilha — que marca gols olímpicos e celebra sem modéstia.',
    futureKnowledge: 'Artilheiro implacável do futebol brasileiro. Personalidade difícil, gols fáceis.',
    club: 'Botafogo',
  },
  {
    id: 'marcelinho', name: 'Marcelinho Carioca', nickname: 'Marcelinho', position: 'MEI', nationality: 'BR',
    birthYear: 1971, emergenceYear: 1993, peakYearStart: 1994, peakYearEnd: 1999, truePotential: 83, currentRating: 72,
    personality: 'difícil', status: 'pro', signingFee: 1100, luva: 1900,
    luvaReason: 'Bateu um árbitro no Corinthians. A luva é para ele apertar a mão e cumprir o contrato.',
    monthlyFee: 240,
    discoveryStory: 'Meia do Corinthians que bate falta com curva impossível. Briga com todo mundo — mas ganha.',
    futureKnowledge: 'Vai marcar faltas por anos no Timão. Polêmico mas decisivo.',
    club: 'Corinthians',
  },
  // ─── ARGENTINA (novos) ──────────────────────────────────────
  {
    id: 'batistuta', name: 'Gabriel Batistuta', nickname: 'Il Re Leone', position: 'ATA', nationality: 'AR',
    birthYear: 1969, emergenceYear: 1993, peakYearStart: 1993, peakYearEnd: 1999, truePotential: 93, currentRating: 82,
    personality: 'ambicioso', status: 'estrela', signingFee: 5000, luva: 8000,
    luvaReason: 'Centroavante consagrado na Fiorentina. Exige reconhecimento à altura.',
    monthlyFee: 1500,
    discoveryStory: 'Centroavante físico e técnico. Chute com os dois pés, cabeceio perfeito. Artilheiro implacável da Fiorentina.',
    futureKnowledge: 'Artilheiro histórico da seleção argentina. Vai marcar 10 gols em Copas. El Rey León não perde pênalti.',
    club: 'Fiorentina',
  },
  {
    id: 'zanetti', name: 'Javier Zanetti', nickname: 'Tronco', position: 'LAT', nationality: 'AR',
    birthYear: 1973, emergenceYear: 1993, peakYearStart: 1996, peakYearEnd: 2010, truePotential: 89, currentRating: 68,
    personality: 'leal', status: 'pro', signingFee: 1500, luva: 2500,
    luvaReason: 'Lateral incansável, profissional exemplar. A luva é o reconhecimento que merece.',
    monthlyFee: 250,
    discoveryStory: 'Lateral-direito incansável. Ataca e defende. Corre 90 minutos como se fossem 9.',
    futureKnowledge: 'Vai jogar 858 partidas pela Inter de Milão. Capitão eterno por 20 anos. Lenda imortal.',
    club: 'Banfield',
  },
  {
    id: 'saviola', name: 'Javier Saviola', nickname: 'El Conejo', position: 'ATA', nationality: 'AR',
    birthYear: 1981, emergenceYear: 1999, peakYearStart: 2002, peakYearEnd: 2005, truePotential: 85, currentRating: 20,
    personality: 'humilde', status: 'pelada', signingFee: 250, luva: 700,
    luvaReason: 'Menino de Buenos Aires, família simples. A luva é o começo do sonho.',
    monthlyFee: 50,
    discoveryStory: 'Artilheiro precoce do River, driblador nato. Vai encantar a Europa jovem.',
    futureKnowledge: 'Vai brilhar no Barça e Monaco. Destaque juvenil que encantou Cruyff.',
    club: 'River Plate (base)',
  },
  {
    id: 'aguero', name: 'Sergio Agüero', nickname: 'Kun', position: 'ATA', nationality: 'AR',
    birthYear: 1988, emergenceYear: 2006, peakYearStart: 2011, peakYearEnd: 2016, truePotential: 93, currentRating: 10,
    personality: 'humilde', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Genro do Diego Maradona. A luva respeita a conexão sagrada.',
    monthlyFee: 25,
    discoveryStory: 'Velocidade e giro explosivos. Já mostra a frieza de matador aos 18 no Independiente.',
    futureKnowledge: 'O gol mais dramático da história da Premier League — 93:20 contra o QPR. Artilheiro histórico do City.',
    club: 'Independiente',
  },
  {
    id: 'higuain', name: 'Gonzalo Higuaín', nickname: 'Pipita', position: 'ATA', nationality: 'AR',
    birthYear: 1987, emergenceYear: 2007, peakYearStart: 2013, peakYearEnd: 2016, truePotential: 88, currentRating: 12,
    personality: 'ambicioso', status: 'pelada', signingFee: 120, luva: 500,
    luvaReason: 'Filho de jogador argentino. Ambicioso e técnico. A luva é o investimento no futuro.',
    monthlyFee: 30,
    discoveryStory: 'Centroavante técnico de famíla de futebol. Real Madrid o descobre cedo.',
    futureKnowledge: 'Artilheiro recordista da Série A em uma temporada. Pipita vai decidir muitos jogos.',
    club: 'River Plate (base)',
  },
  {
    id: 'dimaria', name: 'Ángel Di María', nickname: 'El Fideo', position: 'MEI', nationality: 'AR',
    birthYear: 1988, emergenceYear: 2007, peakYearStart: 2014, peakYearEnd: 2015, truePotential: 88, currentRating: 10,
    personality: 'leal', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Família humilde de Rosário. A luva ajuda os pais que trabalhavam na fábrica de carvão.',
    monthlyFee: 25,
    discoveryStory: 'Meia-ponta elétrico do Rosário Central. Pés rápidos e visão de jogo acima da média.',
    futureKnowledge: 'Melhor em campo na final da Champions de 2014. Vai ao PSG com Neymar e Mbappé.',
    club: 'Rosário Central (base)',
  },

  // ─── ESPANHA (novos) ─────────────────────────────────────────
  {
    id: 'villa', name: 'David Villa', nickname: 'El Guaje', position: 'ATA', nationality: 'ES',
    birthYear: 1981, emergenceYear: 2002, peakYearStart: 2008, peakYearEnd: 2011, truePotential: 88, currentRating: 18,
    personality: 'leal', status: 'pelada', signingFee: 200, luva: 600,
    luvaReason: 'Das Astúrias, família mineira. A luva é o reconhecimento do esforço de um menino da periferia.',
    monthlyFee: 45,
    discoveryStory: 'Atacante técnico das categorias do Zaragoza. Pé esquerdo e direito em harmonia.',
    futureKnowledge: 'Artilheiro histórico da seleção espanhola. Gol na semi da Copa de 2010. El Guaje.',
    club: 'Zaragoza (base)',
  },
  {
    id: 'puyol', name: 'Carles Puyol', nickname: 'Puyol', position: 'ZAG', nationality: 'ES',
    birthYear: 1978, emergenceYear: 1999, peakYearStart: 2005, peakYearEnd: 2010, truePotential: 87, currentRating: 28,
    personality: 'leal', status: 'pelada', signingFee: 280, luva: 800,
    luvaReason: 'De La Pobla de Segur, interior catalão. Família simples, caráter inabalável.',
    monthlyFee: 65,
    discoveryStory: 'Zagueiro combativo da La Masia. Cabelão e coração de guerreiro. Liderança visceral.',
    futureKnowledge: 'Capitão do Barça e da Espanha. O gol de cabeça na semi da Copa 2010 é épico.',
    club: 'La Masia',
  },
  {
    id: 'ramos', name: 'Sergio Ramos', nickname: 'Ramos', position: 'ZAG', nationality: 'ES',
    birthYear: 1986, emergenceYear: 2004, peakYearStart: 2010, peakYearEnd: 2016, truePotential: 90, currentRating: 10,
    personality: 'ambicioso', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Sevilhano orgulhoso. A luva é pra família e pra garantir que ele fica do seu lado.',
    monthlyFee: 25,
    discoveryStory: 'Sevilhano com coragem de leão. Já no Sevilla mostra liderança e qualidade técnica fora do comum para um zagueiro.',
    futureKnowledge: 'Vai marcar gols decisivos em finais de Champions. Capitão do Real e da Espanha. Suspensão constante, mas incomparável.',
    club: 'Sevilla (base)',
  },
  {
    id: 'xabi_alonso', name: 'Xabi Alonso', nickname: 'Xabi', position: 'MEI', nationality: 'ES',
    birthYear: 1981, emergenceYear: 2001, peakYearStart: 2008, peakYearEnd: 2013, truePotential: 89, currentRating: 22,
    personality: 'leal', status: 'pelada', signingFee: 220, luva: 700,
    luvaReason: 'Filho de jogador do Athletic. A luva é o investimento num talento herdado.',
    monthlyFee: 50,
    discoveryStory: 'Meia de passe longo perfeito da Real Sociedad. Inteligência e elegância.',
    futureKnowledge: 'Pilar do Liverpool de Istambul e do Real Madrid. Passe de 50 metros que encontra o atacante como laser.',
    club: 'Real Sociedad',
  },
  {
    id: 'silva_d', name: 'David Silva', nickname: 'Merlin', position: 'MEI', nationality: 'ES',
    birthYear: 1986, emergenceYear: 2005, peakYearStart: 2011, peakYearEnd: 2015, truePotential: 89, currentRating: 12,
    personality: 'humilde', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Das Ilhas Canárias, família humilde de Gran Canaria. A luva é o sonho realizado.',
    monthlyFee: 25,
    discoveryStory: 'Menino das Canárias no Valencia. Toque curto e visão de jogo que hipnotizam.',
    futureKnowledge: 'Merlin do Man City por uma década. 10 anos de Premier League e títulos. Mágico discreto.',
    club: 'Valencia (base)',
  },
  {
    id: 'busquets', name: 'Sergio Busquets', nickname: 'Busi', position: 'MEI', nationality: 'ES',
    birthYear: 1988, emergenceYear: 2008, peakYearStart: 2010, peakYearEnd: 2015, truePotential: 87, currentRating: 8,
    personality: 'humilde', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Filho de goleiro do Barça. Família de futebol, pés no chão.',
    monthlyFee: 20,
    discoveryStory: 'Volante da La Masia que parece lento mas nunca perde a bola. Guardiola vai descobri-lo.',
    futureKnowledge: 'O volante que Guardiola vai chamar de indispensável. Melhor posicionamento tático da história.',
    club: 'La Masia',
  },

  // ─── HOLANDA (novos) ─────────────────────────────────────────
  {
    id: 'robben', name: 'Arjen Robben', nickname: 'Robben', position: 'MEI', nationality: 'NL',
    birthYear: 1984, emergenceYear: 2002, peakYearStart: 2009, peakYearEnd: 2014, truePotential: 88, currentRating: 18,
    personality: 'ambicioso', status: 'pelada', signingFee: 200, luva: 600,
    luvaReason: 'Holandês de Bedum, pequena cidade do norte. A luva é o primeiro grande contrato da vida.',
    monthlyFee: 45,
    discoveryStory: 'Ponta esquerda que só vai para a direita — e ninguém para. O corte para o pé esquerdo já é previsível e imparável.',
    futureKnowledge: 'O gol que dá a Champions ao Bayern em 2013. Vai arruinar Espanha na Copa de 2014.',
    club: 'Groningen',
  },
  {
    id: 'sneijder', name: 'Wesley Sneijder', nickname: 'Sneijder', position: 'MEI', nationality: 'NL',
    birthYear: 1984, emergenceYear: 2003, peakYearStart: 2009, peakYearEnd: 2011, truePotential: 87, currentRating: 14,
    personality: 'ambicioso', status: 'pelada', signingFee: 140, luva: 500,
    luvaReason: 'De Utrecht, familia de futebol. A luva é o reconhecimento precoce.',
    monthlyFee: 35,
    discoveryStory: 'Meia técnico do Ajax com chute de longe fulminante. Ambição de estrela.',
    futureKnowledge: 'Inter de Milão tricampeã de 2010 — o motor foi ele. Quase ganhou a Bola de Ouro.',
    club: 'Ajax (base)',
  },
  {
    id: 'van_persie', name: 'Robin van Persie', nickname: 'RVP', position: 'ATA', nationality: 'NL',
    birthYear: 1983, emergenceYear: 2004, peakYearStart: 2011, peakYearEnd: 2013, truePotential: 88, currentRating: 12,
    personality: 'leal', status: 'pelada', signingFee: 120, luva: 450,
    luvaReason: 'Filho de artista de Rotterdam. Família criativa, talento natural.',
    monthlyFee: 30,
    discoveryStory: 'Atacante elegante com pé esquerdo de ouro. Arsenal já sonha com ele.',
    futureKnowledge: 'Artilheiro do Arsenal e United. O hat-trick de voleio contra a Espanha na Copa de 2014.',
    club: 'Feyenoord',
  },
  {
    id: 'van_der_sar', name: 'Edwin van der Sar', nickname: 'Van der Sar', position: 'GOL', nationality: 'NL',
    birthYear: 1970, emergenceYear: 1993, peakYearStart: 1998, peakYearEnd: 2008, truePotential: 88, currentRating: 70,
    personality: 'leal', status: 'pro', signingFee: 1200, luva: 2000,
    luvaReason: 'Goleiro do Ajax campeão da Champions. A luva é o status que ele merece.',
    monthlyFee: 220,
    discoveryStory: 'Goleiro alto e seguro do Ajax. Calmo, reflexos rápidos, comanda a área com autoridade.',
    futureKnowledge: 'Vai brilhar no Ajax, Juve, Fulham e United. Em 2009 é o goleiro mais regular do mundo.',
    club: 'Ajax',
  },

  // ─── ALEMANHA (novos) ────────────────────────────────────────
  {
    id: 'klose', name: 'Miroslav Klose', nickname: 'Klose', position: 'ATA', nationality: 'DE',
    birthYear: 1978, emergenceYear: 2001, peakYearStart: 2006, peakYearEnd: 2010, truePotential: 87, currentRating: 20,
    personality: 'humilde', status: 'pelada', signingFee: 200, luva: 600,
    luvaReason: 'Nascido na Polônia, cresceu na Alemanha. Família humilde de trabalhadores.',
    monthlyFee: 45,
    discoveryStory: 'Atacante técnico e elegante. Cabeceio preciso, fairplay absoluto. Nascido na Polônia, coração alemão.',
    futureKnowledge: 'Artilheiro histórico das Copas do Mundo com 16 gols. 7 a 1 contra o Brasil em 2014.',
    club: 'Kaiserslautern (base)',
  },
  {
    id: 'lahm', name: 'Philipp Lahm', nickname: 'Lahm', position: 'LAT', nationality: 'DE',
    birthYear: 1983, emergenceYear: 2003, peakYearStart: 2008, peakYearEnd: 2014, truePotential: 90, currentRating: 14,
    personality: 'humilde', status: 'pelada', signingFee: 140, luva: 500,
    luvaReason: 'Menino do Bayern, família de Münchner. A luva é pequena — ele é grande.',
    monthlyFee: 35,
    discoveryStory: 'Lateral-direito minúsculo mas completo. Tática, técnica e inteligência em 1,70m.',
    futureKnowledge: 'Levanta a taça em 2014. Considerado o melhor lateral da história por muitos. Quase nunca erra.',
    club: 'Bayern de Munique (base)',
  },
  {
    id: 'schweinsteiger', name: 'Bastian Schweinsteiger', nickname: 'Schweini', position: 'MEI', nationality: 'DE',
    birthYear: 1984, emergenceYear: 2004, peakYearStart: 2012, peakYearEnd: 2014, truePotential: 88, currentRating: 10,
    personality: 'leal', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Bávaro do sul da Alemanha. Família e clube são tudo para ele.',
    monthlyFee: 25,
    discoveryStory: 'Meia jovem do Bayern com motor de guerreiro e passe de craque.',
    futureKnowledge: 'Vai ser o capitão da Alemanha campeã de 2014. Carregar o time no sangue e no suor.',
    club: 'Bayern de Munique (base)',
  },
  {
    id: 'neuer', name: 'Manuel Neuer', nickname: 'Neuer', position: 'GOL', nationality: 'DE',
    birthYear: 1986, emergenceYear: 2008, peakYearStart: 2011, peakYearEnd: 2016, truePotential: 94, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Do Schalke, fanático da região do Ruhr. A luva é o primeiro grande passo.',
    monthlyFee: 20,
    discoveryStory: 'Goleiro do Schalke que sai do gol como zagueiro. Conceito novo de goleiro-libero.',
    futureKnowledge: 'O goleiro-líbero que muda a função para sempre. Melhor do mundo em 2014. A Copa em casa.',
    club: 'Schalke 04',
  },
  {
    id: 'muller_t', name: 'Thomas Müller', nickname: 'Müller T', position: 'ATA', nationality: 'DE',
    birthYear: 1989, emergenceYear: 2008, peakYearStart: 2013, peakYearEnd: 2016, truePotential: 88, currentRating: 8,
    personality: 'humilde', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Bávaro puro do Bayern. Simples e decisivo. A luva é quase simbólica.',
    monthlyFee: 20,
    discoveryStory: 'Atacante sem posição fixa do Bayern. Fica em todos os lugares certos na hora certa.',
    futureKnowledge: 'Artilheiro da Copa de 2010 e 2014. O "Raumdeuter" — o interpretador do espaço.',
    club: 'Bayern de Munique (base)',
  },
  {
    id: 'ozil', name: 'Mesut Özil', nickname: 'Özil', position: 'MEI', nationality: 'DE',
    birthYear: 1988, emergenceYear: 2007, peakYearStart: 2011, peakYearEnd: 2014, truePotential: 88, currentRating: 10,
    personality: 'difícil', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Turco-alemão de Gelsenkirchen. Orgulho duplo, pressão dupla.',
    monthlyFee: 25,
    discoveryStory: 'Meia-armador do Werder Bremen com olhos sonolentos e visão de jogo extraordinária.',
    futureKnowledge: 'Arsenal vai pagar €50M. Passes impossíveis que só ele enxerga. Assistência máquina.',
    club: 'Werder Bremen',
  },

  // ─── ITÁLIA (novos) ──────────────────────────────────────────
  {
    id: 'cannavaro', name: 'Fabio Cannavaro', nickname: 'Cannavaro', position: 'ZAG', nationality: 'IT',
    birthYear: 1973, emergenceYear: 1993, peakYearStart: 2004, peakYearEnd: 2007, truePotential: 87, currentRating: 66,
    personality: 'leal', status: 'pro', signingFee: 1300, luva: 2200,
    luvaReason: 'Napolitano orgulhoso que vai vestir as maiores camisas do mundo.',
    monthlyFee: 230,
    discoveryStory: 'Zagueiro de 1,76m com desempenho de gigante. Napoli o apresenta jovem.',
    futureKnowledge: 'Bola de Ouro 2006 — único defensor puro desde 1963. Capitão campeão do mundo.',
    club: 'Napoli',
  },
  {
    id: 'inzaghi', name: 'Filippo Inzaghi', nickname: 'Pippo', position: 'ATA', nationality: 'IT',
    birthYear: 1973, emergenceYear: 1994, peakYearStart: 1998, peakYearEnd: 2003, truePotential: 84, currentRating: 55,
    personality: 'ambicioso', status: 'base', signingFee: 700, luva: 1100,
    luvaReason: 'De Piacenza, filho de treinador. Goleador com sangue frio herdado.',
    monthlyFee: 130,
    discoveryStory: 'Matador de área puro que vive no impedimento — mas quando é válido, não perdoa.',
    futureKnowledge: 'Dois gols na final da Champions de 2007 com 33 anos. El Pippo eternamente.',
    club: 'Parma',
  },
  {
    id: 'gattuso', name: 'Gennaro Gattuso', nickname: 'Rino', position: 'MEI', nationality: 'IT',
    birthYear: 1978, emergenceYear: 1997, peakYearStart: 2004, peakYearEnd: 2008, truePotential: 82, currentRating: 38,
    personality: 'difícil', status: 'base', signingFee: 400, luva: 700,
    luvaReason: 'Calabrês bravo. A luva é o respeito que ele cobra de todos.',
    monthlyFee: 90,
    discoveryStory: 'Volante destruidor calabrês. Marca qualquer um, intimida qualquer craque. Coração raivoso.',
    futureKnowledge: 'Motor do Milan campeão da Champions. O guerreiro que o Barça teme entrar em campo.',
    club: 'Perugia',
  },

  // ─── INGLATERRA (novos) ──────────────────────────────────────
  {
    id: 'rooney', name: 'Wayne Rooney', nickname: 'Rooney', position: 'ATA', nationality: 'EN',
    birthYear: 1985, emergenceYear: 2002, peakYearStart: 2009, peakYearEnd: 2012, truePotential: 88, currentRating: 14,
    personality: 'difícil', status: 'pelada', signingFee: 140, luva: 500,
    luvaReason: 'Menino de Liverpool com raiva, garra e talento. A luva é o começo da jornada.',
    monthlyFee: 35,
    discoveryStory: 'Menino de 16 anos do Everton com garra, força e técnica de veterano. Everton grita seu nome na arquibancada.',
    futureKnowledge: 'Artilheiro histórico da seleção inglesa e do Manchester United. Nunca vai ganhar a Copa — mas vai marcar seu nome.',
    club: 'Everton (base)',
  },
  {
    id: 'terry', name: 'John Terry', nickname: 'JT', position: 'ZAG', nationality: 'EN',
    birthYear: 1980, emergenceYear: 2000, peakYearStart: 2004, peakYearEnd: 2010, truePotential: 88, currentRating: 24,
    personality: 'ambicioso', status: 'pelada', signingFee: 250, luva: 800,
    luvaReason: 'Londrino fanático do Chelsea. A luva é o preço da lealdade ao clube da vida.',
    monthlyFee: 55,
    discoveryStory: 'Zagueiro agressivo da academia do Chelsea. Liderança e força antes da hora.',
    futureKnowledge: 'Capitão do Chelsea por 15 anos. Múltiplos títulos da Premier League. Líder inabalável.',
    club: 'Chelsea (base)',
  },
  {
    id: 'cole_a', name: 'Ashley Cole', nickname: 'Cole', position: 'LAT', nationality: 'EN',
    birthYear: 1980, emergenceYear: 2001, peakYearStart: 2005, peakYearEnd: 2009, truePotential: 87, currentRating: 22,
    personality: 'ambicioso', status: 'pelada', signingFee: 220, luva: 700,
    luvaReason: 'De Stepney, leste de Londres. A luva é o salto de vida que o talento permite.',
    monthlyFee: 50,
    discoveryStory: 'Lateral esquerdo do Arsenal veloz e técnico. Bom nos dois lados do campo.',
    futureKnowledge: 'O melhor lateral esquerdo da Premier League por anos. Chelsea paga muito por ele.',
    club: 'Arsenal (base)',
  },

  // ─── BÉLGICA ─────────────────────────────────────────────────
  {
    id: 'de_bruyne', name: 'Kevin De Bruyne', nickname: 'KDB', position: 'MEI', nationality: 'BE',
    birthYear: 1991, emergenceYear: 2012, peakYearStart: 2017, peakYearEnd: 2021, truePotential: 93, currentRating: 6,
    personality: 'ambicioso', status: 'pelada', signingFee: 60, luva: 250,
    luvaReason: 'De Ghent, Bélgica. Ambicioso desde criança. A luva é o primeiro passo pro topo.',
    monthlyFee: 15,
    discoveryStory: 'Menino de Ghent no Chelsea que vai ceder espaço mas explodir no City. Visão de jogo fora de série.',
    futureKnowledge: 'O melhor meia-atacante da Premier League por anos. Faz passes que ninguém enxerga antes dele.',
    club: 'Genk',
  },
  {
    id: 'hazard', name: 'Eden Hazard', nickname: 'Hazard', position: 'MEI', nationality: 'BE',
    birthYear: 1991, emergenceYear: 2012, peakYearStart: 2014, peakYearEnd: 2018, truePotential: 90, currentRating: 6,
    personality: 'humilde', status: 'pelada', signingFee: 60, luva: 250,
    luvaReason: 'Belga de família de jogadores. Quatro irmãos jogadores. A luva é modesta como ele.',
    monthlyFee: 15,
    discoveryStory: 'Menino prodígio do Lille com drible e velocidade que hipnotiza defensores.',
    futureKnowledge: 'Craque do Chelsea por 7 anos. Melhor da temporada 2014-15. Vai ao Real Madrid.',
    club: 'Lille',
  },
  {
    id: 'kompany', name: 'Vincent Kompany', nickname: 'Kompany', position: 'ZAG', nationality: 'BE',
    birthYear: 1986, emergenceYear: 2006, peakYearStart: 2011, peakYearEnd: 2016, truePotential: 87, currentRating: 10,
    personality: 'leal', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Bruxelense filho de congolês. Família de luta e caráter. A luva é o reconhecimento disso.',
    monthlyFee: 25,
    discoveryStory: 'Zagueiro imponente do Anderlecht. Capitão nato desde jovem.',
    futureKnowledge: 'Capitão do Man City campeão. O gol de longe contra o Leicester vai decidir o título de 2019.',
    club: 'Anderlecht',
  },
  {
    id: 'lukaku', name: 'Romelu Lukaku', nickname: 'Big Rom', position: 'ATA', nationality: 'BE',
    birthYear: 1993, emergenceYear: 2012, peakYearStart: 2017, peakYearEnd: 2021, truePotential: 87, currentRating: 4,
    personality: 'ambicioso', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Pai jogador, família pobre de Antuérpia. A luva é pra família que sofreu junto.',
    monthlyFee: 10,
    discoveryStory: 'Menino gigante do Anderlecht que marca e marca. Físico de touro, pé de ouro.',
    futureKnowledge: 'Artilheiro da seleção belga de todos os tempos. Inter de Milão o descobre melhor.',
    club: 'Anderlecht (base)',
  },

  // ─── CROÁCIA (novos) ─────────────────────────────────────────
  {
    id: 'modric', name: 'Luka Modrić', nickname: 'Luka', position: 'MEI', nationality: 'HR',
    birthYear: 1985, emergenceYear: 2004, peakYearStart: 2012, peakYearEnd: 2018, truePotential: 91, currentRating: 10,
    personality: 'humilde', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Criado durante a guerra da Croácia. Cada conquista tem o peso da história do país.',
    monthlyFee: 25,
    discoveryStory: 'Meia croata que cresceu durante a guerra. Frágil na aparência, colossal na técnica e resistência.',
    futureKnowledge: 'Melhor do mundo em 2018 levando a Croácia à final da Copa. Coração do Real Madrid por uma década.',
    club: 'Zrinjski (base)',
  },
  {
    id: 'rakitic', name: 'Ivan Rakitić', nickname: 'Rakitić', position: 'MEI', nationality: 'HR',
    birthYear: 1988, emergenceYear: 2008, peakYearStart: 2014, peakYearEnd: 2018, truePotential: 87, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Croata criado na Suíça. Família entre dois países, coração croata.',
    monthlyFee: 20,
    discoveryStory: 'Meia completo formado no Basel. Técnica e garra em cada jogada.',
    futureKnowledge: 'Vai para o Barça e conquistar títulos com Messi. Meia de alto nível por uma década.',
    club: 'Dinamo Zagreb (base)',
  },
  {
    id: 'mandzukic', name: 'Mario Mandžukić', nickname: 'Mandzukic', position: 'ATA', nationality: 'HR',
    birthYear: 1986, emergenceYear: 2008, peakYearStart: 2013, peakYearEnd: 2018, truePotential: 84, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Guerreiro croata de Slavonski Brod. A luva é o começo de uma longa batalha.',
    monthlyFee: 20,
    discoveryStory: 'Centroavante físico e combativo do Dínamo Zagreb. Garra e sacrifício acima do talento.',
    futureKnowledge: 'Gol de bicicleta na final da Copa de 2018. Bayern, Juve — guerreiro por onde passa.',
    club: 'NK Zagreb',
  },

  // ─── URUGUAI ─────────────────────────────────────────────────
  {
    id: 'suarez', name: 'Luis Suárez', nickname: 'Suárez', position: 'ATA', nationality: 'UY',
    birthYear: 1987, emergenceYear: 2006, peakYearStart: 2013, peakYearEnd: 2016, truePotential: 92, currentRating: 10,
    personality: 'difícil', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'De Montevidéu, um dos nove filhos de família pobre. A luva alimenta a família.',
    monthlyFee: 25,
    discoveryStory: 'Atacante elétrico do Nacional. Come a bola e às vezes a bola dos adversários. Faro de gol absurdo.',
    futureKnowledge: 'Artilheiro histórico do Barça e do Uruguai. La Mano de Suárez na Copa de 2010 — expulso mas herói.',
    club: 'Nacional (base)',
  },
  {
    id: 'cavani', name: 'Edinson Cavani', nickname: 'El Matador', position: 'ATA', nationality: 'UY',
    birthYear: 1987, emergenceYear: 2008, peakYearStart: 2013, peakYearEnd: 2018, truePotential: 88, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'De Salto, norte do Uruguai. Família de futebol, destino traçado.',
    monthlyFee: 20,
    discoveryStory: 'Centroavante técnico do Danubio. Movimentação precisa e finalização clínica.',
    futureKnowledge: 'Artilheiro histórico do PSG com 200 gols. Profissional exemplar e matador clínico.',
    club: 'Danubio',
  },
  {
    id: 'forlan', name: 'Diego Forlán', nickname: 'Cachavacha', position: 'ATA', nationality: 'UY',
    birthYear: 1979, emergenceYear: 2001, peakYearStart: 2008, peakYearEnd: 2011, truePotential: 87, currentRating: 22,
    personality: 'leal', status: 'pelada', signingFee: 220, luva: 700,
    luvaReason: 'Filho de jogador e neto de tenista. Família de atletas que espera o auge dele.',
    monthlyFee: 50,
    discoveryStory: 'Atacante do Independiente com pé esquerdo preciso. Filho de jogador, DNA de craque.',
    futureKnowledge: 'Melhor jogador da Copa de 2010. Artilheiro do Atletico de Madrid com dois Europeus. Tardio mas eterno.',
    club: 'Independiente',
  },

  // ─── COLÔMBIA (novos) ────────────────────────────────────────
  {
    id: 'falcao', name: 'Radamel Falcão', nickname: 'El Tigre', position: 'ATA', nationality: 'CO',
    birthYear: 1986, emergenceYear: 2005, peakYearStart: 2011, peakYearEnd: 2014, truePotential: 90, currentRating: 12,
    personality: 'leal', status: 'pelada', signingFee: 120, luva: 450,
    luvaReason: 'Pai ex-jogador colombiano. A luva é o passo certo pro filho que vai superar o pai.',
    monthlyFee: 30,
    discoveryStory: 'Centroavante de área colombiano, faro de gol e chute forte. O River Plate vai revelá-lo ao mundo.',
    futureKnowledge: 'Artilheiro da Liga Europa, Série A, Ligue 1. Joelho vai trair antes da Copa de 2014 — mas o tigre rugiu.',
    club: 'River Plate (base)',
  },
  {
    id: 'james', name: 'James Rodríguez', nickname: 'James', position: 'MEI', nationality: 'CO',
    birthYear: 1991, emergenceYear: 2012, peakYearStart: 2014, peakYearEnd: 2015, truePotential: 86, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Colombiano de Cúcuta. Família que acredita no talento que o mundo ainda não viu.',
    monthlyFee: 10,
    discoveryStory: 'Meia técnico do Envigado. Pé esquerdo preciso e visão de jogo apurada.',
    futureKnowledge: 'Chutaço da Copa de 2014 que ganha o Prêmio Puskas. Real Madrid paga €80M. A Copa foi dele.',
    club: 'Envigado (base)',
  },

  // ─── CHILE (novos) ───────────────────────────────────────────
  {
    id: 'sanchez', name: 'Alexis Sánchez', nickname: 'Alexis', position: 'MEI', nationality: 'CL',
    birthYear: 1988, emergenceYear: 2008, peakYearStart: 2014, peakYearEnd: 2016, truePotential: 88, currentRating: 8,
    personality: 'ambicioso', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'De Tocopilla, cidade mineira do norte do Chile. Família humilde, fome de vencer.',
    monthlyFee: 20,
    discoveryStory: 'Atacante veloz do Cobreloa com drible e garra dos que cresceram sem nada.',
    futureKnowledge: 'Craque do Arsenal — melhor da temporada 2014-15. Dois títulos da Copa América com o Chile.',
    club: 'Cobreloa',
  },
  {
    id: 'vidal', name: 'Arturo Vidal', nickname: 'King', position: 'MEI', nationality: 'CL',
    birthYear: 1987, emergenceYear: 2007, peakYearStart: 2014, peakYearEnd: 2016, truePotential: 86, currentRating: 10,
    personality: 'difícil', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'De San Joaquín, bairro popular de Santiago. Garra e personalidade que não cabem em campo.',
    monthlyFee: 25,
    discoveryStory: 'Meia guerreiro do Colo-Colo. Jogo físico, gol de área, liderança raivosa.',
    futureKnowledge: 'Rei da Juventus, Bayern e Barça. Copa América 2015 e 2016. O Rei que nunca abaixa a cabeça.',
    club: 'Colo-Colo',
  },

  // ─── FRANÇA (novos) ──────────────────────────────────────────
  {
    id: 'benzema', name: 'Karim Benzema', nickname: 'Benzema', position: 'ATA', nationality: 'FR',
    birthYear: 1987, emergenceYear: 2006, peakYearStart: 2018, peakYearEnd: 2022, truePotential: 91, currentRating: 8,
    personality: 'ambicioso', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'De Bron, banlieue de Lyon. Família de origem argelina, orgulho imenso.',
    monthlyFee: 20,
    discoveryStory: 'Centroavante técnico e elegante de Lyon. Parceria e passes acrobáticos desde os 17.',
    futureKnowledge: 'Bola de Ouro 2022. Artilheiro do Real Madrid em títulos de Champions. A sombra do CR7 que virou luz.',
    club: 'Lyon (base)',
  },
  {
    id: 'lloris', name: 'Hugo Lloris', nickname: 'Lloris', position: 'GOL', nationality: 'FR',
    birthYear: 1986, emergenceYear: 2006, peakYearStart: 2012, peakYearEnd: 2018, truePotential: 88, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Nicoise de família simples. A luva é o início da carreira como capitão.',
    monthlyFee: 20,
    discoveryStory: 'Goleiro do Nice com reflexos excepcionais e liderança natural. Capitão antes da hora.',
    futureKnowledge: 'Capitão da França campeã do mundo em 2018. Tottenham o adora. Defesas impossíveis em finais.',
    club: 'Nice',
  },
  {
    id: 'griezmann', name: 'Antoine Griezmann', nickname: 'Griezmann', position: 'ATA', nationality: 'FR',
    birthYear: 1991, emergenceYear: 2012, peakYearStart: 2016, peakYearEnd: 2018, truePotential: 88, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'De Mâcon, interior da França. Rejeitado pelos clubes franceses — a luva é pequena mas o futuro é grande.',
    monthlyFee: 10,
    discoveryStory: 'Atacante ágil de Mâcon. Rejeitado por times da França — foi para a Real Sociedad na Espanha descobrir a si mesmo.',
    futureKnowledge: 'Melhor da Euro 2016. Campeão do mundo em 2018. A dança que vira símbolo.',
    club: 'Real Sociedad (base)',
  },
  {
    id: 'pogba', name: 'Paul Pogba', nickname: 'Pogba', position: 'MEI', nationality: 'FR',
    birthYear: 1993, emergenceYear: 2012, peakYearStart: 2016, peakYearEnd: 2019, truePotential: 88, currentRating: 4,
    personality: 'ambicioso', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Guineense-francês de Roissy-en-Brie. A luva é pequena agora — mas vai crescer.',
    monthlyFee: 10,
    discoveryStory: 'Menino gigante do Havre com poder físico e técnico incomuns para a idade.',
    futureKnowledge: 'Transferência recorde para o United em 2016. Campeão do mundo em 2018. Talento imenso.',
    club: 'Le Havre (base)',
  },
  {
    id: 'varane', name: 'Raphaël Varane', nickname: 'Varane', position: 'ZAG', nationality: 'FR',
    birthYear: 1993, emergenceYear: 2012, peakYearStart: 2016, peakYearEnd: 2021, truePotential: 88, currentRating: 4,
    personality: 'leal', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'De Lille, família antilhana. Zidane vai ligar pessoalmente para convencer o Real.',
    monthlyFee: 10,
    discoveryStory: 'Zagueiro do Lens elegante e veloz. Zidane pessoalmente vai buscá-lo pro Real Madrid.',
    futureKnowledge: 'Quatro Champions com o Real. Campeão do mundo em 2018. Parceria perfeita com Ramos.',
    club: 'Lens (base)',
  },
  {
    id: 'mbappe', name: 'Kylian Mbappé', nickname: 'Mbappé', position: 'ATA', nationality: 'FR',
    birthYear: 1998, emergenceYear: 2016, peakYearStart: 2021, peakYearEnd: 2026, truePotential: 99, currentRating: 6,
    personality: 'ambicioso', status: 'pelada', signingFee: 60, luva: 250,
    luvaReason: 'De Bondy, periferia de Paris. Família estruturada, pai coach, mãe atleta. A luva é simbólica.',
    monthlyFee: 15,
    discoveryStory: 'Garoto de Bondy, periferia de Paris, que já humilha adultos no Monaco aos 17. Velocidade sobrenatural.',
    futureKnowledge: 'Vai superar Pelé como artilheiro de Copa mais jovem. O herdeiro. Em 2026 ainda está no auge.',
    club: 'Monaco (base)',
  },

  // ─── PORTUGAL (novos) ────────────────────────────────────────
  {
    id: 'pepe', name: 'Pépe', nickname: 'Pépe', position: 'ZAG', nationality: 'PT',
    birthYear: 1983, emergenceYear: 2003, peakYearStart: 2009, peakYearEnd: 2016, truePotential: 86, currentRating: 12,
    personality: 'difícil', status: 'pelada', signingFee: 120, luva: 450,
    luvaReason: 'Brasileiro naturalizado português. Agressivo e orgulhoso. A luva é o custo do temperamento.',
    monthlyFee: 30,
    discoveryStory: 'Zagueiro brasileiro do Marítimo com temperamento vulcânico e qualidade técnica.',
    futureKnowledge: 'Pilar da defesa do Real Madrid por uma década. Agressivo mas decisivo — e fiel à bandeira.',
    club: 'Marítimo',
  },
  {
    id: 'quaresma', name: 'Ricardo Quaresma', nickname: 'Quaresma', position: 'MEI', nationality: 'PT',
    birthYear: 1983, emergenceYear: 2003, peakYearStart: 2007, peakYearEnd: 2010, truePotential: 83, currentRating: 12,
    personality: 'difícil', status: 'pelada', signingFee: 120, luva: 450,
    luvaReason: 'Criado em orfanato, descoberto por Sporting. Trágico e genial. A luva é o amparo que nunca teve.',
    monthlyFee: 30,
    discoveryStory: 'Meia do Sporting com trivela impossível. A bola curva para dentro com o exterior do pé.',
    futureKnowledge: 'Tricela na Copa de 2018 vai ser sublime. Talento que prometeu mais — mas o que deu é eterno.',
    club: 'Sporting',
  },

  // ─── BRASIL (grandes ausências) ──────────────────────────────
  {
    id: 'neymar', name: 'Neymar Jr.', nickname: 'Neymar', position: 'MEI', nationality: 'BR',
    birthYear: 1992, emergenceYear: 2009, peakYearStart: 2015, peakYearEnd: 2017, truePotential: 97, currentRating: 6,
    personality: 'ambicioso', status: 'pelada', signingFee: 60, luva: 250,
    luvaReason: 'Menino de Vila São Jorge, Santos. O pai cuida de tudo — mas a luva é o convite sério.',
    monthlyFee: 15,
    discoveryStory: 'Moleque de 17 anos da Vila São Jorge no Santos. Dribla cinco e ainda sorri. Nunca visto antes.',
    futureKnowledge: 'Terceiro maior artilheiro da história das seleções. Vai ao Barça ao lado de Messi. PSG paga 222 milhões. Joelho e tornozelo vão oprimir — mas o talento é eterno.',
    club: 'Santos (base)',
  },
  {
    id: 'thiago_silva', name: 'Thiago Silva', nickname: 'O Monstro', position: 'ZAG', nationality: 'BR',
    birthYear: 1984, emergenceYear: 2004, peakYearStart: 2012, peakYearEnd: 2019, truePotential: 89, currentRating: 10,
    personality: 'leal', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Carioca que quase parou por tuberculose. A luva é o investimento num guerreiro que sobreviveu.',
    monthlyFee: 25,
    discoveryStory: 'Zagueiro carioca que teve tuberculose e quase parou. Vai de volta pelo Fluminense.',
    futureKnowledge: 'Melhor zagueiro do mundo em 2012. Capitão do Brasil na tragédia do 7 a 1 — que não foi culpa dele.',
    club: 'Juventude',
  },
  {
    id: 'dani_alves', name: 'Dani Alves', nickname: 'Dani Alves', position: 'LAT', nationality: 'BR',
    birthYear: 1983, emergenceYear: 2003, peakYearStart: 2010, peakYearEnd: 2016, truePotential: 90, currentRating: 14,
    personality: 'leal', status: 'pelada', signingFee: 140, luva: 500,
    luvaReason: 'Baiano do Juazeiro. A luva é o começo do homem que vai ganhar tudo.',
    monthlyFee: 35,
    discoveryStory: 'Lateral baiano do Bahia, campeão de reggae e futebol. Ataca como atacante, defende como zagueiro.',
    futureKnowledge: 'O lateral com mais títulos da história do futebol. Barça, Juve, PSG. Sempre festejando, sempre decisivo.',
    club: 'Bahia (base)',
  },
  {
    id: 'marcelo', name: 'Marcelo Vieira', nickname: 'Marcelo', position: 'LAT', nationality: 'BR',
    birthYear: 1988, emergenceYear: 2006, peakYearStart: 2012, peakYearEnd: 2017, truePotential: 89, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Carioca do Fluminense. Alegre, criativo, dedicado. A luva é o primeiro grande sonho.',
    monthlyFee: 20,
    discoveryStory: 'Lateral esquerdo ofensivo do Fluminense. Regate, drible e jogada como se fosse atacante.',
    futureKnowledge: 'Seis Champions com o Real Madrid. O melhor lateral esquerdo do mundo por anos.',
    club: 'Fluminense (base)',
  },
  {
    id: 'hulk_br', name: 'Hulk', nickname: 'Hulk', position: 'ATA', nationality: 'BR',
    birthYear: 1986, emergenceYear: 2007, peakYearStart: 2012, peakYearEnd: 2014, truePotential: 85, currentRating: 10,
    personality: 'ambicioso', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Campina Grande, Paraíba. Vida dura que forjou o chute mais forte do Brasil.',
    monthlyFee: 25,
    discoveryStory: 'Atacante nordestino que foi pro Japão ficar rico e voltou como estrela. Chute de canhão.',
    futureKnowledge: 'Porto e Zenit pagam fortunas por ele. Chute mais potente do Brasil.',
    club: 'Vitória (base)',
  },
  {
    id: 'oscar', name: 'Oscar', nickname: 'Oscar', position: 'MEI', nationality: 'BR',
    birthYear: 1991, emergenceYear: 2011, peakYearStart: 2013, peakYearEnd: 2015, truePotential: 84, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Interior de São Paulo, família simples. A luva é pequena como o menino tímido.',
    monthlyFee: 10,
    discoveryStory: 'Meia técnico do Internacional, inteligente e criativo. Chelsea vai adorá-lo.',
    futureKnowledge: 'Chelsea o compra jovem. Vai pro Shanghai SIPG por muito dinheiro. Bom mas não chegou ao topo.',
    club: 'Internacional (base)',
  },
  {
    id: 'coutinho', name: 'Philippe Coutinho', nickname: 'Coutinho', position: 'MEI', nationality: 'BR',
    birthYear: 1992, emergenceYear: 2012, peakYearStart: 2017, peakYearEnd: 2018, truePotential: 87, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Ituiutabano criado na pobreza. A luva é o começo de tudo.',
    monthlyFee: 10,
    discoveryStory: 'Meia do Vasco elegante e dribla. Inter de Milão o descobre jovem.',
    futureKnowledge: 'Liverpool o ama e o Barça paga €160M. Talento enorme que a pressão do Barça vai dificultar.',
    club: 'Vasco (base)',
  },
  {
    id: 'firmino', name: 'Roberto Firmino', nickname: 'Bobby', position: 'ATA', nationality: 'BR',
    birthYear: 1991, emergenceYear: 2012, peakYearStart: 2017, peakYearEnd: 2019, truePotential: 85, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Maceioense que quase não chegou ao profissional. A luva é o reconhecimento tardio.',
    monthlyFee: 10,
    discoveryStory: 'Atacante do Figueirense técnico e dedicado. Vai pro Hoffenheim descobrir a si mesmo.',
    futureKnowledge: 'Falso-9 revolucionário do Liverpool de Klopp. Champions de 2019. Sorriso eterno.',
    club: 'Figueirense (base)',
  },
  {
    id: 'fernandinho', name: 'Fernandinho', nickname: 'Fernandinho', position: 'MEI', nationality: 'BR',
    birthYear: 1985, emergenceYear: 2007, peakYearStart: 2013, peakYearEnd: 2018, truePotential: 84, currentRating: 10,
    personality: 'leal', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Londrinense que vai pro Shakhtar descobrir o mundo. A luva é o passo inicial.',
    monthlyFee: 25,
    discoveryStory: 'Volante disciplinado do Athletico Paranaense com boa saída de bola.',
    futureKnowledge: 'Capitão do Man City campeão. Volante essencial do projeto Guardiola.',
    club: 'Athletico Paranaense',
  },
  {
    id: 'maicon', name: 'Maicon', nickname: 'Maicon', position: 'LAT', nationality: 'BR',
    birthYear: 1981, emergenceYear: 2003, peakYearStart: 2009, peakYearEnd: 2011, truePotential: 86, currentRating: 18,
    personality: 'leal', status: 'pelada', signingFee: 180, luva: 600,
    luvaReason: 'Caxiense que vai pro Monaco e depois Inter. A luva é o primeiro sinal de que vai longe.',
    monthlyFee: 45,
    discoveryStory: 'Lateral direito poderoso do Cruzeiro. Sobe pela direita como um touro de 94kg.',
    futureKnowledge: 'Melhor lateral direito do mundo em 2009. Gol solo impossível contra a Seleção Canarinho.',
    club: 'Cruzeiro',
  },
  {
    id: 'fred_br', name: 'Fred', nickname: 'Fred', position: 'ATA', nationality: 'BR',
    birthYear: 1983, emergenceYear: 2006, peakYearStart: 2012, peakYearEnd: 2014, truePotential: 82, currentRating: 12,
    personality: 'leal', status: 'pelada', signingFee: 120, luva: 450,
    luvaReason: 'Belo-horizontino que vai pro Lyon descobrir o gol na Europa.',
    monthlyFee: 30,
    discoveryStory: 'Centroavante típico do Cruzeiro. Gols de área, pé forte, leal ao clube e ao Brasil.',
    futureKnowledge: 'Artilheiro do Fluminense e da Copa de 2014 no Brasil. Vai ser artilheiro quando mais importa.',
    club: 'Cruzeiro',
  },
  {
    id: 'david_luiz', name: 'David Luiz', nickname: 'David Luiz', position: 'ZAG', nationality: 'BR',
    birthYear: 1987, emergenceYear: 2007, peakYearStart: 2012, peakYearEnd: 2015, truePotential: 84, currentRating: 10,
    personality: 'difícil', status: 'pelada', signingFee: 100, luva: 400,
    luvaReason: 'Itapevense com cabelo afro marcante. A luva é o combustível para o espetáculo.',
    monthlyFee: 25,
    discoveryStory: 'Zagueiro do Vitória com chute de longe e habilidade de meia. Diferente de todos os outros.',
    futureKnowledge: 'Chelsea e PSG pagam fortunas. Um gol na Copa, um erro na Copa. Sempre espetacular.',
    club: 'Vitória (base)',
  },

  // ─── OUTROS PAÍSES ───────────────────────────────────────────
  {
    id: 'lewandowski', name: 'Robert Lewandowski', nickname: 'Lewy', position: 'ATA', nationality: 'PL',
    birthYear: 1988, emergenceYear: 2008, peakYearStart: 2015, peakYearEnd: 2021, truePotential: 92, currentRating: 8,
    personality: 'leal', status: 'pelada', signingFee: 80, luva: 300,
    luvaReason: 'Varsoviano dedicado ao extremo. A luva é pequena agora — mas ele vai fazer valer.',
    monthlyFee: 20,
    discoveryStory: 'Centroavante técnico e clínico polonês. Lechia Gdansk o vende barato. Erro histórico deles.',
    futureKnowledge: 'Cinco artilheiros da Bundesliga seguidos. O hat-trick em 9 minutos. Bola de Ouro quase certo em 2020.',
    club: 'Znicz Pruszkow',
  },
  {
    id: 'son', name: 'Son Heung-min', nickname: 'Son', position: 'ATA', nationality: 'KR',
    birthYear: 1992, emergenceYear: 2012, peakYearStart: 2019, peakYearEnd: 2022, truePotential: 87, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'Sul-coreano de Chuncheon. Pai ex-futebolista, filho dedicado ao extremo.',
    monthlyFee: 10,
    discoveryStory: 'Atacante técnico do Hamburgo formado na Alemanha. Velocidade e técnica europeia, coração asiático.',
    futureKnowledge: 'Artilheiro compartilhado da Premier League em 2022. Craque do Tottenham por uma década.',
    club: 'Hamburgo (base)',
  },
  {
    id: 'salah', name: 'Mohamed Salah', nickname: 'O Faraó', position: 'MEI', nationality: 'EG',
    birthYear: 1992, emergenceYear: 2012, peakYearStart: 2017, peakYearEnd: 2021, truePotential: 90, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'De Nagrig, interior do Egito. Família simples que acredita no dom do menino.',
    monthlyFee: 10,
    discoveryStory: 'Ponta rápida egípcia do Basel. O Chelsea vai comprá-lo e desperdiçar. Mas Liverpool vai acertar.',
    futureKnowledge: 'Artilheiro histórico do Liverpool. 3 gols em uma final de Champions. O Faraó de Liverpool.',
    club: 'Al Mokawloon',
  },
  {
    id: 'mane', name: 'Sadio Mané', nickname: 'Mané', position: 'ATA', nationality: 'SN',
    birthYear: 1992, emergenceYear: 2013, peakYearStart: 2018, peakYearEnd: 2022, truePotential: 88, currentRating: 4,
    personality: 'humilde', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'De Sédhiou, Senegal. Cresceu com carência — a luva é o primeiro grande contrato.',
    monthlyFee: 10,
    discoveryStory: 'Atacante veloz do Metz formado no Senegal. Potência, drible e instinto goleador.',
    futureKnowledge: 'Trio Mané-Firmino-Salah do Liverpool é o mais mortal do mundo. Bola de Ouro africana.',
    club: 'Génération Foot',
  },
  {
    id: 'vinicius', name: 'Vinícius Jr.', nickname: 'Vini Jr', position: 'MEI', nationality: 'BR',
    birthYear: 2000, emergenceYear: 2018, peakYearStart: 2022, peakYearEnd: 2026, truePotential: 93, currentRating: 4,
    personality: 'ambicioso', status: 'pelada', signingFee: 40, luva: 150,
    luvaReason: 'De São Gonçalo, Rio. Família simples, sorri pra raiva dos adversários.',
    monthlyFee: 10,
    discoveryStory: 'Menino de São Gonçalo, 15 anos no Flamengo. Velocidade absurda, drible na veia, sorri pra raiva dos adversários.',
    futureKnowledge: 'Melhor do mundo em 2024. O craque que leva o Real Madrid à Champions. Dança após o gol — e eles odeiam isso.',
    club: 'Flamengo (base)',
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
  AR: { label: 'Argentina', flag: '🇦🇷', nationalities: ['AR'], stars: 'La Pulga, Riquelme, Batistuta, Tevez' },
  FR: { label: 'França', flag: '🇫🇷', nationalities: ['FR'], stars: 'Zidane, Henry, Cantona, Drogba' },
  IT: { label: 'Itália', flag: '🇮🇹', nationalities: ['IT'], stars: 'Maldini, Baresi, Totti, Buffon' },
  IB: { label: 'Ibéria', flag: '🇵🇹', nationalities: ['PT', 'ES'], stars: 'CR7, Iniesta, Raúl, Xavi, Figo' },
  NO: { label: 'Europa do Norte', flag: '🇳🇱', nationalities: ['NL', 'DE'], stars: 'Gullit, Van Basten, Bergkamp, Matthäus' },
  EN: { label: 'Ilhas Britânicas', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', nationalities: ['EN', 'IE'], stars: 'Shearer, Giggs, Keane, Scholes, Gerrard' },
  SC: { label: 'Escandinávia', flag: '🇩🇰', nationalities: ['DK', 'SE'], stars: 'Schmeichel, M. Laudrup, B. Laudrup' },
  EL: { label: 'Leste Europeu', flag: '🇷🇴', nationalities: ['BG', 'HR', 'YU', 'RO', 'CZ', 'UA'], stars: 'Hagi, Stoichkov, Savicević, Nedvěd, Šuker' },
  BE: { label: 'Bélgica', flag: '🇧🇪', nationalities: ['BE'], stars: 'De Bruyne, Hazard, Kompany, Lukaku' },
  AF: { label: 'África', flag: '🌍', nationalities: ['LR', 'NG', 'CM', 'EG', 'SN'], stars: 'Weah, Okocha, Eto\'o, Salah, Mané' },
  LA: { label: 'América Latina', flag: '🌎', nationalities: ['CO', 'CL', 'UY'], stars: 'Valderrama, Zamorano, Asprilla, Salas, Suárez, Forlán' },
  AS: { label: 'Ásia', flag: '🌏', nationalities: ['KR'], stars: 'Son Heung-min' },
  PL: { label: 'Polônia', flag: '🇵🇱', nationalities: ['PL'], stars: 'Lewandowski' },
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