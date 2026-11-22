// Bancada local: componentes reais, sem sala, rede ou gravação no Supabase.
import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OwnerOnlineProvider,OwnerOnlineHeader,OwnerPrimary,OwnerSlot,OwnerPlayback,OwnerTactics,OwnerMatchNavigation} from '../../src/escalacao/owner-online-visual'
import {OnlineScorePresentation} from '../../src/escalacao/online-match-visual'
import {Campo2D} from '../../src/escalacao/campo2d'
import {MASCOTES} from '../../src/escalacao/mascotes'
import logo from '../../src/escalacao/img/logo-ll.webp'
import futpoint from '../../src/escalacao/img/futpoint-mascote.webp'
import type {EscState} from '../../src/escalacao/types'
import type {Tactic} from '../../src/escalacao/types'

declare global {interface Window{qa:{mounts:number;selectChanges:number;next:number;skip:number};qaAccount:(email:string)=>void}}
window.qa={mounts:0,selectChanges:0,next:0,skip:0}
function NativeMatch({field,goal}:{field:boolean;goal:boolean}){
 useEffect(()=>{window.qa.mounts++},[])
 return <div data-native-match>
  {field&&<Campo2D roundKey={42} casa={{nome:'Neymarzetti',cor:'#ffc400',mascote:MASCOTES.futpoint_bola,escudo:<img src={logo} alt="Neymarzetti"/>}} fora={{nome:'Futpoint FC',cor:'#c2452f',mascote:MASCOTES.futpoint_bola,escudo:<img src={futpoint} alt="Futpoint"/>}} gols={[]} roundMs={90000} minuto={30} semNarra pausado/>}
  {!field&&<OnlineScorePresentation homeName="Neymarzetti" awayName="Futpoint FC" homeCrest={<img src={logo} alt="Neymarzetti"/>} awayCrest={<img src={futpoint} alt="Futpoint"/>} homeColor="#ffc400" awayColor="#c2452f" youIsHome homeOwner="VOCÊ · 4-3-3" awayOwner="FUTPOINT · 4-3-3" clock="68′" homeScore={goal?2:1} awayScore={1} goals={[{name:'Ronaldo',min:27,home:true},{name:'Romário',min:41,home:false}]} goalSide={goal?'a':null} mascot={MASCOTES.futpoint_bola} stamp="GOOOL!" narration="Ronaldo recebe pelo meio" eventKey={goal?1:0} enhanced palcoOn radio={{min:'68',txt:'Kaká recebe pelo meio. O jogo está aberto.',tipo:'lance'}} narracaoNoRadio/>}
 </div>
}
function App(){
 const q=new URLSearchParams(location.search),[host]=useState(!q.has('guest')),[field,setField]=useState(q.has('field'))
 const [mode,setMode]=useState('placar'),[manual,setManual]=useState(true),[speed,setSpeed]=useState(2.5),[canNext,setCanNext]=useState(false)
 const [tactic,setTactic]=useState<Tactic>('equilibrio'),[tab,setTab]=useState<'jogos'|'tabela'|'estatisticas'|'elenco'>('jogos'),[goal,setGoal]=useState(false)
 const [sport,setSport]=useState('futebol'),[career,setCareer]=useState(false),[busy,setBusy]=useState(false),[viewDisabled,setViewDisabled]=useState(false)
 const state={managers:[{name:'Neymarzetti'},{name:'Futpoint FC'}],youIdx:0,onlineMode:'online',screen:'season',sport,careerIntent:career,isHost:host} as unknown as EscState
 return <OwnerOnlineProvider enabled state={state}><div className="ov3" style={{minHeight:'100vh',paddingBottom:24}}>
  <OwnerOnlineHeader name={host?'Neymarzetti':'Futpoint'} club={host?'Neymarzetti':'Futpoint FC'} onHome={()=>{}} onRooms={()=>{}} online/>
  <main className="ll-shell-content"><header className="ll26-competition"><p style={{font:'700 11px Arial',color:'#ffc400'}}>SALA DOS AMIGOS · RODADA 4</p><h1>AGORA É NO CAMPO.</h1></header>
   <OwnerPrimary field={field} label="PARTIDA EM DESTAQUE"><NativeMatch field={field} goal={goal}/></OwnerPrimary>
   {host&&<OwnerSlot name="view"><label><select aria-label="Visualização" value={mode} disabled={viewDisabled} onChange={e=>{window.qa.selectChanges++;setMode(e.target.value)}}><option value="placar">Placar</option><option value="campo">Campo 2D</option></select>{mode==='campo'&&<small>Marcado para o próximo jogo</small>}</label></OwnerSlot>}
   <OwnerMatchNavigation value={tab} onChange={setTab}/>
   <OwnerTactics value={tactic} onChange={setTactic} disabled={busy}/>
   {host&&<OwnerPlayback manual={manual} onToggle={()=>setManual(v=>!v)} speed={speed} onSpeed={setSpeed} opts={[1,1.5,2,2.5,3,3.5,4].map(v=>({v,pt:`${v}×`,en:`${v}×`}))} canNext={canNext} onNext={()=>window.qa.next++} onSkip={()=>window.qa.skip++} busy={busy} allowAutoSpeed/>}
   <section className="ll31-table" style={{padding:14,marginTop:24}}><h2 style={{fontFamily:'Oswald'}}>CLASSIFICAÇÃO</h2><table style={{width:'100%'}}><thead><tr><th>CLUBE</th><th>PTS</th><th>J</th><th>SG</th></tr></thead><tbody><tr className="ll31-my-team"><td>Neymarzetti</td><td>7</td><td>4</td><td>+3</td></tr><tr><td>Futpoint FC</td><td>7</td><td>4</td><td>+2</td></tr></tbody></table></section>
   <output data-qa-state>{JSON.stringify({manual,speed,mode,tactic,tab,field})}</output>
   <aside data-qa-tools style={{marginTop:30,display:'flex',gap:8,flexWrap:'wrap',background:'#eee',padding:10,color:'#000'}}><button onClick={()=>setField(v=>!v)}>QA campo</button><button onClick={()=>setGoal(v=>!v)}>QA gol</button><button onClick={()=>setCanNext(v=>!v)}>QA apito</button><button onClick={()=>setSport(v=>v==='basquete'?'futebol':'basquete')}>QA esporte</button><button onClick={()=>setCareer(v=>!v)}>QA carreira</button><button onClick={()=>setBusy(v=>!v)}>QA ocupado</button><button onClick={()=>setViewDisabled(v=>!v)}>QA bloquear visual</button></aside>
  </main>
 </div></OwnerOnlineProvider>
}
createRoot(document.getElementById('root')!).render(<App/> )
