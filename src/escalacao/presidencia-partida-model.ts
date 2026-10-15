import type {StadiumSave} from './estadiodata'
import type {AgendaJogoComplexo} from './presidencia-complexo-jornada'
export type AtletaEstadio={id:string;name:string;pos:string;fake?:boolean}
export type ContextoPartidaEstadio={id:string;homeClubId?:number;awayClubId?:number;agenda?:AgendaJogoComplexo;speed?:number;stadium?:StadiumSave;home:readonly AtletaEstadio[];away:readonly AtletaEstadio[];homeBench?:readonly AtletaEstadio[];awayBench?:readonly AtletaEstadio[];homeSecondHalf?:readonly AtletaEstadio[];awaySecondHalf?:readonly AtletaEstadio[]}
export type GolEstadio={id:string;home:boolean;name:string;assist?:string;minute?:number;startedAt?:number;speed?:number;phase:'shot'|'confirmed'}
export type ChanceEstadio={id:string;home:boolean;minute:number;startedAt:number;speed?:number;outcome:'defendeu'|'trave'|'fora'|'isolou'}
export type EstadoPartidaEstadio={visualClock?:{seconds:number;sampledAt:number;running:boolean;rate?:number};context:ContextoPartidaEstadio;minute:number;homeScore:number;awayScore:number;goal?:GolEstadio;chance?:ChanceEstadio;paused:boolean;finished:boolean;homeColor:string;awayColor:string}
export function escalaValida(players:readonly AtletaEstadio[]):boolean{
 return players.length===11&&new Set(players.map(p=>p.id)).size===11&&players.filter(p=>p.pos==='GOL').length===1&&players.every(p=>!p.fake&&p.id.trim()&&p.name.trim()&&['GOL','LAT','ZAG','MEI','ATA'].includes(p.pos))
}
export function atletasEmCampo(state:EstadoPartidaEstadio){
 // A fila do placar pode terminar um lance de 45' com o relógio já em 46'.
 // Preserva os participantes e o lado desse lance até a apresentação terminar.
 const event=state.goal??state.chance
 const second=event?.minute!==undefined?event.minute>45:(state.minute>45||(state.minute===45&&!state.paused))
 const home=second&&state.context.homeSecondHalf?state.context.homeSecondHalf:state.context.home
 const away=second&&state.context.awaySecondHalf?state.context.awaySecondHalf:state.context.away
 if(!escalaValida(home)||!escalaValida(away))return []
 const team=(players:readonly AtletaEstadio[],side:'home'|'away')=>{
  const counts=new Map<string,number>(),seen=new Map<string,number>()
  players.forEach(p=>counts.set(p.pos,(counts.get(p.pos)??0)+1))
  return players.map(p=>{
   const i=seen.get(p.pos)??0;seen.set(p.pos,i+1)
   const x=({GOL:.045,ZAG:.19,LAT:.25,MEI:.34,ATA:.45} as Record<string,number>)[p.pos]
   const y=p.pos==='GOL'?.5:p.pos==='LAT'?(i%2?.9:.1):(i+1)/((counts.get(p.pos)??1)+1)
   const mirrored=(side==='away')!==second
   return {...p,key:side+':'+p.id,side,keeper:p.pos==='GOL',x:mirrored?1-x:x,y:mirrored?1-y:y}
  })
 }
 return [...team(home,'home'),...team(away,'away')]
}
/** Apoio visual entre eventos do motor. A bola percorre jogadores reais do XI
 * e fica nos pés durante o domínio; não cria registros de passe, posse ou gol.
 * O mesmo relógio e XI produzem o mesmo quadro em qualquer câmera. */
function bolaEmCirculacao(actors:ReturnType<typeof atletasEmCampo>,seconds:number){
 const pick=(side:'home'|'away',pos:string,index=0)=>{
  const team=actors.filter(p=>p.side===side&&!p.keeper),role=team.filter(p=>p.pos===pos)
  const candidates=role.length?role:team
  return candidates[index%candidates.length]
 }
 const route=[pick('home','LAT'),pick('home','MEI'),pick('home','ATA'),pick('home','MEI',1),pick('away','MEI'),pick('away','LAT',1),pick('away','MEI',1),pick('away','ATA'),pick('away','MEI',2),pick('home','MEI')].filter((p):p is NonNullable<typeof p>=>!!p)
 if(!route.length)return {x:.5,y:.5}
 const cycle=2.8,step=Math.floor(seconds/cycle),local=seconds-step*cycle
 const from=route[step%route.length],to=route[(step+1)%route.length]
 const progress=Math.max(0,Math.min(1,(local-.6)/1.3))
 return {x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress}
}
// Integral de |cos|: aproxima distância percorrida sem depender do FPS nem
// reiniciar a passada ao abrir outra câmera. Não é um motor físico de partida.
function arcoSeno(t:number){const turns=Math.floor(t/Math.PI),r=t-turns*Math.PI;return turns*2+(r<=Math.PI/2?Math.sin(r):2-Math.sin(r))}
/** Coreografia visual não resolve gols nem chama RNG. Só o evento confirmado
 * do LiveScoreCard decide rede, placar e celebração. */
