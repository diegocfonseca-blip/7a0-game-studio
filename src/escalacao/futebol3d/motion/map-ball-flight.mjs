/** A ground delivery has two fixed contact points from the official sequence.
 * Rolling resistance changes speed, not direction. Never samples a live foot,
 * receiver position or possession flag while the ball is in flight. */
export function groundDelivery(start,end,from,to,delivery={}){
 if(delivery.trajectory==='air')return null;
 const duration=end-start,length=Math.hypot(to.x-from.x,to.z-from.z);
 if(!(duration>0)||length<.01)return null;
 const deceleration=Math.min(1.6,1.8*length/(duration*duration)),speed=length/duration+.5*deceleration*duration;
 return{start,end,from:{...from},to:{...to},duration,length,deceleration,speed};
}
export function sampleGroundDelivery(f,time){
 if(!f||time<f.start||time>f.end)return null;
 const t=time-f.start,u=Math.max(0,Math.min(1,(f.speed*t-.5*f.deceleration*t*t)/f.length));
 return{x:f.from.x+(f.to.x-f.from.x)*u,y:f.from.y+(f.to.y-f.from.y)*u,z:f.from.z+(f.to.z-f.from.z)*u};
}
