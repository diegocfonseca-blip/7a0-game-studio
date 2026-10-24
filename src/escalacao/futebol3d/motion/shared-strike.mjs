import {strikeClock} from './strike-clock.mjs';
import {preserveSupportFoot} from './support-plant.mjs';
// Generated from scripts/animation-lab/shared-strike.mjs. Repackage after editing source.
import {facingFor} from './facing-track.mjs';
import {blendHeading} from './heading-blend.mjs';
import * as T from 'three';import {nearest} from './nearest.mjs';import {constrainFootBall} from './foot-ball-clearance.mjs';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);},angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const copyPose=a=>[...a.bones].map(([name,b])=>({name,p:b.position.clone(),q:b.quaternion.clone()}));
const armBones=new Set(['clavicle_l','clavicle_r','upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','hand_l','hand_r']);
const torsoBones=new Set(['spine_01','spine_03','neck_01','Head']);
const channelsCache=new WeakMap();
function capturedChannels(actor,key){const clip=actor.clips?.get(key)??actor.actions?.get?.(key)?.getClip();if(!clip)throw Error('Clipe da ação indisponível');if(!channelsCache.has(clip)){const channels=new Set(clip.tracks.map(track=>track.name.replace(/^\.bones\[([^\]]+)\]/,'$1')));channelsCache.set(clip,channels)}return channelsCache.get(clip)}
const feet=a=>[...a.footTriangles('right'),...a.footTriangles('left')];
function center(a,p,offset){const hip=a.bones.get('pelvis').getWorldPosition(new T.Vector3());a.holder.position.x+=p.position.x-hip.x+(offset?.x??0);a.holder.position.z+=p.position.z-hip.z+(offset?.z??0);a.holder.updateMatrixWorld(true);}
export function sampleSharedStrike(actor,timeline,plan,time,{correct=true}={}){
 const frame=timeline.sample(time),p=frame.players.find(p=>p.key===plan.key);if(!p)throw Error('Atleta do lance ausente');
 // A shortened window must still reach full capture at the official contact.
 // Otherwise an exit longer than the post-contact window fades the kick
 // before the foot reaches the ball (0.784 weight on the first shot).
 const poseStart=plan.poseStart??plan.start,entry=Math.max(1e-6,Math.min(plan.entrySeconds??.18,plan.time-poseStart)),exit=Math.max(1e-6,Math.min(plan.exitSeconds??.18,plan.end-plan.time));
 const baseHip=actor.bones.get('pelvis').getWorldPosition(new T.Vector3()),baseRoot=new T.Vector3(baseHip.x-p.position.x,0,baseHip.z-p.position.z);
 const weight=smooth((time-poseStart)/entry)*smooth((plan.end-time)/exit),base=copyPose(actor),baseYaw=actor.holder.rotation.y,basePosition=actor.holder.position.clone();
 const clock=strikeClock(plan,time);actor.holder.rotation.y=plan.yaw;actor.sampleCapture(plan.clip,clock.sample);center(actor,p);
 const captured=copyPose(actor),position=actor.holder.position.clone();
 let captureYaw=plan.yaw;
 if(plan.followTravel&&time>plan.time+.02&&actor.intentAxis&&Number.isFinite(p.heading)){
  const forward=actor.intentAxis.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion())),body=Math.atan2(forward.x,forward.z),reference=plan.exitHeading??p.heading;
  // Once the ball has left, the SAME captured follow-through turns back into
  // the official off-ball run. Keeping its contact yaw fixed caused a brief
  // backwards run even with an otherwise valid open-body pass.
  const target=reference+angle(p.heading-reference),current=reference+angle(body-reference);
  captureYaw+=(target-current)*smooth((time-plan.time-.02)/.20);
 }
 actor.holder.position.lerpVectors(basePosition,position,weight);const reference=time<=plan.time?(plan.entryHeading??facingFor(timeline).sample(plan.key,plan.start)):(plan.exitHeading??facingFor(timeline).sample(plan.key,plan.end));actor.holder.rotation.y=plan.headingBlend==='legacy'?baseYaw+angle(captureYaw-baseYaw)*weight:blendHeading(baseYaw,captureYaw,weight,reference);
 const channels=capturedChannels(actor,plan.clip),armWeight=T.MathUtils.clamp(plan.layers?.arms??1,0,1);
 // A capture has no authority over channels it does not contain (e.g. CMU
 // fingers). Keep those from the clean native clip instead of blending stale
 // binding state left by stopping/restarting AnimationMixer actions.
 for(let i=0;i<captured.length;i++){const pose=captured[i],b=actor.bones.get(pose.name);if(channels.has(pose.name+'.position'))b.position.lerpVectors(base[i].p,pose.p,weight);else b.position.copy(base[i].p);b.quaternion.copy(base[i].q);if(channels.has(pose.name+'.quaternion'))b.quaternion.slerp(pose.q,weight*(armBones.has(pose.name)?armWeight:torsoBones.has(pose.name)?T.MathUtils.clamp(plan.layers?.torso??1,0,1):1));}actor.holder.updateMatrixWorld(true);
 const rootWeight=actor.style==='civil-cartoon'?(plan.rootApproach?smooth((time-plan.start)/(plan.time-plan.start))*smooth((plan.end-time)/exit):weight):smooth((time-(plan.time-.12))/.10)*smooth(((plan.time+.10)-time)/.08);
 const offset=new T.Vector3().fromArray(plan.rootCorrection??[0,0,0]).multiplyScalar(rootWeight);
 // Restore the acquired horizontal pelvis path around the planted contact.
 // The ball/event is fixed; only a bounded visual root can decelerate locally.
 let rootWarp=0;
 if(actor.style==='civil-cartoon'&&plan.rootMotion&&plan.sourceVelocity){const t=time-plan.time,samples=plan.rootMotion.samples,k=samples.findIndex(p=>Math.abs(p[0])<1e-8),a=samples[k-1],b=samples[k+1],native=new T.Vector3((b[1]-a[1])/(b[0]-a[0]),0,(b[2]-a[2])/(b[0]-a[0])),tangent=native.multiplyScalar(strikeClock(plan,plan.time).rate).sub(new T.Vector3().fromArray(plan.sourceVelocity)),duration=t<=0?plan.time-plan.start:plan.end-plan.time,s=T.MathUtils.clamp(t<=0?(time-plan.start)/duration:t/duration,0,1),s2=s*s,s3=s2*s;
  if(t<=0)offset.fromArray(plan.rootCorrection).multiplyScalar(-2*s3+3*s2).addScaledVector(tangent,(s3-s2)*duration);else offset.fromArray(plan.rootCorrection).multiplyScalar(2*s3-3*s2+1).addScaledVector(tangent,(s3-2*s2+s)*duration);
  const length=offset.length();offset.clampLength(0,actor.maxPresentationOffset??.6);rootWarp={model:'bounded-hermite-root-velocity',limited:length>(actor.maxPresentationOffset??.6),nativeVelocity:native.clone().add(new T.Vector3().fromArray(plan.sourceVelocity)).toArray()};}

 // Carry alignment hands off continuously to the captured strike. Full
 // capture still uses its original reviewed contact and root correction.
 offset.addScaledVector(baseRoot,1-(plan.rootApproach?rootWeight:weight));offset.clampLength(0,actor.maxPresentationOffset??.6);
 center(actor,p,offset);actor.ground();
 const ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),raw=Object.fromEntries(['thigh_r','calf_r','foot_r','thigh_l','calf_l','foot_l'].map(n=>[n,actor.bones.get(n).quaternion.clone()])),ankles=['foot_r','foot_l'].map(n=>actor.bones.get(n).getWorldPosition(new T.Vector3()));
 const corrections=correct?{right:constrainFootBall(actor,'right',ball,{maxCorrection:.08}),left:constrainFootBall(actor,'left',ball,{maxCorrection:.08})}:null;
 // A compact rig can exhaust leg IK during an imported approach. Resolve the
 // remaining overlap on the visual anchor only, within both the 18 cm local
 // clearance limit and the actor's overall presentation budget. The official
 // ball, player coordinates and event time remain authoritative.
 if(correct&&actor.style==='civil-cartoon'){
  const original=actor.holder.position.clone(),initialGap=nearest(ball,feet(actor)).distance-.11;
  if(initialGap<-.003){const hit=nearest(ball,feet(actor)),away=hit.surface.clone().sub(ball).setY(0);if(away.lengthSq()<1e-10)away.copy(original).sub(ball).setY(0);away.normalize();let bestGap=initialGap,bestOffset=new T.Vector3();
   search:for(let amount=.005;amount<=.180001;amount+=.005)for(const turn of [0,.4,-.4,.8,-.8,1.2,-1.2,Math.PI/2,-Math.PI/2,2,-2,2.4,-2.4,2.8,-2.8,Math.PI]){const shift=away.clone().applyAxisAngle(new T.Vector3(0,1,0),turn).multiplyScalar(amount);if(offset.clone().add(shift).length()>(actor.maxPresentationOffset??.03)+1e-6)continue;actor.holder.position.copy(original).add(shift);actor.holder.updateMatrixWorld(true);const gap=nearest(ball,feet(actor)).distance-.11;if(gap>bestGap){bestGap=gap;bestOffset.copy(shift)}if(bestGap>=.001)break search;}
   actor.holder.position.copy(original).add(bestOffset);offset.add(bestOffset);actor.holder.updateMatrixWorld(true);corrections.visualAnchor={metres:bestOffset.length(),rawGap:initialGap,gap:bestGap,limited:bestGap<-.003};
  }
 }
 const supportPlant=correct?preserveSupportFoot(actor,plan,time,ball):null;
 actor.holder.updateMatrixWorld(true);const triangles=feet(actor),rightGap=nearest(ball,actor.footTriangles('right')).distance-.11,leftGap=nearest(ball,actor.footTriangles('left')).distance-.11,hip=actor.bones.get('pelvis').getWorldPosition(new T.Vector3());
 const result={time,weight,captureClock:clock,rootWarp,supportPlant,armCaptureWeight:armWeight,foot:plan.foot??'right',contactGap:plan.foot==='left'?leftGap:rightGap,rightGap,leftGap,minFloor:Math.min(...triangles.flatMap(t=>[t.a.y,t.b.y,t.c.y])),rootCorrection:offset.length(),pelvisQuaternion:actor.bones.get('pelvis').getWorldQuaternion(new T.Quaternion()).normalize().toArray(),pelvisError:Math.hypot(hip.x-p.position.x,hip.z-p.position.z),maxAnkleCorrection:Math.max(...['foot_r','foot_l'].map((n,i)=>actor.bones.get(n).getWorldPosition(new T.Vector3()).distanceTo(ankles[i]))),maxJointAngle:Math.max(...Object.entries(raw).map(([n,q])=>actor.bones.get(n).quaternion.angleTo(q))),corrections,ball:frame.ball,provisional:plan.type!=='chute',sourceBallPreserved:true,ballImpulseAllowed:false,writesToMotor:false};
 const finalPose=copyPose(actor);actor.resume();for(const b of finalPose){const bone=actor.bones.get(b.name);bone.position.copy(b.p);bone.quaternion.copy(b.q);}actor.holder.updateMatrixWorld(true);return result;
}
export function contactCorrection(actor,timeline,plan){
 sampleSharedStrike(actor,timeline,{...plan,rootCorrection:[0,0,0]},plan.time,{correct:false});const frame=timeline.sample(plan.time),ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),hit=nearest(ball,actor.footTriangles(plan.foot??'right')),normal=ball.clone().sub(hit.surface).normalize();normal.y=0;normal.normalize();
 const rawGap=hit.distance-.11,budget=actor.maxPresentationOffset??.03;
 // Fit a compact character on the approach side of the official ball. A
 // nearest-surface-only fit may accidentally choose the heel, which touches
 // the ball but points its surface normal against the outgoing pass.
 if(actor.style==='civil-cartoon'&&plan.direction){
  const direction=new T.Vector3().fromArray(plan.direction).setY(0).normalize(),triangles=actor.footTriangles(plan.foot??'right'),points=triangles.flatMap(t=>[t.a,t.b,t.c]),center=points.reduce((v,p)=>v.add(p),new T.Vector3()).divideScalar(points.length),lateral=ball.clone().sub(center).setY(0);lateral.addScaledVector(direction,-lateral.dot(direction));
  // Offline fitting may select the inside/outside edge of the same boot.
  // This changes only the bounded root fit, never the authored bone pose.
  if(plan.contactSideOffset)lateral.addScaledVector(new T.Vector3(direction.z,0,-direction.x),plan.contactSideOffset);
  if(lateral.length()<budget){const origin=actor.holder.position.clone(),range=Math.sqrt(budget*budget-lateral.lengthSq()),gap=amount=>{actor.holder.position.copy(origin).add(lateral).addScaledVector(direction,amount);actor.holder.updateMatrixWorld(true);return nearest(ball,actor.footTriangles(plan.foot??'right')).distance-.11;};let previous=-range,value=gap(previous);
   for(let step=1;step<=96;step++){const amount=-range+2*range*step/96,next=gap(amount);if(value>.001&&next<=.001){let low=previous,high=amount;for(let j=0;j<32;j++){const mid=(low+high)/2;if(gap(mid)>.001)low=mid;else high=mid}return lateral.addScaledVector(direction,(low+high)/2).toArray()}previous=amount;value=next}
   actor.holder.position.copy(origin);actor.holder.updateMatrixWorld(true);
  }
 }
 if(Math.abs(rawGap-.001)>budget)return null;
 const initial=actor.holder.position.clone(),gap=amount=>{actor.holder.position.copy(initial).addScaledVector(normal,amount);actor.holder.updateMatrixWorld(true);return nearest(ball,actor.footTriangles(plan.foot??'right')).distance-.11;};
 if(budget>.03){const direction=rawGap>.001?1:-1;let previous=0;for(let step=1;step<=32;step++){const amount=direction*budget*step/32,value=gap(amount);if((rawGap>.001&&value<=.001)||(rawGap<.001&&value>=.001)){let low=previous,high=amount;for(let i=0;i<32;i++){const mid=(low+high)/2;if((rawGap>.001&&gap(mid)>.001)||(rawGap<.001&&gap(mid)<.001))low=mid;else high=mid}return normal.multiplyScalar((low+high)/2).toArray()}previous=amount}return null;}
 let lo=-.03,hi=.03;if(gap(lo)<.001||gap(hi)>.001)return null;for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(gap(mid)>.001)lo=mid;else hi=mid;}return normal.multiplyScalar((lo+hi)/2).toArray();
}
export function measureSharedImpact(actor,timeline,plan){
 const now=sampleSharedStrike(actor,timeline,plan,plan.time),ball=new T.Vector3(now.ball.x,now.ball.y,now.ball.z),triangles=actor.footTriangles(plan.foot??'right');let closest={distance:Infinity};triangles.forEach((t,i)=>{const point=t.closestPointToPoint(ball,new T.Vector3()),distance=point.distanceTo(ball);if(distance<closest.distance)closest={distance,point,index:i,bary:t.getBarycoord(point,new T.Vector3())};});
 const material=()=>{const t=actor.footTriangles(plan.foot??'right')[closest.index],b=closest.bary;return t.a.clone().multiplyScalar(b.x).addScaledVector(t.b,b.y).addScaledVector(t.c,b.z);};
 const current=material();const previousState=sampleSharedStrike(actor,timeline,plan,plan.time-1/240),previous=material(),normal=ball.clone().sub(current).normalize(),ballVelocity=ball.clone().sub(new T.Vector3(previousState.ball.x,previousState.ball.y,previousState.ball.z)).multiplyScalar(240),velocity=current.clone().sub(previous).multiplyScalar(240),relativeClosing=velocity.clone().sub(ballVelocity).dot(normal),alignment=normal.dot(new T.Vector3().fromArray(plan.direction));
 const launch=plan.delivery?.velocity?new T.Vector3().fromArray(plan.delivery.velocity).normalize():null;
 return {relativeClosing,outgoingAlignment:alignment,contactNormal:normal.toArray(),footVelocity:velocity.toArray(),launchAlignment3D:launch?normal.dot(launch):null,foot:plan.foot??'right',contactGap:now.contactGap,otherGap:plan.foot==='left'?now.rightGap:now.leftGap,rightGap:now.rightGap,leftGap:now.leftGap,minFloor:now.minFloor};
}
export class SharedActionLayer{
 constructor(timeline,compiled,{timelineSha256}={}){if(timelineSha256!==compiled.timelineSha256)throw Error('Linha do tempo alterada após a compilação');if(compiled.schema!=='leilao-legends-shared-actions/v1'||compiled.matchId!==timeline.record.matchId)throw Error('Biblioteca de ações não pertence à partida');this.timeline=timeline;this.compiled=compiled;this.last=[];}
 apply(actors,time){this.last=[];for(const plan of this.compiled.accepted){if(time<plan.start||time>plan.end)continue;const actor=actors.get(plan.key);if(!actor)continue;this.last.push({id:plan.id,type:plan.type,key:plan.key,name:plan.name,clip:plan.clip,...sampleSharedStrike(actor,this.timeline,plan,time)});}return this.last;}
 facingHeading(key,time){return this.compiled.legacyHeadingMode?null:facingFor(this.timeline).sample(key,time);}
 inspect(){return {accepted:this.compiled.accepted.length,rejected:this.compiled.rejected.length,active:this.last,offlineLookahead:true,liveIntentAPI:false,approvedForProduction:false};}
}
