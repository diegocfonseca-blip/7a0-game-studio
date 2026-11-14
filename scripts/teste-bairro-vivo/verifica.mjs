import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const phase=process.env.BAIRRO_QA_PHASE??'depois',base=process.env.BAIRRO_QA_BASE??'http://127.0.0.1:4199',out='/workspace/shared/bairro-vivo-20261114/'+phase
mkdirSync(out,{recursive:true})
const report={checks:[],screens:[],errors:[],warnings:[]},browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
const selection=process.env.BAIRRO_QA_DEVICE,cases=[['desktop',1440,1000],['celular',390,844],...(phase==='depois'?[['estreito',320,740]]:[])].filter(c=>!selection||c[0]===selection)
try{for(const[device,width,height]of cases){
 const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'})
 await c.addInitScript(()=>{localStorage.setItem('pc3-qualidade-v1','leve');window.audioStarts=0;const Original=window.AudioContext;if(Original)window.AudioContext=class extends Original{createOscillator(){window.audioStarts++;return super.createOscillator()}createBufferSource(){window.audioStarts++;return super.createBufferSource()}}})
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>report.errors.push({device,error:e.message}));p.on('console',m=>{if(m.type()==='warning'&&/tradições|mergeGeometries|desligadas/.test(m.text()))report.warnings.push(m.text())})
 await p.goto(base+'/7a0-game-studio/scripts/teste-bairro-vivo/index.html',{waitUntil:'domcontentloaded'})
 await p.getByRole('button',{name:'Estádio e região',exact:true}).click();await p.evaluate(()=>document.fonts.ready)
 const initialWallet=await p.evaluate(()=>JSON.stringify(window.bairroWallet))
 const inspect=()=>p.evaluate(()=>{const s=window.bairroApi.inspect();return{training:s.sponsorLife?.training,tradicoes:s.tradicoes,view:s.view,drawCalls:s.drawCalls,triangles:s.triangles,wallet:window.bairroWallet,c:window.bairroContext,pubLife:s.botecos,camera:s.camera,circulation:s.circulation?.problems}})
 const set=async opts=>{await p.evaluate(v=>window.setBairroContext(v),opts);await p.waitForFunction(v=>Object.entries(v).every(([k,x])=>window.bairroContext[k]===x),opts);await p.evaluate(()=>window.bairroApi?.seekCirculation(80))}
 const view=async id=>{await p.waitForFunction(v=>{if(!window.bairroApi)return false;window.bairroApi.view(v);window.bairroApi.seekCirculation(80);return true},id);await p.waitForFunction(v=>window.bairroApi?.inspect().view===v,id)}
 const photo=async name=>{await p.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-${name}.png`,timeout:90000});report.screens.push({device,name});console.log(device,name)}
 await set({dia:Date.UTC(2027,1,7),hora:9});await view('feira');await photo('feira')
 assert.equal((await inspect()).tradicoes?.feira,true,'Feira preservada na manhã do fim de semana')
 await set({hora:14});await view('gecg')
 if(phase==='depois'){await p.waitForFunction(()=>window.bairroApi?.inspect().sponsorLife?.training?.players===4);const a=await inspect();assert.equal(a.training.goalkeepers,2);assert.equal(a.training.light,true);assert.equal(a.training.error,'');await p.evaluate(()=>window.bairroApi.seekCirculation(81));assert.notDeepEqual((await inspect()).training.ball,a.training.ball);report.checks.push({device,lightFootball:true,training:(await inspect()).training})}
 await photo('gremio-leve');if(phase==='depois'){await p.getByRole('button',{name:'Ver o futebol de perto',exact:true}).click();await p.waitForFunction(()=>window.bairroApi?.inspect().view==='gecg-futebol');await photo('gremio-futebol-perto')}
 if(phase==='depois'){await set({hora:9});await view('gecg');assert.equal((await inspect()).training.mode,'escolinha');await photo('gremio-escolinha');await set({hora:14})}
 if(phase==='depois'){await view('campinho');await p.waitForFunction(()=>window.bairroApi?.inspect().tradicoes?.pessoas.includes('pelada'));await photo('campinho-preservado')}
 await view(phase==='depois'?'pipas':'praca-bairro');await photo('pipas')
 if(phase==='depois'){assert.equal((await inspect()).tradicoes.cultura.visible.pipas,true);assert.equal((await inspect()).tradicoes.cultura.kites.length,2)}
 await set({dia:Date.UTC(2027,5,12),hora:21});await view(phase==='depois'?'pagode':'boteco-oswaldo');await photo('pagode')
 if(phase==='depois'){
  const s=await inspect();assert(s.tradicoes.cultura.places.pagode,'Local livre do pagode');assert.equal(s.tradicoes.cultura.visible.pagode,true);assert.equal(s.tradicoes.cultura.audible,false,'Som começa desligado');assert(s.pubLife?.reservedMusicTable);assert(!s.pubLife.people.find(p=>p.pub==='oswaldo'&&p.index===2).visible,'Mesa reservada sem personagem duplicado')
  await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Meu clube'}).first().click();await p.locator('summary').filter({hasText:'Passear no estádio'}).first().click();await p.getByRole('button',{name:'Som do mapa',exact:true}).click();await p.getByRole('button',{name:/^Locais/}).click();await p.evaluate(()=>window.bairroApi.seekCirculation(84));assert.equal((await inspect()).tradicoes.cultura.audible,true);assert(await p.evaluate(()=>window.audioStarts>0),'Pagode usa o som do jogo')
  await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Meu clube'}).first().click();await p.locator('summary').filter({hasText:'Passear no estádio'}).first().click();await p.getByRole('button',{name:'Desligar som do mapa',exact:true}).click();await p.getByRole('button',{name:/^Locais/}).click();await p.evaluate(()=>window.bairroApi.seekCirculation(85));assert.equal((await inspect()).tradicoes.cultura.audible,false);const audio=await p.evaluate(()=>window.audioStarts);await p.evaluate(()=>window.bairroApi.seekCirculation(86));assert.equal(await p.evaluate(()=>window.audioStarts),audio,'Desligado não cria novas notas')
  report.checks.push({device,audioControlled:true})
 }
 await view(phase==='depois'?'festa-junina':'praca-bairro');await photo('festa-junina')
 if(phase==='depois'){
  assert.equal((await inspect()).tradicoes.cultura.visible.junina,true);await set({dia:Date.UTC(2027,6,12),hora:21});let s=await inspect();assert.equal(s.tradicoes.cultura.visible.junina,false,'Julho não tem festa junina');assert.equal(s.tradicoes.cultura.visible.pagode,false,'Segunda não tem pagode');await set({hora:14});s=await inspect();assert.equal(s.tradicoes.cultura.visible.pipas,true);assert.equal(s.tradicoes.pelada,true,'Campinho de terra preservado');assert.deepEqual(s.circulation,[])
  await set({hosting:true,hora:16});await view('flanelinha');await p.waitForFunction(()=>window.bairroApi?.inspect().tradicoes?.dia?.flanelinha?.visible===true);await photo('flanelinha');await set({parking:false});await p.waitForFunction(()=>window.bairroApi?.inspect().state.parking.stage===0);await view('flanelinha');assert.equal((await inspect()).tradicoes.dia.flanelinha.visible,false);assert.equal((await inspect()).tradicoes.dia.flanelinha.parkingStage,0)
  report.checks.push({device,calendar:true,dirtPitch:true,parkingGate:true,wallet:(await inspect()).wallet})
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(window.bairroWallet)),initialWallet,'Sem alterar moedas ou bens');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem horizontal');await c.close()
}assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);console.log('PASS bairro vivo no navegador')}finally{writeFileSync(out+'/verificacao'+(selection?'-'+selection:'')+'.json',JSON.stringify(report,null,2));await browser.close()}
