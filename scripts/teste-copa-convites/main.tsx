import '../../src/App' // same module initialization order as the game
import {EscCtxBancada,INITIAL} from '../../src/escalacao/store'
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {CopaMundoGate,bestXISemRepetir,countryPool,congela,type CopaSave} from '../../src/escalacao/copa-mundo'
import {rankingSelecoes} from '../../src/escalacao/paises'
import '../../src/index.css'
const q=new URLSearchParams(location.search),mode=q.get('mode')??'tradicional',season=Number(q.get('season')??1),pos=Number(q.get('pos')??4),seed=26511000+season+(mode==='oficial'?10000:0),W=window as any
const paises=rankingSelecoes().slice(0,32).map(x=>x.pais),top16=paises.map((_,i)=>({name:i===pos?'Futpoint FC':`Clube ${i+1}`,you:i===pos}))
const xi=bestXISemRepetir(countryPool(paises[Math.max(0,pos)]),'4-3-3')
if(q.has('legacy')&&!sessionStorage.getItem('qa-copa-initialized'))localStorage.setItem('llcopa:'+seed,JSON.stringify({anchor:100,ciclo:10,played:[100,110],mural:[{season:100,selecao:'Brasil',campeao:'Brasil',voce:true}]}))
if(q.has('resume')&&!sessionStorage.getItem('qa-copa-initialized')){
 const ents=paises.map((pais,i)=>{const xi=bestXISemRepetir(countryPool(pais),'4-3-3');return congela({club:i===pos?'Futpoint FC':`Clube ${i+1}`,pais,you:i===pos,xi,str:75,form:'4-3-3'})})
 const progress:CopaSave['emAndamento']={season,pais:paises[Math.max(0,pos)],xiKeys:xi.map(c=>`${c.name}|${c.club}|${c.year}`),form:'4-3-3',passo:3,ents,n:32,potes:true,forte:true}
 localStorage.setItem('llcopa:'+seed,JSON.stringify({anchor:100,ciclo:10,played:[100],mural:[],emAndamento:progress}))
 W.qaOriginalStamp=JSON.parse(localStorage.getItem('llcopa:'+seed)!).emAndamento
}
sessionStorage.setItem('qa-copa-initialized','1')
W.qaWorld={seed,paises,mode,season,pos,prizes:0,stats:[],mural:[]}
const m={id:0,name:'Você',teamName:'Futpoint FC',isHuman:true,money:100,squad:xi.map((c,i)=>({...c,pos:c.sec,id:'qa-'+i,paid:0,via:'bot'})),formation:'4-3-3',aggression:.5,starHunger:.5},state={...INITIAL,seed,seasonNo:season,careerOnline:true,onlineMode:'cpu',youIdx:0,managers:[m]},noop=()=>{},ctx:any={state,dispatch:noop,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
function App(){const [stats,setStats]=useState(0);return <EscCtxBancada.Provider value={ctx}><main style={{maxWidth:760,margin:'24px auto',padding:16}}><h1 style={{fontFamily:'Oswald',color:'#f4ecd6'}}>COPA DO MUNDO</h1><CopaMundoGate anchor={1} ciclo={4} convite={mode==='oficial'} seasonNo={season} seed={seed} top16={top16} myPos={pos} onPrize={n=>W.qaWorld.prizes+=n} onStats={s=>{W.qaWorld.stats.push(s);setStats(n=>n+1)}} onMural={s=>W.qaWorld.mural=s}/><small style={{color:'#f4ecd6'}}>Bancada local · {mode} · T{season} · {stats} decisões</small></main></EscCtxBancada.Provider>}
createRoot(document.getElementById('root')!).render(<App/>);
