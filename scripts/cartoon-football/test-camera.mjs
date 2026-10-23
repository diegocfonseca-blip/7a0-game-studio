import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts';
import {criarCameraPartidaContinua} from '../../src/escalacao/presidencia-camera-partida-continua.ts';
let cases=0;
for(const aspect of [390/844,844/390,16/9])for(const fov of [38,45])for(const [x,z]of [[0,0],[-52,33],[52,-33]])for(const tactical of [false,true]){
 const c=new PerspectiveCamera(fov,aspect,.1,1500),ball={x,y:.11,z},players=Array.from({length:22},(_,i)=>({mx:x+(i%6-3)*4,mz:z+(i%4-2)*4})),fit=enquadramentoFutebol(c,ball,players,tactical);
 c.position.copy(fit.position);c.lookAt(fit.target);c.updateMatrixWorld(true);const p=new Vector3(x,.11,z).project(c);assert.ok(Math.abs(p.x)<.81&&Math.abs(p.y)<.69&&p.z<1);assert.ok(fit.distance<900);cases++;
}
const c=new PerspectiveCamera(38,16/9,.1,1500);c.position.set(180,200,230);const controls={target:new Vector3(0,0,0)},saved=c.position.clone(),ctl=criarCameraPartidaContinua(c,controls,()=>{}),ball={x:12,y:.11,z:-3};let now=0;
for(const mode of ['broadcast','tactical','broadcast','free']){ctl.setMode(mode);for(let i=0;i<300;i++)ctl.update(ball,now+=100,[]);assert.equal(ctl.inspect().mode,mode);if(mode!=='free')assert.equal(ctl.inspect().framing.visible,true)}
assert.ok(c.position.distanceTo(saved)<.01);assert.ok(controls.target.length()<.01);ctl.setMode('broadcast');ctl.explore();assert.equal(ctl.inspect().mode,'free');console.log({cameraCases:cases,manualPoseRestored:true,sourceEngineAccess:false});
