// Bancada local: dados fictícios, sem login/rede/save real. Renderiza a entrada de produção.
import React,{useReducer,useState}from'react'
import{createRoot}from'react-dom/client'
import{EscCtxBancada,reducer,INITIAL}from'../../src/escalacao/store'
import{PregaoAberto}from'../../src/escalacao/pregao-aberto'
import{CATALOG}from'../../src/escalacao/data'
import{OwnerOnlineProvider}from'../../src/escalacao/owner-online-visual'
import'../../src/index.css'
const w=window as any,noop=()=>{},params=new URLSearchParams(location.search),duo=params.has('duas')
const pick=(pos:string,name:string)=>({...CATALOG[pos].find(c=>c.name===name),pos,id:'qa-'+name,overall:90})
const first=pick('ATA','Neymar'),second=pick('MEI','Zico'),third=pick('ATA','Alexandre Pato')
function initial(){
 let s:any=reducer(structuredClone(INITIAL),{type:'START',teamName:'Futpoint FC',formation:'4-3-3',rivals:duo?11:3,career:false,league:'br',copaMode:'liga_copa',intro:true,pregaoAberto:true}as any)
 s=reducer(s,{type:'START_STREAM_AUCTION'}as any)
 const rivaldo={...pick('MEI','Rivaldo'),paid:10},roberto={...pick('LAT','Roberto Carlos'),paid:9}
 s.managers=s.managers.map((m:any,i:number)=>({...m,teamName:['Futpoint FC','Leão FC','Só Resenha FC'][i]??m.teamName,isHuman:true,money:i===0?68:i===1?90:i===2?91:100,squad:i===0?[{...pick('GOL','Dida'),paid:5},{...pick('LAT','Cafu'),paid:5},{...pick('ZAG','Aldair'),paid:5},{...pick('MEI','Alex'),paid:5},{...pick('ATA','Romário'),paid:12}]:i===1?[rivaldo]:i===2?[roberto]:[]}))
 const romario=s.managers[0].squad.find((c:any)=>c.name==='Romário'),prior=[[romario,0,12],[rivaldo,1,10],[roberto,2,9]].map(([c,i,price]:any)=>({cardId:c.id,nome:c.name,pos:c.pos,mgr:s.managers[i].id,time:s.managers[i].teamName,preco:price,segundo:0}))
 const owned=new Set(s.managers.flatMap((m:any)=>m.squad.map((c:any)=>c.name)))
 if(params.has('online')){s.onlineMode='online';s.isHost=params.has('host');s.youUid='qa-user';s.managers[0].uid='qa-user';s.roomId='QA-LOCAL'}
 return{...s,currentCards:[first],sector:'ATA',sectorIdx:4,pa:{...s.pa,fila:[roberto,rivaldo,romario,first,second,third,...s.pa.fila.filter((c:any)=>!owned.has(c.name)&&![first.name,second.name,third.name].includes(c.name)).slice(0,24)],idx:duo?4:3,duplo:duo,preco:0,lider:null,lances:[],deadline:Date.now()+60000,viraId:undefined,viraAte:undefined,tetos:{},vendidos:params.has('vazio')?[]:prior,sobras:[],m2:duo?{card:second,preco:0,lider:null,lances:[],deadline:Date.now()+60000,tetos:{}}:undefined}}
}

function App(){
 const[s,dispatch]=useReducer((s:any,a:any)=>a.type==='QA_REPLACE'?a.state:reducer(s,a),undefined,initial),[mounted,setMounted]=useState(true)
 w.qaState=s;w.qaReplace=(state:any)=>dispatch({type:'QA_REPLACE',state});w.qaDispatch=(a:any)=>{(w.qaActions??=[]).push(a);if(!params.has('online')||params.has('host'))dispatch(a)};w.qaMount=setMounted
 const ctx:any={state:s,dispatch:w.qaDispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><OwnerOnlineProvider enabled={!params.has('classico')} state={s}>{mounted&&<PregaoAberto/>}</OwnerOnlineProvider></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/>);
