import assert from 'node:assert/strict'
import {MOUSE,TOUCH,PerspectiveCamera,Vector3} from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {criarNavegacaoComplexo,coberturaTerrenoComplexo,LIMITES_TERRENO_COMPLEXO} from '../src/escalacao/presidencia-complexo-camera.ts'

const near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} ≠ ${b}`)
const vectorNear=(a,b,label)=>a.forEach((value,index)=>near(value,b[index],`${label}[${index}]`))
const camera=new PerspectiveCamera(38,1,.12,4000),controls=new OrbitControls(camera)
// OrbitControls itself runs its real spherical/zoom update on the CPU. A DOM
// surface is needed only for this helper's touch-action configuration; browser
// integration tests exercise actual pointers and wheel events separately.
const keyListeners=new Set()
controls.domElement={style:{},addEventListener:(type,listener)=>{if(type==='keydown')keyListeners.add(listener)},removeEventListener:(type,listener)=>{if(type==='keydown')keyListeners.delete(listener)}}
const key=(value,options={})=>{
 let prevented=false
 const event={key:value,target:controls.domElement,preventDefault:()=>{prevented=true},...options}
 for(const listener of keyListeners)listener(event)
 return prevented
}
let changes=0,gestures=0,refits=0
const navigation=criarNavegacaoComplexo({camera,controls,onChange:()=>changes++,onExplore:()=>gestures++})
const preset=()=>{refits++;controls.target.set(0,0,0);camera.position.set(0,350,450);camera.lookAt(controls.target)}
const position=()=>camera.position.toArray(),target=()=>controls.target.toArray()
const once=(action,label)=>{const before=changes;action();assert.equal(changes-before,1,`${label}: expected exactly one render`)}
const finite=()=>assert([...position(),...target()].every(Number.isFinite),'non-finite pose')
const covered=()=>{
 const coverage=coberturaTerrenoComplexo(camera),bounds=LIMITES_TERRENO_COMPLEXO
 assert(coverage,'an aerial corner sees sky instead of ground')
 for(const key of ['minX','minZ'])assert(coverage[key]>=bounds[key]-1e-5,`${key} leaves ground: ${coverage[key]}`)
 for(const key of ['maxX','maxZ'])assert(coverage[key]<=bounds[key]+1e-5,`${key} leaves ground: ${coverage[key]}`)
 finite()
}

assert.equal(controls.touches.ONE,TOUCH.PAN)
assert.equal(controls.touches.TWO,TOUCH.DOLLY_PAN)
assert.equal(controls.mouseButtons.LEFT,MOUSE.PAN)
assert.equal(controls.zoomToCursor,true)
assert.equal(controls.domElement.style.touchAction,'none')
navigation.setMode('rotate')
assert.equal(controls.touches.ONE,TOUCH.ROTATE)
assert.equal(controls.mouseButtons.LEFT,MOUSE.ROTATE)
assert.equal(controls.mouseButtons.RIGHT,MOUSE.PAN)
navigation.setMode('pan')

navigation.beginView({fitOnResize:true,terrainGuard:true})
once(()=>navigation.resize(1280,960,preset),'initial resize')
assert.equal(refits,1)
once(()=>navigation.resize(390,844,preset),'preset resize')
assert.equal(refits,2,'untouched preset should refit for portrait')
covered()
// A user pan must translate the camera and focus together. Resizing/fullscreen
// after exploration must keep that exact pose when it still fits the terrain.
camera.position.set(28,35,47);controls.target.set(15,0,22);controls.update()
controls.dispatchEvent({type:'start'})
const exploredPosition=position(),exploredTarget=target()
once(()=>navigation.resize(1280,960,preset),'explored resize')
assert.equal(refits,2,'resize reset a user-explored camera')
vectorNear(position(),exploredPosition,'explored position')
vectorNear(target(),exploredTarget,'explored target')
assert.equal(navigation.inspect().explored,true)

// Keyboard pan follows the camera's ground-plane orientation and moves focus
// and camera together. Only unmodified keys on the map itself are consumed.
const keyboardStart=position(),keyboardTarget=target()
for(const arrow of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'])once(()=>assert(key(arrow)),arrow)
vectorNear(position(),keyboardStart,'keyboard roundtrip position')
vectorNear(target(),keyboardTarget,'keyboard roundtrip target')
for(const modifier of ['ctrlKey','altKey','metaKey','shiftKey'])assert.equal(key('ArrowLeft',{[modifier]:true}),false)
assert.equal(key('ArrowLeft',{target:{}}),false)
assert.equal(key('Tab'),false);assert.equal(key('Home'),false)
vectorNear(position(),keyboardStart,'ignored shortcut position')
const beforeKeyZoom=camera.position.distanceTo(controls.target)
once(()=>assert(key('+',{shiftKey:true})),'physical Shift + zoom')
assert(camera.position.distanceTo(controls.target)<beforeKeyZoom,'main keyboard + should zoom even when typed with Shift')
assert(key('-'));near(camera.position.distanceTo(controls.target),beforeKeyZoom,'shifted keyboard zoom roundtrip')
for(const modifier of ['ctrlKey','altKey','metaKey'])assert.equal(key('+',{shiftKey:true,[modifier]:true}),false)
for(const value of ['=','-'])assert.equal(key(value,{shiftKey:true}),false)
assert(key('+'));assert(camera.position.distanceTo(controls.target)<beforeKeyZoom)
assert(key('-'));near(camera.position.distanceTo(controls.target),beforeKeyZoom,'keyboard zoom roundtrip')
assert(key('='));assert(key('-'))
vectorNear(target(),keyboardTarget,'keyboard zoom target')

// Repeated zoom buttons must respect a real minimum distance and retain the
// focus instead of rebuilding the scene or transporting the camera elsewhere.
for(let i=0;i<100;i++)once(()=>navigation.zoom(1),'zoom in, including limit')
near(camera.position.distanceTo(controls.target),5,'minimum zoom distance')
vectorNear(target(),exploredTarget,'zoom-in target')
for(let i=0;i<100;i++){once(()=>navigation.zoom(-1),'zoom out, including limit');covered()}
assert(camera.position.distanceTo(controls.target)<=1700+1e-6)
assert(gestures>=201)

let boundaryPoses=0
for(const aspect of [.34,.462,1,1.778,3.4])for(const azimuth of [0,.7,1.57,2.9,4.5,5.7])for(const requestedDistance of [6,180,1700]){
 navigation.beginView({fitOnResize:false,terrainGuard:true})
 camera.aspect=aspect;camera.updateProjectionMatrix()
 // Deliberately pan far beyond every edge and tilt almost to the horizon.
 const sign=boundaryPoses%2?-1:1
 controls.target.set(sign*2000,0,-sign*2500)
 camera.position.copy(controls.target).add(new Vector3(Math.sin(azimuth)*requestedDistance,.08*requestedDistance,Math.cos(azimuth)*requestedDistance))
 camera.lookAt(controls.target)
 const requestedDirection=camera.position.clone().sub(controls.target).normalize()
 navigation.constrain();controls.update();covered()
 const constrainedDirection=camera.position.clone().sub(controls.target).normalize()
 near(Math.atan2(constrainedDirection.x,constrainedDirection.z),Math.atan2(requestedDirection.x,requestedDirection.z),'boundary azimuth')
 assert(camera.position.y>=1.25-1e-6)
 boundaryPoses++
}

// A raised point of interest on an ultrawide display can project outside land
// even at radius 5. The fallback must steepen without changing azimuth.
for(const aspect of [3.4,5])for(const requestedDistance of [5,1700]){
 navigation.beginView({fitOnResize:false,terrainGuard:true})
 camera.aspect=aspect;camera.updateProjectionMatrix()
 controls.target.set(2000,35,-2000)
 const polar=Math.PI/2-38*Math.PI/360-.04,azimuth=.63
 const direction=new Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth))
 camera.position.copy(controls.target).addScaledVector(direction,requestedDistance);camera.lookAt(controls.target)
 navigation.constrain();controls.update();covered()
 const offset=camera.position.clone().sub(controls.target).normalize()
 near(Math.atan2(offset.x,offset.z),azimuth,'raised-focus azimuth')
 assert(Math.acos(offset.y)<polar,'raised-focus fallback did not steepen')
}

// Human-height compositions stay untouched through 60 m. Pulling back then
// raises the view progressively and latches aerial coverage at 120 m, including
// future zoom-ins and distance corrections at the edge of the regional map.
let humanTransitions=0
for(const aspect of [.462,1.7,3.4])for(const targetHeight of [1.6,15,35]){
 navigation.beginView({fitOnResize:false,terrainGuard:false})
 camera.aspect=aspect;camera.updateProjectionMatrix()
 const humanPolar=82*Math.PI/180,humanDirection=new Vector3(0,Math.cos(humanPolar),Math.sin(humanPolar))
 let previousPolar=humanPolar
 for(const distance of [5,30,60,70,80,90,100,110,120]){
  controls.target.set(0,targetHeight,-100)
  camera.position.copy(controls.target).addScaledVector(humanDirection,distance);camera.lookAt(controls.target)
  navigation.constrain();controls.update()
  const polar=Math.acos(camera.position.clone().sub(controls.target).normalize().y)
  assert(polar<=previousPolar+1e-6,'human zoom-out tilted back toward the horizon')
  if(distance<=60)near(polar,humanPolar,'close human preset changed')
  assert.equal(navigation.inspect().terrainGuard,distance>=120)
  previousPolar=polar
 }
 assert.equal(navigation.inspect().aerialExploration,true)
 assert(previousPolar<=55*Math.PI/180+1e-6)
 for(let i=0;i<30;i++){once(()=>navigation.zoom(-1),'human zoom out');covered();assert.equal(navigation.inspect().terrainGuard,true)}
 for(let i=0;i<30;i++){once(()=>navigation.zoom(1),'human zoom back in');covered();assert.equal(navigation.inspect().terrainGuard,true)}
 navigation.beginView({fitOnResize:false,terrainGuard:false})
 controls.target.set(0,targetHeight,-100);camera.position.copy(controls.target).addScaledVector(humanDirection,5);camera.lookAt(controls.target)
 navigation.constrain();controls.update()
 assert.equal(navigation.inspect().terrainGuard,false,'new human preset did not clear the aerial latch')
 near(Math.acos(camera.position.clone().sub(controls.target).normalize().y),humanPolar,'new human preset angle')
 humanTransitions++
}

// An interior/covered-pitch preset keeps its intentional eye-level composition;
// applying the aerial horizon restriction here would move above the roof.
navigation.beginView({fitOnResize:false,terrainGuard:false})
controls.target.set(-6.4,10,70.6);camera.position.set(1,11.1,76.8);camera.lookAt(controls.target)
const interiorPosition=position(),interiorTarget=target()
navigation.resize(390,844,preset)
vectorNear(position(),interiorPosition,'interior position')
vectorNear(target(),interiorTarget,'interior target')
assert.equal(navigation.inspect().coverage,null)
assert.equal(refits,2)

// Recovery is bounded even if an upstream gesture provides an invalid vector.
camera.position.x=NaN;controls.target.z=Infinity;navigation.constrain()
vectorNear(position(),interiorPosition,'recovered position')
vectorNear(target(),interiorTarget,'recovered target')
navigation.beginView({fitOnResize:true,terrainGuard:true})
navigation.resize(390,844,preset)
assert.equal(refits,3,'explicit preset should re-enable refitting')
assert.equal(navigation.inspect().explored,false)
covered()
const changesBeforeDispose=changes,gesturesBeforeDispose=gestures
navigation.dispose();controls.dispatchEvent({type:'change'});controls.dispatchEvent({type:'start'});navigation.zoom(1)
assert.equal(keyListeners.size,0,'disposed navigation retained its keyboard listener')
assert.equal(key('ArrowLeft'),false)
assert.equal(changes,changesBeforeDispose,'disposed navigation still rendered')
assert.equal(gestures,gesturesBeforeDispose,'disposed navigation still handled gestures')

// Use the real OrbitControls pointer handlers, with separate client/page
// coordinates and capture/bubble ordering. This reproduces its touch cursor
// bug after a page scroll; no private method is patched or called by the test.
class PointerSurface{
 style={};clientWidth=390;clientHeight=844;listeners=new Map()
 addEventListener(type,listener,options){
  const capture=options===true||!!options?.capture,list=this.listeners.get(type)??[]
  if(!list.some(item=>item.listener===listener&&item.capture===capture))list.push({listener,capture})
  this.listeners.set(type,list)
 }
 removeEventListener(type,listener,options){const capture=options===true||!!options?.capture;this.listeners.set(type,(this.listeners.get(type)??[]).filter(item=>item.listener!==listener||item.capture!==capture))}
 getRootNode(){return this}
 getBoundingClientRect(){return{left:0,top:0,width:this.clientWidth,height:this.clientHeight}}
 setPointerCapture(){}releasePointerCapture(){}
 send(type,properties){const event={type,target:this,preventDefault(){},...properties};for(const capture of [true,false])for(const item of [...(this.listeners.get(type)??[])])if(item.capture===capture)item.listener(event)}
}
const touchScenario=(scrollY,center)=>{
 const surface=new PointerSurface(),cam=new PerspectiveCamera(38,390/844,.12,4000)
 cam.position.set(0,100,160);cam.lookAt(0,0,0)
 const orbit=new OrbitControls(cam,surface),nav=criarNavegacaoComplexo({camera:cam,controls:orbit,onChange:()=>{}})
 nav.beginView({fitOnResize:false,terrainGuard:true});nav.constrain();orbit.update()
 const at=screen=>{
  cam.updateMatrixWorld()
  const direction=new Vector3(screen.x/390*2-1,-screen.y/844*2+1,.5).unproject(cam).sub(cam.position).normalize()
  return cam.position.clone().addScaledVector(direction,(orbit.target.y-cam.position.y)/direction.y)
 }
 const pointer=(type,id,x,y)=>surface.send(type,{pointerType:'touch',pointerId:id,clientX:x,clientY:y,pageX:x,pageY:y+scrollY})
 const initialAnchor=at(center),initialDistance=cam.position.distanceTo(orbit.target)
 pointer('pointerdown',1,center.x-30,center.y);pointer('pointerdown',2,center.x+30,center.y)
 assert.equal(orbit.zoomToCursor,false,'touch used the page-coordinate cursor zoom')
 for(const half of [40,50,60]){pointer('pointermove',1,center.x-half,center.y);pointer('pointermove',2,center.x+half,center.y)}
 vectorNear(at(center).toArray(),initialAnchor.toArray(),'pinch world anchor')
 near(cam.position.distanceTo(orbit.target),initialDistance/2,'real pinch distance')
 pointer('pointerup',1,center.x-60,center.y);pointer('pointerup',2,center.x+60,center.y)
 assert.equal(orbit.zoomToCursor,true,'pointerup did not restore wheel cursor zoom')
 const afterPinch={camera:cam.position.toArray(),target:orbit.target.toArray()}
 surface.send('wheel',{clientX:center.x,clientY:center.y,deltaY:-100,deltaMode:0,ctrlKey:false})
 assert(cam.position.distanceTo(orbit.target)<initialDistance/2,'wheel stopped working after touch')
 pointer('pointerdown',3,150,400);pointer('pointerdown',4,210,400)
 pointer('pointercancel',3,150,400);assert.equal(orbit.zoomToCursor,false)
 pointer('pointercancel',4,210,400);assert.equal(orbit.zoomToCursor,true,'cancel did not restore cursor zoom')
 nav.setMode('rotate');pointer('pointerdown',5,150,400);pointer('pointermove',5,180,415);pointer('pointerup',5,180,415)
 assert.equal(nav.inspect().mode,'rotate','touch changed explicit rotation mode')
 nav.dispose();orbit.dispose()
 assert.equal([...surface.listeners.values()].reduce((sum,list)=>sum+list.length,0),0,'touch listeners leaked after dispose')
 return afterPinch
}
for(const center of [{x:195,y:422},{x:275,y:520}]){
 const unscrolled=touchScenario(0,center),scrolled=touchScenario(249,center)
 vectorNear(scrolled.camera,unscrolled.camera,'scroll-independent pinch camera')
 vectorNear(scrolled.target,unscrolled.target,'scroll-independent pinch target')
}
console.log(`PASS camera: pan/pinch/rotation mapping, cursor zoom, real OrbitControls pinch at scroll 0/249 and center/off-center, keyboard map-only navigation, ${boundaryPoses} perspective boundary poses, 200 zoom actions + ${humanTransitions} human-to-aerial transitions, one render per action, raised-focus ultrawide coverage, portrait/desktop resize persistence, close interior preservation, invalid-pose recovery and cleanup.`)
