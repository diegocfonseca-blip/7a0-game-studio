// 🛍️ SHOPPING DO CLUBE (05/11, mockup `scripts/mockups/shopping-clube.png`, Diego: "ok pode fazer").
// 🔁 05/11, 2ª versão (Diego: *"não achei imponente e nem bonito… o local tem que ser bem visível… trazer a Vadico
// Veículos pra cá"*): saiu do lado da Vadico e foi pros quarteirões logo DEPOIS da avenida, de frente pro estádio
// (atrás do pomar e da linha do monotrilho). Agora é um complexo: ÁTRIO de vidro alto no meio (coroa dourada, letreiro
// grande e escudo), ala OESTE com as lojinhas, ala LESTE = showroom de vidro da Vadico Veículos, TOTEM alto (dá pra ver
// do estádio), praça com chafariz e bandeiras, e estacionamento na frente.
// Cada lojinha é uma PORTA pra Loja de sempre (a da home), já rolada na parte dela — nada de compra nova, nada muda no
// Pix. Quem abre a Loja é o cartão do mapa (`presidencia-complexo-3d.tsx`).
import * as THREE from 'three'
import type {PontoComplexo} from './presidencia-complexo-model'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import {texturaLogoPatrocinador} from './presidencia-patrocinador-logo'
import {LOGOS_PATROCINADORES_CIDADE} from './presidencia-patrocinadores-planta'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'

const GROUND=.16
// ── a planta (a fachada olha pro SUL, +z, pro estádio) ──
const OX0=60,OX1=124,OZ0=-268,OZ1=-228,OH=15 // ala oeste: lojinhas
const AX0=124,AX1=166,AZ0=-272,AZ1=-222,AH=27 // átrio
const VX0=166,VX1=230,VZ0=-266,VZ1=-230,VH=11 // ala leste: Vadico Veículos
const PRACA_Z0=-222,PRACA_Z1=-212 // praça na frente
const PK={minX:62,maxX:228,minZ:-211,maxZ:-199} // estacionamento (o monotrilho passa logo ao sul)

export type LojinhaShopping={id:string;pt:string;en:string;ancora:string;cor:string;tinta:string;x0:number;x1:number;itensPt:string;itensEn:string}
/** As 6 lojinhas do mockup. `ancora` = id da seção na Loja (`loja-clube.tsx`). x0/x1 = vitrine na ala oeste. */
export const LOJINHAS_SHOPPING:readonly LojinhaShopping[]=[
 {id:'loja',pt:'🛒 Loja do Clube',en:'🛒 Club Shop',ancora:'loja-planos',cor:'#FFC400',tinta:'#0C0C0C',x0:AX0+6,x1:AX1-6,itensPt:'Planos · salas extras · ficha de carreira · presente',itensEn:'Plans · extra rooms · career slot · gift'},
 {id:'alfaiataria',pt:'👔 Alfaiataria',en:'👔 Tailor',ancora:'loja-presidente',cor:'#FFFFFF',tinta:'#0C0C0C',x0:62,x1:77,itensPt:'Roupas, cabelos e barbas do presidente',itensEn:'Your president’s clothes, hair and beards'},
 {id:'cores',pt:'🎨 Tintas & Cores',en:'🎨 Paints & Colors',ancora:'loja-cores',cor:'#7C3AED',tinta:'#FFFFFF',x0:77.5,x1:92.5,itensPt:'A cor do seu nome',itensEn:'The color of your name'},
 {id:'banco',pt:'🏦 Banco Legends',en:'🏦 Banco Legends',ancora:'loja-moedas',cor:'#1B7A3D',tinta:'#FFFFFF',x0:93,x1:108,itensPt:'Moedas pro clube (carreira)',itensEn:'Coins for your club (career)'},
 {id:'torcida',pt:'🎉 Loja da Torcida',en:'🎉 Fan Shop',ancora:'loja-temas',cor:'#C2452F',tinta:'#FFFFFF',x0:108.5,x1:122.5,itensPt:'Tema da sala (online) · canto da torcida (carreira e online)',itensEn:'Room theme (online) · crowd chant (career and online)'},
 {id:'radio',pt:'📣 Rádio da Torcida',en:'📣 Fan Radio',ancora:'loja-recado',cor:'#0C0C0C',tinta:'#FFC400',x0:62,x1:122,itensPt:'Super Chat no telão · anúncio de marca',itensEn:'Super Chat on the big screen · brand ad'},
]

