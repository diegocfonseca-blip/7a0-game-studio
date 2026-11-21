import {chromium} from 'playwright-core'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import assert from 'node:assert/strict'
const origin=process.env.PERF_ORIGIN??'http://127.0.0.1:4251',out=process.env.PERF_OUTPUT??'/workspace/shared/fluidez-3d-profunda-20261121',report={errors:[],checks:[]}
mkdirSync(out,{recursive:true})
const fixture=JSON.parse(readFileSync(out+'/fixture-d.json','utf8'))
fixture.minute=20;fixture.paused=true;fixture.visualClock={seconds:20,sampledAt:0,running:false,rate:1}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'pt-BR'}),p=await context.newPage();p.setDefaultTimeout(180000)
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|VALIDATE_STATUS|GL_INVALID|Error creating WebGL/.test(m.text()))report.errors.push(m.text())})
 await p.addInitScript(f=>{window.qaTestMatch=f;localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve')},fixture)
 await p.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
 await p.goto(origin+'/7a0-game-studio/scripts/teste-mapa-fluidez/')
 await p.waitForFunction(()=>window.qaProfile?.api?.inspect().match.detail?.actors===22)
 await p.evaluate(()=>{window.qaProfile.api.setMatchCamera('tv');window.qaPeriod('night')})
 await p.waitForFunction(()=>window.qaProfile.api.inspect().lighting.period==='night'&&window.qaProfile.api.inspect().lighting.activeStadium.length===4)
 const night=await p.evaluate(()=>{const a=window.qaProfile.api.inspect(),r=window.qaRenderer;return{lighting:a.lighting,focus:a.focus,actors:a.match.detail.actors,vertices:r.info.memory,near:window.qaProfile.api.qaCena().camera.near}})
 const roof=await p.evaluate(()=>{const materials=new Set();window.qaProfile.api.qaCena().scene.traverse(n=>{for(const m of n.material?[n.material].flat():[])if(['cobertura-cinza-curva','juntas-cobertura'].includes(m.name))materials.add(m)});return [...materials].map(m=>m.visible)});assert(roof.length>0&&roof.every(v=>v===false),'cobertura invisível não precisa de passe de cor no celular');assert.equal(night.focus.locked,true);assert.equal(night.lighting.activeLocal.length,0);assert.equal(night.actors,22)
 await p.locator('.pc3-stage').screenshot({path:out+'/depois-partida-noite.png'});report.checks.push({name:'noite',...night});console.log('PASS noite: quatro refletores do estádio, sem luzes da cidade, 22 atores')
 await p.evaluate(()=>window.qaClearMatch())
 await p.waitForFunction(()=>!window.qaProfile.api.inspect().focus.locked&&window.qaProfile.api.qaCena().scene.getObjectByName('complexo-entorno'))
 await p.evaluate(()=>{window.qaPeriod('day');window.qaProfile.api.setMatchCamera('free')})
 await p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true}).click()
 await p.waitForFunction(()=>window.qaProfile.api.inspect().lighting.period==='day'&&window.qaProfile.api.inspect().cameraTransition===false)
 const city=await p.evaluate(()=>{const a=window.qaProfile.api.inspect();return{focus:a.focus,lighting:a.lighting,casaLuca:a.casaLuca!==null,canvases:document.querySelectorAll('.pc3-viewport > canvas').length,camera:a.camera,target:a.target}})
 const roofBack=await p.evaluate(()=>{const materials=new Set();window.qaProfile.api.qaCena().scene.traverse(n=>{for(const m of n.material?[n.material].flat():[])if(['cobertura-cinza-curva','juntas-cobertura'].includes(m.name))materials.add(m)});return [...materials].every(m=>m.visible)});assert(roofBack,'teto volta na vista externa');assert.equal(city.focus.scene.parked.length,0);assert(city.casaLuca);assert.equal(city.canvases,1)
 await p.locator('.pc3-stage').screenshot({path:out+'/depois-cidade-dia.png'});report.checks.push({name:'cidade-dia',...city})
 await p.evaluate(()=>window.qaPeriod('night'));await p.waitForFunction(()=>window.qaProfile.api.inspect().lighting.activeLocal.length>0)
 report.checks.push({name:'cidade-noite',lighting:await p.evaluate(()=>window.qaProfile.api.inspect().lighting)})
 await p.locator('.pc3-stage').screenshot({path:out+'/depois-cidade-noite.png'})
 await p.evaluate(()=>document.body.classList.add('clube-mapa-gestao-aberta'));await p.waitForTimeout(300)
 const frames=await p.evaluate(()=>window.qaProfile.api.inspect().frameStats.frames);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.qaProfile.api.inspect().frameStats.frames),frames)
 await p.locator('[data-qa-toggle]').click();assert.equal(await p.locator('.pc3-viewport > canvas').count(),0);assert.equal(await p.evaluate(()=>window.qaProfile.api),null)
 report.checks.push({name:'pausa-painel-e-desmontagem',success:true});assert.deepEqual(report.errors,[]);console.log('PASS cidade: pessoas/casas/luzes restauradas, câmera inicial, painel pausa desenho e saída libera canvas')
}finally{writeFileSync(out+'/noite-cidade-regressao.json',JSON.stringify(report,null,2));await browser.close()}
