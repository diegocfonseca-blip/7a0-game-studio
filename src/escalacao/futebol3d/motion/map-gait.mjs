import * as T from 'three';

const median=values=>{const s=values.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)]??0};
/** Measure the imported, already retargeted feet in metres. A common left
 * support phase avoids blending a planted leg with a swinging one when the
 * runner changes direction. Dribbling contains TWO strides in its full clip. */
export function measureGait(samples,duration,cycles=1){
 const n=samples.length,step=duration/n,velocities=[],masks=[];
 for(let side=0;side<2;side++){
  const floor=Math.min(...samples.map(s=>s[side][1])),mask=[];
  for(let i=0;i<n;i++){
   const p=samples[i][side],q=samples[(i+n-1)%n][side],v=p.map((x,k)=>(x-q[k])/step);
   const support=p[1]<floor+.03&&Math.abs(v[1])<.5&&Math.hypot(v[0],v[2])>.3;
   mask.push(support);if(support)velocities.push(v);
  }
  // Ignore one/two-sample gaps from foot roll at the seam of a captured cycle.
  for(let i=0;i<n;i++)if(mask[i])for(let gap=1;gap<=3;gap++)if(mask[(i+gap+1)%n]){for(let j=1;j<=gap;j++)mask[(i+j)%n]=true;break}
  masks.push(mask);
 }
 const vx=median(velocities.map(v=>v[0])),vz=median(velocities.map(v=>v[2]));
 const starts=[];for(let i=0;i<n;i++)if(masks[0][i]&&!masks[0][(i+n-1)%n]){let length=1;while(length<n&&masks[0][(i+length)%n])length++;if(length>=4)starts.push({phase:i/n,length})}
 const forward=p=>-p[0]*vx-p[2]*vz;
 const phase=(cycles>1?starts[0]:starts.sort((a,b)=>forward(samples[Math.round(b.phase*n)][0])-forward(samples[Math.round(a.phase*n)][0]))[0])?.phase??0;
 const distance=Math.hypot(vx,vz)*duration/cycles;
 return{distance:T.MathUtils.clamp(distance||2.1,1.2,3.5),phase,cycles,duration,supportSamples:velocities.length,direction:Math.atan2(-vx,-vz)};
}

export function prepareMapGaits(asset,actor,names){
 const feet=['Left','Right'].map(side=>{let bone;actor.root.traverse(b=>{if(b.name==='mixamorig'+side+'ToeBase')bone=b});return bone});
 const result={},point=new T.Vector3();
 for(const name of names){
  const action=actor.acao(name);action.reset().play();action.timeScale=0;action.setEffectiveWeight(1);const duration=asset.clips.get(name).duration,samples=[];
  for(let i=0;i<120;i++){action.time=duration*i/120;actor.mixer.update(0);actor.holder.updateMatrixWorld(true);samples.push(feet.map(b=>b.getWorldPosition(point).toArray()))}
  result[name]=measureGait(samples,duration,name==='conduz'?2:1);action.stop();
 }
 return result;
}
export const gaitTime=(gait,phase)=>((phase/gait.cycles+gait.phase)%1)*gait.duration;
