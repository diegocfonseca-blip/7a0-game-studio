// 📸 Fotos do dia inteiro do bairro (04/11), celular 390×844:
//  manhã  — padaria + bicicleta do pão + Kombi do gás passando na porta (o segundo certo sai da própria volta);
//  tarde  — praça (dominó e carrinhos de sorvete/pipoca) + varal com a camisa do clube (2 quadros empilhados);
//  noite  — espetinho e podrão na travessa + cadeira de praia na calçada + a TV do Boteco do Oswaldo (3 quadros);
//  dia de jogo em casa — camelô de camisa pirata e churrasquinho de gato no portão + flanelinha no estacionamento (2 quadros).
// Uso (com o vite de pé): PORT=4202 node scripts/imersao-mapa/shots-bairro-dia.mjs   (SO=manha,tarde,noite,diadejogo)
import {createRequire} from 'node:module'
import {writeFileSync} from 'node:fs'
const {chromium}=createRequire(import.meta.url)('playwright')
const PORT=process.env.PORT??'4201'
const BASE=`http://127.0.0.1:${PORT}/7a0-game-studio/`
const OUT=process.env.OUT??'scripts/mockups/'
const SO=process.env.SO?.split(',')
const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'pt-BR'})
page.on('pageerror',e=>console.log('pageerror',e.message))
page.on('console',m=>{if(/bairro|error/i.test(m.text()))console.log('console',m.text())})
await page.goto(BASE+'qa-presidencia-complexo-3d.html',{waitUntil:'load'})
await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
const prepara=async(modo,vista,seconds)=>{
 await page.evaluate(m=>window.qaBairro(m,{gf:2,ga:1},['#1B7A3D','#FFC400']),modo)
 await page.waitForTimeout(1500)
 await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
 if(seconds==='padaria')seconds=await page.evaluate(async base=>{
  // o segundo em que a Kombi (mão de cá) e a bicicleta (mão de lá) passam na frente da padaria
  const B=await import(base+'src/escalacao/presidencia-bairro-tradicoes.ts'),L=window.complexo3D.inspect().tradicoes.lugares,p=L.padaria
  let best=[1e9,0];for(let t=0;t<4000;t+=.1){const k=B.poseNaVolta(L.kombi,t*2.2),b=B.poseNaVolta(L.bicicleta,t*3.1+40);const d=Math.hypot(k.x-(p.x-1.5),k.z-(p.frente+13))+.5*Math.hypot(b.x-(p.x+3.5),b.z-(p.frente+13))
   if(d<best[0])best=[d,t]}
  return best[1]},'/7a0-game-studio/')
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 for(let i=0;i<6;i++){await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(900)}
 await page.evaluate(v=>window.complexo3D.view(v),vista)
 await page.evaluate(s=>window.complexo3D.seekCirculation(s),seconds);await page.waitForTimeout(700)
}
const quadro=async()=>{const el=await page.$('[data-complexo-3d]');return (await el.screenshot()).toString('base64')}
// empilha os quadros (cada um sem a faixa de botões de cima) num PNG só, desenhando num canvas da própria página
const empilha=async(name,quadros,titulos)=>{
 const out=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1})
 const png=await out.evaluate(async([qs,ts])=>{
  const imgs=await Promise.all(qs.map(b=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+b})))
  const corte=150,W=imgs[0].width,hs=imgs.map(i=>Math.min(i.height-corte,640)),faixa=64
  const c=document.createElement('canvas');c.width=W;c.height=hs.reduce((a,h)=>a+h+faixa,0);const g=c.getContext('2d')
  let y=0;imgs.forEach((im,k)=>{g.fillStyle='#0C0C0C';g.fillRect(0,y,W,faixa);g.fillStyle='#FFC400';g.font='900 27px Oswald, Impact, sans-serif';g.textBaseline='middle';g.fillText(ts[k],22,y+faixa/2+2);y+=faixa
   g.drawImage(im,0,corte,W,hs[k],0,y,W,hs[k]);y+=hs[k]})
  return c.toDataURL('image/png').split(',')[1]},[quadros,titulos])
 writeFileSync(`${OUT}mapa-bairro-${name}.png`,Buffer.from(png,'base64'));await out.close()
}
const relata=async name=>console.log('ok',name,JSON.stringify(await page.evaluate(()=>window.complexo3D.inspect().tradicoes?.dia)))
if(!SO||SO.includes('manha')){await prepara('segunda-manha','padaria','padaria');const el=await page.$('[data-complexo-3d]');await el.screenshot({path:`${OUT}mapa-bairro-manha.png`});await relata('manha')}
if(!SO||SO.includes('tarde')){
 await prepara('quinta-tarde','praca-bairro',12);const a=await quadro();await relata('tarde')
 await prepara('quinta-tarde','varal',12);const b=await quadro()
 await empilha('tarde',[a,b],['TARDE · PRAÇA: DOMINÓ, SORVETE E PIPOCA','TARDE · VARAL COM A CAMISA DO CLUBE'])
}
if(!SO||SO.includes('noite')){
 await prepara('quarta-noite','espetinho',12);const a=await quadro();await relata('noite')
 await prepara('quarta-noite','cadeiras',12);const b=await quadro()
 await prepara('quarta-noite','tv-boteco',12);const c=await quadro()
 await empilha('noite',[a,b,c],['NOITE · ESPETINHO NA BRASA E PODRÃO','NOITE · CADEIRA NA CALÇADA','NOITE · TV LIGADA NO OSWALDO'])
}
if(!SO||SO.includes('diadejogo')){
 await prepara('dia-de-jogo','jogo-bairro',40);const a=await quadro();await relata('diadejogo')
 await prepara('dia-de-jogo','flanelinha',40);const b=await quadro()
 await empilha('diadejogo',[a,b],['JOGO EM CASA · CAMISA PIRATA E GATINHO','JOGO EM CASA · FLANELINHA'])
}
await browser.close()
