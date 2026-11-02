import * as THREE from 'three'
import {STADIUM_SERVICE_GATE} from './cidade3d/stadium-entrances.mjs'
import {capturedStandingPose} from './presidencia-equipe-pose'
import {TEAM_COACH,teamCoachAccess} from './cidade3d/coach-access.mjs'
import {acelerarRaios} from './presidencia-raio-rapido'
import type {EstadoComplexo} from './presidencia-complexo-model'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import {criarOnibusEquipe} from './presidencia-onibus-equipe'
import {activityRoute,type CityPoint} from './cidade3d/activity-route.mjs'
import {coachReturnSchedule,STADIUM_DAY,warmupLane} from './cidade3d/stadium-day.mjs'
import {residentVisibility} from './cidade3d/resident-visibility.mjs'
import {criarArteDiaJogo,type IdentidadeDiaJogo} from './presidencia-identidade-dia-jogo'

export type CampoEquipe={mx:number;mz:number;side?:'home'|'away';key?:string;name?:string;visible?:boolean}
export type ElencoChegadaCidade={fixtureId:string;teams:(IdentidadeDiaJogo&{players:{id?:string;name:string;pos?:string;club?:string;year?:number}[]})[]}

/** Separate visual pregame. Uses known fixture rosters, never computes a match.
 * One team at a time uses the dedicated bay next to the stadium wall. Starting an official
 * game immediately hands the field over to its existing 22 actors. */
