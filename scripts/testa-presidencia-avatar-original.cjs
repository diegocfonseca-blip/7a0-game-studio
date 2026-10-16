const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin=process.env.PRESIDENCIA_QA_ORIGIN||'http://127.0.0.1:4196';
const output='test-results/avatar-original-20261016';
const tones=['light','warm','medium','brown','deep'];
const samples=tones.flatMap(skin=>['standing','seated'].map(pose=>({id:`terno-${skin}-${pose}`,skin,pose})));
samples.push(
 {id:'polo-valderrama-sentado',outfit:'polo',pose:'seated',hair:'valderrama-1988-hair',beard:'none',skin:'deep'},
 {id:'polo-puyol-em-pe',outfit:'polo',pose:'standing',hair:'puyol-2010-hair',beard:'classic-beard',skin:'light'},
 {id:'astronauta-sem-cabelo',outfit:'astronauta',pose:'standing',hair:'none',beard:'none',skin:'warm'},
 {id:'magico-sentado',outfit:'magico',pose:'seated',hair:'none',beard:'classic-beard',skin:'brown'},
 {id:'traje-real-sentado',outfit:'traje-real',pose:'seated',hair:'classic-hair',beard:'none',skin:'medium'},
 {id:'camiseta-brincos',outfit:'camiseta-branca',pose:'standing',hair:'classic-hair',beard:'none',skin:'deep',accessories:['silver-studs']},
);
function compare(a,b){
 assert.equal(a.length,b.length);
 let visible=0,active=0,sum=0,max=0,bad=0,alphaBad=0;
 for(let i=0;i<a.length;i+=4){
  const aa=a[i+3]/255,ba=b[i+3]/255;
  if(!aa&&!ba)continue;
  active++;
  if(a[i+3]>=40||b[i+3]>=40)visible++;
  let pixel=0;
  for(let c=0;c<3;c++)pixel=Math.max(pixel,Math.abs(a[i+c]*aa-b[i+c]*ba));
  const alphaDelta=Math.abs(a[i+3]-b[i+3]);
  pixel=Math.max(pixel,alphaDelta);sum+=pixel;max=Math.max(max,pixel);
  if(pixel>12)bad++;
  if(alphaDelta>12)alphaBad++;
 }
 return {visible,active,mean:sum/Math.max(active,1),maximum:max,differentOver12:bad,differentRatio:bad/Math.max(active,1),alphaDifferentOver12:alphaBad};
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const sharp=loadDependency('sharp'),browser=await loadDependency('playwright').chromium.launch(browserOptions());
 const report={assets:[],samples:[],errors:[],consoleErrors:[]};
 try{
  const page=await browser.newPage({viewport:{width:2112,height:1600},deviceScaleFactor:1,locale:'pt-BR'});
  page.setDefaultTimeout(60000);
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await page.goto(origin+'/7a0-game-studio/qa-presidencia-avatar-original.html');
  await page.waitForFunction(()=>window.avatarQa);
  report.assets=await page.evaluate(()=>window.avatarQa.assets());
  assert.equal(report.assets.length,66,'33 roupas com arte em pé e sentada');
  for(const asset of report.assets){assert.equal(asset.width,480,asset.src);assert.equal(asset.height,720,asset.src)}
  console.log('PASS 66 artes originais: 33 roupas, em pé/sentadas, dimensões 480×720.');
  for(const sample of samples){
   const info=await page.evaluate(config=>window.avatarQa.set(config),sample);
   assert.equal(info.unchanged,true,'composição não modifica o presidente salvo');
   assert.equal(info.width,1024);assert.equal(info.height,1536);
   const [referencePng,compositionPng]=await Promise.all([
    page.locator('#reference').screenshot({omitBackground:true}),
    page.locator('#composition').screenshot({omitBackground:true}),
   ]);
   const [reference,composition]=await Promise.all([sharp(referencePng).ensureAlpha().raw().toBuffer(),sharp(compositionPng).ensureAlpha().raw().toBuffer()]);
   const metrics=compare(reference,composition);
   const entry={...sample,...info,metrics};report.samples.push(entry);
   fs.writeFileSync(path.join(output,'fidelidade.json'),JSON.stringify(report,null,2));
   console.log(sample.id+' '+JSON.stringify(metrics));
   // A composição usa as mesmas imagens e máscaras. Diferenças pequenas de
   // reamostragem CSS/Canvas ficam restritas às bordas; troca de rosto, tecido,
   // pele, cabelo ou alinhamento afeta uma área muito maior e reprova.
   assert(metrics.visible>30000,'personagem original visível');
   assert(metrics.mean<=(sample.pose==='standing'?.0001:.9),`${sample.id}: diferença média excessiva (${metrics.mean})`);
   assert(metrics.differentRatio<=(sample.pose==='standing'?0:.02),`${sample.id}: diferença visual extensa (${metrics.differentRatio})`);
   if(['terno-medium-seated','terno-deep-standing','polo-valderrama-sentado','magico-sentado','camiseta-brincos'].includes(sample.id)){
    fs.writeFileSync(path.join(output,sample.id+'-editor.png'),referencePng);
    fs.writeFileSync(path.join(output,sample.id+'-sala.png'),compositionPng);
   }
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);
  fs.writeFileSync(path.join(output,'fidelidade.json'),JSON.stringify(report,null,2));
  console.log(`PASS ${samples.length} comparações reais do editor × compositor; 5 peles, poses, cabelo, barba, acessórios e roupas especiais; fonte intacta.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
