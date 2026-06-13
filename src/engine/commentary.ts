export interface MatchMoment {
  minute: number
  type: 'buildup' | 'goal' | 'save' | 'miss' | 'danger' | 'tactical' | 'conceded'
  forUs: boolean
  playerName?: string
  lines: string[]
  isGoal: boolean
}

// ─── RNG ─────────────────────────────────────────────────────────────────────

function hashR(seed: string, matchIdx: number, offset: number): number {
  let h = 0
  const str = `${seed}|${matchIdx}|${offset}`
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return (h >>> 0) / 4294967296
}

function seededShuffle<T>(arr: T[], seed: string, matchIdx: number, cat: number): T[] {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(hashR(seed, matchIdx, cat * 1000 + i) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// ─── Paired plays (buildup + goal sempre coerentes) ───────────────────────────

type GoalPlay = {
  positions: string[]      // posições que favorecem essa jogada (vazio = qualquer)
  buildup: (p: string) => string[]
  goal:    (p: string) => string[]
}

const GOAL_PLAYS: GoalPlay[] = [
  // ── Ponta / winger ───────────────────────────────────────────────────────
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} arranca pela ponta em velocidade, elimina o lateral e invade a área!`],
    goal:    p => [`GOOOOOL! ${p} bateu cruzado na saída do goleiro!`, `Velocidade e frieza. Impossível de parar!`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} recebe pela direita, corta para o pé esquerdo e prepara o chute!`],
    goal:    p => [`${p} colocou no ângulo com categoria! QUE GOL!`, `O goleiro viu a bola passar sem ter a menor chance.`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} pega a bola pela esquerda, dribla dois adversários e parte para a área!`],
    goal:    p => [`QUE GOLAÇO DE ${p.toUpperCase()}! Dominou, driblou e fusilou!`, `Futebol arte puro! A torcida vai à loucura!`],
  },

  // ── Centroavante / segunda atacante ──────────────────────────────────────
  {
    positions: ['CA'],
    buildup: p => [`Cruzamento preciso na área! ${p} chega na segunda trave...`],
    goal:    p => [`GOOOOOL! ${p} empurra para o fundo das redes na segunda trave!`, `Oportunismo de centroavante puro! No lugar certo, na hora certa!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`${p} recebe de costas para o gol, gira rápido e fica cara a cara com o goleiro!`],
    goal:    p => [`${p} MARCA! Giro e chute num só movimento!`, `O goleiro mal viu a bola sair. QUE FINALIZAÇÃO!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`Passe em profundidade nas costas da defesa! ${p} está em posição de gol!`],
    goal:    p => [`GOOOOOL! ${p} dominou e tocou na saída do goleiro!`, `Instinto de artilheiro. Que precisão!`],
  },
  {
    positions: ['CA', 'PD', 'PE'],
    buildup: p => [`Rebote dentro da área! ${p} está no lugar certo para finalizar!`],
    goal:    p => [`${p} NAO PERDOA! Rebote e gol! Oportunismo absoluto!`, `Estava ali para isso. Artilheiro nato!`],
  },

  // ── Meia-atacante / armador ───────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'VOL'],
    buildup: p => [`${p} recebe de frente para o gol na entrada da área e arma o chute!`],
    goal:    p => [`QUE GOLAÇO DE ${p.toUpperCase()}! Chute colocado no ângulo superior!`, `De fora da área! O goleiro não teve tempo de reagir!`],
  },
  {
    positions: ['MEI', 'MC', 'VOL'],
    buildup: p => [`${p} carrega da intermediária, abre espaço com o drible e arrisca de longe!`],
    goal:    p => [`${p.toUpperCase()} MARCA DE FORA DA ÁREA!`, `A bola explodiu no ângulo. Bomba! O goleiro só olhou.`],
  },
  {
    positions: ['MEI', 'MC'],
    buildup: p => [`Triangulação rápida no meio! ${p} surge na área completamente livre!`],
    goal:    p => [`GOL! ${p} recebeu livre e tocou com categoria na saída do goleiro!`, `Jogada de tabela perfeita. Que inteligência!`],
  },

  // ── Zagueiro / lateral (gol em bola parada) ──────────────────────────────
  {
    positions: ['ZAG', 'LD', 'LE'],
    buildup: p => [`Escanteio! ${p} sobe como poste na segunda trave!`],
    goal:    p => [`GOL DE CABEÇA DE ${p.toUpperCase()}! O ZAGUEIRO FOI AO ATAQUE!`, `Ninguém marcou ${p}! Ficou completamente livre para cabecear no ângulo!`],
  },
  {
    positions: ['ZAG', 'LD', 'LE'],
    buildup: p => [`Falta cobrada na área! ${p} está no grupo na primeira trave...`],
    goal:    p => [`${p.toUpperCase()} CABECEOU! GOL DO DEFENSOR!`, `Que surpresa! O lateral foi ao ataque e marcou um golaço de cabeça!`],
  },

  // ── Contra-ataque (qualquer posição) ─────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Roubo de bola no meio-campo! ${p} sai em disparada no contra-ataque!`],
    goal:    p => [`CONTRA-ATAQUE LETAL! ${p} chegou na cara do goleiro e não perdoou!`, `Velocidade mortal! GOL!`],
  },
  {
    positions: [],
    buildup: p => [`Dois contra um no contra-ataque! ${p} recebe a bola em frente ao gol!`],
    goal:    p => [`${p} bateu cruzado! GOL CONTRA-ATAQUE!`, `Três toques da recuperação ao fundo da rede. Perfeito!`],
  },
  {
    positions: [],
    buildup: p => [`Transição ultrarrápida! ${p} está isolado com a bola em velocidade!`],
    goal:    p => [`${p} MARCA! GOOOOOL NO CONTRA-ATAQUE!`, `O adversário não voltou a tempo. Punição máxima!`],
  },

  // ── Pênalti ──────────────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`PÊNALTI MARCADO! A arbitragem apontou para a marca! ${p} vai cobrar...`],
    goal:    p => [`PÊNALTI CONVERTIDO! ${p} bate forte no canto direito!`, `O goleiro foi para o lado errado. GOOOOOL!`],
  },
  {
    positions: [],
    buildup: p => [`PÊNALTI! Falta dentro da área! ${p} pega a bola e vai para a cobrança!`],
    goal:    p => [`${p} FAZ A PARADINHA e engana o goleiro! GOOOOOL!`, `O arqueiro se jogou cedo. ${p} colocou no cantinho com precisão.`],
  },
  {
    positions: [],
    buildup: p => [`PÊNALTI ASSINALADO! ${p} chega com calma para bater...`],
    goal:    p => [`PÊNALTI CONVERTIDO! ${p} bate rasteiro no canto esquerdo!`, `O goleiro mal se moveu. Frieza absoluta de ${p}.`],
  },

  // ── Falta direta ─────────────────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'PE', 'PD', 'CA'],
    buildup: p => [`Falta perigosa na entrada da área! ${p} é especialista em bola parada...`],
    goal:    p => [`GOL DE FALTA DIRETA DE ${p.toUpperCase()}!`, `A bola foi por cima da barreira e explodiu no ângulo! Que primor de cobrança!`],
  },
  {
    positions: [],
    buildup: p => [`Falta na entrada da área. ${p} vai cobrar diretamente ao gol!`],
    goal:    p => [`QUE GOLAÇO DE FALTA! ${p} cobrou com efeito e a bola entrou no ângulo!`, `O goleiro estava bem posicionado mas a bola mudou de trajetória. Absurdo!`],
  },

  // ── Chute de longe ───────────────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'VOL', 'ZAG'],
    buildup: p => [`${p} carrega da intermediária, abre espaço e decide arriscar de longe!`],
    goal:    p => [`${p} ARRISCA DE LONGE... QUE GOLAÇO!`, `A bola entrou no ângulo antes que o goleiro fosse para o canto!`],
  },
  {
    positions: [],
    buildup: p => [`${p} recebe de frente para o gol a 25 metros e decide chutar!`],
    goal:    p => [`${p} bateu forte e a bola foi para o ângulo superior! GOL SENSACIONAL!`, `Que potência! O goleiro sequer se mexeu.`],
  },

  // ── Cabeçada de cruzamento ───────────────────────────────────────────────
  {
    positions: ['CA', 'PD', 'PE', 'ZAG'],
    buildup: p => [`Cruzamento preciso vindo da esquerda! ${p} aparece no primeiro pau!`],
    goal:    p => [`GOL DE CABEÇA DE ${p.toUpperCase()}!`, `Cruzamento perfeito, ${p} subiu mais alto que todo mundo e cabeceou no canto!`],
  },
  {
    positions: ['CA', 'ZAG', 'LD'],
    buildup: p => [`Bola alçada na área! ${p} disputa pelo alto com o zagueiro adversário!`],
    goal:    p => [`${p.toUpperCase()} CABECEOU! GOL!`, `A cabeçada foi no ângulo inferior. Goleiro batido. QUE GOOOOL!`],
  },

  // ── Cavadinha / individual skill ─────────────────────────────────────────
  {
    positions: ['CA', 'MEI', 'PD', 'PE'],
    buildup: p => [`${p} está um contra um com o goleiro! O arqueiro adiantou!`],
    goal:    p => [`QUE CATEGORIA! ${p} encobriu o goleiro com uma cavadinha sublime!`, `O arqueiro foi ao chão e viu a bola passar por cima dele. GOOOOOL!`],
  },

  // ── Voleio ───────────────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`A bola vem pelo ar na área! ${p} tenta o voleio!`],
    goal:    p => [`VOLEIO DE ${p.toUpperCase()}! QUE FORMA DE MARCAR!`, `A bola ainda estava no ar quando ${p} bateu de primeira. Espetacular!`],
  },

  // ── Gol olímpico / deflexão ──────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Chute de ${p} forte e cruzado! Desviou no zagueiro adversário!`],
    goal:    p => [`GOL! O desvio enganou o goleiro! ${p} leva o crédito!`, `A deflexão mudou a trajetória. Nada a fazer para o goleiro.`],
  },
]

