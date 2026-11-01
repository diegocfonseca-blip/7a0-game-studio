import assert from 'node:assert/strict';
import {prepareControlledApproach} from '../../../src/escalacao/futebol3d/chibi/controlled-ball-approach.mjs';
const start=1,end=2.1,ballAt=t=>({x:4*(t-start),y:.11,z:0});
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const original={sample:t=>({x:-.45+4.4*ease((t-start)/.75),z:0}),diagnostics:{preserved:true}};
const events=[{kind:'recebe',t:start,bola:ballAt(start)},{kind:'toque',t:end,start:1.65,mira:Math.PI/2,bola:ballAt(end)}],controls=[{start,end}];
const snapshots=Array.from({length:240},(_,i)=>ballAt(i/100));
const path=prepareControlledApproach(original,events,controls,{ballAt,ownedAt:()=>true});
assert(path.diagnostics.controlledApproaches[0].applied,'Repair an early stationary plant that abandons a rolling ball');
assert.deepEqual(path.sample(start),original.sample(start));assert.deepEqual(path.sample(end),original.sample(end));
assert.deepEqual(path.sample(.5),original.sample(.5));assert.deepEqual(path.sample(2.5),original.sample(2.5));
for(let t=start;t<=end;t+=.001){const p=path.sample(t),b=ballAt(t),q=path.sample(t+.0001);assert(Math.hypot(p.x-b.x,p.z-b.z)<.851);assert(Math.hypot(q.x-p.x,q.z-p.z)/.0001<9.51)}
assert.deepEqual(Array.from({length:240},(_,i)=>ballAt(i/100)),snapshots,'Never move the ball to a foot');
for(const options of [{ownedAt:t=>t<1.5},{ownedAt:()=>true,breaks:[{before:1.4,after:1.42}]}]){
 const q=prepareControlledApproach(original,events,controls,{ballAt,...options});assert.deepEqual(q.sample(1.7),original.sample(1.7),'A loss/restart must not be manufactured into successful control');
}
for(const modified of [[{...events[0],hands:true},events[1]],[events[0],{...events[1],cab:true}]]){
 const q=prepareControlledApproach(original,modified,controls,{ballAt,ownedAt:()=>true});assert.deepEqual(q.sample(1.7),original.sample(1.7));
}
const loose=prepareControlledApproach(original,events,[{...controls[0],loose:true}],{ballAt,ownedAt:()=>true});assert.deepEqual(loose.sample(1.7),original.sample(1.7));
console.log('PASS: continuous fixed-ball approach, exact contacts, speed/offset bounds, no ball mutation or invented control across possession loss, hands, headers and resets');
