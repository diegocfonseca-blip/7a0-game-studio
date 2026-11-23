import assert from 'node:assert/strict'
import {simulaCopaMundo} from '../src/escalacao/copa-mundo'
import {simulaRegional,xiDaMaquinaClube} from '../src/escalacao/copa-regional'
import {simulaLibertaSala,jogosDoPasso,LIB} from '../src/escalacao/liberta-sala'
import {withCupPlans,cupPlanAt,type CupPlanRow} from '../src/escalacao/copa-planos'
import {DEFAULT_FOOTBALL_PLAN} from '../src/escalacao/football-live-tactics'
import {PASSO_COPA} from '../src/escalacao/copa-passos'
const xi=xiDaMaquinaClube('Flamengo').xi
const entrants=Array.from({length:32},(_,i)=>({uid:`user-${i}`,pais:`QA ${i}`,club:`Clube ${i}`,you:false,humano:i<2,xi,str:70+i%8,form:'4-3-3'}))
const uids=entrants.map(e=>e.uid),plan={...DEFAULT_FOOTBALL_PLAN,posture:'ataque' as const,pressure:'high' as const,pace:'fast' as const}
const row=(uid:string,step:number,from:number,seq:number,change=plan):CupPlanRow=>({id:`order-${seq}`,uid,step,from,seq,plan:change})
const engines=[
 {name:'Mundo',simulate:(seed:number,rows:CupPlanRow[])=>simulaCopaMundo(entrants,seed,1,true,true,false,withCupPlans(undefined,rows,uids)),games:(w:any,p:number)=>p<=3?w.groups.flatMap((g:any)=>g.matches[p-1]):p===PASSO_COPA.OITAVAS?w.r16.map((t:any)=>({h:t.h,a:t.a,ev:t.ev1})):p===PASSO_COPA.FINAL?[w.final]:[],final:PASSO_COPA.FINAL},
 {name:'Regional',simulate:(seed:number,rows:CupPlanRow[])=>simulaRegional(entrants.slice(0,16),seed,withCupPlans(undefined,rows,uids.slice(0,16))),games:(w:any,p:number)=>p<=8?w.rodadas[p-1]:w.ko[p-10]?.ties??[],final:12},
 {name:'Libertadores',simulate:(seed:number,rows:CupPlanRow[])=>simulaLibertaSala(entrants,seed,withCupPlans(undefined,rows,uids)),games:jogosDoPasso,final:LIB.FINAL},
]
let checks=0
for(const engine of engines){
 let influenced=0
 for(let seed=1;seed<=25;seed++){
  const base=engine.simulate(seed,[]),neutral=engine.simulate(seed,[row(uids[0],1,0,1,DEFAULT_FOOTBALL_PLAN)])
  assert.deepEqual(neutral,base,`${engine.name}: neutral preserves whole tournament and RNG`);checks++
  const g=engine.games(base,1).find((g:any)=>g.h===0||g.a===0)!
  const first=row(uids[0],1,35,2),changed=engine.simulate(seed,[first])
  const own=engine.games(changed,1).find((m:any)=>m.h===g.h&&m.a===g.a)!
  assert.deepEqual(own.ev.filter((e:any)=>e.min<=35),g.ev.filter((e:any)=>e.min<=35),`${engine.name}: shown events immutable`);checks++
  assert.deepEqual(engine.games(changed,1).filter((m:any)=>m.h!==g.h||m.a!==g.a),engine.games(base,1).filter((m:any)=>m.h!==g.h||m.a!==g.a),`${engine.name}: other matches untouched`);checks++
  assert.deepEqual(engine.simulate(seed,JSON.parse(JSON.stringify([first]))),changed,`${engine.name}: two devices agree`);checks++
  const second=row(uids[g.h===0?g.a:g.h],1,65,3,{...plan,posture:'retranca',pace:'slow'})
  const revised=engine.simulate(seed,[first,second]),own2=engine.games(revised,1).find((m:any)=>m.h===g.h&&m.a===g.a)!
  assert.deepEqual(own2.ev.filter((e:any)=>e.min<=65),own.ev.filter((e:any)=>e.min<=65),`${engine.name}: opponent order retains earlier order's seen events`);checks++
  const late=engine.simulate(seed,[row(uids[0],2,40,1)])
  assert.deepEqual(engine.games(late,1),engine.games(base,1),`${engine.name}: later round cannot alter earlier game`);checks++
  const future=engine.simulate(seed,[row(uids[0],2,0,1)])
  if(JSON.stringify(engine.games(future,2))!==JSON.stringify(engine.games(base,2)))influenced++
  const final=engine.games(base,engine.final)[0]!
  const finalOrder=row(uids[final.h],engine.final,50,1)
  const finalChanged=engine.simulate(seed,[finalOrder]),fc=engine.games(finalChanged,engine.final)[0]!
  assert.deepEqual(fc.ev.filter((e:any)=>e.min<=50),final.ev.filter((e:any)=>e.min<=50),`${engine.name}: final continuation retains seen goals/assists`);checks++
 }
 assert(influenced>0,`${engine.name}: saved plan really changes next-match simulation`);checks++
}
const saved=row(uids[0],2,0,1),live=row(uids[0],1,40,2)
assert.deepEqual(cupPlanAt([saved,live],uids[0],1),DEFAULT_FOOTBALL_PLAN,'queued plan does not rewrite active plan');checks++
for(const step of [2,3,5,8,14]){assert.deepEqual(cupPlanAt([saved,live],uids[0],step),plan,'choice persists across phases');checks++}
assert.equal(withCupPlans(undefined,[{...saved,plan:{...plan,pressure:'invalid'}} as never],uids),undefined,'invalid serialized plan ignored');checks++
console.log(`PASS: ${checks} engine checks across World Cup, regional and Libertadores; neutral legacy RNG, future persistence, real effects, immutable past, independent matches, finals and two devices.`)
