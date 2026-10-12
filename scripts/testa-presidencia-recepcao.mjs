import assert from 'node:assert/strict'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'reception',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#123456',awayColor:'#654321'}
const motor=new MotorFutebol(state);let controlled=0,previous
for(let i=0;i<7200;i++){
 const frame=motor.sample(state,i/60,i*1000/60),p=frame.players.find(p=>p.key===frame.owner)
 if(p?.control>0){
  controlled++;assert.ok(Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<.65,'First touch remains within foot reach')
  const old=previous?.players.find(a=>a.key===p.key)
  if(old?.control>0){assert.equal(p.mx,old.mx);assert.equal(p.mz,old.mz);assert.equal(p.heading,old.heading,'Receiver keeps facing the ball while cushioning it')}
 }
 previous=frame
}
assert.ok(controlled>10,'Natural passing produces visible controlled receptions')
for(const height of [0,3]){
 const m=new MotorFutebol(state);m.time=1;m.tickIndex=60;m.restart=null;m.owner='';m.phase='passe';
 m.flight={from:{x:0,z:0},to:{x:10,z:0},start:0,duration:2,receiver:'home:h10',side:'home',height,fromY:.11};
 m.players.forEach((p,i)=>{p.mx=-40+i*.8;p.mz=20});const defender=m.players.find(p=>p.key==='away:a8');defender.mx=5;defender.mz=0;
 const f=m.sample(state,61/60,1017)
 if(height){assert.ok(m.flight,'A defender cannot intercept an overhead cross with his feet');assert.ok(f.ball.y>3)}else{assert.equal(f.owner,defender.key,'A reachable ground pass can still be intercepted')}
}
console.log('PASS: controlled first touches, stable feet/facing, overhead cross not intercepted from the ground, ground interception preserved.')

// A receiver arriving sideways must not pull the ball abruptly through his
// body when control starts. Exercise both attacking directions and heights.
for(const side of ['home','away'])for(const height of [.11,.5]){
 const m=new MotorFutebol(state),key=side==='home'?'home:h10':'away:a10'
 m.players.forEach((p,i)=>{p.mx=-40+i*.8;p.mz=20})
 const p=m.players.find(p=>p.key===key);p.mx=0;p.mz=0;p.heading=-Math.PI/2
 m.ball={x:.4,y:height,z:0};m.flight=null;m.owner=''
 m.restart={point:{x:.4,z:0},side,taker:key};m.phase='dominio';m.nextDecision=0
 let old=m.sample(state,0,0),start
 for(let i=1;i<=26;i++){
  const f=m.sample(state,i/60,i*1000/60),receiver=f.players.find(p=>p.key===key)
  if(f.owner===key&&start===undefined){
   start=i;assert.deepEqual(f.ball,old.ball,'Taking possession preserves the incoming ball position')
   assert.ok(receiver.heading>0,'Receiver turns toward the incoming ball')
  }
  if(start!==undefined&&i-start<19){
   assert.ok(Math.hypot(f.ball.x-old.ball.x,f.ball.y-old.ball.y,f.ball.z-old.ball.z)<.06,'First touch cushions the ball without a visible jump')
   if(i>start)assert.equal(receiver.mx,old.players.find(p=>p.key===key).mx,'Feet remain planted during control')
   assert.deepEqual(m.sample(state,i/60,i*1000/60+5000).ball,f.ball,'Paused visual clock freezes the first touch')
  }
  old=f
 }
 assert.ok(start!==undefined,'Reception occurred');assert.equal(old.ball.y,.11,'Ball settles on the pitch')
}
console.log('PASS: continuous first touch from ground/low balls, both teams, planted feet and pause during reception.')
