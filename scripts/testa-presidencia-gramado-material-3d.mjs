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
  assert(shader.vertexShader.includes('vComplexoGrassPoint = uv * vec2(105.0, 68.0);'),'sample raw field-wide UV, not grass repeat UV')
  assert.equal(shader.vertexShader.split('varying vec2 vComplexoGrassPoint;').length,2)
  assert.equal(shader.fragmentShader.split('varying vec2 vComplexoGrassPoint;').length,2)
  assert(shader.fragmentShader.includes('fwidth(vComplexoGrassPoint)'),'antialias detail at its projected scale')
  assert.equal(shader.fragmentShader.split('float complexoGrassHash(').length,2)
  for(const include of ['map_fragment','normal_fragment_begin','shadowmap_pars_fragment','lights_fragment_begin','roughnessmap_fragment'])assert(shader.fragmentShader.includes(`#include <${include}>`),`preserve standard physical shader: ${include}`)
  assert.deepEqual(shader.uniforms,{},'no clocks, animation or extra texture uniforms')
  const noImage={vertexShader:originalVertex,fragmentShader:originalFragment,uniforms:{}}
  material.map=null;material.onBeforeCompile(noImage,null)
  assert.equal(noImage.vertexShader,shader.vertexShader);assert.equal(noImage.fragmentShader,shader.fragmentShader,'texture failure retains valid UV-based material')
  assert.equal(material.customProgramCacheKey(),'presidencia-grass-fibres-v1')
}
assert.deepEqual([...geometry.attributes.uv.array],before);assert.deepEqual(texture.repeat.toArray(),[26,17]);assert.equal(texture.colorSpace,THREE.SRGBColorSpace)

// Validate the antialias envelope at metre-scale footprints, independently of
// camera resolution. Above one cell/pixel the detail must vanish completely.
const visible=(footprint,frequency)=>{const v=Math.max(...footprint.map((x,i)=>x*frequency[i])),t=Math.min(1,Math.max(0,(v-.22)/.78));return 1-t*t*(3-2*t)}
for(const frequency of [[95,35],[165,135]]){
  assert.equal(visible([.2,.2],frequency),0,'far map remains unchanged')
  assert.equal(visible([.05,.0001],frequency),0,'grazing angles must not shimmer')
  assert(visible([.001,.001],frequency)>.98,'retina close-up retains subcentimetre detail')
  let previous=1
  for(let step=0;step<=1000;step++){const value=visible([step/10_000,step/10_000],frequency);assert(value>=0&&value<=previous+1e-12);previous=value}
}
for(const fibres of [-.5,.5])for(const grain of [-.5,.5])assert(1+fibres*.12+grain*.045>=.9175&&1+fibres*.12+grain*.045<=1.0825,'bounded neutral colour variation')
assert.equal(THREE.ShaderLib.standard.vertexShader,originalVertex);assert.equal(THREE.ShaderLib.standard.fragmentShader,originalFragment)
materials.forEach(material=>material.dispose());texture.dispose();geometry.dispose()
console.log('PASS grass close-up: standard physical shader, continuous 105x68m UV, colours/stripes/image preserved, detail fades before subpixel scale, no new textures/geometry/clock')
