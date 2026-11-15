import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
const out=process.env.COMMERCE_OUT??'/workspace/shared/comercios-reforma-20261113/depois',report={screens:[],errors:[]};
mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
try{for(const [device,width,height,views]of[
 ['desktop',1440,1000,['original','region','loja','agencia-clube','shopping','vadico','hotel','chopp','praca','patrocinadores','dsouza','tidex','oittolabs','gecg','arena-online','museu-clube','padaria','banca','boteco-oswaldo']],
 ['celular',390,844,['original','region','loja','shopping','patrocinadores','hotel','chopp','praca']],
 ['estreito',320,844,['original','loja','shopping']]]){
 const c=await b.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'});await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await c.routeWebSocket('**/*',ws=>ws.close());const p=await c.newPage();p.on('pageerror',e=>report.errors.push({device,error:e.message}));p.setDefaultTimeout(150000);await p.goto('http://127.0.0.1:4197/7a0-game-studio/scripts/teste-mapa-clube-20261113/index.html?mode=mapa',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.mapApi);await p.waitForTimeout(1800);await p.waitForFunction(()=>!!window.mapApi);
 for(const view of(process.env.COMMERCE_VIEWS?.split(',')??views)){await p.waitForFunction(()=>!!window.mapApi);await p.evaluate(v=>window.mapApi.view(v),view);await p.waitForTimeout(180);const notice=p.getByRole('status').filter({hasText:'O mapa estava travando'});if(await notice.isVisible())await notice.getByRole('button',{name:'Fechar',exact:true}).click();const info=await p.evaluate(async()=>{
  const s=window.mapApi.inspect(),T=await import('/7a0-game-studio/node_modules/three/build/three.module.js'),[w,h]=s.viewport,cam=new T.PerspectiveCamera(s.cameraFov,w/h,.12,4000);cam.position.fromArray(s.camera);cam.lookAt(new T.Vector3(...s.target));cam.updateMatrixWorld();cam.updateProjectionMatrix();
  const project=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(cam);return {x:Math.round((v.x+1)*w/2),y:Math.round((1-v.y)*h/2),inFrame:Math.abs(v.x)<=1&&Math.abs(v.y)<=1&&Math.abs(v.z)<=1}};
  const projection=s.sponsors.brands.map(a=>{const center=project(a.x,a.height*.6,a.z);return{id:a.id,label:a.label,...center}});
  return{view:s.view,camera:s.camera,target:s.target,viewport:s.viewport,establishments:s.establishments,projection,sponsors:s.sponsors.brands,shop:s.clubPlaces,drawCalls:s.drawCalls,triangles:s.triangles};
 });if(view==='original')for(const brand of info.projection){assert(brand.inFrame,`${device}: ${brand.id} fora da abertura`);assert(brand.y>70&&brand.y<info.viewport[1]-40,`${device}: ${brand.id} coberto pelas barras`)}assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-${view}.png`,animations:'disabled',timeout:90000});report.screens.push({device,view,...info});console.log(device,view)}await c.close()
}}finally{writeFileSync(out+'/'+(process.env.COMMERCE_REPORT??'auditoria.json'),JSON.stringify(report,null,2));await b.close()}assert.deepEqual(report.errors,[]);console.log('PASS capturas',report.screens.length,'erros',report.errors.length)
