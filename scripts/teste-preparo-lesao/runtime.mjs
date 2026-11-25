import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const tradicional=process.env.CAREER_TRADITIONAL==='1'
const port=Number(process.env.QA_PORT??5394),out=tradicional?'/workspace/shared/paridade-carreiras-20261125/preparo-tradicional':'/workspace/shared/preparo-lesoes-20261125';mkdirSync(out,{recursive:true})
const server=await createServer({base:'/',cacheDir:'/tmp/leilao-preparo-vite',plugins:[{name:'qa-preparo',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/escalacao/pyramidseason.tsx'))return code.replace('const calBarra = (() => {',`Object.assign(window,{qaAba:escolheAba,qaPrepara3D:()=>preparaCampo3D('liga',String(calSn)+':'+String(round)+':l'),qaPreparo:{tab,round,condOn,copaPlaying,myXI:myXI.map(c=>c.id),gas:condGas,last:myMatch?{hg:myMatch.hg,ag:myMatch.ag,goals:myMatch.goals}:null}});const calBarra = (() => {`)
 if(id.endsWith('/src/escalacao/controle-partida-mapa.ts'))return code.replace('cameraPedida = { camera: c, giro };',`(window as any).__qaCameras??=[];(window as any).__qaCameras.push(c);cameraPedida = { camera: c, giro };`)
}}],optimizeDeps:{entries:['scripts/teste-preparo-lesao/index.html']},server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']}),report=[]
let active
try{
 for(const width of [390,1440])for(const noReserve of [false,true]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'pt-BR'});await context.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close());await context.addInitScript(()=>{localStorage.setItem('esc-sim-manual','1');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}})
  const p=active=await context.newPage();p.setDefaultTimeout(45000);const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)})
  const url=`http://127.0.0.1:${port}/scripts/teste-preparo-lesao/?round=10&serie=A&speed=.25${tradicional?'&tradicional=1':''}${noReserve?'&semreserva=1':''}`
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.qaPreparo,null,{timeout:120000,polling:250});await p.evaluate(()=>window.qaAba('central'));assert.equal(await p.evaluate(()=>window.qaState.eventoTemporada),undefined)
  const before=await p.evaluate(()=>({round:window.qaState.round,lineups:window.qaState.careerLineup,last:window.qaPreparo.last}));const result=await p.evaluate(()=>window.qaPrepara3D());assert.equal(result,false,'lesão barra abertura 3D antes de gastar escolha')
  await p.waitForFunction(()=>window.qaPreparo.tab==='elenco'&&window.qaState.eventoTemporada?.status==='pendente',null,{timeout:30000,polling:200});const notice=p.locator('[data-evento-preparo]');assert.equal(await notice.count(),1,'um aviso, sem duplicar na lateral');assert(await notice.isVisible());assert.equal(await p.evaluate(()=>window.__qaCameras?.includes('abertura')??false),false)
  const event=await p.evaluate(()=>window.qaState.eventoTemporada);assert.equal(event.tipo,'lesao');assert.equal(event.momento,'preparacao');assert(!/10 minutos|aos 10/.test(event.historia));assert.deepEqual(await p.evaluate(()=>window.qaPreparo.last),before.last,'aviso não reescreve partida já simulada')
  await p.screenshot({path:`${out}/${noReserve?'base':'reserva'}-${width}.png`});
  if(noReserve){assert.equal(event.criaOptions.length,3);const size=await p.evaluate(()=>window.qaState.managers[0].squad.length);assert.equal(size,11,'não fabrica banco ao detectar lesão');await notice.getByRole('button',{name:/Confirmar/}).click();assert.equal(await p.evaluate(()=>window.qaState.managers[0].squad.length),12)}
  else{
   // Resume a pending preparation: same absence, same last match and no second draw.
   await p.evaluate(()=>sessionStorage.setItem('qa-ciclo-carreira',JSON.stringify(window.qaState)));await p.goto(url+'&retomar=1');await p.waitForFunction(()=>window.qaPreparo,null,{timeout:120000,polling:250});assert.deepEqual(await p.evaluate(()=>window.qaState.eventoTemporada),event);assert.equal(await p.evaluate(()=>window.qaPrepara3D()),false);await p.waitForFunction(()=>window.qaPreparo.tab==='elenco');await p.locator('[data-evento-preparo]').getByRole('button',{name:/Confirmar a troca/}).click()
  }
  await p.waitForFunction(()=>window.qaState.eventoTemporada?.status==='banco');const settled=await p.evaluate(()=>({round:window.qaState.round,ids:window.qaPreparo.myXI,lineups:window.qaState.careerLineup,last:window.qaPreparo.last}));assert.equal(settled.round,before.round);assert.equal(settled.ids.length,11);assert(!settled.ids.includes(event.cardId));assert.deepEqual(settled.last,before.last)
  for(const [r,ids]of Object.entries(before.lineups[0]))if(Number(r)<before.round)assert.deepEqual(settled.lineups[0][r],ids,'passado congelado')
  await p.getByRole('button',{name:/Preparação resolvida/}).click();await p.waitForFunction(()=>window.qaPreparo.tab==='central');assert.equal(await p.evaluate(()=>window.qaPrepara3D()),true,'preparação resolvida permite nova escolha');assert.deepEqual(errors,[])
  report.push({width,noReserve,beforePresentation:true,squadNotice:true,academyByChoice:noReserve,pendingRestore:!noReserve,elevenAvailable:true,pastUnchanged:true,noAutoStart:true,errors});console.log('PASS',JSON.stringify(report.at(-1)));await context.close()
 }
 {
  const c=await browser.newContext({viewport:{width:390,height:844},locale:'pt-BR'});await c.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await c.addInitScript(()=>{localStorage.setItem('esc-sim-manual','1');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}})
  const p=active=await c.newPage();await p.goto(`http://127.0.0.1:${port}/scripts/teste-preparo-lesao/?round=10&serie=A&speed=.25&agendar=1${tradicional?'&tradicional=1':''}`);await p.waitForFunction(()=>window.qaPreparo,null,{timeout:120000,polling:250});const last=await p.evaluate(()=>window.qaPreparo.last)
  assert.equal(await p.evaluate(()=>window.qaPrepara3D()),true);await p.waitForFunction(()=>window.qaState.careerMatchInjury?.status==='programada');const injury=await p.evaluate(()=>window.qaState.careerMatchInjury)
  assert.equal(injury.round,10);assert.equal(await p.evaluate(()=>window.qaState.eventoTemporada),undefined,'não revela desfalque futuro na preparação');assert.equal(await p.evaluate(()=>window.qaPrepara3D()),true);assert.deepEqual(await p.evaluate(()=>window.qaState.careerMatchInjury),injury,'escolher outro modo não sorteia novamente');assert.deepEqual(await p.evaluate(()=>window.qaPreparo.last),last)
  report.push({naturalDuringMatchPlan:true,noPrematureInjury:true,noRedraw:true,pastUnchanged:true});console.log('PASS future medical plan');await c.close()
 }
 writeFileSync(out+'/runtime.json',JSON.stringify(report,null,2))
}catch(error){if(active&&!active.isClosed()){writeFileSync(out+'/debug.json',JSON.stringify({error:String(error),state:await active.evaluate(()=>({prep:window.qaPreparo,event:window.qaState?.eventoTemporada,actions:window.qaActions})).catch(()=>null),body:await active.locator('body').innerText().catch(()=>null)},null,2));await active.screenshot({path:out+'/debug.png',fullPage:true}).catch(()=>{})}throw error}
finally{await browser.close();await server.close()}
