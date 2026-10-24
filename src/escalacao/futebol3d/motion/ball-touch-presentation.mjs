import * as T from 'three';
import {nearest} from './nearest.mjs';

const R=.11,MAX_OFFSET=.32;
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
/** A bounded presentation of the SAME owned ball. Native imported boots supply
 * the touch, not a sine wave or another possession/physics simulation. Free
 * passes, shots, official contact times and all source coordinates are intact.
 * This is a provisional gait adaptation, not an acquired dribbling capture. */
export class BallTouchPresentation{
 constructor(){this.reset()}
 reset(){this.offset=new T.Vector3();this.extraRoll=new T.Quaternion();this.previous=null;this.touch=null;this.releaseUntil=-Infinity;this.lastOwner=null;this.lastTouch=-Infinity;this.receivedAt=-Infinity;this.controlled=false;this.pendingContact=null;}
 sample(frame,actors,actions,{reset=false}={}){
  if(frame.restart||frame.placementReset||frame.ball.presentation){this.reset();return{ball:frame.ball,diagnostic:{phase:'official-presentation',offset:0,sourceBallUnchanged:true}};}
  const prior=this.previous,dt=prior?frame.time-prior.time:0;
  if(reset||dt<0||dt>.2)this.reset();
  const old=this.previous,step=old?Math.max(0,frame.time-old.time):0,raw=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),owner=actors.find(a=>a.key===frame.owner&&!a.keeper),active=owner&&frame.phase==='dominio'&&raw.y<.16&&!frame.placementReset&&!frame.ball.presentation;
  if(!owner)this.controlled=false;
  let desired=new T.Vector3(),phase='free',side=null,gap=null,contact=false;
  const feet=owner?Object.fromEntries(['left','right'].map(s=>[s,owner.footTriangles(s)])):null;
  const sourceDistance=owner?Math.hypot(raw.x-owner.sourceAnchor.x,raw.z-owner.sourceAnchor.z):Infinity;
  const localSchedule=actions.action(owner?.key??this.lastOwner,frame.time),nextRelease=actions.nextRelease?.(frame.time),schedule=localSchedule??(nextRelease!==null&&nextRelease!==undefined?{contactAt:nextRelease}:null);
  // Return to the exact official contact before the strike layer takes over.
  const release=schedule?smooth((schedule.contactAt-frame.time-.05)/.30):1;
  if(active&&sourceDistance<1.4&&feet){
   const candidates=Object.entries(feet).map(([s,ts])=>({side:s,...nearest(raw,ts)})).sort((a,b)=>a.distance-b.distance),hit=candidates[0];side=hit.side;gap=hit.distance-R;
   const relative=old&&old.side===side&&this.lastOwner===owner.key?hit.surface.clone().sub(old.surface??hit.surface).sub(raw.clone().sub(old.raw)).dot(raw.clone().sub(hit.surface).normalize())/Math.max(step,1e-6):0;
   const forward=new T.Vector3(Math.sin(owner.lastHeading),0,Math.cos(owner.lastHeading));
   if(this.lastOwner!==owner.key){this.touch=null;this.releaseUntil=-Infinity;this.lastTouch=-Infinity;this.receivedAt=frame.time;this.controlled=false;}
   if(frame.time<this.releaseUntil){desired.copy(forward).multiplyScalar(.08*smooth((this.releaseUntil-frame.time)/.16));phase='roll-after-touch';}
   else if(gap>.001&&gap<.40&&(relative>.08||this.touch?.side===side||!this.controlled&&frame.time-this.receivedAt<.28&&sourceDistance<1.15)){
    const normal=raw.clone().sub(hit.surface).normalize(),target=hit.surface.clone().addScaledVector(normal,R+.002);target.y=raw.y;
    desired.copy(target).sub(raw).setY(0).clampLength(0,MAX_OFFSET);this.touch={side};phase='approach-boot';
   }else if(sourceDistance<1.05&&owner.presentationSpeed<1.2&&gap<.4){
    const normal=raw.clone().sub(hit.surface).normalize();desired.copy(hit.surface).addScaledVector(normal,R+.004).sub(raw).setY(0).clampLength(0,MAX_OFFSET);phase='settle';
   }
   desired.multiplyScalar(release);
   this.nextSurface=hit.surface.clone();
  }else{this.touch=null;this.nextSurface=null;}
  const before=this.offset.clone();
  // Bounded correction speed; never snap an arriving ball to the owner.
  const delta=desired.sub(this.offset),alpha=step>0?1-Math.exp(-step/.045):0;delta.multiplyScalar(alpha).clampLength(0,1.8*step);this.offset.add(delta);
  if(schedule)this.offset.clampLength(0,MAX_OFFSET*release);
  // The contact envelope reaches zero continuously, before the source impulse.
  if(schedule&&schedule.contactAt-frame.time<=.05)this.offset.set(0,0,0);
  if(this.offset.length()<1e-5)this.offset.set(0,0,0);
  let position=raw.clone().add(this.offset);
  this.pendingContact=null;
  if(active&&feet){const hit=nearest(position,[...feet.left,...feet.right]);gap=hit.distance-R;contact=Math.abs(gap)<=.016;
   if(contact)this.pendingContact={controlled:this.controlled,lastTouch:this.lastTouch,releaseUntil:this.releaseUntil};
   const firstContact=contact&&!this.controlled,acquiredContact=old?.side===side&&old.gap>.025;
   if(contact)this.controlled=true;
   if(contact&&frame.time-this.lastTouch>.22&&(phase==='approach-boot'||acquiredContact||firstContact)&&release>.95){this.lastTouch=frame.time;this.releaseUntil=frame.time+(firstContact?.10:.16);this.touch=null;phase=firstContact?'first-touch':'touch';}
  }
  // Rotation follows the visible displacement too. Applying only source spin
  // to a retimed visible ball makes the panels slide over the ground.
  const extra=this.offset.clone().sub(before),axis=new T.Vector3(extra.z,0,-extra.x),angle=axis.length()/R;
  if(angle>1e-10&&raw.y<R+.02){axis.normalize();this.extraRoll.premultiply(new T.Quaternion().setFromAxisAngle(axis,angle)).normalize();}
  const rotation=new T.Quaternion().fromArray(frame.ball.rotation??[0,0,0,1]);rotation.premultiply(this.extraRoll);
  this.previous={time:frame.time,raw,surface:this.nextSurface,side,gap};this.lastOwner=owner?.key??null;
  const changed=this.offset.lengthSq()>0||this.extraRoll.angleTo(new T.Quaternion())>1e-8;
  return{ball:changed?{...frame.ball,presentation:{x:position.x,y:position.y,z:position.z},rotation:rotation.toArray()}:frame.ball,diagnostic:{phase,owner:owner?.key??null,side,gap,contact,hasVisualControl:this.controlled,offset:this.offset.length(),offsetVelocity:step?this.offset.distanceTo(before)/step:0,sourceDistance,provisional:true,sourceBallUnchanged:true,changesPossession:false,changesEvents:false}};
 }
 confirm(ball,actors,diagnostic){
  if(!diagnostic?.owner)return;
  const actor=actors.find(a=>a.key===diagnostic.owner);if(!actor)return;
  const p=ball.presentation??ball,point=new T.Vector3(p.x,p.y,p.z),gap=nearest(point,[...actor.footTriangles('left'),...actor.footTriangles('right')]).distance-R,contact=gap>=-.003&&gap<=.016;
  diagnostic.gap=gap;diagnostic.contact=contact;
  if(this.pendingContact&&!contact){Object.assign(this,this.pendingContact);if(['touch','first-touch'].includes(diagnostic.phase))diagnostic.phase='awaiting-boot';}
  diagnostic.hasVisualControl=this.controlled;
  if(this.previous)this.previous.gap=gap;
  this.pendingContact=null;
 }
}
