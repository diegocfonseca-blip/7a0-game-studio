const{chromium}=require('C:/Users/diego/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:390,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 const url='http://127.0.0.1:4196/7a0-game-studio/qa-estadio-privado.html';
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.getByText('🌱 Gramado',{exact:true}).waitFor();
 assert.equal(await page.locator('[data-stadium-camera]').count(),0);assert.equal(await page.getByRole('button',{name:'VISÃO AÉREA',exact:true}).count(),0);
 await page.goto(url+'?private=1',{waitUntil:'domcontentloaded'});await page.locator('[data-stadium-camera="aerial"]:visible').waitFor();
 const card=page.getByText('🌱 Gramado',{exact:true}).locator('..').locator('..').locator('..');
 await card.getByRole('button',{name:/Investir/}).click();await page.waitForFunction(()=>window.stadiumFixture.stadiums[7].inv.grama===20);
 assert.equal(await page.evaluate(()=>window.stadiumFixture.careerCoins[7]),80);
 assert.equal(await page.locator('[data-stadium-camera="aerial"]:visible').getAttribute('data-grass-progress'),String(20/30));
 await card.getByRole('button',{name:/Investir/}).click();await page.waitForFunction(()=>window.stadiumFixture.stadiums[7].inv.grama===30);
 assert.equal(await page.evaluate(()=>window.stadiumFixture.careerCoins[7]),70);assert.equal(await page.locator('[data-stadium-camera="aerial"]:visible').getAttribute('data-grass-progress'),'1');
 await page.getByRole('button',{name:'VISÃO AÉREA',exact:true}).click();assert.equal(await page.getByRole('dialog').locator('[data-grass-progress="1"]').count(),1);
 await page.keyboard.press('Escape');assert.deepEqual(errors,[]);console.log('PASS stadium tab v94: default rendering unchanged; private aerial replaces drawing; actual UI investments20+10, cash100->70, images follow real save, enlarged view shares100%. Network isolated.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
