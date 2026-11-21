import {chromium} from 'playwright-core'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']})
try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log(m.text())})
 await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4251/')?r.continue():r.abort());await p.goto('http://127.0.0.1:4251/7a0-game-studio/scripts/teste-solo-textura-3d/');await p.waitForFunction(()=>window.qaCompareSoil)
 const results=await p.evaluate(diffuse=>window.qaCompareSoil(diffuse),process.env.SOIL_DIFFUSE==='1'),out='/workspace/shared/fluidez-3d-profunda-20261121/solo'
 for(const r of results){for(const mode of ['antes','depois'])writeFileSync(out+'/'+(process.env.SOIL_DIFFUSE==='1'?'difuso-':'')+r.name+'-'+mode+'.png',Buffer.from(r[mode].split(',')[1],'base64'));delete r.antes;delete r.depois;assert.equal(r.glError,0,'upload das texturas após placeholder precisa caber na GPU');assert(r.meanDelta<8,`diferença visual média excessiva: ${r.name}`)}
 assert.deepEqual(errors,[]);writeFileSync(out+'/'+(process.env.SOIL_DIFFUSE==='1'?'comparacao-difuso.json':'comparacao.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}))
}finally{await browser.close()}
