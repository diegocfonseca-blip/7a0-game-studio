import {MathUtils,MOUSE,TOUCH,Vector3,type PerspectiveCamera} from 'three'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'

export type ModoNavegacaoComplexo='pan'|'rotate'
export type LimitesMapaComplexo={minX:number;maxX:number;minZ:number;maxZ:number}

/** The scene's physical ground is 1,800 × 2,600 m. Keep a small inset so its
 * vertical edge cannot appear between pixels at the edge of the viewport. */
export const LIMITES_TERRENO_COMPLEXO:Readonly<LimitesMapaComplexo>={minX:-888,maxX:888,minZ:-1288,maxZ:1288}
const MIN_DISTANCE=5,MAX_DISTANCE=1700,MIN_HEIGHT=1.25
const HUMAN_TRANSITION_START=60,HUMAN_TRANSITION_END=120,HUMAN_AERIAL_POLAR=MathUtils.degToRad(55)

/** Ground coverage comes from the actual perspective rays, including aspect,
 * camera rotation and target height. A fixed target rectangle alone does not
 * prevent the far corners from leaving the terrain in portrait or panorama. */
export function coberturaTerrenoComplexo(camera:PerspectiveCamera):LimitesMapaComplexo|null{
 camera.updateMatrixWorld()
 const origin=camera.position,points:Vector3[]=[]
 for(const x of [-1,1])for(const y of [-1,1]){
  const direction=new Vector3(x,y,.5).unproject(camera).sub(origin).normalize()
  if(direction.y>=-1e-7)return null
  const distance=-origin.y/direction.y
  if(!Number.isFinite(distance)||distance<0)return null
  points.push(origin.clone().addScaledVector(direction,distance))
 }
 return{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minZ:Math.min(...points.map(p=>p.z)),maxZ:Math.max(...points.map(p=>p.z))}
}

type OpcoesNavegacaoComplexo={
 camera:PerspectiveCamera
 controls:OrbitControls
 onChange:()=>void
 onExplore?:()=>void
 bounds?:Readonly<LimitesMapaComplexo>
}

/** Owns only camera interaction; no scene, actor, match clock or save changes.
 * beginView is called before applying an explicit preset. resize then refits
 * that preset until the first gesture, and preserves an explored pose. */
