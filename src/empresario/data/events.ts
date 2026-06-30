import type { GameEvent } from '../types'

export interface ClientLite {
  legendId: string
  nickname: string
  name: string
  position: string
  currentRating: number
  status?: string
  personality?: string
  nationality?: string
  birthYear?: number
  currentValue?: number
  peakYearStart?: number
  contractClub?: string | null
}

let evtCounter = 0
function eid(year: number, week: number) {
  evtCounter += 1
  return `ev-${year}-${week}-${evtCounter}`
}

type Make = (c: ClientLite, year: number, week: number) => GameEvent

// ─── EVENT TEMPLATES (todos usam o NOME do jogador) ─────────────
// Each returns a full event with A/B choices. Lots of variety so the
// game feels alive and never repeats the same line twice in a row.

const INJURY_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'injury', clientId: c.legendId,
    title: `Lesão muscular de ${c.nickname}`,
    description: `${c.nickname} sentiu a coxa no treino e vai ficar 2 meses parado. O valor dele cai enquanto estiver no departamento médico.`,
    choices: [
      { label: 'Bancar fisioterapeuta particular (R$5.000)', effect: { money: -5000, happiness: 15, clientValue: 5, narrative: `Você cuidou de ${c.nickname}. Ele não esquece quem esteve do lado dele.` } },
      { label: 'Deixar o clube cuidar', effect: { happiness: -10, clientValue: -10, narrative: `${c.nickname} se sentiu abandonado na recuperação.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'injury', clientId: c.legendId,
    title: `${c.nickname} torceu o tornozelo`,
    description: `Entrada dura num jogo e ${c.nickname} saiu mancando. Pode ser sério ou pode ser nada.`,
    choices: [
      { label: 'Levar ao melhor ortopedista do país (R$7.000)', effect: { money: -7000, happiness: 12, narrative: `Exame em dia. ${c.nickname} volta mais rápido e confiante.` } },
      { label: 'Esperar pra ver', effect: { happiness: -8, clientValue: -8, narrative: `O tornozelo de ${c.nickname} inflamou. Tempo perdido.` } },
    ],
  }),
]

const SCANDAL_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'scandal', clientId: c.legendId,
    title: `Fotos de ${c.nickname} vazaram`,
    description: `${c.nickname} apareceu em fotos numa festa às 5 da manhã, véspera de jogo. A imprensa esfomeada.`,
    choices: [
      { label: 'Contratar assessoria avulsa (R$8.000)', effect: { money: -8000, reputation: 3, happiness: 6, narrative: `Crise abafada. (Uma assessoria fixa no escritório sairia mais barato.)` } },
      { label: 'Deixar passar', effect: { reputation: -8, clientValue: -15, narrative: `A imprensa crucificou ${c.nickname}. Valor despencou.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'scandal', clientId: c.legendId,
    title: `${c.nickname} bateu boca com a torcida`,
    description: `${c.nickname} respondeu xingamento de torcedor e o vídeo viralizou. Climão com a diretoria do clube.`,
    choices: [
      { label: 'Marcar pedido de desculpas público', effect: { reputation: 5, happiness: -4, narrative: `${c.nickname} pediu desculpas a contragosto, mas a poeira baixou.` } },
      { label: 'Defender seu cliente na imprensa', effect: { reputation: -3, happiness: 14, narrative: `Você comprou a briga de ${c.nickname}. Ele te abraçou — a torcida nem tanto.` } },
    ],
  }),
]

const CALOTE_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'offer', clientId: c.legendId,
    title: `Clube enrolando seu pagamento (${c.nickname})`,
    description: `O clube que contratou ${c.nickname} está empurrando sua comissão com a barriga. Sem advogado, você fica na mão.`,
    choices: [
      { label: 'Contratar advogado avulso (R$6.000)', effect: { money: -6000, narrative: `Recuperou a comissão de ${c.nickname}, mas gastou pra isso.` } },
      { label: 'Aceitar receber metade', effect: { money: -3000, reputation: -4, narrative: `Calote engolido no caso de ${c.nickname}.` } },
    ],
  }),
]

