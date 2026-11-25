import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import {resolveLots,rebidWinner,fitEnvelope,dutchStepMs} from '../../src/escalacao/auction-core.ts'
import {rng} from '../../src/escalacao/formula1/auction.ts'
const source=readFileSync(new URL('./resolve-baseline.fixture',import.meta.url),'utf8')
const start=source.indexOf('function resolve(cards:'),end=source.indexOf('\n}\n',start)+2
const compiled=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText
const openSlots=(m:any,pos:string)=>m.slots[pos]-m.squad.filter((c:any)=>c.pos===pos).length
const original=new Function('openSlots',`${compiled};return resolve`)(openSlots)
for(let seed=1;seed<=1000;seed++){
 const random=rng(seed),cards=Array.from({length:12},(_,i)=>({id:`c${i}`,pos:['GOL','ZAG','MEI','ATA'][i%4],paid:i%4===0?5:0,semContrato:i%3===0,seller:i%4}))
 const managers=Array.from({length:4},(_,id)=>({id,isHuman:id===0,money:Math.floor(random()*100),squad:[],slots:{GOL:1,ZAG:2,MEI:2,ATA:2}}))
 const bids=new Map(cards.map(c=>[c.id,managers.filter(()=>random()>.35).map(m=>({mgr:m.id,amount:Math.floor(random()*20),reforco:random()<.1}))]))
 const oldManagers=structuredClone(managers),newManagers=structuredClone(managers),eligible=(m:any,c:any)=>!((m.id+Number(c.id.slice(1)))%13===0),same=(b:number,s:number)=>b===s||b%3===s%3
 const old=original(cards,bids,oldManagers,'leilao',seed%2===0,same,eligible)
 const next=resolveLots(cards,bids,{floor:c=>c.paid??0,accepts:(c,b)=>{const m=newManagers[b.mgr],ex=c.semContrato?c.seller:undefined;return eligible(m,c)&&(openSlots(m,c.pos)>0||(!!b.reforco&&!m.isHuman))&&m.money>=b.amount&&!(ex!=null&&same(m.id,ex))},buy:(c,winner,amount)=>{const m:any=newManagers[winner];m.money=Math.max(0,m.money-amount);m.squad.push({...c,paid:amount,buyPrice:amount,via:'leilao',semContrato:undefined,tetoOficial:undefined,contratoAte:undefined,...(seed%2===0&&m.isHuman?{reforco:true}:{})})}})
 const normalized={...next,ties:next.ties.map(tb=>({...tb,cardId:tb.card.id,submitted:[],winner:null,paid:0,viaRoulette:false,via:'leilao'}))}
 assert.deepEqual(normalized,old,`Mesma adjudicação antiga seed ${seed}`);assert.deepEqual(newManagers,oldManagers)
}
let draws=0;const winner=rebidWinner([0,1],{0:10,1:12},()=>{draws++;return .5});assert.equal(draws,0);assert.equal(winner.winner,1)
assert.equal(rebidWinner([0,1],{0:10,1:10},()=>.7).winner,1)
assert.deepEqual(fitEnvelope([{cardId:'a',amount:5},{cardId:'b',amount:8},{cardId:'c',amount:2}],7),{accepted:[{cardId:'a',amount:5},{cardId:'c',amount:2}],cut:1})
assert.deepEqual([100,50,20,1].map(n=>dutchStepMs(n,100)),[300,1400,2000,3000])
console.log('PASS 1000 comparações com motor publicado de futebol/basquete; desempate, orçamento e relógio preservados.')
