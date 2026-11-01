const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const hermite=(a,b,v,w,u,d)=>(2*u*u*u-3*u*u+1)*a+(u*u*u-2*u*u+u)*d*v+(-2*u*u*u+3*u*u)*b+(u*u*u-u*u)*d*w;
const derivative=(fn,t)=>{const a=fn(t-.0005),b=fn(t+.0005);return{x:(b.x-a.x)/.001,z:(b.z-a.z)/.001}};

/** A foot reception and its next verified contact constrain one continuous
 * body route around a READ-ONLY ball trajectory. Independent eased world
 * chords can overtake a slowing ball or run through it. Polar interpolation
 * preserves the side of the ball and both exact impact roots. The endpoint
 * tangents match the incoming/outgoing body route; an unsafe fit is rejected.
 * This layer neither emits touches nor changes possession, ball or events. */
export function prepareGroundControlTrack(path,events,controls,{ballAt,ownedAt,breaks=[]}={}){
 if(!ballAt||!ownedAt)return path;
 const spans=[],decisions=[];
 const assess=(sample,start,end)=>{
  let peak=0,maxGap=0,minGap=Infinity,behindSeconds=0,maxOffset=0;
  const n=Math.ceil((end-start)*120);
  for(let i=0;i<=n;i++){
   const t=start+(end-start)*i/n,p=sample(t),b=ballAt(t),v=derivative(sample,t),d=Math.hypot(b.x-p.x,b.z-p.z),speed=Math.hypot(v.x,v.z),original=path.sample(t);
   peak=Math.max(peak,speed);maxGap=Math.max(maxGap,d);minGap=Math.min(minGap,d);maxOffset=Math.max(maxOffset,Math.hypot(p.x-original.x,p.z-original.z));
   if(d>.4&&speed>1.5&&((b.x-p.x)*v.x+(b.z-p.z)*v.z)/(d*speed)<-.35)behindSeconds+=(end-start)/n;
  }
  return{peak,maxGap,minGap,behindSeconds,maxOffset};
 };
 const intervals=controls.filter(c=>!c.loose).map(c=>({...c}));
 // A reception without a subsequent scheduled kick still needs a body route.
 // Stop at loss of ownership; this is not an invented successful second touch.
 for(const e of events){
  if(e.disabled||e.firstTime||e.kind!=='recebe'||e.hands||e.goleiro||e.pickup||e.bola?.y>.24||intervals.some(c=>c.start<=e.t+1e-6&&c.end>e.t+.1))continue;
  const next=events.find(n=>!n.disabled&&n.t>e.t+1e-6),limit=Math.min(e.t+1,next?.start??next?.t??Infinity);
  let end=e.t;
  for(let t=e.t+1/60;t<=limit+1e-7;t+=1/60){const b=ballAt(t);if(!ownedAt(t)||!b||b.y>.24||breaks.some(c=>c.before>=e.t&&c.after<=t))break;end=t}
  // Rejoin the existing route at a close, already-owned point. Moving a
  // distant endpoint to the ball would hide a genuinely lost/bad reception.
  while(end>e.t+.25){const p=path.sample(end),b=ballAt(end);if(Math.hypot(p.x-b.x,p.z-b.z)<=.95)break;end-=1/60}
  if(end-e.t>=.25)intervals.push({start:e.t,end,continuation:true});
 }
 for(const control of intervals){
  const start=control.start,end=control.end,d=end-start;
  if(d<.25||d>1.9||breaks.some(b=>b.before>=start&&b.after<=end))continue;
  const first=events.find(e=>!e.disabled&&Math.abs(e.t-start)<1e-6),last=control.continuation?{continuation:true}:events.find(e=>!e.disabled&&Math.abs(e.t-end)<1e-6);
  if(!first||!last||first.hands||first.goleiro||first.pickup||last.hands||last.cab)continue;
  let live=true;for(let t=start+.01;t<end-.001;t+=1/60){const b=ballAt(t);if(!ownedAt(t)||!b||b.y>.24){live=false;break}}if(!live)continue;
  const b0=ballAt(start),b1=ballAt(end),p0=path.sample(start),p1=path.sample(end),off0={x:p0.x-b0.x,z:p0.z-b0.z},off1={x:p1.x-b1.x,z:p1.z-b1.z};
  const r0=Math.hypot(off0.x,off0.z),r1=Math.hypot(off1.x,off1.z);
  if(Math.min(r0,r1)<.12||Math.max(r0,r1)>.95)continue;
  const theta0=Math.atan2(-off0.x,-off0.z),theta1=theta0+angle(Math.atan2(-off1.x,-off1.z)-theta0);
  const tangent=(t,off,r)=>{const v=derivative(path.sample,t),bv=derivative(ballAt,t),dx=v.x-bv.x,dz=v.z-bv.z;return{radial:(off.x*dx+off.z*dz)/r,angular:(off.z*dx-off.x*dz)/(r*r)}};
  const v0=tangent(start,off0,r0),v1=tangent(end,off1,r1),before=assess(path.sample,start,end);
  let best=null;
  for(const middleRadius of [(r0+r1)*.5,.4,.5,.6,.7]){
   // Split at mid-control: exact endpoint tangents, a common middle tangent.
   // Changing endpoint tangents to reduce overshoot would itself create a
   // speed discontinuity on the impact frame.
   const chord=(theta1-theta0)/d,half=d*.5,middleTheta=(theta0+theta1)*.5;
   const fn=t=>{
    if(t<=start||t>=end)return path.sample(t);
    const left=t<start+half,u=(t-(left?start:start+half))/half;
    const r=left?hermite(r0,middleRadius,v0.radial,0,u,half):hermite(middleRadius,r1,0,v1.radial,u,half);
    const theta=left?hermite(theta0,middleTheta,v0.angular,chord,u,half):hermite(middleTheta,theta1,chord,v1.angular,u,half),b=ballAt(t);
    return{x:b.x-Math.sin(theta)*r,z:b.z-Math.cos(theta)*r};
   };
   const after=assess(fn,start,end);
   if(after.minGap<Math.min(.22,r0,r1)-.005||after.maxGap>Math.max(.85,r0,r1)+.01||after.peak>Math.max(9,before.peak+.01)||after.maxOffset>2.25)continue;
   const cost=after.maxGap+after.behindSeconds*3+after.peak*.015;
   if(!best||cost<best.cost)best={sample:fn,after,cost,middleRadius};
  }
  if(best&&(best.after.maxGap<before.maxGap-.05||best.after.behindSeconds<before.behindSeconds-.04))spans.push({start,end,continuation:control.continuation,...best});
  else best=null;
  decisions.push({start,end,continuation:!!control.continuation,applied:!!best,before,after:best?.after,middleRadius:best?.middleRadius});
 }
 const previousFacing=path.controlledFacing;
 return{...path,diagnostics:{...path.diagnostics,groundControlTracks:decisions},sample:t=>{const s=spans.find(s=>t> s.start&&t<s.end);return s?s.sample(t):path.sample(t)},controlledFacing:t=>{
  const s=spans.find(s=>t> s.start+.06&&t<s.end-.12);if(!s)return previousFacing?.(t)??null;
  const p=s.sample(t),b=ballAt(t),heading=Math.atan2(b.x-p.x,b.z-p.z),e=events.find(e=>!e.disabled&&Math.abs(e.t-s.end)<1e-6);
  return{heading,contactAt:s.continuation?Infinity:s.end,contactHeading:e?.mira??heading};
 }};
}
