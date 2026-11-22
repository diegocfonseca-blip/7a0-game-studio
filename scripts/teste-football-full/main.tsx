// The production screen and reducer, in an isolated provider. Never joins a real room.
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import '../../src/index.css'
import {EscCtxBancada,reducer} from '../../src/escalacao/store'
import {EscSeason,EscLiberta,EscChampions,ChatWidget,Shell,GiroDaRodada} from '../../src/escalacao/screens'
import {LiveScoreCard} from '../../src/escalacao/pyramidseason'
import {CMModal} from '../../src/escalacao/copa-mundo'
import {footballTestState} from '../football-test-state'
const noop=()=>{}
function PostLeagueBroadcastFixture(){
 const {state}=React.useContext(EscCtxBancada)!
 const kind=new URLSearchParams(location.search).get('competition')??''
 const you=state.managers[state.youIdx],game=state.lastResults.find(r=>r.homeId===you.id||r.awayId===you.id)!,other=state.lastResults.find(r=>r!==game)!
 const score=(r:typeof game,neutral=false)=>{const home=state.managers.find(m=>m.id===r.homeId)!,away=state.managers.find(m=>m.id===r.awayId)!;return <LiveScoreCard homeName={home.teamName} awayName={away.teamName} homeColor="#1B7A3D" awayColor="#C2452F" youIsHome={home.id===you.id} neutro={neutral} goals={(r.presentationGoals??r.highlights).filter(g=>g.kind==='gol').map(g=>({name:g.text,min:g.min,home:g.teamId===home.id}))} roundKey={state.round} roundMs={25000} inicioEm={state.rodadaEm?.at} enhancedOnline elencos={{casa:home.squad,fora:away.squad,fCasa:home.formation,fFora:away.formation}}/>}
 const content=<><h1>{kind}</h1><GiroDaRodada cinema/>{score(game)}<p>Controles e tabela da competição</p>{score(other,true)}<GiroDaRodada cinema/></>
 return <Shell>{kind==='post-world'?<CMModal onlineBroadcast cinematic wide>{content}</CMModal>:content}</Shell>
}
declare global{interface Window{qaFull:{state:unknown;sent:string[];dispatch:(a:unknown)=>void};qaAccount:(email:string)=>void}}
function App(){
 const [state,setState]=useState(()=>{const q=new URLSearchParams(location.search),s=footballTestState(q.get('competition')??'league',q.has('field'));if(q.get('competition')?.startsWith('post-'))s.screen='end';return q.get('guest')==='futpoint'?{...s,isHost:false,youIdx:1,youUid:s.seatUids![1],seatUids:s.seatUids!.map((uid,index)=>index===2?'b068eff2-098f-4370-87de-3f90dd7b12f6':index===3?'qa-friend-3':uid)}:s}),[chatOpen,setChatOpen]=useState(false),[chat,setChat]=useState<any[]>([])
 const dispatch=(a:any)=>setState(s=>reducer(s,a))
 window.qaFull={state,sent:chat.map(x=>x.text),dispatch}
 const value={state,dispatch,emote:noop,addEmote:noop,emotes:[],chat,chatUnread:0,sendChat:(text:string)=>setChat(rows=>[...rows,{id:String(rows.length),name:'Neymarzetti',text,at:Date.now(),playerIndex:0}]),chatOpen,setChatOpen,hostStale:false,kickPlayer:noop,leaveRoom:noop,becameHost:false,hostOutroAparelho:false}
 return <EscCtxBancada.Provider value={value as never}>{state.screen==='end'?<PostLeagueBroadcastFixture/>:state.screen==='liberta'?<EscLiberta/>:state.screen==='champions'?<EscChampions/>:<EscSeason/>}<ChatWidget/></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/> )
