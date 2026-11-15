import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {ARENA_ONLINE as A} from './arena-planta'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** Arena decorativa de acesso às salas existentes. Não cria partidas ou dados. */
export function criarArenaOnline(parent:T.Object3D){
 const root=new T.Group();root.name='arena-legends-online';parent.add(root)
 const batches=new Map<T.Material,T.BufferGeometry[]>(),materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),textures=new Set<T.Texture>()
 const mat=(color:string,roughness=.9)=>{const m=new T.MeshStandardMaterial({color,roughness});materials.add(m);return m}
 const ink=mat('#192c31'),cream=mat('#e9e3d3'),gold=mat('#ffc400'),green=mat('#247545'),grass=mat('#287e48'),glass=mat('#557f8a',.4),white=mat('#fff9e9'),metal=mat('#59666b')
 const add=(g:T.BufferGeometry,m:T.Material)=>{const list=batches.get(m)??[];list.push(g);batches.set(m,list)}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new T.BoxGeometry(w,h,d);g.translate(A.x+x,y,A.z+z);add(g,m)}
 const plane=(m:T.Material,w:number,d:number,x:number,y:number,z:number)=>{const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);g.translate(A.x+x,y,A.z+z);add(g,m)}
 const ring=(rx:number,rz:number,ix:number,iz:number,y:number,h:number,m:T.Material)=>{
  const s=new T.Shape();s.absellipse(0,0,rx,rz,0,Math.PI*2,false,0)
  const hole=new T.Path();hole.absellipse(0,0,ix,iz,0,Math.PI*2,true,0);s.holes.push(hole)
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:48});g.rotateX(-Math.PI/2);g.translate(A.x,y,A.z);add(g,m)
 }
 plane(cream,A.width,A.depth,0,.17,0)
 // Fachada oval, arquibancadas em seis níveis e cobertura aberta sobre o campo.
 ring(44,42,43.3,41.3,.2,7.2,ink)
 for(let row=0;row<6;row++){
  const x=39+row*5/6,z=33+row*9/6
  ring(x+5/6,z+9/6,x,z,1.9+row*.78,.5,row%3===0?gold:row%3===1?cream:green)
 }
 ring(44.8,42.8,39.5,33.5,12.5,.42,cream)
 ring(44.9,42.9,44.5,42.5,12.92,.22,gold)
 for(let i=0;i<24;i++){
  const t=i*Math.PI/12,x=Math.cos(t)*43.4,z=Math.sin(t)*41.4
  box(metal,.45,12.3,.45,x,6.35,z)
  const panel=new T.BoxGeometry(5.3,2.1,.15);panel.rotateY(-t+Math.PI/2);panel.translate(A.x+x,4.2,A.z+z);add(panel,glass)
 }
 // Campo maior que o do Grêmio (60 × 40 m contra 55 × 35 m).
 plane(grass,68,50,0,.22,0)
 for(let i=0;i<10;i++)plane(i%2?green:grass,6,40,-27+i*6,.23,0)
 const line=(x1:number,z1:number,x2:number,z2:number)=>{const g=new T.PlaneGeometry(Math.hypot(x2-x1,z2-z1),.17);g.rotateX(-Math.PI/2);g.rotateY(-Math.atan2(z2-z1,x2-x1));g.translate(A.x+(x1+x2)/2,.25,A.z+(z1+z2)/2);add(g,white)}
 const rect=(x:number,z:number,w:number,d:number)=>{line(x-w/2,z-d/2,x+w/2,z-d/2);line(x+w/2,z-d/2,x+w/2,z+d/2);line(x+w/2,z+d/2,x-w/2,z+d/2);line(x-w/2,z+d/2,x-w/2,z-d/2)}
 rect(0,0,60,40);line(0,-20,0,20)
 for(let i=0;i<48;i++){const t=i*Math.PI/24,u=(i+1)*Math.PI/24;line(Math.cos(t)*5.5,Math.sin(t)*5.5,Math.cos(u)*5.5,Math.sin(u)*5.5)}
 for(const side of[-1,1]){
  rect(side*26,0,8,19);rect(side*28.5,0,3,9)
  for(const z of[-3,3]){box(white,.16,2.5,.16,side*30,1.5,z);box(metal,.12,2.5,.12,side*32,1.5,z)}
  box(white,.16,.16,6.2,side*30,2.75,0);box(metal,2,.12,.12,side*31,2.75,-3);box(metal,2,.12,.12,side*31,2.75,3)
 }
 // Pórtico, marquise, passeio e quatro torres de iluminação.
 box(glass,14,4,.2,0,2.25,42.15);box(ink,21,.45,4.5,0,5,43.2);box(gold,21,.14,.22,0,5.3,45.35)
 for(const side of[-1,1])box(gold,.5,5.1,.5,side*8.5,2.75,43.1)
 plane(cream,7,A.frontWalkZ-(A.z+45),0,.19,(45+(A.frontWalkZ-A.z))/2)
 for(const x of[-38,38])for(const z of[-35,35]){box(metal,.55,22,.55,x,11.2,z);box(ink,5.4,1.8,1.2,x,22.3,z);for(let i=0;i<4;i++)box(white,.9,1,.2,x-1.8+i*1.2,22.3,z+.66)}
 function sign(w:number,h:number,y:number,z:number,roof=false){
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([25,44,49,255]),1,1)
  else{const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const g=c.getContext('2d')!;g.fillStyle='#192c31';g.fillRect(0,0,c.width,c.height);g.fillStyle='#ffc400';g.font=`800 ${c.height*.68}px Oswald,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('ARENA LEGENDS',512,c.height*.52,970);map=new T.CanvasTexture(c)}
  textures.add(map);map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;const m=new T.MeshBasicMaterial({map,toneMapped:false});materials.add(m)
  const g=new T.PlaneGeometry(w,h);if(roof)g.rotateX(-Math.PI/2);g.translate(A.x,y,A.z+z);add(g,m)
 }
 sign(26,2.4,7.55,42.65);sign(27,3.7,13.17,37.8,true)
 for(const[m,list]of batches){const prepared=list.map(g=>g.index?g.toNonIndexed():g);const merged=mergeGeometries(prepared,false);if(merged){geometries.add(merged);const o=new T.Mesh(merged,m);o.castShadow=true;o.receiveShadow=true;root.add(o)}for(const g of new Set([...list,...prepared]))g.dispose()}
 const b=A.building,solids:SolidoEntorno[]=[{id:A.id,...b,base:.16,top:A.height,footprint:[{x:b.minX,z:b.minZ},{x:b.maxX,z:b.minZ},{x:b.maxX,z:b.maxZ},{x:b.minX,z:b.maxZ}]}]
 root.userData.arena={lot:A,pitch:A.pitch,standRows:6,drawCalls:root.children.length}
 return{root,solids,dispose(){root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.clear()}}
}
