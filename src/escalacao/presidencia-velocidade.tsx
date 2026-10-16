import {useEffect,useRef} from 'react'
import {useT} from './lang'
export const VELOCIDADES_ESTADIO=[.5,.25] as const
/** Stadium-only controls. Both slow rates are available without a paid tier.
 * Change the simulation source, never a separate animation-only clock.
 */
export function VelocidadeEstadio({speed,onSet}:{speed:number;onSet:(speed:number)=>void}){
 const t=useT(),previous=useRef(speed),current=useRef(speed),changed=useRef(false),setter=useRef(onSet)
 current.current=speed;setter.current=onSet
 useEffect(()=>()=>{if(changed.current&&VELOCIDADES_ESTADIO.some(v=>v===current.current))setter.current(previous.current)},[])
 const select=(value:number)=>{if(!changed.current||!VELOCIDADES_ESTADIO.some(v=>v===current.current))previous.current=current.current;changed.current=true;current.current=value;onSet(value)}
 const restore=()=>{changed.current=false;current.current=previous.current;onSet(previous.current)}
 return <fieldset style={{border:0,padding:0,margin:'0 0 12px'}}>
  <legend style={{fontWeight:800,marginBottom:6}}>{t('Ritmo para acompanhar no estádio','Stadium viewing speed')}</legend>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
   {VELOCIDADES_ESTADIO.map(value=><button key={value} type="button" aria-pressed={speed===value} onClick={()=>select(value)} style={{font:'inherit',padding:'10px 14px',minHeight:44,border:'2px solid #0c0c0c',borderRadius:8,background:speed===value?'#ffc400':'#f4ecd6',color:'#0c0c0c'}}>{value===.5?t('0,5× · Lento','0.5× · Slow'):t('0,25× · Bem lento','0.25× · Very slow')}</button>)}
   <button type="button" disabled={!VELOCIDADES_ESTADIO.some(v=>v===speed)} onClick={restore} style={{font:'inherit',padding:'10px 14px',minHeight:44}}>{t('Ritmo anterior','Previous speed')}</button>
  </div>
 </fieldset>
}
