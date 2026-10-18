import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {useT} from './lang'
import {PresidenciaAtletas} from './presidencia-partida-atletas'
import {usePublicarPartida} from './presidencia-partida-sincronia'
import {atletasEmCampo,type EstadoPartidaEstadio} from './presidencia-partida-model'
import {estruturaEstadioCompleta} from './presidencia-estadio-completo'
import {PresidenciaEstadioTerritorio} from './presidencia-estadio-territorio'
import fieldTiles from './presidencia-campo-tiles'
import {CAMPO_INTERNO,CAMPO_MAPA,texturaCampoDetalhada} from './presidencia-partida-geometria'
import {CampoSuperficie} from './presidencia-campo-superficie'
import {ArquibancadasDetalhe} from './presidencia-arquibancadas-detalhe'
import {RedesDoCampo} from './presidencia-partida-redes'
import {janelaVisivel3D} from './presidencia-janela-3d'
import {aproximarMapa,limitarVistaMapa,redimensionarVistaMapa,type DimensoesVista,type VistaMapa} from './presidencia-estadio-mapa-model'
import './presidencia-partida.css'
import {useVistaCampo} from './presidencia-campo-observacao'
import {RitmoCampo} from './presidencia-velocidade'
import {alturaMaximaCampoPartida,cameraInternaDaPartida,dimensoesCameraPartida,enquadrarCampoPartida} from './presidencia-partida-camera'
const Futebol3D=lazy(()=>import('./presidencia-futebol-3d'))
const base=import.meta.env.BASE_URL
export function PresidenciaPartida({state}:{state:EstadoPartidaEstadio}){
 const t=useT(),[open,setOpen]=useState(false),frame=usePublicarPartida(state),[three,setThree]=useState(true)
 const watching=useVistaCampo<HTMLDetailsElement>(open)
 return <details ref={watching} className="pe-live" onToggle={event=>setOpen(event.currentTarget.open)}><summary>{t('⚽ ACOMPANHAR NO ESTÁDIO','⚽ WATCH IN THE STADIUM')}</summary>{open&&<><RitmoCampo/><button type="button" onClick={()=>setThree(v=>!v)}>{three?t('VISTA DO ESTÁDIO','STADIUM VIEW'):t('CAMPO 3D','3D PITCH')}</button><Campo key={state.context.id} state={frame} three={three}/></>}</details>
}
export function Campo({state,three=false}:{state:EstadoPartidaEstadio;three?:boolean}){
 const t=useT(),root=useRef<HTMLDivElement>(null),hasSized=useRef(false)
 const [meshFailed,setMeshFailed]=useState(false),[fieldFailed,setFieldFailed]=useState(false),[world,setWorld]=useState({width:0,height:0,viewportWidth:0})
 const [internalCamera,setInternalCamera]=useState(false),lastCamera=useRef<boolean|undefined>(undefined)
 const internalAvailable=estruturaEstadioCompleta(state.context.stadium)&&!!state.context.stadium?.ext.includes('cober')
 const premium=internalCamera&&internalAvailable&&!fieldFailed
 const [view,setView]=useState<VistaMapa>({zoom:1,x:0,y:0}),viewRef=useRef(view)
 const pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef<{view:VistaMapa;cx:number;cy:number;distance:number}|null>(null)
 viewRef.current=view
 const size=()=>dimensoesCameraPartida(root.current?.clientWidth??0,root.current?.clientHeight??0)
 const setBounded=(next:VistaMapa)=>{const d=size();setView(limitarVistaMapa(next,d.width,d.height,6,d.world,d.minZoom))}
 const zoomBy=(factor:number)=>{const d=size();setView(v=>aproximarMapa(v,v.zoom*factor,{x:0,y:0},d.width,d.height,6,d.world,d.minZoom))}
 const reset=(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA=premium?CAMPO_INTERNO:CAMPO_MAPA)=>{pointers.current.clear();gesture.current=null;setView(enquadrarCampoPartida(corners,size()))}
 const rebase=()=>{const pts=[...pointers.current.values()];if(!pts.length){gesture.current=null;return}const a=pts[0],b=pts[1]??a;gesture.current={view:viewRef.current,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,distance:pts.length>1?Math.hypot(a.x-b.x,a.y-b.y):0}}
 useEffect(()=>{
  const el=root.current;if(!el)return
  // The first view and VER CAMPO frame the actual pitch, including both goals.
  // Portrait uses the aerial stadium so fitting never reveals empty bands.
  let previousSize:DimensoesVista|undefined
  const observer=new ResizeObserver(()=>{const d=size();if(!d.width||!d.height)return;const before=previousSize;previousSize=d;setWorld({...d.world,viewportWidth:d.width});const internal=cameraInternaDaPartida(internalAvailable&&!fieldFailed,d),changed=lastCamera.current!==internal;lastCamera.current=internal;setInternalCamera(internal);const first=!hasSized.current;hasSized.current=true;setView(v=>first||changed?enquadrarCampoPartida(internal?CAMPO_INTERNO:CAMPO_MAPA,d):redimensionarVistaMapa(v,before,d,6));pointers.current.clear();gesture.current=null})
  const wheel=(event:WheelEvent)=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();const r=el.getBoundingClientRect(),d=size();setView(v=>aproximarMapa(v,v.zoom*Math.exp(-event.deltaY*.004),{x:event.clientX-r.left-r.width/2,y:event.clientY-r.top-r.height/2},d.width,d.height,6,d.world,d.minZoom))}
  observer.observe(el);el.addEventListener('wheel',wheel,{passive:false})
  return()=>{observer.disconnect();el.removeEventListener('wheel',wheel)}
 },[!!atletasEmCampo(state).length,internalAvailable,fieldFailed])
 const detail=world.width*view.zoom*(typeof window==='undefined'?1:window.devicePixelRatio||1)>600
 // A câmera interna vê o gramado mesmo com teto fechado. Se a arte interna
 // falhar, a alternativa também precisa abrir apenas a representação do teto;
 // o save e a vista exterior permanecem fechados.
 const fieldStadium=state.context.stadium?.roofClosed?{...state.context.stadium,roofClosed:false}:state.context.stadium
 const players=atletasEmCampo(state)
 if(!players.length)return <p role="status">{t('A visualização precisa das duas escalações completas da partida.','The view needs both complete match lineups.')}</p>
 return <section>{fieldFailed&&internalAvailable&&<p role="status">{t('A câmera do campo não carregou. Exibindo a vista geral do estádio.','The pitch camera could not load. Showing the stadium overview.')}</p>}<div className="pe-live-tools"><button type="button" aria-label={t('Aproximar campo','Zoom in pitch')} onClick={()=>zoomBy(1.3)} disabled={view.zoom>=6}>+</button><output>{Math.round(view.zoom*100)}%</output><button type="button" aria-label={t('Afastar campo','Zoom out pitch')} onClick={()=>zoomBy(1/1.3)} disabled={view.zoom<=size().minZoom}>−</button><button type="button" onClick={()=>reset()}>{t('VER CAMPO','FIT PITCH')}</button><span>{state.homeScore} × {state.awayScore} · {state.minute}′</span></div>
  <div ref={root} className="pe-live-viewport" style={{maxHeight:world.viewportWidth?alturaMaximaCampoPartida(world.viewportWidth):undefined}} data-field-zoom={view.zoom} data-field-camera={premium?'internal':'aerial'} tabIndex={0} role="group" aria-label={t('Campo: arraste e aproxime com dois dedos','Pitch: drag and pinch to zoom')}
   onPointerDown={e=>{if(e.pointerType==='mouse'&&e.button!==0||pointers.current.size>=2)return;e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase()}}
   onPointerMove={e=>{if(!pointers.current.has(e.pointerId)||!gesture.current)return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.current.values()],a=pts[0],b=pts[1]??a,g=gesture.current,{width,height,world:worldSize,minZoom}=size(),r=e.currentTarget.getBoundingClientRect();const anchored=pts.length>1&&g.distance>0?aproximarMapa(g.view,g.view.zoom*Math.hypot(a.x-b.x,a.y-b.y)/g.distance,{x:g.cx-r.left-width/2,y:g.cy-r.top-height/2},width,height,6,worldSize,minZoom):g.view;setBounded({...anchored,x:anchored.x+(a.x+b.x)/2-g.cx,y:anchored.y+(a.y+b.y)/2-g.cy})}}
   onPointerUp={e=>{pointers.current.delete(e.pointerId);rebase()}} onPointerCancel={e=>{pointers.current.delete(e.pointerId);rebase()}} onLostPointerCapture={e=>{pointers.current.delete(e.pointerId);rebase()}}
   onKeyDown={e=>{if(e.target!==e.currentTarget)return;const offsets:Record<string,[number,number]>={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(offsets[e.key]){e.preventDefault();const [x,y]=offsets[e.key];setBounded({...view,x:view.x+x,y:view.y+y})}if(e.key==='+'||e.key==='='){e.preventDefault();zoomBy(1.3)}if(e.key==='-'){e.preventDefault();zoomBy(1/1.3)}if(e.key==='Home'){e.preventDefault();reset()}}}>
   <div className="pe-live-world" style={{width:world.width||'100%',height:world.height||'100%',transform:`translate(-50%,-50%) translate(${view.x}px,${view.y}px) scale(${view.zoom})`}}>
    {premium?<><img className="pe-live-base" onError={()=>{setFieldFailed(true);reset(CAMPO_MAPA)}} src={base+'estadio-partida/field-clean.webp'} alt={t('Gramado e arquibancadas na câmera do campo','Pitch and stands from the pitch camera')}/>{detail&&fieldTiles.map(tile=><DetalheCampo key={tile.src} tile={tile}/>)}</>:<PresidenciaEstadioTerritorio stadium={fieldStadium} detail={detail} movementPaused/>}
    {premium&&world.width*view.zoom*(typeof window==='undefined'?1:window.devicePixelRatio||1)>1536&&<ArquibancadasDetalhe/>}
    {premium&&(!three||meshFailed)&&<CampoSuperficie detail={texturaCampoDetalhada(CAMPO_INTERNO,world.width*view.zoom*(typeof window==='undefined'?1:window.devicePixelRatio||1))}/>}
    {three&&!meshFailed?<Suspense fallback={null}><Futebol3D state={state} registered={premium?CAMPO_INTERNO:CAMPO_MAPA} resolution={world.width*view.zoom*(window.devicePixelRatio||1)} crop={janelaVisivel3D(view,size(),world)} onUnavailable={()=>setMeshFailed(true)}/></Suspense>:<PresidenciaAtletas state={state} premium={premium}/>}
    {premium&&(!three||meshFailed)&&<RedesDoCampo/>}
    {premium&&three&&!meshFailed&&<div className="pe-live-foreground" aria-hidden="true"><img className="pe-live-base" src={base+'estadio-partida/field-clean.webp'} alt=""/>{detail&&fieldTiles.filter(tile=>tile.y+tile.h>=75).map(tile=><DetalheCampo key={tile.src} tile={tile}/>)}</div>}
   </div>
  </div><p className="pe-live-help">{t('Arraste e aproxime com dois dedos para acompanhar o campo.','Drag and pinch to follow the pitch.')}</p>
 </section>
}

function DetalheCampo({tile}:{tile:typeof fieldTiles[number]}){
 const ref=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[loaded,setLoaded]=useState(false)
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{root:el.closest('.pe-live-viewport'),rootMargin:'64px'});observer.observe(el);return()=>observer.disconnect()},[])
 return <span ref={ref} className="pe-live-detail" style={{left:tile.x+'%',top:tile.y+'%',width:tile.w+'%',height:tile.h+'%'}}>{visible&&<img data-map-detail="true" src={base+tile.src} alt="" onLoad={()=>setLoaded(true)} onError={e=>e.stopPropagation()} style={{width:'100%',height:'100%',opacity:loaded?1:0}}/>}</span>
}
