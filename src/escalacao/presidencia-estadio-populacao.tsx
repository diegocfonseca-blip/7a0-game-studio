import {useState,type CSSProperties} from 'react'
import {personagensEstadio,type CameraEstadio} from './presidencia-estadio-camadas'
import type {StadiumSave} from './estadiodata'
import {useT} from './lang'
/** Pequenos grupos ilustrativos, não simulação da lotação ou renda do clube. */
export function PresidenciaEstadioPopulacao({stadium,camera}:{stadium?:StadiumSave;camera:CameraEstadio}){
 const t=useT(),[paused,setPaused]=useState(false),people=personagensEstadio(stadium,camera)
 if(!people.length)return null
 return <>
  <div className={'pe-population'+(paused?' paused':'')} data-stadium-npcs={people.length} aria-hidden="true">
   {people.map((person,index)=><span key={index} className="pe-person" data-npc-kind={person.kind} data-npc-placement={person.placement} style={{left:person.left+'%',top:person.top+'%','--pe-delay':person.delay+'s'} as CSSProperties}><img src={import.meta.env.BASE_URL+person.src} alt=""/></span>)}
  </div>
  {camera==='aerial'&&<button type="button" style={{position:'absolute',right:8,top:8,border:'2px solid #0c0c0c',borderRadius:8,padding:'4px 8px',background:'#F4ECD6',color:'#0c0c0c',font:'inherit',fontSize:12}} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?t('RETOMAR MOVIMENTO','RESUME MOVEMENT'):t('PAUSAR MOVIMENTO','PAUSE MOVEMENT')}</button>}
 </>
}
