import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const output=process.env.PERF_OUTPUT??'/workspace/shared/fluidez-partida-20261120',label=process.env.PERF_LABEL??'antes',origin=process.env.PERF_ORIGIN??'http://127.0.0.1:4247',span=Number(process.env.PERF_SECONDS??25)
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'pt-BR'}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve');localStorage.setItem('esc-sim-manual','1');window.perfLong=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.perfLong.push(e.duration)}).observe({type:'longtask',buffered:true})})
await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
const state=()=>page.evaluate(()=>{const i=window.__mapaApi.inspect(),m=window.qaMatch;return{round:window.qaState.round,minute:m?.minute,score:m?[m.homeScore,m.awayScore]:null,players:i.match.players,detail:i.match.detail?{full:i.match.detail.full,intermediate:i.match.detail.intermediate,far:i.match.detail.far,hidden:i.match.detail.hidden,actors:i.match.detail.actors,contactSubsteps:i.match.detail.football?.contactSubsteps}:null,focus:i.focus,quality:i.quality,render:i.frameStats,calls:i.drawCalls,triangles:i.triangles,softwareGPU:i.softwareGPU}})
try{
 await page.goto(origin+'/7a0-game-studio/scripts/teste-partida-oficial-3d/?round=10',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.qaState,null,{timeout:90000});console.log('Carreira carregada')
 const choice=page.getByRole('button',{name:'🏟️ Campo 3D',exact:true}),skip=page.getByRole('button',{name:/Pular pro jogo/i})
 for(let n=0;n<30&&!await choice.count();n++){if(await skip.count())await skip.first().click();await page.waitForTimeout(500)}
 await choice.click();await page.getByRole('button',{name:'▶ Começar o jogo',exact:true}).waitFor({state:'visible',timeout:180000});
 await page.waitForFunction(()=>window.__mapaApi?.inspect().match.detail?.actors===22,null,{timeout:120000});
 await page.evaluate(()=>window.qaDispatch({type:'SET_SIM_SPEED',speed:1}));await page.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click();
 await page.waitForFunction(()=>window.qaMatch?.minute>0&&window.__mapaApi?.inspect().match.detail?.actors===22,null,{timeout:120000});console.log('Partida iniciada')
 if(process.env.PERF_CPU_ONLY==='1'){await page.evaluate(()=>window.__mapaApi.qaCena().scene.visible=false);console.log('Medição de CPU isolada: desenho WebGL suspenso apenas na bancada')}
 const before=await state(),cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
 await page.evaluate(()=>{window.perfLong=[];window.perfGaps=[];let prev=performance.now();window.perfOn=true;const tick=t=>{if(!window.perfOn)return;window.perfGaps.push(t-prev);prev=t;requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 const m0=await cdp.send('Performance.getMetrics');await cdp.send('Profiler.start');const start=Date.now();await page.waitForTimeout(span*1000);const {profile}=await cdp.send('Profiler.stop'),elapsed=(Date.now()-start)/1000,m1=await cdp.send('Performance.getMetrics');
 const after=await state(),timing=await page.evaluate(()=>{window.perfOn=false;return{long:window.perfLong,gaps:window.perfGaps}})
 const sums=new Map(),nodes=new Map(profile.nodes.map(n=>[n.id,n]));let total=0;
 for(let i=0;i<(profile.samples?.length??0);i++){const node=nodes.get(profile.samples[i]),dt=profile.timeDeltas[i]??0,f=node.callFrame,key=`${f.functionName||'(anônimo)'} ${f.url.replace(origin,'')}:${f.lineNumber+1}`;sums.set(key,(sums.get(key)??0)+dt);total+=dt}
 const top=[...sums].sort((a,b)=>b[1]-a[1]).slice(0,45).map(([fn,us])=>({fn,ms:Math.round(us/1000),pct:Math.round(us/total*1000)/10}));const metrics=Object.fromEntries(m1.metrics.map(x=>[x.name,x.value]));for(const x of m0.metrics)if(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].includes(x.name))metrics[x.name]-=x.value;
 const report={label,elapsed,before,after,renderedFps:(after.render.frames-before.render.frames)/elapsed,metrics,longTasks:{count:timing.long.length,totalMs:timing.long.reduce((a,b)=>a+b,0),maxMs:Math.max(0,...timing.long)},top,errors}
 writeFileSync(output+'/'+label+'.cpuprofile',JSON.stringify(profile));writeFileSync(output+'/'+label+'.json',JSON.stringify(report,null,2));await page.screenshot({path:output+'/'+label+'.png'});assert.equal(after.players,22);assert(after.minute>before.minute);assert.deepEqual(errors,[]);console.log(JSON.stringify(report,null,2))
 if(process.env.PERF_COMPLETE==='1'){
  assert(await page.evaluate(()=>!window.__mapaApi.qaCena().scene.getObjectByName('complexo-entorno')),'Durante a partida o entorno oculto não é percorrido pelo renderizador')
  const expected=await page.evaluate(async()=>{const {resultadoM2}=await import('/7a0-game-studio/src/escalacao/motor2/carreira.ts');return resultadoM2(window.qaMatch.officialInput).placar})
  console.log('Aguardando o apito final da mesma partida')
  await page.waitForFunction(()=>window.qaMatch?.finished&&window.__mapaApi?.inspect().match.official?.finished,null,{timeout:240000})
  const finished=await state();assert.deepEqual(finished.score,expected);assert.equal(finished.players,22)
  await page.screenshot({path:output+'/'+label+'-apito.png'})
  const skipInterview=page.getByRole('button',{name:/Pular a coletiva/i})
  if(await skipInterview.count())await skipInterview.click()
  console.log('Apito e placar conferidos; voltando para a Central')
  await page.getByRole('button',{name:'← Voltar pra Central',exact:true}).click()
  await page.evaluate(()=>window.qaDispatch({type:'SIM_MANY',count:1}))
  console.log('Dia seguinte; reabrindo a cidade')
  await page.getByRole('button',{name:'Clube',exact:true}).last().click()
  await page.waitForFunction(()=>window.__mapaApi?.qaCena().scene.getObjectByName('complexo-entorno')?.visible===true&&!window.__mapaApi.inspect().focus.locked,null,{timeout:180000})
  const restored=await page.evaluate(()=>{const a=window.__mapaApi.inspect();return{round:window.qaState.round,focus:a.focus,city:!!window.__mapaApi.qaCena().scene.getObjectByName('complexo-entorno')}})
  await page.screenshot({path:output+'/'+label+'-cidade.png'})
  assert.deepEqual(errors,[]);writeFileSync(output+'/'+label+'-regressao.json',JSON.stringify({success:true,expected,finished,restored,errors},null,2));console.log('PASS partida completa: placar original, 22 jogadores e cidade de volta')
 }
}catch(e){await page.screenshot({path:output+'/'+label+'-falha.png'});console.log('ERROS',errors,'TEXTO',(await page.locator('body').innerText()).slice(0,1800));throw e}finally{await browser.close()}
