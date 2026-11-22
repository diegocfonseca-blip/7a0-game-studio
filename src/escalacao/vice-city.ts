// ─── 🌴 VICE CITY: as cartas de golpe do pregão aberto ─────────────────────────────────────────────────────────────
//
// Ideia do Diego (19/11, pra pegar o hype do lançamento do GTA 6): um modo de sala com o leilão de sempre (Pregão aberto) e
// CARTAS DE GOLPE pra usar contra os rivais. Mockup aprovado: `scripts/mockups/vice-city-pregao.png` (*"Pode fazer adorei"*).
// Regras que ele fechou (todas em `docs/pendencias.md`, 19/11):
//  · cada técnico de GENTE recebe 3 cartas sorteadas (pode repetir), TODAS antes da 1ª carta, com a janela do sorteio (19/11, v2)
//  · quem LEVA golpe ganha 1 ⭐ (toda carta dá 1). As estrelas são ESCONDIDAS — só o 🎯 Sniper mostra o ranking
//  · o 1º a chegar em 5 ⭐ leva BUSTED (uma vez por sala): perde os 3 MELHORES, que viram cartas reais de categoria
//    Profissional da mesma posição e NÃO voltam pra mesa; ganha 1 🚗 Roubo de carro de vingança
//  · todo golpe é ANUNCIADO pra sala inteira (*"sempre cada golpe ou coisa que alguém faz pra si aparece pra todos"*); o que é
//    segredo (o que o X9 e o Sniper mostram) só quem usou vê — mas que usou, todo mundo vê
//  · nada com nome, logo ou personagem do GTA: só o clima (paródia)
// Este arquivo é PURO (catálogo, textos, sorteio). Quem mexe no estado é o motor em `store.tsx` (`viceUsa`).

export type GolpeId =
  | 'roubo' | 'assalto' | 'blitz' | 'barreira' | 'cadeia' | 'multa' | 'tanque' | 'tiroteio' | 'delacao' | 'sequestro' | 'lavagem'
  | 'colete' | 'fuga' | 'propina' | 'x9' | 'funilaria' | 'bolsa' | 'sniper'
  // 🆕 21/11 (Diego escolheu no mockup `scripts/mockups/vice-golpes-novos.png`: *"Ok publique todos eles"*)
  | 'pneu' | 'jacare' | 'npc' | 'trapaca' | 'missao' | 'paraquedas' | 'loja' | 'contrabando'

export type Golpe = {
  id: GolpeId
  emoji: string
  nome: [string, string]
  /** o que faz, numa frase (a carta na mão) */
  faz: [string, string]
  /** precisa escolher um rival? (as de ataque) */
  alvo: boolean
  /** peso no sorteio (as fortes saem menos) */
  peso: number
}

