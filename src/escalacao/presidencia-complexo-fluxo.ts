import type { JornadaMovimentoComplexo } from './presidencia-complexo-jornada-relogio'
/** One shared exterior sample. Public transport does not manufacture a crowd
 * or count the same person again as a shop customer and a gate visitor. */
type Demand = { outside: number; cars: number; playing: boolean }
type SideCounts = { home: number; away: number }
export type TransporteFluxoComplexo = { metroPassengers:number; busPassengers:number; parkingPassengers:number; cars:number }
export type OpcoesFluxoComplexo = {
  mode: 'off' | 'career' | 'qa-sample'
  enabled: boolean
  journey?: JornadaMovimentoComplexo
  home?: Demand
  away?: Demand
  visits: SideCounts
  station: boolean
  parking: boolean
  destinations: number
  /** Existing passengers finish their journey before yielding a sample slot. */
  retainedTransport?: TransporteFluxoComplexo
  /** A passenger with a physical seat route replaces the separate gate visit. */
  transportSeats?: boolean
  metroSide?: 'home' | 'away'
  /** The current passenger keeps its side until the service reaches origin. */
  retainedMetroSide?: 'home' | 'away'
}
const count = (value: number | undefined, limit: number) => Number.isFinite(value) ? Math.max(0, Math.min(limit, Math.floor(value!))) : 0
export function distribuirFluxoComplexo(input: OpcoesFluxoComplexo) {
  if(input.transportSeats)return distribuirFluxoIntegrado(input)
  const active = input.enabled && input.mode !== 'off'
  const qa = active && input.mode === 'qa-sample'
  const budget = {
    home: active ? qa ? 6 : count(input.home?.outside, 6) : 0,
    away: active ? qa ? 2 : input.away?.playing ? count(input.away.outside, 6) : 0 : 0,
    cars: active ? qa ? 2 : count(input.home?.cars, 4) : 0,
  }
  const effective = active ? input.retainedTransport : undefined
  const desiredVisits = { home: Math.min(budget.home, count(input.visits.home, 1)), away: Math.min(budget.away, count(input.visits.away, 1)) }
  let home = budget.home - desiredVisits.home, away = budget.away - desiredVisits.away
  // A finished fixture does not turn its departing passenger into a new shop
  // customer or gate fan. Keep those visual slots reserved until the next
  // fixture; this also keeps the surviving street actors and their rigs stable.
  const reservedParkingCars = input.parking ? Math.min(1, budget.cars) : 0
  const arrivalAllocation = { metroPassengers: input.station ? Math.min(1, away) : 0,
    busPassengers: Math.min(1, home), parkingPassengers: reservedParkingCars ? Math.min(1, Math.max(0, home - 1)) : 0, cars: reservedParkingCars }
  const reserveDeparture = active && input.journey?.phase === 'departure'
  const retained = reserveDeparture ? Object.fromEntries(Object.entries(arrivalAllocation).map(([key, value]) =>
    [key, Math.max(value, count(effective?.[key as keyof TransporteFluxoComplexo], 1))])) as TransporteFluxoComplexo : effective
  const parkingCars = input.parking ? retained ? count(retained.cars, 1) : Math.min(1, budget.cars) : 0
  const busPassengers = retained ? count(retained.busPassengers, 1) : Math.min(1, home); home -= busPassengers
  const parkingPassengers = parkingCars ? retained ? count(retained.parkingPassengers, 1) : Math.min(1, home) : 0; home -= parkingPassengers
  const metroPassengers = input.station ? retained ? count(retained.metroPassengers, 1) : Math.min(1, away) : 0; away -= metroPassengers
  // Desired allocation gives priority to a seat visit. Effective allocation
  // keeps people already travelling, then lends only the remaining slots.
  const visits = retained ? {
    home: Math.min(desiredVisits.home, Math.max(0, budget.home - busPassengers - parkingPassengers)),
    away: Math.min(desiredVisits.away, Math.max(0, budget.away - metroPassengers)),
  } : desiredVisits
  home = Math.max(0, budget.home - visits.home - busPassengers - parkingPassengers)
  away = Math.max(0, budget.away - visits.away - metroPassengers)
  const pedestrians = Math.min(3, count(input.destinations, 3), home); home -= pedestrians
  const fans = { home: visits.home ? 0 : Math.min(input.journey ? 1 : 3, home), away: visits.away ? 0 : Math.min(input.journey ? 1 : 2, away) }
  const streetCars = Math.max(0, Math.min(2, budget.cars - parkingCars))
  const used = { home: visits.home + busPassengers + parkingPassengers + pedestrians + fans.home,
    away: visits.away + metroPassengers + fans.away, cars: streetCars + parkingCars }
  const draining = { home: Math.max(0, busPassengers + parkingPassengers - budget.home),
    away: Math.max(0, metroPassengers - budget.away), cars: Math.max(0, parkingCars - budget.cars) }
  const reservedTransport = reserveDeparture ? Object.fromEntries(Object.entries(arrivalAllocation).map(([key, value]) =>
    [key, Math.max(0, value - count(effective?.[key as keyof TransporteFluxoComplexo], 1))])) as TransporteFluxoComplexo : undefined
  return { budget, used, draining, reservedTransport, journey: input.journey ? { ...input.journey } : undefined, visits, transportVisits:{home:0,away:0},metroSide:'away' as const, pedestrians, fans, streetCars,
    transport: { metroPassengers, busPassengers, parkingPassengers, cars: parkingCars } }
}

