import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'
import {getLang} from './lang'
import {JARDIM_CASA_LUCA as J,PRACA_CASA_LUCA as P,QUADRA_CASA_LUCA_SUL as Q} from './presidencia-casa-luca-planta'
import type {SolidoEntorno} from './presidencia-complexo-entorno'

/** 💙 06/11 — as áreas novas do complexo da Casa Luca (Diego: *"um pouco maior… cobrindo mais o jardim"*):
 * JARDIM SENSORIAL no gramado da diagonal (canteiros, caminho largo com rampas, bancos, horta elevada, cerca baixa — as 3
 * árvores que já estavam lá ficam), PIQUENIQUE na praça das árvores (mesas com ponta livre pra cadeira de rodas) e, no
 * quarteirão onde estavam as 2 casas, a QUADRA adaptada (tabela baixa, linhas táteis) + estacionamento com vagas de
 * cadeirante e a Kombi azul adaptada com rampa. Faixas de pedestre ligam as 3 áreas pelas ruas que já existiam.
 * Mesmo esquema leve do prédio: o fixo vira 1 malha com cor por vértice, placas em textura de canvas, gente = os civis GLB
 * da cidade (nascem só quando aparecem) e tudo anda pelo relógio da cena. Só visual: nada de compra, save ou dinheiro. */
