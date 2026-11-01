/** Read-only verification of an actual source dribbling impulse. A changed
 * velocity alone is insufficient: settling/protection also changes velocity.
 * The owned rolling branch first integrates friction, THEN applies a foot
 * impulse. Require that exact integration signature before calling it a touch.
 */
export function sourceGroundTouch(before,after,{friction=2.3}={}){
 if(!before||!after||!before.owner||before.owner!==after.owner||after.keeper||before.restart||after.restart)return null;
 const dt=after.t-before.t,a=before.ball,b=after.ball;
 if(!(dt>.049&&dt<.051)||a.h>1e-7||b.h>1e-7||Math.abs(a.vh)>1e-7||Math.abs(b.vh)>1e-7)return null;
 if(!(after.ownedFor>.37)||!(after.speed>=3.2))return null;
 const speed=Math.hypot(a.vx,a.vy),scale=speed?Math.max(0,speed-(friction+.07*speed)*dt)/speed:0;
 const vx=a.vx*scale,vy=a.vy*scale,error=Math.hypot(b.x-a.x-vx*dt,b.y-a.y-vy*dt),impulse=Math.hypot(b.vx-vx,b.vy-vy);
 if(error>1e-6||impulse<.10)return null;
 return{t:after.t,key:after.owner,ball:{x:b.y-52.5,y:.11,z:b.x-34},velocity:{x:b.vy,z:b.vx},incoming:{x:vy,z:vx},integrationError:error,impulse};
}
