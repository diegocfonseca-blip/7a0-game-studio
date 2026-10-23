// Optional build tools installed outside the app. No paid assets or services.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
const require=createRequire(resolve(process.argv[2]??'/tmp/leilao-gltf-tools','package.json'));
const {NodeIO}=await import(require.resolve('@gltf-transform/core'));
const {prune,resample,dedup}=await import(require.resolve('@gltf-transform/functions'));
const source=new URL('./assets/source/',import.meta.url),dest=new URL('../../src/escalacao/cidade3d/assets/',import.meta.url);
await mkdir(dest,{recursive:true});const receipts=[];
for(const file of ['Casual_Male','Casual_Female','oldclassy_male','oldclassy_female']){
 const input=new URL(file+'.glb',source),io=new NodeIO(),doc=await io.read(input.pathname),keep=new Set(['Idle','Walk','SitDown','StandUp']);
 for(const animation of doc.getRoot().listAnimations())if(!keep.has(animation.getName())){for(const c of animation.listChannels())c.dispose();for(const s of animation.listSamplers())s.dispose();animation.dispose()}
 // Facial marks are a separate material in these models. Match the authored
 // skin material locally, without reshaping the head, neck, rig or clothes.
 const skin=doc.getRoot().listMaterials().find(m=>m.getName()==='Skin');
 if(!skin)throw Error('Material de pele não encontrado: '+file);
 skin.setBaseColorFactor([.5,.27,.14,1]);
 for(const mesh of doc.getRoot().listMeshes())for(const primitive of [...mesh.listPrimitives()]){
  if(primitive.getMaterial()?.getName()==='Face'){mesh.removePrimitive(primitive);primitive.dispose()}
  else if(primitive.getMaterial()===skin)primitive.setAttribute('COLOR_0',null);
 }
 await doc.transform(resample(),dedup(),prune());
 const output=new URL(file+'.glb',dest);await io.write(output.pathname,doc);
 const src=await readFile(input),bytes=await readFile(output),female=file==='Casual_Female';
 receipts.push({file:file+'.glb',author:'Quaternius',license:'CC0-1.0',commercial:true,sourceSHA256:createHash('sha256').update(src).digest('hex'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,
  origin:female?'https://github.com/wmehobbs/Abbott-game/blob/0796b0a859aded9629cd802a0c132993b0c6e091/content/meshes/raw/quaternius_casual_female/Casual_Female.glb':`https://github.com/davide97g/claude-art-online/blob/8bcb684ff0b62731c20d17bb111e45a12376cdac/public/assets/models/npc/${file==='Casual_Male'?'casual_male':file}.glb`,
  officialSource:'https://quaternius.com/packs/ultimateanimatedcharacters.html',changes:'Keep authored geometry, skinning, rig and civilian clothes; keep Idle/Walk/SitDown/StandUp; remove separate facial mark primitives; normalize Skin material without vertex-color blackening; prune unused data',clips:doc.getRoot().listAnimations().map(a=>a.getName())});
}
// Separate civilian volume targets. Never edit the football template, neck,
// arms, bone lengths, bind matrices, joint layout or skinning weights.
for(const [base,name]of [['Casual_Male','Fuller_Man'],['Casual_Female','Fuller_Woman']]){
 const io=new NodeIO(),doc=await io.read(new URL(base+'.glb',dest).pathname),nodes=doc.getRoot().listNodes().filter(n=>n.getMesh()),hip=doc.getRoot().listNodes().find(n=>n.getName()==='Hips').getWorldTranslation(),bounds=new T.Box3(),v=new T.Vector3();
 for(const node of nodes){const matrix=new T.Matrix4().fromArray(node.getWorldMatrix());for(const primitive of node.getMesh().listPrimitives()){const a=primitive.getAttribute('POSITION').getArray();for(let i=0;i<a.length;i+=3)bounds.expandByPoint(v.fromArray(a,i).applyMatrix4(matrix))}}
 const h=bounds.max.y-bounds.min.y,edited=new Set();
 for(const node of nodes){const matrix=new T.Matrix4().fromArray(node.getWorldMatrix()),inverse=matrix.clone().invert(),joints=node.getSkin().listJoints();
  for(const primitive of node.getMesh().listPrimitives()){
   const position=primitive.getAttribute('POSITION');if(edited.has(position))continue;edited.add(position);
   const a=position.getArray().slice(),weights=primitive.getAttribute('WEIGHTS_0').getArray(),indices=primitive.getAttribute('JOINTS_0').getArray();
   for(let i=0;i<a.length/3;i++){
    v.fromArray(a,i*3).applyMatrix4(matrix);let torso=0;
    for(let k=0;k<4;k++)if(/^(Hips|Abdomen|Torso|Body(?:_1)?)$/.test(joints[indices[i*4+k]]?.getName()))torso+=weights[i*4+k];
    const y=(v.y-bounds.min.y)/h,vertical=Math.exp(-Math.pow((y-.49)/.115,4)),mask=Math.max(0,Math.min(1,torso))*vertical;
    v.x+=(v.x-hip[0])*.28*mask;v.z+=(Math.max(0,v.z-hip[2])*.40+.025*h)*mask;
    v.applyMatrix4(inverse).toArray(a,i*3);
   }
   position.setArray(a);primitive.setAttribute('NORMAL',null);
  }
 }
 // Regenerate normals for the new authored surface; do not keep old lighting.
 const {normals}=await import(require.resolve('@gltf-transform/functions'));await doc.transform(normals({overwrite:true}),dedup(),prune());
 const output=new URL(name+'.glb',dest);await io.write(output.pathname,doc);const bytes=await readFile(output),parent=receipts.find(r=>r.file===base+'.glb');
 receipts.push({...parent,file:name+'.glb',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),derivedFrom:base+'.glb',changes:parent.changes+'; separate bounded torso-volume target on civilian mesh and clothing, same rig/weights; recomputed normals',provisional:true});
}
await writeFile(new URL('provenance.json',dest),JSON.stringify({schema:'leilao-legends-civilian-models/v1',models:receipts},null,2));
console.log(receipts.map(r=>({model:r.file,bytes:r.bytes,clips:r.clips})));
