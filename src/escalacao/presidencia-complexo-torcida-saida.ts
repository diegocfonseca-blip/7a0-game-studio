import * as THREE from 'three'
import type { AcessoAssentoComplexo } from './presidencia-complexo-arquitetura'
import type { EstadoComplexo } from './presidencia-complexo-model'
import type { JornadaMovimentoComplexo } from './presidencia-complexo-jornada-relogio'
import { criarCorpoVisitaComplexo, opcoesVisitaComplexo, roteiroVisitaComplexo, type PontoVisitaComplexo } from './presidencia-complexo-visita'

type Side = 'home' | 'away'
type State = 'seated' | 'leaving' | 'outside' | 'entering'
type Configuration = { journey?: JornadaMovimentoComplexo; homeColor?: string; awayColor?: string; budget?: { home: number; away: number } }
export const LIMITE_SAIDA_TORCIDA_COMPLEXO = 6
const sides = ['home', 'away'] as const
const staying = (journey?: JornadaMovimentoComplexo) => !!journey && ['arrival', 'playing', 'interval'].includes(journey.phase)
const length = (a: PontoVisitaComplexo, b: PontoVisitaComplexo) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)

/** Cut only a flat, registered exterior lane. Each waiting person has their
 * own measured endpoint: later departures stop before earlier ones. */
function shorten(points: readonly PontoVisitaComplexo[], metres: number) {
  const result = points.map(point => ({ ...point }))
  let remaining = metres
  while (remaining > 1e-8 && result.length > 1) {
    const last = result.at(-1)!, before = result.at(-2)!, segment = length(before, last)
    if (Math.abs(before.y - .16) > .001 || Math.abs(last.y - .16) > .001) return undefined
    if (segment <= remaining) { result.pop(); remaining -= segment; continue }
    const t = (segment - remaining) / segment
    result[result.length - 1] = { x: before.x + (last.x - before.x) * t, y: before.y, z: before.z + (last.z - before.z) * t }
    remaining = 0
  }
  return remaining <= 1e-8 && result.length > 1 ? result : undefined
}

/** A deliberately bounded part of the crowd can leave using real stairways.
 * All other instanced fans stay put until their own physical routes exist.
 * The caller reserves these seats in the SAME crowd quota, and arbitrates the
 * shared corridor against transport passengers/visits. No clock or lifecycle
 * below creates, hides, fades or replaces a body at a fixture boundary. */