export const GOLPES: Record<GolpeId, Golpe> = {
  roubo: { id: 'roubo', emoji: '🚗', nome: ['Roubo de carro', 'Car theft'], faz: ['Rouba o último jogador que ele levou, de graça', 'Steals the last player they won, for free'], alvo: true, peso: 2 },
  assalto: { id: 'assalto', emoji: '🏦', nome: ['Assalto ao banco', 'Bank heist'], faz: ['Tira 10 moedas do caixa dele pra você', 'Takes 10 coins from their cash to you'], alvo: true, peso: 2 },
  blitz: { id: 'blitz', emoji: '🚔', nome: ['Blitz', 'Roadblock'], faz: ['Ele fica 10 s sem poder dar lance', 'They can’t bid for 10 s'], alvo: true, peso: 4 },
  barreira: { id: 'barreira', emoji: '🚧', nome: ['Barreira', 'Barrier'], faz: ['Ele fica uma rodada (uma carta) sem dar lance', 'They sit out one round (one card)'], alvo: true, peso: 4 },
  cadeia: { id: 'cadeia', emoji: '🔒', nome: ['Cadeia', 'Jail'], faz: ['O jogador mais caro dele volta pra mesa NA HORA (ele recebe o dinheiro)', 'Their priciest player goes back to the table NOW (they get the money back)'], alvo: true, peso: 3 },
  multa: { id: 'multa', emoji: '🧾', nome: ['Multa', 'Fine'], faz: ['A próxima carta dele custa 30% a mais', 'Their next card costs 30% more'], alvo: true, peso: 4 },
  tanque: { id: 'tanque', emoji: '⛽', nome: ['Tanque vazio', 'Empty tank'], faz: ['Por 15 s ele só dá lance até 10 moedas', 'For 15 s they can only bid up to 10 coins'], alvo: true, peso: 4 },
  tiroteio: { id: 'tiroteio', emoji: '🔫', nome: ['Tiroteio', 'Shootout'], faz: ['O caixa dele congela por 10 s', 'Their cash freezes for 10 s'], alvo: true, peso: 3 },
  delacao: { id: 'delacao', emoji: '👮', nome: ['Delação', 'Snitch'], faz: ['Mostra pra sala inteira quanto dinheiro ele tem', 'Shows the whole room how much cash they have'], alvo: true, peso: 3 },
  sequestro: { id: 'sequestro', emoji: '🚕', nome: ['Sequestro', 'Kidnapping'], faz: ['Troca o seu pior jogador pelo melhor dele, na mesma posição', 'Swaps your worst player for their best, same position'], alvo: true, peso: 2 },
  lavagem: { id: 'lavagem', emoji: '💸', nome: ['Lavagem', 'Laundering'], faz: ['Metade do que ele pagar na próxima carta vai pro seu caixa', 'Half of what they pay for their next card goes to you'], alvo: true, peso: 3 },
  colete: { id: 'colete', emoji: '🛡️', nome: ['Colete', 'Vest'], faz: ['O próximo golpe contra você não pega', 'The next attack on you fails'], alvo: false, peso: 4 },
  fuga: { id: 'fuga', emoji: '🚁', nome: ['Fuga de helicóptero', 'Chopper escape'], faz: ['Devolve o próximo golpe pra quem usou', 'Sends the next attack back to its sender'], alvo: false, peso: 3 },
  propina: { id: 'propina', emoji: '💵', nome: ['Propina', 'Bribe'], faz: ['Sua próxima carta sai pela metade do preço', 'Your next card costs half'], alvo: false, peso: 3 },
  x9: { id: 'x9', emoji: '📡', nome: ['X9', 'Informant'], faz: ['Mostra só pra você as 3 próximas cartas da mesa', 'Shows only you the next 3 cards'], alvo: false, peso: 3 },
  funilaria: { id: 'funilaria', emoji: '🎨', nome: ['Funilaria', 'Respray'], faz: ['Zera as suas estrelas', 'Clears your stars'], alvo: false, peso: 3 },
  bolsa: { id: 'bolsa', emoji: '🎲', nome: ['Bolsa misteriosa', 'Mystery bag'], faz: ['Vira outra carta de golpe, sorteada', 'Turns into another random card'], alvo: false, peso: 2 },
  // 🆕 21/11 — as 8 que o Diego escolheu (só o que NÃO tinha parecido: WASTED/Trote = Blitz, Guincho = Cadeia… ficaram de fora)
  pneu: { id: 'pneu', emoji: '🛞', nome: ['Pneu furado', 'Flat tire'], faz: ['Por 30 s o rival só dá lance de +1', 'For 30 s they can only bid +1'], alvo: true, peso: 4 },
  jacare: { id: 'jacare', emoji: '🐊', nome: ['Jacaré', 'Gator'], faz: ['Fica de tocaia no rival: a próxima LENDA que cair no time dele vai pro seu, de graça', 'Lies in wait: the next LEGEND that lands on their team goes to yours, free'], alvo: true, peso: 2 },
  npc: { id: 'npc', emoji: '🤖', nome: ['NPC', 'NPC'], faz: ['Manda uma carta Profissional aleatória pro time do rival, ocupando uma vaga dele', 'Sends a random Pro card to their team, taking one of their slots'], alvo: true, peso: 3 },
  trapaca: { id: 'trapaca', emoji: '🎮', nome: ['Código de trapaça', 'Cheat code'], faz: ['+50 moedas — mas a sala vê "TRAPACEIRO!" e você ganha +1 ⭐', '+50 coins — but the room sees "CHEATER!" and you get +1 ⭐'], alvo: false, peso: 2 },
  missao: { id: 'missao', emoji: '💼', nome: ['Missão cumprida', 'Mission passed'], faz: ['Ganhou a carta da mesa? +10 moedas de bônus', 'Win the card on the table? +10 bonus coins'], alvo: false, peso: 4 },
  paraquedas: { id: 'paraquedas', emoji: '🪂', nome: ['Paraquedas', 'Parachute'], faz: ['Uma LENDA aleatória cai do céu no seu time, de graça', 'A random LEGEND drops into your team, free'], alvo: false, peso: 1 },
  loja: { id: 'loja', emoji: '🔫', nome: ['Loja de armas', 'Gun shop'], faz: ['Paga 10 moedas e ganha mais 1 carta de golpe aleatória', 'Pay 10 coins and get 1 more random heist card'], alvo: false, peso: 3 },
  contrabando: { id: 'contrabando', emoji: '✈️', nome: ['Contrabando', 'Smuggling'], faz: ['O avião passa pra sala toda e o caixote cai pra 1 pessoa sorteada: ela ganha 1 carta de golpe', 'The plane flies over everyone and drops a crate on 1 random player: they get 1 heist card'], alvo: false, peso: 3 },
  sniper: { id: 'sniper', emoji: '🎯', nome: ['Sniper', 'Sniper'], faz: ['Mostra só pra você o ranking de estrelas', 'Shows only you the star ranking'], alvo: false, peso: 3 },
}
export const GOLPE_IDS = Object.keys(GOLPES) as GolpeId[]

