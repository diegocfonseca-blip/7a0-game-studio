import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {enquadramentoFutebol} from '../../src/escalacao/presidencia-enquadramento-futebol.ts';
import {criarCameraPartidaContinua} from '../../src/escalacao/presidencia-camera-partida-continua.ts';

const modes=['broadcast','tele','wide','goal','tactical'],aspects=[390/844,1,16/9,2.4];
let fitCases=0,trackingFrames=0,maxTrackingX=0,maxTrackingY=0;
const project=(camera,point)=>new Vector3(point.x,point.y,point.z).project(camera);
function assertVisible(camera,point,label,x=.96,y=.94){
 const p=project(camera,point);assert.ok(p.z>-1&&p.z<1&&Math.abs(p.x)<x&&Math.abs(p.y)<y,`${label}: ${JSON.stringify(p)}`);return p;
}
function applyFit(camera,fit){camera.fov=fit.fov;camera.updateProjectionMatrix();camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld(true)}
for(const aspect of aspects)for(const mode of modes)for(const [x,z]of [[0,0],[-53,-34],[-53,34],[53,-34],[53,34]])for(const y of [.11,8,20]){
 const camera=new PerspectiveCamera(38,aspect,.12,4000),ball={x,y,z};
 const subjects=[{mx:x-1,mz:z-1},{mx:x+1,mz:z+1},{mx:x,mz:z}];
 const fit=enquadramentoFutebol(camera,ball,subjects,mode);applyFit(camera,fit);
 assertVisible(camera,ball,`${mode}/${aspect}/${x}/${z}/${y}`);
 for(const subject of subjects)for(const height of [0,1.78])assertVisible(camera,{x:subject.mx,y:height,z:subject.mz},`${mode} relevant athlete`);
 assert.ok(fit.distance>0&&fit.distance<900);assert.equal(fit.preset,mode);
 if(mode==='goal'){assert.ok(camera.position.x>=61,'goal camera remains beyond the fixed goal line');assert.ok(camera.position.y<55,'far-half action does not lift the goal rig into a drone view')}
 if(mode==='tactical')for(const gx of [-52.5,52.5])for(const gz of [-34,34])assertVisible(camera,{x:gx,y:0,z:gz},'tactical whole pitch');
 fitCases++;
}

// Different presets genuinely change the spectator's view, rather than only
// renaming the same high map camera. Tele must make a nearby player larger.
const projectedHeights={};
for(const mode of modes){const c=new PerspectiveCamera(38,16/9,.12,4000),fit=enquadramentoFutebol(c,{x:0,y:.11,z:0},[],mode);applyFit(c,fit);projectedHeights[mode]=(project(c,{x:0,y:1.78,z:0}).y-project(c,{x:0,y:0,z:0}).y)*360}
assert.ok(projectedHeights.tele>projectedHeights.broadcast*1.3);
assert.ok(projectedHeights.broadcast>projectedHeights.wide*1.3);

// At 2fps a paused view still consumes elapsed transition time; the map's
// original position, focus and lens are all restored when leaving a preset.
for(const fps of [2,10,30,60]){
 const camera=new PerspectiveCamera(31,390/844,.12,4000);camera.position.set(220,180,300);
 const controls={target:new Vector3(45,0,8)},initial=camera.position.clone(),focus=controls.target.clone(),ctl=criarCameraPartidaContinua(camera,controls,()=>{});
 const ball=Object.freeze({x:12,y:3,z:-3}),subjects=Object.freeze([Object.freeze({mx:11,mz:-3}),Object.freeze({mx:13,mz:-2})]);
 let now=0;
 for(const mode of modes){ctl.setMode(mode);for(let i=0;i<fps*4;i++)ctl.update(ball,now+=1000/fps,subjects);assert.equal(ctl.inspect().moving,false,`${mode} settles at ${fps}fps`);assert.equal(ctl.inspect().framing.visible,true)}
 ctl.setMode('free');for(let i=0;i<fps*4;i++)ctl.update(ball,now+=1000/fps,subjects);
 assert.equal(ctl.transitioning,false);assert.ok(camera.position.distanceTo(initial)<1e-6);assert.ok(controls.target.distanceTo(focus)<1e-6);assert.equal(camera.fov,31);
 ctl.setMode('broadcast');ctl.explore();const manual=camera.position.clone();ctl.update(ball,now+=1000,subjects);assert.equal(ctl.inspect().mode,'free');assert.deepEqual(camera.position,manual);
}

