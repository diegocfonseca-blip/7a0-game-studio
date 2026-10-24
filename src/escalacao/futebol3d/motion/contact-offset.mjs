import {Vector3} from 'three';

/** Small presentation correction with bounded speed AND acceleration. The
 * release envelope is applied separately, so contact endpoints remain exact. */
export class ContactOffset{
 constructor(){this.position=new Vector3();this.velocity=new Vector3();}
 step(target,dt){
  if(!(dt>0))return this.position;
  const steps=Math.ceil(dt*120),h=dt/steps;
  for(let i=0;i<steps;i++){
   const acceleration=target.clone().sub(this.position).multiplyScalar(400).addScaledVector(this.velocity,-40).clampLength(0,18);
   this.velocity.addScaledVector(acceleration,h).clampLength(0,1.8);
   this.position.addScaledVector(this.velocity,h);
   if(this.position.length()>.32){const normal=this.position.clone().normalize();this.position.copy(normal).multiplyScalar(.32);this.velocity.addScaledVector(normal,-Math.max(0,this.velocity.dot(normal)));}
  }
  return this.position;
 }
}
