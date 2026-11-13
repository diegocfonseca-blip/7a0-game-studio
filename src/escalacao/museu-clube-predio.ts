import * as T from 'three'
/** Former agency parcel, outside the stadium, beside the purchased store.
 * The entrance faces north, toward the existing pedestrian forecourt. */
export const LOTE_MUSEU_CLUBE={id:'museu-clube',x:-61,z:141.5,height:8,
 building:{minX:-67.5,maxX:-54.5,minZ:134,maxZ:149},
 footprint:[{x:-69,z:126.2},{x:-53.3,z:126.2},{x:-53.3,z:150.5},{x:-69,z:150.5}]} as const
/** Convex footprint intersection, including height. The diagonal 3.2km rail
 * deck has a huge axis-aligned box; its box alone is not a collision. */
export function interfereLoteMuseu(solid:{base:number;top:number;footprint:readonly {x:number;z:number}[]}){
 if(solid.base>=LOTE_MUSEU_CLUBE.height||solid.top<=.12)return false
 const b=LOTE_MUSEU_CLUBE.building,a=[{x:b.minX,z:b.minZ},{x:b.maxX,z:b.minZ},{x:b.maxX,z:b.maxZ},{x:b.minX,z:b.maxZ}],other=solid.footprint
 if(other.length<3)return false
 for(const polygon of [a,other])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],nx=-(q.z-p.z),nz=q.x-p.x
  if(Math.abs(nx)+Math.abs(nz)<1e-9)continue
  const one=a.map(p=>p.x*nx+p.z*nz),two=other.map(p=>p.x*nx+p.z*nz)
  if(Math.max(...one)<=Math.min(...two)+1e-8||Math.max(...two)<=Math.min(...one)+1e-8)return false
 }
 return true
}
export function criarPredioMuseu(stage:number){
 const root=new T.Group();root.name='museu-do-clube';root.userData.stage=stage
 const geos:T.BufferGeometry[]=[],mats:T.Material[]=[],textures:T.Texture[]=[]
 const box=(color:string,w:number,h:number,d:number,x:number,y:number,z:number)=>{
  const g=new T.BoxGeometry(w,h,d),m=new T.MeshStandardMaterial({color,roughness:.75});geos.push(g);mats.push(m)
  const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o
 }
 const plaque=(text:string,w:number,h:number,x:number,y:number,z:number,roof=false,south=false)=>{
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(96,Math.round(1024*h/w));const a=c.getContext('2d')!
  a.fillStyle='#14271b';a.fillRect(0,0,c.width,c.height);a.strokeStyle='#d2b76e';a.lineWidth=Math.max(4,c.height*.045);a.strokeRect(6,6,c.width-12,c.height-12)
  a.fillStyle='#f4ecd6';a.font=`700 ${Math.round(c.height*.66)}px Oswald,Arial`;a.textAlign='center';a.textBaseline='middle';a.fillText(text,512,c.height*.52,960)
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.push(tex)
  const g=new T.PlaneGeometry(w,h),m=new T.MeshBasicMaterial({map:tex});geos.push(g);mats.push(m)
  const o=new T.Mesh(g,m);o.position.set(x,y,z);if(roof){o.rotation.x=-Math.PI/2;o.rotation.z=Math.PI}else o.rotation.y=south?0:Math.PI;root.add(o)
 }
 // A reserved landscaped plot is not a free completed museum.
 box('#d4cab3',15.2,.12,22.5,0,.02,-3.8)
 if(stage===0){plaque('MUSEU · TERRENO',10,2.8,0,.1,0,true)}
 else{
  box('#b7a185',13.4,.35,15.4,0,.25,0);box('#f4ecd6',13,.15,15,0,.5,0)
  if(stage>=2){box('#e6ddc8',13,4.6,.3,0,2.9,7.35);for(const x of[-6.35,6.35])box('#e6ddc8',.3,4.6,15,x,2.9,0)}
  if(stage>=3){box('#18261d',13.5,.55,15.5,0,5.6,0);plaque('MUSEU',8.5,3.3,0,5.9,.6,true)}
  if(stage===4){for(const x of[-4.4,0,4.4])box('#48717a',3.8,3,.15,x,2.75,7.55);plaque('MUSEU DO CLUBE',12.2,1.1,0,4.8,7.68,false,true);for(const x of[-4.5,0,4.5]){box('#203e43',3.7,3.25,.15,x,2.7,-7.62);box('#272d28',.18,3.5,.3,x-1.9,2.7,-7.73)}box('#b4974e',13.2,.14,.4,0,1.07,-7.72);plaque('MUSEU DO CLUBE',12.2,1.1,0,4.8,-7.84);box('#18261d',4,.18,2,0,3.5,-8.3);box('#d4cab3',4,.3,1.2,0,.25,-8.3);box('#d4cab3',4.8,.15,1.3,0,.13,-9.2)
   // Roof landmark is an architectural trophy symbol, not an awarded title.
   const g=new T.CylinderGeometry(1.1,.35,1.45,12,1,true),m=new T.MeshStandardMaterial({color:'#c6ab61',metalness:.65,roughness:.35});geos.push(g);mats.push(m);const cup=new T.Mesh(g,m);cup.position.set(0,7.1,3);root.add(cup);box('#b59a52',1.8,.2,1.8,0,6.25,3)
   for(const x of[-6.7,6.7]){box('#46553b',1,.6,1,x,.6,-8.5);box('#3f6a34',1.3,.8,1.3,x,1.25,-8.5)}
  }else{plaque(`MUSEU · ${stage}/4`,10,1.2,0,1.7,-8.4);for(const x of[-6.8,6.8])box('#c8a45c',.12,1.4,17,x,1.2,0)}
 }
 return {root,dispose(){root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
}
