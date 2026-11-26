import {chromium} from 'playwright-core'
import {createServer} from 'vite'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const tradicional=process.env.CAREER_TRADITIONAL==='1'
const out=tradicional?'/workspace/shared/paridade-carreiras-20261125/lesao-tradicional':'/workspace/shared/lesao-partida-20261125',port=Number(process.env.QA_PORT??5396);mkdirSync(out,{recursive:true})
const server=await createServer({base:'/',cacheDir:'/tmp/leilao-lesao-vite',plugins:[{name:'qa-lesao',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/escalacao/pyramidseason.tsx'))return code.replace('const calBarra = (() => {',`Object.assign(window,{qaAba:escolheAba,qaClinical:{minutoJogo,lesaoAguarda,roundReady,tab,subPossivel,dadosSub,entry:liveInput}});const calBarra = (() => {`)
}}],optimizeDeps:{entries:['scripts/teste-lesao-partida/index.html']},server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}});await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']}),report=[];let active
try{
 for(const scenario of [{width:390,noReserve:false},{width:390,noReserve:false,mode:'2d'},{width:390,noReserve:true},{width:1440,noReserve:true,keeper:true}].filter(c=>!process.env.LESOES_CASE||c.mode===process.env.LESOES_CASE)){
 const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.width===390?844:1000},locale:'pt-BR'});await context.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close());await context.addInitScript(()=>{localStorage.setItem('esc-sim-manual','1');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}})
 const p=active=await context.newPage(),errors=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message))
 const url=`http://127.0.0.1:${port}/scripts/teste-lesao-partida/?round=10&serie=A&speed=4${tradicional?'&tradicional=1':''}${scenario.noReserve?'&semreserva=1':''}${scenario.keeper?'&goleiro=1':''}${scenario.mode?'&mode='+scenario.mode:''}`
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.qaClinical,null,{timeout:120000,polling:250});await p.evaluate(()=>window.qaAba('jogos'))
 await p.waitForFunction(()=>window.qaClinical.lesaoAguarda,null,{timeout:120000,polling:200});const modal=p.getByRole('dialog',{name:/LESÃO/});await modal.waitFor()
 const before=await p.evaluate(()=>({minute:window.qaClinical.minutoJogo,round:window.qaState.round,lineups:window.qaState.careerLineup,injury:window.qaState.careerMatchInjury}));await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>window.qaClinical.minutoJogo),before.minute,'interrupção pausa relógio')
 await p.screenshot({path:`${out}/${scenario.noReserve?'dez':'reserva'}-${scenario.width}${scenario.mode?'-'+scenario.mode:''}.png`})
 if(scenario.keeper){assert.equal(await modal.getByRole('button',{name:/Continuar com um a menos/}).isEnabled(),false);await modal.locator('#lesao-keeper').selectOption({index:1})}
 if(!scenario.noReserve){await modal.locator('#lesao-reserve').selectOption({index:1});await modal.getByRole('button',{name:/Substituir por/}).click()}
 else await modal.getByRole('button',{name:/Continuar com um a menos/}).click()
 await p.waitForFunction(()=>window.qaState.careerMatchInjury?.status==='resolvida',null,{timeout:30000,polling:200});assert.equal(await modal.count(),0)
 const current=await p.evaluate(()=>({injury:window.qaState.careerMatchInjury,decisions:window.qaState.careerHalftime[0][window.qaState.round-1].aoVivo,plan:window.qaClinical.dadosSub}));assert.equal(current.decisions.filter(x=>x.injury).length,1);assert.equal(current.plan.emCampo.length,scenario.noReserve?10:11);assert(!current.plan.emCampo.some(c=>c.id===before.injury.cardId))
 if(scenario.mode==='2d'){
  await p.evaluate(()=>sessionStorage.setItem('qa-ciclo-carreira',JSON.stringify(window.qaState)));await p.goto(url+'&retomar=1');await p.waitForFunction(()=>window.qaState&&window.qaClinical,null,{timeout:120000,polling:250});await p.evaluate(()=>window.qaAba('jogos'))
  assert.equal(await p.evaluate(()=>window.qaState.careerMatchInjury.status),'resolvida');await p.locator('[data-live-replay-status]').waitFor();assert.equal(await p.evaluate(()=>window.qaClinical.subPossivel),false,'não permite reescrever decisões futuras de uma retomada')
 }
 await p.waitForFunction(()=>window.qaState.eventoTemporada?.momento==='partida',null,{timeout:120000,polling:250});assert.equal(await p.evaluate(()=>window.qaState.round),before.round);assert.deepEqual(await p.evaluate(()=>window.qaState.careerLineup),before.lineups)
 const event=await p.evaluate(()=>window.qaState.eventoTemporada);await p.evaluate(()=>sessionStorage.setItem('qa-ciclo-carreira',JSON.stringify(window.qaState)));await p.goto(url+'&retomar=1');await p.waitForFunction(()=>window.qaState&&window.qaClinical,null,{timeout:120000,polling:250});assert.deepEqual(await p.evaluate(()=>window.qaState.eventoTemporada),event);assert.equal(await p.evaluate(()=>window.qaState.careerMatchInjury.status),'encerrada')
 await p.evaluate(()=>window.qaAba('elenco'));await p.locator('[data-evento-preparo]').waitFor();assert.equal(await p.locator('[data-evento-preparo]').count(),1);assert.deepEqual(errors,[])
 report.push({...scenario,paused:true,realRemoval:true,threeSubRule:true,keeperChoice:!!scenario.keeper,pendingAfterMatch:true,pastUntouched:true,saveResume:true,errors});console.log('PASS',JSON.stringify(report.at(-1)));await context.close()
 }
 writeFileSync(out+(process.env.LESOES_CASE?'/runtime-retomada.json':'/runtime.json'),JSON.stringify(report,null,2))
}catch(e){if(active&&!active.isClosed()){writeFileSync(out+'/debug.json',JSON.stringify({error:String(e),body:await active.locator('body').innerText().catch(()=>''),qa:await active.evaluate(()=>({clinical:window.qaClinical,injury:window.qaState?.careerMatchInjury,actions:window.qaActions})).catch(()=>null)},null,2));await active.screenshot({path:out+'/debug.png',fullPage:true}).catch(()=>{})}throw e}finally{await browser.close();await server.close()}
