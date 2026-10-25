import type {ImpactoRede3D} from './presidencia-gol-apresentacao'
import {RelogioCampo3D} from './presidencia-futebol-relogio'
import {atletasEmCampo,tempoVisualPartida,type EstadoPartidaEstadio} from './presidencia-partida-model.ts'
import {contatoLuvas3D,contatoPe3D,conduzirBola3D,separarBolaDosPes3D} from './presidencia-atleta-3d.ts'
import {GOL_ENTRA_MS} from './chances.ts'
import {tempoLance,type PlanoLanceFutebol} from './presidencia-lance-tempo.ts'
import {criarSequenciaLance,amostrarSequenciaLance} from './presidencia-lance-sequencia.ts'
import {amostrarFinalizacaoFutebol,type PlanoFinalizacaoFutebol} from './presidencia-futebol-finalizacao.ts'
import {FutebolOficial3D} from './presidencia-futebol-oficial'
import type {Evento} from './motor2/tipos'
import type {EntregaOficial3D} from './presidencia-entrega-oficial'
import type {ReinicioOficial3D,IncidenteOficial3D} from './presidencia-contexto-oficial'

/** Metros no plano X/Z. A apresentação nunca escreve resultados ou estatísticas. */
export type PontoFutebol={x:number;z:number}
export type JogadorFutebol=ReturnType<typeof atletasEmCampo>[number]&{mx:number;mz:number;heading:number;distance:number;speed:number;kick:number;throwing:number;throwPreparation?:number;save?:number;dive?:number;mergulho?:{x:number;z:number;y:number;k:number;vertical?:boolean;ax?:number;az?:number};control?:number;visible?:boolean;tacticalRole?:string;temporaryStopUntil?:number;presentation?:PontoFutebol}
export type FaseFutebol='dominio'|'passe'|'lancamento'|'cruzamento'|'lateral'|'escanteio'|'tiro-de-meta'|'saida'|'finalizacao'|'gol'|'falta'|'penalti'|'fim'
export type QuadroFutebol={players:JogadorFutebol[];ball:{x:number;y:number;z:number;rotation?:[number,number,number,number];presentation?:{x:number;y:number;z:number};netImpact?:ImpactoRede3D};phase:FaseFutebol;placementReset?:boolean;owner?:string;restart?:ReinicioOficial3D;incident?:IncidenteOficial3D;incidents?:IncidenteOficial3D[];officialAction?:{type:string;actor:string;receiver?:string;startedAt:number;requiredContact?:'foot'|'hands'|'head';delivery?:EntregaOficial3D;restartOrigin?:ReinicioOficial3D};referee:PontoFutebol&{heading:number;distance:number;speed:number};time:number;official?:{score:number[];events:Evento[];finished:boolean}}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const distance=(a:PontoFutebol,b:PontoFutebol)=>Math.hypot(a.x-b.x,a.z-b.z)
const point=(p:JogadorFutebol)=>({x:p.mx,z:p.mz})
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
const step=1/60
const goalImpact=52.5+.11 // The whole 22 cm ball must cross the goal line.
const turn=(from:number,to:number,limit=5*step)=>from+clamp(Math.atan2(Math.sin(to-from),Math.cos(to-from)),-limit,limit)
const contact=(p:JogadorFutebol,position:PontoFutebol,heading:number)=>contatoPe3D({...p,mx:position.x,mz:position.z,heading,speed:0,kick:.3,control:0,throwing:0,throwPreparation:0,save:0,dive:0})
function parried(id:string){
 // Real chance IDs end in 1 for home and 2 for away. Looking only at that last
 // digit made every home shot a parry and every away shot a catch.
 let hash=2166136261
 for(let i=0;i<id.length;i++)hash=Math.imul(hash^id.charCodeAt(i),16777619)
 hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15
 return ((hash>>>3)&1)===1
}
function reconcilePlayers(lineup:ReturnType<typeof atletasEmCampo>,previous:JogadorFutebol[]):JogadorFutebol[]{
 const outgoing=previous.filter(p=>!lineup.some(next=>next.key===p.key))
 return lineup.map(p=>{const index=outgoing.findIndex(a=>a.side===p.side&&a.pos===p.pos),continuing=previous.find(a=>a.key===p.key),old=continuing??(index>=0?outgoing.splice(index,1)[0]:undefined);return {...continuing,...p,mx:old?.mx??(p.x-.5)*105,mz:old?.mz??(p.y-.5)*68,heading:continuing?.heading??(p.x<.5?Math.PI/2:-Math.PI/2),distance:old?.distance??0,speed:continuing?.speed??0,kick:continuing?.kick??0,throwing:continuing?.throwing??0}})
}
/** Fixed-step model shared by cameras: decisions and trajectories do not depend on FPS.
 * Restarts here are presentation events, not additional match statistics. */
