import {useEffect,useState,type CSSProperties} from 'react'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'
import {itemPresidencia,type PresidenciaItemId} from './presidencia-economia'
import {useT} from './lang'
import './veiculo-no-solo.css'

/** Contact points belong to the cutout, so shadows move with the selected vehicle. */
export function VeiculoNoSolo({id,position,camera}:{id:PresidenciaItemId;position:number;camera:'garage'|'room'}){
 return <VeiculoConferido key={id} id={id} position={position} camera={camera}/>
}
function VeiculoConferido({id,position,camera}:{id:PresidenciaItemId;position:number;camera:'garage'|'room'}){
 const [imageState,setImageState]=useState<'loading'|'ready'|'failed'>('loading')
 const t=useT(),art=ARTES_VEICULOS[id],item=itemPresidencia(id)
 useEffect(()=>{
  if(imageState!=='loading'||!art?.scene||!item)return
  const timer=setTimeout(()=>setImageState('failed'),15000)
  return()=>clearTimeout(timer)
 },[imageState,art?.scene,item])
 if(!art?.scene||!item)return null
 const bike=item.slot==='duas-rodas',room=camera==='room'
 const points=art.ground?.contacts??[]
 return <div className={'vg-ground '+(room?'vg-room':'vg-garage')+(bike?' vg-bike':' vg-car')} data-art-state={imageState} data-position={position} data-grounded-vehicle={id} style={{aspectRatio:art.ground?.ratio}}>
  <span aria-hidden="true" className="vg-ambient"/>
  {points.map(([x,y,w,h],index)=><span key={index} aria-hidden="true" className="vg-contact" style={{left:x+'%',top:y+'%',width:w+'%',height:h+'%'} as CSSProperties}/>)}
  <img data-room-vehicle={room?id:undefined} data-garage-vehicle={room?undefined:id} data-position={position}
   className={room?(bike?'pr-bike':'pr-car'):'gv-vehicle gv-'+item.slot}
   src={import.meta.env.BASE_URL+art.scene} alt={t(item.pt,item.en)} onLoad={e=>setImageState(e.currentTarget.naturalWidth>0?'ready':'failed')} onError={()=>setImageState('failed')}/>
  {imageState==='failed'&&<span className="vg-art-error" role="status">{t(item.pt,item.en)} — {t('imagem indisponível','image unavailable')}</span>}
 </div>
}
