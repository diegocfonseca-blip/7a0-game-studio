// 🏀 Reels de lançamento do BidLegends (19/11). `node scripts/posts/video-bidlegends/render.mjs pt|en` → frames-<l>/ ; depois o ffmpeg (LEIAME.md)
import {createRequire} from 'node:module'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const D=new URL('./', import.meta.url).pathname,L=process.argv[2]==='en'?'en':'pt',PRE=process.argv[3]==='previa'
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:1080,height:1920}})
await p.goto('file://'+D+'video.html?l='+L);await p.waitForTimeout(1500)
const total=await p.evaluate(()=>window.TOTAL)
const FPS=30,N=Math.round(total*FPS),out=D+(PRE?'previa-':'frames-')+L+'/'
const {mkdirSync}=await import('node:fs');mkdirSync(out,{recursive:true})
for(let i=0;i<N;i+=PRE?30:1){
 await p.evaluate(t=>window.render(t),i/FPS)
 await p.evaluate(()=>Promise.all([...document.images].filter(x=>!x.complete).map(x=>new Promise(r=>{x.onload=x.onerror=r}))))
 await p.screenshot({path:`${out}f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:PRE?70:92})
}
console.log('frames',N,L)
await b.close()
