import assert from 'node:assert/strict'
import {CARS,DRIVERS} from '../../src/escalacao/formula1/catalog.ts'
import {createAuction,submitBid,continueAuction,maxBid} from '../../src/escalacao/formula1/auction.ts'
import {createRace,command,advanceRace,tickRace,grid,teamResults,PIT_SECONDS,LAPS} from '../../src/escalacao/formula1/race.ts'
assert.equal(new Set(DRIVERS.map(d=>d.id)).size,DRIVERS.length)
assert.equal(new Set(DRIVERS.map(d=>d.name)).size,DRIVERS.length)
assert.equal(new Set(CARS.map(c=>`${c.team}:${c.model}:${c.year}`)).size,CARS.length)
assert.equal(new Set(DRIVERS.map(d=>d.category)).size,5);assert.equal(new Set(CARS.map(c=>c.category)).size,5)
for(const d of DRIVERS)for(const n of [d.overall,d.pace,d.rain,d.craft,d.care,d.consistency])assert(Number.isFinite(n)&&n>=0&&n<=100)
for(const c of CARS)for(const n of [c.overall,c.pace,c.corners,c.tyres,c.reliability])assert(Number.isFinite(n)&&n>=0&&n<=100)
function auction(seed:number,style:number){
 let a=createAuction(seed,'Minha equipe');let attempts=0
 assert(submitBid(a,a.offers[0],99).error);assert(submitBid(a,'invalid',1).error);assert(submitBid(a,a.offers[0],1.1).error)
 const one=submitBid(a,a.offers[0],1),many=submitBid(a,a.offers[0],50)
 assert.deepEqual(one.report?.bids.slice(0,3),many.report?.bids.slice(0,3),'Bots decidem sem conhecer o lance do usuário')
 while(!a.complete){
  const id=a.offers[style%a.offers.length],amount=style===0?1:style===1?maxBid(a):Math.min(maxBid(a),25+seed%12)
  const old=structuredClone(a);const after=submitBid(a,id,amount);assert.deepEqual(a,old,'Entrada imutável');assert.equal(after.error,null);assert(after.report)
  assert.strictEqual(submitBid(after,id,amount),after,'Duplo toque não compra duas vezes');a=continueAuction(after)
  assert(++attempts<=12);for(const t of a.teams){assert(t.coins>=0);assert.equal(t.drivers.length,new Set(t.drivers).size)}
 }
 assert(a.teams.every(t=>t.drivers.length===2&&t.car));assert.equal(new Set(a.teams.flatMap(t=>t.drivers)).size,8);assert.equal(new Set(a.teams.map(t=>t.car)).size,4)
 for(const t of a.teams)assert.equal(100-t.coins,a.sales.filter(s=>s.teamId===t.id).reduce((sum,s)=>sum+s.amount,0))
 return a
}
let cases=0
for(let seed=1;seed<=50;seed++){
 const a=auction(seed,seed%3);const race=createRace(seed,a.teams,{},seed%2===0)
 const copy=structuredClone(race);const id=race.cars.find(c=>c.teamId===0)!.id;const rival=race.cars.find(c=>c.teamId!==0)!.id
 assert.strictEqual(command(race,rival,{kind:'pit'}),race,'Não comanda o rival')
 assert.deepEqual(advanceRace(race,10),Array.from({length:10}).reduce(r=>tickRace(r),race),'FPS não altera o motor')
 const queued=command(command(race,id,{kind:'tyre',tyre:'soft'}),id,{kind:'pit'});let p=queued
 for(let i=0;i<200&&!p.cars.find(c=>c.id===id)!.pitRemaining;i++)p=tickRace(p)
 const before=p.cars.find(c=>c.id===id)!;assert.equal(before.pitRemaining,PIT_SECONDS)
 assert.strictEqual(command(p,id,{kind:'tyre',tyre:'inter'}),p,'Pneu não troca durante o serviço');assert.strictEqual(command(p,id,{kind:'pit'}),p,'Duplo pit bloqueado')
 p=advanceRace(p,PIT_SECONDS);const after=p.cars.find(c=>c.id===id)!;assert.equal(after.stops,1);assert.equal(after.tyre,'soft');assert.equal(after.wear,100)
 const done=advanceRace(p,7200);assert(done.finished);assert(done.cars.every(c=>c.finishTime!==null&&c.progress===LAPS&&c.wear>=0));assert.deepEqual(race,copy)
 assert.strictEqual(tickRace(done),done);assert.strictEqual(command(done,id,{kind:'pit'}),done);assert(grid(done).every(c=>Number.isFinite(c.finishTime)))
 assert.equal(teamResults(done,a.teams).reduce((sum,t)=>sum+t.points,0),98)
 if(seed%2===0)assert(done.hadWet);else assert(done.cars.filter(c=>c.teamId!==0).every(c=>c.penalty===0),'Bots respeitam os dois compostos')
 cases++
}
// Ritmo e clima têm consequência, sem mexer nas notas: chuva pune pneu de seco.
const a=auction(321,1),base=createRace(321,a.teams,{}),mine=base.cars.find(c=>c.teamId===0)!.id
const attack=advanceRace(command(base,mine,{kind:'pace',pace:'attack'}),60),save=advanceRace(command(base,mine,{kind:'pace',pace:'save'}),60)
assert(attack.cars.find(c=>c.id===mine)!.progress>save.cars.find(c=>c.id===mine)!.progress);assert(attack.cars.find(c=>c.id===mine)!.wear<save.cars.find(c=>c.id===mine)!.wear)
const wetBase={...base,wetFrom:0,wetTo:9999},wetInter={...wetBase,cars:wetBase.cars.map(c=>c.id===mine?{...c,tyre:'inter' as const,compounds:['inter' as const]}:c)}
assert(advanceRace(wetInter,60).cars.find(c=>c.id===mine)!.progress>advanceRace(wetBase,60).cars.find(c=>c.id===mine)!.progress,'Inter ganha de slick na chuva')
const machine=CARS.find(c=>c.id===base.cars.find(c=>c.id===mine)!.carId)!,reliability=machine.reliability
try{
 let reliable=0,fragile=0
 for(let seed=1;seed<=10;seed++){
  const start=createRace(seed,a.teams,{})
  machine.reliability=100;reliable+=advanceRace(start,7200).cars.find(c=>c.id===mine)!.finishTime!
  machine.reliability=0;fragile+=advanceRace(start,7200).cars.find(c=>c.id===mine)!.finishTime!
 }
 assert(fragile>reliable,'Confiabilidade tem efeito, sem trocar a nota do piloto')
}finally{machine.reliability=reliability}
console.log(JSON.stringify({passed:true,auctions:cases,races:cases,drivers:DRIVERS.length,cars:CARS.length,checks:['categorias','sem duplicatas','caixa igual','reserva para completar equipe','bots sem ler envelope','duplo toque','pit 22s','troca individual','imprevisibilidade controlada','pneu travado no pit','determinismo','fim','pontuação','dois compostos','ritmo e desgaste','pneu de chuva','confiabilidade com consequência']}))
