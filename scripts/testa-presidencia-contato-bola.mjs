import assert from 'node:assert/strict'
import * as THREE from 'three'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'contact-test',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const strikeBody=person('#1b7a3d','#b9815b'),triangle=new THREE.Triangle(),ballPoint=new THREE.Vector3(),closestPoint=new THREE.Vector3()
function distanceToVisibleBoot(player,ball){
 pose(strikeBody,player);strikeBody.group.updateMatrixWorld(true)
 const boot=strikeBody.legs[1].boot,geometry=boot.geometry,vertices=geometry.attributes.position,indices=geometry.index
 ballPoint.set(ball.x,ball.y,ball.z);let minimum=Infinity
 for(let i=0;i<(indices?.count??vertices.count);i+=3){
  const vertex=(target,k)=>target.fromBufferAttribute(vertices,indices?indices.getX(i+k):i+k).applyMatrix4(boot.matrixWorld)
  vertex(triangle.a,0);vertex(triangle.b,1);vertex(triangle.c,2)
  if(triangle.getArea()<1e-12)continue
  triangle.closestPointToPoint(ballPoint,closestPoint);minimum=Math.min(minimum,closestPoint.distanceTo(ballPoint))
 }
 return minimum
}
for(const speed of [1,4])for(const assist of [undefined,'h8']){
 const motor=new MotorFutebol(state),goal={id:'goal-contact',home:true,name:'h10',assist,minute:20,phase:'shot',startedAt:0,speed}
 const duration=900/speed,boundary=assist?.3:.2
 motor.sample({...state,goal},0,0)
 const before=motor.sample({...state,goal},0,duration*(boundary-.001)),authorBefore=before.players.find(p=>p.id==='h10')
 assert.equal(authorBefore.kick,0,'Shot must not start while the assist is still travelling')
 const contact=motor.sample({...state,goal},0,duration*boundary),author=contact.players.find(p=>p.id==='h10')
 assert.ok(author.kick>.29,'Kick begins at the instant the incoming ball arrives')
 // The old .38 m body-centre offset ignored the actual striking foot's
 // lateral position. Measure the visible shoe triangles independently of
 // the engine's boot-box anchor: neither a gap nor penetration is accepted.
 assert.ok(Math.abs(distanceToVisibleBoot(author,contact.ball)-.11)<.0005,'The regulation ball touches the visible kicking boot at the exact shot instant')
 assert.ok(Math.abs(contact.ball.y-.11)<1e-8,'The shot begins on the grass, with the ball resting on its radius')
 const after=motor.sample({...state,goal},0,duration*(boundary+.01))
 assert.ok(Math.hypot(after.ball.x-contact.ball.x,after.ball.z-contact.ball.z)>0)
}
for(const home of [true,false]){
 const motor=new MotorFutebol(state),chance={id:'catch-2',home,minute:20,startedAt:0,outcome:'defendeu'}
 motor.sample({...state,chance},0,0)
 const frame=motor.sample({...state,chance},0,600),keeper=frame.players.find(p=>p.keeper&&p.side===(home?'away':'home'))
 assert.equal(keeper.save,1)
 const body=person('#d6b329','#b9815b',true);pose(body,keeper);body.group.updateMatrixWorld(true)
 const middle=body.hands.reduce((sum,hand)=>sum.add(hand.getWorldPosition(new THREE.Vector3())),new THREE.Vector3()).multiplyScalar(.5)
 assert.ok(middle.distanceTo(new THREE.Vector3(frame.ball.x,frame.ball.y,frame.ball.z))<.05,'Saved ball sits between the actual articulated hands')
 assert.equal(motor.sample(state,0,800).players.find(p=>p.id===keeper.id).save,1,'Catch transitions continuously into distribution')
 let lastSave=1,intermediateSave=false
 for(let sample=1;sample<=7;sample++){
  const seconds=sample*.15,save=motor.sample(state,seconds,800+seconds*1000).players.find(p=>p.id===keeper.id).save??0
  assert.ok(save>=0&&save<=lastSave+1e-8,'The keeper lowers his hands continuously while recovering')
  if(save>0&&save<1)intermediateSave=true
  lastSave=save
 }
 assert.ok(intermediateSave,'Recovery must contain intermediate poses, not an abrupt arm reset')
 assert.equal(lastSave,0,'The keeper finishes recovering and can distribute the ball')
}
assert.equal(state.homeScore,0)
console.log('PASS: assist → foot → shot at 1x/4x and saved ball between goalkeeper hands on both sides; official score untouched.')
{
 const motor=new MotorFutebol(state);let previous=null,observedPass=false,observedThrow=false;
 for(let i=0;i<18000;i++){
  const frame=motor.sample(state,i/60,i*1000/60);
  for(const player of frame.players){
   const old=previous?.players.find(p=>p.key===player.key);
   if(old?.kick>0&&player.kick>0){assert.ok(Math.abs(player.heading-old.heading)<1e-8,'Passer keeps facing the pass during the kicking gesture');observedPass=true}
   if(player.throwing>0){assert.equal(player.kick,0,'Throw-in uses hands, never a simultaneous kicking leg');observedThrow=true}
  }
  previous=frame;
 }
 assert.ok(observedPass&&observedThrow);
 console.log('PASS: natural passes preserve their direction and throw-ins do not trigger a kick.');
}
