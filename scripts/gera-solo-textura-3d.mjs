import {chromium} from 'playwright-core'
import {writeFileSync,mkdirSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
const origin=process.env.PERF_ORIGIN??'http://127.0.0.1:4251',out=process.env.SOIL_OUTPUT??'/tmp/leilao-solo-precalculado'
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']})
try{
 const p=await browser.newPage();p.on('pageerror',e=>console.error(e));await p.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort())
 await p.goto(origin+'/7a0-game-studio/scripts/teste-solo-textura-3d/');await p.waitForFunction(()=>window.qaReady)
 mkdirSync(out,{recursive:true})
 for(const [layer,width,height]of [['far',1024,721],['mid',1024,721],['near',2048,1442]]){const start=Date.now(),png=await p.evaluate(({layer,width,height})=>window.qaBakeSoil(layer,width,height),{layer,width,height});writeFileSync(out+'/'+layer+'.png',Buffer.from(png.split(',')[1],'base64'));console.log(layer,Date.now()-start+'ms')}
}finally{await browser.close()}

// --webp é explícito: além das provas PNG, atualiza os três arquivos do jogo.
// Pré-requisito só da geração offline: Python + Pillow; sem dependência no app.
if(process.argv.includes('--webp')){
 const converted=spawnSync('python3',['-c',`from PIL import Image
from pathlib import Path
import sys
for layer,nome in [('far','longe'),('mid','medio'),('near','perto')]:
 Image.open(Path(sys.argv[1])/(layer+'.png')).convert('RGB').save(Path(sys.argv[2])/('solo-campo-'+nome+'-v1.webp'),quality=55 if layer=='near' else 85,method=6)`,out,fileURLToPath(new URL('../src/escalacao/img/',import.meta.url))],{stdio:'inherit'})
 if(converted.status!==0)throw Error('Falha ao gerar WebP: confira Python/Pillow')
}
