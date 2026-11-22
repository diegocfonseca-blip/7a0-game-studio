import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const output=process.env.FOCO_OUTPUT??'test-results/mapa-foco'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.PRESIDENCIA_BROWSER_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
const reports=[]
try{
 for(const width of (process.env.FOCO_WIDTHS?process.env.FOCO_WIDTHS.split(',').map(Number):[390,1280])){
  const context=await browser.newContext({viewport:{width,height:900},locale:'pt-BR',isMobile:width===390,hasTouch:width===390,deviceScaleFactor:width===390?2:1})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{localStorage.setItem('pc3-qualidade-v1','leve');localStorage.setItem('bl_lang','pt')})
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4235/')||r.request().url().startsWith('data:')?r.continue():r.abort())
  await page.goto('http://127.0.0.1:4235/7a0-game-studio/qa-mapa-foco.html')
  await page.waitForFunction(()=>window.focoApi,{timeout:90000})
  assert.equal(await page.evaluate(()=>window.focoApi.inspect().focus.locked),false)
  await page.evaluate(()=>window.focoCase('playing'))
  await page.waitForFunction(()=>window.focoApi?.inspect().focus.locked&&window.focoApi.inspect().match.detail,{timeout:90000})
  await page.waitForTimeout(500)
  const capture=()=>page.evaluate(()=>{const a=window.focoApi.inspect(),{scene}=window.focoApi.qaCena();return{focus:a.focus,camera:a.matchCamera,view:a.view,triangles:a.triangles,calls:a.drawCalls,players:a.match.players,avatar:a.match.detail?.style,cityVisible:scene.getObjectByName('complexo-entorno').visible,fan:a.fanZone}})
  const playing=await capture();assert(playing.focus.locked);assert(!playing.cityVisible);assert.equal(playing.players,22)
  assert.equal(await page.getByRole('button',{name:/^(Ver cidade|View city)$/}).count(),0)
  assert.equal(await page.locator('select option[value="free"]').count(),0)
  await page.evaluate(()=>{window.focoApi.view('region');window.focoApi.openPlace('shopping');window.focoApi.setMatchCamera('free');for(let i=0;i<30;i++)window.focoApi.zoom(-1)})
  await page.waitForTimeout(150)
  const afterZoom=await capture();assert.equal(afterZoom.view,'field');assert.notEqual(afterZoom.camera.mode,'free');assert(afterZoom.camera.fixedZoom<=1)
  await page.locator('canvas').dispatchEvent('wheel',{deltaY:900,deltaMode:0,bubbles:true})
  await page.waitForTimeout(100);assert.notEqual((await capture()).camera.mode,'free')
  await page.getByRole('button',{name:/Passear|Walk/}).click()
  await page.waitForFunction(()=>window.focoApi.inspect().fanZone.fase==='escolhendo')
  assert.equal(await page.getByText('Entrar no estádio',{exact:true}).count(),0)
  assert.equal(await page.getByText('↩ Voltar pra rua',{exact:true}).count(),0)
  await page.getByRole('button',{name:/Sentar e assistir|Sit and watch/}).click()
  await page.waitForFunction(()=>window.focoApi.inspect().fanZone.fase==='sentado')
  await page.screenshot({path:`${output}/sentado-${width}.png`})
  await page.getByRole('button',{name:/Trocar de assento|Change seat/}).click()
  await page.waitForFunction(()=>window.focoApi.inspect().fanZone.fase==='escolhendo')
  await page.getByRole('button',{name:/Voltar à transmissão|Back to broadcast/}).click()
  await page.waitForFunction(()=>window.focoApi.inspect().fanZone.fase==='fora')
  assert((await capture()).focus.locked)
  await page.evaluate(()=>window.focoCase('paused'));await page.waitForTimeout(100);assert((await capture()).focus.locked)
  await page.evaluate(()=>window.focoCase('finished'));await page.waitForTimeout(200);assert((await capture()).focus.locked)
  const finished=await capture();assert(!finished.cityVisible)
  await page.screenshot({path:`${output}/partida-${width}.png`})
  await page.evaluate(()=>window.focoCase('week'));await page.waitForFunction(()=>!window.focoApi.inspect().focus.locked)
  await page.getByRole('button',{name:/^(Ver cidade|View city)$/}).click();await page.waitForTimeout(300)
  const week=await capture();assert(week.cityVisible);assert.equal(week.view,'region')
  await page.screenshot({path:`${output}/semana-${width}.png`})
  if(width===390){
   await page.evaluate(()=>{window.focoOldApi=window.focoApi;window.focoCase('paused');window.focoSeats(false)});
   await page.waitForFunction(()=>window.focoApi&&window.focoApi!==window.focoOldApi&&document.querySelector('[data-map-ready="true"]'),{timeout:90000});
   await page.getByRole('button',{name:/Passear|Walk/}).click();
   await page.waitForFunction(()=>window.focoApi.inspect().fanZone.fase==='fora');
   await page.getByRole('status').filter({hasText:/Não há assento|No seat/}).waitFor({state:'visible'});
   assert(await page.evaluate(()=>window.focoApi.inspect().focus.locked));
  }
  assert.deepEqual(errors,[])
  reports.push({width,playing,afterZoom,finished,week,errors})
  await context.close()
 }
 writeFileSync(`${output}/report.json`,JSON.stringify({success:true,reports},null,2))
 console.log(JSON.stringify({success:true,reports:reports.map(r=>({width:r.width,triangles:r.playing.triangles,calls:r.playing.calls,weekUnlocked:!r.week.focus.locked,errors:r.errors}))},null,2))
}finally{await browser.close()}
