import {Campo2D} from './campo2d'
import {novoMotor2} from './motor2/carreira'
import {carimboDoTime} from './mascotes'
import {Escudo,nomeLimpo} from './escudos'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {FonteReplay3D} from './presidencia-replay-3d'
/** Explicit saved replay only. Does not publish a live fixture or save results. */
export function FonteReplayCampo2D({frame,source}:{frame:EstadoPartidaEstadio;source:FonteReplay3D}){
 const input=frame.officialInput;if(!input)return null
 // ⚽ 04/11: o replay salvo também mostra a festa do gol completa no mapa (mascote/escudo, igual ao jogo ao vivo)
 const lado=(nome:string,cor:string,cartas:typeof input.casa)=>({nome,cor,cartas,mascote:carimboDoTime(nomeLimpo(nome)),escudo:<Escudo nome={nome} size={110}/>})
 const roundKey=[...frame.context.id].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7)
 return <div hidden aria-hidden="true" data-fonte-replay-campo2d><Campo2D key={frame.context.id} mapOnly mapMatchId={frame.context.id} roundKey={roundKey} minuto={frame.minute} roundMs={(frame.officialMinuteMs??source.minuteMs)*93/.82} pausado={frame.paused} fechado={frame.finished} gols={[...source.goals]}
  casa={lado(frame.officialTeams?.[0]??'Casa',frame.homeColor,input.casa)} fora={lado(frame.officialTeams?.[1]??'Fora',frame.awayColor,input.fora)}
  motorExperimental={()=>novoMotor2(input,false) as never} climaForcado={input.clima}/></div>
}
