import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {PLANTA_COMPLEXO,type EstadoComplexo} from './presidencia-complexo-model'
import {LOJA_CLUBE_3D} from './presidencia-loja-planta'
import {getLang} from './lang'

/** Static architectural finishes. Existing lots, physical doors, purchases and
 * pedestrian routes remain the source of truth. One merged mesh per material. */
export function criarAcabamentosComerciais(parent:T.Object3D,state:EstadoComplexo){
 const root=new T.Group();root.name='acabamentos-comerciais';parent.add(root)
 const batches=new Map<T.Material,T.BufferGeometry[]>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),geometries=new Set<T.BufferGeometry>()
 const mat=(color:string,roughness=.8)=>{const m=new T.MeshStandardMaterial({color,roughness});materials.add(m);return m}
 const ink=mat('#1d2328',.65),cream=mat('#f4ecd6'),gold=mat('#ffc400',.55),glass=mat('#719eac',.25),wood=mat('#805a37'),green=mat('#224f3a'),red=mat('#a83d2e')
 glass.userData.complexoNightEmission={color:'#f1dfbb',intensity:.35,dayIntensity:.02}
 const add=(g:T.BufferGeometry,m:T.Material)=>{const list=batches.get(m)??[];list.push(g);batches.set(m,list)}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number,yaw=0)=>{const g=new T.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);add(g,m)}
 const at=(x:number,z:number,u:number,v:number,yaw:number)=>({x:x+u*Math.cos(yaw)+v*Math.sin(yaw),z:z-u*Math.sin(yaw)+v*Math.cos(yaw)})
 const localBox=(m:T.Material,w:number,h:number,d:number,x:number,z:number,u:number,y:number,v:number,yaw:number)=>{const p=at(x,z,u,v,yaw);box(m,w,h,d,p.x,y,p.z,yaw)}
 const en=getLang()==='en',word=(pt:string,eng:string)=>en?eng:pt
 const sign=(label:string,w:number,h:number,x:number,y:number,z:number,yaw=0,bg='#1d2328',fg='#ffc400')=>{
  if(typeof document==='undefined')return
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const g=c.getContext('2d')!
  g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.fillRect(0,c.height-5,c.width,5);g.textAlign='center';g.textBaseline='middle';g.font=`800 ${Math.round(c.height*.69)}px Oswald,Arial,sans-serif`;g.fillText(label,c.width/2,c.height*.49,c.width-44)
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.add(texture)
  const m=new T.MeshBasicMaterial({map:texture,toneMapped:false});materials.add(m);const geo=new T.PlaneGeometry(w,h);geo.rotateY(yaw);geo.translate(x,y,z);add(geo,m)
 }
 if(state.extras.loja){
  const {x,z,width:w,depth:d,height:h,heading:a}=LOJA_CLUBE_3D
  const part=(m:T.Material,bw:number,bh:number,bd:number,u:number,y:number,v:number)=>localBox(m,bw,bh,bd,x,z,u,y,v,a)
  part(ink,w+.55,.3,d+.55,0,h+.4,0);part(cream,6,.35,5.4,3.2,h+.74,-4.5);part(glass,5.6,.18,5,3.2,h+1,-4.5);for(const u of[1.35,3.2,5.05])part(ink,.12,.2,5.1,u,h+1.12,-4.5);part(ink,w+.25,.44,d+.25,0,.4,0)
  // Finished corner facing +z in the opening view. The east door stays open.
  for(const v of[-7.4,-3.7,0,3.7,7.4]){part(glass,.1,2.75,3.5,-w/2-.17,2.18,v);part(ink,.2,3.25,.15,-w/2-.24,2.13,v-1.8)}
  part(ink,.3,1.1,d+.5,-w/2-.13,4.65,0);part(gold,.36,.12,d+.55,-w/2-.16,4.05,0)
  for(const u of[-w/2,w/2])for(const v of[-d/2,d/2])part(ink,.42,h+.45,.42,u,h/2+.22,v)
  part(ink,w+.75,.24,2.2,0,3.55,d/2+.65);part(gold,w+.75,.13,.18,0,3.42,d/2+1.74)
  part(ink,1.25,.2,d+.75,-w/2-.55,3.55,0);part(gold,.12,.12,d+.75,-w/2-1.12,3.43,0)
  // Store windows use neutral display silhouettes, not a paid club kit.
  for(const v of[-5.5,1.9,5.6]){part(cream,.16,1.2,.85,-w/2-.25,2.12,v);part(gold,.17,.3,1.22,-w/2-.27,2.4,v)}
  sign(word('LOJA DA TORCIDA','FAN SHOP'),d-1.7,1.0,x,4.64,z+w/2+.31)
 }
 if(state.extras.chopp){
  const p=PLANTA_COMPLEXO.doors.chopp,a=p.heading
  const part=(m:T.Material,w:number,h:number,d:number,u:number,y:number,v:number)=>localBox(m,w,h,d,p.x,p.z,u,y,v,a)
  part(ink,31.5,.5,13.3,-9,4.92,-6.4);part(gold,31.5,.14,.36,-9,4.58,.23)
  part(glass,21.6,2.6,.12,-13.2,1.95,.35);part(glass,3.8,2.6,.12,4.25,1.95,.35);for(let k=0;k<=8;k++)part(ink,.24,3.35,.28,-24.5+k*31/8,1.9,.48)
  part(ink,8.8,.28,3.4,0,3.3,1.45);part(green,8.8,.34,.25,0,3.04,3.14)
  const t=at(p.x,p.z,-9,.34,a);sign(word('BAR DA TORCIDA','SUPPORTERS’ BAR'),29,1.15,t.x,4.98,t.z,a)
  for(const u of[-2.7,2.7])part(wood,.18,3.05,.18,u,1.68,2.9)
 }
 if(state.extras.hotel){
  const f=PLANTA_COMPLEXO.lots.hotel.footprint,a=f[5],b=f[4],l=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/l,dz=(b.z-a.z)/l
  const corners=[a,b,{x:b.x+dz*33,z:b.z-dx*33},{x:a.x+dz*33,z:a.z-dx*33}]
  for(let i=0;i<4;i++){
   const p=corners[i],q=corners[(i+1)%4],len=Math.hypot(q.x-p.x,q.z-p.z),yaw=-Math.atan2(q.z-p.z,q.x-p.x),x=(p.x+q.x)/2,z=(p.z+q.z)/2
   box(ink,len+.35,.8,.5,x,.6,z,yaw);box(ink,len+.65,.65,.7,x,22.82,z,yaw);box(gold,len+.7,.13,.74,x,22.35,z,yaw)
   for(let k=0;k<=Math.round(len/7);k++){const u=k/Math.round(len/7);box(cream,.3,22,.4,p.x+(q.x-p.x)*u,11.25,p.z+(q.z-p.z)*u,yaw)}
  }
  const door=PLANTA_COMPLEXO.doors.hotel,heading=door.heading,part=(m:T.Material,w:number,h:number,d:number,u:number,y:number,v:number)=>localBox(m,w,h,d,door.x,door.z,u,y,v,heading)
  part(cream,12,.02,5.5,0,.15,2.5);for(const u of[-5.2,5.2])part(green,1.1,.5,1.1,u,.45,2.2);part(ink,11.7,.35,3.3,0,3.45,1.15);part(gold,11.7,.14,.2,0,3.2,2.8)
  for(const u of[-4.4,4.4])part(glass,3.1,2.5,.12,u,1.7,.23)
  const entry=at(door.x,door.z,0,2.94,heading);sign(word('RECEPÇÃO','RECEPTION'),8.2,.55,entry.x,3.46,entry.z,heading)
  // A second name is visible from the opening camera, not only the hotel view.
  const area=corners.reduce((v,p,i)=>{const q=corners[(i+1)%4];return v+p.x*q.z-q.x*p.z},0)
  const faces=corners.map((p,i)=>{const q=corners[(i+1)%4],len=Math.hypot(q.x-p.x,q.z-p.z),nx=(q.z-p.z)/len*(area>0?1:-1),nz=-(q.x-p.x)/len*(area>0?1:-1);return{i,len,nx,nz,x:(p.x+q.x)/2,z:(p.z+q.z)/2}})
  // The original reception sign occupies edge 1. Finish the other visible face.
  const front=faces.filter(f=>f.i!==1).sort((a,b)=>(b.nx*.16+b.nz*1.45)-(a.nx*.16+a.nz*1.45))[0]
  sign('HOTEL',Math.min(14,front.len-2),1.65,front.x+front.nx*.36,19.8,front.z+front.nz*.36,Math.atan2(front.nx,front.nz))
 }
 if(state.extras.praca){
  const lot=PLANTA_COMPLEXO.lots.praca,a=lot.footprint[0],b=lot.footprint[2],colors=[red,green,ink]
  for(const [i,t]of[.22,.5,.75].entries()){
   const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,angle=lot.heading,part=(m:T.Material,w:number,h:number,d:number,u:number,y:number,v:number)=>localBox(m,w,h,d,x,z,u,y,v,angle)
   part(ink,4.9,1.5,.15,0,7.15,2.1);part(cream,5.3,.16,1.05,0,6.45,2.4);part(colors[i],6.8,.35,1.5,0,8.7,2.2)
   const p=at(x,z,0,2.99,angle);sign([word('LANCHES','SNACKS'),word('CHURRASCO','GRILL'),word('BEBIDAS','DRINKS')][i],5.6,.65,p.x,8.72,p.z,angle)
  }
 }
 for(const[m,list]of batches){const g=mergeGeometries(list,false)!;list.forEach(p=>p.dispose());geometries.add(g);const mesh=new T.Mesh(g,m);mesh.castShadow=m instanceof T.MeshStandardMaterial;mesh.receiveShadow=true;root.add(mesh)}
 root.userData.commercialFinishes={storeFronts:state.extras.loja?2:0,storeFloors:1,existingDoorsPreserved:true,static:true,meshCount:root.children.length}
 let disposed=false
 return{root,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.clear()}}
}
