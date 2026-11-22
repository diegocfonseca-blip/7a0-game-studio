import {useSyncExternalStore} from 'react'
import type {EscState,MatchResult,MatchHighlight,Tactic,WonCard,ScorerRow,AssistRow} from './types'

export const FOOTBALL_LOCAL_ORDER=Symbol('football-local-order')
export const FOOTBALL_OWNER_UID='6b5cf422-d4ad-4c69-a7e6-da1125c85844'
// Only the test accounts already authorized by Diego can share experimental results.
const TEST_ACCOUNTS=new Set([FOOTBALL_OWNER_UID,'b068eff2-098f-4370-87de-3f90dd7b12f6','eb02f1d6-de80-4304-ab49-512342f3c7b7'])
export type FootballPlan={posture:Tactic;attack:'mixed'|'middle'|'wings';pressure:'normal'|'high';pace:'normal'|'slow'|'fast';mark:string|null}
export type FootballLive={revision:number;orders:{id:string;from:number;plan:FootballPlan;by:number}[]}
export const DEFAULT_FOOTBALL_PLAN:FootballPlan={posture:'equilibrio',attack:'mixed',pressure:'normal',pace:'normal',mark:null}
export type FootballClock={room:string;round:number;minute:number;at:number}
let clock:FootballClock|null=null
const clockListeners=new Set<()=>void>()
export function publishFootballClock(value:FootballClock){
 if(clock?.room===value.room&&clock.round===value.round&&clock.minute===value.minute)return
 clock=value;clockListeners.forEach(fn=>fn())
}
export function footballClock(){return clock}
export function useFootballClock(){return useSyncExternalStore(fn=>{clockListeners.add(fn);return()=>{clockListeners.delete(fn)}},()=>clock,()=>null)}
export function footballTestRoom(s:EscState){
 return s.onlineMode==='online'&&s.isHost&&s.youUid===FOOTBALL_OWNER_UID&&s.sport!=='basquete'&&!s.careerOnline&&!s.careerIntent&&!s.co2&&!s.pokeLiga
  &&!!s.roomId&&s.managers.every((m,i)=>!m.isHuman||TEST_ACCOUNTS.has(s.seatUids?.[i]??''))
}
export function validFootballPlan(value:unknown):value is FootballPlan{
 if(!value||typeof value!=='object')return false
 const p=value as FootballPlan
 return ['retranca','equilibrio','ataque'].includes(p.posture)&&['mixed','middle','wings'].includes(p.attack)&&['normal','high'].includes(p.pressure)&&['normal','slow','fast'].includes(p.pace)&&(p.mark===null||typeof p.mark==='string'&&p.mark.length<160)
}
export function planFor(s:EscState,id:number):FootballPlan{
 const saved=s.footballPlans?.[id]
 return saved&&validFootballPlan(saved)?{...saved,posture:s.tactics[id]??saved.posture}:{...DEFAULT_FOOTBALL_PLAN,posture:s.tactics[id]??'equilibrio'}
}
/** Small symmetric tradeoffs, in the same rating units as rollManagerForm. */
export function footballPlanModifiers(plan:FootballPlan,cards:WonCard[],opponent:WonCard[]){
 let attack=0,defence=0
 const avg=(rows:WonCard[])=>rows.length?rows.reduce((sum,c)=>sum+(c.lo+c.hi)/2,0)/rows.length:65
 const team=avg(cards),middle=avg(cards.filter(c=>c.pos==='MEI')),wide=avg(cards.filter(c=>c.pos==='LAT'||c.pos==='ATA'))
 if(plan.attack==='middle'){attack+=(middle-team)*.09;defence-=.5}
 if(plan.attack==='wings'){attack+=(wide-team)*.09;defence-=.5}
 if(plan.pressure==='high'){attack+=2.5;defence-=3}
 if(plan.pace==='fast'){attack+=2;defence-=2}
 if(plan.pace==='slow'){attack-=1.5;defence+=1.5}
 const mark=plan.mark&&opponent.some(c=>c.id===plan.mark)?plan.mark:null
 if(mark){attack-=.5;defence-=1}
 return{attack,defence,mark}
}
const goal=(h:MatchHighlight)=>h.kind==='gol'||h.kind!=='assist'&&/^⚽/.test(h.text)
export function mergeFootballFuture(old:MatchResult,next:MatchResult,after:number):MatchResult{
 const highlights=[...old.highlights.filter(h=>h.min<=after),...next.highlights.filter(h=>h.min>after)].sort((a,b)=>a.min-b.min)
 const presentationGoals=[...(old.presentationGoals??old.highlights.filter(goal)).filter(h=>h.min<=after),...(next.presentationGoals??next.highlights.filter(goal)).filter(h=>h.min>after)].sort((a,b)=>a.min-b.min)
 return{...old,highlights,presentationGoals,hg:highlights.filter(h=>goal(h)&&h.teamId===old.homeId).length,ag:highlights.filter(h=>goal(h)&&h.teamId===old.awayId).length}
}
/** Rebuild this match's contribution only; never subtract another match's goals. */
export function footballContributions(s:EscState,r:MatchResult){
 const scorers:ScorerRow[]=[],assists:AssistRow[]=[]
 for(const h of r.highlights){
  const isGoal=goal(h)
  const name=isGoal?h.text.match(/^⚽\s+(.+?) marca para /)?.[1]:h.text.match(/^🅰️\s+(.+?) deu o passe para /)?.[1]
  if(!name)continue
  const manager=s.managers.find(m=>m.id===h.teamId),card=manager?.squad.find(c=>c.name===name)
  if(card?.fake||card?.club==='Várzea'||card?.club==='Pickup')continue
  const teamName=(s.league.find(t=>t.id===h.teamId)??s.liberta?.times.find(t=>t.id===h.teamId)??s.champions?.times.find(t=>t.id===h.teamId))?.name??manager?.teamName??'?'
  if(isGoal){const row=scorers.find(x=>x.teamId===h.teamId&&x.name===name);if(row)row.goals++;else scorers.push({name,teamId:h.teamId,teamName,goals:1})}
  else{const row=assists.find(x=>x.teamId===h.teamId&&x.name===name);if(row)row.assists++;else assists.push({name,teamId:h.teamId,teamName,assists:1})}
 }
 return{s:scorers,a:assists}
}
