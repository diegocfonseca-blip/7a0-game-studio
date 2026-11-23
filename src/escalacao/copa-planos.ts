import {DEFAULT_FOOTBALL_PLAN,validFootballPlan,type FootballPlan} from './football-live-tactics'
import type {QualTatica,TaticaCopa} from './copa-taticas'
import type {Entrant} from './copa-mundo'

export type CupPlanRow={id:string;uid:string;step:number;from:number;seq:number;plan:FootballPlan}
export type CupPlanTactics=QualTatica&{plans?:{rows:CupPlanRow[];uids:(string|undefined)[]}}
export function cupPlanAt(rows:CupPlanRow[],uid:string|undefined,step:number,fallback:TaticaCopa='equilibrio'):FootballPlan{
 let last:CupPlanRow|undefined
 for(const row of rows)if(uid&&row.uid===uid&&(row.step<step||row.step===step&&row.from===0)&&validFootballPlan(row.plan)&&(!last||row.seq>last.seq))last=row
 return last?{...last.plan,mark:null}:{...DEFAULT_FOOTBALL_PLAN,posture:fallback}
}
export function withCupPlans(legacy:QualTatica|undefined,rows:CupPlanRow[],uids:(string|undefined)[]):CupPlanTactics|undefined{
 if(!rows.length)return legacy
 const safe=rows.filter(r=>Number.isInteger(r.step)&&r.step>=0&&Number.isInteger(r.seq)&&r.seq>=0&&r.from>=0&&r.from<93&&validFootballPlan(r.plan)&&r.plan.mark===null)
 if(!safe.length)return legacy
 const fn:CupPlanTactics=(time,step)=>cupPlanAt(safe,uids[time],step,legacy?.(time,step)).posture
 fn.plans={rows:safe,uids};return fn
}
const rngFor=(seed:number,key:string)=>{
 for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),0x01000193)>>>0
 return()=>{seed|=0;seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
}
export function cupPlanModifiers(plan:FootballPlan,team:Entrant){
 const avg=(sec?:string)=>{const cards=team.xi.filter(c=>!sec||sec.includes(c.sec));return cards.length?cards.reduce((s,c)=>s+(c.lo+c.hi)/2,0)/cards.length:team.str}
 let attack=0,defence=0
 if(plan.attack==='middle'){attack+=(avg('MEI')-avg())*.09;defence-=.5}
 if(plan.attack==='wings'){attack+=(avg('LAT ATA')-avg())*.09;defence-=.5}
 if(plan.pressure==='high'){attack+=2.5;defence-=3}
 if(plan.pace==='fast'){attack+=2;defence-=2}
 if(plan.pace==='slow'){attack-=1.5;defence+=1.5}
 return{attack,defence}
}
type Event={name:string;min:number;home:boolean;assist?:string}
/** Only unshown events change. The tournament's RNG is never advanced here. */
export function applyCupPlans<T extends Event>(tat:QualTatica|undefined,h:number,a:number,step:number,seed:number,key:string,initial:{g:[number,number];ev:T[];r:()=>number},draw:(home:FootballPlan,away:FootballPlan,r:()=>number)=>{g:[number,number];ev:T[]}){
 const data=(tat as CupPlanTactics|undefined)?.plans
 if(!data)return null
 let home=cupPlanAt(data.rows,data.uids[h],step,tat?.(h,step)),away=cupPlanAt(data.rows,data.uids[a],step,tat?.(a,step))
 const orders=data.rows.filter(o=>o.step===step&&o.from>0&&(o.uid===data.uids[h]||o.uid===data.uids[a])).sort((x,y)=>x.seq-y.seq)
 const extra=(p:FootballPlan)=>p.attack!=='mixed'||p.pressure!=='normal'||p.pace!=='normal'
 if(!extra(home)&&!extra(away)&&!orders.length)return null
 let result=initial
 const candidate=(suffix:string)=>{const r=rngFor(seed,`${key}|${JSON.stringify(home)}|${JSON.stringify(away)}|${suffix}`);return{...draw(home,away,r),r}}
 if(extra(home)||extra(away))result=candidate('base')
 for(const order of orders){
  if(order.uid===data.uids[h])home=order.plan;else away=order.plan
  const next=candidate(order.id),ev=[...result.ev.filter(e=>e.min<=order.from),...next.ev.filter(e=>e.min>order.from)].sort((x,y)=>x.min-y.min)
  result={ev,g:[ev.filter(e=>e.home).length,ev.filter(e=>!e.home).length],r:next.r}
 }
 return result
}
