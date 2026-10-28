const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
/** Fit the BODY to precomputed contact poses. Unlike a live attraction, every
 * knot is fixed before playback and no foot can pull the ball toward itself. */
export function rootTrack(knots,time,{approach=1.2,recovery=.7,budget=3}={}){
 let before=null,after=null;for(const p of knots){if(p.t<=time)before=p;else{after=p;break}}
 approach=after?.approach??approach;
 let x=0,z=0;
 if(before&&after&&after.t-before.t<=approach+recovery){const u=smooth((time-before.t)/(after.t-before.t));x=before.x+(after.x-before.x)*u;z=before.z+(after.z-before.z)*u}
 else if(after&&after.t-time<approach){const u=smooth(1-(after.t-time)/approach);x=after.x*u;z=after.z*u}
 else if(before&&time-before.t<recovery){const u=1-smooth((time-before.t)/recovery);x=before.x*u;z=before.z*u}
 budget=Math.max(budget,before?.budget??0,after?.budget??0);const d=Math.hypot(x,z);if(d>budget){x*=budget/d;z*=budget/d}return{x,z};
}

/** During a control the root follows two fixed world contacts. A tactical
 * anchor moving away cannot pull the receiver away from his first touch. */
export function controlledRoot(spans,time,base,{budget=3}={}){
 const span=spans.find(s=>time>=s.start&&time<=s.end);if(!span||!base)return null;
 const u=smooth((time-span.start)/(span.end-span.start)),x=span.from.x+(span.to.x-span.from.x)*u-base.x,z=span.from.z+(span.to.z-span.from.z)*u-base.z,d=Math.hypot(x,z),k=d>budget?budget/d:1;
 return{x:x*k,z:z*k};
}

const hermite=(p,q,v,w,u,dt)=>{
 const a=2*u*u*u-3*u*u+1,b=u*u*u-2*u*u+u,c=-2*u*u*u+3*u*u,d=u*u*u-u*u;
 return{x:a*p.x+b*dt*v.x+c*q.x+d*dt*w.x,z:a*p.z+b*dt*v.z+c*q.z+d*dt*w.z};
};
/** The old switch to an absolute control path preserved positions but dropped
 * world velocity to zero in one frame. Stitch both sides with matching world
 * tangents. Contacts and the ball path remain fixed, including on seek/replay. */
export function prepareBodyTrack(knots,controls,source,{approach=1.6,recovery=.4,budget=3}={}){
 const native=time=>{const p=source(time),o=rootTrack(knots,time);return{x:p.x+o.x,z:p.z+o.z}};
 const velocity=time=>{const a=native(time-.001),b=native(time+.001);return{x:(b.x-a.x)/.002,z:(b.z-a.z)/.002}};
 const joins=[];
 for(const span of controls){
  const before=knots.findLast(k=>k.t<span.start-1e-6),after=knots.find(k=>k.t>span.end+1e-6);
  if(!controls.some(s=>s!==span&&Math.abs(s.end-span.start)<1e-6)){
   const gap=before?span.start-before.t:Infinity;
   const dt=Math.min(approach,before?Math.max(gap*.45,gap-.45):approach),start=span.start-dt;
   if(dt>1e-4)joins.push({start,end:span.start,from:native(start),to:span.from,v:velocity(start),w:{x:0,z:0}});
  }
  if(!controls.some(s=>s!==span&&Math.abs(s.start-span.end)<1e-6)){
   const recover=span.recovery??recovery,dt=Math.min(recover,after?(after.t-span.end)*.45:recover),end=span.end+dt;
   if(dt>1e-4)joins.push({start:span.end,end,from:span.to,to:native(end),v:{x:0,z:0},w:velocity(end)});
  }
 }
 for(const join of joins){const a=source(join.start),b=source(join.end);join.softLimit=Math.min(budget,Math.max(budget-.6,Math.hypot(join.from.x-a.x,join.from.z-a.z)+.001,Math.hypot(join.to.x-b.x,join.to.z-b.z)+.001))}
 return time=>{
  const base=source(time),controlled=controlledRoot(controls,time,base,{budget});if(controlled)return controlled;
  const join=joins.find(s=>time>s.start&&time<s.end);if(!join)return rootTrack(knots,time);
  const p=hermite(join.from,join.to,join.v,join.w,(time-join.start)/(join.end-join.start),join.end-join.start),x=p.x-base.x,z=p.z-base.z,d=Math.hypot(x,z),width=budget-join.softLimit;
  // A hard radial clamp creates a new velocity kink as the path reaches its
  // reach budget. Saturate with a matching tangent, outside both fixed ends.
  const distance=d>join.softLimit&&width>1e-4?join.softLimit+width*(1-Math.exp(-(d-join.softLimit)/width)):Math.min(d,budget),k=d>1e-9?distance/d:1;
  return{x:x*k,z:z*k};
 };
}
