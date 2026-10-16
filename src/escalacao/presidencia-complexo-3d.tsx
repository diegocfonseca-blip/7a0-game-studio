import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import type {StadiumSave} from './estadiodata'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {complexoDoEstadio,PLANTA_COMPLEXO} from './presidencia-complexo-model'
import {criarArquiteturaComplexo} from './presidencia-complexo-arquitetura'
import {criarEntornoComplexo} from './presidencia-complexo-entorno'
import {PLANTA_VADICO} from './presidencia-complexo-concessionaria'
import {criarPartidaComplexo} from './presidencia-complexo-partida'
import {criarCirculacaoComplexo,type PopulacaoTesteComplexo} from './presidencia-complexo-circulacao'
import {criarTorcidaComplexo,type PublicoTorcidaComplexo} from './presidencia-complexo-torcida'
import {criarSaidaTorcidaComplexo} from './presidencia-complexo-torcida-saida'
import {publicoDoEstadio,type DiaEstadio} from './presidencia-estadio-publico'
import {criarVisitaComplexo,opcoesVisitaComplexo} from './presidencia-complexo-visita'
import {criarMobiliaComplexo} from './presidencia-complexo-mobilia'
import {criarTransporteComplexo} from './presidencia-complexo-transporte'
import {gerarPlantaTransporte} from './presidencia-complexo-transporte-model'
import {distribuirFluxoComplexo} from './presidencia-complexo-fluxo'
import {criarNavegacaoComplexo,type ModoNavegacaoComplexo} from './presidencia-complexo-camera'
import {calcularQualidadeComplexo,aplicarQualidadeTexturasComplexo} from './presidencia-complexo-qualidade'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import {criarIluminacaoComplexo} from './presidencia-complexo-iluminacao'
import type {PresidenciaCarteira} from './presidencia-economia'
import './presidencia-complexo-3d.css'

export type VistaComplexo='original'|'region'|'field'|'stands'|'entrance'|'away-entrance'|'office'|'room'|'visit-home'|'visit-away'|'follow-home'|'follow-away'|'loja'|'hotel'|'chopp'|'praca'|'estacao'|'metro'|'onibus'|'estacionamento'|'vadico'
export type ControleComplexo={view:(view:VistaComplexo)=>void;zoom:(direction:1|-1)=>void;setNavigationMode:(mode:ModoNavegacaoComplexo)=>void;seekCirculation:(seconds:number)=>void;inspect:()=>unknown;checkLighting:()=>{invalidSamples:number;litSamples:number};checkDealershipView:()=>{id:string;visible:boolean;occluder?:string}[]}

