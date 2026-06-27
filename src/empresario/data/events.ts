import type { GameEvent } from '../types'

export interface ClientLite {
  legendId: string
  nickname: string
  name: string
  position: string
  currentRating: number
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

// ─── AMBIENT NEWS (sem decisão — só dão textura/dados ao mundo) ──
// Real-flavored news of the era + flavor about your clients.

const WORLD_NEWS: Record<number, string[]> = {
  1993: ['📻 O futebol brasileiro discute a profissionalização dos clubes.', '🌍 A Série A italiana é a liga mais rica e cobiçada do planeta.'],
  1994: ['🏆 BRASIL TETRACAMPEÃO MUNDIAL nos EUA! O país para.', '⚽ Romário e Bebeto comandam o título nos Estados Unidos.', '💰 Clubes europeus de olho na safra brasileira pós-Copa.'],
  1995: ['⚖️ LEI BOSMAN! Jogadores em fim de contrato saem de graça. O mercado muda pra sempre.', '🌍 Clubes podem escalar quantos estrangeiros quiserem na Europa.'],
  1996: ['🏟️ A Champions League cresce e vira a competição mais cobiçada da Europa.', '✈️ Êxodo de brasileiros pra Europa se acelera.'],
  1997: ['💸 Os valores de transferência batem recordes ano após ano.', '🇧🇷 O Brasil é a maior fábrica de craques do mundo.'],
  1998: ['🏆 França campeã do mundo em casa! Zidane vira herói nacional.', '💰 Denílson vira a transferência mais cara da história — €31,5M.'],
  1999: ['🌍 O Real Madrid começa a era dos "Galácticos".', '⚽ O dinheiro da TV transforma o futebol num negócio bilionário.'],
  2000: ['🏟️ A reforma de estádios moderniza o futebol mundial.', '💰 Salários de craques explodem com contratos de imagem.'],
  2002: ['🏆 BRASIL PENTACAMPEÃO! Ronaldo se vinga do mundo com 8 gols na Copa.', '🌏 A Copa da Ásia revela mercados gigantes pro futebol.'],
  2003: ['💰 Um bilionário russo compra o Chelsea e vira tudo de cabeça pra baixo.', '⚽ A era dos clubes-empresa de donos bilionários começa.'],
  2004: ['🇬🇷 Grécia campeã da Euro — o azarão que calou o mundo.', '⭐ Uma nova geração de craques desponta na Europa.'],
  2005: ['🏆 Liverpool faz a "noite de Istambul" e vira do 3x0 na final da Champions.', '🌟 Ronaldinho Gaúcho é o melhor do mundo e o Barça renasce.'],
}

const CLIENT_NEWS: ((c: ClientLite) => string)[] = [
  c => `📰 ${c.nickname} foi destaque na rodada e ganhou elogios da imprensa.`,
  c => `🗣️ Comentaristas debatem se ${c.nickname} merece a Seleção.`,
  c => `📈 O nome de ${c.nickname} começa a circular entre olheiros europeus.`,
  c => `🎯 ${c.nickname} treina firme e impressiona a comissão técnica.`,
  c => `🤝 Torcida adota ${c.nickname} como ídolo e estampa faixas no estádio.`,
  c => `🎤 ${c.nickname} deu entrevista madura e caiu nas graças do público.`,
  c => `🔥 Rivais já reclamam que ${c.nickname} é difícil de marcar.`,
]

export function generateAmbientNews(year: number, clients: ClientLite[]): string | null {
  const roll = Math.random()
  // World news of the era
  if (roll < 0.45) {
    const pool = WORLD_NEWS[year]
    if (pool && pool.length) return pool[Math.floor(Math.random() * pool.length)]
  }
  // Client flavor news
  if (clients.length > 0 && roll < 0.85) {
    const c = clients[Math.floor(Math.random() * clients.length)]
    const make = CLIENT_NEWS[Math.floor(Math.random() * CLIENT_NEWS.length)]
    return make(c)
  }
  return null
}

// ─── SCOUTS (desbloqueiam lendas por país) ──────────────────────
export const SCOUT_UPGRADES = [
  { id: 'scout-FR', region: 'FR', name: 'Olheiro na França', flag: '🇫🇷',
    description: 'Uma rede de contatos no futebol francês para garimpar talentos antes de qualquer um.',
    cost: 6000, effect: 'Revela lendas francesas: Zidane, Henry, Drogba' },
  { id: 'scout-IT', region: 'IT', name: 'Olheiro na Itália', flag: '🇮🇹',
    description: 'Olhos dentro das categorias de base do calcio italiano.',
    cost: 7000, effect: 'Revela lendas italianas: Totti e cia' },
  { id: 'scout-IB', region: 'IB', name: 'Olheiro na Ibéria', flag: '🇵🇹',
    description: 'Cobertura de Portugal e Espanha — das ilhas a La Masia.',
    cost: 9000, effect: 'Revela lendas ibéricas: CR7 e Iniesta' },
  { id: 'scout-AR', region: 'AR', name: 'Olheiro na Argentina', flag: '🇦🇷',
    description: 'Contatos nas divisões de base argentinas. Onde nasce a magia.',
    cost: 8000, effect: 'Revela lendas argentinas: La Pulga e a nova geração' },
  { id: 'scout-NO', region: 'NO', name: 'Olheiro na Europa do Norte', flag: '🇳🇱',
    description: 'Rede pela Holanda, Suécia e Alemanha.',
    cost: 7000, effect: 'Revela lendas do norte europeu: Ibrahimović e cia' },
]

// ─── SERVIÇOS (ligados aos eventos) ─────────────────────────────
export const SERVICE_UPGRADES = [
  { id: 'assessoria-imprensa', name: 'Assessoria de Imprensa fixa', flag: '🎙️',
    description: 'Gerencia crises e exposição dos seus clientes. Quando vazar foto ou escândalo, ela resolve de GRAÇA — sem você pagar avulso a cada vez.',
    cost: 18000, effect: 'Escândalos resolvidos sem custo' },
  { id: 'advogado', name: 'Advogado especializado fixo', flag: '⚖️',
    description: 'Contratos blindados. Clube nenhum dá calote na sua comissão — e quando tentam, você ainda lucra.',
    cost: 20000, effect: 'Elimina risco de calote (vira lucro)' },
  { id: 'escritorio-sp', name: 'Escritório em São Paulo', flag: '🏢',
    description: 'Presença física em SP dá peso nas negociações com clubes brasileiros e aumenta sua reputação.',
    cost: 25000, effect: '+ reputação e força nas negociações BR' },
]

export const UPGRADE_OPTIONS = [...SCOUT_UPGRADES, ...SERVICE_UPGRADES]
