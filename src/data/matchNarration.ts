import type { StolenTrait, NarrationMoment } from '../types/game'

interface Template {
  text: string
  traitIds?: string[]
  noTrait?: true
  weakTrait?: true
  weight: number
  isHighlight?: boolean
}

// ── GOLS COM TRAÇO ──────────────────────────────────────────────────────────

const GOAL_TRAIT: Template[] = [
  { traitIds: ['r9-finish', 'messi-finish'],
    text: 'Cara a cara. {minute}\'. Você e o goleiro. Com a {traitIcon} {traitName}, você esperou ele se mover. Foi pro lado oposto. Gol limpo. O goleiro ficou olhando.',
    weight: 10, isHighlight: true },
  { traitIds: ['r9-finish', 'adriano-power', 'messi-finish'],
    text: '{minute}\'. Você recebeu de costas. Virou rápido. Com a {traitIcon} {traitName}, o chute saiu antes do goleiro se preparar. Ângulo. Gol.',
    weight: 9, isHighlight: true },
  { traitIds: ['r9-finish', 'messi-finish'],
    text: '{minute}\'. Passe errado do adversário caiu no seu pé. Com a {traitIcon} {traitName}, você finalizou de primeira, sem controle, sem pensar. A bola entrou no canto.',
    weight: 8, isHighlight: true },
  { traitIds: ['adriano-power'],
    text: '{minute}\'. Você recebeu na entrada da área. O chute com a {traitIcon} {traitName} foi tão forte que a mão do goleiro não serviu de nada. A rede estufou com força.',
    weight: 10, isHighlight: true },
  { traitIds: ['adriano-power'],
    text: 'Cruzamento na segunda trave. {minute}\'. Você subiu com a {traitIcon} {traitName} — o impacto foi tão pesado que o goleiro nem se jogou pra tentar. Gol de cabeça.',
    weight: 8, isHighlight: true },
  { traitIds: ['rdinho-dribble', 'rdinho-elastico', 'messi-dribble', 'r9-dribble'],
    text: '{minute}\'. A {traitIcon} {traitName} deixou dois no chão. Você invadiu a área sozinho. Chute no canto. O goleiro não teve tempo de reagir.',
    weight: 10, isHighlight: true },
  { traitIds: ['rdinho-dribble', 'messi-dribble', 'r9-dribble'],
    text: '{minute}\'. O marcador vinha duro. A {traitIcon} {traitName} apareceu — bola entre as pernas dele. Você entrou na área sozinho. Tocou rasteiro no canto. Gol.',
    weight: 9, isHighlight: true },
  { traitIds: ['rdinho-elastico'],
    text: '{minute}\'. O elástico. Depois o chapéu. O zagueiro foi ao chão. Você ficou sozinho diante do goleiro. Rolou com calma. Gol de categoria.',
    weight: 9, isHighlight: true },
  { traitIds: ['r9-speed', 'henry-speed'],
    text: 'Passe nas costas da defesa. {minute}\'. Com a {traitIcon} {traitName}, você chegou antes que qualquer zagueiro tivesse chance. Só o goleiro — e ele saiu tarde demais.',
    weight: 10, isHighlight: true },
  { traitIds: ['r9-speed', 'henry-speed'],
    text: 'Contra-ataque. {minute}\'. Você pegou a bola na sua metade e simplesmente correu. Com a {traitIcon} {traitName}, a defesa inteira não existiu. Gol solitário.',
    weight: 9, isHighlight: true },
  { traitIds: ['kaka-acceleration'],
    text: '{minute}\'. Você acelerou com a bola da intermediária. Com a {traitIcon} {traitName}, sem perder controle, chegou na área com espaço. O goleiro saiu mal. Gol.',
    weight: 9, isHighlight: true },
  { traitIds: ['rc-freekick', 'beckham-freekick', 'cr7-freekick'],
    text: 'Falta. {minute}\'. Marcada a 27 metros. Silêncio. Com a {traitIcon} {traitName}, você bateu. A bola curvou após a barreira. O goleiro ficou parado. Gol impossível.',
    weight: 10, isHighlight: true },
  { traitIds: ['rc-freekick'],
    text: '{minute}\'. Falta a 25 metros. Rasteira. Com a {traitIcon} {traitName}, a bola passou embaixo da barreira — perto do chão, longe das mãos. Gol.',
    weight: 9, isHighlight: true },
  { traitIds: ['beckham-freekick'],
    text: '{minute}\'. Você pediu a bola. Com a {traitIcon} {traitName}, ela subiu girando e desceu no ângulo. O goleiro viu. Não chegou. Gol.',
    weight: 9, isHighlight: true },
  { traitIds: ['cr7-freekick'],
    text: '{minute}\'. Bola parada, 24 metros. Com a {traitIcon} {traitName}, o chute saiu sem efeito. Ninguém sabia pra onde ia. O goleiro foi pra um canto. A bola foi pro outro.',
    weight: 9, isHighlight: true },
  { traitIds: ['henry-composure', 'totti-touch'],
    text: '{minute}\'. Você recebeu com marcação. Com a {traitIcon} {traitName}, girou devagar, colocou no cantinho com calma. O goleiro foi pro lado errado. Gol de serenidade.',
    weight: 9, isHighlight: true },
  { traitIds: ['totti-touch'],
    text: 'Cruzamento alto. {minute}\'. Com a {traitIcon} {traitName}, o primeiro toque colocou a bola no chão na posição certa. Segundo toque: gol. Dois movimentos perfeitos.',
    weight: 8, isHighlight: true },
  { traitIds: ['totti-vision'],
    text: '{minute}\'. Você viu o gol antes de todo mundo. O passe veio do ângulo que ninguém havia imaginado. O companheiro só completou. O gol foi seu.',
    weight: 8, isHighlight: true },
  { traitIds: ['henry-composure'],
    text: '{minute}\'. Você esperou. E esperou. O goleiro se antecipou. Com a {traitIcon} {traitName}, você tocou no lado oposto com a frieza de quem já sabia o resultado.',
    weight: 9, isHighlight: true },
  { traitIds: ['adriano-penalty'],
    text: 'Pênalti. {minute}\'. Você colocou a bola. Respirou. Com a {traitIcon} {traitName}, o chute foi seco, no canto. O goleiro foi pro outro lado. Gol.',
    weight: 7 },
  { traitIds: ['kaka-acceleration', 'r9-speed', 'henry-speed'],
    text: '{minute}\'. Dois pra um. Você acelerou e deixou o companheiro pra trás. Com a {traitIcon} {traitName}, chegou primeiro. Finalizou antes que alguém esperasse. Gol.',
    weight: 8, isHighlight: true },
]