// ─── Missas chances (buildup + resultado frustrado) ───────────────────────────

type MissedPlay = {
  buildup: (p: string) => string[]
  save: string[]
}

const MISSED_PLAYS: MissedPlay[] = [
  {
    buildup: p => [`${p} avança pelo meio, livra-se da marcação...`],
    save: [`O goleiro voa para defender no canto! Que defesa fantástica!`, `Nossa equipe precisa insistir.`],
  },
  {
    buildup: p => [`${p} recebe passe em profundidade e chuta forte!`],
    save: [`A bola bate na TRAVE! Que azar! Tão perto do gol!`, `O goleiro respirou aliviado.`],
  },
  {
    buildup: p => [`${p} tenta a jogada individual, dribla e arma o chute!`],
    save: [`Defesa espetacular! O goleiro espalmou no último momento!`, `Incrível o reflexo desse arqueiro.`],
  },
  {
    buildup: p => [`${p} recebe pela direita, corta para dentro e arma o chute!`],
    save: [`Para fora! A bola passou raspando a trave direita!`, `Tão perto... e tão longe.`],
  },
  {
    buildup: p => [`Bola alçada na área! ${p} sobe para cabecear!`],
    save: [`O zagueiro bloqueou em cima da linha! Que alívio para o adversário!`, `Nossa equipe fica com raiva de tanto azar.`],
  },
  {
    buildup: p => [`${p} entra na área e chuta a queima-roupa!`],
    save: [`O goleiro saiu bem do gol e fechou o ângulo!`, `Intervenção cirúrgica do goleiro.`],
  },
  {
    buildup: p => [`Cruzamento para a área! ${p} vai cabecear!`],
    save: [`A bola foi para fora pela linha de fundo. Escanteio perdido.`],
  },
  {
    buildup: p => [`${p} carrega da intermediária e resolve arriscar!`],
    save: [`NO TRAVESSÃO! A bola saiu por cima!`, `O goleiro já estava batido.`],
  },
  {
    buildup: p => [`${p} aparece livre na área após lançamento!`],
    save: [`O goleiro se atirou e defendeu com o pé! Que reflexo!`, `Às vezes a sorte está do lado errado.`],
  },
  {
    buildup: p => [`${p} recebe de costas para o gol, gira e chuta!`],
    save: [`PARA FORA! A finalização passou alto!`, `O atacante ficou com a cabeça nas mãos.`],
  },
  {
    buildup: p => [`Contra-ataque! ${p} sai em velocidade!`],
    save: [`NO POSTE! A bola bateu no poste esquerdo e voltou!`, `A trave foi o melhor goleiro do adversário.`],
  },
  {
    buildup: p => [`${p} recebe na entrada da área e chuta de primeira!`],
    save: [`O goleiro mergulhou no canto e chegou na bola com as pontas dos dedos!`, `Defesa absolutamente incrível!`],
  },
]

