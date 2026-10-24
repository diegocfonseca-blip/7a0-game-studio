import * as T from 'three';
const clamp=T.MathUtils.clamp,angle=v=>Math.atan2(Math.sin(v),Math.cos(v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export const FOOTBALL_ACTION_STATES=['decision','approach','preparation','contact','continuation','recovery'];
/** Presentation schedule derived from reviewed OFFICIAL contacts. Never owns
 * possession, emits an impulse, delays a ball, or changes an official decision. */
export class FootballActionController{
 constructor(plans=[]){this.current=new Map();this.metrics=new Map();this.incoming=null;this.receptions=[];this.requiredSource=null;this.setPlans(plans);}
 setPlans(plans,releaseTimes){this.plans=plans.map(p=>({...p,start:Number.isFinite(p.start)?p.start:p.time-.65,end:Number.isFinite(p.end)?p.end:p.time+.28}));this.releaseTimes=[...new Set(releaseTimes??plans.map(p=>p.time))].sort((a,b)=>a-b);this.current.clear();this.metrics.clear();}
 nextRelease(time){return this.releaseTimes.find(t=>t>=time-1e-8)??null;}
 action(key,time){const candidates=this.plans.filter(p=>p.key===key&&time>=p.start-.25&&time<=p.end);if(!candidates.length)return null;const p=candidates.sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time))[0],before=p.time-time;let state;
 if(time<p.start)state='decision';else if(before>.28)state='approach';else if(before>1/120)state='preparation';else if(before>=-1/120)state='contact';else if(time<Math.min(p.end,p.time+.28))state='continuation';else state='recovery';
 const sourceContact=this.requiredSource?.key===key?this.requiredSource.contact:null,requiredContact=sourceContact&&sourceContact!=='foot'?sourceContact:p.requiredContact??sourceContact??'foot',supported=!p.unsupported&&requiredContact==='foot';
 return{plan:p,state,contactAt:p.time,preparationSeconds:p.time-p.start,intentHeading:p.intentHeading??Math.atan2(p.direction[0],p.direction[2]),delivery:p.delivery??null,requiredContact,supported,contactLocked:supported&&Math.abs(before)<.12,collisionFreedom:!supported?1:smooth((Math.abs(before)-.12)/.3),animationActive:supported&&time>=p.start,mayEmitImpulse:false,officialBallUnchanged:true};}
 prepare(actor,key,time,heading,speed=0){const a=this.action(key,time);if(!a){if(this.incoming?.receiver===key&&this.incoming.player){const p=this.incoming.player;return heading+clamp(angle(Math.atan2(this.incoming.ball.x-p.mx,this.incoming.ball.z-p.mz)-heading),-.65,.65)*.7;}return heading;}this.current.set(key,a);const entry=smooth((time-a.plan.start+.25)/.25),recovery=smooth((time-a.plan.time-.12)/Math.max(.01,a.plan.end-a.plan.time-.12)),weight=entry*(1-recovery);
 // The imported pose owns hips/legs during the actual strike. Anticipate its
 // world orientation on the native gait, rather than turning only at impact.
 // Do not cap the target to 18 degrees from travel on every frame: that
 // never accumulates a real turn for a moving return pass. The actor's
 // locomotionTurnStep bounds actual angular velocity. Hold the intention
 // through impact, then recover toward CURRENT travel, not entry heading.
 // Without a captured strike, a full turn would rotate the forward running
 // gait backwards. Keep that missing action visible as unsupported, with
 // only a limited anticipation; never pretend this supplies its foot pose.
 if(!a.supported)return heading+clamp(angle(a.intentHeading-heading),-Math.PI/8,Math.PI/8)*weight*.8;
 // A forward-running clip cannot communicate a full backwards pass while
 // the captured strike has not yet blended in (or has already faded out).
 // Match the native facing to the imported layer's actual envelope. Its
 // measured contact remains fully oriented; upper-body anticipation above
 // still communicates the intention before the feet change action.
 const poseStart=a.plan.poseStart??a.plan.start,entrySeconds=Math.max(1e-6,Math.min(a.plan.entrySeconds??.18,a.plan.time-poseStart)),exitSeconds=Math.max(1e-6,Math.min(a.plan.exitSeconds??.18,a.plan.end-a.plan.time));
 if(a.plan.followTravel&&time>a.plan.time+.02)return heading;
 const captured=smooth((time-poseStart)/entrySeconds)*smooth((a.plan.end-time)/exitSeconds);
 // An inside-foot return pass can have an open pelvis. Approach that actual
 // fitted body orientation; aiming the running gait at the outgoing ball
 // instead would turn it backwards before the captured sideways contact.
 return heading+angle((a.plan.approachHeading??a.intentHeading)-heading)*weight*captured;}
 orientUpperBody(actor,p,time){const a=this.action(p.key,time);if(!a){if(p.keeper)this.orientKeeper(actor,p,time);else{this.orientOpenPlay(actor,p,time);this.orientReception(actor,p);}return;}const weight=smooth((time-a.plan.start+.25)/.25)*smooth((a.plan.end-time)/.25),up=new T.Vector3(0,1,0);
  for(const [name,axis,max]of [['spine_03',actor.intentAxis,a.plan.bodyAimLimit??.35],['Head',actor.headIntentAxis,.52]]){if(!axis)continue;const bone=actor.bones.get(name),world=bone.getWorldQuaternion(new T.Quaternion()),forward=axis.clone().applyQuaternion(world);let target=a.intentHeading;
   // Look at the incoming ball during reception, then anticipate the actual
   // outgoing delivery. A future pass must not hide the ball from the head.
   if(name==='Head'&&this.incoming?.receiver===p.key){const pos=bone.getWorldPosition(new T.Vector3()),incoming=Math.atan2(this.ball.x-pos.x,this.ball.z-pos.z);target+=angle(incoming-target)*smooth((a.contactAt-time-.10)/.15);}
   const wanted=clamp(angle(target-Math.atan2(forward.x,forward.z)),-max,max)*weight;
   // Clamping a shortest angle flips instantly from +limit to -limit when
   // an imported approach crosses the opposite direction. Filter this
   // residual intention, while preserving the measured impact orientation.
   actor.actionAim??=new Map();const old=actor.actionAim.get(name),dt=old?time-old.time:0;
   const smoothed=!old||old.plan!==a.plan||dt<0||dt>.2?wanted:old.turn+(wanted-old.turn)*(1-Math.exp(-Math.max(0,dt)/.06));
   const impact=smooth((.15-Math.abs(a.contactAt-time))/.10),turn=smoothed+(wanted-smoothed)*impact,parent=bone.parent.getWorldQuaternion(new T.Quaternion());
   actor.actionAim.set(name,{plan:a.plan,time,turn});bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(up,turn)).multiply(world));actor.holder.updateMatrixWorld(true);}
  if(a.contactAt-time>.15)this.orientReception(actor,p);
 }
 orientOpenPlay(actor,p,time){
  if(!this.ball||!actor.headIntentAxis||['gol','fim','saida'].includes(this.phase))return;
  const head=actor.bones.get('Head'),position=head.getWorldPosition(new T.Vector3()),delta=new T.Vector3(this.ball.x,this.ball.y,this.ball.z).sub(position),distance=Math.hypot(delta.x,delta.z);if(distance<.2||distance>30)return;
  const world=head.getWorldQuaternion(new T.Quaternion()),forward=actor.headIntentAxis.clone().applyQuaternion(world),yaw=Math.atan2(forward.x,forward.z),wanted=clamp(angle(Math.atan2(delta.x,delta.z)-yaw),p.speed>4?-.45:-.65,p.speed>4?.45:.65)*smooth((30-distance)/15),prior=actor.openPlayLook,dt=prior?time-prior.time:0;
  const turn=!prior||dt<0||dt>.3?wanted:prior.turn+(wanted-prior.turn)*(1-Math.exp(-Math.max(0,dt)/.12));actor.openPlayLook={time,turn};
  const parent=head.parent.getWorldQuaternion(new T.Quaternion());head.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn)).multiply(world));actor.holder.updateMatrixWorld(true);
  this.receptions.push({key:p.key,kind:this.incoming?.receiver===p.key?'incoming-ball-look':'open-play-ball-look',yawCorrection:turn,changesBall:false});
 }
 orientKeeper(actor,p,time){
  if(!this.ball||['gol','fim','saida'].includes(this.phase)||p.speed>1.2)return;
  const delta=new T.Vector3(this.ball.x-p.mx,0,this.ball.z-p.mz),distance=delta.length();if(distance<.3||distance>45)return;
  const target=Math.atan2(delta.x,delta.z),old=actor.keeperLook,dt=old?time-old.time:0,reset=!old||dt<0||dt>.5,weight=smooth((45-distance)/20),up=new T.Vector3(0,1,0);
  const wanted=angle(target-actor.holder.rotation.y),turn=reset?wanted:old.turn+angle(wanted-old.turn)*(1-Math.exp(-Math.max(0,dt)/.12));actor.keeperLook={time,turn};
  for(const [name,limit,share]of [['spine_03',.22,.35],['Head',.48,.65]]){const bone=actor.bones.get(name);if(!bone)continue;const world=bone.getWorldQuaternion(new T.Quaternion()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(up,clamp(turn*share,-limit,limit)*weight)).multiply(world));actor.holder.updateMatrixWorld(true);}
  this.receptions.push({key:p.key,kind:'keeper-ball-tracking',yawCorrection:clamp(turn,-.7,.7)*weight,ballHeight:this.ball.y,changesBall:false,provisional:true});
 }
 orientReception(actor,p){const incoming=this.incoming;if(p.keeper||incoming?.receiver!==p.key||!actor.headIntentAxis||incoming.ball.y<=.35)return;const bone=actor.bones.get('Head'),position=bone.getWorldPosition(new T.Vector3()),delta=new T.Vector3(incoming.ball.x,incoming.ball.y,incoming.ball.z).sub(position),distance=Math.hypot(delta.x,delta.z);if(distance>25)return;const world=bone.getWorldQuaternion(new T.Quaternion()),forward=actor.headIntentAxis.clone().applyQuaternion(world),yaw=Math.atan2(forward.x,forward.z),pitch=Math.atan2(forward.y,Math.hypot(forward.x,forward.z)),target=clamp(Math.atan2(delta.y,Math.max(.1,distance)),-.25,.65),weight=smooth((25-distance)/15)*smooth((incoming.ball.y-.35)/.6),turn=clamp(target-pitch,-.45,.45)*weight,parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),-turn)).multiply(world));actor.holder.updateMatrixWorld(true);this.receptions.push({key:p.key,kind:'airborne-ball-tracking',pitchCorrection:turn,ballHeight:incoming.ball.y,delivery:incoming.delivery??null,provisional:true,changesBall:false});}
 inspect(){return[...this.current].map(([key,a])=>({key,id:a.plan.id,state:a.state,contactAt:a.contactAt,preparationSeconds:a.preparationSeconds,intentHeading:a.intentHeading,delivery:a.delivery,requiredContact:a.requiredContact,supported:a.supported,mayEmitImpulse:false,...this.metrics.get(key)}));}
 inspectReceptions(){return this.receptions;}
 begin(frame){this.ball=frame?.ball;this.phase=frame?.phase;this.current.clear();this.metrics.clear();this.receptions=[];this.requiredSource=frame?.restart?.type==='lateral'?{key:frame.restart.taker,contact:'hands'}:frame?.officialAction?{key:frame.officialAction.actor,contact:frame.officialAction.requiredContact??(frame.officialAction.restartOrigin?.type==='lateral'?'hands':'foot')}:null;const receiver=frame?.officialAction?.receiver;this.incoming=receiver?{receiver,player:frame.players.find(p=>p.key===receiver),ball:frame.ball,delivery:frame.officialAction.delivery}:null;}
 validate(actor,p,frame,capture){const a=this.action(p.key,frame.time);if(!a)return null;
 if(!actor.intentAxis){const bone=actor.bones.get('spine_03');actor.intentAxis=new T.Vector3(0,0,1).applyQuaternion(bone.getWorldQuaternion(new T.Quaternion()).invert())}
 const forward=actor.intentAxis.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion())),body=Math.atan2(forward.x,forward.z),error=Math.abs(angle(a.intentHeading-body)),gap=capture?.contactGap??null;
 const result={bodyHeading:body,bodyErrorDegrees:error*180/Math.PI,footGap:gap,contactReady:a.supported&&!!capture&&Math.abs(gap)<=.02&&error<=Math.PI/3,unsupportedPose:!a.supported||!capture||error>Math.PI/3,phase:a.state};this.metrics.set(p.key,result);return result;}
}
