import {sampleKeeperCapture,keeperBallAt} from './motion/keeper-capture.mjs';
import {groundContactShadows} from './motion/ground-contact-shadows.mjs';
import {locomotionWeights,gaitCurve,locomotionTurnStep} from './motion/locomotion-sampling.mjs';
import {LocomotionGrounding} from './motion/locomotion-grounding.mjs';
import {FootballActionController} from './football-action-controller.mjs';
import {VisualPlayerCollisions} from './visual-player-collisions.mjs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {dressUniversalKit,dressNeutralKit,releaseMatchKits,releaseNeutralKits} from './kit-runtime.mjs';
import {neymarzetti,clubKitFor,clubKits} from './club-kit.mjs';
import {BATISMOS} from '../batismos.ts';
import {matchKitPlan} from './kit-contrast.mjs';
import {playerDetail,PLAYER_HEIGHT} from './lod.mjs';
import {loadReviewedMotion,loadGaitCalibration,bindCapturedMotion} from './reviewed-motion.mjs';
import {loadCartoonSource,createCartoonPlayer} from './cartoon/player.mjs';
import {createBallControl} from './motion/ball-control.mjs';
import {BallTouchPresentation} from './motion/ball-touch-presentation.mjs';
import {loadSidelines} from './sidelines.mjs';

let source,users=0;const kitRegistry=new Set(clubKits);
const releaseKits=()=>{releaseMatchKits([...kitRegistry]);kitRegistry.clear();};
const load=()=>source??=new GLTFLoader().loadAsync(new URL('./assets/quaternius.glb',import.meta.url).href).catch(error=>{source=undefined;throw error});
/** Shared original geometry, separate skeletons. Existing reviewed garment fit.
 * Reviewed captures are retained for their original replay. Other inputs get
 * their own contact schedule and fitted acquired captures, never old markers. */
let cartoonMotionPromise,keeperMotionPromise;

