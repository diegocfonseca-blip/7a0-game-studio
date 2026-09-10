type Offer = { mgr: number; amount: number }

// Presentation only: never mutate the resolved auction or select a new winner.
export function revealOffers<T extends Offer>(offers: T[], voided: number[], winner: number | null, confirmed: boolean): T[] {
  return [...offers].sort((a, b) => {
    if (confirmed && winner !== null && (a.mgr === winner || b.mgr === winner)) return a.mgr === winner ? -1 : 1
    const invalid = Number(voided.includes(a.mgr)) - Number(voided.includes(b.mgr))
    return invalid || b.amount - a.amount
  })
}

export function revealIdentityVisible(surprise: boolean, confirmed: boolean, sold: boolean) {
  return !surprise || (confirmed && sold)
}

