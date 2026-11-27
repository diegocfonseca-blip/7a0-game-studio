import '../../src/App'
import {avisaGiroFeito} from '../../src/escalacao/controle-partida-mapa'
import {carreiraTradicionalBancada} from '../teste-paridade-carreira/tradicional'
import {useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer,INITIAL} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {PyramidSeasonScreen} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import '../../src/index.css'
const W=window as any
_bancadaApoio('auditoria-local@example.invalid',new URLSearchParams(location.search).has('gratis')?null:'ouro');_forcaBrasilOficialParaTeste(true)
await carregaBaralhoOficial()
const tradicional=new URLSearchParams(location.search).has('tradicional')
let seed=tradicional?carreiraTradicionalBancada('Futpoint FC'):reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Grêmio',formation:'4-3-3',rivals:3,oficial:{clube:'Grêmio'}})
if(!tradicional&&!seed.oficial)throw new Error('Fixture oficial não foi criada')
seed={...seed,seasonNo:2,calCopaSeason:2,tvBannerSeen:['A','B','C','D'],tvExtraVisto:true,screen:'season',oficialAbertura:undefined,seed:20261120,simSpeed:Number(new URLSearchParams(location.search).get('speed')??4),careerSubMode:new URLSearchParams(location.search).has('intervalo')?'intervalo':'dinamico',careerEra:new URLSearchParams(location.search).get('semplano')?1:undefined} // 🔒 ?semplano=1 = carreira NOVA sem plano (Manual com cadeado)
if(new URLSearchParams(location.search).has('continental'))seed={...seed,oficialCampeoes:[{temporada:1,serieA:'Flamengo',serieAVice:'Palmeiras',copa:'Flamengo',copaVice:'Palmeiras',serieATop:['Grêmio','Flamengo','Palmeiras','Cruzeiro','Fluminense','Botafogo','Corinthians','São Paulo','Bahia','Internacional','Santos','Fortaleza','Ceará','Vasco','Bragantino','Mirassol','Juventude','Vitória','Sport','Athletico-PR']}]};
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
seed=reducer(seed,{type:'SIM_MANY',count:Number(new URLSearchParams(location.search).get('round')??4)})
const id=seed.managers[seed.youIdx].id
if(new URLSearchParams(location.search).has('intervalo'))seed={...seed,careerHalftime:undefined}
seed={...seed,careerCoins:{...seed.careerCoins,[id]:2000},careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true,condicao:true,'guia-lendas':true}}
function App(){
 const [state,dispatch]=useReducer((state:any,action:any)=>action.type==='QA_PATCH'?{...state,...action.patch}:reducer(state,action),seed);W.qaGiro=(giro:string)=>avisaGiroFeito(giro);W.qaState=state;W.qaDispatch=dispatch;W.qaPatch=(patch:any)=>dispatch({type:'QA_PATCH',patch})
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
const host=document.getElementById('root') as HTMLElement&{qaRoot?:ReturnType<typeof createRoot>}
const root=host.qaRoot??=createRoot(host);root.render(<App/>);
