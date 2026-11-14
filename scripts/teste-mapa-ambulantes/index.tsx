import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import * as T from 'three'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
const W=window as any,stadium={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
const probe=T.PMREMGenerator.prototype.fromScene
T.PMREMGenerator.prototype.fromScene=function(scene,...args){const r=(this as any)._renderer,render=r.render;r.render=function(s,...a){if(s.children.some(n=>n.name==='complexo-entorno'))W.scene=s;return render.call(this,s,...a)};return probe.call(this,scene,...args)}
function App(){const [phase,setPhase]=useState('idle');W.setPhase=setPhase;return <Complexo stadium={stadium} onOpenClub={()=>{}} qaPopulation circulation clubName="Bancada local" journey={{key:'ambulantes-local',fixtureId:'teste',hosting:phase!=='idle',phase,period:'day'} as any} arrivalTeams={{fixtureId:'teste',teams:[{name:'Casa',color:'#1b7a3d',players:[]},{name:'Fora',color:'#c2452f',players:[]}]}} onReady={api=>{W.api=api}}/>}
createRoot(document.getElementById('root')!).render(<App/>);
