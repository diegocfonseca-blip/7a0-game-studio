/** Regras comuns do pregão. O esporte fornece vagas, piso e contratação;
 * ordem dos envelopes, anulação e desempate são iguais nos três jogos. */
export type CoreBid = { mgr: number; amount: number; reforco?: boolean }
export type CoreResult<C, B> = { card: C; bids: B[]; winner: number | null; paid: number; voided: number[] }
export function resolveLots<C extends { id: string }, B extends CoreBid>(
  cards: C[], bidMap: Map<string, B[]>,
  rules: { floor: (card: C) => number; accepts: (card: C, bid: B) => boolean; buy: (card: C, winner: number, amount: number) => void },
) {
  const byPot = [...cards].sort((a, b) =>
    (bidMap.get(a.id) ?? []).reduce((s, x) => s + x.amount, 0) -
    (bidMap.get(b.id) ?? []).reduce((s, x) => s + x.amount, 0))
  const queue: CoreResult<C, B>[] = [], unsold: C[] = []
  const ties: { card: C; amount: number; managers: number[] }[] = []
  for (const card of byPot) {
    const sorted = [...(bidMap.get(card.id) ?? [])].sort((a, b) => b.amount - a.amount)
    const voided: number[] = []
    let i = 0
    for (; i < sorted.length; i++) {
      if (sorted[i].amount < rules.floor(card) || !rules.accepts(card, sorted[i])) { voided.push(sorted[i].mgr); continue }
      break
    }
    if (i === sorted.length) { unsold.push(card); queue.push({ card, bids: sorted, winner: null, paid: 0, voided }); continue }
    const amount = sorted[i].amount
    const top = sorted.slice(i).filter(b => b.amount === amount && rules.accepts(card, b)).map(b => b.mgr)
    if (top.length >= 2) {
      ties.push({ card, amount, managers: top })
      queue.push({ card, bids: sorted, winner: null, paid: 0, voided })
    } else {
      rules.buy(card, top[0], amount)
      queue.push({ card, bids: sorted, winner: top[0], paid: amount, voided })
    }
  }
  return { queue, unsold, ties }
}

export function fitEnvelope(bids: {cardId:string;amount:number}[], money: number) {
  const accepted: {cardId:string;amount:number}[] = []
  let spent = 0, cut = 0
  for (const bid of Array.isArray(bids) ? bids : []) {
    const amount = Math.floor(Number(bid?.amount))
    if (!Number.isFinite(amount) || amount < 0 || spent + amount > Math.max(0, Math.floor(money))) { cut++; continue }
    spent += amount; accepted.push({ cardId:bid.cardId, amount })
  }
  return { accepted, cut }
}
export function rebidWinner(managers: number[], amounts: Record<number, number>, random: () => number) {
  const amount = Math.max(...managers.map(id => amounts[id]))
  const top = managers.filter(id => amounts[id] === amount)
  return { winner: top.length === 1 ? top[0] : top[Math.floor(random() * top.length)], amount, roulette: top.length > 1 }
}
export const OPEN_HAMMER_MS = 5_000
export const OPEN_TICK_MS = 500
export const OPEN_REVEAL_MS = 2_000
export const openMinimum = (leader: number | null, price: number) => leader === null ? 1 : price + 1
export function registerOpenBid<M extends { preco: number; lider: number | null; deadline: number | null; lances: { mgr: number; valor: number }[] }>(mesa: M, mgr: number, valor: number, now: number) {
  mesa.preco = valor; mesa.lider = mgr; mesa.lances.push({ mgr, valor }); mesa.deadline = now + OPEN_HAMMER_MS
}
export const DUTCH_HIGH_MS = 300, DUTCH_MIDDLE_MS = 1400, DUTCH_LOW_MS = 2000, DUTCH_LAST_MS = 3000
export function dutchStepMs(price: number, start: number) {
  if (price <= 1) return DUTCH_LAST_MS
  const fraction = price / Math.max(1, start)
  return fraction > .55 ? DUTCH_HIGH_MS : fraction > .22 ? DUTCH_MIDDLE_MS : DUTCH_LOW_MS
}

export function dutchNextPrice(price:number) { return Math.max(0,price-(price>60?10:price>50?5:price>30?4:price>20?3:price>14?2:1)) }
export function dutchLadder(start:number) { const result:number[]=[];let price=Math.max(1,Math.round(start));while(price>0){result.push(price);price=dutchNextPrice(price)}result.push(0);return result }
