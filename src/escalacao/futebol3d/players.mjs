import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {dressUniversalKit,dressNeutralKit,releaseMatchKits,releaseNeutralKits} from './kit-runtime.mjs';
import {neymarzetti} from './club-kit.mjs';
import {playerDetail,PLAYER_HEIGHT} from './lod.mjs';
import {loadReviewedMotion,loadGaitCalibration,bindCapturedMotion} from './reviewed-motion.mjs';
import {loadCartoonSource,createCartoonPlayer} from './cartoon/player.mjs';
import {createBallControl} from './motion/ball-control.mjs';

let source,users=0;
const load=()=>source??=new GLTFLoader().loadAsync(new URL('./assets/quaternius.glb',import.meta.url).href).catch(error=>{source=undefined;throw error});
/** Shared original geometry, separate skeletons. Existing reviewed garment fit.
 * Captures are enabled only for the exact reviewed official input. */
let cartoonMotionPromise;
export async function loadPlayers(scene,state,frame,{style='athlete'}={}){
 const cartoon=style==='civil-cartoon',civil=cartoon?await loadCartoonSource():null;
 const [gltf,originalMotion,originalGait]=await Promise.all([civil?.gltf??load(),loadReviewedMotion(state.officialInput,{metadataOnly:cartoon}),loadGaitCalibration()]);
 const fitted=cartoon?await(cartoonMotionPromise??=fetch(new URL('./cartoon/motion.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Contatos do modelo civil indisponíveis');return r.json()})):null;
 const motion=cartoon?(originalMotion&&fitted.inputSHA256===originalMotion.inputSHA256?{...fitted,clips:new Map([...civil.clips].filter(([name])=>!name.endsWith('_Loop')))}:null):originalMotion,gait=fitted?.gait??originalGait,actors=[];users++;
 try{
  const initial=frame.players;
  for(const [index,p]of initial.entries()){
   const keeper=p.keeper,number=index%11+1,club=state.officialTeams?.[p.side==='home'?0:1];
   let actor;
   if(cartoon){actor=await createCartoonPlayer(civil,club==='Neymarzetti'&&!keeper?neymarzetti:null,{number,shirtColor:keeper?'#d6b329':p.side==='home'?state.homeColor:state.awayColor,skinColor:['#bd906f','#895738','#d4ad83'][index%3],hairColor:['#49301e','#30231d','#66513d'][index%3]})}
   else{
    const root=clone(gltf.scene),holder=new T.Group(),meshes=[];holder.add(root);holder.scale.setScalar(1.78/1.8287);root.traverse(n=>{if(n.isSkinnedMesh){meshes.push(n);n.castShadow=n.receiveShadow=true;n.frustumCulled=false}});
    const mixer=new T.AnimationMixer(root),actions=new Map();for(const name of ['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop']){const clip=gltf.animations.find(c=>c.name===name);if(!clip)throw Error('Clipe original indisponível: '+name);actions.set(name,mixer.clipAction(clip))}
    const pelvis=meshes[0].skeleton.getBoneByName('pelvis'),rest=pelvis.position.clone(),kit=club==='Neymarzetti'&&!keeper?await dressUniversalKit({meshes},neymarzetti,{number,quality:'light'}):await dressNeutralKit({meshes},{number,quality:'light',shirtColor:keeper?'#d6b329':p.side==='home'?state.homeColor:state.awayColor});actor={holder,root,meshes,mixer,actions,pelvis,rest,kit,footIndices:kit.template.data.part.map((p,i)=>p===3?i:-1).filter(i=>i>=0)};
   }
   Object.assign(actor,{current:null,side:p.side,key:p.key,keeper,gaitPhase:0,lastDistance:0,wasAction:false,lastHeading:null,lastPose:-Infinity,detail:'full',groundOffset:0,footHeight:0});
   actor.motion=bindCapturedMotion(actor,motion);if(cartoon)actor.ballControl=createBallControl(actor);actor.nativePose=[...actor.bones.values()].map(bone=>({bone,position:bone.position.clone(),quaternion:bone.quaternion.clone()}));actors.push(actor);scene.add(actor.holder);
  }
 }catch(error){for(const a of actors){a.kit.dispose();a.holder.removeFromParent();a.mixer.stopAllAction()}if(--users===0){releaseNeutralKits();releaseMatchKits([neymarzetti])}throw error}
 const pointsGeometry=new T.BufferGeometry(),positions=new Float32Array(actors.length*3),colors=new Float32Array(actors.length*3);
 positions.fill(-10000);pointsGeometry.setAttribute('position',new T.BufferAttribute(positions,3));pointsGeometry.setAttribute('color',new T.BufferAttribute(colors,3));
 const pointsMaterial=new T.PointsMaterial({size:PLAYER_HEIGHT,sizeAttenuation:true,vertexColors:true}),points=new T.Points(pointsGeometry,pointsMaterial);pointsMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * projectionMatrix[1][1];');shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nvec2 silhouette=(gl_PointCoord-vec2(.5))/vec2(.18,.5);if(dot(silhouette,silhouette)>1.)discard;')};
 pointsMaterial.customProgramCacheKey=()=> 'football-points-physical-metres-v1';
 points.name='football-physical-scale-lod';points.frustumCulled=false;scene.add(points);
 let lastTime=null,disposed=false,lastFrame=null,inspection={full:0,intermediate:0,far:0,hidden:0,poseUpdates:0,minFootHeight:0,maxFootHeight:0,physicalPlayerHeight:PLAYER_HEIGHT,locomotionCalibrated:true};
 const point=new T.Vector3();
 return {update(frame,camera,viewportHeight=720){
  if(disposed)return;
  const elapsed=lastTime===null?0:frame.time-lastTime,reset=lastTime===null||elapsed<0||elapsed>1,dt=Math.max(0,elapsed);lastTime=frame.time;lastFrame=frame;const used=new Set(),currentKeys=new Set(frame.players.map(p=>p.key));positions.fill(-10000);
  inspection={full:0,intermediate:0,far:0,hidden:0,poseUpdates:0,minFootHeight:Infinity,maxFootHeight:-Infinity,physicalPlayerHeight:PLAYER_HEIGHT,style:cartoon?'civil-cartoon':'athlete',locomotionCalibrated:true,captureCoverage:{matched:!!motion,available:motion?.plans.length??0,rejected:motion?.rejected.length??0},activeCaptures:[],clearance:[]};
  frame.players.forEach((p,i)=>{
   const a=actors.find(a=>a.key===p.key&&!used.has(a))??actors.find(a=>!used.has(a)&&!currentKeys.has(a.key)&&a.side===p.side&&a.keeper===p.keeper);if(!a)return;used.add(a);const resetActor=reset||a.key!==p.key;a.key=p.key;
   const mode=p.speed<.12?'Idle_Loop':p.speed<2.5?'Walk_Loop':p.speed<6?'Jog_Fwd_Loop':'Sprint_Loop',cal=gait[{Walk_Loop:'walk',Jog_Fwd_Loop:'run',Sprint_Loop:'sprint'}[mode]],duration=a.actions.get(mode).getClip().duration,stride=cal?.strideLength??duration*(mode==='Walk_Loop'?1.5:mode==='Sprint_Loop'?7:4.5);
   if(resetActor){a.ballControl?.reset();a.wasAction=false;a.gaitPhase=0;a.lastDistance=p.distance;a.lastHeading=p.heading;a.lastPose=-Infinity;a.current=null;a.mixer.stopAllAction()}
   a.gaitPhase=(a.gaitPhase+Math.max(0,p.distance-a.lastDistance)/stride)%1;a.lastDistance=p.distance;
   const previous=a.detail;a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++;
   a.holder.visible=a.detail==='full'||a.detail==='intermediate';
   positions.set(a.detail==='far'?[p.mx,PLAYER_HEIGHT/2,p.mz]:[-10000,-10000,-10000],i*3);
   const color=new T.Color(p.keeper?'#d6b329':p.side==='home'?state.homeColor:state.awayColor);colors.set(color.toArray(),i*3);
   // Keep scalar facing current even when LOD skips skeleton evaluation.
   const heading=a.lastHeading??p.heading;a.lastHeading=heading+T.MathUtils.clamp(Math.atan2(Math.sin(p.heading-heading),Math.cos(p.heading-heading)),-8*dt,8*dt);
   if(!a.holder.visible)return;
   // Mixer property bindings can skip unchanged values. Restore the last
   // clean imported pose before evaluating them; never feed last frame's
   // contact IK or action blend back into the native animation baseline.
   for(const pose of a.nativePose){pose.bone.position.copy(pose.position);pose.bone.quaternion.copy(pose.quaternion)}
   if(a.current!==mode)a.current=mode;
   for(const[name,action]of a.actions)if(name.endsWith('_Loop')){const target=name===mode?1:0,current=action.isScheduled()?action.getEffectiveWeight():0;action.play();action.timeScale=0;action.setEffectiveWeight(resetActor||previous==='far'||previous==='hidden'?target:T.MathUtils.lerp(current,target,1-Math.exp(-dt/.18)));}
   const active=motion?.plans.some(plan=>plan.key===p.key&&frame.time>=plan.start&&frame.time<=plan.end);
   const nearBall=frame.ball.y<1.5&&Math.hypot(p.mx-frame.ball.x,p.mz-frame.ball.z)<1.5;
   const refresh=active||a.wasAction||nearBall||(a.detail==='full'&&dt>0)||frame.time-a.lastPose>=1/12||previous!==a.detail||frame.time<a.lastPose;
   if(refresh){a.mixer.update(Math.min(.25,dt));for(const[name,action]of a.actions)if(name.endsWith('_Loop')){const c=gait[{Walk_Loop:'walk',Jog_Fwd_Loop:'run',Sprint_Loop:'sprint'}[name]];action.time=name==='Idle_Loop'?frame.time%action.getClip().duration:((a.gaitPhase+(c?.phaseOffset??0))%1)*action.getClip().duration}a.mixer.update(0);a.lastPose=frame.time;inspection.poseUpdates++;}
   if(!cartoon){a.pelvis.position.x=a.rest.x;a.pelvis.position.z=a.rest.z;}
   if(refresh)for(const pose of a.nativePose){pose.position.copy(pose.bone.position);pose.quaternion.copy(pose.bone.quaternion)}
   a.holder.position.set(p.mx,a.groundOffset,p.mz);a.holder.rotation.y=a.lastHeading;a.holder.updateMatrixWorld(true);
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
   const capture=a.motion.apply(frame,p);a.wasAction=!!capture;if(capture){a.ballControl?.reset();inspection.activeCaptures.push(capture)}else{const control=a.ballControl?.apply(frame,p);if(control)(inspection.ballControl??=[]).push({key:p.key,...control});let clearance=a.motion.clearance(frame,p);if(clearance?.rootClearance?.limited)clearance=a.motion.recoverGaitClearance(frame,p,clearance);if(clearance)inspection.clearance.push({key:p.key,...clearance})}
   inspection.minFootHeight=Math.min(inspection.minFootHeight,a.footHeight);inspection.maxFootHeight=Math.max(inspection.maxFootHeight,a.footHeight);
  });
  // A lineup can shrink after a real dismissal/substitution. Never leave an
  // unused avatar or a stale far-LOD point from the preceding frame visible.
  for(const a of actors)if(!used.has(a)){a.holder.visible=false;a.detail='hidden'}
  pointsGeometry.attributes.position.needsUpdate=true;pointsGeometry.attributes.color.needsUpdate=true;points.visible=inspection.far>0;
  if(!Number.isFinite(inspection.minFootHeight))inspection.minFootHeight=inspection.maxFootHeight=0;
 },inspect:()=>({...inspection}),inspectPose:key=>{const a=actors.find(a=>a.key===key);return a?{key,position:a.holder.position.toArray(),bones:[...a.bones].map(([name,b])=>({name,position:b.position.toArray(),quaternion:b.quaternion.toArray()}))}:null},inspectActors:()=>({slots:actors.map((a,slot)=>({slot,key:a.key,heading:a.lastHeading,mode:a.current,visible:a.holder.visible,detail:a.detail})),farPoints:Array.from(positions).filter((_,i)=>i%3===0).filter(x=>x!==-10000).length}),audit:()=>lastFrame?{...inspection,players:lastFrame.players.map(p=>{const a=actors.find(a=>a.key===p.key);return a?.motion.audit(lastFrame,p)}).filter(Boolean)}:null,dispose(){if(disposed)return;disposed=true;points.removeFromParent();pointsGeometry.dispose();pointsMaterial.dispose();for(const a of actors){a.motion.surface.dispose();a.kit.dispose();a.mixer.stopAllAction();a.mixer.uncacheRoot(a.root);a.holder.removeFromParent();for(const mesh of a.meshes)mesh.skeleton.dispose()}if(--users===0){releaseNeutralKits();releaseMatchKits([neymarzetti])}}};
}
