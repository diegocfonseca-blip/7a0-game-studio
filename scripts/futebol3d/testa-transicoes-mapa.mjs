import assert from 'node:assert/strict';
import {prepareBodyTrack} from '../../src/escalacao/futebol3d/motion/map-root-track.mjs';
import {RotacaoBola3D} from '../../src/escalacao/presidencia-bola-rotacao.ts';

// A receiver running at 7 m/s brakes into a fixed contact, then recovers.
// Both contacts are immutable; finite-difference velocities must also join.
const source=t=>({x:7*t,z:0});
const knots=[{t:2,x:0,z:0},{t:2.6,x:-2.8,z:0}];
const controls=[{start:2,end:2.6,from:{x:14,z:0},to:{x:15.4,z:0}}];
const snapshot=JSON.stringify({knots,controls}),track=prepareBodyTrack(knots,controls,source);
const world=t=>source(t).x+track(t).x;
const velocity=t=>(world(t+1e-5)-world(t-1e-5))/2e-5;
assert(Math.abs(world(2)-14)<1e-9);assert(Math.abs(world(2.6)-15.4)<1e-9);
for(const t of [.4,2,2.6,3])assert(Math.abs(velocity(t-1e-4)-velocity(t+1e-4))<.03,'The support transition cannot cancel body velocity in one frame');
assert.equal(JSON.stringify({knots,controls}),snapshot);
for(let t=1;t<4;t+=1/120)assert(Math.abs(track(t).x)<=3+1e-8);

const ball=new RotacaoBola3D(.11,{x:0,y:1.5,z:0,held:true});
ball.step({x:0,y:1.6,z:.05,held:true},1/60);
assert.deepEqual(ball.inspect().angularVelocity,[0,0,0]);
ball.step({x:.1,y:1.65,z:.2,held:false},1/60);
assert(Math.hypot(...ball.inspect().angularVelocity)>1,'A hand release must start airborne spin');
const q=ball.quaternion.clone();ball.step({x:.2,y:1.7,z:.35},1/60);
assert(q.angleTo(ball.quaternion)>.01,'Airborne spin must persist after release');
ball.step({x:.2,y:1.7,z:.35,held:true},1/60);assert.deepEqual(ball.inspect().angularVelocity,[0,0,0]);
const frozen=ball.quaternion.toArray();ball.step({x:.4,y:1.8,z:.5},0);assert.deepEqual(ball.quaternion.toArray(),frozen,'Pause must keep the ball still');
console.log('PASS: exact fixed contacts, continuous approach/control/recovery, bounded offsets, throw spin and paused rotation');
