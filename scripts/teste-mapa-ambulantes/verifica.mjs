import {chromium} from 'playwright-core'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const base='http://127.0.0.1:4201',out='/workspace/shared/mapa-ambulantes-20261114';mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--mute-audio']})
const report={errors:[],cases:[]}
try{
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'pt-BR',reducedMotion:'reduce'})
 await c.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'))
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());await c.routeWebSocket('**/*',w=>w.close())
 const p=await c.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>report.errors.push(e.message))
 await p.goto(base+'/7a0-game-studio/scripts/teste-mapa-ambulantes/index.html',{waitUntil:'domcontentloaded'})
 await p.waitForFunction(()=>!!window.api&&!!window.scene)
 async function inspect(){return p.evaluate(()=>{const w=window,s=w.api.inspect(),root=w.scene.getObjectByName('stadium-matchday'),isVisible=o=>{while(o){if(!o.visible)return false;o=o.parent}return true};return{journey:s.journey,matchday:s.matchday,stalls:root.children.flatMap(x=>x.name==='matchday-street-stalls'?x.children.filter(o=>o.name.startsWith('matchday-stall-')).map(o=>({name:o.name,position:o.position.toArray(),visible:isVisible(o),meshes:o.children.length})):[])}})}
 await p.evaluate(()=>window.api.qaOlhar([0,0,110],[0,100,210]));report.cases.push({name:'entre-jogos',...await inspect()});await p.locator('.pc3-stage').screenshot({path:out+'/entre-jogos.png'})
 await p.evaluate(()=>window.setPhase('playing'));await p.waitForFunction(()=>window.api.inspect().matchday.active)
 await p.evaluate(()=>window.api.seekCirculation(80));await p.waitForTimeout(500)
 const live=await inspect();assert.equal(live.stalls.length,6);assert(live.stalls.every(s=>s.visible&&s.meshes>0),'Seis barracas presentes durante partida, inclusive no Leve');report.cases.push({name:'partida-rolando',...live});await p.locator('.pc3-stage').screenshot({path:out+'/partida-rolando.png'})
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report.cases.map(c=>({name:c.name,active:c.matchday.active,visible:c.stalls.filter(s=>s.visible).length,phases:c.matchday.vendors.map(v=>v.delivery?.frame.phase??'a-pe')}))))
}finally{writeFileSync(out+'/verificacao.json',JSON.stringify(report,null,2));await browser.close()}
