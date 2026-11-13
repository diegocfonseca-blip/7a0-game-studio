import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const out=process.env.COMMERCE_OUT??'/workspace/shared/comercios-reforma-20261113/depois'
mkdirSync(out,{recursive:true})
const report={screens:[],checks:[],errors:[]}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']})
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'pt-BR',reducedMotion:'reduce'})
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
 await context.routeWebSocket('**/*',w=>w.close())
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(150000)
 await page.goto('http://127.0.0.1:4197/7a0-game-studio/scripts/teste-mapa-clube-20261113/index.html?mode=mapa&museumStage=4',{waitUntil:'domcontentloaded'})
 await page.waitForFunction(()=>!!window.mapApi);await page.waitForTimeout(1800)
 await page.waitForFunction(()=>window.mapApi?.inspect().museum?.stage===4)
 for(const view of['museu-clube','original']){
  await page.waitForFunction(()=>!!window.mapApi);await page.evaluate(v=>window.mapApi.view(v),view)
  await page.locator('[data-complexo-3d]').screenshot({path:`${out}/desktop-museu-concluido-${view}.png`,timeout:90000})
  assert.equal(await page.evaluate(()=>window.mapApi.inspect().museum.stage),4)
  report.screens.push('museu4 '+view)
 }
 const states=[['segunda-manha','padaria',8,8],['quinta-tarde','padaria',11,15],['sabado-manha','feira',6,9],['quarta-noite','espetinho',10,21],['quarta-noite','bar-esquina',10,21]]
 for(const [time,view,day,hour]of states){
  await page.goto(`http://127.0.0.1:4197/7a0-game-studio/scripts/teste-mapa-clube-20261113/index.html?mode=mapa&museumStage=4&day=${day}&hour=${hour}`,{waitUntil:'domcontentloaded'})
  await page.waitForFunction(()=>!!window.mapApi)
  await page.waitForFunction(period=>window.mapApi?.inspect().tradicoes.vida.periodo===period,hour<12?'manha':hour<18?'tarde':'noite')
  await page.evaluate(v=>window.mapApi.view(v),view)
  const life=await page.evaluate(()=>window.mapApi.inspect().tradicoes)
  if(view==='padaria'){
   assert.equal(life.dia.fachadaPadariaPermanente,true)
   assert.equal(life.dia.padariaFechada,time!=='segunda-manha')
   report.checks.push('Fachada preservada e porta correta: '+time)
  }
  await page.locator('[data-complexo-3d]').screenshot({path:`${out}/desktop-${view}-${time}.png`,timeout:90000})
  report.screens.push(view+' '+time);console.log(view,time)
 }
 await context.close();assert.deepEqual(report.errors,[])
 console.log('PASS horários, fachada permanente e museu:',report.screens.length)
}finally{writeFileSync(out+'/auditoria-horarios.json',JSON.stringify(report,null,2));await browser.close()}
