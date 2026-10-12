// ─── 🔥 ZOEIRA DO PREGÃO (Diego 12/10) ──────────────────────────────────────
// Nasceu de um print da sala: alguém deu 55 nos goleiros do Bayern (modo Clubes) e
// o chat inteiro zoou. Palavras dele: *"em baixo da cerimônia deveria ter zueiras…
// de quem pagou muito"*, *"já no início, e não ter que passar todos os times pra
// ver"* e *"serve pra qualquer modo das salas rápidas e Minhas Ligas online"*.
//
// Uma faixa logo embaixo do nome da carta/pacote, ANTES dos lances, que só aparece
// DEPOIS do martelo (regra do spoiler). No máximo UMA por revelação, por ordem:
//   💸 pagou caro  ·  😱 por uma moeda (o QUASE, que sobe pra cá no online)  ·  🤑 pechincha
// Revelação sem nada disso = sem faixa.
//
// PURO (sem React, sem estado): a tela só chama `zoeiraDoPregao` — trava `npm run zoeira`.
// A frase é sorteada pela semente da carta: a sala inteira vê a MESMA.

export type ZoeiraTipo = 'caro' | 'quase' | 'pechincha'
export interface Zoeira { tipo: ZoeiraTipo; emoji: string; titulo: string; sub: string }

export interface ZoeiraEntrada {
  /** quem levou (nome do clube; "Você" quando é o próprio) */
  vencedor: string
  /** o que foi vendido: nome da carta, ou "Goleiros do Bayern" no modo Clubes */
  carta: string
  pago: number
  /** os outros lances válidos (sem o vencedor e sem os anulados), com o nome de quem deu */
  outros: { nome: string; valor: number }[]
  /** lenda (fame 5) ou pacote forte — o que faz um preço baixo virar pechincha */
  forte: boolean
  semente: number
  en?: boolean
}

// as réguas (mudou aqui, muda na trava)
export const CARO_VEZES = 2 // deu pelo menos o DOBRO do 2º lugar…
export const CARO_FOLGA = 15 // …e com 15 ou mais de diferença
export const CARO_SOZINHO = 25 // ninguém mais quis e ele deu 25+
export const PECHINCHA_TETO = 8 // lenda/pacote forte por 8 ou menos

type F = (v: { w: string; c: string; p: number; s: number; d: number; l: string }) => [string, string]

