// 🏐 CLUBE DE LAZER DO BAIRRO (17/11, Diego: "um clubezinho com dois campinhos de futevôlei e churrasqueira… um clube de dia…
// não é clube de futebol… pode ser distante do estádio… com dois campos de futebol, um do lado do outro"). Ocupa DOIS quarteirões
// numa ponta do bairro: um com as 2 quadras de areia + a churrasqueira coberta, o outro com os 2 campos society.
// Só cenário (não cobra, não paga, não grava nada no save). Caixas mescladas por material e uma placa em canvas — zero download.
import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'

export type ClubeLazer={id:'clube-lazer';name:string;root:THREE.Group;centro:{x:number;z:number};solidos:{id:string;minX:number;maxX:number;minZ:number;maxZ:number;top:number}[];dispose:()=>void}

/** `areia` = o quarteirão das quadras de futevôlei + churrasqueira · `society` = o quarteirão dos 2 campos */
export function criarClubeLazer(parent:THREE.Object3D,spec:{areia:{x:number;z:number};society:{x:number;z:number};name?:string}):ClubeLazer{
 const name=spec.name??'Clube Recreio'
 const root=new THREE.Group();root.name='clube-lazer';parent.add(root)
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>()
 const mats=new Map<string,THREE.MeshStandardMaterial>()
 const mat=(color:string,extra:Partial<THREE.MeshStandardMaterialParameters>={})=>{const k=color+JSON.stringify(extra);let m=mats.get(k);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.9,...extra});mats.set(k,m);ms.add(m)}return m}
 const sand=mat('#e7cf93'),line=mat('#fbf7ea'),post=mat('#d8d8d0',{metalness:.3,roughness:.5}),net=mat('#f5f5f0',{transparent:true,opacity:.55}),
  grass=mat('#3f8f3a'),grassB=mat('#4a9b42'),wood=mat('#7a4a26'),roof=mat('#b5452c'),brick=mat('#9c4a32'),coal=mat('#2a2a2a'),table=mat('#c99a5b'),
  fence=mat('#2f5d3a',{transparent:true,opacity:.32}),wall=mat('#efe6cf'),goal=mat('#ffffff')
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);gs.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=h>.2;o.receiveShadow=true;root.add(o);return o}
 const solidos:ClubeLazer['solidos']=[]
 // ── quarteirão 1: 2 quadras de futevôlei lado a lado + churrasqueira coberta ─────────────────────────────────────────
 {const {x:cx,z:cz}=spec.areia,y=.17
  for(const dx of [-5.4,5.4]){
   const x=cx+dx,z=cz-3.2,W=9.6,D=5.2
   box(W+1.6,.08,D+1.6,x,y+.04,z,sand)
   // linhas
   box(W,.02,.08,x,y+.09,z-D/2,line);box(W,.02,.08,x,y+.09,z+D/2,line);box(.08,.02,D,x-W/2,y+.09,z,line);box(.08,.02,D,x+W/2,y+.09,z,line)
   // rede no meio (atravessa a quadra no sentido do comprimento curto)
   for(const s of [-1,1])box(.1,2.4,.1,x,y+1.2,z+s*(D/2+.35),post)
   box(.04,.9,D+.6,x,y+1.95,z,net);box(.06,.06,D+.7,x,y+2.4,z,line)
  }
  // churrasqueira coberta (quiosque): 4 pilares, telhado, a churrasqueira de tijolo com chaminé, mesa comprida e bancos
  const kz=cz+6.6
  for(const [px,pz] of [[-4.2,-2],[4.2,-2],[-4.2,2],[4.2,2]])box(.25,2.6,.25,cx+px,y+1.3,kz+pz,wood)
  box(9.4,.22,5,cx,y+2.7,kz,roof)
  box(2,1,1,cx-2.9,y+.5,kz-1.4,brick);box(1.8,.08,.8,cx-2.9,y+1.04,kz-1.4,coal);box(.5,1.6,.5,cx-3.6,y+1.8,kz-1.4,brick)
  box(4.4,.08,1.1,cx+1,y+.82,kz+.4,table);for(const s of [-1,1])box(4.4,.08,.35,cx+1,y+.48,kz+.4+s*.9,table)
  for(const lx of [-1,3])for(const s of [-1,1])box(.08,.78,.08,cx+lx,y+.39,kz+.4+s*.45,wood)
  solidos.push({id:'clube-lazer-churrasqueira',minX:cx-3.9,maxX:cx-1.9,minZ:kz-1.9,maxZ:kz-.9,top:2.6})
  // muro baixo + portão com a placa do clube
  box(23,.7,.18,cx,y+.35,cz-11.4,wall);for(const s of [-1,1])box(.18,.7,23,cx+s*11.4,y+.35,cz,wall)
  for(const s of [-1,1])box(9.6,.7,.18,cx+s*6.7,y+.35,cz+11.4,wall)
  for(const s of [-1,1])box(.35,3,.35,cx+s*1.9,y+1.5,cz+11.4,wall)
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=200;const ctx=canvas.getContext('2d')!
   ctx.fillStyle='#1b7a3d';ctx.fillRect(0,0,1024,200);ctx.strokeStyle='#ffc400';ctx.lineWidth=12;ctx.strokeRect(10,10,1004,180)
   ctx.fillStyle='#fff6d8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 110px Oswald, sans-serif';ctx.fillText(name.toUpperCase(),512,104,980)
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;ts.add(texture)
   const m=new THREE.MeshStandardMaterial({map:texture,roughness:.85});ms.add(m);const g=new THREE.PlaneGeometry(4.6,.9);gs.add(g)
   const sign=new THREE.Mesh(g,m);sign.position.set(cx,y+3.2,cz+11.52);root.add(sign);box(4.8,1.05,.12,cx,y+3.2,cz+11.42,wall)
  }}
 // ── quarteirão 2: 2 campos society lado a lado, com alambrado ───────────────────────────────────────────────────────
 {const {x:cx,z:cz}=spec.society,y=.17
  for(const dx of [-5.6,5.6]){
   const x=cx+dx,W=10,D=19
   box(W,.06,D,x,y+.03,cz,dx<0?grass:grassB)
   box(W-.6,.02,.08,x,y+.07,cz-D/2+.3,line);box(W-.6,.02,.08,x,y+.07,cz+D/2-.3,line);box(W-.6,.02,.08,x,y+.07,cz,line)
   box(.08,.02,D-.6,x-W/2+.3,y+.07,cz,line);box(.08,.02,D-.6,x+W/2-.3,y+.07,cz,line)
   for(const s of [-1,1]){const gz=cz+s*(D/2-.3);box(.1,1.2,.1,x-1.5,y+.6,gz,goal);box(.1,1.2,.1,x+1.5,y+.6,gz,goal);box(3.1,.1,.1,x,y+1.2,gz,goal)}
  }
  // alambrado verde em volta (postes + faixa baixa; a tela é só sugerida pra não pesar)
  for(const s of [-1,1]){box(22.6,2.2,.06,cx,y+1.1,cz+s*9.9,fence);box(.06,2.2,19.8,cx+s*11.3,y+1.1,cz,fence)}
  box(.06,2.2,19.8,cx,y+1.1,cz,fence)}
 // junta as caixas por material (mesmo truque do boteco) — a placa fica separada
 const groups=new Map<THREE.Material,THREE.BufferGeometry[]>()
 for(const child of [...root.children]){if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.map)continue;child.updateMatrix();const list=groups.get(child.material)??[];list.push(child.geometry.clone().applyMatrix4(child.matrix));groups.set(child.material,list);child.removeFromParent()}
 for(const [m,parts] of groups){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)throw Error('Invalid clube-lazer geometry batch');gs.add(g);const o=new THREE.Mesh(g,m);o.castShadow=m!==net&&m!==line&&m!==fence;o.receiveShadow=true;root.add(o)}
 return{id:'clube-lazer',name,root,centro:{...spec.areia},solidos,dispose(){root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}}
}
