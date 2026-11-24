// Bancada local: usa o reducer e a temporada da revisão autorizada. Nunca autentica/grava contas.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {gzipSync,gunzipSync} from 'node:zlib'
import {reducer,INITIAL,salaryOfCard,valorOficial,renewOptions,renewCost,montePickable,balancoBot,contratoCpuFalta,contratoAtletaFalta,podeRetirarOficial,folhaBaseDoClube,categoriaOficialOk,cartaDeClubeBrasileiro,ident,completaBancoDosBots,clubesNacionaisDoMercado,contratacaoOficialPermitida,reservaTransferivelOficial,sondarLiberado} from '../../src/escalacao/store'
import {FORMATIONS} from '../../src/escalacao/types'
import * as P from '../../src/escalacao/pyramidseason'
import * as BO from '../../src/escalacao/brasil-oficial'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../../src/escalacao/sport'
import {gasDoElenco,modsDoElenco,chaveCarry,sugerirRodizio} from '../../src/escalacao/condicao'
import {planoCansacoBot} from '../../src/escalacao/bots-banco'
import {preparadorDe} from '../../src/escalacao/preparadores'
import {tecnicoPorNome,FAIXA_POR_DIV,poolDaDiv,pisoTecnico} from '../../src/escalacao/tecnicos'
import {criteriosDaTemporada} from '../../src/escalacao/criterios-carreira'
import {marcoNovaRecepcaoM2,recepcaoM2Desde} from '../../src/escalacao/motor2-recepcao-conta'
import {carregaGuardados,tiraNovos} from '../../src/escalacao/motor2/carreira'
import {stadiumOccupancy} from '../../src/escalacao/estadiodata'
import {expectativaBotsCarreira} from '../../src/escalacao/calibracao-bots-carreira'
import {novoMotor2} from '../../src/escalacao/motor2/carreira'
import {VERSAO_CRITERIOS_RECEPCAO_M2} from '../../src/escalacao/motor2/versao'
import {computeCopaBrasil,copaBrasilRewardsAsCopaRewards} from '../../src/escalacao/copa-brasil'
import {inscricoesConmebolDaTemporada} from '../../src/escalacao/conmebol-temporada'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {ESTADUAL_OFICIAL} from '../../src/escalacao/economia-oficial'
import {masterCaiu} from '../../src/escalacao/master-historia'
import {faixaDaPos} from '../../src/escalacao/loja'
import {posicaoComparavel} from '../../src/escalacao/carreira-economia'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {hierarquiaInicialBrasil} from '../../src/escalacao/hierarquia-inicial-carreira'
import {estimativaPublica,reputacaoTecnico} from './observacao-publica.mts'

