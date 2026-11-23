import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/ritmo-online-20261123/correcao'
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const checks=[],errors=[],samples=[]
const check=(name,value)=>{assert(value,name);checks.push(name)}
async function open(query='',auto=false,width=1280){
 const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR'}),page=await context.newPage()
 const now=Date.now()
 await page.clock.install({time:now});await page.clock.pauseAt(now+100)
 await page.addInitScript(auto=>{
  localStorage.setItem('esc-stream-auto',auto?'1':'0')
  const descriptor=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width'),counts=new WeakMap()
  Object.defineProperty(HTMLCanvasElement.prototype,'width',{...descriptor,set(value){counts.set(this,(counts.get(this)||0)+1);return descriptor.set.call(this,value)}})
  window.qaCanvasCount=canvas=>counts.get(canvas)||0
  window.qaResults=()=>JSON.stringify(Object.fromEntries(['seed','round','lastResults','league','scorers','assists','quickCopa','liberta','champions','youIdx','youUid','seatUids','isHost'].map(key=>[key,window.qaFull.state[key]])))
 },auto)
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({status:200,contentType:'application/json',body:'[]'}))
 await page.goto('http://127.0.0.1:5178/scripts/teste-football-full/?public=1'+query,{waitUntil:'networkidle'})
 await page.waitForSelector('.ov3-native',{state:'attached'})
 await page.clock.runFor(100)
 return {page,context}
}
const snapshot=page=>page.evaluate(()=>{
 const label=document.querySelector('.ov3-native .ll25-numbers small')?.textContent||''
 return{label,minute:parseInt(label),others:[...document.querySelectorAll('.ll26-fixture header b')].map(x=>x.textContent).filter(s=>/LIVE|AO VIVO/.test(s)).map(s=>Number(s.match(/(\d+)[′']/)?.[1])),round:window.qaFull.state.round,results:window.qaResults()}
})
try{
 if(!process.env.QA_AUTOPLAY_ONLY){
 for(const competition of ['league','liberta','champions','cup']){
  const {page,context}=await open('&competition='+competition)
  await page.clock.runFor(1500)
  for(const rate of [.25,2,1]){
   const before=await snapshot(page)
   await page.evaluate(speed=>window.qaFull.dispatch({type:'SET_SIM_SPEED',speed}),rate)
   await page.clock.runFor(50)
   const after=await snapshot(page)
   check(`${competition} ${rate}: native minute preserved`,after.minute>=before.minute&&after.minute<=before.minute+2)
   check(`${competition} ${rate}: results and identity unchanged`,after.results===before.results)
   check(`${competition} ${rate}: other clocks agree`,after.others.length>0&&after.others.every(min=>Math.abs(min-after.minute)<=1))
   samples.push({competition,rate,before:{...before,results:undefined},after:{...after,results:undefined}})
  }
  await page.screenshot({path:`${out}/${competition}.png`})
  await context.close()
 }
 for(const width of [390,1280]){
  const {page,context}=await open('&field=1',false,width)
  await page.clock.runFor(1000)
  await page.evaluate(()=>{window.qaOriginalCanvas=document.querySelector('.ov3-native canvas')})
  for(const rate of [1,4,2.5]){
   const before=await page.evaluate(()=>({count:window.qaCanvasCount(window.qaOriginalCanvas),results:window.qaResults()}))
   await page.evaluate(vel=>window.qaFull.dispatch({type:'SET_VEL_2D',vel}),rate)
   await page.clock.runFor(100)
   const after=await page.evaluate(()=>({same:window.qaOriginalCanvas===document.querySelector('.ov3-native canvas'),count:window.qaCanvasCount(window.qaOriginalCanvas),results:window.qaResults()}))
   check(`${width} rate ${rate}: canvas and renderer retained`,after.same&&before.count===after.count)
   check(`${width} rate ${rate}: results unchanged`,after.results===before.results)
  }
  check(`${width}: host has view controls`,await page.locator('.fp-view-picker button:visible').count()===2)
  await page.screenshot({path:`${out}/campo-${width}.png`});await context.close()
 }
 const guest=await open('&field=1&guest=futpoint')
 check('guest has no view controls',await guest.page.locator('.fp-view-picker button:visible').count()===0)
 await guest.context.close()
 }
 // Autoplay must use the remaining fraction, not restart a full round after a rate change.
 for(const competition of ['league','liberta','champions','cup']){
  const {page,context}=await open('&competition='+competition,true)
  const stateStep=()=>page.evaluate(()=>{const s=window.qaFull.state;return s.screen==='liberta'?s.liberta.rodada:s.screen==='champions'?s.champions.rodada:s.quickCopa?.ties[0]?.legs.length??s.round})
  const initial=await stateStep()
  await page.clock.fastForward(2000)
  await page.evaluate(()=>window.qaFull.dispatch({type:'SET_SIM_SPEED',speed:.25}))
  await page.clock.runFor(10)
  await page.clock.fastForward(9000)
  check(`${competition}: slower rate does not advance at the old deadline`,await stateStep()===initial)
  await page.evaluate(()=>window.qaFull.dispatch({type:'SET_SIM_SPEED',speed:4}))
  await page.clock.runFor(10)
  await page.clock.fastForward(competition==='cup'?4000:3000)
  await page.clock.runFor(20)
  const advanced=await stateStep()
  console.log('autoplay',competition,{initial,advanced},await page.evaluate(()=>({at:Date.now(),round:window.qaFull.state.round,ch:window.qaFull.state.champions?.rodada,screen:window.qaFull.state.screen,speed:window.qaFull.state.simSpeed})))
  check(`${competition}: faster rate advances using remaining time`,advanced===initial+1)
  await context.close()
 }
 // Cinematic penalties stay adjacent to the score and retain their allotted time.
 const final=await open('&competition=cup-final-pen',true)
 await final.page.clock.fastForward(14500)
 await final.page.clock.runFor(100)
 check('final: penalties displayed',await final.page.locator('.fp-cup-penalties').count()===1)
 await final.page.evaluate(()=>window.qaFull.dispatch({type:'SET_SIM_SPEED',speed:4}))
 await final.page.clock.runFor(10)
 await final.page.clock.fastForward(2000)
 check('final: speed change does not cut the shootout',await final.page.locator('.fp-cup-penalties').count()===1)
 await final.context.close()
 check('no JavaScript exceptions',errors.length===0)
 fs.writeFileSync(`${out}/resultado.json`,JSON.stringify({checks:checks.length,names:checks,samples,errors},null,2))
 console.log(`PASS: ${checks.length} browser checks: speed continuity, renderer retention, results, host controls, autoplay and penalties.`)
}catch(error){fs.writeFileSync(`${out}/falha.json`,JSON.stringify({error:error.message,checks,samples,errors},null,2));throw error}
finally{await browser.close()}
