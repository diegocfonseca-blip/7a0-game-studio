import type {SupabaseClient} from '@supabase/supabase-js'
export const COLUNAS_ARENA='id,status,max_players,updated_at,ls_name,ls_mode,ls_career,ls_draft,ls_locked'
export type LinhaSalaArena={id:string;status:string;max_players:number;updated_at?:string|null;ls_name?:string|null;ls_mode?:string|null;ls_career?:string|null;ls_draft?:string|null;ls_locked?:string|null}
export type ConsultaArena={rows:LinhaSalaArena[];counts:Record<string,number>;at:number}
export type SalaArena={id:string;name:string;mode:string;status:'waiting'|'started';count:number;capacity:number;restricted:boolean}
const NOMES:Record<string,string>={rapido:'Partida rápida',liga:'Liga',elenco:'Bafo',mundo:'Copa do Mundo',champions:'Champions',liberta:'Libertadores',regional:'Regional',copa:'Copa'}
/** Public-room eligibility from the lobby. No passwords or match state. */
export function salasPublicasArena(result:ConsultaArena,access:{elenco:boolean;mundo:boolean}):SalaArena[]{
 return result.rows.filter(r=>{
  if(r.ls_draft==='true'||r.ls_career==='true'||r.ls_mode==='carreira')return false
  if(r.ls_mode==='elenco'&&!access.elenco||r.ls_mode==='mundo'&&!access.mundo)return false
  const age=r.updated_at?result.at-Date.parse(r.updated_at):null
  const fresh=age!==null&&Number.isFinite(age)&&age<60000
  if(r.ls_mode==='liga')return r.status==='started'&&fresh
  return (result.counts[r.id]??0)>0&&(r.status==='started'?fresh:r.status==='waiting'&&(age===null||Number.isFinite(age)&&age<180000))
 }).map(r=>({id:r.id,name:r.ls_name?.trim().slice(0,80)||'Sala online',mode:NOMES[r.ls_mode??'rapido']??'Sala online',status:r.status as 'waiting'|'started',count:result.counts[r.id]??0,capacity:r.max_players,restricted:r.ls_locked==='true'}))
 .sort((a,b)=>a.status===b.status?0:a.status==='waiting'?-1:1)
}
/** GET-only: no membership, presence, room code or save APIs. */
export async function consultarSalasArena(client:Pick<SupabaseClient,'from'>,signal:AbortSignal):Promise<ConsultaArena>{
 signal.throwIfAborted()
 const {data,error}=await client.from('game_rooms').select(COLUNAS_ARENA)
  .in('status',['waiting','started']).eq('ls_tag','escalacao').gte('created_at',new Date(Date.now()-6*60*60*1000).toISOString())
  .order('created_at',{ascending:false}).limit(50).abortSignal(signal)
 if(error||!Array.isArray(data))throw new Error('rooms-unavailable')
 const rows=data as unknown as LinhaSalaArena[],ids=rows.map(r=>r.id),counts:Record<string,number>={}
 // Only room IDs leave the server; pagination avoids silently truncated counts.
 if(ids.length)for(let page=0;page<5;page++){
  const {data:players,error:playerError}=await client.from('room_players').select('room_id').in('room_id',ids)
   .order('room_id',{ascending:true}).order('user_id',{ascending:true}).range(page*1000,page*1000+999).abortSignal(signal)
  if(playerError||!Array.isArray(players))throw new Error('counts-unavailable')
  for(const p of players as {room_id:string}[])counts[p.room_id]=(counts[p.room_id]??0)+1
  if(players.length<1000)break
  if(page===4)throw new Error('counts-incomplete')
 }
 return{rows,counts,at:Date.now()}
}
