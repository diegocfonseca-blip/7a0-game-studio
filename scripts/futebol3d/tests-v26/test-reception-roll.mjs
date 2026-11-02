import assert from 'node:assert/strict';
import {receptionRoll} from '../../../src/escalacao/futebol3d/chibi/reception-roll.mjs';
import {sampleGroundDelivery} from '../../../src/escalacao/futebol3d/motion/map-ball-flight.mjs';
const from={kind:'recebe',key:'receiver',t:0,bola:{x:0,y:.11,z:0}},to={kind:'recebe',key:'opponent',t:1,bola:{x:3,y:.11,z:0}};
const sample=t=>({phase:'dominio',owner:t<.8?'receiver':'opponent',ball:{x:3*t,y:.11,z:.1*Math.sin(Math.PI*t)}}),before=JSON.stringify({from,to});
const fit=receptionRoll(from,to,sample);assert(fit,'Small spring corrections can use a contact-constrained roll');
assert.deepEqual(sampleGroundDelivery(fit,0),from.bola);assert.deepEqual(sampleGroundDelivery(fit,1),to.bola);
let lastSpeed=Infinity;
for(let t=.01;t<=1;t+=.01){const a=sampleGroundDelivery(fit,t-.01),b=sampleGroundDelivery(fit,Math.min(1,t)),v=Math.hypot(b.x-a.x,b.z-a.z)/.01;assert(v<=lastSpeed+1e-7,'No new acceleration without another foot contact');lastSpeed=v;assert.equal(sample(t).owner,t<.8?'receiver':'opponent')}
assert.equal(JSON.stringify({from,to}),before);
assert.equal(receptionRoll(from,to,sample,[{t:.5}]),null,'Do not erase an actual intermediate push');
for(const modified of [t=>({...sample(t),phase:t>.4?'falta':'dominio'}),t=>({...sample(t),ball:{...sample(t).ball,y:t>.4?1:.11}}),t=>({...sample(t),ball:{...sample(t).ball,z:3*Math.sin(Math.PI*t)}})])assert.equal(receptionRoll(from,to,modified),null);
assert.equal(receptionRoll({...from,hands:true},to,sample),null);
assert.equal(receptionRoll(from,{...to,cab:true},sample),null);
console.log('PASS frictional reception roll, exact contacts, unchanged possession and rejection of flight/restart/intermediate impulse/large deviation');
