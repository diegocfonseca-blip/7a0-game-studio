import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const origin=process.env.PERF_ORIGIN??'http://127.0.0.1:4251',out=process.env.PERF_OUTPUT??'/workspace/shared/fluidez-3d-profunda-20261121',label=process.env.PERF_LABEL??'auditoria-antes',mode=process.env.PERF_CASE??'d'
mkdirSync(out,{recursive:true})
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
try{
 const c=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'pt-BR'}),p=await c.newPage(),errors=[]
 p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR',e.message)})
 await p.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve');localStorage.setItem('esc-sim-manual','1')})
 await p.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
 await p.goto(origin+'/7a0-game-studio/scripts/teste-partida-oficial-3d/?round=10&case='+mode,{waitUntil:'domcontentloaded',timeout:90000})
 await p.waitForFunction(()=>window.qaState,null,{timeout:90000});console.log('Carreira pronta')
 const choice=p.getByRole('button',{name:'🏟️ Campo 3D',exact:true}),skip=p.getByRole('button',{name:/Pular pro jogo/i})
 for(let n=0;n<30&&!await choice.count();n++){if(await skip.count())await skip.first().click();await p.waitForTimeout(500)}
 await choice.click();await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).waitFor({state:'visible',timeout:180000})
 await p.waitForFunction(()=>window.__mapaApi?.inspect().match.detail?.actors===22,null,{timeout:120000})
 await p.evaluate(()=>window.qaDispatch({type:'SET_SIM_SPEED',speed:1}));await p.getByRole('button',{name:'▶ Começar o jogo',exact:true}).click()
 await p.waitForFunction(()=>window.qaMatch?.minute>0,null,{timeout:120000});console.log('Jogo pronto; medindo desenho estático idêntico')
 writeFileSync(out+'/fixture-'+mode+'.json',JSON.stringify(await p.evaluate(()=>window.qaMatch)))
 const report=await p.evaluate(()=>{
  const api=window.__mapaApi,{scene,camera}=api.qaCena(),renderer=window.qaRenderer,gl=renderer.getContext(),draws=new Map()
  const census=[];for(const root of scene.children){let nodes=0,bones=0,meshes=0;root.traverse(o=>{nodes++;if(o.isBone)bones++;if(o.isMesh)meshes++});census.push({name:root.name||root.type,nodes,bones,meshes,visible:root.visible})}
  const restorers=[];scene.traverse(o=>{if(!o.isMesh&&!o.isLineSegments&&!o.isPoints)return;const original=o.onAfterRender;o.onAfterRender=function(...args){let root=o;while(root.parent&&root.parent!==scene)root=root.parent;const name=root.name||root.type,entry=draws.get(name)??{calls:0,triangles:0,vertices:0,materials:[]};entry.calls++;const g=o.geometry;entry.triangles+=(g.index?.count??g.attributes.position?.count??0)/3*(o.isInstancedMesh?o.count:1);entry.vertices+=(g.attributes.position?.count??0)*(o.isInstancedMesh?o.count:1);const m=args[4];if(m&&!entry.materials.includes(m.type))entry.materials.push(m.type);draws.set(name,entry);original?.apply(this,args)};restorers.push(()=>o.onAfterRender=original)})
  renderer.render(scene,camera);gl.finish();const byRoot=[...draws].map(([name,x])=>({name,...x}));restorers.forEach(f=>f())
  const sample=()=>{const values=[];for(let i=0;i<4;i++){const t=performance.now();renderer.render(scene,camera);gl.finish();values.push(performance.now()-t)}return{meanMs:values.reduce((a,b)=>a+b)/values.length,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,values}}
  const pixel=new Uint8Array(4);const readbackAt=performance.now();renderer.render(scene,camera);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);const readbackMs=performance.now()-readbackAt;const baseline=sample(),experiments=[]
  for(const name of byRoot.filter(x=>x.triangles>100||x.calls>2).map(x=>x.name)){
   const roots=scene.children.filter(r=>(r.name||r.type)===name),before=roots.map(r=>r.visible);roots.forEach(r=>r.visible=false);experiments.push({without:name,...sample()});roots.forEach((r,i)=>r.visible=before[i])
  }
  const baseRatio=renderer.getPixelRatio();renderer.setPixelRatio(baseRatio*.65);const fewerPixels=sample();renderer.setPixelRatio(baseRatio)
  const all=[];scene.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)all.push({material:m,visible:m.visible})}});all.forEach(x=>x.material.visible=false);const noMeshes=sample();all.forEach(x=>x.material.visible=x.visible)
  return{inspection:api.inspect(),census,byRoot,readbackMs,baseline,experiments,fewerPixels,noMeshes,renderer:{logDepth:renderer.capabilities.logarithmicDepthBuffer,antialias:gl.getContextAttributes().antialias,extensions:{timer:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')}}}
 })
 console.log('Custos estáticos medidos; comparando quadros em movimento')
 const measures=[]
 for(const phase of ['normal','sem-jogadores','sem-outros-desenhos','material-simples','sem-desenho-webgl','normal-final']){
  await p.evaluate(phase=>{
   const r=window.qaRenderer,{scene}=window.__mapaApi.qaCena();window.qaRestore?.();window.qaRestore=()=>{};
   if(phase==='sem-jogadores'){const root=scene.getObjectByName('complexo-partida');root.removeFromParent();window.qaRestore=()=>scene.add(root)}
   if(phase==='sem-outros-desenhos'){const roots=scene.children.filter(x=>!['complexo-partida','complexo-campo','campo-fundo-leve'].includes(x.name)&&!x.isLight&&x.type!=='Object3D');roots.forEach(x=>x.removeFromParent());window.qaRestore=()=>roots.forEach(x=>scene.add(x))}
   if(phase==='material-simples'){const material=scene.getObjectByName('campo-fundo-leve').material;scene.overrideMaterial=material;window.qaRestore=()=>scene.overrideMaterial=null}
   if(phase==='sem-desenho-webgl'){scene.visible=false;window.qaRestore=()=>scene.visible=true}
  },phase)
  await p.waitForTimeout(1200)
  const before=await p.evaluate(()=>({frames:window.__mapaApi.inspect().frameStats.frames,at:performance.now()}))
  await p.waitForTimeout(4000)
  const after=await p.evaluate(()=>{const a=window.__mapaApi.inspect();return{frames:a.frameStats.frames,at:performance.now(),minute:window.qaMatch.minute,calls:a.drawCalls,triangles:a.triangles,renderMs:a.frameStats.lastRenderMs}})
  measures.push({phase,fps:(after.frames-before.frames)*1000/(after.at-before.at),...after});console.log('Fase',phase,measures.at(-1))
 }
 await p.evaluate(()=>window.qaRestore?.());report.movingPhases=measures
 report.errors=errors;assert.deepEqual(errors,[])
 writeFileSync(out+'/'+label+'-'+mode+'.json',JSON.stringify(report,null,2));await p.screenshot({path:out+'/'+label+'-'+mode+'.png'})
 console.log(JSON.stringify({baseline:report.baseline,roots:report.byRoot,experiments:report.experiments,fewerPixels:report.fewerPixels,noMeshes:report.noMeshes,census:report.census.map(x=>({name:x.name,nodes:x.nodes,bones:x.bones})),renderer:report.renderer,errors}))
}finally{await b.close()}
