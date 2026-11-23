import type {ReactNode} from 'react'
import {FootballCupView,type CupGame,type CupStage} from './football-cup-view'
import {groupTable,copaSemOitavas,melhoresTerceiros,vagasTerceiros,type Entrant,type simulaCopaMundo} from './copa-mundo'
import {PASSO_COPA} from './copa-passos'
import {copaStats} from './copa-stats'
import {NationalCrest} from './national-crest'
import {Penaltis2D} from './campo2d-penaltis-react'
import {PensShootout,pensRevealDelay} from './pyramidseason'
import type {DisputaPenaltisCampo,EstadoPenaltisCampo} from './campo2d-penaltis'
import {tr} from './lang'

export type CupPenaltyPresentation={sessao?:DisputaPenaltisCampo;estado?:EstadoPenaltisCampo;panel?:ReactNode}
export function CupFeaturedGame({game,entrants,crest,minute,field,render,matchId}:{game:CupGame;entrants:Entrant[];crest:(i:number,size:number)=>ReactNode;minute:number;field:boolean;render:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;matchId:string}){
 const h=entrants[game.h],a=entrants[game.a],slow=!!(h.humano||a.humano)
 const cfg=field&&game.pen?{id:`${matchId}:${game.step}:${game.h}:${game.a}`,pens:game.pen,aName:h.pais,bName:a.pais,aSquad:h.xi,bSquad:a.xi,orcamento:pensRevealDelay(game.pen,slow)}:undefined
 return <Penaltis2D config={cfg} ativo={minute>=93&&!!game.pen}>{pc=>render(game,{...pc,panel:minute>=93&&game.pen?<section className="fp-cup-penalties" aria-label={tr('Disputa de pênaltis','Penalty shootout')}><p>{tr('DECISÃO NOS PÊNALTIS','PENALTY SHOOTOUT')}</p><PensShootout campo={pc.estado} compactOnline aCrest={crest(game.h,20)} bCrest={crest(game.a,20)} pens={game.pen} aName={h.pais} bName={a.pais} aSquad={h.xi} bSquad={a.xi} lento={slow}/></section>:undefined})}</Penaltis2D>
}

export function FootballWorldCupView({world,entrants,euro,step,minute,finished,field,renderMatch,transition,controls,tactics,ceremony,onClose,tournamentKey}:{
 world:ReturnType<typeof simulaCopaMundo>;entrants:Entrant[];euro?:24|16;step:number;minute:number;finished:boolean;field:boolean;
 renderMatch:(g:CupGame,pen:CupPenaltyPresentation)=>ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const {SORTEIO,OITAVAS,QUARTAS,SEMI,FINAL}=PASSO_COPA,semOit=copaSemOitavas(entrants.length)
 const seen=(p:number)=>step>p||(step===p&&finished)
 const game=(h:number,a:number,ev:CupGame['ev']|undefined,p:number,pen?:[number,number]|null):CupGame=>({h,a,ev:ev??[],step:p,pen})
 const stages:CupStage[]=[{id:'groups',label:tr('Grupos','Groups'),known:true,games:world.groups.flatMap(g=>g.matches.flatMap((rd,i)=>rd.map(m=>game(m.h,m.a,m.ev,i+1))))},
  ...(!semOit?[{id:'r16',label:tr('Oitavas','Round of 16'),known:step>=SORTEIO,games:world.r16.map(t=>game(t.h,t.a,t.ev1,OITAVAS,t.pen))}]:[]),
  {id:'qf',label:tr('Quartas','Quarter-finals'),known:semOit?step>=SORTEIO:seen(OITAVAS),games:world.qf.map(t=>game(t.h,t.a,t.ev1,QUARTAS,t.pen))},
  {id:'sf',label:tr('Semifinais','Semi-finals'),known:seen(QUARTAS),games:world.sf.map(t=>game(t.h,t.a,t.ev1,SEMI,t.pen))},
  {id:'final',label:tr('Final','Final'),known:seen(SEMI),games:[game(world.final.h,world.final.a,world.final.ev,FINAL,world.final.pen)]}]
 const currentStage=step<=SORTEIO?'groups':step<=OITAVAS&&!semOit?'r16':step<=QUARTAS?'qf':step===SEMI?'sf':'final'
 const currentGames=stages.find(s=>s.id===currentStage)?.games.filter(g=>g.step===Math.min(step,FINAL))??[]
 const featured=currentGames.find(g=>entrants[g.h].you||entrants[g.a].you)??currentGames[0]
 const crest=(i:number,size:number)=><NationalCrest country={entrants[i].pais} size={size}/>
 const shown=step<=3&&!finished?Math.max(0,step-1):Math.min(3,step),thirdSlots=vagasTerceiros(world.groups.length)
 const tables=[...world.groups.map((g,i)=>({title:`${tr('GRUPO','GROUP')} ${String.fromCharCode(65+i)}`,rows:groupTable(g,shown),qualify:2})),...(thirdSlots?[{title:tr('MELHORES TERCEIROS','BEST THIRD-PLACED TEAMS'),rows:melhoresTerceiros(world.groups,shown).lista.map(r=>({...r,group:`${tr('Grupo','Group')} ${String.fromCharCode(65+r.g)}`})),qualify:thirdSlots,thirds:true}]:[])]
 const title=euro===16?tr('COPA AMÉRICA LEGENDS','LEGENDS COPA AMÉRICA'):euro?tr('EUROCOPA LEGENDS','LEGENDS EURO'):tr('COPA DO MUNDO LEGENDS','LEGENDS WORLD CUP')
 return <FootballCupView key={`${tournamentKey}:${entrants.find(e=>e.you)?.uid??'spectator'}`} title={title} detail={step<=3?tr(`Passam os 2 primeiros de cada grupo${thirdSlots?` + os ${thirdSlots} melhores terceiros`:``}.`,`Top 2 in each group advance${thirdSlots?` + the ${thirdSlots} best third-placed teams`:``}.`):tr('Jogo único · empate leva aos pênaltis.','One-off match · draws go to penalties.')} phase={step<=3?`${tr('Fase de grupos · Rodada','Group stage · Round')} ${Math.max(1,step)}/3`:stages.find(s=>s.id===currentStage)?.label??title} entrants={entrants} uids={entrants.map(e=>e.uid)} crest={crest} stages={stages} currentStage={currentStage} tables={tables} stats={copaStats(world,step,finished)} step={step} minute={minute} finished={finished} broadcast={featured?<CupFeaturedGame matchId={tournamentKey} game={featured} entrants={entrants} crest={crest} minute={minute} field={field} render={renderMatch}/>:null} transition={transition} controls={controls} tactics={tactics} ceremony={ceremony} onClose={onClose} tournamentKey={tournamentKey}/>
}
