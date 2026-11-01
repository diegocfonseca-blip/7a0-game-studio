import assert from 'node:assert/strict';
import {sidewalkRoute,residentWalk} from '../../src/escalacao/cidade3d/resident-walk.mjs';
const points=[{x:0,y:.16,z:0},{x:0,y:.16,z:40},{x:30,y:.16,z:40}],copy=JSON.stringify(points);
const valid=p=>Math.abs(p.x)<.75&&p.z>=-.5&&p.z<=40.5||Math.abs(p.z-40)<.75&&p.x>=-.5&&p.x<=30.5;
const route=sidewalkRoute(points,valid);assert(route&&route.length>65,'Keep connected walks longer than the old 30m limit');assert.equal(JSON.stringify(points),copy);
let last=null,maxSpeed=0,maxHeading=0;
for(let i=0;i<160*60;i++){
 const t=i/60,p=residentWalk(route,t),a=route.sample(0);assert(valid(p),'Actual lane stays on the pavement');
 if(last){const d=Math.hypot(p.x-last.x,p.z-last.z);maxSpeed=Math.max(maxSpeed,d*60);maxHeading=Math.max(maxHeading,Math.abs(Math.atan2(Math.sin(p.heading-last.heading),Math.cos(p.heading-last.heading)))*60);assert(p.distance>=last.distance-1e-7);assert(Math.abs((p.distance-last.distance)-d)<.012,'Gait odometer follows movement, including a slow turnaround')}
 last=p;
}
assert(maxSpeed<1.6);assert(maxHeading<7,'No instantaneous turn at a bend');
const at0=residentWalk(route,0),at1=residentWalk(route,at0.period),end=residentWalk(route,at0.period-1e-6);assert(Math.hypot(at1.x-end.x,at1.z-end.z)<.00001,'Cycle joins continuously');
assert.equal(at1.distance,2*(route.length+Math.PI*.32));
const blocked=sidewalkRoute(points,p=>valid(p)&&!(p.z>19&&p.z<21));assert.equal(blocked,null,'Do not bridge a blocked stretch');
console.log({connectedMetres:route.length,maxSpeed,maxHeading,continuousCycle:true,pavementOnly:true,sourceUnchanged:true});
