const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PRESIDENCIA_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({locale:"pt-BR"}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 await page.waitForFunction(()=>!!window.renderScene);
 const stages=JSON.parse(fs.readFileSync('test-results/estadio-mapa-model.json'));
 fs.mkdirSync('test-results/mapa-browser',{recursive:true});
 for(const width of (process.argv.includes('--partida')?[]:[320,390,900])){
  await page.setViewportSize({width,height:900});
  for(const [index,stage] of stages.entries()){
   await page.evaluate(async s=>{window.renderScene(s);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))},stage.stadium);
   await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));
   assert.equal(await page.locator('[role="alert"]').count(),0,stage.name);
   const oldZoom=await page.locator('[data-map-zoom]').getAttribute('data-map-zoom');
   await page.getByRole('button',{name:'Aproximar mapa',exact:true}).click();
   await page.waitForFunction(old=>Number(document.querySelector('[data-map-zoom]').dataset.mapZoom)>Number(old),oldZoom);
   assert.ok((await page.locator('.pe-map-viewport').boundingBox()).height>=600,'Mapa ocupa área grande');
   const ratio=await page.locator('.pe-map-world').evaluate(n=>n.offsetWidth/n.offsetHeight);assert.ok(Math.abs(ratio-1.5)<.01,'Mundo mantém proporção sem esticar');
   await page.waitForFunction(()=>[...document.querySelectorAll('img[data-map-detail]')].some(i=>i.complete&&i.naturalWidth>0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${stage.name}`);
   if(index===stages.length-1)await page.screenshot({path:`test-results/mapa-browser/mapa-${width}.png`});
   await page.getByRole('button',{name:'VER TUDO',exact:true}).click();
  }
 }
 await page.getByRole('button',{name:'PAUSAR MOVIMENTO',exact:true}).click();
 const positions=()=>page.locator('[data-map-actor]').evaluateAll(ns=>ns.map(n=>n.style.cssText));
 const before=await positions();await page.waitForTimeout(200);assert.deepEqual(await positions(),before,'Pausa congela circulação');
 const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
 const state={context:{id:'teste-local',stadium:{inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']},home:team('home'),away:team('away')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 await page.evaluate(s=>window.renderScene(null,s),state);
 await page.locator('summary').click();await page.waitForFunction(()=>document.querySelectorAll('[data-athlete]').length===22);
 await page.waitForFunction(()=>{const i=document.querySelector('.pe-live-base');return i?.complete&&i.naturalWidth>0});
 await page.screenshot({path:'test-results/mapa-browser/partida.png'});
 const field=page.locator('.pe-live-viewport');await field.focus();
 for(let i=0;i<9;i++)await field.press('+');
 await page.waitForFunction(()=>document.querySelector('.pe-live-world').style.transform.includes('scale(6)'));
 await page.waitForFunction(()=>{const imgs=[...document.querySelectorAll('img[data-map-detail]')];return imgs.length&&imgs.every(i=>i.complete&&i.naturalWidth>0)});
 await field.press('ArrowDown');
 assert.ok(!await page.locator('.pe-live-world').evaluate(n=>n.style.transform.startsWith('translate(0px, 0px)')),'Teclado move o campo ampliado');
 state.paused=true;await page.evaluate(s=>window.renderScene(null,s),state);
 await page.waitForTimeout(100);
 const athletePositions=()=>page.locator('[data-athlete]').evaluateAll(ns=>ns.map(n=>n.style.cssText));
 const stopped=await athletePositions();await page.waitForTimeout(200);assert.deepEqual(await athletePositions(),stopped,'Pausa congela os 22 atletas');
 await page.screenshot({path:'test-results/mapa-browser/partida-zoom.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 state.goal={id:'gol-local',home:true,name:'home10',minute:20,phase:'confirmed'};state.homeScore=1;
 await page.evaluate(s=>window.renderScene(null,s),state);
 await page.waitForFunction(()=>document.querySelector('.pe-live').textContent.includes('1 × 0')||document.querySelector('.pe-live').textContent.includes('1 × 0'.replace('×','x')));
 assert.ok(await page.locator('[data-ball]').evaluate(n=>Number.parseFloat(n.style.left)>70),'Gol confirmado atualiza a bola com movimento reduzido');
 const failedPage=await browser.newPage({locale:'pt-BR'});
 failedPage.on('pageerror',e=>errors.push(e.message));
 await failedPage.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')&&!r.request().url().endsWith('/estadio-partida/field.webp')?r.continue():r.abort());
 await failedPage.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 await failedPage.waitForFunction(()=>!!window.renderScene);
 state.context.id='falha-imagem-local';await failedPage.evaluate(s=>window.renderScene(null,s),state);
 await failedPage.locator('summary').click();
 await failedPage.waitForFunction(()=>!!document.querySelector('.pe-live-world .pe-territory'));
 assert.equal(await failedPage.locator('[data-athlete]').count(),22,'Falha na imagem mantém atletas');
 assert.ok(await failedPage.locator('.pe-live-world').evaluate(n=>n.style.transform.includes('scale(1)')),'Falha reseta zoom para a vista geral');
 await failedPage.close();
 assert.deepEqual(errors,[]);
 console.log('PASS navegador: '+(process.argv.includes('--partida')?'partida isolada':'47 etapas em 320/390/900')+', zoom, pausa, 22 atletas, gol reduzido e recuperação de imagem. Fixtures locais; sem login real.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
