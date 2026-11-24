// Bancada local: usa o reducer e a temporada publicados. Nunca autentica/grava.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {gzipSync,gunzipSync} from 'node:zlib'
import {reducer,INITIAL,salaryOfCard,valorOficial,renewOptions,renewCost,montePickable,balancoBot,contratoCpuFalta,folhaBaseDoClube,categoriaOficialOk,cartaDeClubeBrasileiro,ident} from '../../src/escalacao/store'
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
import {ESTADUAL_OFICIAL} from '../../src/escalacao/economia-oficial'
import {masterCaiu} from '../../src/escalacao/master-historia'
import {faixaDaPos} from '../../src/escalacao/loja'

const OUT=process.env.AUDIT_OUT??'/workspace/shared/auditoria-serie-d-20261123'
mkdirSync(OUT,{recursive:true})
const snap=process.env.AUDIT_FROM_ACCOUNT || (process.env.AUDIT_MODE??'probe')==='probe' ? JSON.parse(readFileSync(OUT+'/snapshot-privado.json','utf8')) : null
const EMAIL='diego.c.fonseca@gmail.com',SEC=['GOL','LAT','ZAG','MEI','ATA'],DIV=['A','B','C','D','V']
_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
let rand=P.mulberry(20261123),steps=0
function act(s:any,a:any){const old=Math.random;Math.random=rand;try{steps++;return reducer(s,a)}finally{Math.random=old}}
const rate=(c:any)=>(c.lo+c.hi)/2
const avg=(cs:any[])=>cs.length?cs.reduce((n,c)=>n+rate(c),0)/cs.length:0
const key=(c:any)=>`${c.name}|${c.club}|${c.year}`
function mine(s:any){return s.managers[s.youIdx]}
function divOf(s:any){return s.careerPlacements['m'+mine(s).id]}
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
   const pick=activeBench(policy)&&id===m.id?[...s.monte].filter(c=>montePickable(s,m,c)&&(policy!=='human'||m.money-(c.seller===m.id?0:c.paid??0)>=reserveCash(s,m))).sort((a,b)=>rate(b)-rate(a)).find(c=>m.squad.filter(x=>x.pos===c.pos).length<FORMATIONS[m.formation][c.pos]*2):undefined
   if(pick){s=act(s,{type:'MONTE_PICK',mgrId:id,cardId:pick.id});continue}
   s=act(s,{type:'MONTE_PASS',mgrId:id})
   if(s.screen==='monte'&&s.monteOrder[s.monteIdx]===id)s=act(s,{type:'MONTE_TIMEOUT'})
  }else if(s.phase==='envelope'||s.phase==='resq_envelope'){
   const m=mine(s),bids:{cardId:string;amount:number}[]=[];let budget=Math.max(0,Math.min(Math.floor(m.money*.35),policy==='human'?m.money-reserveCash(s,m):Infinity))
   if(policy!=='pass'){
    const candidates=s.currentCards.map((c:any)=>({c,weak:[...m.squad].filter(x=>x.pos===c.pos).sort((a,b)=>rate(b)-rate(a))[FORMATIONS[m.formation][c.pos]-1]}))
      .filter(({c,weak}:any)=>!weak||rate(c)>rate(weak)+1||(activeBench(policy)&&m.squad.filter(x=>x.pos===c.pos).length<FORMATIONS[m.formation][c.pos]*2)).sort((a:any,b:any)=>rate(b.c)-rate(a.c))
    for(const {c,weak} of candidates){const price=Math.min(budget,Math.max(1,Math.ceil(valorOficial(s,c)*(policy==='aggressive'?1.35:.9))))
     if(price>0){bids.push({cardId:c.id,amount:price});budget-=price;if(budget<=0)break}}
    if(s.tecLote){bids.length=0;const t=tecnicoPorNome(s.tecLote.nome),amount=Math.min(Math.max(0,m.money-reserveCash(s,m)),Math.ceil((t?pisoTecnico(t.div,true):s.tecLote.piso)*1.7));if(amount>=s.tecLote.piso)bids.push({cardId:s.currentCards[0].id,amount})}
   }
   s=act(s,{type:'SUBMIT_ENVELOPE',mgrId:m.id,bids});if(s.phase==='envelope'||s.phase==='resq_envelope')s=act(s,{type:'FORCE_SEAL'})
  }else if(s.phase==='reveal'||s.phase==='resq_reveal')s=act(s,{type:'ADVANCE_REVEAL'})
  else if(s.phase==='tiebreak')s=act(s,{type:'FORCE_TIEBREAK'})
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
  if(process.env.AUDIT_RESELECT&&rotate)ids=[...strongest]
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
 if(process.env.AUDIT_POLICIES==='human')s=humanSetup(s)
 if(process.env.AUDIT_POLICIES==='manager'){
  s=act(s,{type:'MASTER_MERCADO',mgrId:mine(s).id});s=act(s,{type:'SET_MASTER',mgrId:mine(s).id,brandId:'oittolabs'})
  if(!s.careerPreparador?.[mine(s).teamName]&&s.careerCoins[mine(s).id]>60)s=act(s,{type:'BUY_PREPARADOR',key:'paixao'})
 }
 if(rotate&&s.round===0)s=act(s,{type:'SET_LINEUP',mgrId:mine(s).id,ids:P.lineupAt({},mine(s).id,0,mine(s).squad,mine(s).formation).map((c:any)=>c.id)})
 const t=performance.now(),i=inputs(s,rotate),marco=s.motor2Desde,m2start=m2?(marco?.season===s.seasonNo?marco.round:0):undefined
 carregaGuardados(s.m2Res,s.seasonNo,'audit:'+s.seed)
 const res=P.simulaTemporadaOficial(i.world,i.seasonSeed,38,2025+s.seasonNo,s.careerTactics??{},i.lines,1.12,true,8,{},s.careerHalftime??{},s.careerPenalty??{},i.tecs,{[mine(s).id]:i.mods},i.botPlans,m2start,recepcaoM2Desde(s,EMAIL),{criterios:criteriosDaTemporada(s),disputadas:38,intervaloAberto:true})
 let uiPlayoff=false
 if(process.env.AUDIT_UI_PLAYOFF){const tb=res.tables.B,index=tb.findIndex(t=>t.you);if(index>=2&&index<=5){
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
 if(policy==='human'){
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
 const finalPos:any={},occ:any={};for(const d of DIV)res.tables[d].forEach((t,j)=>{if(t.human){finalPos[t.teamId]=j+1;occ[t.teamId]=stadiumOccupancy(j+1,s.stadiums?.[t.teamId])}})
 s=act(s,{type:'CLOSE_SEASON_BOOKS',rewards,stadiumOcc:occ,finalPos,placements,artilheiros:liga.linhas})
 const ledger=(s.careerLedger??[]).filter((l:any)=>l.season===s.seasonNo)
 s=act(s,{type:'OPEN_RESERVE_LIST',placements,rewards,clubRewards:botRewards,champions:P.seasonChampions(res.tables),botCarry:i.botCarry,mesmo:policy==='pass',janelaNova:true})
 const me=mine(s),renewed:any[]=[]
 for(const c of [...me.squad])if(c.contratoAte!=null&&c.contratoAte<s.seasonNo&&!c.fake&&!c.cria){
  const value=valorOficial(s,c),options=renewOptions(value),anos=options.includes(5)?5:options[options.length-1],price=renewCost(value,anos)
  s=act(s,{type:'RENEW_CONTRACT',mgrId:me.id,cardId:c.id,anos});renewed.push({name:c.name,price})
 }
 if(['manager','human'].includes(policy))for(const pos of SEC){const cards=mine(s).squad.filter(c=>c.pos===pos&&!c.cria&&!c.fake).sort((a,b)=>rate(a)-rate(b));if(cards.length>FORMATIONS[mine(s).formation][pos]+(policy==='human'?1:0))s=act(s,{type:'TOGGLE_RESERVE_LIST',mgrId:me.id,cardId:cards[0].id})}
 if(process.env.AUDIT_COMISSAO&&policy==='human'){
  const own=mine(s),dv=divOf(s),coach=s.careerTecnicos?.[own.teamName],ct=coach?tecnicoPorNome(coach):null
  if(coach&&(s.careerTecnicoContrato?.[own.teamName]??Infinity)<s.seasonNo)s=act(s,{type:'RENOVAR_TECNICO'})
  if(s.careerPreparador?.[own.teamName]&&(s.careerPreparadorContrato?.[own.teamName]??Infinity)<s.seasonNo)s=act(s,{type:'RENOVAR_PREPARADOR'})
  const coachCandidates=poolDaDiv(dv).filter(t=>!Object.entries(s.careerTecnicos??{}).some(([club,name])=>name===t.nome&&(s.careerTecnicoContrato?.[club]??Infinity)>=s.seasonNo)).sort((a,b)=>(b.lo??FAIXA_POR_DIV[b.div].lo)+(b.hi??FAIXA_POR_DIV[b.div].hi)-(a.lo??FAIXA_POR_DIV[a.div].lo)-(a.hi??FAIXA_POR_DIV[a.div].hi))
  const target=coachCandidates.find(t=>!ct||(t.lo??FAIXA_POR_DIV[t.div].lo)+(t.hi??FAIXA_POR_DIV[t.div].hi)>(ct.lo??FAIXA_POR_DIV[ct.div].lo)+(ct.hi??FAIXA_POR_DIV[ct.div].hi)+2)
  if(target&&s.careerCoins[own.id]>reserveCash(s,own)+pisoTecnico(target.div,true)*2)s=act(s,{type:'ALICIAR_MARCAR',tec:target.nome})
  const market=P.buildPyramid(s.managers,own.id,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true),xi=P.lineupAt({},own.id,0,own.squad,own.formation)
  const targets=market[dv].filter(t=>!t.human).flatMap(t=>t.squad.filter(c=>!c.fake&&!c.cria&&(c.fame??1)<=3&&contratoCpuFalta(c.id,s.seed,s.seasonNo)<=0).map(c=>({t,c,gain:rate(c)-Math.min(...xi.filter(x=>x.pos===c.pos).map(rate))}))).filter(x=>x.gain>2).sort((a,b)=>b.gain-a.gain)
  if(targets[0]){const {t,c}=targets[0];s=act(s,{type:'ALICIAR_MARCAR',cardId:c.id,...(t.teamId<0?{card:c,clube:t.name,squad:t.squad}:{})})}
 }
 if(policy==='pass')s=act(s,{type:'CONFIRM_MESMO_TIME'})
 else{s=act(s,{type:'RESERVE_AUCTION_ONLINE'});s=auction(s,policy).s}
 s=prepare(s)
 return {s,ledger,renewed,cups}
}

const mode=process.env.AUDIT_MODE??'probe'
if(mode==='probe'){
 const a=prepare(structuredClone(snap.state)),x=season(a,false,true)
 console.log('ACCOUNT',JSON.stringify(x.summary));console.log('FORMAT',JSON.stringify(x.res.oficial.D).slice(0,700));
 const adv=advance(x);console.log('NEXT',JSON.stringify({season:adv.s.seasonNo,round:adv.s.round,screen:adv.s.screen,div:divOf(adv.s),coins:adv.s.careerCoins[0],ledger:adv.ledger,renewed:adv.renewed}));
 const fresh=start('Brasiliense',20261123,'balanced');const y=season(fresh,true,true);console.log('FRESH',JSON.stringify(y.summary));
 if(process.env.AUDIT_DEBUG_MARKET){const a=advance(y,'balanced');console.log('MARKET_END',JSON.stringify({squad:mine(a.s).squad.length,coins:a.s.careerCoins[0],stock:a.s.stock}))}
 writeFileSync(OUT+'/probe.json',JSON.stringify({account:x.summary,next:{season:adv.s.seasonNo,div:divOf(adv.s),coins:adv.s.careerCoins[0],ledger:adv.ledger},fresh:y.summary},null,2))
}
console.log('audit reducer steps',steps)
if(mode==='evidence'){
 const scan=(prefix:string,n:number)=>{
  const violations:any[]=[]
  for(let year=2;year<=n;year++){
   const before=JSON.parse(gunzipSync(readFileSync(OUT+`/checkpoints/${prefix}-${year-1}.json.gz`)).toString()),after=JSON.parse(gunzipSync(readFileSync(OUT+`/checkpoints/${prefix}-${year}.json.gz`)).toString())
   for(const m of after.managers.filter(m=>!m.isHuman)){
    const old=before.managers.find(x=>x.id===m.id);if(!old)continue;const owned=new Set(old.squad.map(ident)),div=after.careerPlacements['m'+m.id]
    for(const c of m.squad)if(!owned.has(ident(c))&&c.id.startsWith('banco-')&&!c.emprestado&&(!categoriaOficialOk(div,c)||!cartaDeClubeBrasileiro(c)))violations.push({season:year,club:m.teamName,div,player:c.name,cardClub:c.club,fame:c.fame,promessa:!!c.promessa,paid:c.paid,foreign:!cartaDeClubeBrasileiro(c),wrongCategory:!categoriaOficialOk(div,c)})
   }
  }
  return violations
 }
 const baseline=scan('Brasiliense-20261123',25),candidate=scan('candidato-filtro-Brasiliense-20261123',27)
 const s=JSON.parse(gunzipSync(readFileSync(OUT+'/checkpoints/Brasiliense-20261123-9.json.gz')).toString()),photos:any[]=[]
 for(const row of Object.values(s.m2Res) as any[]){const e=row[5];if(!e)continue;for(const side of ['casa','fora'])for(const c of e[side]??[])if(['Carles Puyol','Rummenigge'].includes(c.name)&&['Barcelona','Bayern'].includes(c.club))photos.push({season:row[3],match:e.partidaId,side,player:c.name,club:c.club})}
 const report={baselineCount:baseline.length,baseline,candidateCount:candidate.length,candidate,photographedPlayableAthletes:photos,titleCardsExcluded:true}
 writeFileSync(OUT+'/roster-rule-evidence.json',JSON.stringify(report,null,2));console.log('ROSTER_RULE_EVIDENCE',JSON.stringify({baseline:baseline.length,candidate:candidate.length,photos:photos.length}))
}
if(mode==='buttons'){
 const base=start('Portuguesa',20261123),m=mine(base),a=act(base,{type:'SET_TACTIC',mgrId:m.id,tactic:'retranca'}),b=act(base,{type:'SET_TACTIC',mgrId:m.id,tactic:'ataque'})
 const wa=inputs(a).world,wb=inputs(b).world
 carregaGuardados(undefined,1,'buttons-a');const ca=P.computeEstadualCarreira('Paulista',wa,a.seed,1,1.12,true,{},true,VERSAO_CRITERIOS_RECEPCAO_M2)
 carregaGuardados(undefined,1,'buttons-b');const cb=P.computeEstadualCarreira('Paulista',wb,b.seed,1,1.12,true,{},true,VERSAO_CRITERIOS_RECEPCAO_M2)
 const report={savedTactics:[a.careerTactics[m.id],b.careerTactics[m.id]],stateActuallyChanged:JSON.stringify(a.careerTactics)!==JSON.stringify(b.careerTactics),sameWorld:JSON.stringify(wa)===JSON.stringify(wb),cupCalculated:!!ca&&!!cb,identicalCupDespiteOppositeTactics:JSON.stringify(ca)===JSON.stringify(cb),nativeEntryFields:'jogoCopaM2 receives random th/ta; no league coach/cardMods args',humanInCup:ca?.resultado.classificacao.includes(m.teamName)}
 writeFileSync(OUT+'/buttons.json',JSON.stringify(report,null,2));console.log('BUTTONS',JSON.stringify(report))
}
if(mode==='rules'){
 let s=start('Brasiliense',20261123),x=season(s),rows:any[]=[]
 for(const brandId of ['tidex','vadico','gecg','dsouza']){
  let b=act(x.s,{type:'SET_MASTER',mgrId:0,brandId})
  b=act(b,{type:'CLOSE_SEASON_BOOKS',rewards:{0:0},stadiumOcc:{0:stadiumOccupancy(x.summary.pos,b.stadiums?.[0])},finalPos:{0:x.summary.pos}})
  const twice=act(b,{type:'CLOSE_SEASON_BOOKS',rewards:{0:99999},finalPos:{0:1}})
  rows.push({brandId,actualPos:x.summary.pos,actualNext:x.summary.next,contract:b.careerMaster?.[0],coins:b.careerCoins[0],idempotent:twice.careerCoins[0]===b.careerCoins[0]})
 }
 const report={rules:[6,11,16,17,20,32,81].map(pos=>({pos,masterClaimsRelegationD:masterCaiu(pos,'D'),shopBand:faixaDaPos(pos),occupancy:stadiumOccupancy(pos,undefined)})),nativeClose:rows,rawBotBudgets:mine(s).teamName&&s.managers.slice(1,5).map(m=>({club:m.teamName,money:m.money,cash:s.clubCash['m'+m.id],players:m.squad.length})),newcomerSalaryFree:salaryOfCard({paid:0,club:'Brasiliense'} as any)}
 writeFileSync(OUT+'/rules.json',JSON.stringify(report,null,2));console.log('RULES_DONE',JSON.stringify(report))
}
if(mode==='matchups'){
 const s=start('Brasiliense',20261123),world=inputs(s).world,all=DIV.flatMap(d=>world[d]),byName=(name:string)=>all.find(t=>t.name===name)!
 const n=128,rows:any[]=[]
 for(const [a,b] of [['Portuguesa','Decisão'],['Brasiliense','Decisão'],['Portuguesa','Brasiliense'],['Flamengo','Decisão'],['Brasiliense','Brasiliense'],['Grêmio','Grêmio']]){
  const A=byName(a),B=byName(b);if(A.xi.length!==11||B.xi.length!==11)throw Error('Incomplete matchup')
  let w=0,d=0,l=0,gf=0,ga=0,zero=0,projected=0
  for(let k=0;k<n;k++){
   const home=k%2===0,e:any={seed:20261123+k*7919,casa:home?A.xi:B.xi,fora:home?B.xi:A.xi,tatica:[0,0],bots:home?[false,true]:[true,false],clima:'sol',versao:VERSAO_CRITERIOS_RECEPCAO_M2}
   projected+=expectativaBotsCarreira(e).reduce((a,b)=>a+b,0)
   const m=novoMotor2(e);for(let min=1;min<=120&&!m.fim;min++)m.avancaAte(min)
   if(!m.fim||m.diag.erros.length)throw Error('Engine diagnostics failed')
   const f=m.placar[home?0:1],c=m.placar[home?1:0];gf+=f;ga+=c;if(f>c)w++;else if(f<c)l++;else d++;if(!f&&!c)zero++
  }
  const row={a,b,n,levelA:avg(A.xi),levelB:avg(B.xi),w,d,l,gf,ga,zeros:zero,physicalGoals:(gf+ga)/n,projection:projected/n};rows.push(row);console.log('MATCHUP',JSON.stringify(row))
 }
 writeFileSync(OUT+'/matchups.json',JSON.stringify(rows,null,2))
}
if(mode==='ownership'){
 rand=P.mulberry(20261123)
 const raw=act(INITIAL,{type:'START_CAREER_SOLO',teamName:'Brasiliense',formation:'4-3-3',rivals:5,oficial:{clube:'Brasiliense'}})
 const beforeCpu=P.seedCpuSquadsOficial(raw),beforeWorld=P.buildPyramid(raw.managers,0,raw.seed,raw.deckLeague,raw.careerPlacements,beforeCpu,true)
 const end=prepare(auction(raw,'pass').s),afterWorld=inputs(end).world,saveWorld=inputs(prepare(structuredClone(snap.state))).world
 const bad=(w:any)=>DIV.flatMap(d=>w[d].filter(t=>t.xi.length!==11).map(t=>({div:d,name:t.name,xi:t.xi.length,players:t.squad.length,ids:t.xi.map(c=>c.id)})))
 const beforeDonors=Object.entries(beforeCpu).map(([club,cs]:any)=>({club,before:cs.length,after:end.cpuSquads?.[club]?.length,cards:cs.filter(c=>!end.cpuSquads?.[club]?.some(x=>key(x)===key(c))).map(c=>({name:c.name,pos:c.pos,owner:end.managers.find(m=>m.squad.some(x=>key(x)===key(c)))?.teamName}))})).filter(x=>x.before!==x.after)
 const report={before:bad(beforeWorld),after:bad(afterWorld),account:bad(saveWorld),donors:beforeDonors}
 writeFileSync(OUT+'/ownership.json',JSON.stringify(report,null,2));console.log('OWNERSHIP',JSON.stringify(report))
}
if(mode==='diagnostics'){
 const base=start('Brasiliense',20261123),i=inputs(base),x=season(base),raw=act(INITIAL,{type:'START_CAREER_SOLO',teamName:'Brasiliense',formation:'4-3-3',rivals:5,oficial:{clube:'Brasiliense'}})
 const squads=Object.fromEntries(['D','C','B','A'].map(d=>[d,i.world[d].map(t=>({name:t.name,players:t.squad.length,xi:t.xi.length,level:avg(t.xi),fake:t.squad.filter(c=>c.fake).length}))]))
 const finance={humanInitial:raw.careerCoins[0],botInitial:raw.managers.slice(1).map(m=>({name:m.teamName,money:m.money,cash:raw.clubCash['m'+m.id]})),firstSeasonSalary:base.managers[0].squad.reduce((n,c)=>n+salaryOfCard(c),0)}
 const fatigue={actualGames:x.summary.agendaGames,charged:x.summary.chargedFitnessRounds,endGas:x.summary.minGas,ifOnlyPlayedLeagueGames:100-x.summary.agendaGames*1.4}
 const integrity:any[]=[]
 for(let k=0;k<12;k++){
  const alt=structuredClone(base);alt.seed=20261123+k*7919;const sim=season(alt,false,true)
  const ds=sim.res.oficial.D,cs=sim.res.oficial.C,champions=P.seasonChampions(sim.res.tables)
  const assigned=(d:string)=>Object.entries(champions).find(([,v])=>v===d)?.[0]
  const trueKey=(name:string)=>{for(const d of DIV){const t=sim.res.tables[d].find(t=>t.name===name);if(t)return t.teamId<0?t.name:'m'+t.teamId}}
  integrity.push({seed:alt.seed,D:{champion:ds.campeao,honorsKey:assigned('D'),trueKey:trueKey(ds.campeao!)},C:{champion:cs.campeao,honorsKey:assigned('C'),trueKey:trueKey(cs.campeao!)},promoted:sim.summary.next,pos:sim.summary.pos,groupPos:ds.grupos.find(g=>g.tabela.some(t=>t.you))?.tabela.findIndex(t=>t.you),torcida:P.torcidaDeltas(sim.res.tables,sim.placements).m0})
 }
 const calibration:any[]=[]
 for(const d of ['D','C','B','A']){
  const teams=[...i.world[d]].sort((a,b)=>avg(a.xi)-avg(b.xi)),team=teams[Math.floor(teams.length/2)]
  let goals=0,expected=0,draws=0,zeros=0
  for(let k=0;k<32;k++){
   const e:any={seed:700000+k*7919,casa:team.xi,fora:team.xi,tatica:[0,0],bots:[false,true],clima:'sol',versao:VERSAO_CRITERIOS_RECEPCAO_M2}
   expected+=expectativaBotsCarreira(e).reduce((a,b)=>a+b,0)
   const m=novoMotor2(e);for(let min=1;min<=120&&!m.fim;min++)m.avancaAte(min)
   goals+=m.placar[0]+m.placar[1];if(m.placar[0]===m.placar[1])draws++;if(!m.placar[0]&&!m.placar[1])zeros++
  }
  calibration.push({div:d,name:team.name,level:avg(team.xi),n:32,physicalGoalsPerMatch:goals/32,projectedGoalsPerMatch:expected/32,draws,zeros})
 }
 const report={finance,fatigue,squads,integrity,calibration,staleDivision:{stored:snap.state.careerDivision,real:snap.state.careerPlacements.m0}}
 writeFileSync(OUT+'/diagnostics.json',JSON.stringify(report,null,2));console.log('DIAGNOSTICS_DONE',JSON.stringify({finance:{human:finance.humanInitial,firstBot:finance.botInitial[0]},fatigue,calibration}))
}
if(mode==='journeys'){
 const report:any={method:{motor:'motor2 publicado, recepção da conta Diego, critérios atuais',full:!!process.env.AUDIT_FULL,comissao:!!process.env.AUDIT_COMISSAO,uiPlayoff:!!process.env.AUDIT_UI_PLAYOFF,economy:process.env.AUDIT_FULL?'reducer nativo, patrocínio, estadual, Copa do Brasil, continentais e prêmios/balanço nativos dos bots; sem aportes, agência ou novas lojas':process.env.AUDIT_POLICIES==='human'?'reducer nativo, patrocínio, estadual e Copa do Brasil; sem agência, loja, aportes ou copas continentais':'reducer nativo; sem prêmios de copas/estaduais nem escolha de novos patrocinadores; não é previsão do saldo total real',reselect:!!process.env.AUDIT_RESELECT,fromAccount:!!process.env.AUDIT_FROM_ACCOUNT,policies:'pass=sem reforçar; balanced=35% do caixa do envelope em melhoria do XI, lance 90% valor; aggressive=135%; human=reservar compromissos, vender excedentes e montar banco; nenhum resultado futuro é usado nas decisões'},runs:[]}
 const seeds=(process.env.AUDIT_SEEDS??'20261123,7919001,871217').split(',').map(Number)
 const years=Number(process.env.AUDIT_YEARS??15),clubs=(process.env.AUDIT_CLUBS??'Brasiliense').split(',')
 for(const club of clubs)for(const policy of (process.env.AUDIT_POLICIES??'pass,balanced,aggressive').split(','))for(const seed of seeds){
  let s=process.env.AUDIT_FROM_ACCOUNT?prepare(structuredClone(snap.state)):start(club,seed,policy),rows:any[]=[],firstA:number|null=null,transfers:any[]=[]
  if(process.env.AUDIT_RESUME&&club==='Brasiliense'){
   s=JSON.parse(gunzipSync(readFileSync(process.env.AUDIT_RESUME)).toString());s=act(s,{type:'GUARDA_M2',novos:{}})
   rows=readFileSync(process.env.AUDIT_PREFIX_LOG!,'utf8').split('\n').filter(l=>l.startsWith('{')).map(l=>JSON.parse(l)).filter(r=>r.club===club&&r.seed===seed&&r.season<s.seasonNo)
   firstA=rows.find(r=>r.next==='A')?.season??null
  }
  const runIndex=report.runs.length,limit=club==='Portuguesa'&&process.env.AUDIT_PORT_YEARS?Number(process.env.AUDIT_PORT_YEARS):years
  for(let year=rows.length+1;year<=limit;year++){
   if(process.env.AUDIT_FULL){mkdirSync(OUT+'/checkpoints',{recursive:true});writeFileSync(OUT+`/checkpoints/${process.env.AUDIT_VARIANT?process.env.AUDIT_VARIANT+'-':''}${club}-${seed}-${s.seasonNo}.json.gz`,gzipSync(JSON.stringify(s)))}
   const x=season(s,policy!=='pass',true);const a=advance(x,policy);s=a.s
   const row={...x.summary,afterCoins:s.careerCoins[0],renewalCost:a.renewed.reduce((n,r)=>n+r.price,0),renewals:a.renewed.length,cups:a.cups,torcidaDelta:P.torcidaDeltas(x.res.tables,x.placements)['m0'],groupPos:x.res.oficial.D.grupos.find(g=>g.tabela.some(t=>t.you))?.tabela.findIndex(t=>t.you)}
   if(process.env.AUDIT_FULL){
    const actual=m=>x.s.careerPlacements['m'+m.id]??'D',bots=x.s.managers.filter(m=>!m.isHuman)
    ;(row as any).bots=bots.map(m=>({club:m.teamName,div:actual(m),cashBefore:x.s.clubCash['m'+m.id],cashAfter:s.clubCash['m'+m.id],strength:avg(P.lineupAt({},m.id,0,m.squad,m.formation)),payroll:folhaBaseDoClube(x.s,m),balance:s.econBotsRel?.['m'+m.id]}))
    ;(row as any).humanStaff={coach:x.s.careerTecnicos?.[mine(x.s).teamName],prep:x.s.careerPreparador?.[mine(x.s).teamName],totalPayroll:folhaBaseDoClube(x.s,mine(x.s))}
   }
   rows.push(row);if(x.summary.next==='A'&&firstA==null)firstA=x.summary.season
   for(const l of (a.s.careerLedger??[]).filter(l=>l.kind==='buy'||l.kind==='sell'))if(!transfers.some(t=>t.id===l.id))transfers.push(l)
   console.log(JSON.stringify({club,policy,seed,...row}))
   report.runs[runIndex]={club,policy,seed,firstA,rows,transfers,finalStaff:{coach:s.careerTecnicos?.[mine(s).teamName],prep:s.careerPreparador?.[mine(s).teamName]},finalSquad:mine(s).squad.map(c=>({name:c.name,pos:c.pos,lo:c.lo,hi:c.hi,paid:c.paid,salary:salaryOfCard(c),cria:!!c.cria,fake:!!c.fake}))};writeFileSync(OUT+'/'+(process.env.AUDIT_REPORT??'journeys.json'),JSON.stringify(report,null,2))
  }
 }
 console.log('JOURNEYS_DONE',report.runs.length)
}
if(mode==='portuguesa-diagnostico'){
 const out:any[]=[]
 for(const club of ['Portuguesa','ABC','Brasiliense'])for(let k=0;k<(club==='Portuguesa'?20:10);k++){
  const seed=20261123+k*7919,s=start(club,seed,'pass'),x=season(s,false,true),me=mine(s)
  const forca=(t:any)=>avg(P.lineupAt({},t.teamId,0,t.squad,t.formation))
  const faixas=Object.fromEntries(['D','C','B','A'].map(d=>{const v=x.i.world[d].map(forca).sort((a,b)=>a-b);return[d,{min:v[0],mediana:v[Math.floor(v.length/2)],max:v.at(-1)}]}))
  const row={club,seed,...x.summary,rankForcaD:[...x.i.world.D].sort((a,b)=>forca(b)-forca(a)).findIndex(t=>t.you)+1,faixas,iniciais:me.squad.map(c=>({name:c.name,pos:c.pos,lo:c.lo,hi:c.hi,fame:c.fame,promessa:!!c.promessa})),mercadoSemLances:true}
  out.push(row);console.log('DIAGNOSTICO',JSON.stringify({club,seed,pos:row.pos,next:row.next,strength:row.strength,rankForcaD:row.rankForcaD}))
  writeFileSync(OUT+'/portuguesa-diagnostico.json',JSON.stringify(out,null,2))
 }
 console.log('DIAGNOSTICO_CONCLUIDO',out.length)
}
