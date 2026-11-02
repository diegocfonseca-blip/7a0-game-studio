import {duracaoPartidaCampo} from './presidencia-partida-tempo'
export type AncoraReplayCampo={startedAt:number;offset:number;paused:boolean;minuteMs:number}
/** Reuse the stadium viewing duration, rather than the cinema's quick clock. */
export function periodoReplayCampo(sourceMinuteMs:number,speed=1){return duracaoPartidaCampo(sourceMinuteMs*93/.82,speed,true)/93}
export function minutoReplayCampo(control:AncoraReplayCampo,now:number){return control.offset+(control.paused?0:Math.max(0,now-control.startedAt)/control.minuteMs)}
export function reancorarReplayCampo<T extends AncoraReplayCampo>(control:T,now:number,minuteMs=control.minuteMs):T{return{...control,offset:minutoReplayCampo(control,now),startedAt:now,minuteMs}}
