import assert from 'node:assert/strict'
import fs from 'node:fs'
import {MotorFutebol,planejarLanceFutebol,quadroFutebol3D} from '../src/escalacao/presidencia-futebol-motor.ts'
import {criarRelogioLance,ajustarRelogioLance,tempoLance} from '../src/escalacao/presidencia-lance-tempo.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const base={context:{id:'audit',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const report=[];let frames=0
for(const home of [true,false])for(const outcome of ['gol','defendeu','trave','fora','isolou'])for(const speed of [.25,.5,1,4]){
 const id=`review:${home}:${outcome}:${speed}`,state={...base,context:{...base.context,id},visualClock:{seconds:20,sampledAt:20000,running:false}}
 const event={id,home,minute:20,startedAt:20000,speed,...(outcome==='gol'?{name:home?'h10':'a10',assist:home?'h2':'a2',phase:'shot'}:{outcome})}
 const plan=planejarLanceFutebol(state,event,20000),clock=criarRelogioLance(20000,speed)
 assert.ok(plan&&plan.durationMs>0)
 let maxSpeed=0,last,pausedChecked=false,now=20000
 while(tempoLance(clock,now)<=plan.durationMs+400){
  const elapsed=tempoLance(clock,now),live={...state,visualClock:{seconds:20+elapsed/1000,sampledAt:now,running:false}}
  if(outcome==='gol')live.goal={...event,plan,clock,phase:elapsed>=plan.durationMs?'confirmed':'shot'}
  else live.chance={...event,plan,clock}
  const f=quadroFutebol3D(live,now)
  assert.equal(f.players.length,22);assert.ok(f.ball.y>=.11-1e-6)
  if(last){
   const velocity=Math.hypot(f.ball.x-last.ball.x,f.ball.y-last.ball.y,f.ball.z-last.ball.z)/((elapsed-last.elapsed)/1000)
   maxSpeed=Math.max(maxSpeed,velocity)
   assert.ok(velocity<36,`${id}: velocidade irreal ${velocity}`)
  }
  if(outcome==='gol'&&elapsed<plan.durationMs)assert.ok((home?f.ball.x:-f.ball.x)-.11<52.5,'a bola inteira não cruza a linha antes da confirmação')
  if(!pausedChecked&&elapsed>plan.durationMs*.4){
   ajustarRelogioLance(clock,now,speed,false)
   const stopped=quadroFutebol3D({...live,paused:true},now+5000)
   assert.deepEqual(stopped.ball,f.ball,'pausa conserva a bola no lance')
   assert.deepEqual(stopped.players,f.players,'pausa conserva os corpos')
   now+=5000;ajustarRelogioLance(clock,now,speed,true);pausedChecked=true
  }
  last={ball:f.ball,elapsed};now+=1000/60/speed;frames++
 }
 report.push({home,outcome,speed,durationMs:Math.round(plan.durationMs),maxMetersPerSecond:+maxSpeed.toFixed(3)})
}
const clock=criarRelogioLance(0,.25)
ajustarRelogioLance(clock,1000,4,true);assert.equal(tempoLance(clock,1000),250)
assert.equal(tempoLance(clock,1250),1250)
ajustarRelogioLance(clock,1250,.5,false);assert.equal(tempoLance(clock,8000),1250)
ajustarRelogioLance(clock,8000,.5,true);assert.equal(tempoLance(clock,8500),1500)
// Consecutive official events start at the visible ball, not an autonomous hidden pass.
{
 const s={...base,context:{...base.context,id:'consecutive'},visualClock:{seconds:20,sampledAt:20000,running:false}}
 const first={id:'first',home:true,name:'h10',minute:20,startedAt:20000,phase:'shot'}
 const plan=planejarLanceFutebol(s,first,20000),clock=criarRelogioLance(20000)
 const one={...s,goal:{...first,plan,clock}}
 const a=quadroFutebol3D(one,20000+plan.durationMs*.5)
 const nextPlan=planejarLanceFutebol(one,{home:false,name:'a10'},20000+plan.durationMs*.5)
 assert.deepEqual(nextPlan.from,a.ball)
}
const m=new MotorFutebol(base),phases=new Set()
for(let i=0;i<18000;i++)phases.add(m.sample(base,i/60,i*1000/60).phase)
assert.ok(phases.has('lancamento'),'circulação oferece passes aéreos longos')
// Wide possession with a free teammate inside the box must produce a real
// airborne cross, land at a receiver and keep the authoritative score intact.
const crosses=[]
for(const side of ['home','away']){
 const motor=new MotorFutebol(base),dir=side==='home'?1:-1
 const winger=motor.players.find(p=>p.side===side&&p.pos==='LAT')
 const attacker=motor.players.find(p=>p.side===side&&p.pos==='ATA')
 for(const p of motor.players){p.mx=p.side===side?-dir*15:-dir*30;p.mz=(motor.players.indexOf(p)%11-5)*5}
 winger.mx=dir*32;winger.mz=28;attacker.mx=dir*40;attacker.mz=7
 motor.restart=null;motor.owner=winger.key;motor.ball={x:winger.mx,z:winger.mz,y:.11};motor.nextDecision=0
 let peak=0,receiver='',received=false
 for(let i=1;i<240;i++){
  const f=motor.sample(base,i/60,i*1000/60)
  if(f.phase==='cruzamento'){peak=Math.max(peak,f.ball.y);receiver=motor.flight?.receiver??receiver}
  if(receiver&&f.owner===receiver){received=true;break}
 }
 assert.equal(receiver,attacker.key,'cruzamento procura o atacante dentro da área')
 assert.ok(peak>1,'a bola do cruzamento sobe acima dos corpos baixos')
 assert.ok(received,'o destinatário domina a bola depois do cruzamento')
 crosses.push({side,peak,received})
}
assert.equal(base.homeScore,0);assert.equal(base.awayScore,0)
fs.mkdirSync('test-results/futebol-3d',{recursive:true})
fs.writeFileSync('test-results/futebol-3d/revisao-lances.json',JSON.stringify({frames,scenarios:report,phases:[...phases],crosses},null,2))
console.log(`PASS ${report.length} cenários, ${frames} quadros: passes/chutes com distância física, pausa, quatro velocidades, confirmação, cruzamentos dos dois lados e continuidade entre eventos; sem alterar placar.`)
