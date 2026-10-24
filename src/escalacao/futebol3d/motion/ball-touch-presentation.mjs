import * as T from 'three';
import {nearest} from './nearest.mjs';
import {VisibleBallRoll} from './visible-ball-roll.mjs';

const R=.11;
/** Observe actual boot contacts and roll the same official ball. No positional
 * correction may pull a reception toward a foot. Official possession and
 * visible reach are separate facts; an unreachable ball stays unresolved. */
export class BallTouchPresentation{
 constructor(){this.reset()}
 reset(){this.roll=new VisibleBallRoll(R);this.previous=null;this.lastOwner=null;this.lastTouch=-Infinity;this.controlled=false;this.pendingContact=null;}
 sample(frame,actors,actions,{reset=false}={}){
  if(frame.restart||frame.placementReset||frame.ball.presentation){this.reset();return{ball:frame.ball,diagnostic:{phase:'official-presentation',offset:0,sourceBallUnchanged:true}};}
  const prior=this.previous,dt=prior?frame.time-prior.time:0;
  if(reset||dt<0||dt>.2)this.reset();
  const old=this.previous,raw=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),owner=actors.find(a=>a.key===frame.owner&&!a.keeper),active=owner&&frame.phase==='dominio'&&raw.y<.16;
  this.pendingContact=null;
  if(!active||this.lastOwner!==owner?.key)this.controlled=false;
  if(this.lastOwner!==owner?.key)this.lastTouch=-Infinity;
  let phase='free',side=null,gap=null,contact=false;
  const feet=owner?Object.fromEntries(['left','right'].map(s=>[s,owner.footTriangles(s)])):null;
  const sourceDistance=owner?Math.hypot(raw.x-owner.sourceAnchor.x,raw.z-owner.sourceAnchor.z):Infinity;
  if(active&&feet){
   const candidates=Object.entries(feet).map(([s,ts])=>({side:s,...nearest(raw,ts)})).sort((a,b)=>a.distance-b.distance),hit=candidates[0];side=hit.side;gap=hit.distance-R;
   // Ownership is an official decision, not proof that a visible foot has
   // reached the ball. Never attract a reception, even after a prior touch.
   if(gap>.28)this.controlled=false;
   phase=this.controlled?'between-touches':'awaiting-player';
   contact=gap>=-.003&&gap<=.016;
   this.pendingContact=contact?{controlled:this.controlled,lastTouch:this.lastTouch}:null;
   const firstContact=contact&&!this.controlled,acquiredContact=old?.side===side&&old.gap>.025;
   if(contact)this.controlled=true;
   if(contact&&frame.time-this.lastTouch>.22&&(acquiredContact||firstContact)){this.lastTouch=frame.time;phase=firstContact?'first-touch':'touch';}
  }
  // Rotation follows the visible displacement too. Applying only source spin
  // to a retimed visible ball makes the panels slide over the ground.
  const rotation=this.roll.sample(frame.time,raw,frame.ball.rotation);
  this.previous={time:frame.time,side,gap};this.lastOwner=owner?.key??null;
  return{ball:{...frame.ball,rotation},diagnostic:{phase,owner:owner?.key??null,side,gap,contact,hasVisualControl:this.controlled,offset:0,offsetVelocity:0,sourceDistance,provisional:true,sourceBallUnchanged:true,changesPossession:false,changesEvents:false,requiresPlayerApproach:!!active&&!this.controlled,ballAttractionDisabled:true}};
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
