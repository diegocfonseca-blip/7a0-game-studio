const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export function locomotionWeights(speed){const moving=smooth((speed-.06)/.65),run=smooth((speed-1.7)/1.8),sprint=smooth((speed-5.6)/1.4);return{Idle_Loop:1-moving,Walk_Loop:moving*(1-run),Jog_Fwd_Loop:moving*run*(1-sprint),Sprint_Loop:moving*run*sprint};}
const curves=new WeakMap();
/** Arc-length clock derived from backwards grounded-vertex speeds already
 * measured on the imported clip. Slow the clip in stance instead of skating
 * a planted boot backwards. No vertices, limb lengths or source paths change. */
export function gaitCurve(cal){
 if(curves.has(cal))return curves.get(cal);
 const n=cal.phaseSpeeds?.length??0;if(!n)return null;
 const speeds=cal.phaseSpeeds.map(v=>clamp(v,cal.referenceSpeed*.45,cal.referenceSpeed*2.5)),filtered=speeds.map((_,i)=>{let sum=0;for(let k=-3;k<=3;k++)sum+=speeds[(i+k+n)%n];return sum/7}),arc=[0];
 for(let i=0;i<n;i++)arc.push(arc[i]+filtered[i]*cal.duration/n);
 const length=arc[n],offsetPhase=((cal.phaseOffset??0)%1+1)%1,oi=offsetPhase*n,index=Math.floor(oi),offset=arc[index]+(arc[index+1]-arc[index])*(oi-index);
 const curve={length,phase(cycles){const distance=((cycles*length+offset)%length+length)%length;let low=0,high=n;while(high-low>1){const middle=(low+high)>>1;if(arc[middle]<=distance)low=middle;else high=middle}return(low+(distance-arc[low])/(arc[high]-arc[low]))/n;}};curves.set(cal,curve);return curve;
}
