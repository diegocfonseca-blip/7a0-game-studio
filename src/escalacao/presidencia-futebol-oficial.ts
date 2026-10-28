import {novoMotor2,type EntradaM2} from './motor2/carreira'
import {GOL_MEIO} from './motor2/fisica'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {FaseFutebol,QuadroFutebol} from './presidencia-futebol-motor'
import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D,type PontoRotacaoBola} from './presidencia-bola-rotacao'
import {GolApresentacao3D} from './presidencia-gol-apresentacao'
import {identidadeAtleta3D} from './presidencia-futebol-identidade'
import {descreverEntregaOficial3D,type EntregaOficial3D} from './presidencia-entrega-oficial'
import {ContextoOficial3D} from './presidencia-contexto-oficial'

/** Adapter only: the career's exact input owns decisions, ball, goals and roles.
 * No result is persisted here, and cameras never write into the match engine. */
export class FutebolOficial3D {
 private game:ReturnType<typeof novoMotor2>
 private input:EntradaM2
 private goalFinish=new GolApresentacao3D()
 private spinTick=0
 private spin:RotacaoBola3D
 private minute=0
 private referee={x:0,z:10,heading:0,distance:0,speed:0}
 private visualTime=0
 private travel=new Map<number,{x:number;y:number;distance:number}>()
 private context=new ContextoOficial3D()
 private deliveryKey:string|null=null
 // 🧤 25/10: o pulo do goleiro no 3D (só apresentação — o motor já decidiu defesa/gol; aqui só se desenha o voo até onde a bola vai)
 private dive:{id:number;key:string;x:number;z:number;y:number;tc:number;crossed:boolean;ax?:number;az?:number;vertical?:boolean}|null=null
 /** 🤝 quadros desenhados depois do apito final: o relógio da partida para em 93', mas os 22 seguem andando pro meio-campo */
 private fimQuadros=0
 private delivery:EntregaOficial3D|undefined
 private observedKeeperEvents=0
 private keeperContacts:{t:number;name:string;side:number;ball:{x:number;y:number;z:number;vx:number;vy:number;vz:number}}[]=[]
 /** Read-only physical impact samples for the visual rig. Smoothed ball
  * positions lag a discontinuity and must not define a keeper's impact point. */
 keeperImpacts(){return this.keeperContacts.map(c=>({...c,ball:{...c.ball}}))}
 /** 〰️ 26/10 (Diego: "os jogadores meio que se tremendo"): o motor anda em passos de 1/20 s e o desenho ligava os pontos em linha
  *  reta — a velocidade mudava de uma vez a cada 3 quadros (medido: 11% dos quadros com tranco > 1 cm). Guardamos o ponto de DOIS
  *  passos atrás e o desenho passa por uma curva lisa (B-spline quadrática) — mesmo caminho, sem quina. Só apresentação. */
 private ante=new Map<number,{x:number;y:number}>()
 private anteBola:{x:number;y:number}|undefined
 private avanca(minuto:number){
  const g=this.game,t=g.t,ax=g.atl.map(a=>({x:a.ax??a.x,y:a.ay??a.y})),bx={x:g.bolaAnt.x??g.bola.x,y:g.bolaAnt.y??g.bola.y}
  g.avancaAte(minuto)
  if(g.t!==t){g.atl.forEach((a,i)=>this.ante.set(a.id,ax[i]));this.anteBola=bx}
 }
 constructor(input:EntradaM2){this.input=structuredClone(input);this.game=novoMotor2(this.input);this.spin=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,this.spinPoint())}
 private observeDelivery(){
  this.context.observe(this.game)
  const b=this.game.bola,l=b.lance
  while(this.observedKeeperEvents<this.game.eventos.length){const e=this.game.eventos[this.observedKeeperEvents++];if(['defesa','espalma','rebote'].includes(e.tipo))this.keeperContacts.push({t:e.t,name:e.a??'',side:e.lado,ball:{x:b.y-52.5,y:b.h+RAIO_BOLA_FUTEBOL_3D,z:b.x-34,vx:b.vy,vy:b.vh,vz:b.vx}})}
  if(!l){this.deliveryKey=null;this.delivery=undefined;return}
  const key=l.tipo+':'+l.de.id+':'+l.t0
  if(key===this.deliveryKey)return
  this.deliveryKey=key
  this.delivery=descreverEntregaOficial3D(l.tipo,{x:b.vy,y:b.vh,z:b.vx},b.h+RAIO_BOLA_FUTEBOL_3D,l.para?Math.hypot(l.para.x-b.x,l.para.y-b.y):null)
 }
 private hasRestartPlacement(){const g=this.game,b=g.bola,p=g.bolaAnt;return g.parada?.tipo==='saida'&&(Math.hypot(b.x-(p.x??b.x),b.y-(p.y??b.y))>2.5||g.atl.some(a=>Math.hypot(a.x-(a.ax??a.x),a.y-(a.ay??a.y))>2.5))}
 private spinPoint(time=0,commit=false):PontoRotacaoBola{
  const g=this.game,b=g.bola,a=g.entre,p=g.bolaAnt,mix=(old:number|undefined,n:number)=>old===undefined?n:old+(n-old)*a
  if(this.hasRestartPlacement())return{x:b.y-52.5,y:b.h+RAIO_BOLA_FUTEBOL_3D,z:b.x-34,held:true}
  const point={x:mix(p.y,b.y)-52.5,y:mix(p.h,b.h)+RAIO_BOLA_FUTEBOL_3D,z:mix(p.x,b.x)-34,held:!!b.dono&&b.h>.3,curl:b.giro??0}
  return this.goalFinish.sample(point,time,g.festa?g.eventos.findLast(e=>e.tipo==='gol'):undefined,commit).position
 }
 /** Chute a caminho: prevê onde a bola cruza a linha do goleiro e marca o voo dele (lado e altura). Bola no meio = sem pulo. */
 private keeperDive(time:number,key:(p:ReturnType<typeof novoMotor2>['atl'][number])=>string){
  const g=this.game,b=g.bola,l=b.lance
  if(l&&(l.tipo==='chute'||l.tipo==='cabeceio_gol')&&!l.defendido){
   const gk=g.atl.find(a=>a.lado!==l.de.lado&&a.grupo==='GOL');if(!gk||Math.abs(b.vy)<2)return
   const tc=(gk.y-b.y)/b.vy;if(tc<0||tc>1.6)return
   const xAt=b.x+b.vx*tc,hAt=Math.max(0,b.h+b.vh*tc-4.9*tc*tc),lat=Math.max(-2.7,Math.min(2.7,xAt-gk.x))
   if(Math.abs(xAt-34)>GOL_MEIO+1.6||(Math.abs(lat)<.9&&hAt<1.7))return
   const same=this.dive?.id===l.t0?this.dive:null
   // (🧤 o TIPO do pulo se decide UMA vez por chute — salto pra cima × mergulho de lado. Antes era recalculado a cada quadro a partir da
   // posição já misturada do goleiro e ele começava curvado pro lado e terminava pulando reto; filmado 25/10)
   this.dive={id:l.t0,key:key(gk),x:gk.y-52.5,z:gk.x+lat-34,y:Math.min(2.2,hAt),tc:time+tc,crossed:false,ax:same?.ax,az:same?.az,vertical:same?.vertical??(Math.abs(lat)<.6&&hAt>1.2)}
  }else if(this.dive&&!this.dive.crossed&&time>=this.dive.tc-.05)this.dive={...this.dive,crossed:true,tc:Math.min(time,this.dive.tc)}
  else if(this.dive&&!this.dive.crossed&&!l)this.dive={...this.dive,crossed:true,tc:time}
 }
 sample(state:EstadoPartidaEstadio,minute:number,options:{replay?:boolean;postMatchWalk?:boolean}={}):QuadroFutebol{
  const target=Number.isFinite(minute)?Math.max(0,minute):this.minute
  // Seeking backwards reconstructs the same deterministic game; no new seed.
  if(target<this.minute){this.game=novoMotor2(this.input);this.spinTick=0;this.fimQuadros=0;this.historico=[];this.goalFinish=new GolApresentacao3D();this.spin=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,this.spinPoint());this.travel.clear();this.context=new ContextoOficial3D();this.deliveryKey=null;this.delivery=undefined;this.observedKeeperEvents=0;this.keeperContacts=[];this.referee={x:0,z:10,heading:0,distance:0,speed:0};this.visualTime=target*90/93;this.dive=null;this.ante.clear();this.anteBola=undefined}
  this.minute=target
  // Canonical presentation samples on this SAME engine. Camera/FPS/seek order
  // cannot change panel orientation, event times or the number of matches.
  const time=target*90/93,tick=Math.floor(time*120+1e-9)
  while(this.spinTick<tick){this.spinTick++;this.avanca((this.spinTick/120)/(90/93));this.observeDelivery();this.spin.step(this.spinPoint(this.spinTick/120,true),1/120)}
  this.avanca(target)
  // (depois do apito o placar não anda mais, mas cada quadro desenhado leva o motor ~1/60 s adiante por até 45 s: é o tempo de os
  // jogadores chegarem ao meio-campo e se cumprimentarem. Contagem por quadro, não por relógio de parede: o mesmo em todo aparelho)
  if(this.game.fim&&options.postMatchWalk!==false){this.fimQuadros=Math.min(this.fimQuadros+1,45*60);this.avanca(target+(this.fimQuadros/60)/(90/93))}else this.fimQuadros=0
  this.observeDelivery()
  const rotation=this.spin.preview(this.spinPoint(time),Math.max(0,time-this.spinTick/120)).toArray() as [number,number,number,number]
  const placementReset=this.hasRestartPlacement(),g=this.game,alpha=g.entre,mix=(a:number|undefined,b:number)=>a===undefined?b:a+(b-a)*alpha
  // (〰️ curva lisa por 3 pontos — p(n-2), p(n-1), p(n); quem foi reposicionado (> 2 m num passo: cobrança, saída) fica na reta)
  const curva=(pp:{x:number;y:number}|undefined,ax:number|undefined,ay:number|undefined,x:number,y:number)=>{if(!pp||ax===undefined||ay===undefined||placementReset)return undefined;if(Math.hypot(ax-pp.x,ay-pp.y)>2||Math.hypot(x-ax,y-ay)>2)return undefined;const s=alpha,a=.5*(1-s)*(1-s),b=.5+s-s*s,c=.5*s*s;return {x:a*pp.x+b*ax+c*x,y:a*pp.y+b*ay+c*y}}
  const key=(p:typeof g.atl[number])=>identidadeAtleta3D(p.lado===0?'home':'away',p.nome,p.carta?.club,p.carta?.year)
  const players=g.atl.map(p=>{
   const side=p.lado===0?'home' as const:'away' as const
   const roster=side==='home'?[...state.context.home,...state.context.homeSecondHalf??[]]:[...state.context.away,...state.context.awaySecondHalf??[]]
   const card=roster.find(c=>c.name===p.nome),liso=curva(this.ante.get(p.id),p.ax,p.ay,p.x,p.y),mx=(liso?liso.y:mix(p.ay,p.y))-52.5,mz=(liso?liso.x:mix(p.ax,p.x))-34
   const speed=p.expulso?0:Math.hypot(p.vx,p.vy) // (depois do apito o motor leva todo mundo ANDANDO pro meio: a marcha segue a velocidade)
   const last=this.travel.get(p.id),distance=(last?.distance??0)+(last?Math.hypot(mx-last.x,mz-last.y):0)
   this.travel.set(p.id,{x:mx,y:mz,distance})
   return {id:card?.id??String(p.id),name:p.nome,pos:card?.pos??p.carta?.pos??(p.grupo==='GOL'?'GOL':'MEI'),key:key(p),side,keeper:p.grupo==='GOL',x:mx/105+.5,y:mz/68+.5,mx,mz,sourceAnchor:{x:mx,z:mz},
    heading:speed>.05&&!(p.grupo==='GOL'&&speed<3.4)?Math.atan2(p.vy,p.vx):Math.atan2(g.bola.y-p.y,g.bola.x-p.x),speed,distance, // (🧤 goleiro em passinho lateral encara a bola, não o passinho)
    kick:0,throwing:0,visible:!p.expulso,tacticalRole:p.papel,temporaryStopUntil:p.atordoado,presentation:placementReset?{x:p.y-52.5,z:p.x-34}:undefined}
  })
  this.keeperDive(time,key)
  if(this.dive){const d=this.dive,k=d.crossed?Math.max(0,time<d.tc+.45?1:1-(time-d.tc-.45)/.6):Math.min(1,Math.max(0,1-(d.tc-time)/.42)),p=players.find(q=>q.key===d.key);if(p&&k>0){const e=k*k*(3-2*k);d.ax??=p.mx;d.az??=p.mz;Object.assign(p,{mx:p.mx+(d.ax-p.mx)*e,mz:p.mz+(d.az-p.mz)*e,mergulho:{x:d.x,z:d.z,y:d.y,k:e,vertical:d.vertical,ax:d.ax,az:d.az}})};if(d.crossed&&k<=0)this.dive=null}
  const context=this.context.sample(time)
  const b=g.bola,previous=g.bolaAnt
  const action=b.lance?.tipo
  const phase:FaseFutebol=g.fim?'fim':g.festa?'gol':g.parada?.tipo==='falta'?'falta':g.parada?.tipo==='penalti'?'penalti':g.parada?.tipo==='saida'?'saida':g.parada?.tipo==='lateral'?'lateral':g.parada?.tipo==='escanteio'?'escanteio':g.parada?.tipo==='tiro_de_meta'?'tiro-de-meta':action==='chute'||action==='cabeceio_gol'?'finalizacao':action==='cruzamento'?'cruzamento':action==='lancamento'||action==='inversao'?'lancamento':action?'passe':'dominio'
  const dt=Math.max(0,Math.min(.25,time-this.visualTime));this.visualTime=time
  // (🧑‍⚖️ 25/10, filmado: o juiz ficava DENTRO do lance, encostado no drible, porque o alvo dele era quase a bola quando ela estava perto
  // do meio. Agora ele guarda pelo menos 9 m da bola — na diagonal, puxado pro centro, como um árbitro de verdade)
  if(dt>0){const watch=context.restart?.point??{x:b.y-52.5,z:b.x-34};let target=context.restart?{x:watch.x+(watch.x>0?-4:4),z:watch.z+(watch.z>0?-3:3)}:{x:watch.x*.78,z:watch.z*.55};if(!context.restart){const rx=target.x-watch.x,rz=target.z-watch.z,rd=Math.hypot(rx,rz);if(rd<9){const ux=rd>.01?rx/rd:(watch.x>0?-1:1)*.8,uz=rd>.01?rz/rd:(watch.z>0?-1:1)*.6,un=Math.hypot(ux,uz)||1;target={x:watch.x+ux/un*9,z:watch.z+uz/un*9}}}const dx=target.x-this.referee.x,dz=target.z-this.referee.z,length=Math.hypot(dx,dz),step=g.fim?0:Math.min(length*(1-Math.exp(-dt/.9)),7*dt);if(length>.001){this.referee.x+=dx/length*step;this.referee.z+=dz/length*step;this.referee.heading=Math.atan2(dx,dz)}
   // (e sai do caminho: jogador a menos de 3 m empurra o juiz pra longe — ele nunca fica no meio do drible nem "dentro" de alguém)
   let fx=0,fz=0;for(const q of players){const qx=this.referee.x-q.mx,qz=this.referee.z-q.mz,qd=Math.hypot(qx,qz);if(qd<3&&qd>1e-3){const w=(3-qd)/3;fx+=qx/qd*w;fz+=qz/qd*w}}
   const fn=Math.hypot(fx,fz);let fuga=0;if(fn>1e-6&&!g.fim){fuga=Math.min(fn,1)*6*dt;this.referee.x+=fx/fn*fuga;this.referee.z+=fz/fn*fuga}
   this.referee.x=Math.max(-54,Math.min(54,this.referee.x));this.referee.z=Math.max(-35,Math.min(35,this.referee.z));this.referee.speed=g.fim?0:(step+fuga)/dt;if(context.restart)this.referee.heading=Math.atan2(watch.x-this.referee.x,watch.z-this.referee.z);this.referee.distance+=step}
  // Initial/paused restart frames also face the real restart point.
  if(context.restart)this.referee.heading=Math.atan2(context.restart.point.x-this.referee.x,context.restart.point.z-this.referee.z)
  const bl=curva(this.anteBola,previous.x,previous.y,b.x,b.y),bX=(bl?bl.y:mix(previous.y,b.y))-52.5,bZ=(bl?bl.x:mix(previous.x,b.x))-34 // (〰️ a bola na mesma curva dos jogadores: o pé e a bola andam juntos)
  const presented=this.goalFinish.sample({x:bX,y:mix(previous.h,b.h)+.11,z:bZ},time,g.festa?g.eventos.findLast(e=>e.tipo==='gol'):undefined)
  const quadro:QuadroFutebol={players,ball:{x:bX,y:mix(previous.h,b.h)+.11,z:bZ,rotation,presentation:placementReset?{x:b.y-52.5,y:b.h+.11,z:b.x-34}:presented.impact?presented.position:undefined,netImpact:presented.impact},phase,restart:context.restart,incident:context.incident,incidents:context.incidents,placementReset:placementReset||undefined,owner:b.dono&&g.gkMao!==b.dono?key(b.dono):undefined,/* (🧤 bola na MÃO do goleiro: sem `owner`, senão a apresentação do Codex gruda a bola no pé dele) */officialAction:b.lance?{type:b.lance.tipo,actor:key(b.lance.de),receiver:b.lance.para?key(b.lance.para):undefined,startedAt:b.lance.t0,requiredContact:context.restartOrigin?.type==='lateral'?'hands':action==='cabeceio'||action==='cabeceio_gol'||b.lance?.golpe==='cabeca'?'head':'foot',restartOrigin:context.restartOrigin,delivery:this.delivery?{...this.delivery,velocity:[...this.delivery.velocity] as [number,number,number]}:undefined}:undefined,
   referee:{...this.referee},time,
   official:{score:[...g.placar],events:g.eventos.map(e=>({...e})),finished:g.fim}}
  quadro.ball.heldBy=g.gkMao?key(g.gkMao):undefined
  quadro.ball.velocity={x:b.vy,y:b.vh,z:b.vx}
  return options.replay===false?quadro:this.comReplay(quadro,time)
 }
 /** 🔁 REPLAY DO GOL (aprovado pelo Diego 25/10): guarda os últimos 4 s de quadros; na festa, dos 0,35 s aos 1,95 s, mostra de novo os
  *  2,4 s antes de a bola entrar (câmera lenta ~0,67×). Só apresentação — o motor, o placar e a festa seguem iguais; a câmera 'Atrás do
  *  gol' e o selo REPLAY entram pelo campo `replay` do quadro */
 private historico:QuadroFutebol[]=[]
 private comReplay(quadro:QuadroFutebol,time:number):QuadroFutebol{
  const g=this.game,h=this.historico
  if(!g.festa){if(!g.fim&&!quadro.placementReset&&(!h.length||h[h.length-1].time<time)){h.push(quadro);while(h.length&&h[0].time<time-4)h.shift()}return quadro}
  const e=time-(g.festa.ate-2.5),gol=g.eventos.findLast(ev=>ev.tipo==='gol')
  if(e<.35||e>1.95||!gol||h.length<2)return quadro
  const tr=gol.t-2.3+(e-.35)/1.6*2.4
  let q=h[0];for(const f of h){if(f.time<=tr)q=f;else break}
  return {...q,replay:true,official:quadro.official,incidents:quadro.incidents,incident:quadro.incident}
 }
}
