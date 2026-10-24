import type {Motor2} from './motor2/motor'
import type {Evento} from './motor2/tipos'
import {identidadeAtleta3D} from './presidencia-futebol-identidade'

export type ReinicioOficial3D={id:string;type:string;side:'home'|'away';taker:string;takerName:string;point:{x:number;z:number};since:number;reason:string;incidentId?:string;requiredContact:'hands'|'foot'}
export type IncidenteOficial3D={id:string;type:Evento['tipo'];time:number;actor?:string;other?:string;offender?:string;victim?:string;sourceSide:'home'|'away';beneficiarySide?:'home'|'away';point:{x:number;z:number};namedMove?:string;relatedIncidentId?:string;techniqueAnimationValidated:false}
type KnownActor={key:string;name:string;side:0|1}
const side=(n:number):'home'|'away'=>n===0?'home':'away'
export const chaveAtletaOficial3D=(p:Motor2['atl'][number])=>identidadeAtleta3D(side(p.lado),p.nome,p.carta?.club,p.carta?.year)

/** Reads this SAME official game on canonical ticks. No decisions, contacts,
 * probabilities or events are added. Restart origin survives a generic passe. */
export class ContextoOficial3D{
 private known=new Map<string,KnownActor>()
 private eventCount=0
 private incident:IncidenteOficial3D|undefined
 private recent:IncidenteOficial3D[]=[]
 private restart:ReinicioOficial3D|undefined
 private origin:ReinicioOficial3D|undefined
 private actionKey:string|null=null
 private pending:ReinicioOficial3D|undefined
 private resolve(name:string|undefined,preferred:0|1){
  if(!name)return undefined
  const all=[...this.known.values()].filter(a=>a.name===name),preferredActors=all.filter(a=>a.side===preferred)
  return preferredActors.length===1?preferredActors[0].key:all.length===1?all[0].key:undefined
 }
 observe(g:Motor2){
  for(const p of g.atl){const key=chaveAtletaOficial3D(p);if(!this.known.has(key))this.known.set(key,{key,name:p.nome,side:p.lado})}
  for(let i=this.eventCount;i<g.eventos.length;i++){
   const e=g.eventos[i],advantage=e.tipo==='vantagem',actorSide=(advantage?1-e.lado:e.lado) as 0|1,otherSide=(1-actorSide) as 0|1,teammate=['passe','enfiada','lancamento','inversao','cruzamento','chutao','gol'].includes(e.tipo),hasActors=!['acrescimo','saida','intervalo','fim'].includes(e.tipo),actor=hasActors?this.resolve(e.a,actorSide):undefined,other=hasActors?this.resolve(e.b,teammate?actorSide:otherSide):undefined,foul=e.tipo==='falta'||advantage;
   this.incident={id:`${i}:${e.t}:${e.tipo}`,type:e.tipo,time:e.t,actor,other,offender:foul?actor:undefined,victim:foul?other:undefined,sourceSide:side(e.lado),beneficiarySide:foul?side(advantage?e.lado:1-e.lado):undefined,point:{x:(e.y??g.parada?.y??g.bola.y)-52.5,z:(e.x??g.parada?.x??g.bola.x)-34},namedMove:e.golpe,techniqueAnimationValidated:false}
   if(e.tipo==='amarelo'||e.tipo==='vermelho')this.incident.relatedIncidentId=this.recent.findLast(r=>r.offender===actor&&Math.abs(r.time-e.t)<.051)?.id
   this.recent.push(this.incident)
  }
  this.eventCount=g.eventos.length
  this.recent=this.recent.filter(e=>g.t-e.time<=2.1)
  const pa=g.parada
  if(pa){
   const id=`${pa.desde}:${pa.tipo}:${chaveAtletaOficial3D(pa.cobrador)}`
   if(this.restart?.id!==id){const trigger=this.recent.findLast(e=>Math.abs(e.time-pa.desde)<.051&&['falta','impedimento','lateral','escanteio','tiro_de_meta','gol','saida','intervalo','penalti'].includes(e.type));this.restart={id,type:pa.tipo,side:side(pa.lado),taker:chaveAtletaOficial3D(pa.cobrador),takerName:pa.cobrador.nome,point:{x:pa.y-52.5,z:pa.x-34},since:pa.desde,reason:trigger?.type??pa.tipo,incidentId:trigger?.id,requiredContact:pa.tipo==='lateral'?'hands':'foot'}}
   this.pending=this.restart
  }else this.restart=undefined
  const l=g.bola.lance,key=l?`${l.tipo}:${l.de.id}:${l.t0}`:null
  if(key!==this.actionKey){this.actionKey=key;this.origin=l&&this.pending&&chaveAtletaOficial3D(l.de)===this.pending.taker&&l.t0>=this.pending.since&&Math.abs(g.t-l.t0)<.051?this.pending:undefined}
  // A restart that was cancelled into possession must not be attached to a
  // later ordinary pass by the same athlete.
  if(!pa)this.pending=undefined
 }
 sample(time:number){const clone=(r:ReinicioOficial3D|undefined)=>r?{...r,point:{...r.point}}:undefined,incidents=this.recent.filter(e=>time-e.time<=2).map(e=>({...e,point:{...e.point}}));return{restart:clone(this.restart),restartOrigin:clone(this.origin),incident:incidents.at(-1),incidents}}
}
