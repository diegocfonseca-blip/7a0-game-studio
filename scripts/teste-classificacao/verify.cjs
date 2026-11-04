const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright-core');
const base = process.env.QA_ORIGIN || 'http://127.0.0.1:5340';
const out = 'test-results/classificacao-desktop';
// No real sessions, room messages, purchases or database requests.
const backend = `const result={data:[],error:null};const chain=new Proxy(function(){return chain},{get:(_,k)=>k==='then'?r=>Promise.resolve(r(result)):()=>chain});export const supabase={auth:{getUser:async()=>({data:{user:null},error:null}),getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>chain,rpc:async()=>result,channel:()=>chain,removeChannel(){},storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}})})}};`;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const errors=[],results=[];
 try{
  const page=await browser.newPage({locale:'pt-BR',viewport:{width:1366,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'text/javascript',body:backend}));
  for(const mode of ['sidebar','wide']){
   await page.goto(base+'/7a0-game-studio/scripts/teste-classificacao/index.html?mode='+mode);
   await page.locator('.ll-pyramid-tables table').first().waitFor({timeout:120000});
   const content=await page.locator('.ll-pyramid-tables').innerText();
   for(const width of [393,768,1099,1100,1366,1920]){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const measured=await page.locator('.ll-pyramid-tables').evaluate(grid=>({
     width:grid.clientWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
     cards:[...grid.children].map(c=>{const r=c.getBoundingClientRect(),t=c.querySelector('table').getBoundingClientRect();return {width:c.clientWidth,scroll:c.scrollWidth,x:r.x,y:r.y,tableRight:t.right,cardRight:r.right}}),
     rows:grid.querySelectorAll('tbody tr').length,
    }));
    assert.equal(measured.pageOverflow,false,mode+' '+width+': page overflow');
    assert.equal(measured.rows,80,'all four divisions and 80 teams remain');
    for(const c of measured.cards){assert(c.scroll<=c.width+1,mode+' '+width+': clipped standings');assert(c.tableRight<=c.cardRight+1,'last statistic must stay inside card')}
    if(mode==='sidebar'&&width>=1100)assert(measured.cards[1].y>measured.cards[0].y,'narrow match sidebar must stack divisions');
    if(mode==='wide'&&width>=1100)assert.equal(measured.cards[1].y,measured.cards[0].y,'wide standalone tables retain two columns');
    assert.equal(await page.locator('.ll-pyramid-tables').innerText(),content,'resizing must preserve standings');
    results.push({mode,viewport:width,...measured});
    if(width===1366||width===393)await page.screenshot({path:out+'/'+mode+'-'+width+'.png'});
   }
  }
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(out+'/report.json',JSON.stringify({errors,results},null,2));await browser.close()}
 console.log('PASS: 12 responsive layouts, no clipped scores or horizontal card overflow, standings preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
