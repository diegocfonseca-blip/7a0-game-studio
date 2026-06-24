export interface MatchChoice {
  text: string
  icon: string
  requiredTraitId?: string
  score: 1 | 2 | 3
  narration: string
}

export interface MatchMoment {
  minute: number
  situation: string
  context: string
  defaultChoice: MatchChoice
  traitChoices: MatchChoice[]
}

export const MATCH_MOMENTS: MatchMoment[] = [
  {
    minute: 18,
    situation: 'Bola na sua direção na entrada da área',
    context: 'O zagueiro avança pra cima de você. Há espaço à direita.',
    defaultChoice: {
      text: 'Passar pra lateral',
      icon: '↗️',
      score: 1,
      narration: 'Você passa com segurança. Sem risco, sem glória. A torcida mal percebeu.',
    },
    traitChoices: [
      {
        text: 'Ginga Carioca',
        icon: '🌀',
        requiredTraitId: 'rdinho-dribble',
        score: 3,
        narration: 'Você usou aquele drible que só viu de longe. O zagueiro travou. Você entrou na área. A torcida levantou.',
      },
      {
        text: 'Explosão em Sprint',
        icon: '⚡',
        requiredTraitId: 'r9-speed',
        score: 3,
        narration: 'Primeiro passo fulminante. O zagueiro nem viu quando você passou. Você estava sozinho na área.',
      },
      {
        text: 'Aceleração com Bola',
        icon: '🏃',
        requiredTraitId: 'kaka-acceleration',
        score: 2,
        narration: 'Você ganhou velocidade sem perder controle. Espaço criado. A jogada continuou.',
      },
      {
        text: 'Elástico e Chapéu',
        icon: '🎭',
        requiredTraitId: 'rdinho-elastico',
        score: 3,
        narration: 'O elástico saiu natural. O chapéu veio logo depois. O defensor caiu. A torcida enlouqueceu.',
      },
      {
        text: 'Velocidade de Cheetah',
        icon: '🐆',
        requiredTraitId: 'henry-speed',
        score: 3,
        narration: 'Você simplesmente correu. Ninguém acompanhou. Chegou na área antes que vissem.',
      },
      {
        text: 'Drible em Velocidade',
        icon: '🐭',
        requiredTraitId: 'messi-dribble',
        score: 3,
        narration: 'Corpo baixo, bola colada, dois defensores passaram por baixo. Impossível de marcar.',
      },
    ],
  },
  {
    minute: 34,
    situation: 'Falta a 28 metros do gol',
    context: 'A barreira está posicionada. O goleiro chama os jogadores. O estádio está em silêncio.',
    defaultChoice: {
      text: 'Não cobrar — deixar o companheiro',
      icon: '🤝',
      score: 1,
      narration: 'Você recuou. Um companheiro cobrou e mandou por cima. A torcida vaiou.',
    },
    traitChoices: [
      {
        text: 'Falta Impossível',
        icon: '🌙',
        requiredTraitId: 'rc-freekick',
        score: 3,
        narration: 'A bola saiu rasteira, curvou depois da barreira. Goleiro imóvel. Gol impossível. O estádio explodiu.',
      },
      {
        text: 'Falta com Efeito',
        icon: '⚽',
        requiredTraitId: 'beckham-freekick',
        score: 3,
        narration: 'Você posicionou o corpo como viu uma vez num treino. A bola foi. Curvou no ângulo. Gol.',
      },
      {
        text: 'Knuckleball Letal',
        icon: '🌀',
        requiredTraitId: 'cr7-freekick',
        score: 3,
        narration: 'A bola saiu sem efeito. Ninguém sabia pra onde ia. O goleiro foi pra um lado. A bola foi pro outro.',
      },
      {
        text: 'Genialidade Romana',
        icon: '🏛️',
        requiredTraitId: 'totti-vision',
        score: 2,
        narration: 'Você viu espaço que ninguém havia notado. Passou por baixo da barreira. Quase. A bola raspou o poste.',
      },
    ],
  },
  {
    minute: 71,
    situation: 'Um a um. Você cara a cara com o goleiro',
    context: 'Passe perfeito nas costas da defesa. Você na frente do goleiro. Só isso.',
    defaultChoice: {
      text: 'Chutar com força no centro',
      icon: '🦶',
      score: 1,
      narration: 'O goleiro adivinhou. Defendeu com os dois pés. Você ficou olhando.',
    },
    traitChoices: [
      {
        text: 'Finalização do Fenômeno',
        icon: '💥',
        requiredTraitId: 'r9-finish',
        score: 3,
        narration: 'Você finalizou antes do goleiro reagir. A bola entrou no ângulo. Ele nem se mexeu. Gol de craque.',
      },
      {
        text: 'Canhão Imperador',
        icon: '💣',
        requiredTraitId: 'adriano-power',
        score: 3,
        narration: 'O chute fez o goleiro recuar. A bola passou pela mão que tentou defender e rasgou a rede.',
      },
      {
        text: 'Finalização Rasteira',
        icon: '🎯',
        requiredTraitId: 'messi-finish',
        score: 3,
        narration: 'No cantinho. Rasteiro. O goleiro foi pro alto. Gol. Simples, limpo, definitivo.',
      },
      {
        text: 'Frieza Francesa',
        icon: '🥶',
        requiredTraitId: 'henry-composure',
        score: 3,
        narration: 'Nenhum nervoso. Você esperou o goleiro se antecipar e tocou no canto oposto. Gol.',
      },
      {
        text: 'Frieza no Pênalti',
        icon: '🎯',
        requiredTraitId: 'adriano-penalty',
        score: 2,
        narration: 'Você manteve a calma. Chutou com precisão. A bola entrou rente à trave.',
      },
      {
        text: 'Toque de Veludo',
        icon: '🪶',
        requiredTraitId: 'totti-touch',
        score: 2,
        narration: 'Primeiro toque de chip. O goleiro estava adiantado. A bola passou por cima. Gol de categoria.',
      },
    ],
  },
]

