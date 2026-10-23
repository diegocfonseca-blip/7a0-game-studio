import * as T from 'three';
import {kitMaterial,loadKitTemplate} from '../kit-runtime.mjs';
const geometries=new WeakMap(),neutral=new Map();
// Clothing adjustments are evaluated in the original neutral pose and then
// brought back into bind space. Body vertices and the skeleton stay untouched.
function moveGarmentVertex(mesh,index,worldDelta){
 const joints=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
 const blend=new T.Matrix4();blend.elements.fill(0);
 for(let k=0;k<4;k++){const id=joints[['getX','getY','getZ','getW'][k]](index),w=weights[['getX','getY','getZ','getW'][k]](index);if(!w)continue;const m=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[id].matrixWorld,mesh.skeleton.boneInverses[id]);for(let j=0;j<16;j++)blend.elements[j]+=m.elements[j]*w;}
 const transform=mesh.matrixWorld.clone().multiply(mesh.bindMatrixInverse).multiply(blend).multiply(mesh.bindMatrix),p=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index).applyMatrix4(transform).add(worldDelta).applyMatrix4(transform.invert());
 mesh.geometry.attributes.position.setXYZ(index,p.x,p.y,p.z);
}
function garmentBorders(geometry,samples){
 const keys=samples.map(v=>v.toArray().map(n=>Math.round(n*10000)).join(':')),points=new Map(samples.map((v,i)=>[keys[i],v])),edges=new Map();
 const index=geometry.index;
 for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];for(let k=0;k<3;k++){const a=keys[ids[k]],b=keys[ids[(k+1)%3]],key=[a,b].sort().join('|');const e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1})}}
 const boundary=[...edges.values()].filter(e=>e.count===1),graph=new Map();for(const e of boundary)for(const[a,b]of [[e.a,e.b],[e.b,e.a]]){if(!graph.has(a))graph.set(a,new Set());graph.get(a).add(b)}
 const seen=new Set(),groups=[];for(const first of graph.keys()){if(seen.has(first))continue;const group=new Set(),todo=[first];while(todo.length){const key=todo.pop();if(seen.has(key))continue;seen.add(key);group.add(key);todo.push(...graph.get(key))}const verts=[...group].map(k=>points.get(k)),center=verts.reduce((p,v)=>p.add(v),new T.Vector3()).divideScalar(verts.length);groups.push({center,edges:boundary.filter(e=>group.has(e.a)).map(e=>new T.Line3(points.get(e.a),points.get(e.b)))})}
 groups.sort((a,b)=>b.center.y-a.center.y);const neck=groups[0]?.edges??[],cuffs=groups.slice(1).filter(g=>Math.abs(g.center.x)>.25).flatMap(g=>g.edges),point=new T.Vector3();
 return{neck:v=>Math.min(Infinity,...neck.map(e=>e.closestPointToPoint(v,true,point).distanceTo(v))),cuff:v=>Math.min(Infinity,...cuffs.map(e=>e.closestPointToPoint(v,true,point).distanceTo(v)))};
}

