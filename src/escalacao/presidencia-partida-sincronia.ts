import {useEffect,useRef,useSyncExternalStore} from 'react'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'

type Publicacao={owner:symbol;state:EstadoPartidaEstadio}
let active:Publicacao|null=null
const listeners=new Set<()=>void>()
const notify=()=>listeners.forEach(fn=>fn())
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}
/** Somente a apresentação privada usa esta leitura ao preparar um lance.
 * O id impede reaproveitar posições de outra partida. */
export function partidaPublicada(id:string){return active?.state.context.id===id?active.state:null}
/** Só a apresentação privada do placar publica. Sem storage, rede, RNG ou gols novos. */
export function usePublicarPartida(state:EstadoPartidaEstadio){
 const owner=useRef(Symbol('placar')),clock=useRef({id:state.context.id,seconds:0,sampledAt:performance.now(),running:false,rate:1})
 const rate=Number.isFinite(state.context.speed)?Math.max(.25,Math.min(8,state.context.speed!)):1
 const running=!state.paused&&!state.finished&&state.minute>0
 const now=performance.now(),old=clock.current
 const seconds=old.id!==state.context.id?0:old.seconds+(old.running?Math.max(0,now-old.sampledAt)/1000*old.rate:0)
 clock.current={id:state.context.id,seconds,sampledAt:now,running,rate}
 const frame={...state,visualClock:{seconds,sampledAt:now,running,rate}}
 // Apenas mudanças do placar/modelo notificam assinantes; câmera/zoom não cria outro motor.
 useEffect(()=>{active={owner:owner.current,state:frame};notify()})
 useEffect(()=>{const token=owner.current;return()=>{if(active?.owner===token){active=null;notify()}}},[])
 return frame
}
export function usePartidaNoMapa(matchId?:string,homeClubId?:number,includeFinished=false){
 return useSyncExternalStore(subscribe,()=>{const s=active?.state;if(!s)return null;return matchId?s.context.id===matchId?s:null:homeClubId!==undefined&&s.context.homeClubId===homeClubId&&(includeFinished||!s.finished)?s:null},()=>null)
}
