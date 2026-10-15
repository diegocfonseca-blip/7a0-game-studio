import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {registerHooks} from 'node:module'
import * as THREE from 'three'
import {criarDetalheCadeirasComplexo} from '../src/escalacao/presidencia-complexo-cadeiras-lod.ts'
const source=fileURLToPath(new URL('../src/escalacao/',import.meta.url))
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const candidate=fileURLToPath(new URL(specifier,context.parentURL));if(fs.existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}}return next(specifier,context)},load(url,context,next){if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return next(url,context)}})
{
 const empty=new THREE.Group(),lod=criarDetalheCadeirasComplexo(empty,[],[])
 assert.equal(empty.children.length,0);assert.equal(lod.inspect().count,0);assert.equal(lod.update(new THREE.PerspectiveCamera()),false);lod.dispose()
}
{
const root=new THREE.Group(),records=[],ids=[[],[],[]],matrices=[[],[],[]],materials=['#c2b9a3','#677078','#953e2b'].map(color=>new THREE.MeshStandardMaterial({color})),m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(1,1,1)
for(let row=0;row<25;row++)for(let column=0;column<20;column++){
 const id=`cadeiras:lower:${row}:${column}`,position={x:(column-9.5)*.59,y:row*.48+.45,z:row*.9},heading=Math.PI
 const seat={id,sector:'cadeiras',tier:'lower',row,column,position,heading,seatHeight:.43};records.push(seat)
 const color=(row+column)%3;q.setFromAxisAngle(up,heading);m.compose(new THREE.Vector3(position.x,position.y,position.z),q,scale)
 matrices[color].push(m.clone());ids[color].push(id)
}
const canonical=new Map(records.map(s=>[s.id,s])),before=JSON.stringify(records)
const primitive=new THREE.BufferGeometry();primitive.setAttribute('position',new THREE.Float32BufferAttribute([-.225,.43,.18,.225,.43,.18,.225,.43,-.2,-.225,.43,-.2,-.225,.91,-.29,.225,.91,-.29,-.225,.38,.18,.225,.38,.18],3));primitive.setIndex([0,1,2,0,2,3,3,2,5,3,5,4,6,7,1,6,1,0]);primitive.computeVertexNormals()
const lots=matrices.map((values,i)=>{const mesh=new THREE.InstancedMesh(primitive,materials[i],values.length);values.forEach((m,index)=>mesh.setMatrixAt(index,m));mesh.computeBoundingSphere();root.add(mesh);return{mesh,ids:ids[i]}})
const lod=criarDetalheCadeirasComplexo(root,records,lots),detail=root.children.filter(m=>m.userData.chairRole?.startsWith('detail')),uuids=detail.map(m=>m.uuid),camera=new THREE.PerspectiveCamera(60,1.4,.1,1000)
assert.equal(detail.length,2)
assert.equal(detail.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),56)
const near=()=>{camera.position.set(0,5,-7);camera.lookAt(0,5,7);camera.updateProjectionMatrix()}
function check(){
 const seen=new Set();for(const mesh of root.children.filter(m=>m.userData.chairRole!=='detail-support'))for(let i=0;i<mesh.count;i++){
  const id=mesh.userData.seatIds[i];assert(canonical.has(id));assert(!seen.has(id),`duplicated:${id}`);seen.add(id)
  mesh.getMatrixAt(i,m);const seat=canonical.get(id),actual=m.elements
  assert.equal(actual[12],Math.fround(seat.position.x));assert.equal(actual[13],Math.fround(seat.position.y));assert.equal(actual[14],Math.fround(seat.position.z))
  const expected=new THREE.Matrix4().compose(new THREE.Vector3(seat.position.x,seat.position.y,seat.position.z),new THREE.Quaternion().setFromAxisAngle(up,seat.heading),scale)
  assert.deepEqual(actual,expected.elements.map(Math.fround))
 }
 assert.equal(seen.size,records.length);assert(lod.inspect().count<=96);assert.equal(lod.inspect().far+lod.inspect().count,records.length)
 assert.deepEqual(detail.map(m=>m.uuid),uuids);assert.equal(JSON.stringify(records),before)
 const shell=detail.find(m=>m.userData.chairRole==='detail-shell'),color=new THREE.Color()
 for(let i=0;i<shell.count;i++){const id=shell.userData.seatIds[i],batch=ids.findIndex(list=>list.includes(id));shell.getColorAt(i,color);for(const key of ['r','g','b'])assert(Math.abs(color[key]-materials[batch].color[key])<1e-7)}
}
near();assert(lod.update(camera));assert.equal(lod.inspect().count,96);check()
const stable=lod.inspect();for(let i=0;i<100;i++)assert.equal(lod.update(camera),false);assert.deepEqual(lod.inspect(),stable)
for(let i=0;i<20;i++){camera.position.x=Math.sin(i*.5)*7;camera.position.z=-7+i*.7;camera.lookAt(0,5,10);lod.update(camera);check()}
camera.fov=30;camera.updateProjectionMatrix();lod.update(camera);check()
camera.position.set(0,500,600);camera.lookAt(0,0,0);assert(lod.update(camera));assert.equal(lod.inspect().count,0);assert(lots.every((l,i)=>l.mesh.count===ids[i].length));check()
near();lod.update(camera);check()
for(const mesh of detail){const bounds=new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);assert(bounds.min.y>=-.000001&&bounds.max.y<=.910001);assert(bounds.min.x>=-.225001&&bounds.max.x<=.225001);assert(bounds.min.z>=-.290001&&bounds.max.z<=.180001);for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)assert(Number.isFinite(value))}
const disposed=new Set();for(const mesh of detail){mesh.geometry.addEventListener('dispose',()=>disposed.add(mesh.geometry));mesh.material.addEventListener('dispose',()=>disposed.add(mesh.material))}
lod.dispose();assert.equal(disposed.size,4);assert.equal(root.children.length,3);assert(lots.every((l,i)=>l.mesh.count===ids[i].length));assert.equal(lod.update(camera),false);lod.dispose()
primitive.dispose();materials.forEach(material=>material.dispose())
console.log('PASS LOD: 96 seats,56tri,2meshes; exact poses/colors, one representation, camera cache, repeated zoom/orbit/restore, bounded footprint and dispose')
}
{
const {criarArquiteturaComplexo}=await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const {complexoDoEstadio}=await import(source+'presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import(source+'estadiodata.ts')
const scene=new THREE.Scene(),save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(s=>s.k),roofClosed:true},a=criarArquiteturaComplexo(scene,complexoDoEstadio(save)),camera=new THREE.PerspectiveCamera(38,1.5,.12,4000)
const stats=()=>{let triangles=0,meshes=0;a.root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof THREE.InstancedMesh?o.count:1)});return{triangles,meshes}}
const base=stats();assert(base.triangles<=186000,'caixas de escada/corrimãos excederam orçamento revisto')
const results=[]
for(const access of a.seatAccess){const p=access.standing,h=access.seat.heading;camera.position.set(p.x+Math.sin(h)*5+Math.cos(h)*2,p.y+2.7,p.z+Math.cos(h)*5-Math.sin(h)*2);camera.lookAt(p.x,p.y+1,p.z);a.updateSeats(camera);const state=a.inspectSeatDetail();assert(state.count>0);assert(state.selected.includes(access.seatId));if(access.seat.tier==='lower'&&access.seat.row===0)assert.equal(state.count,96);else assert(state.count>0&&state.count<=96);assert.equal(stats().triangles,base.triangles+state.count*50);assert(stats().triangles<=190800);assert.equal(stats().meshes,22);
const all=new Set();for(const mesh of a.root.children.filter(mesh=>mesh instanceof THREE.InstancedMesh&&mesh.userData.chairRole!=='detail-support'))for(let i=0;i<mesh.count;i++){const id=mesh.userData.seatIds[i];assert(!all.has(id),'cadeira duplicada entre LODs');all.add(id)}assert.deepEqual(all,new Set(a.seats.map(seat=>seat.id)));
results.push({side:access.side,...state,...stats()})}
camera.position.set(0,600,700);camera.lookAt(0,0,0);a.updateSeats(camera);assert.equal(a.inspectSeatDetail().count,0);assert.equal(stats().triangles,base.triangles)
a.dispose();assert.equal(scene.children.length,0)
console.log('PASS real architecture LOD',results.map(({selected,...r})=>r))

}
