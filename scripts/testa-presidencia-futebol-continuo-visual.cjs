const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const humanReview=process.argv.includes('--humans');
const origin='http://127.0.0.1:4196',output=humanReview?'test-results/humanos-20261016/futebol':'test-results/futebol-continuo-20261016';
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());let page;
 const sourceFiles=['qa-presidencia-futebol-continuo-20261016.html',...['atleta-3d','humano-acabamento','personagens-instancias','bola-3d','complexo-partida','complexo-arquitetura','futebol-motor','futebol-finalizacao','lance-sequencia'].map(n=>`src/escalacao/presidencia-${n}.ts`)],hashes=()=>Object.fromEntries(sourceFiles.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 const errors=[],badAssets=[],report={kind:'Fixture local, sem autenticação, modelos e motor reais',sourceHashes:hashes(),samples:[],outcomes:[],video:null};
 try{
  const context=await browser.newContext({viewport:{width:1200,height:850},locale:'pt-BR'});page=await context.newPage();page.setDefaultTimeout(120000);
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR '+e.message)});
  page.on('console',m=>{if(m.type()==='error')console.error('BROWSER '+m.text())});
  page.on('response',r=>{if(r.status()>=400&&/\.(webp|png|jpg)(\?|$)/.test(r.url()))badAssets.push({url:r.url(),status:r.status()})});
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  console.log('LOAD fixture local');await page.goto(origin+'/7a0-game-studio/qa-presidencia-futebol-continuo-20261016.html',{waitUntil:'domcontentloaded'});console.log('DOM fixture pronto');
  await page.waitForFunction(()=>window.qaFootball?.ready()&&window.qaFootball.assets().pending===0);console.log('READY modelos reais de futebol');
  if(process.argv.includes('--smoke')){const sample=await page.evaluate(()=>window.qaFootball.inspect());assert.equal(sample.players.length,22);assert(sample.plan.shotStartMs>0);assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);console.log(JSON.stringify({preflight:true,players:sample.players.length,durationMs:sample.plan.durationMs,shotStartMs:sample.plan.shotStartMs,calls:sample.calls,triangles:sample.triangles}));return}
  async function capture(name,phase,view){
   await page.waitForFunction(()=>window.qaFootball.assets().pending===0);
   const sample=await page.evaluate(({phase,view})=>window.qaFootball.phase(phase,view),{phase,view});
   assert.equal(sample.players.length,22);assert.equal(sample.renderMatchesFrame,true);assert.equal(sample.renderedPlayersMatch,true);assert.equal(sample.ball.radius,.11);assert(sample.ball.y>=.11-1e-6);
   assert(sample.ball.surfaceRadii.every(r=>Math.abs(r-.11)<1e-7),'Superfície renderizada da bola mantém raio físico11cm');
   assert.equal(sample.player.footHeights.length,2);assert(sample.lowestBoot>=-1e-5,'Chuteiras não atravessam o campo');
   if(Math.abs(sample.player.dive??0)<.01){assert(sample.lowestBoot<1e-5,'Sola apoiada na mesma superfície do campo');assert(sample.player.height>1.4&&sample.player.height<2,'Escala adulta compatível com campo105m e bola22cm')}
   if(phase==='strike'||phase==='pass-contact')assert(Math.abs(sample.ballToBootSurface-.11)<.025,`${name}: bola não toca superfície da chuteira no impacto (${sample.ballToBootSurface})`);
   await page.locator('.stage').screenshot({path:path.join(output,name+'.png'),timeout:60000});
   report.samples.push({name,...sample});fs.writeFileSync(path.join(output,'visual-parcial.json'),JSON.stringify(report,null,2));return sample;
  }
  for(const stage of ['bare','full']){
   await page.evaluate(stage=>window.qaFootball.configure({stage,play:'assist',outcome:'goal'}),stage);
   for(const width of [1200,390]){
    await page.setViewportSize({width,height:850});
    const wide=await capture(`${stage}-${width}-estadio`,'initial','stadium');
    assert.equal(wide.architecture.roof,stage==='full');if(stage==='bare')assert.equal(wide.architecture.seats,0);
    for(const play of humanReview?['individual']:['assist','individual']){
     await page.evaluate(({stage,play})=>window.qaFootball.configure({stage,play,outcome:'goal'}),{stage,play});
     const shots=humanReview?[['carry','follow'],['strike','feet']]:play==='assist'?[['receive','feet'],['pass','action'],['strike','feet'],['impact','goal']]:[['carry','action'],['carry','feet','carry-feet'],['strike','feet']];
     if(play==='assist'&&width===390){shots.unshift(['incoming','feet']);shots.splice(3,0,['pass-contact','feet'])}
     for(const [phase,view,suffix]of shots)await capture(`${stage}-${width}-${play}-${suffix??phase}`,phase,view);
     console.log(`PASS visual ${stage}/${width}/${play}`);
    }
   }
  }
  await page.setViewportSize({width:1200,height:850});
  for(const outcome of humanReview?[]:['fora','isolou','trave','defendeu']){
   await page.evaluate(outcome=>window.qaFootball.configure({stage:'full',play:'individual',outcome}),outcome);
   const sample=await capture('full-1200-'+outcome,'impact','goal');report.outcomes.push({outcome,ball:sample.ball,phase:sample.phase});
  }
  if(process.argv.includes('--video')){
   const frames=path.join(output,'video-frames');fs.mkdirSync(frames,{recursive:true});
   await page.setViewportSize({width:960,height:600});
   const info=await page.evaluate(()=>{window.qaFootball.configure({stage:'full',play:'assist',outcome:'goal'});return window.qaFootball.inspect()});
   const fps=12,rate=1,end=info.plan.shotStartMs+125,start=Math.max(0,end-8000,info.plan.boundaries.filter(b=>b.kind==='receive').at(-1).startMs-150),count=Math.ceil((end-start)/(1000/fps*rate));
   await page.evaluate(options=>window.qaFootball.video(true,options),{fps,rate,startMs:start});
   for(let i=0;i<=count;i++){
    await page.evaluate(t=>window.qaFootball.seek(t,'follow'),Math.min(end,start+i*1000/fps*rate));
    await page.screenshot({path:path.join(frames,`frame-${String(i).padStart(4,'0')}.png`),timeout:60000});
    if(i%16===0)console.log(`VIDEO ${i}/${count}`);
   }
   const target=path.join(output,'jogada-assistida-1x.mp4');
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',path.join(frames,'frame-%04d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',target]);
   report.video={path:target,frames:count+1,fps,presentationRate:rate,startMs:start,endMs:end,kind:'Câmera de diagnóstico acompanha o finalizador: domínio, condução e chute reais; amostras, não medição de FPS de aparelho'};
  }
  assert.deepEqual(hashes(),report.sourceHashes,'Fontes congeladas durante toda a captura');assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);report.errors=errors;report.badAssets=badAssets;fs.writeFileSync(path.join(output,'visual.json'),JSON.stringify(report,null,2));
  console.log(`PASS ${report.samples.length} capturas com modelos/gramado reais, 22 atletas, bola22cm, sola e chute apoiados; ${report.outcomes.length} desfechos; erros0.`);
 }catch(e){console.error(e);fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:e.message,errors,badAssets,report},null,2));if(page)await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw e}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
