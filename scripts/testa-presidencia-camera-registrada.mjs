import assert from 'node:assert/strict'
import {matrizCameraRegistrada} from '../src/escalacao/presidencia-camera-registrada.ts'
import {BANCO_Z,TECNICO_Z,FUNDO_AREA_TECNICA_Z} from '../src/escalacao/presidencia-area-tecnica.ts'
const internal=[[220,400],[1290,400],[108,818],[1415,818]],map=[[588,311],[911,312],[575,425],[933,425]]
for(const corners of [internal,map]){
 const m=matrizCameraRegistrada(corners)
 const project=(x,y,z)=>{const p=[x,y,z,1],v=[0,1,2,3].map(r=>p.reduce((s,n,c)=>s+n*m[r*4+c],0));return {x:(v[0]/v[3]+1)*768,y:(1-v[1]/v[3])*512,depth:v[2]/v[3]}}
 const positions=[[-52.5,-34],[52.5,-34],[-52.5,34],[52.5,34]]
 positions.forEach(([x,z],i)=>{const p=project(x,0,z);assert.ok(Math.hypot(p.x-corners[i][0],p.y-corners[i][1])<1e-8)})
 for(const z of [-34,0,34]){const foot=project(0,0,z),head=project(0,1.8,z);assert.ok(head.y<foot.y);assert.ok(Math.abs(foot.depth)<1)}
 assert.ok(project(0,0,34).depth<project(0,0,-34).depth,'Near-side bodies win the depth test')
 assert.ok(project(18,0,BANCO_Z).y<project(18,0,-34).y,'Bench remains behind the far touchline')
 assert.ok(project(18,0,TECNICO_Z).y>project(18,0,BANCO_Z).y,'Coach is in front of bench')
}
assert.ok(BANCO_Z-.43>FUNDO_AREA_TECNICA_Z&&TECNICO_Z< -34,'Technical area stays within the apron')
assert.throws(()=>matrizCameraRegistrada([[0,0],[0,0],[0,0],[0,0]]))
console.log('PASS: four registered corners, body height, near/far depth, benches and coaches in both stadium views.')
