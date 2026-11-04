// 🇧🇷 TRADIÇÕES DO BAIRRO no mapa 3D (04/11) — o desenho das regras de presidencia-bairro-tradicoes.ts:
//  🍅 feira livre (sáb/dom de manhã) numa rua do bairro · 📰 banca de jornal com a capa d'O MARTELO (sempre) ·
//  ⚽ pelada no campinho de terra (de tarde; fora disso só as traves).
// Custo: peças em InstancedMesh (um cubo e uma bolinha compartilhados, cor por instância), QUATRO texturas de canvas pequenas
// (lona listrada, terra, letreiros e a capa do jornal), nenhuma luz e nenhuma sombra nova. As pessoas são os mesmos civis da
// cidade (carregados só quando aparecem, com LOD) e tudo anda pelo `update` que o mapa já chama no quadro dele — sem toque
// (VIVO_MS) o mapa para e a feira para junto. Qualquer erro aqui fica aqui: o mapa segue de pé.
import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import type {BotecoBairro} from './presidencia-boteco-bairro'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import type {CidadeViva} from './presidencia-cidade-viva'
import {lugaresDoBairro,mancheteDaBanca,vidaDoBairro,type LugaresBairro,type VidaBairro} from './presidencia-bairro-tradicoes'
import {getLang} from './lang'

type P={x:number;z:number}
export type BairroEntorno={quadras:readonly P[];ruas:readonly (readonly [P,P])[];campinho?:P}
export type VistaTradicao='feira'|'banca'|'campinho'
type Civil=ReturnType<typeof createCivilian>
type Pessoa={body:Civil;grupo:'feira'|'banca'|'pelada';semSombra:boolean;pose:(s:number)=>{x:number;z:number;heading:number;speed:number;distance:number}}

const CREME='#F4ECD6',TINTA='#0C0C0C',OURO='#FFC400',VERDE='#1B7A3D',VERMELHO='#C2452F'
const FONTE='"Oswald","Arial Narrow",Impact,sans-serif'
const LONAS=[OURO,'#2F6FB5',VERMELHO,VERDE] as const
const FRUTAS=['#d8352a','#f39a1e','#f2d03b','#4f9a2f','#5b2a6e','#e9572b','#9fcf3a','#c21f3a']
const REVISTAS=['#e8503a','#FFC400','#2F6FB5','#7C3AED','#1B7A3D','#f2a0c0','#ffffff','#f39a1e','#16a3b8']
const ESTRADA_Y=.01,QUADRA_Y=.16,CAMPO_Y=-.035

const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
const canvasTex=(w:number,h:number,draw:(g:CanvasRenderingContext2D)=>void)=>{
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(g)draw(g)
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t
}
/** quebra a manchete em até 3 linhas que cabem na largura */
const quebra=(g:CanvasRenderingContext2D,txt:string,max:number)=>{const out:string[]=[];let linha='';for(const w of txt.split(' ')){const t=linha?linha+' '+w:w;if(g.measureText(t).width>max&&linha){out.push(linha);linha=w}else linha=t}if(linha)out.push(linha);return out.slice(0,3)}

/** A rua da feira em coordenadas locais: u ao longo da rua (a → b), v pro lado das barracas. */
const quadroDaRua=(f:NonNullable<LugaresBairro['feira']>)=>{
 const L=Math.hypot(f.b.x-f.a.x,f.b.z-f.a.z),ux=(f.b.x-f.a.x)/L,uz=(f.b.z-f.a.z)/L
 return{L,at:(u:number,v:number)=>({x:f.a.x+ux*u+f.lado.x*v,z:f.a.z+uz*u+f.lado.z*v}),yawU:Math.atan2(ux,uz),yawV:Math.atan2(f.lado.x,f.lado.z)}
}

