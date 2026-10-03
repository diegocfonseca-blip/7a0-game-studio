import {useEffect,useRef,type ImgHTMLAttributes} from 'react'
/** Retry is controlled by the owner through React key; no save mutations. */
export function PresidenciaImagemLocal({onUnavailable,onRecovered,...props}:Omit<ImgHTMLAttributes<HTMLImageElement>,'onLoad'|'onError'>&{onUnavailable:()=>void;onRecovered:()=>void}){
 const callbacks=useRef({onUnavailable,onRecovered})
 callbacks.current={onUnavailable,onRecovered}
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 const image=useRef<HTMLImageElement>(null)
 const clear=()=>{clearTimeout(timer.current);timer.current=undefined}
 useEffect(()=>{
  if(image.current?.complete){if(image.current.naturalWidth>0)callbacks.current.onRecovered();else callbacks.current.onUnavailable();return clear}
  timer.current=setTimeout(()=>callbacks.current.onUnavailable(),15000)
  return clear
 },[props.src])
 return <img {...props} ref={image} onLoad={e=>{clear();if(e.currentTarget.naturalWidth>0)callbacks.current.onRecovered();else callbacks.current.onUnavailable()}} onError={()=>{clear();callbacks.current.onUnavailable()}}/>
}
