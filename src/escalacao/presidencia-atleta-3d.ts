import * as THREE from 'three'
import type {JogadorFutebol} from './presidencia-futebol-motor'

const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.88})
const groundCorner=new THREE.Vector3()
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function rounded(parent:THREE.Object3D,r:number,length:number,x:number,y:number,z:number,mat:THREE.Material){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
/** Articulated, faceless figures. Feet and ball are measured from the same ground plane. */
export function person(color:string,skinColor:string,keeper=false){
 const group=new THREE.Group(),skin=material(skinColor),kit=material(color),shorts=material('#20262a'),boots=material('#171915')
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.225,.18,.43,12),kit);torso.scale.z=.68;torso.position.y=1.19;torso.castShadow=true;group.add(torso)
 const pelvis=rounded(group,.16,.09,0,.84,0,shorts);pelvis.rotation.z=Math.PI/2;pelvis.scale.z=.8
 rounded(group,.07,.065,0,1.47,0,skin)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.145,16,12),skin);head.scale.y=1.16;head.position.y=1.64;head.castShadow=true;group.add(head)
 const legs=[-1,1].map(side=>{
  const hip=new THREE.Group();hip.position.set(side*.12,.77,0);group.add(hip)
  rounded(hip,.085,.07,0,-.08,0,shorts)
  rounded(hip,.071,.14,0,-.23,0,skin)
  const knee=new THREE.Group();knee.position.y=-.34;hip.add(knee)
  rounded(knee,.07,.01,0,-.02,0,skin)
  rounded(knee,.06,.18,0,-.20,0,kit);const boot=box(knee,.15,.10,.28,0,-.38,.065,boots)
  return {hip,knee,boot}
 })
 const elbows:THREE.Group[]=[],hands:THREE.Mesh[]=[]
 const handMaterial=keeper?material('#d8ddd3'):skin
 const arms=[-1,1].map(side=>{
  const arm=new THREE.Group();arm.position.set(side*.265,1.38,0);group.add(arm)
  rounded(arm,.082,.09,0,-.07,0,kit);rounded(arm,.057,.10,0,-.18,0,skin)
  const elbow=new THREE.Group();elbow.position.y=-.25;arm.add(elbow);elbows.push(elbow)
  rounded(elbow,.05,.13,0,-.105,0,skin);hands.push(rounded(elbow,keeper?.075:.061,.025,0,-.23,0,handMaterial))
  return arm
 })
 const upper=new THREE.Group();upper.position.y=.84
 // One torso pivot lets the thrower crouch and collect the ball naturally.
 for(const child of [...group.children])if(child!==pelvis&&!legs.some(leg=>leg.hip===child)){group.remove(child);child.position.y-=.84;upper.add(child)}
 group.add(upper)
 return {group,upper,legs,arms,elbows,hands,kit}
}
export function pose(body:ReturnType<typeof person>,p:Pick<JogadorFutebol,'mx'|'mz'|'heading'|'distance'|'speed'|'kick'|'throwing'> & {save?:number;dive?:number;control?:number;throwPreparation?:number}){
 body.group.position.set(p.mx,0,p.mz);body.group.rotation.set(0,p.heading,Math.max(-1,Math.min(1,p.dive??0))*1.5,'YXZ')
 const diving=Math.abs(p.dive??0)>1e-6
 const swing=diving?0:Math.sin(p.distance/1.4*Math.PI*2)*Math.min(.55,p.speed*.12)
 const kick=Math.sin(Math.PI/2*Math.max(0,Math.min(1,p.kick/.3)))*.85
 const control=Math.sin(Math.PI*Math.max(0,Math.min(1,(p.control??0)/.32)))
 const preparation=p.throwPreparation??0
 const pickup=Math.sin(Math.PI*Math.min(1,preparation/.5))**2
 const bend=1.3*pickup
 const throwing=Math.min(1,Math.max(0,p.throwing/.18,(preparation-.4)/.6))
 body.upper.rotation.x=bend
 const save=Math.max(0,Math.min(1,p.save??0))
 body.legs.forEach((leg,i)=>{
  const angle=(i?-swing:swing)+(i===1?-kick-.35*control:0)-1.38*pickup
  leg.hip.rotation.x=angle;leg.knee.rotation.x=Math.max(0,-angle)*.8+1.656*pickup
  body.arms[i].rotation.x=-bend-2.65*throwing+(-angle*.65*(1-save)-.60*save)*(1-throwing)*(1-pickup)
  body.arms[i].rotation.z=(i?-1:1)*(.30*save*(1-throwing)+.36*throwing+.36*pickup)
  body.elbows[i].rotation.x=-.25*control-.45*save-.25*Math.min(1,p.speed/5.8)*(1-save)*(1-throwing)
 })
 // Use all eight boot corners: a tilted toe/heel can be lower than the sole centre.
 body.group.updateMatrixWorld(true)
 let low=Infinity
 const corner=groundCorner
 for(const leg of body.legs)for(const x of [-.075,.075])for(const y of [-.05,.05])for(const z of [-.14,.14]){
  corner.set(x,y,z).applyMatrix4(leg.boot.matrixWorld);low=Math.min(low,corner.y)
 }
 // On the side, shoulders, gloves and head can be lower than the boots.
 // Bounding volumes keep the entire articulated figure above the pitch.
 if(diving)body.group.traverse(node=>{
  if(!(node instanceof THREE.Mesh))return
  if(!node.geometry.boundingBox)node.geometry.computeBoundingBox()
  const bounds=node.geometry.boundingBox!
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   corner.set(x,y,z).applyMatrix4(node.matrixWorld);low=Math.min(low,corner.y)
  }
 })
 body.group.position.y-=low
}

// A single CPU-only rig measures the same glove positions used by the renderer.
// No canvas, WebGL context or per-frame mesh allocation is needed.
let measurementRig:ReturnType<typeof person>|undefined
const glovePosition=new THREE.Vector3()
export function contatoLuvas3D(p:Parameters<typeof pose>[1]){
 const rig=measurementRig??(measurementRig=person('#ffffff','#ffffff',true))
 pose(rig,p);rig.group.updateMatrixWorld(true)
 const a=rig.hands[0].getWorldPosition(glovePosition),x=a.x,y=a.y,z=a.z
 const b=rig.hands[1].getWorldPosition(glovePosition)
 return {x:(x+b.x)/2,y:(y+b.y)/2,z:(z+b.z)/2}
}