// ─── Perigos do adversário ────────────────────────────────────────────────────

const DANGERS: string[][] = [
  [`O adversário avança pelo lado esquerdo e levanta na área...`, `A defesa corta no sufoco!`],
  [`Pressão intensa! Bola na área, situação muito perigosa...`, `O zagueiro afasta de cabeça no último momento!`],
  [`Contra-ataque adversário perigoso! Três contra dois...`, `O lateral recupera e evita o perigo!`],
  [`Falta perigosa na entrada da nossa área...`, `A barreira fez o seu trabalho!`],
  [`Cruzamento na área! O atacante adversário tentou!`, `O goleiro pegou firme com as duas mãos!`],
  [`Chute de longe do adversário!`, `A bola foi direto para as mãos do nosso goleiro.`],
  [`Pressão máxima! O adversário cerca a área e exige atenção total...`, `A defesa segura firme e afasta!`],
  [`Chute rasteiro do adversário na área pequena...`, `O goleiro cai e defende no canto!`],
  [`Escanteio adversário perigoso! O zagueiro pula junto e...`, `Cabeceou para fora! Que alívio!`],
  [`Contra-ataque rápido do oponente! Dois a um na corrida...`, `O lateral correndo consegue interceptar!`],
  [`Bola nas costas da nossa defesa! O atacante estava em posição suspeita...`, `A bandeira sobe! Impedimento!`],
  [`O adversário chega pela esquerda, corta e bate forte...`, `A bola passou alto, por cima do travessão!`],
  [`Lançamento longo do adversário! Nosso goleiro sai do gol e...`, `Corta no ar com segurança!`],
  [`O adversário tenta a tabela rápida perto da área...`, `A defesa fecha o espaço a tempo!`],
  [`Falta cobrada diretamente ao gol pelo adversário!`, `O goleiro se posiciona bem e pega firme!`],
]

