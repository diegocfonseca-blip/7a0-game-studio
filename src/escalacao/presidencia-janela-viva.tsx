import {Component,lazy,Suspense,useState,type ReactNode} from 'react'
import type {StadiumSave} from './estadiodata'
import {usePresidentPreview} from './presidente-acesso'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import {jornadaDoComplexo} from './presidencia-complexo-jornada'
import {PresidenciaEstadioImagem} from './presidencia-estadio-imagem'
import {estadioVisualValido} from './presidencia-estadio-validacao'
const Complexo=lazy(()=>import('./presidencia-complexo-3d'))
class JanelaProtegida extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?this.props.fallback:this.props.children}
}

/** A mesma geometria do mapa atrás do vão transparente da arte da sala.
 * A janela tem câmera fixa; nenhuma compra, corpo ou resultado é fabricado. */
export function PresidenciaJanelaViva({stadium,mgrId}:{stadium?:StadiumSave;mgrId:number}){
 const allowed=usePresidentPreview(),match=usePartidaNoMapa(undefined,mgrId)
 const [failed,setFailed]=useState(false)
 const fallback=<PresidenciaEstadioImagem stadium={stadium} camera="window"/>
 if(!allowed||failed||(stadium!==undefined&&!estadioVisualValido(stadium)))return fallback
 const agenda=match?.context.agenda
 const journey=agenda?jornadaDoComplexo({agenda,match,stadiumClubId:mgrId}):undefined
 return <JanelaProtegida fallback={fallback}><Suspense fallback={fallback}>
  <Complexo stadium={stadium} match={match??undefined} journey={journey} presentation="window" onUnavailable={()=>setFailed(true)}/>
 </Suspense></JanelaProtegida>
}
