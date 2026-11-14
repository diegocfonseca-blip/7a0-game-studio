import {getLang} from './lang'
import {ARENA_ONLINE as ARENA} from './arena-planta'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {LOJA_CLUBE_3D} from './presidencia-loja-planta'
import * as T from 'three'
import {type EstadoComplexo} from './presidencia-complexo-model'
import {criarAgenciaClube} from './presidencia-agencia-3d'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** Visual addresses for existing club screens. No purchase, income or save. */
export function criarLugaresClube(parent:T.Object3D,state:EstadoComplexo,clubName?:string,residence=false,arena=false,crest?:string,onReady?:()=>void){
 const root=new T.Group();root.name='lugares-do-clube';parent.add(root);let disposed=false
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),solids:SolidoEntorno[]=[]
 const cream=new T.MeshStandardMaterial({color:'#f4ecd6',roughness:.9}),ink=new T.MeshStandardMaterial({color:'#233746',roughness:.85}),glass=new T.MeshStandardMaterial({color:'#648294',roughness:.4}),gold=new T.MeshStandardMaterial({color:'#ffc400',roughness:.85})
 for(const m of[cream,ink,glass,gold])materials.add(m)
 function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){geometries.add(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z)
 function sign(lines:string[],w:number,h:number,x:number,y:number,z:number,roof=false,angle=0){
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([244,236,214,255]),1,1)
  else{const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);const g=c.getContext('2d')!;const store=lines[0]==='LOJA DA TORCIDA'||lines[0]==='FAN SHOP';g.fillStyle=store?'#1d2328':'#f4ecd6';g.fillRect(0,0,c.width,c.height);g.fillStyle=store?'#ffc400':'#0c0c0c';g.textAlign='center';g.textBaseline='middle';if(roof&&lines[0]==='LOJA DO CLUBE'){g.fillStyle='#13291b';g.fillRect(0,0,c.width,c.height);g.fillStyle='#ffc400';g.fillRect(25,25,c.width-50,12);g.font='700 190px Oswald,Arial,sans-serif';g.fillText('LOJA',c.width/2,c.height*.48,c.width-60);g.fillStyle='#f4ecd6';g.font='700 52px Oswald,Arial,sans-serif';g.fillText('DO CLUBE',c.width/2,c.height*.77,c.width-70)}else{lines.forEach((line,i)=>{g.font=`900 ${Math.min(70,c.height/(lines.length===1?1.12:lines.length+1))}px Oswald,Arial,sans-serif`;g.fillText(line,c.width/2,c.height*(i+.5)/lines.length,c.width-25)})};map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.add(map);const m=new T.MeshBasicMaterial({map,toneMapped:false});materials.add(m)
  const o=mesh(new T.PlaneGeometry(w,h),m,x,y,z);if(roof)o.rotation.x=-Math.PI/2;o.rotateOnWorldAxis(new T.Vector3(0,1,0),angle);o.castShadow=false;return o
 }
 if(state.extras.loja){
  const {x,z,height,heading,depth}=LOJA_CLUBE_3D
  sign([getLang()==='en'?'FAN SHOP':'LOJA DA TORCIDA'],10,2.6,x,height+.58,z,true,0)
  sign([getLang()==='en'?'FAN SHOP':'LOJA DA TORCIDA'],14,1.15,x+Math.sin(heading)*(depth/2+.35),4.65,z+Math.cos(heading)*(depth/2+.35),false,heading)
  if(crest){const map=new T.TextureLoader().load(crest,tex=>{if(disposed){tex.dispose();return}tex.colorSpace=T.SRGBColorSpace;onReady?.()});textures.add(map);const m=new T.MeshBasicMaterial({map,transparent:true,toneMapped:false,depthWrite:false});materials.add(m);mesh(new T.PlaneGeometry(1.9,1.9),m,x-7.1,2.3,z+depth/2+.38).castShadow=false}


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
  // Identificação integrada à entrada; a cúpula não recebe mais um outdoor.
  box(ink,12.6,.35,2.2,a.x,3.55,a.z+9.5)
  box(gold,12.6,.14,.18,a.x,3.3,a.z+10.55)
  solids.push({id:a.id,minX:a.x-9,maxX:a.x+9,minZ:a.z-9,maxZ:a.z+9,base:.16,top:9,footprint:[{x:a.x-9,z:a.z-9},{x:a.x+9,z:a.z-9},{x:a.x+9,z:a.z+9},{x:a.x-9,z:a.z+9}]})
 }
 let agency:ReturnType<typeof criarAgenciaClube>|undefined
 if(clubName){
  // 🏢 05/11: prédio novo, no lado da torcida da casa (presidencia-agencia-3d.ts)
  agency=criarAgenciaClube(root,clubName,crest,onReady);solids.push(...agency.solids)
 }
 root.userData.clubPlaces={clubName:clubName??null,store:state.extras.loja,agency:!!clubName}
 return{root,solids,dispose(){if(disposed)return;disposed=true;agency?.dispose();root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.clear()}}
}
