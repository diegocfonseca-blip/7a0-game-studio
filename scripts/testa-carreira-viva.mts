import assert from 'node:assert/strict'
import {careerFirstStep,careerRivalStory,careerMoments} from '../src/escalacao/career-living-model'
import {rememberGame,type MemoryGame} from '../src/escalacao/career-memory'
import {personalitySceneText} from '../src/escalacao/career-scene-personality'
import {careerStructureImpact} from '../src/escalacao/career-structure-impact'
import {STADIUM_SECTORS,STADIUM_EXTRAS,stadiumSeats,stadiumIncomeAt,type StadiumSave} from '../src/escalacao/estadiodata'
import {fatosDoBairro} from '../src/escalacao/cenas-bairro-fatos'
import type {EscState,Manager} from '../src/escalacao/types'
let checks=0;const ok=(value:unknown,name:string)=>{assert.ok(value,name);checks++}
const squad=[{id:'real-id',name:'Romário',club:'Vasco',year:2000,pos:'ATA',fame:5,paid:35}],manager={id:0,teamName:'Clube',squad,isHuman:true} as Manager
const base={careerOnline:true,onlineMode:'cpu',sport:'futebol',seasonNo:1,round:0,managers:[manager],youIdx:0} as EscState
for(const oficial of [undefined,{clube:'Flamengo'}])for(const round of [0,1,2,3]){
 const state={...base,oficial,round} as EscState,key=careerFirstStep(state)?.key
 ok(key,`dica contextual ${oficial?'oficial':'tradicional'} ${round}`)
 ok(!careerFirstStep({...state,careerSeen:{[key!]:true}}),'entendi é persistido por etapa')
 ok(!careerFirstStep({...state,careerSeen:{'inicio-dispensado-v1':true}}),'pular não obriga novos passos')
}
for(const state of [{...base,seasonNo:2},{...base,round:4},{...base,onlineMode:'online'},{...base,co2:{}},{...base,sport:'basquete'}])ok(!careerFirstStep(state as EscState),'guarda de modo/temporada')
const game:MemoryGame={id:'s1:r1',season:1,competition:'Liga',opponent:'Rival',home:true,gf:4,ga:1,players:[{id:'Romário|Vasco',name:'Romário',goals:3,assists:0}]}
const original=JSON.stringify(base),memory=rememberGame(undefined,game)!
ok(memory.recent[0].highlights?.[0].goals===3,'protagonismo vem de gols realmente registrados')
ok(rememberGame(memory,game)===memory,'reabertura não duplica partida nem protagonista')
ok(JSON.stringify(base)===original,'adaptadores não alteram elenco ou estado')
const second=rememberGame(memory,{...game,id:'s1:r2',gf:0,ga:1,players:[]})!
const derby=careerRivalStory(second,'Rival','Clube')!
assert.deepEqual([derby.games,derby.wins,derby.draws,derby.losses],[2,1,0,1]);checks++
ok(derby.last.ga===1&&derby.biggest?.gf===4,'história consulta placares revelados')
ok(!careerRivalStory(undefined,'Rival','Clube'),'save antigo não recebe passado inventado')
ok(!careerRivalStory(memory,'Outro','Clube'),'não confunde adversários')
const data={...base,round:1,careerMemory:{0:memory},careerCronica:{m0:[{t:1,div:'D',campeao:1}]}} as EscState
ok(!careerMoments(data,0).some(m=>m.id.startsWith('titulo')),'não compartilha título de temporada ainda não encerrada')
ok(careerMoments(data,0,true).some(m=>m.id.startsWith('titulo')),'título confirmado fica disponível')
ok(careerMoments(data,0).some(m=>m.id===`jogo:${game.id}`),'resultado compartilhado usa registro do jogo')
for(const state of [{...data,co2:{}},{...data,sport:'basquete'},{...data,onlineMode:'online'}])ok(!careerMoments(state as EscState,0).length,'momentos isolados dos outros modos')
const facts=fatosDoBairro(data,manager,true)
ok(facts.some(f=>f.id.startsWith('protagonista:')&&f.ator?.id==='real-id'),'identidade estável da memória encontra avatar real do elenco')
ok(!fatosDoBairro(data,manager,false).some(f=>f.id.startsWith('protagonista:')),'sem revelação não apresenta protagonista')
ok(Array.isArray(fatosDoBairro({...data,careerColetiva:{0:{arquirrival:'Rival'}}} as EscState,manager,true)),'coletiva parcial antiga não quebra cenas')
ok(!careerMoments({...base,careerMemory:{0:{}}} as EscState,0).length,'memória incompleta não quebra momentos')
const event={nome:'Romário',club:'Vasco',year:2000,variante:'futevolei',status:'banco',subNome:'Nunes'}
const variants=new Set(Array.from({length:16},(_,r)=>personalitySceneText(event,1,r)[0]))
ok(variants.size>2,'personalidade varia sem mudar evento')
assert.deepEqual(personalitySceneText(event,1,7),personalitySceneText(event,1,7));checks++
ok(personalitySceneText(event,1,7)[0].includes('Nunes'),'mantém a decisão realmente tomada')
const stadium:StadiumSave={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:['loja']}
for(const s of STADIUM_SECTORS){
 const st={...stadium,inv:{...stadium.inv,[s.k]:Math.max(0,s.cost-7)}}
 const before=JSON.stringify(st),preview=careerStructureImpact(st,s.k,'sector',60,true)!
 ok(preview.cost===7&&preview.nextProgress===100,`último investimento respeita custo de ${s.k}`)
 ok(preview.nextSeats===stadiumSeats(preview.next).now&&preview.nextIncome===stadiumIncomeAt(preview.next,.6,true),'usa os mesmos cálculos do motor')
 ok(JSON.stringify(st)===before,'prévia não compra obra nem altera save')
}
const parking=careerStructureImpact(stadium,'estac','extra',100,true)!
ok(parking.cost===20&&parking.parking?.before===0&&parking.parking.after===9,'estacionamento prevê lote real de 9 vagas')
const store=careerStructureImpact({inv:{},ext:[]},'loja','extra',100,true)!
ok(store.variable&&store.nextIncome===store.income,'loja não promete renda fixa retirada do jogo')
ok(!careerStructureImpact(stadium,'inexistente','extra'),'não inventa estrutura sem catálogo')
for(const extra of STADIUM_EXTRAS.filter(e=>e.k!=='estac'&&e.k!=='loja')){
 const preview=careerStructureImpact(stadium,extra.k,'extra',100,true)!
 ok(preview.cost===extra.cost&&preview.next.ext.includes(extra.k),`custo e estado ${extra.k}`)
}
console.log(`PASS ${checks} verificações: estreia, fatos, personalidade, rivalidades, compartilhamento e estruturas; sem alterar simulação/economia.`)
