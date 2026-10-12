import {useEffect,useId,useRef,useState} from 'react'
import panels from './presidencia-arquibancadas-tiles'
/** Detalhes registrados na arquitetura original, sem alterar a geometria do campo.
 * Recortes só são solicitados ao entrar no enquadramento ampliado. */
export function ArquibancadasDetalhe(){
 const id=useId().replace(/:/g,'')
 return <svg className="pe-stands-detail" viewBox="0 0 1536 1024" aria-hidden="true">
  <defs>
   <linearGradient id={id+'-vertical'} x1="0" y1="0" x2="0" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset=".94" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
   <mask id={id+'-bottom'} maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="370"><rect width="1536" height="370" fill={`url(#${id}-vertical)`}/></mask>
   {panels.map(p=><g key={p.key}>
    <linearGradient id={id+p.key+'-edge'} x1={p.left} y1="0" x2={p.right} y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="black"/><stop offset=".015" stopColor="white"/><stop offset=".985" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
    <mask id={id+p.key+'-mask'} maskUnits="userSpaceOnUse" x={p.left} y="0" width={p.right-p.left} height="370"><rect x={p.left} width={p.right-p.left} height="370" fill={`url(#${id+p.key}-edge)`}/></mask>
   </g>)}
  </defs>
  <g mask={`url(#${id}-bottom)`}>{panels.map(p=><g key={p.key} mask={`url(#${id+p.key}-mask)`}><g transform={`matrix(${p.matrix.join(' ')})`}>{p.tiles.map(tile=><Tile key={tile.src} tile={tile}/>)}</g></g>)}</g>
 </svg>
}
function Tile({tile}:{tile:typeof panels[number]['tiles'][number]}){
 const ref=useRef<SVGImageElement>(null),[visible,setVisible]=useState(false),[loaded,setLoaded]=useState(false)
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{root:el.closest('.pe-live-viewport'),rootMargin:'64px'});observer.observe(el);return()=>observer.disconnect()},[])
 return <image ref={ref} data-stand-detail="true" x={tile.x} y={tile.y} width="256" height="256" href={visible?import.meta.env.BASE_URL+tile.src:undefined} opacity={loaded?1:0} onLoad={()=>setLoaded(true)} onError={e=>e.stopPropagation()}/>
}