export function criarSaidaTorcidaComplexo(scene: THREE.Scene, options: Configuration & {
  state: EstadoComplexo
  accesses: readonly AcessoAssentoComplexo[]
  excludedSeatIds?: readonly string[]
  budget: { home: number; away: number }
}) {
  const root = new THREE.Group(); root.name = 'complexo-torcida-saida'; scene.add(root)
  const excluded = new Set(options.excludedSeatIds ?? []), used = new Set<string>()
  let configuration: Configuration = { journey: options.journey ? { ...options.journey } : undefined, homeColor: options.homeColor, awayColor: options.awayColor, budget: { ...options.budget } }
  const requestedColor = (side: Side) => configuration[side === 'home' ? 'homeColor' : 'awayColor'] ?? (side === 'home' ? '#1B7A3D' : '#C2452F')
  const actors = sides.flatMap(side => {
    const budget = Number.isFinite(options.budget[side]) ? Math.max(0, Math.min(LIMITE_SAIDA_TORCIDA_COMPLEXO / 2, Math.floor(options.budget[side]))) : 0
    const candidates = options.accesses.filter(access => access.side === side && !excluded.has(access.seatId))
      .sort((a, b) => a.seat.position.y - b.seat.position.y || a.seat.row - b.seat.row || a.seatId.localeCompare(b.seatId))
    const result = []
    for (const access of candidates) {
      if (result.length >= budget) break
      if (used.has(access.seatId)) continue
      const visit = opcoesVisitaComplexo(options.state, access)
      // opcoesVisita closes its loop with a cross-lane return to the inbound
      // origin. Waiting happens BEFORE that connector, on the outgoing lane.
      const outbound = shorten(visit.outbound!.slice(0, -1), result.length * 2.2)
      if (!outbound) continue
      const timeline = roteiroVisitaComplexo({ ...visit, inbound: [...outbound].reverse(), outbound, staySeconds: 5 })
      const seated = timeline.inspect().stages.find(stage => stage.phase === 'seated')
      if (timeline.problems.length || !seated) continue
      const id = `saida-${access.id}`, color = requestedColor(side)
      const body = criarCorpoVisitaComplexo(root, { id, side, color })
      const seatedAt = seated.at + seated.duration / 2, departureAt = seated.at + seated.duration
      const pose = timeline.at(seatedAt)!
      body.updatePose(pose,seatedAt); body.root.userData = { ...body.root.userData, seatId: access.seatId, source: 'reserved-seated-crowd' }
      result.push({ id, side, slot: result.length, seatId: access.seatId, body, timeline, seatedAt, departureAt,
        state: 'seated' as State, local: seatedAt, pose, color, journeyKey: options.journey?.key,
        endpoint: { ...outbound.at(-1)! }, departures: 0, arrivals: 0 })
      used.add(access.seatId)
    }
    return result
  })
  let disposed = false, seconds: number | undefined
  const eligible = (actor: typeof actors[number]) => {
    const quota = configuration.budget?.[actor.side]
    const sideCount = actors.filter(candidate => candidate.side === actor.side).length
    // Admit those nearest to the stairs first, without crossing people who
    // remain at the more distant waiting positions when the quota decreases.
    return typeof quota === 'number' && Number.isFinite(quota) && actor.slot >= sideCount - Math.max(0, Math.floor(quota))
  }
  const needsDeparture = (actor: typeof actors[number]) => !eligible(actor) || !!configuration.journey && (
    configuration.journey.key !== actor.journeyKey || ['departure', 'idle'].includes(configuration.journey.phase))
  const applyColor = (actor: typeof actors[number]) => {
    const value = requestedColor(actor.side)
    if (value !== actor.color) { actor.body.setColor(value); actor.color = value }
  }
  function configure(next: Configuration) {
    if (disposed) return
    configuration = { ...next, journey: next.journey ? { ...next.journey } : undefined,
      budget: next.budget ? { ...next.budget } : configuration.budget }
    for (const actor of actors) if (eligible(actor) && actor.journeyKey === next.journey?.key) applyColor(actor)
  }
  function update(time: number, control: { blockedSides?: { home?: boolean; away?: boolean } } = {}) {
    if (disposed || !Number.isFinite(time)) return
    const next = Math.max(seconds ?? 0, Math.max(0, time)), delta = seconds === undefined ? 0 : next - seconds
    seconds = next
    for (const side of sides) {
      let remaining = delta
      const cohort = actors.filter(actor => actor.side === side)
      for (let guard = 0; remaining > 1e-8 && guard < cohort.length * 4 + 1; guard++) {
        let actor = cohort.find(candidate => candidate.state === 'leaving' || candidate.state === 'entering')
        if (!actor) {
          if (control.blockedSides?.[side]) break
          actor = cohort.find(candidate => candidate.state === 'seated' && needsDeparture(candidate))
          if (actor) { actor.state = 'leaving'; actor.local = actor.departureAt; actor.departures++ }
          else if (staying(configuration.journey)) {
            // Finish all previous departures before reversing the shared lane.
            // Nearest exterior stop enters first, so nobody walks through a
            // waiting person on their way back to the staircase.
            actor = [...cohort].reverse().find(candidate => candidate.state === 'outside' && eligible(candidate))
            if (actor) { actor.state = 'entering'; actor.local = 0; actor.journeyKey = configuration.journey!.key; actor.arrivals++; applyColor(actor) }
          }
          if (!actor) break
        }
        const target = actor.state === 'leaving' ? actor.timeline.period - 1e-7 : actor.seatedAt
        const advance = Math.min(remaining, Math.max(0, target - actor.local))
        actor.local += advance; remaining -= advance
        actor.pose = actor.timeline.at(actor.local)!; actor.body.updatePose(actor.pose,actor.local)
        if (actor.local < target - 1e-8) break
        actor.state = actor.state === 'leaving' ? 'outside' : 'seated'
      }
    }
  }
  return {
    root, configure, update,
    reserveSeatIds: () => actors.map(actor => actor.seatId),
    inspect: () => ({ seconds: seconds ?? 0, requestedKey: configuration.journey?.key, phase: configuration.journey?.phase,
      limit: LIMITE_SAIDA_TORCIDA_COMPLEXO, total: actors.length, seated: actors.filter(actor => actor.state === 'seated').length,
      outside: actors.filter(actor => actor.state === 'outside').length,
      busySides: Object.fromEntries(sides.map(side => [side, actors.some(actor => actor.side === side && (actor.state === 'leaving' || actor.state === 'entering'))])) as Record<Side, boolean>,
      // Reserve the corridor before a new vehicle can open its doors. Existing
      // passengers already outside still finish their return before we start.
      returnPendingSides: Object.fromEntries(sides.map(side => [side, staying(configuration.journey) && actors.some(actor => actor.side === side && (
        actor.state === 'entering' || eligible(actor) && (actor.journeyKey !== configuration.journey!.key || actor.state === 'outside')))])) as Record<Side, boolean>,
      actors: actors.map(actor => ({ id: actor.id, rigId: actor.body.root.uuid, side: actor.side, seatId: actor.seatId,
        state: actor.state, eligible: eligible(actor), localSeconds: actor.local, journeyKey: actor.journeyKey, color: actor.color,
        departures: actor.departures, arrivals: actor.arrivals, endpoint: { ...actor.endpoint }, pose: structuredClone(actor.pose) })) }),
    dispose() { if (disposed) return; disposed = true; actors.forEach(actor => actor.body.dispose()); root.removeFromParent(); root.clear() },
  }
}