// 🎉 os dois braços pra cima em V (gira o braço no mundo até apontar pro alto e um pouco pra fora — vale pra qualquer orientação do osso)
const _a=new T.Vector3(),_b=new T.Vector3(),_c=new T.Vector3(),_q1=new T.Quaternion(),_q2=new T.Quaternion(),_q3=new T.Quaternion()
/** gira o osso `nome` NO MUNDO até o segmento osso→`filho` apontar na direção `want` (unitária), misturado por `k` (0–1) */
function apontaOsso(a,nome,filho,want,k=1){
 const up=a.bones?.get(nome),lo=a.bones?.get(filho);if(!up||!lo||!up.parent)return
 up.updateWorldMatrix(true,false);up.getWorldPosition(_a);lo.getWorldPosition(_b)
 const cur=_b.sub(_a).normalize(),alvo=k>=1?want:cur.clone().lerp(want,k).normalize()
 _q1.setFromUnitVectors(cur,alvo);up.getWorldQuaternion(_q2);_q1.multiply(_q2);up.parent.getWorldQuaternion(_q3).invert();up.quaternion.copy(_q3.multiply(_q1));up.updateWorldMatrix(false,true)
}
function levantaBracos(a,alvo=null){
 const pelvis=a.bones?.get('pelvis');if(!pelvis)return
 pelvis.getWorldPosition(_c)
 for(const lado of ['l','r']){const up=a.bones.get('upperarm_'+lado);if(!up)continue;up.getWorldPosition(_a)
  const fora=_a.clone().sub(_c);fora.y=0;fora.normalize()
  const want=alvo?alvo.clone().addScaledVector(fora,.18).normalize():new T.Vector3(fora.x*.38,1,fora.z*.38).normalize()
  apontaOsso(a,'upperarm_'+lado,'lowerarm_'+lado,want)}
}
// 🦵 25/10 (Diego: "como ele dá o passe… como ele dá o chute"): CHUTE PROCEDURAL pra toda batida que não tem captura de movimento —
// antes 1 em cada 3 passes/chutes saía sem a perna mexer (a bola "saía sozinha"). A perna de apoio fica, a outra vai à frente no
// instante em que a bola sai e volta em ~0,3 s; o chute (mais forte) sobe mais que o passe. `fase` = segundos desde a saída da bola.
function chutaPerna(a,heading,fase,forca,direita){
 const amp=forca*(fase<.08?.55+fase/.08*.45:Math.max(0,1-(fase-.08)/.3)) // (vai até o máximo logo depois do contato e recolhe)
 if(amp<=0)return
 const fw=new T.Vector3(Math.sin(heading),0,Math.cos(heading)),lado=direita?'r':'l'
 // (coxa: pra frente e pra cima; a canela segue a coxa — a perna fica esticada no final do chute)
 const want=new T.Vector3(fw.x*Math.sin(.95*amp),-Math.cos(.95*amp),fw.z*Math.sin(.95*amp)).normalize()
 apontaOsso(a,'thigh_'+lado,'calf_'+lado,want)
 apontaOsso(a,'calf_'+lado,'foot_'+lado,new T.Vector3(fw.x*Math.sin(1.1*amp),-Math.cos(1.1*amp),fw.z*Math.sin(1.1*amp)).normalize())
 // (o braço contrário abre pra equilibrar)
 apontaOsso(a,'upperarm_'+(direita?'l':'r'),'lowerarm_'+(direita?'l':'r'),new T.Vector3(-fw.z*(direita?1:-1)*.8,.1,fw.x*(direita?1:-1)*.8).normalize(),.6*amp)
}
const TIPOS_CHUTE=new Set(['passe','enfiada','lancamento','inversao','cruzamento','chutao','chute','cobranca'])
export async function loadPlayers(scene,state,frame,{style='civil-cartoon',refineFundamentals=true,refinePossession=true,refineBallTouches=true,forceRuntimeMotion=false,reviewedOnly=false,onPrepared=undefined,keeperTrial=undefined,president=undefined}={}){
 const kitPlan=matchKitPlan(state,(state.officialTeams??[]).map(clubKitFor),(state.officialTeams??[]).map(name=>BATISMOS.find(c=>c.clube===name)?.manto??[])),matchKitConfigs=kitPlan.map(p=>p.config).filter(Boolean);
 const cartoon=style==='civil-cartoon';let civil=cartoon?await loadCartoonSource():null;
 const [gltf,originalMotion,originalGait]=await Promise.all([civil?.gltf??load(),loadReviewedMotion(state.officialInput,{metadataOnly:cartoon}),loadGaitCalibration()]);
 let fitted=cartoon?await(cartoonMotionPromise??=fetch(new URL('./cartoon/motion.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Contatos do modelo civil indisponíveis');return r.json()})):null;
 if(fitted&&!refinePossession)fitted={...fitted,plans:fitted.plans.map(p=>p.previousRecovery?{...p,...p.previousRecovery}:p)};
 if(keeperTrial===undefined&&cartoon&&originalMotion){const reviewed=await(keeperMotionPromise??=fetch(new URL('./cartoon/keeper.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Recepção de goleiro indisponível');return r.json()}));keeperTrial=reviewed.inputSHA256===originalMotion.inputSHA256?reviewed:null;}
 if(keeperTrial&&(!originalMotion||keeperTrial.inputSHA256!==originalMotion.inputSHA256))throw Error('Teste de goleiro pertence a outra partida');
 if(civil&&keeperTrial)civil={...civil,clips:new Map([...civil.clips,...Object.entries(keeperTrial.clips).map(([n,c])=>[n,T.AnimationClip.parse(c)])])};
 let motion=cartoon?(!forceRuntimeMotion&&originalMotion&&fitted.inputSHA256===originalMotion.inputSHA256?{...fitted,clips:new Map([...civil.clips].filter(([name])=>!name.endsWith('_Loop')))}:null):originalMotion,preparationFailed=false;
 const gait=fitted?.gait??originalGait,actors=[];users++;
 matchKitConfigs.forEach(config=>kitRegistry.add(config));
 try{
  const initial=frame.players;
  for(const [index,p]of initial.entries()){
   const keeper=p.keeper,number=index%11+1,club=state.officialTeams?.[p.side==='home'?0:1];
   let actor;
   if(cartoon){actor=await createCartoonPlayer(civil,!keeper?kitPlan[p.side==='home'?0:1].config:null,{number,shirtColor:keeper?'#d6b329':kitPlan[p.side==='home'?0:1].color,skinColor:['#bd906f','#895738','#d4ad83'][index%3],hairColor:['#49301e','#30231d','#66513d'][index%3]})}
   else{
    const root=clone(gltf.scene),holder=new T.Group(),meshes=[];holder.add(root);holder.scale.setScalar(1.78/1.8287);root.traverse(n=>{if(n.isSkinnedMesh){meshes.push(n);n.castShadow=n.receiveShadow=true;n.frustumCulled=false}});
    const mixer=new T.AnimationMixer(root),actions=new Map();for(const name of ['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop']){const clip=gltf.animations.find(c=>c.name===name);if(!clip)throw Error('Clipe original indisponível: '+name);actions.set(name,mixer.clipAction(clip))}
    const pelvis=meshes[0].skeleton.getBoneByName('pelvis'),rest=pelvis.position.clone(),kit=club==='Neymarzetti'&&!keeper?await dressUniversalKit({meshes},kitPlan[p.side==='home'?0:1].config??neymarzetti,{number,quality:'light'}):await dressNeutralKit({meshes},{number,quality:'light',shirtColor:keeper?'#d6b329':kitPlan[p.side==='home'?0:1].color});actor={holder,root,meshes,mixer,actions,pelvis,rest,kit,footIndices:kit.template.data.part.map((p,i)=>p===3?i:-1).filter(i=>i>=0)};
   }
   Object.assign(actor,{current:null,side:p.side,key:p.key,keeper,gaitPhase:0,lastDistance:0,wasAction:false,lastHeading:null,lastPose:-Infinity,detail:'full',groundOffset:0,footHeight:0});
   actor.measurements={neutralHeight:new T.Box3().setFromObject(actor.holder,true).getSize(new T.Vector3()).y,rigBones:actor.meshes[0].skeleton.bones.length};actor.motion=bindCapturedMotion(actor,motion??(cartoon?{clips:new Map([...civil.clips].filter(([name])=>!name.endsWith('_Loop')))}:null));actor.intentAxis=new T.Vector3(0,0,1).applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()).invert());actor.headIntentAxis=new T.Vector3(0,0,1).applyQuaternion(actor.bones.get('Head').getWorldQuaternion(new T.Quaternion()).invert());if(cartoon){const headBox=new T.Box3().setFromObject(actor.meshes[4],true);actor.headCenterLocal=actor.bones.get('Head').worldToLocal(headBox.getCenter(new T.Vector3()));actor.headRadius=Math.max(headBox.max.x-headBox.min.x,headBox.max.z-headBox.min.z)/2;}if(cartoon)actor.ballControl=createBallControl(actor,{sourceLead:refinePossession});actor.grounding=cartoon&&refineFundamentals?new LocomotionGrounding():null;actor.nativePose=[...actor.bones.values()].map(bone=>({bone,position:bone.position.clone(),quaternion:bone.quaternion.clone()}));actors.push(actor);scene.add(actor.holder);
  }
 }catch(error){for(const a of actors){a.kit.dispose();a.holder.removeFromParent();a.mixer.stopAllAction()}if(--users===0){releaseNeutralKits();releaseKits()}throw error}
 let sidelines=null;try{if(cartoon)sidelines=await loadSidelines(scene,civil,state,frame,kitPlan,{president,gait});}catch(error){console.warn('Equipe de apoio 3D indisponível; preservando os atletas e o replay',error)}
 const pointsGeometry=new T.BufferGeometry(),positions=new Float32Array(actors.length*3),colors=new Float32Array(actors.length*3);
 positions.fill(-10000);pointsGeometry.setAttribute('position',new T.BufferAttribute(positions,3));pointsGeometry.setAttribute('color',new T.BufferAttribute(colors,3));
 const pointsMaterial=new T.PointsMaterial({size:PLAYER_HEIGHT,sizeAttenuation:true,vertexColors:true}),points=new T.Points(pointsGeometry,pointsMaterial);pointsMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * projectionMatrix[1][1];');shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nvec2 silhouette=(gl_PointCoord-vec2(.5))/vec2(.18,.5);if(dot(silhouette,silhouette)>1.)discard;')};
 pointsMaterial.customProgramCacheKey=()=> 'football-points-physical-metres-v1';
 points.name='football-physical-scale-lod';points.frustumCulled=false;scene.add(points);
 let lastTime=null,disposed=false,lastFrame=null,lastInputFrame=null,ballOverride=null,presentedBall=null,pendingMotion=null,inspection={full:0,intermediate:0,far:0,hidden:0,poseUpdates:0,minFootHeight:0,maxFootHeight:0,physicalPlayerHeight:PLAYER_HEIGHT,locomotionCalibrated:true};
 const ballTouches=new BallTouchPresentation();
 const soleShadows=cartoon&&refineFundamentals?groundContactShadows(scene,actors.length):null;
 const point=new T.Vector3(),footballActions=new FootballActionController(motion?[...motion.plans,...motion.rejected.filter(p=>p.key!==keeperTrial?.plan.key).map(p=>({...p,unsupported:true}))]:[]),collisions=new VisualPlayerCollisions();
 // Models and the official clock remain available during preparation. Adopt
 // the finished per-replay plans without rebuilding a scene or restarting it.
 const preparationTask=cartoon&&!reviewedOnly&&state.officialInput?(async()=>{
  try{const{prepareRuntimeMotion}=await import('./motion/runtime-motion.mjs'),prepared=await prepareRuntimeMotion(civil,fitted,state.officialInput,state,{offline:true,reviewedCompatible:!!originalMotion,reservedActions:keeperTrial?[keeperTrial.plan]:[]});if(disposed)return null;pendingMotion=prepared;lastInputFrame=null;onPrepared?.();return prepared;}
  catch(error){if(!disposed){preparationFailed=true;lastInputFrame=null;onPrepared?.();console.warn('Capturas desta partida não puderam ser preparadas; preservando o replay oficial e os 22 modelos',error);}return null;}
 })():Promise.resolve(motion);
 return {update(frame,camera,viewportHeight=720){
  if(disposed)return;
  // Keep a capture already in progress intact while background preparation
  // finishes. Adopt the per-input schedule between gestures, on this scene.
  if(pendingMotion&&(!motion||!motion.plans.some(p=>frame.time>=p.start&&frame.time<=p.end))){motion=pendingMotion;pendingMotion=null;footballActions.setPlans([...motion.plans,...motion.rejected.map(p=>({...p,unsupported:true}))],motion.releaseTimes);lastInputFrame=null;}
  if(frame.placementReset)frame={...frame,ball:{...frame.ball,...frame.ball.presentation},players:frame.players.map(p=>p.presentation?{...p,mx:p.presentation.x,mz:p.presentation.z}:p)};
  // A camera redraw is not another simulation step. Re-solving a paused
  // duel fed its final collision projection back into the same timestamp.
  // Preserve the finished pose when source state and LOD are unchanged.
  const repeated=lastInputFrame&&frame.time===lastTime&&frame.phase===lastInputFrame.phase&&frame.owner===lastInputFrame.owner&&frame.ball.x===lastInputFrame.ball.x&&frame.ball.y===lastInputFrame.ball.y&&frame.ball.z===lastInputFrame.ball.z&&frame.players.length===lastInputFrame.players.length&&frame.players.every((p,i)=>{const old=lastInputFrame.players[i],a=actors.find(a=>a.key===p.key);return old?.key===p.key&&old.mx===p.mx&&old.mz===p.mz&&old.heading===p.heading&&old.speed===p.speed&&old.distance===p.distance&&old.kick===p.kick&&old.throwing===p.throwing&&old.save===p.save&&old.dive===p.dive&&old.control===p.control&&old.visible===p.visible&&a&&(!camera||playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail)===a.detail)});
  if(repeated){sidelines?.update(frame,camera,viewportHeight,actors);return;}
  lastInputFrame=frame;const keeperActive=keeperTrial&&frame.time>=keeperTrial.plan.start&&frame.time<=keeperTrial.plan.end,catchConfirmed=keeperTrial&&frame.official?.events.some(e=>e.tipo==='encaixa'&&e.a===keeperTrial.plan.name&&Math.abs(e.t-keeperTrial.plan.contactAt)<1e-5);ballOverride=catchConfirmed?keeperBallAt(keeperTrial,frame.time):null;if(ballOverride)frame={...frame,ball:{...frame.ball,...ballOverride.position,presentation:ballOverride.position,rotation:ballOverride.rotation}};
  const elapsed=lastTime===null?0:frame.time-lastTime,reset=lastTime===null||elapsed<0||elapsed>1,dt=Math.max(0,elapsed);lastTime=frame.time;lastFrame=frame;const used=new Set(),currentKeys=new Set(frame.players.map(p=>p.key));positions.fill(-10000);
  inspection={full:0,intermediate:0,far:0,hidden:0,poseUpdates:0,minFootHeight:Infinity,maxFootHeight:-Infinity,physicalPlayerHeight:PLAYER_HEIGHT,style:cartoon?'civil-cartoon':'athlete',kits:kitPlan.map(({config,...p})=>({...p,clubKey:config?.clubKey,renderKey:config?.renderKey})),locomotionCalibrated:true,captureCoverage:{matched:!!motion,available:motion?.plans.length??0,rejected:motion?.rejected.length??0,runtime:motion?.preparedFromOfficialSource??false,preparationMs:motion?.preparationMs??0,preparationFailed},activeCaptures:[],keeperCaptures:[],clearance:[],grounding:[]};
  footballActions.begin(frame);
  const navigation=cartoon?collisions.sample(frame,{action:(key,time)=>keeperActive&&key===keeperTrial.plan.key?{collisionFreedom:0}:footballActions.action(key,time)}):null;
  inspection.collisions=navigation?.diagnostics;
  if(navigation)frame={...frame,players:frame.players.map(p=>{const o=navigation.positions.get(p.key);return o?{...p,mx:p.mx+o.x,mz:p.mz+o.z}:p})};
  // 🎉 25/10 (Diego: "o gol… a comemoração"): na festa do gol, quem fez e os companheiros perto dele comemoram — braços pra cima e
  // pulinhos (`levantaBracos`). Só apresentação: posição e placar continuam os do motor.
  let festa=null
  if(frame.phase==='gol'){const g=frame.official?.events?.findLast?.(e=>e.tipo==='gol');if(g){const side=g.lado===0?'home':'away',autor=frame.players.find(q=>q.side===side&&g.a&&String(g.a).startsWith(q.name));if(autor)festa={side,key:autor.key,x:autor.mx,z:autor.mz,t0:g.t}}}
  const comemora=p=>!!festa&&cartoon&&p.side===festa.side&&!p.keeper&&(p.key===festa.key||Math.hypot(p.mx-festa.x,p.mz-festa.z)<9)
  // 🎭 25/10: o teatro das disputas — quem SOFREU a falta cai, quem deu o bote se lança, quem driblou ginga (eventos oficiais dos
  // últimos 1,2 s, pelo nome do motor). Só apresentação; posição e resultado são do motor
  const teatro=new Map()
  if(cartoon&&frame.official?.events){const evs=frame.official.events;for(let i=evs.length-1;i>=0;i--){const e=evs[i],dtEv=frame.time-e.t;if(dtEv>1.2)break;if(dtEv<0)continue
   if((e.tipo==='falta'||e.tipo==='vantagem')&&e.b&&!teatro.has(e.b))teatro.set(e.b,{tipo:'cai',dt:dtEv})
   if((e.tipo==='desarme'||e.tipo==='carrinho'||e.tipo==='falta')&&e.a&&!teatro.has(e.a))teatro.set(e.a,{tipo:e.tipo==='carrinho'?'carrinho':'bote',dt:dtEv})
   if(e.tipo==='drible'&&e.a&&!teatro.has(e.a))teatro.set(e.a,{tipo:'ginga',dt:dtEv})}}
  const acao=frame.officialAction
  frame.players.forEach((p,i)=>{
   const a=actors.find(a=>a.key===p.key&&!used.has(a))??actors.find(a=>!used.has(a)&&!currentKeys.has(a.key)&&a.side===p.side&&a.keeper===p.keeper);if(!a)return;used.add(a);const official=lastFrame.players.find(q=>q.key===p.key);a.sourceAnchor={x:official.mx,z:official.mz};a.navigationOffset={x:p.mx-official.mx,z:p.mz-official.mz};const resetActor=reset||a.key!==p.key||navigation?.diagnostics.sourceReset;a.key=p.key;
   if(resetActor)a.ballControl?.reset();
   const approach=refinePossession?a.ballControl?.advance(frame,p):null,gaitX=approach?.x??p.mx,gaitZ=approach?.z??p.mz;
   const visualTravel=resetActor||dt===0?0:Math.hypot(gaitX-(a.lastGaitX??gaitX),gaitZ-(a.lastGaitZ??gaitZ)),visualHeading=visualTravel>.001?Math.atan2(gaitX-a.lastGaitX,gaitZ-a.lastGaitZ):p.heading,visualSpeed=dt>0?(frame.restart||p.temporaryStopUntil>frame.time?visualTravel/dt:Math.max(p.speed,visualTravel/dt)):p.speed;
   a.presentationSpeed=visualSpeed;a.lastGaitX=gaitX;a.lastGaitZ=gaitZ;
   const targets=cartoon&&refineFundamentals?locomotionWeights(visualSpeed):null;
   const mode=visualSpeed<.12?'Idle_Loop':visualSpeed<2.5?'Walk_Loop':visualSpeed<6?'Jog_Fwd_Loop':'Sprint_Loop',cal=gait[{Walk_Loop:'walk',Jog_Fwd_Loop:'run',Sprint_Loop:'sprint'}[mode]],duration=a.actions.get(mode).getClip().duration,stride=cal?.strideLength??duration*(mode==='Walk_Loop'?1.5:mode==='Sprint_Loop'?7:4.5);
   if(resetActor){a.ballControl?.reset();a.wasAction=false;a.gaitPhase=0;a.lastDistance=p.distance;a.lastHeading=p.heading;a.lastPose=-Infinity;a.current=null;a.mixer.stopAllAction()}
   const effectiveStride=targets?Object.entries(targets).reduce((sum,[name,w])=>{const c=gait[{Walk_Loop:'walk',Jog_Fwd_Loop:'run',Sprint_Loop:'sprint'}[name]];return sum+w*(c?(gaitCurve(c)?.length??c.strideLength):stride)},0):stride;
   a.gaitPhase=(a.gaitPhase+visualTravel/Math.max(.1,effectiveStride))%1;a.lastDistance=p.distance;
   const previous=a.detail;a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++;
   a.holder.visible=a.detail==='full'||a.detail==='intermediate';
   positions.set(a.detail==='far'?[p.mx,PLAYER_HEIGHT/2,p.mz]:[-10000,-10000,-10000],i*3);
   const color=new T.Color(p.keeper?'#d6b329':kitPlan[p.side==='home'?0:1].color);colors.set(color.toArray(),i*3);
   // Keep scalar facing current even when LOD skips skeleton evaluation.
   const heading=a.lastHeading??p.heading,desired=cartoon?footballActions.prepare(a,p.key,frame.time,visualHeading,p.speed):visualHeading;a.lastHeading=heading+locomotionTurnStep(Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading)),dt);
   // Owned-ball contact must not depend on the camera's skeleton LOD.
   if(!a.holder.visible&&frame.owner!==p.key)return;
   // Mixer property bindings can skip unchanged values. Restore the last
   // clean imported pose before evaluating them; never feed last frame's
   // contact IK or action blend back into the native animation baseline.
   for(const pose of a.nativePose){pose.bone.position.copy(pose.position);pose.bone.quaternion.copy(pose.quaternion)}
   if(a.current!==mode)a.current=mode;
   const readyWeight=p.keeper&&a.actions.has('KeeperReady_Loop')&&!keeperActive&&frame.phase!=='gol'&&frame.phase!=='fim'?T.MathUtils.clamp(1-p.speed/3,0,1)*T.MathUtils.smoothstep(25-Math.hypot(p.mx-frame.ball.x,p.mz-frame.ball.z),0,15):0;
   for(const[name,action]of a.actions)if(name.endsWith('_Loop')){const target=name==='KeeperReady_Loop'?readyWeight:(1-readyWeight)*(targets?.[name]??(name===mode?1:0)),current=action.isScheduled()?action.getEffectiveWeight():0;action.play();action.timeScale=0;action.setEffectiveWeight(resetActor||previous==='far'||previous==='hidden'?target:T.MathUtils.lerp(current,target,1-Math.exp(-dt/.18)));}
   const active=(keeperActive&&p.key===keeperTrial.plan.key)||motion?.plans.some(plan=>plan.key===p.key&&frame.time>=plan.start&&frame.time<=plan.end);
   const nearBall=frame.ball.y<1.5&&Math.hypot(p.mx-frame.ball.x,p.mz-frame.ball.z)<1.5;
   const refresh=active||a.wasAction||nearBall||comemora(p)||!!p.mergulho||(acao&&acao.actor===p.key)||teatro.has(p.name)||(a.detail==='full'&&dt>0)||frame.time-a.lastPose>=1/12||previous!==a.detail||frame.time<a.lastPose;
   if(refresh){a.mixer.update(Math.min(.25,dt));for(const[name,action]of a.actions)if(name.endsWith('_Loop')){const c=gait[{Walk_Loop:'walk',Jog_Fwd_Loop:'run',Sprint_Loop:'sprint'}[name]];action.time=name==='Idle_Loop'||name==='KeeperReady_Loop'?frame.time%action.getClip().duration:(targets&&c&&gaitCurve(c)?gaitCurve(c).phase(a.gaitPhase):((a.gaitPhase+(c?.phaseOffset??0))%1))*action.getClip().duration}a.mixer.update(0);a.lastPose=frame.time;inspection.poseUpdates++;}
   if(!cartoon){a.pelvis.position.x=a.rest.x;a.pelvis.position.z=a.rest.z;}
   if(refresh)for(const pose of a.nativePose){pose.position.copy(pose.bone.position);pose.quaternion.copy(pose.bone.quaternion)}
   a.holder.position.set(p.mx,a.groundOffset,p.mz);a.holder.rotation.set(0,a.lastHeading,0);a.holder.updateMatrixWorld(true);
   // Both native gait and retargeted captures use the pelvis ground projection
   // as their presentation anchor. Otherwise changing layers snaps by the
   // original GLB's off-centre bind origin (~8 cm), even at blend weight zero.
   a.pelvis.getWorldPosition(point);a.holder.position.x+=p.mx-point.x;a.holder.position.z+=p.mz-point.z;a.holder.updateMatrixWorld(true);
   for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update();
   if(refresh){
    a.holder.position.y=0;a.holder.updateMatrixWorld(true);a.kit.mesh.skeleton.update();let low=Infinity;
    for(const index of a.footIndices)low=Math.min(low,a.kit.mesh.getVertexPosition(index,point).applyMatrix4(a.kit.mesh.matrixWorld).y);
    a.groundOffset=Number.isFinite(low)?.002-low:0;a.footHeight=Number.isFinite(low)?low+a.groundOffset:.002;
    a.holder.position.y=a.groundOffset;a.holder.updateMatrixWorld(true);for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update();
   }
   const scheduled=footballActions.action(p.key,frame.time);const control=refinePossession?a.ballControl?.apply(frame,p):null;if(control)(inspection.ballControl??=[]).push({key:p.key,...control});const keeperPose=keeperActive&&p.key===keeperTrial.plan.key?sampleKeeperCapture(a,keeperTrial.plan,official,frame.time):null;const capture=keeperPose??a.motion.apply(frame,p,scheduled?.animationActive?scheduled.plan:null);a.wasAction=!!capture;if(capture){if(!refinePossession)a.ballControl?.reset();if(keeperPose)inspection.keeperCaptures.push({key:p.key,...keeperPose,ball:keeperPose.ball.toArray()});else inspection.activeCaptures.push(capture)}else{if(!refinePossession){const control=a.ballControl?.apply(frame,p);if(control)(inspection.ballControl??=[]).push({key:p.key,...control});}let clearance=a.motion.clearance(frame,p);if(clearance?.rootClearance?.limited)clearance=a.motion.recoverGaitClearance(frame,p,clearance);if(clearance)inspection.clearance.push({key:p.key,...clearance})}
   if(a.grounding){const grounded=a.grounding.apply(a,{...p,speed:visualSpeed},frame,capture,dt,{reset:resetActor||previous==='far'||previous==='hidden'});a.groundingReport=grounded;inspection.grounding.push({key:p.key,...grounded})}
   if(a.grounding&&nearBall)a.motion.clearance(frame,p);
   // 🧤 25/10: o PULO do goleiro — o corpo tomba pro lado da bola a partir dos pés, desliza até o ponto e sobe se a bola vem alta;
   // os braços esticam na linha do corpo (só desenho: quem decide defesa/gol é o motor, e `mergulho` vem do adaptador)
   if(p.mergulho&&cartoon&&a.holder.visible){const m=p.mergulho,dx=m.x-p.mx,dz=m.z-p.mz,len=Math.hypot(dx,dz);
    // (bola reta nele e alta: não é mergulho de lado — é o SALTO pra cima, braços esticados por cima da cabeça)
    if(len<=.6&&m.y>1.2){const alto=T.MathUtils.clamp((m.y-1.2)/1.0,0,1);a.holder.position.y+=Math.sin(m.k*Math.PI*.5)*(.12+alto*.45);a.holder.updateMatrixWorld(true);levantaBracos(a,new T.Vector3(0,1,0));for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}
    else if(len>.05){const dir=new T.Vector3(dx/len,0,dz/len),eixo=new T.Vector3(0,1,0).cross(dir).normalize(),alto=T.MathUtils.clamp(m.y/2.2,0,1),ang=m.k*T.MathUtils.lerp(1.3,.55,alto)*T.MathUtils.clamp(len/1.2,.45,1),q=new T.Quaternion().setFromAxisAngle(eixo,ang);a.holder.quaternion.premultiply(q);const vai=Math.min(len,1.7)*m.k*.75;a.holder.position.x+=dir.x*vai;a.holder.position.z+=dir.z*vai;a.holder.position.y+=Math.sin(m.k*Math.PI*.5)*(.18+alto*.45);/* (o giro é em volta do QUADRIL, não dos pés: o corpo deita no ar com os pés subindo — antes ele "fazia reverência" com os pés plantados) */const quadril=new T.Vector3(0,.95,0),girado=quadril.clone().applyQuaternion(q);a.holder.position.add(quadril.sub(girado));a.holder.updateMatrixWorld(true);levantaBracos(a,new T.Vector3(0,1,0).applyQuaternion(q));for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}}
   // 🦵 chute/passe sem captura: a perna bate (0–0,38 s depois de a bola sair)
   if(cartoon&&a.holder.visible&&!capture&&acao&&acao.actor===p.key&&TIPOS_CHUTE.has(acao.type)&&acao.requiredContact!=='hands'&&acao.requiredContact!=='head'){
    const fase=frame.time-acao.startedAt
    if(fase>=0&&fase<.38){const forte=acao.type==='chute'||acao.type==='chutao'||acao.type==='lancamento'||acao.type==='cruzamento';const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,hd=a.lastHeading;const direita=(Math.cos(hd)*bx-Math.sin(hd)*bz)>=0;chutaPerna(a,hd,fase,forte?1:.7,direita);for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}
   }
   // 🗣️ CABEÇADA (25/10): a bola alta chega e ele SOBE — pulo de ~35 cm com a cabeça indo na bola (inclina o tronco pra frente no
   // contato). Vale pro cabeceio pro gol e pro corte de cabeça (o motor marca `requiredContact:'head'`)
   if(cartoon&&a.holder.visible&&!capture&&acao&&acao.actor===p.key&&acao.requiredContact==='head'){
    const fase=frame.time-acao.startedAt
    if(fase>-.35&&fase<.4){const u=(fase+.35)/.75,salto=Math.sin(Math.PI*u)*.38;a.holder.position.y+=salto;const hd=a.lastHeading,fw=new T.Vector3(Math.sin(hd),0,Math.cos(hd)),lateral=new T.Vector3(fw.z,0,-fw.x),cab=fase<0?-.25*(1+fase/.35):.45*Math.max(0,1-fase/.4);a.holder.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(lateral,cab));levantaBracos(a,new T.Vector3(0,.3,0).addScaledVector(fw,-.5).normalize());a.holder.updateMatrixWorld(true);for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}
   }
   // 🎭 cai / bote / ginga
   const te=cartoon&&a.holder.visible?teatro.get(p.name):null
   if(te){const hd=a.lastHeading,fw=new T.Vector3(Math.sin(hd),0,Math.cos(hd)),lateral=new T.Vector3(fw.z,0,-fw.x)
    if(te.tipo==='cai'){const k=te.dt<.3?te.dt/.3:te.dt<.7?1:Math.max(0,1-(te.dt-.7)/.5),ang=1.25*k;a.holder.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(lateral,ang));a.holder.position.y-=Math.sin(ang)*.12;levantaBracos(a,fw.clone().multiplyScalar(.6).setY(.5).normalize())}
    else if(te.tipo==='bote'||te.tipo==='carrinho'){const k=te.dt<.15?te.dt/.15:Math.max(0,1-(te.dt-.15)/.45),ang=(te.tipo==='carrinho'?.9:.45)*k;a.holder.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(lateral,ang));if(te.tipo==='carrinho')a.holder.position.y-=Math.sin(ang)*.35;apontaOsso(a,'thigh_r','calf_r',new T.Vector3(fw.x*.9,-.35,fw.z*.9).normalize(),k)}
    else if(te.tipo==='ginga'){const k=Math.max(0,1-te.dt/.6),roll=Math.sin(te.dt*21)*.22*k;a.holder.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(fw,roll))}
    a.holder.updateMatrixWorld(true);for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}
   // 🎉 comemoração: braços pra cima e pulinhos (depois do chão: o pé assentado é a base do pulo)
   if(comemora(p)&&a.holder.visible){const ph=(frame.time-festa.t0)*5.2+i*.9,hop=Math.max(0,Math.sin(ph))*.32;a.holder.position.y+=hop;a.holder.updateMatrixWorld(true);levantaBracos(a);for(const mesh of a.meshes)mesh.skeleton.update();a.kit.mesh.skeleton.update()}
   // Recover locomotion from the body's actually rendered facing. A second
   // hidden gait heading was turning independently during the catch/throw,
   // then snapping the avatar around as the capture faded out.
   if(keeperPose&&frame.time>keeperTrial.plan.releaseAt){
    const forward=a.intentAxis.clone().applyQuaternion(a.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()));
    a.lastHeading+=Math.atan2(Math.sin(Math.atan2(forward.x,forward.z)-a.lastHeading),Math.cos(Math.atan2(forward.x,forward.z)-a.lastHeading));
   }
   if(cartoon){if(!keeperPose)footballActions.orientUpperBody(a,p,frame.time);footballActions.validate(a,p,frame,capture);for(const mesh of a.meshes)mesh.skeleton.update();}
   inspection.minFootHeight=Math.min(inspection.minFootHeight,a.footHeight);inspection.maxFootHeight=Math.max(inspection.maxFootHeight,a.footHeight);
  });
  if(cartoon){for(let projection=0;projection<3;projection++){const source=lastFrame,volumes=actors.filter(a=>a.holder.visible&&used.has(a)).map(a=>{const p=source.players.find(p=>p.key===a.key),head=a.bones.get('Head').localToWorld(a.headCenterLocal.clone()),hip=a.pelvis.getWorldPosition(new T.Vector3());return{key:a.key,x:head.x,y:head.y,z:head.z,radius:a.headRadius,rootX:hip.x,rootZ:hip.z,sourceX:p.mx,sourceZ:p.mz,freedom:keeperActive&&a.key===keeperTrial.plan.key?0:footballActions.action(a.key,frame.time)?.collisionFreedom??(source.owner===a.key?.25:1)}}),resolved=collisions.finalize(volumes);
   for(const a of actors){const offset=resolved.shifts.get(a.key);if(!offset||Math.hypot(offset.x,offset.z)<1e-7)continue;a.holder.position.x+=offset.x;a.holder.position.z+=offset.z;a.holder.updateMatrixWorld(true);for(const mesh of a.meshes)mesh.skeleton.update();const p=source.players.find(p=>p.key===a.key);a.motion.clearance(source,p);}
   inspection.actualCollisions={...resolved.diagnostics,projectionPasses:projection+1};
   if(resolved.diagnostics.maxAdditionalShift<1e-7)break;
  }}
  // A reviewed schedule is required to return the visual ball to the exact
  // source impulse. Never guess an upcoming release in an unrelated save.
  const touch=cartoon&&motion&&refinePossession&&refineBallTouches?ballTouches.sample(frame,actors,footballActions,{reset}):{ball:frame.ball,diagnostic:{phase:motion?'disabled':'unreviewed-source',offset:0,sourceBallUnchanged:true}};presentedBall=touch.ball;inspection.ballPresentation=touch.diagnostic;
  if(touch.diagnostic.offset>1e-6&&presentedBall.presentation&&!frame.ball.presentation){const visibleFrame={...frame,ball:{...presentedBall,...presentedBall.presentation}};for(const a of actors){const p=frame.players.find(p=>p.key===a.key);if(p&&(a.holder.visible||p.key===frame.owner))a.motion.clearance(visibleFrame,p);}}
  ballTouches.confirm(presentedBall,actors,touch.diagnostic);
  inspection.footballActions=footballActions.inspect();
  inspection.receiving=footballActions.inspectReceptions();
  // A lineup can shrink after a real dismissal/substitution. Never leave an
  // unused avatar or a stale far-LOD point from the preceding frame visible.
  for(const a of actors)if(!used.has(a)){a.holder.visible=false;a.detail='hidden'}
  sidelines?.update(frame,camera,viewportHeight,actors);
  soleShadows?.update(actors);
  pointsGeometry.attributes.position.needsUpdate=true;pointsGeometry.attributes.color.needsUpdate=true;points.visible=inspection.far>0;
  if(!Number.isFinite(inspection.minFootHeight))inspection.minFootHeight=inspection.maxFootHeight=0;
 },prepared:()=>preparationTask,presentFrame:frame=>presentedBall&&frame.time===lastTime?{...frame,ball:presentedBall}:frame,inspect:()=>({...inspection,sidelines:sidelines?.inspect()??null}),inspectScale:()=>actors.map(a=>({key:a.key,...a.measurements})),inspectPose:key=>{const a=actors.find(a=>a.key===key);return a?{key,position:a.holder.position.toArray(),bones:[...a.bones].map(([name,b])=>({name,position:b.position.toArray(),quaternion:b.quaternion.toArray()}))}:null},inspectActors:()=>({slots:actors.map((a,slot)=>({slot,key:a.key,heading:a.lastHeading,mode:a.current,presentationSpeed:a.presentationSpeed,visible:a.holder.visible,detail:a.detail})),farPoints:Array.from(positions).filter((_,i)=>i%3===0).filter(x=>x!==-10000).length}),audit:()=>lastFrame?{...inspection,players:lastFrame.players.map(p=>{const a=actors.find(a=>a.key===p.key),f=presentedBall?.presentation?{...lastFrame,ball:{...presentedBall,...presentedBall.presentation}}:lastFrame;return a?.motion.audit(f,p)}).filter(Boolean)}:null,dispose(){if(disposed)return;disposed=true;sidelines?.dispose();soleShadows?.dispose();points.removeFromParent();pointsGeometry.dispose();pointsMaterial.dispose();for(const a of actors){a.motion.surface.dispose();a.kit.dispose();a.mixer.stopAllAction();a.mixer.uncacheRoot(a.root);a.holder.removeFromParent();for(const mesh of a.meshes)mesh.skeleton.dispose()}if(--users===0){releaseNeutralKits();releaseKits()}}};
}
