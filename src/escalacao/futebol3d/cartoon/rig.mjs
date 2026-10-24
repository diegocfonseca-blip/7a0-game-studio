import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export const CIVIL_TO_FOOTBALL=Object.freeze({Hips:'pelvis',Abdomen:'spine_01',Torso:'spine_03',Neck:'neck_01',Head:'Head',ShoulderL:'clavicle_l',UpperArmL:'upperarm_l',LowerArmL:'lowerarm_l',FistL:'hand_l',ShoulderR:'clavicle_r',UpperArmR:'upperarm_r',LowerArmR:'lowerarm_r',FistR:'hand_r',UpperLegL:'thigh_l',LowerLegL:'calf_l',FootL:'foot_l',UpperLegR:'thigh_r',LowerLegR:'calf_r',FootR:'foot_r'});
export function renameCivilClip(clip,name=clip.name){return new T.AnimationClip(name,clip.duration,clip.tracks.map(track=>{const copy=track.clone(),dot=copy.name.lastIndexOf('.'),bone=copy.name.slice(0,dot);copy.name=(CIVIL_TO_FOOTBALL[bone]??bone)+copy.name.slice(dot);return copy}));}
/** Aliases only: original vertices, body proportions, joints and skin weights.
 * A wrapper converts the authored civilian to metres, outside animated nodes. */
export function createCartoonRig(gltf,{height=1.78}={}){
 const root=clone(gltf.scene),meshes=[];root.traverse(n=>{if(n.isSkinnedMesh)meshes.push(n)});
 const nativeMixer=new T.AnimationMixer(root),idle=gltf.animations.find(c=>c.name==='Idle');if(!idle)throw Error('Civil sem Idle original');
 nativeMixer.clipAction(idle).play();nativeMixer.update(0);root.updateMatrixWorld(true);
 const reference=[];root.traverse(node=>reference.push({node,p:node.position.clone(),q:node.quaternion.clone(),s:node.scale.clone()}));
 const box=new T.Box3().setFromObject(root,true),sourceHeight=box.getSize(new T.Vector3()).y;
 nativeMixer.stopAllAction();nativeMixer.uncacheRoot(root);for(const r of reference){r.node.position.copy(r.p);r.node.quaternion.copy(r.q);r.node.scale.copy(r.s)}
 const bones=new Map();for(const bone of meshes[0].skeleton.bones){bone.name=CIVIL_TO_FOOTBALL[bone.name]??bone.name;bones.set(bone.name,bone)}
 const holder=new T.Group();holder.name='football-civil-style';holder.add(root);holder.scale.setScalar(height/sourceHeight);holder.updateMatrixWorld(true);
 const pelvis=bones.get('pelvis'),rest=pelvis.position.clone();
 return {root,holder,meshes,bones,pelvis,rest,mixer:new T.AnimationMixer(root),actions:new Map(),sourceHeight,height,reference,style:'civil-cartoon'};
}