export class MotorFutebol {
 private players:JogadorFutebol[]=[]
 private time=0
 private tickIndex=0
 private nextDecision=2
 private serial=0
 private owner=''
 private firstTouch:{key:string;from:{x:number;y:number;z:number};start:number}|null=null
 private throwIn:{key:string;side:'home'|'away';receiver:string;target:PontoFutebol;start:number;from:{x:number;y:number;z:number}}|null=null
 private keeperRelease:{key:string;start:number}|null=null
 private phase:FaseFutebol='saida'
 private ball={x:0,y:.11,z:0}
 private flight:{from:PontoFutebol;to:PontoFutebol;start:number;duration:number;receiver?:string;restart?:FaseFutebol;side:'home'|'away';height:number;fromY:number}|null=null
 private restart:{point:PontoFutebol;side:'home'|'away';taker:string;recovery?:{stage:'fetch'|'pickup'|'carry'|'place';start:number;from:{x:number;y:number;z:number};fallSpeed:number}}|null=null
 private official:{id:string;from:PontoFutebol&{y:number};author:PontoFutebol;start:number;clockStart:number;right:boolean;name:string;side:'home'|'away';outcome:'goal'|'defendeu'|'trave'|'fora'|'isolou';parry:boolean;finishing?:PlanoFinalizacaoFutebol;lastShotElapsed?:number;keeper?:{key:string;point:PontoFutebol};assist?:{key:string;point:PontoFutebol}}|null=null
 private looseShot:{plan:PlanoFinalizacaoFutebol;elapsedMs:number;start:number;side:'home'|'away'}|null=null
 private recovery:{key:string;start:number;dive:number;heading:number;point:PontoFutebol}|null=null
 private lastOfficial=''
 private referee={x:0,z:10,heading:Math.PI,distance:0,speed:0}
 private lineup=''
 private stopped=false
 constructor(state:EstadoPartidaEstadio){
  this.syncLineup(state);this.stopped=state.finished
  if(state.finished){this.phase='dominio';return}
  this.prepareRestart('saida',{x:0,z:0},(this.players.find(p=>p.side==='home'&&p.keeper)?.x??0)>.5?'away':'home')
 }
 get aguardandoReinicio(){return !this.stopped&&this.phase==='saida'&&!!this.restart}
 private syncLineup(state:EstadoPartidaEstadio){
  const lineup=atletasEmCampo(state),sig=lineup.map(p=>p.key+':'+p.x).join('|')
  if(sig===this.lineup)return
  const oldHalf=this.players.find(p=>p.side==='home'&&p.keeper)?.x
  const releasingKeeper=this.players.find(p=>p.key===this.keeperRelease?.key)
  this.players=reconcilePlayers(lineup,this.players)
  this.lineup=sig
  if(!this.players.some(p=>p.key===this.owner))this.owner=''
  const newHalf=this.players.find(p=>p.side==='home'&&p.keeper)?.x
  if(oldHalf!==undefined&&newHalf!==undefined&&oldHalf!==newHalf){
   // The interval is a break in play, not 22 simultaneous runs through the
   // centre circle. In a compressed match that crossing consumed the entire
   // second half and froze everybody in a huddle at 93'. Resume with the new
   // XI already in its own half, as it is at the second-half whistle.
   this.official=null;this.recovery=null;this.ball={x:0,y:.11,z:0}
   for(const p of this.players){p.mx=(p.x-.5)*105;p.mz=(p.y-.5)*68;p.heading=p.x<.5?Math.PI/2:-Math.PI/2;p.speed=0;p.kick=0;p.throwing=0;p.control=0;p.save=0;p.dive=0}
   this.referee={x:0,z:10,heading:Math.PI,distance:this.referee.distance,speed:0}
   this.prepareRestart('saida',{x:0,z:0},newHalf<.5?'home':'away')
  }
  else if(this.keeperRelease&&releasingKeeper&&!this.players.some(p=>p.key===this.keeperRelease!.key)){
   const replacement=this.players.find(p=>p.keeper&&p.side===releasingKeeper.side)
   if(replacement){this.keeperRelease.key=replacement.key;this.owner=replacement.key;replacement.heading=releasingKeeper.heading}else this.keeperRelease=null
  }
  else if(this.throwIn&&(!this.players.some(p=>p.key===this.throwIn!.key)||!this.players.some(p=>p.key===this.throwIn!.receiver)))this.prepareRestart('lateral',this.throwIn.from,this.throwIn.side)
  else if(this.flight?.receiver&&!this.players.some(p=>p.key===this.flight!.receiver))this.prepareRestart('dominio',{x:this.ball.x,z:this.ball.z},this.flight.side)
  else if(this.restart&&!this.players.some(p=>p.key===this.restart!.taker))this.prepareRestart(this.phase,this.restart.point,this.restart.side)
 }
 private direction(side:'home'|'away'){return this.players.find(p=>p.side===side&&p.keeper)!.x<.5?1:-1}
 private prepareRestart(phase:FaseFutebol,p:PontoFutebol,side:'home'|'away'){
  this.phase=phase;this.flight=null;this.owner='';this.firstTouch=null;this.throwIn=null;this.keeperRelease=null;this.looseShot=null
  for(const player of this.players)player.throwPreparation=0
  // Dead-ball restarts retrieve the visible ball first. Moving it straight to
  // the centre/corner made it teleport by up to 53 metres after an official play.
  if(phase==='dominio')p={x:this.ball.x,z:this.ball.z}
  const recover=phase!=='dominio'&&(distance(this.ball,p)>.05||this.ball.y>.2)
  const candidates=this.players.filter(a=>(phase==='dominio'||a.side===side)&&(phase==='tiro-de-meta'?a.keeper:!a.keeper))
  const taker=candidates.sort((a,b)=>distance(point(a),recover?this.ball:p)-distance(point(b),recover?this.ball:p))[0]
  if(!taker)return
  this.restart={point:p,side:taker.side,taker:taker.key,...(recover?{recovery:{stage:'fetch' as const,start:this.time,from:{...this.ball},fallSpeed:0}}:{})};this.nextDecision=this.time+.8
 }
 private recoverRestart(){
  const restart=this.restart,recovery=restart?.recovery,p=this.players.find(a=>a.key===restart?.taker)
  if(!restart||!recovery||!p)return false
  const elapsed=this.time-recovery.start,smooth=(n:number)=>{const q=clamp(n,0,1);return q*q*(3-2*q)}
  if(recovery.stage==='fetch'){
   recovery.fallSpeed+=9.81*step
   this.ball.y=Math.max(.11,this.ball.y-recovery.fallSpeed*step)
   if(distance(point(p),this.ball)<.48&&this.ball.y<.2){recovery.stage='pickup';recovery.start=this.time;recovery.from={...this.ball}}
  }else if(recovery.stage==='pickup'){
   const q=smooth(elapsed/.45);p.save=q
   const hands=contatoLuvas3D({...p,save:q})
   this.ball={x:lerp(recovery.from.x,hands.x,q),y:lerp(recovery.from.y,hands.y,q),z:lerp(recovery.from.z,hands.z,q)}
   if(elapsed>=.45){recovery.stage='carry';recovery.start=this.time}
  }else if(recovery.stage==='carry'){
   p.save=1;this.ball=contatoLuvas3D({...p,save:1})
   if(distance(point(p),restart.point)<.42){recovery.stage='place';recovery.start=this.time;recovery.from={...this.ball}}
  }else{
   const q=smooth(elapsed/.45);p.save=1-q
   this.ball={x:lerp(recovery.from.x,restart.point.x,q),y:lerp(recovery.from.y,.11,q),z:lerp(recovery.from.z,restart.point.z,q)}
   if(elapsed>=.45){delete restart.recovery;p.save=0;this.nextDecision=this.time+.3}
  }
  return true
 }
 private keeperReleasePose(){
  const elapsed=this.time-(this.keeperRelease?.start??this.time)
  return elapsed<.25?lerp(1,.55,elapsed/.25):.55*(1-clamp((elapsed-.25)/.4,0,1))
 }
 private receive(p:JogadorFutebol){
  // Cushion the incoming ball from its actual position instead of snapping
  // it to whichever direction the receiver was running in.
  p.heading=Math.atan2(this.ball.x-p.mx,this.ball.z-p.mz)
  p.control=.32;p.speed=0;p.kick=0;p.throwing=0
  // Reception changes the boot pose on this very tick. Separate immediately,
  // before storing the cushion origin, rather than leaving one intersecting frame.
  if(this.ball.y<.35)this.ball=separarBolaDosPes3D(p,this.ball)
  this.firstTouch={key:p.key,from:{...this.ball},start:this.time}
  this.owner=p.key;this.flight=null;this.restart=null;this.looseShot=null;this.phase='dominio';this.nextDecision=this.time+.6
 }
 private launch(to:PontoFutebol,side:'home'|'away',receiver?:string,restart?:FaseFutebol,height=.15){
  const from={x:this.ball.x,z:this.ball.z},duration=Math.max(.3,distance(from,to)/18)
  this.flight={from,to,start:this.time,duration,receiver,restart,side,height,fromY:this.ball.y};this.phase='passe'
  const kicker=this.players.find(p=>p.key===this.owner);if(kicker){kicker.heading=Math.atan2(to.x-kicker.mx,to.z-kicker.mz);kicker.kick=kicker.throwing>0?0:.3}
  this.owner='';this.restart=null;this.firstTouch=null
 }
 private decide(){
  const p=this.players.find(a=>a.key===this.owner);if(!p)return
  const dir=this.direction(p.side),opponents=this.players.filter(a=>a.side!==p.side)
  // Favor reachable forward support, but play back when the passing lane is crowded.
  const candidates=this.players.filter(a=>a.side===p.side&&a.key!==p.key&&!a.keeper).map(a=>{
   const d=distance(point(p),point(a));let clearance=8
   for(const o of opponents){const vx=a.mx-p.mx,vz=a.mz-p.mz,q=clamp(((o.mx-p.mx)*vx+(o.mz-p.mz)*vz)/(d*d||1),0,1);clearance=Math.min(clearance,distance(point(o),{x:p.mx+vx*q,z:p.mz+vz*q}))}
   return {p:a,score:clearance*2+dir*(a.mx-p.mx)*.3-Math.abs(d-15)*.35+Math.sin(this.serial+a.mx)*.5+(this.serial%5===0?Math.abs(a.mz)*1.8:0)}
  }).sort((a,b)=>b.score-a.score)
  const crossTarget=Math.abs(p.mz)>20&&dir*p.mx>15?candidates.find(c=>c.p.pos==='ATA'&&dir*c.p.mx>20&&Math.abs(c.p.mz)<18)?.p:undefined
  const target=crossTarget??candidates[0]?.p;if(!target)return
  this.serial++
  // A blocked wing pass travels over the line before the opposing throw-in.
  const pressure=opponents.some(o=>distance(point(o),point(p))<2)
  if(pressure&&dir*p.mx>28){this.launch({x:dir*54,z:clamp(p.mz+5,-32,32)},p.side,undefined,'escanteio');return}
  if((pressure||this.serial%9===0)&&Math.abs(p.mz)>20){this.launch({x:clamp(p.mx+dir*4,-50,50),z:Math.sign(p.mz)*35},p.side,undefined,'lateral');return}
  const span=distance(point(p),point(target))
  const cross=Math.abs(p.mz)>20&&dir*p.mx>15&&Math.abs(target.mz)<Math.abs(p.mz)-6&&dir*target.mx>15
  const long=span>25
  this.launch(point(target),p.side,target.key,undefined,cross?Math.min(5,span*.1):long?Math.min(6,span*.075):.15)
  if(cross)this.phase='cruzamento'
  else if(long)this.phase='lancamento'
 }
 private tick(){
  this.time=++this.tickIndex*step
  const carrier=this.players.find(p=>p.key===this.owner)
  const possession=carrier?.side??this.flight?.side??this.restart?.side??this.looseShot?.side??this.official?.side??'home'
  const looseReceiver=this.looseShot?[...this.players].sort((a,b)=>distance(point(a),this.ball)-distance(point(b),this.ball))[0]:undefined
  // Pick one defender from the positions at the start of this simulation step.
  // Re-sorting the same team for each player wasted work at accelerated speed.
  let challenger:JogadorFutebol|undefined,closest=Infinity
  for(const p of this.players)if(p.side!==possession&&!p.keeper){const d=distance(point(p),this.ball);if(d<closest){closest=d;challenger=p}}
  for(const p of this.players){
   const recovering=this.recovery?.key===p.key&&this.time-this.recovery.start<.9?this.recovery:undefined
   const held=recovering?.point??(this.official?.name===p.key?this.official.author:this.official?.assist?.key===p.key?this.official.assist.point:this.official?.keeper?.key===p.key?this.official.keeper.point:undefined)
   if(held){p.mx=held.x;p.mz=held.z;p.speed=0;continue}
   const dir=this.direction(p.side),own=p.side===possession
   let tx=(p.x-.5)*105+clamp(this.ball.x*.22,-10,10),tz=(p.y-.5)*68+this.ball.z*.12
   if(p.key===looseReceiver?.key){tx=this.ball.x;tz=this.ball.z}
   else if(p.keeper){tx=(p.x<.5?-49:49);tz=clamp(this.ball.z*.13,-3,3)}
   else if(p.key===this.owner){
    tx=p.mx+dir*6;tz=p.pos==='LAT'&&dir*p.mx<30?p.mz:p.mz*.9
    // Keep the ball at the same player's feet while he changes running lane
    // around a marker. This is local evasive conduction, not a scored dribble.
    const marker=this.players.filter(a=>a.side!==p.side&&!a.keeper&&dir*(a.mx-p.mx)>-.5)
     .sort((a,b)=>distance(point(a),point(p))-distance(point(b),point(p)))[0]
    if(marker&&distance(point(marker),point(p))<3.5){
     const escape=Math.abs(p.mz)>29?-Math.sign(p.mz):Math.sign(p.mz-marker.mz)||(p.key.charCodeAt(p.key.length-1)%2?1:-1)
     tz=p.mz+escape*5
    }
   }
   else if(p.key===this.flight?.receiver){tx=this.flight.to.x;tz=this.flight.to.z}
   else if(!own){if(challenger===p){tx=this.ball.x-dir*.6;tz=this.ball.z}}
   else{tx+=dir*({ATA:28,MEI:18,LAT:15,ZAG:8}[p.pos]??5);tz+=Math.sign(tz||1)*2
    // A supporting full-back can overlap once the ball reaches the attacking
    // half. Without this run every winger stayed too deep to deliver a cross.
    if(p.pos==='LAT'&&dir*this.ball.x>12){tx+=dir*22;tz=Math.sign(tz||1)*29}
   }
   if(this.restart){
    if(this.restart.taker===p.key){const target=this.restart.recovery?.stage==='fetch'?this.ball:this.restart.point;tx=target.x;tz=target.z}
    else if(this.phase==='saida'){tx=(p.x-.5)*105;tz=(p.y-.5)*68}
   }
   if(this.restart&&this.restart.taker!==p.key&&p.side!==this.restart.side&&this.phase!=='dominio'){
    const r=this.phase==='lateral'?2:9.15,spot=this.restart.point
    const dx=p.mx-spot.x,dz=p.mz-spot.z,d=Math.hypot(dx,dz)
    // Keep the destination outside too: otherwise a player who has just left
    // the exclusion circle immediately runs back towards his formation slot,
    // and opposing players can oscillate forever instead of allowing kickoff.
    if(d<r||Math.hypot(tx-spot.x,tz-spot.z)<r+.15){const length=d||1;tx=spot.x+(d?dx/length:-this.direction(p.side))*(r+.5);tz=spot.z+(d?dz/length:0)*(r+.5)}
   }
   // Before kickoff, everyone except the taker returns to their own half.
   if(this.restart&&this.phase==='saida'&&this.restart.taker!==p.key)tx=dir>0?Math.min(tx,-.8):Math.max(tx,.8)
   tx=clamp(tx,-51,51);tz=clamp(tz,-33.5,33.5)
   if(this.restart?.taker===p.key){const target=this.restart.recovery?.stage==='fetch'?this.ball:this.restart.point;tx=target.x;tz=target.z}
   // Separation steers around bodies; no walking through another player's centre.
   for(const other of this.players){if(other===p)continue;const dx=p.mx-other.mx,dz=p.mz-other.mz,d=Math.hypot(dx,dz);if(d<1.2&&d>.001){tx+=(dx*3-dz*1.5)/d*(1.2-d);tz+=(dz*3+dx*1.5)/d*(1.2-d)}}
   const retrieving=this.restart?.taker===p.key?this.restart.recovery:undefined
   const stationary=retrieving&&(retrieving.stage==='pickup'||retrieving.stage==='place')
   const dx=tx-p.mx,dz=tz-p.mz,d=Math.hypot(dx,dz),v=stationary||(p.control??0)>0||p.throwing>0||this.throwIn?.key===p.key||this.keeperRelease?.key===p.key?0:Math.min(p.keeper?3:retrieving?.stage==='carry'?3.2:5.8,d*2)
   const carrying=p.key===this.owner&&!this.keeperRelease&&!this.throwIn
   const mayTurn=!stationary&&p.kick<=step&&p.throwing<=step&&this.throwIn?.key!==p.key&&this.keeperRelease?.key!==p.key&&(p.control??0)<=step
   if(carrying&&mayTurn&&d>.04)p.heading=turn(p.heading,Math.atan2(dx,dz))
   // A carrier runs along his facing direction and slows while turning. Moving
   // sideways/backwards at full speed left the guided ball over a metre behind.
   const aimed=carrying?v*Math.max(0,Math.cos(Math.atan2(dx,dz)-p.heading)):v
   const speed=carrying&&v>0?p.speed+clamp(aimed-p.speed,-8*step,6*step):aimed
   const travel=Math.min(d,speed*step)
   p.control=Math.max(0,(p.control??0)-step);p.speed=speed;p.kick=Math.max(0,p.kick-step);p.throwing=Math.max(0,p.throwing-step)
   if(d>.04){
    // A taker who recovered a ball outside the line walks back inside; losing
    // the recovery flag must not clamp his body instantly onto the touchline.
    const limitX=retrieving?55:Math.max(52.5,Math.abs(p.mx)),limitZ=retrieving?36:Math.max(34,Math.abs(p.mz))
    let nx=clamp(p.mx+(carrying?Math.sin(p.heading):dx/d)*travel,-limitX,limitX),nz=clamp(p.mz+(carrying?Math.cos(p.heading):dz/d)*travel,-limitZ,limitZ)
    // A proposed step is rejected before bodies overlap; steering chooses a bypass.
    const occupied=(x:number,z:number)=>Math.hypot(x-this.referee.x,z-this.referee.z)<.64||this.players.some(other=>other!==p&&Math.hypot(x-other.mx,z-other.mz)<.64)
    let blocked=occupied(nx,nz)
    // During a restart two players returning to opposite halves can meet head
    // on. A rejected forward step must still permit a clear side step; otherwise
    // both stand forever and the legal kickoff readiness check never succeeds.
    if(blocked&&this.restart&&!carrying&&travel>0){
     const angle=Math.atan2(dx,dz)
     for(const offset of [Math.PI/3,-Math.PI/3,Math.PI/2,-Math.PI/2]){
      const x=clamp(p.mx+Math.sin(angle+offset)*travel,-limitX,limitX),z=clamp(p.mz+Math.cos(angle+offset)*travel,-limitZ,limitZ)
      if(!occupied(x,z)){nx=x;nz=z;blocked=false;break}
     }
    }
    if(!blocked){const moved=Math.hypot(nx-p.mx,nz-p.mz);p.mx=nx;p.mz=nz;p.distance+=moved;p.speed=moved/step}else p.speed=0
    if(!carrying&&!stationary&&p.kick===0&&p.throwing===0&&this.throwIn?.key!==p.key&&this.keeperRelease?.key!==p.key&&(p.control??0)===0)p.heading=turn(p.heading,Math.atan2(dx,dz))
   }
   else if(!stationary&&p.kick===0&&p.throwing===0&&this.throwIn?.key!==p.key&&this.keeperRelease?.key!==p.key&&(p.control??0)===0)p.heading=turn(p.heading,Math.atan2(this.ball.x-p.mx,this.ball.z-p.mz))
  }
  if(this.keeperRelease){
   const p=this.players.find(a=>a.key===this.keeperRelease!.key)!
   const elapsed=this.time-this.keeperRelease.start,q=clamp((elapsed-.25)/.4,0,1)
   p.save=this.keeperReleasePose();p.speed=0;p.kick=0;p.control=0
   const hands=contatoLuvas3D({...p,save:elapsed<.25?p.save:.55})
   this.ball={x:lerp(hands.x,p.mx+Math.sin(p.heading)*.38,q),y:lerp(hands.y,.11,q*q),z:lerp(hands.z,p.mz+Math.cos(p.heading)*.38,q)}
   if(q===1){this.keeperRelease=null;p.save=0;p.control=.32;this.nextDecision=this.time+.6}
  }else if(this.throwIn){
   const pending=this.throwIn,p=this.players.find(a=>a.key===pending.key),receiver=this.players.find(a=>a.key===pending.receiver)
   if(!p||!receiver)this.prepareRestart('lateral',pending.from,pending.side)
   else{
    const q=clamp((this.time-pending.start)/.95,0,1)
    p.throwPreparation=q;p.speed=0;p.kick=0
    const hands=contatoLuvas3D(p)
    if(q<.25){
     const contact=contatoLuvas3D({...p,throwPreparation:.25}),t=q/.25,ease=t*t*(3-2*t)
     this.ball={x:lerp(pending.from.x,contact.x,ease),y:lerp(pending.from.y,contact.y,ease),z:lerp(pending.from.z,contact.z,ease)}
    }else this.ball={...hands}
    if(q===1){
     this.ball={...hands};p.throwPreparation=0;p.throwing=.6;this.owner=p.key;this.throwIn=null
     this.launch(pending.target,p.side,receiver.key,undefined,1.5);this.phase='lateral'
    }
   }
  }else if(this.looseShot){
   const loose=this.looseShot
   this.ball=amostrarFinalizacaoFutebol(loose.plan,loose.elapsedMs+(this.time-loose.start)*1000)
   const receiver=this.players.filter(p=>distance(point(p),this.ball)<.55).sort((a,b)=>distance(point(a),this.ball)-distance(point(b),this.ball))[0]
   if(receiver&&this.ball.y<.35)this.receive(receiver)
   else if(Math.abs(this.ball.z)>.11+34)this.prepareRestart('lateral',{x:clamp(this.ball.x,-52.5,52.5),z:Math.sign(this.ball.z)*34},loose.side==='home'?'away':'home')
   else if(Math.abs(this.ball.x)>goalImpact)this.prepareRestart('tiro-de-meta',{x:Math.sign(this.ball.x)*47,z:0},loose.side==='home'?'away':'home')
  }else if(this.restart&&!this.recoverRestart()){
   const p=this.players.find(a=>a.key===this.restart!.taker)!
   const ready=this.phase==='lateral'?this.players.every(a=>a.side===p.side||distance(point(a),this.restart!.point)>=2):this.phase!=='saida'||this.players.every(a=>a.key===p.key||(this.direction(a.side)*a.mx<=.05&&(a.side===p.side||distance(point(a),this.restart!.point)>=9.15)))
   if(ready&&distance(point(p),this.restart.point)<.45&&this.time>=this.nextDecision){
    const kind=this.phase;this.owner=p.key;this.restart=null;this.phase='dominio';this.nextDecision=this.time+.6
    if(kind==='dominio')this.receive(p)
    if(kind==='lateral'||kind==='escanteio'||kind==='tiro-de-meta'||kind==='saida'){
     const to=this.players.filter(a=>a.side===p.side&&a.key!==p.key&&!a.keeper).sort((a,b)=>Math.abs(distance(point(a),point(p))-14)-Math.abs(distance(point(b),point(p))-14))[0]
     if(to){if(kind==='lateral'){
      p.heading=Math.atan2(to.mx-p.mx,to.mz-p.mz);p.speed=0;p.kick=0
      this.throwIn={key:p.key,side:p.side,receiver:to.key,target:point(to),start:this.time,from:{...this.ball}};this.owner='';this.phase=kind
     }else{this.launch(point(to),p.side,to.key,undefined,kind==='escanteio'?3:kind==='tiro-de-meta'?2:.1);this.phase=kind}}
    }
   }
  }else if(this.flight){
   const f=this.flight,q=clamp((this.time-f.start)/f.duration,0,1)
   this.ball={x:lerp(f.from.x,f.to.x,q),z:lerp(f.from.z,f.to.z,q),y:lerp(f.fromY,.11,q)+Math.sin(q*Math.PI)*f.height}
   if(q>=1){
    this.flight=null
    if(f.restart){const other=f.side==='home'?'away':'home';this.prepareRestart(f.restart,{x:clamp(f.to.x,-52.5,52.5),z:f.restart==='escanteio'?Math.sign(f.to.z||1)*34:clamp(f.to.z,-34,34)},f.restart==='escanteio'?f.side:other)}
    else{const receiver=this.players.find(p=>p.key===f.receiver);if(receiver){this.restart={point:{...f.to},side:receiver.side,taker:receiver.key};this.phase='dominio';this.nextDecision=this.time+.15}}
   }else if(q>.25&&q<.9&&this.ball.y<.55){
    const interceptor=this.players.find(p=>p.side!==f.side&&!p.keeper&&distance(point(p),this.ball)<.55)
    if(interceptor){this.receive(interceptor);this.nextDecision=this.time+.7}
   }
  }else if(this.owner){
   const p=this.players.find(a=>a.key===this.owner)!
   this.ball=conduzirBola3D(p,this.firstTouch?undefined:this.ball,step)
   if(this.firstTouch?.key===p.key){
    const q=clamp((this.time-this.firstTouch.start)/.32,0,1),t=q*q*(3-2*q),from=this.firstTouch.from
    this.ball={x:lerp(from.x,this.ball.x,t),y:lerp(from.y,this.ball.y,t),z:lerp(from.z,this.ball.z,t)}
    if(q===1)this.firstTouch=null
   }
   if(this.ball.y<.35&&distance(point(p),this.ball)<1)this.ball=separarBolaDosPes3D(p,this.ball)
   if(this.time>=this.nextDecision)this.decide()
  }
  let tx=clamp(this.ball.x-9,-43,43),tz=clamp(this.ball.z+9,-27,27)
  for(const p of this.players){const dx=this.referee.x-p.mx,dz=this.referee.z-p.mz,d=Math.hypot(dx,dz);if(d<1.5&&d>.001){tx+=(dx*3-dz*2)/d*(1.5-d);tz+=(dz*3+dx*2)/d*(1.5-d)}}
  const d=distance(this.referee,{x:tx,z:tz}),v=Math.min(d,4.5*step)
  this.referee.speed=0
  if(d){const nx=this.referee.x+(tx-this.referee.x)/d*v,nz=this.referee.z+(tz-this.referee.z)/d*v;if(!this.players.some(p=>Math.hypot(nx-p.mx,nz-p.mz)<.64)){
   this.referee.heading=Math.atan2(nx-this.referee.x,nz-this.referee.z)
   this.referee.distance+=v;this.referee.speed=v/step;this.referee.x=nx;this.referee.z=nz
  }}
 }
 sample(state:EstadoPartidaEstadio,seconds:number,now:number):QuadroFutebol{
  const event=state.goal??state.chance
  this.stopped=state.finished&&!event
  // Reopening a completed match is a frozen view, never a newly simulated
  // kickoff. Keep the last physical frame when one exists; a cold view keeps
  // its valid distributed XI without sending anybody towards the ball.
  if(!this.stopped)this.syncLineup(state)
  if(this.players.length!==22)return {players:[],ball:{...this.ball},phase:this.phase,referee:{...this.referee},time:this.time}
  if(this.stopped)return {players:this.players.map(p=>({...p})),ball:{...this.ball},phase:this.phase,owner:this.owner||undefined,referee:{...this.referee},time:this.time}
  const target=Math.max(this.tickIndex,Math.floor(Math.max(0,seconds)*60+1e-7))
  if(event?.plan?.sequence){this.tickIndex=target;this.time=target*step}
  else while(this.tickIndex<target)this.tick()
  if(event&&this.official?.id!==event.id){
   this.firstTouch=null;this.keeperRelease=null;this.flight=null;this.restart=null;this.owner='';this.throwIn=null;this.looseShot=null
   for(const p of this.players){p.throwPreparation=0;p.throwing=0;p.kick=0;p.control=0}
   const side=event.home?'home':'away',name='name'in event?event.name:'',plan=event.plan,team=this.players.filter(p=>p.side===side)
   const scorerId='scorerId'in event?event.scorerId:undefined
   const author=team.find(p=>p.key===plan?.author.key)??team.find(p=>p.id===scorerId)??team.find(p=>p.name===name)??team.filter(p=>!p.keeper).sort((a,b)=>distance(point(a),this.ball)-distance(point(b),this.ball))[0]
   const assistId=state.goal&&'assistId'in state.goal?state.goal.assistId:undefined
   const assister=team.find(p=>p.key===plan?.assist?.key&&p.key!==author.key)??team.find(p=>p.id===assistId&&p.key!==author.key)??(state.goal?.assist?team.find(p=>p.name===state.goal!.assist&&p.key!==author.key):undefined)
   const plannedAuthor=plan?.author.key===author.key?plan.author:undefined
   this.official={id:event.id,from:plan?{...plan.from}:{...this.ball},author:plannedAuthor?{x:plannedAuthor.x,z:plannedAuthor.z}:point(author),name:author.key,start:event.startedAt??now,clockStart:seconds-Math.max(0,(state.visualClock?.running===false?state.visualClock.sampledAt:now)-(event.startedAt??now))*(event.speed??1)/1000,right:this.direction(side)>0,side,outcome:state.goal?'goal':state.chance!.outcome,parry:plan?.sequence?.parry??parried(event.id),assist:assister?{key:assister.key,point:plan?.assist?.key===assister.key?{x:plan.assist.x,z:plan.assist.z}:point(assister)}:undefined}
  }
  const previousKeeper=this.players.find(p=>(p.dive??0)!==0)
  const previousDive=previousKeeper?{key:previousKeeper.key,dive:previousKeeper.dive!,heading:previousKeeper.heading,point:point(previousKeeper)}:undefined
  for(const p of this.players){p.save=0;p.dive=0}
  let ball={...this.ball},phase=this.phase
  if(event?.plan?.sequence&&this.official){
   const e=this.official,sequence=event.plan.sequence,elapsed=event.clock?tempoLance(event.clock,now):Math.max(0,(now-e.start)*(event.speed??1))
   const frame=amostrarSequenciaLance(sequence,state.goal?.phase==='confirmed'?Math.max(elapsed,sequence.durationMs):elapsed)
   e.finishing=sequence.finishing;e.lastShotElapsed=elapsed-sequence.shotStartMs
   this.players=frame.players.map(p=>({...p}));this.ball={...frame.ball};this.referee={...frame.referee};this.phase=frame.phase;this.owner=frame.owner??''
   const author=this.players.find(p=>p.key===e.name);if(author)e.author=point(author)
   if(e.assist){const assist=this.players.find(p=>p.key===e.assist!.key);if(assist)e.assist.point=point(assist)}
   const keeper=this.players.find(p=>p.keeper&&p.side!==e.side);if(keeper)e.keeper={key:keeper.key,point:point(keeper)}
   this.lastOfficial=e.id
   // The event remains the score authority. Physics can reach the line in the
   // same RAF before React commits the confirmed flag, without inventing a goal.
   if(state.goal?.phase==='shot'&&frame.phase==='gol')frame.phase='finalizacao'
   return {...frame,time:this.time}
  }
  if(event&&this.official){
   const e=this.official,goal=state.goal
   const elapsed=event.clock?tempoLance(event.clock,now):state.visualClock?Math.max(0,(seconds-e.clockStart)*1000):Math.max(0,(now-e.start)*(event.speed??1))
   const duration=event.plan?.durationMs??(goal?GOL_ENTRA_MS:600)
   const q=goal?.phase==='confirmed'?1:clamp(elapsed/duration,0,1)
   const passEnd=event.plan?(event.plan.approachMs+event.plan.passMs)/duration:e.assist?.point ? .3 : .2
   const passing=q<passEnd,progress=passing?q/passEnd:(q-passEnd)/(1-passEnd)
   const afterImpact=Math.max(0,elapsed-duration)
   const outcome=state.chance?.outcome
   const end={x:(e.right?1:-1)*(goal?goalImpact:52.9),z:outcome==='fora'?8:outcome==='trave'?3.66:0}
   const keeper=this.players.find(p=>p.keeper&&p.side!==e.side)
   const smooth=(n:number)=>{const t=clamp(n,0,1);return t*t*(3-2*t)}
   const diveSide=e.right?1:-1
   if(keeper){
    if(outcome==='defendeu'){
     e.keeper??={key:keeper.key,point:point(keeper)}
     keeper.mx=e.keeper.point.x;keeper.mz=e.keeper.point.z
    }
    keeper.heading=Math.atan2(e.author.x-keeper.mx,e.author.z-keeper.mz)
    keeper.save=!passing?(outcome==='defendeu'?clamp((progress-.45)/.45,0,1):Math.sin(progress*Math.PI)*.45):0
    if(outcome==='defendeu'){
     keeper.speed=0;keeper.kick=0;keeper.throwing=0
     if(e.parry)keeper.dive=diveSide*smooth((progress-.45)/.55)*(1-smooth(afterImpact/900))
    }
   }
   // Fixed contact target at full extension: the rebound never follows the
   // keeper's hands as he gets up. Catches remain in his actual standing gloves.
   const hands=keeper?contatoLuvas3D({...keeper,speed:0,kick:0,throwing:0,save:1,dive:e.parry?diveSide:0}):undefined
   if(outcome==='defendeu'&&hands){end.x=hands.x;end.z=hands.z}
   if(outcome==='trave')end.x=e.right?52.34:-52.34
   const kickHeading=Math.atan2(end.x-e.author.x,end.z-e.author.z)
   const author=this.players.find(p=>p.key===e.name)!
   const kickContact=contact(author,e.author,kickHeading)
   const from=passing?e.from:kickContact,to=passing?kickContact:end
   ball={x:lerp(from.x,to.x,progress),z:lerp(from.z,to.z,progress),y:passing?lerp(e.from.y,.11,progress):.11+Math.sin(progress*Math.PI)*(outcome==='isolou'?7:.6)}
   const assistEnd=event.plan?event.plan.approachMs/duration:.1
   if(e.assist&&q<passEnd){
    const heading=Math.atan2(kickContact.x-e.assist.point.x,kickContact.z-e.assist.point.z)
    const assister=this.players.find(p=>p.key===e.assist!.key)!,assistContact=contact(assister,e.assist.point,heading)
    const first=q<assistEnd,ratio=first?q/assistEnd:(q-assistEnd)/(passEnd-assistEnd),a=first?e.from:assistContact,b=first?assistContact:kickContact
    ball={x:lerp(a.x,b.x,ratio),z:lerp(a.z,b.z,ratio),y:first?lerp(e.from.y,.11,ratio):.11}
   }
   if(outcome==='isolou'&&!passing)ball.y=.11+progress*5
   if(outcome==='trave'&&q>=1){const rebound=clamp(afterImpact/550,0,1);ball.x+=(e.right?-5:5)*rebound;ball.z=lerp(3.66,3,rebound)}
   if(outcome==='defendeu'&&!passing){ball.y=lerp(.11,hands?.y??1.08,progress)+Math.sin(progress*Math.PI)*.6}
   if(outcome==='defendeu'&&q>=1&&keeper&&hands){
    const rebound=clamp(afterImpact/600,0,1)
    ball=e.parry?{x:lerp(hands.x,e.right?53.5:-53.5,rebound),z:lerp(hands.z,8,rebound),y:lerp(hands.y,.11,rebound)}:{...hands}
   }
   if(goal?.phase==='confirmed'){
    // Confirmation uses the same contact point as the shot. Continue a short
    // distance into the net and decelerate instead of jumping 41 cm on impact.
    const net=clamp(afterImpact/160,0,1)
    ball={x:end.x+(e.right?1:-1)*(53.9-goalImpact)*(1-(1-net)**2),z:0,y:.11};phase='gol'
   }else phase='finalizacao'
   if(author){author.mx=e.author.x;author.mz=e.author.z;author.speed=0;author.control=0;author.heading=kickHeading;author.kick=!passing&&progress<.35?.3*(1-progress/.35):0}
   if(e.assist){const assister=this.players.find(p=>p.key===e.assist!.key);if(assister){assister.heading=Math.atan2(kickContact.x-assister.mx,kickContact.z-assister.mz);assister.speed=0;assister.kick=q>=assistEnd&&q<passEnd?.3*(1-(q-assistEnd)/(passEnd-assistEnd)):0}}
   // The next play starts from the ball that was actually shown. There is no
   // second hidden pass continuing underneath a goal or saved shot.
   this.ball={...ball}
   this.lastOfficial=e.id
  }else if(this.official){
   const old=this.official;this.official=null
   if(previousDive)this.recovery={...previousDive,start:this.time}
   // Same confirmed goal drives the centre restart, never a local score decision.
   if(this.lastOfficial===old.id){const other=old.side==='home'?'away':'home';if(old.outcome==='goal')this.prepareRestart('saida',{x:0,z:0},other);else if(old.outcome==='defendeu'&&old.parry)this.prepareRestart('escanteio',{x:old.right?52.5:-52.5,z:Math.sign(this.ball.z||old.finishing?.target.z||1)*34},old.side);else if(old.outcome==='defendeu'){
    // A caught save stays in play: the keeper settles it and distributes.
    const keeper=this.players.find(p=>p.side===other&&p.keeper)!
    this.owner=keeper.key;this.flight=null;this.restart=null;this.phase='dominio'
    this.firstTouch=null;this.throwIn=null;this.keeperRelease={key:keeper.key,start:this.time}
    keeper.control=0;keeper.kick=0;keeper.throwing=0;keeper.throwPreparation=0;keeper.speed=0;keeper.save=1
    this.ball=contatoLuvas3D(keeper);this.nextDecision=this.time+1.25
   }else if(old.outcome==='trave'&&old.finishing){
    this.looseShot={plan:old.finishing,elapsedMs:old.lastShotElapsed??old.finishing.shotMs+1300,start:this.time,side:old.side};this.owner='';this.flight=null;this.restart=null;this.phase='dominio'
   }else if(old.outcome==='trave')this.prepareRestart('dominio',{x:old.right?47:-47,z:3},other);else this.prepareRestart('tiro-de-meta',{x:old.right?47:-47,z:0},other);ball={...this.ball};phase=this.phase}
  }
  if(this.keeperRelease&&!event){const keeper=this.players.find(p=>p.key===this.keeperRelease!.key);if(keeper)keeper.save=this.keeperReleasePose()}
  if(this.restart?.recovery&&!event){
   const p=this.players.find(p=>p.key===this.restart!.taker),r=this.restart.recovery,q=clamp((this.time-r.start)/.45,0,1),smooth=q*q*(3-2*q)
   if(p)p.save=r.stage==='carry'?1:r.stage==='pickup'?smooth:r.stage==='place'?1-smooth:0
  }
  if(this.recovery){
   const r=this.recovery,t=clamp((this.time-r.start)/.9,0,1),keeper=this.players.find(p=>p.key===r.key)
   if(keeper&&!event&&t<1){keeper.mx=r.point.x;keeper.mz=r.point.z;keeper.heading=r.heading;keeper.speed=0;keeper.kick=0;keeper.throwing=0;keeper.save=1-t;keeper.dive=r.dive*(1-t*t*(3-2*t))}
   if(t>=1||event||!keeper)this.recovery=null
  }
  return {players:this.players.map(p=>({...p})),ball,phase,owner:this.owner||undefined,referee:{...this.referee},time:this.time}
 }
}
let active:{id:string;motor:MotorFutebol;state:EstadoPartidaEstadio}|undefined
let official:{id:string;signature:string;motor:FutebolOficial3D;clock:RelogioCampo3D;state:EstadoPartidaEstadio}|undefined
/** The match clock may hold its minute while the physical ball is retrieved
 * and the teams take legal kickoff positions. This does not advance the motor. */
