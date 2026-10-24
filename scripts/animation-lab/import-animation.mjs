// Import an acquired, licensed animation; never downloads or buys anything.
// node import-animation.mjs SOURCE.bvh cmu RECEIPT.json CLIP_KEY [SOURCE_CLIP_NAME]
// RECEIPT: {origin,license:{id,commercial:true,termsFile},anchor,referenceFrame}
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {createHash}from'node:crypto';
import {extname,resolve}from'node:path';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import {parseSource,retargetSource,serializeClip}from'./pipeline.mjs';
import {assertCommercialLicense}from'./license-policy.mjs';
const [input,profile,receiptPath,key,clipName]=process.argv.slice(2);
if(!input||!profile||!receiptPath||!key)throw Error('Uso: SOURCE.(bvh|fbx|glb) PROFILE RECEIPT.json CLIP_KEY [SOURCE_CLIP_NAME]');
if(!/^[a-z][a-z0-9_-]{1,63}$/.test(key))throw Error('Nome de clip inválido');
const receipt=JSON.parse(await readFile(resolve(receiptPath),'utf8'));
assertCommercialLicense(receipt.license);
if(receipt.license?.commercial!==true||!receipt.license.termsFile)throw Error('Registrar permissão comercial e arquivo com termos antes de importar');
await readFile(resolve(receipt.license.termsFile));
const data=await readFile(resolve(input)),format=extname(input).slice(1).toLowerCase();
const source=await parseSource(format==='bvh'?data.toString('utf8'):data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),format,profile);
const targetData=await readFile(new URL('./assets/quaternius-locomotion.glb',import.meta.url));
const target=await new GLTFLoader().parseAsync(targetData.buffer.slice(targetData.byteOffset,targetData.byteOffset+targetData.byteLength),'');
let skin;target.scene.traverse(n=>{if(n.isSkinnedMesh&&!skin)skin=n;});
const result=retargetSource(skin,target.scene,source,{key,clipName,anchor:receipt.anchor??.02,referenceFrame:receipt.referenceFrame??profile==='cmu',origin:receipt.origin,license:receipt.license});
result.receipt.sourceSHA256=createHash('sha256').update(data).digest('hex');result.receipt.approvedForMatch=false;
const output=new URL('../../test-results/animation-library/imports/',import.meta.url);await mkdir(output,{recursive:true});
await writeFile(new URL(key+'.animation.json',output),JSON.stringify(serializeClip(result.clip,result.receipt),null,2));
console.log({key,duration:result.clip.duration,tracks:result.clip.tracks.length,output:output.pathname,reviewRequired:true});
