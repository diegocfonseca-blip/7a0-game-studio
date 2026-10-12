const assert=require('node:assert/strict');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({locale:'pt-BR',viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
 const stadium={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober','asfalto','hotel']};
 const team=s=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos}));
 const state={context:{id:'rotation',stadium,home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 for(const field of [true,false]){
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(({stadium,state,field})=>window.renderScene(stadium,field?state:undefined),{stadium,state,field});
  if(field){await page.locator('.pe-live>summary').click();await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22')}
  const selector=field?'.pe-live-viewport':'.pe-map-viewport',world=field?'.pe-live-world':'.pe-map-world';
  for(let n=0;n<4;n++)await page.getByRole('button',{name:field?'Aproximar campo':'Aproximar mapa',exact:true}).click();
  const rect=await page.locator(selector).boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+50,y+35,{steps:5});await page.mouse.up();
  const center=()=>page.locator(selector).evaluate((el,world)=>{const v=el.getBoundingClientRect(),w=el.querySelector(world).getBoundingClientRect();return [(v.x+v.width/2-w.x)/w.width,(v.y+v.height/2-w.y)/w.height]},world);
  const before=await center();assert.ok(Math.abs(before[0]-.5)>.005,'Fixture actually pans off center');
  const frozen=field?await page.locator('.pe-football-registered').getAttribute('data-ball'):null;
  for(const viewport of [{width:844,height:390},{width:1100,height:950},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(({selector,world,before})=>{const el=document.querySelector(selector),v=el.getBoundingClientRect(),w=el.querySelector(world).getBoundingClientRect();return Math.abs((v.x+v.width/2-w.x)/w.width-before[0])<.0001&&Math.abs((v.y+v.height/2-w.y)/w.height-before[1])<.0001},{selector,world,before});
   if(field)assert.equal(await page.locator('.pe-football-registered').getAttribute('data-ball'),frozen,'Rotating does not move the paused ball');
  }
  await page.getByRole('button',{name:field?'VER CAMPO':'VER TUDO',exact:true}).click();
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(({selector,world})=>{const v=document.querySelector(selector).getBoundingClientRect(),w=document.querySelector(world).getBoundingClientRect();return w.left>=v.left-.5&&w.right<=v.right+.5&&w.top>=v.top-.5&&w.bottom<=v.bottom+.5},{selector,world});
 }
 assert.deepEqual(errors,[]);console.log('PASS: field and NPC map preserve the viewed location across portrait, landscape, desktop and back; paused ball and overview remain correct.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
