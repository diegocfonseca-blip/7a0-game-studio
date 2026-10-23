import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// Civilian variants are separate assets. Football anatomy/rigs are never edited.
export const CIVILIAN_VARIANTS=Object.freeze([
 {id:'adult-man',file:'Casual_Male',height:1.76,sex:'male',age:'adult'},
 {id:'adult-woman',file:'Casual_Female',height:1.67,sex:'female',age:'adult'},
 {id:'older-man',file:'oldclassy_male',height:1.72,sex:'male',age:'older'},
 {id:'older-woman',file:'oldclassy_female',height:1.63,sex:'female',age:'older'},
 {id:'fuller-man',file:'Fuller_Man',height:1.76,sex:'male',age:'adult',body:'civilian-torso-volume-target',provisional:true},
 {id:'fuller-woman',file:'Fuller_Woman',height:1.7,sex:'female',age:'adult',body:'civilian-torso-volume-target',provisional:true},
 {id:'child-boy',file:'Casual_Male',height:1.18,sex:'male',age:'child',provisional:true},
 {id:'child-girl',file:'Casual_Female',height:1.2,sex:'female',age:'child',provisional:true},
]);
const cache=new Map(),loader=new GLTFLoader(),hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const clothes=['#6b7898','#b76c43','#4c7771','#b9aa86','#734d6e','#d1c4ac'];
const load=file=>{if(!cache.has(file))cache.set(file,loader.loadAsync(new URL('./assets/'+file+'.glb',import.meta.url).href).catch(e=>{cache.delete(file);throw e}));return cache.get(file)};
export function createCivilian(parent,{id='civilian',variant,onReady}={}){
 const spec=CIVILIAN_VARIANTS.find(v=>v.id===variant)??CIVILIAN_VARIANTS[hash(id)%CIVILIAN_VARIANTS.length];
 const root=new T.Group();root.name='civilian-'+id;parent.add(root);const physical=new T.Group();physical.name='civilian-metres';root.add(physical);
 let disposed=false,model,mixer,actions,footMeshes=[],height=0,last=null,poseUpdates=0,errors=[],lastPose=-Infinity;
 const point=new T.Vector3(),origin=new T.Vector3(),materials=new Set();
 function updateWorld(){root.parent?.updateWorldMatrix(true,false);root.updateMatrixWorld(true)}
 const ready=load(spec.file).then(gltf=>{
  if(disposed)return false;
  model=clone(gltf.scene);physical.add(model);
  const palette=clothes[hash(id+'clothes')%clothes.length],materialCopies=new Map();
  model.traverse(n=>{if(!n.isMesh)return;n.castShadow=n.receiveShadow=true;n.frustumCulled=true;
   const convert=source=>{if(!materialCopies.has(source)){const m=source.clone();if(['Shirt','Clothes'].includes(m.name))m.color.set(palette);if(m.name==='Skin')m.color.set(['#b87952','#d4ad83','#895738','#bd926b'][hash(id+'skin')%4]);if(m.name==='Hair'&&spec.age==='older')m.color.set('#9b9a90');m.roughness=.86;m.metalness=0;materialCopies.set(source,m);materials.add(m)}return materialCopies.get(source)};
   n.material=Array.isArray(n.material)?n.material.map(convert):convert(n.material);
   if(n.isSkinnedMesh){const feet=new Set(n.skeleton.bones.map((b,i)=>/^Foot[.LR]/.test(b.name)?i:-1).filter(i=>i>=0)),indices=[],weights=n.geometry.getAttribute('skinWeight'),joints=n.geometry.getAttribute('skinIndex');
    for(let i=0;i<weights.count;i++)for(let k=0;k<4;k++)if(feet.has(joints.array[i*4+k])&&weights.array[i*4+k]>.5){indices.push(i);break}
    footMeshes.push({mesh:n,indices});
   }
  });
  mixer=new T.AnimationMixer(model);actions={};for(const name of ['Idle','Walk','SitDown','StandUp']){const clip=gltf.animations.find(c=>c.name===name);if(!clip)throw Error('Animação civil ausente: '+name);const a=mixer.clipAction(clip);a.play();a.timeScale=0;if(name==='SitDown'||name==='StandUp'){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}actions[name]=a}
  actions.Idle.setEffectiveWeight(1);actions.Walk.setEffectiveWeight(0);actions.SitDown.setEffectiveWeight(0);actions.StandUp.setEffectiveWeight(0);mixer.update(0);updateWorld();model.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update()});
  const box=new T.Box3().setFromObject(model,true);height=box.max.y-box.min.y;
  if(!(height>.2&&height<10))throw Error('Escala civil inválida');
  physical.scale.setScalar(spec.height/height);
  if(last)apply(last,true);onReady?.();return true;
 }).catch(error=>{errors.push(String(error));return false});
 function apply(frame,force=false){last={...frame};root.visible=frame.visible!==false;
  if(!model||!root.visible||disposed)return;
  const seconds=Number.isFinite(frame.seconds)?frame.seconds:0;
  // The scene owns time and distance. Pause never advances a private mixer.
  const moving=T.MathUtils.clamp((frame.speed??0)/.7,0,1),seated=T.MathUtils.clamp(frame.seated??0,0,1);
  const seatedBlend=T.MathUtils.smoothstep(seated,0,.15),rising=frame.transition==='standing';
  actions.Idle.setEffectiveWeight((1-moving)*(1-seatedBlend));actions.Walk.setEffectiveWeight(moving*(1-seatedBlend));actions.SitDown.setEffectiveWeight(rising?0:seatedBlend);actions.StandUp.setEffectiveWeight(rising?seatedBlend:0);
  if(force||seconds<lastPose||seconds-lastPose>=1/(frame.detail==='far'?6:frame.detail==='intermediate'?12:30)){
   actions.Idle.time=seconds%actions.Idle.getClip().duration;
   actions.Walk.time=(((frame.distance??0)/(spec.height*.66))%1+1)%1*actions.Walk.getClip().duration;
   actions.SitDown.time=actions.SitDown.getClip().duration*seated;actions.StandUp.time=actions.StandUp.getClip().duration*(1-seated);
   mixer.update(0);physical.position.set(0,0,0);updateWorld();root.getWorldPosition(origin);
   const hip=model.getObjectByName('Hips');if(hip){const local=root.worldToLocal(hip.getWorldPosition(new T.Vector3()));physical.position.x=-local.x;physical.position.z=-local.z;updateWorld()}
   let low=Infinity;for(const {mesh,indices}of footMeshes){mesh.skeleton.update();for(const index of indices)low=Math.min(low,mesh.getVertexPosition(index,point).applyMatrix4(mesh.matrixWorld).y)}
   if(Number.isFinite(low))physical.position.y=origin.y-low+.002;
   updateWorld();lastPose=seconds;poseUpdates++;
  }
 }
 function inspect(){let low=Infinity;if(model){updateWorld();root.getWorldPosition(origin);for(const {mesh,indices}of footMeshes){mesh.skeleton.update();for(const index of indices)low=Math.min(low,mesh.getVertexPosition(index,point).applyMatrix4(mesh.matrixWorld).y-origin.y)}}return {id,variant:spec.id,source:spec.file,height:spec.height,ready:!!model,provisional:!!spec.provisional,animations:'authored Quaternius clips through Three.js AnimationMixer',poseUpdates,measuredHeight:model?new T.Box3().setFromObject(model,true).getSize(new T.Vector3()).y:null,footFloor:low===Infinity?null:low,errors:[...errors]}}
 return {root,ready,update:apply,inspect,
 dispose(){if(disposed)return;disposed=true;root.removeFromParent();if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model)}model?.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.dispose()});materials.forEach(m=>m.dispose());root.clear()}};
}
