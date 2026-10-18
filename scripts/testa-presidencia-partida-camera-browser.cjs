const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin='http://127.0.0.1:4196',base=origin+'/7a0-game-studio/',output='test-results/campo-enquadramento';
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report=[];
 try{
  const context=await browser.newContext();await context.routeWebSocket('**/*',socket=>socket.close());
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await context.route('**/src/escalacao/presidente-acesso.ts*',route=>route.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>true;export const presidentPreviewEnabled=()=>true;export const presidentWritesEnabled=()=>true;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
  // Geometry/layout regression only. The main real-game suite covers WebGL.
  await context.route('**/src/escalacao/presidencia-futebol-3d.tsx*',route=>route.fulfill({contentType:'text/javascript',body:'export default function Futebol3D(){return null}'}));
  for(const [name,width,height] of [['celular',390,844],['desktop',1400,1000],['celular-alto',350,1700]])for(const [stage,index] of [['varzea',0],['completo',5]]){
   const page=await context.newPage();await page.setViewportSize({width,height});await page.addInitScript(()=>localStorage.setItem('bl_lang','pt'));await page.goto(base+'qa-presidencia-revisao-motor-20261015.html');await page.waitForFunction(()=>!!window.renderReviewScore);
   await page.evaluate(async index=>{const context={id:'fit-'+index,speed:.25,home:window.qaReviewTeam('h'),away:window.qaReviewTeam('a'),stadium:window.qaReviewStages[index].save};await window.renderReviewScore({homeName:'Casa',awayName:'Visitante',homeColor:'#1b7a3d',awayColor:'#c2452f',youIsHome:true,enhancedCareer:true,roundKey:901,roundMs:240000,displayMinute:20,pauseAtHalf:true,goals:[],stadiumMatch:context})},index);
   await page.locator('.pe-live summary').click();await page.locator('.pe-live-viewport').waitFor();await page.getByRole('button',{name:'VER CAMPO',exact:true}).click();
   const measure=()=>page.evaluate(async()=>{const {CAMPO_INTERNO,CAMPO_MAPA}=await import('/7a0-game-studio/src/escalacao/presidencia-partida-geometria.ts');const el=document.querySelector('.pe-live-viewport'),world=el.querySelector('.pe-live-world'),v=el.getBoundingClientRect(),w=world.getBoundingClientRect(),corners=el.dataset.fieldCamera==='internal'?CAMPO_INTERNO:CAMPO_MAPA;return{camera:el.dataset.fieldCamera,zoom:Number(el.dataset.fieldZoom),cover:w.left<=v.left+1&&w.top<=v.top+1&&w.right>=v.right-1&&w.bottom>=v.bottom-1,pitch:corners.map(([x,y])=>({x:w.left+x/1536*w.width-v.left,y:w.top+y/1024*w.height-v.top})),viewport:{width:v.width,height:v.height}}});
   const fit=await measure();assert(fit.cover);assert(fit.viewport.height<=fit.viewport.width*2.4+1);assert.equal(fit.camera,name==='desktop'&&stage==='completo'?'internal':'aerial');for(const p of fit.pitch){assert(p.x>=0&&p.x<=fit.viewport.width);assert(p.y>=0&&p.y<=fit.viewport.height)}
   await page.locator('.pe-live-viewport').screenshot({path:`${output}/${name}-${stage}-fit.png`});
   const minus=page.getByRole('button',{name:'Afastar campo',exact:true});for(let n=0;n<15&&await minus.isEnabled();n++)await minus.click();const minimum=await measure();assert(minimum.cover);assert.equal(minimum.zoom,1);
   await page.getByRole('button',{name:'VER CAMPO',exact:true}).click();const restored=await measure();assert(Math.abs(restored.zoom-fit.zoom)<1e-6);report.push({name,stage,fit,minimum});await page.close();
  }
  fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log('PASS seis vistas390/desktop/portraitextremo várzea/completo: campo inteiro comfolga, semfaixas e zoom-out limitado ao cover. WebGL separado.');await context.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
