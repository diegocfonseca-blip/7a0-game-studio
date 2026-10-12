import {useId} from 'react'
import './presidencia-partida.css'
import {CAMPO_INTERNO,CAMPO_MAPA,escalaNoGramado,larguraTexturaCampo} from './presidencia-partida-geometria'
import {projetarCampo} from './presidencia-partida-model'
const W=105,H=68
/** Superfície registrada nas mesmas coordenadas dos pés e da bola.
 * Textura de material + linhas vetoriais mantêm definição ao aproximar. */
export function CampoSuperficie({detail=false,corners=CAMPO_INTERNO}:{detail?:boolean;corners?:typeof CAMPO_INTERNO|typeof CAMPO_MAPA}){
 const id=useId().replace(/:/g,''),point=(x:number,y:number)=>{const p=projetarCampo(x/W,y/H,corners);return `${p.x},${p.y}`}
 const polygon=(x:number,y:number,w:number,h:number)=>[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)].join(' ')
 const arc=(cx:number,cy:number,r:number,start=0,end=Math.PI*2)=>Array.from({length:65},(_,i)=>{const a=start+(end-start)*i/64;return point(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}).join(' ')
 const textureWidth=larguraTexturaCampo(corners)
 const penAngle=Math.acos(5.5/9.15),lineWidth=escalaNoGramado(corners,.5).athleteHeight/1.8*.12
 return <svg className="pe-pitch-surface" data-pitch-surface="true" viewBox="0 0 1536 1024" aria-hidden="true">
  <defs>
   <pattern id={id+'-grass'} width={textureWidth} height={textureWidth*2/3} patternUnits="userSpaceOnUse"><image onError={e=>e.stopPropagation()} href={import.meta.env.BASE_URL+'estadio-partida/grass-base.webp'} width={textureWidth} height={textureWidth*2/3}/>{detail&&Array.from({length:24},(_,i)=>{const x=i%6,y=Math.floor(i/6);return <image onError={e=>e.stopPropagation()} key={i} href={import.meta.env.BASE_URL+`estadio-partida/grass-detail-${x*256}-${y*256}.webp`} x={x*textureWidth/6} y={y*textureWidth/6} width={textureWidth/6} height={textureWidth/6}/>})}</pattern>
   <linearGradient id={id+'-light'} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e9d689" stopOpacity=".09"/><stop offset="1" stopColor="#082914" stopOpacity=".14"/></linearGradient>
  </defs>
  <polygon points={polygon(0,0,W,H)} fill="#4b791d"/>
  <polygon points={polygon(0,0,W,H)} fill={`url(#${id}-grass)`} opacity=".64"/>
  {Array.from({length:12*8},(_,i)=>{const x=i%12,y=Math.floor(i/12);return (x+y)%2===0?<polygon key={i} points={polygon(x*W/12,y*H/8,W/12,H/8)} fill="#d6e9a0" opacity=".1"/>:null})}
  <polygon points={polygon(0,0,W,H)} fill={`url(#${id}-light)`}/>
  <g fill="none" stroke="#f4f3d7" strokeWidth={lineWidth} strokeLinejoin="round">
   <polygon points={polygon(0,0,W,H)}/><polyline points={[point(W/2,0),point(W/2,H)].join(' ')}/>
   <polyline points={arc(W/2,H/2,9.15)}/>
   {[false,true].map(right=><g key={String(right)}>
    <polygon points={polygon(right?W-16.5:0,(H-40.32)/2,16.5,40.32)}/>
    <polygon points={polygon(right?W-5.5:0,(H-18.32)/2,5.5,18.32)}/>
    <polyline points={arc(right?W-11:11,H/2,9.15,right?Math.PI-penAngle:-penAngle,right?Math.PI+penAngle:penAngle)}/>
   </g>)}
   <polyline points={arc(0,0,1,0,Math.PI/2)}/><polyline points={arc(W,0,1,Math.PI/2,Math.PI)}/>
   <polyline points={arc(0,H,1,-Math.PI/2,0)}/><polyline points={arc(W,H,1,Math.PI,Math.PI*1.5)}/>
  </g>
  {[11,W/2,W-11].map(x=>{const p=projetarCampo(x/W,.5,corners);return <circle key={x} cx={p.x} cy={p.y} r={lineWidth} fill="#f4f3d7"/>})}
 </svg>
}
