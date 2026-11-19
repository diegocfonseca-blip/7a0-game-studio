// ─── 🌴 VICE CITY: as cartas de golpe do pregão aberto ─────────────────────────────────────────────────────────────
//
// Ideia do Diego (19/11, pra pegar o hype do lançamento do GTA 6): um modo de sala com o leilão de sempre (Pregão aberto) e
// CARTAS DE GOLPE pra usar contra os rivais. Mockup aprovado: `scripts/mockups/vice-city-pregao.png` (*"Pode fazer adorei"*).
// Regras que ele fechou (todas em `docs/pendencias.md`, 19/11):
//  · cada técnico de GENTE recebe até 2 cartas sorteadas (pode repetir): uma no começo do pregão, outra na metade
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
  cadeia: { id: 'cadeia', emoji: '🔒', nome: ['Cadeia', 'Jail'], faz: ['Ele perde a próxima carta que levar (volta pra mesa)', 'They lose the next card they win (back to the table)'], alvo: true, peso: 3 },
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
  sniper: { id: 'sniper', emoji: '🎯', nome: ['Sniper', 'Sniper'], faz: ['Mostra só pra você o ranking de estrelas', 'Shows only you the star ranking'], alvo: false, peso: 3 },
}
export const GOLPE_IDS = Object.keys(GOLPES) as GolpeId[]

/** ⭐ quantas estrelas dão BUSTED */
export const VICE_BUSTED_EM = 5
/** 🃏 quantas cartas de golpe cada técnico recebe no pregão inteiro (1 no começo + 1 na metade) */
export const VICE_CARTAS_POR_TECNICO = 2
/** 👥 a sala Vice City é Pregão aberto até 10 (uma carta na mesa por vez — o golpe acontece na frente de todo mundo) */
export const VICE_MAX_JOGADORES = 10
export const VICE_BLITZ_MS = 10_000
export const VICE_TIROTEIO_MS = 10_000
export const VICE_TANQUE_MS = 15_000
export const VICE_TANQUE_TETO = 10
export const VICE_ASSALTO = 10
export const VICE_MULTA = 0.3

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
    case 'cadeia': return [`🔒 ${quem} mandou o ${a} pra cadeia: a próxima carta dele volta pra mesa`, `🔒 ${quem} jailed ${a}: their next card goes back to the table`]
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
    case 'sniper': return [`🎯 ${quem} usou o Sniper e viu quem está mais caçado`, `🎯 ${quem} used the Sniper and saw who is most wanted`]
    default: return [`${g.emoji} ${quem} usou ${g.nome[0]}`, `${g.emoji} ${quem} used ${g.nome[1]}`]
  }
}
