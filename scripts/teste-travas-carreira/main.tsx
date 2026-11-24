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
const aleatorioOriginal=Math.random
Math.random=()=>0.20261124
let seed=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Flamengo',formation:'4-3-3',rivals:3,oficial:{clube:'Flamengo'}})
Math.random=aleatorioOriginal
if(!seed.oficial)throw new Error('Fixture oficial não foi criada')
seed={...seed,seasonNo:6,calCopaSeason:6,tvBannerSeen:['A','B','C','D'],tvExtraVisto:true,screen:'season',oficialAbertura:undefined,seed:20261120,simSpeed:Number(new URLSearchParams(location.search).get('speed')??4),careerSubMode:'dinamico',careerEra:new URLSearchParams(location.search).get('semplano')?1:undefined} // 🔒 ?semplano=1 = carreira NOVA sem plano (Manual com cadeado)
if(new URLSearchParams(location.search).has('continental'))seed={...seed,oficialCampeoes:[{temporada:1,serieA:'Flamengo',serieAVice:'Palmeiras',copa:'Flamengo',copaVice:'Palmeiras',serieATop:['Grêmio','Flamengo','Palmeiras','Cruzeiro','Fluminense','Botafogo','Corinthians','São Paulo','Bahia','Internacional','Santos','Fortaleza','Ceará','Vasco','Bragantino','Mirassol','Juventude','Vitória','Sport','Athletico-PR']}]};
// Cenário de teste, sem alterar conta real: Flamengo na B após rebaixamento.
if(new URLSearchParams(location.search).get('serie')!=='A')seed={...seed,careerDivision:'B',careerPlacements:{...seed.careerPlacements,m0:'B','Goiás':'A'}}
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
if(!new URLSearchParams(location.search).has('legado'))seed={...seed,motor2Desde:{season:1,round:1}}
seed=reducer(seed,{type:'SIM_MANY',count:Number(new URLSearchParams(location.search).get('round')??10)})
const id=seed.managers[seed.youIdx].id
seed={...seed,careerCoins:{...seed.careerCoins,[id]:384},careerTorcida:{...seed.careerTorcida,m0:41},careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true}}
function App(){
 const [state,dispatch]=useReducer(reducer,seed);W.qaState=state;W.qaDispatch=dispatch
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
const host=document.getElementById('root') as HTMLElement&{qaRoot?:ReturnType<typeof createRoot>}
const root=host.qaRoot??=createRoot(host);root.render(<App/>);