export function criarAreasCasaLuca(parent:T.Object3D,{leve=false,onReady}:{leve?:boolean;onReady?:()=>void}={}){
 const root=new T.Group();root.name='casa-luca-areas';parent.add(root)
 const en=getLang()==='en'
 const materials:T.Material[]=[],textures:T.Texture[]=[],geometries:T.BufferGeometry[]=[]
 const colored=new T.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0});materials.push(colored)
 const tint=(g:T.BufferGeometry,color:string)=>{const c=new T.Color(color),n=g.getAttribute('position').count,a=new Float32Array(n*3);for(let i=0;i<n;i++)c.toArray(a,i*3);g.setAttribute('color',new T.Float32BufferAttribute(a,3));return g}
 const parts:T.BufferGeometry[]=[]
 const box=(color:string,w:number,h:number,d:number,x:number,y:number,z:number,ry=0)=>{const g=new T.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);g.translate(x,y,z);parts.push(tint(g,color))}
 const cyl=(color:string,r0:number,r1:number,h:number,x:number,y:number,z:number,seg=10,rz=0)=>{const g=new T.CylinderGeometry(r0,r1,h,seg);if(rz)g.rotateZ(rz);g.translate(x,y,z);parts.push(tint(g,color))}
 const ball=(color:string,r:number,x:number,y:number,z:number,sy=1)=>{const g=new T.SphereGeometry(r,10,7);if(sy!==1)g.scale(1,sy,1);g.translate(x,y,z);parts.push(tint(g,color))}
 const ring=(color:string,r:number,t:number,x:number,y:number,z:number)=>{const g=new T.TorusGeometry(r,t,5,24);g.rotateX(Math.PI/2);g.translate(x,y,z);parts.push(tint(g,color))}
 /** laje de A até B (com inclinação, pra rampa) — topo em ay/by */
 const slab=(color:string,ax:number,ay:number,az:number,bx:number,by:number,bz:number,w:number,th=.12)=>{
  const L=Math.hypot(bx-ax,bz-az),pitch=Math.atan2(by-ay,L),g=new T.BoxGeometry(w,th,Math.hypot(L,by-ay))
  g.rotateX(-pitch);g.rotateY(Math.atan2(bx-ax,bz-az));g.translate((ax+bx)/2,(ay+by)/2-th/2,(az+bz)/2);parts.push(tint(g,color))
 }
 const WHITE='#FBF7EC',BLUE='#2F6FD6',NAVY='#1E3F86',SKY='#4FB6E8',TACT='#FFD21F',WOOD='#B98654',GREY='#8b8f93'
 const FLOWERS=['#E8503A','#FFC400','#7C3AED','#F2A8B6','#F59A2E','#4FB6E8','#ffffff']
 /** cerca baixa da Casa Luca (branca com tábuas azuis), a mesma do pátio */
 const fence=(x0:number,z0:number,x1:number,z1:number,y0:number)=>{const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(z1-z0,x1-x0),n=Math.max(1,Math.round(L/1.4))
  for(const h of[.45,.9])box(WHITE,L,.08,.06,(x0+x1)/2,y0+h,(z0+z1)/2,-a)
  for(let i=0;i<=n;i++){const t=i/n;box(i%2?SKY:WHITE,.1,1.05,.1,x0+(x1-x0)*t,y0+.52,z0+(z1-z0)*t)}}
 const gatePosts=(x:number,z:number,y0:number)=>{box(BLUE,.22,1.5,.22,x,y0+.75,z);ball(TACT,.14,x,y0+1.58,z)}
 const bench=(x:number,z:number,y0:number,ry:number)=>{const c=Math.cos(ry),s=Math.sin(ry),at=(lx:number,lz:number)=>[x+lx*c+lz*s,z-lx*s+lz*c] as const
  box(WOOD,1.8,.08,.5,x,y0+.48,z,ry);const [bx,bz]=at(0,-.22);box(WOOD,1.8,.4,.07,bx,y0+.72,bz,ry);for(const dx of[-.7,.7]){const [px,pz]=at(dx,0);box(GREY,.08,.44,.42,px,y0+.22,pz,ry)}}
 const canvasTexture=(w:number,h:number,draw:(g:CanvasRenderingContext2D,cw:number,ch:number)=>void)=>{
  let map:T.Texture
  if(typeof document==='undefined')map=new T.DataTexture(new Uint8Array([47,111,214,255]),1,1)
  else{const c=document.createElement('canvas');c.width=512;c.height=Math.max(32,Math.round(512*h/w));draw(c.getContext('2d')!,c.width,c.height);map=new T.CanvasTexture(c)}
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;textures.push(map);return map
 }
 const heart=(g:CanvasRenderingContext2D,cx:number,cy:number,s:number,fill:string)=>{g.beginPath();g.moveTo(cx,cy+s*.42);g.bezierCurveTo(cx-s*.95,cy-s*.12,cx-s*.55,cy-s*.78,cx,cy-s*.36);g.bezierCurveTo(cx+s*.55,cy-s*.78,cx+s*.95,cy-s*.12,cx,cy+s*.42);g.closePath();g.fillStyle=fill;g.fill()}
 const font=(px:number)=>`900 ${Math.round(px)}px Oswald,"Arial Narrow",Arial,sans-serif`
 const plane=(map:T.Texture,w:number,h:number,name:string,transparent=false)=>{const m=new T.MeshBasicMaterial({map,toneMapped:false,transparent});materials.push(m);const g=new T.PlaneGeometry(w,h);geometries.push(g);const o=new T.Mesh(g,m);o.name=name;root.add(o);return o}
 /** placa "💙 <NOME> · CASA LUCA" em dois postes azuis, virada pra +z (ou girada) */
 const placa=(texto:string,x:number,z:number,y0:number,ry=0)=>{
  const map=canvasTexture(3,.62,(g,cw,ch)=>{g.fillStyle='#FBF7EC';g.beginPath();g.roundRect(3,3,cw-6,ch-6,ch*.2);g.fill();g.lineWidth=6;g.strokeStyle='#1E3F86';g.stroke();heart(g,ch*.5,ch*.55,ch*.62,'#2F6FD6');g.fillStyle='#1E3F86';g.textAlign='left';g.textBaseline='middle';g.font=font(ch*.34);g.fillText(texto,ch*.95,ch*.36,cw-ch*1.1);g.font=font(ch*.24);g.fillStyle='#2F6FD6';g.fillText('CASA LUCA',ch*.95,ch*.74,cw-ch*1.1)})
  const c=Math.cos(ry),s=Math.sin(ry)
  for(const d of[-1.35,1.35])box(BLUE,.1,1.9,.1,x+d*c,y0+.95,z-d*s)
  const o=plane(map,3,.62,'casa-luca-placa');o.position.set(x+.06*s,y0+1.55,z+.06*c);o.rotation.y=ry
  const back=plane(map,3,.62,'casa-luca-placa');back.position.set(x-.06*s,y0+1.55,z-.06*c);back.rotation.y=ry+Math.PI
 }
 const pinwheels:T.Object3D[]=[]
 const blades=(()=>{const list:T.BufferGeometry[]=[],cols=['#E8503A','#FFD21F','#4FB6E8','#3FAE5A']
  for(let i=0;i<4;i++){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,.42,.05,0,.12,.36,0],3));g.setIndex([0,1,2,0,2,1]);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1],2));g.rotateZ(i*Math.PI/2);list.push(tint(g,cols[i]))}
  const g=mergeGeometries(list)!;list.forEach(p=>p.dispose());geometries.push(g);return g})()
 const pinwheel=(x:number,z:number,y0:number,ry:number)=>{cyl(WHITE,.03,.03,1.6,x,y0+.8,z,6);const p=new T.Mesh(blades,colored);p.name='casa-luca-cata-vento';p.position.set(x,y0+1.65,z);p.rotation.y=ry;p.userData.speed=2.2+pinwheels.length%3*.6;root.add(p);pinwheels.push(p)}

 // ═══ 1) JARDIM SENSORIAL (gramado da diagonal, chão y −0,24) ═══
 const g0=J.chao,top=g0+.12,[c0,c1,c2,c3]=J.poligono
 // caminho acessível largo (1,8 m) com piso tátil no meio: entra pelo portão leste do pátio (rampa descendo do pátio),
 // contorna as árvores e sai por outra rampa até a calçada da rua de baixo
 const CAM='#e8dfca'
 slab(CAM,-130.4,.17,165.7,-126.5,top,165.7,1.8)
 slab(CAM,-126.5,top,164.8,-126.5,top,172.4,1.8)
 slab(CAM,-127.4,top,171.5,-110.4,top,171.5,1.8)
 slab(CAM,-118,top,172.4,-118,.17,174.1,1.8)
 for(const [ax,az,bx,bz] of [[-126.5,165.2,-126.5,171.5],[-126.5,171.5,-111,171.5]] as const)slab(TACT,ax,top+.015,az,bx,top+.015,bz,.32,.03)
 // corrimão baixo nas duas rampas
 for(const s of[-1,1]){slab(NAVY,-130.2,.17+.85,165.7+s*1,-126.6,top+.85,165.7+s*1,.06,.06);slab(NAVY,-118+s*1,top+.85,172.5,-118+s*1,.17+.85,174,.06,.06)
  for(const t of[0,.5,1]){const x=-130.2+3.6*t,y=.17+(top-.17)*t;cyl(NAVY,.035,.035,.85,x,y+.42,165.7+s*1,6)}
  for(const t of[0,1]){const z=172.5+1.5*t,y=top+(.17-top)*t;cyl(NAVY,.035,.035,.85,-118+s*1,y+.42,z,6)}}
 // canteiros redondos (borda de madeira, terra e flores coloridas) — longe das árvores e do caminho
 ;([[-124,163.2,1],[-117,169.1,.9],[-128.5,169.4,.7],[-120.5,173.2,.55],[-110,173.25,.5],[-118.6,166,.75]] as const).forEach(([x,z,r],k)=>{
  cyl(WOOD,r+.1,r+.12,.32,x,g0+.16,z,14);cyl('#6b4b2e',r,r,.04,x,g0+.32,z,14)
  for(let i=0;i<Math.round(r*9);i++){const a=i*2.39996+k,d=Math.sqrt((i+.5)/(r*9))*r*.85;ball(FLOWERS[(i+k)%FLOWERS.length],.13,x+Math.cos(a)*d,g0+.42,z+Math.sin(a)*d,.8)}
  ball('#4f8a3e',r*.45,x,g0+.38,z,.5)
 })
 // horta elevada (na altura de quem está sentado) com alfaces e cenouras
 box(WOOD,1.3,.78,2.6,-127.8,g0+.39,159.6);box('#6b4b2e',1.1,.06,2.4,-127.8,g0+.8,159.6)
 for(let i=0;i<6;i++)ball(i%2?'#7cc04a':'#5fa83b',.17,-128.1+(i%2)*.55,g0+.88,158.7+Math.floor(i/2)*.85,.7)
 for(let i=0;i<3;i++)cyl('#F59A2E',.04,.0,.18,-127.55,g0+.92,158.7+i*.85,6)
 // bancos de frente pro caminho
 bench(-118.6,170.15,g0,0);bench(-123.6,170.15,g0,0)
 // cerca baixa: do lado da avenida (com folga) e embaixo, com o portão da rampa
 fence(c0.x,c0.z,c1.x,c1.z,g0);fence(c1.x,c1.z,c2.x,c2.z,g0);fence(c3.x+.3,c3.z-.15,-119.2,c3.z-.15,g0);fence(-116.8,c3.z-.15,c2.x-1.2,c3.z-.15,g0)
 gatePosts(-119.15,c3.z-.15,g0);gatePosts(-116.85,c3.z-.15,g0)
 {const at=(a:{x:number;z:number},b:{x:number;z:number},t:number)=>[a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t] as const,face=Math.atan2(c2.x-c1.x,c2.z-c1.z)-Math.PI/2
  for(const [x,z] of [at(c0,c1,.3),at(c1,c2,.38),at(c1,c2,.78)])pinwheel(x,z,g0,face)}
 placa(en?'SENSORY GARDEN':'JARDIM SENSORIAL',-113.4,173.55,g0)

 // ═══ 2) PIQUENIQUE (a praça das árvores: árvores, banco e caminhos continuam) ═══
 const pg=-.05,PH=P.half-.25
 // mesas acessíveis: uma ponta SEM banco e com o tampo comprido, pra cadeira de rodas encaixar
 const mesa=(x:number,z:number,ry:number)=>{const c=Math.cos(ry),s=Math.sin(ry),at=(lx:number,lz:number)=>[x+lx*c+lz*s,z-lx*s+lz*c] as const
  box(WOOD,2.4,.08,.9,x,pg+.76,z,ry);for(const lx of[-.85,.6]){const [px,pz]=at(lx,0);box(BLUE,.1,.72,.7,px,pg+.36,pz,ry)}
  for(const lz of[-.75,.75]){const [bx,bz]=at(-.35,lz);box(WOOD,1.5,.07,.34,bx,pg+.45,bz,ry);for(const lx of[-.95,.25]){const [px,pz]=at(lx,lz);box(GREY,.07,.42,.07,px,pg+.21,pz,ry)}}
  const [mx,mz]=at(1.1,0);box(BLUE,.9,.02,.9,mx,pg+.012,mz,ry) // vaga da cadeira marcada no chão
 }
 mesa(-136.4,187.4,0);mesa(-145.8,189.2,0);mesa(-146.2,196.8,Math.PI)
 // toalha xadrez e lanche na primeira mesa
 box('#E8503A',1.2,.012,.7,-136.6,pg+.81,187.4);ball('#F59A2E',.09,-136.8,pg+.86,187.3);ball('#3FAE5A',.08,-136.3,pg+.86,187.5);cyl(WHITE,.06,.05,.16,-137.1,pg+.89,187.6,8)
 // cerca baixa em volta da praça com as 4 entradas abertas (onde já chegavam os caminhos)
 for(const s of[-1,1]){
  fence(P.x-PH,P.z+s*PH,P.x-1.6,P.z+s*PH,pg);fence(P.x+1.6,P.z+s*PH,P.x+PH,P.z+s*PH,pg)
  fence(P.x+s*PH,P.z-PH,P.x+s*PH,P.z-1.6,pg);fence(P.x+s*PH,P.z+1.6,P.x+s*PH,P.z+PH,pg)
  for(const d of[-1.6,1.6]){gatePosts(P.x+d,P.z+s*PH,pg);gatePosts(P.x+s*PH,P.z+d,pg)}
 }
 placa(en?'PICNIC':'PIQUENIQUE',P.x-5.6,P.z-PH+.55,pg,0)
 pinwheel(P.x+PH,P.z-6,pg,Math.PI/2);pinwheel(P.x-PH,P.z+6,pg,-Math.PI/2)

 // ═══ 3) QUADRA ADAPTADA + ESTACIONAMENTO (o quarteirão das 2 casas; chão do quarteirão y 0,16) ═══
 const qg=.16,QX=Q.x,CZ=Q.z-5.5,CW=18,CD=9.4
 box('#3f8f6a',CW+1.2,.03,CD+1.2,QX,qg+.015,CZ) // borda verde
 box(BLUE,CW,.035,CD,QX,qg+.02,CZ)
 // linhas: contorno, meio, círculo e o garrafão; as faixas táteis (amarelas, em relevo) do goalball cruzam a quadra
 const L2=(w:number,d:number,x:number,z:number)=>box(WHITE,w,.01,d,x,qg+.042,z)
 L2(CW,.08,QX,CZ-CD/2+.05);L2(CW,.08,QX,CZ+CD/2-.05);L2(.08,CD,QX-CW/2+.05,CZ);L2(.08,CD,QX+CW/2-.05,CZ);L2(.08,CD,QX,CZ)
 ring(WHITE,1.5,.04,QX,qg+.04,CZ)
 for(const s of[-1,1]){L2(.08,3.6,QX+s*(CW/2-4),CZ);L2(4,.08,QX+s*(CW/2-2),CZ-1.8);L2(4,.08,QX+s*(CW/2-2),CZ+1.8)
  box(TACT,.12,.03,CD-.4,QX+s*3,qg+.05,CZ)}
 // tabela BAIXA (aro a 2,3 m) nas duas pontas, com protetor azul no poste
 for(const s of[-1,1]){const px=QX+s*(CW/2+.35)
  cyl(GREY,.08,.08,2.9,px,qg+1.45,CZ,8);cyl(BLUE,.17,.17,1.2,px,qg+.6,CZ,10)
  box(WHITE,.06,1.05,1.6,px-s*.15,qg+2.65,CZ);box(BLUE,.07,.42,.55,px-s*.19,qg+2.55,CZ)
  ring('#F07A21',.24,.025,px-s*.48,qg+2.3,CZ)}
 ;[['#F07A21',.12,QX-4.5,CZ+1.2],['#2F6FD6',.12,QX+2,CZ-2.6],['#F07A21',.12,QX+6,CZ+2.4]].forEach(([c,r,x,z])=>ball(c as string,r as number,x as number,qg+.16,z as number))
 // estacionamento: 4 vagas de cadeirante (azuis, 2,6 m) com faixa zebrada entre elas, de bico pra quadra
 const VZ0=Q.z+1.8,vagas=[-120.2,-115,-109.8,-104.6]
 box('#55595e',Q.half*2-.6,.02,Q.z+Q.half-VZ0-.3,QX,qg+.01,(VZ0+Q.z+Q.half-.3)/2)
 const isa=canvasTexture(1,1,(g,cw,ch)=>{g.fillStyle='#2F6FD6';g.fillRect(0,0,cw,ch);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=cw*.07;g.lineCap='round'
  g.beginPath();g.arc(cw*.47,ch*.22,cw*.07,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(cw*.45,ch*.32);g.lineTo(cw*.45,ch*.55);g.lineTo(cw*.68,ch*.55);g.lineTo(cw*.76,ch*.76);g.stroke()
  g.beginPath();g.arc(cw*.45,ch*.62,cw*.2,Math.PI*.65,Math.PI*2.1);g.stroke()})
 for(const vx of vagas){box(BLUE,2.6,.012,5,vx,qg+.025,VZ0+2.5);const s=plane(isa,1.4,1.4,'casa-luca-vaga');s.rotation.x=-Math.PI/2;s.position.set(vx,qg+.035,VZ0+3.2)
  if(vx<vagas[3])for(let k=0;k<5;k++)box(WHITE,1.1,.01,.12,vx+1.9,qg+.03,VZ0+.5+k*1,Math.PI/4)}
 // cerca baixa em volta do quarteirão com 3 portões: norte (faixa pro jardim), oeste (faixa pro piquenique) e a entrada dos carros no sul
 const QH=Q.half-.2,qx0=QX-QH,qx1=QX+QH,qz0=Q.z-QH,qz1=Q.z+QH
 fence(qx0,qz0,-118.7,qz0,qg);fence(-116.3,qz0,qx1,qz0,qg);gatePosts(-118.65,qz0,qg);gatePosts(-116.35,qz0,qg)
 fence(qx0,qz0,qx0,Q.z-1.2,qg);fence(qx0,Q.z+1.2,qx0,qz1,qg);gatePosts(qx0,Q.z-1.15,qg);gatePosts(qx0,Q.z+1.15,qg)
 fence(qx1,qz0,qx1,qz1,qg);fence(qx0,qz1,-122,qz1,qg);fence(-101.5,qz1,qx1,qz1,qg)
 placa(en?'ADAPTED COURT':'QUADRA ADAPTADA',-108,qz0+.3,qg,0)
 pinwheel(qx1,Q.z-3,qg,Math.PI/2);pinwheel(qx1,Q.z+5,qg,Math.PI/2)

 // ═══ 4) FAIXAS DE PEDESTRE entre as áreas (só pintura em cima das ruas que já existiam; asfalto em y 0) ═══
 const zebra=(ax:number,az:number,bx:number,bz:number,w=2.6)=>{const L=Math.hypot(bx-ax,bz-az),ang=Math.atan2(bx-ax,bz-az);for(let d=.45;d<L-.2;d+=.85){const t=d/L;box(WHITE,w,.008,.4,ax+(bx-ax)*t,.006,az+(bz-az)*t,ang)}}
 zebra(-142,175.6,-142,181.4);zebra(-117.5,175.6,-117.5,181.4);zebra(-130.4,193,-124.6,193)

 const fixed=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());parts.length=0;geometries.push(fixed)
 const mesh=new T.Mesh(fixed,colored);mesh.name='casa-luca-areas-fixo';mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh)

 // ═══ VEÍCULOS: Kombi azul adaptada (rampa lateral baixada) + um carro na outra vaga ═══
 const library=criarBibliotecaVeiculos(),vans:{root:T.Object3D}[]=[],solids:SolidoEntorno[]=[]
 const kombi=library.create('kombi')
 const solid=(id:string,minX:number,maxX:number,minZ:number,maxZ:number,base:number,topY:number):SolidoEntorno=>({id,minX,maxX,minZ,maxZ,base,top:topY,footprint:[{x:minX,z:minZ},{x:maxX,z:minZ},{x:maxX,z:maxZ},{x:minX,z:maxZ}]})
 if(kombi){const vx=vagas[0],vz=VZ0+2.6;kombi.root.position.set(vx,qg,vz);kombi.root.rotation.y=Math.PI;kombi.root.name='casa-luca-kombi';root.add(kombi.root);vans.push(kombi)
  const b:T.BufferGeometry[]=[],k=(c:string,w:number,h:number,d:number,x:number,y:number,z:number,rz=0)=>{const g=new T.BoxGeometry(w,h,d);if(rz)g.rotateZ(rz);g.translate(x,y,z);b.push(tint(g,c))}
  // rampa baixada do lado da vaga zebrada + o símbolo na porta
  const hw=kombi.profile.width/2;k('#c9ced6',1.9,.05,1,vx+hw+.9,qg+.28,vz,-.28);k(TACT,.08,.06,1,vx+hw+1.8,qg+.05,vz)
  const g=mergeGeometries(b)!;b.forEach(p=>p.dispose());geometries.push(g);const ramp=new T.Mesh(g,colored);ramp.name='casa-luca-kombi-rampa';ramp.castShadow=true;root.add(ramp)
  const sym=plane(isa,.62,.62,'casa-luca-kombi-simbolo');sym.position.set(vx+hw+.02,qg+1.25,vz-.9);sym.rotation.y=Math.PI/2
  solids.push(solid('casa-luca-kombi',vx-hw-.1,vx+hw+.1,vz-kombi.profile.length/2-.1,vz+kombi.profile.length/2+.1,qg,qg+kombi.profile.height))}
 const car=library.create('civic');if(car){car.root.position.set(vagas[3],qg,VZ0+2.6);car.root.rotation.y=Math.PI;car.root.name='casa-luca-carro';root.add(car.root);vans.push(car)}

 // ═══ GENTE (as mesmas peças do prédio: cadeira de rodas e andador simples, civis GLB da cidade) ═══
 const chairGeo=(()=>{const b:T.BufferGeometry[]=[],add=(g:T.BufferGeometry,c:string,x:number,y:number,z:number,ry=0,rx=0)=>{if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);g.translate(x,y,z);b.push(tint(g,c))}
  for(const s of[-1,1]){add(new T.TorusGeometry(.29,.035,6,18),'#2b2f36',s*.31,.31,-.04,Math.PI/2);add(new T.TorusGeometry(.24,.015,5,16),'#c9ced6',s*.35,.31,-.04,Math.PI/2)
   add(new T.BoxGeometry(.03,.03,.6),'#c9ced6',s*.25,.44,.02);add(new T.BoxGeometry(.03,.5,.03),'#c9ced6',s*.25,.62,-.22,0,-.15);add(new T.BoxGeometry(.04,.04,.14),'#1b1b1b',s*.25,.86,-.3)
   add(new T.CylinderGeometry(.07,.07,.04,10).rotateZ(Math.PI/2),'#2b2f36',s*.22,.07,.33);add(new T.BoxGeometry(.03,.32,.03),'#c9ced6',s*.22,.25,.3);add(new T.BoxGeometry(.12,.02,.16),'#1b1b1b',s*.12,.14,.36)}
  add(new T.BoxGeometry(.48,.06,.42),BLUE,0,.44,.02);add(new T.BoxGeometry(.48,.42,.05),BLUE,0,.66,-.21,0,-.12)
  const g=mergeGeometries(b)!;b.forEach(p=>p.dispose());geometries.push(g);return g})()
 const walkerGeo=(()=>{const b:T.BufferGeometry[]=[]
  for(const sx of[-1,1])for(const sz of[0,1]){const leg=new T.CylinderGeometry(.02,.02,.72,6);leg.translate(sx*.27,.36,sz*.42);b.push(tint(leg,'#c9ced6'));const f=new T.SphereGeometry(.05,8,6);f.translate(sx*.27,.04,sz*.42);b.push(tint(f,sz?'#E8503A':'#2b2f36'))}
  for(const sx of[-1,1]){const h=new T.CylinderGeometry(.03,.03,.5,8);h.rotateX(Math.PI/2);h.translate(sx*.27,.72,.21);b.push(tint(h,TACT))}
  const g=mergeGeometries(b)!;b.forEach(p=>p.dispose());geometries.push(g);return g})()
 type Ator={id:string;body:ReturnType<typeof createCivilian>;h:number;frame:(s:number)=>{seated?:number;speed?:number;distance?:number}}
 const people:Ator[]=[],props:T.Object3D[]=[],movers:((s:number)=>void)[]=[]
 const group=(x:number,y:number,z:number,ry=0,parentObj:T.Object3D=root)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;parentObj.add(g);return g}
 const pessoa=(id:string,variant:string,at:T.Object3D,outfit:string,h:number,frame:Ator['frame']=()=>({}))=>{const body=createCivilian(at,{id:'casa-luca-'+id,variant,outfitColor:outfit,deferUntilVisible:true,onReady});people.push({id,body,h,frame});return body}
 const prop=(geo:T.BufferGeometry,name:string,at:T.Object3D)=>{const o=new T.Mesh(geo,colored);o.name=name;o.castShadow=true;at.add(o);props.push(o);return o}
 const cadeirante=(id:string,variant:string,outfit:string,at:T.Object3D)=>{prop(chairGeo,'casa-luca-cadeira-de-rodas',at);const b=pessoa(id,variant,at,outfit,1.18,()=>({seated:1}));b.root.position.set(0,.12,.04);return b}
 const sentado=(id:string,variant:string,outfit:string,x:number,y:number,z:number,ry:number,h:number,lift=0)=>{const g=group(x,y+lift,z,ry);pessoa(id,variant,g,outfit,h,()=>({seated:1}))}

 // jardim: criança com ANDADOR no caminho, a mãe do lado segurando a mão (vai e volta devagar)
 {const x0=-124.6,x1=-112.6,v=.26,z=171.5,kid=group(0,top,z),walker=group(0,top,z),mom=group(0,top,z+.75)
  prop(walkerGeo,'casa-luca-andador',walker);pessoa('jardim-andador','child-boy',kid,'#F59A2E',1.18,s=>({speed:.3,distance:s*v}));pessoa('jardim-mae-mao','adult-woman',mom,'#7C3AED',1.67,s=>({speed:.3,distance:s*v}))
  movers.push(s=>{const L=x1-x0,p=(s*v)%(2*L),fwd=p<L,x=fwd?x0+p:x1-(p-L),h=fwd?Math.PI/2:-Math.PI/2,d=fwd?1:-1;kid.position.x=x;kid.rotation.y=h;walker.position.x=x+d*.38;walker.rotation.y=h;mom.position.x=x-d*.15;mom.rotation.y=h})}
 // jardim: criança em cadeira de rodas mexendo na HORTA, o pai ao lado
 cadeirante('jardim-horta','child-girl','#3FAE5A',group(-126.55,g0,159.4,-Math.PI/2))
 pessoa('jardim-pai-horta','adult-man',group(-126.2,g0,161.2,-Math.PI*.8),'#1B7A3D',1.76)
 // piquenique: cadeira de rodas EMPURRADA pelo pai no caminho da praça (norte ↔ sul)
 {const chair=group(P.x,.16,0),dad=group(P.x,.16,0),z0=P.z-8.5,z1=P.z+8.5,v=.5;cadeirante('praca-cadeira','child-boy','#E8503A',chair);pessoa('praca-pai-empurra','older-man',dad,'#6b7898',1.72,s=>({speed:.5,distance:s*v}))
  movers.push(s=>{const L=z1-z0,p=(s*v)%(2*L),fwd=p<L,z=fwd?z0+p:z1-(p-L),d=fwd?1:-1,h=fwd?0:Math.PI;chair.position.z=z;chair.rotation.y=h;dad.position.z=z-d*.95;dad.rotation.y=h})}
 // piquenique: na mesa de toalha, criança de cadeira de rodas na ponta livre e a mãe sentada
 cadeirante('praca-mesa','child-girl','#4FB6E8',group(-135.1,pg,187.4,-Math.PI/2))
 sentado('praca-mae-mesa','adult-woman','#C2452F',-136.7,pg,188.15,Math.PI,1.67)
 // quadra: criança de cadeira de rodas arremessando na tabela baixa (vai e volta devagar no garrafão), o pai no fundo
 {const chair=group(0,qg+.035,CZ+.6,-Math.PI/2);cadeirante('quadra-cadeira','child-boy','#FFC400',chair);movers.push(s=>{chair.position.x=QX-CW/2+3.4+Math.sin(s*.45)*1.1})}
 pessoa('quadra-pai','fuller-man',group(QX-CW/2+4.2,qg+.035,CZ-2.6,-Math.PI*.7),'#2F6FD6',1.76)
 // estacionamento: criança descendo a rampa da Kombi com a mãe
 if(kombi){const hw=kombi.profile.width/2;cadeirante('kombi-cadeira','child-girl','#F2A8B6',group(vagas[0]+hw+2.15,qg,VZ0+2.6,Math.PI/2));pessoa('kombi-mae','adult-woman',group(vagas[0]+hw+2.2,qg,VZ0+1.5,Math.PI*.9),'#1B7A3D',1.67)}
 if(!leve){
  pessoa('jardim-canteiro','child-girl',group(-118.6,g0,167.15,Math.PI),'#E8503A',1.2)
  sentado('praca-pai-mesa2','adult-man','#734d6e',-145.7,pg,188.45,0,1.76);sentado('praca-filho-mesa2','child-boy','#FFC400',-146.4,pg,189.95,Math.PI,1.18,.14)
  pessoa('quadra-amigo','child-boy',group(QX-1,qg+.035,CZ+1.4,-Math.PI/2),'#3FAE5A',1.18)
 }

 const tmp=new T.Vector3()
 function update(seconds:number,camera:T.Camera,viewportHeight:number,period='day'){
  for(const p of pinwheels)p.rotation.z=-seconds*p.userData.speed
  for(const m of movers)m(seconds)
  const day=period==='day'
  for(const p of people){p.body.root.getWorldPosition(tmp);const lod=residentVisibility(tmp,p.h,camera,viewportHeight);p.body.update({seconds,...p.frame(seconds),visible:lod.visible&&day,detail:lod.detail})}
  for(const o of props)o.visible=day
 }
 // sólidos baixos: as tabelas e a Kombi (o resto é chão, cerca baixa e canteiro)
 for(const s of[-1,1])solids.push(solid('casa-luca-tabela'+s,QX+s*(CW/2+.35)-.2,QX+s*(CW/2+.35)+.2,CZ-.8,CZ+.8,qg,qg+3.2))
 let disposed=false
 return{root,solids,update,people:()=>people.length,
  inspect:()=>({areas:['jardim','piquenique','quadra'],people:people.map(p=>({id:p.id,ready:p.body.inspect().ready,visible:p.body.root.visible})),vehicles:vans.length}),
  dispose(){if(disposed)return;disposed=true;people.forEach(p=>p.body.dispose());vans.forEach(v=>v.root.removeFromParent());library.dispose();root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.clear()}}
}
