// 🏙️ CIDADE VIVA no mapa 3D (03/11) — o desenho das três regras de presidencia-cidade-viva.ts:
//  🏗️ canteiro (tapume + guindaste) no lugar da obra comprada nesta rodada · 🍻 Boteco do Oswaldo em festa ou cabisbaixo ·
//  🚌 carreata do título com o ônibus aberto nas cores do clube rodando a via pública.
// Custo: TRÊS InstancedMesh (tapume · guindaste/bandeirinhas · gente no teto do ônibus), o ônibus que já existe e uns poucos
// civis (os mesmos dos botecos, com LOD e carregados só quando aparecem). Nada projeta sombra nova e nada tem laço próprio:
// tudo anda pelo `update(seconds)` que o mapa já chama no quadro dele — parado sem toque (VIVO_MS), fica parado.
import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {PLANTA_COMPLEXO} from './presidencia-complexo-model'
import type {PlantaTransporteComplexo,ServicoTransporteComplexo} from './presidencia-complexo-transporte-model'
import {criarVeiculoTransporte} from './presidencia-veiculo-transporte'
import type {BotecoBairro} from './presidencia-boteco-bairro'
import type {CanteiroObra,CidadeViva,HumorBoteco} from './presidencia-cidade-viva'
import {getLang} from './lang'

type P={x:number;z:number}
type Boteco={setHumor:(humor:HumorBoteco,text?:string)=>void}
const SKIN=['#b87952','#d4ad83','#895738','#bd926b']
const VELOCIDADE_CARREATA=5.2 // m/s — devagar, é desfile

/** Contorno de cada obra no chão (o mesmo lote em que o prédio pronto nasce). */
export function contornosDoCanteiro(c:CanteiroObra,transport:Pick<PlantaTransporteComplexo,'station'|'parkingPlants'>):P[][]{
 if(c.obra==='estac')return transport.parkingPlants.filter(lot=>(c.lotes??[]).includes(lot.stage)).map(lot=>lot.polygon.map(p=>({x:p.x,z:p.z})))
 if(c.obra==='estacao'){const s=transport.station,h=s.length/2;return[[[-h,-9.5],[h,-9.5],[h,9.5],[-h,9.5]].map(([x,z])=>{const p=s.point(x,z,0);return{x:p.x,z:p.z}})]}
 const lot=(PLANTA_COMPLEXO.lots as Record<string,{footprint:readonly P[]}|undefined>)[c.obra]
 return lot?[lot.footprint.map(p=>({x:p.x,z:p.z}))]:[]
}
/** Peças do canteiro (pura, para o teste): painéis de tapume ao longo do contorno e um guindaste por obra. */
export function pecasDoCanteiro(contornos:readonly P[][],alto=false){
 const painel:{x:number;z:number;len:number;yaw:number}[]=[],guindaste:{x:number;y:number;z:number;w:number;h:number;d:number;yaw:number;cor:'aco'|'peso'}[]=[]
 for(const poly of contornos){
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.z-a.z);if(len<.5)continue
   const n=Math.max(1,Math.ceil(len/4)),step=len/n,yaw=-Math.atan2(b.z-a.z,b.x-a.x)
   for(let k=0;k<n;k++){const t=(k+.5)/n;painel.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,len:step-.08,yaw})}
  }
  const c=poly.reduce((s,p)=>({x:s.x+p.x/poly.length,z:s.z+p.z/poly.length}),{x:0,z:0})
  // o guindaste fica num canto de dentro do lote e a lança aponta pro meio da obra
  const base={x:c.x+(poly[0].x-c.x)*.55,z:c.z+(poly[0].z-c.z)*.55},alcance=Math.max(10,Math.min(26,Math.hypot(c.x-base.x,c.z-base.z)+6))
  const H=alto?34:22,yaw=-Math.atan2(c.z-base.z,c.x-base.x),ux=Math.cos(-yaw),uz=Math.sin(-yaw)
  const at=(u:number)=>({x:base.x+ux*u,z:base.z+uz*u})
  guindaste.push({...base,y:.3,w:3.2,h:.6,d:3.2,yaw,cor:'peso'})
  guindaste.push({...base,y:H/2,w:1.1,h:H,d:1.1,yaw,cor:'aco'})
  guindaste.push({...base,y:H+.8,w:1.7,h:1.6,d:1.7,yaw,cor:'aco'})
  {const p=at(alcance/2);guindaste.push({...p,y:H+1.9,w:alcance,h:.7,d:.8,yaw,cor:'aco'})}
  {const p=at(-4);guindaste.push({...p,y:H+1.9,w:8,h:.7,d:.8,yaw,cor:'aco'})}
  {const p=at(-7);guindaste.push({...p,y:H+1.2,w:1.8,h:1.6,d:1.8,yaw,cor:'peso'})}
  {const p=at(alcance*.8),cabo=H*.45;guindaste.push({...p,y:H+1.6-cabo/2,w:.07,h:cabo,d:.07,yaw,cor:'aco'});guindaste.push({...p,y:H+1.6-cabo-.3,w:.55,h:.6,d:.55,yaw,cor:'peso'})}
 }
 return{painel,guindaste}
}

