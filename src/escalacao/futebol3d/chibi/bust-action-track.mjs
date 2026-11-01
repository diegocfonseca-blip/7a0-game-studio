// Presentation-only orientation for rigid football pieces. No ball/event edits.
const TAU=Math.PI*2,angle=x=>Math.atan2(Math.sin(x),Math.cos(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export function createBustActionTrack(timeline,{captureTiming=false}={}){
 const rate=60,steps=Math.ceil(timeline.duration*rate)+1,base=new Map(),plans=new Map();
 for(const key of timeline.keys){const values=new Float64Array(steps);for(let i=0;i<steps;i++){const p=timeline.sample(i/rate,key).player,desired=p?.heading??values[Math.max(0,i-1)]??0;if(!i)values[i]=desired;else values[i]=values[i-1]+clamp(angle(desired-values[i-1]),-7/rate,7/rate)}base.set(key,values)}
 function locomotion(key,t){const a=base.get(key);if(!a)return 0;const f=clamp(t*rate,0,a.length-1),i=Math.floor(f),j=Math.min(a.length-1,i+1);return a[i]+(a[j]-a[i])*(f-i)}
 for(const key of timeline.keys){const events=timeline.agenda.filter(a=>a.key===key&&!a.disabled&&(a.kind==='toque'||a.kind==='recebe'||a.kind==='defende'||a.verifiedGroundTouch)).sort((a,b)=>a.t-b.t),releases=events.filter(a=>a.kind==='toque'),rows=[];
  for(const event of events){
   const outgoing=event.kind==='toque',nearRelease=releases.find(a=>a.t>=event.t-.01&&a.t-event.t<.42);if(!outgoing&&event.firstTime&&nearRelease&&!event.hands&&!event.pickup&&!event.keeper&&!event.goleiro)continue;
   const dir=Number.isFinite(event.dir)?event.dir:locomotion(key,event.t),delta=Math.abs(angle(dir-locomotion(key,event.t-.5))),duration=clamp(.22+delta/6.5,.30,.78);
   const previousRelease=rows.findLast(a=>a.t<event.t-.001);let start=Math.max(0,event.t-duration,previousRelease?previousRelease.t+.08:0);
   if(captureTiming&&outgoing&&!event.hands&&!event.cab&&Number.isFinite(event.start))start=Math.max(0,Math.min(start,event.start),previousRelease?previousRelease.t+.08:0);
   const nextRelease=releases.find(a=>a.t>event.t+.001);const hold=event.t+(outgoing?.12:.06);let end=event.t+.8;for(let j=0;j<3;j++)end=Math.min(hold+Math.max(.38,Math.abs(angle(locomotion(key,end)-dir))*1.5/6.5),nextRelease?nextRelease.t-.05:Infinity);
   if(start>=event.t)start=Math.max(0,event.t-.05);
   rows.push({id:event.id,key,kind:event.kind,type:event.tipo??event.kind,t:event.t,start,hold,end,dir,from:locomotion(key,start),to:locomotion(key,end)});
  }
  // Each new preparation starts from the already planned preceding pose.
  for(let i=0;i<rows.length;i++){const r=rows[i],prior=rows.slice(0,i).findLast(p=>p.start<=r.start&&p.end>=r.start);if(prior)r.from=apply(prior,r.start)}plans.set(key,rows);
 }
 function apply(p,t){if(t<=p.t)return p.from+angle(p.dir-p.from)*ease((t-p.start)/Math.max(.001,p.t-p.start));if(t<=p.hold)return p.from+angle(p.dir-p.from);return p.dir+angle(p.to-p.dir)*ease((t-p.hold)/Math.max(.001,p.end-p.hold))}
 function sample(key,time){const list=plans.get(key)??[];
  // At impact the outgoing action wins even if a reception window overlaps.
  const contact=list.find(p=>p.kind==='toque'&&Math.abs(time-p.t)<1e-6)??list.find(p=>Math.abs(time-p.t)<1e-6);const active=contact??list.findLast(p=>time>=p.start&&time<=p.end);
  return{heading:active?apply(active,time):locomotion(key,time),phase:!active?'locomotion':time<active.t?'preparation':time<=active.hold?'contact-follow-through':'recovery',action:active?.type,contactAt:active?.t};
 }
 return{sample,plans:[...plans.values()].flat(),locomotion};
}
