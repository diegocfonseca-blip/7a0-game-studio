import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {continuousHeading} from '../../src/escalacao/futebol3d/motion/heading-blend.mjs';
import {ContactOffset} from '../../src/escalacao/futebol3d/motion/contact-offset.mjs';
import {BallTouchPresentation} from '../../src/escalacao/futebol3d/motion/ball-touch-presentation.mjs';
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x)),token={};let state,previous;
// Wrapped source input crosses the opposite direction halfway through a
// recovery: a fresh shortest-arc blend would jump by PI at weight .5.
for(let i=0;i<=120;i++){
 const t=i/120,base=angle(3+t*.3),captured=0;state=continuousHeading(state,token,t,base,captured,.5);
 if(previous!==undefined)assert.ok(Math.abs(state.value-previous)<.01,'No branch flip inside a gesture');previous=state.value;
}
assert.ok(Math.abs(angle(continuousHeading(state,token,1,3.3,0,1).value))<1e-9,'Exact captured endpoint');
const offset=new ContactOffset();let velocity=new Vector3();
for(let i=0;i<120;i++){
 offset.step(new Vector3(i<60?.2:-.2,0,.05),1/120);
 assert.ok(offset.velocity.distanceTo(velocity)*120<=18.00001,'No acceleration impulse when the selected foot changes');
 velocity.copy(offset.velocity);assert.ok(offset.position.length()<=.320001);
}
// A hidden pre-release correction must not reappear when the action changes
// from the departing player to the next receiver after an official impulse.
const touch=new BallTouchPresentation();
const f=t=>({time:t,phase:'passe',ball:{x:t*12,y:.11,z:0,rotation:[0,0,0,1]}}),actions={action:()=>null,nextRelease:t=>t<=1?1:2};
touch.sample(f(.95),[],actions);const next=touch.sample(f(1.01),[],actions);assert.equal(next.diagnostic.offset,0);
console.log('Continuous arc, bounded correction acceleration, release handoff passed');
