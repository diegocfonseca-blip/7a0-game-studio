import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {MotorFutebol,quadroFutebol3D,aguardandoReinicioFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {tempoVisualPartida} from '../src/escalacao/presidencia-partida-model.ts'

const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}))
const base={context:{id:'distribution',home:team('h'),away:team('a')},minute:0,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const positions=frame=>frame.players.map(p=>({key:p.key,x:p.mx,z:p.mz}))
const direction=(frame,side)=>frame.players.find(p=>p.side===side&&p.keeper).x<.5?1:-1
function occupation(frame){
 const field=frame.players.filter(p=>!p.keeper),xs=field.map(p=>p.mx),zs=field.map(p=>p.mz)
 return {central:field.filter(p=>Math.hypot(p.mx,p.mz)<12).length,length:Math.max(...xs)-Math.min(...xs),width:Math.max(...zs)-Math.min(...zs)}
}
function distributed(frame,label){
 assert.equal(frame.players.length,22,`${label}: 11 athletes per side`)
 const area=occupation(frame)
 assert.ok(area.central<=6,`${label}: ${area.central} athletes crowd the centre circle`)
 assert.ok(area.length>=45,`${label}: outfield players retain depth (${area.length}m)`)
 assert.ok(area.width>=45,`${label}: outfield players retain width (${area.width}m)`)
 for(const side of ['home','away']){
  const keeper=frame.players.find(p=>p.side===side&&p.keeper)
  assert.ok(direction(frame,side)*keeper.mx<=-45,`${label}: keeper defends his own goal`)
 }
 return area
}
const report={compressed:[],restarts:[],interval:null}

// A cold camera at 93' must not synthesize another kickoff. This also exercises
// the clock's read-only restart query without creating another physical sample.
{
 const ended={...base,minute:93,finished:true,homeScore:3,context:{...base.context,id:'cold-ended'},visualClock:{seconds:90,sampledAt:0,running:false,rate:1}}
 const first=quadroFutebol3D(ended,0),later=quadroFutebol3D(ended,60000)
 distributed(first,'cold finished view');assert.notEqual(first.phase,'saida')
 assert.deepEqual(later,first,'The cold finished view stays still even when no previous motor exists')
 assert.equal(aguardandoReinicioFutebol(ended.context.id),false)
 const live={...base,context:{...base.context,id:'restart-query'},visualClock:{seconds:0,sampledAt:0,running:true,rate:1}}
 const kickoff=quadroFutebol3D(live,0)
 assert.equal(aguardandoReinicioFutebol(live.context.id),true)
 assert.equal(aguardandoReinicioFutebol('another-match'),false)
 assert.deepEqual(quadroFutebol3D(live,0),kickoff,'Reading restart readiness does not advance the motor')
 quadroFutebol3D(live,3000)
 assert.equal(aguardandoReinicioFutebol(live.context.id),false,'Minute hold releases after the actual kickoff pass')
}

// The production regression used the normal match clock (including an instant
// 45→46 transition), not a fixed minute=20 fixture. A twelve-second match used
// to end with 16 players inside 12m of the centre and no second-half kickoff.
for(const duration of [12,30,60,90]){
 const state={...base,context:{...base.context,id:`distribution-${duration}`}},motor=new MotorFutebol(state)
 let peak=0,minLength=Infinity,minWidth=Infinity,first=null,final=null
 const phases=[new Set(),new Set()],owners=[new Set(),new Set()]
 for(let tick=0;tick<=duration*60;tick++){
  const seconds=tick/60,minute=Math.round(seconds/duration*93)
  const current={...state,minute,finished:minute===93},frame=motor.sample(current,seconds,seconds*1000)
  const area=distributed(frame,`${duration}s / ${minute}'`)
  peak=Math.max(peak,area.central);minLength=Math.min(minLength,area.length);minWidth=Math.min(minWidth,area.width)
  const half=minute>=45?1:0
  phases[half].add(frame.phase);if(frame.owner)owners[half].add(frame.owner)
  if(!first)first=area
  final=frame
 }
 for(const [half,seen] of phases.entries()){
  assert.ok(seen.has('dominio')&&(seen.has('passe')||seen.has('lancamento')),`${duration}s: play, reception and passing in half ${half+1}`)
  assert.ok(owners[half].size>=2,`${duration}s: the ball is played by different teammates in half ${half+1}`)
 }
 assert.notEqual(final.phase,'saida',`${duration}s: final whistle does not freeze a second-half kickoff`)
 const stopped={...state,minute:93,finished:true,visualClock:{seconds:duration,sampledAt:duration*1000,running:false,rate:1}}
 const hold=motor.sample(stopped,tempoVisualPartida(stopped,duration*1000+60000),duration*1000+60000)
 assert.deepEqual(positions(hold),positions(final),'Opening a stopped camera does not gather players at the centre')
 assert.deepEqual(hold.ball,final.ball,'The finished-match clock does not invent further football')
 report.compressed.push({duration,initial:first,final:occupation(final),peakCentral:peak,minLength,minWidth,phases:phases.map(s=>[...s]),owners:owners.map(s=>s.size)})
}

// Interval with an actual pause and a substitution: the paused clock holds the
// last first-half frame; the second-half whistle starts from a valid formation.
{
 const motor=new MotorFutebol(base),before=motor.sample({...base,minute:44},20,20000)
 const interval={...base,minute:45,paused:true,visualClock:{seconds:20,sampledAt:20000,running:false,rate:.25}}
 const paused=motor.sample(interval,tempoVisualPartida(interval,80000),80000)
 assert.deepEqual(positions(paused),positions(before),'The interval itself does not move or bunch the athletes')
 assert.deepEqual(paused.ball,before.ball)
 const replacement={id:'h-sub',name:'Real second-half player',pos:'ATA'}
 const second={...base,minute:46,context:{...base.context,homeSecondHalf:[...base.context.home.slice(0,10),replacement]}}
 const resumed=motor.sample(second,20,80000)
 distributed(resumed,'second-half whistle')
 assert.equal(resumed.phase,'saida');assert.deepEqual(resumed.ball,{x:0,y:.11,z:0})
 assert.ok(resumed.players.some(p=>p.id===replacement.id));assert.ok(!resumed.players.some(p=>p.id==='h10'))
 assert.ok(resumed.players.every(p=>direction(resumed,p.side)*p.mx<=.05),'Both teams are in their own half after the break')
 assert.equal(motor.restart.side,'away','The away team takes the second-half kickoff')
 let passed=false
 for(let tick=1201;tick<1440;tick++){
  const frame=motor.sample(second,tick/60,80000+(tick-1200)/60*1000)
  distributed(frame,'second-half opening play')
  if(!motor.restart&&motor.flight){passed=true;assert.equal(motor.flight.side,'away');break}
 }
 assert.ok(passed,'The second half starts playing within four seconds, without crossing all 22 bodies')
 // A queued incident from 45' still uses the first-half XI and the correct goal.
 const delayed=motor.sample({...second,goal:{id:'late-45',home:true,name:'h10',scorerId:'h10',minute:45,phase:'confirmed'}},24,84000)
 assert.ok(delayed.players.some(p=>p.id==='h10'));assert.ok(delayed.ball.x>52.5)
 report.interval={paused:true,substitute:replacement.id,resumed:occupation(resumed),awayKickoff:passed,delayedFirstHalfGoal:true}
}

// The clock can reach 45 while the last first-half goal is still being planned.
// Running is not evidence of a second half: only the explicit period switches
// the XI at that boundary. Otherwise a slow planner starts the 45' goal with
// both keepers already at the opposite ends, before the interval occurs.
{
 const substitute={id:'period-h-sub',name:'Second-half substitute',pos:'ATA'}
 const state={...base,context:{...base.context,id:'explicit-period',homeSecondHalf:[...base.context.home.slice(0,10),substitute]}}
 const motor=new MotorFutebol({...state,minute:44,period:1})
 let previous=motor.sample({...state,minute:44,period:1},20,20000)
 for(let tick=1201;tick<=1320;tick++){
  const frame=motor.sample({...state,minute:45,period:1,paused:false},tick/60,tick/60*1000)
  assert.ok(frame.players.find(p=>p.keeper&&p.side==='home').mx<-45,'45 running in period 1 keeps the first-half end')
  assert.ok(frame.players.some(p=>p.id==='h10'));assert.ok(!frame.players.some(p=>p.id===substitute.id))
  for(let i=0;i<22;i++)assert.ok(Math.hypot(frame.players[i].mx-previous.players[i].mx,frame.players[i].mz-previous.players[i].mz)<.1,'Planning a 45-minute goal does not reposition the whole XI')
  previous=frame
 }
 const resumed=motor.sample({...state,minute:45,period:2},22,22000)
 distributed(resumed,'explicit period 2 at 45')
 assert.ok(resumed.players.find(p=>p.keeper&&p.side==='home').mx>45)
 assert.ok(resumed.players.some(p=>p.id===substitute.id));assert.ok(!resumed.players.some(p=>p.id==='h10'))
 assert.equal(motor.restart.side,'away')
 const goal={id:'period-late-45',home:true,name:'h10',scorerId:'h10',minute:45,phase:'confirmed'}
 const late=motor.sample({...state,minute:46,period:2,goal},22,22000)
 assert.ok(late.players.find(p=>p.keeper&&p.side==='home').mx<-45,'An official event minute wins over a later published period')
 assert.ok(late.players.some(p=>p.id==='h10'));assert.ok(late.ball.x>52.5)
 report.explicitPeriod={firstHalfAt45:true,noPreGoalReposition:true,resumeAt45:true,eventMinutePriority:true}
}

// Goals are different from an interval: the ball must be physically retrieved
// from the net, everybody returns to their own half and the conceding side kicks.
for(const minute of [20,46])for(const home of [true,false]){
 const state={...base,minute,context:{...base.context,id:`restart-${minute}-${home}`}},motor=new MotorFutebol(state)
 motor.sample(state,40,40000)
 const goal={id:'confirmed',home,name:home?'h10':'a10',minute,phase:'confirmed'}
 const net=motor.sample({...state,goal},40,40000)
 let frame=motor.sample(state,40,40000),peak=0,minSeparation=Infinity,restartedAt=null
 assert.deepEqual(frame.ball,net.ball,'A goal does not teleport the ball from the net to the centre')
 assert.equal(frame.phase,'saida')
 for(let tick=2401;tick<5100;tick++){
  const previous=frame;frame=motor.sample(state,tick/60,tick*1000/60)
  peak=Math.max(peak,occupation(frame).central)
  assert.ok(occupation(frame).central<=6,'A centre restart does not gather the whole XI')
  for(let j=0;j<22;j++){
   const p=frame.players[j],old=previous.players[j]
   assert.ok(Math.hypot(p.mx-old.mx,p.mz-old.mz)<.1,'After a goal, players run back continuously without teleporting')
   for(let k=j+1;k<22;k++)minSeparation=Math.min(minSeparation,Math.hypot(p.mx-frame.players[k].mx,p.mz-frame.players[k].mz))
  }
  if(!motor.restart&&motor.flight){
   const conceding=home?'away':'home',taker=frame.players.find(p=>p.side===conceding&&p.kick>0&&Math.hypot(p.mx,p.mz)<.6)
   assert.ok(taker,'The visible taker actually kicks from the centre')
   assert.equal(motor.flight.side,conceding)
   for(const p of frame.players)if(p.key!==taker.key){
    assert.ok(direction(frame,p.side)*p.mx<=.1,'Non-takers are in their own half at kickoff')
    if(p.side!==conceding)assert.ok(Math.hypot(p.mx,p.mz)>=9.1,'Opponents are outside the centre circle')
   }
   restartedAt=tick/60-40;break
  }
 }
 assert.ok(restartedAt!==null,'Both sides restart after retrieving the ball')
 assert.ok(minSeparation>.48,'Returning bodies do not overlap')
 assert.equal(state.homeScore,0);assert.equal(state.awayScore,0)
 report.restarts.push({minute,scoringHome:home,restartedAt,peakCentral:peak,minSeparation})
}
mkdirSync('test-results/complexo-3d',{recursive:true})
writeFileSync('test-results/complexo-3d/distribuicao-campo-report.json',JSON.stringify(report,null,2)+'\n')
console.log('PASS: distributed 22-player formation at 0/45/46/93, real second-half kickoff, paused/final clocks, received passes in both halves and four physical post-goal restarts without a centre huddle.')
