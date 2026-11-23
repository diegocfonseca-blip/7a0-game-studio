import assert from 'node:assert/strict'
import {reducer,sanitizeParaSala} from '../src/escalacao/store'
import {footballTestState} from './football-test-state'
import {DEFAULT_FOOTBALL_PLAN,FOOTBALL_LOCAL_ORDER,planFor,nextPlanFor,publishFootballClock} from '../src/escalacao/football-live-tactics'
import {pack,unpack} from '../src/escalacao/netpack'
import {acaoRemotaDaSalaPermitida} from '../src/escalacao/online-acoes-locais'
import type {EscState} from '../src/escalacao/types'

const base=footballTestState(),you=base.managers[base.youIdx],guest=base.managers[1]
const plan={...DEFAULT_FOOTBALL_PLAN,posture:'ataque' as const,attack:'wings' as const,pressure:'high' as const,pace:'fast' as const}
const save={type:'FOOTBALL_SAVE_PLAN' as const,mgrId:you.id,by:base.youUid!,plan}
const saved=reducer(base,save)
assert.deepEqual(nextPlanFor(saved,you.id),plan,'choice saved immediately')
assert.deepEqual(planFor(saved,you.id),planFor(base,you.id),'no unsubmitted live change')
for(const key of ['lastResults','league','scorers','assists','round','rodadaEm','simSpeed','rivalries'] as const)assert.deepEqual(saved[key],base[key],`saving leaves ${key} unchanged`)
assert.deepEqual(reducer(saved,save),saved,'repeat save is idempotent')
assert(acaoRemotaDaSalaPermitida(save),'guest save uses existing route to the host')
assert(!acaoRemotaDaSalaPermitida('FOOTBALL_LIVE_PLAN'),'guest still cannot inject live recalculations')

let advancing=saved
for(let i=0;i<5;i++){
 advancing=reducer(advancing,{type:'PLAY_ROUND'})
 assert.deepEqual(planFor(advancing,you.id),plan,`applied in match ${i+1}`)
 assert.deepEqual(nextPlanFor(advancing,you.id),plan,`remembered after match ${i+1}`)
}
// Same seed and saved plan produce exactly the same future game as an already-active plan.
const expected=reducer({...base,tactics:{...base.tactics,[you.id]:plan.posture},footballPlans:{[you.id]:plan}},{type:'PLAY_ROUND'})
assert.deepEqual(reducer(saved,{type:'PLAY_ROUND'}).lastResults,expected.lastResults,'next game actually uses every saved option')

const wire=unpack<EscState>(pack(sanitizeParaSala(saved)))
const restored=reducer(base,{type:'RESTORE_ONLINE',state:wire,roomId:base.roomId!,roomCode:base.roomCode!,isHost:true,playerIndex:you.id,youUid:base.youUid!})
assert.deepEqual(nextPlanFor(restored,you.id),plan,'choice survives room save and reconnect')
assert.deepEqual(planFor(reducer(restored,{type:'PLAY_ROUND'}),you.id),plan,'restored choice also reaches engine')

const guestPlan={...plan,posture:'retranca' as const,pace:'slow' as const}
const guestSave={...save,mgrId:guest.id,by:base.seatUids![1],plan:guestPlan}
const guestSaved=reducer(saved,JSON.parse(JSON.stringify(guestSave)))
assert.deepEqual(nextPlanFor(guestSaved,guest.id),guestPlan,'host accepts serialized guest choice')
assert.deepEqual(nextPlanFor(guestSaved,you.id),plan,'guest choice does not replace host choice')
const guestLocal={...base,isHost:false,youIdx:1,youUid:base.seatUids![1]}
const synced=reducer(guestLocal,{type:'SYNC_STATE',newState:unpack<EscState>(pack(sanitizeParaSala(guestSaved)))})
assert.equal(synced.youIdx,1);assert.equal(synced.youUid,guestLocal.youUid);assert.equal(synced.isHost,false)
assert.deepEqual(nextPlanFor(synced,guest.id),guestPlan,'guest sees its saved plan after host acknowledgement')
assert.deepEqual(reducer(guestLocal,guestSave),guestLocal,'guest cannot authoritatively apply the action locally')
const reorder={...saved,managers:[saved.managers[1],saved.managers[0],...saved.managers.slice(2)],seatUids:[saved.seatUids![1],saved.seatUids![0],...saved.seatUids!.slice(2)],youIdx:1}
assert.deepEqual(nextPlanFor(reducer(reorder,guestSave),guest.id),guestPlan,'manager ID, not seat number, selects the plan')
assert.deepEqual(reducer(saved,{...guestSave,by:base.youUid!}),saved,'mismatched participant ID rejected')
assert.deepEqual(reducer(saved,{...save,mgrId:999}),saved,'unknown manager rejected')
assert.deepEqual(reducer(saved,{...save,plan:{...plan,mark:'another-player'}}),saved,'removed individual marking cannot be saved')
assert.deepEqual(reducer(saved,{...save,plan:{...plan,pressure:'invalid'}} as never),saved,'invalid option rejected')
for(const patch of [{isHost:false},{youUid:'other'},{sport:'basquete'},{careerOnline:true},{onlineMode:undefined},{seatUids:['unapproved']},{quickCopa:{}},{screen:'liberta'},{champion:1}]){
 const s=JSON.parse(JSON.stringify({...base,...patch})) as EscState
 assert.deepEqual(reducer(s,save),s,`save excluded: ${JSON.stringify(patch)}`)
}
const mixed={...saved,seatUids:['unapproved',...saved.seatUids!.slice(1)]}
const mixedNext=reducer(mixed,{type:'PLAY_ROUND'})
assert.equal(mixedNext.footballPlans?.[you.id],undefined,'queued test plans never activate in a public room')
const oldSelector=reducer(saved,{type:'SET_TACTIC',mgrId:you.id,tactic:'retranca'})
assert.equal(nextPlanFor(oldSelector,you.id).posture,'retranca','old posture selector replaces saved choice too')

publishFootballClock({room:base.roomId!,round:base.round,minute:30,at:Date.now()})
const live=reducer(saved,{type:'FOOTBALL_LIVE_PLAN',mgrId:you.id,by:base.youUid!,plan,requestId:'persist-live',round:base.round,localProof:FOOTBALL_LOCAL_ORDER})
assert.equal(live.lastResults.find(r=>r.homeId===you.id||r.awayId===you.id)?.footballLive?.revision,1,'saving does not block send-live action')
assert.deepEqual(nextPlanFor(live,you.id),plan,'accepted live plan also remains selected')
assert.deepEqual(planFor(reducer(live,{type:'PLAY_ROUND'}),you.id),plan,'accepted live plan carries into next match')
const replace={...plan,posture:'equilibrio' as const,attack:'mixed' as const,pressure:'normal' as const,pace:'normal' as const}
assert.deepEqual(planFor(reducer(reducer(live,{...save,plan:replace}),{type:'PLAY_ROUND'}),you.id),replace,'a later change replaces the persistent plan')
const neutral=reducer(base,{...save,plan:DEFAULT_FOOTBALL_PLAN})
assert.deepEqual(reducer(neutral,{type:'PLAY_ROUND'}).lastResults,reducer(base,{type:'PLAY_ROUND'}).lastResults,'saving neutral preserves legacy RNG and results')
const fresh=reducer(saved,{type:'NEW_GAME'})
assert.equal(fresh.footballNextPlans,undefined,'new game cannot inherit another room plan')
console.log('PASS: persistent plans, 5 rounds, actual simulation, save/reconnect, host/guest routing and identity, isolation, legacy selector, live orders and neutral RNG.')