const RIVAL_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'rival', clientId: c.legendId,
    title: `Sérgio Cambalhota cercando ${c.nickname}`,
    description: `Seu rival está sussurrando no ouvido de ${c.nickname}: "esse empresário te explora, vem comigo". ${c.nickname} ficou na dúvida.`,
    choices: [
      { label: 'Reduzir sua comissão pra segurá-lo', effect: { happiness: 20, narrative: `${c.nickname} bateu o pé e rejeitou o Cambalhota. Por enquanto.` } },
      { label: 'Confiar na relação de vocês', effect: { happiness: -6, narrative: `Arriscado, mas ${c.nickname} continuou com você... desconfiado.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'rival', clientId: c.legendId,
    title: `Outro agente ofereceu mundos a ${c.nickname}`,
    description: `Um empresário poderoso prometeu mansão e carrão pra ${c.nickname} trocar de representante. Tentador.`,
    choices: [
      { label: 'Mostrar seu plano de carreira pra ele', effect: { happiness: 12, reputation: 4, narrative: `${c.nickname} confiou no SEU projeto. Visão de futuro vale mais que carro.` } },
      { label: 'Igualar a oferta na marra (R$10.000)', effect: { money: -10000, happiness: 18, narrative: `Caro, mas ${c.nickname} ficou. Você comprou a lealdade dele.` } },
    ],
  }),
]

const BREAKOUT_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'breakout', clientId: c.legendId,
    title: `${c.nickname} fez um jogo HISTÓRICO`,
    description: `${c.nickname} decidiu sozinho a partida e a imprensa está rasgando elogios. Os holofotes acenderam.`,
    choices: [
      { label: 'Botar ele na capa das revistas', effect: { reputation: 10, clientValue: 20, narrative: `${c.nickname} virou manchete nacional. Clubes de olho.` } },
      { label: 'Manter o pé no chão e esperar', effect: { clientValue: 10, happiness: 5, narrative: `Discrição. ${c.nickname} agradeceu não virar circo.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'breakout', clientId: c.legendId,
    title: `Golaço de ${c.nickname} roda o mundo`,
    description: `Um gol de placa de ${c.nickname} está em todos os programas esportivos. Os olheiros europeus anotaram o nome.`,
    choices: [
      { label: 'Vazar interesse de clube grande pra valorizar', effect: { reputation: 6, clientValue: 25, narrative: `O preço de ${c.nickname} inflou. Jogo de mercado bem jogado.` } },
      { label: 'Negociar renovação de contrato agora', effect: { money: 4000, happiness: 8, narrative: `Você renovou ${c.nickname} no momento certo — bônus na conta.` } },
    ],
  }),
]

