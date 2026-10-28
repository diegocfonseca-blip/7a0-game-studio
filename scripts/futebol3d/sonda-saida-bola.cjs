const fs=require('node:fs');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const origin=process.env.PROBE_ORIGIN||'http://127.0.0.1:5321';
const out=process.env.PROBE_OUT||'test-results/saida-bola/antes';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await loadDependency('playwright').chromium.launch(browserOptions());
try{const p=await browser.newPage({viewport:{width:1024,height:640}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
await p.goto(origin+'/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});
if(await p.evaluate(()=>window.mapAuditError))throw Error(await p.evaluate(()=>window.mapAuditError));
const rows=[];for(let n=0;n<=600;n+=60){const batch=await p.evaluate(n=>{const rows=[];for(let i=n;i<Math.min(n+60,601);i++){
const s=mapAudit.seek(i/30);if(i%3)continue;rows.push({time:s.time,phase:s.phase,owner:s.owner,restart:s.restart,events:s.official?.events,fouls:s.detail?.football?.fouls,
actors:s.actors.map(a=>({key:a.key,position:a.position,head:a.bones.mixamorigHead,hips:a.bones.mixamorigHips,action:s.detail?.football?.actions?.find(x=>x.key===a.key)?.tiro,reaction:s.detail?.football?.fouls?.active?.find(x=>x.key===a.key)}))});}return rows},n);rows.push(...batch);}
const falls=rows.flatMap(r=>r.actors.filter(a=>a.head?.[1]<1||a.hips?.[1]<.45).map(a=>({time:r.time,...a}))),unique=[...new Set(falls.map(a=>a.action?.nome))];
fs.writeFileSync(out+'/trace.json',JSON.stringify({errors,rows,falls}));console.log(JSON.stringify({frames:rows.length,errors,falls:falls.length,clips:unique,examples:falls.slice(0,7),events:rows.at(-1).events},null,2));
for(const t of [...new Set([0,1,2,4,8,...falls.slice(0,2).map(x=>x.time)])]){const jpg=await p.evaluate(t=>mapAudit.capture(t,'analysis'),t);fs.writeFileSync(out+'/'+t.toFixed(2)+'.jpg',Buffer.from(jpg,'base64'));}
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
