import React,{useReducer,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer,INITIAL} from '../../src/escalacao/store'
import {EscSetup,EscStreamIntro,GameFooter} from '../../src/escalacao/screens'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {PresidenteFormulario} from '../../src/escalacao/presidente-formulario'
import {CriarClubePresidencia} from '../../src/escalacao/presidencia-criar-clube'
import {CareerSetupFrame} from '../../src/escalacao/career-setup-guide'
import {aparenciaInicial,escolherPeca} from '../../src/escalacao/presidente-aparencia'
import {ROUPA_GRATIS} from '../../src/escalacao/presidente-avulsas'
import type {PresidenteBaseSave} from '../../src/escalacao/presidencia-carreira'
import type {FormationKey} from '../../src/escalacao/types'
import '../../src/index.css'
const params=new URLSearchParams(location.search),stage=params.get('stage')
if(params.get('paid')==='1')_bancadaApoio('qa-carreira-local@example.test','prata')
function App(){
 const [state,dispatch]=useReducer(reducer,undefined,()=>reducer(structuredClone(INITIAL),{type:'GO_SETUP_CAREER'}))
 const [visual,setVisual]=useState<PresidenteBaseSave>({version:5,name:'Novato',outfit:ROUPA_GRATIS,appearance:escolherPeca(escolherPeca(aparenciaInicial(),'hair','none')!,'beard','none')!})
 const [name,setName]=useState('Neymarzetti'),[formation,setFormation]=useState<FormationKey>('4-3-3')
 const W=window as any;W.auditState=state;W.auditVisual=visual
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}>{stage==='editor'?<PresidenteFormulario editing value={visual} onChange={setVisual} onConfirm={noop} onBack={noop}/>:stage==='club-owned'?<div className="palco cse-shell"><CareerSetupFrame step={1} club={name} onBack={noop}><CriarClubePresidencia name={name} accountName="Neymarzetti" onName={setName} formation={formation} onFormation={setFormation} identity={{name,crest:'Neymarzetti',shirt:'Neymarzetti',mascot:null,color:'#FFC400'}} onContinue={noop}/></CareerSetupFrame></div>:state.screen==='setup'?<EscSetup/>:state.screen==='streamIntro'?<EscStreamIntro/>:<div>{state.screen}</div>}<GameFooter/></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/>)
