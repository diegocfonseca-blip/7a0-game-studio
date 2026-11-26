import assert from 'node:assert/strict'
import {carreiraTradicionalBancada} from './teste-paridade-carreira/tradicional'
import {INITIAL,reducer,sanitize,salaryOfCard,valorOficial,contratoAtletaFalta,contratoCpuFalta,podeRetirarOficial,completaBancoDosBots,reparaMinimoOficial,ident,clubesNacionaisDoMercado,escadaAllows} from '../src/escalacao/store'
import {preparaGestaoCarreira,gestaoAtiva} from '../src/escalacao/carreira-regras'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {buildPyramid,vinculaPlanosOficiais,fisicaDaCopa,computeCopa,seedCpuSquads} from '../src/escalacao/pyramidseason'
import {chaveCarry,modGas,GAS_JOGO} from '../src/escalacao/condicao'
import {computeSupercopa} from '../src/escalacao/copa-brasil'
import {FORMATIONS,SECTORS,type EscState,type WonCard} from '../src/escalacao/types'
_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const original=carreiraTradicionalBancada(),human=original.managers[original.youIdx]
assert.equal(original.careerManagementSince,1)
assert.equal(original.cpuSquads,undefined,'mercado aguarda a materialização, sem criar um objeto vazio')
const full=reducer(structuredClone(original),{type:'SEED_CPU_SQUADS',squads:seedCpuSquads(original.managers,original.seed,original.deckLeague,!!original.escadaOn)})
assert(Object.keys(full.cpuSquads??{}).length>=60);assert.equal(full.oficialMercadoBotsSeason,1,'primeira gestão após carregar o mundo completo')
assert.equal(human.squad.length,11)
assert(human.squad.every(c=>c.valorBaseCarreira==null),'não aplica referência aos atletas tradicionais')
for(const c of human.squad)assert.equal(salaryOfCard(c),Math.round(c.paid/10),'mantém salário tradicional pelo preço pago')
const card=human.squad[0]
assert.equal(salaryOfCard({...card,paid:60,buyPrice:60}),6)
assert.equal(salaryOfCard({...card,paid:60,buyPrice:60,valorBaseCarreira:140}),6,'mesmo salário na compra do Oficial');assert.equal(salaryOfCard({...card,paid:60,buyPrice:undefined,via:'leilao',valorBaseCarreira:140}),6,'compra antiga identificada conserva o preço pago')
assert.equal(salaryOfCard({...card,paid:140,buyPrice:0,valorBaseCarreira:140}),14,'herdado conserva referência')
assert.equal(salaryOfCard({...card,paid:60,buyPrice:60,emprestado:{}} as WonCard),0,'empréstimo continua sem salário')
assert.equal(valorOficial(original,card),Math.max(original.marketValues?.[ident(card)]??0,card.paid),'não muda renovação tradicional')
console.log('PASS salário da compra 60→6 nos dois modos, herdado, empréstimo e regra tradicional preservada')
let s={...structuredClone(original),seasonNo:6,round:10,condicaoDesde:6,condicaoDesdeR:0}
const m=s.managers[s.youIdx]
s.careerPlacements={...s.careerPlacements,['m'+m.id]:'C'}
s.careerTecnicos={[m.teamName]:'Dorival Júnior'};s.careerTecnicoContrato={[m.teamName]:10}
const other=s.managers.find(x=>!x.isHuman&&!x.rival)!;s.careerPlacements['m'+other.id]='V';s.careerTecnicos[other.teamName]='Joel Santana';s.careerTecnicoContrato[other.teamName]=10
const coach=reducer(s,{type:'ALICIAR_SEED'})
assert.equal(coach.careerTecnicos?.[other.teamName],'Joel Santana','bot de outra divisão conserva seu contrato')
assert.equal(coach.careerTecnicos?.[m.teamName],'Dorival Júnior');assert.equal(coach.careerTecnicoContrato?.[m.teamName],10)
assert.equal(contratoAtletaFalta(s,{...card,contratoAte:13}),8)
assert.equal(contratoAtletaFalta(s,{...card,contratoAte:undefined}),contratoCpuFalta(card.id,s.seed,6))
assert(!podeRetirarOficial(s,m.squad,'GOL',m.formation),'não tira o único goleiro')
console.log('PASS contrato verdadeiro/fallback, técnico preservado no acesso e mínimo de posição')
const legacy={...structuredClone(s),careerManagementSince:undefined}
const before=JSON.stringify({managers:legacy.managers,coins:legacy.careerCoins,m2:legacy.m2Res})
assert(preparaGestaoCarreira(legacy));assert.equal(legacy.careerManagementSince,7);assert(!gestaoAtiva(legacy));assert(!preparaGestaoCarreira(legacy))
assert.equal(JSON.stringify({managers:legacy.managers,coins:legacy.careerCoins,m2:legacy.m2Res}),before)
const resumed=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(JSON.stringify(sanitize(legacy)))})
assert.equal(resumed.careerManagementSince,7)
assert.equal(sanitize({...s,onlineMode:'online'}).careerManagementSince,undefined)
for(const bad of [{...s,sport:'basquete' as const},{...s,onlineMode:'online' as const},{...s,co2:{sala:'qa'} as EscState['co2']}])assert(!gestaoAtiva(bad))
console.log('PASS migração prospectiva, dinheiro/notas/passado, retomada e isolamento')
// Every division buys using its own allowed categories, with real budget and no human sales.
s=structuredClone(s);s.oficialMercadoBotsSeason=undefined;s.cpuSquads={};s.clubCash={};s.marketValues={}
for(const [i,b] of s.managers.entries())if(!b.isHuman){s.careerPlacements!['m'+b.id]=i%2?'A':'V';s.clubCash['m'+b.id]=1000}
const own=JSON.stringify(s.managers[s.youIdx]),cash=s.careerCoins?.[m.id],prev=new Map(s.managers.map(b=>[b.id,new Set(b.squad.map(ident))]))
const result=completaBancoDosBots(s);assert(result&&result.movimentos.length>0)
const boughtDivs=new Set<string>()
for(const b of s.managers)for(const c of b.squad)if(!prev.get(b.id)?.has(ident(c))){const div=s.careerPlacements!['m'+b.id] as 'A'|'V';boughtDivs.add(div);assert(escadaAllows(div,c));assert(c.paid>0);assert(c.contratoAte!>=6);assert.equal(salaryOfCard(c),Math.round(c.paid/10));assert(!c.fake)}
assert(boughtDivs.has('A')&&boughtDivs.has('V'),'gestão fora da série humana e sem confundir régua A/V')
assert.equal(JSON.stringify(s.managers[s.youIdx]),own);assert.equal(s.careerCoins?.[m.id],cash)
const paid=JSON.stringify({m:s.managers,c:s.clubCash});completaBancoDosBots(s);assert.equal(JSON.stringify({m:s.managers,c:s.clubCash}),paid,'não compra novamente na mesma temporada')
assert(clubesNacionaisDoMercado(s).some(b=>s.careerPlacements!['m'+s.managers.find(m=>m.teamName===b.teamName)?.id]==='V'))
console.log('PASS mercado em todas as séries, categorias por comprador, salário/contrato, caixa humano e idempotência')
// Positional repair only uses unowned real cards. Does not change human or invent fakes.
const target=s.managers.find(b=>!b.isHuman)!;s.careerPlacements!['m'+target.id]='V';target.squad=target.squad.filter(c=>c.pos!=='GOL')
reparaMinimoOficial(s);assert(target.squad.some(c=>c.pos==='GOL'&&!c.fake));assert.equal(JSON.stringify(s.managers[s.youIdx]),own)
const ids=s.managers.flatMap(b=>b.squad.filter(c=>!c.fake).map(ident));assert.equal(new Set(ids).size,ids.length)
console.log('PASS reparo real sem duplicação ou alteração do elenco humano')
const world=buildPyramid(s.managers,m.id,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,false),linked=vinculaPlanosOficiais(world,s)
const you=Object.values(linked).flat().find(t=>t.teamId===m.id)!,base={...you,planoOficial:{...you.planoOficial!,gasAgora:Object.fromEntries(you.squad.map(c=>[c.id,30]))}}
assert(you.planoOficial?.fisicaAtiva&&you.planoOficial.tecnico)
const f=fisicaDaCopa(),one=f.prepara(base,'teste');f.jogou('teste',one);const two=f.prepara(base,'proximo');assert(two.xi.every(c=>c.gasMod===modGas(30-GAS_JOGO)))
const saved={id:'teste',r:10,inicio:f.inicio('teste'),clubes:{[you.name]:one.xi.map(chaveCarry)}}
const reopened=fisicaDaCopa().prepara({...base,planoOficial:{...base.planoOficial,jogosCopas:{teste:saved},gasAgora:{}}},'teste');assert.deepEqual(reopened.xi,one.xi)
const record=reducer(s,{type:'OFICIAL_COPA_FISICA',season:6,jogos:[saved]}),again=reducer(record,{type:'OFICIAL_COPA_FISICA',season:6,jogos:[saved]})
assert.equal(record.oficialFisica?.copas?.teste?.id,'teste');assert.equal(again,record)
assert.equal(vinculaPlanosOficiais(world,legacy),world,'temporada antiga não recebe física nova')
console.log('PASS copas com técnico, desgaste, reabertura e registro sem duplicação')
// Exercise both complete cup adapters, not just the physical helper.
const away=Object.values(linked).flat().find(t=>!t.human)!
const small={A:[base,away],B:[],C:[],D:[],V:[]}
const copa=computeCopa(small,s.seed,6),tie=copa.rounds[0].ties[0]
assert(tie.legFisicaIds?.length&&tie.legFisicaInicio?.[0]?.[base.name])
const cupSaved={id:tie.legFisicaIds![0],r:10,inicio:tie.legFisicaInicio![0],clubes:tie.legFisicaClubes![0]!}
const againWorld={...small,A:small.A.map(t=>({...t,planoOficial:{...t.planoOficial!,gasAgora:{},jogosCopas:{[cupSaved.id]:cupSaved}}}))}
const repeated=computeCopa(againWorld,s.seed,6).rounds[0].ties[0]
assert.deepEqual([repeated.legs,repeated.goals,repeated.win],[tie.legs,tie.goals,tie.win],'Copa Legends não muda ao reabrir com gás posterior')
const supercup=computeSupercopa(small,away,s.seed,6)!
assert(supercup.legFisicaIds?.[0].includes(':S:1:'));assert(supercup.legFisicaInicio?.[0]?.[base.name])
console.log('PASS Copa Legends e Supercopa reais registram física e preservam reabertura')
// Advancing a free career must not stop at the obsolete ceiling.
const end={...structuredClone(original),seasonNo:50,careerGratisAte:50,round:38}
const next=reducer(end,{type:'CAREER_ADVANCE',pago:false})
assert.equal(next.seasonNo,51)
console.log('PASS conta grátis avança da T50 à T51')
console.log('PASS paridade de regras sem alterar salários/valores tradicionais')