export function criarChegadaEquipes(scene:THREE.Scene,state:EstadoComplexo,onReady:()=>void){
 const root=new THREE.Group();root.name='city-team-arrivals';scene.add(root)
 const access=teamCoachAccess(),bus={...TEAM_COACH,inbound:access.inbound,outbound:access.outbound,passengerRoute:access.passenger}
 let inbound=activityRoute(bus.inbound,4.2,2),outbound=activityRoute(bus.outbound,4.2,2)
 let unloadAt=inbound.duration+1.4,spacing=1.45,lastExit=unloadAt+10*spacing+4.5,departAt=lastExit+1.4
 let slot=departAt+outbound.duration+6
 const rigs=[criarOnibusEquipe(root,'equipe-casa'),criarOnibusEquipe(root,'equipe-visitante')]
 const temporary=new THREE.Group();temporary.name='delegation-access-cordon';root.add(temporary)
 const cordonGeometry=new THREE.CylinderGeometry(.035,.055,1.1,8),cordonMaterial=new THREE.MeshStandardMaterial({color:'#363e39',metalness:.45,roughness:.65}),beltGeometry=new THREE.BoxGeometry(.035,.055,18)
 for(const z of [4,10,16,22]){const pole=new THREE.Mesh(cordonGeometry,cordonMaterial);pole.position.set(-98.5,.55,z);temporary.add(pole)}
 const belt=new THREE.Mesh(beltGeometry,cordonMaterial);belt.position.set(-98.5,1.02,13);temporary.add(belt)
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=192;const sc=signCanvas.getContext('2d')!;sc.fillStyle='#172720';sc.fillRect(0,0,512,192);sc.fillStyle='#f4ecd6';sc.font='bold 58px sans-serif';sc.textAlign='center';sc.fillText('DELEGAÇÕES',256,80);sc.font='30px sans-serif';sc.fillText('ACESSO DOS ATLETAS',256,142)
 const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;const signGeometry=new THREE.PlaneGeometry(2.4,.9),signMaterial=new THREE.MeshStandardMaterial({map:signTexture,roughness:.85,side:THREE.DoubleSide}),sign=new THREE.Mesh(signGeometry,signMaterial);sign.position.set(-98.5,1.55,22);sign.rotation.y=-Math.PI/2;temporary.add(sign)
 type Actor={holder:THREE.Group;root:THREE.Object3D;mesh:THREE.SkinnedMesh;mixer:THREE.AnimationMixer;acao:(name:string)=>THREE.AnimationAction|null;dispose:()=>void;updateFrustumBounds:()=>void}
 type Member={actor:Actor;standing:THREE.AnimationAction;name:string;side:number;index:number;walk:ReturnType<typeof activityRoute>;lastPose:number;phase:string;pose:ReturnType<ReturnType<typeof activityRoute>['at']>|null;footIndices:number[];baseY:number;warmup:ReturnType<typeof warmupLane>;warmingUp?:boolean;exit?:ReturnType<typeof activityRoute>;boarding?:ReturnType<typeof activityRoute>;wasOnField?:boolean}

 let groundMeshes:THREE.Mesh[]=[]
 const groundCache=new Map<string,number>()
 const refreshGround=()=>{groundCache.clear();groundMeshes=[];for(const name of ['complexo-entorno','estadio-arquitetura-volumetrica','complexo-campo'])scene.getObjectByName(name)?.traverse(n=>{if(n instanceof THREE.Mesh&&!(n instanceof THREE.SkinnedMesh)&&!(n instanceof THREE.InstancedMesh))groundMeshes.push(n)});scene.updateMatrixWorld(true);acelerarRaios(groundMeshes)}
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),v=new THREE.Vector3(),normal=new THREE.Vector3()
 const ground=(p:Pick<CityPoint,'x'|'z'>&{y?:number})=>{const key=p.x.toFixed(3)+':'+p.z.toFixed(3);if(groundCache.has(key))return groundCache.get(key)!;ray.set(v.set(p.x,.6,p.z),down);ray.far=1;const hit=ray.intersectObjects(groundMeshes,false).find(h=>h.point.y<.26&&h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.5);const y=hit?.point.y??p.y??0;groundCache.set(key,y);return y}
 const labels:THREE.Mesh[]=[],artwork:ReturnType<typeof criarArteDiaJogo>[]=[],liveries:IdentidadeDiaJogo[]=[]
 const indicators=rigs.map(rig=>{const geometry=new THREE.BoxGeometry(.09,.12,.17),material=new THREE.MeshStandardMaterial({color:'#6b4a14',emissive:'#ffb324',emissiveIntensity:0}),mesh=new THREE.InstancedMesh(geometry,material,4),dummy=new THREE.Object3D();let i=0;for(const x of [-1,1])for(const z of [-1,1]){dummy.position.set(x*1.39,1.28,z*5.95);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}mesh.name='coach-hazard-lights';rig.root.add(mesh);return{mesh,geometry,material,on:false}})
 function clearLabels(){for(const mesh of labels){mesh.removeFromParent();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose()}labels.length=0;artwork.forEach(a=>a.dispose());artwork.length=0;liveries.length=0}
 function labelTeam(side:number,identity:IdentidadeDiaJogo){
  liveries[side]=identity;rigs[side].setColor(identity.color);rigs[side].setSecondaryColor(identity.secondaryColor??'#152322')
  const banner=criarArteDiaJogo(identity,'coach',onReady),roof=criarArteDiaJogo(identity,'roof',onReady);artwork.push(banner,roof)
  const add=(texture:THREE.Texture,w:number,h:number,x:number,y:number,z:number,rx=0,ry=0)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.8}));mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);rigs[side].root.add(mesh);labels.push(mesh)}
  for(const sign of [-1,1])add(banner.texture,8.1,.71,sign*1.45,1.25,-.55,0,sign*Math.PI/2)
  add(roof.texture,2.15,2.15,0,3.755,0,-Math.PI/2)
  // Destination banner above the windscreen, leaving the driver glazing clear.
  add(banner.texture,2.15,.27,0,3.46,5.965)
 }
 let actors:Member[]=[],key='',generation=0,active=false,seconds=0,startedAt=0,ready=false,error:string|undefined,completed=false,released=false
 let returnReleased=false,returnDelay=0
 let mode='arrival',modeAt=0,modeKey='',builtMode='',knownRosters:ElencoChegadaCidade|undefined,fieldSnapshot:CampoEquipe[]=[]
 let phase='idle',teams:string[]=[],vehiclePhases:string[]=[],standingClip:THREE.AnimationClip|undefined
 function clear(){actors.forEach(a=>{a.actor.mesh.skeleton.dispose();a.actor.dispose()});actors=[];ready=false;error=undefined}
 const playerRoute=(side:number,index:number):CityPoint[]=>{
  const endX=side?26-index*1.8:-8-index*1.8
  const points=[...bus.passengerRoute.map((p,i)=>({...p,y:i<4?p.y+ground(access.bay):ground(p)})),
   {x:-57.5,y:.16,z:9},{x:-54.5,y:.16,z:30},{x:-48,y:.16,z:38.8},{x:endX,y:.16,z:38.8},{x:endX,y:.16,z:37.2}]
  const dense:CityPoint[]=[]
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/.7));for(let j=i===1?0:1;j<=n;j++){const u=j/n,p={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};if(i>=5)p.y=ground(p);dense.push(p)}}
  return dense
 }
 function setupTransition(){
  if(!ready||builtMode===modeKey||!['interval','departure'].includes(mode))return
  builtMode=modeKey
  for(const m of actors){const side=m.side?'away':'home',group=fieldSnapshot.filter(p=>p.side===side),p=group.find(p=>p.name===m.name)??group[m.index];
   m.wasOnField=!!p&&p.visible!==false
   const points=p?[{x:p.mx,y:ground({x:p.mx,z:p.mz}),z:p.mz},{x:Math.max(-48,Math.min(48,p.mx)),y:0,z:38.8},{x:-48,y:.16,z:38.8},{x:-54.5,y:.16,z:30},{x:-57.5,y:.16,z:9},{...STADIUM_SERVICE_GATE.inside,y:.16}]:null
   m.exit=points?activityRoute(measureWalk(points),1.25):undefined
   // Return from the internal access, through the actual wall-side doorway,
   // up the same steps and into the coach. Bodies hide only once inside.
   // m.walk includes its field tail; take only the original coach stair/access.
   const stair=[...bus.passengerRoute].reverse().map((p,i,a)=>({...p,y:i>=a.length-4?p.y+ground(access.bay):ground(p)}))
   const inside=[{...STADIUM_SERVICE_GATE.inside,y:.16},...stair]
   m.boarding=activityRoute(measureWalk(inside,true),1.15)
  }
 }
 function measureWalk(points:CityPoint[],preserveStairs=false){const dense:CityPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/.5));for(let j=i===1?0:1;j<=n;j++){const u=j/n,p={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};if(!(preserveStairs&&i>=points.length-4))p.y=ground(p);dense.push(p)}}return dense}
 async function configure(journey:JornadaComplexo|undefined,rosters:ElencoChegadaCidade|undefined,time:number,hasMatch:boolean,subjects:readonly CampoEquipe[]=[]){
  // Finish an already returning delegation before showing the next pregame.
  // A new LIVE match always takes precedence; its actors are never delayed.
  if(active&&mode==='departure'&&!completed&&(!journey||journey.phase==='idle'||journey.phase==='arrival'&&key!==journey.key)){root.visible=true;return}
  if(rosters?.fixtureId===journey?.fixtureId&&rosters?.teams.length===2&&rosters.teams.every(t=>t.players.length===11))knownRosters=rosters
  const requested=journey?.phase??'idle',nextModeKey=(journey?.key??'idle')+'|'+requested
  if(modeKey!==nextModeKey){modeKey=nextModeKey;mode=requested;modeAt=time;returnReleased=false;returnDelay=0;fieldSnapshot=subjects.map(p=>({...p}));if(key!==journey?.key)builtMode=''}
  const roster=knownRosters?.fixtureId===journey?.fixtureId?knownRosters:undefined
  const eligible=state.valid&&!!journey?.hosting&&['arrival','interval','departure'].includes(requested)&&!!roster
  active=eligible;root.visible=active
  if(!active){phase=hasMatch?'official-match':'idle';actors.forEach(m=>m.actor.holder.visible=false);return}
  if(key===journey!.key&&ready){setupTransition();return}
  if(key===journey!.key&&!error)return
  key=journey!.key;const own=++generation;clear();clearLabels();startedAt=time;completed=false;released=false;vehiclePhases=[];teams=roster!.teams.map(t=>t.name)
  try{
   const [{carregaJogadorNovo,criarJogadorNovo},{uniformeDoTime,GOLEIRO},{clubKitFor}]=await Promise.all([import('./futebol3d/chibi/chibi-player-asset.mjs'),import('./futebol3d/uniformes.mjs'),import('./futebol3d/club-kit.mjs')])
   const asset=await carregaJogadorNovo();if(own!==generation)return;refreshGround();temporary.position.y=ground({x:-98.5,y:0,z:13})
   const measured=(points:CityPoint[])=>{const raw=points.map(p=>({...p,y:ground(p)}));return raw.map((p,i)=>({...p,y:raw.slice(Math.max(0,i-3),Math.min(raw.length,i+4)).reduce((a,b)=>a+b.y,0)/Math.min(7,i+4,raw.length-i+3)}))}
   inbound=activityRoute(measured(bus.inbound),4.2,2);outbound=activityRoute(measured(bus.outbound),4.2,2)
   unloadAt=inbound.duration+1.4;lastExit=unloadAt+10*spacing+4.5;departAt=lastExit+1.4;slot=departAt+outbound.duration+6
   roster!.teams.forEach((team,side)=>{const cfg=clubKitFor(team.name);labelTeam(side,{...team,color:cfg?.colors.primary??team.color,secondaryColor:cfg?.colors.secondary??team.secondaryColor});const kit=uniformeDoTime(team.name,cfg?.colors?.primary??team.color,cfg?.colors?.secondary)
    team.players.forEach((player,index)=>{
     const actor=criarJogadorNovo(asset,player.pos==='GOL'?GOLEIRO:kit) as Actor;actor.holder.name=`team-arrival:${side}:${player.name}`;actor.holder.visible=false;root.add(actor.holder)
     standingClip??=capturedStandingPose(actor);const standing=actor.mixer.clipAction(standingClip);standing.play();standing.timeScale=0;standing.setEffectiveWeight(1)
     for(const name of ['caminhada','trote']){const a=actor.acao(name);a?.play();if(a){a.timeScale=0;a.setEffectiveWeight(0)}}
     const joints=actor.mesh.geometry.getAttribute('skinIndex'),weights=actor.mesh.geometry.getAttribute('skinWeight'),footBones=new Set(actor.mesh.skeleton.bones.map((b,i)=>/Foot|Toe/.test(b.name)?i:-1)),indices:number[]=[]
     for(let i=0;i<weights.count;i++)for(const k of ['X','Y','Z','W'] as const){if(footBones.has(joints[`get${k}`](i))&&weights[`get${k}`](i)>.6){indices.push(i);break}}
     const footIndices=indices.filter((_,i)=>i%Math.max(1,Math.floor(indices.length/80))===0)
     const walk=activityRoute(playerRoute(side,index),1.35);actors.push({actor,standing,warmup:warmupLane(walk.points.at(-1)!),name:player.name,side,index,walk,lastPose:-Infinity,phase:'riding',pose:null,footIndices,baseY:actor.root.position.y})
    })
   });ready=true;setupTransition();onReady()
  }catch(e){error=e instanceof Error?e.message:String(e);onReady()}
 }
 function update(time:number,camera?:THREE.Camera,height=720,laneClear=true,crowdReady=true,earliestStart=0){
  seconds=time;if(!active)return
  setupTransition()
  const transition=['interval','departure'].includes(mode),post=mode==='departure',since=Math.max(0,time-modeAt),returnTiming=coachReturnSchedule({inbound:inbound.duration,outbound:outbound.duration,boarding:Math.max(0,...actors.map(m=>m.boarding?.duration??0))})
  if(post&&!returnReleased){if(!laneClear)returnDelay=Math.max(returnDelay,since-STADIUM_DAY.returnCoaches);else if(since>=STADIUM_DAY.returnCoaches)returnReleased=true}
  const postTime=since-STADIUM_DAY.returnCoaches-returnDelay
  if(transition){
   phase=post?(returnReleased?'returning-for-teams':'waiting-for-return-bay'):'interval-access'
   for(const [side,rig]of rigs.entries()){
    const t=postTime-side*returnTiming.slot,drive=t<inbound.duration?inbound.at(t):t<returnTiming.depart?inbound.at(inbound.duration):outbound.at(t-returnTiming.depart)
    rig.root.visible=post&&returnReleased&&ready&&t>=0&&t<returnTiming.end;rig.root.position.set(drive.x,drive.y,drive.z);rig.root.rotation.y=drive.heading
    const opening=t<inbound.duration?0:t<returnTiming.open?(t-inbound.duration)/1.4:t<returnTiming.close?1:t<returnTiming.depart?1-(t-returnTiming.close)/1.4:0
    rig.update(t<returnTiming.depart?drive.distance:inbound.length+drive.distance,Math.max(0,Math.min(1,opening)))
    vehiclePhases[side]=!post?'absent':t<0?'waiting':t<inbound.duration?'returning':t<returnTiming.open?'opening':t<returnTiming.close?'boarding':t<returnTiming.depart?'closing':t<returnTiming.end?'leaving':'gone'
    const hazard=rig.root.visible&&opening>0&&Math.floor(t*2.5)%2===0;indicators[side].on=hazard;indicators[side].material.emissiveIntensity=hazard?2.5:0
   }
   for(const m of actors){const t=since-m.side*6-m.index*1.7,board=postTime-m.side*returnTiming.slot-returnTiming.open-m.index*spacing;
    m.warmingUp=false;
    if(post&&returnReleased&&board>=0&&m.boarding){m.pose=m.boarding.at(board);m.phase=m.pose.done?'on-coach':'boarding';renderMember(m,m.pose,time,camera,height,!m.pose.done)}
    else if(m.wasOnField&&m.exit){m.pose=m.exit.at(t);m.phase=t<0?'waiting-for-exit':m.pose.done?'inside-stadium':'leaving-field';renderMember(m,m.pose,time,camera,height,!m.pose.done)}
    else{m.phase='inside-stadium';m.actor.holder.visible=false}
   }
   completed=post&&returnReleased&&postTime>=returnTiming.slot+returnTiming.end;temporary.visible=post&&!completed
   if(completed)phase='teams-departed'
   return
  }
  temporary.visible=true
  // Loading cannot silently consume the arrival while the phone is fetching.
  // An occupied public bay may delay the FIRST departure, never rewind a coach
  // that is already driving/alighting if a later spectator service appears.
  if(!ready||(!released&&(!laneClear||!crowdReady))){startedAt=time;phase=!ready?'loading':!crowdReady?'waiting-for-supporters':'waiting-for-bay';rigs.forEach(r=>r.root.visible=false);return}
  released=true
  startedAt=Math.max(startedAt,earliestStart)
  const local=Math.max(0,time-startedAt);phase='arrival';vehiclePhases=[]
  for(const [side,rig]of rigs.entries()){
   const t=local-side*slot,drive=t<inbound.duration?inbound.at(t):t<departAt?inbound.at(inbound.duration):outbound.at(t-departAt)
   rig.root.visible=t>=0&&t<departAt+outbound.duration
   vehiclePhases.push(t<0?'waiting':t<inbound.duration?'arriving':t<unloadAt?'opening':t<lastExit?'alighting':t<departAt?'closing':t<departAt+outbound.duration?'departing':'gone')
   rig.root.position.set(drive.x,drive.y,drive.z);rig.root.rotation.y=drive.heading
   const opening=t<inbound.duration?0:t<unloadAt?(t-inbound.duration)/1.4:t<lastExit?1:t<departAt?1-(t-lastExit)/1.4:0
   rig.update(t<departAt?drive.distance:inbound.length+drive.distance,opening)
   const hazard=t>=inbound.duration&&t<departAt&&Math.floor(t*2.5)%2===0;indicators[side].on=hazard;indicators[side].material.emissiveIntensity=hazard?2.5:0;indicators[side].material.color.set(hazard?'#ffc057':'#6b4a14')
  }
  for(const m of actors){const t=local-m.side*slot-unloadAt-m.index*spacing;
   let pose=m.walk.at(t);m.warmingUp=t>m.walk.duration+3;if(m.warmingUp)pose=m.warmup.at(t-m.walk.duration-3);m.pose=pose;m.phase=t<0?'riding':t>=m.walk.duration?'at-field':'walking';
   renderMember(m,pose,time,camera,height,t>=0)

  }
  completed=actors.length===22&&actors.every(a=>a.phase==='at-field');if(completed)phase='ready-at-field'
 }
 function renderMember(m:Member,pose:ReturnType<ReturnType<typeof activityRoute>['at']>,time:number,camera:THREE.Camera|undefined,height:number,visible:boolean){
   const lod=residentVisibility(new THREE.Vector3(pose.x,pose.y,pose.z),1.78,camera,height)
   m.actor.holder.visible=visible&&lod.visible;m.actor.holder.position.set(pose.x,pose.y,pose.z);m.actor.holder.rotation.y=pose.heading+(mode==='arrival'&&pose.done?Math.atan2(Math.sin(Math.PI-pose.heading),Math.cos(Math.PI-pose.heading))*Math.min(1,Math.max(0,(time-startedAt-m.side*slot-unloadAt-m.index*spacing-m.walk.duration)/1.2)):0)
   if(!m.actor.holder.visible||(time>=m.lastPose&&time-m.lastPose<(lod.detail==='far'?1/6:lod.detail==='intermediate'?1/12:1/30)))return
   m.lastPose=time;const walk=m.actor.acao('caminhada'),run=m.actor.acao('trote'),runBlend=m.warmingUp?Math.max(0,Math.min(1,(pose.speed-1.2)/.6)):0,weight=Math.min(1,pose.speed/.6)
   if(walk){walk.time=pose.distance/1.25*(walk.getClip().duration);walk.time%=walk.getClip().duration;walk.setEffectiveWeight(weight*(1-runBlend))}
   if(run){run.time=(pose.distance/2.8*run.getClip().duration)%run.getClip().duration;run.setEffectiveWeight(weight*runBlend)}
   m.standing.time=0;m.standing.setEffectiveWeight(1-weight)
   // SkinnedMesh overrides updateMatrixWorld to refresh bindMatrixInverse;
   // updateWorldMatrix bypasses that override and measures a stale skin pose,
   // making the vertical correction itself lift the feet above the ground.
   m.actor.root.position.y=m.baseY;m.actor.mixer.update(0);m.actor.holder.updateMatrixWorld(true);m.actor.mesh.skeleton.update()
   let low=Infinity;for(const index of m.footIndices)low=Math.min(low,m.actor.mesh.getVertexPosition(index,v).applyMatrix4(m.actor.mesh.matrixWorld).y)
   if(Number.isFinite(low))m.actor.root.position.y+=pose.y-low+.003
   m.actor.holder.updateMatrixWorld(true);m.actor.mesh.skeleton.update()
   m.actor.updateFrustumBounds()
 }
 return{configure,update,overrideField:()=>active&&ready&&['interval','departure'].includes(mode),busy:()=>active&&!completed,inspect:()=>({key,active,ready,error,phase,mode,modeAt,seconds,returnReleased,returnDelay,retainedActors:actors.length,returnSchedule:coachReturnSchedule({inbound:inbound.duration,outbound:outbound.duration,boarding:Math.max(0,...actors.map(m=>m.boarding?.duration??0))}),standingPose:'native-walk double-support frame (static pregame fallback)',localSeconds:Math.max(0,seconds-startedAt),slot,arrivalAt:inbound.duration,unloadAt,access:{...access,bayGround:ground({...access.bay,y:0})},vehicleModel:'high-deck-team-coach',teams,liveries,artwork:artwork.map(a=>a.inspect()),vehicles:vehiclePhases,coaches:rigs.map((r,i)=>({visible:r.root.visible,position:r.root.position.toArray(),heading:r.root.rotation.y,hazard:indicators[i].on,doorOpening:r.doors[0]?Math.abs(r.doors[0].mesh.position.z-r.doors[0].z)/(bus.door.width/2):0})),players:(active?actors:[]).map(m=>({name:m.name,side:m.side,index:m.index,warmingUp:m.warmingUp,phase:m.phase,visible:m.actor.holder.visible,pose:m.pose})),routes:{vehicleIn:bus.inbound,vehicleOut:bus.outbound,player:actors[0]?.walk.points??[]},officialClockChanged:false}),dispose(){generation++;clear();clearLabels();cordonGeometry.dispose();beltGeometry.dispose();cordonMaterial.dispose();signTexture.dispose();signGeometry.dispose();signMaterial.dispose();indicators.forEach(i=>{i.geometry.dispose();i.material.dispose()});rigs.forEach(r=>r.dispose());root.removeFromParent()}}
}
