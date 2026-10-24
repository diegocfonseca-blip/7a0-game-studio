import assert from 'node:assert/strict';
import * as T from 'three';
import {BallTouchPresentation} from '../../src/escalacao/futebol3d/motion/ball-touch-presentation.mjs';
import {createBallControl} from '../../src/escalacao/futebol3d/motion/ball-control.mjs';
const controller={action:()=>null,nextRelease:()=>null};
const actor={key:'receiver',sourceAnchor:{x:0,z:0},keeper:false,lastHeading:0,presentationSpeed:0,footTriangles(){return[new T.Triangle(new T.Vector3(-.1,0,0),new T.Vector3(.1,0,0),new T.Vector3(0,.1,.2))]}};
for(const x of [.4,1,2.4]){
 const layer=new BallTouchPresentation();for(let i=0;i<60;i++){
  const frame={time:i/60,owner:'receiver',phase:'dominio',ball:{x,y:.11,z:.5+i*.01,rotation:[0,0,0,1]}},before=structuredClone(frame),result=layer.sample(frame,[actor],controller);layer.confirm(result.ball,[actor],result.diagnostic);
  assert.equal(result.ball.presentation,undefined);assert.equal(result.ball.x,frame.ball.x);assert.equal(result.ball.z,frame.ball.z);assert.equal(result.diagnostic.hasVisualControl,false);assert.equal(result.diagnostic.requiresPlayerApproach,true);assert.deepEqual(frame,before);
 }
}
// The avatar's actual approach, including one from rest, advances the gait
// anchor before animation is sampled. It never changes the ball or source p.
const c=createBallControl(actor),p={key:actor.key,mx:0,mz:0,speed:0,keeper:false},f={time:0,phase:'passe',ball:{x:0,y:.11,z:1.1},officialAction:{receiver:actor.key}};let previous=c.advance(f,p),total=0;
for(let i=1;i<=30;i++){const next=c.advance({...f,time:i/60},p),travel=Math.hypot(next.x-previous.x,next.z-previous.z);assert.ok(travel<=1.8/60+1e-8);total+=travel;previous=next;}
assert.ok(total>.2);assert.equal(p.mz,0);assert.equal(f.ball.z,1.1);
const miss=createBallControl(actor);miss.advance({...f,ball:{...f.ball,z:4}},p);assert.equal(miss.advance({...f,time:.1,ball:{...f.ball,z:4}},p).offset,0,'No distant avatar teleport to hide an inaccurate pass');
console.log('No attraction from early ownership at .4/1/2.4 m; real approach drives gait; distant miss remains unresolved');
