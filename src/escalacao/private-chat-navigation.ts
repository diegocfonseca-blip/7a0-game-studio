import {useSyncExternalStore} from 'react'

// Local presentation bridge between the room's existing chat and its mobile menu.
// Never serialized, broadcast, or used for account/host authorization.
type Snapshot = {roomId:string;available:boolean;open:boolean;unread:number}
const empty:Snapshot={roomId:'',available:false,open:false,unread:0}
let snapshot=empty
let controller:{token:symbol;roomId:string;show:()=>void}|null=null
const listeners=new Set<()=>void>()
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}
const current=()=>snapshot
function publish(next:Snapshot){
 if(snapshot.roomId===next.roomId&&snapshot.available===next.available&&snapshot.open===next.open&&snapshot.unread===next.unread)return
 snapshot=next;listeners.forEach(fn=>fn())
}
export function registerPrivateChat(roomId:string,show:()=>void){
 const token=Symbol('room-chat');controller={token,roomId,show}
 publish({roomId,available:true,open:false,unread:0})
 return()=>{if(controller?.token===token){controller=null;publish(empty)}}
}
export function updatePrivateChat(roomId:string,open:boolean,unread:number){
 if(controller?.roomId===roomId)publish({roomId,available:true,open,unread:Math.min(99,Math.max(0,unread))})
}
export function usePrivateChatNavigation(roomId:string,enabled:boolean){
 const state=useSyncExternalStore(subscribe,current,()=>empty)
 const available=enabled&&state.available&&state.roomId===roomId
 return{available,open:available&&state.open,unread:available?state.unread:0,show:()=>{if(available&&controller?.roomId===roomId)controller.show()}}
}
