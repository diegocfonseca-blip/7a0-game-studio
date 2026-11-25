import {carreiraTradicionalBancada,reservasBancada,divisaoBancada} from '../teste-paridade-carreira/tradicional'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import {useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer,INITIAL,catalogTodos} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {PyramidSeasonScreen,buildPyramid} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {ligaCampo2D,marcaPago2D} from '../../src/escalacao/campo2d-modo'
import {usePartidaNoMapa} from '../../src/escalacao/presidencia-partida-sincronia'
import {registrarVistaCampo,removerVistaCampo} from '../../src/escalacao/presidencia-campo-observacao'
import '../../src/index.css'
const W=window as any
_bancadaApoio('auditoria-local@example.invalid',new URLSearchParams(location.search).has('gratis')?null:'ouro');_forcaBrasilOficialParaTeste(true)
const modo2d=new URLSearchParams(location.search).get('mode')==='2d'
marcaPago2D(modo2d);ligaCampo2D(modo2d)
W.qaModo2D=(on:boolean)=>ligaCampo2D(on)
const vistaTeste={}
W.qaVista3D=(on:boolean)=>on?registrarVistaCampo(vistaTeste):removerVistaCampo(vistaTeste)
await carregaBaralhoOficial()
const aleatorioOriginal=Math.random
Math.random=()=>0.20261124
const tradicional=new URLSearchParams(location.search).has('tradicional')
let seed=tradicional?reservasBancada(carreiraTradicionalBancada()):reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Flamengo',formation:'4-3-3',rivals:3,oficial:{clube:'Flamengo'}})
Math.random=aleatorioOriginal
if(!tradicional&&!seed.oficial)throw new Error('Fixture oficial não foi criada')
seed={...seed,seasonNo:6,calCopaSeason:6,tvBannerSeen:['A','B','C','D'],tvExtraVisto:true,screen:'season',oficialAbertura:undefined,seed:20261120,simSpeed:Number(new URLSearchParams(location.search).get('speed')??4),careerSubMode:'dinamico',careerEra:new URLSearchParams(location.search).get('semplano')?1:undefined} // 🔒 ?semplano=1 = carreira NOVA sem plano (Manual com cadeado)
if(new URLSearchParams(location.search).has('continental'))seed={...seed,oficialCampeoes:[{temporada:1,serieA:'Flamengo',serieAVice:'Palmeiras',copa:'Flamengo',copaVice:'Palmeiras',serieATop:['Grêmio','Flamengo','Palmeiras','Cruzeiro','Fluminense','Botafogo','Corinthians','São Paulo','Bahia','Internacional','Santos','Fortaleza','Ceará','Vasco','Bragantino','Mirassol','Juventude','Vitória','Sport','Athletico-PR']}]};
// Cenário de teste, sem alterar conta real: Flamengo na B após rebaixamento.
if(tradicional)seed=divisaoBancada(seed,new URLSearchParams(location.search).get('serie')==='A'?'A':'B',buildPyramid)
else if(new URLSearchParams(location.search).get('serie')!=='A')seed={...seed,careerDivision:'B',careerPlacements:{...seed.careerPlacements,m0:'B','Goiás':'A'}}
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
if(!new URLSearchParams(location.search).has('legado'))seed={...seed,motor2Desde:{season:1,round:1}}
seed=reducer(seed,{type:'SIM_MANY',count:Number(new URLSearchParams(location.search).get('round')??10)})
const id=seed.managers[seed.youIdx].id
seed={...seed,careerCoins:{...seed.careerCoins,[id]:384},careerTorcida:{...seed.careerTorcida,m0:41},careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true}}
if(new URLSearchParams(location.search).has('retomar')){const saved=sessionStorage.getItem('qa-ciclo-carreira');if(!saved)throw new Error('Estado de teste ausente');seed=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(saved)})}
if(!new URLSearchParams(location.search).has('retomar'))seed={...seed,stadiums:{...seed.stadiums,[id]:{inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}},careerLoja:{...seed.careerLoja,[id]:{preco:'normal',balanco:{season:5,camisas:1600,moedas:500,pos:3,preco:'normal',torcida:80}}},careerNeighborhood:{[id]:{seen:[],sales:[{season:4,count:1100},{season:5,count:1600}]}}}
// Illustrated signing fixture: a current recorded purchase, not an inferred old
// arrival. The real catalogue identity, free plan and both native careers are used.
const signing=new URLSearchParams(location.search).get('chegada')
if(signing&&!new URLSearchParams(location.search).has('retomar')){
 const name=signing==='zico'?'Zico':signing==='barcelona'?'Romário':'Romário',club=signing==='zico'?'Flamengo':signing==='barcelona'?'Barcelona':'Vasco',year=signing==='zico'?1981:signing==='barcelona'?1994:2000
 const found=Object.entries(catalogTodos()).flatMap(([pos,list])=>list.map(c=>({...c,pos}))).find(c=>c.name===name&&c.club===club&&c.year===year)
 const card=found?{...found,id:`qa-chegada-${signing}`} as any:undefined
 if(!card)throw new Error('Carta real da bancada ausente')
 const m=seed.managers[seed.youIdx];m.squad=[...m.squad.filter(c=>c.id!==card.id),{...card,paid:40,buyPrice:40,via:'monte'}]
 seed={...seed,careerNeighborhood:{},careerLoja:undefined,eventoTemporada:undefined,careerTransferHistory:[{season:seed.seasonNo,round:seed.round,team:m.teamName,name:card.name,club:card.club,year:card.year,pos:card.pos,fame:card.fame,paid:40,from:'Clube anterior',source:'leilao'} as any]}
}
// A observação do placar fica num filho: notificações de quadro não recriam o contexto da carreira.
function CapturaPartida({id}:{id:number}){W.qaMatch=usePartidaNoMapa(undefined,id,true);return null}
function App(){
 const [state,dispatch]=useReducer((s,a)=>{W.qaActions??=[];W.qaActions.push(a.type);if(W.qaActions.length>100)W.qaActions.shift();return reducer(s,a)},seed);W.qaState=state;W.qaDispatch=dispatch
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><CapturaPartida id={state.managers[state.youIdx].id}/><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
const host=document.getElementById('root') as HTMLElement&{qaRoot?:ReturnType<typeof createRoot>}
const root=host.qaRoot??=createRoot(host);root.render(<App/>);