// ── GOLS SEM TRAÇO ──────────────────────────────────────────────────────────

const GOAL_NOTRAIT: Template[] = [
  { noTrait: true, weight: 8, isHighlight: true,
    text: '{minute}\'. A bola chegou no seu pé na hora certa. Você não pensou — só chutou. Entrou rente à trave. A torcida levantou.' },
  { noTrait: true, weight: 7, isHighlight: true,
    text: 'Gol. {minute}\'. Difícil de explicar de onde veio. O espaço apareceu, você aproveitou. Instinto puro. Sem traços — só vontade.' },
  { noTrait: true, weight: 7,
    text: '{minute}\'. Escanteio. Você entrou no segundo pau. A bola chegou no seu peito. Um toque e entrou. Simples, direto.' },
  { noTrait: true, weight: 6,
    text: '{minute}\'. Rebote do goleiro. Você estava lá. Um toque. A bola entrou antes que qualquer defensor fechasse.' },
  { noTrait: true, weight: 6,
    text: '{minute}\'. Bola longa. Você dominou no peito, girou em um movimento só. Chute antes do zagueiro fechar. No canto.' },
  { noTrait: true, weight: 5,
    text: '{minute}\'. Falta lateral. Você entrou na área na hora certa. A cabeçada foi firme. O goleiro se jogou tarde.' },
]

// ── CHANCES PERDIDAS / MISSES COM TRAÇO FRACO ───────────────────────────────

