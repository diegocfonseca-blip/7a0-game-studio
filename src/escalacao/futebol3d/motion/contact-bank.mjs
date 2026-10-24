import * as T from 'three';
const up=new T.Vector3(0,1,0),angle=x=>Math.atan2(Math.sin(x),Math.cos(x)),R=.11;
const centre=ts=>ts.flatMap(t=>[t.a,t.b,t.c]).reduce((a,v)=>a.add(v),new T.Vector3()).divideScalar(ts.length*3);

/** Cache geometry and velocity of the EXISTING imported captures. Fits then
 * query rigid copies of visible boots, rather than re-skinning the whole rig
 * hundreds of times for every pass. No geometry, weights or joints change. */
export function buildContactBank(actor,recipes){
 const axis=actor.intentAxis??new T.Vector3(0,0,1).applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()).invert());
 const reset=()=>{actor.mixer.stopAllAction();for(const r of actor.reference){r.node.position.copy(r.p);r.node.quaternion.copy(r.q);r.node.scale.copy(r.s)}actor.actions.get('Idle_Loop').reset().play();actor.mixer.update(0);actor.holder.position.set(0,0,0);actor.holder.rotation.y=0;actor.holder.updateMatrixWorld(true)};
 const sample=(clip,clock)=>{reset();actor.sampleCapture(clip,clock);const hip=actor.pelvis.getWorldPosition(new T.Vector3());actor.holder.position.x-=hip.x;actor.holder.position.z-=hip.z;actor.holder.updateMatrixWorld(true);actor.ground();return{feet:Object.fromEntries(['left','right'].map(s=>[s,actor.footTriangles(s)])),body:axis.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()))}};
 const seen=new Set(),bank=[];
 for(const r of recipes)for(const shift of [0,-.05,.05,-.1,.1,-.15,.15]){
  const marker=r.marker+shift,clip=actor.actions.get(r.clip)?.getClip();if(!clip||marker<.01||marker>clip.duration-.01)continue;
  const key=r.clip+':'+marker.toFixed(5)+':'+r.foot;if(seen.has(key))continue;seen.add(key);
  const rate=2,u=(1/240)/.24,delta=.24*(u*u*u-2*u*u+2*u),before=sample(r.clip,marker-delta),at=sample(r.clip,marker),foot=r.foot??'right',triangles=at.feet[foot],velocity=triangles.map((t,i)=>['a','b','c'].map(n=>t[n].clone().sub(before.feet[foot][i][n]).multiplyScalar(240))),points=triangles.flatMap(t=>[t.a,t.b,t.c]);
  const entry={clip:r.clip,marker,foot,rate,feet:at.feet,velocity,bodyYaw:Math.atan2(at.body.x,at.body.z),center:centre(triangles),minFloor:Math.min(...Object.values(at.feet).flatMap(ts=>ts.flatMap(t=>[t.a.y,t.b.y,t.c.y])))};
  entry.radius=Math.max(...points.map(p=>p.distanceTo(entry.center)));bank.push(entry);
 }
 reset();return bank;
}

const q=new T.Vector3();
function closest(p,ts){let distance=Infinity,index=-1,surface=new T.Vector3();for(let i=0;i<ts.length;i++){ts[i].closestPointToPoint(p,q);const d=p.distanceToSquared(q);if(d<distance){distance=d;index=i;surface.copy(q)}}return{distance:Math.sqrt(distance),index,surface};}
function fitTranslation(ball,direction,entry,sideOffset,budget){
 const lateral=ball.clone().sub(entry.center).setY(0);lateral.addScaledVector(direction,-lateral.dot(direction)).addScaledVector(new T.Vector3(direction.z,0,-direction.x),sideOffset);
 if(lateral.length()>=budget)return null;
 const range=Math.sqrt(budget*budget-lateral.lengthSq()),point=new T.Vector3(),gap=t=>{point.copy(ball).sub(lateral).addScaledVector(direction,-t);return closest(point,entry.feet[entry.foot]).distance-R;};
 let lo=-range;if(gap(lo)<=.001)return null;
 const mid=T.MathUtils.clamp(ball.clone().sub(lateral).sub(entry.center).dot(direction),-range,range);
 let hi=null;
 for(const t of [mid-.12,mid-.06,mid,mid+.06,mid+.12,range]){const at=T.MathUtils.clamp(t,-range,range);if(gap(at)<=.001){hi=at;break;}}
 if(hi===null)return null;
 for(let j=0;j<20;j++){const t=(lo+hi)/2;if(gap(t)>.001)lo=t;else hi=t;}
 return lateral.addScaledVector(direction,(lo+hi)/2);
}

/** The official ball, actor and incoming/outgoing velocities are immutable.
 * A missing fit remains missing; this never retimes an event or moves a ball. */
