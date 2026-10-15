import {useDiaEstadio} from './presidencia-estadio-dia'
import {useEffect,useRef,useState,type CSSProperties} from 'react'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
import {atoresDoMapa,quadroAtor,MAPA_ESTADIO} from './presidencia-estadio-mapa-model'

export function PresidenciaEstadioCirculacao({stadium,movementPaused}:{stadium?:StadiumSave;movementPaused?:boolean}){
 const t=useT(),[localPaused,setPaused]=useState(false),paused=movementPaused??localPaused,root=useRef<HTMLDivElement>(null)
 const elapsed=useRef(0)
 const day=useDiaEstadio()
 const actors=atoresDoMapa(stadium,day),signature=JSON.stringify(actors)
 useEffect(()=>{
  const container=root.current
  if(!container)return
  const nodes=Array.from(container.querySelectorAll<HTMLElement>('[data-map-actor]'))
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  let frame=0,last=0,visible=false
  const paint=()=>nodes.forEach((node,i)=>{
   const actor=actors[i],p=quadroAtor(actor,elapsed.current)
   node.style.left=p.x/MAPA_ESTADIO.width*100+'%'
   node.style.top=p.y/MAPA_ESTADIO.height*100+'%'
   node.style.zIndex=String(p.depth)
   node.style.clipPath=p.hiddenFraction?`inset(0 0 ${p.hiddenFraction*100}% 0)`:''
   node.dataset.visit=p.visit
   node.style.transformOrigin=actor.kind==='car'?'center center':'center bottom'
   node.style.transform=`translate(-50%,${actor.kind==='car'?'-50%':'-100%'}) scale(${p.scale})${actor.kind==='car'?` rotate(${p.angle}deg)`:` scaleX(${p.flip?-1:1})`}`
   for(const image of Array.from(node.querySelectorAll<HTMLImageElement>('img'))){
    image.style.display=(image.dataset.back==='true')===!!(actor.srcBack&&p.back)?'block':'none'
    image.style.transform=actor.frames?`translateX(${-p.frame/actor.frames*100}%)`:''
   }
  })
  const tick=(time:number)=>{
   const active=!paused&&!reduced.matches&&!document.hidden&&visible
   if(active&&last)elapsed.current+=Math.min(.08,(time-last)/1000)
   last=active?time:0
   if(active)paint()
   if(active)frame=requestAnimationFrame(tick)
  }
  const wake=()=>{cancelAnimationFrame(frame);last=0;if(!paused&&!reduced.matches&&!document.hidden&&visible)frame=requestAnimationFrame(tick)}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;wake()})
  observer.observe(container);document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake)
  paint()
  return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',wake);reduced.removeEventListener('change',wake)}
 // O plano é imutável durante cada efeito; mudança de obra remonta o cenário.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[signature,paused])
 if(!actors.length)return null
 return <>
  <div ref={root} className="pe-circulation" aria-hidden="true" data-map-circulation="true">
   {actors.map(actor=><span key={actor.id} className={'pe-actor pe-actor-'+actor.kind} data-map-actor={actor.id} data-map-route={actor.route} style={{width:actor.width/MAPA_ESTADIO.width*100+'%',height:actor.height/MAPA_ESTADIO.height*100+'%',overflow:actor.frames?'hidden':undefined} as CSSProperties}><img src={import.meta.env.BASE_URL+actor.src} alt="" style={{width:(actor.frames??1)*100+'%'}}/>{actor.srcBack&&<img data-back="true" src={import.meta.env.BASE_URL+actor.srcBack} alt="" style={{width:(actor.frames??1)*100+'%',display:'none'}}/>}</span>)}
  </div>
  {movementPaused===undefined&&<button type="button" className="pe-motion-toggle" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?t('RETOMAR MOVIMENTO','RESUME MOVEMENT'):t('PAUSAR MOVIMENTO','PAUSE MOVEMENT')}</button>}
 </>
}