export interface Opponent {
  name: string
  flag: string
  strength: number
  club: string
}

export function generateMatchOpponent(clubLevel: 1 | 2 | 3, currentYear: number): Opponent {
  const level1 = [
    { name: 'EC Divinópolis', strength: 32 },
    { name: 'Nacional FC-MG', strength: 30 },
    { name: 'Araxá FC', strength: 35 },
    { name: 'Esportivo Bambuí', strength: 28 },
    { name: 'Uberlândia FC', strength: 38 },
    { name: 'Pouso Alegre EC', strength: 33 },
    { name: 'Ituiutaba EC', strength: 36 },
  ]
  const level2 = [
    { name: 'Caldense', strength: 52 },
    { name: 'Villa Nova AC', strength: 55 },
    { name: 'Patrocinense', strength: 48 },
    { name: 'Tombense FC', strength: 58 },
    { name: 'Democrata GV', strength: 50 },
    { name: 'Juazeirense', strength: 53 },
    { name: 'Operário VG', strength: 51 },
  ]
  const level3 = [
    { name: 'Santos FC B', strength: 68 },
    { name: 'Internacional B', strength: 72 },
    { name: 'Vasco da Gama B', strength: 70 },
    { name: 'Sport Recife', strength: 65 },
    { name: 'Grêmio B', strength: 74 },
    { name: 'Fluminense B', strength: 67 },
    { name: 'Bahia FC', strength: 63 },
  ]
  const pool = clubLevel === 1 ? level1 : clubLevel === 2 ? level2 : level3
  const pick = pool[Math.floor(Math.random() * pool.length)]
  const yearBonus = Math.round(Math.max(0, currentYear - 1992) * 0.5)
  const strength = Math.min(82, pick.strength + yearBonus)
  return { name: pick.name, flag: '🇧🇷', strength, club: pick.name }
}

export function generateOpponent(currentYear: number, stolenFrom: string[]): Opponent {
  const notStolenLegends = [
    { id: 'r9',          name: 'Ronaldo Nazário',    flag: '🇧🇷', baseStrength: 90 },
    { id: 'ronaldinho',  name: 'Ronaldinho Gaúcho',  flag: '🇧🇷', baseStrength: 88 },
    { id: 'adriano',     name: 'Adriano',             flag: '🇧🇷', baseStrength: 82 },
    { id: 'kaka',        name: 'Kaká',                flag: '🇧🇷', baseStrength: 85 },
    { id: 'roberto-carlos', name: 'Roberto Carlos',  flag: '🇧🇷', baseStrength: 84 },
    { id: 'totti',       name: 'Francesco Totti',    flag: '🇮🇹', baseStrength: 83 },
    { id: 'beckham',     name: 'David Beckham',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', baseStrength: 81 },
    { id: 'henry',       name: 'Thierry Henry',      flag: '🇫🇷', baseStrength: 86 },
    { id: 'cr7',         name: 'Cristiano Ronaldo',  flag: '🇵🇹', baseStrength: 92 },
    { id: 'messi',       name: 'Lionel Messi',       flag: '🇦🇷', baseStrength: 95 },
  ]

  const available = notStolenLegends.filter(l => !stolenFrom.includes(l.id))
  const yearsGrown = Math.max(0, currentYear - 1992)

  if (available.length > 0) {
    const pick = available[Math.floor(Math.random() * available.length)]
    const strength = Math.min(99, pick.baseStrength + Math.floor(yearsGrown * 1.5))
    return { name: pick.name, flag: pick.flag, strength, club: 'Adversário' }
  }

  // All stolen — generic opponent
  const strength = Math.max(40, 65 - Math.floor(stolenFrom.length * 3))
  return { name: 'Zé Comum', flag: '⬜', strength, club: 'Time local' }
}
