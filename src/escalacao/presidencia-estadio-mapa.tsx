import {useEffect,useRef,useState} from 'react'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {aproximarMapa,limitarVistaMapa,type VistaMapa} from './presidencia-estadio-mapa-model'
import './presidencia-estadio-mapa.css'

const initial:VistaMapa={zoom:1,x:0,y:0}
/** Transformação única para terreno, obras, caminhos e atores. Sem esticar. */
export function PresidenciaEstadioMapa({stadium}:{stadium?:StadiumSave}){
 const t=useT(),viewport=useRef<HTMLDivElement>(null),[view,setView]=useState(initial)
 const [paused,setPaused]=useState(false),[world,setWorld]=useState({width:0,height:0})
 const dimensions=()=>{const el=viewport.current,width=el?.clientWidth??0,height=el?.clientHeight??0,w=Math.max(width,height*1.5);return {width,height,world:{width:w,height:w/1.5},minZoom:w?Math.min(width/w,height/(w/1.5)):1}}
 const fit=()=>{const d=dimensions();pointers.current.clear();gesture.current=null;setView({zoom:d.minZoom,x:0,y:0})}
 const current=useRef(view),pointers=useRef(new Map<number,{x:number;y:number}>())
 const gesture=useRef<{view:VistaMapa;cx:number;cy:number;distance:number}|null>(null)
 current.current=view
 const size=()=>({width:viewport.current?.clientWidth??0,height:viewport.current?.clientHeight??0})
 const setBounded=(next:VistaMapa)=>{const d=dimensions();setView(limitarVistaMapa(next,d.width,d.height,4,d.world,d.minZoom))}
 const zoom=(factor:number)=>{const d=dimensions();setView(v=>aproximarMapa(v,v.zoom*factor,{x:0,y:0},d.width,d.height,4,d.world,d.minZoom))}
 const rebase=()=>{
  const pts=[...pointers.current.values()]
  if(!pts.length){gesture.current=null;return}
  const a=pts[0],b=pts[1]??a
  gesture.current={view:current.current,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,distance:pts.length>1?Math.hypot(a.x-b.x,a.y-b.y):0}
 }
 useEffect(()=>{
  const el=viewport.current
  if(!el)return
  const wheel=(event:WheelEvent)=>{
   // Scroll de página continua normal; Ctrl/⌘ + roda aproxima o mapa.
   if(!event.ctrlKey&&!event.metaKey)return
   event.preventDefault()
   const rect=el.getBoundingClientRect(),d=dimensions()
   setView(v=>aproximarMapa(v,v.zoom*Math.exp(-event.deltaY*.004),{x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-rect.height/2},el.clientWidth,el.clientHeight,4,d.world,d.minZoom))
  }
  const observer=new ResizeObserver(()=>{const d=dimensions();setWorld(d.world);setView(v=>limitarVistaMapa(v,d.width,d.height,4,d.world,d.minZoom));pointers.current.clear();gesture.current=null})
  observer.observe(el);el.addEventListener('wheel',wheel,{passive:false})
  return()=>{observer.disconnect();el.removeEventListener('wheel',wheel)}
 },[])
 return <section className="pe-map" aria-label={t('Mapa do estádio','Stadium map')}>
  <div className="pe-map-tools">
   <button type="button" onClick={()=>zoom(1.35)} disabled={view.zoom>=4} aria-label={t('Aproximar mapa','Zoom in')}>+</button>
   <output aria-live="polite">{Math.round(view.zoom*100)}%</output>
   <button type="button" onClick={()=>zoom(1/1.35)} disabled={view.zoom<=dimensions().minZoom} aria-label={t('Afastar mapa','Zoom out')}>−</button>
   <button type="button" onClick={fit}>{t('VER TUDO','FIT MAP')}</button>
   <button type="button" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?t('RETOMAR MOVIMENTO','RESUME MOVEMENT'):t('PAUSAR MOVIMENTO','PAUSE MOVEMENT')}</button>
  </div>
  <div ref={viewport} className="pe-map-viewport" data-map-zoom={view.zoom} tabIndex={0} role="group" aria-label={t('Arraste o mapa; use dois dedos para aproximar','Drag the map; pinch to zoom')}
   onPointerDown={event=>{
    if(event.target instanceof Element&&event.target.closest('button'))return
    if(event.pointerType==='mouse'&&event.button!==0)return
    if(pointers.current.size>=2)return
    event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});rebase()
   }}
   onPointerMove={event=>{
    if(!pointers.current.has(event.pointerId)||!gesture.current)return
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
    const pts=[...pointers.current.values()],a=pts[0],b=pts[1]??a,g=gesture.current,{width,height}=size()
    const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,rect=event.currentTarget.getBoundingClientRect()
    const anchored=pts.length>1&&g.distance>0?aproximarMapa(g.view,g.view.zoom*Math.hypot(a.x-b.x,a.y-b.y)/g.distance,{x:g.cx-rect.left-width/2,y:g.cy-rect.top-height/2},width,height,4,dimensions().world,dimensions().minZoom):g.view
    setBounded({...anchored,x:anchored.x+cx-g.cx,y:anchored.y+cy-g.cy})
   }}
   onPointerUp={event=>{pointers.current.delete(event.pointerId);rebase()}}
   onPointerCancel={event=>{pointers.current.delete(event.pointerId);rebase()}}
   onLostPointerCapture={event=>{pointers.current.delete(event.pointerId);rebase()}}
   onKeyDown={event=>{
    if(event.target!==event.currentTarget)return
    const offsets:Record<string,[number,number]>={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}
    if(offsets[event.key]){event.preventDefault();const [x,y]=offsets[event.key];setBounded({...view,x:view.x+x,y:view.y+y})}
    if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.35)}
    if(event.key==='-'){event.preventDefault();zoom(1/1.35)}
    if(event.key==='Home'){event.preventDefault();fit()}
   }}>
   <div className="pe-map-world" style={{width:world.width||'100%',height:world.height||'100%',transform:`translate(-50%,-50%) translate(${view.x}px,${view.y}px) scale(${view.zoom})`}}><PresidenciaEstadioImagem stadium={stadium} camera="aerial" detail={world.width*view.zoom>800||view.zoom>dimensions().minZoom*1.25} movementPaused={paused}/></div>
  </div>
  <p className="pe-map-help">{t('Arraste para explorar. Aproxime com dois dedos ou pelos botões.','Drag to explore. Pinch or use the buttons to zoom.')}</p>
 </section>
}
