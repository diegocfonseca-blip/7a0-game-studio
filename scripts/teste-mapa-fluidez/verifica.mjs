import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const phase=process.env.FLOW_PHASE??'depois',base=phase==='antes'?'http://127.0.0.1:4203':'http://127.0.0.1:4201',out='/workspace/shared/mapa-carregamento-fluidez-20261114/'+phase,report={cases:[],errors:[]}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
try{for(const[name,width,height,level,touch]of [['desktop-padrao',1440,1000,'padrao',false],['celular-leve',390,844,'leve',true]]){
 const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce',isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2.5:1})
 await c.addInitScript(level=>{localStorage.setItem('pc3-qualidade-v1',level);Object.defineProperty(navigator,'deviceMemory',{get:()=>8})},level)
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>report.errors.push({name,error:e.message}))
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-fluidez/index.html',{waitUntil:'domcontentloaded'})
 await p.locator('.pc3-loading').waitFor();await p.locator('.pc3-stage').screenshot({path:`${out}/${name}-carregando.png`,timeout:90000})
 await p.waitForFunction(()=>!!window.qaProfile?.api);await p.waitForFunction(()=>{const q=window.qaProfile;return q.api&&performance.now()-q.ready.at(-1).at>1200})
 await p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).click();await p.evaluate(()=>window.qaProfile.api.seekCirculation(80));await p.locator('.pc3-stage').screenshot({path:`${out}/${name}-pronto.png`,timeout:90000})
 const result=await p.evaluate(()=>{const q=window.qaProfile,s=q.api.inspect(),list=window.qaScene?window.qaRenderer.renderLists.get(window.qaScene,0):null,groups={};for(const item of list?[...list.opaque,...list.transparent,...list.transmissive]:[]){let n=item.object;while(n.parent&&n.parent!==window.qaScene)n=n.parent;const key=n.name||n.type;groups[key]=(groups[key]??0)+1}return{renderGroups:groups,probes:q.probes,ready:q.ready.map(r=>({at:r.at,active:r.active,info:r.info})),longTasks:q.longTasks,loading:q.loading,drawCalls:s.drawCalls,triangles:s.triangles,frameStats:s.frameStats,startup:s.startup,softwareGPU:s.softwareGPU,quality:s.quality}})
 if(phase==='depois'){
  assert(result.loading.length>0);assert(result.loading.every(e=>e.buttons.length===0),'Sem atalhos no carregamento normal');assert(result.loading.some(e=>/PREPARANDO SEU MAPA/.test(e.text)),'Aviso novo aparece antes da carga')
  assert(result.probes.every(e=>e.worldPasses===0),'Sem desenhar a cidade inteira para reflexos no Padrão/Leve');assert.equal(await p.locator('.pc3-loading').count(),0)
  await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Meu clube'}).first().click();await p.getByRole('button',{name:'Gestão · finanças e contratos',exact:true}).click();await p.getByRole('button',{name:'Finanças do clube',exact:true}).click();assert.equal(await p.evaluate(()=>window.qaDestination),'financas')
  await p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).click();await p.evaluate(()=>window.qaProfile.api.zoom(1));await p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).click()
  // Fora da tela/painel aberto, o laço gráfico para sem alterar o estado da carreira.
  await p.evaluate(()=>document.body.classList.add('clube-mapa-gestao-aberta'));await p.waitForTimeout(250);const frames=await p.evaluate(()=>window.qaProfile.api.inspect().frameStats.frames);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>window.qaProfile.api.inspect().frameStats.frames),frames,'Painel cobre mapa: não continua desenhando');await p.evaluate(()=>document.body.classList.remove('clube-mapa-gestao-aberta'))
  // Saída e volta não deixam um segundo canvas ou controle preso.
  await p.locator('[data-qa-toggle]').click();assert.equal(await p.locator('canvas').count(),0);assert.equal(await p.evaluate(()=>window.qaProfile.api),null)
 }
 report.cases.push({name,...result});console.log('Conferido',phase,name,JSON.stringify({probes:result.probes,ready:result.ready.map(r=>({active:r.active,ms:r.info?.startup?.readyMs})),drawCalls:result.drawCalls,triangles:result.triangles}));await c.close()
}assert.deepEqual(report.errors,[])}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
