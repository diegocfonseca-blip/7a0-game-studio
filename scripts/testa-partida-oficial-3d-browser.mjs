import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const output=process.env.PARTIDA_OUTPUT??'/workspace/shared/partida-oficial-3d-20261120'
const origin=process.env.PARTIDA_ORIGIN??'http://127.0.0.1:4245',manual=process.env.PARTIDA_MANUAL!=='0',round=Number(process.env.PARTIDA_ROUND??9),width=Number(process.env.PARTIDA_WIDTH??390)
const targetRound=round>=12?13:11,expectedTeams=targetRound===13?['Brasiliense','Luverdense']:['Primavera-MT','Brasiliense']
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width,height:820},locale:'pt-BR'}),errors=[]
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000)
await page.addInitScript(manual=>{localStorage.setItem('bl_lang','pt');localStorage.setItem('pc3-qualidade-v1','leve');localStorage.setItem('esc-sim-manual',manual?'1':'0')},manual)
await page.route('**/*',r=>r.request().url().startsWith(origin+'/')||r.request().url().startsWith('data:')?r.continue():r.abort())
const snapshot=()=>page.evaluate(()=>{const m=window.qaMatch;return{round:window.qaState.round,map:window.__mapaApi?.inspect(),match:m&&{id:m.context.id,input:m.officialInput,preMatch:m.preMatch,minute:m.minute,paused:m.paused,finished:m.finished,score:[m.homeScore,m.awayScore],teams:m.officialTeams,clock:m.visualClock,xi:[m.context.home.map(p=>p.id),m.context.away.map(p=>p.id)]}}})
const skipPress=async()=>{const b=page.getByRole('button',{name:/Pular a coletiva/i});if(await b.count())await b.click()}
try{
 await page.goto(`${origin}/7a0-game-studio/scripts/teste-partida-oficial-3d/?round=${round}`,{waitUntil:'domcontentloaded',timeout:90000})
 await page.waitForFunction(()=>window.qaState,null,{timeout:90000});console.log('Carreira carregada')
 // Complete the current real match, then return to the weekly calendar.
 if(round%2===1){
  await page.getByRole('button',{name:'Jogos + Tabela',exact:true}).last().click()
  await page.waitForTimeout(30000);await skipPress()
  await page.getByRole('button',{name:'Central',exact:true}).last().click()
 }
 const choice=page.getByRole('button',{name:'🏟️ Campo 3D',exact:true})
 const skip=page.getByRole('button',{name:/Pular pro jogo/i})
 // The April 5 gap must never offer an empty 3D game. Advance the idle week.
 for(let i=0;i<35&&!await choice.count();i++){
  await skipPress()
  if(await skip.count())await skip.first().click()
  await page.waitForTimeout(700)
 }
 await choice.waitFor({state:'visible',timeout:90000})
 assert.equal(await page.evaluate(()=>window.qaState.round),targetRound-1,'A Série D passa a semana sem jogo antes de oferecer a partida da rodada 11')
 assert((await page.locator('body').innerText()).includes(targetRound===13?'26 DE ABRIL':'12 DE ABRIL'),'A escolha ocorre na data da partida real')
 console.log('Data e adversário corretos');await choice.click()
 const start=page.getByRole('button',{name:'▶ Começar o jogo',exact:true})
 await page.waitForFunction(()=>window.__mapaApi?.inspect().intro?.running,null,{timeout:150000})
 assert.equal(await start.count(),0,'Sem botão durante o giro')
 await start.waitFor({state:'visible',timeout:150000})
 await page.waitForFunction(()=>window.__mapaApi.inspect().match.players===22,null,{timeout:90000})
 const before=await snapshot();console.log('Giro concluído; 22 jogadores posicionados')
 assert.equal(before.round,targetRound-1);assert.equal(before.match.preMatch,true);assert.equal(before.match.minute,0);assert.equal(before.match.paused,true);assert.deepEqual(before.match.score,[0,0]);assert.equal(before.match.clock.running,false)
 assert.deepEqual(before.match.teams,expectedTeams)
 await page.waitForTimeout(1500);assert.equal((await snapshot()).match.minute,0,'A apresentação não joga sozinha')
 await page.screenshot({path:`${output}/pronto-${manual?'manual':'auto'}-${width}.png`})
 await start.click()
 await page.waitForFunction(targetRound=>window.qaState.round===targetRound&&window.__mapaApi?.inspect().match.players===22&&window.qaMatch?.minute>0,targetRound,{timeout:120000})
 const playing=await snapshot()
 assert.equal(playing.match.id,before.match.id);assert.deepEqual(playing.match.xi,before.match.xi);assert(!playing.match.preMatch);assert(playing.map.focus.locked);assert.equal(playing.map.match.detail?.actors,22,'Os bonecos já carregados continuam visíveis depois do início')
 const minute=playing.match.minute
 await page.waitForFunction(minute=>window.qaMatch?.minute>minute,minute,{timeout:90000})
 await page.waitForFunction(()=>window.__mapaApi.inspect().match.detail?.actors===22,null,{timeout:120000})
 await page.screenshot({path:`${output}/jogando-${manual?'manual':'auto'}-${width}.png`})
 assert.deepEqual(errors,[])
 writeFileSync(`${output}/browser-${manual?'manual':'auto'}-${width}.json`,JSON.stringify({success:true,manual,width,before,playing,errors},null,2))
 console.log(JSON.stringify({success:true,manual,width,round:playing.round,teams:playing.match.teams,players:playing.map.match.players,minute:playing.match.minute,errors}))
}catch(error){await page.screenshot({path:`${output}/falha-${manual?'manual':'auto'}.png`});writeFileSync(`${output}/falha-${manual?'manual':'auto'}.json`,JSON.stringify({error:error.message,errors,state:await snapshot(),body:await page.locator('body').innerText()},null,2));throw error}
finally{await browser.close()}
