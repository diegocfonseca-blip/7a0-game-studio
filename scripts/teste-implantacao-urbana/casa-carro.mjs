import assert from 'node:assert/strict'
import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
const out='/workspace/shared/casa-bairro-passeio-20261114/depois',base='http://127.0.0.1:4197'
mkdirSync(out,{recursive:true})
const report={checks:[],screens:[],errors:[]},browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']})
try{for(const [device,width,height]of[['desktop',1440,1000],['celular',390,844],['estreito',320,740]]){
 const context=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'});await context.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await context.routeWebSocket('**/*',ws=>ws.close())
 const p=await context.newPage();p.setDefaultTimeout(150000);p.on('pageerror',e=>report.errors.push({device,error:e.message}));
 await p.goto(base+'/7a0-game-studio/scripts/teste-implantacao-urbana/index.html?cars',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.urbanApi);await p.evaluate(()=>document.fonts.ready)
 await p.getByRole('button',{name:'Estádio e região',exact:true}).click()
 const view=async name=>p.waitForFunction(v=>{if(!window.urbanApi)return false;window.urbanApi.view(v);return true},name)
 const snap=()=>p.evaluate(()=>{const s=window.urbanApi.inspect();return{car:s.carTrip,vehicles:s.vehicleDeliveries,roads:s.roads,circulation:s.circulation?.problems,transport:s.transport?.problems,wallet:window.urbanCurrentWallet,save:window.urbanCurrentSave}})
 const photo=async name=>{await p.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-${name}.png`,animations:'disabled',timeout:90000});report.screens.push({device,name});console.log(device,name)}
 await p.getByRole('button',{name:'Ver cidade',exact:true}).click();await p.waitForFunction(()=>window.urbanApi?.inspect().view==='region');await photo('bairro-localizacao')
 await view('casa-usuario');await p.getByRole('button',{name:'Ir ao estádio de carro',exact:true}).waitFor();await photo('casa-e-garagem')
 await p.locator('.pc3-card-x').first().click();await p.evaluate(()=>window.urbanApi.qaOlhar([432,0,480],[440,130,630]));await photo('bairro-residencial');await view('casa-usuario')
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem lateral')
 const before=await snap();assert.deepEqual(before.circulation,[]);assert.deepEqual(before.transport,[]);assert.equal(before.roads.afterComponents,1)
 if(device==='estreito'){await context.close();continue}
 const select=p.getByLabel('Carro da garagem',{exact:true});if(device==='celular')await select.selectOption('chevette')
 await p.getByRole('button',{name:'Ir ao estádio de carro',exact:true}).click();await p.waitForFunction(()=>window.urbanApi?.inspect().carTrip?.phase==='going-stadium');await photo('saindo-da-garagem')
 await p.evaluate(()=>window.urbanApi.qaAdvanceCar(40));await photo('trajeto-bairro');let middle=await snap();assert.equal(middle.car.phase,'going-stadium')
 await p.getByRole('button',{name:'Pausar passeio',exact:true}).last().click();const stopped=(await snap()).car.position;await p.waitForTimeout(200);assert.deepEqual((await snap()).car.position,stopped,'Pausa conserva o lugar do carro');await p.getByRole('button',{name:'Continuar passeio',exact:true}).click()
 await p.evaluate(()=>window.urbanApi.qaAdvanceCar(300));await p.waitForFunction(()=>window.urbanApi?.inspect().carTrip?.phase==='at-stadium');await photo('estacionado-no-estadio')
 assert.equal((await snap()).car.id,device==='celular'?'chevette':'fusca')
 await p.getByRole('button',{name:'Voltar para casa de carro',exact:true}).click();await p.waitForFunction(()=>window.urbanApi?.inspect().carTrip?.phase==='going-home');await photo('voltando-para-casa')
 await p.evaluate(()=>window.urbanApi.qaAdvanceCar(300));await p.waitForFunction(()=>!window.urbanApi?.inspect().carTrip);await p.getByRole('button',{name:'Ver minha casa',exact:true}).click();await photo('de-volta-na-garagem')
 const after=await snap();assert.deepEqual(after.wallet,before.wallet,'Posse e saldo preservados');assert.deepEqual(after.save,before.save,'Estádio preservado');assert.deepEqual(after.circulation,[]);assert.deepEqual(after.transport,[])
 report.checks.push({device,roundTrip:true,car:device==='celular'?'chevette':'fusca',sameOwnership:true,pause:true,returnPhase:after.vehicles.vehicles.map(v=>({id:v.id,phase:v.phase,position:v.position}))})
 if(device==='desktop'){
  await p.evaluate(()=>window.urbanSave({...window.urbanFull,ext:window.urbanFull.ext.filter(k=>k!=='estac'),estacionamentoInvestido:0}));await p.waitForFunction(()=>window.urbanApi?.inspect().state.parking.stage===0);await view('casa-usuario');await p.getByRole('button',{name:'Ir ao estádio de carro',exact:true}).click();await p.getByRole('status').filter({hasText:'Construa a primeira etapa'}).waitFor();assert.equal((await snap()).car,null);report.checks.push({device,parkingRequired:true})
  await p.evaluate(()=>window.urbanWallet(undefined));await p.getByText('Seu carro aparecerá aqui depois da compra na Vadico.',{exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'Ir ao estádio de carro',exact:true}).count(),0);assert.equal(await p.evaluate(()=>window.urbanApi.driveCar('fusca','stadium').ok),false);report.checks.push({device,noFreeCar:true})
 }
 await context.close()
}assert.deepEqual(report.errors,[]);console.log('PASS passeio de carro e bairro:',report.screens.length,'capturas')}
finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
