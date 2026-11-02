import * as T from 'three';
import {solveLimbContact} from '../motion/contact-ik.mjs';
/** Small residual IK over a captured collection. The free ball is read-only.
 * Never reaches across a bad pass or substitutes a collection animation. */
export function reachCapturedHandContact(actor,ball,{maxCorrection=.06,maxAngle=.28}={}){
 const point=new T.Vector3(ball.x,ball.y,ball.z),candidates=['left','right'].map(side=>({side,...actor.surface.probe(point,side+'Hand')})).sort((a,b)=>a.gap-b.gap),initial=candidates[0];
 if(initial.gap<=.001||initial.gap>.08)return{applied:false,gap:initial.gap};
 const prefix='mixamorig'+(initial.side==='left'?'Left':'Right'),names=['Arm','ForeArm','Hand'].map(n=>prefix+n),bones=names.map(n=>actor.bones.get(n));if(bones.some(b=>!b))return{applied:false,reason:'missing-chain'};
 const saved=bones.map(b=>b.quaternion.clone()),start=bones[2].getWorldPosition(new T.Vector3());let best=initial.gap;
 for(let i=0;i<3;i++){
  const probe=actor.surface.probe(point,initial.side+'Hand');if(probe.gap<.002)break;
  const wrist=bones[2].getWorldPosition(new T.Vector3()),target=wrist.clone().addScaledVector(point.clone().sub(probe.surface).normalize(),Math.min(probe.gap+.001,maxCorrection));
  const delta=target.clone().sub(start);if(delta.length()>maxCorrection)target.copy(start).add(delta.setLength(maxCorrection));
  const previous=bones.map(b=>b.quaternion.clone());solveLimbContact(actor,names,target,{maxCorrection,maxAngle});const next=actor.surface.probe(point,initial.side+'Hand').gap;
  if(next<-.025||next>=best){bones.forEach((b,j)=>b.quaternion.copy(previous[j]));actor.holder.updateMatrixWorld(true);break}best=next;
 }
 const correction=bones[2].getWorldPosition(new T.Vector3()).distanceTo(start);
 if(correction>maxCorrection+.0001){bones.forEach((b,i)=>b.quaternion.copy(saved[i]));actor.holder.updateMatrixWorld(true);return{applied:false,gap:initial.gap,reason:'budget'}}
 return{applied:best<initial.gap,gap:best,rawGap:initial.gap,correction};
}
