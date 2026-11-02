import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {criarCameraPartidaContinua} from '../../src/escalacao/presidencia-camera-partida-continua.ts';
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts';

let frames=0;
for(const aspect of [390/752,590/840,1,16/9])for(const fps of [10,30,60]){
 const camera=new PerspectiveCamera(38,aspect,.12,4000),controls={target:new Vector3(),enabled:true};
 camera.position.set(130,160,220);const start=camera.position.clone(),ctl=criarCameraPartidaContinua(camera,controls,()=>{});
 const seed={x:-35,y:.11,z:0};let now=0;
 ctl.setMode('fixed');assert.equal(controls.enabled,false);
 for(let i=0;i<fps*4;i++)ctl.update(seed,now+=1000/fps);
 const offset=camera.position.clone().sub(controls.target),lens=camera.fov;
 const ballAt=t=>({x:-42+84*t/8,y:.11+14*Math.sin(t*Math.PI/8)**2,z:30*Math.sin(t*Math.PI/4)});
 for(let i=0;i<=fps*8;i++){
  const ball=Object.freeze(ballAt(i/fps)),subjects=Object.freeze([Object.freeze({mx:ball.x+8,mz:ball.z})]);
  ctl.update(ball,now+=1000/fps,subjects,undefined,i>fps*4?'goal':undefined,i>fps*4?-1:1);
  assert(camera.position.clone().sub(controls.target).distanceTo(offset)<1e-5,'tracking translates without rotating or changing distance');
  assert.equal(camera.fov,lens,'no automatic lens pumping');
  assert.equal(ctl.inspect().framing.visible,true,'ball remains visible across the pitch');frames++;
 }
 assert(ctl.zoomFixed(.8));const zoom=ctl.inspect().fixedZoom;
 for(let i=0;i<fps*4;i++)ctl.update(seed,now+=1000/fps);
 assert(Math.abs(camera.position.distanceTo(controls.target)-offset.length()*.8)<1e-4);
 assert(camera.position.clone().sub(controls.target).normalize().distanceTo(offset.clone().normalize())<1e-6);
 assert.equal(ctl.zoomFixed(NaN),false);assert.equal(ctl.zoomFixed(-1),false);
 ctl.setMode('tactical');assert.equal(controls.enabled,true);
 ctl.setMode('fixed');assert.equal(ctl.inspect().fixedZoom,zoom,'user zoom survives switching cameras');
 camera.aspect=aspect<1?16/9:390/752;camera.updateProjectionMatrix();
 for(let i=0;i<fps*4;i++)ctl.update(seed,now+=1000/fps);
 assert.equal(ctl.inspect().fixedZoom,zoom,'resize preserves user zoom');assert(ctl.inspect().framing.visible);
 ctl.setMode('free');for(let i=0;i<fps*4;i++)ctl.update(seed,now+=1000/fps);
 assert(camera.position.distanceTo(start)<1e-5);assert.equal(camera.fov,38);assert.equal(controls.enabled,true);assert.equal(ctl.zoomFixed(.8),false);
 ctl.setMode('fixed');ctl.explore();assert.equal(controls.enabled,true);
}
// Ground balls at all corners and high balls stay in view even at closest zoom.
for(const aspect of [.4,.7,1,16/9])for(const x of [-55,0,55])for(const z of [-36,0,36])for(const y of [.11,20]){
 const camera=new PerspectiveCamera(38,aspect,.12,4000),ball={x,y,z},fit=enquadramentoFutebol(camera,ball,[],'fixed');
 camera.fov=fit.fov;camera.position.copy(fit.target).addScaledVector(fit.direction,fit.distance*.7);camera.lookAt(fit.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<.96&&Math.abs(p.y)<.94&&p.z<1&&p.z>-1,JSON.stringify({aspect,ball,p}));
}
console.log('PASS',JSON.stringify({frames,constantAngleAndDistance:true,userZoom:true,replayKeepsFixedView:true,resize:true,mapRestored:true,engineAccess:false}));
