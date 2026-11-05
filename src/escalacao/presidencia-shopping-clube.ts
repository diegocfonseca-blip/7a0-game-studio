// 🛍️ SHOPPING DO CLUBE (05/11, mockup `scripts/mockups/shopping-clube.png`, Diego: "ok pode fazer").
// O prédio grande do lado OESTE da Vadico Veículos (colado nela, frente pro MESMO pátio, virada pro sul).
// Cada lojinha é uma PORTA pra Loja de sempre (a da home), já rolada na parte dela — nada de compra nova,
// nada muda no Pix. A Loja da home continua igual. Aqui mora só o desenho, o terreno e a lista das lojinhas;
// quem abre a Loja é o cartão do mapa (`presidencia-complexo-3d.tsx`).
import * as THREE from 'three'
import type {PontoComplexo} from './presidencia-complexo-model'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

const GROUND=.16
// Prédio: da beira do campo do Campo Grande (x −388) até a Vadico (x −311,5); fundo encostado na rua do norte (z −166).
const BX0=-382,BX1=-322,BZ0=-160,BZ1=-134,ALTURA=12.4
// Estacionamento na frente (sul), na mesma linha do pátio da Vadico; a faixa leste liga os dois pátios.
const PX0=BX0,PX1=BX1,PZ0=-131,PZ1=-111

export type LojinhaShopping={id:string;pt:string;en:string;ancora:string;cor:string;tinta:string;x0:number;x1:number;itensPt:string;itensEn:string}
/** As 6 lojinhas do mockup. `ancora` = id da seção na Loja (`loja-clube.tsx`). Ordem = da esquerda pra direita na fachada. */
export const LOJINHAS_SHOPPING:readonly LojinhaShopping[]=[
 {id:'loja',pt:'🛒 Loja do Clube',en:'🛒 Club Shop',ancora:'loja-planos',cor:'#FFC400',tinta:'#0C0C0C',x0:-381,x1:-359,itensPt:'Planos · salas extras · ficha de carreira · presente',itensEn:'Plans · extra rooms · career slot · gift'},
 {id:'alfaiataria',pt:'👔 Alfaiataria',en:'👔 Tailor',ancora:'loja-presidente',cor:'#FFFFFF',tinta:'#0C0C0C',x0:-358,x1:-350,itensPt:'Roupas, cabelos e barbas do presidente',itensEn:'Your president’s clothes, hair and beards'},
 {id:'cores',pt:'🎨 Tintas & Cores',en:'🎨 Paints & Colors',ancora:'loja-cores',cor:'#7C3AED',tinta:'#FFFFFF',x0:-349,x1:-341,itensPt:'A cor do seu nome',itensEn:'The color of your name'},
 {id:'banco',pt:'🏦 Banco Legends',en:'🏦 Banco Legends',ancora:'loja-moedas',cor:'#1B7A3D',tinta:'#FFFFFF',x0:-340,x1:-332,itensPt:'Moedas pro clube (carreira)',itensEn:'Coins for your club (career)'},
 {id:'torcida',pt:'🎉 Loja da Torcida',en:'🎉 Fan Shop',ancora:'loja-temas',cor:'#C2452F',tinta:'#FFFFFF',x0:-331,x1:-323,itensPt:'Tema da sala (online) · canto da torcida (carreira e online)',itensEn:'Room theme (online) · crowd chant (career and online)'},
 {id:'radio',pt:'📣 Rádio da Torcida',en:'📣 Fan Radio',ancora:'loja-recado',cor:'#0C0C0C',tinta:'#FFC400',x0:-358,x1:-323,itensPt:'Super Chat no telão · anúncio de marca',itensEn:'Super Chat on the big screen · brand ad'},
]

const ret=(x0:number,x1:number,z0:number,z1:number):PontoComplexo[]=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}]
export const PLANTA_SHOPPING={
 id:'shopping-clube',label:'Shopping do Clube',height:ALTURA,
 building:{minX:BX0,maxX:BX1,minZ:BZ0,maxZ:BZ1},
 parking:{minX:PX0,maxX:PX1,minZ:PZ0,maxZ:PZ1},
 /** prédio + calçada + estacionamento + a faixa que liga no pátio da Vadico: nada de árvore/casa/poste aqui dentro */
 reservationPolygons:[ret(BX0-2,BX1+2,BZ0-1,PZ1+14),ret(BX1,-311,-131,-118)],
} as const

