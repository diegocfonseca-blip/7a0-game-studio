// 🎬 Grava o pregão aberto de cara NOVA (a das contas de teste) numa partida rápida de verdade, com lances do "você".
// uso: node scripts/video-pregao-novo.mjs <pasta> <largura> <altura> <rivais: 19 = duas cartas · 9 = uma> <segundos>
// O log imprime OFFSET (segundos de carregamento) pra cortar o começo com ffmpeg -ss.
import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright')
import {mkdirSync} from 'node:fs'
process.env.DEPLOY_BASE='/';process.env.VITE_ONLY_GAME='escalacao'
const out=process.argv[2], W=+process.argv[3], H=+process.argv[4], rivals=+process.argv[5], segs=+process.argv[6]
mkdirSync(out,{recursive:true})
const {createServer}=await import('vite')
const port=5460+Math.floor(Math.random()*30)
const vite=await createServer({cacheDir:'/tmp/claude-0/vite-video-pregao',plugins:[{name:'qa',enforce:'pre',transform(code,id){
  if(id.endsWith('/src/escalacao/sport.ts'))return code.replace('let pregaoNovoOk = PREGAO_NOVO_GERAL','let pregaoNovoOk = true')
  if(id.endsWith('/src/escalacao/store.tsx'))return code.replace('.__escState = state','.__escState = state;(window as any).__escDispatch = rawDispatch')
}}],server:{host:'127.0.0.1',port,strictPort:true,hmr:false}});await vite.listen()
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:W<500?2:1,locale:'pt-BR',recordVideo:{dir:out,size:{width:W,height:H}}})
await ctx.route('**/*',r=>{const u=r.request().url();return u.startsWith(`http://127.0.0.1:${port}`)||u.startsWith('data:')?r.continue():r.abort()})
const p=await ctx.newPage();const tPage=Date.now();p.on('pageerror',e=>console.log('ERR',e.message))
await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'})
await p.waitForFunction(()=>window.__escDispatch,null,{timeout:150000})
await p.evaluate(r=>window.__escDispatch({type:'START',teamName:'Futpoint FC',formation:'4-3-3',rivals:r,pregaoAberto:true}),rivals)
await p.waitForTimeout(1500)
console.log('screen',await p.evaluate(()=>window.__escState.screen), 'pa',await p.evaluate(()=>!!window.__escState.pa))
// pula telas intermediárias clicando em botões de começar
for(let i=0;i<6;i++){ if(await p.evaluate(()=>!!window.__escState.pa))break; const bt=p.getByRole('button',{name:/começar|bora|iniciar|pregão|leilão|continuar|vamos/i}).first(); if(await bt.count()){await bt.click().catch(()=>{})} await p.waitForTimeout(1500)}
console.log('pa',await p.evaluate(()=>!!window.__escState.pa))
const t0=Date.now();console.log('OFFSET',(t0-tPage)/1000)
while(Date.now()-t0<segs*1000){
  const btn=p.locator('button:has-text("+1"):visible:not([disabled])')
  const n=await btn.count()
  if(n&&Math.random()<0.45){await btn.nth(Math.floor(Math.random()*n)).click({timeout:800}).catch(()=>{})}
  await p.waitForTimeout(900)
}
await p.screenshot({path:out+'/fim.png'})
await ctx.close();await b.close();await vite.close()
