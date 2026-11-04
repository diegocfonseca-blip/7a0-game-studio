import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {activityRoute,type CityPoint} from './cidade3d/activity-route.mjs'
import {vendorDelivery} from './cidade3d/vendor-delivery.mjs'
import {stadiumDayClock} from './cidade3d/stadium-day.mjs'
import {stadiumExteriorVisible} from './cidade3d/matchday-plan.mjs'
import {criarPeruasAmbulantes} from './presidencia-perua-ambulante'
import {acelerarRaios} from './presidencia-raio-rapido'
import {PLANTA_COMPLEXO,caminhosTorcidaComplexo,deslocarCaminhoComplexo,type EstadoComplexo} from './presidencia-complexo-model'
import type {AssentoComplexo} from './presidencia-complexo-arquitetura'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {getLang} from './lang'
import {tipoFinalDaPartida,ladoDoUsuario,desfechoDaFinal,corDoPodio,faixaDaFinal,faixaDaFachada,publicoExtraDaFinal,quadroDaFesta,elencoDaFesta,FESTA_FINAL,temaDaFesta,placaDoPodio,coreografiaDaFesta,quemLevantaATaca,fotografosDaFesta,flashAceso,type VagaFesta,type DesfechoFinal,type TipoFinal,type LadoFinal} from './presidencia-complexo-final-regras'

/** 🏆 DIA DE FINAL no mapa 3D (03/11, aprovado pelo Diego: "ok"). Tudo num arquivo só, pra não brigar com quem mexe no mapa:
 *  · ANTES: avião puxando a faixa "FINAL · A × B", barracas de bandeira/faixa da final (as peruas de ambulante de sempre),
 *    o dobro de gente chegando (no teto da cidade) e fumaça colorida na porta; faixa gigante "FINAL" na fachada.
 *  · DURANTE: bandeirões nas arquibancadas e sinalizador na torcida do usuário quando sai gol DELE.
 *  · DEPOIS DO APITO (só com o jogo encerrado — nada de spoiler): campeão = fogos + pódio no meio do campo com a taça,
 *    papel picado e fumaça nas cores do clube; perdeu = sem fogos, o pódio é do rival e os seus saem cabisbaixos.
 * Barato de propósito: nada é criado em dia normal; peças instanciadas, texturas pequenas, nenhuma luz e nenhuma sombra nova.
 * Só anda quando o mapa já está desenhando (toque, jogo ou os 45 s depois do apito). */

export type TimeDiaFinal={name?:string;color?:string}
export type DadosDiaFinal={
 match?:EstadoPartidaEstadio
 journey?:JornadaComplexo
 teams:readonly TimeDiaFinal[]
 /** o quadro do motor do campo (é dele que a torcida já tira o "gol!") */
 frame?:unknown
 subjects?:readonly {mx:number;mz:number;side?:'home'|'away';visible?:boolean;keeper?:boolean}[]
 /** quantas pessoas a cidade já tem na rua (pra dobrar sem furar o teto) */
 residents:number
 mobile:boolean
 /** relógio da cidade (o mesmo das barracas do dia de jogo) */
 seconds:number
}
type Civil=ReturnType<typeof createCivilian>
type Frame={phase?:string;replay?:boolean;official?:{events?:{tipo:string;lado:number}[]}}

const OURO='#FFC400',CREME='#F4ECD6',TINTA='#0C0C0C'
const FONTE='"Oswald","Arial Narrow",Impact,sans-serif'
const hex=(c:unknown,fallback:string)=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c:fallback
const clamp01=(x:number)=>Math.max(0,Math.min(1,x))
const suave=(x:number)=>{x=clamp01(x);return x*x*(3-2*x)}
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
const rnd=(seed:number)=>()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=t+Math.imul(t^(t>>>7),61|t)^t;return((t^(t>>>14))>>>0)/4294967296}

