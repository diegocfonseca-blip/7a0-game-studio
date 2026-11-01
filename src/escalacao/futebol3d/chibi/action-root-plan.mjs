import {receptionTravelVelocity} from './reception-locomotion.mjs';
import {boundedRootProgress} from './bounded-root-progress.mjs';
// Continuous contact-constrained body path. The authoritative event clock stays intact.
const hermite=(a,b,v,w,u,d)=>{const h=2*u*u*u-3*u*u+1,j=u*u*u-2*u*u+u,k=-2*u*u*u+3*u*u,l=u*u*u-u*u;return{x:h*a.x+j*d*v.x+k*b.x+l*d*w.x,z:h*a.z+j*d*v.z+k*b.z+l*d*w.z}};
export function prepareActionRootPath(source,events,{controls=[],breaks=[],ballAt,ownedAt}={}){
 const velocity=t=>{const a=source(Math.max(0,t-.005)),b=source(t+.005);return{x:(b.x-a.x)/.01,z:(b.z-a.z)/.01}};
 const contacts=events.filter(e=>!e.disabled&&!(e.firstTime&&e.kind==='recebe')&&(['toque','recebe'].includes(e.kind)||e.verifiedGroundTouch)).sort((a,b)=>a.t-b.t).map(e=>{const moving=e.movingPickup||(e.variation?.locomotion==='continuous'||/^(chute_corrida|controle_corrida)/.test(e.nome??''))&&!e.hands,speed=e.movingPickup?1.6:e.variation?.locomotion==='continuous'?e.variation.contactSpeed??3.4:3.4;return{t:e.t,p:source(e.t),v:receptionTravelVelocity(e,{controlled:controls.some(s=>!s.loose&&Math.abs(s.start-e.t)<1e-6&&s.end>e.t+.08)})??(moving?{x:Math.sin(e.mira)*speed,z:Math.cos(e.mira)*speed}:{x:0,z:0}),event:e}});
 // Intermediate pushes need the tangent of their fixed control segment, not
 // a fresh 3.4m/s run in the striking pose's facing direction at every touch.
 for(const span of controls.filter(s=>s.verified&&!s.loose)){
  const from=contacts.find(c=>Math.abs(c.t-span.start)<1e-6),to=contacts.find(c=>Math.abs(c.t-span.end)<1e-6);if(!from||!to)continue;
  const dt=to.t-from.t,v={x:(to.p.x-from.p.x)/dt,z:(to.p.z-from.p.z)/dt};if(Math.hypot(v.x,v.z)>9)continue;
  from.v={...v};if(to.event.verifiedGroundTouch)to.v={...v};
 }
 // Receiving while already running is translation, not aiming the next kick.
 // Using the next cross's facing here made a receiver brake backwards and then
 // rush to his planted strike. Retain the official incoming movement instead.
 for(let i=0;i<contacts.length-1;i++){
  const c=contacts[i],next=contacts[i+1],e=c.event,dt=next.t-c.t,speed=e.rec?.speed,heading=e.rec?.heading;
  if(e.kind!=='recebe'||e.hands||!/^controle_corrida/.test(e.nome??'')||dt<.25||dt>.8||Math.hypot(next.v.x,next.v.z)>.01||!(speed>3.5)||!Number.isFinite(heading))continue;
  const incoming=Math.min(9,speed);c.v={x:Math.sin(heading)*incoming,z:Math.cos(heading)*incoming};c.incomingRun=true;
 }
 // A quick sequence of aerial touches cannot plant the torso twice and squeeze
 // all its travel into the remaining few frames. Keep both exact head contacts
 // and derive travel from those positions, not the outgoing ball direction.
 for(let i=1;i<contacts.length;i++){
  const a=contacts[i-1],b=contacts[i],dt=b.t-a.t,dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,distance=Math.hypot(dx,dz);
  if(!a.event.cab||!b.event.cab||a.event.hands||b.event.hands||dt<.2||dt>1.2||distance<.35||distance/dt>9||breaks.some(c=>c.before>=a.t&&c.after<=b.t))continue;
  const v={x:dx/dt,z:dz/dt};
  for(const c of [a,b]){c.v=c.headerFlow?{x:(c.v.x+v.x)*.5,z:(c.v.z+v.z)*.5}:{...v};c.headerFlow=true}
 }
 // Tactical speed before acquisition describes the approach, not the speed
 // of a controlled ball after impact. Match the body to the actual outgoing
 // roll, so an arriving runner does not overtake a slowing first touch.
 const receptionTangents=[];
 if(ballAt&&ownedAt)for(const c of contacts){
  const e=c.event;if(e.kind!=='recebe'||e.firstTime||e.hands||e.goleiro||e.pickup||e.bola?.y>.24)continue;
  const end=Math.min(c.t+.18,contacts.find(n=>n.t>c.t+1e-6)?.t??Infinity);
  if(end-c.t<.08||!ownedAt(c.t+.04)||!ownedAt(end-.01)||breaks.some(b=>b.before>=c.t&&b.after<=end))continue;
  const a=ballAt(c.t+.02),b=ballAt(end);if(!a||!b||a.y>.24||b.y>.24)continue;
  const v={x:(b.x-a.x)/(end-c.t-.02),z:(b.z-a.z)/(end-c.t-.02)},speed=Math.hypot(v.x,v.z);
  if(speed>9)continue;
  receptionTangents.push({t:c.t,before:{...c.v},after:{...v}});c.v=v;c.incomingRun=speed>3.5;
 }
 const anchors=[],ranges=[],actionWindows=[];
 for(let i=0;i<contacts.length;i++){const c=contacts[i],prev=contacts[i-1],next=contacts[i+1],stationary=!c.headerFlow&&Math.hypot(c.v.x,c.v.z)<.01;
  if(c.event.hands&&prev&&!prev.event.movingPickup&&(prev.event.pickup||prev.event.goleiro||prev.event.hands)&&c.t-prev.t<2&&Math.hypot(c.p.x-prev.p.x,c.p.z-prev.p.z)<3)c.p={...prev.p};
  let stop=stationary?Math.max(0,Math.min(c.t-.04,(c.event.start??c.t-.3)+.18),prev?prev.t+.05:0):c.t;
  // A quick receiving run needs room to decelerate. Keep the final 100 ms
  // planted, rather than demanding an early stop and a compensating sprint.
  if(stationary&&prev?.incomingRun)stop=Math.max(stop,c.t-.10);
  if(stationary&&stop<c.t-.01)anchors.push({t:stop,origin:c.t,p:c.p,v:{x:0,z:0}});anchors.push({...c,origin:c.t});
  if(stationary){const hold=Math.min(c.t+.12,next?Math.max(c.t+.02,(next.event.start??next.t)-.08):Infinity);if(hold>c.t+.001)anchors.push({t:hold,origin:c.t,p:c.p,v:{x:0,z:0}})}
  // Only preparation and follow-through may replace the body trajectory.
  // Joining sparse contacts across the entire three-second planning horizon
  // erased turns/dribbles between them, even when the source followed the ball.
  actionWindows.push({start:Math.max(0,Math.min(stop-.5,(c.event.start??c.t-.3)-.15)),end:c.t+.4});
  ranges.push({start:Math.max(0,stop-3),end:c.t+1.5});
 }
 const windows=[];for(const r of ranges){const last=windows.at(-1);if(last&&r.start<=last.end)last.end=Math.max(last.end,r.end);else windows.push({...r})}
 const nodes=anchors.filter(a=>!breaks.some(c=>(a.origin<=c.before&&a.t>=c.after)||(a.origin>=c.after&&a.t<=c.before)));
 for(const w of windows){nodes.push({t:w.start,p:source(w.start),v:velocity(w.start)});nodes.push({t:w.end,p:source(w.end),v:velocity(w.end)})}
 const carryingWindows=contacts.flatMap((c,i)=>(c.event.kind==='recebe'||c.event.verifiedGroundTouch)&&!c.event.hands&&!c.event.goleiro&&!c.event.pickup?[{start:c.t+(c.event.verifiedGroundTouch?.16:.4),end:contacts[i+1]?(contacts[i+1].event.start??contacts[i+1].t-.3)-.65:c.t+1.5}]:[]);
 // A future impact must not replace free off-ball movement with a long chord.
 // Keep the native route outside preparation/follow-through, not just while
 // carrying. Contact anchors and their planted windows still have priority.
 const addGuide=t=>{
  if(!carryingWindows.some(w=>t>=w.start&&t<=w.end)||!windows.some(w=>t>=w.start&&t<=w.end)||actionWindows.some(w=>t>w.start+1e-7&&t<w.end-1e-7)||anchors.some(a=>Math.abs(a.t-t)<.075))return;
  nodes.push({t,p:source(t),v:velocity(t)});
 };
 for(const w of windows)for(let t=w.start;t<=w.end;t+=.08)addGuide(t);
 for(const w of carryingWindows){addGuide(w.start);addGuide(w.end)}
 for(const w of actionWindows){addGuide(w.start);addGuide(w.end)}
 // A spilled touch has an existing bounded chase path. Contact-only Hermite
 // nodes used to erase that path between impacts, leaving the player behind.
 // Preserve its shape while fixed contact/standing anchors retain priority.
 for(const control of controls.filter(c=>c.loose)){
  const end=control.end+(control.recovery??1);
  for(let t=control.start;t<=end+1e-6;t+=.08){
   if(!windows.some(w=>t>=w.start&&t<=w.end)||anchors.some(a=>Math.abs(a.t-t)<.075))continue;
   nodes.push({t,p:source(t),v:velocity(t)});
  }
 }
 // The first 400ms after a reception are not an outgoing strike's fixed
 // follow-through. Keep the bounded native/chase route after the exact impact,
 // otherwise the long sparse chord erases the player's attempt to reach a spill.
 // Existing two-contact controls and the next strike's preparation retain priority.
 for(let i=0;i<contacts.length;i++){
  const c=contacts[i],next=contacts[i+1],e=c.event;
  if(e.kind!=='recebe'&&!e.verifiedGroundTouch||e.hands||e.goleiro||e.pickup||e.bola?.y>.3||controls.some(s=>!s.loose&&s.start<=c.t+1e-7&&s.end>c.t+.08))continue;
  const end=Math.min(c.t+.4,next?(next.event.start??next.t)-.08:Infinity);
  for(let t=c.t+.08;t<end-1e-7;t+=.04){
   if(anchors.some(a=>Math.abs(a.t-t)<.075)||breaks.some(b=>b.before>=c.t&&b.after<=t))continue;
   const v=velocity(t),speed=Math.hypot(v.x,v.z),k=speed>9?9/speed:1;
   nodes.push({t,p:source(t),v:{x:v.x*k,z:v.z*k}});
  }
 }
 // Never smooth a corner/goal/half-time placement into a running trajectory.
 // Each side gets its own one-sided tangent; a central difference across the
 // reset would manufacture hundreds of metres/second and Hermite overshoot.
 for(const cut of breaks){
  const left=source(cut.before),a=source(cut.before-.01),right=source(cut.after),b=source(cut.after+.01);
  nodes.push({t:cut.before,p:left,v:{x:(left.x-a.x)/.01,z:(left.z-a.z)/.01}});
  nodes.push({t:cut.after,p:right,v:{x:(b.x-right.x)/.01,z:(b.z-right.z)/.01}});
 }
 nodes.sort((a,b)=>a.t-b.t);const unique=nodes.filter((n,i)=>!nodes[i+1]||nodes[i+1].t-n.t>1e-7);
 // Preserve off-ball bends only where doing so does not introduce a faster
 // rush than the existing fit. The native contact-adjusted source can itself
 // contain a short, fast correction; copying all of it would expose new spikes.
 const peak=(points)=>{let max=0;for(let k=0;k<points.length-1;k++){
  const a=points[k],b=points[k+1],d=b.t-a.t;if(d<1e-7)continue;
  const steps=Math.max(24,Math.ceil(d/.01));for(let i=0;i<=steps;i++){
   const u=i/steps,h=(6*u*u-6*u)/d,j=3*u*u-4*u+1,l=3*u*u-2*u;
   max=Math.max(max,Math.hypot(h*(a.p.x-b.p.x)+j*a.v.x+l*b.v.x,h*(a.p.z-b.p.z)+j*a.v.z+l*b.v.z));
  }
 }return max};
 const guided=[];let acceptedGuides=0,rejectedGuideSpans=0;
 for(let i=0;i<unique.length-1;i++){
  const a=unique[i],b=unique[i+1],inside=[];
  if(a.origin===undefined&&b.origin!==undefined&&!breaks.some(c=>c.before>=a.t&&c.after<=b.t)&&b.t-a.t>.16){
   for(let t=a.t+.08;t<b.t-.075;t+=.08){
    if(actionWindows.some(w=>t>w.start-1e-7&&t<w.end+1e-7)||anchors.some(c=>Math.abs(c.t-t)<.075))continue;
    inside.push({t,p:source(t),v:velocity(t)});
   }
  }
  guided.push(a);
  if(inside.length){const oldPeak=peak([a,b]),newPeak=peak([a,...inside,b]);
   if(newPeak<=Math.max(9,oldPeak+.01)){guided.push(...inside);acceptedGuides+=inside.length}
   else rejectedGuideSpans++;
  }
 }
 if(unique.length)guided.push(unique.at(-1));
 const progress=new Map();
 for(let i=0;i<guided.length-1;i++){
  const a=guided[i],b=guided[i+1],d=b.t-a.t;
  if(a.origin!==undefined||b.origin===undefined||breaks.some(c=>c.before>=a.t&&c.after<=b.t))continue;
  const timing=boundedRootProgress(u=>{const h=(6*u*u-6*u)/d,j=3*u*u-4*u+1,l=3*u*u-2*u;return Math.hypot(h*(a.p.x-b.p.x)+j*a.v.x+l*b.v.x,h*(a.p.z-b.p.z)+j*a.v.z+l*b.v.z)},{duration:d});
  if(timing)progress.set(a,timing);
 }
 const sample=t=>{if(breaks.some(c=>t>=c.before&&t<=c.after))return source(t);let i=-1;for(let k=0;k<guided.length;k++){if(guided[k].t<=t)i=k;else break}const a=guided[i],b=guided[i+1];if(!a||!b||b.t-a.t<1e-8||!windows.some(w=>t>=w.start&&t<=w.end))return source(t);const u=(t-a.t)/(b.t-a.t);return hermite(a.p,b.p,a.v,b.v,progress.get(a)?.sample(u)??u,b.t-a.t)};
 return{sample,contacts,diagnostics:{receptionTangents,acceptedGuides,rejectedGuideSpans,retimedApproaches:[...progress].map(([a,p])=>({start:a.t,before:p.before,after:p.after}))}};
}
