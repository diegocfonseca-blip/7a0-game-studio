import { STADIUM_SECTORS, STADIUM_EXTRAS, STADIUM_STEP, sectorPct, stadiumSeats, hasExtra, extraUnlocked, extraNovaOnly, type StadiumSave } from './estadiodata'

/** Read-only presentation shared by future stadium/window renderers. Never grants assets. */
export function careerStadiumView(st: StadiumSave | undefined, agenciaOn: boolean) {
  const sectors = STADIUM_SECTORS.map(s => {
    const pct = sectorPct(st, s.k)
    const remaining = Math.max(0, s.cost - (st?.inv[s.k] ?? 0))
    return { key: s.k, name: s.n, pct, seats: Math.round(s.seats * pct / 100), maxSeats: s.seats,
      cost: s.cost, nextCost: pct >= 100 ? 0 : Math.min(STADIUM_STEP, remaining),
      status: pct >= 100 ? 'Concluído' : pct > 0 ? 'Em obras' : 'Não construído' }
  })
  const extras = STADIUM_EXTRAS.filter(e => agenciaOn || !extraNovaOnly(e.k)).map(e => ({
    key: e.k, name: e.n, cost: e.cost, requirement: e.reqTxt,
    owned: hasExtra(st, e.k), unlocked: extraUnlocked(st, e.k),
    status: hasExtra(st, e.k) ? 'Construído' : extraUnlocked(st, e.k) ? 'Disponível para construir' : 'Bloqueado',
  }))
  return { capacity: stadiumSeats(st), sectors, extras,
    // Geometry is determined by individual works, not division or stadium nickname.
    scene: { sectorPercent: Object.fromEntries(sectors.map(s => [s.key, s.pct])),
      builtExtras: STADIUM_EXTRAS.filter(e => hasExtra(st, e.k)).map(e => e.k),
      retractable: hasExtra(st, 'retratil') } }
}
