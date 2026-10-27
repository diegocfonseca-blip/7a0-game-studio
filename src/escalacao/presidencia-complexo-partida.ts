import {criarRedeGol3D,atualizarRedesGol3D} from './presidencia-rede-gol-3d'
import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import type {StadiumSave} from './estadiodata'
import type {PresidenteBaseSave} from './presidencia-carreira'
import {progressoVisualSetor} from './presidencia-estadio-camadas'
import {materialSolo3D} from './presidencia-solo-3d'
import {materialGramado3D} from './presidencia-gramado-material-3d'
import {faixasGramado3D} from './presidencia-gramado-3d'
import {BANCO_Z,TECNICO_Z,FUNDO_AREA_TECNICA_Z} from './presidencia-area-tecnica'
import {entradaOficialCompleta,atletasEmCampo,type AtletaEstadio,type EstadoPartidaEstadio} from './presidencia-partida-model'
import {quadroFutebol3D,type QuadroFutebol} from './presidencia-futebol-motor'
import {person,pose} from './presidencia-atleta-3d'
import {instanciarPersonagens} from './presidencia-personagens-instancias'
import {criarBolaFutebol3D,posicionarBolaFutebol3D} from './presidencia-bola-3d'
import type {loadPlayers} from './futebol3d/players.mjs'

