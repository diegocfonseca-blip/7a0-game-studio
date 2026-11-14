import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from '../../src/escalacao/estadiodata'
import type {PresidenciaCarteira} from '../../src/escalacao/presidencia-economia'
import '../../src/index.css'
// Amostras locais: não autentica contas, não acessa salas e não grava saves.
const W=window as any
const complete:StadiumSave={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
function App(){
 const [save,S]=useState(complete),[museum,M]=useState(4),[night,N]=useState(false),[wallet,P]=useState<PresidenciaCarteira|undefined>(new URLSearchParams(location.search).has('cars')?{cash:80,revision:1,owned:[{id:'fusca',paid:30},{id:'chevette',paid:40}]}:undefined)
 W.urbanCurrentWallet=wallet;W.urbanCurrentSave=save;W.urbanWallet=P;W.urbanSave=S;W.urbanMuseum=M;W.urbanNight=N;W.urbanFull=complete
 return <Complexo presidency={wallet} stadium={save} clubName="Clube de teste" onOpenClub={()=>{}} museumStage={museum} circulation qaPopulation journey={{ordinal:2,phase:'arrival',period:night?'night':'day',weekday:'domingo',kickoffTime:'16h'} as any} cidadeViva={{canteiros:[],humor:'normal',carreata:false,dia:Date.UTC(2027,1,8),hora:night?21:14}} onReady={api=>{W.urbanApi=api}}/>
}
createRoot(document.getElementById('root')!).render(<App/>);
