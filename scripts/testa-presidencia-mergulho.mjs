import assert from 'node:assert/strict'
import * as THREE from 'three'
import {MotorFutebol,quadroFutebol3D} from '../src/escalacao/presidencia-futebol-motor.ts'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'dive-test',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const rig=person('#e0c234','#b9815b',true),corner=new THREE.Vector3()
for(const home of [true,false])for(const speed of [1,4]){
 const motor=new MotorFutebol(state),chance={id:'parry-1',home,minute:20,startedAt:0,outcome:'defendeu',speed}
 motor.sample({...state,chance},0,0)
 for(let ms=120;ms<=600;ms+=20){
  const frame=motor.sample({...state,chance},ms/1000,ms/speed),keeper=frame.players.find(p=>p.keeper&&p.side===(home?'away':'home'))
  pose(rig,keeper);rig.group.updateMatrixWorld(true)
  if(Math.abs(keeper.dive??0)>1e-6){
   let low=Infinity
   rig.group.traverse(node=>{if(!(node instanceof THREE.Mesh))return;node.geometry.computeBoundingBox();const b=node.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){corner.set(x,y,z);node.localToWorld(corner);low=Math.min(low,corner.y)}})
   assert.ok(Math.abs(low)<1e-8,'Diving body has ground contact without clipping any mesh bounds')
  }
  if(ms===600){
   assert.equal(Math.abs(keeper.dive),1)
   const hands=rig.hands.reduce((sum,hand)=>sum.add(hand.getWorldPosition(new THREE.Vector3())),new THREE.Vector3()).multiplyScalar(.5)
   assert.ok(hands.distanceTo(new THREE.Vector3(frame.ball.x,frame.ball.y,frame.ball.z))<1e-8,'Ball reaches actual gloves at the instant of the save')
   const paused=motor.sample({...state,chance},ms/1000,ms/speed)
   assert.deepEqual(paused,frame,'Paused save does not drift')
  }
 }
 const clearing=motor.sample(state,.6,610/speed),keeper=clearing.players.find(p=>p.keeper&&p.side===(home?'away':'home'))
 assert.equal(Math.abs(keeper.dive),1,'Clearing the event preserves the fallen pose')
 let last=1
 for(let t=.62;t<=1.52;t+=.02){const frame=motor.sample(state,t,t*1000/speed),p=frame.players.find(p=>p.key===keeper.key);assert.ok(Math.abs(p.dive??0)<=last+1e-8,'Recovery is gradual');last=Math.abs(p.dive??0)}
 assert.ok(last<1e-6,'Keeper stands again after recovery')
}
console.log('PASS: lateral save on both ends at 1x/4x, exact glove contact, full-body ground bounds, pause and gradual recovery after the event.')
// Shared simulation clock, including a speed change in the middle of a shot.
{
 const chance={id:'parry-clock-1',home:true,minute:20,startedAt:0,outcome:'defendeu',speed:1}
 const motor=new MotorFutebol(state)
 const clockState=(seconds,sampledAt,running,rate)=>({...state,chance,paused:!running,visualClock:{seconds,sampledAt,running,rate}})
 motor.sample(clockState(0,0,true,1),0,0)
 const before=motor.sample(clockState(.3,300,false,1),.3,300)
 const held=motor.sample(clockState(.3,300,false,1),.3,5300)
 assert.deepEqual(held,before,'A paused live shot cannot continue on wall-clock time')
 // 75 real milliseconds at 4x finish the remaining .3 seconds of the save.
 const accelerated=motor.sample(clockState(.3,5300,true,4),.6,5375)
 const keeper=accelerated.players.find(p=>p.keeper&&p.side==='away')
 assert.equal(Math.abs(keeper.dive),1,'A speed change affects the shot already in progress')
 pose(rig,keeper);rig.group.updateMatrixWorld(true)
 const hands=rig.hands.reduce((v,h)=>v.add(h.getWorldPosition(new THREE.Vector3())),new THREE.Vector3()).multiplyScalar(.5)
 assert.ok(hands.distanceTo(new THREE.Vector3(accelerated.ball.x,accelerated.ball.y,accelerated.ball.z))<1e-8)
}
console.log('PASS: in-progress save uses shared simulation time across a five-second pause and a change to 4x.')

{
 const previous={...state,paused:true,visualClock:{seconds:4,sampledAt:1000,running:false,rate:1}}
 quadroFutebol3D(previous,1000)
 const latest={...previous,visualClock:{...previous.visualClock,sampledAt:1500},chance:{id:'stale-camera-1',home:true,minute:20,startedAt:1100,outcome:'defendeu'}}
 const fresh=quadroFutebol3D(latest,1500)
 assert.deepEqual(quadroFutebol3D(previous,1510),fresh,'A stale camera cannot undo the new official event')
 assert.deepEqual(quadroFutebol3D(latest,1520),fresh,'Returning to the latest camera keeps exactly the same play')
}
console.log('PASS: obsolete map frame cannot clear or recreate the shared official play.')
