const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const output=process.env.PRESIDENCIA_QA_OUTPUT||'test-results/sala-unificada',origin='http://127.0.0.1:4196';
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 const report=[];let page;
 try{
  const context=await browser.newContext({viewport:{width:1200,height:900},hasTouch:true,locale:'pt-BR'});page=await context.newPage();page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR '+e.message)});
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.qaAllow!==false;export const presidentPreviewEnabled=()=>window.qaAllow!==false;export const presidentWritesEnabled=()=>window.qaAllow!==false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  if(process.argv.includes('--panel')){
   await page.route('**/src/escalacao/presidente-conta.ts*',r=>r.fulfill({contentType:'text/javascript',body:"export const presidenteContaLiberado=()=>true;export const getPlanoConta=()=>null;export const usePlanoConta=()=>null;export const usePresidenteConta=()=>({status:'pronto',email:'diego.c.fonseca@gmail.com',value:{...window.roomSource.president,name:'Presidente da conta',outfit:'polo'}});export const carregarPresidenteConta=async()=>null;export const salvarPresidenteConta=async()=>{throw Error('Teste não pode salvar conta')};"}));
   await page.route('**/src/escalacao/presidencia-complexo-3d.tsx*',async r=>{
    const response=await r.fetch(),body=await response.text(),reactImport=body.match(/from\s+["']([^"']*react[^"']*)["']/)?.[1];assert(reactImport);
    await r.fulfill({contentType:'text/javascript',body:`import React from ${JSON.stringify(reactImport)};export default function Room(props){return React.createElement('div',{'data-room-route':props.presentation,'data-president-outfit':props.president?.outfit},'Sala 3D: navegação isolada');}`});
   });
   await page.goto(origin+'/7a0-game-studio/qa-presidencia-sala-unificada.html?panel');
   await page.locator('[data-room-route="office"]').waitFor();assert.equal(await page.locator('[data-room-route]').getAttribute('data-president-outfit'),'polo');
   await page.getByRole('button',{name:'PERFIL E APARÊNCIA',exact:true}).click();await page.getByRole('button',{name:'ENTRAR NA SALA',exact:true}).click();
   for(const name of ['MOBÍLIAS','GARAGEM']){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true}).waitFor();await page.getByRole('button',{name:'VOLTAR',exact:true}).click();await page.locator('[data-room-route="office"]').waitFor()}
   await page.getByRole('button',{name:'IR AO ESTÁDIO',exact:true}).click();
   const events=await page.evaluate(()=>window.panelEvents);assert.deepEqual(events,{save:0,trade:0,display:0,back:0,stadium:1});assert.deepEqual(errors,[]);
   fs.writeFileSync(output+'/panel.json',JSON.stringify({events,errors,renderer:'stub: somente navegação; 3D validado separadamente'},null,2));console.log('PASS painel real: entrada na sala, presidente da conta, perfil, mobílias, garagem, volta e estádio, sem gravação.');return;
  }
  if(process.argv.includes('--trace-render')){
   page.on('console',m=>{if(m.text().startsWith('ROOM TRACE'))console.log(m.text())});
   await page.route('**/src/escalacao/presidencia-complexo-3d.tsx*',async r=>{
    const response=await r.fetch();let body=await response.text();
    for(const marker of ['game.update(matchRef.current, performance.now());','architecture.updateSeats(camera);','updateShadows();','lighting.update(camera, controls.target);','renderer.render(scene, camera);'])body=body.replace(marker,`console.log('ROOM TRACE before ${marker}',performance.now());${marker}console.log('ROOM TRACE after ${marker}',performance.now());`);
    await r.fulfill({response,body});
   });
  }
  if(process.argv.includes('--retry')){
   await page.goto(origin+'/7a0-game-studio/qa-presidencia-sala-unificada.html?retry&no-collection');
   await page.waitForFunction(()=>window.roomApi?.inspect().president.status==='ready'&&document.querySelector('[aria-busy="false"] canvas'));
   console.log('RETRY pronto inicialmente');
   const original=await page.evaluate(()=>{window.beforeRetryCanvas=document.querySelector('canvas');return JSON.stringify(window.roomSource)});
   await page.evaluate(()=>window.beforeRetryCanvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
   await page.getByText('Esta é a vista ilustrada de compatibilidade.',{exact:true}).waitFor();
   console.log('RETRY compatibilidade visível');
   await page.getByRole('button',{name:'TENTAR ABRIR EM 3D',exact:true}).click();
   await page.waitForFunction(()=>window.roomApi?.inspect().president.status==='ready'&&document.querySelector('[data-presentation="office"] [aria-busy="false"] canvas')&&document.querySelector('canvas')!==window.beforeRetryCanvas);
   const recovered=await page.evaluate(()=>({source:JSON.stringify(window.roomSource),stage:window.roomApi.inspect().state,pose:window.roomApi.inspect().president.president.seated}));
   assert.equal(recovered.source,original);assert.equal(recovered.pose,false);assert.equal(await page.getByText('Esta é a vista ilustrada de compatibilidade.',{exact:true}).count(),0);assert.deepEqual(errors,[]);
   fs.writeFileSync(output+'/retry.json',JSON.stringify({recovered:true,newCanvas:true,sourceUnchanged:true,errors},null,2));console.log('PASS perda WebGL→compatibilidade→retry→novo canvas3D, sem mudar fonte e sem erros.');return;
  }
  await page.goto(origin+'/7a0-game-studio/qa-presidencia-sala-unificada.html'+(process.argv.includes('--no-collection')?'?no-collection':''));
  await page.waitForFunction(()=>['ready','error'].includes(window.roomApi?.inspect().president.status)&&document.querySelector('[aria-busy="false"] canvas'));
  const inspect=()=>page.evaluate(()=>window.roomApi.inspect());
  assert.equal((await inspect()).president.status,'ready',JSON.stringify((await inspect()).president));
  console.log('READY sala');
  console.log('INSPECT inicial '+JSON.stringify(await page.evaluate(()=>{const i=window.roomApi.inspect();return{drawCalls:i.drawCalls,triangles:i.triangles,canvas:i.canvas,collection:i.collection}})));
  if(!process.argv.includes('--no-collection')){
   await page.waitForFunction(()=>window.roomApi.inspect().collection.pending.length===0);
   const collection=(await inspect()).collection;assert.equal(collection.items.length,7);assert.equal(collection.loaded.length,10);assert.deepEqual(collection.failures,[]);assert.deepEqual(collection.identity,{crest:true,shirt:true,mascot:true});report.push({collection});
  }
  for(const width of [1200,390]){
   console.log('VIEWPORT '+width);await page.setViewportSize({width,height:900});
   console.log('VIEW sala '+width);await page.evaluate(()=>window.roomApi.view('room'));await page.waitForTimeout(150);
   const state=await inspect();assert.equal(state.president.president.outfit,'terno');assert.equal(state.president.president.seated,true);assert.equal(state.president.source,'original-art');assert.equal(state.president.status,'ready');assert(state.president.sources.includes('presidente-v118/terno-sentado.webp'));
   assert.equal(state.furniture.renderedFurniture.length,10);assert.equal(state.match.players,22);
   console.log('SCREENSHOT sala '+width);await page.locator('.pc3-stage').screenshot({path:`${output}/sala-${width}.png`,timeout:30000});
   await page.evaluate(()=>window.roomApi.view('president'));await page.locator('.pc3-stage').screenshot({path:`${output}/presidente-${width}.png`});
   if(!process.argv.includes('--no-collection')){await page.evaluate(()=>window.roomApi.view('shelf'));await page.locator('.pc3-stage').screenshot({path:`${output}/estante-${width}.png`})}
   report.push({width,initial:true});console.log('PASS inicial '+width);
  }
  if(process.argv.includes('--preview'))return;
  await page.evaluate(()=>window.roomApi.view('room'));
  const cdp=await context.newCDPSession(page),touchRect=await page.locator('canvas').boundingBox(),center={x:touchRect.x+touchRect.width*.5,y:touchRect.y+touchRect.height*.5};
  const distanceBefore=(await inspect()).navigation.distance;
  const touches=gap=>[{x:center.x-gap,y:center.y,id:1},{x:center.x+gap,y:center.y,id:2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(30)});
  for(const gap of [40,55,70])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(gap)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const afterTouch=await inspect();assert(afterTouch.navigation.distance<distanceBefore,'pinça aproxima a sala');assert(afterTouch.camera.every(Number.isFinite));report.push({touch:{before:distanceBefore,after:afterTouch.navigation.distance}});
  const source=await page.evaluate(()=>JSON.stringify(window.roomSource));
  await page.evaluate(()=>{window.keepCanvas=document.querySelector('canvas');window.roomApi.zoom(1);window.roomApi.setNavigationMode('rotate')});
  const rect=await page.locator('canvas').boundingBox();await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.8,rect.y+rect.height*.5,{steps:10});await page.mouse.up();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.roomSource)),source);
  for(const stage of ['bare','partial','closed']){
   await page.evaluate(stage=>window.renderRoom({stage}),stage);await page.waitForFunction(()=>window.roomApi?.inspect().president.status==='ready'&&document.querySelector('canvas')!==window.keepCanvas);
   await page.evaluate(()=>{window.keepCanvas=document.querySelector('canvas');window.roomApi.view('office')});
   const state=await inspect();assert.equal(state.furniture.renderedFurniture.length,10);assert.equal(state.president.president.seated,true);
   if(stage==='bare'){assert.equal(state.architecture.lowerRows,0);assert.equal(state.architecture.upperRows,0);assert.equal(state.architecture.roof,false)}
   if(stage==='closed')assert.equal(state.state.roofClosed,true);
   await page.locator('.pc3-stage').screenshot({path:`${output}/janela-${stage}.png`});report.push({stage});console.log('PASS etapa '+stage);
  }
  await page.evaluate(()=>window.renderRoom({owned:[],hair:'valderrama-1988-hair',beard:'none',skin:'deep',outfit:'polo'}));
  await page.waitForFunction(()=>window.roomApi?.inspect().president.status==='ready'&&window.roomApi.inspect().president.president?.outfit==='polo');
  const empty=await inspect();assert.equal(empty.president.president.seated,false);assert.equal(empty.furniture.renderedFurniture.length,0);assert.equal(empty.president.president.skin,'deep');
  assert.equal(empty.collection.items.length,0);assert.equal(empty.collection.identity.shirt,false);assert.equal(empty.collection.identity.mascot,false);assert.equal(await page.evaluate(()=>document.querySelector('canvas')===window.keepCanvas),true,'aparência/compra não recria mundo');
  await page.evaluate(()=>window.roomApi.view('president'));await page.locator('.pc3-stage').screenshot({path:output+'/presidente-em-pe.png'});
  console.log('CHECK expansão');await page.getByRole('button',{name:'Ampliar sala',exact:true}).click();assert.equal(await page.locator('[role="dialog"]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('[role="dialog"]').count(),0);
  console.log('CHECK fallback');
  await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await page.getByText('Esta é a vista ilustrada de compatibilidade.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'TENTAR ABRIR EM 3D',exact:true}).count(),1);
  await page.evaluate(()=>{window.qaAllow=false;window.renderRoom({})});await page.waitForFunction(()=>!document.querySelector('[data-presidencia-sala-3d]'));
  assert.equal(await page.locator('.pr-scene').count(),1);
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/browser.json',JSON.stringify({report,errors,empty},null,2));console.log('PASS compras, aparência, etapas, câmera, expansão e fonte intacta');
 }catch(e){console.error(e);if(page)await page.screenshot({path:output+'/falha.png',timeout:15000}).catch(()=>{});throw e}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
