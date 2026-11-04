import {ARENA_ONLINE as ARENA} from './arena-planta'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {LOJA_CLUBE_3D} from './presidencia-loja-planta'
import * as T from 'three'
import {type EstadoComplexo} from './presidencia-complexo-model'
import {LOTE_AGENCIA_CLUBE as A,nomeAgenciaClube} from './clube-mapa-destinos'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** Visual addresses for existing club screens. No purchase, income or save. */
export function criarLugaresClube(parent:T.Object3D,state:EstadoComplexo,clubName?:string,residence=false,arena=false){
 const root=new T.Group();root.name='lugares-do-clube';parent.add(root)
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),solids:SolidoEntorno[]=[]
 const cream=new T.MeshStandardMaterial({color:'#f4ecd6',roughness:.9}),ink=new T.MeshStandardMaterial({color:'#233746',roughness:.85}),glass=new T.MeshStandardMaterial({color:'#648294',roughness:.4}),gold=new T.MeshStandardMaterial({color:'#ffc400',roughness:.85})
 for(const m of[cream,ink,glass,gold])materials.add(m)
 function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){geometries.add(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z)
 function sign(lines:string[],w:number,h:number,x:number,y:number,z:number,roof=false,angle=0){
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([244,236,214,255]),1,1)
  else{const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);const g=c.getContext('2d')!;g.fillStyle='#f4ecd6';g.fillRect(0,0,c.width,c.height);g.fillStyle='#0c0c0c';g.textAlign='center';g.textBaseline='middle';lines.forEach((line,i)=>{g.font=`900 ${Math.min(70,c.height/(lines.length===1?1.12:lines.length+1))}px Oswald,Arial,sans-serif`;g.fillText(line,c.width/2,c.height*(i+.5)/lines.length,c.width-25)});map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.add(map);const m=new T.MeshBasicMaterial({map,toneMapped:false});materials.add(m)
  const o=mesh(new T.PlaneGeometry(w,h),m,x,y,z);if(roof)o.rotation.x=-Math.PI/2;o.rotateOnWorldAxis(new T.Vector3(0,1,0),angle);o.castShadow=false;return o
 }
 if(state.extras.loja){
  const {x,z,height,heading}=LOJA_CLUBE_3D
  sign(['LOJA DO CLUBE',clubName??''],14,9,x,height+.285,z,true,heading)
  sign([`LOJA DO CLUBE · ${clubName??''}`],14,.8,x-10.23,4.36,z,false,heading)

 }
 if(residence)sign(['SUA CASA'],8,1.2,HOME.house.x,1.4,HOME.z+HOME.depth/2+.16)
 if(arena){
  const a=ARENA
  box(cream,20,.16,20,a.x,.08,a.z)
  mesh(new T.CylinderGeometry(8.8,9,5.4,16),ink,a.x,2.86,a.z)
  const dome=mesh(new T.SphereGeometry(9,20,10,0,Math.PI*2,0,Math.PI/2),cream,a.x,5.56,a.z);dome.scale.y=.36
  box(glass,5,3.2,.14,a.x,1.76,a.z+9.08)
  for(const side of[-1,1]){box(gold,.4,4.2,.4,a.x+side*3,2.26,a.z+9);box(glass,2.6,1.7,.14,a.x+side*5.1,2.4,a.z+7.25)}
  sign(['ARENA LEGENDS'],13,1.55,a.x,4.55,a.z+8.92)
  box(ink,12,.12,6,a.x,8.78,a.z)
  sign(['ARENA LEGENDS','SALAS ONLINE'],12,6,a.x,8.9,a.z,true)
  solids.push({id:a.id,minX:a.x-9,maxX:a.x+9,minZ:a.z-9,maxZ:a.z+9,base:.16,top:9,footprint:[{x:a.x-9,z:a.z-9},{x:a.x+9,z:a.z-9},{x:a.x+9,z:a.z+9},{x:a.x-9,z:a.z+9}]})
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