export function criarTradicoesBairro(scene:THREE.Scene,input:{bairro?:BairroEntorno;botecos:readonly BotecoBairro[];solids:readonly SolidoEntorno[];clubName?:string;onReady:()=>void}){
 const root=new THREE.Group();root.name='bairro-tradicoes';scene.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
 const own=<G extends THREE.BufferGeometry>(g:G)=>{geometries.add(g);return g}
 const mat=(o:THREE.MeshStandardMaterialParameters)=>{const m=new THREE.MeshStandardMaterial({roughness:.85,metalness:0,...o});materials.add(m);return m}
 const unit=own(new THREE.BoxGeometry(1,1,1)),bola=own(new THREE.IcosahedronGeometry(1,0)),plano=own(new THREE.PlaneGeometry(1,1))
 const branco=mat({color:'#ffffff'}),fruta=mat({color:'#ffffff',roughness:.55,flatShading:true})
 const t=new THREE.Object3D(),cor=new THREE.Color()
 const oswaldo=input.botecos.find(p=>p.id==='oswaldo')?.root.position
 let lugares:LugaresBairro={}
 try{lugares=input.bairro?lugaresDoBairro({quadras:input.bairro.quadras,ruas:input.bairro.ruas,campinho:input.bairro.campinho,boteco:oswaldo?{x:oswaldo.x,z:oswaldo.z}:undefined,solidos:input.solids}):{}}catch{lugares={}}

 // Peças paradas: cada grupo (feira, banca, campinho) junta suas caixas num InstancedMesh só, com a cor por instância.
 type Caixa={x:number;y:number;z:number;w:number;h:number;d:number;yaw:number;c:string;pitch?:number}
 const lote=(name:string,caixas:readonly Caixa[],geometry:THREE.BufferGeometry=unit,material:THREE.Material=branco)=>{
  const m=new THREE.InstancedMesh(geometry,material,Math.max(1,caixas.length));m.name=name;m.castShadow=false;m.receiveShadow=true;m.count=caixas.length
  caixas.forEach((b,i)=>{t.position.set(b.x,b.y,b.z);t.rotation.set(b.pitch??0,b.yaw,0,'YXZ');t.scale.set(b.w,b.h,b.d);t.updateMatrix();m.setMatrixAt(i,t.matrix);m.setColorAt(i,cor.set(b.c))})
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();return m
 }
 const pessoas:Pessoa[]=[]
 const pessoa=(id:string,grupo:Pessoa['grupo'],variant:string,roupa:string|undefined,pose:Pessoa['pose'])=>pessoas.push({grupo,pose,semSombra:false,
  body:createCivilian(root,{deferUntilVisible:true,id:'bairro-'+id,variant,outfitColor:roupa,onReady:input.onReady})})
 const parado=(x:number,z:number,heading:number)=>()=>({x,z,heading,speed:0,distance:0})

 // 🍅 FEIRA LIVRE ───────────────────────────────────────────────────────────────────────────────────────────────────────
 const feira=new THREE.Group();feira.name='feira-livre';feira.visible=false;root.add(feira)
 let pastelSign:THREE.Texture|undefined
 if(lugares.feira){
  const q=quadroDaRua(lugares.feira),caixas:Caixa[]=[],frutas:Caixa[]=[],lonas:Caixa[][]=LONAS.map(()=>[])
  const N=6,passo=3.25,u0=(q.L-passo*(N-1))/2
  const em=(u:number,v:number)=>q.at(u,v)
  for(let i=0;i<N;i++){
   const u=u0+i*passo,c=em(u,1.55),pastel=i===0
   // mesa (tampo + 4 pés), 4 paus e a lona listrada inclinada pra frente
   caixas.push({...c,y:ESTRADA_Y+.86,w:2.9,h:.07,d:1.45,yaw:q.yawU,c:pastel?'#d9d4c8':'#c8a67a'})
   for(const du of [-1.35,1.35])for(const dv of [-.62,.62]){const p=em(u+du,1.55+dv);caixas.push({...p,y:ESTRADA_Y+.43,w:.06,h:.86,d:.06,yaw:q.yawU,c:'#6f6f6f'})}
   for(const du of [-1.5,1.5])for(const dv of [-.85,.95]){const p=em(u+du,1.55+dv),h=dv<0?2.05:2.35;caixas.push({...p,y:ESTRADA_Y+h/2,w:.05,h,d:.05,yaw:q.yawU,c:'#8d8f90'})}
   {const p=em(u,1.6);lonas[i%LONAS.length].push({...p,y:ESTRADA_Y+2.22,w:3.25,h:.03,d:2.15,yaw:q.yawU,c:'#ffffff',pitch:-.14})}
   if(pastel){
    // 🥟 pastel + caldo de cana: a garapeira verde com a roda, o tacho e a pilha de cana
    const m=em(u+.7,1.55);caixas.push({...m,y:ESTRADA_Y+1.12,w:.7,h:.45,d:.55,yaw:q.yawU,c:'#2f7d45'})
    {const r=em(u+.7,1.55-.3);caixas.push({...r,y:ESTRADA_Y+1.18,w:.08,h:.5,d:.5,yaw:q.yawU+Math.PI/2,c:'#c9ccce'})}
    {const p=em(u-.8,1.6);caixas.push({...p,y:ESTRADA_Y+.98,w:.8,h:.18,d:.5,yaw:q.yawU,c:'#3a3a3a'})}
    for(let k=0;k<5;k++){const p=em(u-.9+k*.18,.95);frutas.push({...p,y:ESTRADA_Y+.94,w:.13,h:.04,d:.09,yaw:q.yawU,c:'#e9b85a'})} // pastéis no balcão
    for(let k=0;k<6;k++){const p=em(u+1.55,2.15+k*.07);caixas.push({...p,y:ESTRADA_Y+.6,w:.05,h:1.2,d:.05,yaw:q.yawU+k*.12,c:'#8fae4d'})} // cana em pé
    for(let k=0;k<3;k++){const p=em(u+.25+k*.18,.92);caixas.push({...p,y:ESTRADA_Y+.99,w:.08,h:.18,d:.08,yaw:0,c:'#cfe08a'})} // copos de garapa
   }else{
    // caixotes de madeira com a fruta em cima, e mais caixote empilhado no chão atrás
    for(let k=0;k<4;k++){
     const p=em(u-1.05+k*.7,1.45),fc=FRUTAS[(i*3+k)%FRUTAS.length]
     caixas.push({...p,y:ESTRADA_Y+1.0,w:.6,h:.22,d:.9,yaw:q.yawU,c:'#b07a45'})
     for(let a=0;a<3;a++)for(let b=0;b<4;b++){const f=em(u-1.05+k*.7-.17+a*.17,1.45-.32+b*.21);const r=.075+((a+b+k)%3)*.01;frutas.push({...f,y:ESTRADA_Y+1.14+((a+b)%2)*.03,w:r,h:r,d:r,yaw:a+b,c:fc})}
     const tag=em(u-1.05+k*.7,1.0);caixas.push({...tag,y:ESTRADA_Y+1.25,w:.2,h:.13,d:.015,yaw:q.yawV,c:'#ffffff'})
    }
    for(const du of [-.9,.2])for(let lv=0;lv<2;lv++){const p=em(u+du,2.55);caixas.push({...p,y:ESTRADA_Y+.15+lv*.3,w:.6,h:.28,d:.42,yaw:q.yawU+lv*.08,c:lv?'#9a6a3b':'#b07a45'})}
   }
  }
  // cavaletes de preço (plaquinha amarela de feira) e sacolas no chão
  feira.add(lote('feira-pecas',caixas),lote('feira-frutas',frutas,bola,fruta))
  const listra=(c:string)=>{const tex=canvasTex(64,8,g=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#ffffff':c;g.fillRect(i*8,0,8,8)}});tex.wrapS=THREE.RepeatWrapping;textures.add(tex);return tex}
  LONAS.forEach((c,k)=>{if(!lonas[k].length)return;const m=mat({map:listra(c),roughness:.9,side:THREE.DoubleSide});feira.add(lote('feira-lona-'+k,lonas[k],unit,m))})
  // letreiro do pastel, pendurado na frente da lona
  pastelSign=canvasTex(256,64,g=>{g.fillStyle=OURO;g.fillRect(0,0,256,64);g.strokeStyle=TINTA;g.lineWidth=6;g.strokeRect(3,3,250,58);g.fillStyle=VERMELHO;g.font=`900 30px ${FONTE}`;g.textAlign='center';g.textBaseline='middle';g.fillText(getLang()==='en'?'PASTEL · SUGARCANE':'PASTEL · CALDO DE CANA',128,34,236)});textures.add(pastelSign)
  {const p=em(u0,.45),s=new THREE.Mesh(plano,mat({map:pastelSign,roughness:.9,side:THREE.DoubleSide}));s.name='feira-letreiro-pastel';s.position.set(p.x,ESTRADA_Y+1.68,p.z);s.rotation.y=q.yawV+Math.PI;s.scale.set(1.9,.48,1);feira.add(s)}
  // gente: feirante atrás de cada banca, fregueses andando no meio da rua e uns parados escolhendo
  for(let i=0;i<N;i++){const u=u0+i*passo,p=em(u+(i%2?.4:-.4),2.6);pessoa('feirante-'+i,'feira',['adult-man','fuller-man','adult-woman','older-man','fuller-woman','adult-man'][i],['#ffffff','#2F6FB5','#C2452F','#ffffff','#1B7A3D','#f39a1e'][i],parado(p.x,p.z,q.yawV+Math.PI))}
  for(let k=0;k<5;k++){
   const v=-.35-(k%2)*.85,vel=.55+(k%3)*.12,ida=q.L-6,fase=k*7.3
   pessoa('freguesa-'+k,'feira',['adult-woman','older-woman','adult-man','fuller-woman','older-man'][k],undefined,s=>{
    // vai e volta pela rua devagar, com uma paradinha na frente de cada barraca
    const d=(s*vel+fase)%(ida*2),volta=d>ida,uu=3+(volta?ida*2-d:d),para=Math.sin(s*.9+k)>.55
    const p=em(uu,v);return{...p,heading:para?q.yawV:volta?q.yawU+Math.PI:q.yawU,speed:para?0:vel,distance:s*vel}})
  }
  for(let k=0;k<3;k++){const p=em(u0+passo*(1+k*1.6),.3);pessoa('escolhendo-'+k,'feira',['older-woman','adult-woman','fuller-man'][k],undefined,parado(p.x,p.z,q.yawV))}
 }

 // 📰 BANCA DE JORNAL ──────────────────────────────────────────────────────────────────────────────────────────────────
 const banca=new THREE.Group();banca.name='banca-de-jornal';root.add(banca)
 let capa:THREE.CanvasTexture|undefined,letreiro:THREE.CanvasTexture|undefined,capaKey='',ultimoCapa:{gf:number;ga:number}|null|undefined=null
 const desenhaCapa=(ultimo:{gf:number;ga:number}|null|undefined)=>{
  if(!capa)return
  const en=getLang()==='en',m=mancheteDaBanca(ultimo,input.clubName,en),key=JSON.stringify([m,en])
  if(key===capaKey)return;capaKey=key
  const c=capa.image as HTMLCanvasElement,g=c.getContext('2d');if(!g)return
  const W=c.width,H=c.height
  g.fillStyle=CREME;g.fillRect(0,0,W,H);g.strokeStyle=TINTA;g.lineWidth=10;g.strokeRect(5,5,W-10,H-10)
  g.fillStyle=TINTA;g.textAlign='center';g.textBaseline='alphabetic'
  g.font=`900 58px ${FONTE}`;g.fillText('O MARTELO',W/2,80,W-34)
  g.fillRect(22,94,W-44,5);g.font=`700 17px ${FONTE}`;g.fillText(m.chapeu,W/2,120,W-40);g.fillRect(22,130,W-44,2)
  g.font=`900 50px ${FONTE}`;const linhas=quebra(g,m.titulo,W-40);linhas.forEach((l,i)=>g.fillText(l,W/2,192+i*54,W-36))
  const y=192+linhas.length*54-14
  g.fillStyle=OURO;g.fillRect(22,y,W-44,40);g.fillStyle=TINTA;g.font=`700 19px ${FONTE}`;g.fillText(m.linha.toUpperCase().slice(0,30),W/2,y+27,W-56)
  // "fotinho" da matéria: gramado e uma bola, sem rosto de ninguém
  g.fillStyle=VERDE;g.fillRect(22,y+54,W-44,H-y-80);g.fillStyle='#ffffff';g.beginPath();g.arc(W/2,y+54+(H-y-80)/2,14,0,Math.PI*2);g.fill()
  capa.needsUpdate=true
 }
 const desenhaLetreiro=()=>{
  if(!letreiro)return
  const c=letreiro.image as HTMLCanvasElement,g=c.getContext('2d');if(!g)return
  g.fillStyle='#173b29';g.fillRect(0,0,c.width,c.height);g.fillStyle=OURO;g.font=`900 34px ${FONTE}`;g.textAlign='center';g.textBaseline='middle'
  g.fillText(getLang()==='en'?'NEWSPAPERS · MAGAZINES':'JORNAIS · REVISTAS',c.width/2,c.height/2+2,c.width-24);letreiro.needsUpdate=true
 }
 let letreiroLang=''
 if(lugares.banca){
  const b=lugares.banca,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),sx=Math.cos(b.yaw),sz=-Math.sin(b.yaw)
  const at=(s:number,f:number)=>({x:b.x+sx*s+fx*f,z:b.z+sz*s+fz*f}),y0=QUADRA_Y
  const verde='#1f4a33',caixas:Caixa[]=[],W=2.8,D=1.8,H=2.5
  const parede=(s:number,f:number,w:number,h:number,d:number,y:number,c=verde)=>{const p=at(s,f);caixas.push({...p,y:y0+y,w,h,d,yaw:b.yaw,c})}
  parede(0,-D/2,W,H,.08,H/2)                       // fundo
  for(const s of [-1,1])parede(s*W/2,0,.08,H,D,H/2) // laterais
  parede(0,0,W+.5,.14,D+.7,H+.07,'#173b29')         // telhado com aba
  parede(0,D/2-.05,W,.95,.1,.475)                   // balcão da frente
  parede(0,D/2+.02,W+.02,.06,.24,.97,'#d9d4c8')     // tampo do balcão
  parede(0,0,W-.1,.04,D-.1,.02,'#5a5048')           // piso
  parede(0,D/2+.22,W+.5,.05,.6,H-.25,'#2a6a46')     // toldinho
  for(let k=0;k<6;k++)parede(-1.1+k*.44,D/2+.02,.34,.03,.24,1.015,['#f4ecd6','#ffffff','#f4ecd6','#e8e0c9','#ffffff','#f4ecd6'][k]) // jornais dobrados no balcão
  // revistas penduradas nas laterais e no varal da frente (cores variadas, sem marca de ninguém)
  const revistas:Caixa[]=[]
  for(const s of [-1,1])for(let r=0;r<3;r++)for(let k=0;k<4;k++){const p=at(s*(W/2+.05),-D/2+.3+k*.4);revistas.push({...p,y:y0+1.15+r*.42,w:.02,h:.36,d:.3,yaw:b.yaw,c:REVISTAS[(r*4+k+(s>0?5:0))%REVISTAS.length]})}
  for(let k=0;k<7;k++){const p=at(-1.2+k*.4,D/2+.08);revistas.push({...p,y:y0+2.05,w:.3,h:.36,d:.02,yaw:b.yaw,c:REVISTAS[(k*2+1)%REVISTAS.length]})}
  // o cavalete d'O MARTELO na calçada, de frente pra rua
  for(const s of [-.42,.42]){const p=at(1.95+s,D/2+.75);caixas.push({...p,y:y0+.7,w:.05,h:1.4,d:.05,yaw:b.yaw,c:'#6b4a2a',pitch:-.12})}
  banca.add(lote('banca-pecas',caixas),lote('banca-revistas',revistas))
  capa=canvasTex(256,352,()=>{});textures.add(capa)
  {const p=at(1.95,D/2+.79),s=new THREE.Mesh(plano,mat({map:capa,roughness:.9}));s.name='banca-capa-o-martelo';s.position.set(p.x,y0+.95,p.z);s.rotation.set(-.12,b.yaw,0,'YXZ');s.scale.set(.9,1.24,1);banca.add(s)}
  letreiro=canvasTex(512,64,()=>{});textures.add(letreiro)
  {const p=at(0,D/2+.53),s=new THREE.Mesh(plano,mat({map:letreiro,roughness:.9}));s.name='banca-letreiro';s.position.set(p.x,y0+H+.15,p.z);s.rotation.y=b.yaw;s.scale.set(W+.4,.38,1);banca.add(s)}
  desenhaLetreiro();letreiroLang=getLang();desenhaCapa(null)
  // a fonte Oswald pode chegar depois do primeiro desenho: redesenha quando ela estiver pronta
  try{document.fonts?.ready.then(()=>{if(!capa)return;capaKey='';desenhaCapa(ultimoCapa);desenhaLetreiro();input.onReady()}).catch(()=>{})}catch{/* sem FontFaceSet */}
  {const p=at(0,-.1);pessoa('jornaleiro','banca','older-man','#e8e0c9',parado(p.x,p.z,b.yaw))}
 }

 // ⚽ CAMPINHO DE TERRA ────────────────────────────────────────────────────────────────────────────────────────────────
 const campinho=new THREE.Group();campinho.name='campinho-de-terra';root.add(campinho)
 const LX=8.6,LZ=5.4 // meio comprimento e meia largura do campinho (cabe na praça de 23 m)
 let bolaMesh:THREE.Mesh|undefined
 const bolaEm=(s:number,c:P)=>({x:c.x+Math.sin(s*.47)*Math.cos(s*.13)*(LX-1.6)+Math.sin(s*1.9)*.6,z:c.z+Math.sin(s*.71+1)*(LZ-1.3)})
 if(lugares.campinho){
  const c=lugares.campinho
  const terra=canvasTex(256,160,g=>{
   g.fillStyle='#b07a45';g.fillRect(0,0,256,160)
   for(let i=0;i<1400;i++){const r=hash('t'+i);g.fillStyle=['rgba(140,92,50,.55)','rgba(196,146,92,.5)','rgba(150,100,56,.45)','rgba(205,160,104,.45)'][r%4];g.fillRect(r%256,(r>>>8)%160,1+(r>>>16)%2,1)}
   // tufos de mato na beira e no meio do terrão, onde ninguém pisa
   g.fillStyle='rgba(104,140,62,.7)';for(let i=0;i<140;i++){const r=hash('g'+i),x=r%256,borda=(r>>>9)%4;const y=borda===0?(r>>>12)%10:borda===1?150+(r>>>12)%10:(r>>>12)%160;const xx=borda>1?((r>>>20)%2?(r>>>11)%14:242+(r>>>11)%14):x;g.fillRect(xx,y,2,2)}
   // as duas "pequenas áreas" gastas na frente dos gols e o círculo do meio marcado no pé
   g.fillStyle='rgba(118,74,38,.5)';for(const x of [20,236]){g.beginPath();g.ellipse(x,80,20,28,0,0,Math.PI*2);g.fill()}
   g.strokeStyle='rgba(236,214,170,.55)';g.lineWidth=2;g.beginPath();g.arc(128,80,18,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(128,8);g.lineTo(128,152);g.stroke()
  });textures.add(terra)
  const chao=new THREE.Mesh(plano,mat({map:terra,roughness:1}));chao.name='campinho-terra';chao.rotation.x=-Math.PI/2;chao.position.set(c.x,CAMPO_Y,c.z);chao.scale.set(LX*2+2,LZ*2+2,1);chao.receiveShadow=true;campinho.add(chao)
  const caixas:Caixa[]=[]
  // trave de madeira num lado (dois paus e o travessão) …
  for(const s of [-1,1])caixas.push({x:c.x-LX,y:CAMPO_Y+.8,z:c.z+s*1.5,w:.12,h:1.6,d:.12,yaw:0,c:'#8a5a2b'})
  caixas.push({x:c.x-LX,y:CAMPO_Y+1.62,z:c.z,w:.12,h:.12,d:3.12,yaw:0,c:'#7a4e24'})
  // … e no outro, o gol marcado com dois pares de chinelo
  for(const s of [-1,1])for(const k of [-.07,.07])caixas.push({x:c.x+LX+k*1.2,y:CAMPO_Y+.02,z:c.z+s*1.4+k,w:.26,h:.025,d:.1,yaw:s*.3+k*4,c:s>0?'#2F6FB5':'#ffffff'})
  // mochilas e garrafinha largadas na beira
  caixas.push({x:c.x-2,y:CAMPO_Y+.18,z:c.z+LZ+.7,w:.35,h:.36,d:.22,yaw:.3,c:'#C2452F'},{x:c.x-1.4,y:CAMPO_Y+.18,z:c.z+LZ+.8,w:.35,h:.36,d:.22,yaw:-.2,c:'#2F6FB5'},{x:c.x-.9,y:CAMPO_Y+.14,z:c.z+LZ+.6,w:.09,h:.28,d:.09,yaw:0,c:'#cfe08a'})
  campinho.add(lote('campinho-pecas',caixas))
  bolaMesh=new THREE.Mesh(own(new THREE.IcosahedronGeometry(.13,1)),mat({color:'#ffffff',roughness:.6}));bolaMesh.name='campinho-bola';bolaMesh.visible=false;campinho.add(bolaMesh)
  // 10 moleques: um goleiro em cada lado e o resto atrás da bola, cada um com seu atraso e seu jeito
  for(let i=0;i<10;i++){
   const lado=i%2?1:-1,camisa=i%2?'#f4ecd6':'#C2452F'
   pessoa('moleque-'+i,'pelada',i%3===2?'child-girl':'child-boy',i<2?'#3a3a3a':camisa,s=>{
    const b=bolaEm(s,c)
    let x:number,z:number
    if(i<2){x=c.x+(i?LX-.6:-LX+.6);z=c.z+Math.max(-1.3,Math.min(1.3,(b.z-c.z)*.35))}
    else{
     const lag=.25+i*.12,bb=bolaEm(s-lag,c),r=.6+(i%4)*.7,ang=s*(.5+i*.07)+i
     x=bb.x+Math.cos(ang)*r+lado*(i%3)*.5;z=bb.z+Math.sin(ang)*r*.7
    }
    x=Math.max(c.x-LX+.3,Math.min(c.x+LX-.3,x));z=Math.max(c.z-LZ+.3,Math.min(c.z+LZ-.3,z))
    return{x,z,heading:Math.atan2(b.x-x,b.z-z),speed:i<2?.25:1.8,distance:s*(i<2?.3:2.1)}})
  }
 }

 // pessoas: posição, LOD e o mesmo "sem sombra nova" da cidade viva
 let vida:VidaBairro=vidaDoBairro(),enabled=false,mobile=false,cfgKey=''
 function configure(cidade:CidadeViva|undefined,journey:JornadaComplexo|undefined,opts:{mobile:boolean;enabled:boolean}){
  enabled=opts.enabled;mobile=opts.mobile
  const jogo=journey?.hosting&&journey.phase!=='idle'&&journey.kickoffTime?Number(journey.kickoffTime.slice(0,2)):undefined
  const key=JSON.stringify([cidade?.dia,cidade?.hora,jogo,journey?.period,cidade?.temporada,cidade?.rodada,cidade?.placar,getLang()])
  if(key===cfgKey)return;cfgKey=key
  vida=vidaDoBairro({dia:cidade?.dia,hora:jogo??cidade?.hora,luz:journey?.period,temporada:cidade?.temporada,rodada:cidade?.rodada})
  feira.visible=vida.feira
  ultimoCapa=cidade?.placar??null;desenhaCapa(ultimoCapa)
  if(letreiroLang!==getLang()){letreiroLang=getLang();desenhaLetreiro()}
 }
 function update(seconds:number,camera?:THREE.Camera,height=720){
  const ativo={feira:enabled&&vida.feira,banca:true,pelada:enabled&&vida.pelada}
  if(bolaMesh&&lugares.campinho){bolaMesh.visible=ativo.pelada;if(ativo.pelada){const b=bolaEm(seconds,lugares.campinho);bolaMesh.position.set(b.x,CAMPO_Y+.13+Math.abs(Math.sin(seconds*3.1))*.32,b.z);bolaMesh.rotation.set(seconds*4,seconds*2.3,0)}}
  let moleques=0
  for(const p of pessoas){
   let on=ativo[p.grupo]
   if(on&&p.grupo==='pelada'){moleques++;if(mobile&&moleques>8)on=false} // celular: 8 moleques (6 de linha + 2 goleiros)
   const pose=on?p.pose(seconds):undefined
   if(pose){p.body.root.position.set(pose.x,p.grupo==='feira'?ESTRADA_Y:p.grupo==='banca'?QUADRA_Y:CAMPO_Y,pose.z);p.body.root.rotation.y=pose.heading}
   const lod=pose?residentVisibility(p.body.root.position,p.grupo==='pelada'?1.2:1.76,camera,height):{visible:false,detail:'far'}
   p.body.update({seconds,distance:pose?.distance??0,speed:pose?.speed??0,visible:lod.visible,detail:lod.detail})
   if(!p.semSombra&&p.body.root.children[0]?.children.length){p.body.root.traverse(o=>{o.castShadow=false});p.semSombra=true}
  }
 }
 /** câmera de cada lugar (alvo e posição); `aspect` < .85 = celular em pé, afasta um pouco */
 function vista(kind:VistaTradicao,aspect:number):{target:[number,number,number];camera:[number,number,number]}|undefined{
  const k=aspect<.85?1.45:1
  if(kind==='feira'&&lugares.feira){const q=quadroDaRua(lugares.feira),m=q.at(q.L*.45,1.2),o=q.at(-3-3.2*k,-2.4);return{target:[m.x,.9,m.z],camera:[o.x,3.2+2.4*k,o.z]}} // da esquina, olhando a rua da feira inteira
  if(kind==='banca'&&lugares.banca){const b=lugares.banca,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),sx=Math.cos(b.yaw),sz=-Math.sin(b.yaw),tx=b.x+fx*1.3+sx*.8,tz=b.z+fz*1.3+sz*.8;return{target:[tx,1.3,tz],camera:[tx+fx*6.6*k+sx*3*k,2.4+1.1*k,tz+fz*6.6*k+sz*3*k]}}
  if(kind==='campinho'&&lugares.campinho){const c=lugares.campinho;return{target:[c.x-1.5,.3,c.z],camera:[c.x+LX+9*k,4+5*k,c.z+5*k]}} // de trás do gol de chinelo, olhando o campinho todo
  return undefined
 }
 return{root,configure,update,vista,
  inspect:()=>({vida,lugares,feira:feira.visible,pelada:!!bolaMesh?.visible,capa:capaKey?JSON.parse(capaKey)[0]:null,pessoas:pessoas.filter(p=>p.body.root.visible).map(p=>p.grupo)}),
  dispose(){pessoas.forEach(p=>p.body.dispose());root.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose()});root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(x=>x.dispose())}}
}

/** Casca à prova de erro: se alguma coisa aqui quebrar, o mapa segue sem a feira/banca/campinho. */
export function criarTradicoesBairroSeguro(...args:Parameters<typeof criarTradicoesBairro>){
 let t:ReturnType<typeof criarTradicoesBairro>|undefined
 try{t=criarTradicoesBairro(...args)}catch(e){console.warn('tradições do bairro desligadas',e)}
 let quebrou=false
 const guarda=<A extends unknown[],R>(f:((...a:A)=>R)|undefined,fallback:R)=>(...a:A):R=>{if(!f||quebrou)return fallback;try{return f(...a)}catch(e){quebrou=true;console.warn('tradições do bairro desligadas',e);try{t!.root.visible=false}catch{/* nada */}return fallback}}
 return{configure:guarda(t?.configure,undefined),update:guarda(t?.update,undefined),vista:guarda(t?.vista,undefined),inspect:guarda(t?.inspect,null),dispose:()=>{try{t?.dispose()}catch{/* nada */}}}
}
