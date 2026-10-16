/** Tempo da apresentação de UM lance. O placar e o campo leem o mesmo objeto.
 * Não altera minuto, resultado, autoria ou estatísticas da simulação. */
import type {SequenciaLanceFutebol} from './presidencia-lance-sequencia.ts'
import type {PlanoFinalizacaoFutebol} from './presidencia-futebol-finalizacao.ts'
export type RelogioLance = {elapsedMs:number;sampledAt:number;rate:number;running:boolean}
export type PlanoLanceFutebol = {
 from:{x:number;y:number;z:number}
 author:{key:string;x:number;z:number}
 assist?:{key:string;x:number;z:number}
 approachMs:number
 passMs:number
 shotMs:number
 durationMs:number
 /** Optional physical presentation. Legacy plans retain the original fields. */
 sequence?:SequenciaLanceFutebol
 finishing?:PlanoFinalizacaoFutebol
}
export function tempoLance(clock:RelogioLance,now:number){
 return clock.elapsedMs+(clock.running?Math.max(0,now-clock.sampledAt)*clock.rate:0)
}
export function ajustarRelogioLance(clock:RelogioLance,now:number,rate:number,running:boolean){
 clock.elapsedMs=tempoLance(clock,now);clock.sampledAt=now
 clock.rate=Number.isFinite(rate)?Math.max(.25,Math.min(8,rate)):1;clock.running=running
}
/** Troca de velocidade e pausa preservam exatamente o trecho já percorrido. */
export function criarRelogioLance(now:number,rate=1,running=true):RelogioLance{
 const clock={elapsedMs:0,sampledAt:now,rate:1,running:false}
 ajustarRelogioLance(clock,now,rate,running);return clock
}
