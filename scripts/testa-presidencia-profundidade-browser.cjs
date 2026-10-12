const assert=require('node:assert/strict');
const {loadDependency}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright'),sharp=loadDependency('sharp');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000},locale:'pt-BR'});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
 await page.evaluate(()=>window.renderScene({inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['asfalto']}));
 await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));
 await page.getByRole('button',{name:'PAUSAR MOVIMENTO',exact:true}).click();
 await page.getByRole('button',{name:'VER TUDO',exact:true}).click();
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
 const actor=page.locator('[data-map-actor="fan-1"]');
 // Silhueta vermelha de diagnóstico atravessa o recorte REAL da travessa.
 // Compara pixels: não basta conferir números de z-index em contextos distintos.
 await actor.evaluate(n=>{n.querySelectorAll('img').forEach(i=>i.style.visibility='hidden');Object.assign(n.style,{left:(828/1536*100)+'%',width:(16/1536*100)+'%',height:(60/1024*100)+'%',background:'#ff0000',filter:'none',transform:'translate(-50%,-100%)'})});
 const setDepth=y=>actor.evaluate((n,y)=>{n.style.top=y/1024*100+'%';n.style.zIndex=String(y*10)},y);
 const rect=await page.locator('.pe-territory').boundingBox();
 const pixel=async()=>{const data=await sharp(await page.screenshot({clip:{x:Math.floor(rect.x+rect.width*828/1536),y:Math.floor(rect.y+rect.height*799/1024),width:1,height:1}})).raw().toBuffer();return [...data].slice(0,3)};
 await setDepth(815);assert.notDeepEqual(await pixel(),[255,0,0],'Travessa oculta quem está atrás');
 await setDepth(835);assert.deepEqual(await pixel(),[255,0,0],'NPC reaparece à frente da travessa');
 await setDepth(815);assert.notDeepEqual(await pixel(),[255,0,0],'Retorno volta a respeitar profundidade');
 // The hotel palm hides a body behind its canopy, but not one in front.
 await actor.evaluate(n=>{n.style.left=462/1536*100+'%'});
 const palmPixel=async()=>{const data=await sharp(await page.screenshot({clip:{x:Math.floor(rect.x+rect.width*462/1536),y:Math.floor(rect.y+rect.height*560/1024),width:1,height:1}})).raw().toBuffer();return [...data].slice(0,3)};
 await setDepth(570);assert.notDeepEqual(await palmPixel(),[255,0,0],'Palm canopy hides NPC behind it');
 await setDepth(590);assert.deepEqual(await palmPixel(),[255,0,0],'NPC in front of the palm remains visible');
 for(const [x,y,ground] of [[1280,727,740],[1248,736,755]]){
  await actor.evaluate((n,x)=>{n.style.left=x/1536*100+'%'},x);
  const sample=async()=>[...await sharp(await page.screenshot({clip:{x:Math.floor(rect.x+rect.width*x/1536),y:Math.floor(rect.y+rect.height*y/1024),width:1,height:1}})).raw().toBuffer()].slice(0,3);
  await setDepth(ground-5);assert.notDeepEqual(await sample(),[255,0,0],'Sidewalk palm occludes the pedestrian behind it');
  await setDepth(ground+5);assert.deepEqual(await sample(),[255,0,0],'Pedestrian in front of sidewalk palm remains visible');
 }
 // Estação ainda não comprada: não pode haver copa reaparecendo sobre o lote vazio.
 assert.equal(await page.locator('[data-world-occluder^="palmeira-estacao"]').count(),0);
 await page.evaluate(()=>window.renderScene({inv:{},ext:['estacao']}));
 await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
 assert.equal(await page.locator('[data-world-occluder^="palmeira-estacao"]').count(),2,'Station palms exist without purchasing asphalt');
 assert.equal(await page.locator('[data-world-occluder="arvore-acesso-hotel"]').count(),0);
 const stationRect=await page.locator('.pe-territory').boundingBox();
 const sentinel=await page.evaluateHandle(()=>{const n=document.createElement('div');Object.assign(n.style,{position:'absolute',width:16/1536*100+'%',height:60/1024*100+'%',background:'#ff0000',transform:'translate(-50%,-100%)'});document.querySelector('.pe-territory').append(n);return n});
 for(const [x,y,ground] of [[1302,285,302],[1329,294,311]]){
  const set=depth=>sentinel.evaluate((n,{x,depth})=>Object.assign(n.style,{left:x/1536*100+'%',top:depth/1024*100+'%',zIndex:String(depth*10)}),{x,depth});
  const sample=async()=>[...await sharp(await page.screenshot({clip:{x:Math.floor(stationRect.x+stationRect.width*x/1536),y:Math.floor(stationRect.y+stationRect.height*y/1024),width:1,height:1}})).raw().toBuffer()].slice(0,3);
  await set(ground-5);assert.notDeepEqual(await sample(),[255,0,0],'Station palm hides a pedestrian behind its trunk');
  await set(ground+5);assert.deepEqual(await sample(),[255,0,0],'Pedestrian in front of station palm remains visible');
 }
 await sentinel.evaluate(n=>n.remove());
 console.log('PASS: comparação de pixels comprova oclusão atrás e reaparecimento à frente da travessa, palmeira do hotel e palmeiras da estação/calçada; compras independentes. Fixture local.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