export function quadroPartida(state:EstadoPartidaEstadio,seconds:number,shotProgress=0,chanceElapsed=0){
 const players=atletasEmCampo(state)
 const t=Number.isFinite(seconds)?Math.max(0,seconds):0
 const goal=state.goal,scorer=goal?players.find(p=>p.side===(goal.home?'home':'away')&&p.name===goal.name):undefined
 const goalSecondHalf=goal?.minute!==undefined?goal.minute>45:(state.minute>45||(state.minute===45&&!state.paused))
 const targetRight=(goal?.home??true)!==goalSecondHalf
 const positioned=state.minute>0
 const actors=players.map((p,i)=>{
  const dx=positioned&&!p.keeper?Math.sin(t*.45+i*1.7)*.018:0,dy=positioned&&!p.keeper?Math.sin(t*.6+i*.9)*.027:0
  let x=p.x+dx,y=p.y+dy
  const distance=.8*(.018*105*(arcoSeno(t*.45+i*1.7)-arcoSeno(i*1.7))+.027*68*(arcoSeno(t*.6+i*.9)-arcoSeno(i*.9)))
  return {...p,x:Math.max(.025,Math.min(.975,x)),y:Math.max(.04,Math.min(.96,y)),back:positioned&&!p.keeper&&Math.cos(t*.6+i*.9)<0,flip:positioned&&!p.keeper&&(Math.cos(t*.6+i*.9)<0?Math.cos(t*.45+i*1.7)<0:Math.cos(t*.45+i*1.7)>0),frame:positioned&&!p.keeper?Math.floor(distance/1.4*4+i)%4:0}
 })
 const author=actors.find(p=>p.key===scorer?.key)
 const assist=goal?.assist?actors.find(p=>p.side===(goal.home?'home':'away')&&p.name===goal.assist&&p.key!==author?.key):undefined
 const from=author?{x:author.x,y:author.y}:{x:.5,y:.5}
 const q=goal?.phase==='confirmed'?1:Math.max(0,Math.min(1,shotProgress))
 const shot=assist&&author?Math.max(0,(q-.25)/.75):q
 const rawX=from.x+((targetRight ? 1.012 : -.012)-from.x)*shot
 let ball:{x:number;y:number;goalId:string|undefined;inNet:boolean;elevation?:number;opacity?:number}=goal?{x:goal.phase==='confirmed'?rawX:Math.max(.002,Math.min(.998,rawX)),y:from.y+(.5-from.y)*shot,goalId:goal.id,inNet:goal.phase==='confirmed'}:
  {...(positioned?bolaEmCirculacao(actors,t):{x:.5,y:.5}),goalId:undefined,inNet:false}
 if(goal?.phase==='shot'&&assist&&author&&q<.25){const pass=q/.25;ball={x:assist.x+(author.x-assist.x)*pass,y:assist.y+(author.y-assist.y)*pass,goalId:goal.id,inNet:false}}
 if(!goal&&state.chance){
  const c=state.chance,right=c.home!==(c.minute>45),elapsed=Math.max(0,chanceElapsed),q=Math.min(1,elapsed/.6),after=Math.min(1,Math.max(0,(elapsed-.6)/.55))
  // A chance original só identifica a equipe. A apresentação usa um atleta
  // desse XI para apoiar a bola, sem registrar autoria/estatística inventada.
  const participant=players.filter(p=>!p.keeper&&p.side===(c.home?'home':'away')).sort((a,b)=>Math.hypot(a.x-(right?.55:.45),a.y-.5)-Math.hypot(b.x-(right?.55:.45),b.y-.5))[0]
  const start=actors.find(p=>p.key===participant?.key)??{x:.5,y:.5},end={x:right?.955:.045,y:.5}
  if(c.outcome==='trave'){end.x=right?1:0;end.y=.5-7.32/68/2}
  if(c.outcome==='fora'){end.x=right?1.025:-.025;end.y=.65}
  if(c.outcome==='isolou'){end.x=right?1.03:-.03}
  const flight=c.outcome==='isolou'?Math.min(1,elapsed/1.1):q
  ball={x:start.x+(end.x-start.x)*flight,y:start.y+(end.y-start.y)*flight,goalId:undefined,inNet:false}
  if(c.outcome==='defendeu'||c.outcome==='trave')ball.x+=(right?-.09:.09)*after
  if(c.outcome==='isolou'){ball.elevation=6*Math.max(0,(flight-.4)/.6);ball.opacity=1-Math.max(0,(flight-.6)/.4)*.85}
  if(c.outcome==='fora')ball.opacity=1-after
 }
 return {actors,ball,homeScore:state.homeScore,awayScore:state.awayScore}
}
/** Projeção bilinear: pés e bola compartilham a superfície real do gramado. */
export function projetarCampo(x:number,y:number,corners:readonly [readonly [number,number],readonly [number,number],readonly [number,number],readonly [number,number]]){
 const [tl,tr,bl,br]=corners,top=[tl[0]+(tr[0]-tl[0])*x,tl[1]+(tr[1]-tl[1])*x],bottom=[bl[0]+(br[0]-bl[0])*x,bl[1]+(br[1]-bl[1])*x]
 return {x:top[0]+(bottom[0]-top[0])*y,y:top[1]+(bottom[1]-top[1])*y}
}

/** Relógio recebido do placar; reabrir a câmera não inicia um chute novo. */
export function progressoChute(goal:GolEstadio|undefined,now:number,duration:number):number{
 if(!goal)return 0
 if(goal.phase==='confirmed')return 1
 if(goal.startedAt===undefined||![goal.startedAt,now,duration].every(Number.isFinite)||duration<=0)return 0
 return Math.max(0,Math.min(1,(now-goal.startedAt)/duration))
}

/** Tempo visual único publicado pelo placar, independente de abrir/fechar câmeras. */
export function tempoVisualPartida(state:EstadoPartidaEstadio,now:number,fallback=0):number{
 const clock=state.visualClock
 if(!clock)return fallback
 return clock.seconds+(clock.running?Math.max(0,now-clock.sampledAt)/1000*(clock.rate??1):0)
}
