import {CARS,DRIVERS,carById,driverById,type Category} from './catalog'
import {resolveLots,fitEnvelope,rebidWinner,registerOpenBid,openMinimum,dutchStepMs,dutchNextPrice,OPEN_HAMMER_MS,OPEN_TICK_MS,type CoreResult,type CoreBid} from '../auction-core'
export const BUDGET=100
export type AuctionMode='sealed'|'single'|'open'|'dutch'
export type Team={id:number;name:string;coins:number;drivers:string[];car:string|null;color:string}
export type Bid={teamId:number;lotId:string;amount:number}
export type Sale={lotId:string;teamId:number;amount:number;kind:'driver'|'car'}
type Lot={id:string}
type Tie={lotId:string;amount:number;managers:number[];roulette?:boolean}
export type Auction={seed:number;round:0|1|2;attempt:number;mode:AuctionMode;seconds:number;teams:Team[];offers:string[];sales:Sale[];report:{bids:Bid[];sales:Sale[];won:boolean}|null;complete:boolean;error:string|null;phase:'bidding'|'tiebreak'|'reveal';queue:CoreResult<Lot,CoreBid>[];ties:Tie[];revealIdx:number;clock:number;deadline:number;mesa:{idx:number;preco:number;lider:number|null;deadline:number;lances:{mgr:number;valor:number}[]}}
export function hash(text:string):number{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function rng(seed:number){let x=seed>>>0;return()=>{x=(x+0x6D2B79F5)|0;let z=Math.imul(x^(x>>>15),1|x);z^=z+Math.imul(z^(z>>>7),61|z);return((z^(z>>>14))>>>0)/4294967296}}
const categories:Category[]=['lenda','craque','promessa','bom','profissional','lenda','craque','bom']
export const isCar=(id:string)=>CARS.some(c=>c.id===id)
export const lotData=(id:string)=>isCar(id)?carById(id):driverById(id)
function offerPool(a:Pick<Auction,'round'|'seed'|'attempt'|'teams'|'mode'>,car:boolean):string[]{
 const random=rng(hash(`${a.seed}:${a.round}:${a.attempt}:${car}:offers`)),used=new Set(a.teams.flatMap(t=>car?(t.car?[t.car]:[]):t.drivers))
 const pool=(car?CARS:DRIVERS).filter(c=>!used.has(c.id)),result:string[]=[]
 const count=Math.min(pool.length,Math.max(8,a.teams.length*(car?1:2)))
 for(let n=0;n<count;n++){const category=categories[n%categories.length],choices=pool.filter(c=>c.category===category&&!result.includes(c.id));if(choices.length)result.push(choices[Math.floor(random()*choices.length)].id)}
 for(const c of [...pool].sort((x,y)=>hash(`${a.seed}:${x.id}`)-hash(`${a.seed}:${y.id}`))){if(result.length>=count)break;if(!result.includes(c.id))result.push(c.id)}
 return result
}
function offers(a:Auction){return a.mode==='single'?[...offerPool(a,false),...offerPool(a,true)]:offerPool(a,a.round===2)}
export function createAuction(seed:number,name:string,options:{mode?:AuctionMode;rivals?:number;seconds?:number}={}):Auction{
 const count=[3,5,7,9].includes(options.rivals??3)?options.rivals??3:3
 const names=[name.trim().slice(0,24)||'Minha escuderia','Paddock Racing','Curva Um GP','Apex Motorsport','Box 5 Racing','Largada GP','Pole Racing','Autódromo GP','Volta Rápida','Bandeirada Racing']
 const a:Auction={seed,round:0,attempt:0,mode:options.mode??'sealed',seconds:[30,45,60].includes(options.seconds??45)?options.seconds??45:45,teams:names.slice(0,count+1).map((name,id)=>({id,name,coins:BUDGET,drivers:[],car:null,color:['#FFC400','#7C3AED','#C2452F','#93a6a5','#1B7A3D','#4984c2','#ed8f2b','#ca79ad','#a5ba58','#f4ecd6'][id]})),offers:[],sales:[],report:null,complete:false,error:null,phase:'bidding',queue:[],ties:[],revealIdx:0,clock:0,deadline:0,mesa:{idx:0,preco:0,lider:null,deadline:OPEN_HAMMER_MS,lances:[]}}
 a.deadline=a.seconds*1000;a.offers=offers(a);return a
}
export function needsLot(team:Team,round:number){return round===2?!team.car:team.drivers.length<=round}
function canBuy(a:Auction,team:Team,id:string){return a.mode==='single'?(isCar(id)?!team.car:team.drivers.length<2):needsLot(team,a.round)}
export function maxBid(a:Auction,team=a.teams[0]){const missing=2-team.drivers.length+(team.car?0:1);return Math.max(0,team.coins-(a.mode==='single'?Math.max(0,missing-1):2-a.round))}
function clone(a:Auction):Auction{return structuredClone(a)}
function buy(a:Auction,id:string,teamId:number,amount:number){
 const team=a.teams[teamId];team.coins=Math.max(0,team.coins-amount)
 if(isCar(id))team.car=id;else team.drivers.push(id)
 const sale:Sale={lotId:id,teamId,amount,kind:isCar(id)?'car':'driver'};a.sales.push(sale)
 a.report?.sales.push(sale);if(a.report&&teamId===0)a.report.won=true
}
function botEnvelope(a:Auction,team:Team):Bid[]{
 const random=rng(hash(`${a.seed}:${a.round}:${a.attempt}:${team.id}:envelope`)),bids:Bid[]=[]
 let cash=maxBid(a,team)
 const slots=a.mode==='single'?[...Array(Math.max(0,2-team.drivers.length)).fill(false),...(!team.car?[true]:[])]:canBuy(a,team,a.offers[0])?[a.round===2]:[]
 for(const [slot,car]of slots.entries()){
  const pool=a.offers.filter(id=>isCar(id)===car&&!bids.some(b=>b.lotId===id));if(!pool.length)continue
  const choices=pool.map(id=>({id,score:lotData(id).overall+random()*24})).sort((x,y)=>y.score-x.score),lotId=choices[0].id
  const reserve=slots.length-slot-1,planning=a.mode==='single'?cash/(slots.length-slot):a.round===0?team.coins*.49:a.round===1?team.coins*.58:team.coins
  const suggested=(lotData(lotId).overall-45)*.58+(car?5:0)
  const amount=Math.max(0,Math.min(cash-reserve,Math.floor(Math.min(planning,suggested*(.75+random()*.45)))))
  if(amount>0){bids.push({teamId:team.id,lotId,amount});cash-=amount}
 }
 return bids
}
export function submitEnvelope(input:Auction,envelope:{cardId:string;amount:number}[]):Auction{
 if(input.phase!=='bidding'||input.report||input.complete||!['sealed','single'].includes(input.mode))return input
 const missing=2-input.teams[0].drivers.length+(input.teams[0].car?0:1),count=envelope.filter(b=>b.amount>0).length
 const budget=input.mode==='single'?input.teams[0].coins-Math.max(0,missing-count):maxBid(input)
 const {accepted,cut}=fitEnvelope(envelope,budget),seen=new Set<string>()
 const human=accepted.filter(b=>b.amount>0)
 if(cut||human.some(b=>!input.offers.includes(b.cardId)||seen.has(b.cardId)||(seen.add(b.cardId),false))||human.filter(b=>isCar(b.cardId)).length>(input.teams[0].car?0:1)||human.filter(b=>!isCar(b.cardId)).length>(input.mode==='single'?2-input.teams[0].drivers.length:needsLot(input.teams[0],input.round)?1:0))return{...input,error:'Confira suas vagas e o total de moedas do envelope.'}
 if(envelope.some(b=>!Number.isSafeInteger(b.amount)||b.amount<0))return{...input,error:'Use lances inteiros a partir de zero.'}
 const a=clone(input)
 // Gerados antes e sem consultar a escolha/valor do humano.
 const bots=a.teams.slice(1).flatMap(t=>botEnvelope(a,t))
 const bids:Bid[]=[...bots,...human.map(b=>({teamId:0,lotId:b.cardId,amount:b.amount}))]
 a.report={bids,sales:[],won:false};const map=new Map<string,CoreBid[]>()
 for(const b of bids)map.set(b.lotId,[...(map.get(b.lotId)??[]),{mgr:b.teamId,amount:b.amount}])
 const result=resolveLots(a.offers.map(id=>({id})),map,{floor:()=>0,accepts:(lot,b)=>canBuy(a,a.teams[b.mgr],lot.id)&&maxBid(a,a.teams[b.mgr])>=b.amount,buy:(lot,team,amount)=>buy(a,lot.id,team,amount)})
 a.queue=result.queue;a.ties=result.ties.map(t=>({lotId:t.card.id,amount:t.amount,managers:t.managers}));a.revealIdx=0;a.error=null
 return advanceTies(a)
}
export function submitBid(a:Auction,id:string,amount:number){
 if(a.report||a.complete||a.phase!=='bidding')return a
 if(!a.offers.includes(id)||!Number.isSafeInteger(amount)||amount<1||amount>maxBid(a))return{...a,error:'Escolha uma carta e um lance inteiro dentro do seu caixa.'}
 return submitEnvelope(a,[{cardId:id,amount}])
}
function resolveTie(a:Auction,tie:Tie,human:number|undefined){
 const random=rng(hash(`${a.seed}:${a.attempt}:${tie.lotId}:rebid`)),amounts:Record<number,number>={}
 const eligible=tie.managers.filter(id=>canBuy(a,a.teams[id],tie.lotId)&&maxBid(a,a.teams[id])>=tie.amount)
 // Uma compra anterior pode ter preenchido a vaga que existia quando houve empate.
 if(!eligible.length)return
 for(const id of eligible){const value=a.mode==='single'?tie.amount:id===0?human??tie.amount:tie.amount+Math.max(1,Math.round((2+tie.amount*.25)*(.7+random())*(.6+random()*.8)));amounts[id]=Math.min(maxBid(a,a.teams[id]),Math.max(tie.amount,Math.round(value)))}
 const result=rebidWinner(eligible,amounts,random);tie.roulette=result.roulette;buy(a,tie.lotId,result.winner,result.amount)
 const row=a.queue.find(r=>r.card.id===tie.lotId)!;row.winner=result.winner;row.paid=result.amount
 for(const [id,amount]of Object.entries(amounts))row.bids.push({mgr:Number(id),amount})
}
function advanceTies(a:Auction):Auction{
 while(a.ties.length){const tie=a.ties[0];if(a.mode!=='single'&&tie.managers.includes(0)&&canBuy(a,a.teams[0],tie.lotId)&&maxBid(a)>=tie.amount){a.phase='tiebreak';a.deadline=a.clock+30000;return a}resolveTie(a,tie,undefined);a.ties.shift()}
 a.phase='reveal';return a
}
export function submitRebid(input:Auction,amount:number):Auction{
 if(input.phase!=='tiebreak'||!input.ties[0])return input
 if(!Number.isSafeInteger(amount)||amount<input.ties[0].amount||amount>maxBid(input))return{...input,error:'O novo lance deve caber no caixa e cobrir o valor empatado.'}
 const a=clone(input);resolveTie(a,a.ties[0],amount);a.ties.shift();a.error=null;return advanceTies(a)
}
export function continueAuction(input:Auction):Auction{
 if(input.phase!=='reveal'||!input.report)return input
 const a=clone(input),allReady=a.teams.every(t=>t.drivers.length===(a.mode==='single'?2:Math.min(2,a.round+1))&&(a.mode!=='single'&&a.round<2||!!t.car))
 if(allReady&&(a.round===2||a.mode==='single'))return{...a,report:null,complete:true}
 a.round=allReady?(a.round+1)as 1|2:a.round;a.attempt++;a.report=null;a.queue=[];a.ties=[];a.revealIdx=0;a.phase='bidding';a.error=null;a.offers=offers(a);a.deadline=a.clock+a.seconds*1000;a.mesa={idx:0,preco:0,lider:null,deadline:a.clock+OPEN_HAMMER_MS,lances:[]};return a
}
export function nextReveal(input:Auction){if(input.phase!=='reveal')return input;return input.revealIdx+1<input.queue.length?{...input,revealIdx:input.revealIdx+1}:continueAuction(input)}
export function openBid(input:Auction,amount:number):Auction{
 if(input.mode!=='open'||input.phase!=='bidding'||input.mesa.lider===0||!Number.isSafeInteger(amount)||amount<openMinimum(input.mesa.lider,input.mesa.preco)||amount>maxBid(input)||!canBuy(input,input.teams[0],input.offers[input.mesa.idx]))return input
 const a=clone(input);registerOpenBid(a.mesa,0,amount,a.clock);return a
}
export function takeDutch(input:Auction,id:string):Auction{
 if(input.mode!=='dutch'||input.phase!=='bidding'||!input.offers.includes(id)||input.mesa.preco<1||input.sales.some(s=>s.lotId===id)||!canBuy(input,input.teams[0],id)||maxBid(input)<input.mesa.preco)return input
 const a=clone(input);buy(a,id,0,a.mesa.preco);a.queue.push({card:{id},bids:[{mgr:0,amount:a.mesa.preco}],winner:0,paid:a.mesa.preco,voided:[]});return a
}
function reportLive(a:Auction){for(const id of a.offers)if(!a.queue.some(row=>row.card.id===id))a.queue.push({card:{id},bids:[],winner:null,paid:0,voided:[]});a.report={bids:a.queue.flatMap(q=>q.bids.map(b=>({teamId:b.mgr,lotId:q.card.id,amount:b.amount}))),sales:a.sales.filter(s=>a.offers.includes(s.lotId)),won:a.queue.some(q=>q.winner===0)};a.phase='reveal';a.revealIdx=0}
/** O mesmo relógio e martelo do leilão existente; recebe tempo virtual para os testes e pausa em aba oculta. */
export function tickAuction(input:Auction,ms=OPEN_TICK_MS):Auction{
 if(input.complete||input.phase!=='bidding'||!['open','dutch'].includes(input.mode))return input
 const a=clone(input);a.clock+=Math.max(0,ms)
 if(a.mode==='open'){
  const id=a.offers[a.mesa.idx];if(!id){reportLive(a);return a}
  if(a.clock>=a.mesa.deadline){
   if(a.mesa.lider!==null){buy(a,id,a.mesa.lider,a.mesa.preco);a.queue.push({card:{id},bids:a.mesa.lances.map(b=>({mgr:b.mgr,amount:b.valor})),winner:a.mesa.lider,paid:a.mesa.preco,voided:[]})}else a.queue.push({card:{id},bids:[],winner:null,paid:0,voided:[]})
   a.mesa={idx:a.mesa.idx+1,preco:0,lider:null,deadline:a.clock+OPEN_HAMMER_MS,lances:[]};if(a.mesa.idx>=a.offers.length)reportLive(a)
  }else{
   const random=rng(hash(`${a.seed}:${a.round}:${a.attempt}:${Math.floor(a.clock/OPEN_TICK_MS)}`)),minimum=openMinimum(a.mesa.lider,a.mesa.preco)
   const candidate=a.teams.slice(1).filter(t=>t.id!==a.mesa.lider&&canBuy(a,t,id)&&minimum<=maxBid(a,t)&&minimum<=(lotData(id).overall-40)*.6+(hash(`${a.seed}:${t.id}:${id}`)%12))
   if(candidate.length&&random()<.5)registerOpenBid(a.mesa,candidate[Math.floor(random()*candidate.length)].id,minimum,a.clock)
  }
 }else{
  if(a.mesa.preco===0&&a.queue.length===0){a.mesa.preco=BUDGET;a.mesa.deadline=a.clock+dutchStepMs(BUDGET,BUDGET)}
  for(const team of a.teams.slice(1)){
   const pool=a.offers.filter(id=>!a.sales.some(s=>s.lotId===id)&&canBuy(a,team,id)&&maxBid(a,team)>=a.mesa.preco&&a.mesa.preco>0&&a.mesa.preco<=Math.max(1,(lotData(id).overall-45)*.5+(hash(`${a.seed}:${team.id}:${id}`)%7)))
   if(pool.length){const id=pool.sort((x,y)=>lotData(y).overall-lotData(x).overall)[0];buy(a,id,team.id,a.mesa.preco);a.queue.push({card:{id},bids:[{mgr:team.id,amount:a.mesa.preco}],winner:team.id,paid:a.mesa.preco,voided:[]})}
  }
  if(a.clock>=a.mesa.deadline){a.mesa.preco=dutchNextPrice(a.mesa.preco);a.mesa.deadline=a.clock+dutchStepMs(a.mesa.preco,BUDGET)}
  if(a.mesa.preco<=0||a.teams.every(t=>!needsLot(t,a.round)))reportLive(a)
 }
 return a
}
