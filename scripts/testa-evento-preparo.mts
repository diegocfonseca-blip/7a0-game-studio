import assert from 'node:assert/strict'
import {INITIAL,reducer} from '../src/escalacao/store'
import {reservasDoEvento,escalaIntegraPreparo,escalaSemLesionado,historiaLesaoPreparo} from '../src/escalacao/evento-preparo'
import {sorteiaLesaoDesgaste,estadoGas} from '../src/escalacao/condicao'
import type {EventoAtivo,WonCard} from '../src/escalacao/types'
const positions=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'] as const
const xi=positions.map((pos,i)=>({id:`p${i}`,name:`Atleta ${i}`,pos,club:'Clube',year:2000,lo:70,hi:80,fame:2,paid:4}) as WonCard)
const reserve={...xi[8],id:'reserva',name:'Reserva'},fake={...reserve,id:'fake',fake:true},loan={...reserve,id:'loan',emprestado:'saf' as const},other={...xi[3],id:'wrong'}
const ev:EventoAtivo={season:3,round:10,mgrId:0,tipo:'lesao',cardId:xi[8].id,nome:xi[8].name,pos:'ATA',rodadas:2,historia:'Preparação',status:'pendente',momento:'preparacao'}
const ids=xi.map(c=>c.id),squad=[...xi,reserve,fake,loan,other]
const make=(sq=squad)=>({...structuredClone(INITIAL),seed:44,careerOnline:true,agenciaOn:true,onlineMode:'cpu' as const,seasonNo:3,round:10,youIdx:0,managers:[{id:0,isHuman:true,teamName:'Clube',formation:'4-3-3' as const,squad:sq}],careerLineup:{0:{8:ids,9:ids,10:ids}},eventoTemporada:{...ev}})
assert.deepEqual(reservasDoEvento(ev,ids,squad).map(c=>c.id),['reserva','loan'])
assert(escalaIntegraPreparo(ids,squad,'4-3-3'));assert(!escalaSemLesionado(ev,ids,squad,'4-3-3'))
let s=make(),before=JSON.stringify(s.careerLineup),cash=JSON.stringify(s.careerCoins)
let next=reducer(s,{type:'EVENTO_DECIDE',escolha:'campo',xi:ids});assert.equal(next.eventoTemporada?.status,'pendente','lesionado nunca recebe liberação de noitada')
for(const subId of ['fake','wrong','p9','inexistente']){next=reducer(s,{type:'EVENTO_DECIDE',escolha:'troca',subId,xi:ids});assert.equal(next.eventoTemporada?.status,'pendente');assert.equal(JSON.stringify(next.careerLineup),before)}
next=reducer(s,{type:'EVENTO_DECIDE',escolha:'troca',subId:reserve.id,xi:ids});assert.equal(next.eventoTemporada?.status,'banco');assert.equal(next.eventoTemporada?.volta,12);assert.equal(next.careerLineup?.[0][10][8],reserve.id);assert.deepEqual(next.careerLineup?.[0][9],ids,'não reescreve jogo já disputado');assert.equal(JSON.stringify(next.careerCoins),cash)
const manually=ids.map(id=>id===ev.cardId?reserve.id:id);s=make();s.careerLineup[0][10]=manually
next=reducer(s,{type:'EVENTO_DECIDE',escolha:'troca',xi:manually});assert.equal(next.eventoTemporada?.status,'banco');assert.deepEqual(next.careerLineup?.[0][10],manually);assert.equal(next.careerLineup?.[0][12],undefined,'respeita troca manual, sem restaurar XI antigo')
assert.equal(reducer(next,{type:'EVENTO_DECIDE',escolha:'troca',xi:manually}).eventoManchetes?.length,next.eventoManchetes?.length)
s=make();assert.equal(reducer(s,{type:'EVENTO_PREPARAR_BASE',xi:ids}).eventoTemporada?.criaOptions,undefined,'reserva real dispensa novo cria')
s=make([...xi,fake,other]);next=reducer(s,{type:'EVENTO_PREPARAR_BASE',xi:ids});assert.equal(next.eventoTemporada?.criaOptions?.length,3);assert.equal(next.managers[0].squad.length,s.managers[0].squad.length,'oferecer nomes não sobe jogador');const choices=next.eventoTemporada!.criaOptions!;assert.deepEqual(reducer(next,{type:'EVENTO_PREPARAR_BASE',xi:ids}).eventoTemporada?.criaOptions,choices)
const promoted=reducer(next,{type:'EVENTO_DECIDE_CRIA',nome:choices[0],xi:ids});assert.equal(promoted.eventoTemporada?.status,'banco');assert.equal(promoted.managers[0].squad.length,next.managers[0].squad.length+1);assert(!promoted.careerLineup?.[0][10].includes(ev.cardId));assert.equal(promoted.careerLineup?.[0][10].length,11)
const loanSwap=reducer(make(),{type:'EVENTO_DECIDE',escolha:'troca',subId:'loan',xi:ids});assert.equal(loanSwap.eventoTemporada?.status,'banco','emprestado recebido pode jogar')
const curNoit={...make(),eventoTemporada:{...ev,tipo:'noitada' as const,status:'campo' as const}};assert.equal(reducer(curNoit,{type:'EVENTO_SET',evento:{...ev,desgaste:true}}).eventoTemporada?.tipo,'noitada','não sobrepõe decisão da mesma preparação')
const clean={...make(),eventoTemporada:undefined};assert.equal(reducer(clean,{type:'EVENTO_SET',evento:{...ev,round:9}}).eventoTemporada,undefined,'evento da preparação não retroage')
assert.equal(reducer({...s,onlineMode:'online'},{type:'EVENTO_PREPARAR_BASE',xi:ids}).eventoTemporada?.criaOptions,undefined)
assert.equal(reducer({...make(),eventoTemporada:{...ev,tipo:'noitada'}},{type:'EVENTO_DECIDE',escolha:'campo',xi:ids}).eventoTemporada?.status,'campo','decisão de noitada preservada')
for(const en of [false,true]){const text=historiaLesaoPreparo('Atleta',true,en);assert(text.includes('Atleta'));assert(!/10 minutos|10 minutes|no jogo aos|during the match/.test(text))}
const stats:any={},n=20000
for(const [label,g,count] of [['inteiro',100,11],['cansado',24,11],['limite',15,1],['esgotado1',5,1],['esgotado11',5,11]] as const){let hit=0,one=0;const cards=xi.slice(0,count),gas=Object.fromEntries(cards.map(c=>[c.id,g]));for(let seed=1;seed<=n;seed++){const d=sorteiaLesaoDesgaste({seed,seasonNo:3,round:10,xi:cards,gas});if(d){hit++;assert(d.rodadas>=1&&d.rodadas<=3);if(d.rodadas===1)one++}}stats[label]={trials:n,injuries:hit,pct:hit*100/n,oneRound:one};if(estadoGas(g)==='ok'||estadoGas(g)==='cansado')assert.equal(hit,0);else assert(hit/n>(g===15?.035:.08)&&hit/n<(g===15?.065:.12))}
assert.equal(stats.esgotado1.injuries,stats.esgotado11.injuries,'onze esgotados não viram onze sorteios')
console.log(JSON.stringify({ok:true,cases:'eligibility, injury cannot play, stale choices, manual XI, academy offered then chosen, immutable past, online isolation, preparation story',fatigueOnly:stats},null,2))
