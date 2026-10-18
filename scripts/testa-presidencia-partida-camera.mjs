import assert from 'node:assert/strict'
import {alturaMaximaCampoPartida,dimensoesCameraPartida,enquadrarCampoPartida,cameraInternaDaPartida} from '../src/escalacao/presidencia-partida-camera.ts'
import {CAMPO_INTERNO,CAMPO_MAPA} from '../src/escalacao/presidencia-partida-geometria.ts'
import {aproximarMapa,limitarVistaMapa} from '../src/escalacao/presidencia-estadio-mapa-model.ts'
let checked=0
for(const width of [280,342,390,600,900,1200,1600])for(const height of [320,420,608,720,960])for(const completed of [false,true]){
 const actualHeight=Math.min(height,alturaMaximaCampoPartida(width)),d=dimensoesCameraPartida(width,actualHeight),internal=cameraInternaDaPartida(completed,d),corners=internal?CAMPO_INTERNO:CAMPO_MAPA,view=enquadrarCampoPartida(corners,d)
 assert(view.zoom>=1);if(width<height)assert.equal(internal,false)
 for(const [x,y] of corners){const px=width/2+view.x+(x/1536-.5)*d.world.width*view.zoom,py=actualHeight/2+view.y+(y/1024-.5)*d.world.height*view.zoom;assert(px>=0&&px<=width,`baliza cortada ${width}x${height}: ${px}`);assert(py>=0&&py<=actualHeight,`linha cortada ${width}x${height}: ${py}`)}
 for(const candidate of [view,aproximarMapa(view,.01,{x:50,y:50},width,actualHeight,6,d.world,d.minZoom),limitarVistaMapa({zoom:1,x:1e5,y:-1e5},width,actualHeight,6,d.world,d.minZoom)]){
  assert(d.world.width*candidate.zoom/2-candidate.x>=width/2-1e-8)
  assert(d.world.width*candidate.zoom/2+candidate.x>=width/2-1e-8)
  assert(d.world.height*candidate.zoom/2-candidate.y>=actualHeight/2-1e-8)
  assert(d.world.height*candidate.zoom/2+candidate.y>=actualHeight/2-1e-8)
 }
 checked++
}
assert.equal(cameraInternaDaPartida(true,dimensoesCameraPartida(1200,720)),true)
console.log(`PASS ${checked} enquadramentos: ambas balizas, cover sem faixas, zoom-out/arraste limitados, interna desktop e aérea portrait.`)
