// cobre nome/rosto/clube das telas reais do jogo (anúncio do Meta não aceita jogador famoso sem autorização)
import {createRequire} from 'node:module'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const D=new URL('./', import.meta.url).pathname
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:780,height:1688}})
const FONTE=`@font-face{font-family:Osw;src:url(oswald-latin-700-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}body{width:780px;height:1688px;position:relative;overflow:hidden;background:#000}`
const coberta=`<div style="position:absolute;left:196px;top:1066px;width:384px;height:116px;background:#E8DFC4;padding:14px 16px">
 <div style="font:700 44px Osw;color:#0C0C0C;letter-spacing:6px">? ? ? ? ?</div>
 <div style="font:600 21px sans-serif;color:#7a705a;margin-top:4px">??? · ????</div></div>`
const lenda=`<div style="position:absolute;left:190px;top:622px;width:402px;height:562px;border:4px solid #0C0C0C;border-radius:22px;overflow:hidden;
 background:linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70);box-shadow:5px 6px 0 #0C0C0C">
 <div style="position:absolute;left:24px;top:24px;background:#0C0C0C;color:#fff;font:700 24px Osw;padding:2px 12px;border-radius:9px">MEI</div>
 <div style="position:absolute;right:22px;top:26px;font:700 22px Osw;color:#7a4d00">👑 LENDA</div>
 <div style="position:absolute;left:50%;top:92px;margin-left:-110px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.45);border:4px solid rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:120px">👑</div>
 <div style="position:absolute;left:24px;right:24px;top:330px;font:700 40px Osw;color:#0C0C0C;letter-spacing:1px;white-space:nowrap">LENDA REVELADA!</div>
 <div style="position:absolute;left:24px;top:394px;width:230px;height:22px;border-radius:8px;background:rgba(122,77,0,.35);filter:blur(5px)"></div>
 <div style="position:absolute;left:24px;top:430px;font-size:30px;color:#fff;text-shadow:0 0 2px #a06a00">⭐⭐⭐⭐⭐</div>
 <div style="position:absolute;left:24px;right:24px;top:482px;font:italic 600 21px sans-serif;color:#3d2a00">Quem era? Só quem levou sabe 😏</div></div>`
const peças=[['z-pa04.png',coberta],['z-pa08.png',coberta],['z-pa12.png',coberta],['z-pa16.png',coberta],['z-pa17.png',coberta],['z-pa18.png',coberta],['z-pa19.png',coberta],['z-pa21.png',lenda]]
const {writeFileSync}=await import('node:fs')
for(const [f,over] of peças){
 writeFileSync(D+'_c.html',`<html><head><style>${FONTE}</style></head><body><img src="${f}" style="width:780px;display:block">${over}</body></html>`)
 await p.goto('file://'+D+'_c.html');await p.waitForTimeout(400)
 await p.screenshot({path:D+'a'+f.slice(1)})
}
await b.close()
console.log('ok')
