import assert from 'node:assert/strict'
import fs from 'node:fs'
import {MotorFutebol,planejarLanceFutebol,quadroFutebol3D} from '../src/escalacao/presidencia-futebol-motor.ts'
import {criarRelogioLance} from '../src/escalacao/presidencia-lance-tempo.ts'
import {contatoLuvas3D,contatoPe3D} from '../src/escalacao/presidencia-atleta-3d.ts'

const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}))
const base={context:{id:'motor-real',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const d3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
const bodyDistance=(a,b)=>Math.hypot(a.mx-b.mx,a.mz-b.mz)
const report={natural:[],restarts:[],dribbles:[],saves:[],identity:[],frames:0}

// A complete natural passage must remain continuous across all its restarts,
// and delayed cameras must reach the same state as a 60 Hz camera.
for(const minute of [20,70]){
 const state={...base,minute,context:{...base.context,id:`natural-${minute}`}},motor=new MotorFutebol(state)
 const original=JSON.stringify(state),phases=new Set(),receivers=new Set(),deliveries={}
 let previous=motor.sample(state,0,0),maxBallSpeed=0,maxBodySpeed=0,minSeparation=Infinity,lastFlight=-1
 for(let i=1;i<=18000;i++){
  const frame=motor.sample(state,i/60,i*1000/60)
  assert.equal(frame.players.length,22)
  assert.ok(frame.ball.y>=.11-1e-8)
  const speed=d3(frame.ball,previous.ball)*60;maxBallSpeed=Math.max(maxBallSpeed,speed)
  assert.ok(speed<30,`Natural ${minute}: discontinuous ball at ${i}: ${speed} m/s, ${previous.phase} → ${frame.phase}`)
  for(let j=0;j<22;j++){
   const p=frame.players[j],v=bodyDistance(p,previous.players[j])*60;maxBodySpeed=Math.max(maxBodySpeed,v)
   assert.ok(v<=5.8+1e-6,`Body moved too quickly: ${p.key} ${v}`)
   assert.ok(Math.abs(p.mx)<=55&&Math.abs(p.mz)<=36,'Recovery may leave the pitch, never the surrounding runoff')
   for(let k=j+1;k<22;k++)minSeparation=Math.min(minSeparation,bodyDistance(p,frame.players[k]))
  }
  if(frame.owner&&frame.phase==='dominio'&&!motor.keeperRelease){
   const p=frame.players.find(p=>p.key===frame.owner)
   // Front boot geometry + ball radius reaches 0.6875 m from the body axis;
   // the separate contact suite measures actual boot boxes, not just radius.
   assert.ok(Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<.75,'A controlled ball belongs to a reachable foot')
   receivers.add(p.side)
  }
  if(motor.flight&&motor.flight.start!==lastFlight){lastFlight=motor.flight.start;deliveries[frame.phase]=(deliveries[frame.phase]??0)+1}
  phases.add(frame.phase);previous=frame;report.frames++
 }
 assert.ok(phases.has('passe')&&phases.has('lancamento')&&phases.has('cruzamento'),'Natural progression contains short passes, long passes and crosses without a prepared wing fixture')
 assert.ok(phases.has('lateral')&&phases.has('escanteio'))
 assert.deepEqual([...receivers].sort(),['away','home'],'Both teams can receive and retain the ball')
 assert.ok(minSeparation>=.63,`Player centres overlap: ${minSeparation}`)
 const delayed=new MotorFutebol(state)
 assert.deepEqual(delayed.sample(state,300,300000),previous,'A delayed second camera must reproduce the fixed-step trajectory')
 assert.equal(JSON.stringify(state),original,'Presentation must not change match state')
 report.natural.push({minute,phases:[...phases],deliveries,maxBallSpeed,maxBodySpeed,minSeparation})
}

// Official outcomes finish at the visible ball. There is no invisible transfer
// from goal/net/outside line to the next restart location.
for(const home of [true,false])for(const outcome of ['gol','defendeu','fora','isolou','trave']){
 const state={...base,context:{...base.context,id:`recovery-${home}-${outcome}`},visualClock:{seconds:20,sampledAt:20000,running:false}}
 const motor=new MotorFutebol(state);motor.sample(state,20,20000)
 const event={id:`recovery-${home}-${outcome}-1`,home,name:home?'h10':'a10',minute:20,startedAt:20000,...(outcome==='gol'?{phase:'shot'}:{outcome})}
 const plan=planejarLanceFutebol(state,event,20000),clock=criarRelogioLance(20000)
 assert.ok(plan)
 const end=Math.ceil((plan.durationMs+1300)/1000*60)
 let previous
 for(let i=0;i<=end;i++){
  const elapsed=i*1000/60,live={...state,[outcome==='gol'?'goal':'chance']:{...event,plan,clock,...(outcome==='gol'?{phase:elapsed>=plan.durationMs?'confirmed':'shot'}:{})}}
  previous=motor.sample(live,20+i/60,20000+elapsed);report.frames++
 }
 const before={...previous.ball},stages=new Set(),expected=outcome==='gol'?'saida':outcome==='defendeu'?'escanteio':outcome==='trave'?'dominio':'tiro-de-meta'
 let maxSpeed=0,carried=0,firstJump,delivered=false,seconds=0
 for(let i=1;i<=3600;i++){
  const t=20+(end+i)/60,frame=motor.sample(state,t,t*1000),speed=d3(frame.ball,previous.ball)*60
  if(i===1){firstJump=d3(frame.ball,before);assert.equal(frame.phase,expected);assert.ok(firstJump<1e-8,'Official event removal must preserve the visible ball')}
  maxSpeed=Math.max(maxSpeed,speed)
  assert.ok(speed<16,`${outcome}/${home}: restart ball jumped at ${i}: ${speed} m/s`)
  const recovery=motor.restart?.recovery
  if(recovery){
   stages.add(recovery.stage)
   if(recovery.stage==='carry'){
    const taker=frame.players.find(p=>p.key===motor.restart.taker)
    assert.ok(d3(frame.ball,contatoLuvas3D(taker))<1e-6,'A carried ball is attached to the actual rendered hands')
    carried++
   }
  }
  assert.deepEqual(motor.sample(state,t,t*1000+5000).ball,frame.ball,'A stopped visual clock freezes a recovery too')
  previous=frame;report.frames++
  if(motor.flight){delivered=true;seconds=i/60;break}
 }
 assert.ok(delivered,`Restart did not complete within 60 seconds: ${outcome}/${home}`)
 if(outcome!=='trave'){assert.ok(carried>0);assert.deepEqual([...stages],['fetch','pickup','carry','place'])}
 else assert.equal(carried,0,'A post rebound stays in play; players cannot pick it up')
 report.restarts.push({home,outcome,firstJump,maxSpeed,carried,seconds,stages:[...stages]})
}

// Whole-ball goal crossing and confirmation share the exact trajectory. Sample
// a millisecond around impact to expose even a small one-frame position snap.
for(const home of [true,false]){
 const state={...base,context:{...base.context,id:`goal-line-${home}`},visualClock:{seconds:20,sampledAt:20000,running:false}},motor=new MotorFutebol(state)
 const event={id:`whole-ball-${home}`,home,name:home?'h10':'a10',minute:20,phase:'shot',startedAt:20000},plan=planejarLanceFutebol(state,event,20000),clock=criarRelogioLance(20000)
 motor.sample(state,20,20000)
 const live={...state,goal:{...event,plan,clock}},t=plan.durationMs
 motor.sample(live,20,20000)
 const before=motor.sample(live,20+(t-1)/1000,20000+t-1)
 assert.ok((home?before.ball.x:-before.ball.x)-.11<52.5,'A ball still touching the goal line is not fully over it')
 const onLine=motor.sample(live,20+t/1000,20000+t)
 const confirmed=motor.sample({...live,goal:{...live.goal,phase:'confirmed'}},20+t/1000,20000+t)
 assert.ok(Math.abs((home?confirmed.ball.x:-confirmed.ball.x)-.11-52.5)<1e-8)
 assert.ok(d3(onLine.ball,confirmed.ball)<1e-8,'Changing only confirmation must not move the ball')
 assert.ok(d3(before.ball,confirmed.ball)<.04,'Crossing the goal line obeys the shot velocity')
 const after=motor.sample({...live,goal:{...live.goal,phase:'confirmed'}},20+(t+1)/1000,20000+t+1)
 assert.ok(d3(after.ball,confirmed.ball)<.04,'The net continuation remains continuous after confirmation')
 assert.ok((home?after.ball.x:-after.ball.x)>52.61,'The ball continues visibly inside the net')
}

// Conduction under a frontal marker bends into an open lateral lane, while the
// same player keeps the ball reachable. It does not fabricate a dribble statistic.
for(const side of ['home','away']){
 const motor=new MotorFutebol(base),dir=side==='home'?1:-1,owner=motor.players.find(p=>p.side===side&&p.pos==='ATA'),marker=motor.players.find(p=>p.side!==side&&p.pos==='ZAG')
 for(const [i,p] of motor.players.entries()){p.mx=(p.side===side?-1:1)*35;p.mz=(i%11-5)*5}
 owner.mx=0;owner.mz=0;owner.heading=dir*Math.PI/2;marker.mx=dir*2.8;marker.mz=0
 motor.restart=null;motor.owner=owner.key;motor.ball={x:dir*.38,z:0,y:.11};motor.nextDecision=5
 let previous=motor.sample(base,0,0),maxBallSpeed=0
 for(let i=1;i<=60;i++){
  const frame=motor.sample(base,i/60,i*1000/60),p=frame.players.find(p=>p.key===owner.key)
  assert.equal(frame.owner,owner.key)
  assert.ok(Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<.75,'The carrier keeps the ball within the animated boot reach')
  const speed=d3(frame.ball,previous.ball)*60;maxBallSpeed=Math.max(maxBallSpeed,speed)
  // Advancing boot + moving body legitimately pushes faster than the old
  // 12 m/s body-axis offset. The geometric helper reaches 16.63 m/s in its
  // independent suite; this fixture measures both velocity and foot reach.
  assert.ok(speed<18,'A change of direction must not teleport the controlled ball')
  previous=frame;report.frames++
 }
 const end=previous.players.find(p=>p.key===owner.key)
 assert.ok(Math.abs(end.mz)>.7&&dir*end.mx>.4,'Carrier escapes the frontal marking lane')
 report.dribbles.push({side,x:end.mx,z:end.mz,maxBallSpeed})
}
assert.equal(base.homeScore,0);assert.equal(base.awayScore,0)
// Native IDs encode home/away in the last digit. Neither team may be locked to
// catches or parries merely because that digit is even or odd.
for(const home of [true,false]){
 const variants=new Set();let parries=0,catches=0
 for(let minute=1;minute<=90;minute++){
  const id=`match-real:chance:${minute*10+(home?1:2)}`,motor=new MotorFutebol(base)
  motor.sample({...base,chance:{id,minute,home,startedAt:0,outcome:'defendeu'}},0,0)
  const parry=motor.official.parry;variants.add(parry);parry?parries++:catches++
 }
 assert.equal(variants.size,2,'Both home and away shots can be caught or parried')
 report.saves.push({home,parries,catches})
}
// Repeated display names must not replace the official scorer or assister.
{
 const state={...base,context:{...base.context,id:'same-name',home:base.context.home.map(p=>({...p,name:['h9','h10'].includes(p.id)?'Mesmo atacante':['h1','h2'].includes(p.id)?'Mesmo lateral':p.name}))},visualClock:{seconds:20,sampledAt:20000,running:false}}
 const event={id:'identity-goal',home:true,minute:20,name:'Mesmo atacante',scorerId:'h10',assist:'Mesmo lateral',assistId:'h2',phase:'shot',startedAt:20000}
 const plan=planejarLanceFutebol(state,event,20000)
 assert.equal(plan.author.key,'home:h10');assert.equal(plan.assist.key,'home:h2')
 const motor=new MotorFutebol(state);motor.sample(state,20,20000)
 const clock=criarRelogioLance(20000),live={...state,goal:{...event,plan,clock}}
 motor.sample(live,20,20000)
 assert.equal(motor.official.name,'home:h10');assert.equal(motor.official.assist.key,'home:h2')
 const elapsed=plan.approachMs+plan.passMs,frame=motor.sample(live,20+elapsed/1000,20000+elapsed),scorer=frame.players.find(p=>p.key===plan.author.key)
 // The compact pose is Float32 while the shot anchor remains Float64.
 // At ~40 m the measured quantisation is 1.087 micrometres; 10 micrometres
 // covers that numeric envelope without permitting visible contact gaps.
 assert.ok(d3(frame.ball,contatoPe3D({...scorer,kick:.3}))<1e-5,'The shot starts at the actual striking boot, not the body centre')
 report.identity.push({kind:'homonyms',author:plan.author.key,assist:plan.assist.key})
}
// A queued first-half goal uses that half's player and attacking direction even
// after the scoreboard has advanced and substituted the scorer at half-time.
{
 const sub={id:'h-sub',name:'Substituto',pos:'ATA'}
 const state={...base,minute:46,context:{...base.context,id:'late-first-half',homeSecondHalf:[...base.context.home.slice(0,10),sub]},visualClock:{seconds:20,sampledAt:20000,running:false}}
 const before=quadroFutebol3D(state,20000),event={id:'queued-45',home:true,minute:45,name:'h10',scorerId:'h10',phase:'shot',startedAt:20000}
 const plan=planejarLanceFutebol(state,event,20000)
 assert.equal(plan.author.key,'home:h10')
 assert.deepEqual(quadroFutebol3D(state,20000),before,'Planning the earlier incident must not rewind the shared camera')
 const motor=new MotorFutebol(state);motor.sample(state,20,20000)
 const live={...state,goal:{...event,plan,clock:criarRelogioLance(20000)}}
 motor.sample(live,20,20000)
 assert.equal(motor.official.name,'home:h10');assert.equal(motor.official.right,true)
 assert.deepEqual(motor.official.author,{x:plan.author.x,z:plan.author.z})
 const result=motor.sample({...live,goal:{...live.goal,phase:'confirmed'}},20+plan.durationMs/1000,20000+plan.durationMs)
 assert.ok(result.ball.x>52.5,'The first-half home goal uses the first-half net')
 report.identity.push({kind:'queued-before-halftime',author:plan.author.key,right:true})
}
fs.mkdirSync('test-results/futebol-3d',{recursive:true})
fs.writeFileSync('test-results/futebol-3d/motor-real-20261016.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.frames} frames, natural crosses in both halves, ten continuous recoveries, real hand/boot contact, evasive carries, 180 unbiased saves, homonyms, queued half-time scorer and deterministic cameras; match result untouched.`)
