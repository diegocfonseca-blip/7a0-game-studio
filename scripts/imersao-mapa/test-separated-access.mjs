import assert from 'node:assert/strict';
import {publicGateDestination,spectatorVisibleAt,intervalSpectatorPoints,isPlayerServiceArea} from '../../src/escalacao/cidade3d/spectator-access.mjs';
import {matchdayFanPoints} from '../../src/escalacao/cidade3d/matchday-plan.mjs';
import {teamCoachAccess} from '../../src/escalacao/cidade3d/coach-access.mjs';
import {activityRoute} from '../../src/escalacao/cidade3d/activity-route.mjs';
const gates={home:{threshold:{x:0,z:82},heading:0,floor:.16},away:{threshold:{x:105,z:6},heading:Math.PI/2,floor:.16}};
let probes=0;
for(const side of ['home','away']){
 const gate=gates[side],opposite=gates[side==='home'?'away':'home'];
 assert(spectatorVisibleAt({x:gate.threshold.x+Math.sin(gate.heading)*2,z:gate.threshold.z+Math.cos(gate.heading)*2},side,gate));
 assert(!spectatorVisibleAt(publicGateDestination(gate),side,gate),'inside the public gate must become stands, not a pitch pedestrian');
 assert(!spectatorVisibleAt(opposite.threshold,side,gate),'rival used the wrong entrance');
 const paths=[...Array.from({length:4},(_,i)=>matchdayFanPoints(side,i)),intervalSpectatorPoints(side,gate)];
 for(const points of paths){const route=activityRoute(points,1.2);for(let t=0;t<=route.duration;t+=.05){const p=route.at(t);assert(!isPlayerServiceArea(p),side+': public walk uses service corridor');probes++}}
 for(const p of teamCoachAccess().passenger){assert(!spectatorVisibleAt(p,side,gate),'spectator rendered at coach door or delegation entry')}
 for(let z=39;z<73;z+=.25)for(const x of [-1.35,1.35])assert(!spectatorVisibleAt({x,y:.16,z},side,gate),'spectator rendered in player tunnel');
}
assert(spectatorVisibleAt({x:-30,y:2,z:43},'home',gates.home),'home stairs disappeared');
assert(spectatorVisibleAt({x:70,y:2,z:15},'away',gates.away),'away stands disappeared');
assert(!isPlayerServiceArea({x:0,y:10,z:68}),'upper tier confused with ground corridor');
console.log(JSON.stringify({status:'PASS',probes,threeSeparateEntrances:true,intervalSidesSeparated:true,noSpectatorsInPlayerTunnel:true,standsPreserved:true}));
