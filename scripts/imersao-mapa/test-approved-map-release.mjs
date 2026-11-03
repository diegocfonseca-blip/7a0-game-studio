import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})

const {consultarSalasArena,salasPublicasArena,COLUNAS_ARENA}=await import('../../src/escalacao/arena-salas-leitura.ts')
const now=Date.now(),fresh=new Date(now-1000).toISOString(),old=new Date(now-240000).toISOString()
const row=(id,p={})=>({id,status:'waiting',max_players:20,updated_at:fresh,ls_name:id,ls_mode:null,...p})
const rows=[row('open'),row('empty'),row('stale',{updated_at:old}),row('started',{status:'started'}),row('career',{ls_career:'true'}),row('draft',{ls_draft:'true'}),row('league-wait',{ls_mode:'liga'}),row('league',{ls_mode:'liga',status:'started'}),row('bafo',{ls_mode:'elenco'}),row('mundo',{ls_mode:'mundo'})]
const snapshot={rows,counts:Object.fromEntries(rows.map(r=>[r.id,r.id==='empty'?0:2])),at:now}
assert.deepEqual(salasPublicasArena(snapshot,{elenco:false,mundo:false}).map(r=>r.id),['open','started','league'])
assert(!/game_state|host_id|pw|code|user_id/.test(COLUNAS_ARENA))
function client(roomRows,pages,fail){const calls=[];return{calls,from(table){const query={table};calls.push(query);const b=new Proxy({}, {get(_,key){if(key==='abortSignal')return async signal=>{assert(!signal.aborted);return fail===table?{data:null,error:{message:'failed'}}:{data:table==='game_rooms'?roomRows:pages[(query.range?.[0]??0)/1000]??[],error:null}};if(['insert','update','upsert','delete','rpc','channel'].includes(key))throw Error('Mutation forbidden');return(...args)=>{query[key]=args;return b}}});return b}}}
const api=client([row('open')],[Array.from({length:1000},()=>({room_id:'open'})),[{room_id:'open'}]])
assert.equal((await consultarSalasArena(api,new AbortController().signal)).counts.open,1001);assert.equal(api.calls.length,3)
const bad=client([row('x')],[],'room_players');await assert.rejects(consultarSalasArena(bad,new AbortController().signal),/counts-unavailable/)
const ac=new AbortController();ac.abort();const cancelled=client([],[]);await assert.rejects(consultarSalasArena(cancelled,ac.signal));assert.equal(cancelled.calls.length,0)
const {criarEntornoComplexo}=await import('../../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts')
const {TERRENO_USUARIO}=await import('../../src/escalacao/residencia-planta.ts')
const {ARENA_ONLINE}=await import('../../src/escalacao/arena-planta.ts')
const {segmentoLivre}=await import('../../src/escalacao/presidencia-estadio-navegacao.ts')
const scene=new T.Scene(),save={inv:{geral:40},ext:['loja']},before=JSON.stringify(save)
const e=criarEntornoComplexo(scene,complexoDoEstadio(save),undefined,{name:'Neymarzetti',residence:true,arena:true})
try{for(const p of[TERRENO_USUARIO,ARENA_ONLINE]){
 const obstacle={id:p.id,polygon:p.footprint.map(v=>({x:v.x,y:v.z}))}
 for(const r of e.root.userData.roadNetwork.streets)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];assert(segmentoLivre({x:a.x,y:a.z},{x:b.x,y:b.z},[obstacle],r.width/2+r.walk),r.id+' crosses '+p.id)}
 for(const s of e.solids)if(s.id!==p.id)assert(!(s.minX<p.x+p.width/2&&s.maxX>p.x-p.width/2&&s.minZ<p.z+p.depth/2&&s.maxZ>p.z-p.depth/2),s.id+' overlaps '+p.id)
}assert.equal(e.root.userData.residence.paidUpgrade,false);assert.deepEqual(e.root.userData.roadNetwork.diagnostics.unresolved,[]);assert.equal(JSON.stringify(save),before)}finally{e.dispose()}
assert.equal(scene.children.length,0)
console.log('PASS: public-room visibility, GET-only, bounded pagination, cancellation, free plots, connected roads, save preservation and resource disposal')
