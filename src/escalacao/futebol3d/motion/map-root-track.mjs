const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
/** Fit the BODY to precomputed contact poses. Unlike a live attraction, every
 * knot is fixed before playback and no foot can pull the ball toward itself. */
export function rootTrack(knots,time,{approach=1.2,recovery=.7,budget=3}={}){
 let before=null,after=null;for(const p of knots){if(p.t<=time)before=p;else{after=p;break}}
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
