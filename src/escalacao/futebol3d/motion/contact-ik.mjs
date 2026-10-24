// Generated from scripts/animation-lab/contact-ik.mjs. Repackage after editing source.
import * as T from 'three';

// Small contact correction over an imported pose. Never supplies a gait or kick.
// Analytic two-bone IK preserves the captured knee plane and ankle orientation.
export function solveLimbContact(actor,names,target,{weight=1,maxCorrection=.10,maxAngle=.35}={}){
 const [hip,knee,ankle]=names.map(name=>actor.bones.get(name));
 actor.holder.updateMatrixWorld(true);
 const a=hip.getWorldPosition(new T.Vector3()),b=knee.getWorldPosition(new T.Vector3()),c=ankle.getWorldPosition(new T.Vector3());
 const ankleQ=ankle.getWorldQuaternion(new T.Quaternion()),delta=target.clone().sub(c);
 const independent=ankle.parent!==knee,original=independent?[hip,knee,ankle].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone()})):null;
 const requested=delta.length();if(delta.length()>maxCorrection)delta.setLength(maxCorrection);
 const goal=c.clone().addScaledVector(delta,T.MathUtils.clamp(weight,0,1));
 const ab=a.distanceTo(b),bc=b.distanceTo(c),axis=goal.clone().sub(a);let distance=axis.length();
 if(!distance||!ab||!bc)return {applied:false,reason:'degenerate-chain'};
 axis.normalize();distance=T.MathUtils.clamp(distance,Math.abs(ab-bc)+1e-5,ab+bc-1e-5);
 const x=(ab*ab-bc*bc+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,ab*ab-x*x));
 const bend=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis));
 if(bend.lengthSq()<1e-10){bend.set(0,0,1).applyQuaternion(hip.getWorldQuaternion(new T.Quaternion()));bend.addScaledVector(axis,-bend.dot(axis));if(bend.lengthSq()<1e-10){bend.set(1,0,0);bend.addScaledVector(axis,-bend.dot(axis));}}
 bend.normalize();const kneeGoal=a.clone().addScaledVector(axis,x).addScaledVector(bend,height);
 function aim(bone,from,to){
  const rotation=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
  const angle=rotation.angleTo(new T.Quaternion());if(angle>maxAngle)rotation.slerp(new T.Quaternion(),1-maxAngle/angle);
  const world=bone.getWorldQuaternion(new T.Quaternion()).premultiply(rotation),parent=bone.parent.getWorldQuaternion(new T.Quaternion());
  bone.quaternion.copy(parent.invert().multiply(world));actor.holder.updateMatrixWorld(true);
 }
 aim(hip,b.clone().sub(a),kneeGoal.clone().sub(a));
 const kb=knee.getWorldPosition(new T.Vector3()),kc=ankle.getWorldPosition(new T.Vector3());
 aim(knee,kc.sub(kb),goal.clone().sub(kb));
 // The civilian rig keeps authored feet as root-level IK controls. Drive
 // that control explicitly, without reparenting joints or stretching a shin.
 if(independent){const pivot=knee.getWorldPosition(new T.Vector3()),end=pivot.clone().add(goal.clone().sub(pivot).normalize().multiplyScalar(bc));if(end.distanceTo(c)>maxCorrection+1e-6){for(const s of original){s.b.position.copy(s.p);s.b.quaternion.copy(s.q)}actor.holder.updateMatrixWorld(true);return {applied:false,reason:'independent-foot-reach-budget'}}ankle.position.copy(ankle.parent.worldToLocal(end));}
 ankle.quaternion.copy(ankle.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(ankleQ));
 actor.holder.updateMatrixWorld(true);actor.root.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
 return {applied:true,requested,limited:requested>maxCorrection,error:ankle.getWorldPosition(new T.Vector3()).distanceTo(goal),maxCorrection,maxAngle};
}

export function solveLegContact(actor,side,target,options){const s=side==='left'?'l':'r';return solveLimbContact(actor,['thigh_'+s,'calf_'+s,'foot_'+s],target,options)}
export function solveArmContact(actor,side,target,options){const s=side==='left'?'l':'r';return solveLimbContact(actor,['upperarm_'+s,'lowerarm_'+s,'hand_'+s],target,options)}
