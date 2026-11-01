const smooth=(x,a,b)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
/** A fully faded action must not retain a body-facing lock while the player
 * resumes his tactical run. Protect preparation, impact and the first 120 ms
 * of follow-through; release recovery in step with the displayed clip. */
export function actionTravelFreedom({speed,travel,intent,phase,elapsed,weight=1}){
 const fast=smooth(speed,3.6,6)*smooth(Math.abs(angle(travel-intent)),.5,1.6)*smooth(Math.abs(elapsed),.09,.32);
 const recovery=phase==='recovery'?smooth(elapsed,.12,.4)*(1-Math.max(0,Math.min(1,weight)))*smooth(speed,1.7,3.5):0;
 return Math.max(fast,recovery);
}
