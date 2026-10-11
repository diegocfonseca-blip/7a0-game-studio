import type {StadiumSave} from './estadiodata'
export type AtletaEstadio={id:string;name:string;pos:string;fake?:boolean}
export type ContextoPartidaEstadio={id:string;stadium?:StadiumSave;home:readonly AtletaEstadio[];away:readonly AtletaEstadio[];homeSecondHalf?:readonly AtletaEstadio[];awaySecondHalf?:readonly AtletaEstadio[]}
export type GolEstadio={id:string;home:boolean;name:string;minute?:number;startedAt?:number;phase:'shot'|'confirmed'}
export type EstadoPartidaEstadio={context:ContextoPartidaEstadio;minute:number;homeScore:number;awayScore:number;goal?:GolEstadio;paused:boolean;finished:boolean;homeColor:string;awayColor:string}
export function escalaValida(players:readonly AtletaEstadio[]):boolean{
 return players.length===11&&new Set(players.map(p=>p.id)).size===11&&players.filter(p=>p.pos==='GOL').length===1&&players.every(p=>!p.fake&&p.id.trim()&&p.name.trim()&&['GOL','LAT','ZAG','MEI','ATA'].includes(p.pos))
}
export function atletasEmCampo(state:EstadoPartidaEstadio){
 const home=(state.minute>45||(state.minute===45&&!state.paused))&&state.context.homeSecondHalf?state.context.homeSecondHalf:state.context.home
 const away=(state.minute>45||(state.minute===45&&!state.paused))&&state.context.awaySecondHalf?state.context.awaySecondHalf:state.context.away
 if(!escalaValida(home)||!escalaValida(away))return []
 const second=(state.minute>45||(state.minute===45&&!state.paused))
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
/** Coreografia visual não resolve gols nem chama RNG. Só o evento confirmado
 * do LiveScoreCard decide rede, placar e celebração. */
export function quadroPartida(state:EstadoPartidaEstadio,seconds:number,shotProgress=0){
 const players=atletasEmCampo(state)
 const t=Number.isFinite(seconds)?Math.max(0,seconds):0
 const goal=state.goal,scorer=goal?players.find(p=>p.side===(goal.home?'home':'away')&&p.name===goal.name):undefined
 const goalSecondHalf=goal?.minute!==undefined?goal.minute>45:(state.minute>45||(state.minute===45&&!state.paused))
 const targetRight=(goal?.home??true)!==goalSecondHalf
 const positioned=state.minute>0
 const actors=players.map((p,i)=>{
  const dx=positioned&&!p.keeper?Math.sin(t*.45+i*1.7)*.018:0,dy=positioned&&!p.keeper?Math.sin(t*.6+i*.9)*.027:0
  let x=p.x+dx,y=p.y+dy
  return {...p,x:Math.max(.025,Math.min(.975,x)),y:Math.max(.04,Math.min(.96,y)),back:positioned&&!p.keeper&&Math.cos(t*.6+i*.9)<0,flip:positioned&&!p.keeper&&(Math.cos(t*.6+i*.9)<0?Math.cos(t*.45+i*1.7)<0:Math.cos(t*.45+i*1.7)>0),frame:positioned?Math.floor(t*7+i)%4:0}
 })
 const author=actors.find(p=>p.key===scorer?.key)
 const from=author?{x:author.x,y:author.y}:{x:.5,y:.5}
 const q=goal?.phase==='confirmed'?1:Math.max(0,Math.min(1,shotProgress))
 const rawX=from.x+((targetRight ? 1.012 : -.012)-from.x)*q
 const ball=goal?{x:goal.phase==='confirmed'?rawX:Math.max(.002,Math.min(.998,rawX)),y:from.y+(.5-from.y)*q,goalId:goal.id,inNet:goal.phase==='confirmed'}:
  {x:.5+Math.sin(t*.28)*.1,y:.5+Math.sin(t*.36)*.1,goalId:undefined,inNet:false}
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
