import {carreiraTradicionalBancada,reservasBancada,divisaoBancada} from '../teste-paridade-carreira/tradicional'
import {useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer,INITIAL} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {PyramidSeasonScreen,buildPyramid} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {ligaCampo2D,marcaPago2D} from '../../src/escalacao/campo2d-modo'
import {usePartidaNoMapa} from '../../src/escalacao/presidencia-partida-sincronia'
import {registrarVistaCampo,removerVistaCampo} from '../../src/escalacao/presidencia-campo-observacao'
import '../../src/index.css'
const W=window as any,q=new URLSearchParams(location.search),clube=q.get('clube')??'Flamengo'
W.qaBoot={at:performance.now(),etapa:'baralho'}
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
let seed=tradicional?reservasBancada(carreiraTradicionalBancada()):reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:clube,formation:'4-3-3',rivals:3,oficial:{clube}})
Math.random=aleatorioOriginal
if(!tradicional&&!seed.oficial)throw new Error('Fixture oficial não foi criada')
seed={...seed,seasonNo:Number(q.get('season')??6),calCopaSeason:Number(q.get('season')??6),tvBannerSeen:['A','B','C','D'],tvExtraVisto:true,screen:'season',oficialAbertura:undefined,seed:20261120,simSpeed:Number(new URLSearchParams(location.search).get('speed')??4),careerSubMode:'dinamico',careerEra:new URLSearchParams(location.search).get('semplano')?1:undefined} // 🔒 ?semplano=1 = carreira NOVA sem plano (Manual com cadeado)
if(new URLSearchParams(location.search).has('continental'))seed={...seed,oficialCampeoes:[{temporada:1,serieA:'Flamengo',serieAVice:'Palmeiras',copa:'Flamengo',copaVice:'Palmeiras',serieATop:['Grêmio','Flamengo','Palmeiras','Cruzeiro','Fluminense','Botafogo','Corinthians','São Paulo','Bahia','Internacional','Santos','Fortaleza','Ceará','Vasco','Bragantino','Mirassol','Juventude','Vitória','Sport','Athletico-PR']}]};
// Cenário de teste, sem alterar conta real: Flamengo na B após rebaixamento.
if(tradicional)seed=divisaoBancada(seed,new URLSearchParams(location.search).get('serie')==='A'?'A':'B',buildPyramid)
else if(clube==='Flamengo'&&q.get('serie')==='B')seed={...seed,careerDivision:'B',careerPlacements:{...seed.careerPlacements,m0:'B','Goiás':'A'}}
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
if(!new URLSearchParams(location.search).has('legado'))seed={...seed,motor2Desde:{season:1,round:1}}
W.qaBoot={...W.qaBoot,etapa:'simular',sim:performance.now()};seed=reducer(seed,{type:'SIM_MANY',count:Number(new URLSearchParams(location.search).get('round')??10)})
W.qaBoot={...W.qaBoot,etapa:'montar',monta:performance.now()};const id=seed.managers[seed.youIdx].id
seed={...seed,careerCoins:{...seed.careerCoins,[id]:384},careerTorcida:{...seed.careerTorcida,m0:41},careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true}}
if(new URLSearchParams(location.search).has('retomar')){const saved=sessionStorage.getItem('qa-ciclo-carreira');if(!saved)throw new Error('Estado de teste ausente');seed=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(saved)})}
// A observação do placar fica num filho: notificações de quadro não recriam o contexto da carreira.
function CapturaPartida({id}:{id:number}){W.qaMatch=usePartidaNoMapa(undefined,id,true);return null}
function App(){
 const [state,dispatch]=useReducer((s,a)=>{W.qaActions??=[];W.qaActions.push(a.type);if(W.qaActions.length>400)W.qaActions.shift();W.qaActionCount??={};W.qaActionCount[a.type]=(W.qaActionCount[a.type]??0)+1;return reducer(s,a)},seed);W.qaState=state;W.qaDispatch=dispatch
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><CapturaPartida id={state.managers[state.youIdx].id}/><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
const host=document.getElementById('root') as HTMLElement&{qaRoot?:ReturnType<typeof createRoot>}
const root=host.qaRoot??=createRoot(host);root.render(<App/>);
