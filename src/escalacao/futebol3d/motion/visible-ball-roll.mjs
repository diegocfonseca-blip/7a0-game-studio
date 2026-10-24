import {Quaternion,Vector3} from 'three';

/** Roll along the final visible path, in chronological world-space order.
 * Multiplying an accumulated correction by an accumulated source rotation is
 * not equivalent when their axes change. Flight keeps the source spin delta;
 * no position, impulse, possession or event is changed here. */
export class VisibleBallRoll{
 constructor(radius=.11){this.radius=radius;this.reset();}
 reset(){this.previous=null;this.rotation=new Quaternion();}
 sample(time,point,sourceRotation){
  const source=new Quaternion().fromArray(sourceRotation??[0,0,0,1]),old=this.previous,dt=old?time-old.time:0;
  if(!old||dt<0||dt>.2)this.rotation.copy(source);
  else if(dt>0){
   const d=new Vector3(point.x-old.point.x,point.y-old.point.y,point.z-old.point.z);
   if(d.length()>Math.max(1.2,100*dt))this.rotation.copy(source);
   else if(point.y<=this.radius+.004&&old.point.y<=this.radius+.004){
    const axis=new Vector3(d.z,0,-d.x),distance=axis.length();
    if(distance>1e-10)this.rotation.premultiply(new Quaternion().setFromAxisAngle(axis.multiplyScalar(1/distance),distance/this.radius)).normalize();
   }else this.rotation.premultiply(source.clone().multiply(old.source.clone().invert())).normalize();
  }
  this.previous={time,point:{x:point.x,y:point.y,z:point.z},source};
  return this.rotation.toArray();
 }
}
