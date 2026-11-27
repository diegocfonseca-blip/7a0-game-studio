import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const out=process.env.QA_OUTPUT??'/tmp/carreira-viva-20261127';mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']})
let activePage;const checks=[],errors=[];const ok=(value,name)=>{assert(value,name);checks.push(name);console.log('OK',name)}
try{
 for(const traditional of [false,true])for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR',acceptDownloads:true})
  await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5193/')?r.continue():r.abort())
  await ctx.routeWebSocket('**/*',w=>w.close())
  await ctx.addInitScript(()=>{localStorage.setItem('bl_lang','pt');const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return String(kind).includes('webgl')?null:old.call(this,kind,...args)};Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.qaShareCount=(window.qaShareCount??0)+1;window.qaShared=data.files?.[0]}})})
  const p=activePage=await ctx.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)})
  const label=`${traditional?'tradicional':'oficial'}-${width}`
  await p.goto(`http://127.0.0.1:5193/scripts/teste-carreira-viva/?round=0${traditional?'&tradicional=1':''}${width===390?'&gratis=1':''}`,{waitUntil:'domcontentloaded'})
  await p.waitForFunction(()=>!!window.qaState)
  for(let i=0;i<5&&await p.locator('.csg-unlock').count();i++){const panel=p.locator('.csg-unlock');const later=panel.getByRole('button',{name:'Entendi, ver depois',exact:true});await (await later.count()?later:panel.getByRole('button').first()).click()}
  await p.waitForSelector('[data-career-first-step]')
  await p.locator('[data-career-first-step]').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${label}-estreia.png`})
  ok(await p.locator('[data-career-first-step]').count()===1,label+': uma dica, sem bloquear estreia')
  await p.getByRole('button',{name:'Pular dicas iniciais',exact:true}).click();await p.waitForSelector('[data-career-first-step]',{state:'detached'})
  ok(await p.evaluate(()=>qaState.careerSeen['inicio-dispensado-v1']),label+': pular fica registrado')
  await p.waitForFunction(()=>window.qaViva?.rivalNome)
  await p.evaluate(()=>{
   const s=qaState,m=s.managers[s.youIdx],opponent=qaViva.rivalNome
   qaPatch({seasonNo:2,calCopaSeason:2,careerColetiva:{...s.careerColetiva,[m.id]:{...s.careerColetiva?.[m.id],arquirrival:opponent}},careerCronica:{[`m${m.id}`]:[{t:1,div:'D',campeao:1}]}})
  })
  await p.waitForFunction(()=>qaState.seasonNo===2)
  await p.evaluate(()=>{const s=qaState,m=s.managers[s.youIdx],c=m.squad.find(c=>c.pos==='ATA'&&!c.fake)||m.squad.find(c=>!c.fake);qaDispatch({type:'RECORD_CAREER_GAME',mgrId:m.id,game:{id:'qa:recorded-derby',season:2,competition:'Liga',opponent:qaViva.rivalNome,home:true,gf:4,ga:1,players:[{id:c.id,name:c.name,goals:3,assists:0}]}})})
  await p.waitForSelector('[data-career-rival-story]');await p.locator('[data-career-rival-story] summary').click()
  const cash=await p.evaluate(()=>JSON.stringify(qaState.careerCoins)),round=await p.evaluate(()=>qaState.round)
  ok((await p.locator('[data-career-rival-story]').innerText()).includes('4 × 1'),label+': clássico mostra placar registrado')
  await p.locator('[data-career-rival-story]').scrollIntoViewIfNeeded();await p.locator('[data-career-rival-story]').screenshot({path:`${out}/${label}-classico.png`})
  await p.locator('[data-career-share-moments]>summary').click()
  const button=p.locator('[data-career-share-moment]').first().getByRole('button',{name:'📤 COMPARTILHAR ESTE MOMENTO',exact:true})
  await button.click();await p.waitForFunction(()=>window.qaShared?.size>1000)
  const shared=await p.evaluate(async()=>({name:qaShared.name,type:qaShared.type,bytes:[...new Uint8Array(await qaShared.arrayBuffer())]}))
  ok(shared.type==='image/png'&&shared.name==='momento-da-carreira.png',label+': imagem real pronta para compartilhar')
  writeFileSync(`${out}/${label}-momento.png`,Buffer.from(shared.bytes))
  ok(await p.evaluate(()=>JSON.stringify(qaState.careerCoins))===cash&&await p.evaluate(()=>qaState.round)===round,label+': compartilhar não gasta nem avança rodada')
  // Browsers without working native sharing must still offer the actual PNG download.
  if(!traditional&&width===390){
   await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('not supported')}}))
   const download=p.waitForEvent('download');await button.click();await (await download).saveAs(`${out}/fallback-download.png`)
   ok(true,'falha do compartilhar nativo oferece download')
  }
  await p.evaluate(()=>{const s=qaState,id=s.managers[s.youIdx].id;qaPatch({stadiums:{...s.stadiums,[id]:{inv:{},ext:[]}}});qaAba('estadio')})
  const structure=p.getByRole('button',{name:/Estrutura/}).first();await structure.click()
  await p.getByRole('button',{name:'Melhorias',exact:true}).click()
  await p.waitForSelector('[data-career-structure-impact="grama"]')
  const preview=p.locator('[data-career-structure-impact="grama"]');await preview.locator('summary').click()
  const text=await preview.innerText()
  ok(text.includes('20 moedas')&&text.includes('67%')&&text.includes('Manutenção adicional'),label+': prévia mostra preço real, etapa e manutenção')
  ok(await p.evaluate(()=>JSON.stringify(qaState.careerCoins))===cash,label+': consultar estrutura não efetua compra')
  await preview.scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${label}-estrutura.png`})
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': sem excesso horizontal')
  const before=await p.evaluate(()=>{const s=qaState,id=s.managers[s.youIdx].id;return{cash:s.careerCoins[id],inv:s.stadiums[id].inv.grama??0}})
  await preview.locator('..').locator('..').getByRole('button').last().click()
  await p.waitForFunction(()=>{const s=qaState,id=s.managers[s.youIdx].id;return s.stadiums[id].inv.grama===20})
  ok(await p.evaluate(()=>{const s=qaState;return s.careerCoins[s.managers[s.youIdx].id]})===before.cash-20,label+': compra real corresponde à prévia de 20 moedas')
  await ctx.close()
 }
 ok(errors.length===0,'sem erros JavaScript nos dois modos e tamanhos')
 writeFileSync(out+'/resultado.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,out}))
}catch(error){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:out+'/falha.png'});writeFileSync(out+'/falha.txt',await activePage.locator('body').innerText())}throw error}finally{await browser.close()}
