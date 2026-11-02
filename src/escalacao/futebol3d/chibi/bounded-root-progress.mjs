/** Redistribute progress along the SAME approach curve. End positions, end
 * velocities and the official impact clock remain fixed. A zero-integral
 * density slows excessive middle speeds without moving a contact or the ball. */
export function boundedRootProgress(speed,{duration,limit=9,samples=256}={}){
 if(!(duration>.45))return null;
 const values=Array.from({length:samples+1},(_,i)=>Math.max(0,speed(i/samples))),peak=Math.max(...values);
 if(peak<=limit)return null;
 const envelope=values.map((_,i)=>Math.sin(Math.PI*i/samples)**2),sum=xs=>xs.reduce((a,x,i)=>a+x*((i===0||i===samples)? .5:1),0)/samples;
 const mean=sum(values),center=sum(values.map((x,i)=>x*envelope[i]))/sum(envelope);
 if(mean<1e-8)return null;
 let best=null;
 for(let alpha=.05;alpha<=3;alpha+=.05){
  const weights=values.map((v,i)=>1+alpha*envelope[i]*(v-center)/mean);
  if(Math.min(...weights)<.15)continue;
  const normal=sum(weights),newPeak=Math.max(...values.map((v,i)=>v*normal/weights[i]));
  if(newPeak>=(best?.peak??peak)*.999999)continue;
  best={weights,normal,peak:newPeak};
 }
 if(!best||best.peak>peak*.98)return null;
 const times=[0];for(let i=1;i<=samples;i++)times.push(times.at(-1)+(best.weights[i-1]+best.weights[i])/(2*samples*best.normal));times[samples]=1;
 return{before:peak,after:best.peak,sample:t=>{
  if(t<=0||t>=1)return Math.max(0,Math.min(1,t));
  let lo=0,hi=samples;while(hi-lo>1){const m=(lo+hi)>>1;if(times[m]<=t)lo=m;else hi=m}
  return(lo+(t-times[lo])/(times[hi]-times[lo]))/samples;
 }};
}
