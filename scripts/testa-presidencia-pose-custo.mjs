import assert from 'node:assert/strict'
import fs from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import * as THREE from 'three'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
const source=fs.readFileSync(new URL('../src/escalacao/presidencia-atleta-3d.ts',import.meta.url),'utf8')
const baseline=stripTypeScriptTypes(source.replace('const corner=groundCorner','const corner=new THREE.Vector3()')
 .replace('corner.set(x,y,z).applyMatrix4(leg.boot.matrixWorld)','corner.set(x,y,z);leg.boot.localToWorld(corner)')
 .replace('corner.set(x,y,z).applyMatrix4(node.matrixWorld)','corner.set(x,y,z);node.localToWorld(corner)'))
 .replace("from 'three'",`from '${import.meta.resolve('three')}'`)
const old=await import('data:text/javascript;base64,'+Buffer.from(baseline).toString('base64'))
const a=person('#fff','#fff',true),b=old.person('#fff','#fff',true)
const samples=Array.from({length:400},(_,i)=>({mx:12,mz:-7,heading:i/17,distance:i/31,speed:i%60/10,kick:i%31/100,throwing:i%61/100,throwPreparation:i%17/16,control:i%33/100,save:i%3===0?1:0,dive:i%4===0?i%10/10:0}))
for(const p of samples){
 pose(a,p);old.pose(b,p);a.group.updateMatrixWorld(true);b.group.updateMatrixWorld(true)
 const am=[],bm=[];a.group.traverse(n=>am.push(...n.matrixWorld.elements));b.group.traverse(n=>bm.push(...n.matrixWorld.elements))
 assert.equal(am.length,bm.length)
 assert.ok(am.every((v,i)=>Math.abs(v-bm[i])<1e-9),'Every body part retains the same transform')
}
const original=THREE.Object3D.prototype.updateWorldMatrix;let calls=0
THREE.Object3D.prototype.updateWorldMatrix=function(...args){calls++;return original.apply(this,args)}
let before,after
try{old.pose(b,samples[3]);before=calls;calls=0;pose(a,samples[3]);after=calls}finally{THREE.Object3D.prototype.updateWorldMatrix=original}
assert.ok(before>0);assert.equal(after,0,'No repeated parent-chain updates while checking ground contact')
const measure=(fn,rig)=>{const times=[];for(let r=0;r<7;r++){const t=performance.now();for(let i=0;i<1600;i++)fn(rig,samples[i%400]);times.push(performance.now()-t)}return times.sort((x,y)=>x-y)[3]}
const report={posesCompared:400,parentUpdatesBefore:before,parentUpdatesAfter:after,baselineMedianMs:measure(old.pose,b),optimizedMedianMs:measure(pose,a),batchSize:1600,scope:'CPU rig only; not rendered FPS or physical mobile performance'}
fs.mkdirSync('test-results/futebol-3d',{recursive:true});fs.writeFileSync('test-results/futebol-3d/pose-custo.json',JSON.stringify(report,null,2))
console.log('PASS: identical rig transforms, fewer redundant updates:',JSON.stringify(report))
