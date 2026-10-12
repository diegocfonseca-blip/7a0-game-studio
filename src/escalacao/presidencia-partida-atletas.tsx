import {useEffect,useRef} from 'react'
import {useT} from './lang'
import {quadroFutebol3D} from './presidencia-futebol-motor'
import {projetarCampo,atletasEmCampo,type EstadoPartidaEstadio} from './presidencia-partida-model'
import {CAMPO_INTERNO,CAMPO_MAPA,escalaNoGramado} from './presidencia-partida-geometria'
import './presidencia-partida.css'
// Alfa >=40: corpos têm pés em y=190/192 e altura de pé 180 px;
// bola ocupa 124/128 px, com contato no solo em y=125/128.
const base=import.meta.env.BASE_URL
// Centro do pé apoiado medido no alfa de cada quadro (atlas 128×192).
const apoioPe={front:[30.2,27.9,49,37.2],back:[22.1,60.2,96.8,18.8],keeper:[78.5,65]} as const
/** Mesmos atletas, bola, relógio e evento do gol em todas as câmeras. */
export function PresidenciaAtletas({state,premium=false}:{state:EstadoPartidaEstadio;premium?:boolean}){
 const t=useT(),root=useRef<HTMLDivElement>(null),current=useRef(state),elapsed=useRef(0),repaint=useRef<()=>void>(()=>{})
 current.current=state
 const players=atletasEmCampo(state),signature=players.map(p=>p.key).join('|')
 useEffect(()=>{
  const el=root.current;if(!el||!players.length)return
  const nodes=Array.from(el.querySelectorAll<HTMLElement>('[data-athlete]')),ball=el.querySelector<HTMLElement>('[data-ball]')
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  let handle=0,last=0,visible=false
  const paint=(now:number)=>{
   const s=current.current,snapshot=quadroFutebol3D(s,now)
   const frame={actors:snapshot.players.map(p=>({...p,x:p.mx/105+.5,y:p.mz/68+.5,back:Math.cos(p.heading)<0,flip:Math.sin(p.heading)<0,frame:p.speed>.1?Math.floor(p.distance/1.4*4)%4:0})),ball:{x:snapshot.ball.x/105+.5,y:snapshot.ball.z/68+.5,elevation:snapshot.ball.y-.11,opacity:1}}
   frame.actors.forEach((a,i)=>{
    const node=nodes[i];if(!node)return
    const p=projetarCampo(a.x,a.y,premium?CAMPO_INTERNO:CAMPO_MAPA),height=escalaNoGramado(premium?CAMPO_INTERNO:CAMPO_MAPA,a.y).athleteHeight*192/180,width=height*128/192
    const view=a.keeper?'keeper':a.back?'back':'front',frames=a.keeper?2:4,column=a.keeper?(a.back?1:0):a.frame
    node.style.transform=`translate(-50%,-98.9583333333%) scaleX(${a.flip?-1:1})`
    node.style.left=p.x/1536*100+'%';node.style.top=p.y/1024*100+'%';node.style.width=width/1536*100+'%';node.style.height=height/1024*100+'%';node.style.zIndex=String(Math.round(p.y))
    node.style.setProperty('--foot-x',apoioPe[view][column]/128*100+'%')
    const body=node.querySelector<HTMLImageElement>('img')!,kit=node.querySelector<HTMLElement>('[data-kit]')!
    const url=base+'estadio-partida/'+view+'-body.webp';if(body.getAttribute('src')!==url)body.src=url
    body.style.width=frames*100+'%';body.style.transform=`translateX(${-column/frames*100}%)`
    kit.style.backgroundColor=a.side==='home'?s.homeColor:s.awayColor
    kit.style.maskImage=`url(${base}estadio-partida/${view}-kit.webp)`;kit.style.maskSize=`${frames*100}% 100%`;kit.style.maskPosition=`${column/(frames-1)*100}% 0`
   })
   if(ball){const scale=escalaNoGramado(premium?CAMPO_INTERNO:CAMPO_MAPA,frame.ball.y),diameter=scale.ballDiameter*128/124,elevation=frame.ball.elevation??0;ball.style.width=diameter/1536*100+'%';ball.style.height=diameter/1024*100+'%';const p=projetarCampo(frame.ball.x,frame.ball.y,premium?CAMPO_INTERNO:CAMPO_MAPA);ball.style.left=p.x/1536*100+'%';ball.style.top=(p.y-elevation*scale.athleteHeight/1.8)/1024*100+'%';ball.style.opacity=String(frame.ball.opacity??1);ball.style.zIndex=String(Math.round(p.y)-1);ball.dataset.elevation=String(elevation)}
  }
  const animate=()=>{const s=current.current;return visible&&!document.hidden&&!reduced.matches&&((!s.paused&&!s.finished&&s.minute>0)||s.goal?.phase==='shot'||!!s.chance)}
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
 useEffect(()=>repaint.current(),[state.paused,state.finished,state.minute,state.goal?.id,state.goal?.phase,state.chance?.id,state.homeColor,state.awayColor])

 if(!players.length)return null
 return <div ref={root} className="pe-live-athletes" aria-label={t('Onze jogadores por equipe','Eleven players per team')}>{players.map(p=><span key={p.key} data-athlete={p.key} className="pe-live-athlete" title={p.name}><span className="pe-live-sprite"><img src={base+'estadio-partida/'+(p.keeper?'keeper':'front')+'-body.webp'} alt=""/><span data-kit="true"/></span></span>)}<span data-ball="true" className="pe-live-ball"><img src={base+'penalty-private-v1/ball.webp'} alt={t('Bola','Ball')}/></span></div>
}
