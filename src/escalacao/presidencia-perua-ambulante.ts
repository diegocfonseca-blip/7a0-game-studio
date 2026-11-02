import * as THREE from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import type {VendorFrame} from './cidade3d/vendor-delivery.mjs'

/** Generic rounded Brazilian utility van, no trademark badge or downloaded asset.
 * Static pieces batched by material. Same geometry reused by both vendors. */
export function criarPeruasAmbulantes(parent:THREE.Object3D,colors:readonly string[]){
 const root=new THREE.Group();root.name='vendor-utility-vans';parent.add(root)
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>()
 const geo=<T extends THREE.BufferGeometry>(g:T)=>{gs.add(g);return g}
 const mat=(color:string,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.75,metalness});ms.add(m);return m}
 const white=mat('#eee5cf'),black=mat('#252925'),glass=mat('#344c53',.25),chrome=mat('#b9b9a8',.55),red=mat('#a53e28'),lamp=mat('#f2e7b3'),wood=mat('#9e744b')
 const boxGeo=geo(new THREE.BoxGeometry(1,1,1)),wheelGeo=geo(new THREE.CylinderGeometry(.32,.32,.16,12)),roundGeo=geo(new RoundedBoxGeometry(1,1,1,2,.1)),lightGeo=geo(new THREE.SphereGeometry(.12,10,6))
 const mesh=(g:THREE.Object3D,geometry:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,w=1,h=1,d=1)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;g.add(o);return o}
 const vehicles=colors.map((color,index)=>{
  const group=new THREE.Group();group.name='vendor-van-'+index;root.add(group);const paint=mat(color)
  mesh(group,boxGeo,black,0,.52,0,1.58,.14,3.95)
  // Rounded lower panels and a rounded roof retain the characteristic flat nose.
  for(const side of [-1,1]){if(side===-1){mesh(group,roundGeo,paint,side*.835,.9,-.5525,.11,.68,2.945);mesh(group,roundGeo,paint,side*.835,.9,1.9325,.11,.68,.185)}else mesh(group,roundGeo,paint,side*.835,.9,0,.11,.68,4.05);for(const z of [-1.42,-.52,.38,1.32])if(side!==-1||z!==1.32)mesh(group,boxGeo,glass,side*.86,1.54,z,.025,.54,.72);for(const z of [-1.87,-.96,-.06,.84,1.82])mesh(group,boxGeo,white,side*.86,1.54,z,.08,.67,.09);mesh(group,boxGeo,chrome,side*.902,1.19,0,.027,.035,4.04);mesh(group,boxGeo,white,side*.86,1.9,0,.10,.15,4.05)}
  mesh(group,roundGeo,white,0,2.0,0,1.80,.26,4.18)
  mesh(group,roundGeo,paint,0,.83,2.01,1.74,.56,.24);mesh(group,roundGeo,white,0,1.18,2.015,1.74,.3,.22)
  for(const side of [-1,1]){mesh(group,boxGeo,glass,side*.399,1.60,2.055,.72,.51,.035);mesh(group,lightGeo,lamp,side*.61,1.01,2.13,1,1,.36);mesh(group,boxGeo,chrome,side*.97,1.47,1.7,.18,.26,.09);mesh(group,boxGeo,red,side*.70,.78,-2.08,.13,.25,.035)}
  mesh(group,boxGeo,white,0,1.61,2.08,.06,.59,.04);mesh(group,boxGeo,white,0,1.92,2.03,1.7,.13,.12)
  for(const z of [-2.15,2.15])mesh(group,roundGeo,chrome,0,.56,z,1.84,.13,.11)
  mesh(group,boxGeo,paint,0,.69,-2.035,1.74,.30,.12)
  mesh(group,boxGeo,black,0,.76,1.13,1.35,.31,.32);mesh(group,boxGeo,black,0,1.01,1.02,1.35,.43,.15)
  const hatch=new THREE.Group();hatch.position.set(0,1.85,-2.04);group.add(hatch);mesh(hatch,boxGeo,white,0,-.49,0,1.56,.98,.055);mesh(hatch,boxGeo,glass,0,-.29,-.038,1.30,.32,.014);mesh(hatch,boxGeo,chrome,0,-.83,-.047,.26,.04,.025)
  const wheels:THREE.Group[]=[];for(const side of [-1,1])for(const z of [-1.29,1.29]){const axle=new THREE.Group();axle.position.set(side*.88,.32,z);axle.rotation.z=Math.PI/2;group.add(axle);const wheel=new THREE.Group();axle.add(wheel);mesh(wheel,wheelGeo,black,0,0,0);mesh(wheel,wheelGeo,chrome,0,side*.088,0,.50,.09,.50);wheels.push(wheel)}
  // Rear luggage door and cab door are separate from the stationary body batches.
  const door=new THREE.Group();door.position.set(-.91,.98,1.83);group.add(door);mesh(door,boxGeo,paint,0,-.03,-.39,.035,.62,.77);mesh(door,boxGeo,glass,0,.47,-.39,.035,.4,.77);mesh(door,boxGeo,white,0,.79,-.39,.035,.18,.77)
  const trolley=new THREE.Group();trolley.name='vendor-cargo-trolley-'+index;root.add(trolley);mesh(trolley,boxGeo,chrome,0,.18,0,.75,.07,.75);mesh(trolley,boxGeo,black,0,.7,-.37,.055,1.04,.045);mesh(trolley,boxGeo,black,0,1.18,-.37,.65,.05,.045)
  for(const x of [-.35,.35]){const wheel=mesh(trolley,wheelGeo,black,x,.17,0,.5,.65,.5);wheel.rotation.z=Math.PI/2}
  const cargo=new THREE.Group();cargo.name='vendor-load-'+index;root.add(cargo);for(const y of [.15,.47]){mesh(cargo,boxGeo,wood,0,y,0,.65,.29,.65);for(const x of [-.26,.26])mesh(cargo,boxGeo,chrome,x,y,.329,.04,.29,.015)}
  // Batch only stationary meshes. Animated wheels/doors remain independent.
  for(const source of [group,door,trolley,cargo]){const groups=new Map<THREE.Material,THREE.BufferGeometry[]>();for(const child of [...source.children]){if(!(child instanceof THREE.Mesh)||Array.isArray(child.material))continue;child.updateMatrix();const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);const list=groups.get(child.material)??[];list.push(g);groups.set(child.material,list);child.removeFromParent()}for(const [m,parts]of groups){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)throw Error('Invalid van batch');gs.add(g);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;source.add(o)}}
  return{group,hatch,door,wheels,trolley,cargo}
 })
 const set=(index:number,f:VendorFrame)=>{
  const v=vehicles[index];if(!v)return;v.group.visible=f.visible;v.group.position.set(f.vehicle.x,f.vehicle.y,f.vehicle.z);v.group.rotation.y=f.vehicle.heading;v.hatch.rotation.x=f.hatch*Math.PI*.62;v.door.rotation.y=f.driverDoor*Math.PI*.55;v.wheels.forEach(w=>w.rotation.y=-f.vehicle.distance/.32)
  const p=f.cartPose,offset=.85;v.trolley.visible=f.cartVisible;v.trolley.position.set(p.x+Math.sin(p.heading)*offset,p.y,p.z+Math.cos(p.heading)*offset);v.trolley.rotation.y=p.heading;v.cargo.visible=f.visible;const trunk=new THREE.Vector3(f.vehicle.x-1.4*Math.sin(f.vehicle.heading),f.vehicle.y+.55,f.vehicle.z-1.4*Math.cos(f.vehicle.heading)),loadPosition=v.trolley.position.clone();loadPosition.y+=.21;v.cargo.position.lerpVectors(trunk,loadPosition,f.load);v.cargo.rotation.y=f.load>.5?p.heading:f.vehicle.heading
 }
 return{root,set,inspect:()=>vehicles.map(v=>({visible:v.group.visible,position:v.group.position.toArray(),heading:v.group.rotation.y,trolley:v.trolley.visible})),dispose(){root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}}
}
