import * as T from 'three';import {solveLegContact} from './contact-ik.mjs';import {nearest} from './nearest.mjs';
const smooth=v=>{v=T.MathUtils.clamp(v,0,1);return v*v*(3-2*v)};
/** A short, bounded stance correction on top of an acquired kick. The anchor
 * comes from the actual contact pose, not a fabricated leg cycle. */
export function preserveSupportFoot(actor,plan,time,ball){
 if(!plan.supportPlant||Math.abs(time-plan.time)>.09||plan.supportPlant.floor>.025)return null;
 const weight=1-smooth((Math.abs(time-plan.time)-.035)/.055),side=plan.supportPlant.side,suffix=side==='left'?'l':'r',names=['thigh_','calf_','foot_'].map(n=>n+suffix),bones=names.map(n=>actor.bones.get(n)),saved=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),ankle=bones[2],target=new T.Vector3().fromArray(plan.supportPlant.position),ik=solveLegContact(actor,side,target,{weight:weight*smooth((.08-target.distanceTo(ankle.getWorldPosition(new T.Vector3())))/.05),maxCorrection:.08,maxAngle:.35});
 const current=ankle.getWorldQuaternion(new T.Quaternion()),goal=new T.Quaternion().fromArray(plan.supportPlant.rotation),rotation=current.clone().slerp(goal,weight*smooth((.08-target.distanceTo(ankle.getWorldPosition(new T.Vector3())))/.05));if(current.angleTo(rotation)>.35)rotation.copy(current).slerp(goal,.35/current.angleTo(goal));ankle.quaternion.copy(ankle.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(rotation));actor.holder.updateMatrixWorld(true);
 const points=actor.footTriangles(side).flatMap(t=>[t.a,t.b,t.c]),floor=Math.min(...points.map(p=>p.y)),gap=nearest(ball,[...actor.footTriangles('left'),...actor.footTriangles('right')]).distance-.11;
 if(floor<-.00001||gap<-.003){bones.forEach((b,i)=>{b.position.copy(saved[i].p);b.quaternion.copy(saved[i].q)});actor.holder.updateMatrixWorld(true);return{applied:false,reason:'floor-or-ball-guard',side,weight}}
 return{applied:ik.applied,side,weight,limited:ik.limited,error:ankle.getWorldPosition(new T.Vector3()).distanceTo(target),floor,maxCorrection:.08};
}
