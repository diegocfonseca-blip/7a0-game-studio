import type { JornadaComplexo } from './presidencia-complexo-jornada'

export type JornadaMovimentoComplexo = Pick<JornadaComplexo, 'key' | 'phase' | 'variantSeed'>
const clean = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1e10, value)) : 0
const staying = (journey: JornadaMovimentoComplexo | undefined) => !!journey && ['arrival', 'playing', 'interval'].includes(journey.phase)

/** A visual journey keeps its existing physical speed and route. The match
 * phase only decides when the person can leave the destination. A new fixture
 * waits for the old route to reach its origin instead of replacing the body. */
export function criarRelogioJornadaComplexo(options: {
  id: string; period: number; holdAt: number; initialOffset?: number; journey?: JornadaMovimentoComplexo
}) {
  const period = Math.max(.001, clean(options.period)), holdAt = Math.min(period - .000001, clean(options.holdAt))
  let requested = options.journey ? { ...options.journey } : undefined
  let active = requested ? { ...requested } : undefined
  let seconds = 0, local = options.journey ? 0 : clean(options.initialOffset ?? 0), completed = false, holding = false
  const delayFor = (journey: JornadaMovimentoComplexo | undefined) => {
    if (!journey) return 0
    let seed = journey.variantSeed >>> 0
    for (const character of options.id) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
    return (seed % 800) / 100
  }
  let delay = delayFor(active)
  function configure(journey: JornadaMovimentoComplexo | undefined) {
    requested = journey ? { ...journey } : undefined
    if (!active && requested) {
      // Attaching a calendar to an already visible QA walker cannot restart it.
      local %= period; delay = 0; completed = false
      active = local <= holdAt ? { ...requested } : { ...requested, key: '__previous-walk__' }
    } else if (active?.key === requested?.key) active = requested ? { ...requested } : undefined
  }
  function update(time: number, originBlocked=false, finishAtOrigin=false) {
    const next = clean(time)
    // Legacy QA without a match keeps its seekable, uninterrupted walkthrough.
    if (!active && !requested) { seconds = next; local = next + clean(options.initialOffset ?? 0); holding = false; completed = false; return local }
    if (next < seconds) {
      // Explicit QA seek is the only reset; normal live phase changes never do it.
      active = requested ? { ...requested } : undefined; local = 0; delay = delayFor(active); completed = false; seconds = 0
    }
    let remaining = next - seconds
    seconds = next; holding = false
    for (let guard = 0; guard < 3; guard++) {
      if (!active) { active = requested ? { ...requested } : undefined; local = 0; delay = delayFor(active); completed = false }
      if (delay > 0) { const consumed = Math.min(delay, remaining); delay -= consumed; remaining -= consumed }
      if (remaining <= 0) break
      // Another physical group owns the corridor. Wait at the origin only;
      // never freeze an existing walk on a staircase or release a seated fan.
      if(originBlocked&&local<=1e-7)break
      const sameFixture = active?.key === requested?.key
      if (sameFixture && staying(active) && local <= holdAt + 1e-7) {
        local = Math.min(holdAt, local + remaining); holding = local >= holdAt; remaining = 0; break
      }
      const advance = Math.min(remaining, Math.max(0, period - local))
      local += advance; remaining -= advance
      if (local < period - 1e-7) break
      completed = true
      if (sameFixture || !requested || finishAtOrigin) { local = period - 1e-7; remaining = 0; break }
      if(originBlocked){local=period-1e-7;remaining=0;break}
      // Both ends of every registered loop are the same measured resting pose.
      active = { ...requested }; local = 0; delay = delayFor(active); completed = false
    }
    return local
  }
  return { update, configure, inspect: () => ({ key: active?.key, requestedKey: requested?.key, phase: requested?.phase,
    seconds, localSeconds: local, holding, completed, departureDelay: delay }) }
}
