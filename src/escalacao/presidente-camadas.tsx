import {useEffect,useState,useRef,useCallback,type CSSProperties} from 'react'
import {tr} from './lang'
import {Btn} from './ui-primitives'
import {PRESIDENTE_RIG,montarPresidenteLayers,type PresidenteLayer} from './presidente-rig'
import {aplicarTomPele} from './presidente-pele'
import './presidente-camadas.css'
import {camadasNaPose,type PresidentePose} from './presidente-pose'

/** Renderer da base v16. Não lê rascunho, plano, conta ou save. O chamador
 * fornece somente IDs do catálogo; coordenadas não vêm de dados do usuário. */
export function PresidenteCamadas({ids=['base-neutra-terno'],onReady,pose='standing'}:{ids?:readonly string[];onReady?:(key:string|null)=>void;pose?:PresidentePose}){
 const [attempt,setAttempt]=useState(0),key=JSON.stringify([ids,pose,attempt])
 return <CamadasConferidas key={key} ids={ids} onReady={onReady} pose={pose} onRetry={()=>setAttempt(n=>n+1)}/>
}
function CamadasConferidas({ids,onReady,pose,onRetry}:{ids:readonly string[];onReady?:(key:string|null)=>void;pose:PresidentePose;onRetry:()=>void}){
 const result=montarPresidenteLayers(ids),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState<string[]>([])
 const ready=result.ok&&!failed&&loaded.length===result.layers.length,key=JSON.stringify(ids)
 const didLoad=useCallback((id:string)=>setLoaded(old=>old.includes(id)?old:[...old,id]),[])
 const didFail=useCallback(()=>setFailed(true),[])
 useEffect(()=>{onReady?.(ready?key:null)},[ready,key,onReady])
 useEffect(()=>{
  if(ready||failed||!result.ok)return
  const timer=setTimeout(()=>setFailed(true),15000)
  return()=>clearTimeout(timer)
 },[ready,failed,result.ok])
 if(result.ok&&failed)return <div className="pc-error"><p role="alert">{tr('O visual não carregou. Suas escolhas foram mantidas.','The appearance did not load. Your selections were kept.')}</p><Btn bg="#fff" onClick={onRetry}>{tr('TENTAR NOVAMENTE','TRY AGAIN')}</Btn></div>
 if(!result.ok||failed)return <p role="alert" className="pc-error">{tr('Não foi possível montar este visual. Volte e escolha uma peça compatível.','This look could not be assembled. Go back and choose a compatible piece.')}</p>
 return <div className="pc-frame" aria-busy={!ready}>
  {!ready&&<span className="pc-loading" role="status">{tr('Carregando visual…','Loading appearance…')}</span>}
  <div className="pc-canvas" role="img" aria-label={pose==='seated'?tr('Presidente sentado','Seated president'):tr('Presidente de corpo inteiro','Full-body president')} style={{visibility:ready?'visible':'hidden'}}>
   {camadasNaPose(result.layers,pose).map(p=>p.skinTone?<PeleCanvas key={p.id} piece={p} pose={pose} onLoaded={didLoad} onFailed={didFail}/>:<img key={p.id} data-layer={p.id} src={import.meta.env.BASE_URL+p.src} alt="" draggable={false}
    onError={()=>setFailed(true)} onLoad={e=>{const im=e.currentTarget;if(im.naturalWidth!==p.raster.width||im.naturalHeight!==p.raster.height){setFailed(true);return}setLoaded(old=>old.includes(p.id)?old:[...old,p.id])}}
    style={{left:p.bounds.x/PRESIDENTE_RIG.width*100+'%',top:p.bounds.y/PRESIDENTE_RIG.height*100+'%',width:p.bounds.width/PRESIDENTE_RIG.width*100+'%',height:p.bounds.height/PRESIDENTE_RIG.height*100+'%'}}/>)}
  </div>
 </div>
}
function PeleCanvas({piece:p,pose,onLoaded,onFailed}:{piece:PresidenteLayer;pose:PresidentePose;onLoaded:(id:string)=>void;onFailed:()=>void}){
 const ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{
  let active=true;const im=new Image()
  im.onload=()=>{
   if(!active)return
   try{
    if(im.naturalWidth!==p.raster.width||im.naturalHeight!==p.raster.height||!p.skinTone||!p.outfit)throw Error('Invalid skin base')
    const canvas=ref.current,ctx=canvas?.getContext('2d',{willReadFrequently:true});if(!canvas||!ctx)throw Error('Canvas unavailable')
    ctx.drawImage(im,0,0);const image=ctx.getImageData(0,0,canvas.width,canvas.height)
    aplicarTomPele(image.data,canvas.width,canvas.height,p.skinTone,p.outfit,pose==='seated');ctx.putImageData(image,0,0);onLoaded(p.id)
   }catch{onFailed()}
  };im.onerror=()=>{if(active)onFailed()};im.src=import.meta.env.BASE_URL+p.src
  return()=>{active=false;im.onload=null;im.onerror=null}
 },[p.id,p.src,p.raster.width,p.raster.height,p.skinTone,p.outfit,pose,onLoaded,onFailed])
 const style:CSSProperties={left:p.bounds.x/PRESIDENTE_RIG.width*100+'%',top:p.bounds.y/PRESIDENTE_RIG.height*100+'%',width:p.bounds.width/PRESIDENTE_RIG.width*100+'%',height:p.bounds.height/PRESIDENTE_RIG.height*100+'%'}
 return <canvas ref={ref} width={p.raster.width} height={p.raster.height} data-layer={p.id} style={style}/>
}
