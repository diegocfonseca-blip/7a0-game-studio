import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import * as T from 'three'
import {compactIndexedGeometry} from '../src/escalacao/futebol3d/chibi/compact-geometry.mjs'
const bytes=readFileSync(new URL('../src/escalacao/futebol3d/assets/jogador-estilizado-leve.glb',import.meta.url)),n=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+n)),bin=bytes.subarray(28+n),primitive=doc.meshes[0].primitives[0]
const constructors={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}
const read=id=>{const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],Ctor=constructors[a.componentType],stride=v.byteStride??Ctor.BYTES_PER_ELEMENT*sizes[a.type],values=new Ctor(a.count*sizes[a.type]),data=new DataView(bin.buffer,bin.byteOffset),method={5121:'getUint8',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];for(let i=0;i<a.count;i++)for(let k=0;k<sizes[a.type];k++)values[i*sizes[a.type]+k]=data[method]((v.byteOffset??0)+(a.byteOffset??0)+i*stride+k*Ctor.BYTES_PER_ELEMENT,true);return new T.BufferAttribute(values,sizes[a.type],a.normalized??false)}
const g=new T.BufferGeometry();for(const [name,id]of Object.entries(primitive.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',JOINTS_0:'skinIndex',WEIGHTS_0:'skinWeight'})[name],read(id));g.setIndex(read(primitive.indices));g.addGroup(0,g.index.count,0)
const optimized=compactIndexedGeometry(g)
assert.equal(g.index.count,optimized.index.count,'nenhum triângulo retirado')
for(let i=0;i<g.index.count;i++)for(const key of Object.keys(g.attributes))for(let k=0;k<g.attributes[key].itemSize;k++)assert.equal(g.attributes[key].getComponent(g.index.getX(i),k),optimized.attributes[key].getComponent(optimized.index.getX(i),k),`triângulo ${i}: ${key} preservado`)
assert.deepEqual(optimized.groups,g.groups);assert.deepEqual(optimized.boundingBox,g.boundingBox);assert.deepEqual(optimized.boundingSphere,g.boundingSphere)
assert(optimized.attributes.position.count<g.attributes.position.count*.4)
assert.equal(compactIndexedGeometry(optimized),optimized,'idempotente')
const normalized=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,9,9,9],3)).setAttribute('color',new T.Uint8BufferAttribute([10,20,30,40,50,60,70,80,90,0,0,0],3,true)).setIndex([0,1,2]);const small=compactIndexedGeometry(normalized)
assert.equal(small.attributes.color.normalized,true);assert.equal(small.attributes.color.getX(0),10/255)
console.log(JSON.stringify({pass:true,verticesAntes:g.attributes.position.count,verticesDepois:optimized.attributes.position.count,triangulos:g.index.count/3,atributos:'posições, normais, UVs, juntas e pesos idênticos por triângulo',ossos:doc.skins[0].joints.length,animacoes:doc.animations.length}))
