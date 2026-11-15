import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const base='http://127.0.0.1:4201',out='/workspace/shared/mapa-aproximacao-suave-20261114',report={checks:[],errors:[]}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
try{for(const[device,width,height]of [['desktop',1440,1000],['celular',390,844],['estreito',320,740]]){
 const context=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'no-preference'})
 await context.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close())
 const p=await context.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>report.errors.push({device,message:e.message}))
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-navegacao/index.html',{waitUntil:'domcontentloaded'});const reset=p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true});await reset.click();await p.waitForFunction(()=>!window.navApi?.inspect().cameraTransition);await p.evaluate(()=>document.fonts.ready)
 const pose=()=>p.evaluate(()=>{const s=window.navApi.inspect();return{camera:s.camera,target:s.target,fov:s.cameraFov,nav:s.navigation.mode}})
 const initial=await pose(),save=await p.evaluate(()=>JSON.stringify(window.navStadium))
 const near=(a,b,msg)=>{for(const k of ['camera','target'])for(let i=0;i<3;i++)assert(Math.abs(a[k][i]-b[k][i])<.00001,msg);assert(Math.abs(a.fov-b.fov)<.00001,msg)}
 const shot=async name=>{await p.evaluate(()=>window.navApi.seekCirculation(80));await p.locator('.pc3-stage').screenshot({path:`${out}/${device}-${name}.png`,timeout:90000})}
 await shot('inicial')
 for(const id of (process.env.NAV_EXTRA?['hotel','feira','boteco-oswaldo']:['museu-clube','loja','agencia-clube','shopping','vadico','gecg'])){
  await reset.click();await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);const before=await pose()
  const result=await p.evaluate(async id=>{const a=window.navApi,read=()=>{const s=a.inspect();return{camera:s.camera,target:s.target,fov:s.cameraFov,active:s.cameraTransition}};a.openPlace(id);const immediate=read(),samples=[immediate];for(let i=0;i<240&&read().active;i++){await new Promise(requestAnimationFrame);samples.push(read())}return{immediate,samples}},id)
  near(result.immediate,before,'Tocar não teleporta no primeiro quadro');assert(result.immediate.active,'Animação iniciada');const last=result.samples.at(-1);assert(!last.active,'Animação termina');assert.notDeepEqual(last.camera,before.camera,'Aproxima automaticamente')
  const direction=s=>{const v=s.camera.map((x,i)=>x-s.target[i]),n=Math.hypot(...v);return v.map(x=>x/n)},d=direction(before)
  for(const s of result.samples)assert(Math.hypot(...direction(s).map((x,i)=>x-d[i]))<.0001,'Preserva o lado e inclinação do mapa')
  if(id==='museu-clube')await shot('museu-aproximado')
  await p.getByRole('button',{name:'Fechar',exact:true}).click();await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);near(await pose(),before,'Fechar retorna suavemente à vista anterior')
  report.checks.push({device,id,frames:result.samples.length,autoFocus:true,noFirstFrameJump:true,preservesAngle:true,closeReturns:true})
 }
 // A etiqueta/menu realmente chama a aproximação, além da API da bancada.
 const museum=p.locator('[data-poi="museu-clube"]');if(await museum.isVisible())await museum.click();else{await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Meu clube'}).first().click();await p.getByRole('button',{name:/^Museu do clube/}).click()}
 await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);assert.equal(await p.locator('section').first().getAttribute('data-map-view'),'museu-clube')
 await reset.click();await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);near(await pose(),initial,'Botão restaura a visão inicial')
 // Interromper com gesto/zoom cancela o voo; o mapa continua usável.
 await p.evaluate(()=>window.navApi.openPlace('shopping'));await p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).focus();await p.evaluate(()=>window.navApi.zoom(1));assert.equal(await p.evaluate(()=>window.navApi.inspect().cameraTransition),false)
 await reset.click();await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);near(await pose(),initial,'Retorno após interromper')
 await p.evaluate(()=>window.navApi.openPlace('loja'));await p.locator('canvas').focus();await p.keyboard.press('Home');await p.waitForFunction(()=>!window.navApi.inspect().cameraTransition);near(await pose(),initial,'Home restaura sem travar')
 assert.equal(await p.evaluate(()=>JSON.stringify(window.navStadium)),save);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 // Preferência por movimento reduzido: sem laço extra de animação.
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>window.navApi.openPlace('loja'));assert.equal(await p.evaluate(()=>window.navApi.inspect().cameraTransition),false);await reset.click();near(await pose(),initial,'Reduzido retorna corretamente')
 await shot('retorno');console.log('PASS',device);await context.close()
}assert.deepEqual(report.errors,[])}finally{writeFileSync(out+(process.env.NAV_EXTRA?'/verificacao-outros.json':'/verificacao.json'),JSON.stringify(report,null,2));await browser.close()}
