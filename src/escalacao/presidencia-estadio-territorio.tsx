import {useEffect,useRef,useState} from 'react'
import type {StadiumSave} from './estadiodata'
import {camadasMundo,clipMundo,oclusoresDoMundo,type ArteMundo} from './presidencia-estadio-mundo'
import tiles from './presidencia-estadio-tiles'
import {PresidenciaEstadioCirculacao} from './presidencia-estadio-circulacao'
import {useT} from './lang'
import {CampoSuperficie} from './presidencia-campo-superficie'
import {CAMPO_MAPA} from './presidencia-partida-geometria'
import {RedesDoCampo} from './presidencia-partida-redes'
import {progressoVisualSetor} from './presidencia-estadio-camadas'
import {estadioVisualValido} from './presidencia-estadio-validacao'

type Tile={src:string;x:number;y:number;w:number;h:number}
type Limites={left:number;top:number;right:number;bottom:number}
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
function Arte({art,detail,bounds}:{art:ArteMundo;detail:boolean;bounds?:Limites}){
 const asset=tiles[art]
 // Cada recorte conserva sua posição na imagem inteira. Só deixa de existir
 // se estiver totalmente fora da área revelada; 1 px protege a borda do clip.
 const visible=detail?asset.tiles.filter(tile=>!bounds||(
  tile.x*15.36<bounds.right+1&&(tile.x+tile.w)*15.36>bounds.left-1&&
  tile.y*10.24<bounds.bottom+1&&(tile.y+tile.h)*10.24>bounds.top-1
 )):[]
 return <><img src={import.meta.env.BASE_URL+asset.src} alt="" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>{visible.map(tile=><Detalhe key={tile.src} tile={tile}/>)}</>
}
export function PresidenciaEstadioTerritorio({stadium,detail=false,pitchDetail=false,movementPaused}:{stadium?:StadiumSave;detail?:boolean;pitchDetail?:boolean;movementPaused?:boolean}){
 const t=useT(),layers=camadasMundo(stadium),grass=estadioVisualValido(stadium)?progressoVisualSetor(stadium,'grama'):0
 if(!layers.length)return <p role="alert">{t('Não foi possível ler as obras do estádio.','Could not read stadium construction.')}</p>
 return <div className="pe-territory" style={{position:'relative',aspectRatio:'1536 / 1024',width:'100%',isolation:'isolate'}} role="img" aria-label={t('Mapa ampliado do clube e suas obras','Expanded club map and construction')}>
  {layers.map(layer=>{
   const xs=layer.area?.map(p=>p[0])??[0,1536],ys=layer.area?.map(p=>p[1])??[0,1024],left=layer.window?.[0]??Math.min(...xs),width=layer.window?.[2]??Math.max(...xs)-left
   const top=layer.window?.[1]??0,height=layer.window?.[3]??1024
   const reveal=`inset(${top/1024*100}% ${(1536-left-width*layer.progress)/1536*100}% ${(1024-top-height)/1024*100}% ${left/1536*100}%)`
   const bounds={left:Math.max(left,Math.min(...xs)),right:Math.min(left+width*layer.progress,Math.max(...xs)),top:Math.max(top,Math.min(...ys)),bottom:Math.min(top+height,Math.max(...ys))}
   return <div key={layer.id} data-world-layer={layer.id} style={{position:'absolute',inset:0,clipPath:layer.area?clipMundo(layer.area):undefined,zIndex:layer.depth,pointerEvents:'none'}}><div style={{position:'absolute',inset:0,clipPath:reveal,filter:layer.brightness?`brightness(${layer.brightness})`:undefined}}><Arte art={layer.art} detail={detail} bounds={bounds}/></div></div>
  })}
  {grass>0&&<div data-world-pitch="true" style={{position:'absolute',inset:0,zIndex:7.5,filter:`brightness(${layers.find(l=>l.id==='grama')?.brightness??1})`,clipPath:`inset(0 ${(1536-575-358*grass)/1536*100}% 0 0)`}}><CampoSuperficie corners={CAMPO_MAPA} detail={pitchDetail}/></div>}
  {grass===1&&<div style={{position:'absolute',inset:0,zIndex:7.6,pointerEvents:'none'}}><RedesDoCampo corners={CAMPO_MAPA}/></div>}
  {/* Atores e oclusores compartilham o contexto de profundidade do território.
      Um wrapper com z-index prenderia TODOS os atores atrás das travessas. */}
  <PresidenciaEstadioCirculacao stadium={stadium} movementPaused={movementPaused}/>
  {oclusoresDoMundo(stadium).map(({id,area,groundY})=>{
   const xs=area.map(p=>p[0]),ys=area.map(p=>p[1]),bounds={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)}
   return <div key={id} data-world-occluder={id} aria-hidden="true" style={{position:'absolute',inset:0,zIndex:Math.round(groundY*10),clipPath:clipMundo(area),pointerEvents:'none'}}><Arte art="complete" detail={detail} bounds={bounds}/></div>
  })}
 </div>
}
