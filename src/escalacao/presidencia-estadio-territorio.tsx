import {useEffect,useRef,useState} from 'react'
import type {StadiumSave} from './estadiodata'
import {camadasMundo,clipMundo,OCLUSORES_MUNDO,type ArteMundo} from './presidencia-estadio-mundo'
import tiles from './presidencia-estadio-tiles'
import {PresidenciaEstadioCirculacao} from './presidencia-estadio-circulacao'
import {useT} from './lang'

type Tile={src:string;x:number;y:number;w:number;h:number}
/** Só solicita o detalhe que cruza a janela do mapa. Falha no detalhe conserva
 * a visão geral; não derruba o estádio nem a leitura das obras. */
function Detalhe({tile}:{tile:Tile}){
 const ref=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[loaded,setLoaded]=useState(false)
 useEffect(()=>{
  const element=ref.current;if(!element)return
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{root:element.closest('.pe-map-viewport, .pe-live-viewport'),rootMargin:'64px'})
  observer.observe(element);return()=>observer.disconnect()
 },[])
 return <span ref={ref} style={{position:'absolute',left:tile.x+'%',top:tile.y+'%',width:tile.w+'%',height:tile.h+'%'}}>{visible&&<img data-map-detail="true" src={import.meta.env.BASE_URL+tile.src} alt="" onLoad={()=>setLoaded(true)} onError={event=>event.stopPropagation()} style={{width:'100%',height:'100%',opacity:loaded?1:0}}/>}</span>
}
function Arte({art,detail}:{art:ArteMundo;detail:boolean}){
 const asset=tiles[art]
 return <><img src={import.meta.env.BASE_URL+asset.src} alt="" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>{detail&&asset.tiles.map(tile=><Detalhe key={tile.src} tile={tile}/>)}</>
}
export function PresidenciaEstadioTerritorio({stadium,detail=false,movementPaused}:{stadium?:StadiumSave;detail?:boolean;movementPaused?:boolean}){
 const t=useT(),layers=camadasMundo(stadium)
 if(!layers.length)return <p role="alert">{t('Não foi possível ler as obras do estádio.','Could not read stadium construction.')}</p>
 return <div className="pe-territory" style={{position:'relative',aspectRatio:'1536 / 1024',width:'100%',isolation:'isolate'}} role="img" aria-label={t('Mapa ampliado do clube e suas obras','Expanded club map and construction')}>
  {layers.map(layer=>{
   const xs=layer.area?.map(p=>p[0])??[0,1536],left=layer.window?.[0]??Math.min(...xs),width=layer.window?.[2]??Math.max(...xs)-left
   const top=layer.window?.[1]??0,height=layer.window?.[3]??1024
   const reveal=`inset(${top/1024*100}% ${(1536-left-width*layer.progress)/1536*100}% ${(1024-top-height)/1024*100}% ${left/1536*100}%)`
   return <div key={layer.id} data-world-layer={layer.id} style={{position:'absolute',inset:0,clipPath:layer.area?clipMundo(layer.area):undefined,zIndex:layer.depth,pointerEvents:'none'}}><div style={{position:'absolute',inset:0,clipPath:reveal,filter:layer.brightness?`brightness(${layer.brightness})`:undefined}}><Arte art={layer.art} detail={detail}/></div></div>
  })}
  <div style={{position:'absolute',inset:0,zIndex:10}}><PresidenciaEstadioCirculacao stadium={stadium} movementPaused={movementPaused}/></div>
  {stadium?.ext.includes('asfalto')&&OCLUSORES_MUNDO.map((area,index)=><div key={index} aria-hidden="true" style={{position:'absolute',inset:0,zIndex:11,clipPath:clipMundo(area),pointerEvents:'none'}}><Arte art="complete" detail={detail}/></div>)}
 </div>
}
