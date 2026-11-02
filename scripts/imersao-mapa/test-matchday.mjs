import assert from 'node:assert/strict';
import {activityRoute,customerJourney} from '../../src/escalacao/cidade3d/activity-route.mjs';
import {MATCHDAY_COACH_DELAY,matchdayFanPoints,matchdayStage,stadiumExteriorVisible} from '../../src/escalacao/cidade3d/matchday-plan.mjs';
for(const side of ['home','away']){
 const fans=Array.from({length:4},(_,i)=>({delay:i*2.9,route:activityRoute(matchdayFanPoints(side,i),1.2)}));
 assert(fans.every(f=>f.delay+f.route.duration<MATCHDAY_COACH_DELAY),'buses cannot precede supporters already entering');
 let min=Infinity;
 for(let t=0;t<140;t+=1/30){const gate=side==='home'?{threshold:{x:0,z:82},heading:0}:{threshold:{x:105,z:6},heading:Math.PI/2};const poses=fans.map(f=>f.route.at(t-f.delay)).filter(p=>stadiumExteriorVisible(p,gate));for(let i=0;i<poses.length;i++)for(let j=i+1;j<poses.length;j++)min=Math.min(min,Math.hypot(poses[i].x-poses[j].x,poses[i].z-poses[j].z))}
 assert(min>.8,`${side}: fans overlap: ${min}`);
 assert.equal(matchdayStage(30,'arrival',false),'supporters-entering');
 assert.notEqual(matchdayStage(MATCHDAY_COACH_DELAY,'arrival',false),'teams-arrival');
 assert.equal(matchdayStage(MATCHDAY_COACH_DELAY,'arrival',true),'teams-arrival');
}
assert.equal(matchdayStage(2,'playing',true),'match','opening the map midmatch must not replay a pregame');
assert.equal(matchdayStage(200,'departure',true),'departure');
const path=[{x:0,y:.16,z:5},{x:0,y:.16,z:0}],customer=customerJourney(path,{stay:12,wait:2,turnAtExit:true});
const arrived=2+customer.inbound.duration;
const facing=customer.at(arrived+.1).heading;
for(let t=1;t<11;t++)assert(Math.abs(customer.at(arrived+t).heading-facing)<1e-7,'customer turned their back while being served');
let prev=customer.at(0);for(let t=1/60;t<customer.period*3;t+=1/60){const pose=customer.at(t),d=Math.hypot(pose.x-prev.x,pose.z-prev.z);assert(d<=1.1/60+1e-7,'customer teleported');prev=pose}
console.log(JSON.stringify({status:'PASS',supportersBeforeBothCoaches:true,separateHomeAndLateralRoutes:true,nonOverlappingQueues:true,customerFacesVendor:true,noMatchClock:true}));