const CARO: F[] = [
  v => [`${v.p} moedas em ${v.c}?! ${v.w} abriu o cofre`, `${v.p} coins on ${v.c}?! ${v.w} broke the bank`],
  v => [`${v.w} pagou ${v.p} e o mercado agradece`, `${v.w} paid ${v.p} and the market says thanks`],
  v => [`Alguém segura o ${v.w}! ${v.p} por ${v.c}`, `Somebody stop ${v.w}! ${v.p} for ${v.c}`],
  v => [`${v.c} por ${v.p}?! Nem o Real Madrid pagava isso`, `${v.c} for ${v.p}?! Not even Real Madrid pays that`],
  v => [`${v.w} torrou ${v.p} sem dó nem piedade`, `${v.w} blew ${v.p} without a second thought`],
  v => [`O gerente do banco do ${v.w} tá passando mal`, `${v.w}'s bank manager just fainted`],
  v => [`${v.p} moedas! ${v.w} confundiu ${v.c} com o Pelé`, `${v.p} coins! ${v.w} mistook ${v.c} for Pelé`],
  v => [`${v.w} deu ${v.p}. A sala inteira tá rindo`, `${v.w} bid ${v.p}. The whole room is laughing`],
  v => [`Choveu dinheiro: ${v.w} pagou ${v.p} por ${v.c}`, `Money rain: ${v.w} paid ${v.p} for ${v.c}`],
  v => [`${v.w} não quis saber de preço: ${v.p} e acabou`, `${v.w} didn't care about the price: ${v.p}, done`],
  v => [`Preço de craque, ${v.p} moedas, e ${v.w} nem piscou`, `Superstar money, ${v.p} coins, and ${v.w} didn't blink`],
  v => [`${v.w} mandou ${v.p}. Alguém chama o Procon`, `${v.w} sent ${v.p}. Someone call consumer protection`],
]
const CARO_SUB: F[] = [
  v => [`O 2º lugar deu ${v.s}. Sobraram ${v.d} moedas de troco pro vento 🌬️`, `Runner-up bid ${v.s}. ${v.d} coins thrown to the wind 🌬️`],
  v => [`${v.l} deu ${v.s}. Era só dar ${v.s + 1}… 🤦`, `${v.l} bid ${v.s}. ${v.s + 1} would have done it… 🤦`],
  v => [`${v.d} moedas a mais que o 2º lugar (${v.s}). Generosidade 💸`, `${v.d} coins over the runner-up (${v.s}). Generous 💸`],
  v => [`Ganhou de ${v.l} (${v.s}) com ${v.d} de sobra. Tá rico, né? 🤑`, `Beat ${v.l} (${v.s}) by ${v.d}. Feeling rich? 🤑`],
]
const CARO_SOZINHO_SUB: F[] = [
  _v => [`E o detalhe: ninguém mais deu lance 🤡`, `Fun fact: nobody else even bid 🤡`],
  v => [`Disputou sozinho e ainda pagou ${v.p} 🫠`, `Bid against nobody and still paid ${v.p} 🫠`],
  _v => [`Era só dar 1. Ninguém mais queria 😂`, `1 coin would have done it. Nobody else wanted it 😂`],
]
const QUASE: F[] = [
  v => [`Por ${v.d === 1 ? 'UMA moeda' : '2 moedas'}! ${v.l} chorando no chuveiro`, `By ${v.d === 1 ? 'ONE coin' : '2 coins'}! ${v.l} crying in the shower`],
  v => [`Facada! ${v.d === 1 ? '1 moeda' : '2 moedas'} separou ${v.l} de ${v.c}`, `Stabbed! ${v.d === 1 ? '1 coin' : '2 coins'} kept ${v.l} from ${v.c}`],
  v => [`Na tampa! ${v.w} levou ${v.c} por ${v.d === 1 ? '1 moeda' : '2 moedas'}`, `Photo finish! ${v.w} took ${v.c} by ${v.d === 1 ? '1 coin' : '2 coins'}`],
  v => [`${v.l} vai sonhar com ${v.c} hoje. Faltou ${v.d === 1 ? '1 moeda' : '2 moedas'}`, `${v.l} will dream of ${v.c} tonight. ${v.d === 1 ? '1 coin' : '2 coins'} short`],
  v => [`Que ódio! ${v.l} perdeu ${v.c} por ${v.d === 1 ? '1 moeda' : '2 moedas'}`, `Ouch! ${v.l} lost ${v.c} by ${v.d === 1 ? '1 coin' : '2 coins'}`],
  v => [`${v.w} leu a mente de ${v.l} e cobriu por ${v.d}`, `${v.w} read ${v.l}'s mind and beat it by ${v.d}`],
]
const PECHINCHA: F[] = [
  v => [`Roubo à luz do dia! ${v.w} levou ${v.c} por ${v.p}`, `Daylight robbery! ${v.w} got ${v.c} for ${v.p}`],
  v => [`${v.c} por ${v.p}?! ${v.w} achou na promoção`, `${v.c} for ${v.p}?! ${v.w} found it on sale`],
  v => [`Liquidação! ${v.w} pagou ${v.p} em ${v.c}`, `Clearance sale! ${v.w} paid ${v.p} for ${v.c}`],
  v => [`${v.w} levou ${v.c} com o troco do pão: ${v.p}`, `${v.w} got ${v.c} with bread money: ${v.p}`],
  v => [`Black Friday no pregão: ${v.c} por ${v.p}`, `Black Friday in the auction: ${v.c} for ${v.p}`],
]
const PECHINCHA_SUB: F[] = [
  _v => [`Cadê o resto da sala? Tava todo mundo no banheiro 🚽`, `Where was everyone? Bathroom break? 🚽`],
  _v => [`O resto da sala dormiu no ponto 😴`, `The rest of the room fell asleep 😴`],
  _v => [`Ninguém viu passar 👀`, `Nobody saw it coming 👀`],
  _v => [`Isso devia ser proibido 🚨`, `This should be illegal 🚨`],
]

const pick = <T,>(xs: T[], seed: number, sal: number): T => xs[Math.abs(seed * 31 + sal) % xs.length]

export function zoeiraDoPregao(e: ZoeiraEntrada): Zoeira | null {
  if (!(e.pago > 0)) return null
  const i = e.en ? 1 : 0
  const outros = [...e.outros].filter(o => o.valor > 0).sort((a, b) => b.valor - a.valor)
  const s = outros[0]?.valor ?? 0
  const l = outros.filter(o => o.valor === s).map(o => o.nome).slice(0, 2).join(e.en ? ' and ' : ' e ')
  const d = e.pago - s
  const v = { w: e.vencedor, c: e.carta, p: e.pago, s, d, l }
  // 💸 pagou caro
  if (outros.length ? (e.pago >= s * CARO_VEZES && d >= CARO_FOLGA) : e.pago >= CARO_SOZINHO) {
    const sub = outros.length ? pick(CARO_SUB, e.semente, 7)(v) : pick(CARO_SOZINHO_SUB, e.semente, 7)(v)
    return { tipo: 'caro', emoji: '💸', titulo: pick(CARO, e.semente, 3)(v)[i], sub: sub[i] }
  }
  // 😱 por uma moeda (empate no topo é desempate — outra tela)
  if (outros.length && d >= 1 && d <= 2) {
    return { tipo: 'quase', emoji: '😱', titulo: pick(QUASE, e.semente, 5)(v)[i], sub: `${e.vencedor} ${e.pago} × ${s} ${l}` }
  }
  // 🤑 pechincha
  if (e.forte && e.pago <= PECHINCHA_TETO) {
    return { tipo: 'pechincha', emoji: '🤑', titulo: pick(PECHINCHA, e.semente, 11)(v)[i], sub: pick(PECHINCHA_SUB, e.semente, 13)(v)[i] }
  }
  return null
}
