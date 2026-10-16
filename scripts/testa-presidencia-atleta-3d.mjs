import assert from 'node:assert/strict'
import * as THREE from 'three'
import {person,pose,contatoPe3D,contatoLuvas3D} from '../src/escalacao/presidencia-atleta-3d.ts'
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

const idle={mx:0,mz:0,heading:0,distance:0,speed:0,kick:0,throwing:0}
pose(body,idle);body.group.updateMatrixWorld(true)
const size=new THREE.Box3().setFromObject(body.group).getSize(new THREE.Vector3())
assert.ok(size.y>1.75&&size.y<1.90,'The adult retains human scale in the field measured in metres')
const gaitBody=person('#1b7a3d','#b9815b'),world=new THREE.Vector3(),soleNormal=new THREE.Vector3()
let stanceSamples=0,maxSlide=0,maxLift=0
for(const speed of [.6,1.4,3.2,5.8])for(const heading of [0,.4,Math.PI/2,Math.PI,-2.1]){
 const previous=[null,null]
 for(let index=0;index<=2400;index++){
  const distance=index*.002,phase=((distance/1.4)%1+1)%1
  const p={...idle,mx:Math.sin(heading)*distance,mz:Math.cos(heading)*distance,distance,heading,speed}
  pose(gaitBody,p);gaitBody.group.updateMatrixWorld(true)
  for(const [i,leg] of gaitBody.legs.entries()){
   const q=(phase+i*.5)%1
   leg.boot.getWorldPosition(world)
   maxLift=Math.max(maxLift,world.y-.05)
   if(q<.5){
    assert.ok(Math.abs(world.y-.05)<1e-8,'The entire supporting sole remains at ground level')
    soleNormal.set(0,1,0).transformDirection(leg.boot.matrixWorld)
    assert.ok(soleNormal.distanceTo(new THREE.Vector3(0,1,0))<1e-8,'The ankle keeps the sole flat')
    if(previous[i]&&q>=previous[i].q){
     const slide=world.distanceTo(previous[i].point)
     maxSlide=Math.max(maxSlide,slide);stanceSamples++
     assert.ok(slide<1e-8,`A planted foot cannot skate while the player advances: ${slide} m`)
    }
    previous[i]={q,point:world.clone()}
   }else previous[i]=null
  }
 }
}
assert.ok(maxLift>.15&&maxLift<.20,'Running visibly lifts the recovering foot above the grass')
console.log(`PASS: ${stanceSamples} planted-foot samples across four walking/running speeds and five headings; maximum slide ${maxSlide.toExponential(3)} m, return-foot lift ${maxLift.toFixed(3)} m.`)

let contactSamples=0
for(let i=0;i<72;i++){
 const p={...idle,mx:12,mz:-7,heading:i*Math.PI/36,kick:.3}
 pose(body,p);body.group.updateMatrixWorld(true)
 const ball=contatoPe3D(p),local=body.legs[1].boot.worldToLocal(new THREE.Vector3(ball.x,ball.y,ball.z))
 const closest=new THREE.Vector3(THREE.MathUtils.clamp(local.x,-.075,.075),THREE.MathUtils.clamp(local.y,-.05,.05),THREE.MathUtils.clamp(local.z,-.14,.14))
 assert.ok(Math.abs(local.distanceTo(closest)-.11)<1e-8,'The radius-11 cm ball touches the actual boot volume, without gap or penetration')
 assert.ok(Math.abs(ball.y-.11)<1e-8,'The shot starts with a regulation ball resting on the grass')
 const repeat=contatoPe3D(p)
 assert.deepEqual(repeat,ball,'Paused strike contact remains identical')
 contactSamples++
}
console.log(`PASS: ${contactSamples} strike headings use real inner-boot contact at regulation ball height.`)

const keeper=person('#e5bd2a','#b9815b',true)
let gloveSamples=0
for(const save of [0,.5,1])for(const dive of [-1,0,1])for(const throwing of [0,.3])for(const throwPreparation of [0,.25,.75])for(const distance of [0,.15,.3,.45]){
 const p={...idle,mx:3,mz:-8,heading:1.3,distance,speed:3.2,save,dive,throwing,throwPreparation}
 pose(keeper,p);keeper.group.updateMatrixWorld(true)
 const a=keeper.hands[0].getWorldPosition(new THREE.Vector3()),b=keeper.hands[1].getWorldPosition(new THREE.Vector3())
 const actual=a.add(b).multiplyScalar(.5),contact=contatoLuvas3D(p)
 assert.ok(actual.distanceTo(new THREE.Vector3(contact.x,contact.y,contact.z))<1e-8,'Goalkeeper/carry/throw-in contact agrees with the visible gloves')
 assert.ok(new THREE.Box3().setFromObject(keeper.group).min.y>-.000001,'No body part penetrates the pitch while diving or collecting')
 gloveSamples++
}
console.log(`PASS: ${gloveSamples} glove poses retain ball contact during walking, collection, throw-ins and dives.`)
