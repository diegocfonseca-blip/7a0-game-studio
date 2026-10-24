import * as T from 'three';
import {sampleSharedStrike} from './motion/shared-strike.mjs';
import {attachGarmentFeet} from './motion/garment-feet.mjs';
import {constrainFootBall} from './motion/foot-ball-clearance.mjs';
import {nearest} from './motion/nearest.mjs';
const canonical=o=>Array.isArray(o)?o.map(canonical):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])])):o;
let indexPromise,packPromise,gaitPromise;
export async function loadGaitCalibration(){
 gaitPromise??=fetch(new URL('./assets/locomotion-calibration.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Calibração de locomoção indisponível');return r.json()}).then(data=>{
  if(data.schema!=='leilao-legends-locomotion-calibration/v1')throw Error('Calibração incompatível');
  for(const key of ['walk','run','sprint']){const c=data.gait?.[key];if(!c||![c.strideLength,c.phaseOffset,c.duration].every(Number.isFinite)||c.strideLength<=0||c.duration<=0||c.phaseOffset<0||c.phaseOffset>=1)throw Error('Passada inválida: '+key)}
  return data.gait;
 }).catch(error=>{gaitPromise=undefined;throw error});
 return gaitPromise;
}
export async function loadReviewedMotion(input,{metadataOnly=false}={}){
 if(!input)return null;
 indexPromise??=fetch(new URL('./assets/reviewed-motion-index.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Índice de movimentos indisponível');return r.json()});
 const index=await indexPromise;
 // A reviewed input alone is insufficient after the official engine changes.
 // Never play old contact markers over a new canonical trajectory.
 const engine=typeof __LEILAO_3D_ENGINE_SHA256__==='string'?__LEILAO_3D_ENGINE_SHA256__:null;
 if(!engine||index.engineSHA256!==engine)return null;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(input)))),hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==index.inputSHA256)return null;
 if(metadataOnly)return {inputSHA256:hash,engineSHA256:index.engineSHA256};
 packPromise??=fetch(new URL('./assets/reviewed-match-motion.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Capturas revisadas indisponíveis');return r.json()});
 const pack=await packPromise;if(pack.inputSHA256!==hash)throw Error('Movimentos de outra partida');
 return {...pack,clips:new Map(Object.entries(pack.clips).map(([name,clip])=>[name,T.AnimationClip.parse(clip)]))};
}
export function bindCapturedMotion(actor,pack){
 actor.bones=new Map(actor.meshes[0].skeleton.bones.map(b=>[b.name,b]));
 for(const[name,clip]of pack?.clips??[]){const action=actor.mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;actor.actions.set(name,action)}
 const point=new T.Vector3();let saved;
 actor.footTriangles=()=>[];
 actor.ground=()=>{actor.holder.position.y=0;actor.holder.updateMatrixWorld(true);let low=Infinity;for(const index of actor.footIndices)low=Math.min(low,actor.kit.mesh.getVertexPosition(index,point).applyMatrix4(actor.kit.mesh.matrixWorld).y);if(Number.isFinite(low))actor.holder.position.y=Math.max(0,-low);actor.holder.updateMatrixWorld(true)};
 const surface=attachGarmentFeet(actor,actor.kit.mesh,actor.kit.template.data);
 actor.sampleCapture=(key,time)=>{saved=[...actor.actions].filter(([name])=>name.endsWith('_Loop')).map(([name,a])=>({name,time:a.time,weight:a.getEffectiveWeight(),running:a.isScheduled()}));actor.mixer.stopAllAction();const action=actor.actions.get(key);if(!action)throw Error('Captura ausente');action.reset().setEffectiveWeight(1).play();action.time=T.MathUtils.clamp(time,0,Math.max(0,action.getClip().duration-1e-6));actor.mixer.update(0);actor.ground()};
 actor.resume=()=>{actor.mixer.stopAllAction();for(const s of saved??[]){const a=actor.actions.get(s.name);if(s.running){a.play();a.time=s.time;a.setEffectiveWeight(s.weight)}}actor.mixer.update(0)};
 return {surface,apply(frame,p,selected){const plan=selected!==undefined?selected:pack?.plans.find(plan=>plan.key===p.key&&frame.time>=plan.start&&frame.time<=plan.end);if(!plan)return null;
  const shared={...frame,players:frame.players.map(p=>({...p,position:{x:p.mx,y:0,z:p.mz}}))};const result=sampleSharedStrike(actor,{sample:()=>shared},plan,frame.time);
  return {id:plan.id,key:p.key,type:plan.type,time:frame.time,marker:plan.time,...result};
 },clearance(frame,p){const ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z);if(ball.y>1.5||Math.hypot(p.mx-ball.x,p.mz-ball.z)>1.5)return null;
  const names=['thigh_l','calf_l','foot_l','thigh_r','calf_r','foot_r'],bones=names.map(n=>actor.bones.get(n)),original=bones.map(b=>b.quaternion.clone()),positions=bones.map(b=>b.position.clone()),origin=actor.holder.position.clone();
  const attempt=offset=>{bones.forEach((b,i)=>{b.quaternion.copy(original[i]);b.position.copy(positions[i])});actor.holder.position.copy(origin).add(offset);actor.holder.updateMatrixWorld(true);
   const results={};for(const side of ['left','right']){const foot=actor.bones.get('foot_'+(side==='left'?'l':'r')).getWorldPosition(new T.Vector3());if(foot.distanceTo(ball)<.55)results[side]=constrainFootBall(actor,side,ball,{maxCorrection:.08,maxAngle:.35})}
   const feet=[...actor.footTriangles('left'),...actor.footTriangles('right')],gap=nearest(ball,feet).distance-.11,floor=Math.min(...feet.flatMap(t=>[t.a.y,t.b.y,t.c.y]));
   const hip=actor.pelvis.getWorldPosition(new T.Vector3()),anchor=actor.sourceAnchor??{x:p.mx,z:p.mz};return {results,gap,floor,budgetOK:Math.hypot(hip.x-anchor.x,hip.z-anchor.z)<=(actor.maxPresentationOffset??.6)+1e-6,offset:offset.clone(),pose:bones.map(b=>b.quaternion.clone()),positions:bones.map(b=>b.position.clone())};
  };
  let best=attempt(new T.Vector3());
  // A shallow overlap at a restart can exceed the leg-only reach budget.
  // Reposition the presentation anchor by at most 3 cm, then solve again
  // from the SAME imported pose. Never move the ball or accumulate IK.
  if(best.gap< -1e-5){const hit=nearest(ball,[...actor.footTriangles('left'),...actor.footTriangles('right')]),away=hit.surface.clone().sub(ball);away.y=0;if(away.lengthSq()<1e-10)away.copy(origin).sub(ball).setY(0);away.normalize();
   search:for(const amount of [.01,.02,.03])for(const angle of [0,.25,-.25,.55,-.55,.85,-.85,1.1,-1.1,1.57,-1.57,2.1,-2.1,Math.PI]){const offset=away.clone().applyAxisAngle(new T.Vector3(0,1,0),angle).multiplyScalar(amount),candidate=attempt(offset);if(candidate.budgetOK&&candidate.floor>=-1e-5&&candidate.gap>best.gap){best=candidate;if(best.gap>=.001-1e-6)break search}}
  }
  bones.forEach((b,i)=>{b.quaternion.copy(best.pose[i]);b.position.copy(best.positions[i])});actor.holder.position.copy(origin).add(best.offset);actor.holder.updateMatrixWorld(true);
  return {...best.results,rootClearance:{metres:best.offset.length(),gap:best.gap,limited:best.gap<-.003}};
 },recoverGaitClearance(frame,p,failure){
  // If IK reaches its limit, try a <=2% phase adjustment of the EXISTING
  // imported gait, never another bone-generated motion or a ball displacement.
  const loops=[...actor.actions].filter(([name])=>name.endsWith('_Loop')),times=loops.map(([,a])=>a.time),snapshot=()=>({position:actor.holder.position.clone(),bones:[...actor.bones].map(([name,b])=>({name,p:b.position.clone(),q:b.quaternion.clone()}))});
  let best={result:failure,pose:snapshot(),offset:0};
  for(const offset of [-.01,.01,-.02,.02]){
   loops.forEach(([,a],i)=>{const d=a.getClip().duration;a.time=(times[i]+offset*d+d)%d});actor.mixer.update(0);
   const hip=actor.bones.get('pelvis');if(actor.style!=='civil-cartoon'){hip.position.x=actor.rest.x;hip.position.z=actor.rest.z;}
   actor.holder.position.set(p.mx,0,p.mz);actor.holder.updateMatrixWorld(true);const anchor=hip.getWorldPosition(new T.Vector3());actor.holder.position.x+=p.mx-anchor.x;actor.holder.position.z+=p.mz-anchor.z;actor.holder.updateMatrixWorld(true);
   const feet=[...actor.footTriangles('left'),...actor.footTriangles('right')],low=Math.min(...feet.flatMap(t=>[t.a.y,t.b.y,t.c.y]));actor.holder.position.y=.002-low;actor.holder.updateMatrixWorld(true);
   const result=this.clearance(frame,p);if(result&&result.rootClearance.gap>best.result.rootClearance.gap){best={result,pose:snapshot(),offset};if(result.rootClearance.gap>=.001-1e-6)break}
  }
  loops.forEach(([,a],i)=>{a.time=times[i]});actor.holder.position.copy(best.pose.position);for(const b of best.pose.bones){const bone=actor.bones.get(b.name);bone.position.copy(b.p);bone.quaternion.copy(b.q)}actor.holder.updateMatrixWorld(true);
  return {...best.result,gaitPhaseOffset:best.offset};
 },audit(frame,p){const ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),near=frame.owner===p.key||Math.hypot(p.mx-ball.x,p.mz-ball.z)<1.5;
  const feet={left:actor.footTriangles('left'),right:actor.footTriangles('right')},low=Math.min(...Object.values(feet).flatMap(ts=>ts.flatMap(t=>[t.a.y,t.b.y,t.c.y])));
  const footPositions=Object.fromEntries(Object.entries(feet).map(([side,triangles])=>{const points=triangles.flatMap(t=>[t.a,t.b,t.c]),mean=points.reduce((sum,v)=>sum.add(v),new T.Vector3()).multiplyScalar(1/points.length);return[side,{position:mean.toArray(),floor:Math.min(...points.map(v=>v.y))}]}));
  return {key:p.key,name:p.name,side:p.side,speed:p.speed,presentationSpeed:actor.presentationSpeed,presentationHeading:actor.holder.rotation.y,bodyHeading:(()=>{const forward=actor.intentAxis?.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()));return forward?Math.atan2(forward.x,forward.z):actor.holder.rotation.y})(),footPositions,head:(actor.headCenterLocal?actor.bones.get('Head').localToWorld(actor.headCenterLocal.clone()):actor.bones.get('Head').getWorldPosition(new T.Vector3())).toArray(),headRadius:actor.headRadius??.2,headingError:Math.abs(Math.atan2(Math.sin(actor.holder.rotation.y-p.heading),Math.cos(actor.holder.rotation.y-p.heading))),rootError:(()=>{const hip=actor.bones.get('pelvis').getWorldPosition(new T.Vector3());return Math.hypot(hip.x-p.mx,hip.z-p.mz)})(),holderOffset:Math.hypot(actor.holder.position.x-p.mx,actor.holder.position.z-p.mz),minFootHeight:low,leftGap:near?nearest(ball,feet.left).distance-.11:null,rightGap:near?nearest(ball,feet.right).distance-.11:null};
 }};
}
