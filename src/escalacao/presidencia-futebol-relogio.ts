import {ancorarMinutoCampo,passoRelogioCampo,tempoCampo2D,type AncoraCampo} from './campo2d-relogio'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
/** Same measured cadence and interpolation as Campo2D. Camera-independent. */
export class RelogioCampo3D{
 private anchor:AncoraCampo|undefined
 private last=0
 private minute=0
 private baseMs=0
 sample(state:EstadoPartidaEstadio,now:number){
  const ms=Math.max(1,state.officialMinuteMs??1000)
  if(!this.anchor){this.anchor={min:state.minute,em:state.visualClock?.sampledAt??now,ms};this.minute=state.minute;this.last=now;this.baseMs=ms}
  if(ms!==this.baseMs){this.anchor.ms=ms;this.baseMs=ms}
  if(state.minute!==this.anchor.min)this.anchor=ancorarMinutoCampo(this.anchor,state.minute,state.visualClock?.sampledAt??now)
  const dt=Math.max(0,Math.min(250,now-this.last));this.last=now
  const from2D=tempoCampo2D(state.context.id,now)
  if(from2D!==undefined)return this.minute=from2D
  if(state.finished)return this.minute=passoRelogioCampo(this.minute,dt,now,this.anchor,true,ms)
  if(state.paused||!state.visualClock)return this.minute=state.minute
  if(!state.visualClock.running)return this.minute
  return this.minute=passoRelogioCampo(this.minute,dt,now,this.anchor,false,ms)
 }
}
