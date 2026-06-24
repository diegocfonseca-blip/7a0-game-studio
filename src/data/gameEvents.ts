import type { GameEvent, GameState } from '../types/game'

interface EventTemplate {
  id: string
  title: string
  text: string
  type: GameEvent['type']
  weight: number
  effect?: GameEvent['effect']
  condition?: (state: GameState) => boolean
}

const CAREER_EVENTS: EventTemplate[] = [
  // ── POSITIVOS ──────────────────────────────────────────────────────────
  {
    id: 'bonus-gol',
    title: 'GOL DO MÊS',
    text: 'Você marcou um gol que passou no noticiário esportivo local. O presidente do clube te entregou uma bonificação em dinheiro.',
    type: 'positive',
    weight: 8,
    effect: { coins: 300 },
  },
  {
    id: 'olheiro',
    title: 'OLHEIRO NA ARQUIBANCADA',
    text: 'Um representante de um clube maior apareceu na sua partida. Não chegou a fazer proposta — mas ficou assistindo. Sua reputação subiu.',
    type: 'positive',
    weight: 6,
    effect: { reputation: 6 },
  },
  {
    id: 'patrocinio-regional',
    title: 'PATROCÍNIO LOCAL',
    text: 'Uma loja de materiais esportivos da cidade quer seu rosto no cartaz. Pequeno, mas é dinheiro.',
    type: 'positive',
    weight: 7,
    effect: { coins: 450 },
  },
  {
    id: 'mes-bom',
    title: 'MÊS EXCELENTE',
    text: 'Você jogou acima da média por semanas seguidas. O técnico te elogiou em público. O clube te pagou uma bonificação por desempenho.',
    type: 'positive',
    weight: 9,
    effect: { coins: 250, reputation: 3 },
  },
  {
    id: 'entrevista-radio',
    title: 'ENTREVISTA NO RÁDIO',
    text: 'Uma rádio esportiva local te chamou para comentar a temporada. Quinze minutos de antena. Seu nome está circulando mais.',
    type: 'positive',
    weight: 5,
    effect: { reputation: 4 },
  },
  {
    id: 'treino-inspirado',
    title: 'SEMANA INSPIRADA',
    text: 'Não tem explicação — essa semana de treino foi diferente. Seu corpo respondeu melhor. Um dos seus traços está mais vivo do que nunca.',
    type: 'positive',
    weight: 5,
    effect: { traitBoostId: '__random__' },
    condition: (s) => s.stolenTraits.length > 0,
  },

  // ── NEGATIVOS ──────────────────────────────────────────────────────────
  {
    id: 'lesao-leve',
    title: 'LESÃO LEVE',
    text: 'Entorse no tornozelo durante o treino. Nada grave — mas ficou de molho por semanas. Um dos seus traços roubados ficou sem manutenção.',
    type: 'negative',
    weight: 7,
    effect: { traitBoostId: '__drain_random__' },
    condition: (s) => s.stolenTraits.length > 0,
  },
  {
    id: 'crise-clube',
    title: 'CRISE NO CLUBE',
    text: 'Seu clube está em má fase. Diretoria cortou bonificações. Você recebeu menos este mês.',
    type: 'negative',
    weight: 8,
    effect: { coins: -200 },
  },
  {
    id: 'suspensao',
    title: 'SUSPENSÃO POR CARTÃO',
    text: 'Três amarelos acumulados. Você ficou de fora de dois jogos — e perdeu a renda deles. Reputação levou um arranhão.',
    type: 'negative',
    weight: 6,
    effect: { coins: -180, reputation: -2 },
  },
  {
    id: 'problema-vestiario',
    title: 'CONFUSÃO NO VESTIÁRIO',
    text: 'Uma briga de vestiário envolvendo um companheiro te afetou. O técnico diminuiu seu tempo de jogo por um tempo. Reputação caiu.',
    type: 'negative',
    weight: 5,
    effect: { reputation: -3 },
  },
  {
    id: 'lesao-muscular',
    title: 'LESÃO MUSCULAR',
    text: 'Distensão na coxa esquerda. Mês de recuperação. Seu desempenho nas partidas ficou prejudicado — e um traço roubado perdeu carga por falta de uso.',
    type: 'negative',
    weight: 4,
    effect: { traitBoostId: '__drain_random__', reputation: -2 },
    condition: (s) => s.stolenTraits.length > 0,
  },

  // ── NEUTROS ──────────────────────────────────────────────────────────
  {
    id: 'mudanca-tecnico',
    title: 'NOVO TÉCNICO',
    text: 'O clube trocou de técnico. O novo veio com ideias diferentes sobre posicionamento. Você precisará se adaptar — mas isso abre espaço para recomeçar.',
    type: 'neutral',
    weight: 6,
  },
  {
    id: 'subida-divisao',
    title: 'CLUBE SOBE DE DIVISÃO',
    text: 'Seu clube foi promovido. Mais visibilidade. Jogos mais difíceis. Olheiros aparecerão com mais frequência.',
    type: 'neutral',
    weight: 3,
    effect: { reputation: 5 },
    condition: (s) => s.clubLevel < 3,
  },
  {
    id: 'pre-temporada',
    title: 'PRÉ-TEMPORADA INTENSA',
    text: 'O novo método de treinamento é pesado. Você está em melhor forma física — mas os traços roubados exigiram mais manutenção essa temporada.',
    type: 'neutral',
    weight: 5,
  },
]

