// The production screen and reducer, in an isolated provider. Never joins a real room.
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import '../../src/index.css'
import {EscCtxBancada,reducer} from '../../src/escalacao/store'
import {EscSeason,EscLiberta,EscChampions,ChatWidget} from '../../src/escalacao/screens'
import {footballTestState} from '../football-test-state'
const noop=()=>{}
declare global{interface Window{qaFull:{state:unknown;sent:string[];dispatch:(a:unknown)=>void};qaAccount:(email:string)=>void}}
function App(){
 const [state,setState]=useState(()=>{const q=new URLSearchParams(location.search);return footballTestState(q.get('competition')??'league',q.has('field'))}),[chatOpen,setChatOpen]=useState(false),[chat,setChat]=useState<any[]>([])
 const dispatch=(a:any)=>setState(s=>reducer(s,a))
 window.qaFull={state,sent:chat.map(x=>x.text),dispatch}
 const value={state,dispatch,emote:noop,addEmote:noop,emotes:[],chat,chatUnread:0,sendChat:(text:string)=>setChat(rows=>[...rows,{id:String(rows.length),name:'Neymarzetti',text,at:Date.now(),playerIndex:0}]),chatOpen,setChatOpen,hostStale:false,kickPlayer:noop,leaveRoom:noop,becameHost:false,hostOutroAparelho:false}
 return <EscCtxBancada.Provider value={value as never}>{state.screen==='liberta'?<EscLiberta/>:state.screen==='champions'?<EscChampions/>:<EscSeason/>}<ChatWidget/></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/> )
