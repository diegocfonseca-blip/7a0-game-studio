import type {FimDaChance} from './chances'
import type {PlanoLanceFutebol} from './presidencia-lance-tempo'

/** Describe only the phase currently being performed by the shared plan.
 * Result narration remains the responsibility of the impact callback. */
export function narrarEtapaLanceEstadio(plan:PlanoLanceFutebol|undefined,elapsedMs:number,club:string,en:boolean):string|undefined{
 const boundary=plan?.sequence?.boundaries.find(b=>elapsedMs>=b.startMs&&elapsedMs<b.endMs)
 if(!boundary||boundary.kind==='impact')return
 const phrases={
  prepare:['prepara a jogada…','builds the move…'],
  receive:['recebe e domina a bola.','receives and controls the ball.'],
  pass:['toca para o companheiro.','passes to a teammate.'],
  carry:['avança com a bola dominada.','carries the ball forward.'],
  shoot:['finaliza em direção ao gol…','takes the shot…'],
 } as const
 return `${club} ${phrases[boundary.kind][en?1:0]}`
}

/** The private 3D view only describes actions it actually presents. The wider
 * commentary library remains available to the existing public presentation. */
export function narrarChanceEstadio(outcome:FimDaChance,club:string,en:boolean,confirmed:boolean,surface?:string){
 if(!confirmed)return en?`${club} builds the move…`:`${club} prepara a jogada…`
 if(outcome==='trave'&&surface==='travessao')return en?`${club} hits the crossbar! The ball comes back into play.`:`${club} chutou no travessão! A bola voltou ao campo.`
 const result:Record<FimDaChance,[string,string]>={
  defendeu:['finalizou… o goleiro defendeu!','shoots… saved by the goalkeeper!'],
  trave:['chutou na trave! A bola voltou ao campo.','hits the post! The ball comes back into play.'],
  fora:['finalizou para fora, ao lado do gol.','shoots wide of the goal.'],
  isolou:['chutou por cima do gol.','shoots over the goal.'],
 }
 return `${club} ${result[outcome][en?1:0]}`
}

export function narrarGolEstadio(goal:{name:string;assist?:string},assistPresented:boolean,en:boolean){
 if(assistPresented&&goal.assist)return en?`${goal.assist} passes to ${goal.name}, who shoots and scores`:`${goal.assist} passa para ${goal.name}, que finaliza e marca`
 return en?`${goal.name} shoots and the ball crosses the goal line`:`${goal.name} finaliza e a bola cruza a linha do gol`
}