const OUT=process.env.AUDIT_OUT??'/workspace/shared/auditoria-serie-d-20261123'
mkdirSync(OUT,{recursive:true})
// Esta repetição só cria carreiras fictícias; nunca lê snapshots de contas.
const EMAIL='diego.c.fonseca@gmail.com',SEC=['GOL','LAT','ZAG','MEI','ATA'],DIV=['A','B','C','D','V']
const scoutTier=process.env.REPEAT_SCOUT_TIER as 'ouro'|'prata'|undefined
if(scoutTier)_bancadaApoio(EMAIL,scoutTier)
_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
let rand=P.mulberry(20261123),steps=0,esperaVirtual=0
function act(s:any,a:any){const old=Math.random;Math.random=rand;try{steps++;return reducer(s,a)}finally{Math.random=old}}
const rate=(c:any)=>(c.lo+c.hi)/2
const avg=(cs:any[])=>cs.length?cs.reduce((n,c)=>n+rate(c),0)/cs.length:0
const key=(c:any)=>`${c.name}|${c.club}|${c.year}`
const publico=!!process.env.REPEAT_PUBLIC_MARKET
const referenciasPublicas=new Map(hierarquiaInicialBrasil().map(c=>[c.clube,c.alvo]))
const gestaoVisivel=!!process.env.REPEAT_PUBLIC_HIERARCHY
const gasto=Number(process.env.REPEAT_SPENDING??.35)
function estimar(s:any,c:any){
 if(!publico)return rate(c)
 const escondido=s.surpriseId===c.id||s.mudoId===c.id
 const conhecida=!escondido?mine(s).squad.find(x=>key(x)===key(c)):undefined
 return estimativaPublica({...(gestaoVisivel&&!escondido&&s.oficial?.forcaInicial?{referenciaClube:referenciasPublicas.get(c.club)}:{}),pos:c.pos,...(!escondido?{name:c.name,club:c.club,year:c.year}:{}),...(conhecida?{conhecido:rate(conhecida)}:{})},divOf(s))
}
function valorEstimado(s:any,c:any){
 if(!publico)return valorOficial(s,c)
 const n=estimar(s,c);return Math.max(2,Math.round(Math.pow(Math.max(0,n-40)/10,1.55)*3.2*1.15))
}
function mine(s:any){return s.managers[s.youIdx]}
function divOf(s:any){return s.careerPlacements['m'+mine(s).id]}
const forcaPropria=rate
const activeBench=(p:string)=>['bench','manager','human'].includes(p)
function reserveCash(s:any,m:any){
 const wages=s.seasonNo>=4?m.squad.reduce((n,c)=>n+salaryOfCard(c),0):0
 const coach=s.careerTecnicos?.[m.teamName],staff=s.seasonNo>=4?(Math.round((s.careerTecnicoPago?.[coach]??0)/10)+(s.careerPreparador?.[m.teamName]?2:0)):0
 const renewals=m.squad.filter(c=>c.contratoAte!=null&&c.contratoAte<=s.seasonNo&&!c.fake&&!c.cria).reduce((n,c)=>n+Math.ceil(valorOficial(s,c)/2),0)
 return Math.max(15,Math.ceil((wages+staff)*1.15)+renewals)
}
function humanSetup(s:any){
 const me=mine(s)
 if(!s.careerMaster?.[me.id]||s.careerMaster[me.id].desde+s.careerMaster[me.id].anos<=s.seasonNo){
  s=act(s,{type:'MASTER_MERCADO',mgrId:me.id})
  for(const brandId of ['oittolabs','gecg','dsouza','tidex']){s=act(s,{type:'SET_MASTER',mgrId:me.id,brandId});if(s.careerMaster?.[me.id]?.desde===s.seasonNo)break}
 }
 if(!s.careerPreparador?.[me.teamName]&&s.careerCoins[me.id]>reserveCash(s,me)+45)s=act(s,{type:'BUY_PREPARADOR',key:'paixao'})
 return s
}
function prepare(s:any){
 s=act(s,{type:'LIGA_MOTOR2'});s.motor2RecepcaoDesde??=marcoNovaRecepcaoM2(s,EMAIL)
 if(!s.cpuSquads)s=act(s,{type:'SEED_CPU_SQUADS',squads:P.seedCpuSquadsOficial(s)})
 s=act(s,{type:'ALICIAR_SEED'});return s
}
function auction(s:any,policy='pass'){
 if(process.env.AUDIT_DEBUG_MARKET)console.log('MARKET_ENTER',JSON.stringify({policy,screen:s.screen,phase:s.phase,quota:mine(s).deepSquad,current:s.currentCards?.slice(0,2),deck:Object.fromEntries(SEC.map(p=>[p,s.deck[p]?.length])),money:mine(s).money,auctionRival:mine(s).auctionRival,slots:mine(s).squad.length,stock:s.stock}))
 const buys:any[]=[];let guard=0
 while(['auction','monte','cerimonia'].includes(s.screen)&&guard++<15000){
  const before=mine(s).squad.length
  if(s.screen==='cerimonia')s=act(s,{type:'FINISH_CEREMONY'})
  else if(s.screen==='monte'){
   const id=s.monteOrder[s.monteIdx],m=mine(s)
   const pick=activeBench(policy)&&id===m.id?[...s.monte].filter(c=>montePickable(s,m,c)&&(policy!=='human'||m.money-(c.seller===m.id?0:c.paid??0)>=reserveCash(s,m))).sort((a,b)=>estimar(s,b)-estimar(s,a)).find(c=>m.squad.filter(x=>x.pos===c.pos).length<FORMATIONS[m.formation][c.pos]*2):undefined
   if(pick){s=act(s,{type:'MONTE_PICK',mgrId:id,cardId:pick.id});continue}
   s=act(s,{type:'MONTE_PASS',mgrId:id})
   if(s.screen==='monte'&&s.monteOrder[s.monteIdx]===id)s=act(s,{type:'MONTE_TIMEOUT'})
  }else if(s.phase==='envelope'||s.phase==='resq_envelope'){
   const m=mine(s),bids:{cardId:string;amount:number}[]=[];let budget=Math.max(0,Math.min(Math.floor(m.money*gasto),policy==='human'?m.money-reserveCash(s,m):Infinity))
   if(policy!=='pass'){
    const candidates=s.currentCards.map((c:any)=>({c,weak:[...m.squad].filter(x=>x.pos===c.pos).sort((a,b)=>forcaPropria(b)-forcaPropria(a))[FORMATIONS[m.formation][c.pos]-1]}))
      .filter(({c,weak}:any)=>!weak||estimar(s,c)>forcaPropria(weak)+1||(activeBench(policy)&&m.squad.filter(x=>x.pos===c.pos).length<FORMATIONS[m.formation][c.pos]*2)).sort((a:any,b:any)=>estimar(s,b.c)-estimar(s,a.c))
    for(const {c,weak} of candidates){const price=Math.min(budget,Math.max(1,gestaoVisivel?(c.paid??0):0,Math.ceil(valorEstimado(s,c)*(policy==='aggressive'?1.35:.9))))
     if(price>0&&(!gestaoVisivel||price>=(c.paid??0))){bids.push({cardId:c.id,amount:price});budget-=price;if(budget<=0)break}}
    if(s.tecLote){bids.length=0;const t=tecnicoPorNome(s.tecLote.nome),base=gestaoVisivel?s.tecLote.piso:publico?({D:3,C:5,B:9,A:15}[divOf(s)]??3):(t?pisoTecnico(t.div,true):s.tecLote.piso),amount=Math.min(Math.max(0,m.money-reserveCash(s,m)),Math.ceil(base*(gestaoVisivel?1.15:1.7)));if(amount>0&&(publico||amount>=s.tecLote.piso))bids.push({cardId:s.currentCards[0].id,amount})}
   }
   s=act(s,{type:'SUBMIT_ENVELOPE',mgrId:m.id,bids});if(s.phase==='envelope'||s.phase==='resq_envelope')s=act(s,{type:'FORCE_SEAL'})
  }else if(s.phase==='reveal'||s.phase==='resq_reveal')s=act(s,{type:'ADVANCE_REVEAL'})
  else if(s.phase==='tiebreak'){
   // A bancada espera o MESMO prazo nativo sem executar centenas de cliques
   // prematuros. Só o relógio virtual avança; nenhuma carta/decisão é alterada.
   if(gestaoVisivel&&s.phaseDeadline)esperaVirtual+=Math.max(0,s.phaseDeadline-Date.now()+1)
   s=act(s,{type:'FORCE_TIEBREAK'})
  }
  else throw Error(`Unknown auction ${s.screen}/${s.phase}`)
  if(mine(s).squad.length>before)buys.push({phase:s.phase,count:mine(s).squad.length,money:mine(s).money})
 }
 if(guard>=15000)throw Error('Auction stuck '+s.phase)
 return {s,buys,iterations:guard}
}
function start(club:string,seed:number,policy='pass'){
 rand=P.mulberry(seed)
 let s=act(INITIAL,{type:'START_CAREER_SOLO',teamName:club,formation:'4-3-3',rivals:5,league:'both',oficial:{clube:club}})
 if(!s.oficial)throw Error('Not official')
 s=auction(s,policy).s;return prepare(s)
}
function inputs(s:any,rotate=false){
 const me=mine(s),lines=structuredClone(s.careerLineup??{}),by=lines[me.id]??={},inicio:any={}
 for(const c of me.squad){const g=s.condicaoCarry?.[chaveCarry(c)]?.g;if(g!=null)inicio[c.id]=g}
 const rec=preparadorDe(s.careerPreparador?.[me.teamName])?.banco
 let ids=P.lineupAt(lines,me.id,Math.max(0,s.round-1),me.squad,me.formation).map((c:any)=>c.id)
 const strongest=P.lineupAt({},me.id,0,me.squad,me.formation).map((c:any)=>c.id)
 for(let r=Math.max(0,s.round);r<38;r++){
  // Um gestor volta aos melhores disponíveis quando os titulares descansam.
  // Reutilizar apenas o XI anterior prendia reservas fracos indefinidamente.
  if((process.env.AUDIT_RESELECT||gestaoVisivel)&&rotate)ids=[...strongest]
  if(rotate){const gas=gasDoElenco(by,r,me.squad,0,inicio,rec);ids=sugerirRodizio(ids,me.squad,gas)?.ids??ids}
  by[r]=[...ids]
 }
 lines[me.id]=by
 const mods=modsDoElenco(by,38,me.squad,r=>P.lineupAt(lines,me.id,r,me.squad,me.formation).map((c:any)=>c.id),s.eventoTemporada,s.seasonNo,0,inicio,rec)
 const seasonSeed=(s.seed^Math.imul(s.seasonNo,2654435761))>>>0
 const world=P.vinculaPlanosOficiais(P.buildPyramid(s.managers,me.id,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true),s)
 const botPlans:any={},botCarry:any={}
 if(s.botFadigaDesde!=null&&s.seasonNo>=s.botFadigaDesde){for(const t of world[divOf(s)]){
  if(t.human)continue;const begin:any={};for(const c of t.squad){const g=s.botCarry?.[chaveCarry(c)];if(g!=null)begin[c.id]=g}
  const plan=planoCansacoBot({squad:t.squad,need:FORMATIONS[t.formation??'4-3-3'],inicio:begin,seed:seasonSeed,seasonNo:s.seasonNo,nome:t.name,rodadas:38,banco:preparadorDe(s.careerPreparador?.[t.name])?.banco})
  botPlans[t.name]=plan;for(const c of t.squad)if(plan.gasFim[c.id]<100)botCarry[chaveCarry(c)]=plan.gasFim[c.id]
 }}
 const tecs:any={};for(const [club,name] of Object.entries(s.careerTecnicos??{})){
  const t=tecnicoPorNome(name as string);if(!t)continue;const desde=s.careerTecnicosDesde?.[club],fx=FAIXA_POR_DIV[t.div]
  tecs[club]={lo:t.lo??fx.lo,hi:t.hi??fx.hi,desdeR:!desde||desde.t<s.seasonNo?0:desde.t===s.seasonNo?desde.r:999}
 }
 return {world,seasonSeed,lines,mods,tecs,botPlans,botCarry,inicio,gas:gasDoElenco(by,38,me.squad,0,inicio,rec)}
}
function season(s:any,rotate=false,m2=true){
 if(process.env.AUDIT_POLICIES==='human'||gestaoVisivel&&politica==='human')s=humanSetup(s)
 if(process.env.AUDIT_POLICIES==='manager'){
  s=act(s,{type:'MASTER_MERCADO',mgrId:mine(s).id});s=act(s,{type:'SET_MASTER',mgrId:mine(s).id,brandId:'oittolabs'})
  if(!s.careerPreparador?.[mine(s).teamName]&&s.careerCoins[mine(s).id]>60)s=act(s,{type:'BUY_PREPARADOR',key:'paixao'})
 }
 if(rotate&&s.round===0)s=act(s,{type:'SET_LINEUP',mgrId:mine(s).id,ids:P.lineupAt({},mine(s).id,0,mine(s).squad,mine(s).formation).map((c:any)=>c.id)})
 const t=performance.now(),i=inputs(s,rotate),marco=s.motor2Desde,m2start=m2?(marco?.season===s.seasonNo?marco.round:0):undefined
 carregaGuardados(s.m2Res,s.seasonNo,'audit:'+s.seed)
 const res=P.simulaTemporadaOficial(i.world,i.seasonSeed,38,2025+s.seasonNo,s.careerTactics??{},i.lines,1.12,true,8,{},s.careerHalftime??{},s.careerPenalty??{},i.tecs,{[mine(s).id]:i.mods},i.botPlans,m2start,recepcaoM2Desde(s,EMAIL),{criterios:criteriosDaTemporada(s),disputadas:38,intervaloAberto:true})
 let uiPlayoff=false
 if(process.env.AUDIT_UI_PLAYOFF||gestaoVisivel){const tb=res.tables.B,index=tb.findIndex(t=>t.you);if(index>=2&&index<=5){
  const po=P.computePlayoffB(tb,s.seed,s.seasonNo,1.12,true,i.lines,m2start!=null&&m2start<38,VERSAO_CRITERIOS_RECEPCAO_M2)
  if(po){const conf=po.ties.map(t=>({a:t.b.name,b:t.a.name,ida:[t.legs[0][0],t.legs[0][1]],volta:[t.legs[1][1],t.legs[1][0]],vencedor:t.win==='a'?t.a.name:t.b.name}));res.oficial={...res.oficial,B:{playoff:conf,sobem:[tb[0].name,tb[1].name,...conf.map(c=>c.vencedor)]}};uiPlayoff=true}
 }}
 const newM2=tiraNovos();s={...s,round:38,careerLineup:i.lines};
 const cal=Object.fromEntries(s.managers.filter(m=>m.isHuman).map(m=>[m.id,['A','B'].includes(s.careerPlacements['m'+m.id])?Array.from({length:38},(_,r)=>r):[...new Set(res.oficial.agenda.filter(j=>j.casa===m.teamName||j.fora===m.teamName).map(j=>j.r-1))].sort((a,b)=>a-b)]));
 s=act(s,{type:'OFICIAL_CALENDARIO_FISICO',season:s.seasonNo,cal,clubes:res.oficial.datasClubes});
 i.botCarry={...i.botCarry,...res.oficial.gasBots};i.gas=gasDoElenco(i.lines[mine(s).id],38,mine(s).squad,0,i.inicio,preparadorDe(s.careerPreparador?.[mine(s).teamName])?.banco,new Set(cal[mine(s).id]));if(newM2)s=act(s,{type:'GUARDA_M2',novos:newM2})
 const free=BO.CLUBES_BR_TODOS.filter(c=>c.div==='E').map(c=>c.nome)
 const placements=P.promocoesOficial(res.tables,res.oficial,s.seed,free)
 const me=mine(s),div=divOf(s),table=res.tables[div],pos=table.findIndex(t=>t.you)+1,row=table[pos-1]
 const agenda=res.oficial.agenda.filter(a=>a.casa===me.teamName||a.fora===me.teamName)
 const summary={season:s.seasonNo,club:me.teamName,div,next:placements['m'+me.id],pos,pts:row?.pts,gf:row?.gf,ga:row?.ga,w:row?.w,d:row?.d,l:row?.l,strength:avg(P.lineupAt(i.lines,me.id,37,me.squad,me.formation)),players:me.squad.length,coins:s.careerCoins[me.id],salary:me.squad.reduce((n,c)=>n+salaryOfCard(c),0),agendaGames:div==='B'||div==='A'?38+(uiPlayoff?2:0):agenda.length,chargedFitnessRounds:(s.oficialFisica?.cal[me.id]??[]).length,minGas:Math.min(...Object.values(i.gas) as number[]),below25:Object.values(i.gas).filter(g=>Number(g)<25).length,counts:Object.fromEntries(DIV.map(d=>[d,res.tables[d].length])),uiPlayoff,ms:Math.round(performance.now()-t)}
 return {s,i,res,placements,summary}
}
function advance(x:ReturnType<typeof season>,policy='pass'){
 let {s,res,placements,i}=x
 const liga=P.premiosLigaOficial(res.tables,res.oficial,placements,false),sb=P.scorerRewards(res.divTop)
 const rewards={...liga.rewards};for(const [id,n] of Object.entries(sb.rewards))rewards[+id]=(rewards[+id]??0)+Number(n)
 let cups:any=undefined,cbResult:any=null,continental:any=null
 const botRewards={...P.clubRewardsOficial(res.tables,res.oficial,placements)}
 const addBot=(v:any)=>{for(const [id,n] of Object.entries(v??{}))botRewards[id]=(botRewards[id]??0)+Number(n)}
 if(process.env.AUDIT_FULL){addBot(sb.clubRewards);addBot(P.premiosColocacaoBots(res.tables))}
 if(policy==='human'||process.env.AUDIT_FULL){
  const me=mine(s),myState=BO.clubeOficial(me.teamName)?.estadual,estCache=new Map<string,any>(),getEst=(name:string)=>{
   if(!estCache.has(name))estCache.set(name,P.computeEstadualCarreira(name,i.world,s.seed,s.seasonNo,1.12,true,i.lines,true,VERSAO_CRITERIOS_RECEPCAO_M2)?.resultado??null)
   return estCache.get(name)
  }
  const est=myState?getEst(myState):null
  if(est?.classificacao.includes(me.teamName)){
   const lostSemi=est.fases.some(f=>/Semi/i.test(f.nome)&&f.confrontos.some(c=>(c.a===me.teamName||c.b===me.teamName)&&c.vencedor!==me.teamName))
   const coins=est.campeao===me.teamName?ESTADUAL_OFICIAL.campeao:est.vice===me.teamName?ESTADUAL_OFICIAL.vice:lostSemi?ESTADUAL_OFICIAL.semi:ESTADUAL_OFICIAL.participou
   s=act(s,{type:'ESTADUAL_FEITO',premios:[{coins,txt:'🏟️ Estadual'}],estadual:{temporada:s.seasonNo,nome:myState,campeao:est.campeao,vice:est.vice,caem:est.caem??[],classificacao:est.classificacao}})
  }
  const entries=P.entradasCopaBrasilOficial(i.world,s.seed,{seasonNo:s.seasonNo,prev:s.oficialCampeoes?.find(c=>c.temporada===s.seasonNo-1),classificacao:name=>getEst(name)?.classificacao??null})
  const cb=entries?computeCopaBrasil(i.world,s.seed,s.seasonNo,1.12,true,i.lines,true,VERSAO_CRITERIOS_RECEPCAO_M2,entries):null
  cbResult=cb
  if(process.env.AUDIT_FULL&&cb)addBot(copaBrasilRewardsAsCopaRewards(cb,null,true).clubRewards)
  if(cb){const p=P.premiosCdbOficial(cb,false);for(const [id,n] of Object.entries(p.rewards))rewards[+id]=(rewards[+id]??0)+Number(n)}
  cups={estadual:est?.campeao??null,cdb:cb?.champion?.name??null,reward:cb?P.premiosCdbOficial(cb,false).rewards[me.id]??0:0}
  if(process.env.AUDIT_FULL){
   const prev=s.oficialCampeoes?.find(c=>c.temporada===s.seasonNo-1),reference=prev?.serieATop?{serieA:prev.serieATop,copa:prev.copa,copaVice:prev.copaVice,liberta:prev.liberta,sula:prev.sula}:null
   const ins=s.seasonNo===1||reference?inscricoesConmebolDaTemporada(reference,s.seasonNo,s.oficial.vagasDesde):null,giro=s.oficial.giro!=null&&s.seasonNo>=s.oficial.giro?s.seasonNo:undefined
   const lib=ins?P.computeLibertadoresCarreira(ins.liberta,i.world,s.seed,s.seasonNo,1.12,true,true,VERSAO_CRITERIOS_RECEPCAO_M2,giro):null
   const sul=ins&&lib?P.computeSulaCarreira(ins.sula,{grupos:lib.resultado.sulaGrupos,playoff:lib.resultado.sulaPlayoff},i.world,s.seed,s.seasonNo,1.12,true,true,VERSAO_CRITERIOS_RECEPCAO_M2,giro):null
   const inter=lib?P.computeIntercontinentalCarreira(lib.resultado.campeao,i.world,s.seed,s.seasonNo,1.12,true,true,VERSAO_CRITERIOS_RECEPCAO_M2,giro):null
   const enteredLib=lib?.resultado.classificacao.includes(me.teamName)??false,enteredSula=sul?.resultado.classificacao.includes(me.teamName)??false,enteredInter=lib?.resultado.campeao===me.teamName
   const lp=enteredLib?P.premioLibertadoresDet(lib!.resultado,me.teamName):null,sp=enteredSula?P.premioSulaDet(sul!.resultado,me.teamName):null,ip=enteredInter&&inter?P.premioIntercontinentalDet(inter.resultado,me.teamName):null
   let extra=(lp?.v??0)+(sp?.v??0)+(ip?.v??0),topScorer:any[]=[]
   for(const [c,bonus] of [[lib,30],[sul,20]] as const){
    if(!c)continue;const counts=new Map<string,any>();for(const round of c.rounds)for(const tie of round.ties)for(const g of tie.goals){const t=g.home?tie.a:tie.b,k=t.name+'|'+g.name,v=counts.get(k)??{name:g.name,team:t.name,goals:0,human:t.human};v.goals++;counts.set(k,v)}
    const top=[...counts.values()].sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name))[0];if(top?.human&&top.team===me.teamName){extra+=bonus;topScorer.push({...top,bonus})}
   }
   rewards[me.id]=(rewards[me.id]??0)+extra
   continental={eligibleLists:ins?{lib:[...ins.liberta.grupos,...ins.liberta.fase2,...ins.liberta.fase1].length,sula:[...ins.sula.grupos,...ins.sula.fase1].length}:null,calculated:{lib:!!lib,sula:!!sul,inter:!!inter},liberta:enteredLib?lp:null,sula:enteredSula?sp:null,inter:enteredInter?ip:null,extra,topScorer,champions:{liberta:lib?.resultado.campeao,sula:sul?.resultado.campeao,inter:inter?.resultado.campeao}}
   cups={...cups,continental}
  }
  s=act(s,{type:'CAMPEOES_OFICIAIS',campeoes:{temporada:s.seasonNo,serieA:res.tables.A[0].name,serieAVice:res.tables.A[1].name,copa:cb?.champion?.name??'',copaVice:cb?.vice?.name??'',serieATop:res.tables.A.map(t=>t.name),campeaoC:res.oficial.C.campeao,campeaoD:res.oficial.D.campeao,...continental?.champions}})
 }
 const finalPos:any={},occ:any={};for(const d of DIV)res.tables[d].forEach((t,j)=>{if(t.human){finalPos[t.teamId]=j+1;occ[t.teamId]=stadiumOccupancy(posicaoComparavel(j+1,res.tables[d].length),s.stadiums?.[t.teamId])}})
 s=act(s,{type:'CLOSE_SEASON_BOOKS',rewards,stadiumOcc:occ,finalPos,placements,artilheiros:liga.linhas})
 const ledger=(s.careerLedger??[]).filter((l:any)=>l.season===s.seasonNo)
 s=act(s,{type:'OPEN_RESERVE_LIST',placements,rewards,clubRewards:botRewards,champions:P.seasonChampions(res.tables),botCarry:i.botCarry,mesmo:policy==='pass',janelaNova:true})
 const me=mine(s),renewed:any[]=[]
 for(const c of [...me.squad])if(c.contratoAte!=null&&c.contratoAte<s.seasonNo&&!c.fake&&!c.cria){
  const value=valorOficial(s,c),options=renewOptions(value),anos=options.includes(5)?5:options[options.length-1],price=renewCost(value,anos)
  s=act(s,{type:'RENEW_CONTRACT',mgrId:me.id,cardId:c.id,anos});renewed.push({name:c.name,price})
 }
 if(['manager','human'].includes(policy))for(const pos of SEC){const cards=mine(s).squad.filter(c=>c.pos===pos&&!c.cria&&!c.fake).sort((a,b)=>forcaPropria(a)-forcaPropria(b));if(cards.length>FORMATIONS[mine(s).formation][pos]+(policy==='human'?1:0))s=act(s,{type:'TOGGLE_RESERVE_LIST',mgrId:me.id,cardId:cards[0].id})}
 if((process.env.AUDIT_COMISSAO||gestaoVisivel)&&policy==='human'){
  const own=mine(s),dv=divOf(s),coach=s.careerTecnicos?.[own.teamName],ct=coach?tecnicoPorNome(coach):null
  if(coach&&(s.careerTecnicoContrato?.[own.teamName]??Infinity)<s.seasonNo)s=act(s,{type:'RENOVAR_TECNICO'})
  if(s.careerPreparador?.[own.teamName]&&(s.careerPreparadorContrato?.[own.teamName]??Infinity)<s.seasonNo)s=act(s,{type:'RENOVAR_PREPARADOR'})
  const coachCandidates=poolDaDiv(dv).filter(t=>!Object.entries(s.careerTecnicos??{}).some(([club,name])=>name===t.nome&&(s.careerTecnicoContrato?.[club]??Infinity)>=s.seasonNo)).sort((a,b)=>publico?reputacaoTecnico(b.nome,dv)-reputacaoTecnico(a.nome,dv)||a.nome.localeCompare(b.nome):(b.lo??FAIXA_POR_DIV[b.div].lo)+(b.hi??FAIXA_POR_DIV[b.div].hi)-(a.lo??FAIXA_POR_DIV[a.div].lo)-(a.hi??FAIXA_POR_DIV[a.div].hi))
  const target=coachCandidates.find(t=>!ct||(publico?reputacaoTecnico(t.nome,dv)>reputacaoTecnico(ct.nome,dv)+1:(t.lo??FAIXA_POR_DIV[t.div].lo)+(t.hi??FAIXA_POR_DIV[t.div].hi)>(ct.lo??FAIXA_POR_DIV[ct.div].lo)+(ct.hi??FAIXA_POR_DIV[ct.div].hi)+2))
  if(target&&s.careerCoins[own.id]>reserveCash(s,own)+(publico?({D:3,C:5,B:9,A:15}[dv]??3):pisoTecnico(target.div,true))*2)s=act(s,{type:'ALICIAR_MARCAR',tec:target.nome})
  const market=P.buildPyramid(s.managers,own.id,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true),xi=P.lineupAt({},own.id,0,own.squad,own.formation)
  const mercadoAlvos=gestaoVisivel&&s.oficial?.forcaInicial?clubesNacionaisDoMercado(s).map(t=>({name:t.teamName,squad:t.squad,formation:t.formation,teamId:t.fundo?-1:s.managers.find(m=>m.teamName===t.teamName)!.id,human:false})):market[dv].filter(t=>!t.human)
  const targets=mercadoAlvos.flatMap(t=>t.squad.filter(c=>!c.fake&&!c.cria&&(!gestaoVisivel||(contratacaoOficialPermitida(s,own,c)&&sondarLiberado(c,scoutTier)&&(contratoAtletaFalta(s,c)<=0||reservaTransferivelOficial(s,t.squad,c,t.formation))))&&(gestaoVisivel||publico||((c.fame??1)<=3&&contratoAtletaFalta(s,c)<=0))&&podeRetirarOficial(s,t.squad,c.pos,t.formation)).map(c=>({t,c,gain:estimar(s,c)-Math.min(...xi.filter(x=>x.pos===c.pos).map(forcaPropria))}))).filter(x=>x.gain>2).sort((a,b)=>b.gain-a.gain)
  if(targets[0]){const {t,c}=targets[0];s=act(s,{type:'ALICIAR_MARCAR',cardId:c.id,...(t.teamId<0?{card:c,clube:t.name,squad:t.squad}:{})})}
 }
 if(policy==='pass')s=act(s,{type:'CONFIRM_MESMO_TIME'})
 else{s=act(s,{type:'RESERVE_AUCTION_ONLINE'});s=auction(s,policy).s}
 s=prepare(s)
 // Contrafactual de bancada: estender a mesma rotina paga às outras divisões.
 // A alteração da chave humana é temporária, apenas para reutilizar o seletor
 // original; humano nunca compra por aqui. Não altera overalls nem injeta caixa.
 if(process.env.REPEAT_WORLD_MARKET){
  const id='m'+mine(s).id,original=s.careerPlacements[id]
  try{for(const d of ['A','B','C','D'])if(d!==original){s.careerPlacements[id]=d;completaBancoDosBots(s)}}
  finally{s.careerPlacements[id]=original}
 }
 return {s,ledger,renewed,cups}
}


