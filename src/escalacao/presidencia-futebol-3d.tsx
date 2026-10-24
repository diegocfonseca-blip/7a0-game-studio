import {atualizarRedesGol3D} from './presidencia-rede-gol-3d'
import {instanciarPersonagens} from './presidencia-personagens-instancias'
import {useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {criarCampo3D} from './presidencia-complexo-partida'
import {quadroFutebol3D} from './presidencia-futebol-motor'
import {atletasEmCampo,type EstadoPartidaEstadio} from './presidencia-partida-model'
import {useT} from './lang'
import './presidencia-futebol-3d.css'
import {progressoVisualSetor} from './presidencia-estadio-camadas'
import {person,pose} from './presidencia-atleta-3d'
import {BANCO_Z,TECNICO_Z} from './presidencia-area-tecnica'
import {JANELA_3D_INTEIRA,matrizRecorte3D,type Janela3D} from './presidencia-janela-3d'
import {matrizCameraRegistrada,type CantosRegistrados} from './presidencia-camera-registrada'
import {criarBolaFutebol3D,posicionarBolaFutebol3D} from './presidencia-bola-3d'
import type {loadPlayers} from './futebol3d/players.mjs'
import {criarCameraPartidaContinua} from './presidencia-camera-partida-continua'

const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.88})
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
export default function Futebol3D({state,registered,resolution=1536,crop=JANELA_3D_INTEIRA,onUnavailable}:{state:EstadoPartidaEstadio;registered?:CantosRegistrados;resolution?:number;crop?:Janela3D;onUnavailable?:()=>void}){
 const t=useT(),root=useRef<HTMLDivElement>(null),current=useRef(state),[error,setError]=useState(false),controlsRef=useRef<OrbitControls|null>(null),fitRef=useRef(()=>{}),resizeRef=useRef(()=>{}),repaint=useRef(()=>{}),followRef=useRef(()=>{})
 const cropRef=useRef(crop),resolutionRef=useRef(resolution),unavailable=useRef(onUnavailable)
 cropRef.current=crop;resolutionRef.current=resolution;unavailable.current=onUnavailable
 current.current=state
 const signature=state.officialInput?JSON.stringify([state.context.id,state.officialInput]):atletasEmCampo(state).map(p=>p.key).join('|'),construction=JSON.stringify(state.context.stadium??null)
 useEffect(()=>{
  const el=root.current;if(!el)return
  let renderer:THREE.WebGLRenderer
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:!!registered,powerPreference:'high-performance'})}catch{setError(true);unavailable.current?.();return}
  renderer.setPixelRatio(registered?1:Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace
  renderer.domElement.setAttribute('aria-label',t('Partida em campo tridimensional','Match on a three-dimensional pitch'));el.append(renderer.domElement)
  let follow=false
  const scene=new THREE.Scene();scene.background=registered?null:new THREE.Color('#c2d3ca')
  const camera=new THREE.PerspectiveCamera(45,1,.1,500),controls=new OrbitControls(camera,renderer.domElement);controlsRef.current=controls
  const matchCameraController=criarCameraPartidaContinua(camera,controls,()=>{})
  controls.enabled=!registered;controls.enableDamping=false;controls.minDistance=5;controls.maxDistance=200;controls.maxPolarAngle=Math.PI/2-.09;controls.minPolarAngle=.18;controls.target.set(0,0,0);controls.enablePan=true;controls.screenSpacePanning=false
  controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE}
  const register=()=>{if(!registered)return;camera.position.set(0,0,0);camera.quaternion.identity();camera.updateMatrixWorld();camera.projectionMatrix.set(...matrizCameraRegistrada(registered) as Parameters<THREE.Matrix4['set']>);camera.projectionMatrix.premultiply(new THREE.Matrix4().set(...matrizRecorte3D(cropRef.current) as Parameters<THREE.Matrix4['set']>));camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()}
  const fit=()=>{
   follow=false
   matchCameraController.explore()
   if(registered){register();return}
   controls.target.set(0,0,-3);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix()
   // Same near/far sides as CAMPO_INTERNO and CAMPO_MAPA, including portrait screens.
   const direction=new THREE.Vector3(0,65,60).normalize()
   const bounds=[[-53,-34],[53,-34],[-53,34],[53,34],[-55,-4],[-55,4],[55,-4],[55,4],[-24,-42],[24,-42]]
   let near=5,far=350
   for(let i=0;i<20;i++){const distance=(near+far)/2;camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld();const fits=bounds.every(([x,z])=>{const p=new THREE.Vector3(x,2.5,z).project(camera);return p.z<1&&p.z>-1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.92});if(fits)far=distance;else near=distance}
   camera.position.copy(controls.target).addScaledVector(direction,far);controls.maxDistance=Math.max(200,far*1.3);controls.update()
  };fitRef.current=fit
  const stadium=state.context.stadium,floodlit=!!stadium?.ext.includes('refl')&&progressoVisualSetor(stadium!,'geral')===1,light=floodlit?1:.76
  el.dataset.floodlit=String(floodlit)
  scene.add(new THREE.HemisphereLight('#fff7e5','#526344',2.2*light))
  const sun=new THREE.DirectionalLight('#fff4dc',3*light);sun.position.set(-35,75,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:55,bottom:-55,near:1,far:150});sun.shadow.normalBias=.025;scene.add(sun)
  const grass=criarCampo3D(scene,state.context.stadium,!!registered,()=>repaint.current())
  const bodies=(state.officialInput?[]:atletasEmCampo(state)).map((p,i)=>{const body=person(p.keeper?'#d6b329':p.side==='home'?state.homeColor:state.awayColor,['#b9815b','#805439','#d5aa80'][i%3],p.keeper);scene.add(body.group);return body})
  const referee=person('#efc42f','#a87250');scene.add(referee.group)
  const coaches:{body:ReturnType<typeof person>;x:number}[]=[],seated:THREE.Group[]=[]
  // z=-34 is the far touchline (top edge of CAMPO_INTERNO / CAMPO_MAPA).
  // The approved full stadium has a foreground barrier at the opposite side.
  // Rotate each entire technical area: seats, backrests, people and markings
  // stay together, with the coach in front and everyone facing the pitch (+z).
  for(const [i,x] of [-18,18].entries()){
   const area=new THREE.Group();area.name=i?'away-technical-area':'home-technical-area';area.position.x=x;area.rotation.y=Math.PI;scene.add(area)
   const coach=person('#28343b','#ad805d');coach.group.position.set(0,0,-TECNICO_Z);coach.group.rotation.y=Math.PI;area.add(coach.group);coaches.push({body:coach,x})
   // Seat top matches the seated thigh/pelvis and keeps the reserves' boots grounded.
   box(area,10,.12,.65,0,.29,-BANCO_Z,material('#384c51'));box(area,10,.7,.10,0,.70,-BANCO_Z+.38,material('#384c51'))
   for(const dx of [-4.5,4.5])box(area,.12,.29,.5,dx,.145,-BANCO_Z,material('#afb3ae'))
   // Only supplied real reserves occupy seats; no fabricated players.
   const activeIds=new Set(atletasEmCampo(state).filter(p=>p.side===(i?'away':'home')).map(p=>p.id))
   const reserves=(i?state.context.awayBench:state.context.homeBench)?.filter(p=>!p.fake&&!activeIds.has(p.id)).slice(0,7)??[]
   reserves.forEach((p,j)=>{const reserve=person(p.pos==='GOL'?'#d6b329':i?state.awayColor:state.homeColor,'#aa7752',p.pos==='GOL');reserve.group.name=p.id;reserve.group.position.set(-3.9+j*1.3,-.34,-BANCO_Z);reserve.group.rotation.y=Math.PI;reserve.legs.forEach(leg=>{leg.hip.rotation.x=-Math.PI/2;leg.knee.rotation.x=Math.PI/2});reserve.arms.forEach(arm=>{arm.rotation.x=-.3});reserve.elbows.forEach(elbow=>{elbow.rotation.x=-.9});area.add(reserve.group);seated.push(reserve.group)})
   const white=material('#e9e5d9');for(const dx of [-6,6])box(area,.10,.025,2.4,dx,.03,35.6,white);box(area,12,.025,.1,0,.03,34.4,white)
  }
  const people=instanciarPersonagens(scene,[...bodies.map(b=>b.group),referee.group,...coaches.map(c=>c.body.group),...seated])
  el.dataset.personParts=String(people.sourceCount);el.dataset.personBatches=String(people.batchCount)
  const ball=criarBolaFutebol3D();scene.add(ball)
  let frame=0,visible=true,disposed=false
  let humanoids:Awaited<ReturnType<typeof loadPlayers>>|undefined
  let shadowState:EstadoPartidaEstadio|undefined,shadowTime=-1
  const draw=()=>{
   frame=0;if(disposed||!visible||document.hidden)return
   const snapshot=quadroFutebol3D(current.current,performance.now())
   for(const {body,x} of coaches){body.group.rotation.y=Math.atan2(snapshot.ball.x-x,snapshot.ball.z-TECNICO_Z)-Math.PI;body.arms[0].rotation.x=-.2-Math.sin(snapshot.time*1.2+x)*.08;body.elbows[0].rotation.x=-.35}
   humanoids?.update(snapshot,camera,el.clientHeight)
   const presentation=humanoids?.presentFrame(snapshot)??snapshot
   if(follow&&!registered){
    matchCameraController.update(presentation.ball,performance.now(),presentation.players)
   }
   if(snapshot.official){el.dataset.officialScore=JSON.stringify(snapshot.official.score);el.dataset.officialEvents=String(snapshot.official.events.length);el.dataset.officialFinished=String(snapshot.official.finished)}
   snapshot.players.forEach((p,i)=>{if(bodies[i]){pose(bodies[i],p);bodies[i].kit.color.set(p.keeper?'#d6b329':p.side==='home'?current.current.homeColor:current.current.awayColor)}})
   pose(referee,{mx:snapshot.referee.x,mz:snapshot.referee.z,heading:snapshot.referee.heading,distance:snapshot.referee.distance,speed:snapshot.referee.speed,kick:0,throwing:0})
   posicionarBolaFutebol3D(ball,presentation);atualizarRedesGol3D(scene,presentation)
   el.dataset.cameraDistance=String(camera.position.distanceTo(controls.target));el.dataset.paused=String(current.current.paused);el.dataset.phase=snapshot.phase;el.dataset.players=String(snapshot.players.length);el.dataset.ball=JSON.stringify(snapshot.ball);el.dataset.time=String(snapshot.time)
   // Camera/zoom changes do not alter world-space shadows of a paused scene.
   // New match state or simulation time invalidates them before the next draw.
   renderer.shadowMap.needsUpdate=shadowState!==current.current||shadowTime!==snapshot.time
   shadowState=current.current;shadowTime=snapshot.time
   people.update();renderer.render(scene,camera);el.dataset.drawCalls=String(renderer.info.render.calls);el.dataset.triangles=String(renderer.info.render.triangles);el.dataset.gpuResources=JSON.stringify(renderer.info.memory);if((current.current.visualClock?.running??(!current.current.paused&&!current.current.finished))||matchCameraController.transitioning)frame=requestAnimationFrame(draw)
  }
  // Coalesce state, resize and texture updates into one browser frame.
  // A synchronous WebGL render here blocks score effects and goal timers.
  const wake=()=>{if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(draw)};repaint.current=wake;controls.addEventListener('change',wake);controls.addEventListener('start',()=>{follow=false;matchCameraController.explore()});followRef.current=()=>{follow=true;matchCameraController.setMode('broadcast');wake()}
  if(state.officialInput)import('./futebol3d/players.mjs').then(module=>module.loadPlayers(scene,state,quadroFutebol3D(current.current,performance.now()))).then(players=>{if(disposed){players.dispose();return}humanoids=players;el.dataset.humanoids='22';wake()}).catch(()=>{if(!disposed){setError(true);unavailable.current?.()}})
  const size=()=>{if(registered){const c=cropRef.current,w=Math.max(1,resolutionRef.current*c.width),h=Math.max(1,resolutionRef.current/1.5*c.height),factor=Math.min(1,4096/Math.max(w,h)),width=Math.max(1,Math.round(w*factor)),height=Math.max(1,Math.round(h*factor));
    if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false);
    Object.assign(renderer.domElement.style,{position:'absolute',left:c.left*100+'%',top:c.top*100+'%',width:c.width*100+'%',height:c.height*100+'%'});register()}else{renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix()}wake()};resizeRef.current=size
  const resize=new ResizeObserver(size);resize.observe(el);size();fit();follow=false
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;wake()});observer.observe(el)
  const lost=(event:Event)=>{event.preventDefault();setError(true);unavailable.current?.()};renderer.domElement.addEventListener('webglcontextlost',lost)
  document.addEventListener('visibilitychange',wake)
  return()=>{
   resizeRef.current=()=>{};repaint.current=()=>{};disposed=true;cancelAnimationFrame(frame)
   observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',wake);controls.dispose();controlsRef.current=null
   // Batches share their sources' geometry and cloth maps. Remove the cloned
   // materials first, then release each owned source resource exactly once.
   humanoids?.dispose();people.dispose()
   const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>([grass])
   scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){
    geometries.add(object.geometry)
    for(const mat of Array.isArray(object.material)?object.material:[object.material]){
     materials.add(mat);for(const value of Object.values(mat))if(value instanceof THREE.Texture)textures.add(value)
    }
   }})
   textures.forEach(texture=>{texture.userData.disposed=true;texture.dispose()});geometries.forEach(geometry=>geometry.dispose());materials.forEach(mat=>mat.dispose())
   renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()
  }
 // State advances through the shared clock; camera changes never restart the match.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[state.context.id,signature,registered,construction])
 useEffect(()=>repaint.current(),[state])
 useEffect(()=>resizeRef.current(),[resolution,crop.left,crop.top,crop.width,crop.height])
 const zoom=(factor:number)=>{const controls=controlsRef.current;if(!controls)return;const delta=controls.object.position.clone().sub(controls.target);delta.setLength(THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance));controls.object.position.copy(controls.target).add(delta);controls.update()}
 if(registered)return <div ref={root} className="pe-football-registered" aria-label={t('Partida integrada ao estádio','Match integrated into the stadium')}/>
 return <section className="pe-football-3d"><div className="pe-live-tools"><button onClick={()=>zoom(.75)} aria-label={t('Aproximar campo 3D','Zoom in 3D pitch')}>+</button><button onClick={()=>zoom(1.33)} aria-label={t('Afastar campo 3D','Zoom out 3D pitch')}>−</button><button onClick={()=>fitRef.current()}>{t('VER CAMPO','FIT PITCH')}</button>{state.officialInput&&<button type="button" onClick={()=>followRef.current()}>{t('TRANSMISSÃO','BROADCAST')}</button>}<span>{state.homeScore} × {state.awayScore} · {state.minute}′ · {state.context.speed??1}×</span></div>{error?<p role="status">{t('O campo 3D não está disponível neste aparelho. A vista do estádio continua disponível.','The 3D pitch is unavailable on this device. The stadium view remains available.')}</p>:<div ref={root} className="pe-football-canvas"/>}<p className="pe-live-help">{t('Arraste para acompanhar. Use dois dedos para aproximar e girar a câmera.','Drag to follow play. Use two fingers to zoom and rotate the camera.')}</p></section>
}
