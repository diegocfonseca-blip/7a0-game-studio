import {chromium} from 'playwright-core'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import assert from 'node:assert/strict'
const base='http://127.0.0.1:4201',out='/workspace/shared/clube-organizacao-20261115';mkdirSync(out,{recursive:true})
const seed=JSON.parse(readFileSync('/workspace/shared/auditoria-carreira-neymarzetti-20261108/estado-pos-leilao-t13.json','utf8')),id=seed.managers[seed.youIdx].id
seed.managers[seed.youIdx].name='Técnico local';seed.managers[seed.youIdx].teamName='Clube de teste'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});const report={checks:[],errors:[]}
try{for(const [device,width,height,other]of [['celular',390,900,false],['desktop',1440,1000,false],['outra-conta',390,900,true]]){
 const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'});await c.addInitScript(seed=>{window.__mapSeed=seed;localStorage.setItem('pc3-qualidade-v1','leve');localStorage.setItem('bl_lang','pt')},seed)
 await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(150000);p.on('pageerror',e=>{report.errors.push({device,error:e.message});console.log('Erro',e.message)})
 await p.addLocatorHandler(p.getByRole('dialog',{name:'Comemoração do título',exact:true}).last(),()=>p.mouse.click(8,8),{noWaitAfter:true});await p.addLocatorHandler(p.getByRole('dialog',{name:'Carta do campeão',exact:true}).last(),()=>p.mouse.click(8,8),{noWaitAfter:true})
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-clube-20261113/index.html?mode=carreira'+(other?'&other=1&free=1':''),{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.mapState);await p.getByRole('button',{name:'Clube',exact:true}).last().click();console.log('Clube',device)

 await p.locator('.clube-organizacao').waitFor();await p.getByRole('button',{name:/^Locais/}).waitFor();await p.waitForTimeout(300);await p.evaluate(()=>{window.qaCanvas=document.querySelector('canvas')});const original=await p.evaluate(()=>JSON.stringify(window.mapState)),side=p.locator('.clube-organizacao-acessos')
 for(const title of ['Meu clube','Meus negócios','Minha vida'])await side.getByRole('heading',{name:title,exact:true}).waitFor()
 assert.equal(await p.locator('.cv2-heading-balance').count(),0,'Caixa aparece uma única vez no novo Clube');assert.equal(await p.getByRole('button',{name:'Mapa do clube',exact:true}).count(),0);assert.equal(await p.getByText('Aparece uma vez por temporada, e só. Nada pra fazer aqui — é só pra você saber que ela existe.',{exact:true}).count(),0)
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 await p.screenshot({path:out+'/'+device+'-clube.png',fullPage:true});console.log('Mapa pronto',device)
 for(const [name,title]of [['Finanças','Finanças do clube'],['Estádio e obras','Estrutura e obras'],['Patrocínios','Patrocínios do clube'],['Minha agência',null],['SAF e 2º clube','SAF e segundo clube'],['Casa e garagem','Casa e garagem'],['Museu do clube','Museu do clube'],['Loja da torcida','Loja da torcida']]){
  await side.getByRole('button',{name:new RegExp('^'+name.replace('º','º').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();const panel=p.getByRole('dialog').last();await panel.waitFor();if(title)assert.equal(await panel.getAttribute('aria-label'),title)
  assert.equal(await p.evaluate(()=>window.qaCanvas===document.querySelector('canvas')),true,'O mesmo mapa continua montado')
  if(name==='Finanças'){await panel.getByText(/Caixa do Clube de teste/).waitFor();await panel.screenshot({path:out+'/'+device+'-financas.png'})}
  if(name==='Estádio e obras'){
   assert.equal(await panel.locator('.ll-est-box').count(),0,'Obras não duplica o estádio');await panel.getByRole('button',{name:'Setores',exact:true}).click();const completed=panel.locator('.clube-obras-concluidas').first();await completed.waitFor();assert.equal(await completed.getAttribute('open'),null);await completed.locator('summary').click();assert(await completed.getAttribute('open')!==null);await panel.screenshot({path:out+'/'+device+'-obras.png'})
  }
  if(name==='SAF e 2º clube')assert.equal(await panel.locator('.ll-est-box').count(),0)
  await p.getByRole('button',{name:'← Voltar ao mapa',exact:true}).click();await panel.waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>window.qaCanvas===document.querySelector('canvas')),true)
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(window.mapState)),original,'Navegar não altera o save')
 if(device==='celular'){
  await side.getByRole('button',{name:/^Estádio e obras/}).click();const works=p.getByRole('dialog',{name:'Estrutura e obras',exact:true});await works.getByRole('button',{name:'Setores',exact:true}).click();const card=works.locator('.clube-obras-grid>div').filter({hasText:'Camarote'});const before=await p.evaluate(id=>({coins:window.mapState.careerCoins[id],invested:window.mapState.stadiums[id].inv.camarote}),id);await card.getByRole('button',{name:/^Investir/}).click();await p.waitForFunction(({id,before})=>window.mapState.careerCoins[id]===before.coins-20,{id,before});assert.equal(await p.evaluate(id=>window.mapState.stadiums[id].inv.camarote,id),before.invested+20);await p.getByRole('button',{name:'← Voltar ao mapa',exact:true}).click();report.checks.push({device,purchaseCost:20,investmentPreserved:true});console.log('Compra local conferida')
 }
 if(device==='celular'){await p.setViewportSize({width:320,height:800});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:out+'/celular-320.png',fullPage:true})}
 report.checks.push({device,groups:true,panels:8,completedCollapsed:true,sameCanvas:true,saveUnchanged:true,noOverflow:true});await c.close();console.log('PASS',device)
}assert.deepEqual(report.errors,[])}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
