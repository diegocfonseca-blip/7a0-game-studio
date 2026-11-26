import type {ReactNode} from 'react'
import type {Entrant} from './copa-mundo'
import {FootballCupView,type CupGame,type CupStage} from './football-cup-view'
import {CupFeaturedGame,type CupPenaltyPresentation} from './football-cup-world'
import {CHS,jogosDoPassoCh,tabelaChampionsSala,ehVoltaCh,faseIdxCh,type MundoChampions} from './champions-sala'
import {SeloClube} from './selo-clube'
import {tr} from './lang'

// ⭐ Liga + Champions da sala (26/11): o MESMO palco das outras copas (`FootballCupView`), com o formato da Champions 2025–26 —
// fase de liga de 36, playoff e mata-mata em ida e volta, final única.
const ROTULO={playoff:['Playoff','Play-offs'],oitavas:['Oitavas','Round of 16'],quartas:['Quartas','Quarter-finals'],semi:['Semifinais','Semi-finals']} as const
export function FootballChampionsCupView({world,entrants,step,minute,finished,field,renderMatch,transition,controls,tactics,ceremony,onClose,tournamentKey}:{
 world:MundoChampions;entrants:Entrant[];step:number;minute:number;finished:boolean;field:boolean;
 renderMatch:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const gamesAt=(p:number):CupGame[]=>jogosDoPassoCh(world,p).map(g=>({h:g.h,a:g.a,ev:g.ev,step:p,leg:faseIdxCh(p)>=0?(ehVoltaCh(p)?tr('VOLTA','2ND LEG'):tr('IDA','1ST LEG')):undefined,pen:g.final?.pen??(g.volta?g.tie?.pen:undefined)}))
 const stages:CupStage[]=[{id:'league',label:tr('Fase de liga','League phase'),known:true,games:Array.from({length:CHS.RODADAS},(_,i)=>gamesAt(i+1)).flat()},...world.ko.map((r,i)=>({id:r.tipo,label:tr(ROTULO[r.tipo][0],ROTULO[r.tipo][1]),known:step>CHS.KO_IDA+i*2-1||step===CHS.KO_IDA+i*2-1&&finished,games:[...gamesAt(CHS.KO_IDA+i*2),...gamesAt(CHS.KO_IDA+i*2+1)]})),{id:'final',label:tr('Final','Final'),known:step>CHS.SF_VOLTA||step===CHS.SF_VOLTA&&finished,games:gamesAt(CHS.FINAL)}]
 const currentStage=step<CHS.KO_IDA?'league':step<=CHS.SF_VOLTA?world.ko[faseIdxCh(step)].tipo:'final'
 const currentGames=gamesAt(Math.min(step,CHS.FINAL)),featured=currentGames.find(g=>entrants[g.h].you||entrants[g.a].you)??currentGames[0]
 const crest=(i:number,size:number)=><SeloClube clube={entrants[i].pais} size={size}/>
 const goals=new Map<string,{name:string;team:number;total:number}>(),assists=new Map<string,{name:string;team:number;total:number}>()
 for(const g of stages.flatMap(s=>s.games))if(g.step<step||g.step===step&&finished)for(const e of g.ev){const team=e.home?g.h:g.a;for(const [name,map] of [[e.name,goals],[e.assist,assists]] as const)if(name){const key=`${team}:${name}`,old=map.get(key);map.set(key,{name,team,total:(old?.total??0)+1})}}
 const top=(map:typeof goals)=>[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,10)
 return <FootballCupView key={`${tournamentKey}:${entrants.find(e=>e.you)?.uid??'spectator'}`} title="CHAMPIONS LEGENDS" detail={tr('1º–8º direto nas oitavas · 9º–24º no playoff · ida e volta até a semi · final única.','1st–8th straight to the last 16 · 9th–24th in the play-offs · two legs to the semis · one-off final.')} phase={step<=CHS.RODADAS?`${tr('Fase de liga · Rodada','League phase · Round')} ${Math.max(1,step)}/${CHS.RODADAS}`:stages.find(s=>s.id===currentStage)?.label??'Champions'} entrants={entrants} uids={entrants.map(e=>e.uid)} crest={crest} stages={stages} currentStage={currentStage} tables={[{title:tr('FASE DE LIGA · 36 CLUBES','LEAGUE PHASE · 36 CLUBS'),rows:tabelaChampionsSala(world,entrants.length,step<=CHS.RODADAS&&!finished?Math.max(0,step-1):Math.min(CHS.RODADAS,step)),qualify:8}]} stats={{goals:top(goals),assists:top(assists)}} step={step} minute={minute} finished={finished} broadcast={featured?<CupFeaturedGame matchId={tournamentKey} game={featured} entrants={entrants} crest={crest} minute={minute} field={field} render={renderMatch}/>:null} transition={transition} controls={controls} tactics={tactics} ceremony={ceremony} onClose={onClose} tournamentKey={tournamentKey}/>
}