function geometryFor(mesh,actor){
 if(geometries.has(mesh.geometry))return geometries.get(mesh.geometry);
 const geometry=mesh.geometry.clone(),kind=mesh.material.name;
 // GLB accessors may share interleaved buffers. Normalize through accessors,
 // never assume attribute.array is a tightly packed POSITION or skin stream.
 for(const [name,attribute]of Object.entries(geometry.attributes)){const values=new (name==='skinIndex'?Uint16Array:Float32Array)(attribute.count*attribute.itemSize);for(let i=0;i<attribute.count;i++)for(let k=0;k<attribute.itemSize;k++)values[i*attribute.itemSize+k]=attribute[['getX','getY','getZ','getW'][k]](i);geometry.setAttribute(name,new T.BufferAttribute(values,attribute.itemSize));}
 const p=geometry.attributes.position;
 const region=new Float32Array(p.count),sockChart=new Float32Array(p.count),seam=new Float32Array(p.count*2),part=new Float32Array(p.count),uv=new Float32Array(p.count*2),point=new T.Vector3();
 const skin=geometry.attributes.skinIndex,weight=geometry.attributes.skinWeight;
 const nameAt=i=>mesh.skeleton.bones[i]?.name,pointAt=i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld).divideScalar(actor.holder.scale.x);
 const samples=Array.from({length:p.count},(_,i)=>pointAt(i)),box=new T.Box3().setFromPoints(samples),center=(box.min.x+box.max.x)/2;
 if(kind==='Shirt'){
  const original=mesh.geometry;mesh.geometry=geometry;const scale=actor.holder.scale.x;
  // Local V-shaped neckline in the garment only. The falloff includes the
  // next chest rows so the opening cannot fold over an unchanged lower row.
  for(let i=0;i<p.count;i++){const v=samples[i],x=Math.abs(v.x-center)*scale,front=T.MathUtils.smoothstep(v.z*scale,.03,.08),top=T.MathUtils.smoothstep(v.y*scale,box.max.y*scale-.18,box.max.y*scale-.02),amount=Math.max(0,1-x/.09)*front*top;if(amount)moveGarmentVertex(mesh,i,new T.Vector3(0,-.04*amount,.012*amount));}
  for(let i=0;i<p.count;i++)samples[i]=pointAt(i);mesh.geometry=original;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 }
 const kneeHeight=actor.bones.get('calf_l').getWorldPosition(new T.Vector3()).y/actor.holder.scale.x;
 // Keep the authored shorts hem. This source has no upper-thigh surface
 // behind it: raising the hem exposes empty space instead of bare skin.
 const borders=kind==='Shirt'?garmentBorders(geometry,samples):null,cuffs={left:Infinity,right:Infinity};
 for(const v of samples)if(Math.abs(v.x-center)>.35)cuffs[v.x>center?'left':'right']=Math.min(cuffs[v.x>center?'left':'right'],v.y);
 for(let i=0;i<p.count;i++){
  const v=samples[i];let foot=0,calf=0;
  if(skin&&weight)for(let k=0;k<4;k++){const name=nameAt(skin.array[i*4+k]);if(/^foot_[lr]$/.test(name))foot+=weight.array[i*4+k];if(/^calf_[lr]$/.test(name))calf+=weight.array[i*4+k]}
  if(kind==='Skin'){region[i]=foot>.5||v.y<.12?3:calf>.5?2:0;part[i]=foot>.5?3:0;sockChart[i]=v.y/kneeHeight;}
  if(kind==='Shirt'){
   const side=v.z>=.08,body=Math.abs(v.x-center)<.36,u=T.MathUtils.clamp((v.x-center+.36)/.72,0,1),t=T.MathUtils.clamp((v.y-box.min.y)/(box.max.y-box.min.y),0,1);
   if(body){uv[i*2]=((side?24:536)+(side?u:1-u)*464)/1024;uv[i*2+1]=1-(24+(1-t)*720)/1024}
   else {uv[i*2]=(24+u*464)/1024;uv[i*2+1]=1-(780+(1-t)*155)/1024}
   const collar=Math.abs(v.x-center)<.205&&v.y>box.max.y-.075;
   seam[i*2]=Math.min(.1,borders.neck(v)*.2);seam[i*2+1]=Math.min(.1,borders.cuff(v)*.5);
  }
 }
 geometry.setAttribute('footballRegion',new T.Float32BufferAttribute(region,1));geometry.setAttribute('part',new T.Float32BufferAttribute(part,1));
 geometry.setAttribute('footballSockChart',new T.Float32BufferAttribute(sockChart,1));
 if(kind==='Shirt'){geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('seam',new T.Float32BufferAttribute(seam,2))}
 const value={geometry,kind,part:Array.from(part),position:Array.from(p.array),index:Array.from(geometry.index.array)};geometries.set(mesh.geometry,value);return value;
}
function skinMaterial(color){
 const m=new T.MeshStandardMaterial({color,roughness:.88});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float footballRegion;attribute float footballSockChart;varying float clothingRegion;varying float sockHeight;').replace('#include <begin_vertex>','#include <begin_vertex>\nclothingRegion=footballRegion;sockHeight=footballSockChart;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float clothingRegion;varying float sockHeight;').replace('#include <color_fragment>','#include <color_fragment>\nif(clothingRegion>2.5)discard;else if(clothingRegion>1.5){float stripe=step(.79,sockHeight)*(1.-step(.83,sockHeight))+step(.89,sockHeight)*(1.-step(.93,sockHeight));diffuseColor.rgb=mix(vec3(.91,.91,.89),vec3(.015),stripe);}')};m.customProgramCacheKey=()=> 'civil-football-socks-boots-v3';return m;
}
const bootsCache=new WeakMap();
function buildBoots(actor,source){
 const skin=actor.meshes.find(m=>m.material.name==='Skin'),skeleton=skin.skeleton;
 let prepared=bootsCache.get(skin.geometry);
 if(!prepared){
  const position=[],indices=[],joints=[],weights=[],part=[],chart=[],used=new Map(),bounds={left:new T.Box3(),right:new T.Box3()};
  for(let i=0;i<source.part.length;i++)if(source.part[i]===3){const p=new T.Vector3().fromArray(source.position,i*3);bounds[p.x>0?'left':'right'].expandByPoint(p)}
  for(let i=0;i<source.index.length;i+=3){const face=source.index.slice(i,i+3);if(!face.every(id=>source.part[id]===3))continue;
   for(const id of face){if(!used.has(id)){
    const p=new T.Vector3().fromArray(source.position,id*3),side=p.x>0?'left':'right',boneIndex=skeleton.bones.findIndex(b=>b.name==='foot_'+(side==='left'?'l':'r')),bone=skeleton.bones[boneIndex],center=bounds[side].getCenter(new T.Vector3()),size=bounds[side].getSize(new T.Vector3()),anchor=bone.getWorldPosition(new T.Vector3());
    const inverse=new T.Matrix4().copy(skin.matrixWorld).multiply(skin.bindMatrixInverse).multiply(bone.matrixWorld).multiply(skeleton.boneInverses[boneIndex]).multiply(skin.bindMatrix).invert();
    chart.push((p.x-center.x)/size.x,(p.y-center.y)/size.y,(p.z-center.z)/size.z);
    const delta=p.clone().sub(center).multiply(new T.Vector3(.13/size.x,.10/size.y,.24/size.z));delta.y+=.02;delta.z+=.06;p.copy(anchor).add(delta).applyMatrix4(inverse);
    used.set(id,position.length/3);position.push(...p);joints.push(boneIndex,0,0,0);weights.push(1,0,0,0);part.push(3);
   }indices.push(used.get(id))}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('footballBootChart',new T.Float32BufferAttribute(chart,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  prepared={geometry,data:{position,index:indices,part},source:'Existing Quaternius CC0 boot garment, fitted as footwear only; original body and skinning untouched'};bootsCache.set(skin.geometry,prepared);
 }
 const material=new T.MeshStandardMaterial({color:'#24272b',roughness:.75,side:T.DoubleSide});
 material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 footballBootChart;varying vec3 bootChart;').replace('#include <begin_vertex>','#include <begin_vertex>\nbootChart=footballBootChart;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 bootChart;').replace('#include <color_fragment>','#include <color_fragment>\nfloat upper=step(.1,bootChart.y)*step(abs(bootChart.x),.22)*step(-.15,bootChart.z)*step(bootChart.z,.22);float lace=(1.-smoothstep(.10,.18,abs(fract((bootChart.z+.15)*16.)-.5)))*upper;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.13),lace);diffuseColor.rgb*=mix(.55,1.,smoothstep(-.36,-.28,bootChart.y));')};material.customProgramCacheKey=()=> 'civil-football-boot-finish-v1';
 const mesh=new T.SkinnedMesh(prepared.geometry,material);mesh.name='civil-football-boots';mesh.bind(skeleton,skin.bindMatrix);mesh.bindMode=skin.bindMode;mesh.position.copy(skin.position);mesh.quaternion.copy(skin.quaternion);mesh.scale.copy(skin.scale);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;skin.parent.add(mesh);actor.meshes.push(mesh);return {mesh,data:prepared.data,material};
}
export async function dressCartoonKit(actor,config,{number=10,shirtColor='#eeeeea',skinColor='#bd906f',hairColor='#49301e',offline=false,templateSource=null}={}){
 const owned=[],baseMeshes=[...actor.meshes];
 const boots=buildBoots(actor,templateSource??(await loadKitTemplate('light')).data);owned.push(boots.material);
 const shirt=offline?new T.MeshBasicMaterial({color:shirtColor}):config?await kitMaterial(config,'home',number):(()=>{
  const key=shirtColor+':'+number;if(!neutral.has(key)){const m=new T.MeshStandardMaterial({color:shirtColor,roughness:.9});neutral.set(key,m)}return neutral.get(key)
 })();if(offline)owned.push(shirt);
 for(const mesh of baseMeshes){const data=geometryFor(mesh,actor);mesh.geometry=data.geometry;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  if(data.kind==='Skin'){const m=skinMaterial(skinColor);mesh.material=m;owned.push(m);}
  else if(data.kind==='Shirt')mesh.material=shirt;
  else {const m=new T.MeshStandardMaterial({color:data.kind==='Hair'?hairColor:'#111214',roughness:.9});mesh.material=m;owned.push(m)}
 }
 return {mesh:boots.mesh,template:{data:boots.data},dispose(){owned.forEach(m=>m.dispose())},inspect:()=>({sourceClothing:true,bodyGeometryUnchanged:true,skinWeightsUnchanged:true,sourceCrest:!!config,number})};
}
