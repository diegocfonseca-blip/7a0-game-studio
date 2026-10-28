import * as T from 'three';
import {solveLimbContact} from './contact-ik.mjs';

const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
/** Residual foot planting on the supplied Mixamo rig. The capture supplies the
 * pose/stride; this layer only removes small support slip. Never stretches a
 * leg, changes a bind pose, moves the root, or pulls the ball. */
export class MapFootPlant{
 constructor(){this.reset()}
 reset(){this.feet={};this.last=null}
 apply(actor,time,{reset=false,excluded=[],airborne=false}={}){
  const dt=this.last===null?0:time-this.last;
  if(reset||dt<0||dt>.1)this.reset();this.last=time;
  const bounds=actor.surface.footBounds(),result=[];
  for(const side of ['left','right']){
   const prefix='mixamorig'+(side==='left'?'Left':'Right'),names=['UpLeg','Leg','Foot'].map(n=>prefix+n),bones=names.map(n=>actor.bones.get(n));
   const ankle=bones[2],point=ankle.getWorldPosition(new T.Vector3()),q=ankle.getWorldQuaternion(new T.Quaternion()),old=this.feet[side];
   const vertical=old&&dt>0?(point.y-old.y)/dt:0,angular=old&&dt>0?q.angleTo(old.q)/dt:0;
   const support=!airborne&&!excluded.includes(side)&&bounds[side].floor<.025&&bounds[side].top-bounds[side].floor<.18&&Math.abs(vertical)<.5&&angular<6;
   const state=old??{anchor:null,age:0,released:false};
   if(!support){state.anchor=null;state.age=0;state.released=false}
   else if(!state.anchor&&!state.released){state.anchor=point.clone();state.age=0}
   let info={side,support,applied:false,floor:bounds[side].floor,correction:0};
   if(state.anchor){
    state.age+=Math.max(0,dt);const distance=point.distanceTo(state.anchor),weight=smooth(state.age/.04)*(1-smooth((distance-.07)/.05));
    if(distance>.12){state.anchor=null;state.released=true}
    else if(weight>1e-5){
     const saved=bones.map(b=>b.quaternion.clone()),target=point.clone().lerp(state.anchor,weight);
     const ik=solveLimbContact(actor,names,target,{maxCorrection:.10,maxAngle:.28}),final=ankle.getWorldPosition(new T.Vector3()),floor=actor.surface.footBounds()[side].floor;
     if(floor<Math.min(.001,bounds[side].floor)-.001||final.distanceTo(point)>.101){bones.forEach((b,i)=>b.quaternion.copy(saved[i]));actor.holder.updateMatrixWorld(true)}
     else info={...info,applied:ik.applied,correction:final.distanceTo(point),rawError:distance,error:final.distanceTo(state.anchor),anchor:state.anchor.toArray(),floor};
    }
   }
   Object.assign(state,{y:point.y,q});this.feet[side]=state;result.push(info);
  }
  return result;
 }
}
