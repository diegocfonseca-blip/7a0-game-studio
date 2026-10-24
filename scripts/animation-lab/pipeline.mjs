import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {BVHLoader} from 'three/addons/loaders/BVHLoader.js';
import {retargetClip} from 'three/addons/utils/SkeletonUtils.js';
import {assertCommercialLicense} from './license-policy.mjs';

export const CMU_MAP={pelvis:'Hips',spine_01:'LowerBack',spine_02:'Spine',spine_03:'Spine1',neck_01:'Neck1',Head:'Head',
  clavicle_l:'LeftShoulder',upperarm_l:'LeftArm',lowerarm_l:'LeftForeArm',hand_l:'LeftHand',
  clavicle_r:'RightShoulder',upperarm_r:'RightArm',lowerarm_r:'RightForeArm',hand_r:'RightHand',
  thigh_l:'LeftUpLeg',calf_l:'LeftLeg',foot_l:'LeftFoot',ball_l:'LeftToeBase',thigh_r:'RightUpLeg',calf_r:'RightLeg',foot_r:'RightFoot',ball_r:'RightToeBase'};
const MIXAMO_MAP={...CMU_MAP,spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck'};

export async function parseSource(input,format,profile){
  let root,skeleton,clips;
  if(format==='bvh'){
    const parsed=new BVHLoader().parse(typeof input==='string'?input:new TextDecoder().decode(input));
    skeleton=parsed.skeleton;root=skeleton.bones[0];clips=[parsed.clip];
  }else if(format==='glb'||format==='gltf'){
    const parsed=await new GLTFLoader().parseAsync(input,'');root=parsed.scene;clips=parsed.animations;
  }else if(format==='fbx'){
    root=new FBXLoader().parse(input,'');clips=root.animations;
  }else throw Error('Formato não suportado: '+format);
  if(!skeleton){let skin;root.traverse(n=>{if(n.isSkinnedMesh&&!skin)skin=n;});
    if(skin)skeleton=skin.skeleton;else{const bones=[];root.traverse(n=>{if(n.isBone)bones.push(n);});skeleton=new T.Skeleton(bones);}}
  if(!skeleton.bones.length||!clips?.length)throw Error('Arquivo sem esqueleto e clips de animação utilizáveis');
  root.updateMatrixWorld(true);
  return {root,skeleton,clips,profile,format};
}

// Produces a reusable target-space clip, never rotates a human limb by a
// hand-written action formula. Reference-pose offsets account for rig axes.
export function retargetSource(target,root,source,{key,clipName,anchor=.02,referenceFrame=false,fps=60,origin,license}){
  if(!origin)throw Error('Origem e permissão comercial obrigatórias');assertCommercialLicense(license);
  const clip=clipName?source.clips.find(c=>c.name===clipName):source.clips[0];
  if(!clip)throw Error('Clip não encontrado no arquivo: '+clipName);
  target.skeleton.pose();root.updateMatrixWorld(true);
  const targetBones=new Map(target.skeleton.bones.map(b=>[b.name,b]));
  const normalize=name=>name.replace(/^mixamorig[:_]?/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
  const sourceByName=new Map(source.skeleton.bones.map(b=>[normalize(b.name),b]));
  const requested=source.profile==='quaternius'?Object.fromEntries([...targetBones.keys()].map(n=>[n,n])):source.profile==='mixamo'?MIXAMO_MAP:source.profile==='cmu'?CMU_MAP:null;
  if(!requested)throw Error('Perfil de rig não reconhecido: '+source.profile);
  const names={};
  for(const[targetName,sourceName]of Object.entries(requested)){
    const bone=sourceByName.get(normalize(sourceName));if(!bone||!targetBones.has(targetName))throw Error('Mapa incompleto: '+targetName+' → '+sourceName);
    names[targetName]=bone.name;
  }
  const sourceHip=source.skeleton.bones.find(b=>b.name===names.pelvis);
  const sourceObject=source.root;sourceObject.skeleton=source.skeleton;
  const preview=new T.AnimationMixer(sourceObject);preview.clipAction(clip).play();
  // CMU BVH explicitly contains a reference T-pose at frame zero. FBX/glTF
  // instead use the actual bind pose, unless an explicit reference is supplied.
  if(referenceFrame)preview.setTime(0);else preview.stopAllAction();
  sourceObject.updateMatrixWorld(true);
  const sourceHeight=sourceHip.getWorldPosition(new T.Vector3()).y;
  if(!Number.isFinite(sourceHeight)||sourceHeight<=0)throw Error('Altura do quadril inválida para normalizar unidades');
  const scale=targetBones.get('pelvis').getWorldPosition(new T.Vector3()).y/sourceHeight,localOffsets={};
  for(const[targetName,sourceName]of Object.entries(names)){
    const a=source.skeleton.bones.find(b=>b.name===sourceName).getWorldQuaternion(new T.Quaternion());
    const b=targetBones.get(targetName).getWorldQuaternion(new T.Quaternion());
    localOffsets[targetName]=new T.Matrix4().makeRotationFromQuaternion(a.invert().multiply(b));
  }
  preview.clipAction(clip).play();preview.setTime(anchor);sourceObject.updateMatrixWorld(true);
  const hip=sourceHip.getWorldPosition(new T.Vector3()),hipPosition=new T.Vector3(-hip.x,0,-hip.z);
  preview.stopAllAction();preview.uncacheRoot(sourceObject);
  const converted=retargetClip(target,sourceObject,clip,{names,localOffsets,hip:names.pelvis,hipInfluence:new T.Vector3(1,1,1),hipPosition,scale,fps});
  converted.name=key;
  for(const track of converted.tracks){track.name=track.name.replace(/^\.bones\[([^\]]+)\]/,'$1');if(![...track.values].every(Number.isFinite))throw Error('Track inválida: '+track.name);}
  return {clip:converted,receipt:{key,sourceClip:clip.name,format:source.format,profile:source.profile,origin,license,mappedBones:Object.keys(names).length,scale,anchor,referenceFrame,upAxis:'Y',targetUnits:'metres',targetForward:'+Z',quality:'retargeted; requires visual/contact review'}};
}

export function serializeClip(clip,receipt,contacts=[],ballMarkers=[]){
  assertCommercialLicense(receipt?.license);
  return {schema:'leilao-legends-animation/v1',animation:T.AnimationClip.toJSON(clip),receipt,footContacts:contacts,ballMarkers};
}
export function readSerializedClip(record){
  if(record.schema!=='leilao-legends-animation/v1')throw Error('Clip sem procedência comercial válida');assertCommercialLicense(record.receipt?.license);
  return T.AnimationClip.parse(record.animation);
}
