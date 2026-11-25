import assert from 'node:assert/strict'
import {cupMatchMinute,validateLivePlan,cupLiveEntry,liveInitialIds,type CareerLiveDecision} from '../src/escalacao/career-live-plan'
import {rememberGame,type ClubMemory} from '../src/escalacao/career-memory'
import {redacaoDaCentral} from '../src/escalacao/central-noticias'
import {FutebolOficial3D} from '../src/escalacao/presidencia-futebol-oficial'
import {prepareMapTimeline} from '../src/escalacao/futebol3d/motion/map-football-timeline.mjs'
import {dealDescription} from '../src/escalacao/career-transfer-history'
import {CATALOG} from '../src/escalacao/data'
import {entradaM2,novoMotor2,assinaturaSimulacaoM2} from '../src/escalacao/motor2/carreira'
import {INITIAL,reducer} from '../src/escalacao/store'
import type {Manager,WonCard,FormationKey} from '../src/escalacao/types'
const pick=(pos:string,n:number,o=0)=>(CATALOG as any)[pos].slice(o,o+n).map((c:any,i:number)=>({...c,id:`${pos}-${o+i}`,pos,paid:4}))
const xi=[...pick('GOL',1),...pick('LAT',2),...pick('ZAG',2),...pick('MEI',3),...pick('ATA',3)] as WonCard[]
const bench=[...pick('ZAG',1,70),...pick('MEI',2,70),...pick('ATA',1,70),...pick('GOL',1,70)] as WonCard[]
const squad=[...xi,...bench],m={...INITIAL.managers[0],id:0,isHuman:true,teamName:'Clube Teste',formation:'4-3-3',squad} as Manager
const params={squad,initial:xi.map(c=>c.id),formation:'4-3-3' as FormationKey,allowed:['4-3-3','3-4-3z','4-4-2'] as FormationKey[]}
// 4-3-3 -> 3-4-3: remove two fullbacks, add centre-back and midfielder atomically.
const changes:CareerLiveDecision[]=[{t:31,sai:xi[1].id,entra:bench[0].id,formation:'3-4-3z'},{t:31,sai:xi[2].id,entra:bench[1].id,formation:'3-4-3z'}]
assert.equal(cupMatchMinute(45,0),46.5);assert.equal(cupMatchMinute(135,1),46.5)
const plan=validateLivePlan({...params,commands:changes});assert(plan);assert.equal(plan.used,2);assert.equal(plan.formation,'3-4-3z')
assert.equal(validateLivePlan({...params,commands:changes.slice(0,1)}),null,'incomplete formation is rejected')
assert.equal(validateLivePlan({...params,commands:changes,allowed:['4-3-3']}),null,'coach repertoire enforced')
const third={t:60,sai:xi[0].id,entra:bench[4].id,formation:'3-4-3z' as FormationKey}
assert.equal(validateLivePlan({...params,commands:[...changes,third]})?.used,3)
assert.equal(validateLivePlan({...params,commands:[...changes,third,{t:65,sai:xi[8].id,entra:bench[3].id,formation:'3-4-3z'}]}),null,'fourth sub rejected')
assert.equal(validateLivePlan({...params,existing:changes,commands:[{...changes[0],t:2},changes[1]]}),null,'past cannot be rewritten')
assert.equal(validateLivePlan({...params,commands:[...changes,{t:65,sai:bench[0].id,entra:xi[1].id,formation:'4-3-3'}]}),null,'departed player cannot return')
assert.equal(validateLivePlan({...params,commands:changes,blocked:new Set([bench[0].id])}),null,'unavailable incoming player rejected')
const one={t:20,sai:xi[5].id,entra:bench[1].id},half=xi.map(c=>c.id);half[5]=bench[1].id;half[6]=bench[2].id;half[8]=bench[3].id
assert.equal(validateLivePlan({...params,commands:[one],halftime:{t:45,ids:half,formation:'4-3-3'},throughTime:46})?.used,3,'live + halftime use one budget')
const four=[...half];four[0]=bench[4].id
assert.equal(validateLivePlan({...params,commands:[one],halftime:{t:45,ids:four,formation:'4-3-3'},throughTime:46}),null)
const away=[...pick('GOL',1,10),...pick('LAT',2,10),...pick('ZAG',2,10),...pick('MEI',3,10),...pick('ATA',3,10)]
const initial=entradaM2({seed:1111,casa:xi,fora:away,fCasa:'4-3-3',fFora:'4-3-3',tatica:[0,0],bots:[false,true],partidaId:'copa:101:6:SREI:1:Clube Teste:Rival',somenteConsulta:true})
const awayInput={...initial,casa:away,fora:xi,bots:[true,false] as [boolean,boolean],partidaId:'copa:101:6:RETURN:1:Rival:Clube Teste'}
assert.equal(liveInitialIds(awayInput,m).own,1)
const awayCup=cupLiveEntry(awayInput,{season:6,managerId:0,initial:awayInput,commands:changes,revision:1},squad)
assert(awayCup.aoVivo?.every(x=>x.lado===1),'return leg commands target the away club')
const record={season:6,managerId:0,initial,commands:changes,revision:1}
const cup=cupLiveEntry(initial,record,squad);assert.equal(cup.aoVivo?.length,2);assert.deepEqual(liveInitialIds(initial,m).ids,params.initial)
assert.notEqual(assinaturaSimulacaoM2(initial),assinaturaSimulacaoM2(cup),'new formation has a different match signature')
const photo=(x:any)=>JSON.stringify([x.placar,[x.bola.x,x.bola.y,x.bola.vx,x.bola.vy],x.atl.map((a:any)=>[a.nome,a.x,a.y,a.bx,a.dep,a.grupo,a.expulso])])
const ref=novoMotor2(initial),changed=novoMotor2(cup);ref.avancaAte(30);changed.avancaAte(30);assert.equal(photo(ref),photo(changed),'same physics and actors before decision')
changed.avancaAte(33);const home=changed.atl.filter(a=>a.lado===0&&!a.expulso);assert.equal(home.length,11);assert(home.some(a=>a.nome===bench[0].name));assert(!home.some(a=>a.nome===xi[1].name))
const again=novoMotor2(cup);again.avancaAte(33);assert.equal(photo(changed),photo(again),'replay equals live timeline after formation change')
const stage:any={officialInput:cup,context:{id:'formation-cup-test',home:xi,away},minute:0,homeScore:0,awayScore:0,paused:true,finished:false}
const timeline=await prepareMapTimeline(stage),official=new FutebolOficial3D(cup)
let checked3D=0
for(let i=0;i<timeline.duration*6;i++){
 const time=i/6,frame=official.sample(stage,time*93/90,{replay:false,postMatchWalk:false})
 for(const player of frame.players){const sample=timeline.sample(time,player.key).player;assert(sample);assert(Math.hypot(sample.x-player.sourceAnchor!.x,sample.z-player.sourceAnchor!.z)<.02)}
 checked3D++
}
// Reducer protects cup authority, append-only commands and the substitution budget.
let state={...structuredClone(INITIAL),careerOnline:true,onlineMode:'solo' as any,sport:'futebol' as any,seed:101,seasonNo:6,round:10,managers:[m],youIdx:0,careerTecnicos:{},booksSeason:0}
state=reducer(state,{type:'REGISTER_CUP_LIVE',mgrId:0,initial}) as any;assert(state.careerCupLive?.[initial.partidaId!]);
const samePos={t:20,sai:xi[5].id,entra:bench[1].id}
state=reducer(state,{type:'SET_CUP_LIVE',mgrId:0,partidaId:initial.partidaId!,aoVivo:[samePos]}) as any;assert.equal(state.careerCupLive?.[initial.partidaId!].commands.length,1)
state=reducer(state,{type:'SET_CUP_LIVE',mgrId:0,partidaId:initial.partidaId!,aoVivo:[]}) as any;assert.equal(state.careerCupLive?.[initial.partidaId!].commands.length,1)
state=reducer(state,{type:'FINISH_CUP_LIVE',partidaId:initial.partidaId!}) as any
state=reducer(state,{type:'SET_CUP_LIVE',mgrId:0,partidaId:initial.partidaId!,aoVivo:[samePos,{t:30,tactic:'ataque'}]}) as any;assert.equal(state.careerCupLive?.[initial.partidaId!].commands.length,1)
assert.deepEqual(state.managers[0].squad.map(c=>[c.lo,c.hi]),squad.map(c=>[c.lo,c.hi]),'ratings unchanged')
const priorManagers=state.managers
state=reducer(state,{type:'RECORD_CAREER_GAME',mgrId:0,game:{id:'league-local:1',season:6,competition:'Série B',opponent:'Rival',home:true,gf:1,ga:0,players:[{id:xi[0].id,name:xi[0].name,goals:0,assists:0}]}}) as any
assert.equal(state.managers,priorManagers,'history writes preserve simulation input references')
let memory:ClubMemory|undefined;const start=performance.now()
for(let season=1;season<=30;season++)for(let game=1;game<=60;game++){
 const g={id:`league:${season}:${game}`,season,competition:'Série A',opponent:'Rival',home:true,gf:game%4,ga:game%3,players:[{id:'historical-player',name:'Jogador',goals:game%4,assists:0}]}
 memory=rememberGame(memory,g);assert(memory);assert.equal(rememberGame(memory,g),memory,'reload cannot credit twice')
}
assert.equal(memory!.recent.length,120);assert.equal(memory!.seen.length,60);assert.equal(Object.keys(memory!.seasons).length,30);assert.equal(memory!.players['historical-player'].games,1800)
assert(JSON.stringify(memory).length<70000,'bounded extra save size after 30 seasons')
const d={name:'Van Basten',pos:'ATA',team:'Portuguesa',teamId:3,paid:45,via:'leilao' as const,season:4,round:0}
assert(!dealDescription(d).includes('sem clube'),'unknown seller never invented');assert(dealDescription({...d,from:'Milan'}).includes('Milan'))
const news=redacaoDaCentral({round:3,divName:'Série C',divNameEn:'Série C',tabela:[{name:'Portuguesa',pts:3,w:1,d:0,l:0,gf:2,ga:0,you:false,human:false}],formas:{},artilheiros:[],garcons:[],compras:[],maisCaro:{name:d.name,paid:d.paid,teamName:d.team,you:false,deal:d},maiorLance:null,intl:null,outraDiv:null})
assert.equal(news.noticias.filter(n=>n.deal).length,1);assert(news.noticias.some(n=>n.pt.includes('temporada 4')))
console.log(JSON.stringify({ok:true,checked3D,cases:'atomic formations, causality, max3, halftime, cup reducer, replay, transfer evidence',longCareer:{seasons:30,games:1800,extraBytes:JSON.stringify(memory).length,milliseconds:Math.round(performance.now()-start)}}))
