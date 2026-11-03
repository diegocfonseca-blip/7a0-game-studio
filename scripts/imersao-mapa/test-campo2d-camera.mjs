import assert from 'node:assert/strict'
import {PerspectiveCamera,Vector3} from 'three'
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts'
import {criarCameraPartidaContinua} from '../../src/escalacao/presidencia-camera-partida-continua.ts'

for(const aspect of [320/740,390/844,1,4/3,16/9,21/9]){
 const camera=new PerspectiveCamera(46,aspect,.12,4000),ball={x:48,y:.11,z:30}
 const fit=enquadramentoFutebol(camera,ball,[],'field2d')
 camera.position.copy(fit.position);camera.fov=fit.fov;camera.lookAt(fit.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true)
 for(const x of [-56,56])for(const z of [-37,37]){
  const p=new Vector3(x,0,z).project(camera)
  assert(Math.abs(p.x)<=.87&&Math.abs(p.y)<=.81&&p.z<1,'The entire pitch fits '+aspect)
 }
 const control={target:fit.target.clone(),enabled:true},controller=criarCameraPartidaContinua(camera,control,()=>{})
 controller.setMode('field2d');assert.equal(control.enabled,false)
 for(let i=0;i<200;i++)controller.update(ball,i*16,[],undefined,'goal')
 const before=camera.position.distanceTo(control.target)
 assert(controller.zoomFixed(.8))
 for(let i=200;i<400;i++)controller.update({...ball,x:-48},i*16,[],undefined,'goal')
 assert(Math.abs(camera.position.distanceTo(control.target)/before-.8)<.001)
 assert.equal(controller.inspect().mode,'field2d','Goal replays must not force a different map view')
 assert(control.target.distanceTo(fit.target)<.001,'Zoom preserves the pitch centre')
 controller.setMode('free');assert.equal(control.enabled,true)
}
console.log('PASS full pitch in six viewports, manual zoom, replay and free-map controls')