const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.88})
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function tube(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material){const delta=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh)}
export function criarCampo3D(scene:THREE.Scene,stadium?:StadiumSave,registered=false,onTextureReady?:()=>void){
 if(!registered){
  // (🏟️ 26/10, caldeirão: a arquibancada encostou no campo — o chão que sobra atrás dos gols e das laterais é gramado quando o
  // campo já é de grama; na várzea continua terra)
  const ground=material(stadium&&progressoVisualSetor(stadium,'grama')>=1?'#3f6e34':'#8d825c'),base=box(scene,125,.3,86,0,-.17,0,ground)
  // The grass/dirt strips already form the playing surface. A second broad
  // top face only 22 mm beneath them causes depth artefacts at low camera angles.
  // Keep the earth sides and the exposed apron, without that hidden duplicate.
  const top=base.geometry.groups.find(group=>group.materialIndex===2)!
  base.geometry.setIndex(Array.from(base.geometry.index!.array).filter((_,i)=>i<top.start||i>=top.start+top.count));base.geometry.clearGroups()
  for(const [x,z,width,depth] of [[-57.5,0,10,86],[57.5,0,10,86],[0,38.5,105,9],[0,(-43+FUNDO_AREA_TECNICA_Z)/2,105,43+FUNDO_AREA_TECNICA_Z]]){
   const apron=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),ground)
   apron.rotation.x=-Math.PI/2;apron.position.set(x,-.02,z);apron.receiveShadow=true;scene.add(apron)
  }
 }else{const contact=new THREE.Mesh(new THREE.PlaneGeometry(120,84),new THREE.ShadowMaterial({opacity:.22}));contact.rotation.x=-Math.PI/2;contact.position.y=-.01;contact.receiveShadow=true;scene.add(contact)}
 const grass=new THREE.TextureLoader().load(import.meta.env.BASE_URL+'estadio-partida/grass-base.webp',texture=>{if(!texture.userData.disposed)onTextureReady?.()},undefined,()=>{
  if(grass.userData.disposed)return
  for(const mat of greens){mat.map=null;mat.needsUpdate=true}
  onTextureReady?.()
 });grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(26,17);grass.colorSpace=THREE.SRGBColorSpace;grass.anisotropy=8
 const progress=stadium?progressoVisualSetor(stadium,'grama'):0
 const greens=['#c1d89c','#d5e4b4'].map(color=>materialGramado3D(color,grass)),dirt=materialSolo3D()
 for(const band of faixasGramado3D(progress)){
  const geometry=new THREE.PlaneGeometry(band.width,68),uv=geometry.getAttribute('uv')
  // One continuous grass texture across the 105 m field, including partial strips.
  for(let j=0;j<uv.count;j++)uv.setX(j,(band.left+52.5+uv.getX(j)*band.width)/105)
  const strip=new THREE.Mesh(geometry,band.grass?greens[band.stripe]:dirt)
  strip.rotation.x=-Math.PI/2;strip.position.set(band.left+band.width/2,.002,0);strip.receiveShadow=true;scene.add(strip)
  // Native-resolution ground under boots/benches, within the registered apron.
  const apronDepth=-34-FUNDO_AREA_TECNICA_Z,apronGeometry=new THREE.PlaneGeometry(band.width,apronDepth),apronUv=apronGeometry.getAttribute('uv')
  for(let j=0;j<apronUv.count;j++){apronUv.setX(j,(band.left+52.5+apronUv.getX(j)*band.width)/105);apronUv.setY(j,1+apronUv.getY(j)*apronDepth/68)}
  const apron=new THREE.Mesh(apronGeometry,band.grass?greens[band.stripe]:dirt)
  apron.rotation.x=-Math.PI/2;apron.position.set(band.left+band.width/2,.002,(-34+FUNDO_AREA_TECNICA_Z)/2);apron.receiveShadow=true;scene.add(apron)
 }
 // A completed grass pitch also covers the goal recess/run-off. Keep the
 // dirt base untouched until grass reaches the corresponding end of the field.
 if(!registered)for(const sign of [-1,1]){
  const edge=faixasGramado3D(progress).find(b=>sign<0?b.left<=-52.49:b.left+b.width>=52.49)
  if(!edge?.grass)continue
  const geometry=new THREE.PlaneGeometry(4,68),uv=geometry.getAttribute('uv')
  for(let i=0;i<uv.count;i++)uv.setX(i,(sign*54.5-2+uv.getX(i)*4+52.5)/105)
  const runoff=new THREE.Mesh(geometry,greens[edge.stripe]);runoff.name='goal-grass-runoff';runoff.rotation.x=-Math.PI/2;runoff.position.set(sign*54.5,.002,0);runoff.receiveShadow=true;scene.add(runoff)
 }
 const white=material('#f4f0df')
 const line=(points:[number,number][])=>{for(let i=1;i<points.length;i++){
  const [x,z]=points[i-1],[bx,bz]=points[i],dx=bx-x,dz=bz-z
  const geometry=new THREE.PlaneGeometry(Math.hypot(dx,dz),.12);geometry.rotateX(-Math.PI/2)
  const paint=new THREE.Mesh(geometry,white);paint.rotation.y=-Math.atan2(dz,dx);paint.position.set((x+bx)/2,.006,(z+bz)/2);paint.receiveShadow=true;scene.add(paint)
 }}
 line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]);line([[0,-34],[0,34]])
 const arc=(cx:number,cz:number,r:number,start=0,end=Math.PI*2)=>line(Array.from({length:81},(_,i)=>{const a=start+(end-start)*i/80;return [cx+Math.cos(a)*r,cz+Math.sin(a)*r]}))
 const spot=(x:number,z:number)=>{const mesh=new THREE.Mesh(new THREE.CircleGeometry(.11,16),white);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.006,z);scene.add(mesh)}
 arc(0,0,9.15);spot(0,0)
 for(const sign of [-1,1]){
  const x=sign*52.5
  line([[x,-20.16],[x-sign*16.5,-20.16],[x-sign*16.5,20.16],[x,20.16]])
  line([[x,-9.16],[x-sign*5.5,-9.16],[x-sign*5.5,9.16],[x,9.16]])
  spot(x-sign*11,0)
  const half=Math.acos(5.5/9.15);arc(x-sign*11,0,9.15,sign===-1?-half:Math.PI-half,sign===-1?half:Math.PI+half)
  for(const z of [-34,34]){const a=sign===-1?(z<0?0:-Math.PI/2):(z<0?Math.PI/2:Math.PI);arc(x,z,1,a,a+Math.PI/2);tube(scene,new THREE.Vector3(x,.05,z),new THREE.Vector3(x,1.5,z),.025,white);box(scene,.3,.22,.015,x+.15,1.35,z,material('#FFC400'))}
  // Actual goal frame and net in space; players and ball use depth testing.
  // The regulatory opening is measured INSIDE the 12 cm tubes.
  tube(scene,new THREE.Vector3(x,0,-3.72),new THREE.Vector3(x,2.50,-3.72),.06,white)
  tube(scene,new THREE.Vector3(x,0,3.72),new THREE.Vector3(x,2.50,3.72),.06,white)
  tube(scene,new THREE.Vector3(x,2.50,-3.72),new THREE.Vector3(x,2.50,3.72),.06,white)
  criarRedeGol3D(scene,sign)
 }
 // Merge static markings/frames and grass strips to reduce mobile draw calls.
 scene.updateMatrixWorld(true)
 const groups=new Map<THREE.Material,THREE.Mesh[]>()
 for(const node of scene.children){if(node instanceof THREE.Mesh&&!Array.isArray(node.material)){const group=groups.get(node.material)??[];group.push(node);groups.set(node.material,group)}}
 for(const [mat,nodes] of groups){if(nodes.length<2)continue;const pieces=nodes.map(node=>node.geometry.clone().applyMatrix4(node.matrixWorld)),merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!merged)continue;for(const node of nodes){scene.remove(node);node.geometry.dispose()}const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=nodes.some(n=>n.castShadow);mesh.receiveShadow=true;scene.add(mesh)}
 // Dispose unused materials, which otherwise are not visited with the scene.
 for(const mat of [...greens,dirt])if(!groups.has(mat))mat.dispose()
 return grass
}

