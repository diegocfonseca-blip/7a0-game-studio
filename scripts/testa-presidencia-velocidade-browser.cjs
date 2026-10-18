const assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{
 const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4196/')?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-velocidade.html');
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  const value=async(id,expected)=>page.waitForFunction(({id,expected})=>document.querySelector('#'+id).textContent===expected,{id,expected:String(expected)});
  assert.equal(await page.locator('fieldset').count(),0);
  await click('Abrir estádio');await value('watching',true);await value('speed',.25);await value('calls',1);
  // Both rates are freely selectable. Manual choices survive updates/rounds.
  await click('0,5× · Lento');await value('speed',.5);await click('Nova rodada');await value('calls',2);await value('speed',.5);
  await click('1× · Normal');await value('speed',1);
  await click('Ritmo anterior (4×)');await value('speed',4);
  await click('0,25× · Bem lento');await value('speed',.25);
  await click('Sair do estádio');await value('watching',false);await value('speed',.25);
  assert.equal(await page.locator('fieldset').count(),0);
  await click('Simulação 2×');await value('speed',2);
  await click('Abrir estádio');await value('speed',.25);
  await click('1× · Normal');await value('speed',1);
  // Hidden PlacarQueEncolhe ancestors do not hold the match in viewing mode.
  await click('Ocultar ancestral');await value('watching',false);await value('speed',1);
  await click('Simulação 2×');await value('speed',2);
  await click('Nova rodada');await value('speed',2);
  await click('Mostrar ancestral');await value('watching',true);await value('speed',.25);
  // Mounting under a hidden ancestor is not a field entry until shown.
  await click('Sair do estádio');await click('Ocultar ancestral');await click('Simulação 2×');
  await click('Abrir estádio');await value('watching',false);await value('speed',2);
  await click('Mostrar ancestral');await value('watching',true);await value('speed',.25);
  // Gate disabled: never change source speed or expose these local controls.
  await click('Sair do estádio');await click('Desligar prévia');await click('Simulação 2×');await click('Abrir estádio');
  await value('speed',2);assert.equal(await page.locator('fieldset').count(),0);
  // Authentication can finish after a view is already mounted. Regranting
  // permission must initialize its rate without relying on a new DOM entry.
  await click('Ligar prévia');await value('speed',.25);
  await click('1× · Normal');await click('Nova rodada');await value('speed',1);
  await click('Desligar prévia');await click('Simulação 2×');await value('speed',2);
  await click('Ligar prévia');await value('speed',.25);
  assert.deepEqual(errors,[]);
  console.log('PASS: entrada0.25, duas lentas/normal livres, escolhas preservadas nas rodadas/saída, ancestral oculto sem observador, gateoff sem alterar ritmo e grant tardio com inicialização única.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
