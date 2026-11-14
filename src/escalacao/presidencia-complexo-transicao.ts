import {MathUtils,Vector3,type PerspectiveCamera} from 'three'

type PoseMapa={position:Vector3;target:Vector3;fov:number}
/** Movimento decorativo da câmera, separado do relógio do jogo e dos saves.
 * Usa o laço de desenho já existente e cede imediatamente ao gesto do usuário. */
export function criarTransicaoCameraMapa(camera:PerspectiveCamera,target:Vector3){
 let flight:{from:PoseMapa;to:PoseMapa;start:number;duration:number}|null=null
 const capture=():PoseMapa=>({position:camera.position.clone(),target:target.clone(),fov:camera.fov})
 const restore=(pose:PoseMapa)=>{
  camera.position.copy(pose.position);target.copy(pose.target);camera.fov=pose.fov
  camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld()
 }
 const update=(now:number)=>{
  if(!flight)return
  const t=MathUtils.clamp((now-flight.start)/flight.duration,0,1),ease=t*t*t*(t*(t*6-15)+10)
  camera.position.lerpVectors(flight.from.position,flight.to.position,ease)
  target.lerpVectors(flight.from.target,flight.to.target,ease)
  camera.fov=MathUtils.lerp(flight.from.fov,flight.to.fov,ease)
  camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld()
  if(t===1)flight=null
 }
 return{capture,restore,update,cancel:()=>{flight=null},get active(){return flight!==null},
  start(to:PoseMapa,now:number,duration=1000){
   flight=null
   if(duration<=0||camera.position.distanceToSquared(to.position)<1e-12&&target.distanceToSquared(to.target)<1e-12&&Math.abs(camera.fov-to.fov)<1e-8){restore(to);return}
   flight={from:capture(),to:{position:to.position.clone(),target:to.target.clone(),fov:to.fov},start:now,duration}
  }
 }
}
