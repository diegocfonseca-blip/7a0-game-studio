import assert from 'node:assert/strict';
import {footActionProximity as blend} from '../../../src/escalacao/futebol3d/chibi/foot-action-proximity.mjs';
const base={kind:'toque',region:'right',time:.7,contactAt:1,distance:3,reach:.4};
assert.equal(blend(base),0,'A distant runner remains in locomotion instead of striking air');
assert.equal(blend({...base,distance:.5}),1,'A nearby prepared strike keeps its captured pose');
for(const time of [.96,.98,1,1.01,1.1,1.4])assert.equal(blend({...base,time}),1,'Impact and striking follow-through are preserved');
assert.equal(blend({...base,kind:'recebe',time:1.3}),0,'A rolling-away reception releases back to running');
assert.equal(blend({...base,kind:'recebe',time:1.04}),1,'Do not erase the first touch');
assert.equal(blend({...base,kind:'recebe',time:1.3,distance:.5}),1);
assert.equal(blend({...base,region:'chest'}),1,'Chest/hand/head captures are separate');
assert.equal(blend({...base,contactAt:undefined}),1,'Unplanned gestures cannot receive foot-contact timing');
for(const kind of ['recebe','toque']){let previous=blend({...base,kind,time:.5});for(let time=.501;time<1.4;time+=.001){const value=blend({...base,kind,time});assert(value>=0&&value<=1);assert(Math.abs(value-previous)<.014,'Continuous entry and release');previous=value}}
console.log('PASS: approach/reception blending preserves exact foot impacts and strike continuation, with continuous transitions');
