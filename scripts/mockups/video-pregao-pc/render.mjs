import {createRequire} from 'node:module'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const D=new URL('./', import.meta.url).pathname
const only=process.argv.slice(2).map(Number)
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:1280,height:800}})
await p.goto('file://'+D+'video.html');await p.waitForTimeout(2000)
const total=await p.evaluate(()=>window.TOTAL)
const FPS=30
const {mkdirSync}=await import('node:fs');mkdirSync(D+'frames',{recursive:true})
if(only.length){for(const t of only){await p.evaluate(t=>window.render(t),t);await p.screenshot({path:`${D}t${t}.png`})}}
else for(let i=0;i<Math.round(total*FPS);i++){
 await p.evaluate(t=>window.render(t),i/FPS)
 await p.screenshot({path:`${D}frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})
}
await b.close()
