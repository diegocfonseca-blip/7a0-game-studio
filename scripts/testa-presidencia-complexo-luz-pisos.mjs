import assert from 'node:assert/strict'
import * as THREE from 'three'
import {calcularAtlasLuzPisos,criarLuzPisosComplexo} from '../src/escalacao/presidencia-complexo-luz-pisos.ts'
const source={id:'street',kind:'street',position:[0,7,0],target:[0,.16,0],intensity:220,distance:24,angle:1.1,color:'#ffe4ae'}
const sample=(atlas,x,z)=>{
 const {bounds,width,height,pixels}=atlas,col=Math.max(0,Math.min(width-1,Math.floor((x-bounds.minX)/(bounds.maxX-bounds.minX)*width))),row=Math.max(0,Math.min(height-1,Math.floor((z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*height)))
 return pixels[(row*width+col)*4]
}
const [bare]=calcularAtlasLuzPisos([source])
assert(sample(bare,0,0)>sample(bare,6,0));assert(sample(bare,6,0)>sample(bare,11,0));assert.equal(sample(bare,20,0),0)
const wall={id:'wall',minX:2.9,maxX:3.1,minZ:-8,maxZ:8,base:0,top:9,footprint:[{x:2.9,z:-8},{x:3.1,z:-8},{x:3.1,z:8},{x:2.9,z:8}]}
const [occluded]=calcularAtlasLuzPisos([source],[wall]);assert(occluded.blocked>0);assert.equal(sample(occluded,8,0),0);assert(sample(occluded,-8,0)>0)
const station={...source,id:'station',kind:'station',position:[20,12,0],target:[20,8.38,0]}
const layered=calcularAtlasLuzPisos([source,station,{...source,kind:'headlight',position:[100,.6,100]}])
assert.deepEqual(layered.map(layer=>layer.floor),[.16,8.38]);assert.equal(layered[0].sources,1);assert.equal(layered[1].sources,1)
assert.equal(sample(layered[0],20,0),0);assert.equal(sample(layered[1],0,0),0)
assert.deepEqual(calcularAtlasLuzPisos([]),[])
for(const layer of layered){assert(layer.width<=1024&&layer.height<=2048);assert(layer.pixels.every(Number.isFinite))}
const root=new THREE.Group(),floor=new THREE.MeshStandardMaterial(),wallMaterial=new THREE.MeshStandardMaterial(),geometry=new THREE.PlaneGeometry()
floor.userData.complexoLightFloor=true;root.add(new THREE.Mesh(geometry,floor),new THREE.Mesh(geometry,wallMaterial))
const before={compile:floor.onBeforeCompile,key:floor.customProgramCacheKey,unrelated:wallMaterial.onBeforeCompile}
const effect=criarLuzPisosComplexo(root,[source,station],[wall]),shader={uniforms:{},vertexShader:'#include <common>\n#include <worldpos_vertex>',fragmentShader:'#include <common>\n#include <emissivemap_fragment>'}
floor.onBeforeCompile(shader,{})
assert.equal(effect.inspect().materials,1);assert.equal(effect.inspect().layers.length,2)
assert.equal(shader.uniforms.complexoFloorNight.value,0);effect.setNight(true);assert.equal(shader.uniforms.complexoFloorNight.value,1)
assert(shader.fragmentShader.includes('step(0.9,vComplexoFloorUp)'));assert(shader.fragmentShader.includes('smoothstep(0.20,0.26'),'asphalt0m and pavement.16m share the ground atlas')
assert(shader.fragmentShader.includes('smoothstep(0.035,0.09'),'station light cannot spill onto ground or roof')
assert.equal(wallMaterial.onBeforeCompile,before.unrelated);effect.setNight(false);assert.equal(shader.uniforms.complexoFloorNight.value,0)
effect.dispose();effect.dispose();assert.equal(floor.onBeforeCompile,before.compile);assert.equal(floor.customProgramCacheKey,before.key)
geometry.dispose();floor.dispose();wallMaterial.dispose()
console.log('PASS floor light atlas: smooth falloff, obstacle shadows, separate elevations, ignored moving lamps, bounded textures, explicit materials, night uniform and restoration')
