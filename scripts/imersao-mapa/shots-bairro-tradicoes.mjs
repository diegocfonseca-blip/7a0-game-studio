// 📸 Fotos das tradições do bairro (04/11): feira livre (sábado de manhã), banca de jornal e pelada no campinho (de tarde).
// Uso (com o vite de pé em 127.0.0.1:4201): node scripts/imersao-mapa/shots-bairro-tradicoes.mjs   (SO=feira,banca,pelada)
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const PORT=process.env.PORT??'4201'
const URL_QA=`http://127.0.0.1:${PORT}/7a0-game-studio/qa-presidencia-complexo-3d.html`
const OUT=process.env.OUT??'scripts/mockups/'
const SO=process.env.SO?.split(',')
const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'pt-BR'})
page.on('pageerror',e=>console.log('pageerror',e.message))
page.on('console',m=>{if(/tradi|error/i.test(m.text()))console.log('console',m.text())})
await page.goto(URL_QA,{waitUntil:'load'})
await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
const prepara=async(modo,placar,vista,seconds)=>{
 await page.evaluate(([m,p])=>window.qaBairro(m,p),[modo,placar])
 await page.waitForTimeout(1200)
 await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 // os civis carregam sob demanda: alguns quadros no mesmo segundo do relógio
 for(let i=0;i<6;i++){await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(800)}
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(600)
}
const shot=async name=>{const el=await page.$('[data-complexo-3d]');await el.screenshot({path:`${OUT}mapa-bairro-${name}.png`});console.log('ok',name,JSON.stringify(await page.evaluate(()=>window.complexo3D.inspect().tradicoes)))}
if(!SO||SO.includes('feira')){await prepara('sabado-manha',{gf:2,ga:1},'feira',12);await shot('feira')}
if(!SO||SO.includes('banca')){await prepara('sabado-manha',{gf:2,ga:1},'banca',12);await shot('banca')}
if(!SO||SO.includes('pelada')){await prepara('quinta-tarde',{gf:2,ga:1},'campinho',21);await shot('pelada')}
await browser.close()
