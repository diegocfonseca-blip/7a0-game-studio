// Generated from scripts/animation-lab/facing-track.mjs. Repackage after editing source.
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
// A presentation curve baked from source directions, capped at the existing
// locomotion turn rate. Sampling is independent of FPS, pauses or seeks.
export class FacingTrack{
 constructor(record,{locomotionAlignment=false}={}){this.tracks=new Map();const previous=new Map();
  for(const frame of record.frames)for(const pose of frame.poses){
   const key=record.actors[pose[0]].key,last=previous.get(key),dt=last?frame.seconds-last.time:0;
   const rate=locomotionAlignment?(pose[4]>=1.5?8:pose[4]>=.15?5:3):3;
   const heading=last?last.heading+Math.max(-rate*dt,Math.min(rate*dt,angle(pose[3]-last.heading))):pose[3];
   const sample={time:frame.seconds,heading};if(!this.tracks.has(key))this.tracks.set(key,[]);this.tracks.get(key).push(sample);previous.set(key,sample);
  }
 }
 sample(key,time){const points=this.tracks.get(key);if(!points)throw Error('Atleta sem curva de orientação: '+key);
  let lo=0,hi=points.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(points[mid].time<=time)lo=mid;else hi=mid-1;}
  const a=points[lo],b=points[Math.min(lo+1,points.length-1)],q=b.time>a.time?Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time))):0;return a.heading+(b.heading-a.heading)*q;
 }
}
const cache=new WeakMap();export function facingFor(timeline){if(!cache.has(timeline))cache.set(timeline,new FacingTrack(timeline.record,{locomotionAlignment:true}));return cache.get(timeline);}
