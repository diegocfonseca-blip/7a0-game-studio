import assert from 'node:assert/strict'
import * as THREE from 'three'
import {janelaVisivel3D,matrizRecorte3D} from '../src/escalacao/presidencia-janela-3d.ts'
import {matrizCameraRegistrada} from '../src/escalacao/presidencia-camera-registrada.ts'
const corners=[[588,311],[911,312],[575,425],[933,425]]
const projection=new THREE.Matrix4().set(...matrizCameraRegistrada(corners))
for(const viewport of [{width:390,height:640},{width:1100,height:720}])for(const zoom of [.4,1,4,12])for(const x of [-120,0,120]){
 const world={width:1100,height:1100/1.5},view={zoom,x,y:30},crop=janelaVisivel3D(view,viewport,world)
 const cropped=new THREE.Matrix4().set(...matrizRecorte3D(crop)).multiply(projection)
 const origin={x:viewport.width/2+view.x-world.width*zoom/2,y:viewport.height/2+view.y-world.height*zoom/2}
 for(const position of [[0,0,0],[-52.5,0,-34],[52.5,0,34],[18,1.8,-40]]){
  const point=new THREE.Vector3(...position).applyMatrix4(projection),local=new THREE.Vector3(...position).applyMatrix4(cropped)
  const expected={x:origin.x+(point.x+1)/2*world.width*zoom,y:origin.y+(1-point.y)/2*world.height*zoom}
  const actual={x:origin.x+(crop.left+(local.x+1)/2*crop.width)*world.width*zoom,y:origin.y+(crop.top+(1-local.y)/2*crop.height)*world.height*zoom}
  assert.ok(Math.hypot(expected.x-actual.x,expected.y-actual.y)<1e-8,'Cropping preserves field/body position under zoom and pan')
 }
 assert.ok(crop.width*world.width*zoom<=viewport.width+1e-8,'Rendering width never exceeds the visible viewport')
 assert.ok(crop.height*world.height*zoom<=viewport.height+1e-8)
}
console.log('PASS: visible rendering window, mobile/desktop, pan and 12x zoom preserve stadium registration without stretching.')
