import React from 'react'
import{createRoot}from'react-dom/client'
import{EscLobby}from'../../src/escalacao/lobby'
import{EscCtxBancada,INITIAL}from'../../src/escalacao/store'
import{supabase}from'../../src/lib/supabase'
import{requestOnlineDestination}from'../../src/escalacao/desktop-online-navigation'
import{_bancadaApoio}from'../../src/escalacao/apoio'
import'../../src/index.css'
const W=window as any,user={id:'11111111-1111-4111-8111-111111111111',email:'teste-local@example.test',created_at:'2026-01-01T00:00:00Z',user_metadata:{display_name:'Clube de teste'}}
const server=JSON.parse(localStorage.getItem('test-only-server')??'{"rooms":[],"seats":[]}');W.testServer=server;W.rpcCreates=0;W.testFault='lost'
const persist=()=>localStorage.setItem('test-only-server',JSON.stringify(server))
Object.assign(supabase.auth,{getSession:async()=>({data:{session:{user,access_token:'local-not-a-real-session'}}}),getUser:async()=>({data:{user},error:null}),onAuthStateChange:(cb:any)=>{queueMicrotask(()=>cb('INITIAL_SESSION',{user}));return{data:{subscription:{unsubscribe(){}}}}}})
function query(table:string,rpc?:string,args?:any){
 const q={filters:[] as [string,unknown][],single:false,insert:null as any}
 const b:any=new Proxy({}, {get(_,key){
  if(key==='then')return(ok:any,bad:any)=>Promise.resolve().then(()=>{
   if(rpc==='esc_criar_sala_segura'){
    W.rpcCreates++;let room=server.rooms.find((r:any)=>r.id===args.p_id)
    if(!room){room={id:args.p_id,code:args.p_code,host_id:user.id,status:'waiting',mode:'leilao',max_players:args.p_max_players,game_state:args.p_game_state,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};server.rooms.push(room);server.seats.push({room_id:room.id,user_id:user.id,player_index:0,manager_name:args.p_nome,is_ready:true});persist()}
    return W.testFault==='lost'?new Promise(()=>{}):{data:room,error:null}
   }
   if(rpc)return{data:rpc==='esc_nomes_sem_escudo'?[]:null,error:null}
   let rows=table==='game_rooms'?server.rooms:table==='room_players'?server.seats:[]
   rows=rows.filter((r:any)=>q.filters.every(([k,v])=>k.includes('->>')||r[k]===v))
   return{data:q.single?rows[0]??null:rows,error:null,count:rows.length}
  }).then(ok,bad)
  return(...params:any[])=>{if(key==='eq')q.filters.push(params as [string,unknown]);if(key==='single'||key==='maybeSingle')q.single=true;if(['insert','upsert','update','delete'].includes(String(key)))q.insert=params;return b}
 }})
 return b
}
Object.assign(supabase,{from:(t:string)=>query(t),rpc:(fn:string,args:any)=>query('',fn,args),channel:()=>{const c:any={on:()=>c,subscribe:(cb:any)=>{queueMicrotask(()=>cb?.('SUBSCRIBED'));return c},track:async()=>{},untrack:async()=>{},send:async()=>{},unsubscribe:async()=>{},presenceState:()=>({})};return c},removeChannel:async()=>{},getChannels:()=>[]})
_bancadaApoio(user.email,'ouro');requestOnlineDestination('create')
const noop=()=>{},ctx:any={state:{...INITIAL,screen:'lobby'},dispatch:noop,emote:noop,addEmote:noop,emotes:[],chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={ctx}><div style={{background:'#ffc400',color:'#0c0c0c',padding:6,textAlign:'center',fontSize:12}}>TESTE LOCAL · SEM CONTAS REAIS</div><EscLobby/></EscCtxBancada.Provider>);W.uiReady=true
