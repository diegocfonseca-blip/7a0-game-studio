import React,{useReducer} from 'react'
import {createRoot} from 'react-dom/client'
import {EscCtxBancada,reducer,INITIAL,openSlots} from '../../src/escalacao/store'
import {EscStreamIntro,EscAuction,EscMonte,EscCerimonia,GameFooter} from '../../src/escalacao/screens'
import {PyramidSeasonScreen} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {COLETIVA_VAZIA} from '../../src/escalacao/coletiva'
import '../../src/index.css'
_bancadaApoio('diego.c.fonseca@gmail.com','ouro')
const stage=new URLSearchParams(location.search).get('stage')??'intro'
const W=window as any
const seed=()=>{
 const persisted=new URLSearchParams(location.search).get('resume')==='1'?sessionStorage.getItem('qa-career-start-resume'):null
 if(persisted)return reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(persisted)})
 let s=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Neymarzetti',formation:'4-3-3',rivals:3,intro:true})
 if(stage==='intro')return s
 s=reducer(s,{type:'START_STREAM_AUCTION'})
 if(stage==='envelope')return s
 if(stage==='reveal'){
  s={...s,phaseDeadline:1};s=reducer(s,{type:'SUBMIT_ENVELOPE',mgrId:s.managers[s.youIdx].id,bids:[{cardId:s.currentCards[0].id,amount:7}]});
  if(s.phase==='envelope')s=reducer(s,{type:'FORCE_SEAL'});return s
 }
 for(let i=0;i<2500&&s.screen!=='cerimonia'&&s.screen!=='season';i++){
  if(s.screen==='auction'){
   if(s.phase==='envelope'||s.phase==='resq_envelope'){
    const m=s.managers[s.youIdx];let cash=m.money;const bids:any[]=[];
    for(const p of ['GOL','LAT','ZAG','MEI','ATA'] as const)for(const c of s.currentCards.filter(c=>c.pos===p).slice(0,openSlots(m,p))){if(cash>=3){bids.push({cardId:c.id,amount:3});cash-=3}}
    s={...s,phaseDeadline:1};s=reducer(s,{type:'SUBMIT_ENVELOPE',mgrId:m.id,bids});if(s.phase==='envelope'||s.phase==='resq_envelope')s=reducer(s,{type:'FORCE_SEAL'});
   }else if(s.phase==='tiebreak')s=reducer({...s,phaseDeadline:1},{type:'FORCE_TIEBREAK'});
   else s=reducer(s,{type:'ADVANCE_REVEAL'});
  }else if(s.screen==='monte')s=reducer({...s,monteDeadline:1},{type:'MONTE_TIMEOUT'});
  else throw new Error(`Unexpected fixture stage ${s.screen}`);
 }
 if((stage==='central'||stage.startsWith('unlock-')||stage==='reserves')&&s.screen==='cerimonia')s=reducer(s,{type:'FINISH_CEREMONY'});
 if(stage==='reserves')s=reducer(s,{type:'RESERVE_AUCTION_ONLINE'});
 if(stage==='unlock-condition'){const id=s.managers[s.youIdx].id;s={...s,seasonNo:5,condicaoDesde:5,careerDivision:'C',careerPlacements:{...s.careerPlacements,[`m${id}`]:'C'},careerSeen:{...s.careerSeen,'guia-primeiro-jogo':true}};}
 if(stage==='unlock-moral'){const id=s.managers[s.youIdx].id;s={...s,careerColetiva:{...s.careerColetiva,[id]:{...COLETIVA_VAZIA(),efeitos:[{tipo:'moral',delta:2,t:s.seasonNo??1,r:s.round}]}},careerSeen:{...s.careerSeen,'guia-primeiro-jogo':true}};}
 return s
}
function App(){
 const [state,dispatch]=useReducer(reducer,undefined,seed);W.qaState=state;W.qaDispatch=dispatch;W.qaPersist=()=>sessionStorage.setItem('qa-career-start-resume',JSON.stringify(state));
 const noop=()=>{};const ctx:any={state,dispatch,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop};
 return <EscCtxBancada.Provider value={ctx}>{state.screen==='streamIntro'?<EscStreamIntro/>:state.screen==='auction'?<EscAuction/>:state.screen==='monte'?<EscMonte/>:state.screen==='cerimonia'?<EscCerimonia/>:state.screen==='season'?<PyramidSeasonScreen/>:<div>{state.screen}</div>}<GameFooter/></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/>);
