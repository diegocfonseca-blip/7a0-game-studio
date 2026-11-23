import type {ReactNode} from 'react'
import type {Entrant} from './copa-mundo'
import {FootballCupView,type CupGame,type CupStage} from './football-cup-view'
import {CupFeaturedGame,type CupPenaltyPresentation} from './football-cup-world'
import {LIB,jogosDoPasso,tabelaDoGrupo,type MundoLiberta} from './liberta-sala'
import {SeloClube} from './selo-clube'
import {tr} from './lang'

export function FootballLibertaCupView({world,entrants,step,minute,finished,field,renderMatch,transition,controls,tactics,ceremony,onClose,tournamentKey}:{
 world:MundoLiberta;entrants:Entrant[];step:number;minute:number;finished:boolean;field:boolean;
 renderMatch:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const gamesAt=(p:number):CupGame[]=>jogosDoPasso(world,p).map(g=>({h:g.h,a:g.a,ev:g.ev,step:p,leg:p>=LIB.OIT_IDA&&p<=LIB.SF_VOLTA?((p-LIB.OIT_IDA)%2?tr('VOLTA','2ND LEG'):tr('IDA','1ST LEG')):undefined,pen:g.final?.pen??(g.volta?g.tie?.pen:undefined)}))
 const stages:CupStage[]=[{id:'groups',label:tr('Grupos','Groups'),known:true,games:Array.from({length:LIB.RODADAS},(_,i)=>gamesAt(i+1)).flat()},...world.ko.map((r,i)=>({id:r.tipo,label:r.tipo==='oitavas'?tr('Oitavas','Round of 16'):r.tipo==='quartas'?tr('Quartas','Quarter-finals'):tr('Semifinais','Semi-finals'),known:i===0?step>=LIB.OIT_IDA||step===LIB.RODADAS&&finished:step>LIB.OIT_IDA+i*2-1||step===LIB.OIT_IDA+i*2-1&&finished,games:[...gamesAt(LIB.OIT_IDA+i*2),...gamesAt(LIB.OIT_IDA+i*2+1)]})),{id:'final',label:tr('Final','Final'),known:step>LIB.SF_VOLTA||step===LIB.SF_VOLTA&&finished,games:gamesAt(LIB.FINAL)}]
 const currentStage=step<LIB.OIT_IDA?'groups':step<=LIB.SF_VOLTA?world.ko[Math.floor((step-LIB.OIT_IDA)/2)].tipo:'final'
 const currentGames=gamesAt(Math.min(step,LIB.FINAL)),featured=currentGames.find(g=>entrants[g.h].you||entrants[g.a].you)??currentGames[0]
 const crest=(i:number,size:number)=><SeloClube clube={entrants[i].pais} size={size}/>
 const goals=new Map<string,{name:string;team:number;total:number}>(),assists=new Map<string,{name:string;team:number;total:number}>()
 for(const g of stages.flatMap(s=>s.games))if(g.step<step||g.step===step&&finished)for(const e of g.ev){const team=e.home?g.h:g.a;for(const [name,map] of [[e.name,goals],[e.assist,assists]] as const)if(name){const key=`${team}:${name}`,old=map.get(key);map.set(key,{name,team,total:(old?.total??0)+1})}}
 const top=(map:typeof goals)=>[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,10)
 return <FootballCupView key={`${tournamentKey}:${entrants.find(e=>e.you)?.uid??'spectator'}`} title="LIBERTADORES LEGENDS" detail={tr('Grupos em turno e returno · ida e volta até a semi · final única.','Home-and-away groups · two legs through the semis · one-off final.')} phase={step<=LIB.RODADAS?`${tr('Grupos · Rodada','Groups · Round')} ${Math.max(1,step)}/${LIB.RODADAS}`:stages.find(s=>s.id===currentStage)?.label??'Libertadores'} entrants={entrants} uids={entrants.map(e=>e.uid)} crest={crest} stages={stages} currentStage={currentStage} tables={world.grupos.map((_,i)=>({title:`${tr('GRUPO','GROUP')} ${String.fromCharCode(65+i)}`,rows:tabelaDoGrupo(world,i,step<=LIB.RODADAS&&!finished?Math.max(0,step-1):Math.min(LIB.RODADAS,step)),qualify:2}))} stats={{goals:top(goals),assists:top(assists)}} step={step} minute={minute} finished={finished} broadcast={featured?<CupFeaturedGame matchId={tournamentKey} game={featured} entrants={entrants} crest={crest} minute={minute} field={field} render={renderMatch}/>:null} transition={transition} controls={controls} tactics={tactics} ceremony={ceremony} onClose={onClose} tournamentKey={tournamentKey}/>
}
