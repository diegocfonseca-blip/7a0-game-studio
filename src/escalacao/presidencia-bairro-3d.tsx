import {useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {criarCenarioBairro} from './presidencia-bairro-cenario-3d'
import {criarAtoresBairro} from './presidencia-bairro-atores-3d'
import {quadroBairro} from './presidencia-bairro-model'
import './presidencia-bairro-3d.css'

type VistaBairro='general'|'entrance'|'pedestrian'|'car'|'back'
export type ControleBairro={seek:(seconds:number)=>void;view:(view:VistaBairro)=>void;inspect:()=>unknown;checkLighting:()=>{invalidSamples:number;litSamples:number}}
/** Isolated review of the new world. No game store, match clock, purchases or auth. */
export default function PresidenciaBairro3D({onReady}:{onReady?:(controls:ControleBairro|null)=>void}){
 const root=useRef<HTMLDivElement>(null),api=useRef<ControleBairro|null>(null),ready=useRef(onReady)
 const [paused,setPaused]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false)
 const pauseRef=useRef(paused),wake=useRef(()=>{}),toggleRef=useRef(()=>{})
 pauseRef.current=paused;ready.current=onReady
 useEffect(()=>{wake.current()},[paused])
 useEffect(()=>{
  const el=root.current;if(!el)return
  let renderer:THREE.WebGLRenderer
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}
  catch{setError('Não foi possível iniciar a prévia 3D neste aparelho.');return}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap
  renderer.domElement.setAttribute('aria-label','Rua do clube em 3D, com pedestre e carro');el.append(renderer.domElement)
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d7d5c8');scene.fog=new THREE.Fog('#d7d5c8',100,220)
  const camera=new THREE.PerspectiveCamera(42,1,.1,250)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.enableDamping=false;controls.minDistance=5;controls.maxDistance=125;controls.minPolarAngle=.22;controls.maxPolarAngle=Math.PI/2-.1
  controls.screenSpacePanning=false;controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}
  // Match the reference's late-afternoon contrast: warm side light, cooler shade.
  scene.add(new THREE.HemisphereLight('#cbdcf1','#80725e',.7))
  const sun=new THREE.DirectionalLight('#ffe0b1',3.8);sun.position.set(-24,24,22);sun.castShadow=true
  const shadowSize=el.clientWidth<600?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize)
  Object.assign(sun.shadow.camera,{left:-40,right:40,top:35,bottom:-35,near:1,far:160})
  sun.shadow.normalBias=.035;sun.shadow.bias=-.00008;sun.shadow.radius=2.5;sun.target.position.set(0,0,-2);scene.add(sun,sun.target)
  // Light originates inside the shop and is blocked by real walls and actors.
  // Keep a single shadowed source instead of painting light across the glazing.
  const interiorLight=new THREE.SpotLight('#ffbd70',180,17,1.2,.75,2)
  interiorLight.position.set(4.4,3.14,-5.7);interiorLight.target.position.set(1.8,1.1,-4.7)
  interiorLight.castShadow=true;interiorLight.shadow.mapSize.set(512,512)
  interiorLight.shadow.normalBias=.018;interiorLight.shadow.bias=-.0001;interiorLight.shadow.radius=2
  scene.add(interiorLight,interiorLight.target)
  const environment=criarCenarioBairro(scene),actors=criarAtoresBairro(scene)
  // One static reflection probe of this street, not a photographic backdrop.
  // Leave moving actors out so the glass never retains a frozen pedestrian/car.
  const pmrem=new THREE.PMREMGenerator(renderer)
  actors.pedestre.visible=false;actors.carro.visible=false
  const originalBackground=scene.background;scene.background=new THREE.Color('#b5c9e1')
  // Subpixel bump derivatives at cube-face edges can contaminate the low-resolution
  // convolution. Keep microrelief for the main view; the probe only needs volumes.
  const probeRelief=new Map<THREE.MeshStandardMaterial,THREE.Texture>()
  environment.root.traverse(node=>{
   if(!(node instanceof THREE.Mesh))return
   const materials=Array.isArray(node.material)?node.material:[node.material]
   for(const material of materials)if(material instanceof THREE.MeshStandardMaterial&&material.bumpMap){probeRelief.set(material,material.bumpMap);material.bumpMap=null;material.needsUpdate=true}
  })
  const reflection=pmrem.fromScene(scene,0,.1,180,{size:128,position:new THREE.Vector3(0,1.7,.3)})
  for(const [material,map] of probeRelief){material.bumpMap=map;material.needsUpdate=true}
  scene.environment=reflection.texture;scene.environmentIntensity=.45;scene.background=originalBackground
  actors.pedestre.visible=true;actors.carro.visible=true;pmrem.dispose()
  const sunOffset=new THREE.Vector3(-1,1,1).normalize().multiplyScalar(75)
  const updateShadows=()=>{
   // Spend shadow resolution near the camera when the user inspects the sidewalk.
   const span=THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)*1.2,18,90)
   sun.target.position.copy(controls.target);sun.target.position.y=0
   sun.position.copy(sun.target.position).add(sunOffset)
   const shadowCamera=sun.shadow.camera
   shadowCamera.left=-span/2;shadowCamera.right=span/2;shadowCamera.top=span/2;shadowCamera.bottom=-span/2
   shadowCamera.updateProjectionMatrix()
  }
  let elapsed=6,last=0,raf=0,visible=true,disposed=false,rendering=false,mode:VistaBairro='general'
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  const render=()=>{
   if(disposed||rendering)return;rendering=true
   const frame=quadroBairro(elapsed);actors.update(frame)
   updateShadows();renderer.render(scene,camera)
   el.dataset.time=elapsed.toFixed(3);el.dataset.phase=frame.pedestre.phase
   el.dataset.drawCalls=String(renderer.info.render.calls);el.dataset.triangles=String(renderer.info.render.triangles)
   rendering=false
  }
  const view=(next:VistaBairro)=>{
   mode=next;const frame=quadroBairro(elapsed)
   if(next==='general'){
    controls.target.set(-1,1,-1)
    const direction=new THREE.Vector3(27,25,35).normalize(),corners=[[-27,-15],[27,-15],[-27,15],[27,15]]
    let lo=15,hi=125
    for(let i=0;i<20;i++){const distance=(lo+hi)/2;camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld();const fits=corners.every(([x,z])=>{const p=new THREE.Vector3(x,2,z).project(camera);return Math.abs(p.x)<.93&&Math.abs(p.y)<.88});if(fits)hi=distance;else lo=distance}
    camera.position.copy(controls.target).addScaledVector(direction,hi)
   }else if(next==='entrance'){controls.target.set(0,1.5,-2);camera.position.set(9,7,13)}
   else if(next==='back'){controls.target.set(0,1.4,-5);camera.position.set(9,6,-24)}
   else{const p=next==='pedestrian'?frame.pedestre:frame.carro;controls.target.set(p.x,next==='pedestrian'?1:0.8,p.z);camera.position.set(p.x+5,4.5,p.z+6.5)}
   controls.update();render()
  }
  const resize=()=>{
   const width=el.clientWidth,height=el.clientHeight;if(!width||!height)return
   // Cap physical pixels independently of CSS size; close zoom keeps real geometry.
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75,Math.sqrt(1800000/(width*height))))
   renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()
   if(mode==='general')view(mode);else render()
  }
  const active=()=>!pauseRef.current&&!reduced.matches&&!document.hidden&&visible
  const tick=(now:number)=>{
   if(disposed)return
   if(active()&&last)elapsed+=(now-last)/1000
   last=active()?now:0;render()
   if(active())raf=requestAnimationFrame(tick)
  }
  const resume=()=>{cancelAnimationFrame(raf);last=0;render();if(active())raf=requestAnimationFrame(tick)}
  wake.current=resume;toggleRef.current=()=>setPaused(p=>!p)
  const onCamera=()=>{
   // Keep exploration near the review block; never let the orbit target go underground.
   const edge=mode==='car'?100:35
   controls.target.x=THREE.MathUtils.clamp(controls.target.x,-edge,edge)
   controls.target.z=THREE.MathUtils.clamp(controls.target.z,-20,20)
   controls.target.y=THREE.MathUtils.clamp(controls.target.y,0,5)
   render()
  }
  controls.addEventListener('change',onCamera)
  const inspection=()=>{
   scene.updateMatrixWorld(true)
   const frame=quadroBairro(elapsed),target=new THREE.Vector3(frame.pedestre.x,frame.pedestre.y+1.2,frame.pedestre.z)
   const direction=target.clone().sub(camera.position),distance=direction.length()
   const ray=new THREE.Raycaster(camera.position,direction.normalize(),0,distance-.3)
   const environmentMeshes:THREE.Object3D[]=[]
   scene.traverse(n=>{if(n instanceof THREE.Mesh&&!actors.pedestre.getObjectById(n.id)&&!actors.carro.getObjectById(n.id))environmentMeshes.push(n)})
   const blockers=ray.intersectObjects(environmentMeshes,false).filter(h=>{const mat=(h.object as THREE.Mesh).material;return !Array.isArray(mat)&&!mat.transparent})
   const feet=actors.feet.map(n=>new THREE.Box3().setFromObject(n,true))
   return {frame,camera:camera.position.toArray(),target:controls.target.toArray(),occluded:blockers.length>0,blockers:blockers.slice(0,3).map(h=>h.object.name),feet:feet.map(b=>({min:b.min.y,max:b.max.y})),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shadowMap:renderer.shadowMap.enabled,canvas:[renderer.domElement.width,renderer.domElement.height],meshes:environmentMeshes.length}
  }
  const checkLighting=()=>{
   const pixels=new Uint16Array(reflection.width*reflection.height*4)
   renderer.readRenderTargetPixels(reflection,0,0,reflection.width,reflection.height,pixels)
   let invalidSamples=0,litSamples=0
   for(let i=0;i<pixels.length;i++)if(i%4!==3){if((pixels[i]&0x7c00)===0x7c00)invalidSamples++;else if(pixels[i]>0)litSamples++}
   return {invalidSamples,litSamples}
  }
  api.current={seek:seconds=>{elapsed=Number.isFinite(seconds)?Math.max(0,seconds):0;last=0;render()},view,inspect:inspection,checkLighting};ready.current?.(api.current)
  const observer=new ResizeObserver(resize);observer.observe(el)
  const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;resume()});visibility.observe(el)
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume)
  const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);setError('A prévia 3D foi interrompida. Reabra a prévia para tentar novamente.')}
  renderer.domElement.addEventListener('webglcontextlost',lost)
  resize();setLoaded(true);resume()
  return()=>{
   disposed=true;cancelAnimationFrame(raf);api.current=null;ready.current?.(null);wake.current=()=>{}
   observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume)
   controls.removeEventListener('change',onCamera);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost)
   actors.dispose();environment.dispose();reflection.dispose();sun.shadow.map?.dispose();interiorLight.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()
  }
 },[])
 return <section className="pb3-review" aria-label="Prévia do entorno em 3D">
  <div className="pb3-heading"><div><span className="pb3-eyebrow">PRÉVIA DO ENTORNO</span><h1>Um passeio pelo clube</h1></div><span className="pb3-tag">TRECHO EM REVISÃO</span></div>
  <p className="pb3-intro">Rua, calçada e entrada do clube. Aproxime para acompanhar o passeio.</p>
  <div className="pb3-tools">
   <button type="button" onClick={()=>api.current?.view('general')}>Visão geral</button>
   <button type="button" onClick={()=>api.current?.view('entrance')}>Ver entrada</button>
   <button type="button" onClick={()=>api.current?.view('pedestrian')}>Ver pedestre</button>
   <button type="button" onClick={()=>api.current?.view('car')}>Ver carro</button>
   <button type="button" aria-pressed={paused} onClick={()=>toggleRef.current()}>{paused?'Retomar movimento':'Pausar movimento'}</button>
  </div>
  <div ref={root} className="pb3-viewport" data-bairro-3d="true" aria-busy={!loaded}>
   {error&&<p className="pb3-error" role="alert">{error}</p>}
  </div>
  <p className="pb3-help">Arraste para girar. Use dois dedos para aproximar e deslocar a vista.</p>
 </section>
}
