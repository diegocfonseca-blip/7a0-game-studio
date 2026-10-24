import assert from 'node:assert/strict';
import * as T from 'three';
import {BallTouchPresentation} from '../../src/escalacao/futebol3d/motion/ball-touch-presentation.mjs';
import {FootballActionController} from '../../src/escalacao/futebol3d/football-action-controller.mjs';
import {criarBolaFutebol3D,posicionarBolaFutebol3D} from '../../src/escalacao/presidencia-bola-3d.ts';

const actor={key:'a',keeper:false,sourceAnchor:{x:0,z:0},lastHeading:0,presentationSpeed:2,footTriangles(side){const z=this.z??.2,x=side==='right'?.04:-.13;return[new T.Triangle(new T.Vector3(x-.06,.02,z),new T.Vector3(x+.06,.02,z),new T.Vector3(x,.08,z+.20))]}},controller=new FootballActionController([{key:'a',start:1.35,time:2,end:2.5,direction:[0,0,1]}]);
let maximum=0,speed=0,touches=0;const presentation=new BallTouchPresentation();
for(let i=0;i<=120;i++){
 const time=i/60;actor.z=.10+time*.20;
 const f={time,owner:'a',phase:'dominio',ball:{x:.04,y:.11,z:.55,rotation:[0,0,0,1]},players:[],official:{score:[0,0],events:[]}},source=JSON.stringify(f),r=presentation.sample(f,[actor],controller);
 maximum=Math.max(maximum,r.diagnostic.offset);speed=Math.max(speed,r.diagnostic.offsetVelocity);touches+=Number(r.diagnostic.phase==='touch');assert.equal(JSON.stringify(f),source);
 assert.ok(r.diagnostic.offset<=.320001);assert.equal(r.ball.presentation?.y??r.ball.y,.11);
 if(time>=1.95)assert.ok((r.diagnostic.offset??0)<1e-8,'No visual offset at the official source impulse');
 if(i===60){const q=new T.Quaternion().fromArray(r.ball.rotation),dz=(r.ball.presentation?.z??f.ball.z)-f.ball.z,expected=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),dz/.11);assert.ok(q.angleTo(expected)<1e-5,'Panels roll over the visible correction, not just the raw source path');}
}
assert.equal(maximum,0,'The player approaches; visual possession never attracts the ball');assert.equal(speed,0,'No correction velocity may pull a reception');
const goal={time:2.1,phase:'gol',ball:{x:53,y:.2,z:0,presentation:{x:54,y:.3,z:.2},rotation:[0,0,0,1]}};
assert.equal(presentation.sample(goal,[actor],controller).ball,goal.ball,'Preserve the canonical net/keeper presentation');
const restart={...goal,phase:'falta',restart:{type:'falta'},ball:{x:4,y:.11,z:2,rotation:[0,0,0,1]}};assert.equal(presentation.sample(restart,[actor],controller).ball,restart.ball,'Never carry a visual dribble offset into an official restart');
assert.equal(presentation.sample({...goal,time:0,ball:{x:0,y:.11,z:0,rotation:[0,0,0,1]}},[],controller).diagnostic.offset,0,'Backwards seek resets transient contact');
actor.z=.24;const pending=new BallTouchPresentation(),touchFrame={time:0,owner:'a',phase:'dominio',ball:{x:.04,y:.11,z:.55,rotation:[0,0,0,1]}},probe=pending.sample(touchFrame,[actor],new FootballActionController());assert.equal(probe.diagnostic.phase,'first-touch');actor.z-=.2;pending.confirm(probe.ball,[actor],probe.diagnostic);assert.equal(probe.diagnostic.phase,'awaiting-boot');assert.equal(probe.diagnostic.hasVisualControl,false,'A later collision correction cannot leave a falsely registered touch');
const open=new FootballActionController([{key:'a',time:1,start:.4,end:1.5,direction:[0,0,-1],approachHeading:Math.PI/2}]);assert.ok(Math.abs(open.prepare({},'a',1,0,5)-Math.PI/2)<1e-9,'Open-body pass approaches its fitted pelvis, not a backwards run');
const ball=criarBolaFutebol3D(),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),1.3);posicionarBolaFutebol3D(ball,{time:1,ball:{x:2,y:.11,z:3,rotation:q.toArray()}});ball.updateMatrixWorld(true);const shadow=ball.getObjectByName('ball-ground-contact'),normal=new T.Vector3(0,0,1).applyQuaternion(shadow.getWorldQuaternion(new T.Quaternion()));
assert.ok(normal.y>.999);assert.ok(Math.abs(shadow.getWorldPosition(new T.Vector3()).y-.007)<1e-8);assert.equal(ball.userData.radius,.11);assert.ok(ball.quaternion.angleTo(q)<1e-8);
console.log({maximum,speed,touches,sourceUnchanged:true,contactOffset:0,physicalBallDiameter:.22,shadowRemainsHorizontal:true});
