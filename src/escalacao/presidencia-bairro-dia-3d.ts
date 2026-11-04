// 🇧🇷 O DIA INTEIRO DO BAIRRO no mapa 3D (04/11, 2ª leva das tradições — regras em presidencia-bairro-tradicoes.ts):
//  🌅 manhã: padaria com gente tomando café em pé no balcão · bicicleta do pão · Kombi do gás dando a volta no quarteirão;
//  ☀️ tarde: varal com roupa (uma camisa nas cores do clube) · carrinho de sorvete e de pipoca na praça · dominó dos senhores;
//  🌙 noite: espetinho na brasa na esquina · trailer do podrão · cadeira de praia na calçada · TV ligada no Boteco do Oswaldo;
//  🏟️ dia de jogo em casa: camelô de camisa pirata na porta do estádio · churrasquinho de gato com fumacinha · flanelinha.
// Custo: as peças paradas de cada cena num InstancedMesh (um cubo e um cilindro compartilhados, cor por instância); Kombi e
// bicicleta são UMA malha mesclada cada (cor no vértice); UMA textura de canvas (atlas 512×512 com letreiros, listras e a TV);
// nenhuma luz e nenhuma sombra nova (a brasa e a TV brilham pelo material). Tudo anda no `update` que o mapa já chama no quadro
// dele — sem toque (VIVO_MS) o mapa para e o bairro para junto. Quem chama embrulha em try/catch (criarTradicoesBairroSeguro).
import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {LUGARES_DIA_DE_JOGO,poseNaVolta,type LugaresBairro,type VidaBairro} from './presidencia-bairro-tradicoes'
import {getLang} from './lang'

type P={x:number;z:number}
export type VistaDiaBairro='padaria'|'praca-bairro'|'espetinho'|'jogo-bairro'|'varal'|'flanelinha'|'cadeiras'
type Cena='manha'|'tarde'|'noite'|'jogo'
type Pose={x:number;y:number;z:number;heading:number;speed:number;distance:number;seated:number}
type Pessoa={body:ReturnType<typeof createCivilian>;cena:Cena;semSombra:boolean;pose:(s:number)=>Pose}

const ESTRADA_Y=.01,QUADRA_Y=.16,PRACA_Y=-.04,ESTADIO_Y=.16
const FONTE='"Oswald","Arial Narrow",Impact,sans-serif'
const KOMBI_V=2.2,BIKE_V=3.1 // m/s: a Kombi anda devagar (o gás passa tocando), a bicicleta um pouco mais rápido
const ROUPAS=['#e8503a','#2F6FB5','#FFC400','#ffffff','#7C3AED','#1B7A3D','#f2a0c0','#f39a1e','#16a3b8']
// Faixas do atlas (512 × 64 cada): letreiros, listras dos toldos e a tela da TV
const F={padaria:0,podrao:1,sorvete:2,pipoca:3,espetinho:4,listraVermelha:5,listraAzul:6,tv:7} as const

