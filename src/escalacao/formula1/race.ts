import {carById,driverById} from './catalog'
import {hash,type Team} from './auction'

export const LAPS=24
export const PIT_SECONDS=22
export type Tyre='soft'|'medium'|'hard'|'inter'
export type Pace='save'|'balanced'|'attack'
export const TYRES:Record<Tyre,{name:string;letter:string;color:string;wear:number;offset:number;note:string}>={
 soft:{name:'Macio',letter:'S',color:'#C2452F',wear:11,offset:-.85,note:'Mais rápido, mas exige paradas mais cedo.'},
 medium:{name:'Médio',letter:'M',color:'#FFC400',wear:7,offset:0,note:'Equilíbrio entre aderência e duração.'},
 hard:{name:'Duro',letter:'H',color:'#F4ECD6',wear:4.8,offset:.85,note:'Dura mais; perde tempo no começo do stint.'},
 inter:{name:'Intermediário',letter:'I',color:'#1B7A3D',wear:6,offset:0,note:'Para pista molhada; lento e desgasta no seco.'},
}
export type Plan={tyre:Tyre;pace:Pace}
export type RaceCar={id:string;teamId:number;driverId:string;carId:string;progress:number;tyre:Tyre;wear:number;pace:Pace;nextTyre:Tyre;pitTyre:Tyre|null;pitQueued:boolean;pitRemaining:number;stops:number;compounds:Tyre[];incidentRemaining:number;finishTime:number|null;penalty:number}
export type Race={seed:number;seconds:number;cars:RaceCar[];wetFrom:number;wetTo:number;wet:boolean;hadWet:boolean;finished:boolean;events:{id:number;text:string}[];eventId:number}
const chance=(r:Race,c:RaceCar,salt:string)=>hash(`${r.seed}:${c.id}:${Math.floor(c.progress)}:${salt}`)/4294967296
function announce(r:Race,text:string){r.eventId++;r.events=[{id:r.eventId,text},...r.events].slice(0,10)}
export function grid(r:Race):RaceCar[]{return[...r.cars].sort((a,b)=>r.finished?(a.finishTime!+a.penalty)-(b.finishTime!+b.penalty):a.finishTime!==null&&b.finishTime!==null?a.finishTime-b.finishTime:a.finishTime!==null?-1:b.finishTime!==null?1:b.progress-a.progress)}
export function createRace(seed:number,teams:Team[],plans:Record<string,Plan>,mixed=false):Race{
 if(teams.length<2||teams.some(t=>!t.car||t.drivers.length!==2)||new Set(teams.flatMap(t=>t.drivers)).size!==teams.length*2)throw new Error('Toda escuderia precisa de dois pilotos únicos e um carro.')
 const cars:RaceCar[]=teams.flatMap(t=>t.drivers.map((driverId,i)=>{
  const plan=plans[driverId]??{tyre:i===0?'medium':'hard',pace:'balanced'}
  return{id:`${t.id}:${driverId}`,teamId:t.id,driverId,carId:t.car!,progress:0,tyre:plan.tyre,wear:100,pace:plan.pace,nextTyre:plan.tyre,pitTyre:null,pitQueued:false,pitRemaining:0,stops:0,compounds:[plan.tyre],incidentRemaining:0,finishTime:null,penalty:0}
 }))
 const quality=(c:RaceCar)=>driverById(c.driverId).pace*.35+carById(c.carId).pace*.4+carById(c.carId).corners*.25+(hash(`${seed}:${c.id}:qualify`)%100)/100
 cars.sort((a,b)=>quality(b)-quality(a));cars.forEach((c,i)=>c.progress=-i*.002)
 return{seed,seconds:0,cars,wetFrom:mixed?540+seed%180:Infinity,wetTo:mixed?1100+seed%180:Infinity,wet:false,hadWet:false,finished:false,events:[{id:1,text:'Luzes apagadas! Duas máquinas por escuderia, uma corrida para decidir.'}],eventId:1}
}
export type Command={kind:'pace';pace:Pace}|{kind:'tyre';tyre:Tyre}|{kind:'pit'}
export function command(r:Race,id:string,order:Command):Race{
 const c=r.cars.find(c=>c.id===id)
 if(!c||c.teamId!==0||r.finished||c.finishTime!==null)return r
 if(order.kind==='pace'&&!['save','balanced','attack'].includes(order.pace))return r
 if(order.kind==='tyre'&&(!Object.hasOwn(TYRES,order.tyre)||c.pitRemaining>0))return r
 if(order.kind==='pit'&&(c.pitRemaining>0||c.progress>=LAPS-1))return r
 return{...r,cars:r.cars.map(c=>c.id!==id?c:{...c,...(order.kind==='pace'?{pace:order.pace}:order.kind==='tyre'?{nextTyre:order.tyre}:{pitQueued:!c.pitQueued})})}
}
function botStrategy(r:Race,c:RaceCar){
 if(c.teamId===0||c.pitRemaining>0||c.finishTime!==null||c.progress>=LAPS-1)return
 const lapsLeft=LAPS-Math.max(0,c.progress),needCompound=!r.hadWet&&new Set(c.compounds.filter(t=>t!=='inter')).size<2&&lapsLeft<4
 if((r.wet&&c.tyre!=='inter')||(!r.wet&&c.tyre==='inter')||c.wear<24||needCompound){
  c.nextTyre=r.wet?'inter':lapsLeft<7?'soft':c.tyre==='hard'?'medium':'hard';c.pitQueued=true
 }
 c.pace=c.wear<38?'save':c.wear>75&&lapsLeft<5?'attack':'balanced'
}
/** Um segundo virtual por passo: resultado independente de FPS e da velocidade da transmissão. */
export function tickRace(input:Race):Race{
 if(input.finished)return input
 const r:Race={...input,seconds:input.seconds+1,cars:input.cars.map(c=>({...c,compounds:[...c.compounds]}))},before=grid(input)
 const wet=r.seconds>=r.wetFrom&&r.seconds<r.wetTo
 if(wet!==r.wet){r.wet=wet;r.hadWet ||=wet;announce(r,wet?'Chuva em Interlagos! Avalie intermediários e a entrada nos boxes.':'A pista voltou a secar. Os pneus de seco recuperam a vantagem.')}
 for(const c of r.cars){
  if(c.finishTime!==null)continue
  const d=driverById(c.driverId),car=carById(c.carId)
  botStrategy(r,c)
  if(c.pitRemaining>0){c.pitRemaining--;if(c.pitRemaining===0){c.tyre=c.pitTyre!;c.pitTyre=null;c.wear=100;c.stops++;if(!c.compounds.includes(c.tyre))c.compounds.push(c.tyre);if(c.teamId===0)announce(r,`${d.short} saiu dos boxes com pneus ${TYRES[c.tyre].name.toLowerCase()}.`)}continue}
  if(c.incidentRemaining>0){c.incidentRemaining--;continue}
  const quality=car.pace*.38+car.corners*.24+d.pace*.26+d.craft*.12
  const grip=c.wear<35?((35-c.wear)/35)**2*6:0
  const weather=r.wet?(c.tyre==='inter'?0:15+(100-d.rain)*.08):c.tyre==='inter'?7:TYRES[c.tyre].offset
  const pace=c.pace==='attack'?-.9:c.pace==='save'?1.25:0
  const ahead=input.cars.filter(a=>a.id!==c.id&&a.finishTime===null&&a.pitRemaining===0&&a.progress>c.progress&&a.progress-c.progress<.012).length
  const traffic=ahead?(100-d.craft)*.035+(c.pace==='attack'?0:.2):0
  const lapTime=83+(98-quality)*.20+weather+grip+pace+traffic
  const step=1/lapTime,oldLap=Math.floor(c.progress),next=c.progress+step
  const wear=TYRES[c.tyre].wear*(c.pace==='attack'?1.45:c.pace==='save'?.72:1)*(1+(90-d.care)*.006+(90-car.tyres)*.004)*(!r.wet&&c.tyre==='inter'?1.8:1)
  c.wear=Math.max(0,c.wear-wear*step)
  if(next>=LAPS){c.progress=LAPS;
   c.finishTime=r.seconds-1+(LAPS-(next-step))/step
   if(!r.hadWet&&new Set(c.compounds.filter(t=>t!=='inter')).size<2)c.penalty=30
   if(c.teamId===0)announce(r,`${d.name} recebeu a bandeirada${c.penalty?' · +30s: faltou usar dois compostos de seco':''}.`)
  }else if(Math.floor(next)>oldLap&&next>0){
   c.progress=next
   if(c.pitQueued){c.progress=Math.floor(next);c.pitRemaining=PIT_SECONDS;c.pitTyre=c.nextTyre;c.pitQueued=false;if(c.teamId===0)announce(r,`${d.short} entrou nos boxes. A passagem completa custa ${PIT_SECONDS}s.`)}
   else if(chance(r,c,'mistake')<.004+(100-d.consistency)*.0008+(c.pace==='attack'?.025:0)){
    c.incidentRemaining=2+hash(`${r.seed}:${c.id}:${oldLap}:delay`)%4;if(c.teamId===0)announce(r,`${d.short} escapou da trajetória e perdeu ${c.incidentRemaining}s${c.pace==='attack'?' atacando':''}.`)
   }else if(chance(r,c,'mechanical')<(100-car.reliability)*.0007){
    c.incidentRemaining=3+hash(`${r.seed}:${c.id}:${oldLap}:mechanical-delay`)%5
    if(c.teamId===0)announce(r,`${d.short} perdeu ${c.incidentRemaining}s com uma falha breve no carro. A confiabilidade da máquina faz diferença.`)
   }
  }else c.progress=next
 }
 r.finished=r.cars.every(c=>c.finishTime!==null)
 const after=grid(r),leader=after[0]
 if(r.finished)announce(r,`Bandeirada final! ${driverById(leader.driverId).name} venceu em Interlagos.`)
 else if(before[0].id!==leader.id)announce(r,`${driverById(leader.driverId).name} assumiu a liderança!`)
 else{for(const c of after.filter(c=>c.teamId===0)){const old=before.findIndex(a=>a.id===c.id),now=after.findIndex(a=>a.id===c.id);if(now<old)announce(r,`${driverById(c.driverId).short} ganhou posição: agora é P${now+1}.`)}}
 return r
}
export function advanceRace(r:Race,seconds:number):Race{for(let i=0;i<Math.max(0,Math.min(7200,Math.floor(seconds)))&&!r.finished;i++)r=tickRace(r);return r}
export const POINTS=[25,18,15,12,10,8,6,4,2,1]
export function teamResults(r:Race,teams:Team[]){const order=grid(r);return teams.map(t=>({...t,points:order.reduce((sum,c,i)=>sum+(c.teamId===t.id?(POINTS[i]??0):0),0)})).sort((a,b)=>b.points-a.points||order.findIndex(c=>c.teamId===a.id)-order.findIndex(c=>c.teamId===b.id))}
