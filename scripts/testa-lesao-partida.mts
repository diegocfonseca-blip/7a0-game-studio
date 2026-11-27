import {FutebolOficial3D} from '../src/escalacao/presidencia-futebol-oficial'
import {prepareMapTimeline} from '../src/escalacao/futebol3d/motion/map-football-timeline.mjs'
import assert from 'node:assert/strict'
import {CATALOG} from '../src/escalacao/data'
import {novoMotor2,entradaM2,assinaturaSimulacaoM2} from '../src/escalacao/motor2/carreira'
import {validateLivePlan} from '../src/escalacao/career-live-plan'
import {INITIAL,reducer,ZERA_NA_CARREIRA_NOVA} from '../src/escalacao/store'
import {faseDaLesao} from '../src/escalacao/lesao-partida'
import type {WonCard} from '../src/escalacao/types'
const pick=(pos:string,n:number,o=0)=>(CATALOG as any)[pos].slice(o,o+n).map((c:any,i:number)=>({...c,id:`${pos}-${o+i}`,paid:4,pos}) as WonCard)
const team=(o=0)=>[...pick('GOL',1,o),...pick('LAT',2,o),...pick('ZAG',2,o),...pick('MEI',3,o),...pick('ATA',3,o)]
const casa=team(),fora=team(30),reserve=pick('ATA',1,60)[0],keeperReserve=pick('GOL',1,60)[0],squad=[...casa,reserve,keeperReserve],ids=casa.map(c=>c.id)
const base={partidaId:'liga:44:C:10:0:1',versao:'carreira-criterios-v1',seed:44,casa,fora,fCasa:'4-3-3',fFora:'4-3-3',tatica:[0,0]as[number,number],bots:[false,true]as[boolean,boolean]}
const photo=(m:ReturnType<typeof novoMotor2>)=>JSON.stringify([m.placar,m.atl.map(a=>[a.nome,a.x,a.y]),m.bola.x,m.bola.y])
for(const replacement of [true,false])for(const goalkeeper of [true,false]){
 const c=casa[goalkeeper?0:8],entra=replacement?(goalkeeper?keeperReserve:reserve):undefined,emergency=goalkeeper&&!replacement?casa[3].name:undefined
 const ref=novoMotor2(entradaM2(base));ref.avancaAte(60)
 const live=novoMotor2(entradaM2(base));live.avancaAte(60);const t=live.t
 const cmd={t,lado:0 as const,sai:c.name,entra,lesao:true,goleiroEmergencia:emergency}
 const replay=novoMotor2(entradaM2({...base,aoVivo:[cmd]}));replay.avancaAte(60);assert.equal(photo(replay),photo(ref),'causalidade antes da lesão')
 live.agendaTroca(cmd);live.avancaAte(61);replay.avancaAte(61);assert.equal(photo(live),photo(replay),'ao vivo e reconstrução com a mesma retirada')
 assert(!live.atl.some(a=>a.nome===c.name),'lesionado realmente saiu');assert.equal(live.subs.length,replacement?1:0,'retirada sem reserva não consome uma troca')
 if(!replacement)assert.equal(live.atl.filter(a=>a.lado===0).length,10)
 if(emergency)assert(live.atl.some(a=>a.nome===emergency&&a.grupo==='GOL'))
 for(let k=62;k<=94&&!live.fim;k++)live.avancaAte(k)
 assert(live.fim,'jogo chega ao fim sem travar')
 assert.notEqual(assinaturaSimulacaoM2(entradaM2(base)),assinaturaSimulacaoM2(entradaM2({...base,aoVivo:[cmd]})))
}
const emergencyReplacement=pick('ZAG',1,61)[0]
const emergencyGame=novoMotor2(entradaM2({...base,aoVivo:[{t:60,lado:0,sai:casa[0].name,lesao:true,goleiroEmergencia:casa[3].name},{t:65,lado:0,sai:casa[3].name,entra:emergencyReplacement,formacao:'4-3-3'}]}))
emergencyGame.avancaAte(70)
assert(emergencyGame.atl.some(a=>a.nome===emergencyReplacement.name&&a.grupo==='GOL'),'trocar o goleiro de emergência e reorganizar não deixa o gol vazio')
const clinicalEntry=entradaM2({...base,aoVivo:[{t:60,lado:0,sai:casa[8].name,lesao:true}]})
const stage:any={officialInput:clinicalEntry,context:{id:'medical-native-3d',home:casa,away:fora},minute:0,homeScore:0,awayScore:0,paused:true,finished:false}
const renderer=new FutebolOficial3D(clinicalEntry),timeline=await prepareMapTimeline(stage)
let nativeFrames=0,retiredKey=''
for(let time=59;time<=62;time+=1/12){
 const frame=renderer.sample(stage,time*93/90,{replay:false,postMatchWalk:false})
 const retired=frame.players.find(p=>p.name===casa[8].name);if(retired)retiredKey=retired.key
 for(const p of frame.players){assert(Number.isFinite(p.mx)&&Number.isFinite(p.mz));assert(timeline.sample(time,p.key).player?.visible)}
 if(time>60.1){assert(!retired);assert.equal(frame.players.length,21);assert.equal(timeline.sample(time,retiredKey).player?.visible,false)}
 nativeFrames++
}
console.log(`PASS apresentação nativa 3D: ${nativeFrames} quadros antes/depois da retirada, sem fantasma e sem coordenada inválida`)
const allowed=['4-3-3'] as const,injury={t:60,sai:casa[8].id,injury:true}
const short=validateLivePlan({squad,initial:ids,formation:'4-3-3',commands:[injury,{t:65,tactic:'ataque'}],allowed})
assert.equal(short?.ids.length,10);assert.equal(short?.used,0)
assert(!validateLivePlan({squad,initial:ids,formation:'4-3-3',commands:[{t:60,sai:casa[0].id,injury:true}],allowed}),'goleiro fora precisa de escolha explícita')
assert(validateLivePlan({squad,initial:ids,formation:'4-3-3',commands:[{t:60,sai:casa[0].id,injury:true,emergencyKeeper:casa[3].id}],allowed}))
const four=[...pick('MEI',1,61),...pick('LAT',1,61),...pick('ZAG',1,61)]
const commands=[{t:20,sai:casa[5].id,entra:four[0].id},{t:30,sai:casa[1].id,entra:four[1].id},{t:40,sai:casa[3].id,entra:four[2].id},{...injury,entra:reserve.id}]
assert(!validateLivePlan({squad:[...squad,...four],initial:ids,formation:'4-3-3',commands,allowed}),'lesão não permite quarta troca')
assert(validateLivePlan({squad:[...squad,...four],initial:ids,formation:'4-3-3',commands:[...commands.slice(0,3),injury],allowed}),'sem trocas resta jogar com dez')
let s:any={...structuredClone(INITIAL),seed:44,careerOnline:true,agenciaOn:true,seasonNo:3,round:10,managers:[{id:0,isHuman:true,teamName:'Clube',formation:'4-3-3',squad}],youIdx:0,onlineMode:'cpu'}
const plan={season:3,round:10,mgrId:0,cardId:casa[8].id,minute:60,rodadas:2,status:'programada' as const}
s=reducer(s,{type:'PLAN_MATCH_INJURY',injury:plan});assert.deepEqual(s.careerMatchInjury,plan)
s=reducer(s,{type:'PLAN_MATCH_INJURY',injury:{...plan,minute:70}});assert.equal(s.careerMatchInjury.minute,60,'reload não sorteia outro minuto')
s={...s,round:11};s=reducer(s,{type:'SET_AO_VIVO',mgrId:0,round:10,initial:entradaM2(base),aoVivo:[injury]});assert.equal(s.careerMatchInjury.status,'resolvida')
s=JSON.parse(JSON.stringify(s));const before=JSON.stringify(s.careerLineup);s=reducer(s,{type:'FINISH_MATCH_INJURY'});assert.equal(s.eventoTemporada.status,'pendente');assert.equal(s.eventoTemporada.round,11);assert.equal(s.eventoTemporada.momento,'partida');assert.equal(JSON.stringify(s.careerLineup),before,'não reescreve XI nem jogos passados')
assert(ZERA_NA_CARREIRA_NOVA.includes('careerMatchInjury'))
for(let seed=0;seed<1000;seed++){const f=faseDaLesao(seed,3,10);assert(f.minute>=55&&f.minute<=78);assert.deepEqual(f,faseDaLesao(seed,3,10))}
console.log('PASS lesão em partida: retirada real; reservas; goleiro de emergência; dez em campo; causalidade e replay; máximo três; persistência; preparação do próximo jogo')

