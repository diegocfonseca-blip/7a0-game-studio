import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const output=process.env.PARTIDA_OUTPUT??'/workspace/shared/partida-oficial-3d-20261120',origin=process.env.PARTIDA_ORIGIN??'http://127.0.0.1:4245'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:390,height:820}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve')})
await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
try{await page.goto(origin+'/7a0-game-studio/scripts/teste-partida-oficial-3d/?case=a&round=0',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.qaState,null,{timeout:90000});await page.waitForTimeout(2000);await page.getByRole('button',{name:/Começar o Carioca/i}).click();
await page.getByRole('button',{name:/Jogar no Campo 3D/i}).waitFor({state:'visible',timeout:30000});
await page.getByRole('button',{name:/Jogar no Campo 3D/i}).click();
const start=page.getByRole('button',{name:'▶ Começar o jogo',exact:true});await start.waitFor({state:'visible',timeout:150000});
await page.waitForFunction(()=>window.qaMatch?.preMatch&&window.__mapaApi?.inspect().match.detail?.actors===22,null,{timeout:120000});
const before=await page.evaluate(()=>({id:window.qaMatch.context.id,minute:window.qaMatch.minute,paused:window.qaMatch.paused,round:window.qaState.round}));
assert.equal(before.minute,0);assert(before.paused);await start.click();
await page.waitForFunction(()=>window.qaMatch&&!window.qaMatch.preMatch&&window.qaMatch.minute>0&&window.__mapaApi?.inspect().match.detail?.actors===22,null,{timeout:120000});
const playing=await page.evaluate(()=>({id:window.qaMatch.context.id,minute:window.qaMatch.minute,round:window.qaState.round,players:window.__mapaApi.inspect().match.players}));
assert.equal(playing.id,before.id);assert.equal(playing.round,0);assert.equal(playing.players,22);
await page.screenshot({path:output+'/copa-jogando.png'});
assert.deepEqual(errors,[]);writeFileSync(output+'/browser-copa.json',JSON.stringify({success:true,before,playing},null,2));console.log(JSON.stringify({success:true,before,playing}));}finally{await browser.close()}
