const fs=require('node:fs'),assert=require('node:assert/strict');
const base='test-results/fundamentos-mapa/',out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v3-20261028/entrega';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=read(base+'entrega-60hz/match.json'),after=read(base+'v3-final-60hz/match.json'),low=read(base+'v3-final-30hz/match.json');
const average=a=>a.reduce((s,n)=>s+n,0)/a.length;
function measure(data){
 let prev=new Map(),oldVelocity=new Map(),minimum=Infinity;const accelerations=[],velocities=[],contacts=new Map(),plants=[];
 for(const r of data.rows){
  for(const c of r.football.contacts??[])if(c.nome)contacts.set(c.key+':'+c.t,c);
  plants.push(...r.football.grounding??[]);
  for(let i=0;i<r.actors.length;i++)for(let j=i+1;j<r.actors.length;j++)minimum=Math.min(minimum,Math.hypot(r.actors[i].p[0]-r.actors[j].p[0],r.actors[i].p[2]-r.actors[j].p[2]));
  if(['saida','gol','fim','intervalo'].includes(r.phase)||Math.abs(r.time-r.t)>.05){prev.clear();oldVelocity.clear();continue}
  for(const a of r.actors){const last=prev.get(a.key),dt=r.time-(last?.time??r.time);
   if(dt>0&&dt<.05){const v=[(a.p[0]-last.p[0])/dt,(a.p[2]-last.p[2])/dt],speed=Math.hypot(...v),old=oldVelocity.get(a.key);if(speed<20){velocities.push(speed);if(old&&Math.hypot(...old)<20)accelerations.push({key:a.key,t:r.time,value:Math.hypot(v[0]-old[0],v[1]-old[1])/dt})}oldVelocity.set(a.key,v)}
   prev.set(a.key,{p:a.p,time:r.time});
  }
 }
 const cc=[...contacts.values()],control=accelerations.filter(a=>a.key.includes('George Weah')&&a.t>=15&&a.t<=17.6);
 return{frames:data.rows.length,errors:data.errors,players:data.rows[0].actors.length,score:data.rows.at(-1).official.score,events:data.rows.at(-1).official.events.length,contacts:cc.length,exact:cc.filter(c=>!c.interpolated).length,interpolated:cc.filter(c=>c.interpolated).length,contactGap:{min:Math.min(...cc.map(c=>c.gap)),max:Math.max(...cc.map(c=>c.gap)),outsideTolerance:cc.filter(c=>!c.confirmed).map(c=>({t:c.t,gap:c.gap,interpolated:c.interpolated}))},minimumRootSeparation:minimum,peakRootSpeed:Math.max(...velocities),controlPeakAcceleration:Math.max(...control.map(a=>a.value)),grounding:plants.length?{samples:plants.length,meanUncorrectedAnchorError:average(plants.map(p=>p.rawError)),meanCorrectedAnchorError:average(plants.map(p=>p.error)),maxCorrection:Math.max(...plants.map(p=>p.correction)),minimumSoleHeight:Math.min(...plants.map(p=>p.floor))}:null};
}
const report={before:measure(before),after60:measure(after),after30:measure(low),gait:read(base+'passada-v3.json'),officialEventsUnchanged:JSON.stringify(before.rows.at(-1).official)===JSON.stringify(after.rows.at(-1).official)&&JSON.stringify(before.rows.at(-1).official)===JSON.stringify(low.rows.at(-1).official)};
assert(report.officialEventsUnchanged,'Official scores, scorers, assists and event times must remain identical');
assert(report.after60.errors.length===0&&report.after30.errors.length===0);assert.equal(report.after60.contacts,64);
assert.equal(report.after60.contactGap.outsideTolerance.length,0,'All scheduled impacts at 60 Hz must fit the actual skinned surface');
assert(report.after60.minimumRootSeparation>.37&&report.after30.minimumRootSeparation>.37);
assert(report.after60.controlPeakAcceleration<report.before.controlPeakAcceleration*.4,'Control transition jerk must materially improve');
assert(report.after60.grounding.maxCorrection<.102&&report.after60.grounding.minimumSoleHeight>=-.001);
const city=base+'cidade-v3/cidade.json';if(fs.existsSync(city)){const c=read(city);assert.equal(c.errors.length,0);report.city=c.reports.map(r=>({viewport:r.viewport,camera:r.mode,players:r.info.match.players,drawCalls:r.info.drawCalls,resources:r.info.memory}))}
report.limits=['Local fixture: 3–0 in the current engine. The historic 1–1 remains blocked; this is not a new saved match.','30 Hz impact gaps marked interpolated are estimates between rendered surfaces, not exact instantaneous measurements.','Root separation does not prove that all limbs are free of intersections.','Long-distance sprint, high-speed collisions and goalkeeper diving/recovery still need further refinement.','No physical mobile device was profiled. Export frame rate is not runtime FPS.'];
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/diagnostico.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
