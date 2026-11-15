import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
// Bancada sem conta, banco ou alterações de saves reais.
const W=window as any,initial:StadiumSave={inv:{},ext:[]},full:StadiumSave={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']}
function App(){
 const [stadium,S]=useState(initial);W.navStadium=stadium;W.navSetStadium=S;W.navInitial=initial;W.navFull=full
 return <Complexo stadium={stadium} clubName="Clube de teste" onOpenClub={target=>{W.navDestination=target}} museumStage={0} qaPopulation circulation cidadeViva={{canteiros:[],humor:'normal',carreata:false,dia:Date.UTC(2027,1,7),hora:14}} journey={{ordinal:2,key:'navegacao-local',phase:'idle',hosting:false,period:'day'} as any} onReady={api=>{W.navApi=api}}/>
}
createRoot(document.getElementById('root')!).render(<App/>);
