import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'

const base=process.env.QA_BASE??'http://127.0.0.1:4217'
const before=process.argv.includes('--antes')
const out=process.env.QA_OUT??'/workspace/shared/presenca-identica-20261116'
mkdirSync(out,{recursive:true})
const report={before,checks:[],errors:[],externalNetwork:false}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const stateMessages=messages=>messages.filter(m=>['state','stateP'].includes(m.event))
async function take(p){return p.evaluate(()=>window.qaWire.splice(0))}
async function settle(p){await p.clock.runFor(700)}
try {
 const pages=[]
 for(const guest of [false,true]){
  const ctx=await browser.newContext()
  await ctx.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort())
  await ctx.routeWebSocket('**/*',w=>w.close())
  const p=await ctx.newPage()
  p.on('pageerror',e=>report.errors.push(e.message))
  await p.clock.install({time:new Date('2026-11-16T15:00:00Z')})
  await p.goto(base+'/7a0-game-studio/scripts/teste-reentrada-identidade/index.html'+(guest?'?guest':''))
  await p.waitForFunction(()=>window.qa)
  await p.evaluate(guest=>window.qa.dispatch({type:'RESTORE_ONLINE',state:window.qaSeed,roomId:'sala-local',roomCode:'LOCAL1',isHost:!guest,playerIndex:guest?8:0,youUid:guest?'convidado-local':'host-local'}),guest)
  await p.waitForFunction(()=>window.qa.state.onlineMode==='online')
  await settle(p)
  pages.push(p)
 }
 const [host,guest]=pages
 const unit=await host.evaluate(()=>{
  const reduce=window.qaReducer,seed=window.qaSeed
  const s={...seed,presence:[0,1],presenceUids:['host-local','convidado-local']}
  const unchanged=reduce(s,{type:'SET_PRESENCE',indices:[0,1],uids:['host-local','convidado-local']})
  const omitted=reduce(s,{type:'SET_PRESENCE',indices:[0,1]})
  const unknown={...s,presenceUids:undefined}
  const explicitEmpty=reduce(unknown,{type:'SET_PRESENCE',indices:[0,1],uids:[]})
  const noUids=reduce(unknown,{type:'SET_PRESENCE',indices:[0,1]})
  const changed=reduce(s,{type:'SET_PRESENCE',indices:[0,1],uids:['host-local','outro-local']})
  const reordered=reduce(s,{type:'SET_PRESENCE',indices:[1,0],uids:['convidado-local','host-local']})
  const left=reduce(s,{type:'SET_PRESENCE',indices:[],uids:[]})
  const duo=reduce(s,{type:'SET_PRESENCE',indices:[0,0],uids:['host-local','parceiro-local']})
  return {identicalReference:unchanged===s,omittedReference:omitted===s,unknownReference:noUids===unknown,
   emptyExplicitChanges:explicitEmpty!==unknown&&Array.isArray(explicitEmpty.presenceUids)&&explicitEmpty.presenceUids.length===0,
   changed:changed!==s&&changed.presenceUids[1]==='outro-local',reordered:reordered!==s&&reordered.presence[0]===1,
   left:left!==s&&left.presence.length===0&&left.presenceUids.length===0,
   duo:duo.presence.join(',')==='0,0'&&duo.presenceUids.join(',')==='host-local,parceiro-local',
   inputUnmodified:JSON.stringify(s.presence)==='[0,1]'&&s.presenceUids[1]==='convidado-local'}
 })
 assert.equal(unit.identicalReference,!before)
 assert.equal(unit.omittedReference,!before)
 assert.equal(unit.unknownReference,!before)
 for(const k of ['emptyExplicitChanges','changed','reordered','left','duo','inputUnmodified'])assert.equal(unit[k],true,k)
 report.checks.push({reducer:unit})
 await take(host);await take(guest)
 async function syncPresence(entries){
  await host.evaluate(entries=>window.qaSyncPresence({local:entries}),entries)
  await settle(host)
  const messages=stateMessages(await take(host))
  for(const m of messages)await guest.evaluate(m=>window.qaDeliver(m),m)
  await settle(guest)
  return messages
 }
 const people=[{playerIndex:0,uid:'host-local',rp:1},{playerIndex:1,uid:'convidado-local',rp:1}]
 const joined=await syncPresence(people)
 assert.equal(joined.length,1)
 let repeats=0
 for(let i=0;i<5;i++)repeats+=(await syncPresence(people)).length
 assert.equal(repeats,before?5:0)
 report.checks.push({fiveIdenticalPresenceSyncs:{stateSends:repeats,expected:before?5:0}})
 const metadataOnly=await syncPresence(people.map(p=>({...p,presence_ref:'nova-inscricao',online_at:'depois'})))
 assert.equal(metadataOnly.length,before?1:0)
 report.checks.push({samePeopleNewConnectionMetadata:{stateSends:metadataOnly.length}})
 for(const [name,entries] of [
  ['differentUidSameSeat',[people[0],{playerIndex:1,uid:'outro-local',rp:1}]],
  ['leave',[people[0]]],['rejoin',people],['orderChanged',[...people].reverse()],
  ['twoPeopleSameSeat',[people[0],{playerIndex:0,uid:'convidado-local',rp:1}]],['restoreSeats',people]
 ]){
  const messages=await syncPresence(entries)
  assert.equal(messages.length,1,name)
  const actual=await host.evaluate(()=>({indices:window.qa.state.presence,uids:window.qa.state.presenceUids}))
  assert.deepEqual(actual,{indices:entries.map(p=>p.playerIndex),uids:entries.map(p=>p.uid)})
  report.checks.push({[name]:{stateSends:messages.length}})
 }
 // Uma pessoa desconectada pode ter perdido o estado: o pedido explícito nunca é deduplicado.
 await take(host)
 for(let i=0;i<2;i++){
  await host.evaluate(()=>window.qaDeliver({topic:'escalacao:sala-local',event:'request_state',payload:{}}))
  await settle(host)
  const reply=stateMessages(await take(host))
  assert.equal(reply.length,1)
  assert.equal(reply[0].event,'state')
  for(const m of reply)await guest.evaluate(m=>window.qaDeliver(m),m)
  await settle(guest)
 }
 report.checks.push({repeatedExplicitRecovery:{fullReplies:2}})
 await take(guest)
 await guest.evaluate(()=>window.qa.dispatch({type:'SET_SIM_SPEED',speed:3}))
 await settle(guest)
 const actions=(await take(guest)).filter(m=>m.event==='action')
 assert.equal(actions.length,1)
 for(const m of actions)await host.evaluate(m=>window.qaDeliver(m),m)
 await host.waitForFunction(()=>window.qa.state.simSpeed===3)
 await settle(host)
 const gameState=stateMessages(await take(host))
 assert(gameState.length>0)
 for(const m of gameState)await guest.evaluate(m=>window.qaDeliver(m),m)
 await guest.waitForFunction(()=>window.qa.state.simSpeed===3)
 report.checks.push({legitimateGameAction:{delivered:true,synchronized:true}})
 await take(host)
 await host.clock.runFor(31000)
 const heartbeat=stateMessages(await take(host))
 assert(heartbeat.length>0,'heartbeat must remain active')
 report.checks.push({heartbeat:{stateSends:heartbeat.length,preserved:true}})
 for(const [p,expected] of [[host,{uid:'host-local',isHost:true,index:0}],[guest,{uid:'convidado-local',isHost:false,index:1}]]){
  assert.deepEqual(await p.evaluate(()=>({uid:window.qa.state.youUid,isHost:window.qa.state.isHost,index:window.qa.state.youIdx})),expected)
 }
 report.checks.push({hostAndGuestIdentitiesPreserved:true})
 assert.deepEqual(report.errors,[])
 report.success=true
 console.log(JSON.stringify(report,null,2))
}finally {
 writeFileSync(out+'/'+(before?'antes':'depois')+'.json',JSON.stringify(report,null,2)+'\n')
 await browser.close()
}
