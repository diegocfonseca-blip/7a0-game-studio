import assert from 'node:assert/strict'
import {agendaLigaComplexo,agendaFasesComplexo,diasDasFasesCopaComplexo,diasDasFasesInternacionaisComplexo,jornadaDoComplexo} from '../src/escalacao/presidencia-complexo-jornada.ts'

const identity={seasonKey:'carreira-77:temporada-4',fixtureId:'partida-1',homeClubId:12}
const match={context:{id:'partida-1',homeClubId:12,speed:4,home:[],away:[]},minute:20,paused:false,finished:false,homeScore:1,awayScore:0}
const frozen=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))frozen(child)}return value}
let cases=0
const dateNow=Date.now,random=Math.random
Date.now=()=>{throw new Error('Calendar must not read wall-clock time')}
Math.random=()=>{throw new Error('Calendar must not consume random simulation state')}
try{
 // One season has 38 league days. Reopening a fixture, speed, scores, pause,
 // zoom/clock samples, and viewing it away cannot change its day or seed.
 for(let round=1;round<=38;round++){
  const agenda=agendaLigaComplexo({...identity,fixtureId:`liga-${round}`,round})
  assert(agenda)
  const input=frozen({agenda,match:{...match,context:{...match.context,id:`liga-${round}`}},stadiumClubId:12})
  const before=structuredClone(input),first=jornadaDoComplexo(input)
  assert.equal(first.ordinal,round)
  assert.equal(first.weekday,'domingo') // 🗓️ liga = sempre domingo 16h (Diego 25/10)
  assert.equal(first.period,'day')
  assert.equal(first.kickoffTime,'16:00')
  assert.equal(first.phase,'playing');assert.equal(first.hosting,true)
  assert.deepEqual(jornadaDoComplexo(input),first)
  assert.deepEqual(input,before)
  for(const speed of [.25,.5,1,2,4])for(const minute of [0,20,44,45,46,90,93]){
   const other=jornadaDoComplexo({...input,match:{...input.match,minute,paused:true,homeScore:8,context:{...input.match.context,speed}}})
   for(const key of ['key','variantSeed','ordinal','weekday','kickoffTime','period'])assert.equal(other[key],first[key])
   assert.equal(other.phase,minute===45?'interval':'playing');cases++
  }
  const away=jornadaDoComplexo({...input,stadiumClubId:99})
  assert.equal(away.hosting,false);assert.equal(away.phase,'idle');assert.equal(away.period,first.period)
 }
 const agenda=agendaLigaComplexo({...identity,round:2})
 assert(agenda)
 assert.equal(jornadaDoComplexo({agenda,phase:'arrival'}).phase,'arrival')
 assert.equal(jornadaDoComplexo({agenda}).phase,'idle','calendar alone is not evidence of fans arriving')
 assert.equal(jornadaDoComplexo({agenda,match,phase:'arrival'}).phase,'playing','stale pregame must not replace active play')
 assert.equal(jornadaDoComplexo({agenda,match,phase:'interval'}).phase,'playing','stale preview interval cannot replace actual minute 20')
 assert.equal(jornadaDoComplexo({agenda,match:{...match,finished:true},phase:'playing'}).phase,'departure')
 assert.equal(jornadaDoComplexo({agenda,match:{...match,context:{...match.context,id:'another'}}}).phase,'idle','another match must not animate this fixture')
 assert.equal(jornadaDoComplexo({agenda,match:{...match,context:{...match.context,homeClubId:99}}}).phase,'idle','conflicting home identity is not a hosted match')
 assert.equal(jornadaDoComplexo({agenda,stadiumClubId:99,phase:'arrival'}).phase,'idle')
 const unknown=jornadaDoComplexo({match})
 assert.equal(unknown.calendarKnown,false);assert.equal(unknown.period,undefined);assert.equal(unknown.weekday,undefined)
 assert.equal(unknown.kickoffTime,undefined,'unknown calendar must not invent a kickoff time')
 assert.equal(unknown.phase,'playing','a known match can be rendered while awaiting its calendar position')
 assert.equal(jornadaDoComplexo().phase,'idle');assert.equal(jornadaDoComplexo().hosting,false)
 for(const ordinal of [0,-1,1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){
  assert.equal(agendaLigaComplexo({...identity,round:ordinal}),undefined)
  assert.equal(jornadaDoComplexo({agenda:{...agenda,ordinal}}).calendarKnown,false)
 }
 for(const key of ['fixtureId','seasonKey'])assert.equal(agendaLigaComplexo({...identity,[key]:' ',round:1}),undefined)
 const nextSeason=jornadaDoComplexo({agenda:{...agenda,seasonKey:'carreira-77:temporada-5'}})
 assert.notEqual(nextSeason.key,jornadaDoComplexo({agenda}).key)
 assert.notEqual(nextSeason.variantSeed,jornadaDoComplexo({agenda}).variantSeed)
 assert.notEqual(jornadaDoComplexo({agenda:{...agenda,fixtureId:'partida-2'}}).variantSeed,nextSeason.variantSeed)

 // Copa starts after the 38 league slots. Each actual return leg is another
 // day; a single-leg final and a single-leg Supercopa do not leave phantom days.
 const cup=frozen([{ties:[{legs:[[1,0],[0,0]]},{legs:[[0,1],[2,1]]}]},{ties:[{legs:[[0,0],[1,0]]}]},{ties:[{legs:[[1,1],[1,0]]}]},{ties:[{legs:[[3,0]]}]},{ties:[{legs:[[1,0]]}]}])
 const cupBefore=structuredClone(cup),cupDays=diasDasFasesCopaComplexo(cup)
 assert.deepEqual(cupDays,[2,2,2,1,1]);assert.deepEqual(cup,cupBefore)
 let expected=39
 for(let phaseIndex=0;phaseIndex<cupDays.length;phaseIndex++)for(let legIndex=0;legIndex<cupDays[phaseIndex];legIndex++){
  const fixtureId=`copa-${phaseIndex}-${legIndex}`
  const day=agendaFasesComplexo({...identity,fixtureId,competition:'cup',previousMatchdays:38,phaseMatchdays:cupDays,phaseIndex,legIndex})
  assert.equal(day.ordinal,expected++)
  assert.equal(jornadaDoComplexo({agenda:day}).period,'night') // Copa = sempre quarta 21h
  assert.equal(jornadaDoComplexo({agenda:day}).kickoffTime,'21:00');cases++
 }
 assert.equal(expected,47)
 const daysWithBye=[2,0,2,1]
 assert.equal(agendaFasesComplexo({...identity,competition:'cup',previousMatchdays:38,phaseMatchdays:daysWithBye,phaseIndex:2,legIndex:0}).ordinal,41)
 assert.equal(agendaFasesComplexo({...identity,competition:'cup',previousMatchdays:38,phaseMatchdays:daysWithBye,phaseIndex:1,legIndex:0}),undefined)

 // Concurrent international competitions share calendar days. A Libertadores
 // bye still consumes the Champions matchday. A two-leg step consumes two,
 // never a separate day for every match in the phase.
 const league={matches:Array(18).fill({})},knockout={matches:Array(8).fill({}),ties:Array(4).fill({matches:[{},{}]})},final={matches:[{}],ties:[{matches:[{}]}]}
 const international=frozen([{champions:league,libertadores:league},{champions:league},{champions:knockout,libertadores:knockout},{champions:final,libertadores:final},{mundial:final}])
 const intlBefore=structuredClone(international),intlDays=diasDasFasesInternacionaisComplexo(international)
 assert.deepEqual(intlDays,[1,1,2,1,1]);assert.deepEqual(international,intlBefore)
 assert.equal(agendaFasesComplexo({...identity,competition:'libertadores',previousMatchdays:46,phaseMatchdays:intlDays,phaseIndex:2,legIndex:0}).ordinal,49)
 assert.equal(agendaFasesComplexo({...identity,competition:'libertadores',previousMatchdays:46,phaseMatchdays:intlDays,phaseIndex:2,legIndex:1}).ordinal,50)
 assert.equal(agendaFasesComplexo({...identity,competition:'mundial',previousMatchdays:46,phaseMatchdays:intlDays,phaseIndex:4,legIndex:0}).ordinal,52)
 const phaseBase={...identity,competition:'cup',previousMatchdays:38,phaseMatchdays:[2,2,1],phaseIndex:0,legIndex:0}
 for(const patch of [{previousMatchdays:NaN},{previousMatchdays:-1},{previousMatchdays:undefined},{phaseIndex:-1},{phaseIndex:3},{legIndex:-1},{legIndex:2},{phaseMatchdays:[NaN]},{phaseMatchdays:[-1]},{phaseMatchdays:[1.5]},{previousMatchdays:Number.MAX_SAFE_INTEGER}])assert.equal(agendaFasesComplexo({...phaseBase,...patch}),undefined)
 assert.equal(agendaFasesComplexo({...phaseBase,phaseMatchdays:[2,NaN]}).ordinal,39,'unknown future phases must not leak or invalidate present calendar')
 // Identity is tuple encoded, so delimiter characters cannot collide.
 assert.notEqual(jornadaDoComplexo({agenda:{...agenda,seasonKey:'a:b',competition:'c'}}).key,jornadaDoComplexo({agenda:{...agenda,seasonKey:'a',competition:'b:c'}}).key)
}finally{Date.now=dateNow;Math.random=random}
console.log(`PASS jornada: ${cases} clock/speed/phase cases; Wednesday 21:00 night / Sunday 16:00 day; Copa legs and simultaneous international steps; no dates, RNG, save mutation or result changes.`)