function* fitBankContactSteps(contact,bank,{maxRoot=.6,maxCandidates=1}={}){
 const {player:p,ball,beforeBall,playerVelocity,delivery}=contact;
 if(contact.requiredContact!=='foot'||!delivery?.velocity)return null;
 const outgoing=new T.Vector3().fromArray(delivery.velocity),direction=outgoing.clone().setY(0).normalize();if(direction.lengthSq()<.5)return null;
 const incoming=new T.Vector3(ball.x-beforeBall.x,ball.y-beforeBall.y,ball.z-beforeBall.z).multiplyScalar(240),impulse=outgoing.clone().sub(incoming).normalize(),target=Math.atan2(direction.x,direction.z),turn=angle(target-p.heading),open=p.speed>1.8?p.heading+turn*.5:target,localSource=new T.Vector3(ball.x-p.mx,ball.y,ball.z-p.mz);
 const ranked=[];let attempts=0;
 for(const entry of bank){
  if(entry.minFloor<-.00001)continue;
  let entryBest=null;
  for(const degrees of [0,-15,15,-30,30]){
   const yaw=open-entry.bodyYaw+degrees*Math.PI/180,body=yaw+entry.bodyYaw,bodyError=Math.abs(angle(target-body));
   if(bodyError>84*Math.PI/180||p.speed>1.8&&Math.abs(angle(body-p.heading))>95*Math.PI/180)continue;
   const localBall=localSource.clone().applyAxisAngle(up,-yaw),dir=direction.clone().applyAxisAngle(up,-yaw);
   if(localBall.distanceTo(entry.center)-entry.radius-R>maxRoot)continue;
   for(const sideOffset of [0,-.08,.08,-.12,.12]){attempts++;
    const root=fitTranslation(localBall,dir,entry,sideOffset,maxRoot);if(!root)continue;
    const centreBall=localBall.clone().sub(root),hit=closest(centreBall,entry.feet[entry.foot]),other=closest(centreBall,entry.feet[entry.foot==='left'?'right':'left']).distance-R;
    if(Math.abs(hit.distance-R)>.002||other<.025)continue;
    const normal=centreBall.clone().sub(hit.surface).normalize().applyAxisAngle(up,yaw),bary=entry.feet[entry.foot][hit.index].getBarycoord(hit.surface,new T.Vector3()),v=entry.velocity[hit.index],nativeVelocity=v[0].clone().multiplyScalar(bary.x).addScaledVector(v[1],bary.y).addScaledVector(v[2],bary.z).applyAxisAngle(up,yaw),carrier=new T.Vector3().fromArray(playerVelocity),change=outgoing.clone().sub(incoming).dot(normal),desiredClosing=Math.max(.2,change/1.65),drift=carrier.clone().sub(incoming).dot(normal),nativeClosing=nativeVelocity.dot(normal);
    // Retiming the acquired swing communicates the source delivery's power.
    // A very slow poke must not visually launch a powerful official shot.
    const rate=nativeClosing>1e-5?T.MathUtils.clamp(2*(desiredClosing-drift)/nativeClosing,1,3):1,velocity=nativeVelocity.multiplyScalar(rate/2).add(carrier);
    const closing=velocity.clone().sub(incoming).dot(normal),alignment=normal.dot(direction),impulseAlignment=normal.dot(impulse),launchAlignment=normal.dot(outgoing.clone().normalize());
    const aerial=delivery.trajectory==='air';
    if(closing<=.15||closing<change*.35||alignment<.5||impulseAlignment<.75||(aerial?(normal.y<=0||velocity.y<=.2||launchAlignment<.5):Math.abs(normal.y)>.45))continue;
    const worldRoot=root.clone().applyAxisAngle(up,yaw),rank=worldRoot.length()*1.5+bodyError*.1+(p.speed>1.8?Math.abs(angle(body-p.heading))*.08:0)+Math.abs(Math.log((closing+.2)/(desiredClosing+.2)))*.20;
    const candidate={...contact,clip:entry.clip,marker:entry.marker,foot:entry.foot,rate,yaw,rootCorrection:worldRoot.toArray(),bodyHeadingAtContact:body,approachHeading:body,bodyAimLimit:.42,bodyErrorAtContact:bodyError,contactSideOffset:sideOffset,impact:{contactGap:hit.distance-R,otherGap:other,relativeClosing:closing,desiredClosing,impulseVelocityChange:change,outgoingAlignment:alignment,impulseAlignment,launchAlignment3D:launchAlignment,footVelocity:velocity.toArray()},rank};
    if(!entryBest||rank<entryBest.rank)entryBest=candidate;
    break;
   }
  }
  if(entryBest)ranked.push(entryBest);
  yield;
 }
 ranked.sort((a,b)=>a.rank-b.rank);if(!ranked.length)return maxCandidates===1?null:[];
 const plans=ranked.slice(0,maxCandidates).map(best=>{
 const preparation=contact.type==='chute'?.42:.32,rootPreparation=Math.abs(turn)>Math.PI*.55?.65:preparation;
 const plan={id:contact.id,key:contact.key,name:p.name,type:contact.type,time:contact.time,requiredContact:'foot',delivery,direction:direction.toArray(),clip:best.clip,marker:best.marker,foot:best.foot,yaw:best.yaw,rootCorrection:best.rootCorrection,intentHeading:target,approachHeading:best.approachHeading,bodyHeadingAtContact:best.bodyHeadingAtContact,bodyAimLimit:.42,entryHeading:contact.entryHeading??p.heading,exitHeading:contact.exitHeading??p.heading,start:contact.time-rootPreparation,poseStart:contact.time-preparation,end:contact.time+(contact.type==='chute'?.50:.38),entrySeconds:preparation,exitSeconds:contact.type==='chute'?.50:.38,headingBlend:'anchored',rootApproach:true,followTravel:true,carryAlignedRoot:true,contactBallBearing:Math.atan2(ball.x-p.mx,ball.z-p.mz),layers:{torso:1},swingTiming:{rate:best.rate,window:.24},impact:best.impact,provisional:true,source:'Existing CMU capture fitted to this official replay; no new decisions or ball trajectory',fitAttempts:attempts};
 return plan;});return maxCandidates===1?plans[0]:plans;
}
export function fitBankContact(contact,bank,options){const steps=fitBankContactSteps(contact,bank,options);let result;do{result=steps.next()}while(!result.done);return result.value;}
export async function fitBankContactAsync(contact,bank,options,yieldTask){const steps=fitBankContactSteps(contact,bank,options);let result,start=performance.now();do{result=steps.next();if(!result.done&&performance.now()-start>8){await yieldTask();start=performance.now();}}while(!result.done);return result.value;}
