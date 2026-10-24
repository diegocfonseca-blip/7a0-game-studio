/** Monotone time warp of an imported capture. The official event, ball and
 * contact marker stay fixed. Endpoints have unit slope; contact has the
 * calibrated swing rate. No pose or skeletal channel is authored here. */
export function strikeClock(plan,time){
 const timing=plan.swingTiming;if(!timing)return{sample:plan.marker+time-plan.time,rate:1};
 const rate=Math.max(1,Math.min(3,timing.rate??1)),delta=time-plan.time;
 const window=Math.min(timing.window??.24,delta<0?plan.time-plan.start:plan.end-plan.time);
 if(window<=0||Math.abs(delta)>=window)return{sample:plan.marker+delta,rate:1};
 const u=Math.abs(delta)/window;
 // f(0)=0, f(1)=1, f'(0)=rate, f'(1)=1.
 const f=(rate-1)*u*u*u+2*(1-rate)*u*u+rate*u;
 const derivative=3*(rate-1)*u*u+4*(1-rate)*u+rate;
 return{sample:plan.marker+Math.sign(delta)*window*f,rate:derivative};
}