const MISS_WEAK: Template[] = [
  { weakTrait: true, weight: 10,
    text: '{minute}\'. Você tentou acionar a {traitIcon} {traitName} — mas estava em {bar}% de carga. O movimento saiu pela metade. O marcador aproveitou a hesitação. A chance morreu.' },
  { weakTrait: true, weight: 9,
    text: 'Era a hora da {traitIcon} {traitName}. {minute}\'. Mas o traço estava exausto. O corpo sentiu isso exatamente quando precisava de tudo. A bola foi pra fora.' },
  { weakTrait: true, weight: 8,
    text: '{minute}\'. A {traitIcon} {traitName} apareceu — mas enfraquecida ({bar}%). O drible saiu. O chute, não. Goleiro defendeu sem esforço.' },
  { weakTrait: true, weight: 7,
    text: 'Você sentiu a oportunidade. {minute}\'. Tentou usar a {traitIcon} {traitName}. Mas com {bar}% restante, o que saiu foi uma sombra. O marcador fechou.' },
  { weakTrait: true, weight: 6,
    text: '{minute}\'. Com a {traitIcon} {traitName} naquele estado ({bar}%), o chute perdeu a precisão. O goleiro segurou sem dificuldade. Você sabia que ia errar antes de bater.' },
]

// ── MISSES SEM TRAÇO ─────────────────────────────────────────────────────────

const MISS_NOTRAIT: Template[] = [
  { noTrait: true, weight: 9,
    text: '{minute}\'. Você recebeu sem marcação. Mas o chute saiu sem direção — direto pro goleiro. Sem traços, sem surpresa. Ele pegou fácil.' },
  { noTrait: true, weight: 8,
    text: '{minute}\'. Cruzamento perfeito. Você subiu — mas chegou um segundo atrasado. A bola passou por cima da cabeça.' },
  { noTrait: true, weight: 7,
    text: '{minute}\'. Bom espaço aberto na área. Chute de fora. O goleiro foi bem. Defendeu sem dificuldade. O placar não mudou.' },
  { noTrait: true, weight: 6,
    text: 'Contra-ataque. {minute}\'. Você chegou com espaço — mas o ângulo fechou antes que percebesse. O chute bateu na rede pelo lado de fora.' },
  { noTrait: true, weight: 5,
    text: '{minute}\'. Passe na área, você na posição. Mas o primeiro toque saiu pesado. O goleiro saiu e cobriu antes que você chutasse.' },
  { noTrait: true, weight: 6,
    text: '{minute}\'. Você tentou o chute colocado. A bola subiu demais. Passou por cima do travessão por uns dois metros. A torcida gemeu.' },
]

// ── HABILIDADE / DRIBLES (SEM GOL) ──────────────────────────────────────────

