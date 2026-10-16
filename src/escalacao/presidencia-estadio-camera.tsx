import {lazy,Suspense,useRef,useState} from 'react'
import {useT} from './lang'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import type {StadiumSave} from './estadiodata'
import {PresidenciaEstadioMapa} from './presidencia-estadio-mapa'
import {PresidenciaEstadioAerea} from './presidencia-estadio-aerea'
import {usePresidentPreview} from './presidente-acesso'
import {adaptarCarreiraAoComplexo,type EntradaCarreiraComplexo} from './presidencia-complexo-carreira'
import {podeOperarTeto} from './presidencia-estadio-integrado'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {ControleComplexo} from './presidencia-complexo-3d'
import {Btn} from './ui-primitives'
const Campo=lazy(()=>import('./presidencia-partida').then(module=>({default:module.Campo})))
const Complexo=lazy(()=>import('./presidencia-complexo-3d'))
export type CarreiraCameraEstadio=Omit<EntradaCarreiraComplexo,'enabled'|'match'> & {key:string}
/** Slot privado da aba existente: obras/compras permanecem no motor atual. */
export function PresidenciaEstadioCamera({stadium,onRoof,matchId,homeClubId,career,onReady}:{stadium?:StadiumSave;matchId?:string;homeClubId?:number;onRoof?:(closed:boolean)=>void;career?:CarreiraCameraEstadio;onReady?:(api:ControleComplexo|null)=>void}){
 const match=usePartidaNoMapa(matchId,homeClubId,!!career),[field,setField]=useState(false),[illustrated,setIllustrated]=useState(false),t=useT()
 const account=usePresidentPreview(),last=useRef<{key:string;match:EstadoPartidaEstadio}|null>(null)
 if(last.current?.key!==career?.key)last.current=null
 if(career&&account&&match)last.current={key:career.key,match}
 if(!account)last.current=null
 // Preserve people finishing their route after the score presentation unmounts.
 // The retained snapshot is local presentation only; it never writes a result.
 const retained=match??(last.current?{...last.current.match,finished:true,paused:true}:undefined)
 const adapted=career&&account?adaptarCarreiraAoComplexo({...career,enabled:true,match:retained,
  agenda:retained?.context.agenda??career.agenda}):null
 if(career&&!account)return null
 if(adapted)return <section data-presidencia-complexo-carreira>
  <Suspense fallback={<p role="status">{t('Carregando seu estádio e a região…','Loading your stadium and its surroundings…')}</p>}>
   <Complexo {...adapted.complexo} onReady={onReady}/>
  </Suspense>
  {onRoof&&podeOperarTeto(stadium)&&<div style={{margin:'12px 0'}}><Btn onClick={()=>onRoof(stadium?.roofClosed!==true)}>{stadium?.roofClosed?t('ABRIR TETO','OPEN ROOF'):t('FECHAR TETO','CLOSE ROOF')}</Btn></div>}
  <details onToggle={event=>setIllustrated(event.currentTarget.open)} style={{marginTop:12}}>
   <summary>{t('Vista ilustrada do estádio','Illustrated stadium view')}</summary>
   {illustrated&&<PresidenciaEstadioMapa stadium={stadium} match={match&&!match.finished?match:null}/>}
  </details>
 </section>
 return <section>
  <PresidenciaEstadioMapa stadium={stadium} match={match}/>
  {match&&<><button type="button" onClick={()=>setField(v=>!v)}>{field?t('FECHAR CAMPO 3D','CLOSE 3D PITCH'):t('ACOMPANHAR EM 3D','WATCH IN 3D')}</button>{field&&<Suspense fallback={<p>{t('Carregando campo…','Loading pitch…')}</p>}><Campo state={match} three/></Suspense>}</>}
  <div style={{margin:'12px 0'}}><PresidenciaEstadioAerea match={match} stadium={stadium} onRoof={onRoof}/></div>
 </section>
}
