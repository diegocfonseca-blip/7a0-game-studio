const fs=require('node:fs'),path=require('node:path');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const origin='http://127.0.0.1:5301',out=process.env.AUDIT_OUT||'test-results/fundamentos-mapa/antes';
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const p=await b.newPage({viewport:{width:960,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
 await p.goto(origin+'/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});const failure=await p.evaluate(()=>window.mapAuditError);if(failure)throw Error(failure);console.log('READY',await p.evaluate(()=>mapAudit.inspect().detail));
 const hz=Number(process.env.AUDIT_HZ)||60,rows=[],samples=[3.4,7.1,14.1,17.7,25,38,50,62,78,89];
 for(let n=0;n<=90*hz;n+=120){const data=await p.evaluate(({n,hz})=>{const rows=[];for(let j=n;j<Math.min(n+120,90*hz+1);j++){const t=j/hz,s=mapAudit.seek(t),B=s.visibleBall;const a=s.actors.find(a=>a.key===s.owner),feet=a?Object.entries(a.bones).filter(([k])=>/ToeBase|Foot/.test(k)).map(([,v])=>v):[];const gap=feet.length?Math.min(...feet.map(f=>Math.hypot(B.x-f[0],B.y-f[1],B.z-f[2])))-.18:null;
 rows.push({t,time:s.time,replay:s.replay,phase:s.phase,owner:s.owner,ball:B,source:s.authority.ball,offset:Math.hypot(B.x-(s.authority.ball.presentation??s.authority.ball).x,B.y-(s.authority.ball.presentation??s.authority.ball).y,B.z-(s.authority.ball.presentation??s.authority.ball).z),gap,actors:s.actors.map(a=>({key:a.key,p:a.position,h:a.heading,feet:Object.entries(a.bones).filter(([k])=>/ToeBase/.test(k)).map(([,v])=>v)})),football:s.detail?.football,official:s.official});}return rows},{n,hz});rows.push(...data);if(n%600===0)console.log('audit seconds',n/hz);}
 fs.writeFileSync(path.join(out,'match.json'),JSON.stringify({hz,errors,rows}));
 const contacts=new Map();for(const r of rows)for(const c of r.football?.contacts??[])contacts.set(JSON.stringify([c.t,c.tipo,c.nome]),c);
 const cc=[...contacts.values()],arr=rows.filter(r=>!r.replay),offset=arr.reduce((m,r)=>r.offset>m.offset?r:m,arr[0]),summary={frames:rows.length,errors,players:rows[0].actors.length,score:rows.at(-1).official?.score,events:rows.at(-1).official?.events,offsetMax:{t:offset.t,metres:offset.offset},framesOffsetOver1m:arr.filter(r=>r.offset>1).length,contacts:cc.length,contactsOver40cm:cc.filter(c=>c.dist>.4),carryingWithoutReach:arr.filter(r=>r.phase==='dominio'&&r.gap>.4).length};
 // Redrawing a paused frame while changing the camera must keep all bones,
 // body headings, the ball and the official event stream unchanged.
 await p.reload();await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});
 const pause=await p.evaluate(()=>{for(let i=0;i<=180;i++)mapAudit.seek(i/60);const before=mapAudit.inspect();for(const mode of ['close','tactical','broadcast'])mapAudit.capture(3,mode);const after=mapAudit.inspect();const pose=s=>JSON.stringify({actors:s.actors,ball:s.visibleBall,official:s.official});return{unchanged:pose(before)===pose(after),players:after.actors.length}});
 summary.pause=pause;if(!pause.unchanged)throw Error('Mudar a câmera alterou o quadro pausado');
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,events:summary.events?.length}));
 for(const t of process.env.NO_CAPTURES?[]:samples){await p.reload();await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});await p.evaluate(t=>{for(let s=0;s<t;s+=1/60)mapAudit.seek(s)},t);for(const m of ['close','tactical']){const jpg=await p.evaluate(({t,m})=>mapAudit.capture(t,m),{t,m});fs.writeFileSync(path.join(out,`${t}-${m}.jpg`),Buffer.from(jpg,'base64'));}}
 if(errors.length)throw Error(errors.join('\n'));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