// ─── Gols sofridos ────────────────────────────────────────────────────────────

const CONCEDED: Array<(opp: string, pl: string) => string[]> = [
  (opp, pl) => [`GOL DO ADVERSÁRIO! ${pl} do ${opp} aproveita falha da defesa e marca!`, `Nosso time precisa se reorganizar rapidamente.`],
  (opp, pl) => [`${pl.toUpperCase()} MARCA PELO ${opp.toUpperCase()}! Chute potente de fora da área!`, `O goleiro não conseguiu segurar. Placar apertado.`],
  (opp, pl) => [`GOL DE CABEÇA DE ${pl.toUpperCase()}! Escanteio do ${opp} aproveitado na segunda trave!`, `Nosso time ficou dormindo na marcação.`],
  (opp, pl) => [`Contra-ataque fatal! ${pl} do ${opp} encontra espaço e finaliza no canto!`, `Nossa equipe precisa voltar para o jogo imediatamente.`],
  (opp, pl) => [`GOOOOL DO ${opp.toUpperCase()}! ${pl} recebe na área e não perdoa!`, `Que finalização precisa. Nada a fazer para o goleiro.`],
  (opp, pl) => [`${pl} arrisca de longe pelo ${opp}... a bola explode no ângulo!`, `Golaço de categoria. Nosso goleiro foi batido sem chance.`],
  (opp, pl) => [`PÊNALTI CONVERTIDO PELO ${opp.toUpperCase()}! ${pl} bate no centro do gol!`, `O goleiro se jogou e ${pl} enganou. Tomamos o gol.`],
  (opp, pl) => [`GOL DE FALTA DO ${opp.toUpperCase()}! ${pl} cobra por baixo da barreira!`, `A barreira pulou, a bola foi embaixo. Que cobrança precisa.`],
  (opp, pl) => [`Jogada coletiva do ${opp}! ${pl} aparece no final para completar!`, `Nossa defesa foi desmanchada na troca de passes.`],
  (opp, pl) => [`${pl} do ${opp} sobe sozinho e cabeceia para o fundo das redes!`, `Marcação individual falhou. Gol cedido na bola aérea.`],
  (opp, pl) => [`Passe em profundidade do ${opp} encontra ${pl} nas costas da defesa!`, `${pl} domina e finaliza com categoria. Tomamos o gol no detalhe.`],
  (opp, pl) => [`Chute de ${pl} do ${opp} desviou em zagueiro nosso e enganou o goleiro!`, `Azar da deflexão. Difícil de defender.`],
  (opp, pl) => [`${pl} do ${opp} dribla nosso zagueiro na área e chuta no ângulo!`, `Individual excepcional. Não tinha muito a fazer.`],
  (opp, pl) => [`Cruzamento preciso do ${opp} na cabeça de ${pl}!`, `${pl} não desperdiçou. Cabeçada no ângulo. Tomamos o gol de cabeça.`],
]

