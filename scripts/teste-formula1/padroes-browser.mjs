import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {qaBackend} from './backend.mjs'
process.env.DEPLOY_BASE='/';process.env.VITE_ONLY_GAME='escalacao'
const port=5362,out='/workspace/shared/formula1-padroes-20261125';mkdirSync(out,{recursive:true})
const vite=await createServer({server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await vite.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});let page
try{
 const report=[]
 for(const width of [390,1440,320]){
  const context=await browser.newContext({viewport:{width,height:width<600?844:1000},locale:'pt-BR'});page=await context.newPage();const errors=[];page.on('pageerror',e=>{console.log('PAGEERROR',e.stack);errors.push(e.message)});page.setDefaultTimeout(120000)
  await context.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close());await context.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:qaBackend}))
  await page.goto(`http://127.0.0.1:${port}/?sport=formula1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof qaSetUser==='function');await page.waitForTimeout(500);assert.equal(await page.locator('.hv3-f1').count(),0)
  for(const email of ['diego.c.fonseca2@gmail.com','futpoint@example.invalid']){await page.evaluate(email=>qaSetUser(email),email);await page.waitForTimeout(150);assert.equal(await page.locator('.hv3-f1').count(),0);assert.equal(await page.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).count(),0)}
  await page.evaluate(()=>qaSetUser('diego.c.fonseca@gmail.com'));await page.locator('.hv3-f1').waitFor();console.log('HOME',width);await page.evaluate(()=>document.fonts.ready)
  const snap=async(name,full=false)=>{await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/${width}-${name}.png`,fullPage:full,animations:'disabled'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}-${name}: overflow`);console.log('SCREEN',width,name)}
  const selectors=[]
  const selector=async()=>{const a=await page.locator('.hv3-utilities .ll-seletor-esporte button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();const s=getComputedStyle(b);return {label:b.textContent,height:r.height,top:r.top,pressed:b.getAttribute('aria-pressed'),font:s.fontSize,padding:s.padding,border:s.borderRadius}}));assert.equal(a.length,3);assert.equal(a.filter(b=>b.pressed==='true').length,1);assert.equal(new Set(a.map(b=>b.top)).size,1);assert.equal(new Set(a.map(b=>b.height)).size,1);selectors.push(a)}
  await selector();await snap('01-home-f1',true);assert(await page.locator('.hv3-online .hv3-primary').isDisabled());assert(await page.locator('.hv3-career .hv3-primary').isDisabled())
  await page.getByRole('button',{name:'⚽ FUTEBOL',exact:true}).click();await page.locator('.home-v03:not(.hv3-f1):not(.hv3-bb)').waitFor();await selector();await snap('02-home-futebol');await page.locator('.hv3-quick .hv3-primary').click();await page.locator('.ll-quick-shell').waitFor();await snap('02b-menu-futebol');await page.getByRole('button',{name:'🏠 Voltar ao início',exact:true}).click();await page.locator('.home-v03').waitFor()
  await page.getByRole('button',{name:'🏀 BASQUETE',exact:true}).click();await page.locator('.hv3-bb').waitFor();await selector();await snap('03-home-basquete');await page.locator('.hv3-quick .hv3-primary').click();await page.locator('.ll-quick-shell').waitFor();await snap('03b-menu-basquete');await page.getByRole('button',{name:'🏠 Voltar ao início',exact:true}).click();await page.locator('.home-v03').waitFor()
  await page.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).click();await page.locator('.hv3-f1').waitFor();await page.locator('.hv3-quick .hv3-primary').click();await page.locator('.ll-create-v01').waitFor();await snap('04-menu-rapida',true)
  await page.getByRole('button',{name:'EXPANDIR TUDO ＋',exact:true}).click();await page.getByLabel('Nome da sua escuderia').fill('Neymarzetti GP');await page.getByRole('button',{name:'AVANÇAR 🔨',exact:true}).click();await page.waitForFunction(()=>__formula1.phase==='auction');await snap('05-envelope')
  assert.equal(await page.getByText(/OVR/).count(),0,'OVR não aparece antes da compra')
  let turns=0,hadCar=false,hadReveal=false
  while(await page.evaluate(()=>__formula1.phase==='auction')){
   const a=await page.evaluate(()=>__formula1.session.auction)
   if(a.phase==='reveal'){
    if(!hadReveal){await snap('06-revelacao');hadReveal=true}
    await page.getByRole('button',{name:/^(PRÓXIMA CARTA|CONTINUAR) →$/}).click()
   }else if(a.phase==='tiebreak'){
    await snap('07-desempate');await page.getByLabel('Seu novo lance').fill(String(a.teams[0].coins-(2-a.round)));await page.getByRole('button',{name:'LACRAR DESEMPATE',exact:true}).click()
   }else{
    const own=a.teams[0],needs=a.round===2?!own.car:own.drivers.length<=a.round
    if(a.round===2&&!hadCar){await snap('08-carro');hadCar=true}
    if(needs){const input=page.getByRole('spinbutton',{name:/^Lance /}).first();await input.fill(String(Math.min(30,own.coins-(2-a.round))));await page.getByRole('button',{name:'✉️ LACRAR ENVELOPE',exact:true}).click()}
    else await page.getByRole('button',{name:'PASSAR ESTA LEVA →',exact:true}).click()
   }
   assert(++turns<250)
  }
  await snap('09-estrategia');await page.getByRole('button',{name:'🌦️ Variável',exact:true}).click();await page.getByRole('button',{name:/Apagar as luzes/}).click();await page.waitForFunction(()=>__formula1.session.race.seconds>5);await snap('10-corrida')
  await page.getByRole('button',{name:'Ⅱ Pausar corrida',exact:true}).click();const seconds=await page.evaluate(()=>__formula1.session.race.seconds);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>__formula1.session.race.seconds),seconds)
  await page.getByRole('button',{name:'Atacar',exact:true}).click();await page.getByRole('button',{name:/Macio$/}).click();await page.getByRole('button',{name:/Chamar .* para os boxes/}).click();assert.equal(await page.evaluate(()=>__formula1.session.race.cars.filter(c=>c.teamId===0&&c.pitQueued).length),1);await snap('11-boxes')
  await page.getByRole('button',{name:'Cancelar parada agendada',exact:true}).click();await page.getByRole('button',{name:/Chamar .* para os boxes/}).click()
  await page.getByLabel('Velocidade da transmissão').selectOption('4');await page.getByRole('button',{name:'▶ Retomar corrida',exact:true}).click();await page.waitForFunction(()=>__formula1.session.race.cars.some(c=>c.teamId===0&&c.pitRemaining>0));await page.getByRole('button',{name:'Ⅱ Pausar corrida',exact:true}).click();assert(await page.getByRole('button',{name:/Macio$/}).isDisabled())
  await page.getByRole('button',{name:'▶ Retomar corrida',exact:true}).click()
  if(width===390){await page.waitForFunction(()=>__formula1.phase==='results',null,{timeout:120000});await snap('12-resultado')}
  // Voltar à home pausa a corrida e permite usar o seletor comum sem perder a escuderia.
  await page.getByRole('button',{name:'🏠 Voltar ao início',exact:true}).click();await page.locator('.hv3-f1').waitFor();assert(await page.getByRole('button',{name:'CONTINUAR · Neymarzetti GP',exact:true}).count())
  await page.getByRole('button',{name:'⚽ FUTEBOL',exact:true}).click();await page.locator('.home-v03:not(.hv3-f1):not(.hv3-bb)').waitFor();await page.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).click();await page.getByRole('button',{name:'CONTINUAR · Neymarzetti GP',exact:true}).click();await page.waitForFunction(()=>__formula1.phase==='race'||__formula1.phase==='results');assert(await page.evaluate(()=>__formula1.paused))
  await page.evaluate(()=>qaSetUser(null));await page.waitForFunction(()=>!document.querySelector('.hv3-f1,.f1-shell,.f1-race-shell'));assert.equal(await page.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).count(),0);assert.deepEqual(errors,[])
  report.push({width,turns,errors,selectors,private:true,sharedHome:true,sharedQuickMenu:true,auction:true,pause:true,pit:true,finished:width===390});await context.close()
 }
 writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report))
}catch(e){if(page&&!page.isClosed()){await page.screenshot({path:out+'/falha.png'}).catch(()=>{});writeFileSync(out+'/falha.txt',await page.locator('body').innerText().catch(()=>e.message))}throw e}finally{await browser.close();await vite.close()}
