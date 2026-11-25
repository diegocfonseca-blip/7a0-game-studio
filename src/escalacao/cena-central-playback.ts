import {useSyncExternalStore} from 'react'
import type {QuadroCena} from './cenas-bairro-playback'

export const DURACAO_CHEGADA_CENTRAL=12
type QuadroCentral=QuadroCena&{revision:number}
const vazio:QuadroCentral={key:'',phase:'loading',seconds:0,duration:DURACAO_CHEGADA_CENTRAL,revision:0}
const quadros=new Map<string,QuadroCentral>(),listeners=new Set<()=>void>()
const notify=()=>listeners.forEach(fn=>fn())
export function quadroCentral(key:string){return quadros.get(key)??vazio}
function put(key:string,next:QuadroCentral){
 quadros.delete(key);quadros.set(key,next)
 while(quadros.size>12)quadros.delete(quadros.keys().next().value!)
 notify()
}
export function publicarCenaCentral(key:string,phase:QuadroCena['phase'],seconds:number,revision=0){
 const old=quadroCentral(key)
 if(old.revision!==revision)return
 const value=Math.floor(Math.max(0,Math.min(DURACAO_CHEGADA_CENTRAL,seconds))*4)/4
 if(old.key===key&&old.phase===phase&&old.seconds===value)return
 put(key,{key,phase,seconds:value,duration:DURACAO_CHEGADA_CENTRAL,revision})
}
export function repetirCenaCentral(key:string){
 put(key,{key,phase:'loading',seconds:0,duration:DURACAO_CHEGADA_CENTRAL,revision:quadroCentral(key).revision+1})
}
export function useCenaCentral(key:string){
 return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn)}},()=>quadroCentral(key),()=>vazio)
}