// ─── Mensagens táticas (com variação por placar) ─────────────────────────────

const TACTICAL_NEUTRAL = [
  `Nossa equipe controla a posse de bola com tranquilidade.`,
  `O meio-campo dita o ritmo da partida com passes precisos.`,
  `Jogo mais travado no meio-campo. Nenhum dos times consegue criar espaço.`,
  `Nossa equipe troca passes com qualidade. O adversário se fecha na defesa.`,
  `O técnico pede mais intensidade. A equipe responde com volume de jogo!`,
  `Partida equilibrada. Os dois times se anulam no campo.`,
  `Nossa equipe explora bem os espaços nas costas dos laterais adversários.`,
]

const TACTICAL_WINNING = [
  `Nossa equipe administra bem o resultado. O adversário não consegue criar.`,
  `O time joga no conforto. Posse de bola inteligente, sem riscos.`,
  `Gestão de placar exemplar. Nossa equipe encaixa bem no bloco médio.`,
  `O adversário pressiona mas a defesa segura tudo com tranquilidade.`,
]

const TACTICAL_LOSING = [
  `Nossa equipe tenta reagir, mas o adversário está bem posicionado.`,
  `O desespero começa a aparecer. O time precisa de uma jogada inspirada!`,
  `Precisamos urgentemente de um gol! O técnico gesticula do banco.`,
  `Nossa equipe vai para o tudo ou nada. A defesa do adversário resiste.`,
]

// ─── Contexto de gol (prefixo dramático) ─────────────────────────────────────

function goalContextPrefix(
  scoreFor: number,
  scoreAgainst: number,
  minute: number,
  phase: string
): string {
  const isFinal = phase === 'Final'
  const isSemi  = phase === 'Semifinal'
  const isLate  = minute >= 80
  const isExtra = minute >= 87
  const diff    = scoreFor - scoreAgainst  // diff BEFORE this goal

  if (isExtra && isFinal && diff < 0) return `NOS ACRÉSCIMOS DA FINAL! REAÇÃO HISTÓRICA! `
  if (isExtra && isFinal && diff === 0) return `NOS ACRÉSCIMOS DA GRANDE FINAL! `
  if (isExtra && diff < 0)             return `NOS ACRÉSCIMOS! EMPATOU DE VIRADA! `
  if (isExtra && diff === 0)           return `NOS ACRÉSCIMOS! `
  if (isLate  && isFinal && diff < 0)  return `REAGIU NA FINAL! `
  if (isLate  && diff < 0)             return `DE VIRADA! O TIME NÃO DESISTIU! `
  if (diff < 0)                        return `EMPATOU! O TIME REAGE! `
  if (isFinal && diff === 0)           return `NA GRANDE FINAL! `
  if (isSemi  && diff === 0)           return `NA SEMIFINAL! `
  return ''
}

