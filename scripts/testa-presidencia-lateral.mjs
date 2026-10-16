import assert from 'node:assert/strict'
import * as THREE from 'three'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const base={context:{id:'throw-contact',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
for(const side of ['home','away'])for(const z of [-34,34])for(const speed of [1,4]){
 const state={...base,context:{...base.context,speed}},m=new MotorFutebol(state)
 const taker=m.players.find(p=>p.side===side&&!p.keeper)
 taker.mx=0;taker.mz=z
 m.ball={x:0,z,y:.11}
 m.prepareRestart('lateral',{x:0,z},side)
 const body=person('#1b7a3d','#b9815b');let preparation,previous,release
 for(let i=0;i<300;i++){
  const seconds=i/60,f=m.sample(state,seconds,seconds*1000/speed),p=f.players.find(p=>p.key===taker.key)
  if(m.throwIn&&!preparation)preparation={time:f.time,x:p.mx,z:p.mz,heading:p.heading}
  if(preparation&&!release){
   assert.equal(p.mx,preparation.x);assert.equal(p.mz,preparation.z)
   assert.equal(p.heading,preparation.heading,'Thrower keeps facing his target')
   assert.equal(p.kick,0,'No kicking animation during hand throw')
   if(previous)assert.ok(Math.hypot(f.ball.x-previous.ball.x,f.ball.y-previous.ball.y,f.ball.z-previous.ball.z)<.2,'Ball rises continuously without teleporting')
   assert.deepEqual(m.sample(state,seconds,seconds*1000/speed+5000).ball,f.ball,'Pause freezes the preparation')
  }
  assert.ok(f.ball.y>=.11-1e-6,'Ball stays above the ground')
  if((p.throwPreparation??0)>=.25){
   pose(body,p);body.group.updateMatrixWorld(true)
   const middle=body.hands.reduce((s,h)=>s.add(h.getWorldPosition(new THREE.Vector3())),new THREE.Vector3()).multiplyScalar(.5)
   assert.ok(middle.distanceTo(new THREE.Vector3(f.ball.x,f.ball.y,f.ball.z))<1e-8,'After pickup, ball follows both hands throughout preparation')
  }
  if(preparation&&m.flight){
   release=f;pose(body,p);body.group.updateMatrixWorld(true)
   const hands=body.hands.map(h=>h.getWorldPosition(new THREE.Vector3())),middle=hands[0].clone().add(hands[1]).multiplyScalar(.5)
   assert.ok(middle.distanceTo(new THREE.Vector3(f.ball.x,f.ball.y,f.ball.z))<1e-8,'Ball leaves the actual rendered hands')
   assert.ok(hands[0].distanceTo(hands[1])<.27,'Both hands surround the ball')
   assert.ok(f.ball.y>1.75,'Release happens above the head')
   assert.ok(f.time-preparation.time>=.59,'Throw has a visible preparation')
   assert.equal(m.flight.fromY,f.ball.y)
   const next=m.sample(state,seconds+1/60,(seconds+1/60)*1000/speed)
   assert.ok(Math.hypot(next.ball.x-f.ball.x,next.ball.z-f.ball.z)>0,'Ball travels to the teammate after release')
   assert.equal(next.players.find(p=>p.key===taker.key).mx,p.mx,'Feet remain planted during follow-through')
   break
  }
  previous=f
 }
 assert.ok(preparation&&release,'Throw completed on either touchline and for both sides')
}
console.log('PASS: eight throw-ins, gradual preparation, exact two-hand release, planted feet, pause and shared 1x/4x timeline.')
// A real substitution while preparing the throw must not orphan the ball.
for(const who of ['key','receiver']){
 const m=new MotorFutebol(base),taker=m.players.find(p=>p.key==='home:h1');taker.mx=0;taker.mz=-34
 m.ball={x:0,z:-34,y:.11}
 m.prepareRestart('lateral',{x:0,z:-34},'home')
 let frame
 for(let i=0;i<180&&!m.throwIn;i++)frame=m.sample(base,i/60,i*1000/60)
 assert.ok(m.throwIn)
 const outgoing=m.throwIn[who].split(':')[1],changed={...base,context:{...base.context,home:base.context.home.map(p=>p.id===outgoing?{...p,id:'sub',name:'Substitute'}:p)}}
 m.sample(changed,frame.time,frame.time*1000)
 assert.equal(m.phase,'lateral');assert.ok(m.restart,'A valid teammate takes over the restart')
 let distributed=false
 for(let i=1;i<=1200;i++){m.sample(changed,frame.time+i/60,frame.time*1000+i*1000/60);if(m.flight){distributed=true;break}}
 assert.ok(distributed,'Throw resumes after substituting the thrower or receiver')
}
console.log('PASS: substitutions of thrower/receiver during preparation resume with the real updated XI.')
