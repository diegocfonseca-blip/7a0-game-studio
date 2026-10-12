const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright'),sharp=loadDependency('sharp');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({locale:'pt-BR',viewport:{width:1100,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');await page.waitForFunction(()=>!!window.renderScene);
 const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
 const full={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['cober']};
 const state={context:{id:'registration-full',stadium:full,home:team('h'),away:team('a'),homeBench:team('rh').slice(0,7),awayBench:team('ra').slice(0,7)},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'};
 const render=()=>page.evaluate(state=>window.renderScene(state.context.stadium,state),state);
 await render();await page.locator('.pe-live>summary').click();
 await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22');
 await page.waitForFunction(()=>[...document.querySelectorAll('.pe-live-world img')].every(i=>i.complete&&i.naturalWidth>0));
 const world=await page.locator('.pe-live-world').boundingBox(),viewport=await page.locator('.pe-live-viewport').boundingBox();
 assert.ok(world.x>=viewport.x-.5&&world.x+world.width<=viewport.x+viewport.width+.5,'Initial framing includes the whole stadium width');
 assert.ok(world.y>=viewport.y-.5&&world.y+world.height<=viewport.y+viewport.height+.5,'Initial framing includes the whole stadium height');
 assert.equal(await page.locator('.pe-live-foreground').count(),1);
 fs.mkdirSync('test-results/futebol-3d',{recursive:true});
 const before=await page.screenshot({path:'test-results/futebol-3d/estadio-integrado.png'});
 // Red sentinel stands in for any mesh crossing the foreground. Pixel proof,
 // rather than assuming that a higher z-index necessarily conceals the mesh.
 await page.locator('.pe-football-registered').evaluate(el=>{el.style.background='#ff0000';el.querySelector('canvas').style.visibility='hidden'});
 const after=await page.screenshot();
 const pixel=async(buffer,x,y)=>[...await sharp(buffer).extract({left:Math.round(world.x+x/1536*world.width),top:Math.round(world.y+y/1024*world.height),width:1,height:1}).removeAlpha().raw().toBuffer()];
 const grass=await pixel(before,700,500);assert.ok(grass[1]>grass[0]*1.15&&grass[1]>grass[2]*1.3,'A paused match repaints when the grass texture finishes loading');
 assert.deepEqual(await pixel(after,768,940),await pixel(before,768,940),'Foreground roof hides a mesh behind it');
 assert.deepEqual(await pixel(after,768,600),[255,0,0],'Sentinel is visible on the playable field');
 await page.locator('.pe-football-registered').evaluate(el=>{el.style.background='';el.querySelector('canvas').style.visibility=''});
 for(const stadium of [{inv:{},ext:[]},{inv:{grama:20,geral:20},ext:[]}]){
  state.context.id+='-partial';state.context.stadium=stadium;await render();
  await page.waitForFunction(()=>document.querySelector('.pe-football-registered')?.dataset.players==='22'&&!!document.querySelector('.pe-territory'));
  assert.equal(await page.locator('.pe-live-foreground').count(),0,'An incomplete stadium cannot show the complete front roof');
 }
 state.context.id='registration-image-failure';state.context.stadium=full;
 await page.route('**/estadio-partida/field-clean.webp',r=>r.abort());await page.reload();await page.waitForFunction(()=>!!window.renderScene);await render();await page.locator('.pe-live>summary').click();
 await page.waitForFunction(()=>!!document.querySelector('.pe-live-world .pe-territory')&&document.querySelector('.pe-football-registered')?.dataset.players==='22');
 assert.equal(await page.locator('.pe-live-foreground').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: complete stadium framing, mesh/architecture composition, foreground pixel occlusion, incomplete stages and failed image recovery. Local only.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
