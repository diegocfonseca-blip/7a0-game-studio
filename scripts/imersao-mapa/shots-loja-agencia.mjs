// 📸 Loja do Clube + Agência no mapa 3D (05/11). Uso (vite em 127.0.0.1:4199):
// OUT=scripts/mockups/loja-agencia-depois.png SHOT=topo node scripts/imersao-mapa/shots-loja-agencia.mjs
// SHOT=topo (TOPO=x,z,altura) · SHOT=olhar (OLHAR=ax,ay,az|cx,cy,cz) · SHOT=<vista do mapa>
// MARCAS='[{"x":..,"z":..,"t":"LOJA"}]' desenha rótulos sobre pontos do mundo.
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)('playwright')
const URL_QA='http://127.0.0.1:4199/7a0-game-studio/qa-presidencia-complexo-3d.html?reviewClub=1'
const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'pt-BR'})
page.on('pageerror',e=>console.log('pageerror',e.message))
await page.goto(URL_QA,{waitUntil:'load'})
await page.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000})
await page.waitForTimeout(4000)
const shot=process.env.SHOT??'topo'
const olhar=async()=>{
 if(shot==='topo'){
  const [tx,tz,h]=(process.env.TOPO??'40,40,330').split(',').map(Number)
  await page.evaluate(([tx,tz,h])=>window.complexo3D.qaOlhar([tx,0,tz],[tx,h,tz+h*.3]),[tx,tz,h])
 }else if(shot==='olhar'){
  const [a,b]=process.env.OLHAR.split('|').map(s=>s.split(',').map(Number))
  await page.evaluate(([a,b])=>window.complexo3D.qaOlhar(a,b),[a,b])
 }else await page.evaluate(v=>window.complexo3D.view(v),shot)
}
await page.$eval("[data-complexo-3d]",e=>e.scrollIntoView({block:"start"}))
await olhar()
for(let i=0;i<4;i++){await page.evaluate(()=>window.complexo3D.seekCirculation(40));await page.waitForTimeout(900)}
await olhar();await page.waitForTimeout(800)
if(process.env.MARCAS){
 const marks=JSON.parse(process.env.MARCAS)
 const info=await page.evaluate(()=>{const i=window.complexo3D.inspect();return{cam:i.camera,target:i.target,fov:i.cameraFov,vp:i.viewport}})
 // projeção manual (câmera perspectiva olhando pro alvo)
 const [cx,cy,cz]=info.cam,[tx,ty,tz]=info.target
 const f=[tx-cx,ty-cy,tz-cz],fl=Math.hypot(...f);f.forEach((v,i)=>f[i]=v/fl)
 let r=[f[1]*0-f[2]*1,f[2]*0-f[0]*0,f[0]*1-f[1]*0];const rl=Math.hypot(...r);r=r.map(v=>v/rl)
 const u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]]
 const t=Math.tan(info.fov*Math.PI/360),asp=info.vp[0]/info.vp[1]
 const pts=marks.map(m=>{const d=[m.x-cx,(m.y??6)-cy,m.z-cz];const zc=d[0]*f[0]+d[1]*f[1]+d[2]*f[2];return{...m,sx:.5+(d[0]*r[0]+d[1]*r[1]+d[2]*r[2])/(zc*t*asp)/2,sy:.5-(d[0]*u[0]+d[1]*u[1]+d[2]*u[2])/(zc*t)/2}})
 await page.evaluate(pts=>{
  const el=document.querySelector('[data-complexo-3d]'),b=el.getBoundingClientRect()
  for(const m of pts){const d=document.createElement('div');d.textContent=m.t;Object.assign(d.style,{position:'fixed',left:(b.left+m.sx*b.width+(m.dx??0))+'px',top:(b.top+m.sy*b.height+(m.dy??0))+'px',transform:'translate(-50%,-100%)',background:m.c??'#FFC400',color:'#0c0c0c',font:'900 12px Oswald,Arial',padding:'3px 7px',border:'3px solid #000',borderRadius:'8px',boxShadow:'3px 3px 0 #000',zIndex:99999,whiteSpace:'nowrap',pointerEvents:'none'});if(m.mini)Object.assign(d.style,{font:'700 8px Arial',padding:'0 2px',border:'1px solid #000',boxShadow:'none',borderRadius:'2px',transform:'translate(-50%,-50%)',background:'rgba(255,255,255,.75)'});document.body.appendChild(d)}
 },pts)
}
const el=await page.$("[data-complexo-3d]");const bb=await el.boundingBox();await page.screenshot({path:process.env.OUT,clip:bb})
console.log(JSON.stringify(await page.evaluate(()=>{const i=window.complexo3D.inspect();return{cam:i.camera,target:i.target,clubPlaces:i.clubPlaces,view:i.view,localLife:i.localLife,circulationProblems:JSON.stringify(i.circulation).match(/problem[^\]]*\]/g)?.slice(0,4)}})))
await browser.close()