// 27/11: banco durante o jogo é temporário; só a reposição clínica é levada ao próximo XI.
const initialState=()=>({...structuredClone(INITIAL),seed:44,careerOnline:true,agenciaOn:true,seasonNo:3,round:10,managers:[{id:0,isHuman:true,teamName:'Clube',formation:'4-3-3',squad}],youIdx:0,onlineMode:'cpu',careerLineup:{0:{0:[...ids],9:[...ids],10:[...ids]}}}) as any
let chosen=initialState();chosen=reducer(chosen,{type:'PLAN_MATCH_INJURY',injury:plan});chosen={...chosen,round:11}
const stableXI=JSON.stringify(chosen.careerLineup)
chosen=reducer(chosen,{type:'SET_AO_VIVO',mgrId:0,round:10,initial:entradaM2(base),aoVivo:[{...injury,entra:reserve.id}]})
assert.equal(JSON.stringify(chosen.careerLineup),stableXI,'troca em campo não altera escalação fixa durante o jogo')
chosen=reducer(chosen,{type:'FINISH_MATCH_INJURY'})
assert.equal(chosen.eventoTemporada.status,'banco','reserva já escolhido não exige segunda decisão')
assert.equal(chosen.eventoTemporada.subId,reserve.id)
assert.equal(chosen.eventoTemporada.volta,13,'mantém o prazo clínico original')
assert(chosen.careerLineup[0][11].includes(reserve.id));assert(!chosen.careerLineup[0][11].includes(plan.cardId))
assert.deepEqual(chosen.careerLineup[0][10],ids,'não reescreve o jogo que acabou')
assert.deepEqual(chosen.careerLineup[0][13],ids,'preserva a volta agendada quando recuperar')
assert.equal(reducer(chosen,{type:'FINISH_MATCH_INJURY'}),chosen,'fim repetido não agenda nem publica de novo')
const rejected=reducer(chosen,{type:'SET_LINEUP',mgrId:0,ids})
assert.deepEqual(rejected.careerLineup,chosen.careerLineup,'lesionado não pode voltar antes do prazo')
let ordinary=initialState();ordinary.round=11
ordinary=reducer(ordinary,{type:'SET_AO_VIVO',mgrId:0,round:10,initial:entradaM2(base),aoVivo:[{t:60,sai:plan.cardId,entra:reserve.id}]})
assert.deepEqual(ordinary.careerLineup,initialState().careerLineup,'troca comum continua restrita ao jogo')
const nextIds=ids.map(id=>id===plan.cardId?reserve.id:id)
ordinary=reducer(ordinary,{type:'SET_LINEUP',mgrId:0,ids:nextIds})
assert.deepEqual(ordinary.careerLineup[0][11],nextIds,'Elenco muda os titulares do próximo jogo')
assert.deepEqual(ordinary.careerLineup[0][10],ids,'Elenco não muda titulares de jogo já iniciado')
const football=reducer({...initialState(),careerSubMode:'intervalo'},{type:'SET_SUBMODE',mode:'intervalo'})
assert.equal(football.careerSubMode,'dinamico','ação de cliente antigo não rearma modo aposentado')
const basketball=reducer({...initialState(),sport:'basquete'},{type:'SET_SUBMODE',mode:'intervalo'})
assert.equal(basketball.careerSubMode,'intervalo','preserva a regra do basquete')
console.log('PASS escalação: troca comum temporária, Elenco permanente, reposição clínica automática validada, prazo preservado, sem duplicação e basquete isolado')

