import assert from 'node:assert/strict'
import { distribuirFluxoComplexo } from '../src/escalacao/presidencia-complexo-fluxo.ts'
let cases=0
for(const mode of ['off','career','qa-sample'])for(const enabled of [false,true])
for(const demand of [0,1,2,3,4,5,6,100,NaN])for(const station of [false,true])for(const parking of [false,true])
for(const visitors of [false,true])for(const seats of [false,true]){
 const input={mode,enabled,home:{outside:demand,cars:demand,playing:true},away:visitors?{outside:demand,cars:1,playing:true}:undefined,
  visits:{home:Number(seats),away:Number(seats)},station,parking,destinations:3}
 const before=structuredClone(input), result=distribuirFluxoComplexo(input)
 assert.deepEqual(input,before)
 for(const side of ['home','away','cars'])assert(result.used[side]<=result.budget[side])
 assert.equal(result.used.home,result.visits.home+result.pedestrians+result.fans.home+result.transport.busPassengers+result.transport.parkingPassengers)
 assert.equal(result.used.away,result.visits.away+result.fans.away+result.transport.metroPassengers)
 assert.equal(result.used.cars,result.streetCars+result.transport.cars)
 if(!station)assert.equal(result.transport.metroPassengers,0)
 if(!parking){assert.equal(result.transport.parkingPassengers,0);assert.equal(result.transport.cars,0)}
 if(!enabled||mode==='off')assert.deepEqual(result.used,{home:0,away:0,cars:0})
 if(mode==='career'&&!visitors)assert.equal(result.used.away,0)
 if(result.visits.home)assert.equal(result.fans.home,0)
 if(result.visits.away)assert.equal(result.fans.away,0)
 cases++
}
const base={mode:'career',enabled:true,home:{outside:1,cars:1,playing:true},visits:{home:1,away:0},station:true,parking:true,destinations:3}
const quiet=distribuirFluxoComplexo(base)
assert.equal(quiet.used.home,1);assert.equal(quiet.transport.busPassengers,0);assert.equal(quiet.transport.parkingPassengers,0);assert.equal(quiet.pedestrians,0)
const complete=distribuirFluxoComplexo({...base,home:{outside:6,cars:4,playing:true},away:{outside:3,cars:1,playing:true},visits:{home:1,away:1}})
assert.equal(complete.pedestrians,3)
assert.deepEqual(complete.transport,{metroPassengers:1,busPassengers:1,parkingPassengers:1,cars:1})
assert.equal(distribuirFluxoComplexo({...base,mode:'qa-sample',destinations:0}).pedestrians,0)
// A smaller demand cannot erase people outside a vehicle mid-journey.
const retained={metroPassengers:1,busPassengers:1,parkingPassengers:1,cars:1}
for(const outside of [0,1,2,3,6]){
 const demand=distribuirFluxoComplexo({...base,home:{outside,cars:0,playing:true},retainedTransport:retained})
 assert.deepEqual(demand.transport,retained)
 for(const side of ['home','away','cars'])assert(demand.used[side]<=demand.budget[side]+demand.draining[side])
 if(outside<=2){assert.equal(demand.visits.home,0);assert.equal(demand.pedestrians,0)}
 assert.equal(demand.draining.home,Math.max(0,2-outside))
 assert.equal(demand.draining.away,1);assert.equal(demand.draining.cars,1)
}
const yielded=distribuirFluxoComplexo({...base,home:{outside:2,cars:1,playing:true},retainedTransport:{...retained,metroPassengers:0,parkingPassengers:0}})
assert.equal(yielded.visits.home,1);assert.equal(yielded.used.home,2);assert.equal(yielded.draining.home,0)
assert.deepEqual(distribuirFluxoComplexo({...base,mode:'off',retainedTransport:retained}).used,{home:0,away:0,cars:0})

