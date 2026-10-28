const fs=require('node:fs'),assert=require('node:assert/strict'),{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
(async()=>{
 const b=await loadDependency('playwright').chromium.launch(browserOptions());
 try{
  const p=await b.newPage();await p.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html');
  await p.waitForFunction(()=>window.mapAudit?.ready(),{},{timeout:120000});
  const rows=await p.evaluate(()=>{
   const r=[];
   for(let i=32*60;i<=35.25*60;i++){
    const t=i/60,s=mapAudit.seek(t);if(t<34.2)continue;
    const a=s.actors.find(a=>a.key.includes('Velloso'));
    r.push({t,body:t<=34.65?mapAudit.measureBody(a.key):null,hands:mapAudit.measureHands(a.key),feet:mapAudit.measureBoot(a.key),holding:s.detail.football.handContact});
   }
   return r;
  });
  fs.writeFileSync(process.env.SURFACE_OUT||'test-results/fundamentos-mapa/superficie-goleiro-v4.json',JSON.stringify(rows));
  const minimumHandGap=Math.min(...rows.map(r=>r.hands.gap)),minimumSole=Math.min(...rows.map(r=>r.feet.floor));
  assert(rows.filter(r=>r.t<34.4).every(r=>r.body.gap>0),'Do not add an unrecorded body save before the post');
  assert(minimumHandGap>-.015,'Collection and transfer must not bury the sphere in either hand');
  assert(minimumSole>-.003,'Collection blend must keep soles above the turf');
  assert(rows.filter(r=>r.t<34.6166).every(r=>!r.holding),'No attachment before the official collection');
  console.log('PASS: shot misses body, post preserved, shallow residual hand overlap, grounded soles, no premature capture', {minimumHandGap,minimumSole});
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