const CONSEQUENCE_EVENTS: EventTemplate[] = [
  {
    id: 'consequence-r9',
    title: 'O FENÔMENO ESTÁ DIFERENTE',
    text: 'Chega até você pelo noticiário: o garoto Ronaldo, da escolinha do Cruzeiro, está com dificuldade de finalizar. Os técnicos não entendem. Você entende.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('r9'),
  },
  {
    id: 'consequence-ronaldinho',
    title: 'A ALEGRIA SUMIU',
    text: 'Um gaúcho conhecido por sorrir em campo perdeu algo. O Ronaldinho de Porto Alegre joga mais sério, mais mecânico. Os amigos notaram. Ele não sabe o que mudou.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('ronaldinho'),
  },
  {
    id: 'consequence-adriano',
    title: 'O CANHÃO FICOU MUDO',
    text: 'Notícia da Vila Cruzeiro: o menino gordo que chutava diferente está mais lento, menos potente. Os técnicos do Flamengo monitoram, sem entender a causa.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('adriano'),
  },
  {
    id: 'consequence-kaka',
    title: 'A VISÃO DE OUTRO PLANO',
    text: 'No São Paulo FC, um garoto que sempre estava no lugar certo antes da bola chegar está chegando tarde. Pequena diferença — mas seus técnicos notaram.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('kaka'),
  },
  {
    id: 'consequence-rc',
    title: 'A CURVA QUE SOME',
    text: 'Roberto Carlos treinou 200 faltas essa semana — nenhuma curvou do jeito certo. O técnico do União São João está sem resposta.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('roberto-carlos'),
  },
  {
    id: 'consequence-totti',
    title: 'ROMA ESTÁ PREOCUPADA',
    text: 'O garoto de Porta Metronia deu entrevista dizendo que sente que perdeu algo depois de uma dividida com um brasileiro desconhecido. Ninguém levou a sério. Você levou.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('totti'),
  },
  {
    id: 'consequence-beckham',
    title: 'MANCHESTER NOTA A DIFERENÇA',
    text: 'Os cruzamentos de Beckham estão 10% menos precisos, diz um relatório interno da United Academy. Um técnico atribuiu ao crescimento. Não é isso.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('beckham'),
  },
  {
    id: 'consequence-henry',
    title: 'O SPRINT DE LES ULIS',
    text: 'Um garoto da banlieue de Paris que já foi o mais rápido do campo parece ter perdido o primeiro passo. Seus amigos dizem que depois de um jogo contra um brasileiro, algo mudou.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('henry'),
  },
  {
    id: 'consequence-cr7',
    title: 'FUNCHAL PERDEU ALGO',
    text: 'A mãe de Cristiano de Funchal comentou com vizinhos que seu filho passou uma semana recluso depois de um jogo, dizendo que "perdeu alguma coisa". Ela não entendeu. Você entendeu.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('cr7'),
  },
  {
    id: 'consequence-messi',
    title: 'O MENINO DE ROSÁRIO',
    text: 'Um menino do Club Grandoli chorou depois de um treino dizendo que não conseguia mais fazer "aquilo". Seu pai ficou preocupado. Levou ao médico. Os exames voltaram normais.',
    type: 'consequence',
    weight: 10,
    condition: (s) => s.stolenFrom.includes('messi'),
  },
]

function weightedPick<T extends { weight: number }>(pool: T[], rng: () => number): T | null {
  const total = pool.reduce((s, e) => s + e.weight, 0)
  if (total === 0) return null
  let r = rng() * total
  for (const item of pool) {
    r -= item.weight
    if (r <= 0) return item
  }
  return pool[pool.length - 1] ?? null
}

let _eventCounter = 0

export function rollYearEvents(state: GameState): GameEvent[] {
  const rng = () => Math.random()
  const events: GameEvent[] = []
  const usedIds = new Set<string>()

  // Roll 1-2 career events
  const careerPool = CAREER_EVENTS.filter(e => !e.condition || e.condition(state))
  const numCareer = rng() < 0.35 ? 2 : 1
  for (let i = 0; i < numCareer; i++) {
    const available = careerPool.filter(e => !usedIds.has(e.id))
    const pick = weightedPick(available, rng)
    if (pick) {
      usedIds.add(pick.id)
      events.push(resolveEvent(pick, state))
    }
  }

  // Roll consequence event if stolen from any legend (30% chance per year)
  if (state.stolenFrom.length > 0 && rng() < 0.30) {
    const consecPool = CONSEQUENCE_EVENTS.filter(e => e.condition && e.condition(state) && !usedIds.has(e.id))
    const pick = weightedPick(consecPool, rng)
    if (pick) {
      usedIds.add(pick.id)
      events.push(resolveEvent(pick, state))
    }
  }

  return events
}

function resolveEvent(template: EventTemplate, state: GameState): GameEvent {
  const id = `${template.id}-${++_eventCounter}`
  const effect = { ...template.effect }

  // Resolve random trait boost/drain
  if (effect.traitBoostId === '__random__' && state.stolenTraits.length > 0) {
    const trait = state.stolenTraits[Math.floor(Math.random() * state.stolenTraits.length)]
    effect.traitBoostId = trait.traitId
    effect.traitDrainAmount = -20 // negative = boost (we'll handle sign in reducer)
  } else if (effect.traitBoostId === '__drain_random__' && state.stolenTraits.length > 0) {
    const trait = state.stolenTraits[Math.floor(Math.random() * state.stolenTraits.length)]
    effect.traitBoostId = trait.traitId
    effect.traitDrainAmount = 20 // drain 20%
  }

  return { id, title: template.title, text: template.text, type: template.type, effect }
}
