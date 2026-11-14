import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import {setSoundAllowed,setMuted} from '../../src/escalacao/sound'
import '../../src/index.css'
// Somente amostras locais. Sem autenticação, leilão, pedidos ou gravação de save.
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(e=>e.k)},wallet={cash:80,revision:1,owned:[{id:'fusca' as const,paid:30}]},W=window as any
setSoundAllowed(true);setMuted(true)
function App(){
 const[c,S]=useState({dia:Date.UTC(2027,1,7),hora:14,parking:true,hosting:false})
 W.bairroContext=c;W.setBairroContext=(value:any)=>S(v=>({...v,...value}));W.bairroWallet=wallet;W.bairroFull=full
 const night=c.hora>=18,stadium=c.parking?full:{...full,ext:full.ext.filter(k=>k!=='estac'),estacionamentoInvestido:0}
 return <Complexo stadium={stadium} presidency={wallet} clubName="Clube de teste" onOpenClub={()=>{}} museumStage={4} qaPopulation circulation cidadeViva={{canteiros:[],humor:'normal',carreata:false,dia:c.dia,hora:c.hora}} journey={{ordinal:2,key:'bairro-local',phase:c.hosting?'arrival':'idle',hosting:c.hosting,period:night?'night':'day',kickoffTime:String(c.hora).padStart(2,'0')+':00'} as any} onReady={api=>{W.bairroApi=api}}/>
}
createRoot(document.getElementById('root')!).render(<App/>);