/** A volta da carreata: sai pela via pública (ida) e volta pela pista de lá — as mesmas pistas dos carros da cidade. */
export function rotaCarreata():P[]{return[...PLANTA_COMPLEXO.routes.roadOut.points,...PLANTA_COMPLEXO.routes.roadBack.points].map(p=>({x:p.x,z:p.z}))}
export function poseNaRota(rota:readonly P[],distancia:number){
 const legs=rota.map((a,i)=>{const b=rota[(i+1)%rota.length];return{a,b,len:Math.hypot(b.x-a.x,b.z-a.z)}}).filter(l=>l.len>1e-6)
 const total=legs.reduce((s,l)=>s+l.len,0);let d=((distancia%total)+total)%total
 let i=0;while(i<legs.length-1&&d>legs[i].len){d-=legs[i].len;i++}
 const l=legs[i],f=Math.min(1,d/l.len),heading=Math.atan2(l.b.x-l.a.x,l.b.z-l.a.z)
 // vira a esquina sem estalo: mistura com a próxima perna nos últimos metros
 const next=legs[(i+1)%legs.length],blend=Math.min(3,l.len/3),w=d>l.len-blend?.5*(d-(l.len-blend))/blend:0
 const nh=Math.atan2(next.b.x-next.a.x,next.b.z-next.a.z),delta=Math.atan2(Math.sin(nh-heading),Math.cos(nh-heading))
 return{x:l.a.x+(l.b.x-l.a.x)*f,z:l.a.z+(l.b.z-l.a.z)*f,heading:heading+delta*w,total}
}