/** ⭐ quantas estrelas dão BUSTED */
export const VICE_BUSTED_EM = 5
/** 🃏 quantas cartas de golpe cada técnico recebe — TODAS no sorteio do começo (19/11 v2: era 1 no começo + 1 na metade) */
export const VICE_CARTAS_POR_TECNICO = 3
/** 🎰 a janela do sorteio das cartas: a 1ª carta da mesa só começa a correr depois dela */
export const VICE_SORTEIO_MS = 7_000
/** 👥 a sala Vice City é Pregão aberto até 10 (uma carta na mesa por vez — o golpe acontece na frente de todo mundo) */
export const VICE_MAX_JOGADORES = 10
export const VICE_BLITZ_MS = 10_000
export const VICE_TIROTEIO_MS = 10_000
export const VICE_TANQUE_MS = 15_000
export const VICE_TANQUE_TETO = 10
export const VICE_ASSALTO = 10
export const VICE_MULTA = 0.3
export const VICE_PNEU_MS = 30_000
export const VICE_TRAPACA = 50
export const VICE_MISSAO = 10
export const VICE_LOJA = 10

/** 🎲 sorteia uma carta pelo peso (as fortes saem menos). `sem` = ids que não podem sair (a Bolsa não vira Bolsa). */
export function sorteiaGolpe(rng: () => number, sem: GolpeId[] = []): GolpeId {
  const ids = GOLPE_IDS.filter(id => !sem.includes(id))
  const tot = ids.reduce((s, id) => s + GOLPES[id].peso, 0)
  let r = rng() * tot
  for (const id of ids) { r -= GOLPES[id].peso; if (r < 0) return id }
  return ids[ids.length - 1]
}

