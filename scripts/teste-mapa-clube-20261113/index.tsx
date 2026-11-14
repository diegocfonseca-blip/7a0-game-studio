import React,{useReducer,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {supabase} from '../../src/lib/supabase'
import {INITIAL,reducer,sanitize,EscCtxBancada} from '../../src/escalacao/store'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {ClubeMapaPainel} from '../../src/escalacao/clube-mapa-painel'
import {MuseuClube} from '../../src/escalacao/museu-clube-ui'
import {ResidenciaClube} from '../../src/escalacao/residencia-clube'
import {usePresidentPreview,presidentPreviewEnabled} from '../../src/escalacao/presidente-acesso'
import {PRESIDENCIA_CATALOGO} from '../../src/escalacao/presidencia-economia'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import * as domain from '../../src/escalacao/museu-clube'
import * as wallet from '../../src/escalacao/presidencia-carreira'
import * as labels from '../../src/escalacao/mapa-clube-layout'
import {criarMobiliaComplexo} from '../../src/escalacao/presidencia-complexo-mobilia'
import {complexoDoEstadio} from '../../src/escalacao/presidencia-complexo-model'
import {LOTE_MUSEU_CLUBE,interfereLoteMuseu} from '../../src/escalacao/museu-clube-predio'
import {conquistasDaCarreira} from '../../src/escalacao/presidencia-conquistas'
import {PyramidSeasonScreen} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import '../../src/index.css'
const W=window as any,query=new URLSearchParams(location.search),other=query.has('other'),mode=query.get('mode')??'mapa',email=other?'outra-conta@example.test':'diego.c.fonseca@gmail.com'
// Local identity stub, no real session or credentials; external requests are blocked by Playwright.
const user={id:'11111111-1111-4111-8111-111111111111',email,user_metadata:{display_name:'Clube de teste'}}
Object.assign(supabase.auth,{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:(cb:any)=>{queueMicrotask(()=>cb('INITIAL_SESSION',{user}));return{data:{subscription:{unsubscribe(){}}}}}})
const result={data:[],error:null};supabase.rpc=(()=>({then:(ok:any,bad:any)=>Promise.resolve(result).then(ok,bad),abortSignal(){return this}})) as any
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(e=>e.k)}
const cars=PRESIDENCIA_CATALOGO.filter(i=>i.slot==='carro').slice(0,2).map(i=>({id:i.id,paid:i.price}))
const seed:any={...INITIAL,careerOnline:true,onlineMode:'cpu',sport:'futebol',seasonNo:5,youIdx:0,screen:'pyramidSeason',round:0,
 managers:[{id:0,name:'Técnico local',teamName:'Clube de teste',isHuman:true,mine:true,squad:[],formation:'4-3-3',budget:100}],careerCoins:{0:200},stadiums:{0:full},
 careerHonors:{m0:{A:1,B:2,C:1,D:1,V:1}},careerCopaHonors:{m0:1},careerSupercopaHonors:{m0:1},careerCronica:{m0:[{t:1,div:'V',campeao:1},{t:2,div:'D',campeao:1},{t:3,div:'C',campeao:1}]},
 careerPresidency:{0:{revision:1,owned:[{id:'sofa',paid:100},{id:'planta',paid:20},...cars],homeFurniture:['sofa','planta']}}}
W.mapModules={reducer,INITIAL,sanitize,...domain,...wallet,...labels,LOTE_MUSEU_CLUBE,interfereLoteMuseu,conquistasDaCarreira,criarMobiliaComplexo,complexoDoEstadio,STADIUM_EXTRAS,presidentPreviewEnabled}
function App(){
 const allowed=usePresidentPreview(),[state,dispatch]=useReducer(reducer,W.__mapSeed??seed),[active,A]=useState<any>(null),[stage,S]=useState(Number(query.get('museumStage')??0)),[empty,E]=useState(false)
 W.mapState=state;W.mapDispatch=dispatch;W.mapSetStage=S;W.mapEmpty=E;W.mapAllowed=allowed;W.mapSetPanel=A
 if(mode==='carreira'){
  const noop=()=>{},ctx:any={state,dispatch,emote:noop,addEmote:noop,emotes:[],chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
  return <EscCtxBancada.Provider value={ctx}><PyramidSeasonScreen/></EscCtxBancada.Provider>
 }
 const home=<ResidenciaClube state={state} mgrId={0} onBack={()=>A(null)} onVadico={()=>A('veiculos')} onFurnitureHome={ids=>{dispatch({type:'PRESIDENCY_FURNITURE_HOME',mgrId:0,ids});return true}}/>
 if(mode==='home')return home
 if(mode==='museum')return <main style={{maxWidth:1100,margin:'auto',padding:12}}><MuseuClube state={state} mgrId={0} onInvest={expectedStage=>dispatch({type:'MUSEU_INVEST',mgrId:0,expectedStage})} onStore={()=>A('estrutura')}/></main>
 return <div style={{padding:8,background:'#0a100d'}}><Complexo cidadeViva={query.has('hour')?{canteiros:[],humor:'normal',carreata:false,dia:Date.UTC(2027,1,Number(query.get('day')??8)),hora:Number(query.get('hour'))}:undefined} museumStage={state.careerMuseums?.[0]?.etapas??stage} clubName="Clube de teste" stadium={empty?{inv:{},ext:[]}:full} presidency={wallet.carteiraDaCarreira(state,0)} onOpenClub={target=>{W.mapDestination=target;A(target)}} onReady={api=>W.mapApi=api}/><ClubeMapaPainel enabled active={active} club="Clube de teste" agency onSelect={A} onClose={()=>A(null)}>{active==='museu'?<MuseuClube state={state} mgrId={0} onInvest={expectedStage=>dispatch({type:'MUSEU_INVEST',mgrId:0,expectedStage})} onStore={()=>A(null)}/>:active==='presidencia'?home:<p>{active==='financas'?'Finanças do clube':active==='patrocinio'?'Patrocínios e contratos':'Destino local de teste'}</p>}</ClubeMapaPainel></div>
}
_bancadaApoio(email,'ouro')
createRoot(document.getElementById('root')!).render(<App/>);
