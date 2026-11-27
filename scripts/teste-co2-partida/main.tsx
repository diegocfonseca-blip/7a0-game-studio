import '../../src/App'
import {useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer} from '../../src/escalacao/store'
import {carreiraTradicionalBancada,reservasBancada} from '../teste-paridade-carreira/tradicional'
import {PyramidSeasonScreen} from '../../src/escalacao/pyramidseason'
import {supabase} from '../../src/lib/supabase'
import * as C from '../../src/escalacao/co2'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {ligaCampo2D} from '../../src/escalacao/campo2d-modo'
import {minhaGaveta} from '../../src/escalacao/carreira-online-v2'
import '../../src/index.css'
const W=window as any,q=new URLSearchParams(location.search),actor=Number(q.get('actor')??0),room='00000000-0000-4000-8000-000000000001',uids=['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'],uid=uids[actor]
_bancadaApoio(`teste-${actor}@example.invalid`,'ouro')
const request=async(body:any)=>{const r=await fetch('/__co2_db',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,uid})});return r.json()}
let seed=(await request({kind:'seed'})).data
if(!seed){seed=carreiraTradicionalBancada('Dono FC');seed=reservasBancada(seed);seed=reservasBancada({...seed,youIdx:1});seed={...seed,managers:seed.managers.map((m:any)=>({...m,squad:m.squad.map((c:any)=>c.id.startsWith('qa-trad-')?{...c,id:c.id+'-m'+m.id}:c)}))};await request({kind:'seed',seed})}
seed={...seed,youIdx:actor,seed:20261127,round:0,screen:'season',managers:seed.managers.map(m=>m.id===0?{...m,teamName:'Dono FC'}:m.id===1?{...m,isHuman:true,teamName:'Amigo FC'}:m),co2:{sala:room,assento:actor,comanda:actor===0,gavetas:[]},motor2Desde:undefined,careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true,'guia-lendas':true,condicao:true},tvBannerSeen:['A','B','C','D'],tvExtraVisto:true}
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
const sb=supabase as any
sb.auth.getUser=async()=>({data:{user:{id:uid}}})
sb.rpc=(name:string,args:any={})=>request({kind:'rpc',name,args})
sb.from=(table:string)=>{let cols='';const get=()=>request({kind:'read',table,cols});return{select(c:string){cols=c;return this},eq(){return this},maybeSingle:get,order:get}}
sb.channel=()=>{const bc=new BroadcastChannel('co2-partida-qa'),listeners:any[]=[];bc.onmessage=e=>listeners.filter(l=>l.event===e.data.event).forEach(l=>l.fn({payload:e.data.payload}));return{on(type:string,filter:any,fn:any){if(type==='broadcast')listeners.push({...filter,fn});return this},subscribe(fn:any){setTimeout(()=>fn('SUBSCRIBED'),0);return this},unsubscribe(){bc.close()},send(m:any){bc.postMessage(m);return Promise.resolve('ok')},track(){},presenceState(){return{[uids[0]]:[{}],[uids[1]]:[{}]}}}}
await C.co2Abrir(room)
const entradas={tactics:{},lineups:{},halftime:{},penalty:{},mods:{},cardMods:{}}
await C.co2Gaveta(minhaGaveta(seed.managers[actor],entradas) as any)
W.qaSync=async()=>{await C.co2RecarregaSala();await C.co2RecarregaJogos();C.co2Envia('sala');C.co2Envia('jogo')}
W.qaRpc=sb.rpc
function App(){
 const[state,dispatch]=useReducer(reducer,seed);W.qaState=state;W.qaDispatch=dispatch;W.qaCo2=C.co2Agora()
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
ligaCampo2D(actor===0)
createRoot(document.getElementById('root')!).render(<App/>)
