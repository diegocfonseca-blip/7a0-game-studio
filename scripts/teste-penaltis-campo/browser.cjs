const fs=require('node:fs'),assert=require('node:assert/strict');const{chromium}=require('playwright-core');
const base=process.env.QA_ORIGIN||'http://127.0.0.1:5340',out='test-results/penaltis-campo';fs.mkdirSync(out,{recursive:true});
const backend=`const result={data:[],error:null};const chain=new Proxy(function(){return chain},{get:(_,k)=>k==='then'?r=>Promise.resolve(r(result)):()=>chain});const user={id:'local-qa-only',email:'diego.c.fonseca@gmail.com'};export const supabase={auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>chain,rpc:async()=>result,channel:()=>chain,removeChannel(){},storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}})})}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[],report=[];try{
  const page=await browser.newPage({locale:'pt-BR',viewport:{width:1200,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/createRoot|React|Zona segura|hooks/i.test(m.text()))errors.push(m.text())});
  await page.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:backend}));
  for(const [modo,width,volta]of[['direto',1200,false],['carreira',1200,true],['carreira',393,false]].filter(c=>!process.env.QA_MOBILE_ONLY||c[1]===393)){
   await page.setViewportSize({width,height:width<700?1100:1000});
   await page.goto(base+'/7a0-game-studio/scripts/teste-penaltis-campo/index.html?modo='+modo+(volta?'&volta':'')+'&hud');
   await page.waitForFunction(()=>window.penaltisQA?.surface()?.penalties,undefined,{timeout:120000});
   console.log('Carregou',modo,width,volta);
   await page.clock.install();
   const sample=()=>page.evaluate(()=>{const s=window.penaltisQA.surface();return {players:s.players.map(p=>({name:p.name,x:p.x,z:p.z,owned:p.marker.owned,keeper:p.keeper})),ball:s.ball,penalties:s.penalties,score:s.score,narration:s.narration,done:window.penaltisQA.done()}});
   const initial=await sample();assert.equal(initial.players.length,22);assert.deepEqual(initial.penalties.score,[0,0]);
   await page.clock.runFor(15000);
   const middle=await sample();assert.equal(middle.players.filter(p=>p.owned).length,1);
   await page.clock.runFor(6500);
   await page.screenshot({path:out+'/'+modo+'-'+width+'-caminhada.png',fullPage:true});
   const walk=await sample();assert((await page.locator('.ll28-pens').innerText()).includes(walk.narration),'o quadro deve narrar a fase que o campo mostra');
   await page.evaluate(()=>window.penaltisQA.pausar(true));await page.clock.runFor(100);const freeze=await sample();
   await page.clock.runFor(2500);assert.deepEqual((await sample()).ball,freeze.ball,'pausa preserva bola');assert.deepEqual((await sample()).players,freeze.players,'pausa preserva atletas');
   await page.evaluate(()=>window.penaltisQA.montar(false));await page.clock.runFor(100);await page.evaluate(()=>window.penaltisQA.montar(true));await page.clock.runFor(300);
   assert.deepEqual((await sample()).penalties,freeze.penalties,'voltar à tela não reinicia disputa');
   await page.evaluate(()=>window.penaltisQA.pausar(false));await page.clock.runFor(4000);
   await page.screenshot({path:out+'/'+modo+'-'+width+'-batida.png',fullPage:true});
   const primeira=await sample();assert.equal(await page.locator('.ll28-kicks .made,.ll28-kicks .missed').count(),1,'uma cobrança revelada no campo e no cartão');
   assert.deepEqual(primeira.score,initial.score,'placar regulamentar não muda');
   assert((await page.locator('.ll28-pens').innerText()).includes(primeira.narration),'resultado e frase do campo sincronizados');
   assert((await page.locator('.pc3-scoreboard').innerText()).includes('PÊN '+primeira.penalties.score.join('–')),'placar do mapa acompanha a primeira cobrança');
   assert((await page.locator('canvas').first().locator('..').innerText()).includes('PÊN '+primeira.penalties.score.join('–')),'selo do campo acompanha a primeira cobrança');
   assert.equal(primeira.done,false,'não libera a fase na primeira cobrança');
   await page.evaluate(()=>window.penaltisQA.speed(4));
   for(let i=0;i<8;i++){await page.clock.runFor(10000);if((await sample()).done)break}
   const final=await sample();assert(final.done,'última cobrança libera próxima fase');assert.deepEqual(final.penalties.score,volta?[2,4]:[4,2]);
   assert.deepEqual(final.score,initial.score);assert.equal(await page.locator('.ll28-kicks .made').count(),6);
   assert(await page.locator('.ll28-pens').innerText().then(s=>s.includes('ENCERRADO')));
   await page.screenshot({path:out+'/'+modo+'-'+width+'-fim.png',fullPage:true});
   report.push({modo,width,volta,initial,walk,primeira,final});console.log('PASS',modo,width,'placar e sequência preservados');
   await page.clock.resume();
  }
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(out+(process.env.QA_MOBILE_ONLY?'/report-mobile.json':'/report.json'),JSON.stringify({errors,report},null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
