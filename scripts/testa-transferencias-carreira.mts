import assert from 'node:assert/strict'
import {mercadoAnualOficial,reservaNegociavel} from '../src/escalacao/mercado-bots-oficial'
import {reducer,INITIAL,ident,reservaTransferivelOficial,categoriaOficialOk,contratoAtletaFalta,completaBancoDosBots} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {FORMATIONS,SECTORS} from '../src/escalacao/types'
import {mulberry,fisicaDaCopa,rollFormCopa,rollForm,buildPyramid,vinculaPlanosOficiais,computeEstadualCarreira} from '../src/escalacao/pyramidseason'
import {chaveCarry,gasDoElenco} from '../src/escalacao/condicao'
import {planoCansacoBot} from '../src/escalacao/bots-banco'

const need=FORMATIONS['4-3-3']
const squad=(prefix:string,base:number,bench:number)=>SECTORS.flatMap(pos=>Array.from({length:need[pos]*2},(_,k)=>({id:`${prefix}-${pos}-${k}`,name:`${prefix}-${pos}-${k}`,club:prefix,year:2026,pos,lo:k<need[pos]?base:bench,hi:k<need[pos]?base:bench})))
const a=squad('Comprador',60,40),b=squad('Vendedor',90,80)
const mk=(chave:string,sq:any[],caixa:number)=>({chave,nome:chave,div:'B',squad:sq,need,caixa,compromissos:40,perfil:'equilibrado' as const})
const input={clubes:[mk('a',a,160),mk('b',b,50)],catalogo:[],ocupados:new Set([...a,...b].map(ident)),seed:4,season:2,identidade:ident,elegivel:()=>true,preco:()=>20,salario:()=>3,contratar:(c:any)=>({...c}),transferencias:true}
const antes=JSON.stringify(input.clubes),out=mercadoAnualOficial(input)
assert(out.movimentos.some(m=>m.vendedor==='b'&&m.clube==='a'),'melhora XI com reserva de outro clube')
assert.equal(out.clubes.reduce((n,c)=>n+c.caixa,0),210,'transferência conserva dinheiro entre clubes')
assert.equal(JSON.stringify(input.clubes),antes,'planejamento não altera entrada')
assert.deepEqual(mercadoAnualOficial(input),out,'determinístico')
assert.equal(mercadoAnualOficial({...input,transferencias:false}).movimentos.length,0,'flag reverte caminho de transferências')
assert.equal(mercadoAnualOficial({...input,elegivel:()=>false}).movimentos.length,0,'mesmo limite de categoria')
assert.equal(mercadoAnualOficial({...input,protegidos:new Set(b.map(ident))}).movimentos.length,0,'sondagem humana protegida')
assert.equal(mercadoAnualOficial({...input,salario:c=>c.club==='Vendedor'?200:3}).movimentos.length,0,'novo salário cabe antes de contratar')
for(const c of out.clubes)for(const pos of SECTORS)assert(c.squad.filter(c=>c.pos===pos).length>=need[pos])
for(const c of b.filter(c=>c.pos==='MEI').slice(0,need.MEI))assert(!reservaNegociavel(b,c,need,ident),'não vende titular')
const all=out.clubes.flatMap(c=>c.squad.map(ident));assert.equal(new Set(all).size,all.length,'nenhuma duplicata')
console.log('PASS transferências: caixa conservado, XI protegido, categoria, salários, determinismo e reserva de sondagem')

