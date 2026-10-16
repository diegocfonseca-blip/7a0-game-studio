const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
(async()=>{const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-publico.html');
 await page.waitForSelector('#population');
 for(const match of ['idle','playing']){
 await page.evaluate(match=>window.renderDia({division:'A',support:100,match}),match);
 await page.waitForFunction(match=>JSON.parse(document.querySelector('#population').textContent).playing===(match==='playing'),match);
 const data=JSON.parse(await page.locator('#population').innerText());
 assert.equal(await page.locator('[data-map-actor^="fan-"]').count(),data.outside);
 assert.equal(await page.locator('[data-npc-kind="fan"]').count(),data.inside);
 assert.equal(await page.locator('[data-map-actor^="traffic-"]').count(),data.cars);
 assert.equal(await page.locator('[data-map-actor="visitor-loja"]').count(),1);
 }
 await page.waitForFunction(()=>[...document.querySelectorAll('[aria-busy]')].every(n=>n.getAttribute('aria-busy')==='false'));
 assert.equal(await page.locator('[role="alert"]').count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Freeze only the review pose, using the production trajectory function.
 const pose=await page.evaluate(()=>{const {stadium,atoresDoMapa,quadroAtor}=window.publicoFixture;const actor=atoresDoMapa(stadium,{division:'A',support:100,match:'playing'}).find(a=>a.id==='visitor-loja');for(let t=0;t<80;t+=.1){const p=quadroAtor(actor,t);if(p.visit==='inside')return p}return null});
 assert.ok(pose&&pose.hiddenFraction===1);
 fs.mkdirSync('test-results/publico',{recursive:true});await page.screenshot({path:'test-results/publico/mapa-390.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: same audience in map/window, match and idle, bounded vehicles, purchased shop, mobile layout and loaded art. Offline fixtures.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
