import {useEffect,useRef,useState} from 'react'
import {useT} from './lang'
import {GOL_ENTRA_MS} from './chances'
import {quadroPartida,projetarCampo,atletasEmCampo,progressoChute,type EstadoPartidaEstadio} from './presidencia-partida-model'
import {estruturaEstadioCompleta} from './presidencia-estadio-completo'
import {PresidenciaEstadioTerritorio} from './presidencia-estadio-territorio'
import fieldTiles from './presidencia-partida-tiles'
import {RedesDoCampo} from './presidencia-partida-redes'
import {CAMPO_INTERNO,CAMPO_MAPA} from './presidencia-partida-geometria'
import {aproximarMapa,limitarVistaMapa,type VistaMapa} from './presidencia-estadio-mapa-model'
import './presidencia-partida.css'
const base=import.meta.env.BASE_URL
export function PresidenciaPartida({state}:{state:EstadoPartidaEstadio}){
 const t=useT(),[open,setOpen]=useState(false)
 return <details className="pe-live" onToggle={event=>setOpen(event.currentTarget.open)}><summary>{t('⚽ ACOMPANHAR NO ESTÁDIO','⚽ WATCH IN THE STADIUM')}</summary>{open&&<Campo key={state.context.id} state={state}/>}</details>
}
function Campo({state}:{state:EstadoPartidaEstadio}){
 const t=useT(),root=useRef<HTMLDivElement>(null),current=useRef(state),elapsed=useRef(0),repaint=useRef<()=>void>(()=>{})
 const [fieldFailed,setFieldFailed]=useState(false)
 const [view,setView]=useState<VistaMapa>({zoom:1,x:0,y:0}),viewRef=useRef(view)
 const pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef<{view:VistaMapa;cx:number;cy:number;distance:number}|null>(null)
 viewRef.current=view
 const size=()=>({width:root.current?.clientWidth??0,height:root.current?.clientHeight??0})
 const setBounded=(next:VistaMapa)=>{const {width,height}=size();setView(limitarVistaMapa(next,width,height,6))}
 const zoomBy=(factor:number)=>{const {width,height}=size();setView(v=>aproximarMapa(v,v.zoom*factor,{x:0,y:0},width,height,6))}
 const reset=()=>{pointers.current.clear();gesture.current=null;setView({zoom:1,x:0,y:0})}
 const rebase=()=>{const pts=[...pointers.current.values()];if(!pts.length){gesture.current=null;return}const a=pts[0],b=pts[1]??a;gesture.current={view:viewRef.current,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,distance:pts.length>1?Math.hypot(a.x-b.x,a.y-b.y):0}}
 useEffect(()=>{
  const el=root.current;if(!el)return
  const observer=new ResizeObserver(()=>{setView(v=>limitarVistaMapa(v,el.clientWidth,el.clientHeight,6));pointers.current.clear();gesture.current=null})
  const wheel=(event:WheelEvent)=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();const r=el.getBoundingClientRect();setView(v=>aproximarMapa(v,v.zoom*Math.exp(-event.deltaY*.004),{x:event.clientX-r.left-r.width/2,y:event.clientY-r.top-r.height/2},r.width,r.height,6))}
  observer.observe(el);el.addEventListener('wheel',wheel,{passive:false})
  return()=>{observer.disconnect();el.removeEventListener('wheel',wheel)}
 },[!!atletasEmCampo(state).length])
 current.current=state
 const internalAvailable=estruturaEstadioCompleta(state.context.stadium)&&!!state.context.stadium?.ext.includes('cober')
 const premium=internalAvailable&&!fieldFailed
 const players=atletasEmCampo(state),signature=players.map(p=>p.key).join('|')
 useEffect(()=>{
  const el=root.current;if(!el||!players.length)return
  const nodes=Array.from(el.querySelectorAll<HTMLElement>('[data-athlete]')),ball=el.querySelector<HTMLElement>('[data-ball]')
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  let handle=0,last=0,visible=false
  const paint=(now:number)=>{
   const s=current.current,active=s.goal
   const frame=quadroPartida(s,elapsed.current,progressoChute(active,now,GOL_ENTRA_MS))
   frame.actors.forEach((a,i)=>{
    const node=nodes[i];if(!node)return
    const p=projetarCampo(a.x,a.y,premium?CAMPO_INTERNO:CAMPO_MAPA),height=(premium?22:7)*(0.86+a.y*.14),width=height*128/192
    const view=a.keeper?'keeper':a.back?'back':'front',frames=a.keeper?2:4,column=a.keeper?(a.back?1:0):a.frame
    node.style.transform=`translate(-50%,-100%) scaleX(${a.flip?-1:1})`
    node.style.left=p.x/1536*100+'%';node.style.top=p.y/1024*100+'%';node.style.width=width/1536*100+'%';node.style.height=height/1024*100+'%';node.style.zIndex=String(Math.round(p.y))
    const body=node.querySelector<HTMLImageElement>('img')!,kit=node.querySelector<HTMLElement>('[data-kit]')!
    const url=base+'estadio-partida/'+view+'-body.webp';if(body.getAttribute('src')!==url)body.src=url
    body.style.width=frames*100+'%';body.style.transform=`translateX(${-column/frames*100}%)`
    kit.style.backgroundColor=a.side==='home'?s.homeColor:s.awayColor
    kit.style.maskImage=`url(${base}estadio-partida/${view}-kit.webp)`;kit.style.maskSize=`${frames*100}% 100%`;kit.style.maskPosition=`${column/(frames-1)*100}% 0`
   })
   if(ball){ball.style.width=(premium?3:1)/1536*100+'%';ball.style.height=(premium?3:1)/1024*100+'%';const p=projetarCampo(frame.ball.x,frame.ball.y,premium?CAMPO_INTERNO:CAMPO_MAPA);ball.style.left=p.x/1536*100+'%';ball.style.top=p.y/1024*100+'%';ball.style.zIndex=String(Math.round(p.y)-1)}
  }
  const animate=()=>{const s=current.current;return visible&&!document.hidden&&!reduced.matches&&((!s.paused&&!s.finished&&s.minute>0)||s.goal?.phase==='shot')}
  const tick=(now:number)=>{
   handle=0
   const s=current.current
   if(!s.paused&&!s.finished&&!reduced.matches&&last)elapsed.current+=Math.min(.08,(now-last)/1000)
   last=now;paint(now)
   if(animate())handle=requestAnimationFrame(tick)
  }
  const wake=()=>{paint(performance.now());if(animate()){if(!handle){last=0;handle=requestAnimationFrame(tick)}}else{cancelAnimationFrame(handle);handle=0;last=0}}
  repaint.current=wake
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;wake()});observer.observe(el)
  document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake)
  return()=>{repaint.current=()=>{};cancelAnimationFrame(handle);observer.disconnect();document.removeEventListener('visibilitychange',wake);reduced.removeEventListener('change',wake)}
 // Os frames leem o estado vigente, sem segundo relógio de partida.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[signature,premium])
 useEffect(()=>repaint.current(),[state.paused,state.finished,state.minute,state.goal?.id,state.goal?.phase,state.homeColor,state.awayColor])
 if(!players.length)return <p role="status">{t('A visualização precisa das duas escalações completas da partida.','The view needs both complete match lineups.')}</p>
 return <section>{fieldFailed&&internalAvailable&&<p role="status">{t('A câmera do campo não carregou. Exibindo a vista geral do estádio.','The pitch camera could not load. Showing the stadium overview.')}</p>}<div className="pe-live-tools"><button type="button" aria-label={t('Aproximar campo','Zoom in pitch')} onClick={()=>zoomBy(1.3)} disabled={view.zoom>=6}>+</button><output>{Math.round(view.zoom*100)}%</output><button type="button" aria-label={t('Afastar campo','Zoom out pitch')} onClick={()=>zoomBy(1/1.3)} disabled={view.zoom<=1}>−</button><button type="button" onClick={reset}>{t('VER CAMPO','FIT PITCH')}</button><span>{state.homeScore} × {state.awayScore} · {state.minute}′</span></div>
  <div ref={root} className="pe-live-viewport" tabIndex={0} role="group" aria-label={t('Campo: arraste e aproxime com dois dedos','Pitch: drag and pinch to zoom')}
   onPointerDown={e=>{if(e.pointerType==='mouse'&&e.button!==0||pointers.current.size>=2)return;e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase()}}
   onPointerMove={e=>{if(!pointers.current.has(e.pointerId)||!gesture.current)return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.current.values()],a=pts[0],b=pts[1]??a,g=gesture.current,{width,height}=size(),r=e.currentTarget.getBoundingClientRect();const anchored=pts.length>1&&g.distance>0?aproximarMapa(g.view,g.view.zoom*Math.hypot(a.x-b.x,a.y-b.y)/g.distance,{x:g.cx-r.left-width/2,y:g.cy-r.top-height/2},width,height,6):g.view;setBounded({...anchored,x:anchored.x+(a.x+b.x)/2-g.cx,y:anchored.y+(a.y+b.y)/2-g.cy})}}
   onPointerUp={e=>{pointers.current.delete(e.pointerId);rebase()}} onPointerCancel={e=>{pointers.current.delete(e.pointerId);rebase()}} onLostPointerCapture={e=>{pointers.current.delete(e.pointerId);rebase()}}
   onKeyDown={e=>{if(e.target!==e.currentTarget)return;const offsets:Record<string,[number,number]>={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(offsets[e.key]){e.preventDefault();const [x,y]=offsets[e.key];setBounded({...view,x:view.x+x,y:view.y+y})}if(e.key==='+'||e.key==='='){e.preventDefault();zoomBy(1.3)}if(e.key==='-'){e.preventDefault();zoomBy(1/1.3)}if(e.key==='Home'){e.preventDefault();reset()}}}>
   <div className="pe-live-world" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.zoom})`}}>
    {premium?<><img className="pe-live-base" onError={()=>{setFieldFailed(true);reset()}} src={base+'estadio-partida/field.webp'} alt={t('Gramado e arquibancadas na câmera do campo','Pitch and stands from the pitch camera')}/>{view.zoom>1.25&&fieldTiles.map(tile=><DetalheCampo key={tile.src} tile={tile}/>)}</>:<PresidenciaEstadioTerritorio stadium={state.context.stadium} detail={view.zoom>1.25} movementPaused/>}
    <div className="pe-live-athletes" aria-label={t('Onze jogadores por equipe','Eleven players per team')}>{players.map(p=><span key={p.key} data-athlete={p.key} className="pe-live-athlete" title={p.name}><img src={base+'estadio-partida/'+(p.keeper?'keeper':'front')+'-body.webp'} alt=""/><span data-kit="true"/></span>)}<span data-ball="true" className="pe-live-ball"><img src={base+'penalty-private-v1/ball.webp'} alt={t('Bola','Ball')}/></span></div>
    {premium&&<RedesDoCampo/>}
   </div>
  </div><p className="pe-live-help">{t('Arraste e aproxime com dois dedos para acompanhar o campo.','Drag and pinch to follow the pitch.')}</p>
 </section>
}

function DetalheCampo({tile}:{tile:typeof fieldTiles[number]}){
 const ref=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[loaded,setLoaded]=useState(false)
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{root:el.closest('.pe-live-viewport'),rootMargin:'64px'});observer.observe(el);return()=>observer.disconnect()},[])
 return <span ref={ref} className="pe-live-detail" style={{left:tile.x+'%',top:tile.y+'%',width:tile.w+'%',height:tile.h+'%'}}>{visible&&<img data-map-detail="true" src={base+tile.src} alt="" onLoad={()=>setLoaded(true)} onError={e=>e.stopPropagation()} style={{width:'100%',height:'100%',opacity:loaded?1:0}}/>}</span>
}
