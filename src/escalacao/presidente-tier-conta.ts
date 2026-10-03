import {useSyncExternalStore} from 'react'
import {supabase} from '../lib/supabase'
import {criarEstadoTierPresidente} from './presidente-tier-state'

// Read only, lazy and restricted to the private preview account. No founder
// fallback, user_metadata, saved avatar tier or writes to user_colors.
const state=criarEstadoTierPresidente(async()=>{
 const {data,error}=await supabase.auth.getUser()
 const email=data.user?.email?.trim().toLowerCase()
 if(error||email!=='diego.c.fonseca@gmail.com')return null
 const result=await supabase.from('user_colors').select('tier').eq('email',email).maybeSingle()
 return result.error?null:result.data?.tier
})
export const getPresidentOutfitTier=state.get
let consumers=0,stop:(()=>void)|undefined
function subscribe(listener:()=>void){
 const remove=state.subscribe(listener)
 if(consumers++===0){
  const auth=supabase.auth.onAuthStateChange(()=>{
   state.invalidate()
   // Never await Supabase inside its auth callback.
   queueMicrotask(()=>{if(consumers)void state.refresh()})
  })
  const refresh=()=>{if(document.visibilityState==='visible')void state.refresh()}
  const timer=window.setInterval(refresh,45_000)
  document.addEventListener('visibilitychange',refresh)
  stop=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);auth.data.subscription.unsubscribe();state.invalidate()}
  void state.refresh()
 }
 return()=>{remove();if(--consumers===0){stop?.();stop=undefined}}
}
const inactiveSubscribe=()=>()=>{}
const emptySnapshot=()=>null
export function usePresidentOutfitTier(enabled=true){return useSyncExternalStore(enabled?subscribe:inactiveSubscribe,enabled?state.get:emptySnapshot,emptySnapshot)}
