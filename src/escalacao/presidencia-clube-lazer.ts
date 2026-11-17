// 🏐🏊 CLUBE DE LAZER DO BAIRRO (17/11). 1ª versão (futevôlei + churrasqueira coberta + 2 campos society) o Diego não gostou:
// *"quero clube com piscina… churrasqueira em gazebo… e dois campos de futevôlei lado a lado"*. Então, em DOIS quarteirões
// vizinhos numa ponta do bairro (longe do estádio): um com as 2 quadras de areia lado a lado; o outro com a PISCINA (deck,
// espreguiçadeiras e guarda-sóis) e o GAZEBO de telhado de 8 águas com a churrasqueira, mesa e bancos dentro. Muro baixo e
// portão com a placa do clube. Só cenário (não cobra, não paga, não grava nada no save) — caixas mescladas, placa em canvas.
import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'

export type ClubeLazer={id:'clube-lazer';name:string;root:THREE.Group;centro:{x:number;z:number};solidos:{id:string;minX:number;maxX:number;minZ:number;maxZ:number;top:number}[];dispose:()=>void}

/** `quadras` = o quarteirão das 2 quadras de futevôlei · `lazer` = o quarteirão da piscina + gazebo (com o portão) */
export function criarClubeLazer(parent:THREE.Object3D,spec:{quadras:{x:number;z:number};lazer:{x:number;z:number};name?:string}):ClubeLazer{
 const name=spec.name??'Clube Recreio'
 const root=new THREE.Group();root.name='clube-lazer';parent.add(root)
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>()
 const mats=new Map<string,THREE.MeshStandardMaterial>()
 const mat=(color:string,extra:Partial<THREE.MeshStandardMaterialParameters>={})=>{const k=color+JSON.stringify(extra);let m=mats.get(k);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.9,...extra});mats.set(k,m);ms.add(m)}return m}
 const sand=mat('#e7cf93'),line=mat('#fbf7ea'),post=mat('#d8d8d0',{metalness:.3,roughness:.5}),net=mat('#f5f5f0',{transparent:true,opacity:.55}),
  grass=mat('#4f9a45'),deck=mat('#b98a55'),tile=mat('#f2f4f4'),water=mat('#2fa9d8',{roughness:.15,metalness:.1,emissive:'#0c4f6e',emissiveIntensity:.35}),
  waterDeep=mat('#1d86b8',{roughness:.15,emissive:'#083e57',emissiveIntensity:.3}),wood=mat('#7a4a26'),roofM=mat('#2f6b3f'),brick=mat('#9c4a32'),
  coal=mat('#2a2a2a'),table=mat('#c99a5b'),wall=mat('#efe6cf'),lounger=mat('#ffffff'),umbA=mat('#e8503a'),umbB=mat('#ffc400')
 const add=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,ry=0)=>{gs.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const o=add(new THREE.BoxGeometry(w,h,d),m,x,y,z);o.castShadow=h>.2;return o}
 const solidos:ClubeLazer['solidos']=[]
 const y=.17
 const Q=spec.quadras,L=spec.lazer
 // 🔁 3ª versão (Diego: "o clube é tudo junto… tipo um clube cercado fechado"): os 2 quarteirões viram UM terreno — a rua do meio
 // é cortada (presidencia-complexo-entorno.ts) e um muro só cerca tudo; o portão com a placa fica no meio do lado da frente (+z)
 const minX=Math.min(Q.x,L.x)-11.5,maxX=Math.max(Q.x,L.x)+11.5,minZ=Math.min(Q.z,L.z)-11.5,maxZ=Math.max(Q.z,L.z)+11.5
 const CX=(minX+maxX)/2,CZ=(minZ+maxZ)/2,W=maxX-minX,D=maxZ-minZ
 box(W,.06,D,CX,y+.03,CZ,grass)
 box(W,.9,.2,CX,y+.45,minZ,wall);box(.2,.9,D,minX,y+.45,CZ,wall);box(.2,.9,D,maxX,y+.45,CZ,wall)
 for(const s of [-1,1]){const len=W/2-2.1;box(len,.9,.2,CX+s*(2.1+len/2),y+.45,maxZ,wall)}
 // ── quarteirão das quadras: 2 quadras de futevôlei LADO A LADO, com grama em volta ──────────────────────────────────
 for(const dz of [-5.4,5.4]){
  const x=Q.x,z=Q.z+dz,W=16,D=8
  box(W+1.4,.08,D+1.4,x,y+.07,z,sand)
  box(W,.02,.08,x,y+.12,z-D/2,line);box(W,.02,.08,x,y+.12,z+D/2,line);box(.08,.02,D,x-W/2,y+.12,z,line);box(.08,.02,D,x+W/2,y+.12,z,line)
  for(const s of [-1,1])box(.1,2.5,.1,x,y+1.25,z+s*(D/2+.4),post)
  box(.04,.9,D+.8,x,y+2,z,net);box(.06,.06,D+.9,x,y+2.45,z,line)
 }
 // ── quarteirão do lazer: piscina com deck + gazebo com churrasqueira ─────────────────────────────────────────────────
 {const px=L.x-3,pz=L.z-2.5
  box(13.4,.12,8.4,px,y+.06,pz,deck)                   // deck de madeira
  box(10.4,.14,5.4,px,y+.1,pz,tile)                    // borda de azulejo
  box(9.8,.05,4.8,px,y+.17,pz,water)                   // água
  box(4,.05,4.8,px+2.9,y+.165,pz,waterDeep)            // a parte funda, um azul mais escuro
  for(const s of [-1,1])box(.06,.9,.06,px-4.6,y+.55,pz+s*.4,post) // escadinha
  // espreguiçadeiras + guarda-sóis no deck
  for(const [i,lx] of [-4.2,-1.4,1.4].entries()){
   const lz=pz+4.7;box(.75,.18,1.9,px+lx,y+.3,lz,lounger);box(.75,.5,.12,px+lx,y+.55,lz-.9,lounger)
   if(i!==1){add(new THREE.CylinderGeometry(.04,.04,2.4,6),post,px+lx+.9,y+1.2,lz);add(new THREE.ConeGeometry(1.3,.6,8),i===0?umbA:umbB,px+lx+.9,y+2.5,lz)}
  }
 }
 {const gx=L.x+6,gz=L.z+5.2,R=3.4
  // gazebo: piso octogonal, 8 pilares, telhado de 8 águas com a pontinha em cima
  add(new THREE.CylinderGeometry(R+.3,R+.3,.16,8),deck,gx,y+.08,gz,Math.PI/8)
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(.18,2.5,.18,gx+Math.cos(a)*R,y+1.4,gz+Math.sin(a)*R,wood)}
  add(new THREE.ConeGeometry(R+1,1.8,8),roofM,gx,y+3.55,gz,Math.PI/8)
  add(new THREE.ConeGeometry(.22,.6,8),wood,gx,y+4.7,gz)
  // churrasqueira de tijolo com chaminé saindo pelo telhado, mesa e bancos
  box(1.8,1,.9,gx,y+.5,gz-2.1,brick);box(1.6,.08,.7,gx,y+1.04,gz-2.1,coal);box(.45,3.6,.45,gx-.55,y+2.4,gz-2.3,brick)
  box(2.6,.08,1,gx,y+.82,gz+.6,table);for(const s of [-1,1])box(2.6,.08,.32,gx,y+.48,gz+.6+s*.85,table)
  for(const lx of [-1.1,1.1])box(.08,.78,.08,gx+lx,y+.39,gz+.6,wood)
  solidos.push({id:'clube-lazer-gazebo',minX:gx-1,maxX:gx+1,minZ:gz-2.6,maxZ:gz-1.6,top:3})}
 // portão com a placa do clube, na frente do quarteirão do lazer
 for(const s of [-1,1])box(.35,3,.35,CX+s*1.9,y+1.5,maxZ,wall)
 box(4.8,1.05,.12,CX,y+3.2,maxZ+.02,wall)
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=200;const ctx=canvas.getContext('2d')!
  ctx.fillStyle='#1d86b8';ctx.fillRect(0,0,1024,200);ctx.strokeStyle='#ffc400';ctx.lineWidth=12;ctx.strokeRect(10,10,1004,180)
  ctx.fillStyle='#fff6d8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 110px Oswald, sans-serif';ctx.fillText(name.toUpperCase(),512,104,980)
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;ts.add(texture)
  const m=new THREE.MeshStandardMaterial({map:texture,roughness:.85});ms.add(m);const g=new THREE.PlaneGeometry(4.6,.9);gs.add(g)
  const sign=new THREE.Mesh(g,m);sign.position.set(CX,y+3.2,maxZ+.12);root.add(sign)
 }
 // junta as caixas por material (mesmo truque do boteco) — placa e peças rodadas (cone/cilindro) entram no lote também
 const groups=new Map<THREE.Material,THREE.BufferGeometry[]>()
 for(const child of [...root.children]){if(!(child instanceof THREE.Mesh)||Array.isArray(child.material)||child.material.map)continue;child.updateMatrix();const list=groups.get(child.material)??[];list.push(child.geometry.clone().applyMatrix4(child.matrix));groups.set(child.material,list);child.removeFromParent()}
 for(const [m,parts] of groups){const g=mergeGeometries(parts.map(p=>p.index?p.toNonIndexed():p),false);parts.forEach(p=>p.dispose());if(!g)throw Error('Invalid clube-lazer geometry batch');gs.add(g);const o=new THREE.Mesh(g,m);o.castShadow=m!==net&&m!==line&&m!==water&&m!==waterDeep;o.receiveShadow=true;root.add(o)}
 return{id:'clube-lazer',name,root,centro:{x:CX,z:CZ},solidos,dispose(){root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}}
}
