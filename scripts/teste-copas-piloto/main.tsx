import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import '../../src/index.css'
import {EscCtxBancada,reducer} from '../../src/escalacao/store'
import {Shell,ChatWidget} from '../../src/escalacao/screens'
import {CopaDaSala,montaFicha,entrantesDaFicha,paisesDaEuro} from '../../src/escalacao/copa-mundo-online'
import {countryPool,bestXI,simulaCopaMundo,CMModal} from '../../src/escalacao/copa-mundo'
import {CopaRegionalTorneio,montaFichaRegional,entrantesRegionais} from '../../src/escalacao/copa-regional-online'
import {LibertaSalaTorneio} from '../../src/escalacao/liberta-sala-online'
import {montaFichaLiberta,entrantesLiberta,simulaLibertaSala} from '../../src/escalacao/liberta-sala'
import {simulaRegional,poolDoClube,completaXIClube} from '../../src/escalacao/copa-regional'
import {footballTestState} from '../football-test-state'
const q=new URLSearchParams(location.search),kind=q.get('kind')??'world',main=q.has('public')?'00000000-0000-4000-8000-000000000101':'6b5cf422-d4ad-4c69-a7e6-da1125c85844',guest='eb02f1d6-de80-4304-ab49-512342f3c7b7',uid=q.get('guest')==='1'?guest:main
const people=[main,guest],countries=kind==='euro'?['França','Inglaterra']:['Brasil','Argentina']
const picks=people.map((id,i)=>{const pais=countries[i],xi=bestXI(countryPool(pais),'4-3-3');return{uid:id,nome:i?'Futpoint FC':'Neymarzetti',pick:{pais,form:'4-3-3' as const,xiKeys:xi.map(c=>`${c.name}|${c.club}|${c.year}`)}}})
let seed=20261123
const worldFicha=(n:number)=>{const f=montaFicha(picks,n,1);return kind==='euro'?{...f,tatica:true,euro:24 as const,times:[...f.times.filter(t=>t.uid),...paisesDaEuro().filter(p=>!countries.includes(p)).map(p=>({pais:p,nome:p}))].slice(0,24)}:kind==='america'?{...f,tatica:true,euro:16 as const,times:f.times.slice(0,16)}:{...f,tatica:true}}
if(q.has('pen'))for(let attempt=0;attempt<300;attempt++,seed++){const f=worldFicha(seed),ents=entrantesDaFicha(f,uid);if(simulaCopaMundo(ents,seed,1,f.potes,f.forte).final.pen)break}
const fixture=worldFicha(seed)
if(q.has('rival')){
 for(const t of fixture.times)if(t.uid===guest){delete t.uid;t.nome=t.pais;delete t.xiKeys}
 const opponent=fixture.times.find(t=>t.pais==='Polônia')!
 opponent.uid=guest;opponent.nome='Futpoint FC';opponent.xiKeys=bestXI(countryPool('Polônia'),'4-3-3').map(c=>`${c.name}|${c.club}|${c.year}`)
}
const places=people.map((id,i)=>({id:i,nome:i?'Futpoint FC':'Neymarzetti',humano:true})),uids=new Map([[0,main],[1,guest]])
const regionalPicks=new Map(people.map((id,i)=>{const pais=i?'Palmeiras':'Flamengo',xi=completaXIClube(pais,'4-3-3',[]);return[id,{pais,form:'4-3-3' as const,xiKeys:xi.map(c=>`${c.name}|${c.club}|${c.year}`)}]}))
const regional={...montaFichaRegional('riosp',places,uids,regionalPicks,seed,1),tatica:true}
const liberta=montaFichaLiberta(places,uids,regionalPicks,seed,1)
const ents=kind==='regional'?entrantesRegionais(regional,uid):kind==='liberta'?entrantesLiberta(liberta,uid):entrantesDaFicha(fixture,uid)
const world=kind==='regional'?simulaRegional(ents,seed):kind==='liberta'?simulaLibertaSala(ents,seed):simulaCopaMundo(ents,seed,1,fixture.potes,fixture.forte)
;(window as any).qaCupFixture={kind,seed,fixture:kind==='regional'?regional:kind==='liberta'?liberta:fixture,world,entrants:ents}
function App(){
 const [state,setState]=useState(()=>({...footballTestState(),screen:'end' as const,campo2d:q.has('field'),isHost:q.has('host'),youIdx:uid===main?0:1,youUid:uid}))
 const [chatOpen,setChatOpen]=useState(false),[chat,setChat]=useState<any[]>([]),dispatch=(a:any)=>setState(s=>reducer(s,a)),noop=()=>{}
 const ctx={state,dispatch,emote:noop,addEmote:noop,emotes:[],chat,chatUnread:0,sendChat:(text:string)=>setChat(rows=>[...rows,{id:String(rows.length),name:uid===main?'Neymarzetti':'Futpoint FC',text,at:Date.now(),playerIndex:state.youIdx}]),chatOpen,setChatOpen,hostStale:false,kickPlayer:noop,leaveRoom:noop,becameHost:false,hostOutroAparelho:false}
 return <EscCtxBancada.Provider value={ctx as never}><Shell><p>Bancada sem sala real</p>{kind==='regional'?<CMModal wide cinematic onlineBroadcast><CopaRegionalTorneio copa="riosp" ficha={regional} roomId={state.roomId!} meuUid={uid} souDono={q.has('host')} aoCampeao={noop} aoFechar={noop}/></CMModal>:kind==='liberta'?<CMModal wide cinematic onlineBroadcast><LibertaSalaTorneio ficha={liberta} roomId={state.roomId!} meuUid={uid} souDono={q.has('host')} aoCampeao={noop} aoFechar={noop}/></CMModal>:<CopaDaSala ficha={fixture} roomId={state.roomId!} meuUid={uid} souDono={q.has('host')} aoFechar={noop}/>}</Shell><ChatWidget/></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/> )
