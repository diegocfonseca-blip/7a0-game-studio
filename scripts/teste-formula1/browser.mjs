import {qaBackend} from './backend.mjs'
import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
process.env.DEPLOY_BASE='/'
const port=Number(process.env.QA_PORT??5360),out='/workspace/shared/formula1-privada-20261125';mkdirSync(out,{recursive:true})
const vite=await createServer({server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await vite.listen()
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']});let current
try{
 const report=[]
 for(const width of [390,1440,320]){
  const c=await b.newContext({viewport:{width,height:width<600?844:1000},locale:'pt-BR'}),p=current=await c.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)});p.setDefaultTimeout(90000)
  await c.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
  await c.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:qaBackend}))
  await p.goto(`http://127.0.0.1:${port}/scripts/teste-formula1/?sport=formula1`,{waitUntil:'domcontentloaded'});await p.getByTestId('football-fallback').waitFor();assert.equal(await p.locator('.f1-game').count(),0,'Visitante com URL não acessa')
  for(const email of ['visitante@example.invalid','diego.c.fonseca2@gmail.com','futpoint@example.invalid']){await p.evaluate(e=>qaSetUser(e),email);await p.waitForTimeout(100);assert.equal(await p.locator('.f1-game').count(),0);assert.equal(await p.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).count(),0)}
  await p.evaluate(()=>qaSetUser('diego.c.fonseca@gmail.com'));await p.locator('.f1-game').waitFor();await p.evaluate(()=>document.fonts.ready)
  const snap=async name=>{await p.evaluate(()=>scrollTo(0,0));await p.locator('.f1-game').screenshot({path:`${out}/${width}-${name}.png`,animations:'disabled'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: não vaza na horizontal`);console.log('SCREEN',width,name)}
  await snap('01-inicio');await p.getByLabel('NOME DA SUA ESCUDERIA').fill('Neymarzetti GP');await p.getByRole('button',{name:/Começar o leilão/}).click();await snap('02-pilotos')
  let turns=0
  while(await p.evaluate(()=>__formula1.phase==='auction')){
   if(await p.evaluate(()=>!!__formula1.session.auction.report)){await p.locator('.f1-reveal').getByRole('button').click();continue}
   const a=await p.evaluate(()=>__formula1.session.auction),card=p.locator('.f1-offers>button').first();await card.click();await p.getByLabel(/SEU ENVELOPE/).fill(String(Math.min(a.teams[0].coins-(2-a.round),30)))
   if(a.round===2)await snap('03-carros');await p.getByRole('button',{name:'Fechar envelope e revelar',exact:true}).click();assert(++turns<=12)
  }
  await snap('04-estrategia');await p.getByRole('button',{name:'🌦️ Variável',exact:true}).click();await p.getByRole('button',{name:/Apagar as luzes/}).click();await p.waitForFunction(()=>__formula1.session.race.seconds>5);await snap('05-corrida')
  const before=await p.locator('.f1-track-car').first().getAttribute('transform');await p.waitForTimeout(350);assert.notEqual(await p.locator('.f1-track-car').first().getAttribute('transform'),before,'Carros se movem')
  await p.getByRole('button',{name:'Ⅱ Pausar corrida',exact:true}).click();const t=await p.evaluate(()=>__formula1.session.race.seconds);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>__formula1.session.race.seconds),t)
  await p.getByRole('button',{name:'Atacar',exact:true}).click();await p.getByRole('button',{name:/Macio$/}).click();await p.getByRole('button',{name:/Chamar .* para os boxes/}).click();const own=await p.evaluate(()=>__formula1.session.race.cars.filter(c=>c.teamId===0));assert.equal(own.filter(c=>c.pitQueued).length,1);assert.equal(own.filter(c=>c.pace==='attack').length,1)
  await snap('06-boxes');await p.getByRole('button',{name:'Cancelar parada agendada',exact:true}).click();await p.getByRole('button',{name:/Chamar .* para os boxes/}).click();await p.getByLabel('Velocidade da transmissão').selectOption('4');await p.getByRole('button',{name:'▶ Retomar corrida',exact:true}).click()
  await p.waitForFunction(()=>__formula1.session.race.cars.some(c=>c.teamId===0&&c.pitRemaining>0));await p.getByRole('button',{name:'Ⅱ Pausar corrida',exact:true}).click();assert(await p.getByRole('button',{name:/Macio$/}).isDisabled());await snap('07-troca-pneus');await p.getByRole('button',{name:'▶ Retomar corrida',exact:true}).click();await p.waitForFunction(()=>__formula1.session.race.cars.some(c=>c.teamId===0&&c.stops>0))
  if(width===390){await p.waitForFunction(()=>__formula1.session.race.hadWet,null,{timeout:60000});await snap('08-chuva');await p.waitForFunction(()=>__formula1.phase==='results',null,{timeout:120000});await snap('09-resultado');assert.equal(await p.locator('.f1-timing>button').count(),8)}
  await p.evaluate(()=>qaSetUser('outra-conta@example.invalid'));await p.getByTestId('football-fallback').waitFor();assert.equal(await p.locator('.f1-game').count(),0,'Troca de conta fecha a prévia');assert.equal(await p.getByRole('button',{name:'🏁 FÓRMULA 1',exact:true}).count(),0)
  assert.deepEqual(errors,[]);report.push({width,turns,errors,privateGate:true,auction:true,pause:true,pit:true,finished:width===390});await c.close()
 }
 writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report))
}catch(e){if(current&&!current.isClosed()){await current.screenshot({path:out+'/falha.png'}).catch(()=>{});writeFileSync(out+'/falha.txt',await current.locator('body').innerText().catch(()=>e.message))}throw e}finally{await b.close();await vite.close()}
