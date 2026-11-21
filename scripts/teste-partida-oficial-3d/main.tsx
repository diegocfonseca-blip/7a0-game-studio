import {useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import * as THREE from 'three'
import {EscCtxBancada,reducer,INITIAL} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {PyramidSeasonScreen} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {usePartidaNoMapa} from '../../src/escalacao/presidencia-partida-sincronia'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
const W=window as any,mode=new URLSearchParams(location.search).get('case')??'d'
W.qaTHREE=THREE
// Bancada apenas: expõe o renderizador real para medir chamadas, geometria e
// custo de grupos da cena. Não muda parâmetros nem interfere na partida.
const fromScene=THREE.PMREMGenerator.prototype.fromScene
THREE.PMREMGenerator.prototype.fromScene=function(...args:Parameters<typeof fromScene>){W.qaRenderer=(this as unknown as {_renderer:THREE.WebGLRenderer})._renderer;return fromScene.apply(this,args)}
_bancadaApoio('auditoria-local@example.invalid','ouro');_forcaBrasilOficialParaTeste(true)
await carregaBaralhoOficial()
let seed=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:mode==='d'?'Brasiliense':'Flamengo',formation:'4-3-3',rivals:3,oficial:{clube:mode==='d'?'Brasiliense':'Flamengo'}})
if(!seed.oficial)throw new Error('Fixture oficial não foi criada')
seed={...seed,screen:'season',oficialAbertura:undefined,seed:20261120,simSpeed:Number(new URLSearchParams(location.search).get('speed')??4),careerSubMode:'dinamico'}
seed=reducer(seed,{type:'SET_MASTER',brandId:'dsouza'})
seed=reducer(seed,{type:'SIM_MANY',count:Number(new URLSearchParams(location.search).get('round')??9)})
const id=seed.managers[seed.youIdx].id
seed={...seed,careerCoins:{...seed.careerCoins,[id]:2000},careerSeen:{...seed.careerSeen,'guia-primeiro-jogo':true}}
if(mode==='a'||new URLSearchParams(location.search).has('full'))seed={...seed,stadiums:{...seed.stadiums,[id]:{inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(e=>e.k)}},careerMuseums:{...seed.careerMuseums,[id]:{version:1,etapas:4,inicio:1,inauguracao:1}}}
function App(){
 const [state,dispatch]=useReducer(reducer,seed);W.qaState=state;W.qaDispatch=dispatch;W.qaMatch=usePartidaNoMapa(undefined,state.managers[state.youIdx].id,true)
 const noop=()=>{},ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><PyramidSeasonScreen/></EscCtxBancada.Provider>
}
const host=document.getElementById('root') as HTMLElement&{qaRoot?:ReturnType<typeof createRoot>}
const root=host.qaRoot??=createRoot(host);root.render(<App/>);