const SKILL: Template[] = [
  { traitIds: ['rdinho-dribble', 'r9-dribble', 'messi-dribble', 'rdinho-elastico'],
    text: '{minute}\'. Dois marcadores ao mesmo tempo. Com a {traitIcon} {traitName}, você deixou os dois no chão. A torcida reagiu antes da jogada terminar.',
    weight: 9 },
  { traitIds: ['rdinho-dribble', 'messi-dribble'],
    text: 'Lateral fechado. {minute}\'. Com a {traitIcon} {traitName}, você criou espaço do nada — mudança de direção que o marcador não processou. O passe saiu perfeito.',
    weight: 8 },
  { traitIds: ['rdinho-elastico'],
    text: '{minute}\'. O elástico apareceu. O zagueiro foi ao chão tentando acompanhar. O cruzamento quase virou gol. Quase.',
    weight: 9, isHighlight: true },
  { traitIds: ['r9-dribble'],
    text: '{minute}\'. Ginga carioca pura. Você recebeu, balançou o corpo pra um lado, foi pro outro. O marcador foi junto pro lado errado. O espaço abriu.',
    weight: 8 },
  { traitIds: ['r9-speed', 'henry-speed'],
    text: '{minute}\'. Você acelerou com a bola por 40 metros. A defesa não conseguiu fechar. O cruzamento chegou na área — o companheiro chegou tarde.',
    weight: 8 },
  { traitIds: ['kaka-acceleration'],
    text: '{minute}\'. Você recebeu no meio e acelerou com controle total. Com a {traitIcon} {traitName}, ninguém acompanhou. O cruzamento foi preciso — mas o atacante estava impedido.',
    weight: 7 },
  { traitIds: ['rc-freekick', 'beckham-freekick', 'cr7-freekick'],
    text: 'Falta a 30 metros. {minute}\'. Com a {traitIcon} {traitName}, a bola bateu na trave e voltou. Mais alguns centímetros seria gol. O goleiro ficou olhando o poste.',
    weight: 9, isHighlight: true },
  { traitIds: ['totti-vision', 'kaka-acceleration'],
    text: '{minute}\'. Você viu o espaço antes de todos. O passe criou o gol do companheiro. Ninguém vai colocar seu nome na tabela — mas foi você.',
    weight: 7 },
  { traitIds: ['henry-composure', 'totti-touch'],
    text: '{minute}\'. Você recebeu com dois em cima. Com a {traitIcon} {traitName}, girou devagar, tocou pro companheiro. A torcida aplaudiu antes do passe chegar.',
    weight: 7 },
  { traitIds: ['adriano-power'],
    text: '{minute}\'. Chute de fora com a {traitIcon} {traitName}. O goleiro espalmou no ângulo com a mão doendo — ainda bem que a bola não entrou, porque ele não conseguiria defender outro.',
    weight: 8, isHighlight: true },
  { traitIds: ['messi-dribble', 'r9-dribble'],
    text: '{minute}\'. Corpo baixo, bola colada ao pé, dois defensores passaram por baixo. Com a {traitIcon} {traitName}, você saiu limpo. O cruzamento foi bloqueado na linha.',
    weight: 8 },
  { traitIds: ['henry-speed', 'r9-speed'],
    text: '{minute}\'. Bola longa. Com a {traitIcon} {traitName}, você ganhou a corrida com o zagueiro. O chute de primeira foi pro goleiro — mas o espaço criado foi seu.',
    weight: 7 },
]

// ── GOLS DO ADVERSÁRIO ───────────────────────────────────────────────────────

const OPP_GOAL: Template[] = [
  { text: '{minute}\'. Contra-ataque de {opponent}. Dois contra um. Nossa defesa aberta. O arremate foi no canto. Tomamos um.', weight: 9 },
  { text: 'Falta a 22 metros pra {opponent}. {minute}\'. A bola curvou. A barreira pulou errada. Gol deles.', weight: 8 },
  { text: '{minute}\'. Escanteio de {opponent}. Cabeçada no primeiro pau. Ninguém marcou. Tomamos.', weight: 8 },
  { text: 'Erro nosso na saída de bola. {minute}\'. {opponent} recuperou em campo de ataque. Chute no ângulo. Tomamos um que doeu.', weight: 7 },
  { text: '{minute}\'. Penalidade. Falta dentro da área — discutível, mas marcada. {opponent} foi confiante. Converteu.', weight: 6 },
  { text: '{minute}\'. {opponent} tabelou pelo corredor. O cruzamento veio certeiro. Cabeçada no primeiro pau. Tomamos.', weight: 7 },
  { text: 'Chute de fora. {minute}\'. O goleiro estava mal posicionado. A bola foi no canto deixado. Tomamos.', weight: 6 },
  { text: '{minute}\'. Roubada de bola no meio. {opponent} chutou de primeira. Entrou. Ninguém esperava.', weight: 7, isHighlight: true },
  { text: '{minute}\'. {opponent} aproveitou que nossa defesa estava adiantada. Passe nas costas. Finalizou bem.', weight: 7 },
  { text: 'Lance de bola parada. {minute}\'. {opponent} desviou na primeira trave. Goleiro não chegou.', weight: 5 },
  { text: '{minute}\'. O atacante de {opponent} girou na área e chutou de primeira. A bola bateu num defensor e entrou. Azar.', weight: 6 },
  { text: '{minute}\'. {opponent} fez a jogada que vinha tentando o jogo todo. Tabelou pelo meio, finalizou limpo.', weight: 7 },
]

// ── PRESSÃO / CONTEXTO ───────────────────────────────────────────────────────

