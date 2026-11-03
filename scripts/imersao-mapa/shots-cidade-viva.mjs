// 📸 Fotos da cidade viva (03/11): canteiro da obra, boteco em festa / cabisbaixo e a carreata do título.
// Uso (com o vite de pé em 127.0.0.1:4199): npx tsx scripts/imersao-mapa/shots-cidade-viva.mjs
import {existsSync} from 'node:fs'
import {registerHooks,createRequire} from 'node:module'
registerHooks({
 resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},
 load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)},
})
const {rotaCarreata,poseNaRota}=await import('../../src/escalacao/presidencia-cidade-viva-3d.ts')
const {chromium}=createRequire(import.meta.url)('playwright')
const URL_QA='http://127.0.0.1:4199/7a0-game-studio/qa-presidencia-complexo-3d.html'
const OUT='scripts/mockups/'
const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const COR='#1B7A3D',COR2='#FFC400'
const SO=process.env.SO?.split(',')
for(const [tag,viewport] of [['celular',{width:390,height:844}],['desktop',{width:1440,height:900}]].filter(([t])=>!process.env.TAG||process.env.TAG===t)){
 const page=await browser.newPage({viewport,deviceScaleFactor:1,locale:'pt-BR'})
 page.on('pageerror',e=>console.log('pageerror',e.message))
 await page.goto(URL_QA,{waitUntil:'load'})
 await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:180000})
 const prepara=async(save,cidadeViva,vista,seconds)=>{
  await page.evaluate(([save,cidadeViva])=>{window.setComplexoSave(save);window.setComplexoPopulation({qaPopulation:true,cidadeViva})},[save,cidadeViva])
  await page.waitForTimeout(1500)
  await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:180000})
  await page.evaluate(v=>window.complexo3D.view(v),vista)
  // civis carregam sob demanda: alguns quadros com o relógio parado no mesmo segundo
  for(let i=0;i<5;i++){await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(700)}
  await page.evaluate(v=>window.complexo3D.view(v),vista)
  await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(500)
 }
 const shot=async name=>{if(SO&&!SO.includes(name))return;const el=await page.$('[data-complexo-3d]');await el.screenshot({path:`${OUT}mapa-obras-${name}-${tag}.png`});console.log('ok',name,tag,JSON.stringify(await page.evaluate(()=>window.complexo3D.inspect().cidadeViva)))}
 const full=await page.evaluate(()=>window.complexoFixtures.presets.complete)
 // 1) loja comprada nesta rodada: tapume + guindaste no lugar; 2) na rodada seguinte, pronta
 if(!SO||SO.includes('canteiro-loja')){await prepara({...full,ext:full.ext.filter(k=>k!=='loja')},{canteiros:[{obra:'loja'}],humor:'normal',carreata:false,cor:COR,cor2:COR2},'loja',3);await shot('canteiro-loja')}
 if(!SO||SO.includes('loja-pronta')){await prepara(full,{canteiros:[],humor:'normal',carreata:false,cor:COR,cor2:COR2},'loja',3);await shot('loja-pronta')}
 // 4) boteco: vitória × derrota
 if(!SO||SO.includes('boteco-vitoria')){await prepara(full,{canteiros:[],humor:'festa',carreata:false,cor:COR,cor2:COR2},'boteco-oswaldo',30);await shot('boteco-vitoria')}
 if(!SO||SO.includes('boteco-derrota')){await prepara(full,{canteiros:[],humor:'triste',carreata:false,cor:COR,cor2:COR2},'boteco-oswaldo',30);await shot('boteco-derrota')}
 // 5) carreata: o relógio do mapa posto no instante em que o ônibus aberto passa atrás do ponto de ônibus (vista 'onibus')
 await page.evaluate(()=>window.complexo3D.view('onibus'))
 const {camera:cam,target:alvo}=await page.evaluate(()=>window.complexo3D.inspect())
 // o ponto da volta mais perto do raio do meio da tela (câmera → alvo, no chão), na frente da câmera
 const rota=rotaCarreata(),total=poseNaRota(rota,0).total;let melhor=0,dist=Infinity
 const dx=alvo[0]-cam[0],dz=alvo[2]-cam[2],L=Math.hypot(dx,dz)
 for(let d=0;d<total;d+=1){const p=poseNaRota(rota,d),vx=p.x-cam[0],vz=p.z-cam[2],ao=(vx*dx+vz*dz)/L;if(ao<L)continue;const dd=Math.abs(vx*dz-vz*dx)/L+ao*.02;if(dd<dist){dist=dd;melhor=d}}
 if(!SO||SO.includes('carreata')){await prepara(full,{canteiros:[],humor:'festa',carreata:true,cor:COR,cor2:COR2},'onibus',melhor/5.2);await shot('carreata')}
 await page.close()
}
await browser.close()