const FAMILY_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'personal', clientId: c.legendId,
    title: `O pai de ${c.nickname} quer entrar no negócio`,
    description: `O pai de ${c.nickname} exige 5% de tudo e está pressionando o filho contra você.`,
    choices: [
      { label: 'Ceder 5% pra manter a paz', effect: { happiness: 15, narrative: `Paz na família de ${c.nickname}. Sua fatia encolheu um tico.` } },
      { label: 'Recusar com firmeza', effect: { happiness: -18, reputation: 5, narrative: `${c.nickname} ficou no fogo cruzado da própria família.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'personal', clientId: c.legendId,
    title: `${c.nickname} quer comprar casa pra mãe`,
    description: `${c.nickname} te pediu ajuda pra realizar o sonho de comprar uma casa pra mãe. Coração apertado.`,
    choices: [
      { label: 'Adiantar o dinheiro do bolso (R$9.000)', effect: { money: -9000, happiness: 25, narrative: `${c.nickname} chorou. Você ganhou um cliente pra vida toda.` } },
      { label: 'Explicar que ainda não dá', effect: { happiness: -10, narrative: `${c.nickname} entendeu, mas ficou magoado.` } },
    ],
  }),
]

const PRESS_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'press', clientId: c.legendId,
    title: `Globo Esporte quer exclusiva com ${c.nickname}`,
    description: `Grande veículo quer uma entrevista exclusiva com ${c.nickname}. Pode render exposição ou expor demais.`,
    choices: [
      { label: 'Autorizar a entrevista', effect: { reputation: 8, clientValue: 8, narrative: `Boa repercussão. O nome de ${c.nickname} nas manchetes.` } },
      { label: 'Recusar e proteger o jogador', effect: { happiness: 6, narrative: `${c.nickname} agradeceu o blindagem. Silêncio estratégico.` } },
    ],
  }),
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'press', clientId: c.legendId,
    title: `Convite pra propaganda de chuteira (${c.nickname})`,
    description: `Uma marca esportiva quer ${c.nickname} num comercial nacional. Dinheiro bom, mas toma tempo de treino.`,
    choices: [
      { label: 'Fechar o contrato publicitário (+R$12.000)', effect: { money: 12000, happiness: 8, reputation: 4, narrative: `${c.nickname} virou garoto-propaganda. Comissão gorda pra você.` } },
      { label: 'Recusar — foco no futebol', effect: { happiness: 4, clientValue: 5, narrative: `Você priorizou o desempenho de ${c.nickname}. Os técnicos aprovam.` } },
    ],
  }),
]

const MONEY_EVENTS: Make[] = [
  (c, y, w) => ({
    id: eid(y, w), week: w, year: y, type: 'offer', clientId: c.legendId,
    title: `Bicho atrasado: ${c.nickname} reclamando`,
    description: `O clube não pagou a premiação prometida e ${c.nickname} está irritado, cobrando você pra resolver.`,
    choices: [
      { label: 'Pressionar a diretoria do clube', effect: { reputation: 5, happiness: 10, narrative: `Você bateu na mesa e ${c.nickname} recebeu o bicho. Respeito conquistado.` } },
      { label: 'Pedir paciência ao jogador', effect: { happiness: -8, narrative: `${c.nickname} achou que você não brigou por ele.` } },
    ],
  }),
]

const ALL_CATEGORIES: Make[][] = [
  INJURY_EVENTS, SCANDAL_EVENTS, CALOTE_EVENTS, RIVAL_EVENTS,
  BREAKOUT_EVENTS, FAMILY_EVENTS, PRESS_EVENTS, MONEY_EVENTS,
]

export function generateWeeklyEvent(
  year: number,
  week: number,
  clients: ClientLite[],
  purchasedUpgrades: string[] = [],
): GameEvent | null {
  if (clients.length === 0) return null
  if (Math.random() > 0.4) return null

  const c = clients[Math.floor(Math.random() * clients.length)]
  const hasPR = purchasedUpgrades.includes('assessoria-imprensa')
  const hasLawyer = purchasedUpgrades.includes('advogado')

  // Build the pool of categories, respecting owned services
  const pool = ALL_CATEGORIES.filter(cat => {
    if (cat === SCANDAL_EVENTS && hasPR) return Math.random() < 0.3 // PR handles most scandals
    if (cat === CALOTE_EVENTS && hasLawyer) return Math.random() < 0.2 // lawyer blocks most calote
    return true
  })

  const cat = pool[Math.floor(Math.random() * pool.length)]
  const make = cat[Math.floor(Math.random() * cat.length)]
  return make(c, year, week)
}

// ─── AMBIENT NEWS ENGINE ────────────────────────────────────────
// Builds a large, CONTEXTUAL pool every week (reacts to age, position,
// status, personality, value, era) and never repeats the recent lines.

const WORLD_NEWS: Record<number, string[]> = {
  1993: [
    '📻 O futebol brasileiro discute a profissionalização dos clubes — fim da era amadora.',
    '🌍 A Série A italiana é a liga mais rica e cobiçada do planeta.',
    '📺 A TV paga começa a despejar dinheiro no futebol europeu.',
    '🎵 Nos rádios: "TED Maia", axé e o som dos anos 90 embalam os vestiários.',
    '🇮🇹 Milan de Capello atropela todo mundo com seu trio holandês.',
  ],
  1994: [
    '🏆 BRASIL TETRACAMPEÃO MUNDIAL nos EUA! O país inteiro para.',
    '⚽ Romário e Bebeto comandam o título — o "balança o nenê" roda o mundo.',
    '💔 Tragédia: Andrés Escobar é assassinado após gol contra. O futebol chora.',
    '💰 Clubes europeus de olho na safra brasileira pós-Copa.',
    '🥅 Maradona é expulso da Copa por doping. Fim melancólico de um ídolo.',
  ],
  1995: [
    '⚖️ LEI BOSMAN! Jogador em fim de contrato sai DE GRAÇA. O mercado muda pra sempre.',
    '🌍 Acabam os limites de estrangeiros nos clubes europeus.',
    '✈️ Agora qualquer brasileiro pode lotar os times da Europa.',
    '📈 Os salários disparam: jogador livre vira ouro.',
  ],
  1996: [
    '🏟️ A Champions League cresce e vira a competição mais cobiçada do mundo.',
    '✈️ O êxodo de brasileiros pra Europa vira enxurrada.',
    '🇳🇱 Ajax revela uma geração de ouro que encanta o continente.',
    '🏅 Nigéria leva o ouro olímpico no futebol em Atlanta.',
  ],
  1997: [
    '💸 Os valores de transferência batem recordes ano após ano.',
    '🇧🇷 O Brasil é a maior fábrica de craques do planeta.',
    '🏆 Borussia Dortmund surpreende e fatura a Champions.',
    '⚽ Ronaldo brilha no Barça e o mundo descobre o "Fenômeno".',
  ],
  1998: [
    '🏆 FRANÇA campeã do mundo em casa! Zidane vira herói nacional.',
    '💰 Denílson vira a transferência mais cara da história — €31,5M pro Betis.',
    '😱 Final bizarra: Ronaldo passa mal horas antes e o Brasil perde o título.',
    '🌍 A Copa da França bate recordes de audiência no mundo todo.',
  ],
  1999: [
    '🌍 Real Madrid começa a montar a era dos "Galácticos".',
    '🔴 Manchester United faz a TRÍPLICE COROA com virada épica na Champions.',
    '⚽ O dinheiro da TV transforma o futebol num negócio bilionário.',
    '💻 A internet começa a mudar como o mundo acompanha futebol.',
  ],
  2000: [
    '🏟️ Reformas de estádios modernizam o futebol mundial pro novo milênio.',
    '💰 Contratos de imagem fazem salários de craques explodirem.',
    '🇫🇷 França confirma hegemonia e leva também a Eurocopa.',
    '⭐ Nasce a era dos megacontratos publicitários.',
  ],
  2001: [
    '💰 Zidane custa €75M ao Real — novo recorde mundial.',
    '🏆 Bayern reconquista a Europa após décadas.',
    '📊 Estatística e ciência começam a entrar no futebol.',
  ],
  2002: [
    '🏆 BRASIL PENTACAMPEÃO! Ronaldo se vinga do mundo com 8 gols na Copa.',
    '🌏 A Copa da Coreia/Japão revela mercados gigantes pro futebol.',
    '🇰🇷 Coreia do Sul faz a semifinal e enlouquece a Ásia.',
    '⚽ O voleio de Zidane em Glasgow entra pra história da Champions.',
  ],
  2003: [
    '💰 Um bilionário russo compra o Chelsea e vira tudo de cabeça pra baixo.',
    '⚽ Começa a era dos clubes-empresa de donos bilionários.',
    '🇵🇹 Um técnico chamado Mourinho ganha a Champions com o Porto — e o mundo anota o nome.',
  ],
  2004: [
    '🇬🇷 GRÉCIA campeã da Euro — o maior azarão da história calou o mundo.',
    '⭐ Uma nova geração desponta: o futebol troca de era.',
    '🔥 Arsenal "Invencível" passa a temporada inteira sem perder na Inglaterra.',
  ],
  2005: [
    '🏆 Liverpool faz a "NOITE DE ISTAMBUL": vira o 3x0 e é campeão nos pênaltis.',
    '🌟 Ronaldinho Gaúcho é o melhor do mundo e o Barça renasce.',
    '💰 O dinheiro inglês começa a dominar o mercado europeu.',
  ],
  2006: [
    '🏆 ITÁLIA tetracampeã! E Zidane se despede com a cabeçada em Materazzi.',
    '⚽ Calciopoli: escândalo de arbitragem rebaixa a Juventus.',
    '🌍 A Copa da Alemanha é uma festa global.',
  ],
  2007: [
    '🏅 Kaká é eleito o melhor do mundo — o último antes da era Messi/CR7.',
    '🔴 Milan se vinga e fatura a Champions.',
    '💰 Os clubes ingleses dominam as quartas da Champions.',
  ],
  2008: [
    '🏆 CR7 conquista sua primeira Bola de Ouro com o United.',
    '🇪🇸 Espanha leva a Euro e inicia uma dinastia histórica.',
    '⚽ Nasce o duelo eterno: Messi x Cristiano.',
  ],
}

// ── flavor cultural/era (toca quando não há notícia de mundo específica) ──
const ERA_FLAVOR: { from: number; to: number; lines: string[] }[] = [
  { from: 1993, to: 1996, lines: [
    '📼 Nas locadoras, todo mundo aluga fita VHS. O som é de fita cassete.',
    '📟 O auge do pager: craque que se preze tem um no bolso.',
    '🎮 A molecada joga Super Nintendo e sonha em ser jogador.',
  ]},
  { from: 1997, to: 2000, lines: [
    '💿 O CD toma conta e o Orkut ainda nem existe.',
    '📱 Celulares "tijolão" viram símbolo de status entre os jogadores.',
    '🌐 A virada do milênio assombra com o "bug do ano 2000".',
  ]},
  { from: 2001, to: 2005, lines: [
    '📲 SMS vira mania e os empresários fecham negócio por torpedo.',
    '💻 Os primeiros sites de notícia esportiva mudam o jornalismo.',
    '🎧 iPod no vestiário: a nova geração chega plugada.',
  ]},
  { from: 2006, to: 2010, lines: [
    '📱 Smartphones começam a aparecer nas mãos dos craques.',
    '📺 A TV em alta definição revoluciona a transmissão dos jogos.',
    '🌍 As redes sociais começam a aproximar ídolos e torcedores.',
  ]},
]

// ── notícias de competição por época ──
function competitionNews(year: number): string[] {
  const out: string[] = []
  out.push('🏆 A Libertadores esquenta e os clubes brasileiros sonham com a glória.')
  out.push('🇧🇷 O Brasileirão entra na reta decisiva com clássicos pegados.')
  if (year >= 1995) out.push('⭐ A Champions League domina as manchetes europeias.')
  return out
}

// ── notícias contextuais sobre um cliente (reagem ao perfil dele) ──
function clientNews(c: ClientLite, year: number): string[] {
  const out: string[] = []
  const age = c.birthYear ? year - c.birthYear : 22
  const pos = c.position
  const r = c.currentRating

  // por posição
  if (pos === 'ATA') out.push(`⚽ ${c.nickname} fez mais um golaço e a torcida grita o nome dele.`,
    `🎯 ${c.nickname} lidera a artilharia e os zagueiros já temem o nome.`)
  if (pos === 'MEI') out.push(`🎩 Um drible de ${c.nickname} viralizou nos programas esportivos.`,
    `🧠 ${c.nickname} comanda o meio-campo como um maestro.`)
  if (pos === 'ZAG' || pos === 'LAT') out.push(`🛡️ ${c.nickname} fez um corte salvador e a defesa virou muralha.`)
  if (pos === 'GOL') out.push(`🧤 ${c.nickname} fez uma defesa milagrosa que parou o estádio.`)

  // por idade / fase
  if (age <= 18) out.push(`👶 ${c.nickname}, ainda um moleque, treina com os profissionais e impressiona.`,
    `📚 A família de ${c.nickname} sonha alto — e você segura as pontas.`)
  else if (age >= 30) out.push(`⏳ Comentaristas questionam por quanto tempo ${c.nickname} aguenta o ritmo.`,
    `🎖️ ${c.nickname} vira referência no vestiário e ensina a molecada.`)

  // por rating / mercado
  if (r >= 80) out.push(`🌍 Os maiores clubes do mundo monitoram cada jogo de ${c.nickname}.`,
    `💰 O valor de ${c.nickname} dispara e a imprensa fala em transferência milionária.`)
  else if (r >= 60) out.push(`📈 ${c.nickname} subiu de nível e olheiros europeus lotaram a arquibancada.`)
  else out.push(`🌱 ${c.nickname} ainda é cru, mas mostra lampejos de craque.`)

  // por personalidade
  if (c.personality === 'difícil') out.push(`🎭 ${c.nickname} arrumou confusão no vestiário — climão com o técnico.`,
    `🌃 Boatos de que ${c.nickname} foi visto na balada véspera de jogo.`)
  if (c.personality === 'humilde') out.push(`😇 ${c.nickname} visitou um hospital infantil e ganhou o coração da cidade.`)
  if (c.personality === 'ambicioso') out.push(`🔥 ${c.nickname} declarou que quer ser o melhor do mundo. Polêmica garantida.`)
  if (c.personality === 'leal') out.push(`🤝 ${c.nickname} jurou amor à camisa e a torcida o carrega nos ombros.`)

  // proximidade do auge
  if (c.peakYearStart && year >= c.peakYearStart - 1 && year <= c.peakYearStart + 1) {
    out.push(`🚀 Todos sentem: ${c.nickname} está prestes a explodir de vez. Hora de valorizar.`)
  }

  // genéricas de bastidor
  out.push(
    `🗣️ Comentaristas debatem se ${c.nickname} merece a Seleção.`,
    `🎤 ${c.nickname} deu uma entrevista madura e caiu nas graças do público.`,
    `🤝 A torcida estampou faixas com o nome de ${c.nickname} no estádio.`,
  )
  return out
}

// ── provocações do nemesis ──
function nemesisNews(c: ClientLite | null): string[] {
  const out = [
    '😈 Sérgio Cambalhota apareceu na TV se gabando de "ter o melhor faro do Brasil". Que piada.',
    '😏 Dizem que Cambalhota anda perguntando como você sempre acerta os palpites.',
    '🕵️ Cambalhota foi visto rondando os mesmos campos que você. Coincidência?',
  ]
  if (c) out.push(`👀 Cambalhota soltou nos bastidores que vai "fisgar ${c.nickname}" de você.`)
  return out
}

function pickEra(year: number): string[] {
  const e = ERA_FLAVOR.find(e => year >= e.from && year <= e.to)
  return e ? e.lines : []
}

export function generateAmbientNews(
  year: number,
  clients: ClientLite[],
  recent: string[] = [],
): string | null {
  // Build a big weighted pool
  const pool: string[] = []
  const world = WORLD_NEWS[year] ?? []
  // weight world news a bit heavier by adding twice
  pool.push(...world, ...world)
  pool.push(...pickEra(year))
  pool.push(...competitionNews(year))
  if (clients.length > 0) {
    // 2 random clients' contextual news
    const shuffled = [...clients].sort(() => Math.random() - 0.5)
    for (const c of shuffled.slice(0, 2)) pool.push(...clientNews(c, year))
    if (Math.random() < 0.25) pool.push(...nemesisNews(shuffled[0]))
  } else {
    if (Math.random() < 0.2) pool.push(...nemesisNews(null))
  }

  if (pool.length === 0) return null

  // avoid the recently shown lines
  const recentSet = new Set(recent)
  const fresh = pool.filter(s => !recentSet.has(s))
  const finalPool = fresh.length ? fresh : pool
  return finalPool[Math.floor(Math.random() * finalPool.length)]
}

// ─── SCOUTS (desbloqueiam lendas por país) ──────────────────────
// cost = taxa única de contratação  |  monthlyCost = mensalidade
export const SCOUT_UPGRADES = [
  { id: 'scout-FR', region: 'FR', name: 'Olheiro na França', flag: '🇫🇷',
    description: 'Uma rede de contatos no futebol francês para garimpar talentos antes de qualquer um.',
    cost: 6000, monthlyCost: 1200, effect: 'Revela lendas francesas: Zidane, Henry, Drogba' },
  { id: 'scout-IT', region: 'IT', name: 'Olheiro na Itália', flag: '🇮🇹',
    description: 'Olhos dentro das categorias de base do calcio italiano.',
    cost: 7000, monthlyCost: 1400, effect: 'Revela lendas italianas: Totti e cia' },
  { id: 'scout-IB', region: 'IB', name: 'Olheiro na Ibéria', flag: '🇵🇹',
    description: 'Cobertura de Portugal e Espanha — das ilhas a La Masia.',
    cost: 9000, monthlyCost: 1800, effect: 'Revela lendas ibéricas: CR7 e Iniesta' },
  { id: 'scout-AR', region: 'AR', name: 'Olheiro na Argentina', flag: '🇦🇷',
    description: 'Contatos nas divisões de base argentinas. Onde nasce a magia.',
    cost: 8000, monthlyCost: 1600, effect: 'Revela lendas argentinas: La Pulga e a nova geração' },
  { id: 'scout-NO', region: 'NO', name: 'Olheiro na Europa do Norte', flag: '🇳🇱',
    description: 'Rede pela Holanda, Suécia e Alemanha.',
    cost: 7000, monthlyCost: 1400, effect: 'Revela lendas do norte europeu: Ibra, Kluivert, Ballack, Kahn' },
  { id: 'scout-EN', region: 'EN', name: 'Olheiro na Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    description: 'Contatos na terra do futebol — das academias inglesas.',
    cost: 8000, monthlyCost: 1600, effect: 'Revela lendas inglesas: Beckham, Gerrard, Lampard, Owen' },
]

// ─── SERVIÇOS (ligados aos eventos) ─────────────────────────────
export const SERVICE_UPGRADES = [
  { id: 'assessoria-imprensa', name: 'Assessoria de Imprensa fixa', flag: '🎙️',
    description: 'Gerencia crises e exposição dos seus clientes. Quando vazar foto ou escândalo, ela resolve de GRAÇA — sem você pagar avulso a cada vez.',
    cost: 18000, effect: 'Escândalos resolvidos sem custo' },
  { id: 'advogado', name: 'Advogado especializado fixo', flag: '⚖️',
    description: 'Contratos blindados. Clube nenhum dá calote na sua comissão — e quando tentam, você ainda lucra.',
    cost: 20000, effect: 'Elimina risco de calote (vira lucro)' },
  { id: 'personal-trainer', name: 'Personal trainer e nutricionista', flag: '🏋️', repGain: 3,
    description: 'Seus clientes chegam mais preparados. Menos tempo no DM e mais na mira dos clubes grandes.',
    cost: 28000, effect: '+3 rep · clientes valorizam mais e sofrem menos lesões' },
]

// ─── ESCRITÓRIOS (presença física = custo mensal + reputação) ────
// cost = reforma/abertura  |  monthlyCost = aluguel mensal
export const OFFICE_UPGRADES = [
  { id: 'office-sp', name: 'Escritório em São Paulo', flag: '🏙️', repGain: 5,
    description: 'Presença física no centro financeiro do futebol brasileiro. Clubes da elite BR te levam mais a sério.',
    cost: 25000, monthlyCost: 2000, effect: '+5 rep · força nas negociações BR' },
  { id: 'office-rio', name: 'Escritório no Rio de Janeiro', flag: '🏖️', repGain: 5,
    description: 'No coração do futebol carioca. Abre portas com Flamengo, Vasco, Fluminense e Botafogo.',
    cost: 22000, monthlyCost: 1800, effect: '+5 rep · acesso aos clubes cariocas' },
  { id: 'office-lisboa', name: 'Escritório em Lisboa', flag: '🇵🇹', repGain: 8,
    description: 'A porta de entrada para a Europa. Clubes portugueses te chamam com frequência e os olheiros europeus te veem como gente séria.',
    cost: 60000, monthlyCost: 5500, effect: '+8 rep · gateway para a Europa' },
  { id: 'office-madrid', name: 'Escritório em Madrid', flag: '🇪🇸', repGain: 10,
    description: 'Real Madrid e Atlético do lado de casa. Propostas espanholas chegam com mais frequência e com luvas maiores.',
    cost: 90000, monthlyCost: 8000, effect: '+10 rep · LaLiga no seu colo' },
  { id: 'office-milan', name: 'Escritório em Milão', flag: '🇮🇹', repGain: 10,
    description: 'AC Milan e Inter do lado. A Serie A como território. Calcio nas veias.',
    cost: 95000, monthlyCost: 8500, effect: '+10 rep · Serie A sem filtro' },
  { id: 'office-paris', name: 'Escritório em Paris', flag: '🇫🇷', repGain: 11,
    description: 'A Ligue 1 está crescendo. Posicione-se antes dos petrodólares transformarem Paris no novo centro do mundo.',
    cost: 110000, monthlyCost: 9500, effect: '+11 rep · Ligue 1 como território' },
  { id: 'office-london', name: 'Escritório em Londres', flag: '🇬🇧', repGain: 14,
    description: 'A Premier League é o ápice do mercado. Um escritório aqui coloca você na mesa dos maiores cheques do futebol mundial.',
    cost: 170000, monthlyCost: 15000, effect: '+14 rep · Premier League sem filtro' },
]

// ─── ESTILO DE VIDA & STATUS — ser rico e poderoso aumenta sua reputação,
// e reputação destrava os jogadores mais cobiçados ───────────────
export const LIFESTYLE_UPGRADES = [
  { id: 'life-relogio', name: 'Relógio de grife', flag: '⌚', repGain: 3,
    description: 'Um relógio que vale um carro. Impõe respeito numa reunião.', cost: 15000, effect: '+3 de reputação' },
  { id: 'life-carro', name: 'Carro esportivo', flag: '🚗', repGain: 5,
    description: 'Você chega chegando. Os jogadores notam o sucesso.', cost: 35000, effect: '+5 de reputação' },
  { id: 'life-camarote', name: 'Camarote VIP nos estádios', flag: '🎩', repGain: 6,
    description: 'Você passa a ser visto entre os figurões do futebol. Cartolas te cumprimentam pelo nome.',
    cost: 60000, effect: '+6 de reputação' },
  { id: 'life-resort', name: 'Resort de férias pra clientes', flag: '🏝️', repGain: 7,
    description: 'Manda seus jogadores tirar férias de luxo no seu resort exclusivo. Eles voltam renovados e te adoram.',
    cost: 110000, effect: '+7 rep · moral de todos os clientes explode' },
  { id: 'life-estudio', name: 'Estúdio de gravação e mídia', flag: '🎵', repGain: 5,
    description: 'Seus clientes lançam música, fazem comercial, viram celebridade. A mídia fala de você o tempo todo.',
    cost: 85000, effect: '+5 rep · clientes viram marca no Brasil e fora' },
  { id: 'life-mansao', name: 'Mansão', flag: '🏡', repGain: 10,
    description: 'Receba craques e cartolas na sua casa de cinema. Status de elite que poucos têm.',
    cost: 150000, effect: '+10 de reputação' },
  { id: 'life-supercar', name: 'Supercarro de coleção', flag: '🏎️', repGain: 8,
    description: 'Um carro que não existe pra comprar, só pra encomendar. Você claramente chegou lá.',
    cost: 250000, effect: '+8 de reputação' },
  { id: 'life-arte', name: 'Coleção de arte contemporânea', flag: '🎨', repGain: 9,
    description: 'Galerias em Paris e Milão. Você transita entre o futebol e a alta cultura europeia. Portas diferentes se abrem.',
    cost: 380000, effect: '+9 rep · prestígio nos círculos europeus' },
  { id: 'life-iate', name: 'Iate', flag: '🛥️', repGain: 12,
    description: 'Festas no mar com os maiores nomes do esporte e da política. Informações que não chegam de outro jeito.',
    cost: 320000, effect: '+12 de reputação' },
  { id: 'life-jatinho', name: 'Jatinho particular', flag: '✈️', repGain: 15,
    description: 'Feche negócios em três continentes no mesmo dia. Nenhum rival consegue acompanhar o seu ritmo.',
    cost: 600000, effect: '+15 de reputação' },
]

export const UPGRADE_OPTIONS = [...SCOUT_UPGRADES, ...SERVICE_UPGRADES, ...OFFICE_UPGRADES, ...LIFESTYLE_UPGRADES]
export const ALL_MONTHLY_UPGRADES = [...SCOUT_UPGRADES, ...OFFICE_UPGRADES]