/** Physical reconstruction for local visual review. It only reads the existing save and match clock. */
export default function PresidenciaComplexo3D({stadium,match,circulation=false,qaPopulation=false,day,awayStadium,awayDay,presidency,journey,visitRow=5,visitTier='lower',onReady}:{stadium?:StadiumSave;match?:EstadoPartidaEstadio;circulation?:boolean;qaPopulation?:boolean;day?:DiaEstadio;awayStadium?:StadiumSave;awayDay?:DiaEstadio;presidency?:PresidenciaCarteira|null;journey?:JornadaComplexo;visitRow?:number;visitTier?:'lower'|'upper';onReady?:(api:ControleComplexo|null)=>void}){
 const root=useRef<HTMLDivElement>(null),api=useRef<ControleComplexo|null>(null),ready=useRef(onReady),matchRef=useRef(match),wake=useRef(()=>{}),refreshPopulation=useRef(()=>{}),refreshFurniture=useRef(()=>{}),refreshJourney=useRef(()=>{}),walletRef=useRef(presidency),journeyRef=useRef(journey)
 ready.current=onReady;matchRef.current=match;walletRef.current=presidency;journeyRef.current=journey
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[hasSeatView,setHasSeatView]=useState(false),[visitable,setVisitable]=useState({home:false,away:false}),[following,setFollowing]=useState<'home'|'away'|null>(null),[paused,setPaused]=useState(false),pausedRef=useRef(paused)
 const [expanded,setExpanded]=useState(false),[placesOpen,setPlacesOpen]=useState(false),[navigationMode,setNavigationMode]=useState<ModoNavegacaoComplexo>('pan'),[selectedView,setSelectedView]=useState<VistaComplexo>('original')
 const section=useRef<HTMLElement>(null),expandButton=useRef<HTMLButtonElement>(null),placesButton=useRef<HTMLButtonElement>(null),navigationModeRef=useRef(navigationMode)
 const expansionOrigin=useRef<{x:number;y:number;focus:HTMLElement|null}|null>(null),uiId=useId()
 const restoreExpansionFrame=useRef(0)
 navigationModeRef.current=navigationMode
 pausedRef.current=paused
 const toggleExpanded=()=>{
  if(!expanded)expansionOrigin.current={x:window.scrollX,y:window.scrollY,focus:expandButton.current}
  setPlacesOpen(false);setExpanded(value=>!value)
 }
 useLayoutEffect(()=>{
  if(!expanded)return
  cancelAnimationFrame(restoreExpansionFrame.current)
  const body=document.body,html=document.documentElement
  const previous={bodyOverflow:body.style.overflow,htmlOverflow:html.style.overflow,overscroll:body.style.overscrollBehavior}
  body.style.overflow='hidden';html.style.overflow='hidden';body.style.overscrollBehavior='none'
  expandButton.current?.focus({preventScroll:true})
  return()=>{
   body.style.overflow=previous.bodyOverflow;html.style.overflow=previous.htmlOverflow;body.style.overscrollBehavior=previous.overscroll
   const origin=expansionOrigin.current
   // Restore after React has finished removing the dialog presentation. Touch
   // browsers do not necessarily focus the opening button on pointer-down.
   restoreExpansionFrame.current=requestAnimationFrame(()=>{
    if(origin){if(origin.focus?.isConnected)origin.focus.focus({preventScroll:true});window.scrollTo({left:origin.x,top:origin.y,behavior:'instant'})}
   })
  }
 },[expanded])
 // A presentation-clock update must never rebuild the stadium or reset the camera.
 const saveKey=JSON.stringify(stadium??{inv:{},ext:[]}),walletKey=JSON.stringify(presidency??null),journeyKey=JSON.stringify(journey??null)
 const currentState=complexoDoEstadio(stadium),hasBox=currentState.lowerComplete&&currentState.progress.camarote>0
 // Arrival, the match and departure belong to the same attendance reservation.
 // A final whistle changes routes, not the identities or number of people
 // already walking through a doorway or sitting in the stadium.
 const populationDay=day&&journey?.hosting&&journey.phase!=='idle'?{...day,match:journey.phase==='interval'?'interval' as const:'playing' as const}:day
 const visitorDay=awayDay&&journey?.hosting&&journey.phase!=='idle'?{...awayDay,match:journey.phase==='interval'?'interval' as const:'playing' as const}:awayDay
 // QA is opt-in. Missing career data must not manufacture a visiting fanbase.
 const attendance=stadium&&populationDay?publicoDoEstadio(stadium,populationDay):undefined
 const awayAttendance=attendance&&awayStadium&&visitorDay?publicoDoEstadio(awayStadium,visitorDay):undefined
 const populationMode=attendance?'career':qaPopulation?'qa-sample':'off'
 const teamColors=useRef<{key?:string;home?:string;away?:string}>({})
 const teamKey=journey?.key??match?.context.id
 // The next calendar day can arrive before its match snapshot. Missing
 // colours must not replace people still completing the previous journey.
 if(teamColors.current.key!==teamKey)teamColors.current={...teamColors.current,key:teamKey}
 if(match){teamColors.current.home=match.homeColor;teamColors.current.away=match.awayColor}
 const enabled=circulation&&populationMode!=='off'&&currentState.valid
 const options:PopulacaoTesteComplexo=attendance?{
  stadium,day:populationDay,awayStadium:awayAttendance?awayStadium:undefined,awayDay:awayAttendance?visitorDay:undefined,
  pedestrians:Math.min(3,attendance.outside),homeFans:Math.min(3,attendance.outside),awayFans:awayAttendance?.playing?Math.min(2,awayAttendance.outside):0,cars:Math.min(2,attendance.cars),
 }:{pedestrians:3,homeFans:1,awayFans:1,cars:1}
 // Only bounded actor counts and their data source affect expensive path validation.
 const actorKey=enabled?JSON.stringify([populationMode,!!options.awayFans&&!!awayAttendance,options.homeFans,options.awayFans,options.cars,options.pedestrians]):'off'
 const crowdPopulation:PublicoTorcidaComplexo={
  ...(stadium&&populationDay?{mode:'career' as const,stadium,day:populationDay,away:awayStadium&&visitorDay?{stadium:awayStadium,day:visitorDay}:undefined}
   :qaPopulation?{mode:'qa-sample' as const,homeOccupancy:.7,awayOccupancy:.5}:{mode:'off' as const}),
  homeColor:teamColors.current.home,awayColor:teamColors.current.away,
 }
 const populationKey=JSON.stringify([actorKey,attendance,awayAttendance,crowdPopulation,visitRow,visitTier])
 const populationRef=useRef({enabled,actorKey,options,attendance,awayAttendance,crowdPopulation,visitRow,visitTier})
 populationRef.current={enabled,actorKey,options,attendance,awayAttendance,crowdPopulation,visitRow,visitTier}
 useEffect(()=>{wake.current()},[match,paused])
 useEffect(()=>{
  const el=root.current;if(!el)return
  setLoaded(false);setHasSeatView(false);setFollowing(null);setVisitable({home:false,away:false});setError('')
  const save:StadiumSave=JSON.parse(saveKey),state=complexoDoEstadio(save)
  let renderer:THREE.WebGLRenderer
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:true})}
  catch{setError('Não foi possível abrir esta vista 3D neste aparelho.');return}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap
  renderer.domElement.setAttribute('aria-label','Mapa do estádio em três dimensões');renderer.domElement.setAttribute('aria-describedby',`${uiId}-help`);renderer.domElement.tabIndex=0;el.append(renderer.domElement)
  const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2cd');scene.fog=new THREE.Fog('#cbd2cd',1100,2200)
  const visualProfile=(width:number,height:number)=>calcularQualidadeComplexo({width,height,devicePixelRatio:window.devicePixelRatio||1,
   coarsePointer:window.matchMedia('(pointer: coarse)').matches,deviceMemory:(navigator as Navigator&{deviceMemory?:number}).deviceMemory,
   maxTextureSize:renderer.capabilities.maxTextureSize,maxAnisotropy:renderer.capabilities.getMaxAnisotropy()})
  let quality=visualProfile(el.clientWidth,el.clientHeight)
  const sharpenTextures=()=>aplicarQualidadeTexturasComplexo(scene,quality.anisotropy)
  const camera=new THREE.PerspectiveCamera(38,1,.12,4000),controls=new OrbitControls(camera,renderer.domElement)
  const hemisphere=new THREE.HemisphereLight('#c9dcf0','#8c7d61',.85);scene.add(hemisphere)
  const sun=new THREE.DirectionalLight('#ffdda5',3.1);sun.position.set(-340,450,270);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048)
  sun.shadow.normalBias=.055;sun.shadow.bias=-.00012;sun.shadow.radius=2.5
  sun.shadow.camera.near=1;sun.shadow.camera.far=1300;scene.add(sun,sun.target)
  const surround=criarEntornoComplexo(scene,state),architecture=criarArquiteturaComplexo(scene,state)
  setHasSeatView(architecture.seats.length>0)
  const furniture=criarMobiliaComplexo(scene,state,walletRef.current)
  let render=()=>{},disposed=false
  const game=criarPartidaComplexo(scene,save,matchRef.current,()=>render())
  // The probe sees real static geometry. Exclude bump derivatives from its convolution.
  const bumpMaps=new Map<THREE.MeshStandardMaterial,THREE.Texture>()
  scene.traverse(node=>{if(node instanceof THREE.Mesh)for(const mat of Array.isArray(node.material)?node.material:[node.material]){
   if(mat instanceof THREE.MeshStandardMaterial&&mat.bumpMap){bumpMaps.set(mat,mat.bumpMap);mat.bumpMap=null;mat.needsUpdate=true}
  }})
  const generator=new THREE.PMREMGenerator(renderer)
  const reflectedPlayers=scene.getObjectByName('complexo-partida');if(reflectedPlayers)reflectedPlayers.visible=false
  const reflection=generator.fromScene(scene,0,.1,1800,{size:64,position:new THREE.Vector3(0,8,90)})
  if(reflectedPlayers)reflectedPlayers.visible=true
  for(const [material,map] of bumpMaps){material.bumpMap=map;material.needsUpdate=true}
  scene.environment=reflection.texture;scene.environmentIntensity=.35;generator.dispose()
  // Local ceiling light keeps purchased furniture readable under the roof.
  // Bounded cones illuminate this room; the outdoor exposure stays unchanged.
  const roomLights:THREE.SpotLight[]=[]
  if(architecture.counts.presidentBox){
   for(const [x,z,targetZ,intensity] of [[-6.4,72.4,70.6,150],[8,74.1,72.5,130]]){
    const lamp=new THREE.SpotLight('#ffe6c4',intensity,12,.42,.70,2)
    lamp.position.set(x,16.43,z);lamp.target.position.set(x,9.7,targetZ)
    lamp.castShadow=true;lamp.shadow.mapSize.set(512,512)
    lamp.shadow.normalBias=.012;lamp.shadow.bias=-.00002
    lamp.shadow.camera.near=.1;lamp.shadow.camera.far=12
    lamp.shadow.autoUpdate=false;lamp.shadow.needsUpdate=true
    scene.add(lamp,lamp.target);roomLights.push(lamp)
   }
  }
  const lighting=criarIluminacaoComplexo({scene,state,sun,hemisphere,solids:surround.solids})
  lighting.setPeriod(journeyRef.current?.period??'day')
  const crowd=criarTorcidaComplexo(scene,architecture.seats,populationRef.current.crowdPopulation)
  let circulationActors:ReturnType<typeof criarCirculacaoComplexo>|undefined,previousActorKey='',previousCirculationKey='',populationRebuilds=0
  let transportActors:ReturnType<typeof criarTransporteComplexo>|undefined,flow:ReturnType<typeof distribuirFluxoComplexo>|undefined
  const transportPlan=gerarPlantaTransporte(state)
  // Include the owned station and its stairs, not the entire regional rail line.
  const stationFrame=transportPlan.surfaces.filter(s=>s.kind==='platform'||s.kind==='stair').flatMap(s=>
   s.polygon.flatMap(p=>[new THREE.Vector3(p.x,s.y,p.z),new THREE.Vector3(p.x,s.y+(s.kind==='platform'?4.63:1.1),p.z)]))
  let visits:ReturnType<typeof criarVisitaComplexo>[]=[],previousVisitKey=''
  let crowdDeparture:ReturnType<typeof criarSaidaTorcidaComplexo>|undefined
  const sunOffset=new THREE.Vector3(-.9,1.4,.65).normalize().multiplyScalar(600)
  let followSide:'home'|'away'|undefined,followedCenter:THREE.Vector3|undefined,followedRig:THREE.Group|undefined
  const retiringVisits=new Set<ReturnType<typeof criarVisitaComplexo>>()
  const visitorSides=new Map<ReturnType<typeof criarVisitaComplexo>,'home'|'away'>()
  const visitorKeys=new Map<ReturnType<typeof criarVisitaComplexo>,string>()
  const followedActor=(side:'home'|'away')=>transportActors?.actor(side)??visits.find(visit=>visitorSides.get(visit)===side)
  const selectedAccess=(side:'home'|'away')=>architecture.seatAccess.filter(access=>access.side===side&&access.seat.tier===populationRef.current.visitTier&&!crowdDeparture?.reserveSeatIds().includes(access.seatId)).sort((a,b)=>Math.abs(a.seat.row-populationRef.current.visitRow)-Math.abs(b.seat.row-populationRef.current.visitRow)||a.seat.row-b.seat.row)[0]
  let mode:VistaComplexo='original',focusedSeat:string|undefined,raf=0,visible=true,rendering=false,seconds=6,last=0
  const rebuildPopulation=()=>{
   const population=populationRef.current,publico=crowd.inspect()
   // A reserved place consumes the same bounded crowd budget as its occupant.
   // One complete visit per side avoids piling up bodies in the shared stairway.
   const candidates=population.enabled?(['home','away'] as const).flatMap(side=>{const access=selectedAccess(side);return access&&Math.round(publico.quota[side]*publico.occupancy[side])>0?[access]:[]}):[]
   const integrated=!!journeyRef.current?.calendarKnown&&!!journeyRef.current?.hosting
   const homeDemand=population.crowdPopulation.mode==='qa-sample'?6:population.attendance?.outside??0
   const awayDemand=population.crowdPopulation.mode==='qa-sample'?2:population.awayAttendance?.playing?population.awayAttendance.outside:0
   const metroSide=integrated&&homeDemand>0&&(!awayDemand||journeyRef.current!.variantSeed%2===0)?'home' as const:'away' as const
   const flowInput={mode:population.crowdPopulation.mode,enabled:population.enabled,home:population.attendance,away:population.awayAttendance,journey:journeyRef.current,transportSeats:integrated,metroSide,
    visits:{home:candidates.filter(a=>a.side==='home').length,away:candidates.filter(a=>a.side==='away').length},
    station:state.extras.estacao,parking:state.extras.estac,destinations:['loja','hotel','chopp'].filter(id=>state.extras[id]).length}
   const desired=distribuirFluxoComplexo(flowInput)
   for(const visit of visits)if(integrated&&desired.transportVisits[visitorSides.get(visit)!]>0){retiringVisits.add(visit);visit.finishAtOrigin()}
   if(population.enabled){
    const transportOptions={...desired.transport,transit:true,journey:journeyRef.current,
     metroSide:desired.metroSide,seatAccess:integrated?Object.fromEntries(candidates.filter(access=>desired.transportVisits[access.side]>0).map(access=>[access.side,access])):undefined,
     source:population.crowdPopulation.mode==='career'?'career' as const:'qa-sample' as const,homeColor:population.crowdPopulation.homeColor,awayColor:population.crowdPopulation.awayColor}
    if(transportActors)transportActors.configure(transportOptions)
    else{transportActors=criarTransporteComplexo(scene,state,transportOptions);transportActors.update(seconds)}
   }else{transportActors?.dispose();transportActors=undefined}
   flow=distribuirFluxoComplexo({...flowInput,retainedTransport:transportActors?.allocation().effective,retainedMetroSide:transportActors?.allocation().metroSide})
   circulationActors?.configureJourney(journeyRef.current)
   visits.forEach(visit=>{
    if(!retiringVisits.has(visit)){
     visit.configureJourney(journeyRef.current)
     visit.configureColor(visitorSides.get(visit)==='home'?population.crowdPopulation.homeColor:population.crowdPopulation.awayColor)
    }
   })
   const reservedTransport=new Set(transportActors?.reservedSeatIds()??[])
   const drainingVisits=visits.filter(visit=>retiringVisits.has(visit)&&!visit.inspect().journey.completed)
   const accesses=[...candidates.filter(access=>flow!.visits[access.side]>0&&!reservedTransport.has(access.seatId)),
    ...drainingVisits.flatMap(visit=>{const access=architecture.seatAccess.find(access=>access.id===visitorKeys.get(visit));return access?[access]:[]})]
    .filter((access,index,list)=>list.findIndex(other=>other.id===access.id)===index)
   for(const side of ['home','away'] as const){
    const count=accesses.filter(access=>access.side===side).length,extra=count-flow.visits[side]
    flow.visits[side]=count;flow.used[side]+=extra;flow.draining[side]=Math.max(flow.draining[side],flow.used[side]-flow.budget[side])
   }
   const refreshSeats=()=>{
    const reserved=[...visits.map(visit=>visit.inspect().seatId),...reservedTransport]
    const reservationCount=(side:'home'|'away')=>new Set(reserved.filter(id=>architecture.seatAccess.some(access=>access.seatId===id&&access.side===side))).size
    const cohortBudget={home:Math.max(0,Math.round(publico.quota.home*publico.occupancy.home)-reservationCount('home')),away:Math.max(0,Math.round(publico.quota.away*publico.occupancy.away)-reservationCount('away'))}
    if(!population.enabled){crowdDeparture?.dispose();crowdDeparture=undefined}
    if(integrated&&population.enabled&&!crowdDeparture){
     crowdDeparture=criarSaidaTorcidaComplexo(scene,{state,accesses:architecture.seatAccess,excludedSeatIds:reserved,
      budget:cohortBudget,
      journey:journeyRef.current,homeColor:population.crowdPopulation.homeColor,awayColor:population.crowdPopulation.awayColor})
     crowdDeparture.update(seconds)
    }
    crowdDeparture?.configure({journey:journeyRef.current,budget:cohortBudget,homeColor:population.crowdPopulation.homeColor,awayColor:population.crowdPopulation.awayColor})
    crowd.reserve([...reserved,...(crowdDeparture?.reserveSeatIds()??[])])
    const availability={home:!!followedActor('home'),away:!!followedActor('away')}
    setVisitable(old=>old.home===availability.home&&old.away===availability.away?old:availability)
   }
   const key=JSON.stringify([population.actorKey,accesses.map(access=>access.id),flow.used,flow.transport,flow.pedestrians,flow.fans,flow.streetCars])
   if(key===previousActorKey){refreshSeats();return false}
   const circulationKey=JSON.stringify([population.actorKey,flow.pedestrians,flow.fans,flow.streetCars])
   if(circulationKey!==previousCirculationKey){circulationActors?.dispose();circulationActors=undefined}
   const visitKey=JSON.stringify(accesses.map(access=>access.id))
   if(visitKey!==previousVisitKey){
    const previousVisits=visits
    visits=[]
    for(const access of accesses){
     const color=access.side==='home'?population.crowdPopulation.homeColor:population.crowdPopulation.awayColor
     const actorVisitKey=access.id
     let visit=previousVisits.find(candidate=>visitorKeys.get(candidate)===actorVisitKey)
     if(!visit){
      visit=criarVisitaComplexo(scene,{...opcoesVisitaComplexo(state,access),color,journey:journeyRef.current,startSeconds:integrated?seconds:undefined})
      if(visit.inspect().problems.length){visit.dispose();continue}
      visitorSides.set(visit,access.side);visitorKeys.set(visit,actorVisitKey)
     }
     visit.update(seconds);visits.push(visit)
    }
    for(const visit of previousVisits)if(!visits.includes(visit)){
     visit.dispose();visitorSides.delete(visit);visitorKeys.delete(visit);retiringVisits.delete(visit)
    }
    // Arrival on the other side must not replace this rig or release its camera.
    // A changed/removed destination leaves the current camera in place.
    if(followSide&&followedRig&&!followedRig.parent){followSide=undefined;followedCenter=undefined;followedRig=undefined;setFollowing(null)}
   previousVisitKey=visitKey
   }
   refreshSeats()
   if(population.enabled&&!circulationActors){
    circulationActors=criarCirculacaoComplexo(scene,state,surround.solids,{...population.options,journey:journeyRef.current,
     pedestrians:flow.pedestrians,homeFans:flow.fans.home,awayFans:flow.fans.away,cars:flow.streetCars})
    circulationActors.update(seconds);populationRebuilds++
   }
   previousCirculationKey=circulationKey
   previousActorKey=key
   lighting.refreshSources()
   sharpenTextures()
   return true
  }
  rebuildPopulation()
  // Open the district while its train is at the platform. This is only the
  // decorative timetable; the official football clock still comes from match.
  const firstMetro=transportActors?.inspect().vehicles.find(vehicle=>vehicle.kind==='metro')
  if(firstMetro)seconds=firstMetro.markers.arrival+2.2
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  const updateShadows=()=>{
   const distance=camera.position.distanceTo(controls.target)
   const span=THREE.MathUtils.clamp(distance*.85,24,750)
   // A tall portrait view moves the camera much farther back. Keep the map
   // itself clear; haze belongs beyond the district, not over the stadium.
   if(scene.fog instanceof THREE.Fog){scene.fog.near=Math.max(1100,distance+550);scene.fog.far=Math.max(2200,distance+1600)}
   sun.target.position.copy(controls.target);sun.target.position.y=0;sun.position.copy(sun.target.position).add(sunOffset)
   Object.assign(sun.shadow.camera,{left:-span/2,right:span/2,top:span/2,bottom:-span/2});sun.shadow.camera.updateProjectionMatrix()
   // Scale the receiver offset to the filtered shadow texel. A fixed bias
   // leaves curved self-shadow bands on distant roofs and detaches the small
   // contact shadow under a player's boots when the camera is close.
   const texel=span/sun.shadow.mapSize.x,depth=sun.shadow.camera.far-sun.shadow.camera.near
   sun.shadow.bias=-texel*Math.max(1,sun.shadow.radius)*.8/depth
   sun.shadow.normalBias=THREE.MathUtils.clamp(texel*.5,.008,.16)
  }
  render=()=>{
   if(disposed||rendering)return
   rendering=true
   game.update(matchRef.current,performance.now())
   circulationActors?.update(seconds)
   const departure=crowdDeparture?.inspect()
   const drainingSide=(side:'home'|'away')=>visits.some(visit=>visitorSides.get(visit)===side&&retiringVisits.has(visit)&&!visit.inspect().journey.completed)
   const blockNew={home:!!(departure?.busySides.home||departure?.returnPendingSides.home||drainingSide('home')),away:!!(departure?.busySides.away||departure?.returnPendingSides.away||drainingSide('away'))}
   transportActors?.setAccessBlocked(blockNew)
   const occupiedCorridor=()=>{
    const outside=transportActors?.inspect().passengers.filter(p=>p.phase!=='riding')??[]
    const walkers=visits.map(visit=>visit.inspect()).filter(visit=>!visit.journey.completed&&visit.journey.localSeconds>1e-7)
    return{home:outside.some(p=>p.side==='home')||walkers.some(p=>p.side==='home'),away:outside.some(p=>p.side==='away')||walkers.some(p=>p.side==='away')}
   }
   const before=occupiedCorridor()
   if(transportActors?.update(seconds))rebuildPopulation()
   visits.forEach(visit=>{visit.setAccessBlocked(!retiringVisits.has(visit)&&blockNew[visitorSides.get(visit)!]);visit.update(seconds)})
   if(visits.some(visit=>retiringVisits.has(visit)&&visit.inspect().journey.completed))rebuildPopulation()
   const after=occupiedCorridor()
   crowdDeparture?.update(seconds,{blockedSides:{home:before.home||after.home,away:before.away||after.away}})
   if(followSide){
    if(followedRig?.parent&&followedRig.visible&&followedRig.userData.side===followSide){
     const center=followedRig.position.clone().add(new THREE.Vector3(0,1.12,0))
     if(followedCenter){
      const delta=center.clone().sub(followedCenter)
      camera.position.add(delta);controls.target.add(delta)
     }
     followedCenter=center
     camera.lookAt(controls.target)
    }else{followSide=undefined;followedCenter=undefined;followedRig=undefined;setFollowing(null)}
   }
   architecture.updateSeats(camera);updateShadows();lighting.update(camera,controls.target);renderer.render(scene,camera)
   rendering=false
  }
  const fit=(minX:number,maxX:number,minZ:number,maxZ:number,top:number,landmarks:THREE.Vector3[]=[],directionOverride?:THREE.Vector3)=>{
   controls.target.set((minX+maxX)/2,top*.2,(minZ+maxZ)/2)
   // In portrait, a steeper view spends the screen on the district instead of sky.
   const direction=(directionOverride??new THREE.Vector3(.01,camera.aspect<.85?2.5:1.05,1.45)).clone().normalize()
   const points=[minX,maxX].flatMap(x=>[minZ,maxZ].flatMap(z=>[0,top].map(y=>new THREE.Vector3(x,y,z))))
   const place=(distance:number)=>{camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld()}
   const fits=(p:THREE.Vector3)=>{const n=p.clone().project(camera);return Math.abs(n.x)<.92&&Math.abs(n.y)<.89}
   const frame=(required:THREE.Vector3[])=>{
    let low=15,high=1700
    for(let i=0;i<24;i++){const d=(low+high)/2;place(d);if(required.every(fits))high=d;else low=d}
    place(high)
   }
   frame(points)
   if(landmarks.length&&!landmarks.every(fits)){
    // Recenter only when a purchased landmark is clipped (notably in portrait).
    // Fit the actual vertices, avoiding the empty corners of a larger rectangle.
    controls.target.x=(Math.min(minX,...landmarks.map(p=>p.x))+Math.max(maxX,...landmarks.map(p=>p.x)))/2
    frame([...points,...landmarks])
   }
  }
  const navigation=criarNavegacaoComplexo({camera,controls,onChange:()=>render(),onExplore:()=>{followSide=undefined;followedCenter=undefined;setFollowing(null)}})
  navigation.setMode(navigationModeRef.current)
  const view=(next:VistaComplexo,draw=true)=>{
   navigation.beginView({fitOnResize:['original','region','field','estacao','vadico'].includes(next),terrainGuard:['original','region','estacao','vadico'].includes(next)||(next==='field'&&!state.roofClosed)})
   setSelectedView(next)
   mode=next;focusedSeat=undefined;followSide=undefined;followedCenter=undefined;setFollowing(null)
   if(next==='original')fit(-190,190,-140,175,32,stationFrame)
   else if(next==='region')fit(-300,300,-235,270,35)
   else if(next==='field'){
    if(state.roofClosed){controls.target.set(0,0,-8);camera.position.set(0,14,39)}
    else fit(-57,57,-40,40,2)
   }
   else if(next==='stands'){
    const occupied=crowd.inspect().seats,occupiedIds=new Set(occupied.map(seat=>seat.id))
    const preferred=architecture.seats.filter(seat=>seat.tier==='lower'&&(seat.sector==='geral'||seat.sector==='cadeiras'))
    const filled=preferred.filter(seat=>occupiedIds.has(seat.id)),otherFilled=occupied.filter(seat=>seat.tier==='lower')
    const candidates=filled.length?filled:otherFilled.length?otherFilled:preferred
    const seat=candidates.sort((a,b)=>Math.abs(a.row-5)-Math.abs(b.row-5)||Math.abs(a.position.x)-Math.abs(b.position.x))[0]??architecture.seats[0]
    if(!seat){view('field');return}
    const p=seat.position;focusedSeat=seat.id
    controls.target.set(p.x,p.y+1,p.z)
    camera.position.set(p.x+Math.sin(seat.heading)*8,p.y+3,p.z+Math.cos(seat.heading)*8)
   }
   else if(next==='entrance'){const gate=PLANTA_COMPLEXO.gates.home;controls.target.set(gate.threshold.x,2,gate.threshold.z);camera.position.set(18,12,116)}
   else if(next==='away-entrance'){const gate=PLANTA_COMPLEXO.gates.away;controls.target.set(gate.threshold.x,2,gate.threshold.z);camera.position.set(138,12,24)}
   else if(next==='visit-home'||next==='visit-away'){
    const side=next==='visit-home'?'home':'away',access=selectedAccess(side)
    if(!access){view(side==='home'?'entrance':'away-entrance');return}
    const p=access.standing,heading=access.seat.heading,distance=camera.aspect<.85?1.65:1;focusedSeat=access.seatId
    controls.target.set(p.x,p.y+1,p.z)
    camera.position.set(p.x+(Math.sin(heading)*5+Math.cos(heading)*2)*distance,p.y+1+1.7*distance,p.z+(Math.cos(heading)*5-Math.sin(heading)*2)*distance)
   }
   else if(next==='follow-home'||next==='follow-away'){
    const side=next==='follow-home'?'home':'away',actor=followedActor(side),access=selectedAccess(side)
    if(!actor||!access){view(side==='home'?'entrance':'away-entrance');return}
    followSide=side;followedRig=actor.root;followedCenter=actor.root.position.clone().add(new THREE.Vector3(0,1.12,0));setFollowing(side);focusedSeat=String(actor.root.userData.seatId??access.seatId)
    const p=followedCenter,h=access.seat.heading,distance=camera.aspect<.85?1.65:1
    controls.target.copy(p);camera.position.set(p.x+(Math.sin(h)*5+Math.cos(h)*2)*distance,p.y+1.7*distance,p.z+(Math.cos(h)*5-Math.sin(h)*2)*distance)
   }
   else if(next==='room'){
    if(architecture.counts.presidentBox){camera.position.set(1,11.1,76.8);controls.target.set(-6.4,10,70.6)}
    else{view('entrance');return}
   }
   else if(next==='office'){
    if(architecture.counts.presidentBox){camera.position.fromArray(PLANTA_COMPLEXO.presidentBox.camera);controls.target.fromArray(PLANTA_COMPLEXO.presidentBox.target)}
    else{mode='entrance';controls.target.set(0,2,82);camera.position.set(18,12,116)}
   }
   else if(next==='vadico'){
    const b=PLANTA_VADICO.bounds
    // Keep the facade readable in portrait too, with all display cars in view.
    fit(b.minX-2,b.maxX+2,b.minZ-2,b.maxZ+2,8,[],camera.aspect<.85?new THREE.Vector3(-.25,1.05,1.3):new THREE.Vector3(.18,.65,1.3))
   }
   else if(next==='estacao'){
    const points=transportPlan.surfaces.filter(surface=>surface.id.startsWith('estacao-')).flatMap(surface=>surface.polygon)
    if(!points.length){view('original');return}
    fit(Math.min(...points.map(p=>p.x))-8,Math.max(...points.map(p=>p.x))+8,
     Math.min(...points.map(p=>p.z))-8,Math.max(...points.map(p=>p.z))+8,16)
   }
   else if(next==='metro'||next==='onibus'||next==='estacionamento'){
    const kind=next==='metro'?'metro':next==='onibus'?'bus':'car',service=transportPlan.services.find(s=>s.kind===kind)
    if(!service){view('original');return}
    const p=service.stop.position,h=service.stop.heading,side=service.door.side,portrait=camera.aspect<.85?1.25:1
    if(kind==='metro'){
     // Stand inside the platform at human height. A high aerial camera sees
     // the canopy instead of the person crossing the train doorway.
     const door=service.width/2+.075,lateral=5.8*portrait,forward=3.2*portrait
     controls.target.set(p.x+Math.cos(h)*side*door,p.y+service.floorHeight+1,p.z-Math.sin(h)*side*door)
     camera.position.set(p.x+Math.cos(h)*side*lateral+Math.sin(h)*forward,p.y+service.floorHeight+1.7,p.z-Math.sin(h)*side*lateral+Math.cos(h)*forward)
    }else{
     const distance=(kind==='bus'?17:12)*portrait
     controls.target.set(p.x,p.y+service.floorHeight+1,p.z)
     camera.position.set(p.x+Math.cos(h)*side*distance+Math.sin(h)*distance*.35,controls.target.y+distance*.48,p.z-Math.sin(h)*side*distance+Math.cos(h)*distance*.35)
    }
   }
   else{const lot=PLANTA_COMPLEXO.lots[next];const door=lot.door;controls.target.set(door?.threshold.x??lot.x,2.4,door?.threshold.z??lot.z);const heading=door?.heading??lot.heading;camera.position.set(controls.target.x+Math.sin(heading)*24,12,controls.target.z+Math.cos(heading)*24)}
   if(draw){navigation.constrain();if(!controls.update())render()}
  }
  const resize=()=>{const width=el.clientWidth,height=el.clientHeight;if(!width||!height)return
   quality=visualProfile(width,height);renderer.setPixelRatio(quality.pixelRatio)
   renderer.setSize(width,height,false);sharpenTextures();navigation.resize(width,height,()=>view(mode,false))
  }
  const walking=()=>!!(circulationActors||transportActors||visits.length||crowdDeparture)&&!pausedRef.current&&!reduced.matches
  const running=()=>visible&&!document.hidden&&(walking()||(!!matchRef.current&&(matchRef.current.visualClock?.running??(!matchRef.current.paused&&!matchRef.current.finished))))
  const tick=(now:number)=>{if(disposed)return;if(walking()&&last)seconds+=(now-last)/1000;last=now;render();if(running())raf=requestAnimationFrame(tick)}
  const resume=()=>{cancelAnimationFrame(raf);last=0;render();if(running())raf=requestAnimationFrame(tick)};wake.current=resume
  refreshPopulation.current=()=>{if(disposed)return;crowd.update(populationRef.current.crowdPopulation);if(rebuildPopulation())resume();else render()}
  refreshFurniture.current=()=>{if(disposed)return;if(furniture.update(walletRef.current)){roomLights.forEach(lamp=>{lamp.shadow.needsUpdate=true});sharpenTextures()}render()}
  refreshJourney.current=()=>{if(disposed)return;lighting.setPeriod(journeyRef.current?.period??'day');rebuildPopulation();resume()}
  const homeKey=(event:KeyboardEvent)=>{if(event.key==='Home'&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.target===renderer.domElement){event.preventDefault();view('original')}}
  renderer.domElement.addEventListener('keydown',homeKey)
  const checkLighting=()=>{const pixels=new Uint16Array(reflection.width*reflection.height*4);renderer.readRenderTargetPixels(reflection,0,0,reflection.width,reflection.height,pixels);let invalidSamples=0,litSamples=0;for(let i=0;i<pixels.length;i++)if(i%4!==3){if((pixels[i]&0x7c00)===0x7c00)invalidSamples++;else if(pixels[i]>0)litSamples++}return {invalidSamples,litSamples}}
  const inspectCirculation=()=>circulationActors?{...circulationActors.inspect(),attendance:populationRef.current.attendance,awayAttendance:populationRef.current.awayAttendance}:undefined
  const checkDealershipView=()=>{
   scene.updateMatrixWorld(true)
   const sign=surround.root.userData.dealership.sign.position
   const targets=[{id:'letreiro',position:new THREE.Vector3(sign.x,sign.y,sign.z),allowance:.04},
    ...PLANTA_VADICO.cars.map(car=>({id:car.id,position:new THREE.Vector3(car.x,car.y+.9,car.z+2.2),allowance:2.5}))]
   const ray=new THREE.Raycaster()
   return targets.map(target=>{
    const direction=target.position.clone().sub(camera.position),distance=direction.length()
    ray.set(camera.position,direction.normalize());ray.near=.12;ray.far=Math.max(.12,distance-target.allowance)
    // Stop before the car's own body, but retain real foreground occlusion.
    // Frustum projection alone missed the hotel covering stock in portrait.
    const hit=ray.intersectObjects(scene.children,true).find(hit=>{
     for(let object:THREE.Object3D|null=hit.object;object;object=object.parent)if(!object.visible)return false
     return true
    })
    return{id:target.id,visible:!hit,occluder:hit?.object.name}
   })
  }
  api.current={view,zoom:navigation.zoom,setNavigationMode:value=>{navigation.setMode(value);setNavigationMode(value)},checkLighting,checkDealershipView,seekCirculation:value=>{seconds=Number.isFinite(value)?Math.max(0,value):0;last=0;render()},inspect:()=>({state,journey:journeyRef.current,lighting:lighting.inspect(),match:game.inspect(),circulation:inspectCirculation(),transport:transportActors?.inspect(),flow,crowd:crowd.inspect(),crowdDeparture:crowdDeparture?.inspect(),visits:visits.map(visit=>({...visit.inspect(),source:populationRef.current.crowdPopulation.mode})),furniture:{...furniture.inspect(),ceilingLights:roomLights.length},populationRebuilds,view:mode,following:followSide??null,visitRow:populationRef.current.visitRow,visitTier:populationRef.current.visitTier,focusedSeat,camera:camera.position.toArray(),target:controls.target.toArray(),cameraFov:camera.fov,viewport:[el.clientWidth,el.clientHeight],navigation:navigation.inspect(),quality,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,canvas:[renderer.domElement.width,renderer.domElement.height],shadowMap:renderer.shadowMap.enabled,architecture:architecture.root.userData,seatDetail:architecture.inspectSeatDetail(),landscape:surround.root.userData.landscape,roads:surround.root.userData.roadNetwork?.diagnostics,pedestrianNetwork:surround.root.userData.pedestrianNetwork,dealership:surround.root.userData.dealership,establishments:[...surround.establishments]})}
  const observer=new ResizeObserver(resize);observer.observe(el)
  const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;resume()});visibility.observe(el)
  document.addEventListener('visibilitychange',resume)
  reduced.addEventListener('change',resume)
  const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);setError('A vista 3D foi interrompida. Reabra para tentar novamente.')};renderer.domElement.addEventListener('webglcontextlost',lost)
  resize();setLoaded(true);ready.current?.(api.current);resume()
  return()=>{disposed=true;cancelAnimationFrame(raf);api.current=null;ready.current?.(null);wake.current=()=>{};refreshPopulation.current=()=>{};refreshFurniture.current=()=>{};refreshJourney.current=()=>{};observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);navigation.dispose();renderer.domElement.removeEventListener('keydown',homeKey);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);lighting.dispose();circulationActors?.dispose();transportActors?.dispose();visits.forEach(visit=>visit.dispose());furniture.dispose();crowdDeparture?.dispose();crowd.dispose();game.dispose();architecture.dispose();surround.dispose();reflection.dispose();roomLights.forEach(lamp=>{lamp.shadow.map?.dispose();lamp.dispose()});sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[saveKey])
 useEffect(()=>{refreshPopulation.current()},[populationKey])
 useEffect(()=>{refreshFurniture.current()},[walletKey])
 useEffect(()=>{refreshJourney.current()},[journeyKey])
 const go=(destination:VistaComplexo)=>{api.current?.view(destination);root.current?.querySelector('canvas')?.focus({preventScroll:true});setPlacesOpen(false)}
 return <section ref={section} className={`pc3-review${expanded?' pc3-expanded':''}`} data-expanded={expanded}
  role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label="Mapa do estádio" onKeyDown={event=>{
   if(event.key==='Escape'){
    if(placesOpen){setPlacesOpen(false);placesButton.current?.focus();event.preventDefault();event.stopPropagation()}
    else if(expanded){setExpanded(false);event.preventDefault();event.stopPropagation()}
   }
   if(expanded&&event.key==='Tab'){
    const elements=Array.from(section.current?.querySelectorAll<HTMLElement>('button:not(:disabled),canvas[tabindex="0"]')??[]).filter(node=>node.getClientRects().length)
    const first=elements[0],last=elements.at(-1)
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  }}>
  <div className="pc3-stage">
   <div ref={root} className="pc3-viewport" data-complexo-3d="true" aria-busy={!loaded} onPointerDown={()=>setPlacesOpen(false)}>
    {!loaded&&!error&&<p className="pc3-loading" role="status">Preparando o mapa…</p>}
    {error&&<p className="pc3-error" role="alert">{error}</p>}
   </div>
   <div className="pc3-hud pc3-topbar">
    <div className="pc3-primary">
     <button type="button" disabled={!loaded} aria-label="Estádio e região" aria-pressed={selectedView==='original'||selectedView==='region'} onClick={()=>go('original')}>Mapa</button>
     <button type="button" disabled={!loaded} aria-pressed={selectedView==='field'} onClick={()=>go('field')}>Ver campo</button>
     <button ref={placesButton} type="button" disabled={!loaded} aria-expanded={placesOpen} aria-controls={`${uiId}-places`} onClick={()=>setPlacesOpen(value=>!value)}>Locais <span aria-hidden="true">⌄</span></button>
    </div>
    <button ref={expandButton} className="pc3-expand" type="button" aria-label={expanded?'Fechar mapa ampliado':'Ampliar mapa'} title={expanded?'Fechar mapa ampliado':'Ampliar mapa'} onClick={toggleExpanded}>
     <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{expanded?<path d="m6 6 12 12M18 6 6 18"/>:<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>}</svg>
    </button>
   </div>
   {placesOpen&&<div className="pc3-places" id={`${uiId}-places`} aria-label="Locais do mapa">
    <p>Explore o estádio</p>
    {hasSeatView&&<button type="button" onClick={()=>go('stands')}>Arquibancada</button>}
    <button type="button" onClick={()=>go('entrance')}>Entrada dos mandantes</button>
    <button type="button" onClick={()=>go('away-entrance')}>Entrada dos visitantes</button>
    {visitable.home&&<button type="button" aria-pressed={following==='home'} onClick={()=>go('follow-home')}>Acompanhar torcida da casa</button>}
    {visitable.away&&<button type="button" aria-pressed={following==='away'} onClick={()=>go('follow-away')}>Acompanhar visitantes</button>}
    {hasBox&&<><button type="button" onClick={()=>go('office')}>Vista do camarote</button><button type="button" onClick={()=>go('room')}>Sala da Presidência</button></>}
    <p>Na região</p>
    <button type="button" onClick={()=>go('vadico')}>Vadico Veículos</button>
    {(['loja','hotel','chopp','praca'] as const).filter(id=>currentState.extras[id]).map(id=><button key={id} type="button" onClick={()=>go(id)}>{{loja:'Loja do clube',hotel:'Hotel',chopp:'Choperia',praca:'Praça'}[id]}</button>)}
    {circulation&&<button type="button" onClick={()=>go('onibus')}>Ponto de ônibus</button>}
    {currentState.extras.estacao&&<><button type="button" onClick={()=>go('estacao')}>Estação e passarelas</button><button type="button" onClick={()=>go('metro')}>Metrô</button></>}
    {currentState.extras.estac&&<button type="button" onClick={()=>go('estacionamento')}>Estacionamento</button>}
    {circulation&&<button className="pc3-pause" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Retomar passeio':'Pausar passeio'}</button>}
   </div>}
   <div className="pc3-hud pc3-navigation" aria-label="Controles do mapa">
    <button type="button" className="pc3-zoom" disabled={!loaded} aria-label="Aproximar" title="Aproximar" onClick={()=>api.current?.zoom(1)}>+</button>
    <button type="button" className="pc3-zoom" disabled={!loaded} aria-label="Afastar" title="Afastar" onClick={()=>api.current?.zoom(-1)}>−</button>
    <button type="button" disabled={!loaded} onClick={()=>go('original')}>Ver tudo</button>
    <button type="button" disabled={!loaded} aria-label="Girar" aria-pressed={navigationMode==='rotate'} title="Ativar ou desativar rotação ao arrastar" onClick={()=>api.current?.setNavigationMode(navigationMode==='pan'?'rotate':'pan')}>Girar</button>
   </div>
   <p className="pc3-help" id={`${uiId}-help`}>{navigationMode==='rotate'?'Arraste para girar.':'Arraste para explorar.'} <span className="pc3-help-touch">Use dois dedos para aproximar.</span><span className="pc3-help-mouse">Use a roda para aproximar. Setas para mover.</span></p>
  </div>
 </section>
}