const ret=(x0:number,x1:number,z0:number,z1:number):PontoComplexo[]=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}]
export const PLANTA_SHOPPING={
 id:'shopping-clube',label:'Shopping do Clube',height:AH,
 building:{minX:OX0,maxX:VX1,minZ:AZ0,maxZ:AZ1},
 parking:{...PK},
 atrio:{minX:AX0,maxX:AX1,minZ:AZ0,maxZ:AZ1},
 vadico:{minX:VX0,maxX:VX1,minZ:VZ0,maxZ:VZ1},
 /** o complexo inteiro (prédios + praça + estacionamento): nada de quarteirão, árvore, rua ou poste aqui dentro */
 reservationPolygons:[ret(OX0-6,VX1+6,AZ0-6,PK.maxZ+2)],
} as const

/** placa pintada em canvas (fora do navegador, nos testes em node, volta null e o prédio fica sem letreiro) */
function placa(texto:string,fundo:string,tinta:string,w:number,h:number,tam:number,borda=true){
 if(typeof document==='undefined')return null
 const c=document.createElement('canvas');c.width=w;c.height=h
 const g=c.getContext('2d');if(!g)return null
 g.fillStyle=fundo;g.fillRect(0,0,w,h)
 if(borda){g.strokeStyle='#000';g.lineWidth=Math.max(6,h*.06);g.strokeRect(0,0,w,h)}
 g.fillStyle=tinta;g.textAlign='center';g.textBaseline='middle'
 let s=tam;const fonte=()=>`800 ${s}px Oswald, "Arial Narrow", Arial, sans-serif`;g.font=fonte()
 while(g.measureText(texto).width>w*.9&&s>10){s-=2;g.font=fonte()}
 g.fillText(texto,w/2,h/2+s*.04)
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4
 return t
}

