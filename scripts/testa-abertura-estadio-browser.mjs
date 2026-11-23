import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const output=process.env.ABERTURA_OUTPUT??'/workspace/shared/abertura-estadio-20261120'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
const origin=process.env.ABERTURA_ORIGIN??'http://127.0.0.1:4235',base=process.env.ABERTURA_BASE??'/7a0-game-studio/'
const reports=[]
try{
 for(const width of (process.env.ABERTURA_WIDTHS??'390,1280').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:820},locale:'pt-BR',isMobile:width===390,hasTouch:width===390})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve')})
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
  await page.goto(origin+base+'scripts/teste-inicio-carreira/?stage=central',{waitUntil:'domcontentloaded',timeout:90000})
  await page.waitForFunction(()=>window.qaState?.screen==='season',null,{timeout:90000})
  await page.waitForTimeout(800) // Aguarda a montagem e as migrações locais do save antes da escolha.
  await page.evaluate(()=>window.qaDispatch({type:'SET_MASTER',brandId:'dsouza'}))
  await page.waitForFunction(()=>!!window.qaState.careerMaster?.[window.qaState.managers[window.qaState.youIdx].id],null,{timeout:30000})
  const three=page.getByRole('button',{name:/Campo 3D/})
  await three.waitFor({state:'visible',timeout:30000})
  await page.screenshot({path:`${output}/central-${width}.png`})
  const start=page.getByRole('button',{name:'▶ Começar o jogo',exact:true})
  const enter=async attempt=>{
   await three.click()
   await page.waitForFunction(()=>window.__mapaApi?.inspect().intro?.running,null,{timeout:150000})
   assert.equal(await start.count(),0,'O início não aparece durante o giro')
   assert(await page.locator('canvas').evaluate(el=>el.inert),'Gestos e teclado não interrompem o giro')
   await page.locator('canvas').evaluate(el=>el.focus());await page.keyboard.press('ArrowRight')
   assert(await page.evaluate(()=>window.__mapaApi.inspect().intro.running))
   assert.equal(await page.evaluate(()=>window.qaState.round),0,'Escolher 3D não inicia a rodada')
   await page.waitForFunction(()=>window.__mapaApi.inspect().match.players===22,null,{timeout:90000})
   const first=await page.evaluate(()=>{const a=window.__mapaApi;return{intro:a.inspect().intro,camera:a.qaCena().camera.position.toArray(),players:a.inspect().match.players}})
   assert.equal(first.players,22,'Os XI reais aguardam o apito sem iniciar a rodada')
   // Uma conclusão de outra apresentação nunca deve liberar o botão atual.
   await page.evaluate(async base=>{const m=await import(base+'src/escalacao/controle-partida-mapa.ts');m.avisaGiroFeito('antiga')},base)
   assert.equal(await start.count(),0)
   await page.waitForFunction(()=>window.__mapaApi.inspect().matchCamera.opening?.elapsed>1000,null,{timeout:90000})
   await page.screenshot({path:`${output}/giro-${width}-${attempt}.png`})
   assert.equal(await start.count(),0)
   await start.waitFor({state:'visible',timeout:150000})
   const ready=await page.evaluate(()=>{const a=window.__mapaApi;return{intro:a.inspect().intro,camera:a.inspect().matchCamera,position:a.qaCena().camera.position.toArray(),round:window.qaState.round}})
   assert(!ready.intro.pending);assert(!ready.camera.opening);assert(!ready.camera.moving);assert(ready.camera.framing.visible);assert.equal(ready.round,0)
   await page.screenshot({path:`${output}/pronto-${width}-${attempt}.png`})
   return{first,ready}
  }
  const initial=await enter('primeiro')
  let again
  if(width===390){
   const back=page.getByRole('button',{name:'← Voltar pra Central',exact:true});await back.click();
   await three.click();await page.waitForFunction(()=>window.__mapaApi?.inspect().intro?.running,null,{timeout:120000});
   await back.click();await three.waitFor({state:'visible'});
   assert(!await page.evaluate(()=>window.__mapaApi.inspect().intro.pending),'Voltar à Central cancela a apresentação anterior');
   again=await enter('retorno')
  }
  await start.click()
  await page.waitForFunction(()=>window.qaState.round===1&&window.__mapaApi?.inspect().focus.locked,null,{timeout:120000})
  await page.waitForFunction(()=>window.__mapaApi.inspect().match.players===22,null,{timeout:120000})
  const playing=await page.evaluate(()=>{const a=window.__mapaApi.inspect();return{round:window.qaState.round,focus:a.focus,players:a.match.players}})
  assert.deepEqual(errors,[])
  reports.push({width,initial,again,playing,errors})
  console.log(JSON.stringify({width,success:true,round:playing.round,players:playing.players,errors}))
  await context.close()
 }
 writeFileSync(`${output}/browser-report.json`,JSON.stringify({success:true,reports},null,2))
}catch(error){
 const page=browser.contexts().at(-1)?.pages().at(-1)
 if(page){await page.screenshot({path:`${output}/falha.png`});console.log(JSON.stringify(await page.evaluate(()=>({round:window.qaState?.round,map:window.__mapaApi?{intro:window.__mapaApi.inspect().intro,camera:window.__mapaApi.inspect().matchCamera,players:window.__mapaApi.inspect().match.players}:null,body:document.body.innerText.slice(0,1800)}))))}
 throw error
}finally{await browser.close()}
