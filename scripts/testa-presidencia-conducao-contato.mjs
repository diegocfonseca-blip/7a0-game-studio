import assert from 'node:assert/strict'
import * as THREE from 'three'
import {person,pose,conduzirBola3D,separarBolaDosPes3D,contatoPe3D,contatoLuvas3D} from '../src/escalacao/presidencia-atleta-3d.ts'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'

const body=person('#1b7a3d','#b9815b'),point=new THREE.Vector3(),closest=new THREE.Vector3()
let frames=0,maxSpeed=0,minGap=Infinity,maxReach=0,oldPenetrations=0
function clearance(p,ball){
 pose(body,p);body.group.updateMatrixWorld(true)
 let gap=Infinity
 for(const leg of body.legs){
  point.set(ball.x,ball.y,ball.z);leg.boot.worldToLocal(point)
  closest.set(THREE.MathUtils.clamp(point.x,-.075,.075),THREE.MathUtils.clamp(point.y,-.05,.05),THREE.MathUtils.clamp(point.z,-.14,.14))
  gap=Math.min(gap,point.distanceTo(closest)-.11)
 }
 return gap
}
for(const initialHeading of [0,Math.PI/2,-2])for(const speed of [.6,1.4,3.2,5.8])for(const turn of [0,2,5]){
 const p={mx:12,mz:-7,heading:initialHeading,distance:0,speed:0,kick:0,throwing:0},snapshot=JSON.stringify(p)
 let ball=conduzirBola3D(p)
 assert.equal(JSON.stringify(p),snapshot,'Contact helper must not mutate the supplied actor')
 for(let i=1;i<=240;i++){
  p.speed=i<180?speed:0
  if(p.speed>0){p.heading+=turn/60;p.mx+=Math.sin(p.heading)*p.speed/60;p.mz+=Math.cos(p.heading)*p.speed/60;p.distance+=p.speed/60}
  const previous={...ball};ball=conduzirBola3D(p,previous,1/60)
  assert.equal(ball.y,.11,'A conducted ball stays on the same pitch plane')
  const gap=clearance(p,ball),v=Math.hypot(ball.x-previous.x,ball.z-previous.z)*60,reach=Math.hypot(ball.x-p.mx,ball.z-p.mz)
  minGap=Math.min(minGap,gap);maxSpeed=Math.max(maxSpeed,v);maxReach=Math.max(maxReach,reach)
  assert.ok(gap>=-1e-8,`Ball penetrated the actual boot volume: ${gap} m`)
  assert.ok(v<25,`Conduction/stop/turn produced an implausible one-frame displacement: ${v} m/s`)
  assert.ok(reach<1.5,`Close control escaped the player's reach: ${reach} m`)
  const paused=conduzirBola3D(p,ball,0)
  assert.ok(Math.hypot(paused.x-ball.x,paused.z-ball.z)<1e-10,'A zero-time repeated pose preserves the ball')
  const oldReach=.38+.08*Math.sin(p.distance*5),old={x:p.mx+Math.sin(p.heading)*oldReach,y:.11,z:p.mz+Math.cos(p.heading)*oldReach}
  if(clearance(p,old)<-.01)oldPenetrations++
  frames++
 }
}
assert.ok(oldPenetrations>100,'The regression sample must reproduce the former fixed-centre boot penetration')
// The conduction solver shares only a reusable CPU rig with strike/glove
// measurement; invoking it must not leave transforms in either contact API.
const impact={mx:3,mz:-2,heading:1.2,distance:.4,speed:0,kick:.3,throwing:0}
const strike=contatoPe3D(impact),gloves=contatoLuvas3D({...impact,kick:0,save:1})
conduzirBola3D({...impact,kick:0,speed:5.8})
assert.deepEqual(contatoPe3D(impact),strike)
assert.deepEqual(contatoLuvas3D({...impact,kick:0,save:1}),gloves)
assert.equal(separarBolaDosPes3D(impact,strike),strike,'An already-tangent strike retains the exact official position/reference')
let transitionFrames=0,projectedFrames=0,transitionMaxSpeed=0,transitionMinGap=Infinity
for(const heading of [0,1.3])for(const turn of [0,2])for(const topSpeed of [1.4,5.8]){
 const p={mx:0,mz:0,heading,distance:32.93,speed:0,kick:0,throwing:0},samples=[]
 let ball=conduzirBola3D(p)
 samples.push({p:{...p},ball:{...ball}})
 // Actual motion is integrated at 60 Hz with bounded acceleration/braking;
 // the sequence stores every other frame, then the viewer samples at 240 Hz.
 for(let i=1;i<=180;i++){
  p.speed=i<=120?Math.min(topSpeed,p.speed+6/60):Math.max(0,p.speed-8/60)
  if(p.speed>0)p.heading+=turn/60
  p.mx+=Math.sin(p.heading)*p.speed/60;p.mz+=Math.cos(p.heading)*p.speed/60;p.distance+=p.speed/60
  ball=conduzirBola3D(p,ball,1/60)
  if(i%2===0)samples.push({p:Object.fromEntries(Object.entries(p).map(([key,value])=>[key,Math.fround(value)])),ball:{...ball}})
 }
 let previous
 for(let i=0;i<=720;i++){
  const at=i/8,index=Math.floor(at),a=samples[index],b=samples[Math.min(index+1,samples.length-1)],q=at-index
  const poseNow=Object.fromEntries(Object.keys(a.p).map(key=>[key,a.p[key]+(b.p[key]-a.p[key])*q]))
  const original={x:a.ball.x+(b.ball.x-a.ball.x)*q,y:.11,z:a.ball.z+(b.ball.z-a.ball.z)*q}
  const corrected=separarBolaDosPes3D(poseNow,original),gap=clearance(poseNow,corrected)
  if(corrected!==original)projectedFrames++
  transitionMinGap=Math.min(transitionMinGap,gap)
  assert.equal(corrected.y,original.y,'Post-interpolation collision correction preserves trajectory height')
  assert.ok(gap>=-1e-8,'Interpolated run/start/stop frames cannot put the sphere inside either boot')
  assert.deepEqual(separarBolaDosPes3D(poseNow,original),corrected,'Correction is pure and independent of previous camera frames')
  if(previous){const speed=Math.hypot(corrected.x-previous.x,corrected.z-previous.z)*240;transitionMaxSpeed=Math.max(transitionMaxSpeed,speed);assert.ok(speed<30,`Interpolation correction created a ball jump: ${speed} m/s`)}
  previous=corrected;transitionFrames++
 }
}
assert.ok(projectedFrames>0,'The regression sample must exercise post-interpolation corrections')
// Collisions arriving from different sides must be corrected locally, while
// safe airborne/outside balls remain completely unchanged.
let correctionCases=0
for(const distance of [0,.2,.5,1])for(const speed of [0,.2,1.4,5.8])for(const heading of [0,1.2]){
 const p={mx:4,mz:-3,distance,speed,heading,kick:0,throwing:0};pose(body,p);body.group.updateMatrixWorld(true)
 for(const leg of body.legs){
  const centre=leg.boot.getWorldPosition(new THREE.Vector3()),input={x:centre.x,y:Math.max(.11,centre.y),z:centre.z}
  const output=separarBolaDosPes3D(p,input)
  assert.ok(clearance(p,output)>=-1e-8,'A ball initially inside a boot leaves both volumes')
  assert.equal(output.y,input.y)
  assert.ok(Math.hypot(output.x-input.x,output.z-input.z)<.5,'Collision correction stays local')
  const airborne={x:centre.x,y:3,z:centre.z}
  assert.equal(separarBolaDosPes3D(p,airborne),airborne)
  correctionCases++
 }
}
// Real natural play also exercises the first receive() frame and sharp turns,
// not just synthetic motion aligned with the body's heading. The old motor
// moved sideways/backwards relative to that heading and let the ball drift
// 1.13 m away; the old receive() returned one intersecting frame before fixing
// it on the next tick. Neither regression is accepted by a looser axis limit.
const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}))
const natural=[]
for(const minute of [20,70]){
 const state={context:{id:`natural-contact-${minute}`,home:team('h'),away:team('a')},minute,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
 const motor=new MotorFutebol(state)
 let previous=motor.sample(state,0,0),owned=0,receives=0,lastReceiveStart=-1,maxReach=0,minGap=Infinity,maxSpeed=0,worstReach
 for(let i=1;i<=18000;i++){
  const frame=motor.sample(state,i/60,i*1000/60),owner=frame.players.find(p=>p.key===frame.owner)
  if(owner&&frame.phase==='dominio'&&!motor.keeperRelease){
   const reach=Math.hypot(frame.ball.x-owner.mx,frame.ball.z-owner.mz),gap=clearance(owner,frame.ball)
   const speed=Math.hypot(frame.ball.x-previous.ball.x,frame.ball.y-previous.ball.y,frame.ball.z-previous.ball.z)*60
   // Measured rig envelope is ~.688 m: advanced ankle + boot/toe volume +
   // regulation-ball radius. .75 m allows a small turning margin; geometry
   // still proves that the sphere is outside both boots in EVERY owned frame.
   assert.ok(reach<=.75,`Natural ${minute}/${i}: ball escaped close control (${reach} m)`)
   assert.ok(gap>=-1e-7,`Natural ${minute}/${i}: sphere penetrates a boot by ${-gap} m, including initial receive`)
   assert.ok(frame.ball.y>=.11-1e-8,'Natural close control stays above the pitch')
   assert.ok(speed<30,`Natural ${minute}/${i}: contact correction teleported the ball (${speed} m/s)`)
   if(reach>maxReach){maxReach=reach;worstReach={frame:i,key:owner.key,bootSurfaceGap:gap}}
   minGap=Math.min(minGap,gap);maxSpeed=Math.max(maxSpeed,speed);owned++
   if(motor.firstTouch&&motor.firstTouch.start!==lastReceiveStart){receives++;lastReceiveStart=motor.firstTouch.start}
  }
  previous=frame
 }
 assert.ok(owned>1000&&receives>10,'The full natural sample must contain repeated possession and first-reception frames')
 natural.push({minute,frames:18000,owned,receives,maxReach,minGap,maxSpeed,worstReach})
}
console.log(JSON.stringify({result:'PASS',frames,minSurfaceClearanceM:minGap,maxBallSpeedMps:maxSpeed,maxReachM:maxReach,formerPenetratingFrames:oldPenetrations,transitionFrames,projectedFrames,transitionMaxSpeed,transitionMinGap,correctionCases,natural,note:'Guided ground control; real boot bounds; starts/stops at 6/8 m/s², 30 Hz pose storage sampled at 240 Hz, local pure correction and 300 s natural play in both halves. Not a free-ball friction model.'},null,2))
