import {PresidenciaEstadioTerritorio} from './presidencia-estadio-territorio'
import {etapaBaseEstadio,vistaInicialEstadio} from './presidencia-vista-estadio'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
import {estadioCompletoNaAerea} from './presidencia-estadio-completo'
import {geralNaAerea} from './presidencia-estadio-geral'
import {cadeirasExatasParaArte} from './presidencia-estadio-cadeiras'
import {visitanteExatoParaArte} from './presidencia-estadio-visitante'
import {camaroteExatoParaArte} from './presidencia-estadio-camarote'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {useEffect,useRef,useState} from 'react'
import {Btn} from './ui-primitives'
import {camadasEstadio,vistaTemPendencias,progressoVisualSetor} from './presidencia-estadio-camadas'
import {PresidenciaEstadioPopulacao} from './presidencia-estadio-populacao'
import {PresidenciaEstadioCirculacao} from './presidencia-estadio-circulacao'
import './presidencia-estadio-camadas.css'
import './presidencia-estadio-mapa.css'
type EstadioImagemProps={stadium?:StadiumSave;camera:'window'|'aerial';movementPaused?:boolean;detail?:boolean}
/** Corrige somente a curva superior direita nas duas bases aéreas compatíveis. */
function CantoArquibancadaAerea(){
 return <img data-stadium-corner="closed" src={import.meta.env.BASE_URL+'estadio-v242/canto-direito-overlay.png'} alt="" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill',pointerEvents:'none'}}/>
}
export function PresidenciaEstadioImagem(props:EstadioImagemProps){
 return <EstadioImagemRecuperavel key={JSON.stringify([props.camera,props.stadium])} {...props}/>
}
function EstadioImagemRecuperavel(props:EstadioImagemProps){
 const t=useT(),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false)
 const content=useRef<HTMLDivElement>(null)
 const checkReady=()=>{
  const images=Array.from(content.current?.querySelectorAll<HTMLImageElement>('img:not([data-map-detail])')??[])
  if(content.current&&images.every(image=>image.complete&&image.naturalWidth>0))setReady(true)
 }
 useEffect(()=>{checkReady()},[attempt])
 useEffect(()=>{
  if(ready||failed)return
  const timer=setTimeout(()=>setFailed(true),15000)
  return()=>clearTimeout(timer)
 },[ready,failed,attempt])
 return <div aria-busy={!ready&&!failed} style={{width:'100%',height:props.camera==='window'?'100%':undefined}}>
  {failed?<div role="alert"><p>{t('A imagem do estádio não carregou. Suas obras continuam guardadas.','The stadium image did not load. Your improvements are still saved.')}</p><Btn bg="#fff" onClick={()=>{setReady(false);setFailed(false);setAttempt(n=>n+1)}}>{t('TENTAR CARREGAR O ESTÁDIO','RETRY STADIUM IMAGE')}</Btn></div>:
   <><span hidden={ready} role="status">{t('Carregando vista do estádio.','Loading stadium view.')}</span>
   <div ref={content} key={attempt} style={{height:props.camera==='window'?'100%':undefined,visibility:ready?'visible':'hidden'}} onLoadCapture={checkReady} onErrorCapture={event=>{if(!(event.target instanceof HTMLImageElement)||!event.target.hasAttribute('data-map-detail'))setFailed(true)}}><EstadioImagemConteudo {...props}/></div></>}
 </div>
}
/** Mesmas obras em todas as câmeras, sem alterar o raster nem inventar setores. */
function EstadioImagemConteudo({stadium,camera,movementPaused,detail}:EstadioImagemProps){
 if(camera==='aerial')return <PresidenciaEstadioTerritorio stadium={stadium} detail={detail} movementPaused={movementPaused}/>
 return <EstadioJanelaConteudo stadium={stadium} camera={camera} movementPaused={movementPaused}/>
}
function EstadioJanelaConteudo({stadium,camera,movementPaused}:EstadioImagemProps){
 const layers=camadasEstadio(stadium,camera)
 return <div className="pe-scene" data-camera={camera} data-stadium-evolution="true">
  <div className="pe-camera-canvas">
  {camera==='aerial'?<EstadioMapaBase stadium={stadium}/>:<EstadioImagemBase stadium={stadium} camera={camera}/>}
  {camera==='aerial'&&estadioVisualValido(stadium)&&progressoVisualSetor(stadium,'visitante')===1&&progressoVisualSetor(stadium,'cadeiras')===1&&<div className="pe-layer" style={{zIndex:2001}}><CantoArquibancadaAerea/></div>}
  {layers.map(layer=>{
   if(layer.bounds)return <div key={layer.id} className="pe-sprite" data-stadium-layer={layer.id} style={{left:layer.bounds.left+'%',top:layer.bounds.top+'%',width:layer.bounds.width+'%',height:layer.bounds.height+'%',zIndex:layer.depth}}><img src={import.meta.env.BASE_URL+layer.src} alt="" aria-hidden="true"/></div>
   const xs=[...layer.clip.matchAll(/([\d.]+)%\s+[\d.]+%/g)].map(match=>Number(match[1]))
   const left=Math.min(...xs),right=100-(left+(Math.max(...xs)-left)*layer.progress)
   const b=layer.sourceBounds
   return <div key={layer.id} className="pe-layer" data-stadium-layer={layer.id} data-work-progress={layer.progress} style={{clipPath:layer.clip,zIndex:layer.depth}}><div className="pe-reveal" style={{clipPath:layer.progress<1?`inset(0 ${right}% 0 ${left}%)`:undefined}}><img src={import.meta.env.BASE_URL+layer.src} alt="" aria-hidden="true" style={b?{position:'absolute',left:b.left+'%',top:b.top+'%',width:b.width+'%',height:b.height+'%'}:undefined}/></div></div>
  })}
  {camera==='aerial'?<><ObraMapa stadium={stadium}/><PresidenciaEstadioCirculacao stadium={stadium} movementPaused={movementPaused}/><ArvoresMapaFrente/></>:<PresidenciaEstadioPopulacao stadium={stadium} camera={camera}/>}
  </div>
 </div>
}
/** Mesmo terreno e mesmas ruas durante toda a evolução. Não troca o mapa
 * pela foto final que contém estabelecimentos em outras posições. */
