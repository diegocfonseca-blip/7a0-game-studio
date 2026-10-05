const {chromium}=require('C:/Users/diego/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-setup-integrado.html');
 const rows=await page.evaluate(async()=>{
  const {VESTUARIO_MODULAR}=await import('/7a0-game-studio/src/escalacao/presidente-vestuario-modular.ts');
  const {arteSentada,camadasNaPose,podeSentarPresidente}=await import('/7a0-game-studio/src/escalacao/presidente-pose.ts');
  return Promise.all(VESTUARIO_MODULAR.map(async outfit=>{
   const expected=arteSentada(outfit.id),image=new Image();image.src='/7a0-game-studio/'+expected;await image.decode();
   const base={id:outfit.id,kind:'base',outfit:outfit.id,src:'future-version/standing.webp'};
   const layers=[base],standing=camadasNaPose(layers,'standing'),seated=camadasNaPose(layers,'seated');
   return {id:outfit.id,expected,actual:seated[0].src,standingUnchanged:standing===layers,sourceUnchanged:base.src==='future-version/standing.webp',width:image.naturalWidth,height:image.naturalHeight,
    deskOnly:podeSentarPresidente(outfit.id,[{id:'mesa-simples'}]),chairOnly:podeSentarPresidente(outfit.id,[{id:'cadeira-couro'}]),both:podeSentarPresidente(outfit.id,[{id:'mesa-madeira'},{id:'cadeira-couro'}])};
  }));
 });
 assert.equal(rows.length,33);assert.equal(new Set(rows.map(r=>r.expected)).size,33);
 for(const row of rows){assert.equal(row.actual,row.expected,row.id);assert.ok(row.standingUnchanged&&row.sourceUnchanged,row.id);assert.ok(row.width>0&&row.height>0,row.id);assert.equal(row.deskOnly,false);assert.equal(row.chairOnly,false);assert.equal(row.both,true)}
 console.log('PASS v172: all33 seated sprites decode, outfit lookup independent of standing asset location, immutable layers, desk AND chair required. Local only.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
