// Bancada local. Componentes reais; dados de demonstração, sem save nem chamadas ao banco.
import {createRoot} from 'react-dom/client'
import {useEffect,useState} from 'react'
import '../../src/index.css'
import '../../src/escalacao/screens'
import {Campo2D} from '../../src/escalacao/campo2d'
import {MyCopaMatch, PensShootout, LiveScoreCard, pensRevealDelay, type CopaTie} from '../../src/escalacao/pyramidseason'
import {NationalCrest} from '../../src/escalacao/national-crest'
import {usePenaltisCampo} from '../../src/escalacao/campo2d-penaltis-react'
import {pedirSuperficieCampo2D,superficieCampo2D} from '../../src/escalacao/campo2d-superficie'
import {applyCampo2DBancada} from '../../src/escalacao/sport'
import {MapaHud} from '../../src/escalacao/presidencia-mapa-hud'
const query=new URLSearchParams(location.search),id='qa-penaltis-campo'
const pos=['GOL','LAT','ZAG','ZAG','LAT','MEI','MEI','MEI','ATA','ATA','ATA']
const a=['Hélton','Cafu','Lúcio','Aldair','Roberto Carlos','Dunga','Zico','Kaká','Hernán Barcos','Romário','Ronaldo Fenômeno'].map((name,i)=>({id:`h${i}`,name,pos:pos[i],lo:70,hi:80,fame:3,club:'Brasil',year:2002}))
const b=['Taffarel','Cicinho','Índio','Thiago Silva','Athirson','Mineiro','Léo Lima','Alex','Oséas','Dentinho','Bebeto'].map((name,i)=>({id:`a${i}`,name,pos:pos[i],lo:70,hi:80,fame:3,club:'Brasil',year:2002}))
const pens:[number,number]=[4,2],aName='Raiva Cajuri FC',bName='Neymarzetti'
const swap=query.has('volta'),home=swap?b:a,away=swap?a:b
const nomeCasa=swap?bName:aName,nomeFora=swap?aName:bName
const config={id,pens,aName,bName,aSquad:a,bSquad:b,invertido:swap}
const gols=[{name:home[8].name,min:28,home:true},{name:away[8].name,min:87,home:false}]
const A={teamId:0,name:aName,you:false,human:false,xi:a,formation:'4-3-3',squad:a}
const B={teamId:1,name:bName,you:true,human:true,xi:b,formation:'4-3-3',squad:b}
const tie={a:A,b:B,aDiv:'D',bDiv:'D',aggA:1,aggB:1,pens,win:'a',goals:gols,legs:swap?[[0,0],[1,1]]:[[1,1]],legGoals:swap?[[],gols]:[gols]} as unknown as CopaTie
// 🥅 07/11: as telas da SALA ONLINE (Copa dos 8 / Liberta / Champions / Relâmpago…) e da COPA DO MUNDO, com os MESMOS
// componentes e o MESMO tempo que a sala dá pra disputa (`pensRevealDelay`, o número que segura a fase). Dados de demonstração.
// 👑 11/11: modo 'kings' = o SHOOTOUT da Kings (7 de cada lado, sai do meio-campo e tenta driblar o goleiro)
const posK=['GOL','ZAG','ZAG','MEI','MEI','ATA','ATA']
const ka=a.slice(0,7).map((c,i)=>({...c,pos:posK[i]})),kb=b.slice(0,7).map((c,i)=>({...c,pos:posK[i]}))
function Online({mundo,kings}:{mundo:boolean;kings?:boolean}){
 const pensO:[number,number]=kings?[3,2]:mundo?[4,3]:[5,4]
 const seqO=kings?undefined:mundo?undefined:'1111101110'
 const nA=mundo?'Brasil':'Raiva Cajuri FC',nB=mundo?'Argentina':'Neymarzetti'
 const orcamento=pensRevealDelay(pensO,true,seqO)
 const cfg={id:`qa-${kings?'kings':mundo?'mundo':'sala'}`,pens:pensO,seqReal:seqO,aName:nA,bName:nB,aSquad:kings?ka:a,bSquad:kings?kb:b,orcamento:kings?undefined:orcamento,shootout:kings||undefined}
 const [fim,setFim]=useState(false)
 const {sessao,estado}=usePenaltisCampo(cfg,true,1,false,()=>setFim(true))
 useEffect(()=>{applyCampo2DBancada();(window as any).penaltisQA={session:sessao,done:()=>fim,orcamento}},[sessao,fim])
 const g=[{name:a[9].name,min:31,home:true},{name:b[10].name,min:78,home:false}]
 return <main data-concluido={String(fim)} style={{margin:'-12px'}}>
  <LiveScoreCard disputaPenaltis={sessao} estadoPenaltis={estado} enhancedOnline homeName={nA} awayName={nB} homeColor={mundo?'#F5D20A':'#C2452F'} awayColor={mundo?'#6CB4EE':'#2E62D9'} youIsHome
   homeEmblem={mundo?<NationalCrest country={nA} size={58}/>:undefined} awayEmblem={mundo?<NationalCrest country={nB} size={58}/>:undefined}
   goals={g} roundKey={1} roundMs={36000} finished elencos={kings?{casa:ka,fora:kb,fCasa:'kings',fFora:'kings'}:{casa:a,fora:b,fCasa:'4-3-3',fFora:'4-3-3'}} />
  <div style={{background:'#fff',color:'#0c0c0c',border:'3px solid #0c0c0c',borderRadius:12,padding:8,margin:'8px 0'}}>
   <p style={{fontWeight:900,fontSize:11,textAlign:'center',margin:'0 0 4px'}}>🥅 1×1 {mundo?'NO TEMPO NORMAL — DECISÃO NOS PÊNALTIS':'— DECISÃO NOS PÊNALTIS'}</p>
   <PensShootout campo={estado} compactOnline final={mundo} pens={pensO} seqReal={seqO} aName={nA} bName={nB} aSquad={a} bSquad={b} lento
    aCrest={mundo?<NationalCrest country={nA} size={20}/>:undefined} bCrest={mundo?<NationalCrest country={nB} size={20}/>:undefined}/>
  </div>
 </main>
}
function Bancada(){return query.get('modo')==='kings'?<Online mundo={false} kings/>:query.get('modo')==='sala'||query.get('modo')==='mundo'?<Online mundo={query.get('modo')==='mundo'}/>:<Carreira/>}
function Carreira(){
 const [speed,setSpeed]=useState(Number(query.get('speed')??1)),[paused,setPaused]=useState(false),[montado,setMontado]=useState(true),[done,setDone]=useState(false)
 const integrado=query.get('modo')==='carreira'
 const {sessao,estado}=usePenaltisCampo(integrado?undefined:config,true,speed,paused,()=>setDone(true))
 const leg=swap?1:0,matchId=integrado?`${id}:leg:${leg}:${swap?1:0}:${swap?0:1}`:id
 useEffect(()=>{applyCampo2DBancada();const owner={};pedirSuperficieCampo2D(matchId,owner,30);return()=>pedirSuperficieCampo2D(matchId,owner,0)},[matchId])
 useEffect(()=>{(window as any).penaltisQA={session:sessao,surface:()=>superficieCampo2D(matchId),pausar:setPaused,montar:setMontado,speed:setSpeed,done:()=>done}},[sessao,matchId,done])
 const match={context:{id:matchId,home:[],away:[]},officialTeams:[nomeCasa,nomeFora],homeColor:swap?'#f4f4f4':'#C2452F',awayColor:swap?'#C2452F':'#f4f4f4',homeScore:1,awayScore:1,minute:93,finished:true,paused:false} as any
 return <main data-concluido={String(done)}>
  <h1>PÊNALTIS NO CAMPO</h1><p style={{fontSize:12}}>Teste local · dados de demonstração · {integrado?'tela real da Copa da carreira':'campo e placar reais'}</p>
  <div style={{display:'flex',gap:6,margin:'8px 0'}}>{[1,2,4].map(v=><button key={v} onClick={()=>setSpeed(v)}>{v}×</button>)}<button onClick={()=>setPaused(v=>!v)}>{paused?'Continuar':'Pausar'}</button><button onClick={()=>setMontado(v=>!v)}>Alternar tela</button></div>
  {montado && (integrado?<MyCopaMatch stadiumContext={{id}} tie={tie} pos={swap?180:90} phase={0} colors={{}} myColor="#fff" simSpeed={speed} pausado={paused} onPenaltiesComplete={()=>setDone(true)} />:<>
   <Campo2D disputaPenaltis={sessao} mapMatchId={id} roundKey={1} minuto={93} roundMs={110000} fechado gols={gols} climaForcado="sol" noiteForcada={false} semNarra
    casa={{nome:nomeCasa,cor:match.homeColor,cartas:home}} fora={{nome:nomeFora,cor:match.awayColor,cartas:away}}/>
   <PensShootout lento campo={estado} compactCareer pens={pens} aName={aName} bName={bName} aSquad={a} bSquad={b}/>
  </>)}
  {query.has('hud')&&<aside style={{position:'relative',minHeight:100}}><MapaHud match={match}/></aside>}
 </main>
}
const container=document.getElementById('root') as HTMLElement & {__raiz?:ReturnType<typeof createRoot>}
;(container.__raiz??=createRoot(container)).render(<Bancada/>)
