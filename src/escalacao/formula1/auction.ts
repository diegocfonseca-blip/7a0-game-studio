import {CARS,DRIVERS,carById,driverById,type Category} from './catalog'

export const BUDGET=100
export type Team={id:number;name:string;coins:number;drivers:string[];car:string|null;color:string}
export type Bid={teamId:number;lotId:string;amount:number}
export type Sale={lotId:string;teamId:number;amount:number;kind:'driver'|'car'}
export type Auction={seed:number;round:0|1|2;attempt:number;teams:Team[];offers:string[];sales:Sale[];report:{bids:Bid[];sales:Sale[];won:boolean}|null;complete:boolean;error:string|null}
export function hash(text:string):number{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function rng(seed:number){let x=seed>>>0;return()=>{x=(x+0x6D2B79F5)|0;let z=Math.imul(x^(x>>>15),1|x);z^=z+Math.imul(z^(z>>>7),61|z);return((z^(z>>>14))>>>0)/4294967296}}
const categories:Category[]=['lenda','craque','promessa','bom','profissional','lenda','craque','bom']
function offers(a:Pick<Auction,'round'|'seed'|'attempt'|'teams'>):string[]{
 const random=rng(hash(`${a.seed}:${a.round}:${a.attempt}:offers`))
 const used=new Set(a.teams.flatMap(t=>a.round===2?(t.car?[t.car]:[]):t.drivers))
 const pool=(a.round===2?CARS:DRIVERS).filter(c=>!used.has(c.id)),result:string[]=[]
 for(const category of categories){const choices=pool.filter(c=>c.category===category&&!result.includes(c.id));if(choices.length)result.push(choices[Math.floor(random()*choices.length)].id)}
 for(const c of [...pool].sort((x,y)=>hash(`${a.seed}:${x.id}`)-hash(`${a.seed}:${y.id}`))){if(result.length>=8)break;if(!result.includes(c.id))result.push(c.id)}
 return result
}
export function createAuction(seed:number,name:string):Auction{
 const a:Auction={seed,round:0,attempt:0,teams:[name.trim().slice(0,24)||'Minha escuderia','Paddock Racing','Curva Um GP','Apex Motorsport'].map((name,id)=>({id,name,coins:BUDGET,drivers:[],car:null,color:['#FFC400','#7C3AED','#C2452F','#93a6a5'][id]})),offers:[],sales:[],report:null,complete:false,error:null}
 return{...a,offers:offers(a)}
}
export function needsLot(team:Team,round:number){return round===2?!team.car:team.drivers.length<=round}
export function maxBid(a:Auction,team=a.teams[0]){return Math.max(0,team.coins-(2-a.round))}
function botBid(a:Auction,team:Team,pool:string[],salt:number):Bid{
 const random=rng(hash(`${a.seed}:${a.round}:${a.attempt}:${team.id}:${salt}`))
 const rating=(id:string)=>a.round===2?carById(id).overall:driverById(id).overall
 const choices=pool.map(id=>({id,score:rating(id)+random()*24})).sort((x,y)=>y.score-x.score)
 const lotId=choices[0].id,quality=rating(lotId)
 const suggested=(quality-45)*.58+(a.round===2?5:0),planning=a.round===0?team.coins*.49:a.round===1?team.coins*.58:team.coins
 const amount=Math.max(1,Math.min(maxBid(a,team),Math.floor(Math.min(planning,suggested*(.75+random()*.45)))))
 return{teamId:team.id,lotId,amount}
}
function settle(a:Auction,bids:Bid[],teams:Team[]):Sale[]{
 const results:Sale[]=[]
 for(const lotId of new Set(bids.map(b=>b.lotId))){
  const contenders=bids.filter(b=>b.lotId===lotId).sort((x,y)=>y.amount-x.amount||hash(`${a.seed}:${a.round}:${a.attempt}:${lotId}:${x.teamId}`)-hash(`${a.seed}:${a.round}:${a.attempt}:${lotId}:${y.teamId}`))
  const winner=contenders[0],team=teams.find(t=>t.id===winner.teamId)!
  if(!needsLot(team,a.round)||winner.amount>maxBid(a,team)||winner.amount<1)throw new Error('Lance inválido')
  team.coins-=winner.amount
  if(a.round===2)team.car=lotId;else team.drivers.push(lotId)
  results.push({lotId,teamId:team.id,amount:winner.amount,kind:a.round===2?'car':'driver'})
 }
 return results
}
/** Os bots não recebem nem consultam o lance humano antes de formar seus envelopes. */
export function submitBid(a:Auction,lotId:string,amount:number):Auction{
 if(a.report||a.complete)return a
 if(!a.offers.includes(lotId)||!Number.isSafeInteger(amount)||amount<1||amount>maxBid(a))return{...a,error:'Escolha uma carta e um lance inteiro dentro do seu caixa. Reserve 1 moeda para cada compra que falta.'}
 const teams=a.teams.map(t=>({...t,drivers:[...t.drivers]}))
 const botBids=teams.filter(t=>t.id!==0&&needsLot(t,a.round)).map(t=>botBid(a,t,a.offers,0))
 const bids:Bid[]=[...botBids,{teamId:0,lotId,amount}],sales=settle(a,bids,teams)
 const won=sales.some(s=>s.teamId===0)
 // Depois que você fecha sua vaga, conclui só as contratações restantes dos rivais.
 if(won){for(let n=1;n<=teams.length;n++){
  const pending=teams.filter(t=>needsLot(t,a.round));if(!pending.length)break
  const pool=offers({...a,teams,attempt:a.attempt+n}),more=pending.map(t=>botBid(a,t,pool,n))
  bids.push(...more);sales.push(...settle(a,more,teams))
 }}
 return{...a,teams,sales:[...a.sales,...sales],report:{bids,sales,won},error:null}
}
export function continueAuction(a:Auction):Auction{
 if(!a.report)return a
 const allReady=a.teams.every(t=>!needsLot(t,a.round))
 if(allReady&&a.round===2)return{...a,report:null,complete:true}
 const next:Auction={...a,round:allReady?(a.round+1)as 1|2:a.round,attempt:a.attempt+1,report:null,error:null}
 return{...next,offers:offers(next)}
}
