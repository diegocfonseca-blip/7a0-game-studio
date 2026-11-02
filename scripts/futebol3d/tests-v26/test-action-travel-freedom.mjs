import assert from 'node:assert/strict';
import {actionTravelFreedom as freedom} from '../../../src/escalacao/futebol3d/chibi/action-travel-freedom.mjs';
const base={speed:4,travel:Math.PI,intent:0,phase:'recovery',elapsed:.5,weight:0};
assert.equal(freedom(base),1,'A faded capture cannot keep a runner facing the old pass');
assert.equal(freedom({...base,elapsed:0}),0,'Exact impact retains the calibrated facing');
assert.equal(freedom({...base,elapsed:.08}),0,'Early follow-through retains its facing');
assert(freedom({...base,weight:1})<.1,'An active follow-through keeps priority');
assert(freedom({...base,phase:'preparation',elapsed:-.5})<.1,'Do not release preparation as though it were recovery');
assert.equal(freedom({...base,speed:0}),0,'No fake travel direction when stationary');
let old=0;for(let elapsed=.12;elapsed<=.4;elapsed+=.001){const n=freedom({...base,elapsed});assert(n>=old-1e-10);assert(n-old<.007);old=n}
for(let speed=0;speed<12;speed+=.13)for(const phase of ['preparation','contact-follow-through','recovery']){const x=freedom({...base,speed,phase});assert(x>=0&&x<=1)}
console.log('PASS: release faded recovery facing, preserve impact and preparation, continuous bounded blending');