// A transported seat visit is a role of the existing passenger, not a second
// person. Count bodies independently from the allocator's used totals.
let integratedCases=0
const journey=(phase,key='rodada-1')=>({key,phase,variantSeed:19})
const emptyTransport={metroPassengers:0,busPassengers:0,parkingPassengers:0,cars:0}
const integratedBase={...base,transportSeats:true,journey:journey('playing')}
function checkIntegrated(input){
 const before=structuredClone(input),result=distribuirFluxoComplexo(input)
 assert.deepEqual(input,before,'alocação integrada não altera dados da carreira')
 const transported={
  home:result.transport.busPassengers+result.transport.parkingPassengers+(result.metroSide==='home'?result.transport.metroPassengers:0),
  away:result.metroSide==='away'?result.transport.metroPassengers:0,
 }
 for(const side of ['home','away']){
  const bodies=transported[side]+result.visits[side]+result.fans[side]+(side==='home'?result.pedestrians:0)
  assert.equal(result.used[side],bodies,`${side}: passageiro sentado não conta novamente como visita`)
  assert(result.transportVisits[side]<=transported[side],`${side}: visita exige passageiro real`)
  assert(result.transportVisits[side]<=Number(input.visits[side]>0),`${side}: sem acesso comprado não há assento animado`)
  assert(result.visits[side]+result.transportVisits[side]<=1,`${side}: só um corpo usa o acesso animado`)
  if(result.transportVisits[side]||result.visits[side])assert.equal(result.fans[side],0,`${side}: não cria outro corpo parado no mesmo acesso`)
 }
 assert.equal(result.used.cars,result.transport.cars+result.streetCars)
 for(const side of ['home','away','cars']){
  assert(Number.isInteger(result.used[side])&&result.used[side]>=0)
  assert(result.used[side]<=result.budget[side]+result.draining[side],`${side}: conserva orçamento incluindo quem está retornando`)
 }
 if(!input.station)assert.equal(result.transport.metroPassengers,0)
 if(!input.parking){assert.equal(result.transport.parkingPassengers,0);assert.equal(result.transport.cars,0)}
 if(!input.enabled||input.mode==='off'){
  assert.deepEqual(result.used,{home:0,away:0,cars:0})
  assert.deepEqual(result.transportVisits,{home:0,away:0})
 }
 if(input.mode==='career'&&!input.away&&!input.retainedTransport)assert.equal(result.used.away,0,'sem dado visitante não fabrica torcida')
 integratedCases++
 return result
}
for(const mode of ['off','career','qa-sample'])for(const enabled of [false,true])
for(const demand of [0,1,2,6,100,NaN])for(const metroSide of ['home','away'])
for(const station of [false,true])for(const parking of [false,true])
for(const visitors of [false,true])for(const seats of [false,true]){
 checkIntegrated({...integratedBase,mode,enabled,metroSide,station,parking,
  home:{outside:demand,cars:demand,playing:true},away:visitors?{outside:demand,cars:1,playing:true}:undefined,
  visits:{home:Number(seats),away:Number(seats)}})
}

// The one available supporter can arrive by bus or metro and use one actual
// seat allocation. The independent visit must not consume their only slot.
for(const [station,metroSide,vehicle] of [[false,'away','busPassengers'],[true,'away','busPassengers'],[true,'home','metroPassengers']]){
 const one=checkIntegrated({...integratedBase,station,metroSide})
 assert.equal(one.used.home,1)
 assert.equal(one.transport[vehicle],1)
 assert.equal(one.transportVisits.home,1)
 assert.equal(one.visits.home,0)
 assert.equal(one.pedestrians,0)
 assert.equal(one.transport.busPassengers+one.transport.metroPassengers+one.transport.parkingPassengers,1)
 const noSeat=checkIntegrated({...integratedBase,station,metroSide,visits:{home:0,away:0}})
 assert.deepEqual(noSeat.transport,one.transport,'várzea mantém passageiro mesmo sem cadeira')
 assert.deepEqual(noSeat.transportVisits,{home:0,away:0})
}
for(const metroSide of ['home','away']){
 const noAway=checkIntegrated({...integratedBase,metroSide,visits:{home:1,away:1}})
 assert.equal(noAway.used.away,0)
 assert.equal(noAway.transportVisits.away,0)
 assert.equal(noAway.visits.away,0)
 const inactiveAway=checkIntegrated({...integratedBase,metroSide,away:{outside:6,cars:1,playing:false},visits:{home:1,away:1}})
 assert.equal(inactiveAway.used.away,0,'torcida visitante sem jogo não vira demanda de transporte')
}
const visitingOnly=checkIntegrated({...integratedBase,home:{outside:0,cars:0,playing:true},away:{outside:1,cars:0,playing:true},
 metroSide:'away',visits:{home:0,away:1}})
