import assert from 'node:assert/strict';import{stableActionFacing}from'../../../src/escalacao/futebol3d/chibi/stable-action-facing.mjs';
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x)),step=1/60;
// Fast travel-to-preparation switch used to snap a pickup 112 degrees at once.
let heading=2.9,maxTurn=0;for(let t=0;t<=.80001;t+=step){const old=heading,desired=t<.27?2.9:0;heading=stableActionFacing(heading,desired,0,.8-t,step);maxTurn=Math.max(maxTurn,Math.abs(angle(heading-old))/step)}assert(maxTurn<=10+1e-8);assert(Math.abs(angle(heading))<1e-6,'Face the impact while respecting the turn budget');
const wrap=stableActionFacing(Math.PI-.01,-Math.PI+.01,NaN,-1,step);assert(Math.abs(angle(wrap-(Math.PI-.01)))<.03,'No full turn at the +/-PI seam');
assert.equal(stableActionFacing(1,2,0,0,0),2,'Seek restores the requested pose');
heading=0;for(let i=0;i<20;i++){const old=heading;heading=stableActionFacing(heading,i%2?Math.PI-.01:-Math.PI+.01,NaN,-1,step);assert(Math.abs(angle(heading-old))<=10*step+1e-9,'Recovery remains bounded during competing travel intents')}
console.log('PASS: preparation without snap, scheduled impact orientation, angle seam, seek and bounded recovery');
