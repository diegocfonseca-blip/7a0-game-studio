import assert from 'node:assert/strict'
import {reducer} from '../src/escalacao/store'
import {footballTestState} from './football-test-state'
import {FOOTBALL_LOCAL_ORDER,DEFAULT_FOOTBALL_PLAN,publishFootballClock,footballContributions,mergeFootballFuture} from '../src/escalacao/football-live-tactics'
import {acaoRemotaDaSalaPermitida} from '../src/escalacao/online-acoes-locais'
const base=footballTestState(),you=base.managers[base.youIdx]
const old=base.lastResults.find(r=>r.homeId===you.id||r.awayId===you.id)!
assert(old,'match exists')
const action={type:'FOOTBALL_LIVE_PLAN' as const,mgrId:you.id,plan:{...DEFAULT_FOOTBALL_PLAN,posture:'ataque' as const,pressure:'high' as const},by:base.youUid!,requestId:'test-order',round:base.round,localProof:FOOTBALL_LOCAL_ORDER}
const time=(minute=30,at=Date.now())=>publishFootballClock({room:base.roomId!,round:base.round,minute,at})
time()
const next=reducer(base,action),r=next.lastResults.find(r=>r.homeId===old.homeId&&r.awayId===old.awayId)!
assert.equal(r.footballLive?.revision,1,'host order applied')
assert.deepEqual(r.highlights.filter(h=>h.min<=33),old.highlights.filter(h=>h.min<=33),'all seen events and current shot remain identical')
assert.equal(next.round,base.round,'no round restart');assert.equal(next.rodadaEm?.at,base.rodadaEm?.at,'no clock restart');assert.equal(next.simSpeed,base.simSpeed,'no speed change')
assert.deepEqual(reducer(base,action),next,'deterministic replay')
assert.deepEqual(reducer(next,action),next,'duplicate order idempotent')
assert.deepEqual(reducer(base,{...action,localProof:Symbol()}),base,'wrong local proof rejected')
assert.deepEqual(reducer(base,{...action,round:base.round-1}),base,'stale round rejected')
assert.deepEqual(reducer(base,{...action,by:'other'}),base,'other identity rejected')
for(const patch of [{isHost:false},{youUid:'other'},{sport:'basquete'},{careerOnline:true},{seatUids:['unapproved']},{quickCopa:{}}])assert.deepEqual(reducer({...base,...patch} as never,action),{...base,...patch},JSON.stringify(patch))
time(31,Date.now()-8000);assert.deepEqual(reducer(base,action),base,'stale clock rejected')
time(89);assert.deepEqual(reducer(base,action),base,'finished match rejected')
time(32)
assert(!acaoRemotaDaSalaPermitida('FOOTBALL_LIVE_PLAN'),'wire cannot inject local command')
const wire=JSON.parse(JSON.stringify(action));assert.deepEqual(reducer(base,wire),base,'JSON loses local proof')
// Reconstruct expected table from untouched pre-round rows, replacing only this result.
for(const id of [old.homeId,old.awayId]){
 const a=base.league.find(t=>t.id===id)!,b=next.league.find(t=>t.id===id)!,home=id===old.homeId
 const oldFor=home?old.hg:old.ag,oldAgainst=home?old.ag:old.hg,newFor=home?r.hg:r.ag,newAgainst=home?r.ag:r.hg
 assert.equal(b.gf,a.gf-oldFor+newFor);assert.equal(b.ga,a.ga-oldAgainst+newAgainst)
 for(const [field,fn] of [['pts',(f:number,a:number)=>f>a?3:f===a?1:0],['w',(f:number,a:number)=>+(f>a)],['d',(f:number,a:number)=>+(f===a)],['l',(f:number,a:number)=>+(f<a)]] as const)assert.equal(b[field],a[field]-fn(oldFor,oldAgainst)+fn(newFor,newAgainst),field)
}
assert.deepEqual(next.lastResults.filter(x=>x!==r),base.lastResults.filter(x=>x!==old),'other matches unchanged')
const sums=(rows:any[],key:string)=>rows.reduce((v,x)=>v+x[key],0)
const oldC=footballContributions(base,old),newC=footballContributions(next,r)
assert.equal(sums(next.scorers,'goals'),sums(base.scorers,'goals')-sums(oldC.s,'goals')+sums(newC.s,'goals'))
assert.equal(sums(next.assists??[],'assists'),sums(base.assists??[],'assists')-sums(oldC.a,'assists')+sums(newC.a,'assists'))
for(let i=0;i<40;i++){
 const s=footballTestState();s.seed+=i;time(10+i)
 const before=s.lastResults.find(x=>x.homeId===you.id||x.awayId===you.id)!
 const n=reducer(s,{...action,requestId:`seed-${i}`}),m=n.lastResults.find(x=>x.homeId===before.homeId&&x.awayId===before.awayId)!
 assert.equal(m.footballLive?.revision,1);assert.deepEqual(m.highlights.filter(h=>h.min<=13+i),before.highlights.filter(h=>h.min<=13+i))
}
// An explicit neutral plan consumes no extra RNG and keeps the baseline results identical.
const neutral=reducer({...base,footballPlans:{[you.id]:DEFAULT_FOOTBALL_PLAN}},{type:'PLAY_ROUND'})
const baseline=reducer(base,{type:'PLAY_ROUND'})
assert.deepEqual(neutral.lastResults,baseline.lastResults,'neutral plan preserves legacy RNG/results')
let changedByPressure=0
for(let seed=1;seed<=80;seed++){
 const a=reducer({...base,seed,footballPlans:{[you.id]:DEFAULT_FOOTBALL_PLAN}},{type:'PLAY_ROUND'})
 const b=reducer({...base,seed,footballPlans:{[you.id]:{...DEFAULT_FOOTBALL_PLAN,pressure:'high'}}},{type:'PLAY_ROUND'})
 const own=(s:typeof base)=>s.lastResults.find(r=>r.homeId===you.id||r.awayId===you.id)
 if(JSON.stringify(own(a))!==JSON.stringify(own(b)))changedByPressure++
}
assert(changedByPressure>0,'pressure really influences simulation under identical seeds')
time(35)
assert.deepEqual(reducer(base,{...action,plan:{...action.plan,mark:'not-a-player'}}),base,'unknown marking target rejected')
let many=base
for(let n=0;n<16;n++)many=reducer(many,{...action,requestId:`order-${n}`,plan:{...action.plan,pressure:n%2?'normal':'high'}})
assert.equal(many.lastResults.find(r=>r.homeId===you.id||r.awayId===you.id)?.footballLive?.orders.length,16)
assert.deepEqual(reducer(many,{...action,requestId:'over-limit'}),many,'maximum orders enforced')
console.log('PASS: private host gate, 40 continuations, 80 paired pressure simulations, neutral legacy RNG, immutable past, table, goals+assists, unchanged clocks, other matches, max16, duplicate/stale/wire rejection.')
