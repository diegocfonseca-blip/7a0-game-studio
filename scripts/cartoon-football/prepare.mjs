import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCartoonRig,renameCivilClip} from '../../src/escalacao/futebol3d/cartoon/rig.mjs';import {retargetFromReference} from './retarget.mjs';
const dir=new URL('../../src/escalacao/futebol3d/cartoon/',import.meta.url);await mkdir(dir,{recursive:true});
async function load(path){const b=await readFile(path);return{bytes:b,gltf:await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')}}
const civil=await load(new URL('../../src/escalacao/cidade3d/assets/Casual_Male.glb',import.meta.url)),athlete=await load(new URL('../../src/escalacao/futebol3d/assets/quaternius.glb',import.meta.url)),target=createCartoonRig(civil.gltf);
const root=athlete.gltf.scene,holder=new T.Group();holder.add(root);holder.scale.setScalar(1.78/1.8287);const mixer=new T.AnimationMixer(root);mixer.clipAction(athlete.gltf.animations.find(c=>c.name==='Idle_Loop')).play();mixer.update(0);holder.updateMatrixWorld(true);
const bones=new Map();root.traverse(n=>{if(n.isBone)bones.set(n.name,n)});const source={root,holder,bones};
const clips={Idle_Loop:T.AnimationClip.toJSON(renameCivilClip(civil.gltf.animations.find(c=>c.name==='Idle'),'Idle_Loop')),Walk_Loop:T.AnimationClip.toJSON(renameCivilClip(civil.gltf.animations.find(c=>c.name==='Walk'),'Walk_Loop'))};
const originalCivil=await load(new URL('../city-life/assets/source/Casual_Male.glb',import.meta.url));
for(const name of ['Jog_Fwd_Loop','Sprint_Loop']){const run=originalCivil.gltf.animations.find(c=>c.name==='Run');if(!run)throw Error('Corrida nativa do civil ausente');clips[name]=T.AnimationClip.toJSON(renameCivilClip(run,name));console.log('Native civilian Run',name)}
clips.Jump=T.AnimationClip.toJSON(renameCivilClip(originalCivil.gltf.animations.find(c=>c.name==='Jump'),'Jump'));
const motion=JSON.parse(await readFile(new URL('../../src/escalacao/futebol3d/assets/reviewed-match-motion.json',import.meta.url)));
for(const [name,data]of Object.entries(motion.clips)){clips[name]=T.AnimationClip.toJSON(retargetFromReference(target,source,T.AnimationClip.parse(data),{name}));console.log('Retarget',name)}
const receipt={schema:'leilao-legends-civil-football-clips/v1',civilSHA256:createHash('sha256').update(civil.bytes).digest('hex'),sourceSHA256:createHash('sha256').update(athlete.bytes).digest('hex'),nativeCivilSourceSHA256:createHash('sha256').update(originalCivil.bytes).digest('hex'),locomotion:'Idle/Walk/Run/Jump native on original civilian rig; sprint is cadence variation of the same authored Run',geometryUnchanged:true,weightsUnchanged:true,jointsUnchanged:true,reference:'Native Idle on each rig; mapped world rotation deltas; captured vertical hip movement scaled by leg length',licenses:['Quaternius CC0 1.0','CMU commercial grant, see public/creditos-3d.txt'],clips};
await writeFile(new URL('clips.json',dir),JSON.stringify(receipt));console.log({clips:Object.keys(clips),targetBones:target.bones.size,height:target.height});
