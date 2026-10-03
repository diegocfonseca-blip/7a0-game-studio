import type {PresidenteRoupaTier} from './presidente-roupas'
/** Short-lived read snapshot. Stale/failed/out-of-order reads never grant access. */
export function criarEstadoTierPresidente(read:()=>Promise<unknown>,now:()=>number=Date.now){
 let tier:PresidenteRoupaTier|null=null,expires=0,revision=0
 const listeners=new Set<()=>void>()
 const emit=()=>listeners.forEach(fn=>fn())
 const invalidate=()=>{revision++;tier=null;expires=0;emit()}
 return {
  get:()=>now()<expires?tier:null,
  subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},
  invalidate,
  async refresh(){
   invalidate();const request=revision
   try{
    const value=await read()
    if(request!==revision)return
    if(typeof value==='string'&&['bege','verde','roxo','prata','ouro'].includes(value)){
     tier=value as PresidenteRoupaTier;expires=now()+60_000;emit()
    }
   }catch{/* Invalidated before the read; remain closed. */}
  },
 }
}
