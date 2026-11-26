import type {ReactNode} from 'react'
import type {Entrant} from './copa-mundo'
import {FootballCupView,type CupGame,type CupStage} from './football-cup-view'
import {CupFeaturedGame,type CupPenaltyPresentation} from './football-cup-world'
import {MUN,jogosDoPassoMun,tabelaDoGrupoMun,type MundoMundial} from './mundial-sala'
import {SeloClube} from './selo-clube'
import {tr} from './lang'

// 🌍 Super Mundial da sala (26/11): o MESMO palco das outras copas (`FootballCupView`), com o formato do Mundial de 2025 —
// grupos em turno único e mata-mata todo em jogo único.
export function FootballMundialCupView({world,entrants,step,minute,finished,field,renderMatch,transition,controls,tactics,ceremony,onClose,tournamentKey}:{
 world:MundoMundial;entrants:Entrant[];step:number;minute:number;finished:boolean;field:boolean;
 renderMatch:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const gamesAt=(p:number):CupGame[]=>jogosDoPassoMun(world,p).map(g=>({h:g.h,a:g.a,ev:g.ev,step:p,pen:g.tie?.pen}))
 const seen=(p:number)=>step>p||(step===p&&finished)
 const stages:CupStage[]=[{id:'groups',label:tr('Grupos','Groups'),known:true,games:Array.from({length:MUN.RODADAS},(_,i)=>gamesAt(i+1)).flat()},
  ...world.ko.map((r,i)=>({id:r.tipo,label:r.tipo==='oitavas'?tr('Oitavas','Round of 16'):r.tipo==='quartas'?tr('Quartas','Quarter-finals'):tr('Semifinais','Semi-finals'),known:seen(MUN.OITAVAS+i-1),games:gamesAt(MUN.OITAVAS+i)})),
  {id:'final',label:tr('Final','Final'),known:seen(MUN.SEMI),games:gamesAt(MUN.FINAL)}]
 const currentStage=step<MUN.OITAVAS?'groups':step<=MUN.SEMI?world.ko[step-MUN.OITAVAS].tipo:'final'
 const currentGames=gamesAt(Math.min(step,MUN.FINAL)),featured=currentGames.find(g=>entrants[g.h].you||entrants[g.a].you)??currentGames[0]
 const crest=(i:number,size:number)=><SeloClube clube={entrants[i].pais} size={size}/>
 const goals=new Map<string,{name:string;team:number;total:number}>(),assists=new Map<string,{name:string;team:number;total:number}>()
 for(const g of stages.flatMap(s=>s.games))if(g.step<step||g.step===step&&finished)for(const e of g.ev){const team=e.home?g.h:g.a;for(const [name,map] of [[e.name,goals],[e.assist,assists]] as const)if(name){const key=`${team}:${name}`,old=map.get(key);map.set(key,{name,team,total:(old?.total??0)+1})}}
 const top=(map:typeof goals)=>[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,10)
 return <FootballCupView key={`${tournamentKey}:${entrants.find(e=>e.you)?.uid??'spectator'}`} title="SUPER MUNDIAL LEGENDS" detail={step<=MUN.RODADAS?tr('Passam os 2 primeiros de cada grupo.','Top 2 in each group advance.'):tr('Jogo único · empate leva aos pênaltis.','One-off match · draws go to penalties.')} phase={step<=MUN.RODADAS?`${tr('Fase de grupos · Rodada','Group stage · Round')} ${Math.max(1,step)}/${MUN.RODADAS}`:stages.find(s=>s.id===currentStage)?.label??'Super Mundial'} entrants={entrants} uids={entrants.map(e=>e.uid)} crest={crest} stages={stages} currentStage={currentStage} tables={world.grupos.map((_,i)=>({title:`${tr('GRUPO','GROUP')} ${String.fromCharCode(65+i)}`,rows:tabelaDoGrupoMun(world,i,step<=MUN.RODADAS&&!finished?Math.max(0,step-1):Math.min(MUN.RODADAS,step)),qualify:2}))} stats={{goals:top(goals),assists:top(assists)}} step={step} minute={minute} finished={finished} broadcast={featured?<CupFeaturedGame matchId={tournamentKey} game={featured} entrants={entrants} crest={crest} minute={minute} field={field} render={renderMatch}/>:null} transition={transition} controls={controls} tactics={tactics} ceremony={ceremony} onClose={onClose} tournamentKey={tournamentKey}/>
}
