const clamp=x=>Math.max(0,Math.min(1,x));
export const easedBlend=x=>{x=clamp(x);return x*x*(3-2*x)};
/** Preserve full captured contact pose, ease both boundaries into locomotion. */
export function contactBlend(time,duration,touch,blendIn=.12){
 if(time<0||time>duration)return 0;
 const enter=Math.min(blendIn,Math.max(.015,touch-.025));
 const follow=Math.min(.12,Math.max(0,(duration-touch)*.3));
 const exitStart=Math.min(duration,touch+follow);
 return Math.min(easedBlend(time/enter),1-easedBlend((time-exitStart)/Math.max(.015,duration-exitStart)));
}