assert.equal(visitingOnly.used.away,1)
assert.equal(visitingOnly.transport.metroPassengers,1)
assert.equal(visitingOnly.transportVisits.away,1)
assert.equal(visitingOnly.visits.away,0)
const visitingWithoutMetro=checkIntegrated({...integratedBase,station:false,home:{outside:0,cars:0,playing:true},away:{outside:1,cars:0,playing:true},visits:{home:0,away:1}})
assert.equal(visitingWithoutMetro.visits.away,1,'sem serviço visitante, preserva a visita pedonal')
assert.equal(visitingWithoutMetro.transportVisits.away,0)

// A request for another team does not reassign the passenger already inside
// the train. Once origin releases that body, the requested side becomes valid.
for(const retainedMetroSide of ['home','away'])for(const phase of ['arrival','playing','interval','departure']){
 const metroSide=retainedMetroSide==='home'?'away':'home'
 const retainedOnlyMetro={...emptyTransport,metroPassengers:1}
 const input={...integratedBase,metroSide,retainedMetroSide,journey:journey(phase),home:{outside:0,cars:0,playing:true},
  away:undefined,visits:{home:1,away:1},retainedTransport:retainedOnlyMetro}
 const inTransit=checkIntegrated(input)
 assert.equal(inTransit.metroSide,retainedMetroSide)
 assert.equal(inTransit.used[retainedMetroSide],1)
 assert.equal(inTransit.draining[retainedMetroSide],1)
 assert.equal(inTransit.used[metroSide],0)
 assert.equal(inTransit.transportVisits[retainedMetroSide],1)
 const returned=checkIntegrated({...input,retainedTransport:emptyTransport,journey:journey('arrival','rodada-2')})
 assert.equal(returned.metroSide,metroSide)
 assert.deepEqual(returned.used,{home:0,away:0,cars:0})
 assert.deepEqual(returned.transportVisits,{home:0,away:0})
}

// Reduced demand keeps already travelling bodies in a separate draining
// budget; remaining seats/customers cannot spend those same slots again.
for(const metroSide of ['home','away'])for(const outside of [0,1,2,3,6]){
 const input={...integratedBase,metroSide,retainedMetroSide:metroSide,home:{outside,cars:0,playing:true},
  away:{outside:0,cars:0,playing:true},visits:{home:1,away:1},retainedTransport:retained}
 const draining=checkIntegrated(input)
 assert.deepEqual(draining.transport,retained)
 assert.equal(draining.draining.home,Math.max(0,(metroSide==='home'?3:2)-outside))
 assert.equal(draining.draining.away,metroSide==='away'?1:0)
 assert.equal(draining.draining.cars,1)
 if(outside<=(metroSide==='home'?3:2)){assert.equal(draining.visits.home,0);assert.equal(draining.pedestrians,0)}
}

// After the whistle, returning passengers release real vehicles at origin.
// Their reserved slots cannot immediately respawn as new shop/gate bodies.
for(const metroSide of ['home','away']){
 const input={...integratedBase,metroSide,retainedMetroSide:metroSide,journey:journey('departure'),
  home:{outside:6,cars:4,playing:true},away:{outside:2,cars:0,playing:true},visits:{home:1,away:1}}
 const beforeReturn=checkIntegrated({...input,retainedTransport:retained})
 const afterReturn=checkIntegrated({...input,retainedTransport:{...emptyTransport,cars:1}})
 for(const key of ['used','transport','visits','transportVisits','pedestrians','fans','streetCars']){
  assert.deepEqual(afterReturn[key],beforeReturn[key],`${metroSide}/${key}: saída não renasce outro corpo na amostra`)
 }
 assert.deepEqual(afterReturn.reservedTransport,{metroPassengers:1,busPassengers:1,parkingPassengers:1,cars:0})
 assert.deepEqual(beforeReturn.reservedTransport,emptyTransport)
}
console.log(`PASS fluxo: ${cases} combinações legadas e ${integratedCases} integradas; passageiro/assento com uma identidade, lado do metrô retido até a origem, demanda ausente, reservas de saída e imutabilidade.`)