export function criarDiaDoBairro(root:THREE.Group,input:{lugares:LugaresBairro;boteco?:THREE.Vector3;onReady:()=>void}){
 const L=input.lugares
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
 const own=<G extends THREE.BufferGeometry>(g:G)=>{geometries.add(g);return g}
 const mat=<M extends THREE.Material>(m:M)=>{materials.add(m);return m}
 const unit=own(new THREE.BoxGeometry(1,1,1)),cil=own(new THREE.CylinderGeometry(.5,.5,1,10)),bola=own(new THREE.IcosahedronGeometry(1,1))
 const branco=mat(new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85}))
 const brasaMat=mat(new THREE.MeshStandardMaterial({color:'#ff6a1a',emissive:'#ff4a0a',emissiveIntensity:1.6,roughness:.9}))
 const lampadaMat=mat(new THREE.MeshStandardMaterial({color:'#fff1c4',emissive:'#ffd27a',emissiveIntensity:1.4,roughness:.5})) // lâmpada pendurada: brilha pelo material, sem luz nova
 const fumacaMat=mat(new THREE.MeshStandardMaterial({color:'#d9d6cf',roughness:1,transparent:true,opacity:.42,depthWrite:false}))
 const t=new THREE.Object3D(),cor=new THREE.Color()

 // ── atlas: uma textura só pra todos os letreiros, as duas lonas listradas e a tela da TV ──────────────────────────────
 const atlasCanvas=document.createElement('canvas');atlasCanvas.width=512;atlasCanvas.height=512
 const atlas=new THREE.CanvasTexture(atlasCanvas);atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=4
 let atlasLang=''
 const desenhaAtlas=()=>{
  const g=atlasCanvas.getContext('2d');if(!g)return
  const en=getLang()==='en';atlasLang=getLang()
  // `meia` = a placa ocupa só a metade esquerda da faixa (placa curtinha de carrinho, sem esticar a letra)
  const placa=(faixa:number,fundo:string,tinta:string,txt:string,borda='#0C0C0C',meia=false)=>{const y=faixa*64,W=meia?256:512;g.fillStyle=fundo;g.fillRect(0,y,W,64);g.strokeStyle=borda;g.lineWidth=6;g.strokeRect(3,y+3,W-6,58);g.fillStyle=tinta;g.font=`900 ${meia?44:40}px ${FONTE}`;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,W/2,y+35,W-32)}
  placa(F.padaria,'#FFC400','#7a2e12',en?'BAKERY · FRESH BREAD':'PADARIA · PÃO QUENTINHO')
  placa(F.podrao,'#C2452F','#FFC400',en?'LATE-NIGHT BURGERS':'PODRÃO · X-TUDO')
  placa(F.sorvete,'#ffffff','#2F6FB5',en?'ICE CREAM':'SORVETE','#2F6FB5',true)
  placa(F.pipoca,'#C2452F','#ffffff',en?'POPCORN':'PIPOCA','#0C0C0C',true)
  placa(F.espetinho,'#0C0C0C','#FFC400',en?'SKEWERS ON THE GRILL':'ESPETINHO NA BRASA','#FFC400')
  for(const [faixa,c] of [[F.listraVermelha,'#C2452F'],[F.listraAzul,'#2F6FB5']] as const)for(let i=0;i<16;i++){g.fillStyle=i%2?'#ffffff':c;g.fillRect(i*32,faixa*64,32,64)}
  // 📺 a TV: o verde do gramado com as faixas e as linhas (sem placar, sem nome de ninguém — não dá spoiler)
  const y=F.tv*64;g.fillStyle='#0c0c0c';g.fillRect(0,y,512,64);for(let i=0;i<6;i++){g.fillStyle=i%2?'#2f9a46':'#3aae52';g.fillRect(i*19.5,y,19.5,64)}
  g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=2;g.strokeRect(6,y+6,105,52);g.beginPath();g.moveTo(58.5,y+6);g.lineTo(58.5,y+58);g.stroke();g.beginPath();g.arc(58.5,y+32,9,0,Math.PI*2);g.stroke()
  g.fillStyle='#ffffff';g.beginPath();g.arc(80,y+40,2.5,0,Math.PI*2);g.fill();for(const [x,yy,c] of [[40,26,'#e8503a'],[66,36,'#e8503a'],[88,30,'#ffffff'],[30,40,'#ffffff']] as const){g.fillStyle=c;g.fillRect(x,y+yy,3,5)}
  atlas.needsUpdate=true
 }
 desenhaAtlas()
 const atlasMat=mat(new THREE.MeshStandardMaterial({map:atlas,roughness:.9,side:THREE.DoubleSide}))
 const tvMat=mat(new THREE.MeshStandardMaterial({map:atlas,emissiveMap:atlas,emissive:'#ffffff',emissiveIntensity:.9,roughness:.6}))
 const planoAtlas=(faixa:number,u0=0,u1=1)=>{const g=own(new THREE.PlaneGeometry(1,1)),uv=g.getAttribute('uv') as THREE.BufferAttribute,v0=1-(faixa+1)/8,v1=1-faixa/8;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)?u1:u0,uv.getY(i)?v1-.004:v0+.004);uv.needsUpdate=true;return g}
 const placa=(parent:THREE.Object3D,name:string,faixa:number,x:number,y:number,z:number,w:number,h:number,yaw:number,pitch=0,material:THREE.Material=atlasMat,u1=1)=>{const m=new THREE.Mesh(planoAtlas(faixa,0,u1),material);m.name=name;m.position.set(x,y,z);m.rotation.set(pitch,yaw,0,'YXZ');m.scale.set(w,h,1);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m}

 // ── peças paradas: um InstancedMesh por cena e por geometria ─────────────────────────────────────────────────────────
 type Peca={x:number;y:number;z:number;w:number;h:number;d:number;yaw?:number;pitch?:number;roll?:number;c:string}
 const lote=(parent:THREE.Object3D,name:string,pecas:readonly Peca[],geometry:THREE.BufferGeometry=unit,material:THREE.Material=branco)=>{
  if(!pecas.length)return
  const m=new THREE.InstancedMesh(geometry,material,pecas.length);m.name=name;m.castShadow=false;m.receiveShadow=true
  pecas.forEach((b,i)=>{t.position.set(b.x,b.y,b.z);t.rotation.set(b.pitch??0,b.yaw??0,b.roll??0,'YXZ');t.scale.set(b.w,b.h,b.d);t.updateMatrix();m.setMatrixAt(i,t.matrix);m.setColorAt(i,cor.set(b.c))})
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();parent.add(m);return m
 }
 /** ajudante: peças num referencial local (origem o, yaw) */
 const local=(o:P,yaw:number,y0:number)=>{const fx=Math.sin(yaw),fz=Math.cos(yaw),sx=Math.cos(yaw),sz=-Math.sin(yaw)
  return{at:(s:number,f:number)=>({x:o.x+sx*s+fx*f,z:o.z+sz*s+fz*f}),peca:(s:number,f:number,y:number,w:number,h:number,d:number,c:string,extra:Partial<Peca>={}):Peca=>({x:o.x+sx*s+fx*f,y:y0+y,z:o.z+sz*s+fz*f,w,h,d,c,yaw:yaw+(extra.yaw??0),pitch:extra.pitch,roll:extra.roll})}}
 const cenas:Record<Cena,THREE.Group>={manha:new THREE.Group(),tarde:new THREE.Group(),noite:new THREE.Group(),jogo:new THREE.Group()}
 for(const [k,g] of Object.entries(cenas)){g.name='bairro-dia-'+k;g.visible=false;root.add(g)}

 const pessoas:Pessoa[]=[]
 const pessoa=(id:string,cena:Cena,variant:string,roupa:string|undefined,pose:Pessoa['pose'])=>pessoas.push({cena,pose,semSombra:false,
  body:createCivilian(root,{deferUntilVisible:true,id:'bairro-dia-'+id,variant,outfitColor:roupa,onReady:input.onReady})})
 const parado=(x:number,y:number,z:number,heading:number,seated=0)=>()=>({x,y,z,heading,speed:0,distance:0,seated})

 // 🥖 PADARIA (manhã) ─────────────────────────────────────────────────────────────────────────────────────────────────
 if(L.padaria){
  const p=L.padaria,o={x:p.x,z:p.frente},l=local(o,0,QUADRA_Y),pecas:Peca[]=[],cil1:Peca[]=[]
  // a porta de aço de enrolar aberta (o rolo em cima), a vitrine dos pães e o balcão de fórmica pra fora, na calçada
  pecas.push(l.peca(0,.05,1.15,2.6,2.3,.06,'#3a2a20'))                       // vão escuro da loja
  pecas.push(l.peca(0,.12,2.42,2.9,.26,.26,'#9aa0a3'))                        // rolo da porta de aço
  pecas.push(l.peca(-1.95,.08,.62,1.1,1.2,.1,'#efe6cf'),l.peca(1.95,.08,.62,1.1,1.2,.1,'#efe6cf')) // azulejo da frente
  pecas.push(l.peca(0,1.15,.5,2.8,1.0,.55,'#d9d4c8'),l.peca(0,1.15,1.03,3.0,.07,.7,'#c9b98f')) // balcão + tampo
  pecas.push(l.peca(-1.0,1.05,1.32,.8,.5,.42,'#bfe3ee'))                     // estufa (sonho, pão de queijo…)
  for(let k=0;k<4;k++)pecas.push(l.peca(-1.2+k*.14,1.3,1.6,.1,.06,.08,['#f2d06b','#e9b85a','#f2d06b','#f7e3a0'][k])) // em cima da estufa
  pecas.push(l.peca(-.1,1.1,1.1,.6,.06,.4,'#8a5a2b'))                         // a cesta do pão francês
  for(let k=0;k<6;k++)pecas.push(l.peca(-.3+(k%3)*.2,1.0+Math.floor(k/3)*.18,1.16,.17,.08,.09,'#d9a24e',{yaw:.15*(k%2?1:-1)}))
  for(let k=0;k<4;k++)cil1.push(l.peca(.35+k*.28,1.42,1.12,.07,.09,.07,k%2?'#f4ecd6':'#ffffff')) // copinho americano de café
  cil1.push(l.peca(1.25,1.42,1.18,.16,.22,.16,'#b5b9bc'))                    // a garrafa térmica
  lote(cenas.manha,'padaria-pecas',pecas);lote(cenas.manha,'padaria-copos',cil1,cil)
  placa(cenas.manha,'padaria-letreiro',F.padaria,o.x,QUADRA_Y+3.05,o.z+.14,4.2,.6,0)
  placa(cenas.manha,'padaria-toldo',F.listraVermelha,o.x,QUADRA_Y+2.62,o.z+.85,3.3,1.5,0,-Math.PI/2+.38)
  // padeiro atrás do balcão e 3 fregueses tomando café em pé, virados pro balcão
  pessoa('padeiro','manha','fuller-man','#ffffff',parado(o.x+.5,QUADRA_Y,o.z+.55,0))
  for(const [k,[s,v]] of ([[-1.0,'older-man'],[.3,'adult-woman'],[1.2,'adult-man']] as const).entries()){const q=l.at(s,2.05);pessoa('cafe-'+k,'manha',v,['#2F6FB5','#C2452F','#e8e0c9'][k],parado(q.x,QUADRA_Y,q.z,Math.PI))}
 }

 // 🛻 KOMBI DO GÁS e 🚲 BICICLETA DO PÃO (manhã): malha mesclada única, com a cor no vértice ─────────────────────────────
 const mescla=(partes:{g:THREE.BufferGeometry;c:string;x:number;y:number;z:number;sx?:number;sy?:number;sz?:number;rx?:number;rz?:number}[])=>{
  const list=partes.map(p=>{const g=p.g.clone();t.position.set(p.x,p.y,p.z);t.rotation.set(p.rx??0,0,p.rz??0);t.scale.set(p.sx??1,p.sy??1,p.sz??1);t.updateMatrix();g.applyMatrix4(t.matrix)
   const n=g.getAttribute('position').count,c=new Float32Array(n*3);cor.set(p.c).toArray(c,0);for(let i=1;i<n;i++){c[i*3]=c[0];c[i*3+1]=c[1];c[i*3+2]=c[2]}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g})
  const out=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(!out)throw Error('malha do bairro inválida');return own(out)
 }
 const vertexMat=mat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}))
 let kombi:THREE.Mesh|undefined,bike:THREE.Mesh|undefined
 if(L.kombi){
  // Kombi picape "saia e blusa": cabine (azul embaixo, branco em cima), carroceria aberta com grade e 8 botijões
  const roda=own(new THREE.CylinderGeometry(.33,.33,.22,12)),botijao=own(new THREE.CylinderGeometry(.17,.17,.5,10))
  const p:Parameters<typeof mescla>[0]=[
   {g:unit,c:'#2F6FB5',x:0,y:.72,z:1.25,sx:1.8,sy:.75,sz:1.6},{g:unit,c:'#f4f1e8',x:0,y:1.45,z:1.25,sx:1.78,sy:.72,sz:1.5},
   {g:unit,c:'#26343e',x:0,y:1.5,z:2.02,sx:1.6,sy:.48,sz:.04},{g:unit,c:'#26343e',x:.9,y:1.5,z:1.2,sx:.03,sy:.42,sz:1.0},{g:unit,c:'#26343e',x:-.9,y:1.5,z:1.2,sx:.03,sy:.42,sz:1.0},
   {g:unit,c:'#f4f1e8',x:0,y:.95,z:2.07,sx:.5,sy:.5,sz:.05},                                    // o "V" branco da frente
   {g:unit,c:'#2F6FB5',x:0,y:.62,z:-.95,sx:1.8,sy:.55,sz:2.8},                                   // a carroceria
   {g:unit,c:'#c7cbcd',x:.88,y:1.15,z:-.95,sx:.05,sy:.5,sz:2.8},{g:unit,c:'#c7cbcd',x:-.88,y:1.15,z:-.95,sx:.05,sy:.5,sz:2.8},{g:unit,c:'#c7cbcd',x:0,y:1.15,z:-2.33,sx:1.8,sy:.5,sz:.05},
   {g:unit,c:'#e8e0c9',x:0,y:1.98,z:-.95,sx:1.2,sy:.3,sz:.05},                                   // a plaquinha "GÁS" (lisa)
   ...[[.62,1.75],[-.62,1.75],[.62,-1.55],[-.62,-1.55]].map(([x,z])=>({g:roda,c:'#1a1a1a',x,y:.33,z,rz:Math.PI/2})),
   ...[-.42,-.14,.14,.42].flatMap(x=>[-.4,-1.3].map(z=>({g:botijao,c:(x+z)%.3>.1?'#3f6b8c':'#566b78',x:x*1.8,y:1.15,z}))),
  ]
  kombi=new THREE.Mesh(mescla(p),vertexMat);kombi.name='kombi-do-gas';kombi.castShadow=false;kombi.receiveShadow=true;cenas.manha.add(kombi)
 }
 if(L.bicicleta){
  // bicicleta de padeiro: quadro preto, as duas rodas finas, o cesto grande na frente com os pães (e o rapaz em cima)
  const aroLado=own(new THREE.TorusGeometry(.33,.035,6,16).rotateY(Math.PI/2)) // a roda de pé, no plano da bicicleta
  const p:Parameters<typeof mescla>[0]=[
   {g:aroLado,c:'#1a1a1a',x:0,y:.36,z:.55},{g:aroLado,c:'#1a1a1a',x:0,y:.36,z:-.55},
   {g:unit,c:'#202020',x:0,y:.62,z:0,sx:.05,sy:.05,sz:1.05,rx:-.25},{g:unit,c:'#202020',x:0,y:.55,z:-.32,sx:.05,sy:.55,sz:.05,rx:.3},
   {g:unit,c:'#202020',x:0,y:.6,z:.45,sx:.05,sy:.6,sz:.05,rx:-.35},{g:unit,c:'#202020',x:0,y:.92,z:.5,sx:.55,sy:.04,sz:.04},
   {g:unit,c:'#3a2a20',x:0,y:.86,z:-.36,sx:.18,sy:.06,sz:.28},
   {g:unit,c:'#b8874e',x:0,y:.82,z:.88,sx:.5,sy:.32,sz:.42},                                     // o cesto de vime
   ...[-.14,0,.14].map(x=>({g:unit,c:'#d9a24e',x,y:1.0,z:.88,sx:.1,sy:.08,sz:.3})),               // os pães
  ]
  const g=mescla(p)
  bike=new THREE.Mesh(g,vertexMat);bike.name='bicicleta-do-pao';bike.castShadow=false;bike.receiveShadow=true;cenas.manha.add(bike)
  // o ciclista: sentado no selim (mesmo "sentado" do boteco, só que mais alto), indo junto da bicicleta
  pessoa('ciclista-pao','manha','adult-man','#ffffff',s=>{const v=poseNaVolta(L.bicicleta!,s*BIKE_V+40);const b=-.36;return{x:v.x+Math.sin(v.yaw)*b,y:ESTRADA_Y+.45,z:v.z+Math.cos(v.yaw)*b,heading:v.yaw,speed:0,distance:0,seated:1}})
 }

 // 🧺 VARAL (tarde) ───────────────────────────────────────────────────────────────────────────────────────────────────
 let camisaClube:THREE.InstancedMesh|undefined
 if(L.varais?.length){
  const pecas:Peca[]=[],clube:Peca[]=[]
  L.varais.forEach((v,i)=>{
   for(const s of [-1,1])pecas.push({x:v.x+s*v.len/2,y:QUADRA_Y+.9,z:v.z,w:.06,h:1.8,d:.06,c:'#8a8f92'})
   pecas.push({x:v.x,y:QUADRA_Y+1.76,z:v.z,w:v.len,h:.015,d:.015,c:'#e8e0c9'})
   // 4 peças de roupa por varal: camiseta, calça, toalha, lençol… cores sortidas, uma delas é a CAMISA DO CLUBE
   const n=4;for(let k=0;k<n;k++){
    const x=v.x-v.len/2+.5+k*(v.len-1)/(n-1),tipo=(i+k)%4,c=ROUPAS[(i*3+k*2)%ROUPAS.length]
    if(k===1&&i<2){clube.push({x,y:QUADRA_Y+1.45,z:v.z,w:.58,h:.62,d:.02,c:'#ffffff'},{x,y:QUADRA_Y+1.66,z:v.z,w:.92,h:.2,d:.02,c:'#ffffff'});continue}
    if(tipo===0)pecas.push({x,y:QUADRA_Y+1.45,z:v.z,w:.55,h:.6,d:.02,c},{x,y:QUADRA_Y+1.66,z:v.z,w:.85,h:.18,d:.02,c})          // camiseta
    else if(tipo===1)pecas.push({x:x-.13,y:QUADRA_Y+1.3,z:v.z,w:.2,h:.9,d:.02,c:'#3b5a8a'},{x:x+.13,y:QUADRA_Y+1.3,z:v.z,w:.2,h:.9,d:.02,c:'#3b5a8a'}) // calça jeans
    else if(tipo===2)pecas.push({x,y:QUADRA_Y+1.32,z:v.z,w:.6,h:.85,d:.02,c})                                                // toalha
    else pecas.push({x,y:QUADRA_Y+1.2,z:v.z,w:.9,h:1.1,d:.02,c:'#f4ecd6'})                                                   // lençol
    pecas.push({x:x-.2,y:QUADRA_Y+1.78,z:v.z,w:.03,h:.07,d:.03,c:'#e8503a'},{x:x+.2,y:QUADRA_Y+1.78,z:v.z,w:.03,h:.07,d:.03,c:'#1B7A3D'}) // prendedores
   }
  })
  lote(cenas.tarde,'varal-pecas',pecas)
  camisaClube=lote(cenas.tarde,'varal-camisa-clube',clube)
 }

 // 🍦🍿👴 PRAÇA (tarde): carrinho de sorvete, carrinho de pipoca e a mesa do dominó ─────────────────────────────────────
 if(L.praca){
  const pr=L.praca,pecas:Peca[]=[],cils:Peca[]=[]
  // sorvete: caixa branca com tampa azul, guarda-sol listrado, rodinhas
  // os dois carrinhos de frente pro canto aberto da praça (−z): o vendedor atrás, a freguesia na frente
  {const l=local(pr.sorvete,Math.PI,PRACA_Y)
   pecas.push(l.peca(0,0,.62,1.1,.62,.62,'#f7f7f2'),l.peca(0,0,.96,1.12,.06,.64,'#2F6FB5'),l.peca(.68,0,.8,.06,.06,.5,'#9aa0a3'))
   cils.push(l.peca(0,0,1.6,.04,1.3,.04,'#9aa0a3'),l.peca(-.4,0,.17,.3,.06,.3,'#1a1a1a',{pitch:Math.PI/2}),l.peca(.4,0,.17,.3,.06,.3,'#1a1a1a',{pitch:Math.PI/2}))
   cils.push(l.peca(0,0,2.22,1.7,.14,1.7,'#C2452F'),l.peca(0,0,2.3,.9,.06,.9,'#ffffff'))
   placa(cenas.tarde,'sorvete-placa',F.sorvete,pr.sorvete.x,PRACA_Y+.62,pr.sorvete.z-.32,.95,.24,Math.PI,0,atlasMat,.5)}
  // pipoca: carrinho vermelho alto com a vitrine de vidro e a pipoca dentro, panela em cima
  {const l=local(pr.pipoca,Math.PI,PRACA_Y)
   pecas.push(l.peca(0,0,.55,1.0,.7,.6,'#C2452F'),l.peca(0,0,1.25,.95,.7,.55,'#f6efc8'),l.peca(0,0,1.62,1.04,.06,.62,'#C2452F'),l.peca(.62,0,.9,.06,.06,.45,'#9aa0a3'))
   for(let k=0;k<10;k++)pecas.push(l.peca(-.35+(k%5)*.17,-.08+Math.floor(k/5)*.16,1.0+((k*7)%3)*.06,.13,.13,.13,'#fff4c8',{yaw:k}))
   cils.push(l.peca(-.25,0,1.74,.36,.16,.36,'#8d9092'),l.peca(-.4,0,.17,.3,.06,.3,'#1a1a1a',{pitch:Math.PI/2}),l.peca(.4,0,.17,.3,.06,.3,'#1a1a1a',{pitch:Math.PI/2}))
   placa(cenas.tarde,'pipoca-placa',F.pipoca,pr.pipoca.x,PRACA_Y+.62,pr.pipoca.z-.31,.9,.24,Math.PI,0,atlasMat,.5)}
  // dominó: mesinha de concreto da praça, 4 banquinhos e as pedras na mesa
  {const d=pr.domino
   cils.push({x:d.x,y:PRACA_Y+.36,z:d.z,w:.34,h:.72,d:.34,c:'#9c9a92'},{x:d.x,y:PRACA_Y+.74,z:d.z,w:1.0,h:.07,d:1.0,c:'#b8b5ab'})
   for(const [sx,sz] of [[1,0],[-1,0],[0,1],[0,-1]])cils.push({x:d.x+sx*.82,y:PRACA_Y+.22,z:d.z+sz*.82,w:.36,h:.44,d:.36,c:'#9c9a92'})
   for(let k=0;k<11;k++){const a=k*.57,r=.12+(k%4)*.05;pecas.push({x:d.x+Math.cos(a)*r,y:PRACA_Y+.785,z:d.z+Math.sin(a)*r,w:.1,h:.02,d:.05,yaw:a*1.7,c:'#f7f5ee'})}
   for(const s of [-1,1])for(let k=0;k<4;k++)pecas.push({x:d.x+s*.32,y:PRACA_Y+.8,z:d.z-.15+k*.1,w:.03,h:.09,d:.08,yaw:0,c:'#f7f5ee'})
   pecas.push({x:d.x+.18,y:PRACA_Y+.79,z:d.z+.34,w:.07,h:.04,d:.07,c:'#cfe08a'}) // o copinho de café (ou de cachaça)
   // os 4 senhores sentados, cada um de frente pra mesa
   const qs:[number,number,string,string][]=[[1,0,'older-man','#e8e0c9'],[-1,0,'older-man','#7a8a6a'],[0,1,'fuller-man','#ffffff'],[0,-1,'older-man','#2F6FB5']]
   qs.forEach(([sx,sz,v,c],k)=>pessoa('domino-'+k,'tarde',v,c,parado(d.x+sx*.82,PRACA_Y,d.z+sz*.82,Math.atan2(-sx,-sz),1)))}
  lote(cenas.tarde,'praca-pecas',pecas);lote(cenas.tarde,'praca-cilindros',cils,cil)
  pessoa('sorveteiro','tarde','adult-man','#ffffff',parado(pr.sorvete.x,PRACA_Y,pr.sorvete.z+.85,Math.PI))
  pessoa('pipoqueiro','tarde','older-woman','#C2452F',parado(pr.pipoca.x,PRACA_Y,pr.pipoca.z+.8,Math.PI))
  pessoa('crianca-sorvete','tarde','child-girl','#f2a0c0',parado(pr.sorvete.x+.3,PRACA_Y,pr.sorvete.z-1.0,0))
  pessoa('crianca-pipoca','tarde','child-boy','#FFC400',parado(pr.pipoca.x-.2,PRACA_Y,pr.pipoca.z-1.0,0))
 }

 // 🍢 ESPETINHO e 🍔 PODRÃO (noite) ────────────────────────────────────────────────────────────────────────────────────
 const fumacas:{base:P;y:number;n:number;mesh:THREE.InstancedMesh}[]=[]
 const fumaca=(parent:THREE.Object3D,base:P,y:number,name:string)=>{const n=5,m=new THREE.InstancedMesh(bola,fumacaMat,n);m.name=name;m.castShadow=false;m.receiveShadow=false;m.frustumCulled=false;parent.add(m);fumacas.push({base,y,n,mesh:m})}
 const churrasqueira=(parent:THREE.Object3D,o:P,yaw:number,y0:number,nome:string,espetos:number)=>{
  // churrasqueirinha de tambor/lata: caixa de metal, 4 pés, a grelha, a brasa (emissiva) e os espetinhos atravessados
  const l=local(o,yaw,y0),pecas:Peca[]=[],brasa:Peca[]=[]
  pecas.push(l.peca(0,0,.78,1.1,.26,.42,'#3b3b3b'))
  for(const s of [-.48,.48])for(const f of [-.16,.16])pecas.push(l.peca(s,f,.33,.05,.66,.05,'#2a2a2a'))
  for(let k=0;k<7;k++)brasa.push(l.peca(-.42+k*.14,(k%2)*.06-.03,.93,.12,.06,.12,k%3?'#ff6a1a':'#ffb03a',{yaw:k}))
  for(let k=0;k<espetos;k++){const s=-.42+k*(.84/Math.max(1,espetos-1));pecas.push(l.peca(s,0,.99,.03,.03,.62,'#c9b98f'));for(const f of [-.12,0,.12])pecas.push(l.peca(s,f,.99,.07,.07,.08,k%3===1?'#e6c27a':'#8b4a2b'))}
  lote(parent,nome+'-pecas',pecas);lote(parent,nome+'-brasa',brasa,unit,brasaMat)
  fumaca(parent,l.at(0,0),y0+1.05,nome+'-fumaca')
 }
 if(L.espetinho){
  const e=L.espetinho,l=local(e,e.yaw,QUADRA_Y)
  churrasqueira(cenas.noite,l.at(0,.2),e.yaw,QUADRA_Y,'espetinho',6)
  // a cadeirinha de plástico vermelha, o isopor e a plaquinha
  lote(cenas.noite,'espetinho-pecas',[l.peca(1.1,-.3,.22,.42,.44,.42,'#C2452F'),l.peca(-1.1,-.2,.24,.6,.48,.4,'#f4f4f4'),l.peca(-1.1,-.2,.5,.62,.05,.42,'#2F6FB5'),l.peca(0,-.35,1.0,.04,2.0,.04,'#6b4a2a'),l.peca(.55,-.35,2.24,.02,.3,.02,'#222222')])
  lote(cenas.noite,'espetinho-lampada',[l.peca(.55,-.35,2.04,.14,.18,.14,'#ffffff')],bola,lampadaMat)
  {const q=l.at(0,-.35);placa(cenas.noite,'espetinho-placa',F.espetinho,q.x,QUADRA_Y+2.05,q.z,1.6,.2,e.yaw)}
  {const q=l.at(0,-.45);pessoa('espetinheiro','noite','adult-man','#C2452F',parado(q.x,QUADRA_Y,q.z,e.yaw))}
  {const q=l.at(-.5,1.05);pessoa('espetinho-fregues-0','noite','adult-woman','#2F6FB5',parado(q.x,QUADRA_Y,q.z,e.yaw+Math.PI-.3))}
  {const q=l.at(.65,1.0);pessoa('espetinho-fregues-1','noite','fuller-man','#ffffff',parado(q.x,QUADRA_Y,q.z,e.yaw+Math.PI+.4))}
 }
 if(L.podrao){
  // o trailer: caixa branca com a faixa vermelha, a janela de atendimento com o toldo levantado, o balcão e o letreiro
  const pd=L.podrao,l=local(pd,pd.yaw,QUADRA_Y),pecas:Peca[]=[],rodas:Peca[]=[]
  pecas.push(l.peca(0,-.2,1.45,3.2,1.9,1.8,'#f4f1e8'),l.peca(0,.71,.75,3.22,.32,.02,'#C2452F'),l.peca(0,.71,1.75,2.2,.9,.03,'#3a2a20'))
  pecas.push(l.peca(0,.95,1.15,2.4,.06,.5,'#c9b98f'),l.peca(0,-.2,2.43,3.25,.06,1.85,'#d9d4c8'),l.peca(-1.9,-.2,.55,.6,.08,.12,'#3b3b3b'))
  for(let k=0;k<3;k++)pecas.push(l.peca(-.7+k*.35,.92,1.24,.18,.1,.18,['#d9a24e','#e8503a','#FFC400'][k])) // o lanche, o ketchup, a mostarda
  for(const s of [-.85,.85])rodas.push(l.peca(s,-.2,.3,.6,1.9,.6,'#1a1a1a',{pitch:Math.PI/2}))
  lote(cenas.noite,'podrao-pecas',pecas);lote(cenas.noite,'podrao-rodas',rodas,cil)
  lote(cenas.noite,'podrao-luz',[l.peca(0,.72,2.12,2.0,.08,.03,'#ffffff'),l.peca(-1.2,.9,2.5,.16,.2,.16,'#ffffff')],unit,lampadaMat) // a lâmpada fria da janela e a do toldo
  {const q=l.at(0,.75);placa(cenas.noite,'podrao-letreiro',F.podrao,q.x,QUADRA_Y+2.62,q.z,2.8,.36,pd.yaw)}
  {const q=l.at(0,1.32);placa(cenas.noite,'podrao-toldo',F.listraAzul,q.x,QUADRA_Y+2.3,q.z,2.4,1.0,pd.yaw,-Math.PI/2+.35)}
  {const q=l.at(.2,.3);pessoa('podrao-chapeiro','noite','fuller-woman','#ffffff',parado(q.x,QUADRA_Y+.25,q.z,pd.yaw))}
  {const q=l.at(-.6,1.75);pessoa('podrao-fregues-0','noite','adult-man','#1B7A3D',parado(q.x,QUADRA_Y,q.z,pd.yaw+Math.PI))}
  {const q=l.at(.75,1.8);pessoa('podrao-fregues-1','noite','adult-woman','#7C3AED',parado(q.x,QUADRA_Y,q.z,pd.yaw+Math.PI+.2))}
 }
 // 💡 cadeira de praia na calçada (noite): duas cadeiras listradas na frente da porta, gente sentada proseando
 if(L.cadeiras?.length){
  const pecas:Peca[]=[],cores=['#2F6FB5','#C2452F','#1B7A3D','#FFC400','#7C3AED']
  L.cadeiras.forEach((c,i)=>{
   for(const [k,s] of [-1,1].entries()){
    const x=c.x+s*.75,z=c.z+1.35,cc=cores[(i*2+k)%cores.length],yaw=s*.35 // de frente pra rua, um pouco virados um pro outro
    const l=local({x,z},yaw,QUADRA_Y)
    pecas.push(l.peca(0,0,.36,.5,.05,.45,cc),l.peca(0,-.27,.64,.5,.55,.05,cc,{pitch:-.35}))
    for(const ss of [-.24,.24])pecas.push(l.peca(ss,0,.18,.03,.36,.5,'#c7cbcd'))
    if(k===0||i===0)pessoa(`calcada-${i}-${k}`,'noite',(['older-woman','older-man','adult-woman','fuller-man','adult-man'] as const)[(i*2+k)%5],cores[(i*2+k+2)%cores.length],parado(x,QUADRA_Y,z+.05,s*.35,1))
   }
  })
  lote(cenas.noite,'cadeiras-pecas',pecas)
 }
 // 📺 a TV ligada no fundo do Boteco do Oswaldo, vista pela porta (a tela brilha pelo material, sem luz nova)
 if(input.boteco){
  const b=input.boteco
  lote(cenas.noite,'boteco-tv-moldura',[{x:b.x+1.6,y:QUADRA_Y+2.25,z:b.z-4.66,w:1.5,h:.9,d:.06,c:'#111111'},{x:b.x+1.6,y:QUADRA_Y+1.72,z:b.z-4.6,w:.08,h:.2,d:.12,c:'#222222'}])
  placa(cenas.noite,'boteco-tv',F.tv,b.x+1.6,QUADRA_Y+2.25,b.z-4.62,1.36,.76,0,0,tvMat,117/512)
 }

 // 🏟️ DIA DE JOGO EM CASA: 👕 camisa pirata · 🐈 churrasquinho de gato · 🧽 flanelinha ──────────────────────────────────
 let pirataClube:THREE.InstancedMesh|undefined,flanelaPose:(s:number)=>void=()=>{}
 {
  const J=LUGARES_DIA_DE_JOGO,pc=J.pirata,l=local(pc,pc.yaw,ESTADIO_Y),pecas:Peca[]=[],camisas:Peca[]=[]
  // a arara de cano (dois pés, o cano em cima) com 6 camisas penduradas de frente pra quem passa, e a lona no chão com mais
  for(const s of [-1,1])pecas.push(l.peca(s*1.3,0,.9,.05,1.8,.05,'#9aa0a3'),l.peca(s*1.3,0,.02,.06,.04,.6,'#9aa0a3'))
  pecas.push(l.peca(0,0,1.78,2.65,.04,.04,'#9aa0a3'),l.peca(0,1.0,.015,1.8,.02,1.0,'#2F6FB5'))
  for(let k=0;k<6;k++){const s=-1.05+k*.42,f=.04*(k%2);camisas.push(l.peca(s,f,1.3,.48,.64,.02,'#ffffff',{yaw:(k-2.5)*.04}),l.peca(s,f,1.55,.76,.18,.02,'#ffffff',{yaw:(k-2.5)*.04}))}
  for(let k=0;k<4;k++)camisas.push(l.peca(-.6+k*.4,1.0,.04,.4,.03,.5,'#ffffff',{yaw:.2*k}))
  lote(cenas.jogo,'pirata-pecas',pecas)
  pirataClube=lote(cenas.jogo,'pirata-camisas',camisas)
  {const q=l.at(1.85,.2);pessoa('camelo-pirata','jogo','adult-man','#e8e0c9',parado(q.x,ESTADIO_Y,q.z,pc.yaw))}
  // churrasquinho de gato: a mesma churrasqueirinha, com fumaça, numa caixa de isopor de apoio
  const g=J.gato;churrasqueira(cenas.jogo,g,g.yaw,ESTADIO_Y,'gato',5)
  {const lg=local(g,g.yaw,ESTADIO_Y);lote(cenas.jogo,'gato-isopor',[lg.peca(-1.0,-.1,.24,.6,.48,.4,'#f4f4f4'),lg.peca(-1.0,-.1,.5,.62,.05,.42,'#C2452F')])
   const q=lg.at(0,-.55);pessoa('churrasqueiro-gato','jogo','fuller-man','#ffffff',parado(q.x,ESTADIO_Y,q.z,g.yaw))
   const f=lg.at(.4,1.0);pessoa('gato-fregues','jogo','adult-man',undefined,parado(f.x,ESTADIO_Y,f.z,g.yaw+Math.PI))}
  // flanelinha: anda devagar pra lá e pra cá na entrada do estacionamento, com a flanela laranja na mão
  const fl=J.flanelinha
  const flanela=new THREE.Mesh(unit,mat(new THREE.MeshStandardMaterial({color:'#ff7a1a',roughness:.9})));flanela.name='flanelinha-flanela';flanela.scale.set(.03,.4,.32);flanela.castShadow=false;cenas.jogo.add(flanela)
  const poseFlanela=(s:number)=>{const u=Math.sin(s*.45),dx=Math.cos(fl.yaw)*u*2.2,dz=-Math.sin(fl.yaw)*u*2.2,anda=Math.abs(Math.cos(s*.45))>.25;return{x:fl.x+dx,y:ESTADIO_Y,z:fl.z+dz,heading:anda?(Math.cos(s*.45)>0?fl.yaw+Math.PI/2:fl.yaw-Math.PI/2):fl.yaw,speed:anda?.8:0,distance:s*.8,seated:0}}
  pessoa('flanelinha','jogo','adult-man','#e9d84a',poseFlanela)
  // a flanela na mão direita, na altura da cintura, abanando pro motorista
  flanelaPose=(s:number)=>{const p=poseFlanela(s),fx=Math.sin(p.heading),fz=Math.cos(p.heading),ax=Math.cos(p.heading),az=-Math.sin(p.heading),aceno=Math.sin(s*5);flanela.position.set(p.x+fx*.22-ax*.36,p.y+.92+aceno*.08,p.z+fz*.22-az*.36);flanela.rotation.set(aceno*.5,p.heading,0,'YXZ')}
 }

 // no celular o teto corta pela ordem: dia de jogo primeiro, depois noite, manhã e tarde
 const PRIORIDADE:Record<Cena,number>={jogo:0,noite:1,manha:2,tarde:3};pessoas.sort((a,b)=>PRIORIDADE[a.cena]-PRIORIDADE[b.cena])
 // ── cores do clube (varal e camisa pirata) e o "liga/desliga" de cada cena ─────────────────────────────────────────────
 let ligadas:Record<Cena,boolean>={manha:false,tarde:false,noite:false,jogo:false},mobile=false,coresKey=''
 const pintaClube=(m:THREE.InstancedMesh|undefined,c1:string,c2:string)=>{if(!m)return;for(let i=0;i<m.count;i++)m.setColorAt(i,cor.set(i%2?c2:c1));if(m.instanceColor)m.instanceColor.needsUpdate=true}
 function configure(vida:VidaBairro,opts:{enabled:boolean;mobile:boolean;cor?:string;cor2?:string}){
  mobile=opts.mobile
  ligadas={manha:opts.enabled&&vida.padaria,tarde:opts.enabled&&vida.varal,noite:opts.enabled&&vida.espetinho,jogo:vida.jogoEmCasa} // o dia de jogo é do estádio (igual às barracas oficiais): não depende da população do bairro
  // a TV e as peças paradas aparecem mesmo sem população (são cenário); só as pessoas e os veículos dependem dela
  cenas.manha.visible=vida.padaria;cenas.tarde.visible=vida.varal;cenas.noite.visible=vida.espetinho;cenas.jogo.visible=vida.jogoEmCasa
  const c1=opts.cor??'#C2452F',c2=opts.cor2??'#ffffff',k=c1+c2
  if(k!==coresKey){coresKey=k;pintaClube(camisaClube,c1,c2);pintaClube(pirataClube,c1,c2)}
  if(atlasLang!==getLang())desenhaAtlas()
 }
 function update(seconds:number,camera?:THREE.Camera,height=720){
  if(kombi){kombi.visible=ligadas.manha;if(ligadas.manha){const v=poseNaVolta(L.kombi!,seconds*KOMBI_V);kombi.position.set(v.x,ESTRADA_Y,v.z);kombi.rotation.y=v.yaw}}
  if(bike){bike.visible=ligadas.manha;if(ligadas.manha){const v=poseNaVolta(L.bicicleta!,seconds*BIKE_V+40);bike.position.set(v.x,ESTRADA_Y,v.z);bike.rotation.y=v.yaw}}
  for(const f of fumacas){if(!f.mesh.parent?.visible)continue;for(let i=0;i<f.n;i++){const u=((seconds*.35+i/f.n)%1),r=.12+u*.32;t.position.set(f.base.x+Math.sin(seconds*.7+i)*.15*u,f.y+u*1.6,f.base.z+Math.cos(seconds*.5+i*2)*.12*u);t.rotation.set(0,0,0);t.scale.setScalar(r);t.updateMatrix();f.mesh.setMatrixAt(i,t.matrix)}f.mesh.instanceMatrix.needsUpdate=true}
  if(ligadas.jogo)flanelaPose(seconds)
  // celular: no máximo 7 pessoas desta leva por vez (a pelada e a feira têm o teto delas)
  let n=0
  for(const p of pessoas){
   let on=ligadas[p.cena];if(on){n++;if(mobile&&n>7)on=false}
   const pose=on?p.pose(seconds):undefined
   if(pose){p.body.root.position.set(pose.x,pose.y,pose.z);p.body.root.rotation.y=pose.heading}
   const lod=pose?residentVisibility(p.body.root.position,1.7,camera,height):{visible:false,detail:'far'}
   p.body.update({seconds,distance:pose?.distance??0,speed:pose?.speed??0,seated:pose?.seated??0,visible:lod.visible,detail:lod.detail})
   if(!p.semSombra&&p.body.root.children[0]?.children.length){p.body.root.traverse(o=>{o.castShadow=false});p.semSombra=true}
  }
 }
 function vista(kind:VistaDiaBairro,aspect:number):{target:[number,number,number];camera:[number,number,number]}|undefined{
  const k=aspect<.85?1.45:1
  if(kind==='padaria'&&L.padaria){const p=L.padaria;return{target:[p.x+.6,.8,p.frente+9],camera:[p.x+1.4,8+3*k,p.frente+20+5*k]}} // do outro lado da rua: a padaria, e a Kombi e a bicicleta passando na porta
  if(kind==='praca-bairro'&&L.praca){const c=L.praca.centro;return{target:[c.x+1.8,.6,c.z-4.4],camera:[c.x+4+2*k,6+3*k,c.z-17-6*k]}} // do canto sem árvore
  if(kind==='varal'&&L.varais?.length){const v=L.varais[0];return{target:[v.x,1.3,v.z],camera:[v.x+2.5,2.6+1.2*k,v.z+6+3*k]}}
  if(kind==='espetinho'&&L.espetinho&&L.podrao){const m={x:(L.espetinho.x+L.podrao.x)/2,z:(L.espetinho.z+L.podrao.z)/2};return{target:[m.x,.8,m.z-.5],camera:[m.x,6+3*k,m.z+13+8*k]}} // de dentro da travessa
  if(kind==='jogo-bairro'){const J=LUGARES_DIA_DE_JOGO,m={x:(J.pirata.x+J.gato.x)/2,z:(J.pirata.z+J.gato.z)/2};return{target:[m.x,1,m.z],camera:[m.x-(10+3*k)*.96,3.2+1.6*k,m.z+(10+3*k)*.27]}} // da fila da torcida, de frente pra fileira camelô → gato
  if(kind==='cadeiras'&&L.cadeiras?.length){const c=L.cadeiras[0];return{target:[c.x,.9,c.z+1.2],camera:[c.x+2.2,2.6+1.2*k,c.z+7+3*k]}}
  if(kind==='flanelinha'){const f=LUGARES_DIA_DE_JOGO.flanelinha;return{target:[f.x,1,f.z],camera:[f.x-4,3+1.5*k,f.z+7+3*k]}}
  return undefined
 }
 return{configure,update,vista,
  inspect:()=>({cenas:Object.fromEntries(Object.entries(cenas).map(([k,g])=>[k,g.visible])),kombi:kombi?.visible?kombi.position.toArray():null,bicicleta:bike?.visible?bike.position.toArray():null,pessoas:pessoas.filter(p=>p.body.root.visible).map(p=>p.cena)}),
  dispose(){pessoas.forEach(p=>p.body.dispose());for(const g of Object.values(cenas))g.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose()});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());atlas.dispose()}}
}
