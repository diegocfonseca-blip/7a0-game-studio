import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {texturaLogoPatrocinador} from './presidencia-patrocinador-logo'
import {ACESSO_GECG_CIDADE,LOGOS_PATROCINADORES_CIDADE,LOTES_PATROCINADORES_CIDADE as LOTS,type PatrocinadorCidadeId} from './presidencia-patrocinadores-planta'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import type {PortaComplexo} from './presidencia-complexo-model'

/** Permanent illustrative sponsor premises. No contracts, bookings, income,
 * purchases, match engine, animated actors or external services live here. */
export function criarPatrocinadoresCidade(parent:T.Object3D,onReady?:()=>void){
 const root=new T.Group();root.name='patrocinadores-cidade';parent.add(root)
 const batches=new Map<T.Material,T.BufferGeometry[]>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),geometry=new Set<T.BufferGeometry>(),logos=new Map<PatrocinadorCidadeId,T.Texture>(),solids:SolidoEntorno[]=[],doors:Record<string,PortaComplexo>={}
 const paint=new Map<string,T.MeshStandardMaterial>(),floor=.16
 const mat=(color:string,roughness=.88)=>{const key=color+roughness;let m=paint.get(key);if(!m){m=new T.MeshStandardMaterial({color,roughness});materials.add(m);paint.set(key,m)}return m}
 const cream=mat('#e9e3d3'),concrete=mat('#a7aaa4'),navy=mat('#142c43'),metal=mat('#434d50'),glass=mat('#416b7c',.36),black=mat('#202725'),white=mat('#fff9e9'),green=mat('#174b2b'),teal=mat('#4dbbb8'),wood=mat('#855b38')
 const add=(g:T.BufferGeometry,m:T.Material)=>{const list=batches.get(m)??[];list.push(g);batches.set(m,list)}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,m)}
 const solid=(id:string,x:number,z:number,w:number,d:number,base:number,top:number)=>{const minX=x-w/2,maxX=x+w/2,minZ=z-d/2,maxZ=z+d/2;solids.push({id,minX,maxX,minZ,maxZ,base,top,footprint:[{x:minX,z:minZ},{x:maxX,z:minZ},{x:maxX,z:maxZ},{x:minX,z:maxZ}]})}
 const plane=(m:T.Material,w:number,h:number,x:number,y:number,z:number,roof=false)=>{const g=new T.PlaneGeometry(w,h);if(roof)g.rotateX(-Math.PI/2);g.translate(x,y,z);add(g,m)}
 function logo(id:PatrocinadorCidadeId,x:number,y:number,z:number,maxWidth:number,maxHeight:number,roof=false){
  const art=LOGOS_PATROCINADORES_CIDADE[id];let map=logos.get(id)
  if(!map){map=texturaLogoPatrocinador(id,onReady);logos.set(id,map);textures.add(map)}
  let material=[...materials].find(m=>m.name==='logo-oficial-'+id)
  if(!material){material=new T.MeshBasicMaterial({name:'logo-oficial-'+id,map,transparent:true,depthWrite:false,toneMapped:false});materials.add(material)}
  const h=Math.min(maxHeight,maxWidth*art.height/art.width),w=h*art.width/art.height,bg=mat(art.background)
  if(roof)box(bg,w+.4,.12,h+.4,x,y-.09,z)
  else box(bg,w+.4,h+.3,.12,x,y,z-.08)
  plane(material,w,h,x,y,z,roof)
 }
 function text(value:string,x:number,y:number,z:number,w:number,h:number,bg='#142c43',fg='#fff9e9',roof=false){
  let map:T.Texture
  if(typeof document!=='undefined'){
   const c=document.createElement('canvas');c.width=768;c.height=Math.max(48,Math.round(768*h/w));const g=c.getContext('2d')!
   g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.font=`800 ${Math.min(c.height*.58,60)}px Oswald, Arial, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=fg;g.fillText(value,c.width/2,c.height*.53,c.width-30);map=new T.CanvasTexture(c)
  }else map=new T.DataTexture(new Uint8Array([20,44,67,255]),1,1)
  map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.add(map);const material=new T.MeshBasicMaterial({map,toneMapped:false});materials.add(material);plane(material,w,h,x,y,z,roof)
 }
 function building(id:keyof typeof LOTS,h:number,w:number,d:number,color:T.Material,doorWidth=3.2){
  const p=LOTS[id],front=p.z+d/2,doorX=p.x
  box(concrete,p.width,.16,p.depth,p.x,.08,p.z)
  box(color,w,h,.3,p.x,floor+h/2,p.z-d/2)
  for(const sign of[-1,1])box(color,.3,h,d,p.x+sign*w/2,floor+h/2,p.z)
  for(const sign of[-1,1]){const part=(w-doorWidth)/2,cx=p.x+sign*(doorWidth/2+part/2);box(color,part,h,.3,cx,floor+h/2,front);solid(id+'-front-'+sign,cx,front,part,.35,floor,floor+h)}
  box(color,doorWidth,h-3.2,.3,doorX,floor+3.2+(h-3.2)/2,front)
  box(metal,w+.6,.22,d+.6,p.x,floor+h+.11,p.z)
  solid(id+'-back',p.x,p.z-d/2,w,.35,floor,floor+h)
  for(const sign of[-1,1])solid(id+'-side-'+sign,p.x+sign*w/2,p.z,.35,d,floor,floor+h)
  doors[id]={id,approach:{x:doorX,z:front+5},threshold:{x:doorX,z:front+.2},inside:{x:doorX,z:front-2},stay:4,heading:0,x:doorX,z:front+.2}
  box(cream,2.8,.04,p.frontWalkZ-front,p.x,.18,(front+p.frontWalkZ)/2)
  return{...p,front}
 }
 const ds=building('dsouza',8.5,48,28,green,5.6)
 // Showroom térreo: vitrine e portal, sem mudar a abertura ou a rotina de entrega.
 box(glass,27,4.2,.08,ds.x-10,3.0,ds.front+.18)
 for(const x of[-24,-18,-10,-2,24])box(black,.3,7.8,.5,ds.x+x,4.1,ds.front+.18)
 box(black,49,.6,29,ds.x,8.9,ds.z);box(cream,49,.12,.45,ds.x,9.25,ds.front+.5)
 box(black,8.7,.3,3.5,ds.x,3.5,ds.front+1.35)
 text('DSOUZA EMPREENDIMENTOS',ds.x,8.45,ds.front+.64,45,1.1,'#102d19')

 // Corrugated roof, loading canopy and framed football illustrations.
 for(let i=0;i<17;i++)box(metal,.08,.12,28.4,ds.x-23+i*2.9,8.92,ds.z)
 for(let i=0;i<4;i++){
  const x=ds.x-19+i*3.5;box(wood,2.5,3.15,.13,x,2.45,ds.front+.19);box(white,2.24,2.88,.04,x,2.45,ds.front+.27)
  // Illustrative display, not an invented official product photograph.
  const ink=i%2?green:navy;box(ink,1.1,1.4,.025,x,2.45,ds.front+.3);for(const s of[-1,1])box(ink,.5,.43,.025,x+s*.7,2.87,ds.front+.3)
 }
 logo('dsouza',ds.x+17,3.8,ds.front+.25,9,5.5)
 logo('dsouza',ds.x,9.4,ds.z,13,11,true)
 text('QUADROS DECORATIVOS DE FUTEBOL',ds.x,7.1,ds.front+.24,43,.75,'#102d19')
 text('Mercado Livre  ·  TikTok Shop  ·  Shopee',ds.x-2,6.1,ds.front+.24,27,.65,'#102d19')
 for(let i=0;i<7;i++){const x=ds.x+6+(i%3)*1.3,z=ds.front+4+Math.floor(i/3)*1.2;box(wood,1.05,.6,1,x,.46,z);box(cream,.08,.61,1.03,x,.46,z)}
 // The delivery vehicle now belongs to the animated sponsor routine.
 for(const[id,h,color]of[['tidex',32,navy],['oittolabs',25,cream]] as const){
  const p=building(id,h,LOTS[id].buildingWidth,20,color)
  box(black,p.buildingWidth+.7,.6,20.7,p.x,h+.4,p.z)
  box(id==='tidex'?teal:navy,p.buildingWidth+.8,.16,.5,p.x,h-.1,p.front+.3)
  box(black,7.4,.35,3.1,p.x,3.5,p.front+1.2)
  for(const x of[-2.05,2.05])box(id==='tidex'?teal:navy,.24,3.3,.35,p.x+x,1.8,p.front+.35)

  for(let level=0;level<Math.floor(h/3.5);level++){
   if(level===0){
    const span=(p.buildingWidth-2-3.2)/2
    for(const s of[-1,1])box(glass,span,1.6,.05,p.x+s*(1.6+span/2),2.2,p.front+.19)
   }else box(glass,p.buildingWidth-2,1.6,.05,p.x,2.2+level*3.5,p.front+.19)
   for(const sign of[-1,1])box(glass,.05,1.6,16,p.x+sign*(p.buildingWidth/2+.18),2.2+level*3.5,p.z)
  }
  for(const s of[-1,1])box(id==='tidex'?teal:navy,.25,h,.25,p.x+s*(p.buildingWidth/2-.8),h/2,p.front+.25)
  for(const s of[-1,1])box(metal,.18,3,.18,p.x+s*6,h+1,p.front-.4)
  logo(id,p.x,h+1.75,p.front+.4,20,3.3)
  logo(id,p.x,floor+h+.86,p.z,18,6,true)
  text(id==='tidex'?'SUA MARCA DENTRO DAS IAs':'CONTABILIDADE  ·  BPO FINANCEIRO',p.x,4.7,p.front+.3,21,1.1,id==='tidex'?'#0b1220':'#f4ecd6',id==='tidex'?'#73d3ce':'#142c43')
 }
 // A shared avenue treatment makes the partners identifiable from the street.
 for(const id of ['dsouza','tidex','oittolabs'] as const){
  const lot=LOTS[id],x=lot.x-lot.width/2+2.5,z=lot.z+lot.depth/2-4
  box(metal,.35,6.5,.35,x,3.4,z);box(cream,5.6,2.9,.3,x,6.0,z)
  logo(id,x,6,z+.18,5.1,2.5)
 }
 const p=LOTS.gecg,L=55,W=35,y=.19
 box(concrete,p.width,.16,p.depth,p.x,.08,p.z)
 const grassData=new Uint8Array(32*32*4);let grainSeed=31
 for(let i=0;i<32*32;i++){grainSeed=(Math.imul(grainSeed,1664525)+1013904223)>>>0;const n=(grainSeed>>>24)%9;grassData.set([65+n,125+n,43+n,255],i*4)}
 const grass=new T.DataTexture(grassData,32,32);grass.colorSpace=T.SRGBColorSpace;grass.wrapS=grass.wrapT=T.RepeatWrapping;grass.repeat.set(14,8);grass.generateMipmaps=true;grass.minFilter=T.LinearMipmapLinearFilter;grass.needsUpdate=true;textures.add(grass)
 const turf=new T.MeshStandardMaterial({map:grass,roughness:1});materials.add(turf);plane(turf,L,W,p.x,.18,p.z,true)
 const line=(x1:number,z1:number,x2:number,z2:number)=>{const g=new T.PlaneGeometry(Math.hypot(x2-x1,z2-z1),.15);g.rotateX(-Math.PI/2);g.rotateY(-Math.atan2(z2-z1,x2-x1));g.translate((x1+x2)/2,y,(z1+z2)/2);add(g,white)}
 const rect=(x:number,z:number,w:number,d:number)=>{line(x-w/2,z-d/2,x+w/2,z-d/2);line(x+w/2,z-d/2,x+w/2,z+d/2);line(x+w/2,z+d/2,x-w/2,z+d/2);line(x-w/2,z+d/2,x-w/2,z-d/2)}
 rect(p.x,p.z,L,W);line(p.x,p.z-W/2,p.x,p.z+W/2)
 for(let i=0;i<40;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20;line(p.x+Math.cos(a)*5,p.z+Math.sin(a)*5,p.x+Math.cos(b)*5,p.z+Math.sin(b)*5)}
 const wire:number[]=[],seg=(a:number[],b:number[])=>wire.push(...a,...b)
 for(const s of[-1,1]){
  const x=p.x+s*L/2;rect(x-s*3,p.z,6,12)
  for(const z of[-2.5,2.5])box(white,.1,2.1,.1,x,1.23,p.z+z)
  box(white,.1,.1,5.1,x,2.23,p.z)
  for(let z=-2.5;z<=2.501;z+=.5)seg([x+s*1.5,.2,p.z+z],[x+s*1.5,2.2,p.z+z])
  for(let h=.2;h<=2.201;h+=.4)seg([x+s*1.5,h,p.z-2.5],[x+s*1.5,h,p.z+2.5])
 }
 // A light wire fence, with an actual gate on its south-west side.
 const fence=(x1:number,z1:number,x2:number,z2:number)=>{const length=Math.hypot(x2-x1,z2-z1),n=Math.ceil(length/2.5);for(let i=0;i<=n;i++){const u=i/n,x=x1+(x2-x1)*u,z=z1+(z2-z1)*u;seg([x,.2,z],[x,4.2,z]);if(i%2===0)box(metal,.08,4.1,.08,x,2.2,z)}for(const h of[.2,1.2,2.2,3.2,4.2])seg([x1,h,z1],[x2,h,z2])}
 const fx=L/2+2,fz=W/2+2
 fence(p.x-fx,p.z-fz,p.x+fx,p.z-fz);fence(p.x-fx,p.z-fz,p.x-fx,p.z+fz);fence(p.x+fx,p.z-fz,p.x+fx,p.z+fz)
 fence(p.x-fx,p.z+fz,p.x-15,p.z+fz);fence(p.x-11,p.z+fz,p.x+fx,p.z+fz)
 const wireGeometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(wire,3)),wireMaterial=new T.LineBasicMaterial({color:'#315044',transparent:true,opacity:.75});geometry.add(wireGeometry);materials.add(wireMaterial);root.add(new T.LineSegments(wireGeometry,wireMaterial))
 box(navy,12,3.6,5,p.x,1.96,p.z+26);box(cream,12.7,.2,5.7,p.x,3.89,p.z+26)
  solid('gecg-recepcao',p.x,p.z+26,12,5,floor,3.8)
  solid('gecg-fence-back',p.x,p.z-fz,fx*2,.15,floor,4.2)
  for(const s of[-1,1])solid('gecg-fence-side-'+s,p.x+s*fx,p.z,.15,fz*2,floor,4.2)
  solid('gecg-fence-front-left',p.x-fx+(fx-15)/2,p.z+fz,fx-15,.15,floor,4.2)
  solid('gecg-fence-front-right',p.x-11+(fx+11)/2,p.z+fz,fx+11,.15,floor,4.2)
 logo('gecg',p.x,2.1,p.z+28.6,2.1,2.7)
 text('GRÊMIO ESPORTIVO CAMPO GRANDE',p.x,4.5,p.z+28.7,30,1.8,'#11225a')
 text('FUTEBOL SOCIETY  ·  ALUGUEL DE CAMPO',p.x,5.8,p.z+28.7,30,1.05,'#11225a')
  for(const s of[-1,1])box(metal,.13,6.4,.13,p.x+s*15,.16+3.2,p.z+28.5)
  box(navy,30,3,.13,p.x,4.9,p.z+28.55)
 logo('gecg',p.x,4.08,p.z+26,3.7,4.4,true)
 // Aerial sponsorship belongs on the open forecourt, clear of the pitch.
 // Reuse the official crest and spell out the whole name in the game font.
 logo('gecg',p.x+24,.26,p.z+28,11,13,true)
 text('GRÊMIO ESPORTIVO CAMPO GRANDE',p.x-5,.225,p.z+36,58,5,'#11225a','#fff9e9',true)
 const roadEdge=ACESSO_GECG_CIDADE.points[1].x+ACESSO_GECG_CIDADE.width/2+ACESSO_GECG_CIDADE.walk,gateX=p.x-13,walkZ=p.z+40
 box(cream,gateX-roadEdge,.04,2.8,(gateX+roadEdge)/2,.18,walkZ)
 box(cream,2.8,.04,20.5,gateX,.18,p.z+29.75)
  const lamp=mat('#fff4cf');lamp.userData.complexoNightEmission={color:'#fff4cf',intensity:1.7,dayIntensity:0}
  const lights=[]
  for(const sx of[-1,1])for(const sz of[-1,1]){const x=p.x+sx*31,z=p.z+sz*22;box(metal,.15,7.2,.15,x,3.76,z);box(lamp,1.1,.35,.22,x,7.38,z);lights.push({id:'gecg-light-'+sx+'-'+sz,kind:'street',position:[x,7.3,z],target:[p.x,.2,p.z],color:'#fff4cf',intensity:1500,distance:52,angle:1.1})}
  root.userData.complexoLights=lights
 for(const s of[-1,1]){box(navy,5,.15,.6,p.x+s*15,.72,p.z+23);for(const dx of[-1.8,1.8])box(metal,.12,.6,.5,p.x+s*15+dx,.42,p.z+23)}
 // Shared, fixed materials and static merged geometry; no per-frame updates.
 for(const[m,list]of batches){const g=mergeGeometries(list,false)!;list.forEach(v=>v.dispose());g.computeBoundingSphere();geometry.add(g);const mesh=new T.Mesh(g,m);mesh.castShadow=m instanceof T.MeshStandardMaterial;mesh.receiveShadow=true;root.add(mesh)}
 const metadata={brands:Object.values(LOTS).map(p=>({id:p.id,label:p.label,x:p.x,z:p.z,height:p.height,footprint:p.footprint,officialLogo:LOGOS_PATROCINADORES_CIDADE[p.id].src})),field:{length:L,width:W,goalWidth:5,goalHeight:2,owner:'gecg',rental:true,independentOfOfficialMatch:true},illustrativeArchitecture:true,illustrativeFootballPrints:true,static:true,meshes:root.children.length,triangles:root.children.reduce((n,o)=>n+(o instanceof T.Mesh?(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3:0),0),textureCount:textures.size}
 root.userData.sponsors=metadata
 let disposed=false
 return{root,solids,doors,metadata,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.clear()}}
}
