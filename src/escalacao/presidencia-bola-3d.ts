import * as THREE from 'three'

import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D} from './presidencia-bola-rotacao'
export {RAIO_BOLA_FUTEBOL_3D} from './presidencia-bola-rotacao'
type Panel={black:boolean;vertices:THREE.Vector3[]}

/** A truncated icosahedron supplies the actual football panels: twelve black
 * pentagons and twenty white hexagons. Subdivision projects their triangles
 * back onto one sphere, including the narrow seams between white panels.
 * One mesh/material, no texture, canvas, overlay or global GPU resource. */
export function criarBolaFutebol3D(){
 const source=new THREE.IcosahedronGeometry(1,0),positions=source.getAttribute('position')
 const vertices:THREE.Vector3[]=[],faces:number[][]=[],ids=new Map<string,number>()
 for(let i=0;i<positions.count;i+=3){
  const face:number[]=[]
  for(let j=0;j<3;j++){
   const p=new THREE.Vector3().fromBufferAttribute(positions,i+j).normalize(),key=p.toArray().map(v=>v.toFixed(7)).join(',')
   let id=ids.get(key);if(id===undefined){id=vertices.length;ids.set(key,id);vertices.push(p)}
   face.push(id)
  }
  faces.push(face)
 }
 source.dispose()
 const cut=(a:number,b:number)=>vertices[a].clone().multiplyScalar(2).add(vertices[b]).normalize()
 const panels:Panel[]=faces.map(([a,b,c])=>({black:false,vertices:[cut(a,b),cut(b,a),cut(b,c),cut(c,b),cut(c,a),cut(a,c)]}))
 vertices.forEach((axis,index)=>{
  const neighbours=new Set<number>()
  for(const face of faces)if(face.includes(index))for(const n of face)if(n!==index)neighbours.add(n)
  const points=[...neighbours].map(n=>cut(index,n)),u=points[0].clone().addScaledVector(axis,-points[0].dot(axis)).normalize(),v=axis.clone().cross(u)
  points.sort((a,b)=>Math.atan2(a.dot(v),a.dot(u))-Math.atan2(b.dot(v),b.dot(u)))
  panels.push({black:true,vertices:points})
 })
 const black=new THREE.Color('#111614'),white=new THREE.Color('#f9f6eb'),seam=new THREE.Color('#62645b')
 const coordinates:number[]=[],normals:number[]=[],colors:number[]=[],indices:number[]=[],weld=new Map<string,number>()
 const vertex=(unit:THREE.Vector3,color:THREE.Color)=>{
  const key=unit.toArray().map(v=>v.toFixed(9)).join(',')+':'+color.getHexString()
  let index=weld.get(key)
  if(index===undefined){
   index=coordinates.length/3;weld.set(key,index)
   coordinates.push(unit.x*RAIO_BOLA_FUTEBOL_3D,unit.y*RAIO_BOLA_FUTEBOL_3D,unit.z*RAIO_BOLA_FUTEBOL_3D)
   normals.push(unit.x,unit.y,unit.z);colors.push(color.r,color.g,color.b)
  }
  return index
 }
 const middle=(a:THREE.Vector3,b:THREE.Vector3)=>a.clone().add(b).normalize()
 function triangle(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,color:THREE.Color,subdivide=false){
  if(subdivide){
   const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a)
   triangle(a,ab,ca,color);triangle(ab,b,bc,color);triangle(ca,bc,c,color);triangle(ab,bc,ca,color);return
  }
  // Consistent outward winding also makes shadows and back-face culling agree.
  const outward=b.clone().sub(a).cross(c.clone().sub(a)).dot(a)
  indices.push(vertex(a,color),vertex(outward>0?b:c,color),vertex(outward>0?c:b,color))
 }
 for(const panel of panels){
  const center=panel.vertices.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).normalize()
  const inside=panel.vertices.map(p=>p.clone().lerp(center,.018).normalize())
  for(let i=0;i<panel.vertices.length;i++){
   const next=(i+1)%panel.vertices.length,a=inside[i],b=inside[next],outerA=panel.vertices[i],outerB=panel.vertices[next]
   triangle(center,a,b,panel.black?black:white,true)
   // The seam is part of the same spherical surface. It cannot hide inside a
   // white sphere like the old flat wireframe triangles did.
   const midInner=middle(a,b),midOuter=middle(outerA,outerB)
   triangle(a,outerA,midOuter,seam);triangle(a,midOuter,midInner,seam)
   triangle(midInner,midOuter,outerB,seam);triangle(midInner,outerB,b,seam)
  }
 }
 const geometry=new THREE.BufferGeometry()
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(coordinates,3))
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3))
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
 geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.computeBoundingBox()
 geometry.userData={radius:RAIO_BOLA_FUTEBOL_3D,pentagons:12,hexagons:20,triangles:indices.length/3}
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:0})
 const ball=new THREE.Mesh(geometry,material)
 ball.name='match-ball';ball.castShadow=true;ball.receiveShadow=true;ball.userData.radius=RAIO_BOLA_FUTEBOL_3D
 return ball
}

const fallbackRoll=new WeakMap<THREE.Object3D,{spin:RotacaoBola3D;time:number}>()
/** All match viewers use the same official position and presentation rotation. */
export function posicionarBolaFutebol3D(ball:THREE.Object3D,frame:{time:number;ball:{x:number;y:number;z:number;rotation?:[number,number,number,number];presentation?:{x:number;y:number;z:number}}}){
 const p=frame.ball,position=p.presentation??p;ball.position.set(position.x,position.y,position.z)
 if(p.rotation){ball.quaternion.fromArray(p.rotation);return}
 let state=fallbackRoll.get(ball)
 if(!state||frame.time<state.time){state={spin:new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,p),time:frame.time};fallbackRoll.set(ball,state)}
 ball.quaternion.copy(state.spin.step(p,frame.time-state.time));state.time=frame.time
}
