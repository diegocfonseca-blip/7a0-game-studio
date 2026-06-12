export interface MatchMoment {
  minute: number
  type: 'buildup' | 'goal' | 'save' | 'miss' | 'danger' | 'tactical' | 'conceded'
  forUs: boolean
  playerName?: string
  lines: string[]
  isGoal: boolean
}

// ─── Templates ────────────────────────────────────────────────────────────────

const BUILDUPS_OURS = [
  (p: string) => [`${p} recebe passe em profundidade e avança em direção ao gol...`],
  (p: string) => [`Bela troca de passes no meio. A bola chega para ${p} na entrada da área...`],
  (p: string) => [`${p} tenta a jogada individual, dribla um adversário e entra na área...`],
  (p: string) => [`${p} recebe pela direita, corta para dentro e arma o chute...`],
  (p: string) => [`Bola alçada na área! ${p} sobe mais alto que o zagueiro adversário...`],
  (p: string) => [`Escanteio! ${p} vai para a segunda trave disputar a bola...`],
  (p: string) => [`${p} recebe em velocidade, estava em posição perfeita...`],
  (p: string) => [`Contra-ataque! ${p} sai em disparada com a bola dominada...`],
  (p: string) => [`Falta na entrada da área. ${p} vai cobrar...`],
  (p: string) => [`${p} avança pelo meio, livra-se da marcação...`],
]

const GOALS_OURS = [
  (p: string) => [
    `GOOOOOOOL! ${p} finaliza com precisão no canto esquerdo!`,
    `O goleiro não teve a menor chance. QUE GOL!`,
  ],
  (p: string) => [
    `QUE GOLAÇO DE ${p.toUpperCase()}!`,
    `Recebeu na entrada da área, dominou e fusilou no ângulo superior!`,
  ],
  (p: string) => [
    `GOL DE CABEÇA DE ${p.toUpperCase()}!`,
    `Cruzamento perfeito, ${p} subiu mais alto que todo mundo e cabeceou no canto!`,
  ],
  (p: string) => [
    `GOOOOOOOL! ${p} aparece na segunda trave e empurra para o fundo das redes!`,
    `A torcida vai à loucura!`,
  ],
  (p: string) => [
    `QUE JOGADA! Tabelinha rápida, bola para ${p} completamente livre de marcação!`,
    `${p} empurra para o gol! Sem chances para o goleiro!`,
  ],
  (p: string) => [
    `${p} arrisca de fora da área... a bola bate na trave e entra!`,
    `Que gol de fora da área! O goleiro só olhou!`,
  ],
  (p: string) => [
    `PÊNALTI CONVERTIDO! ${p} bate forte no canto direito!`,
    `O goleiro foi para o lado errado. GOL!`,
  ],
  (p: string) => [
    `Contra-ataque relâmpago! ${p} avança na cara do goleiro!`,
    `Desloca o arqueiro com classe e marca um golaço!`,
  ],
  (p: string) => [
    `GOL DE FALTA! ${p} cobra com maestria por cima da barreira!`,
    `A bola explode no ângulo! Que primor de cobrança!`,
  ],
  (p: string) => [
    `${p.toUpperCase()} MARCA! Assistência sensacional, finalização perfeita!`,
    `Impossível para o goleiro! Que momento histórico!`,
  ],
]

const SAVES_OURS = [
  [`O goleiro voa para defender no canto! Que defesa fantástica!`, `Nossa equipe precisa tentar novamente.`],
  [`A bola bate na TRAVE! Que azar! Quase o gol!`, `O goleiro respirou aliviado.`],
  [`Defesa espetacular! O goleiro espalmou no último momento!`, `Incrível o reflexo desse arqueiro.`],
  [`Para fora! A bola passou raspando a trave direita!`, `Tão perto... e tão longe.`],
  [`O zagueiro bloqueou em cima da linha! Que alívio para o adversário!`, `Nossa equipe fica com raiva de tanta azar.`],
  [`O goleiro saiu bem do gol e fechou o ângulo! Sem chances para o atacante.`],
  [`A bola foi para fora pela linha de fundo. Escanteio perdido.`],
]

const DANGERS_OPPONENT = [
  [`O adversário avança pelo lado esquerdo e levanta a bola na área...`, `A defesa corta no sufoco!`],
  [`Pressão intensa do adversário! Bola na área, situação perigosa...`, `O zagueiro afasta com a cabeça!`],
  [`Contra-ataque adversário perigoso! Três contra dois...`, `O lateral recupera e evita o perigo!`],
  [`Falta perigosa na entrada da nossa área. O adversário vai cobrar...`, `A barreira fez o seu trabalho!`],
  [`Cruzamento na área! O adversário cabeceou...`, `O goleiro pegou firme!`],
]

const CONCEDED = [
  (opp: string) => [
    `GOL DO ADVERSÁRIO! ${opp} aproveita falha da defesa e marca!`,
    `Nosso time precisa se reorganizar.`,
  ],
  (opp: string) => [
    `${opp.toUpperCase()} MARCA! Chute de fora da área sem chance para o goleiro!`,
    `Placar apertado agora.`,
  ],
  (opp: string) => [
    `GOL DE CABEÇA DO ${opp.toUpperCase()}! Escanteio aproveitado na segunda trave!`,
    `Nosso time ficou dormindo na marcação.`,
  ],
  (opp: string) => [
    `Contra-ataque fatal! ${opp} encontra espaço e finaliza no canto!`,
    `Nossa equipe precisa voltar para o jogo.`,
  ],
]

