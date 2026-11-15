import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const phase=process.env.ARENA_PHASE??'depois',base=phase==='antes'?'http://127.0.0.1:4202':'http://127.0.0.1:4201',out='/workspace/shared/mapa-arena-dsouza-20261114/'+phase,report={checks:[],errors:[],warnings:[]}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
try{for(const[device,width,height]of [['desktop',1440,1000],['celular',390,844]]){
 const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'});await c.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>report.errors.push({device,error:e.message}));p.on('console',m=>{if(m.type()==='warning'&&/mergeGeometries/.test(m.text()))report.warnings.push(m.text())})
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-navegacao/index.html',{waitUntil:'domcontentloaded'});const reset=p.getByRole('button',{name:'Voltar à visão inicial do mapa',exact:true});await reset.click();await p.evaluate(()=>window.navSetStadium(window.navFull));await p.waitForFunction(()=>window.navApi?.inspect().state.parking.stage===4);await p.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));await p.evaluate(()=>document.fonts.ready)
 const pose=()=>p.evaluate(()=>{const s=window.navApi.inspect();return{position:s.camera,target:s.target,fov:s.cameraFov}})
 const view=async id=>{await p.evaluate(id=>{window.navApi.view(id);window.navApi.seekCirculation(80)},id)}
 const shot=async name=>{await p.evaluate(()=>window.navApi.seekCirculation(80));await p.locator('.pc3-stage').screenshot({path:`${out}/${device}-${name}.png`,timeout:90000});console.log(device,name)}
 await view('original');const initial=await pose();await shot('mapa')
 await view('arena-online');await shot('arena')
 await reset.click();await p.evaluate(()=>window.navApi.openPlace('dsouza'));await shot('dsouza')
 if(phase==='depois'){
  const s=await p.evaluate(()=>window.navApi.inspect());const arena=s.clubPlaces.arena
  assert.equal(arena.lot.x,270);assert.equal(arena.lot.z,-65);assert(arena.pitch.length>s.sponsors.field.length&&arena.pitch.width>s.sponsors.field.width);assert.equal(s.sponsors.brands.find(b=>b.id==='dsouza').z,251);assert(arena.drawCalls<=12)
  await reset.click();await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Bairro e comunidade'}).click();await p.getByRole('button',{name:'Arena Legends · salas abertas',exact:true}).click();await p.getByRole('button',{name:'Consultar salas',exact:true}).click();assert.equal(await p.evaluate(()=>window.navDestination),'arena','Abre a consulta de salas existente')
  await reset.click();const returned=await pose();for(const k of ['position','target'])for(let i=0;i<3;i++)assert(Math.abs(returned[k][i]-initial[k][i])<.00001,'Retorno à câmera inicial')
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await p.evaluate(()=>JSON.stringify(window.navStadium)===JSON.stringify(window.navFull)),true)
  report.checks.push({device,arena:arena.lot,pitch:arena.pitch,drawCalls:arena.drawCalls,dsouzaMoved:true,roomsAction:true,reset:true,saveUnchanged:true})
 }
 await c.close()
}assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);console.log('PASS arena no navegador')}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
