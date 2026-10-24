// Reuses authored motion. No hand-written limb cycle or altered skeleton.
import * as T from 'three';
export function retargetFromReference(target,source,clip,{name=clip.name,fps=60}={}){
 const targetBones=target.bones,sourceBones=source.bones;
 const mapped=[...targetBones].filter(([name])=>sourceBones.has(name));
 const targetReference=new Map(mapped.map(([name,b])=>[name,{p:b.position.clone(),q:b.quaternion.clone(),world:b.getWorldQuaternion(new T.Quaternion()),worldPosition:b.getWorldPosition(new T.Vector3())}]));
 const sourceReference=new Map(mapped.map(([name])=>{const b=sourceBones.get(name);return[name,{p:b.position.clone(),world:b.getWorldQuaternion(new T.Quaternion()),worldPosition:b.getWorldPosition(new T.Vector3())}]}));
 const saved=[];source.root.traverse(b=>saved.push({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const sourceMixer=new T.AnimationMixer(source.root),action=sourceMixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const descendants=[...mapped].sort(([,a],[,b])=>{const depth=n=>{let d=0;while(n.parent){n=n.parent;d++}return d};return depth(a)-depth(b)});
 const rotations=new Map(mapped.map(([name])=>[name,[]])),times=[],positions=[],footPositions={foot_l:[],foot_r:[]};
 const legLength=bones=>{const p=['thigh_l','calf_l','foot_l'].map(n=>bones.get(n).getWorldPosition(new T.Vector3()));return p[0].distanceTo(p[1])+p[1].distanceTo(p[2])};
 const ratio=legLength(targetBones)/legLength(sourceBones),frames=Math.ceil(clip.duration*fps);
 const targetHip=targetBones.get('pelvis'),sourceHip=sourceBones.get('pelvis');
 const shinLength=Object.fromEntries(['l','r'].map(side=>[side,targetBones.get('calf_'+side).getWorldPosition(new T.Vector3()).distanceTo(targetBones.get('foot_'+side).getWorldPosition(new T.Vector3()))]));
 for(let i=0;i<=frames;i++){
  const time=Math.min(clip.duration,i/fps);times.push(time);action.time=time;sourceMixer.update(0);source.holder.updateMatrixWorld(true);
  for(const [name,bone]of descendants){
   const desired=sourceBones.get(name).getWorldQuaternion(new T.Quaternion()).multiply(sourceReference.get(name).world.clone().invert()).multiply(targetReference.get(name).world);
   bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(desired).normalize());target.holder.updateMatrixWorld(true);bone.quaternion.toArray(rotations.get(name),i*4);
  }
  const reference=targetReference.get('pelvis'),from=sourceReference.get('pelvis');
  // Rig-local Y is not necessarily world up. Convert the captured vertical
  // displacement through the original target parent's complete transform.
  const goal=reference.worldPosition.clone();goal.y+=(sourceHip.getWorldPosition(new T.Vector3()).y-from.worldPosition.y)*ratio;targetHip.position.copy(targetHip.parent.worldToLocal(goal));positions.push(...targetHip.position);target.holder.updateMatrixWorld(true);
  // Civil feet are authored IK controls parented to the rig root, not the
  // calf. Retarget their translation from the captured shin direction; keep
  // the original hierarchy and skin weights unchanged.
  for(const side of ['l','r']){const shin=sourceBones.get('calf_'+side).getWorldPosition(new T.Vector3()),ankle=sourceBones.get('foot_'+side).getWorldPosition(new T.Vector3()),foot=targetBones.get('foot_'+side),goal=targetBones.get('calf_'+side).getWorldPosition(new T.Vector3()).add(ankle.sub(shin).normalize().multiplyScalar(shinLength[side]));foot.position.copy(foot.parent.worldToLocal(goal));foot.position.toArray(footPositions['foot_'+side],i*3)}
  target.holder.updateMatrixWorld(true);
 }
 const tracks=[...rotations].map(([name,values])=>new T.QuaternionKeyframeTrack(name+'.quaternion',times,values));tracks.push(new T.VectorKeyframeTrack('pelvis.position',times,positions));for(const [name,values]of Object.entries(footPositions))tracks.push(new T.VectorKeyframeTrack(name+'.position',times,values));
 sourceMixer.stopAllAction();sourceMixer.uncacheRoot(source.root);for(const s of saved){s.b.position.copy(s.p);s.b.quaternion.copy(s.q);s.b.scale.copy(s.s)}source.holder.updateMatrixWorld(true);
 for(const [name,b]of mapped){const r=targetReference.get(name);b.position.copy(r.p);b.quaternion.copy(r.q)}targetHip.position.copy(targetReference.get('pelvis').p);target.holder.updateMatrixWorld(true);
 // Native civilian gait animates the ancestor Body control as well. The
 // captured pose was solved in the reference ancestor frame, so include that
 // frame explicitly; do not let an unrelated run cycle move the capture.
 for(const [boneName,bone]of targetBones)if(!sourceBones.has(boneName)&&!boneName.startsWith('PoleTarget')){tracks.push(new T.QuaternionKeyframeTrack(boneName+'.quaternion',[0,clip.duration],[...bone.quaternion,...bone.quaternion]));tracks.push(new T.VectorKeyframeTrack(boneName+'.position',[0,clip.duration],[...bone.position,...bone.position]))}
 return new T.AnimationClip(name,clip.duration,tracks).optimize();
}
