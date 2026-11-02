import assert from 'node:assert/strict';
import {vendorDelivery} from '../../src/escalacao/cidade3d/vendor-delivery.mjs';
import {MATCHDAY_STALLS} from '../../src/escalacao/cidade3d/matchday-plan.mjs';
const vans=MATCHDAY_STALLS.map((s,i)=>vendorDelivery(s,i,()=>-.19));assert.equal(vans.filter(Boolean).length,4);assert(vans.filter(v=>v===null).length===2);
let samples=0;
for(const d of vans.filter(Boolean)){
 const day={phase:'arrival',elapsed:0,phaseElapsed:0,joinedLate:false};
 assert(d.timing.park<d.timing.unload&&d.timing.unload<d.timing.carry&&d.timing.carry<d.timing.assemble&&d.timing.assemble<d.timing.ready);
 assert(d.timing.loadAt<d.timing.boardAt&&d.timing.boardAt<d.timing.departAt&&d.timing.departAt<d.timing.end);
 for(const phase of ['arrival','departure']){day.phase=phase;let previous;
  for(let t=0;t<=300;t+=1/60){day.elapsed=day.phaseElapsed=t;const f=d.at(day);assert(Number.isFinite(f.person.x+f.person.y+f.person.z));
   if(previous&&f.visible&&previous.visible){assert(Math.hypot(f.vehicle.x-previous.vehicle.x,f.vehicle.z-previous.vehicle.z)<3.3/60+.001,'van teleport');assert(Math.hypot(f.person.x-previous.person.x,f.person.y-previous.person.y,f.person.z-previous.person.z)<4/60+.005,'vendor teleport '+phase+' '+t);assert(Math.abs(Math.atan2(Math.sin(f.vehicle.heading-previous.vehicle.heading),Math.cos(f.vehicle.heading-previous.vehicle.heading)))<.06,'van snapped orientation')}
   if(phase==='arrival'&&t<d.timing.assemble)assert(!f.stallVisible,'booth appeared before cargo arrived');
   previous=f;samples++;
  }
 }
 const live=d.at({...day,phase:'playing',joinedLate:true});assert(live.visible&&live.setup===1&&live.phase==='trading');assert.equal(d.at({...day,phase:'departure',phaseElapsed:d.timing.end+.1}).visible,false);
}
console.log(JSON.stringify({status:'PASS',samples,vans:4,coolerSellersOnFoot:2,noTeleport:true,cargoBeforeAssembly:true,parkedDuringMatch:true,packBeforeDriving:true}));
