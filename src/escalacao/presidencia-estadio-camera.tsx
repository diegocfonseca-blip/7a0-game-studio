import {lazy,Suspense,useState} from 'react'
import {useT} from './lang'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import type {StadiumSave} from './estadiodata'
import {PresidenciaEstadioMapa} from './presidencia-estadio-mapa'
import {PresidenciaEstadioAerea} from './presidencia-estadio-aerea'
const Campo=lazy(()=>import('./presidencia-partida').then(module=>({default:module.Campo})))
/** Slot privado da aba existente: obras/compras permanecem no motor atual. */
export function PresidenciaEstadioCamera({stadium,onRoof,matchId,homeClubId}:{stadium?:StadiumSave;matchId?:string;homeClubId?:number;onRoof?:(closed:boolean)=>void}){
 const match=usePartidaNoMapa(matchId,homeClubId),[field,setField]=useState(false),t=useT()
 return <section>
  <PresidenciaEstadioMapa stadium={stadium} match={match}/>
  {match&&<><button type="button" onClick={()=>setField(v=>!v)}>{field?t('FECHAR CAMPO 3D','CLOSE 3D PITCH'):t('ACOMPANHAR EM 3D','WATCH IN 3D')}</button>{field&&<Suspense fallback={<p>{t('Carregando campo…','Loading pitch…')}</p>}><Campo state={match} three/></Suspense>}</>}
  <div style={{margin:'12px 0'}}><PresidenciaEstadioAerea match={match} stadium={stadium} onRoof={onRoof}/></div>
 </section>
}
