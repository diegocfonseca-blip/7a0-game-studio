import assert from 'node:assert/strict';
import {boundedRootProgress} from '../../../src/escalacao/futebol3d/chibi/bounded-root-progress.mjs';
const speed=u=>Math.abs(9*(6*u-6*u*u)+7.5*(3*u*u-4*u+1)),plan=boundedRootProgress(speed,{duration:3});
assert(plan&&plan.after<plan.before*.92,'Reduce the middle sprint without changing the curve');
assert.equal(plan.sample(0),0);assert.equal(plan.sample(1),1);
assert(Math.abs(plan.sample(1e-7)/1e-7-1)<.01,'Keep initial velocity');
assert(Math.abs((1-plan.sample(1-1e-7))/1e-7-1)<.01,'Keep final velocity');
let previous=0,peak=0;for(let t=.0001;t<=1;t+=.0001){const u=plan.sample(t);assert(u>previous);peak=Math.max(peak,speed((u+previous)/2)*(u-previous)/.0001);previous=u}
assert(peak<plan.before*.93,'The inverted clock really lowers the rendered speed');
assert.equal(boundedRootProgress(()=>7,{duration:3}),null,'Leave normal runs unchanged');
assert.equal(boundedRootProgress(speed,{duration:.2}),null,'Do not retime a short contact transition');
console.log('PASS: monotone progress, fixed endpoints/tangents, unchanged normal runs, reduced measured peak');