let mixed=initialState();mixed=reducer(mixed,{type:'PLAN_MATCH_INJURY',injury:plan});mixed={...mixed,round:11}
mixed=reducer(mixed,{type:'SET_AO_VIVO',mgrId:0,round:10,initial:entradaM2(base),aoVivo:[{t:20,sai:casa[0].id,entra:keeperReserve.id},{...injury,entra:reserve.id}]})
mixed=reducer(mixed,{type:'FINISH_MATCH_INJURY'})
assert(mixed.careerLineup[0][11].includes(casa[0].id),'goleiro trocado por opção técnica volta no próximo jogo')
assert(!mixed.careerLineup[0][11].includes(keeperReserve.id),'troca comum não herda a persistência da lesão')
assert(mixed.careerLineup[0][11].includes(reserve.id),'somente o substituto clínico fica no próximo XI')
console.log('PASS trocas mistas: apenas a reposição do lesionado persiste')

let edited=initialState();edited=reducer(edited,{type:'PLAN_MATCH_INJURY',injury:plan});edited={...edited,round:11}
edited=reducer(edited,{type:'SET_AO_VIVO',mgrId:0,round:10,initial:entradaM2(base),aoVivo:[{...injury,entra:reserve.id}]})
edited=reducer(edited,{type:'SET_LINEUP',mgrId:0,ids:nextIds})
const chosenFuture=JSON.stringify(edited.careerLineup)
edited=reducer(edited,{type:'FINISH_MATCH_INJURY'})
assert.equal(JSON.stringify(edited.careerLineup),chosenFuture,'respeita XI já organizado pelo usuário na aba Elenco')
assert.equal(edited.eventoTemporada.status,'banco')
console.log('PASS escolha já feita no Elenco: nenhuma segunda troca nem restauração indesejada')
