// Local imported-character integration. Original topology, weights and bind pose
// stay intact; only bone labels, captured clips and a separate kit mask adapt.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {carregaJogadorNovo as loadFootballSource,criarJogadorNovo as createOriginalActor} from '../jogador-novo.mjs';
import {prepareSkinBounds} from './skinned-frustum-bounds.mjs';
import {capturedArmLayer} from './captured-arm-layer.mjs';
export function criarJogadorNovo(...args){const actor=createOriginalActor(...args);actor.holder.updateMatrixWorld(true);actor.updateFrustumBounds=prepareSkinBounds(actor.mesh);actor.updateFrustumBounds();actor.visibleFacing=bone=>{const b=actor.root.getObjectByName(bone),axis=args[0].forwardAxes?.get(bone);return b&&axis?axis.clone().applyQuaternion(b.getWorldQuaternion(Q())):null};return actor}
const Q=()=>new T.Quaternion(),V=()=>new T.Vector3();
const major={Hip:'Hips',Waist:'Spine',Spine01:'Spine1',Spine02:'Spine2',NeckTwist01:'Neck',NeckTwist02:'NeckHelper',Head:'Head',FacialBone:'HeadFace',L_Eye:'HeadEyeLeft',R_Eye:'HeadEyeRight'};
const limb={Clavicle:'Shoulder',Upperarm:'Arm',Forearm:'ForeArm',Hand:'Hand',Thigh:'UpLeg',Calf:'Leg',Foot:'Foot',ToeBase:'ToeBase',Pinky:'HandPinky',Ring:'HandRing',Mid:'HandMiddle',Index:'HandIndex',Thumb:'HandThumb'};
function alias(name){if(major[name])return 'mixamorig'+major[name];const m=/^([LR])_(.*)/.exec(name);if(!m)return name;for(const[k,v]of Object.entries(limb))if(m[2].startsWith(k))return 'mixamorig'+(m[1]==='L'?'Left':'Right')+v+m[2].slice(k.length);return name}
const bones=root=>{const a=[];root.traverse(o=>{if(o.isBone)a.push(o)});return a};
function snapshot(root){root.updateMatrixWorld(true);return new Map(bones(root).map(b=>[b.name,{p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone(),worldQ:b.getWorldQuaternion(Q()),worldP:b.getWorldPosition(V())}]))}
function restore(root,rest){for(const b of bones(root)){const r=rest.get(b.name);b.position.copy(r.p);b.quaternion.copy(r.q);b.scale.copy(r.s)}root.updateMatrixWorld(true)}
function continuous(values,i,q){if(i&&q.dot(new T.Quaternion().fromArray(values,(i-1)*4))<0)q.set(-q.x,-q.y,-q.z,-q.w);q.toArray(values,i*4)}
function retargetClip(clip,source,target,sourceRest,targetRest){
 restore(source,sourceRest);restore(target,targetRest);const sb=new Map(bones(source).map(b=>[b.name,b])),order=bones(target),mixer=new T.AnimationMixer(source),action=mixer.clipAction(clip);action.play();action.timeScale=0;
 const count=Math.max(2,Math.ceil(clip.duration*30)+1),times=new Float32Array(count),rot=new Map(order.map(b=>[b.name,new Float32Array(count*4)])),hips=new Float32Array(count*3),sp=sb.get('mixamorigHips'),tp=order.find(b=>b.name==='mixamorigHips'),legRatio=targetRest.get(tp.name).worldP.y/sourceRest.get(sp.name).worldP.y;
 for(let i=0;i<count;i++){
  const t=clip.duration*i/(count-1);times[i]=t;action.time=t;mixer.update(0);source.updateMatrixWorld(true);const world=new Map();
  for(const b of order){const r=targetRest.get(b.name),parent=b.parent.isBone?world.get(b.parent.name):b.parent.getWorldQuaternion(Q());const s=sb.get(b.name);let w;
   if(s)w=s.getWorldQuaternion(Q()).multiply(sourceRest.get(b.name).worldQ.clone().invert()).multiply(r.worldQ);
   else w=parent.clone().multiply(r.q);
   const local=parent.clone().invert().multiply(w).normalize();continuous(rot.get(b.name),i,local);world.set(b.name,w);
  }
  const delta=sp.getWorldPosition(V()).sub(sourceRest.get(sp.name).worldP).multiplyScalar(legRatio),point=targetRest.get(tp.name).worldP.clone().add(delta);tp.parent.worldToLocal(point);point.toArray(hips,i*3);
 }
 action.stop();mixer.uncacheRoot(source);restore(source,sourceRest);restore(target,targetRest);
 const tracks=[new T.VectorKeyframeTrack(tp.name+'.position',times,hips),...order.map(b=>new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,rot.get(b.name)))];return new T.AnimationClip(clip.name,clip.duration,tracks).optimize();
}
function nativeGait(clip,target,rest,name){
 restore(target,rest);const mixer=new T.AnimationMixer(target),action=mixer.clipAction(clip);action.play();action.timeScale=0;const hip=target.getObjectByName('mixamorigHips');const first=Math.min(...clip.tracks.map(t=>t.times[0])),end=clip.duration,duration=end-first;
 action.time=first;mixer.update(0);target.updateMatrixWorld(true);const start=hip.getWorldPosition(V());action.time=end;mixer.update(0);target.updateMatrixWorld(true);const finish=hip.getWorldPosition(V()),travel=finish.clone().sub(start).setY(0),yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-Math.atan2(travel.x,travel.z));
 const order=bones(target),count=Math.ceil(duration*30)+1,times=new Float32Array(count),rot=new Map(order.map(b=>[b.name,new Float32Array(count*4)])),hips=new Float32Array(count*3);
 for(let i=0;i<count;i++){const t=duration*i/(count-1);times[i]=t;action.time=first+t;mixer.update(0);target.updateMatrixWorld(true);
  for(const b of order){const q=b===hip?b.parent.getWorldQuaternion(Q()).invert().multiply(yaw).multiply(b.getWorldQuaternion(Q())):b.quaternion.clone();continuous(rot.get(b.name),i,q.normalize())}
  const world=hip.getWorldPosition(V()),delta=world.clone().sub(start).sub(travel.clone().multiplyScalar(t/duration)).setY(0).applyQuaternion(yaw);world.x=rest.get(hip.name).worldP.x+delta.x;world.z=rest.get(hip.name).worldP.z+delta.z;hip.parent.worldToLocal(world);world.toArray(hips,i*3);
 }
 action.stop();mixer.uncacheRoot(target);restore(target,rest);return new T.AnimationClip(name,duration,[new T.VectorKeyframeTrack(hip.name+'.position',times,hips),...order.map(b=>new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,rot.get(b.name)))]).optimize();
}
function kitMask(root){
 root.updateMatrixWorld(true);let mesh;root.traverse(o=>{if(o.isSkinnedMesh)mesh=o});const g=mesh.geometry,uv=g.attributes.uv,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,idx=g.index,bb=new T.Box3().setFromObject(root),height=bb.max.y-bb.min.y;
 const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(mesh.material.map.image,0,0,size,size);const color=ctx.getImageData(0,0,size,size).data,output=new Uint8Array(size*size*4),points=[],zones=[];
 for(let i=0;i<p.count;i++){points.push(V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));let best=0,weight=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>weight){weight=sw.getComponent(i,k);best=si.getComponent(i,k)}zones.push(mesh.skeleton.bones[best].name)}
 const region=(name,y,r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),white=mx>70&&(mx-mn)/mx<.30,warm=r>g*1.08&&g>b*1.05;
  if(/Head|Neck/.test(name))return warm?1:white&&y<.67?5:2;
  if(/Hand|ForeArm/.test(name))return 1;
  if(/Foot|Toe/.test(name))return white&&y>.08?7:8;
  if(/Leg/.test(name)&&!/UpLeg/.test(name))return warm?1:7;
  if(/UpLeg/.test(name))return y>.32&&!warm?6:1;
  if(warm)return 1;
  if(y<.445)return 6;
  if(/Arm|Shoulder/.test(name))return white?4:1;
  return y>.635?5:3;
 };
 for(let j=0;j<idx.count;j+=3){const ids=[idx.getX(j),idx.getX(j+1),idx.getX(j+2)],a=ids.map(i=>[uv.getX(i)*size,uv.getY(i)*size]),[p0,p1,p2]=a,den=(p1[1]-p2[1])*(p0[0]-p2[0])+(p2[0]-p1[0])*(p0[1]-p2[1]);if(Math.abs(den)<1e-9)continue;
  const loX=Math.max(0,Math.floor(Math.min(...a.map(x=>x[0])))),hiX=Math.min(size-1,Math.ceil(Math.max(...a.map(x=>x[0])))),loY=Math.max(0,Math.floor(Math.min(...a.map(x=>x[1])))),hiY=Math.min(size-1,Math.ceil(Math.max(...a.map(x=>x[1]))));
  const z=zones[ids[0]];
  for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){const l0=((p1[1]-p2[1])*(x+.5-p2[0])+(p2[0]-p1[0])*(y+.5-p2[1]))/den,l1=((p2[1]-p0[1])*(x+.5-p2[0])+(p0[0]-p2[0])*(y+.5-p2[1]))/den,l2=1-l0-l1;if(Math.min(l0,l1,l2)<-.005)continue;
   const world=points[ids[0]].clone().multiplyScalar(l0).addScaledVector(points[ids[1]],l1).addScaledVector(points[ids[2]],l2),at=(y*size+x)*4,yn=(world.y-bb.min.y)/height,id=region(z,yn,color[at],color[at+1],color[at+2]);output[at]=id*20+(world.z<0?10:0);output[at+1]=Math.round(yn*255);output[at+2]=Math.round(T.MathUtils.clamp(.5+world.x/(.64*height),0,1)*255);output[at+3]=255;
  }
 }
 // Fill UV-border texels without changing the original color image.
 for(let pass=0;pass<3;pass++){const old=output.slice();for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){const at=(y*size+x)*4;if(old[at+3])continue;for(const q of[at-4,at+4,at-size*4,at+size*4])if(old[q+3]){output.set(old.subarray(q,q+4),at);break}}}
 const texture=new T.DataTexture(output,size,size,T.RGBAFormat);texture.flipY=false;texture.colorSpace=T.NoColorSpace;texture.minFilter=texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.needsUpdate=true;return texture;
}
let promise;
export function carregaJogadorNovo(){return promise??=(async()=>{
 const [source,gltf]=await Promise.all([loadFootballSource(),new GLTFLoader().loadAsync(new URL('../assets/jogador-estilizado-v1.glb',import.meta.url).href)]);const nativeNames=new Map();for(const b of bones(gltf.scene)){nativeNames.set(b.name,alias(b.name));b.name=alias(b.name)}
 for(const c of gltf.animations)for(const t of c.tracks)for(const[old,next]of nativeNames)if(t.name.startsWith(old+'.')){t.name=next+t.name.slice(old.length);break}
 const box=new T.Box3().setFromObject(gltf.scene),scale=1.78/(box.max.y-box.min.y),src=clone(source.gltf.scene),dst=clone(gltf.scene);src.scale.multiplyScalar(source.escala);dst.scale.multiplyScalar(scale);const sr=snapshot(src),tr=snapshot(dst),clips=new Map();let processed=0;
 for(const[name,clip]of source.clips){clips.set(name,retargetClip(clip,src,dst,sr,tr));if(++processed%5===0)await new Promise(r=>setTimeout(r,0))}
 // The earlier UE5 import folded BOTH arms across the torso. Its leg capture
 // remains useful; layer existing football-pass/strike arms on the same rig.
 // Mirrored actions must take their arms from the corresponding mirror too.
 const armLayers={passe_chapa:{donor:'passe',contact:source.meta.clips.passe_chapa.toque,donorContact:source.meta.clips.passe.toque,rate:.7},chute_forte:{donor:'chute',contact:2.5833333333333,donorContact:source.meta.clips.chute.toque,rate:.75}};
 for(const [name,layer]of Object.entries(armLayers))for(const suffix of ['', '_e'])clips.set(name+suffix,capturedArmLayer(clips.get(name+suffix),clips.get(layer.donor+suffix),layer));
 clips.set('trote',nativeGait(gltf.animations.find(c=>c.name==='run.001'),dst,tr,'trote'));clips.set('caminhada',nativeGait(gltf.animations.find(c=>c.name==='walk.001'),dst,tr,'caminhada'));
 const forwardAxes=new Map();gltf.scene.updateMatrixWorld(true);for(const bone of bones(gltf.scene))forwardAxes.set(bone.name,new T.Vector3(0,0,1).applyQuaternion(bone.getWorldQuaternion(Q()).invert()));
 const meta={...source.meta,uniforme:{...source.meta.uniforme,cintura:.445,gola:.64},clips:{...source.meta.clips,trote:{...source.meta.clips.trote,duracao:clips.get('trote').duration},caminhada:{duracao:clips.get('caminhada').duration,deslocamento:0}}};
 for(const [name,layer]of Object.entries(armLayers))meta.clips[name]={...meta.clips[name],capturedArms:{...layer,arquivo:source.meta.clips[layer.donor].arquivo}};
 const asset={gltf,forwardAxes,regioes:kitMask(gltf.scene),meta,clips,escala:scale,design:'chibi-upload-78',sourceClips:source.clips.size};if(import.meta.env.DEV)globalThis.qaChibiAsset=asset;return asset;
 })()}
