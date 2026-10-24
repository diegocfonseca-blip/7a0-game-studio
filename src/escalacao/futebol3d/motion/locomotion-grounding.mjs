import * as T from 'three';
import {solveLegContact} from './contact-ik.mjs';
import {nearest} from './nearest.mjs';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
const up=new T.Vector3(0,1,0);
function probe(actor,side){const ts=actor.footTriangles(side),points=ts.flatMap(t=>[t.a,t.b,t.c]),ankle=actor.bones.get(side==='left'?'foot_l':'foot_r');return{floor:Math.min(...points.map(p=>p.y)),top:Math.max(...points.map(p=>p.y)),position:ankle.getWorldPosition(new T.Vector3()),rotation:ankle.getWorldQuaternion(new T.Quaternion())};}
function snapshot(actor){return [...actor.bones].map(([name,b])=>({name,p:b.position.clone(),q:b.quaternion.clone()}));}
function restore(actor,pose){for(const s of pose){const b=actor.bones.get(s.name);b.position.copy(s.p);b.quaternion.copy(s.q)}actor.holder.updateMatrixWorld(true);}
function rotateWorld(bone,axis,radians){const world=bone.getWorldQuaternion(new T.Quaternion()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(new T.Quaternion().setFromAxisAngle(axis,radians)).multiply(world));bone.updateWorldMatrix(false,true);}
/** Residual stance and inertia over imported poses. Never authors a cycle,
 * moves an official player/ball, stretches a limb, or changes bind/weights. */
export class LocomotionGrounding{
 constructor(){this.reset()}
 reset(){this.feet={};this.previous=null;this.velocity=new T.Vector3();this.acceleration=new T.Vector3();this.lean={forward:0,side:0};}
 apply(actor,p,frame,capture,dt,{reset=false}={}){
  if(reset||dt<0||dt>.12)this.reset();
  const time=frame.time,source=actor.sourceAnchor??{x:p.mx,z:p.mz},point=new T.Vector3(source.x,0,source.z),raw=this.previous?(dt>0?point.clone().sub(this.previous.point).divideScalar(dt):this.velocity.clone()):new T.Vector3();
  if(this.previous&&dt>0){const acceleration=raw.clone().sub(this.velocity).divideScalar(dt);acceleration.clampLength(0,18);this.acceleration.lerp(acceleration,1-Math.exp(-dt/.16));}
  this.velocity.copy(raw);this.previous={point};
  const forward=new T.Vector3(Math.sin(actor.holder.rotation.y),0,Math.cos(actor.holder.rotation.y)),right=forward.clone().cross(up),available=1-smooth((capture?.weight??0)/.35),blend=dt>0?1-Math.exp(-dt/.14):0;
  const wantedForward=T.MathUtils.clamp(this.acceleration.dot(forward)*.006+Math.min(raw.length(),7)*.004,-.07,.09)*available,wantedSide=T.MathUtils.clamp(this.acceleration.dot(right)*.004,-.065,.065)*available;
  this.lean.forward=T.MathUtils.lerp(this.lean.forward,wantedForward,blend);this.lean.side=T.MathUtils.lerp(this.lean.side,wantedSide,blend);
  // Fade the additive layer completely at reviewed contacts. Acquired action
  // channels and their measured foot/ball fit keep priority.
  const tiltForward=this.lean.forward*available,tiltSide=this.lean.side*available,before=snapshot(actor),ankles=['left','right'].map(side=>probe(actor,side));
  if(Math.abs(tiltForward)+Math.abs(tiltSide)>1e-5){
   for(const [name,share]of [['pelvis',.22],['spine_03',.78]]){rotateWorld(actor.bones.get(name),right,-tiltForward*share);rotateWorld(actor.bones.get(name),forward,tiltSide*share)}
   for(let i=0;i<2;i++)solveLegContact(actor,i?'right':'left',ankles[i].position,{maxCorrection:.035,maxAngle:.12});
   const after=['left','right'].map(side=>probe(actor,side));if(after.some((a,i)=>a.floor<Math.min(0,ankles[i].floor)-1e-5||a.position.distanceTo(ankles[i].position)>.005))restore(actor,before);
  }
  const contacts=[];
  for(const side of ['left','right']){
   const native=probe(actor,side),prior=this.feet[side],ball=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z),nearBall=native.position.distanceTo(ball)<.6;
   const vertical=prior&&dt>0?(native.position.y-prior.nativeY)/dt:0,angular=prior&&dt>0?native.rotation.angleTo(prior.nativeRotation)/dt:0;
   const support=dt===0&&prior?prior.support:native.floor<.014&&native.top-native.floor<.13&&Math.abs(vertical)<.45&&angular<5;
   const state=prior??{age:0,released:false,anchor:null};
   if(!support||nearBall||(capture?.weight??0)>.12){state.anchor=null;state.age=0;state.released=false;}
   else if(!state.anchor&&!state.released){state.anchor=native.position.clone();state.rotation=native.rotation.clone();state.age=0;}
   let result={side,phase:support?'support':'swing',applied:false,floor:native.floor,nearBall};
   if(state.anchor){
    state.age+=dt;const distance=state.anchor.distanceTo(native.position),reachWeight=1-smooth((distance-.055)/.025),weight=smooth(state.age/.035)*reachWeight;
    if(distance>.08){state.anchor=null;state.released=true;result.reason='reach-budget';}
    else if(weight>1e-5){
     const saved=snapshot(actor),ik=solveLegContact(actor,side,state.anchor,{weight,maxCorrection:.08,maxAngle:.28}),foot=actor.bones.get(side==='left'?'foot_l':'foot_r'),current=foot.getWorldQuaternion(new T.Quaternion()),goal=current.clone().slerp(state.rotation,weight),angle=current.angleTo(goal);if(angle>.20)goal.copy(current).rotateTowards(goal,.20);foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(goal));actor.holder.updateMatrixWorld(true);
     const final=probe(actor,side),gap=nearBall?nearest(ball,actor.footTriangles(side)).distance-.11:Infinity;
     if(final.floor<-.00001||gap<-.003){restore(actor,saved);result.reason='floor-or-ball-guard';}
     else result={...result,applied:ik.applied,weight,limited:ik.limited,anchor:state.anchor.toArray(),error:final.position.distanceTo(state.anchor),floor:final.floor,correction:final.position.distanceTo(native.position)};
    }
   }
   Object.assign(state,{support,nativeY:native.position.y,nativeRotation:native.rotation.clone()});this.feet[side]=state;contacts.push(result);
  }
  return{contacts,lean:{forward:tiltForward,side:tiltSide},maxReach:.08,maxLean:.09,sourceUnchanged:true};
 }
}
