import type {StadiumSave} from './estadiodata'
import {STADIUM_SECTORS,sectorPct,hasExtra} from './estadiodata'
import {torcidaDoEstadio} from './loja'
import {estadioVisualValido} from './presidencia-estadio-validacao'

export type DiaEstadio={division?:string;support?:number;rain?:boolean;match?:'idle'|'playing'|'interval'}
/** Read-only visual sampling of the club's existing fanbase. Never changes income. */
export function publicoDoEstadio(st:StadiumSave|undefined,day:DiaEstadio={}){
 const valid=estadioVisualValido(st),save=valid?st:undefined
 const supporters=torcidaDoEstadio(save,day.division)
 const support=Number.isFinite(day.support)?Math.max(0,Math.min(100,day.support!)):50
 // Same attendance rule already displayed by StadiumTab.
 const sheltered=sectorPct(save,'camarote')>=100||hasExtra(save,'cober')||hasExtra(save,'retratil')
 const wet=!!day.rain&&!sheltered
 const attendance=Math.min(100,(wet?Math.max(20,support-32):support)+(hasExtra(save,'estacao')?8:0))
 const capacity=valid?STADIUM_SECTORS.reduce((n,s)=>n+Math.round(s.seats*sectorPct(save,s.k)/100),0):0
 const playing=day.match==='playing'||day.match==='interval'
 const strength=Math.min(1,Math.log1p(supporters/12000)/Math.log(16))
 const demand=strength*(.35+.65*attendance/100)
 const outside=valid?Math.min(6,Math.max(1,Math.round(1+demand*(playing?5:3)))):0
 // Distinguish supporting a club from attending: no spectators in empty stands.
 const inside=valid&&playing&&capacity>0?Math.min(6,Math.ceil(attendance/100*Math.min(6,capacity/10000))):0
 const cars=valid?Math.min(4,1+Math.round(demand*(playing?3:1))):0
 return {supporters,attendance,capacity,outside,inside,cars,playing,wet}
}
