import{chromium}from'playwright-core'
import assert from'node:assert/strict'
import{mkdirSync,writeFileSync}from'node:fs'
const base=process.env.QA_BASE??'http://127.0.0.1:4216',old=process.argv.includes('--antes'),out='/workspace/shared/lavras-reentrada-20261116';mkdirSync(out,{recursive:true})
const report={before:old,checks:[],errors:[]},browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
try{
 const pages=[];for(const guest of[false,true]){const c=await browser.newContext();await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/7a0-game-studio/scripts/teste-reentrada-identidade/index.html'+(guest?'?guest':''));await p.waitForFunction(()=>window.qa);await p.evaluate(guest=>window.qa.dispatch({type:'RESTORE_ONLINE',state:window.qaSeed,roomId:'sala-local',roomCode:'LOCAL1',isHost:!guest,playerIndex:guest?8:0,youUid:guest?'convidado-local':'host-local'}),guest);await p.waitForFunction(()=>window.qa.state.onlineMode==='online');await p.waitForFunction(()=>window.qaWire.some(m=>m.event==='request_state')||window.qa.state.isHost);pages.push(p)}
 const[host,guest]=pages
 async function forwardActions(from,to){const messages=await from.evaluate(()=>window.qaWire.splice(0).filter(m=>m.event==='action'));for(const m of messages)await to.evaluate(m=>window.qaDeliver(m),m);return messages}
 // O MESMO dispatch e os MESMOS receptores do EscProvider da produção.
 await guest.evaluate(()=>window.qaWire.length=0);await guest.evaluate(()=>window.qa.dispatch({type:'GO_LOBBY_ONLINE'}));const menuMessages=await forwardActions(guest,host)
 await host.waitForFunction(before=>window.qa.state.screen===(before?'lobby':'end'),old)
 const menu={remote:menuMessages.length,hostScreen:await host.evaluate(()=>window.qa.state.screen),guestScreen:await guest.evaluate(()=>window.qa.state.screen)};report.checks.push({menu})
 if(old){assert.equal(menu.remote,1);assert.equal(menu.hostScreen,'lobby');assert.equal(menu.guestScreen,'end')}
 else{assert.equal(menu.remote,0);assert.equal(menu.hostScreen,'end');assert.equal(menu.guestScreen,'lobby')}
 await guest.evaluate(()=>window.qa.dispatch({type:'RESTORE_ONLINE',state:window.qaSeed,roomId:'sala-local',roomCode:'LOCAL1',isHost:false,playerIndex:8,youUid:'convidado-local'}));const restoreMessages=await forwardActions(guest,host)
 await host.waitForFunction(before=>window.qa.state.youUid===(before?'convidado-local':'host-local'),old)
 const restored={remote:restoreMessages.length,host:await host.evaluate(()=>({uid:window.qa.state.youUid,isHost:window.qa.state.isHost,index:window.qa.state.youIdx})),guest:await guest.evaluate(()=>({uid:window.qa.state.youUid,index:window.qa.state.youIdx,screen:window.qa.state.screen}))};report.checks.push({restored})
 if(old){assert.equal(restoreMessages.length,1);assert.equal(restored.host.isHost,false);assert.equal(restored.host.index,1)}
 else{
  assert.equal(restoreMessages.length,0);assert.deepEqual(restored.host,{uid:'host-local',isHost:true,index:0});assert.equal(restored.guest.index,1);assert.equal(restored.guest.screen,'end')
  // Aba antiga ainda manda o pacote: as duas entradas do dono devem ignorá-lo.
  for(const topic of['escalacao:sala-local','escalacao-in:sala-local'])for(const type of['RESTORE_ONLINE','ASSISTIR_ONLINE','FIX_YOU_IDX','STEP_DOWN_HOST','GO_LOBBY_ONLINE','SYNC_STATE','RECOVER_LOCAL_HOST','BECOME_HOST','START_ONLINE','KICKED_OUT','GO_LOBBY','NEW_GAME','GO_ALBUM','GO_RANKING']){
   await host.evaluate(({topic,type})=>window.qaDeliver({topic,event:'action',payload:{type,state:window.qaSeed,newState:window.qaSeed,roomId:'sala-local',roomCode:'LOCAL1',isHost:false,playerIndex:8,youUid:'convidado-local',hostUid:'host-local',idx:1}}),{topic,type})
  }
  assert.deepEqual(await host.evaluate(()=>({uid:window.qa.state.youUid,isHost:window.qa.state.isHost,screen:window.qa.state.screen,index:window.qa.state.youIdx})),{uid:'host-local',isHost:true,screen:'end',index:0})
  // Uma ação legítima continua viajando pela mesma caixa do dono.
  await guest.evaluate(()=>window.qa.dispatch({type:'SET_SIM_SPEED',speed:3}));const gameMessages=await forwardActions(guest,host);assert.equal(gameMessages.length,1);await host.waitForFunction(()=>window.qa.state.simSpeed===3);report.checks.push({oldMessagesRejected:true,gameActionDelivered:true})
 }
 assert.deepEqual(report.errors,[]);report.success=true;console.log(JSON.stringify(report,null,2))
}finally{writeFileSync(out+'/'+(old?'antes':'depois')+'.json',JSON.stringify(report,null,2));await browser.close()}