const PRESSURE: Template[] = [
  { text: '{minute}\'. {opponent} pressionou alto. Você recebeu com marcação. Conseguiu safar — mas o jogo estava pesado naquele momento.', weight: 8 },
  { text: 'Período difícil. {minute}\'. {opponent} controlava o meio. Suas chegadas eram travadas antes da área. O técnico pediu paciência.', weight: 7 },
  { text: '{minute}\'. Falta dura em você. Você levou segundos pra se levantar. O árbitro anotou. A torcida vaiou.', weight: 6 },
  { text: 'Pressão de {opponent}. {minute}\'. Uma série de escanteios consecutivos. A defesa afastou todos — mas o desgaste apareceu nas pernas.', weight: 7 },
  { text: '{minute}\'. Você pediu a bola várias vezes. Não chegou. {opponent} dominava a posse e o ritmo do jogo.', weight: 6 },
  { text: 'Minutos difíceis. {minute}\'. {opponent} estava mais organizado taticamente. Precisávamos de algo diferente.', weight: 5 },
  { text: '{minute}\'. A marcação em cima de você foi constante. Cada toque com dois jogadores de {opponent} na cola.', weight: 6 },
  { text: '{minute}\'. O árbitro marcou impedimento — mas a jogada tinha potencial. Você estava bem posicionado, mas a linha foi rigorosa.', weight: 5 },
]

// ── ENGINE ───────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s ^= s >>> 16
    return (s >>> 0) / 4294967296
  }
}

function pick<T extends { weight: number }>(arr: T[], rng: () => number): T | null {
  if (!arr.length) return null
  const total = arr.reduce((s, t) => s + t.weight, 0)
  let r = rng() * total
  for (const t of arr) { r -= t.weight; if (r <= 0) return t }
  return arr[arr.length - 1]
}

function eligible<T extends Template>(templates: T[], traitIds: string[], weakIds: string[]): T[] {
  return templates.filter(t => {
    if (t.traitIds) return t.traitIds.some(id => traitIds.includes(id))
    if (t.weakTrait) return weakIds.length > 0
    return true  // noTrait or unconditioned = always eligible
  })
}

function traitFor(t: Template, traits: StolenTrait[]): StolenTrait | undefined {
  if (!t.traitIds) return undefined
  return traits.find(tr => t.traitIds!.includes(tr.traitId))
}

function weakTrait(traits: StolenTrait[]): StolenTrait | undefined {
  return traits.find(t => t.maintenanceBar < 30)
}