export type InspecaoPartidaComplexo={replay?:boolean;owner?:string;players:number;ball:QuadroFutebol['ball'];time?:number;phase?:QuadroFutebol['phase'];matchId?:string;detail?:ReturnType<Awaited<ReturnType<typeof loadPlayers>>['inspect']>;official?:QuadroFutebol['official']}
export type PartidaComplexo={update:(state:EstadoPartidaEstadio|undefined,now:number,camera?:THREE.PerspectiveCamera,viewportHeight?:number)=>void;subjects:()=>readonly {mx:number;mz:number;visible?:boolean;key?:string;side?:'home'|'away';keeper?:boolean}[];inspect:()=>InspecaoPartidaComplexo;dispose:()=>void}

/** Every resource belongs to this subtree. Shared geometries/materials are
 * released once; other parts of the complex never enter this traversal. */
function descartarObjetos(root:THREE.Object3D,extraTextures:readonly THREE.Texture[]=[]){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set(extraTextures)
 root.traverse(node=>{
  if(!(node instanceof THREE.Mesh||node instanceof THREE.LineSegments))return
  geometries.add(node.geometry)
  for(const mat of Array.isArray(node.material)?node.material:[node.material]){
   materials.add(mat)
   for(const value of Object.values(mat))if(value instanceof THREE.Texture)textures.add(value)
  }
 })
 for(const texture of textures){texture.userData.disposed=true;texture.dispose()}
 for(const geometry of geometries)geometry.dispose()
 for(const mat of materials)mat.dispose()
 root.removeFromParent();root.clear()
}

function reservasReais(bench:readonly AtletaEstadio[]|undefined,activeIds:Set<string>){
 const seen=new Set<string>()
 return (bench??[]).filter(p=>{
  if(p.fake||!p.id.trim()||!p.name.trim()||!['GOL','LAT','ZAG','MEI','ATA'].includes(p.pos)||activeIds.has(p.id)||seen.has(p.id))return false
  seen.add(p.id);return true
 }).slice(0,7)
}

/** Field and match objects for the complex's one renderer. There is no clock,
 * RAF, score update or autonomous simulation here: all poses come from the
 * same shared frame used by the existing live match view. */
