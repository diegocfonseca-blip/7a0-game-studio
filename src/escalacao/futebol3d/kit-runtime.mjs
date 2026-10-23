// Generated from scripts/animation-lab/universal-kit/kit-runtime.mjs; edit the source and repackage.
import * as T from 'three';
import {acquireClubAtlas,releaseClubAtlas} from './club-kit.mjs';

const templates=new Map(),neutralMaterials=new Map();
const materials=new Map(),textures=new Map(),numbers=new Map(),textureLoads=new Map();
export async function loadKitTemplate(quality='full'){
 if(!['full','light'].includes(quality))throw Error('Qualidade de roupa inválida');
 const asset=quality==='light'?new URL('./assets/template-lite.json',import.meta.url):new URL('./assets/template.json',import.meta.url);
 if(!templates.has(quality))templates.set(quality,fetch(asset).then(r=>{if(!r.ok)throw Error('Malha do uniforme indisponível');return r.json();}).then(data=>{
  const geometry=new T.BufferGeometry();
  for(const[name,size]of Object.entries({position:3,normal:3,uv:2,seam:2,skinIndex:4,skinWeight:4,part:1}))geometry.setAttribute(name,name==='skinIndex'?new T.Uint16BufferAttribute(data[name],size):new T.Float32BufferAttribute(data[name],size));
  geometry.setIndex(data.index);geometry.computeBoundingSphere();return {data,geometry};
 }));
 return templates.get(quality);
}
function numberTexture(number){
 if(!numbers.has(number)){
  const c=document.createElement('canvas');c.width=128;c.height=192;const x=c.getContext('2d');
  x.fillStyle='white';x.textAlign='center';x.textBaseline='middle';x.font='900 170px Arial';x.fillText(String(number),64,100,120);
  const map=new T.CanvasTexture(c);map.colorSpace=T.NoColorSpace;numbers.set(number,map);
 }
 return numbers.get(number);
}
export async function kitMaterial(config,variant,number){
 const clubKey=JSON.stringify([config.clubId??config.clubKey,variant]),key=clubKey+':'+number;
 if(!textureLoads.has(clubKey))textureLoads.set(clubKey,(async()=>{
  const atlas=await acquireClubAtlas(config,variant,number),texture=new T.CanvasTexture(atlas.canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.set(clubKey,texture);return texture;
 })());
 await textureLoads.get(clubKey);
 if(!materials.has(key)){
  const m=new T.MeshStandardMaterial({map:textures.get(clubKey),roughness:.93,side:T.DoubleSide});
  m.onBeforeCompile=s=>{
   s.uniforms.kitNumber={value:numberTexture(number)};s.uniforms.numberColor={value:new T.Color(config.variants[variant].numbering.color)};s.uniforms.trimColor={value:new T.Color(config.variants[variant].shirt.trimColor??config.colors.secondary)};
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 kitUV; attribute float part; varying float kitPart; attribute vec2 seam; varying vec2 kitSeam;').replace('#include <begin_vertex>','#include <begin_vertex>\nkitUV=uv; kitPart=part; kitSeam=seam;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 kitUV; varying float kitPart; varying vec2 kitSeam; uniform sampler2D kitNumber; uniform vec3 numberColor; uniform vec3 trimColor;').replace('#include <map_fragment>',`#include <map_fragment>
    vec2 back=vec2((kitUV.x-536./1024.)/(464./1024.),(kitUV.y-(1.-744./1024.))/(720./1024.));
    vec2 printUV=vec2((back.x-.28)/.44,(back.y-.38)/.43);
    float area=step(0.,printUV.x)*step(printUV.x,1.)*step(0.,printUV.y)*step(printUV.y,1.)*(1.-step(.5,kitPart));
    float ink=texture2D(kitNumber,clamp(printUV,0.,1.)).a*area;
    diffuseColor.rgb=mix(diffuseColor.rgb,numberColor,ink);
    float collar=(1.-smoothstep(.005,.007,kitSeam.x))*(1.-step(.5,kitPart));
    float cuff=(1.-smoothstep(.018,.022,kitSeam.y))*(1.-step(.5,kitPart));
    diffuseColor.rgb=mix(diffuseColor.rgb,trimColor,max(collar,cuff));
   `);
  };m.customProgramCacheKey=()=> 'universal-kit-v2';materials.set(key,m);
 }
 return materials.get(key);
}
// Hide covered body fragments in the material. No vertices, indices, weights,
// joints or source assets are edited or removed; undressing restores materials.
function skinMaterial(){
 const m=new T.MeshStandardMaterial({color:'#bd906f',roughness:.9});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float covered; varying float bodyCovered; varying vec3 restBody;').replace('#include <begin_vertex>','#include <begin_vertex>\nbodyCovered=covered;restBody=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float bodyCovered; varying vec3 restBody;').replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   float y=restBody.y;float ax=abs(restBody.x);
   bool coveredHip=y>.685&&y<1.04&&ax<.215;
   bool coveredShoulder=y>1.35&&y<1.555&&ax>.09&&ax<.335;
   bool safeCoverage=(y>1.04&&ax<.32)||(y<.49&&y>.119);
   bool coveredAnkle=y>.11&&y<.15&&ax<.18;
   if((bodyCovered>.5&&safeCoverage)||coveredHip||coveredShoulder||coveredAnkle||y<.119)discard;
  `);
 };m.customProgramCacheKey=()=> 'kit-covered-body-v1';return m;
}
export async function dressUniversalKit(actor,config,{variant='home',number=10,quality='full'}={}){
 if(config.variants[variant]?.shirt.collar!=='v-neck')throw Error('Esta malha oferece gola V; outro modelo de gola precisa de uma variante de roupa validada');
 const template=await loadKitTemplate(quality),material=await kitMaterial(config,variant,number);
 return bindKit(actor,template,material,config,number);
}
function bindKit(actor,template,material,config,number){
 const source=actor.meshes[0];
 if(source.skeleton.bones.some((b,i)=>b.name!==template.data.bones[i]))throw Error('Uniforme incompatível com o rig');
 const mesh=new T.SkinnedMesh(template.geometry,material);
 mesh.name='universal-football-kit';mesh.bind(source.skeleton,source.bindMatrix);mesh.bindMode=source.bindMode;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;source.parent.add(mesh);
 const originals=actor.meshes.map(m=>({mesh:m,material:m.material,geometry:m.geometry})),skin=skinMaterial();
 actor.meshes.forEach((m,i)=>{m.geometry=m.geometry.clone();m.geometry.setAttribute('covered',new T.Float32BufferAttribute(template.data.bodyCoverage[i],1));m.material=skin;});
 const inspect=()=>({clubId:config.clubId,clubKey:config.clubKey,number,quality:template.data.quality??'full',vertices:template.data.position.length/3,triangles:template.data.index.length/3,sharedGeometry:true,parts:template.data.parts,atlasCount:textures.size,numberTextureCount:numbers.size,bodyGeometryUnchanged:true,clothSimulation:false});
 return {mesh,get template(){return template;},config,number,inspect,async setQuality(value){template=await loadKitTemplate(value);mesh.geometry=template.geometry;actor.meshes.forEach((m,i)=>m.geometry.setAttribute('covered',new T.Float32BufferAttribute(template.data.bodyCoverage[i],1)));return inspect();},dispose(){mesh.removeFromParent();for(const o of originals){o.mesh.geometry.dispose();o.mesh.geometry=o.geometry;o.mesh.material=o.material;}skin.dispose();}};
}

// Unbranded training outfit for the opposing fixture and keepers. It has no
// fabricated club ID, crest or official status; it reuses the same sewn mesh.
export async function dressNeutralKit(actor,{shirtColor='#c2452f',number=1,quality='light'}={}){
 if(!Number.isInteger(number)||number<1||number>99)throw Error('Número inválido');
 const key=shirtColor+':'+number;
 if(!neutralMaterials.has(key)){
  const m=new T.MeshStandardMaterial({roughness:.93,side:T.DoubleSide});
  m.onBeforeCompile=s=>{
   s.uniforms.shirtColor={value:new T.Color(shirtColor)};s.uniforms.darkColor={value:new T.Color('#080908')};s.uniforms.sockColor={value:new T.Color('#f0efef')};s.uniforms.kitNumber={value:numberTexture(number)};
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float part; varying float kitPart; varying vec2 kitUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nkitPart=part;kitUV=uv;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float kitPart;varying vec2 kitUV;uniform vec3 shirtColor;uniform vec3 darkColor;uniform vec3 sockColor;uniform sampler2D kitNumber;').replace('#include <map_fragment>',`#include <map_fragment>
    diffuseColor.rgb=kitPart<.5?shirtColor:kitPart<1.5?darkColor:kitPart<2.5?sockColor:darkColor;
    vec2 back=vec2((kitUV.x-536./1024.)/(464./1024.),(kitUV.y-(1.-744./1024.))/(720./1024.));
    vec2 printUV=vec2((back.x-.28)/.44,(back.y-.38)/.43);
    float area=step(0.,printUV.x)*step(printUV.x,1.)*step(0.,printUV.y)*step(printUV.y,1.)*(1.-step(.5,kitPart));
    diffuseColor.rgb=mix(diffuseColor.rgb,sockColor,texture2D(kitNumber,clamp(printUV,0.,1.)).a*area);
   `);
  };m.customProgramCacheKey=()=> 'neutral-reference-kit-v1';neutralMaterials.set(key,m);
 }
 return bindKit(actor,await loadKitTemplate(quality),neutralMaterials.get(key),{clubId:null,clubKey:null,displayOnly:true},number);
}
export function releaseNeutralKits(){for(const m of neutralMaterials.values())m.dispose();neutralMaterials.clear();}

export function cacheStats(){return {geometries:templates.size,atlases:textures.size,materials:materials.size,numbers:numbers.size};}
// Call after disposing the participants of a match/review. Shared universal
// geometry is retained; club images/materials and individual numbers are freed.
export function releaseMatchKits(configs){
 for(const config of configs)for(const variant of Object.keys(config.variants)){
  const key=JSON.stringify([config.clubId??config.clubKey,variant]);
  for(const [id,material]of materials)if(id.startsWith(key+':')){material.dispose();materials.delete(id);}
  textures.get(key)?.dispose();textures.delete(key);textureLoads.delete(key);releaseClubAtlas(config,variant);
 }
 if(materials.size===0&&neutralMaterials.size===0){for(const texture of numbers.values())texture.dispose();numbers.clear();}
}
