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
const docks:{room:string;node:HTMLElement}[]=[]
/** Closing a cup restores the league's dock instead of leaving its chat detached. */
export function registerFootballChatDock(room:string,node:HTMLElement){
 const entry={room,node}
 const publish=()=>{const next=docks.at(-1)??{room:'',node:null};if(dock.room!==next.room||dock.node!==next.node){dock=next;dockListeners.forEach(fn=>fn())}}
 docks.push(entry);publish()
 return()=>{const at=docks.indexOf(entry);if(at>=0)docks.splice(at,1);publish()}
}
export function useFootballChatDock(room:string,enabled:boolean){
 return useSyncExternalStore(fn=>{dockListeners.add(fn);return()=>{dockListeners.delete(fn)}},()=>enabled&&dock.room===room?dock.node:null,()=>null)
}
