const assert=require('node:assert/strict'),fs=require('node:fs');
const{loadDependency,browserOptions}=require('./presidencia-runtime.cjs');
const origin=process.env.PRESIDENCIA_QA_ORIGIN||'http://127.0.0.1:4196',base='/7a0-game-studio/';
const output='test-results/avatar-original-20261016/lifecycle.json';
const deadline=(promise,ms=15000)=>Promise.race([promise,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Tempo esgotado aguardando requisição controlada.')),ms);timer.unref()})]);
(async()=>{
 fs.mkdirSync('test-results/avatar-original-20261016',{recursive:true});
 const browser=await loadDependency('playwright').chromium.launch(browserOptions()),report={runtime:[],errors:[],events:[]};
 let page;
 try{
  const freshPage=async()=>{
  if(page){await page.evaluate(()=>window.life?.rig.dispose());await page.close();}
  page=await browser.newPage({viewport:{width:1100,height:1600},locale:'pt-BR'});page.setDefaultTimeout(60000);
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await page.goto(origin+base+'qa-presidencia-avatar-original.html');
  await page.waitForFunction(()=>window.avatarQa);
  await page.evaluate(async base=>{
   const THREE=await import(base+'node_modules/three/build/three.module.js');
   const {criarPresidenteComplexo}=await import(base+'src/escalacao/presidencia-presidente-3d.ts');
   const {complexoDoEstadio,PLANTA_COMPLEXO}=await import(base+'src/escalacao/presidencia-complexo-model.ts');
   const {STADIUM_SECTORS}=await import(base+'src/escalacao/estadiodata.ts');
   const {VESTUARIO_MODULAR}=await import(base+'src/escalacao/presidente-vestuario-modular.ts');
   const {planoPresidenteOriginal}=await import(base+'src/escalacao/presidente-textura-original.ts');
   const full=complexoDoEstadio({inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[]});
   const bare=complexoDoEstadio({inv:{},ext:[]}),scene=new THREE.Scene(),changes=[];
   const rig=criarPresidenteComplexo(scene,full,{onChange:status=>changes.push(status)});
   const president=(outfit='terno')=>({version:5,name:'Presidente original local',outfit,appearance:{version:22,hair:'classic-hair',beard:'classic-beard',skinTone:'medium',accessories:[]}});
   const wallet=ids=>({cash:1000,revision:1,owned:ids.map(id=>({id,paid:20}))});
   const check=(value,message)=>{if(!value)throw Error(message)};
   const watch=()=>{
    const records=[];
    rig.root.traverse(node=>{if(node.isMesh){
     for(const [kind,resource] of [['geometry',node.geometry],['material',node.material],['texture',node.material.map]]){
      const record={kind,count:0};resource.addEventListener('dispose',()=>record.count++);records.push(record);
     }
     records.push({kind:'canvas',canvas:node.material.map.image});
    }});
    return()=>records.map(record=>record.kind==='canvas'?{kind:'canvas',width:record.canvas.width,height:record.canvas.height}:{kind:record.kind,count:record.count});
   };
   window.life={THREE,criarPresidenteComplexo,full,bare,scene,rig,changes,president,wallet,check,watch,VESTUARIO_MODULAR,planoPresidenteOriginal,PLANTA_COMPLEXO};
  },base);
  };
  await freshPage();
  report.runtime=await page.evaluate(async()=>{
   const l=window.life,rows=[];
   for(const outfit of l.VESTUARIO_MODULAR)for(const seated of [false,true]){
    const p=l.president(outfit.id),w=l.wallet(seated?['mesa-madeira','cadeira-couro','tapete']:[]),source=JSON.stringify([p,w]);
    l.check(l.rig.update(p,w),'troca de roupa/pose aceita');
    l.check(l.rig.inspect().status==='loading'&&!l.rig.root.visible,'não exibe personagem antigo durante carga');
    l.check(await l.rig.whenReady(),'composição ficou pronta');
    const info=l.rig.inspect(),mesh=l.rig.root.children[0],expected=l.planoPresidenteOriginal(p,seated?'seated':'standing');
    l.check(info.status==='ready'&&info.source==='original-art','arte original pronta');
    l.check(info.president.outfit===outfit.id&&info.president.seated===seated,'roupa/pose preservada');
    l.check(JSON.stringify(info.layerIds)===JSON.stringify(expected.map(x=>x.id)),'IDs canônicos');
    l.check(JSON.stringify(info.sources)===JSON.stringify(expected.map(x=>x.src)),'arquivos canônicos');
    l.check(info.textureSize[0]===1024&&info.textureSize[1]===1536,'textura nativa do rig');
    l.check(mesh.material.depthTest&&mesh.material.depthWrite&&mesh.material.side===l.THREE.FrontSide&&!mesh.material.toneMapped,'profundidade/face/cor preservadas');
    l.check(mesh.material.shadowSide===l.THREE.DoubleSide,'sombra da arte recortada funciona para luz frontal sem desenhar verso na câmera');
    l.check(mesh.material.map.name==='presidente-arte-original'&&mesh.material.map.colorSpace===l.THREE.SRGBColorSpace,'textura original sRGB');
    l.check(info.meshes===1&&info.triangles===2&&info.facialFeatures===false,'nenhum boneco procedural ou rosto adicionado');
    const bounds=new l.THREE.Box3().setFromObject(l.rig.root),footError=Math.abs(bounds.min.y-info.president.floor);
    l.check(footError<1e-6,'base do personagem deve tocar o piso');
    l.check(info.anchor.rigFoot===info.baseBounds.bottom,'âncora usa a sola da roupa selecionada');
    l.check(bounds.max.y<l.PLANTA_COMPLEXO.presidentBox.ceiling,'personagem dentro da sala');
    l.check(JSON.stringify([p,w])===source,'fontes imutáveis');
    l.check(l.rig.update(p,w)===false,'atualização idêntica não remonta textura');
    rows.push({outfit:outfit.id,seated,footError,sources:info.sources,anchor:info.anchor});
   }
   return rows;
  });
  assert.equal(report.runtime.length,66);console.log('PASS 66 composições reais: arquivos, roupa/pose, profundidade, sRGB, sola, ausência de rosto e fonte intacta.');
  report.ownership=await page.evaluate(async()=>{
   const l=window.life,p=l.president('astronauta'),rows=[];
   for(const ids of [[],['mesa-simples'],['cadeira-simples'],['mesa-simples','cadeira-simples'],['mesa-simples']]){
    l.rig.update(p,l.wallet(ids));await l.rig.whenReady();const info=l.rig.inspect();
    l.check(info.president.outfit==='astronauta','revenda não troca roupa');
    l.check(info.president.seated===(ids.length===2),'senta somente com mesa e cadeira');
    l.check(l.scene.children.length===1,'um único personagem na cena');rows.push({ids,seated:info.president.seated});
   }
   const tracked=l.watch();l.rig.update(l.president('polo'),l.wallet([]));await l.rig.whenReady();
   return {rows,replacedResources:tracked()};
  });
  for(const item of report.ownership.replacedResources)assert.deepEqual(item,item.kind==='canvas'?{kind:'canvas',width:0,height:0}:{kind:item.kind,count:1});
  console.log('PASS compra/revenda preserva roupa; recursos substituídos descartados uma vez.');
  // Chromium may reuse already decoded Image objects even with routed HTTP.
  // Network failure/cancellation must therefore start with a fresh document.
  await freshPage();
  // Hold a real request so the previous outfit cannot finish before the switch.
  const heldPattern='**/presidente-v206/magico-em-pe.webp';let heldRoute,hit;
  const reached=new Promise(resolve=>hit=resolve);
  await page.route(heldPattern,route=>{heldRoute=route;hit();});
  await page.evaluate(()=>{const l=window.life;l.rig.update(l.president('magico'),l.wallet([]));l.stale=l.rig.whenReady();});
  await deadline(reached);
  report.stale=await page.evaluate(async()=>{
   const l=window.life;l.rig.update(l.president('polo'),l.wallet([]));const ready=await l.rig.whenReady(),old=await l.stale;
   return {ready,old,info:l.rig.inspect(),changes:[...l.changes]};
  });
  await heldRoute.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync('public/presidente-v206/magico-em-pe.webp')}).catch(()=>{});
  await page.unroute(heldPattern);await page.waitForTimeout(100);
  assert.equal(report.stale.ready,true);assert.equal(report.stale.old,false);assert.equal(report.stale.info.president.outfit,'polo');
  assert.equal(await page.evaluate(()=>window.life.rig.inspect().president.outfit),'polo');
  console.log('PASS troca rápida cancela carga anterior; resposta antiga não substitui o novo personagem.');
  const failedPattern='**/presidente-v199/astronauta-em-pe.webp';
  await page.route(failedPattern,route=>route.abort('failed'));
  report.failed=await page.evaluate(async()=>{
   const l=window.life;l.rig.update(l.president('astronauta'),l.wallet([]));const ready=await l.rig.whenReady();return {ready,info:l.rig.inspect(),visible:l.rig.root.visible};
  });
  assert.equal(report.failed.ready,false);assert.equal(report.failed.info.status,'error');assert.equal(report.failed.visible,false);
  assert.equal(report.failed.info.president.outfit,'astronauta');assert.equal(report.failed.info.meshes,0);assert.deepEqual(report.failed.info.sources,[]);
  await page.unroute(failedPattern);
  report.retry=await page.evaluate(async()=>{const l=window.life;return {accepted:l.rig.retry(),ready:await l.rig.whenReady(),info:l.rig.inspect()};});
  assert.equal(report.retry.accepted,true);assert.equal(report.retry.ready,true);assert.equal(report.retry.info.president.outfit,'astronauta');
  console.log('PASS falha de imagem não desenha substituto; retry recupera a mesma escolha.');
  report.invalid=await page.evaluate(async()=>{
   const l=window.life,rows=[];
   for(const [p,w] of [[undefined,l.wallet([])],[{...l.president(),outfit:'inexistente'},l.wallet([])],[{...l.president(),name:'   '},l.wallet([])],[l.president(),null],[l.president(),{cash:-1,revision:1,owned:[]}]]){
    l.rig.update(p,w);await l.rig.whenReady();const info=l.rig.inspect();l.check(info.status==='empty'&&info.president===null&&info.meshes===0&&!l.rig.root.visible,'entrada inválida deve limpar');rows.push(info.status);
   }
   return rows;
  });
  report.availability=await page.evaluate(async()=>{
   const l=window.life,scene=new l.THREE.Scene(),world=l.criarPresidenteComplexo(scene,l.bare),office=l.criarPresidenteComplexo(scene,l.bare,{interior:true}),invalid=l.criarPresidenteComplexo(scene,{...l.bare,valid:false},{interior:true});
   for(const rig of [world,office,invalid]){rig.update(l.president(),l.wallet([]));await rig.whenReady();}
   const result={world:world.inspect(),office:office.inspect(),invalid:invalid.inspect()};world.dispose();office.dispose();invalid.dispose();l.check(scene.children.length===0,'todos os roots removidos');return result;
  });
  assert.equal(report.availability.world.available,false);assert.equal(report.availability.world.status,'empty');
  assert.equal(report.availability.office.available,true);assert.equal(report.availability.office.status,'ready');
  assert.equal(report.availability.invalid.available,false);assert.equal(report.availability.invalid.status,'empty');
  console.log('PASS entradas inválidas limpas; sala inicial disponível sem conceder camarote no mapa.');
  report.disposal=await page.evaluate(async()=>{
   const l=window.life;l.rig.update(l.president(),l.wallet([]));await l.rig.whenReady();const tracked=l.watch(),calls=l.changes.length;
   l.rig.dispose();l.rig.dispose();const changed=l.rig.update(l.president('polo'),l.wallet([]));
   return {resources:tracked(),sceneChildren:l.scene.children.length,changed,retry:l.rig.retry(),status:l.rig.inspect().status,notificationsAfterDispose:l.changes.length-calls};
  });
  assert.equal(report.disposal.sceneChildren,0);assert.equal(report.disposal.changed,false);assert.equal(report.disposal.retry,false);assert.equal(report.disposal.status,'empty');assert.equal(report.disposal.notificationsAfterDispose,0);
  for(const item of report.disposal.resources)assert.deepEqual(item,item.kind==='canvas'?{kind:'canvas',width:0,height:0}:{kind:item.kind,count:1});
  await freshPage();
  let pendingRoute,pendingHit;const pendingReached=new Promise(resolve=>pendingHit=resolve);
  await page.route(heldPattern,route=>{pendingRoute=route;pendingHit();});
  await page.evaluate(()=>{const l=window.life;l.rig.update(l.president('magico'),l.wallet([]));l.inFlight=l.rig.whenReady();});
  await deadline(pendingReached);
  report.pendingDisposal=await page.evaluate(async()=>{const l=window.life,count=l.changes.length;l.rig.dispose();l.rig.dispose();return {ready:await l.inFlight,sceneChildren:l.scene.children.length,notifications:l.changes.length-count,info:l.rig.inspect()};});
  await pendingRoute.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync('public/presidente-v206/magico-em-pe.webp')}).catch(()=>{});
  await page.unroute(heldPattern);
  assert.equal(report.pendingDisposal.ready,false);assert.equal(report.pendingDisposal.sceneChildren,0);assert.equal(report.pendingDisposal.notifications,0);assert.equal(report.pendingDisposal.info.meshes,0);assert.equal(report.pendingDisposal.info.status,'empty');
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(output,JSON.stringify(report,null,2));
  console.log('PASS dispose idempotente: geometria/material/textura uma vez, canvas liberado, carga pendente cancelada e nenhuma notificação tardia.');
 }catch(error){fs.writeFileSync(output,JSON.stringify({...report,failure:String(error)},null,2));throw error}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
