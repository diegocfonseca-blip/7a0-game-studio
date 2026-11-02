import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
export type BotecoBairro={id:string;name:string;root:THREE.Group;tables:{x:number;y:number;z:number;heading:number}[];entrance:{x:number;y:number;z:number};setFixture:(text:string)=>void;dispose:()=>void}
/** Replaces a neighbourhood house on an already registered city block. These
 * public businesses never grant the club's paid bar or generate game income. */
export function criarBotecoBairro(parent:THREE.Object3D,spec:{id:string;name:string;x:number;z:number;color:string}):BotecoBairro{
 const root=new THREE.Group();root.name='boteco-'+spec.id;root.position.set(spec.x,.16,spec.z);parent.add(root)
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>()
 const mat=(color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.88});ms.add(m);return m}
 const red=mat(spec.color),cream=mat('#e2d2a9'),dark=mat('#3b3a30'),yellow=mat('#e9b928'),brown=mat('#4a2715'),label=mat('#dfc88b'),steel=mat('#97998d')
 brown.roughness=.3;root.userData.complexoLights=[{id:'boteco-'+spec.id+'-entrada',kind:'entrance',position:[0,2.6,5.1],target:[0,.4,9],color:'#ffe0a1',intensity:38,distance:12,angle:1.1}]
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);gs.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o}
 // Open front doorway, interior counter and genuinely empty seating aisles.
 box(9,3.15,.18,0,1.575,-4.8,cream);for(const x of [-4.5,4.5])box(.18,3.15,9.8,x,1.575,0,red)
 for(const x of [-2.75,2.75])box(3.5,2.65,.18,x,1.325,4.85,red)
 box(9,.60,.2,0,2.95,4.85,red);box(9.4,.16,10.2,0,3.23,0,dark)
 box(7.8,.95,.65,0,.475,-2.8,dark);box(8,.09,.85,0,1,-2.8,steel);box(1.5,1.8,.5,-3.4,.9,-4.3,cream)
 const sign=(text:string,w:number,h:number,x:number,y:number,z:number,color:string,bottle=false)=>{if(typeof document==='undefined')return(_value:string)=>{};const canvas=document.createElement('canvas');canvas.width=bottle&&!text?192:1024;canvas.height=192;const ctx=canvas.getContext('2d')!;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;ts.add(texture);const material=new THREE.MeshStandardMaterial({map:texture,roughness:.9});ms.add(material);const g=new THREE.PlaneGeometry(w,h);gs.add(g);const mesh=new THREE.Mesh(g,material);mesh.position.set(x,y,z);root.add(mesh);const draw=(value:string)=>{ctx.fillStyle=color;ctx.fillRect(0,0,1024,192);ctx.fillStyle='#fff1cd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 86px Oswald, sans-serif';ctx.fillText(value,bottle?565:512,101,bottle?850:990);if(bottle){ctx.save();if(!value)ctx.translate(16,0);ctx.beginPath();ctx.roundRect(18,17,125,157,45);ctx.fill();ctx.fillStyle='#633218';ctx.fillRect(67,38,27,27);ctx.beginPath();ctx.roundRect(48,60,65,98,10);ctx.fill();ctx.fillStyle='#e7ba4c';ctx.fillRect(50,105,61,28);ctx.restore()}texture.needsUpdate=true};draw(text);return draw}
 sign(spec.name.toUpperCase(),8.9,.60,0,2.91,4.97,spec.color,true)
 sign('',.9,.9,-3.5,1.6,4.97,spec.color,true)
 const board=sign('DIA DE FUTEBOL',2.0,.48,2.8,1.8,4.97,'#294637');let last=''
 const tables:BotecoBairro['tables']=[]
 for(const z of [7.2,9.8,12.4])for(const x of [-2.4,2.4]){
  box(.85,.055,.85,x,.74,z,yellow);for(const dx of [-.33,.33])for(const dz of [-.33,.33])box(.06,.70,.06,x+dx,.35,z+dz,yellow)
  for(const side of [-1,1]){const cx=x+side*.85;box(.43,.06,.43,cx,.43,z,yellow);box(.065,.43,.43,cx+side*.22,.67,z,yellow);for(const dx of [-.17,.17])for(const dz of [-.17,.17])box(.045,.41,.045,cx+dx,.205,z+dz,yellow)}
  tables.push({x:spec.x+x+(x>0?-.85:.85),y:.16,z:spec.z+z,heading:x>0?Math.PI/2:-Math.PI/2})
 }
 // Small brown glass-style bottles, no brand. Shared instancing, no texture download.
 const profile=[[0,0],[.043,0],[.048,.015],[.048,.17],[.028,.21],[.021,.22],[.021,.29],[0,.29]].map(([x,y])=>new THREE.Vector2(x,y)),bottleGeometry=new THREE.LatheGeometry(profile,8);gs.add(bottleGeometry)
 const bottles=new THREE.InstancedMesh(bottleGeometry,brown,24),labels=new THREE.InstancedMesh(new THREE.CylinderGeometry(.049,.049,.065,8),label,24);gs.add(labels.geometry);const transform=new THREE.Object3D();let n=0;for(const z of [7.2,9.8,12.4])for(const x of [-2.4,2.4])for(const dx of [-.18,.18])for(const dz of [-.12,.12]){transform.position.set(x+dx,.772,z+dz);transform.updateMatrix();bottles.setMatrixAt(n,transform.matrix);transform.position.y=.882;transform.updateMatrix();labels.setMatrixAt(n++,transform.matrix)}bottles.castShadow=true;root.add(bottles,labels)
 // Material batches retain separate signs and instancing.
 const groups=new Map<THREE.Material,THREE.BufferGeometry[]>();for(const child of [...root.children]){if(!(child instanceof THREE.Mesh)||child instanceof THREE.InstancedMesh||Array.isArray(child.material)||child.material.map)continue;child.updateMatrix();const list=groups.get(child.material)??[];list.push(child.geometry.clone().applyMatrix4(child.matrix));groups.set(child.material,list);child.removeFromParent()}for(const [m,parts]of groups){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)throw Error('Invalid boteco geometry batch');gs.add(g);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;root.add(o)}
 return{id:spec.id,name:spec.name,root,tables,entrance:{x:spec.x,y:.16,z:spec.z+4.85},setFixture(text){if(text!==last){last=text;board(text)}},dispose(){bottles.dispose();labels.dispose();root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}}
}
