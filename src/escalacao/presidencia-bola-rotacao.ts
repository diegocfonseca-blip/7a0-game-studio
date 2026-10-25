import {Quaternion,Vector3} from 'three'

export const RAIO_BOLA_FUTEBOL_3D=.11
export type PontoRotacaoBola={x:number;y:number;z:number;held?:boolean;/** 🌀 efeito da bola no ar (rad/s de curva do motor): vira rotação em torno do eixo vertical */curl?:number}
/** Visual rotation only. Ground: distance/radius. Flight spin is an estimate
 * from take-off velocity, never a torque supplied to the official engine. */
export class RotacaoBola3D{
 quaternion=new Quaternion()
 private previous:PontoRotacaoBola
 private omega=new Vector3()
 private delta=new Quaternion()
 private radius:number
 constructor(radius:number,point:PontoRotacaoBola){this.radius=radius;if(!(radius>0))throw Error('Raio inválido');this.previous={...point}}
 step(point:PontoRotacaoBola,dt:number){
  if(!Number.isFinite(dt)||dt<0)throw Error('Intervalo inválido')
  if(dt===0)return this.quaternion
  const dx=point.x-this.previous.x,dz=point.z-this.previous.z,distance=Math.hypot(dx,dz),ground=this.previous.y<=this.radius+.004&&point.y<=this.radius+.004
  // Restarts/catches may reposition the official ball instantaneously.
  const teleport=Math.hypot(dx,point.y-this.previous.y,dz)>Math.max(1.2,100*dt)
  if(point.held||teleport)this.omega.set(0,0,0)
  else if(ground)this.omega.set(dz,0,-dx).multiplyScalar(1/(this.radius*dt))
  else if(this.previous.y<=this.radius+.004&&distance>1e-8){
   this.omega.set(dz,0,-dx).multiplyScalar(.35/(this.radius*dt))
   this.omega.clampLength(0,40)
  }
  // 🌀 25/10: a bola com efeito (cruzamento fechando, falta colocada) gira em torno do eixo vertical enquanto voa — é o que se vê
  // na TV: o desenho da bola rodando de lado. O giro visual é ~20× a curva (rad/s), com teto
  if(!ground&&!point.held&&point.curl)this.omega.y=Math.max(-45,Math.min(45,point.curl*20))
  const speed=this.omega.length()
  if(speed>0){this.delta.setFromAxisAngle(this.omega.clone().multiplyScalar(1/speed),speed*dt);this.quaternion.premultiply(this.delta).normalize()}
  this.previous={...point};return this.quaternion
 }
 preview(point:PontoRotacaoBola,dt:number){const q=this.quaternion.clone(),previous=this.previous,omega=this.omega.clone();const result=this.step(point,dt).clone();this.quaternion.copy(q);this.previous=previous;this.omega.copy(omega);return result}
 inspect(){return{quaternion:this.quaternion.toArray(),angularVelocity:this.omega.toArray(),radius:this.radius,flightSpin:'estimated-presentation',affectsPhysics:false}}
}