function EstadioMapaBase({stadium}:{stadium?:StadiumSave}){
 const t=useT(),view=vistaInicialEstadio(stadium)
 if(stadium!==undefined&&!estadioVisualValido(stadium))return <p role="alert">{t('Não foi possível ler as obras do estádio.','Could not read stadium construction.')}</p>
 const grass=view.grass,clip=`polygon(33.1% 26%, ${33.1+32.1*grass}% 26%, ${30.5+37.1*grass}% 43.5%, 30.5% 43.5%)`
 const stage=etapaBaseEstadio(stadium)
 return <div data-stadium-camera="aerial" data-stadium-stage={stage??undefined} data-grass-progress={grass} data-stadium-complete={estadioCompletoNaAerea(stadium)||undefined} data-roof-closed={stadium?.roofClosed===true}>
  <img src={import.meta.env.BASE_URL+'estadio-mapa/terreno.webp'} alt={t('Mapa do terreno, estádio e ruas do clube','Map of club grounds, stadium and streets')} style={{display:'block',width:'100%',height:'auto'}}/>
  {grass>0&&<div className="pe-stage" style={{clipPath:clip}}><img src={import.meta.env.BASE_URL+'estadio-v104/grama.webp'} alt="" aria-hidden="true"/></div>}
  {stage&&['cadeiras','visitante','camarote'].includes(stage)&&<div className="pe-stage" style={{clipPath:'polygon(27% 42%, 72% 42%, 72% 58%, 27% 58%)',zIndex:2250}}><img src={import.meta.env.BASE_URL+({cadeiras:'estadio-v223/cadeiras-aerea.webp',visitante:'estadio-v225/visitante-aerea.webp',camarote:'estadio-v226/camarote-aerea.webp'}[stage as 'cadeiras'|'visitante'|'camarote'])} alt="" aria-hidden="true"/></div>}
 </div>
}
function ArvoresMapaFrente(){
 // Recortes da vegetação original sobre a circulação, não arte desenhada.
 return <>{['polygon(22% 78%, 24% 77%, 25% 81%, 24% 84%, 22% 83%)','polygon(34% 80%, 36% 79%, 38% 82%, 37% 86%, 34% 85%)','polygon(61% 77%, 63% 76%, 65% 78%, 65% 83%, 62% 84%)'].map(clip=><div key={clip} className="pe-tree-front" aria-hidden="true" style={{clipPath:clip}}><img src={import.meta.env.BASE_URL+'estadio-mapa/terreno.webp'} alt=""/></div>)}</>
}
function ObraMapa({stadium}:{stadium?:StadiumSave}){
 if(!estadioVisualValido(stadium))return null
 const sites=[['grama',35,46],['geral',26,44],['cadeiras',28,44],['visitante',69,44],['camarote',44,51]] as const
 return <>{sites.filter(([key])=>{const p=progressoVisualSetor(stadium,key);return p>0&&p<1}).map(([key,left,top])=><span key={key} className="pe-construction" data-map-construction={key} style={{left:left+'%',top:top+'%'}}><img src={import.meta.env.BASE_URL+'estadio-mapa/obra.webp'} alt="" aria-hidden="true"/></span>)}</>
}
function EstadioImagemBase({stadium,camera}:EstadioImagemProps){
 const t=useT(),view=vistaInicialEstadio(stadium),aerial=camera==='aerial'
 if(!aerial&&estadioCompletoNaAerea(stadium))return <div data-stadium-camera="window" data-stadium-complete="true" data-roof-closed={stadium?.roofClosed===true} style={{height:'100%',width:'100%'}}>
  <img src={import.meta.env.BASE_URL+`estadio-v115/${stadium?.roofClosed===true?'fechado':'aberto'}-janela.webp`} alt={stadium?.roofClosed===true?t('Estádio completo visto do terraço da presidência, teto fechado','Completed stadium seen from the presidential terrace, roof closed'):t('Estádio completo visto do terraço da presidência, teto aberto','Completed stadium seen from the presidential terrace, roof open')} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>
 if(!aerial&&camaroteExatoParaArte(stadium))return <div data-stadium-camera="window" data-stadium-stage="camarote" style={{height:'100%',width:'100%'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v225/visitante-janela.webp'} alt={t('Campo visto da presidência; os camarotes laterais ficam fora desta visão','Pitch seen from the presidency; the side boxes are outside this sightline')} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>
 if(!aerial&&visitanteExatoParaArte(stadium))return <div data-stadium-camera="window" data-stadium-stage="visitante" style={{height:'100%',width:'100%'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v225/visitante-janela.webp'} alt={t('Gramado, Geral, Cadeiras e Visitante vistos da sala do presidente','Pitch, general terraces, seats and away stand seen from the president office')} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>
 if(!aerial&&cadeirasExatasParaArte(stadium))return <div data-stadium-camera="window" data-stadium-stage="cadeiras" style={{height:'100%',width:'100%'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v223/cadeiras-janela.webp'} alt={t('Gramado, Geral e Cadeiras vistos da sala do presidente','Pitch, general terraces and seats seen from the president office')} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>
 if(!aerial&&geralNaAerea(stadium))return <div data-stadium-camera="window" data-stadium-stage="geral" style={{height:'100%',width:'100%'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v112/geral-janela.webp'} alt={t('Gramado e Geral vistos da presidência','Grass pitch and terraces seen from the presidency')} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/>
 </div>
 if(aerial&&estadioCompletoNaAerea(stadium))return <div data-stadium-camera="aerial" data-stadium-complete="true" data-roof-closed={stadium?.roofClosed===true}>
  <img src={import.meta.env.BASE_URL+`estadio-v104/${stadium?.roofClosed===true?'fechado':'aberto'}.webp`} alt={stadium?.roofClosed===true?t('Complexo do estádio completo, teto fechado','Completed stadium precinct, roof closed'):t('Complexo do estádio completo, teto aberto','Completed stadium precinct, roof open')} style={{display:'block',width:'100%',height:'auto'}}/>
 </div>
 if(aerial&&camaroteExatoParaArte(stadium))return <div data-stadium-camera="aerial" data-stadium-stage="camarote" style={{position:'relative'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v226/camarote-aerea.webp'} alt={t('Estádio com camarotes laterais e sala presidencial vistos de cima','Aerial view of stadium with side boxes and presidential office')} style={{display:'block',width:'100%',height:'auto'}}/>
  <CantoArquibancadaAerea/>
 </div>
 if(aerial&&visitanteExatoParaArte(stadium))return <div data-stadium-camera="aerial" data-stadium-stage="visitante" style={{position:'relative'}}>
  <img src={import.meta.env.BASE_URL+'estadio-v225/visitante-aerea.webp'} alt={t('Gramado, Geral, Cadeiras, Visitante e sala do presidente vistos de cima','Aerial view of pitch, general terraces, seats, away stand and president office')} style={{display:'block',width:'100%',height:'auto'}}/>
  <CantoArquibancadaAerea/>
 </div>
 if(aerial&&cadeirasExatasParaArte(stadium))return <div data-stadium-camera="aerial" data-stadium-stage="cadeiras">
  <img src={import.meta.env.BASE_URL+'estadio-v223/cadeiras-aerea.webp'} alt={t('Gramado, Geral, Cadeiras e sala do presidente vistos de cima','Aerial view of pitch, general terraces, seats and president office')} style={{display:'block',width:'100%',height:'auto'}}/>
 </div>
 if(aerial&&geralNaAerea(stadium))return <div data-stadium-camera="aerial" data-stadium-stage="geral">
  <img src={import.meta.env.BASE_URL+'estadio-v104/geral.webp'} alt={t('Gramado e arquibancada Geral sem cobertura, vistos de cima','Aerial view of the grass pitch and uncovered general terraces')} style={{display:'block',width:'100%',height:'auto'}}/>
 </div>
 if(stadium!==undefined&&!estadioVisualValido(stadium))return <p role="alert">{t('Não foi possível ler o estado das obras do estádio. Nenhuma imagem de obra concluída será exibida.','Could not read the stadium construction state. No completed construction image will be shown.')}</p>
 if(!view.supported){
  const stage=etapaBaseEstadio(stadium)
  if(stage){
   const aerialSource:{[key:string]:string}={geral:'estadio-v104/geral.webp',cadeiras:'estadio-v223/cadeiras-aerea.webp',visitante:'estadio-v225/visitante-aerea.webp',camarote:'estadio-v226/camarote-aerea.webp'}
   const windowSource:{[key:string]:string}={geral:'estadio-v112/geral-janela.webp',cadeiras:'estadio-v223/cadeiras-janela.webp',visitante:'estadio-v225/visitante-janela.webp',camarote:'estadio-v225/visitante-janela.webp'}
   return <div data-stadium-camera={camera} data-stadium-preview={vistaTemPendencias(stadium)?'partial':undefined} data-stadium-base-stage={stage} style={{position:'relative',width:'100%',height:aerial?undefined:'100%'}}>
    <img src={import.meta.env.BASE_URL+(aerial?aerialSource[stage]:windowSource[stage])} alt={t('Prévia da última etapa concluída do estádio; outras obras compradas não aparecem nesta imagem','Preview of the last completed stadium stage; other purchased works are not shown in this image')} style={{display:'block',width:'100%',height:aerial?'auto':'100%',objectFit:'cover'}}/>
    {aerial&&(stage==='visitante'||stage==='camarote')&&<CantoArquibancadaAerea/>}
    {vistaTemPendencias(stadium)&&<span role="note" style={{position:'absolute',left:8,bottom:8,maxWidth:'calc(100% - 16px)',padding:'6px 9px',background:'rgba(0,0,0,.83)',color:'#fff',fontSize:12}}>{t('PRÉVIA PARCIAL — confira as obras listadas abaixo','PARTIAL PREVIEW — check the works listed below')}</span>}
   </div>
  }
 }
 const clip=aerial?`polygon(33.1% 26%, ${33.1+32.1*view.grass}% 26%, ${30.5+37.1*view.grass}% 43.5%, 30.5% 43.5%)`:`polygon(26.4% 32.6%, ${26.4+47.2*view.grass}% 32.6%, ${8.8+82.4*view.grass}% 46%, 8.8% 46%)`
 const base=aerial?'estadio-v104/terra.webp':'estadio-v106/terra-janela.webp'
 const grassImage=aerial?'estadio-v104/grama.webp':'estadio-v106/grama-janela.webp'
 return <div data-stadium-camera={camera} data-grass-progress={view.grass} data-stadium-preview={vistaTemPendencias(stadium)?'partial':undefined} data-stadium-base-stage={view.supported?undefined:'grama'} style={{position:'relative',width:'100%',height:aerial?undefined:'100%',overflow:'hidden'}}>
  <img src={import.meta.env.BASE_URL+base} alt={aerial?t('Vista aérea da região do seu estádio','Aerial view of your stadium area'):t('Campo visto pela janela da presidência','Pitch seen from the president office window')} style={{display:'block',width:'100%',height:aerial?'auto':'100%',objectFit:'cover'}}/>
  {view.grass>0&&<img src={import.meta.env.BASE_URL+grassImage} alt="" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',clipPath:clip}}/>}
  {vistaTemPendencias(stadium)&&<span role="note" style={{position:'absolute',left:8,bottom:8,maxWidth:'calc(100% - 16px)',padding:'6px 9px',background:'rgba(0,0,0,.83)',color:'#fff',fontSize:12}}>{t('PRÉVIA PARCIAL — confira as obras listadas abaixo','PARTIAL PREVIEW — check the works listed below')}</span>}
 </div>
}
