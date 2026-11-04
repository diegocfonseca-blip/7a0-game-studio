// 📸 Fotos (04/11), celular 390×844 ×2: festa de campeão da Libertadores · final nos pênaltis · câmera seguindo os ônibus.
// Uso (com o vite de pé): PORT=4237 node scripts/imersao-mapa/shots-final-onibus.mjs   (SO=liberta,penaltis,onibus,champions,mundial)
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const PORT=process.env.PORT??'4201'
const BASE=`http://127.0.0.1:${PORT}/7a0-game-studio/`
const OUT=process.env.OUT??'scripts/mockups/'
const SO=process.env.SO?.split(',')
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'pt-BR'})
page.on('pageerror',e=>console.log('pageerror',e.message))
page.on('console',m=>{if(/final|error|ônibus/i.test(m.text()))console.log('console',m.text().slice(0,200))})
await page.goto(BASE+'qa-presidencia-complexo-3d.html',{waitUntil:'load'})
await page.waitForFunction(()=>!!window.complexo3D&&!!window.simularFinalQA,null,{timeout:240000})
const foto=async name=>{const el=await page.$('[data-complexo-3d]');await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.screenshot({path:`${OUT}${name}.png`,clip:{x:b.x,y:Math.max(0,b.y),width:b.width,height:Math.min(b.height,844)},timeout:120000});console.log('ok',name)}
const festa=async(name,op,olhar)=>{
 await page.evaluate(o=>window.simularFinalQA('campeao',o),op)
 await page.waitForFunction(()=>window.complexo3D?.inspect().matchday!==undefined,null,{timeout:60000})
 await page.waitForTimeout(6000)
 await page.evaluate(()=>{window.__complexoFinal.seekFesta(24);window.__complexoFinal.congelar(true)})
 await page.waitForTimeout(400)
 await page.evaluate(()=>window.__complexoFinal.congelar(false))
 await page.waitForTimeout(3500)
 await page.evaluate(()=>window.__complexoFinal.congelar(true))
 await page.evaluate(()=>{for(const b of document.querySelectorAll('button'))if(b.textContent.trim()==='×'||b.getAttribute('aria-label')?.match(/fechar|close/i))b.closest('[class*=aviso],[role=status],[role=alert]')&&b.click()})
 await page.evaluate(([p,a])=>window.__complexoFinal.olhar(p,a),olhar)
 await page.waitForTimeout(1500)
 console.log(name,JSON.stringify(await page.evaluate(()=>window.__complexoFinal.inspect())))
 if(name)await foto(name)
 await page.evaluate(()=>window.__complexoFinal.congelar(false))
}
const perto=[[0,6.2,14],[0,2.6,0]]
// (aquecimento: a 1ª festa da página baixa os bonecos do pódio; a foto sai da 2ª em diante)
if(!SO||SO.some(k=>k!=='onibus'))await festa(null,{},perto)
if(!SO||SO.includes('liberta'))await festa('mapa-festa-liberta',{intl:'libertadores'},perto)
if(SO?.includes('champions'))await festa('mapa-festa-champions',{intl:'champions'},perto)
if(SO?.includes('mundial'))await festa('mapa-festa-mundial',{intl:'mundial'},perto)
if(!SO||SO.includes('penaltis'))await festa('mapa-festa-penaltis',{penaltis:'home'},perto)
if(!SO||SO.includes('onibus')){
 // dia de jogo em casa, sem jogo publicado: os ônibus chegam e a câmera vai junto (ninguém tocou no mapa)
 await page.evaluate(()=>window.setComplexoMatch(undefined))
 const F='qa-onibus-camera'
 await page.evaluate(F=>{const xi=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({name:s+' '+(i+1),pos}));window.setComplexoArrival({fixtureId:F,teams:[{name:'Leão da Serra',color:'#1B7A3D',players:xi('Leão')},{name:'Tubarão EC',color:'#C2452F',players:xi('Tubarão')}]});window.setComplexoJourney({ordinal:2,phase:'arrival',fixtureId:F})},F)
 await page.evaluate(()=>window.complexo3D.view('original'))
 let fase='',ok=false
 for(let i=0;i<240&&!ok;i++){
  const info=await page.evaluate(()=>{const s=window.complexo3D.inspect();return{v:s.teamArrival.vehicles,ph:s.teamArrival.phase,cam:s.busCamera,secs:s.teamArrival.seconds}})
  fase=JSON.stringify(info.v)+' '+info.ph
  if(info.v?.[0]==='arriving'&&info.cam?.seguindo){for(let k=0,t=info.secs;k<30;k++){t+=.2;await page.evaluate(s=>window.complexo3D.seekCirculation(s),t);await page.waitForTimeout(200)}ok=true;break}
  if(i%20===0)console.log('esperando',fase,JSON.stringify(info.cam))
  await page.evaluate(s=>window.complexo3D.seekCirculation(s+1.5),info.secs??0)
  await page.waitForTimeout(250)
 }
 console.log('onibus',fase,JSON.stringify(await page.evaluate(()=>window.complexo3D.inspect().busCamera)))
 await foto('mapa-onibus-camera')
}
await browser.close()
