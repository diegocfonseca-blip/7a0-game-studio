import {useEffect,useRef,useState,useSyncExternalStore} from 'react'

type ObservacaoCampo=Readonly<{active:boolean;entry:number}>
const views=new Set<object>(),listeners=new Set<()=>void>()
const empty:ObservacaoCampo={active:false,entry:0}
let snapshot=empty
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}
const getSnapshot=()=>snapshot
const publish=(entry=snapshot.entry)=>{snapshot={active:views.size>0,entry};listeners.forEach(listener=>listener())}

/** One registration per visible outer view, never per match, frame or camera. */
export function registrarVistaCampo(token:object){
 if(views.has(token))return
 views.add(token);publish(snapshot.entry+1)
}
export function removerVistaCampo(token:object){
 if(views.delete(token))publish()
}
export function useObservacaoCampo(){return useSyncExternalStore(subscribe,getSnapshot,()=>empty)}
export function useAssistindoCampo(){return useObservacaoCampo().active}

/** Hidden score cards stay mounted. Register their open field only while its
 * ancestors actually take up space; scrolling away does not change playback.
 * Observers watch layout/ancestor visibility, not the animated scene subtree. */
export function useVistaCampo<T extends HTMLElement>(visible:boolean){
 const [element,setElement]=useState<T|null>(null),token=useRef<object>({})
 useEffect(()=>{
  const id=token.current
  if(!visible||!element)return
  const check=()=>{
   let shown=element.isConnected&&element.getClientRects().length>0
   for(let parent:HTMLElement|null=element;shown&&parent;parent=parent.parentElement){
    const style=getComputedStyle(parent)
    if(parent.hidden||style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')shown=false
   }
   if(shown)registrarVistaCampo(id);else removerVistaCampo(id)
  }
  check()
  const resize=new ResizeObserver(check),mutation=new MutationObserver(check)
  resize.observe(element)
  for(let parent:HTMLElement|null=element;parent;parent=parent.parentElement)mutation.observe(parent,{attributes:true,attributeFilter:['class','style','hidden','open']})
  return()=>{resize.disconnect();mutation.disconnect();removerVistaCampo(id)}
 },[visible,element])
 return setElement
}
