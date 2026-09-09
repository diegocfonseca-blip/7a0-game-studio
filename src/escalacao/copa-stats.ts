import type {ScoreGoal} from './pyramidseason'
import type {simulaCopaMundo} from './copa-mundo'

/** Apenas partidas encerradas: não entrega gols nem passes de fases futuras. */
export function copaStats(world:ReturnType<typeof simulaCopaMundo>,step:number,finished:boolean){
 const goals=new Map<string,{name:string;team:number;total:number}>(),assists=new Map<string,{name:string;team:number;total:number}>()
 const add=(ev:ScoreGoal[]|undefined,h:number,a:number)=>{
  for(const e of ev??[]){
   const team=e.home?h:a
   for(const [name,map] of [[e.name,goals],[e.assist,assists]] as const){
    if(!name)continue
    const key=team+'|'+name,old=map.get(key)
    map.set(key,{name,team,total:(old?.total??0)+1})
   }
  }
 }
 const seen=(phase:number)=>step>phase||(step===phase&&finished)
 for(const g of world.groups)g.matches.forEach((rd,i)=>{if(seen(i+1))for(const m of rd)add(m.ev,m.h,m.a)})
 for(const [ties,phase] of [[world.qf,7],[world.sf,9]] as const)for(const t of ties){if(seen(phase))add(t.ev1,t.h,t.a);if(seen(phase+1))add(t.ev2,t.a,t.h)}
 if(seen(11))add(world.final.ev,world.final.h,world.final.a)
 const top=(map:typeof goals)=>[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,10)
 return{goals:top(goals),assists:top(assists)}
}
