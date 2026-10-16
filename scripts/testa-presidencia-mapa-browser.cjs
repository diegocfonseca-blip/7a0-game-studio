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
   // Após ENQUADRAR, um único passo em tela estreita ainda pode caber nos
   // 600 px da prévia. Amplia até exigir os detalhes, independentemente do DPR.
   for(let step=0;step<2;step++)await page.getByRole('button',{name:'Aproximar mapa',exact:true}).click();
   await page.waitForFunction(()=>[...document.querySelectorAll('img[data-map-detail]')].some(i=>i.complete&&i.naturalWidth>0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${stage.name}`);
   if(index===stages.length-1)await page.screenshot({path:`test-results/mapa-browser/mapa-${width}.png`});
   await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();
  }
 }
 await page.getByRole('button',{name:'PAUSAR MOVIMENTO',exact:true}).click();
 const positions=()=>page.locator('[data-map-actor]').evaluateAll(ns=>ns.map(n=>n.style.cssText));
 const before=await positions();await page.waitForTimeout(200);assert.deepEqual(await positions(),before,'Pausa congela circulação');
 const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
 const state={context:{id:'teste-local',stadium:{inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']},home:team('home'),away:team('away')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 await page.evaluate(s=>window.renderScene(null,s),state);
 await page.locator('summary').click();await page.getByRole('button',{name:'VISTA DO ESTÁDIO',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('[data-athlete]').length===22);
 await page.waitForFunction(()=>{const i=document.querySelector('.pe-live-base');return i?.complete&&i.naturalWidth>0});
 await page.screenshot({path:'test-results/mapa-browser/partida.png'});
 const field=page.locator('.pe-live-viewport');await field.focus();
 assert.ok((await field.boundingBox()).height>=420,'Câmera da partida também ocupa área grande');
 assert.ok(await page.locator('.pe-live-world').evaluate(n=>Math.abs(n.offsetWidth/n.offsetHeight-1.5)<.01),'Campo não estica para preencher a tela');
 for(let i=0;i<9;i++)await field.press('+');
 await page.waitForFunction(()=>document.querySelector('.pe-live-world').style.transform.includes('scale(6)'));
 await page.waitForFunction(()=>{const imgs=[...document.querySelectorAll('img[data-map-detail]')];return imgs.length&&imgs.every(i=>i.complete&&i.naturalWidth>0)});
 const transformBefore=await page.locator('.pe-live-world').evaluate(n=>n.style.transform);
 await field.press('ArrowDown');
 assert.notEqual(await page.locator('.pe-live-world').evaluate(n=>n.style.transform),transformBefore,'Teclado move o campo ampliado');
 state.paused=true;await page.evaluate(s=>window.renderScene(null,s),state);
 await page.waitForTimeout(100);
 const athletePositions=()=>page.locator('[data-athlete]').evaluateAll(ns=>ns.map(n=>n.style.cssText));
 const stopped=await athletePositions();await page.waitForTimeout(200);assert.deepEqual(await athletePositions(),stopped,'Pausa congela os 22 atletas');
 const grounded=await page.locator('[data-athlete]').evaluateAll(nodes=>nodes.every(node=>{
  const rect=node.getBoundingClientRect(),world=node.parentElement.getBoundingClientRect(),style=getComputedStyle(node),shadow=getComputedStyle(node,'::before');
  const footY=rect.top+rect.height*190/192,groundY=world.top+parseFloat(node.style.top)/100*world.height;
  const shadowY=rect.bottom-(parseFloat(shadow.bottom)+parseFloat(shadow.height)/2)*rect.height/parseFloat(style.height);
  return Math.abs(footY-groundY)<.1&&Math.abs(shadowY-footY)<rect.height*.01&&style.filter==='none'&&node.querySelector('.pe-live-sprite')&&parseFloat(style.getPropertyValue('--foot-x'))>0;
 }));
 assert.ok(grounded,'Pés ancorados ao plano do campo e sombra de contato junto ao apoio, sem filtro deslocado');
 const supportMatchesArt=await page.locator('[data-athlete]').evaluateAll(nodes=>nodes.every(node=>{
  const img=node.querySelector('img');if(!img?.complete||!img.naturalWidth)return false;
  const frames=img.naturalWidth/128,column=Math.round(-parseFloat(img.style.transform.match(/-?[\d.]+/)[0])/100*frames);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,column*128,0,128,192,0,0,128,192);
  const data=ctx.getImageData(0,0,128,192).data;let bottom=-1,total=0,count=0;
  for(let y=0;y<192;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]>=40)bottom=y;
  for(let y=bottom-2;y<=bottom;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]>=100){total+=x;count++}
  return count>0&&Math.abs(total/count-parseFloat(node.style.getPropertyValue('--foot-x'))*128/100)<.5;
 }));
 assert.ok(supportMatchesArt,'Sombra acompanha o pé efetivamente desenhado no alfa de cada pose, não o centro vazio da imagem');

 await page.screenshot({path:'test-results/mapa-browser/partida-zoom.png'});
 for(let i=0;i<25;i++)await field.press('ArrowUp');
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-stand-detail]')].some(i=>i.getAttribute('href')&&i.getAttribute('opacity')==='1'));
 await page.screenshot({path:'test-results/mapa-browser/arquibancada-zoom.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 state.goal={id:'gol-local',home:true,name:'home10',minute:20,phase:'confirmed'};state.homeScore=1;
 await page.evaluate(s=>window.renderScene(null,s),state);
 await page.waitForFunction(()=>document.querySelector('.pe-live').textContent.includes('1 × 0')||document.querySelector('.pe-live').textContent.includes('1 × 0'.replace('×','x')));
 assert.ok(await page.locator('[data-ball]').evaluate(n=>Number.parseFloat(n.style.left)>70),'Gol confirmado atualiza a bola com movimento reduzido');
 const failedPage=await browser.newPage({locale:'pt-BR'});
 failedPage.on('pageerror',e=>errors.push(e.message));
 await failedPage.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')&&!r.request().url().endsWith('/estadio-partida/field-clean.webp')?r.continue():r.abort());
 await failedPage.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 await failedPage.waitForFunction(()=>!!window.renderScene);
 state.context.id='falha-imagem-local';state.context.stadium.ext.push('retratil');state.context.stadium.roofClosed=true;
 await failedPage.evaluate(s=>window.renderScene(null,s),state);
 await failedPage.locator('summary').click();await failedPage.getByRole('button',{name:'VISTA DO ESTÁDIO',exact:true}).click();
 await failedPage.waitForFunction(()=>!!document.querySelector('.pe-live-world .pe-territory'));
 assert.equal(await failedPage.locator('[data-athlete]').count(),22,'Falha na imagem mantém atletas');
 assert.equal(await failedPage.locator('[data-world-layer="retratil"]').count(),0,'Câmera interna alternativa não desenha os jogadores sobre o teto fechado');
 assert.ok(await failedPage.locator('.pe-live-viewport').evaluate(n=>Number(n.dataset.fieldZoom)<=1),'Falha reseta zoom para a vista geral');
 await failedPage.close();
 assert.deepEqual(errors,[]);
 console.log('PASS navegador: '+(process.argv.includes('--partida')?'partida isolada':'47 etapas em 320/390/900')+', zoom, pausa, 22 atletas, gol reduzido e recuperação de imagem. Fixtures locais; sem login real.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