export function aguardandoReinicioFutebol(id:string){return official?.id===id?false:active?.id===id&&active.motor.aguardandoReinicio}
export function quadroFutebol3D(state:EstadoPartidaEstadio,now:number){
 if(state.officialInput){
  const signature=JSON.stringify(state.officialInput)
  if(official?.id!==state.context.id||official.signature!==signature)official={id:state.context.id,signature,motor:new FutebolOficial3D(state.officialInput),clock:new RelogioCampo3D(),state}
  if((state.visualClock?.sampledAt??Infinity)>=(official.state.visualClock?.sampledAt??-Infinity))official.state=state
  const current=official.state
  return official.motor.sample(current,official.clock.sample(current,now))
 }
 if(active?.id!==state.context.id)active={id:state.context.id,motor:new MotorFutebol(state),state}
 // React can paint the old map prop once after the scoreboard publishes a new
 // event. That stale camera must not clear/recreate the shared official play.
 if((state.visualClock?.sampledAt??Infinity)>=(active.state.visualClock?.sampledAt??-Infinity))active.state=state
 const current=active.state
 return active.motor.sample(current,tempoVisualPartida(current,now),now)
}

/** Plan only already-due events. Distances come from the shared bodies, so a
 * forty-metre assist is not squeezed into the old ninety-millisecond slot.
 * This supplies presentation timing; the scoreboard remains the goal authority. */
