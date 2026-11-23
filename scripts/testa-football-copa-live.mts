import assert from 'node:assert/strict'
import {reducer} from '../src/escalacao/store'
import {footballTestState} from './football-test-state'
import {DEFAULT_FOOTBALL_PLAN,FOOTBALL_LOCAL_ORDER,publishFootballClock,footballClockContext,quickFootballMatch,planFor} from '../src/escalacao/football-live-tactics'
const canonical=(s:unknown)=>JSON.parse(JSON.stringify(s))
let checks=0
for(const final of [false,true])for(let sample=0;sample<12;sample++){
 let base=footballTestState('cup');base.seed+=sample
 const you=base.managers[base.youIdx]
 if(final){
  const tie=base.quickCopa!.ties.find(t=>t.aId===you.id||t.bId===you.id)!
  base.quickCopa={...base.quickCopa!,phase:'final',legIdx:0,ties:[{...tie,legs:[],lastHighlights:[],lastFootballLive:undefined,winner:null,pens:undefined,pensSeq:undefined}]}
  base=reducer(base,{type:'PLAY_COPA_LEG'})
 }
 base=canonical(base)
 const old=quickFootballMatch(base,you.id)!,context=footballClockContext(base)
 assert(old)
 publishFootballClock({room:base.roomId!,round:base.round,minute:30,at:Date.now(),context})
 const plan={...DEFAULT_FOOTBALL_PLAN,posture:'ataque' as const,pressure:'high' as const}
 const action={type:'FOOTBALL_LIVE_PLAN' as const,mgrId:you.id,plan,by:base.youUid!,requestId:`cup-${final}-${sample}`,round:base.round,cupContext:context,localProof:FOOTBALL_LOCAL_ORDER}
 const next=reducer(base,action),match=quickFootballMatch(next,you.id)!
 assert.equal(match.footballLive?.revision,1,'cup order accepted');checks++
 assert.deepEqual(match.highlights.filter(h=>h.min<=33),old.highlights.filter(h=>h.min<=33),'shown goals and assists remain immutable');checks++
 for(const key of ['league','scorers','assists','lastResults','round','rodadaEm','simSpeed'] as const){assert.deepEqual(next[key],base[key],`${key} of the league is unaffected`);checks++}
 const tie=next.quickCopa!.ties.find(t=>t.aId===you.id||t.bId===you.id)!
 const aHome=next.quickCopa!.legIdx%2===0
 assert.deepEqual(tie.legs.at(-1),aHome?[match.hg,match.ag]:[match.ag,match.hg],'leg score agrees with displayed result');checks++
 assert.deepEqual(canonical(reducer(next,action)),canonical(next),'order is idempotent');checks++
 assert.deepEqual(reducer(base,{...action,cupContext:'old-round'}),base,'late prior-stage action is rejected');checks++
 assert.deepEqual(planFor(next,you.id),plan,'accepted choice persists');checks++
 if(final){
  const [a,b]=tie.legs[0]
  assert.equal(tie.winner,a>b?tie.aId:b>a?tie.bId:tie.pens![0]>tie.pens![1]?tie.aId:tie.bId,'winner/penalties agree after continuation');checks++
 }else{
  const second=reducer(next,{type:'PLAY_COPA_LEG'})
  assert.deepEqual(planFor(second,you.id),plan,'plan stays in second leg');checks++
  const newMatch=quickFootballMatch(second,you.id)!
  assert.equal(newMatch.footballLive,undefined,'next leg has its own order history');checks++
  assert.deepEqual(canonical(reducer(second,action)),canonical(second),'first-leg context cannot alter second leg');checks++
 }
}
console.log(`PASS: ${checks} live cup checks: first/second leg, final, immutable events, separate league stats, clock, idempotency, stale-stage rejection and coherent winner.`)
