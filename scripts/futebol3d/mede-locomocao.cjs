const fs=require('node:fs'),{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
(async()=>{const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});
 const data=await p.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js'),{carregaJogadorNovo,criarJogadorNovo}=await import('/src/escalacao/futebol3d/jogador-novo.mjs'),asset=await carregaJogadorNovo(),actor=criarJogadorNovo(asset,{corpo:'#ffffff'}),bones={};actor.root.traverse(b=>{if(b.isBone)bones[b.name]=b});const data={};
 for(const name of ['trote','re','lado_e','lado_d','diag_fe','diag_fd','diag_te','diag_td','conduz']){const act=actor.acao(name);act.reset().play();act.setEffectiveWeight(1);const duration=act.getClip().duration,samples=[];
  for(let i=0;i<=120;i++){act.time=Math.min(duration-1e-6,i/120*duration);actor.mixer.update(0);actor.holder.updateMatrixWorld(true);samples.push({t:act.time,feet:['Left','Right'].map(s=>bones['mixamorig'+s+'ToeBase'].getWorldPosition(new T.Vector3()).toArray())})}data[name]={duration,samples};act.stop()
 }actor.dispose();return data});fs.writeFileSync('test-results/fundamentos-mapa/gait-v3.json',JSON.stringify(data));console.log(Object.keys(data));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
