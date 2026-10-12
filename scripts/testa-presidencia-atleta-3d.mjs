import assert from 'node:assert/strict'
import * as THREE from 'three'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const body=person('#1b7a3d','#b9815b'),corner=new THREE.Vector3()
for(let i=0;i<400;i++){
 const p={mx:12,mz:-7,heading:i/17,distance:i/31,speed:i%60/10,kick:i%31/100,throwing:i%61/100,control:i%33/100,throwPreparation:i%41/40}
 pose(body,p);body.group.updateMatrixWorld(true)
 let low=Infinity
 for(const leg of body.legs)for(const x of [-.075,.075])for(const y of [-.05,.05])for(const z of [-.14,.14]){
  corner.set(x,y,z);leg.boot.localToWorld(corner);low=Math.min(low,corner.y)
 }
 assert.ok(Math.abs(low)<1e-9,'A boot touches the ground without any boot penetrating it')
 assert.equal(body.group.position.x,p.mx);assert.equal(body.group.position.z,p.mz)
 const before=body.group.position.y;pose(body,p)
 assert.ok(Math.abs(body.group.position.y-before)<1e-9,'Repeated paused frames do not accumulate height')
}
console.log('PASS: 400 walking/kicking/throwing poses, real boot volume contact, stable paused height and player positions.')
// Seated reserves have the same physical feet/ground reference as the field.
body.group.position.set(0,-.34,0);body.group.rotation.set(0,Math.PI,0);
body.legs.forEach(leg=>{leg.hip.rotation.x=-Math.PI/2;leg.knee.rotation.x=Math.PI/2});body.group.updateMatrixWorld(true);
let seatedLow=Infinity;
for(const leg of body.legs)for(const x of [-.075,.075])for(const y of [-.05,.05])for(const z of [-.14,.14]){corner.set(x,y,z);leg.boot.localToWorld(corner);seatedLow=Math.min(seatedLow,corner.y)}
assert.ok(Math.abs(seatedLow)<1e-9,'Seated reserves keep their feet on the ground');
console.log('PASS: seated reserves share the same ground reference.');