// 🧍 27/10: boneco novo dos 22 (Tripo + movimentos Mixamo + uniformes por região — APROVADO pelo Diego). O 3D inteiro já é só
// da conta dele. `localStorage['esc3d-boneco']='antigo'` volta pro boneco de antes; se o novo falhar, volta sozinho
function bonecoNovo(){try{return localStorage.getItem('esc3d-boneco')!=='antigo'}catch{return true}}
export function criarPartidaComplexo(scene:THREE.Scene,stadium?:StadiumSave,state?:EstadoPartidaEstadio,onReady?:()=>void,getPresident?:()=>PresidenteBaseSave|undefined):PartidaComplexo{
 const field=new THREE.Scene();field.name='complexo-campo'
 let disposed=false
 // Build before attaching: the original static batching only sees this field.
 const grass=criarCampo3D(field,stadium??state?.context.stadium,false,()=>{if(!disposed)onReady?.()})
 scene.add(field)
 type Body=ReturnType<typeof person>
 type Match={humanoids?:Pick<Awaited<ReturnType<typeof loadPlayers>>,'update'|'presentFrame'|'inspect'|'dispose'>;root:THREE.Scene;signature:string;bodies:Map<string,Body>;referee:Body;coaches:{body:Body;x:number}[];reserves:{body:Body;side:'home'|'away';keeper:boolean}[];ball:THREE.Mesh;people:ReturnType<typeof instanciarPersonagens>}
 let match:Match|undefined
 const empty=():InspecaoPartidaComplexo=>({players:0,ball:{x:0,y:.11,z:0}})
 let inspection=empty()
 let cameraSubjects:readonly {mx:number;mz:number;visible?:boolean;key?:string;side?:'home'|'away';keeper?:boolean}[]=[]
 const clearMatch=()=>{
  if(match){match.humanoids?.dispose();match.people.dispose();descartarObjetos(match.root);match=undefined}
  inspection=empty()
  cameraSubjects=[]
 }
 const update=(current:EstadoPartidaEstadio|undefined,now:number,camera?:THREE.PerspectiveCamera,viewportHeight?:number)=>{
  if(disposed)return
  if(!current||(!entradaOficialCompleta(current)&&atletasEmCampo(current).length!==22)){clearMatch();return}
  const snapshot=quadroFutebol3D(current,now)
  if(!snapshot.players.length||(!current.officialInput&&snapshot.players.length!==22)){clearMatch();return}
  cameraSubjects=snapshot.players
  const lineup=current.officialInput?atletasEmCampo(current):snapshot.players
  const benches=(['home','away'] as const).map(side=>reservasReais(side==='home'?current.context.homeBench:current.context.awayBench,new Set(lineup.filter(p=>p.side===side).map(p=>p.id))))
  // A dismissal hides/releases the existing slot; it must neither erase the
  // pitch nor rebuild every avatar while their replacement models load.
  const signature=JSON.stringify([current.context.id,current.viewerClubId,current.officialInput??snapshot.players.map(p=>[p.key,p.keeper]),benches.map(bench=>bench.map(p=>[p.id,p.pos]))])
  if(match?.signature!==signature){
   clearMatch()
   const root=new THREE.Scene();root.name='complexo-partida'
   const bodies=new Map((current.officialInput?[]:snapshot.players).map((p,i)=>{
    const body=person(p.keeper?'#d6b329':p.side==='home'?current.homeColor:current.awayColor,['#b9815b','#805439','#d5aa80'][i%3],p.keeper)
    body.group.name=p.key;root.add(body.group);return [p.key,body] as const
   }))
   const referee=person('#efc42f','#a87250');referee.group.name='match-referee';root.add(referee.group);referee.group.visible=!current.officialInput
   const coaches:{body:Body;x:number}[]=[],reserves:{body:Body;side:'home'|'away';keeper:boolean}[]=[]
   // The bench and coach retain the original north touchline placement.
   for(const [i,x] of [-18,18].entries()){
    const side=i?'away':'home',area=new THREE.Group();area.name=side+'-technical-area';area.position.x=x;area.rotation.y=Math.PI;area.visible=!current.officialInput;root.add(area)
    const coach=person('#28343b','#ad805d');coach.group.name=side+'-coach';coach.group.position.set(0,0,-TECNICO_Z);coach.group.rotation.y=Math.PI;area.add(coach.group);coaches.push({body:coach,x})
    const benchMaterial=material('#384c51'),legsMaterial=material('#afb3ae')
    box(area,10,.12,.65,0,.29,-BANCO_Z,benchMaterial).name=side+'-bench-seat'
    box(area,10,.7,.10,0,.70,-BANCO_Z+.38,benchMaterial)
    for(const dx of [-4.5,4.5])box(area,.12,.29,.5,dx,.145,-BANCO_Z,legsMaterial)
    benches[i].forEach((p,j)=>{
     const keeper=p.pos==='GOL',body=person(keeper?'#d6b329':i?current.awayColor:current.homeColor,'#aa7752',keeper)
     body.group.name=side+'-bench:'+p.id;body.group.position.set(-3.9+j*1.3,-.34,-BANCO_Z);body.group.rotation.y=Math.PI
     body.legs.forEach(leg=>{leg.hip.rotation.x=-Math.PI/2;leg.knee.rotation.x=Math.PI/2});body.arms.forEach(arm=>{arm.rotation.x=-.3});body.elbows.forEach(elbow=>{elbow.rotation.x=-.9})
     area.add(body.group);reserves.push({body,side,keeper})
    })
    const white=material('#e9e5d9');for(const dx of [-6,6])box(area,.10,.025,2.4,dx,.03,35.6,white);box(area,12,.025,.1,0,.03,34.4,white)
   }
   const people=instanciarPersonagens(root,current.officialInput?[]:[...[...bodies.values()].map(b=>b.group),referee.group,...coaches.map(c=>c.body.group),...reserves.map(r=>r.body.group)])
   const ball=criarBolaFutebol3D();root.add(ball)
   scene.add(root);match={root,signature,bodies,referee,coaches,reserves,ball,people}
   if(current.officialInput){const target=match,prepared=()=>{if(!disposed&&match===target)onReady?.()}
    const antigo=()=>import('./futebol3d/players.mjs').then(module=>module.loadPlayers(root,current,snapshot,{president:getPresident?.(),onPrepared:prepared}))
    // 🧍 27/10: o JOGADOR NOVO (Meshy + movimentos Mixamo). Se não carregar, volta sozinho pro boneco de antes — o jogo nunca fica sem os 22
    const carrega=bonecoNovo()?import('./futebol3d/players-novo.mjs').then(module=>module.loadPlayersNovo(root,current,snapshot,{onPrepared:prepared})).catch(error=>{console.warn('Jogador novo indisponível; usando o boneco de antes',error);return antigo()}):antigo()
    carrega.then(players=>{if(disposed||match!==target){players.dispose();return}target.humanoids=players;onReady?.()}).catch(error=>console.error('Humanoide 3D indisponível',error))}
  }
  const {bodies,referee,coaches,reserves,ball,people}=match
  for(const {body,x} of coaches){body.group.rotation.y=Math.atan2(snapshot.ball.x-x,snapshot.ball.z-TECNICO_Z)-Math.PI;body.arms[0].rotation.x=-.2-Math.sin(snapshot.time*1.2+x)*.08;body.elbows[0].rotation.x=-.35}
  match.humanoids?.update(snapshot,camera,viewportHeight)
  const presentation=match.humanoids?.presentFrame(snapshot)??snapshot
  for(const p of snapshot.players){const body=bodies.get(p.key);if(!body)continue;body.group.visible=p.visible!==false;pose(body,p);body.kit.color.set(p.keeper?'#d6b329':p.side==='home'?current.homeColor:current.awayColor)}
  for(const {body,side,keeper} of reserves)body.kit.color.set(keeper?'#d6b329':side==='home'?current.homeColor:current.awayColor)
  pose(referee,{mx:snapshot.referee.x,mz:snapshot.referee.z,heading:snapshot.referee.heading,distance:snapshot.referee.distance,speed:snapshot.referee.speed,kick:0,throwing:0})
  posicionarBolaFutebol3D(ball,presentation);atualizarRedesGol3D(field,presentation)
  people.update()
  inspection={replay:snapshot.replay,owner:snapshot.owner,players:snapshot.players.length,ball:{...presentation.ball},time:snapshot.time,phase:snapshot.phase,matchId:current.context.id,detail:match.humanoids?.inspect(),official:snapshot.official}
 }
 if(state)update(state,state.visualClock?.sampledAt??performance.now())
 return {
  update,
  subjects:()=>cameraSubjects,
  inspect:()=>({...inspection,ball:{...inspection.ball}}),
  dispose:()=>{if(disposed)return;disposed=true;clearMatch();descartarObjetos(field,[grass])},
 }
}