export function criarNavegacaoComplexo({camera,controls,onChange,onExplore,bounds=LIMITES_TERRENO_COMPLEXO}:OpcoesNavegacaoComplexo){
 let mode:ModoNavegacaoComplexo='pan',explored=false,fitOnResize=true,terrainGuard=true,aerialExploration=false,disposed=false
 let lastPosition:Vector3|undefined,lastTarget:Vector3|undefined
 const element=controls.domElement
 const touchPoints=new Map<number,{x:number;y:number}>()
 let pinchAnchor:{world:Vector3;screen:{x:number;y:number};height:number}|undefined
 controls.minDistance=MIN_DISTANCE;controls.maxDistance=MAX_DISTANCE
 controls.minPolarAngle=.12
 controls.screenSpacePanning=false;controls.enableDamping=false
 controls.enablePan=true;controls.enableZoom=true;controls.enableRotate=true
 controls.panSpeed=1;controls.zoomSpeed=1;controls.rotateSpeed=.65
 controls.zoomToCursor=true
 if(element)element.style.touchAction='none'

 const setMode=(next:ModoNavegacaoComplexo)=>{
  mode=next
  controls.touches={ONE:next==='pan'?TOUCH.PAN:TOUCH.ROTATE,TWO:TOUCH.DOLLY_PAN}
  // Keep the right button available to pan in both modes. Rotation is an
  // explicit UI choice; ordinary dragging never unexpectedly tilts the map.
  controls.mouseButtons={LEFT:next==='pan'?MOUSE.PAN:MOUSE.ROTATE,MIDDLE:MOUSE.DOLLY,RIGHT:MOUSE.PAN}
 }
 const updatePolarLimit=(distance=0)=>{
  // In aerial mode the top ray must still meet land. Close interior presets
  // intentionally retain their human-height angle and are not forced upright.
  const aerialLimit=Math.PI/2-MathUtils.degToRad(camera.getEffectiveFOV())/2-.04
  if(terrainGuard||aerialExploration){controls.maxPolarAngle=aerialLimit;return}
  const progress=MathUtils.clamp((distance-HUMAN_TRANSITION_START)/(HUMAN_TRANSITION_END-HUMAN_TRANSITION_START),0,1)
  const eased=progress*progress*(3-2*progress)
  controls.maxPolarAngle=MathUtils.lerp(Math.PI/2-.055,Math.min(HUMAN_AERIAL_POLAR,aerialLimit),eased)
  // Latch until an explicit new preset. A terrain correction can reduce the
  // radius below 120 m; deriving this solely from radius would then oscillate.
  if(distance>=HUMAN_TRANSITION_END-1e-6)aerialExploration=true
 }
 const translate=(x:number,y:number,z:number)=>{const delta=new Vector3(x,y,z);controls.target.add(delta);camera.position.add(delta)}
 const touchCenter=()=>{const [a,b]=[...touchPoints.values()];return a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:undefined}
 const worldAtTouch=(screen:{x:number;y:number},height:number)=>{
  const rect=element?.getBoundingClientRect();if(!rect?.width||!rect.height)return
  camera.updateMatrixWorld()
  const direction=new Vector3((screen.x-rect.left)/rect.width*2-1,-(screen.y-rect.top)/rect.height*2+1,.5).unproject(camera).sub(camera.position).normalize()
  if(Math.abs(direction.y)<1e-7)return
  const distance=(height-camera.position.y)/direction.y
  if(!Number.isFinite(distance)||distance<0)return
  return camera.position.clone().addScaledVector(direction,distance)
 }
 const touchStart=(event:PointerEvent)=>{
  if(disposed||!controls.enabled||event.pointerType!=='touch')return
  touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});pinchAnchor=undefined
  // OrbitControls uses page coordinates for touch but client coordinates for
  // cursor projection. Keep its public pan/dolly handling, and anchor touch
  // zoom here in client space so scrolling the page never shifts the map.
  controls.zoomToCursor=false
 }
 const touchMove=(event:PointerEvent)=>{
  if(disposed||!controls.enabled||!touchPoints.has(event.pointerId))return
  const previous=touchPoints.size===2?touchCenter():undefined,height=controls.target.y
  const world=previous?worldAtTouch(previous,height):undefined
  touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY})
  const screen=touchCenter()
  pinchAnchor=world&&screen?{world,screen,height}:undefined
 }
 const touchEnd=(event:PointerEvent)=>{
  touchPoints.delete(event.pointerId);pinchAnchor=undefined
  if(!touchPoints.size)controls.zoomToCursor=true
 }
 const constrain=()=>{
  if(disposed)return
  if(![...camera.position.toArray(),...controls.target.toArray()].every(Number.isFinite)){
   if(lastPosition&&lastTarget){camera.position.copy(lastPosition);controls.target.copy(lastTarget)}
   else{controls.target.set(0,0,0);camera.position.set(0,400,500)}
  }
  const target=controls.target,offset=camera.position.clone().sub(target)
  let distance=offset.length()
  if(distance<1e-6){offset.set(0,1,1).normalize();distance=MIN_DISTANCE}
  else offset.divideScalar(distance)
  updatePolarLimit(distance)
  const azimuth=Math.atan2(offset.x,offset.z)
  const polar=MathUtils.clamp(Math.acos(MathUtils.clamp(offset.y,-1,1)),controls.minPolarAngle,controls.maxPolarAngle)
  const orient=(value:number)=>offset.set(Math.sin(value)*Math.sin(azimuth),Math.cos(value),Math.sin(value)*Math.cos(azimuth))
  orient(polar)
  distance=MathUtils.clamp(distance,MIN_DISTANCE,MAX_DISTANCE)
  const targetY=MathUtils.clamp(target.y,0,35)
  translate(0,targetY-target.y,0)
  const place=(value:number)=>{camera.position.copy(target).addScaledVector(offset,value);camera.lookAt(target);camera.updateMatrixWorld()}
  place(distance)
  if(camera.position.y<MIN_HEIGHT)translate(0,MIN_HEIGHT-camera.position.y,0)
  if(terrainGuard||aerialExploration){
   const availableWidth=bounds.maxX-bounds.minX,availableDepth=bounds.maxZ-bounds.minZ
   let footprint=coberturaTerrenoComplexo(camera)
   const fits=(value:LimitesMapaComplexo|null)=>!!value&&value.maxX-value.minX<=availableWidth&&value.maxZ-value.minZ<=availableDepth
   if(!fits(footprint)){
    place(MIN_DISTANCE)
    if(!fits(coberturaTerrenoComplexo(camera))){
     // A raised focus on a very wide display may not fit even at the minimum
     // radius. Tilt only as much as needed, retaining azimuth and, if possible,
     // the requested distance instead of leaving an uncovered ground corner.
     orient(controls.minPolarAngle);place(distance)
     if(fits(coberturaTerrenoComplexo(camera))){
      let low=controls.minPolarAngle,high=polar
      for(let i=0;i<24;i++){const middle=(low+high)/2;orient(middle);place(distance);if(fits(coberturaTerrenoComplexo(camera)))low=middle;else high=middle}
      orient(low)
     }
    }
    place(distance);footprint=coberturaTerrenoComplexo(camera)
   }
   if(!fits(footprint)){
    // Preserve angle and focus while reducing only the excessive distance.
    // Binary search also handles very wide desktops and rotated portrait views.
    let low=MIN_DISTANCE,high=distance
    for(let i=0;i<24;i++){const middle=(low+high)/2;place(middle);if(fits(coberturaTerrenoComplexo(camera)))low=middle;else high=middle}
    place(low);footprint=coberturaTerrenoComplexo(camera)
   }
   if(footprint){
    const dx=MathUtils.clamp(0,bounds.minX-footprint.minX,bounds.maxX-footprint.maxX)
    const dz=MathUtils.clamp(0,bounds.minZ-footprint.minZ,bounds.maxZ-footprint.maxZ)
    translate(dx,0,dz)
   }
  }else{
   translate(MathUtils.clamp(target.x,bounds.minX,bounds.maxX)-target.x,0,MathUtils.clamp(target.z,bounds.minZ,bounds.maxZ)-target.z)
  }
  camera.lookAt(target);camera.updateMatrixWorld()
  lastPosition=camera.position.clone();lastTarget=target.clone()
 }
 const explore=()=>{if(disposed)return;explored=true;onExplore?.()}
 const change=()=>{
  if(disposed)return
  if(pinchAnchor){
   const current=worldAtTouch(pinchAnchor.screen,pinchAnchor.height)
   if(current){const delta=pinchAnchor.world.clone().sub(current);translate(delta.x,0,delta.z)}
   pinchAnchor=undefined
  }
  constrain();onChange()
 }
 const beginView=(options:{fitOnResize?:boolean;terrainGuard?:boolean}={})=>{
  explored=false;aerialExploration=false;fitOnResize=options.fitOnResize??true;terrainGuard=options.terrainGuard??true;updatePolarLimit()
 }
 // OrbitControls emits change synchronously when update returns true. Its
 // listener already constrains and renders; render directly only otherwise.
 const updateAndRender=()=>{if(!controls.update())onChange()}
 const zoom=(direction:1|-1)=>{
  if(disposed)return
  explore()
  const offset=camera.position.clone().sub(controls.target),distance=offset.length()
  if(distance>1e-6)camera.position.copy(controls.target).addScaledVector(offset,MathUtils.clamp(distance*(direction===1?.8:1.25),MIN_DISTANCE,MAX_DISTANCE)/distance)
  constrain();updateAndRender()
 }
 const resize=(width:number,height:number,refit:()=>void)=>{
  if(disposed||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return
  camera.aspect=width/height;camera.updateProjectionMatrix()
  if(fitOnResize&&!explored)refit()
  constrain();updateAndRender()
 }
 const keydown=(event:KeyboardEvent)=>{
  // Listen only on the focused map itself; never consume page shortcuts or
  // keys bubbling from another control. Shift is needed to type + on common
  // desktop layouts, but shifted navigation keys remain available to the page.
  if(disposed||event.target!==element||event.altKey||event.ctrlKey||event.metaKey||(event.shiftKey&&event.key!=='+'))return
  if(event.key==='+'||event.key==='='||event.key==='-'){
   event.preventDefault();zoom(event.key==='-'?-1:1);return
  }
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
  event.preventDefault();explore();camera.updateMatrixWorld()
  const right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize()
  const forward=new Vector3(right.z,0,-right.x)
  const distance=MathUtils.clamp(camera.position.distanceTo(controls.target)*.06,.35,60)
  const direction=event.key==='ArrowLeft'?right.multiplyScalar(-1):event.key==='ArrowRight'?right:event.key==='ArrowUp'?forward:forward.multiplyScalar(-1)
  translate(direction.x*distance,0,direction.z*distance)
  constrain();updateAndRender()
 }
 const inspect=()=>({mode,explored,fitOnResize,terrainGuard:terrainGuard||aerialExploration,presetTerrainGuard:terrainGuard,aerialExploration,distance:camera.position.distanceTo(controls.target),minDistance:MIN_DISTANCE,maxDistance:MAX_DISTANCE,bounds:{...bounds},coverage:terrainGuard||aerialExploration?coberturaTerrenoComplexo(camera):null})
 setMode('pan');updatePolarLimit()
 controls.addEventListener('start',explore);controls.addEventListener('change',change)
 element?.addEventListener('keydown',keydown)
 element?.addEventListener('pointerdown',touchStart,true);element?.addEventListener('pointermove',touchMove,true)
 element?.addEventListener('pointerup',touchEnd,true);element?.addEventListener('pointercancel',touchEnd,true);element?.addEventListener('lostpointercapture',touchEnd,true)
 return{setMode,zoom,beginView,resize,constrain,inspect,dispose(){
  disposed=true;controls.removeEventListener('start',explore);controls.removeEventListener('change',change);element?.removeEventListener('keydown',keydown)
  element?.removeEventListener('pointerdown',touchStart,true);element?.removeEventListener('pointermove',touchMove,true)
  element?.removeEventListener('pointerup',touchEnd,true);element?.removeEventListener('pointercancel',touchEnd,true);element?.removeEventListener('lostpointercapture',touchEnd,true)
  touchPoints.clear();pinchAnchor=undefined;controls.zoomToCursor=true
 }}
}
