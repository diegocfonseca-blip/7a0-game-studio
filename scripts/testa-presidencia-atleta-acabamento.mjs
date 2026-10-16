import assert from 'node:assert/strict'
import * as THREE from 'three'
import {person,pose,contatoPe3D} from '../src/escalacao/presidencia-atleta-3d.ts'

const body=person('#1b7a3d','#b9815b'),idle={mx:0,mz:0,heading:0,distance:0,speed:0,kick:0,throwing:0}
pose(body,idle);body.group.updateMatrixWorld(true)
const bounds=new THREE.Box3().setFromObject(body.group),materials=new Set(),textures=new Set(),parts=[]
let triangles=0,vertices=0
body.group.traverse(mesh=>{
 if(!mesh.isMesh)return
 parts.push(mesh.name)
 const geometry=mesh.geometry,p=geometry.attributes.position,n=geometry.attributes.normal
 triangles+=(geometry.index?.count??p.count)/3;vertices+=p.count
 assert.equal(mesh.material.vertexColors,true,mesh.name+' must retain sculpted surface shading')
 assert.ok(geometry.attributes.color,mesh.name+' must have actual surface colour data')
 for(let i=0;i<p.count;i++)for(const value of [p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)])assert.ok(Number.isFinite(value),mesh.name+' has invalid vertices')
 materials.add(mesh.material)
 if(mesh.material.bumpMap)textures.add(mesh.material.bumpMap)
})
assert.ok(bounds.max.y>1.75&&bounds.max.y<1.9)
assert.ok(bounds.min.y>-.000001)
assert.ok(triangles<12000,'An athlete must keep the close-view triangle budget: '+triangles)
assert.ok(parts.includes('atleta-cabelo'))
assert.ok(parts.includes('atleta-gola'))
assert.ok(!parts.some(name=>/nariz|olho|boca/.test(name)))
assert.equal(body.group.userData.faceless,true)

// Independently measure the visible sole/upper triangles at every kick angle,
// not just the former box envelope shared by the engine's collision helpers.
const tri=new THREE.Triangle(),point=new THREE.Vector3(),closest=new THREE.Vector3()
let maximumContactGap=0
for(let index=0;index<36;index++){
 const p={...idle,heading:index*Math.PI/18,kick:.3}
 pose(body,p);body.group.updateMatrixWorld(true)
 const ball=contatoPe3D(p),boot=body.legs[1].boot,g=boot.geometry,v=g.attributes.position,indices=g.index
 point.set(ball.x,ball.y,ball.z);let minimum=Infinity
 for(let i=0;i<(indices?.count??v.count);i+=3){
  const vertex=(target,k)=>target.fromBufferAttribute(v,indices?indices.getX(i+k):i+k).applyMatrix4(boot.matrixWorld)
  vertex(tri.a,0);vertex(tri.b,1);vertex(tri.c,2)
  if(tri.getArea()<1e-12)continue
  tri.closestPointToPoint(point,closest);minimum=Math.min(minimum,point.distanceTo(closest))
 }
 maximumContactGap=Math.max(maximumContactGap,Math.abs(minimum-.11))
 assert.ok(Math.abs(minimum-.11)<.0005,'The visible boot must really meet the ball; gap '+(minimum-.11)+' m')
}
console.log(JSON.stringify({status:'PASS',triangles,vertices,meshes:parts.length,materials:materials.size,textures:textures.size,height:bounds.max.y,maximumContactGap},null,2))