export function criarCidadeViva(scene:THREE.Scene,input:{botecos:readonly BotecoBairro[];pubLife:Boteco;transport:PlantaTransporteComplexo;onReady:()=>void}){
 const root=new THREE.Group();root.name='cidade-viva';scene.add(root)
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
 const mat=(color:string,roughness=.8,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m}
 const unit=new THREE.BoxGeometry(1,1,1);geometries.add(unit)
 const flagGeometry=new THREE.BufferGeometry();flagGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.2,0,0,.2,0,0,0,-.42,0],3));flagGeometry.computeVertexNormals();geometries.add(flagGeometry)
 const white=mat('#ffffff',.85),flagMaterial=mat('#ffffff',.9);flagMaterial.side=THREE.DoubleSide
 const t=new THREE.Object3D(),color=new THREE.Color()
 const instanced=(geometry:THREE.BufferGeometry,material:THREE.Material,count:number,name:string)=>{const m=new THREE.InstancedMesh(geometry,material,Math.max(1,count));m.name=name;m.castShadow=false;m.receiveShadow=true;m.count=count;root.add(m);return m}
 const setBox=(m:THREE.InstancedMesh,i:number,x:number,y:number,z:number,w:number,h:number,d:number,yaw:number,c:string)=>{t.position.set(x,y,z);t.rotation.set(0,yaw,0);t.scale.set(w,h,d);t.updateMatrix();m.setMatrixAt(i,t.matrix);m.setColorAt(i,color.set(c))}
 let cv:CidadeViva|undefined,enabled=false,mobile=false

 // 🏗️ canteiros
 let canteiroKey='',tapume:THREE.InstancedMesh|undefined,guindaste:THREE.InstancedMesh|undefined
 const limpaCanteiro=()=>{for(const m of [tapume,guindaste])m?.removeFromParent();tapume?.dispose();guindaste?.dispose();tapume=guindaste=undefined}
 function montaCanteiros(list:readonly CanteiroObra[]){
  const key=JSON.stringify(list);if(key===canteiroKey)return;canteiroKey=key;limpaCanteiro();if(!list.length)return
  const pecas=list.map(c=>pecasDoCanteiro(contornosDoCanteiro(c,input.transport),c.obra==='hotel'))
  const painel=pecas.flatMap(p=>p.painel),partes=pecas.flatMap(p=>p.guindaste)
  const clube=cv?.cor??'#1B7A3D'
  tapume=instanced(unit,white,painel.length,'canteiro-tapume')
  painel.forEach((p,i)=>setBox(tapume!,i,p.x,1.25,p.z,p.len,2.5,.14,p.yaw,i%3===1?clube:'#e9e2cc'))
  guindaste=instanced(unit,white,partes.length,'canteiro-guindaste')
  partes.forEach((p,i)=>setBox(guindaste!,i,p.x,p.y,p.z,p.w,p.h,p.d,p.yaw,p.cor==='aco'?'#f0b31c':'#5d6062'))
  for(const m of [tapume,guindaste]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere()}
 }

 // 🍻 Boteco do Oswaldo: bandeirinhas na beira do telhado + torcedores pulando no corredor das mesas
 const oswaldo=input.botecos.find(p=>p.id==='oswaldo')
 const flags=new THREE.InstancedMesh(flagGeometry,flagMaterial,30);flags.name='boteco-bandeirinhas';flags.castShadow=false;flags.visible=false
 let flagKey=''
 if(oswaldo){
  oswaldo.root.add(flags)
  const spots:{x:number;z:number;yaw:number}[]=[]
  for(let i=0;i<10;i++)spots.push({x:-4.5+i,z:5.2,yaw:0})
  for(const side of [-1,1])for(let i=0;i<10;i++)spots.push({x:side*4.7,z:-4.6+i*1.02,yaw:Math.PI/2})
  spots.forEach((s,i)=>{t.position.set(s.x,3.18,s.z);t.rotation.set(0,s.yaw,0);t.scale.set(1,1,1);t.updateMatrix();flags.setMatrixAt(i,t.matrix)})
  flags.count=spots.length
 }
 const pintaBandeiras=()=>{const key=`${cv?.cor}|${cv?.cor2}`;if(key===flagKey)return;flagKey=key;const cores=[cv?.cor??'#1B7A3D',cv?.cor2??'#FFC400','#ffffff'];for(let i=0;i<flags.count;i++)flags.setColorAt(i,color.set(cores[i%3]));if(flags.instanceColor)flags.instanceColor.needsUpdate=true}
 type Fa={body:ReturnType<typeof createCivilian>;x:number;z:number;phase:number;heading:number;group:'boteco'|'ponto';n:number;semSombra:boolean}
 const fas:Fa[]=[]
 const fa=(id:string,x:number,z:number,heading:number,group:Fa['group'],i:number)=>fas.push({body:createCivilian(root,{deferUntilVisible:true,id:'cidade-viva-'+id,variant:i%3===2?'adult-woman':i%3===1?'fuller-man':'adult-man',outfitColor:/^#[0-9a-f]{6}$/i.test(cv?.cor??'')?cv!.cor:undefined,onReady:input.onReady}),x,z,phase:i*.83,heading,group,n:i,semSombra:false})
 let fasCor:string|undefined
 const montaFas=()=>{
  if(fas.length&&fasCor===cv?.cor)return
  fas.forEach(f=>f.body.dispose());fas.length=0;fasCor=cv?.cor
  if(oswaldo){const o=oswaldo.root.position;[[-.6,8.5],[.6,9.6],[-.5,11.1],[.55,12.3],[0,6.2]].forEach(([x,z],i)=>fa('boteco-'+i,o.x+x,o.z+z,i%2?Math.PI:0,'boteco',i))}
  // carreata: um grupo no ponto de ônibus da frente (plataforma já existente) vê o ônibus passar
  const stop=input.transport.bus.stop;[[-9,-4.6],[-6.5,-5.2],[-3.5,-4.4],[1.5,-3.2]].forEach(([x,z],i)=>fa('ponto-'+i,stop.x+x,stop.z+z,0,'ponto',i))
 }

 // 🚌 carreata: o ônibus que já existe, pintado do clube, com a turma e a taça no teto
 const rota=rotaCarreata()
 let bus:ReturnType<typeof criarVeiculoTransporte>|undefined,roof:THREE.InstancedMesh|undefined
 const ROOF_PEOPLE=7
 const servico:ServicoTransporteComplexo={id:'carreata-campeao',kind:'bus',side:'home',width:2.5,length:10,wheelRadius:.43,floorHeight:.32,
  stop:{position:{x:rota[0].x,y:0,z:rota[0].z},heading:0},inbound:[],outbound:[],passengerRoute:[],door:{side:1,longitudinal:0,width:1.5}}
 const limpaOnibus=()=>{bus?.dispose();roof?.dispose();roof?.removeFromParent();bus=roof=undefined}
 function montaOnibus(){
  if(bus){bus.setColor(cv?.cor??'#1B7A3D');return}
  bus=criarVeiculoTransporte(root,servico,cv?.cor??'#1B7A3D');bus.root.traverse(o=>{o.castShadow=false})
  roof=new THREE.InstancedMesh(unit,white,ROOF_PEOPLE*2+2);roof.name='carreata-teto';roof.castShadow=false;bus.root.add(roof)
 }
 const posRoof=(time:number)=>{
  if(!roof)return
  const top=servico.floorHeight+2.52+.07,clube=cv?.cor??'#1B7A3D'
  for(let i=0;i<ROOF_PEOPLE;i++){
   const z=-3.9+i*1.3,x=i%2?.55:-.55,hop=Math.abs(Math.sin(time*6.2+i*1.7))*.28
   setBox(roof,i*2,x,top+.55+hop,z,.48,1.1,.32,0,i%2?clube:'#f4ecd6');setBox(roof,i*2+1,x,top+1.27+hop,z,.3,.3,.3,0,SKIN[i%4])
  }
  // a taça na frente, dourada
  setBox(roof,ROOF_PEOPLE*2,0,top+.35,4.4,.5,.7,.5,0,'#8a6a1a');setBox(roof,ROOF_PEOPLE*2+1,0,top+1.05,4.4,.62,.75,.62,time*.8,'#FFC400')
  roof.instanceMatrix.needsUpdate=true;if(roof.instanceColor)roof.instanceColor.needsUpdate=true
 }

 function configure(next:CidadeViva|undefined,opts:{mobile:boolean;enabled:boolean}){
  const corMudou=next?.cor!==cv?.cor||next?.cor2!==cv?.cor2
  cv=next;enabled=opts.enabled;mobile=opts.mobile
  if(corMudou)canteiroKey=''
  montaCanteiros(cv?.canteiros??[])
  const humor=cv?.humor??'normal',en=getLang()==='en'
  input.pubLife.setHumor(humor,humor==='festa'?(cv?.carreata?(en?"WE'RE CHAMPIONS!":'É CAMPEÃO!'):(en?'WE WON!':'VITÓRIA!')):humor==='triste'?(en?'NEXT TIME':'FICA PRA PRÓXIMA'):'')
  const festa=enabled&&humor==='festa'
  flags.visible=festa;if(festa)pintaBandeiras()
  if(festa)montaFas()
  if(enabled&&cv?.carreata)montaOnibus();else limpaOnibus()
 }
 function update(seconds:number,camera?:THREE.Camera,height=720){
  const festa=enabled&&cv?.humor==='festa',carreata=enabled&&!!cv?.carreata
  for(const f of fas){
   const on=festa&&(f.group==='boteco'?f.n<(mobile?3:5):carreata&&f.n<(mobile?2:4))
   const hop=on?Math.abs(Math.sin(seconds*5.4+f.phase))*.32:0
   f.body.root.position.set(f.x,.16+hop,f.z);f.body.root.rotation.y=f.heading
   const lod=on?residentVisibility(f.body.root.position,1.76,camera,height):{visible:false,detail:'far'}
   f.body.update({seconds,distance:0,speed:0,visible:lod.visible,detail:lod.detail})
   // nada de sombra nova: o civil nasce projetando sombra; os da festa não
   if(!f.semSombra&&f.body.root.children[0]?.children.length){f.body.root.traverse(o=>{o.castShadow=false});f.semSombra=true}
  }
  if(bus){
   const pose=poseNaRota(rota,seconds*VELOCIDADE_CARREATA)
   bus.root.position.set(pose.x,.04,pose.z);bus.root.rotation.y=pose.heading;bus.update(seconds*VELOCIDADE_CARREATA)
   posRoof(seconds)
  }
 }
 return{root,configure,update,
  inspect:()=>({humor:cv?.humor??'normal',carreata:!!bus,canteiros:(cv?.canteiros??[]).map(c=>c.obra),tapume:tapume?.count??0,guindaste:guindaste?.count??0,
   bandeirinhas:flags.visible?flags.count:0,torcedores:fas.filter(f=>f.body.root.visible).length,onibus:bus?bus.root.position.toArray():null,rota:rota.length}),
  dispose(){limpaCanteiro();limpaOnibus();fas.forEach(f=>f.body.dispose());flags.removeFromParent();flags.dispose();root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}}
}