// ─── Seleção de jogada por posição ────────────────────────────────────────────

function selectGoalPlay(
  position: string,
  _isLegend: boolean,
  r: number,
  usedIndices: Set<number>
): { play: GoalPlay; idx: number } {
  // Applicable plays: prefer position-specific, allow universal
  const specific  = GOAL_PLAYS.map((p, i) => ({ p, i })).filter(({ p }) => p.positions.includes(position))
  const universal = GOAL_PLAYS.map((p, i) => ({ p, i })).filter(({ p }) => p.positions.length === 0)

  // Combine: preferred = specific first, then universal
  const preferred = [...specific, ...universal]
  // Filter unused first; if all used, reset
  let pool = preferred.filter(({ i }) => !usedIndices.has(i))
  if (pool.length === 0) {
    usedIndices.clear()
    pool = preferred
  }

  // Weighted: legend gets extra weight on visually impressive plays (non-penalty)
  const total = pool.length
  const idx = Math.floor(r * total)
  const chosen = pool[idx % pool.length]
  usedIndices.add(chosen.i)
  return { play: chosen.p, idx: chosen.i }
}

// ─── Gerador principal ───────────────────────────────────────────────────────

export function generateMatchMoments(
  picks: import('./game').PickedPlayer[],
  opponent: string,
  goalsFor: number,
  goalsAgainst: number,
  seed: string,
  matchIdx: number,
  opponentScorerNames: string[] = [],
  phase = 'Grupos',
  matchEvents?: import('./game').MatchEvent[]
): MatchMoment[] {
  const allPlayers = picks.map(p => p.player.name)
  const attackers  = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.player.primaryPosition))
  const scorers    = attackers.length ? attackers : picks

  // Actual scorer names from simulation (single source of truth)
  const actualGoalScorers = matchEvents?.filter(e => e.type === 'goal').map(e => e.playerName) ?? []

  const moments: MatchMoment[] = []
  const usedMinutes = new Set<number>()
  const usedGoalPlays = new Set<number>()  // anti-repetição de jogadas

  // Shuffled pools para missadas, perigos e concedidos
  const shuffledMissed   = seededShuffle(MISSED_PLAYS,   seed, matchIdx, 3)
  const shuffledDangers  = seededShuffle(DANGERS,        seed, matchIdx, 4)
  const shuffledConceded = seededShuffle(CONCEDED,       seed, matchIdx, 5)
  let mIdx = 0, dIdx = 0, cIdx = 0

  const addMinute = (base: number, off: number): number => {
    let m = Math.min(90, Math.max(1, base + Math.floor(hashR(seed, matchIdx, off) * 12) - 6))
    while (usedMinutes.has(m)) m = Math.min(90, m + 1)
    usedMinutes.add(m)
    return m
  }

  // ── Atribuir minutos ────────────────────────────────────────────────────
  type GoalEvent  = { min: number; scorer: typeof scorers[0]; isOurs: true }
  type OtherEvent = { min: number; isOurs: false; oppScorer: string }
  type AllEvent   = GoalEvent | OtherEvent

  const allEvents: AllEvent[] = []

  for (let i = 0; i < goalsFor; i++) {
    const min = addMinute(18 + i * 18, i * 7)
    // Use actual scorer from simulation; fall back to hash-pick only if missing
    const actualName = actualGoalScorers[i]
    const scorer = (actualName ? scorers.find(s => s.player.name === actualName) : null)
      ?? scorers[Math.floor(hashR(seed, matchIdx, i * 3 + 1) * scorers.length)]
    allEvents.push({ min, scorer, isOurs: true })
  }

  for (let i = 0; i < goalsAgainst; i++) {
    const min = addMinute(15 + i * 22, i * 11 + 50)
    const oppScorer =
      opponentScorerNames[i] ??
      opponentScorerNames[Math.floor(hashR(seed, matchIdx, i * 5 + 9) * Math.max(1, opponentScorerNames.length))] ??
      opponent
    allEvents.push({ min, isOurs: false, oppScorer })
  }

  // Ordenar por minuto para tracking de placar
  allEvents.sort((a, b) => a.min - b.min)

  // ── Gerar narração com contexto de placar ───────────────────────────────
  let scoreFor = 0, scoreAgainst = 0

  allEvents.forEach((ev, i) => {
    if (ev.isOurs) {
      const g = ev as GoalEvent
      const scorerName = g.scorer?.player.name ?? allPlayers[0]
      const scorerPos  = g.scorer?.player.primaryPosition ?? 'CA'
      const { play } = selectGoalPlay(
        scorerPos,
        g.scorer?.player.isLegend ?? false,
        hashR(seed, matchIdx, i * 7 + 20),
        usedGoalPlays,
      )

      // Buildup no minuto anterior
      moments.push({
        minute: Math.max(1, g.min - 1),
        type: 'buildup',
        forUs: true,
        playerName: scorerName,
        lines: play.buildup(scorerName),
        isGoal: false,
      })

      // Gol com prefixo contextual
      const prefix    = goalContextPrefix(scoreFor, scoreAgainst, g.min, phase)
      const goalLines = play.goal(scorerName)
      const lines     = prefix
        ? [`${prefix}${goalLines[0]}`, ...goalLines.slice(1)]
        : goalLines

      moments.push({
        minute: g.min,
        type: 'goal',
        forUs: true,
        playerName: scorerName,
        lines,
        isGoal: true,
      })

      scoreFor++
    } else {
      const oe = ev as OtherEvent
      moments.push({
        minute: oe.min,
        type: 'conceded',
        forUs: false,
        lines: shuffledConceded[cIdx++ % shuffledConceded.length](opponent, oe.oppScorer),
        isGoal: true,
      })
      scoreAgainst++
    }
  })

  // ── Chances criadas sem gol ─────────────────────────────────────────────
  const extraChances = 2 + Math.floor(hashR(seed, matchIdx, 99) * 3)
  for (let i = 0; i < extraChances; i++) {
    const min    = addMinute(10 + i * 15, i * 13 + 200)
    const pIdx   = Math.floor(hashR(seed, matchIdx, i * 4 + 100) * allPlayers.length)
    const player = allPlayers[pIdx]
    const missed = shuffledMissed[mIdx++ % shuffledMissed.length]

    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: player,
      lines: missed.buildup(player),
      isGoal: false,
    })
    moments.push({
      minute: min,
      type: 'save',
      forUs: true,
      lines: missed.save,
      isGoal: false,
    })
  }

  // ── Perigos do adversário ───────────────────────────────────────────────
  const dangerCount = 1 + Math.floor(hashR(seed, matchIdx, 88) * 2)
  for (let i = 0; i < dangerCount; i++) {
    const min = addMinute(25 + i * 30, i * 17 + 300)
    moments.push({
      minute: min,
      type: 'danger',
      forUs: false,
      lines: shuffledDangers[dIdx++ % shuffledDangers.length],
      isGoal: false,
    })
  }

  // ── Momento tático (contexto de placar ao final do jogo) ────────────────
  const tacMin  = addMinute(40, 400)
  const finalDiff = scoreFor - scoreAgainst
  const tacPool = finalDiff > 1
    ? TACTICAL_WINNING
    : finalDiff < 0
      ? TACTICAL_LOSING
      : TACTICAL_NEUTRAL
  const tacIdx  = Math.floor(hashR(seed, matchIdx, 500) * tacPool.length)
  moments.push({
    minute: tacMin,
    type: 'tactical',
    forUs: true,
    lines: [tacPool[tacIdx]],
    isGoal: false,
  })

  moments.sort((a, b) => a.minute - b.minute || (a.type === 'buildup' ? -1 : 1))
  return moments
}
