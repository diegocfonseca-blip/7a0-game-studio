import assert from 'node:assert/strict'
import * as THREE from 'three'
import {materialGramado3D} from '../src/escalacao/presidencia-gramado-material-3d.ts'

const texture=new THREE.Texture(),materials=['#c1d89c','#d5e4b4'].map(color=>materialGramado3D(color,texture))
texture.repeat.set(26,17);texture.colorSpace=THREE.SRGBColorSpace
const geometry=new THREE.PlaneGeometry(105,68),before=[...geometry.attributes.uv.array]
const originalVertex=THREE.ShaderLib.standard.vertexShader,originalFragment=THREE.ShaderLib.standard.fragmentShader
for(let i=0;i<materials.length;i++){
  const material=materials[i],shader={vertexShader:originalVertex,fragmentShader:originalFragment,uniforms:{}}
  assert.equal(material.map,texture);assert.equal(material.roughness,1)
  assert.equal(material.color.getHexString(),['c1d89c','d5e4b4'][i]);assert.equal(material.transparent,false)
  material.onBeforeCompile(shader,null)
  assert.equal(shader.vertexShader,originalVertex);assert.equal(shader.fragmentShader,originalFragment,'Use the native Three.js shader on mobile and desktop')
  assert.deepEqual(shader.uniforms,{},'no clocks, animation or extra texture uniforms')
  const noImage={vertexShader:originalVertex,fragmentShader:originalFragment,uniforms:{}}
  material.map=null;material.onBeforeCompile(noImage,null)
  assert.equal(noImage.vertexShader,shader.vertexShader);assert.equal(noImage.fragmentShader,shader.fragmentShader,'texture failure retains valid UV-based material')
}
assert.deepEqual([...geometry.attributes.uv.array],before);assert.deepEqual(texture.repeat.toArray(),[26,17]);assert.equal(texture.colorSpace,THREE.SRGBColorSpace)

assert.equal(THREE.ShaderLib.standard.vertexShader,originalVertex);assert.equal(THREE.ShaderLib.standard.fragmentShader,originalFragment)
materials.forEach(material=>material.dispose());texture.dispose();geometry.dispose()
console.log('PASS native grass material: colours, shared image, UVs, lights and standard shader preserved')
