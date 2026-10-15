import assert from 'node:assert/strict'
import * as THREE from 'three'
import {calcularQualidadeComplexo, aplicarQualidadeTexturasComplexo} from '../src/escalacao/presidencia-complexo-qualidade.ts'

const cases = [
  {name:'mobile-retina',width:390,height:844,devicePixelRatio:3,coarsePointer:true,maxTextureSize:4096,maxAnisotropy:16},
  {name:'mobile-landscape',width:844,height:390,devicePixelRatio:3,coarsePointer:true,maxTextureSize:4096,maxAnisotropy:4},
  {name:'mobile-2gb',width:390,height:844,devicePixelRatio:3,coarsePointer:true,deviceMemory:2,maxTextureSize:4096,maxAnisotropy:16},
  {name:'desktop-fullhd',width:1920,height:1080,devicePixelRatio:2,coarsePointer:false,maxTextureSize:8192,maxAnisotropy:16},
  {name:'desktop-4k',width:3840,height:2160,devicePixelRatio:2,coarsePointer:false,maxTextureSize:8192,maxAnisotropy:16},
  {name:'desktop-native',width:1280,height:720,devicePixelRatio:1,coarsePointer:false,maxTextureSize:8192,maxAnisotropy:16},
  {name:'gpu-limit',width:6000,height:100,devicePixelRatio:3,coarsePointer:false,maxTextureSize:1024,maxAnisotropy:1},
  {name:'hidden',width:0,height:0,devicePixelRatio:0,coarsePointer:true,maxTextureSize:0,maxAnisotropy:0},
  {name:'unknown',width:390,height:844,devicePixelRatio:3,coarsePointer:true},
  {name:'invalid',width:NaN,height:Infinity,devicePixelRatio:NaN,coarsePointer:true,deviceMemory:NaN,maxTextureSize:NaN,maxAnisotropy:NaN},
]
const results = cases.map(input=>({name:input.name,...calcularQualidadeComplexo(input)}))
for(let i=0;i<cases.length;i++){
  const input=cases[i],output=results[i]
  for(const [key,value] of Object.entries(output))if(typeof value==='number')assert(Number.isFinite(value)&&value>0,`${input.name}:${key}`)
  assert(output.drawingWidth*output.drawingHeight<=output.pixelBudget,`${input.name}: pixel budget`)
  assert(output.pixelRatio<=output.maxPixelRatio)
  if(input.maxTextureSize>0){assert(output.drawingWidth<=input.maxTextureSize);assert(output.drawingHeight<=input.maxTextureSize)}
  if(input.maxAnisotropy>0)assert(output.anisotropy<=input.maxAnisotropy)
}
assert.equal(results[0].pixelRatio,2.5,'phone should spend its available retina resolution')
assert.equal(results[1].pixelRatio,results[0].pixelRatio,'rotation preserves density for equal area')
assert.equal(results[2].pixelRatio,1.75);assert.equal(results[2].anisotropy,2)
assert(results[3].pixelRatio>1,'full HD must not be downsampled below CSS resolution')
assert.equal(results[5].pixelRatio,1,'do not supersample native-DPR displays unnecessarily')
assert.equal(results[8].pixelRatio,2.5,'missing memory hint should not penalize the phone')
assert.equal(results[8].anisotropy,1,'missing GPU capability must be conservative')

const scene=new THREE.Scene(),ground=new THREE.Texture(),concrete=new THREE.Texture(),nearest=new THREE.DataTexture(new Uint8Array(16),2,2)
ground.repeat.set(26,17);ground.colorSpace=THREE.SRGBColorSpace
const reflection=new THREE.WebGLRenderTarget(16,16),reflectionEnvironment=new THREE.Texture()
reflectionEnvironment.mapping=THREE.EquirectangularReflectionMapping
const materials=[new THREE.MeshStandardMaterial({map:ground,bumpMap:ground}),new THREE.MeshStandardMaterial({map:ground,normalMap:concrete}),new THREE.MeshStandardMaterial({map:nearest}),new THREE.MeshStandardMaterial({map:reflection.texture}),new THREE.MeshStandardMaterial({map:reflectionEnvironment})]
const geometry=new THREE.PlaneGeometry(1,1),mesh=new THREE.Mesh(geometry,materials)
scene.add(mesh,new THREE.Mesh(geometry,materials[0]));scene.environment=reflectionEnvironment
const before=materials.map(material=>({version:material.version,color:material.color.toArray()})),groundVersion=ground.version
const first=aplicarQualidadeTexturasComplexo(scene,8)
assert.deepEqual(first,{anisotropy:8,textures:2,updated:2},'shared map/bump texture updated once')
assert.equal(ground.version,groundVersion+1);assert.equal(ground.anisotropy,8);assert.equal(concrete.anisotropy,8)
assert.deepEqual(ground.repeat.toArray(),[26,17]);assert.equal(ground.colorSpace,THREE.SRGBColorSpace)
for(const skipped of [nearest,reflection.texture,reflectionEnvironment])assert.equal(skipped.anisotropy,1)
assert.deepEqual(materials.map(material=>({version:material.version,color:material.color.toArray()})),before)
assert.deepEqual(aplicarQualidadeTexturasComplexo(scene,8),{anisotropy:8,textures:2,updated:0},'reconfiguration does not reupload unchanged textures')
assert.deepEqual(aplicarQualidadeTexturasComplexo(scene,1),{anisotropy:1,textures:2,updated:2},'GPU downgrade caps existing hardcoded anisotropy too')
assert.equal(mesh.geometry,geometry);assert.equal(scene.children.length,2)
for(const texture of [ground,concrete,nearest,reflectionEnvironment])texture.dispose()
reflection.dispose();geometry.dispose();materials.forEach(material=>material.dispose())
console.log('PASS visual quality: bounded retina/resized/4K/low-memory buffers; GPU anisotropy; shared texture lifecycle; UV/colour/geometry preserved',results)