export function criarShoppingClube(parent:THREE.Object3D,onReady?:()=>void){
 const root=new THREE.Group();root.name='complexo-shopping-clube';parent.add(root)
 const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[]
 const solids:SolidoEntorno[]=[]
 const mat=(name:string,color:string,roughness=.75,metalness=0)=>{const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return m}
 const creme=mat('shopping-fachada','#EFE6CE',.78)
 const pedra=mat('shopping-pedra','#D9CFB4',.85)
 const preto=mat('shopping-preto','#141414',.5,.2)
 const ouro=mat('shopping-ouro','#FFC400',.32,.65);ouro.emissive=new THREE.Color('#5a4300');ouro.emissiveIntensity=.25
 const grafite=mat('shopping-caixilho','#2b3236',.4,.5)
 const piso=mat('shopping-piso-praca','#E3DCCB',.9)
 const asfalto=mat('shopping-estacionamento','#55585a',.95)
 const branco=mat('shopping-pintura','#f4f1e6',.8)
 const agua=mat('shopping-agua','#4FA7D6',.08,.3);agua.emissive=new THREE.Color('#174a66');agua.emissiveIntensity=.3
 const folha=mat('shopping-folha','#3f7d3a',.9),tronco=mat('shopping-tronco','#6b4a2b',.9)
 const vidro=mat('shopping-vidro','#8EC9E6',.06,.55);vidro.transparent=true;vidro.opacity=.5
 vidro.userData.complexoNightEmission={color:'#ffe2a8',intensity:.45}
 const luz=mat('shopping-interior','#FFF4D6',.6);luz.emissive=new THREE.Color('#FFE9B9');luz.emissiveIntensity=.45
 luz.userData.complexoNightEmission={color:'#ffe9b9',intensity:1.2}
 const caixa=(m:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number,sombra=true)=>{
  const g=new THREE.BoxGeometry(w,h,d);geometries.push(g)
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=sombra;mesh.receiveShadow=true;root.add(mesh);return mesh
 }
 const cil=(m:THREE.Material,r:number,h:number,x:number,y:number,z:number,seg=20)=>{
  const g=new THREE.CylinderGeometry(r,r,h,seg);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh
 }
 const quadro=(texto:string,fundo:string,tinta:string,w:number,h:number,x:number,y:number,z:number,opts:{px?:number;giro?:number;borda?:boolean;brilho?:number}={})=>{
  const px=opts.px??1024,t=placa(texto,fundo,tinta,px,Math.max(32,Math.round(px*h/w)),Math.round(px*h/w*.62),opts.borda??true)
  if(!t){caixa(preto,w,h,.2,x,y,z,false);return}
  textures.push(t)
  const m=new THREE.MeshStandardMaterial({name:'shopping-letreiro',map:t,roughness:.5,emissive:new THREE.Color('#ffffff'),emissiveMap:t,emissiveIntensity:opts.brilho??.25});m.userData.complexoNightEmission={color:'#ffffff',intensity:.9};materials.push(m)
  const g=new THREE.PlaneGeometry(w,h);geometries.push(g)
  const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);if(opts.giro)mesh.rotation.y=opts.giro;root.add(mesh);return mesh
 }
 /** pano de vidro com caixilhos: vidro + fundo aceso + grade de montantes */
 const panoVidro=(x0:number,x1:number,y0:number,y1:number,z:number,passoX=3,passoY=4.2)=>{
  const w=x1-x0,h=y1-y0,x=(x0+x1)/2,y=(y0+y1)/2
  caixa(luz,w,h,.1,x,y,z-.35,false);caixa(vidro,w,h,.12,x,y,z,false)
  for(let k=0;k<=Math.round(w/passoX);k++)caixa(grafite,.16,h,.22,x0+k*w/Math.round(w/passoX),y,z+.08,false)
  for(let k=0;k<=Math.round(h/passoY);k++)caixa(grafite,w,.16,.22,x,y0+k*h/Math.round(h/passoY),z+.08,false)
 }
 const solido=(id:string,x0:number,x1:number,z0:number,z1:number,top:number)=>solids.push({id,minX:x0,maxX:x1,minZ:z0,maxZ:z1,base:0,top,footprint:ret(x0,x1,z0,z1)})

 // ── chão: praça na frente, calçadas, estacionamento
 caixa(piso,VX1-OX0+8,.14,PRACA_Z1-AZ1+12,(OX0+VX1)/2,GROUND+.07,(AZ1-6+PRACA_Z1)/2,false)
 caixa(asfalto,PK.maxX-PK.minX,.1,PK.maxZ-PK.minZ,(PK.minX+PK.maxX)/2,GROUND+.05,(PK.minZ+PK.maxZ)/2,false)
 for(let x=PK.minX+2;x<=PK.maxX-2;x+=3.1)caixa(branco,.15,.02,4.6,x,GROUND+.11,PK.minZ+2.6,false)
 const biblioteca=criarBibliotecaVeiculos()
 const vagas:[number,string][]=[[70,'#C2452F'],[79.3,'#FFFFFF'],[91.7,'#1B7A3D'],[104.1,'#2F5D9E'],[110.3,'#FFC400'],[184.6,'#7C3AED'],[197,'#9AA0A6'],[209.4,'#C2452F'],[218.7,'#FFFFFF']]
 vagas.forEach(([x,c],i)=>{const m=mat(`shopping-carro-${i}`,c,.38,.25);caixa(m,1.9,1.1,4.1,x+1.55,GROUND+.65,PK.minZ+2.6,true);caixa(vidro,1.6,.48,2.1,x+1.55,GROUND+1.42,PK.minZ+2.8,false)})

 // ── ALA OESTE (lojinhas): 2 andares + terraço da praça de alimentação no teto
 caixa(creme,OX1-OX0,OH,OZ1-OZ0,(OX0+OX1)/2,GROUND+OH/2,(OZ0+OZ1)/2)
 caixa(preto,OX1-OX0+.4,.8,OZ1-OZ0+.4,(OX0+OX1)/2,GROUND+OH+.25,(OZ0+OZ1)/2)
 caixa(ouro,OX1-OX0+.2,.35,.5,(OX0+OX1)/2,GROUND+7.2,OZ1+.3,false) // friso dourado entre os andares
 for(const l of LOJINHAS_SHOPPING.filter(l=>l.id!=='loja'&&l.id!=='radio')){
  const w=l.x1-l.x0,x=(l.x0+l.x1)/2,cor=mat(`shopping-portal-${l.id}`,l.cor,.45,.1)
  // portal colorido de pé-direito duplo com toldo
  caixa(cor,.9,6.8,1.2,l.x0+.45,GROUND+3.4,OZ1+.6);caixa(cor,.9,6.8,1.2,l.x1-.45,GROUND+3.4,OZ1+.6)
  caixa(cor,w,1.6,1.2,x,GROUND+6.2,OZ1+.6)
  panoVidro(l.x0+.9,l.x1-.9,GROUND,GROUND+5.4,OZ1+.3,2.6,5.4)
  quadro(l.pt.replace(/^\S+\s/,'').toUpperCase(),l.cor,l.tinta,w-1.2,1.2,x,GROUND+6.2,OZ1+1.22,{brilho:.35})
  const toldo=new THREE.BoxGeometry(w-1.6,.18,2.4);geometries.push(toldo);const tm=new THREE.Mesh(toldo,cor);tm.position.set(x,GROUND+5.1,OZ1+1.9);tm.rotation.x=.18;tm.castShadow=true;root.add(tm)
 }
 // 2º andar: telão da Rádio da Torcida (Super Chat) de ponta a ponta
 caixa(preto,OX1-OX0-3,5.2,.5,(OX0+OX1)/2,GROUND+10.8,OZ1+.3)
 quadro('📣 RÁDIO DA TORCIDA · SUPER CHAT AO VIVO','#0C0C0C','#FFC400',OX1-OX0-4,4.2,(OX0+OX1)/2,GROUND+10.8,OZ1+.58,{px:2048,borda:false,brilho:.6})
 // terraço da praça de alimentação (guarda-sóis no teto da ala)
 caixa(vidro,OX1-OX0-2,1.1,.12,(OX0+OX1)/2,GROUND+OH+1.2,OZ1-.6,false)
 quadro('🍔 PRAÇA DE ALIMENTAÇÃO','#FFFFFF','#0C0C0C',22,2.2,80,GROUND+OH+2.6,OZ1-.5)
 ;[[70,-238,'#C2452F'],[82,-246,'#FFC400'],[94,-238,'#1B7A3D'],[106,-246,'#7C3AED'],[116,-238,'#FFFFFF'],[74,-256,'#FFC400'],[100,-256,'#C2452F']].forEach(([x,z,c],i)=>{
  const m=mat(`shopping-guarda-sol-${i}`,c as string,.7);cil(grafite,.08,2.4,x as number,GROUND+OH+1.4,z as number,6)
  const g=new THREE.ConeGeometry(2.1,.9,10);geometries.push(g);const s=new THREE.Mesh(g,m);s.position.set(x as number,GROUND+OH+2.8,z as number);s.castShadow=true;root.add(s)
 })
 solido('shopping-ala-lojas',OX0,OX1,OZ0,OZ1,GROUND+OH+3.4)

 // ── ÁTRIO: o vidro alto do meio, coroa dourada, letreiro gigante, escudo e a entrada com marquise
 const ax=(AX0+AX1)/2
 caixa(pedra,3,AH,AZ1-AZ0,AX0+1.5,GROUND+AH/2,(AZ0+AZ1)/2);caixa(pedra,3,AH,AZ1-AZ0,AX1-1.5,GROUND+AH/2,(AZ0+AZ1)/2)
 caixa(creme,AX1-AX0-6,AH,AZ1-AZ0-4,ax,GROUND+AH/2,(AZ0+AZ1)/2-2)
 panoVidro(AX0+3,AX1-3,GROUND+6.5,GROUND+AH-4.5,AZ1,3.6,4)
 caixa(preto,AX1-AX0+1,4.6,AZ1-AZ0+1,ax,GROUND+AH-2.1,(AZ0+AZ1)/2) // coroa
 caixa(ouro,AX1-AX0+1.4,.6,AZ1-AZ0+1.4,ax,GROUND+AH+.5,(AZ0+AZ1)/2)
 caixa(ouro,AX1-AX0+1.4,.4,.6,ax,GROUND+AH-4.4,AZ1+.5,false)
 quadro('SHOPPING DO CLUBE','#141414','#FFC400',AX1-AX0-2,3.4,ax,GROUND+AH-2.1,AZ1+.53,{px:2048,borda:false,brilho:.7})
 // escudo dourado no meio do vidro
 const escudo=new THREE.Shape([new THREE.Vector2(-3.4,3.2),new THREE.Vector2(3.4,3.2),new THREE.Vector2(3.4,.4),new THREE.Vector2(0,-4),new THREE.Vector2(-3.4,.4)])
 const eg=new THREE.ExtrudeGeometry(escudo,{depth:.5,bevelEnabled:true,bevelSize:.18,bevelThickness:.15,bevelSegments:1});geometries.push(eg)
 const em=new THREE.Mesh(eg,ouro);em.position.set(ax,GROUND+15.5,AZ1+.35);em.castShadow=true;root.add(em)
 const eb=new THREE.Shape([new THREE.Vector2(-2.6,2.5),new THREE.Vector2(2.6,2.5),new THREE.Vector2(2.6,.3),new THREE.Vector2(0,-3.1),new THREE.Vector2(-2.6,.3)])
 const ebg=new THREE.ExtrudeGeometry(eb,{depth:.2,bevelEnabled:false});geometries.push(ebg);const ebm=new THREE.Mesh(ebg,preto);ebm.position.set(ax,GROUND+15.5,AZ1+1.05);root.add(ebm)
 quadro('★','#141414','#FFC400',3,3,ax,GROUND+16,AZ1+1.27,{borda:false,brilho:.8})
 // entrada: porta de vidro alta (é a Loja do Clube, a âncora) + marquise dourada em balanço
 panoVidro(AX0+6,AX1-6,GROUND,GROUND+6,AZ1+.2,2.5,6)
 caixa(ouro,AX1-AX0+6,.5,7,ax,GROUND+6.4,AZ1+3.3)
 caixa(preto,AX1-AX0+6,.9,.6,ax,GROUND+6.95,AZ1+6.6,false)
 quadro('🛒 LOJA DO CLUBE','#FFC400','#0C0C0C',AX1-AX0-4,1.1,ax,GROUND+6.95,AZ1+6.92,{brilho:.4})
 for(const x of [AX0+2,AX1-2])cil(ouro,.35,6.2,x,GROUND+3.1,AZ1+6.2,12)
 solido('shopping-atrio',AX0,AX1,AZ0,AZ1,GROUND+AH+1)

 // ── ALA LESTE: showroom de vidro da VADICO VEÍCULOS, com os carros famosos lá dentro
 caixa(preto,VX1-VX0,1,VZ1-VZ0,(VX0+VX1)/2,GROUND+VH-.5,(VZ0+VZ1)/2)
 caixa(creme,VX1-VX0,VH-1,6,(VX0+VX1)/2,GROUND+(VH-1)/2,VZ0+3)
 caixa(pedra,VX1-VX0,.2,VZ1-VZ0,(VX0+VX1)/2,GROUND+.1,(VZ0+VZ1)/2,false)
 caixa(vidro,VX1-VX0-.4,VH-1,.14,(VX0+VX1)/2,GROUND+(VH-1)/2,VZ1,false)
 caixa(vidro,.14,VH-1,VZ1-VZ0-6,VX1,GROUND+(VH-1)/2,(VZ0+VZ1)/2+3,false)
 for(let k=0;k<=16;k++)caixa(grafite,.18,VH-1,.24,VX0+k*(VX1-VX0)/16,GROUND+(VH-1)/2,VZ1+.05,false)
 for(let k=0;k<=7;k++)caixa(grafite,.24,VH-1,.18,VX1+.05,GROUND+(VH-1)/2,VZ0+6+k*(VZ1-VZ0-6)/7,false)
 caixa(grafite,VX1-VX0,.18,.24,(VX0+VX1)/2,GROUND+4.6,VZ1+.05,false)
 const art=LOGOS_PATROCINADORES_CIDADE.vadico,logo=texturaLogoPatrocinador('vadico',onReady);textures.push(logo)
 const lm=new THREE.MeshBasicMaterial({name:'shopping-vadico-logo',map:logo,toneMapped:false});materials.push(lm)
 caixa(creme,24,5.2,.4,(VX0+VX1)/2,GROUND+VH+2.2,VZ1-.6)
 { const g=new THREE.PlaneGeometry(22,22*art.height/art.width);geometries.push(g);const m=new THREE.Mesh(g,lm);m.position.set((VX0+VX1)/2,GROUND+VH+2.2,VZ1-.38);root.add(m) }
 // carros no salão (dois tablados giratórios com destaque)
 ;(['f40','opala-ss','fusca','gol-gti','brasilia','kombi'] as const).forEach((modelo,i)=>{
  const v=biblioteca.create(modelo);if(!v)return
  const x=VX0+7+i*10,z=(i%2?VZ1-6:VZ1-11)
  if(i<2)cil(i?branco:ouro,3,.25,x,GROUND+.33,z,24)
  v.root.position.set(x,GROUND+(i<2?.45:.2),z);v.root.rotation.y=(i%2?.6:-.6);v.root.traverse(o=>{o.castShadow=true;o.receiveShadow=true});root.add(v.root)
 })
 solido('shopping-vadico',VX0,VX1,VZ0,VZ1,GROUND+VH+5)

 // ── TOTEM: o letreiro alto que se vê do estádio
 const tx=OX0+2,tz=PRACA_Z1+1
 caixa(preto,4.4,34,2.4,tx,GROUND+17,tz)
 caixa(ouro,4.8,.6,2.8,tx,GROUND+34.2,tz)
 const tv=placa('SHOPPING','#141414','#FFC400',256,1024,180,false)
 if(tv){textures.push(tv);const m=new THREE.MeshStandardMaterial({map:tv,emissive:new THREE.Color('#ffffff'),emissiveMap:tv,emissiveIntensity:.6});materials.push(m)
  const c=document.createElement('canvas');c.width=256;c.height=1600;const g=c.getContext('2d')!;g.fillStyle='#141414';g.fillRect(0,0,256,1600);g.fillStyle='#FFC400';g.font='800 150px Oswald, "Arial Narrow", Arial, sans-serif';g.textAlign='center';g.textBaseline='middle'
  ;'SHOPPING'.split('').forEach((ch,i)=>g.fillText(ch,128,110+i*150));g.font='800 64px Oswald, Arial';g.fillText('DO CLUBE',128,1440)
  const t2=new THREE.CanvasTexture(c);t2.colorSpace=THREE.SRGBColorSpace;textures.push(t2);m.map=t2;m.emissiveMap=t2
  for(const s of [1,-1]){const pg=new THREE.PlaneGeometry(3.6,30);geometries.push(pg);const p=new THREE.Mesh(pg,m);p.position.set(tx,GROUND+18,tz+s*1.22);if(s<0)p.rotation.y=Math.PI;root.add(p)}}
 solido('shopping-totem',tx-2.2,tx+2.2,tz-1.2,tz+1.2,GROUND+35)

 // ── praça: chafariz na frente do átrio, bandeiras e palmeiras
 cil(pedra,5.2,.7,ax,GROUND+.35,PRACA_Z0+4.5,32);cil(agua,4.6,.12,ax,GROUND+.72,PRACA_Z0+4.5,32);cil(pedra,.6,2.6,ax,GROUND+1.3,PRACA_Z0+4.5,12);cil(agua,1.4,.12,ax,GROUND+2.6,PRACA_Z0+4.5,16)
 const bandeiras=['#FFC400','#1B7A3D','#C2452F','#7C3AED','#FFFFFF','#0C0C0C']
 ;[70,78,86,94,102,110,180,188,196,204,212,220].forEach((x,i)=>{
  cil(branco,.1,9,x,GROUND+4.5,PRACA_Z1-1.2,6)
  const m=mat(`shopping-bandeira-${i}`,bandeiras[i%bandeiras.length],.8);caixa(m,2.4,1.5,.05,x+1.25,GROUND+8.1,PRACA_Z1-1.2,false)
 })
 for(const x of [AX0-4,AX1+4,OX0+14,VX1-10]){
  cil(tronco,.3,7,x,GROUND+3.5,PRACA_Z1-3,8)
  const g=new THREE.SphereGeometry(2.4,10,8);geometries.push(g);const f=new THREE.Mesh(g,folha);f.scale.set(1,.55,1);f.position.set(x,GROUND+7.4,PRACA_Z1-3);f.castShadow=true;root.add(f)
 }
 // nome no telhado do átrio (pra quem olha o mapa de cima)
 const tTopo=placa('SHOPPING DO CLUBE','#EFE6CE','#0C0C0C',2048,1400,300,false)
 if(tTopo){textures.push(tTopo);const m=new THREE.MeshStandardMaterial({name:'shopping-telhado',map:tTopo,roughness:.85});materials.push(m)
  const g=new THREE.PlaneGeometry(AX1-AX0-8,AZ1-AZ0-10);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=Math.PI/2;mesh.position.set(ax,GROUND+AH+.82,(AZ0+AZ1)/2);root.add(mesh)}

 root.userData.shopping={label:PLANTA_SHOPPING.label,lojinhas:LOJINHAS_SHOPPING.map(l=>l.id),building:{...PLANTA_SHOPPING.building}}
 let disposed=false
 return{root,solids,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());biblioteca.dispose?.()}}
}
