import assert from 'node:assert/strict'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {tempoVisualPartida} from '../src/escalacao/presidencia-partida-model.ts'
const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}))
const state={context:{id:'motor-test',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const a=new MotorFutebol(state),b=new MotorFutebol(state),phases=new Set()
let prev=a.sample(state,0,0)
for(let i=1;i<=3600;i++){
 const f=a.sample(state,i/60,i/60*1000);phases.add(f.phase)
 assert.equal(f.players.length,22)
 for(let j=0;j<22;j++){
  const p=f.players[j],old=prev.players[j]
  assert.ok(Math.hypot(p.mx-old.mx,p.mz-old.mz)<.1,'Player speed cannot exceed 6m/s at 1x')
  assert.ok(Math.abs(p.mx)<=52.6&&Math.abs(p.mz)<=34.1)
  assert.ok(Number.isFinite(p.heading))
 }
 assert.ok(f.ball.y>=.11-1e-8)
 if(f.owner&&f.phase==='dominio'){const p=f.players.find(p=>p.key===f.owner);assert.ok(Math.hypot(f.ball.x-p.mx,f.ball.z-p.mz)<.65,'Possessed ball stays at the feet')}
 prev=f
}
const once=b.sample(state,60,60000)
assert.deepEqual(once,prev,'60 FPS and delayed camera evaluate the same fixed-step trajectory')
assert.ok(phases.has('passe')&&phases.has('dominio'))
assert.equal(tempoVisualPartida({...state,visualClock:{seconds:10,sampledAt:1000,running:true,rate:4}},1500),12)
assert.equal(tempoVisualPartida({...state,visualClock:{seconds:10,sampledAt:1000,running:false,rate:4}},1500),10)
for(const home of [true,false]){
 const m=new MotorFutebol(state),goal={id:'goal',home,name:home?'h10':'a10',minute:20,startedAt:100,phase:'shot'}
 const before=m.sample({...state,goal},0,100);assert.notEqual(before.phase,'gol')
 const after=m.sample({...state,goal:{...goal,phase:'confirmed'},homeScore:home?1:0,awayScore:home?0:1},0,1000)
 assert.equal(after.phase,'gol');assert.ok(home?after.ball.x>52.5:after.ball.x< -52.5)
 assert.equal(m.sample(state,0,1100).phase,'saida')
}
assert.equal(state.homeScore,0);assert.equal(state.awayScore,0)
console.log('PASS: 22 real players, bounded movement, possession, deterministic fixed-step passes, shared 4x/pause clock, authoritative goals and kickoff, no score mutation.')
// The saved shot visibly crosses the end line before the corner is awarded.
{
 const m=new MotorFutebol(state),chance={id:'save-1',home:true,minute:20,startedAt:0,outcome:'defendeu'}
 m.sample({...state,chance},0,0)
 const out=m.sample({...state,chance},1.8,1800)
 assert.ok(out.ball.x>52.5&&Math.abs(out.ball.z)>3.66)
 const corner=m.sample(state,1.9,1900);assert.equal(corner.phase,'escanteio');assert.equal(corner.ball.x,52.5);assert.equal(corner.ball.z,34)
 let delivered=false
 for(let i=115;i<2200;i++){const f=m.sample(state,i/60,i*1000/60);if(f.phase==='escanteio'&&f.ball.y>1)delivered=true}
 assert.ok(delivered,'Corner taker reaches the corner and delivers an aerial cross')
}
for(const outcome of ['fora','isolou','trave']){
 const m=new MotorFutebol(state),chance={id:outcome,home:true,minute:20,startedAt:0,outcome};m.sample({...state,chance},0,0)
 const f=m.sample({...state,chance},1.5,1500)
 if(outcome==='fora')assert.ok(f.ball.x>52.5&&Math.abs(f.ball.z)>3.66)
 if(outcome==='isolou')assert.ok(f.ball.y>2.44)
 if(outcome==='trave')assert.ok(f.ball.x<52.5,'Post rebound returns into play')
 assert.equal(m.sample(state,1.6,1600).phase,outcome==='trave'?'dominio':'tiro-de-meta')
}
{
 const m=new MotorFutebol(state);m.sample(state,2,2000)
 const sub={id:'real-sub',name:'Real substitute',pos:'ATA'}
 const second={...state,minute:46,context:{...state.context,homeSecondHalf:[...state.context.home.slice(0,10),sub]}}
 const f=m.sample(second,2,2000);assert.equal(f.phase,'saida');assert.ok(f.players.some(p=>p.id===sub.id));assert.ok(!f.players.some(p=>p.id==='h10'))
 const queued=m.sample({...second,goal:{id:'late-half',home:true,name:'h10',minute:45,phase:'confirmed'}},2,2000)
 assert.ok(queued.players.some(p=>p.id==='h10'));assert.ok(queued.ball.x>52.5)
}
{
 const m=new MotorFutebol(state);let thrown=false,minSeparation=100
 for(let i=0;i<18000;i++){
  const f=m.sample(state,i/60,i*1000/60)
  if(f.phase==='lateral'&&f.players.some(p=>p.throwing>0)&&f.ball.y>1.5)thrown=true
  for(let j=0;j<22;j++)for(let k=j+1;k<22;k++)minSeparation=Math.min(minSeparation,Math.hypot(f.players[j].mx-f.players[k].mx,f.players[j].mz-f.players[k].mz))
 }
 assert.ok(thrown,'Natural play produces a throw-in with an overhead release')
 assert.ok(minSeparation>.48,`Players must not pass through each other: ${minSeparation}`)
}
console.log('PASS: throw-in, parried save → corner cross, goal kicks, post rebound, ball over bar, halftime XI and minimum body separation over five simulated minutes.')

// Holding a shot does not put the ball out of play or award a goal kick.
for(const home of [true,false]){
 const m=new MotorFutebol(state),chance={id:'caught-0',home,minute:20,startedAt:0,outcome:'defendeu'}
 m.sample({...state,chance},0,0);m.sample({...state,chance},1.8,1800)
 const caught=m.sample(state,1.9,1900),keeper=caught.players.find(p=>p.keeper&&p.side===(home?'away':'home'))
 assert.equal(caught.phase,'dominio');assert.equal(caught.owner,keeper.key)
 assert.ok(Math.hypot(caught.ball.x-keeper.mx,caught.ball.z-keeper.mz)<.5)
 let passed=false
 for(let i=115;i<240;i++){
  const f=m.sample(state,i/60,i*1000/60)
  assert.notEqual(f.phase,'tiro-de-meta')
  if(f.phase==='passe'&&f.players.find(p=>p.key===keeper.key).kick>0){passed=true;break}
 }
 assert.ok(passed,'The keeper distributes the caught save to a teammate')
}
console.log('PASS: caught saves remain in play and both goalkeepers distribute, without a false goal kick.')
