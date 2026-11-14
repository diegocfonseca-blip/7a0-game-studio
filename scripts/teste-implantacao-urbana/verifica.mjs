import assert from 'node:assert/strict'
import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
const out=process.env.URBAN_QA_OUT??'/workspace/shared/implantacao-urbana-20261114/depois'
mkdirSync(out,{recursive:true})
const report={screens:[],checks:[],errors:[]},origin='http://127.0.0.1:4197'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']})
try{
 for(const [device,width,height] of [['desktop',1440,1000],['celular',390,844],['estreito',320,740]]){
  const context=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'})
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close())
  const page=await context.newPage();page.setDefaultTimeout(150000);page.on('pageerror',e=>report.errors.push({device,message:e.message}))
  await page.goto(origin+'/7a0-game-studio/scripts/teste-implantacao-urbana/index.html',{waitUntil:'domcontentloaded'})
  await page.waitForFunction(()=>!!window.urbanApi);await page.evaluate(()=>document.fonts.ready)
  const inspect=async()=>{const handle=await page.waitForFunction(()=>{if(!window.urbanApi)return false;const s=window.urbanApi.inspect();return{circulation:s.circulation?.problems,transport:s.transport?.problems,museum:s.museum,parking:s.state.parking,roads:s.roads,casaLuca:!!s.casaLuca,vehicles:s.transport?.vehicles.map(v=>({id:v.id,rigId:v.rigId,kind:v.kind,markers:v.markers})),camera:s.camera,target:s.target,viewport:s.viewport,drawCalls:s.drawCalls,triangles:s.triangles}});try{return await handle.jsonValue()}finally{await handle.dispose()}}
  const check=async(label)=>{await page.waitForFunction(()=>!!window.urbanApi);const s=await inspect();assert.deepEqual(s.circulation,[],label+': circulação');assert.deepEqual(s.transport,[],label+': transporte');assert.deepEqual(s.museum?.overlappingSolids,[],label+': museu');assert(s.casaLuca,label+': Casa Luca');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem lateral');report.checks.push({device,label,...s});return s}
  const first=await check('abertura');console.log(device,'abertura conferida')
  const views=device==='desktop'?['original','casa-luca','loja','museu-clube','estacionamento','shopping','agencia-clube','hotel','chopp','praca','tidex','dsouza','oittolabs','gecg']:device==='celular'?['original','casa-luca','loja','museu-clube','shopping']:['original','casa-luca','loja']
  for(const view of views){await page.waitForFunction(v=>{if(!window.urbanApi)return false;window.urbanApi.view(v);return true},view);const notice=page.getByRole('status').filter({hasText:'O mapa estava travando'});if(await notice.isVisible())await notice.getByRole('button',{name:'Fechar',exact:true}).click();const close=page.locator('.pc3-card-x').filter({visible:true});if(await close.count())await close.first().click();await page.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-${view}.png`,animations:'disabled',timeout:90000});report.screens.push({device,view});console.log(device,view)}
  if(device==='desktop'){
   for(const v of first.vehicles)for(const marker of ['doorsOpen','exitClear','atGate','boarding']){if(!Number.isFinite(v.markers[marker]))continue;await page.evaluate(t=>window.urbanApi.seekCirculation(t),v.markers[marker]+1);await check(v.kind+' '+marker);console.log('fase',v.kind,marker)}
   for(const [stage,investment] of [0,20,40,60,70].entries()){
    await page.evaluate(({stage,investment})=>{window.urbanSave({...window.urbanFull,ext:window.urbanFull.ext.filter(k=>k!=='estac').concat(stage===4?['estac']:[]),estacionamentoInvestido:investment})},{stage,investment})
    await page.waitForFunction(s=>window.urbanApi?.inspect().state.parking.stage===s,stage);const s=await check('estacionamento '+stage);assert.equal(s.parking.stage,stage)
   }
   await page.evaluate(()=>{window.urbanSave(window.urbanFull)});await page.waitForFunction(()=>window.urbanApi?.inspect().state.parking.stage===4)
   await page.evaluate(()=>window.urbanNight(true));await page.waitForTimeout(150);await check('noite');await page.evaluate(()=>window.urbanApi.view('original'));await page.locator('[data-complexo-3d]').screenshot({path:out+'/desktop-noite.png',timeout:90000});report.screens.push({device,view:'noite'})
  }
  await context.close()
 }
 assert.deepEqual(report.errors,[]);console.log('PASS',report.checks.length,'verificações e',report.screens.length,'capturas')
}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
