const assert=require('node:assert/strict');
const {loadDependency}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright'),sharp=loadDependency('sharp');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1100,height:1000},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderSync);
 const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
 const state={context:{id:'lighting',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 const sample=async(stadium,expected)=>{
  state.context.stadium=stadium;await page.evaluate(state=>window.renderSync(state,state.context.id),state);
  await page.waitForFunction(expected=>{const n=document.querySelector('.pe-map .pe-football-registered');return n?.dataset.players==='22'&&n.dataset.floodlit===String(expected)},expected);
  // Texture callbacks repaint paused scenes; allow cached image decode to finish.
  await page.waitForTimeout(250);
  const box=await page.locator('.pe-map-world:visible').boundingBox();
  const buffer=await page.screenshot({clip:{x:Math.round(box.x+700/1536*box.width),y:Math.round(box.y+350/1024*box.height),width:1,height:1}});
  return [...await sharp(buffer).removeAlpha().raw().toBuffer()];
 };
 const off=await sample({inv:{grama:30,geral:40},ext:[]},false);
 const on=await sample({inv:{grama:30,geral:40},ext:['refl']},true);
 assert.ok(on[1]>off[1]+5,'Purchased and unlocked reflectors visibly illuminate the actual 3D turf');
 const locked=await sample({inv:{grama:30,geral:20},ext:['refl']},false);
 assert.ok(Math.abs(locked[1]-off[1])<=2,'A partial general stand does not activate the lighting');
 assert.deepEqual(errors,[]);
 console.log('PASS: reflector purchase changes real 3D turf pixels; incomplete stand keeps them off; paused scene updates.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
