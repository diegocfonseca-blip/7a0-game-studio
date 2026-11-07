// 🥅 Quadros e vídeo da disputa de pênaltis no campinho 2D (07/11). Bancada local, dados de demonstração, SEM conta de
// ninguém: o backend é trocado por um stub e toda conexão externa é bloqueada.
//   npx vite --port 5340 --host 127.0.0.1   (em outro terminal)
//   node scripts/teste-penaltis-campo/quadros-2d.cjs <sala|mundo|carreira> <pasta> [video]
//   (com `video`: grava PNGs v0000.png… a 12 por segundo; depois `ffmpeg -framerate 12 -i <pasta>/v%04d.png … penaltis-2d.mp4`)
const fs=require('node:fs'),path=require('node:path');const{chromium}=require('playwright-core')
const base=process.env.QA_ORIGIN||'http://127.0.0.1:5340'
const [modo='sala',pasta='test-results/penaltis-2d',video]=process.argv.slice(2)
const test=fs.readFileSync('scripts/teste-penaltis-campo/browser.cjs','utf8'),backend=test.match(/const backend=`([\s\S]*?)`;/)[1]
;(async()=>{
 fs.mkdirSync(pasta,{recursive:true})
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']})
 const context=await browser.newContext({locale:'pt-BR',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true})
 const page=await context.newPage(),erros=[]
 page.on('pageerror',e=>erros.push(e.message))
 await page.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort())
 await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:backend}))
 const url=base+'/7a0-game-studio/scripts/teste-penaltis-campo/index.html?modo='+(modo==='carreira'?'direto&speed=2':modo)
 const t0=Date.now()
 await page.goto(url)
 await page.waitForFunction(()=>window.penaltisQA?.session,undefined,{timeout:120000})
 await page.evaluate(()=>{const c=document.querySelector('canvas');if(c)c.scrollIntoView({block:'start'});window.scrollBy(0,-6)})
 const inicio=(Date.now()-t0)/1000
 const lista=[]
 let n=0
 if(video){
  // 🎞️ vídeo quadro a quadro: a disputa fica PAUSADA e a gravação põe o relógio dela no instante de cada quadro (12 por
  // segundo de tela, na velocidade da bancada), então o vídeo sai liso e no tempo certo, sem depender da máquina que grava
  await page.evaluate(()=>window.penaltisQA.pausar?.(true))
  await page.waitForTimeout(300)
  const vel=modo==='carreira'?2:1
  for(let k=0;n<2400;k++){
   const fim=await page.evaluate(([e])=>{const s=window.penaltisQA.session;s.elapsed=Math.min(e,s.duracaoCena);return e>=s.duracaoCena+2},[k*vel/12])
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
   await page.screenshot({path:path.join(pasta,`v${String(n++).padStart(4,'0')}.png`)})
   if(fim)break
  }
  await context.close();await browser.close()
  console.log(JSON.stringify({modo,erros,quadros:n}));return
 }
 while(!(await page.evaluate(()=>window.penaltisQA.session.elapsed>=window.penaltisQA.session.duracaoCena))){
  const info=await page.evaluate(()=>{const s=window.penaltisQA.session;const e=s.estado;return {t:s.elapsed,fase:e.fase,cobranca:e.cobranca,placar:e.placar,msg:e.mensagem}})
  const f=path.join(pasta,`q${String(n++).padStart(3,'0')}.png`)
  await page.screenshot({path:f})
  lista.push({f,...info})
  await page.waitForTimeout(modo==='carreira'?1500:400)
  if(n>600)break
 }
 await page.waitForTimeout(1500)
 await page.screenshot({path:path.join(pasta,`q${String(n++).padStart(3,'0')}.png`)})
 fs.writeFileSync(path.join(pasta,'quadros.json'),JSON.stringify({erros,inicio,lista},null,1))
 await context.close();await browser.close()
 console.log(JSON.stringify({modo,erros,quadros:n,inicio}))
})().catch(e=>{console.error(e);process.exit(1)})
