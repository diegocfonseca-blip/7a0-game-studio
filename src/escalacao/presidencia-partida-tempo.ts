/** Watching a pitch needs enough physical time for the 22 players to play.
 * The selected speed scales the shared simulation, including its incidents. */
export const DURACAO_CAMPO_MS = 120_000
export function duracaoPartidaCampo(roundMs:number,speed:number,watching:boolean){
 const rate=Number.isFinite(speed)?Math.max(.25,Math.min(8,speed)):1
 return Math.max(400,roundMs*.82,watching?DURACAO_CAMPO_MS/rate:0)
}

/** Stop at the next official event before another tick can reveal its result.
 * Held time is discarded, not caught up after the physical play ends. */
export function avancarMinutoCampo(minute:number,deltaMs:number,durationMs:number,{held=false,nextGoal=93,half=93}:{held?:boolean;nextGoal?:number;half?:number}={}){
 if(held)return minute
 return Math.max(minute,Math.min(93,half,nextGoal,minute+Math.max(0,deltaMs)*93/Math.max(1,durationMs)))
}
