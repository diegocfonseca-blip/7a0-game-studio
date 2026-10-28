const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out=process.env.KEEPER_OUT||'test-results/fundamentos-mapa/v5';
const hz=Number(process.env.KEEPER_HZ)||60;
const cases=[{seed:1,at:66.95,name:'Velloso'},{seed:2,at:8.6,name:'Velloso'},{seed:4,at:29.45,name:'Ever Almeida'},{seed:5,at:9.45,name:'Velloso'},{seed:5,at:31.2,name:'Ever Almeida'},{seed:5,at:54.3,name:'Ever Almeida'},{seed:6,at:44.45,name:'Ever Almeida'}];
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await loadDependency('playwright').chromium.launch(browserOptions());const results=[];try{
 for(const c of cases){const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html?seed='+c.seed);await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});const error=await p.evaluate(()=>window.mapAuditError);if(error)throw Error(error);
  const result=await p.evaluate(({at,name,hz})=>{const rows=[];for(let i=Math.floor((at-2)*hz);i<=Math.ceil((at+1.4)*hz);i++){
   const s=mapAudit.seek(i/hz);if(s.time<at-.5)continue;
   const keeper=s.actors.find(a=>a.key.includes(name));if(!keeper)continue;
   const ball=s.visibleBall,dx=ball.x-keeper.position[0],dz=ball.z-keeper.position[2];
   rows.push({t:s.time,ball,raw:s.authority.ball,held:s.detail.football.handContact,hands:mapAudit.measureHands(keeper.key),angle:Math.abs(Math.atan2(Math.sin(Math.atan2(dx,dz)-keeper.heading),Math.cos(Math.atan2(dx,dz)-keeper.heading)))*180/Math.PI,contacts:s.detail.football.contacts.filter(c=>c.key===keeper.key&&c.nome&&c.t>=at-.01),events:s.official.events.filter(e=>e.t>=at-.001),sameEvents:JSON.stringify(s.official.events)===JSON.stringify(s.authority.official.events),players:s.actors.length});
  }return{rows}},{...c,hz});
  const contacts=result.rows.at(-1).contacts,held=result.rows.filter(r=>r.held),summary={...c,hz,contacts,heldFrames:held.length,minHeldGap:held.length?Math.min(...held.map(r=>r.hands.gap)):null,maxHeldGap:held.length?Math.max(...held.map(r=>r.hands.gap)):null,maxIncomingAngle:Math.max(...result.rows.filter(r=>r.t>=c.at-.4&&r.t<=c.at-.1).map(r=>r.angle)),prematureCatch:result.rows.some(r=>r.held&&r.t<c.at-1e-6),eventsUnchanged:result.rows.every(r=>r.sameEvents),errors};
  results.push(summary);fs.writeFileSync(out+`/regressao-${c.seed}-${c.at}.json`,JSON.stringify(result));console.log(JSON.stringify(summary));await p.close();
 }
 fs.writeFileSync(out+'/defesas-resumo.json',JSON.stringify(results,null,2));
 for(const r of results){assert.equal(r.errors.length,0);assert(r.eventsUnchanged,'Presentation changed official events');assert(r.contacts.some(c=>Math.abs(c.t-r.at)<.025),'Missing keeper contact');assert(r.contacts.every(c=>c.confirmed),'Invalid glove contact');assert(r.maxIncomingAngle<65,'Keeper turned his back before the shot arrived');assert(!r.prematureCatch,'Ball attached before impact');assert(r.contacts.filter(c=>c.kind!=='toque').every(c=>c.bodyAngleDegrees<15),'Keeper turned away from the shot');assert(r.minHeldGap===null||r.minHeldGap>=-.025,'Ball penetrated a glove while held');assert(r.maxHeldGap===null||r.maxHeldGap<=.04,'Ball left the gloves before release');}
 console.log('PASS: 7 official keeper situations, actual skinned hand contact, held ball and unchanged events');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
