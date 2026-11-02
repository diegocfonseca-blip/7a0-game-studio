const assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:5327',base=process.env.QA_BASE||'/';
(async()=>{
 const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
  if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await page.goto(origin+base+'qa-presidencia-velocidade.html');
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  const value=async(id,expected)=>page.waitForFunction(({id,expected})=>document.querySelector('#'+id).textContent===expected,{id,expected:String(expected)});
  assert.equal(await page.locator('fieldset').count(),0);
  await click('Abrir estádio');await value('watching',true);await value('speed',4);await value('calls',0);
  for(const [label,speed]of [['0,25× · Bem lento',.25],['0,5× · Lento',.5],['1× · Normal',1],['2× · Rápido',2],['4× · Muito rápido',4]]){await click(label);await value('speed',speed);assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true')}
  await value('calls',5);await click('Nova rodada');await value('speed',4);await value('calls',5);
  await click('Sair do estádio');await value('watching',false);await value('speed',4);assert.equal(await page.locator('fieldset').count(),0);
  await click('Abrir estádio');await value('speed',4);await value('calls',5);
  await click('Ocultar ancestral');await value('watching',false);await click('Simulação 2×');await value('speed',2);
  await click('Mostrar ancestral');await value('watching',true);await value('speed',2);await value('calls',6);
  await click('Desligar prévia');assert.equal(await page.locator('fieldset').count(),0);await click('Ligar prévia');await value('speed',2);await value('calls',6);
  assert.deepEqual(errors,[]);
  console.log('PASS cinco velocidades; entrada/saída/rodada/ocultação/auth preservam escolha, sem despacho automático nem controles fora da prévia.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
