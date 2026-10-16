/** Presentation geometry for an outcome already decided by the competition.
 * No random generator, match state, score or statistic is read or changed here.
 * Coordinates are metres: the goal line is x=±52.5, the posts z=±3.66 and
 * the crossbar y=2.44. `left`/`right` surfaces are relative to the attacker. */
export type PontoFinalizacaoFutebol = {x:number;y:number;z:number}
export type ResultadoFinalizacaoFutebol = 'goal'|'defendeu'|'trave'|'fora'|'isolou'
export type SuperficieFinalizacaoFutebol = 'rede'|'poste-esquerdo'|'poste-direito'|'travessao'|'fora'|'alto'|'defesa'
export type PlanoFinalizacaoFutebol = {
 id:string
 outcome:ResultadoFinalizacaoFutebol
 right:boolean
 from:PontoFinalizacaoFutebol
 target:PontoFinalizacaoFutebol
 /** Height above the straight segment, at its midpoint. */
 arcHeight:number
 /** Duration whose maximum instantaneous incoming speed is at most 28 m/s. */
 shotMs:number
 surface:SuperficieFinalizacaoFutebol
 rebound?:{normal:PontoFinalizacaoFutebol;velocity:PontoFinalizacaoFutebol;restitution:number}
}

const BALL_RADIUS=.11,POST_RADIUS=.06,GOAL_LINE=52.5,POST_Z=3.66,CROSSBAR_Y=2.44
const CONTACT_RADIUS=BALL_RADIUS+POST_RADIUS,GRAVITY=9.81,SHOT_SPEED=28
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v))
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
function unit(v:PontoFinalizacaoFutebol):PontoFinalizacaoFutebol{
 const length=Math.hypot(v.x,v.y,v.z)||1
 return {x:v.x/length,y:v.y/length,z:v.z/length}
}
function hash(id:string,salt:string){
 let h=2166136261
 for(const c of `${id}|${salt}`){h^=c.codePointAt(0)!;h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16
 return h>>>0
}
const variation=(id:string,salt:string)=>hash(id,salt)/4294967296

/** Reuse after replacing a neutral saved-shot target with actual glove contact. */
export function duracaoFinalizacaoFutebol(from:PontoFinalizacaoFutebol,target:PontoFinalizacaoFutebol,arcHeight:number){
 const dx=target.x-from.x,dz=target.z-from.z,dy=target.y-from.y,arc=Math.max(0,arcHeight)*4
 return Math.max(350,Math.max(Math.hypot(dx,dy+arc,dz),Math.hypot(dx,dy-arc,dz))/SHOT_SPEED*1000)
}
function incomingVelocity(plan:PlanoFinalizacaoFutebol,shotMs:number):PontoFinalizacaoFutebol{
 const duration=Math.max(1,shotMs)/1000
 return {x:(plan.target.x-plan.from.x)/duration,y:(plan.target.y-plan.from.y-4*plan.arcHeight)/duration,z:(plan.target.z-plan.from.z)/duration}
}
function reflect(velocity:PontoFinalizacaoFutebol,normal:PontoFinalizacaoFutebol,restitution:number):PontoFinalizacaoFutebol{
 const dot=velocity.x*normal.x+velocity.y*normal.y+velocity.z*normal.z
 return {x:velocity.x-(1+restitution)*dot*normal.x,y:velocity.y-(1+restitution)*dot*normal.y,z:velocity.z-(1+restitution)*dot*normal.z}
}

export function planejarFinalizacaoFutebol(id:string,outcome:ResultadoFinalizacaoFutebol,right:boolean,from:PontoFinalizacaoFutebol):PlanoFinalizacaoFutebol{
 const sign=right?1:-1,u=(salt:string)=>variation(id,`${outcome}:${salt}`)
 let target:PontoFinalizacaoFutebol,normal:PontoFinalizacaoFutebol|undefined
 let surface:SuperficieFinalizacaoFutebol,arcHeight=.08+u('arc')*.22
 if(outcome==='goal'){
  const choice=hash(id,'goal:placement')%8,wing=choice%2===0?-1:1
  const localZ=choice<4?wing*(2.0+u('width')*1.15):(u('width')*2-1)*2.2
  const y=choice<2?.14+u('height')*.25:choice<4?1.55+u('height')*.50:.35+u('height')*1.25
  // Enough clearance remains for the entire sphere at both posts and crossbar.
  target={x:sign*(GOAL_LINE+BALL_RADIUS),y,z:sign*localZ};surface='rede'
 }else if(outcome==='fora'){
  const side=hash(id,'wide:side')%2===0?-1:1
  const lineZ=sign*side*(4.4+u('width')*4.8),lineDistance=sign*GOAL_LINE-from.x
  // Select the miss at the goal line itself; a late lateral crossing must not
  // pass through the mouth first and be labelled wide only behind the goal.
  const factor=Math.abs(lineDistance)>.001?(sign*(GOAL_LINE+.4)-from.x)/lineDistance:1
  target={x:sign*(GOAL_LINE+.4),y:.14+u('height')*1.6,z:from.z+(lineZ-from.z)*factor};surface='fora'
 }else if(outcome==='isolou'){
  const lineY=3.25+u('height')*3.25,lineDistance=sign*GOAL_LINE-from.x
  const factor=Math.abs(lineDistance)>.001?(sign*(GOAL_LINE+.4)-from.x)/lineDistance:1
  target={x:sign*(GOAL_LINE+.4),y:from.y+(lineY-from.y)*factor,z:sign*(u('width')*2-1)*3.1};surface='alto';arcHeight=.2+u('arc')*.45
 }else if(outcome==='trave'){
  const choice=hash(id,'woodwork:surface')%3
  if(choice<2){
   const postZ=sign*(choice===0?-POST_Z:POST_Z)
   const y=.3+u('height')*1.65
   // The sphere meets the cylindrical post on its incoming side. This normal
   // reflects the horizontal incoming direction back into the field.
   normal=unit({x:from.x-sign*GOAL_LINE,y:0,z:from.z-postZ})
   target={x:sign*GOAL_LINE+normal.x*CONTACT_RADIUS,y,z:postZ+normal.z*CONTACT_RADIUS}
   surface=choice===0?'poste-esquerdo':'poste-direito';arcHeight=.04+u('arc')*.09
  }else{
   const localZ=(u('width')*2-1)*2.8
   normal=unit({x:from.x-sign*GOAL_LINE,y:from.y-CROSSBAR_Y,z:0})
   target={x:sign*GOAL_LINE+normal.x*CONTACT_RADIUS,y:CROSSBAR_Y+normal.y*CONTACT_RADIUS,z:sign*localZ}
   surface='travessao';arcHeight=.04+u('arc')*.09
  }
 }else{
  // The motor overrides this with its actual keeper-glove target. This fallback
  // is only suitable for planning a duration before a keeper pose is available.
  target={x:sign*50.6,y:1.08,z:sign*(u('width')*2-1)*1.4};surface='defesa'
 }
 const shotMs=duracaoFinalizacaoFutebol(from,target,arcHeight)
 const plan:PlanoFinalizacaoFutebol={id,outcome,right,from:{...from},target,arcHeight,shotMs,surface}
 if(normal){const restitution=.62;plan.rebound={normal,velocity:reflect(incomingVelocity(plan,shotMs),normal,restitution),restitution}}
 return plan
}

/** Height after impact, including small, progressively damped ground bounces. */
function fallingHeight(y:number,velocity:number,seconds:number){
 let left=Math.max(0,seconds),height=Math.max(BALL_RADIUS,y),vy=velocity
 for(let bounce=0;bounce<8;bounce++){
  const hit=(vy+Math.sqrt(vy*vy+2*GRAVITY*(height-BALL_RADIUS)))/GRAVITY
  if(left<=hit)return Math.max(BALL_RADIUS,height+vy*left-.5*GRAVITY*left*left)
  left-=hit;vy=(GRAVITY*hit-vy)*.38;height=BALL_RADIUS
  if(vy<.12)return BALL_RADIUS
 }
 return BALL_RADIUS
}

/** Sample the same trajectory used by the planner, including its first rebound.
 * The authoritative event still decides when the keeper/restart takes control.
 * This is a bounded presentation path, not a general rigid-body solver. */
export function amostrarFinalizacaoFutebol(plan:PlanoFinalizacaoFutebol,elapsedMs:number,shotMs=plan.shotMs):PontoFinalizacaoFutebol{
 const q=clamp(elapsedMs/Math.max(1,shotMs),0,1)
 if(elapsedMs<=shotMs)return {
  x:lerp(plan.from.x,plan.target.x,q),
  y:Math.max(BALL_RADIUS,lerp(plan.from.y,plan.target.y,q)+4*plan.arcHeight*q*(1-q)),
  z:lerp(plan.from.z,plan.target.z,q),
 }
 const seconds=(elapsedMs-shotMs)/1000,incoming=incomingVelocity(plan,shotMs)
 if(plan.outcome==='defendeu')return {...plan.target}
 if(plan.outcome==='goal'){
  // The net stops forward motion inside its two-metre depth. Goals can finish
  // high or in either corner and fall from there, never jump back to z=0.
  const direction=plan.right?1:-1,speed=Math.max(.01,direction*incoming.x),travel=1.45
  const stopTime=2*travel/speed,t=Math.min(seconds,stopTime)
  const advance=speed*t-speed/(2*stopTime)*t*t
  return {x:plan.target.x+direction*advance,y:Math.min(CROSSBAR_Y-CONTACT_RADIUS,fallingHeight(plan.target.y,incoming.y*.25,seconds)),z:clamp(plan.target.z+incoming.z*Math.min(seconds,.12)*.25,-POST_Z+CONTACT_RADIUS,POST_Z-CONTACT_RADIUS)}
 }
 const velocity=plan.rebound?reflect(incoming,plan.rebound.normal,plan.rebound.restitution):incoming
 // Out-of-play presentation ends in the recoverable apron. Increase damping
 // continuously from the actual impact velocity rather than clamp/teleport the
 // sphere at x=55, where a fetcher would otherwise chase an unreachable ball.
 // This guided tail also damps high misses in the air: it is deliberately a
 // presentation simplification, not realistic aerodynamic drag or a collision.
 let damping=.9
 if(plan.outcome==='fora'||plan.outcome==='isolou'){
  const roomX=Math.max(.01,54.6-Math.sign(velocity.x)*plan.target.x)
  const roomZ=Math.max(.01,35.6-Math.sign(velocity.z)*plan.target.z)
  damping=Math.max(damping,Math.abs(velocity.x)/roomX,Math.abs(velocity.z)/roomZ)
 }
 const travel=-Math.expm1(-damping*seconds)/damping
 return {x:plan.target.x+velocity.x*travel,y:fallingHeight(plan.target.y,velocity.y,seconds),z:plan.target.z+velocity.z*travel}
}