export function planejarLanceFutebol(state:EstadoPartidaEstadio,event:{home:boolean;id?:string;scorerId?:string;assistId?:string;name?:string;assist?:string;outcome?:string;minute?:number},now:number):PlanoLanceFutebol|undefined{
 const frame=quadroFutebol3D(state,now),side=event.home?'home':'away'
 // An overdue 45' goal can be presented after the clock and XI entered 46'.
 // Match the incident's lineup to existing physical positions locally; asking
 // the shared motor to sample the old half here would rewind other cameras.
 const players=event.minute===undefined?frame.players:reconcilePlayers(atletasEmCampo(state,event.minute),frame.players)
 const author=players.find(p=>p.side===side&&p.id===(event.scorerId??event.id))??(event.name?players.find(p=>p.side===side&&p.name===event.name):undefined)
  ??players.filter(p=>p.side===side&&!p.keeper).sort((a,b)=>distance(point(a),frame.ball)-distance(point(b),frame.ball))[0]
 if(!author)return
 const assister=players.find(p=>p.side===side&&p.id===event.assistId&&p.key!==author.key)??(event.assist?players.find(p=>p.side===side&&p.name===event.assist&&p.key!==author.key):undefined)
 const right=players.find(p=>p.side===side&&p.keeper)!.x<.5
 const target={x:(right?1:-1)*(event.outcome?52.49:goalImpact),z:event.outcome==='fora'?8:event.outcome==='trave'?3.66:0}
 const heading=Math.atan2(target.x-author.mx,target.z-author.mz)
 const kickContact=contact(author,point(author),heading)
 const ah=assister?Math.atan2(kickContact.x-assister.mx,kickContact.z-assister.mz):0
 const assistContact=assister?contact(assister,point(assister),ah):undefined
 const approachMs=Math.max(200,Math.hypot(distance(frame.ball,assistContact??kickContact),frame.ball.y-.11)/18*1000)
 const passMs=assistContact?Math.max(250,distance(assistContact,kickContact)/20*1000):0
 const shotMs=Math.max(350,Math.hypot(distance(kickContact,target),event.outcome==='isolou'?5:0)/28*1000)
 const sequence=criarSequenciaLance({...frame,players},{authorKey:author.key,assistKey:assister?.key,right,outcome:event.outcome==='defendeu'||event.outcome==='trave'||event.outcome==='fora'||event.outcome==='isolou'?event.outcome:'goal',id:event.id??`${state.context.id}:${event.minute??state.minute}:${author.key}`,parry:parried(event.id??`${state.context.id}:${event.minute??state.minute}:${author.key}`)})
 if(sequence){
  const approach=sequence.boundaries.find(b=>b.kind==='pass')?.startMs??sequence.shotStartMs
  return {from:{...frame.ball},author:{key:author.key,...point(author)},...(assister?{assist:{key:assister.key,...point(assister)}}:{}),approachMs:approach,passMs:sequence.shotStartMs-approach,shotMs:sequence.durationMs-sequence.shotStartMs,durationMs:sequence.durationMs,sequence,finishing:sequence.finishing}
 }
 return {from:{...frame.ball},author:{key:author.key,...point(author)},...(assister?{assist:{key:assister.key,...point(assister)}}:{}),
  approachMs,passMs,shotMs,durationMs:approachMs+passMs+shotMs}
}
