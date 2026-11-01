// Experimental player only. Measure the imported capture rather than assuming
// that one file contains one stride. No rig, bone, ball or source-clock edits.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]??0;

export function capturedGaitCycles(samples){
 const n=samples.length;
 if(n<24)return 1;
 const mean=[0,1].map(s=>[0,1,2].map(k=>samples.reduce((v,p)=>v+p[s][k],0)/n));
 const variance=samples.reduce((v,p)=>v+p.reduce((sum,q,s)=>sum+q.reduce((a,x,k)=>a+(x-mean[s][k])**2,0),0),0)/n;
 if(variance<1e-7)return 1;
 // A different left/right step is NOT a complete cycle. Compare each foot
 // with itself, including height, and reject incidental repeated contacts.
 const candidates=[];
 for(let cycles=2;cycles<=4;cycles++){
  let error=0;
  for(let i=0;i<n;i++){
   const f=(i+n/cycles)%n,j=Math.floor(f),u=f-j;
   for(let side=0;side<2;side++)for(let k=0;k<3;k++){
    const a=samples[j][side][k],b=samples[(j+1)%n][side][k];
    error+=(samples[i][side][k]-(a+(b-a)*u))**2;
   }
  }
  if(error/n/variance<.3)candidates.push({cycles,error:error/n/variance});
 }
 return candidates.sort((a,b)=>a.error-b.error)[0]?.cycles??1;
}

export function measureCapturedGait(samples,duration){
 const n=samples.length,step=duration/n,cycles=capturedGaitCycles(samples),velocities=[],masks=[];
 for(let side=0;side<2;side++){
  const floor=Math.min(...samples.map(s=>s[side][1])),mask=[];
  for(let i=0;i<n;i++){
   const p=samples[i][side],q=samples[(i+n-1)%n][side],v=p.map((x,k)=>(x-q[k])/step);
   const support=p[1]<floor+.03&&Math.abs(v[1])<.5&&Math.hypot(v[0],v[2])>.3;
   mask.push(support);if(support)velocities.push(v);
  }
  for(let i=0;i<n;i++)if(mask[i])for(let gap=1;gap<=3;gap++)if(mask[(i+gap+1)%n]){for(let j=1;j<=gap;j++)mask[(i+j)%n]=true;break}
  masks.push(mask);
 }
 const vx=median(velocities.map(v=>v[0])),vz=median(velocities.map(v=>v[2])),starts=[];
 for(let i=0;i<n;i++)if(masks[0][i]&&!masks[0][(i+n-1)%n]){
  let length=1;while(length<n&&masks[0][(i+length)%n])length++;
  if(length>=4)starts.push({phase:i/n,length});
 }
 // The most forward left support is a common phase for ALL captures, even
 // those containing multiple cycles. Foot roll can split a support island.
 const forward=p=>-p[0]*vx-p[2]*vz;
 const phase=starts.sort((a,b)=>forward(samples[Math.round(b.phase*n)][0])-forward(samples[Math.round(a.phase*n)][0]))[0]?.phase??0;
 const rawDistance=Math.hypot(vx,vz)*duration/cycles;
 return{distance:clamp(rawDistance||1.5,.35,4),rawDistance,phase,cycles,duration,supportSamples:velocities.length,direction:Math.atan2(-vx,-vz)};
}

export function prepareMapGaits(asset,actor,names){
 const feet=['Left','Right'].map(side=>{let bone;actor.root.traverse(b=>{if(b.name==='mixamorig'+side+'ToeBase')bone=b});return bone});
 const result={},point=actor.holder.position.clone();
 for(const name of names){
  const action=actor.acao(name);action.reset().play();action.timeScale=0;action.setEffectiveWeight(1);
  const duration=asset.clips.get(name).duration,samples=[];
  for(let i=0;i<240;i++){
   action.time=duration*i/240;actor.mixer.update(0);actor.holder.updateMatrixWorld(true);
   samples.push(feet.map(b=>b.getWorldPosition(point).toArray()));
  }
  result[name]=measureCapturedGait(samples,duration);action.stop();
 }
 return result;
}
export const gaitTime=(gait,phase)=>((phase/gait.cycles+gait.phase)%1)*gait.duration;
