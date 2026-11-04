import {criarVidaLocais} from './presidencia-locais-vida'
import {ARENA_ONLINE as ARENA} from './arena-planta'
import {TERRENO_USUARIO as HOME} from './residencia-planta'
import {duplaDaGaragem} from './presidencia-garagem'
import {LOTE_AGENCIA_CLUBE,nomeAgenciaClube,type DestinoClubeMapa} from './clube-mapa-destinos'
import './clube-mapa.css'
import {LOTES_PATROCINADORES_CIDADE} from './presidencia-patrocinadores-planta'
import {criarZoomCameraFixa} from './presidencia-camera-zoom-fixo'
import {framePacer} from './cidade3d/frame-pacer.mjs'
import {criarLodCadeirasMobile} from './presidencia-cadeiras-lod-mobile'
import {renderBudget} from './cidade3d/render-budget.mjs'
import {criarVidaBotecos} from './presidencia-vida-botecos'
import {criarCidadeViva} from './presidencia-cidade-viva-3d'
import {criarTradicoesBairroSeguro} from './presidencia-bairro-tradicoes-3d'
import type {CidadeViva} from './presidencia-cidade-viva'
import {criarPreparacaoEstadio} from './presidencia-preparacao-estadio'
import {criarAcessosEstadio} from './presidencia-acessos-estadio'
import {useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import type {StadiumSave} from './estadiodata'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import {complexoDoEstadio,PLANTA_COMPLEXO} from './presidencia-complexo-model'
import {criarArquiteturaComplexo} from './presidencia-complexo-arquitetura'
import {criarEntornoComplexo} from './presidencia-complexo-entorno'
import {PLANTA_VADICO} from './presidencia-complexo-concessionaria'
import {criarPartidaComplexo} from './presidencia-complexo-partida'
import {criarPlacasComplexo} from './presidencia-complexo-placas'
import {criarCameraPartidaContinua,type CameraPartidaContinua} from './presidencia-camera-partida-continua'
import {createResidents} from './cidade3d/residents.mjs'
import {criarEquipeApoioEstadio} from './presidencia-estadio-equipe-apoio'
import {criarOuvinteEstadio,setMuted,isMuted,onSoundChange} from './sound'
import {criarDiaDeJogo} from './presidencia-dia-jogo'
import {criarDiaDeFinal} from './presidencia-complexo-final'
import {criarChegadaEquipes,type ElencoChegadaCidade} from './presidencia-cidade-equipes'
import {observarCidade} from './presidencia-cidade-camera'
import {criarComercioCidade} from './presidencia-cidade-comercio'
import {cityTrafficBudget} from './cidade3d/population.mjs'
import {criarCirculacaoComplexo,type PopulacaoTesteComplexo} from './presidencia-complexo-circulacao'
import {criarTorcidaComplexo,type PublicoTorcidaComplexo} from './presidencia-complexo-torcida'
import {criarSaidaTorcidaComplexo} from './presidencia-complexo-torcida-saida'
import {publicoDoEstadio,type DiaEstadio} from './presidencia-estadio-publico'
import {criarVisitaComplexo,opcoesVisitaComplexo} from './presidencia-complexo-visita'
import {criarMobiliaComplexo} from './presidencia-complexo-mobilia'
import {criarRotinasPatrocinadores} from './patrocinadores-rotinas-3d'
import {criarEntregasVeiculos} from './veiculos-entrega-3d'
import {criarTransporteComplexo} from './presidencia-complexo-transporte'
import {gerarPlantaTransporte} from './presidencia-complexo-transporte-model'
import {distribuirFluxoComplexo} from './presidencia-complexo-fluxo'
import {criarNavegacaoComplexo,type ModoNavegacaoComplexo} from './presidencia-complexo-camera'
import {calcularQualidadeComplexo,aplicarQualidadeTexturasComplexo} from './presidencia-complexo-qualidade'
import {nivelMapaInicial,guardaNivelMapa,ajustesNivelMapa,NIVEIS_MAPA,ABRIR_LENTO_MS,ENGASGO_MS,ENGASGO_QUADROS,proximoEngasgo,type NivelMapa} from './presidencia-mapa-qualidade'
import type {JornadaComplexo} from './presidencia-complexo-jornada'
import {criarIluminacaoComplexo} from './presidencia-complexo-iluminacao'
import type {PresidenciaCarteira} from './presidencia-economia'
import type {PresidenteBaseSave} from './presidencia-carreira'
import {criarPresidenteComplexo,type EstadoArtePresidente} from './presidencia-presidente-3d'
import {useT,getLang} from './lang'
import {INFO_PATROCINADORES,ehPatrocinadorCidade} from './presidencia-patrocinadores-info'
import {criarColecaoSala} from './presidencia-sala-colecao-3d'
import type {TrofeuPresidencia} from './presidencia-trofeus'
import type {ArtesIdentidadeSala} from './presidencia-sala-identidade-assets'
import {tiraCameraPedida,assinaCameraPedida} from './controle-partida-mapa'
import './presidencia-complexo-3d.css'

export type VistaComplexo='arena-online'|'casa-usuario'|'agencia-clube'|'patrocinadores'|'dsouza'|'tidex'|'oittolabs'|'gecg'|'original'|'region'|'field'|'stands'|'entrance'|'away-entrance'|'office'|'room'|'president'|'shelf'|'visit-home'|'visit-away'|'follow-home'|'follow-away'|'loja'|'hotel'|'chopp'|'praca'|'estacao'|'metro'|'onibus'|'estacionamento'|'vadico'|'city-street'|'coach-arrival'|'coach-door'|'technical-area'|'team-entrance'|'team-field'|'matchday'|'matchday-streets'|'boteco-oswaldo'|'bar-esquina'|'feira'|'banca'|'campinho'|'padaria'|'praca-bairro'|'espetinho'|'jogo-bairro'|'varal'|'flanelinha'|'cadeiras'|'tv-boteco'
/** 🔋 quanto tempo a cidade continua andando depois do último toque no mapa */
const VIVO_MS=12000
const CAMERAS_PARTIDA:readonly {value:CameraPartidaContinua;label:string}[]=[
 {value:'broadcast',label:'Transmissão'},
 {value:'fixed',label:'Lateral fixa'},
 {value:'follow',label:'Acompanhar o lance'},
 {value:'tele',label:'Lateral próxima'},
 {value:'wide',label:'Ampla'},
 {value:'goal',label:'Atrás do gol'},
 {value:'tactical',label:'Tática'},
 {value:'free',label:'Mapa livre'},
]
export type ControleComplexo={checkCivilian:(index?:number)=>void;setMatchCamera:(mode:CameraPartidaContinua)=>void;view:(view:VistaComplexo)=>void;zoom:(direction:1|-1)=>void;setNavigationMode:(mode:ModoNavegacaoComplexo)=>void;seekCirculation:(seconds:number)=>void;inspect:()=>unknown;checkLighting:()=>{invalidSamples:number;litSamples:number};checkDealershipView:()=>{id:string;visible:boolean;occluder?:string}[]}

/** Physical reconstruction for local visual review. It only reads the existing save and match clock. */
export default function PresidenciaComplexo3D({cidadeViva,stadium,cityStadium,clubName,onOpenClub,match,circulation=false,qaPopulation=false,day,awayStadium,awayDay,presidency,president,trophies=[],identityArt,trophyPage=0,journey,arrivalTeams,fora=false,visitRow=5,visitTier='lower',presentation='map',matchPresentation='3d',onUnavailable,onReady,hud,garage}:{/** 🚗 03/11: a dupla escolhida em "Sua garagem" (sem ela: os 2 primeiros veículos) */garage?:unknown;/** 🏙️ obra em canteiro, humor do boteco e carreata (presidencia-cidade-viva.ts) */cidadeViva?:CidadeViva;stadium?:StadiumSave;cityStadium?:StadiumSave;clubName?:string;onOpenClub?:(target:DestinoClubeMapa)=>void;match?:EstadoPartidaEstadio;circulation?:boolean;qaPopulation?:boolean;day?:DiaEstadio;awayStadium?:StadiumSave;awayDay?:DiaEstadio;presidency?:PresidenciaCarteira|null;president?:PresidenteBaseSave;trophies?:readonly TrofeuPresidencia[];identityArt?:ArtesIdentidadeSala;trophyPage?:number;journey?:JornadaComplexo;arrivalTeams?:ElencoChegadaCidade;fora?:boolean;visitRow?:number;visitTier?:'lower'|'upper';presentation?:'map'|'window'|'office';matchPresentation?:'2d'|'3d';onUnavailable?:()=>void;onReady?:(api:ControleComplexo|null)=>void;/** 📺 25/10: placar e controle da partida desenhados POR CIMA do 3D (vale na tela cheia) */hud?:ReactNode}){
 const root=useRef<HTMLDivElement>(null),api=useRef<ControleComplexo|null>(null),ready=useRef(onReady),matchRef=useRef(match),wake=useRef(()=>{}),refreshPopulation=useRef(()=>{}),refreshFurniture=useRef(()=>{}),refreshJourney=useRef(()=>{}),walletRef=useRef(presidency),journeyRef=useRef(journey)
 const t=useT()
 const clubActionRef=useRef(onOpenClub);clubActionRef.current=onOpenClub
 const cidadeVivaRef=useRef(cidadeViva);cidadeVivaRef.current=cidadeViva;const cidadeVivaKey=JSON.stringify(cidadeViva??null)
 useEffect(()=>{wake.current()},[cidadeVivaKey]) // 🏙️ mudou a cidade (obra, resultado, título): um quadro novo, sem laço
 const managementEnabled=!!onOpenClub
 const arrivalRef=useRef(arrivalTeams);arrivalRef.current=arrivalTeams
 const garageRef=useRef<unknown>(garage);garageRef.current=garage
 ready.current=onReady;matchRef.current=match;walletRef.current=presidency;journeyRef.current=journey
 const isWindow=presentation==='window',isOffice=presentation==='office',unavailable=useRef(onUnavailable);unavailable.current=onUnavailable
 const presidentRef=useRef(president);presidentRef.current=president
 const [presidentStatus,setPresidentStatus]=useState<EstadoArtePresidente>('empty'),retryPresident=useRef(()=>{})
 const collectionRef=useRef({trophies,identityArt,trophyPage});collectionRef.current={trophies,identityArt,trophyPage}
 const presidentKey=JSON.stringify([president??null,trophies,identityArt,trophyPage])
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[hasSeatView,setHasSeatView]=useState(false),[visitable,setVisitable]=useState({home:false,away:false}),[following,setFollowing]=useState<'home'|'away'|null>(null),[paused,setPaused]=useState(false),pausedRef=useRef(paused)
 const userExploring=useRef(false)
 const [nivel,setNivel]=useState<NivelMapa>(nivelMapaInicial),[caiuProLeve,setCaiuProLeve]=useState(false),nivelRef=useRef(nivel);nivelRef.current=nivel
 // ⚙️ travou de verdade (abriu devagar demais ou ficou engasgando): cai pro Leve, guarda e avisa — só pra BAIXO e uma vez
 const caiPraLeve=useRef(()=>{});caiPraLeve.current=()=>{if(nivelRef.current==='leve')return;guardaNivelMapa('leve');setCaiuProLeve(true);setNivel('leve')}
 const [stadiumSound,setStadiumSound]=useState(false),stadiumSoundRef=useRef(false);stadiumSoundRef.current=stadiumSound
 const [matchCamera,setMatchCamera]=useState<CameraPartidaContinua>('free')
 const [replayOn,setReplayOn]=useState(false),replayRef=useRef(false)
 useEffect(()=>{if(!loaded)return;const atende=()=>{if(!api.current)return;const c=tiraCameraPedida();if(c)api.current.setMatchCamera(c as CameraPartidaContinua)};atende();return assinaCameraPedida(atende)},[loaded]) // 🏟️ a câmera que a carreira pediu (botão 🏟️ Campo 3D)
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
 const citySaveKey=JSON.stringify(cityStadium??stadium??{inv:{},ext:[]})
 const currentCityState=complexoDoEstadio(cityStadium??stadium)
 const currentState=complexoDoEstadio(stadium),hasBox=managementEnabled||currentState.lowerComplete&&currentState.progress.camarote>0
 // Arrival, the match and departure belong to the same attendance reservation.
 // A final whistle changes routes, not the identities or number of people
 // already walking through a doorway or sitting in the stadium.
 const populationDay=day&&journey?.hosting&&journey.phase!=='idle'?{...day,match:journey.phase==='interval'?'interval' as const:'playing' as const}:day
 const visitorDay=awayDay&&journey?.hosting&&journey.phase!=='idle'?{...awayDay,match:journey.phase==='interval'?'interval' as const:'playing' as const}:awayDay
 // QA is opt-in. Missing career data must not manufacture a visiting fanbase.
 const attendance=populationDay&&currentState.valid?publicoDoEstadio(stadium??{inv:{},ext:[]},populationDay):undefined
 const awayAttendance=attendance&&awayStadium&&visitorDay?publicoDoEstadio(awayStadium,visitorDay):undefined
 const populationMode=attendance?'career':qaPopulation?'qa-sample':'off'
 const teamColors=useRef<{key?:string;home?:string;away?:string}>({})
 const teamKey=journey?.key??match?.context.id
 // The next calendar day can arrive before its match snapshot. Missing
 // colours must not replace people still completing the previous journey.
 if(teamColors.current.key!==teamKey)teamColors.current={...teamColors.current,key:teamKey}
 if(arrivalTeams&&arrivalTeams.fixtureId===journey?.fixtureId){teamColors.current.home=arrivalTeams?.teams[0]?.color;teamColors.current.away=arrivalTeams?.teams[1]?.color}
 if(match){teamColors.current.home=match.homeColor;teamColors.current.away=match.awayColor}
 const enabled=circulation&&populationMode!=='off'&&currentState.valid
 const options:PopulacaoTesteComplexo=attendance?{
  stadium:stadium??{inv:{},ext:[]},day:populationDay,awayStadium:awayAttendance?awayStadium:undefined,awayDay:awayAttendance?visitorDay:undefined,
  // 🚌 jogo fora de casa: a cidade é a sua, mas o seu povo foi ver o jogo longe — ruas mais vazias
  pedestrians:fora?1:Math.min(3,attendance.outside),homeFans:fora?1:Math.min(3,attendance.outside),awayFans:awayAttendance?.playing?Math.min(fora?1:2,awayAttendance.outside):0,cars:fora?1:Math.min(2,attendance.cars),
 }:{pedestrians:3,homeFans:1,awayFans:1,cars:1}
 // Only bounded actor counts and their data source affect expensive path validation.
 const actorKey=enabled?JSON.stringify([populationMode,!!options.awayFans&&!!awayAttendance,options.homeFans,options.awayFans,options.cars,options.pedestrians]):'off'
 const crowdPopulation:PublicoTorcidaComplexo={
  ...(populationDay&&currentState.valid?{mode:'career' as const,stadium:stadium??{inv:{},ext:[]},day:populationDay,away:awayStadium&&visitorDay?{stadium:awayStadium,day:visitorDay}:undefined}
   :qaPopulation?{mode:'qa-sample' as const,homeOccupancy:.7,awayOccupancy:.5}:{mode:'off' as const}),
  homeColor:teamColors.current.home,awayColor:teamColors.current.away,
 }
 const populationKey=JSON.stringify([actorKey,attendance,awayAttendance,crowdPopulation,visitRow,visitTier])
 const populationRef=useRef({enabled,actorKey,options,attendance,awayAttendance,crowdPopulation,visitRow,visitTier})
 populationRef.current={enabled,actorKey,options,attendance,awayAttendance,crowdPopulation,visitRow,visitTier}
 useEffect(()=>{wake.current()},[match,paused,stadiumSound])
 useEffect(()=>{
  const el=root.current;if(!el)return
  setLoaded(false);setHasSeatView(false);setFollowing(null);setVisitable({home:false,away:false});setError('')
  const ajuste=ajustesNivelMapa(nivel),abriuEm=performance.now()
  const save:StadiumSave=JSON.parse(saveKey),state=complexoDoEstadio(save),cityState=complexoDoEstadio(JSON.parse(citySaveKey))
  let renderer:THREE.WebGLRenderer
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:true})}
  catch{setError('Não foi possível abrir esta vista 3D neste aparelho.');unavailable.current?.();return}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap
  renderer.domElement.setAttribute('aria-label',isOffice?'Sala da Presidência em três dimensões':isWindow?'Estádio visto pela janela da Presidência':'Mapa do estádio em três dimensões');if(!isWindow)renderer.domElement.setAttribute('aria-describedby',`${uiId}-help`);renderer.domElement.tabIndex=isWindow?-1:0;el.append(renderer.domElement)
  const gl=renderer.getContext(),gpuExtension=gl.getExtension('WEBGL_debug_renderer_info')
  const softwareGPU=/SwiftShader|llvmpipe|software/i.test(String(gpuExtension?gl.getParameter(gpuExtension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)))
  const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2cd');scene.fog=new THREE.Fog('#cbd2cd',1100,2200)
  const visualProfile=(width:number,height:number)=>{const profile=calcularQualidadeComplexo({width,height,devicePixelRatio:window.devicePixelRatio||1,
   coarsePointer:window.matchMedia('(pointer: coarse)').matches,deviceMemory:(navigator as Navigator&{deviceMemory?:number}).deviceMemory,
   maxTextureSize:renderer.capabilities.maxTextureSize,maxAnisotropy:renderer.capabilities.getMaxAnisotropy()});{const pr=Math.min(profile.pixelRatio,ajuste.tetoPixel);if(pr!==profile.pixelRatio){profile.pixelRatio=pr;profile.drawingWidth=Math.max(1,Math.floor(width*pr));profile.drawingHeight=Math.max(1,Math.floor(height*pr))}profile.maxFPS=Math.min(profile.maxFPS,ajuste.maxFPS)}if(softwareGPU){profile.pixelRatio=Math.min(profile.pixelRatio,.75);profile.drawingWidth=Math.max(1,Math.floor(width*profile.pixelRatio));profile.drawingHeight=Math.max(1,Math.floor(height*profile.pixelRatio))}return profile}
  let quality=visualProfile(el.clientWidth,el.clientHeight)
  const mobileGraphics=window.matchMedia('(pointer: coarse)').matches||quality.constrained||ajuste.leve
  // Retain lighting and cheap contact shadows; omit extra city shadow passes
  // on mobile (up to five heavy passes with the stadium floodlights).
  renderer.shadowMap.enabled=!mobileGraphics
  const graphicsBudget=renderBudget({minPixelRatio:mobileGraphics?.8:nivel==='padrao'?1:1.25}),presentationPacer=framePacer();let ultimoQuadro=0,engasgo=0,quadrosVistos=0;let adaptiveScale=1,interactionUntil=0,vivoAte=0
  const sharpenTextures=()=>aplicarQualidadeTexturasComplexo(scene,quality.anisotropy)
  const camera=new THREE.PerspectiveCamera(38,1,.12,4000),controls=new OrbitControls(camera,renderer.domElement)
  const matchCameraController=criarCameraPartidaContinua(camera,controls,setMatchCamera)
  const hemisphere=new THREE.HemisphereLight('#c9dcf0','#8c7d61',.85);scene.add(hemisphere)
  const sun=new THREE.DirectionalLight('#fff0d9',2.8);sun.position.set(-340,450,270);sun.castShadow=true;sun.shadow.mapSize.set(softwareGPU||el.clientWidth<600?1024:ajuste.sombra,softwareGPU||el.clientWidth<600?1024:ajuste.sombra)
  sun.shadow.normalBias=.055;sun.shadow.bias=-.00012;sun.shadow.radius=2.5
  sun.shadow.intensity=.55 // 🌤️ 28/10 (Diego no mapa de verdade: a sombra do estádio cobria metade do campo em PRETO e quem estava nela virava vulto): sombra só escurece, nunca apaga
  sun.shadow.camera.near=1;sun.shadow.camera.far=1300;scene.add(sun,sun.target)
  const surround=criarEntornoComplexo(scene,cityState,()=>wake.current(),{name:clubName,residence:managementEnabled,arena:managementEnabled}),architecture=criarArquiteturaComplexo(scene,state,{interior:isOffice})
  const seatLod=criarLodCadeirasMobile(architecture.root,true)
  // Automatic football cameras may sit above the roof. Cut away only its
  // colour pass; the opaque shadow/depth material still casts the real shade.
  // Free exploration restores the purchased roof without changing the save.
  const cameraRoofMaterials:{material:THREE.MeshStandardMaterial;transparent:boolean;opacity:number;depthWrite:boolean}[]=[]
  architecture.root.traverse(node=>{if(node instanceof THREE.Mesh)for(const material of Array.isArray(node.material)?node.material:[node.material]){
   if(material instanceof THREE.MeshStandardMaterial&&['cobertura-cinza-curva','juntas-cobertura'].includes(material.name)&&!cameraRoofMaterials.some(entry=>entry.material===material))cameraRoofMaterials.push({material,transparent:material.transparent,opacity:material.opacity,depthWrite:material.depthWrite})
  }})
  let cameraRoofCutaway=false
  const residents=createResidents(scene,surround.root,surround.solids)
  const commerce=criarComercioCidade(scene)
  const pubLife=criarVidaBotecos(scene,surround.botecos,()=>wake.current())
  const cidade=criarCidadeViva(scene,{botecos:surround.botecos,pubLife,transport:surround.transport,onReady:()=>wake.current()})
  const tradicoes=criarTradicoesBairroSeguro(scene,{bairro:surround.bairro,botecos:surround.botecos,solids:surround.solids,clubName,onReady:()=>wake.current()}) // 🇧🇷 feira · banca · pelada
  let lastFieldSubjects:ReturnType<typeof game.subjects>=[],lastFieldFixture:string|undefined
  const teamArrival=criarChegadaEquipes(scene,state,()=>wake.current(),matchPresentation==='2d')
  const matchday=criarDiaDeJogo(scene,state,architecture.seats,()=>wake.current())
  const finalDay=criarDiaDeFinal(scene,state,architecture.seats,()=>wake.current()) // 🏆 dia de FINAL (só existe em final; tudo no arquivo dele)
  setHasSeatView(architecture.seats.length>0)
  const furniture=criarMobiliaComplexo(scene,state,walletRef.current,{interior:isOffice})
  const deliveries=criarEntregasVeiculos(scene,surround.root,surround.solids,managementEnabled&&!isOffice&&!isWindow)
  deliveries.sync(walletRef.current,duplaDaGaragem(walletRef.current?.owned??[],garageRef.current))
  const sponsorLife=criarRotinasPatrocinadores(scene,surround.root,surround.doors,surround.solids,{enabled:managementEnabled&&!isOffice&&!isWindow,mobile:softwareGPU||el.clientWidth<600,onReady:()=>wake.current()})
  let render=()=>{},disposed=false,compilando=false
  let avatarFrame:number|undefined
  const roomLights:THREE.SpotLight[]=[]
  const presidentBody=criarPresidenteComplexo(scene,state,{interior:isOffice||managementEnabled,onChange:status=>{
   if(disposed)return
   setPresidentStatus(status)
   if(status==='loading')return
   if(avatarFrame!==undefined)cancelAnimationFrame(avatarFrame)
   // Rendering is separate from the artwork promise: a WebGL exception must
   // not be mistaken for an image download failure or discard valid artwork.
   avatarFrame=requestAnimationFrame(()=>{
    avatarFrame=undefined;if(disposed)return
    sharpenTextures();roomLights.forEach(lamp=>{lamp.shadow.needsUpdate=true});render()
   })
  }})
  retryPresident.current=()=>{presidentBody.retry()}
  const collection=criarColecaoSala(scene,state,()=>render(),isOffice);collection.update(walletRef.current,collectionRef.current.trophies,collectionRef.current.identityArt,collectionRef.current.trophyPage)
  const game=criarPartidaComplexo(scene,save,matchRef.current,()=>{renderer.shadowMap.needsUpdate=true;wake.current()},()=>presidentRef.current,matchPresentation)
  // 🪧 03/11: placa do Patrocinador Master (fachada + telão, só com contrato ativo) e as placas de patrocínio em volta do gramado.
  // Ela sai junto com o campo (mesmo ciclo de vida), sem mexer na lista de limpeza do mapa.
  const placasEstadio=criarPlacasComplexo(scene,state,()=>wake.current()),soltaCampo=game.dispose;game.dispose=()=>{placasEstadio.dispose();soltaCampo()}
  const localLife=criarVidaLocais(scene,surround.root,surround.solids,managementEnabled,()=>wake.current())
  const stadiumAccess=criarAcessosEstadio(scene,state)
  const stadiumStaff=criarEquipeApoioEstadio(scene,()=>wake.current(),matchPresentation==='3d')
  const stadiumPreparation=criarPreparacaoEstadio(scene,state,architecture.seatAccess,()=>wake.current())
  const stadiumListener=criarOuvinteEstadio(),offSound=onSoundChange(()=>wake.current())
  // The probe sees real static geometry. Exclude bump derivatives from its convolution.
  const bumpMaps=new Map<THREE.MeshStandardMaterial,THREE.Texture>()
  if(!mobileGraphics)scene.traverse(node=>{if(node instanceof THREE.Mesh)for(const mat of Array.isArray(node.material)?node.material:[node.material]){
   if(mat instanceof THREE.MeshStandardMaterial&&mat.bumpMap){bumpMaps.set(mat,mat.bumpMap);mat.bumpMap=null;mat.needsUpdate=true}
  }})
  const generator=new THREE.PMREMGenerator(renderer)
  const reflectedPlayers=scene.getObjectByName('complexo-partida');if(reflectedPlayers)reflectedPlayers.visible=false
  // Capturing the whole city in six cube directions blocked mobile startup.
  // A neutral sky probe retains PBR ambient light without rendering that city
  // six extra times. Desktop keeps the detailed static environment reflection.
  const probeScene=mobileGraphics?new THREE.Scene():scene
  if(mobileGraphics)probeScene.background=new THREE.Color('#cbd2cd')
  const reflection=generator.fromScene(probeScene,0,.1,1800,{size:64,position:new THREE.Vector3(0,8,90)})
  if(reflectedPlayers)reflectedPlayers.visible=true
  for(const [material,map] of bumpMaps){material.bumpMap=map;material.needsUpdate=true}
  scene.environment=reflection.texture;scene.environmentIntensity=.35;generator.dispose();renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true
  // Local ceiling light keeps purchased furniture readable under the roof.
  // Bounded cones illuminate this room; the outdoor exposure stays unchanged.
  if(architecture.counts.presidentBox){
   for(const [x,z,targetZ,intensity] of [[-6.4,72.4,69.7,390],[8,74.1,72.5,170]]){
    const lamp=new THREE.SpotLight('#ffe6c4',intensity,12,.42,.70,2)
    lamp.position.set(x,16.43,z);lamp.target.position.set(x,9.7,targetZ)
    lamp.castShadow=true;lamp.shadow.mapSize.set(512,512)
    lamp.shadow.normalBias=.032;lamp.shadow.bias=-.00002
    lamp.shadow.camera.near=.1;lamp.shadow.camera.far=12
    lamp.shadow.autoUpdate=false;lamp.shadow.needsUpdate=true
    scene.add(lamp,lamp.target);roomLights.push(lamp)
   }
  }
  const lighting=criarIluminacaoComplexo({scene,state,sun,hemisphere,solids:surround.solids})
  lighting.setPeriod(journeyRef.current?.period??'day')
  const crowd=criarTorcidaComplexo(scene,architecture.seats,populationRef.current.crowdPopulation,{detailedDistance:mobileGraphics?80:120,pixelDistance:240,detailLimit:mobileGraphics?40:100})
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
  let mode:VistaComplexo=isOffice?'room':isWindow?'office':'original',savedMapView:VistaComplexo=mode,fieldWatchPending=false,focusedSeat:string|undefined,raf=0,visible=true,rendering=false,seconds=6,last=0
  const rebuildPopulation=()=>{
   const population=populationRef.current,publico=crowd.inspect()
   const residentBefore=residents.count()
   residents.configure({enabled:population.enabled,supporters:population.attendance?.supporters??(population.crowdPopulation.mode==='qa-sample'?120000:0),built:Object.values(state.extras).filter(Boolean).length,mobile:softwareGPU||el.clientWidth<600||quality.constrained||ajuste.populacaoReduzida})
   commerce.configure({enabled:population.enabled})
   const ambientCars=cityTrafficBudget({enabled:population.enabled,supporters:population.attendance?.supporters??(qaPopulation?120000:0),mobile:softwareGPU||el.clientWidth<600||quality.constrained||ajuste.populacaoReduzida})
   const residentChanged=residentBefore!==residents.count()
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
    const transportOptions={coachPriority:false,...desired.transport,transit:true,journey:journeyRef.current,
     metroSide:desired.metroSide,seatAccess:integrated?Object.fromEntries(candidates.filter(access=>desired.transportVisits[access.side]>0).map(access=>[access.side,access])):undefined,
     source:population.crowdPopulation.mode==='career'?'career' as const:'qa-sample' as const,homeColor:population.crowdPopulation.homeColor,awayColor:population.crowdPopulation.awayColor}
    if(transportActors)transportActors.configure(transportOptions)
    else{transportActors=criarTransporteComplexo(scene,state,transportOptions);transportActors.update(seconds)}
   }else{transportActors?.dispose();transportActors=undefined}
   flow=distribuirFluxoComplexo({...flowInput,retainedTransport:transportActors?.allocation().effective,retainedMetroSide:transportActors?.allocation().metroSide})
   circulationActors?.configureJourney(journeyRef.current);circulationActors?.configureColors(population.crowdPopulation.homeColor,population.crowdPopulation.awayColor)
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
   const key=JSON.stringify([population.actorKey,accesses.map(access=>access.id),flow.used,flow.transport,flow.pedestrians,flow.fans,flow.streetCars,ambientCars])
   if(key===previousActorKey){refreshSeats();return residentChanged}
   const circulationKey=JSON.stringify([population.actorKey,flow.pedestrians,flow.fans,flow.streetCars,flow.rua,ambientCars])
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
     pedestrians:flow.pedestrians,homeFans:flow.rua.fansHome,awayFans:flow.rua.fansAway,cars:Math.min(10,flow.rua.cars+ambientCars),homeColor:population.crowdPopulation.homeColor,awayColor:population.crowdPopulation.awayColor})
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
  let lastShadowAt=-Infinity,lastShadowSpan=0,ataque:1|-1=1,ataqueDesde:number|null=null
  const lastShadowTarget=new THREE.Vector3(Infinity,Infinity,Infinity)
  const updateShadows=()=>{
   const distance=camera.position.distanceTo(controls.target)
   const span=THREE.MathUtils.clamp(distance*.85,24,750),now=performance.now()
   // (〰️ 26/10: vendo o jogo, a sombra do boneco andava em degraus — 15×/s no celular, 30×/s no PC — e "tremia" embaixo dele.
   // Com a câmera do jogo ligada a sombra acompanha: todo quadro no PC, 30×/s no celular)
   const jogo=!!matchRef.current&&matchCameraController.inspect().mode!=='free'
   const cadence=distance>180?250:jogo?(softwareGPU||el.clientWidth<600?1000/31:0):softwareGPU||el.clientWidth<600?1000/15:1000/30
   const urgent=lastShadowTarget.distanceToSquared(controls.target)>144||Math.abs(span-lastShadowSpan)>10
   if(urgent||now-lastShadowAt>=cadence){renderer.shadowMap.needsUpdate=true;lastShadowAt=now;lastShadowSpan=span;lastShadowTarget.copy(controls.target)}
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
  const frameStats={frames:0,lastRenderMs:0,meanRenderMs:0}
  render=()=>{
   if(disposed||rendering)return
   const started=performance.now();rendering=true
   try{
   if(isOffice){
    const b=PLANTA_COMPLEXO.presidentBox
    camera.position.clamp(new THREE.Vector3(b.minX+.5,b.floor+.6,b.minZ+.5),new THREE.Vector3(b.maxX-.5,b.ceiling-.5,b.maxZ-.5))
    if(mode!=='office'){
     controls.target.clamp(new THREE.Vector3(b.minX+1,b.floor+.5,b.minZ+1),new THREE.Vector3(b.maxX-1,b.ceiling-1,b.maxZ-1))
     for(const item of furniture.inspect().placements){
      const min=new THREE.Vector3(item.bounds.min.x-.25,item.bounds.min.y-.25,item.bounds.min.z-.25),max=new THREE.Vector3(item.bounds.max.x+.25,item.bounds.max.y+.25,item.bounds.max.z+.25)
      if(new THREE.Box3(min,max).containsPoint(camera.position)){
       const choices: ['x'|'y'|'z',number][]=[['x',min.x],['x',max.x],['y',max.y],['z',min.z],['z',max.z]]
       choices.sort((a,b)=>Math.abs(camera.position[a[0]]-a[1])-Math.abs(camera.position[b[0]]-b[1]))
       camera.position[choices[0][0]]=choices[0][1]
      }
     }
    }
    camera.lookAt(controls.target);camera.updateMatrixWorld()
   }
   if(fieldWatchPending&&matchRef.current){fieldWatchPending=false;setFootballCamera(matchPresentation==='2d'?'field2d':'broadcast')}
   if(game.subjects().length&&matchRef.current){lastFieldFixture=matchRef.current.context.id;lastFieldSubjects=game.subjects().map(p=>({...p}))}
   game.update(matchRef.current,performance.now(),camera,el.clientHeight)
   {const insp=game.frame() as {ball:{x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}};phase?:string;replay?:boolean;owner?:string};const subj=game.subjects();let foco:{x:number;y:number;z:number}|undefined
    if(!!insp.replay!==replayRef.current){replayRef.current=!!insp.replay;setReplayOn(replayRef.current)}
    if(insp.phase==='fim'&&subj.length){let sx=0,sz=0,n=0;for(const q of subj){if(q.visible===false)continue;sx+=q.mx;sz+=q.mz;n++}if(n)foco={x:sx/n,y:.2,z:sz/n}}
    // 🎥 pra que lado o time com a bola ataca (o goleiro dele defende o outro lado). Só troca depois de ~0,9 s com a posse firme:
    // dividida e bola batendo-voltando não fazem a câmera 'Acompanhar o lance' virar de lado à toa
    {const own=insp.owner?subj.find(q=>q.key===insp.owner):undefined,gk=own?subj.find(q=>q.side===own.side&&q.keeper):undefined,want:1|-1|undefined=gk?(gk.mx<0?1:-1):undefined,agora=performance.now()
     if(want!==undefined&&want!==ataque){ataqueDesde??=agora;if(agora-ataqueDesde>900){ataque=want;ataqueDesde=null}}else ataqueDesde=null}
    matchCameraController.update(insp.ball,performance.now(),subj,foco,insp.replay?'goal':undefined,ataque)}
   // 🎉 torcida: a arquibancada do time que fez o gol pula durante a festa (lado 0 do motor = quem manda no estádio)
   {const fr=game.frame() as {phase?:string;replay?:boolean;official?:{events?:{tipo:string;lado:number}[]}};let lado:'home'|'away'|null=null;if(fr?.phase==='gol'||fr?.replay){const evs=fr.official?.events;for(let i=(evs?.length??0)-1;i>=0;i--)if(evs![i].tipo==='gol'){lado=evs![i].lado===0?'home':'away';break}}crowd.festa(lado,seconds)}
   if(crowd.perto(camera.position))renderer.shadowMap.needsUpdate=true // (⚡ os detalhados da torcida acompanham a câmera)
   const cutaway=matchCameraController.inspect().mode!=='free'
   if(cutaway!==cameraRoofCutaway){cameraRoofCutaway=cutaway;for(const entry of cameraRoofMaterials){entry.material.transparent=cutaway||entry.transparent;entry.material.opacity=cutaway?0:entry.opacity;entry.material.depthWrite=cutaway?false:entry.depthWrite;entry.material.needsUpdate=true}}
   residents.update(seconds,camera,el.clientHeight)
   commerce.update(seconds,camera,el.clientHeight)
   deliveries.update(seconds)
   sponsorLife.update(seconds,camera,el.clientHeight,journeyRef.current?.period??'day')
   localLife.update(seconds,camera,el.clientHeight,journeyRef.current?.period??'day')
   const sourceMatch=matchRef.current
   const dayJourney=journeyRef.current&&sourceMatch&&sourceMatch.context.id===journeyRef.current.fixtureId?{...journeyRef.current,phase:sourceMatch.finished?'departure' as const:sourceMatch.paused&&sourceMatch.minute===45?'interval' as const:'playing' as const}:journeyRef.current
   const liveRosters=sourceMatch?.officialTeams&&sourceMatch.officialInput?{fixtureId:sourceMatch.context.id,teams:sourceMatch.officialTeams.map((name,i)=>({name,color:i?sourceMatch.awayColor:sourceMatch.homeColor,players:(i?sourceMatch.officialInput!.fora:sourceMatch.officialInput!.casa).map(p=>({name:p.name,pos:p.pos,club:p.club,year:p.year}))}))}:undefined
   const tripRosters=arrivalRef.current?.fixtureId===dayJourney?.fixtureId?arrivalRef.current:liveRosters
   const currentTeams=tripRosters?.teams??(matchRef.current?.officialTeams?.map((name,i)=>({name,color:i?matchRef.current!.awayColor:matchRef.current!.homeColor}))??[])
   stadiumAccess.configure(currentTeams,sourceMatch?.viewerClubId!==undefined?sourceMatch.viewerClubId===sourceMatch.context.awayClubId?'away':'home':fora?'away':'home')
   matchday.configure({journey:dayJourney,teams:currentTeams,supporters:populationRef.current.attendance?.supporters??0,mobile:softwareGPU||el.clientWidth<600},seconds)
   matchday.update(seconds,camera,el.clientHeight)
   cidade.configure(cidadeVivaRef.current,{mobile:softwareGPU||el.clientWidth<600,enabled:populationRef.current.enabled}) // 🏙️ antes do boteco: o humor entra no mesmo quadro
   finalDay.update({match:sourceMatch,journey:dayJourney,teams:currentTeams,frame:game.frame(),subjects:game.subjects().length?game.subjects():lastFieldSubjects,residents:residents.count(),mobile:softwareGPU||el.clientWidth<600,seconds},camera,el.clientHeight)
   pubLife.configure({day:matchday.day(),journey:dayJourney,mobile:softwareGPU||el.clientWidth<600,supporters:populationRef.current.attendance?.supporters??0,enabled:populationRef.current.enabled})
   pubLife.update(seconds,camera,el.clientHeight)
   cidade.update(seconds,camera,el.clientHeight)
   tradicoes.configure(cidadeVivaRef.current,dayJourney,{mobile:softwareGPU||el.clientWidth<600,enabled:populationRef.current.enabled});tradicoes.update(seconds,camera,el.clientHeight)
   void teamArrival.configure(dayJourney,tripRosters,seconds,!!matchRef.current,lastFieldFixture===dayJourney?.fixtureId?lastFieldSubjects:[])
   // Public bus terminal and private coach route have independently tested swept volumes.
   teamArrival.update(seconds,camera,el.clientHeight,true,matchday.key()===journeyRef.current?.key&&matchday.coachesAllowed(),matchday.coachStart())
   game.setPresentationVisible(!teamArrival.overrideField()&&!finalDay.overrideField())
   crowd.presentDay(matchday.day()?.standFill??1)
   stadiumStaff.configure({day:matchday.day(),match:sourceMatch,mobile:softwareGPU||el.clientWidth<600,presidentName:presidentRef.current?.name})
   const observedBall=(game.frame() as {ball?:{x:number;z:number}}).ball
   stadiumStaff.update(seconds,camera,el.clientHeight,observedBall)
   stadiumPreparation.configure({day:matchday.day(),mobile:softwareGPU||el.clientWidth<600,supporters:populationRef.current.attendance?.supporters??0,coaches:teamArrival.inspect().coaches})
   stadiumPreparation.update(seconds,camera,el.clientHeight)
   const soundDistance=camera.position.distanceTo(new THREE.Vector3(0,0,0)),soundLevel=(.04+.96/(1+Math.pow(soundDistance/145,2)))*(matchday.day()?.standFill??0)
   stadiumListener.update(stadiumSoundRef.current&&!isMuted()&&visible&&!document.hidden&&!isOffice&&!!matchday.day()?.active,soundLevel)
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
   seatLod.update(camera);architecture.updateSeats(camera);updateShadows();lighting.update(camera,controls.target);renderer.render(scene,camera)
   }finally{rendering=false;frameStats.frames++;frameStats.lastRenderMs=performance.now()-started;frameStats.meanRenderMs+=(frameStats.lastRenderMs-frameStats.meanRenderMs)/Math.min(120,frameStats.frames)}
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
  const navigation=criarNavegacaoComplexo({camera,controls,solidos:()=>surround.solids,onChange:()=>{interactionUntil=performance.now()+250;vivoAte=performance.now()+VIVO_MS;wake.current()},onExplore:()=>{userExploring.current=true;fieldWatchPending=false;matchCameraController.explore();followSide=undefined;followedCenter=undefined;setFollowing(null)}})
  const fixedCameraZoom=criarZoomCameraFixa(renderer.domElement,()=>['fixed','field2d'].includes(matchCameraController.inspect().mode),factor=>{if(matchCameraController.zoomFixed(factor))resume()})
  navigation.setMode(navigationModeRef.current)
  if(isWindow)controls.enabled=false
  const view=(next:VistaComplexo,draw=true)=>{
   if(managementEnabled&&!isOffice&&next==='room')next='casa-usuario'
   if(next==='field'&&matchRef.current&&!isOffice&&!isWindow){setFootballCamera(matchPresentation==='2d'?'field2d':'broadcast');return}
   fieldWatchPending=next==='field'&&!isOffice&&!isWindow
   matchCameraController.explore()
   if(isOffice&&!['room','office','president','shelf'].includes(next))next='room'
   if(isOffice){controls.enabled=next!=='office';camera.fov=next==='president'?32:48;camera.updateProjectionMatrix()}
   else{camera.fov=38;camera.updateProjectionMatrix()}
   navigation.beginView({fitOnResize:['arena-online','casa-usuario','original','region','field','estacao','loja','vadico','agencia-clube','patrocinadores','dsouza','tidex','oittolabs','gecg','boteco-oswaldo','bar-esquina','feira','banca','campinho','padaria','praca-bairro','espetinho','jogo-bairro','varal','flanelinha','cadeiras','tv-boteco'].includes(next),terrainGuard:['arena-online','casa-usuario','original','region','estacao','loja','vadico','agencia-clube','patrocinadores','dsouza','tidex','oittolabs','gecg'].includes(next)||(next==='field'&&!state.roofClosed)})
   setSelectedView(next)
   mode=next;focusedSeat=undefined;followSide=undefined;followedCenter=undefined;setFollowing(null)
   if(next==='original')fit(-190,managementEnabled?214:190,-140,175,32,stationFrame)
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
    presidentBody.update(presidentRef.current,walletRef.current)
    if(architecture.counts.presidentBox){camera.position.set(-6.4,11.4,76.3);controls.target.set(-6.4,10.1,69.7)}
    else{view('entrance');return}
   }
   else if(next==='president'){
    const body=presidentBody.inspect().president,seat=body?.seated
    const x=seat?-6.4:-4.5,z=seat?69.7:70,y=PLANTA_COMPLEXO.presidentBox.floor+(seat?1.1:1.4)
    controls.target.set(x,y,z);camera.position.set(x+.65,y+.35,z+3.2)
   }
   else if(next==='shelf'){controls.target.set(-12.5,10.3,78.2);camera.position.set(-10.7,11.4,73.5)}
   else if(next==='office'){
    if(architecture.counts.presidentBox||isWindow){camera.position.fromArray(PLANTA_COMPLEXO.presidentBox.camera);controls.target.fromArray(PLANTA_COMPLEXO.presidentBox.target)}
    else{mode='entrance';controls.target.set(0,2,82);camera.position.set(18,12,116)}
   }
   else if(next==='city-street'){
    const people=[...residents.root.children,...commerce.root.children.filter(p=>p.name.startsWith('civilian-vadico-customer-'))],cars=circulationActors?.root.children.filter(c=>c.name.startsWith('complexo-carro-'))??[]
    const shot=observarCidade(camera,people,cars,surround.root);camera.position.copy(shot.position);controls.target.copy(shot.target)
   }
   else if(next==='matchday'){
    if(camera.aspect<.85){controls.target.set(-17,1.25,106);camera.position.set(-10,2.6,111)}else{controls.target.set(0,1.5,104);camera.position.set(0,15,141)}
   }
   else if(next==='matchday-streets'){ // 🏳️ ruas enfeitadas no dia de jogo em casa (bandeiras nos postes + bandeirolas)
    const posts=(matchday.inspect().streets?.flagPosts??[]) as {x:number;z:number;dirX:number;dirZ:number}[];if(!posts.length){view('matchday');return}
    // De lado do braço do poste: a bandeira aparece de frente, com o varal atrás
    const p=posts[0],side=(p.x*-p.dirZ+(p.z-110)*p.dirX)>0?-1:1
    controls.target.set(p.x+p.dirX*.5,4.6,p.z+p.dirZ*.5);camera.position.set(p.x-p.dirZ*side*13+p.dirX*3,camera.aspect<.85?6.5:5.5,p.z+p.dirX*side*13+p.dirZ*3)
   }
   else if(next==='coach-arrival'){
    controls.target.set(-94,1.8,-14);camera.position.fromArray(camera.aspect<.85?[-114,11,-34]:[-114,8,-34])
   }
   else if(next==='coach-door'){
    controls.target.set(-92.3,1.7,-19.35);camera.position.set(-91,3,-30)
   }
   else if(next==='technical-area'){
    controls.target.set(-18,1,-35.8);camera.position.set(-12,3,-27)
   }
   else if(next==='team-entrance'){
    controls.target.set(-90.4,1.4,0);camera.position.set(-103,4,9)
   }
   else if(next==='team-field'){
    controls.target.set(0,1.1,37.2);camera.position.set(14,6,23)
   }
   else if(next==='boteco-oswaldo'||next==='bar-esquina'){
    const pub=surround.botecos.find(p=>p.id===(next==='boteco-oswaldo'?'oswaldo':'bar-da-esquina'));if(!pub){view('original');return}const p=pub.root.position,k=camera.aspect<.85?1.4:1;controls.target.set(p.x,p.y+1.4,p.z+7);camera.position.set(p.x+9*k,p.y+6*k,p.z+20*k)
   }
   else if(next==='feira'||next==='banca'||next==='campinho'||next==='padaria'||next==='praca-bairro'||next==='espetinho'||next==='jogo-bairro'||next==='varal'||next==='flanelinha'||next==='cadeiras'||next==='tv-boteco'){const v=tradicoes.vista(next,camera.aspect);if(!v){view('original');return}controls.target.set(...v.target);camera.position.set(...v.camera)}
   else if(next==='arena-online')fit(ARENA.x-13,ARENA.x+13,ARENA.z-13,ARENA.z+17,10,[],new THREE.Vector3(.3,1,1.3))
   else if(next==='casa-usuario')fit(HOME.x-HOME.width/2-6,HOME.x+HOME.width/2+6,HOME.z-HOME.depth/2-6,HOME.z+HOME.depth/2+6,5,[],new THREE.Vector3(.25,1.05,1.3))
   else if(next==='loja'){
    const p=PLANTA_COMPLEXO.lots.loja,h=p.door?.heading??p.heading
    fit(Math.min(...p.footprint.map(p=>p.x))-3,Math.max(...p.footprint.map(p=>p.x))+3,Math.min(...p.footprint.map(p=>p.z))-3,Math.max(...p.footprint.map(p=>p.z))+3,6,[],new THREE.Vector3(Math.sin(h)*1.1+Math.cos(h)*.9,.75,Math.cos(h)*1.1-Math.sin(h)*.9))
   }
   else if(next==='vadico'){
    const b=PLANTA_VADICO.bounds
    // Keep the facade readable in portrait too, with all display cars in view.
    fit(b.minX-2,b.maxX+2,b.minZ-2,b.maxZ+2,8,[],camera.aspect<.85?new THREE.Vector3(-.25,1.05,1.3):new THREE.Vector3(.18,.65,1.3))
   }
   else if(next==='agencia-clube'){const a=LOTE_AGENCIA_CLUBE;fit(a.x-20,a.x+20,a.z-14,a.z+25,9,[],new THREE.Vector3(.12,1.2,1.4))}
   else if(next==='patrocinadores')fit(-482,-144,-314,-69,36,[],new THREE.Vector3(.12,2.1,1.25))
   else if(next==='dsouza'||next==='tidex'||next==='oittolabs'||next==='gecg'){
    const p=LOTES_PATROCINADORES_CIDADE[next],sport=next==='gecg'
    fit(p.x-(sport?p.width/2:p.buildingWidth/2+5),p.x+(sport?p.width/2:p.buildingWidth/2+5),p.z-(sport?p.depth/2:p.buildingDepth/2+3),p.z+(sport?p.depth/2:p.buildingDepth/2+18),p.height+5,[],sport?new THREE.Vector3(.04,2.1,1.1):new THREE.Vector3(.22,.72,1.4))
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
   if(draw){navigation.constrain();if(!controls.update())wake.current()}
  }
  const resize=()=>{const width=el.clientWidth,height=el.clientHeight;if(!width||!height)return
   quality=visualProfile(width,height);renderer.setPixelRatio(quality.pixelRatio*adaptiveScale)
   renderer.setSize(width,height,false);const shadowSize=softwareGPU||width<600?1024:ajuste.sombra;if(sun.shadow.mapSize.x!==shadowSize){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(shadowSize,shadowSize);renderer.shadowMap.needsUpdate=true}sharpenTextures()
   const footballCamera=matchCameraController.inspect()
   if(footballCamera.mode!=='free'||footballCamera.returning){camera.aspect=width/height;camera.updateProjectionMatrix();render();resume()}
   else navigation.resize(width,height,()=>view(mode,false))
   if(isWindow){view('office',false);camera.lookAt(controls.target);render()}
  }
  // City time advances only in the visible map. Distant observation uses a low
  // cadence; hidden tabs, closed maps, explicit pause and reduced motion stop it.
  const walking=()=>!!(residents.count()||circulationActors||transportActors||visits.length||crowdDeparture||deliveries.active()||sponsorLife.active())&&!pausedRef.current&&!reduced.matches&&!isOffice&&!isWindow
  // 🤝 depois do apito o laço segue por 45 s: é o tempo de os 22 andarem até o meio-campo (o motor avança 1/60 s por quadro desenhado,
  // `fimQuadros` no adaptador). Sem isto o último quadro congelava com todo mundo plantado onde o jogo acabou (filmado 25/10)
  let fimDesde:number|null=null,fimDe:string|null=null
  const cumprimentos=()=>{const m=matchRef.current;if(!m||!m.finished){fimDesde=null;fimDe=null;return false}const id=m.context?.id??'';if(fimDe!==id){fimDe=id;fimDesde=performance.now()}return performance.now()-(fimDesde??0)<45000}
  const running=()=>visible&&!document.hidden&&(matchCameraController.transitioning||walking()||cumprimentos()||finalDay.animating()||(!!matchRef.current&&(matchRef.current.visualClock?.running??(!matchRef.current.paused&&!matchRef.current.finished))))
  const targetFPS=()=>{if(matchRef.current&&!matchRef.current.finished)return quality.maxFPS;const interacting=performance.now()<vivoAte||performance.now()<interactionUntil;if(interacting)return quality.maxFPS;const distance=camera.position.distanceTo(controls.target);return distance>350?12:mobileGraphics?24:30}
  const tick=(now:number)=>{raf=0;if(disposed)return;if(!visible||document.hidden){last=0;presentationPacer.reset();return}const fps=matchPresentation==='3d'&&matchRef.current?.finished?60:targetFPS();if(!presentationPacer.take(now,fps)){raf=requestAnimationFrame(tick);return}if(walking()&&last)seconds+=(now-last)/1000;last=now;if(!softwareGPU){const scale=graphicsBudget.observe(now,quality.pixelRatio,fps);if(scale!==null){adaptiveScale=scale;renderer.setPixelRatio(quality.pixelRatio*adaptiveScale)}}render();{const gap=now-ultimoQuadro;ultimoQuadro=now;if(gap>0&&gap<2000){engasgo=proximoEngasgo(engasgo,gap);if(++quadrosVistos>=ENGASGO_QUADROS&&engasgo>ENGASGO_MS)caiPraLeve.current()}else{engasgo=0;quadrosVistos=0}}if(running())raf=requestAnimationFrame(tick)}
  // Clock publications and texture callbacks share the pending visual frame.
  // The scoreboard's simulation keeps its own clock, including offscreen.
  const resume=()=>{if(disposed||compilando)return;if(!visible||document.hidden){game.setViewportVisible?.(false);stadiumListener.update(false,0);cancelAnimationFrame(raf);raf=0;last=0;return}game.setViewportVisible?.(true);if(raf)return;last=0;raf=requestAnimationFrame(tick)};wake.current=resume
  function setFootballCamera(value:CameraPartidaContinua){
   if(matchPresentation==='2d'&&value!=='free')value='field2d'
   userExploring.current=value==='free'
   if(isOffice||isWindow||!matchRef.current)return
   fieldWatchPending=false
   navigation.beginView({fitOnResize:false,terrainGuard:false});followSide=undefined;followedCenter=undefined;setFollowing(null)
   if(value!=='free'){
    if(matchCameraController.inspect().mode==='free')savedMapView=mode
    mode='field';setSelectedView('field')
   }else{mode=savedMapView;setSelectedView(savedMapView)}
   matchCameraController.setMode(value);resume()
  }
  refreshPopulation.current=()=>{if(disposed)return;crowd.update(populationRef.current.crowdPopulation);if(rebuildPopulation())resume();else render()}
  refreshFurniture.current=()=>{if(disposed)return;const deliveryChanged=deliveries.sync(walletRef.current,duplaDaGaragem(walletRef.current?.owned??[],garageRef.current)),changed=furniture.update(walletRef.current),bodyChanged=(!managementEnabled||isOffice||['room','office','president','shelf'].includes(mode))&&presidentBody.update(presidentRef.current,walletRef.current),collectionChanged=collection.update(walletRef.current,collectionRef.current.trophies,collectionRef.current.identityArt,collectionRef.current.trophyPage);if(changed||bodyChanged||collectionChanged||deliveryChanged){roomLights.forEach(lamp=>{lamp.shadow.needsUpdate=true});sharpenTextures();render();resume()}}
  refreshJourney.current=()=>{if(disposed)return;lighting.setPeriod(journeyRef.current?.period??'day');rebuildPopulation();resume()}
  const homeKey=(event:KeyboardEvent)=>{if(event.key==='Home'&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.target===renderer.domElement){event.preventDefault();view(isOffice?'room':'original')}}
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
  api.current={checkCivilian:(index=0)=>{const info=residents.inspect() as {actors:{position:number[]}[]};const p=info.actors[index]?.position;if(!p)return;navigation.beginView({fitOnResize:false,terrainGuard:true});controls.target.set(p[0],p[1]+.85,p[2]);camera.position.set(p[0]-3,p[1]+2.2,p[2]+4.5);camera.lookAt(controls.target);controls.update();render()},setMatchCamera:setFootballCamera,view,zoom:direction=>{interactionUntil=performance.now()+300;if(matchCameraController.zoomFixed(direction===1?.8:1.25)){resume()}else if(isOffice&&mode==='office'){camera.fov=THREE.MathUtils.clamp(camera.fov*(direction===1?.82:1.22),16,65);camera.updateProjectionMatrix();wake.current()}else navigation.zoom(direction)},setNavigationMode:value=>{navigation.setMode(value);setNavigationMode(value)},checkLighting,checkDealershipView,seekCirculation:value=>{seconds=Number.isFinite(value)?Math.max(0,value):0;last=0;render()},inspect:()=>({softwareGPU,shadowResolution:sun.shadow.mapSize.x,matchCamera:matchCameraController.inspect(),cameraRoofCutaway,state,journey:journeyRef.current,lighting:lighting.inspect(),match:game.inspect(),residents:residents.inspect(),commerce:commerce.inspect(),vehicleDeliveries:deliveries.inspect(),sponsorLife:sponsorLife.inspect(),localLife:localLife.inspect(),botecos:pubLife.inspect(),cidadeViva:cidade.inspect(),tradicoes:tradicoes.inspect(),teamArrival:teamArrival.inspect(),stadiumStaff:stadiumStaff.inspect(),preparation:stadiumPreparation.inspect(),entrances:stadiumAccess.inspect(),matchday:matchday.inspect(),circulation:inspectCirculation(),transport:transportActors?.inspect(),flow,crowd:crowd.inspect(),crowdDeparture:crowdDeparture?.inspect(),visits:visits.map(visit=>({...visit.inspect(),source:populationRef.current.crowdPopulation.mode})),president:presidentBody.inspect(),collection:collection.inspect(),furniture:{...furniture.inspect(),ceilingLights:roomLights.length},populationRebuilds,view:mode,following:followSide??null,visitRow:populationRef.current.visitRow,visitTier:populationRef.current.visitTier,focusedSeat,camera:camera.position.toArray(),target:controls.target.toArray(),cameraFov:camera.fov,viewport:[el.clientWidth,el.clientHeight],navigation:navigation.inspect(),quality:{...quality,mobileGraphics,targetFPS:targetFPS(),adaptiveScale,effectivePixelRatio:renderer.getPixelRatio()},seatLod:seatLod.inspect(),frameStats:{...frameStats},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:{...renderer.info.memory},canvas:[renderer.domElement.width,renderer.domElement.height],shadowMap:renderer.shadowMap.enabled,architecture:architecture.root.userData,seatDetail:architecture.inspectSeatDetail(),landscape:surround.root.userData.landscape,roads:surround.root.userData.roadNetwork?.diagnostics,pedestrianNetwork:surround.root.userData.pedestrianNetwork,dealership:surround.root.userData.dealership,sponsors:surround.root.userData.sponsors,clubPlaces:surround.root.userData.clubPlaces,residence:surround.root.userData.residence,cityState,establishments:[...surround.establishments]})}
  let tap:{x:number;y:number;id:number;at:number}|null=null
  const clubPointerDown=(e:PointerEvent)=>{vivoAte=performance.now()+VIVO_MS;resume();if(clubActionRef.current&&e.isPrimary&&e.button===0)tap={x:e.clientX,y:e.clientY,id:e.pointerId,at:performance.now()}}
  const clubPointerUp=(e:PointerEvent)=>{
   const start=tap;tap=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>6||performance.now()-start.at>700||!clubActionRef.current)return
   const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera)
   const shop=PLANTA_COMPLEXO.lots.loja,a=LOTE_AGENCIA_CLUBE
   const targets:{id:DestinoClubeMapa;view:VistaComplexo;box:THREE.Box3}[]=[{id:'presidencia',view:'casa-usuario',box:new THREE.Box3(new THREE.Vector3(HOME.x-HOME.width/2,0,HOME.z-HOME.depth/2),new THREE.Vector3(HOME.x+HOME.width/2,5,HOME.z+HOME.depth/2))}]
   targets.push({id:'veiculos',view:'vadico',box:new THREE.Box3(new THREE.Vector3(PLANTA_VADICO.bounds.minX,0,PLANTA_VADICO.bounds.minZ),new THREE.Vector3(PLANTA_VADICO.bounds.maxX,7,PLANTA_VADICO.bounds.maxZ))})
   if(cityState.extras.loja)targets.push({id:'loja',view:'loja',box:new THREE.Box3(new THREE.Vector3(Math.min(...shop.footprint.map(p=>p.x)),.16,Math.min(...shop.footprint.map(p=>p.z))),new THREE.Vector3(Math.max(...shop.footprint.map(p=>p.x)),8,Math.max(...shop.footprint.map(p=>p.z))))})
   if(clubName)targets.push({id:'agencia',view:'agencia-clube',box:new THREE.Box3(new THREE.Vector3(a.x-13,.16,a.z-10),new THREE.Vector3(a.x+13,7.5,a.z+10))})
   targets.push({id:'arena',view:'arena-online',box:new THREE.Box3(new THREE.Vector3(ARENA.x-9,0,ARENA.z-9),new THREE.Vector3(ARENA.x+9,9,ARENA.z+9))})
   // 🏢 03/11: tocar no prédio de um patrocinador abre o cartão dele (logo, texto, link)
   const sponsorTargets=(['dsouza','tidex','oittolabs','gecg'] as const).map(id=>{const l=LOTES_PATROCINADORES_CIDADE[id];return{id,view:id as VistaComplexo,box:new THREE.Box3(new THREE.Vector3(l.x-l.width/2,0,l.z-l.depth/2),new THREE.Vector3(l.x+l.width/2,l.height+2,l.z+l.depth/2))}})
   const sponsorHit=sponsorTargets.flatMap(t=>{const p=ray.ray.intersectBox(t.box,new THREE.Vector3());return p?[{...t,d:ray.ray.origin.distanceTo(p)}]:[]}).sort((a,b)=>a.d-b.d)[0]
   const hits=targets.flatMap(t=>{const p=ray.ray.intersectBox(t.box,new THREE.Vector3());return p?[{...t,d:ray.ray.origin.distanceTo(p)}]:[]}).sort((a,b)=>a.d-b.d),hit=hits[0]
   if(!hit||sponsorHit&&sponsorHit.d<hit.d){if(sponsorHit){userExploring.current=true;view(sponsorHit.view)}return}
   const blocker=ray.intersectObjects([surround.root,architecture.root],true).find(i=>i.object.visible&&(!('material'in i.object)||(Array.isArray(i.object.material)?i.object.material:[i.object.material]).some(m=>m.visible&&m.opacity>0)))
   if(blocker&&blocker.distance<hit.d-.75)return
   userExploring.current=true;view(hit.view);if(hit.id!=='veiculos')clubActionRef.current(hit.id) // 🚗 a Vadico abre primeiro o cartão (site + comprar carros)
  }
  const acordaRoda=()=>{vivoAte=performance.now()+VIVO_MS;resume()};renderer.domElement.addEventListener('wheel',acordaRoda,{passive:true});renderer.domElement.addEventListener('pointerdown',clubPointerDown);renderer.domElement.addEventListener('pointerup',clubPointerUp)
  const observer=new ResizeObserver(resize);observer.observe(el)
  const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;resume()});visibility.observe(el)
  document.addEventListener('visibilitychange',resume)
  reduced.addEventListener('change',resume)
  const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);setError('A vista 3D foi interrompida. Reabra para tentar novamente.');unavailable.current?.()};renderer.domElement.addEventListener('webglcontextlost',lost)
  // ⚡ 25/10 (Diego: *"senti que tá travando"*): o 1º desenho compilava ~30–40 programas da placa de vídeo de uma vez, travando a
  // tela uns segundos (medido: 2,5 s no PC, 4× isso no celular). Agora a compilação corre em paralelo na placa (`compileAsync`,
  // quando o aparelho suporta) e o mapa aparece quando ela termina — mesmos materiais, mesma qualidade, só sem congelar a página.
  // Até lá, o laço não desenha (o "carregando seu estádio…" continua na tela).
  // ⚙️ demorou demais pra abrir (mundo + placa de vídeo)? da próxima vez — e já agora — vai no Leve
  const vigiaAbrir=window.setTimeout(()=>{if(!disposed&&compilando)caiPraLeve.current()},ABRIR_LENTO_MS)
  const primeiroDesenho=()=>{if(disposed)return;window.clearTimeout(vigiaAbrir);if(performance.now()-abriuEm>ABRIR_LENTO_MS)caiPraLeve.current();compilando=false;resize();builtKey.current=saveKey;setLoaded(true);ready.current?.(api.current);resume()}
  if(gl.getExtension('KHR_parallel_shader_compile')){compilando=true;renderer.compileAsync(scene,camera).then(primeiroDesenho,primeiroDesenho)}
  else primeiroDesenho()
  // Start artwork downloads after the synchronous world/probe construction.
  // Otherwise its loading timeout can expire while the initial 3D render is
  // still blocking the main thread on a slow device.
  if(!managementEnabled||isOffice)presidentBody.update(presidentRef.current,walletRef.current)
  return()=>{disposed=true;window.clearTimeout(vigiaAbrir);cancelAnimationFrame(raf);if(avatarFrame!==undefined)cancelAnimationFrame(avatarFrame);retryPresident.current=()=>{};api.current=null;ready.current?.(null);wake.current=()=>{};refreshPopulation.current=()=>{};refreshFurniture.current=()=>{};refreshJourney.current=()=>{};observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);fixedCameraZoom.dispose();navigation.dispose();renderer.domElement.removeEventListener('wheel',acordaRoda);renderer.domElement.removeEventListener('pointerdown',clubPointerDown);renderer.domElement.removeEventListener('pointerup',clubPointerUp);renderer.domElement.removeEventListener('keydown',homeKey);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);lighting.dispose();residents.dispose();commerce.dispose();deliveries.dispose();sponsorLife.dispose();localLife.dispose();pubLife.dispose();cidade.dispose();tradicoes.dispose();stadiumAccess.dispose();stadiumStaff.dispose();stadiumPreparation.dispose();stadiumListener.dispose();offSound();teamArrival.dispose();matchday.dispose();finalDay.dispose();circulationActors?.dispose();transportActors?.dispose();visits.forEach(visit=>visit.dispose());presidentBody.dispose();collection.dispose();furniture.dispose();crowdDeparture?.dispose();crowd.dispose();game.dispose();seatLod.dispose();architecture.dispose();surround.dispose();reflection.dispose();roomLights.forEach(lamp=>{lamp.shadow.map?.dispose();lamp.dispose()});sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[saveKey,citySaveKey,clubName,managementEnabled,isWindow,isOffice,matchPresentation,nivel])
 useEffect(()=>{refreshPopulation.current()},[populationKey])
 useEffect(()=>{refreshFurniture.current()},[walletKey,presidentKey,JSON.stringify(garage??null)])
 useEffect(()=>{refreshJourney.current()},[journeyKey])
 // Initial match presentation can focus the field, but a user already exploring
 // the neighbourhood keeps that camera while the same match starts underneath.
 // (jogo fora troca o estádio e o mundo se refaz: espera o mundo NOVO ficar pronto pra levar a câmera)
 const matchStarted=useRef<string|null>(null),builtKey=useRef(''),matchId=match&&!match.finished?match.context.id:null
 useEffect(()=>{const k=matchId+'|'+saveKey;if(!loaded||isWindow||isOffice||!matchId||builtKey.current!==saveKey||matchStarted.current===k)return;matchStarted.current=k;if(!userExploring.current)api.current?.view('field')},[loaded,matchId,isWindow,isOffice,saveKey])
 const go=(destination:VistaComplexo)=>{userExploring.current=true;api.current?.view(destination);root.current?.querySelector('canvas')?.focus({preventScroll:true});setPlacesOpen(false)}
 return <section ref={section} className={`pc3-review${isOffice?' pc3-office':''}${isWindow?' pc3-window':''}${expanded?' pc3-expanded':''}`} data-expanded={expanded} data-presentation={presentation} data-watching-match={!!match&&matchCamera!=='free'} data-camera-mode={matchCamera}
  role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label={isOffice?'Sala da Presidência':t('Mapa do estádio','Stadium map')} onKeyDown={event=>{
   if(event.key==='Escape'){
    if(placesOpen){setPlacesOpen(false);placesButton.current?.focus();event.preventDefault();event.stopPropagation()}
    else if(expanded){setExpanded(false);event.preventDefault();event.stopPropagation()}
   }
   if(expanded&&event.key==='Tab'){
    const elements=Array.from(section.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),canvas[tabindex="0"]')??[]).filter(node=>node.getClientRects().length)
    const first=elements[0],last=elements.at(-1)
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  }}>
  <div className="pc3-stage">
   {replayOn&&<div className="pc3-replay" aria-live="polite">🔁 REPLAY</div>}
   <div ref={root} className="pc3-viewport" data-complexo-3d="true" aria-busy={!loaded} onPointerDown={()=>setPlacesOpen(false)}>
    {!loaded&&!error&&<p className="pc3-loading" role="status">{t('Preparando o mapa…','Preparing the map…')}</p>}
    {error&&<p className="pc3-error" role="alert">{error}</p>}
   </div>
   {!isWindow&&loaded&&(presidentStatus==='loading'||presidentStatus==='error')&&<div className="pc3-avatar-status" role={presidentStatus==='error'?'alert':'status'}>
    {presidentStatus==='loading'?t('Carregando seu personagem…','Loading your character…'):<>{t('O visual não carregou. Suas escolhas foram mantidas.','The look did not load. Your choices were kept.')}<button type="button" onClick={()=>retryPresident.current()}>{t('Tentar novamente','Try again')}</button></>}
   </div>}
   {!isWindow&&<><div className="pc3-hud pc3-topbar">
    <div className="pc3-primary">
     {isOffice?<><button type="button" disabled={!loaded} aria-pressed={selectedView==='room'} onClick={()=>go('room')}>{t('Minha sala','My office')}</button><button type="button" disabled={!loaded} aria-pressed={selectedView==='office'} onClick={()=>go('office')}>{t('Janela','Window')}</button><button type="button" disabled={!loaded} aria-pressed={selectedView==='president'} onClick={()=>go('president')}>{t('Presidente','President')}</button><button type="button" disabled={!loaded} onClick={()=>go('shelf')}>{t('Estante','Shelf')}</button></>:<>
     <button type="button" disabled={!loaded} aria-label="Estádio e região" aria-pressed={selectedView==='original'||selectedView==='region'} onClick={()=>go('original')}>{t('Mapa','Map')}</button>
     {(matchCamera==='free'||matchPresentation==='2d')&&<button type="button" disabled={!loaded} aria-pressed={matchPresentation==='2d'?matchCamera==='field2d':selectedView==='field'} onClick={()=>go('field')}>{matchPresentation==='2d'?t('Ver partida','Watch match'):t('Ver campo','See pitch')}</button>}
     {matchCamera==='free'&&<button ref={placesButton} type="button" disabled={!loaded} aria-expanded={placesOpen} aria-controls={`${uiId}-places`} onClick={()=>setPlacesOpen(value=>!value)}>{t('Locais ','Places ')}<span aria-hidden="true">⌄</span></button>}
     {match&&matchCamera!=='free'&&matchPresentation!=='2d'&&<label className="pc3-camera-choice" htmlFor={`${uiId}-camera`}><span className="pc3-camera-title">{t('Câmera','Camera')}</span>
      <select id={`${uiId}-camera`} aria-label="Câmera da partida" disabled={!loaded} value={matchCamera} onChange={event=>{api.current?.setMatchCamera(event.currentTarget.value as CameraPartidaContinua);setPlacesOpen(false)}}>
       {CAMERAS_PARTIDA.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
     </label>}</>}
    </div>
    <button ref={expandButton} className="pc3-expand" type="button" aria-label={isOffice?(expanded?t('Fechar sala ampliada','Close enlarged office'):t('Ampliar sala','Enlarge office')):(expanded?t('Fechar mapa ampliado','Close enlarged map'):t('Ampliar mapa','Enlarge map'))} title={isOffice?(expanded?t('Fechar sala ampliada','Close enlarged office'):t('Ampliar sala','Enlarge office')):(expanded?t('Fechar mapa ampliado','Close enlarged map'):t('Ampliar mapa','Enlarge map'))} onClick={toggleExpanded}>
     <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{expanded?<path d="m6 6 12 12M18 6 6 18"/>:<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>}</svg>
    </button>
   </div>
   {placesOpen&&!isOffice&&<div className="pc3-places" id={`${uiId}-places`} aria-label="Locais do mapa">
    {managementEnabled&&<><p>{t('Seu espaço pessoal','Your personal space')}</p><button type="button" onClick={()=>go('casa-usuario')}>{t('Minha casa · Garagem','My house · Garage')}</button><p>{t('Seu clube','Your club')}</p><button type="button" onClick={()=>go('agencia-clube')}>{nomeAgenciaClube(clubName??'do Clube')}</button>{currentCityState.extras.loja?<button type="button" onClick={()=>go('loja')}>{t('Loja do Clube','Club Store')}</button>:<button type="button" onClick={()=>clubActionRef.current?.('loja')}>{t('🔨 Loja do Clube · ainda não construída','🔨 Club Store · not built yet')}</button>}</>}
    {managementEnabled&&<><p>{t('Comunidade online','Online community')}</p><button type="button" onClick={()=>go('arena-online')}>{t('Arena Legends · Salas abertas','Arena Legends · Open rooms')}</button></>}<p>{t('Explore o estádio','Explore the stadium')}</p>
    {hasSeatView&&<button type="button" onClick={()=>go('stands')}>{t('Arquibancada','Stands')}</button>}
    <button type="button" onClick={()=>go(fora?'away-entrance':'entrance')}>{t('Torcida do meu clube','My club\'s fans')}</button>
    <button type="button" onClick={()=>go(fora?'entrance':'away-entrance')}>{t('Torcida visitante','Away fans')}</button>
    {visitable.home&&<button type="button" aria-pressed={following==='home'} onClick={()=>go('follow-home')}>{t('Acompanhar torcida da casa','Follow home fans')}</button>}
    {visitable.away&&<button type="button" aria-pressed={following==='away'} onClick={()=>go('follow-away')}>{t('Acompanhar visitantes','Follow away fans')}</button>}
    {hasBox&&<><button type="button" onClick={()=>go('office')}>{t('Vista do camarote','Box view')}</button></>}
    {journey?.hosting&&journey.phase!=='idle'&&<button type="button" onClick={()=>go('matchday')}>{t('Dia de jogo · torcida e barracas','Match day · fans and stalls')}</button>}
    <button type="button" onClick={()=>go('technical-area')}>{t('Banco e área técnica','Bench and technical area')}</button>
    <button type="button" aria-pressed={stadiumSound} onClick={()=>{if(!stadiumSound)setMuted(false);setStadiumSound(v=>!v)}}>{stadiumSound?t('Desligar som do estádio','Turn off stadium sound'):t('Som do estádio','Stadium sound')}</button>
    <p>{t('Na região','Around')}</p>
    {circulation&&<button type="button" onClick={()=>go('city-street')}>{t('Pessoas e trânsito','People and traffic')}</button>}
    {journey?.hosting&&journey.phase!=='idle'&&<><button type="button" onClick={()=>go('coach-arrival')}>{t('Ônibus e desembarque','Bus and drop-off')}</button><button type="button" onClick={()=>go('coach-door')}>{t('Porta do ônibus · atletas','Bus door · players')}</button><button type="button" onClick={()=>go('team-entrance')}>{t('Serviço e delegações','Service and squads')}</button><button type="button" onClick={()=>go('team-field')}>{t('Entrada das equipes no campo','Teams walking out')}</button></>}
    <p>{t('Patrocinadores','Sponsors')}</p>
    <button type="button" onClick={()=>go('patrocinadores')}>{t('Todos os patrocinadores','All sponsors')}</button>
    <button type="button" onClick={()=>go('vadico')}>Vadico Veículos</button>
    {(['dsouza','tidex','oittolabs','gecg'] as const).map(id=><button type="button" key={id} onClick={()=>go(id)}>{LOTES_PATROCINADORES_CIDADE[id].label}</button>)}
    <p>{t('Comércio e transporte','Shops and transport')}</p>
    <button type="button" onClick={()=>go('boteco-oswaldo')}>Boteco do Oswaldo</button>
    <button type="button" onClick={()=>go('bar-esquina')}>Bar da Esquina</button>
    <button type="button" onClick={()=>go('feira')}>{t('Feira livre','Street market')}</button><button type="button" onClick={()=>go('banca')}>{t('Banca de jornal','Newsstand')}</button><button type="button" onClick={()=>go('campinho')}>{t('Campinho de terra','Dirt pitch')}</button>
    <button type="button" onClick={()=>go('padaria')}>{t('Padaria','Bakery')}</button><button type="button" onClick={()=>go('praca-bairro')}>{t('Praça (dominó e carrinhos)','Square (dominoes and carts)')}</button><button type="button" onClick={()=>go('espetinho')}>{t('Espetinho e podrão','Skewers and burger trailer')}</button>
    {(['loja','hotel','chopp','praca'] as const).filter(id=>currentCityState.extras[id]&&(id!=='loja'||!managementEnabled)).map(id=><button key={id} type="button" onClick={()=>go(id)}>{{loja:t('Loja do clube','Club store'),hotel:t('Hotel','Hotel'),chopp:t('Choperia','Beer house'),praca:t('Praça','Square')}[id]}</button>)}
    {circulation&&<button type="button" onClick={()=>go('onibus')}>{t('Ponto de ônibus','Bus stop')}</button>}
    {currentCityState.extras.estacao&&<><button type="button" onClick={()=>go('estacao')}>{t('Estação e passarelas','Station and walkways')}</button><button type="button" onClick={()=>go('metro')}>{t('Metrô','Subway')}</button></>}
    {currentCityState.extras.estac&&<button type="button" onClick={()=>go('estacionamento')}>{t('Estacionamento','Parking')}</button>}
    {circulation&&<button className="pc3-pause" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?t('Retomar passeio','Resume walk'):t('Pausar passeio','Pause walk')}</button>}
   </div>}
   {managementEnabled&&(!loaded||!!error)&&<div className="pc3-club-place"><strong>{t('Seu clube','Your club')}</strong><button type="button" onClick={()=>clubActionRef.current?.('presidencia')}>{t('Minha casa','My house')}</button><button type="button" onClick={()=>clubActionRef.current?.('financas')}>{t('Finanças','Finances')}</button><button type="button" onClick={()=>clubActionRef.current?.('loja')}>{t('Loja do Clube','Club Store')}</button><button type="button" onClick={()=>clubActionRef.current?.('agencia')}>{t('Agência e patrocínios','Agency and sponsorships')}</button><button type="button" onClick={()=>clubActionRef.current?.('arena')}>{t('Consultar salas abertas','See open rooms')}</button></div>}
   {loaded&&ehPatrocinadorCidade(selectedView)&&(()=>{const info=INFO_PATROCINADORES[selectedView],en=getLang()==='en';return <div className="pc3-club-place pc3-sponsor-card">
    <span className="pc3-sponsor-logo" style={{background:info.logo.background}}><img src={info.logo.src} width={info.logo.width} height={info.logo.height} alt={info.nome}/></span>
    <strong>{info.nome}</strong>
    <p>{en?info.en:info.pt}</p>
    <a className="pc3-sponsor-link" href={info.link} target="_blank" rel="noopener noreferrer">{en?info.linkEn:info.linkPt}</a>
    {selectedView==='vadico'&&managementEnabled&&<button type="button" onClick={()=>clubActionRef.current?.('veiculos')}>{t('🚗 Comprar carros e motos','🚗 Buy cars and bikes')}</button>}
    <small>{t('Patrocinador do Leilão Legends','Leilão Legends sponsor')}</small>
   </div>})()}
   {managementEnabled&&loaded&&['arena-online','casa-usuario','loja','agencia-clube'].includes(selectedView)&&<div className="pc3-club-place">
    <strong>{selectedView==='arena-online'?'Arena Legends':selectedView==='loja'?t('Loja do Clube','Club Store'):selectedView==='agencia-clube'?nomeAgenciaClube(clubName??'do Clube'):selectedView==='vadico'?'Vadico Veículos':t('Minha casa','My house')}</strong>
    <button type="button" onClick={()=>clubActionRef.current?.(selectedView==='arena-online'?'arena':selectedView==='loja'?'loja':selectedView==='agencia-clube'?'agencia':selectedView==='vadico'?'veiculos':'presidencia')}>{selectedView==='arena-online'?t('Consultar salas','See rooms'):t('Entrar','Enter')}</button>
    {selectedView==='casa-usuario'&&<button type="button" onClick={()=>clubActionRef.current?.('financas')}>{t('Finanças','Finances')}</button>}
    {selectedView==='agencia-clube'&&<button type="button" onClick={()=>clubActionRef.current?.('patrocinio')}>{t('Patrocínios','Sponsorships')}</button>}
   </div>}
   <div className="pc3-hud pc3-navigation" aria-label="Controles do mapa">
    <button type="button" className="pc3-zoom" disabled={!loaded} aria-label="Aproximar" title="Aproximar" onClick={()=>api.current?.zoom(1)}>+</button>
    <button type="button" className="pc3-zoom" disabled={!loaded} aria-label="Afastar" title="Afastar" onClick={()=>api.current?.zoom(-1)}>−</button>
    <button type="button" disabled={!loaded} onClick={()=>go(isOffice?'room':'original')}>{isOffice?t('Ver sala','See office'):t('Ver tudo','See all')}</button>
    <button type="button" disabled={!loaded||(matchCamera==='fixed'||matchCamera==='field2d')} aria-label="Girar" aria-pressed={navigationMode==='rotate'} title="Ativar ou desativar rotação ao arrastar" onClick={()=>api.current?.setNavigationMode(navigationMode==='pan'?'rotate':'pan')}>{t('Girar','Rotate')}</button>
   </div>
   {!isWindow&&<div className="pc3-hud" style={{position:'absolute',left:8,bottom:30,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-start',zIndex:3,pointerEvents:'auto'}}>
    {caiuProLeve&&<div role="status" style={{background:'#0C0C0C',color:'#fff',border:'2px solid #FFC400',borderRadius:10,padding:'5px 8px',fontSize:11.5,fontWeight:800,maxWidth:260,display:'flex',gap:6,alignItems:'flex-start'}}><span>{t('⚡ O mapa estava travando neste aparelho — passamos pro Leve. Dá pra trocar aqui embaixo.','⚡ The map was lagging on this device — switched to Light. You can change it below.')}</span><button type="button" aria-label={t('Fechar','Close')} onClick={()=>setCaiuProLeve(false)} style={{all:'unset',cursor:'pointer',color:'#FFC400',fontWeight:900}}>✕</button></div>}
    <span role="group" aria-label={t('Qualidade do mapa','Map quality')} style={{display:'inline-flex',border:'2px solid #0C0C0C',borderRadius:9,overflow:'hidden',background:'#fffaf0',boxShadow:'2px 2px 0 #0C0C0C'}}>
     {NIVEIS_MAPA.map(n=><button key={n} type="button" aria-pressed={nivel===n} onClick={()=>{if(n===nivel)return;guardaNivelMapa(n);setCaiuProLeve(false);setNivel(n)}} style={{all:'unset',cursor:'pointer',padding:'4px 8px',fontFamily:'Oswald, "Arial Narrow", Arial, sans-serif',fontWeight:700,fontSize:12,textTransform:'uppercase',background:nivel===n?'#FFC400':'transparent',color:'#0C0C0C'}}>{n==='leve'?t('⚡ Leve','⚡ Light'):n==='padrao'?t('⚖️ Padrão','⚖️ Standard'):t('✨ Alta','✨ High')}</button>)}
    </span>
   </div>}
   {hud&&!isWindow&&!isOffice&&loaded&&<div hidden={managementEnabled&&['arena-online','casa-usuario','vadico','loja','agencia-clube'].includes(selectedView)}>{hud}</div>}
   <p className="pc3-help" id={`${uiId}-help`}>{(matchCamera==='fixed'||matchCamera==='field2d')?<>{matchPresentation==='2d'?t('Campo 2D no estádio.','2D pitch in the stadium.'):t('Lateral fixa · acompanha a jogada.','Fixed side · follows the play.')} Use +, − ou dois dedos para ajustar o zoom.</>:matchCamera!=='free'?<>Câmera automática · {CAMERAS_PARTIDA.find(option=>option.value===matchCamera)?.label}. Arraste para explorar o mapa.</>:<>{navigationMode==='rotate'?t('Arraste para girar.','Drag to rotate.'):t('Arraste para explorar.','Drag to explore.')} <span className="pc3-help-touch">{t('Use dois dedos para aproximar.','Use two fingers to zoom.')}</span><span className="pc3-help-mouse">{t('Use a roda para aproximar. Setas para mover.','Use the wheel to zoom. Arrows to move.')}</span></>}</p></>}
  </div>
 </section>
}
