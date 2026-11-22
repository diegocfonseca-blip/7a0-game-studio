import {useCallback,useSyncExternalStore} from 'react'

export type FootballPage='match'|'table'|'stats'|'squad'|'rivals'
const listeners=new Set<()=>void>()
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}
let current:{room:string;page:FootballPage}={room:'',page:'match'}
export function useFootballMatchNavigation(room:string,enabled:boolean){
 const page=useSyncExternalStore(subscribe,()=>enabled&&current.room===room?current.page:'match',()=>'match' as FootballPage)
 const choose=useCallback((next:FootballPage)=>{
  if(!enabled)return
  current={room,page:next};listeners.forEach(fn=>fn())
 },[room,enabled])
 return{page,choose}
}

let dock:{room:string;node:HTMLElement|null}={room:'',node:null}
const dockListeners=new Set<()=>void>()
export function setFootballChatDock(room:string,node:HTMLElement|null){
 if(dock.room===room&&dock.node===node)return
 if(!node&&dock.room!==room)return
 dock={room,node};dockListeners.forEach(fn=>fn())
}
export function useFootballChatDock(room:string,enabled:boolean){
 return useSyncExternalStore(fn=>{dockListeners.add(fn);return()=>{dockListeners.delete(fn)}},()=>enabled&&dock.room===room?dock.node:null,()=>null)
}