/** A transported supporter and its seat are one person. The legacy independent
 * walkthrough stays available when no service can carry that side's visitor. */
function distribuirFluxoIntegrado(input:OpcoesFluxoComplexo){
 const active=input.enabled&&input.mode!=='off',qa=active&&input.mode==='qa-sample'
 const budget={home:active?qa?6:count(input.home?.outside,6):0,
  away:active?qa?2:input.away?.playing?count(input.away.outside,6):0:0,
  cars:active?qa?2:count(input.home?.cars,4):0}
 const requestedSide=input.metroSide??'away'
 const effective=active?input.retainedTransport:undefined
 const metroSide=effective?.metroPassengers?input.retainedMetroSide??requestedSide:requestedSide
 const desiredCars=input.parking?Math.min(1,budget.cars):0
 const available={home:budget.home,away:budget.away}
 const desiredMetro=input.station?Math.min(1,available[metroSide]):0;available[metroSide]-=desiredMetro
 const desiredBus=Math.min(1,available.home);available.home-=desiredBus
 const desiredParking=desiredCars?Math.min(1,available.home):0
 const desired={metroPassengers:desiredMetro,busPassengers:desiredBus,parkingPassengers:desiredParking,cars:desiredCars}
 const leaving=active&&input.journey?.phase==='departure'
 const allocation=effective?Object.fromEntries(Object.entries(desired).map(([key,n])=>[key,
  leaving?Math.max(n,count(effective[key as keyof TransporteFluxoComplexo],1)):count(effective[key as keyof TransporteFluxoComplexo],1)])) as TransporteFluxoComplexo:desired
 const transport={metroPassengers:input.station?allocation.metroPassengers:0,busPassengers:allocation.busPassengers,
  parkingPassengers:input.parking?allocation.parkingPassengers:0,cars:input.parking?allocation.cars:0}
 const passengers={home:transport.busPassengers+transport.parkingPassengers+(metroSide==='home'?transport.metroPassengers:0),
  away:metroSide==='away'?transport.metroPassengers:0}
 const transportVisits={home:Math.min(count(input.visits.home,1),passengers.home),away:Math.min(count(input.visits.away,1),passengers.away)}
 const left={home:Math.max(0,budget.home-passengers.home),away:Math.max(0,budget.away-passengers.away)}
 const visits={home:transportVisits.home?0:Math.min(count(input.visits.home,1),left.home),away:transportVisits.away?0:Math.min(count(input.visits.away,1),left.away)}
 left.home-=visits.home;left.away-=visits.away
 const pedestrians=Math.min(3,count(input.destinations,3),left.home);left.home-=pedestrians
 const fans={home:visits.home||transportVisits.home?0:Math.min(input.journey?1:3,left.home),away:visits.away||transportVisits.away?0:Math.min(input.journey?1:2,left.away)}
 const streetCars=Math.max(0,Math.min(2,budget.cars-transport.cars))
 const used={home:passengers.home+visits.home+pedestrians+fans.home,away:passengers.away+visits.away+fans.away,cars:transport.cars+streetCars}
 const draining={home:Math.max(0,passengers.home-budget.home),away:Math.max(0,passengers.away-budget.away),cars:Math.max(0,transport.cars-budget.cars)}
 const reservedTransport=leaving?Object.fromEntries(Object.entries(desired).map(([key,n])=>[key,Math.max(0,n-count(effective?.[key as keyof TransporteFluxoComplexo],1))])) as TransporteFluxoComplexo:undefined
 return{budget,used,draining,reservedTransport,journey:input.journey?{...input.journey}:undefined,visits,transportVisits,metroSide,pedestrians,fans,streetCars,transport}
}
