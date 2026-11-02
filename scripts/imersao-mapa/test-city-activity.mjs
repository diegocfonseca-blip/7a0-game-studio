import assert from 'node:assert/strict';
import {activityRoute,customerJourney} from '../../src/escalacao/cidade3d/activity-route.mjs';
import {cityTrafficBudget} from '../../src/escalacao/cidade3d/population.mjs';
const points=[{x:0,y:.16,z:0},{x:0,y:.16,z:12},{x:8,y:.16,z:20},{x:8,y:.16,z:26}];
const route=activityRoute(points,1.2),visit=customerJourney(points,{speed:1.2,wait:3,stay:5});
let phases=new Set(),previous=visit.at(0),maxStep=0,maxSpeed=0;
for(let i=1;i<=Math.ceil(visit.period*4*120);i++){
 const current=visit.at(i/120),step=Math.hypot(current.x-previous.x,current.y-previous.y,current.z-previous.z);
 assert(step<=1.2/120+1e-7,'customer jumped or exceeded walking speed');
 const heading=Math.abs(Math.atan2(Math.sin(current.heading-previous.heading),Math.cos(current.heading-previous.heading)));
 assert(heading<.07,'customer reversed instantaneously at the doorway/origin');
 maxStep=Math.max(maxStep,step);maxSpeed=Math.max(maxSpeed,current.speed);phases.add(current.phase);previous=current;
}
assert.equal(route.at(-10).distance,0);assert.equal(route.at(route.duration+10).distance,route.length);
assert.equal(route.at(route.duration).speed,0);assert.equal(route.at(0).speed,0);
assert.deepEqual([...phases].sort(),['entering','leaving','visiting','waiting']);
assert.equal(cityTrafficBudget({enabled:true,supporters:0}),0);
assert.equal(cityTrafficBudget({enabled:false,supporters:90000}),0);
for(const mobile of [false,true]){let last=0;for(let supporters=1;supporters<=1e6;supporters+=997){const n=cityTrafficBudget({enabled:true,supporters,mobile});assert(n>=last&&n<=(mobile?5:8));last=n}}
console.log(JSON.stringify({status:'PASS',phases:[...phases],fourContinuousVisits:true,maxStep,maxSpeed,carBudget:'real fanbase; bounded; no attendance/save writes'}));
