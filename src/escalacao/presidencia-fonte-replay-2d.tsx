import {Campo2D} from './campo2d'
import {novoMotor2} from './motor2/carreira'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {FonteReplay3D} from './presidencia-replay-3d'
/** Explicit saved replay only. Does not publish a live fixture or save results. */
export function FonteReplayCampo2D({frame,source}:{frame:EstadoPartidaEstadio;source:FonteReplay3D}){
 const input=frame.officialInput;if(!input)return null
 const roundKey=[...frame.context.id].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7)
 return <div hidden aria-hidden="true" data-fonte-replay-campo2d><Campo2D key={frame.context.id} mapOnly mapMatchId={frame.context.id} roundKey={roundKey} minuto={frame.minute} roundMs={(frame.officialMinuteMs??source.minuteMs)*93/.82} pausado={frame.paused} fechado={frame.finished} gols={[...source.goals]}
  casa={{nome:frame.officialTeams?.[0]??'Casa',cor:frame.homeColor,cartas:input.casa}} fora={{nome:frame.officialTeams?.[1]??'Fora',cor:frame.awayColor,cartas:input.fora}}
  motorExperimental={()=>novoMotor2(input,false) as never} climaForcado={input.clima}/></div>
}