const cards=squad('Fisica',80,70),tit=cards.filter(c=>Number(c.id.split('-').at(-1))<need[c.pos]),gas=Object.fromEntries(cards.map(c=>[c.id,tit.includes(c)?10:80]))
const team:any={name:'Fisica',human:false,formation:'4-3-3',squad:cards,xi:tit,planoOficial:{fisicaAtiva:true,gasAgora:gas,taticas:{},escalacoes:{}}}
const f=fisicaDaCopa(),bot=f.prepara(team,'jogo-1'),human=f.prepara({...team,name:'Humano',human:true},'jogo-h')
assert.equal(bot.xi.length,11);assert(bot.xi.every(c=>!tit.includes(c)&&!c.gasMod),'bot usa banco inteiro quando titulares esgotados')
assert(human.xi.every(c=>tit.some(x=>x.id===c.id)),'escolha humana preservada')
assert(human.xi.every(c=>c.gasMod===-3&&c.lo===80),'mod físico sem adulterar carta')
const adjusted=rollFormCopa(human,'equilibrio','equilibrio',()=>.5),fresh=rollForm(tit,'equilibrio','equilibrio',()=>.5)
assert(adjusted.atk<fresh.atk&&adjusted.def<fresh.def,'bot estatístico sente desgaste da copa')
f.jogou('jogo-h',human);const once=f.prepara({...team,name:'Humano',human:true},'jogo-h2');f.jogou('jogo-h',human);const twice=f.prepara({...team,name:'Humano',human:true},'jogo-h3');assert.deepEqual(once.xi,twice.xi,'id não cobra duas vezes')
const saved={id:'jogo-h',r:38,clubes:{Humano:human.xi.map(chaveCarry)},inicio:f.inicio('jogo-h')}
const replay=fisicaDaCopa().prepara({...team,name:'Humano',human:true,planoOficial:{...team.planoOficial,gasAgora:Object.fromEntries(cards.map(c=>[c.id,0])),jogosCopas:{'jogo-h':saved}}},'jogo-h')
assert.deepEqual(replay.xi,human.xi,'reabrir usa gás e escalação da partida, não desgaste posterior')
const cup=[{r:0,ids:tit.map(c=>c.id)}],humGas=gasDoElenco({},0,cards,0,gas,2.8,new Set(),cup)
const botGas=planoCansacoBot({squad:cards,need,inicio:gas,seed:1,seasonNo:1,nome:'Fisica',rodadas:0,banco:2.8,copas:cup}).gasFim
assert.deepEqual(humGas,botGas,'consumo e recuperação iguais para humano e CPU')
assert(cards.every(c=>c.lo===80||c.lo===70),'notas originais preservadas')
console.log('PASS copas: banco, desgaste efetivo, mesma régua física, idempotência e reabertura estável')

_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const random=Math.random;Math.random=mulberry(20261123)
let s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Portuguesa',formation:'4-3-3',rivals:5,oficial:{clube:'Portuguesa'}});Math.random=random
const initial=JSON.stringify(s.managers[0].squad),cash=s.careerCoins?.[0]
const publicTarget=Object.entries(s.cpuSquads??{}).flatMap(([clube,sq])=>sq.filter(c=>categoriaOficialOk('D',c)&&contratoAtletaFalta(s,c)>0&&reservaTransferivelOficial(s,sq,c)).map(c=>({clube,sq,c})))[0]
assert(publicTarget,'há reservas reais sob contrato negociáveis para o humano')
const {clube,sq,c}=publicTarget
s=reducer(s,{type:'ALICIAR_MARCAR',cardId:c.id,clube,card:c as any,squad:sq as any})
assert(s.aliciarJogadores?.includes(c.id),'humano pode sondar reserva sob contrato com a mesma regra')
assert.equal(JSON.stringify(s.managers[0].squad),initial)
const antesMercado=JSON.stringify(s.cpuSquads?.[clube]?.find(x=>ident(x)===ident(c)))
completaBancoDosBots(s)
assert.equal(JSON.stringify(s.managers[0].squad),initial,'mercado não vende ídolos humanos')
assert.equal(s.careerCoins?.[0],cash,'mercado não movimenta caixa humano')
assert.equal(JSON.stringify(s.cpuSquads?.[clube]?.find(x=>ident(x)===ident(c))),antesMercado,'bot não leva alvo humano já sondado')
assert(s.managers[0].squad.some(c=>c.name==='Julinho'&&c.lo===81&&c.hi===92))
console.log('PASS integração: sondagem real, alvo protegido, caixa humano e Julinho preservados')

const mundo=()=>vinculaPlanosOficiais(buildPyramid(s.managers,0,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true),s)
const est=computeEstadualCarreira('Paulista',mundo(),s.seed,s.seasonNo,1.12,true,{},false)!
assert(est&&est.rounds.length)
const jogos=est.rounds.flatMap(f=>f.ties.flatMap(t=>(t.legFisicaIds??[]).flatMap((id,l)=>{
 const clubes=t.legFisicaClubes?.[l],inicio=t.legFisicaInicio?.[l]
 if(!clubes)return []
 for(const ids of Object.values(clubes))assert.equal(ids.length,11,'registro guarda XI real também em jogo de dois bots')
 return [{id,r:0,clubes,inicio}]
})))
assert(jogos.length>0)
s=reducer(s,{type:'OFICIAL_COPA_FISICA',season:s.seasonNo,jogos})
const replayEst=computeEstadualCarreira('Paulista',mundo(),s.seed,s.seasonNo,1.12,true,{},false)!
assert.deepEqual(replayEst.resultado,est.resultado,'reabrir estadual inteiro não troca gols, classificados ou campeão')
const again=reducer(s,{type:'OFICIAL_COPA_FISICA',season:s.seasonNo,jogos})
assert.equal(again,s,'persistência física idempotente')
console.log('PASS estadual real SP:',jogos.length,'jogos com XI real; reabertura preserva todo o resultado')
