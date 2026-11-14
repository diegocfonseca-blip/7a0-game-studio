import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const phase=process.env.NAV_PHASE??'depois',base=process.env.NAV_BASE??'http://127.0.0.1:4201',out='/workspace/shared/mapa-navegacao-20261114/'+phase
mkdirSync(out,{recursive:true})
const report={checks:[],screens:[],errors:[]},browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
const cases=[['desktop',1440,1000],['celular',390,844],...(phase==='depois'?[['estreito',320,740]]:[])].filter(c=>!process.env.NAV_DEVICE||c[0]===process.env.NAV_DEVICE)
try{for(const[device,width,height]of cases){
 const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'})
 await c.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>report.errors.push({device,error:e.message}))
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-navegacao/index.html',{waitUntil:'domcontentloaded'})
 const reset=p.getByRole('button',{name:phase==='depois'?'Voltar à visão inicial do mapa':'Estádio e região',exact:true})
 await reset.click();await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>window.navApi.seekCirculation(80))
 const saved=await p.evaluate(()=>JSON.stringify(window.navStadium))
 const pose=()=>p.evaluate(()=>{const s=window.navApi.inspect();return{camera:s.camera,target:s.target,fov:s.cameraFov,nav:s.navigation.mode}})
 const equal=(a,b,msg)=>{for(const k of ['camera','target'])for(let i=0;i<3;i++)assert(Math.abs(a[k][i]-b[k][i])<.00001,msg+' '+k+i);assert(Math.abs(a.fov-b.fov)<.00001,msg+' fov');assert.equal(a.nav,b.nav,msg+' navigation')}
 const photo=async name=>{await p.evaluate(()=>window.navApi.seekCirculation(80));await p.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-${name}.png`,timeout:90000});report.screens.push({device,name});console.log(device,name)}
 const openClub=async id=>{const label=p.locator(`[data-poi="${id}"]`);if(await label.isVisible())await label.click();else{await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Meu clube'}).first().click();await p.getByRole('button',{name:id==='museu-clube'?/^Museu do clube/:id==='loja'?/^(Terreno da loja|Loja da torcida)/:/^Gestão ·/}).click()}}
 const initial=await pose();await photo('visao-inicial')
 if(phase==='antes'){await openClub('museu-clube');await photo('museu');await c.close();continue}
 const labels=await p.locator('.cr3-map-labels button:visible').evaluateAll(nodes=>nodes.map(b=>{const r=b.getBoundingClientRect(),s=b.querySelector('span').getBoundingClientRect();return{name:b.textContent,hit:[r.width,r.height],painted:[s.width,s.height]}}))
 assert(labels.length>0);for(const l of labels){assert(l.hit[0]>=44&&l.hit[1]>=44);assert(l.painted[1]<27,'Etiqueta pequena')}
 report.checks.push({device,labels})
 for(const id of ['museu-clube','loja','gestao-clube']){
  await reset.click();const before=await pose();await openClub(id);await p.locator('.pc3-club-place').waitFor();equal(await pose(),before,'Abrir não move a câmera')
  if(id==='museu-clube')await photo('cartao-sem-mover')
  await p.getByRole('button',{name:'Ver de perto',exact:true}).click();assert.notDeepEqual((await pose()).camera,before.camera,'Aproximação explícita')
  if(id==='museu-clube')await photo('aproximacao-opcional')
  await p.getByRole('button',{name:'Fechar',exact:true}).click();equal(await pose(),before,'Fechar restaura vista anterior')
 }
 // O menu também usa a abertura sem enquadramento automático, inclusive nos patrocinadores.
 for(const [id,title]of [['shopping','Shopping'],['vadico','Vadico'],['feira','Feira']]){
  const before=await pose();await p.evaluate(id=>window.navApi.openPlace(id),id);equal(await pose(),before,'Cartão '+id+' estável');await p.getByRole('button',{name:'Ver de perto',exact:true}).click();await p.getByRole('button',{name:'Fechar',exact:true}).click();equal(await pose(),before,'Volta '+id)
 }
 // Clique real pelo menu, não só pela bancada.
 await p.getByRole('button',{name:/^Locais/}).click();await p.locator('summary').filter({hasText:'Compras'}).click();const menuBefore=await pose();await p.getByRole('button',{name:'Vadico Veículos',exact:true}).click();equal(await pose(),menuBefore,'Menu não altera câmera');await p.getByRole('button',{name:'Fechar',exact:true}).click()
 // O clique no prédio 3D usa o mesmo comportamento das etiquetas.
 const agencyPoint=await p.evaluate(async()=>{const THREE=await import('/7a0-game-studio/node_modules/three/build/three.module.js');const {LOTE_AGENCIA_CLUBE:a}=await import('/7a0-game-studio/src/escalacao/clube-mapa-destinos.ts');const s=window.navApi.inspect(),el=document.querySelector('canvas'),r=el.getBoundingClientRect(),cam=new THREE.PerspectiveCamera(s.cameraFov,r.width/r.height,.1,10000);cam.position.fromArray(s.camera);cam.lookAt(new THREE.Vector3(...s.target));cam.updateMatrixWorld();const v=new THREE.Vector3(a.x,a.height,a.z).project(cam);return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}})
 const rayBefore=await pose();await p.locator('.cr3-map-labels button').evaluateAll(nodes=>nodes.forEach(n=>n.style.pointerEvents='none'));await p.mouse.click(agencyPoint.x,agencyPoint.y);await p.locator('[data-map-view="agencia-clube"]').waitFor();equal(await pose(),rayBefore,'Toque no prédio não altera câmera');await p.getByRole('button',{name:'Fechar',exact:true}).click()
 await p.evaluate(()=>{window.navApi.openPlace('loja');window.navApi.view('field')});const field=await pose();await p.evaluate(()=>window.navApi.openPlace('loja'));await p.getByRole('button',{name:'Ver de perto',exact:true}).click();await p.getByRole('button',{name:'Fechar',exact:true}).click();equal(await pose(),field,'Mudança de destino encerra retorno antigo');await reset.click()
 // Vista livre alterada por zoom/rotação: fechar retorna a ela; botão inicial desfaz tudo.
 await p.evaluate(()=>{window.navApi.setNavigationMode('rotate');window.navApi.qaOlhar([40,0,20],[160,170,240]);window.navApi.zoom(1)})
 const explored=await pose();await p.evaluate(()=>window.navApi.openPlace('loja'));equal(await pose(),explored,'Mantém vista livre');await p.getByRole('button',{name:'Ver de perto',exact:true}).click();await p.getByRole('button',{name:'Fechar',exact:true}).click();equal(await pose(),explored,'Retorna à vista livre')
 await reset.click();equal(await pose(),initial,'Visão inicial restaura câmera e navegação')
 await p.evaluate(()=>{window.navApi.qaOlhar([0,0,0],[100,150,-200]);window.navApi.setNavigationMode('rotate')});await p.locator('canvas').focus();await p.keyboard.press('Home');equal(await pose(),initial,'Home restaura vista inicial')
 assert.equal(await p.evaluate(()=>JSON.stringify(window.navStadium)),saved,'Não altera save')
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem horizontal')
 report.checks.push({device,stableCards:6,explicitFocus:true,returnToPriorPose:true,reset:true,homeKey:true,menu:true,raycast:true,saveUnchanged:true})
 await photo('retorno-inicial');await c.close()
}assert.deepEqual(report.errors,[]);console.log('PASS navegação do mapa')}finally{writeFileSync(out+'/verificacao'+(process.env.NAV_DEVICE?'-'+process.env.NAV_DEVICE:'')+'.json',JSON.stringify(report,null,2));await browser.close()}
