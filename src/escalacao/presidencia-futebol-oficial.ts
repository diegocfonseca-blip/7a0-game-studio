import {novoMotor2,type EntradaM2} from './motor2/carreira'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {FaseFutebol,QuadroFutebol} from './presidencia-futebol-motor'
import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D,type PontoRotacaoBola} from './presidencia-bola-rotacao'
import {identidadeAtleta3D} from './presidencia-futebol-identidade'

/** Adapter only: the career's exact input owns decisions, ball, goals and roles.
 * No result is persisted here, and cameras never write into the match engine. */
export class FutebolOficial3D {
 private game:ReturnType<typeof novoMotor2>
 private input:EntradaM2
 private spinTick=0
 private spin:RotacaoBola3D
 private minute=0
 private referee={x:0,z:10,heading:0,distance:0,speed:0}
 private visualTime=0
 private travel=new Map<number,{x:number;y:number;distance:number}>()
 constructor(input:EntradaM2){this.input=structuredClone(input);this.game=novoMotor2(this.input);this.spin=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,this.spinPoint())}
 private spinPoint():PontoRotacaoBola{
  const g=this.game,b=g.bola,a=g.entre,p=g.bolaAnt,mix=(old:number|undefined,n:number)=>old===undefined?n:old+(n-old)*a
  return{x:mix(p.y,b.y)-52.5,y:mix(p.h,b.h)+RAIO_BOLA_FUTEBOL_3D,z:mix(p.x,b.x)-34,held:!!b.dono&&b.h>.3}
 }
 sample(state:EstadoPartidaEstadio,minute:number):QuadroFutebol{
  const target=Number.isFinite(minute)?Math.max(0,minute):this.minute
  // Seeking backwards reconstructs the same deterministic game; no new seed.
  if(target<this.minute){this.game=novoMotor2(this.input);this.spinTick=0;this.spin=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,this.spinPoint());this.travel.clear();this.referee={x:0,z:10,heading:0,distance:0,speed:0};this.visualTime=target*90/93}
  this.minute=target
  // Canonical presentation samples on this SAME engine. Camera/FPS/seek order
  // cannot change panel orientation, event times or the number of matches.
  const time=target*90/93,tick=Math.floor(time*120+1e-9)
  while(this.spinTick<tick){this.spinTick++;this.game.avancaAte((this.spinTick/120)/(90/93));this.spin.step(this.spinPoint(),1/120)}
  this.game.avancaAte(target)
  const rotation=this.spin.preview(this.spinPoint(),Math.max(0,time-this.spinTick/120)).toArray() as [number,number,number,number]
  const g=this.game,alpha=g.entre,mix=(a:number|undefined,b:number)=>a===undefined?b:a+(b-a)*alpha
  const key=(p:typeof g.atl[number])=>identidadeAtleta3D(p.lado===0?'home':'away',p.nome,p.carta?.club,p.carta?.year)
  const players=g.atl.map(p=>{
   const side=p.lado===0?'home' as const:'away' as const
   const roster=side==='home'?[...state.context.home,...state.context.homeSecondHalf??[]]:[...state.context.away,...state.context.awaySecondHalf??[]]
   const card=roster.find(c=>c.name===p.nome),mx=mix(p.ay,p.y)-52.5,mz=mix(p.ax,p.x)-34
   const speed=p.expulso||g.fim?0:Math.hypot(p.vx,p.vy)
   const last=this.travel.get(p.id),distance=(last?.distance??0)+(last?Math.hypot(mx-last.x,mz-last.y):0)
   this.travel.set(p.id,{x:mx,y:mz,distance})
   return {id:card?.id??String(p.id),name:p.nome,pos:card?.pos??p.carta?.pos??(p.grupo==='GOL'?'GOL':'MEI'),key:key(p),side,keeper:p.grupo==='GOL',x:mx/105+.5,y:mz/68+.5,mx,mz,
    heading:speed>.05?Math.atan2(p.vy,p.vx):Math.atan2(g.bola.y-p.y,g.bola.x-p.x),speed,distance,
    kick:0,throwing:0,visible:!p.expulso,tacticalRole:p.papel}
  })
  const b=g.bola,previous=g.bolaAnt
  const action=b.lance?.tipo
  const phase:FaseFutebol=g.fim?'fim':g.festa?'gol':g.parada?.tipo==='falta'?'falta':g.parada?.tipo==='penalti'?'penalti':g.parada?.tipo==='saida'?'saida':g.parada?.tipo==='lateral'?'lateral':g.parada?.tipo==='escanteio'?'escanteio':g.parada?.tipo==='tiro_de_meta'?'tiro-de-meta':action==='chute'||action==='cabeceio_gol'?'finalizacao':action==='cruzamento'?'cruzamento':action==='lancamento'||action==='inversao'?'lancamento':action?'passe':'dominio'
  const dt=Math.max(0,Math.min(.25,time-this.visualTime));this.visualTime=time
  if(dt>0){const dx=(b.y-52.5)*.78-this.referee.x,dz=(b.x-34)*.55-this.referee.z,length=Math.hypot(dx,dz),step=g.fim?0:Math.min(length*(1-Math.exp(-dt/.9)),7*dt);if(length>.001){this.referee.x+=dx/length*step;this.referee.z+=dz/length*step;this.referee.heading=Math.atan2(dx,dz)}this.referee.speed=g.fim?0:step/dt;this.referee.distance+=step}
  return {players,ball:{x:mix(previous.y,b.y)-52.5,y:mix(previous.h,b.h)+.11,z:mix(previous.x,b.x)-34,rotation},phase,owner:b.dono?key(b.dono):undefined,
   referee:{...this.referee},time,
   official:{score:[...g.placar],events:g.eventos.map(e=>({...e})),finished:g.fim}}
 }
}
