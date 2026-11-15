import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {LOTE_AGENCIA_CLUBE as A} from './clube-mapa-destinos'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'
import {getLang} from './lang'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** 🏢 05/11 (Diego: *"a agência tá muito feia"*): escritório de empresário de futebol — fachada de vidro com caixilho
 * preto, faixa dourada, marquise com toldo na entrada, letreiro AGÊNCIA + logo no topo e dois carros executivos no
 * pátio. Leve pro celular: as peças fixas viram 1 malha por material (6 desenhos) e os carros vêm da biblioteca
 * de veículos que o mapa já usa (geometria em cache). Só endereço visual: nada de compra, save ou dinheiro. */
export function criarAgenciaClube(parent:T.Object3D,clubName:string,crest?:string,onReady?:()=>void){
 const root=new T.Group();root.name='agencia-clube';parent.add(root)
 const en=getLang()==='en'
 const W=A.width,D=A.depth,H=A.height,G1=4.0,FLOOR=3.2,front=D/2
 const materials:T.Material[]=[],textures:T.Texture[]=[],geometries:T.BufferGeometry[]=[]
 const mat=(color:string,roughness=.85,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m}
 const cream=mat('#f4ecd6',.9),ink=mat('#1d2328',.7,.15),gold=mat('#ffc400',.55,.2),leaf=mat('#3f6a34',.95),paving=mat('#cfc8b6',.95)
 const glass=mat('#7fb0c4',.16,.3);glass.userData.complexoNightEmission={color:'#f2d79c',intensity:.45,dayIntensity:.02}
 const dark=mat('#203640',.22,.4);dark.userData.complexoNightEmission={color:'#ffe2a8',intensity:.8,dayIntensity:.05}
 const parts=new Map<T.Material,T.BufferGeometry[]>()
 const put=(m:T.Material,g:T.BufferGeometry,x:number,y:number,z:number)=>{g.translate(x,y,z);const list=parts.get(m)??[];list.push(g);parts.set(m,list)}
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>put(m,new T.BoxGeometry(w,h,d),x,y,z)

 // corpo: base de pedra, volume creme e laje
 box(ink,W+.7,.36,D+.7,0,.18,0)
 box(cream,W,H,D-.5,0,H/2+.2,-.25)
 box(ink,W+.36,.3,D+.36,0,H+.35,0)
 // fachada (olha pra +z local): pano de vidro nos andares de cima, vitrine embaixo, pilares pretos nas quinas
 box(glass,W-1.4,H-G1-.55,.12,0,G1+(H-G1-.55)/2+.2,front-.12)
 for(let i=0;i<=8;i++){const x=-(W-1.4)/2+i*(W-1.4)/8;box(ink,.12,H-G1-.5,.2,x,G1+(H-G1-.5)/2+.2,front-.02)}
 for(const s of[-1,1])box(ink,.85,H+.35,.9,s*(W/2-.42),(H+.35)/2+.2,front-.42)
 box(gold,W-1.4,.42,.32,0,G1+.2,front+.02)
 box(cream,W-1.4,.24,.26,0,G1+FLOOR+.2,front)
 // térreo: vitrine dos dois lados da porta + porta dupla de vidro escuro com batente
 for(const s of[-1,1]){box(glass,3.1,G1-.75,.1,s*3.75,(G1-.75)/2+.38,front-.3);box(ink,.14,G1-.6,.2,s*2.15,(G1-.6)/2+.36,front-.26)}
 box(dark,2.9,2.75,.08,0,1.75,front-.3);box(ink,3.3,.22,.24,0,3.22,front-.26);box(ink,.08,2.75,.12,0,1.75,front-.24)
 // toldo listrado (preto e dourado) inclinado sobre a entrada, com bambinela dourada e dois pilaretes
 for(let i=0;i<8;i++){const g=new T.BoxGeometry(.8,.1,2.9);g.rotateX(.3);put(i%2?gold:ink,g,-2.8+i*.8,3.62,front+1.4)}
 box(gold,6.5,.36,.07,0,2.99,front+2.8)
 for(const s of[-1,1])put(ink,new T.CylinderGeometry(.07,.07,3,8),s*3.05,1.68,front+2.62)
 // lados: faixas de janela por andar; floreiras na entrada
 for(const s of[-1,1])for(const y of[2.2,G1+1.75,G1+FLOOR+1.75])box(glass,.08,1.45,D-2.6,s*(W/2+.04),y,-.4)
 for(const s of[-1,1]){box(ink,1.3,.6,1.3,s*4.6,.66,front+1.1);const bush=new T.SphereGeometry(.62,8,6);bush.scale(1,.7,1);put(leaf,bush,s*4.6,1.25,front+1.1)}
 // pátio da frente até a calçada: piso, faixas das duas vagas e o corredor da porta
 const yard=A.heading===0?Math.max(...A.footprint.map(p=>p.z))-A.building.maxZ:A.building.minZ-Math.min(...A.footprint.map(p=>p.z))
 box(paving,W+2.7,.06,yard,-.15,.19,front+yard/2)
 for(const x of[-5.8,-1.9,1.9,5.8])box(cream,.1,.02,4.6,x,.23,front+3.3)

 for(const [m,list] of parts){
  const g=mergeGeometries(list)!;list.forEach(p=>p.dispose());geometries.push(g)
  const o=new T.Mesh(g,m);o.name='agencia-'+(m===glass?'vidro':m===ink?'estrutura':m===gold?'faixa':m===cream?'corpo':m===leaf?'floreira':m===dark?'porta':'patio')
  o.castShadow=m!==paving;o.receiveShadow=true;root.add(o)
 }

 // letreiro e logo (textura de canvas, uma por placa)
 const canvasTexture=(w:number,h:number,draw:(g:CanvasRenderingContext2D,cw:number,ch:number)=>void)=>{
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([29,35,40,255]),1,1)
  else{const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);draw(c.getContext('2d')!,c.width,c.height);map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;textures.push(map);return map
 }
 const logo=(g:CanvasRenderingContext2D,cx:number,cy:number,r:number)=>{
  g.fillStyle='#ffc400';g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill()
  g.strokeStyle='#0c0c0c';g.lineWidth=r*.12;g.beginPath();g.arc(cx,cy,r*.8,0,Math.PI*2);g.stroke()
  // estrela de 5 pontas: a "estrela" que a agência cuida
  g.fillStyle='#0c0c0c';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.27:r*.6;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}g.closePath();g.fill()
 }
 const word=en?'AGENCY':'AGÊNCIA',sub=en?'PLAYER AGENTS · SPONSORSHIPS':'EMPRESÁRIOS · PATROCÍNIOS'
 const plane=(map:T.Texture,w:number,h:number)=>{const m=new T.MeshBasicMaterial({map,toneMapped:false});materials.push(m);const g=new T.PlaneGeometry(w,h);geometries.push(g);const o=new T.Mesh(g,m);root.add(o);return o}
 // letreiro grande no alto da fachada
 const signBack=new T.Mesh(new T.BoxGeometry(W-1.3,2.9,.3),ink);geometries.push(signBack.geometry);signBack.position.set(0,H+1.85,front-.7);signBack.castShadow=true;root.add(signBack)
 const top=plane(canvasTexture(W-1.6,2.6,(g,cw,ch)=>{
  g.fillStyle='#1d2328';g.fillRect(0,0,cw,ch);g.fillStyle='#ffc400';g.fillRect(0,ch-10,cw,10)
  logo(g,ch*.52,ch*.48,ch*.42)
  g.textBaseline='middle';g.textAlign='center';g.fillStyle='#ffc400';g.font=`700 ${Math.round(ch*.62)}px Oswald,Arial,sans-serif`;g.fillText(word,(cw+ch)/2,ch*.36,cw-ch*1.2)
  g.fillStyle='#f4ecd6';g.font=`700 ${Math.round(ch*.30)}px Oswald,Arial,sans-serif`;g.fillText(clubName.toUpperCase(),(cw+ch)/2,ch*.82,cw-ch*1.25)
 }),W-1.6,2.6)
 top.position.set(0,H+1.85,front-.54)
 // faixa da marquise
 const strip=plane(canvasTexture(6.2,.3,(g,cw,ch)=>{g.fillStyle='#ffc400';g.fillRect(0,0,cw,ch);g.fillStyle='#0c0c0c';g.textAlign='center';g.textBaseline='middle';g.font=`900 ${Math.round(ch*.78)}px Oswald,Arial Narrow,Arial,sans-serif`;g.fillText(sub,cw/2,ch*.54,cw-20)}),6.2,.3)
 strip.position.set(0,2.99,front+2.84)

 root.position.set(A.x,0,A.z);root.rotation.y=A.heading
 // telhado: o logo grande, pra achar a agência na vista de cima
 const roofMap=canvasTexture(W-1,D-1.4,(g,cw,ch)=>{
  g.fillStyle='#f4ecd6';g.fillRect(0,0,cw,ch);g.strokeStyle='#0c0c0c';g.lineWidth=14;g.strokeRect(7,7,cw-14,ch-14)
  // só o logo (lê de qualquer lado): o nome fica no letreiro da fachada, que nunca aparece de cabeça pra baixo
  logo(g,cw/2,ch*.34,Math.min(cw,ch)*.23);g.fillStyle='#0c0c0c';g.textAlign='center';g.textBaseline='middle';g.font=`700 ${Math.round(ch*.16)}px Oswald,Arial,sans-serif`;g.fillText(word,cw/2,ch*.76,cw*.86)
 })
 const roofMat=new T.MeshBasicMaterial({map:roofMap,toneMapped:false});materials.push(roofMat)
 const roofGeo=new T.PlaneGeometry(W-1,D-1.4);geometries.push(roofGeo)
 const roof=new T.Mesh(roofGeo,roofMat);roof.rotation.x=-Math.PI/2;roof.position.set(A.x,H+.52,A.z);roof.name='agencia-telhado';parent.add(roof)

 // The only badge used here comes from the caller's existing owned identity.
 let disposed=false
 if(crest){
  const map=new T.TextureLoader().load(crest,tex=>{if(disposed){tex.dispose();return}tex.colorSpace=T.SRGBColorSpace;onReady?.()},undefined,()=>{})
  textures.push(map);const material=new T.MeshBasicMaterial({map,transparent:true,toneMapped:false,depthWrite:false});materials.push(material)
  const geo=new T.PlaneGeometry(4.2,4.2);geometries.push(geo);const badge=new T.Mesh(geo,material);badge.position.set(0,H-2,front+.22);root.add(badge)
 }
 // carros executivos no pátio, de bico pra fachada
 const library=criarBibliotecaVeiculos(),cars:{root:T.Object3D}[]=[],solids:SolidoEntorno[]=[]
 ;(['escalade','civic'] as const).forEach((id,i)=>{
  const v=library.create(id);if(!v)return
  const x=A.door.x+(i?4:-4),z=A.door.z+.7+v.profile.length/2
  v.root.position.set(x,.2,z);v.root.rotation.y=Math.PI;v.root.name='agencia-carro-'+id;parent.add(v.root);cars.push(v)
  const hw=v.profile.width/2+.05,hl=v.profile.length/2+.05
  solids.push({id:'agencia-clube-carro-'+i,minX:x-hw,maxX:x+hw,minZ:z-hl,maxZ:z+hl,base:.2,top:.2+v.profile.height,footprint:[{x:x-hw,z:z-hl},{x:x+hw,z:z-hl},{x:x+hw,z:z+hl},{x:x-hw,z:z+hl}]})
 })
 const b=A.building
 solids.unshift({id:A.id,minX:b.minX,maxX:b.maxX,minZ:b.minZ,maxZ:b.maxZ,base:.2,top:H+.5,footprint:[{x:b.minX,z:b.minZ},{x:b.maxX,z:b.minZ},{x:b.maxX,z:b.maxZ},{x:b.minX,z:b.maxZ}]})
 return{root,solids,dispose(){if(disposed)return;disposed=true;root.removeFromParent();roof.removeFromParent();cars.forEach(c=>c.root.removeFromParent());library.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.clear()}}
}
