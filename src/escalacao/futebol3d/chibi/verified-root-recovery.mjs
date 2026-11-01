const hermite=(a,b,v,w,u,d)=>{const h=2*u*u*u-3*u*u+1,j=u*u*u-2*u*u+u,k=-2*u*u*u+3*u*u,l=u*u*u-u*u;return{x:h*a.x+j*d*v.x+k*b.x+l*d*w.x,z:h*a.z+j*d*v.z+k*b.z+l*d*w.z}};
/** Remove a fitted body's return detour, never slow it away from its rolling
 * ball. Every candidate keeps the next contact's position/time and must retain
 * the existing control distance. Existing curves win when no safe fit exists. */
export function boundVerifiedRecovery(path,events,{breaks=[],ballAt,ownedAt=()=>false}={}){
 const contacts=events.filter(e=>!e.disabled&&!(e.firstTime&&e.kind==='recebe')&&['recebe','toque','carry','defende'].includes(e.kind)).sort((a,b)=>a.t-b.t),spans=[];
 const velocity=t=>{const h=.001,a=path.sample(t-h),b=path.sample(t+h);return{x:(b.x-a.x)/(2*h),z:(b.z-a.z)/(2*h)}};
 const assess=(sample,start,end)=>{let peak=0,maxGap=0,totalGap=0,n=0;const steps=Math.max(100,Math.ceil((end-start)*120));
  for(let i=0;i<=steps;i++){const t=start+(end-start)*i/steps,h=.0005,a=sample(t-h),b=sample(t+h);peak=Math.max(peak,Math.hypot(b.x-a.x,b.z-a.z)/(2*h));if(ballAt&&ownedAt(t)){const p=sample(t),ball=ballAt(t),gap=Math.hypot(p.x-ball.x,p.z-ball.z);maxGap=Math.max(maxGap,gap);totalGap+=gap;n++}}
  return{peak,maxGap,meanGap:n?totalGap/n:0};
 };
 for(let i=0;i<contacts.length;i++){
  const e=contacts[i];if(!e.verifiedGroundTouch)continue;
  const start=e.t;let end=Math.min(start+1.3,contacts[i+1]?.t??Infinity);
  // Do not fit a carrying route toward an unrelated tactical anchor after
  // possession ends. Rejoin at the last owned frame, without moving that edge.
  if(ownedAt(start+.001))for(let t=start+.3;t<end;t+=1/60)if(!ownedAt(t)){end=Math.max(start+.26,t-1/60);break}
  const duration=end-start;
  if(duration<=.25||breaks.some(b=>b.before>=start&&b.after<=end))continue;
  const before=assess(path.sample,start,end);if(before.peak<=10.5)continue;
  const from=path.sample(start),to=path.sample(end),v=velocity(start),w=velocity(end),chord={x:(to.x-from.x)/duration,z:(to.z-from.z)/duration};let best=null;
  const candidates=[];
  for(const blend of [0,.25,.5,.75,1]){
   const tangent=p=>({x:p.x*(1-blend)+chord.x*blend,z:p.z*(1-blend)+chord.z*blend}),v0=tangent(v),v1=tangent(w);
   candidates.push({blend,method:'contact-constrained-shortcut',sample:t=>t<start||t>end?path.sample(t):hermite(from,to,v0,v1,(t-start)/duration,duration)});
  }
  if(ballAt){const a=ballAt(start),b=ballAt(end),a1=ballAt(start+.001),b0=ballAt(end-.001),off0={x:from.x-a.x,z:from.z-a.z},off1={x:to.x-b.x,z:to.z-b.z},dv={x:v.x-(a1.x-a.x)/.001,z:v.z-(a1.z-a.z)/.001},dw={x:w.x-(b.x-b0.x)/.001,z:w.z-(b.z-b0.z)/.001};
   for(const blend of [0,.5,1])candidates.push({blend,method:'fixed-ball-relative-curve',sample:t=>{if(t<start||t>end)return path.sample(t);const ball=ballAt(t),off=hermite(off0,off1,{x:dv.x*(1-blend),z:dv.z*(1-blend)},{x:dw.x*(1-blend),z:dw.z*(1-blend)},(t-start)/duration,duration);return{x:ball.x+off.x,z:ball.z+off.z}}});
  }
  for(const {blend,method,sample} of candidates){
   const after=assess(sample,start,end);
   if(after.peak>10.5||after.peak>before.peak*.98||after.maxGap>Math.max(1.1,before.maxGap+.04)||after.meanGap>before.meanGap+.04)continue;
   const cost=after.peak+blend*.35+after.meanGap;if(!best||cost<best.cost)best={sample,after,cost,method};
  }
  if(best)spans.push({start,end,before,after:best.after,sample:best.sample,method:best.method});
 }
 return{...path,diagnostics:{...path.diagnostics,verifiedRecoveries:spans.map(s=>({start:s.start,end:s.end,before:s.before.peak,after:s.after.peak,ownedGapBefore:s.before.maxGap,ownedGapAfter:s.after.maxGap,method:s.method}))},sample:t=>{const span=spans.find(s=>t>=s.start&&t<=s.end);return span?span.sample(t):path.sample(t)}};
}
