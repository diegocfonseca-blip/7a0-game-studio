const fs=require('node:fs');const{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const origin='http://127.0.0.1:5321',out='test-results/saida-bola/ui';
const fakeBackend=`const user={id:'00000000-0000-4000-8000-000000000001',email:'diego.c.fonseca@gmail.com',user_metadata:{}};
window.qaBlockedWrites=[];
const query=(table)=>{let single=false;let q;const result=()=>({data:single?null:[],error:null,count:0});q=new Proxy({}, {get:(_,name)=>{if(name==='then')return(resolve,reject)=>Promise.resolve(result()).then(resolve,reject);if(name==='catch')return reject=>Promise.resolve(result()).catch(reject);if(name==='maybeSingle'||name==='single')return()=>{single=true;return q};if(['insert','update','delete','upsert'].includes(name))return()=>{window.qaBlockedWrites.push({table,operation:name});return q};return()=>q}});return q};
export const supabase={auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:query,rpc:()=>Promise.resolve({data:null,error:null}),channel:()=>query('local-channel'),removeChannel:async()=>{},storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}})})}};`;
(async()=>{fs.mkdirSync(out,{recursive:true});const options=browserOptions();options.args=[...options.args,'--remote-debugging-port=9236'];
const browser=await loadDependency('playwright').chromium.launch(options),page=await browser.newPage({viewport:{width:1024,height:820}}),errors=[];
await page.addInitScript(()=>{window.__careerOfflineHarness=true});
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
await page.route('**/src/lib/supabase.ts*',r=>r.fulfill({contentType:'application/javascript',body:fakeBackend}));
// Observation hook only: all UI, timers, map, physics and player code stay real.
await page.route('**/src/escalacao/presidencia-complexo-3d.tsx*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace('ready.current?.(api.current);','globalThis.qaMap=api.current;globalThis.qaScene=scene;ready.current?.(api.current);');await r.fulfill({response,body});});
await page.goto(origin+'/scripts/futebol3d/saida-carreira.html');await page.waitForFunction(()=>window.qaCareer||window.qaCareerError,{},{timeout:120000});await page.waitForTimeout(1500);
fs.writeFileSync(out+'/initial.json',JSON.stringify(await page.evaluate(()=>({error:window.qaCareerError,screen:window.qaCareer?.state.screen,round:window.qaCareer?.state.round,season:window.qaCareer?.state.seasonNo,text:document.body.innerText,buttons:[...document.querySelectorAll('button')].map(b=>({text:b.innerText,aria:b.getAttribute('aria-label')}))})),null,2));await page.screenshot({path:out+'/initial.png'});console.log('READY CDP 9236',errors.length);await new Promise(()=>{});
})().catch(e=>{console.error(e.stack);process.exitCode=1});
