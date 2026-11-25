import {useSyncExternalStore} from 'react'
import {DURACAO_CENA} from './cenas-bairro-model'
export type QuadroCena={key:string;phase:'loading'|'playing'|'paused'|'ended'|'unavailable';seconds:number;duration:number}
let frame:QuadroCena={key:'',phase:'loading',seconds:0,duration:DURACAO_CENA}
const listeners=new Set<()=>void>()
export function publicarCena(next:QuadroCena){
 const seconds=Math.floor(next.seconds*4)/4
 if(frame.key===next.key&&frame.phase===next.phase&&frame.seconds===seconds)return
 frame={...next,seconds};listeners.forEach(fn=>fn())
}
export function quadroCenaAtual(){return frame}
export function prepararRepeticaoCena(key:string){publicarCena({key,phase:'loading',seconds:0,duration:DURACAO_CENA})}
export function useQuadroCena(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn)}},()=>frame,()=>frame)}
