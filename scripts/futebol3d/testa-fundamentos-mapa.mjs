import assert from 'node:assert/strict';
import {groundDelivery,sampleGroundDelivery} from '../../src/escalacao/futebol3d/motion/map-ball-flight.mjs';
import {rootTrack,controlledRoot} from '../../src/escalacao/futebol3d/motion/map-root-track.mjs';
import {VisualPlayerCollisions} from '../../src/escalacao/futebol3d/visual-player-collisions.mjs';
const from={x:1,y:.11,z:2},to={x:19,y:.11,z:26},flight=groundDelivery(2,4,from,to);
const proof=JSON.stringify(flight);let previous=0;
for(let i=0;i<=120;i++){const p=sampleGroundDelivery(flight,2+i/60),d=Math.hypot(p.x-from.x,p.z-from.z);assert(d>=previous-1e-8);assert(Math.abs((p.x-from.x)*24-(p.z-from.z)*18)<1e-8,'A rolling pass cannot curve toward a receiver');previous=d}
assert.deepEqual(sampleGroundDelivery(flight,2),from);assert.deepEqual(sampleGroundDelivery(flight,4),to);assert.equal(sampleGroundDelivery(flight,1.9),null);assert.equal(sampleGroundDelivery(flight,4.1),null);
to.x=200;from.z=-200;assert.equal(JSON.stringify(flight),proof,'Moving a player/endpoint after preparation cannot attract an airborne ball');
assert(flight.speed-flight.deceleration*flight.duration>0,'Friction must not reverse the pass');
const knots=[{t:2,x:1,z:0},{t:3,x:0,z:1}],copy=JSON.stringify(knots);assert.deepEqual(rootTrack(knots,2),{x:1,z:0});assert.deepEqual(rootTrack(knots,3),{x:0,z:1});assert.deepEqual(rootTrack(knots,5),{x:0,z:0});assert.equal(JSON.stringify(knots),copy);
let maxStep=0,last=rootTrack(knots,0);for(let i=1;i<300;i++){const next=rootTrack(knots,i/60);maxStep=Math.max(maxStep,Math.hypot(next.x-last.x,next.z-last.z));last=next}assert(maxStep<.05,'Root contacts must be approached continuously');
const nav=new VisualPlayerCollisions({radius:.32,budget:.42});let minimum=Infinity;
for(let i=0;i<=120;i++){const time=i/60,players=[{key:'a',mx:-2+2*time,mz:0,speed:2,heading:0,navigationVelocity:{x:2,z:0}},{key:'b',mx:2-2*time,mz:0,speed:2,heading:0,navigationVelocity:{x:-2,z:0}}],snapshot=JSON.stringify(players),frame={time,phase:'dominio',players};
 const n=nav.sample(frame),vs=players.map(p=>{const o=n.positions.get(p.key);return{key:p.key,sourceX:p.mx,sourceZ:p.mz,rootX:p.mx+o.x,rootZ:p.mz+o.z,x:p.mx+o.x,z:p.mz+o.z,y:1,radius:.22,freedom:1}});nav.finalize(vs);minimum=Math.min(minimum,Math.hypot(vs[0].rootX-vs[1].rootX,vs[0].rootZ-vs[1].rootZ));assert.equal(JSON.stringify(players),snapshot,'Navigation cannot write into official positions')}
assert(minimum>=.37,'Opposite runners cannot pass through one another even when body heading differs from movement');
// Overtaking with a lateral gap: the avoidance normal must widen that gap.
// The old arbitrary normal steered the faster runner directly into his rival.
const overtake=new VisualPlayerCollisions({radius:.32,budget:.42});
const approaching={time:0,phase:'dominio',players:[{key:'fast',mx:-.3,mz:0,heading:0,speed:4,navigationVelocity:{x:0,z:4}},{key:'slow',mx:.3,mz:1.5,heading:0,speed:0,navigationVelocity:{x:0,z:0}}]};
const avoidance=overtake.sample(approaching).positions;
assert(avoidance.get('fast').x<0&&avoidance.get('slow').x>0,'Navigation must select the free side instead of first crossing an opponent');
console.log('PASS: fixed contact endpoints, no homing, friction, bounded continuous body track, predictive separation, immutable source');

const spans=[{start:2,end:3,from:{x:11,z:3},to:{x:12,z:4}}];
for(const source of [{x:10,z:3},{x:12,z:4}]){const offset=controlledRoot(spans,2.5,source);assert.equal(source.x+offset.x,11.5);assert.equal(source.z+offset.z,3.5)}
assert.equal(controlledRoot(spans,4,{x:10,z:3}),null);
console.log('PASS: a moving tactical anchor cannot break the control path between measured contacts');

assert.equal(groundDelivery(0,1,{x:0,y:.11,z:0},{x:10,y:.11,z:0},{trajectory:'air'}),null,'Low endpoints do not make a lob a ground pass');