function fillText(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

const MINUTES = [7, 14, 19, 27, 33, 38, 44, 51, 57, 63, 70, 76, 82, 86, 89, 90]

export interface GeneratedMatch {
  moments: NarrationMoment[]
  goals: number
  goalsAgainst: number
}

export function generateMatchNarration(
  playerName: string,
  traits: StolenTrait[],
  opponentName: string,
  opponentStrength: number,
  reputation: number,
  targetMoments?: number,
  synergyBonus: number = 0,
): GeneratedMatch {
  const rng = seededRng(Date.now() ^ (Math.random() * 0xffffffff))

  const traitIds = traits.map(t => t.traitId)
  const weakIds = traits.filter(t => t.maintenanceBar < 30).map(t => t.traitId)
  const strongIds = traits.filter(t => t.maintenanceBar >= 30).map(t => t.traitId)

  // Calcula força do jogador (synergy bonus adds up to ~12 extra strength)
  const traitPower = traits.reduce((s, t) => s + (t.maintenanceBar / 100) * 18, 0)
  const repBonus = Math.min(25, reputation * 0.4)
  const synergyStr = Math.min(12, synergyBonus * 40)
  const playerStr = Math.min(95, 40 + traitPower + repBonus + synergyStr)
  const diff = playerStr - opponentStrength

  const winChance = diff > 20 ? 0.80 : diff > 10 ? 0.65 : diff > 0 ? 0.52
    : diff > -10 ? 0.36 : diff > -20 ? 0.22 : 0.10

  const r = rng()
  const result: 'win' | 'draw' | 'loss' = r < winChance ? 'win' : r < winChance + 0.22 ? 'draw' : 'loss'

  let goals = 0
  let goalsAgainst = 0
  if (result === 'win') {
    goals = 1 + (rng() > 0.45 ? 1 : 0) + (rng() > 0.8 ? 1 : 0)
    goalsAgainst = Math.floor(rng() * goals)
  } else if (result === 'draw') {
    goals = Math.floor(rng() * 3)
    goalsAgainst = goals
  } else {
    goalsAgainst = 1 + (rng() > 0.5 ? 1 : 0) + (rng() > 0.85 ? 1 : 0)
    goals = Math.floor(rng() * goalsAgainst)
  }

  // Monta a sequência de tipo de momentos
  type MType = 'goal' | 'opp-goal' | 'skill' | 'miss' | 'pressure'
  const types: MType[] = []
  for (let i = 0; i < goals; i++) types.push('goal')
  for (let i = 0; i < goalsAgainst; i++) types.push('opp-goal')

  const total = targetMoments ?? (5 + Math.floor(rng() * 2))
  const remaining = total - types.length
  for (let i = 0; i < remaining; i++) {
    const x = rng()
    if (x < 0.35 && strongIds.length > 0) types.push('skill')
    else if (x < 0.6) types.push('miss')
    else types.push('pressure')
  }

  // Embaralha e atribui minutos
  const shuffled = types.sort(() => rng() - 0.5)
  const mins = [...MINUTES].sort(() => rng() - 0.5).slice(0, total).sort((a, b) => a - b)

  const moments: NarrationMoment[] = []

  for (let i = 0; i < total; i++) {
    const type = shuffled[i]
    const minute = mins[i]

    const vars = (trait?: StolenTrait, bar?: number): Record<string, string> => ({
      minute: String(minute),
      playerName,
      opponent: opponentName,
      traitName: trait?.traitName ?? '',
      traitIcon: trait?.traitIcon ?? '',
      bar: String(bar ?? trait?.maintenanceBar ?? 0),
    })

    if (type === 'goal') {
      const useTraitGoal = strongIds.length > 0 && rng() > 0.25
      const tpl = useTraitGoal
        ? (pick(eligible(GOAL_TRAIT, strongIds, []), rng) ?? pick(GOAL_NOTRAIT, rng)!)
        : pick(GOAL_NOTRAIT, rng)!
      const t = traitFor(tpl, traits)
      moments.push({ minute, type: 'goal', text: fillText(tpl.text, vars(t)), isHighlight: tpl.isHighlight ?? false, scoreDelta: 1, traitUsed: t?.traitId })

    } else if (type === 'opp-goal') {
      const tpl = pick(OPP_GOAL, rng)!
      moments.push({ minute, type: 'opponent-goal', text: fillText(tpl.text, vars()), isHighlight: tpl.isHighlight ?? false, scoreDelta: -1 })

    } else if (type === 'skill') {
      const tpl = pick(eligible(SKILL, strongIds, []), rng) ?? pick(MISS_NOTRAIT, rng)!
      const t = traitFor(tpl, traits)
      moments.push({ minute, type: 'skill', text: fillText(tpl.text, vars(t)), isHighlight: tpl.isHighlight ?? false, scoreDelta: 0, traitUsed: t?.traitId })

    } else if (type === 'miss') {
      const useWeak = weakIds.length > 0 && rng() > 0.4
      if (useWeak) {
        const tpl = pick(eligible(MISS_WEAK, traitIds, weakIds), rng) ?? pick(MISS_NOTRAIT, rng)!
        const t = weakTrait(traits)
        moments.push({ minute, type: 'miss', text: fillText(tpl.text, vars(t, t?.maintenanceBar)), isHighlight: false, scoreDelta: 0, traitUsed: t?.traitId })
      } else {
        const tpl = pick(MISS_NOTRAIT, rng)!
        moments.push({ minute, type: 'miss', text: fillText(tpl.text, vars()), isHighlight: false, scoreDelta: 0 })
      }

    } else {
      const tpl = pick(PRESSURE, rng)!
      moments.push({ minute, type: 'pressure', text: fillText(tpl.text, vars()), isHighlight: false, scoreDelta: 0 })
    }
  }

  return { moments: moments.sort((a, b) => a.minute - b.minute), goals, goalsAgainst }
}
