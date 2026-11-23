import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from '../../src/escalacao/estadiodata'
import type {JornadaComplexo} from '../../src/escalacao/presidencia-complexo-jornada'
import '../../src/index.css'
const W=window as any,full:StadiumSave={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
const base:JornadaComplexo={key:'compacto-local',variantSeed:42,fixtureId:'compacto-fixture',ordinal:2,weekday:'domingo',kickoffTime:'16:00',period:'day',calendarKnown:true,hosting:true,phase:'arrival'}
function App(){const[save,S]=useState<StadiumSave>(full),[journey,J]=useState(base),[show,Q]=useState(true),[match,M]=useState(W.qaTestMatch);W.compactSave=S;W.compactFull=full;W.compactJourney=J;W.compactBase=base;W.compactShow=Q;W.compactMatch=M;return show?<Complexo stadium={save} cityStadium={save} match={match} focusSession={!!match} clubName="Clube da bancada" onOpenClub={d=>{W.lastDestination=d}} museumStage={4} presidency={{cash:80,revision:1,owned:[{id:'fusca',paid:30},{id:'chevette',paid:40}]}} circulation day={{division:'A',support:90,pos:1}} awayStadium={full} awayDay={{division:'C',support:55}} journey={journey} arrivalTeams={{fixtureId:base.fixtureId!,teams:[{name:'Clube da bancada',color:'#1b7a3d',players:[]},{name:'Visitante real',color:'#c2452f',players:[]}]}} onReady={api=>{W.compactApi=api}}/>:null}
createRoot(document.getElementById('root')!).render(<App/>);
