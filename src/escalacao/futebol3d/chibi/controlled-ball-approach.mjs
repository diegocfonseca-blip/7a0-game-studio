const hermite=(a,b,v,w,u,d)=>{const h=2*u*u*u-3*u*u+1,j=u*u*u-2*u*u+u,k=-2*u*u*u+3*u*u,l=u*u*u-u*u;return{x:h*a.x+j*d*v.x+k*b.x+l*d*w.x,z:h*a.z+j*d*v.z+k*b.z+l*d*w.z}};
const delta=(a,b,d)=>({x:(b.x-a.x)/d,z:(b.z-a.z)/d});
const add=(a,b)=>({x:a.x+b.x,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,z:a.z-b.z});
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const scalar=(a,b,v,w,u,d)=>hermite({x:a,z:0},{x:b,z:0},{x:v,z:0},{x:w,z:0},u,d).x;

/** Keep a carrier behind the actual rolling ball until he pivots for his
 * calibrated strike. A sparse stopped-root fit could run past the ball and
 * wait at the future kick point. Only an existing, uninterrupted two-contact
 * control may use this repair. No ball target, event, possession or IK edit. */
export function prepareControlledApproach(path,events,controls,{ballAt,ownedAt,breaks=[]}={}){
 if(!ballAt||!ownedAt)return path;
 const spans=[],decisions=[];
 const derivative=(fn,t)=>delta(fn(t-.0005),fn(t+.0005),.001);
 const assess=(fn,start,end)=>{
  let maxGap=0,peak=0,maxOffset=0,behind=0;
  for(let i=0,n=Math.ceil((end-start)*120);i<=n;i++){
   const t=start+(end-start)*i/n,p=fn(t),b=ballAt(t),v=derivative(fn,t),d=Math.hypot(b.x-p.x,b.z-p.z),speed=Math.hypot(v.x,v.z);
   maxGap=Math.max(maxGap,d);peak=Math.max(peak,speed);maxOffset=Math.max(maxOffset,Math.hypot(p.x-path.sample(t).x,p.z-path.sample(t).z));
   if(d>.75&&speed>1.5&&((b.x-p.x)*v.x+(b.z-p.z)*v.z)/(d*speed)<-.5)behind+=(end-start)/n;
  }
  return{maxGap,peak,maxOffset,behindSeconds:behind};
 };
 for(const control of controls.filter(c=>!c.loose)){
  const start=control.start,end=control.end,d=end-start;
  const from=events.find(e=>!e.disabled&&Math.abs(e.t-start)<1e-6),to=events.find(e=>!e.disabled&&e.kind==='toque'&&Math.abs(e.t-end)<1e-6);
  if(d<.5||d>1.9||!from||!to||!Number.isFinite(to.mira)||to.hands||to.cab||from.hands||from.goleiro||from.pickup||breaks.some(b=>b.before>=start&&b.after<=end))continue;
  let live=true;for(let t=start+.015;t<end-.005;t+=1/60){const b=ballAt(t);if(!ownedAt(t)||!b||b.y>.24){live=false;break}}if(!live)continue;
  const before=assess(path.sample,start,end);
  if(before.maxGap<.85||before.behindSeconds<.10)continue;
  const p0=path.sample(start),p1=path.sample(end),b0=ballAt(start),v0=derivative(path.sample,start),bv0=derivative(ballAt,start);
  const enter=start+Math.min(.25,d*.26),plant=end-.04,pivot=Math.max(enter+.02,Math.min(plant-.12,(to.start??end-.35)-Math.min(.15,d*.15)));
  if(pivot>=plant||enter>=pivot)continue;
  const bv=derivative(ballAt,(enter+pivot)*.5),speed=Math.hypot(bv.x,bv.z);if(speed<.5)continue;
  let best=null;
  for(const clearance of [.45,.55,.65]){
   const off0=sub(p0,b0),follow={x:-bv.x/speed*clearance,z:-bv.z/speed*clearance},off1=sub(p1,ballAt(plant)),bv1=derivative(ballAt,plant);
   const theta0=Math.atan2(bv.x,bv.z),r1=Math.hypot(off1.x,off1.z),theta1=theta0+angle(Math.atan2(-off1.x,-off1.z)-theta0);
   if(r1<.1)continue;
   const endRadial=-(off1.x*bv1.x+off1.z*bv1.z)/r1,endAngular=(-off1.z*bv1.x+off1.x*bv1.z)/(r1*r1);
   const facing=t=>theta0+angle(to.mira-theta0)*ease((t-pivot)/(plant-pivot));
   const fn=t=>{
    if(t<=start||t>=end)return path.sample(t);
    if(t>=plant)return{...p1};
    let off;
    if(t<enter)off=hermite(off0,follow,sub(v0,bv0),{x:0,z:0},(t-start)/(enter-start),enter-start);
    else if(t<=pivot)off=follow;
    else{
     // Walk around the ball on an arc while opening the body. A chord can
     // cross underneath the ball and leave it behind the player's shoulders.
     const u=(t-pivot)/(plant-pivot),radius=scalar(clearance,r1,0,endRadial,u,plant-pivot),theta=scalar(theta0,theta1,0,endAngular,u,plant-pivot);
     off={x:-Math.sin(theta)*radius,z:-Math.cos(theta)*radius};
    }
    return add(ballAt(t),off);
   };
   const after=assess(fn,start,end);
   let maxFacing=0;for(let t=pivot;t<end;t+=1/120){const p=fn(t),b=ballAt(t);maxFacing=Math.max(maxFacing,Math.abs(angle(Math.atan2(b.x-p.x,b.z-p.z)-facing(t))))}
   after.maxFacingDegrees=maxFacing*180/Math.PI;
   if(after.maxGap>.85||after.peak>Math.max(9.5,before.peak+.01)||after.maxOffset>2.25||after.behindSeconds>=before.behindSeconds*.65||maxFacing>Math.PI*.47)continue;
   const cost=after.behindSeconds*6+after.maxGap+after.peak*.04;
   if(!best||cost<best.cost)best={start,end,pivot,plant,clearance,sample:fn,facing,contactHeading:to.mira,before,after,cost};
  }
  if(best)spans.push(best);
  decisions.push({start,end,applied:!!best,before,after:best?.after,pivot:best?.pivot,plant:best?.plant,clearance:best?.clearance});
 }
 return{...path,diagnostics:{...path.diagnostics,controlledApproaches:decisions},controlledFacing:t=>{const span=spans.find(s=>t>=s.pivot&&t<=s.end);return span?{heading:span.facing(t),contactAt:span.end,contactHeading:span.contactHeading}:null},sample:t=>{const span=spans.find(s=>t> s.start&&t<s.end);return span?span.sample(t):path.sample(t)}};
}
