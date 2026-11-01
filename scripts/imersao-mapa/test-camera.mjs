import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts';
import {criarCameraPartidaContinua} from '../../src/escalacao/presidencia-camera-partida-continua.ts';
const camera=new PerspectiveCamera(38,326/746,.12,4000),ball=Object.freeze({x:0,y:.11,z:0}),players=Object.freeze([{mx:0,mz:0},{mx:11,mz:0},{mx:-12,mz:0}]);
const fit=enquadramentoFutebol(camera,ball,players,'broadcast');assert.equal(fit.subjects,1,'Far support must not widen the portrait close action');camera.position.copy(fit.position);camera.fov=fit.fov;camera.updateProjectionMatrix();camera.lookAt(fit.target);camera.updateMatrixWorld(true);
const screen=p=>new Vector3(...p).project(camera),height=(screen([0,1.78,0]).y-screen([0,0,0]).y)*746/2;assert(height>35,'Readable full player size at actual mobile map dimensions');
const controls={target:new Vector3()},ctl=criarCameraPartidaContinua(camera,controls,()=>{});ctl.setMode('broadcast');let now=0;const fovs=[];
for(let i=0;i<500;i++){ctl.update(ball,now+=1000/60,i%30<15?[{mx:8.4,mz:0}]:[]);if(i>300)fovs.push(camera.fov)}
assert(Math.max(...fovs)-Math.min(...fovs)<.1,'Lens, not just camera distance, must resist a player crossing the fit boundary');
console.log({mobilePlayerPixels:height,lensVariation:Math.max(...fovs)-Math.min(...fovs),onlyCameraChanged:true});
for(const rate of [2,4])for(const fps of [10,60]){
 const cam=new PerspectiveCamera(38,326/746,.12,4000),control={target:new Vector3()},c=criarCameraPartidaContinua(cam,control,()=>{});cam.position.set(0,100,120);c.setMode('broadcast');let time=0;
 const ballAt=t=>({x:-24+48*(.5-.5*Math.cos(t*Math.PI/2)),y:.11+4*Math.sin(t*Math.PI/4)**2,z:10*Math.sin(t*Math.PI/2)});
 for(let i=0;i<fps*4;i++)c.update(ballAt(0),time+=1000/fps);
 for(let i=0;i<=fps*4/rate;i++){const b=ballAt(i/fps*rate);c.update(b,time+=1000/fps,[{mx:b.x-1,mz:b.z-1}]);const v=new Vector3(b.x,b.y,b.z).project(cam);assert(Math.abs(v.x)<.96&&Math.abs(v.y)<.94&&v.z>-1&&v.z<1,'Ball visible in accelerated play '+rate+'x/'+fps+'fps: '+JSON.stringify(v))}
}
console.log('PASS moving ball at 2x/4x, low and normal frame rates');