const clube=process.env.REPEAT_CLUB??'Portuguesa'
const politica=process.env.REPEAT_MANAGEMENT??'human'
assert(['human','pass'].includes(politica),'política conhecida')
const seeds=(process.env.REPEAT_SEEDS??'20261123,7919001,871217,20332403,31892031,42771721,54183913,68218117,77323109,89117321').split(',').map(Number)
const limite=Number(process.env.REPEAT_YEARS??12)
const realNow=Date.now
Date.now=()=>Date.UTC(2026,10,23,12)+steps*11+esperaVirtual
const sourceFiles=['src/escalacao/store.tsx','src/escalacao/pyramidseason.tsx','src/escalacao/bots-banco.ts','src/escalacao/carreira-economia.ts','src/escalacao/condicao.ts','src/escalacao/copa-brasil.ts','src/escalacao/data-oficial.ts','src/escalacao/motor2/motor.ts','src/escalacao/calibracao-bots-carreira.ts','src/escalacao/mercado-bots-oficial.ts','src/escalacao/hierarquia-inicial-carreira.ts','src/escalacao/forca-largada.ts','src/escalacao/motor2/atributos.ts','src/escalacao/motor2/carreira.ts','src/escalacao/hierarquia-brasil-2026.json','scripts/auditoria-serie-d/repeticao.mts','scripts/auditoria-serie-d/observacao-publica.mts']
const h=createHash('sha256');for(const f of sourceFiles)h.update(f).update(readFileSync(f))
const report:any={metodo:{clube,seeds,limiteAcesso:limite,seguimento:2,salariosDesde:4,historicosPreservados:true,...(process.env.REPEAT_WORLD_MARKET?{contrafactual:'mesma rotina de banco/reforços paga em A/B/C/D a cada janela, em ordem A/B/C/D, sem mudar humano, categorias ou overalls'}:{}),politica:'humano automático: lances por faixa de over, reserva para compromissos, venda de excedentes, renovações e comissão; sem aportes, sem rerrolar partidas',base:'f7797497 + revisão local aprovada (ainda não publicada)',sourceSha256:h.digest('hex'),limites:['simulação anual automatizada; não reproduz cada toque humano','copas nativas calculadas após a liga; sem calendário intercalado experimental','não executa todos os eventos pessoais/lesões do usuário; condição e rodízio derivados das escalações','registro físico de todas as fases de copas ainda não reproduzido por esta bancada','faltam dez estaduais no produto atual; Brasiliense não recebe um Candangão inventado','uma única política de gestão e dez sementes por clube; não é uma probabilidade populacional']},runs:[]}
const guardar=()=>writeFileSync(OUT+'/repeticao.json',JSON.stringify(report,null,2))
report.metodo.gestao=politica==='human'?'conservadora com mercado':'sem compras ou nova comissão; mantém e renova o elenco inicial'
report.metodo.mercadoBots=process.env.REPEAT_MERCADO_ANTERIOR?'anterior: flag desligada somente no módulo virtual da bancada':'novo: janela nacional, prioridade XI e reserva de compromissos'
report.metodo.observacaoMercado=publico?'estimativas aproximadas por nome/clube/ano públicos, atributos conhecidos só do próprio elenco; sem consultar nível/categoria ocultos do lote':'diagnóstico com acesso privilegiado às notas/categorias reais antes da compra; não representa informação de humano comum'
if(process.env.REPEAT_SEM_TRANSFERENCIAS)report.metodo.experimentoTransferencias='controle virtual: transferências de reservas desligadas, demais revisões atuais preservadas; hash refere-se aos arquivos originais'
report.metodo.hierarquia='hierarquia externa arquivada; não aplicada às notas nem ao desempenho; futebol histórico preservado'
report.metodo.limites[report.metodo.limites.length-1]=`uma única política de gestão e ${seeds.length} semente(s) nesta execução; não é uma probabilidade populacional`
if(process.env.REPEAT_TETO_INCLUSIVO)report.metodo.experimentoCategoria='transformação virtual: máximo A todos, B até craque, C até promessa, D até bom; inclui categorias inferiores, mesmo filtro para humano e CPU; arquivos de produto intactos'
if(process.env.REPEAT_REFERENCIA_ESCALA)report.metodo.experimentoEscala='transformação virtual: quantis por fonte/categoria/posição alinhados ao catálogo principal; mesmos nomes/classes, grupos pequenos intactos; não é avaliação factual de jogador nem mudança de produto'
report.metodo.largada='decisão final: overalls originais, sem calibração ou ajuste oculto; preços/salários e mercado nativos aprovados'
report.metodo.execucao={patrocinio:process.env.AUDIT_POLICIES==='human'||gestaoVisivel,comissao:!!process.env.AUDIT_COMISSAO||gestaoVisivel,playoffFisico:!!process.env.AUDIT_UI_PLAYOFF||gestaoVisivel,publico,gasto,scoutTier:scoutTier??'básico',prazosNativosComEsperaVirtual:gestaoVisivel,recomporTitularesAposDescanso:!!process.env.AUDIT_RESELECT||gestaoVisivel}
if(gestaoVisivel)report.metodo.gestaoInformada={prior:publico?'hierarquia pública do clube de origem + reputação aproximada; sem notas ocultas':'controle privilegiado com notas reais dos alvos',orcamentoFracao:gasto,universo:'mesma lista nacional da interface; respeita botões indisponíveis, olheiro configurado e piso visível'}
if(publico)report.metodo.politica='ator aproximado por informação pública: estima qualidade/preço, pode errar no alvo ou no lance; gestão conservadora, sem aportes e sem refazer derrotas'
function integro(s:any){
 const erros:any[]=[]
 for(const m of s.managers){
  for(const pos of SEC){const n=m.squad.filter(c=>c.pos===pos&&!c.fake).length;if(n<FORMATIONS[m.formation][pos])erros.push({clube:m.teamName,pos,n,minimo:FORMATIONS[m.formation][pos]})}
 }
 return erros
}
try{
 for(const seed of seeds){
  steps=0;esperaVirtual=0
  let s=start(clube,seed,politica)
  const inicial=mine(s).squad.map(c=>({name:c.name,club:c.club,year:c.year,pos:c.pos,lo:c.lo,hi:c.hi,fame:c.fame,promessa:!!c.promessa}))
  if(clube==='Portuguesa')assert(inicial.some(c=>c.name==='Julinho'),'Julinho continua no sorteio inicial')
  const run:any={clube,seed,seedJogo:s.seed,inicial,comecouNaA:divOf(s)==='A',primeiroAcessoA:divOf(s)==='A'?0:null,estreiaA:divOf(s)==='A'?1:null,primeiraCampanhaA:null,anos:[],alertas:[]}
  report.runs.push(run);guardar()
  for(let ano=1;ano<=limite+(run.primeiroAcessoA!=null?2:0);ano++){
   const completo=structuredClone(s)
   const x=season(s,true,true)
   // Evidência opcional: não interfere nas entradas, sorteios nem decisões da carreira.
   let detalhe:any=undefined
   if(process.env.REPEAT_DETAIL){
    const divisao=divOf(completo),eu=mine(completo)
    const quadro=(d:string)=>x.res.tables[d].map((t:any,j:number)=>({clube:t.name,id:t.teamId,pos:j+1,pts:t.pts,w:t.w,d:t.d,l:t.l,gf:t.gf,ga:t.ga,forca:avg(t.xi),elenco:t.squad.length,humano:!!t.human,rival:!!t.rival,tecnico:completo.careerTecnicos?.[t.name]??null,caixa:t.teamId>=0?(t.human?completo.careerCoins?.[t.teamId]:completo.clubCash?.['m'+t.teamId]):completo.clubCash?.[t.name],cartas:t.xi.map((c:any)=>({name:c.name,pos:c.pos,lo:c.lo,hi:c.hi,fame:c.fame,gasMod:c.gasMod??0}))}))
    detalhe={divisoes:Object.fromEntries(DIV.filter(d=>d!=='V').map(d=>[d,quadro(d)])),playoff:divisao==='B'?x.res.oficial.B:null,tecnico:completo.careerTecnicos?.[eu.teamName]??null,preparador:completo.careerPreparador?.[eu.teamName]??null}
    if(divisao==='B')writeFileSync(`${OUT}/b-${seed}-t${ano}.json.gz`,gzipSync(JSON.stringify({s:completo,i:x.i,summary:x.summary,playoff:x.res.oficial.B,tabela:detalhe.divisoes.B})))
   }
   const quadroBots=x.s.managers.filter(m=>!m.isHuman).map(m=>({clube:m.teamName,caixa:x.s.clubCash?.['m'+m.id]??0,folha:folhaBaseDoClube(x.s,m),forca:avg(P.lineupAt({},m.id,0,m.squad,m.formation))}))
   const a=advance(x,politica);s=a.s
   const saldo=x.summary.coins
   const registro:any={...x.summary,...(detalhe?{detalhe}:{}),caixaAntesFecho:saldo,caixaAposJanela:s.careerCoins[0],renovacoes:a.renewed,copas:a.cups,ledger:a.ledger,caixaBots:quadroBots,primeiroTime:completo.managers[0].squad.map(c=>key(c)),ultimoTime:mine(s).squad.map(c=>key(c)),compras:(s.careerLedger??[]).filter(l=>l.season===s.seasonNo&&(l.kind==='buy'||l.kind==='sell')).map(l=>({label:l.label,amount:l.amount})),errosElenco:integro(s)}
   if(registro.errosElenco.length)run.alertas.push({ano,erros:registro.errosElenco})
   run.anos.push(registro)
   if(x.summary.next==='A'&&run.primeiroAcessoA==null){run.primeiroAcessoA=x.summary.season;run.estreiaA=x.summary.season+1}
   if(x.summary.div==='A'&&run.primeiraCampanhaA==null)run.primeiraCampanhaA={ano:x.summary.season,pos:x.summary.pos,seguiuNaA:x.summary.next==='A',caixa:s.careerCoins[0],folha:x.summary.salary}
   run.final={temporadaEncerrada:x.summary.season,div:s.careerPlacements['m0'],caixa:s.careerCoins[0],folha:mine(s).squad.reduce((n,c)=>n+salaryOfCard(c),0)}
   guardar()
   console.log('TEMPORADA',JSON.stringify({clube,seed,ano:x.summary.season,div:x.summary.div,proxima:x.summary.next,pos:x.summary.pos,caixa:s.careerCoins[0],primeiroAcessoA:run.primeiroAcessoA}))
   if(run.primeiroAcessoA!=null&&x.summary.season>=run.primeiroAcessoA+2)break
   if(run.primeiroAcessoA==null&&x.summary.season>=limite)break
  }
  run.completo=true;guardar()
  console.log('CARREIRA_CONCLUIDA',JSON.stringify({clube,seed,acessoA:run.primeiroAcessoA,primeiraA:run.primeiraCampanhaA,final:run.final}))
 }
 report.completo=true;guardar();console.log('REPETICAO_CONCLUIDA',clube,report.runs.length)
}finally{Date.now=realNow}
