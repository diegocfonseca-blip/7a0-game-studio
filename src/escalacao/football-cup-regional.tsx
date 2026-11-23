import type {ReactNode} from 'react'
import type {Entrant} from './copa-mundo'
import {FootballCupView,type CupGame,type CupStage} from './football-cup-view'
import {CupFeaturedGame,type CupPenaltyPresentation} from './football-cup-world'
import {passosRegional,tabelaDoLado,type MundoRegional} from './copa-regional'
import {SeloClube} from './selo-clube'
import {tr} from './lang'

export function FootballRegionalCupView({title,world,entrants,step,minute,finished,field,renderMatch,transition,controls,tactics,ceremony,onClose,tournamentKey,ladoNames}:{
 title:string;world:MundoRegional;entrants:Entrant[];step:number;minute:number;finished:boolean;field:boolean;ladoNames:[string,string];
 renderMatch:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const P=passosRegional(entrants.length/2)
 const game=(h:number,a:number,ev:CupGame['ev'],p:number,pen?:[number,number]):CupGame=>({h,a,ev,step:p,pen})
 const stages:CupStage[]=[{id:'groups',label:tr('Classificação','Qualifying'),known:true,games:world.rodadas.flatMap((rd,i)=>rd.map(m=>game(m.h,m.a,m.ev,i+1)))},...world.ko.map((round,i)=>({id:round.tipo,label:round.tipo==='quartas'?tr('Quartas','Quarter-finals'):round.tipo==='semi'?tr('Semifinais','Semi-finals'):tr('Final','Final'),known:i===0?step>=P.CHAVE:step>P.PRIMEIRO_KO+i-1||(step===P.PRIMEIRO_KO+i-1&&finished),games:round.ties.map(m=>game(m.h,m.a,m.ev,P.PRIMEIRO_KO+i,m.pen))}))]
 const currentStage=step<P.PRIMEIRO_KO?'groups':world.ko[Math.min(world.ko.length-1,step-P.PRIMEIRO_KO)]?.tipo??'groups'
 const currentGames=stages.find(s=>s.id===currentStage)?.games.filter(g=>g.step===Math.min(step,P.FINAL))??[]
 const featured=currentGames.find(g=>entrants[g.h].you||entrants[g.a].you)??currentGames[0]
 const crest=(i:number,size:number)=><SeloClube clube={entrants[i].pais} size={size}/>
 const goals=new Map<string,{name:string;team:number;total:number}>(),assists=new Map<string,{name:string;team:number;total:number}>()
 for(const g of stages.flatMap(s=>s.games))if(g.step<step||(g.step===step&&finished))for(const e of g.ev){
  const team=e.home?g.h:g.a
  for(const [name,map] of [[e.name,goals],[e.assist,assists]] as const)if(name){const key=`${team}:${name}`,old=map.get(key);map.set(key,{name,team,total:(old?.total??0)+1})}
 }
 const top=(map:typeof goals)=>[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,10)
 return <FootballCupView key={`${tournamentKey}:${entrants.find(e=>e.you)?.uid??'spectator'}`} title={title} phase={step<=P.RODADAS?`${tr('Rodada','Round')} ${Math.max(1,step)}/${P.RODADAS}`:stages.find(s=>s.id===currentStage)?.label??title} entrants={entrants} uids={entrants.map(e=>e.uid)} crest={crest} stages={stages} currentStage={currentStage} tables={([0,1] as const).map(lado=>({title:ladoNames[lado],rows:tabelaDoLado(world,lado,step<=P.RODADAS&&!finished?Math.max(0,step-1):Math.min(P.RODADAS,step)),qualify:world.classificados[lado].length}))} stats={{goals:top(goals),assists:top(assists)}} step={step} minute={minute} finished={finished} broadcast={featured?<CupFeaturedGame matchId={tournamentKey} game={featured} entrants={entrants} crest={crest} minute={minute} field={field} render={renderMatch}/>:null} transition={transition} controls={controls} tactics={tactics} ceremony={ceremony} onClose={onClose} tournamentKey={tournamentKey}/>
}
