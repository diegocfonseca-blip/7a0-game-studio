import {createRequire} from 'node:module'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const OUT='/tmp/claude-0/-home-user-7a0-game-studio/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/scratchpad/video/shots/'
const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await browser.newPage({viewport:{width:540,height:960},deviceScaleFactor:2,locale:'pt-BR'})
page.on('pageerror',e=>console.log('pageerror',e.message))
await page.goto('http://127.0.0.1:4199/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'load'})
await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
const alta=async()=>{await page.evaluate(()=>{const b=[...document.querySelectorAll('.pc3-qualidade button')].find(x=>/alta|high/i.test(x.textContent||''));b&&b.click()});await page.waitForTimeout(3000);await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})}
await alta()
await page.addStyleTag({content:'[data-complexo-3d] *{visibility:hidden!important} [data-complexo-3d] canvas{visibility:visible!important}'})
const full=await page.evaluate(()=>window.complexoFixtures.presets.complete)
const COR='#1B7A3D',COR2='#FFC400'
const prepara=async(cv,vista,sec)=>{
 await page.evaluate(([save,cv])=>{window.setComplexoSave(save);window.setComplexoPopulation({qaPopulation:true,cidadeViva:cv})},[full,cv])
 await page.waitForTimeout(1500)
 await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 for(let i=0;i<4;i++){await page.evaluate(s=>window.complexo3D.seekCirculation?.(s),sec);await page.waitForTimeout(700)}
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 await page.waitForTimeout(900)
 const q=await page.evaluate(()=>[...document.querySelectorAll('.pc3-qualidade button')].find(x=>x.getAttribute('aria-pressed')==='true')?.textContent);if(!/alta|high/i.test(q||'')){await alta();await page.evaluate(v=>window.complexo3D.view(v),vista);await page.waitForTimeout(900)}
}
const base={canteiros:[],humor:'normal',carreata:false,cor:COR,cor2:COR2}
const lista=(process.env.SO?process.env.SO.split(','):['region','field','room','campinho','pipas','festa-junina','loja','praca','shopping'])
for(const v of lista){
 try{
  await prepara(v==='boteco-oswaldo'?{...base,humor:'festa'}:base,v,30)
  const el=await page.$('[data-complexo-3d] canvas');await page.evaluate(()=>document.querySelectorAll('body *').forEach(e=>{if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden'}));await el.screenshot({path:`${OUT}${v}.png`});console.log('ok',v)
 }catch(e){console.log('erro',v,e.message.slice(0,120))}
}
// clipes com gente andando
for(const [v,cv] of [['boteco-oswaldo',{...base,humor:'festa'}],['praca',base]]){
 await prepara(cv,v,30)
 const el=await page.$('[data-complexo-3d] canvas')
 await page.evaluate(()=>document.querySelectorAll('body *').forEach(e=>{if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden'}));
 for(let i=0;i<48;i++){await page.evaluate(s=>window.complexo3D.seekCirculation?.(s),30+i*0.125);await page.waitForTimeout(120);await el.screenshot({path:`${OUT.replace('shots/','clips/')}${v}-${String(i).padStart(3,'0')}.png`})}
 console.log('clip',v)
}
await browser.close()
