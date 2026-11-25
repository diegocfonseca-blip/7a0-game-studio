import {useSyncExternalStore} from 'react'
import {useOwnerPresentation} from './online-preview'
import {useT} from './lang'

// Seleção só deste navegador: nunca entra em Sport, EscState, salas ou saves de futebol/basquete.
let selected=typeof location!=='undefined'&&new URLSearchParams(location.search).get('sport')==='formula1'
const listeners=new Set<()=>void>()
function subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}}
export function useFormula1Selected(){return useSyncExternalStore(subscribe,()=>selected,()=>false)}
export function openFormula1(){selected=true;listeners.forEach(fn=>fn())}
export function closeFormula1(){selected=false;listeners.forEach(fn=>fn())}
/** Mesma identidade principal já verificada para as prévias privadas; Futpoint não herda o acesso. */
export function Formula1Tab(){
 const allowed=useOwnerPresentation(),active=useFormula1Selected(),t=useT()
 if(!allowed)return null
 return <button type="button" onClick={openFormula1} aria-pressed={active} style={{flex:1,minWidth:0,minHeight:44,padding:'8px 6px',border:'2px solid #0C0C0C',borderRadius:10,background:active?'#FFC400':'#F4ECD6',color:'#0C0C0C',font:'700 12px Oswald,sans-serif',cursor:'pointer'}}>🏁 {t('FÓRMULA 1','FORMULA 1')}</button>
}
