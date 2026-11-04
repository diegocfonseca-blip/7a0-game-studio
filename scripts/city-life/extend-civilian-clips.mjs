// Reuse CC0 clips already downloaded. Copy animation channels only: no new anatomy.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire('/tmp/leilao-gltf-tools/package.json');
const {NodeIO}=await import(require.resolve('@gltf-transform/core'));
const {dedup,prune,resample}=await import(require.resolve('@gltf-transform/functions'));
const dir=new URL('../../src/escalacao/cidade3d/assets/',import.meta.url),source=new URL('./assets/source/',import.meta.url);
const provenance=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const surface=doc=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives().flatMap(p=>['POSITION','JOINTS_0','WEIGHTS_0'].map(k=>hash(p.getAttribute(k).getArray()))));
for(const receipt of provenance.models){
 const filename=receipt.file,base=filename==='Fuller_Man.glb'?'Casual_Male.glb':filename==='Fuller_Woman.glb'?'Casual_Female.glb':filename;
 const io=new NodeIO(),dst=await io.read(new URL(filename,dir).pathname),src=await io.read(new URL(base,source).pathname),before=surface(dst),nodes=new Map(dst.getRoot().listNodes().map(n=>[n.getName(),n])),buffer=dst.getRoot().listBuffers()[0];
 for(const name of ['PickUp','Walk_Carry','Victory']){
  if(dst.getRoot().listAnimations().some(a=>a.getName()===name))continue;
  const original=src.getRoot().listAnimations().find(a=>a.getName()===name);if(!original)throw Error('Missing source clip '+name);
  const animation=dst.createAnimation(name),samplers=new Map();
  for(const c of original.listChannels()){
   const node=nodes.get(c.getTargetNode().getName());if(!node)throw Error('Missing target bone '+c.getTargetNode().getName());
   const s=c.getSampler();let copied=samplers.get(s);
   if(!copied){const accessor=a=>dst.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setBuffer(buffer);copied=dst.createAnimationSampler().setInterpolation(s.getInterpolation()).setInput(accessor(s.getInput())).setOutput(accessor(s.getOutput()));samplers.set(s,copied);animation.addSampler(copied)}
   animation.addChannel(dst.createAnimationChannel().setTargetNode(node).setTargetPath(c.getTargetPath()).setSampler(copied));
  }
 }
 await dst.transform(resample(),dedup(),prune());if(JSON.stringify(surface(dst))!==JSON.stringify(before))throw Error('Geometry/skinning changed');
 const output=new URL(filename,dir);await io.write(output.pathname,dst);const bytes=await readFile(output);receipt.bytes=bytes.length;receipt.sha256=createHash('sha256').update(bytes).digest('hex');receipt.clips=dst.getRoot().listAnimations().map(a=>a.getName());receipt.activityClips={source:base,license:'CC0-1.0',clips:['PickUp','Walk_Carry','Victory'],geometryAndSkinningUnchanged:true};
 console.log(filename,bytes.length);
}
await writeFile(new URL('provenance.json',dir),JSON.stringify(provenance,null,2)+'\n');
