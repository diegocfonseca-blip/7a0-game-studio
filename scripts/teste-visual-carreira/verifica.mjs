import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
process.env.DEPLOY_BASE='/'
const {createServer}=await import('vite'),port=Number(process.env.QA_PORT??5353),gpu=process.env.QA_GPU==='1',traditional=process.env.QA_TRAD==='1',out='/workspace/shared/visual-carreira-publico-20261125'
mkdirSync(out,{recursive:true})
const vite=await createServer({plugins:[{name:'visual-carreira-local',enforce:'pre',transform(code,id){if(traditional&&id.endsWith('/scripts/teste-travas-carreira/main.tsx'))return code.replace("rivals:3,oficial:{clube:'Flamengo'}",'rivals:3').replace("if(!seed.oficial)throw new Error('Fixture oficial não foi criada')",'').replace('_forcaBrasilOficialParaTeste(true)','_forcaBrasilOficialParaTeste(false)').replace("if(new URLSearchParams(location.search).get('serie')!=='A')","if(seed.oficial&&new URLSearchParams(location.search).get('serie')!=='A')");if(id.endsWith('/src/escalacao/pyramidseason.tsx'))return code.replace('const cabecalhoCompeticao =',`Object.assign(window,{qaAba:escolheAba,qaArea:setVisualArea,qaClube:setClubeSub,qaVisual:{subPossivel,minutoJogo,subAberto,rankScope,rankSub}});const cabecalhoCompeticao =`)}}],server:{host:'127.0.0.1',port,strictPort:true,hmr:false,watch:null}})
await vite.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio','--enable-unsafe-swiftshader']})
const report=[]
try{
for(const width of (gpu?[390]:traditional?[390]:[390,1440])){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},locale:'pt-BR'})
 await context.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close())
 await context.addInitScript(({gpu})=>{localStorage.setItem('pc3-qualidade-v1','leve');addEventListener('DOMContentLoaded',()=>document.documentElement.classList.add('noturno'));if(!gpu){const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:old.call(this,t,...a)}}},{gpu})
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.setDefaultTimeout(120000)
 await page.goto(`http://127.0.0.1:${port}/scripts/teste-travas-carreira/?round=${gpu?0:10}&speed=.25`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.qaVisual)
 const dismiss=async()=>{for(let i=0;i<8;i++){const b=page.getByRole('button',{name:/^(Entendi, ver depois|ENTENDI!)$/i}).first();if(await b.isVisible())await b.click();else break}}
 const capture=async(name,selector)=>{await page.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);if(selector)await page.locator(selector).screenshot({path:`${out}/${traditional?'tradicional-':''}${width}-${name}.png`});else await page.screenshot({path:`${out}/${traditional?'tradicional-':''}${width}-${name}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: sem vazamento horizontal`);console.log('CAPTURE',width,name)}
 if(gpu){
  await page.evaluate(()=>qaAba('estadio'));await dismiss();await page.waitForFunction(()=>window.__mapaApi,null,{timeout:150000});await page.evaluate(()=>{__mapaApi.view('original');__mapaApi.resetView()});await page.waitForTimeout(3500)
  assert.equal(await page.getByRole('button',{name:'Patrocinadores →',exact:true}).count(),0)
  const dimensions=await page.locator('.pc3-stage').evaluate(e=>({width:e.clientWidth,height:e.clientHeight,view:e.closest('.pc3-review').dataset.mapView}));assert(dimensions.height>=500);assert(dimensions.width>=340)
  await capture('07-clube');await capture('07-mapa','.pc3-stage');const near=await page.evaluate(()=>__mapaApi.inspect());await page.getByRole('button',{name:'Ver cidade',exact:true}).click();const far=await page.evaluate(()=>__mapaApi.inspect());const distance=i=>Math.hypot(...i.camera.map((n,j)=>n-i.target[j]));assert(distance(near)<distance(far)*.85,'Visão inicial mais próxima; Ver cidade mantém a visão inteira');await page.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).click();await page.getByRole('button',{name:/^Locais/}).click();assert(await page.getByText(/Patrocinadores/).count()>0);await capture('07-locais');report.push({width,dimensions,errors})
 }else if(traditional){
  for(const [tab,name]of [['central','01-central'],['jogos','02-partida'],['elenco','04-elenco'],['mercado','05-mercado'],['ranking','06-rank']]){await page.evaluate(t=>qaAba(t),tab);await dismiss();await capture(name)}
  assert(await page.getByRole('button',{name:'Todas as séries',exact:true}).isVisible());await page.getByRole('button',{name:'Todas as séries',exact:true}).click();await page.waitForFunction(()=>qaVisual.rankScope==='all');report.push({width,traditional,errors})
 }else{
  await page.evaluate(()=>qaAba('central'));await dismiss();await capture('01-central')
  await page.evaluate(()=>qaAba('jogos'));await page.waitForFunction(()=>qaVisual.subPossivel);await capture('02-partida');assert.equal(await page.locator('.ll26-competition-status').filter({hasText:/^Bola rolando/}).count(),0)
  await page.getByRole('button',{name:/Substituir.*\d\/3/}).click();await page.waitForFunction(()=>qaVisual.subAberto);await capture('08-substituicoes');assert.equal(await page.locator('.cv2-sub-column').count(),2);assert(await page.locator('.cv2-sub-score').isVisible());assert(!await page.locator('.ll-cx-placar .ll25-score').isVisible());assert(!await page.locator('.ll-cx-lado .ll29-stage').isVisible());await page.getByRole('button',{name:/Voltar ao jogo/}).click()
  await page.getByRole('button',{name:'Classificação e outros jogos',exact:true}).click();await capture('03-tabela-jogos');assert(await page.locator('.cv2-table-stage .ll26-competition').isVisible())
  await page.evaluate(()=>qaAba('elenco'));await dismiss();await capture('04-elenco')
  await page.evaluate(()=>qaAba('mercado'));await capture('05-mercado');const club=page.locator('.ll-mk-club-head').first();if(await club.isVisible())await club.click();await page.locator('.ll-mk-tabs').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-05-lista.png`})
  await page.evaluate(()=>qaAba('ranking'));await capture('06-rank');await page.getByRole('button',{name:'Brasil todo',exact:true}).click();await page.waitForFunction(()=>qaVisual.rankScope==='all');await capture('06-brasil-todo');await page.getByRole('button',{name:'Sua série',exact:true}).click();await page.waitForFunction(()=>qaVisual.rankScope==='mine')
  report.push({width,errors})
 }
 assert.deepEqual(errors,[]);await context.close()
}
writeFileSync(out+`/resultado-${gpu?'mapa':traditional?'tradicional':'telas'}.json`,JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report))
}finally{await browser.close();await vite.close()}
