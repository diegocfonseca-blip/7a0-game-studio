const fs=require('node:fs'),assert=require('node:assert/strict'),{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
(async()=>{const browser=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html');await page.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js'),{carregaJogadorNovo,criarJogadorNovo}=await import('/src/escalacao/futebol3d/jogador-novo.mjs'),{prepareMapGaits,gaitTime}=await import('/src/escalacao/futebol3d/motion/map-gait.mjs'),{createMapRigSurface}=await import('/src/escalacao/futebol3d/motion/map-rig-surface.mjs'),{MapFootPlant}=await import('/src/escalacao/futebol3d/motion/map-foot-plant.mjs');
  const asset=await carregaJogadorNovo(),a=criarJogadorNovo(asset,{corpo:'#ffffff'});a.bones=new Map();a.root.traverse(b=>{if(b.isBone)a.bones.set(b.name,b)});a.surface=createMapRigSurface(a);const gaits=prepareMapGaits(asset,a,['trote','conduz','lado_e','lado_d','diag_fe','diag_fd','diag_te','diag_td','re']),cases=[];
  for(const speed of [2.5,3.5,4.5])for(const corrected of [false,true]){
   const act=a.acao('trote');act.reset().play();act.timeScale=0;act.setEffectiveWeight(1);const plant=new MapFootPlant(),slip=[],rawSlip=[];let previous=null;
   for(let i=0;i<=360;i++){
    const t=i/120,phase=t*speed/(corrected?gaits.trote.distance:2.9);act.time=corrected?gaitTime(gaits.trote,phase):(phase%1)*act.getClip().duration;
    a.holder.position.set(0,0,speed*t);a.mixer.update(0);a.holder.updateMatrixWorld(true);a.holder.position.y+=Math.max(0,.003-a.surface.floor());a.holder.updateMatrixWorld(true);
    const bones=['Left','Right'].map(s=>a.bones.get('mixamorig'+s+'ToeBase')),native=bones.map(b=>b.getWorldPosition(new T.Vector3())),bounds=a.surface.footBounds();
    if(corrected)plant.apply(a,t);const feet=bones.map(b=>b.getWorldPosition(new T.Vector3()));
    if(previous&&t>.3)for(let j=0;j<2;j++){const side=j?'right':'left';if(bounds[side].floor<.025&&previous.bounds[side].floor<.025&&Math.abs(native[j].y-previous.native[j].y)*120<.5){slip.push(Math.hypot(feet[j].x-previous.feet[j].x,feet[j].z-previous.feet[j].z)*120);rawSlip.push(Math.hypot(native[j].x-previous.native[j].x,native[j].z-previous.native[j].z)*120)}}
    previous={feet,native,bounds};
   }
   const median=v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)];cases.push({speed,corrected,samples:slip.length,medianSlip:median(slip),medianRawSlip:median(rawSlip)});act.stop();
  }
  a.dispose();return{gaits,cases};
 });
 for(const speed of [2.5,3.5,4.5]){const before=result.cases.find(c=>c.speed===speed&&!c.corrected),after=result.cases.find(c=>c.speed===speed&&c.corrected);assert(after.medianSlip<before.medianSlip*.7,'The calibrated imported gait must materially reduce actual foot slip')}
 fs.writeFileSync('test-results/fundamentos-mapa/passada-v3.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
