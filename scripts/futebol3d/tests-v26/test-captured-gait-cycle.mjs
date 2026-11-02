import assert from 'node:assert/strict';
import {capturedGaitCycles,measureCapturedGait,gaitTime} from '../../../src/escalacao/futebol3d/chibi/captured-gait-cycle.mjs';
// Each foot has its own signal: the two alternating feet must not be counted
// as two full strides. Uneven ball-control steps can still share a period.
const capture=(cycles,variation=0)=>Array.from({length:240},(_,i)=>[0,1].map(side=>{
 const x=i/240*2*Math.PI,phase=x*cycles+side*Math.PI;
 return[.1*(side?1:-1),.1+.16*(1+Math.sin(phase))+.01*variation*Math.sin(x),.4*Math.cos(phase)+.01*variation*Math.sin(x)];
}));
for(const cycles of [1,2,3,4])assert.equal(capturedGaitCycles(capture(cycles,1)),cycles);
assert.equal(capturedGaitCycles(Array.from({length:240},()=>[[0,0,0],[0,0,0]])),1);
const a=measureCapturedGait(capture(1),1),b=measureCapturedGait(capture(2),2);
assert.equal(b.cycles,2);assert(Math.abs(a.rawDistance-b.rawDistance)<.02,'Duplicating a capture must not double its per-stride distance');
const phase=.7,dt=.01,rate=3;
assert(Math.abs((gaitTime(b,phase+rate*dt)-gaitTime(b,phase))/dt-b.duration/b.cycles*rate)<1e-8);
console.log('Captured gait cycle detection: repeated strides, alternating feet, idle and distance/time invariance passed');
