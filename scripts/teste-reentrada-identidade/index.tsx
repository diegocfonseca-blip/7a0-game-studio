import React,{useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {supabase} from '../../src/lib/supabase'
import {EscProvider,useEsc,INITIAL,sanitize} from '../../src/escalacao/store'

// Rede inteiramente local: nenhuma conta ou sala real é usada nesta bancada.
const W=window as any,guest=new URLSearchParams(location.search).has('guest')
const hostUid='host-local',guestUid='convidado-local',uid=guest?guestUid:hostUid
const roomId='sala-local',topics:any[]=[],wire:any[]=[],writes:any[]=[]
const user={id:uid,email:uid+'@example.test',user_metadata:{display_name:guest?'Convidado':'Dono'}}
Object.assign(supabase.auth,{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})})
const seed={...INITIAL,onlineMode:'online',screen:'end',roomId,roomCode:'LOCAL1',isHost:true,youIdx:0,youUid:hostUid,hostInbox:true,
 managers:[{id:0,name:'Dono',teamName:'Dono',isHuman:true,squad:[],money:100,formation:'4-3-3'},{id:8,name:'Convidado',teamName:'Convidado',isHuman:true,squad:[],money:100,formation:'4-3-3'}],seatUids:[hostUid,'','','','','','','',guestUid],mundoNaLiga:true,league:[],fixtures:[],lastResults:[],presence:[],presenceUids:[]}
const players=[{user_id:hostUid,player_index:0,manager_name:'Dono'},{user_id:guestUid,player_index:8,manager_name:'Convidado'}]
supabase.from=((table:string)=>{
 let single=false,mutation=false
 const query:any={then(ok:any,bad:any){const data=mutation?null:table==='game_rooms'?{host_id:hostUid,game_state:seed,updated_at:new Date().toISOString()}:table==='room_players'?players:[];return Promise.resolve({data:single?(Array.isArray(data)?data[0]??null:data):data,error:null}).then(ok,bad)},select(){return query},eq(){return query},in(){return query},is(){return query},not(){return query},gt(){return query},gte(){return query},lt(){return query},lte(){return query},order(){return query},limit(){return query},maybeSingle(){single=true;return query},single(){single=true;return query},insert(value:any){mutation=true;writes.push({table,value});return query},upsert(value:any){mutation=true;writes.push({table,value});return query},update(value:any){mutation=true;writes.push({table,value});return query},delete(){mutation=true;return query}}
 return query
}) as any
supabase.rpc=(()=>Promise.resolve({data:[],error:null})) as any
supabase.channel=((topic:string)=>{
 const handlers:any[]=[],ch:any={topic,state:'joined',handlers,on(type:string,filter:any,cb:any){handlers.push({type,filter,cb});return ch},subscribe(cb:any){queueMicrotask(()=>cb?.('SUBSCRIBED'));return ch},send(message:any){wire.push({topic,...message});return Promise.resolve('ok')},httpSend(event:string,payload:any){wire.push({topic,type:'broadcast',event,payload});return Promise.resolve({success:true})},track(){return Promise.resolve('ok')},untrack(){return Promise.resolve('ok')},unsubscribe(){ch.state='closed';return Promise.resolve('ok')},presenceState(){return{}},teardown(){return Promise.resolve()}}
 topics.push(ch);return ch
}) as any
supabase.getChannels=(()=>topics.filter(c=>c.state!=='closed')) as any
supabase.removeChannel=(async(ch:any)=>ch.unsubscribe()) as any
W.qaWire=wire;W.qaWrites=writes;W.qaSeed=seed
W.qaDeliver=(message:any)=>{for(const ch of [...topics])if(ch.state!=='closed'&&ch.topic===message.topic)for(const h of ch.handlers)if(h.type==='broadcast'&&h.filter.event===message.event)h.cb({payload:message.payload})}
function Probe(){const {state,dispatch}=useEsc();useEffect(()=>{W.qa={state,dispatch,snapshot:()=>sanitize(state)}},[state,dispatch]);return <pre>{JSON.stringify({screen:state.screen,isHost:state.isHost,youUid:state.youUid,youIdx:state.youIdx})}</pre>}
createRoot(document.getElementById('root')!).render(<EscProvider><Probe/></EscProvider>)
