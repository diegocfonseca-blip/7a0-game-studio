// 🎞️ 26/10 — movimentos de futebol do Mixamo (Adobe, baixados pelo Diego) → boneco cartoon do jogo.
// Os arquivos .fbx crus NÃO entram no repositório (licença da Adobe: não redistribuir o arquivo cru). Este script lê a pasta
// passada no argumento, reaproveita o `retargetFromReference` (mesmo caminho das capturas antigas) e grava só o movimento já
// convertido pro esqueleto do jogo em src/escalacao/futebol3d/cartoon/mixamo.json.
// Uso: node scripts/cartoon-football/mixamo-retarget.mjs <pasta-com-os-fbx>
import {readFile,writeFile,readdir} from 'node:fs/promises';import path from 'node:path'
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {FBXLoader} from 'three/addons/loaders/FBXLoader.js'
import {createCartoonRig} from '../../src/escalacao/futebol3d/cartoon/rig.mjs';import {retargetFromReference} from './retarget.mjs'
const DIR=process.argv[2];if(!DIR)throw Error('pasta dos .fbx?')
const MAPA={Hips:'pelvis',Spine:'spine_01',Spine2:'spine_03',Neck:'neck_01',Head:'Head',LeftShoulder:'clavicle_l',LeftArm:'upperarm_l',LeftForeArm:'lowerarm_l',LeftHand:'hand_l',RightShoulder:'clavicle_r',RightArm:'upperarm_r',RightForeArm:'lowerarm_r',RightHand:'hand_r',LeftUpLeg:'thigh_l',LeftLeg:'calf_l',LeftFoot:'foot_l',RightUpLeg:'thigh_r',RightLeg:'calf_r',RightFoot:'foot_r'}
const civilBytes=await readFile(new URL('../../src/escalacao/cidade3d/assets/Casual_Male.glb',import.meta.url))
const civil=await new GLTFLoader().parseAsync(civilBytes.buffer.slice(civilBytes.byteOffset,civilBytes.byteOffset+civilBytes.byteLength),'')
const fbx=async file=>{const b=await readFile(file);return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')}
const fonte=group=>{const holder=new T.Group();holder.add(group);const bones=new Map();group.traverse(n=>{if(n.isBone){const k=MAPA[n.name.replace(/^mixamorig\d*:?/,'')];if(k)bones.set(k,n)}});return{root:group,holder,bones}}
const arquivos=(await readdir(DIR)).filter(f=>f.endsWith('.fbx')).sort(),saida={}
for(const f of arquivos){
 const g=await fbx(path.join(DIR,f)),clip=g.animations[0];if(!clip){console.log('sem animação',f);continue}
 const src=fonte(g);if(src.bones.size<19){console.log('esqueleto incompleto',f,src.bones.size);continue}
 // referência: os DOIS esqueletos na pose de montagem (em T) — é a única pose que os dois têm igual
 src.holder.updateMatrixWorld(true)
 const target=createCartoonRig(civil),nome=f.replace(/\.fbx$/,'');target.meshes[0].skeleton.pose();target.holder.updateMatrixWorld(true)
 const c=retargetFromReference(target,src,clip,{name:nome,fps:30})
 saida[nome]=T.AnimationClip.toJSON(c);console.log('ok',nome,c.duration.toFixed(2)+'s')
}
const arred=x=>typeof x==='number'?Math.round(x*1e4)/1e4:Array.isArray(x)?x.map(arred):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,arred(v)])):x
await writeFile(new URL('../../src/escalacao/futebol3d/cartoon/mixamo.json',import.meta.url),JSON.stringify({schema:'leilao-legends-mixamo-futebol/v1',fonte:'Mixamo (Adobe) — movimentos baixados pela conta do Diego, convertidos pro boneco do jogo',clips:arred(saida)}))
console.log('total',Object.keys(saida).length)
