import assert from 'node:assert/strict'
import * as THREE from 'three'
import {instanciarPersonagens} from '../src/escalacao/presidencia-personagens-instancias.ts'

const material=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8})
function custom(shape,wide=1){
 const geometry=new THREE.BufferGeometry()
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-wide,0,0,wide,0,0,0,1,0],3))
 geometry.setAttribute('color',new THREE.Float32BufferAttribute([1,1,1,1,1,1,1,1,1],3))
 geometry.computeVertexNormals()
 if(shape)geometry.userData.humanoShape=shape
 return geometry
}
function texture(id,value=128){
 const map=new THREE.DataTexture(new Uint8Array([value,value,value,255]),1,1)
 if(id)map.userData.humanoTexture=id
 map.needsUpdate=true;return map
}
function fixture(pairs){
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root)
 const sources=pairs.map(([geometry,mat])=>{const mesh=new THREE.Mesh(geometry,mat);root.add(mesh);return mesh})
 const batches=instanciarPersonagens(scene,[root])
 return {scene,root,sources,batches,meshes:scene.children.filter(n=>n instanceof THREE.InstancedMesh)}
}

// BufferGeometry.type alone conflated the custom head and shirt. Only a stable
// generator identity is sufficient to combine distinct geometry instances.
{
 const f=fixture([[custom('head'),material()],[custom('head'),material()],[custom('torso',2),material()],[custom('torso',2),material()]])
 assert.equal(f.batches.batchCount,2);assert.deepEqual(f.meshes.map(n=>n.count),[2,2]);f.batches.dispose()
 const unknown=fixture([[custom(),material()],[custom(undefined,2),material()]])
 assert.equal(unknown.batches.batchCount,2,'unknown BufferGeometry instances must not share a shape');unknown.batches.dispose()
}

// Authored cloth content may be repeated per person. Different maps, UV
// repeats, vertex-color modes and normal/bump strengths must stay distinct.
{
 const a=material(),b=material(),c=material(),d=material(),e=material(),f=material(),g=material(),h=material()
 a.bumpMap=texture('cloth');b.bumpMap=texture('cloth')
 c.bumpMap=texture('other-cloth',16);d.bumpMap=texture('cloth');d.bumpMap.repeat.set(2,1)
 e.bumpMap=texture('cloth');e.vertexColors=false
 f.bumpMap=texture('cloth');f.bumpScale=.2
 g.bumpMap=texture();h.bumpMap=texture()
 const test=fixture([a,b,c,d,e,f,g,h].map(m=>[custom('shirt'),m]))
 assert.equal(test.batches.batchCount,7);assert.equal(test.meshes[0].count,2)
 assert.equal(test.meshes[0].material.bumpMap,a.bumpMap)
 test.batches.dispose()
 for(const property of ['colorSpace','wrapS','magFilter','channel','flipY']){
  const left=material(),right=material();left.map=texture('same');right.map=texture('same')
  right.map[property]=({colorSpace:THREE.SRGBColorSpace,wrapS:THREE.RepeatWrapping,magFilter:THREE.LinearFilter,channel:1,flipY:true})[property]
  const check=fixture([[custom('shirt'),left],[custom('shirt'),right]])
  assert.equal(check.batches.batchCount,2,`texture setting is preserved: ${property}`);check.batches.dispose()
 }
}

// Color and pose remain live; visibility and resource ownership survive both
// disposal calls. A batch material shares the original map and never owns it.
{
 const geometry=custom('body'),a=material();a.bumpMap=texture('cloth')
 let geometryDisposals=0,mapDisposals=0,sourceMaterialDisposals=0,cloneDisposals=0
 geometry.addEventListener('dispose',()=>geometryDisposals++)
 a.bumpMap.addEventListener('dispose',()=>mapDisposals++)
 a.addEventListener('dispose',()=>sourceMaterialDisposals++)
 const f=fixture([[geometry,a]])
 f.meshes[0].material.addEventListener('dispose',()=>cloneDisposals++)
 a.color.set('#c2452f');f.sources[0].position.set(4,2,3);f.batches.update()
 const color=new THREE.Color(),matrix=new THREE.Matrix4()
 f.meshes[0].getColorAt(0,color);assert(color.toArray().every((value,i)=>Math.abs(value-a.color.toArray()[i])<1e-6))
 f.meshes[0].getMatrixAt(0,matrix);assert.deepEqual(new THREE.Vector3().setFromMatrixPosition(matrix).toArray(),[4,2,3])
 f.root.visible=false;f.batches.update();f.meshes[0].getMatrixAt(0,matrix)
 assert.equal(matrix.determinant(),0,'hidden parent also hides its batch instances')
 f.batches.dispose();f.batches.dispose();f.batches.update()
 assert.equal(f.sources[0].visible,true)
 assert.deepEqual([geometryDisposals,mapDisposals,sourceMaterialDisposals,cloneDisposals],[0,0,0,1])
 const root=new THREE.Group(),scene=new THREE.Scene(),hidden=new THREE.Mesh(custom('hidden'),material());hidden.visible=false;root.add(hidden);scene.add(root)
 const batch=instanciarPersonagens(scene,[root]);batch.dispose();assert.equal(hidden.visible,false)
}

// The outsole/laces are children of the original boot mesh. Hiding that mesh
// for batching does not mean its children should disappear from their batch.
{
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root)
 const boot=new THREE.Mesh(custom('boot'),material()),sole=new THREE.Mesh(custom('sole'),material());root.add(boot);boot.add(sole)
 const batch=instanciarPersonagens(scene,[root]),matrix=new THREE.Matrix4()
 const soleBatch=scene.children.find(node=>node instanceof THREE.InstancedMesh&&node.geometry===sole.geometry)
 soleBatch.getMatrixAt(0,matrix);assert.notEqual(matrix.determinant(),0)
 root.visible=false;batch.update();soleBatch.getMatrixAt(0,matrix);assert.equal(matrix.determinant(),0)
 batch.dispose()
}

// clone() deliberately does not copy onBeforeCompile. Keep such meshes under
// their original owner rather than quietly changing their shader.
{
 const special=material();special.onBeforeCompile=shader=>{shader.fragmentShader+='\n'}
 const f=fixture([[custom('shader'),special]])
 assert.equal(f.batches.sourceCount,0);assert.equal(f.sources[0].visible,true);f.batches.dispose()
 const scene=new THREE.Scene(),root=new THREE.Group(),parent=new THREE.Mesh(custom('parent'),material()),child=new THREE.Mesh(custom('custom-child'),special)
 scene.add(root);root.add(parent);parent.add(child)
 const batch=instanciarPersonagens(scene,[root])
 assert.equal(parent.visible,true,'a parent cannot hide an unbatched child with its own shader')
 assert.equal(batch.sourceCount,0);batch.dispose()
}
console.log('PASS: instancing preserves custom geometry identity, cloth maps and sampler state, colors, pose, visibility, custom shaders and owner disposal')
