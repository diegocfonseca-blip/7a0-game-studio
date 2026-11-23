import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const out=process.env.QA_OUTPUT||'/workspace/shared/plano-persistente-20261123'
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const errors=[],checks=[]
const check=(name,value)=>{assert(value,name);checks.push(name)}
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'}),page=await context.newPage()
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url())
   if(url.hostname!=='127.0.0.1')return route.fulfill({status:200,contentType:'application/json',body:'[]'})
   if(url.pathname==='/src/escalacao/online-preview.ts'){
    const response=await route.fetch()
    return route.fulfill({response,body:(await response.text())+'\nstarted=true;enabled=false;verifiedEmail="diego.c.fonseca@gmail.com";'})
   }
   return route.continue()
  })
  await page.goto('http://127.0.0.1:5178/scripts/teste-football-full/',{waitUntil:'networkidle'})
  const panel=page.locator('.fp-advanced-tactics')
  await panel.waitFor()
  const original=await page.evaluate(()=>JSON.stringify({results:window.qaFull.state.lastResults,table:window.qaFull.state.league,round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm}))
  for(const name of ['Ofensivo','Pontas','Pressão alta','Rápido'])await panel.getByRole('button',{name,exact:true}).click()
  await page.waitForFunction(()=>window.qaFull.state.footballNextPlans?.[0]?.pace==='fast')
  check(`${width}: todas as escolhas salvas ao tocar`,await page.evaluate(()=>{const p=window.qaFull.state.footballNextPlans[0];return p.posture==='ataque'&&p.attack==='wings'&&p.pressure==='high'&&p.pace==='fast'&&p.mark===null}))
  check(`${width}: salvar não altera o jogo em andamento`,original===await page.evaluate(()=>JSON.stringify({results:window.qaFull.state.lastResults,table:window.qaFull.state.league,round:window.qaFull.state.round,at:window.qaFull.state.rodadaEm})))
  check(`${width}: opções explicam persistência`,(await panel.locator('[role=status]').innerText()).includes('próximos jogos'))
  for(const name of ['Tabela e jogos','Estatísticas','Elenco','Rivalidades','Partida'])await page.getByRole('button',{name,exact:true}).first().evaluate(button=>button.click())
  for(const name of ['Ofensivo','Pontas','Pressão alta','Rápido'])check(`${width}: ${name} conserva seleção após abas`,await panel.getByRole('button',{name,exact:true}).getAttribute('aria-pressed')==='true')
  check(`${width}: abas continuam separadas`,await page.locator('.fp-page-tabs button').count()===5)
  // Advance three actual reducer rounds without sending a live order.
  for(let round=0;round<3;round++){
   await page.evaluate(()=>window.qaFull.dispatch({type:'PLAY_ROUND'}))
   await page.waitForFunction(()=>window.qaFull.state.footballPlans?.[0]?.pace==='fast')
   for(const name of ['Ofensivo','Pontas','Pressão alta','Rápido'])check(`${width}: rodada ${round+1} mantém ${name}`,await panel.getByRole('button',{name,exact:true}).getAttribute('aria-pressed')==='true')
  }
  check(`${width}: plano realmente chega ao motor`,await page.evaluate(()=>{const s=window.qaFull.state,p=s.footballPlans[0];return s.tactics[0]==='ataque'&&p.attack==='wings'&&p.pressure==='high'&&p.pace==='fast'}))
  // Force the full restore path so the panel re-renders from saved authoritative data.
  await page.evaluate(()=>{const s=JSON.parse(JSON.stringify(window.qaFull.state));window.qaFull.dispatch({type:'RESTORE_ONLINE',state:s,roomId:s.roomId,roomCode:s.roomCode,isHost:true,playerIndex:0,youUid:s.youUid})})
  for(const name of ['Ofensivo','Pontas','Pressão alta','Rápido'])check(`${width}: reentrada mantém ${name}`,await panel.getByRole('button',{name,exact:true}).getAttribute('aria-pressed')==='true')
  await panel.getByRole('button',{name:'Retranca',exact:true}).click()
  await page.evaluate(()=>window.qaFull.dispatch({type:'PLAY_ROUND'}))
  check(`${width}: nova escolha substitui anterior`,await page.evaluate(()=>window.qaFull.state.tactics[0]==='retranca'&&window.qaFull.state.footballNextPlans[0].posture==='retranca'))
  await panel.screenshot({path:`${out}/${width}-plano-persistente.png`})
  await context.close()
 }
 check('sem erros JavaScript',errors.length===0)
 fs.writeFileSync(`${out}/plano-resultado.json`,JSON.stringify({checks,errors},null,2))
 console.log(`PASS: ${checks.length} verificações de persistência em 390/1440 px`)
}finally{await browser.close()}
