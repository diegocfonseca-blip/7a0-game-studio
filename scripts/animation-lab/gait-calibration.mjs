// Derive cadence and right-foot phase from acquired cycles. This only changes
// how AnimationMixer samples existing clips; it never creates joint motion.
export function calibrateGait(clip,sample){
 const duration=clip.duration,count=120,dt=duration/count,frames=[];
 for(let i=0;i<count;i++)frames.push({time:i*dt,...sample(i*dt)});
 const speeds=[],byPhase=Array.from({length:count},()=>[]);
 for(let i=1;i<frames.length;i++)for(const side of ['left','right']){
  const now=frames[i][side],before=frames[i-1][side],backward=(before.z-now.z)/dt;
  if(now.points&&before.points){
   for(let k=0;k<now.points.length;k++){
    const p=now.points[k],q=before.points[k],v=(q[2]-p[2])/dt;
    if(p[1]<.008&&q[1]<.008&&v>.05){speeds.push(v);byPhase[i].push(v);}
   }
  }
  else if(now.height<.018&&before.height<.018&&backward>.05)speeds.push(backward);
 }
 speeds.sort((a,b)=>a-b);const referenceSpeed=speeds[Math.floor(speeds.length/2)];
 if(!Number.isFinite(referenceSpeed)||referenceSpeed<.1||referenceSpeed>15)throw Error('Ciclo sem apoio suficiente para calibrar: '+clip.name);
 const stance=frames.filter(f=>f.right.height<.018).sort((a,b)=>b.right.z-a.right.z);
 if(!stance.length)throw Error('Ciclo sem apoio direito: '+clip.name);
 const offset=stance[0].time/duration;
 const phaseSpeeds=byPhase.map((values,index)=>{const neighbors=[];for(let n=-2;n<=2;n++)neighbors.push(...byPhase[(index+n+count)%count]);neighbors.sort((a,b)=>a-b);return neighbors.length?neighbors[Math.floor(neighbors.length/2)]:referenceSpeed;});
 return {clip:clip.name,duration,referenceSpeed,strideLength:referenceSpeed*duration,phaseOffset:offset,phaseSpeeds,stanceSamples:speeds.length,method:'median backward grounded skin-vertex speed; right-foot forward ground sample'};
}
