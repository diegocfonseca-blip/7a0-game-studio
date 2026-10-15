const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1100,height:1000},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(/Shader Error|VALIDATE_STATUS/i.test(msg.text()))errors.push(msg.text())});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 const url='http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html';
 await page.goto(url);await page.waitForFunction(()=>!!window.renderSync);
 const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
 const full={grama:30,geral:40,cadeiras:90,visitante:120,camarote:150};
 const stages=[['varzea',{inv:{},ext:[]}],['gramado-parcial',{inv:{grama:10},ext:[]}],['primeiro-andar',{inv:{grama:30,geral:40,cadeiras:90,visitante:120},ext:['loja','asfalto']}],['completo',{inv:full,ext:['cober','loja','hotel','chopp','praca','estacao','estac','asfalto']}]];
 const state={context:{id:'stages-map-3d',home:team('h'),away:team('a'),speed:1},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 const render=()=>page.evaluate(state=>window.renderSync(state,state.context.id),state);
 fs.mkdirSync('test-results/futebol-3d',{recursive:true});
 for(const [name,stadium] of stages){
  state.context.stadium=stadium;await render();
  await page.waitForFunction(()=>document.querySelector('.pe-map .pe-football-registered')?.dataset.players==='22');
  const renderer=page.locator('.pe-map:visible .pe-football-registered'),before=await renderer.getAttribute('data-time');
  await page.waitForFunction(t=>Number(document.querySelector('.pe-map .pe-football-registered')?.dataset.time)>Number(t)+.1,before);
  assert.equal(await page.locator('.pe-map:visible [data-world-layer="cober"]').count(),name==='completo'?1:0);
  assert.equal(await page.locator('.pe-map:visible [data-world-layer="hotel:hotel"]').count(),stadium.ext.includes('hotel')?1:0);
  assert.equal(await page.locator('.pe-map:visible [data-athlete]').count(),0,'Only the 3D players are rendered');
  await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();
  await page.getByRole('button',{name:'PAUSAR MOVIMENTO',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));
  await page.locator('.pe-map:visible').screenshot({path:`test-results/futebol-3d/mapa-${name}.png`});
  if(name==='varzea'||name==='completo'){
   const world=await page.locator('.pe-map-world:visible').boundingBox();
   await page.mouse.move(world.x+768/1536*world.width,world.y+368/1024*world.height);
   await page.keyboard.down('Control');await page.mouse.wheel(0,-450);await page.keyboard.up('Control');
   await page.waitForFunction(()=>Number(document.querySelector('[data-map-zoom]').dataset.mapZoom)>3);
   await page.locator('.pe-map:visible').screenshot({path:`test-results/futebol-3d/mapa-${name}-zoom.png`});
   if(name==='completo'){
    await page.keyboard.down('Control');await page.mouse.wheel(0,-900);await page.keyboard.up('Control');
    await page.waitForFunction(()=>Number(document.querySelector('[data-map-zoom]').dataset.mapZoom)===12);
    const pixels=await page.locator('.pe-map:visible .pe-football-registered canvas').evaluate(n=>({width:n.width,css:n.getBoundingClientRect().width,height:n.height}));
    assert.ok(pixels.width<=4096&&pixels.height<=4096);
    assert.ok(pixels.width>=pixels.css-.5,'Close zoom retains a real rendered pixel per screen pixel');
    await page.locator('.pe-map:visible').screenshot({path:'test-results/futebol-3d/mapa-completo-12x.png'});
    assert.equal(await page.locator('.pe-map:visible .pe-football-registered').getAttribute('data-players'),'22');
   }
   await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();
  }
  await page.getByRole('button',{name:'RETOMAR MOVIMENTO',exact:true}).click();
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'ENQUADRAR',exact:true}).click();
 assert.ok(await page.locator('.pe-map-viewport:visible').evaluate(n=>n.clientHeight>=600));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.pe-map:visible').screenshot({path:'test-results/futebol-3d/mapa-3d-celular.png'});
 // A device without WebGL retains the match and clock, rather than a blank map.
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args)}});
 await page.reload();await page.waitForFunction(()=>!!window.renderSync);await render();
 await page.waitForFunction(()=>document.querySelectorAll('.pe-map [data-athlete]').length===22);
 assert.equal(await page.locator('.pe-map:visible .pe-football-registered').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: running 3D map from bare ground through partial grass, lower tier and full stadium; no unowned roof/business; mobile viewport and WebGL fallback.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