// Follow a ground pass, direction reversal and lofted continuation without
// waiting for a stopped ball to prove that the shot remains readable.
for(const aspect of [390/844,16/9])for(const mode of ['broadcast','tele','wide','goal'])for(const fps of [10,60]){
 const camera=new PerspectiveCamera(38,aspect,.12,4000),controls={target:new Vector3()},ctl=criarCameraPartidaContinua(camera,controls,()=>{});
 camera.position.set(0,120,150);ctl.setMode(mode);let now=0;
 const ballAt=t=>({x:-38+76*(.5-.5*Math.cos(t*Math.PI/4)),y:.11+8*Math.sin(Math.PI*Math.min(1,t/8))**2,z:21*Math.sin(t*Math.PI/4)});
 for(let i=0;i<fps*4;i++)ctl.update(ballAt(0),now+=1000/fps);
 for(let i=0;i<=fps*8;i++){
  const t=i/fps,ball=ballAt(t),subjects=[{mx:ball.x-1,mz:ball.z-1},{mx:ball.x+1,mz:ball.z+1}];
  ctl.update(ball,now+=1000/fps,subjects);const p=assertVisible(camera,ball,`moving ${mode}/${aspect}/${fps}/${t}`);maxTrackingX=Math.max(maxTrackingX,Math.abs(p.x));maxTrackingY=Math.max(maxTrackingY,Math.abs(p.y));trackingFrames++;
  if(mode==='goal'){assert.ok(camera.position.x>=61,'moving goal camera stays behind the goal');assert.ok(camera.position.y<55,'moving goal camera stays at spectator height')}
 }
}

// A player alternating across the edge of the local fitting group must not
// make the camera repeatedly zoom in, then out on every stride.
{
 const camera=new PerspectiveCamera(38,390/844,.12,4000),controls={target:new Vector3()},ctl=criarCameraPartidaContinua(camera,controls,()=>{}),ball={x:0,y:.11,z:0};
 camera.position.set(0,120,150);ctl.setMode('broadcast');const samples=[];
 for(let i=0;i<360;i++){ctl.update(ball,i*1000/60,i%30<15?[{mx:12,mz:0}]:[]);if(i>240)samples.push(ctl.inspect().distance)}
 assert.ok(Math.max(...samples)-Math.min(...samples)<.1,'zoom hysteresis suppresses boundary pumping');
}

// Match-paused RAF only advances while the camera says it is transitioning.
// Resizing immediately after a render used to produce a sub-centimetre first
// step, clear moving too early, and permanently strand the ball offscreen.
let pausedResizeCases=0;
for(const mode of modes)for(const ball of [{x:52,y:.11,z:33},{x:-52,y:8,z:-33}]){
 const camera=new PerspectiveCamera(38,16/9,.12,4000),controls={target:new Vector3()},ctl=criarCameraPartidaContinua(camera,controls,()=>{});
 camera.position.set(0,120,150);ctl.setMode(mode);let now=0;
 const settle=()=>{let frames=0;while(ctl.transitioning&&frames<1200){ctl.update(ball,now+=1000/60);frames++}assert.ok(frames<1200,`${mode} RAF converges finitely`);assert.equal(ctl.transitioning,false);assert.equal(ctl.inspect().zoomPending,false);assertVisible(camera,ball,`${mode} paused resize`);return frames};
 ctl.update(ball,now);settle();
 for(const aspect of [390/844,16/9]){
  const previousDistance=ctl.inspect().distance;camera.aspect=aspect;camera.updateProjectionMatrix();ctl.update(ball,now+=.01);
  const required=enquadramentoFutebol(camera,ball,[],mode).distance;
  if(Math.abs(previousDistance-required)>.1&&(required>previousDistance||required<previousDistance*.86))assert.equal(ctl.transitioning,true,`${mode} pending zoom keeps paused RAF alive`);
  settle();
  if(required>previousDistance)assert.ok(Math.abs(ctl.inspect().distance-required)<.021,`${mode} expansion reaches the actual new fit`);
  else assert.ok(ctl.inspect().distance<=required/.86+.03,`${mode} delayed contraction completes`);
  pausedResizeCases++;
 }
}
console.log({fitCases,trackingFrames,pausedResizeCases,maxTrackingX,maxTrackingY,projectedPlayerHeightsAt720px:projectedHeights,pausedConvergenceAtFPS:[2,10,30,60],mapPositionFocusLensRestored:true,zoomBoundaryStable:true,gameEngineAccess:false});
