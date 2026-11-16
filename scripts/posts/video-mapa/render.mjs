import {createRequire} from 'node:module'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const D='/tmp/claude-0/-home-user-7a0-game-studio/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/scratchpad/video/'
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:1080,height:1920}})
await p.goto('file://'+D+'video.html');await p.waitForTimeout(1500)
const total=await p.evaluate(()=>window.TOTAL)
const FPS=30,N=Math.round(total*FPS)
const {mkdirSync}=await import('node:fs');mkdirSync(D+'frames',{recursive:true})
for(let i=0;i<N;i++){
 await p.evaluate(t=>window.render(t),i/FPS)
 await p.evaluate(()=>Promise.all([...document.images].filter(x=>!x.complete).map(x=>new Promise(r=>{x.onload=x.onerror=r}))))
 await p.screenshot({path:`${D}frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})
}
console.log('frames',N)
await b.close()
