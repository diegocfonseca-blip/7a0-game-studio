import * as T from 'three';
const clamp=T.MathUtils.clamp,angle=v=>Math.atan2(Math.sin(v),Math.cos(v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export const FOOTBALL_ACTION_STATES=['decision','approach','preparation','contact','continuation','recovery'];
/** Presentation schedule derived from reviewed OFFICIAL contacts. Never owns
 * possession, emits an impulse, delays a ball, or changes an official decision. */
export class FootballActionController{
 constructor(plans=[]){this.plans=plans.map(p=>({...p,start:Number.isFinite(p.start)?p.start:p.time-.65,end:Number.isFinite(p.end)?p.end:p.time+.28}));this.current=new Map();this.metrics=new Map();this.incoming=null;this.receptions=[];}
 action(key,time){const candidates=this.plans.filter(p=>p.key===key&&time>=p.start-.25&&time<=p.end);if(!candidates.length)return null;const p=candidates.sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time))[0],before=p.time-time;let state;
 if(time<p.start)state='decision';else if(before>.28)state='approach';else if(before>1/120)state='preparation';else if(before>=-1/120)state='contact';else if(time<Math.min(p.end,p.time+.28))state='continuation';else state='recovery';
 return{plan:p,state,contactAt:p.time,preparationSeconds:p.time-p.start,intentHeading:p.intentHeading??Math.atan2(p.direction[0],p.direction[2]),delivery:p.delivery??null,supported:!p.unsupported,contactLocked:!p.unsupported&&Math.abs(before)<.12,collisionFreedom:p.unsupported?1:smooth((Math.abs(before)-.12)/.3),animationActive:!p.unsupported&&time>=p.start,mayEmitImpulse:false,officialBallUnchanged:true};}
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
 return heading+angle(a.intentHeading-heading)*weight;}
 orientUpperBody(actor,p,time){const a=this.action(p.key,time);if(!a){this.orientReception(actor,p);return;}const weight=smooth((time-a.plan.start+.25)/.25)*smooth((a.plan.end-time)/.25),up=new T.Vector3(0,1,0);
  for(const [name,axis,max]of [['spine_03',actor.intentAxis,.35],['Head',actor.headIntentAxis,.52]]){if(!axis)continue;const bone=actor.bones.get(name),world=bone.getWorldQuaternion(new T.Quaternion()),forward=axis.clone().applyQuaternion(world),turn=clamp(angle(a.intentHeading-Math.atan2(forward.x,forward.z)),-max,max)*weight,parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(up,turn)).multiply(world));actor.holder.updateMatrixWorld(true);}
  if(a.contactAt-time>.15)this.orientReception(actor,p);
 }
 orientReception(actor,p){const incoming=this.incoming;if(p.keeper||incoming?.receiver!==p.key||!actor.headIntentAxis||incoming.ball.y<=.35)return;const bone=actor.bones.get('Head'),position=bone.getWorldPosition(new T.Vector3()),delta=new T.Vector3(incoming.ball.x,incoming.ball.y,incoming.ball.z).sub(position),distance=Math.hypot(delta.x,delta.z);if(distance>25)return;const world=bone.getWorldQuaternion(new T.Quaternion()),forward=actor.headIntentAxis.clone().applyQuaternion(world),yaw=Math.atan2(forward.x,forward.z),pitch=Math.atan2(forward.y,Math.hypot(forward.x,forward.z)),target=clamp(Math.atan2(delta.y,Math.max(.1,distance)),-.25,.65),weight=smooth((25-distance)/15)*smooth((incoming.ball.y-.35)/.6),turn=clamp(target-pitch,-.45,.45)*weight,parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),-turn)).multiply(world));actor.holder.updateMatrixWorld(true);this.receptions.push({key:p.key,kind:'airborne-ball-tracking',pitchCorrection:turn,ballHeight:incoming.ball.y,delivery:incoming.delivery??null,provisional:true,changesBall:false});}
 inspect(){return[...this.current].map(([key,a])=>({key,id:a.plan.id,state:a.state,contactAt:a.contactAt,preparationSeconds:a.preparationSeconds,intentHeading:a.intentHeading,delivery:a.delivery,supported:a.supported,mayEmitImpulse:false,...this.metrics.get(key)}));}
 inspectReceptions(){return this.receptions;}
 begin(frame){this.current.clear();this.metrics.clear();this.receptions=[];const receiver=frame?.officialAction?.receiver;this.incoming=receiver?{receiver,player:frame.players.find(p=>p.key===receiver),ball:frame.ball,delivery:frame.officialAction.delivery}:null;}
 validate(actor,p,frame,capture){const a=this.action(p.key,frame.time);if(!a)return null;
 if(!actor.intentAxis){const bone=actor.bones.get('spine_03');actor.intentAxis=new T.Vector3(0,0,1).applyQuaternion(bone.getWorldQuaternion(new T.Quaternion()).invert())}
 const forward=actor.intentAxis.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion())),body=Math.atan2(forward.x,forward.z),error=Math.abs(angle(a.intentHeading-body)),gap=capture?.contactGap??null;
 const result={bodyHeading:body,bodyErrorDegrees:error*180/Math.PI,footGap:gap,contactReady:a.supported&&!!capture&&Math.abs(gap)<=.02&&error<=Math.PI/3,unsupportedPose:!a.supported||!capture||error>Math.PI/3,phase:a.state};this.metrics.set(p.key,result);return result;}
}
