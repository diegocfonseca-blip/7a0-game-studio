import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCartoonRig} from './rig.mjs';import {dressCartoonKit} from './kit.mjs';
let modelPromise,clipsPromise;
export async function loadCartoonSource(){
 modelPromise??=new GLTFLoader().loadAsync(new URL('../../cidade3d/assets/Casual_Male.glb',import.meta.url).href).catch(e=>{modelPromise=undefined;throw e});
 clipsPromise??=fetch(new URL('./clips.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Animações civis de futebol indisponíveis');return r.json()});
 const [gltf,data]=await Promise.all([modelPromise,clipsPromise]);
 return {gltf,clips:new Map(Object.entries(data.clips).map(([name,clip])=>[name,T.AnimationClip.parse(clip)])),receipt:data};
}
export async function createCartoonPlayer(source,config,options={}){
 const actor=createCartoonRig(source.gltf),kit=await dressCartoonKit(actor,config,options);actor.kit=kit;actor.maxPresentationOffset=.6;
 actor.holder.updateMatrixWorld(true);const box=new T.Box3().setFromObject(actor.root,true),height=box.max.y-box.min.y;actor.holder.scale.multiplyScalar(actor.height/height);actor.holder.updateMatrixWorld(true);
 for(const [name,clip]of source.clips)actor.actions.set(name,actor.mixer.clipAction(clip));
 actor.footIndices=kit.template.data.part.map((p,i)=>p===3?i:-1).filter(i=>i>=0);
 return actor;
}
