import assert from 'node:assert/strict'
import {chromium} from 'playwright-core'
import {PerspectiveCamera,Vector3} from 'three'
import {writeFileSync} from 'node:fs'
const base='http://127.0.0.1:4197',out='/workspace/shared/casa-bairro-passeio-20261114/depois',checks=[]
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']})
try{for(const[device,width,height]of[['desktop',1440,1000],['celular',390,844],['estreito',320,740]]){
 const context=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'})
 await context.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await context.routeWebSocket('**/*',w=>w.close())
 const page=await context.newPage();page.setDefaultTimeout(150000)
 await page.goto(base+'/7a0-game-studio/scripts/teste-implantacao-urbana/index.html?cars',{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Estádio e região',exact:true}).click()
 await page.getByRole('button',{name:'Ver cidade',exact:true}).click()
 await page.waitForFunction(()=>window.urbanApi?.inspect().view==='region')
 // Render explicitly before inspecting the canvas; screenshots must show the selected camera.
 await page.evaluate(()=>window.urbanApi.qaAdvanceCar(0))
 const s=await page.evaluate(()=>{const s=window.urbanApi.inspect();return{view:s.view,camera:s.camera,target:s.target,fov:s.cameraFov,viewport:s.viewport}})
 assert.equal(s.view,'region')
 const camera=new PerspectiveCamera(s.fov,s.viewport[0]/s.viewport[1],.1,5000)
 camera.position.fromArray(s.camera);camera.lookAt(new Vector3(...s.target));camera.updateMatrixWorld()
 const points=[[0,0,0],[414,0,440],[450,0,470]].map(p=>new Vector3(...p).project(camera))
 assert.ok(points.every(p=>Math.abs(p.x)<.98&&Math.abs(p.y)<.95&&p.z<1),device+': estádio e casa cabem na visão geral '+JSON.stringify(points))
 if(width<600){const controls=await page.locator('.pc3-navigation').boundingBox(),viewport=await page.locator('[data-complexo-3d]').boundingBox();assert.ok(points.slice(1).every(p=>{const x=viewport.x+(p.x+1)*viewport.width/2,y=viewport.y+(1-p.y)*viewport.height/2;return x<controls.x-8||x>controls.x+controls.width+8||y<controls.y-8||y>controls.y+controls.height+8}),device+': casa fora dos botões laterais')}
 await page.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-bairro-localizacao.png`,timeout:90000})
 await page.evaluate(()=>{window.urbanApi.view('casa-usuario');window.urbanApi.qaAdvanceCar(0)})
 await page.getByRole('button',{name:'Ir ao estádio de carro',exact:true}).waitFor()
 await page.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-casa-e-garagem.png`,timeout:90000})
 await page.locator('.pc3-card-x').first().click()
 await page.evaluate(()=>window.urbanApi.qaOlhar([432,0,480],[440,130,630]))
 await page.locator('[data-complexo-3d]').screenshot({path:`${out}/${device}-bairro-residencial.png`,timeout:90000})
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 checks.push({device,...s,stadiumAndHomeVisible:true,projected:points.map(p=>p.toArray())});console.log(device,'câmera e bairro conferidos')
 await context.close()
}writeFileSync(out+'/cameras.json',JSON.stringify({checks},null,2))}finally{await browser.close()}
