import assert from 'node:assert/strict';
import {receivingRollIntent,verifiedControlTiming,gaitPhaseAtContact,planVerifiedDribbles} from '../../../src/escalacao/futebol3d/chibi/verified-dribble-plan.mjs';
import {capturedActionTime} from '../../../src/escalacao/futebol3d/chibi/captured-kick-timing.mjs';
const receive={kind:'recebe',key:'a',t:1,bola:{x:0,y:.11,z:0}},next={key:'a',t:1.5,bola:{x:2,y:.11,z:0},verifiedGroundTouch:{t:1.5}};
const sample=()=>({owner:'a',ball:{y:.11}}),snapshot=JSON.stringify([receive,next]);
assert.equal(receivingRollIntent(receive,next,sample).heading,Math.PI/2);
assert.equal(receivingRollIntent(receive,{...next,verifiedGroundTouch:undefined},sample),null);
assert.equal(receivingRollIntent(receive,next,()=>({owner:'b',ball:{y:.11}})),null);
for(const patch of [{hands:true},{goleiro:true},{pickup:true},{firstTime:'release'},{bola:{...receive.bola,y:.5}}])assert.equal(receivingRollIntent({...receive,...patch},next,sample),null);
assert.equal(JSON.stringify([receive,next]),snapshot);
for(const gap of [.12,.3,1]){
 const raw=2/3,plan=verifiedControlTiming(next,{raw,end:2,earliestStart:next.t-gap});
 assert(Math.abs(plan.start+plan.touch-next.t)<1e-9);
 assert(Math.abs(capturedActionTime({...plan,base:plan.clipStart,dur:plan.duration},plan.touch)-raw)<1e-9);
 assert(plan.duration<=.341);assert(plan.start>=next.t-gap-1e-9);
}
console.log('PASS: first touch uses verified fixed roll, preserves source/ownership/height, compact captured push has an exact impact');
for(const gait of [{cycles:2,duration:1.2,phase:.16},{cycles:1,duration:.8,phase:.9}])for(const raw of [.1,.4,.667]){
 const phase=gaitPhaseAtContact(gait,raw),time=((phase/gait.cycles+gait.phase)%1)*gait.duration;
 assert(Math.abs(time-raw)<1e-9,'The ordinary gait must resume on the same captured contact phase');
}
const c=t=>({id:'carry:'+t,key:'a',t,kind:'carry',verifiedGroundTouch:{t}}),raw=[c(.7),c(.75),c(1.25),c(1.3),c(1.35),{id:'pass',kind:'toque',key:'a',t:1.5}];
const rawSnapshot=JSON.stringify(raw),choices=planVerifiedDribbles(raw);
assert.equal(choices.filter(c=>c.capture).length,1);
assert.equal(choices[0].reason,'verified-captured-push');assert.equal(choices[1].reason,'same-sustained-foot-contact');
assert(choices.slice(2).every(c=>!c.capture&&c.reason==='part-of-immediate-release'));
assert.equal(JSON.stringify(raw),rawSnapshot,'Combining visual pushes cannot rewrite the source impulses or pass');
console.log('PASS: sustained contacts are grouped and imminent passes retain their preparation');