const TACTICAL = [
  `Nossa equipe controla a posse de bola com tranquilidade.`,
  `O meio-campo dita o ritmo da partida.`,
  `O adversário tenta pressionar, mas a defesa segura bem.`,
  `Jogo travado no meio-campo. Nenhum dos times consegue criar.`,
  `Nossa equipe troca passes com qualidade. O adversário se fecha.`,
  `O técnico pede mais intensidade. A equipe responde!`,
  `Partida equilibrada. Os dois times se anulam no campo.`,
]

// ─── Generator ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length)]
}

export function generateMatchMoments(
  picks: import('./game').PickedPlayer[],
  opponent: string,
  goalsFor: number,
  goalsAgainst: number,
  seed: string,
  matchIdx: number
): MatchMoment[] {
  const r = (o: number) => {
    let h = 0
    const str = seed + matchIdx * 1000 + o
    for (let i = 0; i < str.toString().length; i++) {
      h = Math.imul(31, h) + str.toString().charCodeAt(i) | 0
    }
    return Math.abs(h) / 2147483647
  }

  const attackers = picks.filter(p =>
    ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.player.primaryPosition)
  )
  const allPlayers = picks.map(p => p.player.name)
  const scorers = attackers.length ? attackers : picks

  const moments: MatchMoment[] = []
  let usedMinutes = new Set<number>()

  const addMinute = (base: number, offset: number): number => {
    let m = Math.min(90, Math.max(1, base + Math.floor(r(offset) * 10) - 5))
    while (usedMinutes.has(m)) m = Math.min(90, m + 1)
    usedMinutes.add(m)
    return m
  }

  // Gols a favor — gerar buildup + resolução
  const goalMinutes: number[] = []
  for (let i = 0; i < goalsFor; i++) {
    goalMinutes.push(addMinute(20 + i * 20, i * 7))
  }

  // Gols contra
  const concededMinutes: number[] = []
  for (let i = 0; i < goalsAgainst; i++) {
    concededMinutes.push(addMinute(15 + i * 22, i * 11 + 50))
  }

  // Chances criadas sem gol (3-5 chances extras)
  const extraChances = 2 + Math.floor(r(99) * 3)
  const chanceMinutes: number[] = []
  for (let i = 0; i < extraChances; i++) {
    chanceMinutes.push(addMinute(10 + i * 15, i * 13 + 200))
  }

  // Perigos do adversário (1-2)
  const dangerMinutes: number[] = []
  const dangerCount = 1 + Math.floor(r(88) * 2)
  for (let i = 0; i < dangerCount; i++) {
    dangerMinutes.push(addMinute(25 + i * 30, i * 17 + 300))
  }

  // Momento tático (1)
  const tacMinute = addMinute(40, 400)

  // Buildups para gols (nossos)
  goalMinutes.forEach((min, i) => {
    const scorer = scorers[Math.floor(r(i * 3 + 1) * scorers.length)]
    const scorerName = scorer?.player.name ?? pick(allPlayers, r(i * 3 + 2))
    const buildup = pick(BUILDUPS_OURS, r(i * 3 + 4))(scorerName)
    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: scorerName,
      lines: buildup,
      isGoal: false,
    })
    const goalLines = pick(GOALS_OURS, r(i * 3 + 5))(scorerName)
    moments.push({
      minute: min,
      type: 'goal',
      forUs: true,
      playerName: scorerName,
      lines: goalLines,
      isGoal: true,
    })
  })

  // Gols concedidos
  concededMinutes.forEach((min, i) => {
    const concededLines = pick(CONCEDED, r(i * 5 + 10))(opponent)
    moments.push({
      minute: min,
      type: 'conceded',
      forUs: false,
      lines: concededLines,
      isGoal: true,
    })
  })

  // Chances sem gol
  chanceMinutes.forEach((min, i) => {
    const player = pick(allPlayers, r(i * 4 + 100))
    const buildup = pick(BUILDUPS_OURS, r(i * 4 + 101))(player)
    const save = pick(SAVES_OURS, r(i * 4 + 102))
    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: player,
      lines: buildup,
      isGoal: false,
    })
    moments.push({
      minute: min,
      type: 'save',
      forUs: true,
      lines: save,
      isGoal: false,
    })
  })

  // Perigos adversários
  dangerMinutes.forEach((min, i) => {
    const danger = pick(DANGERS_OPPONENT, r(i * 6 + 200))
    moments.push({
      minute: min,
      type: 'danger',
      forUs: false,
      lines: danger,
      isGoal: false,
    })
  })

  // Momento tático
  moments.push({
    minute: tacMinute,
    type: 'tactical',
    forUs: true,
    lines: [pick(TACTICAL, r(500))],
    isGoal: false,
  })

  // Ordenar por minuto
  moments.sort((a, b) => a.minute - b.minute || (a.type === 'buildup' ? -1 : 1))
  return moments
}
