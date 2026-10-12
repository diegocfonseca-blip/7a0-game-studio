import assert from 'node:assert/strict'
import * as THREE from 'three'
import {MotorFutebol} from '../src/escalacao/presidencia-futebol-motor.ts'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}))
const state={context:{id:'contact-test',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
for(const speed of [1,4])for(const assist of [undefined,'h8']){
 const motor=new MotorFutebol(state),goal={id:'goal-contact',home:true,name:'h10',assist,minute:20,phase:'shot',startedAt:0,speed}
 const duration=900/speed,boundary=assist?.3:.2
 motor.sample({...state,goal},0,0)
 const before=motor.sample({...state,goal},0,duration*(boundary-.001)),authorBefore=before.players.find(p=>p.id==='h10')
 assert.equal(authorBefore.kick,0,'Shot must not start while the assist is still travelling')
 const contact=motor.sample({...state,goal},0,duration*boundary),author=contact.players.find(p=>p.id==='h10')
 assert.ok(author.kick>.29,'Kick begins at the instant the incoming ball arrives')
 assert.ok(Math.abs(Math.hypot(contact.ball.x-author.mx,contact.ball.z-author.mz)-.38)<1e-8,'Ball is in front of the kicking foot, not inside the body')
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
 assert.equal(motor.sample(state,.8,1600).players.find(p=>p.id===keeper.id).save,0,'Keeper lowers his hands gradually before passing')
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
