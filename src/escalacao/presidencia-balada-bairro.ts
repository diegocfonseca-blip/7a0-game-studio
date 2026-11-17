// 🪩 BALADA DO BAIRRO (17/11, Diego: "a balada não precisa ficar próximo do estádio"). É pra onde o baladeiro foge na
// NOITADA (o causo da temporada que já existe em eventos.ts) — a cena "Enquanto isso no bairro" da Central filma ela.
// Fica num quarteirão da PONTA do bairro, longe do estádio. Só cenário: não cobra, não paga, não grava nada no save.
// Mesmo jeito do boteco (`presidencia-boteco-bairro.ts`): caixas mescladas por material, placa em canvas, zero download.
import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {criarFigurantes} from './presidencia-figurantes'

export type BaladaBairro={id:'balada';name:string;root:THREE.Group;entrance:{x:number;y:number;z:number};/** 🌙 a fila na porta só existe de noite */periodo:(p:'day'|'night'|string,t:number)=>void;dispose:()=>void}

export function criarBaladaBairro(parent:THREE.Object3D,spec:{x:number;z:number;name?:string}):BaladaBairro{
 const name=spec.name??'Balada Legends'
 const root=new THREE.Group();root.name='balada-bairro';root.position.set(spec.x,.16,spec.z);parent.add(root)
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>()
 const mat=(color:string,extra:Partial<THREE.MeshStandardMaterialParameters>={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.85,...extra});ms.add(m);return m}
 const wall=mat('#3a2357',{emissive:'#1a0d2b',emissiveIntensity:.6}),trim=mat('#120a1c'),door=mat('#0b0b0b'),rope=mat('#b0182f'),gold=mat('#d9b44a',{metalness:.6,roughness:.35}),
  neonPink=mat('#ff4fc4',{emissive:'#ff2fb5',emissiveIntensity:1.6}),neonBlue=mat('#55d6ff',{emissive:'#2bc6ff',emissiveIntensity:1.4}),
  mirror=mat('#d9dde3',{metalness:.95,roughness:.12})
 // luz roxa na porta: o mapa liga à noite pelo mesmo caminho das luzes do boteco (`complexoLights`)
 root.userData.complexoLights=[{id:'balada-entrada',kind:'entrance',position:[0,3.4,5.6],target:[0,.4,9],color:'#d65cff',intensity:44,distance:14,angle:1.15}]
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);gs.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o}
 // galpão de 2 andares: parede roxa-escura, porta preta no meio, faixa de neon rosa em cima e azul na base
 box(10,5.2,.2,0,2.6,-4.9,wall);for(const x of [-5,5])box(.2,5.2,10,x,2.6,0,wall)
 for(const x of [-3.4,3.4])box(3.2,5.2,.2,x,2.6,4.9,wall)
 box(3.6,2.1,.2,0,4.15,4.9,wall);box(3.4,3.1,.12,0,1.55,4.95,door)
 box(10.4,.18,10.4,0,5.29,0,trim)
 box(10.1,.12,.08,0,4.6,5.05,neonPink);box(10.1,.1,.08,0,.25,5.05,neonBlue)
 for(const x of [-5.05,5.05])box(.08,4.8,.12,x,2.6,5.0,neonPink)
 // cordão vermelho com pedestais dourados na calçada (a fila da porta)
 for(const x of [-2.6,-1.1,1.1,2.6])box(.12,1,.12,x,.5,6.2,gold)
 for(const [a,b] of [[-2.6,-1.1],[1.1,2.6]])box(b-a,.07,.07,(a+b)/2,.88,6.2,rope)
 // globo espelhado em cima da porta
 const ballGeo=new THREE.IcosahedronGeometry(.55,1);gs.add(ballGeo);const ball=new THREE.Mesh(ballGeo,mirror);ball.position.set(0,6.1,3.9);root.add(ball)
 box(.05,.6,.05,0,5.6,3.9,trim)
 // placa com o nome, em canvas (sem baixar nada)
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=200;const ctx=canvas.getContext('2d')!
  ctx.fillStyle='#14091f';ctx.fillRect(0,0,1024,200);ctx.strokeStyle='#ff4fc4';ctx.lineWidth=10;ctx.strokeRect(10,10,1004,180)
  ctx.fillStyle='#ffd6f3';ctx.shadowColor='#ff2fb5';ctx.shadowBlur=26;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 104px Oswald, sans-serif'
  ctx.fillText(name.toUpperCase(),512,104,980)
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;ts.add(texture)
  const material=new THREE.MeshStandardMaterial({map:texture,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.9,roughness:.8});ms.add(material)
  const g=new THREE.PlaneGeometry(7.6,1.5);gs.add(g);const sign=new THREE.Mesh(g,material);sign.position.set(0,3.85,5.02);root.add(sign)
 }
 // 👥 17/11: de noite, fila na porta (do lado do cordão) + o segurança de preto
 const fila=criarFigurantes(root,10,'balada-fila')
 {const cores=['#ff4fc4','#ffffff','#1a1a1a','#55d6ff','#ffc400','#7c3aed','#e8503a','#c9c9c9']
  fila.set([{x:-.4,y:0,z:6.6,heading:0,camisa:'#0b0b0b'},...[3.4,4.3,5.2,6.1,7,7.9,8.8].map((x,i)=>({x,y:0,z:6.9+(i%2)*.35,heading:-Math.PI/2+(i%3-1)*.3,camisa:cores[i%cores.length]}))])
  fila.mostrar(false)}
 // junta as caixas por material (mesmo truque do boteco) — o globo e a placa ficam separados
 const groups=new Map<THREE.Material,THREE.BufferGeometry[]>()
 for(const child of [...root.children]){if(!(child instanceof THREE.Mesh)||child===ball||Array.isArray(child.material)||child.material.map)continue;child.updateMatrix();const list=groups.get(child.material)??[];list.push(child.geometry.clone().applyMatrix4(child.matrix));groups.set(child.material,list);child.removeFromParent()}
 for(const [m,parts] of groups){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)throw Error('Invalid balada geometry batch');gs.add(g);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;root.add(o)}
 return{id:'balada',name,root,entrance:{x:spec.x,y:.16,z:spec.z+4.9},periodo(p,t){fila.mostrar(p==='night');fila.tempo(t)},dispose(){fila.dispose();root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}}
}
