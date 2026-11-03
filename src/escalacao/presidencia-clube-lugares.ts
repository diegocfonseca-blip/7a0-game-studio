import * as T from 'three'
import {PLANTA_COMPLEXO,type EstadoComplexo} from './presidencia-complexo-model'
import {LOTE_AGENCIA_CLUBE as A,nomeAgenciaClube} from './clube-mapa-destinos'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** Visual addresses for existing club screens. No purchase, income or save. */
export function criarLugaresClube(parent:T.Object3D,state:EstadoComplexo,clubName?:string){
 const root=new T.Group();root.name='lugares-do-clube';parent.add(root)
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),solids:SolidoEntorno[]=[]
 const cream=new T.MeshStandardMaterial({color:'#f4ecd6',roughness:.9}),ink=new T.MeshStandardMaterial({color:'#233746',roughness:.85}),glass=new T.MeshStandardMaterial({color:'#648294',roughness:.4}),gold=new T.MeshStandardMaterial({color:'#ffc400',roughness:.85})
 for(const m of[cream,ink,glass,gold])materials.add(m)
 function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){geometries.add(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z)
 function sign(lines:string[],w:number,h:number,x:number,y:number,z:number,roof=false,angle=0){
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([244,236,214,255]),1,1)
  else{const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);const g=c.getContext('2d')!;g.fillStyle='#f4ecd6';g.fillRect(0,0,c.width,c.height);g.fillStyle='#0c0c0c';g.textAlign='center';g.textBaseline='middle';lines.forEach((line,i)=>{g.font=`900 ${Math.min(70,c.height/(lines.length+1))}px Oswald,Arial,sans-serif`;g.fillText(line,c.width/2,c.height*(i+.5)/lines.length,c.width-25)});map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.add(map);const m=new T.MeshBasicMaterial({map,toneMapped:false});materials.add(m)
  const o=mesh(new T.PlaneGeometry(w,h),m,x,y,z);if(roof)o.rotation.x=-Math.PI/2;o.rotateOnWorldAxis(new T.Vector3(0,1,0),angle);o.castShadow=false;return o
 }
 if(state.extras.loja){
  const lot=PLANTA_COMPLEXO.lots.loja,poly=lot.footprint
  const edges=poly.map((p,i)=>{const q=poly[(i+1)%poly.length];return{p,q,length:Math.hypot(q.x-p.x,q.z-p.z)}}).sort((a,b)=>b.length-a.length)
  const e=edges[0],cx=poly.reduce((n,p)=>n+p.x,0)/poly.length,cz=poly.reduce((n,p)=>n+p.z,0)/poly.length,angle=-Math.atan2(e.q.z-e.p.z,e.q.x-e.p.x)
  const inside=(x:number,z:number)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes}
  let width=Math.min(24,e.length*.7),depth=8
  // Fit the real polygon, not the navigation box (its axis follows the door).
  // This is paint on the existing roof, never a floating sign over its edge.
  for(let i=0;i<30;i++){if([-1,1].every(sx=>[-1,1].every(sz=>inside(cx+Math.cos(angle)*sx*width/2+Math.sin(angle)*sz*depth/2,cz-Math.sin(angle)*sx*width/2+Math.cos(angle)*sz*depth/2))))break;width*=.9;depth*=.9}
  sign(['LOJA DO CLUBE',clubName??''],width,depth,cx,7.485,cz,true,angle)
  const door=lot.door!.threshold
  const front=edges.map(e=>({...e,d:Math.hypot((e.p.x+e.q.x)/2-door.x,(e.p.z+e.q.z)/2-door.z)})).sort((a,b)=>a.d-b.d)[0]
  const x=(front.p.x+front.q.x)/2,z=(front.p.z+front.q.z)/2;let nx=(front.q.z-front.p.z)/front.length,nz=-(front.q.x-front.p.x)/front.length
  if(nx*(x-cx)+nz*(z-cz)<0){nx=-nx;nz=-nz}
  sign(['LOJA DO CLUBE'],Math.min(12,front.length-1),1.8,x+nx*.19,5.8,z+nz*.19,false,Math.atan2(nx,nz))
 }
 if(clubName){
  box(cream,A.width,.16,A.depth,A.x,.08,A.z)
  box(cream,26,7,20,A.x,3.66,A.z);box(ink,27,.25,21,A.x,7.29,A.z)
  for(const s of[-1,1])box(glass,9,2,.08,A.x+s*7,2.5,A.z+10.08)
  box(ink,2.6,3.5,.12,A.x,1.91,A.z+10.12);box(gold,27,.4,.5,A.x,5.1,A.z+10.1)
  sign([nomeAgenciaClube(clubName),'PATROCÍNIOS · EMPRESÁRIOS'],25,2.3,A.x,6.15,A.z+10.16)
  sign([nomeAgenciaClube(clubName),'PATROCÍNIOS · EMPRESÁRIOS'],24,13,A.x,7.44,A.z,true)
  // Pedestrian link from the existing east service street, without a new road.
  box(cream,25,.04,2.8,216.5,.18,106);box(cream,2.8,.04,26,205.4,.18,93)
  solids.push({id:A.id,minX:A.x-13,maxX:A.x+13,minZ:A.z-10,maxZ:A.z+10,base:.16,top:7.16,footprint:[{x:A.x-13,z:A.z-10},{x:A.x+13,z:A.z-10},{x:A.x+13,z:A.z+10},{x:A.x-13,z:A.z+10}]})
 }
 root.userData.clubPlaces={clubName:clubName??null,store:state.extras.loja,agency:!!clubName}
 let disposed=false
 return{root,solids,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.clear()}}
}
