import { STADIUM_SECTORS, STADIUM_EXTRAS, STADIUM_STEP, sectorPct, stadiumSeats, hasExtra, extraUnlocked, extraNovaOnly, sectorNome, extraNome, extraReq, type StadiumSave } from './estadiodata'
import { tr } from './lang' // 🌐 BR/EN (12/09): só os textos lidos; chaves e números iguais

/** Read-only presentation shared by future stadium/window renderers. Never grants assets. */
export function careerStadiumView(st: StadiumSave | undefined, agenciaOn: boolean) {
  const sectors = STADIUM_SECTORS.map(s => {
    const pct = sectorPct(st, s.k)
    const remaining = Math.max(0, s.cost - (st?.inv[s.k] ?? 0))
    return { key: s.k, name: sectorNome(s), pct, seats: Math.round(s.seats * pct / 100), maxSeats: s.seats,
      cost: s.cost, nextCost: pct >= 100 ? 0 : Math.min(STADIUM_STEP, remaining),
      status: pct >= 100 ? tr('Concluído', 'Finished') : pct > 0 ? tr('Em obras', 'Under construction') : tr('Não construído', 'Not built') }
  })
  const extras = STADIUM_EXTRAS.filter(e => agenciaOn || !extraNovaOnly(e.k)).map(e => ({
    key: e.k, name: extraNome(e), cost: e.cost, requirement: extraReq(e),
    owned: hasExtra(st, e.k), unlocked: extraUnlocked(st, e.k),
    status: hasExtra(st, e.k) ? tr('Construído', 'Built') : extraUnlocked(st, e.k) ? tr('Disponível para construir', 'Available to build') : tr('Bloqueado', 'Locked'),
  }))
  return { capacity: stadiumSeats(st), sectors, extras,
    // Geometry is determined by individual works, not division or stadium nickname.
    scene: { sectorPercent: Object.fromEntries(sectors.map(s => [s.key, s.pct])),
      builtExtras: STADIUM_EXTRAS.filter(e => hasExtra(st, e.k)).map(e => e.k),
      retractable: hasExtra(st, 'retratil') } }
}
