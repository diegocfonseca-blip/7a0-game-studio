// Replays the existing local official input, without generating a seed, save,
// round or second independent result. Only presentation diagnostics are written.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FutebolOficial3D} from '../../src/escalacao/presidencia-futebol-oficial.ts';
import {footballEngineFingerprint} from '../animation-lab/official-source/engine-fingerprint.mjs';

const canonical=o=>Array.isArray(o)?o.map(canonical):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])])):o;
const hash=o=>createHash('sha256').update(JSON.stringify(canonical(o))).digest('hex');
const input=(JSON.parse(await readFile('test-results/animation-library/neymarzetti-current/football-input.json'))).input;
const fitted=JSON.parse(await readFile('src/escalacao/futebol3d/cartoon/motion.json'));
const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos}));
const state={officialInput:input,context:{id:'existing-current-delivery-catalog',home:roster(input.casa),away:roster(input.fora)}};
const engine=new FutebolOficial3D(input),hz=120,clock=90/93,frames=[];
const inputSHA256=hash(input),engineSHA256=footballEngineFingerprint();
assert.equal(inputSHA256,fitted.inputSHA256,'Do not compile variants against another input');

// Compact canonical samples keep source X/Y/Z distinct from the visual ball
// adjustments used after a catch or a goal. No presented trajectory is measured.
let official,initialRoster;
for(let tick=0;tick<=94*hz;tick++){
 const frame=engine.sample(state,tick/hz/clock);
 initialRoster??=frame.players.map(p=>({key:p.key,name:p.name,side:p.side,keeper:p.keeper}));
 frames.push({time:tick/hz,ball:[frame.ball.x,frame.ball.y,frame.ball.z],owner:frame.owner??null,action:frame.officialAction??null,phase:frame.phase,eventCount:frame.official.events.length});
 official=frame.official;
}
const at=time=>frames[Math.max(0,Math.min(frames.length-1,Math.round(time*hz)))];
const same=(frame,event,actor)=>frame?.action&&frame.action.actor===actor.key&&Math.abs(frame.action.startedAt-event.t)<1e-6;
const norm=v=>Math.hypot(...v);
const pointDistance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const heightBand=h=>h<=.30?'grounded':h<=1.2?'low':h<=2.44?'medium':'high';
const speedBand=v=>v===null?'unmeasured':v<18?'below-18-mps':v<25?'18-to-25-mps':'25-mps-or-more';
const kicks=new Set(['passe','enfiada','lancamento','inversao','cruzamento','chutao','chute']);
const allPlans=[...fitted.plans,...fitted.rejected],rows=[];
for(let eventIndex=0;eventIndex<official.events.length;eventIndex++){
 const event=official.events[eventIndex];if(!kicks.has(event.tipo))continue;
 const actor=initialRoster.find(p=>p.name===event.a&&p.side===(event.lado===0?'home':'away'));
 assert.ok(actor,'Official actor must be mapped by side/name, never nearest-to-ball');
 const plan=allPlans.find(p=>p.name===event.a&&Math.abs(p.time-event.t)<1e-5);
 const nextEvent=official.events.find(e=>e.t>event.t+1e-6),hardEnd=Math.min(94,event.t+3,nextEvent?.t??94);
 const start=at(event.t),window=[];let seenAction=false,endReason=hardEnd===event.t+3?'three-second-cap':'next-official-event',interruption=null;
 for(let tick=Math.ceil((event.t-1e-7)*hz);tick<=Math.floor((hardEnd+1e-7)*hz);tick++){
  const f=frames[tick];if(!f)break;
  if(!seenAction){if(!same(f,event,actor))continue;seenAction=true;}
  if(f.owner&&f.owner!==actor.key){endReason='new-owner';interruption={time:f.time,key:f.owner};break;}
  if(!same(f,event,actor)){endReason='action-changed';interruption={time:f.time,nextAction:f.action?.type??null,nextActor:f.action?.actor??null};break;}
  window.push(f);
 }
 const first=window[0],last=window.at(-1),velocityWindows=[];
 for(const [from,to]of [[.05,.10],[.10,.15]]){
  const a=at(event.t+from),b=at(event.t+to),valid=!!first&&!!last&&a.time>=first.time-1e-6&&b.time<=last.time+1e-6&&same(a,event,actor)&&same(b,event,actor)&&!a.owner&&!b.owner;
  const velocity=valid?a.ball.map((v,i)=>(b.ball[i]-v)/(b.time-a.time)):null;
  velocityWindows.push({fromSeconds:from,toSeconds:to,valid,velocity,reason:valid?'same uninterrupted official flight':'interrupted-or-not-in-flight'});
 }
 const measured=velocityWindows.find(w=>w.valid),velocity=measured?.velocity??null;
 const apex=window.length?Math.max(...window.map(f=>f.ball[1])):null;
 const observedClass=apex===null?'unmeasured':apex>.30?'airborne':'grounded';
 const horizontalSpeed=velocity?Math.hypot(velocity[0],velocity[2]):null;
 rows.push({eventIndex,time:event.t,officialType:event.tipo,actor:actor.key,name:event.a,receiverName:event.b??null,keeper:actor.keeper,existingPlanId:plan?.id??null,
  executionClass:actor.keeper?'keeper-release':event.tipo==='chute'?'shot':'pass',delivery:first?.action.delivery??null,deliveryObservation:first?.action.delivery?'first-canonical-action-tick':'action-not-observable-before-interference',
  nominalDelivery:event.tipo,observedTrajectory:observedClass,observedHeightBand:apex===null?'unmeasured':heightBand(apex),
  postContactHorizontalSpeed:horizontalSpeed,postContactVerticalSpeed:velocity?.[1]??null,postContactSpeed3D:velocity?norm(velocity):null,speedBand:speedBand(horizontalSpeed),
  canonicalContactPosition:start.ball,observedFlightStart:first?.time??null,observedFlightEnd:last?.time??null,observedDuration:first&&last?last.time-first.time:0,
  observedApex:apex,observedHorizontalDisplacement:first&&last?pointDistance(first.ball,last.ball):null,observedPathLength:window.reduce((sum,f,i)=>i?sum+pointDistance(window[i-1].ball,f.ball):sum,0),
  endReason,interruption,nextOfficialEvent:nextEvent?{time:nextEvent.t,type:nextEvent.tipo,name:nextEvent.a??null}:null,velocityWindows,
  technique:{placedShot:false,curvedShot:false,certified:false,reason:'No explicit placed/curl execution or lateral spin physics in official source; velocity/height are measurements, not named techniques.'},
  presentationCoverage:actor.keeper?'existing-reviewed-hand-release':fitted.plans.includes(plan)?'reviewed-foot-contact':'missing-reviewed-foot-contact',
  caveats:[...(actor.keeper?['Source ball is a ground anchor on release; reviewed 3D keeper presentation follows hands. Do not select a foot kick from these raw measurements.']:[]),...(endReason!=='three-second-cap'?['Observation ends at first interference/owner/action/event, not necessarily at the theoretical ballistic apex.']:[]),'delivery.freeFlightApex is the source release prediction in its height convention; observedApex is the sampled rendered ball-center height (+0.11 m radius), subject to discrete physics and interruption. Do not equate them.']});
}
assert.equal(rows.length,59);assert.equal(rows.filter(r=>r.officialType==='chute').length,3);assert.equal(rows.filter(r=>r.officialType==='cruzamento').length,1);
assert.deepEqual(official.score,[1,1]);assert.equal(official.events.length,82);
const report={schema:'leilao-legends-official-delivery-catalog/v1',inputSHA256,engineSHA256,hz,source:'Existing current official Neymarzetti/Rei da Bola input replayed deterministically; raw canonical trajectory only',
 finalScore:official.score,officialEvents:official.events.length,rows,
 thresholds:{airborneApexAbove:.30,heightBands:{grounded:[0,.30],low:[.30,1.2],medium:[1.2,2.44],high:[2.44,null]},horizontalSpeedBands:[18,25]},
 examples:{cross:rows.find(r=>r.officialType==='cruzamento'),shots:rows.filter(r=>r.officialType==='chute'),groundPass:rows.find(r=>r.executionClass==='pass'&&r.observedTrajectory==='grounded'&&r.velocityWindows[0].valid)},
 restrictions:{newSeed:false,saveWritten:false,databaseWritten:false,engineModified:false,curveAdded:false,animationApprovedByMetrics:false},
 interpretation:'delivery copies the first canonical action tick metadata from FutebolOficial3D, suitable for input/engine-gated presentation requirements. Finite-difference velocity is measured 50–100 ms after official contact (100–150 ms fallback), before interference. It is not impact force or player power. Observed apex/displacement may be truncated by an earlier official event or owner change. freeFlightApex is a prediction, not an observed apex. Use nominal type AND real height; inversao can be grounded. Exact foot contact, pose and receiving gesture need separate validation.'};
await mkdir('test-results/cartoon-football/variedades',{recursive:true});await writeFile('test-results/cartoon-football/variedades/delivery-catalog.json',JSON.stringify(report,null,2));
console.log({inputSHA256,engineSHA256,total:rows.length,measured:rows.filter(r=>r.postContactHorizontalSpeed!==null).length,missing:rows.filter(r=>r.presentationCoverage==='missing-reviewed-foot-contact').length,score:official.score,examples:[report.examples.cross,...report.examples.shots].map(r=>({time:r.time,type:r.officialType,name:r.name,speed:r.postContactHorizontalSpeed,vertical:r.postContactVerticalSpeed,apex:r.observedApex,endReason:r.endReason}))});
