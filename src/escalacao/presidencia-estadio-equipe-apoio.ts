import {serviceExitPoints} from './cidade3d/stadium-entrances.mjs'
import {intervalSpectatorPoints,spectatorVisibleAt} from './cidade3d/spectator-access.mjs'
import {PLANTA_COMPLEXO} from './presidencia-complexo-model'
import * as THREE from 'three'
import {createCivilian} from './cidade3d/civilians.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {activityRoute,type CityPoint} from './cidade3d/activity-route.mjs'
import type {StadiumDayFrame} from './cidade3d/stadium-day.mjs'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {BANCO_Z,TECNICO_Z} from './presidencia-area-tecnica'
import {acelerarRaios} from './presidencia-raio-rapido'
import {capturedStandingPose,type FootballPresentationActor} from './presidencia-equipe-pose'

/** Off-pitch roles never kick, save or move the official ball. Reserve names
 * must come from existing benches; no filler athlete/card is manufactured. */
export function criarEquipeApoioEstadio(scene:THREE.Scene,onReady:()=>void,footballBodies=true){
 const root=new THREE.Group();root.name='stadium-operations';root.visible=false;scene.add(root)
 const floors:THREE.Mesh[]=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica','complexo-campo'])scene.getObjectByName(name)?.traverse(n=>{if(n instanceof THREE.Mesh&&!(n instanceof THREE.SkinnedMesh)&&!(n instanceof THREE.InstancedMesh))floors.push(n)});scene.updateMatrixWorld(true);acelerarRaios(floors);const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),normal=new THREE.Vector3(),heights=new Map<string,number>();const ground=(x:number,z:number)=>{const k=x.toFixed(2)+':'+z.toFixed(2);if(heights.has(k))return heights.get(k)!;ray.set(new THREE.Vector3(x,.6,z),down);ray.far=1;const hit=ray.intersectObjects(floors,false).find(h=>h.point.y<.27&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5);const y=hit?.point.y??-.02;heights.set(k,y);return y};const route=(points:CityPoint[])=>{const dense:CityPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.6));for(let j=i===1?0:1;j<=n;j++){const u=j/n,x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u;dense.push({x,y:ground(x,z),z})}}return activityRoute(dense,1.05)}
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
 const material=(color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.9});materials.add(m);return m}
 const grey=material('#384c51'),metal=material('#8b9693'),white=material('#e9e5d9'),green=material('#337257')
 const meshBox=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);geometries.add(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh}
 const floor=-.02,technicalMeshes:THREE.Mesh[]=[]
 // 🪑 08/11: o banco de reservas é parte do estádio, não só do dia de jogo — a vista "Banco e área técnica" mostrava o vazio fora do
 // dia de jogo. Os bancos ficam num grupo à parte, sempre de pé; só somem quando a partida antiga desenha os dela (`legacy`).
 const benches=new THREE.Group();benches.name='stadium-technical-benches';scene.add(benches)
 for(const x of [-18,18]){technicalMeshes.push(meshBox(10,.12,.65,x,floor+.30,BANCO_Z,grey));technicalMeshes.push(meshBox(10,.62,.08,x,floor+.64,BANCO_Z-.34,grey));for(const dx of [-4.5,4.5])technicalMeshes.push(meshBox(.12,.25,.5,x+dx,floor+.125,BANCO_Z,metal))}
 for(const m of technicalMeshes)benches.add(m)
 meshBox(.65,.35,.42,39,floor+.175,36.8,white);meshBox(.20,.22,.015,39,floor+.2,37.02,green);meshBox(.31,.08,.017,39,floor+.2,37.025,green)
 const bin=meshBox(.55,.8,.55,-10,.25,109,grey);bin.name='stadium-cleanup-bin'
 type Person={id:string;role:string;body:ReturnType<typeof createCivilian>;anchor:CityPoint;heading:number;exit?:ReturnType<typeof activityRoute>;arrival?:ReturnType<typeof activityRoute>;arrivalDelay?:number}
 const people:Person[]=[],add=(id:string,role:string,x:number,z:number,color:string,variant='adult-man',heading=0)=>{const body=createCivilian(root,{deferUntilVisible:true,id:'stadium-'+id,outfitColor:color,variant,onReady});const p={id,role,body,anchor:{x,y:ground(x,z),z},heading};people.push(p);return p}
 add('delegation-marshal','marshal',-98,24,'#b4a331','adult-woman',-Math.PI/2)
 add('home-coach','coach',-18,TECNICO_Z,'#28343b');add('away-coach','coach',18,TECNICO_Z,'#414137','older-man')
 add('home-assistant','assistant',-22,BANCO_Z,'#28343b','older-man');add('away-assistant','assistant',14,BANCO_Z,'#414137','adult-woman')
 add('medical-a','medical',38,36.8,'#e4e4d9','adult-woman',Math.PI);add('medical-b','medical',40.2,36.8,'#337257','adult-man',Math.PI)
 for(const x of [-54.8,54.8])for(const z of [-11,11])add('ball-boy-'+x+':'+z,'ball-attendant',x,z,'#1ca7a3','child-boy',x<0?Math.PI/2:-Math.PI/2)
 const cleaners=[add('cleaner-west','maintenance',-27,115,'#536e4c','adult-woman'),add('cleaner-east','maintenance',27,115,'#536e4c')]
 const patrols=cleaners.map((p,i)=>route([{...p.anchor},{x:i?24:-24,y:floor,z:106},{x:i?24:-24,y:floor,z:102.5},{x:i?13:-13,y:floor,z:102.5},{x:i?13:-13,y:floor,z:107},{x:i?13:-13,y:floor,z:115},{...p.anchor}]))
 const concourseSides=['home','away'] as const
 const concoursePaths=concourseSides.map(side=>route(intervalSpectatorPoints(side,PLANTA_COMPLEXO.gates[side])))
 const concourse=concoursePaths.map((path,i)=>{const p=path.points[0];return add('concourse-'+concourseSides[i],'interval-spectator',p.x,p.z,i?'#526b84':'#a7a29c',i?'adult-man':'older-woman')})
 for(const p of people){if(['maintenance','interval-spectator','marshal'].includes(p.role))continue;const z=p.anchor.z<0?-1:1;const points=p.anchor.x< -52?[p.anchor,{x:-57.5,y:0,z:z*9},...serviceExitPoints(0)]:p.anchor.x>52?[p.anchor,{x:54.5,y:0,z:z*30},{x:48,y:0,z:z*36},{x:-48,y:0,z:z*36},{x:-54.5,y:0,z:z*30},{x:-57.5,y:0,z:z*9},...serviceExitPoints(0)]:[p.anchor,{x:-48,y:0,z:z*36},{x:-54.5,y:0,z:z*30},{x:-57.5,y:0,z:z*9},...serviceExitPoints(0)];p.exit=route(points)}
 // Every on-field staff member uses the same SERVICE gate as both teams.
 let arrivalIndex=0;for(const p of people){if(!p.exit)continue;const index=arrivalIndex++;p.arrivalDelay=index*1.8;p.arrival=route([{x:-94,y:.16,z:-index*.95},...p.exit.points.slice(0,-1).reverse()])}
 const litter=cleaners.flatMap((_,i)=>[{x:i?24:-24,z:106},{x:i?13:-13,z:107},{x:i?13:-13,z:115},{x:i?27:-27,z:115}]).map((p,i)=>{const mesh=meshBox(.19,.012,.12,p.x,ground(p.x,p.z)+.012,p.z,white);mesh.rotation.y=i*.7;const path=patrols[Math.floor(i/4)];let collectAt=Infinity;for(let t=0;t<=path.duration+.1;t+=.1){const at=path.at(t);if(Math.hypot(at.x-p.x,at.z-p.z)<.8){collectAt=100+t;break}}return{mesh,collected:false,collectAt}})
 let disposed=false,key='',lastMatch:EstadoPartidaEstadio|undefined,day:StadiumDayFrame|undefined,mobile=false,retainedName:string|undefined,benchKey='',generation=0,standClip:THREE.AnimationClip|undefined
 type Reserve={actor:FootballPresentationActor;side:number;name:string;id:string;slot:number;standing:THREE.AnimationAction;soleIndices:number[];baseY:number;lastPose:number;exit:ReturnType<typeof activityRoute>}
 const reserves:Reserve[]=[],clearReserves=()=>{for(const r of reserves){r.actor.mesh.skeleton.dispose();r.actor.dispose()}reserves.length=0}
 async function setBenches(match:EstadoPartidaEstadio){
  const active=[new Set((match.minute>45?match.context.homeSecondHalf??match.context.home:match.context.home).map(p=>p.id)),new Set((match.minute>45?match.context.awaySecondHalf??match.context.away:match.context.away).map(p=>p.id))],benches=[match.context.homeBench??[],match.context.awayBench??[]].map((rows,side)=>{const seen=new Set<string>();return rows.filter(p=>!p.fake&&p.id&&p.name&&!active[side].has(p.id)&&!seen.has(p.id)&&seen.add(p.id)).slice(0,mobile?2:7)})
  const next=JSON.stringify([match.context.id,benches]);if(next===benchKey)return;benchKey=next;const own=++generation;clearReserves()
  try{const [{carregaJogadorNovo,criarJogadorNovo},{uniformeDoTime,GOLEIRO},{clubKitFor}]=await Promise.all([import('./futebol3d/chibi/chibi-player-asset.mjs'),import('./futebol3d/uniformes.mjs'),import('./futebol3d/club-kit.mjs')]);const asset=await carregaJogadorNovo();if(disposed||own!==generation)return
   for(const [side,rows]of benches.entries()){const name=match.officialTeams?.[side]??'',cfg=clubKitFor(name),kit=uniformeDoTime(name,cfg?.colors.primary??(side?match.awayColor:match.homeColor),cfg?.colors.secondary)
    for(const [slot,p]of rows.entries()){const actor=criarJogadorNovo(asset,p.pos==='GOL'?GOLEIRO:kit) as FootballPresentationActor;actor.holder.name='real-reserve:'+side+':'+p.id;root.add(actor.holder);standClip??=capturedStandingPose(actor);const standing=actor.mixer.clipAction(standClip).play();standing.timeScale=0;const walk=actor.acao('caminhada');walk?.play();if(walk){walk.timeScale=0;walk.setEffectiveWeight(0)}const joints=actor.mesh.geometry.attributes.skinIndex,weights=actor.mesh.geometry.attributes.skinWeight,bones=new Set(actor.mesh.skeleton.bones.map((b,i)=>/Foot|Toe/.test(b.name)?i:-1)),soleIndices:number[]=[];for(let i=0;i<weights.count;i+=4)for(let k=0;k<4;k++)if(bones.has(joints.getComponent(i,k))&&weights.getComponent(i,k)>.55){soleIndices.push(i);break}reserves.push({actor,side,id:p.id,name:p.name,slot,standing,soleIndices:soleIndices.filter((_,i)=>i%Math.max(1,Math.floor(soleIndices.length/80))===0),baseY:actor.root.position.y,lastPose:-Infinity,exit:route([{x:(side?18:-18)-3.9+slot*1.3,y:floor,z:-35.75},{x:-48,y:floor,z:-36},{x:-54.5,y:floor,z:-30},{x:-57.5,y:floor,z:-9},...serviceExitPoints(0)])})}
   }onReady()
  }catch{benchKey='';onReady()}
 }
 function configure(input:{day?:StadiumDayFrame;match?:EstadoPartidaEstadio;mobile:boolean;presidentName?:string}){day=input.day;mobile=input.mobile;retainedName=input.presidentName;if(day&&key!==day.key){litter.forEach(l=>l.collected=false);generation++;clearReserves();benchKey='';lastMatch=input.match;key=day.key}if(input.match){lastMatch=input.match;if(footballBodies&&input.match.officialInput)void setBenches(input.match)}}
 const point=new THREE.Vector3()
 function update(time:number,camera?:THREE.Camera,height=720,ball?:{x:number;z:number}){
  const active=!!day&&(day.active||day.phase==='departure'&&day.phaseElapsed<600),legacy=!!lastMatch&&!lastMatch.officialInput;root.visible=active;technicalMeshes.forEach(m=>m.visible=!(legacy&&active));if(!day)return
  for(const [index,p]of people.entries()){
   let pose={...p.anchor,heading:p.heading,distance:0,speed:0,done:true},visible=active,seated=0
   if(p.role==='coach'&&ball)pose.heading=Math.atan2(ball.x-p.anchor.x,ball.z-p.anchor.z)
   if(['coach','assistant'].includes(p.role))visible&&=!legacy;if(p.role==='assistant')seated=1
   if(p.role==='ball-attendant'){visible&&=day.phase==='playing'||day.phase==='arrival';if(mobile&&p.anchor.z<0)visible=false;if(ball)pose.heading=Math.atan2(ball.x-p.anchor.x,ball.z-p.anchor.z)}
   if(p.role==='medical')visible&&=day.phase!=='departure'||day.phaseElapsed<120
   if(p.role==='maintenance'){const i=cleaners.indexOf(p),path=patrols[i];visible&&=(day.phase==='arrival'&&day.elapsed<18)||(day.phase==='departure'&&day.phaseElapsed>=100&&day.phaseElapsed<195);const local=day.phase==='departure'?day.phaseElapsed-100:day.elapsed;pose=path.at(local%path.duration)}
   if(p.role==='interval-spectator'){visible&&=day.phase==='interval';const path=concoursePaths[concourse.indexOf(p)];pose=path.at((day.phaseElapsed+index*4)%path.duration);const side=concourseSides[concourse.indexOf(p)];visible&&=spectatorVisibleAt(pose,side,PLANTA_COMPLEXO.gates[side])}
   if(day.phase==='arrival'&&p.arrival){const local=day.elapsed-(p.arrivalDelay??0);if(local<p.arrival.duration){pose=p.arrival.at(local);seated=0}else if(p.role==='assistant')seated=Math.max(0,Math.min(1,(local-p.arrival.duration)/2))}
   if(day.phase==='departure'&&p.exit){const t=day.phaseElapsed-12-index*1.8;pose=p.exit.at(t);visible&&=!pose.done;seated=0}
   if(p.role==='marshal')visible&&=day.phase!=='departure'||day.phaseElapsed<600
   p.body.root.position.set(pose.x,pose.y,pose.z);p.body.root.rotation.y=pose.heading;const lod=residentVisibility(p.body.root.position,p.role==='ball-attendant'?1.18:1.76,camera,height);p.body.update({seconds:time,distance:pose.distance,speed:pose.speed,seated,visible:visible&&lod.visible,detail:lod.detail})
  }
  for(const l of litter){if(day.phase==='departure'&&day.phaseElapsed>=l.collectAt)l.collected=true;l.mesh.visible=day.phase==='departure'&&!l.collected}
  for(const r of reserves){const t=day.phaseElapsed-6-r.slot*1.8,leaving=day.phase==='departure',pose=leaving?r.exit.at(t):{x:(r.side?18:-18)-3.9+r.slot*1.3,y:floor,z:-35.75,heading:0,distance:0,speed:0,done:false};r.actor.holder.position.set(pose.x,pose.y,pose.z);r.actor.holder.rotation.y=pose.heading;const walk=r.actor.acao('caminhada'),weight=Math.min(1,pose.speed/.6);if(walk){walk.time=(pose.distance/1.25*walk.getClip().duration)%walk.getClip().duration;walk.setEffectiveWeight(weight)}r.standing.setEffectiveWeight(1-weight);const lod=residentVisibility(r.actor.holder.position,1.78,camera,height);r.actor.holder.visible=active&&lod.visible&&(!leaving||!pose.done);if(!r.actor.holder.visible||time>=r.lastPose&&time-r.lastPose<(lod.detail==='far'?1/6:lod.detail==='intermediate'?1/12:1/30))continue;r.lastPose=time;r.actor.root.position.y=r.baseY;r.actor.mixer.update(0);r.actor.holder.updateMatrixWorld(true);r.actor.mesh.skeleton.update();let low=Infinity;for(const i of r.soleIndices)low=Math.min(low,r.actor.mesh.getVertexPosition(i,point).applyMatrix4(r.actor.mesh.matrixWorld).y);if(Number.isFinite(low))r.actor.root.position.y+=pose.y-low+.003;r.actor.holder.updateMatrixWorld(true);r.actor.mesh.skeleton.update();r.actor.updateFrustumBounds()}
 }
 return{root,configure,update,inspect:()=>({key,day:day?.phase,cleanup:{collected:litter.filter(l=>l.collected).length,total:litter.length,handAnimation:'route proximity only; pickup capture unavailable'},people:people.map(p=>({id:p.id,role:p.role,entrance:['maintenance','interval-spectator'].includes(p.role)?undefined:'service',side:p.role==='interval-spectator'?concourseSides[concourse.indexOf(p)]:undefined,visible:p.body.root.visible,arrivalVia:p.arrival?'service':undefined,position:p.body.root.position.toArray(),ready:p.body.inspect().ready})),presidentReference:retainedName??null,presidentAppearance:'generic civil coach; original president outfit not rebuilt',reserves:reserves.map(r=>({id:r.id,name:r.name,side:r.side,visible:r.actor.holder.visible})),benchSource:lastMatch?'official context benches':'no roster available',reservePose:'captured standing; seated football clip unavailable',ballPhysicsChanged:false}),dispose(){disposed=true;generation++;clearReserves();people.forEach(p=>p.body.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());benches.removeFromParent();root.removeFromParent()}}
}
