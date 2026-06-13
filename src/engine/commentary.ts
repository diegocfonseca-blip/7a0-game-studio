export interface MatchMoment {
  minute: number
  type: 'buildup' | 'goal' | 'save' | 'miss' | 'danger' | 'tactical' | 'conceded'
  forUs: boolean
  playerName?: string
  lines: string[]
  isGoal: boolean
}

// ─── Hash / RNG ───────────────────────────────────────────────────────────────

function hashR(seed: string, matchIdx: number, offset: number): number {
  let h = 0
  const str = `${seed}|${matchIdx}|${offset}`
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return (h >>> 0) / 4294967296
}

function seededShuffle<T>(arr: T[], s: string, matchIdx: number, cat: number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(hashR(s, matchIdx, cat * 1000 + i) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ─── Templates ────────────────────────────────────────────────────────────────

// Category IDs used as `cat` argument to seededShuffle (must be unique per array)
const CAT_BUILDUP  = 1
const CAT_GOAL     = 2
const CAT_SAVE     = 3
const CAT_DANGER   = 4
const CAT_CONCEDED = 5
const CAT_TACTICAL = 6

// ── Buildups (≥ 25) ──────────────────────────────────────────────────────────
const BUILDUPS_OURS: Array<(p: string) => string[]> = [
  // Individual dribble / run
  p => [`${p} avança pelo lado esquerdo, corta para dentro e tenta o chute!`],
  p => [`${p} recebe passe em profundidade e dispara em direção ao gol!`],
  p => [`${p} tenta a jogada individual, elimina dois adversários e entra na área!`],
  p => [`${p} recebe pela direita, corta para o meio e arma o chute!`],
  p => [`${p} avança pelo meio com determinação, livra-se da marcação!`],
  p => [`${p} carrega a bola da intermediária, abre espaço e resolve tentar de longe!`],
  p => [`${p} leva a bola em velocidade, deixa o lateral para trás e chega à linha de fundo!`],
  // Team combination / triangulation
  p => [`Triangulação rápida no meio! ${p} sai em posição privilegiada para finalizar!`],
  p => [`Bela troca de passes! A bola chega para ${p} na entrada da área!`],
  p => [`Tabela fina perto da área! ${p} fica livre após o passe de calcanhar!`],
  p => [`Jogada de primeira toque! ${p} recebe completamente livre de marcação!`],
  p => [`Passe em profundidade preciso! ${p} aparece nas costas da defesa adversária!`],
  // Counter-attack
  p => [`Roubo de bola no meio-campo! ${p} dispara em velocidade no contra-ataque!`],
  p => [`Contra-ataque relâmpago! ${p} sai em disparada com a bola dominada!`],
  p => [`Recuperação rápida! ${p} já está em frente ao gol adversário!`],
  // Set piece
  p => [`Escanteio! ${p} se posiciona na segunda trave para disputar!`],
  p => [`Falta na entrada da área. ${p} vai cobrar diretamente!`],
  p => [`Cobrança de lateral na beirada da área. ${p} aparece no primeiro pau!`],
  // Aerial
  p => [`Cruzamento na medida! ${p} aparece de longe na área para cabecear!`],
  p => [`Bola alçada na área! ${p} sobe mais alto que o zagueiro adversário!`],
  p => [`Cruzamento tenso! ${p} e o goleiro se chocam pelo alto!`],
  // Long shot
  p => [`${p} carrega da intermediária e resolve arriscar de fora da área!`],
  p => [`${p} recebe de costas para o gol, vira e chuta de primeira!`],
  // High press / pressure
  p => [`Pressão alta! ${p} recupera a bola no campo adversário e parte para o abate!`],
  p => [`${p} rouba a bola do zagueiro na saída de bola e já está na área!`],
]

// ── Goals (≥ 25) ─────────────────────────────────────────────────────────────
const GOALS_OURS: Array<(p: string) => string[]> = [
  // Precision
  p => [
    `GOOOOOOOL! ${p} finaliza com precisão no canto esquerdo!`,
    `O goleiro não teve a menor chance. QUE GOL!`,
  ],
  // Power / angle
  p => [
    `QUE GOLAÇO DE ${p.toUpperCase()}! Fusilou no ângulo superior!`,
    `A bola explodiu nas redes antes mesmo do goleiro reagir!`,
  ],
  // Header
  p => [
    `GOL DE CABEÇA DE ${p.toUpperCase()}!`,
    `Cruzamento perfeito, ${p} subiu mais alto que todo mundo e cabeceou no canto!`,
  ],
  // Second post tap-in
  p => [
    `GOOOOOOOL! ${p} aparece na segunda trave e empurra para o fundo das redes!`,
    `A torcida vai à loucura! Que posicionamento de ${p}!`,
  ],
  // Combination finish
  p => [
    `QUE JOGADA! Tabelinha rápida, bola para ${p} completamente livre!`,
    `${p} não desperdiça! Sem chances para o goleiro!`,
  ],
  // Woodwork + in
  p => [
    `${p} arrisca de fora da área... a bola bate na trave e entra!`,
    `Que gol de fora da área! O goleiro só olhou a bola entrar!`,
  ],
  // Penalty
  p => [
    `PÊNALTI CONVERTIDO! ${p} bate forte no canto direito!`,
    `O goleiro foi para o lado errado. GOOOOOL!`,
  ],
  // Counter finish
  p => [
    `Contra-ataque relâmpago! ${p} avança na cara do goleiro!`,
    `Desloca o arqueiro com categoria absoluta e marca um golaço!`,
  ],
  // Free kick
  p => [
    `GOL DE FALTA! ${p} cobra com maestria por cima da barreira!`,
    `A bola explode no ângulo! Que primor de cobrança!`,
  ],
  // Historic feel
  p => [
    `${p.toUpperCase()} MARCA! Assistência sensacional, finalização perfeita!`,
    `Impossível para o goleiro! Que momento histórico!`,
  ],
  // Chip (cavadinha)
  p => [
    `QUE CATEGORIA! ${p} encobriu o goleiro com uma cavadinha sublime!`,
    `O arqueiro foi ao chão e viu a bola passar por cima dele. GOOOOOL!`,
  ],
  // One-touch
  p => [
    `DE PRIMEIRA! ${p} não deu tempo ao goleiro de se posicionar!`,
    `Que reflexo, que finalização! A torcida explode!`,
  ],
  // Penalty — paradinha
  p => [
    `PÊNALTI! ${p} faz a paradinha e engana o goleiro!`,
    `O arqueiro se jogou cedo e ${p} colocou no cantinho. GOOOOOL!`,
  ],
  // Long range screamer
  p => [
    `${p} arrisca de muito longe... QUE GOLAÇO!`,
    `A bola entrou no ângulo sem chance alguma para o goleiro. Sensacional!`,
  ],
  // Rebound
  p => [
    `${p} estava no lugar certo! Rebote e, sem hesitar, chutou para o fundo das redes!`,
    `Oportunismo puro de ${p}! Que gol!`,
  ],
  // Last-minute drama
  p => [
    `QUE GOOOOOL! ${p} marca nos acréscimos!`,
    `A torcida enlouquece! Um gol que vai ficar na memória!`,
  ],
  // Volley
  p => [
    `GOOOOOOOL! Voleio de ${p}! Que forma de finalizar!`,
    `A bola ainda estava no ar quando ${p} bateu de primeira. Espetacular!`,
  ],
  // Penalty — chute rasteiro
  p => [
    `PÊNALTI CONVERTIDO! ${p} bate rasteiro no canto esquerdo!`,
    `O goleiro se atirou para o outro lado. Frio e preciso. GOL!`,
  ],
  // Through ball + lob
  p => [
    `Passe em profundidade perfeito! ${p} acha o espaço e encobre o goleiro adiantado!`,
    `Que jogada de puro talento! GOL!`,
  ],
  // Header from corner
  p => [
    `Escanteio cobrado na medida! ${p} sobe sozinho e cabeceia para o gol!`,
    `O adversário dormiu na marcação e ${p} não perdoou!`,
  ],
  // Nutmeg + finish
  p => [
    `${p} deu chapéu no zagueiro dentro da área e finalizou firme!`,
    `Que audácia! Que finalização! GOOOOOL de ${p}!`,
  ],
  // Bicycle kick attempt that goes in
  p => [
    `GOOOOOL OLÍMPICO DE ${p.toUpperCase()}! De bicicleta!`,
    `A torcida está em delírio. Um gol para ficar no folclore do futebol!`,
  ],
  // Lucky deflection
  p => [
    `Chute de ${p} desviou no zagueiro adversário e entrou no cantinho!`,
    `O goleiro foi enganado pela deflexão. GOL!`,
  ],
  // Assist from keeper's blunder
  p => [
    `Saída errada do goleiro adversário! ${p} aproveita e toca para o gol vazio!`,
    `Que presente! ${p} não podia desperdiçar e não desperdiçou!`,
  ],
  // Clinical counter finish
  p => [
    `Dois contra um no contra-ataque! ${p} recebe e bate cruzado com categoria!`,
    `O goleiro não teve tempo de se posicionar. GOOOOOL!`,
  ],
]

// ── Saves (≥ 18) ─────────────────────────────────────────────────────────────
const SAVES_OURS: Array<string[]> = [
  [`O goleiro voa para defender no canto! Que defesa fantástica!`, `Nossa equipe precisa insistir.`],
  [`A bola bate na TRAVE! Que azar! Tão perto do gol!`, `O goleiro respirou aliviado.`],
  [`Defesa espetacular! O goleiro espalmou no último momento!`, `Incrível o reflexo desse arqueiro.`],
  [`Para fora! A bola passou raspando a trave direita!`, `Tão perto... e tão longe.`],
  [`O zagueiro bloqueou em cima da linha! Que alívio para o adversário!`, `Nossa equipe fica com raiva de tanto azar.`],
  [`O goleiro saiu bem do gol e fechou o ângulo! Sem chances para o atacante.`],
  [`A bola foi para fora pela linha de fundo. Escanteio que não veio.`],
  [`No TRAVESSÃO! A bola saiu por cima. Que pena!`, `O goleiro já estava batido.`],
  [`O goleiro se atirou e defendeu com o pé! Que reflexo extraordinário!`, `Às vezes a sorte está do lado errado.`],
  [`PARA FORA! A finalização passou alto, desperdiçando uma chance de ouro!`, `O atacante ficou com a cabeça nas mãos.`],
  [`Defesa com dois punhos! O goleiro mandou para longe no cruzamento!`, `Nossa equipe vai ter que tentar de outra forma.`],
  [`O lateral adversário salvou em cima da linha com o pé!`, `A bola estava entrando quando ele apareceu!`],
  [`NO POSTE! A bola bateu no poste esquerdo e voltou!`, `A trave foi o melhor goleiro do adversário.`],
  [`Chute à queima-roupa! O goleiro fez defesa incrível com o joelho!`, `Às vezes o gol parece não querer entrar.`],
  [`O goleiro se posicionou bem e pegou firme no arremate cruzado!`, `Seguro e eficiente entre as traves.`],
  [`Finalização desviou no zagueiro e foi para fora. Escanteio.`],
  [`O goleiro mergulhou no canto e chegou na bola com as pontas dos dedos!`, `Defesa absolutamente incrível!`],
  [`Para fora pela linha de fundo! A bola ficou na trave e rolou ao longo da linha!`, `Incrível que não entrou!`],
]

// ── Dangers — Opponent (≥ 15) ─────────────────────────────────────────────────
const DANGERS_OPPONENT: Array<string[]> = [
  [`O adversário avança pelo lado esquerdo e levanta a bola na área...`, `A defesa corta no sufoco!`],
  [`Pressão intensa do adversário! Bola na área, situação muito perigosa...`, `O zagueiro afasta de cabeça!`],
  [`Contra-ataque adversário perigoso! Três contra dois...`, `O lateral recupera bem e evita o perigo!`],
  [`Falta perigosa na entrada da nossa área. O adversário vai cobrar...`, `A barreira fez o seu trabalho!`],
  [`Cruzamento na área! O atacante adversário tentou cabecear...`, `O goleiro pegou firme com as duas mãos!`],
  [`Chute de longe do adversário! A bola foi direto para as mãos do nosso goleiro.`],
  [`O adversário tenta pela direita, cruzamento baixo na área...`, `O zagueiro bota para escanteio!`],
  [`Pressão máxima! O adversário cerca a área e exige atenção total...`, `A defesa segura firme e afasta!`],
  [`Chute rasteiro do adversário na área pequena...`, `O goleiro cai e defende no canto!`],
  [`Escanteio adversário perigoso! O zagueiro pula junto e...`, `Cabeceou para fora! Que alívio!`],
  [`Contra-ataque rápido do oponente! Dois a um na corrida...`, `O lateral correndo consegue interceptar o passe!`],
  [`Falta perigosa cobrada direto ao gol pelo adversário...`, `O goleiro se posiciona bem e pega firme!`],
  [`Bola nas costas da nossa defesa! O atacante estava em posição suspeita...`, `A bandeira sobe! Impedimento!`],
  [`O adversário chega pela esquerda, corta e bate forte...`, `A bola passa alto, por cima do travessão!`],
  [`Lançamento longo do adversário! Nosso goleiro sai do gol e...`, `Corta no ar com segurança! Ufa!`],
]

// ── Conceded (≥ 14) ───────────────────────────────────────────────────────────
const CONCEDED: Array<(opp: string, pl: string) => string[]> = [
  // Defensive blunder
  (opp, pl) => [
    `GOL DO ADVERSÁRIO! ${pl} do ${opp} aproveita falha da defesa e marca!`,
    `Nosso time precisa se reorganizar rapidamente.`,
  ],
  // Long shot
  (opp, pl) => [
    `${pl.toUpperCase()} MARCA PELO ${opp.toUpperCase()}! Chute potente de fora da área!`,
    `O goleiro não conseguiu segurar. Placar apertado agora.`,
  ],
  // Header from corner
  (opp, pl) => [
    `GOL DE CABEÇA DE ${pl.toUpperCase()}! Escanteio do ${opp} aproveitado na segunda trave!`,
    `Nosso time ficou dormindo na marcação. Caro descuido.`,
  ],
  // Counter
  (opp, pl) => [
    `Contra-ataque fatal! ${pl} do ${opp} encontra espaço e finaliza no canto!`,
    `Nossa equipe precisa voltar para o jogo imediatamente.`,
  ],
  // Clinical finish
  (opp, pl) => [
    `GOOOOL DO ${opp.toUpperCase()}! ${pl} recebe na área e não perdoa!`,
    `Que finalização precisa. Nada a fazer para o goleiro.`,
  ],
  // Long range screamer
  (opp, pl) => [
    `${pl} arrisca de longe pelo ${opp}... a bola explode no ângulo!`,
    `Golaço de categoria! Nosso goleiro foi batido sem chance.`,
  ],
  // Penalty
  (opp, pl) => [
    `PÊNALTI CONVERTIDO PELO ${opp.toUpperCase()}! ${pl} bate no centro do gol!`,
    `O goleiro se jogou e ${pl} enganou. Tomamos o gol.`,
  ],
  // Free kick
  (opp, pl) => [
    `GOL DE FALTA DO ${opp.toUpperCase()}! ${pl} cobra por baixo da barreira!`,
    `A barreira pulou, a bola foi embaixo. Que cobrança precisa.`,
  ],
  // Combination play
  (opp, pl) => [
    `Jogada coletiva impressionante do ${opp}! ${pl} aparece no final para completar!`,
    `Nossa defesa foi desmanchada na troca de passes. Precisamos reagir.`,
  ],
  // Aerial from set piece
  (opp, pl) => [
    `Bola parada perigosa! ${pl} do ${opp} sobe sozinho e cabeceia para o fundo das redes!`,
    `Marcação individual falhou. Gol cedido na bola aérea.`,
  ],
  // Through ball
  (opp, pl) => [
    `Passe em profundidade do ${opp} encontra ${pl} nas costas da defesa!`,
    `${pl} domina e finaliza com categoria. Tomamos o gol no detalhe.`,
  ],
  // Deflection
  (opp, pl) => [
    `Chute de ${pl} do ${opp} desviou em zagueiro nosso e enganou o goleiro!`,
    `Azar da deflexão. Difícil de defender. Gol do adversário.`,
  ],
  // Quick throw-in exploit
  (opp, pl) => [
    `Reposição lateral rápida do ${opp}! ${pl} aparece sozinho e faz o gol!`,
    `Nossa equipe estava mal posicionada. Descuido custou caro.`,
  ],
  // Header from cross
  (opp, pl) => [
    `Cruzamento preciso do ${opp} na cabeça de ${pl}!`,
    `${pl} não desperdiçou. Cabeceada no ângulo. Tomamos o gol de cabeça.`,
  ],
]

// ── Tactical (≥ 12) ───────────────────────────────────────────────────────────
const TACTICAL: Array<string[]> = [
  [`Nossa equipe controla a posse de bola com tranquilidade.`],
  [`O meio-campo dita o ritmo da partida com passe seguro.`],
  [`O adversário tenta pressionar, mas a defesa segura muito bem.`],
  [`Jogo mais travado no meio-campo. Nenhum dos times consegue criar espaço.`],
  [`Nossa equipe troca passes com qualidade. O adversário se fecha na defesa.`],
  [`O técnico pede mais intensidade. A equipe responde com volume de jogo!`],
  [`Partida equilibrada. Os dois times se anulam no campo.`],
  [`Nossa equipe adota postura de pressão alta, dificultando a saída de bola do adversário.`],
  [`O bloco defensivo adversário está muito compacto. Precisamos de criatividade.`],
  [`Domínio territorial nosso neste momento. A posse está claramente ao nosso favor.`],
  [`Ritmo de jogo acelerado nos últimos minutos. Os dois times querem decidir.`],
  [`Nossa equipe explora bem os espaços nas costas dos laterais adversários.`],
]

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateMatchMoments(
  picks: import('./game').PickedPlayer[],
  opponent: string,
  goalsFor: number,
  goalsAgainst: number,
  seed: string,
  matchIdx: number,
  opponentScorerNames: string[] = []
): MatchMoment[] {
  // Seeded-shuffled copies — ensures no template repeats within a match
  const shuffledBuildups  = seededShuffle(BUILDUPS_OURS,  seed, matchIdx, CAT_BUILDUP)
  const shuffledGoals     = seededShuffle(GOALS_OURS,     seed, matchIdx, CAT_GOAL)
  const shuffledSaves     = seededShuffle(SAVES_OURS,     seed, matchIdx, CAT_SAVE)
  const shuffledDangers   = seededShuffle(DANGERS_OPPONENT, seed, matchIdx, CAT_DANGER)
  const shuffledConceded  = seededShuffle(CONCEDED,       seed, matchIdx, CAT_CONCEDED)
  const shuffledTactical  = seededShuffle(TACTICAL,       seed, matchIdx, CAT_TACTICAL)

  // Running counters — increment to walk through shuffled arrays cyclically
  let bIdx = 0  // buildup
  let gIdx = 0  // goal
  let sIdx = 0  // save
  let dIdx = 0  // danger
  let cIdx = 0  // conceded
  let tIdx = 0  // tactical

  const nextBuildup  = (p: string) => shuffledBuildups [bIdx++ % shuffledBuildups.length](p)
  const nextGoal     = (p: string) => shuffledGoals    [gIdx++ % shuffledGoals.length](p)
  const nextSave     = ()          => shuffledSaves    [sIdx++ % shuffledSaves.length]
  const nextDanger   = ()          => shuffledDangers  [dIdx++ % shuffledDangers.length]
  const nextConceded = (opp: string, pl: string) =>
    shuffledConceded[cIdx++ % shuffledConceded.length](opp, pl)
  const nextTactical = ()          => shuffledTactical [tIdx++ % shuffledTactical.length]

  const attackers = picks.filter(p =>
    ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.player.primaryPosition)
  )
  const allPlayers = picks.map(p => p.player.name)
  const scorers = attackers.length ? attackers : picks

  const moments: MatchMoment[] = []
  const usedMinutes = new Set<number>()

  const addMinute = (base: number, offset: number): number => {
    let m = Math.min(90, Math.max(1, base + Math.floor(hashR(seed, matchIdx, offset) * 10) - 5))
    while (usedMinutes.has(m)) m = Math.min(90, m + 1)
    usedMinutes.add(m)
    return m
  }

  // Assign minutes
  const goalMinutes: number[] = []
  for (let i = 0; i < goalsFor; i++) {
    goalMinutes.push(addMinute(20 + i * 20, i * 7))
  }

  const concededMinutes: number[] = []
  for (let i = 0; i < goalsAgainst; i++) {
    concededMinutes.push(addMinute(15 + i * 22, i * 11 + 50))
  }

  const extraChances = 2 + Math.floor(hashR(seed, matchIdx, 99) * 3)
  const chanceMinutes: number[] = []
  for (let i = 0; i < extraChances; i++) {
    chanceMinutes.push(addMinute(10 + i * 15, i * 13 + 200))
  }

  const dangerCount = 1 + Math.floor(hashR(seed, matchIdx, 88) * 2)
  const dangerMinutes: number[] = []
  for (let i = 0; i < dangerCount; i++) {
    dangerMinutes.push(addMinute(25 + i * 30, i * 17 + 300))
  }

  const tacMinute = addMinute(40, 400)

  // Buildups + goals for us
  goalMinutes.forEach((min, i) => {
    const scorer = scorers[Math.floor(hashR(seed, matchIdx, i * 3 + 1) * scorers.length)]
    const scorerName =
      scorer?.player.name ??
      allPlayers[Math.floor(hashR(seed, matchIdx, i * 3 + 2) * allPlayers.length)]
    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: scorerName,
      lines: nextBuildup(scorerName),
      isGoal: false,
    })
    moments.push({
      minute: min,
      type: 'goal',
      forUs: true,
      playerName: scorerName,
      lines: nextGoal(scorerName),
      isGoal: true,
    })
  })

  // Conceded goals
  concededMinutes.forEach((min, i) => {
    const oppScorer =
      opponentScorerNames[i] ??
      opponentScorerNames[
        Math.floor(hashR(seed, matchIdx, i * 5 + 9) * Math.max(1, opponentScorerNames.length))
      ] ??
      opponent
    moments.push({
      minute: min,
      type: 'conceded',
      forUs: false,
      lines: nextConceded(opponent, oppScorer),
      isGoal: true,
    })
  })

  // Missed chances (buildup + save)
  chanceMinutes.forEach((min, i) => {
    const pIdx = Math.floor(hashR(seed, matchIdx, i * 4 + 100) * allPlayers.length)
    const player = allPlayers[pIdx]
    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: player,
      lines: nextBuildup(player),
      isGoal: false,
    })
    moments.push({
      minute: min,
      type: 'save',
      forUs: true,
      lines: nextSave(),
      isGoal: false,
    })
  })

  // Opponent dangers
  dangerMinutes.forEach(min => {
    moments.push({
      minute: min,
      type: 'danger',
      forUs: false,
      lines: nextDanger(),
      isGoal: false,
    })
  })

  // Tactical moment
  moments.push({
    minute: tacMinute,
    type: 'tactical',
    forUs: true,
    lines: nextTactical(),
    isGoal: false,
  })

  // Sort by minute; buildup always before the corresponding event
  moments.sort((a, b) => a.minute - b.minute || (a.type === 'buildup' ? -1 : 1))
  return moments
}
