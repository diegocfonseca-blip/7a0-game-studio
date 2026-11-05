import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {CASA_LUCA as L} from './presidencia-casa-luca-planta'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import {criarAreasCasaLuca} from './presidencia-casa-luca-areas-3d'

/** 💙 05/11 — CASA LUCA: prédio amarelo de 2 andares, telhado azul com o coração, letreiro, rampa com corrimão e piso tátil,
 * e um pátio com parquinho INCLUSIVO (balanço com cadeirinha, carrossel no nível do chão — com cadeira de rodas em cima —,
 * gangorra, painel sensorial com tubo de som, caixa de areia elevada, trilha de texturas, cata-ventos e bolas grandes).
 * Gente: 2 crianças em cadeira de rodas, 1 com andador, pais ajudando (empurrando a cadeira, segurando a mão, empurrando o
 * balanço) e crianças brincando. Leve pro celular: o fixo vira 1 malha com cor por vértice + vidro + placas; o que mexe é só
 * balanço, carrossel, gangorra e cata-ventos (giro/ângulo de um grupo) e os bonecos (os mesmos civis GLB da cidade, que só
 * nascem quando aparecem na tela). Tudo anda pelo relógio da cena (`seconds`) — parado até o primeiro toque, como a cidade. */
export function criarCasaLuca(parent:T.Object3D,{leve=false,onReady,areas=false}:{leve?:boolean;onReady?:()=>void;areas?:boolean}={}){
 const root=new T.Group();root.name='casa-luca';root.position.set(L.x,0,L.z);root.rotation.y=L.heading;parent.add(root)
 const materials:T.Material[]=[],textures:T.Texture[]=[],geometries:T.BufferGeometry[]=[]
 const G0=.16 // topo da calçada do quarteirão
 const colored=new T.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0});materials.push(colored)
 const glass=new T.MeshStandardMaterial({color:'#9cc8e6',roughness:.2,metalness:.25});glass.userData.complexoNightEmission={color:'#ffe3a6',intensity:.55,dayIntensity:.03};materials.push(glass)
 const tint=(g:T.BufferGeometry,color:string)=>{const c=new T.Color(color),n=g.getAttribute('position').count,a=new Float32Array(n*3);for(let i=0;i<n;i++)c.toArray(a,i*3);g.setAttribute('color',new T.Float32BufferAttribute(a,3));return g}
 const clean=(g:T.BufferGeometry)=>{const ng=g.index?g:g;return ng}
 // Peças com cor: vão pra uma lista e viram UMA malha no fim (ou uma por grupo que se mexe)
 const bag=()=>{const list:T.BufferGeometry[]=[];return{list,
  box(color:string,w:number,h:number,d:number,x:number,y:number,z:number,rx=0,ry=0,rz=0){const g=new T.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);g.translate(x,y,z);list.push(tint(g,color))},
  cyl(color:string,r0:number,r1:number,h:number,x:number,y:number,z:number,seg=10,rx=0,rz=0,ts=0,tl=Math.PI*2){const g=new T.CylinderGeometry(r0,r1,h,seg,1,false,ts,tl);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);list.push(tint(g,color))},
  ball(color:string,r:number,x:number,y:number,z:number,sy=1){const g=new T.SphereGeometry(r,12,8);if(sy!==1)g.scale(1,sy,1);g.translate(x,y,z);list.push(tint(g,color))},
  torus(color:string,r:number,t:number,x:number,y:number,z:number,ry=0,arc=Math.PI*2,rx=0){const g=new T.TorusGeometry(r,t,6,18,arc);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);g.translate(x,y,z);list.push(tint(g,color))},
  mesh(name:string,material:T.Material=colored){const g=mergeGeometries(list.map(clean))!;list.forEach(p=>p.dispose());list.length=0;geometries.push(g);const o=new T.Mesh(g,material);o.name=name;o.castShadow=true;o.receiveShadow=true;return o},
 }}
 const fixo=bag()
 const YEL='#F5C443',YEL2='#E9B232',WHITE='#FBF7EC',BLUE='#2F6FD6',NAVY='#1E3F86',WOOD='#B98654',RUB='#4FA8E8',RUB2='#F2A8B6',TACT='#FFD21F',GREY='#8b8f93'
 const RED='#E8503A',ORANGE='#F59A2E',GREEN='#3FAE5A',PURPLE='#7C3AED',SKY='#4FB6E8'

 // ── PRÉDIO (norte do lote; fachada pra +z): 17 × 7,5 m, 2 andares de 3,2 m ──
 const BX=8.5,BZ0=-11,BZ1=-3.5,FH=3.2,WH=FH*2,front=BZ1
 fixo.box(WHITE,BX*2+.5,.3,BZ1-BZ0+.5,0,G0+.15,(BZ0+BZ1)/2) // embasamento
 fixo.box(YEL,BX*2,WH,BZ1-BZ0,0,G0+.3+WH/2,(BZ0+BZ1)/2)
 fixo.box(WHITE,BX*2+.14,.22,BZ1-BZ0+.14,0,G0+.3+FH,(BZ0+BZ1)/2) // friso entre andares
 fixo.box(WHITE,BX*2+.3,.3,BZ1-BZ0+.3,0,G0+.3+WH,(BZ0+BZ1)/2) // beiral
 for(const s of[-1,1])fixo.box(YEL2,.5,WH,.5,s*(BX-.1),G0+.3+WH/2,front-.05) // quinas
 // janelas (moldura branca + vidro) nas quatro faces visíveis
 const win=(x:number,y:number,z:number,w:number,h:number,side:'z'|'-z'|'x'|'-x')=>{
  const along=side==='z'||side==='-z',sgn=side==='z'||side==='x'?1:-1
  if(along){fixo.box(BLUE,w+.3,h+.3,.1,x,y,z+sgn*.03);fixo.box(WHITE,w+.4,.14,.28,x,y-h/2-.18,z+sgn*.1)}
  else{fixo.box(BLUE,.1,h+.3,w+.3,x+sgn*.03,y,z);fixo.box(WHITE,.28,.14,w+.4,x+sgn*.1,y-h/2-.18,z)}
  const g=along?new T.PlaneGeometry(w,h):new T.PlaneGeometry(w,h).rotateY(Math.PI/2);if(sgn<0)g.rotateY(Math.PI);g.translate(along?x:x+sgn*.1,y,along?z+sgn*.1:z);glassGeos.push(g)
 }
 const glassGeos:T.BufferGeometry[]=[]
 const y1=G0+.3+1.7,y2=G0+.3+FH+1.6
 for(const x of[-6.6,-3.6,3.6,6.6])win(x,y1,front,1.6,1.5,'z')
 for(const x of[-6.6,-4.2,4.2,6.6])win(x,y2,front,1.5,1.4,'z')
 for(const x of[-6,-2,2,6]){win(x,y1,BZ0,1.6,1.5,'-z');win(x,y2,BZ0,1.5,1.4,'-z')}
 for(const s of[-1,1])for(const z of[-9,-5.5]){win(s*BX,y1,z,1.4,1.4,s>0?'x':'-x');win(s*BX,y2,z,1.4,1.3,s>0?'x':'-x')}
 // porta larga (acessível, 1,6 m) azul com batente branco
 fixo.box(WHITE,2.3,2.75,.16,0,G0+.75+1.3,front+.02)
 fixo.box(NAVY,1.8,2.45,.12,0,G0+.75+1.2,front+.08)
 fixo.box(SKY,.06,2.3,.14,0,G0+.75+1.2,front+.1)
 // marquise azul sobre a porta, com dois pilares
 fixo.box(BLUE,4.6,.22,2.4,0,G0+3.05,front+1.2)
 for(const s of[-1,1])fixo.cyl(WHITE,.08,.08,2.45,s*2.1,G0+.75+1.2,front+2.25,8)
 // varanda elevada (45 cm) + RAMPA de 6 m (7,5%) com CORRIMÃO dos dois lados, em duas alturas
 const PH=.45,PZ1=front+2.4,RZ1=PZ1+6,RW=1.9
 fixo.box(WHITE,5.2,PH,2.4,0,G0+PH/2,front+1.2)
 const ang=Math.atan2(PH,RZ1-PZ1),len=Math.hypot(PH,RZ1-PZ1)
 fixo.box('#d9d2c2',RW,.12,len,0,G0+PH/2-.04,(PZ1+RZ1)/2,ang)
 for(const s of[-1,1]){
  fixo.box(WHITE,.16,.3,len,s*(RW/2+.06),G0+PH/2+.1,(PZ1+RZ1)/2,ang) // guia de balizamento
  for(const h of[.92,.7])fixo.cyl(NAVY,.035,.035,len+.6,s*(RW/2+.1),G0+PH/2+h,(PZ1+RZ1)/2,8,Math.PI/2-ang)
  for(let i=0;i<=4;i++){const z=PZ1+i*(RZ1-PZ1)/4,y=G0+PH*(1-i/4);fixo.cyl(NAVY,.04,.04,.95,s*(RW/2+.1),y+.47,z,6)}
  // corrimão da varanda
  fixo.cyl(NAVY,.035,.035,1.5,s*2.55,G0+PH+.92,front+1.6,8,Math.PI/2);fixo.cyl(NAVY,.04,.04,.92,s*2.55,G0+PH+.46,front+2.3,6)
 }
 // PISO TÁTIL: faixa-guia (frisos) do portão até a rampa + pisos de alerta (bolinhas) no pé da rampa e no portão
 const TX=0,GATE=11.3
 fixo.box(TACT,.42,.03,GATE-RZ1-1.6,TX,G0+.03,(RZ1+.8+GATE-.8)/2)
 for(const dx of[-.12,0,.12])fixo.box('#E5B800',.04,.025,GATE-RZ1-1.6,TX+dx,G0+.055,(RZ1+.8+GATE-.8)/2)
 for(const zc of[RZ1+.4,GATE-.4]){fixo.box(TACT,.9,.03,.8,TX,G0+.03,zc);for(let i=0;i<4;i++)for(let k=0;k<4;k++)fixo.cyl('#E5B800',.05,.05,.04,TX-.3+i*.2,G0+.06,zc-.27+k*.18,6)}

 // ── PÁTIO: piso emborrachado + caminho + cerca baixa com portão ──
 const PZ0=front+.2
 fixo.box(RUB,22.6,.04,11.3-PZ0,0,G0+.01,(PZ0+11.3)/2)
 fixo.box('#efe6d2',1.5,.045,GATE-RZ1,0,G0+.015,(RZ1+GATE)/2) // caminho claro até o portão
 fixo.box(RUB2,9,.045,5.2,-6,G0+.016,8.3) // área da gangorra (rosa)
 fixo.box('#FFD45C',9.4,.045,5.8,5.6,G0+.016,1.6) // área do carrossel (amarela)
 // cerca branca baixa (1 m) com tábuas azuis, portão aberto no meio da frente (2,4 m)
 const fence=(x0:number,z0:number,x1:number,z1:number)=>{const L2=Math.hypot(x1-x0,z1-z0),a=Math.atan2(z1-z0,x1-x0),n=Math.max(1,Math.round(L2/1.4))
  for(const h of[.45,.9])fixo.box(WHITE,L2,.08,.06,(x0+x1)/2,G0+h,(z0+z1)/2,0,-a)
  for(let i=0;i<=n;i++){const t=i/n;fixo.box(i%2?SKY:WHITE,.1,1.05,.1,x0+(x1-x0)*t,G0+.52,z0+(z1-z0)*t)}}
 const E=11.25
 fence(-E,BZ0+1,-E,E);fence(-E,E,-1.2,E);fence(1.2,E,E,E)
 // 💙 06/11: portão no lado leste, pra rampa que desce pro JARDIM SENSORIAL (presidencia-casa-luca-areas-3d.ts)
 fence(E,BZ0+1,E,.75);fence(E,2.65,E,E);for(const z of[.75,2.65]){fixo.box(BLUE,.22,1.5,.22,E,G0+.75,z);fixo.ball(TACT,.14,E,G0+1.58,z)}
 for(const s of[-1,1]){fixo.box(BLUE,.22,1.5,.22,s*1.25,G0+.75,E);fixo.ball(TACT,.14,s*1.25,G0+1.58,E)}
 // árvore de sombra no canto e banco pros pais
 fixo.cyl('#6b4b2e',.18,.24,2.6,-10,G0+1.3,-1.4,7);fixo.ball('#4f8a3e',1.7,-10,G0+3.3,-1.4,.85);fixo.ball('#5f9c48',1.2,-9.2,G0+3.9,-.8,.85)
 fixo.box(WOOD,1.8,.08,.5,9.8,G0+.48,-1.4);fixo.box(WOOD,1.8,.4,.07,9.8,G0+.72,-1.62);for(const dx of[-.7,.7])fixo.box(GREY,.08,.44,.42,9.8+dx,G0+.22,-1.4)

 // ── BALANÇO (oeste): pórtico + 1 balanço ADAPTADO (cadeirinha com encosto e cinto) + 1 comum ──
 const SW={x:-6.6,z:2,top:G0+2.7}
 // pórtico em A: as duas pernas de cada lado saem afastadas no chão (±0,9 m) e se encontram na trave
 for(const s of[-1,1])for(const dz of[-1,1]){const tilt=Math.atan2(.9,SW.top-G0),len=Math.hypot(.9,SW.top-G0);fixo.box('#F0603C',.14,len,.14,SW.x+s*2.4,G0+(SW.top-G0)/2,SW.z+dz*.45,-dz*tilt)}
 fixo.cyl('#F0603C',.09,.09,5.1,SW.x,SW.top,SW.z,10,0,Math.PI/2)
 const swing=(dx:number,adapt:boolean)=>{const b=bag(),L2=SW.top-(G0+.62)
  for(const s of[-1,1])b.box(GREY,.03,L2,.03,s*.32,-L2/2,0)
  if(adapt){b.box(ORANGE,.62,.08,.5,0,-L2,0);b.box(ORANGE,.62,.62,.08,0,-L2+.3,-.24);for(const s of[-1,1])b.box(ORANGE,.08,.3,.5,s*.3,-L2+.16,0);b.box(NAVY,.5,.06,.06,0,-L2+.3,.24)}
  else b.box('#2c2c2c',.55,.05,.22,0,-L2,0)
  const pivot=new T.Group();pivot.position.set(SW.x+dx,SW.top,SW.z);pivot.add(b.mesh('casa-luca-balanco'+(adapt?'-adaptado':'')));root.add(pivot);return{pivot,seatY:-L2}}
 const swingA=swing(-1,true),swingB=swing(1.2,false)

 // ── CARROSSEL NO NÍVEL DO CHÃO (leste): disco rente ao piso, gomos coloridos, mastro e barras de apoio ──
 const CR={x:5.6,z:1.6,r:2.1}
 fixo.cyl('#5d6670',CR.r+.12,CR.r+.12,.05,CR.x,G0+.03,CR.z,24)
 const carousel=new T.Group();carousel.position.set(CR.x,G0+.06,CR.z);root.add(carousel)
 {const b=bag(),cols=[RED,TACT,GREEN,SKY,PURPLE,ORANGE]
  cols.forEach((c,i)=>b.cyl(c,CR.r,CR.r,.05,0,.025,0,6,0,0,i*Math.PI/3,Math.PI/3))
  b.cyl(WHITE,.08,.08,1.3,0,.7,0,8);b.ball(TACT,.18,0,1.4,0)
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.5;b.box(NAVY,.05,.05,1.5,Math.cos(a)*.75,1.05,Math.sin(a)*.75,0,-a+Math.PI/2)}
  b.torus(NAVY,1.5,.04,0,1.05,0,0,Math.PI*2,Math.PI/2)
  carousel.add(b.mesh('casa-luca-carrossel'))}

 // ── GANGORRA (sudoeste, área rosa) ──
 const SS={x:-6,z:8.3}
 fixo.box('#5d6670',.4,.5,.6,SS.x,G0+.25,SS.z)
 const seesaw=new T.Group();seesaw.position.set(SS.x,G0+.55,SS.z);root.add(seesaw)
 {const b=bag();b.box(PURPLE,3.8,.1,.32,0,0,0);for(const s of[-1,1]){b.box(TACT,.4,.06,.4,s*1.6,.07,0);b.box(NAVY,.05,.42,.05,s*1.25,.25,0);b.box(NAVY,.05,.05,.4,s*1.25,.45,0)};seesaw.add(b.mesh('casa-luca-gangorra'))}

 // ── PAINEL SENSORIAL (parede leste, na altura de quem está sentado) + TUBO DE SOM ──
 const SP={x:10.6,z:5.2}
 for(const dz of[-1.25,1.25])fixo.box(NAVY,.14,1.9,.14,SP.x,G0+.95,SP.z+dz)
 fixo.box(WHITE,.12,1.05,2.6,SP.x+.05,G0+1.15,SP.z)
 // tubo de som: cano em U colorido com bocais
 fixo.torus(GREEN,.5,.07,SP.x-.15,G0+1.25,SP.z+2.3,Math.PI/2,Math.PI,0);for(const dz of[-.5,.5])fixo.cyl(TACT,.14,.09,.22,SP.x-.15,G0+1.25,SP.z+2.3+dz,8,Math.PI/2);fixo.cyl(NAVY,.05,.05,1.25,SP.x-.15,G0+.62,SP.z+2.3,6)

 // ── CAIXA DE AREIA ELEVADA (mesa, cabe cadeira de rodas por baixo) ──
 const SB={x:5.2,z:7.5}
 fixo.box(WOOD,2.6,.18,1.5,SB.x,G0+.72,SB.z);fixo.box('#E9D59B',2.3,.06,1.2,SB.x,G0+.83,SB.z)
 for(const sx of[-1,1])for(const sz of[-1,1])fixo.box(WOOD,.12,.7,.12,SB.x+sx*1.15,G0+.35,SB.z+sz*.6)
 fixo.cyl(RED,.12,.09,.16,SB.x-.6,G0+.94,SB.z+.1,8);fixo.cyl(SKY,.1,.1,.12,SB.x+.5,G0+.92,SB.z-.2,8)

 // ── TRILHA DE TEXTURAS (sul, junto da cerca): placas de grama, seixo, madeira, areia, borracha, cortiça ──
 const TR={z:10.2,x0:2.4,x1:9.8}
 ;['#6fb24a','#bdb7ad','#c9955e','#e9d59b','#58a4d8','#c97f3c','#9d77d6','#6fb24a'].forEach((c,i,a)=>{const w=(TR.x1-TR.x0)/a.length;fixo.box(c,w-.08,.06+(i%3)*.012,.95,TR.x0+w*(i+.5),G0+.04,TR.z)})
 // seixos na placa de seixo
 for(let i=0;i<6;i++)fixo.ball('#a19b90',.07,TR.x0+1.15+((i*.37)%.6)-.3,G0+.1,TR.z-.3+(i*.21)%.6,.6)

 // ── BOLAS GRANDES COLORIDAS ──
 ;[[RED,-10.4,5.2,.42],[SKY,1.9,6.2,.36],[TACT,9.6,-.2,.4],[PURPLE,-2.4,3.6,.34],[GREEN,10.2,9,.38]].forEach(([c,x,z,r])=>fixo.ball(c as string,r as number,x as number,G0+(r as number),z as number))

 // ── CATA-VENTOS (giram) em mastros na cerca ──
 const pinwheels:T.Object3D[]=[]
 {const blades=bag(),cols=[RED,TACT,SKY,GREEN]
  for(let i=0;i<4;i++){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,.42,.05,0,.12,.36,0],3));g.setIndex([0,1,2,0,2,1]);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1],2));g.rotateZ(i*Math.PI/2);blades.list.push(tint(g,cols[i]))}
  blades.ball(WHITE,.05,0,0,.02)
  const shared=mergeGeometries(blades.list)!;blades.list.forEach(g=>g.dispose());geometries.push(shared)
  ;[[-11.25,0],[-11.25,5],[-11.25,10],[11.25,0],[11.25,9],[-5,11.25],[5,11.25]].forEach(([x,z],i)=>{
   fixo.cyl(WHITE,.03,.03,1.6,x,G0+.8,z,6)
   const p=new T.Mesh(shared,colored);p.name='casa-luca-cata-vento';p.position.set(x,G0+1.65,z+(z>=11?.06:0));p.rotation.y=z>=11?0:x<0?-Math.PI/2:Math.PI/2;p.userData.speed=2.4+(i%3)*.7;root.add(p);pinwheels.push(p)})
 }

 // malha fixa única + vidro
 root.add(fixo.mesh('casa-luca-fixo'))
 {const g=mergeGeometries(glassGeos)!;glassGeos.forEach(p=>p.dispose());geometries.push(g);const o=new T.Mesh(g,glass);o.name='casa-luca-vidro';root.add(o)}

 // ── TELHADO AZUL (duas águas) com o coração e o nome, pra achar de cima ──
 const canvasTexture=(w:number,h:number,draw:(g:CanvasRenderingContext2D,cw:number,ch:number)=>void)=>{
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([47,111,214,255]),1,1)
  else{const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));draw(c.getContext('2d')!,c.width,c.height);map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;textures.push(map);return map
 }
 const heart=(g:CanvasRenderingContext2D,cx:number,cy:number,s:number,fill:string,stroke?:string)=>{
  g.beginPath();g.moveTo(cx,cy+s*.42);g.bezierCurveTo(cx-s*.95,cy-s*.12,cx-s*.55,cy-s*.78,cx,cy-s*.36);g.bezierCurveTo(cx+s*.55,cy-s*.78,cx+s*.95,cy-s*.12,cx,cy+s*.42);g.closePath()
  g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=s*.06;g.strokeStyle=stroke;g.stroke()}
 }
 const font=(px:number)=>`900 ${Math.round(px)}px Oswald,"Arial Narrow",Arial,sans-serif`
 const RIDGE=2.4,RW2=(BZ1-BZ0)/2+.5,RL=BX*2+1,slope=Math.hypot(RIDGE,RW2),roofAng=Math.atan2(RIDGE,RW2),roofY=G0+.45+WH
 const roofTex=canvasTexture(RL,slope,(g,cw,ch)=>{
  g.fillStyle='#2F6FD6';g.fillRect(0,0,cw,ch)
  g.strokeStyle='rgba(20,50,120,.45)';g.lineWidth=4;for(let x=0;x<cw;x+=34){g.beginPath();g.moveTo(x,0);g.lineTo(x,ch);g.stroke()}
  g.fillStyle='rgba(255,255,255,.9)';g.fillRect(0,0,cw,8)
  heart(g,ch*.62,ch*.55,ch*.92,'#ffffff')
  g.fillStyle='#ffffff';g.textBaseline='middle';g.textAlign='left';g.font=font(ch*.48);g.fillText('CASA LUCA',ch*1.2,ch*.56,cw-ch*1.35)
 })
 const roofMat=new T.MeshStandardMaterial({map:roofTex,roughness:.7});materials.push(roofMat)
 for(const s of[1,-1]){
  const g=new T.PlaneGeometry(RL,slope);geometries.push(g)
  const o=new T.Mesh(g,roofMat);o.name='casa-luca-telhado';o.castShadow=true;o.receiveShadow=true
  // s=1: água da frente (+z); s=-1: água de trás. Nas duas o texto fica "de pé" pra quem olha DE CIMA (o norte é o alto da tela
  // no "Ver tudo"), então lê CASA LUCA nas duas águas sem ficar de cabeça pra baixo.
  o.rotation.x=-Math.PI/2+s*roofAng
  o.position.set(0,roofY+RIDGE/2,(BZ0+BZ1)/2+s*RW2/2);root.add(o)
 }
 // oitões amarelos (triângulos) nas laterais
 {const b=bag();for(const s of[-1,1]){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([s*(BX+.01),roofY,BZ0-.05, s*(BX+.01),roofY,BZ1+.05, s*(BX+.01),roofY+RIDGE,(BZ0+BZ1)/2],3));g.setIndex(s>0?[0,2,1]:[0,1,2]);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));b.list.push(tint(g,YEL))}
  b.box(NAVY,RL+.1,.16,.2,0,roofY+RIDGE+.02,(BZ0+BZ1)/2);root.add(b.mesh('casa-luca-oitoes'))}
 // letreiro CASA LUCA (frente e fundos) e coração azul grande na fachada (frente e fundos)
 const plane=(map:T.Texture,w:number,h:number,name:string)=>{const m=new T.MeshBasicMaterial({map,toneMapped:false,transparent:true});materials.push(m);const g=new T.PlaneGeometry(w,h);geometries.push(g);const o=new T.Mesh(g,m);o.name=name;root.add(o);return o}
 const signTex=canvasTexture(8,1.3,(g,cw,ch)=>{
  g.fillStyle='#FBF7EC';g.beginPath();g.roundRect(4,4,cw-8,ch-8,ch*.22);g.fill();g.lineWidth=8;g.strokeStyle='#1E3F86';g.stroke()
  heart(g,ch*.62,ch*.55,ch*.62,'#2F6FD6')
  g.fillStyle='#1E3F86';g.textBaseline='middle';g.textAlign='center';g.font=font(ch*.66);g.fillText('CASA LUCA',cw/2+ch*.35,ch*.56,cw-ch*1.6)
  heart(g,cw-ch*.62,ch*.55,ch*.62,'#2F6FD6')
 })
 const heartTex=canvasTexture(2,2,(g,cw,ch)=>{heart(g,cw/2,ch*.56,cw*.92,'#2F6FD6','#FBF7EC')})
 const signF=plane(signTex,6.9,1.13,'casa-luca-letreiro');signF.position.set(0,G0+.3+FH+.42,front+.2)
 // 💙 o coração da fachada mora no 2º andar, no meio, entre as janelas
 const heartF=plane(heartTex,1.9,1.9,'casa-luca-coracao');heartF.position.set(0,G0+.3+FH+1.95,front+.06)
 const signB=plane(signTex,7.6,1.24,'casa-luca-letreiro-fundos');signB.rotation.y=Math.PI;signB.position.set(0,G0+.3+FH+1.7,BZ0-.07)
 const heartB=plane(heartTex,1.7,1.7,'casa-luca-coracao-fundos');heartB.rotation.y=Math.PI;heartB.position.set(0,G0+1.6,BZ0-.07)
 // painel sensorial: botões, cores e texturas pintados numa placa
 const panelTex=canvasTexture(2.5,1,(g,cw,ch)=>{
  g.fillStyle='#FBF7EC';g.fillRect(0,0,cw,ch)
  const cols=['#E8503A','#FFC400','#3FAE5A','#4FB6E8','#7C3AED','#F59A2E']
  for(let i=0;i<6;i++){g.fillStyle=cols[i];g.beginPath();g.arc(cw*(.1+i*.16),ch*.3,ch*.13,0,Math.PI*2);g.fill();g.lineWidth=5;g.strokeStyle='#0C0C0C';g.stroke()}
  for(let i=0;i<5;i++){g.fillStyle=cols[(i+2)%6];g.fillRect(cw*(.06+i*.19),ch*.58,cw*.15,ch*.3);g.strokeStyle='#0C0C0C';g.lineWidth=4;for(let k=1;k<5;k++){g.beginPath();g.moveTo(cw*(.06+i*.19)+k*cw*.03,ch*.58);g.lineTo(cw*(.06+i*.19)+k*cw*.03,ch*.88);g.stroke()}}
 })
 const panel=plane(panelTex,2.5,1,'casa-luca-painel-sensorial');panel.rotation.y=-Math.PI/2;panel.position.set(SP.x-.02,G0+1.15,SP.z)

 // ── GENTE ──
 // cadeira de rodas (geometria simples, uma só pras duas): rodas grandes com aro, assento, encosto, manoplas e rodinhas
 const chairGeo=(()=>{const b=bag()
  for(const s of[-1,1]){b.torus('#2b2f36',.29,.035,s*.31,.31,-.04,Math.PI/2);b.torus('#c9ced6',.24,.015,s*.35,.31,-.04,Math.PI/2);b.cyl('#9aa3ad',.03,.03,.04,s*.31,.31,-.04,8,0,Math.PI/2)
   b.box('#c9ced6',.03,.03,.6,s*.25,.44,.02);b.box('#c9ced6',.03,.5,.03,s*.25,.62,-.22,-.15);b.box('#1b1b1b',.04,.04,.14,s*.25,.86,-.3)
   b.cyl('#2b2f36',.07,.07,.04,s*.22,.07,.33,10,0,Math.PI/2);b.box('#c9ced6',.03,.32,.03,s*.22,.25,.3);b.box('#1b1b1b',.12,.02,.16,s*.12,.14,.36)}
  b.box(BLUE,.48,.06,.42,0,.44,.02);b.box(BLUE,.48,.42,.05,0,.66,-.21,-.12)
  const g=mergeGeometries(b.list)!;b.list.forEach(p=>p.dispose());geometries.push(g);return g})()
 const walkerGeo=(()=>{const b=bag()
  for(const sx of[-1,1])for(const sz of[0,1]){b.cyl('#c9ced6',.02,.02,.72,sx*.27,.36,sz*.42,6);b.ball(sz?'#E8503A':'#2b2f36',.05,sx*.27,.04,sz*.42)}
  for(const sx of[-1,1])b.cyl(TACT,.03,.03,.5,sx*.27,.72,.21,8,Math.PI/2)
  b.cyl('#c9ced6',.02,.02,.54,0,.55,.42,6,0,Math.PI/2)
  const g=mergeGeometries(b.list)!;b.list.forEach(p=>p.dispose());geometries.push(g);return g})()
 type Ator={id:string;body:ReturnType<typeof createCivilian>;h:number;frame:(s:number)=>{seated?:number;speed?:number;distance?:number}}
 const people:Ator[]=[],props:T.Object3D[]=[]
 const pessoa=(id:string,variant:string,parentObj:T.Object3D,outfit:string,h:number,frame:Ator['frame'])=>{
  const body=createCivilian(parentObj,{id:'casa-luca-'+id,variant,outfitColor:outfit,deferUntilVisible:true,onReady});people.push({id,body,h,frame});return body}
 const prop=(geo:T.BufferGeometry,name:string,parentObj:T.Object3D)=>{const o=new T.Mesh(geo,colored);o.name=name;o.castShadow=true;parentObj.add(o);props.push(o);return o}
 const SENTA=.12 // a criança "sentada" apoia os pés no apoio da cadeira

 // 1) ♿ criança na cadeira de rodas passeando, EMPURRADA pela mãe (volta em elipse em volta da gangorra)
 const LOOP={x:-6,z:8.3,rx:4.25,rz:2.25,w:.2}
 const loopAt=(s:number)=>{const a=s*LOOP.w,x=LOOP.x+Math.cos(a)*LOOP.rx,z=LOOP.z+Math.sin(a)*LOOP.rz,tx=-Math.sin(a)*LOOP.rx,tz=Math.cos(a)*LOOP.rz,l=Math.hypot(tx,tz);return{x,z,dx:tx/l,dz:tz/l}}
 const chair1=new T.Group();chair1.name='casa-luca-cadeira-1';root.add(chair1);prop(chairGeo,'casa-luca-cadeira-de-rodas',chair1)
 const kid1=pessoa('cadeira-1','child-boy',chair1,'#4FB6E8',1.18,()=>({seated:1}));kid1.root.position.set(0,SENTA,.04)
 const mom1=new T.Group();root.add(mom1)
 pessoa('mae-empurra','adult-woman',mom1,'#C2452F',1.67,s=>({speed:.55,distance:s*.55}))

 // 2) ♿ criança na cadeira de rodas EM CIMA do carrossel (nível do chão), o pai segurando a barra e girando devagar
 const chair2=new T.Group();chair2.position.set(1.2,0,0);chair2.rotation.y=Math.PI/2;carousel.add(chair2);prop(chairGeo,'casa-luca-cadeira-de-rodas',chair2)
 const kid2=pessoa('cadeira-2','child-girl',chair2,'#F59A2E',1.2,()=>({seated:1}));kid2.root.position.set(0,SENTA,.04)
 const dad2=new T.Group();dad2.position.set(CR.x+2.75,G0,CR.z+.6);dad2.rotation.y=-Math.PI/2-.3;root.add(dad2)
 pessoa('pai-carrossel','adult-man',dad2,'#1B7A3D',1.76,()=>({}))

 // 3) 🦯 criança com ANDADOR na trilha de texturas, o pai do lado segurando a mão (vai e volta devagar)
 const WK={x0:TR.x0+.6,x1:TR.x1-.6,z:TR.z,v:.28}
 const walker=new T.Group();root.add(walker);prop(walkerGeo,'casa-luca-andador',walker)
 const kid3=new T.Group();root.add(kid3);pessoa('andador','child-girl',kid3,'#7C3AED',1.2,s=>({speed:.3,distance:s*WK.v}))
 const dad3=new T.Group();root.add(dad3);pessoa('pai-mao','older-man',dad3,'#6b7898',1.72,s=>({speed:.3,distance:s*WK.v}))
 const wkAt=(s:number)=>{const L2=WK.x1-WK.x0,p=(s*WK.v)%(2*L2),fwd=p<L2;return{x:fwd?WK.x0+p:WK.x1-(p-L2),dir:fwd?1:-1}}

 // 4) criança no BALANÇO ADAPTADO, a mãe empurrando por trás
 const kid4=pessoa('balanco','child-boy',swingA.pivot,'#3FAE5A',1.18,()=>({seated:1}));kid4.root.position.set(0,swingA.seatY-.27,.02)
 const mom4=new T.Group();mom4.position.set(SW.x-1,G0,SW.z-1.75);root.add(mom4)
 pessoa('mae-balanco','fuller-woman',mom4,'#7C3AED',1.7,()=>({}))

 // extras (fora do modo Leve): crianças na gangorra, no carrossel e na caixa de areia
 if(!leve){
  for(const s of[-1,1]){const g=new T.Group();g.position.set(s*1.6,.08,0);g.rotation.y=s>0?-Math.PI/2:Math.PI/2;seesaw.add(g);pessoa('gangorra'+s,s>0?'child-girl':'child-boy',g,s>0?'#E8503A':'#FFC400',1.2,()=>({seated:1})).root.position.y=-.32}
  const g=new T.Group();g.position.set(-1.1,0,-.4);g.rotation.y=-Math.PI/2;carousel.add(g);pessoa('carrossel','child-boy',g,'#4FB6E8',1.18,()=>({seated:1})).root.position.y=-.22
  const sand=new T.Group();sand.position.set(SB.x+.2,G0,SB.z+1.2);sand.rotation.y=Math.PI;root.add(sand);pessoa('areia','child-girl',sand,'#F2A8B6',1.2,()=>({}))
 }

 const tmp=new T.Vector3()
 let lastSeconds=0
 function update(seconds:number,camera:T.Camera,viewportHeight:number,period='day'){
  lastSeconds=seconds
  // brinquedos
  swingA.pivot.rotation.x=Math.sin(seconds*2.2)*.42
  swingB.pivot.rotation.x=Math.sin(seconds*2.2+1.9)*.12
  carousel.rotation.y=seconds*.45
  seesaw.rotation.z=Math.sin(seconds*1.3)*.17
  for(const p of pinwheels)p.rotation.z=-seconds*p.userData.speed
  // cadeira 1 + mãe
  const a=loopAt(seconds),heading=Math.atan2(a.dx,a.dz)
  chair1.position.set(a.x,G0,a.z);chair1.rotation.y=heading
  mom1.position.set(a.x-a.dx*.95,G0,a.z-a.dz*.95);mom1.rotation.y=heading
  // mãe do balanço: dá o empurrão quando o balanço volta (encosta e recua um pouco)
  mom4.position.z=SW.z-1.75+Math.max(0,-Math.sin(seconds*2.2))*.25
  // andador + pai
  const w=wkAt(seconds),wh=w.dir>0?Math.PI/2:-Math.PI/2
  kid3.position.set(w.x,G0,WK.z);kid3.rotation.y=wh
  walker.position.set(w.x+w.dir*.38,G0,WK.z);walker.rotation.y=wh
  dad3.position.set(w.x-w.dir*.15,G0,WK.z-.75);dad3.rotation.y=wh
  const day=period==='day'
  for(const p of people){p.body.root.getWorldPosition(tmp);const lod=residentVisibility(tmp,p.h,camera,viewportHeight);p.body.update({seconds,...p.frame(seconds),visible:lod.visible&&day,detail:lod.detail})}
  for(const o of props)o.visible=day
  extra?.update(seconds,camera,viewportHeight,period)
 }
 const B={minX:L.x-BX-.3,maxX:L.x+BX+.3,minZ:L.z+BZ0-.3,maxZ:L.z+BZ1+.3}
 const box=(id:string,minX:number,maxX:number,minZ:number,maxZ:number,top:number):SolidoEntorno=>({id,minX,maxX,minZ,maxZ,base:G0,top,footprint:[{x:minX,z:minZ},{x:maxX,z:minZ},{x:maxX,z:maxZ},{x:minX,z:maxZ}]})
 // o lote inteiro é uma peça só pra quem anda na calçada (cerca + prédio): ninguém de fora atravessa o pátio
 const solids:SolidoEntorno[]=[box(L.id,B.minX,B.maxX,B.minZ,B.maxZ,G0+WH+.5+RIDGE),box(L.id+'-patio',L.x-E-.1,L.x+E+.1,L.z+BZ1,L.z+E+.1,G0+1.05)]
 // 💙 06/11: jardim sensorial, piquenique e quadra adaptada (só quando o mapa abriu os quarteirões do sul)
 const extra=areas?criarAreasCasaLuca(parent,{leve,onReady}):undefined;if(extra)solids.push(...extra.solids)
 root.userData.casaLuca={people:()=>people.length+(extra?.people()??0)}
 let disposed=false
 return{root,solids,update,
  inspect:()=>({id:L.id,center:[L.x,L.z],people:people.map(p=>({id:p.id,ready:p.body.inspect().ready,visible:p.body.root.visible})),wheelchairs:2,walker:1,areas:extra?.inspect()??null,seconds:lastSeconds,officialStateWrites:0}),
  dispose(){if(disposed)return;disposed=true;extra?.dispose();people.forEach(p=>p.body.dispose());root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.clear()}}
}
