import {HIERARQUIA_INICIAL_CARREIRA} from '../src/escalacao/hierarquia-inicial-carreira'
import assert from 'node:assert/strict'
import {reducer,INITIAL,takeFromMonte,categoriaOficialOk,ident} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {mulberry} from '../src/escalacao/pyramidseason'
import {nivelDeJogo} from '../src/escalacao/forca-largada'

if(!HIERARQUIA_INICIAL_CARREIRA){console.log('SKIP experimento rejeitado por Diego; valide com testa-carreira-sem-ajuste-inicial.mts')}else{
_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const old=Math.random;Math.random=mulberry(20261123)
const base=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Portuguesa',formation:'4-3-3',rivals:5,oficial:{clube:'Portuguesa'}})
Math.random=old
function fixture(comprador:number,proprio=false){
 const s:any=structuredClone(base),dono=s.managers[proprio?comprador:comprador===0?1:0]
 const carta=dono.squad.find((c:any)=>c.pos==='GOL'&&categoriaOficialOk('D',c))
 assert(carta,'carta real negociável da divisão')
 dono.squad=dono.squad.filter((c:any)=>c.id!==carta.id)
 for(const m of s.managers){m.money=m.id===comprador?1000:0;m.auctionRival=m.id===comprador}
 s.careerCoins[0]=comprador===0?1000:0
 s.reserveAuction=true;s.oficialAbertura=undefined;s.sectorIdx=0;s.phase='envelope';s.screen='auction'
 s.submitted=[];s.pendingEnvelopes={};s.resolvedQueue=[];s.tiebreakQueue=[];s.auctionSecs=0;s.phaseDeadline=null
 return {s,carta:{...carta,paid:5,seller:dono.id},dono}
}
for(const comprador of [0,1]){
 const {s,carta}=fixture(comprador)
 s.screen='monte';s.monte=[carta];s.monteOrder=[comprador];s.monteIdx=0
 takeFromMonte(s,carta.id)
 const ganho=s.managers[comprador].squad.find((c:any)=>ident(c)===ident(carta))
 assert(ganho);assert.equal(ganho.lo,carta.lo);assert.equal(ganho.hi,carta.hi)
 assert.equal(nivelDeJogo(ganho),(carta.lo+carta.hi)/2,'compra no monte libera desempenho, humano ou bot')
}
const own=fixture(0,true);own.s.screen='monte';own.s.monte=[own.carta];own.s.monteOrder=[0];own.s.monteIdx=0
takeFromMonte(own.s,own.carta.id)
const recuperado=own.s.managers[0].squad.find((c:any)=>c.id===own.carta.id)
assert.deepEqual(recuperado.calibracaoCarreira,own.carta.calibracaoCarreira,'anúncio sem venda não libera força')

for(const comprador of [0,1]){
 const {s,carta}=fixture(comprador)
 s.currentCards=[carta]
 let n=reducer(s,{type:'SUBMIT_ENVELOPE',mgrId:comprador,bids:[{cardId:carta.id,amount:500}]})
 n=reducer(n,{type:'FORCE_SEAL'})
 const ganho=n.managers[comprador].squad.find(c=>ident(c)===ident(carta))
 assert(ganho,'pregão nativo conclui compra')
 assert.equal(ganho.lo,carta.lo);assert.equal(ganho.hi,carta.hi)
 assert.equal(nivelDeJogo(ganho),(carta.lo+carta.hi)/2,'vencedor recebe força normal')
}
console.log('PASS contratação humana/bot no pregão e monte; overalls originais; próprio anúncio sem venda mantém ajuste')

}
