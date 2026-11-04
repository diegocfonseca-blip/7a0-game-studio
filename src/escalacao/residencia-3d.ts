import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {TERRENO_USUARIO as P} from './residencia-planta'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
/** Starter home, batched once; never creates another renderer. */
export function criarResidenciaUsuario(parent:T.Object3D){
 const root=new T.Group();root.name='residencia-usuario';parent.add(root)
 const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),batches=new Map<T.Material,T.BufferGeometry[]>()
 const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.9});materials.add(m);return m}
 const wood=mat('#856044'),oldWood=mat('#a2825c'),roof=mat('#807c70'),trim=mat('#4e493e'),glass=mat('#758d91'),base=mat('#b8ac8e'),earth=mat('#a38a59')
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number,angle=0)=>{
  const g=new T.BoxGeometry(w,h,d);g.rotateX(angle);g.translate(x,y,z);const batch=batches.get(m)??[];batch.push(g);batches.set(m,batch)
 }
 box(earth,P.width,.02,P.depth,P.x,-.13,P.z)
 const h=P.house
 box(base,h.width+.5,.16,h.depth+.5,h.x,.08,h.z)
 for(let i=0;i<16;i++)for(const s of[-1,1])box(i%3?wood:oldWood,.48,h.height,.12,h.x-3.75+i*.5,.16+h.height/2,h.z+s*h.depth/2)
 for(const s of[-1,1])box(wood,.14,h.height,h.depth,h.x+s*h.width/2,.16+h.height/2,h.z)
 box(trim,1.4,2.45,.16,h.x-.9,1.385,h.z+h.depth/2+.1)
 box(glass,1.7,1.25,.18,h.x+1.65,1.9,h.z+h.depth/2+.11)
 for(const s of[-1,1])box(oldWood,.14,1.48,.2,h.x+1.65+s*.92,1.9,h.z+h.depth/2+.13)
 box(oldWood,2,.14,.2,h.x+1.65,1.24,h.z+h.depth/2+.13)
 for(let i=0;i<18;i++)box(roof,.49,.075,8.1,h.x-4.165+i*.49,3.62,h.z,-.1)
 const g=P.garage
 box(base,g.width,.12,g.depth,g.x,.06,g.z)
 // Private garage aprons meet the existing dirt; no asphalt upgrade is granted.
 for(const v of [
  [g.x-g.width/2,.12,g.z+g.depth/2,g.x+g.width/2,.12,g.z+g.depth/2,g.x+g.width/2,-.12,g.z+g.depth/2+2.5,g.x-g.width/2,-.12,g.z+g.depth/2+2.5],
  [g.x+g.width/2,.12,g.z-g.depth/2,g.x+g.width/2+2.5,-.12,g.z-g.depth/2,g.x+g.width/2+2.5,-.12,g.z+g.depth/2,g.x+g.width/2,.12,g.z+g.depth/2],
 ]){const ramp=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(v,3)).setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2)).setIndex([0,2,1,0,3,2]);ramp.computeVertexNormals();const a=batches.get(base)??[];a.push(ramp);batches.set(base,a)}
 for(const x of[-1,1])for(const z of[-1,1])box(wood,.18,2.7,.18,g.x+x*(g.width/2-.15),1.47,g.z+z*(g.depth/2-.15))
 box(roof,g.width+.3,.1,g.depth+.4,g.x,2.9,g.z,-.035)
 for(const z of[P.z-P.depth/2,P.z+P.depth/2]){
  for(let x=P.x-P.width/2;x<=P.x+P.width/2;x+=2){if(z>P.z&&x>P.x-24&&x<P.x-13)continue;box(oldWood,.14,1.1,.14,x,.55,z)}
  if(z<P.z)box(wood,P.width,.1,.1,P.x,.8,z)
  else{box(wood,3,.1,.1,P.x-24.5,.8,z);box(wood,39,.1,.1,P.x+6.5,.8,z)}
 }
 for(const x of[P.x-P.width/2,P.x+P.width/2]){box(wood,.1,.1,P.depth,x,.8,P.z);for(let z=P.z-P.depth/2;z<=P.z+P.depth/2;z+=2)box(oldWood,.14,1.1,.14,x,.55,z)}
 for(const[m,parts]of batches){const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());geometries.add(g);const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;root.add(o)}
 const solids:SolidoEntorno[]=[{id:P.id,minX:h.x-4,maxX:h.x+4,minZ:h.z-3.5,maxZ:h.z+3.5,base:.16,top:3.5,
  footprint:[{x:h.x-4,z:h.z-3.5},{x:h.x+4,z:h.z-3.5},{x:h.x+4,z:h.z+3.5},{x:h.x-4,z:h.z+3.5}]}]
 root.userData.residence={stage:'barraquinho',paidUpgrade:false,garageSpaces:2}
 return{root,solids,dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear()}}
}
