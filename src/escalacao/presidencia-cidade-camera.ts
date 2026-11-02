import * as THREE from 'three'

/** A one-shot street observation preset, not an automatic camera takeover.
 * Find real people/traffic and reject viewpoints hidden behind city geometry. */
export function observarCidade(camera:THREE.PerspectiveCamera,people:readonly THREE.Object3D[],cars:readonly THREE.Object3D[],environment:THREE.Object3D){
 const car=cars.find(c=>c.visible),carPoint=car?.getWorldPosition(new THREE.Vector3())
 const citizens=people.map(p=>p.getWorldPosition(new THREE.Vector3())).filter(p=>Number.isFinite(p.x)&&Math.hypot(p.x,p.z)>1)
 citizens.sort((a,b)=>carPoint?a.distanceToSquared(carPoint)-b.distanceToSquared(carPoint):Math.hypot(a.x+175,a.z-55)-Math.hypot(b.x+175,b.z-55))
 const person=citizens[0]??new THREE.Vector3(-175,.16,55)
 const subjects=[person.clone().add(new THREE.Vector3(0,1.2,0)),...(carPoint&&person.distanceTo(carPoint)<45?[carPoint.clone().add(new THREE.Vector3(0,.8,0))]:[])]
 const target=subjects.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/subjects.length)
 const probe=new THREE.PerspectiveCamera(camera.fov,camera.aspect,camera.near,camera.far),ray=new THREE.Raycaster(),meshes:THREE.Object3D[]=[]
 environment.updateWorldMatrix(true,true)
 environment.traverse(n=>{if(n instanceof THREE.Mesh)meshes.push(n)})
 let best:{position:THREE.Vector3;target:THREE.Vector3;score:number}|undefined
 for(const distance of [22,32])for(const angle of [0,Math.PI/2,-Math.PI/2,Math.PI,Math.PI/4,-Math.PI/4,3*Math.PI/4,-3*Math.PI/4]){
  const position=target.clone().add(new THREE.Vector3(Math.sin(angle)*distance,Math.max(8,distance*.32),Math.cos(angle)*distance))
  probe.position.copy(position);probe.lookAt(target);probe.updateMatrixWorld(true)
  let score=0
  for(const subject of subjects){
   const projected=subject.clone().project(probe);if(Math.abs(projected.x)>.8||Math.abs(projected.y)>.75||projected.z<0||projected.z>1)continue
   const direction=subject.clone().sub(position);ray.set(position,direction.clone().normalize());ray.far=direction.length()-.9
   const blocked=ray.intersectObjects(meshes,false).some(hit=>{const m=(hit.object as THREE.Mesh).material;return(Array.isArray(m)?m:[m]).some(m=>m.visible&&(!m.transparent||m.opacity>.5))})
   if(!blocked)score++
  }
  if(!best||score>best.score)best={position,target,score}
  if(score===subjects.length)return best
 }
 return best!
}
