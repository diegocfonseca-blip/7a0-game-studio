const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const origin=process.env.PROBE_ORIGIN||'http://127.0.0.1:5321',out=process.env.PROBE_OUT||'test-results/saida-bola/partida-completa';
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await loadDependency('playwright').chromium.launch(browserOptions());
 try{
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
  await p.goto(origin+'/scripts/futebol3d/audita-mapa.html');await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});
  assert.equal(await p.evaluate(()=>window.mapAuditError),undefined);
  const proof=await p.evaluate(()=>mapAudit.historicalProof());assert.equal(proof.valid,true);assert.deepEqual(proof.actual,proof.expected);
  const rows=[];
  for(let n=0;n<=3000;n+=150){
   const batch=await p.evaluate(n=>{const rows=[];for(let i=n;i<Math.min(n+150,3001);i++){const s=mapAudit.seek(i/30);if(i%3)continue;rows.push({time:s.time,phase:s.phase,players:s.players,score:s.official.score,finished:s.official.finished,actors:s.actors.map(a=>({key:a.key,position:a.position,head:a.bones.mixamorigHead})),fouls:s.detail.football.fouls,contacts:s.detail.football.contacts})}return rows},n);rows.push(...batch);
   if(n%600===0)console.log('sampled',n/30);
  }
  assert.equal(errors.length,0);for(const r of rows){assert.equal(r.players,22);assert.equal(r.actors.length,22);for(const a of r.actors)assert(a.position.every(Number.isFinite)&&a.head.every(Number.isFinite))}
  assert(rows.some(r=>r.finished));assert.deepEqual(rows.at(-1).score,proof.expected);
  const events=await p.evaluate(()=>mapAudit.inspect().official.events);
  assert.equal(events.filter(e=>e.tipo==='gol').length,proof.expected.reduce((a,b)=>a+b,0),'No duplicate goal');
  const opening=rows.filter(r=>r.time>=5&&r.time<=7.3).map(r=>({t:r.time,...r.actors.find(a=>a.key.includes('Cuadrado'))}));
  if(opening.every(a=>a.head)){
   const grounded=opening.filter(a=>a.t>=5.7&&a.t<=6.4);const movement=Math.max(...grounded.map(a=>Math.hypot(a.position[0]-grounded[0].position[0],a.position[2]-grounded[0].position[2])));
   assert(movement<.04,'Grounded actor must stay at the foul contact');
   let down=false,valleys=0;for(const a of opening){if(a.head[1]<1&&!down){valleys++;down=true}else if(a.head[1]>1.15)down=false}assert.equal(valleys,1,'The opening foul must not contain two falls');
   assert(opening.filter(a=>a.t>=6.8).every(a=>a.head[1]>1.2),'Standing before the free-kick preparation');
  }
  const pause=await p.evaluate(()=>{const a=mapAudit.seek(5.9),b=mapAudit.seek(5.9);return[a.actors.map(a=>a.bones.mixamorigHead),b.actors.map(a=>a.bones.mixamorigHead)]});assert.deepEqual(...pause);
  const summary={proof,errors,frames:3001,players:22,officialEvents:events.length,goals:events.filter(e=>e.tipo==='gol'),fouls:rows[0].fouls,opening,contacts:rows.at(-1).contacts};
  fs.writeFileSync(out+'/report.json',JSON.stringify(summary,null,2));fs.writeFileSync(out+'/trace.json',JSON.stringify(rows));
  console.log(JSON.stringify({pass:true,frames:3001,score:proof.actual,goals:summary.goals,fouls:summary.fouls}));
 }finally{await b.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
