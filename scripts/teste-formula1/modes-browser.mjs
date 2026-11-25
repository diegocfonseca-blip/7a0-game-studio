import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {qaBackend} from './backend.mjs'
process.env.DEPLOY_BASE='/';process.env.VITE_ONLY_GAME='escalacao'
const port=5364,out='/workspace/shared/formula1-padroes-20261125';mkdirSync(out,{recursive:true});const vite=await createServer({server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await vite.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});let p
try{
 const report=[]
 for(const [mode,button,width]of [['single','⚡ Envelope único',390],['open','🔨 Pregão aberto',1440],['dutch','🐊 Tocaia',390]]){
  const c=await browser.newContext({viewport:{width,height:width<600?844:1000},locale:'pt-BR'});p=await c.newPage();await p.clock.install();const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.stack)});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,300))});p.on('requestfailed',r=>{if(r.url().includes('127.0.0.1'))console.log('FAILED',r.url(),r.failure())});p.setDefaultTimeout(90000)
  await c.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close());await c.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:qaBackend}))
  await p.goto(`http://127.0.0.1:${port}/?sport=formula1`,{waitUntil:'domcontentloaded'});console.log('GOTO',mode);await p.waitForFunction(()=>typeof qaSetUser==='function');console.log('AUTH',mode);await p.evaluate(()=>qaSetUser('diego.c.fonseca@gmail.com'));await p.locator('.hv3-f1').waitFor();console.log('HOME',mode);await p.locator('.hv3-quick .hv3-primary').click();await p.locator('.ll-quick-shell .ov3-brand').waitFor();await p.screenshot({path:`${out}/${width}-menu-header-final.png`});await p.getByRole('button',{name:new RegExp('^'+button)}).click();await p.getByRole('button',{name:'AVANÇAR 🔨',exact:true}).click();await p.locator('.f1-shell .ov3-brand').waitFor();console.log('AUCTION',mode);assert.equal(await p.getByText(/OVR/).count(),0)
  if(mode==='single'){
   const inputs=p.getByRole('spinbutton');for(const i of [0,1,8])await inputs.nth(i).fill('20');await p.getByRole('button',{name:'✉️ LACRAR ENVELOPE',exact:true}).click();await p.waitForFunction(()=>__formula1.session.auction.phase==='reveal');assert.equal(await p.evaluate(()=>__formula1.session.auction.mode),'single')
  }else if(mode==='open'){
   await p.getByRole('button',{name:'COBRIR POR 1 🪙',exact:true}).click();assert.equal(await p.evaluate(()=>__formula1.session.auction.mesa.lider),0)
   for(let n=0;n<80&&!(await p.evaluate(()=>__formula1.session.auction.queue.length));n++){
    await p.clock.runFor(1000);const a=await p.evaluate(()=>__formula1.session.auction);if(a.mesa.lider!==0&&a.mesa.preco<25)await p.getByRole('button',{name:`COBRIR POR ${a.mesa.preco+1} 🪙`,exact:true}).click()
   }
   assert((await p.evaluate(()=>__formula1.session.auction.queue.length))>0,'O martelo encerra a carta e avança sem travar '+JSON.stringify(await p.evaluate(()=>({clock:__formula1.session.auction.clock,hidden:document.hidden}))))
  }else{
   for(let n=0;n<400&&(await p.evaluate(()=>__formula1.session.auction.mesa.preco))!==24;n++)await p.clock.runFor(100)
   const price=await p.evaluate(()=>__formula1.session.auction.mesa.preco);assert(price>0&&price<=30)
   await p.getByRole('button',{name:`PEGAR POR ${price} 🪙`,exact:true}).first().click();assert.equal(await p.evaluate(()=>__formula1.session.auction.teams[0].drivers.length),1)
   const money=await p.evaluate(()=>__formula1.session.auction.teams[0].coins);assert.equal(money,100-price);await p.clock.runFor(1000);assert.equal(await p.evaluate(()=>__formula1.session.auction.teams[0].drivers.length),1,'Não compra outro piloto na mesma etapa')
  }
  await p.screenshot({path:`${out}/${width}-modo-${mode}.png`});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);report.push({mode,width,errors,passed:true});console.log('PASS',mode);await c.close()
 }
 writeFileSync(out+'/modes-browser.json',JSON.stringify(report,null,2))
}catch(e){if(p&&!p.isClosed()){await p.screenshot({path:out+'/modes-falha.png'}).catch(()=>{});writeFileSync(out+'/modes-falha.txt',await p.locator('body').innerText().catch(()=>e.message))}throw e}finally{await browser.close();await vite.close()}