export function criarDiaDeFinal(scene:THREE.Scene,state:EstadoComplexo,seats:readonly AssentoComplexo[],onChange:()=>void=()=>{}){
 const root=new THREE.Group();root.name='complexo-dia-final';root.visible=false;scene.add(root)
 // Tudo que é construído num dia de final mora aqui e some junto (dispose) quando o dia acaba.
 let dia:ReturnType<typeof montarDia>|null=null,diaKey=''
 let relogio=0,ultimo=0,lastCamera:THREE.Camera|undefined,lastHeight=720
 const english=()=>getLang()==='en'

 // Chão: o mesmo jeito do dia de jogo (raio no piso do bairro, com cache) — só calcula quando há final.
 let chao:((x:number,z:number)=>number)|undefined
 const ground=(x:number,z:number)=>{
  if(!chao){
   const meshes:THREE.Mesh[]=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica'])scene.getObjectByName(name)?.traverse(n=>{if(n instanceof THREE.Mesh&&!(n instanceof THREE.SkinnedMesh)&&!(n instanceof THREE.InstancedMesh))meshes.push(n)})
   scene.updateMatrixWorld(true);acelerarRaios(meshes);const ray=new THREE.Raycaster(),normal=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0),cache=new Map<string,number>()
   chao=(x,z)=>{const key=x.toFixed(2)+':'+z.toFixed(2);const hit0=cache.get(key);if(hit0!==undefined)return hit0;ray.set(new THREE.Vector3(x,.6,z),down);ray.far=1;const hit=ray.intersectObjects(meshes,false).find(h=>h.point.y<.27&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5);const y=hit?.point.y??0;cache.set(key,y);return y}
  }
  return chao(x,z)
 }
 const medir=(points:readonly {x:number;z:number}[]):CityPoint[]=>{const out:CityPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.8));for(let j=i===1?0:1;j<=n;j++){const u=j/n,x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u;out.push({x,z,y:ground(x,z)})}}return out}

 function montarDia(tipo:TipoFinal,teams:readonly TimeDiaFinal[],mobile:boolean,residents:number,seed:number){
  const g=new THREE.Group();g.name='final-'+tipo;root.add(g)
  const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),texs=new Set<THREE.Texture>(),civis:Civil[]=[]
  const geo=<T extends THREE.BufferGeometry>(x:T)=>{geos.add(x);return x}
  const mat=<T extends THREE.Material>(x:T)=>{mats.add(x);return x}
  const corA=hex(teams[0]?.color,'#1B7A3D'),corB=hex(teams[1]?.color,'#C2452F')
  const tela=(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void)=>{
   const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d')!;draw(c)
   const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;texs.add(t)
   // a Oswald pode chegar depois: redesenha uma vez quando ela carregar (a faixa nunca fica sem texto)
   document.fonts?.load(`900 40px ${FONTE}`).then(()=>{c.clearRect(0,0,w,h);draw(c);t.needsUpdate=true;onChange()}).catch(()=>{})
   return t
  }
  const texto=(c:CanvasRenderingContext2D,s:string,x:number,y:number,size:number,maxW:number,cor:string,contorno?:string)=>{
   c.font=`900 ${size}px ${FONTE}`;c.textAlign='center';c.textBaseline='middle'
   if(contorno){c.lineJoin='round';c.lineWidth=size*.16;c.strokeStyle=contorno;c.strokeText(s,x,y,maxW)}
   c.fillStyle=cor;c.fillText(s,x,y,maxW)
  }
  const faixa=faixaDaFinal(teams)

  // ✈️ AVIÃO com a faixa (uma arte só, os dois lados legíveis)
  const aviao=new THREE.Group();aviao.name='final-aviao';g.add(aviao);aviao.visible=false
  {
   const branco=mat(new THREE.MeshStandardMaterial({color:'#f3efe4',roughness:.5,metalness:.1})),vermelho=mat(new THREE.MeshStandardMaterial({color:'#C2452F',roughness:.6})),vidro=mat(new THREE.MeshStandardMaterial({color:'#24363d',roughness:.2,metalness:.4}))
   const corpo=new THREE.Mesh(geo(new THREE.CapsuleGeometry(.7,5.2,4,10)),branco);corpo.rotation.z=Math.PI/2;aviao.add(corpo)
   const faixaCorpo=new THREE.Mesh(geo(new THREE.CylinderGeometry(.72,.72,1.1,10,1,true)),vermelho);faixaCorpo.rotation.z=Math.PI/2;faixaCorpo.position.x=-.8;aviao.add(faixaCorpo)
   const cabine=new THREE.Mesh(geo(new THREE.SphereGeometry(.55,10,6,0,Math.PI*2,0,Math.PI/2)),vidro);cabine.position.set(1.2,.45,0);cabine.scale.set(1.6,.8,1);aviao.add(cabine)
   const asa=new THREE.Mesh(geo(new THREE.BoxGeometry(1.5,.12,10.5)),branco);asa.position.set(.6,.35,0);aviao.add(asa)
   for(const s of [-1,1]){const ponta=new THREE.Mesh(geo(new THREE.BoxGeometry(1.5,.13,.8)),vermelho);ponta.position.set(.6,.35,s*4.9);aviao.add(ponta)}
   const leme=new THREE.Mesh(geo(new THREE.BoxGeometry(1.1,1.5,.12)),vermelho);leme.position.set(-3.1,.9,0);aviao.add(leme)
   const estab=new THREE.Mesh(geo(new THREE.BoxGeometry(.9,.1,3.4)),branco);estab.position.set(-3.1,.25,0);aviao.add(estab)
   const helice=new THREE.Mesh(geo(new THREE.BoxGeometry(.08,2.2,.18)),mat(new THREE.MeshStandardMaterial({color:'#333'})));helice.position.x=3.35;helice.name='final-helice';aviao.add(helice)
   // A faixa: creme, borda preta grossa, letras em tinta e as cores dos dois times nas pontas (identidade do jogo)
   const W=1024,H=150
   const tx=tela(W,H,c=>{c.fillStyle=CREME;c.fillRect(0,0,W,H);c.fillStyle=corA;c.fillRect(0,0,56,H);c.fillStyle=corB;c.fillRect(W-56,0,56,H);c.fillStyle=OURO;c.fillRect(56,H-20,W-112,10);c.lineWidth=10;c.strokeStyle=TINTA;c.strokeRect(5,5,W-10,H-10);texto(c,faixa,W/2,H/2-4,96,W-150,TINTA)})
   const larg=30,alt=larg*H/W,pano=mat(new THREE.MeshBasicMaterial({map:tx,side:THREE.FrontSide,fog:true}))
   const banner=new THREE.Group();banner.name='final-faixa-aviao';aviao.add(banner);banner.position.set(-5.5-larg/2,-.6,0)
   const frente=new THREE.Mesh(geo(new THREE.PlaneGeometry(larg,alt,8,1)),pano);banner.add(frente)
   // o verso é a mesma arte virada: quem olha do outro lado também lê a faixa (sem texto espelhado)
   const verso=new THREE.Mesh(frente.geometry,pano);verso.rotation.y=Math.PI;verso.position.z=-.02;banner.add(verso)
   const cabo=new THREE.Line(geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.4,0,0),new THREE.Vector3(-5.5,-.6+alt/2,0),new THREE.Vector3(-3.4,0,0),new THREE.Vector3(-5.5,-.6-alt/2,0)])),mat(new THREE.LineBasicMaterial({color:'#222'})));aviao.add(cabo)
   aviao.userData.banner=banner
  }
  // rota: cruza o bairro na diagonal e passa por cima do estádio (e da praça da entrada)
  const voo={de:new THREE.Vector3(-300,40,190),para:new THREE.Vector3(300,40,-70),dur:20}
  const vooDir=voo.para.clone().sub(voo.de).normalize(),vooYaw=Math.atan2(-vooDir.z,vooDir.x)

  // 🏟️ FAIXA GIGANTE "FINAL" na fachada, por cima da entrada da torcida
  const gate=PLANTA_COMPLEXO.gates.home
  const fachada=new THREE.Group();fachada.name='final-faixa-fachada';g.add(fachada)
  {
   const f=faixaDaFachada(tipo,english()),W=1024,H=320
   const tx=tela(W,H,c=>{c.fillStyle=CREME;c.fillRect(0,0,W,H);c.fillStyle=corA;c.fillRect(0,0,W/2,26);c.fillStyle=corB;c.fillRect(W/2,0,W/2,26);c.fillStyle=corA;c.fillRect(0,H-26,W/2,26);c.fillStyle=corB;c.fillRect(W/2,H-26,W/2,26);c.lineWidth=14;c.strokeStyle=TINTA;c.strokeRect(7,7,W-14,H-14);texto(c,f.topo,W/2,72,54,W-120,TINTA);texto(c,f.grande,W/2,190,190,W-120,OURO,TINTA)})
   const larg=21,alt=larg*H/W
   const pano=new THREE.Mesh(geo(new THREE.PlaneGeometry(larg,alt)),mat(new THREE.MeshStandardMaterial({map:tx,roughness:.85})))
   pano.position.set(gate.threshold.x,gate.height+alt/2+1.2,gate.threshold.z+.35);pano.rotation.y=gate.heading;fachada.add(pano)
   fachada.userData.pano=pano
  }

  // 🛒 BARRACAS de faixa/bandeira da final: duas, entre as do dia de jogo, com a perua de ambulante de sempre
  const bandeirinha=(a:string,b:string)=>tela(256,160,c=>{c.fillStyle=a;c.fillRect(0,0,256,80);c.fillStyle=b;c.fillRect(0,80,256,80);c.lineWidth=8;c.strokeStyle=TINTA;c.strokeRect(4,4,248,152);texto(c,'FINAL',128,82,74,236,'#FFFFFF',TINTA)})
  const flagA=bandeirinha(corA,corB),flagB=bandeirinha(corB,corA)
  const barracas=[{id:'final-bandeiras-a',kind:'flags',x:-26,z:106,cor:corA},{id:'final-bandeiras-b',kind:'flags',x:26,z:106,cor:corB}].map((spec,i)=>{
   const grp=new THREE.Group();grp.name='final-barraca-'+i;grp.position.set(spec.x,ground(spec.x,spec.z),spec.z);g.add(grp)
   const tinta=mat(new THREE.MeshStandardMaterial({color:spec.cor,roughness:.85,side:THREE.DoubleSide})),madeira=mat(new THREE.MeshStandardMaterial({color:'#90613c',roughness:.9})),aco=mat(new THREE.MeshStandardMaterial({color:'#6c7370',roughness:.5,metalness:.6}))
   const caixa=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{const o=new THREE.Mesh(geo(new THREE.BoxGeometry(w,h,d)),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;grp.add(o);return o}
   caixa(tinta,0,.68,0,1.9,.64,.94);caixa(aco,0,1.04,0,2.1,.11,1.05)
   for(const x of [-1.08,1.08])for(const z of [-.65,.65]){const p=new THREE.Mesh(geo(new THREE.CylinderGeometry(.035,.035,2.7,6)),madeira);p.position.set(x,1.5,z);grp.add(p)}
   const lona=new THREE.Mesh(geo(new THREE.BoxGeometry(2.8,.08,2)),tinta);lona.position.set(0,2.86,0);lona.rotation.x=.08;grp.add(lona)
   // varal com 4 bandeiras da final (as duas combinações de cor)
   const varal=new THREE.Mesh(geo(new THREE.CylinderGeometry(.02,.02,2.1,5)),aco);varal.rotation.z=Math.PI/2;varal.position.set(0,2.45,.62);grp.add(varal)
   const bGeo=geo(new THREE.PlaneGeometry(.5,.32))
   const panos=[mat(new THREE.MeshStandardMaterial({map:flagA,roughness:.9,side:THREE.DoubleSide})),mat(new THREE.MeshStandardMaterial({map:flagB,roughness:.9,side:THREE.DoubleSide}))]
   for(let k=0;k<4;k++){const b=new THREE.Mesh(bGeo,panos[(k+i)%2]);b.position.set(-.78+k*.52,2.27,.63);grp.add(b)}
   // cachecóis enrolados no balcão
   for(let k=0;k<5;k++){const r=new THREE.Mesh(geo(new THREE.CylinderGeometry(.07,.07,.42,8)),k%2?panos[0]:panos[1]);r.rotation.z=Math.PI/2;r.position.set(-.7+k*.35,1.16,.15);grp.add(r)}
   const placa=tela(512,96,c=>{c.fillStyle=TINTA;c.fillRect(0,0,512,96);texto(c,english()?'FINAL FLAGS':'BANDEIRAS DA FINAL',256,50,56,490,OURO)})
   const pl=new THREE.Mesh(geo(new THREE.PlaneGeometry(2.4,.45)),mat(new THREE.MeshBasicMaterial({map:placa,side:THREE.DoubleSide,fog:true})));pl.position.set(0,3.15,.9);grp.add(pl)
   // (só a da esquerda vem de perua: do lado direito a curva da perua não cabe entre as barracas de sempre — essa é de carrinho)
   let entrega:ReturnType<typeof vendorDelivery>=null
   if(i===0)try{entrega=vendorDelivery({id:spec.id,kind:spec.kind,x:spec.x,z:spec.z},6,(x,z)=>ground(x,z))}catch{entrega=null}
   const vendedor=createCivilian(g,{id:'final-vendedor-'+i,outfitColor:spec.cor,variant:i?'adult-woman':'adult-man',deferUntilVisible:true});civis.push(vendedor)
   return{grp,entrega,vendedor}
  })
  const peruas=criarPeruasAmbulantes(g,['#e9e1c9'])
  const relogioDia=stadiumDayClock()

  // 🚶 O DOBRO DE GENTE chegando (no teto de celular/PC da cidade), metade de cada torcida, pelos portões de verdade
  const extra=publicoExtraDaFinal({base:residents,mobile})
  const rotas=caminhosTorcidaComplexo(state)
  const chegando=Array.from({length:extra},(_,i)=>{
   const lado:LadoFinal=i%2&&state.progress.visitante>0?'away':'home'
   const pts=lado==='home'?rotas.home.filter(p=>p.z>=80):rotas.away.filter(p=>p.x>=100)
   const desloc=((i>>1)%3-1)*1.3+(lado==='home'?3.4:-1.6)
   const rota=activityRoute(medir(deslocarCaminhoComplexo(pts,desloc)),1.15+(i%3)*.08)
   const corpo=createCivilian(g,{id:'final-torcedor-'+i,outfitColor:lado==='home'?corA:corB,deferUntilVisible:true});civis.push(corpo)
   return{lado,rota,corpo,atraso:(i>>1)*3.1+(i%2)*1.4,fora:true}
  })

  // 💨 FUMAÇA (um lote só, reaproveitado: porta antes do jogo, sinalizador, pódio)
  const N_FUMACA=mobile?48:84
  const fumaca=new THREE.InstancedMesh(geo(new THREE.IcosahedronGeometry(1,1)),mat(new THREE.MeshBasicMaterial({transparent:true,opacity:.34,depthWrite:false,fog:true})),N_FUMACA)
  fumaca.name='final-fumaca';fumaca.frustumCulled=false;fumaca.instanceMatrix.setUsage(THREE.DynamicDrawUsage);g.add(fumaca)
  fumaca.setColorAt(0,new THREE.Color('#fff'));fumaca.instanceColor!.setUsage(THREE.DynamicDrawUsage)

  // 🔥 SINALIZADOR (bolinha acesa) — na torcida do usuário, só no gol DELE
  const N_SINAL=mobile?4:7
  const sinal=new THREE.InstancedMesh(geo(new THREE.SphereGeometry(.32,8,6)),mat(new THREE.MeshBasicMaterial({color:'#ff4d1f',toneMapped:false,fog:true})),N_SINAL)
  sinal.name='final-sinalizador';sinal.frustumCulled=false;sinal.instanceMatrix.setUsage(THREE.DynamicDrawUsage);g.add(sinal);sinal.count=0
  const ladoAssento=(s:AssentoComplexo):LadoFinal=>s.supporterSide??(s.sector==='visitante'?'away':'home')
  const espalhados=(lado:LadoFinal,n:number,salt:number)=>{
   const lista=seats.filter(s=>ladoAssento(s)===lado&&s.tier==='lower'&&s.row>=2&&s.row<=8&&s.sector!=='camarote')
   if(!lista.length)return [] as AssentoComplexo[]
   const ordem=[...lista].sort((a,b)=>Math.atan2(a.position.z-6,a.position.x)-Math.atan2(b.position.z-6,b.position.x))
   return Array.from({length:Math.min(n,ordem.length)},(_,k)=>ordem[Math.floor((k+.5+((hash(salt+':'+k)%100)/400))*ordem.length/n)%ordem.length])
  }
  const sinalAssentos={home:espalhados('home',N_SINAL,1),away:espalhados('away',N_SINAL,2)}

  // 🚩 BANDEIRÕES (poucas peças, um lote; o balanço é no próprio desenho, sem conta por quadro)
  const nBand=mobile?4:6
  const listra=tela(128,64,c=>{for(let k=0;k<8;k++){c.fillStyle=k%2?'#ffffff':'#c9c9c9';c.fillRect(k*16,0,16,64)}c.fillStyle='#ffffff';c.fillRect(0,26,128,12)})
  const bandMat=mat(new THREE.MeshStandardMaterial({map:listra,roughness:.9,side:THREE.DoubleSide}))
  const ondaU={value:0}
  bandMat.onBeforeCompile=sh=>{sh.uniforms.uOnda=ondaU;sh.vertexShader='uniform float uOnda;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z+=sin(position.x*.55+uOnda*2.1+position.y*.4)*.32+sin(position.x*1.3-uOnda*3.)*.12;')}
  bandMat.customProgramCacheKey=()=>'final-bandeirao'
  const band=new THREE.InstancedMesh(geo(new THREE.PlaneGeometry(10,6,10,4)),bandMat,nBand)
  band.name='final-bandeiroes';band.frustumCulled=false;g.add(band)
  {
   const casa=espalhados('home',Math.ceil(nBand*.66),3),fora=state.progress.visitante>0?espalhados('away',nBand-Math.ceil(nBand*.66),4):[]
   const todos=[...casa.map(s=>({s,cor:corA})),...fora.map(s=>({s,cor:corB}))].slice(0,nBand)
   const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler()
   todos.forEach(({s,cor},k)=>{e.set(-1.0,s.heading,0,'YXZ');q.setFromEuler(e);m.compose(new THREE.Vector3(s.position.x,s.position.y+s.seatHeight+1.5,s.position.z),q,new THREE.Vector3(1,1,1));band.setMatrixAt(k,m);band.setColorAt(k,new THREE.Color(cor))})
   band.count=todos.length;band.visible=false
  }

  // 🎆 FOGOS (pontos aditivos; a cor apaga sozinha = some no ar)
  const RAJ=mobile?4:6,POR=mobile?64:90,NF=RAJ*POR
  const pontoTx=tela(32,32,c=>{const gr=c.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,1)');gr.addColorStop(.75,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,32,32)})
  const fGeo=geo(new THREE.BufferGeometry()),fPos=new Float32Array(NF*6),fCor=new Float32Array(NF*8),fDir=new Float32Array(NF*3)
  const r0=rnd(seed)
  for(let i=0;i<NF;i++){const u=r0()*2-1,a=r0()*Math.PI*2,s=Math.sqrt(1-u*u),v=.75+r0()*.35;fDir[i*3]=s*Math.cos(a)*v;fDir[i*3+1]=u*v;fDir[i*3+2]=s*Math.sin(a)*v}
  fGeo.setAttribute('position',new THREE.BufferAttribute(fPos,3).setUsage(THREE.DynamicDrawUsage));fGeo.setAttribute('color',new THREE.BufferAttribute(fCor,4).setUsage(THREE.DynamicDrawUsage))
  // (final da Copa/Supercopa é quarta 21h: faísca que SOMA luz no céu escuro; a cor é a do campeão + dourado/vermelho/roxo do jogo)
  const fogos=new THREE.Points(fGeo,mat(new THREE.PointsMaterial({size:mobile?1.15:.95,map:pontoTx,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:false,toneMapped:false})))
  fogos.name='final-fogos';fogos.frustumCulled=false;fogos.visible=false;g.add(fogos)
  // (por cima do gramado, na altura da cobertura: cabe na tela de quem olha o pódio, até no celular em pé)
  const centros=Array.from({length:RAJ},(_,b)=>new THREE.Vector3((b/(RAJ-1)-.5)*30+(r0()-.5)*6,19+r0()*5,-20+r0()*12))

  // 🏆 PÓDIO + TAÇA + papel picado (montados só depois do apito, no meio do campo)
  const podio=new THREE.Group();podio.name='final-podio';podio.visible=false;g.add(podio)
  // 🎨 o pódio, o fundo, as luzes e as faixas com a cara da competição (temaDaFesta ← COMPS de competicoes-visual)
  const tema=temaDaFesta(tipo)
  const podioMat=mat(new THREE.MeshStandardMaterial({color:tema.podio,roughness:.6})),topoMat=mat(new THREE.MeshStandardMaterial({color:tema.tampo,roughness:.5,metalness:.3}))
  const degraus=[{x:0,h:1.25},{x:-3.1,h:.85},{x:3.1,h:.55}]
  for(const d of degraus){const b=new THREE.Mesh(geo(new THREE.BoxGeometry(3,d.h,2.4)),podioMat);b.position.set(d.x,d.h/2,0);b.castShadow=false;b.receiveShadow=true;podio.add(b);const t=new THREE.Mesh(geo(new THREE.BoxGeometry(3.06,.08,2.46)),topoMat);t.position.set(d.x,d.h+.04,0);podio.add(t)}
  let placaPodio:THREE.Mesh|undefined
  const tacaGrupo=new THREE.Group();tacaGrupo.name='final-taca';podio.add(tacaGrupo);tacaGrupo.visible=false
  // 🏆 cada competição com a SUA taça (04/11): a copa de sempre · Libertadores (o jogadorzinho em cima) · a orelhuda prateada · o anel do Mundial
  const cara=tema.cara
  {
   const prata=cara.forma==='orelhuda'
   const ouro=mat(new THREE.MeshStandardMaterial({color:cara.metal,metalness:.85,roughness:prata?.22:.28,emissive:new THREE.Color(prata?'#2a3140':'#3a2b00'),emissiveIntensity:.6}))
   const baseMat=mat(new THREE.MeshStandardMaterial({color:cara.base,roughness:.6}))
   const lathe=(pts:number[][])=>new THREE.Mesh(geo(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),16)),ouro)
   if(cara.forma==='copa'){
    tacaGrupo.add(lathe([[0,0],[.2,0],[.2,.06],[.08,.1],[.06,.28],[.1,.34],[.22,.42],[.27,.58],[.28,.72],[.25,.74],[0,.6]]))
    for(const s of [-1,1]){const alca=new THREE.Mesh(geo(new THREE.TorusGeometry(.12,.025,6,12,Math.PI)),ouro);alca.position.set(s*.28,.56,0);alca.rotation.z=s>0?-Math.PI/2:Math.PI/2;tacaGrupo.add(alca)}
    const base=new THREE.Mesh(geo(new THREE.CylinderGeometry(.16,.2,.1,12)),baseMat);base.position.y=.03;tacaGrupo.add(base)
   }else if(cara.forma==='liberta'){
    // pé de madeira com faixa dourada, taça e o jogadorzinho chutando em cima
    const pe=new THREE.Mesh(geo(new THREE.CylinderGeometry(.2,.25,.2,12)),baseMat);pe.position.y=.1;tacaGrupo.add(pe)
    const aro=new THREE.Mesh(geo(new THREE.CylinderGeometry(.205,.205,.05,12)),ouro);aro.position.y=.12;tacaGrupo.add(aro)
    const corpo=lathe([[0,.2],[.08,.2],[.06,.32],[.1,.38],[.2,.46],[.22,.6],[.2,.66],[0,.62]]);tacaGrupo.add(corpo)
    for(const s of [-1,1]){const alca=new THREE.Mesh(geo(new THREE.TorusGeometry(.09,.02,6,10,Math.PI)),ouro);alca.position.set(s*.22,.54,0);alca.rotation.z=s>0?-Math.PI/2:Math.PI/2;tacaGrupo.add(alca)}
    // (o jogadorzinho é a marca da taça: grande o bastante pra ler de longe, no celular)
    const cabeca=new THREE.Mesh(geo(new THREE.SphereGeometry(.075,10,8)),ouro);cabeca.position.set(0,1.06,0);tacaGrupo.add(cabeca)
    const tronco=new THREE.Mesh(geo(new THREE.CylinderGeometry(.05,.06,.24,8)),ouro);tronco.position.set(0,.88,0);tacaGrupo.add(tronco)
    for(const s of [-1,1]){const braco=new THREE.Mesh(geo(new THREE.CylinderGeometry(.022,.022,.18,6)),ouro);braco.position.set(s*.08,.9,0);braco.rotation.z=s*.9;tacaGrupo.add(braco)}
    const perna=new THREE.Mesh(geo(new THREE.CylinderGeometry(.028,.028,.2,6)),ouro);perna.position.set(.07,.72,0);perna.rotation.z=.6;tacaGrupo.add(perna)
    const perna2=new THREE.Mesh(geo(new THREE.CylinderGeometry(.028,.028,.18,6)),ouro);perna2.position.set(-.03,.71,0);tacaGrupo.add(perna2)
    const bola=new THREE.Mesh(geo(new THREE.SphereGeometry(.055,10,8)),mat(new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.5})));bola.position.set(.17,.66,0);tacaGrupo.add(bola)
   }else if(cara.forma==='orelhuda'){
    // a orelhuda: corpo alto e as duas alças GRANDES dos lados, pé azul
    const pe=new THREE.Mesh(geo(new THREE.CylinderGeometry(.16,.19,.16,12)),baseMat);pe.position.y=.08;tacaGrupo.add(pe)
    tacaGrupo.add(lathe([[0,.16],[.07,.16],[.05,.3],[.09,.36],[.2,.5],[.24,.72],[.25,.84],[.23,.85],[0,.74]]))
    for(const s of [-1,1]){const alca=new THREE.Mesh(geo(new THREE.TorusGeometry(.19,.03,6,14,Math.PI*1.25)),ouro);alca.position.set(s*.26,.6,0);alca.rotation.z=s>0?-Math.PI*.55:Math.PI*.55+Math.PI*.25;alca.scale.set(1,1.25,1);tacaGrupo.add(alca)}
   }else{
    // Mundial: pé preto, haste dourada e o ANEL (o globo) com a bola no meio
    const pe=new THREE.Mesh(geo(new THREE.CylinderGeometry(.15,.18,.14,12)),baseMat);pe.position.y=.07;tacaGrupo.add(pe)
    tacaGrupo.add(lathe([[0,.14],[.12,.14],[.07,.28],[.05,.42],[.09,.5],[0,.52]]))
    // (dois anéis cruzados: o globo se lê de qualquer lado, até girando)
    for(const r of [0,Math.PI/2]){const anel=new THREE.Mesh(geo(new THREE.TorusGeometry(.2,.035,8,24)),ouro);anel.position.y=.74;anel.rotation.y=r;tacaGrupo.add(anel)}
    const globo=new THREE.Mesh(geo(new THREE.SphereGeometry(.11,12,8)),ouro);globo.position.y=.74;tacaGrupo.add(globo)
   }
   tacaGrupo.scale.setScalar(1.25)
  }
  const N_PAPEL=mobile?90:170
  const papel=new THREE.InstancedMesh(geo(new THREE.PlaneGeometry(.16,.1)),mat(new THREE.MeshBasicMaterial({side:THREE.DoubleSide,fog:true})),N_PAPEL)
  papel.name='final-papel-picado';papel.frustumCulled=false;papel.instanceMatrix.setUsage(THREE.DynamicDrawUsage);papel.visible=false;g.add(papel)
  const papelSem=Array.from({length:N_PAPEL},()=>({x:(r0()*2-1)*11,z:(r0()*2-1)*8,h:r0(),vel:.9+r0()*.6,fase:r0()*6.28,giro:2+r0()*4}))
  let jogadores:{corpo:Civil;rota?:ReturnType<typeof activityRoute>;alvo:{x:number;y:number;z:number};frente:{x:number;z:number};saindo:boolean;taca:boolean;vaga?:VagaFesta;i:number}[]=[]
  let fotografos:{corpo:Civil;rota:ReturnType<typeof activityRoute>;flash:THREE.Sprite;ritmo:number;fase:number}[]=[]

  // 🖼️ PAINEL DE FUNDO + pórtico (atrás do pódio), com o nome e o enfeite da competição — uma textura só
  const fundo=new THREE.Group();fundo.name='final-painel';fundo.visible=false;g.add(fundo)
  {
   const W=1024,H=400,en=english()
   const tx=tela(W,H,c=>{
    const gr=c.createRadialGradient(W/2,H*.42,20,W/2,H*.42,W*.62);gr.addColorStop(0,tema.fundo[0]);gr.addColorStop(1,tema.fundo[1]);c.fillStyle=gr;c.fillRect(0,0,W,H)
    const r=rnd(hash(tema.id)),cf=tema.confete
    if(tema.enfeite==='estrelas'){for(let k=0;k<70;k++){const x=r()*W,y=r()*H,a=1.5+r()*3.5;c.fillStyle=k%3?'rgba(255,255,255,.75)':cf[0];c.beginPath();for(let q=0;q<10;q++){const ang=q*Math.PI/5-Math.PI/2,rr=q%2?a*.45:a*1.6;c.lineTo(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr)}c.fill()}
     c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=3;for(let k=0;k<12;k++){const ang=k/12*Math.PI*2;const x=W/2+Math.cos(ang)*330,y=H*.42+Math.sin(ang)*150;c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke()}}
    if(tema.enfeite==='fumaca'){for(let k=0;k<26;k++){const x=r()*W,y=H*.55+r()*H*.5,rr=50+r()*90,gg=c.createRadialGradient(x,y,0,x,y,rr);gg.addColorStop(0,k%2?cf[1]+'88':cf[2]+'66');gg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gg;c.fillRect(x-rr,y-rr,rr*2,rr*2)}}
    if(tema.enfeite==='faixas'){c.globalAlpha=.28;for(let k=-8;k<20;k++){c.fillStyle=cf[((k%cf.length)+cf.length)%cf.length];c.beginPath();c.moveTo(k*70,0);c.lineTo(k*70+40,0);c.lineTo(k*70-160,H);c.lineTo(k*70-200,H);c.fill()}c.globalAlpha=1}
    if(tema.enfeite==='sol'){c.globalAlpha=.3;c.fillStyle=cf[0];for(let k=0;k<24;k++){const a0=k/24*Math.PI*2;c.beginPath();c.moveTo(W/2,H*.45);c.lineTo(W/2+Math.cos(a0)*900,H*.45+Math.sin(a0)*900);c.lineTo(W/2+Math.cos(a0+.12)*900,H*.45+Math.sin(a0+.12)*900);c.fill()}c.globalAlpha=1}
    if(tema.enfeite==='raios'){c.strokeStyle=cf[2]??'#FFC400';c.lineWidth=7;c.lineJoin='round';for(const x0 of [90,W-90,240,W-240]){c.beginPath();let x=x0,y=0;c.moveTo(x,y);while(y<H){x+=(r()-.5)*70;y+=40+r()*30;c.lineTo(x,y)}c.stroke()}}
    if(tema.enfeite==='globo'){c.strokeStyle='rgba(255,196,0,.4)';c.lineWidth=5;const cx=W/2,cy=H*.44;c.beginPath();c.arc(cx,cy,175,0,Math.PI*2);c.stroke();for(const e of [.35,.7]){c.beginPath();c.ellipse(cx,cy,175*e,175,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(cx,cy,175,175*e,0,0,Math.PI*2);c.stroke()}}
    // faixa de baixo e de cima nas cores dela
    c.fillStyle=tema.faixa;c.fillRect(0,H-46,W,46);c.fillStyle=tema.tampo;c.fillRect(0,H-52,W,8);c.fillRect(0,0,W,10)
    for(let k=0;k<8;k++)texto(c,'★',64+k*128,H-23,34,60,tema.tampo)
    texto(c,tema.nome[en?1:0],W/2,108,112,W-90,tema.titulo,TINTA)
    texto(c,tema.frase[en?1:0],W/2,196,48,W-160,tema.tampo,TINTA)
    c.lineWidth=12;c.strokeStyle=TINTA;c.strokeRect(6,6,W-12,H-12)
   })
   const larg=11,alt=larg*400/1024
   const pano=new THREE.Mesh(geo(new THREE.PlaneGeometry(larg,alt)),mat(new THREE.MeshBasicMaterial({map:tx,fog:true})));// (o painel fica ALTO, com o nome em cima: a taça erguida nunca tampa o texto, de nenhum ângulo do mapa)
   const base=2.1
   pano.position.set(0,alt/2+base,-4.6);fundo.add(pano)
   const pilar=mat(new THREE.MeshStandardMaterial({color:tema.podio,roughness:.5})),trave=mat(new THREE.MeshStandardMaterial({color:tema.tampo,roughness:.35,metalness:.5}))
   for(const sx of [-1,1]){const p=new THREE.Mesh(geo(new THREE.BoxGeometry(.4,alt+base+.5,.4)),pilar);p.position.set(sx*(larg/2+.2),(alt+base+.5)/2,-4.6);fundo.add(p)}
   const tr=new THREE.Mesh(geo(new THREE.BoxGeometry(larg+1.2,.42,.5)),trave);tr.position.set(0,alt+base+.5,-4.6);fundo.add(tr)
  }
  // 💡 canhões de luz do pórtico (cones aditivos, sem luz de verdade: não pesa)
  const fachos:THREE.Mesh[]=[]
  {
   const cone=geo(new THREE.ConeGeometry(1.5,16,14,1,true));cone.rotateX(Math.PI);cone.translate(0,8,0)
   ;[-4.6,-1.6,1.6,4.6].forEach((x,k)=>{const m=new THREE.Mesh(cone,mat(new THREE.MeshBasicMaterial({color:tema.luz[k%2],transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false})));m.position.set(x,6.9,-4.4);m.visible=false;g.add(m);fachos.push(m)})
  }
  // 🕶️🎗️🚩 acessórios da festa (peças pequenas, geometria e material repartidos por todos)
  const acc={
   lente:geo(new THREE.BoxGeometry(.13,.075,.03)),ponte:geo(new THREE.BoxGeometry(.06,.02,.02)),preto:mat(new THREE.MeshStandardMaterial({color:'#0b0b0b',roughness:.15,metalness:.6})),
   faixa:geo(new THREE.BoxGeometry(.11,.62,.02)),faixaMat:mat(new THREE.MeshStandardMaterial({color:tema.faixa,roughness:.6,emissive:new THREE.Color(tema.faixa),emissiveIntensity:.15})),borda:geo(new THREE.BoxGeometry(.13,.62,.012)),bordaMat:mat(new THREE.MeshStandardMaterial({color:tema.tampo,roughness:.4,metalness:.4})),
   mastro:geo(new THREE.CylinderGeometry(.018,.018,1.5,6)),madeira:mat(new THREE.MeshStandardMaterial({color:'#e8e2d4',roughness:.6})),pano:geo(new THREE.PlaneGeometry(.8,.52,6,1)),
   corpoCam:geo(new THREE.BoxGeometry(.2,.14,.12)),lenteCam:geo(new THREE.CylinderGeometry(.045,.05,.14,10)),
  }
  // 🔥 aquecimento: deixa os modelos dos bonecos da festa já baixados desde o começo do dia (ninguém aparece; só a arte fica no cache)
  for(const variant of ['adult-man','fuller-man','adult-woman'])civis.push(createCivilian(g,{id:'final-aquece-'+variant,variant,deferUntilVisible:true}))

  return{g,geos,mats,texs,civis,aviao,voo,vooDir,vooYaw,fachada,barracas,peruas,relogioDia,chegando,fumaca,N_FUMACA,sinal,sinalAssentos,band,ondaU,fogos,fPos,fCor,fDir,RAJ,POR,centros,podio,podioMat,tacaGrupo,papel,papelSem,corA,corB,
   get jogadores(){return jogadores},set jogadores(v){jogadores=v},get placaPodio(){return placaPodio},set placaPodio(v){placaPodio=v},tela,texto,geo,mat,mobile,tipo,teams,cara,tema,fundo,fachos,acc,get fotografos(){return fotografos},set fotografos(v){fotografos=v}}
 }

 // estado do dia
 let inicioDia=0,festaDesde:number|null=null,desfecho:DesfechoFinal|null=null,golsVistos=-1,sinalDesde=-Infinity,ladoSinal:LadoFinal|null=null,montouPodio=false
 let seekDia:number|null=null,seekFesta:number|null=null,animando=false,override=false,congelado=false

 function encerrar(){
  if(!dia)return
  dia.g.removeFromParent();dia.civis.forEach(c=>c.dispose());dia.jogadores.forEach(j=>j.corpo.dispose());dia.fotografos.forEach(f=>f.corpo.dispose());dia.peruas.dispose();dia.geos.forEach(x=>x.dispose());dia.mats.forEach(x=>x.dispose());dia.texs.forEach(x=>x.dispose())
  dia=null;flashTx=undefined;diaKey='';festaDesde=null;desfecho=null;golsVistos=-1;sinalDesde=-Infinity;montouPodio=false;root.visible=false;override=false;animando=false
 }

 function pose(c:Civil,p:{x:number;y:number;z:number;heading:number;speed?:number;distance?:number},time:number,visivel=true,inclina=0,comemora?:number){
  c.root.position.set(p.x,p.y,p.z);c.root.rotation.set(inclina,p.heading,0,'YXZ')
  const lod=residentVisibility(c.root.position,1.76,lastCamera,lastHeight)
  // (🙌 `comemora` = o segundo do gesto de vitória — braços pra cima — em laço; o clipe Victory tem 1,875 s)
  c.update({seconds:time,distance:p.distance??0,speed:p.speed??0,visible:visivel&&lod.visible,detail:lod.detail,...(comemora!==undefined?{activity:'celebrating',activityTime:((comemora%1.875)+1.875)%1.875}:{})})
 }

 /** veste o boneco da festa: óculos escuros, faixa de campeão no peito e/ou bandeira na mão (presos no corpo, sem osso:
  * o gesto mexe os braços, os acessórios acompanham o corpo — leve e sem conta por quadro) */
 function vestir(d:NonNullable<typeof dia>,c:Civil,v:VagaFesta,cor:string){
  const A=d.acc
  if(v.oculos){const o=new THREE.Group();o.name='final-oculos';for(const sx of [-1,1]){const l=new THREE.Mesh(A.lente,A.preto);l.position.x=sx*.075;o.add(l)}o.add(new THREE.Mesh(A.ponte,A.preto));o.position.set(0,1.43,.3);c.root.add(o)}
  if(v.faixa){const f=new THREE.Group();f.name='final-faixa-campeao';const m=new THREE.Mesh(A.faixa,A.faixaMat);const b=new THREE.Mesh(A.borda,A.bordaMat);b.position.z=-.006;f.add(b,m);f.position.set(0,.86,.17);f.rotation.z=.72;c.root.add(f)}
  if(v.bandeira){
   const f=new THREE.Group();f.name='final-bandeira-mao'
   const mastro=new THREE.Mesh(A.mastro,A.madeira);mastro.position.y=.75;f.add(mastro)
   const W=128,H=84,tx=d.tela(W,H,cx=>{cx.fillStyle=cor;cx.fillRect(0,0,W,H);cx.fillStyle=d.tema.tampo;cx.fillRect(0,H*.4,W,H*.2);cx.fillStyle=d.tema.faixa;cx.fillRect(0,0,W,10);cx.fillRect(0,H-10,W,10)})
   const pano=new THREE.Mesh(A.pano,d.mat(new THREE.MeshStandardMaterial({map:tx,roughness:.85,side:THREE.DoubleSide})));pano.position.set(.41,1.26,0);pano.name='final-bandeira-pano';f.add(pano)
   f.position.set(.36,.55,.08);c.root.add(f);f.userData.pano=pano
  }
 }

 function montarPodio(d:NonNullable<typeof dia>,res:DesfechoFinal,subjects:DadosDiaFinal['subjects']){
  montouPodio=true
  const cor=corDoPodio(res,{home:d.corA,away:d.corB}),tm=d.tema
  // placa na frente do pódio: CAMPEÃO (só existe depois do apito), nas cores da competição
  // (🥅 decidida nos pênaltis: a placa ganha a linha "NOS PÊNALTIS!"; nas internacionais/Supercopa, o nome da taça — nunca a cobrança)
  const txt=placaDoPodio(res,english()),duas=!!txt.linha
  const W=512,H=duas?176:128,tx=d.tela(W,H,c=>{c.fillStyle=tm.placaBg;c.fillRect(0,0,W,H);c.fillStyle=cor;c.fillRect(0,0,W,10);c.fillRect(0,H-10,W,10);d.texto(c,txt.grande,W/2,duas?62:H/2+4,92,W-40,tm.placaInk,TINTA);if(duas){c.fillStyle=tm.placaInk;c.fillRect(24,110,W-48,50);d.texto(c,txt.linha,W/2,136,40,W-64,tm.placaBg)}c.lineWidth=8;c.strokeStyle=TINTA;c.strokeRect(4,4,W-8,H-8)})
  const placa=new THREE.Mesh(d.geo(new THREE.PlaneGeometry(2.6,2.6*H/W)),d.mat(new THREE.MeshBasicMaterial({map:tx,fog:true})));placa.position.set(0,duas?.66:.62,1.215);d.podio.add(placa);d.placaPodio=placa
  // papel picado: a cor de quem ganhou + as cores da competição
  const cores=[cor,cor,...tm.confete]
  for(let i=0;i<d.papel.count;i++)d.papel.setColorAt(i,new THREE.Color(cores[i%cores.length]))
  if(d.papel.instanceColor)d.papel.instanceColor.needsUpdate=true
  const el=elencoDaFesta(res.campeao,d.mobile)
  // os bonecos saem de onde os marcadores do 2D estavam (os mesmos jogadores)
  const de=(lado:LadoFinal,i:number)=>{const s=(subjects??[]).filter(q=>q.side===lado&&q.visible!==false);const q=s[i%Math.max(1,s.length)];if(q)return{x:q.mx,z:q.mz};const a=(i/11)*Math.PI*2;return{x:Math.cos(a)*14,z:Math.sin(a)*9}}
  // 🎉 o ELENCO INTEIRO (11): 7 no pódio, 4 em volta — cada um com seu jeito de comemorar
  const lista:typeof d.jogadores=[]
  coreografiaDaFesta().forEach((v,i)=>{
   const s=de(res.vencedor,i),frente=v.podio?{x:v.x,z:1.9}:{x:v.x,z:v.z},corpo=createCivilian(d.g,{id:'final-campeao-'+i,outfitColor:cor,variant:i%4===3?'fuller-man':'adult-man'})
   vestir(d,corpo,v,cor)
   lista.push({corpo,rota:activityRoute([{x:s.x,y:0,z:s.z},{x:frente.x,y:0,z:frente.z}],Math.max(1.4,Math.hypot(s.x-frente.x,s.z-frente.z)/(FESTA_FINAL.caminhada[1]-FESTA_FINAL.caminhada[0]))),alvo:{x:v.x,y:v.h,z:v.podio?0:v.z},frente,saindo:false,taca:i===0,vaga:v,i})
  })
  if(!res.campeao){
   const corUs=res.usuario==='home'?d.corA:d.corB
   for(let i=0;i<el.saindo;i++){
    const s=de(res.usuario,i+1),fim={x:-10-i*1.6,z:38.6}
    const corpo=createCivilian(d.g,{id:'final-vice-'+i,outfitColor:corUs,variant:'adult-man'})
    lista.push({corpo,rota:activityRoute([{x:s.x,y:0,z:s.z},{x:(s.x+fim.x)/2,y:0,z:30},{x:fim.x,y:0,z:fim.z}],1.25),alvo:{x:fim.x,y:0,z:fim.z},frente:fim,saindo:true,taca:false,i:100+i})
   }
  }
  d.jogadores=lista
  // 📸 FOTÓGRAFOS: entram pela lateral e ficam na frente do pódio, câmera na cara e flash piscando
  d.fotografos=fotografosDaFesta(d.mobile).map((f,i)=>{
   const corpo=createCivilian(d.g,{id:'final-fotografo-'+i,outfitColor:i%2?'#3a3f46':'#23262b',variant:i%2?'adult-woman':'adult-man'})
   const cam=new THREE.Group();cam.name='final-camera-foto';const A=d.acc
   const caixa=new THREE.Mesh(A.corpoCam,A.preto);cam.add(caixa);const lente=new THREE.Mesh(A.lenteCam,A.preto);lente.rotation.x=Math.PI/2;lente.position.z=.12;cam.add(lente)
   cam.position.set(0,1.42,.38);corpo.root.add(cam)
   const flash=new THREE.Sprite(d.mat(new THREE.SpriteMaterial({color:'#ffffff',map:pontoFlash(d),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false})));flash.scale.setScalar(1.3);flash.position.set(0,1.5,.55);flash.visible=false;corpo.root.add(flash)
   const lado=f.x<0?-1:1,ini={x:lado*15,z:8.5}
   return{corpo,rota:activityRoute([{x:ini.x,y:0,z:ini.z},{x:f.x,y:0,z:f.z+1.2},{x:f.x,y:0,z:f.z}],2.2),flash,ritmo:f.ritmo,fase:f.fase}
  })
 }
 let flashTx:THREE.Texture|undefined
 function pontoFlash(d:NonNullable<typeof dia>){if(!flashTx){flashTx=d.tela(64,64,c=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,64,64)})}return flashTx}

 function atualizar(input:DadosDiaFinal,camera?:THREE.Camera,height=720){
  lastCamera=camera;lastHeight=height
  const now=performance.now()/1000,dt=ultimo&&!congelado?Math.min(1,Math.max(0,now-ultimo)):0;ultimo=now;relogio+=dt
  const m=input.match,j=input.journey
  const fixture=m?.context.id??j?.fixtureId
  const tipo=tipoFinalDaPartida(fixture)
  const ativo=!!tipo&&(!!m||!!j?.hosting&&j.phase!=='idle')
  if(!ativo||!tipo){if(dia)encerrar();return}
  const key=(j?.key??'')+'|'+fixture
  if(dia&&diaKey!==key)encerrar()
  if(!dia){dia=montarDia(tipo,input.teams.length===2?input.teams:[{name:m?.officialTeams?.[0],color:m?.homeColor},{name:m?.officialTeams?.[1],color:m?.awayColor}],input.mobile,input.residents,hash(key));diaKey=key;inicioDia=relogio;root.visible=true;onChange()}
  const d=dia
  if(seekDia!==null){inicioDia=relogio-seekDia;seekDia=null}
  const tDia=relogio-inicioDia
  const fase=m?(m.finished?'departure':m.paused&&m.minute===45?'interval':'playing'):j?.phase??'arrival'
  const antes=fase==='arrival'||(fase==='playing'&&(m?.minute??0)<1)
  let mexendo=false

  // ✈️ passa no começo do dia e de novo a cada 70 s enquanto a torcida chega (no jogo da Copa, que já abre rolando, passa logo no início)
  {
   const ciclo=fase==='arrival'?70:1e9,t=(tDia-2)%ciclo,voando=!m?.finished&&tDia>=2&&t<d.voo.dur&&(fase==='arrival'||tDia<2+d.voo.dur)
   d.aviao.visible=voando
   if(voando){const u=t/d.voo.dur,p=d.voo.de.clone().lerp(d.voo.para,u);d.aviao.position.copy(p);d.aviao.position.y+=Math.sin(u*Math.PI*2)*1.2;d.aviao.rotation.set(Math.sin(relogio*1.3)*.05,d.vooYaw,0,'YXZ');const h=d.aviao.getObjectByName('final-helice');if(h)h.rotation.x=relogio*40;const b=d.aviao.userData.banner as THREE.Group;b.rotation.x=Math.sin(relogio*2.4)*.08;mexendo=true}
  }
  // 🛒 barracas e peruas: o mesmo relógio do dia de jogo
  {
   const jj:JornadaComplexo=j?.hosting&&j.phase!=='idle'?j:{key,variantSeed:0,fixtureId:fixture,calendarKnown:false,hosting:true,phase:fase as JornadaComplexo['phase']}
   const df=d.relogioDia.update(jj,input.seconds)
   d.barracas.forEach((b,i)=>{
    if(!b.entrega){b.grp.visible=true;b.grp.scale.set(1,1,1);const v=b.grp.position;pose(b.vendedor,{x:v.x,y:v.y,z:v.z-1.1,heading:0},input.seconds,true);return}
    const f=b.entrega.at(df);d.peruas.set(i,f)
    b.grp.visible=f.stallVisible;b.grp.scale.set(1,Math.max(.02,f.setup),1)
    pose(b.vendedor,f.person,input.seconds,f.visible)
   })
  }
  // 🚶 a gente a mais: chega em fila pelos portões e some ao passar (no jogo da Copa, quem chegou atrasado ainda entra no começo)
  for(const p of d.chegando){
   const periodo=p.rota.duration+5,t=fase==='arrival'?((input.seconds-p.atraso)%periodo+periodo)%periodo:tDia-p.atraso
   const q=p.rota.at(Math.max(0,t))
   p.fora=stadiumExteriorVisible(q,PLANTA_COMPLEXO.gates[p.lado],p.fora)
   const vis=(fase==='arrival'||tDia<p.atraso+p.rota.duration)&&t>=0&&p.fora&&!q.done
   pose(p.corpo,q,input.seconds,vis)
  }
  // 💨 fumaça colorida na porta (antes do jogo) + do sinalizador + do pódio — um lote só, sem estado (sai do relógio)
  let nf=0
  const mtx=new THREE.Matrix4(),cor=new THREE.Color()
  const puff=(x:number,y:number,z:number,idade:number,vida:number,c:string,escala=1)=>{
   if(nf>=d.N_FUMACA||idade<0||idade>vida)return
   const u=idade/vida,s=(.5+u*2.2)*escala*(u>.8?(1-u)/.2:1)
   mtx.makeScale(s,s,s);mtx.setPosition(x+Math.sin(idade*1.7+nf)*.6*u,y+idade*1.25,z+Math.cos(idade*1.3+nf)*.6*u);d.fumaca.setMatrixAt(nf,mtx);d.fumaca.setColorAt(nf,cor.set(c));nf++
  }
  const emissor=(x:number,y:number,z:number,c:string,t:number,n:number,vida=4.2,escala=1)=>{for(let k=0;k<n;k++){const idade=(t+k*vida/n)%vida;puff(x,y,z,idade,vida,c,escala)}}
  if(antes||tDia<40){
   const gt=PLANTA_COMPLEXO.gates.home,porta=antes?1:clamp01((40-tDia)/6)
   if(porta>0){const n=d.mobile?6:9;emissor(gt.threshold.x-7,ground(gt.threshold.x-7,gt.threshold.z+6)+.3,gt.threshold.z+6,d.corA,relogio,n,4.2,porta);emissor(gt.threshold.x+7,ground(gt.threshold.x+7,gt.threshold.z+6)+.3,gt.threshold.z+6,d.corB,relogio+1.1,n,4.2,porta);mexendo=true}
  }
  // 🚩 bandeirões durante o jogo (e na festa)
  d.band.visible=!!m&&fase!=='arrival';if(d.band.visible){d.ondaU.value=relogio;mexendo=true}
  // 🔥 sinalizador: gol do USUÁRIO (o mesmo "gol!" que já faz a torcida pular)
  const usuario=ladoDoUsuario(m)
  {
   const fr=(input.frame??{}) as Frame,evs=fr.official?.events??[],gols=evs.filter(e=>e.tipo==='gol')
   if(golsVistos<0)golsVistos=gols.length
   if((fr.phase==='gol'||fr.replay)&&gols.length>golsVistos){const ult=gols[gols.length-1];golsVistos=gols.length;const lado:LadoFinal=ult.lado===0?'home':'away';if(usuario&&lado===usuario){sinalDesde=relogio;ladoSinal=lado}}
   if(gols.length<golsVistos)golsVistos=gols.length
   const ts=relogio-sinalDesde,assentos=ladoSinal?d.sinalAssentos[ladoSinal]:[]
   d.sinal.count=0
   if(ts>=0&&ts<9&&assentos.length){
    const corSinal=ladoSinal==='home'?d.corA:d.corB
    assentos.forEach((s,k)=>{const x=s.position.x,y=s.position.y+s.seatHeight+1.25,z=s.position.z,fl=1+Math.sin(relogio*23+k*3)*.25;mtx.makeScale(fl,fl,fl);mtx.setPosition(x,y,z);d.sinal.setMatrixAt(k,mtx);emissor(x,y+.2,z,k%2?corSinal:'#e8e2d4',relogio+k,d.mobile?3:4,3.2,.8)})
    d.sinal.count=assentos.length;d.sinal.instanceMatrix.needsUpdate=true;mexendo=true
   }
  }
  // 🏆 depois do apito
  const res=desfechoDaFinal(m)
  if(res&&desfecho&&(res.vencedor!==desfecho.vencedor||res.usuario!==desfecho.usuario||!!res.penaltis!==!!desfecho.penaltis)){encerrar();onChange();return} // (outro desfecho = outra festa, do zero)
  if(res&&!desfecho){desfecho=res;festaDesde=relogio}
  if(!res&&desfecho&&!m?.finished){desfecho=null;festaDesde=null}
  override=false
  if(desfecho&&festaDesde!==null){
   if(seekFesta!==null){festaDesde=relogio-seekFesta;seekFesta=null}
   const tf=relogio-festaDesde,q=quadroDaFesta(tf,desfecho.campeao)
   if(q.trocaBonecos&&!montouPodio)montarPodio(d,desfecho,input.subjects)
   override=q.trocaBonecos
   d.podio.visible=q.podio>0;d.podio.scale.set(1,Math.max(.02,suave(q.podio)),1)
   // 🏆 a taça roda de mão em mão no degrau de cima depois de erguida (capitão → esquerda → direita…)
   const roda=q.taca>=1?quemLevantaATaca(tf,FESTA_FINAL.taca[1]):null
   const posTopo:{x:number;y:number;z:number}[]=[]
   for(const p of d.jogadores){
    if(p.saindo){const r=p.rota!.at(Math.max(0,tf-FESTA_FINAL.caminhada[0]));pose(p.corpo,{...r,y:ground(r.x,r.z)},relogio,q.trocaBonecos&&!r.done,.2);continue}
    const v=p.vaga!,t=tf+p.i*.37
    let x:number,y:number,z:number,heading=0,inclina=0,comemora:number|undefined
    if(!v.podio){
     // no chão: anda até a vaga dele e já começa a festa
     const r=p.rota!.at(Math.max(0,tf-FESTA_FINAL.caminhada[0]))
     if(!r.done){pose(p.corpo,{...r,y:0},relogio,q.trocaBonecos,0);continue}
     x=p.alvo.x;y=0;z=p.alvo.z;heading=Math.atan2(-x*.25,6-z)
    }else{
     if(q.sobem<=0){const r=p.rota!.at(Math.max(0,tf-FESTA_FINAL.caminhada[0]));pose(p.corpo,{...r,y:0},relogio,q.trocaBonecos,0);continue}
     const u=suave(q.sobem);x=p.frente.x+(p.alvo.x-p.frente.x)*u;z=p.frente.z+(p.alvo.z-p.frente.z)*u;y=p.alvo.y*Math.min(1,u*1.6)+Math.sin(u*Math.PI)*.35
     if(q.sobem<1){pose(p.corpo,{x,y,z,heading:0,speed:.6,distance:tf},relogio,true,0);continue}
    }
    // 🎉 cada um com o seu jeito
    const segura=roda?(p.i===roda.de&&roda.passando<.5)||(p.i===roda.para&&roda.passando>=.5):p.taca
    const anim=segura?'taca':v.anim
    if(anim==='pula')y+=Math.abs(Math.sin(t*4.6))*.34
    else if(anim==='bracos')comemora=t
    else if(anim==='danca'){heading+=Math.sin(t*2.7)*.65;x+=Math.sin(t*2.7)*.14;y+=Math.abs(Math.sin(t*5.4))*.07;inclina=Math.sin(t*5.4)*.06}
    else if(anim==='abraco'&&v.parceiro!==undefined){const o=d.jogadores.find(j=>j.i===v.parceiro);if(o){heading=Math.atan2(o.alvo.x-x,o.alvo.z-z);x+=(o.alvo.x-x)*.18;inclina=.2+Math.sin(t*3)*.04}}
    else if(anim==='taca'){comemora=t;y+=Math.max(0,Math.sin(t*5))*.18}
    pose(p.corpo,{x,y,z,heading,distance:tf},relogio,true,inclina,comemora)
    const band=p.corpo.root.getObjectByName('final-bandeira-mao');if(band){band.rotation.z=Math.sin(t*3.1)*.25;const pano=band.userData.pano as THREE.Mesh|undefined;if(pano)pano.rotation.y=Math.sin(t*4.3)*.35}
    if(p.i<=2)posTopo[p.i]={x,y,z}
    if(!roda&&p.taca){d.tacaGrupo.visible=true;const lev=suave(q.taca);d.tacaGrupo.position.set(x,y+1.0+lev*.9,z+.18+(1-lev)*.22);d.tacaGrupo.rotation.set(0,relogio*.8*lev,Math.sin(relogio*3)*.12*lev)}
   }
   if(roda&&posTopo[roda.de]&&posTopo[roda.para]){
    const a=posTopo[roda.de],b=posTopo[roda.para],u=suave(roda.passando)
    d.tacaGrupo.visible=true;d.tacaGrupo.position.set(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u+1.9+Math.sin(u*Math.PI)*.35,a.z+(b.z-a.z)*u+.18);d.tacaGrupo.rotation.set(0,relogio*.8,Math.sin(relogio*3)*.12)
   }
   // 📸 fotógrafos: chegam pela lateral junto com o elenco e disparam o flash sem parar
   for(const f of d.fotografos){
    const r=f.rota.at(Math.max(0,tf-FESTA_FINAL.caminhada[0]))
    if(!r.done){pose(f.corpo,{...r,y:0},relogio,q.trocaBonecos,0);f.flash.visible=false;continue}
    pose(f.corpo,{x:r.x,y:0,z:r.z,heading:Math.PI+Math.sin(tf*.7+f.fase*6)*.25},relogio,true,0)
    f.flash.visible=flashAceso(tf,f.ritmo,f.fase)
   }
   // 🖼️ painel e 💡 canhões de luz da competição sobem junto com o pódio
   d.fundo.visible=q.podio>0;d.fundo.scale.set(1,Math.max(.02,suave(q.podio)),1)
   d.fachos.forEach((m,k)=>{m.visible=q.podio>=1;if(m.visible){m.rotation.z=Math.sin(tf*.9+k*1.7)*.38;m.rotation.x=-.32+Math.sin(tf*.6+k)*.12}})
   // papel picado caindo em volta do pódio
   d.papel.visible=q.papel>0
   if(d.papel.visible){
    const o=new THREE.Object3D()
    d.papelSem.forEach((p,i)=>{const alt=((p.h*14-(tf*p.vel))%14+14)%14;o.position.set(p.x+Math.sin(tf*1.3+p.fase)*.5,(alt+.3)*q.papel+(1-q.papel)*-2,p.z+Math.cos(tf*1.1+p.fase)*.4);o.rotation.set(tf*p.giro,tf*p.giro*.7,p.fase);o.updateMatrix();d.papel.setMatrixAt(i,o.matrix)})
    d.papel.instanceMatrix.needsUpdate=true
   }
   // fumaça na festa (cores de quem ganhou)
   if(q.fumaca>0){const c1=corDoPodio(desfecho,{home:d.corA,away:d.corB});for(const [x,z,c] of [[-8.5,1.5,c1],[8.5,1.5,d.tema.luz[0]],[-8.5,-3,d.tema.luz[0]],[8.5,-3,c1]] as const)emissor(x,0,z,c,relogio+x,d.mobile?4:6,4.6,q.fumaca*1.2)}
   // 🎆 fogos (só se o seu clube é campeão)
   d.fogos.visible=q.fogos
   if(q.fogos){
    const vida=2.6,passo=1.15
    const corF=[new THREE.Color(corDoPodio(desfecho,{home:d.corA,away:d.corB})).lerp(new THREE.Color('#ffffff'),.25).multiplyScalar(1.6),...d.tema.fogos.map(c=>new THREE.Color(c).multiplyScalar(1.5))]
    const tl=tf-FESTA_FINAL.fogos[0]
    for(let b=0;b<d.RAJ;b++){
     const ciclo=d.RAJ*passo,idade=((tl-b*passo)%ciclo+ciclo)%ciclo,rodada=Math.floor((tl-b*passo)/ciclo),viva=tl>=b*passo&&idade<vida
     const c=d.centros[b],cc=corF[(b+rodada)%corF.length],a=viva?Math.min(1,(1-idade/vida)*2.2):0,vel=7
     // cada faísca + um rastro logo atrás dela (o rastro é a mesma faísca um instante antes, mais apagada)
     for(let k=0;k<d.POR;k++)for(const [rastro,atras,luz] of [[0,0,1],[1,.14,.45]] as const){const n=b*d.POR+k,src=n*3,i=(n+rastro*d.RAJ*d.POR)*3,ic=(n+rastro*d.RAJ*d.POR)*4,t=Math.max(0,idade-atras);d.fPos[i]=c.x+d.fDir[src]*vel*t+((rodada*7)%11-5);d.fPos[i+1]=c.y+d.fDir[src+1]*vel*t-2.4*t*t;d.fPos[i+2]=c.z+d.fDir[src+2]*vel*t;d.fCor[ic]=cc.r;d.fCor[ic+1]=cc.g;d.fCor[ic+2]=cc.b;d.fCor[ic+3]=a*luz}
    }
    ;(d.fogos.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;(d.fogos.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate=true
   }
   mexendo=mexendo||tf<FESTA_FINAL.fim
  }
  d.fumaca.count=nf;d.fumaca.instanceMatrix.needsUpdate=true;if(d.fumaca.instanceColor)d.fumaca.instanceColor.needsUpdate=true
  animando=mexendo
 }

 // 🛡️ a festa nunca derruba o mapa: qualquer erro aqui desliga só a festa (o jogo e a cidade seguem)
 let quebrado=false
 function update(input:DadosDiaFinal,camera?:THREE.Camera,height=720){
  if(quebrado)return
  try{atualizar(input,camera,height)}catch(e){quebrado=true;console.warn('[final] festa desligada:',e);try{encerrar()}catch{/* já está saindo */}}
 }
 const api={
  update,
  /** os marcadores do campo 2D saem quando entram os bonecos do pódio (só depois do apito) */
  overrideField:()=>override,
  /** pede quadro enquanto há avião, fumaça, sinalizador ou festa em andamento */
  animating:()=>animando,
  inspect:()=>({active:!!dia,key:diaKey,tipo:dia?.tipo,trophy:dia?.cara.forma,theme:dia?.tema.id,squad:dia?.jogadores.filter(j=>!j.saindo).length??0,squadVisible:dia?.jogadores.filter(j=>!j.saindo&&j.corpo.root.visible).length??0,photographers:dia?.fotografos.length??0,flashes:dia?.fotografos.filter(f=>f.flash.visible).length??0,desfecho,override,animando,extraWalkers:dia?.chegando.length??0,podium:!!dia?.podio.visible,fireworks:!!dia?.fogos.visible,plane:!!dia?.aviao.visible,flares:dia?.sinal.count??0,banners:dia?.band.visible?dia.band.count:0}),
  dispose(){encerrar();root.removeFromParent()},
 }
 // 🧪 revisão local (só no `vite` de desenvolvimento): pular no tempo e mirar a câmera pra tirar as fotos
 if(import.meta.env.DEV)(window as unknown as {__complexoFinal?:unknown}).__complexoFinal={...api,
  seekDia:(t:number)=>{seekDia=t;onChange()},congelar:(v:boolean)=>{congelado=v;onChange()},seekFesta:(t:number)=>{seekFesta=t;onChange()},
  olhar:(p:[number,number,number],alvo:[number,number,number])=>{if(!lastCamera)return;lastCamera.position.set(...p);lastCamera.lookAt(...alvo);lastCamera.updateMatrixWorld();onChange()}}
 return api
}
export type DiaDeFinal=ReturnType<typeof criarDiaDeFinal>
