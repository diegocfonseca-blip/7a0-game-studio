import assert from 'node:assert/strict'
import * as THREE from 'three'
import {person,pose,contatoLuvas3D} from '../src/escalacao/presidencia-atleta-3d.ts'

const triangle=new THREE.Triangle(),point=new THREE.Vector3(),closest=new THREE.Vector3()
function surfaceDistance(mesh,ball){
 const p=mesh.geometry.attributes.position,index=mesh.geometry.index;let minimum=Infinity
 for(let i=0;i<(index?.count??p.count);i+=3){
  const vertex=(out,k)=>out.fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld)
  vertex(triangle.a,0);vertex(triangle.b,1);vertex(triangle.c,2);if(triangle.getArea()<1e-12)continue
  triangle.closestPointToPoint(ball,closest);minimum=Math.min(minimum,ball.distanceTo(closest))
 }
 return minimum
}
// Independently reconstruct the ORIGINAL arm chain. This does not read the
// refined arm/elbow/wrist transforms or the refiner's recorded anchor.
function previousMidpoint(body,p){
 const preparation=p.throwPreparation??0,pickup=Math.sin(Math.PI*Math.min(1,preparation/.5))**2,bend=1.3*pickup
 const throwing=Math.min(1,Math.max(0,p.throwing/.18,(preparation-.4)/.6)),save=p.save??0
 const x=-bend-2.65*throwing+(1.38*pickup*.65*(1-save)-.6*save)*(1-throwing)*(1-pickup)
 const z=.30*save*(1-throwing)+.36*throwing+.36*pickup
 const result=new THREE.Vector3()
 for(const side of [-1,1]){
  const arm=new THREE.Matrix4().compose(new THREE.Vector3(side*.265,.54,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(x,-0,-side*z)),new THREE.Vector3(1,1,1))
  const elbow=new THREE.Matrix4().compose(new THREE.Vector3(0,-.25,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.45*save,0,0)),new THREE.Vector3(1,1,1))
  result.add(new THREE.Vector3(0,-.23,0).applyMatrix4(elbow).applyMatrix4(arm).applyMatrix4(body.upper.matrixWorld))
 }
 return result.multiplyScalar(.5)
}
const settings=[{save:1},{save:.8},{save:.55},{save:1,dive:-1},{save:1,dive:1},...[.25,.4,.5,.75,1].map(throwPreparation=>({throwPreparation})),{throwing:.6},{save:1,speed:3.2}]
const report={status:'PASS',poses:0,handContacts:0,maxContactGap:0,maxPreviousAnchorError:0,maxHelperAnchorError:0,maxArmExtension:0,minimumBodyHeight:Infinity,minimumForearmClearance:Infinity,resetChecks:0}
for(const keeper of [false,true]){
 const body=person('#1b7a3d','#b9815b',keeper)
 for(const heading of [0,.7,2.4,-2])for(const distance of [0,.3])for(const setting of settings){
  if(!keeper&&setting.dive)continue
  const p={mx:3,mz:-8,heading,distance,speed:0,kick:0,throwing:0,...setting}
  pose(body,p);body.group.updateMatrixWorld(true)
  const midpoint=body.hands.reduce((sum,hand)=>sum.add(hand.getWorldPosition(point)),new THREE.Vector3()).multiplyScalar(.5)
  const previous=previousMidpoint(body,p),anchor=contatoLuvas3D(p)
  report.maxPreviousAnchorError=Math.max(report.maxPreviousAnchorError,midpoint.distanceTo(previous))
  report.maxHelperAnchorError=Math.max(report.maxHelperAnchorError,midpoint.distanceTo(new THREE.Vector3(anchor.x,anchor.y,anchor.z)))
  assert.ok(midpoint.distanceTo(previous)<1e-8,'The refinement moved the pre-existing ball trajectory')
  assert.ok(midpoint.distanceTo(new THREE.Vector3(anchor.x,anchor.y,anchor.z))<1e-8,'The visible hands and motor no longer share the same centre')
  for(const wrist of body.wrists){
   let minimum=Infinity
   for(const mesh of wrist.children)if(mesh.isMesh)minimum=Math.min(minimum,surfaceDistance(mesh,midpoint))
   const gap=Math.abs(minimum-.11);report.maxContactGap=Math.max(report.maxContactGap,gap);report.handContacts++
   assert.ok(gap<.000001,`The visible hand must actually touch the ball: ${gap} m`)
  }
  for(const forearm of body.forearms){const clearance=surfaceDistance(forearm,midpoint)-.11;if(clearance<report.minimumForearmClearance){report.minimumForearmClearance=clearance;report.worstForearm={keeper,p}}}
  report.maxArmExtension=Math.max(report.maxArmExtension,body.grip.maximumArmExtension)
  report.minimumBodyHeight=Math.min(report.minimumBodyHeight,new THREE.Box3().setFromObject(body.group).min.y)
  assert.ok(body.grip.maximumArmExtension<.03,'The wrist solver over-extended a forearm')
  assert.ok(new THREE.Box3().setFromObject(body.group).min.y>-.000001,'Refined arms or hands penetrated the pitch')
  const transforms=()=>[...body.arms,...body.elbows,...body.wrists].flatMap(node=>[...node.position.toArray(),...node.quaternion.toArray()])
  const before=transforms()
  pose(body,{...p,save:0,dive:0,throwPreparation:0,throwing:0,speed:5.8,distance:1.1});pose(body,p)
  const after=transforms();assert.ok(before.every((v,i)=>Math.abs(v-after[i])<1e-10),'Save → running → save retained stale wrist or arm transforms')
  report.resetChecks++;report.poses++
 }
}
assert.ok(report.minimumForearmClearance>=-.001,'The forearm intersects the held sphere')
console.log(JSON.stringify(report,null,2))
