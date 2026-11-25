import assert from 'node:assert/strict'
import {carreiraTradicionalBancada} from './teste-paridade-carreira/tradicional'
import {INITIAL,reducer,sanitize,ident} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste} from '../src/escalacao/sport'
import {fatosDoBairro} from '../src/escalacao/cenas-bairro-fatos'
import {coachFormationOptions} from '../src/escalacao/career-live-plan'
_forcaBrasilOficialParaTeste(true);await carregaBaralhoOficial()
const report=[]
for(const mode of ['tradicional','oficial'] as const){
 let s=mode==='tradicional'?carreiraTradicionalBancada():reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Flamengo',formation:'4-3-3',rivals:3,oficial:{clube:'Flamengo'}})
 assert.equal(!!s.oficial,mode==='oficial');assert.equal(s.onlineMode,'cpu');assert(s.careerOnline)
 const m=s.managers[s.youIdx],c=m.squad.find(c=>!c.fake)!;assert(c)
 assert(m.squad.length>=11);assert(m.squad.every(c=>!c.fake),'início nativo sem placeholder')
 s={...s,seasonNo:6,round:10,eventoTemporada:undefined};const cash=JSON.stringify(s.careerCoins),cards=JSON.stringify(m.squad.map(c=>[ident(c),c.lo,c.hi,c.fame]))
 const scene={type:'MARK_NEIGHBORHOOD_SCENE' as const,mgrId:m.id,key:`${s.seed}:${m.id}:evento-teste`,group:`${s.seed}:${m.id}:jogo:6:10`,kind:'loja' as const}
 const seen=reducer(s,scene);assert.equal(seen.managers,s.managers);assert.equal(reducer(seen,scene),seen);s=seen
 s=reducer(s,{type:'RECORD_CAREER_GAME',mgrId:m.id,game:{id:`paridade:${mode}:6:10`,season:6,competition:'Liga',opponent:'Adversário de teste',home:true,gf:2,ga:1,players:[{id:c.id,name:c.name,goals:1,assists:0}]}})
 assert.equal(s.careerMemory?.[m.id]?.players[ident(c)]?.games,1)
 const before=s;s=reducer(s,{type:'RECORD_CAREER_GAME',mgrId:m.id,game:{id:`paridade:${mode}:6:10`,season:6,competition:'Liga',opponent:'Adversário de teste',home:true,gf:2,ga:1,players:[{id:c.id,name:c.name,goals:1,assists:0}]}});assert.equal(s,before)
 s=reducer(s,{type:'PLAN_MATCH_INJURY',injury:{season:6,round:10,mgrId:m.id,cardId:c.id,minute:60,rodadas:2,status:'programada'}});assert(s.careerMatchInjury)
 const medical={...s,eventoTemporada:{season:6,round:9,mgrId:m.id,tipo:'lesao' as const,status:'banco' as const,cardId:c.id,nome:c.name,pos:c.pos,rodadas:2,historia:'Teste',volta:12}}
 assert(fatosDoBairro(medical,m).some(x=>x.acao==='recuperacao'));assert(fatosDoBairro({...medical,round:12},m).some(x=>x.acao==='retorno'))
 assert(coachFormationOptions(s,m).some(x=>x.motor===m.formation&&x.available))
 const restored=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved:JSON.parse(JSON.stringify(sanitize(s)))})
 assert.equal(!!restored.oficial,mode==='oficial');assert.deepEqual(restored.careerNeighborhood,s.careerNeighborhood);assert.deepEqual(restored.careerMemory,s.careerMemory);assert.deepEqual(restored.careerMatchInjury,s.careerMatchInjury)
 assert.equal(JSON.stringify(restored.careerCoins),cash);assert.equal(JSON.stringify(restored.managers[restored.youIdx].squad.map(c=>[ident(c),c.lo,c.hi,c.fame])),cards)
 assert.equal(sanitize({...s,onlineMode:'online'}).careerMatchInjury,undefined)
 report.push({mode,nativeRoster:m.squad.length,sceneIdempotent:true,memoryIdempotent:true,medicalSources:true,coachOptions:true,saveRoundTrip:true,moneyUnchanged:true,cardRatingsUnchanged:true,onlineIsolated:true})
}
console.log(JSON.stringify({ok:true,cases:report},null,2))
