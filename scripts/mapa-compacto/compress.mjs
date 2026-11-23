// Lossless EXT_meshopt_compression. Decoder round-trip is checked for every view.
import fs from 'node:fs'
import {stripUnsupportedBumps} from './strip-bumps.mjs'
import {MeshoptEncoder} from 'meshoptimizer/meshopt_encoder.module.js'
import {MeshoptDecoder} from 'meshoptimizer/meshopt_decoder.module.js'
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready])
const input=fs.readFileSync('public/mapa-compacto/bairro.glb'),jsonSize=input.readUInt32LE(12),json=JSON.parse(input.subarray(20,20+jsonSize).toString()),bin=input.subarray(28+jsonSize)
const droppedUnsupportedBumps=stripUnsupportedBumps(json)
const chunks=[],images=new Set((json.images??[]).map(i=>i.bufferView)),sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16,MAT3:9},components={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}
let cursor=0,fallback=0,compressedViews=0
const push=buffer=>{while(cursor%4){chunks.push(Buffer.alloc(1));cursor++}const at=cursor;chunks.push(buffer);cursor+=buffer.length;return at}
for(let i=0;i<json.bufferViews.length;i++){
 const view=json.bufferViews[i],bytes=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength),accessors=json.accessors.filter(a=>a.bufferView===i)
 const a=accessors[0],stride=view.byteStride??(a?components[a.componentType]*sizes[a.type]:0)
 if(!images.has(i)&&a&&stride>=4&&stride%4===0&&stride<=256&&view.byteLength%stride===0){
  const count=view.byteLength/stride,encoded=MeshoptEncoder.encodeGltfBuffer(bytes,count,stride,'ATTRIBUTES'),decoded=new Uint8Array(view.byteLength);MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,encoded,'ATTRIBUTES');if(!Buffer.from(decoded).equals(bytes))throw Error('Compressão alterou dados da geometria '+i)
  const byteOffset=push(Buffer.from(encoded));view.buffer=1;view.byteOffset=fallback;fallback+=view.byteLength;view.extensions={...view.extensions,EXT_meshopt_compression:{buffer:0,byteOffset,byteLength:encoded.length,byteStride:stride,count,mode:'ATTRIBUTES',filter:'NONE'}};compressedViews++
 }else{view.buffer=0;view.byteOffset=push(bytes)}
}
while(cursor%4){chunks.push(Buffer.alloc(1));cursor++}const binary=Buffer.concat(chunks)
json.buffers=[{byteLength:binary.length},{byteLength:fallback,extensions:{EXT_meshopt_compression:{fallback:true}}}];json.extensionsUsed=[...new Set([...(json.extensionsUsed??[]),'EXT_meshopt_compression'])];json.extensionsRequired=[...new Set([...(json.extensionsRequired??[]),'EXT_meshopt_compression'])]
let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(28+j.length+binary.length,8);head.writeUInt32LE(j.length,12);head.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(binary.length,0);bh.writeUInt32LE(0x004e4942,4)
const output=Buffer.concat([head,j,bh,binary]);fs.writeFileSync('public/mapa-compacto/bairro-20261123-v1.glb',output);fs.unlinkSync('public/mapa-compacto/bairro.glb');console.log({before:input.length,after:output.length,compressedViews,droppedUnsupportedBumps,losslessRoundTrip:true})
