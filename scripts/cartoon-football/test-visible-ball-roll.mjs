import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {VisibleBallRoll} from '../../src/escalacao/futebol3d/motion/visible-ball-roll.mjs';
const roll=new VisibleBallRoll(),source=new Quaternion(),expected=new Quaternion();
let prior={x:0,y:.11,z:0};roll.sample(0,prior,source.toArray());
// Visible offset rotates around a carrier that changes direction. Compare
// every actual panel rotation with distance/radius on that rendered step.
for(let i=1;i<=180;i++){
 const t=i/60,p={x:2*t+.15*Math.sin(t*5),y:.11,z:t*t+.12*Math.cos(t*4)-.12},d=new Vector3(p.x-prior.x,0,p.z-prior.z),axis=new Vector3(d.z,0,-d.x).normalize();
 source.premultiply(new Quaternion().setFromAxisAngle(new Vector3(t,0,-1).normalize(),.2));
 expected.premultiply(new Quaternion().setFromAxisAngle(axis,d.length()/.11));
 const actual=new Quaternion().fromArray(roll.sample(t,p,source.toArray()));assert.ok(actual.angleTo(expected)<1e-6);
 assert.deepEqual(roll.sample(t,p,source.toArray()),actual.toArray(),'Paused frames cannot rotate twice');prior=p;
}
const oldSource=source.clone(),delta=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),.12);source.premultiply(delta);
const flight=new Quaternion().fromArray(roll.sample(3+1/60,{...prior,y:.3},source.toArray()));
assert.ok(flight.angleTo(expected.clone().premultiply(source.clone().multiply(oldSource.invert())))<1e-6,'Keep acquired flight-spin delta without discarding visible orientation');
assert.deepEqual(roll.sample(0,{x:0,y:.11,z:0},[0,0,0,1]),[0,0,0,1]);
console.log('Visible ball roll: curved path, pause, flight handoff and seek passed');