/** placa pintada em canvas (fora do navegador, nos testes em node, volta null e o prédio fica sem letreiro) */
function placa(texto:string,fundo:string,tinta:string,w:number,h:number,tam:number){
 if(typeof document==='undefined')return null
 const c=document.createElement('canvas');c.width=w;c.height=h
 const g=c.getContext('2d');if(!g)return null
 g.fillStyle=fundo;g.fillRect(0,0,w,h)
 g.strokeStyle='#000';g.lineWidth=Math.max(6,h*.06);g.strokeRect(0,0,w,h)
 g.fillStyle=tinta;g.textAlign='center';g.textBaseline='middle'
 let s=tam;g.font=`800 ${s}px Oswald, "Arial Narrow", Arial, sans-serif`
 while(g.measureText(texto).width>w*.9&&s>10){s-=2;g.font=`800 ${s}px Oswald, "Arial Narrow", Arial, sans-serif`}
 g.fillText(texto,w/2,h/2+s*.04)
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4
 return t
}

export function criarShoppingClube(parent:THREE.Object3D){
 const root=new THREE.Group();root.name='complexo-shopping-clube';parent.add(root)
 const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[]
 const solids:SolidoEntorno[]=[]
 const mat=(name:string,color:string,roughness=.75,metalness=0)=>{const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return m}
 const parede=mat('shopping-fachada','#E9E1C9',.8)
 const faixa=mat('shopping-faixa-preta','#0C0C0C',.6)
 const concreto=mat('shopping-concreto','#bdb8a9',.9)
 const asfalto=mat('shopping-estacionamento','#5d5f60',.95)
 const branco=mat('shopping-pintura-vaga','#f4f1e6',.8)
 const vidro=mat('shopping-vidro','#9FD3E8',.12,.25);vidro.transparent=true;vidro.opacity=.32
 vidro.userData.complexoNightEmission={color:'#ffe2a8',intensity:.35}
 // a loja por dentro: clarinha e acesa (sem isso a vitrine pega a cor da moldura e parece fechada)
 const interior=mat('shopping-interior','#FFF4D6',.6);interior.emissive=new THREE.Color('#FFE9B9');interior.emissiveIntensity=.35
 const caixa=(m:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number,sombra=true)=>{
  const g=new THREE.BoxGeometry(w,h,d);geometries.push(g)
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=sombra;mesh.receiveShadow=true;root.add(mesh);return mesh
 }
 const letreiro=(texto:string,fundo:string,tinta:string,w:number,h:number,x:number,y:number,z:number,px=1024)=>{
  const t=placa(texto,fundo,tinta,px,Math.round(px*h/w),Math.round(px*h/w*.62))
  if(!t){caixa(faixa,w,h,.3,x,y,z,false);return}
  textures.push(t)
  const m=new THREE.MeshStandardMaterial({name:'shopping-letreiro',map:t,roughness:.55});m.userData.complexoNightEmission={color:'#ffffff',intensity:.45};materials.push(m)
  const g=new THREE.PlaneGeometry(w,h);geometries.push(g)
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);root.add(mesh)
 }
 const W=BX1-BX0,D=BZ1-BZ0,cx=(BX0+BX1)/2,cz=(BZ0+BZ1)/2,frente=BZ1
 // ── piso: calçada na frente + estacionamento + a faixa que encosta no pátio da Vadico
 caixa(concreto,W+4,.12,4.4,cx,GROUND+.06,frente+1.6,false)
 caixa(asfalto,PX1-PX0,.1,PZ1-PZ0,(PX0+PX1)/2,GROUND+.05,(PZ0+PZ1)/2,false)
 caixa(asfalto,-311-BX1+.4,.1,13,(BX1-.2-311)/2,GROUND+.05,-124.5,false)
 for(let x=PX0+3;x<=PX1-3;x+=3.2){caixa(branco,.16,.02,5,x,GROUND+.11,PZ0+3,false);caixa(branco,.16,.02,5,x,GROUND+.11,PZ1-3,false)}
 // carrinhos parados (caixinha colorida, a mesma régua barata do mapa)
 const cores=['#C2452F','#FFFFFF','#1B7A3D','#FFC400','#7C3AED','#2F5D9E','#9AA0A6']
 ;[-379,-372.6,-360,-350.4,-341,-331.4].forEach((x,i)=>{
  const m=mat(`shopping-carro-${i}`,cores[i%cores.length],.4,.2)
  caixa(m,1.9,1.15,4.1,x+1.6,GROUND+.7,PZ0+3,true);caixa(vidro,1.6,.5,2,x+1.6,GROUND+1.45,PZ0+3.2,false)
 })
 ;[-376,-363.2,-344,-334.4].forEach((x,i)=>{
  const m=mat(`shopping-carro-b-${i}`,cores[(i+3)%cores.length],.4,.2)
  caixa(m,1.9,1.15,4.1,x+1.6,GROUND+.7,PZ1-3,true);caixa(vidro,1.6,.5,2,x+1.6,GROUND+1.45,PZ1-3.2,false)
 })
 // ── o prédio: 2 andares, corpo creme, faixa preta no meio e na cobertura
 caixa(parede,W,ALTURA,D,cx,GROUND+ALTURA/2,cz)
 caixa(faixa,W+.4,.7,D+.4,cx,GROUND+ALTURA+.2,cz)
 caixa(faixa,W+.2,.5,.6,cx,GROUND+5.6,frente+.3,false)
 // térreo: uma vitrine por lojinha, com a cor dela na moldura e o nome em cima
 const terreo=LOJINHAS_SHOPPING.filter(l=>l.id!=='radio')
 for(const l of terreo){
  const w=l.x1-l.x0,x=(l.x0+l.x1)/2
  const moldura=mat(`shopping-moldura-${l.id}`,l.cor,.55)
  caixa(moldura,w,5.2,.5,x,GROUND+2.6,frente+.25)
  caixa(interior,w-1.2,3.4,.1,x,GROUND+1.9,frente+.47,false)
  caixa(vidro,w-1.2,3.4,.2,x,GROUND+1.9,frente+.58,false)
  letreiro(l.pt.replace(/^\S+\s/,'').toUpperCase(),l.cor,l.tinta,w-.8,1.15,x,GROUND+4.35,frente+.52)
 }
 // 2º andar: a Rádio da Torcida (Super Chat) em cima das 4 lojinhas, a praça de alimentação em cima da âncora
 const radio=LOJINHAS_SHOPPING.find(l=>l.id==='radio')!
 caixa(vidro,radio.x1-radio.x0-1,3.6,.2,(radio.x0+radio.x1)/2,GROUND+8.1,frente+.12,false)
 letreiro('📣 RÁDIO DA TORCIDA · SUPER CHAT','#0C0C0C','#FFC400',radio.x1-radio.x0-1,1.4,(radio.x0+radio.x1)/2,GROUND+10.8,frente+.12)
 caixa(vidro,20,3.6,.2,-370,GROUND+8.1,frente+.12,false)
 letreiro('🍔 PRAÇA DE ALIMENTAÇÃO','#FFFFFF','#0C0C0C',20,1.4,-370,GROUND+10.8,frente+.12)
 // letreirão em cima da cobertura (visto de longe e de cima)
 caixa(faixa,30,3.6,.6,cx,GROUND+ALTURA+2.4,frente-1.2)
 letreiro('🛍️ SHOPPING DO CLUBE','#0C0C0C','#FFC400',29.2,3,cx,GROUND+ALTURA+2.4,frente-.88,2048)
 // nome no telhado (pra quem olha o mapa de cima)
 const tTopo=placa('SHOPPING DO CLUBE','#E9E1C9','#0C0C0C',2048,600,300)
 if(tTopo){textures.push(tTopo);const m=new THREE.MeshStandardMaterial({name:'shopping-telhado',map:tTopo,roughness:.85});materials.push(m)
  const g=new THREE.PlaneGeometry(W-8,D-10);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.rotation.x=-Math.PI/2;mesh.position.set(cx,GROUND+ALTURA+.56,cz-1);root.add(mesh)}
 solids.push({id:'shopping-clube',minX:BX0,maxX:BX1,minZ:BZ0,maxZ:BZ1,base:0,top:GROUND+ALTURA+4.2,footprint:ret(BX0,BX1,BZ0,BZ1)})
 root.userData.shopping={label:PLANTA_SHOPPING.label,lojinhas:LOJINHAS_SHOPPING.map(l=>l.id),building:{...PLANTA_SHOPPING.building}}
 let disposed=false
 return{root,solids,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
}