/** a linha que a sala inteira lê quando alguém usa uma carta (PT/EN). `quem`/`alvo` são nomes de time. */
export function anuncioGolpe(id: GolpeId, quem: string, alvo?: string, extra?: string): [string, string] {
  const g = GOLPES[id]
  const a = alvo ?? ''
  switch (id) {
    case 'roubo': return [`🚗 ${quem} roubou ${extra ?? 'um jogador'} do ${a}!`, `🚗 ${quem} stole ${extra ?? 'a player'} from ${a}!`]
    case 'assalto': return [`🏦 ${quem} assaltou o ${a}: ${extra ?? VICE_ASSALTO} moedas!`, `🏦 ${quem} robbed ${a}: ${extra ?? VICE_ASSALTO} coins!`]
    case 'blitz': return [`🚔 BLITZ! ${quem} travou o ${a}: 10 s sem dar lance`, `🚔 ROADBLOCK! ${quem} stopped ${a}: 10 s without bidding`]
    case 'barreira': return [`🚧 ${quem} pôs uma barreira no ${a}: uma rodada sem lance`, `🚧 ${quem} blocked ${a}: one round without bids`]
    case 'cadeia': return [`🔒 ${quem} mandou o ${a} pra cadeia: ${extra ?? 'o jogador mais caro dele'} voltou pra mesa`, `🔒 ${quem} jailed ${a}: ${extra ?? 'their priciest player'} went back to the table`]
    case 'multa': return [`🧾 ${quem} multou o ${a}: a próxima carta dele custa +30%`, `🧾 ${quem} fined ${a}: their next card costs +30%`]
    case 'tanque': return [`⛽ ${quem} esvaziou o tanque do ${a}: 15 s só com lance até 10`, `⛽ ${quem} drained ${a}’s tank: 15 s, bids up to 10 only`]
    case 'tiroteio': return [`🔫 Tiroteio! ${quem} congelou o caixa do ${a} por 10 s`, `🔫 Shootout! ${quem} froze ${a}’s cash for 10 s`]
    case 'delacao': return [`👮 ${quem} delatou o ${a}: ele tem ${extra ?? '?'} moedas`, `👮 ${quem} snitched on ${a}: they have ${extra ?? '?'} coins`]
    case 'sequestro': return [`🚕 ${quem} sequestrou ${extra ?? 'um jogador'} do ${a}!`, `🚕 ${quem} kidnapped ${extra ?? 'a player'} from ${a}!`]
    case 'lavagem': return [`💸 ${quem} vai lavar o dinheiro do ${a}: metade da próxima compra dele`, `💸 ${quem} is laundering ${a}’s money: half of their next buy`]
    case 'colete': return [`🛡️ ${quem} vestiu o colete`, `🛡️ ${quem} put on a vest`]
    case 'fuga': return [`🚁 ${quem} chamou o helicóptero de fuga`, `🚁 ${quem} called the escape chopper`]
    case 'propina': return [`💵 ${quem} molhou a mão de alguém: a próxima carta sai pela metade`, `💵 ${quem} paid a bribe: next card at half price`]
    case 'x9': return [`📡 ${quem} ligou pro X9 e viu as próximas cartas`, `📡 ${quem} called the informant and saw the next cards`]
    case 'funilaria': return [`🎨 ${quem} passou na funilaria e zerou as estrelas`, `🎨 ${quem} got a respray and cleared their stars`]
    case 'bolsa': return [`🎲 ${quem} abriu a bolsa misteriosa: ${extra ?? '?'}`, `🎲 ${quem} opened the mystery bag: ${extra ?? '?'}`]
    case 'pneu': return [`🛞 ${quem} furou o pneu do ${a}: 30 s só com lance de +1`, `🛞 ${quem} gave ${a} a flat tire: 30 s, +1 bids only`]
    case 'jacare': return [`🐊 ${quem} soltou um jacaré de tocaia no ${a}… a próxima LENDA dele corre perigo`, `🐊 ${quem} set a gator on ${a}… their next LEGEND is in danger`]
    case 'npc': return [`🤖 ${quem} mandou um NPC pro ${a}: ${extra ?? 'um Profissional'} entrou no time dele`, `🤖 ${quem} sent an NPC to ${a}: ${extra ?? 'a Pro'} joined their team`]
    case 'trapaca': return [`🎮 TRAPACEIRO! ${quem} digitou o código: +${VICE_TRAPACA} moedas (e +1 ⭐)`, `🎮 CHEATER! ${quem} typed the code: +${VICE_TRAPACA} coins (and +1 ⭐)`]
    case 'missao': return [`💼 ${quem} pegou uma missão: se levar a carta da mesa, +${VICE_MISSAO} moedas`, `💼 ${quem} took a mission: win the card on the table for +${VICE_MISSAO} coins`]
    case 'paraquedas': return [`🪂 CAIU DO CÉU! ${extra ?? 'Uma lenda'} pousou de paraquedas no ${quem}`, `🪂 FROM THE SKY! ${extra ?? 'A legend'} parachuted into ${quem}`]
    case 'loja': return [`🔫 ${quem} passou na loja de armas (−${VICE_LOJA}) e levou mais uma carta de golpe`, `🔫 ${quem} hit the gun shop (−${VICE_LOJA}) and got one more heist card`]
    case 'contrabando': return [`📦 CONTRABANDO! O avião do ${quem} soltou o caixote pro ${extra ?? '?'}: +1 carta de golpe`, `📦 SMUGGLING! ${quem}’s plane dropped the crate on ${extra ?? '?'}: +1 heist card`]
    case 'sniper': return [`🎯 ${quem} usou o Sniper e viu quem está mais caçado`, `🎯 ${quem} used the Sniper and saw who is most wanted`]
    default: return [`${g.emoji} ${quem} usou ${g.nome[0]}`, `${g.emoji} ${quem} used ${g.nome[1]}`]
  }
}
